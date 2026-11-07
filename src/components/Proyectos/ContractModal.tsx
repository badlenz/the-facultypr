import React, { useState } from 'react';
import { StudioProject } from '../../types';
import jsPDF from 'jspdf';
import { FileText, Download, Printer, CheckCircle, ShieldCheck, X, User, DollarSign, Calendar, Sparkles } from 'lucide-react';
import { LOGO_URLS } from '../BrandingLogos';

interface ContractModalProps {
  project: StudioProject;
  onClose: () => void;
}

export const ContractModal: React.FC<ContractModalProps> = ({ project, onClose }) => {
  const [identificacion, setIdentificacion] = useState('');
  const [telefono, setTelefono] = useState('');
  const [ciudad, setCiudad] = useState('Hormigueros, Puerto Rico');
  const [clausulaExtra, setClausulaExtra] = useState('');
  const [anticipoMonto, setAnticipoMonto] = useState(
    project.montoTotal <= 200 ? 50 : Math.round(project.montoTotal * 0.5)
  );
  const [generadoExito, setGeneradoExito] = useState(false);

  const fechaHoy = new Date().toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const generatePDFContract = () => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = doc.internal.pageSize.getWidth(); // 210mm
    let y = 15;

    // Header Background Accent Bar
    doc.setFillColor(185, 28, 28); // Red #b91c1c
    doc.rect(0, 0, pageWidth, 8, 'F');

    y = 20;

    // Title & Brand Header
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(17, 24, 39);
    doc.text('LA FACULTAD STUDIO LLC', 15, y);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text('PRODUCCIÓN MUSICAL & SERVICIOS DE AUDIO PROFESIONAL', 15, y + 5);
    doc.text('BADLENZ MUSIC GROUP | HORMIGUEROS, PUERTO RICO', 15, y + 9);

    // Document Badge Right
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(pageWidth - 75, 14, 60, 18, 2, 2, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(185, 28, 28);
    doc.text('CONTRATO DE SERVICIO', pageWidth - 70, 21);
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.text(`Ref: LFS-${project.id.toUpperCase().slice(-6)}`, pageWidth - 70, 26);
    doc.text(`Fecha: ${fechaHoy}`, pageWidth - 70, 30);

    y = 42;
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);
    doc.line(15, y, pageWidth - 15, y);

    y += 8;

    // Parties Box
    doc.setFillColor(248, 250, 252);
    doc.rect(15, y, pageWidth - 30, 32, 'F');
    doc.setDrawColor(203, 213, 225);
    doc.rect(15, y, pageWidth - 30, 32, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text('1. PARTES INTERVINIENTES', 18, y + 6);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(51, 65, 85);
    doc.text(`EL PRESTADOR: LA FACULTAD STUDIO LLC (Representado por Badlenz / Producción)`, 18, y + 13);
    doc.text(`EL CLIENTE / ARTISTA: ${project.cliente.toUpperCase()} ${identificacion ? `(ID/DNI: ${identificacion})` : ''}`, 18, y + 19);
    doc.text(`Contacto / Ciudad: ${ciudad} ${telefono ? `| Tel: ${telefono}` : ''}`, 18, y + 25);

    y += 38;

    // Project & Financial Terms Box
    doc.setFillColor(254, 242, 242); // Light red box
    doc.rect(15, y, pageWidth - 30, 36, 'F');
    doc.setDrawColor(252, 165, 165);
    doc.rect(15, y, pageWidth - 30, 36, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(153, 27, 27);
    doc.text('2. DETALLES DEL PROYECTO Y HONORARIOS', 18, y + 6);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(30, 41, 59);
    doc.text(`Proyecto:`, 18, y + 13);
    doc.setFont('helvetica', 'normal');
    doc.text(`${project.nombre} (${project.categoria})`, 42, y + 13);

    doc.setFont('helvetica', 'bold');
    doc.text(`Monto Acordado:`, 18, y + 19);
    doc.setFont('helvetica', 'normal');
    doc.text(`${project.moneda} ${project.montoTotal.toLocaleString()}`, 52, y + 19);

    doc.setFont('helvetica', 'bold');
    doc.text(`Depósito Requerido:`, 18, y + 25);
    doc.setFont('helvetica', 'normal');
    doc.text(`${project.moneda} ${anticipoMonto.toLocaleString()} (${project.montoTotal <= 200 ? '$50 depósito por tema' : '50% depósito'} para confirmar fecha)`, 54, y + 25);

    doc.setFont('helvetica', 'bold');
    doc.text(`Fecha Estimada de Entrega:`, 18, y + 31);
    doc.setFont('helvetica', 'normal');
    doc.text(`${project.fechaEntrega} | Productor a cargo: ${project.liderCreativo}`, 68, y + 31);

    y += 42;

    // Deliverables & Milestones
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text('3. ALCANCE Y HITOS COMPROMETIDOS', 15, y);

    y += 5;
    project.hitos.forEach((h, idx) => {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(51, 65, 85);
      doc.text(`• Hito ${idx + 1}: ${h.titulo} ${h.completado ? '[COMPLETADO ✓]' : '[PENDIENTE]'}`, 18, y);
      y += 5;
    });

    y += 4;

    // Standard Legal Clauses
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text('4. CLÁUSULAS Y CONDICIONES DE SERVICIO', 15, y);

    y += 6;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);

    const clausulas = [
      'A. PROPIEDAD INTELECTUAL: Los derechos de autor y archivos de sesión masterizados serán transferidos formalmente al CLIENTE una vez cancelado el 100% del balance total.',
      'B. REVISIONES Y AJUSTES: El presente servicio incluye 2 (dos) rondas de revisiones gratuitas. A partir de la 3ra revisión aplican honorarios estándar de $10 USD c/u. Todos los stems multitrack y máster WAV 24-bit están incluidos sin costo adicional.',
      'C. RESERVA DE SESIONES: Toda cancelación o reprogramación de horas de grabación debe realizarse con mínimo 24 horas de anticipación para evitar penalidad.',
      'D. ALMACENAMIENTO DE ARCHIVOS: Los archivos de proyecto y tallos (stems) permanecerán disponibles en Google Drive por un período de 90 días tras la entrega final.'
    ];

    clausulas.forEach(c => {
      const splitText = doc.splitTextToSize(c, pageWidth - 30);
      doc.text(splitText, 15, y);
      y += splitText.length * 3.8;
    });

    if (clausulaExtra.trim()) {
      y += 2;
      doc.setFont('helvetica', 'bold');
      doc.text('ESTIPULACIONES ADICIONALES:', 15, y);
      y += 4;
      doc.setFont('helvetica', 'normal');
      const splitExtra = doc.splitTextToSize(clausulaExtra.trim(), pageWidth - 30);
      doc.text(splitExtra, 15, y);
      y += splitExtra.length * 3.8;
    }

    y += 12;

    // Signatures Block
    doc.setDrawColor(203, 213, 225);
    doc.line(20, y, 90, y);
    doc.line(120, y, 190, y);

    y += 4;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.text('FIRMA PRESTADOR DE SERVICIOS', 25, y);
    doc.text('FIRMA CLIENTE / ARTISTA', 135, y);

    y += 4;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text('LA FACULTAD STUDIO LLC', 28, y);
    doc.text(`${project.cliente.toUpperCase()}`, 135, y);

    // Footer
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text('Documento generado digitalmente por el Sistema de Gestión de La Facultad Studio LLC', pageWidth / 2, 285, { align: 'center' });

    // Save File
    doc.save(`Contrato_LaFacultadStudio_${project.cliente.replace(/\s+/g, '_')}.pdf`);
    setGeneradoExito(true);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-[#111113] border border-neutral-800 rounded-2xl max-w-2xl w-full p-4 sm:p-6 space-y-4 sm:space-y-6 shadow-2xl my-auto sm:my-8 max-h-[92vh] sm:max-h-none overflow-y-auto text-white">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-red-950/80 border border-red-800/80 rounded-xl">
              <FileText className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white uppercase tracking-wider">
                Generador de Contrato de Producción
              </h3>
              <p className="text-xs text-neutral-400">
                Relleno automático de datos para el cliente <strong className="text-amber-400">{project.cliente}</strong>
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-neutral-400 hover:text-white p-1.5 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Details */}
        <div className="space-y-4 text-xs">
          
          {/* Summary Card */}
          <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800 space-y-2">
            <div className="flex items-center justify-between border-b border-neutral-800/80 pb-2">
              <span className="font-bold text-slate-300 uppercase">Resumen del Proyecto:</span>
              <span className="text-amber-400 font-extrabold">{project.moneda} {project.montoTotal.toLocaleString()}</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-neutral-400">
              <p>📌 Proyecto: <span className="text-white font-semibold">{project.nombre}</span></p>
              <p>🎤 Cliente: <span className="text-white font-semibold">{project.cliente}</span></p>
              <p>🏷️ Categoría: <span className="text-white font-semibold">{project.categoria}</span></p>
              <p>📅 Entrega: <span className="text-white font-semibold">{project.fechaEntrega}</span></p>
            </div>
          </div>

          {/* Editable Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-neutral-400 uppercase mb-1">
                Identificación / DNI del Cliente (Opcional)
              </label>
              <input
                type="text"
                placeholder="Ej: 123456789-A"
                value={identificacion}
                onChange={e => setIdentificacion(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-white outline-none focus:border-red-500"
              />
            </div>

            <div>
              <label className="block font-bold text-neutral-400 uppercase mb-1">
                Teléfono de Contacto
              </label>
              <input
                type="text"
                placeholder="Ej: +1 (787) 555-0199"
                value={telefono}
                onChange={e => setTelefono(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-white outline-none focus:border-red-500"
              />
            </div>

            <div>
              <label className="block font-bold text-neutral-400 uppercase mb-1">
                Monto de Anticipo ($)
              </label>
              <input
                type="number"
                value={anticipoMonto}
                onChange={e => setAnticipoMonto(Number(e.target.value))}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-white outline-none focus:border-red-500"
              />
            </div>

            <div>
              <label className="block font-bold text-neutral-400 uppercase mb-1">
                Ubicación / Ciudad
              </label>
              <input
                type="text"
                value={ciudad}
                onChange={e => setCiudad(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-white outline-none focus:border-red-500"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-neutral-400 uppercase mb-1">
              Cláusula Especial o Notas Adicionales
            </label>
            <textarea
              rows={2}
              placeholder="Ej: Incluye 3 cambios de instrumentación en el beat principal antes de la mezcla final..."
              value={clausulaExtra}
              onChange={e => setClausulaExtra(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-white outline-none focus:border-red-500"
            />
          </div>

        </div>

        {generadoExito && (
          <div className="bg-emerald-950/80 border border-emerald-800 text-emerald-400 p-3 rounded-xl flex items-center gap-2 text-xs font-bold">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span>Contrato PDF generado y descargado exitosamente en tu dispositivo.</span>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-between border-t border-neutral-800 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-neutral-400 hover:text-white"
          >
            Cerrar
          </button>

          <button
            type="button"
            onClick={generatePDFContract}
            className="flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg transition"
          >
            <Download className="w-4 h-4" />
            <span>Descargar Contrato PDF</span>
          </button>
        </div>

      </div>
    </div>
  );
};
