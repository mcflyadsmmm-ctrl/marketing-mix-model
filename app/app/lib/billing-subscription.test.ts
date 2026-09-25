import { describe, expect, it } from "vitest";
import {
  decideSubscriptionAccess,
  uninstallKeepsPaidCycle,
  type PartnerView,
} from "./billing-subscription";

const NOW = new Date("2026-09-24T00:00:00.000Z");
const FUTURE = "2026-10-24T00:00:00.000Z";
const PAST = "2026-08-01T00:00:00.000Z";

function flat(overrides: Partial<Extract<PartnerView, { status: "flat" }>> = {}): PartnerView {
  return {
    status: "flat",
    inTrial: false,
    paidCycleEndsAt: FUTURE,
    cancelAtEndOfCycle: false,
    legacySubscriptionId: null,
    ...overrides,
  };
}

describe("decideSubscriptionAccess", () => {
  it("entitles a flat trial and does not store the trial end as a paid cycle", () => {
    const decision = decideSubscriptionAccess({
      partner: flat({ inTrial: true, paidCycleEndsAt: FUTURE }),
      legacyAdminActive: false,
      storedPaidCycleEndsAt: null,
      now: NOW,
    });
    expect(decision).toMatchObject({
      persist: true,
      entitled: true,
      paidCycleEndsAt: null,
    });
  });

  it("stores the paid cycle end for a flat $39-style contract", () => {
    const decision = decideSubscriptionAccess({
      partner: flat(),
      legacyAdminActive: false,
      storedPaidCycleEndsAt: null,
      now: NOW,
    });
    expect(decision.persist).toBe(true);
    expect(decision.entitled).toBe(true);
    expect(decision.paidCycleEndsAt).toBe(new Date(FUTURE).toISOString());
  });

  it("keeps a paid period after the contract is gone", () => {
    const decision = decideSubscriptionAccess({
      partner: { status: "none" },
      legacyAdminActive: false,
      storedPaidCycleEndsAt: FUTURE,
      now: NOW,
    });
    expect(decision).toMatchObject({
      persist: true,
      entitled: true,
      cancelAtEndOfCycle: true,
      paidCycleEndsAt: new Date(FUTURE).toISOString(),
    });
  });

  it("drops a paid period that has already ended", () => {
    const decision = decideSubscriptionAccess({
      partner: { status: "none" },
      legacyAdminActive: false,
      storedPaidCycleEndsAt: PAST,
      now: NOW,
    });
    expect(decision).toMatchObject({
      persist: true,
      entitled: false,
      paidCycleEndsAt: null,
    });
  });

  it("does not wipe the cache when Partner credentials are missing and Admin shows no contract", () => {
    const decision = decideSubscriptionAccess({
      partner: { status: "unconfigured" },
      legacyAdminActive: false,
      storedPaidCycleEndsAt: null,
      now: NOW,
    });
    expect(decision.persist).toBe(false);
  });

  it("does not wipe the cache when the Partner API is down and nothing is stored", () => {
    const decision = decideSubscriptionAccess({
      partner: { status: "unavailable" },
      legacyAdminActive: false,
      storedPaidCycleEndsAt: null,
      now: NOW,
    });
    expect(decision.persist).toBe(false);
    expect(decision.entitled).toBe(false);
  });

  it("applies a stored paid period when Partner credentials are missing", () => {
    const decision = decideSubscriptionAccess({
      partner: { status: "unconfigured" },
      legacyAdminActive: false,
      storedPaidCycleEndsAt: FUTURE,
      now: NOW,
    });
    expect(decision).toMatchObject({
      persist: true,
      entitled: true,
      paidCycleEndsAt: new Date(FUTURE).toISOString(),
    });
  });

  it("keeps a scheduled cancel entitled until the paid cycle ends", () => {
    const decision = decideSubscriptionAccess({
      partner: flat({ cancelAtEndOfCycle: true }),
      legacyAdminActive: false,
      storedPaidCycleEndsAt: null,
      now: NOW,
    });
    expect(decision.entitled).toBe(true);
    expect(decision.cancelAtEndOfCycle).toBe(true);
    expect(decision.paidCycleEndsAt).toBe(new Date(FUTURE).toISOString());
  });
});

describe("uninstallKeepsPaidCycle", () => {
  it("keeps a future paid end and drops a trial-sized missing end", () => {
    expect(uninstallKeepsPaidCycle(FUTURE, NOW)).toBe(true);
    expect(uninstallKeepsPaidCycle(PAST, NOW)).toBe(false);
    expect(uninstallKeepsPaidCycle(null, NOW)).toBe(false);
  });
});
