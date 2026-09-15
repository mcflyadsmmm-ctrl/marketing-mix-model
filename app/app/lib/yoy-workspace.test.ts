import { describe, expect, it } from "vitest";
import type { CertifiedDay } from "./mer-control";
import { last7VsPrior7 } from "./yoy-workspace";

function certifiedDay(
  dateKey: string,
  sales: number,
  spend = 0,
): CertifiedDay {
  const [year, monthIndex, day] = dateKey.split("-").map(Number);
  return {
    dateKey,
    year,
    monthIndex: monthIndex - 1,
    day,
    quarter: Math.ceil(monthIndex / 3),
    sales,
    spend,
    mer: spend > 0 ? sales / spend : null,
    channels: [],
    residualSpend: 0,
    unpaired: false,
  };
}

describe("last7VsPrior7", () => {
  it("compares the latest seven certified days with the preceding seven", () => {
    const days = Array.from({ length: 14 }, (_, index) =>
      certifiedDay(
        `2026-09-${String(index + 1).padStart(2, "0")}`,
        index < 7 ? 100 : 200,
        index < 7 ? 25 : 50,
      ),
    );

    expect(last7VsPrior7(days)).toMatchObject({
      label: "Last 7 vs prior 7",
      sales: 1_400,
      priorSales: 700,
      spend: 350,
      priorSpend: 175,
      mer: 4,
      priorMer: 4,
    });
  });

  it("keeps the prior window null when no certified days precede it", () => {
    const days = Array.from({ length: 7 }, (_, index) =>
      certifiedDay(
        `2026-09-${String(index + 1).padStart(2, "0")}`,
        100,
        25,
      ),
    );

    const comparison = last7VsPrior7(days);
    expect(comparison.sales).toBe(700);
    expect(comparison.priorSales).toBeNull();
    expect(comparison.priorSpend).toBeNull();
    expect(comparison.priorMer).toBeNull();
  });
});
