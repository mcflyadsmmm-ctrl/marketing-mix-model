import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  ORDERS_ANALYTICS_CONTRAST,
  ORDERS_CLOCK_LANE_LABEL,
  ORDERS_FIRST_FOLD_HEROES,
  ORDERS_FIRST_LANE_LABEL,
  ORDERS_PENDING_LINE,
  ORDERS_THIN_EMPTY_LINE,
  buildOrdersLeadPeeks,
  ordersHeroBeatsShopifyAnalytics,
  ordersOperatorGreeting,
} from "./orders-first-viewport";
import { ORDERS_SPEND_BANS } from "./orders-scoreboard";
import type { ShopifyDepthStats } from "./shopify-depth-stats";

const here = dirname(fileURLToPath(import.meta.url));

function read(rel: string) {
  return readFileSync(join(here, rel), "utf8");
}

function snowdevilDepth(): ShopifyDepthStats {
  return {
    orderCount: 108,
    meanAov: 634,
    medianAov: 631,
    repeatSalesShare: 0.41,
    oneAndDoneShare: 0.62,
    identifiedBuyers: 80,
    repeatBuyers: 22,
    medianDaysToSecond: 18,
    secondOrderWithin30Share: 0.28,
    eligibleFirstTimers: 40,
    secondOrderBuyers: 14,
    thirdPlusBuyers: 8,
    secondOrderBuyerShare: 0.18,
    thirdPlusBuyerShare: 0.1,
    medianFirstOrder: 610,
    medianSecondOrder: 640,
    medianDailySales: 4279,
    topDecileSalesShare: 0.22,
    topCustomerSalesShare: 0.31,
    guestAov: 590,
    identifiedAov: 640,
    shippingTaxFees: 8215,
    shippingTaxFeesPct: 0.12,
    bestThreeDayShare: 0.28,
    dayCountWithSales: 16,
    weekendSalesShare: 0.23,
    weekdaySalesShare: [0.11, 0.125, 0.192, 0.194, 0.128, 0.134, 0.117],
    peakWeekday: 3,
    ordersPerBuyer: 1.3,
    aovP25: 548,
    aovP75: 694,
    peakHour: 14,
    hourlySalesShare: Array.from({ length: 24 }, (_, hour) =>
      hour >= 10 && hour <= 17 ? 0.125 : 0,
    ),
    discountedOrderShare: 0.2,
    meanDiscountAmount: 76,
    meanUnitCount: 1.5,
    multiUnitOrderShare: 0.5,
    fullPriceMedianAov: 640,
    discountedMedianAov: 598,
    sourceSalesShare: { online: 0.72, pos: 0.18, shop: 0.1, other: 0 },
    sourceMedianAov: { online: 640, pos: 598, shop: 612 },
  };
}

describe("ordersOperatorGreeting", () => {
  it("leads with typical (median) vs Shopify Analytics average", () => {
    expect(
      ordersOperatorGreeting({
        salesPending: false,
        orderCount: 108,
        typicalOrderLabel: "$631",
        averageOrderLabel: "$634",
      }),
    ).toBe(
      "Typical order around $631. Average is $634. Shopify Analytics Orders is the average order.",
    );
    expect(ORDERS_ANALYTICS_CONTRAST).not.toMatch(/sessions|ROAS|spend/i);
    expect(ORDERS_FIRST_LANE_LABEL).toMatch(/Typical order/);
    expect(ORDERS_FIRST_LANE_LABEL).toMatch(/average/i);
    expect(ORDERS_CLOCK_LANE_LABEL).toMatch(/clock/i);
    expect(ORDERS_CLOCK_LANE_LABEL).toMatch(/intelligence/i);
    expect(ORDERS_THIN_EMPTY_LINE).toMatch(/not \$0/);
  });

  it("does not greet thin or pending shops as a $0 Average Order board", () => {
    expect(
      ordersOperatorGreeting({
        salesPending: true,
        orderCount: 0,
        typicalOrderLabel: null,
        averageOrderLabel: null,
      }),
    ).toBe(ORDERS_PENDING_LINE);
    expect(
      ordersOperatorGreeting({
        salesPending: false,
        orderCount: 0,
        typicalOrderLabel: null,
        averageOrderLabel: null,
      }),
    ).toBe("No orders in this window yet.");
  });
});

describe("buildOrdersLeadPeeks", () => {
  it("elevates full vs discounted, 2+ items, and items/order next to typical", () => {
    const peeks = buildOrdersLeadPeeks(snowdevilDepth(), "USD");
    expect(peeks.map((peek) => peek.k)).toEqual([
      "Typical · full price vs discounted",
      "Orders with 2+ items",
      "Items per order",
    ]);
    expect(peeks[0]?.v).toBe("$640 vs $598");
    expect(peeks[1]?.v).toBe("50%");
    expect(peeks[2]?.v).toBe("1.5");
  });

  it("drops missing basket truths — never a $0 / 0% peek graveyard", () => {
    const peeks = buildOrdersLeadPeeks(
      {
        ...snowdevilDepth(),
        fullPriceMedianAov: null,
        discountedMedianAov: null,
        multiUnitOrderShare: 0.004,
        meanUnitCount: 0,
      },
      "USD",
    );
    expect(peeks).toEqual([]);
  });
});

describe("Orders first-fold SCORECARD vs free Shopify Analytics", () => {
  it("PASS only when every first-fold hero is Mcfly-differentiated", () => {
    expect([...ORDERS_FIRST_FOLD_HEROES]).toEqual([
      "typicalOrder",
      "fullVsDiscounted",
      "multiItem",
      "itemsPerOrder",
    ]);
    for (const hero of ORDERS_FIRST_FOLD_HEROES) {
      expect(ordersHeroBeatsShopifyAnalytics(hero)).toBe(true);
    }
    const orders = read("../routes/app.orders.tsx");
    const firstView = read("../components/OrdersFirstViewport.tsx");
    expect(orders).toContain("ORDERS_FIRST_LANE_LABEL");
    expect(orders).toContain("ORDERS_CLOCK_LANE_LABEL");
    expect(orders).toContain("<OrdersFirstViewport");
    expect(orders.indexOf("<OrdersFirstViewport")).toBeLessThan(
      orders.indexOf("<OrdersScoreboard"),
    );
    expect(orders.indexOf("<OrdersScoreboard")).toBeLessThan(
      orders.indexOf("<OrdersIntelligence"),
    );
    expect(firstView).toContain("mcfly-kpi-grid--peeks-lead");
    expect(firstView).toContain("mcfly-orders-hero");
    expect(firstView).toContain("if (salesPending)");
    expect(firstView).toContain("ORDERS_THIN_EMPTY_LINE");
    expect(firstView).toContain("SAMPLE_ORDERS_DOOR");
    expect(firstView).not.toContain("0.00×");
    for (const ban of ORDERS_SPEND_BANS) {
      expect(firstView).not.toContain(ban);
      expect(orders).not.toContain(ban);
    }
    expect(orders).not.toContain("/app/spend");
    expect(orders).not.toContain("Total ROAS");
  });
});

describe("Uninstall FAIL #3 SCORECARD — first Orders lane is typical-order hero only", () => {
  it("PASS when Total Sales clock and OrdersIntelligence sit below the first fold", () => {
    const orders = read("../routes/app.orders.tsx");
    const firstStart = orders.indexOf('<DeskLane rank="first"');
    const firstEnd = orders.indexOf("<DeskLane", firstStart + 1);
    expect(firstStart).toBeGreaterThan(-1);
    expect(firstEnd).toBeGreaterThan(firstStart);
    const firstLane = orders.slice(firstStart, firstEnd);
    expect(firstLane).toContain("ORDERS_FIRST_LANE_LABEL");
    expect(firstLane).toContain("<OrdersFirstViewport");
    expect(firstLane).not.toContain("<OrdersScoreboard");
    expect(firstLane).not.toContain("<OrdersIntelligence");
    expect(firstLane).not.toContain("mcfly-book__clock");
    expect(firstLane).not.toContain("totalSalesDisplay");

    const clockLane = orders.slice(firstEnd);
    expect(clockLane).toContain("ORDERS_CLOCK_LANE_LABEL");
    expect(clockLane).toContain("<OrdersScoreboard");
    expect(clockLane).toContain("<OrdersIntelligence");
    expect(orders.indexOf("<OrdersFirstViewport")).toBeLessThan(
      orders.indexOf('rank="next" label={ORDERS_CLOCK_LANE_LABEL}'),
    );
    expect(orders.indexOf('rank="next" label={ORDERS_CLOCK_LANE_LABEL}')).toBeLessThan(
      orders.indexOf('rank="next" label="Weekday and hour"'),
    );
  });
});
