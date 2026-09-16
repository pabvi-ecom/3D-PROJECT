/**
 * Cliente de Kie.ai (generación de imágenes).
 * Patrón asíncrono: createTask -> se sondea recordInfo hasta success/fail.
 * La API key se lee de process.env.KIE_AI_API_KEY (nunca en el repo).
 *
 * Modelo por defecto: google/nano-banana-edit (foto del perro -> figurita).
 */
const KIE_BASE = "https://api.kie.ai/api/v1/jobs";
const KIE_UPLOAD = "https://kieai.redpandaai.co/api/file-base64-upload";

function key(): string {
  const k = process.env.KIE_AI_API_KEY;
  if (!k) throw new Error("Falta KIE_AI_API_KEY en el entorno (.env.local)");
  return k;
}

type KieInput = Record<string, unknown>;

async function createTask(model: string, input: KieInput): Promise<string> {
  const res = await fetch(`${KIE_BASE}/createTask`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ model, input }),
  });
  const json = await res.json();
  if (json.code !== 200 || !json.data?.taskId) {
    throw new Error(`Kie createTask falló: ${json.msg ?? res.status}`);
  }
  return json.data.taskId as string;
}

interface KieResult {
  state: "waiting" | "queuing" | "generating" | "success" | "fail" | string;
  resultUrls?: string[];
  failMsg?: string | null;
}

async function recordInfo(taskId: string): Promise<KieResult> {
  const res = await fetch(`${KIE_BASE}/recordInfo?taskId=${taskId}`, {
    headers: { Authorization: `Bearer ${key()}` },
  });
  const json = await res.json();
  const data = json.data ?? {};
  let resultUrls: string[] | undefined;
  if (data.resultJson) {
    try {
      resultUrls = JSON.parse(data.resultJson).resultUrls;
    } catch {
      /* aún sin resultado */
    }
  }
  return { state: data.state, resultUrls, failMsg: data.failMsg };
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Crea la tarea y espera al resultado (con timeout). Devuelve las URLs de imagen. */
export async function runTask(
  model: string,
  input: KieInput,
  { timeoutMs = 110_000, intervalMs = 3_000 } = {},
): Promise<string[]> {
  const taskId = await createTask(model, input);
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const info = await recordInfo(taskId);
    if (info.state === "success" && info.resultUrls?.length) return info.resultUrls;
    if (info.state === "fail") throw new Error(`KIE_FAIL: ${info.failMsg ?? "desconocido"}`);
    await sleep(intervalMs);
  }
  throw new Error("KIE_TIMEOUT");
}

/**
 * Sube una imagen (data URI base64) al almacenamiento temporal de Kie y
 * devuelve una URL pública que la generación puede leer.
 * Kie NO acepta base64 directo en la generación; hay que subir primero.
 */
export async function uploadImage(dataUri: string, fileName = "upload.png"): Promise<string> {
  // Nombre SIEMPRE único — si no, dos subidas con el mismo nombre (varias
  // fotos de clientes, o varias imágenes generadas) colisionan en la misma
  // URL y el CDN devuelve la primera cacheada para todas. Era la causa de
  // que las figuras salieran iguales / no se parecieran a la foto subida.
  const dot = fileName.lastIndexOf(".");
  const ext = dot >= 0 ? fileName.slice(dot) : ".png";
  const stem = dot >= 0 ? fileName.slice(0, dot) : fileName;
  const uniqueName = `${stem}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}${ext}`;
  const res = await fetch(KIE_UPLOAD, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ base64Data: dataUri, uploadPath: "sculptly/uploads", fileName: uniqueName }),
  });
  const json = await res.json();
  const url = json?.data?.downloadUrl;
  if (!url) throw new Error(`Subida a Kie falló: ${json.msg ?? res.status}`);
  return url as string;
}

/**
 * Convierte la foto de una mascota en una figurita.
 * @param imageUrl  URL pública de la foto subida por el cliente.
 * @param prompt    Instrucción (incluye el estilo de la zona + la base elegida).
 */
export async function generateFigurine(imageUrl: string, prompt: string, extraRefUrls: string[] = []): Promise<string> {
  const urls = await runTask("google/nano-banana-edit", {
    prompt,
    image_urls: [imageUrl, ...extraRefUrls],
    output_format: "png",
    image_size: "1:1",
  });
  return urls[0];
}
