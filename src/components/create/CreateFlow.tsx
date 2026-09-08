"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./CreateFlow.module.css";
import { brand } from "@/config/brand";
import { poses, paidBases, bases, NO_BASE_ID, NAMEPLATE_PRICE } from "@/config/products";
import type { Zone } from "@/config/zones";
import { Timeline, type StepId } from "./Timeline";
import { MiniGame } from "./MiniGame";

const FIGURE_PRICE = 79.99;

const REVIEWS = [
  { src: "/examples/lifestyle-coco.jpg", name: "Coco", breed: "Cocker Spaniel", text: "I loved it so much I teared up opening the box." },
  { src: "/examples/lifestyle-cooper.jpg", name: "Cooper", breed: "Havanese mix", text: "Best gift I've ever given — my mom cried." },
  { src: "/examples/lifestyle-daisy.jpg", name: "Daisy", breed: "Goldendoodle", text: "So much better than a photo. It's actually her." },
  { src: "/examples/lifestyle-bailey.jpg", name: "Bailey", breed: "Dalmatian", text: "Even got his spots exactly right, down to the last one." },
  { src: "/examples/lifestyle-luna.jpg", name: "Luna", breed: "French Bulldog", text: "Every wrinkle, spot on. I still can't believe it." },
  { src: "/examples/lifestyle-charlie.jpg", name: "Charlie", breed: "Cavalier Spaniel", text: "Gave it to my sister and she full-on cried." },
  { src: "/examples/lifestyle-milo.jpg", name: "Milo", breed: "Beagle", text: "Ordered one, then immediately ordered two more." },
  { src: "/examples/lifestyle-oliver.jpg", name: "Oliver", breed: "Maine Coon", text: "That fluff — they actually nailed it." },
];

const key = (poseId: string, baseId: string, view: "front" | "side" = "front") => `${poseId}|${baseId}|${view}`;

export function CreateFlow({ zone, initialName }: { zone: Zone; initialName?: string }) {
  const router = useRouter();
  const animal = zone.animal;

  const [step, setStep] = useState<StepId>("email");
  const [email, setEmail] = useState("");
  const [emailDraft, setEmailDraft] = useState("");
  const [petName, setPetName] = useState(initialName ?? "");
  const [nameDraft, setNameDraft] = useState(initialName ?? "");

  const [photo, setPhoto] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [readingFile, setReadingFile] = useState(false);
  const [figures, setFigures] = useState<Record<string, string>>({});
  const [namedFigures, setNamedFigures] = useState<Record<string, string>>({});
  const [nameLoading, setNameLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [poseId, setPoseId] = useState(poses[0].id);
  const [baseId, setBaseId] = useState(NO_BASE_ID);
  const [view, setView] = useState<"front" | "side">("front");
  const [addName, setAddName] = useState(false);

  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(0);
  const [genTotal, setGenTotal] = useState(poses.length + poses.length * paidBases.length * 2);
  const [phraseIdx, setPhraseIdx] = useState(0);
  const [reviewIdx, setReviewIdx] = useState(0);

  const fileRef = useRef<HTMLInputElement>(null);

  const pose = poses.find((p) => p.id === poseId) ?? poses[0];
  const base = bases.find((b) => b.id === baseId) ?? bases[0];
  const wantsBase = baseId !== NO_BASE_ID;
  const currentView = wantsBase ? view : "front";
  const comboKey = key(poseId, baseId, currentView);
  const plainFigure = figures[comboKey] ?? null;
  // El grabado del nombre solo se muestra en vista frontal — en lateral la IA
  // no coloca el texto en el ángulo correcto de forma fiable (queda a medias).
  const showEngraved = wantsBase && addName && currentView === "front";
  const figure = showEngraved ? (namedFigures[comboKey] ?? null) : plainFigure;
  const total = FIGURE_PRICE + pose.price + base.price + (wantsBase && addName ? NAMEPLATE_PRICE : 0);
  const money = (n: number) => `${brand.currencySymbol}${n.toFixed(2)}`;

  const PHRASES = [
    `Sculpting your ${animal}…`,
    "Trying every pose…",
    "Capturing every marking and color…",
    "Getting the proportions just right…",
    "The best keepsake, almost ready…",
  ];

  useEffect(() => {
    if (!generating) return;
    setPhraseIdx(0);
    setReviewIdx(0);
    const t = setInterval(() => {
      setPhraseIdx((i) => i + 1);
      setReviewIdx((i) => (i + 1) % REVIEWS.length);
    }, 2600);
    return () => clearInterval(t);
  }, [generating]);

  useEffect(() => {
    if (!generating) return;
    const target = Math.min(96, ((done + 0.85) / genTotal) * 100);
    const t = setInterval(() => {
      setProgress((p) => (p < target ? p + (target - p) * 0.12 : p));
    }, 320);
    return () => clearInterval(t);
  }, [generating, done, genTotal]);

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

  async function generateAllPoses(dataUri: string) {
    setGenerating(true);
    setError(null);
    setFigures({});
    const totalGen = poses.length + poses.length * paidBases.length * 4;
    setGenTotal(totalGen);
    setDone(0);
    setProgress(0);
    setPoseId(poses[0].id);
    setBaseId(NO_BASE_ID);
    setView("front");
    setAddName(false);
    try {
      const first = await postGenerate({ imageBase64: dataUri, poseId: poses[0].id, baseId: NO_BASE_ID, notes: notes.trim() || undefined });
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
      // La vista lateral se genera DIRECTO desde la foto original (no encadenada
      // sobre la frontal ya generada) — encadenar "coge esta figura y gírala"
      // hacía que el modelo perdiera la postura (volvía a sentado). Generarla
      // desde cero con la postura y la base ya en el mismo prompt es más fiable.
      const sideResults = await Promise.all(
        poses.flatMap((p) =>
          paidBases.map((b) =>
            postGenerate({ imageBase64: dataUri, poseId: p.id, baseId: b.id, view: "side", notes: notes.trim() || undefined }).then((url) => {
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
      setFigures(map);

      // Pre-genera TAMBIÉN las versiones grabadas (frontal + lateral) para cada
      // postura/base — así activar "Engrave" o cambiar de vista es instantáneo,
      // sin esperar a una generación nueva.
      const namedResults = await Promise.all(
        poses.flatMap((p) =>
          paidBases.flatMap((b) =>
            (["front", "side"] as const).map((v) =>
              postGenerate({ referenceUrl: map[key(p.id, b.id, v)], change: "name", baseId: b.id, petName }).then((url) => {
                setDone((d) => d + 1);
                return [key(p.id, b.id, v), url] as const;
              }),
            ),
          ),
        ),
      );
      const namedMap: Record<string, string> = {};
      for (const [k, u] of namedResults) namedMap[k] = u;
      setNamedFigures(namedMap);

      setProgress(100);
      setStep("pose");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setGenerating(false);
    }
  }

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setError(null);
    setReadingFile(true);
    const reader = new FileReader();
    reader.onload = () => {
      const dataUri = reader.result as string;
      setReadingFile(false);
      setPhoto(dataUri);
    };
    reader.onerror = () => {
      setReadingFile(false);
      setError("Couldn't read that photo");
    };
    reader.readAsDataURL(f);
  }

  // TODO: cuando salga de pruebas, exigir formato @gmail.com aquí (pedido explícito).
  function confirmEmail(e: React.FormEvent) {
    e.preventDefault();
    const v = emailDraft.trim();
    if (!v || !v.includes("@")) return;
    setEmail(v);
    fetch("/api/lead", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: v, zone: zone.slug }),
    }).catch(() => {});
    setStep(initialName ? "photo" : "name");
  }

  function confirmName(e: React.FormEvent) {
    e.preventDefault();
    const n = nameDraft.trim();
    if (!n) return;
    setPetName(n);
    setStep("photo");
  }

  function goPose() {
    setStep("base");
  }

  function goBase() {
    setStep(wantsBase && !addName ? "base" : "ready");
  }

  const STEP_ORDER: StepId[] = ["email", "name", "photo", "pose", "base", "ready"];
  function goBack() {
    const idx = STEP_ORDER.indexOf(step);
    if (idx > 0) setStep(STEP_ORDER[idx - 1]);
  }

  const BackBtn = (
    <button type="button" className={styles.stepBack} onClick={goBack} aria-label="Go back">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5" /><path d="m11 18-6-6 6-6" /></svg>
    </button>
  );

  const timelineStep: StepId = generating ? "photo" : step;
  const rv = REVIEWS[reviewIdx];

  return (
    <div className={styles.page}>
      <input ref={fileRef} type="file" accept="image/*" hidden onChange={onFile} />

      <header className={styles.header}>
        <button className={styles.back} onClick={() => router.push(`/${zone.slug}`)}>← {brand.name}</button>
        <Timeline current={timelineStep} />
        <span className={styles.headerSpacer} />
      </header>

      <main className={`${styles.main} ${generating ? styles.mainWide : ""}`}>
        {step === "email" && (
          <div className={styles.card}>
            <span className={styles.stepTag}>Before we start</span>
            <h1>✉️ Where should we send your free preview?</h1>
            <p className={styles.sub}>Just so we can save it and get it back to you — no spam, ever.</p>
            <form onSubmit={confirmEmail} className={styles.form}>
              <input
                autoFocus
                type="email"
                className={styles.nameInput}
                placeholder="you@email.com"
                value={emailDraft}
                onChange={(e) => setEmailDraft(e.target.value)}
              />
              <button type="submit" className={styles.cta} disabled={!emailDraft.trim().includes("@")}>
                Continue
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></svg>
              </button>
            </form>
          </div>
        )}

        {step === "name" && (
          <div className={styles.card}>
            <div className={styles.stepHead}>{BackBtn}<span className={styles.stepTag}>Step 2 of 6</span></div>
            <h1>✏️ What&apos;s your pet&apos;s name?</h1>
            <p className={styles.sub}>We&apos;ll use it to personalize your preview and engrave it if you add a display base.</p>
            <form onSubmit={confirmName} className={styles.form}>
              <input
                autoFocus
                className={styles.nameInput}
                maxLength={20}
                placeholder="Your pet's name"
                value={nameDraft}
                onChange={(e) => setNameDraft(e.target.value)}
              />
              <button type="submit" className={styles.cta} disabled={!nameDraft.trim()}>
                Continue
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></svg>
              </button>
            </form>
          </div>
        )}

        {step === "photo" && !generating && (
          <div className={styles.card}>
            <div className={styles.stepHead}>{BackBtn}<span className={styles.stepTag}>Step 3 of 6</span></div>
            <h1>📸 Upload a photo of {petName}</h1>
            <p className={styles.sub}>Any normal snapshot works best when it&apos;s clear and front-facing.</p>
            {photo ? (
              <div className={styles.photoPreview}>
                <img src={photo} alt="" />
                <button className={styles.changePhoto} onClick={() => fileRef.current?.click()}>Change photo</button>
              </div>
            ) : (
              <button className={styles.uploadBox} onClick={() => fileRef.current?.click()} disabled={readingFile}>
                <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 16V4" /><path d="m6 10 6-6 6 6" /><path d="M4 18v1a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-1" /></svg>
                <span>{readingFile ? "Loading…" : "Tap to choose a photo"}</span>
              </button>
            )}

            <label className={styles.notesLabel}>
              Anything about {petName} we can&apos;t tell from the photo?
              <textarea
                className={styles.notesInput}
                placeholder="e.g. &quot;no tail&quot;, missing a leg, one blue eye…"
                maxLength={200}
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </label>

            {error && <div className={styles.err}>{error}</div>}

            {photo && (
              <button className={styles.cta} onClick={() => generateAllPoses(photo)}>
                Continue
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></svg>
              </button>
            )}
          </div>
        )}

        {generating && (
          <div className={`${styles.card} ${styles.genCard}`}>
            <div className={styles.genCol}>
              <span className={styles.stepTag}>Generating your preview…</span>
              <h1>Bringing {petName} to life</h1>
              <div className={styles.genStage}>
                {photo && <img className={styles.genGhost} src={photo} alt="" />}
                <div className={styles.genOverlay}>
                  <div className={styles.spinner} />
                  <p className={styles.progPhrase}>{PHRASES[phraseIdx % PHRASES.length]}</p>
                  <div className={styles.progTrack}>
                    <div className={styles.progFill} style={{ width: `${progress}%` }} />
                  </div>
                  <span className={styles.progPct}>{Math.round(progress)}%</span>
                </div>
              </div>
              <div className={styles.review}>
                <img src={rv.src} alt="" />
                <div className={styles.reviewBody}>
                  <div className={styles.reviewStars}>★★★★★</div>
                  <div className={styles.reviewText}>&ldquo;{rv.text}&rdquo;</div>
                  <div className={styles.reviewName}>{rv.name} · {rv.breed}</div>
                </div>
              </div>
            </div>
            <div className={styles.genCol}>
              <p className={styles.gameHint}>⏱️ Takes about 60 seconds — got time for a quick round?</p>
              <MiniGame />
            </div>
          </div>
        )}

        {step === "pose" && (
          <div className={styles.card}>
            <div className={styles.stepHead}>{BackBtn}<span className={styles.stepTag}>Step 4 of 6</span></div>
            <h1>🐾 Pick a pose</h1>
            <p className={styles.sub}>Both are ready — pick whichever looks most like {petName}.</p>
            <div className={styles.poseGrid}>
              {poses.map((p) => {
                const img = figures[key(p.id, NO_BASE_ID, "front")];
                return (
                  <button
                    key={p.id}
                    className={`${styles.poseCard} ${poseId === p.id ? styles.poseCardActive : ""}`}
                    onClick={() => setPoseId(p.id)}
                  >
                    {p.id === "sitting" && <span className={styles.popBadge}>86% pick this</span>}
                    {img && <img src={img} alt={p.label} />}
                    <span>{p.label}</span>
                  </button>
                );
              })}
            </div>
            <button className={styles.cta} onClick={goPose}>
              Continue
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></svg>
            </button>
          </div>
        )}

        {step === "base" && (
          <div className={styles.card}>
            <div className={styles.stepHead}>{BackBtn}<span className={styles.stepTag}>Step 5 of 6</span></div>
            <h1>🏆 Add a display base?</h1>
            <p className={styles.sub}>A base with {petName}&apos;s name engraved makes it shelf-ready.</p>

            <div className={styles.stage}>
              {figure && <img src={figure} alt={`${animal} figure`} />}
            </div>

            <div className={styles.baseChoice}>
              <button className={`${styles.baseBtn} ${!wantsBase ? styles.baseBtnActive : ""}`} onClick={() => { setBaseId(NO_BASE_ID); setView("front"); }}>
                No base
              </button>
              {paidBases.map((b) => (
                <button key={b.id} className={`${styles.baseBtn} ${baseId === b.id ? styles.baseBtnActive : ""}`} onClick={() => { setBaseId(b.id); setView("front"); }}>
                  <span className={styles.popBadge}>94% pick this</span>
                  {b.label} <small>+{money(b.price)}</small>
                </button>
              ))}
            </div>

            {wantsBase && (
              <>
                <div className={styles.baseChoice}>
                  <button className={`${styles.baseBtn} ${view === "front" ? styles.baseBtnActive : ""}`} onClick={() => setView("front")}>Front view</button>
                  <button className={`${styles.baseBtn} ${view === "side" ? styles.baseBtnActive : ""}`} onClick={() => setView("side")}>Side view</button>
                </div>

                <label className={styles.toggle}>
                  <input type="checkbox" checked={addName} onChange={(e) => setAddName(e.target.checked)} />
                  Engrave &quot;{petName.toUpperCase()}&quot; on the base (+{money(NAMEPLATE_PRICE)})
                  <span className={styles.popBadgeInline}>99% pick this</span>
                </label>
              </>
            )}

            <button className={styles.cta} onClick={goBase} disabled={nameLoading}>
              {nameLoading ? "Engraving…" : "Continue"}
              {!nameLoading && <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></svg>}
            </button>
          </div>
        )}

        {step === "ready" && (
          <div className={styles.card}>
            <span className={styles.stepTag}>You&apos;re all set</span>
            <h1>🎁 {petName}&apos;s figure is ready</h1>
            <div className={styles.stage}>
              {figure && <img src={figure} alt={`${animal} figure`} />}
            </div>
            <div className={styles.summary}>
              <div className={styles.row}><span>Figure · full-color resin</span><b>{money(FIGURE_PRICE)}</b></div>
              <div className={styles.row}><span>Pose — {pose.label}</span><span>{pose.price ? `+${money(pose.price)}` : "Free"}</span></div>
              <div className={styles.row}><span>Base — {base.label}</span><span>{base.price ? `+${money(base.price)}` : "—"}</span></div>
              {wantsBase && addName && <div className={styles.row}><span>Nameplate — &ldquo;{petName.toUpperCase()}&rdquo;</span><span>+{money(NAMEPLATE_PRICE)}</span></div>}
              <div className={styles.tot}><span>Total</span><b>{money(total)}</b></div>
              <button className={styles.buy} disabled>Checkout — coming soon</button>
            </div>
            <button className={styles.linkBtn} onClick={() => setStep("base")}>← Back to base options</button>
          </div>
        )}
      </main>
    </div>
  );
}
