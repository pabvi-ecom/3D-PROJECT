import { getRecord, updateRecord } from "@/lib/airtable";
import { createImageToModelTask } from "@/lib/tripo";
import { generateAngled } from "@/lib/views";

/**
 * Referencias de imagen que guardamos por figura, serializadas en el campo
 * "Views" de Airtable (reutilizado para no crear campos nuevos — el token es
 * solo de datos). Formato JSON {a,o}:
 *   a = foto 3/4 SIN base (la que va a Tripo y se ve en el dashboard)
 *   o = foto ORIGINAL que subió el cliente (para verificar parecido)
 * Compatibilidad: registros viejos tenían una URL http pelada = la 3/4.
 */
export type ImgRefs = {
  angled?: string;
  original?: string;
  // Elecciones del cliente (para verlas en el dashboard).
  base?: boolean; // eligió base
  name?: boolean; // eligió nombre grabado
  accessory?: string; // etiqueta del accesorio, o "" / "none" si ninguno
  tail?: string; // "long" | "short" | "none" -> la cola la dice el dueño
  breed?: string; // raza (la dice el dueño) -> proporciones/morro correctos
};

export function parseImgRefs(raw?: string): ImgRefs {
  if (!raw) return {};
  const s = raw.trim();
  if (s.startsWith("{")) {
    try {
      const j = JSON.parse(s) as {
        a?: string; o?: string; angled?: string; original?: string;
        base?: boolean; name?: boolean; accessory?: string; tail?: string; breed?: string;
      };
      return {
        angled: j.a ?? j.angled ?? undefined,
        original: j.o ?? j.original ?? undefined,
        base: j.base,
        name: j.name,
        accessory: j.accessory,
        tail: j.tail,
        breed: j.breed,
      };
    } catch {
      return {};
    }
  }
  if (s.startsWith("http")) return { angled: s }; // formato viejo
  return {};
}

export function serializeImgRefs(r: ImgRefs): string {
  const out: Record<string, unknown> = { a: r.angled ?? "", o: r.original ?? "" };
  if (r.base !== undefined) out.base = r.base;
  if (r.name !== undefined) out.name = r.name;
  if (r.accessory !== undefined) out.accessory = r.accessory;
  if (r.tail !== undefined) out.tail = r.tail;
  if (r.breed !== undefined) out.breed = r.breed;
  return JSON.stringify(out);
}

/** Guarda/mergea refs de imagen en "Views" sin pisar lo que ya hubiera. */
export async function mergeImgRefs(table: "Leads" | "OrderItems", id: string, patch: ImgRefs): Promise<ImgRefs> {
  const record = await getRecord(table, id);
  const cur = parseImgRefs(record.fields["Views"] as string | undefined);
  const next = { ...cur, ...patch };
  await updateRecord(table, id, { Views: serializeImgRefs(next) });
  return next;
}

/**
 * Lanza la generación 3D en Tripo single-image (máxima calidad) para un
 * registro (Lead u OrderItem). Usa la foto 3/4 SIN base; si no existe, la
 * genera y la guarda. La base y el nombre se montan después en Blender.
 * Compartido por el dashboard (/api/admin/produce-3d) y el webhook de Stripe.
 */
export async function launchTripo(table: "Leads" | "OrderItems", id: string): Promise<string> {
  const record = await getRecord(table, id);
  const figureUrl = record.fields["Figure Image URL"] as string | undefined;
  if (!figureUrl) throw new Error("No figure image on this record");

  const refs = parseImgRefs(record.fields["Views"] as string | undefined);
  let angledUrl = refs.angled;
  if (!angledUrl) {
    angledUrl = await generateAngled(figureUrl, refs.tail, refs.breed);
    await updateRecord(table, id, { Views: serializeImgRefs({ ...refs, angled: angledUrl }) });
  }

  const taskId = await createImageToModelTask(angledUrl);
  await updateRecord(table, id, { "Tripo Task ID": taskId, "Tripo Status": "Processing", "Model File URL": "" });
  return taskId;
}
