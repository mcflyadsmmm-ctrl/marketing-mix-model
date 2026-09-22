import { describe, expect, it } from "vitest";
import {
  overlaySalesOnSpendCoverage,
  spendPairCoverage,
} from "./spend-pair-coverage";

describe("spendPairCoverage", () => {
  it("names aligned sales days and spend days", () => {
    const coverage = spendPairCoverage({
      salesDays: ["2026-09-15", "2026-09-16"],
      spendDays: ["2026-09-16", "2026-09-15"],
    });
    expect(coverage.withholdRatio).toBe(false);
    expect(coverage.caption).toBe("2 sales days · 2 spend days");
  });

  it("withholds when weekend sales have no spend", () => {
    const coverage = spendPairCoverage({
      salesDays: ["2026-09-18", "2026-09-19", "2026-09-20"],
      spendDays: ["2026-09-18"],
    });
    expect(coverage.salesDaysWithoutSpend).toBe(2);
    expect(coverage.withholdRatio).toBe(true);
    expect(coverage.caption).toMatch(/Total ROAS waits/);
  });

  it("names unpaired spend without withholding an aligned till", () => {
    const coverage = spendPairCoverage({
      salesDays: ["2026-09-18"],
      spendDays: ["2026-09-18", "2026-09-21"],
    });
    expect(coverage.withholdRatio).toBe(false);
    expect(coverage.spendDaysWithoutSales).toBe(1);
    expect(coverage.caption).toMatch(/waiting on sales/);
  });
});

describe("overlaySalesOnSpendCoverage", () => {
  it("marks sales-only cells without filling spend", () => {
    const days = overlaySalesOnSpendCoverage(
      [
        { dateKey: "2026-09-19", label: "19", filled: false },
        { dateKey: "2026-09-20", label: "20", filled: false },
      ],
      { "2026-09-19": 1200 },
    );
    expect(days[0]).toEqual({
      dateKey: "2026-09-19",
      label: "19",
      filled: false,
      hasSales: true,
    });
    expect(days[1]?.hasSales).toBe(false);
    expect(days[1]?.filled).toBe(false);
  });
});
