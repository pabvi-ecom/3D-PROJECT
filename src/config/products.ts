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

export const poses: Pose[] = [
  { id: "sitting",  label: "Sitting",    price: 0, prompt: "sitting upright on its hindquarters, facing forward" },
  { id: "standing", label: "Standing",   price: 0, prompt: "standing naturally on all four legs, facing forward" },
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
    id: "grass",
    label: "Grass top",
    price: 9.99,
    prompt:
      "on a round dark wood display base with a lush, realistic short green grass top filling the whole surface, a polished dark wood rim, and a small blank brushed-gold nameplate on the front edge",
    refImage: "/bases/grass-ref.png",
  },
  {
    id: "cushion",
    label: "Cozy bed",
    price: 9.99,
    prompt:
      "on a round dark wood display base shaped like a cozy pet bed, with a plush cream faux-fur cushion filling the center, a polished dark wood rim, and a small blank brushed-gold nameplate on the front edge",
    refImage: "/bases/cushion-ref.png",
  },
];

/** Bases de pago (para el selector, sin la opción "none"). */
export const paidBases = bases.filter((b) => b.id !== NO_BASE_ID);

/** Coste de añadir el nombre grabado en la placa (requiere base). */
export const NAMEPLATE_PRICE = 9.99;
