import { describe, expect, it } from "vitest";
import {
  DEPTH_GUEST_KEY,
  classifyOrderSource,
  formatHourRangeLabel,
  HOUR_STATS_MIN_ORDERS,
  MULTI_UNIT_MIN_ORDERS,
  PRICE_SPLIT_MIN_EACH,
  SOURCE_AOV_MIN_ORDERS,
  TOP_CUSTOMER_MIN_BUYERS,
  medianOf,
  shopifyDepthStats,
  type OrderDepthRow,
} from "./shopify-depth-stats";

function row(
  customerKey: string,
  amount: number,
  day: string,
  hour = 12,
): OrderDepthRow {
  return {
    customerKey,
    amount,
    orderedAt: new Date(`${day}T${String(hour).padStart(2, "0")}:00:00.000Z`),
    shopLocalDate: new Date(`${day}T00:00:00.000Z`),
  };
}

describe("medianOf", () => {
  it("returns the middle value for odd lists", () => {
    expect(medianOf([3, 1, 2])).toBe(2);
  });

  it("averages the two middle values for even lists", () => {
    expect(medianOf([4, 1, 2, 3])).toBe(2.5);
  });
});

describe("shopifyDepthStats", () => {
  it("separates typical (median) AOV from a mean pulled up by one large order", () => {
    const orders = [
      row("a", 40, "2026-09-01", 10),
      row("b", 50, "2026-09-01", 11),
      row("c", 60, "2026-09-02", 10),
      row("d", 1000, "2026-09-03", 10),
    ];
    const depth = shopifyDepthStats({
      orders,
      totalSales: 1150,
      netSales: 1000,
      netSalesKnown: true,
      grossSales: 1200,
      grossSalesKnown: true,
    });
    expect(depth.medianAov).toBe(55);
    expect(depth.meanAov).toBe(287.5);
    expect(depth.shippingTaxFees).toBe(150);
    expect(depth.shippingTaxFeesPct).toBeCloseTo(150 / 1150);
  });

  it("attributes repeat sales $ to buyers with two orders, not headcount rate", () => {
    const orders = [
      row("a", 100, "2026-09-01", 10),
      row("a", 100, "2026-09-04", 10),
      row("b", 50, "2026-09-02", 10),
      row(DEPTH_GUEST_KEY, 200, "2026-09-02", 11),
    ];
    const depth = shopifyDepthStats({
      orders,
      totalSales: 450,
      netSales: 450,
      netSalesKnown: true,
      grossSales: 450,
      grossSalesKnown: true,
    });
    expect(depth.identifiedBuyers).toBe(2);
    expect(depth.repeatBuyers).toBe(1);
    expect(depth.repeatSalesShare).toBeCloseTo(200 / 450);
    expect(depth.oneAndDoneShare).toBe(0.5);
    expect(depth.medianDaysToSecond).toBe(3);
    expect(depth.guestAov).toBe(200);
    expect(depth.identifiedAov).toBeCloseTo(250 / 3);
  });

  it("measures top-decile concentration only with at least 10 orders", () => {
    const small = shopifyDepthStats({
      orders: Array.from({ length: 9 }, (_, i) =>
        row(`c${i}`, 10, "2026-09-01"),
      ),
      totalSales: 90,
      netSales: 90,
      netSalesKnown: true,
      grossSales: 90,
      grossSalesKnown: true,
    });
    expect(small.topDecileSalesShare).toBeNull();

    const orders = [
      ...Array.from({ length: 9 }, (_, i) => row(`c${i}`, 10, "2026-09-01")),
      row("whale", 910, "2026-09-02"),
    ];
    const depth = shopifyDepthStats({
      orders,
      totalSales: 1000,
      netSales: 900,
      netSalesKnown: true,
      grossSales: 1000,
      grossSalesKnown: true,
    });
    expect(depth.topDecileSalesShare).toBeCloseTo(0.91);
  });

  it("withholds best-three-day share until five days have sales", () => {
    const fourDays = shopifyDepthStats({
      orders: [
        row("a", 10, "2026-09-01"),
        row("b", 10, "2026-09-02"),
        row("c", 10, "2026-09-03"),
        row("d", 10, "2026-09-04"),
      ],
      totalSales: 40,
      netSales: 40,
      netSalesKnown: true,
      grossSales: 40,
      grossSalesKnown: true,
    });
    expect(fourDays.bestThreeDayShare).toBeNull();

    const fiveDays = shopifyDepthStats({
      orders: [
        row("a", 10, "2026-09-01"),
        row("b", 10, "2026-09-02"),
        row("c", 10, "2026-09-03"),
        row("d", 10, "2026-09-04"),
        row("e", 60, "2026-09-05"),
      ],
      totalSales: 100,
      netSales: 100,
      netSalesKnown: true,
      grossSales: 40,
      grossSalesKnown: true,
    });
    expect(fiveDays.bestThreeDayShare).toBeCloseTo(80 / 100);
  });

  it("withholds weekend and weekday mix until five days have sales", () => {
    const fourDays = shopifyDepthStats({
      orders: [
        row("a", 10, "2026-09-01"),
        row("b", 10, "2026-09-02"),
        row("c", 10, "2026-09-03"),
        row("d", 10, "2026-09-04"),
      ],
      totalSales: 40,
      netSales: 40,
      netSalesKnown: true,
      grossSales: 40,
      grossSalesKnown: true,
    });
    expect(fourDays.weekendSalesShare).toBeNull();
    expect(fourDays.weekdaySalesShare).toBeNull();
    expect(fourDays.peakWeekday).toBeNull();
  });

  it("attributes Saturday+Sunday sales as weekend share and names the peak weekday", () => {
    // 2026-09-01 Tue … 09-05 Sat, 09-06 Sun.
    const depth = shopifyDepthStats({
      orders: [
        row("a", 10, "2026-09-01"),
        row("b", 10, "2026-09-02"),
        row("c", 10, "2026-09-03"),
        row("d", 10, "2026-09-04"),
        row("e", 40, "2026-09-05"),
        row("f", 20, "2026-09-06"),
      ],
      totalSales: 100,
      netSales: 100,
      netSalesKnown: true,
      grossSales: 100,
      grossSalesKnown: true,
    });
    expect(depth.weekendSalesShare).toBeCloseTo(60 / 100);
    expect(depth.peakWeekday).toBe(6);
    expect(depth.weekdaySalesShare?.[6]).toBeCloseTo(0.4);
    expect(depth.weekdaySalesShare?.[0]).toBeCloseTo(0.2);
  });

  it("counts identified orders per buyer and withholds AOV spread until five orders", () => {
    const small = shopifyDepthStats({
      orders: [
        row("a", 10, "2026-09-01"),
        row("a", 20, "2026-09-02"),
        row("b", 30, "2026-09-03"),
      ],
      totalSales: 60,
      netSales: 60,
      netSalesKnown: true,
      grossSales: 60,
      grossSalesKnown: true,
    });
    expect(small.ordersPerBuyer).toBe(1.5);
    expect(small.identifiedBuyers).toBe(2);
    expect(small.aovP25).toBeNull();
    expect(small.aovP75).toBeNull();

    const spread = shopifyDepthStats({
      orders: [
        row("a", 10, "2026-09-01"),
        row("b", 20, "2026-09-02"),
        row("c", 30, "2026-09-03"),
        row("d", 40, "2026-09-04"),
        row("e", 100, "2026-09-05"),
      ],
      totalSales: 200,
      netSales: 200,
      netSalesKnown: true,
      grossSales: 200,
      grossSalesKnown: true,
    });
    expect(spread.aovP25).toBe(20);
    expect(spread.aovP75).toBe(40);
  });

  it("classifies Shopify sourceName as Online / POS / Shop, never ads", () => {
    expect(classifyOrderSource("web")).toBe("online");
    expect(classifyOrderSource("pos")).toBe("pos");
    expect(classifyOrderSource("shop")).toBe("shop");
    expect(classifyOrderSource("shopify_draft_order")).toBe("other");
    expect(classifyOrderSource("")).toBe("other");
  });

  it("labels shop-local hours in merchant English", () => {
    expect(formatHourRangeLabel(0)).toBe("12–1 am");
    expect(formatHourRangeLabel(11)).toBe("11 am–12 pm");
    expect(formatHourRangeLabel(14)).toBe("2–3 pm");
    expect(formatHourRangeLabel(23)).toBe("11 pm–12 am");
  });

  it("withholds hour-of-day until enough orders and a timezone", () => {
    const orders = Array.from({ length: HOUR_STATS_MIN_ORDERS - 1 }, (_, i) =>
      row(`c${i}`, 10, "2026-09-01", 18),
    );
    const small = shopifyDepthStats({
      orders,
      totalSales: 190,
      netSales: 190,
      netSalesKnown: true,
      grossSales: 190,
      grossSalesKnown: true,
      timeZone: "America/Denver",
    });
    expect(small.peakHour).toBeNull();

    const enough = shopifyDepthStats({
      orders: [
        ...orders,
        row("peak", 80, "2026-09-01", 18),
      ],
      totalSales: 270,
      netSales: 270,
      netSalesKnown: true,
      grossSales: 270,
      grossSalesKnown: true,
      timeZone: "America/Denver",
    });
    // 18:00 UTC = 12:00 MDT in September.
    expect(enough.peakHour).toBe(12);
  });

  it("measures 30-day second-order rate only among eligible first-timers", () => {
    const windowEnd = new Date("2026-10-15T00:00:00.000Z");
    const tooFew = shopifyDepthStats({
      orders: [
        row("a", 40, "2026-09-01"),
        row("a", 50, "2026-09-10"),
        row("b", 40, "2026-09-01"),
      ],
      totalSales: 90,
      netSales: 90,
      netSalesKnown: true,
      grossSales: 90,
      grossSalesKnown: true,
      windowEnd,
    });
    expect(tooFew.secondOrderWithin30Share).toBeNull();
    expect(tooFew.eligibleFirstTimers).toBe(2);

    const orders: OrderDepthRow[] = [];
    for (let i = 0; i < 10; i += 1) {
      orders.push(row(`e${i}`, 40, "2026-09-01"));
      if (i < 3) orders.push(row(`e${i}`, 70, "2026-09-20"));
    }
    // Too late to have 30 days of follow-up — must not inflate the rate.
    orders.push(row("late", 40, "2026-10-01"));
    orders.push(row("late", 90, "2026-10-05"));
    const depth = shopifyDepthStats({
      orders,
      totalSales: 40 * 11 + 70 * 3 + 90,
      netSales: 1000,
      netSalesKnown: true,
      grossSales: 1000,
      grossSalesKnown: true,
      windowEnd,
    });
    expect(depth.eligibleFirstTimers).toBe(10);
    expect(depth.secondOrderWithin30Share).toBeCloseTo(0.3);
  });

  it("withholds 2nd vs 3rd+ mix until enough identified buyers and repeaters", () => {
    const small = shopifyDepthStats({
      orders: [
        row("a", 10, "2026-09-01"),
        row("a", 10, "2026-09-02"),
        row("b", 10, "2026-09-03"),
      ],
      totalSales: 30,
      netSales: 30,
      netSalesKnown: true,
      grossSales: 40,
      grossSalesKnown: true,
    });
    expect(small.secondOrderBuyerShare).toBeNull();
    expect(small.thirdPlusBuyerShare).toBeNull();

    const orders: OrderDepthRow[] = [];
    for (let i = 0; i < 5; i += 1) {
      orders.push(row(`one${i}`, 10, "2026-09-01"));
    }
    for (let i = 0; i < 3; i += 1) {
      orders.push(row(`two${i}`, 10, "2026-09-01"));
      orders.push(row(`two${i}`, 12, "2026-09-08"));
    }
    for (let i = 0; i < 2; i += 1) {
      orders.push(row(`thr${i}`, 10, "2026-09-01"));
      orders.push(row(`thr${i}`, 12, "2026-09-08"));
      orders.push(row(`thr${i}`, 14, "2026-09-15"));
    }
    const depth = shopifyDepthStats({
      orders,
      totalSales: 5 * 10 + 3 * 22 + 2 * 36,
      netSales: 200,
      netSalesKnown: true,
      grossSales: 200,
      grossSalesKnown: true,
    });
    expect(depth.identifiedBuyers).toBe(10);
    expect(depth.secondOrderBuyers).toBe(3);
    expect(depth.thirdPlusBuyers).toBe(2);
    expect(depth.secondOrderBuyerShare).toBeCloseTo(0.3);
    expect(depth.thirdPlusBuyerShare).toBeCloseTo(0.2);
  });

  it("compares typical second-order $ to first-order $ once enough repeaters exist", () => {
    const orders: OrderDepthRow[] = [];
    for (let i = 0; i < 5; i += 1) {
      orders.push(row(`r${i}`, 40, "2026-09-01"));
      orders.push(row(`r${i}`, 80, "2026-09-10"));
    }
    const depth = shopifyDepthStats({
      orders,
      totalSales: 600,
      netSales: 600,
      netSalesKnown: true,
      grossSales: 600,
      grossSalesKnown: true,
    });
    expect(depth.medianFirstOrder).toBe(40);
    expect(depth.medianSecondOrder).toBe(80);
  });

  it("measures typical day as median daily Total Sales after five days", () => {
    const fourDays = shopifyDepthStats({
      orders: [
        row("a", 10, "2026-09-01"),
        row("b", 10, "2026-09-02"),
        row("c", 10, "2026-09-03"),
        row("d", 10, "2026-09-04"),
      ],
      totalSales: 40,
      netSales: 40,
      netSalesKnown: true,
      grossSales: 40,
      grossSalesKnown: true,
    });
    expect(fourDays.medianDailySales).toBeNull();

    const fiveDays = shopifyDepthStats({
      orders: [
        row("a", 10, "2026-09-01"),
        row("b", 10, "2026-09-02"),
        row("c", 10, "2026-09-03"),
        row("d", 10, "2026-09-04"),
        row("e", 60, "2026-09-05"),
      ],
      totalSales: 100,
      netSales: 100,
      netSalesKnown: true,
      grossSales: 40,
      grossSalesKnown: true,
    });
    expect(fiveDays.medianDailySales).toBe(10);
  });

  it("measures discounted-order share, items per order, and POS/Online mix", () => {
    const orders: OrderDepthRow[] = Array.from({ length: 10 }, (_, i) => ({
      ...row(`c${i}`, 100, "2026-09-01", 12),
      discountAmount: i < 4 ? 12 : 0,
      sourceName: i < 2 ? "pos" : i === 2 ? "shop" : "web",
      unitCount: i < 5 ? 2 : 1,
    }));
    const depth = shopifyDepthStats({
      orders,
      totalSales: 1000,
      netSales: 1000,
      netSalesKnown: true,
      grossSales: 1000,
      grossSalesKnown: true,
    });
    expect(depth.discountedOrderShare).toBeCloseTo(0.4);
    expect(depth.meanDiscountAmount).toBe(12);
    expect(depth.meanUnitCount).toBe(1.5);
    expect(depth.sourceSalesShare?.pos).toBeCloseTo(0.2);
    expect(depth.sourceSalesShare?.shop).toBeCloseTo(0.1);
    expect(depth.sourceSalesShare?.online).toBeCloseTo(0.7);
  });

  it("withholds 2+ unit share, price-split AOV, top-customer share, and source AOV when observations are short", () => {
    const orders: OrderDepthRow[] = Array.from(
      { length: TOP_CUSTOMER_MIN_BUYERS - 1 },
      (_, i) => ({
        ...row(`c${i}`, 50, "2026-09-01"),
        unitCount: i < MULTI_UNIT_MIN_ORDERS - 1 ? 2 : null,
        discountAmount: i < PRICE_SPLIT_MIN_EACH - 1 ? 8 : i < 8 ? 0 : null,
        sourceName: i < SOURCE_AOV_MIN_ORDERS - 1 ? "web" : i < 8 ? "pos" : "",
      }),
    );
    const depth = shopifyDepthStats({
      orders,
      totalSales: 50 * (TOP_CUSTOMER_MIN_BUYERS - 1),
      netSales: 50 * (TOP_CUSTOMER_MIN_BUYERS - 1),
      netSalesKnown: true,
      grossSales: 50 * (TOP_CUSTOMER_MIN_BUYERS - 1),
      grossSalesKnown: true,
    });
    expect(depth.identifiedBuyers).toBe(TOP_CUSTOMER_MIN_BUYERS - 1);
    expect(depth.multiUnitOrderShare).toBeNull();
    expect(depth.fullPriceMedianAov).toBeNull();
    expect(depth.discountedMedianAov).toBeNull();
    expect(depth.topCustomerSalesShare).toBeNull();
    expect(depth.sourceMedianAov.online).toBeNull();
    expect(depth.sourceMedianAov.pos).toBeNull();
    expect(depth.sourceMedianAov.shop).toBeNull();
  });

  it("measures 2+ unit share among crawled unit counts once the gate is met", () => {
    const orders: OrderDepthRow[] = Array.from(
      { length: MULTI_UNIT_MIN_ORDERS },
      (_, i) => ({
        ...row(`c${i}`, 40, "2026-09-01"),
        unitCount: i < 3 ? 2 : 1,
      }),
    );
    const depth = shopifyDepthStats({
      orders,
      totalSales: 320,
      netSales: 320,
      netSalesKnown: true,
      grossSales: 320,
      grossSalesKnown: true,
    });
    expect(depth.meanUnitCount).toBeCloseTo(11 / 8);
    expect(depth.multiUnitOrderShare).toBeCloseTo(3 / 8);
  });

  it("compares typical full-price AOV to discounted AOV only when both sides have enough orders", () => {
    const oneSided: OrderDepthRow[] = [
      ...Array.from({ length: 6 }, (_, i) => ({
        ...row(`f${i}`, 80, "2026-09-01"),
        discountAmount: 0,
      })),
      ...Array.from({ length: 4 }, (_, i) => ({
        ...row(`d${i}`, 40, "2026-09-02"),
        discountAmount: 12,
      })),
    ];
    const short = shopifyDepthStats({
      orders: oneSided,
      totalSales: 640,
      netSales: 640,
      netSalesKnown: true,
      grossSales: 640,
      grossSalesKnown: true,
    });
    expect(short.fullPriceMedianAov).toBeNull();
    expect(short.discountedMedianAov).toBeNull();
    expect(short.discountedOrderShare).toBeCloseTo(0.4);

    const orders: OrderDepthRow[] = [
      ...[40, 50, 60, 70, 80].map((amount, i) => ({
        ...row(`f${i}`, amount, "2026-09-01"),
        discountAmount: 0,
      })),
      ...[10, 20, 30, 40, 100].map((amount, i) => ({
        ...row(`d${i}`, amount, "2026-09-02"),
        discountAmount: 12,
      })),
    ];
    const depth = shopifyDepthStats({
      orders,
      totalSales: 500,
      netSales: 500,
      netSalesKnown: true,
      grossSales: 500,
      grossSalesKnown: true,
    });
    expect(depth.fullPriceMedianAov).toBe(60);
    expect(depth.discountedMedianAov).toBe(30);
    expect(depth.discountedOrderShare).toBeCloseTo(0.5);
  });

  it("measures typical Online / POS / Shop AOV only for sources with enough crawled orders", () => {
    const orders: OrderDepthRow[] = [
      ...[10, 20, 30, 40, 100].map((amount, i) => ({
        ...row(`o${i}`, amount, "2026-09-01"),
        sourceName: "web",
      })),
      ...[50, 50, 50, 50, 50].map((amount, i) => ({
        ...row(`p${i}`, amount, "2026-09-02"),
        sourceName: "pos",
      })),
      ...[80, 90, 100].map((amount, i) => ({
        ...row(`s${i}`, amount, "2026-09-03"),
        sourceName: "shop",
      })),
    ];
    const depth = shopifyDepthStats({
      orders,
      totalSales: 670,
      netSales: 670,
      netSalesKnown: true,
      grossSales: 670,
      grossSalesKnown: true,
    });
    expect(depth.sourceMedianAov.online).toBe(30);
    expect(depth.sourceMedianAov.pos).toBe(50);
    expect(depth.sourceMedianAov.shop).toBeNull();
  });

  it("measures top-customer sales share separately from the biggest-order decile", () => {
    const orders: OrderDepthRow[] = [
      ...Array.from({ length: 8 }, () => row("whale", 20, "2026-09-01")),
      row("big", 200, "2026-09-02"),
      ...Array.from({ length: 18 }, (_, i) => row(`s${i}`, 10, "2026-09-03")),
      ...Array.from({ length: 5 }, (_, i) =>
        row(DEPTH_GUEST_KEY, 1000, "2026-09-04", 10 + i),
      ),
    ];
    const depth = shopifyDepthStats({
      orders,
      totalSales: 5540,
      netSales: 5540,
      netSalesKnown: true,
      grossSales: 5540,
      grossSalesKnown: true,
    });
    expect(depth.identifiedBuyers).toBe(20);
    // Whale $160 + one $200 order vs 18 × $10. Top 2 buyers = $360 / $540.
    expect(depth.topCustomerSalesShare).toBeCloseTo(360 / 540);
    // 32 orders; top 10% = 3 orders, all guest $1,000s — not the whale's $20s.
    expect(depth.topDecileSalesShare).toBeCloseTo(3000 / 5540);
    expect(depth.topCustomerSalesShare).not.toBeCloseTo(
      depth.topDecileSalesShare ?? NaN,
    );
  });
});
