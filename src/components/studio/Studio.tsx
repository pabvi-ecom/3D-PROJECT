"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import styles from "./Studio.module.css";
import { brand } from "@/config/brand";
import { bases as allBases, packs, NAMEPLATE_PRICE, type Pack } from "@/config/products";
import type { Zone } from "@/config/zones";

const FIGURE_PRICE = 79.99;

const HERO_EXAMPLES = [
  { src: "/examples/labrador-wood.jpg", label: "Labrador" },
  { src: "/examples/setter-marble.jpg", label: "Setter" },
  { src: "/examples/basset-black.jpg", label: "Basset" },
  { src: "/examples/basset-wood.jpg", label: "Basset" },
];
const GALLERY = [
  "/examples/labrador-wood.jpg", "/examples/setter-marble.jpg", "/examples/basset-black.jpg",
  "/examples/basset-marble.jpg", "/examples/golden-white.jpg", "/examples/basset-wood.jpg",
];

export default function Studio({ zone }: { zone: Zone }) {
  const [photo, setPhoto] = useState<string | null>(null);
  const [figures, setFigures] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [baseId, setBaseId] = useState(allBases[0].id);
  const [addName, setAddName] = useState(false);
  const [name, setName] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const animal = zone.animal;
  const firstBaseId = allBases[0].id;
  const base = allBases.find((b) => b.id === baseId) ?? allBases[0];
  const figure = figures[baseId] ?? null;
  const total = FIGURE_PRICE + base.price + (addName ? NAMEPLATE_PRICE : 0);
  const money = (n: number) => `${brand.currencySymbol}${n.toFixed(2)}`;

  // Llama al endpoint una vez y devuelve la URL de la figura generada.
  async function postGenerate(body: Record<string, unknown>): Promise<string> {
    const res = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ zone: zone.slug, ...body }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error ?? "Couldn't generate");
    return json.url as string;
  }

  // Al subir la foto: genera PRIMERO la base por defecto desde la foto y,
  // usando esa figura como referencia, genera las otras 3 cambiando SOLO la
  // base (el perro queda idéntico). No mostramos nada hasta tener las 4.
  async function generateAll(dataUri: string) {
    setLoading(true);
    setError(null);
    setFigures({});
    setBaseId(firstBaseId);
    try {
      const first = await postGenerate({ imageBase64: dataUri, baseId: firstBaseId });
      const rest = allBases.filter((b) => b.id !== firstBaseId);
      const others = await Promise.all(
        rest.map(async (b) => [b.id, await postGenerate({ referenceUrl: first, baseId: b.id })] as const),
      );
      const map: Record<string, string> = { [firstBaseId]: first };
      for (const [id, url] of others) map[id] = url;
      setFigures(map);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUri = reader.result as string;
      setPhoto(dataUri);
      generateAll(dataUri);
    };
    reader.readAsDataURL(f);
  }

  // Cambiar de base es INSTANTÁNEO: ya está en memoria (figures[id]).
  // Solo regeneramos on-demand si por lo que sea faltara esa base.
  async function pickBase(id: string) {
    setBaseId(id);
    if (figures[id] || loading) return;
    const ref = figures[firstBaseId];
    if (!ref) return;
    setLoading(true);
    setError(null);
    try {
      const url = await postGenerate({ referenceUrl: ref, baseId: id });
      setFigures((prev) => ({ ...prev, [id]: url }));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setPhoto(null);
    setFigures({});
    setBaseId(firstBaseId);
    setError(null);
    if (fileRef.current) fileRef.current.value = "";
  }
  const openPicker = () => fileRef.current?.click();

  const Nav = (
    <nav className={styles.nav}>
      <div className={`${styles.wrap} ${styles.navIn}`}>
        <div className={styles.brand}>
          <svg className={styles.paw} viewBox="0 0 48 48" fill="none" aria-hidden>
            <circle cx="16" cy="16" r="5.5" fill="var(--accent)" /><circle cx="32" cy="16" r="5.5" fill="var(--pop)" />
            <circle cx="9" cy="28" r="5" fill="var(--gold)" /><circle cx="39" cy="28" r="5" fill="var(--accent)" />
            <path d="M24 23c-7 0-12 6-12 12 0 4 5 5 12 5s12-1 12-5c0-6-5-12-12-12z" fill="var(--ink)" />
          </svg>
          {brand.name} <span className={styles.z}>{zone.animalPlural}</span>
        </div>
        {photo ? (
          <button className={`${styles.btn} ${styles.btnGhost} ${styles.btnSm}`} onClick={reset}>← Start over</button>
        ) : (
          <>
            <div className={styles.nlinks}>
              <a href="#how">How it works</a><a href="#examples">Examples</a><a href="#pricing">Pricing</a>
            </div>
            <button className={`${styles.btn} ${styles.btnSm}`} onClick={openPicker}>Create yours</button>
          </>
        )}
      </div>
    </nav>
  );

  // ---- CONFIGURATOR STATE ----
  if (photo) {
    return (
      <div className={styles.page}>
        {Nav}
        <input ref={fileRef} type="file" accept="image/*" hidden onChange={onFile} />
        <div className={styles.wrap}>
          <div className={styles.studio}>
            <div className={styles.studioHead}>
              <h1>Your figure</h1>
              <p>Pick a base and add their name.</p>
            </div>
            <div className={styles.stage}>
              {figure && <img src={figure} alt={`${animal} figure`} />}
              {figure && addName && name && <div className={styles.plate}>{name}</div>}
              {loading && (
                <div className={styles.loading}>
                  <div className={styles.spinner} />
                  <span>Sculpting your {animal}…</span>
                </div>
              )}
            </div>
            {error && <div className={styles.err}>{error} — try another photo.</div>}

            <div className={styles.cfgSection}>
              <div className={styles.cfgLabel}>Choose the base</div>
              <div className={styles.baseRow}>
                {allBases.map((b) => (
                  <button key={b.id} className={styles.baseBtn} aria-pressed={baseId === b.id} disabled={loading} onClick={() => pickBase(b.id)}>
                    {b.label}
                    <small>{b.price ? `+${money(b.price)}` : "Included"}</small>
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.cfgSection}>
              <label className={styles.toggle}>
                <input type="checkbox" checked={addName} onChange={(e) => setAddName(e.target.checked)} />
                Add their name on the base (+{money(NAMEPLATE_PRICE)})
              </label>
              {addName && (
                <input className={styles.nameInput} maxLength={14} placeholder={`Your ${animal}'s name`} value={name} onChange={(e) => setName(e.target.value)} />
              )}
            </div>

            <div className={styles.summary}>
              <div className={styles.row}><span>Figure · full-color resin</span><b>{money(FIGURE_PRICE)}</b></div>
              <div className={styles.row}><span>Base — {base.label}</span><span>{base.price ? `+${money(base.price)}` : "Included"}</span></div>
              {addName && <div className={styles.row}><span>Nameplate{name && ` — “${name.toUpperCase()}”`}</span><span>+{money(NAMEPLATE_PRICE)}</span></div>}
              <div className={styles.tot}><span>Total</span><b>{money(total)}</b></div>
              <button className={styles.buy} disabled={!figure || loading}>Add to cart →</button>
            </div>

            <button className={styles.startOver} onClick={reset}>← Try another photo</button>
          </div>
        </div>
      </div>
    );
  }

  // ---- LANDING STATE ----
  return (
    <div className={styles.page}>
      {Nav}
      <input ref={fileRef} type="file" accept="image/*" hidden onChange={onFile} />

      <div className={styles.wrap}>
        <header className={styles.hero}>
          <div>
            <span className={styles.eyebrow}>🐾 Free preview · no card needed</span>
            <h1 style={{ marginTop: 16 }}>See your {animal} as a <em>figure</em> — in seconds.</h1>
            <p className={styles.heroSub}>Upload one photo and see your {animal} as a collectible figure, free. Love it? We 3D-print it in full color and ship it to you.</p>
            <button className={styles.drop} onClick={openPicker}>
              <span className={styles.dropIcon}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
              </span>
              <span>
                <span className={styles.dropTitle}>Upload a photo of your {animal}</span>
                <span className={styles.dropHint}>See your figure in seconds — free</span>
              </span>
            </button>
            <div className={styles.trust}>
              <span><span className={styles.stars}>★★★★★</span> 4.9 · loved by pet parents</span>
              <span>🚚 Ships in 2–4 days</span>
            </div>
          </div>
          <div style={{ position: "relative" }}>
            <div className={styles.exBadge}>✨ Real photo → figure</div>
            <div className={styles.exGrid}>
              {HERO_EXAMPLES.map((ex, i) => (
                <div className={styles.exTile} key={i}><img src={ex.src} alt={`${ex.label} figure`} loading="lazy" /></div>
              ))}
            </div>
          </div>
        </header>
      </div>

      <div className={styles.wrap}>
        <div className={styles.strip}>
          <span>Loved by pet parents in <b>the US</b></span><span>★★★★★ <b>4.9/5</b></span><span><b>Full-color</b> resin</span><span>🚚 <b>Fast</b> shipping</span>
        </div>
      </div>

      <div className={styles.wrap}>
        <section className={styles.section} id="how">
          <div className={styles.shead}><span className={styles.eyebrow}>How it works</span><h2>From photo to <em>forever</em>, in 3 steps</h2></div>
          <div className={styles.how}>
            <div className={styles.howc}><div className={styles.n}>1</div><h3>Upload a photo</h3><p>Any normal snapshot of your {animal}. You&apos;ll see your figure in seconds.</p><span className={styles.free}>Free · no card</span></div>
            <div className={styles.howc}><div className={styles.n}>2</div><h3>Make it yours</h3><p>Choose the base and add their name. You only pay when you love it.</p></div>
            <div className={styles.howc}><div className={styles.n}>3</div><h3>We print &amp; ship</h3><p>Printed in full-color resin, hand-finished, and shipped to your door in 2–4 days.</p></div>
          </div>
        </section>

        <section className={styles.section} id="examples">
          <div className={styles.shead}><span className={styles.eyebrow}>Real figures</span><h2>Turn any {animal} into <em>this</em></h2><p>Every figure is sculpted from a real photo, in their true colors.</p></div>
          <div className={styles.gallery}>
            {GALLERY.map((src, i) => (<div className={styles.gCard} key={i}><img src={src} alt="figure example" loading="lazy" /></div>))}
          </div>
          <div style={{ textAlign: "center", marginTop: 28 }}>
            <button className={styles.btn} onClick={openPicker}>See your {animal} free →</button>
          </div>
        </section>

        <section className={styles.section} id="pricing">
          <div className={styles.shead}><span className={styles.eyebrow}>Pricing</span><h2>The whole family, <em>immortalized</em></h2><p>More figures, better price — and they ship together.</p></div>
          <div className={styles.packs}>
            {packs.map((p: Pack) => (
              <div key={p.qty} className={`${styles.ed} ${p.badge === "Most loved" ? styles.hot : ""}`}>
                {p.badge && <span className={styles.tag} style={p.badge === "Best value" ? { background: "var(--pop)" } : undefined}>{p.badge}</span>}
                <div className={styles.paws}>{"🐾".repeat(p.qty)}</div>
                <div className={styles.en}>{p.label}</div>
                <div className={styles.ep}>{money(p.price)}</div>
                {p.savingsNote && <span className={styles.save}>{p.savingsNote}</span>}
                <div className={styles.eu}>{money(p.price / p.qty)} each</div>
                <button className={`${styles.btn} ${styles.btnGhost}`} style={{ marginTop: 6, width: "100%" }} onClick={openPicker}>Start free</button>
              </div>
            ))}
          </div>
          <p className={styles.ship}>🚚 <b>Free express shipping</b> on every order over {money(brand.freeShippingThreshold)}</p>
        </section>

        <section className={styles.section} style={{ paddingTop: 0 }}>
          <div className={styles.gift}>
            <h2>The gift they&apos;ll <em style={{ color: "#fff" }}>never</em> forget</h2>
            <p>Birthdays, holidays, or the pup that&apos;s no longer here. Nothing hits quite like this.</p>
            <button className={styles.btn} onClick={openPicker}>Preview your {animal} free →</button>
          </div>
        </section>

        <section className={styles.section} id="faq" style={{ paddingTop: 0 }}>
          <div className={styles.shead}><span className={styles.eyebrow}>Good to know</span><h2>Questions, <em>answered</em></h2></div>
          <div className={styles.faq}>
            <details><summary>What if it doesn&apos;t look like my {animal}?</summary><p>Then we recast it, free. If the preview isn&apos;t right we regenerate it; if the printed figure misses the mark we remake it.</p></details>
            <details><summary>How long does it take?</summary><p>The preview is instant and free. Once you order, your figure ships in about 2–4 days.</p></details>
            <details><summary>What&apos;s it made of?</summary><p>Durable full-color resin, hand-finished. A keepsake for your shelf.</p></details>
          </div>
        </section>
      </div>

      <footer className={styles.footer}>
        <div className={`${styles.wrap} ${styles.footIn}`}>
          <div><div className={styles.brand}>{brand.name}</div><div style={{ marginTop: 8 }}>Custom 3D figures of the ones you love.</div></div>
          <div>© {new Date().getFullYear()} {brand.name}</div>
        </div>
      </footer>
    </div>
  );
}
