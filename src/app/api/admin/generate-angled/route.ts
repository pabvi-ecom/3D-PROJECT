import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getRecord } from "@/lib/airtable";
import { generateAngled } from "@/lib/views";
import { mergeImgRefs, parseImgRefs } from "@/lib/produce";

export const runtime = "nodejs";
export const maxDuration = 300;

async function checkAuth() {
  const store = await cookies();
  const session = store.get("admin_session")?.value;
  return !!session && session === process.env.ADMIN_PASSWORD;
}

/**
 * POST /api/admin/generate-angled { table, id }
 * Genera la foto 3/4 SIN base (cara + espalda + cola) a partir del frente del
 * cliente y la guarda en Airtable ("Angled Image URL"). Es la imagen que ve
 * el admin en el dashboard y la que se manda a Tripo.
 */
export async function POST(req: NextRequest) {
  if (!(await checkAuth())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { table, id } = await req.json();
    if (table !== "Leads" && table !== "OrderItems") {
      return NextResponse.json({ error: "Invalid table" }, { status: 400 });
    }
    const record = await getRecord(table, id);
    const figureUrl = record.fields["Figure Image URL"] as string | undefined;
    if (!figureUrl) return NextResponse.json({ error: "No figure image on this record" }, { status: 400 });

    const tail = parseImgRefs(record.fields["Views"] as string | undefined).tail;
    const angledUrl = await generateAngled(figureUrl, tail);
    await mergeImgRefs(table, id, { angled: angledUrl });
    return NextResponse.json({ ok: true, angledUrl });
  } catch (e) {
    console.error("[/api/admin/generate-angled]", (e as Error).message);
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
