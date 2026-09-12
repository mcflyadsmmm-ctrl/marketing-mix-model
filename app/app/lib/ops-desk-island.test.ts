import { describe, expect, it } from "vitest";
import { buildOpsDeskIsland } from "./ops-desk-island";
import type { OrderEconomics } from "./order-economics";
import { buildSalesMix } from "./sales-mix";

function econ(overrides: Partial<OrderEconomics> = {}): OrderEconomics {
  return {
    sales: 40_000,
    orderCount: 200,
    aov: 200,
    spendPerOrder: null,
    weekdaySales: 28_000,
    weekendSales: 12_000,
    weekendShare: 0.3,
    newCustomerSales: 22_000,
    returningCustomerSales: 18_000,
    returningShare: 0.45,
    hasSignal: true,
    ...overrides,
  };
}

describe("buildOpsDeskIsland", () => {
  it("returns null without order signal", () => {
    expect(
      buildOpsDeskIsland({
        periodLabel: "MTD",
        periodPreset: "mtd",
        economics: econ({
          hasSignal: false,
          orderCount: 0,
          sales: 0,
          aov: null,
        }),
      }),
    ).toBeNull();
  });

  it("builds BC decision strip + dense KPI rail from orders + 2nd-order", () => {
    const island = buildOpsDeskIsland({
      periodLabel: "This month",
      periodPreset: "mtd",
      economics: econ(),
      buyerRepeat: { secondWithin90: 0.42, medianDaysToSecond: 27 },
      avgRevenueD90: 380,
      newBuyers: 90,
      hasLiveSpend: false,
    });
    expect(island).not.toBeNull();
    expect(island!.kicker).toContain("This month");
    expect(island!.takeaway.length).toBeGreaterThan(20);
    expect(island!.why.length).toBeGreaterThan(10);
    expect(island!.tone).toBe("strong");
    expect(island!.actions[0]?.id).toBe("ltv");
    expect(island!.actions.some((a) => a.id === "spend-later")).toBe(true);
    expect(island!.kpis[0]?.id).toBe("aov");
    expect(island!.kpis.some((k) => k.id === "second90")).toBe(true);
    expect(island!.kpis.length).toBeGreaterThanOrEqual(3);
    expect(island!.kpis.length).toBeLessThanOrEqual(4);
  });

  it("falls back to LTV · 90d when 2nd-order is not mature yet", () => {
    const island = buildOpsDeskIsland({
      periodLabel: "Last 7 days",
      periodPreset: "l7d",
      economics: econ({
        weekendShare: null,
        weekendSales: 0,
        weekdaySales: 40_000,
        returningShare: 0.3,
      }),
      buyerRepeat: { secondWithin90: null, medianDaysToSecond: null },
      avgRevenueD90: 310,
      newBuyers: 40,
      hasLiveSpend: true,
    });
    expect(island!.kpis.some((k) => k.id === "ltv90")).toBe(true);
    expect(island!.actions.some((a) => a.id === "spend-later")).toBe(false);
    expect(island!.tone).toBe("steady");
  });

  it("marks watch tone when returning share is thin on volume", () => {
    const island = buildOpsDeskIsland({
      periodLabel: "MTD",
      periodPreset: "mtd",
      economics: econ({
        returningShare: 0.1,
        returningCustomerSales: 4_000,
        newCustomerSales: 36_000,
        orderCount: 40,
      }),
      buyerRepeat: { secondWithin90: null, medianDaysToSecond: null },
    });
    expect(island!.tone).toBe("watch");
  });
});

describe("buildSalesMix", () => {
  it("returns null without signal", () => {
    expect(
      buildSalesMix(
        econ({ hasSignal: false, sales: 0, orderCount: 0, aov: null }),
        "MTD",
      ),
    ).toBeNull();
  });

  it("builds cohort + calendar pastel bars", () => {
    const mix = buildSalesMix(econ(), "This month");
    expect(mix).not.toBeNull();
    expect(mix!.groups).toHaveLength(2);
    expect(mix!.groups[0]!.bars[0]!.tone).toBe("returning");
    expect(mix!.groups[1]!.bars.some((b) => b.tone === "weekend")).toBe(true);
    const cohortShares = mix!.groups[0]!.bars.reduce((s, b) => s + b.share, 0);
    expect(cohortShares).toBeCloseTo(1, 5);
  });
});
