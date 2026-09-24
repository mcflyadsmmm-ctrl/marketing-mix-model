/**
 * P2-A order-history forecast — next calendar month from the typical day.
 *
 *   Next month = typical day × days in that month
 *   Typical day = median of stored days with sales
 *
 * Same 8-day floor as the Overview month close. Whole dollars, then
 * multiplied, so the line in the UI is the arithmetic a person can check.
 *
 * Sales / returning-$ / new-buyer worth ride along when those targets are
 * already on the book. A missing input stays null. Callers paint "—".
 * Never $0. Never 0%. Order history only. No spend. No ads.
 */

import {
  FORECAST_MIN_DAYS,
  overviewTypicalDayFromBook,
} from "./overview-mix-forecast";

/** Locked equal to the month-close typical-day floor. */
export const ORDER_HISTORY_FORECAST_MIN_DAYS = FORECAST_MIN_DAYS;

export const ORDER_HISTORY_FORECAST_FORMULA =
  "Next month = typical day × days in that month";

export const ORDER_HISTORY_FORECAST_METHOD =
  "Typical day is the median of selling days (stored days with sales over $0). Honest estimate — not a black box. Missing days stay off the book — never a fake $0 day.";

const MONTH_LONG = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

export type OrderHistoryForecastTargetKind = "sales" | "returning" | "ltv";

export type OrderHistoryForecastTargetSource = "typed" | "sample";

export type OrderHistoryForecastTone = "up" | "down" | "flat";

export type OrderHistoryForecastTargetsInput = {
  /** This month's sales. Null while facts are missing — not a fake $0. */
  salesActual: number | null;
  /** Typed monthly sales goal. Null when unset. Zero is unset. */
  salesGoal: number | null;
  returningActual: number | null;
  returningTarget: number | null;
  returningSource: OrderHistoryForecastTargetSource | null;
  /** Observed first-window average. Null while it is still sealing. */
  ltvActual: number | null;
  ltvWindow: string | null;
};

export type OrderHistoryForecastTarget = {
  kind: OrderHistoryForecastTargetKind;
  label: string;
  actual: number | null;
  /** Null for the LTV row — the average is a line, not a percent to hit. */
  target: number | null;
  /** Null when either side is missing. Never a fake 0. */
  pct: number | null;
  tone: OrderHistoryForecastTone;
  note: string;
};

export type OrderHistoryForecastView = {
  available: boolean;
  periodLabel: string;
  daysInPeriod: number;
  /** Whole-dollar median. Null below the day floor or while sales are pending. */
  typicalDay: number | null;
  dayCount: number;
  /** Whole dollars. Null when the typical day is withheld. */
  estimate: number | null;
  formula: string;
  /** `typical day × days = estimate`, or null when an input is missing. */
  plug: string | null;
  method: string;
  daysLine: string;
  /** Set only when the estimate is withheld. */
  emptyCopy: string | null;
  historyLimited: boolean;
  targets: OrderHistoryForecastTarget[];
};

export type OrderHistoryForecastInput = {
  salesPending: boolean;
  dailySales: number[];
  /** Shop-local today. Month is 1–12. */
  todayYear: number;
  todayMonth: number;
  /**
   * Picked Goals year. When this is not the live shop year, do not print a
   * next-month close from today × that year’s days.
   */
  bookYear?: number | null;
  historyLimited: boolean;
  /** Optional book name, e.g. "2026 book", so the median is not a mystery. */
  bookLabel?: string | null;
  targets: OrderHistoryForecastTargetsInput;
};

export function emptyForecastTargets(): OrderHistoryForecastTargetsInput {
  return {
    salesActual: null,
    salesGoal: null,
    returningActual: null,
    returningTarget: null,
    returningSource: null,
    ltvActual: null,
    ltvWindow: null,
  };
}

function positive(n: number | null | undefined): number | null {
  if (n == null || !Number.isFinite(n) || n <= 0) return null;
  return n;
}

function whole(n: number): number {
  return Math.round(n);
}

function grouped(n: number): string {
  return whole(n).toLocaleString("en-US");
}

/**
 * The calendar month after shop-local today. December rolls to January.
 */
export function nextCalendarMonth(
  year: number,
  month: number,
): { year: number; month: number; days: number; label: string } {
  const y = Number.isFinite(year) ? Math.trunc(year) : 2026;
  const raw = Number.isFinite(month) ? Math.trunc(month) : 1;
  const safeMonth = raw < 1 || raw > 12 ? 1 : raw;
  const nextMonth = safeMonth === 12 ? 1 : safeMonth + 1;
  const nextYear = safeMonth === 12 ? y + 1 : y;
  const days = new Date(Date.UTC(nextYear, nextMonth, 0)).getUTCDate();
  return {
    year: nextYear,
    month: nextMonth,
    days,
    label: `${MONTH_LONG[nextMonth - 1]} ${nextYear}`,
  };
}

function progressTone(pct: number | null): OrderHistoryForecastTone {
  if (pct == null) return "flat";
  return pct >= 1 ? "up" : "down";
}

function progress(
  actual: number | null,
  target: number | null,
): { actual: number | null; target: number | null; pct: number | null; tone: OrderHistoryForecastTone } {
  const a = positive(actual);
  const t = positive(target);
  if (a == null || t == null) {
    return { actual: a, target: t, pct: null, tone: "flat" };
  }
  const pct = a / t;
  return { actual: a, target: t, pct, tone: progressTone(pct) };
}

function salesNote(actual: number | null, goal: number | null): string {
  if (actual == null && goal == null) {
    return "This month sales still sealing. Not $0.";
  }
  if (goal == null) return "No sales goal typed yet. Not $0.";
  return "Vs the sales goal already on this month.";
}

function returningNote(
  actual: number | null,
  target: number | null,
  source: OrderHistoryForecastTargetSource | null,
): string {
  if (actual == null && target == null) {
    return "Year returning $ still sealing. Not $0.";
  }
  if (target == null) return "No returning-$ target yet. Not $0.";
  switch (source) {
    case "sample":
      return "Sample shop stretch — SAMPLE example, not a target you typed.";
    case "typed":
      return "Vs the returning-$ target you typed.";
    case null:
      return "Vs the returning-$ target.";
    default: {
      const _exhaustive: never = source;
      return _exhaustive;
    }
  }
}

function ltvNote(amount: number | null, window: string | null): string {
  if (amount == null) return "Observed first-window LTV still sealing. Not $0.";
  const windowLabel = window?.trim() ? window.trim() : null;
  return windowLabel
    ? `Target Line is the observed average in the ${windowLabel} — not a goal you type.`
    : "Target Line is the observed average — not a goal you type.";
}

function buildTargets(
  input: OrderHistoryForecastTargetsInput,
): OrderHistoryForecastTarget[] {
  const sales = progress(input.salesActual, input.salesGoal);
  const returning = progress(input.returningActual, input.returningTarget);
  const ltvAmount = positive(input.ltvActual);
  return [
    {
      kind: "sales",
      label: "This month sales",
      actual: sales.actual,
      target: sales.target,
      pct: sales.pct,
      tone: sales.tone,
      note: salesNote(sales.actual, sales.target),
    },
    {
      kind: "returning",
      label: "Returning $",
      actual: returning.actual,
      target: returning.target,
      pct: returning.pct,
      tone: returning.tone,
      note: returningNote(
        returning.actual,
        returning.target,
        input.returningSource,
      ),
    },
    {
      kind: "ltv",
      label: "New-buyer worth",
      actual: ltvAmount,
      target: null,
      pct: null,
      tone: "flat",
      note: ltvNote(ltvAmount, input.ltvWindow),
    },
  ];
}

function emptyCopyFor(salesPending: boolean, dayCount: number): string {
  if (salesPending || dayCount <= 0) {
    return `Orders still syncing — not $0. Next month fills after ${ORDER_HISTORY_FORECAST_MIN_DAYS} selling days.`;
  }
  const noun = dayCount === 1 ? "selling day" : "selling days";
  return `${dayCount.toLocaleString("en-US")} ${noun} on file. Next month needs ${ORDER_HISTORY_FORECAST_MIN_DAYS} — not $0.`;
}

/**
 * Next-month sales from stored days, plus whatever sales / returning-$ /
 * LTV targets are already on the book. Does not read spend.
 */
export function buildOrderHistoryForecast(
  input: OrderHistoryForecastInput,
): OrderHistoryForecastView {
  const daily = input.dailySales.filter((n) => Number.isFinite(n) && n > 0);
  const historyLimited = Boolean(input.historyLimited);
  const scope = input.bookLabel?.trim() ? ` in the ${input.bookLabel.trim()}` : "";
  const counted = daily.length.toLocaleString("en-US");
  const method = historyLimited
    ? `${ORDER_HISTORY_FORECAST_METHOD} From the selling days on file — not a full year of pace.`
    : ORDER_HISTORY_FORECAST_METHOD;
  const clockOff =
    input.bookYear != null &&
    Number.isFinite(input.bookYear) &&
    input.bookYear !== input.todayYear;

  if (clockOff) {
    const daysLine =
      daily.length > 0
        ? `Median of ${counted} selling days${scope} — not next month from today.`
        : "No selling days on file for this year. Missing last year stays —.";
    return {
      available: false,
      periodLabel: "—",
      daysInPeriod: 0,
      typicalDay: null,
      dayCount: daily.length,
      estimate: null,
      formula: ORDER_HISTORY_FORECAST_FORMULA,
      plug: null,
      method,
      daysLine,
      emptyCopy: `${input.bookYear} is not the live year. Next-month close waits on this year’s clock — not today × that year’s days — not $0.`,
      historyLimited,
      targets: buildTargets(input.targets),
    };
  }

  const clock = nextCalendarMonth(input.todayYear, input.todayMonth);
  const typicalRaw = input.salesPending
    ? null
    : overviewTypicalDayFromBook(daily, ORDER_HISTORY_FORECAST_MIN_DAYS);
  const rounded =
    typicalRaw != null && typicalRaw > 0 ? whole(typicalRaw) : null;
  const typicalDay = rounded != null && rounded > 0 ? rounded : null;
  const estimate =
    typicalDay != null ? typicalDay * clock.days : null;
  const daysLine = historyLimited
    ? `Median of ${counted} selling days (stored days with sales over $0)${scope} — not a full year of pace.`
    : daily.length > 0
      ? `Median of ${counted} selling days (stored days with sales over $0)${scope}.`
      : "No selling days on file yet.";

  return {
    available: estimate != null,
    periodLabel: clock.label,
    daysInPeriod: clock.days,
    typicalDay,
    dayCount: daily.length,
    estimate,
    formula: ORDER_HISTORY_FORECAST_FORMULA,
    plug:
      estimate != null && typicalDay != null
        ? `${grouped(typicalDay)} × ${clock.days} = ${grouped(estimate)}`
        : null,
    method,
    daysLine,
    emptyCopy:
      estimate == null
        ? !input.salesPending &&
          daily.length >= ORDER_HISTORY_FORECAST_MIN_DAYS
          ? "Typical day is under a dollar on this book — not $0."
          : emptyCopyFor(input.salesPending, daily.length)
        : null,
    historyLimited,
    targets: buildTargets(input.targets),
  };
}

/** Pending / no-data shell. The next month is still named. The dollars are —. */
export function emptyOrderHistoryForecast(
  todayYear = 2026,
  todayMonth = 1,
): OrderHistoryForecastView {
  return buildOrderHistoryForecast({
    salesPending: true,
    dailySales: [],
    todayYear,
    todayMonth,
    historyLimited: false,
    targets: emptyForecastTargets(),
  });
}
