import { describe, expect, it } from "vitest";
import { resolveSalesReadiness } from "./sales-pending";

const complete = {
  complete: true,
  factDays: 25,
  periodExceedsFactWindow: false,
};
const nothingYet = {
  complete: false,
  factDays: 0,
  periodExceedsFactWindow: false,
};
const partial = {
  complete: false,
  factDays: 9,
  periodExceedsFactWindow: false,
};
const beyondWindow = {
  complete: false,
  factDays: 0,
  periodExceedsFactWindow: true,
};

describe("resolveSalesReadiness", () => {
  /*
   * The exact 2026-08-26 smoke: spend $650 saved, 0 of 25 closed sales days
   * ready, Overview printed 0.00×.
   */
  it("suppresses the ratio when no closed sales day has landed", () => {
    const r = resolveSalesReadiness({
      coverage: nothingYet,
      sales: 0,
      useSampleDesk: false,
    });
    expect(r.salesPending).toBe(true);
    expect(r.salesCoverageIncomplete).toBe(true);
  });

  it("keeps a genuine zero when coverage is complete", () => {
    const r = resolveSalesReadiness({
      coverage: complete,
      sales: 0,
      useSampleDesk: false,
    });
    expect(r.salesPending).toBe(false);
    expect(r.salesCoverageIncomplete).toBe(false);
  });

  it("shows the real ratio on partial coverage but blocks advice", () => {
    const r = resolveSalesReadiness({
      coverage: partial,
      sales: 18_400,
      useSampleDesk: false,
    });
    expect(r.salesPending).toBe(false);
    expect(r.salesCoverageIncomplete).toBe(true);
  });

  it("does not suppress when sales landed before the fact rows were counted", () => {
    const r = resolveSalesReadiness({
      coverage: nothingYet,
      sales: 4_200,
      useSampleDesk: false,
    });
    expect(r.salesPending).toBe(false);
  });

  it("treats a period reaching past the fact window as capped, not loading", () => {
    const r = resolveSalesReadiness({
      coverage: beyondWindow,
      sales: 0,
      useSampleDesk: false,
    });
    expect(r.salesPending).toBe(false);
    expect(r.salesCoverageIncomplete).toBe(false);
  });

  it("never withholds sample desk numbers — they are complete by construction", () => {
    const r = resolveSalesReadiness({
      coverage: nothingYet,
      sales: 0,
      useSampleDesk: true,
    });
    expect(r.salesPending).toBe(false);
    expect(r.salesCoverageIncomplete).toBe(false);
  });

  it("shows a number when coverage is unknown rather than blanking the desk", () => {
    for (const coverage of [null, undefined]) {
      const r = resolveSalesReadiness({
        coverage,
        sales: 0,
        useSampleDesk: false,
      });
      expect(r.salesPending).toBe(false);
      expect(r.salesCoverageIncomplete).toBe(false);
    }
  });
});
