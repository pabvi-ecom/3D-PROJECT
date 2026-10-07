import { NextRequest, NextResponse } from "next/server";
import { updateRecord } from "@/lib/airtable";
import { mergeImgRefs } from "@/lib/produce";

export const runtime = "nodejs";

/**
 * POST /api/lead-figure
 * En cuanto el cliente ve su figura generada (paso "reveal", antes de
 * comprar), guardamos la imagen en el Lead de Airtable — sirve para
 * remarketing y es la fuente que luego alimenta a Tripo (generación 3D).
 */
export async function POST(req: NextRequest) {
  try {
    const { leadId, figureUrl, petName, originalUrl, base, name, accessory } = await req.json();
    if (typeof leadId !== "string" || typeof figureUrl !== "string") {
      return NextResponse.json({ error: "Missing leadId or figureUrl" }, { status: 400 });
    }
    const fields: Record<string, unknown> = { "Figure Image URL": figureUrl };
    if (typeof petName === "string" && petName.trim()) fields["Pet Name"] = petName.trim();
    await updateRecord("Leads", leadId, fields);
    // Guarda foto ORIGINAL + elecciones en "Views" (JSON) sin pisar la 3/4.
    const patch: Record<string, unknown> = {};
    if (typeof originalUrl === "string" && originalUrl.startsWith("http")) patch.original = originalUrl;
    if (typeof base === "boolean") patch.base = base;
    if (typeof name === "boolean") patch.name = name;
    if (typeof accessory === "string") patch.accessory = accessory;
    if (Object.keys(patch).length) {
      await mergeImgRefs("Leads", leadId, patch).catch((e) =>
        console.error("[lead-figure] no se pudo guardar meta:", (e as Error).message),
      );
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[/api/lead-figure]", (e as Error).message);
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
