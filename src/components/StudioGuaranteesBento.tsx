import React, { useState } from 'react';
import { Clock, ShieldCheck, Headphones, Zap, Sparkles, Copy, Check, CalendarX2, MessageCircle } from 'lucide-react';
import { BadlenzLogo, LFCrestLogo } from './BrandingLogos';

export const StudioGuaranteesBento: React.FC = () => {
  const [copiedAth, setCopiedAth] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    e.currentTarget.style.setProperty('--mouse-x', `${x}px`);
    e.currentTarget.style.setProperty('--mouse-y', `${y}px`);
  };

  const handleScrollToBooking = () => {
    document.getElementById('seccion-calendario-booking')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleCopyAth = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText('7872408627');
    setCopiedAth(true);
    setTimeout(() => setCopiedAth(false), 2200);
  };

  return (
    <section
      aria-labelledby="estandares-estudio-heading"
      className="relative overflow-hidden rounded-3xl border border-white/10 antigravity-glass-panel p-5 sm:p-8 space-y-6 shadow-[0_30px_70px_rgba(0,0,0,0.75)]"
    >
      {/* Top Specular Glass Highlight Streak */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent pointer-events-none" />

      {/* Background ambient radial glow */}
      <div className="absolute -top-20 right-1/4 w-96 h-96 bg-red-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-20 left-10 w-80 h-80 bg-amber-500/08 rounded-full blur-[110px] pointer-events-none" />

      {/* Header bar with Badlenz signature & Faculty crest */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/10 pb-5">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/10 border border-red-500/30 text-[10px] font-mono text-red-400 font-bold uppercase tracking-widest">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
              <span>Estándares Oficiales de Estudio</span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-[10px] font-mono text-amber-300 font-bold uppercase tracking-wider">
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>Garantía Badlenz</span>
            </span>
          </div>

          <div className="flex items-center gap-3 pt-0.5">
            <LFCrestLogo size="sm" />
            <div>
              <h2
                id="estandares-estudio-heading"
                className="font-syne text-2xl sm:text-3xl font-bold text-white tracking-tight leading-tight"
              >
                Condiciones y Garantías de Sesión
              </h2>
              <p className="font-dmsans text-xs sm:text-sm text-zinc-400 mt-0.5">
                <span className="italic text-zinc-200 font-medium">“Transformando tu visión en sonido profesional.”</span>{' '}
                <span>Términos reales de operación: cero tiempo perdido en tu sesión y entrega veloz.</span>
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 self-start md:self-auto bg-zinc-950/80 border border-white/10 px-3.5 py-2 rounded-2xl backdrop-blur-md shrink-0">
          <BadlenzLogo size="sm" />
          <div className="text-[11px] font-mono leading-tight border-l border-white/10 pl-3">
            <span className="text-emerald-400 font-bold uppercase block text-[10px]">Operación Oficial</span>
            <span className="text-zinc-300">Hormigueros, PR</span>
          </div>
        </div>
      </div>

      {/* 4 Core Operational Standards Cards — Equal Edges & Spatial Spotlight */}
      <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Standard 1: Entrega Rápida Premezcla + Master */}
        <div
          role="button"
          tabIndex={0}
          onClick={handleScrollToBooking}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleScrollToBooking();
            }
          }}
          onMouseMove={handleMouseMove}
          className="group fx-spotlight-card antigravity-glass-card taste-card bg-[#0f121b]/90 border border-white/10 hover:border-red-500/50 p-5 rounded-2xl flex flex-col justify-between space-y-4 cursor-pointer"
        >
          <div className="space-y-3 relative z-10">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-400">
                <Clock className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-mono font-bold text-red-400/90 bg-red-950/50 border border-red-800/40 px-2.5 py-0.5 rounded-full uppercase">
                01 · Tiempos de Entrega
              </span>
            </div>

            <div>
              <h3 className="font-syne font-bold text-white text-base leading-snug">
                Premezcla Hoy • Máster en 24–48h
              </h3>
              <p className="font-dmsans text-zinc-400 text-xs mt-1.5 leading-relaxed">
                Te llevas una premezcla (Rough Mix) al terminar tu bloque de 4–5h. El máster final comercial WAV 24-bit se entrega en 24 a 48 horas.
              </p>
            </div>
          </div>

          <div className="pt-3 border-t border-white/10 flex items-center justify-between text-[11px] font-mono relative z-10">
            <span className="text-zinc-400">Máster Voces</span>
            <span className="text-red-400 font-bold lining-nums">24 a 48 horas</span>
          </div>
        </div>

        {/* Standard 2: 2 Revisiones Gratis */}
        <div
          role="button"
          tabIndex={0}
          onClick={handleScrollToBooking}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleScrollToBooking();
            }
          }}
          onMouseMove={handleMouseMove}
          className="group fx-spotlight-card antigravity-glass-card taste-card bg-[#0f121b]/90 border border-white/10 hover:border-emerald-500/50 p-5 rounded-2xl flex flex-col justify-between space-y-4 cursor-pointer"
        >
          <div className="space-y-3 relative z-10">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Headphones className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-mono font-bold text-emerald-400/90 bg-emerald-950/50 border border-emerald-800/40 px-2.5 py-0.5 rounded-full uppercase">
                02 · Calidad Garantizada
              </span>
            </div>

            <div>
              <h3 className="font-syne font-bold text-white text-base leading-snug">
                2 Revisiones Gratis Incluidas
              </h3>
              <p className="font-dmsans text-zinc-400 text-xs mt-1.5 leading-relaxed">
                2 rondas de ajustes finos sin costo para calibrar balance, efectos y máster comercial. (3ra revisión en adelante: $10 USD c/u).
              </p>
            </div>
          </div>

          <div className="pt-3 border-t border-white/10 flex items-center justify-between text-[11px] font-mono relative z-10">
            <span className="text-zinc-400">Incluidas</span>
            <span className="text-emerald-400 font-bold lining-nums">2 Revisiones 100% Gratis</span>
          </div>
        </div>

        {/* Standard 3: Pro Tools Fast-Pass */}
        <div
          role="button"
          tabIndex={0}
          onClick={handleScrollToBooking}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleScrollToBooking();
            }
          }}
          onMouseMove={handleMouseMove}
          className="group fx-spotlight-card antigravity-glass-card taste-card bg-[#0f121b]/90 border border-white/10 hover:border-amber-500/50 p-5 rounded-2xl flex flex-col justify-between space-y-4 cursor-pointer"
        >
          <div className="space-y-3 relative z-10">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Zap className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-mono font-bold text-amber-300 bg-amber-950/50 border border-amber-800/40 px-2.5 py-0.5 rounded-full uppercase">
                03 · Eficiencia en Sesión
              </span>
            </div>

            <div>
              <h3 className="font-syne font-bold text-white text-base leading-snug">
                Pro Tools Fast-Pass
              </h3>
              <p className="font-dmsans text-zinc-400 text-xs mt-1.5 leading-relaxed">
                Sube tu beat o pega el enlace al reservar. Badlenz pre-configura el BPM y la escala de Auto-Tune antes de que llegues al studio.
              </p>
            </div>
          </div>

          <div className="pt-3 border-t border-white/10 flex items-center justify-between text-[11px] font-mono relative z-10">
            <span className="text-zinc-400">Tiempo perdido</span>
            <span className="text-amber-400 font-bold lining-nums">0 minutos</span>
          </div>
        </div>

        {/* Standard 4: Depósito $50 ATH Móvil */}
        <div
          role="button"
          tabIndex={0}
          onClick={handleScrollToBooking}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleScrollToBooking();
            }
          }}
          onMouseMove={handleMouseMove}
          className="group fx-spotlight-card antigravity-glass-card taste-card bg-[#0f121b]/90 border border-white/10 hover:border-rose-500/50 p-5 rounded-2xl flex flex-col justify-between space-y-4 cursor-pointer"
        >
          <div className="space-y-3 relative z-10">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-mono font-bold text-rose-300 bg-rose-950/50 border border-rose-800/40 px-2.5 py-0.5 rounded-full uppercase">
                04 · Reserva de Fecha
              </span>
            </div>

            <div>
              <h3 className="font-syne font-bold text-white text-base leading-snug">
                Aparta con Depósito $50
              </h3>
              <p className="font-dmsans text-zinc-400 text-xs mt-1.5 leading-relaxed">
                Envía tus $50 USD de depósito por ATH Móvil para sesiones de grabación. Tu bloque de 4 a 5 horas queda congelado para tu proyecto.
              </p>
            </div>
          </div>

          <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-2 text-[11px] font-mono relative z-10">
            <span className="text-zinc-400">ATH Móvil</span>
            <button
              type="button"
              onClick={handleCopyAth}
              className="taste-btn inline-flex items-center gap-1.5 text-white hover:text-amber-300 font-bold bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 px-2.5 py-1 rounded-lg transition cursor-pointer lining-nums"
              title="Copiar número de ATH Móvil"
            >
              {copiedAth ? (
                <>
                  <Check className="w-3 h-3 text-emerald-400" />
                  <span className="text-emerald-300">¡Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3 text-amber-400" />
                  <span>(787) 240-8627</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Standard 5: Política Oficial de Cancelación, Reagendación y No-Show */}
      <div className="relative z-10 rounded-2xl bg-[#0c0f18]/95 border border-amber-500/25 p-5 sm:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-2 max-w-4xl">
          <div className="flex flex-wrap items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <CalendarX2 className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-mono font-bold text-amber-300 bg-amber-950/50 border border-amber-800/40 px-2.5 py-0.5 rounded-full uppercase">
              05 · Política de Depósito
            </span>
            <h3 className="font-syne font-bold text-white text-base sm:text-lg leading-snug">
              Cancelación, Reagendación y No-Show
            </h3>
          </div>

          <div className="font-dmsans text-zinc-300 text-xs sm:text-[13px] leading-relaxed space-y-1.5 pl-0 sm:pl-10">
            <p>
              Tu bloque de 4–5 horas queda reservado exclusivamente para tu proyecto desde el momento en que se confirma tu depósito.
            </p>
            <p>
              <strong className="text-emerald-300">Si cancelas o reagendas con 48 horas o más de anticipación</strong>, tu depósito se devuelve completo o se aplica a tu nueva fecha, sin penalidad.
            </p>
            <p>
              <strong className="text-rose-300">Si cancelas con menos de 48 horas de anticipación, o no te presentas a tu sesión (no-show)</strong>, el depósito no es reembolsable: tu bloque quedó apartado para ti y no se pudo ofrecer a otro artista.
            </p>
          </div>
        </div>

        <div className="shrink-0 pl-0 sm:pl-10 lg:pl-0">
          <a
            href="https://wa.me/17872408627?text=%C2%A1Saludos%20Badlenz!%20Necesito%20consultar%20o%20reagendar%20mi%20sesi%C3%B3n%20en%20La%20Facultad%20Studio."
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#25D366]/15 hover:bg-[#25D366]/25 border border-[#25D366]/45 text-emerald-300 font-mono font-bold text-xs transition"
          >
            <MessageCircle className="w-4 h-4 text-[#25D366]" />
            <span>WhatsApp (787) 240-8627</span>
          </a>
        </div>
      </div>
    </section>
  );
};
