/**
 * Composición por CÓDIGO de la imagen de display (perro + base + nombre).
 * En vez de pedirle a la IA que ponga la base y el nombre (impreciso), tomamos
 * el perro SIN base (fondo blanco), le quitamos el fondo, lo pegamos centrado y
 * en contacto sobre una imagen fija del pedestal, y grabamos el nombre con
 * texto real. Resultado consistente en todas las figuras.
 */
import sharp from "sharp";
import path from "path";

const BASE_IMG = path.join(process.cwd(), "public/bases/marble-ref.png");
// Anclas medidas sobre marble-ref.png (1178x1335): superficie superior y canto.
const BASE_W = 1178, BASE_H = 1335;
const TOP_CENTER_X = 584;   // centro horizontal del pedestal
const FEET_Y = 1010;        // y donde apoyan las patas (sobre la superficie, tocando)
const NAME_Y = 1095;        // y del nombre en el canto frontal
const DOG_TARGET_H = 740;   // alto objetivo del perro

/** Quita el fondo BLANCO conectado a los bordes (conserva blancos internos del perro). */
async function removeWhiteBg(buf: Buffer): Promise<Buffer> {
  const img = sharp(buf).ensureAlpha();
  const { data, info } = await img.raw().toBuffer({ resolveWithObject: true });
  const { width: w, height: h } = info;
  const near = (i: number) => data[i] > 236 && data[i + 1] > 236 && data[i + 2] > 236;
  const visited = new Uint8Array(w * h);
  const stack: number[] = [];
  const push = (x: number, y: number) => {
    if (x < 0 || y < 0 || x >= w || y >= h) return;
    const p = y * w + x;
    if (visited[p]) return;
    if (!near(p * 4)) return;
    visited[p] = 1; stack.push(p);
  };
  for (let x = 0; x < w; x++) { push(x, 0); push(x, h - 1); }
  for (let y = 0; y < h; y++) { push(0, y); push(w - 1, y); }
  while (stack.length) {
    const p = stack.pop()!; const x = p % w, y = (p / w) | 0;
    data[p * 4 + 3] = 0; // transparente
    push(x + 1, y); push(x - 1, y); push(x, y + 1); push(x, y - 1);
  }
  return sharp(data, { raw: { width: w, height: h, channels: 4 } }).png().toBuffer();
}

function engravedNameSVG(name: string): Buffer {
  const txt = name.toUpperCase();
  const fontSize = 52;
  const letterSpacing = 6;
  return Buffer.from(
    `<svg width="${BASE_W}" height="${BASE_H}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="carve" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="1.2" stdDeviation="0.4" flood-color="#ffffff" flood-opacity="0.55"/>
          <feDropShadow dx="0" dy="-0.8" stdDeviation="0.5" flood-color="#3a2d1d" flood-opacity="0.5"/>
        </filter>
      </defs>
      <text x="${TOP_CENTER_X}" y="${NAME_Y}" text-anchor="middle"
        font-family="'Trebuchet MS', 'Helvetica Neue', Arial, sans-serif" font-weight="700"
        font-size="${fontSize}" letter-spacing="${letterSpacing}"
        fill="#6e5a41" filter="url(#carve)">${txt}</text>
    </svg>`,
  );
}

export async function composeDisplay(dogBuf: Buffer, opts: { petName?: string }): Promise<Buffer> {
  // 1) perro sin fondo, recortado a contenido
  const cut = await sharp(await removeWhiteBg(dogBuf)).trim().toBuffer();
  const meta = await sharp(cut).metadata();
  const dogH = DOG_TARGET_H;
  const dogW = Math.round((meta.width! / meta.height!) * dogH);
  const dog = await sharp(cut).resize({ height: dogH }).toBuffer();
  const dogX = Math.round(TOP_CENTER_X - dogW / 2);
  const dogY = Math.round(FEET_Y - dogH);

  // 2) sombra de contacto (elipse borrosa) bajo las patas — sutil
  const shW = Math.round(dogW * 0.5), shH = 30;
  const pad = 20;
  const shadow = await sharp({
    create: { width: shW + pad * 2, height: shH + pad * 2, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  })
    .composite([
      {
        input: Buffer.from(
          `<svg width="${shW + pad * 2}" height="${shH + pad * 2}"><ellipse cx="${shW / 2 + pad}" cy="${shH / 2 + pad}" rx="${shW / 2}" ry="${shH / 2}" fill="black" opacity="0.18"/></svg>`,
        ),
      },
    ])
    .blur(10)
    .png()
    .toBuffer();

  const layers: { input: Buffer; left?: number; top?: number }[] = [
    { input: shadow, left: Math.round(TOP_CENTER_X - (shW + pad * 2) / 2), top: Math.round(FEET_Y - (shH + pad * 2) / 2) },
    { input: dog, left: dogX, top: dogY },
  ];
  if (opts.petName && opts.petName.trim()) {
    layers.push({ input: engravedNameSVG(opts.petName.trim()), left: 0, top: 0 });
  }

  return sharp(BASE_IMG).resize(BASE_W, BASE_H).composite(layers).png().toBuffer();
}
