"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import styles from "./Configurator.module.css";
import { brand } from "@/config/brand";
import { NAMEPLATE_PRICE, type Base } from "@/config/products";

const FIGURE_PRICE = 79.99;

export default function Configurator({
  zoneSlug,
  animal,
  bases,
}: {
  zoneSlug: string;
  animal: string;
  bases: Base[];
}) {
  const [photo, setPhoto] = useState<string | null>(null); // data URI subido
  const [figure, setFigure] = useState<string | null>(null); // URL de la figura generada
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [baseId, setBaseId] = useState(bases[0].id);
  const [addName, setAddName] = useState(false);
  const [name, setName] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const base = bases.find((b) => b.id === baseId) ?? bases[0];
  const total = FIGURE_PRICE + base.price + (addName ? NAMEPLATE_PRICE : 0);
  const money = (n: number) => `${brand.currencySymbol}${n.toFixed(2)}`;

  async function generate(dataUri: string, bId: string) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: dataUri, zone: zoneSlug, baseId: bId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "No se pudo generar");
      setFigure(json.url);
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
      setFigure(null);
      generate(dataUri, baseId);
    };
    reader.readAsDataURL(f);
  }

  function pickBase(id: string) {
    setBaseId(id);
    if (photo) generate(photo, id);
  }

  function reset() {
    setPhoto(null);
    setFigure(null);
    setError(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        <Link href={`/${zoneSlug}`} className={styles.brand}>
          {brand.name} <span>·</span> {animal}s
        </Link>

        {!photo && (
          <>
            <h1 className={styles.h1}>See your {animal} as a figure</h1>
            <p className={styles.sub}>Upload one photo. You&apos;ll see your figure in seconds — free.</p>
            <label className={styles.drop}>
              <span className={styles.ic}>
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
                </svg>
              </span>
              <b>Upload a photo of your {animal}</b>
              <small>Tap to take or choose a photo</small>
              <input ref={fileRef} type="file" accept="image/*" hidden onChange={onFile} />
            </label>
          </>
        )}

        {photo && (
          <>
            <h1 className={styles.h1}>Your figure</h1>
            <div className={styles.stage}>
              {figure && <img src={figure} alt={`${animal} figure`} />}
              {!figure && !loading && photo && <img src={photo} alt="your photo" />}
              {addName && name && figure && <div className={styles.plate}>{name}</div>}
              {loading && (
                <div className={styles.loading}>
                  <div className={styles.spinner} />
                  <span>Sculpting your {animal}…</span>
                </div>
              )}
            </div>
            {error && <div className={styles.err}>{error}</div>}

            <div className={styles.section}>
              <div className={styles.label}>Choose the base</div>
              <div className={styles.bases}>
                {bases.map((b) => (
                  <button
                    key={b.id}
                    className={styles.baseBtn}
                    aria-pressed={baseId === b.id}
                    disabled={loading}
                    onClick={() => pickBase(b.id)}
                  >
                    {b.label}
                    <small>{b.price ? `+${money(b.price)}` : "Included"}</small>
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.section}>
              <label className={styles.toggle}>
                <input type="checkbox" checked={addName} onChange={(e) => setAddName(e.target.checked)} />
                Add their name on the base (+{money(NAMEPLATE_PRICE)})
              </label>
              {addName && (
                <div className={styles.nameRow} style={{ marginTop: 10 }}>
                  <input
                    maxLength={14}
                    placeholder={`Your ${animal}'s name`}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
              )}
            </div>

            <div className={styles.summary}>
              <div className={styles.row}><span>Figure · full-color resin</span><b>{money(FIGURE_PRICE)}</b></div>
              <div className={styles.row}><span>Base — {base.label}</span><span>{base.price ? `+${money(base.price)}` : "Included"}</span></div>
              {addName && <div className={styles.row}><span>Nameplate {name && `— “${name.toUpperCase()}”`}</span><span>+{money(NAMEPLATE_PRICE)}</span></div>}
              <div className={styles.tot}><span>Total</span><b>{money(total)}</b></div>
              <button className={styles.buy} disabled={!figure || loading}>Add to cart →</button>
            </div>

            <button className={styles.reset} onClick={reset}>← Try another photo</button>
          </>
        )}
      </div>
    </div>
  );
}
