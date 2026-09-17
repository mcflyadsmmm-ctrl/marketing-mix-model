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
