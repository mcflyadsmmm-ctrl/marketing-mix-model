/**
 * Buyer-level cohort depth Shopify Analytics under-delivers:
 * maturity-gated 2nd-purchase rates, median days-to-2nd, first vs subsequent $.
 * Pure — callers pass OrderFact-shaped rows (live or SAMPLE).
 */

export type BuyerOrderFactLike = {
  buyerKey: string;
  orderAt: Date | string;
  netSales: number;
  lifetimeOrderRank: number;
};

export type CohortBuyerRow = {
  monthKey: string;
  buyers: number;
  mature30: number;
  mature60: number;
  mature90: number;
  secondWithin30: number | null;
  secondWithin60: number | null;
  secondWithin90: number | null;
  medianDaysToSecond: number | null;
  firstOrderRevenue: number;
  subsequentRevenue: number;
  firstOrderRevenueShare: number | null;
};

export type BuyerRepeatSummary = {
  buyers: number;
  secondWithin30: number | null;
  secondWithin60: number | null;
  secondWithin90: number | null;
  medianDaysToSecond: number | null;
  firstOrderRevenue: number;
  subsequentRevenue: number;
  firstOrderRevenueShare: number | null;
  subsequentRevenueShare: number | null;
};

export type PeriodOrderMix = {
  firstOrderRevenue: number;
  subsequentRevenue: number;
  firstOrderRevenueShare: number | null;
  subsequentRevenueShare: number | null;
  firstOrderCount: number;
  subsequentOrderCount: number;
};

const DAY_MS = 86_400_000;
const GUEST = "guest";

function asDate(value: Date | string): Date {
  return value instanceof Date ? value : new Date(value);
}

function monthKeyFromDate(d: Date): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

function medianSorted(nums: number[]): number | null {
  if (nums.length === 0) return null;
  const mid = Math.floor(nums.length / 2);
  if (nums.length % 2 === 1) return nums[mid]!;
  return (nums[mid - 1]! + nums[mid]!) / 2;
}

function share(part: number, total: number): number | null {
  if (!(total > 0)) return null;
  return part / total;
}

type BuyerBucket = {
  firstAt: Date;
  secondAt: Date | null;
  firstNet: number;
  subsequentNet: number;
};

function buildBuyerBuckets(orders: BuyerOrderFactLike[]): Map<string, BuyerBucket> {
  const byBuyer = new Map<string, BuyerOrderFactLike[]>();
  for (const o of orders) {
    if (!o.buyerKey || o.buyerKey === GUEST) continue;
    const list = byBuyer.get(o.buyerKey) ?? [];
    list.push(o);
    byBuyer.set(o.buyerKey, list);
  }

  const buckets = new Map<string, BuyerBucket>();
  for (const [buyerKey, list] of byBuyer) {
    list.sort((a, b) => {
      const ta = asDate(a.orderAt).getTime();
      const tb = asDate(b.orderAt).getTime();
      if (ta !== tb) return ta - tb;
      return a.lifetimeOrderRank - b.lifetimeOrderRank;
    });
    const first = list[0]!;
    const second = list[1] ?? null;
    let subsequentNet = 0;
    for (let i = 1; i < list.length; i++) subsequentNet += list[i]!.netSales;
    buckets.set(buyerKey, {
      firstAt: asDate(first.orderAt),
      secondAt: second ? asDate(second.orderAt) : null,
      firstNet: first.netSales,
      subsequentNet,
    });
  }
  return buckets;
}

function rateAmongMature(
  buyers: BuyerBucket[],
  asOf: Date,
  windowDays: number,
): number | null {
  const cutoff = asOf.getTime() - windowDays * DAY_MS;
  const mature = buyers.filter((b) => b.firstAt.getTime() <= cutoff);
  if (mature.length === 0) return null;
  const hit = mature.filter((b) => {
    if (!b.secondAt) return false;
    const gap = (b.secondAt.getTime() - b.firstAt.getTime()) / DAY_MS;
    return gap <= windowDays;
  }).length;
  return hit / mature.length;
}

/**
 * Per acquisition-month rows for Customers & LTV table depth.
 */
export function computeCohortBuyerMetrics(
  orders: BuyerOrderFactLike[],
  asOf: Date = new Date(),
): CohortBuyerRow[] {
  const buckets = buildBuyerBuckets(orders);
  const byMonth = new Map<string, BuyerBucket[]>();
  for (const b of buckets.values()) {
    const mk = monthKeyFromDate(b.firstAt);
    const list = byMonth.get(mk) ?? [];
    list.push(b);
    byMonth.set(mk, list);
  }

  const rows: CohortBuyerRow[] = [];
  for (const [monthKey, buyers] of [...byMonth.entries()].sort((a, b) =>
    a[0] < b[0] ? 1 : -1,
  )) {
    const cutoff30 = asOf.getTime() - 30 * DAY_MS;
    const cutoff60 = asOf.getTime() - 60 * DAY_MS;
    const cutoff90 = asOf.getTime() - 90 * DAY_MS;
    const mature30 = buyers.filter((b) => b.firstAt.getTime() <= cutoff30).length;
    const mature60 = buyers.filter((b) => b.firstAt.getTime() <= cutoff60).length;
    const mature90 = buyers.filter((b) => b.firstAt.getTime() <= cutoff90).length;

    const daysToSecond: number[] = [];
    let firstOrderRevenue = 0;
    let subsequentRevenue = 0;
    for (const b of buyers) {
      firstOrderRevenue += b.firstNet;
      subsequentRevenue += b.subsequentNet;
      if (b.secondAt) {
        daysToSecond.push((b.secondAt.getTime() - b.firstAt.getTime()) / DAY_MS);
      }
    }
    daysToSecond.sort((a, b) => a - b);
    const totalRev = firstOrderRevenue + subsequentRevenue;

    rows.push({
      monthKey,
      buyers: buyers.length,
      mature30,
      mature60,
      mature90,
      secondWithin30: rateAmongMature(buyers, asOf, 30),
      secondWithin60: rateAmongMature(buyers, asOf, 60),
      secondWithin90: rateAmongMature(buyers, asOf, 90),
      medianDaysToSecond: medianSorted(daysToSecond),
      firstOrderRevenue,
      subsequentRevenue,
      firstOrderRevenueShare: share(firstOrderRevenue, totalRev),
    });
  }
  return rows;
}

/**
 * Store-wide buyer repeat summary (all non-guest buyers in the fact set).
 */
export function summarizeBuyerRepeat(
  orders: BuyerOrderFactLike[],
  asOf: Date = new Date(),
): BuyerRepeatSummary {
  const buckets = [...buildBuyerBuckets(orders).values()];
  let firstOrderRevenue = 0;
  let subsequentRevenue = 0;
  const daysToSecond: number[] = [];
  for (const b of buckets) {
    firstOrderRevenue += b.firstNet;
    subsequentRevenue += b.subsequentNet;
    if (b.secondAt) {
      daysToSecond.push((b.secondAt.getTime() - b.firstAt.getTime()) / DAY_MS);
    }
  }
  daysToSecond.sort((a, c) => a - c);
  const totalRev = firstOrderRevenue + subsequentRevenue;
  return {
    buyers: buckets.length,
    secondWithin30: rateAmongMature(buckets, asOf, 30),
    secondWithin60: rateAmongMature(buckets, asOf, 60),
    secondWithin90: rateAmongMature(buckets, asOf, 90),
    medianDaysToSecond: medianSorted(daysToSecond),
    firstOrderRevenue,
    subsequentRevenue,
    firstOrderRevenueShare: share(firstOrderRevenue, totalRev),
    subsequentRevenueShare: share(subsequentRevenue, totalRev),
  };
}

/**
 * Period revenue mix by lifetime order rank (1st order vs 2nd+), not Shopify
 * period returning-customer flag.
 */
export function periodFirstVsRepeatRevenue(
  periodOrders: BuyerOrderFactLike[],
): PeriodOrderMix {
  let firstOrderRevenue = 0;
  let subsequentRevenue = 0;
  let firstOrderCount = 0;
  let subsequentOrderCount = 0;
  for (const o of periodOrders) {
    if (!o.buyerKey || o.buyerKey === GUEST) continue;
    if (o.lifetimeOrderRank <= 1) {
      firstOrderRevenue += o.netSales;
      firstOrderCount += 1;
    } else {
      subsequentRevenue += o.netSales;
      subsequentOrderCount += 1;
    }
  }
  const total = firstOrderRevenue + subsequentRevenue;
  return {
    firstOrderRevenue,
    subsequentRevenue,
    firstOrderRevenueShare: share(firstOrderRevenue, total),
    subsequentRevenueShare: share(subsequentRevenue, total),
    firstOrderCount,
    subsequentOrderCount,
  };
}

export function formatSecondOrderRate(rate: number | null): string {
  if (rate == null) return "—";
  return `${Math.round(rate * 1000) / 10}%`;
}

export function formatMedianDays(days: number | null): string {
  if (days == null) return "—";
  if (days < 1) return "<1 day";
  if (days < 10) return `${Math.round(days * 10) / 10} days`;
  return `${Math.round(days)} days`;
}
