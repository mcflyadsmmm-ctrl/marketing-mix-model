import { describe, expect, it } from "vitest";
import {
  computeBuyerConcentration,
  formatConcentrationShare,
} from "./buyer-concentration";

describe("computeBuyerConcentration", () => {
  it("excludes guests and reports top-buyer share", () => {
    const c = computeBuyerConcentration([
      { buyerKey: "a", netSales: 100 },
      { buyerKey: "a", netSales: 50 },
      { buyerKey: "b", netSales: 50 },
      { buyerKey: "guest", netSales: 999 },
    ]);
    expect(c.buyers).toBe(2);
    expect(c.totalRevenue).toBe(200);
    expect(c.topBuyerRevenue).toBe(150);
    expect(c.topBuyerShare).toBeCloseTo(0.75);
    // <10 buyers → top10/20 gated
    expect(c.top10Share).toBeNull();
    expect(c.top20Share).toBeNull();
  });

  it("computes top 10% / 20% when enough buyers", () => {
    const orders = [];
    // 10 buyers: 100, 90, … 10
    for (let i = 0; i < 10; i++) {
      orders.push({ buyerKey: `b${i}`, netSales: 100 - i * 10 });
    }
    const c = computeBuyerConcentration(orders);
    expect(c.buyers).toBe(10);
    // top 10% = 1 buyer = 100 / 550
    expect(c.top10Share).toBeCloseTo(100 / 550);
    // top 20% = 2 buyers = (100+90)/550
    expect(c.top20Share).toBeCloseTo(190 / 550);
  });
});

describe("formatConcentrationShare", () => {
  it("formats or dashes", () => {
    expect(formatConcentrationShare(0.456)).toBe("45.6%");
    expect(formatConcentrationShare(null)).toBe("—");
  });
});
