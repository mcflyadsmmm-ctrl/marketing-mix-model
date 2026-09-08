/**
 * Monday-morning cash verdict — am I making money on ads this period?
 * Total ROAS, sales, spend, break-even. SAMPLE never reads as live money.
 */

import { formatCurrency, formatMer } from "./mer-format";
import { PRODUCT_NOUN } from "./product-labels";
import { SAMPLE_MONEY_MARK } from "./cash-desk-copy";

export type CashVerdictTone = "ok" | "warn" | "bad" | "blocked" | "sample";

export type CashVerdict = {
  tone: CashVerdictTone;
  headline: string;
  body: string;
};

/**
 * Instant answer for Overview when spend exists.
 * Does not hide untrusted 0.00 (that is the activation PR) — it only
 * states whether the merchant can act on the multiple this morning.
 */
export function resolveCashVerdict(input: {
  mer: number | null;
  sales: number;
  spend: number;
  breakEvenMer: number | null;
  spendIncomplete: boolean;
  salesFactsIncomplete: boolean;
  useSampleDesk?: boolean;
}): CashVerdict {
  if (input.useSampleDesk) {
    const merLabel =
      input.mer != null && Number.isFinite(input.mer)
        ? `${formatMer(input.mer)}×`
        : "—";
    return {
      tone: "sample",
      headline: `${SAMPLE_MONEY_MARK} · ${merLabel}`,
      body: `${PRODUCT_NOUN.totalRoas} here is practice. Tap Real store before you treat sales, spend, or break-even as live cash.`,
    };
  }

  if (!(input.spend > 0)) {
    return {
      tone: "blocked",
      headline: `${PRODUCT_NOUN.totalRoas} needs spend next to sales`,
      body: `Shopify sales are ${formatCurrency(input.sales)}. Add daily spend so sales ÷ spend can run.`,
    };
  }

  if (input.salesFactsIncomplete && !(input.sales > 0)) {
    return {
      tone: "blocked",
      headline: "Sales facts still loading — not a trusted multiple",
      body: `Spend is ${formatCurrency(input.spend)}. Wait for Shopify sales to finish filling, or pick a shorter period. A blank numerator is not a trusted multiple.`,
    };
  }

  if (input.spendIncomplete) {
    const merLabel =
      input.mer != null && Number.isFinite(input.mer)
        ? `${formatMer(input.mer)}×`
        : "—";
    return {
      tone: "warn",
      headline: `${merLabel} looks high — spend days are missing`,
      body: `Sales ${formatCurrency(input.sales)} ÷ spend ${formatCurrency(input.spend)}. Empty days count as $0 spend, so ${PRODUCT_NOUN.totalRoas} is inflated. Fill gaps before a budget move.`,
    };
  }

  if (input.mer == null || !Number.isFinite(input.mer)) {
    return {
      tone: "blocked",
      headline: `${PRODUCT_NOUN.totalRoas} is not ready`,
      body: `Sales ${formatCurrency(input.sales)} · spend ${formatCurrency(input.spend)}. Refresh Overview after facts land.`,
    };
  }

  const merLabel = `${formatMer(input.mer)}×`;
  const pair = `Sales ${formatCurrency(input.sales)} · spend ${formatCurrency(input.spend)}`;

  if (input.breakEvenMer != null && Number.isFinite(input.breakEvenMer)) {
    const be = `${formatMer(input.breakEvenMer)}×`;
    if (input.mer >= input.breakEvenMer) {
      return {
        tone: "ok",
        headline: `Yes — ads cleared break-even (${merLabel} vs ${be})`,
        body: `${pair}. ${PRODUCT_NOUN.totalRoas} is above break-even this period.`,
      };
    }
    return {
      tone: "bad",
      headline: `No — below break-even (${merLabel} vs ${be})`,
      body: `${pair}. Cut or shift spend before you scale. ${PRODUCT_NOUN.mondayCall}.`,
    };
  }

  return {
    tone: "warn",
    headline: `${merLabel} this period — confirm margin for break-even`,
    body: `${pair}. ${PRODUCT_NOUN.totalRoas} is live. Set profit margin in Settings so you can see if ads made money after contribution.`,
  };
}
