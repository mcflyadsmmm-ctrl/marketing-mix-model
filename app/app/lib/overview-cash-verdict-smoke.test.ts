/**
 * demvcflyads cold smoke — MTD, SAMPLE OFF, $0 sales / $1000 spend / 0.00×.
 * Complete $0 SalesDayFact rows + a same-query live “confirm” must not hero
 * “No — below break-even”. Overview must pass incomplete OR untrustedZero.
 */
import { describe, expect, it } from "vitest";
import { resolveCashVerdict } from "./cash-verdict";
import { salesFactsIncompleteForDesk } from "./sales-facts-honesty";
import { resolveTrustedRoasHero } from "./trusted-roas-hero";

const SMOKE_COVERAGE = {
  expectedClosedDays: 8,
  factDays: 8,
  complete: true,
  periodExceedsFactWindow: false,
};

describe("Overview MTD untrusted $0 smoke (demvcflyads)", () => {
  it("never paints below break-even when spend>0 sales===0 and incomplete OR untrustedZero", () => {
    const salesUntrustedZero = true;
    const liveConfirmedZero = false;
    const factsIncompleteForHonesty = salesFactsIncompleteForDesk(SMOKE_COVERAGE, {
      salesUntrustedZero,
      sales: 0,
      liveConfirmedZero,
    });
    const trustedHero = resolveTrustedRoasHero({
      mer: 0,
      sales: 0,
      spend: 1000,
      factsIncomplete: factsIncompleteForHonesty,
      periodUncovered: false,
      periodPreset: "mtd",
    });

    expect(factsIncompleteForHonesty).toBe(true);
    expect(trustedHero.hideUntrustedZero).toBe(true);

    const verdict = resolveCashVerdict({
      mer: trustedHero.mer,
      sales: trustedHero.hideUntrustedZero ? 0 : 0,
      spend: 1000,
      breakEvenMer: trustedHero.hideUntrustedZero ? null : 1.8,
      spendIncomplete: false,
      salesFactsIncomplete:
        factsIncompleteForHonesty || trustedHero.hideUntrustedZero,
      salesUntrustedZero,
    });

    expect(verdict.headline).not.toMatch(/below break-even/i);
    expect(verdict.tone).toBe("blocked");
  });

  it("blocks below break-even even if Overview forgot to OR incomplete (untrustedZero wire)", () => {
    const verdict = resolveCashVerdict({
      mer: 0,
      sales: 0,
      spend: 1000,
      breakEvenMer: 1.8,
      spendIncomplete: false,
      salesFactsIncomplete: false,
      salesUntrustedZero: true,
    });
    expect(verdict.headline).not.toMatch(/below break-even/i);
    expect(verdict.tone).toBe("blocked");
  });
});
