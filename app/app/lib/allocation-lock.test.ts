/**
 * Allocation hard-locks with a named reason. Never a softened recommendation,
 * never a cut sized off missing spend days or a sales numerator still filling.
 */
import { describe, expect, it } from "vitest";
import {
  resolveAllocationLock,
  type AllocationLockInput,
} from "./allocation-lock";
import { INCOMPLETE_BELOW_PCT } from "./mer-trust";

const TRUSTED: AllocationLockInput = {
  shotMode: false,
  salesError: false,
  salesUntrustedForAdvice: false,
  breakEvenMer: 3,
  cashActionReady: true,
  spendCoverage: {
    daysWithSpend: 8,
    daysInPeriod: 8,
    coveragePct: 100,
    incomplete: false,
  },
  totalSpend: 1000,
  periodLabel: "Last 7 days",
  periodPreset: "l7d",
};

function lockFor(overrides: Partial<AllocationLockInput>) {
  return resolveAllocationLock({ ...TRUSTED, ...overrides });
}

describe("resolveAllocationLock — unlocked", () => {
  it("does not lock when spend is trusted and margin is confirmed", () => {
    expect(resolveAllocationLock(TRUSTED)).toBeNull();
  });

  it("never paints a lock over listing capture", () => {
    expect(
      lockFor({
        shotMode: true,
        salesError: true,
        breakEvenMer: null,
        totalSpend: 0,
        salesUntrustedForAdvice: true,
      }),
    ).toBeNull();
  });
});

describe("resolveAllocationLock — reasons", () => {
  it("locks critical when sales did not load, and offers a retry on the period", () => {
    const lock = lockFor({ salesError: true });

    expect(lock?.reason).toBe("sales_error");
    expect(lock?.tone).toBe("critical");
    expect(lock?.headline).toMatch(/Sales didn’t load/);
    expect(lock?.headline).toContain("Last 7 days");
    expect(lock?.primaryCta).toEqual({
      label: "Retry",
      href: "/app/allocation?period=l7d",
    });
  });

  it("locks on an empty period instead of a $0 cut/keep card", () => {
    const lock = lockFor({ totalSpend: 0 });

    expect(lock?.reason).toBe("no_spend");
    expect(lock?.headline).toMatch(/No spend logged for Last 7 days/);
    expect(lock?.primaryCta.href).toBe("/app/spend");
    expect(lock?.body).toContain("50%-of-period keep floor");
  });

  it("locks until margin confirms break-even", () => {
    const lock = lockFor({ breakEvenMer: null });

    expect(lock?.reason).toBe("margin_unset");
    expect(lock?.headline).toMatch(/Set profit margin/);
    expect(lock?.body).toMatch(/contribution margin/i);
    expect(lock?.primaryCta.href).toBe("/app/settings");
  });

  it("names the coverage number and the missing days it needs", () => {
    const lock = lockFor({
      cashActionReady: false,
      spendCoverage: {
        daysWithSpend: 3,
        daysInPeriod: 10,
        coveragePct: 30,
        incomplete: true,
      },
    });

    expect(lock?.reason).toBe("spend_coverage");
    expect(lock?.headline).toContain("30%");
    expect(lock?.headline).toContain(`${INCOMPLETE_BELOW_PCT}%`);
    expect(lock?.body).toContain("3 of 10 closed days have spend");
    expect(lock?.body).toContain("missing 7 closed days");
    expect(lock?.primaryCta.href).toBe("/app/spend#mcfly-spend-uploads");
  });

  it("falls back to a plain spend-trust lock when coverage is not the flag", () => {
    const lock = lockFor({ cashActionReady: false });

    expect(lock?.reason).toBe("spend_trust");
    expect(lock?.headline).toMatch(/locked until spend trust is ready/i);
  });

  it("locks an untrusted $0 sales numerator without asking for more spend", () => {
    const lock = lockFor({ salesUntrustedForAdvice: true });

    expect(lock?.reason).toBe("sales_untrusted_zero");
    expect(lock?.headline).toMatch(/still loading/i);
    expect(lock?.secondaryCta?.href).toBe("/app/allocation?period=mtd");
  });
});

describe("resolveAllocationLock — one ask at a time", () => {
  it("asks for spend before margin, margin before coverage, coverage before sales", () => {
    expect(
      lockFor({ totalSpend: 0, breakEvenMer: null, cashActionReady: false })
        ?.reason,
    ).toBe("no_spend");
    expect(
      lockFor({
        breakEvenMer: null,
        cashActionReady: false,
        salesUntrustedForAdvice: true,
      })?.reason,
    ).toBe("margin_unset");
    expect(
      lockFor({
        cashActionReady: false,
        spendCoverage: {
          daysWithSpend: 3,
          daysInPeriod: 10,
          coveragePct: 30,
          incomplete: true,
        },
        salesUntrustedForAdvice: true,
      })?.reason,
    ).toBe("spend_coverage");
  });

  it("never sizes a cut inside a lock", () => {
    const locks = [
      lockFor({ salesError: true }),
      lockFor({ totalSpend: 0 }),
      lockFor({ breakEvenMer: null }),
      lockFor({
        cashActionReady: false,
        spendCoverage: {
          daysWithSpend: 3,
          daysInPeriod: 10,
          coveragePct: 30,
          incomplete: true,
        },
      }),
      lockFor({ salesUntrustedForAdvice: true }),
    ];

    for (const lock of locks) {
      expect(lock).not.toBeNull();
      expect(lock?.body).not.toMatch(/cut \d/i);
      expect(lock?.body).not.toMatch(/step-test ~?\d/i);
      expect(lock?.body).not.toMatch(/attribut|pixel|path credit/i);
    }
  });
});
