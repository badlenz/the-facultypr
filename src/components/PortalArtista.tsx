import React, { useState, useEffect } from 'react';
import { 
  getArtistSessionUrl, 
  ARTIST_DEMO_SESSION_URL, 
  BADLENZ_WHATSAPP_STATUS_URL 
} from '../config/portalConfig';
import { getClientes, getReservas, actualizarReserva, Cliente, Reserva, getSongFeedbacks, guardarSongFeedback } from '../services/db';
import { StudioProject } from '../types';
import { SecureMasterAudioPlayer } from './SecureMasterAudioPlayer';
import { 
  registerUser, 
  loginUser, 
  loginWithGoogle, 
  logoutUser, 
  UserProfile, 
  getRecibosPorEmail, 
  getArchivosPorEmail, 
  saveArchivoSesion, 
  saveRecibo,
  Recibo,
  ArchivoSesion,
  auth
} from '../services/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { 
  Search, 
  Music, 
  Calendar, 
  Clock, 
  CreditCard, 
  CheckCircle, 
  AlertCircle, 
  ExternalLink,
  DollarSign,
  ChevronRight,
  FileText,
  User,
  Activity,
  Layers,
  Award,
  Flame,
  Check,
  Plus,
  Trash2,
  MessageSquare,
  Send,
  HelpCircle,
  Wrench,
  Lock,
  LogOut,
  Folder,
  FileSpreadsheet,
  Download,
  HardDrive,
  Star,
  Timer,
  RotateCcw,
  Camera,
  ShieldAlert,
  Smartphone
} from 'lucide-react';
import { BovedaVipDelivery } from './BovedaVipDelivery';

interface PortalArtistaProps {
  projects: StudioProject[];
  onUpdateProject?: (project: StudioProject) => void;
}

export const PortalArtista: React.FC<PortalArtistaProps> = ({ projects, onUpdateProject }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [foundCliente, setFoundCliente] = useState<Cliente | null>(null);
  const [foundReservas, setFoundReservas] = useState<Reserva[]>([]);
  const [foundProjects, setFoundProjects] = useState<StudioProject[]>([]);
  const [errorMsg, setErrorMsg] = useState('');

  // Firebase Auth & User Profile State
  const [currentUser, setCurrentUser] = useState<UserProfile | null>({
    uid: 'CLI-8820',
    email: 'ellentemalo@gmail.com',
    displayName: 'BADLENZ / El King',
    nombreArtistico: 'BADLENZ',
    role: 'artist',
    createdAt: new Date().toISOString()
  });
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authEmail, setAuthEmail] = useState('');
  const [authPass, setAuthPass] = useState('');
  const [authName, setAuthName] = useState('');
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');

  // Direct access for quick phone/code lookup without login
  const [quickSearchInput, setQuickSearchInput] = useState('');

  // Drive Files & Receipts State
  const [userRecibos, setUserRecibos] = useState<Recibo[]>([]);
  const [userArchivos, setUserArchivos] = useState<ArchivoSesion[]>([]);
  const [syncingSheets, setSyncingSheets] = useState(false);
  const [sheetsMessage, setSheetsMessage] = useState('');

  // Drive Files Modal / Form State
  const [showAddFileModal, setShowAddFileModal] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [newFileType, setNewFileType] = useState<'Mezcla' | 'Master' | 'Stems' | 'Proyecto' | 'Recibo'>('Mezcla');
  const [newFileUrl, setNewFileUrl] = useState('');

  // Feedback States
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [fbTimestamp, setFbTimestamp] = useState('');
  const [fbComment, setFbComment] = useState('');
  const [fbError, setFbError] = useState<string | null>(null);
  const [currentPlayingSeconds, setCurrentPlayingSeconds] = useState<number>(0);

  // Estados de Operaciones: Reagendamiento (Regla 48h) y Subida de Comprobante ATH
  const [reservaParaReagendar, setReservaParaReagendar] = useState<Reserva | null>(null);
  const [nuevaFechaReagendar, setNuevaFechaReagendar] = useState('');
  const [nuevoHorarioReagendar, setNuevoHorarioReagendar] = useState('13:00 - 17:00');
  const [reservaParaComprobante, setReservaParaComprobante] = useState<Reserva | null>(null);
  const [projectParaLiquidar, setProjectParaLiquidar] = useState<StudioProject | null>(null);
  const [athComprobanteFile, setAthComprobanteFile] = useState<string | null>(null);
  const [athComprobanteNombre, setAthComprobanteNombre] = useState('');
  const [athNumRef, setAthNumRef] = useState('');

  // Subscribe to Auth State Changes
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const email = user.email || '';
        const profile: UserProfile = {
          uid: user.uid,
          email,
          displayName: user.displayName || email.split('@')[0],
          nombreArtistico: user.displayName || email.split('@')[0],
          role: 'artist',
          createdAt: new Date().toISOString()
        };
        setCurrentUser(profile);
        
        // Auto load client data for logged in user email
        handleSearch(email);
        loadUserData(email);
      } else {
        setCurrentUser(null);
      }
    });
    return () => unsub();
  }, []);

  const loadUserData = async (email: string) => {
    const recibos = await getRecibosPorEmail(email);
    const archivos = await getArchivosPorEmail(email);
    setUserRecibos(recibos);
    
    // Default fallback demo drive files if none saved yet
    if (archivos.length === 0) {
      const defaultArchivos: ArchivoSesion[] = [
        {
          id: 'DRV-101',
          clienteEmail: email.toLowerCase(),
          nombreArtistico: email.split('@')[0].toUpperCase(),
          nombreArchivo: 'Proyecto_Sesion_Voces_WAV.zip',
          tipo: 'Stems',
          driveUrl: 'https://drive.google.com/',
          fechaSubida: '2026-08-10',
          tamano: '210 MB'
        },
        {
          id: 'DRV-102',
          clienteEmail: email.toLowerCase(),
          nombreArtistico: email.split('@')[0].toUpperCase(),
          nombreArchivo: 'Mezcla_Revision_1_MP3.mp3',
          tipo: 'Mezcla',
          driveUrl: 'https://drive.google.com/',
          fechaSubida: '2026-08-11',
          tamano: '12 MB'
        }
      ];
      setUserArchivos(defaultArchivos);
    } else {
      setUserArchivos(archivos);
    }
  };

  // Auth Submit Handler
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');

    try {
      if (authMode === 'register') {
        if (!authEmail || !authPass || !authName) {
          setAuthError('Por favor completa todos los campos.');
          return;
        }
        const profile = await registerUser(authEmail, authPass, authName, authName);
        setCurrentUser(profile);
        setAuthSuccess('¡Cuenta de Artista creada con éxito en Firebase!');
        loadUserData(authEmail);
      } else {
        if (!authEmail || !authPass) {
          setAuthError('Por favor ingresa tu correo y contraseña.');
          return;
        }
        const profile = await loginUser(authEmail, authPass);
        setCurrentUser(profile);
        setAuthSuccess('¡Inicio de sesión exitoso!');
        loadUserData(authEmail);
      }
    } catch (err: any) {
      console.error(err);
      setAuthError(err.message || 'Error al autenticar en Firebase.');
    }
  };

  const handleGoogleAuth = async () => {
    try {
      setAuthError('');
      const profile = await loginWithGoogle();
      setCurrentUser(profile);
      setAuthSuccess('¡Inicio de sesión con Google exitoso!');
      if (profile.email) {
        handleSearch(profile.email);
        loadUserData(profile.email);
      }
    } catch (err: any) {
      console.error(err);
      setAuthError(err.message || 'Error al iniciar sesión con Google.');
    }
  };

  // Add Google Drive File
  const handleAddDriveFile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFileName || !currentUser?.email) return;

    const archivo: ArchivoSesion = {
      id: `DRV-${Date.now().toString().slice(-6)}`,
      clienteEmail: currentUser.email.toLowerCase(),
      nombreArtistico: currentUser.nombreArtistico || currentUser.displayName,
      nombreArchivo: newFileName,
      tipo: newFileType,
      driveUrl: newFileUrl || 'https://drive.google.com/',
      fechaSubida: new Date().toISOString().split('T')[0],
      tamano: '35 MB'
    };

    await saveArchivoSesion(archivo);
    setUserArchivos(prev => [archivo, ...prev]);
    setShowAddFileModal(false);
    setNewFileName('');
    setNewFileUrl('');
  };

  // Google Sheets Export Function
  const handleSyncGoogleSheets = async () => {
    setSyncingSheets(true);
    setSheetsMessage('');
    try {
      const res = await fetch('/api/sheets/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reservas: foundReservas })
      });
      const data = await res.json();
      if (res.ok) {
        setSheetsMessage('Sincronización completada. Se formatearon ' + (data.totalFilas || foundReservas.length) + ' filas para Google Sheets.');
      } else {
        setSheetsMessage('Error: ' + data.error);
      }
    } catch (err: any) {
      setSheetsMessage('Error de conexión con Google Sheets API.');
    } finally {
      setSyncingSheets(false);
    }
  };

  // Load feedbacks on mount
  useEffect(() => {
    setFeedbacks(getSongFeedbacks());
  }, []);

  // Auto-search for badlenz on mount to show working features instantly
  useEffect(() => {
    // If there is a mock client, we can find them
    const allClientes = getClientes();
    const badlenzExists = allClientes.some(c => c.email === 'badlenz.music@gmail.com');
    if (!badlenzExists) {
      // Seed a default cliente so search works out of the box
      const defaultCliente: Cliente = {
        id: 'CLI-8820',
        nombreArtistico: 'BADLENZ / El King',
        nombreReal: 'Carlos Arturo Mendoza',
        email: 'badlenz.music@gmail.com',
        telefono: '+52 55 8820 4910',
        instagram: '@badlenz_official',
        fechaCreacion: '2026-08-01'
      };
      
      const defaultReserva: Reserva = {
        id: 'PASE-LFS-2026-7821',
        clienteId: 'CLI-8820',
        nombreArtistico: 'BADLENZ / El King',
        fecha: '2026-08-10',
        horaInicio: '14:00',
        horaSalida: '19:00',
        totalHoras: 5,
        servicios: ['Grabación de Voces', 'Mezcla y Masterización'],
        metodoPago: 'Zelle',
        subtotal: 350,
        deposito: 175,
        balance: 175,
        estado: 'Confirmada'
      };

      const clientes = getClientes();
      const reservas = getReservas();
      
      if (!clientes.some(c => c.email === defaultCliente.email)) {
        clientes.push(defaultCliente);
        localStorage.setItem('la_facultad_clientes_db', JSON.stringify(clientes));
      }
      if (!reservas.some(r => r.clienteId === defaultCliente.id)) {
        reservas.push(defaultReserva);
        localStorage.setItem('la_facultad_reservas_db', JSON.stringify(reservas));
      }
    }
    
    // Default search for demonstration
    handleSearch('badlenz.music@gmail.com');
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;
    handleSearch(searchTerm.trim());
  };

  const handleSearch = (term: string) => {
    const termLower = term.toLowerCase().trim();
    const termDigits = term.replace(/\D/g, ''); // Extract only digits for phone matching
    
    const allClientes = getClientes();
    const allReservas = getReservas();

    // 1. Match client by email, artistic name, real name, or phone
    const cliente = allClientes.find(c => {
      const emailMatch = c.email.toLowerCase() === termLower;
      const artNameMatch = c.nombreArtistico.toLowerCase().includes(termLower);
      const realNameMatch = c.nombreReal.toLowerCase().includes(termLower);
      const idMatch = c.id.toLowerCase() === termLower;
      const phoneDigits = (c.telefono || '').replace(/\D/g, '');
      const phoneMatch = termDigits.length >= 4 && (phoneDigits.includes(termDigits) || termDigits.includes(phoneDigits));
      return emailMatch || artNameMatch || realNameMatch || idMatch || phoneMatch;
    });

    // 2. Find matching projects by project code (FAC-XXXX), id, email, artist name, or project phone
    const matchedProjects = projects.filter(p => {
      const codeMatch = p.codigoProyecto?.toLowerCase() === termLower;
      const idMatch = p.id.toLowerCase() === termLower;
      const emailMatch = p.email.toLowerCase() === termLower || (cliente && p.email.toLowerCase() === cliente.email.toLowerCase());
      const artNameMatch = p.nombreArtistico?.toLowerCase().includes(termLower) || (cliente && p.nombreArtistico?.toLowerCase().includes(cliente.nombreArtistico.toLowerCase()));
      const clientNameMatch = p.cliente.toLowerCase().includes(termLower) || (cliente && p.cliente.toLowerCase().includes(cliente.nombreReal.toLowerCase()));
      const projectPhoneDigits = (p.telefono || '').replace(/\D/g, '');
      const phoneMatch = termDigits.length >= 4 && (projectPhoneDigits.includes(termDigits) || termDigits.includes(projectPhoneDigits));
      return codeMatch || idMatch || emailMatch || artNameMatch || clientNameMatch || phoneMatch;
    });

    // 3. Find matching reservations by reservation ID, client ID, artist name, or ATH reference
    const matchedReservas = allReservas.filter(r => {
      const idMatch = r.id.toLowerCase().includes(termLower);
      const clientIdMatch = cliente && r.clienteId === cliente.id;
      const artNameMatch = r.nombreArtistico.toLowerCase().includes(termLower) || (cliente && r.nombreArtistico.toLowerCase().includes(cliente.nombreArtistico.toLowerCase()));
      const refMatch = r.comprobanteNumReferencia?.toLowerCase().includes(termLower);
      return idMatch || clientIdMatch || artNameMatch || refMatch;
    });

    if (cliente) {
      setFoundCliente(cliente);
      setFoundReservas(matchedReservas);
      setFoundProjects(matchedProjects);
      setErrorMsg('');
    } else if (matchedProjects.length > 0 || matchedReservas.length > 0) {
      const firstProject = matchedProjects[0];
      const firstReserva = matchedReservas[0];
      
      setFoundCliente({
        id: firstProject?.id || firstReserva?.clienteId || 'CLI-DIRECT',
        nombreArtistico: firstProject?.nombreArtistico || firstReserva?.nombreArtistico || term,
        nombreReal: firstProject?.cliente || firstReserva?.nombreArtistico || term,
        email: firstProject?.email || 'artista@lafacultadstudio.com',
        telefono: firstProject?.telefono || '787-240-8627',
        instagram: '@lafacultadstudio',
        fechaCreacion: new Date().toISOString().split('T')[0]
      });
      setFoundReservas(matchedReservas);
      setFoundProjects(matchedProjects);
      setErrorMsg('');
    } else {
      setFoundCliente(null);
      setFoundReservas([]);
      setFoundProjects([]);
      setErrorMsg('No se encontraron proyectos ni reservas con ese teléfono, código de proyecto o correo.');
    }
    setHasSearched(true);
  };

  const format12h = (timeStr: string) => {
    if (!timeStr) return '';
    const [hours, minutes] = timeStr.split(':');
    const h = parseInt(hours, 10);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const formattedHours = h % 12 || 12;
    return `${formattedHours}:${minutes} ${ampm}`;
  };

  const parseTimestampToSeconds = (ts: string) => {
    const parts = ts.split(':');
    if (parts.length === 2) {
      const min = parseInt(parts[0], 10) || 0;
      const sec = parseInt(parts[1], 10) || 0;
      return min * 60 + sec;
    }
    const secOnly = parseInt(ts, 10);
    return isNaN(secOnly) ? 0 : secOnly;
  };

  const getTrackStep = (progreso: number, estado: string): number => {
    const est = (estado || '').toLowerCase();
    if (progreso >= 100 || est.includes('completado') || est.includes('terminado') || est.includes('entregado') || est.includes('lista') || est.includes('descargar')) {
      return 3; // ¡Lista para Descargar! 🎉
    }
    if (est.includes('master') || est.includes('mast') || progreso > 75) {
      return 2; // Masterizándose
    }
    if (est.includes('mezc') || est.includes('mix') || progreso > 35) {
      return 1; // Mezclándose
    }
    return 0; // Grabado
  };

  const handleAddFeedbackItem = (projId: string, projectName: string) => {
    setFbError(null);
    if (!fbTimestamp.trim() || !fbComment.trim()) {
      setFbError('Por favor, ingresa tanto la marca de tiempo como el comentario.');
      return;
    }

    // Validate timestamp format MM:SS or M:SS
    const timestampRegex = /^(?:[0-5]?\d):[0-5]\d$/;
    if (!timestampRegex.test(fbTimestamp.trim())) {
      setFbError('Formato de tiempo inválido. Usa el formato MM:SS (ej: 01:24 o 00:45).');
      return;
    }

    const currentFeedback = feedbacks.find(f => f.proyectoId === projId) || {
      id: `fb-${Date.now()}`,
      proyectoId: projId,
      nombreProyecto: projectName,
      nombreArtistico: foundCliente?.nombreArtistico || 'Artista',
      fecha: new Date().toISOString().split('T')[0],
      items: []
    };

    const newItem = {
      id: `it-${Date.now()}`,
      timestamp: fbTimestamp.trim(),
      comentario: fbComment.trim(),
      completado: false,
      fechaCreacion: new Date().toISOString().split('T')[0]
    };

    const updatedItems = [...currentFeedback.items, newItem].sort((a, b) => 
      parseTimestampToSeconds(a.timestamp) - parseTimestampToSeconds(b.timestamp)
    );

    const updatedFeedback = {
      ...currentFeedback,
      items: updatedItems
    };

    const updatedFeedbacks = guardarSongFeedback(updatedFeedback);
    setFeedbacks(updatedFeedbacks);
    setFbTimestamp('');
    setFbComment('');
  };

  const handleRemoveFeedbackItem = (projId: string, itemId: string) => {
    const currentFeedback = feedbacks.find(f => f.proyectoId === projId);
    if (!currentFeedback) return;

    const updatedItems = currentFeedback.items.filter((it: any) => it.id !== itemId);
    const updatedFeedback = {
      ...currentFeedback,
      items: updatedItems
    };

    const updatedFeedbacks = guardarSongFeedback(updatedFeedback);
    setFeedbacks(updatedFeedbacks);
  };


  if (!currentUser) {
    return (
      <div className="max-w-md mx-auto py-8 space-y-6">
        <div className="antigravity-glass-panel p-8 rounded-3xl border border-white/10 shadow-[0_24px_50px_rgba(0,0,0,0.7)] space-y-6">
          <div className="text-center space-y-2">
            <div className="inline-flex p-3 bg-red-950/80 border border-red-800 rounded-2xl mb-1">
              <User className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-lg font-black text-white uppercase tracking-wider">
              PORTAL DE ARTISTAS & MIS PROYECTOS
            </h2>
            <p className="text-xs text-gray-400 leading-relaxed">
              Inicia sesión o crea tu cuenta de artista para acceder a tus reservas, archivos de Google Drive y seguimiento de proyectos musicales.
            </p>
          </div>

          <form onSubmit={handleAuthSubmit} className="space-y-4">
            <div className="flex bg-[#111827] p-1 rounded-xl border border-gray-800 text-xs">
              <button
                type="button"
                onClick={() => setAuthMode('login')}
                className={`flex-1 py-2 font-bold uppercase rounded-lg text-[11px] transition ${
                  authMode === 'login' ? 'bg-red-700 text-white shadow' : 'text-gray-400 hover:text-white'
                }`}
              >
                Iniciar Sesión
              </button>
              <button
                type="button"
                onClick={() => setAuthMode('register')}
                className={`flex-1 py-2 font-bold uppercase rounded-lg text-[11px] transition ${
                  authMode === 'register' ? 'bg-red-700 text-white shadow' : 'text-gray-400 hover:text-white'
                }`}
              >
                Crear Cuenta
              </button>
            </div>

            {authMode === 'register' && (
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Nombre Artístico</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: BADLENZ"
                  value={authName}
                  onChange={e => setAuthName(e.target.value)}
                  className="w-full bg-[#111827] text-white px-3.5 py-2.5 rounded-lg border border-gray-800 text-xs focus:border-red-500 outline-none"
                />
              </div>
            )}

            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Correo Electrónico</label>
              <input
                type="email"
                required
                placeholder="artista@estudio.com"
                value={authEmail}
                onChange={e => setAuthEmail(e.target.value)}
                className="w-full bg-[#111827] text-white px-3.5 py-2.5 rounded-lg border border-gray-800 text-xs focus:border-red-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Contraseña</label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={authPass}
                onChange={e => setAuthPass(e.target.value)}
                className="w-full bg-[#111827] text-white px-3.5 py-2.5 rounded-lg border border-gray-800 text-xs focus:border-red-500 outline-none"
              />
            </div>

            {authError && (
              <p className="text-[11px] text-red-400 font-bold bg-red-950/60 p-2.5 rounded-lg border border-red-800 text-center">{authError}</p>
            )}
            {authSuccess && (
              <p className="text-[11px] text-emerald-400 font-bold bg-emerald-950/60 p-2.5 rounded-lg border border-emerald-800 text-center">{authSuccess}</p>
            )}

            <div className="space-y-2 pt-1">
              <button
                type="submit"
                className="w-full bg-red-700 hover:bg-red-600 text-white font-bold py-3 rounded-xl text-xs uppercase tracking-wider transition shadow-lg flex items-center justify-center gap-2"
              >
                <Lock className="w-4 h-4" />
                <span>{authMode === 'register' ? 'Registrarse e Ingresar' : 'Iniciar Sesión'}</span>
              </button>

              <button
                type="button"
                onClick={handleGoogleAuth}
                className="w-full bg-gray-800 hover:bg-gray-700 text-white font-bold py-2.5 rounded-xl text-xs uppercase tracking-wider transition flex items-center justify-center gap-2 border border-gray-700"
              >
                <span>Continuar con Google</span>
              </button>
            </div>
          </form>

          {/* DEMO QUICK ACCESS & PHONE/CODE QUICK LOOKUP */}
          <div className="pt-4 border-t border-gray-800 space-y-3 text-center">
            <div className="bg-[#111827] p-3 rounded-xl border border-gray-800 text-left">
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 flex items-center gap-1.5">
                <Smartphone className="w-3.5 h-3.5 text-amber-500" />
                <span>Acceso Rápido con Teléfono o Código de Proyecto</span>
              </label>
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!quickSearchInput.trim()) return;
                  const demoProfile: UserProfile = {
                    uid: `usr-${Date.now().toString().slice(-4)}`,
                    email: 'artista.directo@lafacultadstudio.com',
                    displayName: quickSearchInput.trim(),
                    nombreArtistico: quickSearchInput.trim(),
                    role: 'artist',
                    createdAt: new Date().toISOString()
                  };
                  setCurrentUser(demoProfile);
                  setSearchTerm(quickSearchInput.trim());
                  handleSearch(quickSearchInput.trim());
                }}
                className="flex gap-1.5"
              >
                <input
                  type="text"
                  placeholder="Ej: 787-240-8627 o FAC-001"
                  value={quickSearchInput}
                  onChange={e => setQuickSearchInput(e.target.value)}
                  className="flex-1 bg-black text-white px-2.5 py-1.5 rounded-lg border border-gray-700 text-xs focus:border-red-500 outline-none font-mono"
                />
                <button
                  type="submit"
                  className="bg-amber-600 hover:bg-amber-500 text-gray-950 font-black px-3 py-1.5 rounded-lg text-xs uppercase transition cursor-pointer"
                >
                  Entrar
                </button>
              </form>
            </div>

            <p className="text-[10px] text-gray-500">¿O deseas probar la demo con 1 clic?</p>
            <button
              type="button"
              onClick={() => {
                const demoProfile: UserProfile = {
                  uid: 'demo-badlenz-123',
                  email: 'ellentemalo@gmail.com',
                  displayName: 'BADLENZ',
                  nombreArtistico: 'BADLENZ',
                  role: 'artist',
                  createdAt: new Date().toISOString()
                };
                setCurrentUser(demoProfile);
                setSearchTerm('ellentemalo@gmail.com');
                handleSearch('ellentemalo@gmail.com');
                loadUserData('ellentemalo@gmail.com');
              }}
              className="text-xs bg-amber-950/60 hover:bg-amber-900/80 text-amber-300 font-bold px-4 py-2 rounded-lg border border-amber-800/80 transition"
            >
              🚀 Probar con Demo: BADLENZ (ellentemalo@gmail.com)
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* BANNER VIP: ACCESO DIRECTO A SALA DE ESCUCHA EN VIVO */}
      <div className="relative overflow-hidden rounded-3xl border border-amber-500/50 bg-gradient-to-r from-[#1b0a0e]/95 via-[#130f18]/95 to-[#0b0c10]/95 p-6 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.85),0_0_35px_rgba(245,158,11,0.2)]">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-400/80 to-transparent pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-red-950/80 to-amber-950/80 border border-amber-500/40 text-amber-300 text-[10px] font-mono uppercase tracking-[0.2em] font-extrabold">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
              <span>SISTEMA DE ESTUDIO EN VIVO · SALA DE ESCUCHA</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black uppercase text-white tracking-wide font-syne">
              Sala Privada de Monitoreo &amp; Timestamps
            </h2>
            <p className="text-xs text-zinc-300 leading-relaxed">
              ¿Quieres escuchar tu tema terminado o en proceso con marcas de tiempo en la onda sonora? Ingresa directamente con tu código de sesión a nuestra sala de escucha oficial en Vercel.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0">
            <a
              href={ARTIST_DEMO_SESSION_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-3 rounded-xl bg-black/60 hover:bg-black/90 text-amber-300 hover:text-white border border-amber-500/40 font-bold text-xs uppercase tracking-wider transition flex items-center justify-center gap-2"
            >
              <span>Demo Zyron - Tukutu</span>
            </a>
            <button
              type="button"
              onClick={() => {
                const code = prompt('Ingresa tu código de sesión (ej: zyrontukutu, delnorte):');
                if (code && code.trim()) {
                  window.open(getArtistSessionUrl(code.trim()), '_blank', 'noopener,noreferrer');
                }
              }}
              className="px-5 py-3 rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-amber-500 hover:from-red-500 hover:to-amber-400 text-white font-syne font-black text-xs uppercase tracking-wider shadow-lg shadow-red-950/60 hover:shadow-amber-500/30 transition cursor-pointer flex items-center justify-center gap-2 active:scale-95"
            >
              <span>Entrar con Código ➜</span>
            </button>
          </div>
        </div>
      </div>

      {/* HEADER DE SESIÓN ACTIVA */}
      <div className="antigravity-glass-panel p-6 rounded-3xl border border-white/10 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-red-900/80 border-2 border-red-500 flex items-center justify-center text-white font-black text-base shadow-md">
            {currentUser.displayName.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-black text-white uppercase">{currentUser.displayName}</h3>
              <span className="text-[9px] bg-emerald-950 text-emerald-400 font-bold px-2 py-0.5 rounded border border-emerald-800">
                VERIFICADO ✓
              </span>
            </div>
            <p className="text-xs text-gray-400 font-mono">{currentUser.email}</p>
          </div>
        </div>

        <button
          onClick={() => logoutUser()}
          className="bg-gray-800 hover:bg-red-950 text-gray-300 hover:text-red-300 font-bold px-4 py-2 rounded-lg text-xs flex items-center gap-2 transition border border-gray-700"
        >
          <LogOut className="w-4 h-4 text-red-400" />
          <span>Cerrar Sesión</span>
        </button>
      </div>

      {/* PROTOCOLO OFICIAL DE ENTREGAS BADLENZ */}
      <div className="bg-gradient-to-r from-red-950/40 via-black to-amber-950/30 border border-amber-500/40 p-4 rounded-xl flex items-start gap-3 shadow-lg">
        <div className="p-2.5 bg-amber-500/20 text-amber-400 rounded-xl border border-amber-500/30 shrink-0">
          <CheckCircle className="w-5 h-5 text-amber-400" />
        </div>
        <div className="text-xs space-y-1">
          <h4 className="font-black text-white uppercase tracking-wide flex items-center gap-2">
            <span>📦 Bóveda VIP • Protocolo de Entrega Final de La Facultad</span>
            <span className="text-[10px] bg-amber-950 text-amber-300 px-2 py-0.5 rounded font-mono font-bold">24 A 72 HORAS</span>
          </h4>
          <p className="text-gray-300 leading-relaxed text-[11px]">
            • <strong>Rough Mix (Maqueta Inmediata):</strong> Al terminar tus 4 horas de sesión en el studio, Badlenz te pasa el audio al instante por <strong>AirDrop, WhatsApp y correo</strong> para escucharlo en tu auto o celular.<br/>
            • <strong>Entrega Final (Web Oficial):</strong> Aquí en tu Bóveda descargas tu <strong>Master WAV 24-bit</strong> de nivel comercial, <strong>MP3 320kbps</strong> para radios/redes y tu carpeta completa de <strong>Stems</strong> limpios.
          </p>
        </div>
      </div>

      {/* SECCIÓN DESBLOQUEADA DE PORTAL ARTISTAS & BUSCADOR INTELIGENTE */}
      <div className="bg-[#1e1e1e] p-6 rounded-xl border border-gray-800 shadow-2xl">
        <div className="max-w-2xl mx-auto text-center space-y-3">
          <h2 className="text-lg font-bold text-white uppercase tracking-wider flex items-center justify-center gap-2">
            <Music className="w-5 h-5 text-red-500 animate-pulse" />
            <span>BÓVEDA VIP • CONSULTA DE PROYECTOS & ARCHIVOS DE ESTUDIO</span>
          </h2>
          <p className="text-xs text-gray-400">
            Ingresa tu <strong>teléfono</strong> (ej: 787-240-8627), <strong>código de proyecto</strong> (ej: FAC-001), correo o nombre de artista para ver tus temas terminados.
          </p>

          <form onSubmit={handleSearchSubmit} className="flex gap-2 pt-2">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-3 w-4 h-4 text-gray-500" />
              <input
                type="text"
                required
                placeholder="Teléfono (787-...), Código (FAC-001), Correo o Artista..."
                className="w-full bg-[#111827] text-white pl-10 pr-4 py-2.5 rounded-lg border border-gray-700 text-xs focus:border-red-500 focus:outline-none placeholder-gray-500 font-medium"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <button
              type="submit"
              className="bg-red-700 hover:bg-red-600 text-white font-bold px-6 py-2.5 rounded-lg text-xs uppercase tracking-wider transition shrink-0 flex items-center gap-2"
            >
              <span>Consultar</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </form>

          {errorMsg && (
            <p className="text-xs text-red-400 font-semibold mt-2 flex items-center justify-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              {errorMsg}
            </p>
          )}
        </div>
      </div>

      {/* SECCIÓN DE CUENTA DE ARTISTA (FIREBASE AUTH) Y ARCHIVOS EN GOOGLE DRIVE */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* TARJETA DE VERIFICACIÓN Y ESTADO DE CUENTA */}
        <div className="bg-[#1e1e1e] p-6 rounded-xl border border-gray-800 shadow-xl space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <div className="flex items-center gap-2">
                <User className="w-5 h-5 text-red-500" />
                <h3 className="text-sm font-black text-white uppercase tracking-wider">
                  Cuenta de Artista Verificada
                </h3>
              </div>
              <span className="text-[10px] bg-emerald-950 text-emerald-400 font-bold px-2 py-0.5 rounded border border-emerald-800">
                ACTIVO
              </span>
            </div>

            <div className="bg-[#111827] p-4 rounded-xl border border-gray-800 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-red-900/80 border-2 border-red-500 flex items-center justify-center text-white font-black text-base shadow-md">
                  {currentUser.displayName.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white uppercase">{currentUser.displayName}</h4>
                  <p className="text-xs text-gray-400 font-mono">{currentUser.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-3 py-2 rounded-lg">
                <CheckCircle className="w-4 h-4 shrink-0" />
                <span>Vinculado con Firebase Auth, Firestore DB & Google Cloud Workspace</span>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-gray-800">
            <button
              onClick={() => logoutUser()}
              className="w-full bg-gray-800 hover:bg-red-950 text-gray-300 hover:text-red-300 font-bold py-2 px-3 rounded-lg text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition border border-gray-700"
            >
              <LogOut className="w-4 h-4 text-red-400" />
              <span>Cerrar Sesión de Artista</span>
            </button>
          </div>
        </div>

        {/* TARJETA DE GOOGLE DRIVE Y GOOGLE SHEETS SYNC */}
        <div className="bg-[#1e1e1e] p-6 rounded-xl border border-gray-800 shadow-xl space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <div className="flex items-center gap-2">
                <HardDrive className="w-5 h-5 text-amber-500" />
                <h3 className="text-sm font-black text-white uppercase tracking-wider">
                  Archivos de Sesión & Google Drive
                </h3>
              </div>
              {/* {currentUser && (
                <button
                  onClick={() => setShowAddFileModal(true)}
                  className="bg-amber-600 hover:bg-amber-500 text-black font-bold px-2.5 py-1 rounded text-[10px] uppercase tracking-wider flex items-center gap-1 transition"
                >
                  <Plus className="w-3 h-3" />
                  <span>Subir Archivo</span>
                </button>
              )} */}
            </div>

            <p className="text-xs text-gray-400 leading-relaxed">
              Tus proyectos musicales, tallos (stems), mezclas finales WAV/MP3 y recibos de pago almacenados en la nube oficial de Google Drive.
            </p>

            {/* LISTA DE ARCHIVOS DE GOOGLE DRIVE */}
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {userArchivos.length === 0 ? (
                <p className="text-[11px] text-gray-500 italic py-3 text-center">Inicia sesión o realiza una búsqueda para ver tus archivos de Google Drive.</p>
              ) : (
                userArchivos.map((arc) => (
                  <div key={arc.id} className="bg-[#111827] p-2.5 rounded-lg border border-gray-800 flex items-center justify-between">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Folder className="w-4 h-4 text-amber-500 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-white truncate">{arc.nombreArchivo}</p>
                        <p className="text-[10px] text-gray-500">{arc.tipo} • {arc.tamano || 'Google Drive'}</p>
                      </div>
                    </div>
                    <a
                      href={arc.driveUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="bg-gray-800 hover:bg-gray-700 text-amber-400 p-1.5 rounded transition shrink-0 flex items-center gap-1 text-[10px] font-bold"
                    >
                      <span>Abrir</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* MODAL PARA AGREGAR ARCHIVO DE GOOGLE DRIVE */}
      {/* {showAddFileModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          ... (modal content) ...
        </div>
      )} */}

      {/* MODAL 1: REAGENDAR SESIÓN (POLÍTICA DE 48 HORAS) */}
      {reservaParaReagendar && (() => {
        // Cálculo de horas restantes para la sesión
        const sessionDate = new Date(`${reservaParaReagendar.fecha}T${reservaParaReagendar.horaInicio || '13:00'}:00`);
        const now = new Date();
        const diffMs = sessionDate.getTime() - now.getTime();
        const diffHoras = diffMs / (1000 * 60 * 60);
        const cumpleRegla48h = diffHoras >= 48;

        const handleConfirmarReagendar = () => {
          if (!nuevaFechaReagendar) {
            alert('Por favor selecciona una nueva fecha.');
            return;
          }

          if (!cumpleRegla48h) {
            const confirmaExcepcion = confirm(
              `⚠️ AVISO DE PENALIDAD: Faltan menos de 48 horas (${Math.max(0, Math.round(diffHoras))} horas restantes) para tu sesión programada.\n\nSegún la política de La Facultad Studio, el depósito del 50% ($${reservaParaReagendar.deposito} USD) no es transferible con menos de 48h de aviso porque el tiempo de estudio ya fue reservado.\n\n¿Deseas enviar la solicitud especial a Badlenz por WhatsApp para evaluar tu caso?`
            );
            if (!confirmaExcepcion) return;
          }

          const [startH, endH] = nuevoHorarioReagendar.split(' - ');
          const updates: Partial<Reserva> = {
            fecha: nuevaFechaReagendar,
            horaInicio: startH || reservaParaReagendar.horaInicio,
            horaSalida: endH || reservaParaReagendar.horaSalida,
            reagendadoDeFecha: reservaParaReagendar.fecha,
            estado: 'Pendiente'
          };

          actualizarReserva(reservaParaReagendar.id, updates);
          setFoundReservas(prev => prev.map(r => r.id === reservaParaReagendar.id ? { ...r, ...updates } : r));
          setReservaParaReagendar(null);

          alert(
            cumpleRegla48h
              ? '✅ ¡Sesión reagendada exitosamente dentro del plazo de 48 horas! Tu turno ha sido actualizado.'
              : '⚠️ Solicitud de cambio registrada. Por favor contáctate con Badlenz al 787-240-8627 para coordinar el nuevo turno.'
          );
        };

        return (
          <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
            <div className="bg-[#1e1e1e] border border-gray-700 w-full max-w-md rounded-xl p-5 space-y-4 shadow-2xl">
              <div className="flex justify-between items-center border-b border-gray-800 pb-3">
                <div className="flex items-center gap-2">
                  <RotateCcw className="w-5 h-5 text-amber-500" />
                  <h4 className="text-sm font-black text-white uppercase tracking-wider">
                    Reagendar Sesión de Estudio
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={() => setReservaParaReagendar(null)}
                  className="text-gray-400 hover:text-white text-sm"
                >
                  ✕
                </button>
              </div>

              {/* Status de la Regla de 48 Horas */}
              <div className={`p-3 rounded-lg border text-xs ${
                cumpleRegla48h
                  ? 'bg-emerald-950/40 border-emerald-800/80 text-emerald-300'
                  : 'bg-red-950/40 border-red-800/80 text-red-300'
              }`}>
                <div className="flex items-center gap-1.5 font-bold uppercase text-[10px] tracking-wider mb-1">
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  <span>
                    {cumpleRegla48h
                      ? '✓ Cumple con la regla de 48 horas de anticipación'
                      : '⚠️ Alerta: Menos de 48 horas para la sesión'}
                  </span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  {cumpleRegla48h
                    ? `Faltan aproximadamente ${Math.round(diffHoras)} horas para tu fecha programada. Puedes mover tu cita sin costo ni penalidad.`
                    : `Tu sesión es el ${reservaParaReagendar.fecha}. Al faltar menos de 48h, el depósito del 50% no es reembolsable debido al tiempo reservado en el estudio.`}
                </p>
              </div>

              {/* Formulario de Reagendamiento */}
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-[10px] text-gray-400 uppercase font-bold mb-1">
                    Sesión Actual
                  </label>
                  <div className="p-2.5 bg-black/50 rounded border border-gray-800 font-mono text-gray-300">
                    {reservaParaReagendar.fecha} • {format12h(reservaParaReagendar.horaInicio)} - {format12h(reservaParaReagendar.horaSalida)}
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] text-gray-400 uppercase font-bold mb-1">
                    Nueva Fecha Propuesta
                  </label>
                  <input
                    type="date"
                    value={nuevaFechaReagendar}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={(e) => setNuevaFechaReagendar(e.target.value)}
                    className="w-full bg-[#111827] border border-gray-700 rounded p-2 text-white outline-none focus:border-red-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-gray-400 uppercase font-bold mb-1">
                    Turno de Sesión
                  </label>
                  <select
                    value={nuevoHorarioReagendar}
                    onChange={(e) => setNuevoHorarioReagendar(e.target.value)}
                    className="w-full bg-[#111827] border border-gray-700 rounded p-2 text-white outline-none focus:border-red-500"
                  >
                    <option value="13:00 - 17:00">Turno Tarde: 01:00 PM - 05:00 PM (4 Horas)</option>
                    <option value="18:00 - 22:00">Turno Noche: 06:00 PM - 10:00 PM (4 Horas)</option>
                    <option value="13:00 - 18:00">Turno Extendido: 01:00 PM - 06:00 PM (5 Horas)</option>
                    <option value="09:00 - 13:00">Turno Mañana: 09:00 AM - 01:00 PM (4 Horas)</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-2 pt-2 border-t border-gray-800">
                <button
                  type="button"
                  onClick={() => setReservaParaReagendar(null)}
                  className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold py-2 rounded text-xs uppercase"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmarReagendar}
                  className={`flex-1 font-bold py-2 rounded text-xs uppercase text-white shadow ${
                    cumpleRegla48h ? 'bg-red-700 hover:bg-red-600' : 'bg-amber-700 hover:bg-amber-600'
                  }`}
                >
                  Confirmar Cambio
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* MODAL 2: SUBIR COMPROBANTE DE ATH MÓVIL DIRECTO */}
      {reservaParaComprobante && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-[#1e1e1e] border border-gray-700 w-full max-w-md rounded-xl p-5 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-gray-800 pb-3">
              <div className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-emerald-400" />
                <h4 className="text-sm font-black text-white uppercase tracking-wider">
                  Enviar Comprobante ATH Móvil
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setReservaParaComprobante(null)}
                className="text-gray-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <div className="bg-black/50 p-3 rounded-lg border border-gray-800 text-xs space-y-1">
              <p className="text-gray-400">Reserva: <strong className="text-white font-mono">{reservaParaComprobante.id}</strong></p>
              <p className="text-gray-400">Monto del Depósito (50%): <strong className="text-amber-400 font-mono">${reservaParaComprobante.deposito}.00 USD</strong></p>
              <p className="text-gray-400">Enviar por ATH Móvil a: <strong className="text-red-400 font-mono">787-240-8627</strong></p>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[10px] text-gray-400 uppercase font-bold mb-1">
                  1. Número de Confirmación ATH Móvil
                </label>
                <input
                  type="text"
                  placeholder="Ej: ATH-991823 o últimos 4 dígitos"
                  value={athNumRef}
                  onChange={(e) => setAthNumRef(e.target.value)}
                  className="w-full bg-[#111827] border border-gray-700 rounded p-2 text-white font-mono outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="block text-[10px] text-gray-400 uppercase font-bold mb-1">
                  2. Captura de Pantalla del Recibo (Foto/Screenshot)
                </label>
                <label className="block cursor-pointer bg-black/60 hover:bg-gray-800 border border-dashed border-gray-700 hover:border-gray-500 rounded p-3 text-center transition">
                  <Camera className="w-5 h-5 text-amber-400 mx-auto mb-1" />
                  <span className="text-[11px] text-gray-300 block truncate">
                    {athComprobanteNombre || 'Toca aquí para seleccionar captura de tu recibo'}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onload = () => {
                        setAthComprobanteFile(reader.result as string);
                        setAthComprobanteNombre(file.name);
                      };
                      reader.readAsDataURL(file);
                    }}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            <div className="flex gap-2 pt-2 border-t border-gray-800">
              <button
                type="button"
                onClick={() => setReservaParaComprobante(null)}
                className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold py-2 rounded text-xs uppercase"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!athComprobanteFile && !athNumRef.trim()) {
                    alert('Por favor ingresa el número de referencia o adjunta la captura del recibo.');
                    return;
                  }

                  const updates: Partial<Reserva> = {
                    comprobanteAthUrl: athComprobanteFile || undefined,
                    comprobanteNumReferencia: athNumRef.trim() || undefined,
                    depositoEstado: 'depositado',
                    estado: 'Confirmada'
                  };

                  actualizarReserva(reservaParaComprobante.id, updates);
                  setFoundReservas(prev => prev.map(r => r.id === reservaParaComprobante.id ? { ...r, ...updates } : r));
                  setReservaParaComprobante(null);
                  alert('¡Comprobante de depósito guardado exitosamente en el sistema de Badlenz!');
                }}
                className="flex-1 bg-emerald-700 hover:bg-emerald-600 font-bold py-2 rounded text-xs uppercase text-white shadow"
              >
                Guardar Recibo
              </button>
            </div>
          </div>
        </div>
      )}

      {hasSearched && foundCliente && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* COLUMNA IZQUIERDA: PERFIL DEL ARTISTA Y PAGOS */}
          <div className="space-y-6 lg:col-span-1">
            {/* Tarjeta Perfil */}
            <div className="bg-[#1e1e1e] p-5 rounded-xl border border-gray-800 space-y-4">
              <div className="flex items-center gap-3 border-b border-gray-800 pb-4">
                <div className="w-10 h-10 rounded-full bg-red-950 border border-red-700 flex items-center justify-center font-bold text-red-500 text-sm">
                  {foundCliente.nombreArtistico.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white uppercase">{foundCliente.nombreArtistico}</h3>
                  <p className="text-[10px] text-gray-400">ID Cliente: <span className="text-red-400 font-mono">{foundCliente.id}</span></p>
                </div>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-500">Nombre Legal:</span>
                  <span className="text-gray-300 font-semibold">{foundCliente.nombreReal}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Email:</span>
                  <span className="text-gray-300 font-mono">{foundCliente.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Instagram:</span>
                  <span className="text-amber-500 font-semibold">{foundCliente.instagram}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Teléfono:</span>
                  <span className="text-gray-300">{foundCliente.telefono}</span>
                </div>
              </div>
            </div>

            {/* Tarjeta de Lealtad y Pasaporte por Servicios (1 Servicio = 1 Estrella ⭐) */}
            {(() => {
              const clientReservas = foundReservas.filter(r => r.estado === 'Confirmada' || r.estado === 'Completada');
              // Cada servicio cuenta como 1 punto/estrella (hasta 20 máximo)
              const totalServicios = clientReservas.reduce((acc, r) => {
                const count = Array.isArray(r.servicios) ? Math.max(1, r.servicios.length) : 1;
                return acc + count;
              }, 0);
              const totalPuntos = Math.min(totalServicios, 20); // Máximo 20 estrellas
              
              const milestones = [
                { pts: 4, label: '30% Descuento en tu próximo servicio' },
                { pts: 8, label: '50% Descuento en Grabación o Mezcla' },
                { pts: 12, label: 'Mezcla & Masterización GRATIS' },
                { pts: 16, label: 'Pista / Beat exclusivo de Regalo' },
                { pts: 20, label: 'Producción Completa (Beat, Grabación, Mix & Master) GRATIS' },
              ];

              const nextMilestone = milestones.find(m => totalPuntos < m.pts);
              const serviciosParaSiguiente = nextMilestone ? nextMilestone.pts - totalPuntos : 0;
              const percentage = Math.min((totalPuntos / 20) * 100, 100);

              return (
                <div className="antigravity-glass p-6 rounded-3xl border border-white/10 shadow-2xl space-y-5">
                  <div className="flex justify-between items-start border-b border-gray-800 pb-3">
                    <div>
                      <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                        <Award className="w-4 h-4 text-amber-500" />
                        <span>Pasaporte de Fidelidad ('Estrellas por Servicio')</span>
                      </h4>
                      <p className="text-[9px] text-gray-500 font-mono mt-0.5">La Facultad Studio</p>
                    </div>
                    <div className="bg-red-950/40 border border-red-700/30 px-2 py-0.5 rounded text-[10px] font-black text-red-400 uppercase tracking-wider">
                      {totalPuntos >= 20 ? '👑 Leyenda (20/20 ⭐)' :
                       totalPuntos >= 15 ? '💎 Platino (15+ ⭐)' :
                       totalPuntos >= 10 ? '🥇 Oro (10+ ⭐)' :
                       totalPuntos >= 5  ? '🥈 Plata (5+ ⭐)' : '🥉 Bronce'}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-400">Servicios Completados:</span>
                      <span className="font-extrabold text-amber-500 font-mono flex items-center gap-1 text-sm">
                        <Star className="w-4 h-4 text-amber-400 fill-amber-400 animate-pulse" />
                        {totalPuntos} / 20 Estrellas ⭐
                      </span>
                    </div>

                    {/* Barra de Progreso Visual por Estrellas */}
                    <div className="space-y-2 pt-1 pb-4">
                      <div className="flex justify-between text-[10px] text-gray-400 font-mono">
                        <span>Progreso de Fidelidad</span>
                        <span className="font-bold text-amber-500">{Math.round(percentage)}%</span>
                      </div>
                      <div className="relative w-full h-3 bg-black/40 border border-gray-800 rounded-full">
                        {/* Track activo */}
                        <div 
                          className="absolute top-0 left-0 h-full bg-gradient-to-r from-red-600 via-amber-500 to-yellow-400 rounded-full transition-all duration-1000"
                          style={{ width: `${percentage}%` }}
                        />
                        {/* Pines de los escalones de estrellas */}
                        {milestones.map((m) => {
                          const pinPos = (m.pts / 20) * 100;
                          const isReached = totalPuntos >= m.pts;
                          return (
                            <div 
                              key={m.pts}
                              className="absolute top-1/2 -translate-y-1/2 flex flex-col items-center group cursor-help"
                              style={{ left: `${pinPos}%`, transform: 'translate(-50%, -50%)' }}
                            >
                              <div 
                                className={`w-3.5 h-3.5 rounded-full border transition-all flex items-center justify-center ${
                                  isReached
                                    ? 'bg-amber-400 border-amber-200 shadow-[0_0_10px_rgba(251,191,36,0.8)] scale-110'
                                    : 'bg-[#1a1a1a] border-gray-700'
                                }`}
                              />
                              <span className={`text-[8px] font-mono font-bold mt-5 absolute whitespace-nowrap transition-colors ${
                                isReached ? 'text-amber-400 font-black' : 'text-gray-500'
                              }`}>
                                {m.pts}⭐
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {totalPuntos < 20 && nextMilestone ? (
                      <p className="text-[10px] text-gray-300 leading-relaxed italic bg-black/40 border border-gray-800/60 p-2.5 rounded">
                        🚀 Siguiente recompensa en <strong className="text-amber-400 font-mono">{serviciosParaSiguiente}</strong> {serviciosParaSiguiente === 1 ? 'servicio' : 'servicios'} más (<strong className="text-amber-400">{nextMilestone.pts} ⭐</strong>): <strong className="text-white">{nextMilestone.label}</strong>.
                      </p>
                    ) : (
                      <p className="text-[10px] text-amber-400 font-bold bg-amber-950/30 border border-amber-800/40 p-2.5 rounded text-center">
                        👑 ¡Pasaporte completo! Has conseguido las 20 Estrellas. Eres una Leyenda de La Facultad Studio.
                      </p>
                    )}

                    {/* Grid de Stamps / Estrellas (20 Stamps) */}
                    <div className="pt-2">
                      <p className="text-[10px] text-gray-500 uppercase font-black tracking-wider mb-2">Tarjeta Estrellas de Fidelidad (1 Servicio = 1 ⭐):</p>
                      <div className="grid grid-cols-5 gap-1.5">
                        {Array.from({ length: 20 }).map((_, idx) => {
                          const stampNum = idx + 1;
                          const isStamped = stampNum <= totalPuntos;
                          return (
                            <div
                              key={idx}
                              className={`aspect-square rounded-lg flex flex-col items-center justify-center text-[10px] font-mono border transition-all ${
                                isStamped
                                  ? 'bg-amber-500/15 border-amber-400/80 text-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.3)]'
                                  : 'bg-black/30 border-gray-800/60 text-gray-600'
                              }`}
                              title={isStamped ? `Servicio ${stampNum} completado ⭐` : `Servicio ${stampNum} pendiente`}
                            >
                              {isStamped ? (
                                <Star className="w-4 h-4 text-amber-400 fill-amber-400 animate-pulse" />
                              ) : (
                                <span className="text-[9px] font-bold">{stampNum}</span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Recompensas / Milestones en bloque colapsable */}
                    <div className="pt-3">
                      <details className="group border border-gray-800 rounded-xl overflow-hidden transition-all bg-black/30">
                        <summary className="flex justify-between items-center p-3 cursor-pointer text-[11px] font-black uppercase text-amber-400 select-none hover:bg-white/[0.02]">
                          <span className="flex items-center gap-1.5">
                            <Award className="w-3.5 h-3.5 text-amber-500" />
                            <span>★ Ver Premios Disponibles</span>
                          </span>
                          <span className="text-gray-500 group-open:rotate-180 transition-transform font-mono text-xs">▼</span>
                        </summary>
                        <div className="p-3 border-t border-gray-800 bg-[#111827]/40 space-y-2.5">
                          {milestones.map((milestone) => {
                            const isUnlocked = totalPuntos >= milestone.pts;
                            return (
                              <div
                                key={milestone.pts}
                                className={`flex items-start gap-2.5 p-2 rounded text-[10px] transition-all border ${
                                  isUnlocked
                                    ? 'bg-amber-950/20 border-amber-700/40 text-amber-300 font-bold'
                                    : 'bg-black/20 border-gray-900/60 text-gray-500'
                                }`}
                              >
                                <Star className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${isUnlocked ? 'text-amber-400 fill-amber-400' : 'text-gray-700'}`} />
                                <div>
                                  <p className="font-bold flex items-center gap-1.5">
                                    <span>{milestone.pts} Estrellas ({milestone.pts} Servicios)</span>
                                    {isUnlocked && <span className="text-[8px] bg-emerald-950 border border-emerald-800/40 text-emerald-400 px-1 rounded uppercase tracking-wider">¡Desbloqueado!</span>}
                                  </p>
                                  <p className="text-[9px] leading-tight text-gray-400">{milestone.label}</p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </details>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Información de Pago de Depósito para Confirmación */}
            <div className="bg-gradient-to-br from-[#1e1e1e] to-red-950/20 p-5 rounded-xl border border-red-900/40 space-y-4">
              <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5 border-b border-red-900/30 pb-2">
                <CreditCard className="w-4 h-4 text-red-500" />
                <span>Abona para Asegurar tu Turno (50%)</span>
              </h4>
              <p className="text-[11px] text-gray-300 leading-relaxed">
                Recuerda que para asegurar y confirmar oficialmente tu turno en el calendario de La Facultad, debes hacer el **abono del 50%** por adelantado. ¡No dejes que se te libere el turno!
              </p>

              <div className="space-y-3 pt-1">
                <div className="p-2.5 bg-black/60 rounded border border-gray-800 text-[11px]">
                  <p className="text-amber-400 font-bold uppercase text-[9px] tracking-wider">MÉTODO: ATH MÓVIL</p>
                  <p className="text-white mt-0.5 font-semibold">Enviar al: <span className="text-red-400">787-240-8627</span></p>
                  <p className="text-gray-400 mt-0.5">Concepto: Tu Nombre Artístico + Fecha Sesión</p>
                </div>

                <div className="p-2.5 bg-black/60 rounded border border-gray-800 text-[11px]">
                  <p className="text-emerald-400 font-bold uppercase text-[9px] tracking-wider">MÉTODO: ZELLE</p>
                  <p className="text-white mt-0.5 font-semibold">Correo: <span className="text-red-400">ellentemalo@gmail.com</span></p>
                  <p className="text-gray-400 mt-0.5">A nombre de: La Facultad Studio LLC</p>
                </div>

                <div className="p-2.5 bg-black/60 rounded border border-gray-800 text-[11px]">
                  <p className="text-sky-400 font-bold uppercase text-[9px] tracking-wider">MÉTODO: PAYPAL</p>
                  <p className="text-white mt-0.5 font-semibold">Link directo: <span className="text-red-400 underline">paypal.me/badlenzprod</span></p>
                </div>
              </div>

              <div className="bg-red-950/40 border border-red-900/40 p-2.5 rounded text-[10px] text-red-200">
                ⚠️ Una vez realices el abono, envía tu captura de pantalla al WhatsApp del estudio para validar tu pase VIP de inmediato.
              </div>
            </div>
          </div>

          {/* COLUMNA CENTRAL & DERECHA: PROYECTOS, RESERVAS Y HITOS */}
          <div className="space-y-6 lg:col-span-2">
            
            {/* SECCIÓN RESERVAS Y SESIONES AGENDADAS */}
            <div className="bg-[#1e1e1e] p-5 rounded-xl border border-gray-800 space-y-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Calendar className="w-4 h-4 text-red-500" />
                <span>Mis Reservas de Estudio</span>
              </h3>

              {foundReservas.length === 0 ? (
                <div className="p-6 text-center bg-black/30 rounded-lg border border-gray-800">
                  <p className="text-xs text-gray-500 italic">No tienes reservas activas registradas en la base de datos local.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {foundReservas.map(res => {
                    const balanceColor = res.balance > 0 ? 'text-red-400' : 'text-emerald-400';
                    return (
                      <div key={res.id} className="p-4 rounded-xl bg-[#111827] border border-gray-800 space-y-3 hover:border-gray-700 transition">
                        <div className="flex justify-between items-start flex-wrap gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-mono font-bold text-red-400">{res.id}</span>
                              <span className={`px-2 py-0.5 text-[9px] rounded-md font-bold uppercase ${
                                res.estado === 'Confirmada' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/40' :
                                res.estado === 'Pendiente' ? 'bg-amber-950/80 text-amber-400 border border-amber-900/40' :
                                'bg-slate-800 text-slate-300'
                              }`}>
                                {res.estado}
                              </span>
                            </div>
                            <h4 className="text-xs font-black text-white mt-1 uppercase">
                              SESIÓN DE {res.totalHoras} HORAS EN EL STUDIO
                            </h4>
                          </div>

                          <div className="text-right">
                            <span className="text-[10px] text-gray-500 block font-semibold uppercase">MÉTODO PAGO</span>
                            <span className="text-xs font-bold text-amber-500">{res.metodoPago}</span>
                          </div>
                        </div>

                        {/* Detalles */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs border-y border-gray-800/80 py-2.5">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-gray-400">
                              <Calendar className="w-3.5 h-3.5 text-gray-500" />
                              <span>Fecha: <strong className="text-white">{res.fecha}</strong></span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-400">
                              <Clock className="w-3.5 h-3.5 text-gray-500" />
                              <span>Horario: <strong className="text-white">{format12h(res.horaInicio)} a {format12h(res.horaSalida)}</strong></span>
                            </div>
                          </div>

                          <div className="space-y-1">
                            <div className="flex justify-between text-gray-400">
                              <span>Subtotal:</span>
                              <span className="text-white font-bold">${res.subtotal}.00 USD</span>
                            </div>
                            <div className="flex justify-between text-gray-400">
                              <span>Depósito abonado:</span>
                              <span className="text-emerald-400 font-bold">${res.deposito || 0}.00 USD</span>
                            </div>
                            <div className="flex justify-between text-gray-400 border-t border-gray-800/60 pt-1 mt-1">
                              <span>Balance Pendiente:</span>
                              <span className={`font-extrabold ${balanceColor}`}>${res.balance || 0}.00 USD</span>
                            </div>
                          </div>
                        </div>

                        {/* Servicios solicitados */}
                        <div>
                          <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-1">Servicios Solicitados:</p>
                          <div className="flex flex-wrap gap-1.5">
                            {res.servicios.map((serv, index) => (
                              <span key={index} className="px-2 py-0.5 text-[10px] bg-gray-800 text-gray-300 rounded border border-gray-700">
                                {serv}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* BÓVEDA DE PRE-MEZCLAS (ROUGH MIX) DIRECTA SIN COMPRESIÓN */}
                        <div className="p-2.5 rounded-lg bg-black/60 border border-red-950/60 flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <Music className="w-4 h-4 text-amber-500" />
                            <div>
                              <p className="text-[11px] font-bold text-white">
                                {res.roughMixNombre || `${res.nombreArtistico || 'Tema'}_Rough_Mix_Studio.wav`}
                              </p>
                              <span className="text-[9px] text-gray-400 font-mono">
                                24-bit Pre-mix • HD WAV (Directo de Pro Tools)
                              </span>
                            </div>
                          </div>
                          <a
                            href="https://actions.google.com/sounds/v1/musical_tracks/hip_hop_track.ogg"
                            download={`${res.nombreArtistico || 'Tema'}_Rough_Mix.wav`}
                            target="_blank"
                            rel="noreferrer"
                            className="bg-red-700 hover:bg-red-600 text-white font-black px-2.5 py-1 rounded text-[10px] uppercase tracking-wider flex items-center gap-1 shadow transition active:scale-95"
                          >
                            <Download className="w-3 h-3 text-amber-300" />
                            <span>Descargar WAV</span>
                          </a>
                        </div>

                        {/* ACCIONES OPERATIVAS: REAGENDAR (REGLA 48H) Y SUBIR COMPROBANTE ATH */}
                        <div className="pt-2 border-t border-gray-800 flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5">
                            {res.comprobanteNumReferencia ? (
                              <span className="text-[10px] bg-emerald-950/80 text-emerald-400 border border-emerald-800/60 px-2 py-0.5 rounded font-mono font-bold flex items-center gap-1">
                                <Check className="w-3 h-3" />
                                ATH Ref: {res.comprobanteNumReferencia}
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  setReservaParaComprobante(res);
                                  setAthNumRef('');
                                  setAthComprobanteFile(null);
                                  setAthComprobanteNombre('');
                                }}
                                className="text-[10px] bg-amber-950 hover:bg-amber-900 text-amber-300 border border-amber-800/80 px-2 py-1 rounded font-bold uppercase transition flex items-center gap-1 shadow-sm"
                              >
                                <Camera className="w-3 h-3 text-amber-400" />
                                <span>Subir Comprobante ATH</span>
                              </button>
                            )}

                            {res.reagendadoDeFecha && (
                              <span className="text-[9px] text-cyan-400 font-mono bg-cyan-950/40 px-1.5 py-0.5 rounded border border-cyan-800/40">
                                ↺ Reagendada (Antes: {res.reagendadoDeFecha})
                              </span>
                            )}
                          </div>

                          {/* Botón Reagendar Cita con evaluación de 48 horas */}
                          {res.estado !== 'Cancelada' && res.estado !== 'Completada' && (
                            <button
                              type="button"
                              onClick={() => {
                                setReservaParaReagendar(res);
                                setNuevaFechaReagendar(res.fecha);
                                setNuevoHorarioReagendar(`${res.horaInicio} - ${res.horaSalida}`);
                              }}
                              className="text-[10px] bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700 px-2.5 py-1 rounded font-bold uppercase transition flex items-center gap-1"
                              title="Solicitar cambio de fecha bajo la política de 48 horas"
                            >
                              <RotateCcw className="w-3 h-3 text-red-400" />
                              <span>Reagendar Sesión (Regla 48h)</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* SECCIÓN PROYECTOS CREATIVOS & BÓVEDA VIP (ENTREGA FINAL) */}
            <div className="space-y-6">
              {foundProjects.length === 0 ? (
                <div className="bg-[#1e1e1e] p-8 text-center rounded-2xl border border-gray-800 space-y-2">
                  <div className="p-3 bg-red-950/40 border border-red-800 rounded-full w-12 h-12 flex items-center justify-center mx-auto text-red-400">
                    <Music className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-white uppercase">Sin canciones terminadas aún</h4>
                  <p className="text-xs text-gray-500 max-w-md mx-auto leading-relaxed">
                    No se encontraron proyectos activos vinculados con este criterio. Si acabas de grabar en el studio, tu proyecto aparecerá en la Bóveda en cuanto Badlenz inicie la fase de mezcla.
                  </p>
                </div>
              ) : (
                foundProjects.map(proj => (
                  <div key={proj.id} className="space-y-4">
                    {/* HUB OFICIAL DE ENTREGABLES & STATE MACHINE DE 4 ETAPAS */}
                    <BovedaVipDelivery
                      project={proj}
                      onUpdateProject={(updatedProj) => {
                        setFoundProjects(prev => prev.map(p => p.id === updatedProj.id ? updatedProj : p));
                        if (onUpdateProject) {
                          onUpdateProject(updatedProj);
                        }
                      }}
                      onRequestPayment={(p) => {
                        setProjectParaLiquidar(p);
                        setAthNumRef('');
                        setAthComprobanteFile(null);
                        setAthComprobanteNombre('');
                      }}
                    />

                    {/* FEEDBACK DE MEZCLA POR TIMESTAMPS VINCULADO AL REPRODUCTOR */}
                    <div className="bg-[#18181b] p-5 rounded-2xl border border-gray-800 shadow-xl space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-800 pb-3">
                        <h5 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                          <MessageSquare className="w-4 h-4 text-red-500" />
                          <span>AJUSTES DE MEZCLA POR SEGUNDO • FEEDBACK OFICIAL</span>
                        </h5>
                        <span className="text-[9px] bg-red-950/60 border border-red-800/60 text-amber-300 px-2 py-0.5 rounded font-mono uppercase font-bold self-start sm:self-auto">
                          2 Revisiones Incluidas en tu Paquete
                        </span>
                      </div>

                      <p className="text-[10px] text-gray-400 leading-relaxed">
                        Ingresa observaciones vinculadas a un segundo exacto de la canción. El productor Badlenz procesará tus notas con precisión milimétrica de estudio.
                      </p>

                      {/* Lista de feedbacks actuales */}
                      {(() => {
                        const projectFeedback = feedbacks.find(f => f.proyectoId === proj.id);
                        const items = projectFeedback ? projectFeedback.items : [];
                        return (
                          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                            {items.length === 0 ? (
                              <p className="text-[10px] text-gray-500 italic bg-black/20 border border-gray-900/60 p-3 rounded-xl text-center">
                                Sin observaciones registradas para este tema. ¡Utiliza el formulario de abajo para agregar tu primer ajuste con timestamp!
                              </p>
                            ) : (
                              items.map((it: any) => (
                                <div 
                                  key={it.id} 
                                  className={`flex items-start justify-between gap-3 p-2.5 rounded-xl text-[11px] border transition-all ${
                                    it.completado 
                                      ? 'bg-emerald-950/10 border-emerald-900/30 text-gray-400 line-through decoration-emerald-800/40' 
                                      : 'bg-black/40 border-gray-800 text-gray-300'
                                  }`}
                                >
                                  <div className="flex items-start gap-2.5 min-w-0">
                                    <span className={`px-2 py-0.5 text-[9px] font-mono font-bold rounded shrink-0 ${
                                      it.completado
                                        ? 'bg-emerald-900/40 text-emerald-400 border border-emerald-800/30'
                                        : 'bg-red-950 text-red-400 border border-red-900/40'
                                    }`}>
                                      ⏱️ {it.timestamp}
                                    </span>
                                    <span className="break-words leading-snug">{it.comentario}</span>
                                  </div>

                                  <div className="flex items-center gap-2 shrink-0">
                                    {it.completado ? (
                                      <span className="text-[9px] text-emerald-400 bg-emerald-950/40 border border-emerald-800/30 px-1.5 py-0.5 rounded font-extrabold uppercase tracking-widest flex items-center gap-0.5">
                                        <Check className="w-2.5 h-2.5" /> Aplicado
                                      </span>
                                    ) : (
                                      <span className="text-[9px] text-amber-400 bg-amber-950/40 border border-amber-900/30 px-1.5 py-0.5 rounded font-extrabold uppercase tracking-widest">
                                        Pendiente
                                      </span>
                                    )}
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveFeedbackItem(proj.id, it.id)}
                                      className="text-gray-500 hover:text-red-400 p-1 rounded transition cursor-pointer"
                                      title="Eliminar observación"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        );
                      })()}

                      {/* Formulario de Agregar Feedback */}
                      <div className="bg-black/50 border border-gray-800 p-3 rounded-xl space-y-2">
                        <p className="text-[9px] text-gray-500 uppercase font-black tracking-widest">Agregar Nota de Ajuste:</p>
                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                          <div className="sm:col-span-4">
                            <div className="flex gap-1.5">
                              <input
                                type="text"
                                placeholder="Min:Seg (ej: 01:24)"
                                className="flex-1 bg-[#111827] border border-gray-700 rounded-lg p-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-red-500 font-mono text-center"
                                value={fbTimestamp}
                                onChange={e => setFbTimestamp(e.target.value)}
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const mins = Math.floor(currentPlayingSeconds / 60);
                                  const secs = Math.floor(currentPlayingSeconds % 60);
                                  setFbTimestamp(`${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`);
                                }}
                                className="px-2.5 py-2 bg-amber-500 hover:bg-amber-400 text-gray-950 font-black rounded-lg text-[10px] uppercase whitespace-nowrap transition active:scale-95 cursor-pointer"
                                title="Capturar segundo actual en reproducción"
                              >
                                ⏱️ Capturar
                              </button>
                            </div>
                          </div>
                          <div className="sm:col-span-6">
                            <input
                              type="text"
                              placeholder="Ej: Bajarle un poco al reverb en este verso..."
                              className="w-full bg-[#111827] border border-gray-700 rounded-lg p-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-red-500"
                              value={fbComment}
                              onChange={e => setFbComment(e.target.value)}
                            />
                          </div>
                          <div className="sm:col-span-2">
                            <button
                              type="button"
                              onClick={() => handleAddFeedbackItem(proj.id, proj.nombre)}
                              className="w-full bg-red-700 hover:bg-red-600 text-white font-bold py-2 rounded-lg text-xs uppercase tracking-wider transition flex items-center justify-center gap-1 cursor-pointer active:scale-95"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Añadir</span>
                            </button>
                          </div>
                        </div>
                        {fbError && (
                          <p className="text-[10px] text-red-400 font-medium flex items-center gap-1 pt-1">
                            <AlertCircle className="w-3 h-3 shrink-0" />
                            <span>{fbError}</span>
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* MODAL PARA LIQUIDAR SALDO CON ATH MÓVIL DIRECTO Y DESBLOQUEAR MASTER WAV / STEMS */}
            {projectParaLiquidar && (
              <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="bg-[#1e1e1e] border border-gray-700 w-full max-w-md rounded-2xl p-5 space-y-4 shadow-2xl animate-fadeIn">
                  <div className="flex justify-between items-center border-b border-gray-800 pb-3">
                    <div className="flex items-center gap-2">
                      <Smartphone className="w-5 h-5 text-emerald-400" />
                      <h4 className="text-sm font-black text-white uppercase tracking-wider">
                        Liquidar Saldo • ATH Móvil
                      </h4>
                    </div>
                    <button
                      type="button"
                      onClick={() => setProjectParaLiquidar(null)}
                      className="text-gray-400 hover:text-white text-sm"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="bg-black/60 p-3.5 rounded-xl border border-gray-800 text-xs space-y-1.5">
                    <div className="flex justify-between text-gray-400">
                      <span>Proyecto:</span>
                      <strong className="text-white font-mono">{projectParaLiquidar.nombre}</strong>
                    </div>
                    <div className="flex justify-between text-gray-400">
                      <span>Balance Pendiente a Liquidar:</span>
                      <strong className="text-amber-400 font-mono text-sm">${projectParaLiquidar.balancePendiente || 0}.00 USD</strong>
                    </div>
                    <div className="flex justify-between text-gray-400 pt-1 border-t border-gray-800">
                      <span>Enviar ATH Móvil al:</span>
                      <strong className="text-red-400 font-mono font-bold text-sm">787-240-8627</strong>
                    </div>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div>
                      <label className="block text-[10px] text-gray-400 uppercase font-bold mb-1">
                        1. Número de Confirmación ATH Móvil
                      </label>
                      <input
                        type="text"
                        placeholder="Ej: ATH-991823 o últimos dígitos de referencia"
                        value={athNumRef}
                        onChange={(e) => setAthNumRef(e.target.value)}
                        className="w-full bg-[#111827] border border-gray-700 rounded-lg p-2.5 text-white font-mono outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] text-gray-400 uppercase font-bold mb-1">
                        2. Captura de Pantalla del Recibo (Opcional)
                      </label>
                      <label className="block cursor-pointer bg-black/60 hover:bg-gray-800 border border-dashed border-gray-700 hover:border-gray-500 rounded-xl p-3 text-center transition">
                        <Camera className="w-5 h-5 text-amber-400 mx-auto mb-1" />
                        <span className="text-[11px] text-gray-300 block truncate">
                          {athComprobanteNombre || 'Toca aquí para seleccionar captura de ATH Móvil'}
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            const reader = new FileReader();
                            reader.onload = () => {
                              setAthComprobanteFile(reader.result as string);
                              setAthComprobanteNombre(file.name);
                            };
                            reader.readAsDataURL(file);
                          }}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2 border-t border-gray-800">
                    <button
                      type="button"
                      onClick={() => setProjectParaLiquidar(null)}
                      className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold py-2.5 rounded-xl text-xs uppercase"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (!athNumRef.trim() && !athComprobanteFile) {
                          alert('Por favor ingresa el número de referencia de ATH Móvil.');
                          return;
                        }

                        // Update project balance to 0 and unlock downloads
                        const updated: StudioProject = {
                          ...projectParaLiquidar,
                          balancePendiente: 0,
                          depositoPagado: projectParaLiquidar.montoTotal
                        };

                        setFoundProjects(prev => prev.map(p => p.id === updated.id ? updated : p));
                        if (onUpdateProject) {
                          onUpdateProject(updated);
                        }

                        setProjectParaLiquidar(null);
                        alert('✅ ¡Saldo liquidado exitosamente! Tu Máster WAV 24-bit y Stems han sido desbloqueados.');
                      }}
                      className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 font-black py-2.5 rounded-xl text-xs uppercase text-white shadow-lg active:scale-95 cursor-pointer"
                    >
                      Confirmar y Desbloquear
                    </button>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      {/* FOOTER POLICIES */}
      <div className="bg-[#1e1e1e] p-5 rounded-xl border border-gray-800/80 text-center max-w-3xl mx-auto space-y-1">
        <p className="text-xs text-slate-300 font-bold">La Facultad Studio LLC &copy; 2026. Todos los derechos reservados.</p>
        <p className="text-[10px] text-gray-500 leading-relaxed">
          Las cotizaciones son válidas por 15 días hábiles a partir de su emisión. Las reservas de espacio requieren el depósito correspondiente. Toda reprogramación debe notificarse con al menos 48 horas de anticipación.
        </p>
      </div>

    </div>
  );
};

export default PortalArtista;
