import { describe, expect, it } from "vitest";
import { salesFactsBackfillShouldContinue } from "./sales-backfill-kick.server";

describe("salesFactsBackfillShouldContinue", () => {
  it("re-arms the tick when missing days remain", () => {
    expect(
      salesFactsBackfillShouldContinue({
        remainingMissingDays: 40,
        failed: [],
        skippedReason: null,
      }),
    ).toBe(true);
  });

  it("re-arms when this chunk failed so $0 sales cannot stick", () => {
    expect(
      salesFactsBackfillShouldContinue({
        remainingMissingDays: 0,
        failed: ["2026-09-07"],
        skippedReason: null,
      }),
    ).toBe(true);
  });

  it("stops when the window is filled", () => {
    expect(
      salesFactsBackfillShouldContinue({
        remainingMissingDays: 0,
        failed: [],
        skippedReason: null,
      }),
    ).toBe(false);
  });

  it("does not spin when timezone is unknown", () => {
    expect(
      salesFactsBackfillShouldContinue({
        remainingMissingDays: 60,
        failed: [],
        skippedReason: "no_timezone",
      }),
    ).toBe(false);
  });
});
