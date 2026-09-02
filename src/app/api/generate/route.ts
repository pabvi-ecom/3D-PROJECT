import { NextRequest, NextResponse } from "next/server";
import { generateFigurine } from "@/lib/kie";
import { getZone } from "@/config/zones";
import { bases } from "@/config/products";

export const runtime = "nodejs";
export const maxDuration = 120; // la generación puede tardar ~10-60s

/**
 * POST /api/generate
 * body: { imageUrl: string (URL pública de la foto), zone?: string, baseId?: string }
 * Devuelve: { url } con la imagen de la figurita.
 *
 * NOTA: la foto del cliente debe ser una URL pública para que Kie la pueda leer.
 * El hosting de la subida (llevar el archivo del cliente a una URL) es la siguiente
 * pieza de infraestructura; este endpoint ya funciona con una URL.
 */
export async function POST(req: NextRequest) {
  try {
    const { imageUrl, zone = "dogs", baseId = "wood" } = await req.json();
    if (!imageUrl || typeof imageUrl !== "string") {
      return NextResponse.json({ error: "Falta imageUrl" }, { status: 400 });
    }

    const z = getZone(zone);
    const animal = z?.animal ?? "pet";
    const base = bases.find((b) => b.id === baseId) ?? bases[0];

    const prompt =
      `Turn this ${animal} into a cute, full-color collectible 3D printed figurine of the same ${animal}, ` +
      `keeping its exact breed, fur colors and markings. ${base.prompt}. ` +
      `Studio product photo, soft light, plain light background, photorealistic, centered.`;

    const url = await generateFigurine(imageUrl, prompt);
    return NextResponse.json({ url });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
