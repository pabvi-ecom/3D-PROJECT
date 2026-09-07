"use client";

import { useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import styles from "./ComparisonTable.module.css";

type Card = { icon: string; label: string; us: string; others: string; detail?: string };

const CARDS: Card[] = [
  {
    icon: "🧱",
    label: "Material",
    us: "Premium full-color resin",
    others: "Cheap plastic or gray prints",
    detail: "UV-cured, full-color resin — the same grade used for professional collectibles. Every figure is hand-sanded and finished by our team before it ships, not just pulled off a printer.",
  },
  {
    icon: "👀",
    label: "See it before you pay",
    us: "Free 3D preview, no card needed",
    others: "Pay first, hope for the best",
    detail: "Upload your photo, pick the pose, size and base — we generate your 3D preview in seconds. You only pay once you're happy with exactly how it looks.",
  },
  {
    icon: "📸",
    label: "Made from",
    us: "Your real photo, AI + human review",
    others: "Generic templates",
  },
  {
    icon: "🚚",
    label: "Shipping",
    us: "2–5 days once it ships",
    others: "3–6 weeks",
    detail: "2–5 days in transit after your figure leaves our workshop, on top of the time it takes to create it (see \"How it works\" above). We'll keep you posted the whole way.",
  },
  {
    icon: "⭐",
    label: "Reviews",
    us: "Real customers, real figures",
    others: "Stock photos",
  },
];

function FlipCard({ card, index, inView }: { card: Card; index: number; inView: boolean }) {
  const [flipped, setFlipped] = useState(false);
  const canFlip = !!card.detail;

  return (
    <motion.div
      className={styles.cardOuter}
      initial={{ opacity: 0, y: 20, scale: 0.92 }}
      animate={inView ? { opacity: 1, y: 0, scale: 1 } : {}}
      transition={{ duration: 0.45, delay: index * 0.08, ease: "easeOut" }}
    >
      <div
        className={`${styles.cardInner} ${flipped ? styles.flipped : ""} ${canFlip ? styles.canFlip : ""}`}
        onClick={() => canFlip && setFlipped((f) => !f)}
      >
        <div className={styles.face}>
          <span className={styles.cardIcon}>{card.icon}</span>
          <h3 className={styles.cardLabel}>{card.label}</h3>
          <div className={styles.line}>
            <span className={styles.check}>✓</span>
            <span className={styles.usText}>{card.us}</span>
          </div>
          <div className={styles.line}>
            <span className={styles.cross}>✕</span>
            <span className={styles.othersText}>{card.others}</span>
          </div>
          {canFlip && <span className={styles.flipHint}>Tap to see why ↻</span>}
        </div>

        {canFlip && (
          <div className={`${styles.face} ${styles.back}`}>
            <span className={styles.cardIcon}>{card.icon}</span>
            <p className={styles.detailText}>{card.detail}</p>
            <span className={styles.flipHint}>↻ Back</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}

export function ComparisonTable() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.3 });

  return (
    <div className={styles.wrap} ref={ref}>
      <div className={styles.legend}>
        <span className={styles.usBadge}>★ Us</span>
        <span className={styles.othersBadge}>Everyone else</span>
      </div>
      <div className={styles.grid}>
        {CARDS.map((card, i) => (
          <FlipCard key={card.label} card={card} index={i} inView={inView} />
        ))}
      </div>
    </div>
  );
}
