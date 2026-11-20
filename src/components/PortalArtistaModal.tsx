import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Headphones,
  ExternalLink,
  KeyRound,
  Sparkles,
  MessageCircle,
  Star,
} from 'lucide-react';
import {
  ARTIST_PORTAL_BASE_URL,
  getArtistSessionUrl,
  BADLENZ_WHATSAPP_STATUS_URL,
} from '../config/portalConfig';

interface PortalArtistaModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PortalArtistaModal: React.FC<PortalArtistaModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [sessionCode, setSessionCode] = useState('');
  const [codeError, setCodeError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setCodeError(null);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const timer = setTimeout(() => inputRef.current?.focus(), 80);

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = prevOverflow;
      clearTimeout(timer);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || typeof document === 'undefined') return null;

  const handleOpenSession = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = sessionCode.trim().toLowerCase().replace(/\s+/g, '');
    if (clean.length < 3) {
      setCodeError('Ingresa tu código de sesión (ej: zyrontukutu).');
      return;
    }
    setCodeError(null);
    window.open(getArtistSessionUrl(clean), '_blank', 'noopener,noreferrer');
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="portal-artista-title"
    >
      <div
        className="relative w-full max-w-md rounded-3xl bg-[#0b0d14] border border-amber-500/35 shadow-[0_25px_70px_rgba(0,0,0,0.85)] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Accent */}
        <div className="h-1 w-full bg-gradient-to-r from-red-600 via-amber-500 to-red-600" />

        <div className="p-6 space-y-5">
          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-amber-500/15 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
                <Headphones className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400 font-bold block">
                  Faculty Projects · Sala VIP
                </span>
                <h2
                  id="portal-artista-title"
                  className="text-lg font-syne font-extrabold text-white uppercase tracking-tight"
                >
                  Portal de Artista
                </h2>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar"
              className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <p className="text-xs text-zinc-300 leading-relaxed">
            Tus mezclas, revisiones por segundo, descarga de masters WAV 24-bit y progreso de{' '}
            <strong className="text-amber-300">Estrellas VIP</strong> viven en nuestra plataforma dedicada{' '}
            <strong className="text-white">Faculty Projects</strong>.
          </p>

          {/* Direct Session Code Form */}
          <form onSubmit={handleOpenSession} className="space-y-3">
            <div>
              <label
                htmlFor="artist-session-code"
                className="block text-[11px] font-mono uppercase tracking-wider text-zinc-400 mb-1.5"
              >
                Código de tu tema / sesión
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-amber-400/80 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  ref={inputRef}
                  id="artist-session-code"
                  type="text"
                  value={sessionCode}
                  onChange={(e) => {
                    setSessionCode(e.target.value);
                    if (codeError) setCodeError(null);
                  }}
                  placeholder="Ej: zyrontukutu"
                  className="w-full bg-[#121521] border border-zinc-700/80 focus:border-amber-400 rounded-xl pl-10 pr-4 py-3 text-sm text-white font-mono placeholder:text-zinc-500 focus:outline-none transition"
                />
              </div>
              {codeError && (
                <p className="text-[11px] text-red-400 mt-1.5">{codeError}</p>
              )}
            </div>

            <button
              type="submit"
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-red-600 to-rose-600 hover:from-amber-400 hover:to-rose-500 text-white font-syne font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-red-950/50 transition cursor-pointer active:scale-[0.98]"
            >
              <span>Abrir mi Sala en Faculty Projects</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </form>

          {/* Direct Portal Link */}
          <div className="flex items-center gap-2">
            <div className="h-px flex-1 bg-zinc-800" />
            <span className="text-[10px] font-mono text-zinc-500 uppercase">o accede directo</span>
            <div className="h-px flex-1 bg-zinc-800" />
          </div>

          <a
            href={ARTIST_PORTAL_BASE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-2.5 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/80 text-zinc-200 hover:text-white text-xs font-semibold flex items-center justify-center gap-2 transition"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Ir a Faculty Projects ({ARTIST_PORTAL_BASE_URL.replace('https://', '')})</span>
            <ExternalLink className="w-3.5 h-3.5 text-zinc-400" />
          </a>

          {/* Pasaporte VIP Hook */}
          <div className="rounded-2xl bg-amber-500/8 border border-amber-500/25 p-3.5 flex items-start gap-3">
            <Star className="w-4 h-4 text-amber-400 shrink-0 mt-0.5 fill-amber-400/30" />
            <div className="text-[11px] text-zinc-300 leading-relaxed">
              <strong className="text-amber-300">Pasaporte VIP:</strong> Cada sesión entregada suma estrellas en Faculty Projects hasta ganar descuentos, mezcla pro o <strong className="text-white">1 Tema Completo Gratis</strong>.
            </div>
          </div>

          {/* WhatsApp fallback */}
          <div className="pt-1 text-center">
            <a
              href={BADLENZ_WHATSAPP_STATUS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-[11px] text-emerald-400 hover:text-emerald-300 font-medium transition"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>¿No recuerdas tu código? Escríbele a Badlenz</span>
            </a>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default PortalArtistaModal;
