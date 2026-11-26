import crypto from 'node:crypto';

export const config = {
  api: {
    bodyParser: false,
  },
};

const processedStripeEvents = new Set<string>();

async function readRawBody(req: any): Promise<Buffer> {
  if (Buffer.isBuffer(req.body)) return req.body;
  if (typeof req.body === 'string') return Buffer.from(req.body, 'utf8');
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

function verifyStripeSignature(rawBody: Buffer, sigHeader: string | undefined, secret: string): boolean {
  if (!sigHeader || !secret) return false;
  const parts = sigHeader.split(',').reduce<Record<string, string[]>>((acc, item) => {
    const [k, v] = item.split('=');
    if (k && v) {
      acc[k.trim()] = acc[k.trim()] || [];
      acc[k.trim()].push(v.trim());
    }
    return acc;
  }, {});

  const timestamp = parts.t?.[0];
  const signatures = parts.v1 || [];
  if (!timestamp || signatures.length === 0) return false;

  const tsNum = Number(timestamp);
  if (!Number.isFinite(tsNum) || Math.abs(Math.floor(Date.now() / 1000) - tsNum) > 300) {
    return false;
  }

  const signedPayload = `${timestamp}.${rawBody.toString('utf8')}`;
  const expected = crypto.createHmac('sha256', secret).update(signedPayload, 'utf8').digest('hex');
  const expectedBuf = Buffer.from(expected, 'utf8');

  return signatures.some((sig) => {
    const sigBuf = Buffer.from(sig, 'utf8');
    return sigBuf.length === expectedBuf.length && crypto.timingSafeEqual(sigBuf, expectedBuf);
  });
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method Not Allowed' });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return res.status(500).json({ ok: false, error: 'STRIPE_WEBHOOK_SECRET no configurado en Vercel.' });
  }

  try {
    const rawBody = await readRawBody(req);
    const sigHeader = req.headers['stripe-signature'] as string | undefined;

    if (!verifyStripeSignature(rawBody, sigHeader, webhookSecret)) {
      return res.status(400).json({ ok: false, error: 'Firma Stripe-Signature inválida.' });
    }

    const event = JSON.parse(rawBody.toString('utf8'));
    const eventId = String(event?.id || '');
    if (eventId && processedStripeEvents.has(eventId)) {
      return res.status(200).json({ ok: true, deduplicated: true, eventId });
    }

    if (event?.type === 'checkout.session.completed') {
      const session = event.data?.object || {};
      if (session.payment_status !== 'paid') {
        return res.status(200).json({ ok: true, ignored: true, reason: 'payment_status_not_paid' });
      }

      const meta = session.metadata || {};
      const reservaId = String(meta.reservaId || '').trim();
      const nombreArtistico = String(meta.nombreArtistico || 'Artista').trim();
      const fecha = String(meta.fecha || '').trim();
      const bloque = String(meta.bloque || '13:00-17:00').trim();
      const [horaInicio = '13:00', horaSalida = '17:00'] = bloque.split('-').map((s: string) => s.trim());
      const deposito = Math.round(Number(session.amount_total || 0) / 100);
      const idempotencyKey = String(session.id || eventId);

      if (eventId) processedStripeEvents.add(eventId);

      const proto = req.headers['x-forwarded-proto'] || 'https';
      const host = req.headers.host || 'the-facultypr.vercel.app';
      const webhookUrl = `${proto}://${host}/api/guild-reserva-webhook`;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 9000);
      let guildResult: unknown = null;
      try {
        const gResp = await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            idempotencyKey,
            stripeSessionId: session.id,
            reservaId,
            nombreArtistico,
            service: `Reserva Stripe (${reservaId || 'WEB'})`,
            fecha,
            horaInicio,
            horaSalida,
            deposito,
          }),
          signal: controller.signal,
        });
        guildResult = await gResp.json().catch(() => null);
      } finally {
        clearTimeout(timeoutId);
      }

      return res.status(200).json({
        ok: true,
        eventId,
        reservaId,
        sessionId: session.id,
        guildResult,
      });
    }

    return res.status(200).json({ ok: true, ignored: true, type: event?.type || 'unknown' });
  } catch (err: any) {
    console.error('Error /api/stripe-webhook:', err);
    return res.status(500).json({ ok: false, error: err?.message || 'Webhook error' });
  }
}
