/**
 * Customers RFM-lite + whale watchlist — order-history only.
 *
 * Recency / frequency / monetary terciles (1–3), four actionable segments,
 * and a high-LTV recency-risk list. Not a 5×5 Shopify RFM dump. Full stored
 * book when `read_all_orders` has filled it; year-scale recency is withheld
 * when history is limited — never a fake lifetime.
 *
 * Opaque customer keys stay off the desk. No email, no spend, no titles.
 */

import type { RetentionOrderRow } from "./customers-analytics";
import { RETENTION_GUEST_KEY } from "./customers-analytics";

const DAY_MS = 86_400_000;

/** Same buyer floor as LTV flagship — pattern, not one order. */
export const RFM_MIN_BUYERS = 8;
/** Recency risk and first-win follow-up both need 30 days on file. */
export const RFM_MIN_FOLLOW_DAYS = 30;
/** High-LTV slice — top 10% by on-file dollars. */
export const WATCHLIST_DECILE = 0.1;
/** Days since last order before a high-LTV buyer is slipping. */
export const WATCHLIST_COLD_DAYS = 30;
/** Soft dense — not a customer dump. */
export const WATCHLIST_MAX = 8;

export type RfmScore = 1 | 2 | 3;

export type RfmSegmentKey = "champions" | "rising" | "at_risk" | "quiet";

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
}

export interface WhaleWatchRow {
  rank: number;
  /** Desk label — never the Shopify customer key. */
  label: string;
  lifetime: number;
  orders: number;
  daysSince: number;
  recency: RfmScore;
  frequency: RfmScore;
  monetary: RfmScore;
  verb: string;
  detail: string;
}

export interface CustomerRfmView {
  available: boolean;
  identifiedBuyers: number;
  maturedBuyers: number;
  historyDays: number;
  historyLimited: boolean;
  empty: RfmEmpty | null;
  bands: RfmBand[];
  segments: RfmSegment[];
  watchlist: WhaleWatchRow[];
  /** Designed first-win when RFM sealed but no slipping whales. */
  watchEmpty: RfmEmpty | null;
  recencyTruncatedAt: number | null;
}

type BuyerRollup = {
  key: string;
  times: number[];
  total: number;
  orders: number;
  first: number;
  last: number;
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

function tercileScore(rank0: number, n: number): RfmScore {
  if (n <= 0) return 1;
  const highCut = Math.ceil(n / 3);
  const midCut = Math.ceil((2 * n) / 3);
  if (rank0 < highCut) return 3;
  if (rank0 < midCut) return 2;
  return 1;
}

function segmentFor(b: BuyerRollup): RfmSegmentKey {
  if (b.monetary === 3 && b.recency === 1) return "at_risk";
  if (b.recency >= 2 && b.frequency >= 2 && b.monetary >= 2) return "champions";
  if (b.recency === 3 && b.frequency === 1) return "rising";
  return "quiet";
}

function segmentCopy(key: RfmSegmentKey): { label: string; verb: string } {
  switch (key) {
    case "champions":
      return { label: "Champions", verb: "Keep close" };
    case "rising":
      return { label: "Rising", verb: "Second ask" };
    case "at_risk":
      return { label: "At risk", verb: "Reach now" };
    case "quiet":
      return { label: "Quiet", verb: "Watch" };
    default: {
      const _exhaustive: never = key;
      return _exhaustive;
    }
  }
}

/**
 * First-win empty when RFM has not sealed. Syncing / thin / young — not $0,
 * not a blank chart. Floor is 8 identified buyers who have lived 30 days.
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
      copy: "Orders still syncing — not $0. RFM-lite bands and the whale watchlist fill as identified buyers land.",
      verb: "Refresh this page",
    };
  }
  if (buyers < need) {
    return {
      kind: "thin",
      buyers,
      need,
      copy: `${buyers.toLocaleString()} identified ${buyers === 1 ? "buyer" : "buyers"} on file. RFM-lite seals after ${need} have lived 30 days — not $0.`,
      verb: "Watch first 30 days",
    };
  }
  if (maturedBuyers < need) {
    return {
      kind: "young",
      buyers,
      need,
      copy: `${buyers.toLocaleString()} buyers on file. Bands seal once ${need} have lived 30 days — not $0.`,
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
    copy: "No high-LTV buyers past 30 days since last order — not zero. The list fills when a top-dollar buyer goes quiet.",
    verb: "Watch the next 30 days",
  };
}

function emptyBands(): RfmBand[] {
  return [
    {
      key: "R",
      label: "Recency",
      high: { label: "Recent", buyers: 0 },
      mid: { label: "Mid", buyers: 0 },
      low: { label: "Cooling", buyers: 0 },
    },
    {
      key: "F",
      label: "Frequency",
      high: { label: "Often", buyers: 0 },
      mid: { label: "Some", buyers: 0 },
      low: { label: "Once", buyers: 0 },
    },
    {
      key: "M",
      label: "Monetary",
      high: { label: "High $", buyers: 0 },
      mid: { label: "Mid $", buyers: 0 },
      low: { label: "Low $", buyers: 0 },
    },
  ];
}

function emptySegments(): RfmSegment[] {
  const keys: RfmSegmentKey[] = ["champions", "rising", "at_risk", "quiet"];
  return keys.map((key) => {
    const { label, verb } = segmentCopy(key);
    return { key, label, buyers: 0, share: 0, dollars: 0, verb };
  });
}

function scoreBuyers(rollups: BuyerRollup[]): void {
  const n = rollups.length;
  const byRecency = [...rollups].sort((a, b) => a.daysSince - b.daysSince);
  byRecency.forEach((b, i) => {
    b.recency = tercileScore(i, n);
  });
  const byFreq = [...rollups].sort((a, b) => b.orders - a.orders);
  byFreq.forEach((b, i) => {
    b.frequency = tercileScore(i, n);
  });
  const byMoney = [...rollups].sort((a, b) => b.total - a.total);
  byMoney.forEach((b, i) => {
    b.monetary = tercileScore(i, n);
  });
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
  for (const key of ["champions", "rising", "at_risk", "quiet"] as const) {
    acc.set(key, { buyers: 0, dollars: 0 });
  }
  for (const b of rollups) {
    const key = segmentFor(b);
    const rec = acc.get(key)!;
    rec.buyers += 1;
    rec.dollars += b.total;
  }
  const n = rollups.length;
  return (["champions", "rising", "at_risk", "quiet"] as const).map((key) => {
    const { label, verb } = segmentCopy(key);
    const rec = acc.get(key)!;
    return {
      key,
      label,
      buyers: rec.buyers,
      share: n > 0 ? rec.buyers / n : 0,
      dollars: Math.round(rec.dollars),
      verb,
    };
  });
}

function buildWatchlist(
  rollups: BuyerRollup[],
  historyDays: number,
): WhaleWatchRow[] {
  if (rollups.length < RFM_MIN_BUYERS) return [];
  const sorted = [...rollups].sort((a, b) => b.total - a.total);
  const whaleCount = Math.max(1, Math.round(sorted.length * WATCHLIST_DECILE));
  const whales = sorted.slice(0, whaleCount).filter((b) => b.orders >= 2);
  const slipping = whales.filter(
    (b) =>
      b.daysSince > WATCHLIST_COLD_DAYS &&
      b.daysSince <= historyDays,
  );
  slipping.sort((a, b) => b.total - a.total);
  return slipping.slice(0, WATCHLIST_MAX).map((b, i) => ({
    rank: i + 1,
    label: `Whale ${i + 1}`,
    lifetime: Math.round(b.total),
    orders: b.orders,
    daysSince: Math.round(b.daysSince),
    recency: b.recency,
    frequency: b.frequency,
    monetary: b.monetary,
    verb: "Reach now",
    detail:
      "High on-file dollars, last order past 30 days. Order-history timing — not email.",
  }));
}

/**
 * RFM-lite + whale watchlist over the stored order book.
 * `historyLimited` withholds year-scale recency — never a fake lifetime.
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
  const byCustomer = new Map<string, { times: number[]; total: number }>();
  for (const r of identified) {
    const t = ms(r.orderedAt);
    if (t < earliest) earliest = t;
    const rec = byCustomer.get(r.customerKey) ?? { times: [], total: 0 };
    rec.times.push(t);
    rec.total += finite(r.amount);
    byCustomer.set(r.customerKey, rec);
  }

  const identifiedBuyers = byCustomer.size;
  const historyDays =
    identifiedBuyers > 0 && Number.isFinite(earliest)
      ? Math.max(1, Math.ceil((windowEndMs - earliest) / DAY_MS))
      : 0;

  const rollups: BuyerRollup[] = [];
  for (const [key, rec] of byCustomer) {
    const first = Math.min(...rec.times);
    const last = Math.max(...rec.times);
    rollups.push({
      key,
      times: rec.times,
      total: rec.total,
      orders: rec.times.length,
      first,
      last,
      daysSince: Math.max(0, (windowEndMs - last) / DAY_MS),
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
      empty,
      bands: emptyBands(),
      segments: emptySegments(),
      watchlist: [],
      watchEmpty: empty,
      recencyTruncatedAt,
    };
  }

  scoreBuyers(rollups);
  const watchlist = buildWatchlist(rollups, historyDays);

  return {
    available: true,
    identifiedBuyers,
    maturedBuyers,
    historyDays,
    historyLimited: options.historyLimited,
    empty: null,
    bands: buildBands(rollups),
    segments: buildSegments(rollups),
    watchlist,
    watchEmpty: watchlist.length === 0 ? watchEmptyState(identifiedBuyers) : null,
    recencyTruncatedAt,
  };
}

/** Honest zeros for pending / no-data — not a fake RFM. */
export function emptyCustomerRfm(): CustomerRfmView {
  return buildCustomerRfm([], {
    windowEnd: new Date(),
    historyLimited: false,
  });
}
