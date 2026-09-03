import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 30;

function key(): string {
  const k = process.env.KIE_AI_API_KEY;
  if (!k) throw new Error("Falta KIE_AI_API_KEY");
  return k;
}

// Ruta temporal: consulta el estado de una tarea de vídeo por taskId.
export async function GET(req: NextRequest) {
  const taskId = req.nextUrl.searchParams.get("taskId");
  if (!taskId) return NextResponse.json({ error: "falta taskId" }, { status: 400 });
  const res = await fetch(`https://api.kie.ai/api/v1/jobs/recordInfo?taskId=${taskId}`, {
    headers: { Authorization: `Bearer ${key()}` },
  });
  const json = await res.json();
  return NextResponse.json(json);
}
