import { Reserva } from '../../services/db';
import { BookingFormData, format12h } from './types';

export async function exportPassPDF(reservaActiva: Reserva, formData: BookingFormData): Promise<void> {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [80, 150],
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
  doc.setTextColor(234, 179, 8);
  doc.text('PASE DE ENTRADA EXPRES - ESTUDIO', 40, 20, { align: 'center' });

  // ID section
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.setFillColor(17, 24, 39);
  doc.rect(10, 24, 60, 8, 'F');
  doc.text(`ID: ${reservaActiva.id}`, 40, 29, { align: 'center' });

  // Details
  doc.setFont('Helvetica', 'normal');
  doc.setTextColor(180, 180, 180);
  doc.text('Artista:', 12, 40);
  doc.setTextColor(255, 255, 255);
  doc.setFont('Helvetica', 'bold');
  doc.text(formData.nombreArtistico || reservaActiva.nombreArtistico || '-', 32, 40);

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
  doc.text('Depósito:', 12, 98);
  doc.setTextColor(234, 179, 8);
  doc.setFont('Helvetica', 'bold');
  doc.text(`$${reservaActiva.deposito}.00 USD`, 68, 98, { align: 'right' });

  doc.setFont('Helvetica', 'normal');
  doc.setTextColor(180, 180, 180);
  doc.text('Balance al Llegar:', 12, 104);
  doc.setTextColor(239, 68, 68);
  doc.setFont('Helvetica', 'bold');
  doc.text(`$${reservaActiva.balance}.00 USD`, 68, 104, { align: 'right' });

  // QR Box
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
}

export function exportPassImage(reservaActiva: Reserva, formData: BookingFormData): void {
  const canvas = document.createElement('canvas');
  canvas.width = 600;
  canvas.height = 1000;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const bgGrad = ctx.createLinearGradient(0, 0, 0, 1000);
  bgGrad.addColorStop(0, '#131316');
  bgGrad.addColorStop(0.5, '#1e1e24');
  bgGrad.addColorStop(1, '#0c0c0e');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, 600, 1000);

  ctx.strokeStyle = '#dc2626';
  ctx.lineWidth = 5;
  ctx.strokeRect(20, 20, 560, 960);

  ctx.strokeStyle = '#eab308';
  ctx.lineWidth = 2;
  ctx.strokeRect(30, 30, 540, 940);

  ctx.fillStyle = '#dc2626';
  ctx.fillRect(60, 48, 480, 4);

  ctx.fillStyle = '#ffffff';
  ctx.font = '900 30px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('LA FACULTAD STUDIO', 300, 92);

  ctx.fillStyle = '#eab308';
  ctx.font = 'bold 16px sans-serif';
  ctx.fillText('PASE VIP OFICIAL • LA FACULTAD STUDIO', 300, 122);

  ctx.fillStyle = '#9ca3af';
  ctx.font = '12px monospace';
  ctx.fillText('PRODUCIDO POR BADLENZ • HORMIGUEROS, PUERTO RICO', 300, 144);

  ctx.fillStyle = '#111827';
  ctx.fillRect(60, 165, 480, 46);
  ctx.strokeStyle = '#ef4444';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(60, 165, 480, 46);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 20px monospace';
  ctx.fillText(`FOLIO: ${reservaActiva.id}`, 300, 195);

  const drawRow = (label: string, value: string, y: number, valueColor = '#ffffff') => {
    ctx.textAlign = 'left';
    ctx.fillStyle = '#9ca3af';
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText(label, 70, y);

    ctx.textAlign = 'right';
    ctx.fillStyle = valueColor;
    ctx.font = 'bold 17px sans-serif';
    ctx.fillText(value, 530, y);
  };

  drawRow('Artista:', formData.nombreArtistico || reservaActiva.nombreArtistico || 'Artista', 250, '#fbbf24');
  drawRow('Nombre Legal:', formData.nombreReal || '-', 285, '#ffffff');
  drawRow('Fecha Sesión:', reservaActiva.fecha, 320, '#ef4444');
  drawRow('Horario Agendado:', `${format12h(reservaActiva.horaInicio)} - ${format12h(reservaActiva.horaSalida)}`, 355, '#38bdf8');
  drawRow('Duración de Sesión:', `${reservaActiva.totalHoras || 4} Horas`, 390, '#ffffff');
  drawRow('Contacto / Tel:', formData.telefono || '-', 425, '#ffffff');
  drawRow('Método de Pago:', reservaActiva.metodoPago, 460, '#34d399');

  ctx.strokeStyle = '#4b5563';
  ctx.lineWidth = 2;
  ctx.setLineDash([8, 6]);
  ctx.beginPath();
  ctx.moveTo(70, 495);
  ctx.lineTo(530, 495);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.textAlign = 'center';
  ctx.fillStyle = '#eab308';
  ctx.font = 'bold 18px sans-serif';
  ctx.fillText('DESGLOSE FINANCIERO', 300, 530);

  drawRow('Inversión Total:', `$${reservaActiva.subtotal}.00 USD`, 570, '#ffffff');
  drawRow('Depósito Requerido:', `$${reservaActiva.deposito}.00 USD`, 605, '#fbbf24');
  drawRow('Balance a Liquidar al Llegar:', `$${reservaActiva.balance}.00 USD`, 640, '#ef4444');

  ctx.fillStyle = '#0f172a';
  ctx.fillRect(235, 680, 130, 130);
  ctx.strokeStyle = '#eab308';
  ctx.lineWidth = 2;
  ctx.strokeRect(235, 680, 130, 130);

  const drawMarker = (x: number, y: number) => {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x, y, 30, 30);
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(x + 5, y + 5, 20, 20);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x + 10, y + 10, 10, 10);
  };
  drawMarker(245, 690);
  drawMarker(325, 690);
  drawMarker(245, 770);

  ctx.fillStyle = '#ffffff';
  for (let i = 0; i < 28; i++) {
    ctx.fillRect(285 + (i % 5) * 8, 690 + Math.floor(i / 5) * 8, 6, 6);
  }
  for (let i = 0; i < 20; i++) {
    ctx.fillRect(245 + (i % 6) * 9, 735 + Math.floor(i / 6) * 7, 6, 6);
  }

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
}

export function openGoogleCalendarForReserva(reservaActiva: Reserva): void {
  const datePart = reservaActiva.fecha.replace(/-/g, '');
  const startHourPart = reservaActiva.horaInicio.replace(/:/g, '');
  const endHourPart = reservaActiva.horaSalida.replace(/:/g, '');

  const startIso = `${datePart}T${startHourPart}00`;
  const endIso = `${datePart}T${endHourPart}00`;

  const title = encodeURIComponent(`Sesión de Grabación | La Facultad Studio 🎤`);
  const details = encodeURIComponent(
    `¡Hagamos música! Sesión reservada con Badlenz.\n\nID Reserva: ${reservaActiva.id}\nServicios: ${reservaActiva.servicios.join(', ')}\nBalance pendiente: $${reservaActiva.balance} USD\n\nPor favor, recuerda llegar 20 minutos antes de tu turno.`
  );
  const location = encodeURIComponent('La Facultad Studio, Hormigueros, Puerto Rico');

  const gCalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startIso}/${endIso}&details=${details}&location=${location}&ctz=America/Puerto_Rico&sf=true&output=xml`;
  window.open(gCalUrl, '_blank', 'noopener,noreferrer');
}
