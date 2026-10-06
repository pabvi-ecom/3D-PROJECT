import { cookies } from "next/headers";
import { listRecords } from "@/lib/airtable";
import { AdminLogin } from "./AdminLogin";
import { AdminDashboard, type Card } from "./AdminDashboard";

export const dynamic = "force-dynamic";

type OrderFields = { Email?: string; Status?: string; "Paid At"?: string };
type ItemFields = {
  "Pet Name"?: string;
  Order?: string[];
  "Figure Image URL"?: string;
  "Angled Image URL"?: string;
  "Tripo Status"?: string;
  "Model File URL"?: string;
  "Model STL URL"?: string;
  Views?: string;
};
type LeadFields = {
  Email?: string;
  "Pet Name"?: string;
  "Figure Image URL"?: string;
  "Angled Image URL"?: string;
  "Tripo Status"?: string;
  "Model File URL"?: string;
  "Model STL URL"?: string;
  Views?: string;
};

async function buildData() {
  const [orders, items, leads] = await Promise.all([
    listRecords("Orders", { filterByFormula: `{Status} = "Paid"` }),
    listRecords("OrderItems"),
    listRecords("Leads"),
  ]);

  const ordersTyped = orders as unknown as { id: string; fields: OrderFields }[];
  const itemsTyped = items as unknown as { id: string; fields: ItemFields }[];
  const leadsTyped = leads as unknown as { id: string; fields: LeadFields }[];

  const orderEmailById = new Map(ordersTyped.map((o) => [o.id, o.fields.Email ?? ""]));

  const orderCards: Card[] = itemsTyped
    .filter((it) => it.fields.Order?.some((oid) => orderEmailById.has(oid)))
    .map((it) => ({
      id: it.id,
      table: "OrderItems" as const,
      email: it.fields.Order?.[0] ? orderEmailById.get(it.fields.Order[0]) ?? "" : "",
      petName: it.fields["Pet Name"] ?? "",
      figureUrl: it.fields["Figure Image URL"] ?? "",
      angledUrl: it.fields["Angled Image URL"] ?? "",
      tripoStatus: it.fields["Tripo Status"] ?? "Not started",
      modelUrl: it.fields["Model File URL"] ?? "",
      stlUrl: it.fields["Model STL URL"] ?? "",
      views: it.fields["Views"] ?? "",
      purchased: true,
    }));

  const leadCards: Card[] = leadsTyped
    .filter((l) => l.fields["Figure Image URL"])
    .map((l) => ({
      id: l.id,
      table: "Leads" as const,
      email: l.fields.Email ?? "",
      petName: l.fields["Pet Name"] ?? "",
      figureUrl: l.fields["Figure Image URL"] ?? "",
      angledUrl: l.fields["Angled Image URL"] ?? "",
      tripoStatus: l.fields["Tripo Status"] ?? "Not started",
      modelUrl: l.fields["Model File URL"] ?? "",
      stlUrl: l.fields["Model STL URL"] ?? "",
      views: l.fields["Views"] ?? "",
      purchased: false,
    }))
    .reverse();

  return { orderCards, leadCards };
}

export default async function AdminPage() {
  const store = await cookies();
  const session = store.get("admin_session")?.value;
  const authed = !!session && session === process.env.ADMIN_PASSWORD;

  if (!authed) return <AdminLogin />;

  const { orderCards, leadCards } = await buildData();
  return <AdminDashboard orders={orderCards} leads={leadCards} />;
}
