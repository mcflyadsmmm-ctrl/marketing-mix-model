/**
 * Trusted Total ROAS hero — never paint 0.00 as “ads don’t work”
 * when Shopify sales facts have not landed yet.
 *
 * Cash religion: Total ROAS = sales ÷ spend. A $0 sales numerator is only
 * trusted when the selected period’s closed-day facts are complete.
 */

export const UNTRUSTED_ZERO_ROAS_COPY = {
  heading: "Sales facts still loading — not 0.00 ROAS",
  body: "Spend is on the desk. Shopify sales for this period have not finished backfilling, so Total ROAS is not a trusted multiple yet. Refresh in a minute, or pick a shorter period while facts fill.",
  refreshLabel: "Refresh Overview",
} as const;

export type TrustedRoasHero = {
  /** When false, hide the numeric Total ROAS (pass mer=null to the gauge). */
  showMer: boolean;
  mer: number | null;
  hideUntrustedZero: boolean;
  heading: string;
  body: string;
};

/**
 * Hide a dead 0.00 when spend exists but closed-day sales coverage is missing.
 * SAMPLE and complete-coverage $0 sales (a real quiet period) stay numeric.
 */
export function resolveTrustedRoasHero(input: {
  mer: number | null;
  sales: number;
  spend: number;
  factsIncomplete: boolean;
  useSampleDesk?: boolean;
}): TrustedRoasHero {
  const hideUntrustedZero =
    !input.useSampleDesk &&
    input.factsIncomplete &&
    input.spend > 0 &&
    !(input.sales > 0);

  if (hideUntrustedZero) {
    return {
      showMer: false,
      mer: null,
      hideUntrustedZero: true,
      heading: UNTRUSTED_ZERO_ROAS_COPY.heading,
      body: UNTRUSTED_ZERO_ROAS_COPY.body,
    };
  }

  return {
    showMer: true,
    mer: input.mer,
    hideUntrustedZero: false,
    heading: "",
    body: "",
  };
}
