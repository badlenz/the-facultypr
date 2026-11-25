/**
 * Vercel Serverless Function: /api/crear-checkout-stripe
 * Crea una sesión de Stripe Checkout (Tarjeta, Apple Pay, Google Pay) para el depósito de la sesión.
 *
 * Variable de entorno requerida en Vercel:
 *   STRIPE_SECRET_KEY = sk_test_... (pruebas) o sk_live_... (producción)
 */
export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method Not Allowed' });
  }

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    return res.status(500).json({
      ok: false,
      error: 'STRIPE_SECRET_KEY no configurada en las variables de entorno de Vercel.',
    });
  }

  try {
    const {
      reservaId,
      nombreArtistico,
      email,
      fecha,
      horaInicio,
      horaSalida,
      deposito,
      paquete,
      origin,
    } = req.body || {};

    const amountUsd = Math.max(20, Math.min(2000, Math.round(Number(deposito) || 50)));
    const amountCents = amountUsd * 100;
    const baseUrl =
      (typeof origin === 'string' && origin.startsWith('http') ? origin.replace(/\/+$/, '') : '') ||
      'https://the-facultypr.vercel.app';

    const safeReservaId = encodeURIComponent(String(reservaId || 'RESERVA'));
    const params = new URLSearchParams();
    params.append('mode', 'payment');
    params.append('line_items[0][price_data][currency]', 'usd');
    params.append('line_items[0][price_data][unit_amount]', String(amountCents));
    params.append(
      'line_items[0][price_data][product_data][name]',
      `Depósito Sesión · La Facultad Studio (${fecha || 'Por confirmar'})`
    );
    params.append(
      'line_items[0][price_data][product_data][description]',
      `Artista: ${nombreArtistico || 'Artista'} | Bloque: ${horaInicio || '13:00'} - ${horaSalida || '17:00'} | ${paquete || 'Bloque de 4h'} · Hormigueros, PR`
    );
    params.append('line_items[0][quantity]', '1');
    params.append(
      'success_url',
      `${baseUrl}/?stripe_paid=1&reserva=${safeReservaId}&session_id={CHECKOUT_SESSION_ID}`
    );
    params.append('cancel_url', `${baseUrl}/?stripe_canceled=1&reserva=${safeReservaId}`);
    params.append('metadata[reservaId]', String(reservaId || ''));
    params.append('metadata[nombreArtistico]', String(nombreArtistico || ''));
    params.append('metadata[fecha]', String(fecha || ''));
    params.append('metadata[bloque]', `${horaInicio || '13:00'}-${horaSalida || '17:00'}`);

    const cleanEmail = String(email || '').trim();
    if (cleanEmail && cleanEmail.includes('@') && !cleanEmail.endsWith('@cliente.com')) {
      params.append('customer_email', cleanEmail);
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);
    let stripeRes: Response;
    try {
      stripeRes = await fetch('https://api.stripe.com/v1/checkout/sessions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${secretKey}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
        signal: controller.signal,
      });
    } catch (fetchErr: any) {
      if (fetchErr?.name === 'AbortError') {
        return res.status(504).json({
          ok: false,
          error: 'Stripe tardó demasiado en responder (timeout 15s). Intenta nuevamente.',
        });
      }
      throw fetchErr;
    } finally {
      clearTimeout(timeoutId);
    }

    const data = await stripeRes.json();

    if (!stripeRes.ok || !data?.url) {
      console.error('Stripe Checkout error:', data);
      return res.status(400).json({
        ok: false,
        error: data?.error?.message || 'No se pudo iniciar el pago con Stripe.',
      });
    }

    return res.status(200).json({
      ok: true,
      url: data.url,
      sessionId: data.id,
    });
  } catch (err: any) {
    console.error('Error /api/crear-checkout-stripe:', err);
    return res.status(500).json({ ok: false, error: 'Error interno al conectar con Stripe.' });
  }
}
