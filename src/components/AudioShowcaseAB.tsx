import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Volume2, VolumeX, Sparkles, Sliders, CheckCircle2, Radio, Music, Loader2 } from 'lucide-react';
import { getShowcaseTracks, ShowcaseTrack } from '../services/db';
import { getAudioPlayableUrl } from '../services/audioStorage';

export const AudioShowcaseAB: React.FC = () => {
  const [tracks, setTracks] = useState<ShowcaseTrack[]>(() => getShowcaseTracks());
  const [selectedTrackIndex, setSelectedTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(16); // 16s demo loop
  const [mode, setMode] = useState<'A' | 'B'>('B'); // B = Master La Facultad (default)
  const [isMuted, setIsMuted] = useState(false);
  const [lufsMeter, setLufsMeter] = useState(-8.9);

  // Audio Refs for HTML5 Audio Tags (Supports actual audio files on Mobile & Safari)
  const audioARef = useRef<HTMLAudioElement | null>(null);
  const audioBRef = useRef<HTMLAudioElement | null>(null);

  // Web Audio Synth Fallback References
  const audioCtxRef = useRef<AudioContext | null>(null);
  const filterNodeRef = useRef<BiquadFilterNode | null>(null);
  const highShelfRef = useRef<BiquadFilterNode | null>(null);
  const intervalLoopRef = useRef<number | null>(null);
  const progressIntervalRef = useRef<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const refreshTracks = () => {
      setTracks(getShowcaseTracks());
    };
    refreshTracks();
    window.addEventListener('la_facultad_showcase_updated', refreshTracks);
    window.addEventListener('storage', refreshTracks);
    return () => {
      window.removeEventListener('la_facultad_showcase_updated', refreshTracks);
      window.removeEventListener('storage', refreshTracks);
    };
  }, []);

  const currentTrack = tracks[selectedTrackIndex] || tracks[0];
  const [playableAudioA, setPlayableAudioA] = useState<string>('');
  const [playableAudioB, setPlayableAudioB] = useState<string>('');

  useEffect(() => {
    let active = true;
    if (currentTrack?.audioAUrl) {
      getAudioPlayableUrl(currentTrack.audioAUrl).then(url => {
        if (active) setPlayableAudioA(url);
      });
    } else {
      setPlayableAudioA('');
    }

    if (currentTrack?.audioBUrl) {
      getAudioPlayableUrl(currentTrack.audioBUrl).then(url => {
        if (active) setPlayableAudioB(url);
      });
    } else {
      setPlayableAudioB('');
    }
    return () => { active = false; };
  }, [currentTrack]);

  const hasCustomAudio = Boolean(playableAudioA || playableAudioB);

  // Synchronize HTML5 Audio volumes and coordinate global playback
  useEffect(() => {
    const handleGlobalAudio = (e: any) => {
      if (e.detail?.source !== 'showcase' && isPlaying) {
        stopAudioEngine();
        setIsPlaying(false);
      }
    };
    window.addEventListener('studio-audio-play', handleGlobalAudio);
    return () => window.removeEventListener('studio-audio-play', handleGlobalAudio);
  }, [isPlaying]);

  useEffect(() => {
    if (audioARef.current) {
      audioARef.current.volume = isMuted ? 0 : 1;
    }
    if (audioBRef.current) {
      audioBRef.current.volume = isMuted ? 0 : 1;
    }
  }, [isMuted]);

  // Handle Play/Pause for both Custom Audio & Web Audio Synth
  const togglePlay = () => {
    if (isPlaying) {
      stopAudioEngine();
      setIsPlaying(false);
    } else {
      startAudioEngine();
      setIsPlaying(true);
    }
  };

  const startAudioEngine = () => {
    setIsLoadingAudio(true);
    // Notificar a otros reproductores (ej: barra flotante AudioDock) para evitar superposición
    window.dispatchEvent(new CustomEvent('studio-audio-play', { detail: { source: 'showcase' } }));

    if (hasCustomAudio) {
      // Reproducir ÚNICAMENTE la pista activa en móviles y desktop para evitar doble sonido
      const activeEl = mode === 'A' ? audioARef.current : audioBRef.current;
      const inactiveEl = mode === 'A' ? audioBRef.current : audioARef.current;

      if (inactiveEl) {
        inactiveEl.pause();
      }

      if (activeEl) {
        if (inactiveEl && inactiveEl.currentTime) {
          activeEl.currentTime = inactiveEl.currentTime;
        }
        activeEl.volume = isMuted ? 0 : 1;
        const p = activeEl.play();
        if (p && p.catch) p.catch(() => {});
      }
      setIsLoadingAudio(false);
      return;
    }

    // Web Audio Fallback Engine
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioCtx();
      }

      if (audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume();
      }

      const ctx = audioCtxRef.current;
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(isMuted ? 0 : 0.28, ctx.currentTime);

      const lowpass = ctx.createBiquadFilter();
      lowpass.type = 'lowpass';
      lowpass.frequency.setValueAtTime(mode === 'A' ? 2800 : 18000, ctx.currentTime);
      filterNodeRef.current = lowpass;

      const highShelf = ctx.createBiquadFilter();
      highShelf.type = 'highshelf';
      highShelf.frequency.setValueAtTime(10000, ctx.currentTime);
      highShelf.gain.setValueAtTime(mode === 'A' ? -6 : 7.5, ctx.currentTime);
      highShelfRef.current = highShelf;

      lowpass.connect(highShelf);
      highShelf.connect(masterGain);
      masterGain.connect(ctx.destination);

      let step = 0;
      const bpm = currentTrack?.bpm || 140;
      const stepDuration = 60 / bpm / 2;

      const playDrumHit = () => {
        if (!ctx || ctx.state !== 'running') return;
        const now = ctx.currentTime;
        const isKickStep = (step % 4 === 0) || (mode === 'B' && step % 8 === 6);
        const isSnareStep = (step % 8 === 4);

        if (isKickStep) {
          const osc = ctx.createOscillator();
          const kickGain = ctx.createGain();
          osc.type = mode === 'B' ? 'sine' : 'triangle';
          osc.frequency.setValueAtTime(mode === 'B' ? 140 : 90, now);
          osc.frequency.exponentialRampToValueAtTime(mode === 'B' ? 42 : 55, now + 0.12);
          kickGain.gain.setValueAtTime(mode === 'B' ? 0.9 : 0.45, now);
          kickGain.gain.exponentialRampToValueAtTime(0.001, now + (mode === 'B' ? 0.38 : 0.18));
          osc.connect(kickGain);
          kickGain.connect(lowpass);
          osc.start(now);
          osc.stop(now + 0.4);
        }

        if (isSnareStep) {
          const noiseOsc = ctx.createOscillator();
          const snareGain = ctx.createGain();
          noiseOsc.type = 'sawtooth';
          noiseOsc.frequency.setValueAtTime(mode === 'B' ? 240 : 180, now);
          noiseOsc.frequency.exponentialRampToValueAtTime(80, now + 0.08);
          snareGain.gain.setValueAtTime(mode === 'B' ? 0.4 : 0.15, now);
          snareGain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
          noiseOsc.connect(snareGain);
          snareGain.connect(lowpass);
          noiseOsc.start(now);
          noiseOsc.stop(now + 0.15);
        }

        if (step % 2 === 0) {
          const synth = ctx.createOscillator();
          const synthGain = ctx.createGain();
          synth.type = mode === 'B' ? 'sawtooth' : 'sine';
          const baseFrequencies = [220, 261.63, 329.63, 392];
          const freq = baseFrequencies[(step / 2) % baseFrequencies.length];
          synth.frequency.setValueAtTime(freq, now);
          synthGain.gain.setValueAtTime(mode === 'B' ? 0.18 : 0.08, now);
          synthGain.gain.exponentialRampToValueAtTime(0.001, now + stepDuration * 1.5);
          synth.connect(synthGain);
          synthGain.connect(lowpass);
          synth.start(now);
          synth.stop(now + stepDuration * 1.5);
        }

        step = (step + 1) % 16;
      };

      if (intervalLoopRef.current) {
        window.clearInterval(intervalLoopRef.current);
      }
      intervalLoopRef.current = window.setInterval(playDrumHit, stepDuration * 1000);

      // Progress tracker simulation
      if (progressIntervalRef.current) {
        window.clearInterval(progressIntervalRef.current);
      }
      setCurrentTime(0);
      progressIntervalRef.current = window.setInterval(() => {
        setCurrentTime(prev => (prev >= 16 ? 0 : prev + 0.25));
      }, 250);

    } catch (e) {
      console.warn('Audio playback error:', e);
    } finally {
      setIsLoadingAudio(false);
    }
  };

  const stopAudioEngine = () => {
    if (audioARef.current) audioARef.current.pause();
    if (audioBRef.current) audioBRef.current.pause();

    if (intervalLoopRef.current) {
      window.clearInterval(intervalLoopRef.current);
      intervalLoopRef.current = null;
    }
    if (progressIntervalRef.current) {
      window.clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
    if (audioCtxRef.current && audioCtxRef.current.state === 'running') {
      audioCtxRef.current.suspend();
    }
  };

  const handleToggleMode = (newMode: 'A' | 'B') => {
    setMode(newMode);
    setLufsMeter(newMode === 'A' ? -18.4 : -8.9);

    if (hasCustomAudio) {
      const currentActive = newMode === 'A' ? audioBRef.current : audioARef.current;
      const targetActive = newMode === 'A' ? audioARef.current : audioBRef.current;

      if (currentActive && targetActive) {
        const sharedTime = currentActive.currentTime || 0;
        targetActive.currentTime = sharedTime;

        if (isPlaying) {
          currentActive.pause();
          targetActive.volume = isMuted ? 0 : 1;
          const p = targetActive.play();
          if (p && p.catch) p.catch(() => {});
        } else {
          currentActive.pause();
          targetActive.pause();
        }
      }
      return;
    }

    if (audioCtxRef.current && filterNodeRef.current && highShelfRef.current) {
      const now = audioCtxRef.current.currentTime;
      if (newMode === 'A') {
        filterNodeRef.current.frequency.setTargetAtTime(2600, now, 0.05);
        highShelfRef.current.gain.setTargetAtTime(-8, now, 0.05);
      } else {
        filterNodeRef.current.frequency.setTargetAtTime(20000, now, 0.05);
        highShelfRef.current.gain.setTargetAtTime(8, now, 0.05);
      }
    }
  };

  // Canvas visualizer animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let phase = 0;
    const draw = () => {
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      // Background subtle grid
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
      ctx.lineWidth = 1;
      for (let x = 0; x < w; x += 30) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }

      // Draw frequency spectrum bars
      const numBars = 36;
      const barWidth = (w - (numBars - 1) * 3) / numBars;

      for (let i = 0; i < numBars; i++) {
        let barHeight = 6;
        if (isPlaying) {
          const factor = mode === 'B' ? 1.6 : 0.8;
          const freqMultiplier = mode === 'A' && i > 18 ? 0.2 : 1; // Highs cut in mode A
          const wave = Math.sin(phase + i * 0.35) * 0.5 + 0.5;
          const noise = Math.cos(phase * 1.5 + i * 0.8) * 0.3 + 0.5;
          barHeight = Math.max(6, (wave * 0.6 + noise * 0.4) * (h - 18) * factor * freqMultiplier);
        }

        const x = i * (barWidth + 3);
        const y = h - barHeight;

        // Gradient based on A or B
        const grad = ctx.createLinearGradient(0, y, 0, h);
        if (mode === 'B') {
          grad.addColorStop(0, '#f59e0b'); // Gold top
          grad.addColorStop(0.5, '#ef4444'); // Crimson mid
          grad.addColorStop(1, '#991b1b'); // Dark red bottom
        } else {
          grad.addColorStop(0, '#94a3b8');
          grad.addColorStop(1, '#334155');
        }

        ctx.fillStyle = grad;
        ctx.fillRect(x, y, barWidth, barHeight);

        // Peak dot
        if (isPlaying && mode === 'B') {
          ctx.fillStyle = '#fef08a';
          ctx.fillRect(x, Math.max(0, y - 3), barWidth, 2);
        }
      }

      phase += isPlaying ? 0.12 : 0.01;
      animFrameRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isPlaying, mode]);

  useEffect(() => {
    return () => {
      stopAudioEngine();
    };
  }, []);

  return (
    <div className="relative overflow-hidden rounded-3xl antigravity-glass-panel p-5 sm:p-7 shadow-[0_30px_70px_rgba(0,0,0,0.8)] border border-white/10" role="region" aria-label="Reproductor de Audio A/B en Vivo">
      {/* Hidden HTML5 Audio Tags for Seamless Mobile A/B Playback */}
      {playableAudioA && (
        <audio 
          ref={audioARef} 
          src={playableAudioA} 
          preload="auto" 
          loop 
          onTimeUpdate={(e) => {
            if (hasCustomAudio) {
              setCurrentTime(e.currentTarget.currentTime);
              if (e.currentTarget.duration && !isNaN(e.currentTarget.duration)) {
                setDuration(e.currentTarget.duration);
              }
            }
          }}
          onLoadedMetadata={(e) => {
            if (e.currentTarget.duration && !isNaN(e.currentTarget.duration)) {
              setDuration(e.currentTarget.duration);
            }
          }}
        />
      )}
      {playableAudioB && (
        <audio 
          ref={audioBRef} 
          src={playableAudioB} 
          preload="auto" 
          loop 
          onTimeUpdate={(e) => {
            if (hasCustomAudio) {
              setCurrentTime(e.currentTarget.currentTime);
              if (e.currentTarget.duration && !isNaN(e.currentTarget.duration)) {
                setDuration(e.currentTarget.duration);
              }
            }
          }}
          onLoadedMetadata={(e) => {
            if (e.currentTarget.duration && !isNaN(e.currentTarget.duration)) {
              setDuration(e.currentTarget.duration);
            }
          }}
        />
      )}

      {/* Decorative glow ambient background */}
      <div className={`absolute top-0 right-1/4 w-80 h-48 rounded-full blur-[90px] pointer-events-none transition-all duration-700 ${
        mode === 'B' ? 'bg-red-600/15' : 'bg-gray-600/10'
      }`} aria-hidden="true" />
      <div className="absolute -bottom-10 left-10 w-60 h-40 bg-amber-500/10 rounded-full blur-[80px] pointer-events-none" aria-hidden="true" />

      {/* Header Bar */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-gray-800 pb-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] uppercase font-mono tracking-widest px-2.5 py-0.5 rounded-full bg-red-950 text-red-400 border border-red-800/50 flex items-center gap-1.5 font-bold">
              <Radio className={`w-3 h-3 ${isPlaying ? 'animate-pulse text-red-500' : ''}`} aria-hidden="true" />
              Prueba Auditiva A/B en Vivo
            </span>
            {hasCustomAudio ? (
              <span className="text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800/80 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                <Music className="w-3 h-3" aria-hidden="true" />
                Audio Real Grabado en Estudio
              </span>
            ) : (
              <span className="text-[10px] text-amber-400/90 font-mono hidden sm:inline-block">
                • Calidad Comercial Hormigueros, PR
              </span>
            )}
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight mt-1 flex items-center gap-2">
            <span>Escucha el Sonido</span>
            <span className="bg-gradient-to-r from-red-500 via-amber-400 to-red-400 bg-clip-text text-transparent">
              La Facultad
            </span>
          </h2>
          <p className="text-xs text-gray-300 max-w-xl">
            Compara en tiempo real la diferencia entre una maqueta sin procesar y el estándar comercial de Badlenz con procesamiento profesional y afinación de élite.
          </p>
        </div>

        {/* Track Selector buttons / Badge */}
        {tracks.length > 1 ? (
          <div className="flex items-center gap-2 bg-black/50 p-1 rounded-xl border border-gray-800 self-start md:self-auto overflow-x-auto max-w-full" role="tablist" aria-label="Pistas de demostración">
            {tracks.map((t, idx) => (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={selectedTrackIndex === idx}
                aria-label={`Pista de demostración: ${t.title}`}
                onClick={() => {
                  setSelectedTrackIndex(idx);
                  if (isPlaying) {
                    stopAudioEngine();
                    setTimeout(startAudioEngine, 100);
                  }
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none ${
                  selectedTrackIndex === idx
                    ? 'bg-red-700 text-white shadow-md'
                    : 'text-gray-300 hover:text-white'
                }`}
              >
                {t.title}
              </button>
            ))}
          </div>
        ) : (
          <div className="flex items-center gap-2 bg-black/60 px-3 py-1.5 rounded-xl border border-red-900/60 self-start md:self-auto">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-xs font-bold text-white tracking-wide uppercase font-mono">{tracks[0]?.title || 'Tukutu'}</span>
            <span className="text-[11px] text-gray-400">— {tracks[0]?.artist || 'Zyron'}</span>
          </div>
        )}
      </div>

      {/* Main Interactive Showcase Grid */}
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-5 mt-5 items-center">
        
        {/* Left: Waveform & Playback Engine */}
        <div className="lg:col-span-7 bg-[#0b0c14]/85 backdrop-blur-xl p-5 rounded-2xl border border-white/10 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                aria-pressed={isPlaying}
                aria-label={isPlaying ? 'Pausar reproductor de audio demo' : 'Reproducir demo interactiva en vivo'}
                onClick={togglePlay}
                className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold transition-all shadow-lg active:scale-95 cursor-pointer focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none ${
                  isPlaying
                    ? 'bg-red-600 hover:bg-red-500 text-white shadow-[0_0_20px_rgba(239,68,68,0.4)]'
                    : 'bg-amber-500 hover:bg-amber-400 text-gray-950 shadow-[0_0_20px_rgba(245,158,11,0.3)]'
                }`}
                title={isPlaying ? 'Pausar audio demo' : 'Reproducir demo interactiva'}
              >
                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5 fill-current" />}
              </button>

              <div>
                <span className="text-white font-black text-sm block">
                  {currentTrack.title}
                </span>
                <span className="text-[11px] text-gray-300 font-mono block">
                  {currentTrack.artist} • <strong className="text-amber-400">{currentTrack.genre}</strong> ({currentTrack.bpm} BPM)
                </span>
              </div>
            </div>

            {/* Loudness / LUFS Meter Gauge */}
            <div className="bg-black/70 px-3 py-1.5 rounded-lg border border-gray-800 text-right" aria-live="polite">
              <span className="text-[9px] uppercase font-mono text-gray-400 block font-bold">
                Loudness Comercial
              </span>
              <span className={`text-xs font-mono font-bold ${
                mode === 'B' ? 'text-emerald-400' : 'text-gray-300'
              }`}>
                {isPlaying ? `${lufsMeter.toFixed(1)} LUFS` : '-inf LUFS'}
              </span>
            </div>
          </div>

          {/* Canvas Spectrum Display */}
          <div className="relative w-full h-24 bg-black/80 rounded-lg border border-gray-800/80 overflow-hidden flex items-center justify-center" aria-hidden="true">
            <canvas
              ref={canvasRef}
              width={540}
              height={96}
              className="w-full h-full object-cover"
            />
            {!isPlaying && !isLoadingAudio && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center gap-2 text-xs font-bold text-gray-300">
                <Play className="w-4 h-4 text-amber-500" />
                <span>Haz clic en Play para activar la preescucha en vivo</span>
              </div>
            )}
            {isLoadingAudio && (
              <div className="absolute inset-0 bg-black/70 flex items-center justify-center gap-2 text-xs font-bold text-amber-400">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Cargando audio en alta fidelidad...</span>
              </div>
            )}
          </div>

          {/* Smooth Audio Progress Bar & Time Tracker & Quick Cue Points */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-[10px] font-mono text-gray-400">
              <span>{Math.floor(currentTime / 60)}:{Math.floor(currentTime % 60).toString().padStart(2, '0')}</span>
              <span>{isPlaying ? (mode === 'B' ? '★ Master V1 Badlenz' : 'Referencia Reff') : 'Pausado'}</span>
              <span>{Math.floor((duration || 0) / 60)}:{Math.floor((duration || 0) % 60).toString().padStart(2, '0')}</span>
            </div>
            <div 
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const clickX = e.clientX - rect.left;
                const pct = Math.max(0, Math.min(1, clickX / rect.width));
                const newTime = pct * (duration || 1);
                setCurrentTime(newTime);
                if (audioARef.current) audioARef.current.currentTime = newTime;
                if (audioBRef.current) audioBRef.current.currentTime = newTime;
              }}
              className="w-full bg-gray-900 h-2.5 rounded-full overflow-hidden border border-gray-800 cursor-pointer"
            >
              <div 
                className={`h-full transition-all duration-150 ${
                  mode === 'B' 
                    ? 'bg-gradient-to-r from-red-600 via-amber-500 to-amber-300' 
                    : 'bg-gray-500'
                }`}
                style={{ width: `${Math.min(100, (currentTime / (duration || 1)) * 100)}%` }}
              />
            </div>

            {/* Cue points for instant A/B impact */}
            <div className="flex items-center gap-1.5 pt-1 text-[10px] font-mono">
              <span className="text-gray-500 font-bold uppercase text-[9px]">Saltar a:</span>
              <button
                type="button"
                onClick={() => {
                  const targetTime = 0;
                  setCurrentTime(targetTime);
                  if (audioARef.current) audioARef.current.currentTime = targetTime;
                  if (audioBRef.current) audioBRef.current.currentTime = targetTime;
                  if (!isPlaying) togglePlay();
                }}
                className="px-2 py-0.5 rounded bg-black/60 hover:bg-gray-800 text-gray-300 hover:text-white border border-gray-800 cursor-pointer transition"
              >
                0:00 Intro
              </button>
              <button
                type="button"
                onClick={() => {
                  const targetTime = 16;
                  setCurrentTime(targetTime);
                  if (audioARef.current) audioARef.current.currentTime = targetTime;
                  if (audioBRef.current) audioBRef.current.currentTime = targetTime;
                  if (!isPlaying) togglePlay();
                }}
                className="px-2 py-0.5 rounded bg-red-950/60 hover:bg-red-900/80 text-amber-300 border border-red-800/80 cursor-pointer transition font-bold flex items-center gap-1"
              >
                <Sparkles className="w-2.5 h-2.5 text-amber-400" />
                <span>0:16 Drop / Coro</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  const targetTime = 45;
                  setCurrentTime(targetTime);
                  if (audioARef.current) audioARef.current.currentTime = targetTime;
                  if (audioBRef.current) audioBRef.current.currentTime = targetTime;
                  if (!isPlaying) togglePlay();
                }}
                className="px-2 py-0.5 rounded bg-black/60 hover:bg-gray-800 text-gray-300 hover:text-white border border-gray-800 cursor-pointer transition"
              >
                0:45 Verso
              </button>
            </div>
          </div>

          {/* Mode Description Banner */}
          <div className={`p-2.5 rounded-lg border transition-all text-xs ${
            mode === 'B' 
              ? 'bg-amber-500/10 border-amber-500/30 text-amber-200' 
              : 'bg-gray-900/60 border-gray-700 text-gray-300'
          }`} aria-live="polite">
            <span className="font-bold uppercase tracking-wider text-[10px] block mb-0.5">
              {mode === 'B' ? '🔥 Tratamiento Comercial Activo (Master Badlenz):' : '⚠️ Estado Bypass (Voz Seca / Sin Mezcla):'}
            </span>
            <p className="text-[11px] opacity-90 leading-relaxed">
              {mode === 'B' ? currentTrack.descriptionB : currentTrack.descriptionA}
            </p>
          </div>
        </div>

        {/* Right: The Master A/B Toggle Switcher (Conversion Center) */}
        <div className="lg:col-span-5 flex flex-col justify-center space-y-4 bg-[#0e101a]/85 backdrop-blur-xl p-5 sm:p-6 rounded-2xl border border-white/10 shadow-xl">
          <div className="flex items-center justify-between border-b border-gray-800 pb-2">
            <span className="text-[11px] font-black text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-amber-500" aria-hidden="true" />
              Interruptor A/B (Instantáneo)
            </span>
            <span className="text-[9px] font-mono text-gray-400">Latencia Cero</span>
          </div>

          {/* The Big Dual Switch */}
          <div className="grid grid-cols-2 gap-2 p-1.5 bg-black/60 rounded-xl border border-gray-800" role="group" aria-label="Modo de Audio A/B">
            {/* Opción A: Referencia Reff */}
            <button
              type="button"
              aria-pressed={mode === 'A'}
              aria-label="Opción A: Escuchar Referencia Reff"
              onClick={() => handleToggleMode('A')}
              className={`p-3 rounded-lg text-left transition-all relative focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none ${
                mode === 'A'
                  ? 'bg-gray-800 text-white border-2 border-gray-400 shadow-md'
                  : 'text-gray-300 hover:text-white border-2 border-transparent'
              }`}
            >
              <span className="text-[10px] uppercase font-mono font-bold block text-gray-300">
                Opción A
              </span>
              <span className="text-xs font-black block mt-0.5">
                Referencia (Reff)
              </span>
              <span className="text-[9px] text-gray-300 block mt-1">
                Guía de maqueta sin master
              </span>
            </button>

            {/* Opción B: Master V1 Badlenz */}
            <button
              type="button"
              aria-pressed={mode === 'B'}
              aria-label="Opción B: Escuchar Master V1 Badlenz procesado y masterizado"
              onClick={() => handleToggleMode('B')}
              className={`p-3 rounded-lg text-left transition-all relative focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none ${
                mode === 'B'
                  ? 'bg-gradient-to-br from-red-600 to-amber-600 text-white border-2 border-amber-400 shadow-[0_0_20px_rgba(239,68,68,0.35)] scale-[1.02]'
                  : 'text-gray-300 hover:text-white border-2 border-transparent'
              }`}
            >
              <div className="absolute top-2 right-2 text-amber-300" aria-hidden="true">
                <Sparkles className="w-3.5 h-3.5 animate-pulse" />
              </div>
              <span className="text-[10px] uppercase font-mono font-black block text-amber-200">
                Opción B ★
              </span>
              <span className="text-xs font-black block mt-0.5">
                Master V1 (Badlenz)
              </span>
              <span className="text-[9px] text-amber-100 block mt-1">
                Mezcla y master comercial
              </span>
            </button>
          </div>

          {/* Key Audio Perks Highlights & Direct CRO Fast-Track CTA */}
          <div className="space-y-2 pt-1">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-[11px] text-gray-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Premezcla entregada el mismo día • Master final en 24 a 48 horas.</span>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-gray-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span><strong>2 Revisiones gratis</strong> incluidas con tu master (Melodyne + Auto-Tune Pro).</span>
              </div>
            </div>

            <div className="pt-2 border-t border-gray-800">
              <button
                type="button"
                onClick={() => {
                  const target = document.getElementById('seccion-personal');
                  if (target) {
                    target.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
                className="w-full bg-gradient-to-r from-red-600 to-amber-500 hover:from-red-500 hover:to-amber-400 text-white font-black py-2.5 px-3 rounded-xl text-xs uppercase tracking-wider transition shadow-lg flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-amber-200 fill-amber-200" />
                <span>🔥 Quiero este sonido en mi tema (Apartar con $130) ➔</span>
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AudioShowcaseAB;
