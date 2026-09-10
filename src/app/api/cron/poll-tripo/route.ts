import { NextResponse } from "next/server";
import { listRecords, updateRecord } from "@/lib/airtable";
import { getTask } from "@/lib/tripo";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Cron (ver vercel.json) — revisa las figuras cuyo modelo 3D está en
 * proceso en Tripo y guarda el resultado cuando termina. Tripo no tiene
 * webhooks, solo polling (GET /v3/tasks/{id}), así que esto hace de puente.
 */
export async function GET() {
  const processing = await listRecords("OrderItems", {
    filterByFormula: `{Tripo Status} = "Processing"`,
  });

  let updated = 0;
  for (const item of processing) {
    const taskId = item.fields["Tripo Task ID"] as string | undefined;
    if (!taskId) continue;
    try {
      const task = await getTask(taskId);
      if (task.status === "success") {
        await updateRecord("OrderItems", item.id, {
          "Tripo Status": "Ready",
          "Model File URL": task.output?.model_url ?? "",
        });
        updated++;
      } else if (task.status === "failed" || task.status === "cancelled") {
        await updateRecord("OrderItems", item.id, { "Tripo Status": "Failed" });
        updated++;
      }
      // "queued" / "running" — se deja igual, se revisa en el próximo cron.
    } catch (e) {
      console.error("[cron/poll-tripo]", item.id, (e as Error).message);
    }
  }

  return NextResponse.json({ checked: processing.length, updated });
}
