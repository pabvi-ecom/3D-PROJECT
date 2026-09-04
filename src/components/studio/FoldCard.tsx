"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import styles from "./FoldCard.module.css";

export function FoldCard({
  number,
  title,
  teaser,
  detail,
}: {
  number: string;
  title: string;
  teaser: string;
  detail: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <motion.button
      type="button"
      className={styles.card}
      onClick={() => setOpen((v) => !v)}
      aria-expanded={open}
      layout
      transition={{ type: "spring", stiffness: 420, damping: 32 }}
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.98 }}
    >
      <motion.div className={styles.flap} layout style={{ borderTopColor: open ? "var(--accent)" : undefined }}>
        <span className={styles.n}>{number}</span>
        <motion.span
          className={styles.chevron}
          animate={{ rotate: open ? 45 : 0 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
        >
          +
        </motion.span>
      </motion.div>

      <motion.h3 layout="position" className={styles.title}>
        {title}
      </motion.h3>

      <motion.p layout="position" className={styles.teaser}>
        {teaser}
      </motion.p>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="detail"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 380, damping: 34 }}
            className={styles.detailWrap}
          >
            <p className={styles.detail}>{detail}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );
}
