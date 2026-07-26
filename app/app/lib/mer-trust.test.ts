import { describe, expect, it } from "vitest";
import {
  collectFilledSpendDayKeys,
  computeSpendPeriodCoverage,
  countClosedDaysInPeriod,
  formatCashFreshnessChip,
  formatSpendCoverageLine,
  resolveHonestSales,
} from "./mer-trust";

describe("countClosedDaysInPeriod", () => {
  it("excludes incomplete today when range ends now", () => {
    const now = new Date(2026, 6, 23, 15, 0, 0); // Jul 23 local
    const start = new Date(2026, 6, 1);
    const end = new Date(2026, 6, 23, 23, 59, 59, 999);
    // Jul 1–22 inclusive = 22 closed days
    expect(countClosedDaysInPeriod(start, end, now)).toBe(22);
  });

  it("counts full closed range when end is before today", () => {
    const now = new Date(2026, 6, 23);
    const start = new Date(2026, 6, 1);
    const end = new Date(2026, 6, 10, 23, 59, 59, 999);
    expect(countClosedDaysInPeriod(start, end, now)).toBe(10);
  });
});

describe("collectFilledSpendDayKeys + computeSpendPeriodCoverage", () => {
  it("marks overlapping days and flags incomplete coverage", () => {
    const now = new Date(2026, 6, 23);
    const start = new Date(2026, 6, 1);
    const end = new Date(2026, 6, 23, 23, 59, 59, 999);
    const entries = [
      {
        periodStart: new Date(2026, 6, 1),
        periodEnd: new Date(2026, 6, 3, 23, 59, 59, 999),
        amount: 100,
      },
      {
        periodStart: new Date(2026, 6, 10),
        periodEnd: new Date(2026, 6, 10, 23, 59, 59, 999),
        amount: 50,
      },
    ];
    const filled = collectFilledSpendDayKeys(entries, start, end, now);
    // Jul 1,2,3,10 = 4 days
    expect(filled.size).toBe(4);

    const coverage = computeSpendPeriodCoverage({
      daysWithSpend: filled.size,
      daysInPeriod: countClosedDaysInPeriod(start, end, now),
    });
    expect(coverage.daysInPeriod).toBe(22);
    expect(coverage.daysWithSpend).toBe(4);
    expect(coverage.incomplete).toBe(true);
    expect(coverage.coveragePct).toBe(18);
  });

  it("does not flag incomplete when coverage is dense", () => {
    const coverage = computeSpendPeriodCoverage({
      daysWithSpend: 20,
      daysInPeriod: 22,
    });
    expect(coverage.incomplete).toBe(false);
    expect(coverage.coveragePct).toBe(91);
  });

  it("does not flag incomplete with zero spend (empty path owns that)", () => {
    const coverage = computeSpendPeriodCoverage({
      daysWithSpend: 0,
      daysInPeriod: 22,
    });
    expect(coverage.incomplete).toBe(false);
  });

  it("ignores zero-amount entries", () => {
    const now = new Date(2026, 6, 23);
    const filled = collectFilledSpendDayKeys(
      [
        {
          periodStart: new Date(2026, 6, 5),
          periodEnd: new Date(2026, 6, 5),
          amount: 0,
        },
      ],
      new Date(2026, 6, 1),
      new Date(2026, 6, 23),
      now,
    );
    expect(filled.size).toBe(0);
  });
});

describe("resolveHonestSales", () => {
  it("passes through live Shopify sales when sample off", () => {
    const sales = {
      source: "shopify" as const,
      totalSales: 1000,
      orderCount: 5,
    };
    const result = resolveHonestSales(sales, false);
    expect(result.blockedMockAsLive).toBe(false);
    expect(result.sales.totalSales).toBe(1000);
  });

  it("allows mock only when sample desk is on", () => {
    const sales = {
      source: "mock" as const,
      totalSales: 9999,
      orderCount: 99,
    };
    const allowed = resolveHonestSales(sales, true);
    expect(allowed.blockedMockAsLive).toBe(false);
    expect(allowed.sales.totalSales).toBe(9999);
  });

  it("zeros mock sales when sample desk is off", () => {
    const sales = {
      source: "mock" as const,
      totalSales: 9999,
      orderCount: 99,
      newCustomers: 10,
      returningCustomers: 5,
      guestOrders: 2,
      customerMetricsAvailable: true,
    };
    const blocked = resolveHonestSales(sales, false);
    expect(blocked.blockedMockAsLive).toBe(true);
    expect(blocked.sales.totalSales).toBe(0);
    expect(blocked.sales.orderCount).toBe(0);
    expect(blocked.sales.customerMetricsAvailable).toBe(false);
    expect(blocked.sales.source).toBe("mock");
  });
});

describe("formatCashFreshnessChip", () => {
  it("labels sample desk clearly", () => {
    expect(
      formatCashFreshnessChip({
        useSampleDesk: true,
        salesPulledAt: "2026-07-23T21:00:00.000Z",
        lastAt: null,
        source: "live",
      }),
    ).toBe("Sample desk");
  });

  it("prefers sales-as-of over snapshot theater", () => {
    const label = formatCashFreshnessChip({
      useSampleDesk: false,
      salesPulledAt: "2026-07-23T21:04:00.000Z",
      lastAt: "2026-07-22T08:00:00.000Z",
      source: "snapshot",
    });
    expect(label.startsWith("Sales as of ")).toBe(true);
  });

  it("falls back to last sync / snapshot wording", () => {
    const label = formatCashFreshnessChip({
      useSampleDesk: false,
      salesPulledAt: null,
      lastAt: "2026-07-22T08:00:00.000Z",
      source: "sync",
    });
    expect(label.startsWith("Last sync ")).toBe(true);
  });
});

describe("formatSpendCoverageLine", () => {
  it("states sparse coverage honestly", () => {
    expect(
      formatSpendCoverageLine(
        {
          daysWithSpend: 4,
          daysInPeriod: 22,
          coveragePct: 18,
          incomplete: true,
        },
        "Month to date",
      ),
    ).toBe("4 of 22 closed days have spend · Month to date");
  });
});
