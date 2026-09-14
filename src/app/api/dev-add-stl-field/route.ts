import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST() {
  const baseId = process.env.AIRTABLE_BASE_ID;
  const token = process.env.AIRTABLE_TOKEN;
  if (!baseId || !token) return NextResponse.json({ error: "no config" }, { status: 500 });

  const tablesRes = await fetch(`https://api.airtable.com/v0/meta/bases/${baseId}/tables`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const tablesJson = await tablesRes.json();
  const results = [];
  for (const tableName of ["Leads", "OrderItems"]) {
    const table = tablesJson.tables?.find((t: { name: string }) => t.name === tableName);
    if (!table) {
      results.push({ table: tableName, error: "not found" });
      continue;
    }
    const existing = table.fields?.find((f: { name: string }) => f.name === "Model STL URL");
    if (existing) {
      results.push({ table: tableName, alreadyExisted: true });
      continue;
    }
    const fieldRes = await fetch(`https://api.airtable.com/v0/meta/bases/${baseId}/tables/${table.id}/fields`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Model STL URL", type: "multilineText" }),
    });
    const fieldJson = await fieldRes.json();
    results.push({ table: tableName, ok: fieldRes.ok, result: fieldJson });
  }
  return NextResponse.json({ results });
}
