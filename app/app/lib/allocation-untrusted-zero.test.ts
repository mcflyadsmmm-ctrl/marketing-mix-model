/**
 * Allocation untrusted-$0 gate — the Overview twin of PR #43.
 *
 * Spend coverage can be complete while the Shopify sales numerator is still
 * filling. sales ÷ spend then resolves to 0.00×, suggestAllocation reads that
 * as "below break-even", and Allocation heroes a ~50% portfolio cut off a
 * numerator nobody trusts. Overview gates this with resolveTrustedRoasHero;
 * Allocation must refuse the same advice.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { suggestAllocation } from "@mcfly/mer-core";
import { cashVerdictSalesUntrusted } from "./cash-verdict";
import { salesFactsIncompleteForDesk } from "./sales-facts-honesty";

const here = dirname(fileURLToPath(import.meta.url));
const source = readFileSync(join(here, "../routes/app.allocation.tsx"), "utf8");

const COMPLETE_COVERAGE = {
  expectedClosedDays: 8,
  factDays: 8,
  complete: true,
  periodExceedsFactWindow: false,
};

describe("Allocation untrusted $0 advice gate", () => {
  it("documents the hazard: $0 sales over live spend reads as below break-even", () => {
    const raw = suggestAllocation({
      channels: [{ name: "Meta", spend: 1000 }],
      breakEvenMer: 3,
      totalSales: 0,
      totalSpend: 1000,
    });

    expect(raw.overallMer).toBe(0);
    expect(raw.isAboveBreakEven).toBe(false);
    expect(raw.why).toMatch(/below break-even/i);
    expect(raw.actions.some((a) => a.type === "cut")).toBe(true);
  });

  it("treats complete-coverage $0 over spend as untrusted, like Overview", () => {
    const factsIncomplete = salesFactsIncompleteForDesk(COMPLETE_COVERAGE, {
      salesUntrustedZero: false,
      sales: 0,
      spend: 1000,
      liveConfirmedZero: true,
      shopOrdersSeen: 0,
    });
    expect(factsIncomplete).toBe(true);

    const untrusted =
      1000 > 0 &&
      !(0 > 0) &&
      cashVerdictSalesUntrusted({
        salesFactsIncomplete: factsIncomplete,
        salesUntrustedZero: false,
      });
    expect(untrusted).toBe(true);
  });

  it("blocks advice on salesUntrustedZero even if coverage says complete", () => {
    expect(
      cashVerdictSalesUntrusted({
        salesFactsIncomplete: false,
        salesUntrustedZero: true,
      }),
    ).toBe(true);
  });

  it("leaves a trusted quiet period and a real below-BE period alone", () => {
    const quietConfirmed = salesFactsIncompleteForDesk(COMPLETE_COVERAGE, {
      sales: 0,
      spend: 1000,
      liveConfirmedZero: true,
      shopOrdersSeen: 12,
    });
    expect(quietConfirmed).toBe(false);

    // Real sales below break-even must still reach the merchant.
    expect(
      cashVerdictSalesUntrusted({
        salesFactsIncomplete: false,
        salesUntrustedZero: false,
      }),
    ).toBe(false);
  });

  it("computes salesUntrustedForAdvice from spend, $0 sales and both trust flags", () => {
    expect(source).toContain("const salesUntrustedForAdvice =");
    expect(source).toContain("metrics.totalSpend > 0");
    expect(source).toContain("!(metrics.sales > 0)");
    expect(source).toContain("cashVerdictSalesUntrusted({");
    expect(source).toContain("salesFactsIncomplete: factsIncomplete");
    expect(source).toContain("salesUntrustedZero: deskSalesUntrustedZero");
  });

  it("suppresses the allocation suggestion and its history twin when untrusted", () => {
    expect(source).toMatch(
      /salesError \|\| salesUntrustedForAdvice \? null : metrics\.allocation/,
    );
    // Both the rendered advice and the history primaryAction must be gated.
    expect(
      source.match(/salesError \|\| salesUntrustedForAdvice \? null/g)?.length,
    ).toBeGreaterThanOrEqual(2);
  });

  it("SAMPLE desk keeps its numeric practice allocation", () => {
    expect(source).toContain("!useSampleDesk &&");
  });

  it("explains the block instead of falling back to add-spend copy", () => {
    expect(source).toContain("UNTRUSTED_ZERO_ROAS_COPY.heading");
    expect(source).toContain("salesUntrustedState");
    expect(source).toContain(
      "!allocation && !zeroMargin && !cashLocked && !salesUntrustedState",
    );
  });
});
