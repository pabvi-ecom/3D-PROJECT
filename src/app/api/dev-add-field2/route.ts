import { NextResponse } from "next/server";

// Endpoint temporal — añade a Leads los campos necesarios para poder
// producir el modelo 3D manualmente desde el dashboard. Se borra tras usarlo.
export const runtime = "nodejs";

const FIELDS = [
  { name: "Tripo Status", type: "singleLineText" },
  { name: "Tripo Task ID", type: "singleLineText" },
  { name: "Model File URL", type: "multilineText" },
];

export async function POST() {
  const baseId = process.env.AIRTABLE_BASE_ID;
  const token = process.env.AIRTABLE_TOKEN;
  if (!baseId || !token) return NextResponse.json({ error: "no config" }, { status: 500 });

  const tablesRes = await fetch(`https://api.airtable.com/v0/meta/bases/${baseId}/tables`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const tablesJson = await tablesRes.json();
  const leads = tablesJson.tables?.find((t: { name: string }) => t.name === "Leads");
  if (!leads) return NextResponse.json({ error: "Leads table not found" }, { status: 404 });

  const results = [];
  for (const field of FIELDS) {
    const existing = leads.fields?.find((f: { name: string }) => f.name === field.name);
    if (existing) {
      results.push({ field: field.name, alreadyExisted: true });
      continue;
    }
    const fieldRes = await fetch(`https://api.airtable.com/v0/meta/bases/${baseId}/tables/${leads.id}/fields`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(field),
    });
    const fieldJson = await fieldRes.json();
    results.push({ field: field.name, ok: fieldRes.ok, result: fieldJson });
  }
  return NextResponse.json({ results });
}
