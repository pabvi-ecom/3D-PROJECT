"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import styles from "./ProcessReel.module.css";

type Clip = { tag: string; title: string; text: string };

const CLIPS: Clip[] = [
  {
    tag: "01 · Printing",
    title: "Your figure takes shape",
    text: "We load your approved 3D model and watch it print, layer by layer, until your pet's shape appears on the plate.",
  },
  {
    tag: "02 · Painting",
    title: "Hand-painted, detail by detail",
    text: "Every figure is painted by hand to match your pet's real colors and markings — no two brushes touch it the same way.",
  },
  {
    tag: "03 · Packing",
    title: "Wrapped up and on its way",
    text: "We inspect, box and cushion your figure so it survives the trip in one piece, then hand it off for shipping.",
  },
];

function Row({ clip, index }: { clip: Clip; index: number }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.4 });

  return (
    <div className={styles.row} ref={ref}>
      <motion.div
        className={styles.videoSlot}
        initial={{ opacity: 0, x: -24 }}
        animate={inView ? { opacity: 1, x: 0 } : {}}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className={styles.placeholder}>
          <span className={styles.playDot}>▶</span>
          <span className={styles.placeholderText}>Video goes here</span>
          <span className={styles.placeholderSpec}>9:16 · autoplay, muted, loop</span>
        </div>
      </motion.div>

      <motion.div
        className={styles.copy}
        initial={{ opacity: 0, y: 16 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.5, delay: 0.15, ease: "easeOut" }}
      >
        <span className={styles.num}>{index + 1}</span>
        <span className={styles.tag}>{clip.tag}</span>
        <h3>{clip.title}</h3>
        <p>{clip.text}</p>
      </motion.div>
    </div>
  );
}

export function ProcessReel() {
  return (
    <div className={styles.reel}>
      {CLIPS.map((clip, i) => (
        <Row key={clip.tag} clip={clip} index={i} />
      ))}
    </div>
  );
}
