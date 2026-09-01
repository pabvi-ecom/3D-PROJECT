/**
 * Marca-madre. Nombre PROVISIONAL ("Sculptly") — cámbialo aquí y cambia en toda la web.
 * La marca es neutra a propósito: hoy aloja la zona de perros, mañana gatos,
 * figuras de personas, etc. Cada zona aporta su propio ambiente (ver config/zones.ts).
 */
export const brand = {
  name: "Sculptly",
  // Mercado y moneda
  locale: "en-US",
  currency: "USD",
  currencySymbol: "$",
  // Envío gratis a partir de este importe (empuja packs y extras hasta el carrito)
  freeShippingThreshold: 99.99,
  // Zona por defecto a la que redirige la home mientras solo haya una
  defaultZone: "dogs",
  // Contacto / legal (rellenar cuando exista)
  supportEmail: "hello@example.com",
} as const;

export type Brand = typeof brand;
