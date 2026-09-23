import { describe, expect, it } from "vitest";
import {
  cohortHasLivedYear,
  firstYearBlocked,
  orderBookSpanDays,
  paintedYearDollars,
} from "./ltv-year-honesty";

describe("first-year honesty", () => {
  it("blocks an unpaid 90-closed-day book even when older rows are still stored", () => {
    expect(
      firstYearBlocked({
        orderBookDepth: "trial_slice",
        bookSpanDays: 400,
      }),
    ).toBe(true);
    expect(
      firstYearBlocked({
        historyLimited: true,
        orderBookDepth: "paid_full",
        bookSpanDays: 800,
      }),
    ).toBe(true);
  });

  it("blocks a short paid book and allows a year that is actually on file", () => {
    expect(
      firstYearBlocked({ orderBookDepth: "paid_full", bookSpanDays: 89 }),
    ).toBe(true);
    expect(
      firstYearBlocked({ orderBookDepth: "paid_full", bookSpanDays: 365 }),
    ).toBe(false);
    expect(firstYearBlocked({ orderBookDepth: "paid_full" })).toBe(false);
  });

  it("refuses $0 and sub-dollar years", () => {
    expect(paintedYearDollars(null)).toBeNull();
    expect(paintedYearDollars(0)).toBeNull();
    expect(paintedYearDollars(0.4)).toBeNull();
    expect(paintedYearDollars(545)).toBe(545);
  });

  it("treats a young cohort as pending and an old one as lived", () => {
    const asOf = new Date("2026-09-23T00:00:00.000Z");
    expect(cohortHasLivedYear("2026-08", asOf)).toBe(false);
    expect(cohortHasLivedYear("2024-01", asOf)).toBe(true);
    expect(cohortHasLivedYear("not-a-month", asOf)).toBe(false);
  });

  it("measures a short book from the oldest order", () => {
    const asOf = new Date("2026-09-23T00:00:00.000Z");
    const span = orderBookSpanDays(
      [new Date("2026-08-01T00:00:00.000Z"), new Date("2026-09-20T00:00:00.000Z")],
      asOf,
    );
    expect(span).toBeLessThan(365);
    expect(span).toBeGreaterThan(40);
    expect(orderBookSpanDays([], asOf)).toBeNull();
  });
});
