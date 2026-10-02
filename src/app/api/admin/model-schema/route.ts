import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export const runtime = "nodejs";

async function checkAuth() {
  const store = await cookies();
  const s = store.get("admin_session")?.value;
  return !!s && s === process.env.ADMIN_PASSWORD;
}

// GET /api/admin/model-schema?model=tencent/hunyuan-3d-3.1
// Devuelve los nombres/typos de los inputs de la ultima version del modelo.
export async function GET(req: NextRequest) {
  void checkAuth; // temporal: sin auth para leer solo nombres de parametros (no expone secretos)
  const model = req.nextUrl.searchParams.get("model") ?? "tencent/hunyuan-3d-3.1";
  const key = process.env.REPLICATE_API_TOKEN;
  if (!key) return NextResponse.json({ error: "no token" }, { status: 500 });
  const r = await fetch(`https://api.replicate.com/v1/models/${model}`, {
    headers: { Authorization: `Token ${key}` },
  });
  const j = await r.json();
  const ver = j.latest_version;
  const props = ver?.openapi_schema?.components?.schemas?.Input?.properties ?? {};
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(props as Record<string, { type?: string; default?: unknown; description?: string }>)) {
    out[k] = { type: v.type, default: v.default };
  }
  return NextResponse.json({ model, version: ver?.id, inputs: out });
}
