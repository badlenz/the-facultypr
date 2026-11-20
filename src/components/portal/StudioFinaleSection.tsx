import React from 'react';

export const StudioFinaleSection: React.FC = () => {
  return (
    <section
      data-badlenz-finale="true"
      aria-label="Cierre oficial Badlenz · La Facultad Studio"
      className="relative min-h-[72vh] sm:min-h-[82vh] flex flex-col items-center justify-end pb-12 sm:pb-16 pt-16 text-center pointer-events-none"
    >
      <div className="pointer-events-auto relative z-10 w-full max-w-2xl mx-auto px-4 space-y-3">
        <div className="h-px w-full bg-gradient-to-r from-transparent via-amber-400/40 to-transparent" />
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
          <div className="text-center sm:text-left">
            <p className="font-syne font-extrabold text-xs sm:text-sm uppercase tracking-[0.18em] text-white">
              LA FACULTAD <span className="text-red-500">STUDIO</span> · PROD.{' '}
              <span className="text-amber-400">BADLENZ</span>
            </p>
            <p className="font-mono text-[10px] sm:text-[11px] text-zinc-400 tracking-wider mt-0.5">
              HORMIGUEROS, PUERTO RICO · GRABACIÓN · MEZCLA · MÁSTER
            </p>
          </div>

          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="taste-btn px-3.5 py-2 rounded-xl bg-black/60 hover:bg-zinc-900/90 border border-white/15 hover:border-amber-400/50 text-[11px] font-mono font-bold text-zinc-200 hover:text-amber-200 transition cursor-pointer backdrop-blur-md whitespace-nowrap shrink-0"
          >
            ↑ Volver arriba
          </button>
        </div>
      </div>
    </section>
  );
};
