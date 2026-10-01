import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { deleteRecord } from "@/lib/airtable";

export const runtime = "nodejs";

async function checkAuth() {
  const store = await cookies();
  const session = store.get("admin_session")?.value;
  return !!session && session === process.env.ADMIN_PASSWORD;
}

/** POST /api/admin/delete-record { table, id } — borra un registro. */
export async function POST(req: NextRequest) {
  if (!(await checkAuth())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { table, id } = await req.json();
    if (table !== "Leads" && table !== "OrderItems") return NextResponse.json({ error: "Invalid table" }, { status: 400 });
    await deleteRecord(table, id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
