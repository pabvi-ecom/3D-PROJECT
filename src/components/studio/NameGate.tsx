"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./NameGate.module.css";

export function NameGate({ animal, zoneSlug }: { animal: string; zoneSlug: string }) {
  const [name, setName] = useState("");
  const router = useRouter();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const n = name.trim();
    if (!n) return;
    router.push(`/${zoneSlug}/create?name=${encodeURIComponent(n)}`);
  }

  return (
    <section className={styles.section}>
      <form className={styles.card} onSubmit={onSubmit}>
        <label className={styles.label} htmlFor="dog-name">
          What&apos;s your pet&apos;s name?
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
