import { describe, expect, it } from "vitest";
import {
  channelMix,
  computeBreakEvenMer,
  computeMer,
  sumSpend,
} from "./index.js";

describe("computeMer", () => {
  it("returns sales divided by spend (never inverted)", () => {
    expect(computeMer(100_000, 25_000)).toBe(4);
    expect(computeMer(25_000, 100_000)).toBe(0.25);
  });

  it("returns null when spend is zero or negative", () => {
    expect(computeMer(100_000, 0)).toBeNull();
    expect(computeMer(100_000, -5)).toBeNull();
  });

  it("returns 0 for zero sales with positive spend", () => {
    expect(computeMer(0, 10_000)).toBe(0);
  });

  it("allows negative net sales", () => {
    expect(computeMer(-1_000, 2_000)).toBe(-0.5);
  });

  it("returns null for non-finite inputs", () => {
    expect(computeMer(NaN, 1_000)).toBeNull();
    expect(computeMer(1_000, NaN)).toBeNull();
    expect(computeMer(Infinity, 1_000)).toBeNull();
    expect(computeMer(1_000, Infinity)).toBeNull();
  });
});

describe("computeBreakEvenMer", () => {
  it("returns 1 / margin for valid margins in (0, 1]", () => {
    expect(computeBreakEvenMer(0.35)).toBeCloseTo(2.857, 2);
    expect(computeBreakEvenMer(1)).toBe(1);
    expect(computeBreakEvenMer(0.5)).toBe(2);
  });

  it("returns null for invalid margin", () => {
    expect(computeBreakEvenMer(0)).toBeNull();
    expect(computeBreakEvenMer(-0.2)).toBeNull();
    expect(computeBreakEvenMer(1.5)).toBeNull();
    expect(computeBreakEvenMer(NaN)).toBeNull();
    expect(computeBreakEvenMer(Infinity)).toBeNull();
  });
});

describe("channelMix", () => {
  it("computes spend shares that sum to 1", () => {
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
    expect(mix.reduce((s, e) => s + e.share, 0)).toBeCloseTo(1);
  });

  it("returns zero shares when total spend is zero", () => {
    const mix = channelMix([{ channel: "meta", amount: 0 }]);
    expect(mix[0]).toEqual({ channel: "meta", amount: 0, share: 0 });
  });

  it("clamps negative and non-finite amounts to zero", () => {
    const mix = channelMix([
      { channel: "meta", amount: 1000 },
      { channel: "google", amount: -200 },
      { channel: "other", amount: NaN },
    ]);
    expect(mix).toEqual([
      { channel: "meta", amount: 1000, share: 1 },
      { channel: "google", amount: 0, share: 0 },
      { channel: "other", amount: 0, share: 0 },
    ]);
  });

  it("does not invent negative shares when amounts cancel", () => {
    const mix = channelMix([
      { channel: "meta", amount: 100 },
      { channel: "google", amount: -100 },
    ]);
    expect(mix.every((e) => e.share >= 0)).toBe(true);
    expect(mix.map((e) => e.amount)).toEqual([100, 0]);
    expect(mix[0]?.share).toBe(1);
  });

  /*
   * A merchant's own name for an offline extra rides along so Overview can say
   * "Billboard" instead of folding it into a single "Other" lump.
   */
  it("carries a custom label through to the mix entry", () => {
    const mix = channelMix([
      { channel: "meta", amount: 250 },
      { channel: "other", amount: 400, customLabel: "Billboard" },
    ]);
    expect(mix).toEqual([
      { channel: "meta", amount: 250, share: 0.38461538461538464 },
      {
        channel: "other",
        amount: 400,
        customLabel: "Billboard",
        share: 0.6153846153846154,
      },
    ]);
  });

  it("keeps named extras and unlabeled other spend as separate slices", () => {
    const mix = channelMix([
      { channel: "other", amount: 90 },
      { channel: "other", amount: 400, customLabel: "Billboard" },
      { channel: "other", amount: 10, customLabel: "Radio" },
    ]);
    expect(mix.map((e) => e.customLabel)).toEqual([
      undefined,
      "Billboard",
      "Radio",
    ]);
    // Unattributed spend keeps its dollars — nothing is dropped or merged away.
    expect(mix.reduce((s, e) => s + e.amount, 0)).toBe(500);
    expect(mix.reduce((s, e) => s + e.share, 0)).toBeCloseTo(1);
  });

  it("omits customLabel rather than emitting an empty name", () => {
    const mix = channelMix([
      { channel: "other", amount: 50, customLabel: "" },
    ]);
    expect(mix[0]).toEqual({ channel: "other", amount: 50, share: 1 });
    expect("customLabel" in mix[0]).toBe(false);
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

  it("ignores negative and non-finite amounts", () => {
    expect(
      sumSpend([
        { channel: "meta", amount: 100 },
        { channel: "google", amount: -40 },
        { channel: "other", amount: NaN },
        { channel: "tiktok", amount: 0 },
      ]),
    ).toBe(100);
  });
});
