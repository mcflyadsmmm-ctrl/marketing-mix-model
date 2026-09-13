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

describe("buildSalesDepthDecision prior deltas", () => {
  it("surfaces prior-window deltas on the KPI rail", () => {
    const accuracy = assessSalesDayAccuracy({
      expectedClosedDayKeys: ["2026-09-01", "2026-09-02"],
      presentDayKeys: ["2026-09-01", "2026-09-02"],
      openDayKey: "2026-09-03",
    });
    const model = buildSalesDepthDecision({
      periodLabel: "Last 30 days",
      periodPreset: "last_30",
      economics,
      accuracy,
      dayFacts: [
        { dayKey: "2026-09-01", sales: 200, orderCount: 2 },
        { dayKey: "2026-09-02", sales: 800, orderCount: 8 },
      ],
      priorDayFacts: [
        { dayKey: "2026-08-01", sales: 500, orderCount: 5 },
        { dayKey: "2026-08-02", sales: 500, orderCount: 5 },
      ],
    });
    expect(model).not.toBeNull();
    const salesKpi = model!.kpis.find((k) => k.id === "sales");
    expect(salesKpi?.delta).toMatch(/vs prior/i);
    expect(model!.kpis[0]?.id).toBe("sales");
  });
});

describe("buildSalesDepthDecision open-day honesty", () => {
  it("states desk totals skip the open shop-local day", () => {
    const accuracy = assessSalesDayAccuracy({
      expectedClosedDayKeys: ["2026-09-10", "2026-09-11"],
      presentDayKeys: ["2026-09-10", "2026-09-11"],
      openDayKey: "2026-09-12",
    });
    const model = buildSalesDepthDecision({
      periodLabel: "Last 30 days",
      periodPreset: "last_30",
      economics,
      accuracy,
      dayFacts: [
        { dayKey: "2026-09-10", sales: 200, orderCount: 2 },
        { dayKey: "2026-09-11", sales: 300, orderCount: 3 },
        { dayKey: "2026-09-12", sales: 9999, orderCount: 9 },
      ],
    });
    expect(model).not.toBeNull();
    expect(`${model!.takeaway} ${model!.why}`).toMatch(/closed days only/i);
    expect(`${model!.takeaway} ${model!.why}`).toMatch(/2026-09-12/);
  });
});

describe("buildSalesDepthDecision Admin mismatch", () => {
  it("puts live Admin drift in the takeaway ahead of complete copy", () => {
    const accuracy = {
      ...assessSalesDayAccuracy({
        expectedClosedDayKeys: ["2026-09-10"],
        presentDayKeys: ["2026-09-10"],
        openDayKey: "2026-09-11",
      }),
      reconcileStatus: "mismatch" as const,
      reconcileCheckedDays: 1,
      reconcileMismatchDays: ["2026-09-10"],
      headline: "Shopify totals disagree on 1 checked day",
      detail: "Live Admin check found drift on 2026-09-10. Re-syncing now.",
    };
    const model = buildSalesDepthDecision({
      periodLabel: "Last 30 days",
      periodPreset: "last_30",
      economics,
      accuracy,
      dayFacts: [{ dayKey: "2026-09-10", sales: 200, orderCount: 2 }],
    });
    expect(model).not.toBeNull();
    expect(model!.takeaway).toMatch(/disagree/i);
    expect(model!.why).toMatch(/2026-09-10/);
  });
});
