import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

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

    const origin = req.nextUrl.origin;
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items,
      ...(coupon ? { discounts: [{ coupon }] } : { allow_promotion_codes: false }),
      customer_email: email,
      success_url: `${origin}/${zone}/create/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/${zone}/create`,
      integration_identifier: "sculptlyckt",
    });

    return NextResponse.json({ url: session.url });
  } catch (e) {
    console.error("[/api/checkout]", (e as Error).message);
    return NextResponse.json({ error: "Couldn't start checkout. Try again." }, { status: 500 });
  }
}
