"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import styles from "./HowWeWork.module.css";

type Clip = { src: string; note: string; label: string };

const CLIPS: Clip[] = [
  { src: "/videos/how-design.mp4", note: "designed & perfected here", label: "Designed & perfected" },
  { src: "/videos/how-print.mp4", note: "made real, layer by layer", label: "Printed, layer by layer" },
  { src: "/videos/how-paint.mp4", note: "hand-painted, color by color", label: "Hand-painted, color by color" },
  { src: "/videos/how-pack.mp4", note: "packed with care to survive the trip", label: "Packed with care" },
];

// Desktop: diseño original (nota manuscrita + flecha sobre el vídeo) — NO TOCAR,
// pedido explícito de mantenerlo tal cual estaba.
function DesktopClip({ clip, index }: { clip: Clip; index: number }) {
  const ref = useRef(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.4 });

  if (inView) videoRef.current?.play().catch(() => {});

  return (
    <motion.div
      className={styles.item}
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay: index * 0.12, ease: "easeOut" }}
    >
      <div className={styles.noteWrap}>
        <span className={styles.note}>{clip.note}</span>
        <svg width="18" height="34" viewBox="0 0 18 34" fill="none" className={styles.noteArrow}>
          <path d="M9 1v26" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
          <path d="M2 21l7 8 7-8" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </svg>
      </div>
      <video ref={videoRef} className={styles.video} src={clip.src} muted loop playsInline preload="auto" />
    </motion.div>
  );
}

// Mobile: rediseño con número de paso + carrusel horizontal.
function MobileClip({ clip, index }: { clip: Clip; index: number }) {
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
    <>
      <div className={`${styles.row} ${styles.desktopOnly}`}>
        {CLIPS.map((clip, i) => (
          <DesktopClip key={clip.src} clip={clip} index={i} />
        ))}
      </div>
      <div className={`${styles.row} ${styles.mobileOnly}`}>
        {CLIPS.map((clip, i) => (
          <MobileClip key={clip.src} clip={clip} index={i} />
        ))}
      </div>
    </>
  );
}
