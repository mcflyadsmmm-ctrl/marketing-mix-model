import { describe, expect, it } from "vitest";
import {
  buildOverviewQlFirstFold,
  classifyOverviewQlGap,
  overviewOrderGatedStrip,
  OVERVIEW_QL_GAP_TAX,
  OVERVIEW_QL_GAP_TIMING,
} from "./overview-ql-first-fold";
import { OVERVIEW_SHOPIFY_CLOCK_PENDING } from "./overview-live-period-clock";

describe("classifyOverviewQlGap", () => {
  it("withholds the named gap when net is incomplete", () => {
    expect(
      classifyOverviewQlGap({
        totalSales: 12_400,
        netSales: 0,
        netSalesKnown: false,
        factsPending: false,
      }),
    ).toEqual({
      gapAmount: null,
      gapKind: null,
      gapLabel: null,
    });
  });

  it("names tax/shipping when net is complete and totals diverge", () => {
    const gap = classifyOverviewQlGap({
      totalSales: 12_400,
      netSales: 10_200,
      netSalesKnown: true,
      factsPending: false,
    });
    expect(gap.gapAmount).toBe(2_200);
    expect(gap.gapKind).toBe("tax");
    expect(gap.gapLabel).toBe(OVERVIEW_QL_GAP_TAX);
  });

  it("prefers timing while facts are still pending", () => {
    const gap = classifyOverviewQlGap({
      totalSales: 8_000,
      netSales: 7_100,
      netSalesKnown: true,
      factsPending: true,
    });
    expect(gap.gapKind).toBe("timing");
    expect(gap.gapLabel).toBe(OVERVIEW_QL_GAP_TIMING);
  });
});

describe("buildOverviewQlFirstFold", () => {
  const base = {
    useSampleDesk: false,
    coverageComplete: true,
    periodExceedsFactWindow: false,
    shopifyPeriodTotal: 18_400,
    periodIncludesToday: false,
    todayShopifyTotalKnown: true,
    factsPending: false,
    netSales: 16_100,
    netSalesKnown: true,
    priorYearTotalSales: 17_000,
  };

  it("returns null on SAMPLE so QL never paints as Live there", () => {
    expect(buildOverviewQlFirstFold({ ...base, useSampleDesk: true })).toBeNull();
  });

  it("paints two totals and a named gap from SalesDayFact sums", () => {
    const fold = buildOverviewQlFirstFold(base);
    expect(fold).not.toBeNull();
    expect(fold!.totalSales).toBe(18_400);
    expect(fold!.netSales).toBe(16_100);
    expect(fold!.gapAmount).toBe(2_300);
    expect(fold!.gapLabel).toMatch(/Tax, shipping/);
    expect(fold!.spendDisplay).toBe("—");
  });

  it("keeps prior-year null honest and skips YoY", () => {
    const fold = buildOverviewQlFirstFold({
      ...base,
      priorYearTotalSales: null,
    });
    expect(fold!.priorYearTotalSales).toBeNull();
    expect(fold!.yoyPct).toBeNull();
    expect(fold!.zone).toBe("empty");
  });

  it("computes YoY when prior-year is on file", () => {
    const fold = buildOverviewQlFirstFold(base);
    expect(fold!.yoyPct).toBeCloseTo(((18_400 - 17_000) / 17_000) * 100);
    expect(fold!.zone).toBe("up");
  });

  it("paints — for the hero while facts are pending with no stored total", () => {
    const fold = buildOverviewQlFirstFold({
      ...base,
      coverageComplete: false,
      factsPending: true,
      shopifyPeriodTotal: 0,
      netSalesKnown: false,
      netSales: 0,
    });
    expect(fold!.totalSales).toBeNull();
    expect(fold!.netSales).toBeNull();
    expect(fold!.gapLabel).toBeNull();
    expect(fold!.periodNote).toBe(OVERVIEW_SHOPIFY_CLOCK_PENDING);
  });

  it("shows partial-month totals while the 24-month pull is still short", () => {
    const fold = buildOverviewQlFirstFold({
      ...base,
      coverageComplete: false,
      factsPending: true,
      shopifyPeriodTotal: 9_200,
    });
    expect(fold!.totalSales).toBe(9_200);
    expect(fold!.periodNote).toMatch(/still loading/i);
  });
});

describe("overviewOrderGatedStrip", () => {
  it("withholds order peeks until the book is sealed", () => {
    expect(
      overviewOrderGatedStrip({
        ordersSealed: false,
        returningSales: 4_200,
        typicalOrder: 631,
        weekendShare: 0.23,
      }),
    ).toEqual({
      returningSales: null,
      typicalOrder: null,
      weekendShare: null,
    });
  });

  it("passes sealed order depth through to the strip", () => {
    expect(
      overviewOrderGatedStrip({
        ordersSealed: true,
        returningSales: 4_200,
        typicalOrder: 631,
        weekendShare: 0.23,
      }),
    ).toEqual({
      returningSales: 4_200,
      typicalOrder: 631,
      weekendShare: 0.23,
    });
  });
});
