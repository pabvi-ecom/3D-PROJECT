import { notFound } from "next/navigation";
import { CreateFlow } from "@/components/create/CreateFlow";
import { getZone, zoneSlugs } from "@/config/zones";

export function generateStaticParams() {
  return zoneSlugs.map((zone) => ({ zone }));
}

// Formulario: nombre -> foto -> generación -> postura -> base -> listo.
export default async function CreatePage({
  params,
  searchParams,
}: {
  params: Promise<{ zone: string }>;
  searchParams: Promise<{ name?: string }>;
}) {
  const { zone } = await params;
  const { name } = await searchParams;
  const z = getZone(zone);
  if (!z) notFound();

  return <CreateFlow zone={z} initialName={name} />;
}
