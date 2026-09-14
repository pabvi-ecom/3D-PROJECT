import { NextResponse } from "next/server";

// Endpoint temporal de diagnóstico — comprueba saldo Tripo y qué parámetros
// acepta realmente la API (validando con un valor claramente inválido para
// que el error nos diga el esquema exacto). Se borra tras usarlo.
export const runtime = "nodejs";
const BASE = "https://openapi.tripo3d.ai/v3";

function headers() {
  return { Authorization: `Bearer ${process.env.TRIPO_API_KEY}`, "Content-Type": "application/json" };
}

async function probe(body: Record<string, unknown>) {
  const res = await fetch(`${BASE}/generation/image-to-model`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ file: { type: "jpg", url: "https://example.com/does-not-exist.jpg" }, model: "v3.1-20260211", ...body }),
  });
  return res.json().catch(() => ({ raw: "not json" }));
}

export async function GET() {
  const balancePaths = ["/user/balance", "/balance", "/account/balance", "/user/account"];
  const balances: Record<string, unknown> = {};
  for (const p of balancePaths) {
    const r = await fetch(`${BASE}${p}`, { headers: headers() });
    balances[p] = await r.json().catch(() => ({ raw: "not json" }));
  }

  const probes = {
    face_limit_absurd: await probe({ face_limit: 99999999 }),
    quality_extreme: await probe({ texture_quality: "extreme" }),
    quality_field: await probe({ quality: "ultra-xyz" }),
    auto_size: await probe({ auto_size: "not-a-bool-xyz" }),
    style_field: await probe({ style: "not-a-real-style-xyz" }),
  };

  return NextResponse.json({ balances, probes });
}
