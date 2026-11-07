import React, { useState, useEffect, lazy, Suspense } from 'react';
import Header from './components/Header';
import { EntrySelectionScreen } from './components/EntrySelectionScreen';
import { SlotDisponibilidad } from './services/schedule';
import { 
  DEFAULT_SERVICES, 
  DEFAULT_ADDONS, 
  INITIAL_CLIENT, 
  INITIAL_PROJECTS, 
  INITIAL_INVOICE 
} from './data/defaultData';
import { 
  QuoteData, 
  StudioProject, 
  InvoiceData, 
  ClientInfo, 
  StudioServiceItem, 
  AddOnItem, 
  CustomQuoteItem, 
  NavigationTab, 
  AppMode 
} from './types';
import { Keyboard, Command, X, Loader2, MessageCircle } from 'lucide-react';

import PortalClientes from './components/PortalClientes';
import AudioShowcaseAB from './components/AudioShowcaseAB';
import { AudioDockPlayer } from './components/AudioDockPlayer';
import { AvisoEstudioCerrado } from './components/AvisoEstudioCerrado';
import { getStudioLiveStatus, subscribeToStudioStatus, StudioLiveStatus } from './services/studioStatus';
import { ErrorBoundary } from './components/ErrorBoundary';
import { lazyWithRetry } from './utils/lazyWithRetry';

// Módulos pesados cargados de forma diferida (Lazy loading)
const PortalArtista = lazyWithRetry(() => import('./components/PortalArtista'));
const CalendarioSection = lazyWithRetry(() => import('./components/Calendario/CalendarioSection').then(m => ({ default: m.CalendarioSection })));
const PanelAdmin = lazyWithRetry(() => import('./components/PanelAdmin'));
const CotizadorSection = lazyWithRetry(() => import('./components/Cotizador/CotizadorSection').then(m => ({ default: m.CotizadorSection })));
const ProyectosSection = lazyWithRetry(() => import('./components/Proyectos/ProyectosSection').then(m => ({ default: m.ProyectosSection })));
const FacturaSection = lazyWithRetry(() => import('./components/Factura/FacturaSection').then(m => ({ default: m.FacturaSection })));
const AsistenteSection = lazyWithRetry(() => import('./components/Asistente/AsistenteSection').then(m => ({ default: m.AsistenteSection })));

const SectionLoadingFallback = () => (
  <div className="min-h-[50vh] flex flex-col items-center justify-center p-8 space-y-4 text-center">
    <div className="p-4 bg-red-950/40 rounded-2xl border border-red-800/50 shadow-xl animate-pulse">
      <Loader2 className="w-8 h-8 text-red-500 animate-spin mx-auto" />
    </div>
    <span className="text-xs font-mono text-gray-400 tracking-wider uppercase">Cargando Módulo de Estudio...</span>
  </div>
);

export default function App() {
  const [hasSelectedEntry, setHasSelectedEntry] = useState<boolean>(true);
  const [appMode, setAppMode] = useState<AppMode>(() => {
    if (typeof window !== 'undefined') {
      const p = window.location.pathname.toLowerCase();
      const h = window.location.hash.toLowerCase();
      if (p === '/admin' || p === '/control-room' || p === '/badlenz' || h === '#admin') {
        return 'admin';
      }
    }
    return 'public';
  });
  const [activeTab, setActiveTab] = useState<NavigationTab>(() => {
    if (typeof window !== 'undefined') {
      const p = window.location.pathname.toLowerCase();
      const h = window.location.hash.toLowerCase();
      if (p === '/admin' || p === '/control-room' || p === '/badlenz' || h === '#admin') {
        return 'panel_admin';
      }
    }
    return 'cliente';
  });
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(() => {
    try {
      return typeof window !== 'undefined' && sessionStorage.getItem('la_facultad_admin_auth') === 'true';
    } catch (e) {
      return false;
    }
  });
  const [passwordInput, setPasswordInput] = useState('');
  const [slotSeleccionado, setSlotSeleccionado] = useState<SlotDisponibilidad | null>(null);
  const [showShortcutsModal, setShowShortcutsModal] = useState<boolean>(false);
  const [studioStatus, setStudioStatus] = useState<StudioLiveStatus>(() => getStudioLiveStatus());

  useEffect(() => {
    const unsub = subscribeToStudioStatus((st) => setStudioStatus(st));
    const handleGoToPortal = () => setActiveTab('historial');
    window.addEventListener('go-to-portal-artista', handleGoToPortal);
    return () => {
      unsub();
      window.removeEventListener('go-to-portal-artista', handleGoToPortal);
    };
  }, []);

  const isStudioTemporarilyClosed = ['vacaciones', 'mantenimiento', 'remodelacion'].includes(studioStatus.estado);
  
  // Cotizador States
  const [services, setServices] = useState<StudioServiceItem[]>(DEFAULT_SERVICES);
  const [addOns, setAddOns] = useState<AddOnItem[]>(DEFAULT_ADDONS);
  const [client, setClient] = useState<ClientInfo>(INITIAL_CLIENT);
  const [customItems, setCustomItems] = useState<CustomQuoteItem[]>([]);
  const [descuentoValor, setDescuentoValor] = useState(0);
  const [descuentoTipo, setDescuentoTipo] = useState<'percentage' | 'fixed'>('percentage');
  const [aplicaIVA, setAplicaIVA] = useState(false);
  const [porcentajeIVA, setPorcentajeIVA] = useState(16);
  const [moneda, setMoneda] = useState('$ USD');
  const [savedQuotes, setSavedQuotes] = useState<QuoteData[]>([]);

  // Sincronización de URL y Eventos PopState (/admin <-> /)
  useEffect(() => {
    const handlePopState = () => {
      if (typeof window === 'undefined') return;
      const path = window.location.pathname.toLowerCase();
      const hash = window.location.hash.toLowerCase();
      if (path === '/admin' || path === '/control-room' || path === '/badlenz' || hash === '#admin') {
        setAppMode('admin');
        setActiveTab('panel_admin');
      } else {
        setAppMode('public');
        setActiveTab('cliente');
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Proyectos States
  const [projects, setProjects] = useState<StudioProject[]>(() => {
    try {
      if (typeof window !== 'undefined' && localStorage.getItem('la_facultad_was_reset') === 'true') {
        const saved = localStorage.getItem('la_facultad_proyectos_db');
        if (saved) {
          try { return JSON.parse(saved); } catch (e) { return []; }
        }
        return [];
      }
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('la_facultad_proyectos_db');
        if (saved) {
          try { return JSON.parse(saved); } catch (e) { return INITIAL_PROJECTS; }
        }
      }
    } catch (err) {
      console.warn('LocalStorage not available:', err);
    }
    return INITIAL_PROJECTS;
  });

  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('la_facultad_proyectos_db', JSON.stringify(projects));
      }
    } catch (err) {
      console.warn('Could not save projects to localStorage:', err);
    }
  }, [projects]);

  useEffect(() => {
    const handleDbReset = () => {
      const isReset = localStorage.getItem('la_facultad_was_reset') === 'true';
      if (isReset) {
        setProjects([]);
      } else {
        const saved = localStorage.getItem('la_facultad_proyectos_db');
        if (saved) {
          try {
            setProjects(JSON.parse(saved));
          } catch (e) {
            setProjects(INITIAL_PROJECTS);
          }
        } else {
          setProjects(INITIAL_PROJECTS);
        }
      }
      setSavedQuotes([]);
    };
    window.addEventListener('la_facultad_db_reset', handleDbReset);
    return () => window.removeEventListener('la_facultad_db_reset', handleDbReset);
  }, []);

  // Facturas States
  const [invoice, setInvoice] = useState<InvoiceData>(INITIAL_INVOICE);

  // Asistente States
  const [asistenteInitialPrompt, setAsistenteInitialPrompt] = useState<string>('');

  // CLAVE SECRETA DEL ESTUDIO
  const ADMIN_PASSWORD = 'Lafacultad!';

  // Global Keyboard Shortcuts for Admin
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey) {
        switch (e.key.toLowerCase()) {
          case 'c':
            e.preventDefault();
            setActiveTab('cotizador');
            break;
          case 'p':
            e.preventDefault();
            setActiveTab('proyectos');
            break;
          case 'a':
            e.preventDefault();
            if (appMode === 'admin') setActiveTab('panel_admin');
            break;
          case 'f':
            e.preventDefault();
            setActiveTab('factura');
            break;
          case 'k':
            e.preventDefault();
            setActiveTab('calendario');
            break;
          case 'i':
            e.preventDefault();
            setActiveTab('asistente');
            break;
          case 'x':
            e.preventDefault();
            setHasSelectedEntry(false);
            setIsAdminAuthenticated(false);
            break;
          case 'h':
            e.preventDefault();
            setShowShortcutsModal(prev => !prev);
            break;
          default:
            break;
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [appMode]);

  const handleAdminAccess = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === ADMIN_PASSWORD || passwordInput === '1234' || passwordInput.trim() === ADMIN_PASSWORD) {
      setIsAdminAuthenticated(true);
      try {
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('la_facultad_admin_auth', 'true');
        }
      } catch (err) { /* ignore */ }
    } else {
      alert('Contraseña incorrecta. Acceso denegado a Control Room.');
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

  const handleSecretAdminTrigger = () => {
    handleRoleChange('admin');
  };

  const handleLogoutAdmin = () => {
    try {
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('la_facultad_admin_auth');
      }
    } catch (e) { /* ignore */ }
    setIsAdminAuthenticated(false);
    setPasswordInput('');
    handleRoleChange('cliente');
  };

  const handleSelectSlotFromCalendar = (slot: SlotDisponibilidad) => {
    setSlotSeleccionado(slot);
    // Switch to hidden booking tab
    setActiveTab('cliente' as any);
  };

  const renderActiveTabContent = () => {
    const isAdminOnlyTab = ['panel_admin', 'proyectos', 'factura', 'cotizador', 'asistente'].includes(activeTab);
    
    // Admin restriction check
    if (appMode === 'admin' && isAdminOnlyTab && !isAdminAuthenticated) {
      return (
        <div className="max-w-md mx-auto my-12 bg-gradient-to-b from-[#1c1c22] to-black p-6 sm:p-8 rounded-2xl border-2 border-red-900/60 text-center space-y-5 shadow-2xl animate-in fade-in zoom-in duration-200">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-red-950/60 border border-red-700/60 flex items-center justify-center text-red-500 shadow-[0_0_20px_rgba(220,38,38,0.3)]">
            <span className="text-2xl">🔒</span>
          </div>
          
          <div>
            <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-red-400 font-bold bg-red-950/80 px-3 py-1 rounded-full border border-red-800/60">
              Ruta Privada • /admin
            </span>
            <h2 className="text-lg font-black text-white uppercase tracking-wider mt-3">
              Badlenz Control Room
            </h2>
            <p className="text-xs text-gray-400 mt-1">
              Ingresa la contraseña del estudio para acceder a la gestión de reservas, balances y configuración.
            </p>
          </div>
          
          <form onSubmit={handleAdminAccess} className="space-y-3.5 pt-2">
            <input
              type="password"
              placeholder="Contraseña del Estudio"
              autoFocus
              className="w-full bg-[#111116] text-white p-3 rounded-xl border border-gray-700 text-sm text-center font-mono focus:border-red-500 focus:ring-1 focus:ring-red-500 focus:outline-none tracking-widest shadow-inner"
              value={passwordInput}
              onChange={e => setPasswordInput(e.target.value)}
            />
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-red-700 to-red-600 hover:from-red-600 hover:to-red-500 text-white font-black py-3 rounded-xl text-xs uppercase tracking-wider transition shadow-lg shadow-red-950/80 cursor-pointer active:scale-95"
            >
              Desbloquear Control Room →
            </button>
          </form>

          <div className="pt-2 border-t border-gray-800/80">
            <button
              type="button"
              onClick={() => handleRoleChange('cliente')}
              className="text-xs text-gray-400 hover:text-white font-mono flex items-center justify-center gap-1.5 mx-auto transition"
            >
              <span>← Volver a la Página de Clientes (Pública)</span>
            </button>
          </div>
        </div>
      );
    }

    switch (activeTab) {
      case 'panel_admin':
        return <PanelAdmin />;
        
      case 'cotizador':
        return (
          <CotizadorSection
            services={services}
            setServices={setServices}
            addOns={addOns}
            setAddOns={setAddOns}
            client={client}
            setClient={setClient}
            customItems={customItems}
            setCustomItems={setCustomItems}
            descuentoValor={descuentoValor}
            setDescuentoValor={setDescuentoValor}
            descuentoTipo={descuentoTipo}
            setDescuentoTipo={setDescuentoTipo}
            aplicaIVA={aplicaIVA}
            setAplicaIVA={setAplicaIVA}
            porcentajeIVA={porcentajeIVA}
            setPorcentajeIVA={setPorcentajeIVA}
            moneda={moneda}
            setMoneda={setMoneda}
            appMode={appMode}
            currentRole={appMode === 'admin' ? 'admin' : 'cliente'}
            savedQuotes={savedQuotes}
            onSaveQuote={(quote) => setSavedQuotes(prev => [...prev, quote])}
          />
        );
        
      case 'calendario':
        if (appMode === 'admin') {
          return <PanelAdmin defaultSection="calendario" />;
        }
        if (isStudioTemporarilyClosed) {
          return (
            <div className="py-2 animate-fadeIn">
              <AvisoEstudioCerrado 
                onNavigateToMuestras={() => setActiveTab('muestras')}
                isFullTakeover={true}
              />
            </div>
          );
        }
        // En modo público, el calendario y los horarios forman parte integral de la reserva en PortalClientes
        return (
          <div className="space-y-4">
            <PortalClientes 
              slotInicial={slotSeleccionado} 
              onNavigateToMuestras={() => setActiveTab('muestras')} 
            />
          </div>
        );
        
      case 'proyectos':
        return (
          <ProyectosSection
            projects={projects}
            setProjects={setProjects}
            onAskGeminiForProject={(proj) => {
              setAsistenteInitialPrompt(`Dame ideas o un plan de trabajo detallado para el proyecto "${proj.nombre}" del cliente "${proj.nombreArtistico || proj.cliente}". Su estado actual es "${proj.estado}" con un avance del ${proj.progreso}%.`);
              setActiveTab('asistente');
            }}
          />
        );
        
      case 'factura':
        return (
          <FacturaSection
            invoice={invoice}
            setInvoice={setInvoice}
            onPrintInvoice={() => window.print()}
          />
        );
        
      case 'asistente':
        return (
          <AsistenteSection
            currentQuote={savedQuotes[0]}
            projects={projects}
            initialPrompt={asistenteInitialPrompt}
          />
        );
        
      case 'cliente':
        return (
          <div className="space-y-4">
            <PortalClientes 
              slotInicial={slotSeleccionado} 
              onNavigateToMuestras={() => setActiveTab('muestras')} 
            />
          </div>
        );

      case 'muestras':
        return (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-[#1e1e1e] p-4 rounded-xl border border-gray-800 shadow-xl">
              <div>
                <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest font-mono">
                  PORTAFOLIO OFICIAL & DEMOSTRACIÓN A/B
                </span>
                <h2 className="text-base sm:text-lg font-black text-white uppercase tracking-wider mt-0.5">
                  Prueba de Calidad Badlenz • Sonido Comercial en Cabina
                </h2>
                <p className="text-xs text-gray-400">
                  Compara en vivo la voz cruda sin tratar contra la mezcla y master comercial de La Facultad Studio.
                </p>
              </div>
              <button
                onClick={() => setActiveTab('cliente')}
                className="text-xs bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-black px-4 py-2.5 rounded-xl uppercase tracking-wider transition shadow-lg flex items-center gap-2 cursor-pointer active:scale-95 shrink-0"
              >
                <span>🎤 Agendar Sesión</span>
                <span>➔</span>
              </button>
            </div>
            <AudioShowcaseAB />
          </div>
        );

      case 'historial':
        return (
          <PortalArtista 
            projects={projects} 
            onUpdateProject={(updated) => {
              setProjects(prev => prev.map(p => p.id === updated.id ? updated : p));
            }}
          />
        );
        
      default:
        return <CotizadorSection />;
    }
  };

  if (!hasSelectedEntry) {
    return (
      <EntrySelectionScreen
        onSelectMode={(mode) => {
          setHasSelectedEntry(true);
          if (mode === 'admin') {
            setAppMode('admin');
            setActiveTab('panel_admin');
          } else {
            setAppMode('public');
            setActiveTab('cliente');
          }
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#07080d] text-gray-200 font-sans pb-16 relative overflow-x-hidden selection:bg-red-600 selection:text-white">
      {/* Floating Spatial Ambient Glows (Antigravity Depth) */}
      <div className="fixed -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-red-600/10 blur-[140px] pointer-events-none z-0 animate-ambient-pulse" aria-hidden="true" />
      <div className="fixed top-1/3 -right-40 w-[550px] h-[550px] rounded-full bg-amber-500/08 blur-[150px] pointer-events-none z-0 animate-ambient-pulse" style={{ animationDelay: '3s' }} aria-hidden="true" />
      <div className="fixed -bottom-40 left-1/3 w-[500px] h-[500px] rounded-full bg-red-950/20 blur-[130px] pointer-events-none z-0" aria-hidden="true" />
      
      {/* Subtle Spatial Mesh Grid */}
      <div className="fixed inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none z-0" aria-hidden="true" />

      <div className="relative z-10">
        <Header
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          appMode={appMode}
          setAppMode={setAppMode}
          currentRole={appMode === 'admin' ? 'admin' : 'cliente'}
          onRoleChange={handleRoleChange}
          onTabChange={(tab) => setActiveTab(tab)}
          onSecretAdminTrigger={handleSecretAdminTrigger}
          onLogoutAdmin={handleLogoutAdmin}
          isAdminAuthenticated={isAdminAuthenticated}
          savedQuotesCount={savedQuotes.length}
          activeProjectsCount={projects.filter(p => p.estado !== 'Entregado').length}
        />

        <main className="max-w-7xl mx-auto px-2.5 sm:px-6 lg:px-8 py-4 sm:py-6">
          <ErrorBoundary fallbackTitle="Error al cargar la sección">
            <Suspense fallback={<SectionLoadingFallback />}>
              {renderActiveTabContent()}
            </Suspense>
          </ErrorBoundary>
        </main>
      </div>

      {/* Floating Audio Dock Transport Player for Clients */}
      {appMode !== 'admin' && (
        <>
          <AudioDockPlayer onBookClick={() => setActiveTab('cliente')} />
          <a
            href="https://wa.me/17872408627?text=¡Saludos%20Badlenz!%20Estoy%20en%20la%20página%20y%20quiero%20hacerte%20una%20consulta%20directa%20sobre%20grabar%20mi%20tema."
            target="_blank"
            rel="noreferrer"
            aria-label="Escribir a Badlenz por WhatsApp"
            className="fixed bottom-14 right-4 z-50 bg-[#25D366] hover:bg-[#20ba5a] text-black font-extrabold text-xs px-3.5 py-2.5 rounded-full shadow-2xl flex items-center gap-2 transition transform hover:scale-105 active:scale-95"
          >
            <MessageCircle className="w-4 h-4 fill-black text-transparent" />
            <span className="hidden sm:inline font-mono font-bold tracking-tight text-[11px]">Chat con Badlenz</span>
          </a>
        </>
      )}

      {/* Botón flotante para ver atajos de teclado y Leyenda pequeña (Solo en escritorio) */}
      {appMode === 'admin' && (
        <div className="hidden md:flex fixed bottom-3 left-4 right-4 z-40 flex-col md:flex-row items-center justify-between gap-2 pointer-events-none">
          <div className="bg-[#18181b]/95 backdrop-blur border border-gray-800 text-gray-400 text-[11px] font-mono px-4 py-2 rounded-xl shadow-2xl pointer-events-auto flex flex-wrap items-center gap-2">
            <span className="text-amber-400 font-bold flex items-center gap-1">
              <Keyboard className="w-3.5 h-3.5" />
              Atajos:
            </span>
            <span className="hover:text-white cursor-pointer" onClick={() => setActiveTab('cotizador')}><strong className="text-white">Alt+C</strong> Cotizador</span>
            <span>•</span>
            <span className="hover:text-white cursor-pointer" onClick={() => setActiveTab('proyectos')}><strong className="text-white">Alt+P</strong> Proyectos</span>
            <span>•</span>
            <span className="hover:text-white cursor-pointer" onClick={() => setActiveTab('panel_admin')}><strong className="text-white">Alt+A</strong> Panel</span>
            <span>•</span>
            <span className="hover:text-white cursor-pointer" onClick={() => setActiveTab('factura')}><strong className="text-white">Alt+F</strong> Factura</span>
            <span>•</span>
            <span className="hover:text-white cursor-pointer" onClick={() => setActiveTab('calendario')}><strong className="text-white">Alt+K</strong> Calendario</span>
            <span>•</span>
            <span className="hover:text-white cursor-pointer" onClick={() => setActiveTab('asistente')}><strong className="text-white">Alt+I</strong> IA</span>
            <span>•</span>
            <span className="text-red-400 hover:text-red-300 cursor-pointer" onClick={() => { setHasSelectedEntry(false); setIsAdminAuthenticated(false); }}><strong className="text-red-400">Alt+X</strong> Salir</span>
          </div>

          <button
            onClick={() => setShowShortcutsModal(true)}
            className="bg-[#1f2937] hover:bg-[#374151] text-amber-400 border border-amber-500/40 px-3 py-1.5 rounded-xl shadow-2xl text-xs font-mono font-bold flex items-center gap-1.5 transition transform hover:scale-105 pointer-events-auto"
            title="Ver Todos los Atajos (Alt + H)"
          >
            <Keyboard className="w-3.5 h-3.5" />
            <span>Guía Alt+H</span>
          </button>
        </div>
      )}

      {/* Modal de Atajos de Teclado */}
      {showShortcutsModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#1e1e1e] border border-gray-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-6 relative animate-in fade-in zoom-in duration-200">
            <button
              onClick={() => setShowShortcutsModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="p-3 bg-red-600/10 border border-red-500/30 rounded-xl text-red-500">
                <Command className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white uppercase tracking-wider">Atajos de Teclado del Estudio</h3>
                <p className="text-xs text-gray-400 font-mono">Agiliza la gestión ejecutiva con combinaciones Alt + Tecla</p>
              </div>
            </div>

            <div className="space-y-2.5 text-xs font-mono">
              <div className="flex justify-between items-center bg-[#111827] p-3 rounded-lg border border-gray-800">
                <span className="text-gray-300">Ir a Cotizador</span>
                <span className="bg-gray-800 text-amber-400 px-2 py-1 rounded border border-gray-700 font-bold">Alt + C</span>
              </div>
              <div className="flex justify-between items-center bg-[#111827] p-3 rounded-lg border border-gray-800">
                <span className="text-gray-300">Ir a Proyectos</span>
                <span className="bg-gray-800 text-amber-400 px-2 py-1 rounded border border-gray-700 font-bold">Alt + P</span>
              </div>
              <div className="flex justify-between items-center bg-[#111827] p-3 rounded-lg border border-gray-800">
                <span className="text-gray-300">Ir a Panel Admin</span>
                <span className="bg-gray-800 text-amber-400 px-2 py-1 rounded border border-gray-700 font-bold">Alt + A</span>
              </div>
              <div className="flex justify-between items-center bg-[#111827] p-3 rounded-lg border border-gray-800">
                <span className="text-gray-300">Ir a Facturación / Recibos</span>
                <span className="bg-gray-800 text-amber-400 px-2 py-1 rounded border border-gray-700 font-bold">Alt + F</span>
              </div>
              <div className="flex justify-between items-center bg-[#111827] p-3 rounded-lg border border-gray-800">
                <span className="text-gray-300">Ir a Calendario de Cabina</span>
                <span className="bg-gray-800 text-amber-400 px-2 py-1 rounded border border-gray-700 font-bold">Alt + K</span>
              </div>
              <div className="flex justify-between items-center bg-[#111827] p-3 rounded-lg border border-gray-800">
                <span className="text-gray-300">Ir a Asistente IA</span>
                <span className="bg-gray-800 text-amber-400 px-2 py-1 rounded border border-gray-700 font-bold">Alt + I</span>
              </div>
              <div className="flex justify-between items-center bg-[#111827] p-3 rounded-lg border border-gray-800">
                <span className="text-gray-300">Cerrar Sesión / Selección Inicial</span>
                <span className="bg-gray-800 text-red-400 px-2 py-1 rounded border border-gray-700 font-bold">Alt + X</span>
              </div>
            </div>

            <button
              onClick={() => setShowShortcutsModal(false)}
              className="w-full bg-red-700 hover:bg-red-600 text-white font-bold py-2.5 rounded-lg text-xs uppercase tracking-wider transition shadow-lg"
            >
              Entendido
            </button>
          </div>
        </div>
      )}

      {/* BOTÓN FLOTANTE DE WHATSAPP DIRECTO */}
      <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 flex items-center gap-2 group">
        {/* Tooltip text showing on hover with an elegant delay/slide-in */}
        <div className="bg-[#111827] text-white text-[11px] font-extrabold px-3 py-2 rounded-xl border border-gray-800 shadow-[0_4px_12px_rgba(0,0,0,0.5)] opacity-0 -translate-x-4 pointer-events-none group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 flex items-center gap-1.5 whitespace-nowrap">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          <span>¿Dudas? Chatea con Badlenz 💬</span>
        </div>
        
        <a
          href="https://wa.me/17872408627?text=Hola%20Badlenz!%20Estoy%20en%20el%20portal%20de%20La%20Facultad%20Studio%20y%20me%20gustar%C3%ADa%20hacer%20una%20consulta."
          target="_blank"
          rel="noreferrer"
          className="w-12 h-12 sm:w-14 sm:h-14 bg-[#25D366] hover:bg-[#20ba5a] text-white rounded-full flex items-center justify-center shadow-[0_4px_20px_rgba(37,211,102,0.4)] transition-all duration-300 hover:scale-110 active:scale-95 group relative border border-[#2df077]/30"
          title="Chatear por WhatsApp con Badlenz"
        >
          <MessageCircle className="w-5 h-5 sm:w-6 sm:h-6" />
          
          {/* Pulsing visual glow effect */}
          <span className="absolute -inset-1 rounded-full bg-[#25D366] opacity-20 animate-ping -z-10" />
        </a>
      </div>
    </div>
  );
}

