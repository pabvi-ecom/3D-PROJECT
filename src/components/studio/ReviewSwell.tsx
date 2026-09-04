"use client";

import { useEffect, useRef } from "react";
import styles from "./ReviewSwell.module.css";

type Review = { src: string; name: string; breed: string; text: string };

const SPEED = 42; // px/s

export function ReviewSwell({ reviews }: { reviews: Review[] }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const xRef = useRef(0);
  const pausedRef = useRef(false);

  // Duplicated list so the loop is seamless — when we scroll past the
  // first copy's width we snap back by that exact width (invisible).
  const items = [...reviews, ...reviews];

  useEffect(() => {
    const track = trackRef.current;
    const container = containerRef.current;
    if (!track || !container) return;

    let raf = 0;
    let last = performance.now();
    let halfWidth = 0;

    function measure() {
      halfWidth = track!.scrollWidth / 2;
    }
    measure();
    window.addEventListener("resize", measure);

    function tick(now: number) {
      raf = requestAnimationFrame(tick);
      const dt = (now - last) / 1000;
      last = now;
      if (!pausedRef.current) {
        xRef.current -= SPEED * dt;
        if (Math.abs(xRef.current) >= halfWidth) xRef.current += halfWidth;
      }
      track!.style.transform = `translateX(${xRef.current}px)`;

      const containerRect = container!.getBoundingClientRect();
      const centerX = containerRect.left + containerRect.width / 2;
      const cards = track!.children;
      for (let i = 0; i < cards.length; i++) {
        const card = cards[i] as HTMLElement;
        const r = card.getBoundingClientRect();
        const cardCenter = r.left + r.width / 2;
        const dist = Math.abs(cardCenter - centerX);
        const norm = Math.min(dist / (containerRect.width / 2), 1);
        const scale = 1 - norm * 0.32;
        const opacity = 1 - norm * 0.55;
        const lift = (1 - norm) * 18;
        card.style.transform = `translateY(${-lift}px) scale(${scale})`;
        card.style.opacity = String(opacity);
        card.style.zIndex = String(Math.round((1 - norm) * 100));
      }
    }
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", measure);
    };
  }, [reviews.length]);

  return (
    <div
      ref={containerRef}
      className={styles.viewport}
      onMouseEnter={() => (pausedRef.current = true)}
      onMouseLeave={() => (pausedRef.current = false)}
    >
      <div ref={trackRef} className={styles.track}>
        {items.map((r, i) => (
          <figure key={i} className={styles.card}>
            <img src={r.src} alt={`${r.name}, ${r.breed}`} loading="lazy" />
          </figure>
        ))}
      </div>
    </div>
  );
}
