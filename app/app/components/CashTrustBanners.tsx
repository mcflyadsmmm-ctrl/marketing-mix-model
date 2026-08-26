/**
 * Light Total ROAS trust banners — coverage, recon, below-BE habit, mock guard,
 * optional margin stale. Fail-closed only (no sales-basis info card).
 * Polaris chrome only; keep out of the Apps Script scoreboard island.
 * Below-BE habit only when caller passes belowBreakEven (cashActionReady).
 */

import type { SpendPeriodCoverage, SpendReconResult } from "../lib/mer-trust";
import {
  formatSpendCoverageLine,
  formatSpendReconLine,
} from "../lib/mer-trust";
import { formatCurrency, formatMer } from "../lib/mer-format";
import { salesFactsIncompleteMessage } from "../lib/cash-trust-copy";
import { PRODUCT_NOUN } from "../lib/product-labels";

type Props = {
  blockedMockAsLive: boolean;
  spendCoverage: SpendPeriodCoverage | null;
  periodLabel: string;
  /** Live Shopify (not sample) + period wider than ~60d SalesDayFact / read_orders window. */
  shopifyOrderWindowLimited?: boolean;
  /**
   * Stored SalesDayFact coverage incomplete inside the fact window — desk serves
   * facts only (no unbounded live crawl); disclose partial closed-day coverage.
   */
  salesFactsIncomplete?: {
    factDays: number;
    expectedClosedDays: number;
  } | null;
  /**
   * Open-day (today) live top-up hit the page cap (≤100 orders) — may undercount
   * today's sales until the day closes into SalesDayFact.
   */
  todaySalesTruncated?: boolean;
  /** Open-day live top-up failed — closed-day facts may still be shown. */
  todaySalesUnavailable?: boolean;
  shotMode?: boolean;
  /** When false, finish setup before acting on budget advice. */
  cashActionReady?: boolean;
  /** Ads Manager ±X% recon — independent of margin. */
  spendRecon?: SpendReconResult | null;
  /**
   * Below break-even habit — ONLY when margin known.
   * Pass null / omit when margin unconfirmed so this never fires.
   */
  belowBreakEven?: {
    mer: number | null;
    breakEvenMer: number;
    totalSpend: number;
  } | null;
  /** Soft warning — marginConfirmedAt older than 90 days. */
  marginStale?: boolean;
  /** Cold-path next step when advice is locked (margin / spend missing). */
  onboarding?: { settingsSaved: boolean; hasSpend: boolean } | null;
};

export function CashTrustBanners({
  blockedMockAsLive,
  spendCoverage,
  periodLabel,
  shopifyOrderWindowLimited = false,
  salesFactsIncomplete = null,
  todaySalesTruncated = false,
  todaySalesUnavailable = false,
  shotMode = false,
  cashActionReady = true,
  spendRecon = null,
  belowBreakEven = null,
  marginStale = false,
  onboarding = null,
}: Props) {
  if (shotMode) return null;

  const showBelowBe =
    belowBreakEven != null &&
    belowBreakEven.totalSpend > 0 &&
    belowBreakEven.breakEvenMer > 0 &&
    belowBreakEven.mer != null &&
    Number.isFinite(belowBreakEven.mer) &&
    belowBreakEven.mer < belowBreakEven.breakEvenMer;

  const salesFactsCopy =
    salesFactsIncomplete &&
    salesFactsIncomplete.expectedClosedDays > 0 &&
    !shopifyOrderWindowLimited
      ? salesFactsIncompleteMessage({
          factDays: salesFactsIncomplete.factDays,
          expectedClosedDays: salesFactsIncomplete.expectedClosedDays,
          periodLabel,
        })
      : null;

  return (
    <>
      {blockedMockAsLive ? (
        <s-banner tone="critical" heading="Mock sales blocked">
          <s-paragraph>
            Fabricated sales were refused — {PRODUCT_NOUN.totalRoas} never treats
            mock numbers as live Shopify when the sample desk is off. Retry the
            sales pull, or switch to Practice at the top for a labeled walkthrough.
          </s-paragraph>
        </s-banner>
      ) : null}

      {shopifyOrderWindowLimited ? (
        <s-banner tone="info" heading="Sales history limited for this period">
          <s-paragraph>
            {periodLabel} reaches before stored daily sales (back to Jan 1 four
            years ago). Prefer a shorter period, wait for backfill, or switch to
            Practice at the top for a multi-year walkthrough.
          </s-paragraph>
        </s-banner>
      ) : null}

      {salesFactsCopy ? (
        <s-banner tone="info" heading={salesFactsCopy.heading}>
          <s-paragraph>{salesFactsCopy.body}</s-paragraph>
        </s-banner>
      ) : null}

      {todaySalesTruncated ? (
        <s-banner tone="warning" heading="Today’s sales may be incomplete">
          <s-paragraph>
            Live today is capped at ~100 orders for a fast desk load. High-volume
            shops can undercount today until the day closes into stored sales
            facts. Closed days in {periodLabel} are unaffected.
          </s-paragraph>
        </s-banner>
      ) : null}

      {todaySalesUnavailable && !todaySalesTruncated ? (
        <s-banner tone="warning" heading="Today’s sales unavailable">
          <s-paragraph>
            Couldn’t refresh today’s live orders. Closed-day sales facts still
            drive {periodLabel} — retry shortly for a complete today top-up.
          </s-paragraph>
        </s-banner>
      ) : null}

      {marginStale ? (
        <s-banner tone="warning" heading="Reconfirm profit margin">
          <s-paragraph>
            Margin was last confirmed more than 90 days ago. Typical DTC is
            25–45% — reconfirm so break-even stays right.{" "}
            <s-link href="/app/settings">Open Settings</s-link>.
          </s-paragraph>
        </s-banner>
      ) : null}

      {!cashActionReady &&
      onboarding?.hasSpend &&
      !spendCoverage?.incomplete &&
      spendRecon?.status !== "drift" ? (
        <s-banner tone="info" heading="Add the rest of this period’s spend">
          <s-paragraph>
            Add more days when you have invoices — last month is enough to start.
          </s-paragraph>
          <div className="mcfly-decision__actions" style={{ marginTop: "0.65rem" }}>
            <s-button href="/app/spend" variant="primary">
              Review spend
            </s-button>
          </div>
        </s-banner>
      ) : null}

      {spendCoverage?.incomplete ? (
        <s-banner tone="info" heading="More days of spend will complete this period">
          <s-paragraph>
            {formatSpendCoverageLine(spendCoverage, periodLabel)}.{" "}
            Days with no spend row are $0 next to that day’s sales. Add more
            invoices when you have them — last month is enough to start.{" "}
            <s-link href="/app/spend#mcfly-spend-csv">Add more days</s-link>
          </s-paragraph>
        </s-banner>
      ) : null}

      {spendRecon?.status === "drift" && spendRecon.declared != null ? (
        <s-banner tone="warning" heading="Spend doesn’t match Ads Manager">
          <s-paragraph>
            {formatSpendReconLine(spendRecon)}. Desk{" "}
            {formatCurrency(spendRecon.csvTotal)} vs declared{" "}
            {formatCurrency(spendRecon.declared)}. Fix the CSV or the declared
            total on <s-link href="/app/spend">Spend</s-link> before you act.
          </s-paragraph>
        </s-banner>
      ) : null}

      {showBelowBe && belowBreakEven ? (
        <s-banner
          tone="critical"
          heading={`Below ${PRODUCT_NOUN.breakEvenShort}`}
        >
          <s-paragraph>
            {PRODUCT_NOUN.totalRoas} is {formatMer(belowBreakEven.mer)} — below
            break-even {formatMer(belowBreakEven.breakEvenMer)} for{" "}
            {periodLabel}. Cut or shift spend to protect the floor.{" "}
            <s-link href="/app/allocation">Open allocation</s-link>
          </s-paragraph>
        </s-banner>
      ) : null}
    </>
  );
}
