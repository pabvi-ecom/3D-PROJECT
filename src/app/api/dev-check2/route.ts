import { NextResponse } from "next/server";
import { listRecords } from "@/lib/airtable";

export async function GET() {
  const leads = await listRecords("Leads", { filterByFormula: `{Pet Name} = "Frankie"` });
  return NextResponse.json(leads.map((l) => l.fields));
}
