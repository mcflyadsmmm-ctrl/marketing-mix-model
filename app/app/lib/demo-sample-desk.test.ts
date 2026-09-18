import { describe, expect, it } from "vitest";
import {
  buildThreeYearSampleDesk,
  SAMPLE_ACTIVE_CHANNELS,
  SAMPLE_BOOK_DAYS,
  SAMPLE_MIN_NEW_CUSTOMERS,
  SAMPLE_YOY_GROWTH,
  sampleSpendBounds,
  sampleSpendUsesNoonStamp,
} from "./demo-sample-desk.server";
import { customerWeightedAvgRevenue } from "./till-ltv.server";

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length === 0) return 0;
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1]! + sorted[mid]!) / 2;
  }
  return sorted[mid]!;
}

describe("buildThreeYearSampleDesk", () => {
  it("keeps SAMPLE YoY lift in the premium-SMB band — not flat, not cartoon", () => {
    expect(SAMPLE_YOY_GROWTH).toBe(0.14);
    expect(SAMPLE_YOY_GROWTH).toBeGreaterThanOrEqual(0.08);
    expect(SAMPLE_YOY_GROWTH).toBeLessThanOrEqual(0.18);
  });

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

  it("is a Snowdevil book: board AOV, winter peak, Meta+Google only", () => {
    const now = new Date("2026-09-16T18:00:00Z");
    const rows = buildThreeYearSampleDesk({ now, targetMer: 3.5 });
    expect(SAMPLE_MIN_NEW_CUSTOMERS).toBe(1);
    expect(rows.length).toBe(SAMPLE_BOOK_DAYS);
    expect(rows[rows.length - 1]!.day.toISOString().slice(0, 10)).toBe(
      "2026-09-16",
    );

    const aovs = rows.map((r) => r.sales / r.orderCount);
    expect(median(aovs)).toBeGreaterThan(400);

    let novSales = 0;
    let maySales = 0;
    const used = new Set<string>();
    let sales = 0;
    let spend = 0;
    for (const r of rows) {
      sales += r.sales;
      const month = r.day.getUTCMonth();
      if (month === 10) novSales += r.sales;
      if (month === 4) maySales += r.sales;
      let daySpend = 0;
      for (const [ch, amt] of Object.entries(r.spendByChannel)) {
        if (amt > 0) {
          daySpend += amt;
          spend += amt;
          used.add(ch);
        }
      }
      expect(daySpend, r.day.toISOString().slice(0, 10)).toBeGreaterThan(0);
    }
    expect(novSales).toBeGreaterThan(maySales);
    const mer = sales / spend;
    expect(mer).toBeGreaterThan(3.1);
    expect(mer).toBeLessThan(4.0);
    for (const ch of used) {
      expect(SAMPLE_ACTIVE_CHANNELS).toContain(ch);
    }
    expect([...used].sort()).toEqual(["email", "google", "meta", "other"]);
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
