"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import styles from "./HowWeWork.module.css";

type Clip = { src: string; label: string };

const CLIPS: Clip[] = [
  { src: "/videos/how-design.mp4", label: "Designed & perfected" },
  { src: "/videos/how-print.mp4", label: "Printed, layer by layer" },
  { src: "/videos/how-paint.mp4", label: "Hand-painted, color by color" },
  { src: "/videos/how-pack.mp4", label: "Packed with care" },
];

function Clip({ clip, index }: { clip: Clip; index: number }) {
  const ref = useRef(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.4 });

  if (inView) videoRef.current?.play().catch(() => {});

  return (
    <motion.div
      className={styles.card}
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay: index * 0.12, ease: "easeOut" }}
    >
      <div className={styles.videoWrap}>
        <span className={styles.num}>{index + 1}</span>
        <video ref={videoRef} className={styles.video} src={clip.src} muted loop playsInline preload="auto" />
      </div>
      <p className={styles.label}>{clip.label}</p>
    </motion.div>
  );
}

export function HowWeWork() {
  return (
    <div className={styles.row}>
      {CLIPS.map((clip, i) => (
        <Clip key={clip.src} clip={clip} index={i} />
      ))}
    </div>
  );
}
