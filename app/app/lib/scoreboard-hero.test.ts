import { describe, expect, it } from "vitest";
import { buildScoreboardHero } from "./scoreboard-hero";
import type { OrderEconomics } from "./order-economics";

function econ(overrides: Partial<OrderEconomics> = {}): OrderEconomics {
  return {
    sales: 257_378,
    orderCount: 2412,
    aov: 106.71,
    spendPerOrder: null,
    weekdaySales: 180_000,
    weekendSales: 77_378,
    weekendShare: 77_378 / 257_378,
    newCustomerSales: 140_000,
    returningCustomerSales: 117_378,
    returningShare: 117_378 / 257_378,
    hasSignal: true,
    ...overrides,
  };
}

describe("buildScoreboardHero", () => {
  it("returns null without order signal", () => {
    expect(
      buildScoreboardHero({
        periodLabel: "MTD",
        periodPreset: "mtd",
        economics: econ({
          hasSignal: false,
          sales: 0,
          orderCount: 0,
          aov: null,
        }),
        salesDeltaPct: null,
        priorLabel: null,
        hasLiveSpend: false,
      }),
    ).toBeNull();
  });

  it("builds BC triad + till read + insights from Shopify depth", () => {
    const board = buildScoreboardHero({
      periodLabel: "Month to date",
      periodPreset: "mtd",
      economics: econ(),
      salesDeltaPct: 1.2,
      priorLabel: "prior MTD",
      buyerRepeat: { secondWithin90: 0.42, medianDaysToSecond: 27 },
      avgRevenueD90: 380,
      newBuyers: 410,
      top10BuyerShare: 0.48,
      hasLiveSpend: false,
    });
    expect(board).not.toBeNull();
    expect(board!.cards).toHaveLength(3);
    expect(board!.cards[1]?.id).toBe("sales");
    expect(board!.cards[2]?.id).toBe("customers");
    expect(board!.bannerTakeaway.length).toBeGreaterThan(12);
    expect(board!.tillRead).toMatch(/AOV/);
    expect(board!.insights.length).toBeGreaterThanOrEqual(2);
    expect(board!.secondaryLabel).toMatch(/spend later/i);
  });

  it("swaps decision card for Total ROAS when live spend exists", () => {
    const board = buildScoreboardHero({
      periodLabel: "MTD",
      periodPreset: "mtd",
      economics: econ({ spendPerOrder: 24.21 }),
      salesDeltaPct: 1,
      priorLabel: "prior MTD",
      hasLiveSpend: true,
      mer: 4.41,
      spend: 58_388,
      spendDeltaPct: 1,
    });
    expect(board!.cards[0]?.id).toBe("roas");
    expect(board!.cards[0]?.value).toContain("4.41");
    expect(board!.secondaryLabel).toMatch(/Update spend/i);
  });
});
