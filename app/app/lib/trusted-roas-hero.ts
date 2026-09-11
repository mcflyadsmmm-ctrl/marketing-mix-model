/**
 * Trusted Total ROAS hero — never paint 0.00 as “ads don’t work”
 * when Shopify sales facts have not landed yet, or the selected
 * period is wider than loaded history.
 *
 * Cash religion: Total ROAS = sales ÷ spend. A $0 sales numerator is only
 * trusted when the selected period’s closed-day facts are complete.
 */

export type TrustedRoasHeroKind =
  | "trusted"
  | "wait_backfill"
  | "pick_covered_period";

export const UNTRUSTED_ZERO_ROAS_COPY = {
  heading: "Not 0.00 — sales for this period are still loading",
  body: "Your spend is on the desk. Shopify sales facts for this period have not finished. Refresh, or open MTD. Total ROAS is sales ÷ that spend — not ads failing.",
  periodHeading: "This period isn’t covered yet — not 0.00 ROAS",
  periodBody:
    "This range is wider than loaded sales history. Open MTD for a trusted number now. Grant deeper order history if you need QTD / YTD.",
  refreshLabel: "Refresh Overview",
  mtdLabel: "Open MTD",
} as const;

export type TrustedRoasHero = {
  kind: TrustedRoasHeroKind;
  /** When false, hide the numeric Total ROAS (pass mer=null to the gauge). */
  showMer: boolean;
  mer: number | null;
  hideUntrustedZero: boolean;
  heading: string;
  body: string;
  primaryHref: string;
  primaryLabel: string;
  secondaryHref: string;
  secondaryLabel: string;
};

/** formatMer shows two decimals — 0.004 paints as 0.00. */
export function merLooksLikeZero(mer: number | null): boolean {
  return mer == null || !Number.isFinite(mer) || mer < 0.005;
}

function uncoveredZero(input: {
  mer: number | null;
  sales: number;
  spend: number;
  useSampleDesk?: boolean;
}): boolean {
  if (input.useSampleDesk) return false;
  if (!(input.spend > 0)) return false;
  if (input.sales > 0 && !merLooksLikeZero(input.mer)) return false;
  return true;
}

const TRUSTED: TrustedRoasHero = {
  kind: "trusted",
  showMer: true,
  mer: null,
  hideUntrustedZero: false,
  heading: "",
  body: "",
  primaryHref: "/app/spend",
  primaryLabel: "Update spend",
  secondaryHref: "/app?period=mtd",
  secondaryLabel: UNTRUSTED_ZERO_ROAS_COPY.mtdLabel,
};

/**
 * Hide a dead 0.00 when spend exists but the period is uncovered or
 * closed-day sales coverage is missing. SAMPLE and complete-coverage
 * $0 sales (a real quiet period) stay numeric.
 */
export function resolveTrustedRoasHero(input: {
  mer: number | null;
  sales: number;
  spend: number;
  factsIncomplete: boolean;
  /** Period wider than loaded history (fact window or ~60d without scope). */
  periodUncovered?: boolean;
  useSampleDesk?: boolean;
  /** Current desk preset — refresh stays on this period. */
  periodPreset?: string;
}): TrustedRoasHero {
  const preset = input.periodPreset || "mtd";
  const refreshHref = `/app?period=${preset}`;

  if (uncoveredZero(input) && input.periodUncovered) {
    return {
      kind: "pick_covered_period",
      showMer: false,
      mer: null,
      hideUntrustedZero: true,
      heading: UNTRUSTED_ZERO_ROAS_COPY.periodHeading,
      body: UNTRUSTED_ZERO_ROAS_COPY.periodBody,
      primaryHref: "/app?period=mtd",
      primaryLabel: UNTRUSTED_ZERO_ROAS_COPY.mtdLabel,
      secondaryHref: refreshHref,
      secondaryLabel: UNTRUSTED_ZERO_ROAS_COPY.refreshLabel,
    };
  }

  if (uncoveredZero(input) && input.factsIncomplete) {
    return {
      kind: "wait_backfill",
      showMer: false,
      mer: null,
      hideUntrustedZero: true,
      heading: UNTRUSTED_ZERO_ROAS_COPY.heading,
      body: UNTRUSTED_ZERO_ROAS_COPY.body,
      primaryHref: refreshHref,
      primaryLabel: UNTRUSTED_ZERO_ROAS_COPY.refreshLabel,
      secondaryHref: "/app?period=mtd",
      secondaryLabel: UNTRUSTED_ZERO_ROAS_COPY.mtdLabel,
    };
  }

  return {
    ...TRUSTED,
    mer: input.mer,
  };
}

/**
 * When the numeric Total ROAS hero may paint. Empty period spend, loading
 * zeros, and untrusted $0 must not hero `0.00×` — SAMPLE / listing shots
 * keep Harbor practice numbers so the stamp stays the honesty layer.
 */
export function shouldHeroNumericRoas(input: {
  hideUntrustedZero: boolean;
  periodSpend: number;
  useSampleDesk?: boolean;
  shotMode?: boolean;
}): boolean {
  if (input.hideUntrustedZero) return false;
  if (input.useSampleDesk || input.shotMode) return true;
  return input.periodSpend > 0;
}
