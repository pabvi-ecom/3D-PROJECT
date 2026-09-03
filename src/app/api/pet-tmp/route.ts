import { NextResponse } from "next/server";
import { generateFigurine } from "@/lib/kie";

export const runtime = "nodejs";
export const maxDuration = 60;

// Ruta temporal de un solo uso: genera las variantes de mirada (arriba/abajo/
// izquierda/derecha) del golden a partir de la foto original en /pet/source.png.
// Se borra en cuanto se generan las imágenes.
export async function GET(req: Request) {
  const origin = new URL(req.url).origin;
  const src = new URL("/pet/source.png", origin).toString();

  const base =
    "This is a real photo of a golden retriever, head and shoulders, mouth open with tongue out, " +
    "facing the camera, on a solid warm mustard-orange background. Keep the EXACT same dog — identical " +
    "face, fur pattern, ears, open mouth and tongue, lighting and background color — completely unchanged. " +
    "Change ONLY where the head is turned and where the eyes are looking: ";

  const dirs: Record<string, string> = {
    up: "the head is tilted slightly up and the eyes look upward, as if watching something above.",
    down: "the head is tilted slightly down and the eyes look downward, as if watching something below.",
    left: "the head is turned slightly to its left and the eyes look to that side.",
    right: "the head is turned slightly to its right and the eyes look to that side.",
  };

  const entries = await Promise.all(
    Object.entries(dirs).map(async ([k, note]) => {
      const url = await generateFigurine(src, base + note);
      return [k, url] as const;
    }),
  );

  return NextResponse.json(Object.fromEntries(entries));
}
