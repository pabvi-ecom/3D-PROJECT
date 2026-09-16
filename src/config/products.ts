/**
 * Catálogo — TODO son precios de arranque en USD y ESTIMACIONES.
 * Se ajustan cuando JLC confirme el coste de imprimir figuras medianas/grandes
 * y el envío de packs. Nada de esto está grabado en piedro: es config.
 *
 * Modelo de negocio recordatorio:
 *  - El envío se paga POR PEDIDO, no por figura -> los packs mejoran mucho el margen.
 *  - Envío gratis a partir de brand.freeShippingThreshold -> empuja a añadir figuras/extras.
 */

export type SizeId = "s" | "m" | "l";

export interface Size {
  id: SizeId;
  label: string;      // cara al cliente (inglés, mercado EEUU)
  heightCm: number;
  price: number;      // precio de 1 figura de este tamaño (USD)
  popular?: boolean;
}

/** Tamaños de una figura individual. */
export const sizes: Size[] = [
  { id: "s", label: "Standard", heightCm: 12, price: 79.99, popular: true },
  { id: "m", label: "Large",    heightCm: 16, price: 99.99 },
  { id: "l", label: "Grand",    heightCm: 22, price: 129.99 },
];

export interface Pack {
  qty: number;
  label: string;
  price: number;      // precio del pack (tamaño mediano de referencia)
  badge?: string;
  savingsNote?: string;
}

/** Packs (varias figuras en el mismo pedido). El gancho de rentabilidad. */
export const packs: Pack[] = [
  { qty: 1, label: "1 figure",  price: 79.99 },
  { qty: 2, label: "Pack of 2", price: 139.99, badge: "Most loved", savingsNote: "Save $20" },
  { qty: 3, label: "Pack of 3", price: 189.99, badge: "Best value", savingsNote: "Save $50" },
];

export interface Extra {
  id: string;
  label: string;
  price: number;
  emoji?: string;
}

/** Extras / personalización — casi todo margen. Se ofrecen hasta el carrito. */
export const extras: Extra[] = [
  { id: "nameplate", label: "Nameplate with your pet's name", price: 9.99, emoji: "🏷️" },
  { id: "bone",      label: "A little bone in the mouth",      price: 4.99, emoji: "🦴" },
  { id: "bandana",   label: "Custom bandana",                  price: 4.99, emoji: "🧣" },
  { id: "gift-box",  label: "Premium gift box",                price: 7.99, emoji: "🎁" },
];

/** Colores de acabado disponibles (resina a color WJP). */
export const finishColors = [
  { id: "golden", label: "Golden brown", hex: "#C9862F" },
  { id: "black",  label: "Black",        hex: "#33291F" },
  { id: "cream",  label: "Cream",        hex: "#ECE0CF" },
  { id: "tan",    label: "Tan",          hex: "#B0703C" },
  { id: "grey",   label: "Grey",         hex: "#8A8D8F" },
  { id: "spotted",label: "Spotted",      hex: "#DDBE92" },
];

export type FinishColor = (typeof finishColors)[number];

/**
 * POSTURAS — el PRIMER paso de personalización.
 * `prompt` describe SOLO la postura de la figura (sin base).
 * Algunas gratis (sentado, a cuatro patas) y otras de pago (tumbado, a dos patas).
 */
export interface Pose {
  id: string;
  label: string;
  price: number;
  prompt: string; // describe la postura para la IA
}

// Solo sentado — se quitó la elección de postura (menos pasos, menos
// generación de IA, y era la fuente de la mayoría de bugs de consistencia).
export const poses: Pose[] = [
  { id: "sitting", label: "Sitting", price: 0, prompt: "sitting upright on its hindquarters, facing forward" },
];

/**
 * ESTILOS — se elige ANTES de generar (cambia cómo se esculpe la figura,
 * no es un retoque posterior). `prompt` se añade a la descripción de la
 * figura en el prompt de generación desde foto.
 */
export interface FigureStyle {
  id: string;
  label: string;
  description: string;
  prompt: string;
  popular?: boolean;
}

export const figureStyles: FigureStyle[] = [
  {
    id: "realistic",
    label: "Realistic",
    description: "True to life — every marking and detail.",
    popular: true,
    // Vacío: el prompt base ya pide figura de resina realista fiel a la foto.
    prompt: "",
  },
  {
    id: "pixar",
    label: "Pixar-style",
    description: "Cute animated-movie look, big expressive eyes.",
    prompt:
      " Make it in a cute Pixar/DreamWorks 3D animated-movie style — big expressive eyes, soft rounded proportions, smooth stylized fur — still clearly the same pet (same breed, colors and markings).",
  },
  {
    id: "santa",
    label: "Santa Claus",
    description: "A little Santa hat and coat, ready for the holidays.",
    prompt:
      " Dress it as Santa Claus — a plush red-and-white Santa hat and a little red coat trimmed with white fur.",
  },
  {
    id: "halloween",
    label: "Halloween",
    description: "A playful pumpkin costume for spooky season.",
    prompt:
      " Dress it in a playful Halloween pumpkin costume — a soft orange pumpkin body wrap with a little green stem hat.",
  },
];

/**
 * BASES — ahora son un EXTRA opcional (se vende sin base de serie).
 * `id: "none"` es la opción por defecto y gratuita (figura sin base).
 * `prompt` describe la base para que la IA la pinte de forma realista.
 * La placa va SIEMPRE en blanco; el nombre se superpone (web + grabado en producción).
 */
export interface Base {
  id: string;
  label: string;
  price: number;
  prompt: string; // "" para la opción sin base
  refImage?: string; // imagen de referencia real (public/) que se manda a la IA junto al prompt
}

export const NO_BASE_ID = "none";

export const bases: Base[] = [
  { id: "none", label: "No base", price: 0, prompt: "" },
  {
    id: "marble",
    label: "Marble pedestal",
    price: 10,
    // La base SIEMPRE debe ser como la imagen de referencia (marble-ref.png):
    // pedestal ovalado de mármol/travertino beige, borde escalonado. El
    // nombre va GRABADO en la piedra (no en placa de metal).
    prompt:
      "on the exact display base shown in the LAST reference image — a smooth oval polished beige marble/travertine pedestal with a raised flat oval top and a wider stepped rounded rim below it, natural cream-and-tan stone veining, satin finish. Replicate that base's shape, proportions, material and color precisely. The front face of the lower marble rim is smooth and blank, ready for a name to be engraved directly into the stone (no metal plaque)",
    refImage: "/bases/marble-ref.png",
  },
];

/** Bases de pago (para el selector, sin la opción "none"). */
export const paidBases = bases.filter((b) => b.id !== NO_BASE_ID);

/** Coste de añadir el nombre grabado en la placa (requiere base). */
export const NAMEPLATE_PRICE = 5;
