import { describe, expect, it } from "vitest";
import {
  aggregateOrderRows,
  buildOrdersFrequency,
  buildOrdersIntelDays,
  buildOrdersIntelKpis,
  buildOrdersWeeklyRows,
  ordersIntelDelta,
  type OrderIntelRow,
} from "./orders-intelligence";

function row(
  day: string,
  amount: number,
  customerKey: string,
  discount = 0,
): OrderIntelRow {
  const at = new Date(`${day}T12:00:00Z`);
  return {
    customerKey,
    amount,
    discountAmount: discount,
    orderedAt: at,
    shopLocalDate: new Date(`${day}T00:00:00Z`),
  };
}

/** Two closed days: c1 is new+returning, c2 new, one guest. */
function sampleRows(): OrderIntelRow[] {
  return [
    row("2026-09-07", 600, "sample:c1", 0),
    row("2026-09-07", 700, "sample:c2", 100),
    row("2026-09-08", 500, "sample:c1", 0),
    row("2026-09-08", 640, "guest", 0),
  ];
}

describe("orders intelligence aggregate", () => {
  it("totals orders, sales, AOV, and the discount depth (Σ discount ÷ gross)", () => {
    const agg = aggregateOrderRows(sampleRows());
    expect(agg.orders).toBe(4);
    expect(agg.sales).toBe(2440);
    expect(agg.aov).toBe(610);
    // gross = sales + discounts = 2440 + 100 = 2540 → 100/2540
    expect(agg.discountDepth).toBeCloseTo(100 / 2540, 5);
  });

  it("splits new vs returning by first identified order in the window", () => {
    const agg = aggregateOrderRows(sampleRows());
    // c1 first (9/7) = new, c1 (9/8) = returning, c2 = new. Guest excluded.
    expect(agg.newOrders).toBe(2);
    expect(agg.returningOrders).toBe(1);
    // new sales = c1 600 + c2 700 = 1300 of 2440 total
    expect(agg.newSalesShare).toBeCloseTo(1300 / 2440, 5);
  });

  it("buckets the daily series with per-day AOV", () => {
    const days = buildOrdersIntelDays(sampleRows());
    expect(days.map((d) => d.dateKey)).toEqual(["2026-09-07", "2026-09-08"]);
    expect(days[0]).toMatchObject({ orders: 2, sales: 1300, aov: 650 });
    expect(days[1]).toMatchObject({ orders: 2, sales: 1140, aov: 570 });
  });
});

describe("orders intelligence KPIs", () => {
  it("shows vs-prior deltas on orders, sales, and AOV", () => {
    const current = aggregateOrderRows(sampleRows());
    const prior = aggregateOrderRows([
      row("2026-06-09", 500, "sample:x1"),
      row("2026-06-10", 500, "sample:x2"),
    ]);
    const kpis = buildOrdersIntelKpis(current, prior, "USD");
    const byKey = Object.fromEntries(kpis.map((k) => [k.key, k]));
    expect(byKey.orders?.value).toBe("4");
    expect(byKey.orders?.delta?.dir).toBe("up");
    expect(byKey.sales?.value).toBe("$2,440");
    expect(byKey.aov?.value).toBe("$610");
    expect(byKey.newShare?.sub).toMatch(/new/);
    expect(byKey.newShare?.sub).toMatch(/returning/);
    expect(byKey.discount?.sub).toMatch(/gross/);
    // New share and discount depth carry no vs-prior delta (match the ref).
    expect(byKey.newShare?.delta).toBeUndefined();
    expect(byKey.discount?.delta).toBeUndefined();
  });

  it("drops deltas when there is no complete prior window", () => {
    const current = aggregateOrderRows(sampleRows());
    const kpis = buildOrdersIntelKpis(current, null, "USD");
    for (const kpi of kpis) expect(kpi.delta).toBeUndefined();
  });

  it("delta direction is up / down / flat with a guard on zero prior", () => {
    expect(ordersIntelDelta(110, 100)?.dir).toBe("up");
    expect(ordersIntelDelta(90, 100)?.dir).toBe("down");
    expect(ordersIntelDelta(100, 100)?.dir).toBe("flat");
    expect(ordersIntelDelta(100, 0)).toBeNull();
  });
});

describe("orders weekly ledger", () => {
  it("buckets rows into Monday-start weeks with AOV, discount depth, and trend", () => {
    const rows: OrderIntelRow[] = [
      // Week of Mon 2026-09-07
      row("2026-09-07", 600, "a", 0),
      row("2026-09-08", 800, "b", 200),
      // Week of Mon 2026-09-14
      row("2026-09-14", 500, "c", 0),
    ];
    const weeks = buildOrdersWeeklyRows(rows);
    expect(weeks.map((w) => w.weekKey)).toEqual(["2026-09-07", "2026-09-14"]);
    expect(weeks[0]).toMatchObject({ orders: 2, sales: 1400, aov: 700 });
    // discount depth wk1 = 200 / (1400 + 200)
    expect(weeks[0]!.discountDepth).toBeCloseTo(200 / 1600, 5);
    expect(weeks[0]!.ordersDelta).toBeNull();
    // wk2 orders 1 vs wk1 orders 2 → down
    expect(weeks[1]!.ordersDelta?.dir).toBe("down");
    expect(weeks[1]!.label).toMatch(/Wk of Sep 14/);
  });
});

describe("orders frequency distribution", () => {
  it("buckets identified customers by order count and excludes guests", () => {
    const rows: OrderIntelRow[] = [
      row("2026-09-01", 600, "sample:a"),
      row("2026-09-02", 600, "sample:b"),
      row("2026-09-03", 600, "sample:b"),
      row("2026-09-04", 600, "sample:c"),
      row("2026-09-05", 600, "sample:c"),
      row("2026-09-06", 600, "sample:c"),
      row("2026-09-07", 600, "guest"),
    ];
    const freq = buildOrdersFrequency(rows);
    const byKey = Object.fromEntries(freq.map((b) => [b.key, b.customers]));
    expect(byKey["1"]).toBe(1);
    expect(byKey["2"]).toBe(1);
    expect(byKey["3"]).toBe(1);
    // no customer has 4+ → those buckets are dropped
    expect(freq.some((b) => b.key === "4")).toBe(false);
    expect(freq.every((b) => b.customers > 0)).toBe(true);
  });
});
