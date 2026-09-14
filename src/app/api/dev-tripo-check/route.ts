import { NextResponse } from "next/server";

// Endpoint temporal de diagnóstico — comprueba saldo Tripo y qué parámetros
// acepta realmente la API (validando con un valor claramente inválido para
// que el error nos diga el esquema exacto). Se borra tras usarlo.
export const runtime = "nodejs";
const BASE = "https://openapi.tripo3d.ai/v3";

function headers() {
  return { Authorization: `Bearer ${process.env.TRIPO_API_KEY}`, "Content-Type": "application/json" };
}

export async function GET() {
  const balanceRes = await fetch(`${BASE}/user/balance`, { headers: headers() });
  const balanceJson = await balanceRes.json().catch(() => ({ raw: "not json" }));

  // Petición deliberadamente inválida (texture_quality con un valor que no
  // debería existir, url de imagen falsa) — el mensaje de error de Tripo
  // debería confirmar los nombres/valores de campo reales.
  const probeRes = await fetch(`${BASE}/generation/image-to-model`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({
      file: { type: "jpg", url: "https://example.com/does-not-exist.jpg" },
      model: "v3.1-20260211",
      face_limit: 30000,
      texture: true,
      pbr: true,
      texture_quality: "this-is-not-a-real-value-xyz",
    }),
  });
  const probeJson = await probeRes.json().catch(() => ({ raw: "not json" }));

  return NextResponse.json({ balance: balanceJson, probe: probeJson });
}
