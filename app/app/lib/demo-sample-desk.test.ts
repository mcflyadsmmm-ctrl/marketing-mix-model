import { describe, expect, it } from "vitest";
import {
  buildThreeYearSampleDesk,
  SAMPLE_BILLBOARD_LABEL,
  SAMPLE_BILLBOARD_SLUG,
  SAMPLE_MIN_NEW_CUSTOMERS,
  sampleDayTotalSpend,
  sampleSpendBounds,
  sampleSpendUsesNoonStamp,
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
      spend += sampleDayTotalSpend(r);
    }
    const mer = sales / spend;
    expect(mer).toBeGreaterThan(3.8);
    expect(mer).toBeLessThan(5.2);
  });

  it("runs a Billboard contract big enough to see, with its own dark days", () => {
    const rows = buildThreeYearSampleDesk({
      now: new Date("2026-07-31T12:00:00Z"),
      years: 1,
    });
    const withBillboard = rows.filter((r) => r.namedExtras.length > 0);
    const withoutBillboard = rows.filter((r) => r.namedExtras.length === 0);
    // The contract runs most of the month, then goes dark — both states exist.
    expect(withBillboard.length).toBeGreaterThan(200);
    expect(withoutBillboard.length).toBeGreaterThan(50);

    const extra = withBillboard[0]!.namedExtras[0]!;
    expect(extra.slug).toBe(SAMPLE_BILLBOARD_SLUG);
    expect(extra.label).toBe(SAMPLE_BILLBOARD_LABEL);
    expect(extra.amount).toBeGreaterThan(0);

    // Any fortnight a merchant opens must contain the Billboard series.
    for (let start = 0; start + 14 <= rows.length; start += 7) {
      const fortnight = rows.slice(start, start + 14);
      expect(
        fortnight.some((r) => r.namedExtras.length > 0),
        `window at ${start}`,
      ).toBe(true);
    }

    // Big enough to sort near the top of a seven-chip legend.
    let billboard = 0;
    let total = 0;
    for (const r of rows) {
      billboard += r.namedExtras.reduce((s, e) => s + e.amount, 0);
      total += sampleDayTotalSpend(r);
    }
    expect(billboard / total).toBeGreaterThan(0.06);
  });

  it("keeps the legend short — six paid channels plus the named extra", () => {
    const rows = buildThreeYearSampleDesk({
      now: new Date("2026-07-31T12:00:00Z"),
      years: 1,
    });
    const paid = new Set<string>();
    for (const r of rows) {
      for (const [channel, amount] of Object.entries(r.spendByChannel)) {
        if ((amount ?? 0) > 0) paid.add(channel);
      }
    }
    expect(paid.size).toBeLessThanOrEqual(6);
    expect(paid.has("meta")).toBe(true);
    expect(paid.has("google")).toBe(true);
  });

  it("goes dark on some days so $0 holes are real, not just a caption", () => {
    const rows = buildThreeYearSampleDesk({
      now: new Date("2026-07-31T12:00:00Z"),
      years: 1,
    });
    const dark = rows.filter((r) => sampleDayTotalSpend(r) === 0);
    // Roughly two paid-media pauses a month.
    expect(dark.length).toBeGreaterThan(18);
    expect(dark.length).toBeLessThan(40);
    // A dark day still sold — the hole is in spend, never in the till.
    for (const r of dark) {
      expect(r.sales).toBeGreaterThan(0);
      expect(r.namedExtras).toEqual([]);
    }
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
