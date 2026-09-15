import { NextResponse } from "next/server";

export const runtime = "nodejs";
const BASE = "https://openapi.tripo3d.ai/v3";

function headers() {
  return { Authorization: `Bearer ${process.env.TRIPO_API_KEY}`, "Content-Type": "application/json" };
}

async function probe(body: Record<string, unknown>) {
  const res = await fetch(`${BASE}/generation/image-to-model`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ file: { type: "jpg", url: "https://example.com/x.jpg" }, ...body }),
  });
  return res.json().catch(() => ({ raw: "not json" }));
}

export async function GET() {
  return NextResponse.json({
    bad_model: await probe({ model: "not-a-real-model-xyz" }),
    bad_geo: await probe({ model: "v3.1-20260211", geometry_quality: "not-real-xyz" }),
    bad_quality: await probe({ model: "v3.1-20260211", quality: "not-real-xyz" }),
    bad_quad: await probe({ model: "v3.1-20260211", quad: "not-real-xyz" }),
    bad_facenum: await probe({ model: "v3.1-20260211", face_limit: -5 }),
    bad_ptype: await probe({ model: "v3.1-20260211", part_type: "not-real-xyz" }),
    bad_geometry_only: await probe({ model: "v3.1-20260211", generate_parts: "not-real-xyz" }),
    bad_smart: await probe({ model: "v3.1-20260211", smart_low_poly: "not-real-xyz" }),
    bad_compress: await probe({ model: "v3.1-20260211", compress: "not-real-xyz" }),
  });
}
