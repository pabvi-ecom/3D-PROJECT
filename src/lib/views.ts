/**
 * Genera vistas adicionales de una figura YA generada para Tripo multiview.
 * Se generan EN CADENA orbitando (front -> left -> back -> right): cada vista
 * edita la ANTERIOR, no el frente suelto. Así el objeto es consistente entre
 * ángulos y los rasgos unilaterales (cola ladeada, oreja caída) no se duplican
 * ni se voltean de un lado a otro.
 */
import { generateFigurine as generateKie } from "@/lib/kie";

const BASE_RULES =
  "This is a studio product photo of ONE single finished, rigid, SMOOTH PAINTED RESIN COLLECTIBLE FIGURINE of a pet " +
  "(a solid sculpted object with smooth clean surfaces and crisp defined forms — NOT a real living animal, NO loose fur, " +
  "no photographic fur noise). It is a fixed solid object that CANNOT change shape, pose, proportions, colors or markings. " +
  "Do NOT re-sculpt, re-pose, recolor or re-imagine it. " +
  "ABSOLUTE RULE: this is the SAME INDIVIDUAL DOG as in the reference image — keep the exact same species (a DOG, NEVER a cat " +
  "or any other animal), the same breed, the same exact fur colors and markings, and the same collar/accessory. Do NOT change " +
  "the animal into a different species or breed under any circumstance. " +
  "Keep the EXACT same pet figurine (same size and vertical position), WITHOUT any display base/pedestal and without any name " +
  "text — just the pet alone, floating cleanly, centered on a pure plain WHITE seamless background with BRIGHT FLAT EVEN " +
  "lighting (well lit, vivid true colors, NOT dark) and NO shadows. " +
  "CRITICAL — COPY THE EXACT MOUTH AND TONGUE STATE FROM THE REFERENCE IMAGE and keep it identical in THIS view: if the mouth " +
  "is CLOSED in the reference, it stays CLOSED here (do NOT add or stick out a tongue); if the tongue is out, it stays out. " +
  "NEVER change the mouth, tongue or facial expression between views — it must match the reference exactly. " +
  "MUZZLE / SNOUT LENGTH: give the dog a PROPER FULL-LENGTH snout, the natural long muzzle this breed and size of dog really " +
  "has. Do NOT shorten, flatten, squash or pug-ify the muzzle; it is NOT a short-faced/brachycephalic dog. If anything the " +
  "snout in the reference looks too short, so render it a touch LONGER — a normal elongated dog muzzle — never shorter. " +
  "CRITICAL: any ASYMMETRIC / one-sided feature (a tail curled to one side, one ear flopped differently, a marking on only " +
  "one side) exists on only ONE physical side — keep it on that SAME side, do NOT duplicate it on both sides or flip it. " +
  "The ONLY change is the camera orbits around the SAME physical object to this new angle: ";

const DESC: Record<"left" | "back" | "right", string> = {
  left: "a true LEFT side profile (camera rotated 90° to the pet's left), showing the full body length from the side.",
  back: "directly BEHIND the figurine (rotated 180° from the front), showing the back of the head, the back and the tail.",
  right: "a true RIGHT side profile (camera rotated 90° to the pet's right), showing the full body length from the side.",
};

export async function generateView(refUrl: string, view: "left" | "back" | "right"): Promise<string> {
  return generateKie(refUrl, BASE_RULES + DESC[view]);
}

/**
 * Quita la base/pedestal y el nombre grabado de la figura, dejando SOLO el
 * perro sobre blanco. Se manda esto a Tripo (perro limpio); la base perfecta y
 * el nombre nitido se añaden luego en Blender. Evita base rugosa + sombra.
 */
export async function stripBase(figureUrl: string): Promise<string> {
  return generateKie(
    figureUrl,
    "This is a photo of a pet figurine on a display base. Remove the display base / pedestal / plinth COMPLETELY, and " +
      "remove any engraved name or nameplate text. Keep ONLY the pet itself, exactly the same pose, body, colors and " +
      "markings, and any worn accessory (bandana, harness, collar) stays. " +
      "Render the pet as a SMOOTH PAINTED RESIN COLLECTIBLE FIGURINE: clean smooth sculpted surfaces, crisp defined forms " +
      "(ears, paws, muzzle well defined), vivid true-to-life colors — NOT a real animal, NO loose/photographic fur, NO " +
      "noise. Keep the mouth and tongue exactly as shown (if the tongue is out, keep it out). " +
      "Show just the pet, nothing under it, floating cleanly on a pure plain WHITE seamless background with BRIGHT FLAT " +
      "EVEN lighting (well lit, vivid colors, NOT dark) and absolutely NO shadow. No base, no ground, no platform, no text.",
  );
}

/**
 * Genera UNA foto del perro de FRENTE y SIN base para mandar a Tripo
 * single-image. Se usa el FRENTE (no 3/4) porque desde un 3/4 Tripo se
 * inventa mal la cara (orejas abiertas, morro corto = "gremlin"). Con el
 * frente correcto la cara sale bien y Tripo reconstruye la espalda solo
 * (como hizo con FRANKIE). Es la imagen que se ve en el dashboard.
 */
export async function generateAngled(figureUrl: string, tail?: string): Promise<string> {
  // La cola la dice el dueño en el formulario (desde el frente no se ve, Tripo
  // la inventaría). Se fuerza que el frente muestre la cola correcta.
  // La cola SIEMPRE pegada al cuerpo (curvada a un lado, apoyada en el
  // flanco/cadera) para que no sobresalga -> no queda fina al aire, no se
  // rompe al imprimir y entra dentro de la base.
  const tailRule =
    tail === "none"
      ? "TAIL: this dog has NO tail (naturally bobbed / docked). Show a clean rounded rear with NO tail at all; do NOT add any tail. "
      : tail === "short"
        ? "TAIL: this dog has a SHORT stubby tail, held CLOSE and TUCKED against the body on one side — not sticking out. "
        : tail === "long"
          ? "TAIL: this dog has a LONG but SLIM tail (normal thickness, NOT thick/bushy/overly fluffy/oversized). It must WRAP FORWARD and curl around to rest beside/in front of the front paws, lying flat along the ground RIGHT NEXT TO the body and paws, fully WITHIN the figure's footprint. It must NOT extend outward, backward or sideways away from the body, must NOT stick out as a free strand, and must NOT reach past the paws — tucked close against the body/paws, touching them. "
          : "";
  return generateKie(
    figureUrl,
    "Show the SAME individual pet from this reference, in a clean FRONT view facing the camera straight-on (the whole face and " +
      "chest clearly visible, sitting upright). " +
      tailRule +
      "Remove any display base / pedestal / plinth and any engraved name or nameplate text COMPLETELY — show ONLY the pet, " +
      "nothing under it. Keep the exact same sitting pose, body, proportions, fur colors and markings. " +
      "DO NOT INVENT ANYTHING: replicate EXACTLY what is in the reference and nothing else. If the pet wears NO collar, NO " +
      "harness, NO bandana, NO tag and NO clothing, then it must have NONE of those here either — do NOT add a collar or any " +
      "accessory that is not clearly, visibly present in the reference. Only keep an accessory if it is actually there. " +
      "ABSOLUTE RULE: same species (a DOG, NEVER a cat or other animal), same breed, same exact colors and markings. " +
      "EARS — CRITICAL: keep the ears in the EXACT same position, angle and shape as the reference. If the ears sit close to " +
      "the head / hang down naturally, keep them close and hanging — do NOT spread them out wide, do NOT flare them sideways, " +
      "do NOT make them stick out like wings. Match the reference ears precisely. " +
      "MUZZLE / SNOUT — CRITICAL: keep a proper FULL-LENGTH long muzzle exactly like the reference — do NOT shorten, flatten, " +
      "squash or pug-ify it. A long snout stays long. Never make a short flat 'gremlin' face. " +
      "COPY the exact mouth and tongue state from the reference (closed stays closed, tongue out stays out). " +
      "Render as a HIGHLY DETAILED hand-sculpted PAINTED COLLECTIBLE FIGURINE / statue: crisp, sharply defined sculpted detail " +
      "— individually sculpted fur strands and coat texture, well defined ears, muzzle, paws, toes and tail, clean sharp edges " +
      "and deep crevices. Maximum surface detail (like a premium resin statue), vivid true-to-life colors and markings. It is a " +
      "solid sculpted object, NOT a live animal and NOT a photo, but keep ALL the fine detail — do NOT blur, smooth away, melt " +
      "or simplify the fur, face or features; sharp and detailed everywhere. " +
      "Float the pet cleanly on a pure plain WHITE seamless background with BRIGHT FLAT EVEN lighting (well lit, vivid colors, " +
      "NOT dark) and absolutely NO shadow. No base, no ground, no platform, no text.",
  );
}

/**
 * Genera las 3 vistas en cadena orbitando desde el frente, para máxima
 * consistencia entre ángulos. Devuelve lo que consiga (null si alguna falla).
 */
export async function generateOrbitViews(frontUrl: string): Promise<{
  left: string | null;
  back: string | null;
  right: string | null;
}> {
  // Cada vista se genera ANCLADA AL FRENTE (el perro real conocido), NO en
  // cadena: encadenar propagaba errores catastroficos (una vista salio gato y
  // contaminaba las siguientes). Partir siempre del frente evita el cambio de
  // especie. En paralelo para ir mas rapido.
  const [left, back, right] = await Promise.all([
    generateView(frontUrl, "left").catch(() => null),
    generateView(frontUrl, "back").catch(() => null),
    generateView(frontUrl, "right").catch(() => null),
  ]);
  return { left, back, right };
}
