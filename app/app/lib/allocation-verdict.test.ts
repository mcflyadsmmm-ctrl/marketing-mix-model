import { describe, expect, it } from "vitest";
import {
  allocationActionLabel,
  formatAllocationPercentChange,
} from "./allocation-verdict";

describe("allocationActionLabel", () => {
  it("maps engine types to hold / reduce / step-test vocabulary", () => {
    expect(allocationActionLabel("hold")).toBe("Hold");
    expect(allocationActionLabel("cut")).toBe("Step-test reduce");
    expect(allocationActionLabel("shift")).toBe("Shift");
    expect(allocationActionLabel("watch")).toBe("Watch");
  });
});

describe("formatAllocationPercentChange", () => {
  it("formats cuts and shifts; skips missing/zero", () => {
    expect(formatAllocationPercentChange(-20)).toBe("-20%");
    expect(formatAllocationPercentChange(15)).toBe("+15%");
    expect(formatAllocationPercentChange(0)).toBeNull();
    expect(formatAllocationPercentChange(undefined)).toBeNull();
  });
});
