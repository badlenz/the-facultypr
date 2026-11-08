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
  grabando: {
    estado: 'grabando',
    titulo: '🔴 ON AIR: EN GRABACIÓN',
    subtitulo: 'Studio Acústico Ocupado con Micrófono Neumann TLM 103',
    proximoTurnoLibre: 'Hoy 06:00 PM',
    ingeniero: 'Manuel E. Ramirez (Badlenz)'
  },
  mezclando: {
    estado: 'mezclando',
    titulo: '🟡 EN MEZCLA: CONTROL ROOM',
    subtitulo: 'Afinación Melodyne & Procesamiento Analógico Activo',
    proximoTurnoLibre: 'Hoy 04:00 PM',
    ingeniero: 'Manuel E. Ramirez (Badlenz)'
  },
  disponible: {
    estado: 'disponible',
    titulo: '🟢 STUDIO DISPONIBLE HOY',
    subtitulo: 'Espacio Abierto • ¡Toca aquí para reservar tu turno!',
    proximoTurnoLibre: 'Inmediato / Turnos de Tarde & Noche',
    ingeniero: 'Manuel E. Ramirez (Badlenz)'
  },
  cerrado: {
    estado: 'cerrado',
    titulo: '⚪ ESTUDIO CERRADO / DESCANSO',
    subtitulo: 'Fuera de Horario • Reanudamos mañana a las 10:00 AM',
    proximoTurnoLibre: 'Mañana 10:00 AM',
    ingeniero: 'Manuel E. Ramirez (Badlenz)',
    motivoCierre: 'horario'
  },
  vacaciones: {
    estado: 'vacaciones',
    titulo: '🌴 RECESO POR VACACIONES',
    subtitulo: 'Recargando creatividad para el próximo ciclo de producción musical.',
    proximoTurnoLibre: 'Lunes Próximo 10:00 AM',
    ingeniero: 'Manuel E. Ramirez (Badlenz)',
    motivoCierre: 'vacaciones',
    fechaReapertura: 'Próximo Lunes',
    mensajeEspecial: 'Estamos tomando un breve respiro para volver con los oídos frescos y nuevas ideas sonoras.'
  },
  mantenimiento: {
    estado: 'mantenimiento',
    titulo: '🛠️ MANTENIMIENTO & CALIBRACIÓN',
    subtitulo: 'Calibración de conversores, microfonía Neumann y cableado analógico Mogami.',
    proximoTurnoLibre: 'Jueves 10:00 AM',
    ingeniero: 'Manuel E. Ramirez (Badlenz)',
    motivoCierre: 'mantenimiento',
    fechaReapertura: 'Jueves',
    mensajeEspecial: 'Afinando cada decibel para que tu voz suene con el estándar comercial de radio.'
  },
  remodelacion: {
    estado: 'remodelacion',
    titulo: '🎧 REMODELACIÓN ACÚSTICA',
    subtitulo: 'Mejoras en trampas de graves y difusores acústicos para un sonido aún más seco y limpio.',
    proximoTurnoLibre: '15 de Octubre',
    ingeniero: 'Manuel E. Ramirez (Badlenz)',
    motivoCierre: 'remodelacion',
    fechaReapertura: '15 de Octubre',
    mensajeEspecial: 'Transformando el studio para elevar aún más la experiencia de grabación de nuestros artistas.'
  }
};

export function getStudioLiveStatus(): StudioLiveStatus {
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
  // Default is 'grabando' or 'disponible'
  return PRESET_STATUSES.grabando;
}

export function setStudioLiveStatus(status: StudioLiveStatus): void {
  try {
    if (typeof window !== 'undefined') {
      const updated = {
        ...status,
        ultimaActualizacion: new Date().toLocaleTimeString('es-PR', { hour: '2-digit', minute: '2-digit' })
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: updated }));
    }
  } catch (err) {
    console.warn('Error saving studio status:', err);
  }
}

export function subscribeToStudioStatus(callback: (status: StudioLiveStatus) => void): () => void {
  const handler = (e: any) => {
    callback(e.detail || getStudioLiveStatus());
  };
  if (typeof window !== 'undefined') {
    window.addEventListener(EVENT_NAME, handler);
  }
  return () => {
    if (typeof window !== 'undefined') {
      window.removeEventListener(EVENT_NAME, handler);
    }
  };
}
