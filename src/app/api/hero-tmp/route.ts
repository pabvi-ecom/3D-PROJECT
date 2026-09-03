import { NextResponse } from "next/server";
import { generateFigurine } from "@/lib/kie";

export const runtime = "nodejs";
export const maxDuration = 60;

// Ruta temporal de un solo uso para generar el par before/after del hero animado.
// Se borra en cuanto se genera la imagen.
export async function GET(req: Request) {
  const origin = new URL(req.url).origin;
  const figureUrl = new URL("/examples/golden-white.jpg", origin).toString();
  const prompt =
    "This is a photo of a small full-color 3D printed collectible figurine of a golden retriever puppy " +
    "wearing a red bandana with white paw prints, sitting, on a plain white background. Convert it into a " +
    "realistic photograph of the exact same REAL LIVE golden retriever puppy — same fur color, same red " +
    "paw-print bandana, same sitting pose, looking at the camera — as if a phone photo taken indoors with " +
    "soft natural light. It must look like a real dog, not a figurine: real fur texture, real wet nose, " +
    "real eyes with catchlights, no glossy resin sheen. Square photo, centered, plain softly blurred neutral background.";
  const url = await generateFigurine(figureUrl, prompt);
  return NextResponse.json({ url });
}

