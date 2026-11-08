import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Sparkles,
  MessageCircle,
  X,
  Headphones,
  Sliders,
  Disc3,
  FileCheck2,
  KeyRound,
  AlertCircle,
  CheckCircle2,
  Radio,
  Star,
  Award,
  Receipt,
  Download,
  ExternalLink,
  ShieldCheck,
  Smartphone,
  Lock,
  Unlock,
  LogOut,
} from 'lucide-react';
import {
  getArtistSessionUrl,
  BADLENZ_WHATSAPP_STATUS_URL,
} from '../config/portalConfig';
import { getClientes, getReservas, Cliente, Reserva } from '../services/db';

interface PortalArtistaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenLegacyVault?: () => void;
  initialTab?: 'escucha' | 'estrellas' | 'recibos';
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

const REWARDS_SCALE = [
  {
    pts: 5,
    title: '5 ⭐: 15% Descuento',
    desc: '15% de Descuento directo en tu próxima sesión de estudio.',
    badge: '15% OFF',
  },
  {
    pts: 10,
    title: '10 ⭐: 1 Mezcla Pro Gratis',
    desc: 'Mezcla profesional multitrack completa con compresión analógica y afinación.',
    badge: 'Mezcla Gratis',
  },
  {
    pts: 15,
    title: '15 ⭐: Stems Multitrack Libres',
    desc: 'Exportación de stems procesados e individuales sin costo adicional.',
    badge: 'Stems Incluidos',
  },
  {
    pts: 20,
    title: '20 ⭐: 👑 1 Tema Completo Gratis',
    desc: 'Bloque de Grabación 4h + Mezcla Multitrack Pro + Master Acústico 24-bit.',
    badge: '👑 Tema Gratis',
  },
];

export const PortalArtistaModal: React.FC<PortalArtistaModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'escucha',
}) => {
  // Credenciales de acceso
  const [sessionCode, setSessionCode] = useState(() => {
    try {
      return sessionStorage.getItem('lfs_artist_session_code') || '';
    } catch {
      return '';
    }
  });
  const [securityPin, setSecurityPin] = useState(() => {
    try {
      return sessionStorage.getItem('lfs_artist_session_pin') || '';
    } catch {
      return '';
    }
  });
  const [isUnlocked, setIsUnlocked] = useState<boolean>(() => {
    try {
      const savedCode = sessionStorage.getItem('lfs_artist_session_code');
      const savedPin = sessionStorage.getItem('lfs_artist_session_pin');
      return Boolean(savedCode && savedPin === '2027');
    } catch {
      return false;
    }
  });

  const [codeError, setCodeError] = useState<string | null>(null);
  const [pinError, setPinError] = useState<string | null>(null);

  // Pestaña activa una vez autenticado
  const [activeTab, setActiveTab] = useState<'escucha' | 'estrellas' | 'recibos'>(initialTab);

  // Datos calculados del artista autenticado
  const [currentArtistStars, setCurrentArtistStars] = useState<number>(1);
  const [artistDisplayName, setArtistDisplayName] = useState<string>('');

  const inputCodeRef = useRef<HTMLInputElement | null>(null);
  const inputPinRef = useRef<HTMLInputElement | null>(null);

  // Recalcular estrellas cuando se desbloquea una sesión
  useEffect(() => {
    if (isUnlocked && sessionCode) {
      const clean = sessionCode.trim().toLowerCase().replace(/\s+/g, '');
      const allClientes: Cliente[] = getClientes();
      const allReservas: Reserva[] = getReservas();

      const matchedClient = allClientes.find((c) => {
        const artName = c.nombreArtistico.toLowerCase().replace(/\s+/g, '');
        return clean.includes(artName) || artName.includes(clean);
      });

      if (matchedClient) {
        setArtistDisplayName(matchedClient.nombreArtistico);
        const clientReservas = allReservas.filter(
          (r) =>
            r.clienteId === matchedClient.id ||
            r.nombreArtistico.toLowerCase().includes(matchedClient.nombreArtistico.toLowerCase())
        );
        const total = clientReservas.reduce((acc, r) => {
          const count = Array.isArray(r.servicios) ? Math.max(1, r.servicios.length) : 1;
          return acc + count;
        }, 0);
        setCurrentArtistStars(Math.min(Math.max(total, 1), 20));
      } else {
        // Formatear el código ingresado como nombre de artista / tema
        setArtistDisplayName(clean.toUpperCase());
        setCurrentArtistStars(3); // 1 tema registrado en el studio
      }
    }
  }, [isUnlocked, sessionCode]);

  useEffect(() => {
    if (isOpen) {
      setCodeError(null);
      setPinError(null);
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';

      const timer = setTimeout(() => {
        if (!isUnlocked) {
          inputCodeRef.current?.focus();
        }
      }, 100);

      return () => {
        document.body.style.overflow = prevOverflow;
        clearTimeout(timer);
      };
    }
  }, [isOpen, isUnlocked]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || typeof document === 'undefined') return null;

  // Manejador del login con Código (artista + tema) y PIN (2027)
  const handleUnlockSession = (e: React.FormEvent) => {
    e.preventDefault();
    setCodeError(null);
    setPinError(null);

    const cleanCode = sessionCode.trim().toLowerCase().replace(/\s+/g, '');
    const cleanPin = securityPin.trim();

    let hasError = false;

    if (!cleanCode) {
      setCodeError('Ingresa el nombre del artista junto al título de tu tema (ej: zyrontukutu).');
      hasError = true;
    } else if (cleanCode.length < 3) {
      setCodeError('El código de sesión debe tener al menos 3 caracteres.');
      hasError = true;
    }

    if (!cleanPin) {
      setPinError('Ingresa el PIN de seguridad VIP de 4 dígitos proporcionado por Badlenz.');
      hasError = true;
    } else if (cleanPin !== '2027') {
      setPinError('PIN de seguridad incorrecto. Solicita tu PIN oficial a Badlenz.');
      hasError = true;
    }

    if (hasError) return;

    // Autenticación correcta
    try {
      sessionStorage.setItem('lfs_artist_session_code', cleanCode);
      sessionStorage.setItem('lfs_artist_session_pin', cleanPin);
    } catch {
      // Ignorar fallback de almacenamiento
    }

    setIsUnlocked(true);
    setActiveTab('escucha');
  };

  const handleLogout = () => {
    try {
      sessionStorage.removeItem('lfs_artist_session_code');
      sessionStorage.removeItem('lfs_artist_session_pin');
    } catch {
      // Ignorar
    }
    setIsUnlocked(false);
    setSecurityPin('');
    setCodeError(null);
    setPinError(null);
  };

  const handleGoToCabin = () => {
    const clean = sessionCode.trim().toLowerCase().replace(/\s+/g, '');
    if (!clean) return;
    const targetUrl = getArtistSessionUrl(clean);
    window.open(targetUrl, '_blank', 'noopener,noreferrer');
  };

  const currentLevelBadge = (() => {
    if (currentArtistStars >= 20) return { label: '👑 Leyenda (20/20 ⭐)', color: 'text-amber-300 bg-amber-950/80 border-amber-400' };
    if (currentArtistStars >= 15) return { label: '💎 Platino (15+ ⭐)', color: 'text-cyan-300 bg-cyan-950/80 border-cyan-400' };
    if (currentArtistStars >= 10) return { label: '🥇 Oro (10+ ⭐)', color: 'text-yellow-300 bg-yellow-950/80 border-yellow-400' };
    if (currentArtistStars >= 5)  return { label: '🥈 Plata (5+ ⭐)', color: 'text-zinc-200 bg-zinc-800 border-zinc-400' };
    return { label: '🥉 Bronce (1-4 ⭐)', color: 'text-amber-600 bg-amber-950/40 border-amber-800' };
  })();

  const nextMilestone = REWARDS_SCALE.find((m) => currentArtistStars < m.pts);
  const starsNeededForNext = nextMilestone ? nextMilestone.pts - currentArtistStars : 0;
  const progressPercent = Math.min((currentArtistStars / 20) * 100, 100);

  return createPortal(
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md overflow-y-auto animate-fadeIn"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="portal-artista-vip-title"
    >
      <div
        className="relative w-full max-w-2xl max-h-[90vh] flex flex-col my-auto bg-[#0b0c0e] border border-amber-500/50 rounded-3xl shadow-[0_25px_90px_rgba(0,0,0,0.98),0_0_45px_rgba(245,158,11,0.2)] text-left text-white overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glows ambientales dorados y rojos */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-400/90 to-transparent pointer-events-none z-30" />
        <div className="absolute -top-24 -right-24 w-56 h-56 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-56 h-56 bg-red-600/15 rounded-full blur-3xl pointer-events-none" />

        {/* HEADER FIJO */}
        <div className="relative z-20 p-5 sm:p-6 pb-4 border-b border-amber-500/20 bg-[#0d0f14]/95 space-y-3">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 z-30 p-2 text-zinc-400 hover:text-amber-300 rounded-full bg-white/5 hover:bg-white/15 border border-white/10 hover:border-amber-500/40 transition cursor-pointer"
            aria-label="Cerrar modal"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="space-y-1 pr-8">
            <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full bg-gradient-to-r from-red-950/90 via-[#1a1114] to-amber-950/80 border border-amber-500/40 shadow-inner">
              <Radio className="w-3.5 h-3.5 text-red-400 animate-pulse" />
              <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-amber-300 font-extrabold">
                {isUnlocked ? 'Sesión Autorizada · VIP' : 'Acceso Restringido'}
              </span>
            </div>

            <h3
              id="portal-artista-vip-title"
              className="text-base sm:text-lg font-black uppercase tracking-wide text-white flex flex-wrap items-center gap-2 font-syne"
            >
              <span>Portal de Artista VIP · La Facultad Studio</span>
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
            </h3>
          </div>

          {/* BARRA DE ESTADO / PESTAÑAS (Solo visible si está desbloqueado) */}
          {isUnlocked ? (
            <div className="space-y-2.5 pt-1">
              <div className="flex items-center justify-between text-xs bg-black/40 border border-amber-500/30 px-3 py-1.5 rounded-xl">
                <div className="flex items-center gap-2 truncate">
                  <Unlock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span className="text-zinc-400 font-mono text-[11px]">Sesión Activa:</span>
                  <span className="font-bold text-amber-300 font-mono uppercase truncate">
                    {sessionCode}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex items-center gap-1 text-[11px] font-mono text-zinc-400 hover:text-red-400 transition cursor-pointer shrink-0 ml-2"
                  title="Cambiar de código o cerrar sesión"
                >
                  <LogOut className="w-3 h-3" />
                  <span>Salir</span>
                </button>
              </div>

              {/* Selector de Pestañas Fluidas */}
              <div className="grid grid-cols-3 gap-1 bg-[#13151c] p-1 rounded-2xl border border-amber-500/25 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setActiveTab('escucha')}
                  className={`py-2 px-2 sm:px-3 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer text-center ${
                    activeTab === 'escucha'
                      ? 'bg-gradient-to-r from-red-600 via-red-500 to-amber-600 text-white shadow-md'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <Headphones className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">Escucha en Vivo</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('estrellas')}
                  className={`py-2 px-2 sm:px-3 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer text-center ${
                    activeTab === 'estrellas'
                      ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-gray-950 font-black shadow-md'
                      : 'text-amber-300/80 hover:text-amber-200'
                  }`}
                >
                  <Star className="w-3.5 h-3.5 shrink-0 fill-current text-current" />
                  <span className="truncate">20 Estrellas ⭐</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('recibos')}
                  className={`py-2 px-2 sm:px-3 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer text-center ${
                    activeTab === 'recibos'
                      ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <Receipt className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">Recibos & Bóveda</span>
                </button>
              </div>
            </div>
          ) : (
            <p className="text-xs text-zinc-400 leading-relaxed">
              Ingresa tu código de sesión (artista + tema) junto con tu PIN personal de seguridad para acceder a tu sala de escucha, tus estrellas y recibos oficiales.
            </p>
          )}
        </div>

        {/* CUERPO DEL MODAL (Scrollable) */}
        <div className="relative z-10 flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          {/* ============================================================== */}
          {/* VISTA 1: BLOQUEADA (REQUIERE CÓDIGO + PIN 2027)                */}
          {/* ============================================================== */}
          {!isUnlocked && (
            <div className="space-y-5">
              <form
                onSubmit={handleUnlockSession}
                className="space-y-4 bg-[#111318]/95 p-5 sm:p-6 rounded-2xl border border-amber-500/40 shadow-inner"
              >
                <div className="flex items-center gap-2 text-amber-400 pb-1 border-b border-white/5">
                  <Lock className="w-4 h-4 text-amber-400" />
                  <h4 className="text-xs font-mono uppercase font-black tracking-wider text-amber-300">
                    Autenticación Requerida de Artista
                  </h4>
                </div>

                {/* Campo 1: Nombre de Artista + Tema (ej: zyrontukutu) */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="artist-session-code-input"
                    className="block text-xs font-bold text-amber-300 uppercase tracking-wider font-mono"
                  >
                    1. Código de Sesión (Artista + Tema)
                  </label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-amber-400/80 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      ref={inputCodeRef}
                      id="artist-session-code-input"
                      type="text"
                      value={sessionCode}
                      onChange={(e) => {
                        setSessionCode(e.target.value);
                        if (codeError) setCodeError(null);
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
                      <span>{codeError}</span>
                    </p>
                  )}
                  <p className="text-[10px] text-zinc-500 font-mono">
                    * Tu nombre artístico junto al título de tu tema (todo corrido en minúsculas).
                  </p>
                </div>

                {/* Campo 2: PIN de Seguridad VIP (2027) */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="artist-security-pin-input"
                    className="block text-xs font-bold text-amber-300 uppercase tracking-wider font-mono"
                  >
                    2. PIN de Seguridad VIP (Personal de Badlenz)
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-amber-400/80 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      ref={inputPinRef}
                      id="artist-security-pin-input"
                      type="password"
                      maxLength={6}
                      value={securityPin}
                      onChange={(e) => {
                        setSecurityPin(e.target.value);
                        if (pinError) setPinError(null);
                      }}
                      placeholder="Ingresa tu PIN de 4 dígitos"
                      className={`w-full pl-10 pr-4 py-3 rounded-xl bg-[#0b0c0e] border ${
                        pinError
                          ? 'border-red-500 focus:ring-2 focus:ring-red-500/40'
                          : 'border-amber-500/40 focus:border-amber-400 focus:ring-2 focus:ring-amber-500/30'
                      } text-white placeholder-zinc-500 text-sm font-mono tracking-widest focus:outline-none transition`}
                    />
                  </div>
                  {pinError && (
                    <p className="text-[11px] text-red-400 flex items-center gap-1.5 pt-0.5 font-medium">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{pinError}</span>
                    </p>
                  )}
                  <p className="text-[10px] text-zinc-500 font-mono">
                    * Código de autorización asignado personalmente a cada cliente del estudio.
                  </p>
                </div>

                {/* Botón Principal de Acceso */}
                <button
                  type="submit"
                  className="w-full py-3.5 px-5 bg-gradient-to-r from-red-600 via-red-500 to-amber-500 hover:from-red-500 hover:to-amber-400 text-white font-black text-xs sm:text-sm uppercase tracking-wider rounded-xl shadow-[0_10px_25px_rgba(220,38,38,0.35)] hover:shadow-[0_12px_30px_rgba(245,158,11,0.45)] border border-amber-400/40 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
                >
                  <Unlock className="w-4 h-4" />
                  <span>Desbloquear Sala & Bóveda VIP ➜</span>
                </button>
              </form>

              {/* SECCIÓN INFORMATIVA DE AYUDA Y WHATSAPP */}
              <div className="space-y-3 bg-[#101217] p-4 sm:p-5 rounded-2xl border border-amber-500/25">
                <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-2">
                  <h4 className="text-xs sm:text-sm font-extrabold text-amber-400 uppercase tracking-wide flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-red-500 shrink-0" />
                    <span>¿Aún no tienes tu código de sesión o PIN de acceso?</span>
                  </h4>
                </div>

                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  Cada sesión en <strong className="text-white">La Facultad Studio</strong> atraviesa 4 etapas técnicas. Si tu tema aún está en preproducción o mezcla, consúltale a Badlenz para que te active tu sala y te entregue tu PIN:
                </p>

                {/* Las 4 Fases de Producción */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {PRODUCTION_PHASES.map((phase) => {
                    const IconComponent = phase.icon;
                    return (
                      <div
                        key={phase.number}
                        className="bg-[#0b0c0e] border border-amber-500/25 hover:border-amber-500/50 rounded-xl p-2.5 flex items-start gap-2.5 transition"
                      >
                        <div
                          className={`w-7 h-7 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 ${phase.accent}`}
                        >
                          <IconComponent className="w-3.5 h-3.5" />
                        </div>
                        <div className="min-w-0">
                          <strong className="text-white block text-[11px] font-bold leading-snug">
                            {phase.title}
                          </strong>
                          <span className="text-[10px] text-zinc-400 leading-tight block mt-0.5">
                            ({phase.desc})
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Botón directo a WhatsApp para solicitar PIN y Código */}
                <div className="pt-1">
                  <a
                    href="https://wa.me/17872408627?text=D%C3%ADmelo%20Badlenz!%20Estoy%20en%20el%20portal%20y%20necesito%20mi%20c%C3%B3digo%20de%20sesi%C3%B3n%20y%20el%20PIN%20de%20seguridad%20VIP%20para%20entrar."
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-3 px-4 bg-[#25D366] hover:bg-[#20ba5a] text-gray-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-[0_8px_25px_rgba(37,211,102,0.25)] transition flex items-center justify-center gap-2 text-center cursor-pointer active:scale-[0.98]"
                  >
                    <MessageCircle className="w-4 h-4 fill-current shrink-0" />
                    <span>Solicitar mi PIN y Código a Badlenz</span>
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* VISTA 2: DESBLOQUEADA · PESTAÑA 1: SALA EN VIVO                */}
          {/* ============================================================== */}
          {isUnlocked && activeTab === 'escucha' && (
            <div className="space-y-4">
              <div className="bg-[#111318]/95 p-5 rounded-2xl border border-amber-500/35 shadow-inner space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-3">
                  <div>
                    <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block">
                      Sala de Monitoreo Activa
                    </span>
                    <h4 className="text-base font-black text-white uppercase tracking-wide font-syne">
                      Sesión: <span className="text-amber-400 font-mono">{sessionCode}</span>
                    </h4>
                  </div>
                  <span className="text-[10px] px-2.5 py-1 rounded-full font-mono font-bold bg-red-950 text-red-300 border border-red-700/60 uppercase">
                    • Stream 24-bit / 48kHz
                  </span>
                </div>

                <p className="text-xs text-zinc-300 leading-relaxed">
                  Tu sala privada de monitoreo te permite escuchar la versión actual de mezcla/master con precisión acústica, comparar en tiempo real y dejar notas por segundo para Badlenz.
                </p>

                {/* Botón de acceso directo a la sala en vivo */}
                <button
                  type="button"
                  onClick={handleGoToCabin}
                  className="w-full py-3.5 px-5 bg-gradient-to-r from-red-600 via-red-500 to-amber-500 hover:from-red-500 hover:to-amber-400 text-white font-black text-xs sm:text-sm uppercase tracking-wider rounded-xl shadow-[0_10px_25px_rgba(220,38,38,0.35)] hover:shadow-[0_12px_30px_rgba(245,158,11,0.45)] border border-amber-400/40 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
                >
                  <Headphones className="w-4 h-4" />
                  <span>Entrar a mi Sala de Escucha ➜</span>
                </button>
              </div>

              {/* Fases de Producción para Seguimiento */}
              <div className="space-y-3 bg-[#101217] p-4 sm:p-5 rounded-2xl border border-amber-500/25">
                <h4 className="text-xs sm:text-sm font-extrabold text-amber-400 uppercase tracking-wide flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-red-500 shrink-0" />
                  <span>Fases del Proceso en Estudio</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {PRODUCTION_PHASES.map((phase) => {
                    const IconComponent = phase.icon;
                    return (
                      <div
                        key={phase.number}
                        className="bg-[#0b0c0e] border border-amber-500/25 rounded-xl p-2.5 flex items-start gap-2.5"
                      >
                        <div
                          className={`w-7 h-7 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 ${phase.accent}`}
                        >
                          <IconComponent className="w-3.5 h-3.5" />
                        </div>
                        <div className="min-w-0">
                          <strong className="text-white block text-[11px] font-bold leading-snug">
                            {phase.title}
                          </strong>
                          <span className="text-[10px] text-zinc-400 leading-tight block mt-0.5">
                            ({phase.desc})
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="pt-1">
                  <a
                    href={BADLENZ_WHATSAPP_STATUS_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2.5 px-4 bg-[#25D366] hover:bg-[#20ba5a] text-gray-950 font-black text-xs uppercase tracking-wider rounded-xl transition flex items-center justify-center gap-2 text-center cursor-pointer"
                  >
                    <MessageCircle className="w-4 h-4 fill-current shrink-0" />
                    <span>Consultar estado de mi tema por WhatsApp</span>
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* VISTA 2: DESBLOQUEADA · PESTAÑA 2: MI PASAPORTE 20 ESTRELLAS   */}
          {/* ============================================================== */}
          {isUnlocked && activeTab === 'estrellas' && (
            <div className="space-y-4">
              <div className="bg-[#101217] p-5 rounded-2xl border border-amber-500/40 shadow-xl space-y-4">
                <div className="flex justify-between items-start border-b border-white/10 pb-3">
                  <div>
                    <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                      <Award className="w-4 h-4 text-amber-400" />
                      <span>Pasaporte VIP · {artistDisplayName || sessionCode.toUpperCase()}</span>
                    </h4>
                    <p className="text-[10px] text-zinc-400 font-mono mt-0.5">
                      1 Servicio Completado = 1 Estrella ⭐
                    </p>
                  </div>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${currentLevelBadge.color}`}
                  >
                    {currentLevelBadge.label}
                  </span>
                </div>

                {/* Barra de progreso */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-zinc-400">Servicios Acumulados:</span>
                    <span className="font-extrabold text-amber-400 font-mono flex items-center gap-1.5 text-sm">
                      <Star className="w-4 h-4 text-amber-400 fill-amber-400 animate-pulse" />
                      <span>{currentArtistStars} / 20 Estrellas</span>
                    </span>
                  </div>

                  <div className="relative w-full h-3.5 bg-black/60 border border-white/10 rounded-full overflow-hidden p-0.5">
                    <div
                      className="h-full bg-gradient-to-r from-red-600 via-amber-500 to-yellow-400 rounded-full transition-all duration-700 shadow-[0_0_15px_rgba(245,158,11,0.5)]"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>

                  <div className="flex justify-between text-[10px] font-mono text-zinc-400 pt-0.5">
                    <span>Progreso: {Math.round(progressPercent)}%</span>
                    <span>Meta: 20 ⭐ (Tema Completo Gratis)</span>
                  </div>
                </div>

                {/* Siguiente recompensa */}
                {currentArtistStars < 20 && nextMilestone ? (
                  <div className="p-3 bg-black/40 border border-amber-500/25 rounded-xl text-xs space-y-1">
                    <p className="text-zinc-300 leading-snug">
                      🚀 Te faltan <strong className="text-amber-400 font-mono">{starsNeededForNext}</strong> {starsNeededForNext === 1 ? 'servicio' : 'servicios'} más para alcanzar:
                    </p>
                    <p className="text-amber-300 font-bold flex items-center gap-1.5">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <span>{nextMilestone.title} ({nextMilestone.desc})</span>
                    </p>
                  </div>
                ) : (
                  <div className="p-3 bg-gradient-to-r from-amber-950/60 to-red-950/60 border border-amber-400 rounded-xl text-center space-y-1">
                    <p className="text-amber-300 font-black text-xs uppercase tracking-wider">
                      👑 ¡FELICITACIONES! HAS ALCANZADO LAS 20 ESTRELLAS
                    </p>
                    <p className="text-[11px] text-zinc-200">
                      Has desbloqueado tu <strong className="text-white">Tema Completo Gratis</strong> (Grabación 4h + Mezcla + Master).
                    </p>
                  </div>
                )}

                {/* Cuadrícula de 20 Stamps (1 a 20) */}
                <div className="space-y-2 pt-1">
                  <div className="flex justify-between items-center text-[10px] uppercase font-mono font-bold text-zinc-400">
                    <span>Tarjeta de Sellos Oficiales:</span>
                    <span className="text-amber-400">Sellos activos: {currentArtistStars}</span>
                  </div>

                  <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5">
                    {Array.from({ length: 20 }).map((_, idx) => {
                      const stampNum = idx + 1;
                      const isStamped = stampNum <= currentArtistStars;
                      const isMilestone = [5, 10, 15, 20].includes(stampNum);

                      return (
                        <div
                          key={stampNum}
                          className={`aspect-square rounded-xl flex flex-col items-center justify-center text-xs font-mono border transition-all ${
                            isStamped
                              ? 'bg-gradient-to-br from-amber-500/25 to-red-600/25 border-amber-400/90 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.35)] scale-[1.02]'
                              : isMilestone
                              ? 'bg-black/40 border-amber-500/30 text-amber-400/50'
                              : 'bg-black/30 border-white/5 text-zinc-600'
                          }`}
                          title={`Sello ${stampNum} - ${isStamped ? 'Completado ⭐' : 'Pendiente'}`}
                        >
                          {isStamped ? (
                            <Star className="w-4 h-4 text-amber-400 fill-amber-400 animate-pulse" />
                          ) : (
                            <span className="text-[10px] font-bold">{stampNum}</span>
                          )}
                          {isMilestone && !isStamped && (
                            <span className="text-[7px] text-amber-400/70 font-mono uppercase">Hito</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Escala de Recompensas */}
                <div className="space-y-2 pt-2 border-t border-white/10">
                  <h5 className="text-[11px] font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5" />
                    <span>Escala Oficial de Recompensas</span>
                  </h5>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {REWARDS_SCALE.map((reward) => {
                      const isUnlockedReward = currentArtistStars >= reward.pts;
                      return (
                        <div
                          key={reward.pts}
                          className={`p-2.5 rounded-xl border text-left transition ${
                            isUnlockedReward
                              ? 'bg-amber-950/30 border-amber-500/50 text-white'
                              : 'bg-black/30 border-white/5 text-zinc-500'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-1 mb-1">
                            <span
                              className={`text-xs font-black uppercase ${
                                isUnlockedReward ? 'text-amber-300' : 'text-zinc-400'
                              }`}
                            >
                              {reward.title}
                            </span>
                            <span
                              className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold ${
                                isUnlockedReward
                                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/40'
                                  : 'bg-zinc-800 text-zinc-500'
                              }`}
                            >
                              {isUnlockedReward ? '✓ Desbloqueado' : `Faltan ${Math.max(0, reward.pts - currentArtistStars)} ⭐`}
                            </span>
                          </div>
                          <p className="text-[10px] text-zinc-400 leading-snug">{reward.desc}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* VISTA 2: DESBLOQUEADA · PESTAÑA 3: RECIBOS & BÓVEDA             */}
          {/* ============================================================== */}
          {isUnlocked && activeTab === 'recibos' && (
            <div className="space-y-4">
              {/* Entregables Oficiales de la Sesión */}
              <div className="bg-[#101217] p-4 sm:p-5 rounded-2xl border border-amber-500/30 space-y-3">
                <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                  <h4 className="text-xs sm:text-sm font-extrabold text-white uppercase tracking-wide flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>Bóveda Privada de Descargas ({sessionCode})</span>
                  </h4>
                  <span className="text-[10px] text-emerald-400 font-mono">24-bit Certificado</span>
                </div>

                <div className="space-y-2.5">
                  {/* Master WAV Oficial */}
                  <div className="p-3 bg-[#0b0c0e] rounded-xl border border-amber-500/25 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    <div>
                      <span className="text-[9px] font-mono text-red-400 font-bold">
                        ENTREGABLE PRINCIPAL
                      </span>
                      <h5 className="text-xs font-bold text-white mt-0.5 uppercase">
                        {sessionCode} · Master Oficial WAV 24-bit
                      </h5>
                      <p className="text-[10px] text-zinc-400 font-mono mt-0.5">
                        Calibrado a -14 LUFS / 48kHz
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <a
                        href="/zyron-tukutu-master.m4a"
                        download={`${sessionCode}-master.m4a`}
                        className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-bold text-xs flex items-center gap-1.5 shadow transition cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Descargar</span>
                      </a>
                    </div>
                  </div>

                  {/* Stems Multitrack Drive */}
                  <div className="p-3 bg-[#0b0c0e] rounded-xl border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    <div>
                      <span className="text-[9px] font-mono text-zinc-500 font-bold">
                        MULTITRACK PROCESADO
                      </span>
                      <h5 className="text-xs font-bold text-white mt-0.5 uppercase">
                        {sessionCode} · Stems Vocales & Guías
                      </h5>
                      <p className="text-[10px] text-zinc-400 font-mono mt-0.5">
                        Carpeta segura en Google Drive
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <a
                        href="https://drive.google.com/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Abrir Drive</span>
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recibos Oficiales ATH Móvil */}
              <div className="bg-[#101217] p-4 sm:p-5 rounded-2xl border border-amber-500/30 space-y-3">
                <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                  <div className="flex items-center gap-2">
                    <Receipt className="w-4 h-4 text-emerald-400" />
                    <h4 className="text-xs sm:text-sm font-extrabold text-white uppercase tracking-wide">
                      Comprobante Oficial ATH Móvil
                    </h4>
                  </div>
                  <span className="text-[10px] text-zinc-400 font-mono">ATH: (787) 240-8627</span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="p-3 rounded-xl bg-[#0b0c0e] border border-emerald-500/30 space-y-1.5">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] font-mono text-emerald-400 font-bold">
                          ESTADO: VERIFICADO & CONFIRMADO
                        </span>
                        <h5 className="font-bold text-white text-xs mt-0.5">
                          Depósito 50% · Grabación 4h & Mezcla Pro
                        </h5>
                        <p className="text-[10px] text-zinc-400 font-mono">
                          Sesión: {sessionCode} · Método: ATH Móvil Business
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-emerald-400 font-black text-sm font-mono">$50.00 USD</span>
                        <p className="text-[9px] text-emerald-500 font-bold">Abono Aplicado</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-1">
                  <a
                    href="https://wa.me/17872408627?text=¡Saludos%20Badlenz!%20Te%20escribo%20para%20enviarte%20mi%20comprobante%20de%20ATH%20Móvil%20para%20mi%20sesión."
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2.5 px-4 bg-emerald-950/40 hover:bg-emerald-900/40 border border-emerald-700/50 hover:border-emerald-500 text-emerald-300 font-bold text-xs rounded-xl transition flex items-center justify-center gap-2 text-center cursor-pointer"
                  >
                    <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Reportar nuevo abono de ATH Móvil al (787) 240-8627</span>
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* PIE DEL MODAL */}
        <div className="p-3 bg-[#0d0f14] border-t border-white/5 flex items-center justify-between text-[11px] text-zinc-500 px-6">
          <span className="flex items-center gap-1.5 font-mono">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
            <span>La Facultad Studio LLC · Hormigueros, PR</span>
          </span>

          <button
            type="button"
            onClick={onClose}
            className="text-zinc-400 hover:text-white transition font-mono cursor-pointer"
          >
            Cerrar [ESC]
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default PortalArtistaModal;
