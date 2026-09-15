import { NextResponse } from "next/server";
import { updateRecord } from "@/lib/airtable";
import { getTask } from "@/lib/tripo";
import { processModel } from "@/lib/model-store";
export const runtime = "nodejs";
export const maxDuration = 180;
export async function POST() {
  const task = await getTask("8d85cc37-f5cb-490e-98e3-05079381eaa6");
  const rawUrl = task.output?.model_url ?? "";
  if (!rawUrl) return NextResponse.json({ error: "no model" }, { status: 500 });
  const { modelUrl, stlUrl } = await processModel(rawUrl);
  await updateRecord("Leads", "reclBJdu6NqhwOFjJ", { "Model File URL": modelUrl, "Model STL URL": stlUrl ?? "", "Tripo Status": "Ready" });
  return NextResponse.json({ ok: true, modelUrl, stlUrl });
}
