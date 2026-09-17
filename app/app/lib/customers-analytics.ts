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
const DAY_MS = 86_400_000;

export type RetentionOrderRow = {
  customerKey: string;
  orderedAt: Date;
  amount: number;
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
};

/** Grain the marquee explorer can roll the weekly mix up to. */
export type MixGrain = "week" | "month";

/** One plotted column of the new-vs-returning marquee, at either grain. */
export type MixBucket = {
  key: string;
  label: string;
  start: number;
  newDollars: number;
  returningDollars: number;
  total: number;
  returningShare: number | null;
};

/** Window roll-up powering the marquee's KPI strip and its average-share rail. */
export type MixSummary = {
  returningDollars: number;
  newDollars: number;
  total: number;
  returningShareAvg: number | null;
  bestReturning: MixBucket | null;
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
  /** New vs returning dollars by ISO week (Mon start) — a trend, not a snapshot. */
  mixWeekly: MixWeek[];
  /** Dollar-weighted returning-share across the window — the trend's rail. */
  mixReturningShareAvg: number | null;
};

function finite(n: number): number {
  return Number.isFinite(n) ? n : 0;
}

function ms(d: Date): number {
  return d instanceof Date ? d.getTime() : new Date(d).getTime();
}

/** Monday (UTC) of the week containing `d` — ISO week start for the mix trend. */
function mondayUtc(d: Date): Date {
  const x = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
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
  options: { windowEnd: Date; historyWindowDays: number },
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

  // New vs returning dollars by week: an order is "returning" when it lands after
  // the buyer's first order on file; guests can never be returning.
  const firstByCustomer = new Map<string, number>();
  for (const [key, rec] of byCustomer) {
    firstByCustomer.set(key, Math.min(...rec.times));
  }
  const weekMap = new Map<string, { start: number; newD: number; retD: number }>();
  for (const r of clean) {
    const monday = mondayUtc(r.orderedAt);
    const key = monday.toISOString().slice(0, 10);
    const rec = weekMap.get(key) ?? { start: monday.getTime(), newD: 0, retD: 0 };
    const isReturning =
      r.customerKey !== RETENTION_GUEST_KEY &&
      ms(r.orderedAt) > (firstByCustomer.get(r.customerKey) ?? Number.POSITIVE_INFINITY);
    if (isReturning) rec.retD += finite(r.amount);
    else rec.newD += finite(r.amount);
    weekMap.set(key, rec);
  }
  const mixWeekly: MixWeek[] = [...weekMap.values()]
    .sort((a, b) => a.start - b.start)
    .map((w) => {
      const monday = new Date(w.start);
      const total = w.newD + w.retD;
      return {
        key: monday.toISOString().slice(0, 10),
        label: `Wk ${monday.getUTCMonth() + 1}/${monday.getUTCDate()}`,
        weekStart: w.start,
        newDollars: Math.round(w.newD),
        returningDollars: Math.round(w.retD),
        total: Math.round(total),
        returningShare: total > 0 ? w.retD / total : null,
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
    mixWeekly,
    mixReturningShareAvg,
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
    }));
  }
  const byMonth = new Map<
    string,
    { start: number; newD: number; retD: number; month: number }
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
    };
    rec.newD += w.newDollars;
    rec.retD += w.returningDollars;
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
      };
    });
}

/** Window totals + a dollar-weighted average returning share for the rail. */
export function mixSummary(buckets: MixBucket[]): MixSummary {
  let returningDollars = 0;
  let newDollars = 0;
  let bestReturning: MixBucket | null = null;
  for (const b of buckets) {
    returningDollars += b.returningDollars;
    newDollars += b.newDollars;
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
  };
}

/** Empty analytics for pending / no-data states — honest zeros, not fakes. */
export function emptyCustomerAnalytics(historyWindowDays = 90): CustomerAnalytics {
  return buildCustomerAnalytics([], {
    windowEnd: new Date(),
    historyWindowDays,
  });
}
