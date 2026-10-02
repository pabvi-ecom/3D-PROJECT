/**
 * Generación 3D multi-vista con Hunyuan3D (Tencent) vía Replicate.
 *
 * Sustituye al multi-vista de Tripo, que fusionaba mal las vistas y producía
 * meshes rotos (miles de fragmentos sueltos + decenas de miles de agujeros,
 * volumen 0, no imprimible). Hunyuan3D-2mv está afinado justo para
 * reconstruir un mesh watertight a partir de varias vistas.
 *
 * Misma interfaz que tripo.ts (createImageToModelTask /
 * createMultiviewToModelTask / getTask) para poder intercambiarlos sin tocar
 * el resto del flujo (Airtable, cron, model-store).
 */
const BASE = "https://api.replicate.com/v1";
const MODEL_MV = "tencent/hunyuan3d-2mv"; // multi-vista: front/back/left/right
const MODEL_1 = "tencent/hunyuan3d-2"; // una sola imagen
const VERSION_MV = "71798fbc3c9f7b7097e3bb85496e5a797d8b8f616b550692e7c3e176a8e9e5db";
const VERSION_1 = "b1b9449a1277e10402781c5d41eb30c0a0683504fb23fab591ca9dfc2aabe1cb";

function headers() {
  const key = process.env.REPLICATE_API_TOKEN;
  if (!key) throw new Error("REPLICATE_API_TOKEN no configurado");
  return { Authorization: `Token ${key}`, "Content-Type": "application/json" };
}

async function createPrediction(
  model: string,
  version: string,
  input: Record<string, unknown>
): Promise<string> {
  const res = await fetch(`${BASE}/models/${model}/predictions`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ version, input }),
  });
  const json = await res.json();
  if (!res.ok || !json.id) {
    throw new Error(`REPLICATE_FAIL: ${json.detail ?? json.error ?? "unknown error"}`);
  }
  return json.id as string;
}

/**
 * Varias vistas de la misma figura -> modelo 3D. Hunyuan3D-2mv exige la
 * vista FRONTAL; atrás/izquierda/derecha son opcionales y mejoran el resultado.
 * file_type "glb" = el formato que ya maneja el flujo (luego se convierte a STL).
 */
export async function createMultiviewToModelTask(views: {
  front: string;
  left?: string;
  back?: string;
  right?: string;
}): Promise<string> {
  const input: Record<string, unknown> = {
    front_image: views.front,
    file_type: "glb",
    remove_background: true,
    target_face_num: 50000, // Tripo usaba face_limit 50000; más detalle que el default (10000)
  };
  if (views.back) input.back_image = views.back;
  if (views.left) input.left_image = views.left;
  if (views.right) input.right_image = views.right;
  return createPrediction(MODEL_MV, VERSION_MV, input);
}

/** Una sola imagen -> modelo 3D (equivalente al image-to-model de Tripo). */
export async function createImageToModelTask(imageUrl: string): Promise<string> {
  return createPrediction(MODEL_1, VERSION_1, {
    image: imageUrl,
    remove_background: true,
  });
}

export type HunyuanTask = {
  status: "queued" | "running" | "success" | "failed" | "cancelled";
  output?: { model_url?: string };
};

/**
 * Polling de una predicción de Replicate. Mapea sus estados
 * (starting/processing/succeeded/failed/canceled) a los que espera el flujo
 * actual de Tripo (queued/running/success/failed/cancelled).
 */
export async function getTask(id: string): Promise<HunyuanTask> {
  const res = await fetch(`${BASE}/predictions/${id}`, { headers: headers() });
  const json = await res.json();
  if (!res.ok) throw new Error(`REPLICATE_FAIL: ${json.detail ?? json.error ?? "unknown error"}`);

  const st = json.status as string;
  const status =
    st === "succeeded"
      ? "success"
      : st === "failed"
        ? "failed"
        : st === "canceled"
          ? "cancelled"
          : st === "starting" || st === "processing"
            ? "running"
            : "queued";

  return {
    status,
    output: status === "success" ? { model_url: json.output as string } : undefined,
  };
}
