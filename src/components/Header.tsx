import React, { useState, useRef } from 'react';
import { NavigationTab, AppMode } from '../types';
import { 
  Calculator, 
  Calendar, 
  Kanban, 
  FileText, 
  WandSparkles,
  Lock,
  User,
  Menu,
  X,
  LogOut,
  Eye,
  ShieldAlert,
  ExternalLink,
  Sparkles
} from 'lucide-react';
import { LFCrestLogo, BadlenzLogo } from './BrandingLogos';
import { StudioLiveStatusBadge } from './StudioLiveStatusBadge';
import { getStudioLiveStatus, subscribeToStudioStatus, StudioLiveStatus } from '../services/studioStatus';
import { PortalArtistaModal } from './PortalArtistaModal';

export interface HeaderProps {
  activeTab?: NavigationTab | string;
  setActiveTab?: (tab: any) => void;
  savedQuotesCount?: number;
  activeProjectsCount?: number;
  appMode?: AppMode | 'admin' | 'public' | 'cliente';
  setAppMode?: (mode: any) => void;

  // Additional prop aliases for flexibility
  currentRole?: 'admin' | 'cliente' | 'public';
  onRoleChange?: (role: any) => void;
  onTabChange?: (tab: any) => void;
  onSecretAdminTrigger?: () => void;
  onLogoutAdmin?: () => void;
  isAdminAuthenticated?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab = 'cotizador',
  setActiveTab,
  savedQuotesCount = 0,
  activeProjectsCount = 0,
  appMode = 'public',
  setAppMode,
  currentRole,
  onRoleChange,
  onTabChange,
  onSecretAdminTrigger,
  onLogoutAdmin,
  isAdminAuthenticated = false
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [secretFeedback, setSecretFeedback] = useState(false);
  const [showArtistPortalModal, setShowArtistPortalModal] = useState(false);
  const [studioStatus, setStudioStatus] = useState<StudioLiveStatus>(() => getStudioLiveStatus());

  React.useEffect(() => {
    const unsub = subscribeToStudioStatus((st) => setStudioStatus(st));
    return unsub;
  }, []);

  const isStudioTemporarilyClosed = ['vacaciones', 'mantenimiento', 'remodelacion'].includes(studioStatus.estado);

  // Triple tap & Long press detection on Logo
  const tapTimesRef = useRef<number[]>([]);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Determine normalized role ('admin' vs 'public'/'cliente')
  const effectiveRole = currentRole || appMode;
  const isAdmin = effectiveRole === 'admin';

  // Handle role change toggle
  const handleRoleToggle = (newRole: 'admin' | 'cliente' | 'public') => {
    const isNextAdmin = newRole === 'admin';
    if (onRoleChange) {
      onRoleChange(newRole);
    }
    if (setAppMode) {
      setAppMode(isNextAdmin ? 'admin' : 'public');
    }
    handleTabSelect(isNextAdmin ? 'panel_admin' : 'cliente');
  };

  // Handle tab change
  const handleTabSelect = (tab: string) => {
    const mappedTab = tab === 'pases' ? 'factura' : tab;
    if (onTabChange) {
      onTabChange(tab);
    }
    if (setActiveTab) {
      setActiveTab(mappedTab);
    }
    setMobileMenuOpen(false);
  };

  // Check if active tab matches
  const isTabActive = (tabKey: string) => {
    if (activeTab === tabKey) return true;
    if (tabKey === 'factura' && activeTab === 'pases') return true;
    if (tabKey === 'pases' && activeTab === 'factura') return true;
    return false;
  };

  // Secret Gesture Handler (Triple Tap)
  const handleLogoClick = () => {
    const now = Date.now();
    tapTimesRef.current = [...tapTimesRef.current.filter(t => now - t < 1200), now];

    if (tapTimesRef.current.length >= 3) {
      tapTimesRef.current = [];
      triggerSecretAdmin();
      return;
    }

    // Single regular click in client mode: go to top or agendar sesión
    if (!isAdmin) {
      handleTabSelect('cliente');
    } else {
      handleTabSelect('panel_admin');
    }
  };

  // Long press handler (Holding logo for 2 seconds)
  const handlePointerDown = () => {
    longPressTimerRef.current = setTimeout(() => {
      triggerSecretAdmin();
    }, 2000);
  };

  const handlePointerUpOrLeave = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const triggerSecretAdmin = () => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try { navigator.vibrate([60, 40, 60]); } catch (e) { /* ignore */ }
    }
    setSecretFeedback(true);
    setTimeout(() => setSecretFeedback(false), 2000);

    if (onSecretAdminTrigger) {
      onSecretAdminTrigger();
    } else {
      handleRoleToggle('admin');
    }
  };

  return (
    <header className="bg-[#080a12]/85 backdrop-blur-2xl text-white shadow-[0_12px_40px_rgba(0,0,0,0.65)] border-b border-white/10 sticky top-0 z-40">
      {/* BARRA DE ALERTA DISCRETA CUANDO BADLENZ ESTÁ EN MODO ADMIN */}
      {isAdmin && (
        <div className="bg-gradient-to-r from-red-950 via-red-900/90 to-amber-950 px-4 py-1.5 border-b border-red-700/60 text-[11px] font-mono flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-400 animate-ping"></span>
            <span className="font-bold text-white uppercase tracking-wider">
              🔒 Control Room Activo (Ruta /admin)
            </span>
            {isAdminAuthenticated ? (
              <span className="hidden sm:inline-block bg-emerald-950/80 text-emerald-300 border border-emerald-700/50 px-2 py-0.2 rounded text-[9px] font-bold">
                Sesión Verificada
              </span>
            ) : (
              <span className="hidden sm:inline-block bg-amber-950/80 text-amber-300 border border-amber-700/50 px-2 py-0.2 rounded text-[9px] font-bold">
                Requiere Clave
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => handleRoleToggle('cliente')}
              className="text-amber-300 hover:text-white flex items-center gap-1 font-bold underline decoration-amber-500/50 cursor-pointer"
              title="Ver el sitio tal como lo ven los clientes"
            >
              <Eye className="w-3 h-3" />
              <span>Ver como Artista</span>
            </button>
            {onLogoutAdmin && (
              <button
                type="button"
                onClick={onLogoutAdmin}
                className="text-red-300 hover:text-white flex items-center gap-1 font-bold bg-black/40 hover:bg-black/80 px-2 py-0.5 rounded border border-red-800/60 cursor-pointer"
                title="Cerrar Sesión de Administrador"
              >
                <LogOut className="w-3 h-3" />
                <span className="hidden sm:inline">Cerrar Sesión</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* FEEDBACK VISUAL DEL GESTO SECRETO */}
      {secretFeedback && (
        <div className="bg-amber-500 text-gray-950 px-3 py-1 text-center text-xs font-black uppercase tracking-widest animate-bounce">
          ⚡ Acceso Badlenz Detectado • Abriendo Control Room...
        </div>
      )}

      {/* Barra Superior de Identidad */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap justify-between items-center gap-4">
        
        {/* LOGO LA FACULTAD STUDIO (CON GESTO SECRETO DE 3 TAPS / LONG PRESS) */}
        <div 
          className="flex items-center space-x-3 cursor-pointer select-none group relative" 
          onClick={handleLogoClick}
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUpOrLeave}
          onPointerLeave={handlePointerUpOrLeave}
          title={isAdmin ? "Panel Admin" : "La Facultad Studio | Prod. Badlenz"}
        >
          <div className="flex items-center gap-2.5 transform group-hover:scale-105 transition-transform duration-200">
            <LFCrestLogo size="sm" />
            <div className="hidden lg:block w-px h-6 bg-zinc-800" />
            <div className="hidden lg:block">
              <BadlenzLogo size="sm" />
            </div>
          </div>
          <div>
            <h1 className="font-bold text-lg leading-none uppercase tracking-widest text-white flex items-center gap-1.5 font-syne">
              LA FACULTAD <span className="text-red-500">STUDIO</span>
            </h1>
            <p className="text-[10px] text-gray-400 mt-0.5">
              PROD. BADLENZ • HORMIGUEROS, PR • <span className="text-amber-400 font-medium">“Transformando tu visión en sonido profesional.”</span>
            </p>
          </div>
        </div>

        {/* INDICADOR DE ESTADO DEL ESTUDIO EN VIVO */}
        <StudioLiveStatusBadge
          isAdmin={isAdmin}
          onGoToBooking={() => handleTabSelect('cliente')}
          onGoToAdmin={() => handleRoleToggle('admin')}
        />

        {/* MODO PÚBLICO: MENÚ ULTRA-LIMPIO CON LAS 3 SECCIONES CLAVE Y BOTÓN DESTACADO PORTAL DE ARTISTA */}
        {!isAdmin && (
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-1.5 bg-black/40 p-1 rounded-2xl border border-white/10 backdrop-blur-md">
              <button
                type="button"
                onClick={() => {
                  if (activeTab !== 'cliente') handleTabSelect('cliente');
                  setTimeout(() => {
                    document.getElementById('seccion-muestras-ab')?.scrollIntoView({ behavior: 'smooth' });
                  }, 80);
                }}
                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-zinc-300 hover:text-white hover:bg-white/10 transition-all flex items-center gap-1.5 cursor-pointer group"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition-transform" />
                <span className="font-syne">Sonido A/B</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (activeTab !== 'cliente') handleTabSelect('cliente');
                  setTimeout(() => {
                    document.getElementById('seccion-calendario-booking')?.scrollIntoView({ behavior: 'smooth' });
                  }, 80);
                }}
                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-red-200 bg-red-950/40 hover:bg-red-900/60 border border-red-800/40 transition-all flex items-center gap-1.5 cursor-pointer group"
              >
                <Calendar className="w-3.5 h-3.5 text-red-400 group-hover:scale-110 transition-transform" />
                <span className="font-syne font-bold">Reservar Fecha</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (activeTab !== 'cliente') handleTabSelect('cliente');
                  setTimeout(() => {
                    document.getElementById('tarifas-estudio')?.scrollIntoView({ behavior: 'smooth' });
                  }, 80);
                }}
                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-zinc-300 hover:text-white hover:bg-white/10 transition-all flex items-center gap-1 cursor-pointer group"
              >
                <span className="text-amber-400 font-bold">$</span>
                <span className="font-syne">Tarifas</span>
              </button>
            </nav>

            {/* BOTÓN DESTACADO: PORTAL DE ARTISTA */}
            <button
              type="button"
              onClick={() => setShowArtistPortalModal(true)}
              className="taste-btn px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 bg-gradient-to-r from-amber-500/20 via-zinc-900 to-[#12131a] hover:from-amber-500/30 hover:to-zinc-800 text-white border border-amber-500/50 hover:border-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.2)] hover:shadow-[0_0_25px_rgba(245,158,11,0.4)] transition-all cursor-pointer group"
              title="Acceso al Portal de Artistas y Descargas"
            >
              <User className="w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition-transform" />
              <span className="font-syne font-bold tracking-wide">Portal de Artista</span>
              <ExternalLink className="w-3 h-3 text-amber-400/80 group-hover:text-amber-300 transition-colors" />
            </button>
          </div>
        )}

        {/* MODO ADMIN: BOTONES DE SESIÓN Y VISTAS */}
        {isAdmin && (
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center bg-gray-950 p-1.5 rounded-xl border border-gray-800 space-x-1">
              <button
                type="button"
                onClick={() => handleRoleToggle('cliente')}
                className="px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-2 text-gray-400 hover:text-white"
              >
                <User className="w-3.5 h-3.5" />
                <span>Ver como Artista</span>
              </button>

              <button
                type="button"
                onClick={() => handleRoleToggle('admin')}
                className="px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 bg-red-700 text-white shadow-md"
                title="Acceso exclusivo para Badlenz"
              >
                <Lock className="w-3 h-3 text-amber-400" />
                <span>Control Room</span>
              </button>
            </div>

            {/* Mobile Hamburger toggle (solo para admin) */}
            <div className="sm:hidden flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleRoleToggle('cliente')}
                className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/40"
              >
                Ver Cliente
              </button>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* BARRA DE PESTAÑAS (CONTROL ROOM TRANSPORT DOCK - MODO ADMIN BADLENZ) */}
      {isAdmin && (
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2">
          <div className="bg-[#0b0d14]/90 backdrop-blur-2xl border border-white/10 rounded-2xl p-1.5 shadow-[0_15px_35px_rgba(0,0,0,0.6)] flex items-center space-x-1 overflow-x-auto text-xs font-semibold scrollbar-none">
            <button
              type="button"
              onClick={() => handleTabSelect('panel_admin')}
              id="nav-tab-panel-admin"
              className={`px-3.5 py-2 rounded-xl transition-all duration-200 flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                isTabActive('panel_admin') 
                  ? 'bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 text-white font-bold shadow-[0_0_20px_rgba(239,68,68,0.4)] ring-1 ring-white/20 scale-[1.02]' 
                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Lock className={`w-3.5 h-3.5 ${isTabActive('panel_admin') ? 'text-amber-200' : 'text-zinc-500'}`} />
              <span className="font-syne tracking-wide">Panel Admin</span>
            </button>

            <button
              type="button"
              onClick={() => handleTabSelect('cotizador')}
              id="nav-tab-cotizador"
              className={`px-3.5 py-2 rounded-xl transition-all duration-200 flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                isTabActive('cotizador') 
                  ? 'bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 text-white font-bold shadow-[0_0_20px_rgba(239,68,68,0.4)] ring-1 ring-white/20 scale-[1.02]' 
                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Calculator className={`w-3.5 h-3.5 ${isTabActive('cotizador') ? 'text-amber-200' : 'text-zinc-500'}`} />
              <span className="font-syne tracking-wide">Cotizador</span>
              {savedQuotesCount > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full text-[9px] bg-amber-400 text-black font-black font-mono">
                  {savedQuotesCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => handleTabSelect('calendario')}
              id="nav-tab-calendario"
              className={`px-3.5 py-2 rounded-xl transition-all duration-200 flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                isTabActive('calendario') 
                  ? 'bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 text-white font-bold shadow-[0_0_20px_rgba(239,68,68,0.4)] ring-1 ring-white/20 scale-[1.02]' 
                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Calendar className={`w-3.5 h-3.5 ${isTabActive('calendario') ? 'text-amber-200' : 'text-zinc-500'}`} />
              <span className="font-syne tracking-wide">Calendario</span>
            </button>

            <button
              type="button"
              onClick={() => handleTabSelect('proyectos')}
              id="nav-tab-proyectos"
              className={`px-3.5 py-2 rounded-xl transition-all duration-200 flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                isTabActive('proyectos') 
                  ? 'bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 text-white font-bold shadow-[0_0_20px_rgba(239,68,68,0.4)] ring-1 ring-white/20 scale-[1.02]' 
                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Kanban className={`w-3.5 h-3.5 ${isTabActive('proyectos') ? 'text-amber-200' : 'text-zinc-500'}`} />
              <span className="font-syne tracking-wide">Proyectos Musicales</span>
              {activeProjectsCount > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full text-[9px] bg-red-950 text-red-200 border border-red-700/60 font-bold font-mono">
                  {activeProjectsCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => handleTabSelect('factura')}
              id="nav-tab-factura"
              className={`px-3.5 py-2 rounded-xl transition-all duration-200 flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                isTabActive('factura') || isTabActive('pases') 
                  ? 'bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 text-white font-bold shadow-[0_0_20px_rgba(239,68,68,0.4)] ring-1 ring-white/20 scale-[1.02]' 
                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <FileText className={`w-3.5 h-3.5 ${isTabActive('factura') || isTabActive('pases') ? 'text-amber-200' : 'text-zinc-500'}`} />
              <span className="font-syne tracking-wide">Sesiones & Facturas</span>
            </button>

            <button
              type="button"
              onClick={() => handleTabSelect('asistente')}
              id="nav-tab-asistente"
              className={`px-3.5 py-2 rounded-xl transition-all duration-200 flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                isTabActive('asistente') 
                  ? 'bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 text-white font-bold shadow-[0_0_20px_rgba(239,68,68,0.4)] ring-1 ring-white/20 scale-[1.02]' 
                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <WandSparkles className={`w-3.5 h-3.5 ${isTabActive('asistente') ? 'text-amber-200' : 'text-amber-400'}`} />
              <span className="font-syne tracking-wide">Asistente IA</span>
            </button>
          </div>
        </div>
      )}

      {/* MENÚ MÓVIL DESPLEGABLE (SOLO EN MODO ADMIN) */}
      {isAdmin && mobileMenuOpen && (
        <div className="sm:hidden bg-[#18181b] border-b border-gray-800 px-4 py-3 space-y-2">
          <button
            type="button"
            onClick={() => handleTabSelect('panel_admin')}
            className="w-full text-left py-2 px-3 rounded text-xs font-bold bg-red-700 text-white flex items-center gap-2"
          >
            <Lock className="w-4 h-4 text-amber-400" />
            <span>Panel Administrador</span>
          </button>
          <button
            type="button"
            onClick={() => handleTabSelect('cotizador')}
            className="w-full text-left py-2 px-3 rounded text-xs text-gray-300 hover:bg-gray-800 flex items-center gap-2"
          >
            <Calculator className="w-4 h-4" />
            <span>Cotizador Oficial</span>
          </button>
          <button
            type="button"
            onClick={() => handleTabSelect('calendario')}
            className="w-full text-left py-2 px-3 rounded text-xs text-gray-300 hover:bg-gray-800 flex items-center gap-2"
          >
            <Calendar className="w-4 h-4" />
            <span>Calendario de Sesiones</span>
          </button>
          <button
            type="button"
            onClick={() => handleTabSelect('proyectos')}
            className="w-full text-left py-2 px-3 rounded text-xs text-gray-300 hover:bg-gray-800 flex items-center gap-2"
          >
            <Kanban className="w-4 h-4" />
            <span>Proyectos Musicales</span>
          </button>
          <button
            type="button"
            onClick={() => handleTabSelect('factura')}
            className="w-full text-left py-2 px-3 rounded text-xs text-gray-300 hover:bg-gray-800 flex items-center gap-2"
          >
            <FileText className="w-4 h-4" />
            <span>Sesiones y Facturas</span>
          </button>
          <button
            type="button"
            onClick={() => handleRoleToggle('cliente')}
            className="w-full text-left py-2 px-3 rounded text-xs font-bold text-amber-400 bg-black/50 border border-amber-500/30 flex items-center gap-2 mt-2"
          >
            <User className="w-4 h-4" />
            <span>Cambiar a Vista de Cliente</span>
          </button>
        </div>
      )}

      {/* BARRA MÓVIL PÚBLICA ULTRA-COMPACTA PARA ACCESO DIRECTO CON 1 TAP */}
      {!isAdmin && (
        <div className="md:hidden border-t border-white/5 bg-[#090b12]/95 px-3 py-2 flex items-center justify-around gap-1 text-[11px] font-medium text-zinc-300">
          <button
            type="button"
            onClick={() => {
              if (activeTab !== 'cliente') handleTabSelect('cliente');
              setTimeout(() => {
                document.getElementById('seccion-muestras-ab')?.scrollIntoView({ behavior: 'smooth' });
              }, 80);
            }}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 active:bg-white/10 hover:text-white"
          >
            <Sparkles className="w-3 h-3 text-amber-400" />
            <span className="font-syne">Sonido A/B</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (activeTab !== 'cliente') handleTabSelect('cliente');
              setTimeout(() => {
                document.getElementById('seccion-calendario-booking')?.scrollIntoView({ behavior: 'smooth' });
              }, 80);
            }}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-red-950/70 border border-red-800/50 text-red-200 active:bg-red-900/60 font-semibold"
          >
            <Calendar className="w-3 h-3 text-red-400" />
            <span className="font-syne font-bold">Reservar Fecha</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (activeTab !== 'cliente') handleTabSelect('cliente');
              setTimeout(() => {
                document.getElementById('tarifas-estudio')?.scrollIntoView({ behavior: 'smooth' });
              }, 80);
            }}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/5 active:bg-white/10 hover:text-white"
          >
            <span className="text-amber-400 font-bold">$</span>
            <span className="font-syne">Tarifas</span>
          </button>
        </div>
      )}

      {/* MODAL DE INFORMACIÓN Y REDIRECCIÓN DEL PORTAL DE ARTISTAS */}
      <PortalArtistaModal
        isOpen={showArtistPortalModal}
        onClose={() => setShowArtistPortalModal(false)}
        onOpenLegacyVault={() => handleTabSelect('historial')}
      />
    </header>
  );
};

export default Header;
