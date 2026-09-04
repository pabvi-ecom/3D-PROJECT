"use client";

import { useRef, useState } from "react";
import { motion } from "framer-motion";
import styles from "./ReviewSwell.module.css";

type Review = { src: string; name: string; breed: string; text: string };

const SWIPE_THRESHOLD = 50;

export function ReviewSwell({ reviews }: { reviews: Review[] }) {
  const [index, setIndex] = useState(0);
  const n = reviews.length;
  const startX = useRef(0);
  const dragging = useRef(false);

  function go(dir: 1 | -1) {
    setIndex((i) => (i + dir + n) % n);
  }

  function onDown(x: number) {
    startX.current = x;
    dragging.current = true;
  }
  function onUp(x: number) {
    if (!dragging.current) return;
    dragging.current = false;
    const dx = x - startX.current;
    if (dx > SWIPE_THRESHOLD) go(-1);
    else if (dx < -SWIPE_THRESHOLD) go(1);
  }

  return (
    <div
      className={styles.viewport}
      onMouseDown={(e) => onDown(e.clientX)}
      onMouseUp={(e) => onUp(e.clientX)}
      onTouchStart={(e) => onDown(e.touches[0].clientX)}
      onTouchEnd={(e) => onUp(e.changedTouches[0].clientX)}
    >
      <div className={styles.track}>
        {reviews.map((r, i) => {
          let diff = i - index;
          if (diff > n / 2) diff -= n;
          if (diff < -n / 2) diff += n;
          const abs = Math.abs(diff);
          const scale = abs === 0 ? 1.08 : abs === 1 ? 0.86 : 0.7;
          const opacity = abs === 0 ? 1 : abs === 1 ? 0.7 : 0.35;
          const translate = diff * 168;

          return (
            <motion.figure
              key={i}
              className={styles.card}
              animate={{ x: translate, scale, opacity }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              style={{ zIndex: 10 - abs }}
            >
              <img src={r.src} alt={`${r.name}, ${r.breed}`} loading="lazy" draggable={false} />
            </motion.figure>
          );
        })}
      </div>
    </div>
  );
}
