import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

function key(): string {
  const k = process.env.KIE_AI_API_KEY;
  if (!k) throw new Error("Falta KIE_AI_API_KEY");
  return k;
}

// Ruta temporal: crea la tarea de vídeo (Kling image-to-video) a partir de
// /pet/center.png. Devuelve el taskId para hacer polling aparte.
export async function GET(req: Request) {
  const origin = new URL(req.url).origin;
  const imageUrl = new URL("/pet/center.png", origin).toString();

  const prompt =
    "The golden retriever stays perfectly still in place, same framing, same warm mustard background. " +
    "Natural idle motion only: gentle slow blinking, small relaxed ear twitches, subtle breathing in the chest, " +
    "tongue panting softly, the head tilts very slightly side to side as if curiously watching something, " +
    "eyes occasionally glance left and right. Calm, happy, photorealistic, looping motion, no camera movement, " +
    "no zoom, no background change.";

  const res = await fetch("https://api.kie.ai/api/v1/jobs/createTask", {
    method: "POST",
    headers: { Authorization: `Bearer ${key()}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "kling-2.6/image-to-video",
      input: { prompt, image_urls: [imageUrl], sound: false, duration: "5" },
    }),
  });
  const json = await res.json();
  return NextResponse.json(json);
}
