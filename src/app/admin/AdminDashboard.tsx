"use client";

import { useEffect, useRef, useState } from "react";
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
  stlUrl: string;
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
  const [stlUrl, setStlUrl] = useState(card.stlUrl);
  const [prevModelUrl, setPrevModelUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [downloadingKey, setDownloadingKey] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    // Si se recarga la página mientras algo seguía procesando en segundo
    // plano (calidad "extreme" puede tardar varios minutos), retoma solo.
    if (status === "Processing") {
      setLoading(true);
      pollStatus();
    }
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function pollStatus() {
    let tries = 0;
    pollRef.current = setInterval(async () => {
      tries++;
      try {
        const res = await fetch("/api/admin/check-3d", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ table: card.table, id: card.id }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "Check failed");
        if (json.status === "Ready") {
          setStatus("Ready");
          setModelUrl(json.modelUrl);
          setStlUrl(json.stlUrl ?? "");
          setLoading(false);
          if (pollRef.current) clearInterval(pollRef.current);
        } else if (json.status === "Failed") {
          setStatus("Failed");
          setLoading(false);
          if (pollRef.current) clearInterval(pollRef.current);
        }
        // "Processing" — sigue esperando, se reintenta en el siguiente tick.
      } catch {
        // Fallo puntual de red en un tick del sondeo — no es un error real,
        // el siguiente tick (5s después) lo reintenta solo. No hay que
        // asustar con un mensaje de error por esto.
      }
      // Tope de seguridad — calidad "extreme" puede tardar varios minutos,
      // pero si pasa de 10 min algo va mal, dejamos de insistir solos.
      if (tries > 120 && pollRef.current) {
        clearInterval(pollRef.current);
        setLoading(false);
        setError("Taking unusually long — check back later or try again.");
      }
    }, 5000);
  }

  // Tripo devuelve siempre el mismo nombre de archivo genérico — sin esto,
  // dos descargas del mismo perro (antigua/nueva) son indistinguibles en la
  // carpeta de Descargas. Se descarga como blob para poder ponerle nuestro
  // propio nombre (el link cross-origin no respeta el atributo download).
  async function downloadModel(url: string, label: string) {
    setDownloadingKey(label);
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const stamp = new Date().toISOString().slice(0, 16).replace(/[-:]/g, "").replace("T", "-");
      const ext = url.toLowerCase().endsWith(".stl") ? "stl" : "glb";
      a.href = blobUrl;
      a.download = `${(card.petName || "figure").replace(/\s+/g, "-")}-${label}-${stamp}.${ext}`;
      a.click();
      URL.revokeObjectURL(blobUrl);
    } catch {
      window.open(url, "_blank");
    } finally {
      setDownloadingKey(null);
    }
  }

  async function produce() {
    setLoading(true);
    setError(null);
    setStatus("Processing");
    // Al regenerar, el link viejo se guarda aparte (con su propia etiqueta)
    // en vez de desaparecer sin más — así se pueden comparar los dos.
    if (modelUrl) {
      setPrevModelUrl(modelUrl);
      setModelUrl("");
      setStlUrl("");
    }
    try {
      const res = await fetch("/api/admin/produce-3d", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ table: card.table, id: card.id }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed");
      // Lanzada — el dashboard va comprobando el resultado solo, cada 5s,
      // sin depender de que esta misma petición aguante varios minutos.
      pollStatus();
    } catch (e) {
      setStatus("Failed");
      setError((e as Error).message);
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
          {stlUrl && !loading && (
            <button className={styles.modelLink} onClick={() => downloadModel(stlUrl, "latest-stl")} disabled={downloadingKey === "latest-stl"}>
              {downloadingKey === "latest-stl" ? "Downloading…" : "⬇️ Latest (.stl — para imprimir)"}
            </button>
          )}
          {modelUrl && !loading && (
            <button className={styles.modelLinkGhost} onClick={() => downloadModel(modelUrl, "latest-glb")} disabled={downloadingKey === "latest-glb"}>
              {downloadingKey === "latest-glb" ? "Downloading…" : "⬇️ Latest (.glb — con color)"}
            </button>
          )}
          {prevModelUrl && (
            <button className={styles.modelLinkGhost} onClick={() => downloadModel(prevModelUrl, "previous")} disabled={downloadingKey === "previous"}>
              {downloadingKey === "previous" ? "Downloading…" : "⬇️ Previous version"}
            </button>
          )}
          <button className={styles.produceBtn} onClick={produce} disabled={loading || !card.figureUrl}>
            {loading ? "Generating… (can take a few min)" : modelUrl || prevModelUrl ? "🔁 Regenerate" : "🧊 Produce 3D model"}
          </button>
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
