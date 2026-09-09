"use client";

import { useEffect, useState } from "react";
import styles from "./AnnouncementBar.module.css";
import { brand } from "@/config/brand";

const MESSAGES = [
  `🚚 Free shipping on orders over $${Math.round(brand.freeShippingThreshold)}`,
  "📦 2–4 day shipping",
];

export function AnnouncementBar() {
  const [i, setI] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const t = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setI((n) => (n + 1) % MESSAGES.length);
        setVisible(true);
      }, 300);
    }, 3200);
    return () => clearInterval(t);
  }, []);

  return (
    <div className={styles.bar}>
      <span className={`${styles.msg} ${visible ? styles.msgVisible : ""}`}>{MESSAGES[i]}</span>
    </div>
  );
}
