import React, { useState, useEffect, Suspense } from 'react';
import Header from './components/Header';
import { SlotDisponibilidad } from './services/schedule';
import { NavigationTab, AppMode } from './types';
import { Loader2, MessageCircle, Lock, Mail, AlertCircle, ArrowLeft } from 'lucide-react';
import { signInWithEmailAndPassword, onAuthStateChanged, signOut, User as FirebaseUser } from 'firebase/auth';
import { auth } from './firebase';

import { AudioDockPlayer } from './components/AudioDockPlayer';
import { ErrorBoundary } from './components/ErrorBoundary';
import { lazyWithRetry } from './utils/lazyWithRetry';
import { BadlenzBackgroundBackdrop } from './components/BadlenzBackgroundBackdrop';

// Módulos pesados cargados de forma diferida (solo cuando se necesitan)
const PortalClientes = lazyWithRetry(() => import('./components/PortalClientes'));
const PanelAdmin = lazyWithRetry(() => import('./components/PanelAdmin'));
const AudioShowcaseAB = lazyWithRetry(() => import('./components/AudioShowcaseAB'));
const CreditsBentoGrid = lazyWithRetry(() => import('./components/CreditsBentoGrid'));

const SectionLoadingFallback = () => (
  <div className="min-h-[40vh] flex flex-col items-center justify-center p-8 space-y-4 text-center">
    <div className="p-4 bg-red-950/40 rounded-2xl border border-red-800/50 shadow-xl animate-pulse">
      <Loader2 className="w-7 h-7 text-red-500 animate-spin mx-auto" />
    </div>
    <span className="text-xs font-mono text-gray-400 tracking-wider uppercase">
      Cargando Módulo del Estudio...
    </span>
  </div>
);

const isAdminRoute = () => {
  if (typeof window === 'undefined') return false;
  const p = window.location.pathname.toLowerCase();
  const h = window.location.hash.toLowerCase();
  return p === '/admin' || p === '/control-room' || p === '/badlenz' || h === '#admin';
};

const isCreditsRoute = () => {
  if (typeof window === 'undefined') return false;
  const p = window.location.pathname.toLowerCase();
  return p === '/creditos' || p === '/credits';
};

export default function App() {
  const [appMode, setAppMode] = useState<AppMode>(() => (isAdminRoute() ? 'admin' : 'public'));
  const [activeTab, setActiveTab] = useState<NavigationTab>(() =>
    isAdminRoute() ? 'panel_admin' : isCreditsRoute() ? 'creditos' : 'cliente'
  );
  const [adminUser, setAdminUser] = useState<FirebaseUser | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [emailInput, setEmailInput] = useState('ellentemalo@gmail.com');
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [slotSeleccionado] = useState<SlotDisponibilidad | null>(null);

  // Escuchar sesión real de Firebase Auth
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setAdminUser(user);
      setAuthLoading(false);
    });
    return () => unsub();
  }, []);

  // Sincronización de URL (/admin <-> /creditos <-> /)
  useEffect(() => {
    const handlePopState = () => {
      if (isAdminRoute()) {
        setAppMode('admin');
        setActiveTab('panel_admin');
      } else if (isCreditsRoute()) {
        setAppMode('public');
        setActiveTab('creditos');
      } else {
        setAppMode('public');
        setActiveTab('cliente');
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    if (!emailInput.trim() || !passwordInput) {
      setAuthError('Ingresa tu correo y contraseña de administrador.');
      return;
    }

    setIsSigningIn(true);
    try {
      await signInWithEmailAndPassword(auth, emailInput.trim(), passwordInput);
      setPasswordInput('');
    } catch (err: any) {
      const code = err?.code || '';
      if (
        code === 'auth/invalid-credential' ||
        code === 'auth/wrong-password' ||
        code === 'auth/user-not-found'
      ) {
        setAuthError('Credenciales incorrectas. Verifica tu correo y contraseña en Firebase Auth.');
      } else if (code === 'auth/too-many-requests') {
        setAuthError('Demasiados intentos. Espera un momento antes de volver a intentar.');
      } else {
        setAuthError('No se pudo iniciar sesión. Verifica que Email/Password esté activo en Firebase Auth.');
      }
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleRoleChange = (role: 'admin' | 'cliente' | 'public') => {
    const isNextAdmin = role === 'admin';
    setAppMode(isNextAdmin ? 'admin' : 'public');
    setActiveTab(isNextAdmin ? 'panel_admin' : 'cliente');
    if (typeof window !== 'undefined' && window.history) {
      window.history.pushState(null, '', isNextAdmin ? '/admin' : '/');
    }
  };

  const handleLogoutAdmin = async () => {
    try {
      await signOut(auth);
    } catch {
      // ignore
    }
    setPasswordInput('');
    handleRoleChange('cliente');
  };

  const handleTabChange = (tab: NavigationTab) => {
    setActiveTab(tab);
    if (typeof window !== 'undefined' && window.history && appMode !== 'admin') {
      const targetPath = tab === 'creditos' ? '/creditos' : '/';
      if (window.location.pathname !== targetPath) {
        window.history.pushState(null, '', targetPath);
      }
    }
  };

  const navigateToBooking = () => {
    setAppMode('public');
    handleTabChange('cliente');
    setTimeout(() => {
      document
        .getElementById('seccion-calendario-booking')
        ?.scrollIntoView({ behavior: 'smooth' });
    }, 120);
  };

  const isAdminAuthenticated = Boolean(adminUser);

  const renderActiveContent = () => {
    if (appMode === 'admin') {
      if (authLoading) {
        return <SectionLoadingFallback />;
      }

      if (!isAdminAuthenticated) {
        return (
          <div className="max-w-md mx-auto my-12 bg-gradient-to-b from-[#161822] to-[#0a0b10] p-6 sm:p-8 rounded-3xl border border-red-900/50 text-center space-y-5 shadow-2xl">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-red-950/60 border border-red-700/60 flex items-center justify-center text-red-400 shadow-[0_0_20px_rgba(220,38,38,0.3)]">
              <Lock className="w-6 h-6" />
            </div>

            <div>
              <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-red-400 font-bold bg-red-950/80 px-3 py-1 rounded-full border border-red-800/60">
                Ruta Privada · Firebase Auth
              </span>
              <h2 className="text-lg font-syne font-extrabold text-white uppercase tracking-wider mt-3">
                Badlenz Control Room
              </h2>
              <p className="text-xs text-zinc-400 mt-1">
                Inicia sesión con tu cuenta de administrador para gestionar reservas, bloqueos de calendario y estado del estudio.
              </p>
            </div>

            <form onSubmit={handleAdminLogin} className="space-y-3.5 pt-1 text-left">
              <div>
                <label className="block text-[11px] font-mono text-zinc-400 mb-1">
                  Correo Admin
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="ellentemalo@gmail.com"
                    className="w-full bg-[#0f111a] text-white pl-10 pr-3 py-3 rounded-xl border border-zinc-700 text-sm focus:border-red-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-mono text-zinc-400 mb-1">
                  Contraseña
                </label>
                <input
                  type="password"
                  required
                  autoFocus
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-[#0f111a] text-white px-4 py-3 rounded-xl border border-zinc-700 text-sm font-mono focus:border-red-500 focus:outline-none"
                />
              </div>

              {authError && (
                <div className="flex items-start gap-2 text-xs text-red-300 bg-red-950/60 border border-red-800/60 p-3 rounded-xl">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
                  <span>{authError}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isSigningIn}
                className="w-full bg-gradient-to-r from-red-700 to-red-600 hover:from-red-600 hover:to-red-500 disabled:opacity-60 text-white font-syne font-bold py-3 rounded-xl text-xs uppercase tracking-wider transition shadow-lg shadow-red-950/80 cursor-pointer flex items-center justify-center gap-2"
              >
                {isSigningIn ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Verificando...</span>
                  </>
                ) : (
                  <span>Desbloquear Control Room →</span>
                )}
              </button>
            </form>

            <div className="pt-2 border-t border-zinc-800/80">
              <button
                type="button"
                onClick={() => handleRoleChange('cliente')}
                className="text-xs text-zinc-400 hover:text-white font-mono cursor-pointer transition"
              >
                ← Volver a la Página Pública
              </button>
            </div>
          </div>
        );
      }

      return <PanelAdmin />;
    }

    if (activeTab === 'creditos') {
      return (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-[#10121b]/90 border border-white/10 px-4 py-3 shadow-xl">
            <button
              type="button"
              onClick={() => {
                handleTabChange('cliente');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="inline-flex items-center gap-2 text-xs font-mono font-bold text-zinc-300 hover:text-white transition cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 text-amber-400" />
              <span>Volver a La Facultad Studio</span>
            </button>

            <button
              type="button"
              onClick={navigateToBooking}
              className="text-xs bg-gradient-to-r from-red-600 to-amber-500 hover:from-red-500 hover:to-amber-400 text-white font-syne font-bold px-4 py-2 rounded-xl uppercase tracking-wider transition shadow-lg cursor-pointer shrink-0"
            >
              Apartar Sesión ($130 USD) →
            </button>
          </div>
          <CreditsBentoGrid onBookSession={navigateToBooking} />
        </div>
      );
    }

    if (activeTab === 'muestras') {
      return (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-[#141620] p-4 rounded-2xl border border-zinc-800 shadow-xl">
            <div>
              <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest font-mono">
                DEMOSTRACIÓN A/B EN VIVO
              </span>
              <h2 className="text-base sm:text-lg font-syne font-extrabold text-white uppercase tracking-wider mt-0.5">
                Prueba de Calidad Badlenz · Sonido Comercial
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab('cliente')}
              className="text-xs bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-bold px-4 py-2.5 rounded-xl uppercase tracking-wider transition shadow-lg cursor-pointer shrink-0"
            >
              Agendar Sesión →
            </button>
          </div>
          <AudioShowcaseAB />
        </div>
      );
    }

    return (
      <PortalClientes
        slotInicial={slotSeleccionado}
        onNavigateToMuestras={() => setActiveTab('muestras')}
      />
    );
  };

  return (
    <div className="min-h-screen bg-[#07080d] text-gray-200 font-sans pb-24 relative overflow-x-hidden selection:bg-red-600 selection:text-white">
      {/* Subtle Spatial Mesh Grid */}
      <div
        className="fixed inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none z-0"
        aria-hidden="true"
      />

      <BadlenzBackgroundBackdrop />

      <div className="relative z-10">
        <Header
          activeTab={activeTab}
          setActiveTab={handleTabChange}
          appMode={appMode}
          setAppMode={setAppMode}
          currentRole={appMode === 'admin' ? 'admin' : 'cliente'}
          onRoleChange={handleRoleChange}
          onTabChange={(tab) => handleTabChange(tab)}
          onSecretAdminTrigger={() => handleRoleChange('admin')}
          onLogoutAdmin={handleLogoutAdmin}
          isAdminAuthenticated={isAdminAuthenticated}
        />

        <main className="max-w-7xl mx-auto px-2.5 sm:px-6 lg:px-8 py-4 sm:py-6">
          <ErrorBoundary fallbackTitle="Error al cargar la sección">
            <Suspense fallback={<SectionLoadingFallback />}>
              {renderActiveContent()}
            </Suspense>
          </ErrorBoundary>
        </main>
      </div>

      {/* Audio Dock + Botón Único Limpio de WhatsApp (solo en vista pública) */}
      {appMode !== 'admin' && (
        <>
          <AudioDockPlayer
            onBookClick={navigateToBooking}
          />

          <a
            href="https://wa.me/17872408627?text=%C2%A1Saludos%20Badlenz!%20Estoy%20en%20the-facultypr.vercel.app%20y%20quiero%20consultar%20para%20reservar%20mi%20sesi%C3%B3n."
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Chatear con Badlenz por WhatsApp"
            className="fixed bottom-20 right-4 z-50 bg-[#25D366] hover:bg-[#20ba5a] text-black font-extrabold text-xs px-3.5 py-2.5 rounded-full shadow-[0_6px_24px_rgba(37,211,102,0.45)] flex items-center gap-2 transition transform hover:scale-105 active:scale-95"
          >
            <MessageCircle className="w-4 h-4 fill-black text-transparent" />
            <span className="hidden sm:inline font-mono font-bold tracking-tight text-[11px]">
              Chat con Badlenz
            </span>
          </a>
        </>
      )}
    </div>
  );
}
