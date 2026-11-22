import React, { useMemo } from 'react';
import {
  Award,
  CheckCircle2,
  Disc3,
  ExternalLink,
  Globe,
  Layers,
  Users,
  ArrowUpRight,
} from 'lucide-react';
import { BADLENZ_CAREER_SUMMARY } from '../data/badlenzVerifiedCredits';
import { useResolvedBadlenzCredits } from '../services/creditsRoles';
import { LFCrestLogo } from './BrandingLogos';

function formatCompact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2).replace(/\.00$/, '')}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, '')}K`;
  return n.toLocaleString('en-US');
}

export const CreditsMinimalSection: React.FC = () => {
  const { credits } = useResolvedBadlenzCredits();

  const topHighlights = useMemo(() => {
    return credits.filter((c) => c.featured).slice(0, 4);
  }, [credits]);

  return (
    <section
      id="creditos"
      aria-labelledby="creditos-minimal-heading"
      className="relative overflow-hidden rounded-3xl border border-white/10 antigravity-glass-panel p-5 sm:p-7 space-y-5 shadow-[0_24px_60px_rgba(0,0,0,0.7)] scroll-mt-32 md:scroll-mt-24"
    >
      {/* Subtle Top Specular & Ambient Glow */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-400/35 to-transparent pointer-events-none" />
      <div className="absolute -top-24 left-1/4 w-72 h-72 bg-red-600/10 rounded-full blur-[110px] pointer-events-none" />
      <div className="absolute -bottom-24 right-1/4 w-72 h-72 bg-amber-500/8 rounded-full blur-[110px] pointer-events-none" />

      {/* Header Row */}
      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-500/15 border border-red-500/40 text-[10px] font-mono text-red-300 font-bold uppercase tracking-widest">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              <span>Trayectoria Verificada</span>
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-400/40 text-[10px] font-mono text-amber-300 font-bold uppercase tracking-wider">
              <Award className="w-3 h-3 text-amber-400" />
              <span>Top {BADLENZ_CAREER_SUMMARY.producerGlobalPercentile}% Global</span>
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/5 border border-white/15 text-[10px] font-mono text-zinc-300 font-bold uppercase tracking-wider">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              <span>OBRA PRO · Muso.AI · BMG</span>
            </span>
          </div>

          <div className="flex items-start sm:items-center gap-3">
            <div className="shrink-0 mt-0.5 sm:mt-0">
              <LFCrestLogo size="sm" />
            </div>
            <div>
              <h2
                id="creditos-minimal-heading"
                className="font-syne text-xl sm:text-2xl font-bold text-white tracking-tight leading-tight"
              >
                Créditos Oficiales &amp; Milestones ·{' '}
                <span className="text-red-500">BADLENZ</span>
              </h2>
              <p className="font-dmsans text-xs sm:text-sm text-zinc-400 mt-0.5">
                Producción, mezcla, máster y composición junto a{' '}
                <span className="text-zinc-200 font-medium">
                  Ozuna, Myke Towers, Ñengo Flow, Farruko, Cris MJ, Jowell, Jon Z, Darkiel &amp; más
                </span>
                .
              </p>
            </div>
          </div>
        </div>

        {/* Primary Action: Opens Full Credits Window + OBRA PRO */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <a
            href="/creditos"
            target="_blank"
            rel="noopener noreferrer"
            className="taste-btn inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-amber-500 hover:from-red-500 hover:to-amber-400 text-white font-syne font-bold text-xs uppercase tracking-wider shadow-lg shadow-red-950/50 transition"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Abrir Catálogo Completo ({BADLENZ_CAREER_SUMMARY.totalCredits})</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </a>

          <a
            href={BADLENZ_CAREER_SUMMARY.obraUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-400/50 text-xs font-mono font-bold text-amber-200 transition"
            title="Ver portafolio verificado en obra.art/badlenz"
          >
            <Globe className="w-3.5 h-3.5 text-amber-300" />
            <span>OBRA PRO</span>
            <ExternalLink className="w-3 h-3 text-amber-300/80" />
          </a>

          <a
            href={BADLENZ_CAREER_SUMMARY.profileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-zinc-950/80 hover:bg-zinc-900 border border-white/15 hover:border-amber-400/50 text-xs font-mono text-zinc-200 transition"
          >
            <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
            <span>Muso.AI</span>
          </a>
        </div>
      </div>

      {/* Compact 4-KPI Strip */}
      <div className="relative z-10 grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
        <a
          href={BADLENZ_CAREER_SUMMARY.obraUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-2xl bg-gradient-to-br from-amber-500/12 via-[#10121a] to-[#0a0b12] border border-amber-400/30 hover:border-amber-300/60 px-3.5 py-3 transition"
          title="Streams verificados en vivo en obra.art/badlenz"
        >
          <div className="flex items-center justify-between text-[10px] font-mono uppercase text-amber-300 font-bold">
            <span>Streams OBRA</span>
            <Globe className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="mt-1 font-mono text-xl sm:text-2xl font-extrabold text-white tabular-nums">
            {Math.round(BADLENZ_CAREER_SUMMARY.obraVerifiedStreams / 1_000_000)}M+
          </div>
        </a>

        <div className="rounded-2xl bg-[#0e1018]/90 border border-white/10 px-3.5 py-3">
          <div className="flex items-center justify-between text-[10px] font-mono uppercase text-zinc-400 font-bold">
            <span>Proyectos</span>
            <Disc3 className="w-3.5 h-3.5 text-red-400" />
          </div>
          <div className="mt-1 font-mono text-xl sm:text-2xl font-extrabold text-white tabular-nums">
            {BADLENZ_CAREER_SUMMARY.obraProjectsCount}
          </div>
        </div>

        <div className="rounded-2xl bg-gradient-to-br from-red-600/12 via-[#10121a] to-[#0a0b12] border border-red-500/30 px-3.5 py-3">
          <div className="flex items-center justify-between text-[10px] font-mono uppercase text-red-300 font-bold">
            <span>Muso Charts</span>
            <Award className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="mt-1 font-mono text-xl sm:text-2xl font-extrabold text-white tabular-nums">
            Top {BADLENZ_CAREER_SUMMARY.producerGlobalPercentile}%
          </div>
        </div>

        <div className="rounded-2xl bg-[#0e1018]/90 border border-white/10 px-3.5 py-3">
          <div className="flex items-center justify-between text-[10px] font-mono uppercase text-zinc-400 font-bold">
            <span>Colaboradores</span>
            <Users className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="mt-1 font-mono text-xl sm:text-2xl font-extrabold text-white tabular-nums">
            {BADLENZ_CAREER_SUMMARY.collaboratorsCount}+
          </div>
        </div>
      </div>

      {/* Minimalist Top 4 Flagship Strip */}
      <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
        {topHighlights.map((track) => (
          <a
            key={track.id}
            href="/creditos"
            target="_blank"
            rel="noopener noreferrer"
            className="group rounded-2xl bg-[#0d0f18]/90 hover:bg-[#131624] border border-white/8 hover:border-amber-400/40 p-3 flex items-center gap-3 transition"
          >
            <div className="w-12 h-12 rounded-xl overflow-hidden bg-zinc-900 border border-white/10 shrink-0">
              {track.albumArt ? (
                <img
                  src={track.albumArt}
                  alt={track.title}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center font-syne font-bold text-zinc-500">
                  {track.title[0]}
                </div>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="font-syne font-bold text-xs text-white truncate group-hover:text-amber-200 transition">
                {track.title}
              </div>
              <div className="text-[11px] text-zinc-400 truncate">{track.artists}</div>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded bg-red-950/60 border border-red-700/40 text-red-200 truncate">
                  {track.roleLabels.join(' · ')}
                </span>
                {track.youtubeViews && (
                  <span className="text-[10px] font-mono font-bold text-amber-300 shrink-0">
                    {formatCompact(track.youtubeViews)}
                  </span>
                )}
              </div>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
};

export default CreditsMinimalSection;
