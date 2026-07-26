import { describe, expect, it } from "vitest";
import {
  calculateBreakEvenMer,
  calculateMer,
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

describe("suggestAllocation", () => {
  const breakEvenMer = 2.5;
  const channels = [
    { name: "Meta", spend: 3000 },
    { name: "Google", spend: 2000 },
    { name: "Manual / Other", spend: 500, isManual: true },
  ];

  it("suggests cuts when overall MER is below break-even", () => {
    const result = suggestAllocation({
      channels,
      breakEvenMer,
      totalSales: 10000,
      totalSpend: 5500,
    });

    expect(result.overallMer).toBeCloseTo(1.8182, 3);
    expect(result.isAboveBreakEven).toBe(false);
    expect(result.suggestedTestDays).toBe(7);
    expect(result.actions.some((a) => a.type === "cut")).toBe(true);
    expect(result.why).toMatch(/below break-even/i);
    expect(result.inputs.channelEfficiencies).toHaveLength(3);
  });

  it("prefers cutting manual channel when below break-even", () => {
    const result = suggestAllocation({
      channels,
      breakEvenMer,
      totalSales: 10000,
      totalSpend: 5500,
    });

    const cut = result.actions.find((a) => a.type === "cut");
    expect(cut?.channel).toMatch(/manual/i);
  });

  it("holds mix when MER is at or above break-even", () => {
    const result = suggestAllocation({
      channels,
      breakEvenMer,
      totalSales: 20000,
      totalSpend: 5500,
    });

    expect(result.isAboveBreakEven).toBe(true);
    expect(result.actions.some((a) => a.type === "hold")).toBe(true);
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

    const google = result.inputs.channelEfficiencies.find((c) => c.name === "Google");
    expect(google?.effectiveMer).toBe(1);
    expect(result.actions.some((a) => a.type === "cut")).toBe(true);
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
      expect(result.why).toMatch(/break-even MER is invalid/i);
    }
  });

  it("handles zero sales with positive spend as below break-even", () => {
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
    expect(result.actions.some((a) => a.type === "cut")).toBe(true);
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
    // Falls back to spend-share assumption when contribution is non-finite.
    expect(meta?.assumedSales).toBe(4000);
    expect(meta?.effectiveMer).toBe(4);
    expect(result.inputs.channelEfficiencies.find((c) => c.name === "Google")?.effectiveMer).toBeNull();
  });

  it("shifts toward stronger channel when cutting below break-even", () => {
    const result = suggestAllocation({
      channels: [
        { name: "Weak", spend: 4000, salesContribution: 2000 },
        { name: "Strong", spend: 1000, salesContribution: 5000 },
      ],
      breakEvenMer: 2.5,
      totalSales: 7000,
      totalSpend: 5000,
    });

    expect(result.isAboveBreakEven).toBe(false);
    const cut = result.actions.find((a) => a.type === "cut");
    const shift = result.actions.find((a) => a.type === "shift");
    expect(cut?.channel).toBe("Weak");
    expect(shift?.channel).toBe("Strong");
    expect(shift?.percentChange).toBeGreaterThan(0);
  });

  it("asks for channel breakdown when below BE with empty channels", () => {
    const result = suggestAllocation({
      channels: [],
      breakEvenMer: 2.5,
      totalSales: 1000,
      totalSpend: 1000,
    });

    expect(result.isAboveBreakEven).toBe(false);
    expect(result.actions[0]?.type).toBe("watch");
    expect(result.actions[0]?.detail).toMatch(/channel-level spend/i);
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
