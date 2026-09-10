/**
 * Order-book stats Shopify Analytics does not put on Overview.
 *
 * Product contract (with `shopify-native-stats.ts`): Overview tiles are
 * computed here from OrderFact + SalesDayFact. Total ROAS is a Marketing
 * section output, not this module’s primary return.
 *
 * Level-1 only (`read_orders` + opaque customerKey). Quantity/discount/source
 * are stored as numbers/enums — never email, address, SKU, or title.
 */

import { shopLocalHour } from "./shop-local-day";

/** Matches OrderFact guest sentinel — keep this module Prisma-free. */
export const DEPTH_GUEST_KEY = "guest";

/** Withhold shop-local hour mix until this many orders exist. */
export const HOUR_STATS_MIN_ORDERS = 20;

/** First-timers need this many days of follow-up before the 30-day rate is shown. */
export const SECOND_WITHIN_DAYS = 30;
export const SECOND_WITHIN_MIN_ELIGIBLE = 10;
/** Identified buyers before 2nd vs 3rd+ mix is shown. */
export const REPEAT_DEPTH_MIN_BUYERS = 10;
export const REPEAT_DEPTH_MIN_REPEATERS = 5;
/** Repeaters before second-order $ vs first is shown. */
export const SECOND_VS_FIRST_MIN_REPEATERS = 5;
/** Closed days with sales before a typical-day median is shown. */
export const MEDIAN_DAY_MIN_DAYS = 5;

export type OrderSourceKind = "online" | "pos" | "shop" | "other";

export type OrderDepthRow = {
  customerKey: string;
  amount: number;
  orderedAt: Date;
  shopLocalDate: Date;
  discountAmount?: number | null;
  sourceName?: string | null;
  unitCount?: number | null;
};

export type OrderSourceMix = {
  online: number;
  pos: number;
  shop: number;
  other: number;
};

export type ShopifyDepthStats = {
  orderCount: number;
  meanAov: number | null;
  /** Middle order. Shopify Analytics Overview shows the mean. */
  medianAov: number | null;
  /**
   * Share of period sales from identified buyers with 2+ orders in-window.
   * Different from Shopify's returning-customer rate (lifetime headcount).
   */
  repeatSalesShare: number | null;
  /** Identified buyers with exactly one order in this window. */
  oneAndDoneShare: number | null;
  identifiedBuyers: number;
  repeatBuyers: number;
  /** Median days between 1st and 2nd order among in-window repeaters. */
  medianDaysToSecond: number | null;
  /**
   * Share of eligible first-timers with a second order within 30 days.
   * Eligible = first in-window order at least 30 days before window end.
   * Null until enough eligible buyers — never a fake 0.
   */
  secondOrderWithin30Share: number | null;
  eligibleFirstTimers: number;
  /** Identified buyers with exactly two orders in this window. */
  secondOrderBuyers: number;
  /** Identified buyers with three or more orders in this window. */
  thirdPlusBuyers: number;
  secondOrderBuyerShare: number | null;
  thirdPlusBuyerShare: number | null;
  /** Median first-order $ among in-window repeaters. */
  medianFirstOrder: number | null;
  /** Median second-order $ among in-window repeaters. */
  medianSecondOrder: number | null;
  /** Median daily Total Sales among days with sales. */
  medianDailySales: number | null;
  /** Top 10% of orders (by $) as a share of sales. */
  topDecileSalesShare: number | null;
  guestAov: number | null;
  identifiedAov: number | null;
  /**
   * Total − Net (shipping + tax + duties + fees sitting above product subtotal).
   * Shopify lists these as separate reports, not one CFO number.
   */
  shippingTaxFees: number | null;
  shippingTaxFeesPct: number | null;
  /** Share of period sales in the three biggest closed days. */
  bestThreeDayShare: number | null;
  dayCountWithSales: number;
  /**
   * Sat+Sun sales share. Null until five days have sales so a long weekend
   * cannot look like a store pattern.
   */
  weekendSalesShare: number | null;
  /**
   * Share of period sales by shop-local weekday (Sun=0). Null until five
   * days have sales — same gate as weekend share.
   */
  weekdaySalesShare: number[] | null;
  /** Index 0–6 of the weekday with the most sales $, or null. */
  peakWeekday: number | null;
  /** Identified orders ÷ identified buyers in this window. */
  ordersPerBuyer: number | null;
  /** 25th / 75th order amounts. Null until five orders. */
  aovP25: number | null;
  aovP75: number | null;
  /** Shop-local hour 0–23 with the most sales. Null until enough orders + tz. */
  peakHour: number | null;
  /** Sales share by shop-local hour. Null until the hour gate. */
  hourlySalesShare: number[] | null;
  /** Share of orders with discountAmount > 0. */
  discountedOrderShare: number | null;
  /** Mean discount $ among discounted orders. */
  meanDiscountAmount: number | null;
  /** Mean units per order. Null until enough crawled unit counts. */
  meanUnitCount: number | null;
  /** Sales share by Online / POS / Shop / other. Null until enough sources. */
  sourceSalesShare: OrderSourceMix | null;
};

function finiteAmount(n: number): number {
  return Number.isFinite(n) ? n : 0;
}

export const WEEKDAY_SHORT = [
  "Sun",
  "Mon",
  "Tue",
  "Wed",
  "Thu",
  "Fri",
  "Sat",
] as const;

export function medianOf(values: number[]): number | null {
  const sorted = values.filter((n) => Number.isFinite(n)).sort((a, b) => a - b);
  if (sorted.length === 0) return null;
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 1) return sorted[mid]!;
  return (sorted[mid - 1]! + sorted[mid]!) / 2;
}

/** Linear interpolation percentile. p is 0–1. */
export function percentileOf(values: number[], p: number): number | null {
  const sorted = values.filter((n) => Number.isFinite(n)).sort((a, b) => a - b);
  if (sorted.length === 0) return null;
  if (p <= 0) return sorted[0]!;
  if (p >= 1) return sorted[sorted.length - 1]!;
  const idx = (sorted.length - 1) * p;
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return sorted[lo]!;
  const w = idx - lo;
  return sorted[lo]! * (1 - w) + sorted[hi]! * w;
}

/**
 * Map Shopify `sourceName` to Online / POS / Shop. Draft orders and apps
 * land in other — never ad-platform attribution.
 */
export function classifyOrderSource(
  sourceName: string | null | undefined,
): OrderSourceKind {
  const s = (sourceName ?? "").trim().toLowerCase();
  if (!s) return "other";
  if (s === "pos" || s.includes("point of sale") || /\bpos\b/.test(s)) {
    return "pos";
  }
  if (s === "shop" || s === "shop_app" || s === "shop app") return "shop";
  if (
    s === "web" ||
    s === "online" ||
    s === "online_store" ||
    s.includes("online store") ||
    s === "iphone" ||
    s === "android"
  ) {
    return "online";
  }
  return "other";
}

/** Shop-local hour label: `2–3 pm`, `11 am–12 pm`. */
export function formatHourRangeLabel(hour: number): string {
  const start = hourClock(hour);
  const end = hourClock(hour + 1);
  if (start.suffix === end.suffix) {
    return `${start.h12}–${end.h12} ${end.suffix}`;
  }
  return `${start.h12} ${start.suffix}–${end.h12} ${end.suffix}`;
}

function hourClock(n: number): { h12: number; suffix: "am" | "pm" } {
  const h = ((n % 24) + 24) % 24;
  return {
    h12: h % 12 === 0 ? 12 : h % 12,
    suffix: h < 12 ? "am" : "pm",
  };
}

function dayKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function shopifyDepthStats(input: {
  orders: OrderDepthRow[];
  totalSales: number;
  netSales: number;
  netSalesKnown: boolean;
  grossSales: number;
  grossSalesKnown: boolean;
  /** IANA tz already on `buildDashboardMetrics` — no schema change. */
  timeZone?: string | null;
  /** Period end — first-timers need 30 days before this to count as eligible. */
  windowEnd?: Date | null;
}): ShopifyDepthStats {
  const orders = input.orders.filter((o) => Number.isFinite(o.amount));
  const amounts = orders.map((o) => finiteAmount(o.amount));
  const orderCount = amounts.length;
  const salesFromOrders = amounts.reduce((s, n) => s + n, 0);
  const meanAov = orderCount > 0 ? salesFromOrders / orderCount : null;
  const medianAov = medianOf(amounts);
  const aovP25 = orderCount >= 5 ? percentileOf(amounts, 0.25) : null;
  const aovP75 = orderCount >= 5 ? percentileOf(amounts, 0.75) : null;

  const identified = orders.filter((o) => o.customerKey !== DEPTH_GUEST_KEY);
  const guests = orders.filter((o) => o.customerKey === DEPTH_GUEST_KEY);
  const guestAov =
    guests.length > 0
      ? guests.reduce((s, o) => s + finiteAmount(o.amount), 0) / guests.length
      : null;
  const identifiedAov =
    identified.length > 0
      ? identified.reduce((s, o) => s + finiteAmount(o.amount), 0) /
        identified.length
      : null;

  const byCustomer = new Map<string, OrderDepthRow[]>();
  for (const o of identified) {
    const list = byCustomer.get(o.customerKey) ?? [];
    list.push(o);
    byCustomer.set(o.customerKey, list);
  }
  const identifiedBuyers = byCustomer.size;
  let repeatBuyers = 0;
  let repeatSales = 0;
  let oneAndDone = 0;
  let secondOrderBuyers = 0;
  let thirdPlusBuyers = 0;
  let eligibleFirstTimers = 0;
  let secondWithin30 = 0;
  const gaps: number[] = [];
  const firstAmounts: number[] = [];
  const secondAmounts: number[] = [];
  const windowEndMs = input.windowEnd
    ? oTime(input.windowEnd)
    : orders.reduce((max, o) => Math.max(max, oTime(o.orderedAt)), 0);
  const eligibilityMs = SECOND_WITHIN_DAYS * 86_400_000;
  for (const rows of byCustomer.values()) {
    const sorted = [...rows].sort(
      (a, b) => oTime(a.orderedAt) - oTime(b.orderedAt),
    );
    const sales = sorted.reduce((s, r) => s + amountOf(r), 0);
    const first = sorted[0]!;
    if (sorted.length >= 2) {
      repeatBuyers += 1;
      repeatSales += sales;
      const second = sorted[1]!;
      const days =
        (oTime(second.orderedAt) - oTime(first.orderedAt)) / 86_400_000;
      if (days >= 0 && Number.isFinite(days)) gaps.push(days);
      firstAmounts.push(amountOf(first));
      secondAmounts.push(amountOf(second));
      if (sorted.length === 2) secondOrderBuyers += 1;
      else thirdPlusBuyers += 1;
    } else {
      oneAndDone += 1;
    }
    if (
      windowEndMs > 0 &&
      windowEndMs - oTime(first.orderedAt) >= eligibilityMs
    ) {
      eligibleFirstTimers += 1;
      if (sorted.length >= 2) {
        const days =
          (oTime(sorted[1]!.orderedAt) - oTime(first.orderedAt)) /
          86_400_000;
        if (days >= 0 && days <= SECOND_WITHIN_DAYS) secondWithin30 += 1;
      }
    }
  }

  const denomSales = salesFromOrders > 0 ? salesFromOrders : 0;
  const repeatSalesShare =
    identifiedBuyers > 0 && denomSales > 0 ? repeatSales / denomSales : null;
  const oneAndDoneShare =
    identifiedBuyers > 0 ? oneAndDone / identifiedBuyers : null;
  const medianDaysToSecond = medianOf(gaps);
  const secondOrderWithin30Share =
    eligibleFirstTimers >= SECOND_WITHIN_MIN_ELIGIBLE
      ? secondWithin30 / eligibleFirstTimers
      : null;
  const showRepeatDepth =
    identifiedBuyers >= REPEAT_DEPTH_MIN_BUYERS &&
    repeatBuyers >= REPEAT_DEPTH_MIN_REPEATERS;
  const secondOrderBuyerShare = showRepeatDepth
    ? secondOrderBuyers / identifiedBuyers
    : null;
  const thirdPlusBuyerShare = showRepeatDepth
    ? thirdPlusBuyers / identifiedBuyers
    : null;
  const medianFirstOrder =
    repeatBuyers >= SECOND_VS_FIRST_MIN_REPEATERS
      ? medianOf(firstAmounts)
      : null;
  const medianSecondOrder =
    repeatBuyers >= SECOND_VS_FIRST_MIN_REPEATERS
      ? medianOf(secondAmounts)
      : null;

  let topDecileSalesShare: number | null = null;
  if (orderCount >= 10 && denomSales > 0) {
    const desc = [...amounts].sort((a, b) => b - a);
    const n = Math.max(1, Math.floor(orderCount * 0.1));
    const top = desc.slice(0, n).reduce((s, n) => s + n, 0);
    topDecileSalesShare = top / denomSales;
  }

  const totalSales = finiteAmount(input.totalSales);
  const net = finiteAmount(input.netSales);
  const shippingTaxFees =
    input.netSalesKnown && totalSales > net && net >= 0
      ? totalSales - net
      : null;
  const shippingTaxFeesPct =
    shippingTaxFees != null && totalSales > 0
      ? shippingTaxFees / totalSales
      : null;

  const byDay = new Map<string, number>();
  for (const o of orders) {
    const key = dayKey(o.shopLocalDate);
    byDay.set(key, (byDay.get(key) ?? 0) + finiteAmount(o.amount));
  }
  const dayTotals = [...byDay.values()].filter((n) => n > 0);
  const dayCountWithSales = dayTotals.length;
  const medianDailySales =
    dayCountWithSales >= MEDIAN_DAY_MIN_DAYS ? medianOf(dayTotals) : null;
  let bestThreeDayShare: number | null = null;
  if (dayCountWithSales >= 5 && denomSales > 0) {
    const top3 = [...dayTotals]
      .sort((a, b) => b - a)
      .slice(0, 3)
      .reduce((s, n) => s + n, 0);
    bestThreeDayShare = top3 / denomSales;
  }

  const weekdayTotals = [0, 0, 0, 0, 0, 0, 0];
  let weekendSales = 0;
  for (const o of orders) {
    const dow = o.shopLocalDate.getUTCDay();
    if (dow < 0 || dow > 6) continue;
    const amt = finiteAmount(o.amount);
    weekdayTotals[dow]! += amt;
    if (dow === 0 || dow === 6) weekendSales += amt;
  }
  const weekendSalesShare =
    dayCountWithSales >= 5 && denomSales > 0
      ? weekendSales / denomSales
      : null;
  const weekdaySalesShare =
    dayCountWithSales >= 5 && denomSales > 0
      ? weekdayTotals.map((n) => n / denomSales)
      : null;
  let peakWeekday: number | null = null;
  if (weekdaySalesShare) {
    peakWeekday = 0;
    for (let i = 1; i < 7; i += 1) {
      if (weekdayTotals[i]! > weekdayTotals[peakWeekday]!) peakWeekday = i;
    }
  }
  const identifiedOrderCount = identified.length;
  const ordersPerBuyer =
    identifiedBuyers > 0 ? identifiedOrderCount / identifiedBuyers : null;

  const timeZone = input.timeZone?.trim() || null;
  const hourTotals = Array.from({ length: 24 }, () => 0);
  if (timeZone) {
    for (const o of orders) {
      const hour = shopLocalHour(o.orderedAt, timeZone);
      hourTotals[hour]! += finiteAmount(o.amount);
    }
  }
  let peakHour: number | null = null;
  let hourlySalesShare: number[] | null = null;
  if (timeZone && orderCount >= HOUR_STATS_MIN_ORDERS && denomSales > 0) {
    hourlySalesShare = hourTotals.map((n) => n / denomSales);
    peakHour = 0;
    for (let i = 1; i < 24; i += 1) {
      if (hourTotals[i]! > hourTotals[peakHour]!) peakHour = i;
    }
  }

  const crawledDiscounts = orders.filter(
    (o) => o.discountAmount != null && Number.isFinite(o.discountAmount),
  );
  let discountedOrderShare: number | null = null;
  let meanDiscountAmount: number | null = null;
  if (crawledDiscounts.length >= 5) {
    const discounted = crawledDiscounts.filter(
      (o) => finiteAmount(o.discountAmount ?? 0) > 0,
    );
    discountedOrderShare = discounted.length / crawledDiscounts.length;
    meanDiscountAmount =
      discounted.length > 0
        ? discounted.reduce((s, o) => s + finiteAmount(o.discountAmount ?? 0), 0) /
          discounted.length
        : 0;
  }

  const crawledUnits = orders.filter(
    (o) => o.unitCount != null && Number.isFinite(o.unitCount) && o.unitCount >= 0,
  );
  const meanUnitCount =
    crawledUnits.length >= 5
      ? crawledUnits.reduce((s, o) => s + (o.unitCount ?? 0), 0) /
        crawledUnits.length
      : null;

  const crawledSources = orders.filter(
    (o) => (o.sourceName ?? "").trim().length > 0,
  );
  let sourceSalesShare: OrderSourceMix | null = null;
  if (crawledSources.length >= 8 && denomSales > 0) {
    const mix: OrderSourceMix = { online: 0, pos: 0, shop: 0, other: 0 };
    for (const o of crawledSources) {
      mix[classifyOrderSource(o.sourceName)] += finiteAmount(o.amount);
    }
    const sourceSales = crawledSources.reduce(
      (s, o) => s + finiteAmount(o.amount),
      0,
    );
    if (sourceSales > 0) {
      sourceSalesShare = {
        online: mix.online / sourceSales,
        pos: mix.pos / sourceSales,
        shop: mix.shop / sourceSales,
        other: mix.other / sourceSales,
      };
    }
  }

  return {
    orderCount,
    meanAov,
    medianAov,
    repeatSalesShare,
    oneAndDoneShare,
    identifiedBuyers,
    repeatBuyers,
    medianDaysToSecond,
    secondOrderWithin30Share,
    eligibleFirstTimers,
    secondOrderBuyers,
    thirdPlusBuyers,
    secondOrderBuyerShare,
    thirdPlusBuyerShare,
    medianFirstOrder,
    medianSecondOrder,
    medianDailySales,
    topDecileSalesShare,
    guestAov,
    identifiedAov,
    shippingTaxFees,
    shippingTaxFeesPct,
    bestThreeDayShare,
    dayCountWithSales,
    weekendSalesShare,
    weekdaySalesShare,
    peakWeekday,
    ordersPerBuyer,
    aovP25,
    aovP75,
    peakHour,
    hourlySalesShare,
    discountedOrderShare,
    meanDiscountAmount,
    meanUnitCount,
    sourceSalesShare,
  };
}

function oTime(d: Date): number {
  return d instanceof Date ? d.getTime() : new Date(d).getTime();
}

function amountOf(row: OrderDepthRow): number {
  return finiteAmount(row.amount);
}
