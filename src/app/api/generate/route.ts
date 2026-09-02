import { NextRequest, NextResponse } from "next/server";
import { generateFigurine, uploadImage } from "@/lib/kie";
import { getZone } from "@/config/zones";
import { bases } from "@/config/products";

export const runtime = "nodejs";
export const maxDuration = 120; // la generación puede tardar ~10-60s

/**
 * POST /api/generate
 * body: {
 *   imageBase64?: string  // data URI de la foto subida por el navegador
 *   imageUrl?: string     // o una URL pública ya hospedada
 *   zone?: string, baseId?: string
 * }
 * Devuelve: { url } con la imagen de la figurita.
 */
export async function POST(req: NextRequest) {
  try {
    const { imageBase64, imageUrl, zone = "dogs", baseId = "wood" } = await req.json();

    // Si llega base64 del navegador, lo subimos a Kie para obtener una URL.
    let src: string | undefined = typeof imageUrl === "string" ? imageUrl : undefined;
    if (!src && typeof imageBase64 === "string") {
      src = await uploadImage(imageBase64);
    }
    if (!src) {
      return NextResponse.json({ error: "Falta la foto (imageBase64 o imageUrl)" }, { status: 400 });
    }

    const z = getZone(zone);
    const animal = z?.animal ?? "pet";
    const base = bases.find((b) => b.id === baseId) ?? bases[0];

    const prompt =
      `Turn this ${animal} into a cute, full-color collectible 3D printed figurine of the same ${animal}, ` +
      `keeping its exact breed, fur colors and markings. ${base.prompt}. ` +
      `Studio product photo, soft light, plain light background, photorealistic, centered.`;

    const url = await generateFigurine(src, prompt);
    return NextResponse.json({ url });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
