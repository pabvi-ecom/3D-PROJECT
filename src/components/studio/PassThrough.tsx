"use client";

import { useEffect, useRef } from "react";
import { motion, useInView } from "framer-motion";
import styles from "./PassThrough.module.css";

// Tiempos medidos a mano en los clips fuente:
// - transfer-leave.mp4: el perro sale de plano hacia la derecha en ~4.3s (dura 5.04s)
// - transfer-arrive.mp4: el perro entra por la izquierda en ~1.0s (dura 5.04s)
// delay = cuánto esperar antes de arrancar el segundo vídeo para que "entre" justo cuando el primero "sale"
const LEAVE_EXIT_AT = 4.3;
const ARRIVE_ENTER_AT = 1.0;
const DELAY_MS = (LEAVE_EXIT_AT - ARRIVE_ENTER_AT) * 1000;

export function PassThrough() {
  const sectionRef = useRef(null);
  const inView = useInView(sectionRef, { once: true, amount: 0.5 });
  const leaveRef = useRef<HTMLVideoElement>(null);
  const arriveRef = useRef<HTMLVideoElement>(null);
  const startedRef = useRef(false);

  useEffect(() => {
    if (!inView || startedRef.current) return;
    startedRef.current = true;

    const leave = leaveRef.current;
    const arrive = arriveRef.current;
    if (!leave || !arrive) return;

    leave.currentTime = 0;
    arrive.currentTime = 0;
    leave.play().catch(() => {});
    const arriveTimer = setTimeout(() => {
      arrive.play().catch(() => {});
    }, DELAY_MS);

    return () => {
      clearTimeout(arriveTimer);
    };
  }, [inView]);

  return (
    <section className={styles.section} ref={sectionRef}>
      <motion.div
        className={styles.heading}
        initial={{ opacity: 0, y: 16 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6 }}
      >
        <h2>
          They run through this room today. <em>They never leave this shelf.</em>
        </h2>
      </motion.div>

      <div className={styles.grid}>
        <motion.div
          className={styles.videoCol}
          initial={{ opacity: 0, x: -24 }}
          animate={inView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <video ref={leaveRef} className={styles.video} src="/videos/transfer-leave.mp4" muted playsInline preload="auto" />
        </motion.div>

        <motion.div
          className={styles.arrowCol}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={inView ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.4, delay: 0.5 }}
        >
          <svg width="56" height="28" viewBox="0 0 56 28" fill="none" className={styles.arrowIcon}>
            <path d="M2 14c10-10 34-10 44 0" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" fill="none" />
            <path d="M38 8c3 2 6 4 8 6-3 1-6 2-8 4" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          </svg>
        </motion.div>

        <motion.div
          className={styles.videoCol}
          initial={{ opacity: 0, x: 24 }}
          animate={inView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <div className={styles.noteWrap}>
            <span className={styles.note}>never fades</span>
            <svg width="46" height="40" viewBox="0 0 46 40" fill="none" className={styles.noteArrow}>
              <path d="M4 4c4 14 10 24 20 30" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" fill="none" />
              <path d="M17 30c1 2 3 4 7 4-2 2-3 4-3 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            </svg>
          </div>
          <video ref={arriveRef} className={styles.video} src="/videos/transfer-arrive.mp4" muted playsInline preload="auto" />
        </motion.div>
      </div>
    </section>
  );
}
