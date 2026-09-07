"use client";

import { useRouter } from "next/navigation";
import styles from "./Studio.module.css";
import { brand } from "@/config/brand";
import type { Zone } from "@/config/zones";
import { StepsFlow } from "./StepsFlow";
import { PassThrough } from "./PassThrough";
import { ComparisonTable } from "./ComparisonTable";
import { HowWeWork } from "./HowWeWork";
import { ReviewSwell } from "./ReviewSwell";
import { TransformReveal } from "./TransformReveal";
import { NameGate } from "./NameGate";

// Fotos reales de clientes con su figura — para el carrusel "swell".
// TODO: nombres/textos de EJEMPLO — sustituir por reseñas reales antes de lanzar
// anuncios (la FTC prohíbe reseñas inventadas presentadas como reales).
const CUSTOMER_SWELL = [
  { src: "/examples/lifestyle-coco.jpg", name: "Coco", breed: "Cocker Spaniel", text: "Every curl, just right." },
  { src: "/examples/lifestyle-miska.jpg", name: "Miska", breed: "Tabby Cat", text: "Even the whiskers are perfect." },
  { src: "/examples/lifestyle-cooper.jpg", name: "Cooper", breed: "Havanese mix", text: "Best gift I've ever given." },
  { src: "/examples/lifestyle-oliver.jpg", name: "Oliver", breed: "Maine Coon", text: "That fluff — nailed it." },
  { src: "/examples/lifestyle-daisy.jpg", name: "Daisy", breed: "Goldendoodle", text: "So much better than a photo." },
  { src: "/examples/lifestyle-cleo.jpg", name: "Cleo", breed: "Lynx Point Siamese", text: "Those blue eyes, just like hers." },
  { src: "/examples/lifestyle-bailey.jpg", name: "Bailey", breed: "Dalmatian", text: "Even got his spots right." },
  { src: "/examples/lifestyle-simba.jpg", name: "Simba", breed: "Ginger Cat", text: "My favorite thing on the shelf now." },
  { src: "/examples/lifestyle-luna.jpg", name: "Luna", breed: "French Bulldog", text: "Every wrinkle, spot on." },
  { src: "/examples/lifestyle-charlie.jpg", name: "Charlie", breed: "Cavalier Spaniel", text: "Best gift I've ever given." },
  { src: "/examples/lifestyle-milo.jpg", name: "Milo", breed: "Beagle", text: "So much better than a photo." },
];

export default function Studio({ zone }: { zone: Zone }) {
  const router = useRouter();
  const animal = zone.animal;

  const goCreate = () => router.push(`/${zone.slug}/create`);

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
        <div className={styles.nlinks}>
          <a href="#how">How it works</a><a href="#compare">Us vs. others</a><a href="#faq">FAQ</a>
        </div>
        <button className={`${styles.btn} ${styles.btnSm}`} onClick={goCreate}>Create yours</button>
      </div>
    </nav>
  );

  return (
    <div className={styles.page}>
      {Nav}

      <section className={styles.heroFull}>
        <img className={`${styles.heroVideoWrap} ${styles.heroImgDesktop}`} src="/pet/hero-banner.jpg" alt="" aria-hidden />
        <img className={`${styles.heroVideoWrap} ${styles.heroImgMobile}`} src="/pet/hero-banner-mobile.jpg" alt="" aria-hidden />

        <div className={styles.heroLeft}>
          <span className={styles.heroLeftWord}>Never<br />fades.</span>
          <span className={styles.chip}>🐾 10,000+ pets kept forever</span>
        </div>

        <div className={styles.heroRightCol}>
          <div className={styles.heroRight}>
            <h1 className={styles.heroH1}>Your Pet<br />Keep <em>Forever</em></h1>
            <span className={styles.chip}>Free preview in seconds — no card needed.</span>
          </div>

          <div className={styles.heroActions}>
            <button className={styles.cta} onClick={goCreate}>
              Create yours
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></svg>
            </button>
            <div className={styles.heroStats}>
              <div className={styles.heroStat}><b>4.9 ★★★★★</b></div>
              <div className={styles.heroStat}><b>2–4 days</b> shipping</div>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.swellSection}>
        <div className={styles.swellHead}>
          <h2>🐾 Happy pets, happy humans</h2>
        </div>
        <div className={styles.swellBadge}>📸 Send a photo of your {animal} with the figure <span className={styles.badgeBreak}>get <b>20% off</b> your next order</span></div>
        <ReviewSwell reviews={CUSTOMER_SWELL} />
      </section>

      <NameGate animal={animal} zoneSlug={zone.slug} />

      <TransformReveal
        before="/pet/transform-before.jpg"
        after="/pet/transform-after.jpg"
        animal={animal}
        onCta={goCreate}
      />

      <div className={styles.wrap}>
        <section className={styles.section} id="how">
          <div className={`${styles.shead} ${styles.sheadTight}`}><span className={styles.eyebrow}>How it works</span><h2>The four steps to your pet&apos;s <em>perfect figure</em>.</h2></div>
          <StepsFlow />
        </section>

      </div>

      <PassThrough onCta={goCreate} />

      <div className={styles.wavePanel}>
        <div className={styles.wrap}>
          <section className={styles.section} id="how-we-work" style={{ paddingTop: "clamp(20px,3vw,32px)" }}>
            <div className={`${styles.shead} ${styles.sheadTight} ${styles.sheadOnWave}`}><span className={styles.eyebrow}>Behind the scenes</span><h2>How we <em>work</em></h2></div>
            <HowWeWork />
          </section>
        </div>
      </div>

      <div className={styles.wrap}>
        <section className={styles.section} id="compare" style={{ paddingTop: "clamp(20px,3vw,32px)" }}>
          <div className={`${styles.shead} ${styles.sheadTight}`}><span className={styles.eyebrow}>Us vs. everyone else</span><h2>Why settle for a <em>cheap knockoff</em>?</h2></div>
          <ComparisonTable />
        </section>
      </div>

      <div className={styles.wrap}>
        <section className={styles.section} id="faq" style={{ paddingTop: "clamp(20px,3vw,32px)" }}>
          <div className={styles.shead}><span className={styles.eyebrow}>Good to know</span><h2>Questions, <em>answered</em></h2></div>
          <div className={styles.faq}>
            <details><summary>What if it doesn&apos;t look like my pet?</summary><p>Then we recast it, free. If the preview isn&apos;t right we regenerate it; if the printed figure misses the mark we remake it.</p></details>
            <details><summary>How long does it take?</summary><p>The preview is instant and free. Once you order, your figure ships in about 2–4 days.</p></details>
            <details><summary>What&apos;s it made of?</summary><p>Durable full-color resin, hand-finished. A keepsake for your shelf.</p></details>
            <details><summary>What sizes are available?</summary><p>Standard (12cm), Large (16cm) and Grand (22cm) — pick whichever fits your shelf best when you build your preview.</p></details>
            <details><summary>Can I add their name to the base?</summary><p>Yes — add an engraved nameplate with your pet&apos;s name, plus optional extras like a display base, bandana or gift box.</p></details>
            <details><summary>Do you ship internationally?</summary><p>Right now we ship within the US only, with more countries coming soon.</p></details>
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
