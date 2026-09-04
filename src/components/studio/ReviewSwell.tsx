"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import styles from "./ReviewSwell.module.css";

type Review = { src: string; name: string; breed: string; text: string };

const SWIPE_THRESHOLD = 50;

export function ReviewSwell({ reviews }: { reviews: Review[] }) {
  const [index, setIndex] = useState(0);
  const [gap, setGap] = useState(210);
  const n = reviews.length;
  const startX = useRef(0);
  const dragging = useRef(false);
  const viewportRef = useRef(null);
  const inView = useInView(viewportRef, { once: true, amount: 0.4 });
  const [entered, setEntered] = useState(false);
  const [settled, setSettled] = useState(false);
  if (inView && !entered) setEntered(true);

  useEffect(() => {
    if (!entered) return;
    const t = setTimeout(() => setSettled(true), 2800);
    return () => clearTimeout(t);
  }, [entered]);

  useEffect(() => {
    function updateGap() {
      const w = window.innerWidth;
      setGap(w <= 480 ? 105 : w <= 820 ? 131 : 210);
    }
    updateGap();
    window.addEventListener("resize", updateGap);
    return () => window.removeEventListener("resize", updateGap);
  }, []);

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
      ref={viewportRef}
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
          const translate = diff * gap;

          return (
            <motion.figure
              key={i}
              className={styles.card}
              initial={entered ? false : { x: gap * n, scale: 0.7, opacity: 0 }}
              animate={entered ? { x: translate, scale, opacity } : {}}
              transition={
                !entered
                  ? {}
                  : !settled
                  ? { duration: 2, ease: [0.22, 1, 0.36, 1], delay: i * 0.12 }
                  : { type: "spring", stiffness: 300, damping: 30 }
              }
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
