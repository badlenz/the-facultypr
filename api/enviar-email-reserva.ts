/**
 * Vercel Serverless Function: /api/enviar-email-reserva
 * Envía alertas instantáneas a Badlenz (ellentemalo@gmail.com) y confirmación al artista vía Resend.
 *
 * Variables de entorno requeridas en Vercel:
 *   RESEND_API_KEY   = re_xxxxxxxxx
 *   ADMIN_EMAIL      = ellentemalo@gmail.com (opcional, default ellentemalo@gmail.com)
 *   RESEND_FROM      = La Facultad Studio <onboarding@resend.dev> (o tu dominio verificado)
 */
export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method Not Allowed' });
  }

  try {
    const { cliente, reserva, detallesProyecto } = req.body || {};
    if (!cliente || !reserva) {
      return res.status(400).json({ ok: false, error: 'Faltan datos de cliente o reserva.' });
    }

    const resendKey = process.env.RESEND_API_KEY;
    const adminEmail = process.env.ADMIN_EMAIL || 'ellentemalo@gmail.com';
    const fromAddress = process.env.RESEND_FROM || 'La Facultad Studio <onboarding@resend.dev>';

    if (!resendKey) {
      return res.status(200).json({
        ok: true,
        skipped: true,
        message: 'RESEND_API_KEY no configurada en Vercel todavía. Reserva guardada en Firestore.',
      });
    }

    const cleanDate = String(reserva.fecha || '').replace(/-/g, '');
    const cleanStart = String(reserva.horaInicio || '13:00').replace(':', '') + '00';
    const cleanEnd = String(reserva.horaSalida || '17:00').replace(':', '') + '00';
    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//La Facultad Studio//Badlenz//ES',
      'BEGIN:VEVENT',
      `UID:${reserva.id}@the-facultypr.vercel.app`,
      `DTSTART;TZID=America/Puerto_Rico:${cleanDate}T${cleanStart}`,
      `DTEND;TZID=America/Puerto_Rico:${cleanDate}T${cleanEnd}`,
      `SUMMARY:Sesión en La Facultad Studio · ${cliente.nombreArtistico}`,
      'LOCATION:La Facultad Studio, Hormigueros, Puerto Rico',
      `DESCRIPTION:Pase #${reserva.id} | Depósito: $${reserva.deposito} USD | Balance: $${reserva.balance} USD`,
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');

    const icsBase64 = Buffer.from(icsContent, 'utf-8').toString('base64');

    const adminHtml = `
      <div style="font-family: sans-serif; background:#0b0d14; color:#f4f4f5; padding:24px; border-radius:16px;">
        <h2 style="color:#f59e0b; margin:0 0 12px;">🎙️ Nueva Reserva · La Facultad Studio</h2>
        <p style="margin:4px 0;"><strong>Pase ID:</strong> #${reserva.id}</p>
        <p style="margin:4px 0;"><strong>Artista:</strong> ${cliente.nombreArtistico} (${cliente.nombreReal || 'N/A'})</p>
        <p style="margin:4px 0;"><strong>WhatsApp:</strong> ${cliente.telefono}</p>
        <p style="margin:4px 0;"><strong>Email:</strong> ${cliente.email || 'No provisto'}</p>
        <p style="margin:4px 0;"><strong>Fecha y Bloque:</strong> ${reserva.fecha} (${reserva.horaInicio} - ${reserva.horaSalida})</p>
        <p style="margin:4px 0;"><strong>Método de Pago:</strong> ${reserva.metodoPago}</p>
        <p style="margin:4px 0;"><strong>Total:</strong> $${reserva.subtotal} USD · <strong>Depósito:</strong> $${reserva.deposito} USD · <strong>Balance:</strong> $${reserva.balance} USD</p>
        ${reserva.comprobanteNumReferencia ? `<p style="margin:4px 0; color:#34d399;"><strong>Ref ATH/Pago:</strong> ${reserva.comprobanteNumReferencia}</p>` : ''}
        ${detallesProyecto?.linkYoutube ? `<p style="margin:4px 0;"><strong>Beat/Ref:</strong> ${detallesProyecto.linkYoutube}</p>` : ''}
        <p style="margin-top:16px;"><a href="https://the-facultypr.vercel.app/admin" style="background:#dc2626; color:#fff; padding:10px 18px; border-radius:10px; text-decoration:none; font-weight:bold;">Abrir Control Room (/admin)</a></p>
      </div>
    `;

    const sendResendEmail = async (payload: Record<string, unknown>) => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000);
      try {
        return await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${resendKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });
      } finally {
        clearTimeout(timeoutId);
      }
    };

    // 1. Alerta inmediata para Badlenz
    await sendResendEmail({
      from: fromAddress,
      to: [adminEmail],
      subject: `🎙️ Nueva Reserva #${reserva.id} · ${cliente.nombreArtistico} (${reserva.fecha})`,
      html: adminHtml,
      attachments: [
        {
          filename: `Sesion_${reserva.fecha}_${reserva.id}.ics`,
          content: icsBase64,
        },
      ],
    });

    // 2. Confirmación automática al artista si dejó email válido
    const clientEmail = String(cliente.email || '').trim();
    if (clientEmail && clientEmail.includes('@') && !clientEmail.endsWith('@cliente.com')) {
      const clientHtml = `
        <div style="font-family: sans-serif; background:#0b0d14; color:#f4f4f5; padding:24px; border-radius:16px;">
          <h2 style="color:#ef4444; margin:0 0 10px;">🎟️ Tu Solicitud de Sesión en La Facultad Studio</h2>
          <p>¡Saludos <strong>${cliente.nombreArtistico}</strong>! Recibimos tu solicitud de reserva con Badlenz en Hormigueros, PR.</p>
          <div style="background:#141724; padding:14px; border-radius:12px; margin:16px 0;">
            <p style="margin:4px 0;"><strong>Código de Pase:</strong> #${reserva.id}</p>
            <p style="margin:4px 0;"><strong>Fecha:</strong> ${reserva.fecha}</p>
            <p style="margin:4px 0;"><strong>Horario:</strong> ${reserva.horaInicio} - ${reserva.horaSalida}</p>
            <p style="margin:4px 0;"><strong>Depósito:</strong> $${reserva.deposito} USD (${reserva.metodoPago})</p>
            <p style="margin:4px 0;"><strong>Balance al llegar:</strong> $${reserva.balance} USD</p>
          </div>
          <p style="font-size:13px; color:#a1a1aa;">Adjuntamos el archivo <strong>.ics</strong> para que agregues tu sesión a Google Calendar o Apple Calendar. Si aún no has enviado tu comprobante de depósito, hazlo por WhatsApp al <strong>(787) 240-8627</strong> para congelar tu fecha.</p>
        </div>
      `;

      await sendResendEmail({
        from: fromAddress,
        to: [clientEmail],
        subject: `🎟️ Pase de Sesión #${reserva.id} · La Facultad Studio (${reserva.fecha})`,
        html: clientHtml,
        attachments: [
          {
            filename: `La_Facultad_Sesion_${reserva.fecha}.ics`,
            content: icsBase64,
          },
        ],
      });
    }

    return res.status(200).json({ ok: true });
  } catch (error: any) {
    console.error('Error /api/enviar-email-reserva:', error);
    return res.status(500).json({ ok: false, error: 'Error enviando notificación.' });
  }
}
