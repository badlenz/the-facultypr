import React, { useState } from 'react';
import { LFCrestLogo } from './BrandingLogos';
import { Shield, User, Sparkles, Flame, Headphones, ArrowRight, KeyRound } from 'lucide-react';
import { PortalArtistaModal } from './PortalArtistaModal';

interface EntrySelectionScreenProps {
  onSelectMode: (mode: 'admin' | 'cliente') => void;
}

export const EntrySelectionScreen: React.FC<EntrySelectionScreenProps> = ({ onSelectMode }) => {
  const [hoveredRole, setHoveredRole] = useState<'admin' | 'cliente' | null>(null);
  const [showVipModal, setShowVipModal] = useState(false);

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-white flex flex-col items-center justify-center relative overflow-hidden p-6 select-none">
      {/* Fondo con efectos atmosféricos de estudio - Optimizado para GPUs móviles */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-red-950/20 via-[#111827]/80 to-[#0a0a0a] pointer-events-none" />
      
      {/* Líneas de brillo ambiental (Solo en escritorio para evitar retardos de GPU en móviles) */}
      <div className="hidden sm:block absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-red-600/10 rounded-full blur-[120px] pointer-events-none animate-pulse" />
      <div className="hidden sm:block absolute bottom-1/4 left-1/3 w-[400px] h-[400px] bg-amber-500/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Contenedor Principal */}
      <div className="relative z-10 max-w-4xl w-full mx-auto text-center space-y-10">
        
        {/* Cabecera del Estudio */}
        <div className="space-y-4 flex flex-col items-center">
          <div className="transform hover:scale-105 transition-transform duration-500 cursor-pointer drop-shadow-[0_0_25px_rgba(239,68,68,0.4)]">
            <LFCrestLogo size="xl" />
          </div>
          
          <div className="space-y-1">
            <span className="text-[10px] bg-red-950/80 border border-red-700/50 text-red-400 font-mono tracking-[0.3em] uppercase px-3 py-1 rounded-full shadow-lg">
              Estudio de Grabación Profesional • Badlenz
            </span>
            <h1 className="text-3xl md:text-5xl font-black uppercase tracking-wider bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent">
              LA FACULTAD <span className="text-red-500">STUDIO</span>
            </h1>
            <p className="text-xs md:text-sm text-gray-400 max-w-md mx-auto pt-1 font-mono">
              Selecciona tu portal de acceso para ingresar a la cabina o gestionar operaciones.
            </p>
          </div>
        </div>

        {/* Tarjetas de Selección (El "Juego" de Elección) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto pt-4">
          
          {/* Opción 1: Portal de Clientes / Artistas */}
          <div
            onClick={() => onSelectMode('cliente')}
            onMouseEnter={() => setHoveredRole('cliente')}
            onMouseLeave={() => setHoveredRole(null)}
            className={`group relative antigravity-glass-card border rounded-3xl p-6 md:p-8 text-left transition-all duration-300 cursor-pointer flex flex-col justify-between ${
              hoveredRole === 'cliente' 
                ? 'border-amber-500/80 shadow-[0_25px_50px_rgba(245,158,11,0.25)] -translate-y-2' 
                : 'border-white/10 hover:border-amber-500/40 shadow-2xl'
            }`}
          >
            <div className="absolute top-4 right-4 text-gray-700 group-hover:text-amber-500 transition-colors">
              <User className="w-6 h-6" />
            </div>

            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500 group-hover:scale-110 transition-transform">
                <Headphones className="w-6 h-6" />
              </div>

              <div>
                <span className="text-[10px] font-mono text-amber-500 uppercase tracking-widest font-bold">Artistas & Voces</span>
                <h3 className="text-lg font-black text-white uppercase tracking-wider mt-1 group-hover:text-amber-400 transition-colors">
                  Portal de Clientes
                </h3>
                <p className="text-xs text-gray-400 mt-2 leading-relaxed">
                  Escucha el sonido A/B en cabina, revisa tarifas oficiales, reserva tu bloque de 4 horas y accede a tus proyectos.
                </p>
              </div>
            </div>

            <div className="pt-6 mt-6 border-t border-gray-800/80 flex items-center justify-between">
              <span className="text-xs font-bold text-amber-500 flex items-center gap-1.5 group-hover:translate-x-1 transition-transform">
                <span>Ingresar como Artista</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </span>
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            </div>
          </div>

          {/* Opción 2: Panel de Administración */}
          <div
            onClick={() => onSelectMode('admin')}
            onMouseEnter={() => setHoveredRole('admin')}
            onMouseLeave={() => setHoveredRole(null)}
            className={`group relative antigravity-glass-card border rounded-3xl p-6 md:p-8 text-left transition-all duration-300 cursor-pointer flex flex-col justify-between ${
              hoveredRole === 'admin' 
                ? 'border-red-600/80 shadow-[0_25px_50px_rgba(220,38,38,0.25)] -translate-y-2' 
                : 'border-white/10 hover:border-red-500/40 shadow-2xl'
            }`}
          >
            <div className="absolute top-4 right-4 text-gray-700 group-hover:text-red-500 transition-colors">
              <Shield className="w-6 h-6" />
            </div>

            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-500 group-hover:scale-110 transition-transform">
                <Flame className="w-6 h-6" />
              </div>

              <div>
                <span className="text-[10px] font-mono text-red-500 uppercase tracking-widest font-bold">Gestión de Cabina</span>
                <h3 className="text-lg font-black text-white uppercase tracking-wider mt-1 group-hover:text-red-400 transition-colors">
                  Panel Admin
                </h3>
                <p className="text-xs text-gray-400 mt-2 leading-relaxed">
                  Administra reservas, control de pagos, gestión de proyectos de mezcla/master y ranking de artistas con horas de vuelo.
                </p>
              </div>
            </div>

            <div className="pt-6 mt-6 border-t border-gray-800/80 flex items-center justify-between">
              <span className="text-xs font-bold text-red-500 flex items-center gap-1.5 group-hover:translate-x-1 transition-transform">
                <span>Ingresar como Admin</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </span>
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            </div>
          </div>

        </div>

        {/* Acceso Directo al Portal de Artista VIP (Cabina de Escucha en Vivo) */}
        <div className="max-w-2xl mx-auto pt-1">
          <button
            type="button"
            onClick={() => setShowVipModal(true)}
            className="w-full py-3.5 px-5 rounded-2xl bg-[#0b0c0e]/95 hover:bg-[#12141a] border border-amber-500/50 hover:border-amber-400 shadow-[0_10px_30px_rgba(245,158,11,0.18)] transition-all flex items-center justify-between gap-3 cursor-pointer group"
          >
            <div className="flex items-center gap-3 text-left">
              <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0 group-hover:scale-105 transition-transform">
                <KeyRound className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs sm:text-sm font-black uppercase tracking-wider text-white flex items-center gap-1.5">
                  <span>Portal de Artista</span>
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                </span>
                <span className="text-[11px] text-zinc-400 block">
                  ¿Ya grabaste tu tema? Ingresa tu código de sesión para entrar a tu Cabina de Escucha en vivo.
                </span>
              </div>
            </div>
            <span className="text-xs font-bold text-amber-400 group-hover:translate-x-1 transition-transform shrink-0">
              Abrir Cabina ➜
            </span>
          </button>
        </div>

        {/* Footer info */}
        <div className="text-[10px] text-gray-500 font-mono pt-4">
          La Facultad Studio OS • Diseñado para profesionales de la música urbana y comercial.
        </div>

      </div>

      <PortalArtistaModal
        isOpen={showVipModal}
        onClose={() => setShowVipModal(false)}
      />
    </div>
  );
};
