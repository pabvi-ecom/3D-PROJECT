import { NextRequest, NextResponse } from "next/server";
import { generateFigurine, uploadImage } from "@/lib/kie";
import { getZone } from "@/config/zones";
import { bases } from "@/config/products";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * POST /api/generate
 * Dos modos:
 *  - Desde la foto del cliente:  { imageBase64 | imageUrl, zone?, baseId? }
 *      Genera la figura sobre la base pedida.
 *  - Cambiar solo la base:       { referenceUrl, zone?, baseId? }
 *      Toma una figura ya generada como REFERENCIA y cambia únicamente la base,
 *      manteniendo el perro idéntico (mismo sculpt, pose, colores).
 * Devuelve: { url }.
 */
export async function POST(req: NextRequest) {
  try {
    const { imageBase64, imageUrl, referenceUrl, zone = "dogs", baseId = "wood" } = await req.json();

    const z = getZone(zone);
    const animal = z?.animal ?? "pet";
    const base = bases.find((b) => b.id === baseId) ?? bases[0];

    let src: string | undefined;
    let prompt: string;

    if (typeof referenceUrl === "string" && referenceUrl) {
      // Cambiar SOLO la base, con la figura ya generada como referencia.
      src = referenceUrl;
      prompt =
        `This is a full-color 3D printed figurine of a ${animal} on a display base. ` +
        `Keep the ${animal} figurine EXACTLY the same — identical sculpt, pose, proportions, ` +
        `fur colors and markings. Change ONLY the display base: the figurine is now ${base.prompt}. ` +
        `Studio product photo, soft light, plain light background, photorealistic, centered.`;
    } else {
      src = typeof imageUrl === "string" ? imageUrl : undefined;
      if (!src && typeof imageBase64 === "string") src = await uploadImage(imageBase64);
      if (!src) {
        return NextResponse.json({ error: "Falta la foto (imageBase64/imageUrl) o referenceUrl" }, { status: 400 });
      }
      prompt =
        `Turn this ${animal} into a cute, full-color collectible 3D printed figurine of the same ${animal}, ` +
        `keeping its exact breed, fur colors and markings. ${base.prompt}. ` +
        `Studio product photo, soft light, plain light background, photorealistic, centered.`;
    }

    const url = await generateFigurine(src, prompt);
    return NextResponse.json({ url });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
