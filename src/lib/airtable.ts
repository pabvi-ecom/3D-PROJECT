const API = "https://api.airtable.com/v0";

function base() {
  const baseId = process.env.AIRTABLE_BASE_ID;
  const token = process.env.AIRTABLE_TOKEN;
  if (!baseId || !token) throw new Error("Airtable no configurado (AIRTABLE_BASE_ID / AIRTABLE_TOKEN)");
  return { baseId, token };
}

async function airtableFetch(path: string, init?: RequestInit) {
  const { baseId, token } = base();
  const res = await fetch(`${API}/${baseId}/${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", ...init?.headers },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Airtable ${res.status}: ${body}`);
  }
  return res.json();
}

export async function createRecord(table: string, fields: Record<string, unknown>): Promise<string> {
  const json = await airtableFetch(table, { method: "POST", body: JSON.stringify({ fields }) });
  return json.id as string;
}

export async function createRecords(table: string, records: { fields: Record<string, unknown> }[]): Promise<string[]> {
  const json = await airtableFetch(table, { method: "POST", body: JSON.stringify({ records }) });
  return (json.records as { id: string }[]).map((r) => r.id);
}

export async function updateRecord(table: string, id: string, fields: Record<string, unknown>): Promise<void> {
  await airtableFetch(`${table}/${id}`, { method: "PATCH", body: JSON.stringify({ fields }) });
}

export async function deleteRecord(table: string, id: string): Promise<void> {
  await airtableFetch(`${table}/${id}`, { method: "DELETE" });
}

export async function getRecord(table: string, id: string): Promise<{ id: string; fields: Record<string, unknown> }> {
  return airtableFetch(`${table}/${id}`);
}

export async function listRecords(
  table: string,
  opts?: { filterByFormula?: string },
): Promise<{ id: string; fields: Record<string, unknown> }[]> {
  const params = new URLSearchParams();
  if (opts?.filterByFormula) params.set("filterByFormula", opts.filterByFormula);
  const json = await airtableFetch(`${table}?${params.toString()}`);
  return json.records as { id: string; fields: Record<string, unknown> }[];
}
