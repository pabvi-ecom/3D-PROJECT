import { NextResponse } from "next/server";
import { updateRecord } from "@/lib/airtable";
import { getTask } from "@/lib/tripo";
import { addNameplate } from "@/lib/blender";

export const runtime = "nodejs";
export const maxDuration = 280;

export async function POST() {
  const task = await getTask("dc4ec3bc-1ed1-4605-8840-3f024635cca9");
  const rawUrl = task.output?.model_url ?? "";
  if (!rawUrl) return NextResponse.json({ error: "no model url", task }, { status: 500 });
  const { modelUrl, stlUrl } = await addNameplate(rawUrl, "Frankie");
  await updateRecord("Leads", "reclBJdu6NqhwOFjJ", {
    "Model File URL": modelUrl,
    "Model STL URL": stlUrl ?? "",
  });
  return NextResponse.json({ ok: true, modelUrl, stlUrl });
}
