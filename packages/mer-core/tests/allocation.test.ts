import { describe, expect, it } from "vitest";
import {
  calculateBreakEvenMer,
  calculateMer,
  clampSpendFloorCutPct,
  portfolioCutPercent,
  SPEND_FLOOR_PCT,
  spendFloorMaxCutPct,
  suggestAllocation,
} from "../src/index.js";

describe("MER math (smoke)", () => {
  it("calculates MER as sales divided by spend", () => {
    expect(calculateMer(10000, 4000)).toBe(2.5);
  });

  it("returns null when spend is zero", () => {
    expect(calculateMer(10000, 0)).toBeNull();
  });

  it("calculates break-even MER from contribution margin", () => {
    expect(calculateBreakEvenMer(0.4)).toBeCloseTo(2.5);
  });
});

describe("spend floor", () => {
  it("exports SPEND_FLOOR_PCT / spendFloorMaxCutPct as 50 (max cut, keep ≥50%)", () => {
    expect(SPEND_FLOOR_PCT).toBe(50);
    expect(spendFloorMaxCutPct).toBe(50);
  });

  it("clampSpendFloorCutPct never exceeds 50 or drops below 10", () => {
    expect(clampSpendFloorCutPct(80)).toBe(50);
    expect(clampSpendFloorCutPct(5)).toBe(10);
    expect(clampSpendFloorCutPct(25)).toBe(25);
  });
});

describe("portfolioCutPercent", () => {
  it("sizes cut toward BE gap, clamps [10, 50], rounds to nearest 5", () => {
    // 1 - 1.8182/2.5 ≈ 27.27% → 25
    expect(portfolioCutPercent(10000 / 5500, 2.5)).toBe(25);
    // 1 - 2.0/2.5 = 20% → 20
    expect(portfolioCutPercent(2.0, 2.5)).toBe(20);
    // small gap → min 10
    expect(portfolioCutPercent(2.4, 2.5)).toBe(10);
    // mid gap that previously hit old 30 ceiling → still gap-scaled
    // 1 - 1.5/2.5 = 40% → 40
    expect(portfolioCutPercent(1.5, 2.5)).toBe(40);
    // large gap → spend floor max 50 (never zero spend)
    expect(portfolioCutPercent(0.5, 2.5)).toBe(50);
  });

  it("uses max 50% when overall MER is 0", () => {
    expect(portfolioCutPercent(0, 2.5)).toBe(50);
  });

  it("returns min cut when at/above break-even (hold path unused)", () => {
    expect(portfolioCutPercent(2.5, 2.5)).toBe(10);
    expect(portfolioCutPercent(3, 2.5)).toBe(10);
  });
});

describe("suggestAllocation", () => {
  const breakEvenMer = 2.5;
  const channels = [
    { name: "Meta", spend: 3000 },
    { name: "Google", spend: 2000 },
    { name: "Manual / Other", spend: 500, isManual: true },
  ];

  it("suggests portfolio cut when below break-even without operator channel cash", () => {
    const result = suggestAllocation({
      channels,
      breakEvenMer,
      totalSales: 10000,
      totalSpend: 5500,
    });

    const expectedCut = portfolioCutPercent(10000 / 5500, breakEvenMer);
    expect(result.overallMer).toBeCloseTo(1.8182, 3);
    expect(result.isAboveBreakEven).toBe(false);
    expect(result.hasOperatorChannelCash).toBe(false);
    expect(result.suggestedTestDays).toBe(7);
    const cut = result.actions.find((a) => a.type === "cut");
    expect(cut?.channel).toBe("portfolio");
    expect(cut?.percentChange).toBe(-expectedCut);
    expect(result.why).toMatch(/Total ROAS below break-even/i);
    expect(result.why).toMatch(/illustrative step-test/i);
    expect(result.why).toMatch(/not marginal/i);
    expect(result.why).not.toMatch(/channel efficiency/i);
    expect(cut?.detail).toMatch(/illustrative cash step-test/i);
    expect(cut?.detail).toMatch(/not marginal/i);
    expect(cut?.detail).toMatch(
      new RegExp(`~${expectedCut}% portfolio spend cut`, "i"),
    );
    expect(Math.abs(cut?.percentChange ?? 0)).toBeLessThanOrEqual(
      SPEND_FLOOR_PCT,
    );
    expect(result.inputs.channelEfficiencies).toHaveLength(3);
    // Spend-share must not fake channel Total ROAS
    expect(
      result.inputs.channelEfficiencies.every((c) => c.effectiveMer === null),
    ).toBe(true);
    expect(
      result.inputs.channelEfficiencies.every((c) => c.basis === "spend_share"),
    ).toBe(true);
  });

  it("does not prefer cutting manual channel when efficiencies are spend-share only", () => {
    const result = suggestAllocation({
      channels,
      breakEvenMer,
      totalSales: 10000,
      totalSpend: 5500,
    });

    const cut = result.actions.find((a) => a.type === "cut");
    expect(cut?.channel).toBe("portfolio");
    expect(cut?.channel).not.toMatch(/manual/i);
  });

  it("cuts by lowest efficiency, not isManual preference", () => {
    const result = suggestAllocation({
      channels: [
        {
          name: "Manual / Other",
          spend: 1000,
          salesContribution: 1800,
          isManual: true,
        },
        {
          name: "Meta",
          spend: 1000,
          salesContribution: 500,
          isManual: false,
        },
      ],
      breakEvenMer: 2.5,
      totalSales: 2300,
      totalSpend: 2000,
    });

    // Meta MER 0.5 vs Manual 1.8 — cut Meta despite Manual flag
    expect(result.hasOperatorChannelCash).toBe(true);
    expect(result.actions.find((a) => a.type === "cut")?.channel).toBe("Meta");
  });

  it("holds portfolio when MER is at or above break-even", () => {
    const result = suggestAllocation({
      channels,
      breakEvenMer,
      totalSales: 20000,
      totalSpend: 5500,
    });

    expect(result.isAboveBreakEven).toBe(true);
    expect(result.actions.some((a) => a.type === "hold")).toBe(true);
    expect(result.actions.find((a) => a.type === "hold")?.channel).toBe(
      "portfolio",
    );
    expect(result.why).toMatch(/Hold portfolio/i);
    expect(result.why).toMatch(/at or above break-even/i);
  });

  it("holds when MER equals break-even exactly", () => {
    const result = suggestAllocation({
      channels: [{ name: "Meta", spend: 1000 }],
      breakEvenMer: 2.5,
      totalSales: 2500,
      totalSpend: 1000,
    });

    expect(result.overallMer).toBe(2.5);
    expect(result.isAboveBreakEven).toBe(true);
    expect(result.actions[0]?.type).toBe("hold");
  });

  it("uses salesContribution when provided (manual cash attribution)", () => {
    const result = suggestAllocation({
      channels: [
        { name: "Meta", spend: 4000, salesContribution: 12000 },
        { name: "Google", spend: 2000, salesContribution: 2000 },
      ],
      breakEvenMer: 2.5,
      totalSales: 14000,
      totalSpend: 6000,
    });

    const expectedCut = portfolioCutPercent(14000 / 6000, 2.5);
    expect(result.hasOperatorChannelCash).toBe(true);
    const google = result.inputs.channelEfficiencies.find((c) => c.name === "Google");
    expect(google?.effectiveMer).toBe(1);
    expect(google?.basis).toBe("operator_cash");
    expect(result.actions.some((a) => a.type === "cut")).toBe(true);
    expect(result.actions.find((a) => a.type === "cut")?.channel).toBe("Google");
    expect(result.actions.find((a) => a.type === "cut")?.percentChange).toBe(
      -expectedCut,
    );
  });

  it("returns watch guidance when no spend recorded", () => {
    const result = suggestAllocation({
      channels: [],
      breakEvenMer: 2.5,
      totalSales: 5000,
      totalSpend: 0,
    });

    expect(result.overallMer).toBeNull();
    expect(result.isAboveBreakEven).toBeNull();
    expect(result.actions[0]?.type).toBe("watch");
    expect(result.why).toMatch(/no ad spend/i);
  });

  it("treats negative total spend as no spend", () => {
    const result = suggestAllocation({
      channels: [{ name: "Meta", spend: 100 }],
      breakEvenMer: 2.5,
      totalSales: 5000,
      totalSpend: -10,
    });

    expect(result.overallMer).toBeNull();
    expect(result.actions[0]?.type).toBe("watch");
    expect(result.why).toMatch(/no ad spend/i);
  });

  it("does not hold when break-even is invalid (≤ 0)", () => {
    for (const badBe of [0, -2, NaN]) {
      const result = suggestAllocation({
        channels: [{ name: "Meta", spend: 1000 }],
        breakEvenMer: badBe,
        totalSales: 5000,
        totalSpend: 1000,
      });

      expect(result.isAboveBreakEven).toBeNull();
      expect(result.actions.every((a) => a.type === "watch")).toBe(true);
      expect(result.actions.some((a) => a.type === "hold")).toBe(false);
      expect(result.why).toMatch(/break-even Total ROAS is invalid/i);
    }
  });

  it("handles zero sales with positive spend as portfolio cut", () => {
    const result = suggestAllocation({
      channels: [
        { name: "Meta", spend: 800 },
        { name: "Google", spend: 200 },
      ],
      breakEvenMer: 2.5,
      totalSales: 0,
      totalSpend: 1000,
    });

    expect(result.overallMer).toBe(0);
    expect(result.isAboveBreakEven).toBe(false);
    const cut = result.actions.find((a) => a.type === "cut");
    expect(cut?.channel).toBe("portfolio");
    expect(cut?.percentChange).toBe(-SPEND_FLOOR_PCT);
    expect(Math.abs(cut?.percentChange ?? 0)).toBeLessThanOrEqual(
      SPEND_FLOOR_PCT,
    );
  });

  it("never recommends cutting more than SPEND_FLOOR_PCT (50%)", () => {
    const result = suggestAllocation({
      channels: [
        { name: "Meta", spend: 9000 },
        { name: "Google", spend: 1000 },
      ],
      breakEvenMer: 2.5,
      totalSales: 1000,
      totalSpend: 10000,
    });

    const cuts = result.actions.filter((a) => a.type === "cut");
    expect(cuts.length).toBeGreaterThan(0);
    for (const cut of cuts) {
      expect(cut.percentChange).toBeDefined();
      expect(cut.percentChange!).toBeLessThan(0);
      expect(Math.abs(cut.percentChange!)).toBeLessThanOrEqual(SPEND_FLOOR_PCT);
      expect(Math.abs(cut.percentChange!)).toBeGreaterThan(0);
    }
    expect(result.why).toMatch(/illustrative step-test|not marginal/i);
    expect(result.why).not.toMatch(/channel efficiency/i);
  });

  it("ignores negative channel spend rows", () => {
    const result = suggestAllocation({
      channels: [
        { name: "Meta", spend: 1000 },
        { name: "Bad", spend: -500 },
      ],
      breakEvenMer: 2,
      totalSales: 3000,
      totalSpend: 1000,
    });

    expect(result.inputs.channelEfficiencies.map((c) => c.name)).toEqual(["Meta"]);
  });

  it("ignores non-finite channel spend and salesContribution", () => {
    const result = suggestAllocation({
      channels: [
        { name: "Meta", spend: 1000, salesContribution: NaN },
        { name: "Ghost", spend: NaN },
        { name: "Google", spend: 0 },
      ],
      breakEvenMer: 2,
      totalSales: 4000,
      totalSpend: 1000,
    });

    const names = result.inputs.channelEfficiencies.map((c) => c.name);
    expect(names).toEqual(["Meta", "Google"]);
    const meta = result.inputs.channelEfficiencies.find((c) => c.name === "Meta");
    // Non-finite contribution → spend_share basis; no fake channel MER
    expect(meta?.assumedSales).toBe(4000);
    expect(meta?.effectiveMer).toBeNull();
    expect(meta?.basis).toBe("spend_share");
    expect(result.inputs.channelEfficiencies.find((c) => c.name === "Google")?.effectiveMer).toBeNull();
  });

  it("shifts toward stronger channel when operator cash differentiates", () => {
    const result = suggestAllocation({
      channels: [
        { name: "Weak", spend: 4000, salesContribution: 2000 },
        { name: "Strong", spend: 1000, salesContribution: 5000 },
      ],
      breakEvenMer: 2.5,
      totalSales: 7000,
      totalSpend: 5000,
    });

    const expectedCut = portfolioCutPercent(7000 / 5000, 2.5);
    expect(result.isAboveBreakEven).toBe(false);
    expect(result.hasOperatorChannelCash).toBe(true);
    const cut = result.actions.find((a) => a.type === "cut");
    const shift = result.actions.find((a) => a.type === "shift");
    expect(cut?.channel).toBe("Weak");
    expect(cut?.percentChange).toBe(-expectedCut);
    expect(shift?.channel).toBe("Strong");
    expect(shift?.percentChange).toBeGreaterThan(0);
    expect(result.why).toMatch(/Total ROAS below break-even/i);
    expect(result.why).toMatch(/illustrative step-test/i);
    expect(result.why).toMatch(/not marginal/i);
    expect(cut?.detail).toMatch(/illustrative (cash )?step-test/i);
    expect(cut?.detail).toMatch(/not marginal/i);
    expect(Math.abs(cut?.percentChange ?? 0)).toBeLessThanOrEqual(
      SPEND_FLOOR_PCT,
    );
  });

  it("asks for channel breakdown when below BE with empty channels", () => {
    const result = suggestAllocation({
      channels: [],
      breakEvenMer: 2.5,
      totalSales: 1000,
      totalSpend: 1000,
    });

    const expectedCut = portfolioCutPercent(1, 2.5);
    expect(result.isAboveBreakEven).toBe(false);
    // Empty channel list → portfolio cut (no fake channel pick)
    expect(result.actions[0]?.type).toBe("cut");
    expect(result.actions[0]?.channel).toBe("portfolio");
    expect(result.actions[0]?.percentChange).toBe(-expectedCut);
  });

  it("includes auditable inputs", () => {
    const result = suggestAllocation({
      channels: [{ name: "Meta", spend: 1000 }],
      breakEvenMer: 2,
      totalSales: 3000,
      totalSpend: 1000,
      suggestedTestDays: 14,
    });

    expect(result.suggestedTestDays).toBe(14);
    expect(result.inputs.totalSales).toBe(3000);
    expect(result.inputs.totalSpend).toBe(1000);
  });

  it("watches when portfolio sales are non-finite", () => {
    const result = suggestAllocation({
      channels: [{ name: "Meta", spend: 1000 }],
      breakEvenMer: 2.5,
      totalSales: NaN,
      totalSpend: 1000,
    });

    expect(result.overallMer).toBeNull();
    expect(result.isAboveBreakEven).toBeNull();
    expect(result.actions[0]?.type).toBe("watch");
    expect(result.why).toMatch(/could not be calculated/i);
    expect(result.inputs.totalSales).toBe(0);
  });
});
