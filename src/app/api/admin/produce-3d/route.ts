import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getRecord, updateRecord } from "@/lib/airtable";
import { createImageToModelTask } from "@/lib/tripo";

export const runtime = "nodejs";
export const maxDuration = 60;

async function checkAuth() {
  const store = await cookies();
  const session = store.get("admin_session")?.value;
  return !!session && session === process.env.ADMIN_PASSWORD;
}

/**
 * POST /api/admin/produce-3d { table: "Leads" | "OrderItems", id }
 * Solo LANZA la tarea en Tripo y devuelve enseguida — no espera a que
 * termine aquí mismo. Con calidad "extreme" la generación puede tardar más
 * de lo que aguanta una función serverless (~5-6 min), así que esperar en
 * una única petición larga es frágil (el resultado se pierde si la función
 * muere antes de escribirlo). El dashboard comprueba el progreso llamando
 * a /api/admin/check-3d cada pocos segundos.
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

    const taskId = await createImageToModelTask(figureUrl);
    await updateRecord(table, id, { "Tripo Task ID": taskId, "Tripo Status": "Processing", "Model File URL": "" });

    return NextResponse.json({ ok: true, taskId });
  } catch (e) {
    console.error("[/api/admin/produce-3d]", (e as Error).message);
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
