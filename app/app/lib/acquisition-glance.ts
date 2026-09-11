/**
 * Overview acquisition glance — new vs returning sales split.
 * aMER is optional depth when spend is trusted (never blocks the split).
 */

import { formatCurrency, formatMer } from "./mer-format";
import { PRODUCT_NOUN } from "./product-labels";
import { SAMPLE_MONEY_MARK } from "./cash-desk-copy";

/**
 * Customer-attributed sales must cover at least this share of period sales
 * before the split is publishable.
 */
export const ACQUISITION_SPLIT_MIN_COVERAGE = 0.5;

export type AcquisitionBlockedReason =
  | "backfilling"
  | "history_limited"
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
  /** Null when spend isn't trusted yet — split still shows. */
  amer: number | null;
  amerLabel: string | null;
  newCustomerSales: number;
  returningCustomerSales: number;
  attributedSales: number;
  unattributedSales: number;
  newSharePct: number;
  returningSharePct: number;
  newBuyers: number | null;
  headline: string;
  caveat: string | null;
  coverageLine: string | null;
  sampleNote: string | null;
};

export type AcquisitionGlance =
  | AcquisitionGlanceBlocked
  | AcquisitionGlanceReady;

export type AcquisitionGlanceInput = {
  amer: number | null;
  newCustomerSales: number;
  returningCustomerSales: number;
  periodSales: number;
  totalSpend: number;
  periodLabel: string;
  cashActionReady: boolean;
  spendIncomplete: boolean;
  salesFactsIncomplete: boolean;
  periodUncovered: boolean;
  newBuyers: number | null;
  useSampleDesk: boolean;
};

function blocked(
  reason: AcquisitionBlockedReason,
  copy: string,
): AcquisitionGlanceBlocked {
  return { available: false, reason, copy };
}

/**
 * Show new vs returning whenever the split is honest.
 * aMER appears only when spend is trusted — spend never blanks the card.
 */
export function resolveAcquisitionGlance(
  input: AcquisitionGlanceInput,
): AcquisitionGlance {
  const period = input.periodLabel;

  if (input.salesFactsIncomplete) {
    return blocked(
      "backfilling",
      `Shopify sales for ${period} are still backfilling. The customer split waits on complete facts.`,
    );
  }

  if (input.periodUncovered) {
    return blocked(
      "history_limited",
      `${period} reaches past loaded order history. Grant deeper order access or pick a covered period — not permanently empty.`,
    );
  }

  const newCustomerSales = Math.max(0, input.newCustomerSales);
  const returningCustomerSales = Math.max(0, input.returningCustomerSales);
  const attributedSales = newCustomerSales + returningCustomerSales;

  if (!(attributedSales > 0)) {
    return blocked(
      "split_missing",
      `New vs returning hasn’t landed for ${period} yet — order customer facts are still filling.`,
    );
  }

  const periodSales = Math.max(0, input.periodSales);
  const coverage = periodSales > 0 ? attributedSales / periodSales : 1;
  if (coverage < ACQUISITION_SPLIT_MIN_COVERAGE) {
    return blocked(
      "split_thin",
      `New vs returning covers only ${Math.round(coverage * 100)}% of ${period} sales — too thin to publish. Order customer facts are still filling.`,
    );
  }

  const newSharePct = (newCustomerSales / attributedSales) * 100;
  const unattributedSales = Math.max(0, periodSales - attributedSales);
  const newBuyers =
    input.newBuyers != null && input.newBuyers > 0 ? input.newBuyers : null;

  const spendTrusted =
    input.cashActionReady &&
    !input.spendIncomplete &&
    input.totalSpend > 0 &&
    input.amer != null &&
    Number.isFinite(input.amer);

  const amer = spendTrusted ? input.amer : null;
  const amerLabel = amer != null ? `${formatMer(amer)}×` : null;

  const headline =
    amer != null
      ? `Every $1 of ad spend sits next to $${amer.toFixed(2)} of new-customer sales.`
      : `${Math.round(newSharePct)}% new · ${Math.round(100 - newSharePct)}% returning this period.`;

  const caveat =
    amer != null
      ? newBuyers
        ? `Average acquisition efficiency across logged spend — not channel ROAS. ${newBuyers.toLocaleString()} new buyers this period.`
        : "Average acquisition efficiency across logged spend — not channel ROAS."
      : null;

  const coverageLine =
    unattributedSales > 0
      ? `${formatCurrency(attributedSales)} of ${formatCurrency(periodSales)} sales attributed to customers.`
      : null;

  return {
    available: true,
    useSampleDesk: input.useSampleDesk,
    amer,
    amerLabel,
    newCustomerSales,
    returningCustomerSales,
    attributedSales,
    unattributedSales,
    newSharePct,
    returningSharePct: 100 - newSharePct,
    newBuyers,
    headline,
    caveat,
    coverageLine,
    sampleNote: input.useSampleDesk ? SAMPLE_MONEY_MARK : null,
  };
}

export const ACQUISITION_GLANCE_COPY = {
  title: "New vs returning",
  kicker: "Customer sales split from Shopify orders",
  amerLabel: PRODUCT_NOUN.amer,
  amerDef: PRODUCT_NOUN.amerDef,
  newLabel: "New-customer sales",
  returningLabel: "Returning sales",
  splitDef: "Share of customer-attributed sales",
} as const;
