// Configuración para el Portal de Artistas externo
// Cuando esté listo tu proyecto independiente, define VITE_ARTIST_PORTAL_URL en tu archivo .env
// Ejemplo: VITE_ARTIST_PORTAL_URL="https://portal.lafacultadstudio.com"

export const ARTIST_PORTAL_EXTERNAL_URL: string = 
  (import.meta as any).env?.VITE_ARTIST_PORTAL_URL || '';
