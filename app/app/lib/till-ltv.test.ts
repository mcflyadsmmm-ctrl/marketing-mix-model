import { describe, expect, it } from "vitest";
import {
  computeCohortRollups,
  ORDER_FACT_GUEST_KEY,
} from "./order-facts.server";
import {
  cashPaybackDays,
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

describe("cashPaybackDays", () => {
  it("recovers inside the 30d window", () => {
    // CAC 50, D30 100 → 30 * (50/100) = 15 days.
    expect(cashPaybackDays(50, 100, null, null)).toBe(15);
  });

  it("recovers between 30d and 90d", () => {
    // CAC 200, D30 100, D90 250 → 30 + 60*(200-100)/(250-100) = 70 days.
    expect(cashPaybackDays(200, 100, 250, null)).toBe(70);
  });

  it("recovers between 90d and 365d", () => {
    // CAC 400, D30 100, D90 300, D365 600 → 90 + 275*(400-300)/(600-300) ≈ 182.
    expect(cashPaybackDays(400, 100, 300, 600)).toBe(182);
  });

  it("returns null when not recovered by 365d", () => {
    expect(cashPaybackDays(1000, 50, 150, 300)).toBeNull();
  });

  it("returns null when cashCac is null or non-positive", () => {
    expect(cashPaybackDays(null, 100, 200, 300)).toBeNull();
    expect(cashPaybackDays(0, 100, 200, 300)).toBeNull();
    expect(cashPaybackDays(-10, 100, 200, 300)).toBeNull();
  });

  it("skips a missing window and interpolates to the next known anchor", () => {
    // D30 missing — CAC 150 recovered between day 0 ($0) and day 90 ($300).
    // 90 * (150/300) = 45 days.
    expect(cashPaybackDays(150, null, 300, null)).toBe(45);
  });

  it("clamps to at least 1 day for near-instant recovery", () => {
    expect(cashPaybackDays(1, 100, null, null)).toBeGreaterThanOrEqual(1);
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
    expect(summary.newBuyers).toBe(450);
    expect(summary.ltvCacRatio).toBeCloseTo(255 / 80, 5);
  });

  it("exposes newBuyers as the cashCac denominator for UI (not facts newCustomers)", () => {
    const summary = summarizeTillLtvFromCohorts([], {
      totalSpend: 1_000,
      newCustomers: 25,
      periodLabel: "W",
      useSampleDesk: true,
    });
    expect(summary.newBuyers).toBe(25);
    expect(summary.cashCac).toBeCloseTo(40, 5);
  });

  it("computes avgOrdersD90 customer-weighted (Σ ordersD90 / Σ customers)", () => {
    const cohorts: TillLtvCohortRow[] = [
      {
        cohortMonth: "2026-01",
        customers: 160,
        revenueD30: 20_000,
        revenueD90: 40_800,
        revenueD365: 87_200,
        ordersD30: 200,
        ordersD90: 280,
        ordersD365: 400,
      },
      {
        cohortMonth: "2026-02",
        customers: 200,
        revenueD30: 26_000,
        revenueD90: 52_000,
        revenueD365: 110_000,
        ordersD30: 250,
        ordersD90: 340,
        ordersD365: 500,
      },
    ];
    const summary = summarizeTillLtvFromCohorts(cohorts, {
      totalSpend: 10_000,
      newCustomers: 100,
      useSampleDesk: true,
    });
    // (280+340)/(160+200) = 620/360 ≈ 1.7222
    expect(summary.avgOrdersD90).toBeCloseTo(1.7222, 3);
  });

  it("returns null avgOrdersD90 when there are no cohort customers", () => {
    const summary = summarizeTillLtvFromCohorts([], {
      totalSpend: 1_000,
      newCustomers: 25,
      useSampleDesk: true,
    });
    expect(summary.avgOrdersD90).toBeNull();
  });

  it("wires paybackDays from cashCac + cohort revenue windows", () => {
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
      newCustomers: 450, // cashCac = 80
      useSampleDesk: true,
    });
    // cashCac 80 recovered inside 30d: 30 * (80/125) = 19.2 → 19 days.
    expect(summary.paybackDays).toBe(19);
  });

  it("returns null paybackDays when cashCac is unavailable", () => {
    const summary = summarizeTillLtvFromCohorts([], {
      totalSpend: 1_000,
      newCustomers: 0,
      useSampleDesk: true,
    });
    expect(summary.paybackDays).toBeNull();
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
