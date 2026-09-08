/**
 * Period picker honesty — prefer windows the merchant can trust.
 * Wide periods with spend holes or incomplete sales inflate / hide Total ROAS.
 */

import type { PeriodPreset } from "./periods";
import { PRODUCT_NOUN } from "./product-labels";

export type PeriodTrustKind =
  | "trusted"
  | "sample"
  | "no_spend"
  | "spend_gaps"
  | "sales_incomplete"
  | "window_limited";

export type PeriodTrust = {
  kind: PeriodTrustKind;
  trusted: boolean;
  warning: string;
  suggestPreset: PeriodPreset | null;
  suggestLabel: string | null;
};

const WIDE_PRESETS: ReadonlySet<PeriodPreset> = new Set([
  "qtd",
  "ytd",
  "l12m",
  "y3",
]);

function shorterSuggest(preset: PeriodPreset): {
  preset: PeriodPreset;
  label: string;
} | null {
  if (!WIDE_PRESETS.has(preset)) return null;
  return { preset: "mtd", label: "Try MTD" };
}

/**
 * Trust for the *selected* period from already-loaded coverage.
 * Does not query other presets — suggest MTD when the current window is wide
 * and cannot be trusted.
 */
export function resolvePeriodTrust(input: {
  preset: PeriodPreset;
  hasSpend: boolean;
  spendIncomplete: boolean;
  salesFactsIncomplete: boolean;
  periodExceedsFactWindow: boolean;
  useSampleDesk?: boolean;
  shotMode?: boolean;
}): PeriodTrust {
  if (input.useSampleDesk || input.shotMode) {
    return {
      kind: "sample",
      trusted: true,
      warning: "",
      suggestPreset: null,
      suggestLabel: null,
    };
  }

  const shorter = shorterSuggest(input.preset);

  if (input.periodExceedsFactWindow) {
    return {
      kind: "window_limited",
      trusted: false,
      warning: `${PRODUCT_NOUN.totalRoas} for this period reaches past stored sales. Prefer a shorter window — the multiple cannot be trusted yet.`,
      suggestPreset: shorter?.preset ?? "mtd",
      suggestLabel: shorter?.label ?? "Try MTD",
    };
  }

  if (input.salesFactsIncomplete) {
    return {
      kind: "sales_incomplete",
      trusted: false,
      warning: `Shopify sales facts for this period are still filling. ${PRODUCT_NOUN.totalRoas} is not a trusted multiple until coverage is complete.`,
      suggestPreset: shorter?.preset ?? null,
      suggestLabel: shorter?.label ?? null,
    };
  }

  if (!input.hasSpend) {
    return {
      kind: "no_spend",
      trusted: false,
      warning: `No spend in this period — ${PRODUCT_NOUN.totalRoas} cannot run. Add daily spend or pick a period that has it.`,
      suggestPreset: shorter?.preset ?? null,
      suggestLabel: shorter?.label ?? null,
    };
  }

  if (input.spendIncomplete) {
    return {
      kind: "spend_gaps",
      trusted: false,
      warning: `Spend days are missing in this period. Empty days count as $0 spend, so ${PRODUCT_NOUN.totalRoas} looks better than cash.`,
      suggestPreset: shorter?.preset ?? null,
      suggestLabel: shorter?.label ?? null,
    };
  }

  return {
    kind: "trusted",
    trusted: true,
    warning: "",
    suggestPreset: null,
    suggestLabel: null,
  };
}
