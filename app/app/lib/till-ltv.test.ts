import { describe, expect, it } from "vitest";
import {
  computeCohortRollups,
  ORDER_FACT_GUEST_KEY,
} from "./order-facts.server";

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
