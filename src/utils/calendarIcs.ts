/**
 * Generador RFC 5545 de confirmación de calendario (.ics) para La Facultad Studio.
 * Compatible con Apple Calendar (iOS/macOS), Google Calendar, Outlook y Android.
 */

export interface SessionIcsParams {
  id: string;
  nombreArtistico: string;
  fecha: string; // YYYY-MM-DD
  fechasBloque?: string[]; // Fechas adicionales si es reserva en bloque
  horaInicio: string; // HH:mm
  horaSalida: string; // HH:mm
  deposito: number;
  balance: number;
  servicios?: string[];
  estado?: string;
  direccion?: string;
}

/** Escapa caracteres reservados por RFC 5545 */
function escapeIcsText(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/\r\n|\r|\n/g, '\\n')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,');
}

function normalizeTimeHHMMSS(timeStr: string): string {
  const clean = (timeStr || '13:00').trim().split(' ')[0];
  const [h = '13', m = '00'] = clean.split(':');
  return `${h.padStart(2, '0')}${m.padStart(2, '0')}00`;
}

/** Construye el contenido completo del archivo .ics (exportado para pruebas/preview) */
export function buildSessionIcsContent(params: SessionIcsParams): string {
  const nowStamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  const startTime = normalizeTimeHHMMSS(params.horaInicio);
  const endTime = normalizeTimeHHMMSS(params.horaSalida);
  const location = params.direccion?.trim() || 'La Facultad Studio, Hormigueros, Puerto Rico';
  const status = params.estado === 'Confirmada' ? 'CONFIRMED' : 'TENTATIVE';

  const fechas = Array.isArray(params.fechasBloque) && params.fechasBloque.length > 0
    ? Array.from(new Set(params.fechasBloque))
    : [params.fecha];

  const serviciosLine =
    params.servicios && params.servicios.length > 0
      ? `Servicios: ${params.servicios.join(' + ')}\n`
      : '';

  const descriptionText =
    `Confirmación oficial de sesión en La Facultad Studio (Badlenz).\n` +
    `Pase VIP: #${params.id}\n` +
    `Artista: ${params.nombreArtistico}\n` +
    serviciosLine +
    `Depósito acordado: $${params.deposito} USD\n` +
    `Balance al llegar al studio: $${params.balance} USD\n` +
    `WhatsApp Badlenz: +1 (787) 240-8627\n` +
    `Recuerda llegar 15-20 minutos antes de tu turno.`;

  const events = fechas.map((fechaStr, idx) => {
    const cleanDate = fechaStr.replace(/-/g, '');
    const uidSuffix = fechas.length > 1 ? `-d${idx + 1}` : '';
    const dayTag = fechas.length > 1 ? ` (Día ${idx + 1}/${fechas.length})` : '';

    return [
      'BEGIN:VEVENT',
      `UID:${params.id}${uidSuffix}@the-facultypr.vercel.app`,
      `DTSTAMP:${nowStamp}`,
      `DTSTART;TZID=America/Puerto_Rico:${cleanDate}T${startTime}`,
      `DTEND;TZID=America/Puerto_Rico:${cleanDate}T${endTime}`,
      `STATUS:${status}`,
      `SUMMARY:${escapeIcsText(`Sesión en La Facultad Studio · ${params.nombreArtistico}${dayTag}`)}`,
      `LOCATION:${escapeIcsText(location)}`,
      `DESCRIPTION:${escapeIcsText(descriptionText)}`,
      'BEGIN:VALARM',
      'ACTION:DISPLAY',
      'TRIGGER:-P1D',
      'DESCRIPTION:Mañana tienes tu sesión en La Facultad Studio con Badlenz.',
      'END:VALARM',
      'BEGIN:VALARM',
      'ACTION:DISPLAY',
      'TRIGGER:-PT1H',
      'DESCRIPTION:Tu sesión en La Facultad Studio comienza en 1 hora. ¡Te esperamos!',
      'END:VALARM',
      'END:VEVENT',
    ].join('\r\n');
  });

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//La Facultad Studio//Badlenz Booking System//ES',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:La Facultad Studio · Sesión VIP',
    'X-WR-TIMEZONE:America/Puerto_Rico',
    'BEGIN:VTIMEZONE',
    'TZID:America/Puerto_Rico',
    'BEGIN:STANDARD',
    'DTSTART:19700101T000000',
    'TZOFFSETFROM:-0400',
    'TZOFFSETTO:-0400',
    'TZNAME:AST',
    'END:STANDARD',
    'END:VTIMEZONE',
    ...events,
    'END:VCALENDAR',
    '',
  ].join('\r\n');
}

/**
 * Genera y descarga un archivo .ics de confirmación de reserva.
 */
export function downloadSessionIcs(params: SessionIcsParams): void {
  const ics = buildSessionIcsContent(params);
  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const safeId = (params.id || params.fecha).replace(/[^A-Za-z0-9_-]/g, '_');
  a.download = `Confirmacion_LaFacultad_${safeId}_${params.fecha}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
