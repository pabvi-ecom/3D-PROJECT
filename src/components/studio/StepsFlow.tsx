"use client";

import { useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import styles from "./StepsFlow.module.css";

type Step = {
  title: string;
  teaser: string;
  detail: string;
  icon: React.ReactNode;
};

function UploadIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 16V4" /><path d="m6 10 6-6 6 6" /><path d="M4 18v1a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-1" />
    </svg>
  );
}
function SlidersIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="4" y1="6" x2="20" y2="6" /><circle cx="9" cy="6" r="2" fill="currentColor" />
      <line x1="4" y1="12" x2="20" y2="12" /><circle cx="16" cy="12" r="2" fill="currentColor" />
      <line x1="4" y1="18" x2="20" y2="18" /><circle cx="11" cy="18" r="2" fill="currentColor" />
    </svg>
  );
}
function PrinterIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 9V3h12v6" /><rect x="4" y="9" width="16" height="8" rx="1.5" /><path d="M6 17v4h12v-4" />
    </svg>
  );
}
function GiftIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="9" width="18" height="12" rx="1" /><path d="M3 13h18" /><path d="M12 9v12" />
      <path d="M12 9c-1.5-4-6-4.5-6-1.5C6 9 9 9 12 9z" /><path d="M12 9c1.5-4 6-4.5 6-1.5C18 9 15 9 12 9z" />
    </svg>
  );
}

const STEPS: Step[] = [
  {
    title: "Upload your photo",
    teaser: "Any normal snapshot. Free · no card.",
    detail: "You'll see your figure in seconds. Any normal photo works — front-facing shots come out best, but our AI handles most angles and lighting just fine.",
    icon: <UploadIcon />,
  },
  {
    title: "Customize your figure",
    teaser: "Pick pet or person, pose, base and more.",
    detail: "Choose exactly how it should look — pet or human figure, pose, size and a display base with a name engraved. Tweak it until the preview feels perfect.",
    icon: <SlidersIcon />,
  },
  {
    title: "We print it",
    teaser: "Full-color resin, hand-finished, sent to production.",
    detail: "Once you approve the preview, your figure goes straight to print — full-color resin, hand-finished by our team, and carefully packed for shipping.",
    icon: <PrinterIcon />,
  },
  {
    title: "Receive the perfect gift",
    teaser: "Delivered to your door in 2–4 days.",
    detail: "Your one-of-a-kind keepsake arrives ready to display — a gift that actually means something, built to last forever.",
    icon: <GiftIcon />,
  },
];

export function StepsFlow() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.3 });
  const [open, setOpen] = useState<number | null>(null);

  return (
    <div className={styles.flow} ref={ref}>
      <div className={styles.line}>
        <motion.div
          className={styles.lineFill}
          initial={{ scaleX: 0 }}
          animate={inView ? { scaleX: 1 } : {}}
          transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
        />
      </div>

      <div className={styles.steps}>
        {STEPS.map((s, i) => {
          const isOpen = open === i;
          return (
            <motion.div
              key={i}
              className={`${styles.step} ${isOpen ? styles.stepOpen : ""}`}
              initial={{ opacity: 0, y: 18, scale: 0.85 }}
              animate={inView ? { opacity: 1, y: 0, scale: 1 } : {}}
              transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.25 + i * 0.22 }}
            >
              <button
                className={styles.node}
                onClick={() => setOpen(isOpen ? null : i)}
                aria-expanded={isOpen}
              >
                <span className={styles.num}>{i + 1}</span>
                <span className={styles.icon}>{s.icon}</span>
              </button>
              <h3 className={styles.title}>{s.title}</h3>
              <p className={styles.teaser}>{s.teaser}</p>
              <motion.p
                className={styles.detail}
                initial={false}
                animate={{ height: isOpen ? "auto" : 0, opacity: isOpen ? 1 : 0 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
              >
                {s.detail}
              </motion.p>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
