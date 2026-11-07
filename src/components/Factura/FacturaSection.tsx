import React, { useState, useEffect } from 'react';
import { InvoiceData } from '../../types';
import { 
  FileText, 
  Printer, 
  CheckCircle, 
  Copy, 
  Check, 
  Award, 
  CheckSquare,
  ShieldAlert,
  Ticket,
  FileSignature,
  Save,
  Download,
  FolderCheck,
  Edit3,
  X,
  Search,
  Trash2,
  QrCode,
  Clock,
  User,
  Phone,
  DollarSign,
  Sparkles,
  Share2,
  Receipt
} from 'lucide-react';
import { StudioDocumentHeader, StudioDocumentFooter } from '../BrandingLogos';
import { printElementById, downloadDocumentHtml } from '../../utils/printDocument';

interface FacturaSectionProps {
  invoice: InvoiceData;
  setInvoice: React.Dispatch<React.SetStateAction<InvoiceData>>;
  onPrintInvoice?: (inv: InvoiceData) => void;
}

export type DocumentType = 'factura' | 'comprobante' | 'pase' | 'contrato' | 'orden' | 'certificado' | 'splitsheet';

export interface SavedStudioDocument {
  id: string;
  type: DocumentType;
  title: string;
  folio: string;
  date: string;
  clientName: string;
  clientPhone: string;
  total: number;
  currency: string;
  paymentStatus: string;
  invoiceData: InvoiceData;
  createdAt: string;
}

const DOCUMENT_DB_KEY = 'la_facultad_documentos_db';

export const FacturaSection: React.FC<FacturaSectionProps> = ({
  invoice,
  setInvoice,
  onPrintInvoice,
}) => {
  const [copiedBankInfo, setCopiedBankInfo] = useState(false);
  const [copiedDocText, setCopiedDocText] = useState(false);
  const [activeDocView, setActiveDocView] = useState<DocumentType>('factura');
  const [showEditPanel, setShowEditPanel] = useState(false);
  const [showSavedDocsModal, setShowSavedDocsModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [savedDocs, setSavedDocs] = useState<SavedStudioDocument[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Load saved documents history on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(DOCUMENT_DB_KEY);
      if (stored) {
        setSavedDocs(JSON.parse(stored));
      }
    } catch (err) {
      console.warn('Error reading saved docs:', err);
    }
  }, []);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const saveDocsToStorage = (updated: SavedStudioDocument[]) => {
    setSavedDocs(updated);
    try {
      localStorage.setItem(DOCUMENT_DB_KEY, JSON.stringify(updated));
    } catch (err) {
      console.warn('Error saving docs to storage:', err);
    }
  };

  const handleCopyBankDetails = () => {
    navigator.clipboard.writeText(invoice.notasBanco);
    setCopiedBankInfo(true);
    setTimeout(() => setCopiedBankInfo(false), 2500);
  };

  const handleTogglePaymentStatus = (newStatus: InvoiceData['estadoPago']) => {
    setInvoice(prev => ({ ...prev, estadoPago: newStatus }));
  };

  const formatMoney = (amount: number) => {
    const formatted = amount.toLocaleString('es-MX', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    return `${invoice.moneda} ${formatted}`;
  };

  // Printing ONLY the document element (isolated print)
  const handlePrintDocument = () => {
    printElementById('main-document-sheet', `Documento_${activeDocView.toUpperCase()}_LaFacultad`);
  };

  // Downloading standalone HTML file
  const handleDownloadHtml = () => {
    const clientNameStr = (invoice.cliente.nombreArtistico || invoice.cliente.nombreReal || invoice.cliente.nombre || 'Cliente').replace(/\s+/g, '_');
    const filename = `${activeDocView.toUpperCase()}_${invoice.numeroFactura}_${clientNameStr}.html`;
    downloadDocumentHtml('main-document-sheet', filename);
    triggerToast('¡Archivo HTML generado y listo para descargar!');
  };

  // Saving document to local database
  const handleSaveDocument = () => {
    const titleMap: Record<DocumentType, string> = {
      factura: 'Factura / Invoice Oficial',
      comprobante: 'Comprobante de Reserva & Recibo Oficial',
      pase: 'Hoja de Sesión Técnica (Session Work Order)',
      contrato: 'Contrato Legal de Sesión y Producción',
      orden: 'Orden de Servicio de Estudio',
      certificado: 'Certificado de Entrega Final',
      splitsheet: 'Split Sheet de Derechos y Publishing'
    };

    const newDoc: SavedStudioDocument = {
      id: 'doc_' + Date.now(),
      type: activeDocView,
      title: titleMap[activeDocView],
      folio: invoice.numeroFactura,
      date: invoice.fechaEmision,
      clientName: invoice.cliente.nombreArtistico || invoice.cliente.nombreReal || invoice.cliente.nombre || 'Cliente',
      clientPhone: invoice.cliente.telefono || 's/n',
      total: invoice.total,
      currency: invoice.moneda,
      paymentStatus: invoice.estadoPago,
      invoiceData: JSON.parse(JSON.stringify(invoice)),
      createdAt: new Date().toLocaleDateString('es-MX') + ' ' + new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
    };

    const updated = [newDoc, ...savedDocs];
    saveDocsToStorage(updated);
    triggerToast(`¡${titleMap[activeDocView]} guardado con éxito en el historial!`);
  };

  const handleDeleteSavedDoc = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('¿Seguro que deseas eliminar este documento guardado?')) {
      const updated = savedDocs.filter(d => d.id !== id);
      saveDocsToStorage(updated);
      triggerToast('Documento eliminado');
    }
  };

  const handleLoadSavedDoc = (docRecord: SavedStudioDocument) => {
    setInvoice(docRecord.invoiceData);
    setActiveDocView(docRecord.type);
    setShowSavedDocsModal(false);
    triggerToast(`Documento ${docRecord.folio} cargado en pantalla`);
  };

  const handleCopyDocText = () => {
    const element = document.getElementById('main-document-sheet');
    if (element) {
      const text = element.innerText;
      navigator.clipboard.writeText(text);
      setCopiedDocText(true);
      setTimeout(() => setCopiedDocText(false), 2500);
      triggerToast('¡Texto del documento copiado al portapapeles!');
    }
  };

  const handleShareComprobanteWhatsApp = () => {
    const text = `🟢 *COMPROBANTE OFICIAL DE RESERVA & RECIBO*
*LA FACULTAD STUDIO | BADLENZ*
──────────────────────
• *Folio Recibo:* REC-${invoice.numeroFactura}
• *Artista / Titular:* ${invoice.cliente.nombreArtistico || invoice.cliente.nombre}
• *Fecha Reservada:* ${invoice.fechaEmision}
• *Bloque Horario:* 14:00 - 18:00 (4 Horas Oficiales)
• *Ubicación:* Hormigueros, Puerto Rico

💰 *ESTADO FINANCIERO:*
• *Inversión Total:* ${formatMoney(invoice.total)}
• *Depósito Recibido:* ${formatMoney(invoice.depositoRequerido)} (Validado vía ATH Móvil)
• *Balance Pendiente:* ${formatMoney(invoice.balancePendiente)}
_(El balance restante se liquidará exclusivamente al recibir tu Máster comercial WAV 24-bit y Stems)_

📦 *ENTREGABLES INCLUIDOS:*
✓ Máster Comercial WAV 24-bit 48kHz (Streaming Ready)
✓ Pre-mezcla estéreo de referencia el mismo día
✓ Stems multitrack de voces afinadas con Melodyne
✓ 2 revisiones oficiales de mezcla

📍 *Reglamento:* Puntualidad (15 min tolerancia) y máximo 2 acompañantes.

¡Tu espacio en cabina está 100% congelado! Nos vemos en el estudio.`;

    navigator.clipboard.writeText(text);
    triggerToast('¡Comprobante copiado al portapapeles y abriendo WhatsApp!');
    const phone = invoice.cliente.telefono ? invoice.cliente.telefono.replace(/[^0-9]/g, '') : '';
    const url = phone 
      ? `https://wa.me/${phone}?text=${encodeURIComponent(text)}` 
      : `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const filteredSavedDocs = savedDocs.filter(d => 
    d.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.folio.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-12 font-sans text-white">
      
      {/* Toast notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-500 text-gray-950 font-black px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2 border border-emerald-300 animate-bounce text-xs">
          <CheckCircle className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Control Header (Spatial Studio Hardware Cockpit) */}
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-[#10131e] via-[#0b0d14] to-[#07090f] p-6 sm:p-7 shadow-[0_20px_50px_rgba(0,0,0,0.8)] space-y-5 text-white">
        <div className="absolute top-0 right-0 -mt-6 -mr-6 w-56 h-56 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="px-3 py-1 rounded-full text-[10px] font-mono font-black bg-gradient-to-r from-red-600 to-amber-600 text-white uppercase tracking-widest shadow">
                HOJAS DE SESIÓN &amp; CONTRATOS
              </span>
              <span className="text-xs text-amber-400 font-mono font-bold">LA FACULTAD STUDIO | BADLENZ</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-syne font-bold text-white tracking-tight">
              Hojas de Sesión Técnica, Contratos &amp; Facturación
            </h1>
            <p className="text-zinc-300 text-xs font-dmsans max-w-2xl">
              Genera hojas de sesión oficiales (Work Orders), contratos legales, especificaciones de tracking y facturación listos para imprimir o exportar en PDF.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap shrink-0">
            <button
              onClick={() => setShowSavedDocsModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-zinc-900/90 hover:bg-zinc-800 text-amber-400 border border-white/10 font-bold text-xs transition active:scale-95 cursor-pointer"
            >
              <FolderCheck className="w-4 h-4" />
              <span className="font-syne">Historial ({savedDocs.length})</span>
            </button>

            <button
              onClick={handleSaveDocument}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-amber-500 hover:bg-amber-400 text-gray-950 font-black text-xs transition shadow active:scale-95 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span className="font-syne">Guardar</span>
            </button>

            <button
              onClick={handleDownloadHtml}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-zinc-900/90 hover:bg-zinc-800 text-zinc-200 border border-white/10 font-bold text-xs transition active:scale-95 cursor-pointer"
              title="Descargar archivo HTML independiente"
            >
              <Download className="w-4 h-4 text-blue-400" />
              <span className="hidden sm:inline font-syne">HTML</span>
            </button>

            <button
              onClick={handlePrintDocument}
              className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-syne font-bold text-xs uppercase tracking-wider transition shadow-lg shadow-red-950/50 active:scale-95 cursor-pointer"
              id="btn-print-document"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir / PDF</span>
            </button>
          </div>
        </div>

        {/* Document Selector Navigation Tabs (Spatial Glass Pills) */}
        <div className="relative z-10 flex items-center justify-between gap-3 pt-3 border-t border-white/10 flex-wrap">
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-1">
            <button
              onClick={() => setActiveDocView('factura')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                activeDocView === 'factura'
                  ? 'bg-gradient-to-r from-red-600 to-amber-600 text-white shadow-md shadow-red-950/40 scale-105'
                  : 'bg-white/[0.04] text-zinc-400 hover:text-white border border-white/10 hover:bg-white/10'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span className="font-syne">1. Factura</span>
            </button>

            <button
              onClick={() => setActiveDocView('comprobante')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                activeDocView === 'comprobante'
                  ? 'bg-gradient-to-r from-red-600 to-amber-600 text-white shadow-md shadow-red-950/40 scale-105'
                  : 'bg-white/[0.04] text-zinc-400 hover:text-white border border-white/10 hover:bg-white/10'
              }`}
            >
              <Receipt className="w-3.5 h-3.5 text-emerald-400" />
              <span className="font-syne">2. Comprobante de Reserva &amp; Recibo</span>
            </button>

            <button
              onClick={() => setActiveDocView('pase')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                activeDocView === 'pase'
                  ? 'bg-gradient-to-r from-red-600 to-amber-600 text-white shadow-md shadow-red-950/40 scale-105'
                  : 'bg-white/[0.04] text-zinc-400 hover:text-white border border-white/10 hover:bg-white/10'
              }`}
            >
              <CheckSquare className="w-3.5 h-3.5 text-amber-400" />
              <span className="font-syne">3. Hoja de Sesión Técnica</span>
            </button>

            <button
              onClick={() => setActiveDocView('contrato')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                activeDocView === 'contrato'
                  ? 'bg-gradient-to-r from-red-600 to-amber-600 text-white shadow-md shadow-red-950/40 scale-105'
                  : 'bg-white/[0.04] text-zinc-400 hover:text-white border border-white/10 hover:bg-white/10'
              }`}
            >
              <FileSignature className="w-3.5 h-3.5 text-blue-400" />
              <span className="font-syne">4. Contrato Legal</span>
            </button>

            <button
              onClick={() => setActiveDocView('orden')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                activeDocView === 'orden'
                  ? 'bg-gradient-to-r from-red-600 to-amber-600 text-white shadow-md shadow-red-950/40 scale-105'
                  : 'bg-white/[0.04] text-zinc-400 hover:text-white border border-white/10 hover:bg-white/10'
              }`}
            >
              <CheckSquare className="w-3.5 h-3.5 text-emerald-400" />
              <span className="font-syne">5. Orden Técnica</span>
            </button>

            <button
              onClick={() => setActiveDocView('certificado')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                activeDocView === 'certificado'
                  ? 'bg-gradient-to-r from-red-600 to-amber-600 text-white shadow-md shadow-red-950/40 scale-105'
                  : 'bg-white/[0.04] text-zinc-400 hover:text-white border border-white/10 hover:bg-white/10'
              }`}
            >
              <Award className="w-3.5 h-3.5 text-amber-300" />
              <span className="font-syne">6. Certificado</span>
            </button>

            <button
              onClick={() => setActiveDocView('splitsheet')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                activeDocView === 'splitsheet'
                  ? 'bg-gradient-to-r from-red-600 to-amber-600 text-white shadow-md shadow-red-950/40 scale-105'
                  : 'bg-white/[0.04] text-zinc-400 hover:text-white border border-white/10 hover:bg-white/10'
              }`}
            >
              <DollarSign className="w-3.5 h-3.5 text-purple-400" />
              <span className="font-syne">7. Split Sheet</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowEditPanel(!showEditPanel)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-[#0c0e17] hover:bg-white/10 text-xs font-bold text-zinc-300 border border-white/10 transition active:scale-95 cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5 text-amber-400" />
              <span>{showEditPanel ? 'Ocultar Editor' : '✏️ Editar Datos'}</span>
            </button>

            <button
              onClick={() => handleTogglePaymentStatus(invoice.estadoPago === 'Pagado' ? 'Pendiente' : 'Pagado')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black border transition ${
                invoice.estadoPago === 'Pagado'
                  ? 'bg-emerald-950/80 text-emerald-400 border-emerald-500/40'
                  : 'bg-amber-950/80 text-amber-400 border-amber-500/40'
              }`}
            >
              <CheckCircle className="w-3.5 h-3.5" />
              <span>Estado: {invoice.estadoPago}</span>
            </button>
          </div>
        </div>

        {/* Quick Document Editor Panel */}
        {showEditPanel && (
          <div className="p-4 bg-[#111113] rounded-xl border border-amber-500/30 space-y-3 animate-fadeIn text-xs">
            <div className="flex justify-between items-center border-b border-gray-800 pb-2">
              <span className="font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1">
                <Edit3 className="w-4 h-4" /> Personalizador de Documento
              </span>
              <button onClick={() => setShowEditPanel(false)} className="text-gray-400 hover:text-white">✕</button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-gray-400 text-[11px] mb-1">Nombre Artístico</label>
                <input
                  type="text"
                  value={invoice.cliente.nombreArtistico || ''}
                  onChange={e => setInvoice({
                    ...invoice,
                    cliente: { ...invoice.cliente, nombreArtistico: e.target.value }
                  })}
                  className="w-full bg-gray-900 text-white p-2 rounded border border-gray-700 font-bold"
                  placeholder="Ej. Bad Bunny"
                />
              </div>

              <div>
                <label className="block text-gray-400 text-[11px] mb-1">Nombre Real / Rep.</label>
                <input
                  type="text"
                  value={invoice.cliente.nombreReal || ''}
                  onChange={e => setInvoice({
                    ...invoice,
                    cliente: { ...invoice.cliente, nombreReal: e.target.value }
                  })}
                  className="w-full bg-gray-900 text-white p-2 rounded border border-gray-700"
                  placeholder="Ej. Benito Martínez"
                />
              </div>

              <div>
                <label className="block text-gray-400 text-[11px] mb-1">Teléfono</label>
                <input
                  type="text"
                  value={invoice.cliente.telefono || ''}
                  onChange={e => setInvoice({
                    ...invoice,
                    cliente: { ...invoice.cliente, telefono: e.target.value }
                  })}
                  className="w-full bg-gray-900 text-white p-2 rounded border border-gray-700"
                  placeholder="Ej. +1 787 555 1234"
                />
              </div>

              <div>
                <label className="block text-gray-400 text-[11px] mb-1">N° Folio / Factura</label>
                <input
                  type="text"
                  value={invoice.numeroFactura || ''}
                  onChange={e => setInvoice({
                    ...invoice,
                    numeroFactura: e.target.value
                  })}
                  className="w-full bg-gray-900 text-amber-400 p-2 rounded border border-gray-700 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-gray-400 text-[11px] mb-1">Monto Total ($)</label>
                <input
                  type="number"
                  value={invoice.total || 0}
                  onChange={e => {
                    const val = parseFloat(e.target.value) || 0;
                    const dep = val * 0.5;
                    setInvoice({
                      ...invoice,
                      total: val,
                      subtotal: val,
                      depositoRequerido: dep,
                      balancePendiente: dep
                    });
                  }}
                  className="w-full bg-gray-900 text-white p-2 rounded border border-gray-700 font-bold"
                />
              </div>

              <div>
                <label className="block text-gray-400 text-[11px] mb-1">Depósito 50% ($)</label>
                <input
                  type="number"
                  value={invoice.depositoRequerido || 0}
                  onChange={e => {
                    const dep = parseFloat(e.target.value) || 0;
                    setInvoice({
                      ...invoice,
                      depositoRequerido: dep,
                      balancePendiente: invoice.total - dep
                    });
                  }}
                  className="w-full bg-gray-900 text-emerald-400 p-2 rounded border border-gray-700 font-bold"
                />
              </div>

              <div>
                <label className="block text-gray-400 text-[11px] mb-1">Fecha Emisión</label>
                <input
                  type="date"
                  value={invoice.fechaEmision}
                  onChange={e => setInvoice({ ...invoice, fechaEmision: e.target.value })}
                  className="w-full bg-gray-900 text-white p-2 rounded border border-gray-700"
                />
              </div>

              <div>
                <label className="block text-gray-400 text-[11px] mb-1">Estado de Pago</label>
                <select
                  value={invoice.estadoPago}
                  onChange={e => setInvoice({ ...invoice, estadoPago: e.target.value as any })}
                  className="w-full bg-gray-900 text-white p-2 rounded border border-gray-700 font-bold"
                >
                  <option value="Pendiente">Pendiente</option>
                  <option value="Pagado">Pagado</option>
                  <option value="Parcial">Parcial / Reserva</option>
                </select>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* DOCUMENT SHEET CANVAS (Targeted exclusively by printElementById) */}
      <div 
        id="main-document-sheet"
        className="max-w-4xl mx-auto bg-[#121214] text-white rounded-2xl border-2 border-red-600/80 shadow-2xl overflow-hidden font-sans"
      >
        
        {/* DOCUMENT VIEW 1: FACTURA / INVOICE */}
        {activeDocView === 'factura' && (
          <div>
            <StudioDocumentHeader
              documentTitle="FACTURA / INVOICE"
              metadataLeft={
                <div className="space-y-1 text-slate-300">
                  <p><strong className="text-amber-400">Fecha:</strong> {invoice.fechaEmision}</p>
                  <p><strong className="text-amber-400">Proyecto:</strong> Producción Musical Badlenz</p>
                  <p><strong className="text-amber-400">Cobrar a:</strong> {invoice.cliente.nombreArtistico || invoice.cliente.nombre}</p>
                </div>
              }
              metadataRight={
                <div className="space-y-1 text-slate-300">
                  <p><strong className="text-red-400">N° Factura:</strong> {invoice.numeroFactura}</p>
                  <p><strong className="text-amber-400">Estado Pago:</strong> <span className="text-amber-300 font-bold">{invoice.estadoPago}</span></p>
                  <p><strong className="text-amber-400">Vencimiento:</strong> {invoice.fechaVencimiento || invoice.fechaEmision}</p>
                </div>
              }
            />

            <div className="p-6 sm:p-8 space-y-6">
              
              {/* 1. DATOS DE REFERENCIA */}
              <div className="space-y-2">
                <div className="bg-amber-400 text-slate-950 font-black p-2 text-center text-xs uppercase tracking-wider rounded">
                  1. DATOS DE REFERENCIA
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs p-3.5 bg-neutral-950 rounded border border-neutral-800">
                  <p>• <strong>Artista/Grupo:</strong> <span className="text-amber-300 font-bold">{invoice.cliente.nombreArtistico || invoice.cliente.nombre}</span></p>
                  <p>• <strong>Representante:</strong> {invoice.cliente.nombreReal || 'n/d'}</p>
                  <p>• <strong>Teléfono:</strong> {invoice.cliente.telefono || 'n/d'}</p>
                </div>
              </div>

              {/* 2. DETALLES DE LA SESIÓN */}
              <div className="space-y-2">
                <div className="bg-amber-400 text-slate-950 font-black p-2 text-center text-xs uppercase tracking-wider rounded">
                  2. DETALLES DE LA SESIÓN & SERVICIOS
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-amber-400 text-slate-950 font-black uppercase text-[11px] tracking-wider border-b-2 border-slate-900">
                        <th className="py-2.5 px-3">ARTÍCULO / SERVICIO</th>
                        <th className="py-2.5 px-3 text-center">CANTIDAD</th>
                        <th className="py-2.5 px-3 text-right">TASA (PRECIO)</th>
                        <th className="py-2.5 px-3 text-right">TOTAL</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-800 bg-neutral-950 text-slate-200">
                      {invoice.items.map((item) => (
                        <tr key={item.id} className="hover:bg-neutral-900">
                          <td className="py-3.5 px-3 font-bold text-white">{item.descripcion}</td>
                          <td className="py-3.5 px-3 text-center font-semibold">{item.cantidad}</td>
                          <td className="py-3.5 px-3 text-right">{formatMoney(item.precioUnitario)}</td>
                          <td className="py-3.5 px-3 text-right font-black text-amber-400">{formatMoney(item.total)}</td>
                        </tr>
                      ))}

                      <tr className="bg-amber-500/20 font-bold border-t-2 border-amber-500">
                        <td colSpan={3} className="py-2.5 px-3 uppercase text-right text-amber-300">SUBTOTAL</td>
                        <td className="py-2.5 px-3 text-right text-white font-black">{formatMoney(invoice.subtotal)}</td>
                      </tr>
                      <tr className="bg-amber-500/30 font-bold">
                        <td colSpan={3} className="py-2.5 px-3 uppercase text-right text-amber-300">TOTAL FACTURA</td>
                        <td className="py-2.5 px-3 text-right text-amber-400 font-black text-sm">{formatMoney(invoice.total)}</td>
                      </tr>
                      <tr className="bg-amber-500/20 font-bold">
                        <td colSpan={3} className="py-2.5 px-3 uppercase text-right text-slate-300">CANTIDAD PAGADA (50% RESERVA)</td>
                        <td className="py-2.5 px-3 text-right text-emerald-400 font-black">{formatMoney(invoice.depositoRequerido)}</td>
                      </tr>
                      <tr className="bg-red-950/60 font-black border-t border-red-600">
                        <td colSpan={3} className="py-2.5 px-3 uppercase text-right text-red-400">SALDO PENDIENTE</td>
                        <td className="py-2.5 px-3 text-right text-red-400 font-black text-base">{formatMoney(invoice.balancePendiente)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Bank Transfer Details Box */}
              <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                    Métodos de Pago & Datos Bancarios:
                  </span>
                  <button
                    onClick={handleCopyBankDetails}
                    className="flex items-center gap-1.5 text-xs font-bold text-amber-400 hover:text-amber-300 print:hidden"
                  >
                    {copiedBankInfo ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedBankInfo ? '¡Copiado!' : 'Copiar datos'}</span>
                  </button>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed font-mono">
                  {invoice.notasBanco}
                </p>
              </div>

              {/* 3. TÉRMINOS Y CONDICIONES */}
              <div className="space-y-2">
                <div className="bg-amber-400 text-slate-950 font-black p-2 text-center text-xs uppercase tracking-wider rounded">
                  3. TÉRMINOS Y CONDICIONES DEL CONTRATO
                </div>
                <div className="bg-neutral-950 p-4 rounded border border-neutral-800 text-[11px] leading-relaxed space-y-2 text-slate-300">
                  <p>• <strong>Servicios Incluidos:</strong> Esta cotización/factura cubre únicamente los servicios especificados.</p>
                  <p>• <strong>Horario y Puntualidad:</strong> El cliente debe llegar puntual. Retrasos mayores de <strong className="text-amber-400">20 minutos</strong> no serán compensados con tiempo adicional.</p>
                  <p>• <strong>Formas de Pago:</strong> Pago vía <strong className="text-amber-400">ATH Móvil, PayPal, Zelle, efectivo o transferencia</strong>.</p>
                  <p>• <strong>Depósito y Reservas:</strong> Se requiere un depósito del <strong className="text-amber-400">50% para reservar</strong>. Depósitos no reembolsables.</p>
                  <p>• <strong>Entregas y Revisiones:</strong> Primera entrega en <strong className="text-amber-400">7-14 días laborables</strong>. Incluye <strong className="text-amber-400">3 revisiones por mezcla/master</strong>.</p>
                  <p>• <strong>Confidencialidad:</strong> Los montos y términos de este acuerdo son confidenciales entre las partes.</p>
                </div>
              </div>

              {/* Signatures */}
              <div className="grid grid-cols-2 gap-8 pt-8 border-t border-neutral-800 text-xs">
                <div className="text-center pt-8 border-t border-dashed border-slate-600">
                  <p className="font-bold text-slate-300">Firma del Cliente:</p>
                  <p className="text-[10px] text-gray-500 mt-1">{invoice.cliente.nombreArtistico || invoice.cliente.nombre}</p>
                </div>
                <div className="text-center pt-8 border-t border-dashed border-slate-600">
                  <p className="font-bold text-amber-400">Firma Productor (Badlenz):</p>
                  <p className="text-[10px] text-gray-500 mt-1">La Facultad Studio</p>
                </div>
              </div>

            </div>

            <StudioDocumentFooter />
          </div>
        )}

        {/* DOCUMENT VIEW 2: COMPROBANTE OFICIAL DE RESERVA & RECIBO (BOOKING CONFIRMATION) */}
        {activeDocView === 'comprobante' && (
          <div>
            <StudioDocumentHeader
              documentTitle="COMPROBANTE OFICIAL DE RESERVA & RECIBO"
              documentSubtitle="BOOKING CONFIRMATION • ANTICIPO CONGELADO EN CABINA"
              metadataLeft={
                <div className="space-y-1 text-slate-300">
                  <p><strong className="text-amber-400">Recibo / Folio:</strong> REC-{invoice.numeroFactura}</p>
                  <p><strong className="text-amber-400">Titular / Artista:</strong> <span className="text-amber-300 font-bold">{invoice.cliente.nombreArtistico || invoice.cliente.nombre}</span></p>
                  <p><strong className="text-amber-400">Contacto Directo:</strong> {invoice.cliente.telefono || 'Sin registrar'}</p>
                </div>
              }
              metadataRight={
                <div className="space-y-1 text-slate-300">
                  <p><strong className="text-amber-400">Fecha de Emisión:</strong> {invoice.fechaEmision}</p>
                  <p><strong className="text-amber-400">Método de Anticipo:</strong> ATH Móvil (787-240-8627)</p>
                  <p><strong className="text-emerald-400">Estado de Reserva:</strong> <span className="font-black text-emerald-400">🟢 CABINA CONGELADA / PAGO RECIBIDO</span></p>
                </div>
              }
            />

            <div className="p-6 sm:p-8 space-y-6">
              
              {/* WhatsApp Quick Action Banner */}
              <div className="p-3 bg-emerald-950/40 border border-emerald-500/30 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3">
                <span className="text-xs text-emerald-300">
                  💬 ¿Deseas enviar este comprobante de pago oficial directamente al artista por WhatsApp?
                </span>
                <button
                  type="button"
                  onClick={handleShareComprobanteWhatsApp}
                  className="bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-black px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 shrink-0 transition active:scale-95 cursor-pointer shadow"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Enviar por WhatsApp</span>
                </button>
              </div>

              {/* Official Booking Certificate Banner */}
              <div className="p-6 bg-gradient-to-r from-emerald-950/80 via-black to-neutral-950 border-2 border-emerald-500/70 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-6 shadow-2xl">
                <div className="space-y-2 text-center sm:text-left">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-600 text-gray-950 font-black text-[10px] rounded-full uppercase tracking-widest">
                    <span>✓ CERTIFICACIÓN OFICIAL DE PAGO &amp; RESERVA</span>
                  </div>
                  <h3 className="text-2xl font-black text-white uppercase tracking-tight">
                    {invoice.cliente.nombreArtistico || invoice.cliente.nombre}
                  </h3>
                  <p className="text-xs text-emerald-400 font-mono">
                    La Facultad Studio certifica que la fecha y horario han sido formalmente congelados en cabina.
                  </p>
                  <p className="text-xs text-gray-300">
                    Estudio: <strong>Cabina Acústica Principal • Hormigueros, Puerto Rico</strong>
                  </p>
                </div>

                <div className="flex flex-col items-center justify-center p-4 bg-neutral-900/90 rounded-2xl border border-emerald-500/40 text-center space-y-1.5 shrink-0">
                  <span className="text-[10px] uppercase font-mono font-bold text-emerald-400">Depósito Validado</span>
                  <span className="font-mono text-2xl font-black text-white tracking-wider">
                    {formatMoney(invoice.depositoRequerido)}
                  </span>
                  <span className="text-[10px] text-gray-950 font-black bg-emerald-400 px-2.5 py-0.5 rounded-full">
                    ATH MÓVIL
                  </span>
                </div>
              </div>

              {/* Ficha de la Sesión Reservada */}
              <div className="space-y-2">
                <div className="bg-amber-400 text-slate-950 font-black p-2 text-center text-xs uppercase tracking-wider rounded">
                  DETALLES DE LA SESIÓN EN CABINA
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800">
                    <span className="text-[10px] text-gray-400 block uppercase font-bold">Fecha Reservada</span>
                    <span className="text-sm font-black text-white font-mono">{invoice.fechaEmision}</span>
                  </div>
                  <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800">
                    <span className="text-[10px] text-gray-400 block uppercase font-bold">Horario Oficial</span>
                    <span className="text-sm font-black text-amber-300 font-mono">14:00 - 18:00 (4h)</span>
                  </div>
                  <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800">
                    <span className="text-[10px] text-gray-400 block uppercase font-bold">Productor / Engineer</span>
                    <span className="text-sm font-black text-rose-400 font-mono">Manuel "Badlenz" Silva</span>
                  </div>
                  <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800">
                    <span className="text-[10px] text-gray-400 block uppercase font-bold">Ubicación</span>
                    <span className="text-sm font-black text-emerald-400 font-mono">Hormigueros, PR</span>
                  </div>
                </div>
              </div>

              {/* Balance Restante & Condición de Liquidación */}
              <div className="p-5 bg-neutral-950 rounded-2xl border border-neutral-800 space-y-4">
                <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
                  <span className="text-xs font-bold text-gray-300 uppercase tracking-wide">
                    Estado Financiero de la Producción:
                  </span>
                  <span className="text-xs text-amber-400 font-mono">Folio #{invoice.numeroFactura}</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
                  <div className="p-3 bg-black rounded-xl border border-neutral-800">
                    <span className="text-[10px] text-gray-400 uppercase font-bold block">Inversión Total</span>
                    <span className="text-lg font-black text-white font-mono">{formatMoney(invoice.total)}</span>
                  </div>
                  <div className="p-3 bg-emerald-950/40 rounded-xl border border-emerald-500/40">
                    <span className="text-[10px] text-emerald-400 uppercase font-bold block">Depósito Recibido</span>
                    <span className="text-lg font-black text-emerald-400 font-mono">{formatMoney(invoice.depositoRequerido)}</span>
                  </div>
                  <div className="p-3 bg-red-950/40 rounded-xl border border-red-500/40">
                    <span className="text-[10px] text-red-400 uppercase font-bold block">Balance Pendiente</span>
                    <span className="text-lg font-black text-red-300 font-mono">{formatMoney(invoice.balancePendiente)}</span>
                  </div>
                </div>

                <div className="p-3.5 bg-neutral-900/90 rounded-xl border border-amber-500/30 text-xs text-slate-300 space-y-1.5 leading-relaxed">
                  <p className="font-bold text-amber-300 flex items-center gap-1.5">
                    <span>🔒 Condición Oficial de Liquidación:</span>
                  </p>
                  <p>
                    El balance restante de <strong className="text-white">{formatMoney(invoice.balancePendiente)}</strong> se liquidará exclusivamente al recibir tu <strong className="text-amber-400">Máster Comercial WAV 24-bit final</strong> y los <strong className="text-amber-400">Stems multitrack</strong> de la sesión.
                  </p>
                </div>
              </div>

              {/* Entregables Garantizados */}
              <div className="space-y-2">
                <div className="bg-neutral-900 border border-neutral-800 p-2.5 rounded-lg flex items-center justify-between text-xs">
                  <span className="font-black text-white uppercase tracking-wider">Entregables Garantizados con tu Reserva:</span>
                  <span className="text-[10px] text-emerald-400 font-mono font-bold">La Facultad Quality Seal</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-300 bg-neutral-950 p-4 rounded-xl border border-neutral-800">
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-400 font-bold">✓</span>
                    <span>Máster comercial final en WAV 24-bit 48kHz optimizado para Spotify &amp; Apple Music</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-400 font-bold">✓</span>
                    <span>Pre-mezcla estéreo de referencia el mismo día de la sesión en cabina</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-400 font-bold">✓</span>
                    <span>Exportación de Stems multitrack individuales (voces procesadas y afinadas con Melodyne)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-400 font-bold">✓</span>
                    <span>2 revisiones oficiales de mezcla incluidas tras la primera entrega</span>
                  </div>
                </div>
              </div>

              {/* Protocolo de Llegada a Cabina */}
              <div className="space-y-2">
                <div className="bg-amber-400 text-slate-950 font-black p-2 text-center text-xs uppercase tracking-wider rounded">
                  INSTRUCCIONES DE LLEGADA &amp; REGLAMENTO
                </div>
                <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800 text-xs text-slate-200 space-y-2 leading-relaxed">
                  <p>• <strong>Puntualidad:</strong> Llegar 10 minutos antes. La tolerancia máxima antes de que empiece a correr el bloque de cabina es de <strong className="text-amber-400">15 minutos</strong>.</p>
                  <p>• <strong>Acompañantes:</strong> Máximo <strong className="text-amber-400">2 acompañantes</strong> por artista en cabina para conservar la concentración y el ambiente acústico.</p>
                  <p>• <strong>Pista / Beat:</strong> Traer el instrumental en formato WAV de alta calidad en un pendrive USB o enlace de descarga directa (Google Drive / WeTransfer).</p>
                </div>
              </div>

              {/* Signatures & Stamps */}
              <div className="grid grid-cols-2 gap-8 pt-6 border-t border-neutral-800 text-xs">
                <div className="text-center pt-6 border-t border-dashed border-slate-600">
                  <p className="font-bold text-slate-300">Cliente / Artista Confirmado:</p>
                  <p className="text-[10px] text-gray-500 mt-1">{invoice.cliente.nombreArtistico || invoice.cliente.nombre}</p>
                </div>
                <div className="text-center pt-6 border-t border-dashed border-slate-600">
                  <p className="font-bold text-emerald-400">Certificado por La Facultad Studio:</p>
                  <p className="text-[10px] text-gray-500 mt-1">Manuel "Badlenz" Silva • Productor Principal</p>
                </div>
              </div>

            </div>

            <StudioDocumentFooter />
          </div>
        )}

        {/* DOCUMENT VIEW 3: HOJA OFICIAL DE SESIÓN TÉCNICA (SESSION WORK ORDER) */}
        {activeDocView === 'pase' && (
          <div>
            <StudioDocumentHeader
              documentTitle="HOJA OFICIAL DE SESIÓN DE CABINA"
              documentSubtitle="SESSION WORK ORDER • FICHA TÉCNICA DE TRACKING, VOCES & MONITOREO"
              metadataLeft={
                <div className="space-y-1 text-slate-300">
                  <p><strong className="text-amber-400">Folio de Sesión:</strong> SES-{invoice.numeroFactura}</p>
                  <p><strong className="text-amber-400">Artista / Cliente:</strong> <span className="text-amber-300 font-bold">{invoice.cliente.nombreArtistico || invoice.cliente.nombre}</span></p>
                  <p><strong className="text-amber-400">Ingeniero / Tracking:</strong> Manuel "Badlenz" Silva</p>
                </div>
              }
              metadataRight={
                <div className="space-y-1 text-slate-300">
                  <p><strong className="text-amber-400">Fecha de Sesión:</strong> {invoice.fechaEmision}</p>
                  <p><strong className="text-amber-400">Bloque Oficial:</strong> 14:00 - 18:00 (4 a 5 Horas)</p>
                  <p><strong className="text-emerald-400">Estado de Reserva:</strong> <span className="font-black text-emerald-400">{invoice.estadoPago === 'Pagado' ? 'CONFIRMADO (DEPÓSITO RECIBIDO)' : 'PENDIENTE DE DEPÓSITO'}</span></p>
                </div>
              }
            />

            <div className="p-6 sm:p-8 space-y-6">
              
              {/* Technical Banner / Tracking Rig Card */}
              <div className="p-6 bg-gradient-to-r from-red-950/80 via-black to-neutral-950 border-2 border-red-600/70 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-6 shadow-2xl">
                <div className="space-y-2 text-center sm:text-left">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-600 text-white font-black text-[10px] rounded-full uppercase tracking-widest">
                    <span>🎚️ LA FACULTAD STUDIO • CABINA PRINCIPAL</span>
                  </div>
                  <h3 className="text-2xl font-black text-white uppercase tracking-tight">
                    {invoice.cliente.nombreArtistico || invoice.cliente.nombre}
                  </h3>
                  <p className="text-xs text-amber-400 font-mono">
                    Cadena Vocal: Neumann TLM 103 → Universal Audio Apollo DSP → Avid Pro Tools Ultimate
                  </p>
                  <p className="text-xs text-gray-300">
                    Teléfono registrado: <strong>{invoice.cliente.telefono || 'N/A'}</strong> • Email: <strong>{invoice.cliente.email || 'N/A'}</strong>
                  </p>
                </div>

                <div className="flex flex-col items-center justify-center p-3.5 bg-neutral-900/90 rounded-xl border border-amber-500/40 text-center space-y-1">
                  <span className="text-[10px] uppercase font-mono font-bold text-amber-400">Orden de Sesión</span>
                  <span className="font-mono text-base font-black text-white tracking-wider">
                    SES-{invoice.numeroFactura}
                  </span>
                  <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/30">
                    Hormigueros, PR
                  </span>
                </div>
              </div>

              {/* Parámetros Musicales & Setup de Pro Tools */}
              <div className="space-y-2">
                <div className="bg-amber-400 text-slate-950 font-black p-2 text-center text-xs uppercase tracking-wider rounded">
                  ESPECIFICACIONES DE SESIÓN & SETUP MUSICAL
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800">
                    <span className="text-[10px] text-gray-400 block uppercase font-bold">Tonalidad / Key</span>
                    <span className="text-sm font-black text-amber-300 font-mono">Autotune / Melodyne</span>
                  </div>
                  <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800">
                    <span className="text-[10px] text-gray-400 block uppercase font-bold">Tempo (BPM)</span>
                    <span className="text-sm font-black text-amber-300 font-mono">Sincronizado</span>
                  </div>
                  <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800">
                    <span className="text-[10px] text-gray-400 block uppercase font-bold">Formato Master</span>
                    <span className="text-sm font-black text-white font-mono">WAV 24b / 48kHz</span>
                  </div>
                  <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800">
                    <span className="text-[10px] text-gray-400 block uppercase font-bold">Plantilla Pro Tools</span>
                    <span className="text-sm font-black text-rose-400 font-mono">LF Badlenz Mix</span>
                  </div>
                </div>
              </div>

              {/* Checklist de Tomas en Cabina */}
              <div className="space-y-2">
                <div className="bg-neutral-900 border border-neutral-800 p-2.5 rounded-lg flex items-center justify-between text-xs">
                  <span className="font-black text-white uppercase tracking-wider">Checklist de Tracking (Control de Tomas):</span>
                  <span className="text-[10px] text-amber-400 font-mono font-bold">Neumann TLM 103 Rig</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-300 bg-neutral-950 p-4 rounded-xl border border-neutral-800">
                  <label className="flex items-center gap-2.5">
                    <input type="checkbox" defaultChecked className="w-4 h-4 accent-amber-500 rounded" />
                    <span>Lead Vocals (Voz Principal & Tuning en Vivo)</span>
                  </label>
                  <label className="flex items-center gap-2.5">
                    <input type="checkbox" defaultChecked className="w-4 h-4 accent-amber-500 rounded" />
                    <span>Dobles L & R (Alineación Estéreo)</span>
                  </label>
                  <label className="flex items-center gap-2.5">
                    <input type="checkbox" defaultChecked className="w-4 h-4 accent-amber-500 rounded" />
                    <span>Apoyos, Ad-libs & Frases de Enlace</span>
                  </label>
                  <label className="flex items-center gap-2.5">
                    <input type="checkbox" className="w-4 h-4 accent-amber-500 rounded" />
                    <span>Armonías / Coros (Segunda Voz)</span>
                  </label>
                  <label className="flex items-center gap-2.5">
                    <input type="checkbox" defaultChecked className="w-4 h-4 accent-amber-500 rounded" />
                    <span>Pre-mezcla de Referencia en Cabina</span>
                  </label>
                  <label className="flex items-center gap-2.5">
                    <input type="checkbox" className="w-4 h-4 accent-amber-500 rounded" />
                    <span>Export Stems WAV 24-bit sin comprimir</span>
                  </label>
                </div>
              </div>

              {/* Rules & Session Agreement */}
              <div className="space-y-2">
                <div className="bg-amber-400 text-slate-950 font-black p-2 text-center text-xs uppercase tracking-wider rounded">
                  REGLAMENTO OBLIGATORIO DE CABINA & ESTUDIO
                </div>
                <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800 text-xs text-slate-200 space-y-2 leading-relaxed">
                  <p>• <strong>Puntualidad:</strong> La sesión arranca a la hora reservada. Tolerancia máxima de <strong className="text-amber-400">15 minutos</strong> antes de que corra el reloj del bloque.</p>
                  <p>• <strong>Límite de Acompañantes:</strong> Máximo <strong className="text-amber-400">2 personas</strong> además del artista para mantener la acústica y el enfoque en cabina.</p>
                  <p>• <strong>Cuidado del Equipamiento:</strong> Prohibido bebidas/alimentos sobre la consola, micrófonos o interfaces. Cero humo cerca del Neumann TLM 103.</p>
                </div>
              </div>

              {/* Details grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-center">
                <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800">
                  <span className="text-[10px] text-gray-400 block uppercase font-bold">Inversión Total</span>
                  <span className="text-sm font-black text-white">{formatMoney(invoice.total)}</span>
                </div>
                <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800">
                  <span className="text-[10px] text-gray-400 block uppercase font-bold">Depósito Reserva</span>
                  <span className="text-sm font-black text-emerald-400">{formatMoney(invoice.depositoRequerido)}</span>
                </div>
                <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800">
                  <span className="text-[10px] text-gray-400 block uppercase font-bold">Saldo al Entregar</span>
                  <span className="text-sm font-black text-red-400">{formatMoney(invoice.balancePendiente)}</span>
                </div>
                <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800">
                  <span className="text-[10px] text-gray-400 block uppercase font-bold">Ingeniero</span>
                  <span className="text-sm font-black text-amber-400">Badlenz</span>
                </div>
              </div>

              {/* Signatures */}
              <div className="grid grid-cols-2 gap-8 pt-6 border-t border-neutral-800 text-xs">
                <div className="text-center pt-6 border-t border-dashed border-slate-600">
                  <p className="font-bold text-slate-300">Firma Artista / Representante:</p>
                  <p className="text-[10px] text-gray-500 mt-1">{invoice.cliente.nombreArtistico || invoice.cliente.nombre}</p>
                </div>
                <div className="text-center pt-6 border-t border-dashed border-slate-600">
                  <p className="font-bold text-amber-400">Control Room & Producción:</p>
                  <p className="text-[10px] text-gray-500 mt-1">Manuel "Badlenz" Silva</p>
                </div>
              </div>

            </div>

            <StudioDocumentFooter />
          </div>
        )}

        {/* DOCUMENT VIEW 3: CONTRATO LEGAL DE SESIÓN & LICENCIA */}
        {activeDocView === 'contrato' && (
          <div>
            <StudioDocumentHeader
              documentTitle="CONTRATO OFICIAL DE SESIÓN DE ESTUDIO Y LICENCIA"
              documentSubtitle="ACUERDO LEGAL DE PRODUCCIÓN MUSICAL Y DERECHOS"
              metadataLeft={
                <div className="space-y-1 text-slate-300">
                  <p><strong className="text-amber-400">Contrato N°:</strong> CTR-{invoice.numeroFactura}</p>
                  <p><strong className="text-amber-400">Parte Productora:</strong> La Facultad Studio / Badlenz</p>
                  <p><strong className="text-amber-400">Parte Cliente:</strong> {invoice.cliente.nombreArtistico || invoice.cliente.nombre}</p>
                </div>
              }
              metadataRight={
                <div className="space-y-1 text-slate-300">
                  <p><strong className="text-amber-400">Fecha de Firma:</strong> {invoice.fechaEmision}</p>
                  <p><strong className="text-amber-400">Jurisdicción:</strong> San Juan, Puerto Rico</p>
                  <p><strong className="text-amber-400">Monto del Contrato:</strong> <span className="font-black text-amber-300">{formatMoney(invoice.total)}</span></p>
                </div>
              }
            />

            <div className="p-6 sm:p-8 space-y-6 text-xs text-slate-200 leading-relaxed">
              
              <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800">
                <p className="font-semibold text-slate-200">
                  En San Juan, Puerto Rico, a <strong className="text-amber-400">{invoice.fechaEmision}</strong>, se celebra el presente Contrato de Servicios de Producción Musical entre <strong className="text-red-400">LA FACULTAD STUDIO (Productor: Badlenz)</strong> y el Cliente/Artista <strong className="text-amber-400">{invoice.cliente.nombreArtistico || invoice.cliente.nombre}</strong> (Representante: {invoice.cliente.nombreReal || 'Titular'}, Teléfono: {invoice.cliente.telefono || 'n/a'}).
                </p>
              </div>

              {/* CLAUSE 1 */}
              <div className="space-y-1">
                <h4 className="font-black text-amber-400 uppercase tracking-wider text-xs border-b border-neutral-800 pb-1">
                  PRIMERA: OBJETO DEL CONTRATO Y SERVICIOS
                </h4>
                <p className="text-slate-300">
                  El Estudio se compromete a prestar los servicios de grabación, edición, mezcla, masterización y/o producción instrumental según lo estipulado en la Factura/Folio N° <strong>{invoice.numeroFactura}</strong> por un total pactado de <strong className="text-amber-400">{formatMoney(invoice.total)}</strong>.
                </p>
              </div>

              {/* CLAUSE 2 */}
              <div className="space-y-1">
                <h4 className="font-black text-amber-400 uppercase tracking-wider text-xs border-b border-neutral-800 pb-1">
                  SEGUNDA: CONDICIONES DE PAGO, DEPÓSITO Y REVISIONES
                </h4>
                <p className="text-slate-300">
                  Para la reserva formal de fechas se requiere un depósito no reembolsable de <strong className="text-amber-400">{formatMoney(invoice.depositoRequerido)}</strong> ($50 por canción individual / 50% en combos de producción). El saldo restante de <strong className="text-red-400">{formatMoney(invoice.balancePendiente)}</strong> deberá liquidarse antes de la entrega final de archivos máster WAV 24-bit y stems multitrack. Todo servicio incluye 2 rondas de revisiones gratuitas (a partir de la 3ra aplica tarifa estándar de $10 USD c/u) y la entrega completa de stems sin cargos adicionales.
                </p>
              </div>

              {/* CLAUSE 3 */}
              <div className="space-y-1">
                <h4 className="font-black text-amber-400 uppercase tracking-wider text-xs border-b border-neutral-800 pb-1">
                  TERCERA: DERECHOS DE PROPIEDAD INTELECTUAL & ROYALTIES
                </h4>
                <p className="text-slate-300">
                  Una vez saldada la totalidad del contrato, el Artista obtiene la licencia de uso comercial y/o propiedad sobre las grabaciones vocales y mezclas finalizadas. Los créditos de producción técnica deberán indicar explícitamente: <strong className="text-amber-400">"Producido por Badlenz / La Facultad Studio"</strong> en plataformas digitales y créditos del fonograma.
                </p>
              </div>

              {/* CLAUSE 4 */}
              <div className="space-y-1">
                <h4 className="font-black text-amber-400 uppercase tracking-wider text-xs border-b border-neutral-800 pb-1">
                  CUARTA: CUSTODIA Y ALMACENAMIENTO DE ARCHIVOS (90 DÍAS)
                </h4>
                <p className="text-slate-300">
                  El Estudio mantendrá los archivos de proyecto, stems y multitracks en sus servidores por un periodo máximo e improrrogable de <strong className="text-amber-400">noventa (90) días calendario</strong> tras la fecha de entrega. Es responsabilidad exclusiva del Cliente realizar copias de seguridad personales.
                </p>
              </div>

              {/* CLAUSE 5 */}
              <div className="space-y-1">
                <h4 className="font-black text-amber-400 uppercase tracking-wider text-xs border-b border-neutral-800 pb-1">
                  QUINTA: CONFIDENCIALIDAD
                </h4>
                <p className="text-slate-300">
                  Ambas partes acuerdan mantener estricta confidencialidad sobre los montos financieros, audios inéditos y material de trabajo hasta la fecha oficial de lanzamiento acordada por el Artista.
                </p>
              </div>

              {/* Signatures */}
              <div className="grid grid-cols-2 gap-8 pt-8 border-t border-neutral-800 text-xs">
                <div className="text-center pt-8 border-t border-dashed border-slate-600">
                  <p className="font-bold text-slate-300">Firma del Cliente / Artista:</p>
                  <p className="text-[10px] text-gray-500 mt-1">{invoice.cliente.nombreArtistico || invoice.cliente.nombre}</p>
                </div>
                <div className="text-center pt-8 border-t border-dashed border-slate-600">
                  <p className="font-bold text-amber-400">Firma Representante La Facultad Studio:</p>
                  <p className="text-[10px] text-gray-500 mt-1">Badlenz Principal</p>
                </div>
              </div>

            </div>

            <StudioDocumentFooter />
          </div>
        )}

        {/* DOCUMENT VIEW 4: ORDEN DE SERVICIO */}
        {activeDocView === 'orden' && (
          <div>
            <StudioDocumentHeader
              documentTitle="ORDEN DE SERVICIO Y ACUERDO DE ESTUDIO"
              metadataLeft={
                <div className="space-y-1 text-slate-300">
                  <p><strong className="text-amber-400">Fecha:</strong> {invoice.fechaEmision}</p>
                  <p><strong className="text-amber-400">#Orden:</strong> ORD-{invoice.numeroFactura}</p>
                  <p><strong className="text-amber-400">Ingeniero:</strong> Badlenz Principal</p>
                </div>
              }
              metadataRight={
                <div className="space-y-1 text-slate-300">
                  <p><strong className="text-amber-400">Estudio:</strong> La Facultad Studio</p>
                  <p><strong className="text-amber-400">Ubicación:</strong> Cabina Principal</p>
                </div>
              }
            />

            <div className="p-6 sm:p-8 space-y-6">
              <div className="space-y-2">
                <div className="bg-amber-400 text-slate-950 font-black p-2 text-center text-xs uppercase tracking-wider rounded">
                  1. INFORMACIÓN DEL CLIENTE
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs p-3.5 bg-neutral-950 rounded border border-neutral-800">
                  <p>• <strong>Artista/Grupo:</strong> <span className="text-amber-300 font-bold">{invoice.cliente.nombreArtistico || invoice.cliente.nombre}</span></p>
                  <p>• <strong>Representante:</strong> {invoice.cliente.nombreReal || 'n/d'}</p>
                  <p>• <strong>Teléfono:</strong> {invoice.cliente.telefono || 'n/d'}</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="bg-amber-400 text-slate-950 font-black p-2 text-center text-xs uppercase tracking-wider rounded">
                  2. DETALLES DE LA SESIÓN & REQUERIMIENTOS
                </div>
                <div className="bg-neutral-950 p-4 rounded border border-neutral-800 space-y-4 text-xs">
                  <div className="grid grid-cols-3 gap-4 pb-3 border-b border-neutral-800">
                    <p><strong>Fecha:</strong> {invoice.fechaEmision}</p>
                    <p><strong>Hora Inicio:</strong> 14:00</p>
                    <p><strong>Hora Fin:</strong> 18:00</p>
                  </div>

                  <div>
                    <span className="font-extrabold text-amber-400 block mb-2 uppercase text-[11px]">Servicio Solicitado:</span>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      <label className="flex items-center gap-2">
                        <input type="checkbox" defaultChecked className="w-4 h-4 accent-amber-500 rounded" />
                        <span>Grabación de Voces</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input type="checkbox" defaultChecked className="w-4 h-4 accent-amber-500 rounded" />
                        <span>Producción de Beat</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input type="checkbox" defaultChecked className="w-4 h-4 accent-amber-500 rounded" />
                        <span>Mezcla (Mixing)</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input type="checkbox" defaultChecked className="w-4 h-4 accent-amber-500 rounded" />
                        <span>Masterización</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="bg-amber-400 text-slate-950 font-black p-2 text-center text-xs uppercase tracking-wider rounded">
                  3. DESGLOSE DE COSTOS
                </div>
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-amber-400 text-slate-950 font-black uppercase text-[11px]">
                      <th className="py-2.5 px-3">CONCEPTO</th>
                      <th className="py-2.5 px-3">DESCRIPCIÓN</th>
                      <th className="py-2.5 px-3 text-right">COSTO ($)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800 bg-neutral-950 text-slate-200">
                    <tr>
                      <td className="py-3 px-3 font-bold text-white">Tarifa Base</td>
                      <td className="py-3 px-3 text-slate-400">Costo por proyecto</td>
                      <td className="py-3 px-3 text-right font-bold text-amber-400">{formatMoney(invoice.total)}</td>
                    </tr>
                    <tr className="bg-amber-500/20 font-bold">
                      <td colSpan={2} className="py-2.5 px-3 uppercase text-right text-emerald-400">Menos Depósito (50% Reserva)</td>
                      <td className="py-2.5 px-3 text-right text-emerald-400 font-black">{formatMoney(invoice.depositoRequerido)}</td>
                    </tr>
                    <tr className="bg-red-950/60 font-black border-t border-red-600">
                      <td colSpan={2} className="py-2.5 px-3 uppercase text-right text-red-400">TOTAL A PAGAR (Balance Final)</td>
                      <td className="py-2.5 px-3 text-right text-red-400 font-black text-base">{formatMoney(invoice.balancePendiente)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="grid grid-cols-2 gap-8 pt-8 border-t border-neutral-800 text-xs">
                <div className="text-center pt-8 border-t border-dashed border-slate-600">
                  <p className="font-bold text-slate-300">Firma del Cliente:</p>
                </div>
                <div className="text-center pt-8 border-t border-dashed border-slate-600">
                  <p className="font-bold text-amber-400">Firma Productor (Badlenz):</p>
                </div>
              </div>
            </div>

            <StudioDocumentFooter />
          </div>
        )}

        {/* DOCUMENT VIEW 5: CERTIFICADO DE ENTREGA */}
        {activeDocView === 'certificado' && (
          <div>
            <StudioDocumentHeader
              documentTitle="CERTIFICADO DE ENTREGA FINAL Y ACEPTACIÓN"
              metadataLeft={
                <div className="space-y-1 text-slate-300">
                  <p><strong className="text-amber-400">Cliente:</strong> {invoice.cliente.nombreArtistico || invoice.cliente.nombre}</p>
                  <p><strong className="text-amber-400">Proyecto/Álbum:</strong> Producción Badlenz</p>
                  <p><strong className="text-amber-400">Fecha de Entrega:</strong> {invoice.fechaEmision}</p>
                </div>
              }
              metadataRight={
                <div className="space-y-1 text-slate-300">
                  <p><strong className="text-amber-400">Certificado N°:</strong> CERT-{invoice.numeroFactura}</p>
                  <p><strong className="text-amber-400">Custodia:</strong> 90 Días Garantizados</p>
                </div>
              }
            />

            <div className="p-6 sm:p-8 space-y-6">
              <div className="space-y-2">
                <div className="bg-amber-400 text-slate-950 font-black p-2 text-center text-xs uppercase tracking-wider rounded">
                  MATERIAL ENTREGADO
                </div>
                <div className="bg-neutral-950 p-5 rounded border border-neutral-800 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <label className="flex items-center gap-3 p-2 rounded bg-neutral-900 border border-neutral-800">
                    <input type="checkbox" defaultChecked className="w-4 h-4 accent-amber-500 rounded" />
                    <span className="font-bold text-white">Master Final (WAV/MP3)</span>
                  </label>
                  <label className="flex items-center gap-3 p-2 rounded bg-neutral-900 border border-neutral-800">
                    <input type="checkbox" defaultChecked className="w-4 h-4 accent-amber-500 rounded" />
                    <span className="font-bold text-white">Acapella</span>
                  </label>
                  <label className="flex items-center gap-3 p-2 rounded bg-neutral-900 border border-neutral-800">
                    <input type="checkbox" defaultChecked className="w-4 h-4 accent-amber-500 rounded" />
                    <span className="font-bold text-white">Pista (Instrumental)</span>
                  </label>
                  <label className="flex items-center gap-3 p-2 rounded bg-neutral-900 border border-neutral-800">
                    <input type="checkbox" defaultChecked className="w-4 h-4 accent-amber-500 rounded" />
                    <span className="font-bold text-white">Stems (Pistas X Canales)</span>
                  </label>
                </div>
              </div>

              <div className="space-y-2">
                <div className="bg-amber-400 text-slate-950 font-black p-2 text-center text-xs uppercase tracking-wider rounded">
                  DECLARACIÓN Y ACUERDO DE CUSTODIA
                </div>
                <div className="bg-neutral-950 p-5 rounded border border-neutral-800 space-y-3 text-xs text-slate-200 leading-relaxed">
                  <p>• <strong>Responsabilidad de Respaldo:</strong> El Cliente reconoce que es su única responsabilidad realizar copias de seguridad de los archivos entregados.</p>
                  <p>• <strong>Política de Almacenamiento:</strong> El estudio conservará una copia por un periodo máximo de <strong className="text-amber-400 font-extrabold">noventa (90) días (3 meses)</strong> a partir de la fecha de entrega.</p>
                  <p>• <strong>Eliminación:</strong> <strong className="text-red-400">Una vez transcurrido el periodo, el estudio procederá a la eliminación permanente de los archivos.</strong></p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8 pt-12 border-t border-neutral-800 text-xs">
                <div className="text-center pt-8 border-t border-dashed border-slate-600">
                  <p className="font-bold text-slate-300">Firma del Cliente:</p>
                </div>
                <div className="text-center pt-8 border-t border-dashed border-slate-600">
                  <p className="font-bold text-amber-400">Firma Productor (Badlenz):</p>
                </div>
              </div>
            </div>

            <StudioDocumentFooter />
          </div>
        )}

        {/* DOCUMENT VIEW 6: SPLIT SHEET OFICIAL (ROYALTIES & PUBLISHING) */}
        {activeDocView === 'splitsheet' && (
          <div>
            <StudioDocumentHeader
              documentTitle="SPLIT SHEET OFICIAL • DERECHOS DE AUTOR & PUBLISHING"
              documentSubtitle="ACUERDO DE PORCENTAJES DE REGALÍAS & CRÉDITOS FONOGRÁFICOS"
              metadataLeft={
                <div className="space-y-1 text-slate-300">
                  <p><strong className="text-amber-400">Canción / Track:</strong> Producción Musical Inédita</p>
                  <p><strong className="text-amber-400">Artista Principal:</strong> <span className="text-amber-300 font-bold">{invoice.cliente.nombreArtistico || invoice.cliente.nombre}</span></p>
                  <p><strong className="text-amber-400">Productor Musical:</strong> Badlenz (La Facultad Studio)</p>
                </div>
              }
              metadataRight={
                <div className="space-y-1 text-slate-300">
                  <p><strong className="text-amber-400">Folio:</strong> SPLIT-{invoice.numeroFactura}</p>
                  <p><strong className="text-amber-400">Fecha de Creación:</strong> {invoice.fechaEmision}</p>
                  <p><strong className="text-emerald-400">PRO Afiliación:</strong> ASCAP / BMI / SoundExchange</p>
                </div>
              }
            />

            <div className="p-6 sm:p-8 space-y-6">
              
              <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800 text-xs text-slate-200 leading-relaxed space-y-2">
                <p className="font-semibold text-slate-100">
                  El presente documento certifica los porcentajes de participación y autoría correspondientes a la composición (Letra y Música) y al Fonograma (Master Recording) para el registro ante Sociedades de Gestión Colectiva (BMI, ASCAP, SESAC) y distribución digital (DistroKid, TuneCore, The Orchard, Sony Music Latin).
                </p>
              </div>

              {/* TABLA DE SPLIT: COMPOSICIÓN & LETRA (PUBLISHING 100%) */}
              <div className="space-y-2">
                <div className="bg-amber-400 text-slate-950 font-black p-2 text-center text-xs uppercase tracking-wider rounded">
                  1. DERECHOS DE COMPOSICIÓN (LETRA & MÚSICA - PUBLISHING: 100%)
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-neutral-900 text-gray-300 uppercase text-[10px] border-b border-neutral-800">
                        <th className="py-2 px-3">COLABORADOR / TITULAR</th>
                        <th className="py-2 px-3">ROL</th>
                        <th className="py-2 px-3">SOCIEDAD (PRO) / IPI #</th>
                        <th className="py-2 px-3 text-right">LETRA %</th>
                        <th className="py-2 px-3 text-right">MÚSICA %</th>
                        <th className="py-2 px-3 text-right">TOTAL %</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-850 bg-neutral-950 text-slate-200">
                      <tr>
                        <td className="py-2.5 px-3 font-bold text-white">
                          {invoice.cliente.nombreReal || invoice.cliente.nombreArtistico || 'Artista'}
                          <span className="block text-[10px] text-gray-400 font-normal">({invoice.cliente.nombreArtistico})</span>
                        </td>
                        <td className="py-2.5 px-3 text-amber-400 font-medium">Artista / Autor Principal</td>
                        <td className="py-2.5 px-3 font-mono text-[10px] text-gray-400">ASCAP • IPI Pendiente</td>
                        <td className="py-2.5 px-3 text-right font-mono">50.00%</td>
                        <td className="py-2.5 px-3 text-right font-mono">0.00%</td>
                        <td className="py-2.5 px-3 text-right font-black text-amber-400 font-mono">50.00%</td>
                      </tr>
                      <tr>
                        <td className="py-2.5 px-3 font-bold text-white">
                          Badlenz
                          <span className="block text-[10px] text-gray-400 font-normal">(La Facultad Studio LLC)</span>
                        </td>
                        <td className="py-2.5 px-3 text-red-400 font-medium">Productor / Beatmaker / Compositor</td>
                        <td className="py-2.5 px-3 font-mono text-[10px] text-gray-400">BMI • IPI Verificado</td>
                        <td className="py-2.5 px-3 text-right font-mono">0.00%</td>
                        <td className="py-2.5 px-3 text-right font-mono">50.00%</td>
                        <td className="py-2.5 px-3 text-right font-black text-red-400 font-mono">50.00%</td>
                      </tr>
                      <tr className="bg-neutral-900/90 font-black border-t border-amber-500/40">
                        <td colSpan={5} className="py-2 px-3 text-right uppercase text-gray-350">TOTAL PUBLISHING:</td>
                        <td className="py-2 px-3 text-right text-emerald-400 font-mono text-sm">100.00%</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* TABLA DE MASTER RIGHTS (FONOGRAMA 100%) */}
              <div className="space-y-2">
                <div className="bg-amber-400 text-slate-950 font-black p-2 text-center text-xs uppercase tracking-wider rounded">
                  2. DERECHOS DEL MASTER (FONOGRAMA / STREAMING: 100%)
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-neutral-900 text-gray-300 uppercase text-[10px] border-b border-neutral-800">
                        <th className="py-2 px-3">TITULAR DE DERECHOS</th>
                        <th className="py-2 px-3">TIPO DE PARTICIPACIÓN</th>
                        <th className="py-2 px-3">SOUNDEXCHANGE</th>
                        <th className="py-2 px-3 text-right">% MASTER (DISTRIBUCIÓN)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-850 bg-neutral-950 text-slate-200">
                      <tr>
                        <td className="py-2.5 px-3 font-bold text-white">
                          {invoice.cliente.nombreArtistico || 'Artista Titular'}
                        </td>
                        <td className="py-2.5 px-3 text-amber-400">Intérprete Principal / Master Owner</td>
                        <td className="py-2.5 px-3 font-mono text-[10px] text-gray-400">Featured Artist (45%)</td>
                        <td className="py-2.5 px-3 text-right font-black text-amber-400 font-mono">80.00%</td>
                      </tr>
                      <tr>
                        <td className="py-2.5 px-3 font-bold text-white">
                          Badlenz (La Facultad Studio)
                        </td>
                        <td className="py-2.5 px-3 text-red-400">Producer Points / Mix & Master Royalty</td>
                        <td className="py-2.5 px-3 font-mono text-[10px] text-gray-400">Producer / Rights Owner</td>
                        <td className="py-2.5 px-3 text-right font-black text-red-400 font-mono">20.00%</td>
                      </tr>
                      <tr className="bg-neutral-900/90 font-black border-t border-amber-500/40">
                        <td colSpan={3} className="py-2 px-3 text-right uppercase text-gray-350">TOTAL MASTER ROYALTIES:</td>
                        <td className="py-2 px-3 text-right text-emerald-400 font-mono text-sm">100.00%</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* CRÉDITOS OFICIALES PARA SPOTIFY / APPLE MUSIC */}
              <div className="p-3.5 bg-black/60 rounded-xl border border-gray-800 text-xs space-y-1 font-mono">
                <p className="text-amber-400 font-bold uppercase text-[10px]">Metadata & Créditos Oficiales Obligatorios:</p>
                <p className="text-gray-300">• <strong>Producción Musical:</strong> Badlenz</p>
                <p className="text-gray-300">• <strong>Grabación, Mezcla & Master:</strong> La Facultad Studio (San Juan / Hormigueros, PR)</p>
                <p className="text-gray-300">• <strong>Letra e Interpretación:</strong> {invoice.cliente.nombreArtistico || 'Artista'}</p>
              </div>

              {/* Signatures */}
              <div className="grid grid-cols-2 gap-8 pt-8 border-t border-neutral-800 text-xs">
                <div className="text-center pt-8 border-t border-dashed border-slate-600">
                  <p className="font-bold text-slate-300">Firma Artista / Compositor:</p>
                  <p className="text-[10px] text-gray-500 mt-1">{invoice.cliente.nombreArtistico || invoice.cliente.nombre}</p>
                </div>
                <div className="text-center pt-8 border-t border-dashed border-slate-600">
                  <p className="font-bold text-amber-400">Firma Productor (Badlenz):</p>
                  <p className="text-[10px] text-gray-500 mt-1">La Facultad Studio LLC</p>
                </div>
              </div>

            </div>

            <StudioDocumentFooter />
          </div>
        )}

      </div>

      {/* MODAL DE HISTORIAL DE DOCUMENTOS GUARDADOS */}
      {showSavedDocsModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#18181b] border border-gray-800 rounded-3xl max-w-2xl w-full p-6 space-y-5 max-h-[85vh] flex flex-col shadow-2xl">
            
            <div className="flex items-center justify-between border-b border-gray-800 pb-4">
              <div className="flex items-center gap-2">
                <FolderCheck className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-black text-white">
                  Historial de Documentos Guardados ({savedDocs.length})
                </h3>
              </div>
              <button
                onClick={() => setShowSavedDocsModal(false)}
                className="text-gray-400 hover:text-white p-1 rounded-lg bg-gray-900 border border-gray-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-gray-500 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Buscar por artista, folio o tipo de documento..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full bg-gray-900 text-white pl-9 pr-4 py-2.5 rounded-xl border border-gray-800 text-xs focus:border-red-500 focus:outline-none"
              />
            </div>

            {/* Saved Docs List */}
            <div className="overflow-y-auto space-y-3 flex-1 pr-1">
              {filteredSavedDocs.length === 0 ? (
                <div className="text-center py-10 space-y-2 text-gray-400">
                  <FileText className="w-8 h-8 text-gray-600 mx-auto" />
                  <p className="text-xs font-bold">No se encontraron documentos guardados</p>
                  <p className="text-[11px] text-gray-500">Usa el botón "Guardar" para guardar facturas, pases o contratos.</p>
                </div>
              ) : (
                filteredSavedDocs.map(docRecord => (
                  <div
                    key={docRecord.id}
                    onClick={() => handleLoadSavedDoc(docRecord)}
                    className="p-4 rounded-2xl bg-gray-900 border border-gray-800 hover:border-red-500/50 transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-black text-amber-400 text-xs font-mono">{docRecord.folio}</span>
                        <span className="px-2 py-0.5 rounded-full bg-red-950 text-red-300 text-[10px] font-bold border border-red-800/60 uppercase">
                          {docRecord.type}
                        </span>
                        <span className="text-[10px] text-gray-400">{docRecord.createdAt}</span>
                      </div>
                      <p className="text-xs font-extrabold text-white">
                        {docRecord.clientName} <span className="text-gray-400 font-normal">({docRecord.clientPhone})</span>
                      </p>
                      <p className="text-[11px] text-gray-400">{docRecord.title}</p>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <span className="text-sm font-black text-emerald-400 mr-2">
                        {docRecord.currency} {docRecord.total.toLocaleString()}
                      </span>
                      <button
                        onClick={(e) => handleDeleteSavedDoc(docRecord.id, e)}
                        className="p-2 rounded-xl bg-gray-800 text-gray-400 hover:text-red-400 hover:bg-red-950/60 transition"
                        title="Eliminar documento"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default FacturaSection;
