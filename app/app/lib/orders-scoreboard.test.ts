import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  ORDERS_SPEND_BANS,
  buildOrdersChartBars,
  buildOrdersClock,
  buildOrdersClockBar,
  buildOrdersDepthFacts,
  buildOrdersHero,
  buildOrdersShapeBars,
  buildOrdersSourceBar,
  buildOrdersTicketBand,
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

  it("SAMPLE sales clock stays em dash; Live paints ShopifyQL clocks", () => {
    const clocks = {
      gross: 72_827,
      grossKnown: true,
      total: 68_457,
      net: 60_242,
      netKnown: true,
    };
    const sample = buildOrdersClock(clocks, "USD", true);
    expect(sample.map((item) => item.k)).toEqual([
      "Gross sales",
      "Total Sales",
      "Net Sales",
    ]);
    expect(sample.map((item) => item.v)).toEqual(["—", "—", "—"]);

    const live = buildOrdersClock(clocks, "USD", false);
    expect(live.map((item) => item.k)).toEqual([
      "Original",
      "After returns",
      "Product only",
    ]);
    expect(live.map((item) => item.v)).toEqual(["$72,827", "$68,457", "$60,242"]);
  });

  it("depth rows cover ticket, day, discount, returns — basket peeks live on the first fold", () => {
    const rows = buildOrdersDepthFacts(snowdevilBook(), snowdevilDepth(), "USD");
    const blob = rows.map((row) => `${row.k} ${row.v} ${row.s ?? ""}`).join(" · ");
    expect(blob).toMatch(/Most orders/);
    expect(blob).toMatch(/\$548–\$694/);
    expect(blob).toMatch(/Typical day/);
    expect(blob).toMatch(/\$4,279/);
    expect(blob).toMatch(/Discounted/);
    expect(blob).toMatch(/20%/);
    expect(blob).not.toMatch(/full price vs discounted/i);
    expect(blob).not.toMatch(/Items per order/);
    expect(blob).not.toMatch(/2\+ items/);
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

describe("orders visuals", () => {
  it("ticket band draws the middle-half box with median inside and the average pulled right", () => {
    const band = buildOrdersTicketBand(snowdevilDepth(), "USD");
    expect(band).not.toBeNull();
    expect(band!.marks.map((m) => m.key)).toEqual(
      expect.arrayContaining(["p25", "median", "p75", "mean"]),
    );
    expect(band!.boxStart).toBeGreaterThanOrEqual(0);
    expect(band!.boxEnd).toBeLessThanOrEqual(1);
    expect(band!.boxStart).toBeLessThan(band!.boxEnd);
    expect(band!.medianPos!).toBeGreaterThanOrEqual(band!.boxStart - 1e-9);
    expect(band!.medianPos!).toBeLessThanOrEqual(band!.boxEnd + 1e-9);
    // Snowdevil median $631 < average $634 → average tick sits right of median.
    expect(band!.meanPos!).toBeGreaterThan(band!.medianPos!);
    expect(band!.marks.find((m) => m.key === "median")?.value).toBe("$631");
    expect(band!.marks.find((m) => m.key === "mean")?.value).toBe("$634");
  });

  it("ticket band is null without the quartiles", () => {
    const depth = { ...snowdevilDepth(), aovP25: null, aovP75: null };
    expect(buildOrdersTicketBand(depth, "USD")).toBeNull();
  });

  it("clock bar splits the original checkout into product, shipping+tax, returns", () => {
    const bar = buildOrdersClockBar(
      { gross: 72_827, grossKnown: true, total: 68_457, net: 60_242, netKnown: true },
      "USD",
    );
    expect(bar).not.toBeNull();
    expect(bar!.map((s) => s.key)).toEqual(["product", "shiptax", "returns"]);
    expect(bar!.reduce((s, seg) => s + seg.share, 0)).toBeCloseTo(1, 5);
    expect(bar![0]!.share).toBeGreaterThan(bar![1]!.share);
    expect(bar![0]!.value).toBe("$60,242");
    expect(bar![2]!.value).toBe("$4,370");
  });

  it("clock bar is null when gross or net is unknown", () => {
    expect(
      buildOrdersClockBar(
        { gross: 0, grossKnown: false, total: 68_457, net: 60_242, netKnown: true },
        "USD",
      ),
    ).toBeNull();
    expect(
      buildOrdersClockBar(
        { gross: 72_827, grossKnown: true, total: 68_457, net: 0, netKnown: false },
        "USD",
      ),
    ).toBeNull();
  });

  it("source bar stacks Online/POS/Shop with typical dollars", () => {
    const bar = buildOrdersSourceBar(snowdevilDepth(), "USD");
    expect(bar).not.toBeNull();
    const keys = bar!.map((s) => s.key);
    expect(keys).toContain("online");
    expect(keys).toContain("pos");
    expect(keys).toContain("shop");
    const online = bar!.find((s) => s.key === "online")!;
    expect(online.share).toBeCloseTo(0.72, 2);
    expect(online.typical).toBe("$640");
    expect(bar!.reduce((s, seg) => s + seg.share, 0)).toBeCloseTo(1, 2);
  });

  it("source bar is null without a source mix", () => {
    const depth = { ...snowdevilDepth(), sourceSalesShare: null };
    expect(buildOrdersSourceBar(depth, "USD")).toBeNull();
  });

  it("shape bars echo the pacing card — discounted, 2+ items, weekend", () => {
    const bars = buildOrdersShapeBars(snowdevilDepth());
    expect(bars.map((b) => b.key)).toEqual(["discounted", "multi", "weekend"]);
    expect(bars.find((b) => b.key === "discounted")?.pct).toBe(20);
    expect(bars.find((b) => b.key === "multi")?.pct).toBe(50);
    expect(bars.find((b) => b.key === "weekend")?.pct).toBe(23);
  });

  it("shape bars drop a share that rounds to 0%, never printing a 0% bar", () => {
    const depth = {
      ...snowdevilDepth(),
      discountedOrderShare: 0.004,
      multiUnitOrderShare: null,
      weekendSalesShare: 0.23,
    };
    const bars = buildOrdersShapeBars(depth);
    expect(bars.map((b) => b.key)).toEqual(["weekend"]);
  });
});

describe("Orders page craft lock", () => {
  const orders = read("../routes/app.orders.tsx");
  const scoreboard = read("../components/OrdersScoreboard.tsx");
  const firstView = read("../components/OrdersFirstViewport.tsx");
  const chart = read("../components/OrdersTimingChart.tsx");
  const visuals = read("../components/OrdersVisuals.tsx");

  it("is a Black Clover scoreboard — first-fold typical, clock, depth, timing, then the open chart", () => {
    const firstAt = orders.indexOf("<OrdersFirstViewport");
    const compareAt = orders.indexOf("<OrdersCompareGlance");
    const chartAt = orders.indexOf("<OrdersTimingChart");
    const firstLaneAt = orders.indexOf('<DeskLane rank="first"');
    const moreAt = orders.indexOf('rank="more"', firstLaneAt + 1);
    const heroAt = orders.indexOf("<OrdersScoreboard");
    const intelAt = orders.indexOf("<OrdersIntelligence");
    expect(firstAt).toBeGreaterThan(-1);
    expect(compareAt).toBeGreaterThan(firstAt);
    expect(chartAt).toBeGreaterThan(compareAt);
    expect(moreAt).toBeGreaterThan(chartAt);
    expect(heroAt).toBeGreaterThan(moreAt);
    expect(intelAt).toBeGreaterThan(heroAt);
    expect(orders).toContain("mcfly-scoreboard--orders");
    expect(orders).toContain("ORDERS_FIRST_LANE_LABEL");
    expect(orders).toContain("ORDERS_CLOCK_LANE_LABEL");
    expect(orders).toContain("salesPending");
    expect(`${firstView}\n${chart}`).toContain("not $0");
    expect(orders).not.toContain("if (metrics.salesPending) return");
    expect(firstView).toContain("mcfly-overview-plane");
    expect(firstView).not.toContain("mcfly-kpi-grid--peeks-lead");
    expect(firstView).toContain("buildOrdersHero");
    expect(firstView).toContain("<OrdersTicketBand");
    expect(scoreboard).toContain("mcfly-book__clock");
    expect(scoreboard).toContain("mcfly-kpi-grid--orders-depth");
    expect(scoreboard).toContain("mcfly-kpi-grid--orders-timing");
    expect(scoreboard).toContain("buildOrdersClock");
    expect(scoreboard).toContain("buildOrdersDepthFacts");
    expect(scoreboard).toContain("buildOrdersTimingFacts");
    expect(chart).toContain("mcfly-chart__board");
    expect(chart).toContain("Weekday");
    expect(chart).toContain("Hour");
    expect(chart).toContain("mcfly-period__btn");
    expect(chart).toContain("buildOrdersChartBars");
  });

  it("draws the signature Orders visuals — ticket band on the first fold, clock bar, source mix", () => {
    expect(firstView).toContain("<OrdersTicketBand");
    expect(scoreboard).toContain("<OrdersClockBar");
    expect(scoreboard).toContain("<OrdersSourceBar");
    expect(visuals).toContain("mcfly-orders-band");
    expect(visuals).toContain("mcfly-orders-clockbar");
    expect(visuals).toContain("mcfly-orders-sourcebar");
    expect(visuals).toContain("buildOrdersTicketBand");
    expect(visuals).toContain("buildOrdersClockBar");
    expect(visuals).toContain("buildOrdersSourceBar");
    // The band is the median-vs-average contrast Shopify Analytics never draws.
    expect(visuals).toMatch(/average/i);
    expect(visuals).toMatch(/typical/i);
  });

  it("uses the pacing-card language — soft hero, tile grid, order-shape pace bars", () => {
    expect(scoreboard).toContain("<OrdersShapeBars");
    expect(visuals).toContain("buildOrdersShapeBars");
    expect(visuals).toContain("mcfly-orders-pace");
    expect(visuals).toContain("mcfly-orders-pace__fill");
    const css = read("../styles/mcfly-desk.css");
    expect(css).toContain(".mcfly-orders-pace__fill");
    expect(css).toContain(".mcfly-scoreboard--orders .mcfly-kpi--peek");
  });

  it("gives the weekday/hour chart an explorer-grade floating hover tooltip", () => {
    expect(chart).toContain("mcfly-chart__tip");
    expect(chart).toContain("mcfly-chart__tip-row");
    expect(chart).toContain("mcfly-chart__plot");
    expect(chart).toMatch(/rank/i);
    expect(chart).toContain("onPointerLeave");
    expect(chart).toContain("useChartHover");
    const css = read("../styles/mcfly-desk.css");
    expect(css).toContain(".mcfly-chart__tip");
    expect(css).toContain(".mcfly-chart__plot");
  });

  it("paints every TAB_LOCK Orders fact on the first fold + scoreboard, not a pamphlet", () => {
    const blob = `${firstView}\n${scoreboard}\n${read("./orders-scoreboard.ts")}\n${read("./orders-first-viewport.ts")}\n${read("./product-labels.ts")}`;
    for (const phrase of ORDERS_REQUIRED) {
      expect(blob.toLowerCase()).toContain(phrase.toLowerCase());
    }
    expect(firstView).toContain("OrdersTicketBand");
    expect(scoreboard).toContain("mcfly-kpi--peek");
    expect(scoreboard).not.toContain("<details");
    expect(scoreboard).not.toContain("Click a card below for detail");
    expect(firstView).not.toContain("<details");
  });

  it("keeps spend / ROAS / upload / Harbor / QuietSpendDoor off Orders", () => {
    for (const source of [orders, firstView, scoreboard, chart, visuals]) {
      for (const ban of ORDERS_SPEND_BANS) {
        expect(source).not.toContain(ban);
      }
      expect(source).not.toContain("Harbor");
      expect(source).not.toContain("QuietSpendDoor");
      expect(source).not.toContain("0.00×");
      expect(source).not.toContain("SpendExplorer");
    }
  });

  it("ships Black Clover order intelligence — KPI strip, dual-axis explorer, audit table, frequency", () => {
    const intel = read("../components/OrdersIntelligence.tsx");
    const freq = read("../components/OrdersFrequencyChart.tsx");
    const css = read("../styles/mcfly-desk.css");
    expect(orders).toContain("<OrdersIntelligence");
    expect(orders).toContain("<OrdersFrequencyChart");
    expect(orders).toContain("includeOrdersIntelligence");
    expect(intel).toContain("mcfly-orders-intel__kpis");
    expect(intel).toContain("vs prior");
    expect(intel).toContain("mcfly-chart--dual");
    expect(intel).toContain("Orders × AOV");
    expect(intel).toContain("mcfly-chart__aovline");
    expect(intel).toContain("mcfly-chart__obar");
    // Explorer grain lives on the chart.
    expect(intel).toContain("mcfly-period__btn");
    // Audit-grade weekly ledger table.
    expect(intel).toContain("mcfly-orders-ledger__table");
    expect(intel).toContain("<thead>");
    expect(intel).toContain("vs prior");
    // AOV tiers — order-value distribution.
    expect(intel).toContain("mcfly-orders-tiers");
    expect(intel).toContain("AOV tiers");
    expect(intel).toContain("buildOrdersIntelKpis");
    expect(css).toContain(".mcfly-orders-tiers__fill");
    expect(freq).toContain("mcfly-chart__freq");
    expect(freq).toMatch(/Customers/);
    expect(css).toContain(".mcfly-orders-intel");
    expect(css).toContain(".mcfly-orders-ledger__table");
    expect(css).toContain(".mcfly-chart__aovline");
    expect(css).toContain(".mcfly-chart__freq");
  });

  it("keeps spend / ROAS off the intelligence, ledger, and frequency", () => {
    for (const source of [
      read("../components/OrdersIntelligence.tsx"),
      read("../components/OrdersFrequencyChart.tsx"),
      read("./orders-intelligence.ts"),
    ]) {
      for (const ban of ORDERS_SPEND_BANS) {
        expect(source).not.toContain(ban);
      }
      expect(source).not.toContain("Total ROAS");
      expect(source).not.toContain("SpendExplorer");
      expect(source).not.toContain("Harbor");
      expect(source).not.toContain("0.00×");
    }
  });

  it("contrasts typical/median with Shopify Analytics average", () => {
    expect(`${orders}\n${firstView}\n${scoreboard}`).toMatch(/Shopify Analytics/);
    expect(`${orders}\n${firstView}\n${scoreboard}`).toMatch(/average/i);
    expect(`${orders}\n${firstView}\n${scoreboard}`).toMatch(/typical/i);
    expect(`${orders}\n${firstView}\n${scoreboard}`).toMatch(/median/i);
    expect(`${orders}\n${scoreboard}`).toMatch(/Online vs POS/);
  });
});
