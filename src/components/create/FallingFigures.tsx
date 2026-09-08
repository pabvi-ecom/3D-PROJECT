"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import styles from "./FallingFigures.module.css";

const FIGURES = [
  "/reviews/buddy1.png",
  "/reviews/buddy2.png",
  "/reviews/bailey.png",
  "/reviews/cooper.png",
  "/reviews/milo.png",
  "/reviews/luna.png",
  "/reviews/oliver.png",
  "/reviews/miska.png",
  "/reviews/simba.png",
];

type Lane = { src: string; left: number; size: number; delay: number; duration: number; rotate: number };

export function FallingFigures() {
  const lanes = useMemo<Lane[]>(() => {
    const shuffled = [...FIGURES, ...FIGURES].sort(() => Math.random() - 0.5);
    return shuffled.map((src, i) => ({
      src,
      left: (i / shuffled.length) * 100 + (Math.random() * 6 - 3),
      size: 64 + Math.random() * 46,
      delay: Math.random() * 10,
      duration: 9 + Math.random() * 6,
      rotate: Math.random() * 20 - 10,
    }));
  }, []);

  return (
    <div className={styles.wrap} aria-hidden="true">
      {lanes.map((l, i) => (
        <motion.img
          key={i}
          src={l.src}
          alt=""
          className={styles.figure}
          style={{ left: `${l.left}%`, width: l.size, rotate: `${l.rotate}deg` }}
          initial={{ y: "-15vh", opacity: 0 }}
          animate={{ y: "115vh", opacity: [0, 1, 1, 0] }}
          transition={{
            delay: l.delay,
            duration: l.duration,
            repeat: Infinity,
            ease: "linear",
            opacity: { times: [0, 0.12, 0.85, 1], duration: l.duration, repeat: Infinity },
          }}
        />
      ))}
    </div>
  );
}
