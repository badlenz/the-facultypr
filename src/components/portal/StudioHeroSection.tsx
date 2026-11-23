import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Calendar, Headphones, Smartphone } from 'lucide-react';
import { BadlenzLogo, LFCrestLogo } from '../BrandingLogos';
import { PackageType, PromoSlotsInfo } from './types';

const HERO_VIDEO_LOOP = [
  {
    src: '/assets/studio/videos/02-hero-session-badlenz.mp4',
    poster: '/assets/studio/hero-session-badlenz.jpg',
    label: 'Badlenz produciendo en sesión real',
  },
  {
    src: '/assets/studio/videos/03-logo-transicion-tv-estudio.mp4',
    poster: '/assets/branding/the-faculty-crest-hd.jpg',
    label: 'Transición del logo The Faculty hacia la TV del estudio',
  },
  {
    src: '/assets/studio/videos/01-hero-logo-faculty.mp4',
    poster: '/assets/studio/hero-logo-faculty.jpg',
    label: 'Control Room de La Facultad Studio con logo The Faculty',
  },
  {
    src: '/assets/studio/videos/09-logo-crest-crimson-pulse.mp4',
    poster: '/assets/branding/the-faculty-crest-hd.jpg',
    label: 'Logo The Faculty con pulso carmesí y dorado',
  },
];

interface StudioHeroSectionProps {
  promoSlotsInfo: PromoSlotsInfo;
  copiedAthPhone: boolean;
  onSelectPackage: (pkg: PackageType) => void;
  onCopyAthPhone: () => void;
}

export const StudioHeroSection: React.FC<StudioHeroSectionProps> = ({
  promoSlotsInfo,
  copiedAthPhone,
  onSelectPackage,
  onCopyAthPhone,
}) => {
  const [heroVideoIndex, setHeroVideoIndex] = useState(0);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const advancingRef = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const advanceToNextClip = useCallback(() => {
    if (advancingRef.current) return;
    advancingRef.current = true;
    setHeroVideoIndex((prev) => {
      const nextIdx = (prev + 1) % HERO_VIDEO_LOOP.length;
      const nextEl = videoRefs.current[nextIdx];
      if (nextEl) {
        nextEl.currentTime = 0;
        nextEl.play().catch(() => {});
      }
      return nextIdx;
    });
    window.setTimeout(() => {
      advancingRef.current = false;
    }, 1100);
  }, []);

  useEffect(() => {
    if (prefersReducedMotion) return;
    const activeEl = videoRefs.current[heroVideoIndex];
    if (activeEl && activeEl.paused) {
      activeEl.play().catch(() => {});
    }
  }, [heroVideoIndex, prefersReducedMotion]);

  return (
    <>
      {/* BANNER OFICIAL DE BIENVENIDA & REAPERTURA 2026 (SPATIAL ANTIGRAVITY DESIGN) */}
      <div className="relative overflow-hidden rounded-3xl border border-amber-500/40 bg-gradient-to-r from-[#1b080d]/90 via-[#100c14]/95 to-[#0b0c10]/95 p-5 sm:p-6 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.8),0_0_35px_rgba(245,158,11,0.18)]">
        {/* Glass Top Edge Light Streak */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-400/60 to-transparent pointer-events-none" />

        {/* Ambient Lighting Orbs */}
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-48 h-48 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-48 h-48 bg-red-600/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-2.5 max-w-3xl">
            {/* Badges Row with Exact Baseline Alignment */}
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 text-white text-[11px] font-black uppercase tracking-wider shadow-md shadow-red-950/50">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-200 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-300"></span>
                </span>
                <span>REAPERTURA OFICIAL</span>
                <span className="bg-black/30 px-1.5 py-0.5 rounded font-sans font-extrabold lining-nums text-amber-200 leading-none">
                  2026
                </span>
              </span>

              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold backdrop-blur-md">
                <span className="text-amber-400">🔥</span>
                <span>
                  Solo{' '}
                  <strong className="font-sans font-black lining-nums text-white bg-amber-500/20 px-1.5 py-0.5 rounded leading-none">
                    6 Cupos
                  </strong>{' '}
                  a
                </span>
                <span className="font-sans font-black text-white lining-nums tracking-tight text-sm leading-none">
                  $130 USD
                </span>
                <span className="text-zinc-400 text-[10px] line-through font-sans lining-nums decoration-red-500 leading-none">
                  (Reg. $200)
                </span>
              </span>
            </div>

            {/* Informative Text with Crisp Lining Numerals */}
            <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed font-sans">
              Tras <span className="font-sans font-bold lining-nums text-zinc-100">10</span> meses de preparación acústica,{' '}
              <strong className="text-white font-semibold">La Facultad Studio</strong> reabre sus puertas en Hormigueros. Separa tu bloque de grabación de{' '}
              <span className="font-sans font-bold lining-nums text-zinc-100">4</span> horas (con premezcla el mismo día y máster WAV 24-bit) con solo{' '}
              <strong className="text-amber-300 font-sans font-black lining-nums">$50 USD</strong> de depósito vía ATH Móvil.
            </p>
          </div>

          {/* Spatial Button with Perfectly Aligned Micro-Pill */}
          <div className="flex items-center shrink-0">
            <button
              type="button"
              onClick={() => {
                onSelectPackage('promo');
                document.getElementById('seccion-calendario-booking')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="group relative w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-500 to-red-500 hover:from-amber-300 hover:to-red-400 text-gray-950 font-syne font-black text-xs uppercase tracking-wider transition-all duration-300 shadow-[0_10px_30px_rgba(245,158,11,0.35)] hover:shadow-[0_15px_40px_rgba(245,158,11,0.5)] hover:-translate-y-0.5 active:translate-y-0 active:scale-95 cursor-pointer"
            >
              <span>Aprovechar</span>
              <span className="inline-flex items-center justify-center bg-gray-950 text-amber-300 font-sans font-black text-xs lining-nums px-2 py-0.5 rounded-lg border border-amber-400/40 shadow-inner leading-none">
                $130
              </span>
              <span>&amp; Elegir Fecha</span>
              <span className="transition-transform duration-300 group-hover:translate-x-1">➔</span>
            </button>
          </div>
        </div>
      </div>

      {/* 1. MASTER STUDIO HERO (URBAN BOUTIQUE RECORDING STUDIO) */}
      <div className="relative overflow-hidden rounded-3xl border border-zinc-800/90 bg-gradient-to-br from-[#19080c] via-[#120d08] to-[#07080c] p-6 sm:p-10 shadow-2xl space-y-7">
        {/* Ambient Studio Lighting Glows (Warm Red/Amber on left, Dark on right for video) */}
        <div className="absolute -top-16 -left-16 w-[420px] h-[420px] bg-red-600/20 rounded-full blur-[130px] pointer-events-none" />
        <div className="absolute -bottom-20 left-1/4 w-[380px] h-[380px] bg-amber-500/15 rounded-full blur-[120px] pointer-events-none" />

        {/* Full-Bleed Studio Video Loop with Soft Radial Mask (zero hard cut/box) */}
        <div
          className="absolute inset-0 pointer-events-none overflow-hidden select-none z-0"
          style={{
            WebkitMaskImage:
              'radial-gradient(ellipse 78% 90% at 76% 50%, rgba(0,0,0,1) 22%, rgba(0,0,0,0.5) 54%, transparent 86%)',
            maskImage:
              'radial-gradient(ellipse 78% 90% at 76% 50%, rgba(0,0,0,1) 22%, rgba(0,0,0,0.5) 54%, transparent 86%)',
          }}
          aria-hidden="true"
        >
          {prefersReducedMotion ? (
            <img
              src="/assets/studio/hero-logo-faculty.jpg"
              alt="La Facultad Studio · Control Room con logo The Faculty"
              className="w-full h-full object-cover object-center sm:object-[68%_center] opacity-60"
            />
          ) : (
            HERO_VIDEO_LOOP.map((clip, idx) => {
              const isActive = idx === heroVideoIndex;
              return (
                <video
                  key={clip.src}
                  ref={(el) => {
                    videoRefs.current[idx] = el;
                  }}
                  src={clip.src}
                  poster={clip.poster}
                  autoPlay={idx === 0}
                  muted
                  playsInline
                  preload="auto"
                  onTimeUpdate={(e) => {
                    if (!isActive) return;
                    const v = e.currentTarget;
                    if (v.duration && v.duration - v.currentTime <= 0.9) {
                      advanceToNextClip();
                    }
                  }}
                  onEnded={() => {
                    if (isActive) advanceToNextClip();
                  }}
                  aria-label={clip.label}
                  className={`absolute inset-0 w-full h-full object-cover object-center sm:object-[68%_center] transition-opacity duration-1000 ease-in-out ${
                    isActive ? 'opacity-65 sm:opacity-75 z-[1]' : 'opacity-0 z-0'
                  }`}
                />
              );
            })
          )}
        </div>

        {/* Top Bar: Dual Branding + Live Equalizer Status */}
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-4 border-b border-zinc-800/80 pb-5">
          <div className="flex items-center gap-3">
            <LFCrestLogo size="md" />
            <div>
              <span className="text-[10px] font-mono text-red-500 font-bold uppercase tracking-widest block">
                La Facultad Studio
              </span>
              <span className="text-xs font-bold text-white tracking-wide">
                Hormigueros, Puerto Rico
              </span>
            </div>
          </div>

          {/* Live Studio Status (clean, sin ícono extra) */}
          <div className="flex items-center bg-zinc-950/80 border border-zinc-800/90 px-3.5 py-1.5 rounded-2xl">
            <div className="text-[11px] font-mono">
              <span className="font-bold text-emerald-400 uppercase tracking-wider block">
                ● On Air · Sesiones Activas
              </span>
              <span className="text-zinc-400 text-[10px]">
                Studio Acústico &amp; Control Room
              </span>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-2">
            <BadlenzLogo size="md" />
          </div>
        </div>

        {/* Slogan pill from official contracts */}
        <div className="relative z-10 inline-flex items-center bg-gradient-to-r from-red-950/50 to-amber-950/30 border border-red-700/40 px-3.5 py-1.5 rounded-full text-xs">
          <span className="italic font-medium text-amber-200">
            “Transformando tu visión en sonido profesional.”
          </span>
        </div>

        {/* Main Statement */}
        <div className="relative z-10 space-y-3 max-w-3xl">
          <h1 className="font-syne font-bold text-3xl sm:text-5xl lg:text-6xl text-white uppercase leading-[0.95] tracking-tight">
            Tu canción. <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-rose-400 to-amber-400">
              Tu sonido terminado.
            </span>
          </h1>
          <p className="font-dmsans text-sm sm:text-base text-zinc-300 leading-relaxed max-w-2xl pt-1">
            Estudio de grabación vocal, afinación en vivo, mezcla multitrack y master comercial dirigido por{' '}
            <strong>Badlenz</strong>. Acústica tratada, monitoreo analógico sin latencia y entrega WAV 24-bit listo para Spotify y Apple Music. Separa tu fecha con solo{' '}
            <strong>$50 USD</strong> de depósito vía ATH Móvil.
          </p>
        </div>

        {/* Action Row & Live Reopening Offer */}
        <div className="relative z-10 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 pt-2">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <button
              type="button"
              onClick={() => {
                document.getElementById('tarifas-estudio')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="taste-btn min-h-[48px] px-7 py-3.5 rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-syne font-extrabold text-sm uppercase tracking-wider shadow-[0_12px_32px_rgba(220,38,38,0.45)] hover:shadow-[0_16px_40px_rgba(220,38,38,0.6)] cursor-pointer flex items-center justify-center gap-2"
            >
              <Calendar className="w-4 h-4" />
              <span>Reservar Sesión ($50 Depósito) →</span>
            </button>

            <button
              type="button"
              onClick={() => {
                document.getElementById('seccion-muestras-ab')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="taste-btn min-h-[48px] px-5 py-3.5 rounded-2xl bg-zinc-900/90 hover:bg-zinc-800 text-zinc-100 border border-zinc-700/80 hover:border-amber-400/60 font-syne font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer"
            >
              <Headphones className="w-4 h-4 text-amber-400" />
              <span>Escuchar Sonido A/B</span>
            </button>

            <button
              type="button"
              onClick={onCopyAthPhone}
              className="taste-btn min-h-[48px] px-4 py-3 rounded-2xl bg-black/50 hover:bg-zinc-900 text-zinc-300 hover:text-white border border-zinc-800 font-mono text-xs flex items-center justify-center gap-2 cursor-pointer"
              title="Copiar número de ATH Móvil"
            >
              <Smartphone className="w-4 h-4 text-amber-400" />
              <span>{copiedAthPhone ? '¡Copiado!' : 'ATH · Stripe · PayPal'}</span>
            </button>
          </div>

          {/* Reopening Promo Badge */}
          <div className="bg-[#12141c]/95 border border-red-900/50 p-3 rounded-2xl flex items-center justify-between sm:justify-start gap-3.5 shrink-0 shadow-lg">
            <div>
              <span className="text-[10px] font-mono text-red-400 font-bold uppercase tracking-wider block">
                Promo Reapertura ($130 USD)
              </span>
              <span className="text-xs text-zinc-200 font-medium tabular-nums">
                {promoSlotsInfo.disponibles > 0
                  ? `Quedan ${promoSlotsInfo.disponibles} de 6 turnos`
                  : 'Cupos de reapertura agotados'}
              </span>
            </div>
            <button
              type="button"
              onClick={() => onSelectPackage('promo')}
              className="taste-btn min-h-[40px] text-xs bg-red-600/25 hover:bg-red-600/40 text-red-200 border border-red-500/50 font-bold px-3.5 py-2 rounded-xl cursor-pointer whitespace-nowrap"
            >
              Elegir Promo
            </button>
          </div>
        </div>

        {/* 3 Pillars of Credibility */}
        <div className="relative z-10 grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-zinc-800/80 text-xs">
          <div className="taste-card bg-[#0f1117]/80 p-3.5 rounded-xl border border-zinc-800 hover:border-red-500/40">
            <span className="text-red-400 font-mono text-[10px] uppercase font-bold block">01 · Dirección Vocal 1 a 1</span>
            <strong className="text-white block mt-0.5 text-xs">Vocal Coaching en Sesión</strong>
            <p className="text-zinc-400 text-[11px] mt-0.5 leading-snug">
              Badlenz te guía en cada toma, respiración y entonación para que tu voz suene con máxima presencia y energía.
            </p>
          </div>

          <div className="taste-card bg-[#0f1117]/80 p-3.5 rounded-xl border border-zinc-800 hover:border-amber-500/40">
            <span className="text-amber-400 font-mono text-[10px] uppercase font-bold block">02 · Previo &amp; Latencia</span>
            <strong className="text-white block mt-0.5 text-xs">Universal Audio Apollo</strong>
            <p className="text-zinc-400 text-[11px] mt-0.5 leading-snug">
              Emulación analógica Neve &amp; SSL con monitoreo en audífonos en tiempo real sin retraso.
            </p>
          </div>

          <div className="taste-card bg-[#0f1117]/80 p-3.5 rounded-xl border border-zinc-800 hover:border-emerald-500/40">
            <span className="text-emerald-400 font-mono text-[10px] uppercase font-bold block">03 · Reserva Garantizada</span>
            <strong className="text-white block mt-0.5 text-xs">$50 Depósito ATH Móvil</strong>
            <p className="text-zinc-400 text-[11px] mt-0.5 leading-snug">
              Sin trámites ni papeleo: bloqueas tu turno oficial y pagas el saldo al llegar al studio.
            </p>
          </div>
        </div>
      </div>
    </>
  );
};
