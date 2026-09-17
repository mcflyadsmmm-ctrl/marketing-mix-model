/**
 * Order intelligence — the deep order book Shopify Analytics Overview does
 * not draw: vs-prior KPI deltas, a daily Orders × AOV series, and the
 * order-frequency distribution. Order data only — zero spend / ROAS.
 */

import { formatCurrency } from "./mer-format";
import { DEPTH_GUEST_KEY, percentileOf } from "./shopify-depth-stats";

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

/** One order-value tier (band) in the AOV distribution. */
export type OrdersAovTier = {
  key: string;
  lo: number | null;
  hi: number | null;
  orders: number;
  orderShare: number;
  sales: number;
  salesShare: number;
};

/** One audit-grade weekly ledger row. */
export type OrdersWeekRow = {
  weekKey: string;
  label: string;
  orders: number;
  sales: number;
  aov: number;
  discountDepth: number | null;
  ordersDelta: OrdersIntelDelta | null;
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

/** Nearest "nice" step (1 · 2 · 2.5 · 5 × 10ⁿ) at or above x. */
function niceStep(x: number): number {
  if (!(x > 0)) return 1;
  const pow = 10 ** Math.floor(Math.log10(x));
  const base = x / pow;
  const mult = base <= 1 ? 1 : base <= 2 ? 2 : base <= 2.5 ? 2.5 : base <= 5 ? 5 : 10;
  return mult * pow;
}

/**
 * AOV tiers — how orders spread across value bands. Shopify Analytics shows one
 * average; this shows the whole distribution. Bands adapt to the shop (nice-
 * rounded, centered on the p5–p95 spread) so a $40-AOV or $600-AOV shop both
 * read well. Needs ≥ 8 orders. Order value only — zero spend.
 */
export function buildOrdersAovTiers(rows: OrderIntelRow[]): OrdersAovTier[] {
  const amounts = rows
    .map((row) => finite(row.amount))
    .filter((n) => Number.isFinite(n) && n > 0);
  if (amounts.length < 8) return [];
  const lo = percentileOf(amounts, 0.05) ?? Math.min(...amounts);
  const hi = percentileOf(amounts, 0.95) ?? Math.max(...amounts);
  if (!(hi > lo)) return [];
  const step = niceStep((hi - lo) / 4);
  const start = Math.max(0, Math.floor(lo / step) * step);
  const edges = [start + step, start + 2 * step, start + 3 * step, start + 4 * step];
  const bounds: Array<{ lo: number | null; hi: number | null }> = [
    { lo: null, hi: edges[0]! },
    { lo: edges[0]!, hi: edges[1]! },
    { lo: edges[1]!, hi: edges[2]! },
    { lo: edges[2]!, hi: edges[3]! },
    { lo: edges[3]!, hi: null },
  ];
  const buckets = bounds.map((b) => ({ ...b, orders: 0, sales: 0 }));
  for (const amount of amounts) {
    let index = buckets.findIndex(
      (b) => (b.lo == null || amount >= b.lo) && (b.hi == null || amount < b.hi),
    );
    if (index < 0) index = buckets.length - 1;
    buckets[index]!.orders += 1;
    buckets[index]!.sales += amount;
  }
  const totalOrders = amounts.length;
  const totalSales = amounts.reduce((sum, n) => sum + n, 0);
  return buckets.map((b, index) => ({
    key: `t${index}`,
    lo: b.lo,
    hi: b.hi,
    orders: b.orders,
    orderShare: totalOrders > 0 ? b.orders / totalOrders : 0,
    sales: b.sales,
    salesShare: totalSales > 0 ? b.sales / totalSales : 0,
  }));
}

/** Monday-start ISO-ish week key for a shop-local day. */
function weekStartKey(date: Date): string {
  const d = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
  const dow = d.getUTCDay(); // 0 Sun..6 Sat
  const backToMonday = (dow + 6) % 7;
  d.setUTCDate(d.getUTCDate() - backToMonday);
  return d.toISOString().slice(0, 10);
}

/**
 * Weekly ledger — the audit-grade table Shopify Analytics buries. Each row is
 * a Monday-start week with orders, sales, AOV, discount depth, and the
 * orders trend vs the prior week.
 */
export function buildOrdersWeeklyRows(rows: OrderIntelRow[]): OrdersWeekRow[] {
  const byWeek = new Map<
    string,
    { orders: number; sales: number; discount: number }
  >();
  for (const row of rows) {
    if (!Number.isFinite(row.amount)) continue;
    const key = weekStartKey(row.shopLocalDate);
    const bucket = byWeek.get(key) ?? { orders: 0, sales: 0, discount: 0 };
    bucket.orders += 1;
    bucket.sales += finite(row.amount);
    bucket.discount += Math.abs(finite(row.discountAmount));
    byWeek.set(key, bucket);
  }
  const sorted = [...byWeek.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  return sorted.map(([weekKey, bucket], index) => {
    const gross = bucket.sales + bucket.discount;
    const priorOrders = index > 0 ? sorted[index - 1]![1].orders : null;
    return {
      weekKey,
      label: `Wk of ${ordersIntelDayLabel(weekKey)}`,
      orders: bucket.orders,
      sales: bucket.sales,
      aov: bucket.orders > 0 ? bucket.sales / bucket.orders : 0,
      discountDepth: gross > 0 ? bucket.discount / gross : null,
      ordersDelta: ordersIntelDelta(bucket.orders, priorOrders),
    };
  });
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
