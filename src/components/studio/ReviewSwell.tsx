"use client";

import { useState } from "react";
import styles from "./ReviewSwell.module.css";

type Review = { src: string; name: string; breed: string; text: string };

export function ReviewSwell({ reviews }: { reviews: Review[] }) {
  const [index, setIndex] = useState(0);
  const n = reviews.length;

  function go(dir: 1 | -1) {
    setIndex((i) => (i + dir + n) % n);
  }

  return (
    <div className={styles.viewport}>
      <button
        className={`${styles.arrow} ${styles.arrowLeft}`}
        onClick={() => go(-1)}
        aria-label="Previous"
      >
        ‹
      </button>

      <div className={styles.track}>
        {reviews.map((r, i) => {
          // Distancia circular más corta al centro actual (para que el loop
          // sea coherente al pasar del último al primero).
          let diff = i - index;
          if (diff > n / 2) diff -= n;
          if (diff < -n / 2) diff += n;
          const abs = Math.abs(diff);
          const scale = abs === 0 ? 1 : abs === 1 ? 0.82 : 0.68;
          const opacity = abs === 0 ? 1 : abs === 1 ? 0.75 : 0.4;
          const translate = diff * 210;

          return (
            <figure
              key={i}
              className={styles.card}
              style={{
                transform: `translateX(${translate}px) scale(${scale})`,
                opacity,
                zIndex: 10 - abs,
              }}
            >
              <img src={r.src} alt={`${r.name}, ${r.breed}`} loading="lazy" />
            </figure>
          );
        })}
      </div>

      <button
        className={`${styles.arrow} ${styles.arrowRight}`}
        onClick={() => go(1)}
        aria-label="Next"
      >
        ›
      </button>
    </div>
  );
}
