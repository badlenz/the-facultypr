// Configuración para el Portal de Artistas en vivo (La Facultad Studio / Badlenz)
export const ARTIST_PORTAL_BASE_URL: string =
  ((import.meta as any).env?.VITE_ARTIST_PORTAL_URL || 'https://la-facultad-studio.vercel.app').replace(/\/+$/, '');

export const ARTIST_PORTAL_EXTERNAL_URL: string = ARTIST_PORTAL_BASE_URL;

export const getArtistSessionUrl = (code: string): string => {
  const cleanCode = code.trim().toLowerCase().replace(/^\/+|\/+$/g, '').replace(/\s+/g, '');
  return `${ARTIST_PORTAL_BASE_URL}/s/${encodeURIComponent(cleanCode)}`;
};

export const ARTIST_DEMO_SESSION_URL: string = `${ARTIST_PORTAL_BASE_URL}/s/zyrontukutu`;
export const BADLENZ_WHATSAPP_STATUS_URL: string = `https://wa.me/17872408627?text=${encodeURIComponent(
  'Dímelo Badlenz! Quiero saber en qué fase va mi tema y cuándo estará disponible en el portal de escucha.'
)}`;
