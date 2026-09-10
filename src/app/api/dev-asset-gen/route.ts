import { NextRequest, NextResponse } from "next/server";
import { runTask, uploadImage } from "@/lib/kie";

// Endpoint temporal, solo para generar assets de diseño puntuales (logos/
// textos con estilo custom). Se borra después de usarlo.
export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(req: NextRequest) {
  const { refDataUri, prompt } = await req.json();
  const refUrl = await uploadImage(refDataUri, "ref.png");
  const urls = await runTask("google/nano-banana-edit", {
    prompt,
    image_urls: [refUrl],
    output_format: "png",
    image_size: "1:1",
  });
  return NextResponse.json({ url: urls[0] });
}
