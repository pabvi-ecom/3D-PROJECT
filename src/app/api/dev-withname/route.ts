import { NextRequest, NextResponse } from "next/server";
import { generateFigurine } from "@/lib/kie";
export const runtime = "nodejs";
export const maxDuration = 280;
const BASE = "https://openapi.tripo3d.ai/v3";
function h() { return { Authorization: `Bearer ${process.env.TRIPO_API_KEY}`, "Content-Type": "application/json" }; }

// POST { plainUrl, name } -> genera imagen con nombre grabado, lanza P2+8K, devuelve taskId+withNameUrl
export async function POST(req: NextRequest) {
  const { plainUrl, name } = await req.json();
  // Graba el nombre en la placa (mismo prompt que usa el flujo del cliente)
  const engraved = (name as string).toUpperCase();
  const prompt =
    `This is a full-color 3D printed figurine of a dog on a display base with a blank brushed-gold ` +
    `nameplate. Keep the dog figurine, its pose, its base and the camera angle EXACTLY the same. ` +
    `Change ONLY the nameplate: engrave the name "${engraved}" into it as clean, crisp, legible ` +
    `recessed lettering in an elegant serif font, dark oxidized bronze tone, perfectly centered ` +
    `on the plate. Studio product photo, soft light, plain seamless light background, photorealistic.`;
  const withNameUrl = await generateFigurine(plainUrl, prompt, []);

  const r = await fetch(`${BASE}/generation/image-to-model`, { method: "POST", headers: h(),
    body: JSON.stringify({ file: { type: "png", url: withNameUrl }, model: "P2-20260801",
      face_limit: 50000, texture: true, pbr: true, texture_quality: "extreme", texture_size: 8192 }) });
  const j = await r.json();
  return NextResponse.json({ withNameUrl, task: j.data?.task_id ?? j });
}
export async function GET(req: NextRequest) {
  const t = req.nextUrl.searchParams.get("task");
  const r = await fetch(`${BASE}/tasks/${t}`, { headers: h() });
  const j = await r.json();
  return NextResponse.json({ status: j.data?.status, progress: j.data?.progress, model_url: j.data?.output?.model_url, credits: j.data?.credits_consumed });
}
