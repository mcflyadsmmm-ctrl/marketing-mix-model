/**
 * Shopify App Pricing access rules.
 * Flat $39 after a 7-day trial. Not a GMV or usage price.
 * Trial reinstalls are Shopify's ledger (about 180 days). This module
 * does not record that a trial was used.
 */

export type FlatPartnerSubscription = {
  inTrial: boolean;
  /** ISO end of the paid cycle. Ignored while a trial is still running. */
  paidCycleEndsAt: string | null;
  cancelAtEndOfCycle: boolean;
  legacySubscriptionId: string | null;
};

export type PartnerView =
  | { status: "unconfigured" }
  | { status: "unavailable" }
  | { status: "none" }
  | ({ status: "flat" } & FlatPartnerSubscription);

export type AccessDecision = {
  /** When false, leave the shop cache and paid-cycle row unchanged. */
  persist: boolean;
  entitled: boolean;
  /** ISO timestamp to store, or null to drop the paid-cycle row. */
  paidCycleEndsAt: string | null;
  cancelAtEndOfCycle: boolean;
  legacySubscriptionId: string | null;
};

export function futureIso(
  iso: string | null | undefined,
  now: Date,
): string | null {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t) || t <= now.getTime()) return null;
  return new Date(t).toISOString();
}

/**
 * Uninstall stops the next cycle. A paid period still in the future stays.
 * A trial end is not a paid period, so a missing or past timestamp drops.
 */
export function uninstallKeepsPaidCycle(
  paidCycleEndsAt: string | null | undefined,
  now: Date,
): boolean {
  return futureIso(paidCycleEndsAt, now) != null;
}

export function decideSubscriptionAccess(input: {
  partner: PartnerView;
  legacyAdminActive: boolean;
  storedPaidCycleEndsAt: string | null;
  now: Date;
}): AccessDecision {
  const stored = futureIso(input.storedPaidCycleEndsAt, input.now);

  switch (input.partner.status) {
    case "unavailable":
    case "unconfigured":
      if (input.legacyAdminActive || stored) {
        return {
          persist: true,
          entitled: true,
          paidCycleEndsAt: stored,
          cancelAtEndOfCycle: stored != null,
          legacySubscriptionId: null,
        };
      }
      return {
        persist: false,
        entitled: false,
        paidCycleEndsAt: null,
        cancelAtEndOfCycle: false,
        legacySubscriptionId: null,
      };
    case "flat": {
      const paidEnd = input.partner.inTrial
        ? null
        : futureIso(input.partner.paidCycleEndsAt, input.now);
      return {
        persist: true,
        entitled: true,
        paidCycleEndsAt: paidEnd,
        cancelAtEndOfCycle: input.partner.cancelAtEndOfCycle,
        legacySubscriptionId: input.partner.legacySubscriptionId,
      };
    }
    case "none":
      if (input.legacyAdminActive || stored) {
        return {
          persist: true,
          entitled: true,
          paidCycleEndsAt: stored,
          cancelAtEndOfCycle: stored != null,
          legacySubscriptionId: null,
        };
      }
      return {
        persist: true,
        entitled: false,
        paidCycleEndsAt: null,
        cancelAtEndOfCycle: false,
        legacySubscriptionId: null,
      };
    default: {
      const _exhaustive: never = input.partner;
      throw new Error(`Unhandled partner status: ${JSON.stringify(_exhaustive)}`);
    }
  }
}
