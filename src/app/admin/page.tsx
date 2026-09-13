import { cookies } from "next/headers";
import { listRecords } from "@/lib/airtable";
import { AdminLogin } from "./AdminLogin";
import styles from "./admin.module.css";

export const dynamic = "force-dynamic";

type OrderFields = {
  "Order ID"?: string;
  Email?: string;
  Status?: string;
  "Paid At"?: string;
  "Total Paid"?: number;
  "Discount Code"?: string;
};

type ItemFields = {
  "Pet Name"?: string;
  Order?: string[];
  Pose?: string;
  Base?: string;
  Engraved?: boolean;
  Qty?: number;
  "Unit Price"?: number;
  "Figure Image URL"?: string;
  "Tripo Status"?: string;
  "Model File URL"?: string;
};

const STATUS_COLOR: Record<string, string> = {
  "Not started": "#86868B",
  Processing: "#F4B400",
  Ready: "#34A853",
  Failed: "#D33",
};

async function Dashboard() {
  const [orders, items] = await Promise.all([
    listRecords("Orders", { filterByFormula: `{Status} = "Paid"` }),
    listRecords("OrderItems"),
  ]);

  const ordersTyped = orders as unknown as { id: string; fields: OrderFields }[];
  const itemsTyped = items as unknown as { id: string; fields: ItemFields }[];

  const sorted = [...ordersTyped].sort((a, b) => {
    const ta = a.fields["Paid At"] ? new Date(a.fields["Paid At"]!).getTime() : 0;
    const tb = b.fields["Paid At"] ? new Date(b.fields["Paid At"]!).getTime() : 0;
    return tb - ta;
  });

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1>📦 Orders</h1>
        <span className={styles.count}>{sorted.length} paid orders</span>
      </header>

      <div className={styles.orderList}>
        {sorted.map((order) => {
          const orderItems = itemsTyped.filter((it) => it.fields.Order?.includes(order.id));
          return (
            <div className={styles.orderCard} key={order.id}>
              <div className={styles.orderHead}>
                <div>
                  <b>{order.fields.Email || "—"}</b>
                  <span className={styles.sub}>
                    {order.fields["Paid At"] ? new Date(order.fields["Paid At"]!).toLocaleString() : "—"}
                  </span>
                </div>
                <div className={styles.orderMeta}>
                  <span className={styles.total}>${(order.fields["Total Paid"] ?? 0).toFixed(2)}</span>
                  {order.fields["Discount Code"] && <span className={styles.coupon}>{order.fields["Discount Code"]}</span>}
                </div>
              </div>

              <div className={styles.itemGrid}>
                {orderItems.map((it) => {
                  const f = it.fields;
                  const statusColor = STATUS_COLOR[f["Tripo Status"] ?? ""] ?? "#86868B";
                  return (
                    <div className={styles.itemCard} key={it.id}>
                      <div className={styles.itemStage}>
                        {f["Figure Image URL"] ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={f["Figure Image URL"]} alt={f["Pet Name"] ?? ""} />
                        ) : (
                          <span className={styles.noImg}>No image</span>
                        )}
                      </div>
                      <div className={styles.itemBody}>
                        <b>{f["Pet Name"] ?? "—"}</b>
                        <span className={styles.sub}>
                          {f.Pose ?? ""} · {f.Base ?? ""}
                          {f.Engraved ? " · engraved" : ""} · Qty {f.Qty ?? 1}
                        </span>
                        <span className={styles.badge} style={{ background: statusColor }}>
                          {f["Tripo Status"] ?? "Not started"}
                        </span>
                        <div className={styles.itemActions}>
                          {f["Figure Image URL"] && (
                            <a href={f["Figure Image URL"]} target="_blank" rel="noreferrer">
                              Figure image
                            </a>
                          )}
                          {f["Model File URL"] && (
                            <a href={f["Model File URL"]} target="_blank" rel="noreferrer" className={styles.modelLink}>
                              ⬇️ 3D model (.glb)
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
        {sorted.length === 0 && <p className={styles.empty}>No paid orders yet.</p>}
      </div>
    </div>
  );
}

export default async function AdminPage() {
  const store = await cookies();
  const session = store.get("admin_session")?.value;
  const authed = !!session && session === process.env.ADMIN_PASSWORD;

  if (!authed) return <AdminLogin />;
  return <Dashboard />;
}
