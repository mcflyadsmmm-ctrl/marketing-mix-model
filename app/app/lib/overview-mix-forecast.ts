/**
 * Overview new-vs-returning $ mix + order-based month-close peek.
 *
 * Shopify Analytics Overview shows a returning-customer *rate* (headcount).
 * This board is dollars: new $ vs returning $ in the window, then a month
 * close written out as so far + remaining days × typical day. Typical day
 * is the median of stored days with sales — the full book when
 * `read_all_orders` has filled it. Order history only — no black box.
 *
 * Thin shops stay honest empties (syncing / thin / young). Floor is 8
 * orders for the mix and 8 days with sales for the typical day. Never a
 * blank chart, never $0, never a fake year of pace.
 *
 * Pure + Prisma-free so it unit-tests away from the loader.
 */

import { medianOf } from "./shopify-depth-stats";

export const MIX_MIN_ORDERS = 8;
/** Same 8-day floor as mix — typical day needs a pattern, not one spike. */
export const FORECAST_MIN_DAYS = 8;

export const OVERVIEW_MIX_FORMULA_EQ =
  "Month close = so far + remaining days × typical day";

export const OVERVIEW_MIX_FORMULA_CLOSED =
  "Month close = so far — this month is done, not a pace.";

export type OverviewMixEmptyKind = "syncing" | "thin" | "young";

export type OverviewMixEmpty = {
  kind: OverviewMixEmptyKind;
  orders: number;
  days: number;
  need: number;
  copy: string;
  verb: string;
};

export type OverviewMixSplit = {
  newSales: number;
  returningSales: number;
  newShare: number;
  returningShare: number;
};

export type OverviewMonthClose = {
  soFar: number;
  typicalDay: number;
  remainingDays: number;
  daysElapsed: number;
  daysInMonth: number;
  projected: number;
  closed: boolean;
  formulaEq: string;
  formulaPlug: string;
};

export type OverviewMixForecastView = {
  available: boolean;
  empty: OverviewMixEmpty | null;
  forecastEmpty: OverviewMixEmpty | null;
  mix: OverviewMixSplit | null;
  forecast: OverviewMonthClose | null;
  historyLimited: boolean;
  historyDays: number;
  orderCount: number;
  factDays: number;
};

export type OverviewMixForecastRead = {
  line: string;
  returningShare: number | null;
  projected: number | null;
};

export type OverviewMixForecastInput = {
  salesPending: boolean;
  orderCount: number;
  windowNewSales: number | null;
  windowReturningSales: number | null;
  mtdSales: number;
  dailySales: number[];
  daysElapsed: number;
  daysInMonth: number;
  remainingDays: number;
  historyLimited: boolean;
  historyDays: number;
};

const DAY_MS = 86_400_000;

function finite(n: number | null | undefined): number {
  return n != null && Number.isFinite(n) ? n : 0;
}

function whole(n: number): string {
  return Math.round(n).toLocaleString("en-US");
}

function daysInCalendarMonth(year: number, monthIndex: number): number {
  return new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
}

/**
 * Shop-local month clock for the month-close formula. Remaining days are
 * the days after today — today's sales sit in so-far, not in the pace.
 */
export function overviewMonthClock(
  year: number,
  month: number,
  day: number,
): { daysElapsed: number; daysInMonth: number; remainingDays: number } {
  const daysInMonth = daysInCalendarMonth(year, month - 1);
  const daysElapsed = Math.min(Math.max(day, 1), daysInMonth);
  return {
    daysElapsed,
    daysInMonth,
    remainingDays: Math.max(0, daysInMonth - daysElapsed),
  };
}

/** Inclusive day span from YYYY-MM-DD keys. One day on file is 1, not 0. */
export function overviewHistoryDays(
  fromKey: string | null,
  toKey: string | null,
): number {
  if (!fromKey || !toKey) return 0;
  const a = Date.parse(`${fromKey}T00:00:00Z`);
  const b = Date.parse(`${toKey}T00:00:00Z`);
  if (!Number.isFinite(a) || !Number.isFinite(b) || b < a) return 0;
  return Math.max(1, Math.round((b - a) / DAY_MS) + 1);
}

/** MTD so-far from stored daily sales whose key is in the shop-local month. */
export function overviewMtdFromDays(
  days: Array<{ dateKey: string; sales: number }>,
  monthPrefix: string,
): number {
  let sum = 0;
  for (const day of days) {
    if (!day.dateKey.startsWith(monthPrefix)) continue;
    const sales = finite(day.sales);
    if (sales > 0) sum += sales;
  }
  return sum;
}

/**
 * Median of stored days with sales. Withheld until {@link FORECAST_MIN_DAYS}
 * so one loud day cannot look like a shop pattern.
 */
export function overviewTypicalDayFromBook(
  dailySales: number[],
  minDays: number = FORECAST_MIN_DAYS,
): number | null {
  const clean = dailySales.filter((n) => Number.isFinite(n) && n > 0);
  if (clean.length < minDays) return null;
  return medianOf(clean);
}

export function overviewMixSplit(
  newSales: number | null,
  returningSales: number | null,
): OverviewMixSplit | null {
  const next = finite(newSales);
  const back = finite(returningSales);
  const total = next + back;
  if (!(total > 0)) return null;
  return {
    newSales: next,
    returningSales: back,
    newShare: next / total,
    returningShare: back / total,
  };
}

/**
 * First-win empty when the mix has not sealed. Syncing / thin / young —
 * not $0, not a blank chart. Floor is 8 orders with a new-vs-returning $.
 */
export function overviewMixEmptyState(
  orders: number,
  days: number,
  hasSplit: boolean,
  salesPending: boolean,
): OverviewMixEmpty | null {
  const need = MIX_MIN_ORDERS;
  if (salesPending || (orders <= 0 && days <= 0)) {
    return {
      kind: "syncing",
      orders: Math.max(0, orders),
      days: Math.max(0, days),
      need,
      copy: "Orders still syncing — not $0. New vs returning dollars and the month close fill as paid orders land.",
      verb: "Refresh this page",
    };
  }
  if (orders < need) {
    return {
      kind: "thin",
      orders,
      days,
      need,
      copy: `${orders.toLocaleString()} ${orders === 1 ? "order" : "orders"} on file. New vs returning $ seals after ${need} paid orders — not $0.`,
      verb: "Watch the next orders",
    };
  }
  if (!hasSplit) {
    return {
      kind: "young",
      orders,
      days,
      need,
      copy: `${orders.toLocaleString()} orders on file. New vs returning $ needs identified buyers — guests stay out — not $0.`,
      verb: "Wait for identified buyers",
    };
  }
  return null;
}

function forecastEmptyState(orders: number, days: number): OverviewMixEmpty {
  return {
    kind: "young",
    orders,
    days,
    need: FORECAST_MIN_DAYS,
    copy: `Typical day needs ${FORECAST_MIN_DAYS} days with sales on file — not $0. Mix above still reads this window.`,
    verb: "Wait for a typical day",
  };
}

function plugFormula(
  soFar: number,
  remainingDays: number,
  typicalDay: number,
  projected: number,
): string {
  return `${whole(soFar)} + ${remainingDays} × ${whole(typicalDay)} = ${whole(projected)}`;
}

function buildMonthClose(input: {
  soFar: number;
  typicalDay: number;
  remainingDays: number;
  daysElapsed: number;
  daysInMonth: number;
}): OverviewMonthClose {
  const closed = input.remainingDays <= 0;
  const projected = closed
    ? input.soFar
    : input.soFar + input.typicalDay * input.remainingDays;
  return {
    soFar: input.soFar,
    typicalDay: input.typicalDay,
    remainingDays: input.remainingDays,
    daysElapsed: input.daysElapsed,
    daysInMonth: input.daysInMonth,
    projected,
    closed,
    formulaEq: closed ? OVERVIEW_MIX_FORMULA_CLOSED : OVERVIEW_MIX_FORMULA_EQ,
    formulaPlug: closed
      ? `${whole(input.soFar)} (month done)`
      : plugFormula(
          input.soFar,
          input.remainingDays,
          input.typicalDay,
          projected,
        ),
  };
}

/**
 * One shop-owner sentence. Leads with returning $ share, then the written
 * month close. Never a promise. Order history only.
 */
export function overviewMixForecastRead(
  view: OverviewMixForecastView,
): OverviewMixForecastRead | null {
  if (view.empty) return null;
  const share =
    view.mix != null && Number.isFinite(view.mix.returningShare)
      ? Math.round(view.mix.returningShare * 100)
      : null;
  const mixLine =
    share != null
      ? `Returning buyers carry ${share}% of sales in this window.`
      : "New vs returning dollars are from this shop’s orders — not a headcount rate.";
  if (view.forecast != null) {
    const close = view.forecast;
    return {
      line: close.closed
        ? `${mixLine} This month is closed at the so-far total — not a pace.`
        : `${mixLine} Month close is so far plus ${close.remainingDays} remaining ${close.remainingDays === 1 ? "day" : "days"} × the typical day.`,
      returningShare: share,
      projected: close.projected,
    };
  }
  return {
    line: `${mixLine} Month close waits on ${FORECAST_MIN_DAYS} days with sales — not $0.`,
    returningShare: share,
    projected: null,
  };
}

export function overviewMixHistoryLine(view: OverviewMixForecastView): string {
  if (view.historyLimited) {
    return `Typical day from ~${view.historyDays} days on file — not a year of pace. Longer history needs more than this install shares.`;
  }
  return `Typical day from the stored book · last ~${view.historyDays} days.`;
}

/**
 * New vs returning $ + month close over the stored order book.
 * `historyLimited` withholds a year-of-pace claim — never a fake lifetime.
 */
export function buildOverviewMixForecast(
  input: OverviewMixForecastInput,
): OverviewMixForecastView {
  const orderCount = Math.max(0, Math.trunc(finite(input.orderCount)));
  const dailySales = input.dailySales.filter((n) => Number.isFinite(n) && n > 0);
  const factDays = dailySales.length;
  const historyDays = Math.max(0, Math.trunc(finite(input.historyDays)));
  const mix = overviewMixSplit(input.windowNewSales, input.windowReturningSales);
  const empty = overviewMixEmptyState(
    orderCount,
    factDays,
    mix != null,
    input.salesPending,
  );
  const typicalDay = overviewTypicalDayFromBook(dailySales);
  const remainingDays = Math.max(0, Math.trunc(finite(input.remainingDays)));
  const daysElapsed = Math.max(0, Math.trunc(finite(input.daysElapsed)));
  const daysInMonth = Math.max(0, Math.trunc(finite(input.daysInMonth)));
  const mtdSales = Math.max(0, finite(input.mtdSales));

  if (empty) {
    return {
      available: false,
      empty,
      forecastEmpty: empty,
      mix: null,
      forecast: null,
      historyLimited: input.historyLimited,
      historyDays,
      orderCount,
      factDays,
    };
  }

  const forecast =
    typicalDay != null
      ? buildMonthClose({
          soFar: mtdSales,
          typicalDay,
          remainingDays,
          daysElapsed,
          daysInMonth,
        })
      : null;

  return {
    available: true,
    empty: null,
    forecastEmpty: forecast ? null : forecastEmptyState(orderCount, factDays),
    mix,
    forecast,
    historyLimited: input.historyLimited,
    historyDays,
    orderCount,
    factDays,
  };
}

/** Honest zeros for pending / no-data — not a fake close. */
export function emptyOverviewMixForecast(): OverviewMixForecastView {
  return buildOverviewMixForecast({
    salesPending: true,
    orderCount: 0,
    windowNewSales: null,
    windowReturningSales: null,
    mtdSales: 0,
    dailySales: [],
    daysElapsed: 0,
    daysInMonth: 0,
    remainingDays: 0,
    historyLimited: false,
    historyDays: 0,
  });
}
