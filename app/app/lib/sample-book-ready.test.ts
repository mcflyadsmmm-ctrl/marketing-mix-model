import { describe, expect, it } from "vitest";
import { sampleBookIsPaintable } from "./sample-book-ready";

describe("sampleBookIsPaintable", () => {
  it("requires sales days and SAMPLE spend — empty book is not ready", () => {
    expect(sampleBookIsPaintable({ dayCount: 0, spendCount: 0 })).toBe(false);
    expect(sampleBookIsPaintable({ dayCount: 400, spendCount: 0 })).toBe(false);
    expect(sampleBookIsPaintable({ dayCount: 0, spendCount: 12 })).toBe(false);
  });

  it("a Harbor-style book with days and spend is ready to paint", () => {
    expect(sampleBookIsPaintable({ dayCount: 400, spendCount: 800 })).toBe(true);
  });
});
