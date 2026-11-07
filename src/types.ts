export type { Cliente, Reserva } from './services/db';

export type NavigationTab = 
  | 'panel_admin'
  | 'cotizador' 
  | 'calendario' 
  | 'proyectos' 
  | 'factura' 
  | 'asistente'
  | 'cliente'
  | 'muestras'
  | 'historial';

export type AppMode = 'admin' | 'public';

export interface ClientInfo {
  nombreArtistico: string;
  nombreReal: string;
  nombre: string; // compatibility fallback (uses nombreArtistico or nombreReal)
  email: string;
  telefono: string;
  empresa: string;
  instagram: string;
  fechaSesion: string;
  horaInicio: string;
  horaSalida: string;
  totalHoras: number;
  fechaEntrega: string;
  notas: string;
  aceptacionPoliticas: boolean;
}

export type ServiceCategory = 'grabacion' | 'mezcla' | 'produccion' | 'edicion' | 'video' | 'branding';

export interface StudioServiceItem {
  id: string;
  category: ServiceCategory;
  name: string;
  description: string;
  price: number;
  unit: string;
  selected: boolean;
  quantity: number;
}

export interface AddOnItem {
  id: string;
  name: string;
  price: number;
  type: 'fixed' | 'percentage';
  selected: boolean;
  description: string;
}

export interface CustomQuoteItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

export interface QuoteData {
  id: string;
  numeroCotizacion: string;
  fecha: string;
  cliente: ClientInfo;
  servicios: StudioServiceItem[];
  addOns: AddOnItem[];
  customItems: CustomQuoteItem[];
  descuentoValor: number;
  descuentoTipo: 'percentage' | 'fixed';
  aplicaIVA: boolean;
  porcentajeIVA: number;
  moneda: string;
  subtotal: number;
  descuentoMonto: number;
  ivaMonto: number;
  depositoRequerido: number; // 50%
  balancePendiente: number; // 50%
  total: number;
  estado: 'Borrador' | 'Enviada' | 'Aprobada' | 'Facturada' | 'Reservado';
}

export type SessionType = 
  | 'Grabación Voces'
  | 'Mezcla y Master'
  | 'Mezcla & Mastering'
  | 'Producción Beat'
  | 'Asistencia de Audio'
  | 'Video Studio'
  | 'Fotografía' 
  | 'Grabación Video' 
  | 'Reunión Estratégica' 
  | 'Entrega Final';

export interface CalendarSession {
  id: string;
  titulo: string;
  cliente: string;
  nombreArtistico?: string;
  fecha: string; // YYYY-MM-DD
  horaInicio: string;
  horaFin: string;
  tipo: SessionType;
  estado: 'Confirmada' | 'Pendiente' | 'Completada' | 'Cancelada';
  ubicacion: string;
  notas: string;
  color: string;
}

export type ProjectStatusType = 
  | 'En Grabación'
  | 'En Proceso de Mezcla'
  | 'Listo para Revisión'
  | 'Entregado'
  | 'En Cotización' 
  | 'Grabando'
  | 'Grabado (Voces Listas)'
  | 'Mezclando'
  | 'En Mezcla'
  | 'Masterizando'
  | 'Masterización Final'
  | 'En Producción'
  | 'En Diseño'
  | 'En Revisión' 
  | '¡Lista para Descargar! 🎉'
  | 'Pausado'
  | (string & {});

export interface ProjectAudioSpecs {
  bitDepth: '24-bit' | '16-bit' | '32-bit float';
  sampleRate: '48kHz' | '44.1kHz' | '96kHz';
  lufs: string; // e.g. "-14 LUFS"
  formato: 'WAV' | 'MP3' | 'AIFF';
}

export interface ProjectAudioDelivery {
  masterWavUrl?: string; // WAV 24-bit/48kHz final
  mp3PreviewUrl?: string; // MP3 para pruebas y revisiones en móvil
  instrumentalUrl?: string; // Versión Instrumental para shows
  acapellaUrl?: string; // Voces limpias / procesadas
  stemsUrl?: string; // Google Drive / Dropbox link con stems ZIP
  stemsDriveProvider?: 'Google Drive' | 'Dropbox' | 'WeTransfer' | 'Direct';
  audioSpecs?: ProjectAudioSpecs;
  aprobadoPorCliente?: boolean;
  fechaAprobacion?: string;
  tamanoTotalMb?: number;
}

export interface ProjectMilestone {
  id: string;
  titulo: string;
  completado: boolean;
}

export interface StudioProject {
  id: string;
  nombre: string;
  cliente: string;
  nombreArtistico?: string;
  email: string;
  telefono?: string;
  codigoProyecto?: string; // e.g. "FAC-001", "FAC-002"
  categoria: string;
  montoTotal: number;
  depositoPagado?: number;
  balancePendiente?: number;
  progreso: number;
  estado: ProjectStatusType;
  fechaEntrega: string;
  liderCreativo: string;
  hitos: ProjectMilestone[];
  cotizacionId?: string;
  moneda: string;
  entregables?: ProjectAudioDelivery;
}

export function generateNextProjectCode(existingProjects: StudioProject[] = []): string {
  let maxNum = 0;
  for (const p of existingProjects) {
    if (p.codigoProyecto) {
      const match = p.codigoProyecto.match(/FAC-(\d+)/i);
      if (match && match[1]) {
        const num = parseInt(match[1], 10);
        if (!isNaN(num) && num > maxNum) {
          maxNum = num;
        }
      }
    }
  }
  const nextNum = maxNum + 1;
  return `FAC-${String(nextNum).padStart(3, '0')}`;
}

export interface InvoiceItem {
  id: string;
  descripcion: string;
  cantidad: number;
  precioUnitario: number;
  total: number;
}

export interface InvoiceData {
  id: string;
  numeroFactura: string;
  fechaEmision: string;
  fechaVencimiento: string;
  cliente: ClientInfo;
  items: InvoiceItem[];
  subtotal: number;
  descuento: number;
  iva: number;
  depositoRequerido: number;
  balancePendiente: number;
  total: number;
  moneda: string;
  estadoPago: 'Pendiente' | 'Pagado' | 'Parcial';
  metodoPago: string;
  notasBanco: string;
  condiciones: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface FeedbackItem {
  id: string;
  timestamp: string; // e.g. "01:24"
  comentario: string;
  completado: boolean;
  fechaCreacion: string;
}

export interface SongFeedback {
  id: string;
  proyectoId: string;
  nombreProyecto: string;
  nombreArtistico: string;
  fecha: string;
  items: FeedbackItem[];
}

