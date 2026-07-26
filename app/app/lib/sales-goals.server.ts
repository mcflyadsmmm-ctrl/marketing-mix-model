import { calculateBreakEvenMer, calculateMer } from "@mcfly/mer-core";

import prisma from "../db.server";
import { getOrCreateSettings } from "./mer-dashboard.server";
import type { DateRange } from "./periods";

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

export function monthDateRange(year: number, month: number): DateRange {
  const start = startOfLocalDay(new Date(year, month - 1, 1));
  const end = endOfLocalDay(new Date(year, month, 0));
  return {
    start,
    end,
    label: `${MONTH_LONG[month - 1]} ${year}`,
  };
}

export function yearDateRange(year: number): DateRange {
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
): Map<number, number> {
  const months = new Map<number, number>();
  for (let m = 1; m <= 12; m++) months.set(m, 0);

  const prefix = `${year}-`;
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const todayKey =
    currentYear === year
      ? `${year}-${String(currentMonth).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`
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
 * Attribute spend entries to calendar months by periodStart (local).
 * Future months in the current year stay 0; current month is MTD-safe via caller window.
 */
export async function spendByMonthMap(
  shopId: string,
  year: number,
  options?: { sampleOnly?: boolean; excludeSample?: boolean },
  now = new Date(),
): Promise<Map<number, number>> {
  const months = new Map<number, number>();
  for (let m = 1; m <= 12; m++) months.set(m, 0);

  const yearStart = startOfLocalDay(new Date(year, 0, 1));
  let yearEnd = endOfLocalDay(new Date(year, 11, 31));
  if (now.getFullYear() === year) {
    yearEnd = endOfLocalDay(now);
  } else if (now.getFullYear() < year) {
    return months;
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

  const maxMonth =
    now.getFullYear() === year
      ? now.getMonth() + 1
      : now.getFullYear() > year
        ? 12
        : 0;

  for (const entry of entries) {
    const m = entry.periodStart.getMonth() + 1;
    const y = entry.periodStart.getFullYear();
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
): { daysElapsed: number; daysInMonth: number; remainingDays: number } {
  const daysInMonth = daysInCalendarMonth(year, month);
  const sameMonth =
    now.getFullYear() === year && now.getMonth() + 1 === month;
  if (!sameMonth) {
    const isPast =
      now.getFullYear() > year ||
      (now.getFullYear() === year && now.getMonth() + 1 > month);
    const daysElapsed = isPast ? daysInMonth : 0;
    return {
      daysElapsed,
      daysInMonth,
      remainingDays: daysInMonth - daysElapsed,
    };
  }
  const daysElapsed = Math.min(Math.max(now.getDate(), 1), daysInMonth);
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
}): MonthCloseForecast | null {
  const now = params.now ?? new Date();
  const { year, goals, salesByMonth, spendByMonth, targetMer } = params;

  if (now.getFullYear() !== year) return null;

  const month = now.getMonth() + 1;
  const monthGoal = goals[month - 1] ?? 0;
  const mtdSales = mapGetMonth(salesByMonth, month);
  const mtdSpend = mapGetMonth(spendByMonth, month);
  const mtdMer = calculateMer(mtdSales, mtdSpend);
  const { daysElapsed, daysInMonth, remainingDays } =
    calendarDaysElapsedInMonth(year, month, now);

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
): Promise<GoalsYearBoard> {
  const settings = await getOrCreateSettings(shopId);
  const goals = await listSalesGoals(shopId, year);
  const breakEvenMer = calculateBreakEvenMer(settings.marginPct);
  const rail = Number.isFinite(targetMer) && targetMer > 0
    ? targetMer
    : settings.targetMer;

  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

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
): number {
  const n = Number.parseInt(String(raw ?? ""), 10);
  if (!Number.isInteger(n) || n < 2000 || n > 2100) {
    return now.getFullYear();
  }
  return n;
}
