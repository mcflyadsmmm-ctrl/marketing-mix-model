import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("../db.server", () => ({
  default: {
    salesGoal: { findMany: vi.fn(), upsert: vi.fn(), deleteMany: vi.fn() },
    spendEntry: { findMany: vi.fn() },
    $transaction: vi.fn(async (ops: unknown[]) => Promise.all(ops as Promise<unknown>[])),
  },
}));

vi.mock("./mer-dashboard.server", () => ({
  getOrCreateSettings: vi.fn(),
  confirmedBreakEvenMer: vi.fn(() => null),
}));

import { impliedSpendCeiling, impliedSpendCeilingCaption } from "./implied-spend-ceiling";
import { FORECAST_MIN_DAYS } from "./overview-mix-forecast";
import { SalesGoalGauges } from "../components/SalesGoalGauges";
import { DeskCurrencyContext } from "./desk-currency";
import { LIVE_UNPAID_INGEST_DAYS } from "./live-unpark";
import {
  formatGoalInput,
  goalsAtYoyGrowth,
  impliedIdentifiedBuyers,
  IMPLIED_IDENTIFIED_BUYERS_MIN_ORDERS,
  parseGoalInput,
  returningSalesByMonthFromOrders,
  thisMonthPlanCopyText,
  typedGoalAmount,
} from "./sales-goals";
import {
  buildMonthCloseForecast,
  buildSalesGoalPeriods,
  calendarDaysElapsedInMonth,
  daysInCalendarMonth,
  merVsRails,
  monthDateRange,
  paceStatus,
  salesByMonthFromDayMap,
  spendByMonthMap,
  upsertYearSalesGoals,
  yearDateRange,
  type SalesGoalPeriod,
  type SalesGoalPeriods,
} from "./sales-goals.server";
import { shopLocalDayKey, shopLocalDayRange, shopLocalYmd } from "./shop-local-day";
import prisma from "../db.server";

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function dayKey(year: number, month: number, day: number): string {
  return `${year}-${pad2(month)}-${pad2(day)}`;
}

function fillMonthDays(
  year: number,
  month: number,
  throughDay: number,
  salesForDay: number | ((day: number) => number),
  into: Map<string, number> = new Map(),
): Map<string, number> {
  for (let d = 1; d <= throughDay; d += 1) {
    const sales = typeof salesForDay === "function" ? salesForDay(d) : salesForDay;
    into.set(dayKey(year, month, d), sales);
  }
  return into;
}

describe("salesByMonthFromDayMap", () => {
  it("sums a finished month and caps the live month at shop-local today", () => {
    const now = new Date(2026, 6, 15); // Jul 15
    const sales = fillMonthDays(2026, 1, 31, 10);
    fillMonthDays(2026, 7, 15, (d) => (d === 1 ? 200 : d === 15 ? 50 : 0), sales);
    sales.set("2026-07-20", 999); // future day in month — excluded
    sales.set("2025-12-31", 50);
    const months = salesByMonthFromDayMap(2026, sales, now);
    expect(months.get(1)).toBe(310);
    expect(months.get(7)).toBe(250);
    expect(months.has(12)).toBe(false);
  });

  it("leaves months with no certified days absent — not $0", () => {
    const months = salesByMonthFromDayMap(2026, new Map(), new Date(2026, 8, 16));
    expect(months.size).toBe(0);
    expect(months.get(1)).toBeUndefined();
  });

  it("does not paint a partial month as the month — eight days is still filling", () => {
    const now = new Date(2026, 8, 22); // Sep 22 — July is closed
    const sales = fillMonthDays(2026, 7, 8, 6_025);
    const months = salesByMonthFromDayMap(2026, sales, now);
    expect(months.has(7)).toBe(false);
    expect(months.get(7)).toBeUndefined();
  });

  it("does not paint a stub unpaid slice as July Actual", () => {
    const now = new Date(Date.UTC(2026, 8, 22));
    const sales = new Map<string, number>();
    // 90-day unpaid window starting ~Jun 24: July has eight days, not 31.
    for (let d = 24; d <= 31; d += 1) {
      sales.set(dayKey(2026, 7, d), 6_025);
    }
    const months = salesByMonthFromDayMap(2026, sales, now);
    expect(months.has(7)).toBe(false);
    expect([...months.values()].every((n) => n !== 0 || n > 0)).toBe(true);
    expect(months.get(7)).not.toBe(0);
  });
});

describe("paceStatus", () => {
  it("marks in-progress months ahead / on track / behind vs expected calendar share", () => {
    expect(paceStatus(110, 100, { expectedPct: 0.5 }).kind).toBe("ahead");
    expect(paceStatus(50, 100, { expectedPct: 0.5 }).kind).toBe("on_track");
    expect(paceStatus(40, 100, { expectedPct: 0.5 }).kind).toBe("behind");
  });

  it("marks closed months met / close / miss", () => {
    expect(paceStatus(100, 100).kind).toBe("met");
    expect(paceStatus(96, 100).kind).toBe("close");
    expect(paceStatus(90, 100).kind).toBe("miss");
  });

  it("labels future empty months upcoming", () => {
    expect(paceStatus(0, 100, { isFuture: true }).kind).toBe("upcoming");
  });
});

describe("calendarDaysElapsedInMonth", () => {
  it("counts MTD days in the current month", () => {
    const now = new Date(2026, 6, 23);
    const { daysElapsed, daysInMonth, remainingDays } =
      calendarDaysElapsedInMonth(2026, 7, now);
    expect(daysElapsed).toBe(23);
    expect(daysInMonth).toBe(31);
    expect(remainingDays).toBe(8);
  });

  it("uses shop IANA day-of-month, not host-local getDate()", () => {
    // 2026-07-15 02:00 UTC = Jul 15 in Asia/Tokyo, still Jul 14 evening in LA.
    const now = new Date("2026-07-15T02:00:00.000Z");
    expect(calendarDaysElapsedInMonth(2026, 7, now, "Asia/Tokyo").daysElapsed).toBe(
      15,
    );
    expect(
      calendarDaysElapsedInMonth(2026, 7, now, "America/Los_Angeles").daysElapsed,
    ).toBe(14);
  });
});

describe("Goals shop IANA under process TZ=Asia/Tokyo", () => {
  it("salesByMonthFromDayMap caps MTD at shop-local today, not host getDate()", () => {
    // Instant is Aug 1 01:00 in Tokyo, still Jul 31 afternoon in Denver.
    const now = new Date("2026-07-31T16:00:00.000Z");
    expect(shopLocalYmd(now, "Asia/Tokyo")).toEqual({ y: 2026, m: 8, d: 1 });
    expect(shopLocalYmd(now, "America/Denver")).toEqual({
      y: 2026,
      m: 7,
      d: 31,
    });

    const sales = fillMonthDays(2026, 7, 31, (d) => (d === 31 ? 100 : 0));
    sales.set("2026-08-01", 50);
    sales.set("2026-08-02", 999); // future for Tokyo Aug 1

    const tokyo = salesByMonthFromDayMap(2026, sales, now, "Asia/Tokyo");
    expect(tokyo.get(7)).toBe(100);
    expect(tokyo.get(8)).toBe(50); // Aug 1 only; Aug 2 capped out

    const denver = salesByMonthFromDayMap(2026, sales, now, "America/Denver");
    expect(denver.get(7)).toBe(100);
    // August is future for Denver on Jul 31 — not painted as the month.
    expect(denver.has(8)).toBe(false);
  });

  it("spendByMonthMap buckets UTC-midnight CSV stamps by UTC month (not shopLocalYmd)", async () => {
    const now = new Date("2026-07-31T16:00:00.000Z");
    // Production stamp: utcMidnightFromDayKey("2026-07-01") — Denver local would be Jun 30.
    const periodStart = new Date("2026-07-01T00:00:00.000Z");
    expect(shopLocalDayKey(periodStart, "America/Denver")).toBe("2026-06-30");

    vi.mocked(prisma.spendEntry.findMany).mockResolvedValue([
      { amount: 1_000, periodStart },
    ] as never);

    const denver = await spendByMonthMap(
      "shop_1",
      2026,
      { ianaTimezone: "America/Denver" },
      now,
    );
    expect(denver.get(7)).toBe(1_000);
    expect(denver.get(6)).toBe(0);

    const tokyo = await spendByMonthMap(
      "shop_1",
      2026,
      { ianaTimezone: "Asia/Tokyo" },
      now,
    );
    expect(tokyo.get(7)).toBe(1_000);
    expect(tokyo.get(8)).toBe(0);
  });

  it("buildSalesGoalPeriods MTD calendar share follows Asia/Tokyo", () => {
    const now = new Date("2026-07-15T02:00:00.000Z");
    const goals = Array.from({ length: 12 }, () => 100_000);
    const salesByMonth = new Map<number, number>();
    for (let m = 1; m <= 12; m++) salesByMonth.set(m, m === 7 ? 50_000 : 0);

    const periods = buildSalesGoalPeriods({
      year: 2026,
      goals,
      salesByMonth,
      priorYearMonthly: Array.from({ length: 12 }, () => 0),
      now,
      ianaTimezone: "Asia/Tokyo",
    });
    expect(periods.mtd.calendarPct).toBeCloseTo((15 / 31) * 100, 5);
    expect(periods.mtd.periodHint).toBe("Jul 2026");
  });
});

describe("yearDateRange / monthDateRange shop IANA", () => {
  it("uses shopLocalDayRange for year bounds when ianaTimezone is passed", () => {
    const tz = "America/Denver";
    const range = yearDateRange(2026, tz);
    expect(range.start.toISOString()).toBe(
      shopLocalDayRange("2026-01-01", tz).start.toISOString(),
    );
    expect(range.end.toISOString()).toBe(
      shopLocalDayRange("2026-12-31", tz).end.toISOString(),
    );
    expect(range.label).toBe("2026");
  });

  it("uses shopLocalDayRange for month bounds when ianaTimezone is passed", () => {
    const tz = "Pacific/Auckland";
    const range = monthDateRange(2026, 7, tz);
    expect(range.start.toISOString()).toBe(
      shopLocalDayRange("2026-07-01", tz).start.toISOString(),
    );
    expect(range.end.toISOString()).toBe(
      shopLocalDayRange("2026-07-31", tz).end.toISOString(),
    );
    expect(range.label).toBe("July 2026");
  });

  it("differs from UTC host-midnight for western US year start", () => {
    const tz = "America/Los_Angeles";
    const shopRange = yearDateRange(2026, tz);
    // Shop-local Jan 1 00:00 America/Los_Angeles = 2026-01-01T08:00:00.000Z
    expect(shopRange.start.toISOString()).toBe("2026-01-01T08:00:00.000Z");
    // Host-local fallback is process-TZ dependent — only assert shop path is fixed.
    const utcRange = yearDateRange(2026, "UTC");
    expect(utcRange.start.toISOString()).toBe("2026-01-01T00:00:00.000Z");
    expect(shopRange.start.getTime()).not.toBe(utcRange.start.getTime());
  });
});

describe("buildSalesGoalPeriods", () => {
  const now = new Date(2026, 6, 15); // Jul 15 — Q3

  function monthMap(values: Partial<Record<number, number>>): Map<number, number> {
    const m = new Map<number, number>();
    for (let i = 1; i <= 12; i++) m.set(i, values[i] ?? 0);
    return m;
  }

  it("builds MTD / QTD / YTD actual, goal, progress, pace, and YoY", () => {
    const goals = [
      100_000, 100_000, 100_000, 100_000, 100_000, 100_000, 100_000, 100_000,
      100_000, 100_000, 100_000, 100_000,
    ];
    const salesByMonth = monthMap({
      1: 110_000,
      2: 95_000,
      3: 100_000,
      4: 105_000,
      5: 98_000,
      6: 102_000,
      7: 52_000, // MTD mid-month — slightly ahead of calendar share
    });
    const priorYearMonthly = [
      90_000, 90_000, 90_000, 90_000, 90_000, 90_000, 80_000, 90_000, 90_000,
      90_000, 90_000, 90_000,
    ];

    const periods = buildSalesGoalPeriods({
      year: 2026,
      goals,
      salesByMonth,
      priorYearMonthly,
      now,
    });

    expect(periods.mtd.label).toBe("This month");
    expect(periods.mtd.periodHint).toBe("Jul 2026");
    expect(periods.mtd.actual).toBe(52_000);
    expect(periods.mtd.goal).toBe(100_000);
    expect(periods.mtd.progressPct).toBe(52);
    expect(periods.mtd.calendarPct).toBeCloseTo((15 / 31) * 100, 5);
    expect(periods.mtd.pace.kind).toBe("ahead"); // 52k vs 100k×(15/31)≈48.4k
    expect(periods.mtd.yoy.priorActual).toBe(80_000);
    expect(periods.mtd.yoy.pct).toBeCloseTo(((52_000 - 80_000) / 80_000) * 100, 5);
    expect(periods.mtd.yoy.tone).toBe("down");

    // Q3 = Jul only so far
    expect(periods.qtd.label).toBe("This quarter");
    expect(periods.qtd.periodHint).toBe("Q3 2026");
    expect(periods.qtd.actual).toBe(52_000);
    expect(periods.qtd.goal).toBe(100_000);
    expect(periods.qtd.yoy.priorActual).toBe(80_000);

    // YTD Jan–Jul
    expect(periods.ytd.label).toBe("This year");
    const ytdActual =
      110_000 + 95_000 + 100_000 + 105_000 + 98_000 + 102_000 + 52_000;
    expect(periods.ytd.actual).toBe(ytdActual);
    expect(periods.ytd.goal).toBe(700_000);
    expect(periods.ytd.progressPct).toBeCloseTo((ytdActual / 700_000) * 100, 5);
    expect(periods.ytd.yoy.priorActual).toBe(90_000 * 6 + 80_000);
    expect(periods.ytd.yoy.tone).toBe("up");
    expect(periods.mtd.spend).toBe(0);
    expect(periods.mtd.mer).toBeNull();
    expect(periods.qtd.spend).toBe(0);
    expect(periods.ytd.spend).toBe(0);
  });

  it("rolls uploaded spend into MTD / QTD / YTD and computes cash MER", () => {
    const goals = Array.from({ length: 12 }, () => 100_000);
    const salesByMonth = monthMap({
      1: 110_000,
      2: 95_000,
      6: 102_000,
      7: 52_000,
    });
    const spendByMonth = monthMap({
      1: 40_000,
      2: 40_000,
      6: 34_000,
      7: 20_000,
    });

    const periods = buildSalesGoalPeriods({
      year: 2026,
      goals,
      salesByMonth,
      spendByMonth,
      priorYearMonthly: Array.from({ length: 12 }, () => 0),
      now,
    });

    expect(periods.mtd.spend).toBe(20_000);
    expect(periods.mtd.mer).toBeCloseTo(52_000 / 20_000, 5);
    expect(periods.qtd.spend).toBe(20_000);
    expect(periods.qtd.mer).toBeCloseTo(52_000 / 20_000, 5);
    expect(periods.ytd.spend).toBe(40_000 + 40_000 + 34_000 + 20_000);
    const ytdActual = 110_000 + 95_000 + 102_000 + 52_000;
    expect(periods.ytd.actual).toBe(ytdActual);
    expect(periods.ytd.mer).toBeCloseTo(ytdActual / periods.ytd.spend, 5);

    const withRails = buildSalesGoalPeriods({
      year: 2026,
      goals,
      salesByMonth,
      spendByMonth,
      priorYearMonthly: Array.from({ length: 12 }, () => 0),
      now,
      targetMer: 3,
      breakEvenMer: 2,
    });
    expect(withRails.mtd.merRails.tone).toBe("up");
    expect(withRails.mtd.merRails.label).toBe("Above break-even");
    expect(withRails.mtd.mer).toBeCloseTo(2.6, 5);
  });

  it("does not treat missing months as $0 Actual / YTD %", () => {
    const goals = Array.from({ length: 12 }, () => 100_000);
    const salesByMonth = new Map<number, number>([[7, 52_000]]);
    const priorYearMonthly = Array.from({ length: 12 }, () => null);

    const periods = buildSalesGoalPeriods({
      year: 2026,
      goals,
      salesByMonth,
      priorYearMonthly,
      now,
    });

    expect(periods.mtd.actual).toBe(52_000);
    expect(periods.qtd.actual).toBe(52_000);
    expect(periods.ytd.actual).toBeNull();
    expect(periods.ytd.progressPct).toBeNull();
    expect(periods.ytd.yoy.priorActual).toBeNull();
    expect(periods.ytd.yoy.pct).toBeNull();
    expect(periods.mtd.yoy.pct).toBeNull();
  });

  it("returns null progress and none pace when goals are empty", () => {
    const periods = buildSalesGoalPeriods({
      year: 2026,
      goals: Array.from({ length: 12 }, () => 0),
      salesByMonth: monthMap({ 7: 40_000 }),
      priorYearMonthly: Array.from({ length: 12 }, () => 0),
      now,
    });
    expect(periods.mtd.progressPct).toBeNull();
    expect(periods.mtd.pace.kind).toBe("none");
    expect(periods.qtd.progressPct).toBeNull();
    expect(periods.ytd.progressPct).toBeNull();
  });
});

describe("merVsRails", () => {
  it("labels below break-even as down", () => {
    const rails = merVsRails(1.5, 3, 2);
    expect(rails.tone).toBe("down");
    expect(rails.label).toBe("Below break-even");
    expect(rails.vsTargetAbs).toBeCloseTo(1.5 - 3, 5);
    expect(rails.vsBeAbs).toBeCloseTo(1.5 - 2, 5);
  });

  it("labels above break-even but short of target as up", () => {
    const rails = merVsRails(2.4, 3, 2);
    expect(rails.tone).toBe("up");
    expect(rails.label).toBe("Above break-even");
    expect(rails.vsBeAbs).toBeCloseTo(0.4, 5);
    expect(rails.vsTargetAbs).toBeCloseTo(-0.6, 5);
  });

  it("labels near-target MER as flat", () => {
    const rails = merVsRails(2.9, 3, 2);
    expect(rails.tone).toBe("flat");
    expect(rails.label).toBe("On target");
    expect(rails.vsTargetAbs).toBeCloseTo(-0.1, 5);
  });

  it("returns flat dashes when MER is missing", () => {
    const rails = merVsRails(null, 3, 2);
    expect(rails.tone).toBe("flat");
    expect(rails.label).toBe("—");
    expect(rails.vsTargetAbs).toBeNull();
    expect(rails.vsBeAbs).toBeNull();
  });

  it("does not invent SAMPLE profit — empty BE stays a dash, not vs break-even", () => {
    const rails = merVsRails(3.5, 3.5, null);
    expect(rails.label).not.toMatch(/break-even/i);
    expect(rails.vsBeAbs).toBeNull();
    const yearBoard = readFileSync(
      join(dirname(fileURLToPath(import.meta.url)), "./sales-goals.server.ts"),
      "utf8",
    );
    expect(yearBoard).not.toMatch(
      /marginIsConfirmed\(settings\)\s*\|\|\s*settings\.useSampleDesk/,
    );
    expect(yearBoard).not.toMatch(
      /settings\.useSampleDesk\s*\?\s*SAMPLE_DESK_MARGIN_PCT/,
    );
  });
});

describe("impliedSpendCeiling", () => {
  it("returns salesGoal ÷ targetMer when both positive", () => {
    expect(impliedSpendCeiling(100_000, 4)).toBeCloseTo(25_000, 5);
    expect(impliedSpendCeiling(90_000, 3)).toBeCloseTo(30_000, 5);
  });

  it("returns null when goal or target is missing", () => {
    expect(impliedSpendCeiling(0, 4)).toBeNull();
    expect(impliedSpendCeiling(100_000, 0)).toBeNull();
    expect(impliedSpendCeiling(100_000, null)).toBeNull();
    expect(impliedSpendCeiling(100_000, undefined)).toBeNull();
  });

  it("labels period sales vs sales-goal ceilings without mixing them", () => {
    expect(impliedSpendCeilingCaption("period_sales", 4)).toMatch(
      /This period's Shopify sales ÷ 4\.00× target/,
    );
    expect(impliedSpendCeilingCaption("period_sales", 4)).toMatch(/not a bid cap/i);
    expect(impliedSpendCeilingCaption("period_sales", 4)).not.toMatch(/\$80k/);
    expect(impliedSpendCeilingCaption("sales_goal", 3)).toMatch(
      /Sales goal ÷ 3\.00× target/,
    );
    expect(impliedSpendCeilingCaption("sales_goal", 3)).toMatch(/Not net profit/);
  });
});

describe("parseGoalInput — empty vs typed $0", () => {
  it("treats an empty field as not on file, and typed 0 as a real $0 plan", () => {
    expect(parseGoalInput("")).toBeNull();
    expect(parseGoalInput("   ")).toBeNull();
    expect(parseGoalInput(null)).toBeNull();
    expect(parseGoalInput("0")).toBe(0);
    expect(parseGoalInput("0.00")).toBe(0);
    expect(parseGoalInput("$0")).toBe(0);
    expect(parseGoalInput("1000")).toBe(1000);
    expect(parseGoalInput("$1,000")).toBe(1000);
    expect(Number.isNaN(parseGoalInput("-1"))).toBe(true);
  });

  it("shows typed $0 in the field and leaves a cleared month blank", () => {
    expect(formatGoalInput(null)).toBe("");
    expect(formatGoalInput(undefined)).toBe("");
    expect(formatGoalInput(0)).toBe("0");
    expect(formatGoalInput(1200)).toBe("1200");
  });
});

describe("cleared months stay out of YTD goal sums", () => {
  it("skips a null plan month and keeps a typed $0 in the window", () => {
    const now = new Date(2026, 6, 15);
    const salesByMonth = new Map<number, number>();
    for (let m = 1; m <= 7; m += 1) salesByMonth.set(m, 10_000);
    const goals = [
      100_000,
      null,
      100_000,
      100_000,
      100_000,
      100_000,
      100_000,
      100_000,
      100_000,
      100_000,
      100_000,
      100_000,
    ];
    const skipped = buildSalesGoalPeriods({
      year: 2026,
      goals,
      salesByMonth,
      priorYearMonthly: Array.from({ length: 12 }, () => null),
      now,
    });
    expect(skipped.ytd.goal).toBe(600_000);
    expect(skipped.ytd.actual).toBe(60_000);
    expect(skipped.ytd.progressPct).toBe(10);
    expect(skipped.mtd.goal).toBe(100_000);
    expect(skipped.ytd.yoy.priorActual).toBeNull();
    expect(skipped.ytd.yoy.pct).toBeNull();

    const typedZero = [...goals];
    typedZero[1] = 0;
    const withZero = buildSalesGoalPeriods({
      year: 2026,
      goals: typedZero,
      salesByMonth,
      priorYearMonthly: Array.from({ length: 12 }, () => null),
      now,
    });
    expect(withZero.ytd.goal).toBe(600_000);
    expect(withZero.ytd.actual).toBe(70_000);
    expect(withZero.ytd.progressPct).toBeCloseTo((70_000 / 600_000) * 100, 5);
    expect(goalsAtYoyGrowth([90_000, null, 0, 80_000], 10)).toEqual([
      99_000,
      null,
      null,
      88_000,
    ]);
  });

  it("does not paint YTD ahead from Feb sales when February is blank", () => {
    const now = new Date(2026, 2, 15);
    const salesByMonth = new Map<number, number>([
      [1, 100_000],
      [2, 80_000],
      [3, 50_000],
    ]);
    const goals: Array<number | null> = [
      100_000,
      null,
      100_000,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
    ];
    const periods = buildSalesGoalPeriods({
      year: 2026,
      goals,
      salesByMonth,
      priorYearMonthly: Array.from({ length: 12 }, () => null),
      now,
    });
    expect(periods.ytd.actual).toBe(150_000);
    expect(periods.ytd.goal).toBe(200_000);
    expect(periods.qtd.actual).toBe(150_000);
    expect(periods.qtd.goal).toBe(200_000);
    expect(periods.ytd.progressPct).toBe(75);
    expect(periods.ytd.pace.kind).not.toBe("ahead");
    const janDays = daysInCalendarMonth(2026, 1);
    const marDays = daysInCalendarMonth(2026, 3);
    expect(periods.ytd.calendarPct).toBeCloseTo(
      ((janDays + 15) / (janDays + marDays)) * 100,
      5,
    );
    expect(periods.qtd.calendarPct).toBeCloseTo(periods.ytd.calendarPct, 5);
    const inflatedTick =
      ((janDays + daysInCalendarMonth(2026, 2) + 15) /
        (janDays + daysInCalendarMonth(2026, 2) + marDays)) *
      100;
    expect(periods.ytd.calendarPct).not.toBeCloseTo(inflatedTick, 5);
    expect(periods.ytd.yoy.pct).toBeNull();
  });
});

describe("typed $0 vs a cleared month", () => {
  it("keeps typed $0 as a plan amount and treats a cleared month as not on file", () => {
    expect(typedGoalAmount(0)).toBe(0);
    expect(typedGoalAmount(null)).toBeNull();
    expect(typedGoalAmount(undefined)).toBeNull();
    expect(typedGoalAmount(1200)).toBe(1200);
    expect(formatGoalInput(0)).toBe("0");
    expect(formatGoalInput(null)).toBe("");
  });

  it("copies Goal / Shopify Total Sales / Prior and never $0s a missing last year", () => {
    expect(
      thisMonthPlanCopyText({
        goal: null,
        actual: 50_000,
        prior: 40_000,
        currency: "USD",
      }),
    ).toBeNull();
    const missingPrior = thisMonthPlanCopyText({
      goal: 100_000,
      actual: 52_000,
      prior: null,
      currency: "USD",
    });
    expect(missingPrior).toMatch(/versus/i);
    expect(missingPrior).toMatch(/not on file/i);
    expect(missingPrior).not.toMatch(/last year \$0/i);
    const typedZero = thisMonthPlanCopyText({
      goal: 0,
      actual: 0,
      prior: null,
      currency: "USD",
    });
    expect(typedZero).toMatch(/\$0/);
    expect(typedZero).toMatch(/not on file/i);
    expect(
      thisMonthPlanCopyText({
        goal: 100_000,
        actual: 52_000,
        prior: 48_000,
        currency: "USD",
      }),
    ).toMatch(/\$48,000/);
  });
});

describe("SalesGoalGauges — null actual is not 0%", () => {
  function period(
    overrides: Partial<SalesGoalPeriod> & Pick<SalesGoalPeriod, "key" | "label">,
  ): SalesGoalPeriod {
    return {
      periodHint: "Mar 2026",
      actual: null,
      goal: 100_000,
      spend: 0,
      mer: null,
      merRails: { vsTargetAbs: null, vsBeAbs: null, tone: "flat", label: "—" },
      progressPct: null,
      calendarPct: 48,
      pace: { kind: "none", label: "—", tone: "flat" },
      yoy: { priorActual: null, pct: null, tone: "flat" },
      ...overrides,
    };
  }

  function renderGauges(periods: SalesGoalPeriods): string {
    return renderToStaticMarkup(
      createElement(
        DeskCurrencyContext.Provider,
        { value: "USD" },
        createElement(SalesGoalGauges, { periods, variant: "book" }),
      ),
    );
  }

  it("keeps an empty bar and — when actual is missing, and allows 0% on certified $0", () => {
    const missing = renderGauges({
      mtd: period({ key: "mtd", label: "This month" }),
      qtd: period({ key: "qtd", label: "This quarter", periodHint: "Q1 2026" }),
      ytd: period({ key: "ytd", label: "This year", periodHint: "2026" }),
    });
    expect(missing).toContain("— / $100,000");
    expect(missing).not.toMatch(/aria-valuenow="0"/);
    expect(missing).not.toMatch(/>0%</);
    expect(missing).not.toContain("no goal set");
    const ytdPct = missing.match(
      /This year[\s\S]{0,400}mcfly-goal-row__pct[^>]*>([^<]+)</,
    );
    expect(ytdPct?.[1]?.trim()).toBe("—");

    const certified = renderGauges({
      mtd: period({
        key: "mtd",
        label: "This month",
        actual: 0,
        progressPct: 0,
        pace: { kind: "miss", label: "Miss", tone: "down" },
      }),
      qtd: period({
        key: "qtd",
        label: "This quarter",
        actual: 0,
        progressPct: 0,
        pace: { kind: "miss", label: "Miss", tone: "down" },
      }),
      ytd: period({
        key: "ytd",
        label: "This year",
        actual: 0,
        progressPct: 0,
        pace: { kind: "miss", label: "Miss", tone: "down" },
      }),
    });
    expect(certified).toMatch(/aria-valuenow="0"/);
    expect(certified).toContain("0%");
    expect(certified).toContain("$0 / $100,000");
  });
});

describe("Goals leftover honesty locks", () => {
  const here = dirname(fileURLToPath(import.meta.url));

  function read(rel: string): string {
    return readFileSync(join(here, rel), "utf8");
  }

  it("does not lengthen the unpaid crawl past 90 closed days", () => {
    expect(LIVE_UNPAID_INGEST_DAYS).toBe(90);
    expect(read("./live-unpark.ts")).toMatch(/LIVE_UNPAID_INGEST_DAYS = 90/);
  });

  it("does not mount a fake twelve-month $0 Admin plan on public demo Goals", () => {
    const demo = read("../routes/demo.goals.tsx");
    expect(demo).not.toMatch(/Array\.from\(\{\s*length:\s*12\s*\},\s*\(\)\s*=>\s*0\)/);
    expect(demo).toContain('name="targetMer"');
    expect(demo).not.toMatch(/throw redirect/);
    expect(demo).not.toMatch(/Same year plan as Admin/);
    expect(demo).not.toMatch(/\$800k/);
    expect(demo).not.toMatch(/800_000/);
  });

  it("keeps ThisMonthPlanStack copy on Admin and habit copy on the order-history board", () => {
    const goals = read("../routes/app.goals.tsx");
    const board = read("../components/OrderHistoryGoalsBoard.tsx");
    expect(goals).toContain('name="targetMer"');
    expect(goals).toContain("No target saved.");
    expect(board).toContain("CopyMorningSentence");
    expect(board).toContain("morningSentence");
  });
});

describe("upsertYearSalesGoals — empty deletes, typed 0 saves", () => {
  it("deletes a cleared month instead of upserting $0", async () => {
    vi.mocked(prisma.salesGoal.upsert).mockResolvedValue({} as never);
    vi.mocked(prisma.salesGoal.deleteMany).mockResolvedValue({ count: 1 } as never);
    const monthly = Array.from({ length: 12 }, (_, i) => {
      if (i === 0) return 100_000;
      if (i === 1) return null;
      if (i === 2) return 0;
      return null;
    });
    await upsertYearSalesGoals("shop_1", 2026, monthly);
    expect(prisma.salesGoal.deleteMany).toHaveBeenCalledWith({
      where: { shopId: "shop_1", year: 2026, month: 2 },
    });
    expect(prisma.salesGoal.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({ month: 1, salesGoal: 100_000 }),
        update: { salesGoal: 100_000 },
      }),
    );
    expect(prisma.salesGoal.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({ month: 3, salesGoal: 0 }),
        update: { salesGoal: 0 },
      }),
    );
    const upsertedMonths = vi
      .mocked(prisma.salesGoal.upsert)
      .mock.calls.map((call) => call[0]?.create?.month);
    expect(upsertedMonths).toEqual([1, 3]);
  });
});

describe("buildMonthCloseForecast — selling-day pace, not calendar $0", () => {
  const now = new Date(2026, 6, 15);
  const goals = Array.from({ length: 12 }, () => 100_000);

  it("paces remaining Shopify Total Sales on selling days, keeping quiet $0 in so-far", () => {
    const salesByDay = fillMonthDays(2026, 7, 15, (d) => {
      if (d === 4 || d === 5) return 0;
      if (d <= 8) return 1_000 + d * 10;
      return 800 + d;
    });
    const salesByMonth = salesByMonthFromDayMap(2026, salesByDay, now);
    const forecast = buildMonthCloseForecast({
      year: 2026,
      goals,
      salesByMonth,
      spendByMonth: new Map([[7, 4_000]]),
      salesByDay,
      spendDaysByMonth: new Map([[7, 10]]),
      targetMer: 3,
      breakEvenMer: null,
      now,
    });
    expect(forecast).not.toBeNull();
    expect(forecast?.mtdSales).toBe(salesByMonth.get(7));
    expect(forecast?.projSales).not.toBeNull();
    const calendarMean =
      (forecast!.mtdSales / forecast!.daysElapsed) * forecast!.remainingDays +
      forecast!.mtdSales;
    expect(forecast!.projSales).not.toBeCloseTo(calendarMean, 5);
    expect(forecast!.sellingDays).toBeGreaterThanOrEqual(FORECAST_MIN_DAYS);
    expect(forecast!.formula).toMatch(/Shopify Total Sales/);
    expect(forecast!.formula).toMatch(/selling day/i);
    expect(forecast!.projSpend).toBe(
      4_000 + (4_000 / 10) * forecast!.remainingDays,
    );
  });

  it("does not let other months’ selling days set this month’s typical day", () => {
    const salesByDay = fillMonthDays(2026, 1, 31, 9_000);
    fillMonthDays(2026, 7, 15, (d) => (d === 4 || d === 5 ? 0 : 800), salesByDay);
    const salesByMonth = salesByMonthFromDayMap(2026, salesByDay, now);
    const forecast = buildMonthCloseForecast({
      year: 2026,
      goals,
      salesByMonth,
      spendByMonth: new Map(),
      salesByDay,
      targetMer: 3,
      breakEvenMer: null,
      now,
    });
    expect(forecast?.typicalDay).toBe(800);
    expect(forecast?.sellingDays).toBe(13);
  });

  it("withholds remaining spend when there are no spend days", () => {
    const salesByDay = fillMonthDays(2026, 7, 15, 900);
    const salesByMonth = salesByMonthFromDayMap(2026, salesByDay, now);
    const forecast = buildMonthCloseForecast({
      year: 2026,
      goals,
      salesByMonth,
      spendByMonth: new Map([[7, 0]]),
      salesByDay,
      spendDaysByMonth: new Map([[7, 0]]),
      targetMer: 3,
      breakEvenMer: null,
      now,
    });
    expect(forecast?.projSpend).toBeNull();
    expect(forecast?.projMer).toBeNull();
  });

  it("withholds the close while the current month is still a stub", () => {
    const salesByDay = fillMonthDays(2026, 7, 8, 1_000);
    const salesByMonth = salesByMonthFromDayMap(2026, salesByDay, now);
    expect(salesByMonth.has(7)).toBe(false);
    const forecast = buildMonthCloseForecast({
      year: 2026,
      goals,
      salesByMonth,
      spendByMonth: new Map(),
      salesByDay,
      targetMer: 3,
      breakEvenMer: null,
      now,
    });
    expect(forecast).toBeNull();
  });
});

describe("implied identified buyers", () => {
  it("is sales goal ÷ typical order only when the 8-order floor seals", () => {
    expect(IMPLIED_IDENTIFIED_BUYERS_MIN_ORDERS).toBe(8);
    expect(
      impliedIdentifiedBuyers({
        salesGoal: 80_000,
        typicalOrder: 200,
        orderCount: 8,
      }),
    ).toBe(400);
    expect(
      impliedIdentifiedBuyers({
        salesGoal: 80_000,
        typicalOrder: 200,
        orderCount: 7,
      }),
    ).toBeNull();
    expect(
      impliedIdentifiedBuyers({
        salesGoal: null,
        typicalOrder: 200,
        orderCount: 40,
      }),
    ).toBeNull();
    expect(
      impliedIdentifiedBuyers({
        salesGoal: 80_000,
        typicalOrder: null,
        orderCount: 40,
      }),
    ).toBeNull();
  });
});

describe("returning $ by calendar month from OrderFact", () => {
  it("sums identified returning dollars and leaves missing months absent", () => {
    const day = (key: string) => new Date(`${key}T00:00:00.000Z`);
    const months = returningSalesByMonthFromOrders(2026, [
      {
        customerKey: "buyer_a",
        amount: 120,
        shopLocalDate: day("2026-07-02"),
        lifetimeOrders: 4,
      },
      {
        customerKey: "buyer_b",
        amount: 80,
        shopLocalDate: day("2026-07-03"),
        lifetimeOrders: 1,
      },
      {
        customerKey: "guest",
        amount: 500,
        shopLocalDate: day("2026-07-04"),
        lifetimeOrders: 9,
      },
      {
        customerKey: "buyer_c",
        amount: 40,
        shopLocalDate: day("2026-07-05"),
        lifetimeOrders: null,
      },
      {
        customerKey: "buyer_d",
        amount: 70,
        shopLocalDate: day("2026-06-01"),
        lifetimeOrders: 3,
      },
    ]);
    expect(months.get(7)).toBe(120);
    expect(months.get(6)).toBe(70);
    expect(months.has(8)).toBe(false);
    expect(months.get(8)).toBeUndefined();
  });
});

describe("daysInCalendarMonth is used for stub expected length", () => {
  it("keeps July at 31 so eight days cannot look finished", () => {
    expect(daysInCalendarMonth(2026, 7)).toBe(31);
    expect(daysInCalendarMonth(2024, 2)).toBe(29);
  });
});
