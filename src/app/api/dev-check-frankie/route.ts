import { NextResponse } from "next/server";
import { listRecords, updateRecord } from "@/lib/airtable";

export async function POST() {
  const leads = await listRecords("Leads", { filterByFormula: `{Pet Name} = "Frankie"` });
  const lead = leads[0];
  if (!lead) return NextResponse.json({ error: "not found" }, { status: 404 });
  const taskId = lead.fields["Tripo Task ID"] as string;
  const res = await fetch(`https://openapi.tripo3d.ai/v3/tasks/${taskId}`, {
    headers: { Authorization: `Bearer ${process.env.TRIPO_API_KEY}` },
  });
  const json = await res.json();
  const modelUrl = json.data?.output?.model_url;
  if (!modelUrl) return NextResponse.json({ error: "no model url", raw: json }, { status: 500 });
  await updateRecord("Leads", lead.id, { "Tripo Status": "Ready", "Model File URL": modelUrl });
  return NextResponse.json({ ok: true, modelUrl });
}

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
