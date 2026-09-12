import { describe, expect, it } from "vitest";
import { buildOpsDeskIsland } from "./ops-desk-island";
import type { OrderEconomics } from "./order-economics";

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
        economics: econ({ hasSignal: false, orderCount: 0, sales: 0, aov: null }),
      }),
    ).toBeNull();
  });

  it("builds BC-style takeaway + dense KPI rail from orders + 2nd-order", () => {
    const island = buildOpsDeskIsland({
      periodLabel: "This month",
      economics: econ(),
      buyerRepeat: { secondWithin90: 0.42, medianDaysToSecond: 27 },
      avgRevenueD90: 380,
      newBuyers: 90,
    });
    expect(island).not.toBeNull();
    expect(island!.kicker).toContain("This month");
    expect(island!.takeaway.length).toBeGreaterThan(20);
    expect(island!.kpis[0]?.id).toBe("aov");
    expect(island!.kpis.some((k) => k.id === "second90")).toBe(true);
    expect(island!.kpis.length).toBeGreaterThanOrEqual(3);
    expect(island!.kpis.length).toBeLessThanOrEqual(4);
  });

  it("falls back to LTV · 90d when 2nd-order is not mature yet", () => {
    const island = buildOpsDeskIsland({
      periodLabel: "Last 7 days",
      economics: econ({ weekendShare: null, weekendSales: 0, weekdaySales: 40_000 }),
      buyerRepeat: { secondWithin90: null, medianDaysToSecond: null },
      avgRevenueD90: 310,
      newBuyers: 40,
    });
    expect(island!.kpis.some((k) => k.id === "ltv90")).toBe(true);
  });
});
