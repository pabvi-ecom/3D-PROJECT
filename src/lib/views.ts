/**
 * Genera vistas adicionales de una figura YA generada para Tripo multiview.
 * Se generan EN CADENA orbitando (front -> left -> back -> right): cada vista
 * edita la ANTERIOR, no el frente suelto. Así el objeto es consistente entre
 * ángulos y los rasgos unilaterales (cola ladeada, oreja caída) no se duplican
 * ni se voltean de un lado a otro.
 */
import { generateFigurine as generateKie } from "@/lib/kie";

const BASE_RULES =
  "This is a studio product photo of ONE single finished, rigid physical figurine (a pet sculpture). " +
  "It is a fixed solid object that CANNOT change shape, pose, proportions, colors or markings. Do NOT re-sculpt, re-pose, recolor or re-imagine it. " +
  "Keep the EXACT same figurine, same size and vertical position, centered on a pure plain WHITE seamless background with FLAT EVEN lighting and NO shadows. " +
  "CRITICAL: any ASYMMETRIC / one-sided feature of the real pet (a tail curled to one side, one ear flopped differently, a marking on only one side) exists on only ONE physical side — keep it on that SAME side and do NOT duplicate it on both sides or flip it between views. " +
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
