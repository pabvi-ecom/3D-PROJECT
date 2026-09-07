"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import styles from "./ComparisonTable.module.css";

type Row = { label: string; us: string; others: string };

const ROWS: Row[] = [
  { label: "Material", us: "Premium full-color resin", others: "Cheap plastic or gray prints" },
  { label: "See it before you pay", us: "Free 3D preview, no card needed", others: "Pay first, hope for the best" },
  { label: "Made from", us: "Your real photo, AI + human review", others: "Generic templates" },
  { label: "Shipping", us: "2–4 days", others: "3–6 weeks" },
  { label: "If it's wrong", us: "We remake it free", others: "No refunds, no redos" },
  { label: "Reviews", us: "Real customers, real figures", others: "Stock photos" },
];

export function ComparisonTable() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.3 });

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

        {ROWS.map((row, i) => (
          <motion.div
            key={row.label}
            className={styles.row}
            initial={{ opacity: 0, y: 14 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.45, delay: i * 0.08, ease: "easeOut" }}
          >
            <div className={styles.labelCell}>{row.label}</div>
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
          </motion.div>
        ))}
      </div>
    </div>
  );
}
