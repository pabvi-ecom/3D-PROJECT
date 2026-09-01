/**
 * ZONAS — cada zona es una "página que parece independiente" dentro de la misma web.
 * Añadir una zona nueva (gatos, caballos, figuras de personas…) = añadir una entrada
 * aquí. Sin tocar código. Esto es lo que permite testear nichos rápido.
 *
 * Copy en inglés porque el mercado es EEUU.
 */

export interface ZoneExample {
  name: string;
  kind: string;
  hex: string; // color de la figura de ejemplo
}

export interface ZoneStep {
  title: string;
  text: string;
}

export interface Zone {
  slug: string;
  animal: string;            // "dog", "cat"… para copy dinámico
  animalPlural: string;
  /** Sobrescribe el acento del tema para esta zona (opcional). */
  accent?: { light: string; dark: string };

  hero: {
    eyebrowEmoji: string;
    eyebrow: string;
    title: string;
    titleAccent: string;     // parte del titular resaltada con el acento
    sub: string;
    uploadTitle: string;
    uploadHint: string;
    cta: string;
    trust: string[];
  };

  steps: ZoneStep[];
  examples: ZoneExample[];

  gift: {
    title: string;
    titleAccent: string;
    text: string;
    cta: string;
  };

  seo: {
    title: string;
    description: string;
  };

  /** Preset que orienta la generación 3D con IA hacia este nicho (uso interno). */
  aiPromptPreset: string;
}

export const zones: Record<string, Zone> = {
  dogs: {
    slug: "dogs",
    animal: "dog",
    animalPlural: "dogs",
    // La zona de perros usa el acento cálido por defecto del tema.
    hero: {
      eyebrowEmoji: "🐾",
      eyebrow: "Custom 3D figures of your dog",
      title: "Turn your best friend into a",
      titleAccent: "figure that lasts forever",
      sub: "Upload one photo and our AI sculpts a 3D figure of your dog, in their real colors. We print it and ship it to your door.",
      uploadTitle: "Upload a photo of your dog",
      uploadHint: "JPG or PNG · see your figure in under a minute",
      cta: "Create my figure",
      trust: [
        "★★★★★ Loved by 2,400+ pet parents",
        "🚚 Fast shipping across the US",
        "↺ Don't love it? We'll remake it",
      ],
    },
    steps: [
      { title: "Upload a photo", text: "Any normal photo of your dog works. Our AI instantly creates figures for you to choose from." },
      { title: "Pick & personalize", text: "Choose the one that looks most like them, adjust colors and size. You see everything before you pay." },
      { title: "Get it at home", text: "We 3D-print it in full color and ship it to you. No hassle, start to finish." },
    ],
    examples: [
      { name: "Luna",  kind: "Border Collie",    hex: "#33291F" },
      { name: "Max",   kind: "Golden Retriever",  hex: "#C9862F" },
      { name: "Rocky", kind: "French Bulldog",    hex: "#8A8D8F" },
      { name: "Nala",  kind: "Labrador",          hex: "#ECE0CF" },
      { name: "Bimba", kind: "Dachshund",         hex: "#B0703C" },
      { name: "Thor",  kind: "German Shepherd",   hex: "#5A4632" },
      { name: "Coco",  kind: "Poodle",            hex: "#DDBE92" },
      { name: "Simba", kind: "Shiba Inu",         hex: "#D98A3D" },
    ],
    gift: {
      title: "The gift nobody expects…",
      titleAccent: "and nobody forgets.",
      text: "Birthdays, anniversaries, or just because. A figure of their dog moves people more than anything else.",
      cta: "Create my figure",
    },
    seo: {
      title: "Custom 3D Figures of Your Dog | Sculptly",
      description: "Upload a photo and get a hand-finished 3D figure of your dog in their real colors. The keepsake gift dog lovers never forget.",
    },
    aiPromptPreset:
      "A cute, collectible full-color 3D figurine of the pet dog in the uploaded photo, faithful to its breed, fur colors and markings, standing on a small round pedestal, smooth stylized keepsake style.",
  },
};

export const zoneSlugs = Object.keys(zones);

export function getZone(slug: string): Zone | undefined {
  return zones[slug];
}
