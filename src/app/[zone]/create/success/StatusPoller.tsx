"use client";

import { useEffect, useState } from "react";
import styles from "./success.module.css";

/**
 * Vercel Hobby no permite cron cada pocos minutos, así que mientras el
 * cliente está en esta pantalla (justo tras pagar) es cuando más
 * probabilidad hay de comprobar el estado real — este poll también sirve
 * de "cron manual": cada vez que llama, revisa TODAS las figuras en
 * proceso, no solo las de este pedido.
 */
export function StatusPoller() {
  const [checked, setChecked] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let tries = 0;
    async function poll() {
      if (cancelled || tries >= 20) return;
      tries++;
      try {
        const res = await fetch("/api/cron/poll-tripo");
        const json = await res.json();
        if (!cancelled) setChecked((c) => c + (json.checked ?? 0));
      } catch {
        // silencioso — es un best-effort en background
      }
      if (!cancelled) setTimeout(poll, 6000);
    }
    poll();
    const doneTimer = setTimeout(() => setDone(true), 3000);
    return () => {
      cancelled = true;
      clearTimeout(doneTimer);
    };
  }, []);

  if (!done) return null;
  return <p className={styles.sub} style={{ fontSize: ".82rem", opacity: 0.7 }}>Your 3D model is being generated in the background.</p>;
}
