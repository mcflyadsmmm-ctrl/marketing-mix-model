/**
 * Order intelligence — the deep order book Shopify Analytics Overview does
 * not draw: vs-prior KPI deltas, a daily Orders × AOV series, and the
 * order-frequency distribution. Order data only — zero spend / ROAS.
 */

import { formatCurrency } from "./mer-format";
import { DEPTH_GUEST_KEY } from "./shopify-depth-stats";

export type OrderIntelRow = {
  customerKey: string;
  amount: number;
  discountAmount: number | null;
  orderedAt: Date;
  shopLocalDate: Date;
};

export type OrdersIntelDay = {
  dateKey: string;
  orders: number;
  sales: number;
  aov: number;
};

export type OrdersIntelAgg = {
  orders: number;
  sales: number;
  aov: number | null;
  newOrders: number;
  returningOrders: number;
  newSalesShare: number | null;
  discountDepth: number | null;
};

export type OrdersIntelDelta = {
  pct: number;
  dir: "up" | "down" | "flat";
};

export type OrdersIntelKpi = {
  key: "orders" | "sales" | "aov" | "newShare" | "discount";
  label: string;
  value: string;
  sub?: string;
  delta?: OrdersIntelDelta;
};

export type OrdersFrequencyBucket = {
  key: "1" | "2" | "3" | "4" | "5-9" | "10+";
  label: string;
  customers: number;
};

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
] as const;

/** `Jun 11` from a YYYY-MM-DD key — never a raw ISO dump. */
export function ordersIntelDayLabel(dateKey: string): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  if (!Number.isFinite(m) || !Number.isFinite(d) || m < 1 || m > 12) {
    return dateKey;
  }
  return `${MONTHS[m - 1]} ${d}`;
}

/** `Jun 11 → Sep 8 · trailing 90 days` window caption. */
export function ordersIntelWindowLabel(days: OrdersIntelDay[]): string {
  if (days.length === 0) return "Trailing 90 days";
  const first = days[0]!.dateKey;
  const last = days[days.length - 1]!.dateKey;
  return `${ordersIntelDayLabel(first)} → ${ordersIntelDayLabel(last)} · trailing 90 days`;
}

function finite(n: number | null | undefined): number {
  return typeof n === "number" && Number.isFinite(n) ? n : 0;
}

function dayKeyOf(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function isGuest(key: string): boolean {
  return key === DEPTH_GUEST_KEY;
}

export function aggregateOrderRows(rows: OrderIntelRow[]): OrdersIntelAgg {
  const clean = rows.filter((row) => Number.isFinite(row.amount));
  const orders = clean.length;
  const sales = clean.reduce((sum, row) => sum + finite(row.amount), 0);
  const discountTotal = clean.reduce(
    (sum, row) => sum + Math.abs(finite(row.discountAmount)),
    0,
  );
  const gross = sales + discountTotal;

  const byCustomer = new Map<string, OrderIntelRow[]>();
  for (const row of clean) {
    if (isGuest(row.customerKey)) continue;
    const list = byCustomer.get(row.customerKey) ?? [];
    list.push(row);
    byCustomer.set(row.customerKey, list);
  }
  let newOrders = 0;
  let returningOrders = 0;
  let newSales = 0;
  for (const list of byCustomer.values()) {
    const sorted = [...list].sort(
      (a, b) => a.orderedAt.getTime() - b.orderedAt.getTime(),
    );
    newOrders += 1;
    newSales += finite(sorted[0]!.amount);
    returningOrders += sorted.length - 1;
  }

  return {
    orders,
    sales,
    aov: orders > 0 ? sales / orders : null,
    newOrders,
    returningOrders,
    newSalesShare: sales > 0 ? newSales / sales : null,
    discountDepth: gross > 0 ? discountTotal / gross : null,
  };
}

export function buildOrdersIntelDays(rows: OrderIntelRow[]): OrdersIntelDay[] {
  const byDay = new Map<string, { orders: number; sales: number }>();
  for (const row of rows) {
    if (!Number.isFinite(row.amount)) continue;
    const key = dayKeyOf(row.shopLocalDate);
    const bucket = byDay.get(key) ?? { orders: 0, sales: 0 };
    bucket.orders += 1;
    bucket.sales += finite(row.amount);
    byDay.set(key, bucket);
  }
  return [...byDay.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([dateKey, bucket]) => ({
      dateKey,
      orders: bucket.orders,
      sales: bucket.sales,
      aov: bucket.orders > 0 ? bucket.sales / bucket.orders : 0,
    }));
}

export function ordersIntelDelta(
  current: number | null | undefined,
  prior: number | null | undefined,
): OrdersIntelDelta | null {
  if (
    current == null ||
    prior == null ||
    !Number.isFinite(current) ||
    !Number.isFinite(prior) ||
    prior <= 0
  ) {
    return null;
  }
  const pct = ((current - prior) / prior) * 100;
  const dir = Math.abs(pct) < 0.5 ? "flat" : pct > 0 ? "up" : "down";
  return { pct, dir };
}

/** Whole percents — 25%, never 25.0%. */
function pct(share: number): string {
  return `${Math.round(share * 100)}%`;
}

export function buildOrdersIntelKpis(
  current: OrdersIntelAgg,
  prior: OrdersIntelAgg | null,
  currency: string,
): OrdersIntelKpi[] {
  const kpis: OrdersIntelKpi[] = [
    {
      key: "orders",
      label: "Orders",
      value: current.orders.toLocaleString(),
      delta: prior ? ordersIntelDelta(current.orders, prior.orders) ?? undefined : undefined,
    },
    {
      key: "sales",
      label: "Sales",
      value: formatCurrency(current.sales, currency),
      delta: prior ? ordersIntelDelta(current.sales, prior.sales) ?? undefined : undefined,
    },
    {
      key: "aov",
      label: "AOV",
      value: current.aov != null ? formatCurrency(current.aov, currency) : "—",
      delta: prior ? ordersIntelDelta(current.aov, prior.aov) ?? undefined : undefined,
    },
    {
      key: "newShare",
      label: "New sales share",
      value: current.newSalesShare != null ? pct(current.newSalesShare) : "—",
      sub: `${current.newOrders.toLocaleString()} new · ${current.returningOrders.toLocaleString()} returning orders`,
    },
    {
      key: "discount",
      label: "Discount depth",
      value: current.discountDepth != null ? pct(current.discountDepth) : "—",
      sub: "Σ |discounts| ÷ gross",
    },
  ];
  return kpis;
}

const FREQUENCY_LABELS: Record<OrdersFrequencyBucket["key"], string> = {
  "1": "1 order",
  "2": "2 orders",
  "3": "3 orders",
  "4": "4 orders",
  "5-9": "5–9 orders",
  "10+": "10+ orders",
};

function frequencyKey(count: number): OrdersFrequencyBucket["key"] {
  if (count <= 1) return "1";
  if (count === 2) return "2";
  if (count === 3) return "3";
  if (count === 4) return "4";
  if (count <= 9) return "5-9";
  return "10+";
}

export function buildOrdersFrequency(
  rows: OrderIntelRow[],
): OrdersFrequencyBucket[] {
  const counts = new Map<string, number>();
  for (const row of rows) {
    if (isGuest(row.customerKey)) continue;
    counts.set(row.customerKey, (counts.get(row.customerKey) ?? 0) + 1);
  }
  const order: OrdersFrequencyBucket["key"][] = ["1", "2", "3", "4", "5-9", "10+"];
  const tally = new Map<OrdersFrequencyBucket["key"], number>();
  for (const count of counts.values()) {
    const key = frequencyKey(count);
    tally.set(key, (tally.get(key) ?? 0) + 1);
  }
  return order
    .map((key) => ({
      key,
      label: FREQUENCY_LABELS[key],
      customers: tally.get(key) ?? 0,
    }))
    .filter((bucket) => bucket.customers > 0);
}
