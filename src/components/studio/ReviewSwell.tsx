"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import styles from "./ReviewSwell.module.css";

type Review = { src: string; name: string; breed: string; text: string };

const SWIPE_THRESHOLD = 50;
const RUN_DELAY = 420;
const DECEL_DELAYS = [520, 680, 900, 1200, 1600];

export function ReviewSwell({ reviews }: { reviews: Review[] }) {
  const [index, setIndex] = useState(0);
  const [gap, setGap] = useState(210);
  const n = reviews.length;
  const startX = useRef(0);
  const dragging = useRef(false);
  const viewportRef = useRef(null);
  const inView = useInView(viewportRef, { amount: 0.4 });
  const inViewRef = useRef(false);
  const decelStep = useRef(0);
  const stoppedRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    inViewRef.current = inView;
  }, [inView]);

  useEffect(() => {
    function tick() {
      if (stoppedRef.current) return;
      setIndex((i) => (i + 1) % n);

      let delay: number | undefined = RUN_DELAY;
      if (inViewRef.current) {
        delay = DECEL_DELAYS[decelStep.current];
        decelStep.current += 1;
        if (delay === undefined) {
          stoppedRef.current = true;
          return;
        }
      }
      timerRef.current = setTimeout(tick, delay);
    }
    timerRef.current = setTimeout(tick, RUN_DELAY);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [n]);

  useEffect(() => {
    function updateGap() {
      const w = window.innerWidth;
      setGap(w <= 480 ? 105 : w <= 820 ? 131 : 210);
    }
    updateGap();
    window.addEventListener("resize", updateGap);
    return () => window.removeEventListener("resize", updateGap);
  }, []);

  function stopAutoplay() {
    stoppedRef.current = true;
    if (timerRef.current) clearTimeout(timerRef.current);
  }

  function go(dir: 1 | -1) {
    setIndex((i) => (i + dir + n) % n);
  }

  function onDown(x: number) {
    stopAutoplay();
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
