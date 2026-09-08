import { describe, expect, it } from "vitest";
import {
  merLooksLikeZero,
  resolveTrustedRoasHero,
  UNTRUSTED_ZERO_ROAS_COPY,
} from "./trusted-roas-hero";

describe("merLooksLikeZero", () => {
  it("treats formatMer 0.00 rounding as a dead hero", () => {
    expect(merLooksLikeZero(0)).toBe(true);
    expect(merLooksLikeZero(0.004)).toBe(true);
    expect(merLooksLikeZero(0.005)).toBe(false);
    expect(merLooksLikeZero(2.4)).toBe(false);
    expect(merLooksLikeZero(null)).toBe(true);
  });
});

describe("resolveTrustedRoasHero", () => {
  it("hides 0.00 when spend exists and sales facts are incomplete", () => {
    const hero = resolveTrustedRoasHero({
      mer: 0,
      sales: 0,
      spend: 650,
      factsIncomplete: true,
      periodPreset: "mtd",
    });
    expect(hero.kind).toBe("wait_backfill");
    expect(hero.showMer).toBe(false);
    expect(hero.mer).toBeNull();
    expect(hero.hideUntrustedZero).toBe(true);
    expect(hero.heading).toBe(UNTRUSTED_ZERO_ROAS_COPY.heading);
    expect(hero.body).toMatch(/sales ÷ that spend/i);
    expect(hero.body).not.toMatch(/ads don.?t work/i);
    expect(hero.primaryLabel).toBe(UNTRUSTED_ZERO_ROAS_COPY.refreshLabel);
    expect(hero.secondaryLabel).toBe(UNTRUSTED_ZERO_ROAS_COPY.mtdLabel);
  });

  it("sends QTD-without-history to MTD instead of lying that refresh will fill", () => {
    const hero = resolveTrustedRoasHero({
      mer: 0,
      sales: 0,
      spend: 650,
      factsIncomplete: true,
      periodUncovered: true,
      periodPreset: "qtd",
    });
    expect(hero.kind).toBe("pick_covered_period");
    expect(hero.hideUntrustedZero).toBe(true);
    expect(hero.heading).toBe(UNTRUSTED_ZERO_ROAS_COPY.periodHeading);
    expect(hero.body).toMatch(/Open MTD/i);
    expect(hero.primaryHref).toBe("/app?period=mtd");
    expect(hero.primaryLabel).toBe(UNTRUSTED_ZERO_ROAS_COPY.mtdLabel);
  });

  it("hides a 0.00-looking partial multiple while facts are still filling", () => {
    const hero = resolveTrustedRoasHero({
      mer: 0.004,
      sales: 2,
      spend: 650,
      factsIncomplete: true,
    });
    expect(hero.hideUntrustedZero).toBe(true);
    expect(hero.kind).toBe("wait_backfill");
  });

  it("keeps a real quiet-period 0.00 when facts are complete", () => {
    const hero = resolveTrustedRoasHero({
      mer: 0,
      sales: 0,
      spend: 650,
      factsIncomplete: false,
    });
    expect(hero.kind).toBe("trusted");
    expect(hero.showMer).toBe(true);
    expect(hero.mer).toBe(0);
    expect(hero.hideUntrustedZero).toBe(false);
  });

  it("keeps a finite trusted multiple even while facts are still filling", () => {
    const hero = resolveTrustedRoasHero({
      mer: 2.4,
      sales: 1_200,
      spend: 500,
      factsIncomplete: true,
    });
    expect(hero.kind).toBe("trusted");
    expect(hero.showMer).toBe(true);
    expect(hero.mer).toBe(2.4);
    expect(hero.hideUntrustedZero).toBe(false);
  });

  it("never hides SAMPLE numbers", () => {
    const hero = resolveTrustedRoasHero({
      mer: 0,
      sales: 0,
      spend: 100,
      factsIncomplete: true,
      periodUncovered: true,
      useSampleDesk: true,
    });
    expect(hero.hideUntrustedZero).toBe(false);
    expect(hero.mer).toBe(0);
    expect(hero.kind).toBe("trusted");
  });
});
