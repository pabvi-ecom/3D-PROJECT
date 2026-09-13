const BASE = "https://openapi.tripo3d.ai/v3";
const MODEL_VERSION = "v3.1-20260211";

function headers() {
  const key = process.env.TRIPO_API_KEY;
  if (!key) throw new Error("TRIPO_API_KEY no configurado");
  return { Authorization: `Bearer ${key}`, "Content-Type": "application/json" };
}

/**
 * Lanza la generación del modelo 3D a partir de la imagen ya generada de la
 * figura (URL pública, ej. la que devuelve Kie.ai). Contrato confirmado a
 * mano contra la API real — Tripo exige `model` explícito, y acepta la
 * imagen directamente por URL (no hace falta subirla antes con /v3/files).
 */
export async function createImageToModelTask(imageUrl: string): Promise<string> {
  const res = await fetch(`${BASE}/generation/image-to-model`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({
      file: { type: "jpg", url: imageUrl },
      model: MODEL_VERSION,
      // Máxima calidad: más polígonos y textura detallada (a coste de más
      // tiempo/créditos). Si Tripo rechaza algún campo, se ve enseguida en
      // el error de esta misma llamada — ver logs.
      face_limit: 30000,
      texture: true,
      pbr: true,
      texture_quality: "detailed",
    }),
  });
  const json = await res.json();
  if (json.code !== 0) throw new Error(`TRIPO_FAIL: ${json.message ?? "unknown error"}`);
  return json.data.task_id as string;
}

export type TripoTask = {
  status: "queued" | "running" | "success" | "failed" | "cancelled";
  progress: number;
  output?: { model_url?: string; rendered_image_url?: string };
};

export async function getTask(taskId: string): Promise<TripoTask> {
  const res = await fetch(`${BASE}/tasks/${taskId}`, { headers: headers() });
  const json = await res.json();
  if (json.code !== 0) throw new Error(`TRIPO_FAIL: ${json.message ?? "unknown error"}`);
  return json.data as TripoTask;
}
