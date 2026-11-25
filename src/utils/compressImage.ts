/**
 * Comprime una imagen (captura de ATH Móvil) en cliente usando Canvas
 * para mantenerla por debajo de ~420 KB de data URL (límite seguro < 500 KB en Firestore rules).
 */
const MAX_COMPRESSED_CHARS = 420_000;

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
        const renderAt = (targetMaxW: number, q: number): string | null => {
          const scale = img.width > targetMaxW ? targetMaxW / img.width : 1;
          const width = Math.max(1, Math.round(img.width * scale));
          const height = Math.max(1, Math.round(img.height * scale));
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) return null;
          ctx.drawImage(img, 0, 0, width, height);
          return canvas.toDataURL('image/jpeg', q);
        };

        const attempts: Array<[number, number]> = [
          [maxWidth, quality],
          [Math.min(maxWidth, 840), Math.min(quality, 0.58)],
          [720, 0.45],
          [560, 0.38],
        ];

        for (const [w, q] of attempts) {
          const out = renderAt(w, q);
          if (!out) {
            reject(new Error('No se pudo inicializar el compresor de imagen.'));
            return;
          }
          if (out.length <= MAX_COMPRESSED_CHARS) {
            resolve(out);
            return;
          }
        }

        const fallback = renderAt(480, 0.32);
        if (!fallback || fallback.length > 495_000) {
          reject(new Error('La imagen es demasiado pesada incluso comprimida. Prueba otra captura.'));
          return;
        }
        resolve(fallback);
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

export { downloadSessionIcs, buildSessionIcsContent } from './calendarIcs';
export type { SessionIcsParams } from './calendarIcs';
