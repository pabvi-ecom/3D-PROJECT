"use client";

import styles from "./Timeline.module.css";

export type StepId = "name" | "photo" | "pose" | "base" | "ready";

const STEPS: { id: StepId; label: string }[] = [
  { id: "name", label: "Name" },
  { id: "photo", label: "Photo" },
  { id: "pose", label: "Pose" },
  { id: "base", label: "Base" },
  { id: "ready", label: "Ready" },
];

export function Timeline({ current }: { current: StepId }) {
  const currentIndex = STEPS.findIndex((s) => s.id === current);

  return (
    <div className={styles.bar}>
      {STEPS.map((s, i) => {
        const state = i < currentIndex ? "done" : i === currentIndex ? "active" : "todo";
        return (
          <div key={s.id} className={styles.step}>
            <div className={`${styles.dot} ${styles[state]}`}>{state === "done" ? "✓" : i + 1}</div>
            <span className={`${styles.label} ${styles[state]}`}>{s.label}</span>
            {i < STEPS.length - 1 && <div className={`${styles.line} ${i < currentIndex ? styles.lineDone : ""}`} />}
          </div>
        );
      })}
    </div>
  );
}
