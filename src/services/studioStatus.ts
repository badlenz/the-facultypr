import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

export type StudioLiveStatusType =
  | 'grabando'
  | 'mezclando'
  | 'disponible'
  | 'cerrado'
  | 'vacaciones'
  | 'mantenimiento'
  | 'remodelacion';

export interface StudioLiveStatus {
  estado: StudioLiveStatusType;
  titulo: string;
  subtitulo: string;
  proximoTurnoLibre?: string;
  ingeniero?: string;
  ultimaActualizacion?: string;
  motivoCierre?: 'vacaciones' | 'mantenimiento' | 'remodelacion' | 'horario' | 'personalizado';
  fechaReapertura?: string;
  diasRestantes?: number;
  mensajeEspecial?: string;
}

const STORAGE_KEY = 'la_facultad_studio_live_status';
const EVENT_NAME = 'la_facultad_live_status_change';

export const PRESET_STATUSES: Record<StudioLiveStatusType, StudioLiveStatus> = {
  disponible: {
    estado: 'disponible',
    titulo: '🟢 STUDIO DISPONIBLE HOY',
    subtitulo: 'Espacio Abierto · ¡Toca aquí para reservar tu turno!',
    proximoTurnoLibre: 'Turnos de Tarde & Noche',
    ingeniero: 'Manuel E. Ramírez (Badlenz)',
  },
  grabando: {
    estado: 'grabando',
    titulo: '🔴 ON AIR: EN GRABACIÓN',
    subtitulo: 'Cabina Acústica Activa · Reserva tu próximo bloque',
    proximoTurnoLibre: 'Hoy 06:00 PM',
    ingeniero: 'Manuel E. Ramírez (Badlenz)',
  },
  mezclando: {
    estado: 'mezclando',
    titulo: '🟡 EN MEZCLA: CONTROL ROOM',
    subtitulo: 'Afinación & Procesamiento Analógico Activo',
    proximoTurnoLibre: 'Hoy 06:00 PM',
    ingeniero: 'Manuel E. Ramírez (Badlenz)',
  },
  cerrado: {
    estado: 'cerrado',
    titulo: '⚪ ESTUDIO CERRADO / DESCANSO',
    subtitulo: 'Fuera de Horario · Puedes reservar tu próxima fecha online',
    proximoTurnoLibre: 'Próximo día laboral 01:00 PM',
    ingeniero: 'Manuel E. Ramírez (Badlenz)',
    motivoCierre: 'horario',
  },
  vacaciones: {
    estado: 'vacaciones',
    titulo: '🌴 RECESO POR VACACIONES',
    subtitulo: 'Recargando creatividad para el próximo ciclo de producción musical.',
    proximoTurnoLibre: 'Próxima semana',
    ingeniero: 'Manuel E. Ramírez (Badlenz)',
    motivoCierre: 'vacaciones',
    fechaReapertura: 'Próximo Lunes',
    mensajeEspecial: 'Estamos tomando un breve respiro para volver con los oídos frescos.',
  },
  mantenimiento: {
    estado: 'mantenimiento',
    titulo: '🛠️ MANTENIMIENTO & CALIBRACIÓN',
    subtitulo: 'Calibración de conversores, microfonía Neumann y cadena analógica.',
    proximoTurnoLibre: 'Próximo día hábil',
    ingeniero: 'Manuel E. Ramírez (Badlenz)',
    motivoCierre: 'mantenimiento',
    fechaReapertura: 'Próximo Jueves',
    mensajeEspecial: 'Afinando cada decibel para que tu voz suene con estándar comercial.',
  },
  remodelacion: {
    estado: 'remodelacion',
    titulo: '🎧 REMODELACIÓN ACÚSTICA',
    subtitulo: 'Mejoras acústicas para un sonido aún más seco y limpio.',
    proximoTurnoLibre: 'Próximamente',
    ingeniero: 'Manuel E. Ramírez (Badlenz)',
    motivoCierre: 'remodelacion',
    fechaReapertura: 'Próximamente',
    mensajeEspecial: 'Elevando el studio para tu próxima sesión.',
  },
};

// Sincronización en tiempo real desde Firestore para todos los visitantes
let firestoreListenerInitialized = false;
function ensureFirestoreSync() {
  if (firestoreListenerInitialized || typeof window === 'undefined') return;
  firestoreListenerInitialized = true;
  try {
    onSnapshot(
      doc(db, 'studio_config', 'live_status'),
      (snap) => {
        if (snap.exists()) {
          const data = snap.data() as StudioLiveStatus;
          if (data?.estado) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
            window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: data }));
          }
        }
      },
      (err) => {
        console.warn('Firestore studioStatus listener notice:', err.message);
      }
    );
  } catch (err) {
    console.warn('Studio status sync init notice:', err);
  }
}

export function getStudioLiveStatus(): StudioLiveStatus {
  ensureFirestoreSync();
  try {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    }
  } catch (err) {
    console.warn('Error reading studio status:', err);
  }
  return PRESET_STATUSES.disponible;
}

export function setStudioLiveStatus(status: StudioLiveStatus): void {
  try {
    if (typeof window !== 'undefined') {
      const updated: StudioLiveStatus = {
        ...status,
        ultimaActualizacion: new Date().toLocaleTimeString('es-PR', {
          hour: '2-digit',
          minute: '2-digit',
        }),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: updated }));
      // Guardar en Firestore para que todos los artistas lo vean al instante
      setDoc(doc(db, 'studio_config', 'live_status'), updated, { merge: true }).catch((err) => {
        console.warn('Firestore setStudioLiveStatus notice:', err);
      });
    }
  } catch (err) {
    console.warn('Error saving studio status:', err);
  }
}

export function subscribeToStudioStatus(callback: (status: StudioLiveStatus) => void): () => void {
  ensureFirestoreSync();
  const handler = (e: any) => {
    callback(e.detail || getStudioLiveStatus());
  };
  const storageHandler = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) {
      callback(getStudioLiveStatus());
    }
  };
  window.addEventListener(EVENT_NAME, handler);
  window.addEventListener('storage', storageHandler);
  return () => {
    window.removeEventListener(EVENT_NAME, handler);
    window.removeEventListener('storage', storageHandler);
  };
}
