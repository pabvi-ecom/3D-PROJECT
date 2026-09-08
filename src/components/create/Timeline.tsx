"use client";

import { motion } from "framer-motion";
import styles from "./Timeline.module.css";

export type StepId = "email" | "name" | "photo" | "pose" | "base" | "ready";

const STEPS: { id: StepId; icon: string }[] = [
  { id: "email", icon: "✉️" },
  { id: "name", icon: "✏️" },
  { id: "photo", icon: "📸" },
  { id: "pose", icon: "🐾" },
  { id: "base", icon: "🏆" },
  { id: "ready", icon: "🎁" },
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
                animate={state === "active" ? { scale: [1, 1.15, 1] } : { scale: 1 }}
                transition={state === "active" ? { duration: 1.6, repeat: Infinity, ease: "easeInOut" } : {}}
              >
                <span className={styles.icon}>{s.icon}</span>
              </motion.div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
