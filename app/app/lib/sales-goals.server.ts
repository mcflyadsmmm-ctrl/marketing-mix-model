import { calculateBreakEvenMer, calculateMer } from "@mcfly/mer-core";

import prisma from "../db.server";
import { getOrCreateSettings } from "./mer-dashboard.server";
import type { DateRange } from "./periods";
import { getSalesFactsByDay, getSalesFactsCoverage } from "./sales-facts.server";
import { fetchSampleSalesByDay } from "./sample-desk.server";
import {
  dateKeyFromYmd,
  shopLocalDayRange,
  shopLocalYmd,
} from "./shop-local-day";

const MONTH_SHORT = [
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

export type GoalPaceKind =
  | "ahead"
  | "on_track"
  | "behind"
  | "met"
  | "close"
  | "miss"
  | "upcoming"
  | "none";

export type GoalPaceTone = "up" | "down" | "flat";

export interface GoalPace {
  kind: GoalPaceKind;
  label: string;
  tone: GoalPaceTone;
}

export interface GoalMonthRow {
  month: number;
  monthShort: string;
  monthLong: string;
  /** Monthly sales goal ($) */
  salesGoal: number;
  /** Till actual / MTD ($) */
  actual: number;
  spend: number;
  /** Cash MER = sales ÷ spend */
  mer: number | null;
  delta: number;
  pct: number | null;
  pace: GoalPace;
  isCurrent: boolean;
  isFuture: boolean;
}

export interface GoalsYtd {
  goal: number;
  actual: number;
  pct: number | null;
  delta: number;
}

export interface MonthCloseForecast {
  month: number;
  monthLong: string;
  year: number;
  monthGoal: number;
  mtdSales: number;
  mtdSpend: number;
  mtdMer: number | null;
  daysElapsed: number;
  daysInMonth: number;
  remainingDays: number;
  projSales: number;
  projSpend: number;
  projMer: number | null;
  vsGoalProj: number;
  pace: GoalPace;
  targetMer: number;
}

export interface GoalsYearBoard {
  year: number;
  rows: GoalMonthRow[];
  ytd: GoalsYtd;
  yearGoal: number;
  yearActual: number;
  forecast: MonthCloseForecast | null;
  targetMer: number;
  breakEvenMer: number | null;
  marginPct: number;
}

function startOfLocalDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function endOfLocalDay(d: Date): Date {
  return new Date(
    d.getFullYear(),
    d.getMonth(),
    d.getDate(),
    23,
    59,
    59,
    999,
  );
}

export function daysInCalendarMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

/**
 * Calendar month bounds. When `ianaTimezone` is set, edges are shop-local
 * midnights via `shopLocalDayRange` (not the host process TZ).
 */
export function monthDateRange(
  year: number,
  month: number,
  ianaTimezone?: string | null,
): DateRange {
  const label = `${MONTH_LONG[month - 1]} ${year}`;
  if (ianaTimezone) {
    const days = daysInCalendarMonth(year, month);
    return {
      start: shopLocalDayRange(dateKeyFromYmd(year, month, 1), ianaTimezone)
        .start,
      end: shopLocalDayRange(dateKeyFromYmd(year, month, days), ianaTimezone)
        .end,
      label,
    };
  }
  const start = startOfLocalDay(new Date(year, month - 1, 1));
  const end = endOfLocalDay(new Date(year, month, 0));
  return { start, end, label };
}

/**
 * Calendar year bounds. When `ianaTimezone` is set, Jan 1 / Dec 31 are
 * shop-local day ranges (not host-local `new Date(year, …)`).
 */
export function yearDateRange(
  year: number,
  ianaTimezone?: string | null,
): DateRange {
  if (ianaTimezone) {
    return {
      start: shopLocalDayRange(dateKeyFromYmd(year, 1, 1), ianaTimezone).start,
      end: shopLocalDayRange(dateKeyFromYmd(year, 12, 31), ianaTimezone).end,
      label: String(year),
    };
  }
  return {
    start: startOfLocalDay(new Date(year, 0, 1)),
    end: endOfLocalDay(new Date(year, 11, 31)),
    label: String(year),
  };
}

/** Aggregate YYYY-MM-DD sales map → month (1–12) → dollars. */
export function salesByMonthFromDayMap(
  year: number,
  salesByDay: Map<string, number>,
  now = new Date(),
  ianaTimezone?: string | null,
): Map<number, number> {
  const months = new Map<number, number>();
  for (let m = 1; m <= 12; m++) months.set(m, 0);

  const prefix = `${year}-`;
  const tz = ianaTimezone?.trim() || null;
  const { y: currentYear, m: currentMonth, d: currentDay } = tz
    ? shopLocalYmd(now, tz)
    : {
        y: now.getFullYear(),
        m: now.getMonth() + 1,
        d: now.getDate(),
      };
  const todayKey =
    currentYear === year
      ? dateKeyFromYmd(year, currentMonth, currentDay)
      : null;

  for (const [key, sales] of salesByDay) {
    if (!key.startsWith(prefix) || !Number.isFinite(sales)) continue;
    const month = Number.parseInt(key.slice(5, 7), 10);
    if (month < 1 || month > 12) continue;
    if (todayKey && month === currentMonth && key > todayKey) continue;
    months.set(month, (months.get(month) ?? 0) + sales);
  }
  return months;
}

/**
 * Attribute spend entries to calendar months by periodStart.
 * When `ianaTimezone` is set, year window + month buckets use shop-local days.
 * Future months in the current year stay 0; current month is MTD-safe via caller window.
 */
export async function spendByMonthMap(
  shopId: string,
  year: number,
  options?: {
    sampleOnly?: boolean;
    excludeSample?: boolean;
    ianaTimezone?: string | null;
  },
  now = new Date(),
): Promise<Map<number, number>> {
  const months = new Map<number, number>();
  for (let m = 1; m <= 12; m++) months.set(m, 0);

  const tz = options?.ianaTimezone;
  let yearStart: Date;
  let yearEnd: Date;
  let maxMonth: number;

  if (tz) {
    const { y: nowY, m: nowM, d: nowD } = shopLocalYmd(now, tz);
    yearStart = shopLocalDayRange(dateKeyFromYmd(year, 1, 1), tz).start;
    if (nowY < year) {
      return months;
    }
    if (nowY === year) {
      yearEnd = shopLocalDayRange(dateKeyFromYmd(nowY, nowM, nowD), tz).end;
      maxMonth = nowM;
    } else {
      yearEnd = shopLocalDayRange(dateKeyFromYmd(year, 12, 31), tz).end;
      maxMonth = 12;
    }
  } else {
    yearStart = startOfLocalDay(new Date(year, 0, 1));
    yearEnd = endOfLocalDay(new Date(year, 11, 31));
    if (now.getFullYear() === year) {
      yearEnd = endOfLocalDay(now);
      maxMonth = now.getMonth() + 1;
    } else if (now.getFullYear() < year) {
      return months;
    } else {
      maxMonth = 12;
    }
  }

  const entries = await prisma.spendEntry.findMany({
    where: {
      shopId,
      periodStart: { lte: yearEnd },
      periodEnd: { gte: yearStart },
      ...(options?.sampleOnly
        ? { source: "sample" }
        : options?.excludeSample
          ? { NOT: { source: "sample" } }
          : {}),
    },
    select: { amount: true, periodStart: true },
  });

  for (const entry of entries) {
    // Spend stamps are UTC midnight of the CSV day key — use UTC Y/M, not shopLocalYmd
    // (Denver would shift 2026-07-01T00:00Z → June).
    const y = entry.periodStart.getUTCFullYear();
    const m = entry.periodStart.getUTCMonth() + 1;
    if (y !== year || m < 1 || m > 12) continue;
    if (m > maxMonth) continue;
    if (!Number.isFinite(entry.amount) || entry.amount <= 0) continue;
    months.set(m, (months.get(m) ?? 0) + entry.amount);
  }

  return months;
}

export function calendarDaysElapsedInMonth(
  year: number,
  month: number,
  now = new Date(),
  ianaTimezone?: string | null,
): { daysElapsed: number; daysInMonth: number; remainingDays: number } {
  const daysInMonth = daysInCalendarMonth(year, month);
  const tz = ianaTimezone?.trim() || null;
  const { y: nowY, m: nowM, d: nowD } = tz
    ? shopLocalYmd(now, tz)
    : {
        y: now.getFullYear(),
        m: now.getMonth() + 1,
        d: now.getDate(),
      };
  const sameMonth = nowY === year && nowM === month;
  if (!sameMonth) {
    const isPast = nowY > year || (nowY === year && nowM > month);
    const daysElapsed = isPast ? daysInMonth : 0;
    return {
      daysElapsed,
      daysInMonth,
      remainingDays: daysInMonth - daysElapsed,
    };
  }
  const daysElapsed = Math.min(Math.max(nowD, 1), daysInMonth);
  return {
    daysElapsed,
    daysInMonth,
    remainingDays: Math.max(0, daysInMonth - daysElapsed),
  };
}

/**
 * Pace vs sales goal. In-progress months scale the goal by calendar days elapsed.
 * Closed months: Met / Close / Miss. Future empty: Upcoming.
 */
export function paceStatus(
  actual: number,
  goal: number,
  opts?: {
    expectedPct?: number | null;
    isFuture?: boolean;
  },
): GoalPace {
  if (!Number.isFinite(goal) || goal <= 0) {
    return { kind: "none", label: "—", tone: "flat" };
  }
  if (opts?.isFuture && actual <= 0) {
    return { kind: "upcoming", label: "Upcoming", tone: "flat" };
  }

  const expectedPct = opts?.expectedPct;
  if (
    expectedPct != null &&
    Number.isFinite(expectedPct) &&
    expectedPct > 0 &&
    expectedPct < 1
  ) {
    const vsExpected = actual / (goal * expectedPct);
    if (vsExpected >= 1.05) {
      return { kind: "ahead", label: "Ahead", tone: "up" };
    }
    if (vsExpected >= 0.95) {
      return { kind: "on_track", label: "On track", tone: "flat" };
    }
    return { kind: "behind", label: "Behind", tone: "down" };
  }

  const pct = actual / goal;
  if (pct >= 1) return { kind: "met", label: "Met", tone: "up" };
  if (pct >= 0.95) return { kind: "close", label: "Close", tone: "flat" };
  return { kind: "miss", label: "Miss", tone: "down" };
}

function clampMonth(month: number): number | null {
  if (!Number.isInteger(month) || month < 1 || month > 12) return null;
  return month;
}

/** List monthly sales goals for a year (12 slots, missing → 0). */
export async function listSalesGoals(
  shopId: string,
  year: number,
): Promise<number[]> {
  const rows = await prisma.salesGoal.findMany({
    where: { shopId, year },
    select: { month: true, salesGoal: true },
  });
  const goals = Array.from({ length: 12 }, () => 0);
  for (const row of rows) {
    if (row.month >= 1 && row.month <= 12) {
      goals[row.month - 1] = row.salesGoal;
    }
  }
  return goals;
}

export async function upsertSalesGoal(
  shopId: string,
  year: number,
  month: number,
  salesGoal: number,
) {
  const m = clampMonth(month);
  if (m == null) throw new Error("Month must be 1–12");
  if (!Number.isInteger(year) || year < 2000 || year > 2100) {
    throw new Error("Year out of range");
  }
  if (!Number.isFinite(salesGoal) || salesGoal < 0) {
    throw new Error("Sales goal must be a non-negative number");
  }

  return prisma.salesGoal.upsert({
    where: {
      shopId_year_month: { shopId, year, month: m },
    },
    create: { shopId, year, month: m, salesGoal },
    update: { salesGoal },
  });
}

/** Upsert all 12 months for a year plan (missing → 0). */
export async function upsertYearSalesGoals(
  shopId: string,
  year: number,
  monthlyGoals: number[],
) {
  if (!Number.isInteger(year) || year < 2000 || year > 2100) {
    throw new Error("Year out of range");
  }
  if (monthlyGoals.length !== 12) {
    throw new Error("Year plan requires 12 monthly sales goals");
  }

  await prisma.$transaction(
    monthlyGoals.map((raw, index) => {
      const salesGoal = Number.isFinite(raw) && raw >= 0 ? raw : 0;
      const month = index + 1;
      return prisma.salesGoal.upsert({
        where: {
          shopId_year_month: { shopId, year, month },
        },
        create: { shopId, year, month, salesGoal },
        update: { salesGoal },
      });
    }),
  );
}

function mapGetMonth(map: Map<number, number>, month: number): number {
  const v = map.get(month);
  return Number.isFinite(v) ? (v as number) : 0;
}

function buildMonthCloseForecast(params: {
  year: number;
  goals: number[];
  salesByMonth: Map<number, number>;
  spendByMonth: Map<number, number>;
  targetMer: number;
  now?: Date;
  ianaTimezone?: string | null;
}): MonthCloseForecast | null {
  const now = params.now ?? new Date();
  const { year, goals, salesByMonth, spendByMonth, targetMer } = params;
  const tz = params.ianaTimezone?.trim() || null;
  const { y: nowY, m: nowM } = tz
    ? shopLocalYmd(now, tz)
    : { y: now.getFullYear(), m: now.getMonth() + 1 };

  if (nowY !== year) return null;

  const month = nowM;
  const monthGoal = goals[month - 1] ?? 0;
  const mtdSales = mapGetMonth(salesByMonth, month);
  const mtdSpend = mapGetMonth(spendByMonth, month);
  const mtdMer = calculateMer(mtdSales, mtdSpend);
  const { daysElapsed, daysInMonth, remainingDays } =
    calendarDaysElapsedInMonth(year, month, now, tz);

  const avgDailySales = daysElapsed > 0 ? mtdSales / daysElapsed : 0;
  const avgDailySpend = daysElapsed > 0 ? mtdSpend / daysElapsed : 0;
  const projSales = mtdSales + avgDailySales * remainingDays;
  const projSpend = mtdSpend + avgDailySpend * remainingDays;
  const projMer = calculateMer(projSales, projSpend);
  const expectedPct = daysInMonth > 0 ? daysElapsed / daysInMonth : 1;
  const pace = paceStatus(mtdSales, monthGoal, { expectedPct });

  return {
    month,
    monthLong: MONTH_LONG[month - 1],
    year,
    monthGoal,
    mtdSales,
    mtdSpend,
    mtdMer,
    daysElapsed,
    daysInMonth,
    remainingDays,
    projSales,
    projSpend,
    projMer,
    vsGoalProj: projSales - monthGoal,
    pace,
    targetMer,
  };
}

/**
 * Year board: monthly sales goals vs Shopify till + cash MER (sales ÷ spend).
 * Loads goals for shopId; actuals/spend come from caller Maps.
 */
export async function buildYearBoard(
  shopId: string,
  year: number,
  salesByMonth: Map<number, number>,
  spendByMonth: Map<number, number>,
  targetMer: number,
  now = new Date(),
  ianaTimezone?: string | null,
): Promise<GoalsYearBoard> {
  const settings = await getOrCreateSettings(shopId);
  const goals = await listSalesGoals(shopId, year);
  const breakEvenMer = calculateBreakEvenMer(settings.marginPct);
  const rail = Number.isFinite(targetMer) && targetMer > 0
    ? targetMer
    : settings.targetMer;

  const tz = ianaTimezone?.trim() || null;
  const { y: currentYear, m: currentMonth } = tz
    ? shopLocalYmd(now, tz)
    : { y: now.getFullYear(), m: now.getMonth() + 1 };

  const rows: GoalMonthRow[] = Array.from({ length: 12 }, (_, i) => {
    const month = i + 1;
    const salesGoal = goals[i] ?? 0;
    const actual = mapGetMonth(salesByMonth, month);
    const spend = mapGetMonth(spendByMonth, month);
    const mer = calculateMer(actual, spend);
    const delta = actual - salesGoal;
    const pct = salesGoal > 0 ? (actual / salesGoal) * 100 : null;

    const isCurrent = currentYear === year && currentMonth === month;
    const isFuture =
      currentYear === year ? month > currentMonth : currentYear < year;

    let expectedPct: number | null = null;
    if (isCurrent) {
      const { daysElapsed, daysInMonth } = calendarDaysElapsedInMonth(
        year,
        month,
        now,
        tz,
      );
      expectedPct = daysInMonth > 0 ? daysElapsed / daysInMonth : 1;
    }

    const pace = paceStatus(actual, salesGoal, {
      expectedPct: isCurrent ? expectedPct : null,
      isFuture,
    });

    return {
      month,
      monthShort: MONTH_SHORT[i],
      monthLong: MONTH_LONG[i],
      salesGoal,
      actual,
      spend,
      mer,
      delta,
      pct,
      pace,
      isCurrent,
      isFuture,
    };
  });

  const throughMonth =
    currentYear === year
      ? currentMonth
      : currentYear > year
        ? 12
        : 0;

  let ytdGoal = 0;
  let ytdActual = 0;
  for (let m = 1; m <= throughMonth; m++) {
    ytdGoal += goals[m - 1] ?? 0;
    ytdActual += mapGetMonth(salesByMonth, m);
  }

  const yearGoal = goals.reduce((a, b) => a + b, 0);
  let yearActual = 0;
  for (let m = 1; m <= 12; m++) {
    yearActual += mapGetMonth(salesByMonth, m);
  }

  const forecast = buildMonthCloseForecast({
    year,
    goals,
    salesByMonth,
    spendByMonth,
    targetMer: rail,
    now,
    ianaTimezone: tz,
  });

  return {
    year,
    rows,
    ytd: {
      goal: ytdGoal,
      actual: ytdActual,
      pct: ytdGoal > 0 ? (ytdActual / ytdGoal) * 100 : null,
      delta: ytdActual - ytdGoal,
    },
    yearGoal,
    yearActual,
    forecast,
    targetMer: rail,
    breakEvenMer,
    marginPct: settings.marginPct,
  };
}

export function parseGoalsYear(
  raw: string | null,
  now = new Date(),
  ianaTimezone?: string | null,
): number {
  const n = Number.parseInt(String(raw ?? ""), 10);
  if (!Number.isInteger(n) || n < 2000 || n > 2100) {
    const tz = ianaTimezone?.trim() || null;
    return tz ? shopLocalYmd(now, tz).y : now.getFullYear();
  }
  return n;
}

export type SalesGoalPeriodKey = "mtd" | "qtd" | "ytd";

export interface SalesGoalPeriodYoy {
  priorActual: number;
  pct: number | null;
  tone: GoalPaceTone;
}

/** MTD / QTD / YTD sales vs plan — no spend / MER. */
export interface SalesGoalPeriod {
  key: SalesGoalPeriodKey;
  label: string;
  periodHint: string;
  actual: number;
  goal: number;
  /** actual ÷ goal × 100; null when no goal. */
  progressPct: number | null;
  /** Calendar share of the window elapsed (0–100). */
  calendarPct: number;
  pace: GoalPace;
  yoy: SalesGoalPeriodYoy;
}

export interface SalesGoalPeriods {
  mtd: SalesGoalPeriod;
  qtd: SalesGoalPeriod;
  ytd: SalesGoalPeriod;
}

function quarterOfMonth(month: number): number {
  return Math.ceil(month / 3);
}

function monthsInQuarter(quarter: number): number[] {
  const start = (quarter - 1) * 3 + 1;
  return [start, start + 1, start + 2];
}

function sumMonths(
  months: number[],
  goals: number[],
  salesByMonth: Map<number, number>,
): { actual: number; goal: number } {
  let actual = 0;
  let goal = 0;
  for (const m of months) {
    actual += mapGetMonth(salesByMonth, m);
    goal += goals[m - 1] ?? 0;
  }
  return { actual, goal };
}

function sumPriorMonths(months: number[], priorYearMonthly: number[]): number {
  let total = 0;
  for (const m of months) {
    const v = priorYearMonthly[m - 1];
    total += Number.isFinite(v) ? (v as number) : 0;
  }
  return total;
}

function yoyFrom(actual: number, priorActual: number): SalesGoalPeriodYoy {
  const pct =
    priorActual > 0 && Number.isFinite(actual)
      ? ((actual - priorActual) / priorActual) * 100
      : null;
  let tone: GoalPaceTone = "flat";
  if (pct != null) {
    if (pct > 0) tone = "up";
    else if (pct < 0) tone = "down";
  }
  return { priorActual, pct, tone };
}

function calendarPctInMonthSpan(
  year: number,
  months: number[],
  now: Date,
  ianaTimezone?: string | null,
): number {
  if (months.length === 0) return 0;
  let totalDays = 0;
  let elapsed = 0;
  const tz = ianaTimezone?.trim() || null;
  const { y: nowY, m: nowM, d: nowD } = tz
    ? shopLocalYmd(now, tz)
    : {
        y: now.getFullYear(),
        m: now.getMonth() + 1,
        d: now.getDate(),
      };

  for (const m of months) {
    const dim = daysInCalendarMonth(year, m);
    totalDays += dim;
    if (nowY > year || (nowY === year && nowM > m)) {
      elapsed += dim;
    } else if (nowY === year && nowM === m) {
      elapsed += Math.min(Math.max(nowD, 0), dim);
    }
  }
  if (totalDays <= 0) return 0;
  return Math.min(100, Math.max(0, (elapsed / totalDays) * 100));
}

/**
 * MTD / QTD / YTD sales vs monthly plan.
 * QTD sums current-quarter months (through now) from salesByMonth + goals.
 * YoY uses priorYearMonthly for the same month windows (full prior months).
 */
export function buildSalesGoalPeriods(params: {
  year: number;
  goals: number[];
  salesByMonth: Map<number, number>;
  priorYearMonthly: number[];
  now?: Date;
  ianaTimezone?: string | null;
}): SalesGoalPeriods {
  const now = params.now ?? new Date();
  const goals =
    params.goals.length === 12
      ? params.goals
      : Array.from({ length: 12 }, (_, i) => params.goals[i] ?? 0);
  const prior =
    params.priorYearMonthly.length >= 12
      ? params.priorYearMonthly
      : Array.from({ length: 12 }, (_, i) => params.priorYearMonthly[i] ?? 0);

  const { year, salesByMonth } = params;
  const tz = params.ianaTimezone?.trim() || null;
  const { y: nowYear, m: nowMonth } = tz
    ? shopLocalYmd(now, tz)
    : { y: now.getFullYear(), m: now.getMonth() + 1 };

  let throughMonth: number;
  let live: boolean;
  if (year < nowYear) {
    throughMonth = 12;
    live = false;
  } else if (year > nowYear) {
    throughMonth = 0;
    live = false;
  } else {
    throughMonth = nowMonth;
    live = true;
  }

  const refMonth = throughMonth > 0 ? throughMonth : 1;
  const quarter = quarterOfMonth(refMonth);
  const qMonths = monthsInQuarter(quarter).filter(
    (m) => throughMonth === 0 || m <= throughMonth,
  );
  const ytdMonths =
    throughMonth > 0
      ? Array.from({ length: throughMonth }, (_, i) => i + 1)
      : [];

  // --- MTD ---
  const mtdActual =
    throughMonth > 0 ? mapGetMonth(salesByMonth, throughMonth) : 0;
  const mtdGoal = throughMonth > 0 ? (goals[throughMonth - 1] ?? 0) : 0;
  let mtdCalendarPct = 0;
  let mtdExpected: number | null = null;
  const mtdFuture = year > nowYear || throughMonth === 0;
  if (year < nowYear) {
    mtdCalendarPct = 100;
  } else if (live && throughMonth === nowMonth) {
    const { daysElapsed, daysInMonth } = calendarDaysElapsedInMonth(
      year,
      throughMonth,
      now,
      tz,
    );
    mtdCalendarPct =
      daysInMonth > 0 ? (daysElapsed / daysInMonth) * 100 : 0;
    mtdExpected = daysInMonth > 0 ? daysElapsed / daysInMonth : 1;
  } else if (year === nowYear && throughMonth < nowMonth) {
    mtdCalendarPct = 100;
  }

  const mtd: SalesGoalPeriod = {
    key: "mtd",
    label: "MTD",
    periodHint: `${MONTH_SHORT[refMonth - 1]} ${year}`,
    actual: mtdActual,
    goal: mtdGoal,
    progressPct: mtdGoal > 0 ? (mtdActual / mtdGoal) * 100 : null,
    calendarPct: mtdCalendarPct,
    pace: paceStatus(mtdActual, mtdGoal, {
      expectedPct: mtdExpected,
      isFuture: mtdFuture,
    }),
    yoy: yoyFrom(
      mtdActual,
      throughMonth > 0 ? (prior[throughMonth - 1] ?? 0) : 0,
    ),
  };

  // --- QTD ---
  const qtdSum = sumMonths(qMonths, goals, salesByMonth);
  const qtdPrior = sumPriorMonths(qMonths, prior);
  let qtdCalendarPct = 0;
  let qtdExpected: number | null = null;
  if (year < nowYear) {
    qtdCalendarPct = 100;
  } else if (live) {
    qtdCalendarPct = calendarPctInMonthSpan(year, qMonths, now, tz);
    qtdExpected =
      qtdCalendarPct > 0 && qtdCalendarPct < 100
        ? qtdCalendarPct / 100
        : qtdCalendarPct >= 100
          ? null
          : 0;
  } else if (year > nowYear) {
    qtdCalendarPct = 0;
  }

  const qtd: SalesGoalPeriod = {
    key: "qtd",
    label: "QTD",
    periodHint: `Q${quarter} ${year}`,
    actual: qtdSum.actual,
    goal: qtdSum.goal,
    progressPct: qtdSum.goal > 0 ? (qtdSum.actual / qtdSum.goal) * 100 : null,
    calendarPct: qtdCalendarPct,
    pace: paceStatus(qtdSum.actual, qtdSum.goal, {
      expectedPct: qtdExpected,
      isFuture: year > nowYear || throughMonth === 0,
    }),
    yoy: yoyFrom(qtdSum.actual, qtdPrior),
  };

  // --- YTD ---
  const ytdSum = sumMonths(ytdMonths, goals, salesByMonth);
  const ytdPrior = sumPriorMonths(ytdMonths, prior);
  let ytdCalendarPct = 0;
  let ytdExpected: number | null = null;
  if (year < nowYear) {
    ytdCalendarPct = 100;
  } else if (live) {
    ytdCalendarPct = calendarPctInMonthSpan(year, ytdMonths, now, tz);
    ytdExpected =
      ytdCalendarPct > 0 && ytdCalendarPct < 100
        ? ytdCalendarPct / 100
        : ytdCalendarPct >= 100
          ? null
          : 0;
  } else if (year > nowYear) {
    ytdCalendarPct = 0;
  }

  const ytd: SalesGoalPeriod = {
    key: "ytd",
    label: "YTD",
    periodHint: String(year),
    actual: ytdSum.actual,
    goal: ytdSum.goal,
    progressPct: ytdSum.goal > 0 ? (ytdSum.actual / ytdSum.goal) * 100 : null,
    calendarPct: ytdCalendarPct,
    pace: paceStatus(ytdSum.actual, ytdSum.goal, {
      expectedPct: ytdExpected,
      isFuture: year > nowYear || throughMonth === 0,
    }),
    yoy: yoyFrom(ytdSum.actual, ytdPrior),
  };

  return { mtd, qtd, ytd };
}

function monthMapToArray(map: Map<number, number>): number[] {
  return Array.from({ length: 12 }, (_, i) => {
    const v = map.get(i + 1);
    return Number.isFinite(v) ? (v as number) : 0;
  });
}

/**
 * Year / YoY sales-by-day for goals boards.
 * HARD-STOP: never unbounded GraphQL — sample desk or SalesDayFact only.
 * Fail-closed: incomplete facts → salesError (never silent $0 YoY baselines).
 */
export async function loadSalesByDayForGoalsRange(
  shopId: string,
  ianaTimezone: string | null | undefined,
  range: DateRange,
  useSampleDesk: boolean,
): Promise<{ salesByDay: Map<string, number>; salesError: string | null }> {
  if (useSampleDesk) {
    return {
      salesByDay: await fetchSampleSalesByDay(shopId, range),
      salesError: null,
    };
  }
  try {
    const coverage = await getSalesFactsCoverage(
      shopId,
      range,
      new Date(),
      ianaTimezone,
    );
    if (
      !coverage.periodExceedsFactWindow &&
      coverage.expectedClosedDays > 0 &&
      !coverage.complete
    ) {
      return {
        salesByDay: new Map(),
        salesError: `Sales day facts incomplete (${coverage.factDays}/${coverage.expectedClosedDays} days) — YoY baselines withheld`,
      };
    }
    return {
      salesByDay: await getSalesFactsByDay(shopId, range),
      salesError: null,
    };
  } catch (err) {
    return {
      salesByDay: new Map(),
      salesError:
        err instanceof Error ? err.message : "Failed to load sales facts",
    };
  }
}

/**
 * Overview MTD/QTD/YTD sales-vs-plan periods for the current calendar year.
 * Returns null on failure so Overview paint never breaks.
 */
export async function loadOverviewGoalPeriods(
  shopId: string,
  ianaTimezone: string | null | undefined,
  useSampleDesk: boolean,
  now = new Date(),
): Promise<SalesGoalPeriods | null> {
  try {
    const tz = ianaTimezone?.trim() || null;
    const year = tz ? shopLocalYmd(now, tz).y : now.getFullYear();
    const range = yearDateRange(year, tz);
    const priorYear = year - 1;
    const priorRange = yearDateRange(priorYear, tz);
    const settings = await getOrCreateSettings(shopId);

    const [currentSales, priorSales] = await Promise.all([
      loadSalesByDayForGoalsRange(
        shopId,
        tz,
        range,
        useSampleDesk,
      ),
      loadSalesByDayForGoalsRange(
        shopId,
        tz,
        priorRange,
        useSampleDesk,
      ),
    ]);

    const salesByMonth = salesByMonthFromDayMap(
      year,
      currentSales.salesByDay,
      now,
      tz,
    );
    const priorSalesByMonth = salesByMonthFromDayMap(
      priorYear,
      priorSales.salesByDay,
      now,
      tz,
    );
    const priorYearMonthly = monthMapToArray(priorSalesByMonth);

    const spendOpts = useSampleDesk
      ? { sampleOnly: true as const, ianaTimezone: tz }
      : { excludeSample: true as const, ianaTimezone: tz };
    const spendByMonth = await spendByMonthMap(shopId, year, spendOpts, now);

    const board = await buildYearBoard(
      shopId,
      year,
      salesByMonth,
      spendByMonth,
      settings.targetMer,
      now,
      tz,
    );

    return buildSalesGoalPeriods({
      year,
      goals: board.rows.map((r) => r.salesGoal),
      salesByMonth,
      priorYearMonthly,
      now,
      ianaTimezone: tz,
    });
  } catch {
    return null;
  }
}
