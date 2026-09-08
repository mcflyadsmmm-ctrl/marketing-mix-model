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
    "After you trust Total ROAS, this page says which channels to cut or keep so break-even is protected.",
  ltv: "Shows whether new customers pay back the spend you logged — depth next to that spend, not a science project.",
  advanced:
    "Extra formulas after you trust Total ROAS. Skip this until sales ÷ spend is on the desk.",
} as const;

export type CashPageId = keyof typeof CASH_PAGE_WHY;

export const FIRST_TRUSTED_ROAS_GATE = {
  heading: "First get Total ROAS",
  body: "This page pays off after Shopify sales sit next to spend you added. Download the blank template, fill one row per day, import — then come back.",
  primaryLabel: "Add spend first",
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
    body: `${missing} of ${window} closed days in ${where} have $0 spend. Those days still count sales, so Total ROAS is inflated. Download blanks for the missing days, fill, import.`,
    nextLabel: "Download blanks for missing days",
  };
}

export type LtvEmptyCashKind =
  | "no_timezone"
  | "history_limited"
  | "backfilling"
  | "pro_required"
  | "no_spend"
  | "unknown";

export type LtvEmptyCashCopy = {
  heading: string;
  body: string;
  nextHref: string;
  nextLabel: string;
};

/** Empty / backfill that does not read as a broken LTV desk. */
export function ltvEmptyCashCopy(kind: LtvEmptyCashKind): LtvEmptyCashCopy {
  switch (kind) {
    case "no_timezone":
      return {
        heading: "Shop timezone needed",
        body: "Customer cohorts bucket by local day. Refresh after Shopify shares the shop timezone — not broken.",
        nextHref: "/app/settings",
        nextLabel: "Open Settings",
      };
    case "history_limited":
      return {
        heading: "Recent order window only",
        body: "LTV uses the recent ~60-day window until deeper history is granted. Not permanently empty — Total ROAS on a short period still works.",
        nextHref: "/app",
        nextLabel: PRODUCT_NOUN.openTotalRoas,
      };
    case "backfilling":
      return {
        heading: "Cohorts are filling",
        body: "Lifetime value lights up as order facts land. This is backfill, not a broken desk. Total ROAS does not wait on LTV.",
        nextHref: "/app",
        nextLabel: PRODUCT_NOUN.openTotalRoas,
      };
    case "pro_required":
      return {
        heading: "LTV is a Pro depth view",
        body: "You can still read Total ROAS on Overview for $39/mo cash. Unlock LTV when you want payback next to that spend.",
        nextHref: "/app",
        nextLabel: PRODUCT_NOUN.openTotalRoas,
      };
    case "no_spend":
      return {
        heading: "Add spend before LTV pays off",
        body: "Cash CAC is period spend ÷ new customers. Without spend, this page has nothing to compare to Shopify sales.",
        nextHref: "/app/spend",
        nextLabel: "Add spend first",
      };
    case "unknown":
      return {
        heading: "LTV is filling",
        body: "Open Overview for sales ÷ spend. This page is depth next to that spend — not required for the first trusted Total ROAS.",
        nextHref: "/app",
        nextLabel: PRODUCT_NOUN.openTotalRoas,
      };
    default: {
      const _exhaustive: never = kind;
      return _exhaustive;
    }
  }
}

export function parseLtvEmptyKind(raw: string | null | undefined): LtvEmptyCashKind {
  switch (raw) {
    case "no_timezone":
    case "history_limited":
    case "backfilling":
    case "pro_required":
    case "no_spend":
      return raw;
    default:
      return "unknown";
  }
}
