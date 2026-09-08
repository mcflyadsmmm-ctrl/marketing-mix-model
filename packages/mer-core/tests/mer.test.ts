import { describe, expect, it } from "vitest";
import {
  calculateAmer,
  calculateBreakEvenMer,
  calculateMer,
  computeContributionMarginFromStack,
  formatMer,
  isAboveBreakEven,
} from "../src/index.js";

describe("calculateMer", () => {
  it("is sales ÷ spend (never inverted)", () => {
    expect(calculateMer(10_000, 4_000)).toBe(2.5);
    expect(calculateMer(4_000, 10_000)).toBe(0.4);
  });

  it("returns null for zero or negative spend", () => {
    expect(calculateMer(10_000, 0)).toBeNull();
    expect(calculateMer(10_000, -1)).toBeNull();
    expect(calculateMer(0, 0)).toBeNull();
  });

  it("returns 0 when sales are zero with positive spend", () => {
    expect(calculateMer(0, 1_000)).toBe(0);
  });

  it("allows negative net sales (refund-heavy periods)", () => {
    expect(calculateMer(-500, 1_000)).toBe(-0.5);
  });

  it("returns null for non-finite inputs", () => {
    expect(calculateMer(NaN, 1_000)).toBeNull();
    expect(calculateMer(1_000, NaN)).toBeNull();
    expect(calculateMer(Infinity, 1_000)).toBeNull();
    expect(calculateMer(1_000, Infinity)).toBeNull();
    expect(calculateMer(-Infinity, 1_000)).toBeNull();
  });
});

describe("calculateAmer", () => {
  it("is new-customer net sales ÷ spend (same null rules as calculateMer)", () => {
    expect(calculateAmer(4_000, 2_000)).toBe(2);
    expect(calculateAmer(0, 1_000)).toBe(0);
    expect(calculateAmer(-200, 1_000)).toBe(-0.2);
    expect(calculateAmer(1_000, 0)).toBeNull();
    expect(calculateAmer(1_000, -1)).toBeNull();
    expect(calculateAmer(NaN, 1_000)).toBeNull();
    expect(calculateAmer(1_000, Infinity)).toBeNull();
  });
});

describe("computeContributionMarginFromStack", () => {
  it("returns 1 − (cogs + fees + shipping) when stack is valid", () => {
    expect(
      computeContributionMarginFromStack({
        cogsPct: 0.3,
        paymentFeesPct: 0.03,
        shippingPct: 0.07,
      }),
    ).toBeCloseTo(0.6);
    expect(
      computeContributionMarginFromStack({
        cogsPct: 0,
        paymentFeesPct: 0,
        shippingPct: 0,
      }),
    ).toBe(1);
  });

  it("returns null when stack sum ≥ 1, any input is negative, or non-finite", () => {
    expect(
      computeContributionMarginFromStack({
        cogsPct: 0.5,
        paymentFeesPct: 0.3,
        shippingPct: 0.2,
      }),
    ).toBeNull();
    expect(
      computeContributionMarginFromStack({
        cogsPct: 0.6,
        paymentFeesPct: 0.3,
        shippingPct: 0.2,
      }),
    ).toBeNull();
    expect(
      computeContributionMarginFromStack({
        cogsPct: -0.1,
        paymentFeesPct: 0.1,
        shippingPct: 0.1,
      }),
    ).toBeNull();
    expect(
      computeContributionMarginFromStack({
        cogsPct: NaN,
        paymentFeesPct: 0.1,
        shippingPct: 0.1,
      }),
    ).toBeNull();
  });
});

describe("calculateBreakEvenMer", () => {
  it("is ≈ 1 / contribution margin", () => {
    expect(calculateBreakEvenMer(0.4)).toBeCloseTo(2.5);
    expect(calculateBreakEvenMer(0.25)).toBeCloseTo(4);
    expect(calculateBreakEvenMer(1)).toBe(1);
  });

  it("returns null for margin ≤ 0 or > 1", () => {
    expect(calculateBreakEvenMer(0)).toBeNull();
    expect(calculateBreakEvenMer(-0.1)).toBeNull();
    expect(calculateBreakEvenMer(1.0001)).toBeNull();
    expect(calculateBreakEvenMer(1.5)).toBeNull();
  });

  it("returns null for non-finite margin", () => {
    expect(calculateBreakEvenMer(NaN)).toBeNull();
    expect(calculateBreakEvenMer(Infinity)).toBeNull();
    expect(calculateBreakEvenMer(-Infinity)).toBeNull();
  });
});

describe("isAboveBreakEven", () => {
  it("compares MER to break-even inclusively", () => {
    expect(isAboveBreakEven(2.5, 2.5)).toBe(true);
    expect(isAboveBreakEven(3, 2.5)).toBe(true);
    expect(isAboveBreakEven(2, 2.5)).toBe(false);
  });

  it("returns null when MER is null or non-finite", () => {
    expect(isAboveBreakEven(null, 2.5)).toBeNull();
    expect(isAboveBreakEven(NaN, 2.5)).toBeNull();
    expect(isAboveBreakEven(Infinity, 2.5)).toBeNull();
  });

  it("returns null for invalid break-even (≤ 0 or non-finite)", () => {
    expect(isAboveBreakEven(2.5, 0)).toBeNull();
    expect(isAboveBreakEven(2.5, -1)).toBeNull();
    expect(isAboveBreakEven(2.5, NaN)).toBeNull();
    expect(isAboveBreakEven(2.5, Infinity)).toBeNull();
  });
});

describe("formatMer", () => {
  it("formats finite MER to fixed digits", () => {
    expect(formatMer(2.5)).toBe("2.50");
    expect(formatMer(2.567, 1)).toBe("2.6");
    expect(formatMer(0)).toBe("0.00");
  });

  it("renders an em dash for null or non-finite", () => {
    expect(formatMer(null)).toBe("—");
    expect(formatMer(NaN)).toBe("—");
    expect(formatMer(Infinity)).toBe("—");
  });
});
