"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import styles from "./PassThrough.module.css";

// Tiempos medidos a mano en los clips fuente (ambos duran 5.04s, sin recortar):
// - transfer-leave.mp4: el perro EMPIEZA a salir de plano (parte del cuerpo ya
//   fuera) sobre los 3.7s, y ha desaparecido del todo hacia los 4.1s. Arrancamos
//   el segundo vídeo un poco antes de ese instante (3.4s) para que se solapen.
// - transfer-arrive.mp4: arranca desde el frame 0 real (base vacía, perro aún
//   no ha entrado) — si arrancara más tarde se verían dos perros a la vez.
// delay = cuándo arrancar el segundo vídeo: justo cuando el primero EMPIEZA a
// salir (no cuando ya ha salido del todo), para que se sientan como el mismo perro.
const DELAY_MS = 3100;

export function PassThrough({ onCta }: { onCta: () => void }) {
  const sectionRef = useRef(null);
  const inView = useInView(sectionRef, { once: true, amount: 0.5 });
  const leaveRef = useRef<HTMLVideoElement>(null);
  const arriveRef = useRef<HTMLVideoElement>(null);
  const startedRef = useRef(false);
  const [leavePlaying, setLeavePlaying] = useState(false);
  const [arrivePlaying, setArrivePlaying] = useState(false);

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
          initial={{ opacity: 0, x: -24 }}
          animate={inView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <div className={styles.videoFrame}>
            <video
              ref={leaveRef}
              className={styles.video}
              src="/videos/transfer-leave.mp4"
              poster="/videos/transfer-leave-poster.jpg"
              muted
              playsInline
              preload="auto"
              onPlaying={() => setLeavePlaying(true)}
            />
            {/* Overlay explícito sobre el poster nativo — en algunos navegadores el
                poster tarda en pintarse mientras el vídeo precarga y se ve negro un
                instante. Esta imagen se queda encima hasta que el vídeo REALMENTE
                empieza a reproducir (evento "playing", no "loadeddata": ese evento
                a veces no llega nunca en móvil y dejaba el vídeo negro para siempre). */}
            {!leavePlaying && <img className={styles.videoPoster} src="/videos/transfer-leave-poster.jpg" alt="" />}
          </div>
        </motion.div>

        <motion.div
          className={styles.centerCol}
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.25 }}
        >
          <h2>
            This moment won&apos;t last forever. <em>This figure will.</em>
          </h2>
          <p className={styles.sub}>Join 10,000+ pet parents who already turned today into forever.</p>
          <div className={styles.proof}>
            <span className={styles.stars}>★★★★★</span>
            <span className={styles.proofNum}>4.9/5</span>
          </div>
          <button className={styles.cta} onClick={onCta}>
            Create yours
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></svg>
          </button>
        </motion.div>

        <motion.div
          className={styles.videoCol}
          initial={{ opacity: 0, x: 24 }}
          animate={inView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <div className={styles.videoFrame}>
            <video
              ref={arriveRef}
              className={styles.video}
              src="/videos/transfer-arrive.mp4"
              poster="/videos/transfer-arrive-poster.jpg"
              muted
              playsInline
              preload="auto"
              onPlaying={() => setArrivePlaying(true)}
            />
            {!arrivePlaying && <img className={styles.videoPoster} src="/videos/transfer-arrive-poster.jpg" alt="" />}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
