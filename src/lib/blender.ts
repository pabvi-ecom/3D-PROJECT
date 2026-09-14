/**
 * Cliente del servicio de Blender en Cloud Run — coge el .glb que devuelve
 * Tripo (placa en blanco) y le pega el nombre como texto 3D real y nítido.
 * Si el servicio falla por lo que sea, se hace fallback al modelo de Tripo
 * sin nombre — mejor entregar algo que romper el pedido entero.
 */
const SERVICE_URL = process.env.BLENDER_SERVICE_URL;
const SHARED_SECRET = process.env.BLENDER_SHARED_SECRET;

export async function addNameplate(modelUrl: string, name: string): Promise<string> {
  if (!SERVICE_URL || !name.trim()) return modelUrl;
  try {
    const res = await fetch(`${SERVICE_URL}/produce`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Shared-Secret": SHARED_SECRET ?? "" },
      body: JSON.stringify({ model_url: modelUrl, name: name.trim() }),
      signal: AbortSignal.timeout(280_000),
    });
    const json = await res.json();
    if (!res.ok || !json.model_url) {
      console.error("[blender] addNameplate falló, usando modelo sin nombre", json.error ?? res.status);
      return modelUrl;
    }
    return json.model_url as string;
  } catch (e) {
    console.error("[blender] addNameplate error, usando modelo sin nombre", (e as Error).message);
    return modelUrl;
  }
}
