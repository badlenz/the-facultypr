import React, { useState, useRef, lazy, Suspense } from 'react';
import { NavigationTab, AppMode } from '../types';
import {
  Calendar,
  Lock,
  User,
  LogOut,
  Eye,
  Headphones,
} from 'lucide-react';
import { LFCrestLogo, BadlenzLogo } from './BrandingLogos';
import { StudioLiveStatusBadge } from './StudioLiveStatusBadge';

const PortalArtistaModal = lazy(() => import('./PortalArtistaModal'));
const RegistroVipQrModal = lazy(() => import('./RegistroVipQrModal'));

export interface HeaderProps {
  activeTab?: NavigationTab | string;
  setActiveTab?: (tab: any) => void;
  appMode?: AppMode | 'admin' | 'public' | 'cliente';
  setAppMode?: (mode: any) => void;
  currentRole?: 'admin' | 'cliente' | 'public';
  onRoleChange?: (role: any) => void;
  onTabChange?: (tab: any) => void;
  onSecretAdminTrigger?: () => void;
  onLogoutAdmin?: () => void;
  isAdminAuthenticated?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab = 'cliente',
  setActiveTab,
  appMode = 'public',
  setAppMode,
  currentRole,
  onRoleChange,
  onTabChange,
  onSecretAdminTrigger,
  onLogoutAdmin,
  isAdminAuthenticated = false,
}) => {
  const [secretFeedback, setSecretFeedback] = useState(false);
  const [showArtistPortalModal, setShowArtistPortalModal] = useState(false);
  const [artistPortalInitialCode, setArtistPortalInitialCode] = useState('');
  const [showRegistroVipModal, setShowRegistroVipModal] = useState(false);

  React.useEffect(() => {
    const handleOpenModalEvent = (ev: Event) => {
      const custom = ev as CustomEvent<{ codigo?: string }>;
      if (custom.detail?.codigo) {
        setArtistPortalInitialCode(custom.detail.codigo);
      }
      setShowArtistPortalModal(true);
    };
    const handleOpenRegistroEvent = () => setShowRegistroVipModal(true);
    window.addEventListener('open-artist-portal-modal', handleOpenModalEvent);
    window.addEventListener('open-registro-vip-modal', handleOpenRegistroEvent);
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const vipParam = params.get('vip');
      if (vipParam && vipParam.trim().length >= 3) {
        setArtistPortalInitialCode(vipParam.trim());
        setShowArtistPortalModal(true);
      } else if (params.get('registro_vip') === '1') {
        setShowRegistroVipModal(true);
      }
    }
    return () => {
      window.removeEventListener('open-artist-portal-modal', handleOpenModalEvent);
      window.removeEventListener('open-registro-vip-modal', handleOpenRegistroEvent);
    };
  }, []);

  // Triple tap & Long press detection on Logo for /admin
  const tapTimesRef = useRef<number[]>([]);
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const effectiveRole = currentRole || appMode;
  const isAdmin = effectiveRole === 'admin';

  const handleRoleToggle = (newRole: 'admin' | 'cliente' | 'public') => {
    const isNextAdmin = newRole === 'admin';
    onRoleChange?.(newRole);
    setAppMode?.(isNextAdmin ? 'admin' : 'public');
    handleTabSelect(isNextAdmin ? 'panel_admin' : 'cliente');
  };

  const handleTabSelect = (tab: string) => {
    onTabChange?.(tab);
    setActiveTab?.(tab);
  };

  const handleLogoClick = () => {
    const now = Date.now();
    tapTimesRef.current = [...tapTimesRef.current.filter((t) => now - t < 1200), now];

    if (tapTimesRef.current.length >= 3) {
      tapTimesRef.current = [];
      triggerSecretAdmin();
      return;
    }

    if (!isAdmin) {
      handleTabSelect('cliente');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      handleTabSelect('panel_admin');
    }
  };

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
      try {
        navigator.vibrate([60, 40, 60]);
      } catch {
        // ignore
      }
    }
    setSecretFeedback(true);
    setTimeout(() => setSecretFeedback(false), 2000);

    if (onSecretAdminTrigger) {
      onSecretAdminTrigger();
    } else {
      handleRoleToggle('admin');
    }
  };

  const scrollToSection = (sectionId: string) => {
    const needsSwitch = activeTab !== 'cliente';
    if (needsSwitch) handleTabSelect('cliente');
    setTimeout(() => {
      document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
    }, needsSwitch ? 140 : 80);
  };

  return (
    <header className="bg-[#080a12]/85 backdrop-blur-2xl text-white shadow-[0_12px_40px_rgba(0,0,0,0.65)] border-b border-white/10 sticky top-0 z-40">
      {/* BARRA DE ALERTA DISCRETA CUANDO BADLENZ ESTÁ EN MODO ADMIN */}
      {isAdmin && (
        <div className="bg-gradient-to-r from-red-950 via-red-900/90 to-amber-950 px-4 py-1.5 border-b border-red-700/60 text-[11px] font-mono flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-400 animate-ping" />
            <span className="font-bold text-white uppercase tracking-wider">
              Control Room · /admin
            </span>
            {isAdminAuthenticated ? (
              <span className="hidden sm:inline-block bg-emerald-950/80 text-emerald-300 border border-emerald-700/50 px-2 py-0.5 rounded text-[9px] font-bold">
                Firebase Auth Verificado
              </span>
            ) : (
              <span className="hidden sm:inline-block bg-amber-950/80 text-amber-300 border border-amber-700/50 px-2 py-0.5 rounded text-[9px] font-bold">
                Requiere Login
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => handleRoleToggle('cliente')}
              className="text-amber-300 hover:text-white flex items-center gap-1 font-bold underline decoration-amber-500/50 cursor-pointer"
            >
              <Eye className="w-3 h-3" />
              <span>Ver como Artista</span>
            </button>
            {isAdminAuthenticated && onLogoutAdmin && (
              <button
                type="button"
                onClick={onLogoutAdmin}
                className="text-red-300 hover:text-white flex items-center gap-1 font-bold bg-black/40 hover:bg-black/80 px-2 py-0.5 rounded border border-red-800/60 cursor-pointer"
              >
                <LogOut className="w-3 h-3" />
                <span className="hidden sm:inline">Cerrar Sesión</span>
              </button>
            )}
          </div>
        </div>
      )}

      {secretFeedback && (
        <div className="bg-amber-500 text-gray-950 px-3 py-1 text-center text-xs font-black uppercase tracking-widest">
          Acceso Badlenz Detectado · Abriendo Control Room...
        </div>
      )}

      {/* Barra Superior de Identidad */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap justify-between items-center gap-3">
        <div
          className="flex items-center space-x-3 cursor-pointer select-none group relative"
          onClick={handleLogoClick}
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUpOrLeave}
          onPointerLeave={handlePointerUpOrLeave}
          title={isAdmin ? 'Panel Admin' : 'La Facultad Studio | Prod. Badlenz'}
        >
          <div className="flex items-center gap-2.5 transform group-hover:scale-105 transition-transform duration-200">
            <LFCrestLogo size="sm" />
            <div className="hidden lg:block w-px h-6 bg-zinc-800" />
            <div className="hidden lg:block">
              <BadlenzLogo size="sm" />
            </div>
          </div>
          <div>
            <h1 className="font-bold text-base sm:text-lg leading-none uppercase tracking-widest text-white flex items-center gap-1.5 font-syne">
              LA FACULTAD <span className="text-red-500">STUDIO</span>
            </h1>
            <p className="text-[10px] text-gray-400 mt-0.5">
              PROD. BADLENZ · HORMIGUEROS, PR
            </p>
          </div>
        </div>

        {/* INDICADOR DE ESTADO DEL ESTUDIO EN VIVO */}
        <StudioLiveStatusBadge
          isAdmin={isAdmin}
          onGoToBooking={() => scrollToSection('seccion-calendario-booking')}
          onGoToAdmin={() => handleRoleToggle('admin')}
        />

        {/* MODO PÚBLICO */}
        {!isAdmin && (
          <div className="flex items-center gap-2 sm:gap-3">
            <nav className="hidden md:flex items-center gap-1.5 bg-black/40 p-1 rounded-2xl border border-white/10 backdrop-blur-md">
              <button
                type="button"
                onClick={() => scrollToSection('seccion-muestras-ab')}
                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-zinc-300 hover:text-white hover:bg-white/10 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Headphones className="w-3.5 h-3.5 text-amber-400" />
                <span className="font-syne">Sonido A/B</span>
              </button>

              <button
                type="button"
                onClick={() => scrollToSection('tarifas-estudio')}
                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-zinc-300 hover:text-white hover:bg-white/10 transition-all flex items-center gap-1 cursor-pointer"
              >
                <span className="text-amber-400 font-bold">$</span>
                <span className="font-syne">Tarifas</span>
              </button>

              {activeTab === 'creditos' ? (
                <button
                  type="button"
                  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-white bg-red-950/70 border border-red-700/60 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <span className="text-red-400 font-bold">★</span>
                  <span className="font-syne">Créditos</span>
                </button>
              ) : (
                <a
                  href="/creditos"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-zinc-300 hover:text-white hover:bg-white/10 transition-all flex items-center gap-1.5 cursor-pointer"
                  title="Abrir Destacados y Catálogo Completo (84 créditos verificados) en otra ventana"
                >
                  <span className="text-red-400 font-bold">★</span>
                  <span className="font-syne">Créditos</span>
                </a>
              )}

              <button
                type="button"
                onClick={() => scrollToSection('seccion-calendario-booking')}
                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-red-200 bg-red-950/50 hover:bg-red-900/70 border border-red-800/50 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Calendar className="w-3.5 h-3.5 text-red-400" />
                <span className="font-syne font-bold">Reservar</span>
              </button>
            </nav>

            <button
              type="button"
              onClick={() => setShowArtistPortalModal(true)}
              className="taste-btn px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer bg-gradient-to-r from-amber-500/20 via-zinc-900 to-[#12131a] hover:from-amber-500/30 hover:to-zinc-800 text-white border border-amber-500/50 hover:border-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.2)]"
              title="Consultar Pasaporte VIP y acceder a Faculty Projects"
            >
              <User className="w-3.5 h-3.5 text-amber-400" />
              <span className="font-syne font-bold tracking-wide">Portal Artista</span>
            </button>
          </div>
        )}

        {/* MODO ADMIN */}
        {isAdmin && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleRoleToggle('cliente')}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white flex items-center gap-1.5 cursor-pointer"
            >
              <User className="w-3.5 h-3.5 text-amber-400" />
              <span>Vista Pública</span>
            </button>
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-700/90 text-white text-xs font-bold">
              <Lock className="w-3 h-3 text-amber-300" />
              <span>Control Room</span>
            </div>
          </div>
        )}
      </div>

      {/* BARRA MÓVIL PÚBLICA ULTRA-COMPACTA (UI/UX Pro Max: 44px touch targets) */}
      {!isAdmin && (
        <nav
          aria-label="Navegación rápida móvil"
          className="md:hidden border-t border-white/5 bg-[#090b12]/95 px-2 py-2 grid grid-cols-4 gap-1.5 text-[11px] font-medium text-zinc-200"
        >
          <button
            type="button"
            onClick={() => scrollToSection('seccion-muestras-ab')}
            className="min-h-[44px] flex items-center justify-center gap-1 px-1.5 rounded-xl bg-white/5 active:bg-white/10 cursor-pointer"
          >
            <Headphones className="w-3 h-3 text-amber-400 shrink-0" />
            <span className="font-syne">Sonido</span>
          </button>

          <button
            type="button"
            onClick={() => scrollToSection('tarifas-estudio')}
            className="min-h-[44px] flex items-center justify-center gap-1 px-1.5 rounded-xl bg-white/5 active:bg-white/10 cursor-pointer"
          >
            <span className="text-amber-400 font-bold shrink-0">$</span>
            <span className="font-syne">Tarifas</span>
          </button>

          {activeTab === 'creditos' ? (
            <button
              type="button"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="min-h-[44px] flex items-center justify-center gap-1 px-1.5 rounded-xl bg-red-950/70 border border-red-700/60 text-white cursor-pointer"
            >
              <span className="text-red-400 font-bold shrink-0">★</span>
              <span className="font-syne">Créditos</span>
            </button>
          ) : (
            <a
              href="/creditos"
              target="_blank"
              rel="noopener noreferrer"
              className="min-h-[44px] flex items-center justify-center gap-1 px-1.5 rounded-xl bg-white/5 active:bg-white/10 cursor-pointer"
              title="Abrir Destacados y Catálogo Completo en otra ventana"
            >
              <span className="text-red-400 font-bold shrink-0">★</span>
              <span className="font-syne">Créditos</span>
            </a>
          )}

          <button
            type="button"
            onClick={() => scrollToSection('seccion-calendario-booking')}
            className="min-h-[44px] flex items-center justify-center gap-1 px-1.5 rounded-xl bg-red-950/80 border border-red-700/60 text-red-100 font-semibold cursor-pointer shadow"
          >
            <Calendar className="w-3 h-3 text-red-400 shrink-0" />
            <span className="font-syne font-bold">Reservar</span>
          </button>
        </nav>
      )}

      {/* MODAL LIGERO LAZY HACIA PASAPORTE VIP & FACULTY PROJECTS */}
      {showArtistPortalModal && (
        <Suspense fallback={null}>
          <PortalArtistaModal
            isOpen={showArtistPortalModal}
            initialCode={artistPortalInitialCode}
            onClose={() => setShowArtistPortalModal(false)}
          />
        </Suspense>
      )}

      {/* MODAL REGISTRO PRESENCIAL POR QR */}
      {showRegistroVipModal && (
        <Suspense fallback={null}>
          <RegistroVipQrModal
            isOpen={showRegistroVipModal}
            onClose={() => setShowRegistroVipModal(false)}
            onOpenPassport={(codigo) => {
              setArtistPortalInitialCode(codigo);
              setShowArtistPortalModal(true);
            }}
          />
        </Suspense>
      )}
    </header>
  );
};

export default Header;
