import { notFound } from "next/navigation";
import Configurator from "@/components/create/Configurator";
import { getZone, zoneSlugs } from "@/config/zones";
import { bases } from "@/config/products";

export function generateStaticParams() {
  return zoneSlugs.map((zone) => ({ zone }));
}

// Configurador: subir foto -> generar con IA (Kie) -> elegir base + nombre -> carrito.
export default async function CreatePage({
  params,
}: {
  params: Promise<{ zone: string }>;
}) {
  const { zone } = await params;
  const z = getZone(zone);
  if (!z) notFound();

  return <Configurator zoneSlug={z.slug} animal={z.animal} bases={bases} />;
}
