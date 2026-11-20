export type PackageType =
  | 'promo'
  | 'pro'
  | 'full'
  | 'mezcla'
  | 'instrumental'
  | 'express'
  | 'combo_3'
  | 'combo_4'
  | 'prod_cuarto'
  | 'prod_artista'
  | 'prod_eng';

export interface BookingFormData {
  nombreReal: string;
  nombreArtistico: string;
  redesSociales: string;
  telefono: string;
  email: string;
  servicios: {
    grabacion: boolean;
    instrumental: boolean;
    mezclaMaster: boolean;
    produccionCompleta: boolean;
  };
  incluirBeatExclusivoBadlenz: boolean;
  tipoInstrumental: string;
  linkYoutube: string;
  numeroCanales: string;
  tempoBpm: string;
  metodoPago: 'Efectivo' | 'ATH Movil' | 'Tarjeta / Stripe' | 'PayPal' | 'Zelle';
  referencias: string;
  aceptaTerminos: boolean;
  fecha: string;
  horaInicio: string;
  horaSalida: string;
}

export interface PriceBreakdownItem {
  name: string;
  price: number;
  isDiscount?: boolean;
}

export interface PromoSlotsInfo {
  total: number;
  reservados: number;
  disponibles: number;
}

export interface BloqueHorario {
  label: string;
  desc: string;
  start: string;
  end: string;
}

export const format12h = (timeStr: string): string => {
  if (!timeStr) return '';
  const [hStr, mStr] = timeStr.split(':');
  const h = parseInt(hStr, 10);
  if (isNaN(h)) return timeStr;
  const isPm = h >= 12;
  const displayH = h % 12 === 0 ? 12 : h % 12;
  const ampm = isPm ? 'PM' : 'AM';
  return `${String(displayH).padStart(2, '0')}:${mStr} ${ampm}`;
};

export const getDuracionHoras = (start: string, end: string): number => {
  if (!start || !end) return 5;
  const [startH, startM] = start.split(':').map(Number);
  const [endH, endM] = end.split(':').map(Number);
  let diff = endH * 60 + endM - (startH * 60 + startM);
  if (diff < 0) diff += 24 * 60;
  return Math.max(1, Math.round(diff / 60));
};

export const formatMoney = (val: number): string => {
  return `$${Math.abs(val).toFixed(2).replace(/\.00$/, '')}`;
};

export const BLOQUES_OFICIALES: BloqueHorario[] = [
  { label: 'Bloque 1 · Tarde', desc: '01:00 PM - 05:00 PM (4 Horas)', start: '13:00', end: '17:00' },
  { label: 'Bloque 2 · Noche', desc: '06:00 PM - 10:00 PM (4 Horas)', start: '18:00', end: '22:00' },
];
