import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { updateRecord, getRecord } from "@/lib/airtable";
import { launchTripo } from "@/lib/produce";

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

  // Dispara la generación 3D en Tripo para cada figura del pedido — solo
  // se lanza la tarea aquí (es async, tarda 10-120s); /api/cron/poll-tripo
  // se encarga de comprobar el resultado y guardarlo.
  const itemIds = (session.metadata?.airtable_item_ids ?? "").split(",").filter(Boolean);
  for (const itemId of itemIds) {
    try {
      const item = await getRecord("OrderItems", itemId);
      if (!item.fields["Figure Image URL"]) continue;
      // Idempotente: si ya se lanzó (reintento de webhook), no duplicar.
      if (item.fields["Tripo Task ID"]) continue;
      // Mismo flujo que el dashboard: genera la 3/4 sin base si falta y
      // lanza Tripo single máxima calidad.
      await launchTripo("OrderItems", itemId);
    } catch (e) {
      console.error("[stripe-webhook] tripo dispatch failed", itemId, (e as Error).message);
      await updateRecord("OrderItems", itemId, { "Tripo Status": "Failed" }).catch(() => {});
    }
  }

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
