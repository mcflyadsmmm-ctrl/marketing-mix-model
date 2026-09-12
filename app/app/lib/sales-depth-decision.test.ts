import { describe, expect, it } from "vitest";
import {
  buildSalesDepthDecision,
  strongestSoftestAmongFilled,
} from "./sales-depth-decision";
import { assessSalesDayAccuracy } from "./sales-day-accuracy";
import type { OrderEconomics } from "./order-economics";

const economics: OrderEconomics = {
  sales: 1200,
  orderCount: 12,
  aov: 100,
  spendPerOrder: null,
  weekdaySales: 900,
  weekendSales: 300,
  weekendShare: 0.25,
  newCustomerSales: 400,
  returningCustomerSales: 800,
  returningShare: 2 / 3,
  hasSignal: true,
};

describe("strongestSoftestAmongFilled", () => {
  it("skips the open day", () => {
    const pair = strongestSoftestAmongFilled(
      [
        { dayKey: "2026-09-01", sales: 100, orderCount: 2 },
        { dayKey: "2026-09-02", sales: 500, orderCount: 5 },
        { dayKey: "2026-09-03", sales: 50, orderCount: 1 },
        { dayKey: "2026-09-04", sales: 9999, orderCount: 9 },
      ],
      "2026-09-04",
    );
    expect(pair?.strongest.dayKey).toBe("2026-09-02");
    expect(pair?.softest.dayKey).toBe("2026-09-03");
  });
});

describe("buildSalesDepthDecision", () => {
  it("marks strongest/softest as among filled days while catching up", () => {
    const accuracy = assessSalesDayAccuracy({
      expectedClosedDayKeys: ["2026-09-01", "2026-09-02", "2026-09-03"],
      presentDayKeys: ["2026-09-01", "2026-09-02"],
      openDayKey: "2026-09-04",
    });
    expect(accuracy.status).toBe("catching_up");

    const model = buildSalesDepthDecision({
      periodLabel: "Last 30 days",
      periodPreset: "last_30",
      economics,
      accuracy,
      dayFacts: [
        { dayKey: "2026-09-01", sales: 200, orderCount: 2 },
        { dayKey: "2026-09-02", sales: 800, orderCount: 8 },
      ],
    });
    expect(model).not.toBeNull();
    const blob = `${model!.takeaway} ${model!.why}`;
    expect(blob).toMatch(/among filled days/i);
    expect(blob).toMatch(/Strongest 2026-09-02/i);
  });
});
