import React, { useState, useMemo, useEffect } from 'react';
import { guardarCliente, guardarReserva } from '../../services/db';
import { syncQuoteToGoogleSheets } from '../../services/googleSheets';
import { 
  QuoteData, 
  ClientInfo, 
  StudioServiceItem, 
  AddOnItem, 
  CustomQuoteItem, 
  ServiceCategory,
  AppMode
} from '../../types';
import { 
  User, 
  Mail, 
  Phone, 
  Building, 
  Calendar as CalendarIcon, 
  FileText, 
  CheckSquare, 
  Plus, 
  Minus, 
  Trash2, 
  Printer, 
  Save, 
  Receipt, 
  Sparkles, 
  DollarSign, 
  Percent, 
  Tag, 
  Check, 
  CheckCircle,
  FolderCheck,
  ShieldAlert,
  Clock,
  Instagram,
  FileSignature,
  Ticket,
  AlertTriangle,
  Music,
  Share2,
  ExternalLink,
  Copy,
  Download
} from 'lucide-react';
import { LFCrestLogo } from '../BrandingLogos';
import { printElementById } from '../../utils/printDocument';

interface CotizadorSectionProps {
  services?: StudioServiceItem[];
  setServices?: React.Dispatch<React.SetStateAction<StudioServiceItem[]>>;
  addOns?: AddOnItem[];
  setAddOns?: React.Dispatch<React.SetStateAction<AddOnItem[]>>;
  client?: ClientInfo;
  setClient?: React.Dispatch<React.SetStateAction<ClientInfo>>;
  customItems?: CustomQuoteItem[];
  setCustomItems?: React.Dispatch<React.SetStateAction<CustomQuoteItem[]>>;
  descuentoValor?: number;
  setDescuentoValor?: (v: number) => void;
  descuentoTipo?: 'percentage' | 'fixed';
  setDescuentoTipo?: (t: 'percentage' | 'fixed') => void;
  aplicaIVA?: boolean;
  setAplicaIVA?: (v: boolean) => void;
  porcentajeIVA?: number;
  setPorcentajeIVA?: (v: number) => void;
  moneda?: string;
  setMoneda?: (m: string) => void;
  onSaveQuote?: (quote: QuoteData) => void;
  onGenerateInvoice?: (quote: QuoteData) => void;
  onPrintQuote?: (quote: QuoteData) => void;
  onAskGeminiAboutQuote?: (quote: QuoteData) => void;
  savedQuotes?: QuoteData[];
  onLoadSavedQuote?: (quote: QuoteData) => void;
  appMode?: AppMode;
  currentRole?: 'admin' | 'cliente' | 'public';
}

const timeOptions = (() => {
  const options = [];
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 30) {
      const hourStr = String(h).padStart(2, '0');
      const minStr = String(m).padStart(2, '0');
      const val = `${hourStr}:${minStr}`;
      
      const isPm = h >= 12;
      const displayH = h % 12 === 0 ? 12 : h % 12;
      const displayHStr = String(displayH).padStart(2, '0');
      const ampm = isPm ? 'PM' : 'AM';
      
      options.push({
        value: val,
        label: `${displayHStr}:${minStr} ${ampm}`
      });
    }
  }
  return options;
})();

export const CotizadorSection: React.FC<CotizadorSectionProps> = ({
  services = [],
  setServices = (() => {}) as any,
  addOns = [],
  setAddOns = (() => {}) as any,
  client = { 
    nombre: '', 
    nombreArtistico: '', 
    nombreReal: '', 
    email: '', 
    telefono: '', 
    instagram: '', 
    empresa: '', 
    notas: '',
    fechaSesion: '2026-08-10',
    horaInicio: '14:00',
    horaSalida: '19:00',
    totalHoras: 5,
    fechaEntrega: '2026-08-15',
    aceptacionPoliticas: true
  },
  setClient = (() => {}) as any,
  customItems = [],
  setCustomItems = (() => {}) as any,
  descuentoValor = 0,
  setDescuentoValor = (() => {}) as any,
  descuentoTipo = 'percentage',
  setDescuentoTipo = (() => {}) as any,
  aplicaIVA = false,
  setAplicaIVA = (() => {}) as any,
  porcentajeIVA = 16,
  setPorcentajeIVA = (() => {}) as any,
  moneda = '$ USD',
  setMoneda = (() => {}) as any,
  onSaveQuote = (() => {}) as any,
  onGenerateInvoice = (() => {}) as any,
  onPrintQuote = (() => {}) as any,
  onAskGeminiAboutQuote = (() => {}) as any,
  savedQuotes = [],
  onLoadSavedQuote = (() => {}) as any,
  appMode = 'admin',
  currentRole,
}) => {
  const effectiveRole = currentRole || appMode;
  const isAdmin = effectiveRole === 'admin';
  const [selectedCategory, setSelectedCategory] = useState<ServiceCategory | 'all'>('all');
  const [newCustomTitle, setNewCustomTitle] = useState('');
  const [newCustomPrice, setNewCustomPrice] = useState('');
  const [showSavedQuotesModal, setShowSavedQuotesModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // States for custom calendar date picker
  const [showCalendarPicker, setShowCalendarPicker] = useState(false);
  const [pickerCurrentDate, setPickerCurrentDate] = useState<Date>(() => {
    const d = client.fechaSesion ? new Date(client.fechaSesion + 'T12:00:00') : new Date(2026, 7, 10);
    return isNaN(d.getTime()) ? new Date(2026, 7, 10) : d;
  });

  // Keep picker date in sync with client.fechaSesion if it changes from outside
  useEffect(() => {
    if (client.fechaSesion) {
      const d = new Date(client.fechaSesion + 'T12:00:00');
      if (!isNaN(d.getTime())) {
        setPickerCurrentDate(d);
      }
    }
  }, [client.fechaSesion]);

  const pickerYear = pickerCurrentDate.getFullYear();
  const pickerMonth = pickerCurrentDate.getMonth(); // 0-indexed

  const pickerNombresMeses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const pickerDiasSemana = ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa'];

  const pickerPrimerDiaOffset = new Date(pickerYear, pickerMonth, 1).getDay();
  const pickerDiasEnMes = new Date(pickerYear, pickerMonth + 1, 0).getDate();

  const pickerCeldasVacias = Array.from({ length: pickerPrimerDiaOffset });
  const pickerDiasArray = Array.from({ length: pickerDiasEnMes }, (_, i) => i + 1);

  const handlePrevMonth = () => {
    setPickerCurrentDate(new Date(pickerYear, pickerMonth - 1, 1));
  };

  const handleNextMonth = () => {
    setPickerCurrentDate(new Date(pickerYear, pickerMonth + 1, 1));
  };

  const handleSelectPickerDay = (day: number) => {
    const mStr = String(pickerMonth + 1).padStart(2, '0');
    const dStr = String(day).padStart(2, '0');
    const newFecha = `${pickerYear}-${mStr}-${dStr}`;
    setClient((prev: any) => ({ ...prev, fechaSesion: newFecha }));
    setShowCalendarPicker(false);
  };

  const handleClearForm = () => {
    setClient({
      nombre: '',
      nombreArtistico: '',
      nombreReal: '',
      email: '',
      telefono: '',
      instagram: '',
      empresa: '',
      notas: '',
      fechaSesion: '',
      horaInicio: '14:00',
      horaSalida: '19:00',
      totalHoras: 5,
      fechaEntrega: '',
      aceptacionPoliticas: true
    });
    
    if (setServices) {
      setServices(prev => prev.map(s => ({ ...s, selected: false, quantity: 1 })));
    }
    
    if (setCustomItems) {
      setCustomItems([]);
    }
    
    if (setDescuentoValor) {
      setDescuentoValor(0);
    }
    
    if (setAplicaIVA) {
      setAplicaIVA(false);
    }
    
    showToast('Campos de cotización limpiados con éxito.');
  };

  // Categories config matching La Facultad Studio audio services
  const categories: { id: ServiceCategory | 'all'; label: string; count: number }[] = [
    { id: 'all', label: 'Todos los Servicios', count: services.length },
    { id: 'produccion', label: '1. Producción & Beats', count: services.filter(s => s.category === 'produccion').length },
    { id: 'grabacion', label: '2. Grabación', count: services.filter(s => s.category === 'grabacion').length },
    { id: 'mezcla', label: '3. Mezcla & Master', count: services.filter(s => s.category === 'mezcla').length },
  ];

  const filteredServices = useMemo(() => {
    if (selectedCategory === 'all') return services;
    return services.filter(s => s.category === selectedCategory);
  }, [services, selectedCategory]);

  // Automatic hours calculation from start and end time
  useEffect(() => {
    if (client.horaInicio && client.horaSalida) {
      const [startH, startM] = client.horaInicio.split(':').map(Number);
      const [endH, endM] = client.horaSalida.split(':').map(Number);
      let diff = (endH * 60 + endM) - (startH * 60 + startM);
      if (diff < 0) diff += 24 * 60; // next day edge case
      const hrs = Math.max(1, Math.round(diff / 60));
      if (hrs !== client.totalHoras) {
        setClient(prev => ({ ...prev, totalHoras: hrs }));
      }
    }
  }, [client.horaInicio, client.horaSalida]);

  // Sync hours quantity with selected hourly services
  useEffect(() => {
    if (client.totalHoras > 0) {
      setServices(prev =>
        prev.map(s => {
          if (s.unit.toLowerCase().includes('hora') && s.selected) {
            return { ...s, quantity: client.totalHoras };
          }
          return s;
        })
      );
    }
  }, [client.totalHoras]);

  // Calculations
  const selectedServicesList = useMemo(() => {
    return services.filter(s => s.selected);
  }, [services]);

  const selectedAddOnsList = useMemo(() => {
    return addOns.filter(a => a.selected);
  }, [addOns]);

  const servicesSubtotal = useMemo(() => {
    return selectedServicesList.reduce((acc, item) => acc + item.price * item.quantity, 0);
  }, [selectedServicesList]);

  const customItemsSubtotal = useMemo(() => {
    return customItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
  }, [customItems]);

  const fixedAddOnsSubtotal = useMemo(() => {
    return selectedAddOnsList
      .filter(a => a.type === 'fixed')
      .reduce((acc, item) => acc + item.price, 0);
  }, [selectedAddOnsList]);

  const baseSubtotal = servicesSubtotal + customItemsSubtotal + fixedAddOnsSubtotal;

  // Percentage add-ons (like Express Delivery 25%) calculated on base subtotal
  const percentageAddOnsSubtotal = useMemo(() => {
    return selectedAddOnsList
      .filter(a => a.type === 'percentage')
      .reduce((acc, item) => acc + (baseSubtotal * (item.price / 100)), 0);
  }, [selectedAddOnsList, baseSubtotal]);

  const totalSubtotal = baseSubtotal + percentageAddOnsSubtotal;

  const descuentoMonto = useMemo(() => {
    if (descuentoValor <= 0) return 0;
    if (descuentoTipo === 'percentage') {
      return (totalSubtotal * (descuentoValor / 100));
    }
    return Math.min(descuentoValor, totalSubtotal);
  }, [totalSubtotal, descuentoValor, descuentoTipo]);

  const descuentoPorcentajeDisplay = useMemo(() => {
    if (totalSubtotal <= 0) return '0%';
    if (descuentoTipo === 'percentage') {
      return `${descuentoValor}%`;
    } else {
      const pct = (descuentoMonto / totalSubtotal) * 100;
      return `${pct.toFixed(1)}%`;
    }
  }, [totalSubtotal, descuentoTipo, descuentoValor, descuentoMonto]);

  const subtotalConDescuento = Math.max(0, totalSubtotal - descuentoMonto);

  const ivaMonto = useMemo(() => {
    if (!aplicaIVA) return 0;
    return subtotalConDescuento * (porcentajeIVA / 100);
  }, [aplicaIVA, subtotalConDescuento, porcentajeIVA]);

  const grandTotal = subtotalConDescuento + ivaMonto;

  // ESTRATEGIA 2026:
  // - Canción individual / Servicio único: $50 USD depósito fijo
  // - Paquetes / Producción / Múltiples servicios: 50% de depósito
  const isSingleTrackBasic = useMemo(() => {
    return (
      selectedServicesList.length === 1 &&
      selectedServicesList[0].quantity === 1 &&
      customItemsSubtotal === 0 &&
      selectedAddOnsList.length === 0 &&
      grandTotal <= 200
    );
  }, [selectedServicesList, customItemsSubtotal, selectedAddOnsList, grandTotal]);

  const depositoRequerido = useMemo(() => {
    if (grandTotal <= 0) return 0;
    if (isSingleTrackBasic) {
      return Math.min(50, grandTotal);
    }
    return Math.round(grandTotal * 0.5 * 100) / 100;
  }, [grandTotal, isSingleTrackBasic]);

  const balancePendiente = Math.max(0, grandTotal - depositoRequerido);

  // VALIDACIÓN TÉCNICA DE PROCESOS (AUDITORÍA FASE 2)
  const validationWarnings = useMemo(() => {
    const warnings: string[] = [];
    const hasMasterOnly = selectedServicesList.some(s => s.id === 'masterizacion');
    const hasMezcla = selectedServicesList.some(s => 
      s.id === 'mezcla-master-voces' || 
      s.id === 'mezcla-completa-master' || 
      s.id === 'mezcla-pista' || 
      s.id === 'grab-mezcla-master' || 
      s.id === 'promo-reapertura' || 
      s.id === 'full-pack'
    );

    if (hasMasterOnly && !hasMezcla) {
      warnings.push('⚠️ Aviso de Ingeniería: Has seleccionado únicamente "Masterización". Para obtener el mejor resultado comercial, asegúrate de adjuntar una mezcla final estéreo procesada en WAV 24-bit (-6 dBFS de Headroom). Si necesitas balance de canales o afinación de voces, añade "Mezcla" a tu cotización.');
    }

    return warnings;
  }, [selectedServicesList]);

  // Helper to format currency
  const formatMoney = (amount: number) => {
    const formatted = amount.toLocaleString('es-MX', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    return `${moneda} ${formatted}`;
  };

  // Helper dates for official quotation validity (7 days)
  const fechaEmision = useMemo(() => new Date().toISOString().split('T')[0], []);
  const fechaValidez = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  }, []);

  // WhatsApp formal quote share handler (Executive Proposal)
  const handleShareWhatsApp = () => {
    const lineasServicios = [
      ...selectedServicesList.map(s => `• ${s.name} (x${s.quantity}): $${(s.price * s.quantity).toFixed(2)} USD`),
      ...customItems.map(c => `• ${c.name} (x${c.quantity}): $${(c.price * c.quantity).toFixed(2)} USD`),
      ...selectedAddOnsList.map(a => `• + ${a.name}`)
    ].join('\n');

    const textoMensaje = `📋 *COTIZACIÓN FORMAL DE PRODUCCIÓN*
*LA FACULTAD STUDIO | BADLENZ*
──────────────────────
• *Folio:* COT-${currentQuoteData.numeroCotizacion}
• *Artista / Cliente:* ${client.nombreArtistico || client.nombre || 'Artista'}
• *Fecha de Emisión:* ${fechaEmision}
• *Validez de la Oferta:* 7 días (hasta ${fechaValidez})

🎚️ *DETALLE DE SERVICIOS:*
${lineasServicios || '• Servicios según requerimientos acordados'}

💰 *RESUMEN FINANCIERO:*
• *Inversión Total:* ${formatMoney(grandTotal)}
• *Depósito para Congelar Fecha:* ${formatMoney(depositoRequerido)} (vía ATH Móvil)
• *Balance al Entregar:* ${formatMoney(balancePendiente)}
_(El balance se liquida exclusivamente contra entrega de tu Máster WAV 24-bit y Stems)_

📍 *Estudio:* Hormigueros, Puerto Rico
🎙️ *Productor Principal:* Manuel "Badlenz" Silva

¿Confirmamos fecha en el studio con tu depósito de ${formatMoney(depositoRequerido)}?`;

    navigator.clipboard.writeText(textoMensaje);
    showToast('¡Presupuesto copiado al portapapeles y abriendo WhatsApp!');
    const phone = client.telefono ? client.telefono.replace(/[^0-9]/g, '') : '';
    const url = phone 
      ? `https://wa.me/${phone}?text=${encodeURIComponent(textoMensaje)}` 
      : `https://wa.me/?text=${encodeURIComponent(textoMensaje)}`;
    window.open(url, '_blank');
  };

  // Print / PDF download of formal quote
  const handlePrintQuote = () => {
    printElementById('area-cotizacion-formal', `Cotizacion_Badlenz_COT-${currentQuoteData.numeroCotizacion}`);
    showToast('Generando vista de impresión / PDF...');
  };

  // Toggle Service selection
  const handleToggleService = (id: string) => {
    setServices(prev =>
      prev.map(s => (s.id === id ? { ...s, selected: !s.selected } : s))
    );
  };

  // Update quantity
  const handleQuantityChange = (id: string, delta: number) => {
    setServices(prev =>
      prev.map(s => {
        if (s.id === id) {
          const newQty = Math.max(1, s.quantity + delta);
          return { ...s, quantity: newQty, selected: true };
        }
        return s;
      })
    );
  };

  // Toggle AddOn
  const handleToggleAddOn = (id: string) => {
    setAddOns(prev =>
      prev.map(a => (a.id === id ? { ...a, selected: !a.selected } : a))
    );
  };

  // Add Custom Item
  const handleAddCustomItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomTitle.trim()) return;
    const priceNum = parseFloat(newCustomPrice) || 0;
    const newItem: CustomQuoteItem = {
      id: `custom-${Date.now()}`,
      name: newCustomTitle.trim(),
      price: priceNum,
      quantity: 1,
    };
    setCustomItems(prev => [...prev, newItem]);
    setNewCustomTitle('');
    setNewCustomPrice('');
    showToast('Ítem personalizado agregado');
  };

  const handleRemoveCustomItem = (id: string) => {
    setCustomItems(prev => prev.filter(i => i.id !== id));
  };

  // Current Quote object builder
  const currentQuoteData: QuoteData = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return {
      id: `quote-${Date.now()}`,
      numeroCotizacion: `PASE-LFS-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      fecha: today,
      cliente: client,
      servicios: services,
      addOns: addOns,
      customItems: customItems,
      descuentoValor,
      descuentoTipo,
      aplicaIVA,
      porcentajeIVA,
      moneda,
      subtotal: totalSubtotal,
      descuentoMonto,
      ivaMonto,
      depositoRequerido,
      balancePendiente,
      total: grandTotal,
      estado: 'Borrador',
    };
  }, [
    client,
    services,
    addOns,
    customItems,
    descuentoValor,
    descuentoTipo,
    aplicaIVA,
    porcentajeIVA,
    moneda,
    totalSubtotal,
    descuentoMonto,
    ivaMonto,
    depositoRequerido,
    balancePendiente,
    grandTotal,
  ]);

  const [sheetsUrl, setSheetsUrl] = useState<string | null>(null);

  const handleSave = async () => {
    if (client.email || client.nombreArtistico || client.nombreReal) {
      const cli = guardarCliente({
        nombreArtistico: client.nombreArtistico || client.nombre || 'Artista LFS',
        nombreReal: client.nombreReal || client.nombre || '',
        email: client.email || 'cliente@lafacultad.com',
        telefono: client.telefono || '',
        instagram: client.instagram || ''
      });

      const selectedServices = services.filter(s => s.selected).map(s => s.name);
      guardarReserva({
        clienteId: cli.id,
        nombreArtistico: cli.nombreArtistico,
        fecha: client.fechaSesion || new Date().toISOString().split('T')[0],
        horaInicio: client.horaInicio || '14:00',
        horaSalida: client.horaSalida || '19:00',
        totalHoras: client.totalHoras || 5,
        servicios: selectedServices.length > 0 ? selectedServices : ['Sesión de Grabación'],
        subtotal: totalSubtotal,
        deposito: depositoRequerido,
        balance: balancePendiente
      });
    }

    onSaveQuote(currentQuoteData);

    // Automatic sync to Google Sheets
    try {
      const res = await syncQuoteToGoogleSheets(currentQuoteData);
      if (res.spreadsheetUrl) {
        setSheetsUrl(res.spreadsheetUrl);
      }
      if (res.message) {
        showToast(res.message);
      } else {
        showToast('¡Cotización guardada exitosamente!');
      }
    } catch (e) {
      showToast('¡Cotización guardada exitosamente!');
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-red-600 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-red-400/30 animate-bounce">
          <CheckCircle className="w-5 h-5 text-amber-400" />
          <span className="font-semibold text-sm">{toastMessage}</span>
        </div>
      )}

      {/* Banner Studio Header (Spatial Control Room Design) */}
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-[#10131e] via-[#0b0d14] to-[#07090f] p-6 sm:p-7 shadow-[0_20px_50px_rgba(0,0,0,0.8)] text-white">
        <div className="absolute top-0 right-0 -mt-6 -mr-6 w-56 h-56 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-[10px] font-mono font-black bg-gradient-to-r from-red-600 to-amber-600 text-white uppercase tracking-widest shadow">
                LA FACULTAD STUDIO | BADLENZ
              </span>
              <span className="text-[10px] font-mono text-zinc-400">Audio Desk</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-syne font-bold text-white uppercase tracking-tight">
              Calculadora Digital de Servicios de Estudio
            </h1>
            <p className="text-zinc-300 text-xs font-dmsans max-w-2xl">
              Cotización transparente, pase de estudio inmediato y desglose oficial: $50 de depósito por canción / 50% en combos.
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap shrink-0">
            <button
              onClick={async () => {
                const res = await syncQuoteToGoogleSheets(currentQuoteData);
                if (res.spreadsheetUrl) {
                  window.open(res.spreadsheetUrl, '_blank');
                }
                showToast(res.message || 'Sincronizado con Google Sheets');
              }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-emerald-950/80 hover:bg-emerald-900 text-emerald-200 text-xs font-bold border border-emerald-700/60 transition-all shadow-md active:scale-95 cursor-pointer"
              title="Abrir o sincronizar cotización con Google Sheets"
            >
              <FileText className="w-4 h-4 text-emerald-400" />
              <span className="font-syne">Google Sheets</span>
            </button>

            {savedQuotes.length > 0 && (
              <button
                onClick={() => setShowSavedQuotesModal(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-zinc-900/90 hover:bg-zinc-800 text-zinc-200 text-xs font-bold border border-white/10 transition-all active:scale-95 cursor-pointer"
              >
                <FolderCheck className="w-4 h-4 text-amber-400" />
                <span className="font-syne">Cotizaciones Guardadas ({savedQuotes.length})</span>
              </button>
            )}

            <button
              onClick={() => onAskGeminiAboutQuote(currentQuoteData)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white text-xs font-bold border border-red-500/50 transition-all shadow-lg shadow-red-950/50 active:scale-95 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span className="font-syne">Asistente IA</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main 2-Column Grid Layout (As requested in prompt) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* ========================================== */}
        {/* LEFT COLUMN: PARAMETERS & FORM (COL 7/12)   */}
        {/* ========================================== */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* CARD 1: DATOS DEL ARTISTA / CLIENTE & RESERVA (PDF Requirement) */}
          <div className="relative overflow-hidden rounded-3xl p-6 border border-white/10 bg-[#0d1019]/90 backdrop-blur-xl shadow-xl space-y-5 text-white">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-red-600/20 text-red-400 border border-red-500/30">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">
                    {isAdmin ? 'Configuración de Sesión (Interna)' : 'Reserva tu Sesión / Datos del Artista'}
                  </h2>
                  <p className="text-xs text-slate-400">Parámetros del artista y reserva de sesión</p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleClearForm}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-950/40 hover:bg-red-900/60 hover:text-white border border-red-800/60 text-xs font-bold text-red-400 transition-colors"
                title="Limpiar todos los campos del artista y reiniciar cotización"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Limpiar Campos</span>
              </button>
            </div>

            {isAdmin && (
              <div className="p-3 bg-red-950/40 border border-red-800/60 rounded-xl text-xs text-red-300 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />
                <span>Modo Administrador Activo: Puedes anular depósitos o modificar tarifas manualmente.</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Nombre Artístico */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-amber-400 mb-1.5 flex items-center gap-1.5">
                  <Music className="w-3.5 h-3.5" /> Nombre Artístico
                </label>
                <input
                  type="text"
                  placeholder="Ej: BADLENZ / El King"
                  value={client.nombreArtistico || ''}
                  onChange={(e) => setClient({ ...client, nombreArtistico: e.target.value, nombre: e.target.value || client.nombreReal })}
                  id="client-artistic-name"
                  className="w-full bg-black border border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-red-500 transition-colors font-semibold"
                />
              </div>

              {/* Nombre Real */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-slate-400" /> Nombre Real (Legal)
                </label>
                <input
                  type="text"
                  placeholder="Ej: Carlos Arturo Mendoza"
                  value={client.nombreReal || ''}
                  onChange={(e) => setClient({ ...client, nombreReal: e.target.value })}
                  id="client-real-name"
                  className="w-full bg-black border border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-red-500 transition-colors"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400" /> Correo Electrónico
                </label>
                <input
                  type="email"
                  placeholder="badlenz.music@gmail.com"
                  value={client.email}
                  onChange={(e) => setClient({ ...client, email: e.target.value })}
                  id="client-email-input"
                  className="w-full bg-black border border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-red-500 transition-colors"
                />
              </div>

              {/* WhatsApp / Teléfono */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400" /> Teléfono / WhatsApp
                </label>
                <input
                  type="tel"
                  placeholder="+52 55 8820 4910"
                  value={client.telefono}
                  onChange={(e) => setClient({ ...client, telefono: e.target.value })}
                  id="client-phone-input"
                  className="w-full bg-black border border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-red-500 transition-colors"
                />
              </div>

              {/* Instagram / Redes Social */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1.5">
                  <Instagram className="w-3.5 h-3.5 text-amber-400" /> Instagram / Red Social
                </label>
                <input
                  type="text"
                  placeholder="@badlenz_official"
                  value={client.instagram || ''}
                  onChange={(e) => setClient({ ...client, instagram: e.target.value })}
                  id="client-instagram-input"
                  className="w-full bg-black border border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-red-500 transition-colors"
                />
              </div>

              {/* Período de Sesión / Bloque de Horas */}
              <div className="sm:col-span-2 p-4 bg-black rounded-xl border border-neutral-800 space-y-3">
                <span className="text-xs font-extrabold uppercase tracking-wider text-amber-400 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-400" /> Horario y Duración de la Reserva
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div className="relative">
                    <label className="text-[11px] font-bold text-slate-400 block mb-1">Fecha</label>
                    <button
                      type="button"
                      onClick={() => setShowCalendarPicker(!showCalendarPicker)}
                      className="w-full bg-black border border-neutral-800 hover:border-red-500/50 rounded-lg p-2 text-xs text-white text-left flex items-center justify-between transition-colors min-h-[34px]"
                    >
                      <span className="font-semibold text-slate-200">
                        {client.fechaSesion ? (() => {
                          const [y, m, d] = client.fechaSesion.split('-');
                          const dateObj = new Date(Number(y), Number(m) - 1, Number(d));
                          if (isNaN(dateObj.getTime())) return client.fechaSesion;
                          return dateObj.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
                        })() : 'Seleccionar...'}
                      </span>
                      <CalendarIcon className="w-3.5 h-3.5 text-red-500" />
                    </button>

                    {showCalendarPicker && (
                      <div className="absolute left-0 mt-1 z-50 bg-[#1e1e1e] border border-neutral-700 rounded-xl p-3 shadow-2xl space-y-3 w-72">
                        {/* Header picker */}
                        <div className="flex justify-between items-center pb-2 border-b border-neutral-800">
                          <button
                            type="button"
                            onClick={handlePrevMonth}
                            className="p-1 rounded hover:bg-neutral-800 text-slate-400 hover:text-white"
                          >
                            &larr;
                          </button>
                          <span className="text-xs font-bold text-slate-200">
                            {pickerNombresMeses[pickerMonth]} {pickerYear}
                          </span>
                          <button
                            type="button"
                            onClick={handleNextMonth}
                            className="p-1 rounded hover:bg-neutral-800 text-slate-400 hover:text-white"
                          >
                            &rarr;
                          </button>
                        </div>

                        {/* Dias de la semana picker */}
                        <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-slate-500">
                          {pickerDiasSemana.map((d, i) => (
                            <div key={i}>{d}</div>
                          ))}
                        </div>

                        {/* Dias del mes picker */}
                        <div className="grid grid-cols-7 gap-1">
                          {pickerCeldasVacias.map((_, idx) => (
                            <div key={`empty-${idx}`} className="h-6"></div>
                          ))}
                          {pickerDiasArray.map((day) => {
                            const mStr = String(pickerMonth + 1).padStart(2, '0');
                            const dStr = String(day).padStart(2, '0');
                            const loopFechaStr = `${pickerYear}-${mStr}-${dStr}`;
                            const isSelected = client.fechaSesion === loopFechaStr;

                            return (
                              <button
                                key={day}
                                type="button"
                                onClick={() => handleSelectPickerDay(day)}
                                className={`h-6 text-[11px] rounded flex items-center justify-center font-bold transition-all ${
                                  isSelected
                                    ? 'bg-red-600 text-white shadow'
                                    : 'text-slate-300 hover:bg-neutral-800'
                                }`}
                              >
                                {day}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 block mb-1">Hora Inicio</label>
                    <select
                      value={client.horaInicio || '14:00'}
                      onChange={(e) => setClient({ ...client, horaInicio: e.target.value })}
                      className="w-full bg-black border border-neutral-800 rounded-lg p-2 text-xs text-white focus:border-red-500 focus:outline-none cursor-pointer min-h-[34px]"
                    >
                      {timeOptions.map((opt) => (
                        <option key={opt.value} value={opt.value} className="bg-[#1e1e1e]">
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 block mb-1">Hora Salida</label>
                    <select
                      value={client.horaSalida || '18:00'}
                      onChange={(e) => setClient({ ...client, horaSalida: e.target.value })}
                      className="w-full bg-black border border-neutral-800 rounded-lg p-2 text-xs text-white focus:border-red-500 focus:outline-none cursor-pointer min-h-[34px]"
                    >
                      {timeOptions.map((opt) => (
                        <option key={opt.value} value={opt.value} className="bg-[#1e1e1e]">
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-amber-400 block mb-1">Total Horas</label>
                    <div className="w-full bg-red-950/60 border border-red-500/50 rounded-lg p-2 text-xs font-black text-amber-300 text-center min-h-[34px] flex items-center justify-center">
                      {client.totalHoras || 5} hrs
                    </div>
                  </div>
                </div>
              </div>

              {/* REGLA DE 20 MINUTOS DE GRACIA (PDF HIGHLIGHT MANDATE) */}
              <div className="sm:col-span-2 p-4 bg-amber-500/10 border-2 border-amber-500/40 rounded-2xl space-y-2">
                <div className="flex items-start gap-2.5">
                  <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-extrabold uppercase text-amber-400 tracking-wider">
                      Regla Oficial de Puntualidad (20 Minutos de Gracia)
                    </h4>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                      El artista o cliente cuenta con un margen de tolerancia máximo de <strong>20 minutos de gracia</strong> sobre la hora pactada de inicio. Transcurrido dicho tiempo, el reloj comenzará a correr como tiempo de estudio consumido.
                    </p>
                  </div>
                </div>

                <label className="flex items-center gap-2 pt-2 border-t border-amber-500/20 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={client.aceptacionPoliticas ?? true}
                    onChange={(e) => setClient({ ...client, aceptacionPoliticas: e.target.checked })}
                    className="w-4 h-4 rounded border-amber-500 accent-amber-500"
                  />
                  <span className="text-xs text-amber-300 font-semibold">
                    Confirmo que el Artista / Cliente acepta la regla de 20 minutos de gracia.
                  </span>
                </label>
              </div>

            </div>
          </div>

          {/* CARD 2: SELECCIÓN DE SERVICIOS DEL ESTUDIO */}
          <div className="relative overflow-hidden rounded-3xl p-6 border border-white/10 bg-[#0d1019]/90 backdrop-blur-xl shadow-xl space-y-6 text-white">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-red-600/20 text-red-400 border border-red-500/30">
                  <CheckSquare className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">2. Servicios de Producción Musical</h2>
                  <p className="text-xs text-slate-400">Selecciona los servicios requeridos para el proyecto</p>
                </div>
              </div>

              <span className="text-xs font-bold text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/30">
                {selectedServicesList.length} seleccionados
              </span>
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                    selectedCategory === cat.id
                      ? 'bg-red-600 text-white shadow-md'
                      : 'bg-black text-slate-400 hover:text-white border border-neutral-800'
                  }`}
                >
                  {cat.label} ({cat.count})
                </button>
              ))}
            </div>

            {/* Validation Warnings (Auditoría Fase 2) */}
            {validationWarnings.length > 0 && (
              <div className="space-y-2">
                {validationWarnings.map((warn, i) => (
                  <div key={i} className="p-3.5 bg-amber-950/40 border border-amber-500/50 rounded-xl text-xs text-amber-200 flex items-start gap-2.5 leading-relaxed shadow-sm">
                    <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <span>{warn}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Services List Grid */}
            <div className="space-y-3">
              {filteredServices.map((service) => {
                return (
                  <div
                    key={service.id}
                    className={`p-4 rounded-xl border transition-all duration-200 cursor-pointer ${
                      service.selected
                        ? 'border-2 border-red-500 bg-red-950/20 shadow-md'
                        : 'border border-neutral-800 bg-black hover:border-neutral-700'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={service.selected}
                        onChange={() => handleToggleService(service.id)}
                        id={`service-checkbox-${service.id}`}
                        className="mt-1 w-5 h-5 rounded border-slate-700 accent-red-600 cursor-pointer"
                      />

                      <div className="flex-1" onClick={() => handleToggleService(service.id)}>
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="text-sm font-bold text-white">{service.name}</h3>
                          <span className="text-sm font-black text-amber-400 whitespace-nowrap">
                            {formatMoney(service.price)}{' '}
                            <span className="text-[10px] text-slate-400 font-normal">/ {service.unit}</span>
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                          {service.description}
                        </p>
                      </div>

                      {/* Quantity Selector if selected */}
                      {service.selected && (
                        <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-lg border border-slate-700 ml-2 shadow-sm">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleQuantityChange(service.id, -1);
                            }}
                            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="text-xs font-black text-white px-2">{service.quantity}</span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleQuantityChange(service.id, 1);
                            }}
                            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Custom Items Creator */}
            <div className="pt-4 border-t border-slate-800">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-red-500" />
                <span>Agregar Servicio Personalizado o Ajuste de Estudio</span>
              </h4>

              <form onSubmit={handleAddCustomItem} className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                <input
                  type="text"
                  placeholder="Ej: Licencia de Sample o Músico Invitado"
                  value={newCustomTitle}
                  onChange={(e) => setNewCustomTitle(e.target.value)}
                  className="sm:col-span-6 bg-black border border-neutral-800 rounded-xl px-4 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-red-500"
                />
                <input
                  type="number"
                  placeholder="Precio (Ej: 100)"
                  value={newCustomPrice}
                  onChange={(e) => setNewCustomPrice(e.target.value)}
                  className="sm:col-span-4 bg-black border border-neutral-800 rounded-xl px-4 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-red-500"
                />
                <button
                  type="submit"
                  className="sm:col-span-2 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl py-2 transition-colors flex items-center justify-center gap-1 shadow-md"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Agregar</span>
                </button>
              </form>

              {/* Added Custom Items List */}
              {customItems.length > 0 && (
                <div className="mt-4 space-y-2">
                  {customItems.map((c) => (
                    <div
                      key={c.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-black border border-neutral-800 text-xs text-white"
                    >
                      <span className="font-semibold">{c.name}</span>
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-amber-400">{formatMoney(c.price)}</span>
                        <button
                          onClick={() => handleRemoveCustomItem(c.id)}
                          className="text-slate-400 hover:text-red-400 p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* CARD 3: MONEDA & DESCUENTOS */}
          <div className="relative overflow-hidden rounded-3xl p-6 border border-white/10 bg-[#0d1019]/90 backdrop-blur-xl shadow-xl space-y-6 text-white">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
              <div className="p-2 rounded-xl bg-red-600/20 text-red-400 border border-red-500/30">
                <Tag className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">3. Moneda & Descuentos</h2>
                <p className="text-xs text-slate-400">Ajusta la divisa del proyecto y aplica descuentos generales</p>
              </div>
            </div>

            {/* Financial Parameters: Moneda y Descuento */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Moneda */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Moneda
                </label>
                <select
                  value={moneda}
                  onChange={(e) => setMoneda(e.target.value)}
                  className="w-full bg-black border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-red-500"
                >
                  <option value="$ USD">$ USD (Dólar)</option>
                  <option value="$ MXN">$ MXN (Peso Mex)</option>
                  <option value="$ COP">$ COP (Peso Col)</option>
                  <option value="€ EUR">€ EUR (Euro)</option>
                </select>
              </div>

              {/* Descuento */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center justify-between">
                  <span>Descuento</span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setDescuentoTipo('percentage')}
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        descuentoTipo === 'percentage' ? 'bg-red-600 text-white' : 'bg-neutral-800 text-slate-400'
                      }`}
                    >
                      %
                    </button>
                    <button
                      type="button"
                      onClick={() => setDescuentoTipo('fixed')}
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        descuentoTipo === 'fixed' ? 'bg-red-600 text-white' : 'bg-neutral-800 text-slate-400'
                      }`}
                    >
                      Fijo
                    </button>
                  </div>
                </label>
                <input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={descuentoValor || ''}
                  onChange={(e) => setDescuentoValor(parseFloat(e.target.value) || 0)}
                  className="w-full bg-black border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-red-500"
                />
              </div>

            </div>
          </div>

        </div>

        {/* ======================================================== */}
        {/* RIGHT COLUMN: COTIZACIÓN FORMAL DE PRODUCCIÓN (PRESUPUESTO) */}
        {/* ======================================================== */}
        <div className="lg:col-span-5 lg:sticky lg:top-24 space-y-6">
          
          <div 
            id="area-cotizacion-formal"
            className="relative overflow-hidden rounded-3xl p-6 sm:p-7 shadow-[0_25px_60px_rgba(0,0,0,0.8)] border border-amber-500/40 bg-gradient-to-b from-[#131526] via-[#0d0f1a] to-[#07090f] backdrop-blur-2xl flex flex-col justify-between space-y-5 text-white"
          >
            
            {/* Header Preview / Membrete Formal La Facultad Studio */}
            <div>
              <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
                <div className="flex items-center gap-3">
                  <LFCrestLogo size="sm" className="shrink-0" />
                  <div>
                    <span className="text-[10px] font-black bg-amber-500/20 text-amber-300 px-2.5 py-0.5 rounded-full border border-amber-500/30 uppercase tracking-widest block w-fit">
                      LA FACULTAD STUDIO | BADLENZ
                    </span>
                    <h2 className="text-lg sm:text-xl font-black text-white mt-1 tracking-tight font-syne">
                      Cotización Formal de Producción
                    </h2>
                    <p className="text-zinc-400 text-xs font-mono">
                      Folio: <strong className="text-amber-400">COT-{currentQuoteData.numeroCotizacion}</strong>
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="inline-block px-2.5 py-1 rounded-full text-[10px] font-mono font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 uppercase">
                    Validez: 7 Días
                  </span>
                  <p className="text-[10px] text-zinc-400 mt-1">
                    Hasta: <strong className="text-zinc-200">{fechaValidez}</strong>
                  </p>
                </div>
              </div>

              {/* Client & Artist Meta Badge */}
              <div className="p-3.5 rounded-2xl bg-black/60 border border-white/10 space-y-2 mb-4">
                <div className="flex justify-between items-center text-[10px] uppercase font-mono">
                  <span className="font-black text-amber-400">Cliente / Artista:</span>
                  <span className="text-zinc-400">Emisión: {fechaEmision}</span>
                </div>
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-base font-black text-white tracking-wide">
                      {client.nombreArtistico || client.nombre || 'Artista / Cliente'}
                    </p>
                    {client.nombreReal && (
                      <p className="text-xs text-zinc-400">Manejo / Titular: {client.nombreReal}</p>
                    )}
                  </div>
                  <div className="text-right text-xs">
                    <span className="text-amber-400 font-semibold block">{client.telefono || client.instagram || 'Contacto directo'}</span>
                    <span className="text-[10px] text-zinc-400">Sesión: {client.fechaSesion || 'A coordinar'}</span>
                  </div>
                </div>
              </div>

              {/* Selected Items Breakdown List */}
              <div className="space-y-2 max-h-52 overflow-y-auto pr-1 scrollbar-thin">
                <span className="text-[11px] font-bold text-zinc-300 block uppercase tracking-wider">
                  Desglose de Servicios &amp; Producción:
                </span>

                {selectedServicesList.length === 0 && customItems.length === 0 && (
                  <p className="text-zinc-500 italic text-xs text-center py-4">
                    Selecciona servicios en la columna izquierda para generar el presupuesto
                  </p>
                )}

                {/* Selected Services */}
                {selectedServicesList.map((service) => (
                  <div key={service.id} className="flex justify-between items-center text-xs py-1.5 border-b border-white/5">
                    <span className="text-zinc-300 font-medium">{service.name} (x{service.quantity})</span>
                    <span className="font-bold text-white font-mono">{formatMoney(service.price * service.quantity)}</span>
                  </div>
                ))}

                {/* Custom Items */}
                {customItems.map((c) => (
                  <div key={c.id} className="flex justify-between items-center text-xs py-1.5 border-b border-white/5">
                    <span className="text-zinc-300 font-medium">{c.name}</span>
                    <span className="font-bold text-white font-mono">{formatMoney(c.price * c.quantity)}</span>
                  </div>
                ))}

                {/* Add-ons */}
                {selectedAddOnsList.map((addon) => {
                  const addonPriceVal = addon.type === 'percentage' 
                    ? (baseSubtotal * (addon.price / 100))
                    : addon.price;
                  return (
                    <div key={addon.id} className="flex justify-between items-center text-xs py-1.5 border-b border-white/5 text-amber-300">
                      <span>+ {addon.name}</span>
                      <span className="font-bold font-mono">{formatMoney(addonPriceVal)}</span>
                    </div>
                  );
                })}
              </div>

              <div className="h-px bg-white/10 my-4"></div>

              {/* Resumen Financiero Formal & Depósito */}
              <div className="space-y-2 bg-black/70 p-4 rounded-2xl border border-white/10">
                <div className="flex justify-between items-center text-zinc-400 text-xs">
                  <span>Subtotal Servicios</span>
                  <span className="font-mono">{formatMoney(totalSubtotal)}</span>
                </div>

                {descuentoMonto > 0 && (
                  <div className="flex justify-between items-center text-rose-400 text-xs">
                    <span>Descuento / Ahorro ({descuentoPorcentajeDisplay})</span>
                    <span className="font-mono">- {formatMoney(descuentoMonto)}</span>
                  </div>
                )}

                {aplicaIVA && (
                  <div className="flex justify-between items-center text-zinc-400 text-xs">
                    <span>IVA ({porcentajeIVA}%)</span>
                    <span className="font-mono">{formatMoney(ivaMonto)}</span>
                  </div>
                )}

                <div className="flex justify-between items-center pt-2 border-t border-white/10">
                  <span className="text-sm font-bold text-white">Inversión Total del Proyecto</span>
                  <span className="text-2xl font-black text-amber-400 font-mono">{formatMoney(grandTotal)}</span>
                </div>

                {/* Deposit & Balance Requirements */}
                <div className="grid grid-cols-2 gap-2 pt-3 border-t border-white/10">
                  <div className="p-2.5 rounded-xl bg-red-950/60 border border-red-500/40 text-center">
                    <span className="text-[10px] font-black text-red-300 uppercase tracking-widest block">
                      {isSingleTrackBasic ? 'Depósito para Congelar ($50)' : 'Depósito 50% para Iniciar'}
                    </span>
                    <span className="text-base font-black text-white font-mono">{formatMoney(depositoRequerido)}</span>
                    <span className="text-[9px] text-zinc-400 block mt-0.5">vía ATH Móvil</span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-neutral-900 border border-white/10 text-center">
                    <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest block">
                      Balance al Entregar
                    </span>
                    <span className="text-base font-black text-zinc-200 font-mono">{formatMoney(balancePendiente)}</span>
                    <span className="text-[9px] text-zinc-400 block mt-0.5">Contra Master &amp; Stems</span>
                  </div>
                </div>

                {/* Nota de validez de 7 días */}
                <div className="pt-2 text-[10px] text-zinc-400 border-t border-white/5 leading-relaxed">
                  ⚠️ <strong className="text-zinc-300">Validez formal:</strong> Esta propuesta ejecutiva y sus tarifas se garantizan durante <strong>7 días hábiles</strong>. El turno en el studio se congela enviando el depósito a ATH Móvil (787-240-8627).
                </div>
              </div>

            </div>

            {/* Action Buttons Panel */}
            <div className="space-y-2 pt-1">
              {/* Botón WhatsApp de Alto Impacto */}
              <button
                type="button"
                onClick={handleShareWhatsApp}
                className="w-full bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-gray-950 font-black py-3 px-4 rounded-xl text-xs sm:text-sm uppercase tracking-wider transition shadow-lg shadow-emerald-950/40 flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              >
                <Share2 className="w-4 h-4 text-gray-950" />
                <span>Compartir Presupuesto por WhatsApp</span>
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handlePrintQuote}
                  className="bg-white/[0.06] hover:bg-white/10 text-white py-2.5 px-3 rounded-xl font-bold text-xs border border-white/10 transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                >
                  <Printer className="w-3.5 h-3.5 text-zinc-300" />
                  <span>Imprimir / PDF</span>
                </button>

                <button
                  type="button"
                  onClick={handleSave}
                  className="bg-white/[0.06] hover:bg-white/10 text-white py-2.5 px-3 rounded-xl font-bold text-xs border border-white/10 transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                  id="btn-save-quote"
                >
                  <Save className="w-3.5 h-3.5 text-amber-400" />
                  <span>Guardar</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  onGenerateInvoice(currentQuoteData);
                  showToast('¡Generando Comprobante de Reserva & Factura!');
                }}
                className="w-full bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white py-3 rounded-xl font-black text-xs shadow-lg shadow-red-950/40 transition active:scale-95 flex items-center justify-center gap-2 uppercase tracking-wider cursor-pointer"
                id="btn-generate-invoice"
              >
                <FileSignature className="w-4 h-4 text-amber-200" />
                <span>Generar Comprobante de Reserva &amp; Factura</span>
              </button>
            </div>

          </div>

        </div>

      </div>

      {/* MODAL DE COTIZACIONES GUARDADAS */}
      {showSavedQuotesModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 space-y-6 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <FolderCheck className="w-5 h-5 text-amber-400" />
                <span>Historial de Cotizaciones Guardadas ({savedQuotes.length})</span>
              </h3>
              <button
                onClick={() => setShowSavedQuotesModal(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              {savedQuotes.map((q) => (
                <div
                  key={q.id}
                  className="p-4 rounded-2xl bg-slate-950 border border-slate-800 hover:border-red-500/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-white text-sm">{q.numeroCotizacion}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                        {q.fecha}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 mt-1">
                      Artista: <span className="font-bold text-amber-400">{q.cliente.nombreArtistico || q.cliente.nombre || 'Anónimo'}</span>{' '}
                      {q.cliente.instagram && `(${q.cliente.instagram})`}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="font-black text-amber-400 text-sm">
                      {q.moneda} {q.total.toLocaleString()}
                    </span>
                    <button
                      onClick={() => {
                        onLoadSavedQuote(q);
                        setShowSavedQuotesModal(false);
                        showToast('Cotización cargada al editor');
                      }}
                      className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-colors"
                    >
                      Cargar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

