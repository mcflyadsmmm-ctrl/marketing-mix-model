import { describe, expect, it } from "vitest";
import {
  contributionAdjustedLtv,
  contributionLtvCacRatio,
  roundMer,
  roundMoney,
} from "./contrib-ltv";
import { buildRecommendedMix } from "../components/AllocMixChart";

describe("contrib-ltv", () => {
  it("applies margin % to cohort revenue", () => {
    expect(contributionAdjustedLtv(100, 40)).toBe(40);
    expect(contributionAdjustedLtv(null, 40)).toBeNull();
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
