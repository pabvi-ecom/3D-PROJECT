import { notFound } from "next/navigation";
import Stripe from "stripe";
import { getZone, zoneSlugs } from "@/config/zones";
import { brand } from "@/config/brand";
import styles from "./success.module.css";
import { StatusPoller } from "./StatusPoller";

export function generateStaticParams() {
  return zoneSlugs.map((zone) => ({ zone }));
}

export default async function SuccessPage({
  params,
  searchParams,
}: {
  params: Promise<{ zone: string }>;
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { zone } = await params;
  const { session_id } = await searchParams;
  const z = getZone(zone);
  if (!z) notFound();

  let email: string | null = null;
  let amount: number | null = null;
  let paid = false;

  if (session_id && process.env.STRIPE_SECRET_KEY) {
    try {
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
      const session = await stripe.checkout.sessions.retrieve(session_id);
      paid = session.payment_status === "paid";
      email = session.customer_details?.email ?? null;
      amount = session.amount_total;
    } catch {
      // sesión inválida o de otra cuenta — se muestra igualmente la
      // pantalla genérica de gracias, sin datos concretos.
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <span className={styles.emoji}>🎉</span>
        <h1>{paid ? "You're all set!" : "Thanks!"}</h1>
        <p>
          {paid
            ? `Your order is confirmed${email ? ` — a receipt is on its way to ${email}` : ""}.`
            : "We're finishing up your order confirmation."}
        </p>
        {amount != null && <div className={styles.amount}>{brand.currencySymbol}{(amount / 100).toFixed(2)} paid</div>}
        <p className={styles.sub}>Your {z.animal}&apos;s figure goes into production next — 2–4 days to your door.</p>
        {paid && <StatusPoller />}
        <a className={styles.cta} href={`/${zone}`}>Back to {brand.name}</a>
      </div>
    </div>
  );
}
