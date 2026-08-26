import { describe, expect, it } from "vitest";
import {
  contributionAdjustedLtv,
  contributionLtvCacRatio,
  marginAsMultiplier,
  newVsReturningPendingCopy,
  newVsReturningSplit,
  roundMer,
  roundMoney,
} from "./contrib-ltv";
import { buildRecommendedMix } from "../components/AllocMixChart";

describe("new vs returning vs spend", () => {
  it("splits cash and keeps spend beside it, unassigned", () => {
    const split = newVsReturningSplit({
      newCustomerNetSales: 3000,
      returningCustomerNetSales: 1000,
      totalSpend: 900,
      totalSales: 4400,
    });
    expect(split).toMatchObject({
      newSales: 3000,
      returningSales: 1000,
      spend: 900,
      available: true,
    });
    expect(split.newShare).toBeCloseTo(0.75, 5);
  });

  it("never lets the two halves exceed the shop's own sales", () => {
    const split = newVsReturningSplit({
      newCustomerNetSales: 8000,
      returningCustomerNetSales: 4000,
      totalSpend: 500,
      totalSales: 6000,
    });
    expect(split.newSales + split.returningSales).toBeCloseTo(6000, 2);
    expect(split.newSales).toBeCloseTo(4000, 2);
    expect(split.returningSales).toBeCloseTo(2000, 2);
  });

  it("reads unavailable rather than 0% when cohorts have not landed", () => {
    const split = newVsReturningSplit({
      newCustomerNetSales: 0,
      returningCustomerNetSales: 0,
      totalSpend: 700,
      totalSales: 5000,
    });
    expect(split.available).toBe(false);
    expect(split.newShare).toBeNull();
    expect(split.spend).toBe(700);
    expect(newVsReturningPendingCopy("backfilling")).toMatch(
      /still backfilling/,
    );
    expect(newVsReturningPendingCopy("no_timezone")).toMatch(/timezone/);
    expect(newVsReturningPendingCopy("history_limited")).toMatch(/history/);
  });

  it("ignores negative or non-finite inputs instead of throwing", () => {
    const split = newVsReturningSplit({
      newCustomerNetSales: Number.NaN,
      returningCustomerNetSales: -50,
      totalSpend: Number.POSITIVE_INFINITY,
      totalSales: 100,
    });
    expect(split).toMatchObject({
      newSales: 0,
      returningSales: 0,
      spend: 0,
      newShare: null,
      available: false,
    });
  });
});

describe("contrib-ltv", () => {
  it("treats Settings / sample margin as 0–1 (not percent-points)", () => {
    // SAMPLE_DESK_MARGIN_PCT = 0.35. Old helper did 0.35/100 → $1.33.
    expect(marginAsMultiplier(0.35)).toBe(0.35);
    expect(contributionAdjustedLtv(380, 0.35)).toBe(133);
    expect(contributionAdjustedLtv(380, 0.35)).toBeGreaterThan(50);
    expect(contributionAdjustedLtv(null, 0.35)).toBeNull();
  });

  it("still accepts 1–100 percent-points from older callers", () => {
    expect(marginAsMultiplier(40)).toBe(0.4);
    expect(contributionAdjustedLtv(100, 40)).toBe(40);
  });

  it("builds contrib LTV:CAC", () => {
    expect(contributionLtvCacRatio(80, 40)).toBe(2);
    expect(contributionLtvCacRatio(80, 0)).toBeNull();
  });

  it("rounds money and mer stably", () => {
    expect(roundMoney(10.006)).toBe(10.01);
    expect(roundMer(4.409)).toBe(4.41);
  });
});

describe("buildRecommendedMix", () => {
  it("cuts and shifts portfolio spend without inventing ROAS", () => {
    const rows = buildRecommendedMix({
      channels: [
        { name: "Meta", spend: 1000 },
        { name: "Google", spend: 500 },
      ],
      actions: [
        { type: "cut", channel: "Meta", percentChange: -20 },
        { type: "shift", channel: "Google" },
      ],
    });
    const meta = rows.find((r) => r.name === "Meta");
    const google = rows.find((r) => r.name === "Google");
    expect(meta?.recommended).toBe(800);
    expect(google?.recommended).toBe(700);
  });
});
