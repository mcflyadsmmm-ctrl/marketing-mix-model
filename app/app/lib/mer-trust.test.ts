import { describe, expect, it } from "vitest";
import {
  collectFilledSpendDayKeys,
  computeSpendPeriodCoverage,
  computeSpendRecon,
  countClosedDaysInPeriod,
  formatCashFreshnessChip,
  formatSpendCoverageLine,
  resolveHonestSales,
  spendReconMatchesPeriod,
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

  it("incomplete + recon drift are the live cashActionReady hard-gate inputs", () => {
    const sparse = computeSpendPeriodCoverage({
      daysWithSpend: 4,
      daysInPeriod: 22,
    });
    // Live: cashActionReady = settingsSaved && !incomplete && recon !== drift
    expect(
      true &&
        !sparse.incomplete &&
        computeSpendRecon(1000, 1000).status !== "drift",
    ).toBe(false);

    const dense = computeSpendPeriodCoverage({
      daysWithSpend: 20,
      daysInPeriod: 22,
    });
    expect(
      true &&
        !dense.incomplete &&
        computeSpendRecon(1000, 1000).status !== "drift",
    ).toBe(true);
    expect(
      true &&
        !dense.incomplete &&
        computeSpendRecon(1200, 1000).status !== "drift",
    ).toBe(false);
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
      grossSales: 9999,
      netSales: 9999,
      orderCount: 99,
      newCustomers: 10,
      returningCustomers: 5,
      guestOrders: 2,
      customerMetricsAvailable: true,
    };
    const blocked = resolveHonestSales(sales, false);
    expect(blocked.blockedMockAsLive).toBe(true);
    expect(blocked.sales.totalSales).toBe(0);
    expect(blocked.sales.grossSales).toBe(0);
    expect(blocked.sales.netSales).toBe(0);
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
    ).toMatch(/Sample data/i);
  });

  it("prefers sales last-refreshed over snapshot theater", () => {
    const label = formatCashFreshnessChip({
      useSampleDesk: false,
      salesPulledAt: "2026-07-23T21:04:00.000Z",
      lastAt: "2026-07-22T08:00:00.000Z",
      source: "snapshot",
    });
    expect(label.startsWith("Last refreshed · Sales ")).toBe(true);
  });

  it("includes spend when spendUpdatedAt is set", () => {
    const label = formatCashFreshnessChip({
      useSampleDesk: false,
      salesPulledAt: "2026-07-23T21:04:00.000Z",
      lastAt: null,
      source: "live",
      spendUpdatedAt: "2026-07-22T08:00:00.000Z",
    });
    expect(label).toMatch(/Last refreshed · Sales /);
    expect(label).toMatch(/ · Spend /);
  });

  it("falls back to last sync / snapshot wording", () => {
    const label = formatCashFreshnessChip({
      useSampleDesk: false,
      salesPulledAt: null,
      lastAt: "2026-07-22T08:00:00.000Z",
      source: "sync",
    });
    expect(label.startsWith("Last refreshed · Last sync ")).toBe(true);
  });

  it("omits sales-as-of when salesPulledAt is null (no freshness lie)", () => {
    const label = formatCashFreshnessChip({
      useSampleDesk: false,
      salesPulledAt: null,
      lastAt: null,
      source: "live",
    });
    expect(label).toMatch(/Last refreshed/i);
    expect(label.includes("Sales as of")).toBe(false);
    expect(label).not.toMatch(/^Sales /);
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

describe("computeSpendRecon", () => {
  it("returns none when declared missing", () => {
    const r = computeSpendRecon(1000, null);
    expect(r.status).toBe("none");
    expect(r.deltaPct).toBeNull();
  });

  it("flags drift beyond ±5%", () => {
    const r = computeSpendRecon(1200, 1000);
    expect(r.status).toBe("drift");
    expect(r.deltaPct).toBeCloseTo(0.2);
  });

  it("ok within ±5%", () => {
    const r = computeSpendRecon(1030, 1000);
    expect(r.status).toBe("ok");
  });
});

describe("spendReconMatchesPeriod", () => {
  it("matches same local calendar bounds", () => {
    const start = new Date(2026, 6, 1);
    const end = new Date(2026, 6, 27, 15);
    expect(
      spendReconMatchesPeriod(start, end, new Date(2026, 6, 1), new Date(2026, 6, 27, 23)),
    ).toBe(true);
    expect(
      spendReconMatchesPeriod(start, end, new Date(2026, 5, 1), end),
    ).toBe(false);
  });

  it("matches on shop IANA day keys when timeZone is set", () => {
    // 2026-07-01 06:00 UTC = Jun 30 evening in America/Los_Angeles (PDT)
    const laStart = new Date("2026-07-01T06:00:00.000Z");
    const laEnd = new Date("2026-07-27T06:00:00.000Z");
    const rangeStart = new Date("2026-07-01T17:00:00.000Z"); // Jul 1 LA
    const rangeEnd = new Date("2026-07-27T17:00:00.000Z");
    expect(
      spendReconMatchesPeriod(
        laStart,
        laEnd,
        rangeStart,
        rangeEnd,
        "America/Los_Angeles",
      ),
    ).toBe(false);
    // Same shop-local Jul 1 / Jul 27 when both instants land on those LA days
    const declaredStart = new Date("2026-07-01T17:00:00.000Z");
    const declaredEnd = new Date("2026-07-27T20:00:00.000Z");
    expect(
      spendReconMatchesPeriod(
        declaredStart,
        declaredEnd,
        rangeStart,
        rangeEnd,
        "America/Los_Angeles",
      ),
    ).toBe(true);
  });
});

describe("shop IANA closed-day coverage", () => {
  it("counts closed days in America/Los_Angeles, not server-local", () => {
    // "Now" = Jul 23 08:00 UTC → Jul 23 morning in LA; yesterday closed = Jul 22
    const now = new Date("2026-07-23T08:00:00.000Z");
    const start = new Date("2026-07-01T07:00:00.000Z"); // Jul 1 LA
    const end = new Date("2026-07-23T07:00:00.000Z"); // Jul 23 LA
    expect(
      countClosedDaysInPeriod(start, end, now, "America/Los_Angeles"),
    ).toBe(22);
  });

  it("fills spend day keys on shop IANA calendar", () => {
    const now = new Date("2026-07-23T08:00:00.000Z");
    const start = new Date("2026-07-01T07:00:00.000Z");
    const end = new Date("2026-07-23T07:00:00.000Z");
    const filled = collectFilledSpendDayKeys(
      [
        {
          // Jul 1–3 LA
          periodStart: new Date("2026-07-01T07:00:00.000Z"),
          periodEnd: new Date("2026-07-03T07:00:00.000Z"),
          amount: 100,
        },
        {
          periodStart: new Date("2026-07-10T07:00:00.000Z"),
          periodEnd: new Date("2026-07-10T07:00:00.000Z"),
          amount: 50,
        },
      ],
      start,
      end,
      now,
      "America/Los_Angeles",
    );
    expect(filled.size).toBe(4);
    expect(filled.has("2026-07-01")).toBe(true);
    expect(filled.has("2026-07-10")).toBe(true);
  });

  it("UTC-midnight CSV day stays calendar key in America/Denver (not prior local day)", () => {
    const now = new Date("2026-07-15T18:00:00.000Z");
    // Shop-local Jul 1–10 window (Denver MDT = UTC-6).
    const start = new Date("2026-07-01T06:00:00.000Z");
    const end = new Date("2026-07-11T05:59:59.999Z");
    const filled = collectFilledSpendDayKeys(
      [
        {
          // Production stamp: utcMidnightFromDayKey("2026-07-01")
          periodStart: new Date("2026-07-01T00:00:00.000Z"),
          periodEnd: new Date("2026-07-01T23:59:59.999Z"),
          amount: 80,
        },
      ],
      start,
      end,
      now,
      "America/Denver",
    );
    expect(filled.has("2026-07-01")).toBe(true);
    expect(filled.has("2026-06-30")).toBe(false);
  });
});
