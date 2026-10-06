import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getRecord, updateRecord } from "@/lib/airtable";
import { createImageToModelTask } from "@/lib/tripo";
import { generateAngled } from "@/lib/views";

export const runtime = "nodejs";
// Genera 3 vistas extra (nano-banana, ~100s c/u en paralelo) antes de lanzar
// Tripo multiview — necesita bastante más que 60s.
export const maxDuration = 300;

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

    // A Tripo se le manda la foto 3/4 SIN base (cara + espalda + cola). La base
    // y el nombre se montan luego en Blender (plantilla fija). Si aun no existe
    // la ladeada, se genera aqui y se guarda.
    let angledUrl = record.fields["Angled Image URL"] as string | undefined;
    if (!angledUrl) {
      angledUrl = await generateAngled(figureUrl);
      await updateRecord(table, id, { "Angled Image URL": angledUrl });
    }

    // Tripo single-image, maxima calidad (P2 Ultra, textura 8K, extreme).
    const taskId = await createImageToModelTask(angledUrl);

    await updateRecord(table, id, { "Tripo Task ID": taskId, "Tripo Status": "Processing", "Model File URL": "" });

    return NextResponse.json({ ok: true, taskId, mode: "tripo-single-maxq" });
  } catch (e) {
    console.error("[/api/admin/produce-3d]", (e as Error).message);
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
