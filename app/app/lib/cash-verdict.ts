/**
 * Monday-morning cash verdict — am I making money on ads this period?
 * Total ROAS, sales, spend, break-even. SAMPLE never reads as live money.
 * Blocked / warn / bad tones carry one next step a CEO can take.
 */

import { formatCurrency, formatMer } from "./mer-format";
import { PRODUCT_NOUN } from "./product-labels";
import { SAMPLE_MONEY_MARK } from "./cash-desk-copy";
import { SPEND_BILL_ANCHOR } from "./spend-first-run";

export type CashVerdictTone = "ok" | "warn" | "bad" | "blocked" | "sample";

export type CashVerdictAction = {
  label: string;
  href: string;
};

export type CashVerdict = {
  tone: CashVerdictTone;
  headline: string;
  body: string;
  /** One next step when the desk is blocked, incomplete, or below break-even. */
  nextAction: CashVerdictAction | null;
};

const BILL_HREF = `/app/spend#${SPEND_BILL_ANCHOR}`;

/**
 * Instant answer for Overview when spend exists.
 * Does not hide untrusted 0.00 — it only states whether the merchant can
 * act on the multiple this morning.
 */
export function cashVerdictSalesUntrusted(input: {
  salesFactsIncomplete: boolean;
  salesUntrustedZero?: boolean;
}): boolean {
  return input.salesFactsIncomplete || Boolean(input.salesUntrustedZero);
}

export function resolveCashVerdict(input: {
  mer: number | null;
  sales: number;
  spend: number;
  breakEvenMer: number | null;
  spendIncomplete: boolean;
  salesFactsIncomplete: boolean;
  /** Defense in depth — Overview must pass this even if incomplete is wrongly false. */
  salesUntrustedZero?: boolean;
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
      nextAction: { label: "Open Settings", href: "/app/settings" },
    };
  }

  if (!(input.spend > 0)) {
    return {
      tone: "blocked",
      headline: `${PRODUCT_NOUN.totalRoas} needs spend next to sales`,
      body: `Shopify sales are ${formatCurrency(input.sales)}. Spread one ad invoice across its days so sales ÷ spend can run.`,
      nextAction: {
        label: PRODUCT_NOUN.setupSpreadBill,
        href: BILL_HREF,
      },
    };
  }

  if (cashVerdictSalesUntrusted(input) && !(input.sales > 0)) {
    return {
      tone: "blocked",
      headline: "Sales facts still loading — not a trusted multiple",
      body: `Spend is ${formatCurrency(input.spend)}. Wait for Shopify sales to finish filling, or pick a shorter period. A blank numerator is not a trusted multiple.`,
      nextAction: { label: "Try MTD", href: "/app?period=mtd" },
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
      nextAction: {
        label: PRODUCT_NOUN.setupSpreadBill,
        href: BILL_HREF,
      },
    };
  }

  if (input.mer == null || !Number.isFinite(input.mer)) {
    return {
      tone: "blocked",
      headline: `${PRODUCT_NOUN.totalRoas} is not ready`,
      body: `Sales ${formatCurrency(input.sales)} · spend ${formatCurrency(input.spend)}. Refresh Overview after facts land.`,
      nextAction: null,
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
        nextAction: null,
      };
    }
    return {
      tone: "bad",
      headline: `No — below break-even (${merLabel} vs ${be})`,
      body: `${pair}. Cut or shift spend before you scale. ${PRODUCT_NOUN.mondayCall}.`,
      nextAction: {
        label: `Open ${PRODUCT_NOUN.spendAllocation}`,
        href: "/app/allocation",
      },
    };
  }

  return {
    tone: "warn",
    headline: `${merLabel} this period — confirm margin for break-even`,
    body: `${pair}. ${PRODUCT_NOUN.totalRoas} is live. Set profit margin in Settings so you can see if ads made money after contribution.`,
    nextAction: {
      label: PRODUCT_NOUN.setupAdjustMargin,
      href: "/app/settings",
    },
  };
}
