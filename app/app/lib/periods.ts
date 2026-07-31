import {
  dateKeyFromYmd,
  shopLocalDayKey,
  shopLocalDayRange,
  shopLocalYmd,
} from "./shop-local-day";

export type PeriodPreset = "mtd" | "qtd" | "ytd" | "l12m" | "y3";

export interface DateRange {
  start: Date;
  end: Date;
  label: string;
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function endOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
}

/**
 * Resolve a period preset. When `timeZone` (IANA) is provided, edges follow the
 * shop-local calendar (merchant midnight / month / quarter / year) — never the
 * server process TZ. Without a timezone, falls back to server-local Date parts
 * (legacy callers / sample paths).
 */
export function resolvePeriod(
  preset: PeriodPreset,
  now = new Date(),
  timeZone?: string | null,
): DateRange {
  if (timeZone) {
    return resolvePeriodInTimeZone(preset, now, timeZone);
  }
  const end = endOfDay(now);

  switch (preset) {
    case "mtd": {
      const start = startOfDay(new Date(now.getFullYear(), now.getMonth(), 1));
      return { start, end, label: "Month to date" };
    }
    case "qtd": {
      const quarter = Math.floor(now.getMonth() / 3);
      const start = startOfDay(new Date(now.getFullYear(), quarter * 3, 1));
      return { start, end, label: "Quarter to date" };
    }
    case "ytd": {
      const start = startOfDay(new Date(now.getFullYear(), 0, 1));
      return { start, end, label: "Year to date" };
    }
    case "l12m": {
      const start = startOfDay(
        new Date(now.getFullYear() - 1, now.getMonth(), now.getDate()),
      );
      return { start, end, label: "Last 12 months" };
    }
    case "y3": {
      const start = startOfDay(
        new Date(now.getFullYear() - 3, now.getMonth(), now.getDate()),
      );
      return { start, end, label: "Last 3 years" };
    }
    default: {
      const _exhaustive: never = preset;
      throw new Error(`Unknown period preset: ${_exhaustive}`);
    }
  }
}

function resolvePeriodInTimeZone(
  preset: PeriodPreset,
  now: Date,
  timeZone: string,
): DateRange {
  const { y, m, d } = shopLocalYmd(now, timeZone);
  const todayKey = dateKeyFromYmd(y, m, d);
  const end = shopLocalDayRange(todayKey, timeZone).end;

  switch (preset) {
    case "mtd": {
      const start = shopLocalDayRange(dateKeyFromYmd(y, m, 1), timeZone).start;
      return { start, end, label: "Month to date" };
    }
    case "qtd": {
      const quarter = Math.floor((m - 1) / 3);
      const startMonth = quarter * 3 + 1;
      const start = shopLocalDayRange(
        dateKeyFromYmd(y, startMonth, 1),
        timeZone,
      ).start;
      return { start, end, label: "Quarter to date" };
    }
    case "ytd": {
      const start = shopLocalDayRange(dateKeyFromYmd(y, 1, 1), timeZone).start;
      return { start, end, label: "Year to date" };
    }
    case "l12m": {
      // Noon UTC anchor + Date.UTC month math mirrors server-local Date clamping
      // (e.g. Feb 29 → Mar 1 in non-leap years) before re-keying in shop TZ.
      const anchor = new Date(Date.UTC(y - 1, m - 1, d, 12, 0, 0));
      const startKey = shopLocalDayKey(anchor, timeZone);
      const start = shopLocalDayRange(startKey, timeZone).start;
      return { start, end, label: "Last 12 months" };
    }
    case "y3": {
      const anchor = new Date(Date.UTC(y - 3, m - 1, d, 12, 0, 0));
      const startKey = shopLocalDayKey(anchor, timeZone);
      const start = shopLocalDayRange(startKey, timeZone).start;
      return { start, end, label: "Last 3 years" };
    }
    default: {
      const _exhaustive: never = preset;
      throw new Error(`Unknown period preset: ${_exhaustive}`);
    }
  }
}

/**
 * Calendar-aligned prior window for the same preset (MTD → prior MTD, etc.).
 * Used for Sales / Spend / MER deltas on the Cash MER desk.
 * When `timeZone` is set, prior edges use the shop-local calendar.
 */
export function resolvePriorPeriod(
  preset: PeriodPreset,
  now = new Date(),
  timeZone?: string | null,
): DateRange {
  if (timeZone) {
    return resolvePriorPeriodInTimeZone(preset, now, timeZone);
  }
  switch (preset) {
    case "mtd": {
      const lastDayPrior = new Date(now.getFullYear(), now.getMonth(), 0).getDate();
      const day = Math.min(now.getDate(), lastDayPrior);
      const start = startOfDay(new Date(now.getFullYear(), now.getMonth() - 1, 1));
      const end = endOfDay(new Date(now.getFullYear(), now.getMonth() - 1, day));
      return { start, end, label: "Prior MTD" };
    }
    case "qtd": {
      const quarter = Math.floor(now.getMonth() / 3);
      const qStart = startOfDay(new Date(now.getFullYear(), quarter * 3, 1));
      const dayOffset = Math.max(
        0,
        Math.round(
          (startOfDay(now).getTime() - qStart.getTime()) / 86_400_000,
        ),
      );
      const priorQStart = startOfDay(
        new Date(now.getFullYear(), (quarter - 1) * 3, 1),
      );
      const priorEnd = endOfDay(
        new Date(
          priorQStart.getFullYear(),
          priorQStart.getMonth(),
          priorQStart.getDate() + dayOffset,
        ),
      );
      return { start: priorQStart, end: priorEnd, label: "Prior QTD" };
    }
    case "ytd": {
      const start = startOfDay(new Date(now.getFullYear() - 1, 0, 1));
      const end = endOfDay(
        new Date(now.getFullYear() - 1, now.getMonth(), now.getDate()),
      );
      return { start, end, label: "Prior YTD" };
    }
    case "l12m": {
      const end = endOfDay(
        new Date(now.getFullYear() - 1, now.getMonth(), now.getDate()),
      );
      const start = startOfDay(
        new Date(now.getFullYear() - 2, now.getMonth(), now.getDate()),
      );
      return { start, end, label: "Prior 12 months" };
    }
    case "y3": {
      const end = endOfDay(
        new Date(now.getFullYear() - 3, now.getMonth(), now.getDate()),
      );
      const start = startOfDay(
        new Date(now.getFullYear() - 6, now.getMonth(), now.getDate()),
      );
      return { start, end, label: "Prior 3 years" };
    }
    default: {
      const _exhaustive: never = preset;
      throw new Error(`Unknown period preset: ${_exhaustive}`);
    }
  }
}

function resolvePriorPeriodInTimeZone(
  preset: PeriodPreset,
  now: Date,
  timeZone: string,
): DateRange {
  const { y, m, d } = shopLocalYmd(now, timeZone);

  switch (preset) {
    case "mtd": {
      // Last day of prior month via Date.UTC day-0 trick, then clamp day.
      const priorMonthLast = new Date(Date.UTC(y, m - 1, 0, 12, 0, 0));
      const priorParts = shopLocalYmd(priorMonthLast, timeZone);
      const day = Math.min(d, priorParts.d);
      const start = shopLocalDayRange(
        dateKeyFromYmd(priorParts.y, priorParts.m, 1),
        timeZone,
      ).start;
      const end = shopLocalDayRange(
        dateKeyFromYmd(priorParts.y, priorParts.m, day),
        timeZone,
      ).end;
      return { start, end, label: "Prior MTD" };
    }
    case "qtd": {
      const quarter = Math.floor((m - 1) / 3);
      const qStartMonth = quarter * 3 + 1;
      const qStartKey = dateKeyFromYmd(y, qStartMonth, 1);
      const todayKey = dateKeyFromYmd(y, m, d);
      const qStart = shopLocalDayRange(qStartKey, timeZone).start;
      const todayStart = shopLocalDayRange(todayKey, timeZone).start;
      const dayOffset = Math.max(
        0,
        Math.round((todayStart.getTime() - qStart.getTime()) / 86_400_000),
      );
      const priorQAnchor = new Date(Date.UTC(y, qStartMonth - 1 - 3, 1, 12, 0, 0));
      const priorQParts = shopLocalYmd(priorQAnchor, timeZone);
      const priorQStartKey = dateKeyFromYmd(priorQParts.y, priorQParts.m, 1);
      const priorQStart = shopLocalDayRange(priorQStartKey, timeZone).start;
      const priorEndAnchor = new Date(
        Date.UTC(priorQParts.y, priorQParts.m - 1, 1 + dayOffset, 12, 0, 0),
      );
      const priorEndKey = shopLocalDayKey(priorEndAnchor, timeZone);
      const priorEnd = shopLocalDayRange(priorEndKey, timeZone).end;
      return { start: priorQStart, end: priorEnd, label: "Prior QTD" };
    }
    case "ytd": {
      const start = shopLocalDayRange(dateKeyFromYmd(y - 1, 1, 1), timeZone).start;
      const endKey = shopLocalDayKey(
        new Date(Date.UTC(y - 1, m - 1, d, 12, 0, 0)),
        timeZone,
      );
      const end = shopLocalDayRange(endKey, timeZone).end;
      return { start, end, label: "Prior YTD" };
    }
    case "l12m": {
      const endKey = shopLocalDayKey(
        new Date(Date.UTC(y - 1, m - 1, d, 12, 0, 0)),
        timeZone,
      );
      const startKey = shopLocalDayKey(
        new Date(Date.UTC(y - 2, m - 1, d, 12, 0, 0)),
        timeZone,
      );
      return {
        start: shopLocalDayRange(startKey, timeZone).start,
        end: shopLocalDayRange(endKey, timeZone).end,
        label: "Prior 12 months",
      };
    }
    case "y3": {
      const endKey = shopLocalDayKey(
        new Date(Date.UTC(y - 3, m - 1, d, 12, 0, 0)),
        timeZone,
      );
      const startKey = shopLocalDayKey(
        new Date(Date.UTC(y - 6, m - 1, d, 12, 0, 0)),
        timeZone,
      );
      return {
        start: shopLocalDayRange(startKey, timeZone).start,
        end: shopLocalDayRange(endKey, timeZone).end,
        label: "Prior 3 years",
      };
    }
    default: {
      const _exhaustive: never = preset;
      throw new Error(`Unknown period preset: ${_exhaustive}`);
    }
  }
}

/**
 * Shopify Admin order search for Cash MER / order-facts sales SoT.
 * open|closed excludes cancelled; test:false excludes Bogus Gateway / test-mode orders.
 * Parentheses keep OR from swallowing the created_at / test terms (Shopify search syntax).
 */
export function formatPeriodQuery(range: DateRange): string {
  const isoStart = range.start.toISOString();
  const isoEnd = range.end.toISOString();
  return `created_at:>=${isoStart} created_at:<=${isoEnd} (status:open OR status:closed) test:false`;
}

export const PERIOD_PRESETS: { value: PeriodPreset; label: string }[] = [
  { value: "mtd", label: "MTD" },
  { value: "qtd", label: "QTD" },
  { value: "ytd", label: "YTD" },
  { value: "l12m", label: "L12M" },
  { value: "y3", label: "3 yr" },
];

/**
 * Shopify `read_orders` default window is ~60 days without `read_all_orders`.
 * Periods longer than that can overclaim live till coverage until SalesDayFact.
 */
export const SHOPIFY_READ_ORDERS_WINDOW_DAYS = 60;

export function periodSpanDays(range: DateRange): number {
  const ms = range.end.getTime() - range.start.getTime();
  return Math.max(0, Math.ceil(ms / 86_400_000));
}

/** True when the selected range is wider than the default live order window. */
export function periodMayExceedShopifyOrderWindow(range: DateRange): boolean {
  return periodSpanDays(range) > SHOPIFY_READ_ORDERS_WINDOW_DAYS;
}

/** Parse URL `period` query; unknown/missing → MTD. */
export function parsePeriodPreset(raw: string | null): PeriodPreset {
  if (raw && PERIOD_PRESETS.some((p) => p.value === raw)) {
    return raw as PeriodPreset;
  }
  return "mtd";
}
