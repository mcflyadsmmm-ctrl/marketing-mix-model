/**
 * One blocking answer for /app/allocation, with the reason spelled out.
 *
 * A cut/keep call needs three things: cash in the period, a confirmed margin so
 * break-even exists, and spend coverage that does not flatter the average. When
 * any of them is missing the page hard-locks — it never softens the
 * recommendation, and it never sizes a cut off a sales numerator that is still
 * filling (an untrusted $0 is not "below break-even").
 */

import { ALLOCATION_KEEP_PCT } from "./allocation-recommendation";
import {
  formatSpendCoverageLine,
  INCOMPLETE_BELOW_PCT,
  type SpendPeriodCoverage,
} from "./mer-trust";
import { PRODUCT_NOUN } from "./product-labels";
import { UNTRUSTED_ZERO_ROAS_COPY } from "./trusted-roas-hero";

export type AllocationLockReason =
  | "sales_error"
  | "no_spend"
  | "margin_unset"
  | "spend_coverage"
  | "spend_trust"
  | "sales_untrusted_zero";

export type AllocationLockCta = {
  label: string;
  href: string;
};

export type AllocationLock = {
  reason: AllocationLockReason;
  tone: "critical" | "warn";
  /** aria-label for the locked section. */
  label: string;
  headline: string;
  body: string;
  primaryCta: AllocationLockCta;
  secondaryCta: AllocationLockCta | null;
};

export type AllocationLockInput = {
  /** Listing capture never paints locks over the desk. */
  shotMode: boolean;
  salesError: boolean;
  salesUntrustedForAdvice: boolean;
  breakEvenMer: number | null;
  cashActionReady: boolean;
  spendCoverage: SpendPeriodCoverage;
  totalSpend: number;
  periodLabel: string;
  periodPreset: string;
};

function dayWord(count: number): string {
  return count === 1 ? "day" : "days";
}

/**
 * Earliest missing input wins — spend, then margin, then coverage, then the
 * sales numerator. One ask at a time, in the order a merchant can fix them.
 */
export function resolveAllocationLock(
  input: AllocationLockInput,
): AllocationLock | null {
  if (input.shotMode) return null;

  const period = `/app/allocation?period=${input.periodPreset}`;

  if (input.salesError) {
    return {
      reason: "sales_error",
      tone: "critical",
      label: "Allocation locked — sales did not load",
      headline: `Sales didn’t load — no cut or keep call for ${input.periodLabel}`,
      body: `${PRODUCT_NOUN.spendAllocation} reads ${PRODUCT_NOUN.totalRoas} from sales ÷ spend. Retry the period — a missing numerator is not a reason to cut.`,
      primaryCta: { label: "Retry", href: period },
      secondaryCta: {
        label: `View ${PRODUCT_NOUN.deskTitle}`,
        href: `/app?period=${input.periodPreset}`,
      },
    };
  }

  if (!(input.totalSpend > 0)) {
    return {
      reason: "no_spend",
      tone: "warn",
      label: "Allocation locked — no spend in this period",
      headline: `No spend logged for ${input.periodLabel} — nothing to cut or keep`,
      body: `${PRODUCT_NOUN.totalRoas} is sales ÷ spend, so a cut/keep call needs cash in the period. Log daily spend and the call sizes itself against the ${ALLOCATION_KEEP_PCT}%-of-period keep floor.`,
      primaryCta: { label: PRODUCT_NOUN.setupAddSpend, href: "/app/spend" },
      secondaryCta: null,
    };
  }

  if (input.breakEvenMer == null) {
    return {
      reason: "margin_unset",
      tone: "warn",
      label: "Allocation locked — break-even margin required",
      headline: `Set profit margin so ${PRODUCT_NOUN.breakEvenTotalRoas} can lock`,
      body: `Cut or keep is decided against break-even, and break-even comes from your contribution margin. Without it there is no line to protect. ${PRODUCT_NOUN.mondayCall}.`,
      primaryCta: { label: "Open Settings", href: "/app/settings" },
      secondaryCta: null,
    };
  }

  if (!input.cashActionReady) {
    if (input.spendCoverage.incomplete) {
      const missing = Math.max(
        0,
        input.spendCoverage.daysInPeriod - input.spendCoverage.daysWithSpend,
      );
      return {
        reason: "spend_coverage",
        tone: "warn",
        label: "Allocation locked — spend coverage incomplete",
        headline: `Spend coverage is ${input.spendCoverage.coveragePct}% — under ${INCOMPLETE_BELOW_PCT}%`,
        body: `${formatSpendCoverageLine(input.spendCoverage, input.periodLabel)}. Empty days count Shopify sales against $0 spend, so ${PRODUCT_NOUN.totalRoas} reads better than cash and a cut sized off it would be wrong. Fill the missing ${missing} closed ${dayWord(missing)} to unlock the call.`,
        primaryCta: {
          label: "Fill spend holes",
          href: "/app/spend#mcfly-spend-uploads",
        },
        secondaryCta: {
          label: `View ${PRODUCT_NOUN.deskTitle}`,
          href: `/app?period=${input.periodPreset}`,
        },
      };
    }
    return {
      reason: "spend_trust",
      tone: "warn",
      label: "Allocation locked until spend trust is ready",
      headline: `Allocation is locked until spend trust is ready`,
      body: `${formatSpendCoverageLine(input.spendCoverage, input.periodLabel)}. Finish the spend side, then this page states the cut or keep. ${PRODUCT_NOUN.mondayCall}.`,
      primaryCta: { label: "Fill spend holes", href: "/app/spend" },
      secondaryCta: null,
    };
  }

  if (input.salesUntrustedForAdvice) {
    return {
      reason: "sales_untrusted_zero",
      tone: "warn",
      label: "Allocation locked — sales facts still loading",
      headline: UNTRUSTED_ZERO_ROAS_COPY.heading,
      body: `Your spend is on the desk, so ${PRODUCT_NOUN.spendAllocation} stays locked until the sales side of sales ÷ spend lands. A blank numerator is not a below-break-even call — no cut, no keep, off 0.00×.`,
      primaryCta: {
        label: `Refresh ${PRODUCT_NOUN.spendAllocation}`,
        href: period,
      },
      secondaryCta: {
        label: UNTRUSTED_ZERO_ROAS_COPY.mtdLabel,
        href: "/app/allocation?period=mtd",
      },
    };
  }

  return null;
}
