import React, { useState, useRef } from 'react';
import { 
  Play, 
  Pause, 
  Music2, 
  Disc3, 
  Sparkles, 
  Radio, 
  Flame
} from 'lucide-react';

export interface StudioTrackCredit {
  id: string;
  title: string;
  artist: string;
  year: string;
  genre: string;
  role: string;
  releaseContext: string;
  accentColor: string;
  bpm: number;
}

export const STUDIO_CREDITS: StudioTrackCredit[] = [
  {
    id: 'vc-1',
    title: 'Sigue Llamando',
    artist: 'Cano El Barbaro ft. Badlenz & JVO The Writer',
    year: '2023',
    genre: 'Reggaetón Comercial',
    role: 'PRODUCCIÓN • CO-COMPOSICIÓN • VOCAL MASTER',
    releaseContext: 'Barbaros Team Records • Hit Urbano',
    accentColor: 'from-amber-600/25 via-black to-red-950/20',
    bpm: 94
  },
  {
    id: 'vc-2',
    title: 'Hablaron',
    artist: 'Prozer El Naztyko & Cano El Barbaro',
    year: '2024',
    genre: 'Trap Latino / Malianteo',
    role: 'PROD. BY BADLENZ • STEMS MIX & MASTER',
    releaseContext: 'Lanzamiento Oficial • Barbaros Team',
    accentColor: 'from-emerald-600/25 via-black to-zinc-950/30',
    bpm: 135
  },
  {
    id: 'vc-3',
    title: 'Mientes',
    artist: 'Superior & Badlenz',
    year: '2024',
    genre: 'Reggaetón / R&B Urbano',
    role: 'PROD EJECUTIVA • VOCAL TRACKING (NEUMANN TLM 103) • MASTER',
    releaseContext: 'Sencillo Oficial en Streaming',
    accentColor: 'from-red-600/25 via-black to-amber-950/20',
    bpm: 96
  },
  {
    id: 'vc-4',
    title: 'Te Olvidé',
    artist: 'LionD, Louis, Joey Angel & Badlenz',
    year: '2023',
    genre: 'Reggaetón Romántico',
    role: 'PROD. LA FACULTAD BEATZ • MEZCLA MULTITRACK',
    releaseContext: 'MvMusic / MvProduction Family',
    accentColor: 'from-cyan-600/25 via-black to-blue-950/20',
    bpm: 92
  },
  {
    id: 'vc-5',
    title: 'Blanco Perla',
    artist: 'GAV ft. Badlenz',
    year: '2024',
    genre: 'Trap / Urbano Contemporáneo',
    role: 'CO-PROD • ARREGLOS VOCALES • MASTERING',
    releaseContext: 'Apple Music & Spotify Single',
    accentColor: 'from-purple-600/25 via-black to-red-950/20',
    bpm: 128
  },
  {
    id: 'vc-6',
    title: 'Control',
    artist: 'Joey Angel & LionD',
    year: '2024',
    genre: 'Reggaetón Club / Perreo',
    role: 'PROD. LA FACULTAD • AFINACIÓN MELODYNE • MÁSTER -14 LUFS',
    releaseContext: 'Catálogo de Cabina La Facultad Studio',
    accentColor: 'from-amber-500/25 via-black to-red-900/20',
    bpm: 98
  }
];

export const CreditsBentoGrid: React.FC = () => {
  const [playingId, setPlayingId] = useState<string | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const synthTimerRef = useRef<number | null>(null);

  // Play synthesized urban preview loop for each track using Web Audio API
  const stopAudio = () => {
    if (synthTimerRef.current) {
      window.clearInterval(synthTimerRef.current);
      synthTimerRef.current = null;
    }
    if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
      try {
        audioCtxRef.current.close();
      } catch (e) {
        // ignore
      }
      audioCtxRef.current = null;
    }
    setPlayingId(null);
  };

  const playTrackPreview = (track: StudioTrackCredit) => {
    if (playingId === track.id) {
      stopAudio();
      return;
    }

    stopAudio();
    setPlayingId(track.id);

    try {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtxClass();
      audioCtxRef.current = ctx;

      const tempo = track.bpm;
      const stepDuration = 60 / tempo / 4; // 16th notes
      let step = 0;

      const triggerKick = (time: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.frequency.setValueAtTime(140, time);
        osc.frequency.exponentialRampToValueAtTime(42, time + 0.12);
        gain.gain.setValueAtTime(0.85, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.25);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(time);
        osc.stop(time + 0.25);
      };

      const triggerSnare = (time: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(220, time);
        gain.gain.setValueAtTime(0.4, time);
        gain.gain.exponentialRampToValueAtTime(0.01, time + 0.15);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(time);
        osc.stop(time + 0.15);
      };

      const triggerDembow = () => {
        const now = ctx.currentTime;
        // Standard reggaeton pattern: Kick on 0, 4, 8, 12. Snare on 3, 6, 11, 14
        const subStep = step % 16;
        if (subStep === 0 || subStep === 4 || subStep === 8 || subStep === 12) {
          triggerKick(now);
        }
        if (subStep === 3 || subStep === 6 || subStep === 11 || subStep === 14) {
          triggerSnare(now);
        }
        step++;
      };

      synthTimerRef.current = window.setInterval(triggerDembow, stepDuration * 1000);
    } catch (err) {
      console.warn('Web Audio synth preview fallback notice:', err);
    }
  };

  return (
    <section id="creditos" className="space-y-6 scroll-mt-24">
      {/* HEADER SECTION */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 border-b border-[#1e2230] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
            <span className="text-[11px] font-mono tracking-widest text-red-400 font-bold uppercase">
              DISCOGRAFÍA &amp; PRODUCCIÓN EN CABINA
            </span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-display uppercase tracking-wide text-white mt-1.5">
            PRODUCCIÓN COMERCIAL POR <span className="text-red-500">BADLENZ</span>
          </h2>
          <p className="text-xs sm:text-sm text-gray-400 mt-1 max-w-2xl font-body">
            Canciones producidas, grabadas con el micrófono Neumann TLM 103, afinadas y masterizadas en La Facultad Studio (Hormigueros, PR).
          </p>
        </div>
      </div>

      {/* TRACK CREDITS BENTO GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
        {STUDIO_CREDITS.map((track, idx) => {
          const isPlayingThis = playingId === track.id;
          return (
            <div
              key={track.id}
              className={`relative overflow-hidden rounded-2xl border transition-all duration-300 p-5 flex flex-col justify-between gap-4 bg-gradient-to-br ${track.accentColor} bg-[#0a0b12] ${
                isPlayingThis 
                  ? 'border-red-500 shadow-xl shadow-red-950/50 ring-1 ring-red-500/60 scale-[1.01]' 
                  : 'border-[#1b1e2c] hover:border-[#2f344d]'
              }`}
            >
              {/* Top metadata */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 text-[10px] font-mono text-gray-400">
                  <span className="text-amber-400 font-bold">0{idx + 1}</span>
                  <span>·</span>
                  <span>{track.year}</span>
                  <span>·</span>
                  <span className="text-gray-300">{track.genre}</span>
                </div>

                <span className="text-[9px] font-mono font-bold text-red-400 bg-red-950/60 border border-red-800/40 px-2 py-0.5 rounded">
                  Single Oficial
                </span>
              </div>

              {/* Title & Artist */}
              <div>
                <h3 className="text-xl font-display font-black text-white uppercase tracking-wide leading-tight">
                  {track.title}
                </h3>
                <p className="text-xs text-gray-300 font-semibold mt-1">
                  {track.artist}
                </p>
                <p className="text-[10px] font-mono text-gray-400 mt-0.5">
                  {track.releaseContext}
                </p>
              </div>

              {/* Roles & Audio Demo trigger */}
              <div className="pt-3 border-t border-[#1e2230]/70 flex items-center justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <span className="text-[9px] font-mono text-gray-300 block uppercase font-bold truncate">
                    {track.role}
                  </span>
                  <span className="text-[9px] font-mono text-gray-500 block">
                    {track.bpm} BPM · Sesión Pro Tools
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => playTrackPreview(track)}
                  className={`w-9 h-9 rounded-full flex items-center justify-center transition shrink-0 ${
                    isPlayingThis 
                      ? 'bg-red-600 text-white shadow-lg shadow-red-600/50 animate-pulse' 
                      : 'bg-[#141724] hover:bg-[#1f2438] text-gray-300 hover:text-white border border-[#262c44]'
                  }`}
                  aria-label={isPlayingThis ? 'Pausar beat' : 'Escuchar beat preview'}
                  title={isPlayingThis ? 'Pausar preview rítmico' : 'Escuchar ritmo y compás'}
                >
                  {isPlayingThis ? (
                    <Pause className="w-3.5 h-3.5 fill-current" />
                  ) : (
                    <Play className="w-3.5 h-3.5 fill-current ml-0.5 text-amber-400" />
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* FOOTER CALL TO ACTION */}
      <div className="bg-[#0e1017] rounded-2xl border border-[#1e2230] p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-600/10 border border-red-500/30 flex items-center justify-center text-red-500 shrink-0">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white uppercase font-display tracking-wide">
              ¿Quieres este mismo nivel para tu próximo tema?
            </h4>
            <p className="text-xs text-gray-400">
              Mismo micrófono Neumann TLM 103, misma sala tratada y dirección de Badlenz incluida.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            document.getElementById('seccion-calendario-booking')?.scrollIntoView({ behavior: 'smooth' });
          }}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-amber-500 hover:from-red-500 hover:to-amber-400 text-white font-black text-xs uppercase tracking-wider transition shrink-0 shadow-lg shadow-red-950/50 cursor-pointer"
        >
          Apartar Sesión en Cabina ($130 USD) →
        </button>
      </div>
    </section>
  );
};

export default CreditsBentoGrid;
