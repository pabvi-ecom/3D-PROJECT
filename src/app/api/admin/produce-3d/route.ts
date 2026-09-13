import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getRecord, updateRecord } from "@/lib/airtable";
import { createImageToModelTask, getTask } from "@/lib/tripo";

export const runtime = "nodejs";
export const maxDuration = 280;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * POST /api/admin/produce-3d { table: "Leads" | "OrderItems", id }
 * Botón manual del dashboard — para pedidos ya pagados (normalmente
 * automático vía webhook) o para leads que no llegaron a comprar pero
 * queremos producir igualmente (pedido manual con JLC3DP). Espera aquí
 * mismo a que Tripo termine y devuelve el resultado ya listo.
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
    const figureUrl = record.fields["Figure Image URL"] as string | undefined;
    if (!figureUrl) return NextResponse.json({ error: "No figure image on this record" }, { status: 400 });

    const taskId = await createImageToModelTask(figureUrl);
    await updateRecord(table, id, { "Tripo Task ID": taskId, "Tripo Status": "Processing" });

    const deadline = Date.now() + 260_000;
    while (Date.now() < deadline) {
      const task = await getTask(taskId);
      if (task.status === "success") {
        const modelUrl = task.output?.model_url ?? "";
        await updateRecord(table, id, { "Tripo Status": "Ready", "Model File URL": modelUrl });
        return NextResponse.json({ ok: true, status: "Ready", modelUrl });
      }
      if (task.status === "failed" || task.status === "cancelled") {
        await updateRecord(table, id, { "Tripo Status": "Failed" });
        return NextResponse.json({ error: "Tripo generation failed" }, { status: 500 });
      }
      await sleep(3000);
    }
    return NextResponse.json({ ok: true, status: "Processing", note: "Still generating — check back in a bit" });
  } catch (e) {
    console.error("[/api/admin/produce-3d]", (e as Error).message);
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
