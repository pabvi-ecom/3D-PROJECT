import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * POST /api/lead
 * Guarda el email que deja el usuario al empezar el formulario.
 * TODO: aún no hay almacenamiento real conectado (DB / herramienta de email).
 * De momento solo se registra en logs de Vercel — conectar una tabla/servicio
 * antes de lanzar campañas reales.
 */
export async function POST(req: NextRequest) {
  try {
    const { email, zone } = await req.json();
    if (typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }
    console.log(`[lead] ${email} (${zone ?? "unknown zone"})`);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
