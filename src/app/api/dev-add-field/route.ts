import { NextResponse } from "next/server";

// Endpoint temporal, solo para crear el campo "Figure Image URL" en Leads.
// Se borra en cuanto se ha usado.
export const runtime = "nodejs";

export async function POST() {
  const baseId = process.env.AIRTABLE_BASE_ID;
  const token = process.env.AIRTABLE_TOKEN;
  if (!baseId || !token) return NextResponse.json({ error: "no config" }, { status: 500 });

  const tablesRes = await fetch(`https://api.airtable.com/v0/meta/bases/${baseId}/tables`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const tablesJson = await tablesRes.json();
  const leads = tablesJson.tables?.find((t: { name: string }) => t.name === "Leads");
  if (!leads) return NextResponse.json({ error: "Leads table not found", tables: tablesJson.tables?.map((t: { name: string }) => t.name) }, { status: 404 });

  const existing = leads.fields?.find((f: { name: string }) => f.name === "Figure Image URL");
  if (existing) return NextResponse.json({ ok: true, alreadyExisted: true });

  const fieldRes = await fetch(`https://api.airtable.com/v0/meta/bases/${baseId}/tables/${leads.id}/fields`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ name: "Figure Image URL", type: "multilineText" }),
  });
  const fieldJson = await fieldRes.json();
  if (!fieldRes.ok) return NextResponse.json({ error: fieldJson }, { status: fieldRes.status });
  return NextResponse.json({ ok: true, field: fieldJson });
}
