export const VIP_MAX_STARS = 20;

export const VIP_MILESTONES = [
  {
    pts: 3,
    title: '3 ⭐: 10% de Descuento',
    desc: '10% de descuento directo en tu próxima sesión de estudio.',
    badge: '10% OFF',
  },
  {
    pts: 5,
    title: '5 ⭐: 15% de Descuento',
    desc: '15% de descuento directo en tu próxima sesión de estudio.',
    badge: '15% OFF',
  },
  {
    pts: 10,
    title: '10 ⭐: Mezcla y Máster Gratis',
    desc: 'Mezcla profesional multitrack y masterización comercial 24-bit gratis.',
    badge: 'Mezcla y Máster Gratis',
  },
  {
    pts: 15,
    title: '15 ⭐: Instrumental Gratis',
    desc: '1 instrumental / pista exclusiva producida por Badlenz gratis.',
    badge: 'Instrumental Gratis',
  },
  {
    pts: 20,
    title: '20 ⭐: 👑 Producción Completa Gratis',
    desc: 'Producción completa gratis: instrumental, grabación de voces, mezcla y máster comercial 24-bit.',
    badge: '👑 Producción Completa',
  },
] as const;

export const VIP_CODE_PREFIX = 'VIP/';
const VIP_SLUG_REGEX = /^[a-z0-9](?:[a-z0-9-]{0,46}[a-z0-9])?$/;
const VIP_PUBLICO_DOC_PREFIX = 'vip__';

/**
 * Convierte un nombre artístico en un slug URL-safe en minúsculas (sin acentos ni espacios).
 */
export const formatVipArtistSlug = (rawName?: string): string => {
  const ascii = String(rawName || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48)
    .replace(/-+$/g, '');
  return ascii;
};

/**
 * Normaliza un código VIP al formato canónico `VIP/nombre-del-artista`.
 * Devuelve cadena vacía si no cumple el patrón válido.
 */
export const normalizeVipCode = (rawCode?: string): string => {
  if (typeof rawCode !== 'string') return '';
  const trimmed = rawCode.trim();
  if (!trimmed) return '';
  const withoutPrefix = trimmed.replace(/^vip\s*[\/\-_:]\s*/i, '');
  const slug = formatVipArtistSlug(withoutPrefix);
  if (!slug || !VIP_SLUG_REGEX.test(slug)) return '';
  return `${VIP_CODE_PREFIX}${slug}`;
};

export const isStrongVipCode = (code?: string): boolean => {
  if (typeof code !== 'string') return false;
  const trimmed = code.trim();
  if (!/^vip\//i.test(trimmed)) return false;
  const slug = trimmed.slice(4).toLowerCase();
  return VIP_SLUG_REGEX.test(slug);
};

/**
 * Convierte `VIP/nombre-del-artista` a un ID válido de documento único en Firestore `vip_publico/{docId}`
 * (Firestore prohíbe `/` dentro de un ID de documento).
 */
export const toVipPublicoDocId = (code?: string): string => {
  const canonical = normalizeVipCode(code);
  if (!canonical) return '';
  const slug = canonical.slice(VIP_CODE_PREFIX.length);
  return `${VIP_PUBLICO_DOC_PREFIX}${slug}`;
};

/**
 * Genera el codigoSesion `VIP/nombre-del-artista` (con sufijo único opcional si ya existe otro cliente igual).
 */
export const generarCodigoSesionSeguro = (
  nombreArtistico?: string,
  existingCodes: string[] = []
): string => {
  const baseSlug = formatVipArtistSlug(nombreArtistico) || 'artista';
  const taken = new Set(existingCodes.map((c) => normalizeVipCode(c)).filter(Boolean));
  const candidate = `${VIP_CODE_PREFIX}${baseSlug}`;
  if (!taken.has(candidate)) {
    return candidate;
  }
  let suffix = 2;
  while (suffix < 1000) {
    const next = `${VIP_CODE_PREFIX}${baseSlug.slice(0, 42)}-${suffix}`;
    if (!taken.has(next)) return next;
    suffix++;
  }
  return `${VIP_CODE_PREFIX}${baseSlug.slice(0, 40)}-${Date.now().toString().slice(-4)}`;
};

export const clampVipStars = (stars?: number): number => {
  if (typeof stars !== 'number' || Number.isNaN(stars)) return 0;
  return Math.max(0, Math.min(VIP_MAX_STARS, Math.round(stars)));
};

export const getVipLevelBadge = (stars: number) => {
  const safe = clampVipStars(stars);
  if (safe >= 20) return { label: '👑 Leyenda (20/20 ⭐)', shortLabel: '👑 Leyenda', color: 'text-amber-300 bg-amber-950/80 border-amber-400' };
  if (safe >= 15) return { label: '💎 Platino (15+ ⭐)', shortLabel: '💎 Platino', color: 'text-cyan-300 bg-cyan-950/80 border-cyan-400' };
  if (safe >= 10) return { label: '🥇 Oro (10+ ⭐)', shortLabel: '🥇 Oro', color: 'text-yellow-300 bg-yellow-950/80 border-yellow-400' };
  if (safe >= 5) return { label: '🥈 Plata (5+ ⭐)', shortLabel: '🥈 Plata', color: 'text-zinc-200 bg-zinc-800 border-zinc-400' };
  if (safe >= 3) return { label: '🥉 Bronce (3+ ⭐)', shortLabel: '🥉 Bronce', color: 'text-amber-600 bg-amber-950/40 border-amber-800' };
  if (safe >= 1) return { label: '🌱 En Progreso (1-2 ⭐)', shortLabel: '🌱 En Progreso', color: 'text-emerald-300 bg-emerald-950/40 border-emerald-700' };
  return { label: '🌱 Nuevo Ingreso (0 ⭐)', shortLabel: '🌱 Nuevo (0 ⭐)', color: 'text-gray-300 bg-gray-900/80 border-gray-700' };
};

export interface VipPublicoDoc {
  nombreArtistico: string;
  estrellasVip: number;
  nivel: { label: string; shortLabel: string; color: string };
  proximoHito: { pts: number; title: string; desc: string; badge: string } | null;
  estrellasRestantes: number;
  hitosAlcanzados: Array<{ pts: number; title: string; desc: string; badge: string }>;
}

export const buildVipPublicoPayload = (
  nombreArtistico: string,
  estrellasVip?: number
): VipPublicoDoc => {
  const safeStars = clampVipStars(estrellasVip);
  const nivel = getVipLevelBadge(safeStars);
  const next = VIP_MILESTONES.find((m) => m.pts > safeStars) || null;
  const proximoHito = next
    ? { pts: next.pts, title: next.title, desc: next.desc, badge: next.badge }
    : null;
  const estrellasRestantes = proximoHito ? proximoHito.pts - safeStars : 0;
  const hitosAlcanzados = VIP_MILESTONES.filter((m) => safeStars >= m.pts).map((m) => ({
    pts: m.pts,
    title: m.title,
    desc: m.desc,
    badge: m.badge,
  }));

  return {
    nombreArtistico: ((nombreArtistico || 'Artista').trim() || 'Artista').slice(0, 120),
    estrellasVip: safeStars,
    nivel,
    proximoHito,
    estrellasRestantes,
    hitosAlcanzados,
  };
};
