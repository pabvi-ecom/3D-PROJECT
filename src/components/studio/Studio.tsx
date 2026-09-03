"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./Studio.module.css";
import { brand } from "@/config/brand";
import { poses, paidBases, bases, NO_BASE_ID, NAMEPLATE_PRICE, packs, type Pack } from "@/config/products";
import type { Zone } from "@/config/zones";

const FIGURE_PRICE = 79.99;

const GALLERY = [
  "/examples/labrador-wood.jpg", "/examples/setter-marble.jpg", "/examples/basset-black.jpg",
  "/examples/basset-marble.jpg", "/examples/golden-white.jpg", "/examples/basset-wood.jpg",
  "/examples/lifestyle-cooper.jpg", "/examples/lifestyle-daisy.jpg",
  "/examples/lifestyle-buddy.jpg", "/examples/lifestyle-bailey.jpg",
];

// Reseñas que rotan mientras se genera la figura.
// TODO: nombres/textos de EJEMPLO — sustituir por reseñas reales antes de lanzar
// anuncios (la FTC prohíbe reseñas inventadas presentadas como reales).
const REVIEWS = [
  { src: "/examples/labrador-wood.jpg", name: "Cooper", breed: "Labrador", text: "It looks exactly like him. I teared up." },
  { src: "/examples/golden-white.jpg", name: "Bella", breed: "Golden Retriever", text: "The detail on her fur is unreal." },
  { src: "/examples/setter-marble.jpg", name: "Max", breed: "Setter", text: "Best gift I've ever given my mom." },
  { src: "/examples/basset-black.jpg", name: "Daisy", breed: "Basset Hound", text: "Now she's on our shelf forever." },
  { src: "/examples/basset-marble.jpg", name: "Rocky", breed: "Basset Hound", text: "Even got his little spots right." },
  { src: "/examples/basset-wood.jpg", name: "Luna", breed: "Basset Hound", text: "So much better than a photo." },
];

const key = (poseId: string, baseId: string, view: "front" | "side" = "front") => `${poseId}|${baseId}|${view}`;

export default function Studio({ zone }: { zone: Zone }) {
  const [photo, setPhoto] = useState<string | null>(null);
  const [figures, setFigures] = useState<Record<string, string>>({});
  const [namedFigures, setNamedFigures] = useState<Record<string, string>>({});
  const [nameLoading, setNameLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [phase, setPhase] = useState<"poses" | "base">("poses");
  const [error, setError] = useState<string | null>(null);
  const [poseId, setPoseId] = useState(poses[0].id);
  const [baseId, setBaseId] = useState(NO_BASE_ID);
  const [view, setView] = useState<"front" | "side">("front");
  const [addName, setAddName] = useState(false);
  const [petName, setPetName] = useState("");
  const [askName, setAskName] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  const [pendingPhoto, setPendingPhoto] = useState<string | null>(null);
  const [readingFile, setReadingFile] = useState(false);
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(0);
  const [genTotal, setGenTotal] = useState(poses.length + poses.length * paidBases.length * 2);
  const [phraseIdx, setPhraseIdx] = useState(0);
  const [reviewIdx, setReviewIdx] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);
  const gazeRef = useRef<HTMLElement>(null);
  const gazeVideoRef = useRef<HTMLVideoElement>(null);

  const animal = zone.animal;
  const pose = poses.find((p) => p.id === poseId) ?? poses[0];
  const base = bases.find((b) => b.id === baseId) ?? bases[0];
  const wantsBase = baseId !== NO_BASE_ID;
  const currentView = wantsBase ? view : "front";
  const comboKey = key(poseId, baseId, currentView);
  const plainFigure = figures[comboKey] ?? null;
  const showEngraved = wantsBase && addName;
  const figure = showEngraved ? (namedFigures[comboKey] ?? null) : plainFigure;
  const total = FIGURE_PRICE + pose.price + base.price + (wantsBase && addName ? NAMEPLATE_PRICE : 0);
  const money = (n: number) => `${brand.currencySymbol}${n.toFixed(2)}`;

  const POSE_PHRASES = [
    `Sculpting your ${animal}…`,
    "Trying every pose…",
    "Capturing every marking and color…",
    "Getting the proportions just right…",
    "The best keepsake, almost ready…",
  ];
  const BASE_PHRASES = [
    "Loading base textures…",
    "Polishing the wood…",
    "Laying the grass…",
    "Cutting the marble…",
    "Setting the nameplate…",
  ];
  const phrases = phase === "base" ? BASE_PHRASES : POSE_PHRASES;

  // El golden/bulldog del hero: el vídeo (hero.mp4) contiene UN barrido
  // continuo de la mirada (centro→izq→centro→dcha→centro→arriba→centro→
  // abajo→centro). En reposo se reproduce normal en bucle. En cuanto el
  // ratón se mueve (o se arrastra el dedo), dejamos de reproducirlo y
  // saltamos ("scrub") al fotograma exacto según la posición del cursor —
  // así el vídeo responde en tiempo real, con movimiento 100% real (no
  // fotos). Tras ~1s sin movimiento, vuelve a reproducirse solo.
  useEffect(() => {
    const v = gazeVideoRef.current;
    if (!v) return;
    let targetTime = 0;
    let raf = 0;
    let idleTimer: ReturnType<typeof setTimeout> | null = null;

    function tick() {
      if (v && !v.paused) return;
      if (v && Math.abs(v.currentTime - targetTime) > 0.01) {
        v.currentTime += (targetTime - v.currentTime) * 0.25;
      }
      raf = requestAnimationFrame(tick);
    }

    function track(clientX: number, clientY: number) {
      const el = gazeRef.current;
      if (!el || !v || !v.duration) return;
      const rect = el.getBoundingClientRect();
      const nx = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
      const ny = Math.min(1, Math.max(0, (clientY - rect.top) / rect.height));
      // Mezclamos X e Y del cursor en un único punto del timeline del vídeo
      // (el barrido recorre izq/dcha/arriba/abajo) para que responda a
      // cualquier dirección en la que se mueva el ratón.
      targetTime = ((nx + ny) / 2) * v.duration;
      if (!v.paused) v.pause();
      if (idleTimer) clearTimeout(idleTimer);
      idleTimer = setTimeout(() => v.play().catch(() => {}), 1000);
    }

    const onMouse = (e: MouseEvent) => track(e.clientX, e.clientY);
    const onTouch = (e: TouchEvent) => {
      const t = e.touches[0];
      if (t) track(t.clientX, t.clientY);
    };
    window.addEventListener("mousemove", onMouse);
    window.addEventListener("touchmove", onTouch, { passive: true });
    raf = requestAnimationFrame(tick);
    return () => {
      window.removeEventListener("mousemove", onMouse);
      window.removeEventListener("touchmove", onTouch);
      if (idleTimer) clearTimeout(idleTimer);
      cancelAnimationFrame(raf);
    };
  }, []);

  // Frases + reseñas rotando mientras carga.
  useEffect(() => {
    if (!loading) return;
    setPhraseIdx(0);
    setReviewIdx(0);
    const t = setInterval(() => {
      setPhraseIdx((i) => i + 1);
      setReviewIdx((i) => (i + 1) % REVIEWS.length);
    }, 2600);
    return () => clearInterval(t);
  }, [loading, phase]);

  // Barra de progreso: avanza hacia el objetivo según cuántas imágenes llevamos.
  useEffect(() => {
    if (!loading) return;
    const target = Math.min(96, ((done + 0.85) / genTotal) * 100);
    const t = setInterval(() => {
      setProgress((p) => (p < target ? p + (target - p) * 0.12 : p));
    }, 320);
    return () => clearInterval(t);
  }, [loading, done, genTotal]);

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

  // Graba el nombre en la placa bajo demanda: solo se pide a la IA cuando el
  // cliente activa "Add their name" para la combinación (postura/base/vista) actual.
  useEffect(() => {
    if (!showEngraved || !plainFigure || namedFigures[comboKey] || nameLoading) return;
    let cancelled = false;
    setNameLoading(true);
    postGenerate({ referenceUrl: plainFigure, change: "name", baseId, petName })
      .then((url) => {
        if (!cancelled) setNamedFigures((m) => ({ ...m, [comboKey]: url }));
      })
      .catch((e) => !cancelled && setError((e as Error).message))
      .finally(() => !cancelled && setNameLoading(false));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showEngraved, plainFigure, comboKey, petName]);

  // Al subir: genera TODAS las combinaciones de golpe (postura x base x vista), para que
  // luego cambiar de postura, base o vista sea instantáneo (nada se regenera).
  // 1) 1ª postura desde la foto; las otras posturas por referencia (sin base, vista frontal).
  // 2) Con las posturas ya listas, la base de pago para CADA postura (vista frontal).
  // 3) Con base + frontal listos, la vista LATERAL para CADA combo con base
  //    (solo con base: sin base no hace falta lateral).
  async function generateAllPoses(dataUri: string) {
    setLoading(true);
    setError(null);
    setFigures({});
    setPhase("poses");
    const total = poses.length + poses.length * paidBases.length * 2;
    setGenTotal(total);
    setDone(0);
    setProgress(0);
    setPoseId(poses[0].id);
    setBaseId(NO_BASE_ID);
    setView("front");
    setAddName(false);
    try {
      const first = await postGenerate({ imageBase64: dataUri, poseId: poses[0].id, baseId: NO_BASE_ID });
      setDone(1);
      const restPoses = poses.slice(1);
      const restResults = await Promise.all(
        restPoses.map((p) =>
          postGenerate({ referenceUrl: first, change: "pose", poseId: p.id }).then((url) => {
            setDone((d) => d + 1);
            return [p.id, url] as const;
          }),
        ),
      );
      const noneByPose: Record<string, string> = { [poses[0].id]: first };
      for (const [pid, url] of restResults) noneByPose[pid] = url;

      setPhase("base");
      const baseResults = await Promise.all(
        poses.flatMap((p) =>
          paidBases.map((b) =>
            postGenerate({ referenceUrl: noneByPose[p.id], change: "base", baseId: b.id }).then((url) => {
              setDone((d) => d + 1);
              return [key(p.id, b.id, "front"), url] as const;
            }),
          ),
        ),
      );
      const frontByCombo: Record<string, string> = {};
      for (const [k, u] of baseResults) frontByCombo[k] = u;

      const sideResults = await Promise.all(
        poses.flatMap((p) =>
          paidBases.map((b) =>
            postGenerate({ referenceUrl: frontByCombo[key(p.id, b.id, "front")], change: "view", baseId: b.id }).then((url) => {
              setDone((d) => d + 1);
              return [key(p.id, b.id, "side"), url] as const;
            }),
          ),
        ),
      );

      const map: Record<string, string> = {};
      for (const pid of Object.keys(noneByPose)) map[key(pid, NO_BASE_ID, "front")] = noneByPose[pid];
      for (const [k, u] of baseResults) map[k] = u;
      for (const [k, u] of sideResults) map[k] = u;
      setProgress(100);
      setFigures(map);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  // Tras elegir la foto pedimos el nombre de la mascota (hace falta para
  // grabarlo en la placa de la base más adelante) y luego arrancamos la
  // generación — así el selector de archivo nunca depende de un paso previo.
  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setError(null);
    setReadingFile(true);
    const reader = new FileReader();
    reader.onload = () => {
      const dataUri = reader.result as string;
      setReadingFile(false);
      if (!petName) {
        setPendingPhoto(dataUri);
        setNameDraft("");
        setAskName(true);
      } else {
        setPhoto(dataUri);
        generateAllPoses(dataUri);
      }
    };
    reader.onerror = () => {
      setReadingFile(false);
      setError("Couldn't read that photo");
    };
    reader.readAsDataURL(f);
  }

  // Todas las combinaciones (postura x base) ya están generadas de golpe al
  // subir la foto — cambiar de postura o de base es solo un cambio de estado,
  // instantáneo, sin llamar a la IA de nuevo.
  function pickPose(id: string) {
    if (loading) return;
    setPoseId(id);
  }

  function enableBase() {
    setBaseId(paidBases[0].id);
    setView("front");
  }

  function disableBase() {
    setBaseId(NO_BASE_ID);
    setView("front");
  }

  function pickBase(id: string) {
    if (loading) return;
    setBaseId(id);
  }

  function pickView(v: "front" | "side") {
    if (loading) return;
    setView(v);
  }

  function reset() {
    setPhoto(null);
    setPendingPhoto(null);
    setFigures({});
    setNamedFigures({});
    setPoseId(poses[0].id);
    setBaseId(NO_BASE_ID);
    setView("front");
    setAddName(false);
    setError(null);
    setProgress(0);
    setDone(0);
    if (fileRef.current) fileRef.current.value = "";
  }

  // El selector de archivo se abre SIEMPRE con un click directo (gesto de
  // usuario), sin pasos intermedios — así nunca lo bloquea el navegador.
  const openPicker = () => fileRef.current?.click();

  function confirmName(e: React.FormEvent) {
    e.preventDefault();
    const n = nameDraft.trim();
    if (!n) return;
    setPetName(n);
    setAskName(false);
    if (pendingPhoto) {
      setPhoto(pendingPhoto);
      generateAllPoses(pendingPhoto);
      setPendingPhoto(null);
    }
  }

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

  const ReadingOverlay = readingFile && (
    <div className={styles.modalOverlay} role="status" aria-live="polite">
      <div className={styles.modalCard} style={{ textAlign: "center" }}>
        <div className={styles.spinner} style={{ margin: "0 auto 14px" }} />
        <p style={{ margin: 0, fontWeight: 700 }}>Loading your photo…</p>
      </div>
    </div>
  );

  const NameModal = askName && (
    <div className={styles.modalOverlay} role="dialog" aria-modal="true">
      <form className={styles.modalCard} onSubmit={confirmName}>
        <h2>What&apos;s your {animal}&apos;s name?</h2>
        <p>We&apos;ll use it to engrave the nameplate if you add a display base.</p>
        <input
          autoFocus
          className={styles.nameInput}
          maxLength={14}
          placeholder={`Your ${animal}'s name`}
          value={nameDraft}
          onChange={(e) => setNameDraft(e.target.value)}
        />
        <div className={styles.modalActions}>
          <button
            type="button"
            className={`${styles.btn} ${styles.btnGhost}`}
            onClick={() => {
              setAskName(false);
              setPendingPhoto(null);
              if (fileRef.current) fileRef.current.value = "";
            }}
          >
            Cancel
          </button>
          <button type="submit" className={styles.btn} disabled={!nameDraft.trim()}>Continue →</button>
        </div>
      </form>
    </div>
  );

  // ---- CONFIGURATOR STATE ----
  if (photo) {
    const rv = REVIEWS[reviewIdx];
    return (
      <div className={styles.page}>
        {Nav}
        {NameModal}
        {ReadingOverlay}
        <input ref={fileRef} type="file" accept="image/*" hidden onChange={onFile} />
        <div className={styles.wrap}>
          <div className={styles.studio}>
            <div className={styles.studioHead}>
              <h1>Your figure</h1>
              <p>Pick the pose, then decide if you want a display base.</p>
            </div>

            <div className={styles.work}>
              <figure className={styles.baBefore}>
                <img src={photo} alt="your photo" />
                <figcaption>Before</figcaption>
              </figure>

              <div className={styles.afterCol}>
                <span className={styles.afterTag}>After · your figure</span>
                <div className={styles.stage}>
                  {figure && <img src={figure} alt={`${animal} figure`} />}
                  {!figure && nameLoading && !loading && (
                    <div className={styles.loading}>
                      <div className={styles.spinner} />
                      <p className={styles.progPhrase}>Engraving {petName}&apos;s name…</p>
                    </div>
                  )}
                  {loading && (
                    <div className={styles.loading}>
                      <div className={styles.spinner} />
                      <p className={styles.progPhrase}>{phrases[phraseIdx % phrases.length]}</p>
                      <div className={styles.progTrack}>
                        <div className={styles.progFill} style={{ width: `${progress}%` }} />
                      </div>
                      <span className={styles.progPct}>{Math.round(progress)}%</span>
                      <div className={styles.review}>
                        <img src={rv.src} alt="" />
                        <div className={styles.reviewBody}>
                          <div className={styles.reviewStars}>★★★★★</div>
                          <div className={styles.reviewText}>“{rv.text}”</div>
                          <div className={styles.reviewName}>{rv.name} · {rv.breed}</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            {error && <div className={styles.err}>{error} — try another photo.</div>}

            {/* STEP 1 — POSE */}
            <div className={styles.cfgSection}>
              <div className={styles.cfgLabel}>1 · Choose the pose</div>
              <div className={styles.baseRow}>
                {poses.map((p) => (
                  <button key={p.id} className={styles.baseBtn} aria-pressed={poseId === p.id} disabled={loading} onClick={() => pickPose(p.id)}>
                    {p.label}
                    <small>{p.price ? `+${money(p.price)}` : "Free"}</small>
                  </button>
                ))}
              </div>
            </div>

            {/* STEP 2 — BASE (opcional) */}
            <div className={styles.cfgSection}>
              <div className={styles.cfgLabel}>2 · Add a display base?</div>
              <label className={styles.toggle}>
                <input
                  type="checkbox"
                  checked={wantsBase}
                  disabled={loading}
                  onChange={(e) => (e.target.checked ? enableBase() : disableBase())}
                />
                Show it on a display base (from +{money(paidBases[0].price)})
              </label>

              {wantsBase && (
                <>
                  <div className={styles.baseRow} style={{ marginTop: 12 }}>
                    {paidBases.map((b) => (
                      <button key={b.id} className={styles.baseBtn} aria-pressed={baseId === b.id} disabled={loading} onClick={() => pickBase(b.id)}>
                        {b.label}
                        <small>+{money(b.price)}</small>
                      </button>
                    ))}
                  </div>
                  <div className={styles.baseRow} style={{ marginTop: 12 }}>
                    <button className={styles.baseBtn} aria-pressed={view === "front"} disabled={loading} onClick={() => pickView("front")}>Front view</button>
                    <button className={styles.baseBtn} aria-pressed={view === "side"} disabled={loading} onClick={() => pickView("side")}>Side view</button>
                  </div>
                  <label className={styles.toggle} style={{ marginTop: 16 }}>
                    <input type="checkbox" checked={addName} onChange={(e) => setAddName(e.target.checked)} />
                    Engrave &quot;{petName.toUpperCase()}&quot; on the base (+{money(NAMEPLATE_PRICE)})
                  </label>
                </>
              )}
            </div>

            <div className={styles.summary}>
              <div className={styles.row}><span>Figure · full-color resin</span><b>{money(FIGURE_PRICE)}</b></div>
              <div className={styles.row}><span>Pose — {pose.label}</span><span>{pose.price ? `+${money(pose.price)}` : "Free"}</span></div>
              <div className={styles.row}><span>Base — {base.label}</span><span>{base.price ? `+${money(base.price)}` : "—"}</span></div>
              {wantsBase && addName && <div className={styles.row}><span>Nameplate — “{petName.toUpperCase()}”</span><span>+{money(NAMEPLATE_PRICE)}</span></div>}
              <div className={styles.tot}><span>Total</span><b>{money(total)}</b></div>
              <button className={styles.buy} disabled={!figure || loading || nameLoading}>Add to cart →</button>
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
      {NameModal}
      {ReadingOverlay}
      <input ref={fileRef} type="file" accept="image/*" hidden onChange={onFile} />

      <section className={styles.heroFull} ref={gazeRef}>
        <video
          ref={gazeVideoRef}
          className={styles.heroVideo}
          src="/pet/hero.mp4"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          aria-hidden
        />
        <div className={styles.heroScrim} />
        <div className={`${styles.wrap} ${styles.heroContent}`}>
          <div className={styles.heroLeft}>
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
          </div>
          <div className={styles.heroRight}>
            <div className={styles.heroStat}><b>4.9<span className={styles.stars}> ★★★★★</span></b><span>loved by pet parents</span></div>
            <div className={styles.heroStat}><b>2–4 days</b><span>🚚 fast shipping</span></div>
            <div className={styles.heroStat}><b>Full-color</b><span>hand-finished resin</span></div>
          </div>
        </div>
      </section>

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
            <div className={styles.howc}><div className={styles.n}>2</div><h3>Make it yours</h3><p>Pick the pose and, if you like, a display base with their name. You only pay when you love it.</p></div>
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
