import React from 'react';
import { Sparkles, MessageCircle, ExternalLink, X, Music, Download, ShieldCheck, ArrowRight, FolderArchive } from 'lucide-react';
import { ARTIST_PORTAL_EXTERNAL_URL } from '../config/portalConfig';

interface PortalArtistaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenLegacyVault?: () => void;
}

export const PortalArtistaModal: React.FC<PortalArtistaModalProps> = ({
  isOpen,
  onClose,
  onOpenLegacyVault,
}) => {
  if (!isOpen) return null;

  const hasExternalUrl = Boolean(ARTIST_PORTAL_EXTERNAL_URL && ARTIST_PORTAL_EXTERNAL_URL.trim().length > 0);

  const handleGoToPortal = () => {
    if (hasExternalUrl) {
      window.open(ARTIST_PORTAL_EXTERNAL_URL, '_blank', 'noopener,noreferrer');
      onClose();
    }
  };

  const whatsappMessage = encodeURIComponent(
    '¡Saludos Badlenz! Grabé en La Facultad Studio y me gustaría solicitar los archivos (Masters / Stems) de mi sesión.'
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div 
        className="relative w-full max-w-lg bg-gradient-to-b from-[#181820] to-[#0f1015] border border-red-900/50 rounded-3xl p-6 sm:p-8 shadow-2xl text-left space-y-6 text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Botón Cerrar */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white rounded-full bg-black/40 hover:bg-black/80 transition"
          aria-label="Cerrar modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Encabezado */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono uppercase tracking-[0.25em] bg-red-950/80 border border-red-700/60 text-red-400 font-extrabold px-3 py-1 rounded-full">
              {hasExternalUrl ? 'Portal Oficial' : 'Próximamente • Nueva Versión'}
            </span>
          </div>

          <h3 className="text-xl sm:text-2xl font-black uppercase tracking-wider text-white flex items-center gap-2">
            <span>Portal de Artistas</span>
            <Sparkles className="w-5 h-5 text-amber-400" />
          </h3>

          <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
            {hasExternalUrl 
              ? 'Accede a la plataforma oficial de La Facultad Studio para descargar tus proyectos, stems y recibos.'
              : 'Estamos desarrollando una nueva plataforma independiente optimizada para la entrega rápida de stems, masters en 24-bit y recibos oficiales.'}
          </p>
        </div>

        {/* Beneficios de la nueva plataforma */}
        <div className="grid grid-cols-1 gap-2.5 bg-black/50 p-4 rounded-2xl border border-gray-800/80 text-xs text-gray-300">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-red-950/60 border border-red-700/50 flex items-center justify-center text-red-400 shrink-0">
              <Music className="w-4 h-4" />
            </div>
            <div>
              <strong className="text-white block text-[12px]">Masters WAV 24-bit</strong>
              <span className="text-[11px] text-gray-400">Archivos oficiales listos para distribución en Spotify & Apple Music.</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-950/60 border border-amber-700/50 flex items-center justify-center text-amber-400 shrink-0">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <strong className="text-white block text-[12px]">Entrega de Stems & Pistas</strong>
              <span className="text-[11px] text-gray-400">Voces afinadas, efectos y canal instrumental por separado.</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-950/60 border border-emerald-700/50 flex items-center justify-center text-emerald-400 shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <strong className="text-white block text-[12px]">Comprobantes & Pases VIP</strong>
              <span className="text-[11px] text-gray-400">Acceso a facturación y confirmaciones de abono con ATH Móvil.</span>
            </div>
          </div>
        </div>

        {/* Acciones principales */}
        <div className="space-y-3 pt-2">
          {hasExternalUrl ? (
            <button
              type="button"
              onClick={handleGoToPortal}
              className="w-full py-3.5 bg-gradient-to-r from-red-600 via-red-500 to-amber-500 hover:from-red-500 hover:to-amber-400 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg transition flex items-center justify-center gap-2 cursor-pointer active:scale-95"
            >
              <span>Abrir Nuevo Portal de Artistas</span>
              <ExternalLink className="w-4 h-4" />
            </button>
          ) : (
            <a
              href={`https://wa.me/17872408627?text=${whatsappMessage}`}
              target="_blank"
              rel="noreferrer"
              className="w-full py-3.5 bg-[#25D366] hover:bg-[#20ba5a] text-black font-black text-xs uppercase tracking-wider rounded-xl shadow-lg transition flex items-center justify-center gap-2 text-center active:scale-95"
            >
              <MessageCircle className="w-4 h-4 fill-current" />
              <span>Solicitar Archivos a Badlenz por WhatsApp</span>
            </a>
          )}

          {/* Opción secundaria para ver bóveda histórica si se requiere */}
          {onOpenLegacyVault && (
            <div className="text-center pt-1">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenLegacyVault();
                }}
                className="text-[11px] text-gray-500 hover:text-gray-300 font-mono underline decoration-gray-700 transition"
              >
                Acceder a la bóveda de sesiones anteriores (Versión previa)
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PortalArtistaModal;
