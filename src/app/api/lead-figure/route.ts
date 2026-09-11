import { NextRequest, NextResponse } from "next/server";
import { updateRecord } from "@/lib/airtable";

export const runtime = "nodejs";

/**
 * POST /api/lead-figure
 * En cuanto el cliente ve su figura generada (paso "reveal", antes de
 * comprar), guardamos la imagen en el Lead de Airtable — sirve para
 * remarketing y es la fuente que luego alimenta a Tripo (generación 3D).
 */
export async function POST(req: NextRequest) {
  try {
    const { leadId, figureUrl, petName } = await req.json();
    if (typeof leadId !== "string" || typeof figureUrl !== "string") {
      return NextResponse.json({ error: "Missing leadId or figureUrl" }, { status: 400 });
    }
    const fields: Record<string, unknown> = { "Figure Image URL": figureUrl };
    if (typeof petName === "string" && petName.trim()) fields["Pet Name"] = petName.trim();
    await updateRecord("Leads", leadId, fields);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[/api/lead-figure]", (e as Error).message);
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
