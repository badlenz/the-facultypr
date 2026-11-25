export default async function handler(req: any, res: any) {
  const bridgeUrl = process.env.GUILD_GOOGLE_BRIDGE_URL;
  const bridgeSecret = process.env.GUILD_GOOGLE_BRIDGE_SECRET;

  if (!bridgeUrl || !bridgeSecret) {
    return res.status(200).json({ ok: false, error: 'GUILD_GOOGLE_BRIDGE_URL o GUILD_GOOGLE_BRIDGE_SECRET no configurado en Vercel.' });
  }

  const postBridgeWithTimeout = async (payload: Record<string, unknown>, timeoutMs = 8000) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    try {
      return await fetch(bridgeUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeoutId);
    }
  };

  try {
    if (req.method === 'GET') {
      const resp = await postBridgeWithTimeout({
        secret: bridgeSecret,
        action: 'getCronomanteSchedule',
      });
      const data = await resp.json().catch(() => ({ ok: false }));
      return res.status(200).json(data);
    }

    if (req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
      const incomingSecret = req.headers['x-guild-secret'] || body.secret;
      if (incomingSecret !== bridgeSecret) {
        return res.status(401).json({ ok: false, error: 'Unauthorized' });
      }
      const resp = await postBridgeWithTimeout({
        secret: bridgeSecret,
        action: 'saveCronomanteSchedule',
        dias: body.dias || {},
        updatedAt: new Date().toISOString(),
      });
      const data = await resp.json().catch(() => ({ ok: false }));
      return res.status(200).json(data);
    }

    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  } catch (err: any) {
    return res.status(500).json({ ok: false, error: err?.message || 'Sync error' });
  }
}
