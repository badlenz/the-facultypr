import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { doc, getDoc } from 'firebase/firestore';
import {
  X,
  Headphones,
  ExternalLink,
  KeyRound,
  MessageCircle,
  Star,
  Award,
  CheckCircle2,
  Lock,
  Loader2,
} from 'lucide-react';
import { db } from '../firebase';
import {
  ARTIST_PORTAL_BASE_URL,
  getArtistSessionUrl,
  BADLENZ_WHATSAPP_STATUS_URL,
} from '../config/portalConfig';
import {
  VIP_MAX_STARS,
  VIP_MILESTONES,
  VipPublicoDoc,
  isStrongVipCode,
  normalizeVipCode,
  toVipPublicoDocId,
} from '../services/vipRules';

interface PortalArtistaModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialCode?: string;
}

export const PortalArtistaModal: React.FC<PortalArtistaModalProps> = ({
  isOpen,
  onClose,
  initialCode = '',
}) => {
  const [sessionCode, setSessionCode] = useState(initialCode);
  const [codeError, setCodeError] = useState<string | null>(null);
  const [loadingVip, setLoadingVip] = useState(false);
  const [vipData, setVipData] = useState<VipPublicoDoc | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const consultarPasaporteVip = useCallback(async (rawCode: string) => {
    const normalized = normalizeVipCode(rawCode);
    const vipDocId = toVipPublicoDocId(normalized);
    if (!normalized || !isStrongVipCode(normalized) || !vipDocId) {
      setCodeError('Ingresa tu código VIP válido (formato VIP/nombre-del-artista).');
      setVipData(null);
      return;
    }
    setCodeError(null);
    setLoadingVip(true);
    try {
      const snap = await getDoc(doc(db, 'vip_publico', vipDocId));
      if (!snap.exists()) {
        setVipData(null);
        setCodeError('No se encontró un Pasaporte VIP activo con ese código.');
        return;
      }
      setVipData(snap.data() as VipPublicoDoc);
    } catch {
      setVipData(null);
      setCodeError('No se pudo consultar tu Pasaporte VIP en Firestore. Intenta de nuevo.');
    } finally {
      setLoadingVip(false);
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    setCodeError(null);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const timer = setTimeout(() => inputRef.current?.focus(), 80);

    if (initialCode && initialCode.trim().length >= 3) {
      setSessionCode(initialCode);
      consultarPasaporteVip(initialCode);
    }

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = prevOverflow;
      clearTimeout(timer);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [isOpen, initialCode, onClose, consultarPasaporteVip]);

  if (!isOpen || typeof document === 'undefined') return null;

  const handleConsultarVip = (e: React.FormEvent) => {
    e.preventDefault();
    consultarPasaporteVip(sessionCode);
  };

  const cleanCode = normalizeVipCode(sessionCode) || sessionCode.trim();
  const stars = typeof vipData?.estrellasVip === 'number' ? vipData.estrellasVip : 0;
  const maxStars = VIP_MAX_STARS;
  const progressPct = Math.min(100, Math.max(0, (stars / maxStars) * 100));

  return createPortal(
    <div
      className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="portal-artista-title"
    >
      <div
        className="relative w-full max-w-lg my-auto rounded-3xl bg-[#0b0d14] border border-amber-500/35 shadow-[0_25px_70px_rgba(0,0,0,0.85)] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Accent */}
        <div className="h-1 w-full bg-gradient-to-r from-red-600 via-amber-500 to-red-600" />

        <div className="p-6 space-y-5 max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-amber-500/15 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400 font-bold block">
                  Pasaporte VIP · La Facultad Studio
                </span>
                <h2
                  id="portal-artista-title"
                  className="text-lg font-syne font-extrabold text-white uppercase tracking-tight"
                >
                  Portal de Artista &amp; Estrellas
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
            Tus <strong className="text-amber-300">Estrellas VIP</strong> y el progreso de tu <strong className="text-white">Pasaporte VIP</strong> viven aquí mismo en esta web (1 sesión completada = 1 ⭐ hasta ganar <strong className="text-white">1 Producción Completa Gratis</strong>). Tus mezclas, stems y revisiones de audio están en <strong className="text-white">Faculty Projects</strong>.
          </p>

          {/* Direct Session Code Form */}
          <form onSubmit={handleConsultarVip} className="space-y-3">
            <div>
              <label
                htmlFor="artist-session-code"
                className="block text-[11px] font-mono uppercase tracking-wider text-zinc-400 mb-1.5"
              >
                Código de sesión VIP
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
                  placeholder="Ej: VIP/badlenz"
                  className="w-full bg-[#121521] border border-zinc-700/80 focus:border-amber-400 rounded-xl pl-10 pr-4 py-3 text-sm text-white font-mono placeholder:text-zinc-500 focus:outline-none transition"
                />
              </div>
              {codeError && (
                <p className="text-[11px] text-red-400 mt-1.5">{codeError}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loadingVip}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-red-600 to-rose-600 hover:from-amber-400 hover:to-rose-500 disabled:opacity-60 text-white font-syne font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-red-950/50 transition cursor-pointer active:scale-[0.98]"
            >
              {loadingVip ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Consultando Pasaporte VIP...</span>
                </>
              ) : (
                <>
                  <Star className="w-3.5 h-3.5 fill-current" />
                  <span>Ver Mi Pasaporte VIP</span>
                </>
              )}
            </button>
          </form>

          {/* Vista Real del Pasaporte VIP */}
          {vipData && (
            <div className="rounded-2xl bg-[#121522] border border-amber-500/40 p-4 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="text-[10px] font-mono uppercase text-zinc-400 block">
                    Artista
                  </span>
                  <strong className="text-base font-syne font-extrabold text-white">
                    {vipData.nombreArtistico}
                  </strong>
                </div>
                {vipData.nivel && (
                  <span
                    className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${vipData.nivel.color}`}
                  >
                    {vipData.nivel.label}
                  </span>
                )}
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono text-amber-300 font-bold">
                    {stars} / {maxStars} ⭐
                  </span>
                  {vipData.proximoHito ? (
                    <span className="text-zinc-300">
                      Faltan <strong className="text-amber-300">{vipData.estrellasRestantes} ⭐</strong> para{' '}
                      <strong className="text-white">{vipData.proximoHito.badge}</strong>
                    </span>
                  ) : (
                    <span className="text-amber-300 font-bold">
                      👑 ¡Meta máxima completada!
                    </span>
                  )}
                </div>
                <div className="w-full h-2.5 rounded-full bg-black/70 border border-zinc-800 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-red-600 via-amber-500 to-yellow-400 transition-all duration-500"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
              </div>

              {/* Escalera de 5 hitos */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {VIP_MILESTONES.map((m, idx) => {
                  const unlocked = stars >= m.pts;
                  const isGrandPrize = idx === VIP_MILESTONES.length - 1;
                  return (
                    <div
                      key={m.pts}
                      className={`rounded-xl p-2.5 border text-[11px] space-y-1 ${
                        isGrandPrize ? 'sm:col-span-2 ' : ''
                      }${
                        unlocked
                          ? 'bg-amber-500/15 border-amber-400/50 text-amber-100'
                          : 'bg-black/40 border-zinc-800 text-zinc-400'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1.5">
                        <span className="font-bold">{m.title}</span>
                        {unlocked ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        ) : (
                          <Lock className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                        )}
                      </div>
                      <p className="text-[10px] opacity-85 leading-snug">{m.desc}</p>
                    </div>
                  );
                })}
              </div>

              {cleanCode.length >= 3 && (
                <a
                  href={getArtistSessionUrl(cleanCode)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-amber-300 text-xs font-semibold flex items-center justify-center gap-2 transition"
                >
                  <Headphones className="w-3.5 h-3.5" />
                  <span>Abrir mis mezclas y entregas en Faculty Projects</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          )}

          {/* Direct Portal Link (solo para proyectos/entregas) */}
          <div className="flex items-center gap-2">
            <div className="h-px flex-1 bg-zinc-800" />
            <span className="text-[10px] font-mono text-zinc-500 uppercase">proyectos y entregas</span>
            <div className="h-px flex-1 bg-zinc-800" />
          </div>

          <a
            href={cleanCode.length >= 3 ? getArtistSessionUrl(cleanCode) : ARTIST_PORTAL_BASE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-2.5 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/80 text-zinc-200 hover:text-white text-xs font-semibold flex items-center justify-center gap-2 transition"
          >
            <Headphones className="w-3.5 h-3.5 text-amber-400" />
            <span>Ir a Faculty Projects (Mezclas y Masters)</span>
            <ExternalLink className="w-3.5 h-3.5 text-zinc-400" />
          </a>

          {/* WhatsApp fallback */}
          <div className="pt-1 text-center">
            <a
              href={BADLENZ_WHATSAPP_STATUS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-[11px] text-zinc-400 hover:text-emerald-300 transition"
            >
              <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
              <span>¿No tienes tu código VIP? Pídelo a Badlenz por WhatsApp</span>
            </a>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default PortalArtistaModal;
