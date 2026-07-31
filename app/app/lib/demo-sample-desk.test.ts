import { describe, expect, it } from "vitest";
import {
  buildThreeYearSampleDesk,
  SAMPLE_MIN_NEW_CUSTOMERS,
} from "./demo-sample-desk.server";
import { customerWeightedAvgRevenue } from "./till-ltv.server";

describe("buildThreeYearSampleDesk", () => {
  it("never shows 0 new customers or $0 new-customer sales", () => {
    const rows = buildThreeYearSampleDesk({
      now: new Date("2026-07-31T12:00:00Z"),
      years: 1,
    });
    expect(rows.length).toBeGreaterThan(300);
    for (const r of rows) {
      expect(r.newCustomers).toBeGreaterThanOrEqual(SAMPLE_MIN_NEW_CUSTOMERS);
      expect(r.orderCount).toBeGreaterThanOrEqual(r.newCustomers);
      expect(r.sales).toBeGreaterThan(1000);
      expect(r.newCustomerNetSales).toBeGreaterThan(0);
      expect(r.newCustomerNetSales).toBeLessThanOrEqual(r.sales + 0.01);
    }
  });

  it("lands Total ROAS-ish spend near target MER (impressive desk)", () => {
    const targetMer = 4.4;
    const rows = buildThreeYearSampleDesk({
      now: new Date("2026-07-31T12:00:00Z"),
      years: 1,
      targetMer,
    });
    let sales = 0;
    let spend = 0;
    for (const r of rows) {
      sales += r.sales;
      for (const amt of Object.values(r.spendByChannel)) spend += amt;
    }
    const mer = sales / spend;
    expect(mer).toBeGreaterThan(3.8);
    expect(mer).toBeLessThan(5.2);
  });
});

describe("sample cohort LTV scale", () => {
  it("uses customer×LTV totals so weighted avg is never ~$1", () => {
    // Mirrors seedSampleCohortFacts shape (totals, not per-customer).
    const customers = 220;
    const ltv90 = 380;
    const rows = [
      {
        cohortMonth: "2026-01",
        customers,
        revenueD30: customers * 145,
        revenueD90: customers * ltv90,
        revenueD365: customers * 820,
        ordersD30: customers + 70,
        ordersD90: customers + 180,
        ordersD365: customers + 350,
      },
    ];
    const avg90 = customerWeightedAvgRevenue(rows, (r) => r.revenueD90);
    expect(avg90).not.toBeNull();
    expect(avg90!).toBeCloseTo(380, 5);
    expect(avg90!).toBeGreaterThan(50);
    // Cash CAC ~$80 → LTV:CAC ~4.75× (not ~1×).
    expect(avg90! / 80).toBeGreaterThan(4);
  });
});
