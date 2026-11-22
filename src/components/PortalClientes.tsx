import React, { useState, useEffect, useMemo, Suspense } from 'react';
import {
  guardarCliente,
  guardarReserva,
  actualizarReserva,
  getReservas,
  Reserva,
  getPromoSlotsCount,
  getStudioConfig,
  StudioConfig,
} from '../services/db';
import {
  SlotDisponibilidad,
  obtenerResumenDisponibilidadActual,
  getPuertoRicoTodayStr,
  DISPONIBILIDAD_UPDATED_EVENT,
} from '../services/schedule';
import { UbicacionPuertoRico } from './UbicacionPuertoRico';
import { AvisoEstudioCerrado } from './AvisoEstudioCerrado';
import { getStudioLiveStatus, subscribeToStudioStatus, StudioLiveStatus } from '../services/studioStatus';
import { compressImageToDataUrl } from '../utils/compressImage';
import { ScrollReveal } from './ScrollReveal';
import { StudioGuaranteesBento } from './StudioGuaranteesBento';
import { SocialProofReviews } from './SocialProofReviews';
import { StudioFaqSection } from './StudioFaqSection';
import { lazyWithRetry } from '../utils/lazyWithRetry';

import { BookingFormData, PackageType, PromoSlotsInfo } from './portal/types';
import { calculateBookingPricing } from './portal/pricing';
import { StudioHeroSection } from './portal/StudioHeroSection';
import { TarifasPlanesSection } from './portal/TarifasPlanesSection';
import { BookingStep1Schedule } from './portal/BookingStep1Schedule';
import { BookingStep2Artist } from './portal/BookingStep2Artist';
import { BookingStep3Payment } from './portal/BookingStep3Payment';
import { ReservaConfirmacionPase } from './portal/ReservaConfirmacionPase';
import { StudioFinaleSection } from './portal/StudioFinaleSection';
import {
  exportPassImage,
  exportPassPDF,
  openGoogleCalendarForReserva,
} from './portal/passExports';

const AudioShowcaseAB = lazyWithRetry(() => import('./AudioShowcaseAB'));
const CreditsMinimalSection = lazyWithRetry(() => import('./CreditsMinimalSection'));

interface PortalClientesProps {
  slotInicial?: SlotDisponibilidad | null;
  onNavigateToMuestras?: () => void;
}

export default function PortalClientes({ slotInicial, onNavigateToMuestras }: PortalClientesProps) {
  const initialAvailability = useMemo(() => obtenerResumenDisponibilidadActual(), []);
  const initialHoraRange = initialAvailability.proximoSlot?.horarioPermitido?.split(' - ');
  const savedDraft = useMemo(() => {
    if (typeof window === 'undefined') return null;
    try {
      const raw = localStorage.getItem('la_facultad_booking_draft_v1');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }, []);

  const [formData, setFormData] = useState<BookingFormData>({
    nombreReal: savedDraft?.nombreReal || '',
    nombreArtistico: savedDraft?.nombreArtistico || '',
    redesSociales: savedDraft?.redesSociales || '',
    telefono: savedDraft?.telefono || '',
    email: savedDraft?.email || '',
    servicios: {
      grabacion: true,
      instrumental: false,
      mezclaMaster: true,
      produccionCompleta: false,
    },
    incluirBeatExclusivoBadlenz: false,
    tipoInstrumental: 'youtube',
    linkYoutube: savedDraft?.linkYoutube || '',
    numeroCanales: '1-8 Pistas (Voz + Beat)',
    tempoBpm: '120 BPM',
    metodoPago: 'ATH Movil',
    referencias: savedDraft?.referencias || '',
    aceptaTerminos: true,
    fecha: initialAvailability.proximoDisponibleFecha || getPuertoRicoTodayStr(),
    horaInicio: initialHoraRange?.[0]?.trim() || '13:00',
    horaSalida:
      initialHoraRange?.[0]?.trim() === '18:00'
        ? '22:00'
        : '17:00',
  });

  const [checkoutStep, setCheckoutStep] = useState<1 | 2 | 3>(1);
  const [athNumReferenciaInput, setAthNumReferenciaInput] = useState<string>('');
  const [athComprobanteUrl, setAthComprobanteUrl] = useState<string>('');
  const [athComprobanteNombre, setAthComprobanteNombre] = useState<string>('');

  const [selectedPackage, setSelectedPackage] = useState<PackageType | null>('promo');
  const [fechasSeleccionadasBloque] = useState<string[]>([
    initialAvailability.proximoDisponibleFecha || getPuertoRicoTodayStr(),
  ]);
  const [esReservaEnBloque, setEsReservaEnBloque] = useState<boolean>(false);
  const [roughAudioPlaying, setRoughAudioPlaying] = useState<boolean>(false);
  const [promoSlotsInfo, setPromoSlotsInfo] = useState<PromoSlotsInfo>(() => getPromoSlotsCount());
  const [studioConfig, setStudioConfig] = useState<StudioConfig>(() => getStudioConfig());
  const [studioLiveStatus, setStudioLiveStatus] = useState<StudioLiveStatus>(() => getStudioLiveStatus());

  const [reservaActiva, setReservaActiva] = useState<Reserva | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [isStartingStripe, setIsStartingStripe] = useState(false);
  const [archivosSubidos, setArchivosSubidos] = useState<{ nombre: string; tamano: string }[]>([]);

  const [comprobanteAthFile, setComprobanteAthFile] = useState<string | null>(null);
  const [comprobanteAthNombre, setComprobanteAthNombre] = useState<string>('');
  const [numReferenciaAth, setNumReferenciaAth] = useState<string>('');
  const [tiempoRestanteSegundos, setTiempoRestanteSegundos] = useState<number>(30 * 60);
  const [comprobanteEnviadoExito, setComprobanteEnviadoExito] = useState(false);

  const [copiedAthAmount, setCopiedAthAmount] = useState(false);
  const [copiedAthPhone, setCopiedAthPhone] = useState(false);

  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'warning' | 'info' | 'error';
  } | null>(null);
  const [stepErrors, setStepErrors] = useState<{ nombreArtistico?: string; telefono?: string }>({});

  const showToast = (
    message: string,
    type: 'success' | 'warning' | 'info' | 'error' = 'info'
  ) => {
    setToast({ message, type });
    setTimeout(() => {
      setToast((curr) => (curr?.message === message ? null : curr));
    }, 4500);
  };

  useEffect(() => {
    const unsub = subscribeToStudioStatus((st) => setStudioLiveStatus(st));
    return unsub;
  }, []);

  // Guardar borrador ligero de datos del artista en localStorage para evitar pérdida en recargas
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      if (reservaActiva) {
        localStorage.removeItem('la_facultad_booking_draft_v1');
        return;
      }
      const draft = {
        nombreReal: formData.nombreReal,
        nombreArtistico: formData.nombreArtistico,
        redesSociales: formData.redesSociales,
        telefono: formData.telefono,
        email: formData.email,
        linkYoutube: formData.linkYoutube,
        referencias: formData.referencias,
      };
      localStorage.setItem('la_facultad_booking_draft_v1', JSON.stringify(draft));
    } catch {
      // ignore storage quota errors
    }
  }, [
    reservaActiva,
    formData.nombreReal,
    formData.nombreArtistico,
    formData.redesSociales,
    formData.telefono,
    formData.email,
    formData.linkYoutube,
    formData.referencias,
  ]);

  // Si Firestore actualiza la disponibilidad o reservas después del primer render,
  // verificar que la fecha preseleccionada siga disponible; si no, mover al próximo turno libre.
  useEffect(() => {
    const syncInitialDate = () => {
      const resumen = obtenerResumenDisponibilidadActual();
      setFormData((prev) => {
        if (!resumen.proximoDisponibleFecha) return prev;
        if (prev.fecha === resumen.hoyStr && !resumen.hoyDisponible) {
          const range = resumen.proximoSlot?.horarioPermitido?.split(' - ');
          return {
            ...prev,
            fecha: resumen.proximoDisponibleFecha,
            horaInicio: range?.[0]?.trim() || prev.horaInicio,
            horaSalida: range?.[0]?.trim() === '18:00' ? '22:00' : '17:00',
          };
        }
        return prev;
      });
    };
    window.addEventListener(DISPONIBILIDAD_UPDATED_EVENT, syncInitialDate);
    window.addEventListener('la_facultad_reservas_updated', syncInitialDate);
    return () => {
      window.removeEventListener(DISPONIBILIDAD_UPDATED_EVENT, syncInitialDate);
      window.removeEventListener('la_facultad_reservas_updated', syncInitialDate);
    };
  }, []);

  const isStudioTemporarilyClosed = ['vacaciones', 'mantenimiento', 'remodelacion'].includes(
    studioLiveStatus.estado
  );

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
      const fechaSeleccionada = slotInicial.fechaStr || `2026-08-${diaStr}`;
      const horaIn = slotInicial.horarioPermitido ? slotInicial.horarioPermitido.split(' - ')[0] : '13:00';
      const horaOut = slotInicial.horarioPermitido ? slotInicial.horarioPermitido.split(' - ')[1] : '17:00';
      setFormData((prev) => ({
        ...prev,
        fecha: fechaSeleccionada,
        horaInicio: horaIn,
        horaSalida: horaOut,
      }));
    }
  }, [slotInicial]);

  // Detectar retorno exitoso o cancelado desde Stripe Checkout
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const stripePaid = params.get('stripe_paid');
    const stripeCanceled = params.get('stripe_canceled');
    const reservaId = params.get('reserva');
    const sessionId = params.get('session_id');

    if (stripePaid === '1' && reservaId) {
      const found = getReservas().find((r) => r.id === reservaId);
      const stripeRef = sessionId ? `STRIPE_${sessionId.slice(-12).toUpperCase()}` : 'STRIPE_PAGADO';
      if (found) {
        actualizarReserva(found.id, { comprobanteNumReferencia: stripeRef });
        setReservaActiva({ ...found, comprobanteNumReferencia: stripeRef });
        setComprobanteEnviadoExito(true);
        setTimeout(() => {
          document.getElementById('seccion-resumen')?.scrollIntoView({ behavior: 'smooth' });
        }, 150);
      }
      showToast(
        `✅ ¡Depósito con Stripe procesado! Referencia ${stripeRef} registrada en tu Pase #${reservaId}.`,
        'success'
      );
      window.history.replaceState(null, '', window.location.pathname);
    } else if (stripeCanceled === '1') {
      showToast('Pago con Stripe cancelado. Puedes intentar de nuevo o usar ATH Móvil.', 'info');
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, []);

  // Temporizador de 30 minutos activo al generar la reserva pendiente
  useEffect(() => {
    if (!reservaActiva || reservaActiva.estado === 'Confirmada') return;
    const creadoTimestamp = reservaActiva.creadoEn || Date.now();
    const tiempoExpiracion = creadoTimestamp + 30 * 60 * 1000;

    const interval = setInterval(() => {
      const dif = Math.max(0, Math.floor((tiempoExpiracion - Date.now()) / 1000));
      setTiempoRestanteSegundos(dif);
    }, 1000);

    return () => clearInterval(interval);
  }, [reservaActiva]);

  const { subtotal, deposito, balance, duracionHoras, itemsDesglose } = useMemo(
    () =>
      calculateBookingPricing({
        selectedPackage,
        servicios: formData.servicios,
        horaInicio: formData.horaInicio,
        horaSalida: formData.horaSalida,
        incluirBeatExclusivoBadlenz: formData.incluirBeatExclusivoBadlenz,
        vipDescuentoAplicado: null,
      }),
    [
      selectedPackage,
      formData.servicios,
      formData.horaInicio,
      formData.horaSalida,
      formData.incluirBeatExclusivoBadlenz,
    ]
  );

  const handleAthScreenshotUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showToast('Por favor sube una imagen válida (JPG o PNG).', 'warning');
      return;
    }
    setAthComprobanteNombre(file.name);
    try {
      const compressed = await compressImageToDataUrl(file, 1000, 0.72);
      setAthComprobanteUrl(compressed);
      showToast('📸 ¡Captura de ATH Móvil optimizada y adjunta con éxito!', 'success');
    } catch {
      showToast('No se pudo procesar la imagen. Intenta con otra captura.', 'error');
    }
  };

  const handleRemoveAthScreenshot = () => {
    setAthComprobanteUrl('');
    setAthComprobanteNombre('');
  };

  const handleUploadAthReceipt = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 12 * 1024 * 1024) {
      showToast('La imagen no debe superar los 12MB.', 'error');
      return;
    }
    setComprobanteAthNombre(file.name);
    try {
      const compressed = await compressImageToDataUrl(file, 1000, 0.72);
      setComprobanteAthFile(compressed);
    } catch {
      showToast('No se pudo procesar la captura. Intenta con otra imagen.', 'error');
    }
  };

  const handleSaveAthReceipt = () => {
    if (!reservaActiva) return;
    if (!comprobanteAthFile && !numReferenciaAth.trim()) {
      showToast(
        `Por favor escribe el número de confirmación o sube una foto de tu recibo de ${reservaActiva.metodoPago}.`,
        'warning'
      );
      return;
    }
    const updates: Partial<Reserva> = {
      comprobanteAthUrl: comprobanteAthFile || undefined,
      comprobanteNumReferencia: numReferenciaAth.trim() || undefined,
    };
    actualizarReserva(reservaActiva.id, updates);
    setReservaActiva((prev) => (prev ? { ...prev, ...updates } : null));
    setComprobanteEnviadoExito(true);
    showToast(
      '✅ ¡Comprobante recibido! Badlenz verificará tu depósito y te enviará tu confirmación oficial.',
      'success'
    );
  };

  const handleCopyAthAmount = () => {
    navigator.clipboard.writeText(String(deposito));
    setCopiedAthAmount(true);
    setTimeout(() => setCopiedAthAmount(false), 2000);
  };

  const handleCopyAthPhone = () => {
    navigator.clipboard.writeText('7872408627');
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate([40, 30, 40]);
      } catch {
        /* ignore */
      }
    }
    setCopiedAthPhone(true);
    showToast('¡Número de ATH Móvil copiado! (787) 240-8627', 'success');
    setTimeout(() => setCopiedAthPhone(false), 2500);
  };

  const handleSelectPackage = (pkg: PackageType) => {
    setSelectedPackage(pkg);
    const presets: Record<
      PackageType,
      {
        servicios: BookingFormData['servicios'];
        tipoInstrumental: string;
        horaInicio: string;
        horaSalida: string;
      }
    > = {
      promo: {
        servicios: { grabacion: true, instrumental: false, mezclaMaster: true, produccionCompleta: false },
        tipoInstrumental: 'youtube',
        horaInicio: '13:00',
        horaSalida: '17:00',
      },
      full: {
        servicios: { grabacion: true, instrumental: true, mezclaMaster: true, produccionCompleta: true },
        tipoInstrumental: 'ninguna',
        horaInicio: '13:00',
        horaSalida: '18:00',
      },
      pro: {
        servicios: { grabacion: true, instrumental: false, mezclaMaster: true, produccionCompleta: false },
        tipoInstrumental: 'youtube',
        horaInicio: '13:00',
        horaSalida: '17:00',
      },
      mezcla: {
        servicios: { grabacion: false, instrumental: false, mezclaMaster: true, produccionCompleta: false },
        tipoInstrumental: 'drive',
        horaInicio: '13:00',
        horaSalida: '17:00',
      },
      instrumental: {
        servicios: { grabacion: false, instrumental: true, mezclaMaster: false, produccionCompleta: false },
        tipoInstrumental: 'ninguna',
        horaInicio: '13:00',
        horaSalida: '17:00',
      },
      express: {
        servicios: { grabacion: true, instrumental: false, mezclaMaster: false, produccionCompleta: false },
        tipoInstrumental: 'youtube',
        horaInicio: '13:00',
        horaSalida: '16:00',
      },
      combo_3: {
        servicios: { grabacion: true, instrumental: false, mezclaMaster: true, produccionCompleta: false },
        tipoInstrumental: 'youtube',
        horaInicio: '13:00',
        horaSalida: '17:00',
      },
      combo_4: {
        servicios: { grabacion: true, instrumental: false, mezclaMaster: true, produccionCompleta: false },
        tipoInstrumental: 'youtube',
        horaInicio: '13:00',
        horaSalida: '18:00',
      },
      prod_cuarto: {
        servicios: { grabacion: false, instrumental: true, mezclaMaster: false, produccionCompleta: false },
        tipoInstrumental: 'pendrive',
        horaInicio: '13:00',
        horaSalida: '16:00',
      },
      prod_artista: {
        servicios: { grabacion: true, instrumental: false, mezclaMaster: false, produccionCompleta: false },
        tipoInstrumental: 'pendrive',
        horaInicio: '13:00',
        horaSalida: '15:00',
      },
      prod_eng: {
        servicios: { grabacion: true, instrumental: false, mezclaMaster: false, produccionCompleta: false },
        tipoInstrumental: 'pendrive',
        horaInicio: '13:00',
        horaSalida: '16:00',
      },
    };

    const preset = presets[pkg];
    if (preset) {
      setFormData((prev) => ({ ...prev, ...preset }));
      setEsReservaEnBloque(false);
    }

    setTimeout(() => {
      document.getElementById('seccion-calendario-booking')?.scrollIntoView({ behavior: 'smooth' });
    }, 120);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesList = Array.from(e.target.files).map((file: File) => ({
        nombre: file.name,
        tamano: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
      }));
      setArchivosSubidos((prev) => [...prev, ...filesList]);
    }
  };

  const handleRemoveFile = (index: number) => {
    setArchivosSubidos((prev) => prev.filter((_, i) => i !== index));
  };

  const buildServiciosList = (): string[] => {
    const lista: string[] = [];
    if (formData.servicios.grabacion) lista.push('Grabación de Voces/Instr.');
    if (formData.servicios.instrumental) lista.push('Servicio de Instrumental');
    if (formData.servicios.mezclaMaster) lista.push('Mezcla y Masterización');
    if (formData.servicios.produccionCompleta) lista.push('Producción Completa');
    if (lista.length === 0) lista.push('Sesión de Grabación (4h)');
    return lista;
  };

  const handlePayWithStripe = async () => {
    const errors: { nombreArtistico?: string; telefono?: string } = {};
    if (!formData.nombreArtistico.trim()) {
      errors.nombreArtistico = 'Ingresa tu nombre artístico para pagar con Stripe';
    }
    if (!formData.telefono.trim()) {
      errors.telefono = 'Ingresa tu número de WhatsApp para enviarte tu Pase VIP';
    }
    if (Object.keys(errors).length > 0) {
      setStepErrors(errors);
      setCheckoutStep(2);
      showToast('Completa tu Nombre Artístico y WhatsApp en el Paso 2 antes de pagar con Stripe.', 'warning');
      return;
    }

    setIsStartingStripe(true);
    try {
      const listaServicios = buildServiciosList();
      const cliente = guardarCliente({
        nombreArtistico: formData.nombreArtistico.trim(),
        nombreReal: formData.nombreReal || formData.nombreArtistico.trim(),
        email: formData.email || `${formData.nombreArtistico.toLowerCase().replace(/[^a-z0-9]/g, '')}@cliente.com`,
        telefono: formData.telefono.trim(),
        instagram: formData.redesSociales,
      });

      const nuevaReserva = guardarReserva({
        clienteId: cliente.id,
        nombreArtistico: formData.nombreArtistico.trim(),
        fecha: formData.fecha,
        fechasBloque: esReservaEnBloque ? fechasSeleccionadasBloque : undefined,
        horaInicio: formData.horaInicio,
        horaSalida: formData.horaSalida,
        totalHoras: duracionHoras,
        servicios: listaServicios,
        metodoPago: 'Tarjeta / Stripe',
        subtotal,
        deposito,
        balance,
        estado: 'Pendiente',
      });

      fetch('/api/enviar-email-reserva', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cliente, reserva: nuevaReserva }),
      }).catch(() => {});

      const res = await fetch('/api/crear-checkout-stripe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reservaId: nuevaReserva.id,
          nombreArtistico: nuevaReserva.nombreArtistico,
          email: formData.email,
          fecha: nuevaReserva.fecha,
          horaInicio: nuevaReserva.horaInicio,
          horaSalida: nuevaReserva.horaSalida,
          deposito: nuevaReserva.deposito,
          paquete: listaServicios.join(' + '),
          origin: window.location.origin,
        }),
      });

      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        const data = await res.json();
        if (data?.url) {
          window.location.href = data.url;
          return;
        }
      }

      if (studioConfig.stripeDepositLink) {
        setReservaActiva(nuevaReserva);
        window.open(studioConfig.stripeDepositLink, '_blank', 'noopener,noreferrer');
        showToast('Se abrió tu link seguro de Stripe. Tu Pase VIP ya quedó generado.', 'info');
      } else {
        setReservaActiva(nuevaReserva);
        showToast(
          `Reserva creada (#${nuevaReserva.id}). El Checkout automático de Stripe funcionará en vivo al desplegar en Vercel con STRIPE_SECRET_KEY.`,
          'info'
        );
      }
    } catch {
      showToast('No se pudo conectar con Stripe ahora. Puedes completar tu depósito por ATH Móvil.', 'error');
    } finally {
      setIsStartingStripe(false);
    }
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
    const listaServicios = buildServiciosList();
    setIsSending(true);

    const cliente = guardarCliente({
      nombreArtistico: formData.nombreArtistico.trim(),
      nombreReal: formData.nombreReal || formData.nombreArtistico.trim(),
      email: formData.email || `${formData.nombreArtistico.toLowerCase().replace(/[^a-z0-9]/g, '')}@cliente.com`,
      telefono: formData.telefono.trim(),
      instagram: formData.redesSociales,
    });

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
      subtotal,
      deposito,
      balance,
      estado: 'Pendiente',
      comprobanteNumReferencia: athNumReferenciaInput.trim() || undefined,
      comprobanteAthUrl: athComprobanteUrl || undefined,
      tipoProyecto: 'single',
      roughMixNombre: `${formData.nombreArtistico.toUpperCase() || 'ARTISTA'}_Sesion_${formData.fecha}_ROUGH_v1.wav`,
      roughMixUrl: 'https://actions.google.com/sounds/v1/musical_tracks/hip_hop_track.ogg',
    });

    setReservaActiva(nuevaReserva);
    setIsSending(false);
    showToast(
      `🎟️ ¡Pase VIP #${nuevaReserva.id} emitido! Ya puedes descargar tu confirmación de calendario (.ics).`,
      'success'
    );

    setTimeout(() => {
      document.getElementById('seccion-resumen')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);

    fetch('/api/enviar-email-reserva', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cliente: {
          nombreReal: formData.nombreReal || formData.nombreArtistico.trim(),
          nombreArtistico: formData.nombreArtistico.trim(),
          email: formData.email || `${formData.nombreArtistico.toLowerCase().replace(/\s+/g, '')}@cliente.com`,
          telefono: formData.telefono.trim(),
          instagram: formData.redesSociales,
        },
        reserva: nuevaReserva,
        detallesProyecto: {
          tipoInstrumental: formData.tipoInstrumental,
          linkYoutube: formData.linkYoutube,
          referencias: formData.referencias,
          archivos: archivosSubidos,
        },
      }),
    }).catch((err) => {
      console.warn('Aviso de notificación por correo en segundo plano:', err);
    });
  };

  if (isStudioTemporarilyClosed) {
    return (
      <div className="py-2 animate-fadeIn">
        <AvisoEstudioCerrado onNavigateToMuestras={onNavigateToMuestras} isFullTakeover={true} />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn relative">
      {/* NOTIFICACIÓN MODERNA FLOTANTE */}
      {toast && (
        <div className="fixed top-6 right-6 z-50 max-w-sm w-full animate-bounce-in drop-shadow-2xl">
          <div
            className={`p-4 rounded-2xl border flex items-start gap-3 backdrop-blur-xl ${
              toast.type === 'success'
                ? 'bg-[#0f291e]/95 border-emerald-500 text-white'
                : toast.type === 'error'
                ? 'bg-[#2a0e0e]/95 border-red-500 text-white'
                : toast.type === 'warning'
                ? 'bg-[#2d2208]/95 border-amber-500 text-white'
                : 'bg-[#111827]/95 border-gray-700 text-white'
            }`}
          >
            <span className="text-lg shrink-0">
              {toast.type === 'success'
                ? '🎟️'
                : toast.type === 'warning'
                ? '⚠️'
                : toast.type === 'error'
                ? '❌'
                : 'ℹ️'}
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

      {/* 1. BANNER REAPERTURA + MASTER STUDIO HERO */}
      <StudioHeroSection
        promoSlotsInfo={promoSlotsInfo}
        copiedAthPhone={copiedAthPhone}
        onSelectPackage={handleSelectPackage}
        onCopyAthPhone={handleCopyAthPhone}
      />

      {/* DEMOSTRACIÓN AUDITIVA A/B EN VIVO BADLENZ */}
      <ScrollReveal delayMs={40}>
        <div id="seccion-muestras-ab" className="scroll-mt-24">
          <Suspense fallback={<div className="h-64 rounded-3xl bg-[#11131d] border border-white/10 animate-pulse" />}>
            <AudioShowcaseAB />
          </Suspense>
        </div>
      </ScrollReveal>

      {/* 2. PAQUETES OFICIALES EN 1 CLIC */}
      <TarifasPlanesSection
        selectedPackage={selectedPackage}
        promoSlotsInfo={promoSlotsInfo}
        onSelectPackage={handleSelectPackage}
      />

      {/* 3. FORMULARIO PRINCIPAL DE RESERVA (3 PASOS) & PASE VIP */}
      <ScrollReveal delayMs={100}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 bg-[#0e1017] p-5 sm:p-7 rounded-2xl border border-zinc-800 space-y-5 shadow-2xl">
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
            <div
              id="seccion-calendario-booking"
              className="bg-[#12141c] p-2 rounded-xl border border-zinc-800 shadow-lg scroll-mt-24"
            >
              <div className="grid grid-cols-3 gap-2 text-center text-xs font-dmsans">
                {(
                  [
                    { step: 1, label: 'Fecha & Turno' },
                    { step: 2, label: 'Datos Artista' },
                    { step: 3, label: 'Depósito & Pase' },
                  ] as const
                ).map(({ step, label }) => (
                  <button
                    key={step}
                    type="button"
                    onClick={() => {
                      setCheckoutStep(step);
                      setStepErrors({});
                    }}
                    className={`py-2.5 px-2 rounded-lg border transition-all font-medium flex items-center justify-center gap-2 cursor-pointer ${
                      checkoutStep === step
                        ? 'bg-rose-600 text-white font-bold border-rose-500 shadow-md shadow-rose-950/40'
                        : 'bg-black/40 border-zinc-800/80 text-zinc-400 hover:text-white'
                    }`}
                  >
                    <span className="w-5 h-5 rounded-full bg-black/40 flex items-center justify-center text-[10px] font-mono shrink-0">
                      {step}
                    </span>
                    <span className="truncate">{label}</span>
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 text-xs">
              {checkoutStep === 1 && (
                <BookingStep1Schedule
                  formData={formData}
                  setFormData={setFormData}
                  selectedPackage={selectedPackage}
                  subtotal={subtotal}
                  deposito={deposito}
                  onSelectPackage={handleSelectPackage}
                  onContinueToStep2={() => {
                    if (!formData.fecha) {
                      const fallback =
                        obtenerResumenDisponibilidadActual().proximoDisponibleFecha ||
                        getPuertoRicoTodayStr();
                      setFormData((prev) => ({ ...prev, fecha: fallback }));
                    }
                    setCheckoutStep(2);
                  }}
                  onShowToast={showToast}
                />
              )}

              {checkoutStep === 2 && (
                <BookingStep2Artist
                  formData={formData}
                  setFormData={setFormData}
                  stepErrors={stepErrors}
                  setStepErrors={setStepErrors}
                  archivosSubidos={archivosSubidos}
                  deposito={deposito}
                  onFileSelect={handleFileSelect}
                  onRemoveFile={handleRemoveFile}
                  onBackToStep1={() => setCheckoutStep(1)}
                  onContinueToStep3={() => {
                    const errors: { nombreArtistico?: string; telefono?: string } = {};
                    if (!formData.nombreArtistico.trim()) {
                      errors.nombreArtistico = 'Ingresa tu nombre artístico';
                    }
                    if (!formData.telefono.trim()) {
                      errors.telefono = 'Ingresa tu WhatsApp o celular';
                    }
                    if (Object.keys(errors).length > 0) {
                      setStepErrors(errors);
                      showToast(
                        'Por favor completa tu Nombre Artístico y Teléfono para emitir tu Pase VIP.',
                        'warning'
                      );
                      return;
                    }
                    setStepErrors({});
                    setCheckoutStep(3);
                  }}
                />
              )}

              {checkoutStep === 3 && (
                <BookingStep3Payment
                  formData={formData}
                  setFormData={setFormData}
                  stepErrors={stepErrors}
                  setStepErrors={setStepErrors}
                  studioConfig={studioConfig}
                  subtotal={subtotal}
                  deposito={deposito}
                  balance={balance}
                  isSending={isSending}
                  isStartingStripe={isStartingStripe}
                  copiedAthPhone={copiedAthPhone}
                  copiedAthAmount={copiedAthAmount}
                  athNumReferenciaInput={athNumReferenciaInput}
                  setAthNumReferenciaInput={setAthNumReferenciaInput}
                  athComprobanteUrl={athComprobanteUrl}
                  athComprobanteNombre={athComprobanteNombre}
                  onCopyAthPhone={handleCopyAthPhone}
                  onCopyAthAmount={handleCopyAthAmount}
                  onPayWithStripe={handlePayWithStripe}
                  onAthScreenshotUpload={handleAthScreenshotUpload}
                  onRemoveAthScreenshot={handleRemoveAthScreenshot}
                  onBackToStep2={() => setCheckoutStep(2)}
                />
              )}
            </form>
          </div>

          {/* HOJA DE SESIÓN / CONFIRMACIÓN .ICS / RESUMEN EN VIVO */}
          <ReservaConfirmacionPase
            reservaActiva={reservaActiva}
            formData={formData}
            studioConfig={studioConfig}
            subtotal={subtotal}
            deposito={deposito}
            balance={balance}
            itemsDesglose={itemsDesglose}
            roughAudioPlaying={roughAudioPlaying}
            setRoughAudioPlaying={setRoughAudioPlaying}
            tiempoRestanteSegundos={tiempoRestanteSegundos}
            comprobanteEnviadoExito={comprobanteEnviadoExito}
            numReferenciaAth={numReferenciaAth}
            setNumReferenciaAth={setNumReferenciaAth}
            comprobanteAthNombre={comprobanteAthNombre}
            onUploadAthReceipt={handleUploadAthReceipt}
            onSaveAthReceipt={handleSaveAthReceipt}
            onDownloadImage={() => reservaActiva && exportPassImage(reservaActiva, formData)}
            onDownloadPDF={() => reservaActiva && exportPassPDF(reservaActiva, formData)}
            onAddToGoogleCalendar={() => reservaActiva && openGoogleCalendarForReserva(reservaActiva)}
            onShowToast={showToast}
          />
        </div>
      </ScrollReveal>

      {/* 4. ESTÁNDARES OFICIALES & GARANTÍAS */}
      <ScrollReveal delayMs={80}>
        <StudioGuaranteesBento />
      </ScrollReveal>

      {/* 4B. TESTIMONIOS — LO QUE DICEN LOS ARTISTAS */}
      <ScrollReveal delayMs={75}>
        <SocialProofReviews />
      </ScrollReveal>

      {/* 5. CRÉDITOS OFICIALES & STREAM MILESTONES */}
      <ScrollReveal delayMs={70}>
        <Suspense fallback={<div className="h-44 rounded-3xl bg-[#0e1017] border border-white/10 animate-pulse" />}>
          <CreditsMinimalSection />
        </Suspense>
      </ScrollReveal>

      {/* 6. UBICACIÓN HORMIGUEROS, PUERTO RICO */}
      <ScrollReveal delayMs={60}>
        <UbicacionPuertoRico />
      </ScrollReveal>

      {/* 6B. PREGUNTAS FRECUENTES (FAQ) */}
      <ScrollReveal delayMs={50}>
        <StudioFaqSection />
      </ScrollReveal>

      {/* 7. ESCENA FINAL */}
      <StudioFinaleSection />
    </div>
  );
}
