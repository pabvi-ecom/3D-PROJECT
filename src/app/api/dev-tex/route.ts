import { NextResponse } from "next/server";
export const runtime = "nodejs";
const BASE = "https://openapi.tripo3d.ai/v3";
function h() { return { Authorization: `Bearer ${process.env.TRIPO_API_KEY}`, "Content-Type": "application/json" }; }
async function probe(body: Record<string, unknown>) {
  const r = await fetch(`${BASE}/generation/image-to-model`, { method: "POST", headers: h(),
    body: JSON.stringify({ file: { type: "png", url: "https://example.com/x.png" }, model: "P2-20260801", ...body }) });
  return r.json().catch(() => ({ raw: "nj" }));
}
export async function GET() {
  return NextResponse.json({
    texture_resolution: await probe({ texture_resolution: "bad-xyz" }),
    texture_size: await probe({ texture_size: "bad-xyz" }),
    texture_alignment: await probe({ texture_alignment: "bad-xyz" }),
    resolution: await probe({ resolution: "bad-xyz" }),
  });
}
