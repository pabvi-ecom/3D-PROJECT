"use client";

import { useState } from "react";
import styles from "./NameGate.module.css";

export function NameGate({ animal }: { animal: string }) {
  const [name, setName] = useState("");

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    // TODO: redirigir al formulario con el nombre precargado
  }

  return (
    <section className={styles.section}>
      <form className={styles.card} onSubmit={onSubmit}>
        <label className={styles.label} htmlFor="dog-name">
          ¿Cuál es el nombre de tu mascota?
        </label>
        <div className={styles.row}>
          <input
            id="dog-name"
            className={styles.input}
            type="text"
            placeholder="e.g. Buddy"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="off"
          />
          <button className={styles.go} type="submit" aria-label="Continue" disabled={!name.trim()}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></svg>
          </button>
        </div>
      </form>
    </section>
  );
}
