export interface SlotDisponibilidad {
  diaNumero: number;
  disponible: boolean;
  horarioPermitido?: string;
  motivo?: string;
  fechaStr?: string;
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

export function obtenerTodasDisponibilidades(): Record<string, { disponible: boolean; horarioPermitido?: string; motivo?: string }> {
  const data = localStorage.getItem(STORAGE_KEY_DISPONIBILIDAD);
  return data ? JSON.parse(data) : {};
}

export function guardarDisponibilidadDia(fechaStr: string, disponible: boolean, horarioPermitido?: string, motivo?: string) {
  const disponibilidades = obtenerTodasDisponibilidades();
  disponibilidades[fechaStr] = {
    disponible,
    horarioPermitido: disponible ? horarioPermitido : undefined,
    motivo: motivo || (disponible ? 'Día Liberado por Admin' : 'Cerrado / No disponible')
  };
  localStorage.setItem(STORAGE_KEY_DISPONIBILIDAD, JSON.stringify(disponibilidades));
}

export function eliminarDisponibilidadDia(fechaStr: string) {
  const disponibilidades = obtenerTodasDisponibilidades();
  delete disponibilidades[fechaStr];
  localStorage.setItem(STORAGE_KEY_DISPONIBILIDAD, JSON.stringify(disponibilidades));
}

export function obtenerDisponibilidadMes(año: number, mes: number): Record<number, SlotDisponibilidad> {
  // mes es 1-indexed (1 = Enero, 12 = Diciembre)
  const disponibilidad: Record<number, SlotDisponibilidad> = {};
  const diasEnMes = new Date(año, mes, 0).getDate();
  const personalizadas = obtenerTodasDisponibilidades();

  const motivosDisponibles = [
    { horario: '13:00 - 17:00', motivo: 'Bloque 1 · Tarde (1:00 PM - 5:00 PM · Grabación & Premezcla)' },
    { horario: '18:00 - 22:00', motivo: 'Bloque 2 · Noche (6:00 PM - 10:00 PM · Grabación & Premezcla)' }
  ];

  const motivosOcupados = [
    'Bloque 1 Reservado (1:00 PM - 5:00 PM)',
    'Bloque 2 Nocturno Reservado (6:00 PM - 10:00 PM)',
    'Sesión de Producción Full Reservada',
    'Mantenimiento Acústico de Cabina',
    'Cerrado por Descanso Operativo'
  ];

  for (let dia = 1; dia <= diasEnMes; dia++) {
    const diaStr = String(dia).padStart(2, '0');
    const mesStr = String(mes).padStart(2, '0');
    const fechaStr = `${año}-${mesStr}-${diaStr}`;

    // Verificamos si hay configuración personalizada del admin
    if (personalizadas[fechaStr] !== undefined) {
      const p = personalizadas[fechaStr];
      disponibilidad[dia] = {
        diaNumero: dia,
        disponible: p.disponible,
        horarioPermitido: p.horarioPermitido,
        motivo: p.motivo,
        fechaStr
      };
    } else {
      // Si no hay configuración personalizada del admin:
      // Disponibilidad realista y dinámica para cualquier mes
      const fechaObj = new Date(año, mes - 1, dia);
      const dayOfWeek = fechaObj.getDay(); // 0 = Dom, 1 = Lun, 2 = Mar, 3 = Mié, 4 = Jue, 5 = Vie, 6 = Sáb
      
      const now = new Date();
      const isPast = fechaObj.getTime() < new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

      let disponible = false;
      let horarioPermitido: string | undefined;
      let motivo: string | undefined;

      if (isPast) {
        disponible = false;
        motivo = 'Fecha pasada';
      } else if (dayOfWeek === 0) {
        // Domingos: Descanso o Sesión VIP Privada
        disponible = false;
        motivo = 'Cerrado por Descanso Operativo';
      } else if (dayOfWeek === 1) {
        // Lunes: Mantenimiento de equipo analógico
        disponible = false;
        motivo = 'Mantenimiento & Calibración Neumann TLM 103';
      } else if (dayOfWeek === 3) {
        // Miércoles: Mezcla & Master Badlenz
        disponible = false;
        motivo = 'Día exclusivo de Mezcla & Master en DAW';
      } else {
        // Martes, Jueves, Viernes y Sábados: Días activos de grabación en cabina
        // Generamos alternancia de demanda para mostrar días disponibles y días reservados
        const esReservado = (dia % 4 === 0) || (dia % 7 === 2);
        
        if (esReservado) {
          disponible = false;
          const index = (dia) % motivosOcupados.length;
          motivo = motivosOcupados[index];
        } else {
          disponible = true;
          if (dayOfWeek === 6) {
            horarioPermitido = '13:00 - 17:00';
            motivo = 'Bloque Fin de Semana (1:00 PM - 5:00 PM)';
          } else {
            const index = dia % motivosDisponibles.length;
            horarioPermitido = motivosDisponibles[index].horario;
            motivo = motivosDisponibles[index].motivo;
          }
        }
      }

      disponibilidad[dia] = {
        diaNumero: dia,
        disponible,
        horarioPermitido,
        motivo,
        fechaStr
      };
    }
  }

  return disponibilidad;
}

// Mantenemos la firma vieja para retrocompatibilidad
export function obtenerDisponibilidadAgosto(): Record<number, SlotDisponibilidad> {
  return obtenerDisponibilidadMes(2026, 8);
}
