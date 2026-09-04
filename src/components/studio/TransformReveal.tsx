"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import styles from "./TransformReveal.module.css";

function FolderIcon() {
  return (
    <svg width="88" height="88" viewBox="0 0 64 64" fill="none">
      <path d="M6 16c0-2.2 1.8-4 4-4h13l4 5h27c2.2 0 4 1.8 4 4v29c0 2.2-1.8 4-4 4H10c-2.2 0-4-1.8-4-4V16z" fill="#5AAEFF" />
      <path d="M6 22h52v27c0 2.2-1.8 4-4 4H10c-2.2 0-4-1.8-4-4V22z" fill="#1E86F0" />
    </svg>
  );
}

export function TransformReveal({ before, after, animal, onCta }: { before: string; after: string; animal: string; onCta: () => void }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.5 });
  const [visible, setVisible] = useState(false);
  const [open, setOpen] = useState(false);

  if (inView && !visible) setVisible(true);

  useEffect(() => {
    if (!visible) return;
    const t = setTimeout(() => setOpen(true), 1100);
    return () => clearTimeout(t);
  }, [visible]);

  return (
    <section className={styles.section} ref={ref}>
      <div className={styles.wrap}>
        <div className={styles.text}>
          <span className={styles.eyebrow}>The transformation</span>
          <h2>Turn today&apos;s photo into forever.</h2>
          <p>
            One day your {animal} won&apos;t be there to greet you at the door.
            We turn a single photo into a hand-painted figure that keeps every
            detail of them — on your shelf, forever, long after the photos have
            faded from your feed.
          </p>
          <button className={styles.cta} onClick={onCta}>
            Don&apos;t wait to say goodbye — create yours now
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></svg>
          </button>
        </div>

        <div className={styles.visual}>
          <motion.div
            className={styles.folder}
            initial={{ scale: 1, opacity: 1, rotate: 0 }}
            animate={
              open
                ? { scale: [1, 1.2, 1.35, 0], rotate: [0, -4, 4, 0], opacity: [1, 1, 1, 0] }
                : visible
                ? { rotate: [0, -4, 4, -3, 3, 0], y: [0, -2, 0, -2, 0] }
                : {}
            }
            transition={
              open
                ? { duration: 0.55, times: [0, 0.3, 0.55, 1] }
                : { duration: 0.7, repeat: Infinity, repeatDelay: 0.15 }
            }
          >
            <FolderIcon />
          </motion.div>

          <motion.figure
            className={`${styles.photo} ${styles.photoBefore}`}
            initial={{ x: 0, y: 30, scale: 0.25, opacity: 0, rotate: 0 }}
            animate={open ? { x: -140, y: -90, scale: 1, opacity: 1, rotate: -7 } : {}}
            transition={{ type: "spring", stiffness: 190, damping: 18, delay: 0.2 }}
          >
            <img src={before} alt={`${animal}, before`} />
            <figcaption>Before</figcaption>
          </motion.figure>

          <motion.div
            className={styles.arrow}
            initial={{ opacity: 0, scale: 0.6 }}
            animate={open ? { opacity: 1, scale: 1 } : {}}
            transition={{ delay: 0.55, duration: 0.3 }}
          >
            <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></svg>
          </motion.div>

          <motion.figure
            className={`${styles.photo} ${styles.photoAfter}`}
            initial={{ x: 0, y: 30, scale: 0.25, opacity: 0, rotate: 0 }}
            animate={open ? { x: 140, y: -110, scale: 1, opacity: 1, rotate: 7 } : {}}
            transition={{ type: "spring", stiffness: 190, damping: 18, delay: 0.32 }}
          >
            <img src={after} alt={`${animal}, figure`} />
            <figcaption>Forever</figcaption>
          </motion.figure>
        </div>
      </div>
    </section>
  );
}
