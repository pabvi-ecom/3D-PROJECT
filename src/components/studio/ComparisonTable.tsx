"use client";

import { useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import styles from "./ComparisonTable.module.css";

type Row = { label: string; us: string; others: string; detail?: string };

const ROWS: Row[] = [
  {
    label: "Material",
    us: "Premium full-color resin",
    others: "Cheap plastic or gray prints",
    detail: "UV-cured, full-color resin — the same grade used for professional collectibles. Every figure is hand-sanded and finished by our team before it ships, not just pulled off a printer.",
  },
  {
    label: "See it before you pay",
    us: "Free 3D preview, no card needed",
    others: "Pay first, hope for the best",
    detail: "Upload your photo, pick the pose, size and base — we generate your 3D preview in seconds. You only pay once you're happy with exactly how it looks.",
  },
  {
    label: "Made from",
    us: "Your real photo, AI + human review",
    others: "Generic templates",
  },
  {
    label: "Shipping",
    us: "2–5 days once it ships",
    others: "3–6 weeks",
    detail: "2–5 days in transit after your figure leaves our workshop, on top of the time it takes to create it (see \"How it works\" above). We'll keep you posted the whole way.",
  },
  {
    label: "Reviews",
    us: "Real customers, real figures",
    others: "Stock photos",
  },
];

export function ComparisonTable() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.3 });
  const [open, setOpen] = useState<number | null>(null);

  return (
    <div className={styles.wrap} ref={ref}>
      <div className={styles.table}>
        <div className={styles.headRow}>
          <div className={styles.headCell} />
          <div className={`${styles.headCell} ${styles.usHead}`}>
            <span className={styles.badge}>★ Us</span>
          </div>
          <div className={styles.headCell}>
            <span className={styles.othersLabel}>Everyone else</span>
          </div>
        </div>

        {ROWS.map((row, i) => {
          const isOpen = open === i;
          const canOpen = !!row.detail;
          return (
            <motion.div
              key={row.label}
              className={styles.rowGroup}
              initial={{ opacity: 0, y: 14 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.45, delay: i * 0.08, ease: "easeOut" }}
            >
              <button
                type="button"
                className={`${styles.row} ${canOpen ? styles.rowClickable : ""}`}
                onClick={() => canOpen && setOpen(isOpen ? null : i)}
                disabled={!canOpen}
              >
                <div className={styles.labelCell}>
                  {row.label}
                  {canOpen && <span className={`${styles.chevron} ${isOpen ? styles.chevronOpen : ""}`}>⌄</span>}
                </div>
                <div className={`${styles.cell} ${styles.usCell}`}>
                  <motion.span
                    className={styles.check}
                    initial={{ scale: 0 }}
                    animate={inView ? { scale: 1 } : {}}
                    transition={{ type: "spring", stiffness: 400, damping: 18, delay: i * 0.08 + 0.15 }}
                  >
                    ✓
                  </motion.span>
                  {row.us}
                </div>
                <div className={styles.cell}>
                  <span className={styles.cross}>✕</span>
                  {row.others}
                </div>
              </button>

              {canOpen && (
                <motion.div
                  className={styles.detail}
                  initial={false}
                  animate={{ height: isOpen ? "auto" : 0, opacity: isOpen ? 1 : 0 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                >
                  <p>{row.detail}</p>
                </motion.div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
