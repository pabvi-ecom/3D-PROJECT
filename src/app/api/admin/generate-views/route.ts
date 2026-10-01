import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { generateOrbitViews, stripBase } from "@/lib/views";

export const runtime = "nodejs";
export const maxDuration = 300;

async function checkAuth() {
  const store = await cookies();
  const session = store.get("admin_session")?.value;
  return !!session && session === process.env.ADMIN_PASSWORD;
}

/**
 * POST /api/admin/generate-views { figureUrl }
 * Genera las 3 vistas extra (izq/atrás/der) para REVISARLAS en el dashboard
 * antes de mandarlas a Tripo. No persiste nada; devuelve las URLs.
 */
export async function POST(req: NextRequest) {
  if (!(await checkAuth())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { figureUrl } = await req.json();
    if (!figureUrl) return NextResponse.json({ error: "Falta figureUrl" }, { status: 400 });
    // Quita la base -> perro limpio. Las vistas (y Tripo) usan ESE frente.
    const front = await stripBase(figureUrl).catch(() => figureUrl);
    const { left, back, right } = await generateOrbitViews(front);
    return NextResponse.json({ ok: true, front, left, back, right });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
