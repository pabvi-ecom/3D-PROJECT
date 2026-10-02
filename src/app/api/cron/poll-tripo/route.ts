import { NextResponse } from "next/server";
import { listRecords, updateRecord } from "@/lib/airtable";
import { getTask } from "@/lib/hunyuan3d";
import { processModel } from "@/lib/model-store";

export const runtime = "nodejs";
export const maxDuration = 180; // guardar permanente + generar STL tarda un poco

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
        // El nombre ya viene grabado (Tripo lo reconstruye de la imagen).
        // Solo se guarda permanente + se genera el STL para el proveedor.
        const rawUrl = task.output?.model_url ?? "";
        const { modelUrl, stlUrl } = rawUrl ? await processModel(rawUrl) : { modelUrl: rawUrl, stlUrl: null };
        await updateRecord("OrderItems", item.id, {
          "Tripo Status": "Ready",
          "Model File URL": modelUrl,
          "Model STL URL": stlUrl ?? "",
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
