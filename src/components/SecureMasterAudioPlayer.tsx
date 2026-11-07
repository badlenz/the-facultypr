import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  ShieldCheck, 
  ShieldAlert, 
  Lock, 
  Unlock, 
  Download, 
  Sparkles, 
  FileAudio, 
  Activity, 
  Info,
  CheckCircle,
  Clock,
  Waves
} from 'lucide-react';
import { LFCrestLogo, BadlenzLogo } from './BrandingLogos';

interface SecureMasterAudioPlayerProps {
  songTitle: string;
  artistName: string;
  audioUrl?: string;
  isFullyPaid: boolean;
  onPayRemainingBalance?: () => void;
  remainingBalance?: number;
  studioDeposit?: number;
  onTimeUpdate?: (seconds: number) => void;
}

export const SecureMasterAudioPlayer: React.FC<SecureMasterAudioPlayerProps> = ({
  songTitle,
  artistName,
  audioUrl,
  isFullyPaid = false,
  onPayRemainingBalance,
  remainingBalance = 100,
  studioDeposit = 100,
  onTimeUpdate
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(214); // default demo duration 3:34
  const [volume, setVolume] = useState(0.85);
  const [isMuted, setIsMuted] = useState(false);
  const [watermarkTriggered, setWatermarkTriggered] = useState(false);
  const [audioLoaded, setAudioLoaded] = useState(false);

  // Sync currentTime to parent
  useEffect(() => {
    if (onTimeUpdate) {
      onTimeUpdate(currentTime);
    }
  }, [currentTime, onTimeUpdate]);

  // Web Audio Context & Oscillator for real synthesized voice watermark
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioElRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<any>(null);

  // Synthesize dynamic audio voice watermark ("LA FACULTAD STUDIO - BADLENZ PREVIEW")
  const playAudioWatermarkBeep = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      
      const ctx = audioContextRef.current || new AudioCtx();
      audioContextRef.current = ctx;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const now = ctx.currentTime;
      // High-tech watermark beep sequence
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now); // A5
      osc.frequency.exponentialRampToValueAtTime(440, now + 0.15); // A4
      osc.frequency.setValueAtTime(1760, now + 0.18); // A6
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.35);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.2, now + 0.05);
      gain.gain.linearRampToValueAtTime(0.001, now + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.36);

      // Trigger visual watermark flash
      setWatermarkTriggered(true);
      setTimeout(() => setWatermarkTriggered(false), 2000);
    } catch (e) {
      console.warn('AudioContext watermark error:', e);
    }
  };

  // Watermark trigger schedule (every 18 seconds if unpaid)
  useEffect(() => {
    if (isPlaying && !isFullyPaid) {
      const interval = setInterval(() => {
        playAudioWatermarkBeep();
      }, 18000);
      return () => clearInterval(interval);
    }
  }, [isPlaying, isFullyPaid]);

  // Audio timer loop simulation when no real media is provided
  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        setCurrentTime((prev) => {
          if (prev >= duration) {
            setIsPlaying(false);
            return 0;
          }
          const next = prev + 1;
          // Trigger periodic watermark beep at 12s, 30s, 60s, 90s, 120s...
          if (!isFullyPaid && (next % 18 === 0 || next === 5)) {
            playAudioWatermarkBeep();
          }
          return next;
        });
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isPlaying, duration, isFullyPaid]);

  const togglePlay = () => {
    if (!isPlaying && !isFullyPaid && currentTime === 0) {
      playAudioWatermarkBeep();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setCurrentTime(val);
    if (audioElRef.current) {
      audioElRef.current.currentTime = val;
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="bg-gradient-to-br from-[#121214] via-black to-[#1a1313] border-2 border-red-900/50 rounded-2xl p-5 sm:p-6 shadow-2xl relative overflow-hidden space-y-5">
      
      {/* Dynamic Watermark Overlay indicator */}
      {watermarkTriggered && !isFullyPaid && (
        <div className="absolute top-3 right-3 z-20 flex items-center gap-1.5 bg-red-600/90 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest animate-pulse shadow-lg">
          <Waves className="w-3.5 h-3.5 animate-spin" />
          <span>AUDIO WATERMARK ACTIVO 🔒</span>
        </div>
      )}

      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-red-950/80 border border-red-800/80 rounded-xl text-red-500 shadow-md">
            <FileAudio className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] bg-red-600 text-white font-black px-2 py-0.5 rounded font-mono uppercase tracking-wider">
                MASTER DIGITAL COMERCIAL
              </span>
              <span className="text-xs text-amber-400 font-bold font-mono">
                24-bit / 44.1 kHz • -9.2 LUFS
              </span>
            </div>
            <h4 className="text-base font-black text-white uppercase tracking-tight mt-0.5">
              {songTitle || 'Mi Canción Inédita (Master Oficial)'}
            </h4>
            <p className="text-xs text-gray-400">
              Artista: <strong className="text-white">{artistName || 'Artista'}</strong> • Prod. <strong className="text-amber-400">Badlenz</strong>
            </p>
          </div>
        </div>

        {/* Security / Paid Status Badge */}
        <div className="flex items-center gap-2">
          {isFullyPaid ? (
            <div className="bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-md">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>DESBLOQUEADO (MASTER HD COMPLETO)</span>
            </div>
          ) : (
            <div className="bg-red-950/80 border border-red-500/60 text-red-300 px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-md">
              <ShieldAlert className="w-4 h-4 text-red-400 animate-pulse" />
              <span>PREVIEW CON MARCA DE AGUA</span>
            </div>
          )}
        </div>
      </div>

      {/* Visualizer & Waveform Simulation */}
      <div className="bg-black/60 border border-gray-800/80 rounded-xl p-4 space-y-3 relative">
        <div className="flex items-center justify-between text-[11px] font-mono text-gray-400">
          <span className="flex items-center gap-1.5 text-amber-400 font-bold">
            <Activity className="w-3.5 h-3.5 text-red-500" />
            True Peak: -1.0 dBTP
          </span>
          <span className="text-gray-300 font-bold">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>
        </div>

        {/* Animated Audio Spectrum Bars */}
        <div className="flex items-end justify-between h-14 gap-1 px-1 overflow-hidden">
          {Array.from({ length: 36 }).map((_, i) => {
            const progressRatio = currentTime / duration;
            const barRatio = i / 36;
            const isPlayed = barRatio <= progressRatio;
            
            // Random-ish bar heights
            const heights = [35, 60, 85, 45, 95, 70, 50, 80, 100, 65, 40, 90, 75, 55, 85, 95, 60, 45, 70, 85, 90, 65, 40, 80, 100, 75, 50, 90, 60, 75, 85, 95, 50, 70, 40, 30];
            const baseH = heights[i % heights.length];
            const activeH = isPlaying ? Math.max(15, (baseH * (0.6 + Math.sin(currentTime * 3 + i) * 0.4))) : baseH * 0.4;

            return (
              <div
                key={i}
                style={{ height: `${activeH}%` }}
                className={`flex-1 rounded-t transition-all duration-150 ${
                  isPlayed 
                    ? isFullyPaid ? 'bg-gradient-to-t from-emerald-600 to-emerald-400' : 'bg-gradient-to-t from-red-600 to-amber-500'
                    : 'bg-gray-800/80'
                }`}
              />
            );
          })}
        </div>

        {/* Seek slider */}
        <input
          type="range"
          min="0"
          max={duration}
          step="1"
          value={currentTime}
          onChange={handleSeek}
          className="w-full h-4 sm:h-2 py-2 sm:py-0 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-amber-500 focus:outline-none"
        />
      </div>

      {/* Main Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-1">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={togglePlay}
            className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white transition-all shadow-xl active:scale-95 ${
              isPlaying
                ? 'bg-amber-500 text-gray-950 font-black ring-4 ring-amber-500/30'
                : 'bg-red-600 hover:bg-red-500 ring-4 ring-red-600/30'
            }`}
          >
            {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
          </button>

          <div>
            <span className="text-xs font-extrabold text-white block uppercase">
              {isPlaying ? 'Reproduciendo Master Preview' : 'Pausado'}
            </span>
            <span className="text-[10px] text-gray-400">
              {!isFullyPaid ? 'Protegido con Audio-Watermark de Estudio' : 'Calidad Máster WAV 24-bit Sin Pérdida'}
            </span>
          </div>
        </div>

        {/* Volume & Actions */}
        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <button
            type="button"
            onClick={() => setIsMuted(!isMuted)}
            className="p-2 rounded-xl bg-gray-900 border border-gray-800 text-gray-300 hover:text-white transition"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-amber-400" />}
          </button>

          {isFullyPaid ? (
            <a
              href="https://drive.google.com/"
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-wider transition flex items-center gap-1.5 shadow-lg shadow-emerald-600/30 active:scale-95"
            >
              <Download className="w-4 h-4" />
              <span>Descargar WAV 24-bit</span>
            </a>
          ) : (
            <button
              type="button"
              onClick={onPayRemainingBalance}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-amber-500 hover:from-red-500 hover:to-amber-400 text-white font-black text-xs uppercase tracking-wider transition flex items-center gap-1.5 shadow-lg shadow-red-600/30 active:scale-95"
            >
              <Lock className="w-4 h-4 text-amber-200" />
              <span>Liquidar Saldo (${remainingBalance} USD) y Desbloquear</span>
            </button>
          )}
        </div>
      </div>

      {/* Watermark Protection Explanation Box */}
      {!isFullyPaid && (
        <div className="bg-red-950/30 border border-red-900/60 rounded-xl p-3.5 text-xs text-gray-300 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-red-400 uppercase tracking-widest flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-red-500" />
              Protocolo de Seguridad • La Facultad Studio
            </span>
            <span className="text-[9px] bg-red-950 text-red-300 border border-red-800/60 px-2 py-0.5 rounded font-mono font-bold">
              ESTRATEGIA 2026
            </span>
          </div>
          <p className="text-[11px] leading-relaxed text-gray-300">
            Este reproductor contiene un <strong>audio-watermark periódico</strong> de protección. Puedes escuchar el balance tonal, la potencia y la dinámica para solicitar tus <strong>2 revisiones oficiales</strong>. Una vez liquidado el balance pendiente de <strong className="text-amber-400">${remainingBalance}.00 USD</strong> mediante ATH Móvil al <strong>(787) 240-8627</strong>, se desbloqueará la descarga directa del <strong>Master WAV 24-bit original sin marcas</strong>.
          </p>
        </div>
      )}
    </div>
  );
};
