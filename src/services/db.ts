import { db, auth } from '../firebase';
import { collection, doc, setDoc, deleteDoc, onSnapshot, getDocs } from 'firebase/firestore';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export interface Cliente {
  id: string;
  nombreArtistico: string;
  nombreReal: string;
  email: string;
  telefono: string;
  instagram: string;
  fechaCreacion: string;
}

export interface Reserva {
  id: string;
  clienteId: string;
  nombreArtistico: string;
  fecha: string; // Fecha principal o primera fecha
  fechasBloque?: string[]; // Array de fechas para reservas recurrentes / en bloque
  horaInicio: string;
  horaSalida: string;
  totalHoras: number;
  servicios: string[];
  metodoPago: 'Efectivo' | 'ATH Movil' | 'PayPal' | 'Zelle';
  subtotal: number;
  deposito: number;
  balance: number;
  estado: 'Pendiente' | 'Confirmada' | 'En Proceso' | 'Completada' | 'Cancelada' | 'Liberada';
  depositoEstado?: 'depositado' | 'pendiente' | 'paga_en_sesion';
  firma?: string;
  // Campos de Operaciones: Temporizador de 30 min, comprobante ATH y reagendamiento
  creadoEn?: number; // timestamp ms
  comprobanteAthUrl?: string; // base64 o link de imagen
  comprobanteNumReferencia?: string; // número de confirmación ATH Móvil
  reagendadoDeFecha?: string; // historial de reagendamiento si se movió de fecha
  motivoCancelacion?: string;
  // Bóveda de temas y preview de pre-mezcla (Rough Mix)
  roughMixUrl?: string;
  roughMixNombre?: string;
  tipoProyecto?: 'single' | 'ep_3_tracks' | 'ep_5_tracks' | 'album_completo' | 'pack_semanal';
  detallesTracklist?: string[];
}

const STORAGE_KEY_CLIENTES = 'la_facultad_clientes_db';
const STORAGE_KEY_RESERVAS = 'la_facultad_reservas_db';

// Real-time listener initialization for Firestore
try {
  onSnapshot(collection(db, 'clientes'), (snapshot) => {
    const list: Cliente[] = [];
    snapshot.forEach(d => list.push(d.data() as Cliente));
    if (list.length > 0) {
      localStorage.setItem(STORAGE_KEY_CLIENTES, JSON.stringify(list));
    }
  }, (err) => {
    console.warn('Firestore Clientes sync offline mode:', err.message);
  });

  onSnapshot(collection(db, 'reservas'), (snapshot) => {
    const list: Reserva[] = [];
    snapshot.forEach(d => list.push(d.data() as Reserva));
    if (list.length > 0) {
      localStorage.setItem(STORAGE_KEY_RESERVAS, JSON.stringify(list));
    }
  }, (err) => {
    console.warn('Firestore Reservas sync offline mode:', err.message);
  });
} catch (e) {
  console.warn('Firestore background listener initialization notice:', e);
}

// --- GESTIÓN DE CLIENTES ---
export const getClientes = (): Cliente[] => {
  const data = localStorage.getItem(STORAGE_KEY_CLIENTES);
  return data ? JSON.parse(data) : [];
};

export const guardarCliente = (clienteData: Omit<Cliente, 'id' | 'fechaCreacion'>): Cliente => {
  const clientes = getClientes();
  const existe = clientes.find(c => c.email === clienteData.email || c.nombreArtistico === clienteData.nombreArtistico);
  
  if (existe) {
    return existe; // Retorna el cliente existente si ya está registrado
  }

  const nuevoCliente: Cliente = {
    ...clienteData,
    id: `CLI-${Date.now().toString().slice(-4)}`,
    fechaCreacion: new Date().toISOString().split('T')[0]
  };

  clientes.push(nuevoCliente);
  localStorage.setItem(STORAGE_KEY_CLIENTES, JSON.stringify(clientes));

  // Sync to Firestore
  setDoc(doc(db, 'clientes', nuevoCliente.id), nuevoCliente).catch(err => {
    console.warn('Firestore guardarCliente async save notice:', err);
  });

  return nuevoCliente;
};

// --- GESTIÓN DE RESERVAS Y ORDENES ---
export const getReservas = (): Reserva[] => {
  const data = localStorage.getItem(STORAGE_KEY_RESERVAS);
  return data ? JSON.parse(data) : [];
};

export const guardarReserva = (reservaData: Omit<Reserva, 'id' | 'estado' | 'metodoPago'> & { estado?: Reserva['estado'], metodoPago?: 'Efectivo' | 'ATH Movil' | 'PayPal' | 'Zelle' }): Reserva => {
  const reservas = getReservas();
  
  const cleanName = (reservaData.nombreArtistico || 'ARTISTA')
    .toUpperCase()
    .trim()
    .replace(/[^A-Z0-9]/g, '_')
    .replace(/__+/g, '_');
  
  const baseId = `PS_${cleanName}`;
  
  let uniqueId = baseId;
  let counter = 1;
  while (reservas.some(r => r.id === uniqueId)) {
    uniqueId = `${baseId}_${counter}`;
    counter++;
  }

  const nuevaReserva: Reserva = {
    metodoPago: 'Efectivo',
    estado: 'Pendiente',
    depositoEstado: 'pendiente',
    creadoEn: Date.now(),
    ...reservaData,
    id: uniqueId
  } as Reserva;

  if (reservaData.estado) {
    nuevaReserva.estado = reservaData.estado;
  }

  reservas.push(nuevaReserva);
  localStorage.setItem(STORAGE_KEY_RESERVAS, JSON.stringify(reservas));

  // Sync to Firestore
  setDoc(doc(db, 'reservas', nuevaReserva.id), nuevaReserva).catch(err => {
    console.warn('Firestore guardarReserva async save notice:', err);
  });

  return nuevaReserva;
};

// --- OPERACIONES AVANZADAS DE ADMINISTRACIÓN ---
export const actualizarReserva = (id: string, updates: Partial<Reserva>): Reserva[] => {
  const reservas = getReservas();
  const index = reservas.findIndex(r => r.id === id);
  if (index !== -1) {
    const updated = { ...reservas[index], ...updates };
    reservas[index] = updated;
    localStorage.setItem(STORAGE_KEY_RESERVAS, JSON.stringify(reservas));
    setDoc(doc(db, 'reservas', id), updated, { merge: true }).catch(err => {
      console.warn('Firestore actualizarReserva async update notice:', err);
    });
  }
  return reservas;
};

export const eliminarReserva = (id: string): Reserva[] => {
  const reservas = getReservas();
  const filtradas = reservas.filter(r => r.id !== id);
  localStorage.setItem(STORAGE_KEY_RESERVAS, JSON.stringify(filtradas));
  deleteDoc(doc(db, 'reservas', id)).catch(err => {
    console.warn('Firestore eliminarReserva async delete notice:', err);
  });
  return filtradas;
};

export const actualizarCliente = (id: string, updates: Partial<Cliente>): Cliente[] => {
  const clientes = getClientes();
  const index = clientes.findIndex(c => c.id === id);
  if (index !== -1) {
    const updated = { ...clientes[index], ...updates };
    clientes[index] = updated;
    localStorage.setItem(STORAGE_KEY_CLIENTES, JSON.stringify(clientes));
    setDoc(doc(db, 'clientes', id), updated, { merge: true }).catch(err => {
      console.warn('Firestore actualizarCliente async update notice:', err);
    });
  }
  return clientes;
};

export const eliminarCliente = (id: string): Cliente[] => {
  const clientes = getClientes();
  const filtrados = clientes.filter(c => c.id !== id);
  localStorage.setItem(STORAGE_KEY_CLIENTES, JSON.stringify(filtrados));
  deleteDoc(doc(db, 'clientes', id)).catch(err => {
    console.warn('Firestore eliminarCliente async delete notice:', err);
  });
  return filtrados;
};

// --- CONFIGURACIÓN DE UBICACIÓN Y REGLAS DE ESTUDIO EN HORMIGUEROS ---
export interface StudioConfig {
  googleMapsLocationUrl: string;
  wazeLocationUrl: string;
  direccionTexto: string;
  instruccionesEstacionamiento: string;
  maxAcompanantes: number;
  politicaEntregaTexto: string;
}

const STORAGE_KEY_STUDIO_CONFIG = 'la_facultad_studio_config_db';

export const DEFAULT_STUDIO_CONFIG: StudioConfig = {
  googleMapsLocationUrl: 'https://maps.google.com/?q=Hormigueros+Puerto+Rico',
  wazeLocationUrl: 'https://waze.com/ul?ll=18.1397,-67.1274',
  direccionTexto: 'Hormigueros, Puerto Rico (Sector Central)',
  instruccionesEstacionamiento: 'Estacionamiento privado exclusivo disponible frente a las instalaciones del estudio. Favor de estacionar de frente en los espacios rotulados.',
  maxAcompanantes: 2,
  politicaEntregaTexto: 'Rough Mix MP3/WAV inmediato al finalizar las 4 horas de sesión. De 24 a 72 horas se entrega la mezcla y el máster completo en tu Bóveda VIP.'
};

export const getStudioConfig = (): StudioConfig => {
  const data = localStorage.getItem(STORAGE_KEY_STUDIO_CONFIG);
  if (!data) return DEFAULT_STUDIO_CONFIG;
  try {
    return { ...DEFAULT_STUDIO_CONFIG, ...JSON.parse(data) };
  } catch {
    return DEFAULT_STUDIO_CONFIG;
  }
};

export const guardarStudioConfig = (config: Partial<StudioConfig>): StudioConfig => {
  const current = getStudioConfig();
  const updated = { ...current, ...config };
  localStorage.setItem(STORAGE_KEY_STUDIO_CONFIG, JSON.stringify(updated));
  window.dispatchEvent(new Event('la_facultad_config_updated'));
  setDoc(doc(db, 'studio_config', 'main'), updated, { merge: true }).catch(err => {
    console.warn('Firestore guardarStudioConfig notice:', err);
  });
  return updated;
};

// --- OPERACIONES DE FEEDBACK POR TIMESTAMPS ---
const STORAGE_KEY_FEEDBACKS = 'la_facultad_song_feedbacks_db';

export const getSongFeedbacks = (): any[] => {
  const data = localStorage.getItem(STORAGE_KEY_FEEDBACKS);
  const wasReset = localStorage.getItem('la_facultad_was_reset') === 'true';
  if (!data) {
    if (wasReset) return [];
    const seed: any[] = [
      {
        id: 'fb-1',
        proyectoId: 'proj-1',
        nombreProyecto: 'EP "Noches de Estudio" (4 Temas)',
        nombreArtistico: 'BADLENZ',
        fecha: '2026-08-03',
        items: [
          {
            id: 'it-1',
            timestamp: '01:24',
            comentario: 'La reverberación de la voz principal está muy alta aquí.',
            completado: false,
            fechaCreacion: '2026-08-03'
          },
          {
            id: 'it-2',
            timestamp: '02:05',
            comentario: 'Subir 1.5dB al redoblante (snare) para darle más pegada.',
            completado: true,
            fechaCreacion: '2026-08-03'
          },
          {
            id: 'it-3',
            timestamp: '03:12',
            comentario: 'El paneo del sintetizador en el outro se siente un poco descompensado a la izquierda.',
            completado: false,
            fechaCreacion: '2026-08-03'
          }
        ]
      }
    ];
    localStorage.setItem(STORAGE_KEY_FEEDBACKS, JSON.stringify(seed));
    return seed;
  }
  return JSON.parse(data);
};

export const guardarSongFeedback = (feedback: any): any[] => {
  const feedbacks = getSongFeedbacks();
  const index = feedbacks.findIndex(f => f.id === feedback.id || (f.proyectoId === feedback.proyectoId && f.proyectoId && f.proyectoId !== 'TEMP-ART'));
  if (index !== -1) {
    feedbacks[index] = { ...feedbacks[index], ...feedback };
  } else {
    feedbacks.push(feedback);
  }
  localStorage.setItem(STORAGE_KEY_FEEDBACKS, JSON.stringify(feedbacks));
  return feedbacks;
};

// --- GESTIÓN DE ESPACIOS PROMO REAPERTURA (LÍMITE OFICIAL: 6 ESPACIOS) ---
const STORAGE_KEY_PROMO_SLOTS = 'la_facultad_promo_slots_db';
const TOTAL_PROMO_LIMIT = 6;

export const getPromoSlotsCount = (): { total: number; reservados: number; disponibles: number } => {
  const reservas = getReservas();
  // Contar reservas activas (no canceladas) que usaron la Promo Reapertura
  const promoReservas = reservas.filter(
    r => r.estado !== 'Cancelada' && (
      r.servicios.some(s => s.toLowerCase().includes('promo') || s.toLowerCase().includes('reapertura')) ||
      (r.subtotal === 130 && r.deposito === 50)
    )
  );
  
  // También verificar si hay un override manual o inicial
  const savedReservados = localStorage.getItem(STORAGE_KEY_PROMO_SLOTS);
  const baseReservados = savedReservados !== null ? parseInt(savedReservados, 10) : 2; // Inicia con 2 reservados por defecto (4 disponibles)
  
  const reservados = Math.min(TOTAL_PROMO_LIMIT, Math.max(baseReservados, promoReservas.length));
  const disponibles = Math.max(0, TOTAL_PROMO_LIMIT - reservados);

  return {
    total: TOTAL_PROMO_LIMIT,
    reservados,
    disponibles
  };
};

export const setPromoSlotsReservadosManual = (count: number) => {
  const safeCount = Math.max(0, Math.min(TOTAL_PROMO_LIMIT, count));
  localStorage.setItem(STORAGE_KEY_PROMO_SLOTS, String(safeCount));
  window.dispatchEvent(new Event('la_facultad_promo_slots_updated'));
};

// --- GESTIÓN DE PISTAS DEL REPRODUCTOR A/B (DEMOS ANTES Y DESPUÉS) ---
export interface ShowcaseTrack {
  id: string;
  title: string;
  artist: string;
  genre: string;
  bpm: number;
  descriptionA: string; // Versión Cruda / Sin Mezclar
  descriptionB: string; // Versión Masterizada (Badlenz Master)
  audioAUrl?: string;   // URL o base64 de audio versión A (Cruda)
  audioBUrl?: string;   // URL o base64 de audio versión B (Master)
}

const STORAGE_KEY_SHOWCASE_TRACKS = 'la_facultad_showcase_tracks_db';

export const DEFAULT_SHOWCASE_TRACKS: ShowcaseTrack[] = [
  {
    id: 'track-zyron-tukutu',
    title: 'Tukutu',
    artist: 'Zyron',
    genre: 'Reggaetón / Urbano',
    bpm: 96,
    descriptionA: 'Referencia de maqueta sin ecualización comercial ni compresión.',
    descriptionB: 'Mezcla multitrack, afinación vocal y master comercial por Badlenz.',
    audioAUrl: '/zyron-tukutu-reff.mp3',
    audioBUrl: '/zyron-tukutu-master.m4a'
  }
];

export const getShowcaseTracks = (): ShowcaseTrack[] => {
  const data = localStorage.getItem(STORAGE_KEY_SHOWCASE_TRACKS);
  if (!data) return DEFAULT_SHOWCASE_TRACKS;
  try {
    let parsed: ShowcaseTrack[] = JSON.parse(data);
    if (!Array.isArray(parsed) || parsed.length === 0) return DEFAULT_SHOWCASE_TRACKS;

    // Buscar si existe el tema de Zyron Tukutu
    const zyronTrack = parsed.find(t => 
      t.title.toLowerCase().includes('tukutu') || 
      t.artist.toLowerCase().includes('zyron') ||
      t.id.includes('zyron')
    );

    if (zyronTrack) {
      // Vincular los archivos oficiales de public si no están configurados o apuntaban a llaves viejas
      if (!zyronTrack.audioAUrl || zyronTrack.audioAUrl.includes('track_zyron') || zyronTrack.audioAUrl === '') {
        zyronTrack.audioAUrl = '/zyron-tukutu-reff.mp3';
      }
      if (!zyronTrack.audioBUrl || zyronTrack.audioBUrl.includes('track_zyron') || zyronTrack.audioBUrl.includes('zyron-tukutu-master.wav') || zyronTrack.audioBUrl === '') {
        zyronTrack.audioBUrl = '/zyron-tukutu-master.m4a';
      }
      zyronTrack.descriptionA = zyronTrack.descriptionA || 'Referencia de maqueta sin ecualización comercial ni compresión.';
      zyronTrack.descriptionB = zyronTrack.descriptionB || 'Mezcla multitrack, afinación vocal y master comercial por Badlenz.';

      parsed = [zyronTrack];
      try {
        localStorage.setItem(STORAGE_KEY_SHOWCASE_TRACKS, JSON.stringify(parsed));
      } catch {}
      return parsed;
    }

    parsed = [...DEFAULT_SHOWCASE_TRACKS];
    try {
      localStorage.setItem(STORAGE_KEY_SHOWCASE_TRACKS, JSON.stringify(parsed));
    } catch {}
    return parsed;
  } catch {
    return DEFAULT_SHOWCASE_TRACKS;
  }
};

export const eliminarShowcaseTrack = (id: string): ShowcaseTrack[] => {
  let tracks = getShowcaseTracks().filter(t => t.id !== id);
  if (tracks.length === 0) {
    tracks = [...DEFAULT_SHOWCASE_TRACKS];
  }
  try {
    localStorage.setItem(STORAGE_KEY_SHOWCASE_TRACKS, JSON.stringify(tracks));
  } catch (e) {
    console.error('Error saving after delete:', e);
  }
  window.dispatchEvent(new Event('la_facultad_showcase_updated'));
  deleteDoc(doc(db, 'showcase_tracks', id)).catch(err => console.warn('Firestore delete warning:', err));
  return tracks;
};

export const guardarShowcaseTrack = (track: ShowcaseTrack): ShowcaseTrack[] => {
  const tracks = getShowcaseTracks();
  const index = tracks.findIndex(t => t.id === track.id);
  if (index !== -1) {
    tracks[index] = track;
  } else {
    tracks.push(track);
  }

  try {
    localStorage.setItem(STORAGE_KEY_SHOWCASE_TRACKS, JSON.stringify(tracks));
  } catch (storageError) {
    console.warn('LocalStorage quota exceeded for showcase tracks, saving lightweight references:', storageError);
    // Si localStorage se llena, guardar versión con referencias seguras
    const lightweightTracks = tracks.map(t => ({
      ...t,
      audioAUrl: t.audioAUrl && t.audioAUrl.length > 1000 ? `indexeddb://${t.id}_A` : t.audioAUrl,
      audioBUrl: t.audioBUrl && t.audioBUrl.length > 1000 ? `indexeddb://${t.id}_B` : t.audioBUrl,
    }));
    try {
      localStorage.setItem(STORAGE_KEY_SHOWCASE_TRACKS, JSON.stringify(lightweightTracks));
    } catch (e) {
      console.error('No se pudo guardar en localStorage:', e);
    }
  }

  window.dispatchEvent(new Event('la_facultad_showcase_updated'));

  // Para Firestore, evitar subir datos pesados > 1MB
  const firestoreTrack: any = { ...track };
  if (firestoreTrack.audioAUrl && firestoreTrack.audioAUrl.length > 500000) {
    firestoreTrack.audioAUrl = '';
  }
  if (firestoreTrack.audioBUrl && firestoreTrack.audioBUrl.length > 500000) {
    firestoreTrack.audioBUrl = '';
  }

  setDoc(doc(db, 'showcase_tracks', track.id), firestoreTrack).catch(err => {
    console.warn('Firestore guardarShowcaseTrack async save notice:', err);
  });

  return tracks;
};

// --- FUNCIÓN DE RESETEO COMPLETO PARA PRODUCCIÓN ---
export const vaciarBaseDeDatosCompleta = () => {
  localStorage.setItem(STORAGE_KEY_CLIENTES, JSON.stringify([]));
  localStorage.setItem(STORAGE_KEY_RESERVAS, JSON.stringify([]));
  localStorage.setItem(STORAGE_KEY_FEEDBACKS, JSON.stringify([]));
  localStorage.setItem(STORAGE_KEY_SHOWCASE_TRACKS, JSON.stringify(DEFAULT_SHOWCASE_TRACKS));
  localStorage.setItem('la_facultad_proyectos_db', JSON.stringify([]));
  localStorage.setItem('la_facultad_disponibilidad_personalizada_db', JSON.stringify({}));
  localStorage.setItem('la_facultad_was_reset', 'true');
  window.dispatchEvent(new Event('la_facultad_db_reset'));
};

// --- GESTIÓN DE MODOS: MODO DEMO VS MODO LANZAMIENTO ---
export type AppOperationMode = 'demo' | 'lanzamiento';

export const getAppOperationMode = (): AppOperationMode => {
  const mode = localStorage.getItem('la_facultad_app_mode');
  return (mode === 'lanzamiento') ? 'lanzamiento' : 'demo';
};

export const setAppOperationMode = (mode: AppOperationMode) => {
  localStorage.setItem('la_facultad_app_mode', mode);
  window.dispatchEvent(new Event('la_facultad_app_mode_changed'));
};

export const inicializarModoDemo = async () => {
  setAppOperationMode('demo');
  localStorage.removeItem('la_facultad_was_reset');

  const demoClientes: Cliente[] = [
    {
      id: 'CLI-8820',
      nombreArtistico: 'BADLENZ / El King',
      nombreReal: 'Carlos Arturo Mendoza',
      email: 'ellentemalo@gmail.com',
      telefono: '+1 (787) 240-8627',
      instagram: '@badlenz_official',
      fechaCreacion: '2026-08-01'
    },
    {
      id: 'CLI-9912',
      nombreArtistico: 'Valeria R.',
      nombreReal: 'Valeria Ramos',
      email: 'valeria.ramos@gmail.com',
      telefono: '+1 (787) 555-0192',
      instagram: '@valeria_music',
      fechaCreacion: '2026-08-05'
    },
    {
      id: 'CLI-1023',
      nombreArtistico: 'Kavita',
      nombreReal: 'Kavita Beats',
      email: 'kavita.beats@gmail.com',
      telefono: '+1 (787) 555-0144',
      instagram: '@kavita_beats',
      fechaCreacion: '2026-08-10'
    }
  ];

  const demoReservas: Reserva[] = [
    {
      id: 'PS_BADLENZ_PROMO',
      clienteId: 'CLI-8820',
      nombreArtistico: 'BADLENZ',
      fecha: '2026-10-15',
      horaInicio: '14:00',
      horaSalida: '18:00',
      totalHoras: 4,
      servicios: ['Promo Reapertura: 4 Horas de Sesión (Pase VIP)'],
      metodoPago: 'ATH Movil',
      subtotal: 130,
      deposito: 50,
      balance: 80,
      estado: 'Confirmada',
      depositoEstado: 'depositado',
      creadoEn: Date.now() - 86400000,
      roughMixUrl: '',
      roughMixNombre: 'Leyenda_Rough_Mix_V1.mp3',
      tipoProyecto: 'single',
      detallesTracklist: ['Leyenda (Single 2026)']
    },
    {
      id: 'PS_VALERIA_REGGAETON',
      clienteId: 'CLI-9912',
      nombreArtistico: 'Valeria R.',
      fecha: '2026-10-18',
      horaInicio: '10:00',
      horaSalida: '14:00',
      totalHoras: 4,
      servicios: ['Grabación de Voces', 'Mezcla & Masterización'],
      metodoPago: 'PayPal',
      subtotal: 200,
      deposito: 100,
      balance: 100,
      estado: 'Pendiente',
      depositoEstado: 'pendiente',
      creadoEn: Date.now() - 3600000 * 5
    },
    {
      id: 'PS_KAVITA_BEAT',
      clienteId: 'CLI-1023',
      nombreArtistico: 'Kavita',
      fecha: '2026-10-12',
      horaInicio: '16:00',
      horaSalida: '20:00',
      totalHoras: 4,
      servicios: ['Servicio de Beats / Pistas'],
      metodoPago: 'Efectivo',
      subtotal: 150,
      deposito: 150,
      balance: 0,
      estado: 'Completada',
      depositoEstado: 'depositado',
      creadoEn: Date.now() - 3600000 * 48
    }
  ];

  const demoFeedbacks = [
    {
      id: 'fb-demo-1',
      proyectoId: 'PS_BADLENZ_PROMO',
      cancion: 'Leyenda (Single 2026)',
      artista: 'BADLENZ',
      items: [
        {
          id: 'demo-it-1',
          timestamp: '01:24',
          comentario: 'Afinar un poco más las notas altas de la voz principal con Melodyne en el coro.',
          completado: false,
          fechaCreacion: '2026-08-03'
        },
        {
          id: 'demo-it-2',
          timestamp: '02:05',
          comentario: 'Subir 1.5dB al redoblante (snare) para darle más presencia en la mezcla final.',
          completado: true,
          fechaCreacion: '2026-08-03'
        }
      ]
    }
  ];

  const demoProyectos = [
    {
      id: 'proj-demo-1',
      nombre: 'Single "Leyenda" - Grabación & Mezcla',
      cliente: 'La Facultad',
      nombreArtistico: 'BADLENZ',
      email: 'ellentemalo@gmail.com',
      categoria: 'Producción Integral / Completa',
      montoTotal: 130,
      progreso: 65,
      estado: 'Mezclando',
      fechaEntrega: '2026-10-25',
      liderCreativo: 'Ing. Manuel E. Ramírez "Badlenz"',
      moneda: '$ USD',
      hitos: [
        { id: 'h1', titulo: 'Reserva & Depósito del 50% recibido', completado: true },
        { id: 'h2', titulo: 'Grabación de voces en cabina (4 horas)', completado: true },
        { id: 'h3', titulo: 'Edición y Tuning de voces (Melodyne)', completado: true },
        { id: 'h4', titulo: 'Mezcla multitrack y balance de frecuencias', completado: false },
        { id: 'h5', titulo: 'Mastering final y entrega de Stems', completado: false },
      ],
    }
  ];

  localStorage.setItem(STORAGE_KEY_CLIENTES, JSON.stringify(demoClientes));
  localStorage.setItem(STORAGE_KEY_RESERVAS, JSON.stringify(demoReservas));
  localStorage.setItem(STORAGE_KEY_FEEDBACKS, JSON.stringify(demoFeedbacks));
  localStorage.setItem('la_facultad_proyectos_db', JSON.stringify(demoProyectos));
  localStorage.setItem('la_facultad_disponibilidad_personalizada_db', JSON.stringify({}));
  localStorage.setItem(STORAGE_KEY_SHOWCASE_TRACKS, JSON.stringify(DEFAULT_SHOWCASE_TRACKS));

  try {
    for (const c of demoClientes) {
      await setDoc(doc(db, 'clientes', c.id), c);
    }
    for (const r of demoReservas) {
      await setDoc(doc(db, 'reservas', r.id), r);
    }
    for (const f of demoFeedbacks) {
      await setDoc(doc(db, 'feedbacks', f.id), f);
    }
  } catch (err) {
    console.warn('Firestore seeding offline warning:', err);
  }

  window.dispatchEvent(new Event('la_facultad_db_reset'));
};

export const inicializarModoLanzamiento = async () => {
  setAppOperationMode('lanzamiento');
  localStorage.setItem('la_facultad_was_reset', 'true');

  localStorage.setItem(STORAGE_KEY_CLIENTES, JSON.stringify([]));
  localStorage.setItem(STORAGE_KEY_RESERVAS, JSON.stringify([]));
  localStorage.setItem(STORAGE_KEY_FEEDBACKS, JSON.stringify([]));
  localStorage.setItem('la_facultad_proyectos_db', JSON.stringify([]));
  localStorage.setItem('la_facultad_disponibilidad_personalizada_db', JSON.stringify({}));
  localStorage.setItem(STORAGE_KEY_SHOWCASE_TRACKS, JSON.stringify([]));

  try {
    const clientesSnapshot = await getDocs(collection(db, 'clientes'));
    for (const d of clientesSnapshot.docs) {
      await deleteDoc(doc(db, 'clientes', d.id));
    }

    const reservasSnapshot = await getDocs(collection(db, 'reservas'));
    for (const d of reservasSnapshot.docs) {
      await deleteDoc(doc(db, 'reservas', d.id));
    }

    const feedbacksSnapshot = await getDocs(collection(db, 'feedbacks'));
    for (const d of feedbacksSnapshot.docs) {
      await deleteDoc(doc(db, 'feedbacks', d.id));
    }
  } catch (err) {
    console.warn('Firestore clearing notice:', err);
  }

  window.dispatchEvent(new Event('la_facultad_db_reset'));
};

// ==========================================
// LEADS EN LISTA DE ESPERA (ESTUDIO EN PAUSA)
// ==========================================
export interface LeadEspera {
  id: string;
  nombreArtistico: string;
  nombreReal?: string;
  telefono: string;
  email?: string;
  instagram?: string;
  tipoProyecto: 'grabacion_voces' | 'mezcla_master' | 'album_ep' | 'instrumental' | 'otro';
  fechaTentativa?: string;
  motivoCierre: string;
  mensaje?: string;
  fechaRegistro: string;
  contactado?: boolean;
}

const STORAGE_KEY_LEADS_ESPERA = 'la_facultad_leads_espera_db';

export const getLeadsEspera = (): LeadEspera[] => {
  try {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY_LEADS_ESPERA);
      if (saved) return JSON.parse(saved);
    }
  } catch (err) {
    console.warn('Error reading leads de espera:', err);
  }
  return [];
};

export const guardarLeadEspera = async (lead: LeadEspera): Promise<void> => {
  try {
    const actuales = getLeadsEspera();
    const actualizados = [lead, ...actuales.filter(l => l.id !== lead.id)];
    localStorage.setItem(STORAGE_KEY_LEADS_ESPERA, JSON.stringify(actualizados));
    window.dispatchEvent(new CustomEvent('la_facultad_lead_espera_added', { detail: lead }));

    // Sync to firestore if online
    try {
      await setDoc(doc(db, 'leads_espera', lead.id), lead);
    } catch (fErr) {
      console.warn('Firestore offline fallback for lead espera:', fErr);
    }
  } catch (err) {
    console.error('Error guardando lead en espera:', err);
    throw err;
  }
};
