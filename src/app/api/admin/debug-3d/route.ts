import { NextResponse } from "next/server";
import { listRecords } from "@/lib/airtable";
import { getTask } from "@/lib/fal";

export const runtime = "nodejs";

// GET /api/admin/debug-3d  (temporal, sin auth) -> estado real en fal de lo que
// esta en "Processing".
export async function GET() {
  const out: unknown[] = [];
  for (const table of ["Leads", "OrderItems"] as const) {
    const rows = await listRecords(table, { filterByFormula: `{Tripo Status} = "Processing"` });
    for (const r of rows) {
      const taskId = r.fields["Tripo Task ID"] as string | undefined;
      let fal: unknown = "no taskId";
      if (taskId) {
        try { fal = await getTask(taskId); } catch (e) { fal = `ERR: ${(e as Error).message}`; }
      }
      out.push({ table, pet: r.fields["Pet Name"], taskId, fal });
    }
  }
  return NextResponse.json(out);
}
