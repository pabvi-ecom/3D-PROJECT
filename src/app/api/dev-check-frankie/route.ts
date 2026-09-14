import { NextResponse } from "next/server";
import { listRecords } from "@/lib/airtable";

export const runtime = "nodejs";

export async function GET() {
  const leads = await listRecords("Leads", { filterByFormula: `{Pet Name} = "Frankie"` });
  const results = [];
  for (const l of leads) {
    const taskId = l.fields["Tripo Task ID"] as string | undefined;
    let task = null;
    if (taskId) {
      const res = await fetch(`https://openapi.tripo3d.ai/v3/tasks/${taskId}`, {
        headers: { Authorization: `Bearer ${process.env.TRIPO_API_KEY}` },
      });
      task = await res.json().catch(() => ({ raw: "not json" }));
    }
    results.push({ id: l.id, fields: l.fields, task });
  }
  return NextResponse.json(results);
}
