import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { generateView } from "@/lib/views";

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
    const [left, back, right] = await Promise.all([
      generateView(figureUrl, "left").catch(() => null),
      generateView(figureUrl, "back").catch(() => null),
      generateView(figureUrl, "right").catch(() => null),
    ]);
    return NextResponse.json({ ok: true, left, back, right });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
