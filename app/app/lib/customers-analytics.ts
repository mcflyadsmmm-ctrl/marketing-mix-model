/**
 * Customers tab deep analytics — order-history only (read_orders / read_customers,
 * Level-1 opaque customer keys). No product titles, no email, no spend.
 *
 * Everything here is computed over the rolling order-facts window we actually
 * have (~90 days on SAMPLE, ~60 on a fresh live install), so numbers beyond that
 * window are honestly withheld — never faked to $0 or a year we cannot see.
 *
 * Pure + currency-free so it unit-tests cleanly; the React cards format money.
 */

import { medianOf, percentileOf } from "./shopify-depth-stats";

export const RETENTION_GUEST_KEY = "guest";
/** Same buyer floor as TT2 / RFM — a step stays — until 8 buyers have taken it. */
export const ORDER_STEP_MIN_BUYERS = 8;
const DAY_MS = 86_400_000;

export type RetentionOrderRow = {
  customerKey: string;
  orderedAt: Date;
  amount: number;
  /**
   * Shopify `numberOfOrders` already stored on the order. Omit when the row
   * was not loaded with that field. `null` means it was loaded and is missing —
   * the first-time count stays unknown, never a fake zero.
   */
  lifetimeOrders?: number | null;
};

export type FrequencyBucket = { label: string; min: number; max: number | null; customers: number };
export type SpendBand = {
  label: string;
  min: number;
  max: number | null;
  customers: number;
  revenue: number;
};
export type DaysBucket = { label: string; min: number; max: number | null; customers: number };
export type RecencyBucket = { label: string; min: number; max: number | null; buyers: number };
export type MixWeek = {
  key: string;
  label: string;
  weekStart: number;
  newDollars: number;
  returningDollars: number;
  total: number;
  returningShare: number | null;
  /** Identified first-time buyers that week. Null when a lifetime count is missing. */
  firstTimeBuyers: number | null;
};

/** Grain the marquee explorer can roll the weekly mix up to. */
export type MixGrain = "week" | "month";

/** Front-door explorer grain — day is its own series, not a week rollup. */
export type MixExplorerGrain = "day" | MixGrain;

/** One UTC day of new vs returning order dollars. */
export type MixDay = {
  key: string;
  label: string;
  dayStart: number;
  newDollars: number;
  returningDollars: number;
  total: number;
  returningShare: number | null;
  /** Identified first-time buyers that day. Null when a lifetime count is missing. */
  firstTimeBuyers: number | null;
};

export type MixDeltaTone = "up" | "down" | "flat";

export type ReturningMixDelta = {
  tone: MixDeltaTone;
  /** Signed whole units — dollars, or share points. */
  amount: number;
  unit: "dollars" | "points";
  versus: string;
};

export type ReturningMixPlayId = "latest" | "share" | "winback";

/** Three habit cards under the mix explorer. Order history only. */
export type ReturningMixPlay = {
  id: ReturningMixPlayId;
  verb: string;
  label: string;
  /** Null is an em dash — never a fake $0. */
  amount: number | null;
  amountKind: "money" | "share" | "count";
  sub: string;
  tone: "good" | "warn" | "plain";
  delta: ReturningMixDelta | null;
  detail: string;
};

/** One plotted column of the new-vs-returning marquee, at either grain. */
export type MixBucket = {
  key: string;
  label: string;
  start: number;
  newDollars: number;
  returningDollars: number;
  total: number;
  returningShare: number | null;
  /** Identified first-time buyers in the column. Null when a lifetime count is missing. */
  firstTimeBuyers: number | null;
};

/** Window roll-up powering the marquee's KPI strip and its average-share rail. */
export type MixSummary = {
  returningDollars: number;
  newDollars: number;
  total: number;
  returningShareAvg: number | null;
  bestReturning: MixBucket | null;
  /** Sum of known weekly counts. Null when any column's count is unknown — never a fake 0. */
  firstTimeBuyers: number | null;
};

export const ORDER_STEP_IDS = ["first", "second", "third", "fourthPlus"] as const;
export type OrderStepId = (typeof ORDER_STEP_IDS)[number];

export type OrderStepRow = {
  id: OrderStepId;
  label: string;
  /** Identified buyers who placed a stored order at this step. */
  buyers: number;
  /** Average Shopify Total Sales dollars (`amount`) at this step. Null until sealed. */
  ticket: number | null;
  /** Share of the previous step who reached this one. Null on 1st and until sealed. */
  reach: number | null;
  /** Median days since the previous stored order. Null on 1st and until sealed. */
  waitDays: number | null;
  /** True only when at least `ORDER_STEP_MIN_BUYERS` identified buyers took this step. */
  sealed: boolean;
};

export type CustomerAnalytics = {
  available: boolean;
  /** Distinct identified (non-guest) buyers in the window. */
  identifiedBuyers: number;
  guestOrders: number;
  windowOrders: number;
  /** Days of order history actually observed (min..max orderedAt), capped to the load window. */
  historyDays: number;
  /** Customers by number of orders in the window. */
  orderFrequency: FrequencyBucket[];
  /** Customers + revenue by per-customer spend band in the window. */
  spendBands: SpendBand[];
  /** Days between first and second order, bucketed. Buckets beyond the window are withheld. */
  daysToSecond: DaysBucket[];
  /** Buckets past this many days need more order history than we have. */
  daysToSecondTruncatedAt: number | null;
  repeaters: number;
  repurchaseFastDays: number | null;
  repurchaseTypicalDays: number | null;
  repurchaseSlowDays: number | null;
  winBackDay: number | null;
  /** Retention cadence KPI strip. */
  everRepeatShare: number | null;
  everRepeatCount: number;
  within30Share: number | null;
  within30Count: number;
  eligible30: number;
  within60Share: number | null;
  within60Count: number;
  eligible60: number;
  /** One-order buyers already past the win-back day — reach these now. */
  saveNowOneOrder: number;
  /** Fall-off funnel counts. */
  repeatBuyers: number;
  thirdPlusBuyers: number;
  repeatShare: number | null;
  thirdPlusShare: number | null;
  /** Best customers (5+ orders) by days since their last order. */
  whaleCount: number;
  whaleRecency: RecencyBucket[];
  whaleRecencyTruncatedAt: number | null;
  /** New vs returning dollars by UTC day — the daily explorer grain. */
  mixDaily: MixDay[];
  /** New vs returning dollars by ISO week (Mon start) — a trend, not a snapshot. */
  mixWeekly: MixWeek[];
  /** Dollar-weighted returning-share across the window — the trend's rail. */
  mixReturningShareAvg: number | null;
  /**
   * Ticket, reach, and wait at 1st / 2nd / 3rd / 4th+ from the stored order
   * book. Unsealed steps stay null — never a fake $0, 0%, or 0d.
   */
  orderSteps: OrderStepRow[];
};

function finite(n: number): number {
  return Number.isFinite(n) ? n : 0;
}

function ms(d: Date): number {
  return d instanceof Date ? d.getTime() : new Date(d).getTime();
}

const ORDER_STEP_LABELS: Record<OrderStepId, string> = {
  first: "1st",
  second: "2nd",
  third: "3rd",
  fourthPlus: "4th and later",
};

function orderStepLabel(id: OrderStepId): string {
  switch (id) {
    case "first":
    case "second":
    case "third":
    case "fourthPlus":
      return ORDER_STEP_LABELS[id];
    default: {
      const _never: never = id;
      return _never;
    }
  }
}

function unsealedOrderStep(id: OrderStepId, buyers: number): OrderStepRow {
  return {
    id,
    label: orderStepLabel(id),
    buyers,
    ticket: null,
    reach: null,
    waitDays: null,
    sealed: false,
  };
}

function meanOf(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((s, n) => s + n, 0) / values.length;
}

function sealOrderStep(input: {
  id: OrderStepId;
  buyers: number;
  amounts: number[];
  prevBuyers: number | null;
  waits: number[] | null;
}): OrderStepRow {
  const { id, buyers, amounts, prevBuyers, waits } = input;
  if (buyers < ORDER_STEP_MIN_BUYERS) return unsealedOrderStep(id, buyers);
  const ticket = meanOf(amounts);
  const reach =
    id === "first" || prevBuyers == null || prevBuyers <= 0
      ? null
      : buyers / prevBuyers;
  const waitDays =
    id === "first" || waits == null || waits.length === 0
      ? null
      : medianOf(waits);
  return {
    id,
    label: orderStepLabel(id),
    buyers,
    ticket,
    reach,
    waitDays,
    sealed: true,
  };
}

/**
 * Ticket, reach, and wait at each repurchase step from stored orders.
 * Guests out. Lifetime counts do not invent a step the book has not lived.
 * 4th and later wait is 3rd→4th only.
 */
export function buildOrderSteps(rows: RetentionOrderRow[]): OrderStepRow[] {
  const byCustomer = new Map<string, Array<{ t: number; amount: number }>>();
  for (const row of rows) {
    if (!row || !row.customerKey || row.customerKey === RETENTION_GUEST_KEY) {
      continue;
    }
    if (!Number.isFinite(row.amount)) continue;
    const t = ms(row.orderedAt);
    if (!Number.isFinite(t)) continue;
    const list = byCustomer.get(row.customerKey) ?? [];
    list.push({ t, amount: row.amount });
    byCustomer.set(row.customerKey, list);
  }

  const firstAmounts: number[] = [];
  const secondAmounts: number[] = [];
  const thirdAmounts: number[] = [];
  const fourthPlusAmounts: number[] = [];
  const waitSecond: number[] = [];
  const waitThird: number[] = [];
  const waitFourth: number[] = [];
  let firstBuyers = 0;
  let secondBuyers = 0;
  let thirdBuyers = 0;
  let fourthBuyers = 0;

  for (const list of byCustomer.values()) {
    const sorted = [...list].sort((a, b) => a.t - b.t);
    const n = sorted.length;
    if (n >= 1) {
      firstBuyers += 1;
      firstAmounts.push(sorted[0]!.amount);
    }
    if (n >= 2) {
      secondBuyers += 1;
      secondAmounts.push(sorted[1]!.amount);
      const gap = (sorted[1]!.t - sorted[0]!.t) / DAY_MS;
      if (gap >= 0 && Number.isFinite(gap)) waitSecond.push(gap);
    }
    if (n >= 3) {
      thirdBuyers += 1;
      thirdAmounts.push(sorted[2]!.amount);
      const gap = (sorted[2]!.t - sorted[1]!.t) / DAY_MS;
      if (gap >= 0 && Number.isFinite(gap)) waitThird.push(gap);
    }
    if (n >= 4) {
      fourthBuyers += 1;
      for (let i = 3; i < n; i += 1) {
        fourthPlusAmounts.push(sorted[i]!.amount);
      }
      const gap = (sorted[3]!.t - sorted[2]!.t) / DAY_MS;
      if (gap >= 0 && Number.isFinite(gap)) waitFourth.push(gap);
    }
  }

  return [
    sealOrderStep({
      id: "first",
      buyers: firstBuyers,
      amounts: firstAmounts,
      prevBuyers: null,
      waits: null,
    }),
    sealOrderStep({
      id: "second",
      buyers: secondBuyers,
      amounts: secondAmounts,
      prevBuyers: firstBuyers,
      waits: waitSecond,
    }),
    sealOrderStep({
      id: "third",
      buyers: thirdBuyers,
      amounts: thirdAmounts,
      prevBuyers: secondBuyers,
      waits: waitThird,
    }),
    sealOrderStep({
      id: "fourthPlus",
      buyers: fourthBuyers,
      amounts: fourthPlusAmounts,
      prevBuyers: thirdBuyers,
      waits: waitFourth,
    }),
  ];
}

export function orderStepTicketLabel(
  row: OrderStepRow,
  money: (amount: number) => string,
): string {
  if (!row.sealed || row.ticket == null || !Number.isFinite(row.ticket)) {
    return "—";
  }
  return money(row.ticket);
}

export function orderStepReachLabel(row: OrderStepRow): string {
  if (!row.sealed) return "—";
  switch (row.id) {
    case "first":
      return row.buyers === 1 ? "1 buyer" : `${row.buyers.toLocaleString()} buyers`;
    case "second":
    case "third":
    case "fourthPlus": {
      if (row.reach == null || !Number.isFinite(row.reach)) return "—";
      const whole = Math.round(row.reach * 100);
      if (whole === 0 && row.reach !== 0) return "—";
      return `${whole}%`;
    }
    default: {
      const _never: never = row.id;
      return _never;
    }
  }
}

export function orderStepWaitLabel(row: OrderStepRow): string {
  switch (row.id) {
    case "first":
      return "—";
    case "second":
    case "third":
    case "fourthPlus": {
      if (!row.sealed || row.waitDays == null || !Number.isFinite(row.waitDays)) {
        return "—";
      }
      return `${Math.round(row.waitDays)}d`;
    }
    default: {
      const _never: never = row.id;
      return _never;
    }
  }
}

export function orderStepFormula(id: OrderStepId): string {
  switch (id) {
    case "first":
      return "A first order has no wait — not 0d. Ticket is average Shopify sales on first stored orders.";
    case "second":
      return "Typical days from the 1st order to the 2nd. Reach is the share of 1st-step buyers who placed a 2nd.";
    case "third":
      return "Typical days from the 2nd order to the 3rd. Reach is the share of 2nd-step buyers who placed a 3rd.";
    case "fourthPlus":
      return "Wait is days from the 3rd order to the 4th. Later waits stay off this row. Ticket averages stored orders at position 4 and after. Reach is the share of 3rd-step buyers who placed a 4th.";
    default: {
      const _never: never = id;
      return _never;
    }
  }
}

/** UTC midnight of the calendar day containing `d`. */
function utcDayStart(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

/** Monday (UTC) of the week containing `d` — ISO week start for the mix trend. */
function mondayUtc(d: Date): Date {
  const x = utcDayStart(d);
  const mondayIndex = (x.getUTCDay() + 6) % 7;
  x.setUTCDate(x.getUTCDate() - mondayIndex);
  return x;
}

const SPEND_BANDS: Array<{ label: string; min: number; max: number | null }> = [
  { label: "$0–250", min: 0, max: 250 },
  { label: "$250–500", min: 250, max: 500 },
  { label: "$500–1k", min: 500, max: 1000 },
  { label: "$1k–2k", min: 1000, max: 2000 },
  { label: "$2k–5k", min: 2000, max: 5000 },
  { label: "$5k+", min: 5000, max: null },
];

const DAYS_BUCKETS: Array<{ label: string; min: number; max: number | null }> = [
  { label: "0–7d", min: 0, max: 7 },
  { label: "8–30d", min: 8, max: 30 },
  { label: "31–60d", min: 31, max: 60 },
  { label: "61–90d", min: 61, max: 90 },
  { label: "91–180d", min: 91, max: 180 },
  { label: "181–365d", min: 181, max: 365 },
  { label: "365d+", min: 366, max: null },
];

function bandFor(total: number): number {
  for (let i = 0; i < SPEND_BANDS.length; i += 1) {
    const b = SPEND_BANDS[i]!;
    if (b.max == null || total < b.max) return i;
  }
  return SPEND_BANDS.length - 1;
}

function frequencyLabel(count: number): number {
  if (count <= 1) return 0;
  if (count === 2) return 1;
  if (count === 3) return 2;
  if (count === 4) return 3;
  if (count <= 9) return 4;
  return 5;
}

const FREQUENCY_LABELS: Array<{ label: string; min: number; max: number | null }> = [
  { label: "1 order", min: 1, max: 1 },
  { label: "2 orders", min: 2, max: 2 },
  { label: "3 orders", min: 3, max: 3 },
  { label: "4 orders", min: 4, max: 4 },
  { label: "5–9 orders", min: 5, max: 9 },
  { label: "10+ orders", min: 10, max: null },
];

/** A "whale" is a best customer with this many orders on file. */
export const WHALE_MIN_ORDERS = 5;

type BuyerFile = {
  first: number;
  stored: number;
  /** `undefined` = not on the row. `null` = stored and missing. */
  lifetime: number | null | undefined;
};

type MixAcc = {
  start: number;
  newD: number;
  retD: number;
  newBuyers: number;
  unknownNew: boolean;
};

function knownLifetime(value: number | null | undefined): number | null | undefined {
  if (typeof value !== "number" || !Number.isFinite(value)) return value;
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

/**
 * One file per identified buyer. Same rule as `countNewBuyersInRange`: a known
 * lifetime above the stored order count means they bought before this book.
 * A null lifetime is kept null so the weekly count can stay unknown.
 */
function buyerFiles(rows: RetentionOrderRow[]): Map<string, BuyerFile> {
  const files = new Map<string, BuyerFile>();
  for (const row of rows) {
    if (!row.customerKey || row.customerKey === RETENTION_GUEST_KEY) continue;
    if (!Number.isFinite(row.amount)) continue;
    const t = ms(row.orderedAt);
    if (!Number.isFinite(t)) continue;
    const lifetime = knownLifetime(row.lifetimeOrders);
    const prev = files.get(row.customerKey);
    if (!prev) {
      files.set(row.customerKey, { first: t, stored: 1, lifetime });
      continue;
    }
    prev.stored += 1;
    if (t < prev.first) prev.first = t;
    prev.lifetime = mergeLifetime(prev.lifetime, lifetime);
  }
  return files;
}

function orderIsReturning(row: RetentionOrderRow, file: BuyerFile | undefined): boolean {
  if (!row.customerKey || row.customerKey === RETENTION_GUEST_KEY) return false;
  if (!file) return false;
  if (ms(row.orderedAt) > file.first) return true;
  return typeof file.lifetime === "number" && file.lifetime > file.stored;
}

function freshMixAcc(start: number): MixAcc {
  return { start, newD: 0, retD: 0, newBuyers: 0, unknownNew: false };
}

function firstTimeCount(acc: MixAcc): number | null {
  return acc.unknownNew ? null : acc.newBuyers;
}

const RECENCY_BUCKETS: Array<{ label: string; min: number; max: number | null }> = [
  { label: "0–30d", min: 0, max: 30 },
  { label: "31–60d", min: 31, max: 60 },
  { label: "61–90d", min: 61, max: 90 },
  { label: "91–180d", min: 91, max: 180 },
  { label: "181–365d", min: 181, max: 365 },
  { label: "1–2y", min: 366, max: 730 },
  { label: "2y+", min: 731, max: null },
];

export function buildCustomerAnalytics(
  rows: RetentionOrderRow[],
  options: {
    windowEnd: Date;
    historyWindowDays: number;
    /**
     * Full stored order book. The mix window stays `rows` (the 90-day slice).
     * Classification uses this book so a prior order outside that slice is
     * returning dollars, not new dollars.
     */
    orderBook?: RetentionOrderRow[];
  },
): CustomerAnalytics {
  const clean = rows.filter((r) => r && Number.isFinite(r.amount));
  const windowOrders = clean.length;
  const identified = clean.filter((r) => r.customerKey && r.customerKey !== RETENTION_GUEST_KEY);
  const guestOrders = windowOrders - identified.length;
  const windowEndMs = ms(options.windowEnd);

  let earliest = Number.POSITIVE_INFINITY;
  const byCustomer = new Map<string, { times: number[]; total: number }>();
  for (const r of identified) {
    const t = ms(r.orderedAt);
    if (t < earliest) earliest = t;
    const rec = byCustomer.get(r.customerKey) ?? { times: [], total: 0 };
    rec.times.push(t);
    rec.total += finite(r.amount);
    byCustomer.set(r.customerKey, rec);
  }
  for (const r of clean) {
    const t = ms(r.orderedAt);
    if (t < earliest) earliest = t;
  }

  const identifiedBuyers = byCustomer.size;
  const observedDays =
    windowOrders > 0 && Number.isFinite(earliest)
      ? Math.max(1, Math.ceil((windowEndMs - earliest) / DAY_MS))
      : 0;
  const historyDays = Math.max(
    0,
    Math.min(options.historyWindowDays, observedDays || options.historyWindowDays),
  );

  const freqCounts = new Array(FREQUENCY_LABELS.length).fill(0);
  const bandCustomers = new Array(SPEND_BANDS.length).fill(0);
  const bandRevenue = new Array(SPEND_BANDS.length).fill(0);
  const gaps: number[] = [];
  const daysCounts = new Array(DAYS_BUCKETS.length).fill(0);
  let repeatBuyers = 0;
  let thirdPlusBuyers = 0;
  let eligible30 = 0;
  let within30 = 0;
  let eligible60 = 0;
  let within60 = 0;
  let whaleCount = 0;
  const recencyCounts = new Array(RECENCY_BUCKETS.length).fill(0);

  for (const rec of byCustomer.values()) {
    const orders = rec.times.length;
    freqCounts[frequencyLabel(orders)] += 1;
    const band = bandFor(rec.total);
    bandCustomers[band] += 1;
    bandRevenue[band] += rec.total;

    if (orders >= WHALE_MIN_ORDERS) {
      whaleCount += 1;
      const last = Math.max(...rec.times);
      const daysSince = Math.max(0, (windowEndMs - last) / DAY_MS);
      for (let i = 0; i < RECENCY_BUCKETS.length; i += 1) {
        const b = RECENCY_BUCKETS[i]!;
        if (daysSince >= b.min && (b.max == null || daysSince <= b.max)) {
          recencyCounts[i] += 1;
          break;
        }
      }
    }

    if (orders >= 2) {
      repeatBuyers += 1;
      if (orders >= 3) thirdPlusBuyers += 1;
      const sorted = [...rec.times].sort((a, b) => a - b);
      const gapDays = (sorted[1]! - sorted[0]!) / DAY_MS;
      if (gapDays >= 0 && Number.isFinite(gapDays)) {
        gaps.push(gapDays);
        for (let i = 0; i < DAYS_BUCKETS.length; i += 1) {
          const b = DAYS_BUCKETS[i]!;
          if (gapDays >= b.min && (b.max == null || gapDays <= b.max)) {
            daysCounts[i] += 1;
            break;
          }
        }
      }
    }

    const first = Math.min(...rec.times);
    const secondGap =
      orders >= 2 ? ([...rec.times].sort((a, b) => a - b)[1]! - first) / DAY_MS : null;
    if (windowEndMs - first >= 30 * DAY_MS) {
      eligible30 += 1;
      if (secondGap != null && secondGap <= 30) within30 += 1;
    }
    if (windowEndMs - first >= 60 * DAY_MS) {
      eligible60 += 1;
      if (secondGap != null && secondGap <= 60) within60 += 1;
    }
  }

  const orderFrequency: FrequencyBucket[] = FREQUENCY_LABELS.map((b, i) => ({
    label: b.label,
    min: b.min,
    max: b.max,
    customers: freqCounts[i],
  }));
  const spendBands: SpendBand[] = SPEND_BANDS.map((b, i) => ({
    label: b.label,
    min: b.min,
    max: b.max,
    customers: bandCustomers[i],
    revenue: Math.round(bandRevenue[i]),
  }));

  const collectable = DAYS_BUCKETS.filter((b) => b.min <= historyDays);
  const daysToSecond: DaysBucket[] = collectable.map((b, i) => ({
    label: b.label,
    min: b.min,
    max: b.max,
    customers: daysCounts[i],
  }));
  const daysToSecondTruncatedAt =
    collectable.length < DAYS_BUCKETS.length ? historyDays : null;

  // New vs returning dollars: an order is returning when the stored book has an
  // earlier order, or a known lifetime count above the orders on file. Guests
  // stay first-time dollars. Weekly first-time counts use that same book plus
  // lifetimeOrders — not SalesDayFact newCustomers (that column is 0).
  const files = buyerFiles(options.orderBook ?? rows);
  const windowEarliest = new Map<string, number>();
  for (const r of identified) {
    const t = ms(r.orderedAt);
    const prev = windowEarliest.get(r.customerKey);
    if (prev == null || t < prev) windowEarliest.set(r.customerKey, t);
  }
  const dayMap = new Map<string, MixAcc>();
  const weekMap = new Map<string, MixAcc>();
  for (const r of clean) {
    const day = utcDayStart(r.orderedAt);
    const monday = mondayUtc(r.orderedAt);
    const dayKey = day.toISOString().slice(0, 10);
    const weekKey = monday.toISOString().slice(0, 10);
    const dayRec = dayMap.get(dayKey) ?? freshMixAcc(day.getTime());
    const weekRec = weekMap.get(weekKey) ?? freshMixAcc(monday.getTime());
    const isReturning = orderIsReturning(r, files.get(r.customerKey));
    if (isReturning) {
      dayRec.retD += finite(r.amount);
      weekRec.retD += finite(r.amount);
    } else {
      dayRec.newD += finite(r.amount);
      weekRec.newD += finite(r.amount);
    }
    dayMap.set(dayKey, dayRec);
    weekMap.set(weekKey, weekRec);
  }
  for (const [key, file] of files) {
    const earliestInWindow = windowEarliest.get(key);
    if (earliestInWindow == null || earliestInWindow !== file.first) continue;
    if (typeof file.lifetime === "number" && file.lifetime > file.stored) continue;
    const firstAt = new Date(file.first);
    const dayKey = utcDayStart(firstAt).toISOString().slice(0, 10);
    const weekKey = mondayUtc(firstAt).toISOString().slice(0, 10);
    const unknown = file.lifetime === null;
    const dayRec = dayMap.get(dayKey);
    const weekRec = weekMap.get(weekKey);
    if (dayRec) {
      if (unknown) dayRec.unknownNew = true;
      else dayRec.newBuyers += 1;
    }
    if (weekRec) {
      if (unknown) weekRec.unknownNew = true;
      else weekRec.newBuyers += 1;
    }
  }
  const mixDaily: MixDay[] = [...dayMap.values()]
    .sort((a, b) => a.start - b.start)
    .map((d) => {
      const day = new Date(d.start);
      const newDollars = Math.round(d.newD);
      const returningDollars = Math.round(d.retD);
      const total = newDollars + returningDollars;
      return {
        key: day.toISOString().slice(0, 10),
        label: `${day.getUTCMonth() + 1}/${day.getUTCDate()}`,
        dayStart: d.start,
        newDollars,
        returningDollars,
        total,
        returningShare: total > 0 ? returningDollars / total : null,
        firstTimeBuyers: firstTimeCount(d),
      };
    });
  const mixWeekly: MixWeek[] = [...weekMap.values()]
    .sort((a, b) => a.start - b.start)
    .map((w) => {
      const monday = new Date(w.start);
      // Round the parts first, then sum — independent rounding of `total`
      // can make "$10 + $10 = $21" on the #73 marquee tooltip/drill.
      const newDollars = Math.round(w.newD);
      const returningDollars = Math.round(w.retD);
      const total = newDollars + returningDollars;
      return {
        key: monday.toISOString().slice(0, 10),
        label: `Wk ${monday.getUTCMonth() + 1}/${monday.getUTCDate()}`,
        weekStart: w.start,
        newDollars,
        returningDollars,
        total,
        returningShare: total > 0 ? returningDollars / total : null,
        firstTimeBuyers: firstTimeCount(w),
      };
    });
  const mixTotals = mixWeekly.reduce(
    (acc, w) => ({ ret: acc.ret + w.returningDollars, all: acc.all + w.total }),
    { ret: 0, all: 0 },
  );
  const mixReturningShareAvg = mixTotals.all > 0 ? mixTotals.ret / mixTotals.all : null;

  const recencyCollectable = RECENCY_BUCKETS.filter((b) => b.min <= historyDays);
  const whaleRecency: RecencyBucket[] = recencyCollectable.map((b, i) => ({
    label: b.label,
    min: b.min,
    max: b.max,
    buyers: recencyCounts[i],
  }));
  const whaleRecencyTruncatedAt =
    recencyCollectable.length < RECENCY_BUCKETS.length ? historyDays : null;

  const repeaters = repeatBuyers;
  const enoughGaps = gaps.length >= 5;
  const typical = enoughGaps ? medianOf(gaps) : null;
  const winBackDay = typical != null ? Math.round(typical) + 15 : null;

  let saveNowOneOrder = 0;
  if (winBackDay != null) {
    for (const rec of byCustomer.values()) {
      if (rec.times.length !== 1) continue;
      const daysSince = (windowEndMs - rec.times[0]!) / DAY_MS;
      if (daysSince > winBackDay) saveNowOneOrder += 1;
    }
  }

  const enoughBuyers = identifiedBuyers >= 8;
  const everRepeatShare = enoughBuyers ? repeatBuyers / identifiedBuyers : null;
  const repeatShare = everRepeatShare;
  const thirdPlusShare = enoughBuyers ? thirdPlusBuyers / identifiedBuyers : null;
  const within30Share = eligible30 >= 8 ? within30 / eligible30 : null;
  const within60Share = eligible60 >= 8 ? within60 / eligible60 : null;

  return {
    available: identifiedBuyers > 0,
    identifiedBuyers,
    guestOrders,
    windowOrders,
    historyDays,
    orderFrequency,
    spendBands,
    daysToSecond,
    daysToSecondTruncatedAt,
    repeaters,
    repurchaseFastDays: enoughGaps ? percentileOf(gaps, 0.25) : null,
    repurchaseTypicalDays: typical,
    repurchaseSlowDays: enoughGaps ? percentileOf(gaps, 0.75) : null,
    winBackDay,
    everRepeatShare,
    everRepeatCount: repeatBuyers,
    within30Share,
    within30Count: within30,
    eligible30,
    within60Share,
    within60Count: within60,
    eligible60,
    saveNowOneOrder,
    repeatBuyers,
    thirdPlusBuyers,
    repeatShare,
    thirdPlusShare,
    whaleCount,
    whaleRecency,
    whaleRecencyTruncatedAt,
    mixDaily,
    mixWeekly,
    mixReturningShareAvg,
    orderSteps: buildOrderSteps(options.orderBook ?? rows),
  };
}

const MONTH_ABBR = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

/**
 * Roll the weekly new-vs-returning mix up to the requested grain so the marquee
 * can offer a Weekly / Monthly explorer toggle. Month grain groups weeks by the
 * calendar month (UTC) of their Monday start. Pure — the chart formats money.
 */
export function bucketMixWeeks(weeks: MixWeek[], grain: MixGrain): MixBucket[] {
  if (grain === "week") {
    return weeks.map((w) => ({
      key: w.key,
      label: w.label,
      start: w.weekStart,
      newDollars: w.newDollars,
      returningDollars: w.returningDollars,
      total: w.total,
      returningShare: w.returningShare,
      firstTimeBuyers: w.firstTimeBuyers,
    }));
  }
  const byMonth = new Map<
    string,
    { start: number; newD: number; retD: number; month: number; buyers: number | null }
  >();
  for (const w of weeks) {
    const d = new Date(w.weekStart);
    const year = d.getUTCFullYear();
    const month = d.getUTCMonth();
    const key = `${year}-${String(month + 1).padStart(2, "0")}`;
    const rec = byMonth.get(key) ?? {
      start: Date.UTC(year, month, 1),
      newD: 0,
      retD: 0,
      month,
      buyers: 0,
    };
    rec.newD += w.newDollars;
    rec.retD += w.returningDollars;
    if (w.firstTimeBuyers == null) rec.buyers = null;
    else if (rec.buyers != null) rec.buyers += w.firstTimeBuyers;
    byMonth.set(key, rec);
  }
  return [...byMonth.entries()]
    .sort((a, b) => a[1].start - b[1].start)
    .map(([key, rec]) => {
      const total = rec.newD + rec.retD;
      return {
        key,
        label: MONTH_ABBR[rec.month]!,
        start: rec.start,
        newDollars: rec.newD,
        returningDollars: rec.retD,
        total,
        returningShare: total > 0 ? rec.retD / total : null,
        firstTimeBuyers: rec.buyers,
      };
    });
}

/** Window totals + a dollar-weighted average returning share for the rail. */
export function mixSummary(buckets: MixBucket[]): MixSummary {
  let returningDollars = 0;
  let newDollars = 0;
  let bestReturning: MixBucket | null = null;
  let firstTimeBuyers: number | null = buckets.length === 0 ? null : 0;
  for (const b of buckets) {
    returningDollars += b.returningDollars;
    newDollars += b.newDollars;
    if (b.firstTimeBuyers == null) firstTimeBuyers = null;
    else if (firstTimeBuyers != null) firstTimeBuyers += b.firstTimeBuyers;
    if (
      b.returningDollars > 0 &&
      (bestReturning == null || b.returningDollars > bestReturning.returningDollars)
    ) {
      bestReturning = b;
    }
  }
  const total = returningDollars + newDollars;
  return {
    returningDollars,
    newDollars,
    total,
    returningShareAvg: total > 0 ? returningDollars / total : null,
    bestReturning,
    firstTimeBuyers,
  };
}

/** Daily columns for the mix explorer — 1:1 with `mixDaily`. */
export function bucketMixDays(days: MixDay[]): MixBucket[] {
  return days.map((d) => ({
    key: d.key,
    label: d.label,
    start: d.dayStart,
    newDollars: d.newDollars,
    returningDollars: d.returningDollars,
    total: d.total,
    returningShare: d.returningShare,
    firstTimeBuyers: d.firstTimeBuyers,
  }));
}

/**
 * Keep the requested grain when that series has at least two columns.
 * Otherwise fall back to a grain that can paint — never an empty toggle.
 */
export function resolveMixGrain(
  requested: MixExplorerGrain,
  ready: { day: boolean; week: boolean; month: boolean },
): MixExplorerGrain {
  switch (requested) {
    case "day":
      if (ready.day) return "day";
      if (ready.week) return "week";
      if (ready.month) return "month";
      return "day";
    case "week":
      if (ready.week) return "week";
      if (ready.day) return "day";
      if (ready.month) return "month";
      return "week";
    case "month":
      if (ready.month) return "month";
      if (ready.week) return "week";
      if (ready.day) return "day";
      return "month";
    default: {
      const _never: never = requested;
      return _never;
    }
  }
}

function mixDeltaTone(delta: number): MixDeltaTone {
  if (delta > 0) return "up";
  if (delta < 0) return "down";
  return "flat";
}

function latestMixLabel(grain: MixExplorerGrain): string {
  switch (grain) {
    case "day":
      return "Latest day";
    case "week":
      return "Latest week";
    case "month":
      return "Latest month";
    default: {
      const _never: never = grain;
      return _never;
    }
  }
}

function priorMixVersus(grain: MixExplorerGrain): string {
  switch (grain) {
    case "day":
      return "vs prior day";
    case "week":
      return "vs prior week";
    case "month":
      return "vs prior month";
    default: {
      const _never: never = grain;
      return _never;
    }
  }
}

function mixGrainNoun(grain: MixExplorerGrain): string {
  switch (grain) {
    case "day":
      return "day";
    case "week":
      return "week";
    case "month":
      return "month";
    default: {
      const _never: never = grain;
      return _never;
    }
  }
}

/**
 * Three ActionCards for the returning-$ habit: latest column vs the one
 * before it, share vs the dollar-weighted usual, and who to win back.
 * Down and flat stay grey in the UI — this function only names the tone.
 * Win-back uses the existing clock (typical + 15). It does not densify
 * days-to-second. Order history only.
 */
export function buildReturningMixPlays(input: {
  buckets: MixBucket[];
  grain: MixExplorerGrain;
  winBackDay: number | null;
  saveNowOneOrder: number;
}): ReturningMixPlay[] {
  const buckets = input.buckets;
  const latest = buckets.length > 0 ? buckets[buckets.length - 1]! : null;
  const prior = buckets.length > 1 ? buckets[buckets.length - 2]! : null;
  const summary = mixSummary(buckets);
  const noun = mixGrainNoun(input.grain);
  const dollarDelta =
    latest != null && prior != null
      ? latest.returningDollars - prior.returningDollars
      : null;
  const sharePoints =
    latest?.returningShare != null &&
    summary.returningShareAvg != null &&
    buckets.length >= 2
      ? Math.round((latest.returningShare - summary.returningShareAvg) * 100)
      : null;
  const winBackKnown =
    input.winBackDay != null && Number.isFinite(input.winBackDay);

  return [
    {
      id: "latest",
      verb: "Returning $",
      label: latestMixLabel(input.grain),
      amount: latest ? latest.returningDollars : null,
      amountKind: "money",
      sub: latest
        ? prior
          ? latest.label
          : `${latest.label} — one ${noun} on file`
        : "Needs two periods — not $0.",
      tone: dollarDelta != null && dollarDelta > 0 ? "good" : "plain",
      delta:
        dollarDelta != null
          ? {
              tone: mixDeltaTone(dollarDelta),
              amount: dollarDelta,
              unit: "dollars",
              versus: priorMixVersus(input.grain),
            }
          : null,
      detail:
        "Returning order dollars in the latest column, next to the column before it. Guests stay in first-time. No ad login.",
    },
    {
      id: "share",
      verb: "Mix",
      label: "Share vs usual",
      amount: latest?.returningShare ?? null,
      amountKind: "share",
      sub: "of this column's dollars",
      tone: sharePoints != null && sharePoints > 0 ? "good" : "plain",
      delta:
        sharePoints != null
          ? {
              tone: mixDeltaTone(sharePoints),
              amount: sharePoints,
              unit: "points",
              versus: "vs usual",
            }
          : null,
      detail:
        "Returning share of the latest column minus the dollar-weighted share of every column in view. Usual is returning $ ÷ (new $ + returning $).",
    },
    {
      id: "winback",
      verb: "Win-back",
      label: "Save now",
      amount: winBackKnown ? input.saveNowOneOrder : null,
      amountKind: "count",
      sub: winBackKnown
        ? `one-order buyers past day ${Math.round(input.winBackDay!)}`
        : "Win-back day needs more repeat orders — not $0.",
      tone: winBackKnown && input.saveNowOneOrder > 0 ? "warn" : "plain",
      delta: null,
      detail: winBackKnown
        ? "Identified buyers with one order already past typical repurchase + 15 days. Order-history timing — not an email guess, not a returning-customer rate."
        : "The win-back day is typical days to a second order plus 15. It stays blank until five second orders are on file — not $0.",
    },
  ];
}

/** Empty analytics for pending / no-data states — honest zeros, not fakes. */
export function emptyCustomerAnalytics(historyWindowDays = 90): CustomerAnalytics {
  return buildCustomerAnalytics([], {
    windowEnd: new Date(),
    historyWindowDays,
  });
}
