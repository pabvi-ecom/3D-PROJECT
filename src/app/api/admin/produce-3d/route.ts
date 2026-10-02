import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getRecord, updateRecord } from "@/lib/airtable";
import { createImageToModelTask, createMultiviewToModelTask } from "@/lib/hunyuan3d";
import { generateOrbitViews, stripBase } from "@/lib/views";

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
    const { table, id, views } = await req.json();
    if (table !== "Leads" && table !== "OrderItems") {
      return NextResponse.json({ error: "Invalid table" }, { status: 400 });
    }

    const record = await getRecord(table, id);
    const figureUrl = record.fields["Figure Image URL"] as string | undefined;
    if (!figureUrl) return NextResponse.json({ error: "No figure image on this record" }, { status: 400 });

    // Si el dashboard ya mandó las vistas revisadas, se usan tal cual. Si no,
    // se generan aquí (izq/atrás/der) desde el frente para dar a Tripo 4
    // ángulos — así NO se inventa la espalda. Si fallan todas, cae a 1 imagen.
    // El frente que va a Tripo es el perro SIN base (base + nombre se añaden
    // luego en Blender). Si el dashboard ya mandó las vistas revisadas, se usan.
    let front = figureUrl, left: string | undefined, back: string | undefined, right: string | undefined;
    if (views && (views.left || views.back || views.right)) {
      front = views.front ?? figureUrl;
      left = views.left ?? undefined; back = views.back ?? undefined; right = views.right ?? undefined;
    } else {
      front = await stripBase(figureUrl).catch(() => figureUrl);
      const v = await generateOrbitViews(front);
      left = v.left ?? undefined; back = v.back ?? undefined; right = v.right ?? undefined;
    }

    const haveViews = left || back || right;
    const taskId = haveViews
      ? await createMultiviewToModelTask({ front, left, back, right })
      : await createImageToModelTask(front);

    await updateRecord(table, id, { "Tripo Task ID": taskId, "Tripo Status": "Processing", "Model File URL": "" });

    return NextResponse.json({ ok: true, taskId, mode: haveViews ? "multiview" : "single" });
  } catch (e) {
    console.error("[/api/admin/produce-3d]", (e as Error).message);
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
