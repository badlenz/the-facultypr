import React from 'react';
import { Star, Quote, Sparkles } from 'lucide-react';

export interface ArtistTestimonial {
  id: string;
  rating: number;
  quote: string;
  artistName: string;
  projectTitle: string;
  isExample?: boolean;
}

// Testimonios reales verificados (WhatsApp e Instagram DM)
const ARTIST_TESTIMONIALS: ArtistTestimonial[] = [
  {
    id: 'zyron-mix-master',
    rating: 5,
    quote:
      'Suena cabron! Papi quedó cm mejor es posible, no le hace falta nada.',
    artistName: 'Zyron',
    projectTitle: 'Mix y Máster · WhatsApp',
  },
  {
    id: 'zyron-grabacion',
    rating: 5,
    quote:
      'El último tema que me grabaste allí me pasó escuchando… la calidad está mortal.',
    artistName: 'Zyron',
    projectTitle: 'Grabación en el estudio · WhatsApp',
  },
  {
    id: 'nei-master',
    rating: 5,
    quote:
      'Q se repita 🔥🔥🫡 … Voy es a pasarlo y platinarlo.',
    artistName: 'Nei',
    projectTitle: 'Máster · Instagram DM',
  },
];

export const SocialProofReviews: React.FC = () => {
  return (
    <section
      id="testimonios"
      aria-labelledby="testimonios-artistas-heading"
      className="relative overflow-hidden rounded-3xl border border-white/10 antigravity-glass-panel p-5 sm:p-8 space-y-6 shadow-[0_24px_60px_rgba(0,0,0,0.7)] scroll-mt-24"
    >
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-400/35 to-transparent pointer-events-none" />
      <div className="absolute -top-24 right-1/4 w-72 h-72 bg-amber-500/8 rounded-full blur-[110px] pointer-events-none" />

      <div className="relative z-10 flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-white/10 pb-5">
        <div className="space-y-1.5">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-400/40 text-[10px] font-mono text-amber-300 font-bold uppercase tracking-widest">
            <Sparkles className="w-3 h-3 text-amber-400" />
            <span>Experiencias en Cabina</span>
          </span>
          <h2
            id="testimonios-artistas-heading"
            className="font-syne text-2xl sm:text-3xl font-bold text-white tracking-tight leading-tight"
          >
            Lo Que Dicen Los Artistas
          </h2>
          <p className="font-dmsans text-xs sm:text-sm text-zinc-400">
            Opiniones de cantantes y productores que han grabado y mezclado sus proyectos en La Facultad Studio.
          </p>
        </div>

        <div className="inline-flex items-center gap-2 bg-black/50 px-3.5 py-2 rounded-xl border border-white/10 text-xs font-mono text-zinc-300 self-start sm:self-auto shrink-0">
          <div className="flex text-amber-400" aria-label="5 de 5 estrellas">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            ))}
          </div>
          <span className="font-bold text-white">5.0 / 5.0</span>
        </div>
      </div>

      {/* Grid de 3 tarjetas de testimonios */}
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-4">
        {ARTIST_TESTIMONIALS.map((item) => (
          <article
            key={item.id}
            className="rounded-2xl border border-white/10 bg-[#0f121b]/90 hover:border-amber-400/35 p-5 flex flex-col justify-between gap-4 transition-all shadow-lg"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-0.5 text-amber-400" aria-label={`${item.rating} de 5 estrellas`}>
                  {[...Array(item.rating)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <Quote className="w-4 h-4 text-zinc-600 shrink-0" aria-hidden="true" />
              </div>

              <p className="font-dmsans text-xs sm:text-[13px] text-zinc-200 leading-relaxed">
                “{item.quote}”
              </p>
            </div>

            <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-2 text-xs">
              <div>
                <p className="font-syne font-bold text-white">{item.artistName}</p>
                <p className="font-mono text-[11px] text-amber-300/90 mt-0.5">{item.projectTitle}</p>
              </div>
              {item.isExample && (
                <span className="text-[9px] font-mono uppercase px-2 py-0.5 rounded bg-zinc-800/90 border border-zinc-700 text-zinc-400 shrink-0">
                  Ejemplo
                </span>
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
};
