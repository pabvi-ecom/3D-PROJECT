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
  "Studio product photo, soft light, plain seamless light background, photorealistic, centered. " +
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
    const { imageBase64, imageUrl, referenceUrl, change, zone = "dogs", poseId, baseId = NO_BASE_ID, petName, notes, view, styleId, accessoryId } = body;

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
      ? " The LAST reference image is ONLY the empty round marble base — copy its material, color and shape, but the dog is always OUR pet from the FIRST image; never copy any other animal. The pet and base are ONE fused figurine. Center the pet in the DEAD CENTER of the round top — same marble margin behind the rear as in front of the paws, same on both sides; move the whole dog back if it leans forward. Leave the front of the marble rim smooth and blank."
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
          `height of the marble rim, not oversized. It must read as physically CARVED/RECESSED into the ` +
          `stone: crisp engraved grooves with subtle inner shadow, in a soft warm brown/taupe tone slightly ` +
          `darker than the beige marble around it, like a real engraved marble memorial base. The text must be perfectly ` +
          `horizontally centered on the front of the base and follow its curve. ${STUDIO}`;
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
      // El estilo "realistic" no tiene prompt propio: usamos el bloque
      // foto-realista. Para Pixar/Cartoon manda el estilo (style.prompt) y NO
      // se aplica el bloque foto-real (si no, salen realistas/greñudos).
      const isRealistic = !style.prompt;
      const lookIntro = isRealistic
        ? `Create a HYPER-PHOTOREALISTIC studio portrait of the EXACT SAME individual ${animal} shown in the ` +
          `FIRST image — indistinguishable from a real high-end DSLR photograph of that real pet, with real fur ` +
          `texture and natural skin/nose/eye detail. It must look like a real living ${animal}, NOT a plastic toy, ` +
          `NOT a cartoon, NOT a smooth stylized figurine. Keep its REAL fur exactly — including any long, scruffy, ` +
          `fluffy, uneven, messy or shaggy fur. Do NOT groom, smooth, slim, "purebred-ify" or idealize it — it ` +
          `must look like this real, specific ${animal}, not a generic clean one. `
        : `Create a stylized 3D figurine of the EXACT SAME individual ${animal} shown in the FIRST image, rendered ` +
          `fully in the art style described here:${style.prompt} Commit to that style clearly (it must NOT look ` +
          `like a plain realistic photo), while keeping it unmistakably THIS specific pet. `;
      const proportions = isRealistic
        ? `Render it at TRUE natural adult ${animal} proportions — the real leg length, body length, chest depth, ` +
          `head size and snout length of this specific pet. Do NOT make it chubby, squat, short-legged, chibi, ` +
          `big-headed or toy-like. `
        : ``;
      // El morro solo se bloquea en realista. En Pixar/Cartoon el estilo puede
      // reformar proporciones (p. ej. Cartoon = cabezón/morro corto).
      const muzzleClause = isRealistic
        ? `MUZZLE / SNOUT LENGTH: keep the same long-to-short nose ratio as the photo — a long, protruding ` +
          `snout must stay long; do NOT shorten, flatten, pug-ify or "cute-ify" the muzzle (unless the real pet ` +
          `truly has a flat face). `
        : ``;
      const identityClause = isRealistic
        ? `Preserve its EXACT face, head shape, expression, eye shape and spacing, snout, ear shape, and the ` +
          `exact colors and placement of every marking so it is clearly THIS individual pet. `
        : `Keep it clearly recognizable as THIS specific pet — same breed, the exact same fur colors and the ` +
          `same placement of every marking, same ear shape and same eye/face character — but the chosen art ` +
          `style MAY restyle the overall proportions and head size to fit that style (e.g. a big cute head). `;
      prompt =
        lookIntro +
        identityClause +
        `MOUTH & TONGUE — match the photo exactly: if the pet's mouth is OPEN or its TONGUE is sticking ` +
        `out in the photo, the figurine MUST have the same open mouth with the tongue out in the same way; ` +
        `if the mouth is closed, keep it closed. Never close an open mouth, never hide or remove the tongue, ` +
        `and never change the facial expression — copy the exact same look and mood from the photo. ` +
        muzzleClause +
        `If the photo is dark, backlit or the eyes are squinting, reconstruct the pet in clear even studio ` +
        `lighting but keep the same identity and features. ` +
        proportions +
        `Show only the ${animal} itself — exclude any people, hands, other animals, background, and any ` +
        `props, toys, hearts, accessories or held objects that are not part of its body (a plain everyday ` +
        `collar may stay). Show the full body of the ${animal} ${pose.prompt}, ${basePhrase}.` +
        `${baseRefNote}${notesNote}${viewNote} ${STUDIO}`;
    }

    // El grabado del nombre y los accesorios editan una imagen YA compuesta
    // (perro + base) — no necesitan la referencia de base, que además pediría
    // dejar el canto en blanco y borraría el nombre.
    const extraRefUrls = change === "name" || change === "accessory" ? [] : baseRefUrls;
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
    return NextResponse.json({ url });
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
