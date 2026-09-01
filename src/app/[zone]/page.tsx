import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Landing from "@/components/landing/Landing";
import { getZone, zoneSlugs } from "@/config/zones";

export function generateStaticParams() {
  return zoneSlugs.map((zone) => ({ zone }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ zone: string }>;
}): Promise<Metadata> {
  const { zone } = await params;
  const z = getZone(zone);
  if (!z) return {};
  return {
    title: z.seo.title,
    description: z.seo.description,
  };
}

export default async function ZonePage({
  params,
}: {
  params: Promise<{ zone: string }>;
}) {
  const { zone } = await params;
  const z = getZone(zone);
  if (!z) notFound();
  return <Landing zone={z} />;
}
