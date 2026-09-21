/**
 * Customers RFM-lite + whale watchlist — Shopify order history only.
 *
 * Simple R · F · M thresholds (not a 5×5 tercile dump):
 *   R  ≤30d recent · 31–90d mid · >90d hibernating
 *   F  1 order · 2 orders · 3+ orders
 *   M  below this shop’s median order LTV · at or above it · at or above 2×
 *
 * Labels: Champions / At risk / New / Hibernating. Buyers who miss every
 * rule stay unlabeled — never forced into a name. The whale list is the top
 * identified buyers by order LTV. Repeat revenue is blank when there is no
 * second order, never a fake $0. A thin book returns an empty list — no
 * invented customers. Opaque keys stay off the desk.
 */

import type { RetentionOrderRow } from "./customers-analytics";
import { RETENTION_GUEST_KEY } from "./customers-analytics";

const DAY_MS = 86_400_000;

/** Same buyer floor as LTV flagship — pattern, not one order. */
export const RFM_MIN_BUYERS = 8;
/** Recency risk and first-win follow-up both need 30 days on file. */
export const RFM_MIN_FOLLOW_DAYS = 30;
/** Last order within this many days is recent (R high). */
export const RFM_RECENT_DAYS = 30;
/** Last order after this many days is hibernating (R low). */
export const RFM_HIBERNATE_DAYS = 90;
/** Two Shopify orders is a repeat buyer (F mid). */
export const RFM_REPEAT_ORDERS = 2;
/** Three or more Shopify orders is often (F high). */
export const RFM_OFTEN_ORDERS = 3;
/** Soft dense — not a customer dump. */
export const WATCHLIST_MAX = 8;

/** One line on the labels. Order history only. */
export const RFM_FROM_SHOPIFY_ORDERS =
  "From Shopify orders — not email, not ads, not a subscription app.";

/** Thresholds painted next to the four labels. */
export const RFM_RULES_LINE =
  "R: ≤30 days recent, 31–90 mid, after 90 hibernating. F: 1 order, 2 orders, 3+ orders. M: below, at, or above this shop’s median order LTV (2× median is high).";

export type RfmScore = 1 | 2 | 3;

export type RfmSegmentKey = "champions" | "at_risk" | "new" | "hibernating";

export type RfmEmptyKind = "syncing" | "thin" | "young";

export type RfmBandKey = "R" | "F" | "M";

export interface RfmEmpty {
  kind: RfmEmptyKind;
  buyers: number;
  need: number;
  copy: string;
  verb: string;
}

export interface RfmBandSlice {
  label: string;
  buyers: number;
}

export interface RfmBand {
  key: RfmBandKey;
  label: string;
  low: RfmBandSlice;
  mid: RfmBandSlice;
  high: RfmBandSlice;
}

export interface RfmSegment {
  key: RfmSegmentKey;
  label: string;
  buyers: number;
  share: number;
  dollars: number;
  verb: string;
  rule: string;
}

export interface WhaleWatchRow {
  rank: number;
  /** Desk label — never the Shopify customer key, never an invented name. */
  label: string;
  /** Sum of Shopify order amounts. */
  lifetime: number;
  /**
   * Revenue after the first order. Null when the buyer has no second order —
   * blank, not a fake $0.
   */
  repeatRevenue: number | null;
  orders: number;
  daysSince: number;
  recency: RfmScore;
  frequency: RfmScore;
  monetary: RfmScore;
  segment: RfmSegmentKey | null;
  verb: string;
  detail: string;
}

export interface CustomerRfmView {
  available: boolean;
  identifiedBuyers: number;
  maturedBuyers: number;
  historyDays: number;
  historyLimited: boolean;
  /** Shop median order LTV once the book has sealed. Null while empty. */
  medianOrderLtv: number | null;
  /** Identified buyers who match none of the four rules. */
  outsideRules: number;
  empty: RfmEmpty | null;
  bands: RfmBand[];
  segments: RfmSegment[];
  watchlist: WhaleWatchRow[];
  /** Designed first-win when RFM sealed but no positive order LTV to rank. */
  watchEmpty: RfmEmpty | null;
  recencyTruncatedAt: number | null;
}

type BuyerRollup = {
  key: string;
  total: number;
  orders: number;
  first: number;
  last: number;
  firstAmount: number;
  daysSince: number;
  recency: RfmScore;
  frequency: RfmScore;
  monetary: RfmScore;
};

function finite(n: number): number {
  return Number.isFinite(n) ? n : 0;
}

function ms(d: Date): number {
  return d instanceof Date ? d.getTime() : new Date(d).getTime();
}

function medianOf(values: number[]): number | null {
  const sorted = values.filter((n) => Number.isFinite(n)).sort((a, b) => a - b);
  if (sorted.length === 0) return null;
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 1) return sorted[mid]!;
  return (sorted[mid - 1]! + sorted[mid]!) / 2;
}

function segmentFor(b: BuyerRollup): RfmSegmentKey | null {
  if (b.daysSince > RFM_HIBERNATE_DAYS) return "hibernating";
  if (b.orders === 1 && b.daysSince <= RFM_RECENT_DAYS) return "new";
  if (
    b.orders >= RFM_REPEAT_ORDERS &&
    b.daysSince <= RFM_RECENT_DAYS &&
    b.monetary >= 2
  ) {
    return "champions";
  }
  if (
    b.orders >= RFM_REPEAT_ORDERS &&
    b.daysSince > RFM_RECENT_DAYS &&
    b.daysSince <= RFM_HIBERNATE_DAYS &&
    b.monetary >= 2
  ) {
    return "at_risk";
  }
  return null;
}

function segmentCopy(key: RfmSegmentKey): {
  label: string;
  verb: string;
  rule: string;
} {
  switch (key) {
    case "champions":
      return {
        label: "Champions",
        verb: "Keep close",
        rule: "Last order within 30 days, 2 or more orders, and order LTV at or above this shop’s median.",
      };
    case "at_risk":
      return {
        label: "At risk",
        verb: "Reach now",
        rule: "Last order 31–90 days ago, 2 or more orders, and order LTV at or above this shop’s median.",
      };
    case "new":
      return {
        label: "New",
        verb: "Second ask",
        rule: "Exactly one order, and that order is within 30 days.",
      };
    case "hibernating":
      return {
        label: "Hibernating",
        verb: "Win back",
        rule: "Last order more than 90 days ago.",
      };
    default: {
      const _exhaustive: never = key;
      return _exhaustive;
    }
  }
}

function whaleVerb(segment: RfmSegmentKey | null): string {
  switch (segment) {
    case "champions":
      return "Keep close";
    case "at_risk":
      return "Reach now";
    case "new":
      return "Second ask";
    case "hibernating":
      return "Win back";
    case null:
      return "Watch";
    default: {
      const _exhaustive: never = segment;
      return _exhaustive;
    }
  }
}

/**
 * First-win empty when RFM has not sealed. Syncing / thin / young — not $0,
 * not a blank chart, not invented customers. Floor is 8 identified buyers
 * who have lived 30 days.
 */
export function rfmEmptyState(
  buyers: number,
  maturedBuyers: number,
): RfmEmpty | null {
  const need = RFM_MIN_BUYERS;
  if (buyers <= 0) {
    return {
      kind: "syncing",
      buyers: 0,
      need,
      copy: "Orders still syncing — not $0. RFM-lite labels and the whale watchlist fill from Shopify orders. No customers invented.",
      verb: "Refresh this page",
    };
  }
  if (buyers < need) {
    return {
      kind: "thin",
      buyers,
      need,
      copy: `${buyers.toLocaleString()} identified ${buyers === 1 ? "buyer" : "buyers"} on file. RFM-lite seals after ${need} have lived 30 days — not $0. No customers invented.`,
      verb: "Watch first 30 days",
    };
  }
  if (maturedBuyers < need) {
    return {
      kind: "young",
      buyers,
      need,
      copy: `${buyers.toLocaleString()} buyers on file. Labels seal once ${need} have lived 30 days — not $0. No customers invented.`,
      verb: "Wait for day 30",
    };
  }
  return null;
}

function watchEmptyState(buyers: number): RfmEmpty {
  return {
    kind: "thin",
    buyers,
    need: RFM_MIN_BUYERS,
    copy: "No positive order LTV to rank — not $0. No customers invented. The list fills from Shopify orders.",
    verb: "Watch Shopify orders",
  };
}

function emptyBands(): RfmBand[] {
  return [
    {
      key: "R",
      label: "Recency",
      high: { label: "≤30d", buyers: 0 },
      mid: { label: "31–90d", buyers: 0 },
      low: { label: ">90d", buyers: 0 },
    },
    {
      key: "F",
      label: "Frequency",
      high: { label: "3+ orders", buyers: 0 },
      mid: { label: "2 orders", buyers: 0 },
      low: { label: "1 order", buyers: 0 },
    },
    {
      key: "M",
      label: "Monetary",
      high: { label: "≥2× median", buyers: 0 },
      mid: { label: "≥ median", buyers: 0 },
      low: { label: "Below median", buyers: 0 },
    },
  ];
}

function emptySegments(): RfmSegment[] {
  const keys: RfmSegmentKey[] = ["champions", "at_risk", "new", "hibernating"];
  return keys.map((key) => {
    const { label, verb, rule } = segmentCopy(key);
    return { key, label, buyers: 0, share: 0, dollars: 0, verb, rule };
  });
}

function scoreBuyers(rollups: BuyerRollup[], median: number): void {
  for (const b of rollups) {
    if (b.daysSince <= RFM_RECENT_DAYS) b.recency = 3;
    else if (b.daysSince <= RFM_HIBERNATE_DAYS) b.recency = 2;
    else b.recency = 1;

    if (b.orders >= RFM_OFTEN_ORDERS) b.frequency = 3;
    else if (b.orders >= RFM_REPEAT_ORDERS) b.frequency = 2;
    else b.frequency = 1;

    if (median > 0 && b.total >= median * 2) b.monetary = 3;
    else if (median > 0 && b.total >= median) b.monetary = 2;
    else b.monetary = 1;
  }
}

function buildBands(rollups: BuyerRollup[]): RfmBand[] {
  const bands = emptyBands();
  for (const b of rollups) {
    bands[0]!.high.buyers += b.recency === 3 ? 1 : 0;
    bands[0]!.mid.buyers += b.recency === 2 ? 1 : 0;
    bands[0]!.low.buyers += b.recency === 1 ? 1 : 0;
    bands[1]!.high.buyers += b.frequency === 3 ? 1 : 0;
    bands[1]!.mid.buyers += b.frequency === 2 ? 1 : 0;
    bands[1]!.low.buyers += b.frequency === 1 ? 1 : 0;
    bands[2]!.high.buyers += b.monetary === 3 ? 1 : 0;
    bands[2]!.mid.buyers += b.monetary === 2 ? 1 : 0;
    bands[2]!.low.buyers += b.monetary === 1 ? 1 : 0;
  }
  return bands;
}

function buildSegments(rollups: BuyerRollup[]): RfmSegment[] {
  const acc = new Map<RfmSegmentKey, { buyers: number; dollars: number }>();
  for (const key of ["champions", "at_risk", "new", "hibernating"] as const) {
    acc.set(key, { buyers: 0, dollars: 0 });
  }
  for (const b of rollups) {
    const key = segmentFor(b);
    if (key == null) continue;
    const rec = acc.get(key)!;
    rec.buyers += 1;
    rec.dollars += b.total;
  }
  const n = rollups.length;
  return (["champions", "at_risk", "new", "hibernating"] as const).map((key) => {
    const { label, verb, rule } = segmentCopy(key);
    const rec = acc.get(key)!;
    return {
      key,
      label,
      buyers: rec.buyers,
      share: n > 0 ? rec.buyers / n : 0,
      dollars: Math.round(rec.dollars),
      verb,
      rule,
    };
  });
}

function repeatRevenueOf(b: BuyerRollup): number | null {
  if (b.orders < 2) return null;
  return Math.round(b.total - b.firstAmount);
}

function buildWatchlist(rollups: BuyerRollup[]): WhaleWatchRow[] {
  if (rollups.length < RFM_MIN_BUYERS) return [];
  const ranked = rollups
    .filter((b) => b.total > 0)
    .sort((a, b) => {
      if (b.total !== a.total) return b.total - a.total;
      const aRepeat = repeatRevenueOf(a) ?? -1;
      const bRepeat = repeatRevenueOf(b) ?? -1;
      return bRepeat - aRepeat;
    })
    .slice(0, WATCHLIST_MAX);

  return ranked.map((b, i) => {
    const segment = segmentFor(b);
    return {
      rank: i + 1,
      label: `Whale ${i + 1}`,
      lifetime: Math.round(b.total),
      repeatRevenue: repeatRevenueOf(b),
      orders: b.orders,
      daysSince: Math.round(b.daysSince),
      recency: b.recency,
      frequency: b.frequency,
      monetary: b.monetary,
      segment,
      verb: whaleVerb(segment),
      detail:
        "Ranked by order LTV from Shopify orders. Repeat is revenue after the first order — blank when there is no second order, not $0.",
    };
  });
}

/**
 * RFM-lite + whale watchlist over the stored Shopify order book.
 * `historyLimited` withholds year-scale recency — never a fake lifetime.
 * Thin books return an empty watchlist — never invented customers.
 */
export function buildCustomerRfm(
  rows: RetentionOrderRow[],
  options: { windowEnd: Date; historyLimited: boolean },
): CustomerRfmView {
  const clean = rows.filter((r) => r && Number.isFinite(r.amount));
  const windowEndMs = ms(options.windowEnd);
  const identified = clean.filter(
    (r) => r.customerKey && r.customerKey !== RETENTION_GUEST_KEY,
  );

  let earliest = Number.POSITIVE_INFINITY;
  const byCustomer = new Map<
    string,
    {
      total: number;
      orders: number;
      first: number;
      last: number;
      firstAmount: number;
    }
  >();
  for (const r of identified) {
    const t = ms(r.orderedAt);
    const amt = finite(r.amount);
    if (t < earliest) earliest = t;
    const rec = byCustomer.get(r.customerKey);
    if (!rec) {
      byCustomer.set(r.customerKey, {
        total: amt,
        orders: 1,
        first: t,
        last: t,
        firstAmount: amt,
      });
      continue;
    }
    if (t < rec.first) {
      rec.first = t;
      rec.firstAmount = amt;
    }
    if (t > rec.last) rec.last = t;
    rec.total += amt;
    rec.orders += 1;
    byCustomer.set(r.customerKey, rec);
  }

  const identifiedBuyers = byCustomer.size;
  const historyDays =
    identifiedBuyers > 0 && Number.isFinite(earliest)
      ? Math.max(1, Math.ceil((windowEndMs - earliest) / DAY_MS))
      : 0;

  const rollups: BuyerRollup[] = [];
  for (const [key, rec] of byCustomer) {
    rollups.push({
      key,
      total: rec.total,
      orders: rec.orders,
      first: rec.first,
      last: rec.last,
      firstAmount: rec.firstAmount,
      daysSince: Math.max(0, (windowEndMs - rec.last) / DAY_MS),
      recency: 1,
      frequency: 1,
      monetary: 1,
    });
  }

  const maturedBuyers = rollups.filter(
    (b) => windowEndMs - b.first >= RFM_MIN_FOLLOW_DAYS * DAY_MS,
  ).length;
  const empty = rfmEmptyState(identifiedBuyers, maturedBuyers);
  const recencyTruncatedAt = options.historyLimited ? historyDays : null;

  if (empty) {
    return {
      available: false,
      identifiedBuyers,
      maturedBuyers,
      historyDays,
      historyLimited: options.historyLimited,
      medianOrderLtv: null,
      outsideRules: 0,
      empty,
      bands: emptyBands(),
      segments: emptySegments(),
      watchlist: [],
      watchEmpty: empty,
      recencyTruncatedAt,
    };
  }

  const median = medianOf(rollups.map((b) => b.total)) ?? 0;
  scoreBuyers(rollups, median);
  const segments = buildSegments(rollups);
  const labeled = segments.reduce((sum, row) => sum + row.buyers, 0);
  const watchlist = buildWatchlist(rollups);

  return {
    available: true,
    identifiedBuyers,
    maturedBuyers,
    historyDays,
    historyLimited: options.historyLimited,
    medianOrderLtv: median,
    outsideRules: rollups.length - labeled,
    empty: null,
    bands: buildBands(rollups),
    segments,
    watchlist,
    watchEmpty: watchlist.length === 0 ? watchEmptyState(identifiedBuyers) : null,
    recencyTruncatedAt,
  };
}

/** Honest empty for pending / no-data — not a fake RFM, not invented whales. */
export function emptyCustomerRfm(): CustomerRfmView {
  return buildCustomerRfm([], {
    windowEnd: new Date(),
    historyLimited: false,
  });
}
