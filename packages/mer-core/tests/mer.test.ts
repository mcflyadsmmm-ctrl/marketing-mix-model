import { describe, expect, it } from "vitest";
import {
  calculateBreakEvenMer,
  calculateMer,
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
