import Link from "next/link";
import { notFound } from "next/navigation";
import { getZone, zoneSlugs } from "@/config/zones";
import { brand } from "@/config/brand";

export function generateStaticParams() {
  return zoneSlugs.map((zone) => ({ zone }));
}

// Stub del configurador. Aquí irá: subir foto -> generar con IA -> elegir
// resultado -> tamaño/color/extras -> carrito -> Stripe. (Tarea siguiente.)
export default async function CreatePage({
  params,
}: {
  params: Promise<{ zone: string }>;
}) {
  const { zone } = await params;
  const z = getZone(zone);
  if (!z) notFound();

  return (
    <main
      style={{
        minHeight: "70vh",
        display: "grid",
        placeItems: "center",
        textAlign: "center",
        padding: "80px 24px",
      }}
    >
      <div style={{ maxWidth: "34rem" }}>
        <div style={{ fontSize: "2.4rem" }}>🐾🛠️</div>
        <h1 style={{ fontSize: "2rem", marginTop: 16 }}>The {z.animal} studio is coming</h1>
        <p style={{ color: "var(--ink-soft)", marginTop: 12 }}>
          Here you&apos;ll upload a photo, our AI will sculpt your {z.animal}, and you&apos;ll
          pick size, colors and extras before checkout. We&apos;re building it now.
        </p>
        <p style={{ marginTop: 28 }}>
          <Link
            href={`/${z.slug}`}
            style={{
              fontWeight: 800,
              color: "#fff",
              background: "var(--accent)",
              padding: "12px 22px",
              borderRadius: 999,
            }}
          >
            ← Back to {brand.name}
          </Link>
        </p>
      </div>
    </main>
  );
}
