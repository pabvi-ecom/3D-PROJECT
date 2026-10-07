import { NextRequest, NextResponse } from "next/server";
import { generateFigurine as generateKie, uploadImage } from "@/lib/kie";
import { generateFigurine as generateOpenAI } from "@/lib/openai-image";
import { getZone } from "@/config/zones";
import { poses, bases, figureStyles, accessories, NO_BASE_ID } from "@/config/products";

// Proveedor de generación de imágenes.
// Por defecto usamos Kie (google/nano-banana-edit): es un EDITOR real de imagen,
// preserva la identidad del perro entre pasos (sin base -> base -> nombre) y no
// recorta orejas/patas. gpt-image-1 de OpenAI reinventaba la imagen entera cada
// vez (perro distinto + recortes), por eso lo dejamos como opt-in explícito.
// Para volver a OpenAI: env IMAGE_PROVIDER="openai" (cae a Kie si OpenAI falla).
async function generateFigurine(imageUrl: string, prompt: string, extraRefUrls: string[] = []): Promise<string> {
  // NOTA: openai solo si USE_OPENAI_IMAGE="1". La env IMAGE_PROVIDER quedó fijada
  // a "openai" en Vercel y daba malos resultados; usamos este flag nuevo para
  // forzar Kie sin depender de reeditar IMAGE_PROVIDER. Para volver a openai:
  // añadir env USE_OPENAI_IMAGE="1".
  if (process.env.USE_OPENAI_IMAGE === "1") {
    try {
      return await generateOpenAI(imageUrl, prompt, extraRefUrls);
    } catch (e) {
      console.error("[/api/generate] OpenAI falló, fallback a Kie:", (e as Error).message);
      return generateKie(imageUrl, prompt, extraRefUrls);
    }
  }
  return generateKie(imageUrl, prompt, extraRefUrls);
}

export const runtime = "nodejs";
export const maxDuration = 300;

const STUDIO =
  "Studio product shot on a pure plain white seamless background, FLAT EVEN lighting, high quality, sharp, centered. " +
  "NO cast shadow and NO contact shadow under or around the figurine or its base — the background and base stay clean white with zero shadows. " +
  "Frame the FULL body with comfortable empty margin on all four sides — the ENTIRE subject (and its " +
  "base, if any) must be fully inside the frame. NEVER crop or cut off the ears, paws, tail, top of the " +
  "head or any edge. This is a full-body shot, not a close-up or a zoomed-in crop. High resolution, sharp.";
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
 *  - Cambiar el ángulo:    { referenceUrl, change:"view", zone?, baseId? }
 *      Toma una figura (con base) ya generada y muestra el mismo sculpt de PERFIL.
 *  - Grabar el nombre:     { referenceUrl, change:"name", zone?, baseId?, petName }
 *      Toma una figura con base ya generada y graba el nombre en la placa.
 * Devuelve: { url }.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { imageBase64, imageUrl, referenceUrl, change, zone = "dogs", poseId, baseId = NO_BASE_ID, petName, notes, view, styleId, accessoryId, extraImages, tail } = body;
    // Regla de cola (la elige el dueño): SIEMPRE pegada al cuerpo para que no
    // sobresalga de la base ni quede fina al aire (igual que en el 3D).
    const tailRule =
      tail === "none"
        ? ` The ${zone === "dogs" ? "dog" : "pet"} has NO tail (bobbed/docked): show a clean rounded rear, no tail.`
        : tail === "short"
          ? ` The pet has a SHORT stubby tail held CLOSE and tucked against the body on one side, not sticking out.`
          : tail === "long"
            ? ` The pet has a LONG tail, but it must WRAP FORWARD and curl around to rest beside/in front of the front paws, lying flat along the ground RIGHT NEXT TO the body and paws, fully WITHIN the figure's footprint. The tail must NOT extend outward, backward or sideways away from the body, must NOT stick out as a thin free strand, and must NOT reach past the paws — it stays tucked close against the body/paws, touching them along its length.`
            : "";
    let customerExtraRefs: string[] = [];

    const z = getZone(zone);
    const animal = z?.animal ?? "pet";
    const notesNote =
      typeof notes === "string" && notes.trim()
        ? ` The owner also told us this about the ${animal}, which may not be visible in the photo — apply it: "${notes.trim()}".`
        : "";
    const pose = poses.find((p) => p.id === poseId) ?? poses[0];
    const base = bases.find((b) => b.id === baseId) ?? bases[0];
    const basePhrase = base.prompt || NO_BASE;
    const baseRefUrls = base.refImage ? [new URL(base.refImage, req.nextUrl.origin).toString()] : [];
    const baseRefNote = base.refImage
      ? " The LAST reference image is ONLY the empty round marble base — copy its material, color and shape, but the dog is always OUR pet from the FIRST image; never copy any other animal. The pet and base are ONE fused figurine. SIZE: make the round marble top clearly BIGGER than the dog's footprint, with a WIDE even margin of empty marble all around the dog. The paws and rear must rest well INSIDE the rim with a comfortable ring of empty marble between them and the edge — the dog must NEVER touch, reach or overhang the edge of the base on any side. Center the pet in the DEAD CENTER of the round top — same marble margin behind the rear as in front of the paws, same on both sides; move the whole dog back if it leans forward. Leave the front of the marble rim smooth and blank."
      : "";
    let src: string | undefined;
    let prompt: string;

    if (typeof referenceUrl === "string" && referenceUrl) {
      src = referenceUrl;
      if (change === "pose") {
        // Mantener el perro idéntico, cambiar SOLO la postura (sin base, en la estantería).
        // Muy explícito porque el modelo tiende a ignorar el cambio de postura y devolver
        // la misma pose de la imagen de referencia.
        prompt =
          `This is a full-color 3D printed figurine of a ${animal}, currently sculpted in one pose. ` +
          `You MUST re-sculpt its body into a DIFFERENT pose — do not leave the pose unchanged. ` +
          `Keep the ${animal}'s identity EXACTLY the same — same breed, proportions, fur colors and ` +
          `markings — but the body posture has to visibly change to: ${pose.prompt}. ` +
          `For example, if the legs were tucked under the body before, they must now be repositioned ` +
          `to match this new pose exactly. ${STUDIO}`;
      } else if (change === "view") {
        // No es "re-sculpt con la pose recordada" (el modelo reinterpreta y cambia
        // identidad/pose) — es un objeto físico YA TERMINADO y la cámara orbita
        // alrededor. Framing de "foto nueva del mismo objeto físico", no de "dibuja de nuevo".
        prompt =
          `This is a photo of a single physical object: an already-finished, already-painted 3D printed ` +
          `figurine of a ${animal} permanently glued to its display base. Nothing about the object itself is ` +
          `being redrawn, re-sculpted or re-imagined — the sculpt, the pose (${pose.prompt}), the fur colors, ` +
          `the markings and the base are a fixed, rigid, already-cast piece that cannot change shape. The ONLY ` +
          `thing that changes is the camera position: it now walks around to the SIDE of the same object, a ` +
          `full profile view, showing the ${animal}'s full body length. Do NOT add any extra platform, ` +
          `pedestal, turntable or surface underneath the base — the base still sits directly on the same plain ` +
          `studio background as before, nothing new appears beneath it. Take a new studio photo of this same ` +
          `physical object from that new camera position — same object, same pose, same base, different photo ` +
          `angle only.${baseRefNote} ${STUDIO}`;
      } else if (change === "name") {
        // Grabar el nombre DIRECTAMENTE en el mármol de la base (no en placa).
        const engraved = (typeof petName === "string" && petName.trim() ? petName.trim() : "").toUpperCase();
        prompt =
          `This is a full-color 3D printed figurine of a ${animal} on a polished beige marble pedestal base. ` +
          `Keep the ${animal} figurine, its pose, the base and the camera angle EXACTLY the same. ` +
          `Change ONLY the front face of the marble rim: engrave the name "${engraved}" directly into the ` +
          `stone. Render ALL letters in UPPERCASE. Use a clean, OPEN, evenly-spaced sans-serif or humanist ` +
          `capital typeface with generous letter-spacing and letters of uniform height (no letter should ` +
          `rise taller than the others). Give the letters a MEDIUM-BOLD / SEMIBOLD weight with slightly ` +
          `thicker, sturdier strokes (not thin or hairline), keeping the exact same engraved look and texture. ` +
          `Keep the lettering SMALL and understated — roughly one third of the ` +
          `height of the marble rim, not oversized. ` +
          `CRITICAL: each letter must be a SOLID, FULLY FILLED-IN shape of dark pigment — NOT outlined, NOT hollow, ` +
          `NOT just an engraved contour. The grooves are filled with a solid dark brown/espresso pigment so every ` +
          `letter reads as a solid dark letter (like filled debossed lettering), clearly readable against the beige ` +
          `marble. The text must be perfectly horizontally centered on the front of the base and follow its curve. ${STUDIO}`;
      } else if (change === "accessory") {
        // Añadir un accesorio (disfraz/hueso) SOBRE la figura ya generada.
        // La imagen previa (con o sin base) es la verdad: mismo perro, misma
        // base, misma pose — solo se añade el accesorio.
        const acc = accessories.find((a) => a.id === accessoryId) ?? accessories[0];
        prompt =
          `The FIRST image shows a finished ${animal} figurine. That EXACT dog and its base/pose are the ` +
          `ground truth: reproduce them PIXEL-FAITHFULLY — same face, head shape, muzzle, ears, eyes, body ` +
          `proportions, fur texture, colors and markings, same base, same pose. Do NOT re-imagine, re-sculpt, ` +
          `recolor or restyle the dog or the base. If the marble base already has a NAME ENGRAVED on its ` +
          `front rim, you MUST keep that exact engraved name unchanged, same letters, position and carved ` +
          `look — do not remove, blur or alter it. Add ONLY this accessory to the pet:${acc.prompt} ` +
          `Nothing else about the figurine changes. ${STUDIO}`;
      } else {
        // Mantener el perro y la postura idénticos, cambiar SOLO la base.
        // El perro de la PRIMERA imagen es la verdad absoluta: hay que copiarlo
        // fiel (misma cara/morro/orejas/pelo), no reinterpretarlo — si no, "parece
        // otro perro" al cambiar de base.
        prompt =
          `The FIRST image shows a finished ${animal} figurine. That EXACT dog is the ground truth: ` +
          `reproduce it PIXEL-FAITHFULLY — same face, same head shape, same muzzle length, same ear ` +
          `shape and position, same eyes, same body proportions, same fur texture and the exact same ` +
          `colors and markings in the same places. It must be recognizably the SAME individual dog, as ` +
          `if compositing the very same rendered dog onto a new base. Do NOT re-imagine, re-sculpt, ` +
          `restyle, recolor, groom or "improve" the dog in any way, and do NOT change its pose. ` +
          `Change ONLY the display base: the figurine is now ${basePhrase}. ` +
          `The ${animal} must be perfectly centered on top of the base, front-to-back and side-to-side — ` +
          `not offset toward any edge.${baseRefNote} ${STUDIO}`;
      }
    } else {
      src = typeof imageUrl === "string" ? imageUrl : undefined;
      if (!src && typeof imageBase64 === "string") src = await uploadImage(imageBase64);
      if (!src) {
        return NextResponse.json({ error: "Falta la foto (imageBase64/imageUrl) o referenceUrl" }, { status: 400 });
      }
      // Fotos extra OPCIONALES del cliente (otros ángulos) — se suben y se pasan
      // como referencias adicionales para captar mejor al perro.
      if (Array.isArray(extraImages) && extraImages.length) {
        const uploaded = await Promise.all(
          (extraImages as string[])
            .filter((x) => typeof x === "string" && x.startsWith("data:"))
            .slice(0, 2)
            .map((x) => uploadImage(x).catch(() => null)),
        );
        customerExtraRefs = uploaded.filter((u): u is string => !!u);
      }
      const style = figureStyles.find((s) => s.id === styleId) ?? figureStyles[0];
      const viewNote =
        view === "side"
          ? ` Show the figurine from the SIDE — a full profile view, camera rotated 90° so the ${animal}'s ` +
            `full body length is clearly visible (not facing the camera). The base rotates together with ` +
            `the ${animal} as ONE rigid object — the nameplate is physically fixed to the base's front edge, ` +
            `so from this side angle the nameplate must ALSO be seen edge-on / foreshortened, mostly hidden, ` +
            `with only a thin sliver of it facing toward the camera — it must NOT still be facing the ` +
            `viewer flat-on like in a front view.`
          : "";
      // Prompt CORTO y directo. Se PASA la foto del perro como referencia
      // (edición imagen-a-imagen) — es lo que preserva la identidad; generar
      // solo desde texto daba animales aleatorios (salió hasta un conejo).
      // La foto de cada cliente ya va a una URL única (fix de nombres), así
      // que no se mezclan referencias entre sesiones.
      // Núcleo común (identidad + postura + boca/lengua + encuadre) y encima el
      // prompt COMPLETO del estilo elegido (autónomo en products.ts). El medio
      // (foto real, animado, vinilo) lo define cada estilo, NO el núcleo.
      prompt =
        `Create a studio image of the EXACT SAME individual ${animal} shown in the FIRST image. ` +
        `It must be unmistakably THIS specific pet: keep the same breed, the exact same fur colors and the ` +
        `exact placement of every marking, and the same ear shape. ` +
        (customerExtraRefs.length
          ? `The additional reference images show the SAME pet from other angles — use ALL of them together to get its true body shape, markings and proportions right. `
          : "") +
        `\n\nPOSE (very important): the ${animal} MUST be SITTING upright on its hindquarters, facing the ` +
        `camera straight-on in a clean FRONT view, with its body and head facing forward. Even if the photo ` +
        `shows it standing, lying down or at an angle, RE-POSE it into this sitting, front-facing pose. ` +
        `Capture maximum detail of the head and face so the expression reads clearly. ` +
        `\n\nSTYLE — ${style.label}: ${style.prompt} ` +
        `\n\nMOUTH & TONGUE — match the photo exactly: if the pet's mouth is OPEN or its TONGUE is sticking ` +
        `out in the photo, the figurine MUST have the same open mouth with the tongue out in the same way; ` +
        `if the mouth is closed, keep it closed. Never close an open mouth, never hide or remove the tongue, ` +
        `and never change the facial expression — copy the exact same look and mood from the photo. ` +
        `If the photo is dark, backlit or the eyes are squinting, reconstruct the pet in clear even studio ` +
        `lighting but keep the same identity and features. ` +
        `\n\nShow only the ${animal} itself — exclude any people, hands, other animals, background, and any ` +
        `props, toys, hearts, accessories or held objects that are not part of its body. ` +
        `DO NOT INVENT accessories: if the pet in the photo wears NO collar, NO harness, NO bandana and NO tag, ` +
        `then add NONE — never add a collar or anything the pet is not actually wearing. Only keep an accessory if it is ` +
        `clearly visible in the photo. Show the full body of the ${animal} ${pose.prompt}, ${basePhrase}.` +
        `${tailRule}${baseRefNote}${notesNote}${viewNote} ${STUDIO}`;
    }

    // El grabado del nombre y los accesorios editan una imagen YA compuesta
    // (perro + base) — no necesitan la referencia de base, que además pediría
    // dejar el canto en blanco y borraría el nombre.
    const extraRefUrls = change === "name" || change === "accessory" ? [] : [...baseRefUrls, ...customerExtraRefs];
    // El filtro de seguridad de Gemini a veces marca una imagen como
    // "sensible" en un falso positivo (foto normal, nada raro) — un segundo
    // intento con el mismo input suele pasar sin problema, así que
    // reintentamos una vez antes de rendirnos.
    let url: string;
    try {
      url = await generateFigurine(src, prompt, extraRefUrls);
    } catch (e) {
      if ((e as Error).message.includes("flagged as sensitive")) {
        url = await generateFigurine(src, prompt, extraRefUrls);
      } else {
        throw e;
      }
    }
    // `src` es la foto ORIGINAL del cliente (URL subida) — se devuelve para
    // guardarla y poder verificar el parecido en el dashboard.
    const originalUrl = typeof src === "string" && src.startsWith("http") ? src : undefined;
    return NextResponse.json({ url, originalUrl });
  } catch (e) {
    // Log técnico para depurar en Vercel; al cliente solo un mensaje corto y amable.
    const msg = (e as Error).message;
    console.error("[/api/generate]", msg);
    const friendly = msg.startsWith("KIE_TIMEOUT")
      ? "This is taking longer than usual. Please try again in a moment."
      : msg.includes("flagged as sensitive")
        ? "Our AI safety filter had trouble with this photo. Try a different one, or the same one again."
        : "We couldn't quite see your pet clearly. Try a photo with more detail or better lighting.";
    return NextResponse.json({ error: friendly }, { status: 500 });
  }
}
