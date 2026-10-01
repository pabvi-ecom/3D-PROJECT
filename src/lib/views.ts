/**
 * Genera vistas adicionales (izquierda, atrás, derecha) de una figura YA
 * generada, para alimentar a Tripo multiview_to_model. Se trata la figura como
 * un OBJETO físico rígido y la cámara "orbita" — nano-banana edita la imagen
 * previa, así que mantiene bastante la identidad entre vistas.
 */
import { generateFigurine as generateKie } from "@/lib/kie";

const BASE_RULES =
  "This is a studio product photo of ONE single finished, already-painted, rigid physical figurine (a pet sculpture on its base). " +
  "It is a fixed solid object that CANNOT change shape, pose, proportions, colors, markings or base. Do NOT re-sculpt, re-pose, recolor or re-imagine it. " +
  "Keep the EXACT same figurine, same size and same vertical position, perfectly centered on a plain seamless light studio background. " +
  "The ONLY thing that changes is the camera orbits around the SAME physical object to show it from a new angle: ";

const VIEWS: Record<"left" | "back" | "right", string> = {
  left:
    BASE_RULES +
    "its LEFT side — a true left side profile, camera rotated 90 degrees to the pet's left, showing the full length of its body from the side.",
  back:
    BASE_RULES +
    "its BACK — camera directly behind the figurine (rotated 180 degrees), showing the back of the head, back, tail and the rear of the base.",
  right:
    BASE_RULES +
    "its RIGHT side — a true right side profile, camera rotated 90 degrees to the pet's right, showing the full length of its body from the side.",
};

export async function generateView(frontUrl: string, view: "left" | "back" | "right"): Promise<string> {
  return generateKie(frontUrl, VIEWS[view]);
}
