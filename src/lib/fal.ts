/**
 * Generación 3D CON textura vía fal.ai (Hunyuan3D v2).
 * - multi-view (front/back/left) -> mejor forma, usa varias vistas.
 * - single (1 imagen) como fallback.
 * textured_mesh:true => color (3x coste). Output: model_mesh.url (glb).
 * Corre en infra propia de fal (sin el ResourceInsufficient de Replicate).
 *
 * El taskId devuelto lleva prefijo del modelo ("mv:" / "single:") porque la
 * cola de fal es por-modelo y getTask necesita saber a cuál sondear.
 */
const BASE = "https://queue.fal.run";
const MODEL_MV = "fal-ai/hunyuan3d/v2/multi-view";
const MODEL_SINGLE = "fal-ai/hunyuan3d/v2";

function headers() {
  const key = process.env.FALAI ?? process.env.FAL_KEY;
  if (!key) throw new Error("FALAI / FAL_KEY no configurado");
  return { Authorization: `Key ${key}`, "Content-Type": "application/json" };
}

async function submit(model: string, input: Record<string, unknown>): Promise<string> {
  const res = await fetch(`${BASE}/${model}`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(input),
  });
  const json = await res.json();
  if (!res.ok || !json.request_id) {
    throw new Error(`FAL_FAIL: ${json.detail ?? json.error ?? JSON.stringify(json)}`);
  }
  return json.request_id as string;
}

/**
 * Frente (+ atrás/izquierda si hay) -> modelo 3D con textura.
 * Usa multi-view si tenemos al menos front+back+left; si no, 1 imagen.
 */
export async function createTexturedModelTask(views: {
  front: string;
  back?: string;
  left?: string;
}): Promise<string> {
  if (views.back && views.left) {
    const id = await submit(MODEL_MV, {
      front_image_url: views.front,
      back_image_url: views.back,
      left_image_url: views.left,
      textured_mesh: true,
      octree_resolution: 256,
    });
    return `mv:${id}`;
  }
  const id = await submit(MODEL_SINGLE, {
    input_image_url: views.front,
    textured_mesh: true,
    octree_resolution: 256,
  });
  return `single:${id}`;
}

export type FalTask = {
  status: "queued" | "running" | "success" | "failed" | "cancelled";
  output?: { model_url?: string };
  error?: string;
};

export async function getTask(taskId: string): Promise<FalTask> {
  const [tag, id] = taskId.includes(":") ? taskId.split(":") : ["single", taskId];
  const model = tag === "mv" ? MODEL_MV : MODEL_SINGLE;

  const sres = await fetch(`${BASE}/${model}/requests/${id}/status`, { headers: headers() });
  const sj = await sres.json();
  if (!sres.ok) throw new Error(`FAL_FAIL: ${sj.detail ?? sj.error ?? "status error"}`);
  const st = sj.status as string; // IN_QUEUE | IN_PROGRESS | COMPLETED

  if (st !== "COMPLETED") {
    return { status: st === "IN_PROGRESS" ? "running" : st === "IN_QUEUE" ? "queued" : "failed" };
  }

  const rres = await fetch(`${BASE}/${model}/requests/${id}`, { headers: headers() });
  const rj = await rres.json();
  if (!rres.ok) throw new Error(`FAL_FAIL: ${rj.detail ?? rj.error ?? "result error"}`);
  const url = rj?.model_mesh?.url as string | undefined;
  if (!url) return { status: "failed", error: "sin model_mesh.url en el resultado" };
  return { status: "success", output: { model_url: url } };
}
