import { describe, expect, it } from "vitest";
import {
  calculateBreakEvenMer,
  calculateMer,
  suggestAllocation,
} from "../src/index.js";

describe("MER math", () => {
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

    expect(result.actions[0]?.type).toBe("watch");
    expect(result.why).toMatch(/no ad spend/i);
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
});
