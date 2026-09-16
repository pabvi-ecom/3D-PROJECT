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
const OPENAI_GEN = "https://api.openai.com/v1/images/generations";
const OPENAI_CHAT = "https://api.openai.com/v1/chat/completions";
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

/**
 * Analiza la foto de la mascota con GPT-4o (visión) y devuelve una
 * descripción MUY detallada — raza, tamaño, tipo/largo de pelo, colores y
 * manchas exactas, orejas, hocico, ojos, rasgos distintivos. Así podemos
 * generar la figura SOLO desde texto (sin pasar la foto del perro como
 * referencia de imagen, que era lo que "mezclaba" referencias).
 */
export async function describePet(imageUrl: string): Promise<string> {
  const res = await fetch(OPENAI_CHAT, {
    method: "POST",
    headers: { Authorization: `Bearer ${key()}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text:
                "Describe this pet in precise physical detail for an artist who will sculpt an EXACT " +
                "figurine of it and will NOT see the photo. Cover: species and breed (or mix), body size and " +
                "build, coat type and length, ALL fur colors and the exact pattern/placement of markings " +
                "(face, chest, legs, back, tail), ear shape and position, muzzle/snout shape, eye color, and any " +
                "distinctive features. Be specific and factual. Output ONE dense paragraph, no preamble.",
            },
            { type: "image_url", image_url: { url: imageUrl } },
          ],
        },
      ],
      max_tokens: 400,
    }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(`OPENAI_VISION_FAIL: ${json.error?.message ?? res.status}`);
  const desc = json.choices?.[0]?.message?.content?.trim();
  if (!desc) throw new Error("OPENAI_VISION_FAIL: sin descripción");
  return desc;
}

/**
 * Genera una imagen SOLO desde texto (opcionalmente con imágenes de
 * referencia — p.ej. la base, NUNCA el perro). Si hay referencias usa el
 * endpoint de edición; si no, el de generación pura.
 */
export async function generateFromText(prompt: string, refUrls: string[] = []): Promise<string> {
  let b64: string | undefined;
  if (refUrls.length > 0) {
    const blobs = await Promise.all(refUrls.map(fetchAsBlob));
    const form = new FormData();
    form.append("model", "gpt-image-1");
    form.append("prompt", prompt);
    form.append("size", "1024x1024");
    form.append("quality", QUALITY);
    blobs.forEach((b, i) => form.append("image[]", b, `ref${i}.png`));
    const res = await fetch(OPENAI_API, { method: "POST", headers: { Authorization: `Bearer ${key()}` }, body: form });
    const json = await res.json();
    if (!res.ok) throw new Error(`OPENAI_FAIL: ${json.error?.message ?? res.status}`);
    b64 = json.data?.[0]?.b64_json;
  } else {
    const res = await fetch(OPENAI_GEN, {
      method: "POST",
      headers: { Authorization: `Bearer ${key()}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: "gpt-image-1", prompt, size: "1024x1024", quality: QUALITY }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(`OPENAI_FAIL: ${json.error?.message ?? res.status}`);
    b64 = json.data?.[0]?.b64_json;
  }
  if (!b64) throw new Error("OPENAI_FAIL: respuesta sin imagen");
  const unique = `openai-${Date.now()}-${Math.random().toString(36).slice(2, 10)}.png`;
  return uploadImage(`data:image/png;base64,${b64}`, unique);
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
  // Nombre ÚNICO por imagen — si no, todas se suben al mismo archivo y el
  // CDN devuelve la primera cacheada para todas (salían idénticas).
  const unique = `openai-${Date.now()}-${Math.random().toString(36).slice(2, 10)}.png`;
  return uploadImage(`data:image/png;base64,${b64}`, unique);
}
