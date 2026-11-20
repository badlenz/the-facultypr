import React, { useState, useEffect } from 'react';
import {
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  Music,
  Settings,
  Radio,
  Ticket,
  Trash2,
  Plus,
  ExternalLink,
  MessageCircle,
  Image as ImageIcon,
  X,
  Upload,
  CreditCard,
  ShieldCheck,
  RefreshCw,
  DollarSign,
  TrendingUp,
  Download,
  Target,
} from 'lucide-react';
import {
  getReservas,
  guardarReserva,
  actualizarReserva,
  eliminarReserva,
  Reserva,
  getPromoSlotsCount,
  setPromoSlotsReservadosManual,
  getStudioConfig,
  guardarStudioConfig,
  StudioConfig,
  getShowcaseTracks,
  guardarShowcaseTrack,
  eliminarShowcaseTrack,
  ShowcaseTrack,
  MovimientoFinanciero,
  CategoriaServicioFinanza,
  CATEGORIAS_SERVICIO_FINANZA,
  getMovimientosFinancieros,
  guardarMovimientoFinanciero,
  eliminarMovimientoFinanciero,
  iniciarSyncFinanzas,
  FINANZAS_UPDATED_EVENT,
} from '../services/db';
import {
  getStudioLiveStatus,
  setStudioLiveStatus,
  subscribeToStudioStatus,
  PRESET_STATUSES,
  StudioLiveStatus,
  StudioLiveStatusType,
} from '../services/studioStatus';
import {
  obtenerTodasDisponibilidades,
  guardarDisponibilidadDia,
  eliminarDisponibilidadDia,
  DISPONIBILIDAD_UPDATED_EVENT,
  DisponibilidadCustomMap,
} from '../services/schedule';
import { saveAudioToStorage } from '../services/audioStorage';
import { ARTIST_PORTAL_BASE_URL } from '../config/portalConfig';
import { CalendarioSection } from './Calendario/CalendarioSection';

type AdminTab = 'reservas' | 'finanzas' | 'calendario' | 'estado' | 'showcase' | 'ajustes';

interface PanelAdminProps {
  defaultSection?: 'all' | 'calendario';
}

export default function PanelAdmin({ defaultSection = 'all' }: PanelAdminProps) {
  const [activeTab, setActiveTab] = useState<AdminTab>(
    defaultSection === 'calendario' ? 'calendario' : 'reservas'
  );
  const [reservas, setReservas] = useState<Reserva[]>(() => getReservas());
  const [filtroEstado, setFiltroEstado] = useState<string>('Todas');
  const [liveStatus, setLiveStatus] = useState<StudioLiveStatus>(() => getStudioLiveStatus());
  const [disponibilidades, setDisponibilidades] = useState<DisponibilidadCustomMap>(() =>
    obtenerTodasDisponibilidades()
  );
  const [studioConfig, setStudioConfig] = useState<StudioConfig>(() => getStudioConfig());
  const [promoSlots, setPromoSlots] = useState(() => getPromoSlotsCount());
  const [tracks, setTracks] = useState<ShowcaseTrack[]>(() => getShowcaseTracks());
  const [movimientos, setMovimientos] = useState<MovimientoFinanciero[]>(() =>
    getMovimientosFinancieros()
  );
  const [mesFinanzas, setMesFinanzas] = useState<string>(() =>
    new Date().toISOString().slice(0, 7)
  );
  const [nuevoMov, setNuevoMov] = useState({
    fecha: new Date().toISOString().split('T')[0],
    concepto: '',
    monto: '',
    tipo: 'ingreso' as 'ingreso' | 'gasto',
    categoriaServicio: 'grabacion_voces' as CategoriaServicioFinanza,
    metodoPago: 'ATH Movil' as MovimientoFinanciero['metodoPago'],
    nota: '',
  });
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  // Bloqueo de fecha
  const [fechaBloqueo, setFechaBloqueo] = useState(() => new Date().toISOString().split('T')[0]);
  const [motivoBloqueo, setMotivoBloqueo] = useState('Bloqueado por Badlenz');

  // Nueva reserva manual
  const [showNewBooking, setShowNewBooking] = useState(false);
  const [newBooking, setNewBooking] = useState({
    nombreArtistico: '',
    fecha: new Date().toISOString().split('T')[0],
    bloque: '13:00-17:00',
    subtotal: 130,
    deposito: 50,
    metodoPago: 'ATH Movil' as Reserva['metodoPago'],
    servicio: 'Sesión Grabación + Mezcla & Master (4h)',
  });

  // Nuevo track A/B
  const [newTrack, setNewTrack] = useState({
    title: '',
    artist: '',
    genre: 'Reggaetón / Urbano',
    bpm: 96,
    audioAUrl: '',
    audioBUrl: '',
    descriptionA: 'Voz cruda / maqueta sin procesar.',
    descriptionB: 'Mezcla multitrack, afinación vocal y master comercial Badlenz.',
  });
  const [uploadingAudio, setUploadingAudio] = useState<'A' | 'B' | null>(null);

  const notify = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast((cur) => (cur === msg ? null : cur)), 3500);
  };

  useEffect(() => {
    iniciarSyncFinanzas();
    const syncReservas = () => {
      setReservas(getReservas());
      setPromoSlots(getPromoSlotsCount());
    };
    const syncDisp = () => setDisponibilidades(obtenerTodasDisponibilidades());
    const syncConfig = () => setStudioConfig(getStudioConfig());
    const syncTracks = () => setTracks(getShowcaseTracks());
    const syncFinanzas = () => setMovimientos(getMovimientosFinancieros());
    const unsubStatus = subscribeToStudioStatus(setLiveStatus);

    window.addEventListener('la_facultad_reservas_updated', syncReservas);
    window.addEventListener(DISPONIBILIDAD_UPDATED_EVENT, syncDisp);
    window.addEventListener('la_facultad_config_updated', syncConfig);
    window.addEventListener('la_facultad_showcase_updated', syncTracks);
    window.addEventListener('la_facultad_promo_slots_updated', syncReservas);
    window.addEventListener(FINANZAS_UPDATED_EVENT, syncFinanzas);

    return () => {
      unsubStatus();
      window.removeEventListener('la_facultad_reservas_updated', syncReservas);
      window.removeEventListener(DISPONIBILIDAD_UPDATED_EVENT, syncDisp);
      window.removeEventListener('la_facultad_config_updated', syncConfig);
      window.removeEventListener('la_facultad_showcase_updated', syncTracks);
      window.removeEventListener('la_facultad_promo_slots_updated', syncReservas);
      window.removeEventListener(FINANZAS_UPDATED_EVENT, syncFinanzas);
    };
  }, []);

  const reservasOrdenadas = [...reservas].sort((a, b) => (b.creadoEn || 0) - (a.creadoEn || 0));
  const reservasFiltradas =
    filtroEstado === 'Todas'
      ? reservasOrdenadas
      : reservasOrdenadas.filter((r) => r.estado === filtroEstado);

  const pendientesCount = reservas.filter((r) => r.estado === 'Pendiente').length;
  const confirmadasCount = reservas.filter((r) => r.estado === 'Confirmada').length;
  const totalDepositos = reservas
    .filter((r) => r.estado === 'Confirmada' || r.estado === 'Completada')
    .reduce((acc, r) => acc + (Number(r.deposito) || 0), 0);

  const handleConfirmarReserva = (r: Reserva, openWhatsApp = false) => {
    const next = actualizarReserva(r.id, {
      estado: 'Confirmada',
      depositoEstado: 'depositado',
    });
    setReservas(next);
    notify(`Reserva #${r.id} confirmada y sincronizada en Firestore.`);

    if (openWhatsApp) {
      const msg = `¡Confirmado ${r.nombreArtistico}! ✅ Recibí tu depósito de $${r.deposito} USD. Tu sesión en La Facultad Studio (Hormigueros, PR) queda oficialmente apartada para el ${r.fecha} (${r.horaInicio} - ${r.horaSalida}). Balance al llegar: $${r.balance} USD. Código de Pase: #${r.id}. ¡Nos vemos en el studio! 🎙️🔥`;
      window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank', 'noopener,noreferrer');
    }
  };

  const handleCambiarEstadoReserva = (id: string, estado: Reserva['estado']) => {
    const next = actualizarReserva(id, { estado });
    setReservas(next);
    notify(`Reserva #${id} marcada como ${estado}.`);
  };

  const handleEliminarReserva = (id: string) => {
    if (!window.confirm(`¿Eliminar permanentemente la reserva #${id}?`)) return;
    const next = eliminarReserva(id);
    setReservas(next);
    notify(`Reserva #${id} eliminada.`);
  };

  const handleCreateManualBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBooking.nombreArtistico.trim()) return;
    const [horaInicio, horaSalida] = newBooking.bloque.split('-');
    const created = guardarReserva({
      clienteId: `MANUAL-${Date.now().toString().slice(-4)}`,
      nombreArtistico: newBooking.nombreArtistico.trim(),
      fecha: newBooking.fecha,
      horaInicio,
      horaSalida,
      totalHoras: 4,
      servicios: [newBooking.servicio],
      metodoPago: newBooking.metodoPago,
      subtotal: Number(newBooking.subtotal) || 130,
      deposito: Number(newBooking.deposito) || 50,
      balance: Math.max(0, (Number(newBooking.subtotal) || 130) - (Number(newBooking.deposito) || 50)),
      estado: 'Confirmada',
      depositoEstado: 'depositado',
    });
    setReservas(getReservas());
    setShowNewBooking(false);
    setNewBooking({ ...newBooking, nombreArtistico: '' });
    notify(`Sesión manual #${created.id} agregada y bloqueada en el calendario.`);
  };

  const handleSetStatusPreset = (tipo: StudioLiveStatusType) => {
    const preset = PRESET_STATUSES[tipo];
    setStudioLiveStatus(preset);
    setLiveStatus(preset);
    notify(`Estado en vivo actualizado a: ${preset.titulo}`);
  };

  const handleAudioFileUpload = async (side: 'A' | 'B', e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAudio(side);
    try {
      const id = `track_${Date.now()}_${side}`;
      const storedRef = await saveAudioToStorage(id, file);
      setNewTrack((prev) =>
        side === 'A' ? { ...prev, audioAUrl: storedRef } : { ...prev, audioBUrl: storedRef }
      );
      notify(`Audio ${side} cargado correctamente (${(file.size / 1024 / 1024).toFixed(1)} MB).`);
    } catch {
      notify(`No se pudo cargar el archivo de Audio ${side}. Puedes usar una URL directa .mp3/.m4a.`);
    } finally {
      setUploadingAudio(null);
    }
  };

  const handleAddShowcaseTrack = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTrack.title.trim() || !newTrack.artist.trim()) {
      notify('Completa Título y Artista para guardar el track A/B.');
      return;
    }
    const track: ShowcaseTrack = {
      id: `track-${Date.now()}`,
      title: newTrack.title.trim(),
      artist: newTrack.artist.trim(),
      genre: newTrack.genre.trim() || 'Urbano',
      bpm: Number(newTrack.bpm) || 96,
      descriptionA: newTrack.descriptionA,
      descriptionB: newTrack.descriptionB,
      audioAUrl: newTrack.audioAUrl.trim(),
      audioBUrl: newTrack.audioBUrl.trim(),
    };
    const updated = guardarShowcaseTrack(track);
    setTracks(updated);
    setNewTrack({
      title: '',
      artist: '',
      genre: 'Reggaetón / Urbano',
      bpm: 96,
      audioAUrl: '',
      audioBUrl: '',
      descriptionA: 'Voz cruda / maqueta sin procesar.',
      descriptionB: 'Mezcla multitrack, afinación vocal y master comercial Badlenz.',
    });
    notify(`Track A/B "${track.title}" publicado en el Showcase.`);
  };

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    guardarStudioConfig(studioConfig);
    notify('Configuración del estudio guardada en Firestore.');
  };

  // --- CÁLCULOS DE FINANZAS (MES SELECCIONADO + SEMANAL + META $700) ---
  const metaMensual = Number(studioConfig.metaMensualUsd) || 700;
  const metaSemanal = Math.round(metaMensual / 4);

  const reservasDelMes = reservas.filter(
    (r) =>
      (r.estado === 'Confirmada' || r.estado === 'Completada') &&
      String(r.fecha || '').startsWith(mesFinanzas)
  );
  const movsDelMes = movimientos.filter((m) => String(m.fecha || '').startsWith(mesFinanzas));

  const ingresosReservasMes = reservasDelMes.reduce((acc, r) => {
    const cobrado = r.estado === 'Completada' ? Number(r.subtotal) || 0 : Number(r.deposito) || 0;
    return acc + cobrado;
  }, 0);
  const ingresosManualesMes = movsDelMes
    .filter((m) => m.tipo === 'ingreso')
    .reduce((acc, m) => acc + (Number(m.monto) || 0), 0);
  const gastosMes = movsDelMes
    .filter((m) => m.tipo === 'gasto')
    .reduce((acc, m) => acc + (Number(m.monto) || 0), 0);

  const totalIngresosMes = ingresosReservasMes + ingresosManualesMes;
  const balanceNetoMes = totalIngresosMes - gastosMes;
  const progresoMetaPct = Math.min(100, Math.round((totalIngresosMes / Math.max(1, metaMensual)) * 100));
  const faltanteMeta = Math.max(0, metaMensual - totalIngresosMes);

  // Desglose semanal (Sem 1: 1-7, Sem 2: 8-14, Sem 3: 15-21, Sem 4: 22-31)
  const semanasMes = [
    { label: 'Semana 1 (1–7)', min: 1, max: 7 },
    { label: 'Semana 2 (8–14)', min: 8, max: 14 },
    { label: 'Semana 3 (15–21)', min: 15, max: 21 },
    { label: 'Semana 4 (22–31)', min: 22, max: 31 },
  ].map((sem) => {
    const resSum = reservasDelMes
      .filter((r) => {
        const d = parseInt(String(r.fecha).split('-')[2] || '0', 10);
        return d >= sem.min && d <= sem.max;
      })
      .reduce(
        (acc, r) => acc + (r.estado === 'Completada' ? Number(r.subtotal) || 0 : Number(r.deposito) || 0),
        0
      );
    const manSum = movsDelMes
      .filter((m) => {
        const d = parseInt(String(m.fecha).split('-')[2] || '0', 10);
        return m.tipo === 'ingreso' && d >= sem.min && d <= sem.max;
      })
      .reduce((acc, m) => acc + (Number(m.monto) || 0), 0);
    return { ...sem, total: resSum + manSum };
  });

  // Desglose por método de pago
  const porMetodo: Record<string, number> = {
    'ATH Movil': 0,
    'Tarjeta / Stripe': 0,
    PayPal: 0,
    Efectivo: 0,
  };
  reservasDelMes.forEach((r) => {
    const key = porMetodo[r.metodoPago] !== undefined ? r.metodoPago : 'ATH Movil';
    porMetodo[key] += r.estado === 'Completada' ? Number(r.subtotal) || 0 : Number(r.deposito) || 0;
  });
  movsDelMes
    .filter((m) => m.tipo === 'ingreso')
    .forEach((m) => {
      const key = porMetodo[m.metodoPago] !== undefined ? m.metodoPago : 'ATH Movil';
      porMetodo[key] += Number(m.monto) || 0;
    });

  // Clasificación automática de reservas web por tipo de servicio
  const clasificarReservaServicio = (r: Reserva): CategoriaServicioFinanza => {
    const txt = (r.servicios || []).join(' ').toLowerCase();
    if (txt.includes('renta') || txt.includes('cuarto') || txt.includes('hora')) return 'renta_estudio';
    if (txt.includes('producción completa') || txt.includes('produccion completa')) return 'produccion_completa';
    if (txt.includes('instrumental') || txt.includes('beat') || txt.includes('pista')) return 'instrumental';
    if (txt.includes('mezcla') && (txt.includes('master') || txt.includes('máster'))) return 'mezcla_master';
    if (txt.includes('mezcla')) return 'mezcla_sola';
    if (txt.includes('master') || txt.includes('máster')) return 'master_solo';
    if (txt.includes('grabaci') || txt.includes('voz') || txt.includes('voces') || txt.includes('sesi')) return 'grabacion_voces';
    return 'grabacion_voces';
  };

  const getCategoriaLabel = (cat?: CategoriaServicioFinanza) =>
    CATEGORIAS_SERVICIO_FINANZA.find((c) => c.id === cat)?.label || 'Grabación de Voces';

  // Ranking de ingresos por servicio (para saber qué servicio deja más dinero)
  const servicioStatsMap: Record<CategoriaServicioFinanza, { total: number; count: number }> = {
    grabacion_voces: { total: 0, count: 0 },
    mezcla_master: { total: 0, count: 0 },
    mezcla_sola: { total: 0, count: 0 },
    master_solo: { total: 0, count: 0 },
    instrumental: { total: 0, count: 0 },
    renta_estudio: { total: 0, count: 0 },
    produccion_completa: { total: 0, count: 0 },
    otro: { total: 0, count: 0 },
  };
  reservasDelMes.forEach((r) => {
    const cat = clasificarReservaServicio(r);
    const monto = r.estado === 'Completada' ? Number(r.subtotal) || 0 : Number(r.deposito) || 0;
    servicioStatsMap[cat].total += monto;
    servicioStatsMap[cat].count += 1;
  });
  movsDelMes
    .filter((m) => m.tipo === 'ingreso')
    .forEach((m) => {
      const cat = m.categoriaServicio || 'otro';
      servicioStatsMap[cat].total += Number(m.monto) || 0;
      servicioStatsMap[cat].count += 1;
    });

  const rankingServicios = CATEGORIAS_SERVICIO_FINANZA.map((c) => ({
    ...c,
    total: servicioStatsMap[c.id].total,
    count: servicioStatsMap[c.id].count,
    pct: totalIngresosMes > 0 ? Math.round((servicioStatsMap[c.id].total / totalIngresosMes) * 100) : 0,
  })).sort((a, b) => b.total - a.total);

  const topServicioMes = rankingServicios.find((s) => s.total > 0) || null;

  const handleAddMovimiento = (e: React.FormEvent) => {
    e.preventDefault();
    const montoNum = parseFloat(nuevoMov.monto);
    if (!nuevoMov.concepto.trim() || isNaN(montoNum) || montoNum <= 0) {
      notify('Ingresa un concepto y un monto válido mayor a 0.');
      return;
    }
    const updated = guardarMovimientoFinanciero({
      fecha: nuevoMov.fecha,
      concepto: nuevoMov.concepto.trim(),
      monto: montoNum,
      tipo: nuevoMov.tipo,
      categoriaServicio: nuevoMov.categoriaServicio,
      metodoPago: nuevoMov.metodoPago,
      nota: nuevoMov.nota.trim() || undefined,
    });
    setMovimientos(updated);
    setNuevoMov({ ...nuevoMov, concepto: '', monto: '', nota: '' });
    notify(
      `${nuevoMov.tipo === 'ingreso' ? 'Ingreso' : 'Gasto'} de $${montoNum} USD (${getCategoriaLabel(nuevoMov.categoriaServicio)}) guardado en Firestore.`
    );
  };

  const handleExportFinanzasCsv = () => {
    const rows = [
      ['Fecha', 'Tipo', 'Servicio', 'Concepto', 'Metodo', 'Monto USD', 'Origen'],
      ...reservasDelMes.map((r) => [
        r.fecha,
        'Ingreso',
        getCategoriaLabel(clasificarReservaServicio(r)),
        `Reserva #${r.id} - ${r.nombreArtistico}`,
        r.metodoPago,
        String(r.estado === 'Completada' ? r.subtotal : r.deposito),
        'Reserva Web',
      ]),
      ...movsDelMes.map((m) => [
        m.fecha,
        m.tipo === 'ingreso' ? 'Ingreso' : 'Gasto',
        getCategoriaLabel(m.categoriaServicio),
        m.concepto,
        m.metodoPago,
        m.tipo === 'gasto' ? `-${m.monto}` : String(m.monto),
        'Manual Admin',
      ]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `La_Facultad_Finanzas_${mesFinanzas}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5 pb-12">
      {/* Toast flotante */}
      {toast && (
        <div className="fixed top-20 right-4 z-50 bg-emerald-950/95 border border-emerald-500/50 text-emerald-200 px-4 py-3 rounded-2xl shadow-2xl text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toast}</span>
        </div>
      )}

      {/* Cabecera compacta Control Room */}
      <div className="rounded-3xl bg-[#0e1018] border border-white/10 p-4 sm:p-6 space-y-4 shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-amber-400 font-bold">
              Control Room Ultraligero · Cloud Sync
            </span>
            <h2 className="text-xl sm:text-2xl font-syne font-extrabold text-white uppercase tracking-tight">
              Panel Operativo Badlenz
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <a
              href={ARTIST_PORTAL_BASE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-xs font-semibold text-amber-300 flex items-center gap-1.5 transition"
            >
              <span>Faculty Projects</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
            <button
              type="button"
              onClick={() => setShowNewBooking(true)}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-lg"
            >
              <Plus className="w-4 h-4" />
              <span>Nueva Sesión</span>
            </button>
          </div>
        </div>

        {/* KPIs rápidos */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-2xl bg-black/40 border border-zinc-800 p-3.5">
            <span className="text-[10px] font-mono uppercase text-zinc-400 block">Pendientes</span>
            <strong className="text-2xl font-syne text-amber-400">{pendientesCount}</strong>
          </div>
          <div className="rounded-2xl bg-black/40 border border-zinc-800 p-3.5">
            <span className="text-[10px] font-mono uppercase text-zinc-400 block">Confirmadas</span>
            <strong className="text-2xl font-syne text-emerald-400">{confirmadasCount}</strong>
          </div>
          <div className="rounded-2xl bg-black/40 border border-zinc-800 p-3.5">
            <span className="text-[10px] font-mono uppercase text-zinc-400 block">Depósitos Confirmados</span>
            <strong className="text-2xl font-syne text-white">${totalDepositos}</strong>
          </div>
          <div className="rounded-2xl bg-black/40 border border-zinc-800 p-3.5">
            <span className="text-[10px] font-mono uppercase text-zinc-400 block">Estado En Vivo</span>
            <strong className="text-xs font-mono text-zinc-200 block mt-1 truncate">
              {liveStatus.titulo}
            </strong>
          </div>
        </div>

        {/* 6 Pestañas Enfocadas */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-2 border-t border-white/10 scrollbar-none">
          {[
            { id: 'reservas', label: 'Reservas & Depósitos', icon: Ticket, badge: pendientesCount || null },
            { id: 'finanzas', label: `Finanzas ($${totalIngresosMes}/$${metaMensual})`, icon: DollarSign, badge: null },
            { id: 'calendario', label: 'Bloqueo de Fechas', icon: Calendar, badge: null },
            { id: 'estado', label: 'Estado del Estudio', icon: Radio, badge: null },
            { id: 'showcase', label: 'Audio A/B', icon: Music, badge: tracks.length },
            { id: 'ajustes', label: 'Ajustes & Pagos', icon: Settings, badge: null },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as AdminTab)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                  active
                    ? 'bg-gradient-to-r from-red-600 to-amber-600 text-white shadow-lg'
                    : 'text-zinc-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
                {tab.badge !== null && (
                  <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-black/40 text-amber-300 font-mono">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* TAB 1: RESERVAS & DEPÓSITOS */}
      {activeTab === 'reservas' && (
        <div className="rounded-3xl bg-[#0e1018] border border-white/10 p-4 sm:p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-sm font-syne font-bold uppercase tracking-wider text-white">
              Gestión de Reservas ({reservasFiltradas.length})
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {['Todas', 'Pendiente', 'Confirmada', 'Completada', 'Cancelada'].map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setFiltroEstado(st)}
                  className={`px-3 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition ${
                    filtroEstado === st
                      ? 'bg-red-600 text-white'
                      : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {reservasFiltradas.length === 0 ? (
            <div className="text-center py-12 text-zinc-500 text-xs font-mono">
              No hay reservas en esta vista todavía.
            </div>
          ) : (
            <div className="space-y-3">
              {reservasFiltradas.map((r) => (
                <div
                  key={r.id}
                  className="rounded-2xl bg-[#131622] border border-zinc-800 p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-syne font-extrabold text-white">
                        {r.nombreArtistico}
                      </span>
                      <span className="text-[10px] font-mono text-zinc-400 bg-black/50 px-2 py-0.5 rounded">
                        #{r.id}
                      </span>
                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                          r.estado === 'Confirmada'
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-700/60'
                            : r.estado === 'Pendiente'
                            ? 'bg-amber-950 text-amber-300 border border-amber-700/60'
                            : r.estado === 'Completada'
                            ? 'bg-blue-950 text-blue-300 border border-blue-700/60'
                            : 'bg-zinc-900 text-zinc-400 border border-zinc-700'
                        }`}
                      >
                        {r.estado}
                      </span>
                    </div>

                    <div className="text-xs text-zinc-300 flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-red-400" />
                        <strong>{r.fecha}</strong>
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-amber-400" />
                        {r.horaInicio} - {r.horaSalida}
                      </span>
                      <span>
                        Método: <strong className="text-white">{r.metodoPago}</strong>
                      </span>
                      <span>
                        Depósito: <strong className="text-amber-300">${r.deposito}</strong> · Saldo:{' '}
                        <strong className="text-emerald-400">${r.balance}</strong>
                      </span>
                    </div>

                    {r.comprobanteNumReferencia && (
                      <p className="text-[11px] font-mono text-amber-300">
                        Ref ATH/Pago: {r.comprobanteNumReferencia}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {r.comprobanteAthUrl && (
                      <button
                        type="button"
                        onClick={() => setPreviewImage(r.comprobanteAthUrl || null)}
                        className="px-3 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                      >
                        <ImageIcon className="w-3.5 h-3.5" />
                        <span>Ver Recibo</span>
                      </button>
                    )}

                    {r.estado === 'Pendiente' && (
                      <button
                        type="button"
                        onClick={() => handleConfirmarReserva(r, true)}
                        className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>Confirmar + WhatsApp</span>
                      </button>
                    )}

                    {r.estado === 'Confirmada' && (
                      <button
                        type="button"
                        onClick={() => handleCambiarEstadoReserva(r.id, 'Completada')}
                        className="px-3 py-2 rounded-xl bg-blue-600/80 hover:bg-blue-600 text-white text-xs font-bold cursor-pointer"
                      >
                        Marcar Completada
                      </button>
                    )}

                    {r.estado !== 'Cancelada' && (
                      <button
                        type="button"
                        onClick={() => handleCambiarEstadoReserva(r.id, 'Cancelada')}
                        className="px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                        title="Cancela y libera el bloque en el calendario"
                      >
                        <XCircle className="w-3.5 h-3.5 text-red-400" />
                        <span>Liberar</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleEliminarReserva(r.id)}
                      className="p-2 rounded-xl bg-red-950/50 hover:bg-red-900/70 text-red-400 cursor-pointer"
                      title="Eliminar registro"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: FINANZAS MENSUALES, SEMANALES Y META $700 */}
      {activeTab === 'finanzas' && (
        <div className="space-y-5">
          {/* Header Mes + Meta Editable + Export CSV */}
          <div className="rounded-3xl bg-[#0e1018] border border-white/10 p-5 sm:p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-400 font-bold flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5" />
                  Control Financiero & Meta Mensual
                </span>
                <h3 className="text-lg font-syne font-extrabold text-white uppercase mt-0.5">
                  Meta de ${metaMensual} USD / Mes
                </h3>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="month"
                  value={mesFinanzas}
                  onChange={(e) => setMesFinanzas(e.target.value)}
                  className="bg-[#131622] border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white font-mono"
                />
                <div className="flex items-center gap-1.5 bg-[#131622] border border-zinc-700 rounded-xl px-2.5 py-1.5 text-xs">
                  <span className="text-zinc-400 font-mono text-[10px]">Meta $:</span>
                  <input
                    type="number"
                    min={100}
                    step={50}
                    value={metaMensual}
                    onChange={(e) => {
                      const val = Math.max(100, Number(e.target.value) || 700);
                      const updated = { ...studioConfig, metaMensualUsd: val };
                      setStudioConfig(updated);
                      guardarStudioConfig({ metaMensualUsd: val });
                    }}
                    className="w-16 bg-transparent text-amber-300 font-mono font-bold focus:outline-none"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleExportFinanzasCsv}
                  className="px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-xs font-bold text-white flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-amber-400" />
                  <span>CSV</span>
                </button>
              </div>
            </div>

            {/* Barra de progreso hacia los $700 */}
            <div className="rounded-2xl bg-black/50 border border-zinc-800 p-4 space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-white">
                  Progreso del Mes: <strong className="text-emerald-400 text-base">${totalIngresosMes} USD</strong>{' '}
                  <span className="text-zinc-400">/ ${metaMensual} USD</span>
                </span>
                <span
                  className={`font-mono font-black text-xs px-2.5 py-0.5 rounded-full ${
                    totalIngresosMes >= metaMensual
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/60'
                      : 'bg-amber-950 text-amber-300 border border-amber-500/50'
                  }`}
                >
                  {totalIngresosMes >= metaMensual
                    ? `¡META ALCANZADA! (+$${totalIngresosMes - metaMensual})`
                    : `${progresoMetaPct}% · Faltan $${faltanteMeta}`}
                </span>
              </div>
              <div className="w-full h-3.5 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800">
                <div
                  className={`h-full transition-all duration-500 ${
                    totalIngresosMes >= metaMensual
                      ? 'bg-gradient-to-r from-emerald-500 to-green-400'
                      : 'bg-gradient-to-r from-red-600 via-amber-500 to-emerald-400'
                  }`}
                  style={{ width: `${progresoMetaPct}%` }}
                />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-xs">
                <div className="bg-[#131622] p-3 rounded-xl border border-zinc-800">
                  <span className="text-[10px] font-mono text-zinc-400 block">Reservas Web</span>
                  <strong className="text-white text-base font-mono">${ingresosReservasMes}</strong>
                </div>
                <div className="bg-[#131622] p-3 rounded-xl border border-zinc-800">
                  <span className="text-[10px] font-mono text-zinc-400 block">Ingresos Manuales</span>
                  <strong className="text-amber-300 text-base font-mono">${ingresosManualesMes}</strong>
                </div>
                <div className="bg-[#131622] p-3 rounded-xl border border-zinc-800">
                  <span className="text-[10px] font-mono text-zinc-400 block">Gastos del Mes</span>
                  <strong className="text-red-400 text-base font-mono">-${gastosMes}</strong>
                </div>
                <div className="bg-[#131622] p-3 rounded-xl border border-zinc-800">
                  <span className="text-[10px] font-mono text-zinc-400 block">Balance Neto</span>
                  <strong className="text-emerald-400 text-base font-mono">${balanceNetoMes}</strong>
                </div>
              </div>
            </div>

            {/* Desglose Semanal (Meta ~$175/sem) + Desglose por Método */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              <div className="lg:col-span-7 rounded-2xl bg-[#131622] border border-zinc-800 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-syne font-bold uppercase text-white flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4 text-amber-400" />
                    <span>Ritmo Semanal (Meta ~${metaSemanal}/sem)</span>
                  </span>
                </div>
                <div className="space-y-2.5">
                  {semanasMes.map((sem) => {
                    const pct = Math.min(100, Math.round((sem.total / Math.max(1, metaSemanal)) * 100));
                    return (
                      <div key={sem.label} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-zinc-300 font-mono">{sem.label}</span>
                          <span className="font-mono font-bold text-white">
                            ${sem.total}{' '}
                            <span className={sem.total >= metaSemanal ? 'text-emerald-400' : 'text-zinc-500'}>
                              ({pct}%)
                            </span>
                          </span>
                        </div>
                        <div className="w-full h-2 bg-black/60 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              sem.total >= metaSemanal ? 'bg-emerald-500' : 'bg-amber-500'
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="lg:col-span-5 rounded-2xl bg-[#131622] border border-zinc-800 p-4 space-y-3">
                <span className="text-xs font-syne font-bold uppercase text-white block">
                  Entradas por Método de Pago
                </span>
                <div className="space-y-2 text-xs">
                  {Object.entries(porMetodo).map(([metodo, total]) => (
                    <div
                      key={metodo}
                      className="flex items-center justify-between bg-black/40 px-3 py-2 rounded-xl border border-zinc-800/80"
                    >
                      <span className="text-zinc-300">{metodo}</span>
                      <strong className="font-mono text-white">${total} USD</strong>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* RANKING: ¿QUÉ SERVICIO TE ESTÁ DEJANDO MÁS DINERO? */}
            <div className="rounded-2xl bg-[#131622] border border-zinc-800 p-4 sm:p-5 space-y-3.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400 font-bold block">
                    Rentabilidad por Servicio
                  </span>
                  <h4 className="text-sm font-syne font-extrabold uppercase text-white">
                    ¿Qué servicio te está dejando el dinero en {mesFinanzas}?
                  </h4>
                </div>
                {topServicioMes && (
                  <span className="self-start sm:self-auto px-3 py-1 rounded-full bg-amber-500/15 border border-amber-400/50 text-amber-300 text-[11px] font-bold font-mono">
                    TOP: {topServicioMes.label} (${topServicioMes.total} · {topServicioMes.pct}%)
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {rankingServicios.map((serv, idx) => (
                  <div
                    key={serv.id}
                    className={`rounded-xl p-3 border space-y-1.5 ${
                      idx === 0 && serv.total > 0
                        ? 'bg-amber-950/20 border-amber-500/50'
                        : 'bg-black/40 border-zinc-800/90'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <span className="font-bold text-white truncate">
                        {idx === 0 && serv.total > 0 ? '★ ' : ''}
                        {serv.label}
                      </span>
                      <span className="font-mono text-emerald-400 font-bold shrink-0">
                        ${serv.total}{' '}
                        <span className="text-zinc-400 font-normal">({serv.pct}%)</span>
                      </span>
                    </div>
                    <div className="w-full h-2 bg-zinc-900 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          idx === 0 && serv.total > 0
                            ? 'bg-gradient-to-r from-amber-500 to-emerald-400'
                            : 'bg-red-500/80'
                        }`}
                        style={{ width: `${serv.pct}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-mono text-zinc-400 block">
                      {serv.count} {serv.count === 1 ? 'trabajo / sesión' : 'trabajos / sesiones'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Formulario Rápido para Subir Data + Historial del Mes */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            <form
              onSubmit={handleAddMovimiento}
              className="lg:col-span-5 rounded-3xl bg-[#0e1018] border border-white/10 p-5 space-y-3.5"
            >
              <h4 className="text-sm font-syne font-bold uppercase text-white">
                Subir Ingreso / Gasto Manual
              </h4>
              <p className="text-xs text-zinc-400">
                Registra pagos en efectivo, balances cobrados en sesión, mezclas sueltas, beats o gastos del studio.
              </p>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setNuevoMov({ ...nuevoMov, tipo: 'ingreso' })}
                  className={`py-2 rounded-xl text-xs font-bold cursor-pointer border ${
                    nuevoMov.tipo === 'ingreso'
                      ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300'
                      : 'bg-[#131622] border-zinc-800 text-zinc-400'
                  }`}
                >
                  + Ingreso
                </button>
                <button
                  type="button"
                  onClick={() => setNuevoMov({ ...nuevoMov, tipo: 'gasto' })}
                  className={`py-2 rounded-xl text-xs font-bold cursor-pointer border ${
                    nuevoMov.tipo === 'gasto'
                      ? 'bg-red-600/20 border-red-500 text-red-300'
                      : 'bg-[#131622] border-zinc-800 text-zinc-400'
                  }`}
                >
                  - Gasto
                </button>
              </div>

              <input
                type="text"
                required
                placeholder="Concepto (ej: Saldo sesión Zyron / Mezcla / Beat)"
                value={nuevoMov.concepto}
                onChange={(e) => setNuevoMov({ ...nuevoMov, concepto: e.target.value })}
                className="w-full bg-[#131622] border border-zinc-700 rounded-xl px-3 py-2.5 text-xs text-white"
              />

              <div className="grid grid-cols-2 gap-2.5">
                <input
                  type="number"
                  required
                  min="1"
                  step="0.01"
                  placeholder="Monto ($ USD)"
                  value={nuevoMov.monto}
                  onChange={(e) => setNuevoMov({ ...nuevoMov, monto: e.target.value })}
                  className="bg-[#131622] border border-zinc-700 rounded-xl px-3 py-2.5 text-xs text-white font-mono"
                />
                <input
                  type="date"
                  value={nuevoMov.fecha}
                  onChange={(e) => setNuevoMov({ ...nuevoMov, fecha: e.target.value })}
                  className="bg-[#131622] border border-zinc-700 rounded-xl px-3 py-2.5 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase text-zinc-400 mb-1">
                  Categoría de Servicio
                </label>
                <select
                  value={nuevoMov.categoriaServicio}
                  onChange={(e) =>
                    setNuevoMov({
                      ...nuevoMov,
                      categoriaServicio: e.target.value as CategoriaServicioFinanza,
                    })
                  }
                  className="w-full bg-[#131622] border border-zinc-700 rounded-xl px-3 py-2.5 text-xs text-white"
                >
                  {CATEGORIAS_SERVICIO_FINANZA.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              <select
                value={nuevoMov.metodoPago}
                onChange={(e) =>
                  setNuevoMov({
                    ...nuevoMov,
                    metodoPago: e.target.value as MovimientoFinanciero['metodoPago'],
                  })
                }
                className="w-full bg-[#131622] border border-zinc-700 rounded-xl px-3 py-2.5 text-xs text-white"
              >
                <option value="ATH Movil">ATH Móvil</option>
                <option value="Tarjeta / Stripe">Tarjeta / Stripe</option>
                <option value="PayPal">PayPal</option>
                <option value="Efectivo">Efectivo</option>
              </select>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-amber-600 hover:from-emerald-500 hover:to-amber-500 text-white text-xs font-bold uppercase tracking-wider cursor-pointer shadow-lg"
              >
                Guardar Movimiento en Firestore
              </button>
            </form>

            <div className="lg:col-span-7 rounded-3xl bg-[#0e1018] border border-white/10 p-5 space-y-3">
              <h4 className="text-sm font-syne font-bold uppercase text-white">
                Movimientos del Mes ({movsDelMes.length + reservasDelMes.length})
              </h4>

              {movsDelMes.length === 0 && reservasDelMes.length === 0 ? (
                <div className="text-center py-10 text-xs font-mono text-zinc-500">
                  Aún no hay movimientos registrados en {mesFinanzas}.
                </div>
              ) : (
                <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                  {movsDelMes.map((m) => (
                    <div
                      key={m.id}
                      className="flex items-center justify-between gap-3 bg-[#131622] border border-zinc-800 px-3.5 py-2.5 rounded-xl text-xs"
                    >
                      <div>
                        <strong className="text-white block">{m.concepto}</strong>
                        <span className="text-[10px] font-mono text-zinc-400">
                          {m.fecha} · <span className="text-amber-300">{getCategoriaLabel(m.categoriaServicio)}</span> · {m.metodoPago}
                        </span>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <strong
                          className={`font-mono ${
                            m.tipo === 'ingreso' ? 'text-emerald-400' : 'text-red-400'
                          }`}
                        >
                          {m.tipo === 'ingreso' ? '+' : '-'}${m.monto}
                        </strong>
                        <button
                          type="button"
                          onClick={() => {
                            setMovimientos(eliminarMovimientoFinanciero(m.id));
                            notify('Movimiento eliminado.');
                          }}
                          className="text-zinc-500 hover:text-red-400 cursor-pointer"
                          title="Eliminar"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}

                  {reservasDelMes.map((r) => {
                    const monto = r.estado === 'Completada' ? r.subtotal : r.deposito;
                    return (
                      <div
                        key={r.id}
                        className="flex items-center justify-between gap-3 bg-black/40 border border-zinc-800/80 px-3.5 py-2.5 rounded-xl text-xs"
                      >
                        <div>
                          <strong className="text-zinc-200 block">
                            Reserva #{r.id} · {r.nombreArtistico}
                          </strong>
                          <span className="text-[10px] font-mono text-zinc-400">
                            {r.fecha} · {r.metodoPago} · {r.estado === 'Completada' ? 'Pago Completo' : 'Depósito'}
                          </span>
                        </div>
                        <strong className="font-mono text-emerald-400">+${monto}</strong>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: BLOQUEO DE FECHAS (SINCRONIZADO EN FIRESTORE) */}
      {activeTab === 'calendario' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-5 rounded-3xl bg-[#0e1018] border border-white/10 p-5 space-y-4">
            <h3 className="text-sm font-syne font-bold uppercase tracking-wider text-white">
              Bloquear o Liberar Fecha (En Vivo)
            </h3>
            <p className="text-xs text-zinc-400">
              Cualquier cambio aquí se guarda en Firestore y actualiza el calendario de todos los artistas al instante.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-mono text-zinc-400 mb-1">Fecha</label>
                <input
                  type="date"
                  value={fechaBloqueo}
                  onChange={(e) => setFechaBloqueo(e.target.value)}
                  className="w-full bg-[#131622] border border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-zinc-400 mb-1">
                  Motivo visible (opcional)
                </label>
                <input
                  type="text"
                  value={motivoBloqueo}
                  onChange={(e) => setMotivoBloqueo(e.target.value)}
                  className="w-full bg-[#131622] border border-zinc-700 rounded-xl px-3 py-2.5 text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    guardarDisponibilidadDia(fechaBloqueo, false, undefined, motivoBloqueo);
                    notify(`Fecha ${fechaBloqueo} bloqueada en Firestore.`);
                  }}
                  className="py-2.5 px-3 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold cursor-pointer"
                >
                  Bloquear Día Completo
                </button>
                <button
                  type="button"
                  onClick={() => {
                    guardarDisponibilidadDia(fechaBloqueo, true, '13:00 - 22:00', 'Día Liberado por Badlenz');
                    notify(`Fecha ${fechaBloqueo} liberada (Tarde y Noche).`);
                  }}
                  className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold cursor-pointer"
                >
                  Liberar Día Completo
                </button>
                <button
                  type="button"
                  onClick={() => {
                    guardarDisponibilidadDia(fechaBloqueo, true, '13:00 - 17:00', 'Solo Bloque Tarde disponible');
                    notify(`${fechaBloqueo}: solo Tarde (1–5 PM) abierto.`);
                  }}
                  className="py-2 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-amber-300 text-xs font-semibold cursor-pointer"
                >
                  Solo Tarde (1–5 PM)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    guardarDisponibilidadDia(fechaBloqueo, true, '18:00 - 22:00', 'Solo Bloque Noche disponible');
                    notify(`${fechaBloqueo}: solo Noche (6–10 PM) abierto.`);
                  }}
                  className="py-2 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-amber-300 text-xs font-semibold cursor-pointer"
                >
                  Solo Noche (6–10 PM)
                </button>
              </div>
            </div>

            {/* Lista de reglas activas */}
            <div className="pt-3 border-t border-zinc-800 space-y-2">
              <span className="text-[10px] font-mono uppercase text-zinc-400 block">
                Fechas personalizadas activas ({Object.keys(disponibilidades).length})
              </span>
              <div className="max-h-52 overflow-y-auto space-y-1.5">
                {Object.entries(disponibilidades).map(([fecha, info]) => (
                  <div
                    key={fecha}
                    className="flex items-center justify-between bg-[#131622] px-3 py-2 rounded-xl border border-zinc-800 text-xs"
                  >
                    <div>
                      <strong className="text-white font-mono">{fecha}</strong>
                      <span
                        className={`ml-2 text-[10px] font-bold ${
                          info.disponible ? 'text-emerald-400' : 'text-red-400'
                        }`}
                      >
                        {info.disponible ? info.horarioPermitido || 'Abierto' : 'Bloqueado'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        eliminarDisponibilidadDia(fecha);
                        notify(`Regla de ${fecha} eliminada.`);
                      }}
                      className="text-zinc-500 hover:text-red-400 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 rounded-3xl bg-[#0e1018] border border-white/10 p-4">
            <CalendarioSection
              isAdmin={true}
              selectedDate={fechaBloqueo}
              onSelectSlot={(slot) => {
                if (slot.fechaStr) setFechaBloqueo(slot.fechaStr);
              }}
            />
          </div>
        </div>
      )}

      {/* TAB 3: ESTADO DEL ESTUDIO (EN VIVO) */}
      {activeTab === 'estado' && (
        <div className="rounded-3xl bg-[#0e1018] border border-white/10 p-5 sm:p-6 space-y-5">
          <div>
            <h3 className="text-sm font-syne font-bold uppercase tracking-wider text-white">
              Estado del Estudio en Vivo (Visible para todos los visitantes)
            </h3>
            <p className="text-xs text-zinc-400 mt-1">
              Al seleccionar un estado se guarda en Firestore y actualiza el badge superior y los avisos de la landing al instante.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {(
              [
                'disponible',
                'grabando',
                'mezclando',
                'cerrado',
                'vacaciones',
                'mantenimiento',
              ] as StudioLiveStatusType[]
            ).map((key) => {
              const preset = PRESET_STATUSES[key];
              const active = liveStatus.estado === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleSetStatusPreset(key)}
                  className={`p-4 rounded-2xl border text-left transition cursor-pointer ${
                    active
                      ? 'bg-red-950/40 border-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.2)]'
                      : 'bg-[#131622] border-zinc-800 hover:border-zinc-600'
                  }`}
                >
                  <div className="font-bold text-xs text-white">{preset.titulo}</div>
                  <p className="text-[11px] text-zinc-400 mt-1">{preset.subtitulo}</p>
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-zinc-800">
            <div>
              <label className="block text-[11px] font-mono text-zinc-400 mb-1">
                Próximo turno libre (texto visible)
              </label>
              <input
                type="text"
                value={liveStatus.proximoTurnoLibre || ''}
                onChange={(e) => setLiveStatus({ ...liveStatus, proximoTurnoLibre: e.target.value })}
                className="w-full bg-[#131622] border border-zinc-700 rounded-xl px-3 py-2.5 text-xs text-white"
              />
            </div>
            <div>
              <label className="block text-[11px] font-mono text-zinc-400 mb-1">
                Subtítulo / Nota breve
              </label>
              <input
                type="text"
                value={liveStatus.subtitulo || ''}
                onChange={(e) => setLiveStatus({ ...liveStatus, subtitulo: e.target.value })}
                className="w-full bg-[#131622] border border-zinc-700 rounded-xl px-3 py-2.5 text-xs text-white"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setStudioLiveStatus(liveStatus);
              notify('Estado personalizado publicado en vivo.');
            }}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-amber-600 text-white text-xs font-bold uppercase tracking-wider cursor-pointer"
          >
            Guardar Nota de Estado
          </button>
        </div>
      )}

      {/* TAB 4: AUDIO A/B SHOWCASE */}
      {activeTab === 'showcase' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <form
            onSubmit={handleAddShowcaseTrack}
            className="lg:col-span-6 rounded-3xl bg-[#0e1018] border border-white/10 p-5 space-y-3.5"
          >
            <h3 className="text-sm font-syne font-bold uppercase tracking-wider text-white">
              Subir / Cambiar Tema A/B
            </h3>
            <p className="text-xs text-zinc-400">
              Pega URLs directas (.mp3 / .m4a recomendados de 30–45s) para que carguen en todos los celulares, o sube un archivo local.
            </p>

            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                required
                placeholder="Título del tema (ej: TuKuTu)"
                value={newTrack.title}
                onChange={(e) => setNewTrack({ ...newTrack, title: e.target.value })}
                className="bg-[#131622] border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white"
              />
              <input
                type="text"
                required
                placeholder="Artista (ej: Zyron)"
                value={newTrack.artist}
                onChange={(e) => setNewTrack({ ...newTrack, artist: e.target.value })}
                className="bg-[#131622] border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white"
              />
              <input
                type="text"
                placeholder="Género"
                value={newTrack.genre}
                onChange={(e) => setNewTrack({ ...newTrack, genre: e.target.value })}
                className="bg-[#131622] border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white"
              />
              <input
                type="number"
                placeholder="BPM"
                value={newTrack.bpm}
                onChange={(e) => setNewTrack({ ...newTrack, bpm: Number(e.target.value) })}
                className="bg-[#131622] border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-[11px] font-mono text-zinc-400">
                Audio A (Crudo / Referencia)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="URL .mp3 / .m4a (ej: /zyron-tukutu-reff.mp3)"
                  value={newTrack.audioAUrl}
                  onChange={(e) => setNewTrack({ ...newTrack, audioAUrl: e.target.value })}
                  className="flex-1 bg-[#131622] border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white font-mono"
                />
                <label className="px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-200 cursor-pointer flex items-center gap-1 shrink-0">
                  <Upload className="w-3.5 h-3.5" />
                  <span>{uploadingAudio === 'A' ? '...' : 'Subir'}</span>
                  <input
                    type="file"
                    accept="audio/*"
                    onChange={(e) => handleAudioFileUpload('A', e)}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-[11px] font-mono text-zinc-400">
                Audio B (Master La Facultad)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="URL .mp3 / .m4a (ej: /zyron-tukutu-master.m4a)"
                  value={newTrack.audioBUrl}
                  onChange={(e) => setNewTrack({ ...newTrack, audioBUrl: e.target.value })}
                  className="flex-1 bg-[#131622] border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white font-mono"
                />
                <label className="px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-200 cursor-pointer flex items-center gap-1 shrink-0">
                  <Upload className="w-3.5 h-3.5" />
                  <span>{uploadingAudio === 'B' ? '...' : 'Subir'}</span>
                  <input
                    type="file"
                    accept="audio/*"
                    onChange={(e) => handleAudioFileUpload('B', e)}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-amber-600 text-white text-xs font-bold uppercase tracking-wider cursor-pointer"
            >
              Publicar Tema en Showcase A/B
            </button>
          </form>

          <div className="lg:col-span-6 rounded-3xl bg-[#0e1018] border border-white/10 p-5 space-y-3">
            <h3 className="text-sm font-syne font-bold uppercase tracking-wider text-white">
              Temas Activos ({tracks.length})
            </h3>
            <div className="space-y-2.5">
              {tracks.map((t) => (
                <div
                  key={t.id}
                  className="rounded-2xl bg-[#131622] border border-zinc-800 p-3.5 flex items-center justify-between gap-3"
                >
                  <div>
                    <div className="text-xs font-bold text-white">
                      {t.artist} — {t.title}
                    </div>
                    <div className="text-[11px] font-mono text-zinc-400">
                      {t.genre} · {t.bpm} BPM
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setTracks(eliminarShowcaseTrack(t.id));
                      notify(`Track "${t.title}" eliminado.`);
                    }}
                    className="p-2 rounded-xl bg-red-950/50 hover:bg-red-900/70 text-red-400 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: AJUSTES, PROMO & STRIPE */}
      {activeTab === 'ajustes' && (
        <form
          onSubmit={handleSaveConfig}
          className="rounded-3xl bg-[#0e1018] border border-white/10 p-5 sm:p-6 space-y-5"
        >
          <h3 className="text-sm font-syne font-bold uppercase tracking-wider text-white flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-amber-400" />
            <span>Pagos, Cupos Promo y Ubicación</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-mono text-zinc-400 mb-1">
                Link de Depósito Stripe ($50 USD · Tarjeta / Apple Pay)
              </label>
              <input
                type="url"
                placeholder="https://buy.stripe.com/..."
                value={studioConfig.stripeDepositLink || ''}
                onChange={(e) =>
                  setStudioConfig({ ...studioConfig, stripeDepositLink: e.target.value })
                }
                className="w-full bg-[#131622] border border-zinc-700 rounded-xl px-3 py-2.5 text-xs text-white font-mono"
              />
              <p className="text-[10px] text-zinc-500 mt-1">
                Pega tu Stripe Payment Link de $50 USD para activar pago inmediato con tarjeta y Apple Pay en el Paso 3.
              </p>
            </div>

            <div>
              <label className="block text-[11px] font-mono text-zinc-400 mb-1">
                Teléfono ATH Móvil Personal
              </label>
              <input
                type="text"
                value={studioConfig.athMovilTelefono || '(787) 240-8627'}
                onChange={(e) =>
                  setStudioConfig({ ...studioConfig, athMovilTelefono: e.target.value })
                }
                className="w-full bg-[#131622] border border-zinc-700 rounded-xl px-3 py-2.5 text-xs text-white font-mono"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono text-zinc-400 mb-1">
                Enlace PayPal.me
              </label>
              <input
                type="url"
                placeholder="https://paypal.me/badlenzprod"
                value={studioConfig.paypalMeUrl || 'https://paypal.me/badlenzprod'}
                onChange={(e) =>
                  setStudioConfig({ ...studioConfig, paypalMeUrl: e.target.value })
                }
                className="w-full bg-[#131622] border border-zinc-700 rounded-xl px-3 py-2.5 text-xs text-white font-mono"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono text-zinc-400 mb-1">
                Cupos Promo Reapertura ocupados (de {promoSlots.total})
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={0}
                  max={promoSlots.total}
                  value={promoSlots.reservados}
                  onChange={(e) => {
                    const val = Math.max(0, Math.min(promoSlots.total, Number(e.target.value)));
                    setPromoSlotsReservadosManual(val);
                    setPromoSlots(getPromoSlotsCount());
                    notify(`Cupos promo actualizados: quedan ${promoSlots.total - val} de ${promoSlots.total}.`);
                  }}
                  className="w-24 bg-[#131622] border border-zinc-700 rounded-xl px-3 py-2 text-sm text-amber-300 font-mono"
                />
                <span className="text-xs text-zinc-400">
                  Disponibles mostrados: <strong className="text-white">{promoSlots.disponibles}</strong>
                </span>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-mono text-zinc-400 mb-1">
                Dirección / Sector (Hormigueros, PR)
              </label>
              <input
                type="text"
                value={studioConfig.direccionTexto}
                onChange={(e) =>
                  setStudioConfig({ ...studioConfig, direccionTexto: e.target.value })
                }
                className="w-full bg-[#131622] border border-zinc-700 rounded-xl px-3 py-2.5 text-xs text-white"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono text-zinc-400 mb-1">
                Link Google Maps (Pin Exacto del Studio)
              </label>
              <input
                type="url"
                placeholder="https://maps.app.goo.gl/..."
                value={studioConfig.googleMapsLocationUrl || ''}
                onChange={(e) =>
                  setStudioConfig({ ...studioConfig, googleMapsLocationUrl: e.target.value })
                }
                className="w-full bg-[#131622] border border-zinc-700 rounded-xl px-3 py-2.5 text-xs text-white font-mono"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono text-zinc-400 mb-1">
                Link Waze (Ruta Directa al Studio)
              </label>
              <input
                type="url"
                placeholder="https://waze.com/ul?ll=..."
                value={studioConfig.wazeLocationUrl || ''}
                onChange={(e) =>
                  setStudioConfig({ ...studioConfig, wazeLocationUrl: e.target.value })
                }
                className="w-full bg-[#131622] border border-zinc-700 rounded-xl px-3 py-2.5 text-xs text-white font-mono"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono text-zinc-400 mb-1">
                Link Apple Maps (iPhone / CarPlay)
              </label>
              <input
                type="url"
                placeholder="https://maps.apple.com/?ll=..."
                value={studioConfig.appleMapsLocationUrl || ''}
                onChange={(e) =>
                  setStudioConfig({ ...studioConfig, appleMapsLocationUrl: e.target.value })
                }
                className="w-full bg-[#131622] border border-zinc-700 rounded-xl px-3 py-2.5 text-xs text-white font-mono"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-zinc-800">
            <div className="flex items-center gap-2 text-[11px] text-emerald-400 font-mono">
              <ShieldCheck className="w-4 h-4" />
              <span>Alertas configuradas hacia: ellentemalo@gmail.com</span>
            </div>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-amber-600 text-white text-xs font-bold uppercase tracking-wider cursor-pointer flex items-center gap-2"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Guardar Configuración</span>
            </button>
          </div>
        </form>
      )}

      {/* MODAL NUEVA SESIÓN MANUAL */}
      {showNewBooking && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setShowNewBooking(false)}
        >
          <form
            onSubmit={handleCreateManualBooking}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-3xl bg-[#11131d] border border-zinc-700 p-6 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-syne font-bold text-white uppercase">
                Registrar Sesión Manual
              </h3>
              <button
                type="button"
                onClick={() => setShowNewBooking(false)}
                className="text-zinc-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <input
              type="text"
              required
              placeholder="Nombre artístico"
              value={newBooking.nombreArtistico}
              onChange={(e) => setNewBooking({ ...newBooking, nombreArtistico: e.target.value })}
              className="w-full bg-[#181b28] border border-zinc-700 rounded-xl px-3 py-2.5 text-xs text-white"
            />

            <div className="grid grid-cols-2 gap-3">
              <input
                type="date"
                value={newBooking.fecha}
                onChange={(e) => setNewBooking({ ...newBooking, fecha: e.target.value })}
                className="bg-[#181b28] border border-zinc-700 rounded-xl px-3 py-2.5 text-xs text-white"
              />
              <select
                value={newBooking.bloque}
                onChange={(e) => setNewBooking({ ...newBooking, bloque: e.target.value })}
                className="bg-[#181b28] border border-zinc-700 rounded-xl px-3 py-2.5 text-xs text-white"
              >
                <option value="13:00-17:00">Tarde (1–5 PM)</option>
                <option value="18:00-22:00">Noche (6–10 PM)</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] text-zinc-400 font-mono">Total ($)</label>
                <input
                  type="number"
                  value={newBooking.subtotal}
                  onChange={(e) => setNewBooking({ ...newBooking, subtotal: Number(e.target.value) })}
                  className="w-full bg-[#181b28] border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>
              <div>
                <label className="text-[10px] text-zinc-400 font-mono">Depósito ($)</label>
                <input
                  type="number"
                  value={newBooking.deposito}
                  onChange={(e) => setNewBooking({ ...newBooking, deposito: Number(e.target.value) })}
                  className="w-full bg-[#181b28] border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-gradient-to-r from-red-600 to-amber-600 text-white text-xs font-bold uppercase tracking-wider cursor-pointer"
            >
              Guardar y Bloquear Turno
            </button>
          </form>
        </div>
      )}

      {/* MODAL VISTA PREVIA COMPROBANTE ATH */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-w-lg w-full" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setPreviewImage(null)}
              className="absolute -top-10 right-0 text-white hover:text-amber-400 cursor-pointer flex items-center gap-1 text-xs"
            >
              <X className="w-4 h-4" /> Cerrar
            </button>
            <img
              src={previewImage}
              alt="Comprobante de depósito"
              className="w-full max-h-[80vh] object-contain rounded-2xl border border-amber-500/40 shadow-2xl"
            />
          </div>
        </div>
      )}
    </div>
  );
}
