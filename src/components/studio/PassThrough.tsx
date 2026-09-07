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

export function PassThrough({ animal }: { animal: string }) {
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
      <div className={styles.grid}>
        <motion.div
          className={styles.videoCol}
          initial={{ opacity: 0, x: -20 }}
          animate={inView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <video ref={leaveRef} className={styles.video} src="/videos/transfer-leave.mp4" muted playsInline preload="auto" />
        </motion.div>

        <motion.div
          className={styles.textCol}
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.15 }}
        >
          <span className={styles.eyebrow}>From real life to real shelf</span>
          <h2>
            Same {animal}. <em>New home, forever.</em>
          </h2>
          <p>One day they run through your living room. From now on, they never leave your shelf.</p>
        </motion.div>

        <motion.div
          className={styles.videoCol}
          initial={{ opacity: 0, x: 20 }}
          animate={inView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <video ref={arriveRef} className={styles.video} src="/videos/transfer-arrive.mp4" muted playsInline preload="auto" />
        </motion.div>
      </div>
    </section>
  );
}
