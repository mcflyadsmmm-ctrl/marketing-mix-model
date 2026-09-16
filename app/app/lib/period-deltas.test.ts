import { describe, expect, it } from "vitest";
import { periodDeltasForBasis } from "./period-deltas";

describe("periodDeltasForBasis", () => {
  it("uses Net for vs-prior sales and prior MER when the hero is Net", () => {
    const deltas = periodDeltasForBasis({
      basis: "net",
      currentSales: 900,
      currentMer: 900 / 100,
      currentSpend: 100,
      priorTotalSales: 1200,
      priorNetSales: 800,
      priorNetSalesKnown: true,
      priorSpend: 100,
      priorLabel: "Last month",
    });
    expect(deltas).not.toBeNull();
    expect(deltas!.priorSales).toBe(800);
    expect(deltas!.priorMer).toBeCloseTo(8, 8);
    expect(deltas!.salesPct).toBeCloseTo(((900 - 800) / 800) * 100, 8);
    expect(deltas!.merAbs).toBeCloseTo(9 - 8, 8);
  });

  it("withholds the compare when Net is requested and prior net is unknown", () => {
    expect(
      periodDeltasForBasis({
        basis: "net",
        currentSales: 900,
        currentMer: 9,
        currentSpend: 100,
        priorTotalSales: 1200,
        priorNetSales: null,
        priorNetSalesKnown: false,
        priorSpend: 100,
        priorLabel: "Last month",
      }),
    ).toBeNull();
  });

  it("keeps Total-basis shops on Total for prior sales and prior MER", () => {
    const deltas = periodDeltasForBasis({
      basis: "total",
      currentSales: 1100,
      currentMer: 11,
      currentSpend: 100,
      priorTotalSales: 1000,
      priorNetSales: 700,
      priorNetSalesKnown: true,
      priorSpend: 200,
      priorLabel: "Last month",
    });
    expect(deltas).not.toBeNull();
    expect(deltas!.priorSales).toBe(1000);
    expect(deltas!.priorMer).toBeCloseTo(5, 8);
    expect(deltas!.salesPct).toBeCloseTo(10, 8);
  });
});
