import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

export const runtime = "nodejs";

async function fulfill(session: Stripe.Checkout.Session) {
  // TODO: sin base de datos todavía — de momento solo deja rastro en los
  // logs de Vercel. Cuando haya persistencia real, aquí se guarda el
  // pedido y se dispara el envío del archivo a JLC3DP.
  console.log("[stripe-webhook] order paid", {
    session_id: session.id,
    email: session.customer_details?.email,
    amount_total: session.amount_total,
    currency: session.currency,
  });
}

export async function POST(req: NextRequest) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  const sig = req.headers.get("stripe-signature");
  const rawBody = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig!, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (e) {
    console.error("[stripe-webhook] bad signature", (e as Error).message);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  // Fulfillment en el handler de webhook, no en la success page — la
  // success page puede no cargar nunca (cierre de pestaña, red) y el pago
  // asíncrono (ej. bank transfer) no confirma hasta el segundo evento.
  if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
    const session = event.data.object as Stripe.Checkout.Session;
    if (session.payment_status === "paid") await fulfill(session);
  }

  return NextResponse.json({ received: true });
}
