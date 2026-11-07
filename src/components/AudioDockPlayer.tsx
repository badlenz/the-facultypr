import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Volume2, VolumeX, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';

interface AudioDockPlayerProps {
  onBookClick?: () => void;
}

export const AudioDockPlayer: React.FC<AudioDockPlayerProps> = ({ onBookClick }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeChannel, setActiveChannel] = useState<'raw' | 'master'>('master');
  const [isMuted, setIsMuted] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [playbackProgress, setPlaybackProgress] = useState(0);

  const audioARef = useRef<HTMLAudioElement | null>(null);
  const audioBRef = useRef<HTMLAudioElement | null>(null);

  // Sync volume with active channel and mute state
  useEffect(() => {
    if (audioARef.current) {
      audioARef.current.volume = isMuted ? 0 : (activeChannel === 'raw' ? 1 : 0);
    }
    if (audioBRef.current) {
      audioBRef.current.volume = isMuted ? 0 : (activeChannel === 'master' ? 1 : 0);
    }
  }, [activeChannel, isMuted]);

  const togglePlay = () => {
    if (isPlaying) {
      if (audioARef.current) audioARef.current.pause();
      if (audioBRef.current) audioBRef.current.pause();
      setIsPlaying(false);
    } else {
      if (audioARef.current && audioBRef.current) {
        audioBRef.current.currentTime = audioARef.current.currentTime;
        audioARef.current.volume = isMuted ? 0 : (activeChannel === 'raw' ? 1 : 0);
        audioBRef.current.volume = isMuted ? 0 : (activeChannel === 'master' ? 1 : 0);
        
        const pA = audioARef.current.play();
        const pB = audioBRef.current.play();
        if (pA && pA.catch) pA.catch(() => {});
        if (pB && pB.catch) pB.catch(() => {});
      }
      setIsPlaying(true);
    }
  };

  const handleChannelSwitch = (channel: 'raw' | 'master') => {
    setActiveChannel(channel);
    if (audioARef.current && audioBRef.current) {
      const targetTime = channel === 'master' ? audioARef.current.currentTime : audioBRef.current.currentTime;
      audioARef.current.currentTime = targetTime;
      audioBRef.current.currentTime = targetTime;
      audioARef.current.volume = isMuted ? 0 : (channel === 'raw' ? 1 : 0);
      audioBRef.current.volume = isMuted ? 0 : (channel === 'master' ? 1 : 0);
    }
    if (!isPlaying) {
      togglePlay();
    }
  };

  const handleTimeUpdate = () => {
    const el = activeChannel === 'master' ? audioBRef.current : audioARef.current;
    if (el && el.duration) {
      setPlaybackProgress((el.currentTime / el.duration) * 100);
    }
  };

  return (
    <aside 
      aria-label="Reproductor de audio del estudio"
      className="fixed bottom-2 sm:bottom-3 left-2 sm:left-4 right-2 sm:right-4 max-w-5xl mx-auto z-40 antigravity-glass rounded-2xl border border-white/10 text-white shadow-[0_20px_50px_rgba(0,0,0,0.75)] transition-all duration-300 overflow-hidden"
    >
      {/* Hidden audio tags for seamless A/B switching */}
      <audio
        ref={audioARef}
        src="/zyron-tukutu-reff.mp3"
        preload="auto"
        loop
        onTimeUpdate={handleTimeUpdate}
      />
      <audio
        ref={audioBRef}
        src="/zyron-tukutu-master.m4a"
        preload="auto"
        loop
      />

      {/* Top micro progress bar */}
      <div className="w-full h-1 bg-[#151824] relative overflow-hidden">
        <div 
          className={`h-full transition-all duration-200 ${
            activeChannel === 'master' 
              ? 'bg-gradient-to-r from-red-600 via-amber-500 to-amber-400' 
              : 'bg-slate-500'
          }`}
          style={{ width: `${playbackProgress}%` }}
        />
      </div>

      {isCollapsed ? (
        <div className="px-3 py-1.5 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={togglePlay}
              className="w-7 h-7 rounded-full bg-red-600 hover:bg-red-500 text-white flex items-center justify-center cursor-pointer shadow"
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5 fill-white" /> : <Play className="w-3.5 h-3.5 fill-white ml-0.5" />}
            </button>
            <span className="font-mono text-[10px] text-gray-300">
              {activeChannel === 'master' ? 'Master V1' : 'Reff'} • Tukutu
            </span>
          </div>
          <button
            type="button"
            onClick={() => setIsCollapsed(false)}
            className="p-1 text-gray-400 hover:text-white cursor-pointer"
            title="Expandir reproductor"
          >
            <ChevronUp className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2 sm:py-2.5 flex items-center justify-between gap-2 sm:gap-3 text-xs">
          {/* Lado Izquierdo: Info de Pista y Control A/B */}
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              type="button"
              onClick={togglePlay}
              aria-label={isPlaying ? 'Pausar audio' : 'Reproducir muestra de audio'}
              className="w-9 h-9 rounded-full bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white flex items-center justify-center shrink-0 shadow-lg shadow-red-950/50 transition transform hover:scale-105 active:scale-95 cursor-pointer"
            >
              {isPlaying ? <Pause className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-white ml-0.5" />}
            </button>

            <div className="min-w-0 hidden xs:block">
              <div className="flex items-center gap-1.5 font-mono text-[10px] text-gray-400">
                <span className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-red-500 animate-ping' : 'bg-gray-600'}`} />
                <span className="font-bold text-white tracking-wider uppercase">Tukutu</span>
                <span>·</span>
                <span className="text-amber-400 font-mono">Zyron</span>
              </div>
              <p className="text-xs font-semibold text-gray-200 truncate">
                {activeChannel === 'master' ? 'Master V1 • Badlenz' : 'Referencia (Reff)'}
              </p>
            </div>
          </div>

          {/* Centro: Selector de Canal A/B */}
          <div className="flex items-center gap-1 bg-[#11131b] p-1 rounded-xl border border-[#1e2230]">
            <button
              type="button"
              onClick={() => handleChannelSwitch('raw')}
              className={`px-2 sm:px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold transition flex items-center gap-1 cursor-pointer ${
                activeChannel === 'raw'
                  ? 'bg-gray-800 text-white shadow'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <span>Referencia (Reff)</span>
            </button>

            <button
              type="button"
              onClick={() => handleChannelSwitch('master')}
              className={`px-2.5 sm:px-3 py-1 rounded-lg text-[10px] font-mono font-bold transition flex items-center gap-1 cursor-pointer ${
                activeChannel === 'master'
                  ? 'bg-red-600 text-white shadow-md shadow-red-900/40'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Sparkles className="w-3 h-3 text-amber-300" />
              <span>Master V1</span>
            </button>
          </div>

          {/* Lado Derecho: Visualizador & CTA & Minimizador */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Animated Waveform Bars */}
            <div className="hidden md:flex items-center gap-1 h-5 px-2 bg-black/40 rounded border border-gray-800" aria-hidden="true">
              {[40, 75, 55, 90, 65, 30, 80, 45, 95, 60, 35].map((height, i) => (
                <span 
                  key={i} 
                  className={`w-1 rounded-full transition-all duration-150 ${
                    isPlaying 
                      ? activeChannel === 'master' ? 'bg-red-500' : 'bg-gray-400' 
                      : 'bg-gray-700'
                  }`}
                  style={{ height: isPlaying ? `${Math.max(15, Math.round(height * Math.random()))}%` : '20%' }}
                />
              ))}
            </div>

            {onBookClick && (
              <button
                type="button"
                onClick={onBookClick}
                className="bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-black text-[11px] px-3 sm:px-3.5 py-1.5 rounded-xl uppercase tracking-wider transition shadow-md whitespace-nowrap active:scale-95 cursor-pointer"
              >
                Apartar $130
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsMuted(!isMuted)}
              aria-label={isMuted ? 'Activar sonido' : 'Silenciar'}
              className="text-gray-400 hover:text-white p-1 cursor-pointer"
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4" />}
            </button>

            <button
              type="button"
              onClick={() => setIsCollapsed(true)}
              className="text-gray-500 hover:text-gray-300 p-1 cursor-pointer sm:hidden"
              title="Minimizar reproductor"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </aside>
  );
};

export default AudioDockPlayer;
