/**
 * Generador de imágenes con OpenAI gpt-image-1 (la IA de imágenes de
 * ChatGPT). Edición imagen-a-imagen: coge la foto de la mascota (+ imágenes
 * de referencia opcionales) y un prompt, y devuelve la figura generada.
 * Misma firma que generateFigurine de kie.ts para poder intercambiarlos.
 *
 * El resultado (base64) se sube al almacenamiento temporal de Kie para
 * obtener una URL pública (la reutilizamos, ya está montada), que es lo que
 * consume Tripo y el resto del flujo.
 */
import { uploadImage } from "./kie";

const OPENAI_API = "https://api.openai.com/v1/images/edits";
// Calidad: "high" = máxima (más cara, ~$0.17/img), "medium" (~$0.04),
// "low" (~$0.01). Configurable por env para ajustar coste/calidad.
const QUALITY = (process.env.OPENAI_IMAGE_QUALITY as "low" | "medium" | "high") || "high";

function key(): string {
  const k = process.env.OPENAI_API_KEY;
  if (!k) throw new Error("Falta OPENAI_API_KEY en el entorno");
  return k;
}

async function fetchAsBlob(url: string): Promise<Blob> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`No se pudo descargar la imagen (${res.status})`);
  return res.blob();
}

export async function generateFigurine(imageUrl: string, prompt: string, extraRefUrls: string[] = []): Promise<string> {
  const urls = [imageUrl, ...extraRefUrls];
  const blobs = await Promise.all(urls.map(fetchAsBlob));

  const form = new FormData();
  form.append("model", "gpt-image-1");
  form.append("prompt", prompt);
  form.append("size", "1024x1024");
  form.append("quality", QUALITY);
  // gpt-image-1 admite varias imágenes de entrada (la foto + referencias).
  blobs.forEach((b, i) => form.append("image[]", b, `img${i}.png`));

  const res = await fetch(OPENAI_API, {
    method: "POST",
    headers: { Authorization: `Bearer ${key()}` },
    body: form,
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(`OPENAI_FAIL: ${json.error?.message ?? res.status}`);
  }
  const b64 = json.data?.[0]?.b64_json;
  if (!b64) throw new Error("OPENAI_FAIL: respuesta sin imagen");

  // Subir el resultado para tener una URL pública (Tripo la necesita).
  return uploadImage(`data:image/png;base64,${b64}`, "openai-figure.png");
}
