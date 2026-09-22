import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  aovTiers,
  basketTiers,
  buildLtvDepth,
  cohortLtvCurves,
  monthsSince,
  pathLtv,
  retentionHeat,
  rollUpCustomers,
  whaleRecency,
  type DepthOrder,
} from "./ltv-depth";

function order(
  customerKey: string,
  iso: string,
  amount: number,
  units = 1,
  product: string | null = null,
): DepthOrder {
  return { customerKey, orderedAt: new Date(iso), amount, units, product };
}

describe("monthsSince (calendar month offset)", () => {
  it("counts whole elapsed months, not started ones", () => {
    expect(monthsSince(new Date("2024-01-10"), new Date("2024-03-10"))).toBe(2);
    // Day-of-month not yet reached → the month has not fully elapsed.
    expect(monthsSince(new Date("2024-01-31"), new Date("2024-02-15"))).toBe(0);
    expect(monthsSince(new Date("2024-01-01"), new Date("2024-01-20"))).toBe(0);
    expect(monthsSince(new Date("2024-11-05"), new Date("2025-02-05"))).toBe(3);
  });
});

describe("rollUpCustomers", () => {
  it("anchors the first order and sums the 30/90/365-day windows", () => {
    const rows = rollUpCustomers([
      order("c1", "2024-01-01", 100, 1, "Wax"),
      order("c1", "2024-01-20", 50, 2, "Beanie"), // +19d → in 30/90/365
      order("c1", "2024-03-15", 75, 1, "Gloves"), // +74d → in 90/365
      order("c1", "2024-06-01", 40, 1, "Wax"), // +152d → 365 only
    ]);
    expect(rows).toHaveLength(1);
    const c = rows[0]!;
    expect(c.cohortMonth).toBe("2024-01");
    expect(c.firstAmount).toBe(100);
    expect(c.firstProduct).toBe("Wax");
    expect(c.secondProduct).toBe("Beanie");
    expect(c.orderCount).toBe(4);
    expect(c.day30Spend).toBe(150);
    expect(c.day90Spend).toBe(225);
    expect(c.day365Spend).toBe(265);
    expect(c.day30Gross).toBeNull();
    expect(c.day90Gross).toBeNull();
    expect(c.day365Gross).toBeNull();
    expect(c.lifetimeSpend).toBe(265);
    expect(c.ordersD30).toBe(2);
    expect(c.ordersD90).toBe(3);
    expect(c.ordersD365).toBe(4);
    expect(c.reorderDays).toBe(19);
    expect(c.firstDiscountAmount).toBeNull();
    expect(c.firstGrossAmount).toBeNull();
    expect(c.firstDiscountCode).toBeNull();
  });

  it("keeps first-order discount $ and code without inventing a missing title", () => {
    const [coded] = rollUpCustomers([
      {
        customerKey: "c1",
        orderedAt: new Date("2024-01-01"),
        amount: 80,
        units: 1,
        product: null,
        discountAmount: 8,
        discountCode: "BUNDLE",
      },
    ]);
    expect(coded?.firstDiscountAmount).toBe(8);
    expect(coded?.firstGrossAmount).toBeNull();
    expect(coded?.firstDiscountCode).toBe("BUNDLE");

    const [amountOnly] = rollUpCustomers([
      {
        customerKey: "c2",
        orderedAt: new Date("2024-01-01"),
        amount: 80,
        units: 1,
        product: null,
        discountAmount: 8,
      },
    ]);
    expect(amountOnly?.firstDiscountAmount).toBe(8);
    expect(amountOnly?.firstDiscountCode).toBeNull();
  });

  it("ignores empty keys and non-finite amounts", () => {
    const rows = rollUpCustomers([
      order("", "2024-01-01", 100),
      order("c2", "2024-01-01", Number.NaN),
    ]);
    // c2's only order is non-finite → no valid first order, dropped.
    expect(rows).toHaveLength(0);
  });
});

describe("cohortLtvCurves (spend-build, honest maturity)", () => {
  it("plots only fully-elapsed month offsets and stays monotonic", () => {
    const asOf = new Date("2024-06-01");
    // First order month 2024-01 → elapsed 5 months → offsets 0..4 fully elapsed.
    const orders: DepthOrder[] = [];
    for (let i = 0; i < 12; i += 1) {
      orders.push(order(`c${i}`, "2024-01-10", 100));
      orders.push(order(`c${i}`, "2024-02-10", 60)); // offset 1
      orders.push(order(`c${i}`, "2024-04-10", 40)); // offset 3
    }
    const customers = rollUpCustomers(orders);
    const curves = cohortLtvCurves(customers, asOf);
    expect(curves).not.toBeNull();
    const series = curves!.series[0]!;
    expect(series.cohortMonth).toBe("2024-01");
    // Offsets 0..4 (5 elapsed − 1 → last full is 4).
    expect(series.points.map((p) => p.offset)).toEqual([0, 1, 2, 3, 4]);
    const cum = series.points.map((p) => p.cumPerCustomer);
    for (let i = 1; i < cum.length; i += 1) {
      expect(cum[i]!).toBeGreaterThanOrEqual(cum[i - 1]!);
    }
    expect(cum[0]).toBe(100);
    expect(cum[1]).toBe(160);
  });

  it("returns null when no group has enough elapsed months", () => {
    const asOf = new Date("2024-01-20");
    const customers = rollUpCustomers([
      order("c1", "2024-01-10", 100),
      order("c2", "2024-01-11", 100),
    ]);
    expect(cohortLtvCurves(customers, asOf)).toBeNull();
  });
});

describe("retentionHeat (honest blanks, never fake 0%)", () => {
  it("M0 is 100% and un-elapsed months are null", () => {
    const asOf = new Date("2024-03-01");
    // 2024-01 group, elapsed 2 → offset 1 fully elapsed, offset 2+ null.
    const orders: DepthOrder[] = [];
    for (let i = 0; i < 10; i += 1) orders.push(order(`c${i}`, "2024-01-15", 100));
    // Half come back in offset 1 (February).
    for (let i = 0; i < 5; i += 1) orders.push(order(`c${i}`, "2024-02-15", 50));
    const heat = retentionHeat(rollUpCustomers(orders), asOf, { maxRows: 12 });
    expect(heat).not.toBeNull();
    const row = heat!.rows[0]!;
    expect(row.cells[0]).toBe(1);
    expect(row.cells[1]).toBeCloseTo(0.5, 5);
    expect(row.cells[2]).toBeNull();
    expect(row.cells[3]).toBeNull();
  });
});

describe("pathLtv (first → second product)", () => {
  it("keeps journeys above the buyer floor and drops thin/no-title ones", () => {
    const asOf = new Date("2025-06-01");
    const orders: DepthOrder[] = [];
    // 6 buyers Goggles → Board (above PATH_MIN_BUYERS = 5).
    for (let i = 0; i < 6; i += 1) {
      orders.push(order(`g${i}`, "2024-01-10", 90, 1, "Goggles"));
      orders.push(order(`g${i}`, "2024-02-10", 300, 1, "Board"));
    }
    // 2 buyers Wax → Wax (below floor → dropped).
    for (let i = 0; i < 2; i += 1) {
      orders.push(order(`w${i}`, "2024-01-10", 20, 1, "Wax"));
      orders.push(order(`w${i}`, "2024-02-10", 20, 1, "Wax"));
    }
    // Untitled repeat buyers (live) never form a path.
    for (let i = 0; i < 8; i += 1) {
      orders.push(order(`n${i}`, "2024-01-10", 90));
      orders.push(order(`n${i}`, "2024-02-10", 90));
    }
    const paths = pathLtv(rollUpCustomers(orders), asOf);
    expect(paths).toHaveLength(1);
    expect(paths[0]!.first).toBe("Goggles");
    expect(paths[0]!.second).toBe("Board");
    expect(paths[0]!.buyers).toBe(6);
    expect(paths[0]!.lifetimeLtv).toBe(390);
    // First order Jan 2024 is > 90 days before asOf → matured.
    expect(paths[0]!.day90N).toBe(6);
    expect(paths[0]!.day90Ltv).toBe(390);
  });
});

describe("aov & basket tiers (first order → what they become)", () => {
  const asOf = new Date("2025-06-01");
  function tierOrders(): DepthOrder[] {
    const orders: DepthOrder[] = [];
    // 10 small first orders ($120, 1 item), half repeat.
    for (let i = 0; i < 10; i += 1) {
      orders.push(order(`a${i}`, "2024-01-10", 120, 1));
      if (i < 5) orders.push(order(`a${i}`, "2024-02-10", 120, 1));
    }
    // 10 big first orders ($300, 3 items), all repeat.
    for (let i = 0; i < 10; i += 1) {
      orders.push(order(`b${i}`, "2024-01-10", 300, 3));
      orders.push(order(`b${i}`, "2024-03-10", 300, 3));
    }
    return orders;
  }

  it("groups AOV bands with repeat %, lifetime and 90-day value", () => {
    const rows = aovTiers(rollUpCustomers(tierOrders()), asOf);
    const big = rows.find((r) => r.label === "$250+")!;
    const mid = rows.find((r) => r.label === "$100–150")!;
    expect(big.buyers).toBe(10);
    expect(big.repeatPct).toBe(1);
    expect(big.ltv).toBe(600);
    expect(mid.buyers).toBe(10);
    expect(mid.repeatPct).toBe(0.5);
    // Sorted by lifetime net dollars → the big band leads.
    expect(rows[0]!.label).toBe("$250+");
  });

  it("groups first-order basket sizes", () => {
    const rows = basketTiers(rollUpCustomers(tierOrders()), asOf);
    const one = rows.find((r) => r.label === "1 item")!;
    const threeFour = rows.find((r) => r.label === "3–4 items")!;
    expect(one.buyers).toBe(10);
    expect(threeFour.buyers).toBe(10);
    expect(threeFour.ltv).toBe(600);
  });
});

describe("whaleRecency (best customers & when they last ordered)", () => {
  it("takes the top decile, their sales share, and recency buckets", () => {
    const asOf = new Date("2024-02-01");
    const orders: DepthOrder[] = [];
    // 18 modest buyers ($50), 2 whales ($1000) → 20 buyers, decile = 2.
    for (let i = 0; i < 18; i += 1) orders.push(order(`s${i}`, "2024-01-25", 50));
    orders.push(order("w1", "2024-01-28", 1000)); // 4 days before asOf
    orders.push(order("w2", "2024-01-30", 1000)); // 2 days before asOf
    const w = whaleRecency(rollUpCustomers(orders), asOf)!;
    expect(w).not.toBeNull();
    expect(w.buyers).toBe(20);
    expect(w.whaleCount).toBe(2);
    expect(w.threshold).toBe(1000);
    // 2000 of (900 + 2000) total lifetime.
    expect(w.salesShare).toBeCloseTo(2000 / 2900, 4);
    expect(w.activeShare).toBe(1);
    expect(w.buckets.find((b) => b.key === "d30")!.count).toBe(2);
    expect(w.everyoneAvg).toBeCloseTo(2900 / 20, 5);
    expect(w.ltvMultiple).toBeCloseTo(1000 / (2900 / 20), 4);
    expect(w.coldShare).toBe(0);
  });

  it("reports cold share when a whale last ordered over 180 days ago", () => {
    const asOf = new Date("2024-08-01");
    const orders: DepthOrder[] = [];
    for (let i = 0; i < 18; i += 1) {
      orders.push(order(`s${i}`, "2024-07-20", 50));
    }
    orders.push(order("cold", "2023-12-01", 1000));
    orders.push(order("hot", "2024-07-28", 1000));
    const w = whaleRecency(rollUpCustomers(orders), asOf)!;
    expect(w.whaleCount).toBe(2);
    expect(w.coldShare).toBe(0.5);
    expect(w.buckets.find((b) => b.key === "d180plus")!.count).toBe(1);
  });

  it("stays null below the identified-buyer floor", () => {
    const orders = Array.from({ length: 10 }, (_, i) =>
      order(`c${i}`, "2024-01-10", 100),
    );
    expect(whaleRecency(rollUpCustomers(orders), new Date("2024-02-01"))).toBeNull();
  });
});

describe("buildLtvDepth", () => {
  it("marks products unknown and drops journeys when titles are hidden (live)", () => {
    const asOf = new Date("2024-03-01");
    const orders: DepthOrder[] = [];
    for (let i = 0; i < 25; i += 1) {
      orders.push(order(`c${i}`, "2024-01-10", 120)); // no product
      if (i < 10) orders.push(order(`c${i}`, "2024-02-10", 120));
    }
    const view = buildLtvDepth(orders, asOf, { sample: false });
    expect(view.sample).toBe(false);
    expect(view.productsKnown).toBe(false);
    expect(view.paths).toEqual([]);
    expect(view.buyers).toBe(25);
  });
});

describe("LTV depth withholds a longer Shopify life", () => {
  it("maps lifetimeOrders and names truncated buyers instead of treating the stored book as the life", () => {
    const here = dirname(fileURLToPath(import.meta.url));
    const page = readFileSync(join(here, "ltv-depth-page.server.ts"), "utf8");
    expect(page).toContain("lifetimeOrders");
    expect(page).toContain("truncatedLifetimeBuyers");
    expect(page).toMatch(/orders on this desk only|longer Shopify life/);
  });
});
