"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import styles from "./AnnouncementBar.module.css";
import { brand } from "@/config/brand";

const MESSAGES = [
  `🚚 Free shipping on orders over $${Math.round(brand.freeShippingThreshold)}`,
  "📦 2–4 day shipping",
];

export function AnnouncementBar() {
  const [i, setI] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setI((n) => (n + 1) % MESSAGES.length), 3200);
    return () => clearInterval(t);
  }, []);

  return (
    <div className={styles.bar}>
      <AnimatePresence mode="wait">
        <motion.span
          key={i}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
        >
          {MESSAGES[i]}
        </motion.span>
      </AnimatePresence>
    </div>
  );
}
