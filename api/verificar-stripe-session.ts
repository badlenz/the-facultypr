/**
 * Vercel Serverless Function: /api/verificar-stripe-session
 * Valida server-side un session_id de Stripe Checkout para evitar spoofing de ?stripe_paid=1.
 */
export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    return res.status(405).json({ ok: false, error: 'Method Not Allowed' });
  }

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    return res.status(500).json({ ok: false, error: 'STRIPE_SECRET_KEY no configurada.' });
  }

  const sessionId = String(req.query?.session_id || '').trim();
  if (!sessionId || !sessionId.startsWith('cs_')) {
    return res.status(400).json({ ok: false, paid: false, error: 'session_id inválido.' });
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    let stripeRes: Response;
    try {
      stripeRes = await fetch(`https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(sessionId)}`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${secretKey}` },
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeoutId);
    }

    const data = await stripeRes.json().catch(() => ({}));
    if (!stripeRes.ok) {
      return res.status(400).json({ ok: false, paid: false, error: data?.error?.message || 'Sesión no encontrada.' });
    }

    return res.status(200).json({
      ok: true,
      paid: data.payment_status === 'paid',
      paymentStatus: data.payment_status || 'unpaid',
      sessionId: data.id,
      reservaId: String(data.metadata?.reservaId || ''),
      amountTotal: Math.round(Number(data.amount_total || 0) / 100),
    });
  } catch (err: any) {
    return res.status(500).json({ ok: false, paid: false, error: err?.message || 'Error verificando sesión.' });
  }
}
