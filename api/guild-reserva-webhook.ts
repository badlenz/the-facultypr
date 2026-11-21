export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  const bridgeUrl = process.env.GUILD_GOOGLE_BRIDGE_URL;
  const bridgeSecret = process.env.GUILD_GOOGLE_BRIDGE_SECRET || 'LFS-GREMIO-2027-PUENTE';
  const tgToken = process.env.GUILD_TELEGRAM_BOT_TOKEN;
  const tgChatId = process.env.GUILD_TELEGRAM_CHAT_ID;

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const artist = String(body.nombreArtistico || body.artist || 'Artista').trim();
    const service = Array.isArray(body.servicios) ? body.servicios.join(', ') : String(body.service || 'Sesión de Estudio');
    const fecha = String(body.fecha || '').trim();
    const horaInicio = String(body.horaInicio || '14:00').trim();
    const horaSalida = String(body.horaSalida || '18:00').trim();
    const deposito = Number(body.deposito || 0);

    const results: Record<string, unknown> = {};

    if (bridgeUrl && fecha) {
      const startIso = `${fecha}T${horaInicio}:00-04:00`;
      const endIso = `${fecha}T${horaSalida}:00-04:00`;

      const calResp = await fetch(bridgeUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          secret: bridgeSecret,
          action: 'createCalendarEvent',
          title: `[La Facultad Studio] ${artist} — ${service}`,
          startIso,
          endIso,
          description: `Reserva confirmada vía Web.\nServicio: ${service}\nDepósito: $${deposito}`
        })
      });
      results.calendar = await calResp.json().catch(() => null);

      const drvResp = await fetch(bridgeUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          secret: bridgeSecret,
          action: 'createProjectFolders',
          folderName: `${artist} - ${fecha}`
        })
      });
      results.drive = await drvResp.json().catch(() => null);
    }

    if (tgToken && tgChatId) {
      const msg = `📅 Nueva Reserva Confirmada\nArtista: ${artist}\nServicio: ${service}\nFecha: ${fecha} (${horaInicio} - ${horaSalida})\nDepósito: $${deposito}`;
      await fetch(`https://api.telegram.org/bot${tgToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: tgChatId, text: msg })
      });
      results.telegram = true;
    }

    return res.status(200).json({ ok: true, results });
  } catch (err: any) {
    return res.status(500).json({ ok: false, error: err?.message || 'Webhook error' });
  }
}
