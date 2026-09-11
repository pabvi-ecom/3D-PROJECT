import { NextRequest, NextResponse } from "next/server";
import { createRecord } from "@/lib/airtable";

export const runtime = "nodejs";

/**
 * POST /api/lead
 * Guarda el email que deja el usuario al empezar el formulario, en Airtable
 * (tabla Leads) — para remarketing de los que no llegan a comprar.
 */
export async function POST(req: NextRequest) {
  try {
    const { email, zone, petName } = await req.json();
    if (typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }
    const id = await createRecord("Leads", {
      Email: email,
      Zone: typeof zone === "string" ? zone : "",
      "Pet Name": typeof petName === "string" ? petName : "",
    });
    return NextResponse.json({ ok: true, id });
  } catch (e) {
    console.error("[/api/lead]", (e as Error).message);
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
