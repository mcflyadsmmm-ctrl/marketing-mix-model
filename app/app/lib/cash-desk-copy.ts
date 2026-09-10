/**
 * Cold-merchant cash-desk copy — why each page matters, what to do next.
 * Religion: Total ROAS = Shopify sales ÷ spend the merchant added.
 * No pixels / MTA / brochure fog.
 */

import { PRODUCT_NOUN } from "./product-labels";

export const SAMPLE_MONEY_MARK =
  "SAMPLE — practice numbers, not live money";

export const CASH_PAGE_WHY = {
  spend:
    "Total ROAS is Shopify sales ÷ the spend you add here. Missing days treat spend as $0, so the multiple looks better than cash.",
  goals:
    "A sales target tells you whether this period’s ads bought enough till cash — next to Total ROAS, not instead of it.",
  allocation:
    "After you trust Total ROAS, this page shows hold / reduce / step-test advice so break-even is protected — sales ÷ spend, not channel attribution.",
  ltv: "Shopify order cohorts show repeat revenue and buyer mix. Add spend only when you want Cash CAC and payback — opaque customer ids, no email CRM.",
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
  return `${MISSING_DAYS_CASH_LINE}: ${missing} closed ${dayWord} still count Shopify sales against $0 spend.`;
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
    body: `${missing} of ${window} closed days in ${where} have $0 spend. ${MISSING_DAYS_CASH_LINE} — those days still count Shopify sales, so the multiple reads above the till. Download blanks for the missing days, fill, import.`,
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
        body: "Shopify has not shared the local timezone needed to place first orders into cohorts. Acquisition above can still teach from sales and order facts; Mcfly uses no email CRM.",
        nextHref: "/app",
        nextLabel: "Open Overview",
      };
    case "history_limited":
      return {
        heading: "Recent order window only",
        body: "Shopify has shared the recent ~60-day order window. Acquisition above is useful now; grant deeper order access when you want older first-order cohorts. Mcfly uses opaque customer ids and order amounts only.",
        nextHref: "/app",
        nextLabel: "Open Overview",
      };
    case "backfilling":
      return {
        heading: "Cohorts are filling",
        body: "Shopify orders are being grouped by each buyer’s first order. Use Acquisition above for new vs returning sales and AOV now; 30d, 90d, and 365d cohort revenue appears as order facts land. Spend can wait.",
        nextHref: "/app/ltv",
        nextLabel: "Refresh LTV",
      };
    case "pro_required":
      return {
        heading: "LTV is on the $39 desk",
        body: "Customer LTV is included with the 7-day trial and $39 desk. Overview still gives you Shopify sales and order economics while cohort access is unavailable. SAMPLE is preview data only.",
        nextHref: "/app",
        nextLabel: "Open Overview",
      };
    case "unknown":
      return {
        heading: "LTV is filling",
        body: "Acquisition above can still teach from Shopify sales and order facts. Cohort revenue appears after first-order facts are ready; adding spend is optional until you want Cash CAC.",
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
  return "Blended till · not platform CAC";
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
