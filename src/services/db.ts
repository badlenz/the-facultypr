import { db, auth } from '../firebase';
import { collection, doc, setDoc, updateDoc, deleteDoc, onSnapshot, getDocs } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

const ADMIN_EMAIL = 'ellentemalo@gmail.com';

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

import {
  VIP_MAX_STARS,
  VIP_MILESTONES,
  clampVipStars,
  getVipLevelBadge,
  isStrongVipCode,
  normalizeVipCode,
  toVipPublicoDocId,
  generarCodigoSesionSeguro,
  buildVipPublicoPayload,
  VipPublicoDoc,
} from './vipRules';

export {
  VIP_MAX_STARS,
  VIP_MILESTONES,
  clampVipStars,
  getVipLevelBadge,
  isStrongVipCode,
  normalizeVipCode,
  toVipPublicoDocId,
  generarCodigoSesionSeguro,
  buildVipPublicoPayload,
};
export type { VipPublicoDoc };

export interface HistorialEstrella {
  id: string;
  fecha: string;
  delta: number;
  tema?: string;
  nota?: string;
  reservaId?: string;
}

export interface Cliente {
  id: string;
  nombreArtistico: string;
  nombreReal: string;
  email: string;
  telefono: string;
  instagram: string;
  fechaCreacion: string;
  estrellasVip?: number;
  codigoSesion?: string;
  historialEstrellas?: HistorialEstrella[];
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
  metodoPago: 'Efectivo' | 'ATH Movil' | 'Tarjeta / Stripe' | 'PayPal' | 'Zelle';
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
  estrellaOtorgada?: boolean;
  /** ID anónimo del slot en la colección pública sanitizada `agenda_ocupada` */
  slotId?: string;
}

/**
 * Proyección pública sanitizada de ocupación de calendario (cero PII, cero teléfonos, cero montos).
 * Permite calcular disponibilidad en vivo sin exponer la colección privada `reservas`.
 */
export interface AgendaOcupadaSlot {
  id: string;
  fecha: string;
  fechasBloque?: string[];
  horaInicio: string;
  horaSalida: string;
  estado: Reserva['estado'];
  tieneComprobante: boolean;
  creadoEn: number;
}

const STORAGE_KEY_CLIENTES = 'la_facultad_clientes_db';
const STORAGE_KEY_RESERVAS = 'la_facultad_reservas_db';
const STORAGE_KEY_AGENDA_OCUPADA = 'la_facultad_agenda_ocupada_db';

/** Elimina propiedades `undefined` antes de enviar a Firestore o guardar en cache local. */
const stripUndefinedFields = <T extends Record<string, any>>(obj: T): T => {
  const clean: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      clean[key] = value;
    }
  }
  return clean as T;
};

const safeGetStorageJson = <T>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch (err) {
    console.warn(`LocalStorage read notice (${key}):`, err);
    return fallback;
  }
};

const safeSetStorageJson = (key: string, value: unknown): boolean => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (err) {
    console.warn(`LocalStorage write notice (${key}):`, err);
    return false;
  }
};

const generateRandomCode = (len = 4): string => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = '';
  for (let i = 0; i < len; i++) {
    out += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return out;
};

const toSanitizedAgendaSlot = (r: Reserva, slotId: string): AgendaOcupadaSlot => {
  const slot: AgendaOcupadaSlot = {
    id: slotId,
    fecha: r.fecha,
    horaInicio: r.horaInicio,
    horaSalida: r.horaSalida,
    estado: r.estado,
    tieneComprobante: Boolean(r.comprobanteAthUrl || r.comprobanteNumReferencia),
    creadoEn: r.creadoEn || Date.now(),
  };
  if (Array.isArray(r.fechasBloque) && r.fechasBloque.length > 0) {
    slot.fechasBloque = r.fechasBloque;
  }
  return slot;
};

// Real-time listener initialization for Firestore
const notifyClientesUpdated = () => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('la_facultad_clientes_updated'));
  }
};

const notifyReservasUpdated = () => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('la_facultad_reservas_updated'));
  }
};

let unsubAdminClientes: (() => void) | null = null;
let unsubAdminReservas: (() => void) | null = null;
let weakVipCodesMigratedThisSession = false;

const stopAdminListeners = () => {
  if (unsubAdminClientes) {
    unsubAdminClientes();
    unsubAdminClientes = null;
  }
  if (unsubAdminReservas) {
    unsubAdminReservas();
    unsubAdminReservas = null;
  }
};

const startAdminListeners = () => {
  stopAdminListeners();
  try {
    unsubAdminClientes = onSnapshot(
      collection(db, 'clientes'),
      (snapshot) => {
        const list: Cliente[] = [];
        snapshot.forEach((d) => list.push(d.data() as Cliente));
        safeSetStorageJson(STORAGE_KEY_CLIENTES, list);
        notifyClientesUpdated();
        if (!weakVipCodesMigratedThisSession) {
          weakVipCodesMigratedThisSession = true;
          const migratedCount = migrarCodigosSesionDebiles(list);
          if (migratedCount > 0 && typeof window !== 'undefined') {
            window.dispatchEvent(
              new CustomEvent('la_facultad_vip_codes_migrated', {
                detail: { count: migratedCount },
              })
            );
          }
        }
      },
      (err) => {
        console.warn('Firestore Clientes sync notice:', err.message);
      }
    );

    unsubAdminReservas = onSnapshot(
      collection(db, 'reservas'),
      (snapshot) => {
        const list: Reserva[] = [];
        snapshot.forEach((d) => list.push(d.data() as Reserva));
        safeSetStorageJson(STORAGE_KEY_RESERVAS, list);
        notifyReservasUpdated();
      },
      (err) => {
        console.warn('Firestore Reservas sync notice:', err.message);
      }
    );
  } catch (e) {
    console.warn('Firestore admin listener initialization notice:', e);
  }
};

try {
  // Listeners privados (PII / Finanzas): solo se suscriben cuando el Admin inicia sesión
  onAuthStateChanged(auth, (user) => {
    if (user?.email === ADMIN_EMAIL) {
      startAdminListeners();
    } else {
      stopAdminListeners();
    }
  });

  // Listener público sanitizado: únicamente bloques ocupados (sin nombres, teléfonos ni montos)
  onSnapshot(
    collection(db, 'agenda_ocupada'),
    (snapshot) => {
      const list: AgendaOcupadaSlot[] = [];
      snapshot.forEach((d) => list.push(d.data() as AgendaOcupadaSlot));
      safeSetStorageJson(STORAGE_KEY_AGENDA_OCUPADA, list);
      notifyReservasUpdated();
    },
    (err) => {
      console.warn('Firestore agenda_ocupada sync notice:', err.message);
    }
  );

  onSnapshot(doc(db, 'studio_config', 'main'), (snap) => {
    if (snap.exists()) {
      const merged = { ...DEFAULT_STUDIO_CONFIG, ...snap.data() };
      safeSetStorageJson(STORAGE_KEY_STUDIO_CONFIG, merged);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('la_facultad_config_updated'));
      }
    }
  }, (err) => {
    console.warn('Firestore studio_config sync notice:', err.message);
  });

  onSnapshot(doc(db, 'promo_slots', 'main'), (snap) => {
    if (snap.exists()) {
      const data = snap.data() as { reservados?: number };
      if (typeof data?.reservados === 'number') {
        try {
          localStorage.setItem(STORAGE_KEY_PROMO_SLOTS, String(data.reservados));
        } catch (err) {
          console.warn('LocalStorage promo_slots write notice:', err);
        }
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('la_facultad_promo_slots_updated'));
        }
      }
    }
  }, (err) => {
    console.warn('Firestore promo_slots sync notice:', err.message);
  });

  onSnapshot(collection(db, 'showcase_tracks'), (snapshot) => {
    const list: ShowcaseTrack[] = [];
    snapshot.forEach(d => list.push(d.data() as ShowcaseTrack));
    if (list.length > 0) {
      safeSetStorageJson(STORAGE_KEY_SHOWCASE_TRACKS, list);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('la_facultad_showcase_updated'));
      }
    }
  }, (err) => {
    console.warn('Firestore showcase_tracks sync notice:', err.message);
  });
} catch (e) {
  console.warn('Firestore background listener initialization notice:', e);
}

// --- GESTIÓN DE CLIENTES ---
export const getClientes = (): Cliente[] => {
  return safeGetStorageJson<Cliente[]>(STORAGE_KEY_CLIENTES, []);
};

export const guardarCliente = (clienteData: Omit<Cliente, 'id' | 'fechaCreacion'>): Cliente => {
  const clientes = getClientes();
  const cleanEmail = (clienteData.email || '').trim().toLowerCase();
  const cleanArt = (clienteData.nombreArtistico || '').trim().toLowerCase();
  const normalizeTel = (t?: string) => (t || '').trim().toLowerCase().replace(/[\s()-]+/g, '');
  const cleanTel = normalizeTel(clienteData.telefono);
  const existe = clientes.find(c =>
    (cleanEmail && (c.email || '').trim().toLowerCase() === cleanEmail) ||
    (cleanArt && (c.nombreArtistico || '').trim().toLowerCase() === cleanArt) ||
    (cleanTel && cleanTel !== 'porconfirmar' && normalizeTel(c.telefono) === cleanTel)
  );
  
  if (existe) {
    return existe; // Retorna el cliente existente si ya está registrado
  }

  const nuevoCliente: Cliente = stripUndefinedFields({
    ...clienteData,
    estrellasVip: clampVipStars(clienteData.estrellasVip),
    historialEstrellas: clienteData.historialEstrellas || [],
    id: `CLI-${Date.now()}-${generateRandomCode(4)}`,
    fechaCreacion: new Date().toISOString().split('T')[0]
  });

  clientes.push(nuevoCliente);
  safeSetStorageJson(STORAGE_KEY_CLIENTES, clientes);
  notifyClientesUpdated();

  // Sync to Firestore
  try {
    setDoc(doc(db, 'clientes', nuevoCliente.id), nuevoCliente).catch(err => {
      console.warn('Firestore guardarCliente async save notice:', err);
    });
    const vipDocId = toVipPublicoDocId(nuevoCliente.codigoSesion);
    if (vipDocId) {
      setDoc(
        doc(db, 'vip_publico', vipDocId),
        buildVipPublicoPayload(nuevoCliente.nombreArtistico, nuevoCliente.estrellasVip)
      ).catch(err => {
        console.warn('Firestore vip_publico create notice:', err);
      });
    }
  } catch (err) {
    console.warn('Firestore guardarCliente sync notice:', err);
  }

  return nuevoCliente;
};

// --- GESTIÓN DE RESERVAS Y ORDENES ---
export const getAgendaOcupadaSlots = (): AgendaOcupadaSlot[] => {
  return safeGetStorageJson<AgendaOcupadaSlot[]>(STORAGE_KEY_AGENDA_OCUPADA, []);
};

export const getReservas = (): Reserva[] => {
  return safeGetStorageJson<Reserva[]>(STORAGE_KEY_RESERVAS, []);
};

const persistReservasCache = (reservas: Reserva[], keepMediaId?: string) => {
  if (safeSetStorageJson(STORAGE_KEY_RESERVAS, reservas)) return;
  // Si localStorage excede cuota (por capturas base64 previas), compactar entradas antiguas.
  const compacted = reservas.map((r) =>
    r.id !== keepMediaId && r.comprobanteAthUrl && r.comprobanteAthUrl.length > 1000
      ? { ...r, comprobanteAthUrl: undefined }
      : r
  );
  if (safeSetStorageJson(STORAGE_KEY_RESERVAS, compacted)) return;
  const withoutMedia = reservas.map((r) =>
    r.comprobanteAthUrl && r.comprobanteAthUrl.length > 1000
      ? { ...r, comprobanteAthUrl: undefined }
      : r
  );
  safeSetStorageJson(STORAGE_KEY_RESERVAS, withoutMedia);
};

export interface GuardarReservaSyncResult {
  reserva: Reserva;
  firestoreSaved: boolean;
  screenshotDropped: boolean;
  error?: string;
}

const withTimeout = <T>(promise: Promise<T>, ms: number, timeoutMessage: string): Promise<T> => {
  let timer: ReturnType<typeof setTimeout> | undefined;
  return new Promise<T>((resolve, reject) => {
    timer = setTimeout(() => reject(new Error(timeoutMessage)), ms);
    promise.then(
      (val) => {
        if (timer) clearTimeout(timer);
        resolve(val);
      },
      (err) => {
        if (timer) clearTimeout(timer);
        reject(err);
      }
    );
  });
};

const syncReservaDocsToFirestore = async (
  nuevaReserva: Reserva,
  slotForCreate: AgendaOcupadaSlot
): Promise<{ firestoreSaved: boolean; screenshotDropped: boolean; error?: string }> => {
  let screenshotDropped = false;
  try {
    await withTimeout(
      setDoc(doc(db, 'reservas', nuevaReserva.id), nuevaReserva),
      12000,
      'Tiempo de espera agotado al guardar en Firestore.'
    );
  } catch (err: any) {
    // Si falló con captura adjunta, reintentar sin comprobanteAthUrl para no bloquear la reserva.
    if (nuevaReserva.comprobanteAthUrl) {
      const sinCaptura = stripUndefinedFields({ ...nuevaReserva, comprobanteAthUrl: undefined });
      try {
        await withTimeout(
          setDoc(doc(db, 'reservas', nuevaReserva.id), sinCaptura),
          10000,
          'Tiempo de espera agotado al guardar la reserva en Firestore.'
        );
        screenshotDropped = true;
      } catch (retryErr: any) {
        console.error('Firestore guardarReserva retry error:', retryErr);
        return {
          firestoreSaved: false,
          screenshotDropped: true,
          error: retryErr?.message || 'No se pudo guardar la reserva en Firestore.',
        };
      }
    } else {
      console.error('Firestore guardarReserva error:', err);
      return {
        firestoreSaved: false,
        screenshotDropped: false,
        error: err?.message || 'No se pudo guardar la reserva en Firestore.',
      };
    }
  }

  try {
    await withTimeout(
      setDoc(doc(db, 'agenda_ocupada', slotForCreate.id), slotForCreate),
      8000,
      'Tiempo de espera agotado al bloquear el turno.'
    );
  } catch (slotErr) {
    console.warn('Firestore agenda_ocupada create notice:', slotErr);
  }

  return { firestoreSaved: true, screenshotDropped };
};

const buildNuevaReserva = (
  reservaData: Omit<Reserva, 'id' | 'estado' | 'metodoPago'> & {
    estado?: Reserva['estado'];
    metodoPago?: 'Efectivo' | 'ATH Movil' | 'Tarjeta / Stripe' | 'PayPal' | 'Zelle';
  }
) => {
  const reservas = getReservas();

  const cleanName = (reservaData.nombreArtistico || 'ARTISTA')
    .toUpperCase()
    .trim()
    .replace(/[^A-Z0-9]/g, '_')
    .replace(/__+/g, '_')
    .slice(0, 28);

  // Sufijo aleatorio para evitar IDs predecibles en /reservas
  let uniqueId = `PS_${cleanName}_${generateRandomCode(4)}`;
  let counter = 1;
  while (reservas.some(r => r.id === uniqueId)) {
    uniqueId = `PS_${cleanName}_${generateRandomCode(4)}_${counter}`;
    counter++;
  }

  // ID anónimo sin PII para la proyección pública /agenda_ocupada
  const cleanFecha = (reservaData.fecha || '').replace(/-/g, '');
  const cleanHora = (reservaData.horaInicio || '13:00').replace(':', '');
  const slotId = reservaData.slotId || `SLOT_${cleanFecha}_${cleanHora}_${generateRandomCode(6)}`;

  const nuevaReserva: Reserva = stripUndefinedFields({
    metodoPago: 'Efectivo',
    estado: 'Pendiente',
    depositoEstado: 'pendiente',
    creadoEn: Date.now(),
    ...reservaData,
    id: uniqueId,
    slotId,
  } as Reserva);

  if (reservaData.estado) {
    nuevaReserva.estado = reservaData.estado;
  }

  reservas.push(nuevaReserva);
  persistReservasCache(reservas, nuevaReserva.id);

  // Proyección sanitizada en memoria local + Firestore /agenda_ocupada (cero PII / montos)
  const sanitizedSlot = stripUndefinedFields(toSanitizedAgendaSlot(nuevaReserva, slotId));
  const currentSlots = getAgendaOcupadaSlots().filter((s) => s.id !== slotId);
  currentSlots.push(sanitizedSlot);
  safeSetStorageJson(STORAGE_KEY_AGENDA_OCUPADA, currentSlots);
  notifyReservasUpdated();

  const isAdminSession = auth.currentUser?.email === ADMIN_EMAIL;
  const slotForCreate: AgendaOcupadaSlot = isAdminSession
    ? sanitizedSlot
    : stripUndefinedFields({ ...sanitizedSlot, estado: 'Pendiente', tieneComprobante: false });

  return { nuevaReserva, slotForCreate };
};

export const guardarReserva = (reservaData: Omit<Reserva, 'id' | 'estado' | 'metodoPago'> & { estado?: Reserva['estado'], metodoPago?: 'Efectivo' | 'ATH Movil' | 'Tarjeta / Stripe' | 'PayPal' | 'Zelle' }): Reserva => {
  const { nuevaReserva, slotForCreate } = buildNuevaReserva(reservaData);
  syncReservaDocsToFirestore(nuevaReserva, slotForCreate).catch(err => {
    console.warn('Firestore guardarReserva async save notice:', err);
  });
  return nuevaReserva;
};

export const guardarReservaConSync = async (
  reservaData: Omit<Reserva, 'id' | 'estado' | 'metodoPago'> & {
    estado?: Reserva['estado'];
    metodoPago?: 'Efectivo' | 'ATH Movil' | 'Tarjeta / Stripe' | 'PayPal' | 'Zelle';
  }
): Promise<GuardarReservaSyncResult> => {
  const { nuevaReserva, slotForCreate } = buildNuevaReserva(reservaData);
  const syncRes = await syncReservaDocsToFirestore(nuevaReserva, slotForCreate);
  if (syncRes.screenshotDropped) {
    const cleanLocal = stripUndefinedFields({ ...nuevaReserva, comprobanteAthUrl: undefined });
    return { reserva: cleanLocal, ...syncRes };
  }
  return { reserva: nuevaReserva, ...syncRes };
};

// --- OPERACIONES AVANZADAS DE ADMINISTRACIÓN ---
export const actualizarReserva = (id: string, updates: Partial<Reserva>): Reserva[] => {
  const reservas = getReservas();
  const index = reservas.findIndex(r => r.id === id);
  if (index !== -1) {
    const cleanUpdates = stripUndefinedFields(updates as Record<string, any>) as Partial<Reserva>;
    const updated = stripUndefinedFields({ ...reservas[index], ...cleanUpdates });
    reservas[index] = updated;
    persistReservasCache(reservas, id);

    const isAdminSession = auth.currentUser?.email === ADMIN_EMAIL;
    try {
      if (isAdminSession) {
        setDoc(doc(db, 'reservas', id), updated, { merge: true }).catch(err => {
          console.warn('Firestore actualizarReserva async update notice:', err);
        });
      } else {
        // Visitante público: solo puede adjuntar comprobante en estado Pendiente
        const publicPatch: Record<string, string> = {};
        if (cleanUpdates.comprobanteAthUrl) publicPatch.comprobanteAthUrl = cleanUpdates.comprobanteAthUrl;
        if (cleanUpdates.comprobanteNumReferencia) publicPatch.comprobanteNumReferencia = cleanUpdates.comprobanteNumReferencia;
        if (Object.keys(publicPatch).length > 0) {
          updateDoc(doc(db, 'reservas', id), publicPatch).catch(err => {
            console.warn('Firestore public comprobante update notice:', err);
          });
        }
      }

      // Mantener sincronizada la proyección pública /agenda_ocupada
      if (updated.slotId) {
        const sanitizedSlot = stripUndefinedFields(toSanitizedAgendaSlot(updated, updated.slotId));
        const currentSlots = getAgendaOcupadaSlots().filter((s) => s.id !== updated.slotId);
        currentSlots.push(sanitizedSlot);
        safeSetStorageJson(STORAGE_KEY_AGENDA_OCUPADA, currentSlots);
        notifyReservasUpdated();

        if (isAdminSession) {
          setDoc(doc(db, 'agenda_ocupada', updated.slotId), sanitizedSlot, { merge: true }).catch(err => {
            console.warn('Firestore agenda_ocupada admin update notice:', err);
          });
        } else if (sanitizedSlot.tieneComprobante) {
          updateDoc(doc(db, 'agenda_ocupada', updated.slotId), { tieneComprobante: true }).catch(err => {
            console.warn('Firestore agenda_ocupada public comprobante notice:', err);
          });
        }
      }
    } catch (err) {
      console.warn('Firestore actualizarReserva sync notice:', err);
    }
  }
  return reservas;
};

export const eliminarReserva = (id: string): Reserva[] => {
  const reservas = getReservas();
  const target = reservas.find(r => r.id === id);
  const filtradas = reservas.filter(r => r.id !== id);
  localStorage.setItem(STORAGE_KEY_RESERVAS, JSON.stringify(filtradas));
  deleteDoc(doc(db, 'reservas', id)).catch(err => {
    console.warn('Firestore eliminarReserva async delete notice:', err);
  });
  if (target?.slotId) {
    const slots = getAgendaOcupadaSlots().filter((s) => s.id !== target.slotId);
    localStorage.setItem(STORAGE_KEY_AGENDA_OCUPADA, JSON.stringify(slots));
    deleteDoc(doc(db, 'agenda_ocupada', target.slotId)).catch(err => {
      console.warn('Firestore agenda_ocupada delete notice:', err);
    });
  }
  notifyReservasUpdated();
  return filtradas;
};

/**
 * Busca un cliente coincidiendo por código de sesión VIP, nombre artístico o nombre real.
 */
export const findClienteForArtistQuery = (
  rawQuery: string,
  clientesList?: Cliente[]
): Cliente | undefined => {
  const clean = rawQuery.trim().toLowerCase().replace(/\s+/g, '');
  if (!clean) return undefined;
  const list = clientesList ?? getClientes();

  const exactMatch = list.find((c) => {
    const code = (c.codigoSesion || '').trim().toLowerCase().replace(/\s+/g, '');
    const artName = (c.nombreArtistico || '').trim().toLowerCase().replace(/\s+/g, '');
    const realName = (c.nombreReal || '').trim().toLowerCase().replace(/\s+/g, '');
    return (code && code === clean) || (artName && artName === clean) || (realName && realName === clean);
  });
  if (exactMatch) return exactMatch;

  return list.find((c) => {
    const code = (c.codigoSesion || '').trim().toLowerCase().replace(/\s+/g, '');
    const artName = (c.nombreArtistico || '').trim().toLowerCase().replace(/\s+/g, '');
    const realName = (c.nombreReal || '').trim().toLowerCase().replace(/\s+/g, '');
    if (code && clean.includes(code)) return true;
    if (artName && (clean.includes(artName) || artName.includes(clean))) return true;
    if (realName && clean.includes(realName)) return true;
    return false;
  });
};

const syncVipPublicoDoc = (cliente: Cliente, prevCodigoSesion?: string) => {
  const prevCode = (prevCodigoSesion || '').trim();
  const nextCode = (cliente.codigoSesion || '').trim();
  const prevDocId = toVipPublicoDocId(prevCode) || (prevCode && !prevCode.includes('/') ? prevCode : '');
  const nextDocId = toVipPublicoDocId(nextCode);

  if (prevDocId && prevDocId !== nextDocId && auth.currentUser?.email === ADMIN_EMAIL) {
    deleteDoc(doc(db, 'vip_publico', prevDocId)).catch(err => {
      console.warn('Firestore vip_publico old code delete notice:', err);
    });
  }

  if (nextDocId) {
    setDoc(
      doc(db, 'vip_publico', nextDocId),
      buildVipPublicoPayload(cliente.nombreArtistico, cliente.estrellasVip)
    ).catch(err => {
      console.warn('Firestore vip_publico sync notice:', err);
    });
  }
};

export const actualizarCliente = (id: string, updates: Partial<Cliente>): Cliente[] => {
  const clientes = getClientes();
  const index = clientes.findIndex(c => c.id === id);
  if (index !== -1) {
    const prevCodigoSesion = clientes[index].codigoSesion;
    const nextStars =
      updates.estrellasVip !== undefined
        ? clampVipStars(updates.estrellasVip)
        : clampVipStars(clientes[index].estrellasVip);
    const updated: Cliente = stripUndefinedFields({
      ...clientes[index],
      ...updates,
      estrellasVip: nextStars,
    });
    clientes[index] = updated;
    safeSetStorageJson(STORAGE_KEY_CLIENTES, clientes);
    notifyClientesUpdated();
    setDoc(doc(db, 'clientes', id), updated, { merge: true }).catch(err => {
      console.warn('Firestore actualizarCliente async update notice:', err);
    });
    syncVipPublicoDoc(updated, prevCodigoSesion);
  }
  return clientes;
};

/**
 * Migra en una sola pasada los codigoSesion existentes que no cumplan el formato `VIP/nombre-del-artista`.
 * Devuelve el total de códigos actualizados.
 */
export const migrarCodigosSesionDebiles = (clientesList?: Cliente[]): number => {
  const list = clientesList ?? getClientes();
  const usedCodes = list.map((c) => c.codigoSesion || '').filter(Boolean);
  let count = 0;
  for (const c of list) {
    const raw = (c.codigoSesion || '').trim();
    if (raw && !isStrongVipCode(raw)) {
      const otherCodes = usedCodes.filter((code) => code !== raw);
      const nuevoCodigo = generarCodigoSesionSeguro(c.nombreArtistico, otherCodes);
      usedCodes.push(nuevoCodigo);
      actualizarCliente(c.id, { codigoSesion: nuevoCodigo });
      count++;
    }
  }
  return count;
};

/**
 * Ajusta manualmente las estrellas del Pasaporte VIP (1 servicio entregado y facturado = 1 ⭐, 0..20)
 * y registra el movimiento en el historial del artista.
 * Si recibe estrella positiva y el cliente no tiene código válido, le asigna `VIP/nombre-del-artista` y sincroniza vip_publico.
 */
export const ajustarEstrellasCliente = (
  clienteId: string,
  delta: number,
  detalle?: { tema?: string; nota?: string; reservaId?: string }
): Cliente[] => {
  const clientes = getClientes();
  const target = clientes.find(c => c.id === clienteId);
  if (!target || delta === 0) return clientes;

  const prevStars = clampVipStars(target.estrellasVip);
  const nextStars = clampVipStars(prevStars + delta);
  const actualDelta = nextStars - prevStars;
  if (actualDelta === 0) return clientes;

  const entry: HistorialEstrella = {
    id: `EST-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    fecha: new Date().toISOString().split('T')[0],
    delta: actualDelta,
    ...(detalle?.tema?.trim() ? { tema: detalle.tema.trim() } : {}),
    ...(detalle?.nota?.trim() ? { nota: detalle.nota.trim() } : {}),
    ...(detalle?.reservaId?.trim() ? { reservaId: detalle.reservaId.trim() } : {}),
  };

  const prevHistory = Array.isArray(target.historialEstrellas) ? target.historialEstrellas : [];
  const otherCodes = clientes.filter((c) => c.id !== clienteId).map((c) => c.codigoSesion || '');
  const nextCodigoSesion =
    actualDelta > 0 && !isStrongVipCode(target.codigoSesion)
      ? generarCodigoSesionSeguro(target.nombreArtistico, otherCodes)
      : target.codigoSesion;

  return actualizarCliente(clienteId, {
    estrellasVip: nextStars,
    historialEstrellas: [entry, ...prevHistory],
    ...(nextCodigoSesion ? { codigoSesion: nextCodigoSesion } : {}),
  });
};

/**
 * Registra el canje de un hito VIP en el historial del cliente (delta 0, una sola vez por hito).
 */
export const registrarCanjeHitoCliente = (
  clienteId: string,
  hitoNombre: string
): Cliente[] => {
  const clientes = getClientes();
  const target = clientes.find(c => c.id === clienteId);
  if (!target || !hitoNombre.trim()) return clientes;

  const notaCanje = `Canje: ${hitoNombre.trim()}`;
  const prevHistory = Array.isArray(target.historialEstrellas) ? target.historialEstrellas : [];
  if (prevHistory.some(h => h.nota === notaCanje)) {
    return clientes;
  }

  const entry: HistorialEstrella = {
    id: `EST-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    fecha: new Date().toISOString().split('T')[0],
    delta: 0,
    nota: notaCanje,
  };

  return actualizarCliente(clienteId, {
    historialEstrellas: [entry, ...prevHistory],
  });
};

export const eliminarCliente = (id: string): Cliente[] => {
  const clientes = getClientes();
  const target = clientes.find(c => c.id === id);
  const filtrados = clientes.filter(c => c.id !== id);
  safeSetStorageJson(STORAGE_KEY_CLIENTES, filtrados);
  notifyClientesUpdated();
  deleteDoc(doc(db, 'clientes', id)).catch(err => {
    console.warn('Firestore eliminarCliente async delete notice:', err);
  });
  const rawCode = (target?.codigoSesion || '').trim();
  const vipDocId = toVipPublicoDocId(rawCode) || (rawCode && !rawCode.includes('/') ? rawCode : '');
  if (vipDocId) {
    deleteDoc(doc(db, 'vip_publico', vipDocId)).catch(err => {
      console.warn('Firestore vip_publico delete notice:', err);
    });
  }
  return filtrados;
};

// --- CONFIGURACIÓN DE UBICACIÓN Y REGLAS DE ESTUDIO EN HORMIGUEROS ---
export interface StudioConfig {
  googleMapsLocationUrl: string;
  wazeLocationUrl: string;
  appleMapsLocationUrl?: string;
  direccionTexto: string;
  instruccionesEstacionamiento: string;
  maxAcompanantes: number;
  politicaEntregaTexto: string;
  stripeDepositLink?: string;
  athMovilTelefono?: string;
  paypalMeUrl?: string;
  metaMensualUsd?: number;
}

const STORAGE_KEY_STUDIO_CONFIG = 'la_facultad_studio_config_db';

export const DEFAULT_STUDIO_CONFIG: StudioConfig = {
  googleMapsLocationUrl: 'https://maps.google.com/?q=Hormigueros+Puerto+Rico',
  wazeLocationUrl: 'https://waze.com/ul?ll=18.1397,-67.1274&navigate=yes',
  appleMapsLocationUrl: 'https://maps.apple/p/unF0mQRXa_jENT',
  direccionTexto: 'Hormigueros, Puerto Rico (Sector Central)',
  instruccionesEstacionamiento: 'Estacionamiento privado exclusivo disponible frente a las instalaciones del estudio. Favor de estacionar de frente en los espacios rotulados.',
  maxAcompanantes: 2,
  politicaEntregaTexto: 'Rough Mix MP3/WAV inmediato al finalizar las 4 horas de sesión. De 24 a 72 horas se entrega la mezcla y el máster completo en tu Bóveda VIP en Faculty Projects.',
  stripeDepositLink: ((import.meta as any).env?.VITE_STRIPE_DEPOSIT_LINK || '').trim(),
  athMovilTelefono: '(787) 240-8627',
  paypalMeUrl: 'https://paypal.me/badlenzprod',
  metaMensualUsd: 700,
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
        { id: 'h2', titulo: 'Grabación de voces en el studio (4 horas)', completado: true },
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

// ==========================================
// FINANZAS DEL STUDIO (INGRESOS / GASTOS + META MENSUAL + SERVICIOS)
// ==========================================
export type CategoriaServicioFinanza =
  | 'grabacion_voces'
  | 'mezcla_master'
  | 'mezcla_sola'
  | 'master_solo'
  | 'instrumental'
  | 'renta_estudio'
  | 'produccion_completa'
  | 'otro';

export const CATEGORIAS_SERVICIO_FINANZA: { id: CategoriaServicioFinanza; label: string }[] = [
  { id: 'grabacion_voces', label: 'Grabación de Voces' },
  { id: 'mezcla_master', label: 'Mezcla y Máster' },
  { id: 'mezcla_sola', label: 'Mezcla Sola' },
  { id: 'master_solo', label: 'Máster Solo' },
  { id: 'instrumental', label: 'Instrumental / Beat' },
  { id: 'renta_estudio', label: 'Renta de Estudio / Horas' },
  { id: 'produccion_completa', label: 'Producción Completa' },
  { id: 'otro', label: 'Otro / Gasto Operativo' },
];

export interface MovimientoFinanciero {
  id: string;
  fecha: string; // YYYY-MM-DD
  concepto: string;
  monto: number;
  tipo: 'ingreso' | 'gasto';
  categoriaServicio?: CategoriaServicioFinanza;
  metodoPago: 'ATH Movil' | 'Tarjeta / Stripe' | 'PayPal' | 'Efectivo';
  nota?: string;
  creadoEn: number;
}

const STORAGE_KEY_FINANZAS = 'la_facultad_finanzas_db';
export const FINANZAS_UPDATED_EVENT = 'la_facultad_finanzas_updated';

let finanzasListenerStarted = false;
export const iniciarSyncFinanzas = () => {
  if (finanzasListenerStarted || typeof window === 'undefined') return;
  finanzasListenerStarted = true;
  try {
    onSnapshot(
      collection(db, 'finanzas'),
      (snap) => {
        const list: MovimientoFinanciero[] = [];
        snap.forEach((d) => list.push(d.data() as MovimientoFinanciero));
        localStorage.setItem(STORAGE_KEY_FINANZAS, JSON.stringify(list));
        window.dispatchEvent(new Event(FINANZAS_UPDATED_EVENT));
      },
      (err) => {
        console.warn('Firestore finanzas sync notice:', err.message);
      }
    );
  } catch (err) {
    console.warn('Finanzas sync init notice:', err);
  }
};

export const getMovimientosFinancieros = (): MovimientoFinanciero[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_FINANZAS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const guardarMovimientoFinanciero = (
  data: Omit<MovimientoFinanciero, 'id' | 'creadoEn'>
): MovimientoFinanciero[] => {
  const list = getMovimientosFinancieros();
  const nuevo: MovimientoFinanciero = {
    ...data,
    id: `FIN-${Date.now().toString().slice(-6)}`,
    creadoEn: Date.now(),
  };
  const updated = [nuevo, ...list];
  localStorage.setItem(STORAGE_KEY_FINANZAS, JSON.stringify(updated));
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(FINANZAS_UPDATED_EVENT));
  }
  setDoc(doc(db, 'finanzas', nuevo.id), nuevo).catch((err) => {
    console.warn('Firestore guardarMovimientoFinanciero notice:', err);
  });
  return updated;
};

export const eliminarMovimientoFinanciero = (id: string): MovimientoFinanciero[] => {
  const list = getMovimientosFinancieros().filter((m) => m.id !== id);
  localStorage.setItem(STORAGE_KEY_FINANZAS, JSON.stringify(list));
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(FINANZAS_UPDATED_EVENT));
  }
  deleteDoc(doc(db, 'finanzas', id)).catch((err) => {
    console.warn('Firestore eliminarMovimientoFinanciero notice:', err);
  });
  return list;
};
