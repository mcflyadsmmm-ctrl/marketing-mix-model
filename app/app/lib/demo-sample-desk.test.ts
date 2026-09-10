import { describe, expect, it } from "vitest";
import {
  buildThreeYearSampleDesk,
  SAMPLE_ACTIVE_CHANNELS,
  SAMPLE_BOOK_DAYS,
  SAMPLE_MIN_NEW_CUSTOMERS,
  sampleSpendBounds,
  sampleSpendUsesNoonStamp,
} from "./demo-sample-desk.server";
import { customerWeightedAvgRevenue } from "./till-ltv.server";

describe("buildThreeYearSampleDesk", () => {
  it("never shows 0 new customers or $0 new-customer sales", () => {
    const rows = buildThreeYearSampleDesk({
      now: new Date("2026-09-10T18:00:00Z"),
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

  it("includes today UTC so MTD is not a stale cutoff", () => {
    const now = new Date("2026-09-10T18:00:00Z");
    const rows = buildThreeYearSampleDesk({ now });
    expect(rows.length).toBe(SAMPLE_BOOK_DAYS);
    const last = rows[rows.length - 1]!;
    expect(last.day.toISOString().slice(0, 10)).toBe("2026-09-10");
  });

  it("lands Total ROAS near 3.5× with only a few paid channels", () => {
    const targetMer = 3.5;
    const rows = buildThreeYearSampleDesk({
      now: new Date("2026-09-10T18:00:00Z"),
      years: 1,
      targetMer,
    });
    let sales = 0;
    let spend = 0;
    const used = new Set<string>();
    for (const r of rows) {
      sales += r.sales;
      for (const [ch, amt] of Object.entries(r.spendByChannel)) {
        if (amt > 0) {
          spend += amt;
          used.add(ch);
        }
      }
    }
    const mer = sales / spend;
    expect(mer).toBeGreaterThan(3.1);
    expect(mer).toBeLessThan(4.0);
    for (const ch of used) {
      expect(SAMPLE_ACTIVE_CHANNELS).toContain(ch);
    }
    expect(used.has("meta")).toBe(true);
    expect(used.has("google")).toBe(true);
    expect(used.has("tiktok")).toBe(false);
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

describe("sampleSpendBounds", () => {
  it("stamps UTC noon so live CSV midnight keys do not collide", () => {
    const day = new Date("2026-08-15T00:00:00.000Z");
    const { start, end } = sampleSpendBounds(day);
    expect(start.toISOString()).toBe("2026-08-15T12:00:00.000Z");
    expect(end.toISOString()).toBe("2026-08-15T23:59:59.999Z");
    expect(sampleSpendUsesNoonStamp(start)).toBe(true);
    expect(sampleSpendUsesNoonStamp(new Date("2026-08-15T00:00:00.000Z"))).toBe(
      false,
    );
  });
});
