import { describe, expect, it } from "vitest";
import {
  resolveTrustedRoasHero,
  UNTRUSTED_ZERO_ROAS_COPY,
} from "./trusted-roas-hero";

describe("resolveTrustedRoasHero", () => {
  it("hides 0.00 when spend exists and sales facts are incomplete", () => {
    const hero = resolveTrustedRoasHero({
      mer: 0,
      sales: 0,
      spend: 650,
      factsIncomplete: true,
    });
    expect(hero.showMer).toBe(false);
    expect(hero.mer).toBeNull();
    expect(hero.hideUntrustedZero).toBe(true);
    expect(hero.heading).toBe(UNTRUSTED_ZERO_ROAS_COPY.heading);
    expect(hero.body).toMatch(/not a trusted multiple/i);
    expect(hero.body).not.toMatch(/ads don.?t work/i);
  });

  it("keeps a real quiet-period 0.00 when facts are complete", () => {
    const hero = resolveTrustedRoasHero({
      mer: 0,
      sales: 0,
      spend: 650,
      factsIncomplete: false,
    });
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
    expect(hero.showMer).toBe(true);
    expect(hero.mer).toBe(2.4);
    expect(hero.hideUntrustedZero).toBe(false);
  });

  it("treats unknown coverage as incomplete so a dead 0.00 cannot paint", () => {
    const hero = resolveTrustedRoasHero({
      mer: 0,
      sales: 0,
      spend: 650,
      factsIncomplete: true,
    });
    expect(hero.showMer).toBe(false);
    expect(hero.heading).toMatch(/not 0\.00 ROAS/i);
  });

  it("never hides SAMPLE numbers", () => {
    const hero = resolveTrustedRoasHero({
      mer: 0,
      sales: 0,
      spend: 100,
      factsIncomplete: true,
      useSampleDesk: true,
    });
    expect(hero.hideUntrustedZero).toBe(false);
    expect(hero.mer).toBe(0);
  });
});
