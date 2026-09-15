import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createRecord, createRecords } from "@/lib/airtable";

export const runtime = "nodejs";

// Cupones creados a mano en Stripe (test) para los códigos que se ganan en
// el minijuego — ver skill stripe-best-practices, no hay endpoint para
// crear API keys así que esto se hizo una vez por consola/MCP.
const DISCOUNT_COUPONS: Record<string, string> = {
  PLAY5: "PLAY5",
  PLAY10: "PLAY10",
};

type CartItemIn = {
  petName: string;
  poseLabel: string;
  baseLabel: string;
  hasNameplate: boolean;
  unitPrice: number;
  firstUnitDiscountPct: number;
  qty: number;
  figureUrl: string | null;
  figureUrlPlain: string | null;
};

// La misma lógica de precios por unidad que en el cliente (CreateFlow.tsx)
// — recalculada en el servidor para no fiarse de precios que llegan del
// cliente.
function unitPriceAt(it: CartItemIn, n: number): number {
  if (n === 1) return it.unitPrice * (1 - it.firstUnitDiscountPct);
  if (n === 2) return it.unitPrice * 0.5;
  return it.unitPrice;
}

export async function POST(req: NextRequest) {
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
    const body = await req.json();
    const cart: CartItemIn[] = Array.isArray(body.cart) ? body.cart : [];
    const email: string | undefined = typeof body.email === "string" ? body.email : undefined;
    const discountCode: string | undefined = typeof body.discountCode === "string" ? body.discountCode : undefined;
    const zone: string = typeof body.zone === "string" ? body.zone : "dogs";

    const activeCart = cart.filter((it) => it.qty > 0);
    if (activeCart.length === 0) {
      return NextResponse.json({ error: "Your cart is empty" }, { status: 400 });
    }

    const line_items: Stripe.Checkout.SessionCreateParams.LineItem[] = [];
    for (const it of activeCart) {
      for (let n = 1; n <= it.qty; n++) {
        const price = unitPriceAt(it, n);
        line_items.push({
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: Math.round(price * 100),
            product_data: {
              name: `${it.petName} — ${it.poseLabel}, ${it.baseLabel}${it.hasNameplate ? ", engraved" : ""}`,
              description: n === 2 ? "Twin figure — 50% off" : n > 2 ? "Additional figure" : undefined,
            },
          },
        });
      }
    }

    const coupon = discountCode ? DISCOUNT_COUPONS[discountCode.trim().toUpperCase()] : undefined;

    // Se crea el pedido en Airtable (estado "Paid" se pone en el webhook, al
    // confirmar el cobro) ANTES de ir a Stripe — así aunque abandonen el
    // checkout, el pedido/lead queda registrado para remarketing.
    const rawTotal = activeCart.reduce((sum, it) => {
      let s = 0;
      for (let n = 1; n <= it.qty; n++) s += unitPriceAt(it, n);
      return sum + s;
    }, 0);
    const discountPct = coupon === "PLAY10" ? 10 : coupon === "PLAY5" ? 5 : 0;
    const finalTotal = rawTotal * (1 - discountPct / 100);

    // Sin campo Status aquí a propósito — el pedido nace "sin estado" (recién
    // iniciado, aún no pagado) y el webhook de Stripe lo pone en "Paid" al
    // confirmar el cobro. Así un carrito abandonado no aparece como pagado.
    const orderId = await createRecord("Orders", {
      "Order ID": "pending",
      Email: email ?? "",
      "Total Paid": Math.round(finalTotal * 100) / 100,
      "Discount Code": coupon ?? "",
    });

    const itemIds = await createRecords(
      "OrderItems",
      activeCart.map((it) => ({
        fields: {
          "Pet Name": it.petName,
          Order: [orderId],
          Pose: it.poseLabel,
          Base: it.baseLabel,
          Engraved: it.hasNameplate,
          Qty: it.qty,
          "Unit Price": it.unitPrice,
          // La imagen que ve el cliente (con nombre grabado si eligió placa)
          // — Tripo P2+8K reconstruye la placa nítida directamente de ella.
          "Figure Image URL": it.figureUrl ?? "",
          ...(it.figureUrl ? { "Original Photo": [{ url: it.figureUrl }] } : {}),
          "Tripo Status": "Not started",
        },
      })),
    );

    const origin = req.nextUrl.origin;
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items,
      ...(coupon ? { discounts: [{ coupon }] } : { allow_promotion_codes: false }),
      customer_email: email,
      success_url: `${origin}/${zone}/create/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/${zone}/create`,
      integration_identifier: "sculptlyckt",
      metadata: { airtable_order_id: orderId, airtable_item_ids: itemIds.join(",") },
    });

    return NextResponse.json({ url: session.url });
  } catch (e) {
    console.error("[/api/checkout]", (e as Error).message);
    return NextResponse.json({ error: "Couldn't start checkout. Try again." }, { status: 500 });
  }
}
