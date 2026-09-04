"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import styles from "./TransformReveal.module.css";

export function TransformReveal({ before, after, animal }: { before: string; after: string; animal: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.5 });
  const [visible, setVisible] = useState(false);
  const [open, setOpen] = useState(false);

  if (inView && !visible) setVisible(true);

  useEffect(() => {
    if (!visible) return;
    const t = setTimeout(() => setOpen(true), 2000);
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
        </div>

        <div className={styles.visual}>
          <motion.div
            className={styles.folder}
            initial={{ scale: 1, opacity: 1 }}
            animate={open ? { scale: [1, 1.2, 1.35, 0], rotate: [0, -4, 4, 0], opacity: [1, 1, 1, 0] } : {}}
            transition={{ duration: 0.7, times: [0, 0.3, 0.55, 1] }}
          >
            📁
          </motion.div>

          <motion.figure
            className={`${styles.photo} ${styles.photoBefore}`}
            initial={{ x: 0, y: 30, scale: 0.25, opacity: 0, rotate: 0 }}
            animate={open ? { x: -140, y: -90, scale: 1, opacity: 1, rotate: -7 } : {}}
            transition={{ type: "spring", stiffness: 180, damping: 18, delay: 0.35 }}
          >
            <img src={before} alt={`${animal}, before`} />
            <figcaption>Before</figcaption>
          </motion.figure>

          <motion.div
            className={styles.arrow}
            initial={{ opacity: 0, scale: 0.6 }}
            animate={open ? { opacity: 1, scale: 1 } : {}}
            transition={{ delay: 0.75, duration: 0.3 }}
          >
            <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></svg>
          </motion.div>

          <motion.figure
            className={`${styles.photo} ${styles.photoAfter}`}
            initial={{ x: 0, y: 30, scale: 0.25, opacity: 0, rotate: 0 }}
            animate={open ? { x: 140, y: -110, scale: 1, opacity: 1, rotate: 7 } : {}}
            transition={{ type: "spring", stiffness: 180, damping: 18, delay: 0.5 }}
          >
            <img src={after} alt={`${animal}, figure`} />
            <figcaption>Forever</figcaption>
          </motion.figure>
        </div>
      </div>
    </section>
  );
}
