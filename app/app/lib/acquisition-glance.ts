/**
 * Overview acquisition glance — aMER + new vs returning sales split.
 *
 * Reuses the same period figures the LTV card already runs on
 * (`newCustomerNetSales` / `returningCustomerNetSales` / `tillLtv.newBuyers`).
 * No new till math, no cohort work, no channel claims: aMER is an average
 * across all logged spend, never channel true ROAS.
 */

import { formatCurrency, formatMer } from "./mer-format";
import { PRODUCT_NOUN } from "./product-labels";
import { SAMPLE_MONEY_MARK } from "./cash-desk-copy";

/**
 * Customer-attributed sales must cover at least this share of period sales
 * before aMER is publishable. Guest checkouts and fact days written before the
 * customer split landed sit outside the numerator, so a thin split understates
 * aMER — fail closed rather than print a flattering-looking low multiple.
 */
export const ACQUISITION_SPLIT_MIN_COVERAGE = 0.5;

export type AcquisitionBlockedReason =
  | "spend_incomplete"
  | "spend_untrusted"
  | "backfilling"
  | "history_limited"
  | "no_spend"
  | "split_missing"
  | "split_thin";

export type AcquisitionGlanceBlocked = {
  available: false;
  reason: AcquisitionBlockedReason;
  /** Honest one-liner for the empty card — never "no data". */
  copy: string;
};

export type AcquisitionGlanceReady = {
  available: true;
  useSampleDesk: boolean;
  amer: number;
  amerLabel: string;
  newCustomerSales: number;
  returningCustomerSales: number;
  /** newCustomerSales + returningCustomerSales — the split denominator. */
  attributedSales: number;
  /** Period sales outside the split (guest checkouts, unfilled customer days). */
  unattributedSales: number;
  /** Share of attributed sales, 0–100. */
  newSharePct: number;
  returningSharePct: number;
  /** Unique new buyers behind Cash CAC — null when cohorts aren't ready. */
  newBuyers: number | null;
  headline: string;
  caveat: string;
  /** Split denominator disclosure — always rendered, never optional. */
  coverageLine: string;
  /** SAMPLE mark when the demo desk drove these numbers. */
  sampleNote: string | null;
};

export type AcquisitionGlance =
  | AcquisitionGlanceBlocked
  | AcquisitionGlanceReady;

export type AcquisitionGlanceInput = {
  /** Acquisition MER already computed for the desk (new-customer sales ÷ spend). */
  amer: number | null;
  newCustomerSales: number;
  returningCustomerSales: number;
  /** Action sales for the period — the split coverage denominator. */
  periodSales: number;
  totalSpend: number;
  periodLabel: string;
  /** Margin + spend trust gate from `buildDashboardMetrics`. */
  cashActionReady: boolean;
  spendIncomplete: boolean;
  salesFactsIncomplete: boolean;
  /** Period reaches past loaded order history (missing read_all_orders / fact window). */
  periodUncovered: boolean;
  /** `tillLtv.newBuyers` — only meaningful when cohorts are available. */
  newBuyers: number | null;
  useSampleDesk: boolean;
};

const NOT_CHANNEL_ROAS =
  "Average acquisition efficiency across all logged spend — not channel true ROAS.";

function blocked(
  reason: AcquisitionBlockedReason,
  copy: string,
): AcquisitionGlanceBlocked {
  return { available: false, reason, copy };
}

/**
 * Decide whether aMER and the new/returning split can be shown for this period.
 * Fail-closed order: spend trust → sales facts → history → split coverage.
 */
export function resolveAcquisitionGlance(
  input: AcquisitionGlanceInput,
): AcquisitionGlance {
  const period = input.periodLabel;

  if (input.spendIncomplete) {
    return blocked(
      "spend_incomplete",
      `Spend days are missing in ${period}. Empty days count as $0, so aMER would read high — fill the gaps on Spend first.`,
    );
  }

  if (!input.cashActionReady) {
    return blocked(
      "spend_untrusted",
      `Spend for ${period} isn’t trusted yet. aMER waits until logged spend coverage is ready.`,
    );
  }

  if (input.salesFactsIncomplete) {
    return blocked(
      "backfilling",
      `Shopify sales for ${period} are still backfilling. A partial numerator is not an honest acquisition multiple.`,
    );
  }

  if (input.periodUncovered) {
    return blocked(
      "history_limited",
      `${period} reaches past loaded order history. Grant deeper order access or pick a covered period — not permanently empty.`,
    );
  }

  if (
    !(input.totalSpend > 0) ||
    input.amer == null ||
    !Number.isFinite(input.amer)
  ) {
    return blocked(
      "no_spend",
      `Add daily spend for ${period} so new-customer sales ÷ spend can run.`,
    );
  }

  const newCustomerSales = Math.max(0, input.newCustomerSales);
  const returningCustomerSales = Math.max(0, input.returningCustomerSales);
  const attributedSales = newCustomerSales + returningCustomerSales;

  if (!(attributedSales > 0)) {
    return blocked(
      "split_missing",
      `New vs returning hasn’t landed for ${period} yet — order customer facts are still filling. Not broken.`,
    );
  }

  const periodSales = Math.max(0, input.periodSales);
  const coverage = periodSales > 0 ? attributedSales / periodSales : 1;
  if (coverage < ACQUISITION_SPLIT_MIN_COVERAGE) {
    return blocked(
      "split_thin",
      `New vs returning covers only ${Math.round(coverage * 100)}% of ${period} sales — too thin to publish aMER. Order customer facts are still filling.`,
    );
  }

  const amer = input.amer;
  const newSharePct = (newCustomerSales / attributedSales) * 100;
  const unattributedSales = Math.max(0, periodSales - attributedSales);
  const newBuyers =
    input.newBuyers != null && input.newBuyers > 0 ? input.newBuyers : null;

  const coverageLine =
    unattributedSales > 0
      ? `Split covers ${formatCurrency(attributedSales)} of ${formatCurrency(periodSales)} ${period} sales — ${formatCurrency(unattributedSales)} sits outside it (guest checkout, or days whose customer facts haven’t filled).`
      : `Split covers all ${formatCurrency(attributedSales)} of ${period} sales.`;

  return {
    available: true,
    useSampleDesk: input.useSampleDesk,
    amer,
    amerLabel: `${formatMer(amer)}×`,
    newCustomerSales,
    returningCustomerSales,
    attributedSales,
    unattributedSales,
    newSharePct,
    returningSharePct: 100 - newSharePct,
    newBuyers,
    headline: `Every $1 of ad spend sits next to $${amer.toFixed(2)} of new-customer sales.`,
    caveat: newBuyers
      ? `${NOT_CHANNEL_ROAS} ${newBuyers.toLocaleString()} new buyers this period — the same count behind Cash CAC.`
      : NOT_CHANNEL_ROAS,
    coverageLine,
    sampleNote: input.useSampleDesk ? SAMPLE_MONEY_MARK : null,
  };
}

/** Tile definition text — kept next to the resolver so copy stays reviewable. */
export const ACQUISITION_GLANCE_COPY = {
  title: "Acquisition efficiency",
  kicker: `${PRODUCT_NOUN.amer} · new vs returning sales`,
  amerLabel: PRODUCT_NOUN.amer,
  amerDef: PRODUCT_NOUN.amerDef,
  newLabel: "New-customer sales",
  returningLabel: "Returning sales",
  splitDef: "Share of customer-attributed sales (Level 1 order flags)",
} as const;
