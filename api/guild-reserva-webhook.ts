const processedWebhookKeys = new Set<string>();

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  const bridgeUrl = process.env.GUILD_GOOGLE_BRIDGE_URL;
  const bridgeSecret = process.env.GUILD_GOOGLE_BRIDGE_SECRET;
  const tgToken = process.env.GUILD_TELEGRAM_BOT_TOKEN;
  const tgChatId = process.env.GUILD_TELEGRAM_CHAT_ID;

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const idempKey = String(body.idempotencyKey || body.stripeSessionId || '').trim();
    if (idempKey) {
      if (processedWebhookKeys.has(idempKey)) {
        return res.status(200).json({ ok: true, deduplicated: true, idempotencyKey: idempKey });
      }
      processedWebhookKeys.add(idempKey);
    }
    const artist = String(body.nombreArtistico || body.artist || 'Artista').trim();
    const service = Array.isArray(body.servicios) ? body.servicios.join(', ') : String(body.service || 'Sesión de Estudio');
    const fecha = String(body.fecha || '').trim();
    const horaInicio = String(body.horaInicio || '14:00').trim();
    const horaSalida = String(body.horaSalida || '18:00').trim();
    const deposito = Number(body.deposito || 0);

    const postJsonWithTimeout = async (url: string, payload: Record<string, unknown>, timeoutMs = 8000) => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
      try {
        return await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });
      } finally {
        clearTimeout(timeoutId);
      }
    };

    const results: Record<string, unknown> = {};

    if (bridgeUrl && bridgeSecret && fecha) {
      const startIso = `${fecha}T${horaInicio}:00-04:00`;
      const endIso = `${fecha}T${horaSalida}:00-04:00`;

      try {
        const calResp = await postJsonWithTimeout(bridgeUrl, {
          secret: bridgeSecret,
          action: 'createCalendarEvent',
          title: `[La Facultad Studio] ${artist} — ${service}`,
          startIso,
          endIso,
          description: `Reserva confirmada vía Web.\nServicio: ${service}\nDepósito: $${deposito}`,
        });
        results.calendar = await calResp.json().catch(() => null);
      } catch (calErr: any) {
        results.calendar = { ok: false, error: calErr?.name === 'AbortError' ? 'timeout' : (calErr?.message || 'bridge error') };
      }

      try {
        const drvResp = await postJsonWithTimeout(bridgeUrl, {
          secret: bridgeSecret,
          action: 'createProjectFolders',
          folderName: `${artist} - ${fecha}`,
        });
        results.drive = await drvResp.json().catch(() => null);
      } catch (drvErr: any) {
        results.drive = { ok: false, error: drvErr?.name === 'AbortError' ? 'timeout' : (drvErr?.message || 'bridge error') };
      }
    }

    if (tgToken && tgChatId) {
      try {
        const msg = `📅 Nueva Reserva Confirmada\nArtista: ${artist}\nServicio: ${service}\nFecha: ${fecha} (${horaInicio} - ${horaSalida})\nDepósito: $${deposito}`;
        await postJsonWithTimeout(`https://api.telegram.org/bot${tgToken}/sendMessage`, {
          chat_id: tgChatId,
          text: msg,
        });
        results.telegram = true;
      } catch (tgErr: any) {
        results.telegram = false;
        results.telegramError = tgErr?.name === 'AbortError' ? 'timeout' : (tgErr?.message || 'telegram error');
      }
    }

    return res.status(200).json({ ok: true, results });
  } catch (err: any) {
    return res.status(500).json({ ok: false, error: err?.message || 'Webhook error' });
  }
}
