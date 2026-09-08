"use client";

import { motion } from "framer-motion";
import styles from "./Timeline.module.css";

export type StepId = "email" | "name" | "photo" | "pose" | "base" | "ready";

const STEPS: StepId[] = ["email", "name", "photo", "pose", "base", "ready"];

export function Timeline({ current }: { current: StepId }) {
  const currentIndex = Math.max(0, STEPS.indexOf(current));
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

        {STEPS.map((id, i) => {
          const pos = (i / (STEPS.length - 1)) * 100;
          const state = i < currentIndex ? "done" : i === currentIndex ? "active" : "todo";
          return (
            <div key={id} className={styles.node} style={{ left: `${pos}%` }}>
              <motion.div
                className={`${styles.dot} ${styles[state]}`}
                animate={state === "active" ? { scale: [1, 1.4, 1] } : { scale: 1 }}
                transition={state === "active" ? { duration: 1.6, repeat: Infinity, ease: "easeInOut" } : {}}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
