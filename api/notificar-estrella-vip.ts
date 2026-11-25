import { VIP_MAX_STARS } from '../src/services/vipRules';

/**
 * Vercel Serverless Function: /api/notificar-estrella-vip
 * Envía aviso por Resend al cliente (si tiene email válido) y alerta interna por Telegram
 * cuando un cliente gana una estrella en el Pasaporte VIP.
 * Fire-and-forget desde el cliente: nunca debe bloquear el guardado en Firestore.
 */
export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method Not Allowed' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const {
      nombreArtistico,
      email,
      estrellasVip,
      delta,
      nivel,
      proximoHito,
      estrellasFaltantes,
      origen,
      reservaId,
    } = body;

    if (!nombreArtistico || typeof estrellasVip !== 'number') {
      return res.status(400).json({ ok: false, error: 'Faltan datos de estrella VIP.' });
    }

    const resendKey = process.env.RESEND_API_KEY;
    const fromAddress = process.env.RESEND_FROM || 'La Facultad Studio <onboarding@resend.dev>';
    const tgToken = process.env.GUILD_TELEGRAM_BOT_TOKEN;
    const tgChatId = process.env.GUILD_TELEGRAM_CHAT_ID;

    const results: Record<string, unknown> = {};

    const cleanEmail = String(email || '').trim();
    if (resendKey && cleanEmail && cleanEmail.includes('@') && !cleanEmail.endsWith('@cliente.com')) {
      try {
        const metaText =
          typeof estrellasFaltantes === 'number' && estrellasFaltantes > 0 && proximoHito
            ? `Te faltan <strong>${estrellasFaltantes} ⭐</strong> para desbloquear: <strong>${proximoHito}</strong>.`
            : `¡Has alcanzado el nivel máximo del Pasaporte VIP (${VIP_MAX_STARS}/${VIP_MAX_STARS} ⭐ — Producción Completa Gratis)!`;

        const clientHtml = `
          <div style="font-family: sans-serif; background:#0b0d14; color:#f4f4f5; padding:24px; border-radius:16px;">
            <h2 style="color:#f59e0b; margin:0 0 12px;">⭐ ¡Ganaste +${Number(delta) || 1} Estrella VIP en La Facultad Studio!</h2>
            <p>¡Saludos <strong>${nombreArtistico}</strong>! Se acreditó una nueva estrella en tu Pasaporte VIP.</p>
            <div style="background:#141724; padding:16px; border-radius:12px; margin:16px 0; border:1px solid #f59e0b33;">
              <p style="margin:4px 0;"><strong>Total actual:</strong> ${estrellasVip} / ${VIP_MAX_STARS} ⭐</p>
              <p style="margin:4px 0;"><strong>Nivel actual:</strong> ${nivel || 'VIP'}</p>
              <p style="margin:8px 0 0; color:#fcd34d;">${metaText}</p>
            </div>
            <p style="font-size:13px; color:#a1a1aa;">Puedes consultar tu progreso en cualquier momento desde el Portal Artista en <a href="https://the-facultypr.vercel.app" style="color:#f59e0b;">the-facultypr.vercel.app</a>.</p>
          </div>
        `;

        const emailResp = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${resendKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: fromAddress,
            to: [cleanEmail],
            subject: `⭐ +${Number(delta) || 1} Estrella VIP (${estrellasVip}/${VIP_MAX_STARS}) · La Facultad Studio`,
            html: clientHtml,
          }),
        });
        results.email = emailResp.ok;
      } catch (e: any) {
        results.emailError = e?.message || 'Resend error';
      }
    }

    if (tgToken && tgChatId) {
      try {
        const metaLine =
          typeof estrellasFaltantes === 'number' && estrellasFaltantes > 0 && proximoHito
            ? `Faltan ${estrellasFaltantes} ⭐ para: ${proximoHito}`
            : `👑 ¡Meta máxima alcanzada (${VIP_MAX_STARS}/${VIP_MAX_STARS} ⭐ — Producción Completa Gratis)!`;
        const msg = [
          `⭐ Estrella VIP Otorgada (+${Number(delta) || 1})`,
          `Artista: ${nombreArtistico}`,
          `Total: ${estrellasVip}/${VIP_MAX_STARS} ⭐ (${nivel || 'VIP'})`,
          metaLine,
          reservaId ? `Reserva: #${reservaId}` : null,
          origen ? `Origen: ${origen}` : null,
        ]
          .filter(Boolean)
          .join('\n');

        const tgResp = await fetch(`https://api.telegram.org/bot${tgToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: tgChatId, text: msg }),
        });
        results.telegram = tgResp.ok;
      } catch (e: any) {
        results.telegramError = e?.message || 'Telegram error';
      }
    }

    return res.status(200).json({ ok: true, results });
  } catch (err: any) {
    return res.status(500).json({ ok: false, error: err?.message || 'Error notificando estrella VIP' });
  }
}
