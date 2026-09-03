import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

function key(): string {
  const k = process.env.KIE_AI_API_KEY;
  if (!k) throw new Error("Falta KIE_AI_API_KEY");
  return k;
}

// Ruta temporal: genera UN vídeo donde el perro barre la mirada por varias
// direcciones en secuencia continua (para luego hacer "scrub" con el ratón).
export async function GET(req: Request) {
  const origin = new URL(req.url).origin;
  const imageUrl = new URL("/pet/center.png", origin).toString();

  const prompt =
    "The french bulldog stays perfectly in place, exact same framing, exact same warm orange background, " +
    "same happy panting expression throughout. It slowly and smoothly sweeps its gaze and head in one " +
    "continuous motion: start looking straight at the camera (center), slowly turn the head to look to its " +
    "left, slowly return to center, slowly turn the head to look to its right, slowly return to center, " +
    "slowly tilt the head up looking upward, slowly return to center, slowly tilt the head down looking " +
    "downward, slowly return to center to end exactly like the starting frame. Smooth, slow, continuous, " +
    "no jump cuts, no camera movement, no zoom, photorealistic, seamless loop.";

  const res = await fetch("https://api.kie.ai/api/v1/jobs/createTask", {
    method: "POST",
    headers: { Authorization: `Bearer ${key()}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "kling-2.6/image-to-video",
      input: { prompt, image_urls: [imageUrl], sound: false, duration: "10" },
    }),
  });
  const json = await res.json();
  return NextResponse.json(json);
}
