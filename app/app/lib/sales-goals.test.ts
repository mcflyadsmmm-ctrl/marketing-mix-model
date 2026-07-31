import { describe, expect, it, vi } from "vitest";

vi.mock("../db.server", () => ({
  default: {
    salesGoal: { findMany: vi.fn(), upsert: vi.fn() },
    spendEntry: { findMany: vi.fn() },
    $transaction: vi.fn(),
  },
}));

vi.mock("./mer-dashboard.server", () => ({
  getOrCreateSettings: vi.fn(),
}));

import {
  buildSalesGoalPeriods,
  calendarDaysElapsedInMonth,
  monthDateRange,
  paceStatus,
  salesByMonthFromDayMap,
  spendByMonthMap,
  yearDateRange,
} from "./sales-goals.server";
import { shopLocalDayKey, shopLocalDayRange, shopLocalYmd } from "./shop-local-day";
import prisma from "../db.server";

describe("salesByMonthFromDayMap", () => {
  it("buckets day keys into months and caps current month at today", () => {
    const now = new Date(2026, 6, 15); // Jul 15
    const sales = new Map<string, number>([
      ["2026-01-10", 1000],
      ["2026-07-01", 200],
      ["2026-07-15", 50],
      ["2026-07-20", 999], // future day in month — excluded
      ["2025-12-31", 50],
    ]);
    const months = salesByMonthFromDayMap(2026, sales, now);
    expect(months.get(1)).toBe(1000);
    expect(months.get(7)).toBe(250);
    expect(months.get(12)).toBe(0);
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

    const sales = new Map<string, number>([
      ["2026-07-31", 100],
      ["2026-08-01", 50],
      ["2026-08-02", 999], // future for Tokyo Aug 1
    ]);

    const tokyo = salesByMonthFromDayMap(2026, sales, now, "Asia/Tokyo");
    expect(tokyo.get(7)).toBe(100);
    expect(tokyo.get(8)).toBe(50); // Aug 1 only; Aug 2 capped out

    const denver = salesByMonthFromDayMap(2026, sales, now, "America/Denver");
    expect(denver.get(7)).toBe(100);
    // Aug days are not the current Denver month — still summed (no MTD cap).
    expect(denver.get(8)).toBe(50 + 999);
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

    expect(periods.mtd.label).toBe("MTD");
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
    expect(periods.qtd.label).toBe("QTD");
    expect(periods.qtd.periodHint).toBe("Q3 2026");
    expect(periods.qtd.actual).toBe(52_000);
    expect(periods.qtd.goal).toBe(100_000);
    expect(periods.qtd.yoy.priorActual).toBe(80_000);

    // YTD Jan–Jul
    expect(periods.ytd.label).toBe("YTD");
    expect(periods.ytd.actual).toBe(
      110_000 + 95_000 + 100_000 + 105_000 + 98_000 + 102_000 + 52_000,
    );
    expect(periods.ytd.goal).toBe(700_000);
    expect(periods.ytd.progressPct).toBeCloseTo(
      (periods.ytd.actual / 700_000) * 100,
      5,
    );
    expect(periods.ytd.yoy.priorActual).toBe(90_000 * 6 + 80_000);
    expect(periods.ytd.yoy.tone).toBe("up");
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
