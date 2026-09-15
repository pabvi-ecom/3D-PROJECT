import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
const BASE = "https://openapi.tripo3d.ai/v3";
const SRC = "https://tempfile.aiquickdraw.com/as/ebacdd957d4456ba194917b602600231_1789385876540.png";

function headers() {
  return { Authorization: `Bearer ${process.env.TRIPO_API_KEY}`, "Content-Type": "application/json" };
}

// POST = lanza con el modelo pedido, devuelve task_id. GET?task=... = estado.
export async function POST(req: NextRequest) {
  const { model } = await req.json();
  const res = await fetch(`${BASE}/generation/image-to-model`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({
      file: { type: "png", url: SRC },
      model,
      face_limit: 50000,
      texture: true,
      pbr: true,
      texture_quality: "extreme",
    }),
  });
  return NextResponse.json(await res.json());
}

export async function GET(req: NextRequest) {
  const task = req.nextUrl.searchParams.get("task");
  const res = await fetch(`${BASE}/tasks/${task}`, { headers: headers() });
  const json = await res.json();
  return NextResponse.json({
    status: json.data?.status,
    progress: json.data?.progress,
    model_url: json.data?.output?.model_url,
    credits: json.data?.credits_consumed,
  });
}
