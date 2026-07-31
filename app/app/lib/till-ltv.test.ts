import { describe, expect, it } from "vitest";
import {
  computeCohortRollups,
  ORDER_FACT_GUEST_KEY,
} from "./order-facts.server";
import {
  customerWeightedAvgRevenue,
  summarizeTillLtvFromCohorts,
  type TillLtvCohortRow,
} from "./till-ltv.server";

describe("customerWeightedAvgRevenue", () => {
  it("divides cohort total revenue by customers once (not twice)", () => {
    // Bug regression: old weightedAvg did (rev/customers)/customers → ~$1.
    const rows: TillLtvCohortRow[] = [
      {
        cohortMonth: "2026-01",
        customers: 160,
        revenueD30: 20_000, // $125 / customer
        revenueD90: 40_800,
        revenueD365: 87_200,
        ordersD30: 200,
        ordersD90: 280,
        ordersD365: 400,
      },
      {
        cohortMonth: "2026-02",
        customers: 200,
        revenueD30: 26_000, // $130 / customer
        revenueD90: 52_000,
        revenueD365: 110_000,
        ordersD30: 250,
        ordersD90: 340,
        ordersD365: 500,
      },
    ];
    const avg30 = customerWeightedAvgRevenue(rows, (r) => r.revenueD30);
    // (20000+26000)/(160+200) = 46000/360 ≈ 127.78
    expect(avg30).toBeCloseTo(127.777, 2);
    // Wrong double-divide would yield ~0.72 → formatCurrency → "$1"
    expect(avg30).toBeGreaterThan(50);
  });
});

describe("summarizeTillLtvFromCohorts", () => {
  it("surfaces dollar-scale Customer LTV and sensible LTV:CAC", () => {
    const cohorts: TillLtvCohortRow[] = [
      {
        cohortMonth: "2026-06",
        customers: 180,
        revenueD30: 180 * 125,
        revenueD90: 180 * 255,
        revenueD365: 180 * 545,
        ordersD30: 220,
        ordersD90: 310,
        ordersD365: 450,
      },
    ];
    const summary = summarizeTillLtvFromCohorts(cohorts, {
      totalSpend: 36_000,
      newCustomers: 450,
      periodLabel: "This month",
      useSampleDesk: true,
    });
    expect(summary.available).toBe(true);
    expect(summary.avgRevenueD30).toBeCloseTo(125, 5);
    expect(summary.avgRevenueD90).toBeCloseTo(255, 5);
    expect(summary.avgRevenueD365).toBeCloseTo(545, 5);
    expect(summary.cashCac).toBeCloseTo(80, 5); // 36000/450
    expect(summary.ltvCacRatio).toBeCloseTo(255 / 80, 5);
  });
});

describe("computeCohortRollups", () => {
  it("assigns first-order month and sums 30/90/365 windows", () => {
    const first = new Date("2026-01-15T12:00:00.000Z");
    const d20 = new Date(first.getTime() + 20 * 86_400_000);
    const d60 = new Date(first.getTime() + 60 * 86_400_000);
    const d200 = new Date(first.getTime() + 200 * 86_400_000);

    const rollups = computeCohortRollups([
      { customerKey: "gid://shopify/Customer/1", orderedAt: first, amount: 100 },
      { customerKey: "gid://shopify/Customer/1", orderedAt: d20, amount: 50 },
      { customerKey: "gid://shopify/Customer/1", orderedAt: d60, amount: 75 },
      { customerKey: "gid://shopify/Customer/1", orderedAt: d200, amount: 200 },
      { customerKey: ORDER_FACT_GUEST_KEY, orderedAt: first, amount: 999 },
    ]);

    expect(rollups).toHaveLength(1);
    const jan = rollups[0]!;
    expect(jan.cohortMonth).toBe("2026-01");
    expect(jan.customers).toBe(1);
    expect(jan.revenueD30).toBe(150); // 100 + 50
    expect(jan.ordersD30).toBe(2);
    expect(jan.revenueD90).toBe(225); // +75
    expect(jan.ordersD90).toBe(3);
    expect(jan.revenueD365).toBe(425); // +200
    expect(jan.ordersD365).toBe(4);
  });

  it("aggregates multiple customers into the same cohort month", () => {
    const a = new Date("2026-03-01T00:00:00.000Z");
    const b = new Date("2026-03-20T00:00:00.000Z");
    const rollups = computeCohortRollups([
      { customerKey: "c1", orderedAt: a, amount: 40 },
      { customerKey: "c2", orderedAt: b, amount: 60 },
    ]);
    expect(rollups).toHaveLength(1);
    expect(rollups[0]!.cohortMonth).toBe("2026-03");
    expect(rollups[0]!.customers).toBe(2);
    expect(rollups[0]!.revenueD30).toBe(100);
    expect(rollups[0]!.ordersD30).toBe(2);
  });

  it("ignores guest-only order lists", () => {
    const rollups = computeCohortRollups([
      {
        customerKey: ORDER_FACT_GUEST_KEY,
        orderedAt: new Date("2026-02-01T00:00:00.000Z"),
        amount: 10,
      },
    ]);
    expect(rollups).toHaveLength(0);
  });
});
