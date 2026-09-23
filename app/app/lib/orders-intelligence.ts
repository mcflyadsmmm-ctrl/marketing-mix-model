/**
 * Order intelligence — the deep order book Shopify Analytics Overview does
 * not draw: vs-prior KPI deltas, a daily Orders × AOV series, and the
 * order-frequency distribution. Order data only — zero spend / ROAS.
 */

import { ORDER_STEP_MIN_BUYERS } from "./customers-analytics";
import { formatCurrency } from "./mer-format";
import type { PeriodPreset } from "./periods";
import { shopLocalHour } from "./shop-local-day";
import {
  DEPTH_GUEST_KEY,
  HOUR_STATS_MIN_ORDERS,
  MEDIAN_DAY_MIN_DAYS,
  percentileOf,
} from "./shopify-depth-stats";

export type OrderIntelRow = {
  customerKey: string;
  amount: number;
  discountAmount: number | null;
  orderedAt: Date;
  shopLocalDate: Date;
  /** Stored code. Missing stays null — never parsed as a percent. */
  discountCode?: string | null;
  /** Original checkout total. Missing stays null — never a fake zero. */
  grossAmount?: number | null;
  /**
   * Shopify lifetime count already stored on the order.
   * Omit when the row was not loaded with it. `null` means loaded and missing.
   */
  lifetimeOrders?: number | null;
  /** Units on the order. Omit when not crawled. `null` means loaded and missing. */
  unitCount?: number | null;
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
  /** Identified already-bought Shopify Total Sales. Guests out. */
  returningSales: number;
  /** Identified orders whose lifetime was missing. Not a zero new-buyer count. */
  unknownOrders: number;
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
  key: "1" | "2" | "3" | "4" | "5-9" | "10+" | "unknown";
  label: string;
  customers: number;
};

/** Named code and the sales dollars it took. A use count is not the income. */
export type OrdersCodeMoney = {
  code: string;
  sales: number;
  /** First stored order, lifetime not above the book. Null when that side took nothing classifiable. */
  newSales: number | null;
  /** Earlier stored order, or a lifetime above the orders on file. */
  returningSales: number | null;
  /** Identified buyer whose lifetime was stored and is missing. Never a fake zero. */
  unknownSales: number | null;
  /** Guest checkout. Stays out of new and already-bought. */
  guestSales: number | null;
};

export type OrdersReturnsClimb = "climbing" | "not-climbing" | null;

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

/** One named code's sales inside a week. Dollars, not a use count, not a percent. */
export type OrdersWeekCode = {
  code: string;
  sales: number;
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
  /** Sales on orders that carried a code. Null when no code is stored. */
  codeDollars: number | null;
  codeLines: OrdersWeekCode[];
  /**
   * Sum of gross − current net when every row in the week has a gross.
   * Null when any return dollar is missing. Zero is a known flat week, not a fake fill.
   */
  returnsDrag: number | null;
  /** Versus the prior week. Null when either week is missing return dollars. */
  returnsClimbing: OrdersReturnsClimb;
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

/** `Sep 1 → Sep 22 · Month to date` — the period the merchant picked. */
export function ordersIntelWindowLabel(
  days: OrdersIntelDay[],
  periodLabel: string,
): string {
  if (days.length === 0) return periodLabel;
  const first = days[0]!.dateKey;
  const last = days[days.length - 1]!.dateKey;
  return `${ordersIntelDayLabel(first)} → ${ordersIntelDayLabel(last)} · ${periodLabel}`;
}

/** Board badge for the selected period. Never a hardcoded 90-day chip. */
export function ordersIntelPeriodBadge(preset: PeriodPreset): string {
  switch (preset) {
    case "mtd":
      return "MTD";
    case "lm":
      return "Last mo";
    case "qtd":
      return "QTD";
    case "ytd":
      return "YTD";
    case "l12m":
      return "12 mo";
    case "y3":
      return "3 yr";
    default: {
      const _exhaustive: never = preset;
      return _exhaustive;
    }
  }
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

export function aggregateOrderRows(
  rows: OrderIntelRow[],
  orderBook?: OrderIntelRow[],
): OrdersIntelAgg {
  const clean = rows.filter((row) => Number.isFinite(row.amount));
  const orders = clean.length;
  const sales = clean.reduce((sum, row) => sum + finite(row.amount), 0);
  const discountTotal = clean.reduce(
    (sum, row) => sum + Math.abs(finite(row.discountAmount)),
    0,
  );
  const gross = sales + discountTotal;

  let newOrders = 0;
  let returningOrders = 0;
  let newSales = 0;
  let returningSales = 0;
  let unknownOrders = 0;
  if (orderBook) {
    const files = buyerFiles(orderBook);
    for (const row of clean) {
      if (isGuest(row.customerKey)) continue;
      const kind = buyerKind(row, files.get(row.customerKey));
      if (kind === "returning") {
        returningOrders += 1;
        returningSales += finite(row.amount);
      } else if (kind === "new") {
        newOrders += 1;
        newSales += finite(row.amount);
      } else if (kind === "unknown") {
        unknownOrders += 1;
      }
    }
  } else {
    const byCustomer = new Map<string, OrderIntelRow[]>();
    for (const row of clean) {
      if (isGuest(row.customerKey)) continue;
      const list = byCustomer.get(row.customerKey) ?? [];
      list.push(row);
      byCustomer.set(row.customerKey, list);
    }
    for (const list of byCustomer.values()) {
      const sorted = [...list].sort(
        (a, b) => a.orderedAt.getTime() - b.orderedAt.getTime(),
      );
      newOrders += 1;
      newSales += finite(sorted[0]!.amount);
      returningOrders += sorted.length - 1;
      for (let i = 1; i < sorted.length; i += 1) {
        returningSales += finite(sorted[i]!.amount);
      }
    }
  }

  return {
    orders,
    sales,
    aov: orders > 0 ? sales / orders : null,
    newOrders,
    returningOrders,
    returningSales,
    unknownOrders,
    newSalesShare: sales > 0 && unknownOrders === 0 ? newSales / sales : null,
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

function newShareSub(current: OrdersIntelAgg): string {
  if (
    current.unknownOrders > 0 &&
    current.newOrders === 0 &&
    current.returningOrders === 0
  ) {
    return "New versus already-bought is unknown";
  }
  const known = `${current.newOrders.toLocaleString()} new · ${current.returningOrders.toLocaleString()} returning orders`;
  if (current.unknownOrders > 0) return `${known} · lifetime unknown`;
  return known;
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
      sub: newShareSub(current),
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
  unknown: "Lifetime unknown",
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
 * Weekly ledger — Monday-start weeks for the selected period. Orders, sales,
 * the code's dollars (not a use count), and whether returns are climbing
 * versus the prior week. Gross versus current net on the placed order.
 */
export function buildOrdersWeeklyRows(rows: OrderIntelRow[]): OrdersWeekRow[] {
  const byWeek = new Map<
    string,
    { orders: number; sales: number; discount: number; lines: OrderIntelRow[] }
  >();
  for (const row of rows) {
    if (!Number.isFinite(row.amount)) continue;
    const key = weekStartKey(row.shopLocalDate);
    const bucket = byWeek.get(key) ?? {
      orders: 0,
      sales: 0,
      discount: 0,
      lines: [],
    };
    bucket.orders += 1;
    bucket.sales += finite(row.amount);
    bucket.discount += Math.abs(finite(row.discountAmount));
    bucket.lines.push(row);
    byWeek.set(key, bucket);
  }
  const sorted = [...byWeek.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  const drags = sorted.map(([, bucket]) => ordersReturnDrag(bucket.lines));
  return sorted.map(([weekKey, bucket], index) => {
    const gross = bucket.sales + bucket.discount;
    const priorOrders = index > 0 ? sorted[index - 1]![1].orders : null;
    const codeLines = weekCodeLines(bucket.lines);
    const codeDollars = codeLines.reduce((sum, line) => sum + line.sales, 0);
    return {
      weekKey,
      label: `Wk of ${ordersIntelDayLabel(weekKey)}`,
      orders: bucket.orders,
      sales: bucket.sales,
      aov: bucket.orders > 0 ? bucket.sales / bucket.orders : 0,
      discountDepth: gross > 0 ? bucket.discount / gross : null,
      ordersDelta: ordersIntelDelta(bucket.orders, priorOrders),
      codeDollars: codeDollars > 0 ? codeDollars : null,
      codeLines,
      returnsDrag: drags[index] ?? null,
      returnsClimbing: ordersReturnsClimbing(
        drags[index] ?? null,
        index > 0 ? (drags[index - 1] ?? null) : null,
      ),
    };
  });
}

/**
 * Buyers who ordered in `rows`, bucketed by stored lifetime.
 * One order in the slice is not a one-order buyer when `lifetimeOrders`
 * is higher, or when the stored book holds more orders than the slice.
 * A null lifetime stays unknown — never the one-order bar.
 * When lifetime was not on the row, the count is the orders on the book
 * (the slice, when no book is passed).
 */
export function buildOrdersFrequency(
  rows: OrderIntelRow[],
  orderBook?: OrderIntelRow[],
): OrdersFrequencyBucket[] {
  const files = buyerFiles(orderBook ?? rows);
  const seen = new Set<string>();
  const order: OrdersFrequencyBucket["key"][] = [
    "1",
    "2",
    "3",
    "4",
    "5-9",
    "10+",
    "unknown",
  ];
  const tally = new Map<OrdersFrequencyBucket["key"], number>();
  for (const row of rows) {
    if (isGuest(row.customerKey) || seen.has(row.customerKey)) continue;
    seen.add(row.customerKey);
    const file = files.get(row.customerKey);
    let key: OrdersFrequencyBucket["key"];
    if (!file || file.lifetime === null) {
      key = "unknown";
    } else if (typeof file.lifetime === "number") {
      key = frequencyKey(Math.max(file.lifetime, file.stored));
    } else {
      key = frequencyKey(file.stored);
    }
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

type BuyerFile = {
  first: number;
  stored: number;
  /** `undefined` = not on the row. `null` = stored and missing. */
  lifetime: number | null | undefined;
  times: number[];
};

type BuyerKind = "guest" | "new" | "returning" | "unknown";

function knownLifetime(value: number | null | undefined): number | null | undefined {
  if (value == null) return value;
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  return Math.max(0, Math.trunc(value));
}

function mergeLifetime(
  prev: number | null | undefined,
  next: number | null | undefined,
): number | null | undefined {
  const a = typeof prev === "number" ? prev : null;
  const b = typeof next === "number" ? next : null;
  if (a != null || b != null) return Math.max(a ?? 0, b ?? 0);
  if (prev === null || next === null) return null;
  return undefined;
}

/** Same book rule as Customers: one file per identified buyer. */
function buyerFiles(rows: OrderIntelRow[]): Map<string, BuyerFile> {
  const files = new Map<string, BuyerFile>();
  for (const row of rows) {
    if (!row.customerKey || isGuest(row.customerKey)) continue;
    if (!Number.isFinite(row.amount)) continue;
    const t = row.orderedAt.getTime();
    if (!Number.isFinite(t)) continue;
    const lifetime = knownLifetime(row.lifetimeOrders);
    const prev = files.get(row.customerKey);
    if (!prev) {
      files.set(row.customerKey, { first: t, stored: 1, lifetime, times: [t] });
      continue;
    }
    prev.stored += 1;
    prev.times.push(t);
    if (t < prev.first) prev.first = t;
    prev.lifetime = mergeLifetime(prev.lifetime, lifetime);
  }
  return files;
}

/**
 * Returning when the stored book has an earlier order, or a known lifetime
 * above the orders on file. A missing lifetime on the first stored order
 * stays unknown. Guests stay out.
 */
function buyerKind(row: OrderIntelRow, file: BuyerFile | undefined): BuyerKind {
  if (isGuest(row.customerKey)) return "guest";
  if (!file) return "unknown";
  if (row.orderedAt.getTime() > file.first) return "returning";
  if (typeof file.lifetime === "number" && file.lifetime > file.stored) {
    return "returning";
  }
  if (file.lifetime === null) return "unknown";
  return "new";
}

function namedCode(row: OrderIntelRow): string | null {
  const code = row.discountCode?.trim() ?? "";
  return code.length > 0 ? code : null;
}

function weekCodeLines(rows: OrderIntelRow[]): OrdersWeekCode[] {
  const byCode = new Map<string, number>();
  for (const row of rows) {
    if (!Number.isFinite(row.amount) || row.amount <= 0) continue;
    const code = namedCode(row);
    if (!code) continue;
    byCode.set(code, (byCode.get(code) ?? 0) + row.amount);
  }
  return [...byCode.entries()]
    .map(([code, sales]) => ({ code, sales }))
    .filter((line) => line.sales > 0)
    .sort((a, b) => b.sales - a.sales || a.code.localeCompare(b.code));
}

/**
 * Gross versus current net on the placed orders.
 * Any missing gross makes the total unknown — never a partial sum painted as $0.
 */
export function ordersReturnDrag(rows: OrderIntelRow[]): number | null {
  let seen = false;
  let drag = 0;
  for (const row of rows) {
    if (!Number.isFinite(row.amount)) continue;
    const gross = row.grossAmount;
    if (typeof gross !== "number" || !Number.isFinite(gross)) return null;
    seen = true;
    if (gross > row.amount) drag += gross - row.amount;
  }
  return seen ? drag : null;
}

/** Yes, no, or unknown. A prior of zero can still climb. */
export function ordersReturnsClimbing(
  current: number | null,
  prior: number | null,
): OrdersReturnsClimb {
  if (current == null || prior == null) return null;
  if (!Number.isFinite(current) || !Number.isFinite(prior)) return null;
  return current > prior ? "climbing" : "not-climbing";
}

/**
 * Painted dollars. Sub-dollar amounts that round to 0 stay blank — never a fake $0.
 */
export function ordersPaintDollars(
  amount: number | null | undefined,
  currency: string,
): string | null {
  if (amount == null || !Number.isFinite(amount) || amount < 0.5) return null;
  const painted = formatCurrency(amount, currency);
  if (!/[1-9]/.test(painted)) return null;
  return painted;
}

/** `WELCOME10 $500` — the code is a name. The digits are not a percent. */
export function ordersCodeTookLabel(
  code: string,
  sales: number,
  currency: string,
): string | null {
  const painted = ordersPaintDollars(sales, currency);
  if (!painted) return null;
  return `${code} ${painted}`;
}

function positiveOrNull(amount: number): number | null {
  return amount > 0 ? amount : null;
}

/**
 * Which codes took the money in this slice.
 * New versus already-bought uses the stored book: an earlier stored order is
 * returning. Guests stay out. A missing lifetime stays unknown.
 */
export function buildOrdersCodeMoney(
  rows: OrderIntelRow[],
  orderBook?: OrderIntelRow[],
): OrdersCodeMoney[] {
  const files = buyerFiles(orderBook ?? rows);
  const byCode = new Map<
    string,
    {
      sales: number;
      newSales: number;
      returningSales: number;
      unknownSales: number;
      guestSales: number;
    }
  >();
  for (const row of rows) {
    if (!Number.isFinite(row.amount) || row.amount <= 0) continue;
    const code = namedCode(row);
    if (!code) continue;
    const bucket = byCode.get(code) ?? {
      sales: 0,
      newSales: 0,
      returningSales: 0,
      unknownSales: 0,
      guestSales: 0,
    };
    bucket.sales += row.amount;
    const kind = buyerKind(row, files.get(row.customerKey));
    switch (kind) {
      case "new":
        bucket.newSales += row.amount;
        break;
      case "returning":
        bucket.returningSales += row.amount;
        break;
      case "unknown":
        bucket.unknownSales += row.amount;
        break;
      case "guest":
        bucket.guestSales += row.amount;
        break;
      default: {
        const _exhaustive: never = kind;
        void _exhaustive;
        break;
      }
    }
    byCode.set(code, bucket);
  }
  return [...byCode.entries()]
    .map(([code, bucket]) => ({
      code,
      sales: bucket.sales,
      newSales: positiveOrNull(bucket.newSales),
      returningSales: positiveOrNull(bucket.returningSales),
      unknownSales: positiveOrNull(bucket.unknownSales),
      guestSales: positiveOrNull(bucket.guestSales),
    }))
    .filter((row) => row.sales > 0)
    .sort((a, b) => b.sales - a.sales || a.code.localeCompare(b.code));
}

function codeSentence(codes: OrdersCodeMoney[], currency: string): string {
  const parts: string[] = [];
  for (const code of codes) {
    const painted = ordersPaintDollars(code.sales, currency);
    if (!painted) continue;
    const took = `${code.code} took ${painted}`;
    const bits: string[] = [];
    const fresh = ordersPaintDollars(code.newSales, currency);
    const again = ordersPaintDollars(code.returningSales, currency);
    const unknown = ordersPaintDollars(code.unknownSales, currency);
    if (fresh) bits.push(`${fresh} from new buyers`);
    if (again) bits.push(`${again} from buyers who already bought`);
    if (unknown) bits.push(`${unknown} with an unknown lifetime`);
    parts.push(bits.length > 0 ? `${took} (${bits.join(", ")})` : took);
  }
  if (parts.length === 0) return "no discount code on these orders";
  return parts.join(", ");
}

function returnsSentence(
  current: number | null,
  prior: number | null,
): string {
  const climb = ordersReturnsClimbing(current, prior);
  if (climb === "climbing") return "Returns are climbing";
  if (climb === "not-climbing") return "Returns are not climbing";
  if (current == null) return "Return dollars are not on these orders";
  return "Whether returns are climbing needs the prior period";
}

/** The sentence for the period the merchant picked. */
export function ordersMonthBoardSentence(input: {
  periodLabel: string;
  codes: OrdersCodeMoney[];
  returnsDrag: number | null;
  priorReturnsDrag: number | null;
  currency: string;
}): string {
  return `${input.periodLabel} — ${codeSentence(input.codes, input.currency)}. ${returnsSentence(input.returnsDrag, input.priorReturnsDrag)}.`;
}

export const ORDERS_STEP_IDS = ["first", "second", "third", "fourthPlus"] as const;
export type OrdersStepBucketId = (typeof ORDERS_STEP_IDS)[number];
export type OrdersStepId = OrdersStepBucketId | "unknown";

export type OrdersStepBar = {
  id: OrdersStepId;
  label: string;
  /** Shopify Total Sales in this step. Null until 8 identified buyers seal it. */
  sales: number | null;
  buyers: number;
  sealed: boolean;
};

/** Named so a ~20% tax/shipping gap is not painted as Shopify’s AOV. */
export const ORDERS_TICKET_BASIS = "Shopify Total Sales per order";

export type OrdersPeriodTickets = {
  firstTimeTicket: number | null;
  returningTicket: number | null;
  basis: typeof ORDERS_TICKET_BASIS;
};

export type OrdersConcentration = {
  identifiedBuyers: number;
  /** Smallest identified set whose period sales reach 50%. */
  buyersForHalf: number | null;
  topDecileShare: number | null;
};

export type OrdersTimingLane = {
  first: number[] | null;
  returning: number[] | null;
  firstDollars: number[] | null;
  returningDollars: number[] | null;
};

function emptyTimingLane(): OrdersTimingLane {
  return {
    first: null,
    returning: null,
    firstDollars: null,
    returningDollars: null,
  };
}

export type OrdersTimingSplit = {
  weekday: OrdersTimingLane;
  hourly: OrdersTimingLane;
};

export type OrdersYearCode = {
  code: string;
  sales: number;
};

export type OrdersYearDiscount = {
  currentDollars: number | null;
  currentDepth: number | null;
  lastYearDollars: number | null;
  lastYearDepth: number | null;
  codes: OrdersYearCode[];
};

export type OrdersKeptShare = {
  current: number | null;
  lastYear: number | null;
};

export type OrdersCheckoutDiscount = {
  firstDepth: number | null;
  returningDepth: number | null;
};

export type OrdersDollarsPerUnit = {
  dollarsPerUnit: number | null;
  basis: "total" | "net";
};

export type OrdersZeroOrders = {
  count: number;
  units: number | null;
};

function ordersStepLabel(id: OrdersStepId): string {
  switch (id) {
    case "first":
      return "1st";
    case "second":
      return "2nd";
    case "third":
      return "3rd";
    case "fourthPlus":
      return "4th+";
    case "unknown":
      return "Lifetime unknown";
    default: {
      const _never: never = id;
      return _never;
    }
  }
}

function stepBucketOf(step: number): OrdersStepBucketId {
  if (step <= 1) return "first";
  if (step === 2) return "second";
  if (step === 3) return "third";
  return "fourthPlus";
}

/** 1-based lifetime step of this order, or null when lifetime is unknown. */
function orderStepNumber(
  row: OrderIntelRow,
  file: BuyerFile | undefined,
): number | null {
  if (!file || file.lifetime === null) return null;
  const t = row.orderedAt.getTime();
  if (!Number.isFinite(t)) return null;
  const rank = file.times.filter((time) => time <= t).length;
  if (rank < 1) return null;
  if (typeof file.lifetime === "number") {
    const offset = Math.max(0, Math.max(file.lifetime, file.stored) - file.stored);
    return offset + rank;
  }
  return rank;
}

function sealStepBar(
  id: OrdersStepId,
  sales: number,
  buyers: number,
): OrdersStepBar {
  const sealed = buyers >= ORDER_STEP_MIN_BUYERS;
  return {
    id,
    label: ordersStepLabel(id),
    sales: sealed ? sales : null,
    buyers,
    sealed,
  };
}

/**
 * This period’s Shopify Total Sales by 1st / 2nd / 3rd / 4th+.
 * Guests out. Unknown lifetime is its own bar, never stuffed into 1st.
 */
export function buildOrdersStepMix(
  rows: OrderIntelRow[],
  orderBook: OrderIntelRow[],
): OrdersStepBar[] {
  const files = buyerFiles(orderBook);
  const buckets: Record<
    OrdersStepId,
    { sales: number; buyers: Set<string> }
  > = {
    first: { sales: 0, buyers: new Set() },
    second: { sales: 0, buyers: new Set() },
    third: { sales: 0, buyers: new Set() },
    fourthPlus: { sales: 0, buyers: new Set() },
    unknown: { sales: 0, buyers: new Set() },
  };
  for (const row of rows) {
    if (!Number.isFinite(row.amount) || isGuest(row.customerKey)) continue;
    const step = orderStepNumber(row, files.get(row.customerKey));
    const id: OrdersStepId = step == null ? "unknown" : stepBucketOf(step);
    buckets[id].sales += finite(row.amount);
    buckets[id].buyers.add(row.customerKey);
  }
  const bars = ORDERS_STEP_IDS.map((id) =>
    sealStepBar(id, buckets[id].sales, buckets[id].buyers.size),
  );
  if (buckets.unknown.buyers.size > 0) {
    bars.push(
      sealStepBar(
        "unknown",
        buckets.unknown.sales,
        buckets.unknown.buyers.size,
      ),
    );
  }
  return bars;
}

export function ordersPaintStepSales(
  bar: OrdersStepBar,
  currency: string,
): string {
  if (!bar.sealed || bar.sales == null || !Number.isFinite(bar.sales)) {
    return "—";
  }
  return formatCurrency(bar.sales, currency);
}

function ticketFrom(
  sales: number,
  orders: number,
  buyers: number,
): number | null {
  if (buyers < ORDER_STEP_MIN_BUYERS || orders <= 0) return null;
  return sales / orders;
}

/** First-time vs already-bought Shopify Total Sales per order this period. */
export function buildOrdersPeriodTickets(
  rows: OrderIntelRow[],
  orderBook: OrderIntelRow[],
): OrdersPeriodTickets {
  const files = buyerFiles(orderBook);
  let firstSales = 0;
  let firstOrders = 0;
  const firstBuyers = new Set<string>();
  let returningSales = 0;
  let returningOrders = 0;
  const returningBuyers = new Set<string>();
  for (const row of rows) {
    if (!Number.isFinite(row.amount) || isGuest(row.customerKey)) continue;
    const step = orderStepNumber(row, files.get(row.customerKey));
    if (step == null) continue;
    if (step <= 1) {
      firstSales += finite(row.amount);
      firstOrders += 1;
      firstBuyers.add(row.customerKey);
    } else {
      returningSales += finite(row.amount);
      returningOrders += 1;
      returningBuyers.add(row.customerKey);
    }
  }
  return {
    firstTimeTicket: ticketFrom(firstSales, firstOrders, firstBuyers.size),
    returningTicket: ticketFrom(
      returningSales,
      returningOrders,
      returningBuyers.size,
    ),
    basis: ORDERS_TICKET_BASIS,
  };
}

/** Identified buyers who made 50% of period sales, and top-decile share. */
export function buildOrdersConcentration(
  rows: OrderIntelRow[],
): OrdersConcentration {
  const byBuyer = new Map<string, number>();
  for (const row of rows) {
    if (!Number.isFinite(row.amount) || isGuest(row.customerKey)) continue;
    byBuyer.set(
      row.customerKey,
      (byBuyer.get(row.customerKey) ?? 0) + finite(row.amount),
    );
  }
  const identifiedBuyers = byBuyer.size;
  if (identifiedBuyers < ORDER_STEP_MIN_BUYERS) {
    return {
      identifiedBuyers,
      buyersForHalf: null,
      topDecileShare: null,
    };
  }
  const totals = [...byBuyer.values()].sort((a, b) => b - a);
  const identifiedSales = totals.reduce((sum, n) => sum + n, 0);
  if (!(identifiedSales > 0)) {
    return {
      identifiedBuyers,
      buyersForHalf: null,
      topDecileShare: null,
    };
  }
  const half = identifiedSales * 0.5;
  let cumulative = 0;
  let buyersForHalf = totals.length;
  for (let i = 0; i < totals.length; i += 1) {
    cumulative += totals[i]!;
    if (cumulative >= half) {
      buyersForHalf = i + 1;
      break;
    }
  }
  const nTop = Math.max(1, Math.floor(identifiedBuyers * 0.1));
  const top = totals.slice(0, nTop).reduce((sum, n) => sum + n, 0);
  return {
    identifiedBuyers,
    buyersForHalf,
    topDecileShare: top / identifiedSales,
  };
}

function dayCountWithSales(rows: OrderIntelRow[]): number {
  const byDay = new Set<string>();
  for (const row of rows) {
    if (!Number.isFinite(row.amount) || finite(row.amount) <= 0) continue;
    byDay.add(dayKeyOf(row.shopLocalDate));
  }
  return byDay.size;
}

function shareLane(totals: number[], denom: number): number[] | null {
  if (!(denom > 0)) return null;
  return totals.map((n) => n / denom);
}

/**
 * First-time vs already-bought weekday/hour shares.
 * Same 5-day and 20-order hour gates. Guests out. Unknown not painted as new.
 */
export function buildOrdersTimingSplit(
  rows: OrderIntelRow[],
  orderBook: OrderIntelRow[],
  options?: { timeZone?: string | null },
): OrdersTimingSplit {
  const empty: OrdersTimingSplit = {
    weekday: emptyTimingLane(),
    hourly: emptyTimingLane(),
  };
  const weekdayOk = dayCountWithSales(rows) >= MEDIAN_DAY_MIN_DAYS;
  const timeZone = options?.timeZone?.trim() || null;
  const hourOk =
    Boolean(timeZone) &&
    rows.filter((row) => Number.isFinite(row.amount)).length >=
      HOUR_STATS_MIN_ORDERS;
  if (!weekdayOk && !hourOk) return empty;

  const files = buyerFiles(orderBook);
  const weekdayFirst = [0, 0, 0, 0, 0, 0, 0];
  const weekdayReturning = [0, 0, 0, 0, 0, 0, 0];
  const hourFirst = Array.from({ length: 24 }, () => 0);
  const hourReturning = Array.from({ length: 24 }, () => 0);
  let firstSales = 0;
  let returningSales = 0;
  for (const row of rows) {
    if (!Number.isFinite(row.amount) || isGuest(row.customerKey)) continue;
    const step = orderStepNumber(row, files.get(row.customerKey));
    if (step == null) continue;
    const amt = finite(row.amount);
    const returning = step >= 2;
    if (returning) returningSales += amt;
    else firstSales += amt;
    const dow = row.shopLocalDate.getUTCDay();
    if (dow >= 0 && dow <= 6) {
      if (returning) weekdayReturning[dow]! += amt;
      else weekdayFirst[dow]! += amt;
    }
    if (timeZone) {
      const hour = shopLocalHour(row.orderedAt, timeZone);
      if (returning) hourReturning[hour]! += amt;
      else hourFirst[hour]! += amt;
    }
  }
  return {
    weekday: weekdayOk
      ? {
          first: shareLane(weekdayFirst, firstSales),
          returning: shareLane(weekdayReturning, returningSales),
          firstDollars: weekdayFirst,
          returningDollars: weekdayReturning,
        }
      : emptyTimingLane(),
    hourly: hourOk
      ? {
          first: shareLane(hourFirst, firstSales),
          returning: shareLane(hourReturning, returningSales),
          firstDollars: hourFirst,
          returningDollars: hourReturning,
        }
      : emptyTimingLane(),
  };
}

function discountSlice(rows: OrderIntelRow[]): {
  dollars: number | null;
  depth: number | null;
} {
  const clean = rows.filter((row) => Number.isFinite(row.amount));
  if (clean.length === 0) return { dollars: null, depth: null };
  let discount = 0;
  let sales = 0;
  for (const row of clean) {
    if (row.discountAmount == null || !Number.isFinite(row.discountAmount)) {
      return { dollars: null, depth: null };
    }
    discount += Math.abs(row.discountAmount);
    sales += finite(row.amount);
  }
  const gross = sales + discount;
  return {
    dollars: discount,
    depth: gross > 0 ? discount / gross : null,
  };
}

/** Same-month-last-year discount dollars. Codes stay names. Missing last year —. */
export function buildOrdersYearDiscount(
  rows: OrderIntelRow[],
  lastYearRows: OrderIntelRow[],
): OrdersYearDiscount {
  const current = discountSlice(rows);
  const lastYear = discountSlice(lastYearRows);
  return {
    currentDollars: current.dollars,
    currentDepth: current.depth,
    lastYearDollars: lastYear.dollars,
    lastYearDepth: lastYear.depth,
    codes: weekCodeLines(rows),
  };
}

function placedKeptShare(rows: OrderIntelRow[]): number | null {
  let seen = false;
  let net = 0;
  let gross = 0;
  for (const row of rows) {
    if (!Number.isFinite(row.amount)) continue;
    if (typeof row.grossAmount !== "number" || !Number.isFinite(row.grossAmount)) {
      return null;
    }
    seen = true;
    net += row.amount;
    gross += row.grossAmount;
  }
  if (!seen || !(gross > 0)) return null;
  return net / gross;
}

/** Placed-day kept share (net vs gross). Any missing gross → —. */
export function buildOrdersKeptShare(
  rows: OrderIntelRow[],
  lastYearRows: OrderIntelRow[],
): OrdersKeptShare {
  return {
    current: placedKeptShare(rows),
    lastYear: lastYearRows.length > 0 ? placedKeptShare(lastYearRows) : null,
  };
}

function groupDiscountDepth(rows: OrderIntelRow[]): number | null {
  return discountSlice(rows).depth;
}

/** First vs returning checkouts: share of gross taken off. Missing discount → —. */
export function buildOrdersCheckoutDiscount(
  rows: OrderIntelRow[],
  orderBook: OrderIntelRow[],
): OrdersCheckoutDiscount {
  const files = buyerFiles(orderBook);
  const first: OrderIntelRow[] = [];
  const returning: OrderIntelRow[] = [];
  for (const row of rows) {
    if (!Number.isFinite(row.amount) || isGuest(row.customerKey)) continue;
    const step = orderStepNumber(row, files.get(row.customerKey));
    if (step == null) continue;
    if (step <= 1) first.push(row);
    else returning.push(row);
  }
  return {
    firstDepth: groupDiscountDepth(first),
    returningDepth: groupDiscountDepth(returning),
  };
}

function crawledUnitCount(row: OrderIntelRow): number | null {
  if (row.unitCount == null || !Number.isFinite(row.unitCount) || row.unitCount < 0) {
    return null;
  }
  return Math.trunc(row.unitCount);
}

/**
 * Period dollars per unit = Shopify Total Sales ÷ units, or Net ÷ units
 * when netSales is on the day. Dash when unitCount is not crawled.
 */
export function buildOrdersDollarsPerUnit(
  rows: OrderIntelRow[],
  options?: { netSales?: number | null; netSalesKnown?: boolean },
): OrdersDollarsPerUnit {
  const clean = rows.filter((row) => Number.isFinite(row.amount));
  let units = 0;
  let sales = 0;
  for (const row of clean) {
    const count = crawledUnitCount(row);
    if (count == null) {
      return { dollarsPerUnit: null, basis: "total" };
    }
    units += count;
    sales += finite(row.amount);
  }
  if (!(units > 0) || clean.length === 0) {
    return { dollarsPerUnit: null, basis: "total" };
  }
  const useNet =
    options?.netSalesKnown === true &&
    options.netSales != null &&
    Number.isFinite(options.netSales);
  const dollars = useNet ? options.netSales! : sales;
  return {
    dollarsPerUnit: dollars / units,
    basis: useNet ? "net" : "total",
  };
}

/** $0-amount orders and the units on those rows. Not tagged internal. */
export function buildOrdersZeroAmountOrders(
  rows: OrderIntelRow[],
): OrdersZeroOrders {
  const zeros = rows.filter(
    (row) => Number.isFinite(row.amount) && row.amount === 0,
  );
  let units = 0;
  for (const row of zeros) {
    const count = crawledUnitCount(row);
    if (count == null) return { count: zeros.length, units: null };
    units += count;
  }
  return { count: zeros.length, units: zeros.length > 0 ? units : 0 };
}

/** Same calendar window one year earlier. Empty means last year is not on file. */
export function ordersLastYearRows(
  book: OrderIntelRow[],
  start: Date,
  end: Date,
): OrderIntelRow[] {
  const startMs = new Date(start.getTime());
  startMs.setUTCFullYear(startMs.getUTCFullYear() - 1);
  const endMs = new Date(end.getTime());
  endMs.setUTCFullYear(endMs.getUTCFullYear() - 1);
  const from = startMs.getTime();
  const to = endMs.getTime();
  return book.filter((row) => {
    const t = row.orderedAt.getTime();
    return t >= from && t <= to;
  });
}

export type OrdersIntelData = {
  windowLabel: string;
  badge: string;
  periodLabel: string;
  days: OrdersIntelDay[];
  weeks: OrdersWeekRow[];
  tiers: OrdersAovTier[];
  current: OrdersIntelAgg;
  prior: OrdersIntelAgg | null;
  codes: OrdersCodeMoney[];
  returnsDrag: number | null;
  priorReturnsDrag: number | null;
  stepMix: OrdersStepBar[];
  tickets: OrdersPeriodTickets;
  concentration: OrdersConcentration;
  timingSplit: OrdersTimingSplit;
  yearDiscount: OrdersYearDiscount;
  keptShare: OrdersKeptShare;
  checkoutDiscount: OrdersCheckoutDiscount;
  dollarsPerUnit: OrdersDollarsPerUnit;
  zeroOrders: OrdersZeroOrders;
};

/**
 * One board for the selected period. The book classifies new versus
 * already-bought. An empty slice stays null — the page does not invent a window.
 */
export function assembleOrdersIntelligence(input: {
  rows: OrderIntelRow[];
  priorRows: OrderIntelRow[];
  lastYearRows?: OrderIntelRow[];
  orderBook: OrderIntelRow[];
  periodLabel: string;
  badge: string;
  netSales?: number | null;
  netSalesKnown?: boolean;
  timeZone?: string | null;
}): (OrdersIntelData & { frequency: OrdersFrequencyBucket[] }) | null {
  if (input.rows.length === 0) return null;
  const days = buildOrdersIntelDays(input.rows);
  const lastYearRows = input.lastYearRows ?? [];
  return {
    windowLabel: ordersIntelWindowLabel(days, input.periodLabel),
    badge: input.badge,
    periodLabel: input.periodLabel,
    days,
    weeks: buildOrdersWeeklyRows(input.rows),
    tiers: buildOrdersAovTiers(input.rows),
    current: aggregateOrderRows(input.rows, input.orderBook),
    prior:
      input.priorRows.length > 0
        ? aggregateOrderRows(input.priorRows, input.orderBook)
        : null,
    codes: buildOrdersCodeMoney(input.rows, input.orderBook),
    returnsDrag: ordersReturnDrag(input.rows),
    priorReturnsDrag:
      input.priorRows.length > 0 ? ordersReturnDrag(input.priorRows) : null,
    frequency: buildOrdersFrequency(input.rows, input.orderBook),
    stepMix: buildOrdersStepMix(input.rows, input.orderBook),
    tickets: buildOrdersPeriodTickets(input.rows, input.orderBook),
    concentration: buildOrdersConcentration(input.rows),
    timingSplit: buildOrdersTimingSplit(input.rows, input.orderBook, {
      timeZone: input.timeZone,
    }),
    yearDiscount: buildOrdersYearDiscount(input.rows, lastYearRows),
    keptShare: buildOrdersKeptShare(input.rows, lastYearRows),
    checkoutDiscount: buildOrdersCheckoutDiscount(input.rows, input.orderBook),
    dollarsPerUnit: buildOrdersDollarsPerUnit(input.rows, {
      netSales: input.netSales,
      netSalesKnown: input.netSalesKnown,
    }),
    zeroOrders: buildOrdersZeroAmountOrders(input.rows),
  };
}
