import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { getReservas, Reserva } from './db';

export interface SlotDisponibilidad {
  diaNumero: number;
  disponible: boolean;
  horarioPermitido?: string;
  motivo?: string;
  fechaStr?: string;
  bloquesOcupados?: string[];
}

export const format12h = (timeStr: string): string => {
  if (!timeStr) return '';
  const clean = timeStr.trim().toUpperCase();
  if (clean.includes('AM') || clean.includes('PM')) {
    return timeStr;
  }
  const [hStr, mStr] = clean.split(':');
  const h = parseInt(hStr, 10);
  if (isNaN(h)) return timeStr;
  const isPm = h >= 12;
  const displayH = h % 12 === 0 ? 12 : h % 12;
  const ampm = isPm ? 'PM' : 'AM';
  const m = mStr ? mStr.split(' ')[0] : '00';
  return `${String(displayH).padStart(2, '0')}:${m} ${ampm}`;
};

export const formatRangeTo12h = (rangeStr: string | undefined): string => {
  if (!rangeStr) return '';
  const parts = rangeStr.split('-');
  if (parts.length === 2) {
    return `${format12h(parts[0].trim())} - ${format12h(parts[1].trim())}`;
  }
  return format12h(rangeStr.trim());
};

const STORAGE_KEY_DISPONIBILIDAD = 'la_facultad_disponibilidad_personalizada_db';
export const DISPONIBILIDAD_UPDATED_EVENT = 'la_facultad_disponibilidad_updated';

export type DisponibilidadCustomMap = Record<
  string,
  { disponible: boolean; horarioPermitido?: string; motivo?: string }
>;

let disponibilidadListenerReady = false;
function ensureDisponibilidadSync() {
  if (disponibilidadListenerReady || typeof window === 'undefined') return;
  disponibilidadListenerReady = true;
  try {
    onSnapshot(
      doc(db, 'studio_config', 'disponibilidad'),
      (snap) => {
        if (snap.exists()) {
          const data = snap.data() as { dias?: DisponibilidadCustomMap };
          if (data?.dias && typeof data.dias === 'object') {
            localStorage.setItem(STORAGE_KEY_DISPONIBILIDAD, JSON.stringify(data.dias));
            window.dispatchEvent(new Event(DISPONIBILIDAD_UPDATED_EVENT));
          }
        }
      },
      (err) => {
        console.warn('Firestore disponibilidad sync notice:', err.message);
      }
    );
  } catch (err) {
    console.warn('Disponibilidad sync init notice:', err);
  }
}

export function obtenerTodasDisponibilidades(): DisponibilidadCustomMap {
  ensureDisponibilidadSync();
  try {
    const data = localStorage.getItem(STORAGE_KEY_DISPONIBILIDAD);
    return data ? JSON.parse(data) : {};
  } catch {
    return {};
  }
}

function persistirDisponibilidades(disponibilidades: DisponibilidadCustomMap) {
  localStorage.setItem(STORAGE_KEY_DISPONIBILIDAD, JSON.stringify(disponibilidades));
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(DISPONIBILIDAD_UPDATED_EVENT));
  }
  setDoc(doc(db, 'studio_config', 'disponibilidad'), { dias: disponibilidades }, { merge: false }).catch(
    (err) => {
      console.warn('Firestore guardarDisponibilidadDia notice:', err);
    }
  );
}

export function guardarDisponibilidadDia(
  fechaStr: string,
  disponible: boolean,
  horarioPermitido?: string,
  motivo?: string
) {
  const disponibilidades = obtenerTodasDisponibilidades();
  disponibilidades[fechaStr] = {
    disponible,
    horarioPermitido: disponible ? horarioPermitido : undefined,
    motivo: motivo || (disponible ? 'Día Liberado por Admin' : 'Cerrado / No disponible'),
  };
  persistirDisponibilidades(disponibilidades);
}

export function eliminarDisponibilidadDia(fechaStr: string) {
  const disponibilidades = obtenerTodasDisponibilidades();
  delete disponibilidades[fechaStr];
  persistirDisponibilidades(disponibilidades);
}

/** Determina si una reserva bloquea activamente su turno (confirmada, en proceso o hold < 30 min) */
export function isReservaBlockingSlot(r: Reserva): boolean {
  if (r.estado === 'Cancelada' || r.estado === 'Liberada') return false;
  if (r.estado === 'Confirmada' || r.estado === 'En Proceso' || r.estado === 'Completada') {
    return true;
  }
  // Si está Pendiente con comprobante ATH subido, también mantiene el bloqueo
  if (r.comprobanteAthUrl || r.comprobanteNumReferencia) return true;
  // Si está Pendiente sin comprobante, bloquea solo durante el hold de 30 minutos
  const creadoEn = r.creadoEn || 0;
  const thirtyMinMs = 30 * 60 * 1000;
  return Date.now() - creadoEn < thirtyMinMs;
}

export function obtenerBloquesOcupadosPorFecha(fechaStr: string): string[] {
  const reservas = getReservas();
  const ocupados: string[] = [];
  for (const r of reservas) {
    if (!isReservaBlockingSlot(r)) continue;
    const matchMain = r.fecha === fechaStr;
    const matchBloque = Array.isArray(r.fechasBloque) && r.fechasBloque.includes(fechaStr);
    if (matchMain || matchBloque) {
      if (r.horaInicio) {
        ocupados.push(r.horaInicio);
      }
    }
  }
  return ocupados;
}

export function obtenerDisponibilidadMes(año: number, mes: number): Record<number, SlotDisponibilidad> {
  const disponibilidad: Record<number, SlotDisponibilidad> = {};
  const diasEnMes = new Date(año, mes, 0).getDate();
  const personalizadas = obtenerTodasDisponibilidades();
  const reservasActivas = getReservas().filter(isReservaBlockingSlot);

  for (let dia = 1; dia <= diasEnMes; dia++) {
    const diaStr = String(dia).padStart(2, '0');
    const mesStr = String(mes).padStart(2, '0');
    const fechaStr = `${año}-${mesStr}-${diaStr}`;

    const bloquesOcupados = reservasActivas
      .filter((r) => r.fecha === fechaStr || (Array.isArray(r.fechasBloque) && r.fechasBloque.includes(fechaStr)))
      .map((r) => r.horaInicio)
      .filter(Boolean);

    const ambosBloquesOcupados =
      bloquesOcupados.includes('13:00') && bloquesOcupados.includes('18:00');

    // 1. Configuración personalizada del Admin (prioridad máxima)
    if (personalizadas[fechaStr] !== undefined) {
      const p = personalizadas[fechaStr];
      disponibilidad[dia] = {
        diaNumero: dia,
        disponible: p.disponible && !ambosBloquesOcupados,
        horarioPermitido: p.horarioPermitido,
        motivo: ambosBloquesOcupados
          ? 'Agenda Llena (Ambos bloques reservados)'
          : p.motivo,
        fechaStr,
        bloquesOcupados,
      };
      continue;
    }

    // 2. Regla base semanal + verificación de reservas activas
    const fechaObj = new Date(año, mes - 1, dia);
    const dayOfWeek = fechaObj.getDay(); // 0 = Dom, 1 = Lun, 2 = Mar, 3 = Mié, 4 = Jue, 5 = Vie, 6 = Sáb
    const now = new Date();
    const isPast =
      fechaObj.getTime() < new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

    let disponible = false;
    let horarioPermitido: string | undefined;
    let motivo: string | undefined;

    if (isPast) {
      disponible = false;
      motivo = 'Fecha pasada';
    } else if (dayOfWeek === 0) {
      disponible = false;
      motivo = 'Cerrado por Descanso Operativo';
    } else if (dayOfWeek === 1) {
      disponible = false;
      motivo = 'Mantenimiento & Calibración del Studio';
    } else if (dayOfWeek === 3) {
      disponible = false;
      motivo = 'Día exclusivo de Mezcla & Master en DAW';
    } else if (ambosBloquesOcupados) {
      disponible = false;
      motivo = 'Agenda Llena (Tarde y Noche reservados)';
    } else {
      disponible = true;
      if (bloquesOcupados.includes('13:00')) {
        horarioPermitido = '18:00 - 22:00';
        motivo = 'Disponible Bloque Noche (6:00 PM - 10:00 PM)';
      } else if (bloquesOcupados.includes('18:00')) {
        horarioPermitido = '13:00 - 17:00';
        motivo = 'Disponible Bloque Tarde (1:00 PM - 5:00 PM)';
      } else {
        horarioPermitido = '13:00 - 22:00';
        motivo = 'Turnos Tarde (1-5 PM) y Noche (6-10 PM) disponibles';
      }
    }

    disponibilidad[dia] = {
      diaNumero: dia,
      disponible,
      horarioPermitido,
      motivo,
      fechaStr,
      bloquesOcupados,
    };
  }

  return disponibilidad;
}
