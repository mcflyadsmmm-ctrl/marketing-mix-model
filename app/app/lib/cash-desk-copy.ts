/**
 * Cold-merchant cash-desk copy — why each page matters, what to do next.
 * Total ROAS = Shopify sales ÷ spend the merchant added.
 * No pixels / MTA / brochure fog.
 */

import { PRODUCT_NOUN } from "./product-labels";

export const SAMPLE_MONEY_MARK =
  "SAMPLE — practice numbers, not live money";

export const CASH_PAGE_WHY = {
  spend:
    "Optional — add ad spend here when you want Total ROAS depth (Shopify sales ÷ what you spent). Days without spend count as $0.",
  goals:
    "A sales target tells you whether this period’s ads bought enough sales cash — next to Total ROAS, not instead of it.",
  allocation:
    "After you trust Total ROAS, this page shows hold / reduce / step-test advice so break-even is protected — sales ÷ spend, not channel attribution.",
  ltv: "Order cohorts show repeat revenue and buyer mix. Cash CAC appears when period spend is logged.",
  advanced:
    "Extra formulas after you trust Total ROAS. Skip this until sales ÷ spend is on the desk.",
} as const;

export type CashPageId = keyof typeof CASH_PAGE_WHY;

export const FIRST_TRUSTED_ROAS_GATE = {
  heading: "Cohorts work on sales — Total ROAS needs spend",
  body: "You can already read new vs returning and cohort payback from Shopify orders. Add one day of spend when you want Cash CAC and sales ÷ spend next to these cohorts.",
  primaryLabel: "Add spend for Cash CAC",
  primaryHref: "/app/spend",
  secondaryLabel: PRODUCT_NOUN.openTotalRoas,
  secondaryHref: "/app",
} as const;

export type FirstTrustedRoasGateCopy = {
  show: boolean;
  heading: string;
  body: string;
  primaryHref: string;
  primaryLabel: string;
  secondaryHref: string;
  secondaryLabel: string;
};

/**
 * Soft-gate only — never hide the route. Cold live merchants see the next
 * action; SAMPLE / shot / live spend stay on the page.
 */
export function resolveFirstTrustedRoasGate(input: {
  hasLiveSpend: boolean;
  useSampleDesk: boolean;
  shotMode?: boolean;
}): FirstTrustedRoasGateCopy {
  const show =
    !input.useSampleDesk && !input.shotMode && !input.hasLiveSpend;
  return {
    show,
    heading: FIRST_TRUSTED_ROAS_GATE.heading,
    body: FIRST_TRUSTED_ROAS_GATE.body,
    primaryHref: FIRST_TRUSTED_ROAS_GATE.primaryHref,
    primaryLabel: FIRST_TRUSTED_ROAS_GATE.primaryLabel,
    secondaryHref: FIRST_TRUSTED_ROAS_GATE.secondaryHref,
    secondaryLabel: FIRST_TRUSTED_ROAS_GATE.secondaryLabel,
  };
}

export type SpendCoverageImpact = {
  heading: string;
  body: string;
  nextLabel: string;
};

/**
 * The one sentence coverage holes are said in, everywhere. Holes are a cash
 * problem (“the multiple flatters you”), never a plumbing problem — nothing on
 * this desk syncs, so “sync broken” would be a lie as well as a scare.
 */
export const MISSING_DAYS_CASH_LINE = `Missing days make ${PRODUCT_NOUN.totalRoas} look better than cash`;

/** The cash line with the exact hole count behind it — softer tone, same math. */
export function missingDaysCashSentence(missingDays: number): string {
  const missing = Math.max(0, Math.floor(missingDays));
  const dayWord = missing === 1 ? "day" : "days";
  const verb = missing === 1 ? "counts" : "count";
  return `${MISSING_DAYS_CASH_LINE}: ${missing} closed ${dayWord} still ${verb} Shopify sales against $0 spend.`;
}

/**
 * “26 missing days” → plain-English Total ROAS impact + next action.
 */
export function formatMissingDaysRoasImpact(input: {
  missingDays: number;
  windowDays: number;
  periodLabel?: string;
}): SpendCoverageImpact {
  const missing = Math.max(0, Math.floor(input.missingDays));
  const window = Math.max(0, Math.floor(input.windowDays));
  const where = input.periodLabel?.trim() || "this window";

  if (missing <= 0) {
    return {
      heading: "Spend coverage is complete",
      body: `Every closed day in ${where} has spend. Total ROAS can be trusted as sales ÷ that spend.`,
      nextLabel: PRODUCT_NOUN.openTotalRoas,
    };
  }

  if (window > 0 && missing >= window) {
    return {
      heading: "No spend days yet — Total ROAS cannot run",
      body: `Add daily spend for ${where}. Until a day has spend, Total ROAS has nothing to divide Shopify sales by.`,
      nextLabel: "Download blank template",
    };
  }

  const dayWord = missing === 1 ? "day" : "days";
  return {
    heading: `${missing} ${dayWord} missing — Total ROAS looks better than cash`,
    body: `${missing} of ${window} closed days in ${where} have $0 spend. ${MISSING_DAYS_CASH_LINE} — those days still count Shopify sales, so the multiple reads above real spend. Download blanks for the missing days, fill, import.`,
    nextLabel: "Download blanks for missing days",
  };
}

export type LtvEmptyCashKind =
  | "no_timezone"
  | "history_limited"
  | "backfilling"
  | "pro_required"
  | "unknown";

export type LtvEmptyCashCopy = {
  heading: string;
  body: string;
  nextHref: string;
  nextLabel: string;
};

/**
 * Empty / backfill that explains what is arriving while preserving the value
 * already visible in Acquisition. Spend is deliberately not an empty reason:
 * cohorts can teach before the merchant logs any.
 */
export function ltvEmptyCashCopy(kind: LtvEmptyCashKind): LtvEmptyCashCopy {
  switch (kind) {
    case "no_timezone":
      return {
        heading: "Shop timezone needed",
        body: "Shopify hasn’t shared the local timezone needed to bucket first orders into cohorts.",
        nextHref: "/app",
        nextLabel: "Open Overview",
      };
    case "history_limited":
      return {
        heading: "Recent order window only",
        body: "Showing the recent ~60-day window. Grant deeper order access for older cohorts.",
        nextHref: "/app",
        nextLabel: "Open Overview",
      };
    case "backfilling":
      return {
        heading: "Cohorts are filling",
        body: "Grouping buyers by first order. New vs returning sales below update as facts land.",
        nextHref: "/app/ltv",
        nextLabel: "Refresh",
      };
    case "pro_required":
      return {
        heading: "Included on trial + $39",
        body: "Customer LTV ships with the 7-day trial and $39/month plan. SAMPLE is preview only.",
        nextHref: "/app",
        nextLabel: "Open Overview",
      };
    case "unknown":
      return {
        heading: "Cohorts are filling",
        body: "Cohort revenue appears once first-order facts are ready.",
        nextHref: "/app",
        nextLabel: "Open Overview",
      };
    default: {
      const _exhaustive: never = kind;
      return _exhaustive;
    }
  }
}

/** Explain a withheld Cash CAC without making spend a prerequisite for LTV. */
export function ltvCashCacTeaching(input: {
  hasPeriodSpend: boolean;
  hasNewBuyerCount: boolean;
}): string {
  if (!input.hasPeriodSpend) {
    return "Add period spend to calculate Cash CAC and LTV:CAC.";
  }
  if (!input.hasNewBuyerCount) {
    return "Spend is logged; a new-buyer count is still needed for Cash CAC.";
  }
  return "Blended · not platform CAC";
}

export function parseLtvEmptyKind(raw: string | null | undefined): LtvEmptyCashKind {
  switch (raw) {
    case "no_timezone":
    case "history_limited":
    case "backfilling":
    case "pro_required":
      return raw;
    default:
      return "unknown";
  }
}
