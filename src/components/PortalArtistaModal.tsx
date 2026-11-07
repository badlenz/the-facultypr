import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  MessageCircle,
  X,
  Headphones,
  Sliders,
  Disc3,
  FileCheck2,
  KeyRound,
  Play,
  AlertCircle,
  CheckCircle2,
  Radio,
  FolderArchive,
} from 'lucide-react';
import {
  getArtistSessionUrl,
  ARTIST_DEMO_SESSION_URL,
  BADLENZ_WHATSAPP_STATUS_URL,
} from '../config/portalConfig';

interface PortalArtistaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenLegacyVault?: () => void;
  initialTab?: 'cabina' | 'fases';
}

const PRODUCTION_PHASES = [
  {
    number: '01',
    title: '01. Preproducción & Guías',
    desc: 'Recepción de stems secos y BPM',
    icon: Headphones,
    accent: 'text-amber-400 border-amber-500/30 bg-amber-500/10',
  },
  {
    number: '02',
    title: '02. Mezcla Pro',
    desc: 'Afinación, compresión analógica y revisiones en la onda',
    icon: Sliders,
    accent: 'text-red-400 border-red-500/30 bg-red-500/10',
  },
  {
    number: '03',
    title: '03. Master Acústico',
    desc: 'Calibración a -14 LUFS / 24-bit / 48kHz y Car Test',
    icon: Disc3,
    accent: 'text-amber-300 border-amber-400/30 bg-amber-500/10',
  },
  {
    number: '04',
    title: '04. Certificación & Entrega',
    desc: 'Master WAV final y ficha técnica PDF',
    icon: FileCheck2,
    accent: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
  },
];

export const PortalArtistaModal: React.FC<PortalArtistaModalProps> = ({
  isOpen,
  onClose,
  onOpenLegacyVault,
  initialTab = 'cabina',
}) => {
  const [sessionCode, setSessionCode] = useState('');
  const [codeError, setCodeError] = useState(false);
  const [activeView, setActiveView] = useState<'all' | 'fases'>(
    initialTab === 'fases' ? 'fases' : 'all'
  );
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      setCodeError(false);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 80);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleEnterCabin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleaned = sessionCode.trim().toLowerCase().replace(/\s+/g, '');
    if (!cleaned) {
      setCodeError(true);
      inputRef.current?.focus();
      return;
    }
    setCodeError(false);
    const targetUrl = getArtistSessionUrl(cleaned);
    window.open(targetUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-fadeIn overflow-y-auto"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="portal-artista-vip-title"
    >
      <div
        className="relative w-full max-w-xl my-auto bg-[#0b0c0e] border border-amber-500/40 rounded-3xl p-5 sm:p-7 shadow-[0_25px_80px_rgba(0,0,0,0.95),0_0_40px_rgba(245,158,11,0.14)] text-left space-y-5 text-white overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Efectos de iluminación ambiental dorados y rojos */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-400/80 to-transparent pointer-events-none" />
        <div className="absolute -top-24 -right-24 w-56 h-56 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-56 h-56 bg-red-600/15 rounded-full blur-3xl pointer-events-none" />

        {/* Botón Cerrar */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 text-zinc-400 hover:text-amber-300 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 hover:border-amber-500/40 transition cursor-pointer"
          aria-label="Cerrar modal"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Encabezado VIP */}
        <div className="relative z-10 space-y-2 pr-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-red-950/90 via-[#1a1114] to-amber-950/80 border border-amber-500/40 shadow-inner">
            <Radio className="w-3.5 h-3.5 text-red-400 animate-pulse" />
            <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-amber-300 font-extrabold">
              Sistema de Estudio en Vivo
            </span>
          </div>

          <h3
            id="portal-artista-vip-title"
            className="text-lg sm:text-xl font-black uppercase tracking-wide text-white flex flex-wrap items-center gap-2 font-syne"
          >
            <span>Portal de Artista VIP · La Facultad Studio / Badlenz</span>
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
          </h3>

          <p className="text-xs text-zinc-400 leading-relaxed">
            Ingresa a tu sala privada de monitoreo para escuchar tu mezcla/master en alta resolución, dejar notas en la onda en tiempo real y descargar tus entregables certificados.
          </p>
        </div>

        {/* Selector rápido de pestaña / vista */}
        <div className="relative z-10 grid grid-cols-2 gap-1.5 bg-[#12141a] p-1 rounded-2xl border border-amber-500/20 text-[11px] font-bold">
          <button
            type="button"
            onClick={() => setActiveView('all')}
            className={`py-2 px-3 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
              activeView === 'all'
                ? 'bg-gradient-to-r from-red-600/90 to-amber-600/90 text-white shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Acceso con Código</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveView('fases')}
            className={`py-2 px-3 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
              activeView === 'fases'
                ? 'bg-gradient-to-r from-amber-500 to-red-600 text-white shadow-md'
                : 'text-amber-300/90 hover:text-amber-200'
            }`}
          >
            <Disc3 className="w-3.5 h-3.5" />
            <span>¿En proceso o sin código?</span>
          </button>
        </div>

        {/* SECCIÓN 1: INGRESO A CABINA DE ESCUCHA CON CÓDIGO + DEMO EN VIVO */}
        {activeView === 'all' && (
          <form onSubmit={handleEnterCabin} className="relative z-10 space-y-3.5 bg-[#111318]/90 p-4 sm:p-5 rounded-2xl border border-amber-500/30 shadow-inner">
            <div className="space-y-1.5">
              <label
                htmlFor="artist-session-code-input"
                className="block text-xs font-bold text-amber-300 uppercase tracking-wider font-mono"
              >
                Ingresa tu código de sesión o nombre del tema
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-amber-400/80 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  ref={inputRef}
                  id="artist-session-code-input"
                  type="text"
                  value={sessionCode}
                  onChange={(e) => {
                    setSessionCode(e.target.value);
                    if (codeError) setCodeError(false);
                  }}
                  placeholder="ej: zyrontukutu, delnorte"
                  className={`w-full pl-10 pr-4 py-3 rounded-xl bg-[#0b0c0e] border ${
                    codeError
                      ? 'border-red-500 focus:ring-2 focus:ring-red-500/40'
                      : 'border-amber-500/40 focus:border-amber-400 focus:ring-2 focus:ring-amber-500/30'
                  } text-white placeholder-zinc-500 text-sm font-mono focus:outline-none transition`}
                />
              </div>
              {codeError && (
                <p className="text-[11px] text-red-400 flex items-center gap-1.5 pt-0.5 font-medium">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>Escribe el código de tu sesión o tema (ej: zyrontukutu) para entrar.</span>
                </p>
              )}
            </div>

            {/* Botón Principal: Entrar a mi Cabina de Escucha ➜ */}
            <button
              type="submit"
              className="w-full py-3.5 px-5 bg-gradient-to-r from-red-600 via-red-500 to-amber-500 hover:from-red-500 hover:to-amber-400 text-white font-black text-xs sm:text-sm uppercase tracking-wider rounded-xl shadow-[0_10px_25px_rgba(220,38,38,0.35)] hover:shadow-[0_12px_30px_rgba(245,158,11,0.45)] border border-amber-400/40 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
            >
              <span>Entrar a mi Cabina de Escucha ➜</span>
            </button>

            {/* Botón de Acceso Directo a Demo */}
            <a
              href={ARTIST_DEMO_SESSION_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2.5 px-4 bg-[#0b0c0e] hover:bg-amber-500/10 text-amber-300 hover:text-amber-200 border border-amber-500/40 hover:border-amber-400 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 text-center cursor-pointer active:scale-[0.98]"
            >
              <Play className="w-3.5 h-3.5 fill-amber-400 text-amber-400 shrink-0" />
              <span>Probar cabina en vivo (Demo Zyron - Tukutu)</span>
            </a>
          </form>
        )}

        {/* SECCIÓN 2: ¿TU TEMA AÚN ESTÁ EN PROCESO O NO TIENES CÓDIGO? (SIEMPRE VISIBLE O DESTACADA EN PESTAÑA) */}
        <div className="relative z-10 space-y-3.5 bg-[#101217] p-4 sm:p-5 rounded-2xl border border-amber-500/25">
          <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-2.5">
            <h4 className="text-xs sm:text-sm font-extrabold text-amber-400 uppercase tracking-wide flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-red-500 shrink-0" />
              <span>¿Tu tema aún está en proceso o no tienes código?</span>
            </h4>
          </div>

          <p className="text-[11px] text-zinc-400 leading-relaxed">
            Cada producción en <strong className="text-white">La Facultad Studio</strong> atraviesa 4 etapas técnicas antes de habilitar tu enlace en la cabina de escucha:
          </p>

          {/* Las 4 Fases de Producción de La Facultad Studio */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {PRODUCTION_PHASES.map((phase) => {
              const IconComponent = phase.icon;
              return (
                <div
                  key={phase.number}
                  className="bg-[#0b0c0e] border border-amber-500/20 hover:border-amber-500/50 rounded-xl p-3 flex items-start gap-2.5 transition"
                >
                  <div
                    className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 ${phase.accent}`}
                  >
                    <IconComponent className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <strong className="text-white block text-[11px] font-bold leading-snug">
                      {phase.title}
                    </strong>
                    <span className="text-[10.5px] text-zinc-400 leading-tight block mt-0.5">
                      ({phase.desc})
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Botón directo a WhatsApp con Badlenz */}
          <div className="pt-1">
            <a
              href={BADLENZ_WHATSAPP_STATUS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 px-4 bg-[#25D366] hover:bg-[#20ba5a] text-gray-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-[0_8px_25px_rgba(37,211,102,0.25)] transition flex items-center justify-center gap-2 text-center cursor-pointer active:scale-[0.98]"
            >
              <MessageCircle className="w-4 h-4 fill-current shrink-0" />
              <span>Consultar estado de mi tema por WhatsApp</span>
            </a>
          </div>

          {/* Enlace discreto a bóveda local si se requiere */}
          {onOpenLegacyVault && (
            <div className="text-center pt-1">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenLegacyVault();
                }}
                className="inline-flex items-center gap-1.5 text-[10px] text-zinc-500 hover:text-amber-300 font-mono underline decoration-zinc-700 transition cursor-pointer"
              >
                <FolderArchive className="w-3 h-3" />
                <span>Ver historial local del navegador</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PortalArtistaModal;
