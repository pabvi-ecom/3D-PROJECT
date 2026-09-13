"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./admin.module.css";

export type Card = {
  id: string;
  table: "Leads" | "OrderItems";
  email: string;
  petName: string;
  figureUrl: string;
  tripoStatus: string;
  modelUrl: string;
  purchased: boolean;
};

const STATUS_COLOR: Record<string, string> = {
  "Not started": "#86868B",
  Processing: "#F4B400",
  Ready: "#34A853",
  Failed: "#D33",
};

function CardView({ card }: { card: Card }) {
  const [status, setStatus] = useState(card.tripoStatus || "Not started");
  const [modelUrl, setModelUrl] = useState(card.modelUrl);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function produce() {
    setLoading(true);
    setError(null);
    setStatus("Processing");
    try {
      const res = await fetch("/api/admin/produce-3d", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ table: card.table, id: card.id }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed");
      if (json.status === "Ready") {
        setStatus("Ready");
        setModelUrl(json.modelUrl);
      } else {
        setStatus("Processing");
      }
    } catch (e) {
      setStatus("Failed");
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.itemCard}>
      <div className={styles.itemStage}>
        {card.figureUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={card.figureUrl} alt={card.petName} />
        ) : (
          <span className={styles.noImg}>No image</span>
        )}
      </div>
      <div className={styles.itemBody}>
        <b>{card.petName || "—"}</b>
        <span className={styles.sub}>{card.email}</span>
        <span className={styles.badge} style={{ background: STATUS_COLOR[status] ?? "#86868B" }}>
          {status}
        </span>
        {error && <span className={styles.errText}>{error}</span>}
        <div className={styles.itemActions}>
          {modelUrl ? (
            <a href={modelUrl} target="_blank" rel="noreferrer" className={styles.modelLink}>
              ⬇️ 3D model
            </a>
          ) : (
            <button className={styles.produceBtn} onClick={produce} disabled={loading || !card.figureUrl}>
              {loading ? "Generating… (~1-2 min)" : "🧊 Produce 3D model"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function AdminDashboard({ orders, leads }: { orders: Card[]; leads: Card[] }) {
  const router = useRouter();
  const [tab, setTab] = useState<"orders" | "leads">("orders");
  const [refreshing, setRefreshing] = useState(false);
  const list = tab === "orders" ? orders : leads;

  function refresh() {
    setRefreshing(true);
    router.refresh();
    setTimeout(() => setRefreshing(false), 600);
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1>📦 Sculptly</h1>
        <div className={styles.tabs}>
          <button className={tab === "orders" ? styles.tabActive : styles.tab} onClick={() => setTab("orders")}>
            Purchased ({orders.length})
          </button>
          <button className={tab === "leads" ? styles.tabActive : styles.tab} onClick={() => setTab("leads")}>
            Not purchased ({leads.length})
          </button>
          <button className={styles.refreshBtn} onClick={refresh} disabled={refreshing} aria-label="Refresh">
            {refreshing ? "…" : "↻"}
          </button>
        </div>
      </header>

      <div className={styles.itemGrid}>
        {list.map((c) => (
          <CardView key={c.id} card={c} />
        ))}
        {list.length === 0 && <p className={styles.empty}>Nothing here yet.</p>}
      </div>
    </div>
  );
}
