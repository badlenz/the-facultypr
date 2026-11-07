import React, { useState, useEffect } from 'react';
import { 
  getClientes, 
  getReservas, 
  actualizarReserva, 
  eliminarReserva, 
  actualizarCliente, 
  eliminarCliente,
  guardarCliente,
  guardarReserva,
  Cliente, 
  Reserva,
  getSongFeedbacks,
  guardarSongFeedback,
  vaciarBaseDeDatosCompleta,
  getPromoSlotsCount,
  setPromoSlotsReservadosManual,
  getShowcaseTracks,
  guardarShowcaseTrack,
  eliminarShowcaseTrack,
  ShowcaseTrack,
  getStudioConfig,
  guardarStudioConfig,
  StudioConfig,
  getAppOperationMode,
  setAppOperationMode,
  inicializarModoDemo,
  inicializarModoLanzamiento,
  getLeadsEspera,
  LeadEspera
} from '../services/db';
import {
  obtenerTodasDisponibilidades,
  guardarDisponibilidadDia,
  eliminarDisponibilidadDia,
  formatRangeTo12h,
  format12h
} from '../services/schedule';
import { syncAllToGoogleSheets } from '../services/googleSheets';
import { saveArchivoSesion, ArchivoSesion } from '../services/firebase';
import { saveAudioToStorage } from '../services/audioStorage';
import { 
  getStudioLiveStatus, 
  setStudioLiveStatus, 
  PRESET_STATUSES, 
  StudioLiveStatus, 
  StudioLiveStatusType,
  subscribeToStudioStatus
} from '../services/studioStatus';
import { CalendarioSection } from './Calendario/CalendarioSection';
import { 
  Users, 
  Ticket, 
  DollarSign, 
  Plus, 
  Trash2, 
  Edit, 
  Calendar, 
  Clock, 
  CheckCircle, 
  X, 
  MessageSquare, 
  Send, 
  TrendingUp, 
  BarChart2,
  Check,
  Sparkles,
  Phone,
  Instagram,
  Mail,
  Music,
  Volume2,
  MapPin,
  Compass,
  ShieldAlert,
  Save,
  Lock,
  FileSpreadsheet,
  Award,
  Flame,
  Trophy,
  Camera,
  Image as ImageIcon,
  HardDrive
} from 'lucide-react';

export type AdminTab = 'overview' | 'reservas' | 'calendario' | 'showcase' | 'crm' | 'ajustes';

interface PanelAdminProps {
  defaultSection?: 'all' | 'calendario';
}

export default function PanelAdmin({ defaultSection = 'all' }: PanelAdminProps) {
  const [adminTab, setAdminTab] = useState<AdminTab>(
    defaultSection === 'calendario' ? 'calendario' : 'overview'
  );

  useEffect(() => {
    if (defaultSection === 'calendario') {
      setAdminTab('calendario');
    }
  }, [defaultSection]);
  const formatMoney = (val: number): string => {
    return `$${Number(val || 0).toFixed(2)}`;
  };

  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [firmaModalUrl, setFirmaModalUrl] = useState<string | null>(null);
  const [reciboModalUrl, setReciboModalUrl] = useState<{ url: string; ref?: string; artista: string } | null>(null);
  const [showAdvancedSystemSettings, setShowAdvancedSystemSettings] = useState(false);
  const [currentMode, setCurrentMode] = useState<'demo' | 'lanzamiento'>(getAppOperationMode());
  const [isChangingMode, setIsChangingMode] = useState(false);
  
  // LIVE STUDIO STATUS CONTROL (ON AIR / MEZCLA / DISPONIBLE)
  const [adminLiveStatus, setAdminLiveStatus] = useState<StudioLiveStatus>(getStudioLiveStatus());
  const [customSubtitleInput, setCustomSubtitleInput] = useState(getStudioLiveStatus().subtitulo);
  const [customNextTurnInput, setCustomNextTurnInput] = useState(getStudioLiveStatus().proximoTurnoLibre || '');

  useEffect(() => {
    const unsub = subscribeToStudioStatus((st) => {
      setAdminLiveStatus(st);
      setCustomSubtitleInput(st.subtitulo);
      setCustomNextTurnInput(st.proximoTurnoLibre || '');
    });
    return unsub;
  }, []);

  const handleUpdateStudioLiveStatus = (type: StudioLiveStatusType) => {
    const preset = PRESET_STATUSES[type];
    const newStatus: StudioLiveStatus = {
      ...preset,
      subtitulo: customSubtitleInput || preset.subtitulo,
      proximoTurnoLibre: customNextTurnInput || preset.proximoTurnoLibre
    };
    setAdminLiveStatus(newStatus);
    setStudioLiveStatus(newStatus);
  };
  
  const [adminFileName, setAdminFileName] = useState('');
  const [adminFileEmail, setAdminFileEmail] = useState('');
  const [adminFileType, setAdminFileType] = useState<'Mezcla' | 'Master' | 'Stems' | 'Proyecto' | 'Recibo'>('Mezcla');
  const [adminFileUrl, setAdminFileUrl] = useState('');

  const handleAdminAddFile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminFileName || !adminFileEmail || !adminFileUrl) {
        alert('Por favor completa todos los campos.');
        return;
    }

    const archivo: ArchivoSesion = {
      id: `DRV-${Date.now().toString().slice(-6)}`,
      clienteEmail: adminFileEmail.toLowerCase(),
      nombreArtistico: 'Admin', // Assuming Admin manages this
      nombreArchivo: adminFileName,
      tipo: adminFileType,
      driveUrl: adminFileUrl,
      fechaSubida: new Date().toISOString().split('T')[0],
      tamano: 'N/A'
    };

    await saveArchivoSesion(archivo);
    alert('Archivo guardado y asignado al artista.');
    setAdminFileName('');
    setAdminFileEmail('');
    setAdminFileUrl('');
  };
  const [promoSlotsInfo, setPromoSlotsInfo] = useState(() => getPromoSlotsCount());
  const [showcaseTracks, setShowcaseTracks] = useState<ShowcaseTrack[]>(() => getShowcaseTracks());
  const [editingShowcaseTrack, setEditingShowcaseTrack] = useState<ShowcaseTrack | null>(null);
  const [uploadingAudioA, setUploadingAudioA] = useState(false);
  const [uploadingAudioB, setUploadingAudioB] = useState(false);
  const [audioAStatusMsg, setAudioAStatusMsg] = useState('');
  const [audioBStatusMsg, setAudioBStatusMsg] = useState('');
  const [savingAudioTrack, setSavingAudioTrack] = useState(false);
  const [studioConfig, setStudioConfig] = useState<StudioConfig>(() => getStudioConfig());
  const [savedConfigMessage, setSavedConfigMessage] = useState(false);
  const [leadsEspera, setLeadsEspera] = useState<LeadEspera[]>(() => getLeadsEspera());

  useEffect(() => {
    const handleLeadsUpdate = () => setLeadsEspera(getLeadsEspera());
    window.addEventListener('la_facultad_lead_espera_added', handleLeadsUpdate);
    window.addEventListener('storage', handleLeadsUpdate);
    return () => {
      window.removeEventListener('la_facultad_lead_espera_added', handleLeadsUpdate);
      window.removeEventListener('storage', handleLeadsUpdate);
    };
  }, []);

  const updateDataState = () => {
    setPromoSlotsInfo(getPromoSlotsCount());
    setShowcaseTracks(getShowcaseTracks());
    setStudioConfig(getStudioConfig());
    setCurrentMode(getAppOperationMode());
  };

  const handleToggleMode = async (mode: 'demo' | 'lanzamiento') => {
    if (isChangingMode) return;
    
    let confirmMsg = '';
    if (mode === 'lanzamiento') {
      confirmMsg = '⚠️ ¿CONFIRMAS EL CAMBIO A MODO DE LANZAMIENTO (PRODUCCIÓN)?\n\n' +
        'Esta acción:\n' +
        '1. Borrará permanentemente todos los datos de prueba / demo de la base de datos (tanto en Firestore como localmente).\n' +
        '2. Reiniciará todo a cero para que puedas empezar a registrar tus clientes y sesiones reales de inmediato.\n' +
        '3. Ocultará por completo todos los nombres ficticios y demostraciones.\n\n' +
        '¿Deseas continuar? No se podrá revertir esta acción de vaciado.';
    } else {
      confirmMsg = '📊 ¿CONFIRMAS EL CAMBIO A MODO DEMO?\n\n' +
        'Esta acción volverá a poblar y sembrar la base de datos con clientes de prueba (BADLENZ, Valeria R., Kavita) para que puedas ensayar y ver el funcionamiento completo del sistema.\n\n' +
        '¿Deseas continuar?';
    }

    if (!window.confirm(confirmMsg)) return;

    setIsChangingMode(true);
    try {
      if (mode === 'lanzamiento') {
        await inicializarModoLanzamiento();
        alert('🚀 ¡Modo Lanzamiento activado con éxito! La base de datos está en limpio (0 datos) para su uso en producción.');
      } else {
        await inicializarModoDemo();
        alert('🟢 ¡Modo Demo activado con éxito! Base de datos poblada con registros de prueba.');
      }
    } catch (err) {
      console.error(err);
      alert('Hubo un error al cambiar de modo.');
    } finally {
      setIsChangingMode(false);
    }
  };

  useEffect(() => {
    updateDataState();
    const handleDbReset = () => {
      cargarDatos();
      updateDataState();
    };
    window.addEventListener('la_facultad_db_reset', handleDbReset);
    window.addEventListener('la_facultad_promo_slots_updated', updateDataState);
    window.addEventListener('la_facultad_showcase_updated', updateDataState);
    window.addEventListener('la_facultad_config_updated', updateDataState);
    window.addEventListener('storage', updateDataState);
    return () => {
      window.removeEventListener('la_facultad_db_reset', handleDbReset);
      window.removeEventListener('la_facultad_promo_slots_updated', updateDataState);
      window.removeEventListener('la_facultad_showcase_updated', updateDataState);
      window.removeEventListener('la_facultad_config_updated', updateDataState);
      window.removeEventListener('storage', updateDataState);
    };
  }, []);
  
  // Feedbacks de Canciones por Timestamp
  const [feedbacks, setFeedbacks] = useState<any[]>([]);

  // Filtros
  const [filtroEstado, setFiltroEstado] = useState<string>('todos');
  const [busquedaReserva, setBusquedaReserva] = useState<string>('');
  const [busquedaRanking, setBusquedaRanking] = useState<string>('');

  // Estados para gestión de disponibilidad
  const [fechaLiberar, setFechaLiberar] = useState('2026-10-15');
  const [diaDisponible, setDiaDisponible] = useState(true);
  const [horarioLiberar, setHorarioLiberar] = useState('14:00 - 19:00');
  const [motivoLiberar, setMotivoLiberar] = useState('Turno Tarde Libre');
  const [disponibilidadesManuales, setDisponibilidadesManuales] = useState<Record<string, any>>({});

  const [horaInicio, horaFin] = React.useMemo(() => {
    if (!horarioLiberar) return ['14:00', '19:00'];
    const parts = horarioLiberar.split('-');
    if (parts.length === 2) {
      return [parts[0].trim(), parts[1].trim()];
    }
    return ['14:00', '19:00'];
  }, [horarioLiberar]);

  const opcionesDeHoras = React.useMemo(() => {
    const options = [];
    for (let h = 0; h < 24; h++) {
      const period = h >= 12 ? 'PM' : 'AM';
      const displayH = h % 12 === 0 ? 12 : h % 12;
      const hStr = String(h).padStart(2, '0');
      
      options.push({
        value: `${hStr}:00`,
        label: `${String(displayH).padStart(2, '0')}:00 ${period}`
      });
      options.push({
        value: `${hStr}:30`,
        label: `${String(displayH).padStart(2, '0')}:30 ${period}`
      });
    }
    // Añadimos medianoche como fin especial
    options.push({ value: '00:00', label: '12:00 AM (Medianoche/Fin)' });
    return options;
  }, []);

  // Modales y Edición
  const [reservaEditando, setReservaEditando] = useState<Reserva | null>(null);
  const [clienteEditando, setClienteEditando] = useState<Cliente | null>(null);
  const [mostrarCrearReserva, setMostrarCrearReserva] = useState(false);

  // Formulario de Creación de Reserva Manual
  const [nuevaReserva, setNuevaReserva] = useState({
    clienteId: '',
    nombreArtistico: '',
    nombreReal: '',
    email: '',
    telefono: '',
    instagram: '',
    fecha: '2026-08-15',
    horaInicio: '14:00',
    horaSalida: '19:00',
    totalHoras: 5,
    servicios: [] as string[],
    metodoPago: 'Zelle' as 'Efectivo' | 'ATH Movil' | 'PayPal' | 'Zelle',
    subtotal: 200,
    deposito: 100,
    balance: 100
  });

  const cargarDatos = () => {
    setClientes(getClientes());
    setReservas(getReservas());
    setDisponibilidadesManuales(obtenerTodasDisponibilidades());
    setFeedbacks(getSongFeedbacks());
  };

  const handleToggleFeedbackCompletado = (projId: string, itemId: string) => {
    const currentFeedback = feedbacks.find(f => f.proyectoId === projId);
    if (!currentFeedback) return;

    const updatedItems = currentFeedback.items.map((it: any) => {
      if (it.id === itemId) {
        return { ...it, completado: !it.completado };
      }
      return it;
    });

    const updatedFeedback = {
      ...currentFeedback,
      items: updatedItems
    };

    guardarSongFeedback(updatedFeedback);
    cargarDatos();
  };

  const handleEliminarFeedbackItem = (projId: string, itemId: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar permanentemente esta observación de mezcla?')) return;
    const currentFeedback = feedbacks.find(f => f.proyectoId === projId);
    if (!currentFeedback) return;

    const updatedItems = currentFeedback.items.filter((it: any) => it.id !== itemId);
    const updatedFeedback = {
      ...currentFeedback,
      items: updatedItems
    };

    guardarSongFeedback(updatedFeedback);
    cargarDatos();
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const handleGuardarDisponibilidad = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fechaLiberar) return;
    guardarDisponibilidadDia(fechaLiberar, diaDisponible, horarioLiberar, motivoLiberar);
    cargarDatos();
    alert(`La disponibilidad para la fecha ${fechaLiberar} ha sido guardada. ¡Ahora los clientes pueden reservarla!`);
  };

  const handleEliminarDisponibilidad = (fecha: string) => {
    eliminarDisponibilidadDia(fecha);
    cargarDatos();
  };

  // OPERACIONES DE RESERVA
  const handleUpdateReserva = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reservaEditando) return;

    // Calcular balance automáticamente
    const total = Number(reservaEditando.subtotal);
    const dep = Number(reservaEditando.deposito);
    const bal = Math.max(0, total - dep);

    actualizarReserva(reservaEditando.id, {
      ...reservaEditando,
      subtotal: total,
      deposito: dep,
      balance: bal
    });
    setReservaEditando(null);
    cargarDatos();
    alert('Reserva actualizada exitosamente.');
  };

  const handleDeleteReserva = (id: string) => {
    if (confirm('¿Estás seguro de que deseas eliminar permanentemente esta reserva? Esta acción no se puede deshacer.')) {
      eliminarReserva(id);
      cargarDatos();
    }
  };

  const handleQuickStatusChange = (id: string, nuevoEstado: Reserva['estado']) => {
    const r = reservas.find(item => item.id === id);
    if (!r) return;
    
    let updates: Partial<Reserva> = { estado: nuevoEstado };
    
    if (nuevoEstado === 'Confirmada' && r.estado === 'Pendiente') {
      const halfPrice = Math.round(r.subtotal * 0.5);
      if (r.deposito < halfPrice) {
        updates.deposito = halfPrice;
        updates.balance = r.subtotal - halfPrice;
      }
    }
    
    actualizarReserva(id, updates);
    cargarDatos();
  };

  // OPERACIONES DE CLIENTE
  const handleUpdateCliente = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clienteEditando) return;
    actualizarCliente(clienteEditando.id, clienteEditando);
    setClienteEditando(null);
    cargarDatos();
    alert('Cliente actualizado exitosamente.');
  };

  const handleDeleteCliente = (id: string) => {
    if (confirm('¿Deseas eliminar este cliente? Se mantendrán las reservas históricas vinculadas, pero se removerá el registro de contacto principal.')) {
      eliminarCliente(id);
      cargarDatos();
    }
  };

  // CREAR RESERVA MANUALMENTE
  const handleServicioToggle = (servicio: string) => {
    setNuevaReserva(prev => {
      const yaExiste = prev.servicios.includes(servicio);
      const nuevas = yaExiste 
        ? prev.servicios.filter(s => s !== servicio) 
        : [...prev.servicios, servicio];
      
      // Auto calcular un subtotal basado en horas y servicios (ej: $50 la hora por servicio básico)
      const horasVal = Number(prev.totalHoras) || 5;
      const calculatedSub = horasVal * 50 + (nuevas.length * 30);
      const calculatedDep = Math.round(calculatedSub / 2);

      return {
        ...prev,
        servicios: nuevas,
        subtotal: calculatedSub,
        deposito: calculatedDep,
        balance: calculatedSub - calculatedDep
      };
    });
  };

  const handleAutoCalcSubtotal = (horas: number) => {
    const srvCount = nuevaReserva.servicios.length || 1;
    const calculatedSub = horas * 50 + (srvCount * 30);
    const calculatedDep = Math.round(calculatedSub / 2);

    setNuevaReserva(prev => ({
      ...prev,
      totalHoras: horas,
      subtotal: calculatedSub,
      deposito: calculatedDep,
      balance: calculatedSub - calculatedDep
    }));
  };

  const handleCrearReservaManual = (e: React.FormEvent) => {
    e.preventDefault();
    
    // 1. Guardar cliente (si no existe o vincula uno nuevo)
    const nuevoCli = guardarCliente({
      nombreArtistico: nuevaReserva.nombreArtistico,
      nombreReal: nuevaReserva.nombreReal,
      email: nuevaReserva.email || `${nuevaReserva.nombreArtistico.toLowerCase().replace(/\s+/g, '')}@manual.com`,
      telefono: nuevaReserva.telefono,
      instagram: nuevaReserva.instagram || '@instagram'
    });

    // 2. Guardar reserva
    guardarReserva({
      clienteId: nuevoCli.id,
      nombreArtistico: nuevaReserva.nombreArtistico,
      fecha: nuevaReserva.fecha,
      horaInicio: nuevaReserva.horaInicio,
      horaSalida: nuevaReserva.horaSalida,
      totalHoras: Number(nuevaReserva.totalHoras),
      servicios: nuevaReserva.servicios.length > 0 ? nuevaReserva.servicios : ['Sesión de Grabación'],
      metodoPago: nuevaReserva.metodoPago,
      subtotal: Number(nuevaReserva.subtotal),
      deposito: Number(nuevaReserva.deposito),
      balance: Math.max(0, Number(nuevaReserva.subtotal) - Number(nuevaReserva.deposito))
    });

    cargarDatos();
    setMostrarCrearReserva(false);
    alert('¡Reserva manual creada exitosamente en el calendario y base de datos!');
  };

  // EXPORTAR REPORTE FINANCIERO SIMPLE
  const handleExportCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Folio,Artista,Fecha,Servicios,Metodo Pago,Subtotal,Deposito,Balance,Estado\n";
    
    reservas.forEach(r => {
      const servString = r.servicios.join(" | ");
      csvContent += `"${r.id}","${r.nombreArtistico}","${r.fecha}","${servString}","${r.metodoPago}",${r.subtotal},${r.deposito},${r.balance},"${r.estado}"\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `la_facultad_reporte_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // RESETEAR BASE DE DATOS DEMO PARA EMPEZAR EN LIMPIO EN PRODUCCIÓN
  const handleResetDemoData = () => {
    const confirm1 = window.confirm(
      '⚠️ ¿DESEAS VACIAR Y REINICIAR TODA LA INFORMACIÓN DEMO DE LA BASE DE DATOS?\n\n' +
      'Esta acción borrará permanentemente:\n' +
      '• Todos los clientes demo de prueba\n' +
      '• Todas las reservas y pases de sesión demo\n' +
      '• Todos los proyectos y observaciones de mezcla demo\n\n' +
      'El sistema quedará 100% limpio en $0 para empezar a usar la app con tus clientes reales.'
    );
    if (!confirm1) return;

    const confirm2 = window.confirm(
      '🚨 CONFIRMACIÓN FINAL DE SEGURIDAD:\n\n' +
      '¿Estás totalmente seguro de vaciar toda la información demo? No se podrá deshacer.'
    );
    if (!confirm2) return;

    vaciarBaseDeDatosCompleta();
    cargarDatos();
    alert('✅ Base de datos reiniciada con éxito. La plataforma está lista en limpio para registrar tus datos reales.');
  };

  // WHATSAPP SCRIPT GENERATOR
  const handleOpenWhatsApp = (reserva: Reserva) => {
    const formattedDate = reserva.fecha;
    const msg = `¡Hola ${reserva.nombreArtistico}! Te saluda La Facultad Studio 🎙️🔥

Confirmamos el registro de tu sesión de estudio:
🎟️ Folio de Pase: ${reserva.id}
📅 Fecha: ${formattedDate}
⏰ Horario: ${format12h(reserva.horaInicio)} - ${format12h(reserva.horaSalida)} (${reserva.totalHoras} Horas en Cabina)
🎸 Servicios: ${reserva.servicios.join(', ')}

💵 Resumen de Cuentas:
- Inversión Total: $${reserva.subtotal}.00 USD
- Depósito Realizado: $${reserva.deposito}.00 USD
- Balance Pendiente (a pagar al inicio de sesión): $${reserva.balance}.00 USD

Estado de Pase: ${reserva.estado.toUpperCase()} 🚨

📍 Recuerda llegar 10 min antes. Cualquier cambio se debe notificar con 48h de anticipación. ¡Vamos a romper el micrófono! 🎚️🎙️`;

    const encodedText = encodeURIComponent(msg);
    const url = `https://api.whatsapp.com/send?text=${encodedText}`;
    window.open(url, '_blank');
  };

  // Filtrar reservas
  const reservasFiltradas = reservas.filter(r => {
    const matchesEstado = filtroEstado === 'todos' || r.estado === filtroEstado;
    const matchesBusqueda = r.nombreArtistico.toLowerCase().includes(busquedaReserva.toLowerCase()) || r.id.toLowerCase().includes(busquedaReserva.toLowerCase());
    return matchesEstado && matchesBusqueda;
  });

  // Métricas financieras avanzadas
  const totalPotencial = reservas.reduce((acc, r) => acc + (r.subtotal || 0), 0);
  const totalRecaudado = reservas.reduce((acc, r) => acc + (r.deposito || 0), 0);
  const totalCuentasCobrar = reservas.reduce((acc, r) => acc + (r.balance || 0), 0);

  // Cálculos de analíticas en tiempo real
  const analiticasServicios = React.useMemo(() => {
    let grabCount = 0, grabRev = 0;
    let instCount = 0, instRev = 0;
    let mezCount = 0, mezRev = 0;
    let prodCount = 0, prodRev = 0;

    reservas.forEach(r => {
      const numServicios = r.servicios?.length || 1;
      const weightedSubtotal = (r.subtotal || 0) / numServicios;

      r.servicios?.forEach(s => {
        if (s.includes('Grabación') || s.includes('Voces')) {
          grabCount++;
          grabRev += weightedSubtotal;
        } else if (s.includes('Instrumental') || s.includes('Beat')) {
          instCount++;
          instRev += weightedSubtotal;
        } else if (s.includes('Mezcla') || s.includes('Master')) {
          mezCount++;
          mezRev += weightedSubtotal;
        } else if (s.includes('Producción') || s.includes('Integral')) {
          prodCount++;
          prodRev += weightedSubtotal;
        }
      });
    });

    const totalRevCalculated = (grabRev + instRev + mezRev + prodRev) || 1;

    return {
      grab: { count: grabCount, rev: Math.round(grabRev), pct: Math.round((grabRev / totalRevCalculated) * 100) },
      inst: { count: instCount, rev: Math.round(instRev), pct: Math.round((instRev / totalRevCalculated) * 100) },
      mez: { count: mezCount, rev: Math.round(mezRev), pct: Math.round((mezRev / totalRevCalculated) * 100) },
      prod: { count: prodCount, rev: Math.round(prodRev), pct: Math.round((prodRev / totalRevCalculated) * 100) }
    };
  }, [reservas]);

  const analiticasPagos = React.useMemo(() => {
    let efectivo = 0, ath = 0, paypal = 0, zelle = 0;
    reservas.forEach(r => {
      const val = r.subtotal || 0;
      if (r.metodoPago === 'Efectivo') efectivo += val;
      else if (r.metodoPago === 'ATH Movil') ath += val;
      else if (r.metodoPago === 'PayPal') paypal += val;
      else if (r.metodoPago === 'Zelle') zelle += val;
    });
    const total = (efectivo + ath + paypal + zelle) || 1;
    return {
      efectivo: { rev: efectivo, pct: Math.round((efectivo / total) * 100) },
      ath: { rev: ath, pct: Math.round((ath / total) * 100) },
      paypal: { rev: paypal, pct: Math.round((paypal / total) * 100) },
      zelle: { rev: zelle, pct: Math.round((zelle / total) * 100) }
    };
  }, [reservas]);

  const analiticasEstados = React.useMemo(() => {
    let pendiente = 0, confirmada = 0, enProceso = 0, completada = 0;
    reservas.forEach(r => {
      if (r.estado === 'Pendiente') pendiente++;
      else if (r.estado === 'Confirmada') confirmada++;
      else if (r.estado === 'En Proceso') enProceso++;
      else if (r.estado === 'Completada') completada++;
    });
    const total = reservas.length || 1;
    return {
      pendiente: { count: pendiente, pct: Math.round((pendiente / total) * 100) },
      confirmada: { count: confirmada, pct: Math.round((confirmada / total) * 100) },
      enProceso: { count: enProceso, pct: Math.round((enProceso / total) * 100) },
      completada: { count: completada, pct: Math.round((completada / total) * 100) }
    };
  }, [reservas]);

  return (
    <div className="space-y-6">

      {/* EXECUTIVE CONTROL ROOM HEADER & STUDIO NAVIGATION */}
      {/* HEADER DE MANDO SPATIAL - CONTROL ROOM BADLENZ */}
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-[#10131e] via-[#0b0d14] to-[#07090f] p-5 sm:p-7 shadow-[0_25px_60px_rgba(0,0,0,0.8)] space-y-6">
        {/* Ambient Top Glow */}
        <div className="absolute top-0 right-10 w-96 h-40 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-10 w-80 h-32 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          {/* Identity & Status */}
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-600 via-rose-700 to-black p-0.5 shadow-xl shadow-red-950/60 flex items-center justify-center shrink-0 border border-red-400/40 transform hover:scale-105 transition-transform">
              <span className="font-black text-white text-base tracking-tighter font-mono">LF</span>
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="font-syne font-bold text-base sm:text-lg text-white uppercase tracking-wider flex items-center gap-2">
                  <span>La Facultad Studio</span>
                  <span className="text-red-500">• Control Room</span>
                </h1>
                <span className="text-[10px] font-mono font-bold bg-gradient-to-r from-red-950 to-amber-950 text-amber-300 border border-amber-600/50 px-2.5 py-0.5 rounded-full shadow">
                  PROD. BADLENZ
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5 font-dmsans">
                Consola ejecutiva de sesiones, depósitos, artistas de cabina y bóveda A/B en Hormigueros, PR.
              </p>
            </div>
          </div>

          {/* Quick stats & Actions */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {/* Live studio status indicator */}
            <div className="flex items-center gap-2 bg-black/70 border border-white/10 px-3.5 py-2 rounded-2xl shadow-inner backdrop-blur-md">
              <span className="relative flex h-2.5 w-2.5">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  adminLiveStatus.estado === 'grabando' ? 'bg-red-400' :
                  adminLiveStatus.estado === 'mezclando' ? 'bg-amber-400' :
                  adminLiveStatus.estado === 'disponible' ? 'bg-emerald-400' : 'bg-gray-400'
                }`} />
                <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                  adminLiveStatus.estado === 'grabando' ? 'bg-red-500' :
                  adminLiveStatus.estado === 'mezclando' ? 'bg-amber-500' :
                  adminLiveStatus.estado === 'disponible' ? 'bg-emerald-500' : 'bg-gray-500'
                }`} />
              </span>
              <span className="text-xs font-mono font-bold text-gray-200 uppercase tracking-wide">
                {adminLiveStatus.titulo}
              </span>
            </div>

            {/* Mode indicator */}
            <span className={`text-[10px] font-mono font-bold px-3 py-2 rounded-2xl border ${
              currentMode === 'lanzamiento'
                ? 'bg-red-950/80 text-red-300 border-red-700/60 shadow-[0_0_15px_rgba(220,38,38,0.3)]'
                : 'bg-emerald-950/80 text-emerald-300 border-emerald-700/60'
            }`}>
              {currentMode === 'lanzamiento' ? 'MODO REAPERTURA' : 'MODO DEMO'}
            </span>

            {/* Botón Nueva Sesión */}
            <button
              type="button"
              onClick={() => setMostrarCrearReserva(true)}
              className="px-4 py-2 bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-syne font-bold text-xs uppercase tracking-wider rounded-2xl shadow-lg shadow-red-950/50 flex items-center gap-2 transition-all hover:scale-105 active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Nueva Sesión</span>
            </button>
          </div>
        </div>

        {/* TAB NAVIGATION BAR (CONSOLE CHANNEL STRIPS) */}
        <div className="relative z-10 flex items-center gap-1.5 overflow-x-auto pb-1 pt-3 border-t border-white/10 scrollbar-none">
          {[
            { id: 'overview', label: 'Resumen & Cabina', icon: BarChart2, badge: null },
            { id: 'reservas', label: 'Reservas & Sesiones', icon: Ticket, badge: reservas.length },
            { id: 'calendario', label: 'Calendario & Turnos', icon: Calendar, badge: null },
            { id: 'showcase', label: 'Bóveda A/B', icon: Music, badge: showcaseTracks.length },
            { id: 'crm', label: 'Artistas & Loyalty', icon: Users, badge: clientes.length },
            { id: 'ajustes', label: 'Configuración & Sistema', icon: Lock, badge: null },
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = adminTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setAdminTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 text-white shadow-[0_0_20px_rgba(239,68,68,0.35)] ring-1 ring-white/20 scale-[1.02]'
                    : 'text-zinc-400 hover:text-white hover:bg-white/5 border border-transparent'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-amber-200' : 'text-zinc-500'}`} />
                <span className="font-syne tracking-wide">{tab.label}</span>
                {tab.badge !== null && (
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
                    isActive ? 'bg-black/50 text-amber-300' : 'bg-black/60 text-zinc-400 border border-white/5'
                  }`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* TAB 1: OVERVIEW & CABINA */}
      {adminTab === 'overview' && (
        <div className="space-y-6 animate-fadeIn">
      {/* CONMUTADOR MANUAL DE ESTADO EN TIEMPO REAL (CABINA & CONTROL ROOM) */}
      <div className="antigravity-glass border border-white/10 p-6 rounded-3xl shadow-2xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-800/80 pb-3">
          <div>
            <span className="text-[9px] font-black bg-red-600 text-white px-2 py-0.5 rounded uppercase tracking-widest">
              INDICADOR EN VIVO (CABECERA WEB)
            </span>
            <h3 className="text-sm sm:text-base font-black text-white uppercase tracking-wider mt-1 flex items-center gap-2">
              <span>Conmutador Manual de Estado del Estudio</span>
            </h3>
            <p className="text-[11px] text-gray-400 mt-0.5">
              Cambia en 1 clic el letrero luminoso superior que ven todos los artistas en la web.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] text-gray-400 font-mono">Estado visible ahora:</span>
            <span className={`px-2.5 py-1 rounded-lg text-xs font-mono font-black border ${
              adminLiveStatus.estado === 'grabando' ? 'bg-red-950 text-red-400 border-red-800 shadow-[0_0_10px_rgba(239,68,68,0.3)]' :
              adminLiveStatus.estado === 'mezclando' ? 'bg-amber-950 text-amber-300 border-amber-800 shadow-[0_0_10px_rgba(245,158,11,0.3)]' :
              adminLiveStatus.estado === 'disponible' ? 'bg-emerald-950 text-emerald-300 border-emerald-800 shadow-[0_0_10px_rgba(16,185,129,0.3)]' :
              'bg-gray-900 text-gray-400 border-gray-700'
            }`}>
              {adminLiveStatus.titulo}
            </span>
          </div>
        </div>

        {/* 4 BOTONES DE PRESET DE 1-CLIC */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Opción 1: Grabando */}
          <button
            type="button"
            onClick={() => handleUpdateStudioLiveStatus('grabando')}
            className={`p-3.5 rounded-xl border text-left transition-all duration-200 cursor-pointer flex flex-col justify-between gap-2 ${
              adminLiveStatus.estado === 'grabando'
                ? 'bg-red-950/90 border-red-500 shadow-[0_0_15px_rgba(220,38,38,0.4)] ring-2 ring-red-500/50'
                : 'bg-black/40 border-gray-800 hover:border-gray-700 hover:bg-gray-900/50'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
              </span>
              <span className="text-[9px] font-mono font-bold text-red-400 bg-red-950/60 px-1.5 py-0.5 rounded border border-red-800/40">
                MIC ACTIVO
              </span>
            </div>
            <div>
              <strong className="text-xs font-black text-white uppercase block">🔴 En Grabación</strong>
              <span className="text-[10px] text-gray-400 leading-tight block mt-0.5">
                Cabina ocupada • Tracking de voces
              </span>
            </div>
          </button>

          {/* Opción 2: Mezclando */}
          <button
            type="button"
            onClick={() => handleUpdateStudioLiveStatus('mezclando')}
            className={`p-3.5 rounded-xl border text-left transition-all duration-200 cursor-pointer flex flex-col justify-between gap-2 ${
              adminLiveStatus.estado === 'mezclando'
                ? 'bg-amber-950/90 border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.4)] ring-2 ring-amber-500/50'
                : 'bg-black/40 border-gray-800 hover:border-gray-700 hover:bg-gray-900/50'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
              </span>
              <span className="text-[9px] font-mono font-bold text-amber-400 bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-800/40">
                CONTROL ROOM
              </span>
            </div>
            <div>
              <strong className="text-xs font-black text-white uppercase block">🟡 En Mezcla & Master</strong>
              <span className="text-[10px] text-gray-400 leading-tight block mt-0.5">
                Afinación y mezcla analógica
              </span>
            </div>
          </button>

          {/* Opción 3: Disponible */}
          <button
            type="button"
            onClick={() => handleUpdateStudioLiveStatus('disponible')}
            className={`p-3.5 rounded-xl border text-left transition-all duration-200 cursor-pointer flex flex-col justify-between gap-2 ${
              adminLiveStatus.estado === 'disponible'
                ? 'bg-emerald-950/90 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.4)] ring-2 ring-emerald-500/50'
                : 'bg-black/40 border-gray-800 hover:border-gray-700 hover:bg-gray-900/50'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <span className="text-[9px] font-mono font-bold text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800/40">
                RESERVA HOY
              </span>
            </div>
            <div>
              <strong className="text-xs font-black text-white uppercase block">🟢 Cabina Disponible</strong>
              <span className="text-[10px] text-gray-400 leading-tight block mt-0.5">
                Espacios libres para agendar
              </span>
            </div>
          </button>

          {/* Opción 4: Cerrado */}
          <button
            type="button"
            onClick={() => handleUpdateStudioLiveStatus('cerrado')}
            className={`p-3.5 rounded-xl border text-left transition-all duration-200 cursor-pointer flex flex-col justify-between gap-2 ${
              adminLiveStatus.estado === 'cerrado'
                ? 'bg-gray-800 border-gray-400 shadow-md ring-2 ring-gray-400/50'
                : 'bg-black/40 border-gray-800 hover:border-gray-700 hover:bg-gray-900/50'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="relative flex h-2.5 w-2.5">
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-gray-400"></span>
              </span>
              <span className="text-[9px] font-mono font-bold text-gray-400 bg-gray-900 px-1.5 py-0.5 rounded border border-gray-700">
                DESCANSO
              </span>
            </div>
            <div>
              <strong className="text-xs font-black text-white uppercase block">⚪ Estudio Cerrado</strong>
              <span className="text-[10px] text-gray-400 leading-tight block mt-0.5">
                Fuera de horario de atención
              </span>
            </div>
          </button>

          {/* Opción 5: Vacaciones */}
          <button
            type="button"
            onClick={() => handleUpdateStudioLiveStatus('vacaciones')}
            className={`p-3.5 rounded-xl border text-left transition-all duration-200 cursor-pointer flex flex-col justify-between gap-2 ${
              adminLiveStatus.estado === 'vacaciones'
                ? 'bg-amber-950/90 border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.4)] ring-2 ring-amber-500/50'
                : 'bg-black/40 border-gray-800 hover:border-gray-700 hover:bg-gray-900/50'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-base">🌴</span>
              <span className="text-[9px] font-mono font-bold text-amber-400 bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-800/40">
                RECESO
              </span>
            </div>
            <div>
              <strong className="text-xs font-black text-amber-300 uppercase block">🌴 Vacaciones</strong>
              <span className="text-[10px] text-gray-400 leading-tight block mt-0.5">
                Activa componente de espera VIP
              </span>
            </div>
          </button>

          {/* Opción 6: Mantenimiento */}
          <button
            type="button"
            onClick={() => handleUpdateStudioLiveStatus('mantenimiento')}
            className={`p-3.5 rounded-xl border text-left transition-all duration-200 cursor-pointer flex flex-col justify-between gap-2 ${
              adminLiveStatus.estado === 'mantenimiento'
                ? 'bg-blue-950/90 border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.4)] ring-2 ring-blue-500/50'
                : 'bg-black/40 border-gray-800 hover:border-gray-700 hover:bg-gray-900/50'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-base">🛠️</span>
              <span className="text-[9px] font-mono font-bold text-blue-400 bg-blue-950/60 px-1.5 py-0.5 rounded border border-blue-800/40">
                CALIBRACIÓN
              </span>
            </div>
            <div>
              <strong className="text-xs font-black text-blue-300 uppercase block">🛠️ Mantenimiento</strong>
              <span className="text-[10px] text-gray-400 leading-tight block mt-0.5">
                Calibración de equipo y microfonía
              </span>
            </div>
          </button>

          {/* Opción 7: Remodelación */}
          <button
            type="button"
            onClick={() => handleUpdateStudioLiveStatus('remodelacion')}
            className={`p-3.5 rounded-xl border text-left transition-all duration-200 cursor-pointer flex flex-col justify-between gap-2 ${
              adminLiveStatus.estado === 'remodelacion'
                ? 'bg-teal-950/90 border-teal-500 shadow-[0_0_15px_rgba(20,184,166,0.4)] ring-2 ring-teal-500/50'
                : 'bg-black/40 border-gray-800 hover:border-gray-700 hover:bg-gray-900/50'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-base">🎧</span>
              <span className="text-[9px] font-mono font-bold text-teal-400 bg-teal-950/60 px-1.5 py-0.5 rounded border border-teal-800/40">
                ACÚSTICA
              </span>
            </div>
            <div>
              <strong className="text-xs font-black text-teal-300 uppercase block">🎧 Remodelación</strong>
              <span className="text-[10px] text-gray-400 leading-tight block mt-0.5">
                Mejoras en cabina vocal
              </span>
            </div>
          </button>
        </div>

        {/* PERSONALIZAR NOTA Y PRÓXIMO TURNO */}
        <div className="bg-black/50 p-3.5 rounded-xl border border-gray-800/80 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">
                Subtítulo / Mensaje en Vivo
              </label>
              <input
                type="text"
                value={customSubtitleInput}
                onChange={(e) => setCustomSubtitleInput(e.target.value)}
                placeholder="Ej: Cabina Acústica Ocupada con Neumann TLM 103"
                className="w-full bg-[#111827] border border-gray-700 rounded-lg p-2 text-xs text-white outline-none focus:border-red-500 font-sans"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">
                Próximo Turno Libre (Texto del Popup)
              </label>
              <input
                type="text"
                value={customNextTurnInput}
                onChange={(e) => setCustomNextTurnInput(e.target.value)}
                placeholder="Ej: Hoy 06:00 PM o Mañana 10:00 AM"
                className="w-full bg-[#111827] border border-gray-700 rounded-lg p-2 text-xs text-white outline-none focus:border-red-500 font-mono"
              />
            </div>
          </div>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => {
                const updated: StudioLiveStatus = {
                  ...adminLiveStatus,
                  subtitulo: customSubtitleInput,
                  proximoTurnoLibre: customNextTurnInput
                };
                setAdminLiveStatus(updated);
                setStudioLiveStatus(updated);
                alert('✅ Letrero en vivo de la cabecera actualizado con éxito.');
              }}
              className="bg-red-700 hover:bg-red-600 text-white font-bold px-4 py-1.5 rounded-lg text-xs uppercase tracking-wider transition cursor-pointer flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Guardar Textos Personalizados</span>
            </button>
          </div>
        </div>
      </div>
      
      {/* PANEL DE LEADS DE LISTA DE ESPERA (CUANDO EL ESTUDIO ESTÁ EN PAUSA / VACACIONES) */}
      {leadsEspera.length > 0 && (
        <div className="bg-[#181820] p-4 sm:p-5 rounded-2xl border border-amber-600/40 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-amber-500/20 text-amber-400">🌴</span>
              <div>
                <h4 className="text-sm font-black text-white uppercase tracking-wider">
                  Lista de Espera VIP • Reapertura de Cabina ({leadsEspera.length} Artistas)
                </h4>
                <p className="text-xs text-gray-400">
                  Artistas que dejaron sus datos mientras el estudio está en vacaciones o mantenimiento.
                </p>
              </div>
            </div>
            <span className="text-xs font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30 px-2.5 py-1 rounded-lg">
              {leadsEspera.length} en espera
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
            {leadsEspera.map((lead) => (
              <div key={lead.id} className="bg-black/60 border border-gray-800 rounded-xl p-3.5 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <strong className="text-white font-bold">{lead.nombreArtistico}</strong>
                  <span className="text-[10px] font-mono text-amber-400 font-bold bg-amber-950/80 px-2 py-0.5 rounded border border-amber-800/40">
                    {lead.id}
                  </span>
                </div>
                <div className="text-gray-400 space-y-0.5 text-[11px]">
                  <div>Tel: <span className="text-gray-200 font-mono">{lead.telefono}</span></div>
                  <div>Servicio: <span className="text-emerald-400">{lead.tipoProyecto}</span></div>
                  {lead.fechaTentativa && <div>Fecha deseada: <span className="text-blue-300 font-mono">{lead.fechaTentativa}</span></div>}
                  {lead.mensaje && <div className="italic text-gray-400 text-[10px] pt-1">"{lead.mensaje}"</div>}
                </div>
                <a
                  href={`https://wa.me/${lead.telefono.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                    `¡Hola ${lead.nombreArtistico}! Te escribe Badlenz de La Facultad Studio. Ya tenemos fecha para reabrir la cabina y estás en nuestra lista prioritaria con el turno ${lead.id}. ¿Qué día te gustaría agendar tu sesión?`
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full bg-[#25D366]/20 hover:bg-[#25D366]/30 border border-[#25D366]/50 text-emerald-300 font-bold py-1.5 rounded-lg text-[11px] flex items-center justify-center gap-1.5 transition"
                >
                  <span>Escribir por WhatsApp</span>
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CONTROL OFICIAL Y CONTADOR VIVO DE PROMO REAPERTURA (6 ESPACIOS) */}
      <div className="bg-gradient-to-r from-red-950/80 via-[#181820] to-amber-950/60 p-4 rounded-xl border border-red-700/60 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-red-950/80 rounded-xl border border-red-600 text-red-500 shadow">
            <Flame className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-black bg-red-600 text-white px-2 py-0.5 rounded uppercase tracking-wider">
                CONTADOR DE PROMO REAPERTURA
              </span>
              <span className="text-xs font-mono font-bold text-amber-400">MÁXIMO: 6 ESPACIOS</span>
            </div>
            <h3 className="text-sm sm:text-base font-black text-white uppercase mt-0.5">
              Quedan <span className="text-emerald-400 font-mono text-lg">{promoSlotsInfo.disponibles}</span> de 6 espacios disponibles
            </h3>
            <p className="text-[11px] text-gray-300">
              Registrados / Ocupados actualmente: <strong className="text-amber-300">{promoSlotsInfo.reservados} de 6</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-black/80 p-2.5 rounded-xl border border-gray-800">
          <span className="text-[10px] text-gray-400 uppercase font-bold mr-1">Control Manual Badlenz:</span>
          <button
            type="button"
            onClick={() => {
              setPromoSlotsReservadosManual(promoSlotsInfo.reservados + 1);
            }}
            disabled={promoSlotsInfo.reservados >= 6}
            className="px-3 py-1.5 bg-red-900 hover:bg-red-800 text-white font-bold text-xs rounded border border-red-700 transition disabled:opacity-40 active:scale-95 cursor-pointer"
            title="Sumar reserva (disminuir espacios disponibles)"
          >
            +1 Ocupar
          </button>
          <button
            type="button"
            onClick={() => {
              setPromoSlotsReservadosManual(promoSlotsInfo.reservados - 1);
            }}
            disabled={promoSlotsInfo.reservados <= 0}
            className="px-3 py-1.5 bg-emerald-900 hover:bg-emerald-800 text-white font-bold text-xs rounded border border-emerald-700 transition disabled:opacity-40 active:scale-95 cursor-pointer"
            title="Restar reserva (liberar espacio disponible)"
          >
            -1 Liberar
          </button>
        </div>
      </div>

      {/* SECCIÓN 1: MÉTRICAS FINANCIERAS Y DE SALUD DEL ESTUDIO (SPATIAL BENTO) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* CARD 1: CLIENTES */}
        <div className="group relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#121522] via-[#0c0e17] to-[#07090f] p-5 shadow-xl transition-all duration-300 hover:border-red-500/40 hover:-translate-y-1 hover:shadow-[0_15px_35px_rgba(239,68,68,0.15)]">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 w-20 h-20 bg-red-600/10 rounded-full blur-xl pointer-events-none group-hover:bg-red-600/20 transition-all" />
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-[10px] text-zinc-400 uppercase font-black tracking-widest font-mono block">
                Artistas Activos
              </span>
              <p className="text-3xl font-black text-white font-mono tracking-tight">{clientes.length}</p>
              <span className="text-[10px] text-zinc-500 font-mono block">En base de datos</span>
            </div>
            <div className="p-3 bg-red-950/70 rounded-2xl border border-red-700/60 shadow-lg text-red-400 group-hover:scale-110 transition-transform">
              <Users className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* CARD 2: RESERVAS */}
        <div className="group relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#161424] via-[#0d0c18] to-[#07090f] p-5 shadow-xl transition-all duration-300 hover:border-amber-500/40 hover:-translate-y-1 hover:shadow-[0_15px_35px_rgba(245,158,11,0.15)]">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 w-20 h-20 bg-amber-500/10 rounded-full blur-xl pointer-events-none group-hover:bg-amber-500/20 transition-all" />
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-[10px] text-zinc-400 uppercase font-black tracking-widest font-mono block">
                Sesiones &amp; Turnos
              </span>
              <p className="text-3xl font-black text-amber-400 font-mono tracking-tight">{reservas.length}</p>
              <span className="text-[10px] text-amber-500/80 font-mono block">Bloques agendados</span>
            </div>
            <div className="p-3 bg-amber-950/70 rounded-2xl border border-amber-700/60 shadow-lg text-amber-400 group-hover:scale-110 transition-transform">
              <Ticket className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* CARD 3: DEPÓSITOS COBRADOS */}
        <div className="group relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#0e1a17] via-[#091210] to-[#07090f] p-5 shadow-xl transition-all duration-300 hover:border-emerald-500/40 hover:-translate-y-1 hover:shadow-[0_15px_35px_rgba(16,185,129,0.15)]">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 w-20 h-20 bg-emerald-500/10 rounded-full blur-xl pointer-events-none group-hover:bg-emerald-500/20 transition-all" />
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-[10px] text-zinc-400 uppercase font-black tracking-widest font-mono block">
                Depósitos Cobrados
              </span>
              <p className="text-3xl font-black text-emerald-400 font-mono tracking-tight">{formatMoney(totalRecaudado)}</p>
              <span className="text-[10px] text-emerald-500/80 font-mono block">100% ATH Móvil / Cash</span>
            </div>
            <div className="p-3 bg-emerald-950/70 rounded-2xl border border-emerald-700/60 shadow-lg text-emerald-400 group-hover:scale-110 transition-transform">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* CARD 4: BALANCES PENDIENTES */}
        <div className="group relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#1c1117] via-[#100a0f] to-[#07090f] p-5 shadow-xl transition-all duration-300 hover:border-rose-500/40 hover:-translate-y-1 hover:shadow-[0_15px_35px_rgba(244,63,94,0.15)]">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 w-20 h-20 bg-rose-500/10 rounded-full blur-xl pointer-events-none group-hover:bg-rose-500/20 transition-all" />
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-[10px] text-zinc-400 uppercase font-black tracking-widest font-mono block">
                Balances Pendientes
              </span>
              <p className="text-3xl font-black text-rose-400 font-mono tracking-tight">{formatMoney(totalCuentasCobrar)}</p>
              <span className="text-[10px] text-rose-500/80 font-mono block">Al entregar Master/WAV</span>
            </div>
            <div className="p-3 bg-rose-950/70 rounded-2xl border border-rose-700/60 shadow-lg text-rose-400 group-hover:scale-110 transition-transform">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

      {/* METRICA AVANZADA: BARRA DE AVANCE FINANCIERO */}
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#0a0c12]/95 backdrop-blur-xl p-5 shadow-xl space-y-3">
        <div className="flex justify-between items-center text-xs">
          <div>
            <span className="text-zinc-400 font-bold uppercase block text-[10px] font-mono tracking-wider">
              Recaudación de Depósitos vs Cobros Totales
            </span>
            <span className="text-zinc-300 text-xs">
              Estimado total por cotizaciones: <strong className="text-white font-mono">{formatMoney(totalPotencial)} USD</strong>
            </span>
          </div>
          <span className="text-emerald-400 font-extrabold font-mono bg-emerald-950/80 border border-emerald-600/40 px-3 py-1 rounded-full text-xs shadow">
            {totalPotencial > 0 ? Math.round((totalRecaudado / totalPotencial) * 100) : 0}% COBRADO
          </span>
        </div>
        <div className="w-full bg-black/80 rounded-full h-3 overflow-hidden border border-white/10 p-0.5">
          <div 
            className="bg-gradient-to-r from-emerald-600 via-emerald-500 to-amber-400 h-full rounded-full transition-all duration-700 shadow-[0_0_15px_rgba(16,185,129,0.5)]"
            style={{ width: `${totalPotencial > 0 ? (totalRecaudado / totalPotencial) * 100 : 0}%` }}
          />
        </div>
      </div>

      {/* PANEL DE ESTADÍSTICAS & DESEMPEÑO COMERCIAL (BENTO GRID) */}
      <div className="antigravity-glass border border-white/10 p-6 rounded-3xl shadow-2xl space-y-5">
        <div className="flex items-center gap-2 border-b border-gray-800 pb-3">
          <BarChart2 className="w-5 h-5 text-red-500" />
          <div>
            <h4 className="text-xs font-black text-white uppercase tracking-widest">
              Análisis y Distribución Comercial en Tiempo Real
            </h4>
            <p className="text-[10px] text-gray-400">Distribución de ingresos y demanda calculados de forma dinámica.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Bento Col 1: Servicios más Solicitados */}
          <div className="bg-gray-950/40 p-4 rounded-lg border border-gray-800/60 space-y-3.5">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
              🎙️ Demanda & Ingresos por Servicio
            </span>
            <div className="space-y-3">
              {/* Grabación */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="text-gray-300 font-medium">🎤 Grabación de Voces</span>
                  <span className="font-mono text-gray-400">{analiticasServicios.grab.count} sesiones • <strong className="text-white">${analiticasServicios.grab.rev}</strong></span>
                </div>
                <div className="w-full bg-gray-900 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-red-600 h-full rounded-full transition-all duration-500" style={{ width: `${analiticasServicios.grab.pct}%` }} />
                </div>
              </div>

              {/* Beats */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="text-gray-300 font-medium">🎹 Servicio de Beats</span>
                  <span className="font-mono text-gray-400">{analiticasServicios.inst.count} pedidos • <strong className="text-white">${analiticasServicios.inst.rev}</strong></span>
                </div>
                <div className="w-full bg-gray-900 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-amber-500 h-full rounded-full transition-all duration-500" style={{ width: `${analiticasServicios.inst.pct}%` }} />
                </div>
              </div>

              {/* Mezcla */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="text-gray-300 font-medium">🎚️ Mezcla & Mastering</span>
                  <span className="font-mono text-gray-400">{analiticasServicios.mez.count} temas • <strong className="text-white">${analiticasServicios.mez.rev}</strong></span>
                </div>
                <div className="w-full bg-gray-900 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-cyan-500 h-full rounded-full transition-all duration-500" style={{ width: `${analiticasServicios.mez.pct}%` }} />
                </div>
              </div>

              {/* Producción */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="text-gray-300 font-medium">📀 Producción Integral</span>
                  <span className="font-mono text-gray-400">{analiticasServicios.prod.count} packs • <strong className="text-white">${analiticasServicios.prod.rev}</strong></span>
                </div>
                <div className="w-full bg-gray-900 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-purple-500 h-full rounded-full transition-all duration-500" style={{ width: `${analiticasServicios.prod.pct}%` }} />
                </div>
              </div>
            </div>
          </div>

          {/* Bento Col 2: Preferencia de Métodos de Pago */}
          <div className="bg-gray-950/40 p-4 rounded-lg border border-gray-800/60 space-y-3.5">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
              💳 Flujo de Caja por Método de Pago
            </span>
            <div className="space-y-3">
              {/* ATH Movil */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="text-gray-300 font-medium">📱 ATH Móvil</span>
                  <span className="font-mono text-emerald-400 font-semibold">${analiticasPagos.ath.rev}.00 <span className="text-gray-500 text-[9px]">({analiticasPagos.ath.pct}%)</span></span>
                </div>
                <div className="w-full bg-gray-900 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full rounded-full transition-all duration-500" style={{ width: `${analiticasPagos.ath.pct}%` }} />
                </div>
              </div>

              {/* Zelle */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="text-gray-300 font-medium">⚡ Zelle</span>
                  <span className="font-mono text-emerald-400 font-semibold">${analiticasPagos.zelle.rev}.00 <span className="text-gray-500 text-[9px]">({analiticasPagos.zelle.pct}%)</span></span>
                </div>
                <div className="w-full bg-gray-900 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-teal-500 h-full rounded-full transition-all duration-500" style={{ width: `${analiticasPagos.zelle.pct}%` }} />
                </div>
              </div>

              {/* Efectivo */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="text-gray-300 font-medium">💵 Efectivo (Estudio)</span>
                  <span className="font-mono text-emerald-400 font-semibold">${analiticasPagos.efectivo.rev}.00 <span className="text-gray-500 text-[9px]">({analiticasPagos.efectivo.pct}%)</span></span>
                </div>
                <div className="w-full bg-gray-900 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-amber-500 h-full rounded-full transition-all duration-500" style={{ width: `${analiticasPagos.efectivo.pct}%` }} />
                </div>
              </div>

              {/* PayPal */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="text-gray-300 font-medium">🌐 PayPal</span>
                  <span className="font-mono text-emerald-400 font-semibold">${analiticasPagos.paypal.rev}.00 <span className="text-gray-500 text-[9px]">({analiticasPagos.paypal.pct}%)</span></span>
                </div>
                <div className="w-full bg-gray-900 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-blue-500 h-full rounded-full transition-all duration-500" style={{ width: `${analiticasPagos.paypal.pct}%` }} />
                </div>
              </div>
            </div>
          </div>

          {/* Bento Col 3: Estado de Reservas */}
          <div className="bg-gray-950/40 p-4 rounded-lg border border-gray-800/60 space-y-3.5">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
              📊 Embudo & Estado de Pases
            </span>
            <div className="space-y-3">
              {/* Pendiente */}
              <div className="flex items-center justify-between text-[11px]">
                <span className="flex items-center gap-1.5 text-gray-300">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                  Pendiente de Depósito
                </span>
                <span className="font-mono text-white font-bold bg-amber-950/40 text-amber-400 border border-amber-900/40 px-2 py-0.5 rounded text-[10px]">
                  {analiticasEstados.pendiente.count} pases ({analiticasEstados.pendiente.pct}%)
                </span>
              </div>

              {/* Confirmada */}
              <div className="flex items-center justify-between text-[11px]">
                <span className="flex items-center gap-1.5 text-gray-300">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  Pase Confirmado
                </span>
                <span className="font-mono text-white font-bold bg-emerald-950/40 text-emerald-400 border border-emerald-900/40 px-2 py-0.5 rounded text-[10px]">
                  {analiticasEstados.confirmada.count} pases ({analiticasEstados.confirmada.pct}%)
                </span>
              </div>

              {/* En Proceso */}
              <div className="flex items-center justify-between text-[11px]">
                <span className="flex items-center gap-1.5 text-gray-300">
                  <span className="w-2 h-2 rounded-full bg-sky-500" />
                  En Grabación / Sesión
                </span>
                <span className="font-mono text-white font-bold bg-sky-950/40 text-sky-400 border border-sky-900/40 px-2 py-0.5 rounded text-[10px]">
                  {analiticasEstados.enProceso.count} pases ({analiticasEstados.enProceso.pct}%)
                </span>
              </div>

              {/* Completada */}
              <div className="flex items-center justify-between text-[11px]">
                <span className="flex items-center gap-1.5 text-gray-300">
                  <span className="w-2 h-2 rounded-full bg-purple-500" />
                  Trabajo Completado
                </span>
                <span className="font-mono text-white font-bold bg-purple-950/40 text-purple-400 border border-purple-900/40 px-2 py-0.5 rounded text-[10px]">
                  {analiticasEstados.completada.count} pases ({analiticasEstados.completada.pct}%)
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

        </div>
      )}

      {/* TAB 2: RESERVAS & SESIONES */}
      {adminTab === 'reservas' && (
        <div className="space-y-6 animate-fadeIn">
      {/* SECCIÓN 2: CONTROL DE RESERVAS CON FILTROS */}
      <div className="antigravity-glass-panel border border-white/10 p-6 sm:p-7 rounded-3xl shadow-2xl space-y-5">
        
        {/* CABECERA GESTION */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-gray-800">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Ticket className="w-4 h-4 text-amber-500" />
              <span>Gestión de Reservas de Estudio</span>
            </h3>
            <p className="text-xs text-gray-400">Verifica depósitos, cambia estados de pases de sesión y comunícate con artistas.</p>
          </div>

          <div className="flex gap-2 w-full sm:w-auto shrink-0 flex-wrap">
            <button
              onClick={() => setMostrarCrearReserva(true)}
              className="bg-red-700 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg text-xs uppercase tracking-wider transition flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Registrar Reserva Manual</span>
            </button>

            <button
              onClick={async () => {
                const res = await syncAllToGoogleSheets([], []);
                if (res.spreadsheetUrl) {
                  window.open(res.spreadsheetUrl, '_blank');
                }
                alert(res.message || 'Sincronizado con Google Sheets');
              }}
              className="bg-emerald-950/90 hover:bg-emerald-900 text-emerald-300 border border-emerald-800/80 font-bold py-2 px-3 rounded-lg text-xs uppercase transition flex items-center gap-1.5 shadow-md"
              title="Abrir o sincronizar con Google Sheets en Drive"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span>Google Sheets Drive</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="bg-neutral-800 hover:bg-neutral-700 text-gray-300 border border-neutral-700 font-bold py-2 px-3 rounded-lg text-xs uppercase transition flex items-center gap-1.5"
              title="Exportar base de datos de reservas en CSV"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
              <span>Exportar Reporte</span>
            </button>

            <button
              onClick={handleResetDemoData}
              className="bg-red-950/80 hover:bg-red-900 text-red-300 border border-red-800/80 font-bold py-2 px-3 rounded-lg text-xs uppercase transition flex items-center gap-1.5 shadow-md"
              title="Vaciar todos los clientes y reservas demo para iniciar la app en limpio"
            >
              <Trash2 className="w-4 h-4 text-red-400" />
              <span>Reset DB Demo</span>
            </button>
          </div>
        </div>

        {/* BUSCADOR & FILTROS DE ESTADO */}
        <div className="flex flex-col md:flex-row md:items-center gap-3 bg-[#111827] p-3 rounded-lg border border-gray-800">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Buscar por artista o ID Folio..."
              className="w-full bg-[#1e1e1e] border border-gray-800 text-white rounded p-2 text-xs outline-none focus:border-red-500"
              value={busquedaReserva}
              onChange={e => setBusquedaReserva(e.target.value)}
            />
          </div>

          <div className="flex gap-1 overflow-x-auto">
            {['todos', 'Pendiente', 'Confirmada', 'En Proceso', 'Completada'].map(est => (
              <button
                key={est}
                onClick={() => setFiltroEstado(est)}
                className={`px-3 py-1.5 rounded text-[10px] font-black uppercase whitespace-nowrap border transition ${
                  filtroEstado === est 
                    ? 'bg-red-700 text-white border-red-500' 
                    : 'bg-gray-950 text-gray-400 border-gray-800 hover:bg-gray-900'
                }`}
              >
                {est === 'todos' ? 'Todos' : est}
              </button>
            ))}
          </div>
        </div>

        {/* TABLA DE RESERVAS */}
        {reservasFiltradas.length === 0 ? (
          <div className="p-8 text-center bg-black/30 rounded-lg border border-gray-800 text-xs text-gray-500 italic">
            No se encontraron reservas con los filtros aplicados en este momento.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-300">
              <thead className="bg-[#111827] text-gray-400 font-bold uppercase border-b border-gray-800">
                <tr>
                  <th className="p-3">ID / Folio</th>
                  <th className="p-3">Artista</th>
                  <th className="p-3">Fecha & Sesión</th>
                  <th className="p-3">Servicios</th>
                  <th className="p-3">Método</th>
                  <th className="p-3">Cuentas (Subtotal / Dep. / Bal.)</th>
                  <th className="p-3">Estado</th>
                  <th className="p-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {reservasFiltradas.map(res => {
                  const stateColors: Record<string, string> = {
                    'Pendiente': 'bg-amber-950 text-amber-400 border-amber-900/40',
                    'Confirmada': 'bg-emerald-950 text-emerald-400 border-emerald-900/40',
                    'En Proceso': 'bg-sky-950 text-sky-400 border-sky-900/40',
                    'Completada': 'bg-purple-950 text-purple-400 border-purple-900/40',
                  };

                  return (
                    <tr key={res.id} className="hover:bg-gray-900/50 transition">
                      <td className="p-3 font-mono font-bold text-amber-500">{res.id}</td>
                      <td className="p-3">
                        <span className="font-bold text-white block">{res.nombreArtistico}</span>
                        <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                          <span className="text-[10px] text-gray-500">ID: {res.clienteId}</span>
                          {res.firma && (
                            <button
                              type="button"
                              onClick={() => setFirmaModalUrl(res.firma || null)}
                              className="text-[9px] bg-blue-950/65 hover:bg-blue-900/80 text-blue-400 border border-blue-900/40 px-1.5 py-0.5 rounded font-black uppercase tracking-wider transition-all flex items-center gap-0.5"
                              title="Ver firma digital del contrato"
                            >
                              ✍️ Ver Firma
                            </button>
                          )}
                          {res.comprobanteAthUrl && (
                            <button
                              type="button"
                              onClick={() => setReciboModalUrl({ url: res.comprobanteAthUrl!, ref: res.comprobanteNumReferencia, artista: res.nombreArtistico })}
                              className="text-[9px] bg-emerald-950/80 hover:bg-emerald-900 text-emerald-400 border border-emerald-800/80 px-1.5 py-0.5 rounded font-black uppercase tracking-wider transition-all flex items-center gap-0.5"
                              title="Ver captura de pantalla del recibo de ATH Móvil"
                            >
                              📷 Recibo ATH
                            </button>
                          )}
                        </div>
                        {res.reagendadoDeFecha && (
                          <div className="mt-1 text-[9px] text-cyan-400 font-mono">
                            ↺ Reagendada (Antes: {res.reagendadoDeFecha})
                          </div>
                        )}
                      </td>
                      <td className="p-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-gray-300">
                          <Calendar className="w-3 h-3 text-gray-500" />
                          <span>{res.fecha}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-gray-500 text-[10px] mt-0.5">
                          <Clock className="w-3 h-3 text-gray-600" />
                          <span>{format12h(res.horaInicio)} - {format12h(res.horaSalida)} ({res.totalHoras}h)</span>
                        </div>
                      </td>
                      <td className="p-3 max-w-[180px]">
                        <div className="flex flex-wrap gap-1">
                          {res.servicios?.map((s, idx) => (
                            <span key={idx} className="px-1.5 py-0.5 bg-gray-800/80 rounded border border-gray-700 text-[9px] text-gray-300">
                              {s}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="p-3">
                        <span className="text-cyan-400 font-semibold text-[10px] uppercase">{res.metodoPago || 'Zelle'}</span>
                      </td>
                      <td className="p-3 font-mono">
                        <div className="text-[11px]">
                          <span className="text-gray-500">Tot: </span><span className="text-white font-bold">${res.subtotal}</span>
                        </div>
                        <div className="text-[11px] mt-0.5">
                          <span className="text-gray-500">Dep: </span><span className="text-emerald-400 font-semibold">${res.deposito}</span>
                        </div>
                        <div className="text-[11px] mt-0.5">
                          <span className="text-gray-500">Bal: </span><span className="text-red-400 font-bold">${res.balance}</span>
                        </div>
                        <div className="mt-1.5">
                          <select
                            value={res.depositoEstado || 'pendiente'}
                            onChange={(e) => {
                              actualizarReserva(res.id, { depositoEstado: e.target.value as any });
                              cargarDatos();
                            }}
                            className={`px-1.5 py-0.5 rounded font-black uppercase text-[9px] outline-none cursor-pointer border ${
                              res.depositoEstado === 'depositado' 
                                ? 'bg-emerald-950 text-emerald-400 border-emerald-800' 
                                : res.depositoEstado === 'paga_en_sesion' 
                                ? 'bg-purple-950 text-purple-400 border-purple-800' 
                                : 'bg-amber-950 text-amber-400 border-amber-800'
                            }`}
                          >
                            <option value="pendiente">Pendiente (No dado)</option>
                            <option value="depositado">Depositado ✓</option>
                            <option value="paga_en_sesion">Paga en sesión</option>
                          </select>
                        </div>
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${stateColors[res.estado] || 'bg-slate-800 text-white'}`}>
                          {res.estado}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex justify-end gap-1.5">
                          {res.estado === 'Pendiente' && (
                            <button
                              onClick={() => handleQuickStatusChange(res.id, 'Confirmada')}
                              className="p-1.5 bg-emerald-950/40 hover:bg-emerald-900/40 text-emerald-400 border border-emerald-900/40 rounded transition flex items-center gap-1"
                              title="Validar Depósito y Confirmar"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span className="text-[9px] font-bold uppercase hidden lg:inline">Confirmar</span>
                            </button>
                          )}

                          {res.estado === 'Confirmada' && (
                            <button
                              onClick={() => handleQuickStatusChange(res.id, 'En Proceso')}
                              className="p-1.5 bg-sky-950/40 hover:bg-sky-900/40 text-sky-400 border border-sky-900/40 rounded transition flex items-center gap-1 animate-pulse"
                              title="Iniciar Grabación en Cabina"
                            >
                              <Clock className="w-3.5 h-3.5" />
                              <span className="text-[9px] font-bold uppercase hidden lg:inline">Iniciar</span>
                            </button>
                          )}

                          {res.estado === 'En Proceso' && (
                            <button
                              onClick={() => handleQuickStatusChange(res.id, 'Completada')}
                              className="p-1.5 bg-purple-950/40 hover:bg-purple-900/40 text-purple-400 border border-purple-900/40 rounded transition flex items-center gap-1"
                              title="Marcar como Completada"
                            >
                              <CheckCircle className="w-3.5 h-3.5" />
                              <span className="text-[9px] font-bold uppercase hidden lg:inline">Completar</span>
                            </button>
                          )}

                          <button
                            onClick={() => handleOpenWhatsApp(res)}
                            className="p-1.5 bg-green-950/40 hover:bg-green-900/40 text-green-400 border border-green-900/40 rounded transition"
                            title="Generar Notificación de WhatsApp"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                          </button>
                          
                          <button
                            onClick={() => setReservaEditando(res)}
                            className="p-1.5 bg-[#1c2436] hover:bg-gray-800 text-blue-400 border border-gray-800 rounded transition"
                            title="Editar Reserva"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleDeleteReserva(res.id)}
                            className="p-1.5 bg-red-950/40 hover:bg-red-900/40 text-red-400 border border-red-900/40 rounded transition"
                            title="Eliminar Reserva"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* SECCIÓN 5: CONTROL DE CORRECCIONES DE MEZCLA (BADLENZ PANEL) */}
      <div className="antigravity-glass border border-white/10 p-6 rounded-3xl shadow-2xl space-y-5 mt-6">
        <div>
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-red-500" />
            <span>Mesa de Control de Ajustes y Mezclas (Badlenz Inbox)</span>
          </h3>
          <p className="text-xs text-gray-400 mt-1">
            Aquí recibes todas las observaciones de mezcla y cambios específicos solicitados por tus artistas vinculados al segundo exacto. Realiza los cambios en tu DAW con precisión milimétrica y márcalos como completados.
          </p>
        </div>

        {feedbacks.length === 0 || feedbacks.every(fb => fb.items.length === 0) ? (
          <div className="p-8 text-center bg-black/30 rounded-lg border border-gray-800">
            <p className="text-xs text-gray-500 italic">No hay solicitudes de ajustes o feedbacks activos en este momento.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {feedbacks.map((fb: any) => {
              const pendingCount = fb.items.filter((it: any) => !it.completado).length;
              const totalCount = fb.items.length;
              if (totalCount === 0) return null; 
              return (
                <div key={fb.proyectoId} className="bg-[#111827] border border-gray-800 rounded-xl p-4 space-y-3 flex flex-col justify-between hover:border-gray-700 transition">
                  <div className="space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[9px] bg-red-950 text-red-400 border border-red-900/30 px-2 py-0.5 rounded font-mono uppercase tracking-widest">
                          Tema
                        </span>
                        <h4 className="text-xs font-black text-white mt-1 uppercase">{fb.proyectoNombre}</h4>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-gray-400 font-bold block">Pendientes</span>
                        <span className={`text-xs font-black font-mono ${pendingCount > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                          {pendingCount} de {totalCount}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1.5 pt-2 max-h-60 overflow-y-auto pr-1">
                      {fb.items.map((it: any) => (
                        <div 
                          key={it.id} 
                          className={`p-2.5 rounded text-[11px] border flex items-start justify-between gap-3 transition-all ${
                            it.completado 
                              ? 'bg-emerald-950/5 border-emerald-900/20 text-gray-500 line-through decoration-emerald-900/30' 
                              : 'bg-black/40 border-gray-800 text-gray-300'
                          }`}
                        >
                          <div className="flex items-start gap-2 min-w-0">
                            <span className={`px-2 py-0.5 text-[9px] font-mono font-bold rounded shrink-0 ${
                              it.completado
                                ? 'bg-emerald-900/30 text-emerald-400 border border-emerald-800/20'
                                : 'bg-red-950 text-red-400 border border-red-900/30'
                            }`}>
                              {it.timestamp}
                            </span>
                            <span className="break-words leading-tight">{it.comentario}</span>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleToggleFeedbackCompletado(fb.proyectoId, it.id)}
                              className={`p-1 px-2 text-[9px] font-black uppercase rounded border transition-all ${
                                it.completado
                                  ? 'bg-emerald-950/40 text-emerald-400 border-emerald-800/40 hover:bg-emerald-900'
                                  : 'bg-amber-950/40 text-amber-400 border-amber-900/40 hover:bg-amber-900'
                              }`}
                              title={it.completado ? "Marcar como pendiente" : "Marcar como resuelto"}
                            >
                              {it.completado ? 'Listo' : 'Pendiente'}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleEliminarFeedbackItem(fb.proyectoId, it.id)}
                              className="p-1 text-gray-500 hover:text-red-400 transition"
                              title="Remover ajuste"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="border-t border-gray-800/60 pt-2 flex justify-between items-center text-[10px] text-gray-500">
                    <span>ID Proyecto: <strong className="font-mono text-gray-400">{fb.proyectoId}</strong></span>
                    <span className="italic">Ordenado por cronología de reproducción</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

        </div>
      )}

      {/* TAB 3: CALENDARIO & TURNOS */}
      {adminTab === 'calendario' && (
        <div className="space-y-6 animate-fadeIn">
      {/* SECCIÓN 4: LIBERACIÓN DE CALENDARIO / DISPONIBILIDAD */}
      <div className="antigravity-glass-panel border border-white/10 p-6 sm:p-7 rounded-3xl shadow-2xl space-y-6">
        <div>
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Calendar className="w-4 h-4 text-emerald-500" />
            <span>Gestor Visual de Calendario y Horarios</span>
          </h3>
          <p className="text-xs text-gray-400 mt-1">
            Visualiza el estado real de tu estudio. Haz clic en <strong>cualquier día</strong> (disponible o bloqueado) para editar manualmente si está habilitado para grabaciones, sus horas permitidas, o añadir notas especiales.
          </p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          {/* El calendario interactivo para Administrador */}
          <div className="xl:col-span-8 bg-[#111827] p-5 rounded-xl border border-gray-800 space-y-4">
            <div className="flex justify-between items-center border-b border-gray-800 pb-2">
              <span className="text-xs font-bold text-gray-300 uppercase tracking-widest">
                📅 Calendario del Administrador
              </span>
              <span className="text-[10px] text-amber-500 font-bold bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20 uppercase">
                Modo Edición Manual
              </span>
            </div>
            
            <CalendarioSection 
              key={JSON.stringify(disponibilidadesManuales)}
              isAdmin={true} 
              onSelectSlot={(slot) => {
                if (slot.fechaStr) {
                  setFechaLiberar(slot.fechaStr);
                  setDiaDisponible(slot.disponible);
                  setHorarioLiberar(slot.horarioPermitido || '14:00 - 19:00');
                  setMotivoLiberar(slot.motivo || (slot.disponible ? 'Turno Tarde Libre' : 'Cerrado / No disponible'));
                }
              }} 
            />
          </div>

          {/* Formulario de creación/modificación + Reglas activas en columna lateral */}
          <div className="xl:col-span-4 space-y-4">
            <form onSubmit={handleGuardarDisponibilidad} className="bg-[#111827] p-5 rounded-xl border border-gray-800 space-y-4">
              <h4 className="text-xs font-bold text-amber-500 uppercase tracking-widest border-b border-gray-800 pb-2 flex justify-between items-center">
                <span>Editar Día Seleccionado</span>
                <span className="text-[11px] font-mono text-gray-300 font-bold bg-[#1e1e1e] px-2 py-0.5 rounded border border-gray-800">{fechaLiberar}</span>
              </h4>

              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase mb-1">Fecha a Editar</label>
                <input
                  type="date"
                  required
                  value={fechaLiberar}
                  onChange={(e) => setFechaLiberar(e.target.value)}
                  className="w-full bg-[#1e1e1e] border border-gray-800 text-white text-xs rounded-lg p-2.5 outline-none focus:border-red-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase mb-1.5">Estado del Día</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setDiaDisponible(true);
                      if (motivoLiberar === 'Cerrado / No disponible' || motivoLiberar === 'Sin turnos liberados') {
                        setMotivoLiberar('Turno Tarde Libre');
                      }
                    }}
                    className={`w-1/2 py-2 rounded-lg text-xs font-bold border transition ${
                      diaDisponible
                        ? 'bg-emerald-950 text-emerald-400 border-emerald-500/50'
                        : 'bg-transparent text-gray-500 border-gray-800 hover:border-gray-700'
                    }`}
                  >
                    🟢 Disponible
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDiaDisponible(false);
                      if (motivoLiberar === 'Turno Tarde Libre' || motivoLiberar === 'Día Liberado por Admin') {
                        setMotivoLiberar('Cerrado / No disponible');
                      }
                    }}
                    className={`w-1/2 py-2 rounded-lg text-xs font-bold border transition ${
                      !diaDisponible
                        ? 'bg-red-950 text-red-400 border-red-500/50'
                        : 'bg-transparent text-gray-500 border-gray-800 hover:border-gray-700'
                    }`}
                  >
                    🔴 Bloqueado
                  </button>
                </div>
              </div>

              {diaDisponible ? (
                <div className="space-y-3">
                  <label className="block text-[11px] font-bold text-gray-400 uppercase">Horario Permitido</label>
                  
                  {/* Dos selectores */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="block text-[10px] text-gray-500 mb-1 font-semibold">Hora de Inicio:</span>
                      <select
                        value={horaInicio}
                        onChange={(e) => setHorarioLiberar(`${e.target.value} - ${horaFin}`)}
                        className="w-full bg-[#1e1e1e] border border-gray-800 text-white text-xs rounded-lg p-2.5 outline-none focus:border-red-500 font-semibold"
                      >
                        {opcionesDeHoras.map((opt, i) => (
                          <option key={opt.value + i} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <span className="block text-[10px] text-gray-500 mb-1 font-semibold">Hora de Salida:</span>
                      <select
                        value={horaFin}
                        onChange={(e) => setHorarioLiberar(`${horaInicio} - ${e.target.value}`)}
                        className="w-full bg-[#1e1e1e] border border-gray-800 text-white text-xs rounded-lg p-2.5 outline-none focus:border-red-500 font-semibold"
                      >
                        {opcionesDeHoras.map((opt, i) => (
                          <option key={opt.value + i} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Atajos de Turnos */}
                  <div>
                    <span className="block text-[10px] text-gray-500 mb-1.5 font-semibold">Atajos Rápidos de Turnos:</span>
                    <div className="grid grid-cols-2 gap-1.5">
                      {[
                        { label: '🌅 Mañana (9am - 2pm)', start: '09:00', end: '14:00', motivo: 'Turno Mañana Libre' },
                        { label: '☀️ Tarde (2pm - 7pm)', start: '14:00', end: '19:00', motivo: 'Turno Tarde Libre' },
                        { label: '🌌 Noche (7pm - 12am)', start: '19:00', end: '00:00', motivo: 'Turno Noche Libre' },
                        { label: '⏱️ Completo (9am - 9pm)', start: '09:00', end: '21:00', motivo: 'Todo el día' }
                      ].map((preset, idx) => {
                        const isSelected = horaInicio === preset.start && horaFin === preset.end;
                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              setHorarioLiberar(`${preset.start} - ${preset.end}`);
                              setMotivoLiberar(preset.motivo);
                            }}
                            className={`py-1.5 px-2 rounded text-[10px] font-bold border transition text-left ${
                              isSelected
                                ? 'bg-amber-950/40 text-amber-400 border-amber-500/50'
                                : 'bg-[#1a1a1a]/40 text-gray-400 border-gray-800/80 hover:border-gray-700 hover:text-white'
                            }`}
                          >
                            {preset.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-black/40 rounded border border-gray-800 text-[11px] text-gray-500 italic">
                  🔒 El horario se deshabilita automáticamente cuando bloqueas el día.
                </div>
              )}

              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase mb-1">Notas / Motivo de Estado</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Turno Tarde Disponible"
                  value={motivoLiberar}
                  onChange={(e) => setMotivoLiberar(e.target.value)}
                  className="w-full bg-[#1e1e1e] border border-gray-800 text-white text-xs rounded-lg p-2.5 outline-none focus:border-red-500"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-red-700 hover:bg-red-600 text-white text-xs font-bold py-3 rounded-lg shadow-lg uppercase tracking-wider transition-all"
              >
                Guardar Cambios del Día
              </button>
            </form>

            {/* Listado de días configurados manualmente */}
            <div className="bg-[#111827] p-5 rounded-xl border border-gray-800 space-y-3">
              <h4 className="text-xs font-bold text-gray-300 uppercase tracking-widest border-b border-gray-800 pb-2">
                Días Personalizados ({Object.keys(disponibilidadesManuales).length})
              </h4>

              {Object.keys(disponibilidadesManuales).length === 0 ? (
                <div className="p-4 text-center bg-[#1e1e1e] rounded-lg border border-gray-800">
                  <p className="text-xs text-gray-500 italic">No hay días personalizados.</p>
                  <p className="text-[10px] text-gray-600 mt-1">Haz clic en cualquier celda para empezar a editar.</p>
                </div>
              ) : (
                <div className="overflow-y-auto max-h-[180px] pr-1 space-y-2">
                  {Object.entries(disponibilidadesManuales).sort((a,b) => a[0].localeCompare(b[0])).map(([fecha, info]: [string, any]) => (
                    <div key={fecha} className="bg-[#1e1e1e] p-2.5 rounded-lg border border-gray-800 flex justify-between items-center text-[11px]">
                      <div>
                        <span className="font-mono text-amber-500 font-bold block">{fecha}</span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          {info.disponible ? (
                            <span className="text-[8px] px-1 bg-emerald-950 text-emerald-400 font-bold rounded border border-emerald-900/40">LIBRE</span>
                          ) : (
                            <span className="text-[8px] px-1 bg-red-950 text-red-400 font-bold rounded border border-red-900/40">BLOQ</span>
                          )}
                          <span className="text-gray-400 font-semibold">{formatRangeTo12h(info.horarioPermitido) || ''}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleEliminarDisponibilidad(fecha)}
                        className="bg-red-950/40 hover:bg-red-900/40 text-red-400 font-bold p-1 px-2 rounded text-[10px] border border-red-900/30 transition"
                      >
                        Reset
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

        </div>
      )}

      {/* TAB 4: BÓVEDA A/B */}
      {adminTab === 'showcase' && (
        <div className="space-y-6 animate-fadeIn">
          {/* CONTROL ROOM: GESTOR BÓVEDA DE PISTAS A/B (AUDIOS CRUDOS Y MASTERIZADOS) */}
      <div className="antigravity-glass-panel border border-white/10 p-6 sm:p-7 rounded-3xl space-y-5 shadow-[0_30px_70px_rgba(0,0,0,0.8)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-red-900/40 rounded-lg border border-red-600/60 text-red-400">
              <Music className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white uppercase tracking-wider">
                CONTROL ROOM: Gestor Bóveda A/B (Audios de Muestra)
              </h3>
              <p className="text-[11px] text-gray-300">
                Sube tus canciones con versión <strong>Voz Cruda (Sin Mezclar)</strong> y versión <strong>Master Badlenz</strong> para que el cliente escuche el reproductor en vivo.
              </p>
            </div>
          </div>
          
          <button
            type="button"
            onClick={() => {
              setEditingShowcaseTrack({
                id: `track-${Date.now()}`,
                title: 'Nuevo Single 2026',
                artist: 'Badlenz Studio',
                genre: 'Urban Trap / Perreo',
                bpm: 128,
                descriptionA: 'Voz cruda de micrófono sin ecualización ni compresión.',
                descriptionB: 'Mezcla profesional + Afinación Melodyne + Master comercial.',
                audioAUrl: '',
                audioBUrl: ''
              });
            }}
            className="px-3.5 py-2 bg-red-700 hover:bg-red-600 text-white font-bold text-xs rounded-lg border border-red-500 transition shadow flex items-center gap-1.5 shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Añadir Nueva Canción A/B</span>
          </button>
        </div>

        {/* LISTADO DE PISTAS A/B EXISTENTES */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {showcaseTracks.map((t) => (
            <div key={t.id} className="bg-black/60 p-4 rounded-xl border border-gray-800 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[9px] uppercase font-mono font-bold bg-amber-950 text-amber-400 border border-amber-800/60 px-2 py-0.5 rounded">
                    {t.genre} • {t.bpm} BPM
                  </span>
                  <h4 className="text-sm font-black text-white mt-1 uppercase">{t.title}</h4>
                  <p className="text-[11px] text-gray-400">{t.artist}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setEditingShowcaseTrack(t)}
                    className="px-2.5 py-1 bg-gray-800 hover:bg-gray-700 text-amber-400 font-bold text-xs rounded border border-gray-700 transition flex items-center gap-1 cursor-pointer"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    <span>Editar Audios</span>
                  </button>
                  {showcaseTracks.length > 1 && (
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`¿Eliminar la pista "${t.title}" del reproductor A/B?`)) {
                          eliminarShowcaseTrack(t.id);
                          setShowcaseTracks(getShowcaseTracks());
                        }
                      }}
                      className="p-1 bg-red-950/60 hover:bg-red-900 text-red-400 rounded border border-red-800/80 transition cursor-pointer"
                      title="Eliminar pista"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[10px]">
                {/* Opción A */}
                <div className="bg-gray-900/80 p-2 rounded border border-gray-800">
                  <span className="font-bold text-gray-400 uppercase block mb-0.5">Versión A: Referencia (Reff):</span>
                  {t.audioAUrl ? (
                    <span className="text-emerald-400 font-mono font-bold flex items-center gap-1">
                      <Volume2 className="w-3 h-3" /> Audio Subido ✓
                    </span>
                  ) : (
                    <span className="text-amber-400 font-mono italic">Sintetizador demo activo (Sin audio subido)</span>
                  )}
                  <p className="text-gray-400 text-[9px] mt-1 line-clamp-2">{t.descriptionA}</p>
                </div>

                {/* Opción B */}
                <div className="bg-red-950/40 p-2 rounded border border-red-900/60">
                  <span className="font-bold text-amber-300 uppercase block mb-0.5">Versión B: Master V1 (Badlenz):</span>
                  {t.audioBUrl ? (
                    <span className="text-emerald-400 font-mono font-bold flex items-center gap-1">
                      <Volume2 className="w-3 h-3" /> Audio Subido ✓
                    </span>
                  ) : (
                    <span className="text-amber-400 font-mono italic">Sintetizador demo activo (Sin audio subido)</span>
                  )}
                  <p className="text-gray-300 text-[9px] mt-1 line-clamp-2">{t.descriptionB}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* MODAL / FORMULARIO EDICIÓN DE AUDIOS A/B */}
        {editingShowcaseTrack && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-[#181820] border-2 border-red-600 rounded-2xl max-w-lg w-full p-5 space-y-4 text-xs text-gray-200 shadow-2xl relative">
              <div className="flex items-center justify-between border-b border-gray-800 pb-3">
                <h3 className="text-sm font-black text-white uppercase flex items-center gap-2">
                  <Music className="w-4 h-4 text-red-500" />
                  <span>Subir / Configurar Audios A/B ({editingShowcaseTrack.title})</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setEditingShowcaseTrack(null)}
                  className="text-gray-400 hover:text-white p-1 rounded bg-black/40"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-gray-300 uppercase text-[10px] mb-1">Título Canción:</label>
                    <input
                      type="text"
                      value={editingShowcaseTrack.title}
                      onChange={(e) => setEditingShowcaseTrack({ ...editingShowcaseTrack, title: e.target.value })}
                      className="w-full bg-black/80 border border-gray-700 rounded p-2 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-gray-300 uppercase text-[10px] mb-1">Artista(s):</label>
                    <input
                      type="text"
                      value={editingShowcaseTrack.artist}
                      onChange={(e) => setEditingShowcaseTrack({ ...editingShowcaseTrack, artist: e.target.value })}
                      className="w-full bg-black/80 border border-gray-700 rounded p-2 text-xs text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-gray-300 uppercase text-[10px] mb-1">Género Musical:</label>
                    <input
                      type="text"
                      value={editingShowcaseTrack.genre}
                      onChange={(e) => setEditingShowcaseTrack({ ...editingShowcaseTrack, genre: e.target.value })}
                      className="w-full bg-black/80 border border-gray-700 rounded p-2 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-gray-300 uppercase text-[10px] mb-1">BPM Tempo:</label>
                    <input
                      type="number"
                      value={editingShowcaseTrack.bpm}
                      onChange={(e) => setEditingShowcaseTrack({ ...editingShowcaseTrack, bpm: Number(e.target.value) || 120 })}
                      className="w-full bg-black/80 border border-gray-700 rounded p-2 text-xs text-white"
                    />
                  </div>
                </div>

                {/* AUDIO A: REFERENCIA REFF */}
                <div className="bg-black/60 p-3 rounded-xl border border-gray-800 space-y-2">
                  <span className="font-bold text-amber-400 uppercase text-[10px] block">
                    🎙️ VERSIÓN A: Referencia (Reff)
                  </span>
                  <div>
                    <label className="block text-[10px] text-gray-400 mb-1">Subir Archivo MP3 / WAV desde tu PC:</label>
                    <input
                      type="file"
                      accept="audio/*"
                      disabled={uploadingAudioA}
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          try {
                            setUploadingAudioA(true);
                            setAudioAStatusMsg(`Guardando ${file.name}...`);
                            const storageKey = `track_${editingShowcaseTrack.id}_A`;
                            const storedUri = await saveAudioToStorage(storageKey, file);
                            setEditingShowcaseTrack(prev => prev ? { ...prev, audioAUrl: storedUri } : null);
                            setAudioAStatusMsg(`✓ Archivo listo: ${file.name} (${(file.size / (1024 * 1024)).toFixed(2)} MB)`);
                          } catch (err) {
                            console.error('Error guardando audio A:', err);
                            setAudioAStatusMsg('❌ Error al procesar archivo');
                            alert('No se pudo procesar el archivo. Prueba con formato MP3 o WAV estándar.');
                          } finally {
                            setUploadingAudioA(false);
                          }
                        }
                      }}
                      className="block w-full text-[10px] text-gray-400 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-[10px] file:font-bold file:bg-gray-800 file:text-white hover:file:bg-gray-700 cursor-pointer"
                    />
                    {uploadingAudioA && (
                      <span className="text-[10px] text-amber-400 font-mono block mt-1 animate-pulse">
                        ⏳ Procesando audio en almacenamiento local...
                      </span>
                    )}
                    {audioAStatusMsg && !uploadingAudioA && (
                      <span className="text-[10px] text-emerald-400 font-mono font-bold block mt-1">
                        {audioAStatusMsg}
                      </span>
                    )}
                  </div>
                  <div>
                    <input
                      type="text"
                      placeholder="o pega URL pública de audio (ej: https://.../cruda.mp3)"
                      value={editingShowcaseTrack.audioAUrl?.startsWith('indexeddb://') ? '✓ Archivo local guardado desde PC' : (editingShowcaseTrack.audioAUrl || '')}
                      onChange={(e) => setEditingShowcaseTrack({ ...editingShowcaseTrack, audioAUrl: e.target.value })}
                      className="w-full bg-gray-900 border border-gray-800 rounded p-1.5 text-[10px] font-mono text-gray-300"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-gray-400 mb-0.5">Descripción de lo que se escucha en Opción A:</label>
                    <input
                      type="text"
                      value={editingShowcaseTrack.descriptionA}
                      onChange={(e) => setEditingShowcaseTrack({ ...editingShowcaseTrack, descriptionA: e.target.value })}
                      className="w-full bg-gray-900 border border-gray-800 rounded p-1.5 text-[10px] text-gray-300"
                    />
                  </div>
                </div>

                {/* AUDIO B: MASTER V1 BADLENZ */}
                <div className="bg-red-950/30 p-3 rounded-xl border border-red-900/60 space-y-2">
                  <span className="font-bold text-red-400 uppercase text-[10px] block">
                    🔥 VERSIÓN B: Master V1 (Badlenz)
                  </span>
                  <div>
                    <label className="block text-[10px] text-gray-400 mb-1">Subir Archivo MP3 / WAV desde tu PC:</label>
                    <input
                      type="file"
                      accept="audio/*"
                      disabled={uploadingAudioB}
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          try {
                            setUploadingAudioB(true);
                            setAudioBStatusMsg(`Guardando ${file.name}...`);
                            const storageKey = `track_${editingShowcaseTrack.id}_B`;
                            const storedUri = await saveAudioToStorage(storageKey, file);
                            setEditingShowcaseTrack(prev => prev ? { ...prev, audioBUrl: storedUri } : null);
                            setAudioBStatusMsg(`✓ Archivo listo: ${file.name} (${(file.size / (1024 * 1024)).toFixed(2)} MB)`);
                          } catch (err) {
                            console.error('Error guardando audio B:', err);
                            setAudioBStatusMsg('❌ Error al procesar archivo');
                            alert('No se pudo procesar el archivo. Prueba con formato MP3 o WAV estándar.');
                          } finally {
                            setUploadingAudioB(false);
                          }
                        }
                      }}
                      className="block w-full text-[10px] text-gray-400 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-[10px] file:font-bold file:bg-red-950 file:text-red-200 hover:file:bg-red-900 cursor-pointer"
                    />
                    {uploadingAudioB && (
                      <span className="text-[10px] text-amber-400 font-mono block mt-1 animate-pulse">
                        ⏳ Procesando audio en almacenamiento local...
                      </span>
                    )}
                    {audioBStatusMsg && !uploadingAudioB && (
                      <span className="text-[10px] text-emerald-400 font-mono font-bold block mt-1">
                        {audioBStatusMsg}
                      </span>
                    )}
                  </div>
                  <div>
                    <input
                      type="text"
                      placeholder="o pega URL pública de audio (ej: https://.../master.mp3)"
                      value={editingShowcaseTrack.audioBUrl?.startsWith('indexeddb://') ? '✓ Archivo local guardado desde PC' : (editingShowcaseTrack.audioBUrl || '')}
                      onChange={(e) => setEditingShowcaseTrack({ ...editingShowcaseTrack, audioBUrl: e.target.value })}
                      className="w-full bg-gray-900 border border-gray-800 rounded p-1.5 text-[10px] font-mono text-gray-300"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-gray-400 mb-0.5">Descripción de lo que se escucha en Opción B:</label>
                    <input
                      type="text"
                      value={editingShowcaseTrack.descriptionB}
                      onChange={(e) => setEditingShowcaseTrack({ ...editingShowcaseTrack, descriptionB: e.target.value })}
                      className="w-full bg-gray-900 border border-gray-800 rounded p-1.5 text-[10px] text-gray-300"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-800">
                <button
                  type="button"
                  onClick={() => {
                    setEditingShowcaseTrack(null);
                    setAudioAStatusMsg('');
                    setAudioBStatusMsg('');
                  }}
                  className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold rounded text-xs cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={uploadingAudioA || uploadingAudioB || savingAudioTrack}
                  onClick={() => {
                    if (!editingShowcaseTrack.title) return alert('Por favor ingresa un título para la canción.');
                    try {
                      setSavingAudioTrack(true);
                      guardarShowcaseTrack(editingShowcaseTrack);
                      setShowcaseTracks(getShowcaseTracks());
                      setEditingShowcaseTrack(null);
                      setAudioAStatusMsg('');
                      setAudioBStatusMsg('');
                      alert('¡Audios A/B guardados con éxito! El reproductor público se actualizó.');
                    } catch (e) {
                      console.error('Error al guardar track:', e);
                      alert('Ocurrió un error al guardar. Revisa que el archivo sea un audio válido.');
                    } finally {
                      setSavingAudioTrack(false);
                    }
                  }}
                  className="px-4 py-1.5 bg-gradient-to-r from-red-600 to-amber-500 hover:from-red-500 hover:to-amber-400 text-white font-black rounded text-xs uppercase tracking-wider transition shadow cursor-pointer disabled:opacity-50"
                >
                  {savingAudioTrack ? 'Guardando...' : 'Guardar Audios A/B'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

        </div>
      )}

      {/* TAB 5: ARTISTAS & LOYALTY */}
      {adminTab === 'crm' && (
        <div className="space-y-6 animate-fadeIn">
      {/* SECCIÓN 3: BASE DE DATOS DE CLIENTES */}
      <div className="antigravity-glass-panel border border-white/10 p-6 sm:p-7 rounded-3xl space-y-5 shadow-2xl">
        <div>
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Users className="w-4 h-4 text-red-500" />
            <span>Base de Datos General de Artistas</span>
          </h3>
          <p className="text-xs text-gray-400">Directorio de contacto para envíos de pases de estudio y seguimientos de maquetas.</p>
        </div>

        {clientes.length === 0 ? (
          <p className="text-xs text-gray-500 italic">No hay clientes guardados en el sistema.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-300">
              <thead className="bg-[#111827] text-gray-400 font-bold uppercase border-b border-gray-800">
                <tr>
                  <th className="p-3">ID</th>
                  <th className="p-3">Artista</th>
                  <th className="p-3">Nombre Legal</th>
                  <th className="p-3">Contacto</th>
                  <th className="p-3">Instagram</th>
                  <th className="p-3">Registro</th>
                  <th className="p-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {clientes.map(c => (
                  <tr key={c.id} className="hover:bg-gray-900/50 transition">
                    <td className="p-3 font-mono text-red-400 font-bold">{c.id}</td>
                    <td className="p-3 font-black text-white uppercase">{c.nombreArtistico}</td>
                    <td className="p-3 font-medium text-gray-300">{c.nombreReal}</td>
                    <td className="p-3 space-y-0.5">
                      <div className="flex items-center gap-1 text-gray-400">
                        <Mail className="w-3 h-3" />
                        <span>{c.email}</span>
                      </div>
                      <div className="flex items-center gap-1 text-gray-500 text-[11px]">
                        <Phone className="w-3 h-3" />
                        <span>{c.telefono}</span>
                      </div>
                    </td>
                    <td className="p-3 font-semibold text-amber-500">
                      <span className="flex items-center gap-1">
                        <Instagram className="w-3.5 h-3.5" />
                        <span>{c.instagram}</span>
                      </span>
                    </td>
                    <td className="p-3 text-gray-500 font-mono">{c.fechaCreacion}</td>
                    <td className="p-3 text-right">
                      <div className="flex justify-end gap-1.5">
                        <button
                          onClick={() => setClienteEditando(c)}
                          className="p-1 px-2 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded text-[10px] text-gray-300 transition"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDeleteCliente(c.id)}
                          className="p-1 px-2 bg-red-950/40 hover:bg-red-900/40 border border-red-900/40 rounded text-[10px] text-red-400 transition"
                        >
                          Remover
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* SECCIÓN 6: CLASIFICACIÓN DE ARTISTAS Y HORAS DE VUELO (LOYALTY SYSTEM) */}
      <div className="antigravity-glass border border-white/10 p-6 sm:p-7 rounded-3xl space-y-5 shadow-2xl mt-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-gray-800 pb-4">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-500" />
              <span>Ranking de Fidelidad y 'Horas de Vuelo'</span>
            </h3>
            <p className="text-xs text-gray-400 mt-1">
              Clasificación de artistas basada en sus horas de grabación confirmadas o completadas. Identifica quiénes están próximos a desbloquear su siguiente premio.
            </p>
          </div>
          
          {/* Input de Búsqueda */}
          <div className="relative w-full md:w-72 shrink-0">
            <input
              type="text"
              placeholder="Buscar artista por nombre..."
              className="w-full bg-[#111827] border border-gray-800 text-xs text-white placeholder-gray-500 rounded-lg px-3 py-2 focus:outline-none focus:border-red-500"
              value={busquedaRanking}
              onChange={(e) => setBusquedaRanking(e.target.value)}
            />
          </div>
        </div>

        {/* Lógica de Procesamiento del Ranking */}
        {(() => {
          const rankingMap = new Map<string, {
            nombreArtistico: string;
            nombreCompleto: string;
            email: string;
            whatsapp: string;
            horasDeVuelo: number;
            esClienteRegistrado: boolean;
          }>();

          // 1. Agregar todos los clientes registrados
          clientes.forEach(c => {
            rankingMap.set(c.nombreArtistico.toLowerCase().trim(), {
              nombreArtistico: c.nombreArtistico,
              nombreCompleto: c.nombreReal,
              email: c.email,
              whatsapp: c.telefono,
              horasDeVuelo: 0,
              esClienteRegistrado: true
            });
          });

          // 2. Acumular horas de vuelo desde las reservas confirmadas o completadas
          reservas.forEach(r => {
            if (r.estado === 'Confirmada' || r.estado === 'Completada') {
              const artNameKey = r.nombreArtistico.toLowerCase().trim();
              const horas = Number(r.totalHoras) || 0;
              
              if (rankingMap.has(artNameKey)) {
                const item = rankingMap.get(artNameKey)!;
                item.horasDeVuelo += horas;
              } else if (r.nombreArtistico.trim()) {
                // Artista no registrado formalmente como cliente, pero con reservas
                rankingMap.set(artNameKey, {
                  nombreArtistico: r.nombreArtistico,
                  nombreCompleto: 'Artista Invitado',
                  email: '-',
                  whatsapp: '-',
                  horasDeVuelo: horas,
                  esClienteRegistrado: false
                });
              }
            }
          });

          // Milestones de Premios
          const milestones = [
            { pts: 5, label: '30% Descuento' },
            { pts: 8, label: '50% Descuento' },
            { pts: 10, label: 'Mix & Master gratis' },
            { pts: 15, label: 'Pista de regalo' },
            { pts: 20, label: 'Grabación de 1 tema' },
            { pts: 25, label: 'Producción completa' },
          ];

          // Filtrar por término de búsqueda
          let listaRanking = Array.from(rankingMap.values());
          if (busquedaRanking.trim()) {
            const query = busquedaRanking.toLowerCase();
            listaRanking = listaRanking.filter(item => 
              item.nombreArtistico.toLowerCase().includes(query) ||
              item.nombreCompleto.toLowerCase().includes(query)
            );
          }

          // Ordenar descendentemente por horas de vuelo
          listaRanking.sort((a, b) => b.horasDeVuelo - a.horasDeVuelo);

          if (listaRanking.length === 0) {
            return (
              <div className="p-8 text-center bg-black/20 rounded-lg border border-gray-900/60">
                <p className="text-xs text-gray-500 italic">No se encontraron artistas que coincidan con la búsqueda.</p>
              </div>
            );
          }

          return (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-gray-800 text-gray-500 text-[10px] uppercase font-black tracking-wider">
                    <th className="py-3 px-3 text-center w-12">Puesto</th>
                    <th className="py-3 px-3">Artista</th>
                    <th className="py-3 px-3 text-center">Horas de Vuelo</th>
                    <th className="py-3 px-3">Progreso de Nivel</th>
                    <th className="py-3 px-3">Próximo Escalón</th>
                    <th className="py-3 px-3 text-center">Estado de Alerta</th>
                    <th className="py-3 px-3 text-right">Contacto CRM</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/40">
                  {listaRanking.map((item, index) => {
                    const puesto = index + 1;
                    const horas = item.horasDeVuelo;
                    const percentage = Math.min((horas / 25) * 100, 100);

                    // Buscar próximo hito
                    const nextMilestone = milestones.find(m => horas < m.pts);
                    const horasFaltantes = nextMilestone ? nextMilestone.pts - horas : 0;
                    
                    // Alerta si falta poco para el siguiente beneficio (ej: <= 2 horas)
                    const estaMuyCerca = nextMilestone && horasFaltantes <= 2;

                    return (
                      <tr 
                        key={item.nombreArtistico} 
                        className={`hover:bg-white/[0.02] transition-all ${
                          puesto === 1 ? 'bg-amber-500/[0.02]' : puesto === 2 ? 'bg-slate-400/[0.01]' : puesto === 3 ? 'bg-amber-700/[0.01]' : ''
                        }`}
                      >
                        {/* Puesto */}
                        <td className="py-3.5 px-3 text-center font-mono">
                          {puesto === 1 ? (
                            <span className="inline-flex items-center justify-center bg-amber-500/20 text-amber-500 border border-amber-500/40 w-6 h-6 rounded-full font-black text-xs" title="Líder Absoluto 🥇">
                              🥇
                            </span>
                          ) : puesto === 2 ? (
                            <span className="inline-flex items-center justify-center bg-slate-400/20 text-slate-300 border border-slate-400/40 w-6 h-6 rounded-full font-black text-xs" title="Subcampeón 🥈">
                              🥈
                            </span>
                          ) : puesto === 3 ? (
                            <span className="inline-flex items-center justify-center bg-amber-800/20 text-amber-600 border border-amber-800/40 w-6 h-6 rounded-full font-black text-xs" title="Tercer Lugar 🥉">
                              🥉
                            </span>
                          ) : (
                            <span className="text-gray-500 font-bold text-xs">#{puesto}</span>
                          )}
                        </td>

                        {/* Artista */}
                        <td className="py-3.5 px-3">
                          <div className="flex items-center gap-2">
                            <div>
                              <p className="font-extrabold text-white uppercase tracking-wide flex items-center gap-1.5">
                                <span>{item.nombreArtistico}</span>
                                {item.esClienteRegistrado ? (
                                  <span className="text-[8px] bg-emerald-950/80 border border-emerald-800/40 text-emerald-400 px-1 rounded uppercase tracking-wider font-normal">
                                    Registrado
                                  </span>
                                ) : (
                                  <span className="text-[8px] bg-gray-950/80 border border-gray-800 text-gray-500 px-1 rounded uppercase tracking-wider font-normal">
                                    Invitado
                                  </span>
                                )}
                              </p>
                              <p className="text-[10px] text-gray-500 font-mono mt-0.5">{item.nombreCompleto} • {item.email}</p>
                            </div>
                          </div>
                        </td>

                        {/* Horas de Vuelo */}
                        <td className="py-3.5 px-3 text-center">
                          <span className="inline-flex items-center gap-1 font-extrabold text-amber-500 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-md font-mono text-xs">
                            <Flame className="w-3.5 h-3.5 text-red-500 fill-red-500 animate-pulse" />
                            {horas} hrs
                          </span>
                        </td>

                        {/* Progreso Visual */}
                        <td className="py-3.5 px-3 w-40 min-w-[150px]">
                          <div className="space-y-1">
                            <div className="w-full bg-black/40 border border-gray-800 h-2 rounded-full overflow-hidden">
                              <div 
                                className="bg-gradient-to-r from-red-600 via-orange-500 to-amber-500 h-full rounded-full transition-all duration-1000"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                            <span className="text-[9px] text-gray-500 font-mono block text-right">
                              {horas}/25h ({Math.round(percentage)}%)
                            </span>
                          </div>
                        </td>

                        {/* Próximo Escalón */}
                        <td className="py-3.5 px-3">
                          {nextMilestone ? (
                            <div>
                              <p className="font-bold text-gray-300">{nextMilestone.label}</p>
                              <p className="text-[9px] text-gray-500 mt-0.5">Desbloquea a las {nextMilestone.pts}h</p>
                            </div>
                          ) : (
                            <span className="text-[10px] text-emerald-400 font-black bg-emerald-950/40 border border-emerald-900/30 px-2 py-0.5 rounded uppercase tracking-wider">
                              👑 Rango Máximo Leyenda
                            </span>
                          )}
                        </td>

                        {/* Estado de Alerta */}
                        <td className="py-3.5 px-3 text-center">
                          {estaMuyCerca ? (
                            <span className="inline-flex items-center gap-1 text-[9px] bg-red-950/80 border border-red-700/30 text-red-400 font-black px-2 py-1 rounded animate-pulse uppercase tracking-wider">
                              ⚠️ ¡Cerca! Faltan {horasFaltantes}h
                            </span>
                          ) : nextMilestone ? (
                            <span className="text-[9px] bg-gray-900 border border-gray-800 text-gray-500 px-2 py-1 rounded font-mono">
                              Faltan {horasFaltantes}h
                            </span>
                          ) : (
                            <span className="text-[9px] bg-emerald-950/20 border border-emerald-900/30 text-emerald-400 font-mono px-2 py-1 rounded">
                              Completado
                            </span>
                          )}
                        </td>

                        {/* Contacto CRM */}
                        <td className="py-3.5 px-3 text-right">
                          {item.whatsapp && item.whatsapp !== '-' ? (
                            <a
                              href={`https://wa.me/${item.whatsapp.replace(/\D/g, '')}?text=Hola%20${encodeURIComponent(item.nombreArtistico)}!%20Te%20escribimos%20de%20La%20Facultad%20Studio.%20Tienes%20${horas}%20Horas%20de%20Vuelo%20con%20nosotros%20y%20te%20faltan%20solo%20${horasFaltantes}%20horas%20para%20tu%20pr%C3%B3xima%20recompensa%20(${encodeURIComponent(nextMilestone?.label || '')}).%20%C2%BFTe%20gustar%C3%ADa%20agendar%20tu%20pr%C3%B3xima%20sesi%C3%B3n?`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 bg-emerald-700 hover:bg-emerald-600 text-white font-bold px-2 py-1.5 rounded text-[10px] uppercase tracking-wider transition-all"
                            >
                              <Phone className="w-3 h-3" />
                              <span>Fidelizar WA</span>
                            </a>
                          ) : (
                            <span className="text-[10px] text-gray-600 italic">Sin teléfono</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          );
        })()}
      </div>

      {/* SECCIÓN NUEVA: GESTIÓN DE ARCHIVOS DE ARTISTAS */}
      <div className="antigravity-glass border border-white/10 p-6 sm:p-7 rounded-3xl space-y-5 shadow-2xl mt-6">
        <div className="flex items-center gap-2">
          <HardDrive className="w-5 h-5 text-amber-500" />
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            Gestión de Archivos de Artistas
          </h3>
        </div>
        <p className="text-xs text-gray-400">Registra enlaces de Google Drive o similares para que los artistas los vean en su portal personal.</p>
        
        <form onSubmit={handleAdminAddFile} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 bg-black/30 p-4 rounded-xl border border-gray-800">
          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-gray-500 uppercase">Email del Artista</label>
            <input
              type="email"
              required
              placeholder="artista@ejemplo.com"
              value={adminFileEmail}
              onChange={e => setAdminFileEmail(e.target.value)}
              className="w-full bg-[#111827] border border-gray-700 rounded p-2 text-xs text-white outline-none focus:border-amber-500"
            />
          </div>
          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-gray-500 uppercase">Nombre del Archivo</label>
            <input
              type="text"
              required
              placeholder="Ej: Mezcla Final Voces"
              value={adminFileName}
              onChange={e => setAdminFileName(e.target.value)}
              className="w-full bg-[#111827] border border-gray-700 rounded p-2 text-xs text-white outline-none focus:border-amber-500"
            />
          </div>
          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-gray-500 uppercase">Tipo</label>
            <select
              value={adminFileType}
              onChange={e => setAdminFileType(e.target.value as any)}
              className="w-full bg-[#111827] border border-gray-700 rounded p-2 text-xs text-white outline-none focus:border-amber-500"
            >
              <option value="Master">Master WAV 24-bit/48kHz</option>
              <option value="Mezcla">MP3 de Prueba (320kbps)</option>
              <option value="Stems">Stems / Multitrack (Google Drive / Dropbox)</option>
              <option value="Proyecto">Versión Instrumental (WAV)</option>
              <option value="Recibo">Acapella Procesada (WAV)</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-gray-500 uppercase">Enlace (Google Drive/etc)</label>
            <input
              type="url"
              required
              placeholder="https://drive.google.com/..."
              value={adminFileUrl}
              onChange={e => setAdminFileUrl(e.target.value)}
              className="w-full bg-[#111827] border border-gray-700 rounded p-2 text-xs text-white outline-none focus:border-amber-500"
            />
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              className="w-full bg-amber-600 hover:bg-amber-500 text-black font-black py-2 rounded text-xs uppercase transition shadow-lg"
            >
              Asignar Archivo
            </button>
          </div>
        </form>
      </div>

        </div>
      )}

      {/* TAB 6: CONFIGURACIÓN & SISTEMA */}
      {adminTab === 'ajustes' && (
        <div className="space-y-6 animate-fadeIn">
      {/* SELECTOR GLOBAL DE MODO DE FUNCIONAMIENTO (DEMO vs LANZAMIENTO) */}
      <div className="antigravity-glass border border-white/10 p-6 rounded-3xl shadow-2xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-[9px] font-black bg-amber-500 text-gray-950 px-2 py-0.5 rounded uppercase tracking-widest">
              ENTORNO DE TRABAJO ESTUDIO
            </span>
            <h2 className="text-sm sm:text-base font-black text-white uppercase tracking-wider mt-1.5 flex items-center gap-2">
              <span>Modo Activo:</span>
              {currentMode === 'demo' ? (
                <span className="text-emerald-400 font-black animate-pulse flex items-center gap-1.5 bg-emerald-950/60 border border-emerald-800/40 px-3 py-0.5 rounded-lg text-xs">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                  MODO DEMO (SIMULADO)
                </span>
              ) : (
                <span className="text-red-400 font-black flex items-center gap-1.5 bg-red-950/60 border border-red-800/40 px-3 py-0.5 rounded-lg text-xs shadow-[0_0_15px_rgba(239,68,68,0.2)]">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
                  MODO LANZAMIENTO (OFICIAL)
                </span>
              )}
            </h2>
            <p className="text-[11px] text-gray-400 mt-1 max-w-2xl leading-relaxed">
              {currentMode === 'demo'
                ? 'El Modo Demo carga clientes ficticios y servicios de prueba para ensayar el reproductor interactivo, la firma del contrato y el semáforo.'
                : 'El Modo Lanzamiento borró toda la información demo y mantiene el estudio 100% en limpio para registrar contratos y sesiones oficiales.'}
            </p>
          </div>

          <div className="flex items-center gap-2 bg-black/60 p-1.5 rounded-xl border border-gray-800/80 shrink-0 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => handleToggleMode('demo')}
              disabled={isChangingMode || currentMode === 'demo'}
              className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition ${
                currentMode === 'demo'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800/50 cursor-pointer'
              }`}
            >
              📊 Modo Demo
            </button>
            <button
              type="button"
              onClick={() => handleToggleMode('lanzamiento')}
              disabled={isChangingMode || currentMode === 'lanzamiento'}
              className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition ${
                currentMode === 'lanzamiento'
                  ? 'bg-red-700 text-white shadow-md shadow-red-900/20'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800/50 cursor-pointer'
              }`}
            >
              🚀 Lanzamiento
            </button>
          </div>
        </div>
      </div>

      {/* CONTROL ROOM: CONFIGURACIÓN DE UBICACIÓN Y GUÍA DE LLEGADA EN HORMIGUEROS */}
      <div className="antigravity-glass border border-white/10 p-6 rounded-3xl space-y-5 shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-900/40 rounded-lg border border-amber-600/60 text-amber-400">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white uppercase tracking-wider">
                CONTROL ROOM: Guía de Llegada & Ubicación Exacta (Hormigueros)
              </h3>
              <p className="text-[11px] text-gray-300">
                Pega tu enlace exacto de Google Maps o Waze cuando lo tengas listo. Se mostrará automáticamente a los artistas en su Pase VIP de confirmación.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              guardarStudioConfig(studioConfig);
              setSavedConfigMessage(true);
              setTimeout(() => setSavedConfigMessage(false), 3000);
            }}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-gray-950 font-black text-xs uppercase tracking-wider rounded-lg border border-amber-300 transition shadow flex items-center gap-1.5 shrink-0 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Guardar Configuración Ubicación</span>
          </button>
        </div>

        {savedConfigMessage && (
          <div className="bg-emerald-950/80 border border-emerald-500 text-emerald-300 p-2.5 rounded-lg text-xs font-bold flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>¡Configuración de ubicación y reglas guardada con éxito y sincronizada en vivo!</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {/* Col 1: Enlaces GPS */}
          <div className="space-y-3 bg-black/50 p-4 rounded-xl border border-gray-800">
            <span className="font-bold text-amber-400 uppercase text-[10px] block flex items-center gap-1">
              <Compass className="w-3.5 h-3.5" />
              Enlaces GPS Exactos para Clientes
            </span>

            <div>
              <label className="block text-gray-300 font-bold mb-1">
                Link de Google Maps Exacto de La Facultad Studio:
              </label>
              <input
                type="text"
                placeholder="Pega aquí tu enlace de Google Maps (ej: https://maps.app.goo.gl/...)"
                value={studioConfig.googleMapsLocationUrl}
                onChange={(e) => setStudioConfig({ ...studioConfig, googleMapsLocationUrl: e.target.value })}
                className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white font-mono text-xs focus:border-amber-500 outline-none"
              />
              <span className="text-[10px] text-gray-400 block mt-1">
                * Este enlace se incluirá en el botón directo "Abrir en Google Maps" en el pase del cliente.
              </span>
            </div>

            <div>
              <label className="block text-gray-300 font-bold mb-1">
                Link de Waze (Opcional):
              </label>
              <input
                type="text"
                placeholder="https://waze.com/ul?q=..."
                value={studioConfig.wazeLocationUrl}
                onChange={(e) => setStudioConfig({ ...studioConfig, wazeLocationUrl: e.target.value })}
                className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white font-mono text-xs focus:border-amber-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-gray-300 font-bold mb-1">
                Dirección Escrita / Puntos de Referencia (Hormigueros, PR):
              </label>
              <input
                type="text"
                value={studioConfig.direccionTexto}
                onChange={(e) => setStudioConfig({ ...studioConfig, direccionTexto: e.target.value })}
                className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white text-xs focus:border-amber-500 outline-none"
              />
            </div>
          </div>

          {/* Col 2: Estacionamiento & Reglas de la Casa */}
          <div className="space-y-3 bg-black/50 p-4 rounded-xl border border-gray-800">
            <span className="font-bold text-amber-400 uppercase text-[10px] block flex items-center gap-1">
              <ShieldAlert className="w-3.5 h-3.5" />
              Estacionamiento & Reglas de la Sala
            </span>

            <div>
              <label className="block text-gray-300 font-bold mb-1">
                Instrucciones de Estacionamiento:
              </label>
              <textarea
                rows={2}
                value={studioConfig.instruccionesEstacionamiento}
                onChange={(e) => setStudioConfig({ ...studioConfig, instruccionesEstacionamiento: e.target.value })}
                className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white text-xs focus:border-amber-500 outline-none resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-gray-300 font-bold mb-1">
                  Acompañantes Máximos en Sala:
                </label>
                <input
                  type="number"
                  min={0}
                  max={10}
                  value={studioConfig.maxAcompanantes}
                  onChange={(e) => setStudioConfig({ ...studioConfig, maxAcompanantes: Number(e.target.value) || 2 })}
                  className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white font-mono text-xs focus:border-amber-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-gray-300 font-bold mb-1">
                  Política de Entrega:
                </label>
                <input
                  type="text"
                  value={studioConfig.politicaEntregaTexto}
                  onChange={(e) => setStudioConfig({ ...studioConfig, politicaEntregaTexto: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white text-xs focus:border-amber-500 outline-none"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
          {/* BADLENZ | LA FACULTAD: PLAN ESTRATÉGICO 2026, METAS & SCRIPTS DE VENTA  */}
          {/* ========================================================================= */}
          <div className="antigravity-glass border border-white/10 p-6 sm:p-7 rounded-3xl shadow-2xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-red-600/20 text-red-400 border border-red-500/30 rounded-xl">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[9px] font-black bg-red-600 text-white uppercase tracking-widest font-mono">
                      ESTRATEGIA 2026
                    </span>
                    <span className="text-xs font-mono font-bold text-amber-400">PLAN OPERATIVO &amp; FINANCIERO</span>
                  </div>
                  <h3 className="text-base font-black text-white uppercase mt-0.5">
                    Metas Mensuales, Segmentación VIP &amp; Scripts de Cierre
                  </h3>
                </div>
              </div>
              <span className="text-[10px] font-mono text-gray-400 bg-black/60 px-3 py-1 rounded-lg border border-gray-800">
                "Tu canción. Tu sonido. Terminada."
              </span>
            </div>

            {/* METAS FINANCIERAS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="bg-black/60 p-3.5 rounded-xl border border-gray-800 space-y-1">
                <span className="text-[10px] font-bold text-gray-400 uppercase block">Trabajo Principal (Neto)</span>
                <p className="text-lg font-black text-white font-mono">$1,356 <span className="text-xs text-gray-400 font-sans font-normal">/ mes</span></p>
                <span className="text-[10px] text-gray-400 font-mono block">$678 USD quincenales</span>
              </div>

              <div className="bg-black/60 p-3.5 rounded-xl border border-red-900/40 space-y-1">
                <span className="text-[10px] font-bold text-red-400 uppercase block">Meta Inicial Badlenz</span>
                <p className="text-lg font-black text-amber-400 font-mono">$600 – $700 <span className="text-xs text-gray-400 font-sans font-normal">/ mes</span></p>
                <span className="text-[10px] text-emerald-400 font-mono block">Meta de 4 a 5 canciones terminadas</span>
              </div>

              <div className="bg-black/60 p-3.5 rounded-xl border border-emerald-900/40 space-y-1">
                <span className="text-[10px] font-bold text-emerald-400 uppercase block">Objetivo Combinado</span>
                <p className="text-lg font-black text-emerald-400 font-mono">$1,956 – $2,056</p>
                <span className="text-[10px] text-gray-300 font-mono block">Ingreso total mensual estimado</span>
              </div>

              <div className="bg-black/60 p-3.5 rounded-xl border border-purple-900/40 space-y-1">
                <span className="text-[10px] font-bold text-purple-400 uppercase block">Escalabilidad Futura</span>
                <p className="text-lg font-black text-purple-300 font-mono">$800 → $1,200+</p>
                <span className="text-[10px] text-purple-400 font-mono block">Con Partners y Packs de volumen</span>
              </div>
            </div>

            {/* TABLA DE SEGMENTACIÓN: VIP, CREW Y PARTNERS */}
            <div className="bg-black/50 p-4 rounded-xl border border-gray-800 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <span>💎 Matriz de Tarifas Especiales: VIP, Crew &amp; Partners</span>
                </h4>
                <span className="text-[10px] text-gray-400 font-mono">Precios por Bloques de Temas</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead>
                    <tr className="border-b border-gray-800 text-gray-400 text-[10px] uppercase">
                      <th className="py-2 px-3">Categoría</th>
                      <th className="py-2 px-3">3 Songs</th>
                      <th className="py-2 px-3">4 Songs</th>
                      <th className="py-2 px-3">5 Songs</th>
                      <th className="py-2 px-3">Condiciones / Especiales</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800/60 text-gray-200">
                    <tr className="hover:bg-gray-900/40">
                      <td className="py-2.5 px-3 font-bold text-amber-400">VIP A (Artistas Recurrentes)</td>
                      <td className="py-2.5 px-3">$375 USD</td>
                      <td className="py-2.5 px-3">$480 USD</td>
                      <td className="py-2.5 px-3">$575 USD</td>
                      <td className="py-2.5 px-3 text-emerald-400">Beats VIP: $50 USD</td>
                    </tr>
                    <tr className="hover:bg-gray-900/40">
                      <td className="py-2.5 px-3 font-bold text-blue-400">CREW B (Equipo Cercano)</td>
                      <td className="py-2.5 px-3">$300 USD</td>
                      <td className="py-2.5 px-3">$375 USD</td>
                      <td className="py-2.5 px-3">$450 USD</td>
                      <td className="py-2.5 px-3 text-gray-400">Mínimo 3 canciones</td>
                    </tr>
                    <tr className="hover:bg-gray-900/40">
                      <td className="py-2.5 px-3 font-bold text-purple-400">VIP Monthly</td>
                      <td className="py-2.5 px-3">—</td>
                      <td className="py-2.5 px-3 font-black text-purple-300">$460 USD</td>
                      <td className="py-2.5 px-3">—</td>
                      <td className="py-2.5 px-3 text-gray-400">Volumen en el mismo mes</td>
                    </tr>
                    <tr className="hover:bg-gray-900/40">
                      <td className="py-2.5 px-3 font-bold text-emerald-400">Partner Net (Productores Nivel 3)</td>
                      <td className="py-2.5 px-3">—</td>
                      <td className="py-2.5 px-3">—</td>
                      <td className="py-2.5 px-3">$675 USD</td>
                      <td className="py-2.5 px-3 text-amber-300">Neto Badlenz: $250 USD</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* SCRIPTS DE VENTA OFICIALES (1-TAP COPY PARA WHATSAPP / IG) */}
            <div className="space-y-2">
              <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                <span>💬 Scripts de Cierre Rápido (Toca para Copiar y Mandar por WhatsApp)</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  {
                    titulo: 'Cliente Nuevo (Explicación Estándar)',
                    script: 'Recording+Mix+Master son $200/canción ($130 con Promo Reapertura). Es el paquete completo para terminar el tema. Si tienes varias, tengo paquetes de volumen (3x$425, 4x$550) y Full Songs (producción desde cero) desde $350 – $400.'
                  },
                  {
                    titulo: 'Cierre de Volumen (3 Temas)',
                    script: 'Si vas a sacar tres, en vez de individuales te monto un paquete de volumen: las 3 por $425 (depósito 50% de $212.50).'
                  },
                  {
                    titulo: 'Manejo de Regateo',
                    script: 'Grabación+Mix+Master oficial está en $200 (o aprovecha los 6 cupos de reapertura a $130). Si trabajas varias, mejoro el precio por volumen: 3 temas por $425 o 4 por $550. ¿Cuántas canciones tienes?'
                  },
                  {
                    titulo: 'Oferta VIP / Crew',
                    script: 'Por nuestra relación/volumen, te dejo tarifa fija: 3 por $375, 4 por $480. Así organizamos el proyecto por bloques.'
                  }
                ].map((sc, i) => (
                  <div key={i} className="bg-black/60 p-3 rounded-xl border border-gray-800 flex flex-col justify-between gap-2">
                    <div>
                      <strong className="text-[11px] font-bold text-amber-400 block">{sc.titulo}</strong>
                      <p className="text-[11px] text-gray-300 italic mt-1 font-sans">"{sc.script}"</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(sc.script);
                        alert(`✓ Script "${sc.titulo}" copiado al portapapeles.`);
                      }}
                      className="self-end px-2.5 py-1 rounded bg-gray-900 hover:bg-gray-800 text-gray-300 hover:text-white border border-gray-700 text-[10px] font-bold uppercase transition cursor-pointer"
                    >
                      📋 Copiar Script
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
          {/* ZONA DE MANTENIMIENTO Y CONFIGURACIÓN DE BASE DE DATOS */}
        <div className="antigravity-glass border border-red-500/30 p-6 rounded-3xl shadow-2xl space-y-5 mt-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-gray-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-red-950/80 rounded-xl border border-red-800/80">
                <Lock className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <span>Zona de Mantenimiento & Inicialización de Producción</span>
                </h4>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  Usa esta función si deseas borrar permanentemente todos los datos de prueba y empezar a operar con clientes reales.
                </p>
              </div>
            </div>

            <button
              onClick={handleResetDemoData}
              className="bg-red-900 hover:bg-red-800 text-white font-bold px-4 py-2.5 rounded-lg text-xs uppercase tracking-wider transition border border-red-700 flex items-center gap-2 shrink-0 shadow-lg"
            >
              <Trash2 className="w-4 h-4 text-white" />
              <span>Vaciar Base de Datos Demo</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-[11px] text-gray-400 font-mono bg-[#111827] p-3.5 rounded-lg border border-gray-800">
            <div>• <strong>Clientes Registrados:</strong> {clientes.length}</div>
            <div>• <strong>Reservas / Pases Demo:</strong> {reservas.length}</div>
            <div>• <strong>Estado DB:</strong> {clientes.length === 0 && reservas.length === 0 ? '🟢 Limpia (Producción)' : '🟡 Con Datos Demo'}</div>
          </div>
        </div>
      </div>
    )}

      {/* --- MODALES --- */}
      {/* --- MODALES --- */}

      {/* MODAL EDICIÓN RESERVA */}
      {reservaEditando && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#1e1e1e] border border-gray-800 rounded-xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-gray-800 pb-3">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Editar Pase de Estudio: <span className="text-amber-500 font-mono">{reservaEditando.id}</span>
              </h3>
              <button onClick={() => setReservaEditando(null)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateReserva} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-400 font-bold mb-1">Nombre Artístico</label>
                  <input
                    type="text"
                    required
                    className="w-full bg-[#111827] border border-gray-800 text-white p-2 rounded outline-none"
                    value={reservaEditando.nombreArtistico}
                    onChange={e => setReservaEditando({ ...reservaEditando, nombreArtistico: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-gray-400 font-bold mb-1">Método de Pago</label>
                  <select
                    className="w-full bg-[#111827] border border-gray-800 text-white p-2 rounded outline-none font-bold text-amber-500"
                    value={reservaEditando.metodoPago}
                    onChange={e => setReservaEditando({ ...reservaEditando, metodoPago: e.target.value as any })}
                  >
                    <option value="Zelle">Zelle</option>
                    <option value="ATH Movil">ATH Movil</option>
                    <option value="PayPal">PayPal</option>
                    <option value="Efectivo">Efectivo</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-gray-400 font-bold mb-1">Fecha</label>
                  <input
                    type="date"
                    required
                    className="w-full bg-[#111827] border border-gray-800 text-white p-2 rounded outline-none font-mono"
                    value={reservaEditando.fecha}
                    onChange={e => setReservaEditando({ ...reservaEditando, fecha: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-gray-400 font-bold mb-1">Hora Entrada</label>
                  <input
                    type="text"
                    required
                    className="w-full bg-[#111827] border border-gray-800 text-white p-2 rounded outline-none"
                    value={reservaEditando.horaInicio}
                    onChange={e => setReservaEditando({ ...reservaEditando, horaInicio: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-gray-400 font-bold mb-1">Hora Salida</label>
                  <input
                    type="text"
                    required
                    className="w-full bg-[#111827] border border-gray-800 text-white p-2 rounded outline-none"
                    value={reservaEditando.horaSalida}
                    onChange={e => setReservaEditando({ ...reservaEditando, horaSalida: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 border-y border-gray-800 py-3 my-2">
                <div>
                  <label className="block text-gray-400 font-bold mb-1">Inversión Subtotal</label>
                  <input
                    type="number"
                    required
                    className="w-full bg-[#111827] border border-gray-800 text-white p-2 rounded outline-none font-bold"
                    value={reservaEditando.subtotal}
                    onChange={e => setReservaEditando({ ...reservaEditando, subtotal: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="block text-gray-400 font-bold mb-1">Depósito Pagado</label>
                  <input
                    type="number"
                    required
                    className="w-full bg-[#111827] border border-gray-800 text-emerald-400 p-2 rounded outline-none font-bold"
                    value={reservaEditando.deposito}
                    onChange={e => setReservaEditando({ ...reservaEditando, deposito: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="block text-gray-400 font-bold mb-1">Balance Pendiente</label>
                  <div className="w-full bg-gray-950 border border-gray-800 text-red-400 p-2 rounded font-black">
                    ${Math.max(0, Number(reservaEditando.subtotal) - Number(reservaEditando.deposito))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-400 font-bold mb-1">Estado de la Reserva</label>
                  <select
                    className="w-full bg-[#111827] border border-gray-800 text-white p-2.5 rounded outline-none font-bold uppercase tracking-wider"
                    value={reservaEditando.estado}
                    onChange={e => setReservaEditando({ ...reservaEditando, estado: e.target.value as any })}
                  >
                    <option value="Pendiente">Pendiente</option>
                    <option value="Confirmada">Confirmada</option>
                    <option value="En Proceso">En Proceso</option>
                    <option value="Completada">Completada</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-400 font-bold mb-1">Estado del Depósito</label>
                  <select
                    className="w-full bg-[#111827] border border-gray-800 text-white p-2.5 rounded outline-none font-bold uppercase tracking-wider"
                    value={reservaEditando.depositoEstado || 'pendiente'}
                    onChange={e => setReservaEditando({ ...reservaEditando, depositoEstado: e.target.value as any })}
                  >
                    <option value="pendiente">Pendiente (No dado)</option>
                    <option value="depositado">Depositado ✓</option>
                    <option value="paga_en_sesion">Paga en sesión</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-red-700 hover:bg-red-600 text-white font-bold py-3 rounded-lg text-xs uppercase tracking-widest transition"
              >
                Guardar Cambios en Base de Datos
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL EDICIÓN CLIENTE */}
      {clienteEditando && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#1e1e1e] border border-gray-800 rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-gray-800 pb-3">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Editar Datos de Artista: <span className="text-red-500 font-mono">{clienteEditando.id}</span>
              </h3>
              <button onClick={() => setClienteEditando(null)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateCliente} className="space-y-4 text-xs">
              <div>
                <label className="block text-gray-400 font-bold mb-1">Nombre Artístico</label>
                <input
                  type="text"
                  required
                  className="w-full bg-[#111827] border border-gray-800 text-white p-2 rounded outline-none"
                  value={clienteEditando.nombreArtistico}
                  onChange={e => setClienteEditando({ ...clienteEditando, nombreArtistico: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-gray-400 font-bold mb-1">Nombre Real / Legal</label>
                <input
                  type="text"
                  required
                  className="w-full bg-[#111827] border border-gray-800 text-white p-2 rounded outline-none"
                  value={clienteEditando.nombreReal}
                  onChange={e => setClienteEditando({ ...clienteEditando, nombreReal: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-gray-400 font-bold mb-1">Email de Contacto</label>
                <input
                  type="email"
                  required
                  className="w-full bg-[#111827] border border-gray-800 text-white p-2 rounded outline-none font-mono"
                  value={clienteEditando.email}
                  onChange={e => setClienteEditando({ ...clienteEditando, email: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-400 font-bold mb-1">Teléfono</label>
                  <input
                    type="text"
                    required
                    className="w-full bg-[#111827] border border-gray-800 text-white p-2 rounded outline-none"
                    value={clienteEditando.telefono}
                    onChange={e => setClienteEditando({ ...clienteEditando, telefono: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-gray-400 font-bold mb-1">Instagram (@)</label>
                  <input
                    type="text"
                    required
                    className="w-full bg-[#111827] border border-gray-800 text-white p-2 rounded outline-none font-semibold text-amber-500"
                    value={clienteEditando.instagram}
                    onChange={e => setClienteEditando({ ...clienteEditando, instagram: e.target.value })}
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-red-700 hover:bg-red-600 text-white font-bold py-3 rounded-lg text-xs uppercase tracking-widest transition"
              >
                Actualizar Datos de Artista
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CREACIÓN RESERVA MANUAL */}
      {mostrarCrearReserva && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#1e1e1e] border border-gray-800 rounded-xl max-w-xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-gray-800 pb-3">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Plus className="w-5 h-5 text-red-500" />
                <span>Registrar Nueva Sesión Manualmente</span>
              </h3>
              <button onClick={() => setMostrarCrearReserva(false)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCrearReservaManual} className="space-y-4 text-xs">
              
              <div className="p-3 bg-red-950/20 rounded border border-red-900/40 text-[10px] text-red-200">
                🚨 Registra las llamadas telefónicas o acuerdos directos aquí. Los datos del artista se indexarán automáticamente y se creará el slot del calendario.
              </div>

              {/* DATOS ARTISTA */}
              <div className="space-y-2 border-b border-gray-800 pb-3">
                <h4 className="font-bold text-gray-300 uppercase tracking-widest text-[10px]">1. Identificación del Artista</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-gray-400 font-semibold mb-1">Nombre Artístico / Proyecto</label>
                    <input
                      type="text"
                      required
                      placeholder="Ej: BADLENZ"
                      className="w-full bg-[#111827] border border-gray-800 text-white p-2 rounded outline-none"
                      value={nuevaReserva.nombreArtistico}
                      onChange={e => setNuevaReserva({ ...nuevaReserva, nombreArtistico: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 font-semibold mb-1">Nombre Legal / Apellido</label>
                    <input
                      type="text"
                      required
                      placeholder="Ej: Carlos Mendoza"
                      className="w-full bg-[#111827] border border-gray-800 text-white p-2 rounded outline-none"
                      value={nuevaReserva.nombreReal}
                      onChange={e => setNuevaReserva({ ...nuevaReserva, nombreReal: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-1">
                    <label className="block text-gray-400 font-semibold mb-1">Teléfono</label>
                    <input
                      type="text"
                      required
                      placeholder="+52 55..."
                      className="w-full bg-[#111827] border border-gray-800 text-white p-2 rounded outline-none"
                      value={nuevaReserva.telefono}
                      onChange={e => setNuevaReserva({ ...nuevaReserva, telefono: e.target.value })}
                    />
                  </div>
                  <div className="col-span-1">
                    <label className="block text-gray-400 font-semibold mb-1">Instagram (@)</label>
                    <input
                      type="text"
                      placeholder="@badlenz"
                      className="w-full bg-[#111827] border border-gray-800 text-white p-2 rounded outline-none"
                      value={nuevaReserva.instagram}
                      onChange={e => setNuevaReserva({ ...nuevaReserva, instagram: e.target.value })}
                    />
                  </div>
                  <div className="col-span-1">
                    <label className="block text-gray-400 font-semibold mb-1">Email (Opcional)</label>
                    <input
                      type="email"
                      placeholder="contacto@estudio.com"
                      className="w-full bg-[#111827] border border-gray-800 text-white p-2 rounded outline-none font-mono"
                      value={nuevaReserva.email}
                      onChange={e => setNuevaReserva({ ...nuevaReserva, email: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* DETALLES SLOT */}
              <div className="space-y-2 border-b border-gray-800 pb-3">
                <h4 className="font-bold text-gray-300 uppercase tracking-widest text-[10px]">2. Fecha, Horarios e Inversión</h4>
                <div className="grid grid-cols-4 gap-2">
                  <div className="col-span-2">
                    <label className="block text-gray-400 font-semibold mb-1">Fecha</label>
                    <input
                      type="date"
                      required
                      className="w-full bg-[#111827] border border-gray-800 text-white p-2 rounded outline-none font-mono font-bold"
                      value={nuevaReserva.fecha}
                      onChange={e => setNuevaReserva({ ...nuevaReserva, fecha: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 font-semibold mb-1">H. Entrada</label>
                    <input
                      type="text"
                      required
                      placeholder="14:00"
                      className="w-full bg-[#111827] border border-gray-800 text-white p-2 rounded outline-none"
                      value={nuevaReserva.horaInicio}
                      onChange={e => setNuevaReserva({ ...nuevaReserva, horaInicio: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 font-semibold mb-1">H. Salida</label>
                    <input
                      type="text"
                      required
                      placeholder="18:00"
                      className="w-full bg-[#111827] border border-gray-800 text-white p-2 rounded outline-none"
                      value={nuevaReserva.horaSalida}
                      onChange={e => setNuevaReserva({ ...nuevaReserva, horaSalida: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-2">
                  <div>
                    <label className="block text-gray-400 font-semibold mb-1">Horas Totales</label>
                    <input
                      type="number"
                      required
                      value={nuevaReserva.totalHoras}
                      onChange={e => handleAutoCalcSubtotal(Number(e.target.value))}
                      className="w-full bg-[#111827] border border-gray-800 text-white p-2 rounded outline-none font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 font-semibold mb-1">Método de Pago</label>
                    <select
                      className="w-full bg-[#111827] border border-gray-800 text-white p-2 rounded outline-none font-semibold text-amber-500"
                      value={nuevaReserva.metodoPago}
                      onChange={e => setNuevaReserva({ ...nuevaReserva, metodoPago: e.target.value as any })}
                    >
                      <option value="Zelle">Zelle</option>
                      <option value="ATH Movil">ATH Movil</option>
                      <option value="PayPal">PayPal</option>
                      <option value="Efectivo">Efectivo</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-gray-400 font-semibold mb-1">Servicios (Selección Rápida)</label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {['Grabación', 'Mezcla', 'Producción', 'Masterización'].map(serv => {
                        const active = nuevaReserva.servicios.includes(serv);
                        return (
                          <button
                            type="button"
                            key={serv}
                            onClick={() => handleServicioToggle(serv)}
                            className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase border transition ${
                              active ? 'bg-red-950 text-red-400 border-red-800/60' : 'bg-[#111827] text-gray-500 border-gray-800'
                            }`}
                          >
                            {serv}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* VALORES MONETARIOS MANUALES */}
              <div className="p-3 bg-black/60 rounded-xl border border-gray-800">
                <h4 className="font-bold text-gray-300 uppercase tracking-widest text-[10px] mb-2">3. Configurar Costos</h4>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-gray-400 font-semibold mb-1">Subtotal Acordado ($)</label>
                    <input
                      type="number"
                      required
                      value={nuevaReserva.subtotal}
                      onChange={e => setNuevaReserva({ ...nuevaReserva, subtotal: Number(e.target.value), balance: Math.max(0, Number(e.target.value) - nuevaReserva.deposito) })}
                      className="w-full bg-[#111827] border border-gray-800 text-white p-2 rounded font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 font-semibold mb-1">Depósito Pagado ($)</label>
                    <input
                      type="number"
                      required
                      value={nuevaReserva.deposito}
                      onChange={e => setNuevaReserva({ ...nuevaReserva, deposito: Number(e.target.value), balance: Math.max(0, nuevaReserva.subtotal - Number(e.target.value)) })}
                      className="w-full bg-[#111827] border border-gray-800 text-emerald-400 p-2 rounded font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 font-semibold mb-1">Balance Pendiente ($)</label>
                    <div className="w-full bg-gray-950 border border-gray-800 text-red-400 p-2 rounded font-black">
                      ${Math.max(0, Number(nuevaReserva.subtotal) - Number(nuevaReserva.deposito))}
                    </div>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-red-700 hover:bg-red-600 text-white font-black py-3 rounded-lg text-xs uppercase tracking-widest transition"
              >
                Confirmar y Agendar Sesión
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL VER FIRMA DIGITAL */}
      {firmaModalUrl && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#1e1e1e] border border-gray-800 rounded-xl max-w-md w-full p-5 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-gray-800 pb-3">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <span>🖋️</span> Firma Digital Verificada
              </h3>
              <button
                onClick={() => setFirmaModalUrl(null)}
                className="text-gray-400 hover:text-white transition p-1 rounded-full hover:bg-gray-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <p className="text-[11px] text-gray-400 leading-relaxed">
              La siguiente firma digital fue estampada por el artista en conformidad con el contrato de adhesión de <strong>La Facultad Studio</strong>:
            </p>

            <div className="bg-white/5 border border-gray-800 rounded-lg p-4 flex items-center justify-center">
              <img
                src={firmaModalUrl}
                alt="Firma Digital Artista"
                referrerPolicy="no-referrer"
                className="max-h-32 object-contain filter invert opacity-90 brightness-200"
              />
            </div>

            <div className="bg-emerald-950/20 border border-emerald-900/30 p-2.5 rounded text-emerald-400 text-[10px] flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Autenticidad digital encriptada en la base de datos local de sesiones.</span>
            </div>

            <button
              onClick={() => setFirmaModalUrl(null)}
              className="w-full bg-gray-800 hover:bg-gray-700 border border-gray-700 text-white font-bold py-2 rounded text-xs uppercase tracking-wider transition"
            >
              Cerrar Vista
            </button>
          </div>
        </div>
      )}

      {/* MODAL DE VISUALIZACIÓN DE RECIBO DE ATH MÓVIL */}
      {reciboModalUrl && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-[#1e1e1e] border border-gray-700 w-full max-w-lg rounded-xl p-5 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-gray-800 pb-3">
              <div className="flex items-center gap-2">
                <Camera className="w-5 h-5 text-emerald-400" />
                <h4 className="text-sm font-black text-white uppercase tracking-wider">
                  Comprobante ATH Móvil • {reciboModalUrl.artista}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setReciboModalUrl(null)}
                className="text-gray-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            {reciboModalUrl.ref && (
              <div className="bg-black/50 p-2.5 rounded border border-gray-800 text-xs font-mono flex justify-between items-center">
                <span className="text-gray-400">Número de Referencia / Confirmación:</span>
                <span className="text-emerald-400 font-bold">{reciboModalUrl.ref}</span>
              </div>
            )}

            <div className="bg-black/70 border border-gray-800 rounded-lg p-2 flex items-center justify-center max-h-96 overflow-auto">
              <img
                src={reciboModalUrl.url}
                alt="Comprobante ATH Móvil"
                className="max-h-80 w-auto object-contain rounded"
              />
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setReciboModalUrl(null)}
                className="w-full bg-gray-800 hover:bg-gray-700 border border-gray-700 text-white font-bold py-2 rounded text-xs uppercase tracking-wider transition"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}



    </div>
  );
}
