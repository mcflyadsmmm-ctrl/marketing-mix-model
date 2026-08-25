import { describe, expect, it } from "vitest";
import { spendPeriodMix } from "./spend-period-mix";

describe("spendPeriodMix", () => {
  it("returns shares that sum to 1, sorted by amount desc", () => {
    const mix = spendPeriodMix([
      { channel: "google", amount: 3000 },
      { channel: "meta", amount: 6000 },
      { channel: "other", amount: 1000 },
    ]);
    expect(mix.map((row) => row.channel)).toEqual([
      "meta",
      "google",
      "other",
    ]);
    expect(mix).toEqual([
      { channel: "meta", amount: 6000, share: 0.6 },
      { channel: "google", amount: 3000, share: 0.3 },
      { channel: "other", amount: 1000, share: 0.1 },
    ]);
    expect(mix.reduce((sum, row) => sum + row.share, 0)).toBeCloseTo(1);
  });

  it("aggregates the same channel before computing shares", () => {
    const mix = spendPeriodMix([
      { channel: "meta", amount: 250 },
      { channel: "google", amount: 400 },
      { channel: "meta", amount: 350 },
    ]);
    expect(mix).toEqual([
      { channel: "meta", amount: 600, share: 0.6 },
      { channel: "google", amount: 400, share: 0.4 },
    ]);
    expect(mix.reduce((sum, row) => sum + row.share, 0)).toBeCloseTo(1);
  });

  it("treats non-finite and negative amounts as zero", () => {
    const mix = spendPeriodMix([
      { channel: "meta", amount: 1000 },
      { channel: "google", amount: -200 },
      { channel: "other", amount: Number.NaN },
      { channel: "tiktok", amount: Number.POSITIVE_INFINITY },
    ]);
    expect(mix.find((row) => row.channel === "meta")).toEqual({
      channel: "meta",
      amount: 1000,
      share: 1,
    });
    expect(mix.find((row) => row.channel === "google")).toEqual({
      channel: "google",
      amount: 0,
      share: 0,
    });
    expect(mix.find((row) => row.channel === "other")).toEqual({
      channel: "other",
      amount: 0,
      share: 0,
    });
    expect(mix.find((row) => row.channel === "tiktok")).toEqual({
      channel: "tiktok",
      amount: 0,
      share: 0,
    });
    expect(mix.reduce((sum, row) => sum + row.share, 0)).toBeCloseTo(1);
  });

  it("returns zero shares when every amount is zero", () => {
    const mix = spendPeriodMix([
      { channel: "meta", amount: 0 },
      { channel: "google", amount: -10 },
    ]);
    expect(mix.every((row) => row.amount === 0 && row.share === 0)).toBe(
      true,
    );
    expect(mix.reduce((sum, row) => sum + row.share, 0)).toBe(0);
  });

  it("returns an empty list when there are no entries", () => {
    expect(spendPeriodMix([])).toEqual([]);
  });

  it("keeps named extras as separate mix rows instead of one Other bucket", () => {
    const mix = spendPeriodMix([
      { channel: "meta", amount: 100 },
      { channel: "Billboards / OOH", amount: 80 },
      { channel: "Radio", amount: 20 },
    ]);
    expect(mix).toEqual([
      { channel: "meta", amount: 100, share: 0.5 },
      { channel: "Billboards / OOH", amount: 80, share: 0.4 },
      { channel: "Radio", amount: 20, share: 0.1 },
    ]);
  });
});
