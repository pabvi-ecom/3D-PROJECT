import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getRecord, updateRecord } from "@/lib/airtable";
import { getTask } from "@/lib/tripo";
import { addNameplate } from "@/lib/blender";

export const runtime = "nodejs";
export const maxDuration = 280; // el paso de Blender (nombre en la placa) puede tardar

/**
 * POST /api/admin/check-3d { table, id }
 * Comprobación rápida (una sola llamada a Tripo, sin esperar) — el
 * dashboard la llama cada pocos segundos mientras el estado sea
 * "Processing". En cuanto Tripo diga "success", guarda el resultado.
 */
export async function POST(req: NextRequest) {
  const store = await cookies();
  const session = store.get("admin_session")?.value;
  if (!session || session !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { table, id } = await req.json();
    if (table !== "Leads" && table !== "OrderItems") {
      return NextResponse.json({ error: "Invalid table" }, { status: 400 });
    }

    const record = await getRecord(table, id);
    const taskId = record.fields["Tripo Task ID"] as string | undefined;
    if (!taskId) return NextResponse.json({ error: "No task in progress" }, { status: 400 });

    // El dashboard sondea cada 5s — si el paso de Blender tarda más que
    // eso, evita relanzarlo por cada tick mientras sigue en curso.
    if (record.fields["Tripo Status"] === "Finishing") {
      return NextResponse.json({ status: "Processing" });
    }

    const task = await getTask(taskId);
    if (task.status === "success") {
      const rawUrl = task.output?.model_url ?? "";
      const petName = (record.fields["Pet Name"] as string) ?? "";
      await updateRecord(table, id, { "Tripo Status": "Finishing" });
      const { modelUrl, stlUrl } = rawUrl ? await addNameplate(rawUrl, petName) : { modelUrl: rawUrl, stlUrl: null };
      await updateRecord(table, id, { "Tripo Status": "Ready", "Model File URL": modelUrl, "Model STL URL": stlUrl ?? "" });
      return NextResponse.json({ status: "Ready", modelUrl, stlUrl });
    }
    if (task.status === "failed" || task.status === "cancelled") {
      await updateRecord(table, id, { "Tripo Status": "Failed" });
      return NextResponse.json({ status: "Failed" });
    }
    return NextResponse.json({ status: "Processing", progress: task.progress ?? 0 });
  } catch (e) {
    console.error("[/api/admin/check-3d]", (e as Error).message);
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
