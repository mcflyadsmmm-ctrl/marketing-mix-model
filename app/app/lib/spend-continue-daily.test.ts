import { describe, expect, it } from "vitest";
import {
  continueDailyCheckedDefault,
  shouldContinueDailyAmount,
} from "./spend-continue-daily";

describe("shouldContinueDailyAmount", () => {
  it("continues a typed daily amount until the merchant changes it", () => {
    expect(
      shouldContinueDailyAmount({
        continueDaily: true,
        editing: false,
        amount: 40,
      }),
    ).toBe(true);
  });

  it("does not start a rate when editing a single day", () => {
    expect(
      shouldContinueDailyAmount({
        continueDaily: true,
        editing: true,
        amount: 40,
      }),
    ).toBe(false);
  });

  it("does not start a rate when the merchant opts out or amount is empty", () => {
    expect(
      shouldContinueDailyAmount({
        continueDaily: false,
        editing: false,
        amount: 40,
      }),
    ).toBe(false);
    expect(
      shouldContinueDailyAmount({
        continueDaily: true,
        editing: false,
        amount: 0,
      }),
    ).toBe(false);
  });
});

describe("continueDailyCheckedDefault", () => {
  it("defaults on for a new day and off while editing", () => {
    expect(continueDailyCheckedDefault(false)).toBe(true);
    expect(continueDailyCheckedDefault(true)).toBe(false);
  });
});
