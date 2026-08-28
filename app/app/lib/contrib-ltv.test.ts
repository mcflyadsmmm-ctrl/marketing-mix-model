import { describe, expect, it } from "vitest";
import {
  contributionAdjustedLtv,
  contributionLtvCacRatio,
  marginAsMultiplier,
  roundMer,
  roundMoney,
} from "./contrib-ltv";
import { buildRecommendedMix } from "../components/AllocMixChart";

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
