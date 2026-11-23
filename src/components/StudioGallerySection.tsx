import React, { useEffect, useState } from 'react';
import { Camera, ChevronLeft, ChevronRight, Expand, X } from 'lucide-react';

interface StudioPhoto {
  src: string;
  videoSrc?: string;
  title: string;
  subtitle: string;
  tag: string;
  featured?: boolean;
  wide?: boolean;
}

const STUDIO_PHOTOS: StudioPhoto[] = [
  {
    src: '/assets/studio/booth-neumann.jpg',
    videoSrc: '/assets/studio/videos/04-booth-neumann.mp4',
    title: 'Cabina Vocal · Neumann & sE',
    subtitle: 'Aislamiento acústico dedicado con micrófono Neumann y pop filter sE Electronics.',
    tag: 'Cabina Vocal',
    featured: true,
  },
  {
    src: '/assets/studio/hero-pro-tools.jpg',
    title: 'Estación Pro Tools & Focal',
    subtitle: 'Sesión multipista en pantalla grande, consola de mezcla y monitores Focal.',
    tag: 'Control Room',
  },
  {
    src: '/assets/studio/apollo-solo-minilab.jpg',
    videoSrc: '/assets/studio/videos/05-apollo-solo-minilab.mp4',
    title: 'Universal Audio Apollo Solo',
    subtitle: 'Monitoreo sin latencia en tiempo real y conversión de estudio.',
    tag: 'Cadena Vocal',
  },
  {
    src: '/assets/studio/control-room-azul.jpg',
    videoSrc: '/assets/studio/videos/06-control-room-azul.mp4',
    title: 'Atmósfera Galaxia · Fase Azul',
    subtitle: 'Iluminación ambiental diseñada para sesiones largas de grabación y creación.',
    tag: 'Ambiente',
  },
  {
    src: '/assets/studio/booth-estudio.jpg',
    title: 'Conexión Cabina → Mezcla',
    subtitle: 'Comunicación directa entre cabina vocal y estación de ingeniería.',
    tag: 'Grabación',
  },
  {
    src: '/assets/studio/estudio-completo.jpg',
    videoSrc: '/assets/studio/videos/07-estudio-completo.mp4',
    title: 'Sala Completa · Hormigueros',
    subtitle: 'Espacio tratado acústicamente con iluminación ambiental Galaxia y comodidad para tu equipo.',
    tag: 'Espacio Real',
    wide: true,
  },
  {
    src: '/assets/studio/minilab-pads.jpg',
    title: 'Arturia MiniLab 3 · Producción',
    subtitle: 'Controlador MIDI y pads táctiles para arreglos, melodías y producción en vivo.',
    tag: 'Producción',
  },
  {
    src: '/assets/studio/vista-lateral.jpg',
    title: 'Perspectiva de Sesión',
    subtitle: 'Vista lateral del escritorio de producción, logo The Faculty y cabina vocal.',
    tag: 'Detalle',
  },
];

export const StudioGallerySection: React.FC = () => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  useEffect(() => {
    if (activeIndex === null) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveIndex(null);
      } else if (e.key === 'ArrowRight') {
        setActiveIndex((prev) => (prev === null ? null : (prev + 1) % STUDIO_PHOTOS.length));
      } else if (e.key === 'ArrowLeft') {
        setActiveIndex((prev) =>
          prev === null ? null : (prev - 1 + STUDIO_PHOTOS.length) % STUDIO_PHOTOS.length
        );
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeIndex]);

  const activePhoto = activeIndex !== null ? STUDIO_PHOTOS[activeIndex] : null;

  return (
    <section
      id="galeria-estudio-real"
      aria-labelledby="galeria-estudio-heading"
      className="relative overflow-hidden rounded-3xl border border-white/10 antigravity-glass-panel p-5 sm:p-8 space-y-6 shadow-[0_30px_70px_rgba(0,0,0,0.75)]"
    >
      {/* Top Specular Highlight */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-400/40 to-transparent pointer-events-none" />
      <div className="absolute -top-24 left-1/3 w-80 h-80 bg-purple-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-24 right-10 w-80 h-80 bg-amber-500/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Header */}
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-white/10 pb-5">
        <div className="space-y-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-[10px] font-mono text-amber-300 font-bold uppercase tracking-widest">
            <Camera className="w-3 h-3 text-amber-400" />
            <span>Instalaciones Reales · Hormigueros, PR</span>
          </span>
          <h2
            id="galeria-estudio-heading"
            className="font-syne text-2xl sm:text-3xl font-extrabold text-white tracking-tight"
          >
            Conoce <span className="text-amber-400">La Facultad Studio</span> por Dentro
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 max-w-2xl">
            Fotos reales de nuestro control room, cabina vocal y cadena de audio. Toca cualquier toma para verla en pantalla completa.
          </p>
        </div>

        <span className="text-[11px] font-mono text-zinc-400 shrink-0">
          {STUDIO_PHOTOS.length} tomas seleccionadas
        </span>
      </div>

      {/* Curated Bento Gallery Grid */}
      <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4 auto-rows-[200px] sm:auto-rows-[210px]">
        {STUDIO_PHOTOS.map((photo, idx) => (
          <button
            key={photo.src}
            type="button"
            onClick={() => setActiveIndex(idx)}
            aria-label={`Ampliar foto: ${photo.title}`}
            className={`group relative overflow-hidden rounded-2xl border border-white/10 bg-[#080a10] text-left transition-all duration-300 hover:border-amber-400/50 hover:shadow-[0_12px_35px_rgba(245,158,11,0.18)] focus:outline-none focus:ring-2 focus:ring-amber-400/60 cursor-pointer ${
              photo.featured
                ? 'sm:col-span-2 sm:row-span-2'
                : photo.wide
                  ? 'sm:col-span-2'
                  : ''
            }`}
          >
            {photo.videoSrc ? (
              <video
                src={photo.videoSrc}
                poster={photo.src}
                autoPlay
                loop
                muted
                playsInline
                preload="metadata"
                aria-label={photo.title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            ) : (
              <img
                src={photo.src}
                alt={photo.title}
                loading="lazy"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            )}

            {/* Dark readability gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-transparent opacity-85 group-hover:opacity-95 transition-opacity" />

            {/* Top tag + expand icon */}
            <div className="absolute top-3 inset-x-3 flex items-center justify-between gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-black/65 border border-white/15 backdrop-blur-md text-[10px] font-mono font-bold uppercase tracking-wider text-amber-300">
                {photo.tag}
              </span>
              <span className="p-1.5 rounded-full bg-black/65 border border-white/15 text-zinc-200 opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-md">
                <Expand className="w-3.5 h-3.5" />
              </span>
            </div>

            {/* Bottom caption */}
            <div className="absolute bottom-3 inset-x-3 space-y-0.5">
              <p className="font-syne font-bold text-sm sm:text-base text-white leading-snug">
                {photo.title}
              </p>
              {photo.featured && (
                <p className="text-xs text-zinc-300 line-clamp-2">{photo.subtitle}</p>
              )}
            </div>
          </button>
        ))}
      </div>

      {/* Lightbox Modal */}
      {activePhoto && activeIndex !== null && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={activePhoto.title}
          onClick={() => setActiveIndex(null)}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-xl p-4 sm:p-6"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-4xl rounded-3xl border border-white/15 bg-[#0b0d14] overflow-hidden shadow-2xl"
          >
            {/* Top bar */}
            <div className="flex items-center justify-between gap-3 px-4 sm:px-6 py-3.5 border-b border-white/10">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-[10px] font-mono font-bold uppercase tracking-wider text-amber-300 shrink-0">
                  {activePhoto.tag}
                </span>
                <span className="font-syne font-bold text-sm sm:text-base text-white truncate">
                  {activePhoto.title}
                </span>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs font-mono text-zinc-400">
                  {activeIndex + 1} / {STUDIO_PHOTOS.length}
                </span>
                <button
                  type="button"
                  onClick={() => setActiveIndex(null)}
                  aria-label="Cerrar visor"
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 text-zinc-200 transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Image / Video viewport */}
            <div className="relative bg-black flex items-center justify-center max-h-[72vh]">
              {activePhoto.videoSrc ? (
                <video
                  key={activePhoto.videoSrc}
                  src={activePhoto.videoSrc}
                  poster={activePhoto.src}
                  autoPlay
                  loop
                  muted
                  playsInline
                  controls
                  className="w-full max-h-[72vh] object-contain"
                />
              ) : (
                <img
                  src={activePhoto.src}
                  alt={activePhoto.title}
                  className="w-full max-h-[72vh] object-contain"
                />
              )}

              <button
                type="button"
                onClick={() =>
                  setActiveIndex(
                    (activeIndex - 1 + STUDIO_PHOTOS.length) % STUDIO_PHOTOS.length
                  )
                }
                aria-label="Foto anterior"
                className="absolute left-3 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-black/70 hover:bg-black/90 border border-white/20 text-white transition cursor-pointer"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <button
                type="button"
                onClick={() => setActiveIndex((activeIndex + 1) % STUDIO_PHOTOS.length)}
                aria-label="Siguiente foto"
                className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-black/70 hover:bg-black/90 border border-white/20 text-white transition cursor-pointer"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {/* Footer caption */}
            <div className="px-4 sm:px-6 py-3.5 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <p className="text-xs sm:text-sm text-zinc-300">{activePhoto.subtitle}</p>
              <span className="text-[11px] font-mono text-zinc-500 shrink-0">
                ESC para cerrar · ← → para navegar
              </span>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
