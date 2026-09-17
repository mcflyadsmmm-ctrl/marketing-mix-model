import { describe, expect, it } from "vitest";
import {
  generateSnowdevilDepthOrders,
  snowdevilProductForAmount,
  SNOWDEVIL_DEPTH_MONTHS,
} from "./ltv-depth-sample";
import { buildLtvDepth, rollUpCustomers } from "./ltv-depth";
import { buildLtvFlagship } from "./ltv-flagship";

const NOW = new Date("2026-09-17T00:00:00Z");
const DAY = 86_400_000;

function avg(values: number[]): number {
  return values.reduce((s, v) => s + v, 0) / values.length;
}

describe("snowdevilProductForAmount", () => {
  it("maps order dollars to a plausible Snowdevil product", () => {
    expect(snowdevilProductForAmount(18)).toBe("Selling Plans Ski Wax");
    expect(snowdevilProductForAmount(45)).toBe("Trail Beanie");
    expect(snowdevilProductForAmount(150)).toBe("Alpine Jacket");
    expect(snowdevilProductForAmount(320)).toBe("The Collection Snowboard: Hydrogen");
    expect(snowdevilProductForAmount(900)).toBe("The Complete Snowboard");
  });
});

describe("generateSnowdevilDepthOrders", () => {
  it("is deterministic — same day, same book", () => {
    const a = generateSnowdevilDepthOrders(NOW);
    const b = generateSnowdevilDepthOrders(NOW);
    expect(a.length).toBe(b.length);
    expect(a.length).toBeGreaterThan(3000);
    // Compare a slice deeply (full equality would be huge but this is enough).
    expect(JSON.stringify(a.slice(0, 200))).toBe(JSON.stringify(b.slice(0, 200)));
  });

  it("never places an order in the future and carries product names", () => {
    const orders = generateSnowdevilDepthOrders(NOW);
    expect(orders.every((o) => o.orderedAt <= NOW)).toBe(true);
    expect(orders.every((o) => o.product != null && o.product !== "")).toBe(true);
    expect(orders.every((o) => o.amount >= 12 && o.units >= 1)).toBe(true);
    expect(orders.some((o) => o.discountCode === "WELCOME10")).toBe(true);
    expect(orders.some((o) => o.discountCode === "POWDER15")).toBe(true);
    expect(orders.some((o) => o.discountCode === "BUNDLE")).toBe(true);
    expect(orders.some((o) => o.discountAmount === 0)).toBe(true);
    const seen = new Set<string>();
    for (const order of orders) {
      const isFirst = !seen.has(order.customerKey);
      if (isFirst) seen.add(order.customerKey);
      else {
        expect(order.discountCode).toBeNull();
        expect(order.discountAmount).toBe(0);
      }
    }
  });

  it("spreads first orders across the rolling month window", () => {
    const customers = rollUpCustomers(generateSnowdevilDepthOrders(NOW));
    const months = new Set(customers.map((c) => c.cohortMonth));
    // Recent months plus matured older ones — a real spread, not one bucket.
    expect(months.size).toBeGreaterThanOrEqual(SNOWDEVIL_DEPTH_MONTHS - 1);
  });

  it("is calibrated to the page's own $145 / $380 / $820 hero neighborhood", () => {
    const customers = rollUpCustomers(generateSnowdevilDepthOrders(NOW));
    const first = avg(customers.map((c) => c.firstAmount));
    const d30 = avg(customers.map((c) => c.day30Spend));
    const d90 = avg(
      customers
        .filter((c) => NOW.getTime() - c.firstOrderedAt.getTime() >= 90 * DAY)
        .map((c) => c.day90Spend),
    );
    const d365 = avg(
      customers
        .filter((c) => NOW.getTime() - c.firstOrderedAt.getTime() >= 365 * DAY)
        .map((c) => c.day365Spend),
    );
    expect(first).toBeGreaterThan(120);
    expect(first).toBeLessThan(175);
    expect(d30).toBeGreaterThan(130);
    expect(d30).toBeLessThan(235);
    expect(d90).toBeGreaterThan(330);
    expect(d90).toBeLessThan(440);
    expect(d365).toBeGreaterThan(720);
    expect(d365).toBeLessThan(940);
  });
});

describe("SAMPLE depth is dense (reject thin)", () => {
  const view = buildLtvDepth(generateSnowdevilDepthOrders(NOW), NOW, {
    sample: true,
  });

  it("fills every panel of the depth pack", () => {
    expect(view.sample).toBe(true);
    expect(view.productsKnown).toBe(true);
    expect(view.curves).not.toBeNull();
    expect(view.curves!.series.length).toBeGreaterThanOrEqual(4);
    expect(view.retention).not.toBeNull();
    expect(view.retention!.rows.length).toBeGreaterThanOrEqual(6);
    expect(view.paths.length).toBeGreaterThanOrEqual(6);
    expect(view.aov.length).toBeGreaterThanOrEqual(5);
    expect(view.basket.length).toBeGreaterThanOrEqual(2);
    expect(view.whales).not.toBeNull();
  });

  it("tells an honest acquisition story — bigger first orders come back more", () => {
    const top = view.aov[0]!; // sorted by lifetime dollars
    const smallest = view.aov[view.aov.length - 1]!;
    expect(top.ltv).toBeGreaterThan(smallest.ltv);
    expect(top.repeatPct).toBeGreaterThan(smallest.repeatPct);
    // Best customers are a real slice of sales, mostly still ordering.
    expect(view.whales!.salesShare).toBeGreaterThan(0.15);
    expect(view.whales!.activeShare).toBeGreaterThan(0.5);
    expect(view.whales!.topProduct).toContain("Snowboard");
  });

  it("keeps the young months honestly blank on the retention grid", () => {
    const newest = view.retention!.rows[view.retention!.rows.length - 1]!;
    // The most recent first-order month has only M0 filled, the rest blank.
    expect(newest.cells[0]).toBe(1);
    expect(newest.cells[newest.cells.length - 1]).toBeNull();
  });
});

describe("SAMPLE refund gross is a second pass (net book unchanged)", () => {
  it("adds a known gross on every order and a real haircut on some", () => {
    const orders = generateSnowdevilDepthOrders(NOW);
    expect(orders.every((o) => o.grossAmount != null && o.grossAmount >= o.amount)).toBe(
      true,
    );
    const refunded = orders.filter(
      (o) => (o.grossAmount ?? 0) > o.amount + 0.005,
    );
    expect(refunded.length).toBeGreaterThan(50);
    const flagship = buildLtvFlagship(orders, NOW, { sample: true });
    expect(flagship.refunds.brokenOut).toBe(true);
    expect(flagship.refunds.refundedDollars).toBeGreaterThan(0);
  });
});
