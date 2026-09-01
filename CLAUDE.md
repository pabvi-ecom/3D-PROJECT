# Sculptly (nombre provisional) — tienda de figuras 3D personalizadas

Tienda DTC de figuras 3D personalizadas a partir de una foto (IA → modelo 3D →
impresión bajo demanda en JLC3DP → envío al cliente). **Mercado: EEUU (inglés, USD).**

## Arquitectura clave: "el nicho es un dato"

Una **marca-madre neutra** con **zonas** temáticas que parecen sitios independientes
pero comparten toda la infraestructura. Empezamos con la zona de **perros** (`/dogs`);
gatos, figuras de personas, etc. se añaden como datos, sin tocar código.

- `src/config/brand.ts` — marca, moneda, umbral de envío gratis, zona por defecto.
- `src/config/zones.ts` — cada zona (copy, ejemplos, SEO, preset de IA). **Añadir zona = añadir entrada aquí.**
- `src/config/products.ts` — tamaños, packs, extras, colores (precios de ARRANQUE, a ajustar con costes reales de JLC).
- `src/app/page.tsx` — la home redirige a la zona por defecto.
- `src/app/[zone]/page.tsx` — ruta dinámica que renderiza la landing desde datos.
- `src/app/[zone]/create/page.tsx` — configurador (STUB; pendiente).
- `src/components/landing/Landing.tsx` + `Landing.module.css` — landing (cliente, interactiva).
- `src/app/globals.css` — sistema de tema con **tokens CSS** (paleta cálida + premium). Una zona puede sobreescribir `--accent`.

## Tema
Cálido + premium: fondo crema, texto cálido oscuro, acento coral/terracota, secundario dorado, verde salvia para confianza. Light + dark vía `prefers-color-scheme`. Fuentes: Fraunces (display) + Nunito Sans (texto).

## Modelo de negocio (recordatorio para decisiones de producto)
- Envío ~26 $ (exprés UPS DDP desde China) se paga **por pedido** → los **packs** y el **envío gratis > 99,99 $** son la palanca de margen. La web debe empujar packs/extras hasta el carrito.
- Fabricante: JLC3DP, resina a color (WJP), caja blanca. Producción ~5 días + envío.

## Pendiente
- Configurador: subir foto → generar con IA → elegir → tamaño/color/extras → carrito → **Stripe** (sin Shopify).
- Panel de pedidos, emails, envío automático del archivo a JLC.
- Confirmar con JLC: coste figura mediana/grande y envío de packs (para fijar precios definitivos).

## Comandos
`npm run dev` (desarrollo) · `npm run build` · `npm run start`
