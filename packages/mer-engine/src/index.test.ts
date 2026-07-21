import { describe, expect, it } from "vitest";
import {
  channelMix,
  computeBreakEvenMer,
  computeMer,
  sumSpend,
} from "./index.js";

describe("computeMer", () => {
  it("returns sales divided by spend", () => {
    expect(computeMer(100_000, 25_000)).toBe(4);
  });

  it("returns null when spend is zero", () => {
    expect(computeMer(100_000, 0)).toBeNull();
  });
});

describe("computeBreakEvenMer", () => {
  it("returns 1 / margin", () => {
    expect(computeBreakEvenMer(0.35)).toBeCloseTo(2.857, 2);
  });

  it("returns null for invalid margin", () => {
    expect(computeBreakEvenMer(0)).toBeNull();
    expect(computeBreakEvenMer(1.5)).toBeNull();
  });
});

describe("channelMix", () => {
  it("computes spend shares", () => {
    const mix = channelMix([
      { channel: "meta", amount: 6000 },
      { channel: "google", amount: 3000 },
      { channel: "other", amount: 1000 },
    ]);
    expect(mix).toEqual([
      { channel: "meta", amount: 6000, share: 0.6 },
      { channel: "google", amount: 3000, share: 0.3 },
      { channel: "other", amount: 1000, share: 0.1 },
    ]);
  });

  it("returns zero shares when total spend is zero", () => {
    const mix = channelMix([{ channel: "meta", amount: 0 }]);
    expect(mix[0]?.share).toBe(0);
  });
});

describe("sumSpend", () => {
  it("sums channel amounts", () => {
    expect(
      sumSpend([
        { channel: "meta", amount: 100 },
        { channel: "google", amount: 50 },
      ]),
    ).toBe(150);
  });
});
