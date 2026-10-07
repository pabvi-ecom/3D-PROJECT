"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import styles from "./CreateFlow.module.css";
import { brand } from "@/config/brand";
import { poses, paidBases, bases, figureStyles, accessories, paidAccessories, NO_BASE_ID, NO_ACCESSORY_ID, NAMEPLATE_PRICE } from "@/config/products";
import { COMPOSE_DISPLAY_BASE } from "@/config/flags";
import type { Zone } from "@/config/zones";
import { Timeline, type StepId } from "./Timeline";
import { AnnouncementBar } from "../studio/AnnouncementBar";

const FIGURE_PRICE = 79.99;

const REVIEWS = [
  { src: "/examples/lifestyle-coco.jpg", name: "Coco", breed: "Cocker Spaniel", text: "I loved it so much I teared up opening the box." },
  { src: "/examples/lifestyle-cooper.jpg", name: "Cooper", breed: "Havanese mix", text: "Best gift I've ever given — my mom cried." },
  { src: "/examples/lifestyle-daisy.jpg", name: "Daisy", breed: "Goldendoodle", text: "So much better than a photo. It's actually her." },
  { src: "/examples/lifestyle-bailey.jpg", name: "Bailey", breed: "Dalmatian", text: "Even got his spots exactly right, down to the last one." },
  { src: "/examples/lifestyle-luna.jpg", name: "Luna", breed: "French Bulldog", text: "Every wrinkle, spot on. I still can't believe it." },
  { src: "/examples/lifestyle-charlie.jpg", name: "Charlie", breed: "Cavalier Spaniel", text: "Gave it to my sister and she full-on cried." },
  { src: "/examples/lifestyle-milo.jpg", name: "Milo", breed: "Beagle", text: "Ordered one, then immediately ordered two more." },
  { src: "/examples/lifestyle-oliver.jpg", name: "Oliver", breed: "Maine Coon", text: "That fluff — they actually nailed it." },
];

const key = (poseId: string, baseId: string, view: "front" | "side" = "front") => `${poseId}|${baseId}|${view}`;

type CartItem = {
  id: string;
  petName: string;
  figureUrl: string | null;
  // Versión SIN nombre grabado (placa en blanco) — es la que se manda a
  // Tripo/producción. El texto de la placa se añade aparte (real, nítido),
  // nunca la que reconstruye la IA desde la foto (sale borroso).
  figureUrlPlain: string | null;
  originalUrl: string | null; // foto REAL del cliente (para verificar parecido en el dashboard)
  poseLabel: string;
  baseLabel: string;
  hasNameplate: boolean;
  baseChosen: boolean;
  accessoryLabel: string; // etiqueta del accesorio o "none"
  tail: string; // "long" | "short" | "none"
  unitPrice: number;
  firstUnitDiscountPct: number; // 0 = primera figura del pedido, .35 = mascota nueva añadida después
  qty: number; // unidad 1: firstUnitDiscountPct · unidad 2: -50% · unidad 3+: precio completo
};

// Precio de la unidad N (1-based) de un artículo del carrito.
function unitPriceAt(it: CartItem, n: number): number {
  if (n === 1) return it.unitPrice * (1 - it.firstUnitDiscountPct);
  if (n === 2) return it.unitPrice * 0.5;
  return it.unitPrice;
}
function itemTotal(it: CartItem): number {
  let sum = 0;
  for (let i = 1; i <= it.qty; i++) sum += unitPriceAt(it, i);
  return sum;
}

// Duraciones FIJAS (nada de física "spring" indeterminada) — con spring a
// veces la transición se quedaba a medias y AnimatePresence nunca llegaba a
// montar la siguiente foto, dejando el hueco vacío. Entrada con "pop" +
// desenfoque, salida bastante más rápida (sale disparada hacia arriba).
const POP_EASE: [number, number, number, number] = [0.34, 1.56, 0.64, 1];
const reviewCardVariants = {
  enter: { y: "115%", opacity: 0, scale: 0.75, rotate: -6, filter: "blur(6px)" },
  center: {
    y: 0,
    opacity: 1,
    scale: 1,
    rotate: 0,
    filter: "blur(0px)",
    transition: { y: { duration: 0.55, ease: POP_EASE }, scale: { duration: 0.55, ease: POP_EASE }, rotate: { duration: 0.55, ease: POP_EASE }, opacity: { duration: 0.3 }, filter: { duration: 0.4 } },
  },
  exit: {
    y: "-130%",
    opacity: 0,
    scale: 0.92,
    rotate: 4,
    filter: "blur(2px)",
    transition: { duration: 0.32, ease: [0.55, 0, 0.85, 0.35] as [number, number, number, number] },
  },
};

// Widget flotante tipo "historia" — una review a la vez, entra rápido desde
// abajo, se queda quieta (con un balanceo sutil) y a los 4s sale disparada
// hacia arriba; la siguiente entra justo después. Todas las fotos se
// precargan al montar para que nunca entre una imagen a medio cargar
// (eso es lo que hacía que a veces "no apareciera" la foto).
function ReviewStory() {
  const [idx, setIdx] = useState(0);

  // Muestra la primera reseña al instante (sin esperar a precargar todas — en
  // conexiones lentas eso dejaba el hueco vacío mucho rato). Las imágenes van
  // cargando por su cuenta; en 2o plano se precargan las siguientes.
  useEffect(() => {
    REVIEWS.forEach((r) => {
      const img = new Image();
      img.src = r.src;
    });
    const t = setInterval(() => setIdx((i) => (i + 1) % REVIEWS.length), 4400);
    return () => clearInterval(t);
  }, []);

  const r = REVIEWS[idx];
  return (
    <div className={styles.reviewFloatViewport}>
      <AnimatePresence mode="wait">
        <motion.div
          key={idx}
          className={styles.reviewFloatCard}
          variants={reviewCardVariants}
          initial="enter"
          animate="center"
          exit="exit"
        >
          <motion.div
            className={styles.reviewFloatInner}
            animate={{ y: [0, -5, 0, 3, 0], rotate: [0, -0.6, 0, 0.6, 0] }}
            transition={{ duration: 3.4, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
          >
            <img src={r.src} alt="" />
            <div className={styles.reviewFloatCaption}>
              <span className={styles.reviewFloatStars}>★★★★★</span>
              <p>&ldquo;{r.text}&rdquo;</p>
              <span>{r.name} · {r.breed}</span>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

export function CreateFlow({ zone, initialName }: { zone: Zone; initialName?: string }) {
  const router = useRouter();
  const animal = zone.animal;

  const [step, setStep] = useState<StepId>("email");
  const [email, setEmail] = useState("");
  const [leadId, setLeadId] = useState<string | null>(null);
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  const savedFigureRef = useRef<string | null>(null);
  const [emailDraft, setEmailDraft] = useState("");
  const [petName, setPetName] = useState(initialName ?? "");
  const [nameDraft, setNameDraft] = useState(initialName ?? "");

  const [photo, setPhoto] = useState<string | null>(null);
  // Fotos extra OPCIONALES — más ángulos = más fidelidad del perro. Se mandan
  // como referencias adicionales a la generación.
  const [photo2, setPhoto2] = useState<string | null>(null);
  const [photo3, setPhoto3] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [tail, setTail] = useState<"long" | "short" | "none">("long");
  const [readingFile, setReadingFile] = useState(false);
  const [figures, setFigures] = useState<Record<string, string>>({});
  const [namedFigures, setNamedFigures] = useState<Record<string, string>>({});
  const [nameLoading, setNameLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [poseId, setPoseId] = useState(poses[0].id);
  const [styleId, setStyleId] = useState("realistic");
  const [styleFigures, setStyleFigures] = useState<Record<string, string>>({});
  // Cachea las variantes (base/nombre/vista) ya generadas por estilo — si el
  // usuario cambia de estilo y luego vuelve a uno que ya generó antes, se
  // reutilizan en vez de volver a llamar a la IA.
  const variantsCacheRef = useRef<Record<string, { figures: Record<string, string>; namedFigures: Record<string, string> }>>({});
  const [baseId, setBaseId] = useState(NO_BASE_ID);
  const [view, setView] = useState<"front" | "side">("front");
  const [addName, setAddName] = useState(false);
  const [quality, setQuality] = useState<"hd" | "4k">("4k");
  const [accessoryId, setAccessoryId] = useState(NO_ACCESSORY_ID);
  // Imagen con accesorio aplicado, por combinacion base|accesorio.
  const [accessoryFigures, setAccessoryFigures] = useState<Record<string, string>>({});
  const [stepLoading, setStepLoading] = useState(false);
  // Pre-generacion de accesorios en 2o plano: espejo de accessoryFigures (para
  // leer el estado mas reciente dentro de promesas) + promesa por combinacion
  // base|nombre para no lanzar el lote dos veces.
  const accFiguresRef = useRef<Record<string, string>>({});
  const accGenRef = useRef<Record<string, Promise<void> | undefined>>({});
  useEffect(() => { accFiguresRef.current = accessoryFigures; }, [accessoryFigures]);
  // En el paso de base, en cuanto la imagen de partida (base y/o nombre) esté
  // lista, pre-genera los accesorios en 2º plano para la combinación actual —
  // así al pulsar Continuar normalmente ya están todos y el cambio es instantáneo.
  useEffect(() => {
    if (step !== "base") return;
    if (!wantsBase) {
      if (styleFigures[styleId]) startAccessoryGen(NO_BASE_ID, false);
    } else if (addName) {
      if (namedFigures[baseId]) startAccessoryGen(baseId, true);
    } else if (figures[key(poseId, baseId, "front")]) {
      startAccessoryGen(baseId, false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, baseId, addName, styleFigures, figures, namedFigures]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [discountCode, setDiscountCode] = useState("");
  const [unlockedDiscounts, setUnlockedDiscounts] = useState<{ pct: number; code: string }[]>([]);
  const [appliedDiscount, setAppliedDiscount] = useState<{ pct: number; code: string } | null>(null);
  const [discountError, setDiscountError] = useState<string | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(0);
  const [genTotal, setGenTotal] = useState(figureStyles.length);
  const [phraseIdx, setPhraseIdx] = useState(0);
  const [reviewIdx, setReviewIdx] = useState(0);

  const fileRef = useRef<HTMLInputElement>(null);
  const fileRef2 = useRef<HTMLInputElement>(null);
  const fileRef3 = useRef<HTMLInputElement>(null);

  const pose = poses.find((p) => p.id === poseId) ?? poses[0];
  const base = bases.find((b) => b.id === baseId) ?? bases[0];
  const accessory = accessories.find((a) => a.id === accessoryId) ?? accessories[0];
  const wantsBase = baseId !== NO_BASE_ID;
  const hasAccessory = accessoryId !== NO_ACCESSORY_ID;
  // El grabado del nombre se elige en el paso de base (requiere base) y ocurre
  // ANTES de los accesorios. namedFigures se cachea por baseId.
  const showEngraved = wantsBase && addName;
  // Imagen del paso de base: sin base = figura del estilo; con base = pedestal,
  // grabada si el usuario pidió nombre.
  const baseFigure = wantsBase ? (figures[key(poseId, baseId, "front")] ?? null) : (styleFigures[styleId] ?? null);
  const baseStepFigure = showEngraved ? (namedFigures[baseId] ?? null) : baseFigure;
  // Los accesorios se generan encadenados desde la imagen del paso de base, así
  // que la clave incluye base + si lleva nombre.
  const accKey = `${baseId}|${addName ? "n" : "0"}|${accessoryId}`;
  const figure = hasAccessory ? (accessoryFigures[accKey] ?? null) : baseStepFigure;
  const plainFigure = figure;
  const total =
    FIGURE_PRICE + pose.price + base.price + accessory.price + (wantsBase && addName ? NAMEPLATE_PRICE : 0);
  const money = (n: number) => `${brand.currencySymbol}${n.toFixed(2)}`;
  const cartTotal = cart.reduce((sum, it) => sum + itemTotal(it), 0);
  // Los artículos a 0 unidades se quedan en el carrito (para poder volver a
  // subirlos) pero no cuentan de cara al checkout.
  const activeCart = cart.filter((it) => it.qty > 0);
  const discountAmount = appliedDiscount ? cartTotal * (appliedDiscount.pct / 100) : 0;
  const finalTotal = cartTotal - discountAmount;

  // Progreso hacia el envío gratis — cuenta lo que ya hay en el carrito MÁS
  // la figura que está a punto de añadirse (aún no está en `cart` en "reveal").
  const projectedTotal = cartTotal + total;
  const shippingRemaining = Math.max(0, brand.freeShippingThreshold - projectedTotal);
  const shippingPct = Math.min(100, (projectedTotal / brand.freeShippingThreshold) * 100);

  const PHRASES = [
    `Sculpting your ${animal}…`,
    "Loading textures…",
    "Building fine definition…",
    "Capturing every marking and color…",
    "Getting the proportions just right…",
    "Polishing the details…",
    "Almost there — rendering the final image…",
  ];

  useEffect(() => {
    if (!generating) return;
    setPhraseIdx(0);
    setReviewIdx(0);
    const t = setInterval(() => {
      setPhraseIdx((i) => i + 1);
      setReviewIdx((i) => (i + 1) % REVIEWS.length);
    }, 2600);
    return () => clearInterval(t);
  }, [generating]);

  // Progreso SIMULADO por tiempo: sube constante desde el principio (no se
  // clava al 20%), y al acercarse al 97% frena pero nunca se detiene del todo.
  // Al terminar la generación, las funciones ponen el progreso a 100.
  useEffect(() => {
    if (!generating) return;
    const t = setInterval(() => {
      setProgress((p) => (p >= 97 ? 97 : p + (97 - p) * 0.014 + 0.18));
    }, 300);
    return () => clearInterval(t);
  }, [generating]);

  async function postGenerate(body: Record<string, unknown>): Promise<string> {
    const res = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ zone: zone.slug, ...body }),
    });
    let json: { url?: string; originalUrl?: string; error?: string } = {};
    try {
      json = await res.json();
    } catch {
      // El servidor puede devolver texto plano (ej. "Request Entity Too Large")
      // cuando el error ocurre antes de llegar a nuestro código (límite de tamaño
      // del body, timeout de la plataforma, etc.) — no es JSON válido.
      throw new Error(res.status === 413 ? "That photo is too large. Try a smaller one." : "Couldn't generate");
    }
    if (!res.ok) throw new Error(json.error ?? "Couldn't generate");
    // Guarda la foto ORIGINAL del cliente la primera vez que el server la
    // devuelve (para poder verificar el parecido en el dashboard).
    if (json.originalUrl) setOriginalUrl((cur) => cur ?? json.originalUrl ?? null);
    return json.url as string;
  }

  // Graba el nombre en la base (paso de base, antes de accesorios). Se genera
  // desde la imagen de la base y se cachea por baseId.
  useEffect(() => {
    if (!showEngraved || namedFigures[baseId] || nameLoading) return;
    const src = figures[key(poseId, baseId, "front")];
    if (!src) return;
    let cancelled = false;
    setNameLoading(true);
    postGenerate({ referenceUrl: src, change: "name", baseId, petName })
      .then((url) => {
        if (!cancelled) setNamedFigures((m) => ({ ...m, [baseId]: url }));
      })
      .catch((e) => !cancelled && setError((e as Error).message))
      .finally(() => !cancelled && setNameLoading(false));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showEngraved, baseId, petName, figures]);

  // Fase 1: genera las TRES variantes de estilo a la vez (sin base, sin
  // nombre) para que el usuario elija la que más le guste — genera hype al
  // ver varias opciones en vez de una sola.
  async function generatePreviews(dataUri: string) {
    setGenerating(true);
    setError(null);
    setStyleFigures({});
    setFigures({});
    setNamedFigures({});
    setAccessoryFigures({});
    setAccessoryId(NO_ACCESSORY_ID);
    variantsCacheRef.current = {};
    setGenTotal(figureStyles.length);
    setDone(0);
    setProgress(0);
    setPoseId(poses[0].id);
    setBaseId(NO_BASE_ID);
    setView("front");
    setAddName(false);
    try {
      // allSettled: si un estilo falla (ej. el filtro de seguridad de Gemini
      // marca esa generación en concreto), no tira abajo los demás — el
      // usuario aún puede elegir entre los que sí salieron bien.
      const extraImages = [photo2, photo3].filter((p): p is string => !!p);
      // Reintento por estilo: nano-banana a veces falla un estilo suelto (filtro
      // de seguridad o timeout). Reintentamos ese estilo una vez para que NO se
      // quede sin mostrar (antes se perdía, p. ej. faltaba el realista).
      const genStyle = async (sid: string): Promise<readonly [string, string]> => {
        const body = { imageBase64: dataUri, extraImages, poseId: poses[0].id, baseId: NO_BASE_ID, notes: notes.trim() || undefined, styleId: sid, tail };
        // Hasta 3 intentos: nano-banana a veces tumba un estilo suelto (filtro
        // de seguridad / timeout). Con 3 casi nunca se queda sin mostrar.
        let lastErr: unknown;
        for (let i = 0; i < 3; i++) {
          try {
            return [sid, await postGenerate(body)] as const;
          } catch (e) {
            lastErr = e;
          }
        }
        throw lastErr;
      };
      const settled = await Promise.allSettled(
        figureStyles.map((s) =>
          genStyle(s.id).then((r) => {
            setDone((d) => d + 1);
            return r;
          }),
        ),
      );
      const map: Record<string, string> = {};
      for (const r of settled) if (r.status === "fulfilled") map[r.value[0]] = r.value[1];
      if (Object.keys(map).length === 0) {
        const firstError = settled.find((r): r is PromiseRejectedResult => r.status === "rejected");
        throw new Error((firstError?.reason as Error)?.message ?? "Couldn't generate");
      }
      setStyleFigures(map);
      setStyleId(map["realistic"] ? "realistic" : Object.keys(map)[0]);
      setProgress(100);
      setStep("style");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setGenerating(false);
    }
  }

  // Genera (o devuelve de cache) la imagen con una base concreta, encadenada
  // desde la figura del estilo elegido.
  // Composición por código (perro recortado + base fija + nombre). Rápida.
  async function postCompose(figureUrl: string, name?: string): Promise<string> {
    const res = await fetch("/api/compose-base", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ figureUrl, petName: name }),
    });
    const json = await res.json();
    if (!res.ok || !json.url) throw new Error(json.error ?? "compose failed");
    return json.url as string;
  }

  async function ensureBase(id: string): Promise<string | null> {
    if (id === NO_BASE_ID) return styleFigures[styleId] ?? null;
    const k = key(poseId, id, "front");
    if (figures[k]) return figures[k];
    const chosen = styleFigures[styleId];
    if (!chosen) return null;
    const url = COMPOSE_DISPLAY_BASE
      ? await postCompose(chosen)
      : await postGenerate({ referenceUrl: chosen, change: "base", baseId: id });
    setFigures((m) => ({ ...m, [k]: url }));
    return url;
  }

  // Genera (o cache) la versión grabada de una base concreta.
  async function ensureNamed(id: string): Promise<string | null> {
    if (namedFigures[id]) return namedFigures[id];
    if (COMPOSE_DISPLAY_BASE) {
      const chosen = styleFigures[styleId];
      if (!chosen) return null;
      const url = await postCompose(chosen, petName);
      setNamedFigures((m) => ({ ...m, [id]: url }));
      return url;
    }
    const src = figures[key(poseId, id, "front")] ?? (await ensureBase(id));
    if (!src) return null;
    const url = await postGenerate({ referenceUrl: src, change: "name", baseId: id, petName });
    setNamedFigures((m) => ({ ...m, [id]: url }));
    return url;
  }

  // Fase 2: tras elegir el estilo -> pantalla de carga mientras se genera la
  // base de mármol (para que el preview y el toggle sean instantáneos), luego
  // muestra el paso de base con el mármol ya seleccionado.
  async function goToBase() {
    const firstBase = paidBases[0]?.id ?? NO_BASE_ID;
    // Por defecto SIN base — el usuario debe elegir el pedestal si lo quiere.
    setBaseId(NO_BASE_ID);
    setAddName(false);
    setAccessoryId(NO_ACCESSORY_ID);
    setGenerating(true);
    setError(null);
    setGenTotal(2);
    setDone(0);
    setProgress(0);
    try {
      // Precarga en 2o plano la base de mármol y su versión con nombre — así,
      // si el usuario la elige en el paso siguiente, ya está lista al instante.
      await ensureBase(firstBase);
      setDone(1);
      await ensureNamed(firstBase).catch(() => null);
      setDone(2);
      setProgress(100);
      setStep("base");
    } catch (e) {
      setError((e as Error).message);
      setStep("style");
    } finally {
      setGenerating(false);
    }
  }

  // En el paso de base, cambiar entre sin base / mármol (imágenes ya cacheadas).
  function selectBase(id: string) {
    setBaseId(id);
    setAddName(false);
    setAccessoryId(NO_ACCESSORY_ID);
    if (id !== NO_BASE_ID && !figures[key(poseId, id, "front")]) {
      setStepLoading(true);
      ensureBase(id)
        .catch((e) => setError((e as Error).message))
        .finally(() => setStepLoading(false));
    }
  }

  // Fase 3: tras confirmar base (+nombre) -> pantalla de carga mientras se
  // generan las 3 opciones de accesorio a partir de la imagen del paso de base.
  // Al entrar al paso de accesorios ya están todas listas.
  // Imagen de partida del accesorio para la combinación base|nombre actual.
  async function accessorySource(bId: string, named: boolean): Promise<string | null> {
    if (bId === NO_BASE_ID) return styleFigures[styleId] ?? null;
    if (named) return ensureNamed(bId);
    return ensureBase(bId);
  }

  // Lanza (una vez por combinación) la generación de los accesorios que falten,
  // con reintento. Cacheada en accGenRef para poder esperarla luego.
  function startAccessoryGen(bId: string, named: boolean): Promise<void> {
    const combo = `${bId}|${named ? "n" : "0"}`;
    const existing = accGenRef.current[combo];
    if (existing) return existing;
    const p = (async () => {
      const src = await accessorySource(bId, named);
      if (!src) return;
      await Promise.allSettled(
        paidAccessories.map(async (a) => {
          const k = `${combo}|${a.id}`;
          if (accFiguresRef.current[k]) return;
          let url: string;
          try {
            url = await postGenerate({ referenceUrl: src, change: "accessory", baseId: bId, accessoryId: a.id });
          } catch {
            url = await postGenerate({ referenceUrl: src, change: "accessory", baseId: bId, accessoryId: a.id });
          }
          setAccessoryFigures((m) => ({ ...m, [k]: url }));
        }),
      );
    })();
    accGenRef.current[combo] = p;
    return p;
  }

  async function goToAccessory() {
    setAccessoryId(NO_ACCESSORY_ID);
    const combo = `${baseId}|${addName ? "n" : "0"}`;
    const allReady = paidAccessories.every((a) => accessoryFigures[`${combo}|${a.id}`]);
    if (allReady) {
      // Ya pre-generadas en 2º plano → entra al instante, sin pantalla de carga.
      setStep("accessory");
      return;
    }
    setGenerating(true);
    setError(null);
    setGenTotal(paidAccessories.length);
    setDone(0);
    setProgress(0);
    try {
      await startAccessoryGen(baseId, addName);
      setProgress(100);
      setStep("accessory");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setGenerating(false);
    }
  }

  // Las fotos de móvil pueden pesar varios MB — en base64 crecen ~33% más y
  // podían superar el límite de tamaño del body en el servidor (413). Las
  // reescalamos a un máximo razonable antes de mandarlas.
  function resizeImage(dataUri: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const MAX = 1600;
        const scale = Math.min(1, MAX / Math.max(img.width, img.height));
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) return resolve(dataUri);
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", 0.85));
      };
      img.onerror = () => reject(new Error("bad image"));
      img.src = dataUri;
    });
  }

  function readInto(f: File, setter: (v: string | null) => void) {
    setError(null);
    setReadingFile(true);
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUri = reader.result as string;
      try {
        setter(await resizeImage(dataUri));
      } catch {
        // Suele pasar con fotos HEIC de iPhone — el navegador no las puede
        // decodificar. Mejor avisar claro que guardar una imagen rota que
        // luego falla en silencio al generar.
        setter(null);
        setError("We couldn't read that photo. If it's an iPhone HEIC photo, try a screenshot of it, or a JPG/PNG instead.");
      } finally {
        setReadingFile(false);
      }
    };
    reader.onerror = () => {
      setReadingFile(false);
      setError("Couldn't read that photo");
    };
    reader.readAsDataURL(f);
  }

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) readInto(f, setPhoto);
  }

  // TODO: cuando salga de pruebas, exigir formato @gmail.com aquí (pedido explícito).
  function confirmEmail(e: React.FormEvent) {
    e.preventDefault();
    const v = emailDraft.trim();
    if (!v || !v.includes("@")) return;
    setEmail(v);
    fetch("/api/lead", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: v, zone: zone.slug }),
    })
      .then((r) => r.json())
      .then((json) => {
        if (typeof json.id === "string") setLeadId(json.id);
      })
      .catch(() => {});
    setStep(initialName ? "photo" : "name");
  }

  function confirmName(e: React.FormEvent) {
    e.preventDefault();
    const n = nameDraft.trim();
    if (!n) return;
    setPetName(n.charAt(0).toUpperCase() + n.slice(1));
    setStep("photo");
  }

  function goReveal() {
    setStep("reveal");
  }

  function buildCurrentItem(firstUnitDiscountPct: number, qty: number): CartItem {
    return {
      id: `${Date.now()}-${Math.random()}`,
      petName,
      figureUrl: figure,
      figureUrlPlain: plainFigure,
      originalUrl,
      poseLabel: pose.label,
      baseLabel: hasAccessory ? `${base.label} · ${accessory.label}` : base.label,
      hasNameplate: wantsBase && addName,
      baseChosen: wantsBase,
      accessoryLabel: hasAccessory ? accessory.label : "none",
      tail,
      unitPrice: total,
      firstUnitDiscountPct,
      qty,
    };
  }

  // Mete la figura recién configurada en el carrito. La primera figura del
  // pedido siempre va a precio completo; cualquier mascota NUEVA añadida
  // después (a través de todo el asistente) lleva el descuento de -35% en
  // su primera unidad.
  function addCurrentToCart() {
    setCart((c) => [...c, buildCurrentItem(cart.length === 0 ? 0 : 0.35, 1)]);
  }

  function confirmAddToCart() {
    addCurrentToCart();
    setStep("ready");
  }

  // Añade la figura en curso directamente con cantidad 2 (la 2ª unidad ya
  // sale a -50% por la propia lógica de itemTotal/unitPriceAt).
  function confirmAddTwin() {
    setCart((c) => [...c, buildCurrentItem(cart.length === 0 ? 0 : 0.35, 2)]);
    setStep("ready");
  }

  function confirmAddDifferentPet() {
    addCurrentToCart();
    startNewPet();
  }

  function incrementQty(id: string) {
    setCart((c) => c.map((it) => (it.id === id ? { ...it, qty: it.qty + 1 } : it)));
  }
  // Baja hasta 0 (no elimina el artículo) — así se puede volver a subirlo
  // sin tener que reconfigurar la figura desde cero.
  function decrementQty(id: string) {
    setCart((c) => c.map((it) => (it.id === id && it.qty > 0 ? { ...it, qty: it.qty - 1 } : it)));
  }

  // Reinicia los campos de "mascota en curso" para configurar una nueva
  // figura desde cero (foto distinta) sin perder lo que ya hay en el carrito.
  function startNewPet() {
    setPetName("");
    setNameDraft("");
    setPhoto(null);
    setPhoto2(null);
    setPhoto3(null);
    setNotes("");
    setFigures({});
    setNamedFigures({});
    setStyleFigures({});
    setAccessoryFigures({});
    setAccessoryId(NO_ACCESSORY_ID);
    variantsCacheRef.current = {};
    setPoseId(poses[0].id);
    setStyleId("realistic");
    setBaseId(NO_BASE_ID);
    setView("front");
    setAddName(false);
    setStep("name");
  }

  const STEP_ORDER: StepId[] = ["email", "name", "photo", "quality", "style", "base", "accessory", "reveal", "ready"];
  function goBack() {
    const idx = STEP_ORDER.indexOf(step);
    if (idx > 0) setStep(STEP_ORDER[idx - 1]);
  }

  const BackBtn = (
    <button type="button" className={styles.stepBack} onClick={goBack} aria-label="Go back">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5" /><path d="m11 18-6-6 6-6" /></svg>
    </button>
  );

  useEffect(() => {
    if (step !== "reveal") return;
    const colors = ["#0071E3", "#F4B400", "#34A853"];
    confetti({ particleCount: 90, spread: 75, startVelocity: 42, origin: { x: 0.5, y: 0.35 }, colors });
    const t1 = setTimeout(() => confetti({ particleCount: 50, angle: 60, spread: 65, startVelocity: 38, origin: { x: 0, y: 0.4 }, colors }), 150);
    const t2 = setTimeout(() => confetti({ particleCount: 50, angle: 120, spread: 65, startVelocity: 38, origin: { x: 1, y: 0.4 }, colors }), 150);

    // Guarda la figura ya generada en Airtable (Leads) en cuanto el cliente
    // la ve — así queda registrada aunque no llegue a comprar, y sirve de
    // fuente para Tripo. Se guarda LA QUE VE EL CLIENTE (con el nombre
    // grabado si eligió placa): Tripo P2+8K reconstruye la placa nítida
    // directamente de esa imagen, sin retoques posteriores.
    if (leadId && figure && savedFigureRef.current !== figure) {
      savedFigureRef.current = figure;
      fetch("/api/lead-figure", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadId,
          figureUrl: figure,
          petName,
          originalUrl,
          base: wantsBase,
          name: wantsBase && addName,
          accessory: hasAccessory ? accessory.label : "none",
          tail,
        }),
      }).catch(() => {});
    }

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [step, leadId, figure, plainFigure, petName, originalUrl, wantsBase, addName, hasAccessory, accessory.label, tail]);

  function copyCode(code: string) {
    navigator.clipboard?.writeText(code).catch(() => {});
    setCopiedCode(code);
    setTimeout(() => setCopiedCode((c) => (c === code ? null : c)), 1600);
  }

  // Solo son válidos los códigos que el propio jugador desbloqueó en el
  // minijuego durante esta sesión — no hay una lista universal de cupones.
  function applyCode(rawCode: string) {
    const code = rawCode.trim().toUpperCase();
    const match = unlockedDiscounts.find((d) => d.code.toUpperCase() === code);
    if (!match) {
      setAppliedDiscount(null);
      setDiscountError("That code isn't valid — play the mini-game to earn one.");
      return;
    }
    setAppliedDiscount(match);
    setDiscountError(null);
    setDiscountCode(match.code);
  }

  async function goCheckout() {
    setCheckoutLoading(true);
    setCheckoutError(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          zone: zone.slug,
          email,
          cart: activeCart,
          discountCode: appliedDiscount?.code,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.url) throw new Error(json.error ?? "Couldn't start checkout");
      window.location.href = json.url;
    } catch (e) {
      setCheckoutError((e as Error).message);
      setCheckoutLoading(false);
    }
  }

  const timelineStep: StepId = ["accessory", "reveal"].includes(step) ? "base" : step;

  return (
    <div className={styles.page}>
      <input ref={fileRef} type="file" accept="image/*" hidden onChange={onFile} />
      <input ref={fileRef2} type="file" accept="image/*" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) readInto(f, setPhoto2); }} />
      <input ref={fileRef3} type="file" accept="image/*" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) readInto(f, setPhoto3); }} />

      <AnnouncementBar />
      <header className={styles.header}>
        <button className={styles.back} onClick={() => router.push(`/${zone.slug}`)}>← {brand.name}</button>
        <Timeline current={timelineStep} />
        <span className={styles.headerSpacer} />
      </header>

      <main className={`${styles.main} ${generating ? styles.mainWider : step === "style" ? styles.mainWide : ""}`}>
        {step === "email" && (
          <div className={styles.card}>
            <span className={styles.stepTag}>Before we start</span>
            <h1>✉️ Where should we send your free preview?</h1>
            <p className={styles.sub}>Just so we can save it and get it back to you — no spam, ever.</p>
            <form onSubmit={confirmEmail} className={styles.form}>
              <input
                autoFocus
                type="email"
                className={styles.nameInput}
                placeholder="you@email.com"
                value={emailDraft}
                onChange={(e) => setEmailDraft(e.target.value)}
              />
              <button type="submit" className={styles.cta} disabled={!emailDraft.trim().includes("@")}>
                Continue
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></svg>
              </button>
            </form>
          </div>
        )}

        {step === "name" && (
          <div className={styles.card}>
            <div className={styles.stepHead}>{BackBtn}<span className={styles.stepTag}>Step 2 of 5</span></div>
            <h1>✏️ What&apos;s your pet&apos;s name?</h1>
            <p className={styles.sub}>We&apos;ll use it to personalize your preview and engrave it if you add a display base.</p>
            <form onSubmit={confirmName} className={styles.form}>
              <input
                autoFocus
                className={styles.nameInput}
                maxLength={20}
                placeholder="Your pet's name"
                value={nameDraft}
                onChange={(e) => setNameDraft(e.target.value)}
              />
              <button type="submit" className={styles.cta} disabled={!nameDraft.trim()}>
                Continue
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></svg>
              </button>
            </form>
          </div>
        )}

        {step === "photo" && !generating && (
          <div className={styles.card}>
            <div className={styles.stepHead}>{BackBtn}<span className={styles.stepTag}>Step 3 of 6</span></div>
            <h1>📸 Upload a photo of {petName}</h1>
            <p className={styles.sub}>Any normal snapshot works best when it&apos;s clear and front-facing.</p>
            {photo ? (
              <div className={styles.photoPreview}>
                <img
                  src={photo}
                  alt=""
                  onError={() => {
                    setPhoto(null);
                    setError("That photo couldn't be displayed. Please try a different one (JPG or PNG).");
                  }}
                />
                <button className={styles.changePhoto} onClick={() => fileRef.current?.click()}>Change photo</button>
              </div>
            ) : (
              <button className={styles.uploadBox} onClick={() => fileRef.current?.click()} disabled={readingFile}>
                <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 16V4" /><path d="m6 10 6-6 6 6" /><path d="M4 18v1a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-1" /></svg>
                <span>{readingFile ? "Loading…" : "Tap to choose a photo"}</span>
              </button>
            )}

            {photo && (
              <div className={styles.extraPhotos}>
                <p className={styles.extraNote}>
                  📸 Add 1–2 more photos from other angles (side, back) — the more we see of {petName}, the more accurate the figure.
                </p>
                <div className={styles.extraSlots}>
                  {[{ p: photo2, set: setPhoto2, ref: fileRef2 }, { p: photo3, set: setPhoto3, ref: fileRef3 }].map((slot, i) => (
                    <button key={i} type="button" className={styles.extraSlot} onClick={() => slot.ref.current?.click()}>
                      {slot.p ? (
                        <img src={slot.p} alt="" />
                      ) : (
                        <span className={styles.extraPlus}>+ Photo {i + 2}<small>optional</small></span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <p className={styles.qualityPrompt}>Your pet&apos;s tail</p>
            <div className={styles.qualityGrid}>
              {([["long", "Long tail"], ["short", "Short tail"], ["none", "No tail"]] as const).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  className={`${styles.qualityCard} ${tail === id ? styles.qualityCardActive : ""}`}
                  onClick={() => setTail(id)}
                >
                  <span className={styles.qualityName}>{label}</span>
                </button>
              ))}
            </div>

            <label className={styles.notesLabel}>
              Anything we can&apos;t tell from the photo?
              <textarea
                className={styles.notesInput}
                placeholder="e.g. &quot;no tail&quot;, one blue eye…"
                maxLength={200}
                rows={1}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </label>

            {error && <div className={styles.err}>{error}</div>}

            {photo && (
              <>
                <p className={styles.qualityPrompt}>Choose your quality</p>
                <div className={styles.qualityGrid}>
                  <button
                    className={`${styles.qualityCard} ${quality === "hd" ? styles.qualityCardActive : ""}`}
                    onClick={() => setQuality("hd")}
                  >
                    <span className={styles.qualityName}>HD</span>
                    <span className={styles.qualityMeta}>Ready in ~45 seconds</span>
                  </button>
                  <button
                    className={`${styles.qualityCard} ${quality === "4k" ? styles.qualityCardActive : ""}`}
                    onClick={() => setQuality("4k")}
                  >
                    <span className={styles.popBadge}>Best quality</span>
                    <span className={styles.qualityName}>Full HD 4K</span>
                    <span className={styles.qualityMeta}>Ready in ~90 seconds</span>
                  </button>
                </div>
                <button className={styles.cta} onClick={() => generatePreviews(photo)}>
                  Continue
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></svg>
                </button>
              </>
            )}
          </div>
        )}

        {generating && (
          <div className={styles.genWrap}>
            <div className={styles.genPanel}>
              <span className={styles.stepTag}>Generating your preview…</span>
              <h1 className={styles.genTitle}>Bringing <span className={styles.petNameHighlight}>{petName}</span> to life</h1>
              <div className={styles.progTrackBig}>
                <div className={styles.progFill} style={{ width: `${progress}%` }} />
              </div>
              <span className={styles.progPct}>{Math.round(progress)}%</span>
              <p className={styles.progPhraseBig}>{PHRASES[phraseIdx % PHRASES.length]}</p>
            </div>
            <div className={styles.genReviewSide}>
              <ReviewStory />
            </div>
          </div>
        )}

        {step === "style" && !generating && (
          <div className={styles.card}>
            <div className={styles.stepHead}>{BackBtn}<span className={styles.stepTag}>Step 4 of 6</span></div>
            <h1>✨ Pick your style</h1>
            <p className={styles.sub}>Pick the one that feels most like {petName}.</p>
            <div className={styles.styleGrid}>
              {figureStyles.filter((s) => styleFigures[s.id]).map((s) => (
                <button
                  key={s.id}
                  className={`${styles.styleCard} ${styleId === s.id ? styles.styleCardActive : ""}`}
                  onClick={() => setStyleId(s.id)}
                >
                  {s.popular && <span className={styles.popBadge}>70% pick this</span>}
                  <img src={styleFigures[s.id]} alt={s.label} />
                  <span className={styles.styleName}>{s.label}</span>
                  <small className={styles.styleDesc}>{s.description}</small>
                </button>
              ))}
            </div>
            <button className={styles.cta} onClick={goToBase}>
              Continue
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></svg>
            </button>
          </div>
        )}

        {step === "base" && !generating && (
          <div className={styles.card}>
            <div className={styles.stepHead}>{BackBtn}<span className={styles.stepTag}>Step 5 of 6</span></div>
            <h1>🏆 Add a display base?</h1>
            <p className={styles.sub}>A marble base makes it shelf-ready.</p>

            <div className={styles.stage}>
              {baseStepFigure && <img src={baseStepFigure} alt={`${animal} figure`} />}
              {(stepLoading || nameLoading) && <div className={styles.stageLoading}>{nameLoading ? "Engraving…" : "Adding the base…"}</div>}
            </div>

            <div className={styles.baseChoice}>
              <button className={`${styles.baseBtn} ${!wantsBase ? styles.baseBtnActive : ""}`} onClick={() => selectBase(NO_BASE_ID)}>
                No base
              </button>
              {paidBases.map((b) => (
                <button key={b.id} className={`${styles.baseBtn} ${baseId === b.id ? styles.baseBtnActive : ""}`} onClick={() => selectBase(b.id)}>
                  <span className={styles.popBadge}>94% pick this</span>
                  {b.label} <small>+{money(b.price)}</small>
                </button>
              ))}
            </div>

            {wantsBase && (
              <label className={styles.toggle}>
                <input type="checkbox" checked={addName} onChange={(e) => setAddName(e.target.checked)} />
                Engrave &quot;{petName.toUpperCase()}&quot; on the base (+{money(NAMEPLATE_PRICE)})
                <span className={styles.popBadgeInline}>99% pick this</span>
              </label>
            )}

            <button className={styles.cta} onClick={goToAccessory} disabled={stepLoading || nameLoading || (wantsBase && !baseStepFigure)}>
              Continue
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></svg>
            </button>

            <button className={styles.linkBtn} onClick={() => setStep("style")}>
              ← Try a different style
            </button>
          </div>
        )}

        {step === "accessory" && !generating && (
          <div className={styles.card}>
            <div className={styles.stepHead}>{BackBtn}<span className={styles.stepTag}>Step 6 of 6</span></div>
            <h1>✨ Add an accessory?</h1>
            <p className={styles.sub}>Dress {petName} up — or keep it as is.</p>

            <div className={styles.stage}>
              {figure && <img src={figure} alt={`${animal} figure`} />}
            </div>

            <div className={styles.baseChoice}>
              <button className={`${styles.baseBtn} ${!hasAccessory ? styles.baseBtnActive : ""}`} onClick={() => setAccessoryId(NO_ACCESSORY_ID)}>
                No accessory
              </button>
              {paidAccessories.map((a) => {
                const ready = !!accessoryFigures[`${baseId}|${addName ? "n" : "0"}|${a.id}`];
                return (
                  <button
                    key={a.id}
                    className={`${styles.baseBtn} ${accessoryId === a.id ? styles.baseBtnActive : ""}`}
                    onClick={() => ready && setAccessoryId(a.id)}
                    disabled={!ready}
                  >
                    {a.emoji} {a.label} {a.price > 0 && <small>+{money(a.price)}</small>}
                    {!ready && <small> · unavailable</small>}
                  </button>
                );
              })}
            </div>

            <button className={styles.cta} onClick={goReveal} disabled={hasAccessory && !figure}>
              Continue
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></svg>
            </button>
          </div>
        )}

        {step === "reveal" && (
          <div className={styles.card}>
            <div className={styles.stepHead}>{BackBtn}<span className={styles.stepTag}>Figure 1 of 1</span></div>

            <div className={styles.shipBar}>
              <span className={styles.shipMsg}>
                {shippingRemaining > 0
                  ? `🚚 You're ${money(shippingRemaining)} away from free shipping!`
                  : "🎉 You've unlocked free shipping!"}
              </span>
              <div className={styles.shipTrack}><div className={styles.shipFill} style={{ width: `${shippingPct}%` }} /></div>
            </div>

            <h1>🎉 You&apos;ve got {petName}&apos;s figure!</h1>
            <p className={styles.sub}>Here&apos;s your finished {animal}.</p>
            <div className={styles.stage}>
              {figure && <img src={figure} alt={`${animal} figure`} />}
            </div>
            <button className={styles.cta} onClick={confirmAddToCart}>
              Add to cart — {money(total)}
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></svg>
            </button>

            <div className={styles.giftPitch} style={{ marginTop: 16 }}>
              <span>🎁 Add a twin of {petName}, to gift</span>
              <b>{money(total * 0.5)} <s>{money(total)}</s></b>
            </div>
            <button className={styles.ctaGhost} onClick={confirmAddTwin}>
              Add to cart + a twin — 50% off the second
            </button>

            <button className={styles.linkBtn} onClick={confirmAddDifferentPet}>
              or add a different pet instead — 35% off →
            </button>
          </div>
        )}

        {step === "ready" && (
          <div className={styles.card}>
            <div className={styles.shipBar}>
              <span className={styles.shipMsg}>
                {shippingRemaining > 0
                  ? `🚚 Add ${money(shippingRemaining)} more to unlock free shipping!`
                  : "🎉 Free shipping unlocked!"}
              </span>
              <div className={styles.shipTrack}><div className={styles.shipFill} style={{ width: `${Math.min(100, (cartTotal / brand.freeShippingThreshold) * 100)}%` }} /></div>
            </div>

            <span className={styles.stepTag}>Your order</span>
            <h1 className={`${styles.readyH1} ${styles.readyH1Tight}`}>
              🎁 {activeCart.length > 1 ? `${activeCart.length} figures are ready` : `${activeCart[0]?.petName ?? petName}'s figure is ready`}
            </h1>

            <div className={styles.cartList}>
              {cart.map((it) => (
                <div key={it.id} className={`${styles.cartItem} ${it.qty === 0 ? styles.cartItemZero : ""}`}>
                  <div className={styles.cartItemStage}>{it.figureUrl && <img src={it.figureUrl} alt={`${it.petName} figure`} />}</div>
                  <div className={styles.cartItemBody}>
                    <b>{it.petName}</b>
                    <span>{it.poseLabel} · {it.baseLabel}{it.hasNameplate ? " · engraved" : ""}</span>
                    {it.qty === 0 && <span className={styles.cartItemBadge}>Not in order — set to 1+ to include</span>}
                    {it.firstUnitDiscountPct > 0 && it.qty > 0 && <span className={styles.cartItemBadge}>{Math.round(it.firstUnitDiscountPct * 100)}% off</span>}
                    {it.qty === 1 && <span className={styles.cartItemBadge}>🎁 50% off your next {it.petName}</span>}
                  </div>
                  <div className={styles.qtyStepper}>
                    <button type="button" onClick={() => decrementQty(it.id)} disabled={it.qty <= 0} aria-label="Remove one">−</button>
                    <span>{it.qty}</span>
                    <button type="button" onClick={() => incrementQty(it.id)} aria-label="Add one">+</button>
                  </div>
                  <div className={styles.cartItemPrice}>
                    <b>{money(itemTotal(it))}</b>
                  </div>
                </div>
              ))}
            </div>

            <button className={styles.linkBtn} onClick={startNewPet}>
              + Add a different pet — 35% off →
            </button>

            {unlockedDiscounts.length > 0 && (
              <div className={styles.unlockedList} style={{ marginTop: 14 }}>
                {unlockedDiscounts.map((d) => (
                  <div key={d.code} className={styles.unlockedRow}>
                    <span>🎟️ {d.pct}% off code ready</span>
                    <button type="button" onClick={() => { applyCode(d.code); copyCode(d.code); }}>
                      <code>{d.code}</code> {copiedCode === d.code ? "✓ Copied" : "Use"}
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className={styles.trustStrip}>
              {REVIEWS.slice(0, 3).map((r) => (
                <div className={styles.trustCard} key={r.name}>
                  <img src={r.src} alt="" />
                  <div>
                    <div className={styles.reviewStars}>★★★★★</div>
                    <p>&ldquo;{r.text}&rdquo;</p>
                    <span>{r.name} · {r.breed}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className={styles.summary}>
              {activeCart.map((it) => (
                <div className={styles.row} key={it.id}>
                  <span>{it.petName}{it.qty > 1 ? ` ×${it.qty}` : ""}</span>
                  <span>{money(itemTotal(it))}</span>
                </div>
              ))}

              {appliedDiscount ? (
                <div className={styles.row}>
                  <span>Code {appliedDiscount.code} ({appliedDiscount.pct}% off)</span>
                  <span>−{money(discountAmount)}</span>
                </div>
              ) : (
                <label className={styles.discountRow}>
                  <input
                    type="text"
                    placeholder="Discount code"
                    value={discountCode}
                    onChange={(e) => {
                      setDiscountCode(e.target.value);
                      setDiscountError(null);
                    }}
                  />
                  <button type="button" className={styles.discountBtn} onClick={() => applyCode(discountCode)}>Apply</button>
                </label>
              )}
              {discountError && <div className={styles.discountError}>{discountError}</div>}

              <div className={styles.tot}><span>Total</span><b>{money(finalTotal)}</b></div>
              {checkoutError && <div className={styles.discountError}>{checkoutError}</div>}
              <button className={styles.buy} onClick={goCheckout} disabled={checkoutLoading}>
                {checkoutLoading ? "Redirecting to payment…" : `Pay ${money(finalTotal)} →`}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
