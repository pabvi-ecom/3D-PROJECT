const BASE = "https://openapi.tripo3d.ai/v3";
// P2 = modelo "Ultra" (el más nuevo de Tripo, agosto 2026). Da bastante más
// detalle de superficie (pelo, músculo) que v3.1. Cuesta ~130 créditos vs
// ~50, pero la figura es un producto premium. P2 limita face_limit a 50000
// (topología mejor, no fuerza bruta de polígonos).
const MODEL_VERSION = "P2-20260801";

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
      // MÁXIMA CALIDAD: P2 topa en 50000 caras (triangle mesh) -> ese es el
      // techo de polígonos. El detalle fino lo aporta el INPUT nítido + textura
      // detailed 8K. smart_low_poly:false para no simplificar la malla.
      face_limit: 50000,
      quad: false,
      smart_low_poly: false,
      // Geometria al maximo (mejor forma, p.ej. la espalda de perros largos)
      // + autofix de la imagen + orientar el modelo con la imagen.
      geometry_quality: "detailed",
      enable_image_autofix: true,
      orientation: "align_image",
      texture: true,
      pbr: true,
      texture_quality: "detailed",
      texture_size: 8192,
    }),
  });
  const json = await res.json();
  if (json.code !== 0) throw new Error(`TRIPO_FAIL: ${json.message ?? "unknown error"}`);
  return json.data.task_id as string;
}

/**
 * Genera el modelo 3D a partir de VARIAS vistas (frente, izquierda, atrás,
 * derecha) de la misma figura — mucho mejor geometría que una sola imagen
 * (que obligaba a Tripo a inventarse la espalda y los lados).
 * Orden EXIGIDO por Tripo: [front, left, back, right]. Una vista vacía se pasa
 * como objeto vacío {}.
 */
export async function createMultiviewToModelTask(views: {
  front: string;
  left?: string;
  back?: string;
  right?: string;
}): Promise<string> {
  const file = (url?: string) => (url ? { type: "jpg", url } : {});
  const res = await fetch(`${BASE}/generation/multiview-to-model`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({
      files: [file(views.front), file(views.left), file(views.back), file(views.right)],
      model: MODEL_VERSION,
      face_limit: 50000,
      texture: true,
      pbr: true,
      texture_quality: "extreme",
      texture_size: 8192,
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
