/**
 * Guarda permanente el modelo de Tripo + genera el STL para el proveedor.
 * Las URLs que devuelve Tripo son firmadas y CADUCAN, así que el modelo se
 * copia a nuestro bucket (permanente) y de paso se exporta a STL (lo que
 * acepta JLC3DP). El servicio corre en Cloud Run. Ya NO toca el nombre —
 * la placa la reconstruye Tripo directamente de la imagen.
 * Si el servicio falla, se devuelve la URL de Tripo tal cual (mejor eso que
 * romper el pedido; se puede reprocesar después).
 */
const SERVICE_URL = process.env.BLENDER_SERVICE_URL;
const SHARED_SECRET = process.env.BLENDER_SHARED_SECRET;

export type StoredModel = { modelUrl: string; stlUrl: string | null };

export async function processModel(tripoUrl: string): Promise<StoredModel> {
  if (!SERVICE_URL) return { modelUrl: tripoUrl, stlUrl: null };
  try {
    const res = await fetch(`${SERVICE_URL}/produce`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Shared-Secret": SHARED_SECRET ?? "" },
      body: JSON.stringify({ model_url: tripoUrl, name: "x" }),
      signal: AbortSignal.timeout(120_000),
    });
    const json = await res.json();
    if (!res.ok || !json.model_url) {
      console.error("[model-store] falló, se usa URL de Tripo", json.error ?? res.status);
      return { modelUrl: tripoUrl, stlUrl: null };
    }
    return { modelUrl: json.model_url as string, stlUrl: (json.stl_url as string) ?? null };
  } catch (e) {
    console.error("[model-store] error, se usa URL de Tripo", (e as Error).message);
    return { modelUrl: tripoUrl, stlUrl: null };
  }
}
