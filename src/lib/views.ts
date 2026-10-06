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
  "Keep the EXACT same figurine, same size and vertical position, centered on a pure plain WHITE seamless background with " +
  "BRIGHT FLAT EVEN lighting (well lit, vivid true colors, NOT dark) and NO shadows. " +
  "CRITICAL — keep the MOUTH and TONGUE EXACTLY the same as the figurine in EVERY view: if the tongue is sticking out, it " +
  "stays sticking out at this angle too; if the mouth is open it stays open; NEVER close an open mouth, hide a tongue or " +
  "change the facial expression between views. " +
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
 * Genera las 3 vistas en cadena orbitando desde el frente, para máxima
 * consistencia entre ángulos. Devuelve lo que consiga (null si alguna falla).
 */
export async function generateOrbitViews(frontUrl: string): Promise<{
  left: string | null;
  back: string | null;
  right: string | null;
}> {
  const left = await generateView(frontUrl, "left").catch(() => null);
  const back = await generateView(left ?? frontUrl, "back").catch(() => null);
  const right = await generateView(back ?? frontUrl, "right").catch(() => null);
  return { left, back, right };
}
