import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Play,
  Pause,
  Award,
  Disc3,
  ExternalLink,
  Search,
  Users,
  Youtube,
  Sparkles,
  Download,
  Radio,
  CheckCircle2,
  Layers,
  ListMusic,
  Globe,
} from 'lucide-react';
import {
  BADLENZ_CAREER_SUMMARY,
  CreditRoleKey,
  VerifiedCreditItem,
} from '../data/badlenzVerifiedCredits';
import { useResolvedBadlenzCredits } from '../services/creditsRoles';
import { LFCrestLogo, BadlenzLogo } from './BrandingLogos';

const ROLE_TABS: { key: 'ALL' | CreditRoleKey | 'BMG'; label: string }[] = [
  { key: 'ALL', label: 'Todos' },
  { key: 'Producer', label: 'Productor' },
  { key: 'Engineer', label: 'Mezcla' },
  { key: 'Mastering', label: 'Mastering' },
  { key: 'Songwriter', label: 'Compositor' },
  { key: 'BMG', label: 'BMG Publishing' },
];

function formatCompact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2).replace(/\.00$/, '')}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, '')}K`;
  return n.toLocaleString('en-US');
}

function plaqueBadgeStyle(metal: string) {
  switch (metal) {
    case 'gold':
      return 'bg-amber-500/20 border-amber-400/60 text-amber-300';
    case 'crimson':
      return 'bg-red-600/25 border-red-500/60 text-red-200';
    case 'chrome':
      return 'bg-zinc-200/15 border-zinc-300/50 text-zinc-100';
    default:
      return 'bg-zinc-800/80 border-zinc-600/50 text-zinc-300';
  }
}

function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

const SPOTIFY_PLAYLIST_URL = 'https://open.spotify.com/playlist/7Cq8IwtVRrlWRXsXTu2kUT';
const SPOTIFY_PLAYLIST_EMBED_URL = 'https://open.spotify.com/embed/playlist/7Cq8IwtVRrlWRXsXTu2kUT?utm_source=generator&theme=0';
const OBRA_PROFILE_URL = BADLENZ_CAREER_SUMMARY.obraUrl;

export interface CreditsBentoGridProps {
  onBookSession?: () => void;
}

export const CreditsBentoGrid: React.FC<CreditsBentoGridProps> = ({ onBookSession }) => {
  const { credits } = useResolvedBadlenzCredits();
  const [viewMode, setViewMode] = useState<'obra' | 'featured' | 'all' | 'playlist'>('obra');
  const [roleFilter, setRoleFilter] = useState<'ALL' | CreditRoleKey | 'BMG'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [playingId, setPlayingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const switchingRef = useRef(false);
  const activeTrackIdRef = useRef<string | null>(null);

  useEffect(() => {
    const audio = audioRef.current;
    return () => {
      if (audio) {
        audio.pause();
        audio.src = '';
      }
    };
  }, []);

  const toggleAudioPreview = (track: VerifiedCreditItem) => {
    if (!track.previewUrl || !audioRef.current) return;
    const audio = audioRef.current;

    if (playingId === track.id) {
      switchingRef.current = false;
      activeTrackIdRef.current = null;
      audio.pause();
      setPlayingId(null);
      return;
    }

    switchingRef.current = true;
    activeTrackIdRef.current = track.id;
    setPlayingId(track.id);
    audio.src = track.previewUrl;
    audio
      .play()
      .then(() => {
        if (activeTrackIdRef.current === track.id) {
          switchingRef.current = false;
        }
      })
      .catch(() => {
        if (activeTrackIdRef.current === track.id) {
          switchingRef.current = false;
          activeTrackIdRef.current = null;
          setPlayingId(null);
        }
      });
  };

  const featuredCredits = useMemo(() => {
    return credits.filter((c) => c.featured);
  }, [credits]);

  const filteredAllCredits = useMemo(() => {
    const q = normalizeText(searchQuery.trim());
    return credits.filter((c) => {
      if (roleFilter === 'BMG' && c.source !== 'BMG') return false;
      if (
        roleFilter !== 'ALL' &&
        roleFilter !== 'BMG' &&
        !c.roles.includes(roleFilter)
      ) {
        return false;
      }
      if (q) {
        const hay = normalizeText(
          `${c.title} ${c.artists} ${c.album} ${c.label} ${c.isrc || ''} ${c.sourceLabel} ${c.roleLabels.join(' ')}`
        );
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [credits, roleFilter, searchQuery]);

  const roleCounts = useMemo(() => {
    const counts: Record<string, number> = {
      ALL: credits.length,
      Producer: 0,
      Engineer: 0,
      Mastering: 0,
      Songwriter: 0,
      BMG: 0,
    };
    for (const c of credits) {
      if (c.source === 'BMG') counts.BMG += 1;
      for (const r of c.roles) {
        if (counts[r] !== undefined) counts[r] += 1;
      }
    }
    return counts;
  }, [credits]);

  // High-res PNG Milestone Banner Exporter (1600x540 Press Kit / Header Banner)
  const handleDownloadBannerPng = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 1600;
    canvas.height = 540;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Obsidian studio background
    const bg = ctx.createLinearGradient(0, 0, 1600, 540);
    bg.addColorStop(0, '#07080d');
    bg.addColorStop(0.5, '#120b10');
    bg.addColorStop(1, '#08090f');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, 1600, 540);

    // Subtle crimson & gold radial glow
    const redGlow = ctx.createRadialGradient(260, 80, 10, 260, 80, 520);
    redGlow.addColorStop(0, 'rgba(200, 16, 46, 0.28)');
    redGlow.addColorStop(1, 'transparent');
    ctx.fillStyle = redGlow;
    ctx.fillRect(0, 0, 1600, 540);

    const goldGlow = ctx.createRadialGradient(1340, 440, 10, 1340, 440, 460);
    goldGlow.addColorStop(0, 'rgba(212, 175, 55, 0.22)');
    goldGlow.addColorStop(1, 'transparent');
    ctx.fillStyle = goldGlow;
    ctx.fillRect(0, 0, 1600, 540);

    // Border frame
    drawRoundedRect(ctx, 24, 24, 1552, 492, 24);
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.45)';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Top tag
    ctx.fillStyle = '#f87171';
    ctx.font = '700 16px "JetBrains Mono", monospace';
    ctx.fillText(
      '● LA FACULTAD STUDIO · CRÉDITOS OFICIALES & MILESTONES VERIFICADOS',
      68,
      82,
      1464
    );

    // Main title
    ctx.fillStyle = '#ffffff';
    ctx.font = '800 46px "Syne", sans-serif';
    ctx.fillText('BADLENZ · PRODUCTOR, INGENIERO & COMPOSITOR', 68, 150, 1464);

    ctx.fillStyle = '#d4d4d8';
    ctx.font = '500 19px "DM Sans", sans-serif';
    ctx.fillText(
      'Ozuna, Myke Towers, Ñengo Flow, Farruko, Cris MJ, Jowell, Jon Z, Franco "El Gorilla", Pusho, Darkiel, Lennox, Casper Mágico, Zyron & K Lead',
      68,
      194,
      1464
    );

    // 4 Verified Metric Cards
    const metrics = [
      {
        label: 'PROYECTOS & CRÉDITOS',
        value: `${BADLENZ_CAREER_SUMMARY.obraProjectsCount}`,
        sub: `OBRA PRO (${BADLENZ_CAREER_SUMMARY.totalCredits} Muso.AI + BMG)`,
        color: '#ffffff',
      },
      {
        label: 'STREAMS VERIFICADOS OBRA',
        value: `${Math.round(BADLENZ_CAREER_SUMMARY.obraVerifiedStreams / 1_000_000)}M+`,
        sub: `${formatCompact(BADLENZ_CAREER_SUMMARY.obraSpotifyStreams)} Spotify · ${formatCompact(BADLENZ_CAREER_SUMMARY.obraYoutubeViews)} YT`,
        color: '#f5d061',
      },
      {
        label: 'RANKING GLOBAL MUSO',
        value: `TOP ${BADLENZ_CAREER_SUMMARY.producerGlobalPercentile}%`,
        sub: `#${BADLENZ_CAREER_SUMMARY.producerGlobalRank.toLocaleString('en-US')} Global · Top ${BADLENZ_CAREER_SUMMARY.masteringGlobalPercentile}% Mastering`,
        color: '#f87171',
      },
      {
        label: 'RED DE COLABORADORES',
        value: `${BADLENZ_CAREER_SUMMARY.collaboratorsCount}+`,
        sub: 'Artistas, productores & compositores',
        color: '#e4e4e7',
      },
    ];

    metrics.forEach((m, i) => {
      const x = 68 + i * 372;
      const y = 242;
      drawRoundedRect(ctx, x, y, 348, 180, 18);
      ctx.fillStyle = 'rgba(15, 17, 26, 0.9)';
      ctx.fill();
      ctx.strokeStyle = i === 1 ? 'rgba(212, 175, 55, 0.55)' : 'rgba(255, 255, 255, 0.14)';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = '#a1a1aa';
      ctx.font = '700 13px "JetBrains Mono", monospace';
      ctx.fillText(m.label, x + 24, y + 40, 300);

      ctx.fillStyle = m.color;
      ctx.font = '800 46px "JetBrains Mono", monospace';
      ctx.fillText(m.value, x + 24, y + 108, 300);

      ctx.fillStyle = '#a1a1aa';
      ctx.font = '500 14px "DM Sans", sans-serif';
      ctx.fillText(m.sub, x + 24, y + 148, 300);
    });

    // Footer
    ctx.fillStyle = '#71717a';
    ctx.font = '600 14px "JetBrains Mono", monospace';
    ctx.fillText(
      'the-facultypr.vercel.app  ·  obra.art/badlenz  ·  muso.ai/profile/d2deaa03-a0c9-48e5-83a3-9480fab7baa8',
      68,
      478,
      1464
    );

    const a = document.createElement('a');
    a.download = 'badlenz-la-facultad-credits-milestone-banner.png';
    a.href = canvas.toDataURL('image/png');
    a.click();
  };

  return (
    <section
      id="creditos"
      aria-labelledby="creditos-badlenz-heading"
      className="relative overflow-hidden rounded-3xl border border-white/10 antigravity-glass-panel p-5 sm:p-8 space-y-6 shadow-[0_30px_70px_rgba(0,0,0,0.75)] scroll-mt-32 md:scroll-mt-24"
    >
      <audio
        ref={audioRef}
        onEnded={() => {
          switchingRef.current = false;
          activeTrackIdRef.current = null;
          setPlayingId(null);
        }}
        onPause={() => {
          if (!switchingRef.current) {
            activeTrackIdRef.current = null;
            setPlayingId(null);
          }
        }}
        onError={() => {
          switchingRef.current = false;
          activeTrackIdRef.current = null;
          setPlayingId(null);
        }}
        className="hidden"
      />

      {/* Ambient Specular & Crimson/Gold Glows */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-400/35 to-transparent pointer-events-none" />
      <div className="absolute -top-24 left-1/4 w-96 h-96 bg-red-600/12 rounded-full blur-[130px] pointer-events-none" />
      <div className="absolute -bottom-24 right-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-[120px] pointer-events-none" />

      {/* 1. HEADER & MILESTONE BANNER */}
      <div className="relative z-10 flex flex-col lg:flex-row lg:items-end justify-between gap-4 border-b border-white/10 pb-5">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/15 border border-red-500/40 text-[10px] font-mono text-red-300 font-bold uppercase tracking-widest">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              <span>Discografía &amp; Créditos Verificados</span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-400/40 text-[10px] font-mono text-amber-300 font-bold uppercase tracking-wider">
              <Award className="w-3 h-3 text-amber-400" />
              <span>Top {BADLENZ_CAREER_SUMMARY.producerGlobalPercentile}% Global Producer</span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 border border-white/15 text-[10px] font-mono text-zinc-200 font-bold uppercase tracking-wider">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              <span>OBRA PRO · Muso.AI · BMG</span>
            </span>
          </div>

          <div className="flex items-start sm:items-center gap-3 pt-1">
            <div className="shrink-0 mt-1 sm:mt-0">
              <LFCrestLogo size="sm" />
            </div>
            <div>
              <h2
                id="creditos-badlenz-heading"
                className="font-syne text-2xl sm:text-3xl font-bold text-white tracking-tight leading-tight"
              >
                Trayectoria &amp; Stream Milestones ·{' '}
                <span className="text-red-500">BADLENZ</span>
              </h2>
              <p className="font-dmsans text-xs sm:text-sm text-zinc-400 mt-0.5 max-w-2xl">
                Créditos oficiales de producción, composición (BMG Publishing), mezcla y mastering junto a{' '}
                <span className="text-zinc-200 font-medium">
                  Ozuna, Myke Towers, Ñengo Flow, Farruko, Cris MJ, Jowell, Jon Z, Marcianeke, Franco &quot;El Gorilla&quot;, Pusho, Darkiel, Lennox, Casper Mágico, Galante, Lyan, Zyron, JVO &amp; K Lead
                </span>
                .
              </p>
            </div>
          </div>
        </div>

        {/* Actions: OBRA PRO + Spotify Playlist + Muso Verified Profile + Download HD Banner */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <a
            href={OBRA_PROFILE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-red-600/25 to-amber-500/25 hover:from-red-600/40 hover:to-amber-500/40 border border-amber-400/55 text-xs font-mono font-bold text-white transition"
            title="Abrir portafolio oficial verificado en obra.art/badlenz"
          >
            <Globe className="w-3.5 h-3.5 text-amber-300" />
            <span>OBRA PRO</span>
            <ExternalLink className="w-3 h-3 text-amber-300/80" />
          </a>
          <a
            href={SPOTIFY_PLAYLIST_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-400/45 text-xs font-mono font-bold text-emerald-300 transition"
            title="Abrir playlist oficial Produced By Badlenz en Spotify"
          >
            <ListMusic className="w-3.5 h-3.5 text-emerald-400" />
            <span>Playlist Spotify</span>
          </a>
          <a
            href={BADLENZ_CAREER_SUMMARY.profileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-zinc-950/80 hover:bg-zinc-900 border border-white/15 hover:border-amber-400/50 text-xs font-mono text-zinc-200 transition"
          >
            <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
            <span>Perfil Muso.AI</span>
          </a>
          <button
            type="button"
            onClick={handleDownloadBannerPng}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500/20 to-red-600/20 hover:from-amber-500/35 hover:to-red-600/35 border border-amber-400/40 text-xs font-mono font-bold text-amber-200 transition cursor-pointer"
            title="Descargar banner horizontal PNG en alta resolución"
          >
            <Download className="w-3.5 h-3.5 text-amber-300" />
            <span>Banner PNG</span>
          </button>
        </div>
      </div>

      {/* 2. VERIFIED MILESTONE STRIP (4 REAL KPI CARDS — ZERO FAKE NUMBERS) */}
      <div className="relative z-10 grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <a
          href={OBRA_PROFILE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="group rounded-2xl bg-gradient-to-br from-amber-500/15 via-[#10121a] to-[#0a0b12] border border-amber-400/35 hover:border-amber-300/70 p-4 flex flex-col justify-between transition"
          title="Ver desglose en vivo en obra.art/badlenz"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-wider text-amber-300 font-bold">
              Streams Verificados (OBRA)
            </span>
            <Globe className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="mt-2 font-mono text-2xl sm:text-3xl font-extrabold text-white tabular-nums">
            {Math.round(BADLENZ_CAREER_SUMMARY.obraVerifiedStreams / 1_000_000)}M+
          </div>
          <p className="text-[11px] text-zinc-400 mt-1">
            {formatCompact(BADLENZ_CAREER_SUMMARY.obraSpotifyStreams)} Spotify · {formatCompact(BADLENZ_CAREER_SUMMARY.obraYoutubeViews)} YT · {formatCompact(BADLENZ_CAREER_SUMMARY.obraSoundcloudStreams)} SC
          </p>
        </a>

        <div className="rounded-2xl bg-[#0e1018]/90 border border-white/10 p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 font-bold">
              Proyectos &amp; Créditos
            </span>
            <Disc3 className="w-4 h-4 text-red-400" />
          </div>
          <div className="mt-2 font-mono text-2xl sm:text-3xl font-extrabold text-white tabular-nums">
            {BADLENZ_CAREER_SUMMARY.obraProjectsCount}
          </div>
          <p className="text-[11px] text-zinc-400 mt-1">
            {BADLENZ_CAREER_SUMMARY.obraProjectsCount} en OBRA · {BADLENZ_CAREER_SUMMARY.totalCredits} Muso.AI / BMG
          </p>
        </div>

        <div className="rounded-2xl bg-gradient-to-br from-red-600/15 via-[#10121a] to-[#0a0b12] border border-red-500/35 p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-wider text-red-300 font-bold">
              Ranking Global Productor
            </span>
            <Award className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2 font-mono text-2xl sm:text-3xl font-extrabold text-white tabular-nums">
            Top {BADLENZ_CAREER_SUMMARY.producerGlobalPercentile}%
          </div>
          <p className="text-[11px] text-zinc-400 mt-1">
            #{BADLENZ_CAREER_SUMMARY.producerGlobalRank.toLocaleString('en-US')} Global · Top {BADLENZ_CAREER_SUMMARY.masteringGlobalPercentile}% Mastering
          </p>
        </div>

        <div className="rounded-2xl bg-[#0e1018]/90 border border-white/10 p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 font-bold">
              Red de Colaboradores
            </span>
            <Users className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2 font-mono text-2xl sm:text-3xl font-extrabold text-white tabular-nums">
            {BADLENZ_CAREER_SUMMARY.collaboratorsCount}+
          </div>
          <p className="text-[11px] text-zinc-400 mt-1">
            Artistas, ingenieros y compositores acreditados
          </p>
        </div>
      </div>

      {/* 3. FOUR-TAB SWITCHER: OBRA LIVE, DESTACADOS, CATÁLOGO COMPLETO & PLAYLIST */}
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <div
          role="tablist"
          aria-label="Vistas del catálogo de créditos"
          className="grid grid-cols-2 sm:inline-flex w-full sm:w-auto p-1 gap-1 sm:gap-0 rounded-2xl bg-black/50 border border-white/10 self-start"
        >
          <button
            type="button"
            role="tab"
            aria-selected={viewMode === 'obra'}
            onClick={() => setViewMode('obra')}
            className={`px-2.5 sm:px-4 py-2 rounded-xl text-[11px] sm:text-xs font-syne font-bold transition flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer ${
              viewMode === 'obra'
                ? 'bg-gradient-to-r from-amber-600 to-red-600 text-white shadow-md shadow-amber-950/60'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Globe className="w-3.5 h-3.5 text-amber-200 shrink-0" />
            <span className="sm:hidden">OBRA Live</span>
            <span className="hidden sm:inline">OBRA PRO Live (130M+)</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={viewMode === 'featured'}
            onClick={() => setViewMode('featured')}
            className={`px-2.5 sm:px-4 py-2 rounded-xl text-[11px] sm:text-xs font-syne font-bold transition flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer ${
              viewMode === 'featured'
                ? 'bg-gradient-to-r from-red-700 to-red-600 text-white shadow-md shadow-red-950/60'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300 shrink-0" />
            <span className="sm:hidden">Destacados</span>
            <span className="hidden sm:inline">Destacados ({featuredCredits.length})</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={viewMode === 'all'}
            onClick={() => setViewMode('all')}
            className={`px-2.5 sm:px-4 py-2 rounded-xl text-[11px] sm:text-xs font-syne font-bold transition flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer ${
              viewMode === 'all'
                ? 'bg-gradient-to-r from-red-700 to-red-600 text-white shadow-md shadow-red-950/60'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-amber-300 shrink-0" />
            <span className="sm:hidden">Catálogo ({BADLENZ_CAREER_SUMMARY.totalCredits})</span>
            <span className="hidden sm:inline">Catálogo ({BADLENZ_CAREER_SUMMARY.totalCredits})</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={viewMode === 'playlist'}
            onClick={() => setViewMode('playlist')}
            className={`px-2.5 sm:px-4 py-2 rounded-xl text-[11px] sm:text-xs font-syne font-bold transition flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer ${
              viewMode === 'playlist'
                ? 'bg-gradient-to-r from-emerald-700 to-emerald-600 text-white shadow-md shadow-emerald-950/60'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <ListMusic className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
            <span className="sm:hidden">Playlist</span>
            <span className="hidden sm:inline">Playlist Spotify</span>
          </button>
        </div>

        <div className="flex items-center gap-2 text-[11px] font-mono text-zinc-400">
          <BadlenzLogo size="sm" />
          <span>· Métricas en vivo · OBRA + Muso.AI</span>
        </div>
      </div>

      {/* 4.0 VIEW MODE: OBRA PRO LIVE PORTFOLIO (obra.art/badlenz) */}
      {viewMode === 'obra' && (
        <div className="relative z-10 rounded-2xl bg-[#0c0e16]/95 border border-amber-400/30 p-4 sm:p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-amber-400">
                OBRA PRO · PORTAFOLIO DE CRÉDITOS EN VIVO
              </span>
              <h3 className="font-syne text-lg font-bold text-white">
                obra.art/badlenz · 130M+ Streams Verificados
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Conteo diario verificado en Spotify, YouTube y SoundCloud, lanzamientos recientes y discografía completa.
              </p>
            </div>
            <a
              href={OBRA_PROFILE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-red-600 hover:from-amber-400 hover:to-red-500 text-white font-mono font-extrabold text-xs transition self-start sm:self-auto shrink-0 shadow-lg shadow-amber-950/40"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Abrir obra.art/badlenz</span>
            </a>
          </div>

          <div className="relative w-full rounded-xl overflow-hidden border border-white/10 bg-[#07080d]">
            <iframe
              title="OBRA PRO: Badlenz Verified Credits & Streams"
              src={OBRA_PROFILE_URL}
              width="100%"
              height="760"
              loading="lazy"
              allow="autoplay; clipboard-write; encrypted-media; fullscreen"
              className="w-full h-[640px] sm:h-[760px] bg-[#07080d]"
            />
          </div>
        </div>
      )}

      {/* 4A. VIEW MODE: DESTACADOS & MILESTONES (GRID DE IMPACTO) */}
      {viewMode === 'featured' && (
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {featuredCredits.map((track) => {
            const isPlaying = playingId === track.id;
            return (
              <div
                key={track.id}
                className={`relative overflow-hidden rounded-2xl border p-4 flex flex-col justify-between gap-3.5 transition-all duration-300 bg-gradient-to-br from-[#141521]/95 via-[#0c0d14]/95 to-[#090a10] ${
                  isPlaying
                    ? 'border-red-500 ring-1 ring-red-500/50 shadow-xl shadow-red-950/50'
                    : 'border-white/10 hover:border-amber-400/40'
                }`}
              >
                {/* Top row: Cover Art + Title + Artists */}
                <div className="flex items-start gap-3.5">
                  <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-zinc-900 border border-white/15 shrink-0">
                    {track.albumArt ? (
                      <img
                        src={track.albumArt}
                        alt={track.title}
                        loading="lazy"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center font-display text-xl text-zinc-500">
                        {track.title[0]}
                      </div>
                    )}
                    {track.previewUrl ? (
                      <button
                        type="button"
                        onClick={() => toggleAudioPreview(track)}
                        className="absolute inset-0 bg-black/55 hover:bg-black/40 flex items-center justify-center transition cursor-pointer"
                        aria-label={isPlaying ? 'Pausar preview' : 'Reproducir preview 30s'}
                      >
                        {isPlaying ? (
                          <Pause className="w-5 h-5 text-amber-300 fill-current" />
                        ) : (
                          <Play className="w-5 h-5 text-white fill-current ml-0.5" />
                        )}
                      </button>
                    ) : (track.spotifyUrl || track.youtubeUrl) ? (
                      <a
                        href={track.spotifyUrl || track.youtubeUrl || '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="absolute inset-0 bg-black/55 hover:bg-black/40 flex flex-col items-center justify-center gap-0.5 transition"
                        aria-label={`Escuchar ${track.title} en ${track.spotifyUrl ? 'Spotify' : 'YouTube'}`}
                        title={`Preview 30s no disponible · Abrir en ${track.spotifyUrl ? 'Spotify' : 'YouTube'}`}
                      >
                        <ExternalLink className="w-4 h-4 text-emerald-300" />
                        <span className="text-[8px] font-mono font-bold text-white uppercase tracking-tight">
                          {track.spotifyUrl ? 'Spotify' : 'YouTube'}
                        </span>
                      </a>
                    ) : null}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5 mb-1">
                      <span
                        className={`text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded-full border ${
                          track.source === 'BMG'
                            ? 'bg-amber-500/20 border-amber-400/50 text-amber-300'
                            : track.source === 'SPOTIFY_BEATMAKER'
                            ? 'bg-red-600/20 border-red-500/50 text-red-200'
                            : 'bg-white/5 border-white/15 text-zinc-300'
                        }`}
                      >
                        {track.sourceLabel}
                      </span>
                      <span className="text-[10px] font-mono text-zinc-500">{track.year}</span>
                    </div>

                    <h3 className="font-syne font-bold text-base text-white leading-tight truncate">
                      {track.title}
                    </h3>
                    <p className="text-xs text-zinc-300 truncate mt-0.5">{track.artists}</p>
                  </div>
                </div>

                {/* Middle: Verified YouTube Views Plaque or Popularity */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/8">
                  <div className="flex flex-wrap gap-1.5">
                    {track.roleLabels.map((rl) => (
                      <span
                        key={rl}
                        className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-red-950/60 border border-red-700/40 text-red-200"
                      >
                        {rl}
                      </span>
                    ))}
                  </div>

                  {track.youtubeViews ? (
                    <a
                      href={track.youtubeUrl || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`inline-flex items-center gap-1 text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full border transition hover:brightness-110 ${
                        track.verifiedPlaque
                          ? plaqueBadgeStyle(track.verifiedPlaque.metal)
                          : 'bg-zinc-800 border-zinc-700 text-zinc-200'
                      }`}
                      title={`Vistas públicas verificadas en YouTube: ${track.youtubeViews.toLocaleString('en-US')}`}
                    >
                      <Youtube className="w-3 h-3 text-red-400" />
                      <span>{formatCompact(track.youtubeViews)} vistas YT</span>
                    </a>
                  ) : track.popularity !== null ? (
                    <span className="text-[10px] font-mono text-zinc-400 px-2 py-0.5 rounded bg-black/40 border border-white/10">
                      Spotify Pop {track.popularity}/100
                    </span>
                  ) : null}
                </div>

                {/* Bottom Links */}
                <div className="flex items-center justify-between gap-2 text-[11px] font-mono text-zinc-400">
                  <span className="truncate max-w-[180px] text-[10px]">
                    {track.userNote || track.label}
                  </span>
                  <div className="flex items-center gap-2 shrink-0">
                    {track.spotifyUrl && (
                      <a
                        href={track.spotifyUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-emerald-400 hover:text-emerald-300 font-bold"
                      >
                        Spotify ↗
                      </a>
                    )}
                    {track.youtubeUrl && (
                      <a
                        href={track.youtubeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-red-400 hover:text-red-300 font-bold"
                      >
                        YouTube ↗
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 4B. VIEW MODE: CATÁLOGO COMPLETO (LOS 69 DE MUSO + 16 DE BMG / BEATMAKER) */}
      {viewMode === 'all' && (
        <div className="relative z-10 space-y-4">
          {/* Search + Role Filters */}
          <div className="rounded-2xl bg-black/45 border border-white/10 p-3.5 sm:p-4 space-y-3">
            <div className="flex flex-wrap items-center gap-1.5">
              {ROLE_TABS.filter((rt) => rt.key !== 'BMG').map((rt) => (
                <button
                  key={rt.key}
                  type="button"
                  onClick={() => setRoleFilter(rt.key)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition cursor-pointer ${
                    roleFilter === rt.key
                      ? 'bg-red-600 text-white shadow'
                      : 'bg-white/5 hover:bg-white/10 text-zinc-300 border border-white/10'
                  }`}
                >
                  {rt.label} ({roleCounts[rt.key] ?? 0})
                </button>
              ))}
              <span className="hidden sm:inline-block h-5 w-px bg-white/15 mx-1" aria-hidden="true" />
              <button
                type="button"
                onClick={() => setRoleFilter('BMG')}
                title="Filtrar por editorial BMG Publishing (subconjunto incluido en los roles)"
                className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition cursor-pointer ${
                  roleFilter === 'BMG'
                    ? 'bg-amber-600 text-white shadow'
                    : 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-200 border border-amber-400/30'
                }`}
              >
                Editorial: BMG ({roleCounts.BMG ?? 0})
              </button>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`Buscar entre los ${BADLENZ_CAREER_SUMMARY.totalCredits} créditos por canción, artista (Ozuna, Myke Towers, Ñengo Flow, Cris MJ, Jowell, Farruko, Zyron, K Lead...), ISRC o sello...`}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#090a10] border border-white/10 text-xs sm:text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-red-500"
              />
            </div>

            <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400">
              <span>
                Mostrando <strong className="text-white">{filteredAllCredits.length}</strong> de{' '}
                {BADLENZ_CAREER_SUMMARY.totalCredits} créditos verificados
              </span>
              {(searchQuery.trim() !== '' || roleFilter !== 'ALL') && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setRoleFilter('ALL');
                  }}
                  className="text-amber-300 hover:text-amber-200 underline underline-offset-2 cursor-pointer"
                >
                  Limpiar filtros
                </button>
              )}
            </div>
          </div>

          {/* Scrollable Catalog Table / List */}
          <div className="max-h-[540px] overflow-y-auto pr-1 space-y-2">
            {filteredAllCredits.length === 0 && (
              <div className="rounded-2xl border border-white/10 bg-[#0c0e16]/80 p-8 text-center space-y-2">
                <p className="font-syne font-bold text-sm text-white">
                  No se encontraron créditos con ese criterio
                </p>
                <p className="text-xs text-zinc-400">
                  Prueba otro artista, canción, ISRC o limpia el filtro de rol activo.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setRoleFilter('ALL');
                  }}
                  className="mt-2 inline-flex items-center px-3.5 py-1.5 rounded-xl bg-red-600/20 hover:bg-red-600/35 border border-red-500/40 text-xs font-mono font-bold text-red-200 transition cursor-pointer"
                >
                  Ver los {BADLENZ_CAREER_SUMMARY.totalCredits} créditos
                </button>
              </div>
            )}
            {filteredAllCredits.map((track, idx) => {
              const isPlaying = playingId === track.id;
              return (
                <div
                  key={track.id}
                  className={`rounded-xl border p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition ${
                    isPlaying
                      ? 'bg-red-950/30 border-red-500/60'
                      : 'bg-[#0c0e16]/90 border-white/8 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <span className="hidden sm:inline-block w-7 text-center font-mono text-[11px] text-zinc-500">
                      {String(idx + 1).padStart(2, '0')}
                    </span>

                    <div className="relative w-11 h-11 rounded-lg overflow-hidden bg-zinc-900 border border-white/10 shrink-0">
                      {track.albumArt ? (
                        <img
                          src={track.albumArt}
                          alt={track.title}
                          loading="lazy"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs font-bold text-zinc-500">
                          {track.title[0]}
                        </div>
                      )}
                      {track.previewUrl && (
                        <button
                          type="button"
                          onClick={() => toggleAudioPreview(track)}
                          className="absolute inset-0 bg-black/55 flex items-center justify-center cursor-pointer"
                          aria-label={isPlaying ? 'Pausar' : 'Escuchar'}
                        >
                          {isPlaying ? (
                            <Pause className="w-4 h-4 text-amber-300 fill-current" />
                          ) : (
                            <Play className="w-4 h-4 text-white fill-current ml-0.5" />
                          )}
                        </button>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="font-syne font-bold text-sm text-white truncate">
                          {track.title}
                        </span>
                        {track.source === 'BMG' && (
                          <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-500/20 border border-amber-400/50 text-amber-300">
                            BMG
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-zinc-400 truncate">
                        {track.artists}{' '}
                        <span className="text-zinc-600">· {track.releaseDate}</span>
                        {track.isrc && (
                          <span className="hidden md:inline text-zinc-600 font-mono text-[10px]">
                            {' '}
                            · ISRC {track.isrc}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between sm:justify-end gap-2 shrink-0">
                    <div className="flex items-center gap-1">
                      {track.roleLabels.map((rl) => (
                        <span
                          key={rl}
                          className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-950/60 border border-red-800/40 text-red-200"
                        >
                          {rl}
                        </span>
                      ))}
                    </div>

                    {track.youtubeViews ? (
                      <a
                        href={track.youtubeUrl || '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-amber-500/15 border border-amber-400/40 text-amber-300"
                      >
                        <Youtube className="w-3 h-3 text-red-400" />
                        <span>{formatCompact(track.youtubeViews)}</span>
                      </a>
                    ) : track.popularity !== null ? (
                      <span className="text-[10px] font-mono text-zinc-500 px-2 py-0.5 rounded bg-black/40 border border-white/10">
                        Pop {track.popularity}
                      </span>
                    ) : null}

                    {track.spotifyUrl && (
                      <a
                        href={track.spotifyUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] font-mono text-emerald-400 hover:underline font-bold px-1.5"
                      >
                        Spotify ↗
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4C. VIEW MODE: PLAYLIST OFICIAL SPOTIFY (PRODUCED BY BADLENZ) */}
      {viewMode === 'playlist' && (
        <div className="relative z-10 rounded-2xl bg-[#0c0e16]/95 border border-emerald-500/30 p-4 sm:p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-emerald-400">
                SPOTIFY OFFICIAL PLAYLIST
              </span>
              <h3 className="font-syne text-lg font-bold text-white">
                Produced By Badlenz · La Facultad Studio
              </h3>
            </div>
            <a
              href={SPOTIFY_PLAYLIST_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-mono font-extrabold text-xs transition self-start sm:self-auto"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Abrir en Spotify</span>
            </a>
          </div>

          <iframe
            title="Spotify Embed: Produced By Badlenz"
            src={SPOTIFY_PLAYLIST_EMBED_URL}
            width="100%"
            height="380"
            frameBorder="0"
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            loading="lazy"
            className="rounded-xl bg-[#07080d]"
          />
        </div>
      )}

      {/* 5. FOOTER CTA TO BOOKING */}
      <div className="relative z-10 bg-[#0d0f17] rounded-2xl border border-white/10 p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-600/15 border border-red-500/35 flex items-center justify-center text-red-400 shrink-0">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white uppercase font-syne tracking-wide">
              ¿Listo para trabajar tu próximo tema con calidad comprobada?
            </h4>
            <p className="text-xs text-zinc-400">
              Dirección vocal 1 a 1, cadena analógica Neumann TLM 103 + Apollo y el mismo estándar de mezcla y máster de estos lanzamientos.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            if (onBookSession) {
              onBookSession();
            } else {
              document.getElementById('seccion-calendario-booking')?.scrollIntoView({ behavior: 'smooth' });
            }
          }}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-amber-500 hover:from-red-500 hover:to-amber-400 text-white font-black text-xs uppercase tracking-wider transition shrink-0 shadow-lg shadow-red-950/50 cursor-pointer"
        >
          Apartar Sesión ($130 USD) →
        </button>
      </div>
    </section>
  );
};

export default CreditsBentoGrid;
