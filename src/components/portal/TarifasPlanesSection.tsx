import React from 'react';
import { Check, DollarSign, Flame, Smartphone } from 'lucide-react';
import { ScrollReveal } from '../ScrollReveal';
import { PackageType, PromoSlotsInfo } from './types';

interface TarifasPlanesSectionProps {
  selectedPackage: PackageType | null;
  promoSlotsInfo: PromoSlotsInfo;
  onSelectPackage: (pkg: PackageType) => void;
}

const handleSpotlightMove = (e: React.MouseEvent<HTMLDivElement>) => {
  const rect = e.currentTarget.getBoundingClientRect();
  e.currentTarget.style.setProperty('--mouse-x', `${e.clientX - rect.left}px`);
  e.currentTarget.style.setProperty('--mouse-y', `${e.clientY - rect.top}px`);
};

export const TarifasPlanesSection: React.FC<TarifasPlanesSectionProps> = ({
  selectedPackage,
  promoSlotsInfo,
  onSelectPackage,
}) => {
  const handleKeySelect = (pkg: PackageType) => (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelectPackage(pkg);
    }
  };

  return (
    <ScrollReveal delayMs={60}>
      <section
        id="tarifas-estudio"
        aria-labelledby="tarifas-estudio-heading"
        className="antigravity-glass-panel relative overflow-hidden border border-white/10 p-5 sm:p-8 rounded-3xl space-y-6 shadow-[0_30px_70px_rgba(0,0,0,0.75)] scroll-mt-24"
      >
        {/* Top Specular Glass Highlight Streak */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent pointer-events-none" />
        <div className="absolute -top-24 right-1/4 w-96 h-96 bg-red-600/10 rounded-full blur-[130px] pointer-events-none" />
        <div className="absolute -bottom-24 left-1/4 w-96 h-96 bg-amber-500/08 rounded-full blur-[130px] pointer-events-none" />

        {/* Section Header */}
        <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/10 pb-5">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/10 mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
              <span className="text-[10px] font-mono text-zinc-300 font-bold uppercase tracking-[0.18em]">
                Tarifario Oficial · La Facultad Studio
              </span>
            </div>
            <h2
              id="tarifas-estudio-heading"
              className="font-syne text-2xl sm:text-3xl font-bold text-white tracking-tight leading-tight"
            >
              Planes de Grabación &amp; Producción
            </h2>
            <p className="font-dmsans text-xs sm:text-sm text-zinc-400 mt-1 max-w-2xl">
              Selecciona tu plan para bloquear tu turno en el calendario. Todos los planes incluyen monitoreo analógico sin latencia, entrega en WAV 24-bit y 2 revisiones de mezcla sin cargo.
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-start md:self-auto bg-zinc-950/80 border border-white/10 px-3.5 py-2 rounded-2xl backdrop-blur-md">
            <Smartphone className="w-4 h-4 text-amber-400 shrink-0" />
            <div className="text-[11px] font-mono leading-tight">
              <span className="text-zinc-400 block text-[10px] uppercase">Reserva Directa ATH Móvil</span>
              <strong className="text-white lining-nums">Desde $50 USD de depósito</strong>
            </div>
          </div>
        </div>

        {/* DESTACADO ESPACIAL: PROMO REAPERTURA ($130 USD) */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => onSelectPackage('promo')}
          onKeyDown={handleKeySelect('promo')}
          onMouseMove={handleSpotlightMove}
          className={`fx-spotlight-card antigravity-glass-card taste-card relative z-10 p-5 sm:p-6 rounded-2xl border cursor-pointer transition-all ${
            selectedPackage === 'promo'
              ? 'bg-gradient-to-r from-[#1c1018]/95 via-[#141622]/95 to-[#181210]/95 border-rose-500 ring-1 ring-rose-500/50 shadow-[0_24px_50px_rgba(225,29,72,0.22)]'
              : 'bg-gradient-to-r from-[#140d13]/90 via-[#10131d]/90 to-[#121016]/90 border-white/10 hover:border-rose-500/50'
          }`}
        >
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
            <div className="space-y-3 max-w-2xl">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 text-[10px] uppercase font-mono font-bold bg-rose-500/20 text-rose-200 border border-rose-500/40 px-2.5 py-1 rounded-full">
                  <Flame className="w-3 h-3 text-rose-400" />
                  <span>Promo Reapertura · 35% OFF</span>
                </span>

                <span
                  className={`inline-flex items-center gap-1.5 text-[10px] font-mono font-bold px-2.5 py-1 rounded-full border ${
                    promoSlotsInfo.disponibles > 0
                      ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700/50'
                      : 'bg-red-950/80 text-red-300 border-red-700/50'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>
                    {promoSlotsInfo.disponibles > 0
                      ? `Cupos disponibles: ${promoSlotsInfo.disponibles} de 6`
                      : 'Cupos agotados'}
                  </span>
                </span>

                {selectedPackage === 'promo' && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-400/40 px-2.5 py-1 rounded-full">
                    <Check className="w-3 h-3" /> Plan Seleccionado
                  </span>
                )}
              </div>

              <div>
                <h3 className="font-syne text-lg sm:text-xl font-bold text-white tracking-tight">
                  Promo Reapertura — Canción Completa Terminada
                </h3>
                <p className="font-dmsans text-xs sm:text-sm text-zinc-300 mt-1 leading-relaxed">
                  Bloque oficial de 4 horas de grabación vocal con dirección de Badlenz, afinación Melodyne en vivo, premezcla entregada al salir del estudio y mezcla + máster comercial WAV 24-bit en 24 a 48 horas.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-0.5 text-[11px] font-mono text-zinc-300">
                <span className="bg-black/45 border border-white/10 px-2.5 py-1 rounded-lg">✓ 4h de Sesión</span>
                <span className="bg-black/45 border border-white/10 px-2.5 py-1 rounded-lg">✓ Rough Mix el Mismo Día</span>
                <span className="bg-black/45 border border-white/10 px-2.5 py-1 rounded-lg">✓ Mezcla + Máster WAV 24-bit</span>
                <span className="bg-black/45 border border-white/10 px-2.5 py-1 rounded-lg">✓ 2 Revisiones Gratis</span>
              </div>
            </div>

            <div className="flex flex-row lg:flex-col items-center lg:items-end justify-between gap-4 pt-3 lg:pt-0 border-t lg:border-t-0 lg:border-l border-white/10 lg:pl-6 shrink-0">
              <div className="text-left lg:text-right">
                <div className="flex items-baseline lg:justify-end gap-2">
                  <span className="text-xs font-mono text-zinc-500 line-through lining-nums">$200</span>
                  <span className="font-syne text-2xl sm:text-3xl font-extrabold text-white lining-nums tracking-tight">$130</span>
                  <span className="text-xs font-mono text-zinc-400">USD</span>
                </div>
                <span className="text-[11px] font-mono text-zinc-400 block mt-0.5">
                  Depósito ATH: <strong className="text-amber-300 font-bold lining-nums">$50 USD</strong>
                </span>
              </div>

              <span
                className={`taste-btn inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-dmsans font-bold transition ${
                  selectedPackage === 'promo'
                    ? 'bg-rose-600 text-white shadow-lg shadow-rose-950/60'
                    : 'bg-white/10 hover:bg-rose-600 text-white border border-white/15'
                }`}
              >
                <span>{selectedPackage === 'promo' ? 'Plan Activo' : 'Elegir Promo'}</span>
                <span>→</span>
              </span>
            </div>
          </div>
        </div>

        {/* CUADRÍCULA SIMÉTRICA DE 4 PLANES PRINCIPALES */}
        <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Plan 1: Grabación, Mezcla & Master ($200 USD) */}
          <div
            role="button"
            tabIndex={0}
            onClick={() => onSelectPackage('pro')}
            onKeyDown={handleKeySelect('pro')}
            onMouseMove={handleSpotlightMove}
            className={`fx-spotlight-card antigravity-glass-card taste-card p-5 rounded-2xl border cursor-pointer flex flex-col justify-between ${
              selectedPackage === 'pro'
                ? 'bg-[#151824]/95 border-rose-500 ring-1 ring-rose-500/50 shadow-[0_20px_45px_rgba(225,29,72,0.2)]'
                : 'bg-[#0f121b]/90 border-white/10 hover:border-white/25'
            }`}
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] uppercase font-mono font-bold bg-zinc-800/90 text-zinc-200 border border-zinc-700 px-2.5 py-1 rounded-full">
                  Más Popular
                </span>
                {selectedPackage === 'pro' && (
                  <span className="text-[10px] font-mono font-bold text-rose-400">● Activo</span>
                )}
              </div>

              <div>
                <div className="flex items-baseline gap-1.5">
                  <span className="font-syne text-2xl font-extrabold text-white lining-nums tracking-tight">$200</span>
                  <span className="text-xs font-mono text-zinc-400">USD / tema</span>
                </div>
                <h3 className="font-syne text-base font-bold text-white mt-1.5 leading-snug">
                  Grabación, Mezcla &amp; Master
                </h3>
                <p className="font-dmsans text-xs text-zinc-400 mt-1.5 leading-relaxed">
                  Traes tu pista (YouTube o WAV). Incluye 4–5h de grabación asistida, premezcla al salir y máster comercial en 24–48h.
                </p>
              </div>

              <ul className="space-y-1.5 pt-2 border-t border-white/10 text-[11px] font-dmsans text-zinc-300">
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                  <span>Sesión de 4 a 5 horas en studio</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                  <span>Afinación Melodyne + Mezcla Pro</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                  <span>Máster WAV 24-bit + 2 revisiones</span>
                </li>
              </ul>
            </div>

            <div className="mt-5 pt-3.5 border-t border-white/10 flex items-center justify-between gap-2 text-xs">
              <span className="font-mono text-[11px] text-zinc-400">
                Depósito ATH: <strong className="text-white font-bold lining-nums">$50</strong>
              </span>
              <span
                className={`taste-btn px-3 py-1.5 rounded-lg font-dmsans font-bold text-[11px] transition ${
                  selectedPackage === 'pro'
                    ? 'bg-rose-600 text-white'
                    : 'bg-white/[0.06] hover:bg-white/[0.12] text-rose-300'
                }`}
              >
                {selectedPackage === 'pro' ? 'Seleccionado ✓' : 'Elegir Plan →'}
              </span>
            </div>
          </div>

          {/* Plan 2: Producción Integral (Full Song) ($350 - $400 USD) */}
          <div
            role="button"
            tabIndex={0}
            onClick={() => onSelectPackage('full')}
            onKeyDown={handleKeySelect('full')}
            onMouseMove={handleSpotlightMove}
            className={`fx-spotlight-card antigravity-glass-card taste-card p-5 rounded-2xl border cursor-pointer flex flex-col justify-between ${
              selectedPackage === 'full'
                ? 'bg-[#151824]/95 border-amber-400 ring-1 ring-amber-400/50 shadow-[0_20px_45px_rgba(245,158,11,0.18)]'
                : 'bg-[#0f121b]/90 border-white/10 hover:border-amber-500/40'
            }`}
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] uppercase font-mono font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 px-2.5 py-1 rounded-full">
                  Producción Total
                </span>
                {selectedPackage === 'full' && (
                  <span className="text-[10px] font-mono font-bold text-amber-400">● Activo</span>
                )}
              </div>

              <div>
                <div className="flex items-baseline gap-1.5">
                  <span className="font-syne text-2xl font-extrabold text-white lining-nums tracking-tight">$350 – $400</span>
                  <span className="text-xs font-mono text-zinc-400">USD</span>
                </div>
                <h3 className="font-syne text-base font-bold text-white mt-1.5 leading-snug">
                  Producción Completa (Full Song)
                </h3>
                <p className="font-dmsans text-xs text-zinc-400 mt-1.5 leading-relaxed">
                  Creación integral desde cero: instrumental exclusiva a tu medida, dirección vocal (4–5h), mezcla multitrack y máster final.
                </p>
              </div>

              <ul className="space-y-1.5 pt-2 border-t border-white/10 text-[11px] font-dmsans text-zinc-300">
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>Beat exclusivo + Arreglos a medida</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>Grabación de voces (4–5h) + Tuning</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>Mezcla por stems + Máster comercial</span>
                </li>
              </ul>
            </div>

            <div className="mt-5 pt-3.5 border-t border-white/10 flex items-center justify-between gap-2 text-xs">
              <span className="font-mono text-[11px] text-zinc-400">
                Depósito 50%: <strong className="text-white font-bold lining-nums">$175</strong>
              </span>
              <span
                className={`taste-btn px-3 py-1.5 rounded-lg font-dmsans font-bold text-[11px] transition ${
                  selectedPackage === 'full'
                    ? 'bg-amber-500 text-gray-950'
                    : 'bg-white/[0.06] hover:bg-white/[0.12] text-amber-300'
                }`}
              >
                {selectedPackage === 'full' ? 'Seleccionado ✓' : 'Elegir Plan →'}
              </span>
            </div>
          </div>

          {/* Plan 3: Solo Mezcla & Master ($150 USD) */}
          <div
            role="button"
            tabIndex={0}
            onClick={() => onSelectPackage('mezcla')}
            onKeyDown={handleKeySelect('mezcla')}
            onMouseMove={handleSpotlightMove}
            className={`fx-spotlight-card antigravity-glass-card taste-card p-5 rounded-2xl border cursor-pointer flex flex-col justify-between ${
              selectedPackage === 'mezcla'
                ? 'bg-[#151824]/95 border-cyan-400 ring-1 ring-cyan-400/50 shadow-[0_20px_45px_rgba(34,211,238,0.18)]'
                : 'bg-[#0f121b]/90 border-white/10 hover:border-cyan-500/40'
            }`}
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] uppercase font-mono font-bold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 px-2.5 py-1 rounded-full">
                  Post-Producción
                </span>
                {selectedPackage === 'mezcla' && (
                  <span className="text-[10px] font-mono font-bold text-cyan-400">● Activo</span>
                )}
              </div>

              <div>
                <div className="flex items-baseline gap-1.5">
                  <span className="font-syne text-2xl font-extrabold text-white lining-nums tracking-tight">$150</span>
                  <span className="text-xs font-mono text-zinc-400">USD / track</span>
                </div>
                <h3 className="font-syne text-base font-bold text-white mt-1.5 leading-snug">
                  Solo Mezcla &amp; Master
                </h3>
                <p className="font-dmsans text-xs text-zinc-400 mt-1.5 leading-relaxed">
                  Envías tus voces grabadas y pista. Balance multitrack, afinación vocal precisa y masterización comercial para plataformas.
                </p>
              </div>

              <ul className="space-y-1.5 pt-2 border-t border-white/10 text-[11px] font-dmsans text-zinc-300">
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span>Mezcla vocal y balance de stems</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span>Afinación Melodyne + Procesamiento</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span>Máster comercial WAV 24-bit</span>
                </li>
              </ul>
            </div>

            <div className="mt-5 pt-3.5 border-t border-white/10 flex items-center justify-between gap-2 text-xs">
              <span className="font-mono text-[11px] text-zinc-400">
                Depósito 50%: <strong className="text-white font-bold lining-nums">$75</strong>
              </span>
              <span
                className={`taste-btn px-3 py-1.5 rounded-lg font-dmsans font-bold text-[11px] transition ${
                  selectedPackage === 'mezcla'
                    ? 'bg-cyan-500 text-gray-950'
                    : 'bg-white/[0.06] hover:bg-white/[0.12] text-cyan-300'
                }`}
              >
                {selectedPackage === 'mezcla' ? 'Seleccionado ✓' : 'Elegir Plan →'}
              </span>
            </div>
          </div>

          {/* Plan 4: Instrumental Exclusiva ($200+ USD) */}
          <div
            role="button"
            tabIndex={0}
            onClick={() => onSelectPackage('instrumental')}
            onKeyDown={handleKeySelect('instrumental')}
            onMouseMove={handleSpotlightMove}
            className={`fx-spotlight-card antigravity-glass-card taste-card p-5 rounded-2xl border cursor-pointer flex flex-col justify-between ${
              selectedPackage === 'instrumental'
                ? 'bg-[#151824]/95 border-emerald-400 ring-1 ring-emerald-400/50 shadow-[0_20px_45px_rgba(16,185,129,0.18)]'
                : 'bg-[#0f121b]/90 border-white/10 hover:border-emerald-500/40'
            }`}
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] uppercase font-mono font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 px-2.5 py-1 rounded-full">
                  Beat Exclusivo
                </span>
                {selectedPackage === 'instrumental' && (
                  <span className="text-[10px] font-mono font-bold text-emerald-400">● Activo</span>
                )}
              </div>

              <div>
                <div className="flex items-baseline gap-1.5">
                  <span className="font-syne text-2xl font-extrabold text-white lining-nums tracking-tight">$200+</span>
                  <span className="text-xs font-mono text-zinc-400">USD / beat</span>
                </div>
                <h3 className="font-syne text-base font-bold text-white mt-1.5 leading-snug">
                  Instrumental Exclusiva
                </h3>
                <p className="font-dmsans text-xs text-zinc-400 mt-1.5 leading-relaxed">
                  Pista 100% original y exclusiva producida desde cero a tu medida por Badlenz, con sonido comercial y licencia exclusiva.
                </p>
              </div>

              <ul className="space-y-1.5 pt-2 border-t border-white/10 text-[11px] font-dmsans text-zinc-300">
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Composición y sound design original</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Entrega de Stems WAV 24-bit por canal</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Exclusividad total para tu lanzamiento</span>
                </li>
              </ul>
            </div>

            <div className="mt-5 pt-3.5 border-t border-white/10 flex items-center justify-between gap-2 text-xs">
              <span className="font-mono text-[11px] text-zinc-400">
                Depósito 50%: <strong className="text-white font-bold lining-nums">$100</strong>
              </span>
              <span
                className={`taste-btn px-3 py-1.5 rounded-lg font-dmsans font-bold text-[11px] transition ${
                  selectedPackage === 'instrumental'
                    ? 'bg-emerald-500 text-gray-950'
                    : 'bg-white/[0.06] hover:bg-white/[0.12] text-emerald-300'
                }`}
              >
                {selectedPackage === 'instrumental' ? 'Seleccionado ✓' : 'Elegir Plan →'}
              </span>
            </div>
          </div>
        </div>

        {/* PIE DE SECCIÓN UNIFICADO: PROGRAMA DE REFERIDOS + CONDICIONES DE OPERACIÓN */}
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-4 pt-1">
          <div className="lg:col-span-5 bg-gradient-to-r from-emerald-950/35 via-[#0b0f17] to-[#0d1018] border border-emerald-500/35 rounded-2xl p-4 flex flex-col sm:flex-row lg:flex-col xl:flex-row sm:items-center justify-between gap-3.5 text-xs">
            <div className="flex items-start sm:items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
                <DollarSign className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-mono font-bold text-emerald-400 tracking-wider block">
                  Programa de Referidos · Studio Credit
                </span>
                <h4 className="font-syne text-sm font-bold text-white mt-0.5">
                  Gana $25 USD para tu próxima sesión
                </h4>
                <p className="font-dmsans text-zinc-400 text-[11px] mt-0.5 leading-snug">
                  Refiere a un artista y recibe <strong className="text-zinc-200">$25 en crédito</strong> al completarse su sesión.
                </p>
              </div>
            </div>
            <a
              href="https://wa.me/17872408627?text=¡Saludos%20Badlenz!%20Quiero%20referir%20a%20un%20colega%20para%20grabar%20en%20La%20Facultad."
              target="_blank"
              rel="noreferrer"
              className="taste-btn px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-dmsans font-bold rounded-xl text-xs whitespace-nowrap transition shrink-0 flex items-center justify-center gap-1.5 shadow-md shadow-emerald-950/50 cursor-pointer"
            >
              <span>Referir Artista</span>
              <span>→</span>
            </a>
          </div>

          <div className="lg:col-span-7 bg-black/50 p-4 rounded-2xl border border-white/10 grid grid-cols-1 sm:grid-cols-3 gap-3 text-[11px] items-center">
            <div className="space-y-0.5">
              <span className="text-[10px] font-mono text-amber-400 uppercase font-bold block">01 · Depósito Oficial</span>
              <p className="font-dmsans text-zinc-300 leading-snug">
                <strong className="text-white lining-nums">$50 USD</strong> en sesiones de grabación • <strong className="text-white lining-nums">50%</strong> en producción o post-producción.
              </p>
            </div>
            <div className="space-y-0.5 sm:border-l sm:border-white/10 sm:pl-3">
              <span className="text-[10px] font-mono text-rose-400 uppercase font-bold block">02 · Revisiones</span>
              <p className="font-dmsans text-zinc-300 leading-snug">
                <strong className="text-white lining-nums">2 revisiones gratis</strong> incluidas en cada tema (adicionales: $10 c/u).
              </p>
            </div>
            <div className="space-y-0.5 sm:border-l sm:border-white/10 sm:pl-3">
              <span className="text-[10px] font-mono text-cyan-400 uppercase font-bold block">03 · Tiempos de Entrega</span>
              <p className="font-dmsans text-zinc-300 leading-snug">
                <strong className="text-white">Rough Mix</strong> al terminar la sesión • Máster WAV 24-bit en <strong className="text-white lining-nums">24–48h</strong>.
              </p>
            </div>
          </div>
        </div>
      </section>
    </ScrollReveal>
  );
};
