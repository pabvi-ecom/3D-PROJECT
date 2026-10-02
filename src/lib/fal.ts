/**
 * Generación 3D CON textura vía fal.ai (Hunyuan3D v2).
 * Misma interfaz que hunyuan3d.ts (createTexturedModelTask / getTask) para
 * intercambiarlos sin tocar el resto del flujo.
 *
 * fal.ai corre en su propia infra -> sin el "ResourceInsufficient" del pool
 * compartido de Replicate. input_image_url = 1 imagen; textured_mesh:true da
 * color (3x coste). Output: model_mesh.url (glb).
 */
const BASE = "https://queue.fal.run";
const MODEL = "fal-ai/hunyuan3d/v2";

function headers() {
  const key = process.env.FALAI ?? process.env.FAL_KEY;
  if (!key) throw new Error("FALAI / FAL_KEY no configurado");
  return { Authorization: `Key ${key}`, "Content-Type": "application/json" };
}

/** Imagen (frente sin base) -> tarea de modelo 3D con textura. Devuelve request_id. */
export async function createTexturedModelTask(imageUrl: string): Promise<string> {
  const res = await fetch(`${BASE}/${MODEL}`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({
      input_image_url: imageUrl,
      textured_mesh: true,
      octree_resolution: 256,
    }),
  });
  const json = await res.json();
  if (!res.ok || !json.request_id) {
    throw new Error(`FAL_FAIL: ${json.detail ?? json.error ?? JSON.stringify(json)}`);
  }
  return json.request_id as string;
}

export type FalTask = {
  status: "queued" | "running" | "success" | "failed" | "cancelled";
  output?: { model_url?: string };
  error?: string;
};

export async function getTask(id: string): Promise<FalTask> {
  // 1) estado
  const sres = await fetch(`${BASE}/${MODEL}/requests/${id}/status`, { headers: headers() });
  const sj = await sres.json();
  if (!sres.ok) throw new Error(`FAL_FAIL: ${sj.detail ?? sj.error ?? "status error"}`);
  const st = sj.status as string; // IN_QUEUE | IN_PROGRESS | COMPLETED

  if (st !== "COMPLETED") {
    return { status: st === "IN_PROGRESS" ? "running" : st === "IN_QUEUE" ? "queued" : "failed" };
  }

  // 2) resultado
  const rres = await fetch(`${BASE}/${MODEL}/requests/${id}`, { headers: headers() });
  const rj = await rres.json();
  if (!rres.ok) throw new Error(`FAL_FAIL: ${rj.detail ?? rj.error ?? "result error"}`);
  const url = rj?.model_mesh?.url as string | undefined;
  if (!url) return { status: "failed", error: "sin model_mesh.url en el resultado" };
  return { status: "success", output: { model_url: url } };
}
