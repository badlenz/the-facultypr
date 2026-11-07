import React from 'react';
import { Clock, ShieldCheck, Headphones, Zap, Sparkles } from 'lucide-react';
import { BadlenzLogo, LFCrestLogo } from './BrandingLogos';

export const StudioGuaranteesBento: React.FC = () => {
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    e.currentTarget.style.setProperty('--mouse-x', `${x}px`);
    e.currentTarget.style.setProperty('--mouse-y', `${y}px`);
  };

  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/10 antigravity-glass-panel p-6 sm:p-8 space-y-6 shadow-[0_30px_70px_rgba(0,0,0,0.7)]">
      {/* Background ambient radial glow */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-red-600/10 rounded-full blur-[110px] pointer-events-none" />
      <div className="absolute bottom-0 left-10 w-80 h-80 bg-amber-500/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Header bar with Badlenz signature & Faculty crest */}
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800/80 pb-5">
        <div className="flex items-center gap-3">
          <LFCrestLogo size="sm" />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-red-500 font-bold uppercase tracking-widest">
                Estándares Oficiales de Estudio
              </span>
              <span className="inline-block w-1 h-1 rounded-full bg-zinc-600" />
              <span className="text-[10px] font-mono text-amber-400 font-bold uppercase tracking-wider">
                Garantía Badlenz
              </span>
            </div>
            <h2 className="font-syne text-xl sm:text-2xl font-bold text-white tracking-tight mt-0.5">
              Condiciones y Garantías de Sesión
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto bg-zinc-950/70 border border-zinc-800 px-3.5 py-1.5 rounded-xl">
          <BadlenzLogo size="sm" />
          <span className="text-[11px] font-mono text-zinc-300">
            Hormigueros, PR
          </span>
        </div>
      </div>

      {/* Slogan Banner from Official Document */}
      <div className="relative z-10 bg-gradient-to-r from-red-950/40 via-zinc-900/60 to-amber-950/30 border border-red-900/30 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
          <p className="font-dmsans text-zinc-200">
            <span className="italic font-medium text-white">“Transformando tu visión en sonido profesional.”</span>
            <span className="text-zinc-400 block sm:inline sm:ml-2 text-[11px]">
              Términos reales de operación: cero tiempo perdido en cabina y entrega veloz.
            </span>
          </p>
        </div>
        <span className="text-[10px] font-mono uppercase font-bold text-amber-400 bg-black/50 border border-zinc-800 px-2.5 py-1 rounded-lg self-start sm:self-auto shrink-0">
          Operación Oficial
        </span>
      </div>

      {/* 4 Core Operational Standards Cards with Spotlight Cursor Interaction */}
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Standard 1: Entrega Rápida Premezcla + Master */}
        <div 
          onMouseMove={handleMouseMove}
          className="group fx-spotlight-card antigravity-glass-card border border-white/10 hover:border-red-500/60 p-4 sm:p-5 rounded-2xl flex flex-col justify-between space-y-3 cursor-pointer shadow-xl transition-all"
        >
          <div className="space-y-2 relative z-10">
            <div className="w-9 h-9 rounded-xl bg-red-600/15 border border-red-500/30 flex items-center justify-center text-red-400 group-hover:scale-105 transition-transform">
              <Clock className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-mono uppercase text-zinc-500 font-bold block">
              Tiempos de Entrega
            </span>
            <h3 className="font-dmsans font-bold text-white text-sm">
              Premezcla Hoy • Master en 24-48h
            </h3>
            <p className="text-zinc-400 text-xs leading-relaxed">
              Te llevas una premezcla al terminar tu bloque (4–5h). El master final comercial se entrega en 24 a 48 horas.
            </p>
          </div>
          <div className="pt-2 border-t border-zinc-900 flex items-center justify-between text-[11px] font-mono text-zinc-500 relative z-10">
            <span>Master Voces</span>
            <span className="text-red-400 font-bold">24 a 48 horas</span>
          </div>
        </div>

        {/* Standard 2: 2 Revisiones Gratis */}
        <div 
          onMouseMove={handleMouseMove}
          className="group fx-spotlight-card antigravity-glass-card border border-white/10 hover:border-emerald-500/60 p-4 sm:p-5 rounded-2xl flex flex-col justify-between space-y-3 cursor-pointer shadow-xl transition-all"
        >
          <div className="space-y-2 relative z-10">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform">
              <Headphones className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-mono uppercase text-zinc-500 font-bold block">
              Calidad Garantizada
            </span>
            <h3 className="font-dmsans font-bold text-white text-sm">
              2 Revisiones Gratis Incluidas
            </h3>
            <p className="text-zinc-400 text-xs leading-relaxed">
              2 rondas de ajustes finos sin costo para calibrar balance, efectos y máster. (Revisiones 3+ con tarifa adicional).
            </p>
          </div>
          <div className="pt-2 border-t border-zinc-900 flex items-center justify-between text-[11px] font-mono text-zinc-500 relative z-10">
            <span>Incluidas</span>
            <span className="text-emerald-400 font-bold">2 Revisiones 100% Gratis</span>
          </div>
        </div>

        {/* Standard 3: Pro Tools Fast-Pass */}
        <div 
          onMouseMove={handleMouseMove}
          className="group fx-spotlight-card antigravity-glass-card border border-white/10 hover:border-amber-500/60 p-4 sm:p-5 rounded-2xl flex flex-col justify-between space-y-3 cursor-pointer shadow-xl transition-all"
        >
          <div className="space-y-2 relative z-10">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 group-hover:scale-105 transition-transform">
              <Zap className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-mono uppercase text-zinc-500 font-bold block">
              Eficiencia en Cabina
            </span>
            <h3 className="font-dmsans font-bold text-white text-sm">
              Pro Tools Fast-Pass
            </h3>
            <p className="text-zinc-400 text-xs leading-relaxed">
              Sube tu beat o pega el enlace al reservar. Badlenz pre-configura el BPM y la escala de Auto-Tune antes de que llegues.
            </p>
          </div>
          <div className="pt-2 border-t border-zinc-900 flex items-center justify-between text-[11px] font-mono text-zinc-500 relative z-10">
            <span>Tiempo perdido</span>
            <span className="text-amber-400 font-bold">0 minutos</span>
          </div>
        </div>

        {/* Standard 4: Depósito $130 ATH Móvil */}
        <div 
          onMouseMove={handleMouseMove}
          className="group fx-spotlight-card antigravity-glass-card border border-white/10 hover:border-red-500/60 p-4 sm:p-5 rounded-2xl flex flex-col justify-between space-y-3 cursor-pointer shadow-xl transition-all"
        >
          <div className="space-y-2 relative z-10">
            <div className="w-9 h-9 rounded-xl bg-red-950/40 border border-red-800/40 flex items-center justify-center text-red-400 group-hover:scale-105 transition-transform">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-mono uppercase text-zinc-500 font-bold block">
              Reserva de Fecha
            </span>
            <h3 className="font-dmsans font-bold text-white text-sm">
              Aparta con Depósito $130
            </h3>
            <p className="text-zinc-400 text-xs leading-relaxed">
              Envía tu depósito por ATH Móvil. Tu bloque de 4 a 5 horas queda congelado exclusivamente para tu proyecto.
            </p>
          </div>
          <div className="pt-2 border-t border-zinc-900 flex items-center justify-between text-[11px] font-mono text-zinc-500 relative z-10">
            <span>Método favorito</span>
            <span className="text-white font-bold">ATH Móvil (787) 240-8627</span>
          </div>
        </div>
      </div>
    </div>
  );
};
