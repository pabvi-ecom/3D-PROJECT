"use client";

import { motion } from "framer-motion";
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
          transition={{ type: "spring", stiffness: 120, damping: 18 }}
        />

        {STEPS.map((s, i) => {
          const pos = (i / (STEPS.length - 1)) * 100;
          const state = i < currentIndex ? "done" : i === currentIndex ? "active" : "todo";
          return (
            <div key={s.id} className={styles.post} style={{ left: `${pos}%` }}>
              <div className={`${styles.flag} ${styles[state]}`} />
              <span className={`${styles.label} ${styles[state]}`}>{s.label}</span>
            </div>
          );
        })}

        <motion.div
          className={styles.walker}
          initial={false}
          animate={{ left: `${progress * 100}%` }}
          transition={{ type: "spring", stiffness: 120, damping: 16 }}
        >
          🐕
        </motion.div>
      </div>
    </div>
  );
}
