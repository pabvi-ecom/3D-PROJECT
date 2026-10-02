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
  { id: "sitting", label: "Sitting", price: 0, prompt: "sitting upright on its hindquarters, facing forward (front view)" },
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

// Orden pensado para la UI: Realistic va EN MEDIO (es el mas elegido).
export const figureStyles: FigureStyle[] = [
  {
    id: "pixar",
    label: "Pixar style",
    description: "Animated-movie look, big eyes.",
    prompt:
      "Render it in the signature PIXAR / Disney 3D animated-feature film style: a smooth, polished, high-quality 3D character render with soft cinematic lighting and gentle subsurface glow on the skin and nose. Give it slightly enlarged, expressive, glossy eyes with big soft catchlights, a warm friendly appealing expression, and gently exaggerated, endearing features. The fur is soft and stylized, groomed into clean tidy clumps rather than photoreal strands. It must clearly look like a character from an animated movie — NOT a real photo and NOT a plastic toy — while keeping the same breed, the exact same fur colors and the same markings and face so it is obviously this same pet. Body proportions stay close to natural with only mild cartoon appeal.",
  },
  {
    id: "realistic",
    label: "Realistic",
    description: "Maximum detail, true to life.",
    popular: true,
    prompt:
      "Render it as a HYPER-PHOTOREALISTIC studio portrait, indistinguishable from a real high-end DSLR photograph of the real pet: real fur rendered strand by strand, realistic moist eyes with natural catchlights, realistic wet nose texture, and natural skin. Keep the pet's TRUE real-life anatomy and proportions exactly — the real leg length, body length, chest depth, head size and, critically, the exact muzzle/snout length and shape from the photo (a long snout stays long; NEVER shorten, flatten, pug-ify or 'cute-ify' it). Keep any long, scruffy, fluffy, uneven, messy or shaggy fur exactly as it is. Do NOT groom, smooth, slim, idealize or 'purebred-ify' the pet. It must look like a REAL living animal — never a cartoon, never stylized, never a toy.",
  },
  {
    id: "chibi",
    label: "Cartoon",
    description: "Chunky big-head collectible.",
    prompt:
      "Render it as a FUNKO POP! / chibi vinyl collectible figure. The single most important feature: a VERY LARGE, oversized, round head that is roughly AS BIG AS the entire rest of the body (a true bobblehead). Give it a tiny short stubby body, little stubby legs, large solid glossy black round button eyes set wide apart, a small simplified snout, small simplified ears, smooth matte vinyl surfaces and minimal flat simplified details — an exaggerated, super-cute toy look. Completely IGNORE realistic anatomy and proportions; the giant head must clearly dominate the figure. Keep the same breed, the exact same fur colors and the same markings so it is clearly this same pet.",
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
      "This is a photorealistic product photo of ONE single real painted resin collectible figurine: the pet and the marble base are a SINGLE fused sculpture, manufactured as one piece, photographed together in a studio — never two separate objects, never floating, never pasted on. Use the LAST reference image ONLY for the base's shape, material and color: a low, flat, round polished beige marble pedestal with a stepped rounded rim, cream-and-tan veining, satin finish. The dog is always OUR pet from the FIRST image (keep its exact face, head shape, muzzle, ears, fur colors and markings) — never copy any other animal. " +
      "This must be the EXACT SAME IMAGE as the FIRST image with ONLY a marble base added underneath the pet — nothing else changes. KEEP the pet IDENTICAL: same front-facing view, same pose, same body position, same stance, same leg and paw arrangement, same head tilt, same expression, same framing and same art style. Do NOT rotate, turn or re-angle the dog — it keeps facing the camera straight-on / front view exactly like the first image. Do NOT re-pose it, do NOT turn it to the side or to a three-quarter angle, do NOT change or straighten its legs, do NOT change the camera angle. The pet and the base become ONE single fused figurine. " +
      "CENTERING: the pet sits in the CENTER of the round marble top with a ring of empty marble all around it; make the marble top clearly bigger than the pet so its feet rest comfortably ON the marble, inside the rim, never hanging over the front edge. CONTACT: the pet's paws and underside rest FIRMLY and FLUSH on the marble surface, fully touching it with NO gap, NO floating and NO empty space between the pet and the base — they read as one solid fused piece. The front face of the marble rim is smooth and BLANK — ready for a name to be engraved later (no metal plaque)",
    refImage: "/bases/marble-ref.png",
  },
];

/** Bases de pago (para el selector, sin la opción "none"). */
export const paidBases = bases.filter((b) => b.id !== NO_BASE_ID);

/** Coste de añadir el nombre grabado en la placa (requiere base). */
export const NAMEPLATE_PRICE = 5;

/**
 * ACCESORIOS — paso posterior a la base. Se aplican sobre la figura YA generada
 * (con o sin base), encadenados desde esa imagen para no cambiar el perro.
 * `id: "none"` es la opción por defecto y gratuita.
 * Precios de arranque (USD); ajustar cuando se fijen márgenes.
 */
export interface Accessory {
  id: string;
  label: string;
  price: number;
  emoji?: string;
  prompt: string; // "" para "sin accesorio"
}

export const NO_ACCESSORY_ID = "none";

export const accessories: Accessory[] = [
  { id: "none", label: "No accessory", price: 0, prompt: "" },
  {
    id: "halloween",
    label: "Halloween",
    price: 5,
    emoji: "🎃",
    prompt:
      " Dress the pet in a playful Halloween pumpkin costume — a soft orange pumpkin body wrap with a little green stem hat.",
  },
  {
    id: "christmas",
    label: "Christmas",
    price: 5,
    emoji: "🎅",
    prompt:
      " Dress the pet for Christmas — a plush red-and-white Santa hat and a little red scarf trimmed with white fur.",
  },
  {
    id: "bone",
    label: "Bone in mouth",
    price: 5,
    emoji: "🦴",
    prompt:
      " Add a small, clean, light-beige cartoon-style dog bone held gently and naturally in the pet's mouth.",
  },
  {
    id: "bandana",
    label: "Bandana",
    price: 5,
    emoji: "🧣",
    prompt:
      " Add a small classic red paisley bandana tied neatly around the pet's neck.",
  },
];

/** Accesorios de pago (para el selector, sin la opción "none"). */
export const paidAccessories = accessories.filter((a) => a.id !== NO_ACCESSORY_ID);
