// Bill → daily: spread a month/quarter/half-year/year invoice across days for cash MER.
// Pure math only — no I/O. Religion: cash MER = sales ÷ spend; CSV spine; no OAuth.

import type { SpendChannel } from "@mcfly/mer-engine";
import { SPEND_CHANNELS, SPEND_CHANNEL_LABELS } from "@mcfly/mer-engine";
import { WIDE_TEMPLATE_COLUMNS, WIDE_TEMPLATE_HEADERS } from "./spend-csv";

export type BillCadence = "month" | "quarter" | "half_year" | "year";
export type BillDayBasis = "calendar" | "fixed";

export interface BillDailyInput {
  amount: number;
  cadence: BillCadence;
  dayBasis: BillDayBasis;
  /** YYYY-MM-DD start of the billing period (inclusive). */
  startDate: string;
  channel: SpendChannel;
}

export interface BillDailyDay {
  date: string;
  amount: number;
}

export interface BillDailyPlan {
  amount: number;
  cadence: BillCadence;
  dayBasis: BillDayBasis;
  startDate: string;
  endDate: string;
  dayCount: number;
  /** amount ÷ dayCount (display; per-day rows may differ by a cent). */
  dailyRate: number;
  channel: SpendChannel;
  days: BillDailyDay[];
  /** Sum of day amounts — equals input amount (cent-rounded). */
  totalAllocated: number;
}

export type BillDailyResult =
  | { ok: true; plan: BillDailyPlan }
  | { ok: false; error: string };

/**
 * Fixed-day conventions (inclusive). half_year = 182 = floor(365/2), matching
 * year=365 rather than leap-aware 183. Calendar basis uses real month lengths.
 */
const FIXED_DAYS: Record<BillCadence, number> = {
  month: 30,
  quarter: 90,
  half_year: 182,
  year: 365,
};

const CADENCES: readonly BillCadence[] = [
  "month",
  "quarter",
  "half_year",
  "year",
];
const DAY_BASES: readonly BillDayBasis[] = ["calendar", "fixed"];

const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

export function isBillCadence(value: string): value is BillCadence {
  return (CADENCES as readonly string[]).includes(value);
}

export function isBillDayBasis(value: string): value is BillDayBasis {
  return (DAY_BASES as readonly string[]).includes(value);
}

export function isSpendChannel(value: string): value is SpendChannel {
  return (SPEND_CHANNELS as readonly string[]).includes(value);
}

/** First calendar day of the local month containing `now`. */
export function firstOfCurrentMonth(now = new Date()): string {
  const y = now.getFullYear();
  const m = now.getMonth() + 1;
  return `${y}-${String(m).padStart(2, "0")}-01`;
}

export function parseIsoDate(raw: string): { y: number; m: number; d: number } | null {
  const match = DATE_RE.exec(raw.trim());
  if (!match) return null;
  const y = Number(match[1]);
  const m = Number(match[2]);
  const d = Number(match[3]);
  if (!Number.isInteger(y) || !Number.isInteger(m) || !Number.isInteger(d)) {
    return null;
  }
  if (m < 1 || m > 12 || d < 1 || d > 31) return null;
  const probe = new Date(y, m - 1, d);
  if (
    probe.getFullYear() !== y ||
    probe.getMonth() !== m - 1 ||
    probe.getDate() !== d
  ) {
    return null;
  }
  return { y, m, d };
}

function formatIso(y: number, m: number, d: number): string {
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

function addCalendarMonths(
  y: number,
  m: number,
  d: number,
  months: number,
): { y: number; m: number; d: number } {
  const cursor = new Date(y, m - 1 + months, d);
  return {
    y: cursor.getFullYear(),
    m: cursor.getMonth() + 1,
    d: cursor.getDate(),
  };
}

function addCalendarDays(
  y: number,
  m: number,
  d: number,
  days: number,
): { y: number; m: number; d: number } {
  const cursor = new Date(y, m - 1, d + days);
  return {
    y: cursor.getFullYear(),
    m: cursor.getMonth() + 1,
    d: cursor.getDate(),
  };
}

function monthsForCadence(cadence: BillCadence): number {
  switch (cadence) {
    case "month":
      return 1;
    case "quarter":
      return 3;
    case "half_year":
      return 6;
    case "year":
      return 12;
    default: {
      const _exhaustive: never = cadence;
      return _exhaustive;
    }
  }
}

/**
 * Inclusive end date for the billing period.
 * Calendar: start + N months − 1 day (e.g. Jul 1 → Jul 31; bi-annual → +6 mo − 1 day).
 * Fixed: start + 29/89/181/364 days (30/90/182/365 inclusive).
 */
export function periodEndDate(
  startDate: string,
  cadence: BillCadence,
  dayBasis: BillDayBasis,
): string | null {
  const start = parseIsoDate(startDate);
  if (!start) return null;

  if (dayBasis === "fixed") {
    const end = addCalendarDays(start.y, start.m, start.d, FIXED_DAYS[cadence] - 1);
    return formatIso(end.y, end.m, end.d);
  }

  const next = addCalendarMonths(start.y, start.m, start.d, monthsForCadence(cadence));
  const end = addCalendarDays(next.y, next.m, next.d, -1);
  return formatIso(end.y, end.m, end.d);
}

export function fixedDayCount(cadence: BillCadence): number {
  return FIXED_DAYS[cadence];
}

/** Inclusive day count between two ISO dates. */
export function inclusiveDayCount(startDate: string, endDate: string): number | null {
  const start = parseIsoDate(startDate);
  const end = parseIsoDate(endDate);
  if (!start || !end) return null;
  const a = Date.UTC(start.y, start.m - 1, start.d);
  const b = Date.UTC(end.y, end.m - 1, end.d);
  if (b < a) return null;
  return Math.round((b - a) / 86_400_000) + 1;
}

/**
 * Split `total` across `dayCount` days in cents so the sum equals the
 * cent-rounded total. Remainder cents land on the last day.
 */
export function distributeDailyAmounts(total: number, dayCount: number): number[] {
  if (!Number.isFinite(total) || dayCount < 1) return [];
  const totalCents = Math.round(total * 100);
  const base = Math.floor(totalCents / dayCount);
  const remainder = totalCents - base * dayCount;
  const amounts: number[] = [];
  for (let i = 0; i < dayCount; i++) {
    const cents = i === dayCount - 1 ? base + remainder : base;
    amounts.push(cents / 100);
  }
  return amounts;
}

function enumerateDates(startDate: string, dayCount: number): string[] {
  const start = parseIsoDate(startDate);
  if (!start || dayCount < 1) return [];
  const dates: string[] = [];
  for (let i = 0; i < dayCount; i++) {
    const day = addCalendarDays(start.y, start.m, start.d, i);
    dates.push(formatIso(day.y, day.m, day.d));
  }
  return dates;
}

/** Plan a bill → daily allocation. Validates inputs; never throws. */
export function planBillDaily(input: BillDailyInput): BillDailyResult {
  const { amount, cadence, dayBasis, startDate, channel } = input;

  if (!Number.isFinite(amount) || amount <= 0) {
    return { ok: false, error: "Enter a positive bill amount." };
  }
  if (!isBillCadence(cadence)) {
    return {
      ok: false,
      error: "Pick a cadence: month, quarter, half-year, or year.",
    };
  }
  if (!isBillDayBasis(dayBasis)) {
    return { ok: false, error: "Pick a day basis: calendar or fixed." };
  }
  if (!parseIsoDate(startDate)) {
    return { ok: false, error: "Start date must be YYYY-MM-DD." };
  }
  if (!isSpendChannel(channel)) {
    return { ok: false, error: "Pick a valid spend channel." };
  }

  const endDate = periodEndDate(startDate, cadence, dayBasis);
  if (!endDate) {
    return { ok: false, error: "Could not compute the billing period end date." };
  }

  const dayCount =
    dayBasis === "fixed"
      ? FIXED_DAYS[cadence]
      : inclusiveDayCount(startDate, endDate);
  if (dayCount == null || dayCount < 1) {
    return { ok: false, error: "Billing period must cover at least one day." };
  }

  const amounts = distributeDailyAmounts(amount, dayCount);
  const dates = enumerateDates(startDate, dayCount);
  if (amounts.length !== dates.length) {
    return { ok: false, error: "Could not allocate daily amounts." };
  }

  const days: BillDailyDay[] = dates.map((date, i) => ({
    date,
    amount: amounts[i],
  }));
  const totalAllocated = days.reduce((sum, d) => sum + d.amount, 0);
  const dailyRate = Math.round((amount / dayCount) * 100) / 100;

  return {
    ok: true,
    plan: {
      amount,
      cadence,
      dayBasis,
      startDate,
      endDate,
      dayCount,
      dailyRate,
      channel,
      days,
      totalAllocated: Math.round(totalAllocated * 100) / 100,
    },
  };
}

/** Wide Mcfly template CSV: Day + every channel column; only the bill channel filled. */
export function buildBillDailyWideCsv(plan: BillDailyPlan): string {
  const channelIndex = WIDE_TEMPLATE_COLUMNS.findIndex(
    (col) => col.channel === plan.channel,
  );
  if (channelIndex < 0) {
    return buildBillDailyLongCsv(plan);
  }

  const rows: string[] = [WIDE_TEMPLATE_HEADERS.join(",")];
  for (const day of plan.days) {
    const cells = Array.from({ length: WIDE_TEMPLATE_HEADERS.length }, () => "");
    cells[0] = day.date;
    cells[channelIndex] = formatAmountCell(day.amount);
    rows.push(cells.join(","));
  }
  return `${rows.join("\n")}\n`;
}

/** Long CSV: date,channel,amount — importable via parseSpendCsv. */
export function buildBillDailyLongCsv(plan: BillDailyPlan): string {
  const rows = ["date,channel,amount"];
  for (const day of plan.days) {
    rows.push(`${day.date},${plan.channel},${formatAmountCell(day.amount)}`);
  }
  return `${rows.join("\n")}\n`;
}

export function billDailyFilename(plan: BillDailyPlan): string {
  const label = SPEND_CHANNEL_LABELS[plan.channel]
    .toLowerCase()
    .replace(/\s+/g, "-");
  return `mcfly-bill-daily-${label}-${plan.startDate}-${plan.endDate}.csv`;
}

function formatAmountCell(amount: number): string {
  return (Math.round(amount * 100) / 100).toFixed(2);
}
