/**
 * Growth tab — order-history retention, no spend, no ROAS.
 *
 * Shopify Analytics Overview shows a returning-customer rate (headcount).
 * Growth answers a different question from the order book: who came back,
 * how fast, and how far past a first order — first-time dollars, days to a
 * second order, the 30-day come-back rate, and repeat depth.
 *
 * Pure helpers only (Prisma-free) so the numbers are unit-tested away from
 * the loader. Inputs are `ShopifyDepthStats` — order-book depth over the
 * trailing come-back window.
 */

import type { ShopifyDepthStats } from "./shopify-depth-stats";

/** Trailing order-history window the come-back stats read (days). */
export const GROWTH_COMEBACK_WINDOW_DAYS = 90;

/** Whole percents in merchant chrome — 42%, never 42.0%. */
export function growthWholePct(share: number): string {
  return `${Math.round(share * 100)}%`;
}

/** Customers-analytics come-back window. Growth quotes this, not the full book. */
export type QuotedComebackWindow = {
  historyDays: number;
  within30Share: number | null;
  within30Count: number;
  eligible30: number;
  winBackDay: number | null;
  saveNowOneOrder: number;
};

export function quotedWithin30Line(q: QuotedComebackWindow): string {
  const window = `last ~${Math.round(q.historyDays)} days`;
  if (
    q.eligible30 > 0 &&
    q.within30Share != null &&
    Number.isFinite(q.within30Share)
  ) {
    return `${growthWholePct(q.within30Share)} came back ≤30d · ${window} · ${q.within30Count.toLocaleString()} of ${q.eligible30.toLocaleString()} eligible`;
  }
  return `Came back ≤30d · ${window} needs 30 days of follow-up — not zero.`;
}

export function quotedReachSub(q: QuotedComebackWindow): string {
  const day =
    q.winBackDay != null && Number.isFinite(q.winBackDay)
      ? `past day ${Math.round(q.winBackDay)}`
      : "past win-back";
  return `one-order buyers ${day} · last ~${Math.round(q.historyDays)} days`;
}

function isNum(n: number | null | undefined): n is number {
  return n != null && Number.isFinite(n);
}

/** A share worth a bar — one that rounds to at least 1%. */
function hasShare(share: number | null | undefined): share is number {
  return isNum(share) && Math.round(share * 100) > 0;
}

/** One horizontal bar in a growth chart — dense, drillable, honest. */
export type GrowthBar = {
  label: string;
  value: string;
  share: number;
  detail: string;
};

/** Explorer grain — come-back depth, or first-order months rolled to a quarter. */
export type GrowthExplorerGrain = "depth" | "month" | "quarter";

/** Slim first-order-month row — Prisma-free so the explorer unit-tests. */
export type GrowthCohortInput = {
  cohortMonth: string;
  customers: number;
  revenueD30: number;
  ordersD90: number;
};

/**
 * One first-order-month (or quarter) column on the Growth explorer.
 * Bars are first-30-day dollars from that first-order group; the line is extra
 * orders in the first 90 days per new buyer — who came back, not an email list.
 */
export type GrowthMonthBar = {
  key: string;
  label: string;
  year: number;
  quarter: number;
  firstTimeBuyers: number;
  first30Dollars: number;
  extraOrders90: number;
  /** Extra first-90-day orders per new buyer. Null when no buyers. */
  extraOrderRate: number | null;
};

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
] as const;

/** "2026-09" → "Sep '26" for merchant chrome — never a raw ISO dump. */
export function growthMonthLabel(monthKey: string): string {
  const parsed = parseMonthKey(monthKey);
  if (!parsed) return monthKey;
  const name = MONTH_ABBR[parsed.month - 1];
  return name ? `${name} '${String(parsed.year).slice(2)}` : monthKey;
}

function parseMonthKey(
  monthKey: string,
): { year: number; month: number } | null {
  const match = monthKey.match(/^(\d{4})-(\d{2})$/);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  if (!Number.isFinite(year) || month < 1 || month > 12) return null;
  return { year, month };
}

function quarterOf(month: number): number {
  return Math.ceil(month / 3);
}

function extraOrderRate(
  extraOrders90: number,
  firstTimeBuyers: number,
): number | null {
  if (!(firstTimeBuyers > 0)) return null;
  return extraOrders90 / firstTimeBuyers;
}

/**
 * First-order months for the explorer — oldest → newest, empty months dropped.
 * Extra orders = first-90-day orders minus the first order (who came back).
 */
export function growthFirstOrderMonths(
  cohorts: GrowthCohortInput[],
): GrowthMonthBar[] {
  const bars: GrowthMonthBar[] = [];
  for (const row of cohorts) {
    const parsed = parseMonthKey(row.cohortMonth);
    if (!parsed) continue;
    const buyers = Number.isFinite(row.customers)
      ? Math.max(0, Math.trunc(row.customers))
      : 0;
    if (buyers <= 0) continue;
    const first30 = Number.isFinite(row.revenueD30)
      ? Math.max(0, row.revenueD30)
      : 0;
    const orders90 = Number.isFinite(row.ordersD90)
      ? Math.max(0, row.ordersD90)
      : 0;
    const extra = Math.max(0, orders90 - buyers);
    bars.push({
      key: row.cohortMonth,
      label: growthMonthLabel(row.cohortMonth),
      year: parsed.year,
      quarter: quarterOf(parsed.month),
      firstTimeBuyers: buyers,
      first30Dollars: first30,
      extraOrders90: extra,
      extraOrderRate: extraOrderRate(extra, buyers),
    });
  }
  return bars.sort((a, b) => a.key.localeCompare(b.key));
}

/**
 * Roll first-order months to the explorer grain. Quarter groups by calendar
 * quarter (UTC month key). Pure — the chart formats money.
 */
export function growthBucketMonths(
  months: GrowthMonthBar[],
  grain: "month" | "quarter",
): GrowthMonthBar[] {
  switch (grain) {
    case "month":
      return months;
    case "quarter": {
      const byQ = new Map<string, GrowthMonthBar>();
      for (const row of months) {
        const key = `Q:${row.year}-${row.quarter}`;
        const existing = byQ.get(key);
        if (!existing) {
          byQ.set(key, {
            key,
            label: `Q${row.quarter} '${String(row.year).slice(2)}`,
            year: row.year,
            quarter: row.quarter,
            firstTimeBuyers: row.firstTimeBuyers,
            first30Dollars: row.first30Dollars,
            extraOrders90: row.extraOrders90,
            extraOrderRate: null,
          });
          continue;
        }
        existing.firstTimeBuyers += row.firstTimeBuyers;
        existing.first30Dollars += row.first30Dollars;
        existing.extraOrders90 += row.extraOrders90;
      }
      return [...byQ.values()]
        .sort((a, b) => a.year - b.year || a.quarter - b.quarter)
        .map((row) => ({
          ...row,
          extraOrderRate: extraOrderRate(row.extraOrders90, row.firstTimeBuyers),
        }));
    }
    default: {
      const _never: never = grain;
      return _never;
    }
  }
}

/** Buyer-weighted extra-order rate across first-order months. */
export function growthExtraOrderAvg(
  months: GrowthMonthBar[],
): number | null {
  let buyers = 0;
  let extra = 0;
  for (const row of months) {
    buyers += row.firstTimeBuyers;
    extra += row.extraOrders90;
  }
  return extraOrderRate(extra, buyers);
}

export type GrowthGrainReady = {
  depth: boolean;
  month: boolean;
  quarter: boolean;
};

/** Two real columns make a plot; one bar is not a funnel or a trend. */
export function growthGrainReady(input: {
  depthBars: GrowthBar[];
  months: GrowthMonthBar[];
}): GrowthGrainReady {
  const depth = input.depthBars.filter(
    (bar) => Number.isFinite(bar.share) && bar.share > 0,
  ).length >= 2;
  const month = input.months.length >= 2;
  const quarter = growthBucketMonths(input.months, "quarter").length >= 2;
  return { depth, month, quarter };
}

export function growthExplorerHasPlot(ready: GrowthGrainReady): boolean {
  return ready.depth || ready.month || ready.quarter;
}

/** Prefer the time-series (new dollars + who came back) when it has two columns. */
export function growthDefaultGrain(ready: GrowthGrainReady): GrowthExplorerGrain {
  if (ready.month) return "month";
  if (ready.quarter) return "quarter";
  if (ready.depth) return "depth";
  return "depth";
}

export function growthResolveGrain(
  wanted: GrowthExplorerGrain,
  ready: GrowthGrainReady,
): GrowthExplorerGrain {
  switch (wanted) {
    case "month":
      if (ready.month) return "month";
      break;
    case "quarter":
      if (ready.quarter) return "quarter";
      break;
    case "depth":
      if (ready.depth) return "depth";
      break;
    default: {
      const _never: never = wanted;
      return _never;
    }
  }
  return growthDefaultGrain(ready);
}

/**
 * Order-depth funnel — how many orders each identified buyer placed in the
 * come-back window, as a share of identified buyers (one denominator).
 * One order → two orders → three or more. Empty until repeat depth is real.
 */
export function growthOrderDepthBars(depth: ShopifyDepthStats): GrowthBar[] {
  const bars: GrowthBar[] = [];
  const oneCount = Math.max(0, depth.identifiedBuyers - depth.repeatBuyers);
  if (hasShare(depth.oneAndDoneShare)) {
    bars.push({
      label: "One order",
      value: growthWholePct(depth.oneAndDoneShare),
      share: depth.oneAndDoneShare,
      detail: `${oneCount.toLocaleString()} identified buyers ordered once in this window.`,
    });
  }
  if (hasShare(depth.secondOrderBuyerShare)) {
    bars.push({
      label: "Two orders",
      value: growthWholePct(depth.secondOrderBuyerShare),
      share: depth.secondOrderBuyerShare,
      detail: `${depth.secondOrderBuyers.toLocaleString()} identified buyers stopped at a second order.`,
    });
  }
  if (hasShare(depth.thirdPlusBuyerShare)) {
    bars.push({
      label: "Three or more",
      value: growthWholePct(depth.thirdPlusBuyerShare),
      share: depth.thirdPlusBuyerShare,
      detail: `${depth.thirdPlusBuyers.toLocaleString()} identified buyers ordered three or more times.`,
    });
  }
  return bars;
}

export type GrowthSecondVsFirst = {
  first: number;
  second: number;
  /** Second-order median as a share of the first (1.12 = 12% larger). */
  ratio: number;
  deltaPct: number;
  direction: "up" | "down" | "even";
};

/**
 * Typical second order vs typical first, among buyers with a second order.
 * A bigger second order says the first purchase was a door, not the ceiling.
 */
export function growthSecondVsFirst(
  depth: ShopifyDepthStats,
): GrowthSecondVsFirst | null {
  if (!isNum(depth.medianFirstOrder) || !isNum(depth.medianSecondOrder)) {
    return null;
  }
  const first = depth.medianFirstOrder;
  const second = depth.medianSecondOrder;
  if (!(first > 0)) return null;
  const ratio = second / first;
  const deltaPct = Math.round((ratio - 1) * 100);
  const direction = deltaPct > 0 ? "up" : deltaPct < 0 ? "down" : "even";
  return { first, second, ratio, deltaPct, direction };
}

/**
 * One shop-owner sentence for the come-back story. Order facts only — never
 * an AI analyst, never a promise. Leads with the 30-day come-back rate, then
 * the typical wait, then repeat depth; adds the second-order lift when known.
 */
export function growthComebackSentence(
  depth: ShopifyDepthStats,
  repeatRate: number | null,
): string {
  const lead = comebackLead(depth, repeatRate);
  const cmp = growthSecondVsFirst(depth);
  if (cmp && cmp.direction !== "even") {
    const sign = cmp.deltaPct > 0 ? "+" : "";
    const word = cmp.direction === "up" ? "larger" : "smaller";
    return `${lead} The typical second order runs ${sign}${cmp.deltaPct}% (${word} than the first).`;
  }
  return lead;
}

function comebackLead(
  depth: ShopifyDepthStats,
  repeatRate: number | null,
): string {
  if (hasShare(depth.secondOrderWithin30Share)) {
    return `${growthWholePct(depth.secondOrderWithin30Share)} of first-time buyers came back within 30 days.`;
  }
  if (isNum(depth.medianDaysToSecond)) {
    return `Typical wait to a second order was ${Math.round(depth.medianDaysToSecond)} days.`;
  }
  if (hasShare(depth.thirdPlusBuyerShare)) {
    return `${growthWholePct(depth.thirdPlusBuyerShare)} of identified buyers ordered three or more times.`;
  }
  if (isNum(repeatRate) && Math.round(repeatRate * 100) > 0) {
    return `Repeat orders add ${growthWholePct(repeatRate)} on top of first orders in the first 90 days.`;
  }
  return "Who came back is from this shop’s order history — not an email list.";
}

function moneyLooksZero(text: string): boolean {
  const matches = text.match(/[$£€]\s*0(?:[.,]0+)?(?!\d)/g);
  return matches != null && matches.length > 0;
}

/**
 * Copyable stand-up: first-time Shopify Total Sales this period, plus 2nd vs
 * 3rd when both shares seal, plus reach-now. Never copy $0. Never copy a
 * pending window as finished.
 */
export function growthStandupCopyText(input: {
  salesPending: boolean;
  newSales: number | null | undefined;
  money: (n: number) => string;
  secondShare: number | null | undefined;
  thirdShare: number | null | undefined;
  reachNow: number | null | undefined;
  clockAvailable: boolean;
}): string | null {
  if (input.salesPending) return null;
  const sales = input.newSales;
  if (sales == null || !Number.isFinite(sales) || !(sales > 0)) return null;
  const money = input.money(sales).trim();
  if (!money || money === "—" || money === "-") return null;
  if (moneyLooksZero(money)) return null;
  const parts = [`First-time Shopify Total Sales this period is ${money}.`];
  if (isNum(input.secondShare) && isNum(input.thirdShare)) {
    parts.push(
      `2nd ${growthWholePct(input.secondShare)} · 3rd+ ${growthWholePct(input.thirdShare)}.`,
    );
  }
  if (input.clockAvailable && input.reachNow != null && Number.isFinite(input.reachNow)) {
    const n = Math.max(0, Math.trunc(input.reachNow));
    parts.push(
      `Reach ${n.toLocaleString()} one-order ${n === 1 ? "buyer" : "buyers"} already past win-back.`,
    );
  }
  const text = parts.join(" ");
  if (moneyLooksZero(text)) return null;
  return text;
}
