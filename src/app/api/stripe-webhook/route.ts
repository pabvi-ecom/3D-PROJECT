import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { updateRecord } from "@/lib/airtable";

export const runtime = "nodejs";

async function fulfill(session: Stripe.Checkout.Session) {
  const orderId = session.metadata?.airtable_order_id;
  if (!orderId) {
    console.error("[stripe-webhook] no airtable_order_id in session metadata", session.id);
    return;
  }

  await updateRecord("Orders", orderId, {
    "Order ID": session.id,
    Status: "Paid",
    "Paid At": new Date().toISOString(),
    "Total Paid": (session.amount_total ?? 0) / 100,
  });

  // TODO: siguiente paso de la automatización — mandar cada OrderItem
  // (metadata.airtable_item_ids) a la API de Tripo para generar el modelo
  // 3D. Pendiente de la API key de Tripo.

  console.log("[stripe-webhook] order paid", {
    session_id: session.id,
    airtable_order_id: orderId,
    email: session.customer_details?.email,
    amount_total: session.amount_total,
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
