import React, { useState, useEffect, useMemo, useRef } from 'react';
import { guardarCliente, guardarReserva, actualizarReserva, Reserva, getPromoSlotsCount, getStudioConfig, StudioConfig } from '../services/db';
import { CalendarioSection } from './Calendario/CalendarioSection';
import { SlotDisponibilidad, obtenerDisponibilidadMes } from '../services/schedule';
import { UbicacionPuertoRico } from './UbicacionPuertoRico';
import { AvisoEstudioCerrado } from './AvisoEstudioCerrado';
import { getStudioLiveStatus, subscribeToStudioStatus, StudioLiveStatus } from '../services/studioStatus';
import { jsPDF } from 'jspdf';
import { ScrollReveal } from './ScrollReveal';
import { BadlenzLogo, LFCrestLogo } from './BrandingLogos';
import { StudioGuaranteesBento } from './StudioGuaranteesBento';
import AudioShowcaseAB from './AudioShowcaseAB';
import { 
  UploadCloud, 
  Music, 
  Trash2, 
  Youtube, 
  DollarSign, 
  Play, 
  Pause, 
  CheckCircle, 
  Clock, 
  Flame, 
  RefreshCw, 
  AlertCircle,
  PenTool,
  FileText,
  Download,
  Calendar,
  Image as ImageIcon,
  Copy,
  ExternalLink,
  Sparkles,
  Check,
  MapPin,
  Smartphone,
  Timer,
  ShieldAlert,
  Camera,
  RotateCcw,
  HelpCircle,
  Info,
  Headphones,
  MessageCircle,
  Compass,
  Navigation,
  Sliders,
  FolderArchive,
  User,
  X,
  Lock
} from 'lucide-react';

const format12h = (timeStr: string) => {
  if (!timeStr) return '';
  const [hStr, mStr] = timeStr.split(':');
  const h = parseInt(hStr, 10);
  if (isNaN(h)) return timeStr;
  const isPm = h >= 12;
  const displayH = h % 12 === 0 ? 12 : h % 12;
  const ampm = isPm ? 'PM' : 'AM';
  return `${String(displayH).padStart(2, '0')}:${mStr} ${ampm}`;
};

const getDuracionHoras = (start: string, end: string) => {
  if (!start || !end) return 5;
  const [startH, startM] = start.split(':').map(Number);
  const [endH, endM] = end.split(':').map(Number);
  let diff = (endH * 60 + endM) - (startH * 60 + startM);
  if (diff < 0) diff += 24 * 60;
  return Math.max(1, Math.round(diff / 60));
};

const generarBloquesDeSesion = (_rangoHoras?: string): { label: string; desc: string; start: string; end: string }[] => {
  return [
    { label: 'Bloque 1 · Tarde Oficial', desc: '01:00 PM - 05:00 PM (4 Horas)', start: '13:00', end: '17:00' },
    { label: 'Bloque 2 · Noche Oficial', desc: '06:00 PM - 10:00 PM (4 Horas)', start: '18:00', end: '22:00' },
  ];
};

interface PortalClientesProps {
  slotInicial?: SlotDisponibilidad | null;
  onNavigateToMuestras?: () => void;
}

export default function PortalClientes({ slotInicial, onNavigateToMuestras }: PortalClientesProps) {
  // Estado local para capturar el formulario estructurado
  const [formData, setFormData] = useState({
    // 1. Información Personal y Artística
    nombreReal: '',
    nombreArtistico: '',
    redesSociales: '',
    telefono: '',
    email: '',

    // 2. Detalles del Proyecto
    servicios: {
      grabacion: true,
      instrumental: false,
      mezclaMaster: true,
      produccionCompleta: false
    },
    incluirBeatExclusivoBadlenz: false,
    tipoInstrumental: 'youtube', // 'email' | 'youtube' | 'pendrive' | 'nueva'
    linkYoutube: '',
    numeroCanales: '1-8 Pistas (Voz + Beat)' as string,
    tempoBpm: '120 BPM' as string,

    // Método de Pago
    metodoPago: 'ATH Movil' as 'Efectivo' | 'ATH Movil' | 'PayPal' | 'Zelle',

    // 3. Referencias Musicales
    referencias: '',

    // 4. Aceptación de Términos (Se confirman y firman formalmente en el Pase VIP o en cabina)
    aceptaTerminos: true,

    // Fecha y Horario (Bloque Oficial de 4 Horas Badlenz)
    fecha: new Date().toISOString().split('T')[0],
    horaInicio: '13:00',
    horaSalida: '17:00'
  });

  // Proceso de Reserva Escalonado en 3 Pasos Limpios
  const [checkoutStep, setCheckoutStep] = useState<1 | 2 | 3>(1);
  const [athNumReferenciaInput, setAthNumReferenciaInput] = useState<string>('');
  const [athComprobanteUrl, setAthComprobanteUrl] = useState<string>('');
  const [athComprobanteNombre, setAthComprobanteNombre] = useState<string>('');

  const handleAthScreenshotUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showToast('Por favor sube una imagen válida (JPG o PNG).', 'warning');
      return;
    }
    setAthComprobanteNombre(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setAthComprobanteUrl(base64);
      showToast('📸 ¡Captura de ATH Móvil adjunta con éxito!', 'success');
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveAthScreenshot = () => {
    setAthComprobanteUrl('');
    setAthComprobanteNombre('');
  };

  const [selectedPackage, setSelectedPackage] = useState<'promo' | 'pro' | 'full' | 'mezcla' | 'express' | 'combo_3' | 'combo_4' | 'prod_cuarto' | 'prod_artista' | 'prod_eng' | null>('promo');
  const [fechasSeleccionadasBloque, setFechasSeleccionadasBloque] = useState<string[]>(['2026-08-10']);
  const [esReservaEnBloque, setEsReservaEnBloque] = useState<boolean>(false);
  const [roughAudioPlaying, setRoughAudioPlaying] = useState<boolean>(false);
  const [promoSlotsInfo, setPromoSlotsInfo] = useState<{ total: number; reservados: number; disponibles: number }>(() => getPromoSlotsCount());
  const [studioConfig, setStudioConfig] = useState<StudioConfig>(() => getStudioConfig());
  const [studioLiveStatus, setStudioLiveStatus] = useState<StudioLiveStatus>(() => getStudioLiveStatus());
  const [showRegularBookingAnyway, setShowRegularBookingAnyway] = useState(false);
  const [tarifasCategory, setTarifasCategory] = useState<'populares' | 'combos' | 'productores'>('populares');

  useEffect(() => {
    const unsub = subscribeToStudioStatus((st) => {
      setStudioLiveStatus(st);
    });
    return unsub;
  }, []);

  const isStudioTemporarilyClosed = ['vacaciones', 'mantenimiento', 'remodelacion'].includes(studioLiveStatus.estado);

  useEffect(() => {
    const updateAllState = () => {
      setPromoSlotsInfo(getPromoSlotsCount());
      setStudioConfig(getStudioConfig());
    };
    updateAllState();
    window.addEventListener('la_facultad_promo_slots_updated', updateAllState);
    window.addEventListener('la_facultad_config_updated', updateAllState);
    window.addEventListener('storage', updateAllState);
    return () => {
      window.removeEventListener('la_facultad_promo_slots_updated', updateAllState);
      window.removeEventListener('la_facultad_config_updated', updateAllState);
      window.removeEventListener('storage', updateAllState);
    };
  }, []);

  useEffect(() => {
    if (slotInicial) {
      const diaStr = String(slotInicial.diaNumero).padStart(2, '0');
      const fechaSeleccionada = `2026-08-${diaStr}`;
      const horaIn = slotInicial.horarioPermitido ? slotInicial.horarioPermitido.split(' - ')[0] : '13:00';
      const horaOut = slotInicial.horarioPermitido ? slotInicial.horarioPermitido.split(' - ')[1] : '17:00';
      setFormData(prev => ({
        ...prev,
        fecha: fechaSeleccionada,
        horaInicio: horaIn,
        horaSalida: horaOut
      }));
    }
  }, [slotInicial]);

  const [reservaActiva, setReservaActiva] = useState<Reserva | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [archivosSubidos, setArchivosSubidos] = useState<{ nombre: string, tamano: string }[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [playingFileIndex, setPlayingFileIndex] = useState<number | null>(null);

  // Estados de Operaciones: Comprobante ATH Móvil y Temporizador 30 min
  const [comprobanteAthFile, setComprobanteAthFile] = useState<string | null>(null);
  const [comprobanteAthNombre, setComprobanteAthNombre] = useState<string>('');
  const [numReferenciaAth, setNumReferenciaAth] = useState<string>('');
  const [tiempoRestanteSegundos, setTiempoRestanteSegundos] = useState<number>(30 * 60); // 30 minutos = 1800s
  const [comprobanteEnviadoExito, setComprobanteEnviadoExito] = useState(false);

  // Estados Estrategia 2026: VIP/Crew Descuentos y Referral
  const [codigoVipInput, setCodigoVipInput] = useState<string>('');
  const [vipDescuentoAplicado, setVipDescuentoAplicado] = useState<'VIP' | 'CREW' | null>(null);

  // Notificaciones modernas en pantalla y errores de validación sin bloquear la UI
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'warning' | 'info' | 'error' } | null>(null);
  const [stepErrors, setStepErrors] = useState<{ nombreArtistico?: string; telefono?: string }>({});

  const showToast = (message: string, type: 'success' | 'warning' | 'info' | 'error' = 'info') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(curr => (curr?.message === message ? null : curr));
    }, 4500);
  };

  // Temporizador de 30 minutos activo al generar la reserva pendiente
  useEffect(() => {
    if (!reservaActiva) return;
    if (reservaActiva.estado === 'Confirmada') return;

    // Calcular segundos restantes basados en creadoEn
    const creadoTimestamp = reservaActiva.creadoEn || Date.now();
    const tiempoExpiracion = creadoTimestamp + 30 * 60 * 1000;

    const interval = setInterval(() => {
      const ahora = Date.now();
      const dif = Math.max(0, Math.floor((tiempoExpiracion - ahora) / 1000));
      setTiempoRestanteSegundos(dif);
    }, 1000);

    return () => clearInterval(interval);
  }, [reservaActiva]);

  // Manejador para subir foto/captura del recibo ATH Móvil
  const handleUploadAthReceipt = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) {
      showToast('La imagen no debe superar los 8MB.', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setComprobanteAthFile(base64);
      setComprobanteAthNombre(file.name);
    };
    reader.readAsDataURL(file);
  };

  // Digital Signature Canvas States & Ref
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSigned, setHasSigned] = useState(false);

  // Initialize canvas lines & color
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Set drawing styles
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#3b82f6'; // Deep artistic digital blue
    ctx.lineWidth = 3;
  }, []);

  const getCoordinates = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    
    let clientX, clientY;
    if ('touches' in e) {
      if (e.touches.length === 0) return null;
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    
    // Scaling relative to canvas resolution
    const x = ((clientX - rect.left) / rect.width) * canvas.width;
    const y = ((clientY - rect.top) / rect.height) * canvas.height;
    return { x, y };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const coords = getCoordinates(e);
    if (!coords) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.beginPath();
    ctx.moveTo(coords.x, coords.y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    e.preventDefault();
    const coords = getCoordinates(e);
    if (!coords) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();
    setHasSigned(true);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSigned(false);
  };

  const formatMoney = (val: number): string => {
    return `$${Number(val).toFixed(2)}`;
  };

  // Real-time calculated budget estimation based on selected services and hours
  const { subtotal, deposito, balance, duracionHoras, itemsDesglose } = useMemo(() => {
    const durH = getDuracionHoras(formData.horaInicio, formData.horaSalida);

    let baseSub = 0;
    let baseDep = 0;
    let baseBal = 0;
    let baseItems: { name: string; price: number; isDiscount?: boolean }[] = [];

    // 0. Paquete Promo Reapertura Badlenz 2026 ($130 USD) - Canción Individual
    const isPromoPkg = selectedPackage === 'promo' ||
      (formData.servicios.grabacion && formData.servicios.mezclaMaster && !formData.servicios.instrumental && !formData.servicios.produccionCompleta && durH === 4);

    if (isPromoPkg) {
      baseSub = 130;
      baseDep = 50; // $50 obligatorio por canción individual según tarifario oficial 2026
      baseBal = 80;
      baseItems = [
        { name: '🎤 Grabación de Voces (4h en cabina Badlenz)', price: 120 },
        { name: '🎚️ Mezcla & Master Comercial Completo', price: 80 },
        { name: '🔥 Descuento Promo Reapertura 35% OFF (Cupo oficial 1 de 6)', price: -70, isDiscount: true },
      ];
    } else if (selectedPackage === 'pro' || (formData.servicios.grabacion && formData.servicios.mezclaMaster && !formData.servicios.instrumental && !formData.servicios.produccionCompleta && durH === 5)) {
      // 1. Paquete Más Popular: Grabación, Mezcla y Master ($200 USD)
      baseSub = 200;
      baseDep = 50; // $50 por canción individual
      baseBal = 150;
      baseItems = [
        { name: '🎤 Grabación de Voces Pro (4-5h en cabina)', price: 150 },
        { name: '🎚️ Mezcla & Master Comercial', price: 100 },
        { name: '🔥 Descuento Combo Oficial "Grabación + Mix + Master"', price: -50, isDiscount: true },
      ];
    } else if (selectedPackage === 'full' || (formData.servicios.instrumental && formData.servicios.grabacion && formData.servicios.mezclaMaster && durH >= 4)) {
      // 2. Paquete Producción Integral (Full Song) ($350 - $400 USD)
      baseSub = 350;
      baseDep = 175; // 50% para paquete integral
      baseBal = 175;
      baseItems = [
        { name: '🎹 Beat Exclusivo Prod. Badlenz', price: 150 },
        { name: '🎤 Grabación de Voces (4-5h en cabina)', price: 150 },
        { name: '🎚️ Mezcla & Master Comercial', price: 100 },
        { name: '★ Descuento Combo "Producción Integral"', price: -50, isDiscount: true },
      ];
    } else if (selectedPackage === 'mezcla' || (!formData.servicios.grabacion && !formData.servicios.instrumental && formData.servicios.mezclaMaster && !formData.servicios.produccionCompleta)) {
      // 3. Paquete Mezcla y Master ($125 USD)
      baseSub = 125;
      baseDep = 50; // $50 individual
      baseBal = 75;
      baseItems = [
        { name: '🎚️ Mezcla Profesional Multitrack & Afinación', price: 85 },
        { name: '🔊 Masterización Comercial (Estándar Streaming)', price: 40 },
      ];
    } else if (selectedPackage === 'express' || (formData.servicios.grabacion && !formData.servicios.mezclaMaster && !formData.servicios.instrumental && !formData.servicios.produccionCompleta && durH === 3)) {
      // 4. Paquete Express: Grabación & Pre-mezcla ($165 USD)
      baseSub = 165;
      baseDep = 50;
      baseBal = 115;
      baseItems = [
        { name: '🎤 Grabación & Pre-mezcla (3h de cabina)', price: 165 }
      ];
    } else if (selectedPackage === 'combo_3') {
      // 5. COMBO 3 CANCIONES ($425 USD regular | $375 VIP | $300 CREW)
      let comboPrice = 425;
      let desc = -175;
      if (vipDescuentoAplicado === 'VIP') {
        comboPrice = 375;
        desc = -225;
      } else if (vipDescuentoAplicado === 'CREW') {
        comboPrice = 300;
        desc = -300;
      }
      baseSub = comboPrice;
      baseDep = Math.round(comboPrice * 0.5);
      baseBal = comboPrice - baseDep;
      baseItems = [
        { name: `🎵 3 Canciones Completas (Grabación, Mezcla & Master ${vipDescuentoAplicado ? `[Tarifa ${vipDescuentoAplicado}]` : ''})`, price: 600 },
        { name: '★ Ahorro Especial Pack 3 Canciones', price: desc, isDiscount: true }
      ];
    } else if (selectedPackage === 'combo_4') {
      // 6. COMBO 4 CANCIONES ($550 USD regular | $480 VIP | $375 CREW)
      let comboPrice = 550;
      let desc = -250;
      if (vipDescuentoAplicado === 'VIP') {
        comboPrice = 480;
        desc = -320;
      } else if (vipDescuentoAplicado === 'CREW') {
        comboPrice = 375;
        desc = -425;
      }
      baseSub = comboPrice;
      baseDep = Math.round(comboPrice * 0.5);
      baseBal = comboPrice - baseDep;
      baseItems = [
        { name: `🎵 4 Canciones Completas (Grabación, Mezcla & Master ${vipDescuentoAplicado ? `[Tarifa ${vipDescuentoAplicado}]` : ''})`, price: 800 },
        { name: '★ Ahorro Especial Pack 4 Canciones', price: desc, isDiscount: true }
      ];
    } else if (selectedPackage === 'prod_cuarto') {
      // 7. SISTEMA PRODUCTORES: SOLO CUARTO ($35/h - Mínimo 3h = $105)
      const hrs = Math.max(3, durH);
      baseSub = hrs * 35;
      baseDep = 50;
      baseBal = baseSub - baseDep;
      baseItems = [
        { name: `🎧 Solo Cuarto / Beatmaking (${hrs}h @ $35/h)`, price: baseSub }
      ];
    } else if (selectedPackage === 'prod_artista') {
      // 8. SISTEMA PRODUCTORES: PRODUCTOR + ARTISTA ($50/h - Mínimo 2h = $100)
      const hrs = Math.max(2, durH);
      baseSub = hrs * 50;
      baseDep = 50;
      baseBal = baseSub - baseDep;
      baseItems = [
        { name: `🎙️ Cabina + Control Room para Productor (${hrs}h @ $50/h)`, price: baseSub }
      ];
    } else if (selectedPackage === 'prod_eng') {
      // 9. SISTEMA PRODUCTORES: PRODUCTOR + ENGINEERING ($75/h - Asistencia Badlenz)
      const hrs = Math.max(2, durH);
      baseSub = hrs * 75;
      baseDep = 50;
      baseBal = baseSub - baseDep;
      baseItems = [
        { name: `🎛️ Sesión de Grabación Asistida con Badlenz (${hrs}h @ $75/h)`, price: baseSub }
      ];
    } else {
      // 8. Modo Personalizado (Custom)
      let sub = 0;
      const items: { name: string; price: number; isDiscount?: boolean }[] = [];

      if (formData.servicios.produccionCompleta) {
        sub += 350;
        items.push({ name: '📀 Producción Integral Completa', price: 350 });
      } else {
        if (formData.servicios.grabacion) {
          const grabPrice = durH * 30;
          sub += grabPrice;
          items.push({ name: `🎤 Grabación (${durH}h @ $30/h)`, price: grabPrice });
        }
        if (formData.servicios.instrumental) {
          sub += 150;
          items.push({ name: '🎹 Beat / Instrumental Original', price: 150 });
        }
        if (formData.servicios.mezclaMaster) {
          sub += 100;
          items.push({ name: '🎚️ Mezcla & Mastering', price: 100 });
        }
      }

      baseSub = sub;
      baseDep = Math.round(sub * 0.5 * 100) / 100;
      baseBal = Math.round((sub - baseDep) * 100) / 100;
      baseItems = items;
    }

    // SI EL ARTISTA SELECCIONÓ EL ADD-ON DE BEAT EXCLUSIVO BADLENZ (ESTILO BAD BUNNY / REGGAETÓN)
    let finalSub = baseSub;
    let finalDep = baseDep;
    let finalBal = baseBal;
    let finalItems = [...baseItems];

    if (formData.incluirBeatExclusivoBadlenz) {
      finalSub += 125;
      finalDep = Math.round((finalDep + 62.5) * 100) / 100;
      finalBal = Math.round((finalSub - finalDep) * 100) / 100;
      finalItems.push(
        { name: '🎹 Beat Exclusivo Prod. Badlenz (Estilo Bad Bunny / Reggaetón)', price: 175 },
        { name: '🔥 Descuento Combo Beat Exclusivo (-$50)', price: -50, isDiscount: true }
      );
    }

    return {
      subtotal: finalSub,
      deposito: finalDep,
      balance: finalBal,
      duracionHoras: durH,
      itemsDesglose: finalItems
    };
  }, [selectedPackage, formData.servicios, formData.horaInicio, formData.horaSalida, formData.incluirBeatExclusivoBadlenz, vipDescuentoAplicado]);

  const [copiedAthAmount, setCopiedAthAmount] = useState(false);
  const [copiedAthPhone, setCopiedAthPhone] = useState(false);

  const handleCopyAthAmount = () => {
    navigator.clipboard.writeText(String(deposito));
    setCopiedAthAmount(true);
    setTimeout(() => setCopiedAthAmount(false), 2000);
  };

  const handleCopyAthPhone = () => {
    navigator.clipboard.writeText('7872408627');
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try { navigator.vibrate([40, 30, 40]); } catch (e) { /* ignore */ }
    }
    setCopiedAthPhone(true);
    showToast('¡Número de ATH Móvil copiado! (787) 240-8627', 'success');
    setTimeout(() => setCopiedAthPhone(false), 2500);
  };

  const handleSelectPackage = (pkg: 'promo' | 'full' | 'pro' | 'mezcla' | 'express' | 'combo_3' | 'combo_4' | 'prod_cuarto' | 'prod_artista' | 'prod_eng') => {
    setSelectedPackage(pkg);
    if (pkg === 'promo') {
      setFormData(prev => ({
        ...prev,
        servicios: { grabacion: true, instrumental: false, mezclaMaster: true, produccionCompleta: false },
        tipoInstrumental: 'youtube',
        horaInicio: '13:00',
        horaSalida: '17:00'
      }));
      setEsReservaEnBloque(false);
    } else if (pkg === 'full') {
      setFormData(prev => ({
        ...prev,
        servicios: { grabacion: true, instrumental: true, mezclaMaster: true, produccionCompleta: true },
        tipoInstrumental: 'ninguna',
        horaInicio: '13:00',
        horaSalida: '18:00'
      }));
      setEsReservaEnBloque(false);
    } else if (pkg === 'pro') {
      setFormData(prev => ({
        ...prev,
        servicios: { grabacion: true, instrumental: false, mezclaMaster: true, produccionCompleta: false },
        tipoInstrumental: 'youtube',
        horaInicio: '13:00',
        horaSalida: '17:00'
      }));
      setEsReservaEnBloque(false);
    } else if (pkg === 'mezcla') {
      setFormData(prev => ({
        ...prev,
        servicios: { grabacion: false, instrumental: false, mezclaMaster: true, produccionCompleta: false },
        tipoInstrumental: 'drive',
        horaInicio: '13:00',
        horaSalida: '17:00'
      }));
      setEsReservaEnBloque(false);
    } else if (pkg === 'express') {
      setFormData(prev => ({
        ...prev,
        servicios: { grabacion: true, instrumental: false, mezclaMaster: false, produccionCompleta: false },
        tipoInstrumental: 'youtube',
        horaInicio: '13:00',
        horaSalida: '16:00'
      }));
      setEsReservaEnBloque(false);
    } else if (pkg === 'combo_3') {
      setFormData(prev => ({
        ...prev,
        servicios: { grabacion: true, instrumental: false, mezclaMaster: true, produccionCompleta: false },
        tipoInstrumental: 'youtube',
        horaInicio: '13:00',
        horaSalida: '17:00'
      }));
      setEsReservaEnBloque(false);
    } else if (pkg === 'combo_4') {
      setFormData(prev => ({
        ...prev,
        servicios: { grabacion: true, instrumental: false, mezclaMaster: true, produccionCompleta: false },
        tipoInstrumental: 'youtube',
        horaInicio: '13:00',
        horaSalida: '18:00'
      }));
      setEsReservaEnBloque(false);
    } else if (pkg === 'prod_cuarto') {
      setFormData(prev => ({
        ...prev,
        servicios: { grabacion: false, instrumental: true, mezclaMaster: false, produccionCompleta: false },
        tipoInstrumental: 'pendrive',
        horaInicio: '13:00',
        horaSalida: '16:00'
      }));
      setEsReservaEnBloque(false);
    } else if (pkg === 'prod_artista') {
      setFormData(prev => ({
        ...prev,
        servicios: { grabacion: true, instrumental: false, mezclaMaster: false, produccionCompleta: false },
        tipoInstrumental: 'pendrive',
        horaInicio: '13:00',
        horaSalida: '15:00'
      }));
      setEsReservaEnBloque(false);
    } else if (pkg === 'prod_eng') {
      setFormData(prev => ({
        ...prev,
        servicios: { grabacion: true, instrumental: false, mezclaMaster: false, produccionCompleta: false },
        tipoInstrumental: 'pendrive',
        horaInicio: '13:00',
        horaSalida: '16:00'
      }));
      setEsReservaEnBloque(false);
    }

    // Scroll suave directo al calendario y selección de turno
    setTimeout(() => {
      document.getElementById('seccion-calendario-booking')?.scrollIntoView({ behavior: 'smooth' });
    }, 120);
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files) {
      const filesList = Array.from(e.dataTransfer.files).map((file: any) => ({
        nombre: file.name,
        tamano: (file.size / (1024 * 1024)).toFixed(2) + ' MB'
      }));
      setArchivosSubidos(prev => [...prev, ...filesList]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesList = Array.from(e.target.files).map((file: any) => ({
        nombre: file.name,
        tamano: (file.size / (1024 * 1024)).toFixed(2) + ' MB'
      }));
      setArchivosSubidos(prev => [...prev, ...filesList]);
    }
  };

  const handleRemoveFile = (index: number) => {
    setArchivosSubidos(prev => prev.filter((_, i) => i !== index));
  };

  // Manejo de cambios en los checkboxes de servicios
  const handleServiceChange = (key: keyof typeof formData.servicios) => {
    setSelectedPackage(null); // Switch to custom itemized mode
    setFormData(prev => ({
      ...prev,
      servicios: {
        ...prev.servicios,
        [key]: !prev.servicios[key]
      }
    }));
  };

  // Rellenar datos de ejemplo al instante (Reduce carga cognitiva y acelera la prueba)
  const handleFillDemoData = () => {
    setSelectedPackage('pro');
    setCheckoutStep(3);
    setFormData(prev => ({
      ...prev,
      nombreReal: 'Carlos Arturo Mendoza',
      nombreArtistico: 'BADLENZ / El King',
      redesSociales: '@badlenz_official',
      telefono: '+1 (787) 240-8627',
      email: 'badlenz.music@gmail.com',
      servicios: {
        grabacion: true,
        instrumental: false,
        mezclaMaster: true,
        produccionCompleta: false
      },
      tipoInstrumental: 'youtube',
      linkYoutube: 'https://www.youtube.com/watch?v=badlenz_urban_beat',
      metodoPago: 'ATH Movil',
      referencias: 'Beat estilo reggaetón comercial 2026 con 808s marcados y voces limpias estilo Feid / Bad Bunny',
      aceptaTerminos: true,
      fecha: '2026-08-10',
      horaInicio: '14:00',
      horaSalida: '19:00'
    }));
    setHasSigned(true);
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        ctx.beginPath();
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 3;
        ctx.moveTo(50, 70);
        ctx.bezierCurveTo(90, 20, 130, 110, 180, 50);
        ctx.bezierCurveTo(220, 30, 260, 90, 330, 60);
        ctx.stroke();
      }
    }
    // Datos demo simulados
    // (setYoutubeInfo)
  };

  // Generar y ver Pase VIP de demostración al instante
  const handleShowDemoPass = () => {
    handleFillDemoData();
    const demoReserva: Reserva = {
      id: 'PASE-LFS-2026-7821',
      clienteId: 'CLI-8820',
      nombreArtistico: 'BADLENZ / El King',
      fecha: '2026-08-10',
      horaInicio: '14:00',
      horaSalida: '19:00',
      totalHoras: 5,
      servicios: ['Grabación de Voces (5 Horas)', 'Mezcla y Masterización'],
      metodoPago: 'ATH Movil',
      subtotal: 200,
      deposito: 100,
      balance: 100,
      estado: 'Confirmada'
    };
    setReservaActiva(demoReserva);
    // Smooth scroll to pass summary
    setTimeout(() => {
      document.getElementById('seccion-resumen')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const errors: { nombreArtistico?: string; telefono?: string } = {};
    if (!formData.nombreArtistico.trim()) {
      errors.nombreArtistico = 'Ingresa tu nombre artístico para tu Pase VIP';
    }
    if (!formData.telefono.trim()) {
      errors.telefono = 'Ingresa tu número de WhatsApp para enviarte el Pase y ubicación';
    }

    if (Object.keys(errors).length > 0) {
      setStepErrors(errors);
      showToast('Por favor completa tu Nombre Artístico y WhatsApp para emitir tu Pase VIP.', 'warning');
      return;
    }

    setStepErrors({});

    // 1. Array de servicios seleccionados para el registro
    const listaServicios: string[] = [];
    if (formData.servicios.grabacion) listaServicios.push('Grabación de Voces/Instr.');
    if (formData.servicios.instrumental) listaServicios.push('Servicio de Instrumental');
    if (formData.servicios.mezclaMaster) listaServicios.push('Mezcla y Masterización');
    if (formData.servicios.produccionCompleta) listaServicios.push('Producción Completa');

    if (listaServicios.length === 0) {
      listaServicios.push('Sesión de Grabación (4h)');
    }

    setIsSending(true);

    // 2. Guardar o actualizar datos del cliente en la DB
    const cliente = guardarCliente({
      nombreArtistico: formData.nombreArtistico.trim(),
      nombreReal: formData.nombreReal || formData.nombreArtistico.trim(),
      email: formData.email || `${formData.nombreArtistico.toLowerCase().replace(/[^a-z0-9]/g, '')}@cliente.com`,
      telefono: formData.telefono.trim(),
      instagram: formData.redesSociales
    });

    // 3. Obtener firma digital si existe
    let signatureDataUrl = '';
    if (hasSigned && canvasRef.current) {
      signatureDataUrl = canvasRef.current.toDataURL('image/png');
    }

    // 4. Guardar orden/reserva vinculada
    const nuevaReserva = guardarReserva({
      clienteId: cliente.id,
      nombreArtistico: formData.nombreArtistico.trim(),
      fecha: formData.fecha,
      fechasBloque: esReservaEnBloque ? fechasSeleccionadasBloque : undefined,
      horaInicio: formData.horaInicio,
      horaSalida: formData.horaSalida,
      totalHoras: duracionHoras,
      servicios: listaServicios,
      metodoPago: formData.metodoPago,
      subtotal: subtotal,
      deposito: deposito,
      balance: balance,
      estado: 'Pendiente',
      comprobanteNumReferencia: athNumReferenciaInput.trim() || undefined,
      comprobanteAthUrl: athComprobanteUrl || undefined,
      firma: signatureDataUrl || undefined,
      tipoProyecto: (selectedPackage as string) === 'ep_pack' ? 'ep_3_tracks' : (selectedPackage as string) === 'album_pack' ? 'album_completo' : (selectedPackage as string) === 'pack_3dias' ? 'pack_semanal' : 'single',
      roughMixNombre: `${formData.nombreArtistico.toUpperCase() || 'ARTISTA'}_Sesion_${formData.fecha}_ROUGH_v1.wav`,
      roughMixUrl: 'https://actions.google.com/sounds/v1/musical_tracks/hip_hop_track.ogg'
    } as any);

    // INMEDIATAMENTE activar y desplegar el Pase VIP sin demoras de red
    setReservaActiva(nuevaReserva);
    setIsSending(false);
    showToast(`🎟️ ¡Pase VIP #${nuevaReserva.id} emitido con éxito! Guarda tu comprobante y confírmalo con Badlenz.`, 'success');

    // Smooth scroll al pase de estudio
    setTimeout(() => {
      document.getElementById('seccion-resumen')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);

    // Enviar notificación por correo en segundo plano
    fetch('/api/enviar-email-reserva', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        cliente: {
          nombreReal: formData.nombreReal || formData.nombreArtistico.trim(),
          nombreArtistico: formData.nombreArtistico.trim(),
          email: formData.email || `${formData.nombreArtistico.toLowerCase().replace(/\s+/g, '')}@cliente.com`,
          telefono: formData.telefono.trim(),
          instagram: formData.redesSociales
        },
        reserva: nuevaReserva,
        detallesProyecto: {
          tipoInstrumental: formData.tipoInstrumental,
          linkYoutube: formData.linkYoutube,
          referencias: formData.referencias,
          archivos: archivosSubidos
        }
      })
    })
    .catch(err => {
      console.warn('Aviso de notificación por correo en segundo plano:', err);
    });
  };

  const handleDownloadPDF = () => {
    if (!reservaActiva) return;
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [80, 150] // Compact digital size, perfect for screenshots
    });

    // Dark layout
    doc.setFillColor(30, 30, 30);
    doc.rect(0, 0, 80, 150, 'F');

    // Header board
    doc.setDrawColor(220, 38, 38);
    doc.setLineWidth(1);
    doc.line(5, 5, 75, 5);
    doc.line(5, 14, 75, 14);

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.setFont('Helvetica', 'bold');
    doc.text('LA FACULTAD STUDIO', 40, 10.5, { align: 'center' });

    doc.setFontSize(7);
    doc.setTextColor(234, 179, 8); // Gold
    doc.text('PASE DE ENTRADA EXPRES - ESTUDIO', 40, 20, { align: 'center' });

    // ID section
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    doc.setFillColor(17, 24, 39);
    doc.rect(10, 24, 60, 8, 'F');
    doc.text(`ID: ${reservaActiva.id}`, 40, 29, { align: 'center' });

    // Label Details
    doc.setFont('Helvetica', 'normal');
    doc.setTextColor(180, 180, 180);
    doc.text('Artista:', 12, 40);
    doc.setTextColor(255, 255, 255);
    doc.setFont('Helvetica', 'bold');
    doc.text(formData.nombreArtistico || '-', 32, 40);

    doc.setFont('Helvetica', 'normal');
    doc.setTextColor(180, 180, 180);
    doc.text('Nombre Legal:', 12, 46);
    doc.setTextColor(255, 255, 255);
    doc.text(formData.nombreReal || '-', 32, 46);

    doc.setFont('Helvetica', 'normal');
    doc.setTextColor(180, 180, 180);
    doc.text('Fecha:', 12, 52);
    doc.setTextColor(239, 68, 68);
    doc.setFont('Helvetica', 'bold');
    doc.text(reservaActiva.fecha, 32, 52);

    doc.setFont('Helvetica', 'normal');
    doc.setTextColor(180, 180, 180);
    doc.text('Horario:', 12, 58);
    doc.setTextColor(234, 179, 8);
    doc.setFont('Helvetica', 'bold');
    doc.text(`${format12h(reservaActiva.horaInicio)} - ${format12h(reservaActiva.horaSalida)}`, 32, 58);

    doc.setFont('Helvetica', 'normal');
    doc.setTextColor(180, 180, 180);
    doc.text('Contacto:', 12, 64);
    doc.setTextColor(255, 255, 255);
    doc.text(formData.telefono || '-', 32, 64);

    doc.setFont('Helvetica', 'normal');
    doc.setTextColor(180, 180, 180);
    doc.text('Método Pago:', 12, 70);
    doc.setTextColor(52, 211, 153);
    doc.text(reservaActiva.metodoPago, 32, 70);

    // Divider
    doc.setDrawColor(80, 80, 80);
    doc.setLineWidth(0.4);
    doc.line(10, 78, 70, 78);

    // Financial
    doc.setFont('Helvetica', 'bold');
    doc.setTextColor(234, 179, 8);
    doc.text('DESGLOSE FINANCIERO', 40, 84, { align: 'center' });

    doc.setFont('Helvetica', 'normal');
    doc.setTextColor(180, 180, 180);
    doc.text('Monto Total:', 12, 92);
    doc.setTextColor(255, 255, 255);
    doc.setFont('Helvetica', 'bold');
    doc.text(`$${reservaActiva.subtotal}.00 USD`, 68, 92, { align: 'right' });

    doc.setFont('Helvetica', 'normal');
    doc.setTextColor(180, 180, 180);
    doc.text('Depósito (50%):', 12, 98);
    doc.setTextColor(234, 179, 8);
    doc.setFont('Helvetica', 'bold');
    doc.text(`$${reservaActiva.deposito}.00 USD`, 68, 98, { align: 'right' });

    doc.setFont('Helvetica', 'normal');
    doc.setTextColor(180, 180, 180);
    doc.text('Balance en Cabina:', 12, 104);
    doc.setTextColor(239, 68, 68);
    doc.setFont('Helvetica', 'bold');
    doc.text(`$${reservaActiva.balance}.00 USD`, 68, 104, { align: 'right' });

    // Simulated QR Code Box
    doc.setFillColor(15, 23, 42);
    doc.rect(28, 112, 24, 24, 'F');
    doc.setDrawColor(255, 255, 255);
    doc.setLineWidth(0.5);
    doc.rect(30, 114, 6, 6);
    doc.rect(44, 114, 6, 6);
    doc.rect(30, 128, 6, 6);
    doc.setFillColor(255, 255, 255);
    doc.rect(32, 116, 2, 2, 'F');
    doc.rect(46, 116, 2, 2, 'F');
    doc.rect(32, 130, 2, 2, 'F');
    doc.line(30, 123, 50, 123);
    doc.line(38, 117, 38, 132);
    doc.line(42, 128, 50, 128);

    doc.setTextColor(120, 120, 120);
    doc.setFontSize(6);
    doc.setFont('Helvetica', 'normal');
    doc.text('LA FACULTAD STUDIO | PROD BY BADLENZ | HORMIGUEROS, PR', 40, 143, { align: 'center' });

    doc.save(`Pase_LaFacultad_Studio_${reservaActiva.id}.pdf`);
  };

  const handleDownloadImage = () => {
    if (!reservaActiva) return;
    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 1000;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Dark elegant carbon gradient background
    const bgGrad = ctx.createLinearGradient(0, 0, 0, 1000);
    bgGrad.addColorStop(0, '#131316');
    bgGrad.addColorStop(0.5, '#1e1e24');
    bgGrad.addColorStop(1, '#0c0c0e');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 600, 1000);

    // Outer neon borders & golden accents
    ctx.strokeStyle = '#dc2626';
    ctx.lineWidth = 5;
    ctx.strokeRect(20, 20, 560, 960);

    ctx.strokeStyle = '#eab308';
    ctx.lineWidth = 2;
    ctx.strokeRect(30, 30, 540, 940);

    // Red top badge accent
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(60, 48, 480, 4);

    // Studio Title & Badlenz Signature
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 30px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('LA FACULTAD STUDIO', 300, 92);

    ctx.fillStyle = '#eab308'; // Gold
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText('PASE VIP DE CABINA • ESTUDIO DE GRABACIÓN', 300, 122);

    ctx.fillStyle = '#9ca3af';
    ctx.font = '12px monospace';
    ctx.fillText('PRODUCIDO POR BADLENZ • HORMIGUEROS, PUERTO RICO', 300, 144);

    // Folio ID Banner
    ctx.fillStyle = '#111827';
    ctx.fillRect(60, 165, 480, 46);
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(60, 165, 480, 46);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 20px monospace';
    ctx.fillText(`FOLIO: ${reservaActiva.id}`, 300, 195);

    const drawRow = (label: string, value: string, y: number, valueColor: string = '#ffffff') => {
      ctx.textAlign = 'left';
      ctx.fillStyle = '#9ca3af';
      ctx.font = 'bold 16px sans-serif';
      ctx.fillText(label, 70, y);

      ctx.textAlign = 'right';
      ctx.fillStyle = valueColor;
      ctx.font = 'bold 17px sans-serif';
      ctx.fillText(value, 530, y);
    };

    drawRow('Artista:', formData.nombreArtistico || 'BADLENZ / El King', 250, '#fbbf24');
    drawRow('Nombre Legal:', formData.nombreReal || 'Carlos Arturo Mendoza', 285, '#ffffff');
    drawRow('Fecha Sesión:', reservaActiva.fecha, 320, '#ef4444');
    drawRow('Horario Agendado:', `${format12h(reservaActiva.horaInicio)} - ${format12h(reservaActiva.horaSalida)}`, 355, '#38bdf8');
    drawRow('Duración Cabina:', `${reservaActiva.totalHoras || 5} Horas de Sesión`, 390, '#ffffff');
    drawRow('Contacto / Tel:', formData.telefono || '+1 (787) 240-8627', 425, '#ffffff');
    drawRow('Método de Pago:', reservaActiva.metodoPago, 460, '#34d399');

    // Dashed divider line
    ctx.strokeStyle = '#4b5563';
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 6]);
    ctx.beginPath();
    ctx.moveTo(70, 495);
    ctx.lineTo(530, 495);
    ctx.stroke();
    ctx.setLineDash([]); // Reset dash

    // Financial Breakdown
    ctx.textAlign = 'center';
    ctx.fillStyle = '#eab308';
    ctx.font = 'bold 18px sans-serif';
    ctx.fillText('DESGLOSE FINANCIERO', 300, 530);

    drawRow('Inversión Total:', `$${reservaActiva.subtotal}.00 USD`, 570, '#ffffff');
    drawRow('Depósito Requerido (50%):', `$${reservaActiva.deposito}.00 USD`, 605, '#fbbf24');
    drawRow('Balance a Liquidar en Cabina:', `$${reservaActiva.balance}.00 USD`, 640, '#ef4444');

    // Simulated QR Code in High Contrast
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(235, 680, 130, 130);
    ctx.strokeStyle = '#eab308';
    ctx.lineWidth = 2;
    ctx.strokeRect(235, 680, 130, 130);

    // QR Corner Markers
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(245, 690, 30, 30);
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(250, 695, 20, 20);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(255, 700, 10, 10);

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(325, 690, 30, 30);
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(330, 695, 20, 20);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(335, 700, 10, 10);

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(245, 770, 30, 30);
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(250, 775, 20, 20);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(255, 780, 10, 10);

    // QR Inner Random Matrix Dots
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 28; i++) {
      const rx = 285 + (i % 5) * 8;
      const ry = 690 + Math.floor(i / 5) * 8;
      ctx.fillRect(rx, ry, 6, 6);
    }
    for (let i = 0; i < 20; i++) {
      const rx = 245 + (i % 6) * 9;
      const ry = 735 + Math.floor(i / 6) * 7;
      ctx.fillRect(rx, ry, 6, 6);
    }

    // Footers
    ctx.fillStyle = '#9ca3af';
    ctx.font = '12px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('VALIDADO POR BADLENZ • PRESENTA ESTE PASE AL LLEGAR', 300, 840);

    ctx.fillStyle = '#6b7280';
    ctx.font = '11px sans-serif';
    ctx.fillText('LA FACULTAD STUDIO | HORMIGUEROS, PR • TEL: 787-240-8627', 300, 865);
    ctx.fillText('Guarda esta foto en la galería de tu celular para acceso prioritario', 300, 885);

    const link = document.createElement('a');
    link.download = `Pase_VIP_LaFacultad_${reservaActiva.id}.jpg`;
    link.href = canvas.toDataURL('image/jpeg', 0.98);
    link.click();
  };

  const handleAddToGoogleCalendar = () => {
    if (!reservaActiva) return;
    const datePart = reservaActiva.fecha.replace(/-/g, '');
    const startHourPart = reservaActiva.horaInicio.replace(/:/g, '');
    const endHourPart = reservaActiva.horaSalida.replace(/:/g, '');
    
    const startIso = `${datePart}T${startHourPart}00`;
    const endIso = `${datePart}T${endHourPart}00`;

    const title = encodeURIComponent(`Sesión de Grabación | La Facultad Studio 🎤`);
    const details = encodeURIComponent(`¡Hagamos música! Sesión reservada con Badlenz.\n\nID Reserva: ${reservaActiva.id}\nServicios: ${reservaActiva.servicios.join(', ')}\nBalance pendiente: $${reservaActiva.balance} USD\n\nPor favor, recuerda llegar 20 minutos antes de tu turno.`);
    const location = encodeURIComponent(`La Facultad Studio, Hormigueros, Puerto Rico`);

    const gCalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startIso}/${endIso}&details=${details}&location=${location}&sf=true&output=xml`;
    window.open(gCalUrl, '_blank');
  };

  const handleDownloadIcs = () => {
    if (!reservaActiva) return;
    const datePart = reservaActiva.fecha.replace(/-/g, '');
    const startHourPart = reservaActiva.horaInicio.replace(/:/g, '') + '00';
    const endHourPart = reservaActiva.horaSalida.replace(/:/g, '') + '00';

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//La Facultad Studio//Calendar Integration//ES',
      'BEGIN:VEVENT',
      `UID:${reservaActiva.id}@lafacultadstudio.com`,
      `DTSTAMP:${datePart}T${startHourPart}`,
      `DTSTART:${datePart}T${startHourPart}`,
      `DTEND:${datePart}T${endHourPart}`,
      'SUMMARY:Sesion de Grabacion | La Facultad Studio',
      `DESCRIPTION:Sesion agendada en La Facultad Studio con Badlenz.\\n\\nID Reserva: ${reservaActiva.id}\\nServicios: ${reservaActiva.servicios.join(', ')}\\nBalance: $${reservaActiva.balance} USD\\n\\nRecuerda llegar 20 min antes.`,
      'LOCATION:La Facultad Studio, San Juan, Puerto Rico',
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Cita_LaFacultad_Studio_${reservaActiva.id}.ics`;
    link.click();
  };

  const bloquesDisponibles = React.useMemo(() => {
    return [
      { label: 'Bloque 1 · Tarde', desc: '01:00 PM - 05:00 PM (4 Horas)', start: '13:00', end: '17:00' },
      { label: 'Bloque 2 · Noche', desc: '06:00 PM - 10:00 PM (4 Horas)', start: '18:00', end: '22:00' }
    ];
  }, []);

  // Si el estudio está cerrado por vacaciones, mantenimiento o remodelación:
  // Modo Takeover Total: El cliente ve únicamente la pantalla completa de aviso y lista de espera VIP.
  if (isStudioTemporarilyClosed) {
    return (
      <div className="py-2 animate-fadeIn">
        <AvisoEstudioCerrado 
          onNavigateToMuestras={onNavigateToMuestras}
          isFullTakeover={true}
        />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn relative">
      {/* NOTIFICACIÓN MODERNA FLOTANTE (REEMPLAZO TOTAL DE ALERTAS NATIVAS) */}
      {toast && (
        <div className="fixed top-6 right-6 z-50 max-w-sm w-full animate-bounce-in drop-shadow-2xl">
          <div className={`p-4 rounded-2xl border flex items-start gap-3 backdrop-blur-xl ${
            toast.type === 'success' ? 'bg-[#0f291e]/95 border-emerald-500 text-white' :
            toast.type === 'error' ? 'bg-[#2a0e0e]/95 border-red-500 text-white' :
            toast.type === 'warning' ? 'bg-[#2d2208]/95 border-amber-500 text-white' :
            'bg-[#111827]/95 border-gray-700 text-white'
          }`}>
            <span className="text-lg shrink-0">
              {toast.type === 'success' ? '🎟️' : toast.type === 'warning' ? '⚠️' : toast.type === 'error' ? '❌' : 'ℹ️'}
            </span>
            <div className="flex-1 text-xs">
              <p className="font-bold leading-relaxed">{toast.message}</p>
            </div>
            <button 
              type="button" 
              onClick={() => setToast(null)}
              className="text-gray-400 hover:text-white text-xs font-mono ml-1 cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>
      )}
      {/* BANNER OFICIAL DE BIENVENIDA & REAPERTURA 2026 (SPATIAL ANTIGRAVITY DESIGN) */}
      <ScrollReveal delayMs={0}>
        <div className="relative overflow-hidden rounded-3xl border border-amber-500/40 bg-gradient-to-r from-[#1b080d]/90 via-[#100c14]/95 to-[#0b0c10]/95 p-5 sm:p-6 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.8),0_0_35px_rgba(245,158,11,0.18)]">
          {/* Glass Top Edge Light Streak */}
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-400/60 to-transparent pointer-events-none" />
          
          {/* Ambient Lighting Orbs */}
          <div className="absolute top-0 right-0 -mt-8 -mr-8 w-48 h-48 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-48 h-48 bg-red-600/15 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
            <div className="space-y-2.5 max-w-3xl">
              {/* Badges Row with Exact Baseline Alignment */}
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 text-white text-[11px] font-black uppercase tracking-wider shadow-md shadow-red-950/50">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-200 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-300"></span>
                  </span>
                  <span>REAPERTURA OFICIAL</span>
                  <span className="bg-black/30 px-1.5 py-0.5 rounded font-sans font-extrabold lining-nums text-amber-200 leading-none">
                    2026
                  </span>
                </span>

                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold backdrop-blur-md">
                  <span className="text-amber-400">🔥</span>
                  <span>Solo <strong className="font-sans font-black lining-nums text-white bg-amber-500/20 px-1.5 py-0.5 rounded leading-none">6 Cupos</strong> a</span>
                  <span className="font-sans font-black text-white lining-nums tracking-tight text-sm leading-none">$130 USD</span>
                  <span className="text-zinc-400 text-[10px] line-through font-sans lining-nums decoration-red-500 leading-none">(Reg. $200)</span>
                </span>
              </div>

              {/* Informative Text with Crisp Lining Numerals */}
              <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed font-sans">
                Tras <span className="font-sans font-bold lining-nums text-zinc-100">10</span> meses de preparación acústica, <strong className="text-white font-semibold">La Facultad Studio</strong> reabre sus puertas en Hormigueros. Separa tu bloque de grabación de <span className="font-sans font-bold lining-nums text-zinc-100">4</span> horas (con premezcla el mismo día y máster WAV 24-bit) con solo <strong className="text-amber-300 font-sans font-black lining-nums">$50 USD</strong> de depósito vía ATH Móvil.
              </p>
            </div>

            {/* Spatial Button with Perfectly Aligned Micro-Pill */}
            <div className="flex items-center shrink-0">
              <button
                type="button"
                onClick={() => {
                  handleSelectPackage('promo');
                  document.getElementById('seccion-calendario-booking')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="group relative w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-500 to-red-500 hover:from-amber-300 hover:to-red-400 text-gray-950 font-syne font-black text-xs uppercase tracking-wider transition-all duration-300 shadow-[0_10px_30px_rgba(245,158,11,0.35)] hover:shadow-[0_15px_40px_rgba(245,158,11,0.5)] hover:-translate-y-0.5 active:translate-y-0 active:scale-95 cursor-pointer"
              >
                <span>Aprovechar</span>
                <span className="inline-flex items-center justify-center bg-gray-950 text-amber-300 font-sans font-black text-xs lining-nums px-2 py-0.5 rounded-lg border border-amber-400/40 shadow-inner leading-none">
                  $130
                </span>
                <span>&amp; Elegir Fecha</span>
                <span className="transition-transform duration-300 group-hover:translate-x-1">➔</span>
              </button>
            </div>
          </div>
        </div>
      </ScrollReveal>

      {/* 1. MASTER STUDIO HERO (URBAN BOUTIQUE RECORDING STUDIO) */}
      <ScrollReveal delayMs={0}>
        <div className="relative overflow-hidden rounded-3xl border border-zinc-800/90 bg-[#0a0c10] p-6 sm:p-10 shadow-2xl space-y-7">
          {/* Ambient Studio Lighting Glows */}
          <div className="absolute top-0 right-10 w-96 h-96 bg-red-600/15 rounded-full blur-[120px] pointer-events-none" />
          <div className="absolute bottom-0 left-1/4 w-80 h-80 bg-amber-500/10 rounded-full blur-[110px] pointer-events-none" />

          {/* Top Bar: Dual Branding + Live Equalizer Status */}
          <div className="relative z-10 flex flex-wrap items-center justify-between gap-4 border-b border-zinc-800/80 pb-5">
            <div className="flex items-center gap-3">
              <LFCrestLogo size="md" />
              <div>
                <span className="text-[10px] font-mono text-red-500 font-bold uppercase tracking-widest block">
                  La Facultad Studio
                </span>
                <span className="text-xs font-bold text-white tracking-wide">
                  Hormigueros, Puerto Rico
                </span>
              </div>
            </div>

            {/* Live Studio Equalizer Spectrum */}
            <div className="flex items-center gap-3 bg-zinc-950/80 border border-zinc-800/90 px-3.5 py-1.5 rounded-2xl">
              <div className="flex items-end gap-1 h-5 px-1">
                <span className="w-1 bg-red-500 rounded-full animate-eq-1" />
                <span className="w-1 bg-amber-400 rounded-full animate-eq-2" />
                <span className="w-1 bg-red-400 rounded-full animate-eq-3" />
                <span className="w-1 bg-amber-500 rounded-full animate-eq-4" />
                <span className="w-1 bg-red-600 rounded-full animate-eq-5" />
              </div>
              <div className="text-[11px] font-mono">
                <span className="font-bold text-emerald-400 uppercase tracking-wider block">
                  ● On Air · Sesiones Activas
                </span>
                <span className="text-zinc-400 text-[10px]">
                  Cabina Acústica &amp; Control Room
                </span>
              </div>
            </div>

            <div className="hidden md:flex items-center gap-2">
              <BadlenzLogo size="md" />
            </div>
          </div>

          {/* Slogan pill from official contracts */}
          <div className="relative z-10 inline-flex items-center gap-2 bg-gradient-to-r from-red-950/50 to-amber-950/30 border border-red-700/40 px-3.5 py-1.5 rounded-full text-xs">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="italic font-medium text-amber-200">
              “Transformando tu visión en sonido profesional.”
            </span>
          </div>

          {/* Main Statement */}
          <div className="relative z-10 space-y-3 max-w-3xl">
            <h1 className="font-syne font-bold text-3xl sm:text-5xl lg:text-6xl text-white uppercase leading-[0.95] tracking-tight">
              Tu canción. <br className="hidden sm:inline" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-rose-400 to-amber-400">
                Tu sonido terminado.
              </span>
            </h1>
            <p className="font-dmsans text-sm sm:text-base text-zinc-300 leading-relaxed max-w-2xl pt-1">
              Estudio de grabación vocal, afinación en vivo, mezcla multitrack y master comercial dirigido por <strong>Badlenz</strong>. Acústica tratada, monitoreo analógico sin latencia y entrega WAV 24-bit listo para Spotify y Apple Music. Separa tu fecha con solo <strong>$50 USD</strong> de depósito vía ATH Móvil.
            </p>
          </div>

          {/* Action Row & Live Reopening Offer */}
          <div className="relative z-10 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-2">
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  document.getElementById('tarifas-estudio')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="taste-btn px-6 py-3.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-dmsans font-bold text-sm tracking-wide shadow-lg shadow-red-950/50 hover:shadow-red-900/60 cursor-pointer text-center"
              >
                Elegir Paquete &amp; Ver Fechas →
              </button>

              <button
                type="button"
                onClick={handleCopyAthPhone}
                className="taste-btn px-4 py-3.5 rounded-xl bg-zinc-900/90 hover:bg-zinc-800 text-zinc-200 border border-zinc-700/80 font-mono text-xs flex items-center justify-center gap-2 cursor-pointer"
                title="Copiar número de ATH Móvil"
              >
                <Smartphone className="w-4 h-4 text-amber-400" />
                <span>{copiedAthPhone ? '¡Copiado!' : 'ATH Móvil: (787) 240-8627'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  window.dispatchEvent(new CustomEvent('open-artist-portal-modal'));
                }}
                className="taste-btn px-4 py-3.5 rounded-xl bg-[#0b0c0e] hover:bg-amber-500/15 text-amber-300 border border-amber-500/60 hover:border-amber-400 font-syne font-bold text-xs flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(245,158,11,0.18)] cursor-pointer transition-all"
                title="Abrir Portal de Artista VIP, Temas, Recibos y Recompensas"
              >
                <Headphones className="w-4 h-4 text-amber-400" />
                <span>Portal de Artista VIP</span>
                <Sparkles className="w-3.5 h-3.5 text-amber-400/80" />
              </button>

              <a
                href="https://wa.me/17872408627?text=¡Saludos%20Badlenz!%20Vi%20la%20página%20y%20quiero%20hacerte%20una%20consulta%20para%20grabar%20mi%20sesión%20en%20La%20Facultad."
                target="_blank"
                rel="noreferrer"
                className="taste-btn px-4 py-3.5 rounded-xl bg-emerald-950/40 hover:bg-emerald-900/40 text-emerald-300 border border-emerald-700/50 font-dmsans font-medium text-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <MessageCircle className="w-4 h-4 text-emerald-400" />
                <span>WhatsApp</span>
              </a>
            </div>

            {/* Reopening Promo Badge */}
            <div className="bg-[#12141c]/90 border border-red-900/50 p-3 rounded-2xl flex items-center justify-between sm:justify-start gap-3.5 shrink-0 shadow-lg">
              <div>
                <span className="text-[10px] font-mono text-red-400 font-bold uppercase tracking-wider block">
                  Promo Reapertura ($130 USD)
                </span>
                <span className="text-xs text-zinc-300 font-medium">
                  {promoSlotsInfo.disponibles > 0 ? `Quedan ${promoSlotsInfo.disponibles} de 6 turnos` : 'Cupos de reapertura agotados'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleSelectPackage('promo')}
                className="taste-btn text-xs bg-red-600/25 hover:bg-red-600/40 text-red-300 border border-red-500/50 font-bold px-3 py-1.5 rounded-lg cursor-pointer whitespace-nowrap"
              >
                Elegir Promo
              </button>
            </div>
          </div>

          {/* 3 Pillars of Credibility */}
          <div className="relative z-10 grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-zinc-800/80 text-xs">
            <div className="taste-card bg-[#0f1117]/80 p-3.5 rounded-xl border border-zinc-800 hover:border-red-500/40">
              <span className="text-red-400 font-mono text-[10px] uppercase font-bold block">01 · Dirección Vocal 1 a 1</span>
              <strong className="text-white block mt-0.5 text-xs">Vocal Coach en Cabina</strong>
              <p className="text-zinc-400 text-[11px] mt-0.5 leading-snug">
                Badlenz te guía en cada toma, respiración y entonación para que tu voz suene con máxima presencia y energía.
              </p>
            </div>

            <div className="taste-card bg-[#0f1117]/80 p-3.5 rounded-xl border border-zinc-800 hover:border-amber-500/40">
              <span className="text-amber-400 font-mono text-[10px] uppercase font-bold block">02 · Previo &amp; Latencia</span>
              <strong className="text-white block mt-0.5 text-xs">Universal Audio Apollo</strong>
              <p className="text-zinc-400 text-[11px] mt-0.5 leading-snug">
                Emulación analógica Neve &amp; SSL con monitoreo en audífonos en tiempo real sin retraso.
              </p>
            </div>

            <div className="taste-card bg-[#0f1117]/80 p-3.5 rounded-xl border border-zinc-800 hover:border-emerald-500/40">
              <span className="text-emerald-400 font-mono text-[10px] uppercase font-bold block">03 · Reserva Garantizada</span>
              <strong className="text-white block mt-0.5 text-xs">$50 Depósito ATH Móvil</strong>
              <p className="text-zinc-400 text-[11px] mt-0.5 leading-snug">
                Sin trámites ni papeleo: bloqueas tu turno oficial y pagas el saldo al llegar a la cabina.
              </p>
            </div>
          </div>
        </div>
      </ScrollReveal>

      {/* DEMOSTRACIÓN AUDITIVA A/B EN VIVO BADLENZ */}
      <ScrollReveal delayMs={40}>
        <div id="seccion-muestras-ab" className="scroll-mt-24">
          <AudioShowcaseAB />
        </div>
      </ScrollReveal>

      {/* 2. PAQUETES OFICIALES EN 1 CLIC (MODULAR TABS - LANDING PAGE VIEW) */}
      <ScrollReveal delayMs={60}>
        <div id="tarifas-estudio" className="antigravity-glass-panel border border-white/10 p-5 sm:p-7 rounded-3xl space-y-6 shadow-[0_30px_70px_rgba(0,0,0,0.7)] scroll-mt-24">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800/80 pb-4">
            <div>
              <span className="text-[10px] font-mono text-zinc-400 font-bold uppercase tracking-wider block">
                Tarifario Oficial · La Facultad Studio
              </span>
              <h2 className="font-syne text-xl sm:text-2xl font-bold text-white tracking-tight mt-0.5">
                Planes de Grabación &amp; Producción
              </h2>
            </div>
          </div>

          {/* Categorías de paquetes en tabs horizontales minimalistas */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none font-dmsans">
            <button
              type="button"
              onClick={() => setTarifasCategory('populares')}
              className={`px-4 py-2 rounded-xl text-xs font-medium transition cursor-pointer ${
                tarifasCategory === 'populares'
                  ? 'bg-rose-600 text-white font-bold shadow-md shadow-rose-950/40'
                  : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
              }`}
            >
              Más Solicitados
            </button>
            <button
              type="button"
              onClick={() => setTarifasCategory('combos')}
              className={`px-4 py-2 rounded-xl text-xs font-medium transition cursor-pointer ${
                tarifasCategory === 'combos'
                  ? 'bg-rose-600 text-white font-bold shadow-md shadow-rose-950/40'
                  : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
              }`}
            >
              Combos de Temas (Ahorro EP)
            </button>
            <button
              type="button"
              onClick={() => setTarifasCategory('productores')}
              className={`px-4 py-2 rounded-xl text-xs font-medium transition cursor-pointer ${
                tarifasCategory === 'productores'
                  ? 'bg-rose-600 text-white font-bold shadow-md shadow-rose-950/40'
                  : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
              }`}
            >
              Productores &amp; Cuarto
            </button>
          </div>

          {tarifasCategory === 'populares' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-fadeIn">
              {/* Paquete 0: Promo Reapertura */}
              <div 
                onClick={() => handleSelectPackage('promo')}
                className={`p-4 rounded-xl border transition-all duration-200 cursor-pointer relative flex flex-col justify-between ${
                  selectedPackage === 'promo'
                    ? 'bg-[#151722] border-rose-500 shadow-xl shadow-rose-950/30 ring-1 ring-rose-500/50'
                    : 'bg-[#10121a] border-zinc-800/90 hover:border-zinc-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 px-2 py-0.5 rounded">
                      Promo Reapertura
                    </span>
                    <span className="text-base font-bold text-white font-mono">$130 USD</span>
                  </div>

                  <div className="mt-2.5 bg-black/50 border border-zinc-800 p-1.5 rounded-lg flex items-center justify-between text-[11px] font-mono">
                    <span className="text-zinc-400">Cupos:</span>
                    <span className={`font-bold px-1.5 py-0.2 rounded text-[10px] ${
                      promoSlotsInfo.disponibles > 0 ? 'bg-emerald-950 text-emerald-400' : 'bg-red-950 text-red-400'
                    }`}>
                      {promoSlotsInfo.disponibles > 0 ? `${promoSlotsInfo.disponibles} de 6 libres` : 'Agotado'}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-white mt-2.5">Promo Reapertura</h4>
                  <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                    Bloque de 4h en cabina, premezcla entregada al finalizar la sesión, master final en 24-48h y 2 revisiones gratis.
                  </p>
                </div>
                <div className="mt-3.5 pt-2.5 border-t border-zinc-800/80 flex items-center justify-between text-[11px]">
                  <span className="text-zinc-400">Depósito ATH: <strong className="text-white">$65</strong></span>
                  <span className="text-rose-400 font-medium">Elegir →</span>
                </div>
              </div>

              {/* Paquete 1: Grabación, Mezcla y Master Pro */}
              <div 
                onClick={() => handleSelectPackage('pro')}
                className={`p-4 rounded-xl border transition-all duration-200 cursor-pointer relative flex flex-col justify-between ${
                  selectedPackage === 'pro'
                    ? 'bg-[#151722] border-rose-500 shadow-xl shadow-rose-950/30 ring-1 ring-rose-500/50'
                    : 'bg-[#10121a] border-zinc-800/90 hover:border-zinc-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-mono font-bold bg-zinc-800 text-zinc-200 border border-zinc-700 px-2 py-0.5 rounded">
                      Más Popular
                    </span>
                    <span className="text-base font-bold text-white font-mono">$200 USD</span>
                  </div>
                  <h4 className="text-sm font-bold text-white mt-2.5">Grabación, Mezcla &amp; Master</h4>
                  <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                    Traes tu beat (YouTube/WAV), 4-5h en cabina, premezcla al salir, master final en 24-48h y 2 revisiones gratis incluidas.
                  </p>
                </div>
                <div className="mt-3.5 pt-2.5 border-t border-zinc-800/80 flex items-center justify-between text-[11px]">
                  <span className="text-zinc-400">Depósito 50%: <strong className="text-white">$100</strong></span>
                  <span className="text-rose-400 font-medium">Elegir →</span>
                </div>
              </div>

              {/* Paquete 2: Full Pack */}
              <div 
                onClick={() => handleSelectPackage('full')}
                className={`p-4 rounded-xl border transition-all duration-200 cursor-pointer relative flex flex-col justify-between ${
                  selectedPackage === 'full'
                    ? 'bg-[#151722] border-rose-500 shadow-xl shadow-rose-950/30 ring-1 ring-rose-500/50'
                    : 'bg-[#10121a] border-zinc-800/90 hover:border-zinc-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-mono font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded">
                      Producción Total
                    </span>
                    <span className="text-base font-bold text-white font-mono">$350 – $400 USD</span>
                  </div>
                  <h4 className="text-sm font-bold text-white mt-2.5">Producción Integral (Full Song)</h4>
                  <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                    Desarrollo completo desde cero: instrumental exclusivo a medida, arreglos, grabación (4-5h), tuning Melodyne, mezcla y master comercial.
                  </p>
                </div>
                <div className="mt-3.5 pt-2.5 border-t border-zinc-800/80 flex items-center justify-between text-[11px]">
                  <span className="text-zinc-400">Depósito 50%: <strong className="text-white">$175</strong></span>
                  <span className="text-rose-400 font-medium">Elegir →</span>
                </div>
              </div>

              {/* Paquete 3: Mezcla y Master */}
              <div 
                onClick={() => handleSelectPackage('mezcla')}
                className={`p-4 rounded-xl border transition-all duration-200 cursor-pointer relative flex flex-col justify-between ${
                  selectedPackage === 'mezcla'
                    ? 'bg-[#151722] border-rose-500 shadow-xl shadow-rose-950/30 ring-1 ring-rose-500/50'
                    : 'bg-[#10121a] border-zinc-800/90 hover:border-zinc-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-mono font-bold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 px-2 py-0.5 rounded">
                      Post-Producción
                    </span>
                    <span className="text-base font-bold text-white font-mono">$125 USD</span>
                  </div>
                  <h4 className="text-sm font-bold text-white mt-2.5">Solo Mezcla &amp; Master</h4>
                  <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                    Envías tus canales grabados y beat. Mezcla multitrack, afinación Melodyne y master comercial listo para streaming.
                  </p>
                </div>
                <div className="mt-3.5 pt-2.5 border-t border-zinc-800/80 flex items-center justify-between text-[11px]">
                  <span className="text-zinc-400">Depósito 50%: <strong className="text-white">$62.50</strong></span>
                  <span className="text-rose-400 font-medium">Elegir →</span>
                </div>
              </div>
            </div>
          )}

          {/* COMBOS DE TEMAS */}
          {tarifasCategory === 'combos' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-fadeIn">
              {/* Combo 1: 3 Canciones */}
              <div
                onClick={() => handleSelectPackage('combo_3')}
                className={`p-5 rounded-xl border transition-all duration-200 cursor-pointer flex flex-col justify-between ${
                  selectedPackage === 'combo_3'
                    ? 'bg-[#151722] border-rose-500 shadow-xl shadow-rose-950/30 ring-1 ring-rose-500/50'
                    : 'bg-[#10121a] border-zinc-800/90 hover:border-zinc-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-mono font-bold bg-rose-500/20 text-rose-300 px-2.5 py-0.5 rounded">
                      Pack 3 Canciones
                    </span>
                    <div className="text-right">
                      <span className="text-xs text-zinc-500 line-through font-mono mr-2">$600</span>
                      <span className="text-lg font-bold text-white font-mono">$425 USD</span>
                    </div>
                  </div>
                  <h4 className="text-sm font-bold text-white mt-2.5">Combo 3 Canciones</h4>
                  <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                    3 temas completos con grabación de voces, mezcla multitrack, afinación y master listo para plataformas. Ahorras $175 USD.
                  </p>
                  <div className="mt-2.5 text-[11px] text-zinc-400 font-mono bg-black/40 p-2.5 rounded border border-zinc-800">
                    Depósito Requerido (50%): <strong className="text-rose-400">$212.50 USD</strong>
                  </div>
                </div>
                <div className="mt-4 pt-2.5 border-t border-zinc-800 flex justify-between items-center text-[11px]">
                  <span className="text-emerald-400 font-mono">Ahorro -$175 USD</span>
                  <span className="text-rose-400 font-medium">Elegir Combo 3 Temas →</span>
                </div>
              </div>

              {/* Combo 2: 4 Canciones */}
              <div
                onClick={() => handleSelectPackage('combo_4')}
                className={`p-5 rounded-xl border transition-all duration-200 cursor-pointer flex flex-col justify-between ${
                  selectedPackage === 'combo_4'
                    ? 'bg-[#151722] border-rose-500 shadow-xl shadow-rose-950/30 ring-1 ring-rose-500/50'
                    : 'bg-[#10121a] border-zinc-800/90 hover:border-zinc-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-mono font-bold bg-rose-500/20 text-rose-300 px-2.5 py-0.5 rounded">
                      Pack 4 Canciones
                    </span>
                    <div className="text-right">
                      <span className="text-xs text-zinc-500 line-through font-mono mr-2">$800</span>
                      <span className="text-lg font-bold text-white font-mono">$550 USD</span>
                    </div>
                  </div>
                  <h4 className="text-sm font-bold text-white mt-2.5">Combo 4 Canciones</h4>
                  <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                    4 temas completos con grabación de voces, mezcla multitrack, afinación y master comercial. Ahorras $250 USD.
                  </p>
                  <div className="mt-2.5 text-[11px] text-zinc-400 font-mono bg-black/40 p-2.5 rounded border border-zinc-800">
                    Depósito Requerido (50%): <strong className="text-rose-400">$275.00 USD</strong>
                  </div>
                </div>
                <div className="mt-4 pt-2.5 border-t border-zinc-800 flex justify-between items-center text-[11px]">
                  <span className="text-emerald-400 font-mono">Ahorro -$250 USD</span>
                  <span className="text-rose-400 font-medium">Elegir Combo 4 Temas →</span>
                </div>
              </div>
            </div>
          )}

          {/* PRODUCTORES & BEATMAKERS */}
          {tarifasCategory === 'productores' && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-fadeIn">
              <div
                onClick={() => handleSelectPackage('prod_cuarto')}
                className={`p-4 rounded-xl border transition-all duration-200 cursor-pointer flex flex-col justify-between ${
                  selectedPackage === 'prod_cuarto'
                    ? 'bg-[#151722] border-rose-500 shadow-xl ring-1 ring-rose-500/50'
                    : 'bg-[#10121a] border-zinc-800/90 hover:border-zinc-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded">
                      Cuarto de Control
                    </span>
                    <span className="text-base font-bold text-white font-mono">$35 / h</span>
                  </div>
                  <h4 className="text-sm font-bold text-white mt-2.5">Solo Cuarto (Beats)</h4>
                  <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                    Sala de control, monitores Focal y acústica para producir tus temas (Mínimo 3h = $105 USD).
                  </p>
                </div>
                <div className="mt-3.5 pt-2.5 border-t border-zinc-800 text-[11px] flex justify-between text-zinc-400">
                  <span>Mínimo 3 horas</span>
                  <span className="text-rose-400 font-medium">Elegir →</span>
                </div>
              </div>

              <div
                onClick={() => handleSelectPackage('prod_artista')}
                className={`p-4 rounded-xl border transition-all duration-200 cursor-pointer flex flex-col justify-between ${
                  selectedPackage === 'prod_artista'
                    ? 'bg-[#151722] border-rose-500 shadow-xl ring-1 ring-rose-500/50'
                    : 'bg-[#10121a] border-zinc-800/90 hover:border-zinc-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded">
                      Sin Ingeniero
                    </span>
                    <span className="text-base font-bold text-white font-mono">$50 / h</span>
                  </div>
                  <h4 className="text-sm font-bold text-white mt-2.5">Productor + Artista</h4>
                  <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                    Graba a tu propio artista operando tú mismo la cabina tratada y microfonía de estudio (Mínimo 2h = $100 USD).
                  </p>
                </div>
                <div className="mt-3.5 pt-2.5 border-t border-zinc-800 text-[11px] flex justify-between text-zinc-400">
                  <span>Mínimo 2 horas</span>
                  <span className="text-rose-400 font-medium">Elegir →</span>
                </div>
              </div>

              <div
                onClick={() => handleSelectPackage('prod_eng')}
                className={`p-4 rounded-xl border transition-all duration-200 cursor-pointer flex flex-col justify-between ${
                  selectedPackage === 'prod_eng'
                    ? 'bg-[#151722] border-rose-500 shadow-xl ring-1 ring-rose-500/50'
                    : 'bg-[#10121a] border-zinc-800/90 hover:border-zinc-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded">
                      Asistencia Badlenz
                    </span>
                    <span className="text-base font-bold text-white font-mono">$75 / h</span>
                  </div>
                  <h4 className="text-sm font-bold text-white mt-2.5">Productor + Engineering</h4>
                  <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                    Tú diriges la producción musical mientras Badlenz opera niveles, ruteo y tracking profesional.
                  </p>
                </div>
                <div className="mt-3.5 pt-2.5 border-t border-zinc-800 text-[11px] flex justify-between text-zinc-400">
                  <span>Sesión Asistida</span>
                  <span className="text-rose-400 font-medium">Elegir →</span>
                </div>
              </div>
            </div>
          )}

          {/* BANNER DE UPSELL INTELIGENTE (SCRIPT DE VENTAS DE VOLUMEN) */}
          <div className="bg-gradient-to-r from-red-950/40 via-[#0e1017] to-amber-950/30 border border-amber-500/30 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-xl">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase font-mono font-black text-amber-300">
                    Ahorro por Volumen (EPs & Proyectos)
                  </span>
                  <span className="text-[9px] bg-red-950 text-red-300 px-1.5 py-0.2 rounded font-mono border border-red-800">
                    Ahorras hasta $250
                  </span>
                </div>
                <p className="text-gray-200 font-medium text-xs mt-0.5">
                  ¿Trabajando varias canciones? En vez de individuales, monta tu paquete: <strong>3 canciones por $425</strong> o <strong>4 canciones por $550</strong> con grabación, mezcla y master comercial.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setTarifasCategory('combos');
                handleSelectPackage('combo_3');
              }}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-gray-950 font-black text-xs uppercase tracking-wider transition shrink-0 cursor-pointer shadow-md active:scale-95"
            >
              Ver Packs de Ahorro →
            </button>
          </div>

          {/* TARJETA DEL PROGRAMA DE REFERIDOS ($25 STUDIO CREDIT) */}
          <div className="bg-gradient-to-r from-emerald-950/30 via-[#0a0c12] to-zinc-950 border border-emerald-500/40 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
                <DollarSign className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-mono font-bold text-emerald-400 tracking-wider">
                  Programa de Referidos Oficial
                </span>
                <h4 className="text-sm font-bold text-white mt-0.5">
                  Gana $25 de Crédito para tu Próxima Sesión
                </h4>
                <p className="text-zinc-400 text-xs mt-0.5 leading-relaxed">
                  Refiere a un colega o cantante a La Facultad. Cuando reserve y complete su sesión, recibes <strong>$25 en Studio Credit</strong> directo para tus grabaciones, mezcla, master o beats.
                </p>
              </div>
            </div>
            <a
              href="https://wa.me/17872408627?text=¡Saludos%20Badlenz!%20Quiero%20referir%20a%20un%20colega%20para%20grabar%20en%20La%20Facultad."
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition shrink-0 flex items-center gap-1.5 shadow-lg shadow-emerald-950/50 cursor-pointer active:scale-95"
            >
              <span>Referir Colega</span>
              <span>➔</span>
            </a>
          </div>

          {/* POLÍTICAS DE SALA CLARAS Y TRANSPARENTES */}
          <div className="bg-black/50 p-4 rounded-xl border border-zinc-800/80 text-xs">
            <span className="text-[10px] font-mono text-zinc-400 font-bold uppercase tracking-wider block mb-2">
              Condiciones de Operación · La Facultad Studio
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-zinc-400 text-[11px]">
              <div>
                <strong className="text-white block font-mono">1. Depósito Oficial:</strong>
                <span>$50 por canción individual • 50% para paquetes vía ATH Móvil (787) 240-8627.</span>
              </div>
              <div>
                <strong className="text-white block font-mono">2. Revisiones de Mezcla:</strong>
                <span>2 revisiones gratis incluidas • La 3ra y siguientes: $10 cada una.</span>
              </div>
              <div>
                <strong className="text-white block font-mono">3. Entrega &amp; Backup:</strong>
                <span>Premezcla hoy mismo • Master final comercial en 24 a 48 horas.</span>
              </div>
            </div>
          </div>
        </div>
      </ScrollReveal>

  {/* 3. FORMULARIO PRINCIPAL DE RESERVA & PASE VIP */}
  <ScrollReveal delayMs={100}>
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* FORMULARIO PORTAL DE CLIENTES */}
      <div className="lg:col-span-8 bg-[#0e1017] p-5 sm:p-7 rounded-2xl border border-zinc-800 space-y-5 shadow-2xl">
        {/* Header de la consola de reservas */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800/80 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] bg-rose-500/15 text-rose-300 border border-rose-500/30 font-mono font-bold px-2 py-0.5 rounded uppercase">
                Consola de Reserva
              </span>
              <span className="text-xs text-zinc-400 font-mono">Badlenz · Hormigueros, PR</span>
            </div>
            <h2 className="font-syne text-xl sm:text-2xl font-bold text-white tracking-tight mt-1">
              Agenda Tu Sesión de Grabación
            </h2>
          </div>
        </div>

        {/* STEPPER VISUAL INTERACTIVO DE 3 PASOS */}
        <div id="seccion-calendario-booking" className="bg-[#12141c] p-2 rounded-xl border border-zinc-800 shadow-lg scroll-mt-24">
          <div className="grid grid-cols-3 gap-2 text-center text-xs font-dmsans">
            <button
              type="button"
              onClick={() => {
                setCheckoutStep(1);
                setStepErrors({});
              }}
              className={`py-2.5 px-2 rounded-lg border transition-all font-medium flex items-center justify-center gap-2 cursor-pointer ${
                checkoutStep === 1
                  ? 'bg-rose-600 text-white font-bold border-rose-500 shadow-md shadow-rose-950/40'
                  : 'bg-black/40 border-zinc-800/80 text-zinc-400 hover:text-white'
              }`}
            >
              <span className="w-5 h-5 rounded-full bg-black/40 flex items-center justify-center text-[10px] font-mono shrink-0">1</span>
              <span className="truncate">Fecha &amp; Turno</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setCheckoutStep(2);
                setStepErrors({});
              }}
              className={`py-2.5 px-2 rounded-lg border transition-all font-medium flex items-center justify-center gap-2 cursor-pointer ${
                checkoutStep === 2
                  ? 'bg-rose-600 text-white font-bold border-rose-500 shadow-md shadow-rose-950/40'
                  : 'bg-black/40 border-zinc-800/80 text-zinc-400 hover:text-white'
              }`}
            >
              <span className="w-5 h-5 rounded-full bg-black/40 flex items-center justify-center text-[10px] font-mono shrink-0">2</span>
              <span className="truncate">Datos Artista</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setCheckoutStep(3);
                setStepErrors({});
              }}
              className={`py-2.5 px-2 rounded-lg border transition-all font-medium flex items-center justify-center gap-2 cursor-pointer ${
                checkoutStep === 3
                  ? 'bg-rose-600 text-white font-bold border-rose-500 shadow-md shadow-rose-950/40'
                  : 'bg-black/40 border-zinc-800/80 text-zinc-400 hover:text-white'
              }`}
            >
              <span className="w-5 h-5 rounded-full bg-black/40 flex items-center justify-center text-[10px] font-mono shrink-0">3</span>
              <span className="truncate">Depósito &amp; Pase</span>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 text-xs">
          {/* ========================================================= */}
          {/* PASO 1: ESCOGES TU FECHA Y TURNO                          */}
          {/* ========================================================= */}
          {checkoutStep === 1 && (
            <div className="space-y-4 animate-fadeIn">
              <div className="bg-[#111827] p-4 sm:p-5 rounded-xl border border-gray-800 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-800 pb-3">
                  <div>
                    <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest font-mono">
                      PASO 1 DE 3 • DISPONIBILIDAD EN VIVO
                    </span>
                    <h3 className="text-sm sm:text-base font-black text-white uppercase tracking-wider mt-0.5">
                      Selecciona tu Día en el Calendario & Turno de Cabina
                    </h3>
                  </div>
                  <span className="text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800 px-2.5 py-1 rounded-full font-mono font-bold self-start sm:self-auto">
                    🟢 Días en Verde = Disponibles
                  </span>
                </div>

                {/* Selección compacta y ágil de paquete en Paso 1 */}
                <div className="bg-black/60 p-3.5 rounded-xl border border-gray-800 space-y-2.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-gray-400 font-bold uppercase text-[10px] tracking-wider">Paquete Activo:</span>
                      <span className="text-amber-400 font-black font-mono bg-amber-950/70 border border-amber-800/60 px-2.5 py-0.5 rounded text-xs flex items-center gap-1.5 shadow-sm">
                        <span>🔥</span>
                        {selectedPackage === 'promo' && 'Promo Reapertura · $130 USD'}
                        {selectedPackage === 'pro' && 'Sesión Pro (Voz+Master) · $200 USD'}
                        {selectedPackage === 'full' && 'Full Pack (Beat+Voces) · $350 USD'}
                        {selectedPackage === 'mezcla' && 'Solo Mezcla & Master · $125 USD'}
                        {selectedPackage === 'combo_3' && 'Combo 3 Canciones · $425 USD'}
                        {selectedPackage === 'combo_4' && 'Combo 4 Canciones · $550 USD'}
                      </span>
                    </div>

                    <span className="text-[10px] text-emerald-400 font-mono font-bold bg-emerald-950/60 border border-emerald-800/40 px-2 py-0.5 rounded self-start sm:self-auto">
                      Depósito Hoy: {formatMoney(deposito)} USD por ATH Móvil
                    </span>
                  </div>

                  {/* Pills compactas para cambiar de paquete al instante */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-gray-800/80">
                    <span className="text-[10px] text-gray-500 font-medium mr-1 hidden sm:inline">Cambiar a:</span>
                    {[
                      { id: 'promo', label: '🔥 Promo ($130)' },
                      { id: 'pro', label: '⚡ Sesión Pro ($200)' },
                      { id: 'full', label: '★ Full Pack ($350)' },
                      { id: 'mezcla', label: '🎚️ Solo Mezcla ($125)' }
                    ].map(p => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => handleSelectPackage(p.id as any)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                          selectedPackage === p.id 
                            ? 'bg-gradient-to-r from-red-600 to-amber-500 text-white shadow-md font-black ring-1 ring-amber-400' 
                            : 'bg-[#181820] hover:bg-gray-800 text-gray-400 hover:text-white border border-gray-800'
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* EL CALENDARIO INTERACTIVO (DÍAS VERDE / ROJO) */}
                <div className="space-y-3">
                  <div className="bg-black/60 p-3 rounded-2xl border border-gray-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-md">
                    <span className="text-gray-200 font-bold text-xs">
                      Toca tu día en el calendario de disponibilidad en vivo:
                    </span>
                    <div className="flex items-center gap-2 self-start sm:self-auto">
                      <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                      <span className="text-xs font-mono font-bold text-amber-300 bg-amber-950/80 border border-amber-500/60 px-3 py-1 rounded-xl shadow">
                        Día Seleccionado: {formData.fecha} ✓
                      </span>
                    </div>
                  </div>
                  
                  <CalendarioSection 
                    selectedDate={formData.fecha}
                    onSelectSlot={(slot) => {
                      const diaStr = String(slot.diaNumero).padStart(2, '0');
                      const fechaSeleccionada = slot.fechaStr || `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${diaStr}`;
                      const bloques = generarBloquesDeSesion(slot.horarioPermitido);
                      const primerBloque = bloques[0] || { start: '13:00', end: '17:00' };
                      setFormData(prev => ({
                        ...prev,
                        fecha: fechaSeleccionada,
                        horaInicio: primerBloque.start,
                        horaSalida: primerBloque.end
                      }));
                      showToast(`📅 Día ${slot.diaNumero} seleccionado con éxito`, 'success');
                    }} 
                  />
                </div>

                {/* BLOQUES OFICIALES DE HORARIO BADLENZ (2 TURNOS DIARIOS) */}
                <div className="pt-2 border-t border-gray-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-200 flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-amber-400" />
                      <span>Elige uno de los 2 Bloques Diarios Oficiales:</span>
                    </span>
                    <span className="text-[10px] text-zinc-400 font-mono">4 Horas en Cabina · Máx. 5h</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {bloquesDisponibles.map((bloque) => {
                      const isSelected = formData.horaInicio === bloque.start && formData.horaSalida === bloque.end;
                      return (
                        <button
                          key={bloque.label}
                          type="button"
                          onClick={() => {
                            setFormData(prev => ({
                              ...prev,
                              horaInicio: bloque.start,
                              horaSalida: bloque.end
                            }));
                          }}
                          className={`p-3.5 rounded-xl border text-left transition-all flex items-center justify-between gap-3 cursor-pointer ${
                            isSelected
                              ? 'bg-gradient-to-r from-amber-500/20 to-red-950/40 border-amber-400 text-white font-bold ring-2 ring-amber-400/50 shadow-[0_0_20px_rgba(245,158,11,0.25)]'
                              : 'bg-black/40 border-gray-800 hover:border-gray-700 text-gray-400 hover:text-gray-200'
                          }`}
                        >
                          <div>
                            <span className="text-xs font-bold block uppercase tracking-wide text-white">{bloque.label}</span>
                            <span className="text-xs font-mono text-amber-300 font-bold block mt-0.5">{bloque.desc}</span>
                            <span className="text-[10px] text-zinc-400 block mt-0.5">Incluye Premezcla al terminar la sesión</span>
                          </div>
                          <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                            isSelected ? 'border-amber-400 bg-amber-400 text-black' : 'border-gray-700'
                          }`}>
                            {isSelected && <span className="text-xs font-black">✓</span>}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* TARJETA RESUMEN EN VIVO DE FECHA Y HORARIO */}
                <div className="bg-[#1e1e1e] p-4 rounded-xl border border-gray-700 flex flex-wrap justify-between items-center gap-3">
                  <div>
                    <span className="text-[10px] text-gray-400 uppercase font-mono block">TURNO SELECCIONADO</span>
                    <p className="text-emerald-400 font-black text-sm">
                      📅 {formData.fecha} • ⏰ {format12h(formData.horaInicio)} a {format12h(formData.horaSalida)}
                    </p>
                    <span className="text-[11px] text-gray-300">
                      Cabina acústica tratada + monitoreo profesional listo para tu sesión.
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-gray-400 font-mono uppercase block">INVERSIÓN TOTAL</span>
                    <strong className="text-white font-mono text-base">{formatMoney(subtotal)} USD</strong>
                    <span className="text-amber-400 text-xs block font-bold font-mono">
                      Depósito Hoy: {formatMoney(deposito)} USD
                    </span>
                  </div>
                </div>

                {/* BOTÓN CONTINUAR A PASO 2 */}
                <button
                  type="button"
                  onClick={() => {
                    if (!formData.fecha) {
                      setFormData(prev => ({ ...prev, fecha: new Date().toISOString().split('T')[0] }));
                    }
                    setCheckoutStep(2);
                  }}
                  className="w-full py-4 bg-gradient-to-r from-red-600 via-amber-600 to-amber-500 hover:from-red-500 hover:to-amber-400 text-white font-black text-sm uppercase tracking-wider rounded-xl shadow-xl transition flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                >
                  <span>Continuar a Datos del Artista (Paso 2)</span>
                  <span>➔</span>
                </button>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* PASO 2: LOS 4 DATOS CLAVE DEL ARTISTA (SIN TRÁMITES)      */}
          {/* ========================================================= */}
          {checkoutStep === 2 && (
            <div className="space-y-4 animate-fadeIn">
              <div className="bg-[#111827] p-4 sm:p-6 rounded-2xl border border-gray-800 space-y-4 shadow-xl">
                <div className="border-b border-gray-800 pb-3">
                  <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest font-mono">
                    PASO 2 DE 3 • REGISTRO DE CABINA
                  </span>
                  <h3 className="text-sm sm:text-base font-black text-white uppercase tracking-wider mt-0.5">
                    ¿Quién va a romper en el micrófono?
                  </h3>
                  <p className="text-xs text-gray-400 mt-1">
                    Solo 4 datos clave para emitir tu Pase VIP y preparar la plantilla de Pro Tools en Hormigueros.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* CAMPO 1: NOMBRE ARTÍSTICO */}
                  <div>
                    <label className="block text-gray-300 font-bold mb-1 text-xs">
                      1. Nombre Artístico / Proyecto: <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Ej: El King / D-Flow / Tu Marca"
                      className={`w-full bg-[#1e1e1e] text-white p-3 rounded-xl border text-xs focus:outline-none transition ${
                        stepErrors.nombreArtistico ? 'border-red-500 bg-red-950/20' : 'border-gray-700 focus:border-amber-500'
                      }`}
                      value={formData.nombreArtistico}
                      onChange={e => {
                        setFormData({ 
                          ...formData, 
                          nombreArtistico: e.target.value,
                          nombreReal: formData.nombreReal || e.target.value 
                        });
                        setStepErrors(prev => ({ ...prev, nombreArtistico: undefined }));
                      }}
                    />
                    {stepErrors.nombreArtistico && (
                      <p className="text-[10px] text-red-400 mt-1 font-bold">⚠️ {stepErrors.nombreArtistico}</p>
                    )}
                  </div>

                  {/* CAMPO 2: WHATSAPP / CELULAR */}
                  <div>
                    <label className="block text-gray-300 font-bold mb-1 text-xs">
                      2. Número de WhatsApp / Celular: <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      placeholder="+1 (787) 240-8627"
                      className={`w-full bg-[#1e1e1e] text-white p-3 rounded-xl border text-xs font-mono focus:outline-none transition ${
                        stepErrors.telefono ? 'border-red-500 bg-red-950/20' : 'border-gray-700 focus:border-amber-500'
                      }`}
                      value={formData.telefono}
                      onChange={e => {
                        setFormData({ ...formData, telefono: e.target.value });
                        setStepErrors(prev => ({ ...prev, telefono: undefined }));
                      }}
                    />
                    {stepErrors.telefono && (
                      <p className="text-[10px] text-red-400 mt-1 font-bold">⚠️ {stepErrors.telefono}</p>
                    )}
                    <span className="text-[10px] text-gray-500 block mt-1">
                      * Te enviamos el comprobante y pin de GPS por WhatsApp.
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* CAMPO 3: NOMBRE COMPLETO REAL (OPCIONAL) */}
                  <div>
                    <label className="block text-gray-300 font-bold mb-1 text-xs">
                      3. Tu Nombre Completo: <span className="text-gray-500 font-normal">(Opcional para recibo)</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Ej: Manuel E. Ramírez"
                      className="w-full bg-[#1e1e1e] text-white p-3 rounded-xl border border-gray-700 focus:border-amber-500 focus:outline-none text-xs"
                      value={formData.nombreReal}
                      onChange={e => setFormData({ ...formData, nombreReal: e.target.value })}
                    />
                  </div>

                  {/* CAMPO 4: NOTAS ADICIONALES */}
                  <div>
                    <label className="block text-gray-300 font-bold mb-1 text-xs">
                      4. Notas adicionales o referencias: <span className="text-amber-400 font-normal">(Opcional)</span>
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Ej: Estilo reggaetón comercial, voces al frente, dobles limpios..."
                      className="w-full bg-[#1e1e1e] text-white p-2.5 rounded-xl border border-gray-700 focus:border-amber-500 focus:outline-none text-xs"
                      value={formData.referencias}
                      onChange={e => setFormData({ ...formData, referencias: e.target.value })}
                    />
                  </div>
                </div>

                {/* PRO TOOLS FAST-PASS: PREPARACIÓN DE BEAT / INSTRUMENTAL */}
                <div className="bg-[#12141f] border-2 border-amber-500/40 rounded-2xl p-4 sm:p-5 space-y-3.5 shadow-xl">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-800 pb-2.5">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="bg-amber-500 text-gray-950 text-[10px] font-black uppercase px-2 py-0.5 rounded font-mono">
                          PRO TOOLS FAST-PASS
                        </span>
                        <span className="text-emerald-400 font-bold text-[11px] font-mono">
                          ⚡ Ahorra 20 Minutos de Cabina
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-white uppercase tracking-tight mt-1">
                        Tu Pista / Beat para el Día de la Grabación
                      </h4>
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        Badlenz preparará tu sesión de Pro Tools con el tempo (BPM) y la escala de Auto-Tune antes de que entres a cabina. ¡Llegas directo a cantar!
                      </p>
                    </div>
                  </div>

                  {/* Selector de Método: Subir archivo vs Link vs Pendrive */}
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, tipoInstrumental: 'upload' }))}
                      className={`p-2.5 rounded-xl border text-xs font-bold transition flex flex-col items-center justify-center gap-1 text-center cursor-pointer ${
                        formData.tipoInstrumental === 'upload'
                          ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow'
                          : 'bg-black/40 border-gray-800 text-gray-400 hover:text-white'
                      }`}
                    >
                      <UploadCloud className="w-4 h-4" />
                      <span>Subir Beat (MP3/WAV)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, tipoInstrumental: 'youtube' }))}
                      className={`p-2.5 rounded-xl border text-xs font-bold transition flex flex-col items-center justify-center gap-1 text-center cursor-pointer ${
                        formData.tipoInstrumental === 'youtube'
                          ? 'bg-red-500/20 border-red-500 text-red-300 shadow'
                          : 'bg-black/40 border-gray-800 text-gray-400 hover:text-white'
                      }`}
                    >
                      <Youtube className="w-4 h-4" />
                      <span>Link YouTube / Drive</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, tipoInstrumental: 'pendrive' }))}
                      className={`p-2.5 rounded-xl border text-xs font-bold transition flex flex-col items-center justify-center gap-1 text-center cursor-pointer ${
                        formData.tipoInstrumental === 'pendrive'
                          ? 'bg-gray-700/50 border-gray-400 text-white shadow'
                          : 'bg-black/40 border-gray-800 text-gray-400 hover:text-white'
                      }`}
                    >
                      <Smartphone className="w-4 h-4" />
                      <span>Traigo USB / AirDrop</span>
                    </button>
                  </div>

                  {/* Panel según opción seleccionada */}
                  {formData.tipoInstrumental === 'upload' && (
                    <div className="space-y-2 bg-black/60 p-3 rounded-xl border border-gray-800">
                      <label className="block text-[11px] text-gray-300 font-bold mb-1">
                        Selecciona el archivo de tu pista desde tu celular o computadora:
                      </label>
                      <input
                        type="file"
                        accept="audio/*"
                        onChange={handleFileSelect}
                        className="block w-full text-xs text-gray-400 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-amber-500 file:text-gray-950 hover:file:bg-amber-400 cursor-pointer"
                      />
                      {archivosSubidos.length > 0 && (
                        <div className="space-y-1.5 pt-2">
                          {archivosSubidos.map((f, idx) => (
                            <div key={idx} className="flex items-center justify-between bg-emerald-950/40 border border-emerald-500/40 px-3 py-1.5 rounded-lg text-xs">
                              <span className="text-emerald-300 font-mono flex items-center gap-1.5 truncate">
                                <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                {f.nombre} ({f.tamano})
                              </span>
                              <button
                                type="button"
                                onClick={() => handleRemoveFile(idx)}
                                className="text-red-400 hover:text-red-300 p-1 cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {formData.tipoInstrumental === 'youtube' && (
                    <div className="space-y-2 bg-black/60 p-3 rounded-xl border border-gray-800">
                      <label className="block text-[11px] text-gray-300 font-bold mb-1">
                        Pega aquí el enlace de YouTube, SoundCloud, Drive o BeatStars:
                      </label>
                      <input
                        type="url"
                        placeholder="https://www.youtube.com/watch?v=..."
                        value={formData.linkYoutube}
                        onChange={e => setFormData(prev => ({ ...prev, linkYoutube: e.target.value }))}
                        className="w-full bg-[#1e1e1e] text-white p-2.5 rounded-xl border border-gray-700 focus:border-amber-500 text-xs font-mono"
                      />
                      {formData.linkYoutube && (
                        <p className="text-[10px] text-emerald-400 font-mono">
                          ✓ Enlace registrado: Badlenz descargará y calibrará la pista antes de tu turno.
                        </p>
                      )}
                    </div>
                  )}

                  {formData.tipoInstrumental === 'pendrive' && (
                    <div className="bg-black/60 p-3 rounded-xl border border-gray-800 text-[11px] text-gray-300">
                      <p>
                        ✓ <strong>Entendido:</strong> Traerás tu instrumental en tu pendrive USB, disco externo o te la pasas por AirDrop con Badlenz al entrar a cabina.
                      </p>
                    </div>
                  )}
                </div>

                {/* STEMS & MULTITRACK YA INCLUIDOS GRATIS */}
                <div className="p-3 bg-emerald-950/30 border border-emerald-500/40 rounded-xl flex items-center gap-2.5 text-xs text-emerald-300">
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>
                    <strong>Stems multitrack y WAV 24-bit incluidos:</strong> Recibes tus pistas separadas y master comercial de alta fidelidad incluidos en tu sesión sin cargos adicionales.
                  </span>
                </div>

                {/* BOTONES DE NAVEGACIÓN PASO 2 */}
                <div className="flex flex-col sm:flex-row gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setCheckoutStep(1)}
                    className="px-5 py-3.5 bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold rounded-xl text-xs transition border border-gray-700"
                  >
                    ← Volver al Calendario
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const errors: { nombreArtistico?: string; telefono?: string } = {};
                      if (!formData.nombreArtistico.trim()) {
                        errors.nombreArtistico = 'Ingresa tu nombre artístico';
                      }
                      if (!formData.telefono.trim()) {
                        errors.telefono = 'Ingresa tu WhatsApp o celular';
                      }
                      if (Object.keys(errors).length > 0) {
                        setStepErrors(errors);
                        showToast('Por favor completa tu Nombre Artístico y Teléfono para emitir tu Pase VIP.', 'warning');
                        return;
                      }
                      setStepErrors({});
                      setCheckoutStep(3);
                    }}
                    className="flex-1 py-3.5 bg-gradient-to-r from-red-600 via-amber-600 to-amber-500 hover:from-red-500 hover:to-amber-400 text-white font-black text-sm uppercase tracking-wider rounded-xl shadow-xl transition flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                  >
                    <span>Continuar a Depósito ATH Móvil (${deposito}) (Paso 3)</span>
                    <span>➔</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* PASO 3: ENVÍAS LOS $50 DE DEPÓSITO POR ATH MÓVIL Y PASE   */}
          {/* ========================================================= */}
          {checkoutStep === 3 && (
            <div className="space-y-4 animate-fadeIn">
              <div className="bg-[#111827] p-4 sm:p-5 rounded-xl border border-gray-800 space-y-4">
                <div className="border-b border-gray-800 pb-3">
                  <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest font-mono">
                    PASO 3 DE 3 • CONFIRMACIÓN DE DEPÓSITO
                  </span>
                  <h3 className="text-sm sm:text-base font-black text-white uppercase tracking-wider mt-0.5">
                    Envía tu Depósito de {formatMoney(deposito)} por ATH Móvil & Recibe tu Pase VIP
                  </h3>
                  <p className="text-xs text-gray-400 mt-1">
                    El anticipo congela tu fecha en cabina para que nadie más tome tu turno.
                  </p>
                </div>

                {/* DESGLOSE FINANCIERO CLARO */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="bg-black/50 p-3.5 rounded-xl border border-gray-800 text-center">
                    <span className="text-[10px] text-gray-400 font-mono uppercase block">Total Sesión</span>
                    <strong className="text-white text-base font-mono block mt-0.5">{formatMoney(subtotal)} USD</strong>
                    <span className="text-[10px] text-gray-400">{formData.fecha} ({format12h(formData.horaInicio)} - {format12h(formData.horaSalida)})</span>
                  </div>

                  <div className="bg-amber-950/40 p-3.5 rounded-xl border border-amber-500/60 text-center">
                    <span className="text-[10px] text-amber-400 font-mono uppercase font-black block">DEPÓSITO REQUERIDO</span>
                    <strong className="text-amber-400 text-xl font-mono font-black block mt-0.5">{formatMoney(deposito)} USD</strong>
                    <span className="text-[10px] text-amber-300 font-bold">Vía ATH Móvil</span>
                  </div>

                  <div className="bg-black/50 p-3.5 rounded-xl border border-gray-800 text-center">
                    <span className="text-[10px] text-gray-400 font-mono uppercase block">Saldo al Llegar</span>
                    <strong className="text-emerald-400 text-base font-mono block mt-0.5">{formatMoney(balance)} USD</strong>
                    <span className="text-[10px] text-gray-400">Se liquida en cabina</span>
                  </div>
                </div>

                {/* TARJETA INTERACTIVA DE ATH MÓVIL EN PUERTO RICO */}
                <div className="bg-gradient-to-r from-[#ff6b00]/15 via-black to-[#009fe3]/15 border-2 border-[#ff6b00]/70 p-4 rounded-xl space-y-3 shadow-xl">
                  <div className="flex items-center justify-between border-b border-gray-800 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="bg-[#ff6b00] text-white font-black text-[10px] uppercase px-2.5 py-0.5 rounded tracking-wider">
                        ATH MÓVIL OFICIAL
                      </span>
                      <span className="text-white font-black text-xs">
                        Transferencia Personal en Puerto Rico
                      </span>
                    </div>
                    <span className="text-xs text-amber-400 font-mono font-black">
                      Monto: {formatMoney(deposito)} USD
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    {/* Botón copiar teléfono */}
                    <div className="bg-black/70 p-3 rounded-xl border border-gray-800 flex items-center justify-between">
                      <div>
                        <span className="text-[9px] uppercase font-mono text-gray-400 block font-bold">
                          Número de ATH Móvil
                        </span>
                        <strong className="text-white font-mono text-base tracking-wide">
                          (787) 240-8627
                        </strong>
                        <span className="text-[10px] text-amber-400 block">
                          Destinatario: Badlenz (Personal)
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={handleCopyAthPhone}
                        className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-red-600 via-amber-600 to-amber-500 hover:from-red-500 hover:to-amber-400 text-white font-black transition text-xs flex items-center gap-1.5 active:scale-95 shadow-md cursor-pointer shrink-0"
                      >
                        {copiedAthPhone ? (
                          <>
                            <Check className="w-4 h-4 text-emerald-200" />
                            <span className="text-emerald-200">¡Copiado!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4 text-amber-200" />
                            <span>Copiar Teléfono</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Botón copiar monto */}
                    <div className="bg-black/70 p-3 rounded-xl border border-gray-800 flex items-center justify-between">
                      <div>
                        <span className="text-[9px] uppercase font-mono text-gray-400 block font-bold">
                          Monto a Transferir
                        </span>
                        <strong className="text-amber-400 font-mono text-base">
                          {formatMoney(deposito)} USD
                        </strong>
                        <span className="text-[10px] text-gray-400 block">
                          Nota: "{formData.nombreArtistico || 'Tu Nombre'} - {formData.fecha}"
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={handleCopyAthAmount}
                        className="px-3 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-200 transition text-xs font-bold flex items-center gap-1 active:scale-95"
                      >
                        {copiedAthAmount ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-emerald-400">¡Copiado!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 text-amber-400" />
                            <span>Copiar Monto</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Campo opcional de referencia */}
                  <div>
                    <label className="block text-gray-300 text-[11px] font-bold mb-1">
                      Número de Confirmación / Referencia de ATH Móvil <span className="text-gray-500 font-normal">(Opcional):</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Ej: 098432 o pega el número de confirmación aquí"
                      className="w-full bg-[#1e1e1e] text-white p-2.5 rounded-xl border border-gray-700 focus:border-amber-500 focus:outline-none text-xs font-mono"
                      value={athNumReferenciaInput}
                      onChange={e => setAthNumReferenciaInput(e.target.value)}
                    />
                  </div>
                </div>

                {/* ========================================================= */}
                {/* SUBIDA DE CAPTURA DE PANTALLA ATH MÓVIL (REQUERIDO)        */}
                {/* ========================================================= */}
                <div className="bg-[#181820] border-2 border-dashed border-amber-500/60 hover:border-amber-400 p-4 sm:p-5 rounded-2xl space-y-3.5 transition shadow-lg">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-800 pb-2.5">
                    <div>
                      <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest font-mono flex items-center gap-1.5">
                        <Camera className="w-3.5 h-3.5" />
                        Captura de Tarjeta / Transferencia ATH Móvil
                      </span>
                      <h4 className="text-xs sm:text-sm text-white font-black uppercase tracking-wide mt-0.5">
                        Envía la captura de tu depósito de {formatMoney(deposito)} USD
                      </h4>
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        Adjunta la captura de tu app de ATH Móvil para activar tu Pase VIP de inmediato y apartar tu fecha.
                      </p>
                    </div>
                    {athComprobanteUrl ? (
                      <span className="text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800 px-3 py-1 rounded-full font-bold self-start sm:self-auto flex items-center gap-1.5 shadow">
                        <Check className="w-3.5 h-3.5" /> Captura Adjunta ✓
                      </span>
                    ) : (
                      <span className="text-[10px] bg-red-950/80 text-red-300 border border-red-800 px-3 py-1 rounded-full font-bold self-start sm:self-auto flex items-center gap-1">
                        📸 Foto Recomendada
                      </span>
                    )}
                  </div>

                  {athComprobanteUrl ? (
                    <div className="space-y-3 bg-black/60 p-3 rounded-xl border border-emerald-500/40">
                      <div className="relative rounded-xl overflow-hidden border border-emerald-500/50 bg-black/80 max-h-52 flex items-center justify-center p-2">
                        <img
                          src={athComprobanteUrl}
                          alt="Comprobante ATH Móvil"
                          className="max-h-48 rounded-lg object-contain"
                        />
                        <div className="absolute top-2 right-2 bg-emerald-900/90 text-emerald-200 text-[10px] font-mono font-bold px-2.5 py-1 rounded-lg shadow">
                          {athComprobanteNombre || 'captura_ath_movil.png'}
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs pt-1">
                        <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                          <Check className="w-4 h-4" /> Comprobante cargado listo para verificación de Badlenz
                        </span>
                        <div className="flex items-center gap-3">
                          <label className="text-amber-400 hover:text-amber-300 text-[11px] font-bold underline cursor-pointer">
                            Cambiar captura
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleAthScreenshotUpload}
                              className="hidden"
                            />
                          </label>
                          <button
                            type="button"
                            onClick={handleRemoveAthScreenshot}
                            className="text-red-400 hover:text-red-300 text-[11px] font-bold underline cursor-pointer"
                          >
                            Eliminar
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex flex-col sm:flex-row items-center gap-3">
                        <label className="flex-1 w-full flex items-center justify-center gap-2 bg-gradient-to-r from-red-600 via-amber-600 to-amber-500 hover:from-red-500 hover:to-amber-400 text-white font-black py-3.5 px-4 rounded-xl text-xs uppercase tracking-wider cursor-pointer shadow-xl transition active:scale-95 text-center">
                          <Camera className="w-4 h-4" />
                          <span>📷 Tomar Foto / 📁 Subir Captura de ATH Móvil</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleAthScreenshotUpload}
                            className="hidden"
                          />
                        </label>
                      </div>
                      <p className="text-[10px] text-gray-400 text-center leading-relaxed">
                        Transfiere tu depósito de <strong>{formatMoney(deposito)} USD</strong> al <strong>(787) 240-8627</strong> y sube aquí la captura que confirme la transacción.
                      </p>
                    </div>
                  )}

                  {/* VÍA ALTERNATIVA WHATSAPP */}
                  <div className="pt-2 border-t border-gray-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-[11px] text-gray-400">
                    <span>¿Prefieres enviar la captura directamente desde WhatsApp?</span>
                    <a
                      href={`https://wa.me/17872408627?text=${encodeURIComponent(
                        `¡Hola Badlenz! Estoy terminando mi reserva para ${formData.nombreArtistico || 'mi sesión'} del ${formData.fecha}. Te adjunto por aquí la captura de ATH Móvil del depósito de $${deposito} USD.`
                      )}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1.5 self-start sm:self-auto"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>Enviar captura a Badlenz por WhatsApp 💬</span>
                    </a>
                  </div>
                </div>

                {/* AVISO DE TRANQUILIDAD: REGLAS Y FIRMA EN CABINA */}
                <div className="bg-black/50 p-3.5 rounded-xl border border-gray-800 text-[11px] text-gray-300 space-y-1">
                  <p className="font-bold text-amber-400 flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4 text-amber-400" />
                    <span>Reglas de Oro del Estudio (Firma Cómoda al Llegar):</span>
                  </p>
                  <p>
                    • Cuentas con <strong>20 minutos de gracia</strong> al inicio de tu sesión en Hormigueros.<br/>
                    • Máximo <strong>2 acompañantes</strong> en cabina para máxima concentración creativa.<br/>
                    • Tu contrato de cesión y firma digital se completan directamente en tu Pase VIP al pisar el estudio.
                  </p>
                </div>

                {/* IDENTIFICACIÓN DEL ARTISTA DIRECTO EN EL PASO 3 (SIN FRICCIÓN NI VUELTAS) */}
                {!formData.nombreArtistico.trim() || !formData.telefono.trim() ? (
                  <div className="bg-gradient-to-r from-amber-950/60 via-black to-red-950/40 border-2 border-amber-500/80 p-4 rounded-xl space-y-3 shadow-lg">
                    <div className="flex items-center justify-between border-b border-amber-900/50 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="bg-amber-500 text-gray-950 text-[10px] font-black uppercase px-2 py-0.5 rounded tracking-wide font-mono">
                          PASO FINAL
                        </span>
                        <span className="text-white font-bold text-xs">
                          Datos Rápidos para Emitir tu Pase VIP
                        </span>
                      </div>
                      <span className="text-[10px] text-amber-400 font-mono">* Requerido para cabina</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div>
                        <label className="text-[11px] text-gray-300 font-bold block mb-1">
                          Nombre Artístico / Proyecto: <span className="text-red-400">*</span>
                        </label>
                        <input
                          type="text"
                          placeholder="Ej: El King / Badlenz"
                          value={formData.nombreArtistico}
                          onChange={e => {
                            setFormData(prev => ({ ...prev, nombreArtistico: e.target.value }));
                            setStepErrors(prev => ({ ...prev, nombreArtistico: undefined }));
                          }}
                          className={`w-full bg-[#1e1e1e] text-white p-2.5 rounded-xl border text-xs focus:outline-none transition ${
                            stepErrors.nombreArtistico ? 'border-red-500 bg-red-950/20' : 'border-gray-700 focus:border-amber-500'
                          }`}
                        />
                        {stepErrors.nombreArtistico && (
                          <p className="text-[10px] text-red-400 mt-1 font-bold">⚠️ {stepErrors.nombreArtistico}</p>
                        )}
                      </div>

                      <div>
                        <label className="text-[11px] text-gray-300 font-bold block mb-1">
                          WhatsApp / Celular: <span className="text-red-400">*</span>
                        </label>
                        <input
                          type="tel"
                          placeholder="+1 (787) 240-8627"
                          value={formData.telefono}
                          onChange={e => {
                            setFormData(prev => ({ ...prev, telefono: e.target.value }));
                            setStepErrors(prev => ({ ...prev, telefono: undefined }));
                          }}
                          className={`w-full bg-[#1e1e1e] text-white p-2.5 rounded-xl border text-xs font-mono focus:outline-none transition ${
                            stepErrors.telefono ? 'border-red-500 bg-red-950/20' : 'border-gray-700 focus:border-amber-500'
                          }`}
                        />
                        {stepErrors.telefono && (
                          <p className="text-[10px] text-red-400 mt-1 font-bold">⚠️ {stepErrors.telefono}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-black/60 border border-gray-800 p-3 rounded-xl flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2.5">
                      <span className="w-6 h-6 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 flex items-center justify-center text-[10px] font-bold">✓</span>
                      <div>
                        <span className="text-[9px] text-gray-400 uppercase font-mono block">Pase VIP emitido para:</span>
                        <strong className="text-white text-xs">{formData.nombreArtistico}</strong>
                        <span className="text-gray-400 text-[11px] ml-2 font-mono">({formData.telefono})</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setCheckoutStep(2)}
                      className="text-amber-400 hover:text-amber-300 text-[11px] font-bold underline cursor-pointer"
                    >
                      Editar datos
                    </button>
                  </div>
                )}

                {/* BOTÓN PRINCIPAL DE GENERAR PASE VIP */}
                <div className="space-y-3 pt-2">
                  <button
                    type="submit"
                    disabled={isSending}
                    className="w-full py-4 bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-gray-950 font-black text-sm sm:text-base uppercase tracking-wider rounded-2xl shadow-[0_0_30px_rgba(16,185,129,0.4)] transition transform hover:scale-[1.01] active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {isSending ? (
                      <>
                        <span className="inline-block animate-spin border-2 border-gray-950 border-t-transparent rounded-full w-4 h-4"></span>
                        <span>Confirmando Reserva...</span>
                      </>
                    ) : (
                      <>
                        <span>📋 Confirmar Reserva & Generar Hoja de Sesión</span>
                      </>
                    )}
                  </button>

                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs pt-1">
                    <button
                      type="button"
                      onClick={() => setCheckoutStep(2)}
                      className="text-gray-400 hover:text-white transition py-1"
                    >
                      ← Volver a modificar mis datos
                    </button>

                    <a
                      href={`https://wa.me/17872408627?text=${encodeURIComponent(
                        `¡Dímelo Badlenz! Acabo de separar fecha para mi sesión en La Facultad Studio:\n\n• Artista: ${formData.nombreArtistico || 'Por confirmar'}\n• Fecha: ${formData.fecha}\n• Turno: ${formData.horaInicio} a ${formData.horaSalida}\n• Depósito ATH: $${deposito} USD\n\nAquí te paso la captura del recibo de ATH Móvil.`
                      )}`}
                      target="_blank"
                      rel="noreferrer"
                      className="bg-[#25D366] hover:bg-[#20ba5a] text-black font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 px-4 py-3 rounded-xl transition shadow-lg active:scale-95"
                    >
                      <MessageCircle className="w-4 h-4 fill-black text-transparent" />
                      <span>Enviar Comprobante por WhatsApp al (787) 240-8627</span>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          )}
        </form>
      </div>

      {/* HOJA DE SESIÓN TÉCNICA GENERADA PARA EL CLIENTE */}
      <div id="seccion-resumen" className="lg:col-span-4 bg-[#1e1e1e] p-5 rounded-xl border border-red-900/40 flex flex-col justify-between">
        <div>
          <div className="flex justify-between items-center border-b border-gray-800 pb-3 mb-4">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wide">Comprobante de Reserva &amp; Recibo</span>
            <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800 px-2.5 py-0.5 rounded-full font-mono font-bold">
              {reservaActiva ? `REC-${reservaActiva.id}` : 'RESERVA PENDIENTE'}
            </span>
          </div>

          {reservaActiva ? (
            <div className="space-y-4 text-xs">
              <div className="bg-[#111827] p-3 rounded-xl border border-gray-800 space-y-1">
                <p className="text-gray-400"><strong>Artista / Titular:</strong> <span className="text-white font-bold">{formData.nombreArtistico || '-'}</span></p>
                <p className="text-gray-400"><strong>Fecha Congelada:</strong> <span className="text-emerald-400 font-bold">{reservaActiva.fecha}</span></p>
                <p className="text-gray-400"><strong>Horario en Cabina:</strong> <span className="text-amber-400 font-bold">{format12h(reservaActiva.horaInicio)} - {format12h(reservaActiva.horaSalida)}</span></p>
                <p className="text-gray-400"><strong>Contacto (WhatsApp):</strong> <span className="text-amber-400">{formData.telefono || '-'}</span></p>
                {formData.redesSociales && (
                  <p className="text-gray-400"><strong>Redes (IG/TikTok/FB):</strong> <span className="text-gray-300">{formData.redesSociales}</span></p>
                )}
                <p className="text-gray-400"><strong>Método de Anticipo:</strong> <span className="text-emerald-400 font-semibold">{reservaActiva.metodoPago} (Validado)</span></p>
                <p className="text-gray-400"><strong>Ubicación:</strong> <span className="text-zinc-300">Hormigueros, Puerto Rico</span></p>
              </div>

              <div className="bg-[#111827] p-3 rounded-xl border border-gray-800 space-y-1">
                <p className="text-gray-400 font-bold border-b border-gray-800 pb-1 mb-1">Detalles del Proyecto:</p>
                <p className="text-gray-300"><strong>Pista:</strong> {formData.tipoInstrumental.toUpperCase()}</p>
                {formData.linkYoutube && <p className="text-xs text-red-400 truncate"><strong>Link Beat:</strong> {formData.linkYoutube}</p>}
                <p className="text-gray-300"><strong>Servicios:</strong> {reservaActiva.servicios.join(', ')}</p>
              </div>

              <div className="bg-gray-950 p-3.5 rounded-xl border border-gray-800 font-mono space-y-1.5">
                <div className="flex justify-between text-gray-400">
                  <span>Monto Total:</span>
                  <span className="text-white font-bold">{formatMoney(reservaActiva.subtotal)} USD</span>
                </div>
                <div className="flex justify-between text-emerald-400">
                  <span>Depósito Congelado (ATH Móvil):</span>
                  <span className="font-bold">✓ {formatMoney(reservaActiva.deposito)} USD</span>
                </div>
                <div className="flex justify-between text-amber-300 font-bold pt-1.5 border-t border-gray-800">
                  <span>Balance al Entregar:</span>
                  <span>{formatMoney(reservaActiva.balance)} USD</span>
                </div>
                <p className="text-[10px] text-gray-400 font-sans pt-1 leading-relaxed">
                  * El balance restante se liquida contra entrega de tu Máster WAV 24-bit final y Stems.
                </p>
              </div>

              {/* BÓVEDA DE PRE-MEZCLA & PREESCUCHA DIRECTA EN EL PASE (ROUGH MIX SIN COMPRESIÓN) */}
              {(() => {
                const est = (reservaActiva.estado as string) || '';
                const isPassLiquidado = (reservaActiva.balance || 0) <= 0 || 
                                        est.toLowerCase().includes('liquid') || 
                                        est.toLowerCase().includes('pagad') || 
                                        est.toLowerCase().includes('entreg');
                return (
                  <div className="bg-gradient-to-r from-red-950/40 via-black to-amber-950/30 p-3.5 rounded-lg border border-red-800/60 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Music className="w-3.5 h-3.5 text-amber-500" />
                        Bóveda: Pre-mezcla WAV (Rough Mix)
                      </span>
                      {isPassLiquidado ? (
                        <span className="text-[9px] bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded border border-emerald-800/40 font-mono font-bold flex items-center gap-1">
                          <Check className="w-2.5 h-2.5" /> LIQUIDADO
                        </span>
                      ) : (
                        <span className="text-[9px] bg-red-950 text-red-300 px-2 py-0.5 rounded border border-red-800/40 font-mono font-bold flex items-center gap-1">
                          <Lock className="w-2.5 h-2.5" /> DESCARGA BLOQUEADA HASTA LIQUIDAR
                        </span>
                      )}
                    </div>
                    
                    <p className="text-[10px] text-gray-300">
                      {isPassLiquidado 
                        ? 'Tu proyecto está liquidado. Puedes reproducir o descargar el archivo maestro en alta resolución WAV 24-bit:'
                        : 'Escucha la pre-escucha streaming de cabina. La descarga del archivo final WAV se activará cuando el administrador marque tu saldo como Pagado / Liquidado.'}
                    </p>

                    <div className="bg-black/60 p-2.5 rounded-lg border border-gray-800 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <button
                          type="button"
                          onClick={() => setRoughAudioPlaying(!roughAudioPlaying)}
                          className="w-8 h-8 rounded-full bg-red-600 hover:bg-red-500 text-white flex items-center justify-center shrink-0 shadow active:scale-95 transition cursor-pointer"
                          title="Reproducir preescucha en alta fidelidad"
                        >
                          {roughAudioPlaying ? (
                            <span className="text-xs font-black">❚❚</span>
                          ) : (
                            <span className="text-xs font-black ml-0.5">▶</span>
                          )}
                        </button>
                        <div className="min-w-0">
                          <p className="text-[11px] text-white font-bold truncate font-mono">
                            {reservaActiva.roughMixNombre || `${formData.nombreArtistico || 'Tema'}_RoughMix_v1.wav`}
                          </p>
                          <span className="text-[9px] text-emerald-400 font-mono block">
                            {roughAudioPlaying ? '🔊 Reproduciendo en 24-bit 48kHz...' : isPassLiquidado ? '24-bit Studio Master • 45 MB' : 'Preescucha Activa • Descarga Bloqueada'}
                          </span>
                        </div>
                      </div>

                      {isPassLiquidado ? (
                        <a
                          href="https://actions.google.com/sounds/v1/musical_tracks/hip_hop_track.ogg"
                          download={`${formData.nombreArtistico || 'Tema'}_RoughMix_v1.wav`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-2 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white border border-emerald-600 transition text-[10px] font-bold flex items-center gap-1 shrink-0"
                          title="Descargar archivo WAV directo"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Descargar WAV</span>
                        </a>
                      ) : (
                        <div className="p-2 rounded-lg bg-red-950/80 text-red-400 border border-red-800/80 text-[10px] font-bold flex items-center gap-1 shrink-0" title="Requiere liquidación del balance restante">
                          <Lock className="w-3 h-3 text-red-400" />
                          <span>WAV Bloqueado (${reservaActiva.balance} pend.)</span>
                        </div>
                      )}
                    </div>

                    {roughAudioPlaying && (
                      <div className="bg-black/80 p-2 rounded border border-red-950 flex items-center gap-1.5 animate-fadeIn">
                        <div className="flex-1 flex items-end gap-0.5 h-4 overflow-hidden">
                          {[12, 18, 8, 22, 14, 20, 10, 16, 24, 12, 18, 22, 8, 14, 20, 16, 24, 10, 18].map((h, i) => (
                            <div
                              key={i}
                              className="w-1 rounded-t bg-gradient-to-t from-red-600 to-amber-400 transition-all duration-150 animate-pulse"
                              style={{
                                height: `${h}px`,
                                animationDelay: `${i * 0.05}s`,
                                animationDuration: '0.5s'
                              }}
                            />
                          ))}
                        </div>
                        <span className="text-[8px] text-gray-400 font-mono">AUDIO ENGINE ACTIVO</span>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* TEMPORIZADOR DE 30 MINUTOS & ESTADO DEL DEPÓSITO */}
              <div className={`p-3 rounded-lg border text-xs ${
                reservaActiva.estado === 'Confirmada' || reservaActiva.depositoEstado === 'depositado'
                  ? 'bg-emerald-950/40 border-emerald-800 text-emerald-300'
                  : tiempoRestanteSegundos <= 0
                  ? 'bg-red-950/50 border-red-800 text-red-300'
                  : 'bg-amber-950/30 border-amber-800 text-amber-200'
              }`}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold flex items-center gap-1.5 uppercase text-[10px] tracking-wider">
                    <Timer className="w-3.5 h-3.5 animate-pulse" />
                    {reservaActiva.estado === 'Confirmada' || reservaActiva.depositoEstado === 'depositado'
                      ? 'TURNO CONFIRMADO DEFINITIVO'
                      : 'BLOQUEO TEMPORAL DEL TURNO'}
                  </span>
                  {reservaActiva.estado !== 'Confirmada' && reservaActiva.depositoEstado !== 'depositado' && (
                    <span className="font-mono font-black text-sm px-2 py-0.5 rounded bg-black/60 border border-amber-700/50 text-amber-400">
                      {Math.floor(tiempoRestanteSegundos / 60)}:{String(tiempoRestanteSegundos % 60).padStart(2, '0')} min
                    </span>
                  )}
                </div>

                {reservaActiva.estado === 'Confirmada' || reservaActiva.depositoEstado === 'depositado' ? (
                  <p className="text-[11px] text-emerald-200">
                    ✓ Comprobante validado por Badlenz. Tu turno está 100% asegurado en el calendario.
                  </p>
                ) : tiempoRestanteSegundos <= 0 ? (
                  <p className="text-[11px] text-red-200">
                    ⚠️ El tiempo de retención de 30 minutos ha expirado. Si ya enviaste tu depósito vía ATH Móvil, sube tu recibo o contáctanos por WhatsApp para restaurar tu turno prioritario.
                  </p>
                ) : (
                  <p className="text-[11px] text-amber-300/90 leading-relaxed">
                    Tienes <strong>{Math.floor(tiempoRestanteSegundos / 60)} minutos</strong> para realizar tu depósito de <strong>${reservaActiva.deposito} USD</strong> vía ATH Móvil al <strong>787-240-8627</strong> y registrar el comprobante abajo.
                  </p>
                )}
              </div>

              {/* SECCIÓN OPERATIVA: SUBIR COMPROBANTE DE PAGO DIRECTO */}
              <div className="bg-[#111827] p-3.5 rounded-lg border border-gray-800 space-y-2.5">
                <div className="flex items-center justify-between border-b border-gray-800 pb-1.5">
                  <span className="text-[10px] font-black text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Smartphone className="w-3.5 h-3.5 text-amber-500" />
                    Comprobante de Pago ({reservaActiva.metodoPago === 'PayPal' ? 'PayPal @badlenzprod' : 'ATH Móvil 787-240-8627'})
                  </span>
                  <span className="text-[9px] text-gray-400 font-mono">Depósito: ${reservaActiva.deposito}.00</span>
                </div>

                {reservaActiva.metodoPago === 'PayPal' && (
                  <div className="bg-[#0079C1]/15 border border-[#0079C1]/40 p-2 rounded flex items-center justify-between">
                    <span className="text-[10px] text-sky-200">Enlace de pago PayPal.Me:</span>
                    <a
                      href={`https://www.paypal.com/paypalme/badlenzprod/${reservaActiva.deposito}`}
                      target="_blank"
                      rel="noreferrer"
                      className="px-2.5 py-1 rounded bg-[#0079C1] hover:bg-[#005ea6] text-white text-[10px] font-bold flex items-center gap-1"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>Abrir paypal.me/badlenzprod</span>
                    </a>
                  </div>
                )}

                {comprobanteEnviadoExito || reservaActiva.comprobanteAthUrl ? (
                  <div className="p-2.5 bg-emerald-950/40 border border-emerald-800/80 rounded text-emerald-300 text-[11px] space-y-1">
                    <p className="font-bold flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                      ¡Recibo de pago registrado exitosamente!
                    </p>
                    <p className="text-[10px] text-gray-300">
                      Badlenz verificará el comprobante en su cuenta y confirmará tu pase definitivo.
                    </p>
                    {reservaActiva.comprobanteNumReferencia && (
                      <p className="text-[10px] font-mono text-emerald-400">
                        Ref: {reservaActiva.comprobanteNumReferencia}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div>
                      <label className="text-[10px] text-gray-400 uppercase font-semibold block mb-1">
                        1. ID de Transacción / N° Confirmación ({reservaActiva.metodoPago}):
                      </label>
                      <input
                        type="text"
                        placeholder={reservaActiva.metodoPago === 'PayPal' ? 'Ej: ID de transacción PayPal o correo' : 'Ej: ATH-948291 o últimos 4 dígitos'}
                        value={numReferenciaAth}
                        onChange={(e) => setNumReferenciaAth(e.target.value)}
                        className="w-full bg-black/60 border border-gray-700 rounded px-2.5 py-1.5 text-xs text-white outline-none focus:border-red-500 font-mono"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-gray-400 uppercase font-semibold block mb-1">
                        2. Subir Captura de Pantalla del Recibo:
                      </label>
                      <div className="flex items-center gap-2">
                        <label className="flex-1 cursor-pointer bg-black/50 hover:bg-gray-800 border border-dashed border-gray-700 hover:border-gray-500 rounded p-2 text-center transition flex items-center justify-center gap-1.5 text-[11px] text-gray-300">
                          <Camera className="w-3.5 h-3.5 text-amber-400" />
                          <span className="truncate">{comprobanteAthNombre || `Adjuntar captura de ${reservaActiva.metodoPago}`}</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleUploadAthReceipt}
                            className="hidden"
                          />
                        </label>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        if (!comprobanteAthFile && !numReferenciaAth.trim()) {
                          showToast(`Por favor escribe el número de confirmación o sube una foto de tu recibo de ${reservaActiva.metodoPago}.`, 'warning');
                          return;
                        }

                        // Actualizar reserva en DB local
                        const updates: Partial<Reserva> = {
                          comprobanteAthUrl: comprobanteAthFile || undefined,
                          comprobanteNumReferencia: numReferenciaAth.trim() || undefined,
                          depositoEstado: 'depositado',
                          estado: 'Confirmada'
                        };

                        actualizarReserva(reservaActiva.id, updates);
                        setReservaActiva(prev => prev ? { ...prev, ...updates } : null);
                        setComprobanteEnviadoExito(true);
                        showToast('¡Comprobante guardado exitosamente en tu reserva de La Facultad Studio!', 'success');
                      }}
                      className="w-full bg-emerald-700 hover:bg-emerald-600 text-white font-bold py-2 rounded text-[11px] uppercase tracking-wider transition flex items-center justify-center gap-1.5 shadow cursor-pointer active:scale-95"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Guardar y Validar Recibo de Depósito</span>
                    </button>
                  </div>
                )}
              </div>

              {/* ACCIONES DEL PASE DE ENTRADA EXPRESO */}
              <div className="space-y-3.5 border-t border-gray-800 pt-3.5 mt-2">
                <div>
                  <p className="text-[9px] font-black text-amber-500 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                    <span>📲 GUARDAR EN TU TELÉFONO (EXPRESS)</span>
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={handleDownloadImage}
                      className="flex items-center justify-center gap-1.5 bg-red-700 hover:bg-red-600 text-white font-bold py-2 px-1.5 rounded-lg text-[10px] uppercase tracking-wide transition shadow active:scale-95 cursor-pointer"
                      title="Guardar pase como imagen JPG en tu galería"
                    >
                      <ImageIcon className="w-3.5 h-3.5" />
                      <span>Guardar Imagen</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleDownloadPDF}
                      className="flex items-center justify-center gap-1.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-white font-bold py-2 px-1.5 rounded-lg text-[10px] uppercase tracking-wide transition shadow active:scale-95 cursor-pointer"
                      title="Descargar pase como archivo PDF oficial"
                    >
                      <Download className="w-3.5 h-3.5 text-amber-400" />
                      <span>Descargar PDF</span>
                    </button>
                  </div>
                </div>

                <div>
                  <p className="text-[9px] font-black text-amber-500 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                    <span>📅 RECORDATORIO EN TU CALENDARIO</span>
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={handleAddToGoogleCalendar}
                      className="flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-1.5 rounded-lg text-[10px] uppercase tracking-wide transition shadow active:scale-95 cursor-pointer"
                      title="Agendar en tu Google Calendar"
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Google Cal</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleDownloadIcs}
                      className="flex items-center justify-center gap-1.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 font-bold py-2 px-1.5 rounded-lg text-[10px] uppercase tracking-wide transition shadow active:scale-95 cursor-pointer"
                      title="Descargar recordatorio universal .ics para Apple Calendar o Outlook"
                    >
                      <Download className="w-3.5 h-3.5 text-sky-400" />
                      <span>Apple / Outlook</span>
                    </button>
                  </div>
                </div>

                {/* GUÍA DE LLEGADA A HORMIGUEROS Y REGLAS DE LA SALA */}
                <div className="bg-gradient-to-r from-amber-950/40 via-black to-red-950/30 p-3.5 rounded-lg border border-amber-800/60 space-y-2.5">
                  <div className="flex items-center justify-between border-b border-gray-800 pb-1.5">
                    <span className="text-[10px] font-black text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-amber-500" />
                      Guía de Llegada • Hormigueros, PR
                    </span>
                    <span className="text-[9px] bg-amber-950 text-amber-300 border border-amber-800/40 px-2 py-0.5 rounded font-mono font-bold">
                      GPS Y ACCESO
                    </span>
                  </div>

                  <p className="text-[10px] text-gray-300 leading-relaxed">
                    📍 <strong>{studioConfig.direccionTexto}</strong>
                  </p>

                  <div className="grid grid-cols-2 gap-2">
                    <a
                      href={studioConfig.googleMapsLocationUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-gray-950 font-black py-2 px-2 rounded-lg text-[10px] uppercase tracking-wide transition shadow active:scale-95 cursor-pointer"
                    >
                      <Navigation className="w-3.5 h-3.5" />
                      <span>Google Maps</span>
                    </a>
                    <a
                      href={studioConfig.wazeLocationUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-center gap-1.5 bg-sky-600 hover:bg-sky-500 text-white font-bold py-2 px-2 rounded-lg text-[10px] uppercase tracking-wide transition shadow active:scale-95 cursor-pointer"
                    >
                      <Compass className="w-3.5 h-3.5" />
                      <span>Abrir Waze</span>
                    </a>
                  </div>

                  <div className="bg-black/60 p-2 rounded border border-gray-800 space-y-1 text-[10px] text-gray-300">
                    <p className="text-amber-400 font-bold">🚗 Estacionamiento:</p>
                    <p className="text-[9px] text-gray-400">{studioConfig.instruccionesEstacionamiento}</p>
                  </div>

                  {/* REGLAS DE LA SALA & PROTOCOLO DE ENTREGAS */}
                  <div className="pt-1 border-t border-gray-800/80 space-y-1.5 text-[10px]">
                    <span className="font-bold text-red-400 uppercase tracking-wider block">
                      ⚠️ Protocolo de Cabina & Entregas Badlenz:
                    </span>
                    <ul className="space-y-1 text-gray-300 list-disc list-inside text-[9.5px]">
                      <li><strong>Acompañantes:</strong> Máximo <strong>{studioConfig.maxAcompanantes} personas</strong> en sala de control para garantizar óptima acústica.</li>
                      <li><strong>Pistas en WAV:</strong> Traer la instrumental en WAV 24-bit sin limitar para mejor presencia vocal.</li>
                      <li><strong>Ventana de Entrega de Master:</strong> <strong>Rough Mix</strong> inmediato al finalizar las 4h; de 24 a 72 horas se entrega la <strong>Mezcla y el Máster completo</strong> vía tu Bóveda.</li>
                    </ul>
                  </div>
                </div>

                {/* ESTRATEGIA DE RETENCIÓN POST-RESERVA: INCENTIVO COMBO EP / ÁLBUM */}
                <div className="bg-gradient-to-r from-red-950/60 via-black to-amber-950/50 p-3.5 rounded-xl border border-red-700/60 space-y-2 shadow-xl">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Flame className="w-4 h-4 text-red-500 animate-bounce" />
                      ¿Trabajando en un EP o Álbum Completo?
                    </span>
                    <span className="text-[9px] bg-red-900 text-red-200 border border-red-800/80 px-2 py-0.5 rounded font-mono font-bold">
                      OFERTA RETENCIÓN EP
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-300 leading-relaxed">
                    Asegura tu bloque de <strong>3 o 4 temas en combo</strong> para tu próximo proyecto y congela la tarifa especial de <strong>$110 USD por canción</strong>.
                  </p>
                  <a
                    href={`https://wa.me/17872408627?text=${encodeURIComponent(
                      `¡Hola Badlenz! Quisiera aprovechar la oferta de Combo EP (3-4 temas @ $110/canción) para mi próximo proyecto tras mi sesión #${reservaActiva.id}.`
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full bg-gradient-to-r from-red-700 to-amber-500 hover:from-red-600 hover:to-amber-400 text-white font-black py-2 px-3 rounded-lg text-[10px] uppercase tracking-wider text-center transition shadow cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <span>💬 Bloquear Combo EP (3-4 Canciones) por WhatsApp</span>
                  </a>
                </div>

                {/* RECORDATORIO AUTOMÁTICO DE REVISIÓN EN BÓVEDA POR TIMESTAMPS */}
                <div className="bg-black/80 p-3 rounded-lg border border-amber-600/50 space-y-2">
                  <div className="flex items-center gap-1.5 text-amber-400 text-[10px] font-bold uppercase">
                    <Clock className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                    <span>🔔 Recordatorio Automático de Revisión de Mezcla</span>
                  </div>
                  <p className="text-[10px] text-gray-300 leading-normal">
                    En cuanto tu mezcla esté lista en tu Bóveda (de 24 a 72h), recibirás un aviso para escuchar la versión HD y dejar observaciones nota por nota mediante nuestro sistema de timestamps.
                  </p>
                  <button
                    type="button"
                    onClick={() => window.dispatchEvent(new CustomEvent('open-artist-portal-modal'))}
                    className="w-full py-2 px-3 rounded-lg bg-[#0b0c0e] hover:bg-amber-500/15 text-amber-300 border border-amber-500/50 font-bold text-[10px] uppercase tracking-wider flex items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    <Headphones className="w-3.5 h-3.5 text-amber-400" />
                    <span>Ver Mis Temas, Recibos & Estrellas VIP ➜</span>
                  </button>
                </div>

                {/* BOTÓN DIRECTO DE WHATSAPP CON MENSAJE PRELLENADO */}
                <div className="pt-1">
                  <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                    <span>💬 ATENCIÓN DIRECTA POR WHATSAPP</span>
                  </p>
                  <a
                    href={`https://wa.me/17872408627?text=${encodeURIComponent(
                      `¡Hola Badlenz! Acabo de generar mi Pase VIP #${reservaActiva.id} para la sesión del ${reservaActiva.fecha} (${format12h(reservaActiva.horaInicio)}). Método de pago elegido: ${reservaActiva.metodoPago} (Depósito: $${reservaActiva.deposito} USD).`
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20ba5a] text-black font-black py-2.5 px-3 rounded-lg text-[11px] uppercase tracking-wider transition shadow-md active:scale-95 border border-emerald-400/40"
                  >
                    <span>Confirmar Pase con Badlenz por WhatsApp 💬</span>
                  </a>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4 text-xs animate-fadeIn">
              <div className="bg-red-950/20 border border-red-900/40 p-3 rounded-lg text-center">
                <p className="text-[11px] font-bold text-amber-500 uppercase flex items-center justify-center gap-1">
                  <Flame className="w-3.5 h-3.5 text-red-500 animate-bounce" />
                  Presupuesto en Tiempo Real
                </p>
                <p className="text-[10px] text-gray-400 mt-1">El precio se calcula según los servicios elegidos y las horas.</p>
              </div>

              {/* Detalle de Servicios */}
              <div className="bg-[#111827] p-3.5 rounded border border-gray-800 space-y-2.5">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block border-b border-gray-800 pb-1.5">
                  Desglose de Conceptos
                </span>
                
                <div className="space-y-2">
                  {itemsDesglose.map((item, idx) => (
                    <div 
                      key={idx} 
                      className={`flex justify-between items-center text-xs ${
                        item.isDiscount 
                          ? 'text-emerald-400 font-bold bg-emerald-950/30 px-2 py-1.5 rounded border border-emerald-800/50' 
                          : 'text-gray-300'
                      }`}
                    >
                      <span className="flex items-center gap-1.5">{item.name}</span>
                      <span className="font-mono font-bold">
                        {item.price < 0 ? `-$${Math.abs(item.price)} USD` : `$${item.price} USD`}
                      </span>
                    </div>
                  ))}

                  {itemsDesglose.length === 0 && (
                    <p className="text-center py-4 text-gray-500 italic text-[11px]">
                      Selecciona al menos un servicio para calcular tu tarifa
                    </p>
                  )}
                </div>
              </div>

              {/* Resumen Financiero Temporal */}
              <div className="bg-gray-950 p-3.5 rounded border border-gray-800/80 font-mono space-y-2">
                <div className="flex justify-between text-gray-400 text-[11px]">
                  <span>Monto Total del Tema:</span>
                  <span className="text-white font-bold text-xs">{formatMoney(subtotal)} USD</span>
                </div>
                <div className="flex justify-between text-emerald-400 text-[11px] bg-emerald-950/20 p-1 rounded border border-emerald-900/30">
                  <span className="flex items-center gap-1 font-bold">🔒 Depósito Hoy (Apartar Turno):</span>
                  <span className="font-extrabold text-xs text-emerald-400">{formatMoney(deposito)} USD</span>
                </div>
                <div className="flex justify-between text-amber-300 text-[11px] pt-1.5 border-t border-gray-800">
                  <span>Balance al llegar a Cabina:</span>
                  <span className="text-amber-400 font-extrabold text-xs">{formatMoney(balance)} USD</span>
                </div>
              </div>

              {/* Informative Callout */}
              <div className="flex gap-2 items-start bg-emerald-950/20 border border-emerald-900/40 p-3 rounded-xl text-[10px] text-emerald-300">
                <Info className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <p className="leading-snug">
                  <strong>💡 Cero sorpresas:</strong> El costo total de tu tema es <strong>{formatMoney(subtotal)} USD</strong>. Solo abonas <strong>{formatMoney(deposito)} USD</strong> hoy para bloquear tu día en el calendario; los <strong>{formatMoney(balance)} USD</strong> restantes se pagan cuando llegues a cabina.
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 pt-3 border-t border-gray-800 text-[10px] text-gray-500 text-center">
          LA FACULTAD STUDIO | BADLENZ • HORMIGUEROS, PUERTO RICO<br />
          ellentemalo@gmail.com • (787) 240-8627
        </div>
      </div>
    </div>
  </ScrollReveal>

  {/* 4. ESTÁNDARES OFICIALES & GARANTÍAS DE ESTUDIO (CONDICIONES Y GARANTÍAS DE SESIÓN) */}
  <ScrollReveal delayMs={80}>
    <StudioGuaranteesBento />
  </ScrollReveal>

  {/* UBICACIÓN HORMIGUEROS, PUERTO RICO & ACCESOS */}
  <ScrollReveal delayMs={60}>
    <UbicacionPuertoRico />
  </ScrollReveal>
</div>
);
}
