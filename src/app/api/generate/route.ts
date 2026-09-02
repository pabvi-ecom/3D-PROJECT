import { NextRequest, NextResponse } from "next/server";
import { generateFigurine, uploadImage } from "@/lib/kie";
import { getZone } from "@/config/zones";
import { poses, bases, NO_BASE_ID } from "@/config/products";

export const runtime = "nodejs";
export const maxDuration = 60;

const STUDIO = "Studio product photo, soft light, plain seamless light background, photorealistic, centered.";
const NO_BASE = "with no display base, standing directly on a clean seamless light studio surface";

/**
 * POST /api/generate
 * Modos:
 *  - Desde la foto:        { imageBase64 | imageUrl, zone?, poseId?, baseId? }
 *      Genera la figura en la postura pedida (por defecto SIN base).
 *  - Cambiar la postura:   { referenceUrl, change:"pose", zone?, poseId? }
 *      Toma una figura ya generada como REFERENCIA y cambia SOLO la postura.
 *  - Cambiar la base:      { referenceUrl, change:"base", zone?, baseId? }
 *      Toma una figura ya generada como REFERENCIA y cambia SOLO la base.
 * Devuelve: { url }.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { imageBase64, imageUrl, referenceUrl, change, zone = "dogs", poseId, baseId = NO_BASE_ID } = body;

    const z = getZone(zone);
    const animal = z?.animal ?? "pet";
    const pose = poses.find((p) => p.id === poseId) ?? poses[0];
    const base = bases.find((b) => b.id === baseId) ?? bases[0];
    const basePhrase = base.prompt || NO_BASE;
    const baseRefUrls = base.refImage ? [new URL(base.refImage, req.nextUrl.origin).toString()] : [];
    const baseRefNote = base.refImage
      ? " The LAST reference image shows the exact base to replicate — match its material, color and shape precisely, but keep the nameplate on it blank."
      : "";

    let src: string | undefined;
    let prompt: string;

    if (typeof referenceUrl === "string" && referenceUrl) {
      src = referenceUrl;
      if (change === "pose") {
        // Mantener el perro idéntico, cambiar SOLO la postura (sin base).
        prompt =
          `This is a full-color 3D printed figurine of a ${animal}. ` +
          `Keep the ${animal} figurine EXACTLY the same — identical sculpt, proportions, ` +
          `fur colors and markings. Change ONLY the pose: the ${animal} is now ${pose.prompt}. ` +
          `Keep it ${NO_BASE}. ${STUDIO}`;
      } else {
        // Mantener el perro y la postura idénticos, cambiar SOLO la base.
        prompt =
          `This is a full-color 3D printed figurine of a ${animal}. ` +
          `Keep the ${animal} figurine EXACTLY the same — identical sculpt, pose, proportions, ` +
          `fur colors and markings. Change ONLY the display base: the figurine is now ${basePhrase}.${baseRefNote} ${STUDIO}`;
      }
    } else {
      src = typeof imageUrl === "string" ? imageUrl : undefined;
      if (!src && typeof imageBase64 === "string") src = await uploadImage(imageBase64);
      if (!src) {
        return NextResponse.json({ error: "Falta la foto (imageBase64/imageUrl) o referenceUrl" }, { status: 400 });
      }
      prompt =
        `Turn this ${animal} into a cute, full-color collectible 3D printed figurine of the same ${animal}, ` +
        `keeping its exact breed, fur colors and markings. The figurine is ${pose.prompt}, ${basePhrase}.${baseRefNote} ${STUDIO}`;
    }

    const url = await generateFigurine(src, prompt, baseRefUrls);
    return NextResponse.json({ url });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
