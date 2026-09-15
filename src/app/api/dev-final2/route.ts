import { NextResponse } from "next/server";
import { updateRecord } from "@/lib/airtable";
import { getTask } from "@/lib/tripo";
import { addNameplate } from "@/lib/blender";

export const runtime = "nodejs";
export const maxDuration = 280;

export async function POST() {
  const task = await getTask("d9866991-e133-45b1-87ff-8c3a44ac92b5");
  const rawUrl = task.output?.model_url ?? "";
  if (!rawUrl) return NextResponse.json({ error: "no model", task }, { status: 500 });
  const { modelUrl, stlUrl } = await addNameplate(rawUrl, "Frankie");
  await updateRecord("Leads", "reclBJdu6NqhwOFjJ", {
    "Model File URL": modelUrl,
    "Model STL URL": stlUrl ?? "",
    "Tripo Status": "Ready",
  });
  return NextResponse.json({ ok: true, modelUrl, stlUrl });
}
