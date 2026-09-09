/**
 * Light Total ROAS trust banners — coverage, below-BE habit, mock guard,
 * optional margin stale. Fail-closed only (no sales-basis info card).
 * Polaris chrome only; keep out of the Apps Script scoreboard island.
 * Below-BE habit only when caller passes belowBreakEven (cashActionReady).
 *
 * Love-7: Ads Manager ±5% declare-recon has no merchant form — do not surface
 * drift / declared-total banners that merchants cannot set or clear.
 *
 * Love-V1: Overview banner budget (VISUAL_CRAFT §2.5) — ≤1 critical + ≤2
 * non-dismissible status above fold; info prefers chips; non-essential
 * dismissible. Love-6 coverage tone (never critical for coverage-only).
 */

import type { SpendPeriodCoverage } from "../lib/mer-trust";
import { formatSpendCoverageLine } from "../lib/mer-trust";
import { formatMer } from "../lib/mer-format";
import { PRODUCT_NOUN } from "../lib/product-labels";
import { formatMissingDaysRoasImpact } from "../lib/cash-desk-copy";
import {
  resolveSpendCoverageNotice,
  type SpendCoverageDay,
} from "../lib/spend-coverage-tone";
import {
  budgetOverviewBanners,
  type OverviewBannerCandidate,
  type OverviewBannerDecision,
  type OverviewBannerId,
} from "../lib/overview-banner-budget";
import { DeepHistoryBanner } from "./DeepHistoryBanner";
import type { DeepHistoryHonestyKind } from "../lib/deep-history-honesty";

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
  /** Deep-history honesty — missing scope vs granted-but-backfilling. */
  deepHistoryKind?: DeepHistoryHonestyKind;
  shopDomain?: string;
  /** When false, never use the 4-year fact-window banner (need the grant CTA). */
  hasReadAllOrders?: boolean;
  /**
   * Love-V1 split mount on Overview:
   * - `all` — sole mount (cold-only or below-KPI-only): banners + chips + deferred
   * - `above` — primary/cold stack: primary banners + chips
   * - `deferred` — below-KPI companion: deferred banners only
   */
  budgetRole?: "all" | "above" | "deferred";
};

/**
 * Synthetic closed-day strip from period coverage counts so Overview can reuse
 * Love-6 tone without loading the Spend day ledger. Stage depends on filled
 * count only — which days are filled does not change tone.
 */
export function syntheticCoverageDays(
  coverage: SpendPeriodCoverage,
): SpendCoverageDay[] {
  const total = Math.max(0, coverage.daysInPeriod);
  const filled = Math.min(Math.max(0, coverage.daysWithSpend), total);
  return Array.from({ length: total }, (_, i) => ({
    dateKey: `overview-period-${i}`,
    // Fill from the end — matches Spend's "newest typed first" strip shape.
    filled: i >= total - filled,
  }));
}

export function buildCashTrustBannerCandidates(input: {
  blockedMockAsLive: boolean;
  spendCoverage: SpendPeriodCoverage | null;
  periodLabel: string;
  shopifyOrderWindowLimited: boolean;
  salesFactsIncomplete: {
    factDays: number;
    expectedClosedDays: number;
  } | null;
  todaySalesTruncated: boolean;
  todaySalesUnavailable: boolean;
  cashActionReady: boolean;
  belowBreakEven: {
    mer: number | null;
    breakEvenMer: number;
    totalSpend: number;
  } | null;
  marginStale: boolean;
  onboarding: { settingsSaved: boolean; hasSpend: boolean } | null;
  deepHistoryKind: DeepHistoryHonestyKind;
  shopDomain: string;
  hasReadAllOrders: boolean;
}): {
  candidates: OverviewBannerCandidate[];
  decisions: OverviewBannerDecision[];
  coverageNotice: ReturnType<typeof resolveSpendCoverageNotice> | null;
  showBelowBe: boolean;
} {
  const showBelowBe =
    input.belowBreakEven != null &&
    input.belowBreakEven.totalSpend > 0 &&
    input.belowBreakEven.breakEvenMer > 0 &&
    input.belowBreakEven.mer != null &&
    Number.isFinite(input.belowBreakEven.mer) &&
    input.belowBreakEven.mer < input.belowBreakEven.breakEvenMer;

  const spendGapImpact =
    input.spendCoverage?.incomplete
      ? formatMissingDaysRoasImpact({
          missingDays: Math.max(
            0,
            input.spendCoverage.daysInPeriod - input.spendCoverage.daysWithSpend,
          ),
          windowDays: input.spendCoverage.daysInPeriod,
          periodLabel: input.periodLabel,
        })
      : null;

  const coverageNotice =
    input.spendCoverage?.incomplete && spendGapImpact
      ? resolveSpendCoverageNotice({
          closedDays: syntheticCoverageDays(input.spendCoverage),
          impact: spendGapImpact,
        })
      : null;

  const showDeepHistory =
    (input.deepHistoryKind === "missing_scope" ||
      input.deepHistoryKind === "missing_scope_wide") &&
    Boolean(input.shopDomain);

  const showOrderWindow =
    input.shopifyOrderWindowLimited &&
    input.hasReadAllOrders &&
    input.deepHistoryKind !== "missing_scope" &&
    input.deepHistoryKind !== "missing_scope_wide";

  const showSalesFacts =
    input.salesFactsIncomplete != null &&
    input.salesFactsIncomplete.expectedClosedDays > 0 &&
    !input.shopifyOrderWindowLimited &&
    input.deepHistoryKind !== "missing_scope" &&
    input.deepHistoryKind !== "missing_scope_wide";

  const showAlmostReady =
    !input.cashActionReady &&
    !input.salesFactsIncomplete &&
    !input.spendCoverage?.incomplete;

  const candidates: OverviewBannerCandidate[] = [];

  if (input.blockedMockAsLive) {
    candidates.push({
      id: "mock_blocked",
      tone: "critical",
      essential: true,
      dismissibleAllowed: false,
      priority: 10,
    });
  }

  if (showDeepHistory) {
    candidates.push({
      id: "deep_history",
      tone: "warning",
      essential: true,
      dismissibleAllowed: false,
      priority: 20,
    });
  }

  if (coverageNotice?.showBanner) {
    candidates.push({
      id: "spend_coverage",
      // Love-6: never critical for coverage-only honesty.
      tone: coverageNotice.tone,
      essential: true,
      dismissibleAllowed: false,
      chipLabel: coverageNotice.statusLine,
      priority: 30,
    });
  }

  if (showBelowBe) {
    candidates.push({
      id: "below_be",
      tone: "critical",
      essential: true,
      dismissibleAllowed: false,
      priority: 40,
    });
  }

  if (input.todaySalesUnavailable && !input.todaySalesTruncated) {
    candidates.push({
      id: "today_unavailable",
      tone: "warning",
      essential: true,
      dismissibleAllowed: false,
      chipLabel: "Today’s sales unavailable",
      priority: 50,
    });
  }

  if (input.todaySalesTruncated) {
    candidates.push({
      id: "today_truncated",
      tone: "warning",
      essential: true,
      dismissibleAllowed: false,
      chipLabel: "Today’s sales may be incomplete",
      priority: 55,
    });
  }

  if (input.marginStale) {
    candidates.push({
      id: "margin_stale",
      tone: "warning",
      essential: false,
      dismissibleAllowed: true,
      chipLabel: "Reconfirm margin",
      priority: 60,
    });
  }

  if (showOrderWindow) {
    candidates.push({
      id: "order_window",
      tone: "info",
      essential: false,
      dismissibleAllowed: true,
      chipLabel: "Sales history limited",
      priority: 70,
    });
  }

  if (showSalesFacts) {
    candidates.push({
      id: "sales_facts",
      tone: "info",
      essential: false,
      dismissibleAllowed: true,
      chipLabel: `Sales facts ${input.salesFactsIncomplete!.factDays}/${input.salesFactsIncomplete!.expectedClosedDays}`,
      priority: 80,
    });
  }

  if (showAlmostReady) {
    candidates.push({
      id: "almost_ready",
      tone: "info",
      essential: false,
      dismissibleAllowed: true,
      chipLabel: input.onboarding?.hasSpend
        ? "Finish spend trust"
        : "Add spend next",
      priority: 90,
    });
  }

  return {
    candidates,
    decisions: budgetOverviewBanners(candidates),
    coverageNotice,
    showBelowBe,
  };
}

function decisionMap(
  decisions: OverviewBannerDecision[],
): Map<OverviewBannerId, OverviewBannerDecision> {
  return new Map(decisions.map((d) => [d.id, d]));
}

function shouldRender(
  d: OverviewBannerDecision | undefined,
  role: "all" | "above" | "deferred",
  kind: "banner" | "chip",
): boolean {
  if (!d) return false;
  if (kind === "chip") {
    return d.placement === "chip" && role !== "deferred";
  }
  if (d.placement === "omit" || d.placement === "chip") return false;
  if (role === "all") return true;
  if (role === "above") return d.placement === "banner";
  return d.placement === "deferred";
}

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
  belowBreakEven = null,
  marginStale = false,
  onboarding = null,
  deepHistoryKind = "hidden",
  shopDomain = "",
  hasReadAllOrders = true,
  budgetRole = "all",
}: Props) {
  if (shotMode) return null;

  const { decisions, coverageNotice, showBelowBe } =
    buildCashTrustBannerCandidates({
      blockedMockAsLive,
      spendCoverage,
      periodLabel,
      shopifyOrderWindowLimited,
      salesFactsIncomplete,
      todaySalesTruncated,
      todaySalesUnavailable,
      cashActionReady,
      belowBreakEven,
      marginStale,
      onboarding,
      deepHistoryKind,
      shopDomain,
      hasReadAllOrders,
    });

  const byId = decisionMap(decisions);
  const chipDecisions = decisions.filter((d) =>
    shouldRender(d, budgetRole, "chip"),
  );

  const mockD = byId.get("mock_blocked");
  const deepD = byId.get("deep_history");
  const orderD = byId.get("order_window");
  const factsD = byId.get("sales_facts");
  const truncD = byId.get("today_truncated");
  const unavailD = byId.get("today_unavailable");
  const marginD = byId.get("margin_stale");
  const almostD = byId.get("almost_ready");
  const coverageD = byId.get("spend_coverage");
  const belowD = byId.get("below_be");

  return (
    <>
      {chipDecisions.length > 0 ? (
        <div
          className="mcfly-ctx__chips mcfly-trust-chips"
          aria-label="Trust signals"
        >
          {chipDecisions.map((d) => (
            <span
              key={d.id}
              className="mcfly-ctx-chip mcfly-ctx-chip--flat mcfly-eq__meta--trust"
            >
              {d.chipLabel}
            </span>
          ))}
        </div>
      ) : null}

      {shouldRender(mockD, budgetRole, "banner") ? (
        <s-banner
          tone="critical"
          heading="Mock sales blocked"
          dismissible={mockD?.dismissible || undefined}
        >
          <s-paragraph>
            Fabricated sales were refused — {PRODUCT_NOUN.totalRoas} never treats
            mock numbers as live Shopify when the sample desk is off. Retry the
            sales pull, or turn on the{" "}
            <s-link href="/app/demo">{PRODUCT_NOUN.samplePreview}</s-link> for a
            labeled walkthrough.
          </s-paragraph>
        </s-banner>
      ) : null}

      {shouldRender(deepD, budgetRole, "banner") && shopDomain ? (
        <DeepHistoryBanner kind={deepHistoryKind} shopDomain={shopDomain} />
      ) : null}

      {shouldRender(orderD, budgetRole, "banner") ? (
        <s-banner
          tone="info"
          heading="Sales history limited for this period"
          dismissible={orderD?.dismissible || undefined}
        >
          <s-paragraph>
            {periodLabel} reaches before stored daily sales (back to Jan 1 four
            years ago). Prefer a shorter period, or wait for backfill.
          </s-paragraph>
        </s-banner>
      ) : null}

      {shouldRender(factsD, budgetRole, "banner") && salesFactsIncomplete ? (
        <s-banner
          tone="info"
          heading="Sales facts still backfilling"
          dismissible={factsD?.dismissible || undefined}
        >
          <s-paragraph>
            Sales loaded for {salesFactsIncomplete.factDays} of{" "}
            {salesFactsIncomplete.expectedClosedDays} days in {periodLabel}.
            {deepHistoryKind === "backfilling"
              ? " Deeper history is granted — this is filling, not broken."
              : " Refresh in a few minutes for more coverage."}
          </s-paragraph>
        </s-banner>
      ) : null}

      {shouldRender(truncD, budgetRole, "banner") ? (
        <s-banner
          tone="warning"
          heading="Today’s sales may be incomplete"
          dismissible={truncD?.dismissible || undefined}
        >
          <s-paragraph>
            Live today is capped at ~100 orders for a fast desk load. High-volume
            shops can undercount today until the day closes into stored sales
            facts. Closed days in {periodLabel} are unaffected.
          </s-paragraph>
        </s-banner>
      ) : null}

      {shouldRender(unavailD, budgetRole, "banner") ? (
        <s-banner
          tone="warning"
          heading="Today’s sales unavailable"
          dismissible={unavailD?.dismissible || undefined}
        >
          <s-paragraph>
            Couldn’t refresh today’s live orders. Closed-day sales facts still
            drive {periodLabel} — retry shortly for a complete today top-up.
          </s-paragraph>
        </s-banner>
      ) : null}

      {shouldRender(marginD, budgetRole, "banner") ? (
        <s-banner
          tone="warning"
          heading="Reconfirm profit margin"
          dismissible={marginD?.dismissible || undefined}
        >
          <s-paragraph>
            Margin was last confirmed more than 90 days ago. Typical DTC is
            25–45% — reconfirm so break-even stays right.{" "}
            <s-link href="/app/settings">Open Settings</s-link>.
          </s-paragraph>
        </s-banner>
      ) : null}

      {shouldRender(almostD, budgetRole, "banner") ? (
        <s-banner
          tone="info"
          heading="Almost ready"
          dismissible={almostD?.dismissible || undefined}
        >
          <s-paragraph>
            {!onboarding?.hasSpend
              ? "Paste daily ad spend next — then read cash Total ROAS."
              : `Finish spend trust, then read Total ROAS on Overview.`}
          </s-paragraph>
          <div className="mcfly-decision__actions" style={{ marginTop: "0.65rem" }}>
            {!onboarding?.hasSpend ? (
              <s-button href="/app/spend" variant="primary">
                {PRODUCT_NOUN.setupAddSpend}
              </s-button>
            ) : (
              <s-button href="/app/spend" variant="primary">
                Review spend
              </s-button>
            )}
          </div>
        </s-banner>
      ) : null}

      {shouldRender(coverageD, budgetRole, "banner") &&
      coverageNotice &&
      spendCoverage ? (
        <s-banner
          tone={coverageNotice.tone}
          heading={coverageNotice.heading}
          dismissible={coverageD?.dismissible || undefined}
        >
          <s-paragraph>
            {formatSpendCoverageLine(spendCoverage, periodLabel)}.{" "}
            {coverageNotice.body}{" "}
            <s-link href="/app/spend#mcfly-spend-uploads">Fill spend gaps</s-link>
          </s-paragraph>
          {coverageNotice.note ? (
            <s-paragraph>{coverageNotice.note}</s-paragraph>
          ) : null}
        </s-banner>
      ) : null}

      {shouldRender(belowD, budgetRole, "banner") &&
      showBelowBe &&
      belowBreakEven ? (
        <s-banner
          tone="critical"
          heading={`Below ${PRODUCT_NOUN.breakEvenShort}`}
          dismissible={belowD?.dismissible || undefined}
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
