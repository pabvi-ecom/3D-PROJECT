import { NextRequest, NextResponse } from "next/server";
import { generateFigurine, uploadImage } from "@/lib/kie";
import { getZone } from "@/config/zones";
import { poses, bases, NO_BASE_ID } from "@/config/products";

export const runtime = "nodejs";
export const maxDuration = 60;

const STUDIO = "Studio product photo, soft light, plain seamless light background, photorealistic, centered.";
const NO_BASE = "with no display base, standing directly on a clean seamless light studio surface";
const SHELF_REF = "/scenes/shelf-ref.png";
const SHELF_NOTE =
  " The LAST reference image shows the exact home scene to place it in — a floating white wooden shelf on a warm beige wall, with a small potted succulent beside it, soft natural light. Match that shelf, wall, plant and lighting exactly, and place the figurine on the shelf the same way.";

/**
 * POST /api/generate
 * Modos:
 *  - Desde la foto:        { imageBase64 | imageUrl, zone?, poseId?, baseId? }
 *      Genera la figura en la postura pedida (por defecto SIN base).
 *  - Cambiar la postura:   { referenceUrl, change:"pose", zone?, poseId? }
 *      Toma una figura ya generada como REFERENCIA y cambia SOLO la postura.
 *  - Cambiar la base:      { referenceUrl, change:"base", zone?, baseId? }
 *      Toma una figura ya generada como REFERENCIA y cambia SOLO la base.
 *  - Cambiar el ángulo:    { referenceUrl, change:"view", zone?, baseId? }
 *      Toma una figura (con base) ya generada y muestra el mismo sculpt de PERFIL.
 *  - Grabar el nombre:     { referenceUrl, change:"name", zone?, baseId?, petName }
 *      Toma una figura con base ya generada y graba el nombre en la placa.
 * Devuelve: { url }.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { imageBase64, imageUrl, referenceUrl, change, zone = "dogs", poseId, baseId = NO_BASE_ID, petName } = body;

    const z = getZone(zone);
    const animal = z?.animal ?? "pet";
    const pose = poses.find((p) => p.id === poseId) ?? poses[0];
    const base = bases.find((b) => b.id === baseId) ?? bases[0];
    const basePhrase = base.prompt || NO_BASE;
    const baseRefUrls = base.refImage ? [new URL(base.refImage, req.nextUrl.origin).toString()] : [];
    const baseRefNote = base.refImage
      ? " The LAST reference image shows the exact base to replicate — match its material, color and shape precisely, but keep the nameplate on it blank."
      : "";
    const shelfRefUrls = baseId === NO_BASE_ID ? [new URL(SHELF_REF, req.nextUrl.origin).toString()] : [];
    const shelfNote = baseId === NO_BASE_ID ? SHELF_NOTE : "";

    let src: string | undefined;
    let prompt: string;

    if (typeof referenceUrl === "string" && referenceUrl) {
      src = referenceUrl;
      if (change === "pose") {
        // Mantener el perro idéntico, cambiar SOLO la postura (sin base, en la estantería).
        prompt =
          `This is a full-color 3D printed figurine of a ${animal}. ` +
          `Keep the ${animal} figurine EXACTLY the same — identical sculpt, proportions, ` +
          `fur colors and markings. Change ONLY the pose: the ${animal} is now ${pose.prompt}.${shelfNote} ${STUDIO}`;
      } else if (change === "view") {
        // Mantener figura, postura y base idénticas; cambiar SOLO el ángulo a perfil.
        prompt =
          `This is a full-color 3D printed figurine of a ${animal} on a display base. ` +
          `Keep the ${animal} figurine and its base EXACTLY the same — identical sculpt, pose, ` +
          `fur colors, markings and base.${baseRefNote} Change ONLY the camera angle: ` +
          `show it from the SIDE, a full profile view, so the length of the ${animal} is clearly visible. ${STUDIO}`;
      } else if (change === "name") {
        // Mantener figura y base idénticas; grabar el nombre en la placa (antes en blanco).
        const engraved = typeof petName === "string" && petName.trim() ? petName.trim().toUpperCase() : "";
        prompt =
          `This is a full-color 3D printed figurine of a ${animal} on a display base with a blank brushed-gold ` +
          `nameplate. Keep the ${animal} figurine, its pose, its base and the camera angle EXACTLY the same. ` +
          `Change ONLY the nameplate: engrave the name "${engraved}" on it in elegant centered serif lettering, ` +
          `matching the plate's brushed-gold metal. ${STUDIO}`;
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
        `keeping its exact breed, fur colors and markings. The figurine is ${pose.prompt}, ${basePhrase}.${baseRefNote}${shelfNote} ${STUDIO}`;
    }

    const extraRefUrls = change === "name" ? [] : [...baseRefUrls, ...shelfRefUrls];
    const url = await generateFigurine(src, prompt, extraRefUrls);
    return NextResponse.json({ url });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
