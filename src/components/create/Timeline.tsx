"use client";

import { motion } from "framer-motion";
import styles from "./Timeline.module.css";

export type StepId = "email" | "name" | "photo" | "pose" | "base" | "ready";

const STEPS: { id: StepId; label: string }[] = [
  { id: "email", label: "Email" },
  { id: "name", label: "Name" },
  { id: "photo", label: "Photo" },
  { id: "pose", label: "Pose" },
  { id: "base", label: "Base" },
  { id: "ready", label: "Ready" },
];

export function Timeline({ current }: { current: StepId }) {
  const currentIndex = Math.max(0, STEPS.findIndex((s) => s.id === current));
  const progress = currentIndex / (STEPS.length - 1);

  return (
    <div className={styles.bar}>
      <div className={styles.track}>
        <div className={styles.trackBg} />
        <motion.div
          className={styles.trackFill}
          initial={false}
          animate={{ width: `${progress * 100}%` }}
          transition={{ type: "spring", stiffness: 140, damping: 20 }}
        />

        {STEPS.map((s, i) => {
          const pos = (i / (STEPS.length - 1)) * 100;
          const state = i < currentIndex ? "done" : i === currentIndex ? "active" : "todo";
          return (
            <div key={s.id} className={styles.node} style={{ left: `${pos}%` }}>
              <motion.div
                className={`${styles.dot} ${styles[state]}`}
                animate={state === "active" ? { scale: [1, 1.18, 1] } : { scale: 1 }}
                transition={state === "active" ? { duration: 1.6, repeat: Infinity, ease: "easeInOut" } : {}}
              >
                {state === "done" && (
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
                )}
              </motion.div>
            </div>
          );
        })}
      </div>

      <div className={styles.labels}>
        {STEPS.map((s, i) => {
          const state = i < currentIndex ? "done" : i === currentIndex ? "active" : "todo";
          return (
            <span key={s.id} className={`${styles.label} ${styles[state]}`}>
              {s.label}
            </span>
          );
        })}
      </div>
    </div>
  );
}
