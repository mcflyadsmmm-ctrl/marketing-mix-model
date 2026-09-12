import { describe, expect, it } from "vitest";
import {
  computeCohortBuyerMetrics,
  formatMedianDays,
  formatSecondOrderRate,
  periodFirstVsRepeatRevenue,
  summarizeBuyerRepeat,
  type BuyerOrderFactLike,
} from "./cohort-buyer-metrics";

function d(iso: string): Date {
  return new Date(iso);
}

describe("summarizeBuyerRepeat", () => {
  it("gates 30/60/90 on maturity and excludes guests", () => {
    const asOf = d("2024-06-01T00:00:00.000Z");
    const orders: BuyerOrderFactLike[] = [
      // Mature 90d: first Jan 1, second Feb 1 (31d) → hits 60+90, not 30
      { buyerKey: "a", orderAt: d("2024-01-01"), netSales: 100, lifetimeOrderRank: 1 },
      { buyerKey: "a", orderAt: d("2024-02-01"), netSales: 50, lifetimeOrderRank: 2 },
      // Mature 90d: first Jan 1, no second
      { buyerKey: "b", orderAt: d("2024-01-01"), netSales: 80, lifetimeOrderRank: 1 },
      // Too young for 90 (first May 1)
      { buyerKey: "c", orderAt: d("2024-05-01"), netSales: 40, lifetimeOrderRank: 1 },
      { buyerKey: "c", orderAt: d("2024-05-10"), netSales: 20, lifetimeOrderRank: 2 },
      // Guest ignored
      { buyerKey: "guest", orderAt: d("2024-01-01"), netSales: 999, lifetimeOrderRank: 1 },
    ];
    const s = summarizeBuyerRepeat(orders, asOf);
    expect(s.buyers).toBe(3);
    // Mature 90: a,b → a has 2nd within 90 → 50%
    expect(s.secondWithin90).toBeCloseTo(0.5);
    // Mature 60: a,b → a's gap 31d ≤ 60 → 50%
    expect(s.secondWithin60).toBeCloseTo(0.5);
    // Mature 30: a, b, c (May 1 ≤ May 2 cutoff) — only c hits within 30d
    expect(s.secondWithin30).toBeCloseTo(1 / 3);
    // Median days among buyers with a 2nd order: a=31, c=9 → 20
    expect(s.medianDaysToSecond).toBeCloseTo(20);
    expect(s.firstOrderRevenue).toBe(100 + 80 + 40);
    expect(s.subsequentRevenue).toBe(50 + 20);
    expect(s.firstOrderRevenueShare).toBeCloseTo(220 / 290);
  });

  it("returns null rates when no mature buyers", () => {
    const asOf = d("2024-06-01T00:00:00.000Z");
    const orders: BuyerOrderFactLike[] = [
      { buyerKey: "z", orderAt: d("2024-05-20"), netSales: 10, lifetimeOrderRank: 1 },
    ];
    const s = summarizeBuyerRepeat(orders, asOf);
    expect(s.secondWithin90).toBeNull();
    expect(s.medianDaysToSecond).toBeNull();
  });
});

describe("computeCohortBuyerMetrics", () => {
  it("groups by acquisition month", () => {
    const asOf = d("2024-06-01T00:00:00.000Z");
    const orders: BuyerOrderFactLike[] = [
      { buyerKey: "a", orderAt: d("2024-01-15"), netSales: 100, lifetimeOrderRank: 1 },
      { buyerKey: "a", orderAt: d("2024-02-20"), netSales: 40, lifetimeOrderRank: 2 },
      { buyerKey: "b", orderAt: d("2024-02-10"), netSales: 70, lifetimeOrderRank: 1 },
    ];
    const rows = computeCohortBuyerMetrics(orders, asOf);
    expect(rows.map((r) => r.monthKey)).toEqual(["2024-02", "2024-01"]);
    const jan = rows.find((r) => r.monthKey === "2024-01")!;
    expect(jan.buyers).toBe(1);
    expect(jan.secondWithin90).toBeCloseTo(1);
    expect(jan.medianDaysToSecond).toBeCloseTo(36); // Jan 15 → Feb 20
  });
});

describe("periodFirstVsRepeatRevenue", () => {
  it("splits by lifetime rank not period return flag", () => {
    const mix = periodFirstVsRepeatRevenue([
      { buyerKey: "a", orderAt: d("2024-05-01"), netSales: 100, lifetimeOrderRank: 1 },
      { buyerKey: "a", orderAt: d("2024-05-15"), netSales: 50, lifetimeOrderRank: 2 },
      { buyerKey: "b", orderAt: d("2024-05-02"), netSales: 80, lifetimeOrderRank: 3 },
      { buyerKey: "guest", orderAt: d("2024-05-03"), netSales: 999, lifetimeOrderRank: 1 },
    ]);
    expect(mix.firstOrderRevenue).toBe(100);
    expect(mix.subsequentRevenue).toBe(130);
    expect(mix.firstOrderCount).toBe(1);
    expect(mix.subsequentOrderCount).toBe(2);
    expect(mix.firstOrderRevenueShare).toBeCloseTo(100 / 230);
  });
});

describe("formatters", () => {
  it("formats rate and median days", () => {
    expect(formatSecondOrderRate(0.456)).toBe("45.6%");
    expect(formatSecondOrderRate(null)).toBe("—");
    expect(formatMedianDays(0.4)).toBe("<1 day");
    expect(formatMedianDays(4.25)).toBe("4.3 days");
    expect(formatMedianDays(42.2)).toBe("42 days");
  });
});
