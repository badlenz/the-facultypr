/**
 * Comprime una imagen (captura de ATH Móvil) en cliente usando Canvas
 * para mantenerla por debajo de ~150 KB y evitar exceder el límite de 1 MB de Firestore.
 */
export function compressImageToDataUrl(
  file: File,
  maxWidth = 1000,
  quality = 0.72
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('No se pudo leer la imagen.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Formato de imagen no soportado.'));
      img.onload = () => {
        const scale = img.width > maxWidth ? maxWidth / img.width : 1;
        const width = Math.round(img.width * scale);
        const height = Math.round(img.height * scale);
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(reader.result as string);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        const compressed = canvas.toDataURL('image/jpeg', quality);
        resolve(compressed);
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Genera y descarga un archivo .ics compatible con Apple Calendar y Google Calendar.
 */
export function downloadSessionIcs(params: {
  id: string;
  nombreArtistico: string;
  fecha: string; // YYYY-MM-DD
  horaInicio: string; // HH:mm
  horaSalida: string; // HH:mm
  deposito: number;
  balance: number;
}) {
  const cleanDate = params.fecha.replace(/-/g, '');
  const cleanStart = params.horaInicio.replace(':', '') + '00';
  const cleanEnd = params.horaSalida.replace(':', '') + '00';
  const nowStamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//La Facultad Studio//Badlenz//ES',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:${params.id}@the-facultypr.vercel.app`,
    `DTSTAMP:${nowStamp}`,
    `DTSTART;TZID=America/Puerto_Rico:${cleanDate}T${cleanStart}`,
    `DTEND;TZID=America/Puerto_Rico:${cleanDate}T${cleanEnd}`,
    `SUMMARY:Sesión en La Facultad Studio · ${params.nombreArtistico}`,
    `LOCATION:La Facultad Studio, Hormigueros, Puerto Rico`,
    `DESCRIPTION:Pase VIP #${params.id}\\nDepósito: $${params.deposito} USD\\nBalance al llegar: $${params.balance} USD\\nWhatsApp Badlenz: +1 (787) 240-8627`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');

  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `La_Facultad_Sesion_${params.fecha}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
