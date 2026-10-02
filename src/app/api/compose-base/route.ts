import { NextRequest, NextResponse } from "next/server";
import { composeDisplay } from "@/lib/compose";
import { uploadImage } from "@/lib/kie";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * POST /api/compose-base { figureUrl (perro SIN base), petName? }
 * Devuelve { url } de la imagen compuesta (perro + base + nombre).
 */
export async function POST(req: NextRequest) {
  try {
    const { figureUrl, petName } = await req.json();
    if (!figureUrl) return NextResponse.json({ error: "Falta figureUrl" }, { status: 400 });
    const res = await fetch(figureUrl);
    if (!res.ok) return NextResponse.json({ error: "No se pudo leer la figura" }, { status: 400 });
    const dogBuf = Buffer.from(await res.arrayBuffer());
    const out = await composeDisplay(dogBuf, { petName });
    const dataUri = `data:image/png;base64,${out.toString("base64")}`;
    const url = await uploadImage(dataUri, "composed.png");
    return NextResponse.json({ url });
  } catch (e) {
    console.error("[/api/compose-base]", (e as Error).message);
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
