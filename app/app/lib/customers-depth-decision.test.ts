import { describe, expect, it } from "vitest";
import { buildCustomersDepthDecision } from "./customers-depth-decision";
import { assessSalesDayAccuracy } from "./sales-day-accuracy";
import { assessOrderHistoryAccuracy } from "./order-history-accuracy";
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

describe("buildCustomersDepthDecision", () => {
  it("leads with returning share from day facts while order history catches up", () => {
    const dayAccuracy = assessSalesDayAccuracy({
      expectedClosedDayKeys: ["2026-09-01", "2026-09-02"],
      presentDayKeys: ["2026-09-01", "2026-09-02"],
      openDayKey: "2026-09-03",
    });
    const orderHistoryAccuracy = assessOrderHistoryAccuracy({
      expectedClosedDayKeys: ["2026-09-01", "2026-09-02"],
      sealedDayKeys: ["2026-09-01"],
      openDayKey: "2026-09-03",
    });
    expect(orderHistoryAccuracy.status).toBe("catching_up");

    const model = buildCustomersDepthDecision({
      periodLabel: "Last 30 days",
      periodPreset: "last_30",
      economics,
      dayAccuracy,
      orderHistoryAccuracy,
    });
    expect(model).not.toBeNull();
    expect(model!.kicker).toMatch(/Customers/i);
    expect(model!.takeaway).toMatch(/Returning/i);
    expect(model!.kpis[0]?.id).toBe("sales");
    expect(model!.actions[0]?.id).toBe("returning-share");
  });
});
