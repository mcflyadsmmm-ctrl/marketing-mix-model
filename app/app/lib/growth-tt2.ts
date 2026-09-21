/**
 * Growth days-to-second (TT2) habit clock + win-back fall-off.
 *
 * Shopify Analytics Overview shows a returning-customer rate. Growth already
 * answers first-time dollars and the 30-day come-back. This board deepens the
 * habit: how long the typical wait to a second order is (fast / typical /
 * slow), and when one-order buyers fall off so the shop knows when to
 * re-engage — from the stored order book, not an email list.
 *
 * Full stored book when `read_all_orders` has filled it. Year-scale fall-off
 * is withheld when history is limited or the observed book is shorter than
 * the bucket. Thin shops stay honest empties, never a fake year.
 *
 * Pure + Prisma-free so it unit-tests away from the loader.
 */

import { medianOf, percentileOf } from "./shopify-depth-stats";

export const TT2_GUEST_KEY = "guest";
/** Same buyer floor as LTV / RFM — a pattern, not one order. */
export const TT2_MIN_BUYERS = 8;
/** First-win follow-up and 30-day come-back both need 30 days on file. */
export const TT2_MIN_FOLLOW_DAYS = 30;
/** Fast / typical / slow wait needs this many first→second gaps. */
export const TT2_MIN_GAPS = 5;
/** Win-back day sits just past typical wait — same pad as Customers. */
export const TT2_WINBACK_PAD_DAYS = 15;

const DAY_MS = 86_400_000;

export type GrowthTt2EmptyKind = "syncing" | "thin" | "young";

export type GrowthTt2Empty = {
  kind: GrowthTt2EmptyKind;
  buyers: number;
  need: number;
  copy: string;
  verb: string;
};

export type GrowthTt2Bucket = {
  label: string;
  min: number;
  max: number | null;
  buyers: number;
};

export type GrowthTt2OrderRow = {
  customerKey: string;
  orderedAt: Date;
  amount: number;
  /**
   * Shop-local calendar day (UTC midnight). Second-order weekend habit uses
   * this when present — same Sat+Sun rule as order depth. Falls back to the
   * UTC day of `orderedAt` only when the local day was not stored.
   */
  shopLocalDate?: Date | null;
};

const WEEKDAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

export type GrowthWeekdayName = (typeof WEEKDAY_NAMES)[number];

/** Sat+Sun share of second orders. Order-history repurchase habit — not weekend sales. */
export type GrowthWeekendHabit = {
  weekendCount: number;
  weekdayCount: number;
  /** Null under 5 second orders, and null when the share rounds to 0%. */
  weekendShare: number | null;
  /** Unique day with the most second orders, once at least two landed there. */
  peakDay: GrowthWeekdayName | null;
  peakCount: number;
};

export type GrowthTt2View = {
  available: boolean;
  identifiedBuyers: number;
  maturedBuyers: number;
  gapCount: number;
  historyDays: number;
  historyLimited: boolean;
  empty: GrowthTt2Empty | null;
  /** Board sealed but the clock still needs 5 second orders. */
  clockEmpty: GrowthTt2Empty | null;
  fastDays: number | null;
  typicalDays: number | null;
  slowDays: number | null;
  /** Slow minus fast — how spread the habit is. Null until both exist. */
  habitSpanDays: number | null;
  winBackDay: number | null;
  /** One-order buyers already past the win-back day. */
  reachNow: number;
  oneOrderBuyers: number;
  within30Share: number | null;
  within30Count: number;
  eligible30: number;
  daysToSecond: GrowthTt2Bucket[];
  daysToSecondTruncatedAt: number | null;
  fallOff: GrowthTt2Bucket[];
  fallOffTruncatedAt: number | null;
  /** Designed first-win when every identified buyer already came back. */
  fallEmpty: GrowthTt2Empty | null;
  /** When the second order landed — Sat+Sun vs Mon–Fri. Zeros until the clock seals. */
  weekend: GrowthWeekendHabit;
};

export type GrowthTt2Read = {
  line: string;
  typicalDays: number | null;
  reachNow: number;
};

const TIME_BUCKETS: Array<{ label: string; min: number; max: number | null }> = [
  { label: "0–7d", min: 0, max: 7 },
  { label: "8–30d", min: 8, max: 30 },
  { label: "31–60d", min: 31, max: 60 },
  { label: "61–90d", min: 61, max: 90 },
  { label: "91–180d", min: 91, max: 180 },
  { label: "181–365d", min: 181, max: 365 },
  { label: "365d+", min: 366, max: null },
];

function finite(n: number): number {
  return Number.isFinite(n) ? n : 0;
}

function ms(d: Date): number {
  return d instanceof Date ? d.getTime() : new Date(d).getTime();
}

function placeBucket(days: number, counts: number[]): void {
  for (let i = 0; i < TIME_BUCKETS.length; i += 1) {
    const b = TIME_BUCKETS[i]!;
    if (days >= b.min && (b.max == null || days <= b.max)) {
      counts[i] += 1;
      return;
    }
  }
}

function collectBuckets(
  counts: number[],
  historyDays: number,
): { buckets: GrowthTt2Bucket[]; truncatedAt: number | null } {
  const collectable = TIME_BUCKETS.filter((b) => b.min <= historyDays);
  const buckets = collectable.map((b, i) => ({
    label: b.label,
    min: b.min,
    max: b.max,
    buyers: counts[i] ?? 0,
  }));
  const truncatedAt =
    collectable.length < TIME_BUCKETS.length ? historyDays : null;
  return { buckets, truncatedAt };
}

/**
 * First-win empty when the habit clock has not sealed. Syncing / thin /
 * young — not $0, not a blank chart. Floor is 8 identified buyers who have
 * lived 30 days.
 */
export function growthTt2EmptyState(
  buyers: number,
  maturedBuyers: number,
): GrowthTt2Empty | null {
  const need = TT2_MIN_BUYERS;
  if (buyers <= 0) {
    return {
      kind: "syncing",
      buyers: 0,
      need,
      copy: "Orders still syncing — not $0. Days to a second order and the win-back clock fill as identified buyers land.",
      verb: "Refresh this page",
    };
  }
  if (buyers < need) {
    return {
      kind: "thin",
      buyers,
      need,
      copy: `${buyers.toLocaleString()} identified ${buyers === 1 ? "buyer" : "buyers"} on file. The habit clock seals after ${need} have lived 30 days — not $0.`,
      verb: "Watch first 30 days",
    };
  }
  if (maturedBuyers < need) {
    return {
      kind: "young",
      buyers,
      need,
      copy: `${buyers.toLocaleString()} buyers on file. Typical wait seals once ${need} have lived 30 days — not $0.`,
      verb: "Wait for day 30",
    };
  }
  return null;
}

function clockEmptyState(buyers: number): GrowthTt2Empty {
  return {
    kind: "thin",
    buyers,
    need: TT2_MIN_GAPS,
    copy: "Typical wait needs 5 second orders on file — not $0. Fall-off below still counts one-order buyers who have not come back.",
    verb: "Wait for a second order",
  };
}

function fallEmptyState(buyers: number): GrowthTt2Empty {
  return {
    kind: "thin",
    buyers,
    need: TT2_MIN_BUYERS,
    copy: "No one-order buyers still waiting — not zero. Fall-off fills when a first-timer stays quiet.",
    verb: "Watch the next 30 days",
  };
}

function emptyBuckets(historyDays: number): {
  buckets: GrowthTt2Bucket[];
  truncatedAt: number | null;
} {
  return collectBuckets(new Array(TIME_BUCKETS.length).fill(0), historyDays);
}

function emptyWeekend(): GrowthWeekendHabit {
  return {
    weekendCount: 0,
    weekdayCount: 0,
    weekendShare: null,
    peakDay: null,
    peakCount: 0,
  };
}

function secondOrderDow(local: Date | null, orderedAtMs: number): number {
  if (local instanceof Date && Number.isFinite(local.getTime())) {
    return local.getUTCDay();
  }
  return new Date(orderedAtMs).getUTCDay();
}

/**
 * Weekend habit of the second order. Share stays null until five gaps, and
 * stays null when it would paint 0% — a weekday-only book is not a fake zero.
 */
function sealWeekend(
  weekendCount: number,
  weekdayCount: number,
  dowCounts: number[],
): GrowthWeekendHabit {
  const total = weekendCount + weekdayCount;
  const raw = total >= TT2_MIN_GAPS ? weekendCount / total : null;
  const weekendShare = raw != null && Math.round(raw * 100) > 0 ? raw : null;
  let peakIndex = -1;
  let peakCount = 0;
  let tied = false;
  for (let i = 0; i < dowCounts.length; i += 1) {
    const n = dowCounts[i] ?? 0;
    if (n > peakCount) {
      peakIndex = i;
      peakCount = n;
      tied = false;
    } else if (n === peakCount && n > 0) {
      tied = true;
    }
  }
  const peakName =
    peakIndex >= 0 && peakIndex < WEEKDAY_NAMES.length
      ? WEEKDAY_NAMES[peakIndex]
      : null;
  const peakDay = !tied && peakCount >= 2 ? peakName ?? null : null;
  return {
    weekendCount,
    weekdayCount,
    weekendShare,
    peakDay,
    peakCount: peakDay ? peakCount : 0,
  };
}

/**
 * One shop-owner sentence for the habit clock. Leads with typical wait,
 * then who to reach. Never a promise, never an email guess.
 */
export function growthTt2Read(view: GrowthTt2View): GrowthTt2Read | null {
  if (view.empty) return null;
  if (view.typicalDays != null && Number.isFinite(view.typicalDays)) {
    const days = Math.round(view.typicalDays);
    const win =
      view.winBackDay != null ? Math.round(view.winBackDay) : days + TT2_WINBACK_PAD_DAYS;
    const reach = view.reachNow;
    return {
      line:
        reach > 0
          ? `Typical wait is ${days} days. Reach the ${reach.toLocaleString()} one-order ${reach === 1 ? "buyer" : "buyers"} already past day ${win}.`
          : `Typical wait is ${days} days. Re-engage one-order buyers around day ${win} — just past typical, before the slow tail.`,
      typicalDays: days,
      reachNow: reach,
    };
  }
  if (view.oneOrderBuyers > 0) {
    return {
      line: `${view.oneOrderBuyers.toLocaleString()} one-order ${view.oneOrderBuyers === 1 ? "buyer is" : "buyers are"} still waiting on a second order. Typical wait needs 5 second orders on file — not $0.`,
      typicalDays: null,
      reachNow: view.reachNow,
    };
  }
  return {
    line: "Who came back is from this shop’s order history — not an email list.",
    typicalDays: null,
    reachNow: 0,
  };
}

export function growthTt2HistoryLine(view: GrowthTt2View): string {
  if (view.historyLimited) {
    return `On file · last ~${view.historyDays} days — not a fake year. Longer fall-off needs more history than this install shares.`;
  }
  return `Full stored book · last ~${view.historyDays} days.`;
}

/**
 * TT2 habit clock + win-back fall-off over the stored order book.
 * `historyLimited` withholds year-scale buckets — never a fake lifetime.
 */
export function buildGrowthTt2(
  rows: GrowthTt2OrderRow[],
  options: { windowEnd: Date; historyLimited: boolean },
): GrowthTt2View {
  const clean = rows.filter((r) => r && Number.isFinite(r.amount));
  const windowEndMs = ms(options.windowEnd);
  const identified = clean.filter(
    (r) => r.customerKey && r.customerKey !== TT2_GUEST_KEY,
  );

  let earliest = Number.POSITIVE_INFINITY;
  const byCustomer = new Map<
    string,
    { times: number[]; locals: Array<Date | null>; total: number }
  >();
  for (const r of identified) {
    const t = ms(r.orderedAt);
    if (t < earliest) earliest = t;
    const rec = byCustomer.get(r.customerKey) ?? {
      times: [],
      locals: [],
      total: 0,
    };
    rec.times.push(t);
    rec.locals.push(
      r.shopLocalDate instanceof Date && Number.isFinite(r.shopLocalDate.getTime())
        ? r.shopLocalDate
        : null,
    );
    rec.total += finite(r.amount);
    byCustomer.set(r.customerKey, rec);
  }

  const identifiedBuyers = byCustomer.size;
  const historyDays =
    identifiedBuyers > 0 && Number.isFinite(earliest)
      ? Math.max(1, Math.ceil((windowEndMs - earliest) / DAY_MS))
      : 0;

  const gaps: number[] = [];
  const gapCounts = new Array(TIME_BUCKETS.length).fill(0);
  const fallCounts = new Array(TIME_BUCKETS.length).fill(0);
  const dowCounts = [0, 0, 0, 0, 0, 0, 0];
  let weekendSecond = 0;
  let weekdaySecond = 0;
  let oneOrderBuyers = 0;
  let eligible30 = 0;
  let within30 = 0;
  let maturedBuyers = 0;

  for (const rec of byCustomer.values()) {
    const paired = rec.times.map((t, i) => ({
      t,
      local: rec.locals[i] ?? null,
    }));
    paired.sort((a, b) => a.t - b.t);
    const first = paired[0]!.t;
    const firstAge = (windowEndMs - first) / DAY_MS;
    if (firstAge >= TT2_MIN_FOLLOW_DAYS) maturedBuyers += 1;

    if (paired.length >= 2) {
      const second = paired[1]!;
      const gapDays = (second.t - first) / DAY_MS;
      if (gapDays >= 0 && Number.isFinite(gapDays)) {
        gaps.push(gapDays);
        placeBucket(gapDays, gapCounts);
        const dow = secondOrderDow(second.local, second.t);
        if (dow >= 0 && dow <= 6) {
          dowCounts[dow] = (dowCounts[dow] ?? 0) + 1;
          if (dow === 0 || dow === 6) weekendSecond += 1;
          else weekdaySecond += 1;
        }
      }
    } else {
      oneOrderBuyers += 1;
      placeBucket(Math.max(0, firstAge), fallCounts);
    }

    if (windowEndMs - first >= TT2_MIN_FOLLOW_DAYS * DAY_MS) {
      eligible30 += 1;
      if (paired.length >= 2) {
        const gapDays = (paired[1]!.t - first) / DAY_MS;
        if (gapDays >= 0 && gapDays <= TT2_MIN_FOLLOW_DAYS) within30 += 1;
      }
    }
  }

  const empty = growthTt2EmptyState(identifiedBuyers, maturedBuyers);
  const weekend = empty
    ? emptyWeekend()
    : sealWeekend(weekendSecond, weekdaySecond, dowCounts);
  const cadence = collectBuckets(gapCounts, historyDays);
  const waiting = collectBuckets(fallCounts, historyDays);
  const enoughGaps = gaps.length >= TT2_MIN_GAPS;
  const typical = enoughGaps ? medianOf(gaps) : null;
  const fast = enoughGaps ? percentileOf(gaps, 0.25) : null;
  const slow = enoughGaps ? percentileOf(gaps, 0.75) : null;
  const winBackDay = typical != null ? Math.round(typical) + TT2_WINBACK_PAD_DAYS : null;

  let reachNow = 0;
  if (winBackDay != null) {
    for (const rec of byCustomer.values()) {
      if (rec.times.length !== 1) continue;
      const daysSince = (windowEndMs - rec.times[0]!) / DAY_MS;
      if (daysSince > winBackDay) reachNow += 1;
    }
  }

  const within30Share =
    eligible30 >= TT2_MIN_BUYERS ? within30 / eligible30 : null;
  const habitSpanDays =
    fast != null && slow != null ? Math.max(0, slow - fast) : null;

  if (empty) {
    const zeros = emptyBuckets(historyDays);
    return {
      available: false,
      identifiedBuyers,
      maturedBuyers,
      gapCount: gaps.length,
      historyDays,
      historyLimited: options.historyLimited,
      empty,
      clockEmpty: empty,
      fastDays: null,
      typicalDays: null,
      slowDays: null,
      habitSpanDays: null,
      winBackDay: null,
      reachNow: 0,
      oneOrderBuyers,
      within30Share: null,
      within30Count: within30,
      eligible30,
      daysToSecond: zeros.buckets,
      daysToSecondTruncatedAt: options.historyLimited
        ? historyDays || zeros.truncatedAt
        : zeros.truncatedAt,
      fallOff: zeros.buckets,
      fallOffTruncatedAt: options.historyLimited
        ? historyDays || zeros.truncatedAt
        : zeros.truncatedAt,
      fallEmpty: empty,
      weekend,
    };
  }

  const daysToSecondTruncatedAt = options.historyLimited
    ? historyDays
    : cadence.truncatedAt;
  const fallOffTruncatedAt = options.historyLimited
    ? historyDays
    : waiting.truncatedAt;

  return {
    available: true,
    identifiedBuyers,
    maturedBuyers,
    gapCount: gaps.length,
    historyDays,
    historyLimited: options.historyLimited,
    empty: null,
    clockEmpty: enoughGaps ? null : clockEmptyState(identifiedBuyers),
    fastDays: fast,
    typicalDays: typical,
    slowDays: slow,
    habitSpanDays,
    winBackDay,
    reachNow,
    oneOrderBuyers,
    within30Share,
    within30Count: within30,
    eligible30,
    daysToSecond: cadence.buckets,
    daysToSecondTruncatedAt,
    fallOff: waiting.buckets,
    fallOffTruncatedAt,
    fallEmpty: oneOrderBuyers === 0 ? fallEmptyState(identifiedBuyers) : null,
    weekend,
  };
}

/** Honest zeros for pending / no-data — not a fake clock. */
export function emptyGrowthTt2(): GrowthTt2View {
  return buildGrowthTt2([], {
    windowEnd: new Date(),
    historyLimited: false,
  });
}
