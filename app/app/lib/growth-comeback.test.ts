import { describe, expect, it } from "vitest";
import {
  growthComebackSentence,
  growthOrderDepthBars,
  growthSecondVsFirst,
  growthWholePct,
} from "./growth-comeback";
import {
  shopifyDepthStats,
  type OrderDepthRow,
} from "./shopify-depth-stats";

const DAY = 86_400_000;
const WINDOW_END = new Date("2026-04-10T00:00:00Z");

function daysBefore(days: number): Date {
  return new Date(WINDOW_END.getTime() - days * DAY);
}

function order(
  customerKey: string,
  daysAgo: number,
  amount: number,
): OrderDepthRow {
  const at = daysBefore(daysAgo);
  return {
    customerKey,
    amount,
    orderedAt: at,
    shopLocalDate: at,
    discountAmount: null,
    sourceName: null,
    unitCount: null,
  };
}

/**
 * 20 identified buyers, all first orders ≥30 days before the window end:
 *  - 6 one-and-done, 8 with exactly two orders, 6 with three or more.
 *  - 14 repeaters, each second order 10 days after the first, first $100 /
 *    second $120 so the typical second order is +20%.
 */
function packedComebackDepth() {
  const rows: OrderDepthRow[] = [];
  for (let i = 0; i < 20; i += 1) {
    const key = `c${i}`;
    const firstDaysAgo = 70 - i * 2; // -70 … -32, all ≥30 days before end
    rows.push(order(key, firstDaysAgo, 100));
    if (i < 14) {
      rows.push(order(key, firstDaysAgo - 10, 120)); // second, +10 days
      if (i < 6) rows.push(order(key, firstDaysAgo - 20, 90)); // third
    }
  }
  return shopifyDepthStats({
    orders: rows,
    totalSales: rows.reduce((s, r) => s + r.amount, 0),
    netSales: 0,
    netSalesKnown: false,
    grossSales: 0,
    grossSalesKnown: false,
    timeZone: "UTC",
    windowEnd: WINDOW_END,
  });
}

function emptyDepth() {
  return shopifyDepthStats({
    orders: [],
    totalSales: 0,
    netSales: 0,
    netSalesKnown: false,
    grossSales: 0,
    grossSalesKnown: false,
    windowEnd: WINDOW_END,
  });
}

describe("growthWholePct", () => {
  it("prints whole percents, never a decimal", () => {
    expect(growthWholePct(0.7)).toBe("70%");
    expect(growthWholePct(0.125)).toBe("13%");
  });
});

describe("growthOrderDepthBars", () => {
  it("splits identified buyers into one / two / three-or-more", () => {
    const bars = growthOrderDepthBars(packedComebackDepth());
    expect(bars.map((b) => b.label)).toEqual([
      "One order",
      "Two orders",
      "Three or more",
    ]);
    const byLabel = Object.fromEntries(bars.map((b) => [b.label, b]));
    expect(byLabel["One order"]!.value).toBe("30%");
    expect(byLabel["Two orders"]!.value).toBe("40%");
    expect(byLabel["Three or more"]!.value).toBe("30%");
    // Shares are of identified buyers — never dollars.
    expect(byLabel["Three or more"]!.detail).toMatch(/identified buyers/);
  });

  it("is empty when repeat depth is not on file", () => {
    expect(growthOrderDepthBars(emptyDepth())).toEqual([]);
  });
});

describe("growthSecondVsFirst", () => {
  it("reports the typical second-order lift over the first", () => {
    const cmp = growthSecondVsFirst(packedComebackDepth());
    expect(cmp).not.toBeNull();
    expect(cmp!.first).toBe(100);
    expect(cmp!.second).toBe(120);
    expect(cmp!.deltaPct).toBe(20);
    expect(cmp!.direction).toBe("up");
  });

  it("is null without a first and second order median", () => {
    expect(growthSecondVsFirst(emptyDepth())).toBeNull();
  });
});

describe("growthComebackSentence", () => {
  it("leads with the 30-day come-back rate and adds the second-order lift", () => {
    const sentence = growthComebackSentence(packedComebackDepth(), 0.42);
    expect(sentence).toMatch(/came back within 30 days/);
    expect(sentence).toMatch(/second order runs \+20%/);
    expect(sentence).not.toMatch(/spend|ROAS|Klaviyo/i);
  });

  it("falls back to an order-history line when nothing is on file", () => {
    const sentence = growthComebackSentence(emptyDepth(), null);
    expect(sentence).toMatch(/order history/i);
    expect(sentence).not.toMatch(/\$0|0%/);
  });
});
