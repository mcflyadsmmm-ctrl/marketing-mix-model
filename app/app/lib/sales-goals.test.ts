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
  calendarDaysElapsedInMonth,
  paceStatus,
  salesByMonthFromDayMap,
} from "./sales-goals.server";

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
});
