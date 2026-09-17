import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  ORDERS_SPEND_BANS,
  buildOrdersChartBars,
  buildOrdersClock,
  buildOrdersDepthFacts,
  buildOrdersHero,
  buildOrdersTimingFacts,
  ordersHasShare,
  ordersHourBreakdown,
  ordersSourceMixLine,
  ordersWeekdayBreakdown,
} from "./orders-scoreboard";
import type { ShopifyDepthStats } from "./shopify-depth-stats";
import type { ShopifyNativePeriodStats } from "./shopify-native-stats";

const here = dirname(fileURLToPath(import.meta.url));

function read(rel: string): string {
  return readFileSync(join(here, rel), "utf8");
}

const ORDERS_REQUIRED = [
  "Typical order",
  "Average",
  "Original",
  "After returns",
  "Product only",
  "Most orders",
  "Typical day",
  "Discounted",
  "full price",
  "Items per order",
  "2+ items",
  "Returns",
  "Shipping + tax",
  "Weekend",
  "Busiest weekday",
  "Busiest hour",
  "Biggest three days",
  "Online",
  "POS",
  "Shop",
] as const;

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

function snowdevilBook(): ShopifyNativePeriodStats {
  return {
    orderCount: 108,
    aov: 634,
    newCustomers: 36,
    returningCustomers: 44,
    guestOrders: 8,
    guestShare: 0.07,
    newBuyerShare: 0.45,
    newSalesShare: 0.34,
    returningSalesShare: 0.66,
    newSales: 23_048,
    returningSales: 45_409,
    returnsDrag: 4370,
    returnsDragPct: 0.06,
    customerMetricsAvailable: true,
    newBuyerArpu: 640,
    returningBuyerArpu: 1032,
  };
}

describe("orders scoreboard helpers", () => {
  it("hero is the median ticket with Shopify’s average as the hint", () => {
    const hero = buildOrdersHero(snowdevilDepth(), "USD", false);
    expect(hero.k).toBe("Typical order");
    expect(hero.v).toBe("$631");
    expect(hero.sub).toMatch(/Average order \$634/);
    expect(hero.sub).toMatch(/Shopify Analytics uses the average/);
    expect(hero.def).toMatch(/108/);
  });

  it("sales clock is original · after returns · product only", () => {
    const clock = buildOrdersClock(
      {
        gross: 72_827,
        grossKnown: true,
        total: 68_457,
        net: 60_242,
        netKnown: true,
      },
      "USD",
    );
    expect(clock.map((item) => item.k)).toEqual([
      "Original",
      "After returns",
      "Product only",
    ]);
    expect(clock[0]?.v).toBe("$72,827");
    expect(clock[1]?.v).toBe("$68,457");
    expect(clock[2]?.v).toBe("$60,242");
  });

  it("depth rows cover the TAB_LOCK order book", () => {
    const rows = buildOrdersDepthFacts(snowdevilBook(), snowdevilDepth(), "USD");
    const blob = rows.map((row) => `${row.k} ${row.v} ${row.s ?? ""}`).join(" · ");
    expect(blob).toMatch(/Most orders/);
    expect(blob).toMatch(/\$548–\$694/);
    expect(blob).toMatch(/Typical day/);
    expect(blob).toMatch(/\$4,279/);
    expect(blob).toMatch(/Discounted/);
    expect(blob).toMatch(/20%/);
    expect(blob).toMatch(/full price vs discounted/i);
    expect(blob).toMatch(/\$640 vs \$598/);
    expect(blob).toMatch(/Items per order/);
    expect(blob).toMatch(/1\.5/);
    expect(blob).toMatch(/2\+ items/);
    expect(blob).toMatch(/50%/);
    expect(blob).toMatch(/Returns/);
    expect(blob).toMatch(/\$4,370/);
    expect(blob).toMatch(/Shipping \+ tax/);
    expect(blob).toMatch(/\$8,215/);
    expect(rows.every((row) => row.v !== "—")).toBe(true);
  });

  it("timing rows name weekend, weekday breakdown, hour, biggest days, and source typicals", () => {
    const rows = buildOrdersTimingFacts(snowdevilDepth(), "USD");
    const blob = rows
      .map((row) => `${row.k} ${row.v} ${row.s ?? ""} ${(row.x ?? []).join(" ")}`)
      .join(" · ");
    expect(blob).toMatch(/Weekend/);
    expect(blob).toMatch(/23%/);
    expect(blob).toMatch(/Busiest weekday/);
    expect(blob).toMatch(/Wed/);
    expect(ordersWeekdayBreakdown(snowdevilDepth().weekdaySalesShare)).toMatch(
      /Wed/,
    );
    expect(blob).toMatch(/Busiest hour/);
    expect(blob).toMatch(/2–3 pm|2-3 pm/);
    expect(ordersHourBreakdown(snowdevilDepth().hourlySalesShare)).toMatch(/pm/);
    expect(blob).toMatch(/Biggest three days/);
    expect(blob).toMatch(/28%/);
    expect(ordersSourceMixLine(snowdevilDepth().sourceSalesShare)).toMatch(
      /Online 72%/,
    );
    expect(blob).toMatch(/Online/);
    expect(blob).toMatch(/POS/);
    expect(blob).toMatch(/Shop/);
    expect(blob).toMatch(/\$640/);
    expect(blob).toMatch(/\$598/);
    expect(blob).toMatch(/\$612/);
  });

  it("drops a share that rounds to 0% instead of printing 0%", () => {
    expect(ordersHasShare(0.004)).toBe(false);
    expect(ordersHasShare(0.006)).toBe(true);
  });

  it("weekday / hour chart bars carry dollars and mark weekend + peak", () => {
    const week = buildOrdersChartBars({
      grain: "weekday",
      weekdayShares: snowdevilDepth().weekdaySalesShare,
      hourlyShares: snowdevilDepth().hourlySalesShare,
      windowSales: 68_457,
      peakWeekday: 3,
      peakHour: 14,
    });
    expect(week).toHaveLength(7);
    expect(week[0]?.weekend).toBe(true);
    expect(week[6]?.weekend).toBe(true);
    expect(week[3]?.peak).toBe(true);
    expect(week[3]?.label).toBe("Wed");
    expect(week[3]?.dollars).toBeCloseTo(68_457 * 0.194, 0);

    const hours = buildOrdersChartBars({
      grain: "hour",
      weekdayShares: snowdevilDepth().weekdaySalesShare,
      hourlyShares: snowdevilDepth().hourlySalesShare,
      windowSales: 68_457,
      peakWeekday: 3,
      peakHour: 14,
    });
    expect(hours).toHaveLength(24);
    expect(hours[14]?.peak).toBe(true);
    expect(hours[14]?.label).toMatch(/2–3 pm|2-3 pm/);
  });
});

describe("Orders page craft lock", () => {
  const orders = read("../routes/app.orders.tsx");
  const scoreboard = read("../components/OrdersScoreboard.tsx");
  const chart = read("../components/OrdersTimingChart.tsx");

  it("is a Black Clover scoreboard — hero, clock, depth, timing, then the open chart", () => {
    const heroAt = orders.indexOf("<OrdersScoreboard");
    const chartAt = orders.indexOf("<OrdersTimingChart");
    expect(heroAt).toBeGreaterThan(-1);
    expect(chartAt).toBeGreaterThan(heroAt);
    expect(orders).toContain("mcfly-scoreboard--orders");
    expect(orders).toContain("salesPending");
    expect(orders).toContain("not $0");
    expect(orders).not.toContain("if (metrics.salesPending) return");
    expect(scoreboard).toContain("mcfly-orders-hero");
    expect(scoreboard).toContain("mcfly-book__clock");
    expect(scoreboard).toContain("mcfly-kpi-grid--orders-depth");
    expect(scoreboard).toContain("mcfly-kpi-grid--orders-timing");
    expect(scoreboard).toContain("buildOrdersHero");
    expect(scoreboard).toContain("buildOrdersClock");
    expect(scoreboard).toContain("buildOrdersDepthFacts");
    expect(scoreboard).toContain("buildOrdersTimingFacts");
    expect(chart).toContain("mcfly-chart__board");
    expect(chart).toContain("Weekday");
    expect(chart).toContain("Hour");
    expect(chart).toContain("mcfly-period__btn");
    expect(chart).toContain("buildOrdersChartBars");
  });

  it("paints every TAB_LOCK Orders fact on the scoreboard, not a pamphlet", () => {
    const blob = `${scoreboard}\n${read("./orders-scoreboard.ts")}\n${read("./product-labels.ts")}`;
    for (const phrase of ORDERS_REQUIRED) {
      expect(blob.toLowerCase()).toContain(phrase.toLowerCase());
    }
    expect(scoreboard).toContain("mcfly-kpi--peek");
    expect(scoreboard).not.toContain("<details");
    expect(scoreboard).not.toContain("Click a card below for detail");
  });

  it("keeps spend / ROAS / upload / Harbor / QuietSpendDoor off Orders", () => {
    for (const source of [orders, scoreboard, chart]) {
      for (const ban of ORDERS_SPEND_BANS) {
        expect(source).not.toContain(ban);
      }
      expect(source).not.toContain("Harbor");
      expect(source).not.toContain("QuietSpendDoor");
      expect(source).not.toContain("0.00×");
      expect(source).not.toContain("SpendExplorer");
    }
  });

  it("contrasts typical/median with Shopify Analytics average", () => {
    expect(`${orders}\n${scoreboard}`).toMatch(/Shopify Analytics/);
    expect(`${orders}\n${scoreboard}`).toMatch(/average/i);
    expect(`${orders}\n${scoreboard}`).toMatch(/typical/i);
    expect(`${orders}\n${scoreboard}`).toMatch(/median/i);
    expect(`${orders}\n${scoreboard}`).toMatch(/Online vs POS/);
  });
});
