"use client";

import { useState } from "react";
import Link from "next/link";
import styles from "./Landing.module.css";
import { brand } from "@/config/brand";
import { sizes, finishColors, packs, type Pack } from "@/config/products";
import type { Zone } from "@/config/zones";

/* Figura de perro en SVG (placeholder hasta tener render/foto reales). */
function DogFigure({ color, bodyClass }: { color?: string; bodyClass?: string }) {
  return (
    <svg viewBox="0 0 240 250" role="img" aria-label="3D figure of a dog on a pedestal">
      <ellipse cx="120" cy="236" rx="76" ry="10" fill="rgba(0,0,0,.12)" />
      <rect x="52" y="212" width="136" height="22" rx="7" fill="var(--surface-2)" />
      <rect x="52" y="209" width="136" height="8" rx="4" fill="rgba(255,255,255,.25)" />
      <g className={bodyClass} fill={color}>
        <ellipse cx="120" cy="172" rx="50" ry="44" />
        <rect x="98" y="188" width="16" height="30" rx="8" />
        <rect x="126" y="188" width="16" height="30" rx="8" />
        <ellipse cx="166" cy="176" rx="12" ry="22" transform="rotate(28 166 176)" />
        <circle cx="120" cy="96" r="46" />
        <ellipse cx="80" cy="74" rx="15" ry="30" transform="rotate(-22 80 74)" />
        <ellipse cx="160" cy="74" rx="15" ry="30" transform="rotate(22 160 74)" />
        <ellipse cx="120" cy="112" rx="24" ry="19" />
      </g>
      <ellipse cx="120" cy="112" rx="24" ry="19" fill="rgba(255,255,255,.16)" />
      <ellipse cx="120" cy="104" rx="7.5" ry="5.5" fill="#241E19" />
      <circle cx="104" cy="88" r="5" fill="#241E19" />
      <circle cx="136" cy="88" r="5" fill="#241E19" />
      <circle cx="106" cy="86" r="1.6" fill="#fff" />
      <circle cx="138" cy="86" r="1.6" fill="#fff" />
    </svg>
  );
}

export default function Landing({ zone }: { zone: Zone }) {
  const [color, setColor] = useState(finishColors[0].hex);
  const [sizeId, setSizeId] = useState(sizes.find((s) => s.popular)?.id ?? sizes[0].id);
  const size = sizes.find((s) => s.id === sizeId)!;
  const createHref = `/${zone.slug}/create`;

  const pageStyle = zone.accent
    ? ({ "--accent": zone.accent.light } as React.CSSProperties)
    : undefined;

  return (
    <div className={styles.page} style={pageStyle}>
      {/* NAV */}
      <nav className={styles.nav}>
        <div className={`${styles.wrap} ${styles.navIn}`}>
          <Link href={`/${zone.slug}`} className={styles.brand}>
            <svg className={styles.brandMark} viewBox="0 0 48 48" fill="none" aria-hidden>
              <circle cx="16" cy="17" r="5" fill="var(--accent)" />
              <circle cx="32" cy="17" r="5" fill="var(--gold)" />
              <circle cx="10" cy="29" r="4.5" fill="var(--sage)" />
              <circle cx="38" cy="29" r="4.5" fill="var(--accent)" />
              <path d="M24 24c-6 0-11 5-11 11 0 4 5 5 11 5s11-1 11-5c0-6-5-11-11-11z" fill="var(--gold)" />
            </svg>
            {brand.name}
            <span className={styles.brandBeta}>{zone.animalPlural}</span>
          </Link>
          <div className={styles.navLinks}>
            <a href="#how">How it works</a>
            <a href="#examples">Examples</a>
            <a href="#packs">Bundles</a>
          </div>
          <Link href={createHref} className={styles.btn}>{zone.hero.cta}</Link>
        </div>
      </nav>

      <div className={styles.wrap}>
        {/* HERO */}
        <header className={styles.hero}>
          <div>
            <span className={styles.eyebrow}>{zone.hero.eyebrowEmoji} {zone.hero.eyebrow}</span>
            <h1 className={styles.heroTitle}>
              {zone.hero.title} <em className={styles.heroTitleAccent}>{zone.hero.titleAccent}</em>.
            </h1>
            <p className={styles.sub}>{zone.hero.sub}</p>
            <Link href={createHref} className={styles.drop}>
              <span className={styles.dropIcon}>
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
              </span>
              <span>
                <span className={styles.dropTitle} style={{ display: "block" }}>{zone.hero.uploadTitle}</span>
                <span className={styles.dropHint}>{zone.hero.uploadHint}</span>
              </span>
            </Link>
            <div className={styles.trust}>
              {zone.hero.trust.map((t) => <span key={t}>{t}</span>)}
            </div>
          </div>

          {/* PREVIEW */}
          <div className={styles.preview}>
            <span className={styles.previewTag}>Preview</span>
            <div className={styles.stage} style={{ "--fig": color } as React.CSSProperties}>
              <DogFigure bodyClass={styles.figBody} />
            </div>
            <div className={styles.controls}>
              <div className={styles.swatches} role="group" aria-label="Figure color">
                {finishColors.map((c) => (
                  <button
                    key={c.id}
                    className={`${styles.sw} ${color === c.hex ? styles.swOn : ""}`}
                    style={{ background: c.hex }}
                    aria-label={c.label}
                    aria-pressed={color === c.hex}
                    onClick={() => setColor(c.hex)}
                  />
                ))}
              </div>
              <div className={styles.sizes} role="group" aria-label="Size">
                {sizes.map((s) => (
                  <button
                    key={s.id}
                    className={`${styles.sizeBtn} ${sizeId === s.id ? styles.sizeOn : ""}`}
                    aria-pressed={sizeId === s.id}
                    onClick={() => setSizeId(s.id)}
                  >
                    {s.label[0]}
                  </button>
                ))}
              </div>
            </div>
            <div className={styles.priceRow}>
              <div className={`${styles.price} ${styles.mono}`}>
                {brand.currencySymbol}{size.price.toFixed(2)}{" "}
                <span className={styles.priceUnit}>/ {size.label} · {size.heightCm} cm</span>
              </div>
              <Link href={createHref} className={styles.btn}>I want it</Link>
            </div>
          </div>
        </header>

        {/* HOW IT WORKS */}
        <section className={styles.section} id="how">
          <div className={styles.head}>
            <span className={styles.kick}>So easy</span>
            <h2 className={styles.headTitle}>From a photo to your shelf in 3 steps</h2>
            <p className={styles.headText}>You just choose. We handle everything else, start to finish.</p>
          </div>
          <div className={styles.steps}>
            {zone.steps.map((s, i) => (
              <div className={styles.step} key={s.title}>
                <div className={styles.stepNo}>{i + 1}</div>
                <h3 className={styles.stepTitle}>{s.title}</h3>
                <p className={styles.stepText}>{s.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* EXAMPLES */}
        <section className={styles.section} id="examples">
          <div className={styles.head}>
            <span className={styles.kick}>Examples</span>
            <h2 className={styles.headTitle}>Every figure, as unique as your {zone.animal}</h2>
          </div>
          <div className={styles.gallery}>
            {zone.examples.map((ex) => (
              <div className={styles.gCard} key={ex.name}>
                <div className={styles.gStage}><DogFigure color={ex.hex} /></div>
                <div className={styles.gName}>{ex.name}</div>
                <div className={styles.gKind}>{ex.kind}</div>
              </div>
            ))}
          </div>
        </section>

        {/* PACKS */}
        <section className={styles.section} id="packs">
          <div className={styles.head}>
            <span className={styles.kick}>Bundles</span>
            <h2 className={styles.headTitle}>Got more than one? They save more.</h2>
            <p className={styles.headText}>Most families gift more than one figure — and the more you add, the better the price.</p>
          </div>
          <div className={styles.packs}>
            {packs.map((p: Pack) => (
              <div key={p.qty} className={`${styles.packCard} ${p.badge === "Most loved" ? styles.featured : ""}`}>
                {p.badge && <span className={styles.packBadge}>{p.badge}</span>}
                <div className={styles.packPaws}>{"🐾".repeat(p.qty)}</div>
                <div className={styles.packName}>{p.label}</div>
                <div className={`${styles.packPrice} ${styles.mono}`}>{brand.currencySymbol}{p.price.toFixed(2)}</div>
                {p.savingsNote && <span className={styles.packSave}>{p.savingsNote}</span>}
                <div className={styles.packUnit}>{brand.currencySymbol}{(p.price / p.qty).toFixed(2)} per figure</div>
                <Link href={createHref} className={styles.btn}>Choose</Link>
              </div>
            ))}
          </div>
          <p className={styles.shipBar}>🚚 <b>Free shipping</b> on every order over {brand.currencySymbol}{brand.freeShippingThreshold}</p>
        </section>
      </div>

      {/* GIFT */}
      <div className={styles.wrap}>
        <section className={styles.section}>
          <div className={styles.gift}>
            <div>
              <h2 className={styles.giftTitle}>
                {zone.gift.title} <em className={styles.giftTitleAccent}>{zone.gift.titleAccent}</em>
              </h2>
              <p className={styles.giftText}>{zone.gift.text}</p>
              <div className={styles.giftBtn}><Link href={createHref} className={`${styles.btn} ${styles.btnBig}`}>{zone.gift.cta}</Link></div>
            </div>
            <div className={styles.giftArt}>
              <svg viewBox="0 0 160 160" width="160" height="160" aria-hidden>
                <rect x="20" y="66" width="120" height="80" rx="12" fill="var(--gold)" />
                <rect x="20" y="66" width="120" height="24" rx="12" fill="rgba(255,255,255,.25)" />
                <rect x="70" y="66" width="20" height="80" fill="rgba(0,0,0,.15)" />
                <path d="M80 66c-14-26-44-20-44 0" fill="none" stroke="var(--accent)" strokeWidth="12" strokeLinecap="round" />
                <path d="M80 66c14-26 44-20 44 0" fill="none" stroke="var(--accent)" strokeWidth="12" strokeLinecap="round" />
              </svg>
            </div>
          </div>
        </section>
      </div>

      {/* FOOTER */}
      <footer className={styles.footer}>
        <div className={`${styles.wrap} ${styles.footIn}`}>
          <div>
            <div className={styles.footBrand}>{brand.name}</div>
            <div>Custom 3D figures of the ones you love.</div>
          </div>
          <div>© {new Date().getFullYear()} {brand.name}</div>
        </div>
      </footer>
    </div>
  );
}
