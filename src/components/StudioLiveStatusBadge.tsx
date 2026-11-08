import React, { useState, useEffect } from 'react';
import { 
  StudioLiveStatus, 
  getStudioLiveStatus, 
  subscribeToStudioStatus 
} from '../services/studioStatus';
import { 
  Radio, 
  Calendar, 
  Clock, 
  Sparkles, 
  User, 
  MessageSquare, 
  ChevronRight, 
  X,
  Volume2,
  Mic,
  Sliders,
  CheckCircle2,
  Moon
} from 'lucide-react';

interface StudioLiveStatusBadgeProps {
  onGoToBooking?: () => void;
  isAdmin?: boolean;
  onGoToAdmin?: () => void;
}

export const StudioLiveStatusBadge: React.FC<StudioLiveStatusBadgeProps> = ({
  onGoToBooking,
  isAdmin,
  onGoToAdmin
}) => {
  const [status, setStatus] = useState<StudioLiveStatus>(getStudioLiveStatus());
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    // Initial fetch
    setStatus(getStudioLiveStatus());
    // Subscribe to live status changes across the app
    const unsubscribe = subscribeToStudioStatus((newStatus) => {
      setStatus(newStatus);
    });
    return unsubscribe;
  }, []);

  const getTheme = () => {
    switch (status.estado) {
      case 'grabando':
        return {
          bg: 'bg-red-950/80 hover:bg-red-900/90',
          border: 'border-red-700/70 hover:border-red-500',
          glow: 'shadow-[0_0_14px_rgba(220,38,38,0.35)]',
          ledBg: 'bg-red-500',
          ledPing: 'bg-red-400',
          titleColor: 'text-red-300 font-black',
          subColor: 'text-red-400/90',
          icon: <Mic className="w-3.5 h-3.5 text-red-400 animate-pulse shrink-0" />,
          tag: '🔴 ON AIR'
        };
      case 'mezclando':
        return {
          bg: 'bg-amber-950/80 hover:bg-amber-900/90',
          border: 'border-amber-700/70 hover:border-amber-500',
          glow: 'shadow-[0_0_14px_rgba(245,158,11,0.35)]',
          ledBg: 'bg-amber-500',
          ledPing: 'bg-amber-400',
          titleColor: 'text-amber-300 font-black',
          subColor: 'text-amber-400/90',
          icon: <Sliders className="w-3.5 h-3.5 text-amber-400 animate-pulse shrink-0" />,
          tag: '🟡 EN MEZCLA'
        };
      case 'disponible':
        return {
          bg: 'bg-emerald-950/80 hover:bg-emerald-900/90',
          border: 'border-emerald-600/70 hover:border-emerald-400',
          glow: 'shadow-[0_0_14px_rgba(16,185,129,0.35)]',
          ledBg: 'bg-emerald-500',
          ledPing: 'bg-emerald-400',
          titleColor: 'text-emerald-300 font-black',
          subColor: 'text-emerald-400/90',
          icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />,
          tag: '🟢 DISPONIBLE'
        };
      case 'vacaciones':
        return {
          bg: 'bg-amber-950/85 hover:bg-amber-900/90',
          border: 'border-amber-600/70 hover:border-amber-400',
          glow: 'shadow-[0_0_14px_rgba(245,158,11,0.35)]',
          ledBg: 'bg-amber-400',
          ledPing: 'bg-amber-300',
          titleColor: 'text-amber-300 font-black',
          subColor: 'text-amber-400/90',
          icon: <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse shrink-0" />,
          tag: '🌴 VACACIONES'
        };
      case 'mantenimiento':
        return {
          bg: 'bg-blue-950/85 hover:bg-blue-900/90',
          border: 'border-blue-600/70 hover:border-blue-400',
          glow: 'shadow-[0_0_14px_rgba(59,130,246,0.35)]',
          ledBg: 'bg-blue-400',
          ledPing: 'bg-blue-300',
          titleColor: 'text-blue-300 font-black',
          subColor: 'text-blue-400/90',
          icon: <Sliders className="w-3.5 h-3.5 text-blue-400 animate-pulse shrink-0" />,
          tag: '🛠️ CALIBRACIÓN'
        };
      case 'remodelacion':
        return {
          bg: 'bg-teal-950/85 hover:bg-teal-900/90',
          border: 'border-teal-600/70 hover:border-teal-400',
          glow: 'shadow-[0_0_14px_rgba(20,184,166,0.35)]',
          ledBg: 'bg-teal-400',
          ledPing: 'bg-teal-300',
          titleColor: 'text-teal-300 font-black',
          subColor: 'text-teal-400/90',
          icon: <Mic className="w-3.5 h-3.5 text-teal-400 animate-pulse shrink-0" />,
          tag: '🎧 REMODELACIÓN'
        };
      case 'cerrado':
      default:
        return {
          bg: 'bg-gray-900/90 hover:bg-gray-800',
          border: 'border-gray-700 hover:border-gray-500',
          glow: 'shadow-none',
          ledBg: 'bg-gray-400',
          ledPing: 'bg-gray-500',
          titleColor: 'text-gray-300 font-bold',
          subColor: 'text-gray-500',
          icon: <Moon className="w-3.5 h-3.5 text-gray-400 shrink-0" />,
          tag: '⚪ CERRADO'
        };
    }
  };

  const theme = getTheme();

  return (
    <>
      {/* BADGE TRIGGER BUTTON */}
      <button
        type="button"
        onClick={() => setShowModal(true)}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all duration-300 cursor-pointer ${theme.bg} ${theme.border} ${theme.glow} text-left select-none group`}
        title="Toca para ver el estado en vivo de La Facultad Studio"
      >
        {/* Pulsing LED indicator */}
        <span className="relative flex h-2.5 w-2.5 shrink-0">
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${theme.ledPing}`}></span>
          <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${theme.ledBg}`}></span>
        </span>

        {/* Text Container */}
        <div className="leading-tight hidden sm:block">
          <div className="flex items-center gap-1.5">
            {theme.icon}
            <span className={`text-[10px] font-mono tracking-wider uppercase ${theme.titleColor}`}>
              {status.titulo}
            </span>
          </div>
          <span className={`text-[9px] block truncate max-w-[200px] lg:max-w-[280px] ${theme.subColor} font-medium`}>
            {status.subtitulo}
          </span>
        </div>

        {/* Mobile-only compact tag */}
        <div className="sm:hidden flex items-center gap-1">
          <span className={`text-[10px] font-mono font-black tracking-wider uppercase ${theme.titleColor}`}>
            {theme.tag}
          </span>
        </div>
      </button>

      {/* POPUP / MODAL DE DETALLES EN VIVO */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-[#18181b] border border-gray-700 w-full max-w-md rounded-2xl p-5 space-y-4 shadow-2xl relative">
            {/* Header del Modal */}
            <div className="flex justify-between items-start border-b border-gray-800 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="relative flex h-3 w-3">
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${theme.ledPing}`}></span>
                  <span className={`relative inline-flex rounded-full h-3 w-3 ${theme.ledBg}`}></span>
                </span>
                <div>
                  <h4 className={`text-sm font-black uppercase tracking-wider ${theme.titleColor}`}>
                    {status.titulo}
                  </h4>
                  <p className="text-[10px] text-gray-400 font-mono">
                    Estado en tiempo real de La Facultad Studio
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-white p-1 rounded-lg bg-gray-900 border border-gray-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Tarjeta de Telemetría */}
            <div className="bg-black/60 rounded-xl p-4 border border-gray-800 space-y-2.5 text-xs">
              <div className="flex items-center justify-between text-gray-400">
                <span className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-amber-500" />
                  Productor en Turno:
                </span>
                <strong className="text-white font-medium">{status.ingeniero || 'Manuel E. Ramirez (Badlenz)'}</strong>
              </div>

              <div className="flex items-center justify-between text-gray-400">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-red-500" />
                  Próximo Turno Libre:
                </span>
                <strong className="text-emerald-400 font-bold font-mono">
                  {status.proximoTurnoLibre || 'Turno Noche 06:00 PM'}
                </strong>
              </div>

              <div className="flex items-center justify-between text-gray-400 pt-1 border-t border-gray-800/80">
                <span>Tratamiento de Sala:</span>
                <span className="text-gray-300 font-mono text-[11px]">Studio Acústico Profesional</span>
              </div>

              <div className="flex items-center justify-between text-gray-400">
                <span>Ubicación:</span>
                <span className="text-gray-300">Hormigueros, Puerto Rico</span>
              </div>
            </div>

            {/* Mensaje descriptivo */}
            <p className="text-xs text-gray-300 bg-gray-900/70 p-3 rounded-xl border border-gray-800/80 leading-relaxed">
              {status.subtitulo}
            </p>

            {/* Botones de Acción */}
            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowModal(false);
                  if (onGoToBooking) {
                    onGoToBooking();
                  }
                }}
                className="w-full bg-gradient-to-r from-red-700 to-red-600 hover:from-red-600 hover:to-red-500 text-white font-black py-2.5 rounded-xl text-xs uppercase tracking-wider transition flex items-center justify-center gap-2 shadow-lg active:scale-95 cursor-pointer"
              >
                <Calendar className="w-4 h-4" />
                <span>Ver Calendario y Reservar Turno</span>
                <ChevronRight className="w-4 h-4" />
              </button>

              <a
                href={`https://wa.me/17872408627?text=${encodeURIComponent(
                  `¡Hola Badlenz! Vi el estado de La Facultad Studio (${status.titulo}). Me gustaría consultar disponibilidad de fechas en el studio para mi próximo tema.`
                )}`}
                target="_blank"
                rel="noreferrer"
                className="w-full bg-[#25D366]/20 hover:bg-[#25D366]/30 border border-[#25D366]/50 text-emerald-300 font-bold py-2.5 rounded-xl text-xs uppercase tracking-wider transition flex items-center justify-center gap-2"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Consultar Inmediato por WhatsApp</span>
              </a>

              {isAdmin && onGoToAdmin && (
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    onGoToAdmin();
                  }}
                  className="w-full bg-gray-800 hover:bg-gray-700 text-gray-300 font-semibold py-2 rounded-xl text-[11px] uppercase transition flex items-center justify-center gap-1.5"
                >
                  <span>⚙️ Cambiar Estado en Panel Admin</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
