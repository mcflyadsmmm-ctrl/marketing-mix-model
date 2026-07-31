import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { useLoaderData, useNavigation } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import { CashTrustBanners } from "../components/CashTrustBanners";
import { PeriodControl } from "../components/PeriodControl";
import { SampleDeskBanner } from "../components/SampleDeskBanner";
import { buildDashboardMetrics, ensureShop } from "../lib/mer-dashboard.server";
import { formatCurrency, formatMer, formatPercent } from "../lib/mer-format";
import { PRODUCT_NOUN } from "../lib/product-labels";
import type { SalesResult } from "../lib/shopify-sales.server";
import {
  loadDeskSalesForPeriod,
  salesFactsBlockLock,
} from "../lib/sales-facts.server";
import {
  parsePeriodPreset,
  resolvePeriod,
} from "../lib/periods";
import { fetchSampleSales, getSampleDeskEnabled } from "../lib/sample-desk.server";

function deltaClass(
  mer: number | null,
  rail: number | null,
): "up" | "down" | "flat" {
  if (mer == null || rail == null) return "flat";
  if (mer >= rail) return "up";
  if (mer >= rail * 0.85) return "flat";
  return "down";
}

function channelFillKey(name: string): string {
  const n = name.toLowerCase();
  if (n.includes("meta")) return "meta";
  if (n.includes("google")) return "google";
  if (n.includes("microsoft") || n.includes("bing")) return "microsoft";
  if (n.includes("tiktok")) return "tiktok";
  if (n.includes("pinterest")) return "pinterest";
  if (n.includes("snapchat") || n === "snap") return "snapchat";
  if (n.includes("reddit")) return "reddit";
  if (n === "x" || n.includes("twitter") || n.includes("x ads")) return "x";
  if (n.includes("linkedin")) return "linkedin";
  if (n.includes("amazon")) return "amazon";
  if (n.includes("apple search") || n.includes("apple_search")) return "apple_search";
  if (n.includes("affiliate")) return "affiliate";
  if (n.includes("email") || n.includes("klaviyo")) return "email";
  return "other";
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);
  const url = new URL(request.url);
  const preset = parsePeriodPreset(url.searchParams.get("period"));
  const shotMode = url.searchParams.get("shot") === "1";
  const shop = await ensureShop(session.shop);
  const range = resolvePeriod(preset, new Date(), shop.ianaTimezone);
  const useSampleDesk = await getSampleDeskEnabled(shop.id);

  let sales: SalesResult;
  let salesError: string | null = null;
  let todaySalesUnavailable = false;
  let todaySalesTruncated = false;
  let salesFactsIncomplete: {
    factDays: number;
    expectedClosedDays: number;
  } | null = null;
  let factsIncomplete = false;
  let shopifyOrderWindowLimited = false;
  if (useSampleDesk) {
    sales = await fetchSampleSales(shop.id, range);
  } else {
    /*
     * Same hard-stop as Overview: never unbounded fetchShopifySales for the
     * period. Serve SalesDayFact + capped today top-up only.
     */
    const desk = await loadDeskSalesForPeriod({
      admin,
      shopId: shop.id,
      range,
      ianaTimezone: shop.ianaTimezone,
    });
    sales = desk.sales;
    salesError = desk.salesError;
    todaySalesUnavailable = desk.todaySalesUnavailable;
    todaySalesTruncated = desk.todaySalesTruncated;
    const coverage = desk.factsCoverage;
    // Fail-closed lock shape — compute on server so .server is not client-bundled.
    factsIncomplete = salesFactsBlockLock(coverage);
    salesFactsIncomplete =
      coverage != null &&
      !coverage.complete &&
      !coverage.periodExceedsFactWindow
        ? {
            factDays: coverage.factDays,
            expectedClosedDays: coverage.expectedClosedDays,
          }
        : null;
    shopifyOrderWindowLimited = Boolean(coverage?.periodExceedsFactWindow);
  }

  const metrics = await buildDashboardMetrics(session.shop, range, sales);
  return {
    metrics,
    preset,
    shotMode,
    useSampleDesk,
    salesError,
    todaySalesUnavailable,
    todaySalesTruncated,
    salesFactsIncomplete,
    factsIncomplete,
    shopifyOrderWindowLimited,
  };
};

export default function AllocationPage() {
  const {
    metrics,
    preset,
    shotMode,
    useSampleDesk,
    salesError,
    todaySalesUnavailable,
    todaySalesTruncated,
    salesFactsIncomplete,
    factsIncomplete,
    shopifyOrderWindowLimited,
  } = useLoaderData<typeof loader>();
  const navigation = useNavigation();
  const isLoading = navigation.state === "loading";
  const allocation = metrics.allocation;

  const merDelta = allocation
    ? deltaClass(allocation.overallMer, allocation.breakEvenMer)
    : "flat";
  const targetDelta = deltaClass(metrics.mer, metrics.targetMer);
  // Never label error / incomplete / mock as live Shopify. SAMPLE stays honest.
  const tillLabel = useSampleDesk
    ? `${metrics.period.label} · SAMPLE`
    : shotMode
      ? metrics.period.label
      : salesError ||
          metrics.blockedMockAsLive ||
          metrics.salesSource === "mock"
        ? `${metrics.period.label} · sales unavailable`
        : factsIncomplete
          ? `${metrics.period.label} · facts incomplete`
          : `${metrics.period.label} · live sales`;

  const cashLocked =
    !allocation &&
    metrics.breakEvenMer != null &&
    !metrics.cashActionReady &&
    !shotMode;
  const whyLine = allocation
    ? allocation.why
    : cashLocked
      ? metrics.spendCoverage.incomplete
        ? `Spend coverage is under 70% — fill empty days before Monday cash-close advice. ${PRODUCT_NOUN.mondayCall}.`
        : metrics.spendRecon?.status === "drift"
          ? `Desk spend vs declared Ads Manager is outside ±5% — fix recon before allocation. ${PRODUCT_NOUN.mondayCall}.`
          : `Cash affordability is locked until spend trust is ready. ${PRODUCT_NOUN.mondayCall}.`
      : `Set profit margin so break-even can lock. ${PRODUCT_NOUN.mondayCall}.`;

  const primaryAction = allocation?.actions[0];
  const decisionLead = primaryAction
    ? `${actionLabel(primaryAction.type)} ${
        primaryAction.channel !== "—" ? primaryAction.channel : "mix"
      }${
        primaryAction.percentChange != null
          ? ` (${primaryAction.percentChange > 0 ? "+" : ""}${primaryAction.percentChange}%)`
          : ""
      }`
    : null;

  const recommendation =
    decisionLead ??
    (allocation
      ? "Hold the mix — no cut or shift this period"
      : cashLocked
        ? "Fill spend trust before allocation"
        : "Confirm margin to open allocation");

  const zeroMargin = !allocation && metrics.breakEvenMer == null && !shotMode;
  const noSpendMix =
    allocation != null && allocation.inputs.channelEfficiencies.length === 0;

  return (
    <s-page heading={shotMode ? undefined : "Allocation"} inlineSize="large">
      <div
        className={[
          "mcfly-desk",
          shotMode ? "mcfly-desk--shot" : null,
          useSampleDesk ? "mcfly-desk--sample" : null,
          isLoading && !shotMode ? "mcfly-desk--loading" : null,
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {useSampleDesk && !shotMode ? (
          <SampleDeskBanner note="Allocation uses SAMPLE numbers — not your live store." />
        ) : null}

        {!useSampleDesk && !shotMode ? (
          <CashTrustBanners
            blockedMockAsLive={Boolean(metrics.blockedMockAsLive)}
            spendCoverage={null}
            periodLabel={metrics.period.label}
            shopifyOrderWindowLimited={shopifyOrderWindowLimited}
            salesFactsIncomplete={salesFactsIncomplete}
            todaySalesTruncated={todaySalesTruncated}
            todaySalesUnavailable={todaySalesUnavailable}
            shotMode={shotMode}
            cashActionReady={metrics.cashActionReady}
          />
        ) : null}

        {isLoading && !shotMode ? (
          <section className="mcfly-state mcfly-state--loading" aria-live="polite">
            <p className="mcfly-state__copy">Refreshing allocation for this period…</p>
          </section>
        ) : null}

        {salesError && !shotMode ? (
          <section
            className="mcfly-state mcfly-state--critical"
            aria-label="Sales load error"
          >
            <p className="mcfly-state__copy">
              Sales didn’t load — allocation needs {PRODUCT_NOUN.totalRoas} from sales ÷ spend.
            </p>
            <div className="mcfly-state__cta">
              <s-button href={`/app/allocation?period=${preset}`} variant="primary">
                Retry
              </s-button>
            </div>
          </section>
        ) : null}

        {zeroMargin ? (
          <section
            className="mcfly-state mcfly-state--warn"
            aria-label="Break-even margin required"
          >
            <p className="mcfly-state__copy">
              Set profit margin so {PRODUCT_NOUN.breakEvenTotalRoas} can lock.{" "}
              {PRODUCT_NOUN.mondayCall}.
            </p>
            <div className="mcfly-state__cta">
              <s-button href="/app/settings" variant="primary">
                Open Settings
              </s-button>
            </div>
          </section>
        ) : null}

        {cashLocked ? (
          <section
            className="mcfly-state mcfly-state--warn"
            aria-label="Allocation locked until spend trust"
          >
            <p className="mcfly-state__copy">{whyLine}</p>
            <div className="mcfly-state__cta">
              <s-button href="/app/spend" variant="primary">
                Fill spend holes
              </s-button>
              <s-link href={`/app?period=${preset}`}>
                View {PRODUCT_NOUN.deskTitle}
              </s-link>
            </div>
          </section>
        ) : null}

        <header className="mcfly-topbar">
          <div>
            <p className="mcfly-topbar__def mcfly-topbar__def--solo">
              {PRODUCT_NOUN.mondayCall}
            </p>
          </div>
          <PeriodControl preset={preset} shotMode={shotMode} />
        </header>

        <div className="mcfly-ctx" aria-live="polite">
          <div className="mcfly-ctx__main">
            <span className="mcfly-ctx__brand">Allocation</span>
            <span className="mcfly-ctx__sep" aria-hidden="true">
              ·
            </span>
            <span className="mcfly-ctx__asof">{tillLabel}</span>
          </div>
          <div className="mcfly-ctx__chips">
            {useSampleDesk && !shotMode ? (
              <span className="mcfly-ctx-chip mcfly-alloc-sample-dot">
                {PRODUCT_NOUN.samplePreview}
              </span>
            ) : null}
            {allocation ? (
              <>
                <span className={`mcfly-ctx-chip mcfly-ctx-chip--${targetDelta}`}>
                  {PRODUCT_NOUN.totalRoas} {formatMer(metrics.mer)} · target{" "}
                  {formatMer(metrics.targetMer)}
                </span>
                <span className={`mcfly-ctx-chip mcfly-ctx-chip--${merDelta}`}>
                  Break-even {formatMer(metrics.breakEvenMer)}
                </span>
              </>
            ) : null}
          </div>
        </div>

        {allocation ? (
          <section
            className="mcfly-decision mcfly-decision--hero"
            aria-label="Allocation recommendation"
          >
            <p className="mcfly-decision__kicker">
              {PRODUCT_NOUN.mondayCall}
            </p>
            <p className="mcfly-decision__takeaway">{recommendation}</p>
            <p className="mcfly-decision__why">{whyLine}</p>
            <p className="mcfly-panel__muted">{PRODUCT_NOUN.allocationHeuristic}</p>
            <div className="mcfly-decision__actions">
              <s-button href="/app/spend" variant="primary">
                Adjust spend
              </s-button>
              <s-link href={`/app?period=${preset}`}>
                Back to {PRODUCT_NOUN.deskTitle}
              </s-link>
            </div>
          </section>
        ) : null}

        {allocation ? (
          <dl className="mcfly-alloc-inputs" aria-label="Inputs used for this recommendation">
            <div className="mcfly-alloc-inputs__item">
              <dt>Spend</dt>
              <dd>{formatCurrency(allocation.inputs.totalSpend)}</dd>
            </div>
            <div className="mcfly-alloc-inputs__item">
              <dt>{PRODUCT_NOUN.totalRoas}</dt>
              <dd>
                {allocation.overallMer === null
                  ? "—.——"
                  : formatMer(allocation.overallMer)}
              </dd>
            </div>
            <div className="mcfly-alloc-inputs__item">
              <dt>Break-even</dt>
              <dd>{formatMer(allocation.breakEvenMer)}</dd>
            </div>
            <div className="mcfly-alloc-inputs__item">
              <dt>Sales</dt>
              <dd>{formatCurrency(allocation.inputs.totalSales)}</dd>
            </div>
          </dl>
        ) : null}

        {!allocation ? (
          !zeroMargin && !cashLocked ? (
            <section
              className="mcfly-state mcfly-state--empty"
              aria-label="Allocation unavailable"
            >
              <p className="mcfly-state__copy">
                Allocation needs {PRODUCT_NOUN.totalRoas} from sales ÷ spend —
                export daily CSVs and upload so the Monday call can cut or shift.
              </p>
              <div className="mcfly-state__cta">
                <s-button href="/app/spend" variant="primary">
                  {PRODUCT_NOUN.setupAddSpend}
                </s-button>
                <s-link href="/app/settings">{PRODUCT_NOUN.setupAdjustMargin}</s-link>
              </div>
            </section>
          ) : null
        ) : (
          <>
            <section
              className="mcfly-alloc-score"
              aria-label={`${PRODUCT_NOUN.totalRoas} versus break-even`}
            >
              <div
                className={`mcfly-alloc-score__card mcfly-alloc-score__card--mer mcfly-alloc-score__card--${merDelta}`}
              >
                <p className="mcfly-alloc-score__label">{PRODUCT_NOUN.totalRoas}</p>
                <p className="mcfly-alloc-score__value">
                  {allocation.overallMer === null
                    ? "—.——"
                    : formatMer(allocation.overallMer)}
                </p>
                <p className="mcfly-alloc-score__meta">
                  {formatCurrency(allocation.inputs.totalSales)} ÷{" "}
                  {formatCurrency(allocation.inputs.totalSpend)}
                </p>
              </div>
              <div className="mcfly-alloc-score__vs" aria-hidden="true">
                vs
              </div>
              <div className="mcfly-alloc-score__card mcfly-alloc-score__card--be">
                <p className="mcfly-alloc-score__label">Break-even</p>
                <p className="mcfly-alloc-score__value">
                  {formatMer(allocation.breakEvenMer)}
                </p>
                <p
                  className={`mcfly-alloc-score__meta mcfly-alloc-score__meta--${merDelta}`}
                >
                  {allocation.isAboveBreakEven === true
                    ? "Above the line · protect or grow"
                    : allocation.isAboveBreakEven === false
                      ? "Below the line · cut or shift"
                      : "Need spend to compare"}
                </p>
              </div>
            </section>

            <section className="mcfly-panel mcfly-alloc-shifts">
              <div className="mcfly-panel__head">
                <h2>Channel shifts</h2>
                <p className="mcfly-panel__muted">
                  Suggested mix shift · {allocation.suggestedTestDays} days · keep
                  at least half of this period’s spend
                </p>
              </div>
              <ul className="mcfly-alloc-shift-list">
                {allocation.actions.map((action, index) => (
                  <li
                    className={`mcfly-alloc-shift mcfly-alloc-shift--${action.type}`}
                    key={`${action.type}-${action.channel}-${index}`}
                  >
                    <span
                      className={`mcfly-alloc-shift__badge mcfly-alloc-shift__badge--${action.type}`}
                    >
                      {actionLabel(action.type)}
                    </span>
                    <div className="mcfly-alloc-shift__body">
                      <p className="mcfly-alloc-shift__title">
                        {action.channel !== "—" ? action.channel : "All channels"}
                        {action.percentChange != null
                          ? ` · ${action.percentChange > 0 ? "+" : ""}${action.percentChange}%`
                          : ""}
                      </p>
                      <p className="mcfly-alloc-shift__detail">{action.detail}</p>
                    </div>
                    {action.percentChange != null ? (
                      <div
                        className="mcfly-alloc-shift__bar"
                        aria-hidden="true"
                      >
                        <div
                          className={`mcfly-alloc-shift__fill mcfly-alloc-shift__fill--${action.type}`}
                          style={{
                            width: `${Math.min(100, Math.max(12, Math.abs(action.percentChange) * 2.2))}%`,
                          }}
                        />
                      </div>
                    ) : (
                      <div
                        className="mcfly-alloc-shift__bar mcfly-alloc-shift__bar--quiet"
                        aria-hidden="true"
                      >
                        <div
                          className={`mcfly-alloc-shift__fill mcfly-alloc-shift__fill--${action.type}`}
                          style={{ width: "28%" }}
                        />
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </section>

            <section className="mcfly-panel">
              <div className="mcfly-panel__head">
                <h2>
                  {allocation.hasOperatorChannelCash
                    ? "Channel vs break-even"
                    : "Channel spend mix"}
                </h2>
                <p className="mcfly-panel__muted">
                  {allocation.hasOperatorChannelCash
                    ? "Your channel spend vs break-even — labeled assumptions for one mix shift."
                    : "Spend share only. Add your channel cash splits for clearer cut / protect advice."}
                </p>
              </div>
              {noSpendMix ? (
                <section
                  className="mcfly-state mcfly-state--empty"
                  aria-label="No channel spend"
                >
                  <p className="mcfly-state__copy">
                    No channel spend for {metrics.period.label} — log Meta, Google, and the rest to compare vs break-even.
                  </p>
                  <div className="mcfly-state__cta">
                    <s-button href="/app/spend" variant="primary">
                      {PRODUCT_NOUN.setupAddSpend}
                    </s-button>
                  </div>
                </section>
              ) : (
                <div className="mcfly-alloc-eff">
                  {allocation.inputs.channelEfficiencies.map((channel) => {
                    const share = Math.max(
                      4,
                      Math.round(channel.spendShare * 100),
                    );
                    const fill = channelFillKey(channel.name);
                    const action = allocation.actions.find(
                      (a) =>
                        a.channel.toLowerCase() === channel.name.toLowerCase() &&
                        a.type !== "watch",
                    );
                    const vsBe =
                      channel.efficiencyVsBreakEven != null
                        ? channel.efficiencyVsBreakEven >= 1
                          ? "up"
                          : channel.efficiencyVsBreakEven >= 0.85
                            ? "flat"
                            : "down"
                        : "flat";
                    return (
                      <div className="mcfly-alloc-eff__row" key={channel.name}>
                        <div className="mcfly-alloc-eff__head">
                          <span className="mcfly-alloc-eff__name">
                            {channel.name}
                            {channel.isManual ? " · manual" : ""}
                            {action ? (
                              <span
                                className={`mcfly-channel__badge mcfly-channel__badge--${action.type}`}
                              >
                                {actionLabel(action.type)}
                                {action.percentChange != null
                                  ? ` ${action.percentChange > 0 ? "+" : ""}${action.percentChange}%`
                                  : ""}
                              </span>
                            ) : null}
                          </span>
                          <span
                            className={`mcfly-alloc-eff__ratio mcfly-alloc-eff__ratio--${vsBe}`}
                          >
                            {channel.efficiencyVsBreakEven != null
                              ? `${channel.efficiencyVsBreakEven.toFixed(2)}× BE`
                              : "—"}
                          </span>
                        </div>
                        <div className="mcfly-alloc-eff__track" aria-hidden="true">
                          <div
                            className={`mcfly-channel__fill mcfly-channel__fill--${fill}`}
                            style={{ width: `${share}%` }}
                          />
                        </div>
                        <p className="mcfly-alloc-eff__meta">
                          {formatCurrency(channel.spend)} ·{" "}
                          {formatPercent(channel.spendShare)} spend
                          {channel.basis === "operator_cash" ? (
                            <>
                              {" "}
                              · {PRODUCT_NOUN.totalRoasShort}{" "}
                              {formatMer(channel.effectiveMer)}
                            </>
                          ) : (
                            <> · spend share only</>
                          )}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </s-page>
  );
}

function actionLabel(type: "cut" | "shift" | "hold" | "watch"): string {
  switch (type) {
    case "cut":
      return "Cut";
    case "shift":
      return "Shift";
    case "hold":
      return "Hold";
    case "watch":
      return "Watch";
    default: {
      const _exhaustive: never = type;
      return _exhaustive;
    }
  }
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
