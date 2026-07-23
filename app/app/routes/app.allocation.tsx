import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { useLoaderData, useSearchParams } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import { buildDashboardMetrics, ensureShop } from "../lib/mer-dashboard.server";
import { formatCurrency, formatMer, formatPercent } from "../lib/mer-format";
import { fetchShopifySales } from "../lib/shopify-sales.server";
import { PERIOD_PRESETS, resolvePeriod, type PeriodPreset } from "../lib/periods";
import { fetchSampleSales, getSampleDeskEnabled } from "../lib/sample-desk.server";

function parsePreset(raw: string | null): PeriodPreset {
  if (raw && PERIOD_PRESETS.some((p) => p.value === raw)) {
    return raw as PeriodPreset;
  }
  return "mtd";
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);
  const url = new URL(request.url);
  const preset = parsePreset(url.searchParams.get("period"));
  const range = resolvePeriod(preset);
  const shop = await ensureShop(session.shop);
  const useSampleDesk = await getSampleDeskEnabled(shop.id);

  let sales;
  if (useSampleDesk) {
    sales = await fetchSampleSales(shop.id, range);
  } else {
    try {
      sales = await fetchShopifySales(admin, range);
    } catch {
      sales = {
        totalSales: 0,
        orderCount: 0,
        newCustomers: 0,
        returningCustomers: 0,
        guestOrders: 0,
        customerMetricsAvailable: false,
        source: "shopify" as const,
      };
    }
  }

  const metrics = await buildDashboardMetrics(session.shop, range, sales);
  return { metrics, preset };
};

export default function AllocationPage() {
  const { metrics, preset } = useLoaderData<typeof loader>();
  const [, setSearchParams] = useSearchParams();
  const allocation = metrics.allocation;

  const setPeriod = (value: PeriodPreset) => {
    setSearchParams({ period: value });
  };

  return (
    <s-page heading="Allocation" inlineSize="large">
      <div className="mcfly-desk">
        <div className="mcfly-context">
          <p className="mcfly-context__def">
            <strong>Control panel</strong> · rules from cash MER vs break-even — not path credit
          </p>
          <div className="mcfly-alloc-chips">
            {metrics.useSampleDesk ? (
              <span className="mcfly-chip mcfly-alloc-sample-chip">Sample desk</span>
            ) : null}
            <span className="mcfly-chip">Target {formatMer(metrics.targetMer)}</span>
          </div>
        </div>

        <s-section heading="Period">
          <div className="mcfly-period" role="tablist" aria-label="Reporting period">
            {PERIOD_PRESETS.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                role="tab"
                aria-selected={preset === value}
                className={`mcfly-period__btn${preset === value ? " mcfly-period__btn--on" : ""}`}
                onClick={() => setPeriod(value)}
              >
                {label}
              </button>
            ))}
          </div>
          <s-paragraph>
            <s-text tone="neutral">{metrics.period.label}</s-text>
          </s-paragraph>
        </s-section>

        {!allocation ? (
          <s-section heading="Recommendation">
            <div className="mcfly-panel">
              <s-text tone="neutral">
                Set a valid contribution margin in{" "}
                <s-link href="/app/settings">Settings</s-link> to unlock break-even-aware allocation.
              </s-text>
            </div>
          </s-section>
        ) : (
          <>
            <s-section heading="Recommendation">
              <s-stack direction="block" gap="base">
                <div className="mcfly-hero">
                  <p className="mcfly-hero__label">Cash view</p>
                  <p className="mcfly-hero__value">{formatMer(allocation.overallMer)}</p>
                  <p className="mcfly-hero__equation">
                    {formatCurrency(allocation.inputs.totalSales)} ÷{" "}
                    {formatCurrency(allocation.inputs.totalSpend)} · break-even{" "}
                    {formatMer(allocation.breakEvenMer)}
                  </p>
                  <div className="mcfly-hero__rail">
                    <span className="mcfly-chip">
                      Test window {allocation.suggestedTestDays} days
                    </span>
                  </div>
                </div>
                <s-paragraph>
                  <s-text>{allocation.why}</s-text>
                </s-paragraph>

                {allocation.actions.map((action, index) => (
                  <div
                    className="mcfly-action"
                    key={`${action.type}-${action.channel}-${index}`}
                  >
                    <span className={`mcfly-action__type mcfly-action__type--${action.type}`}>
                      {actionLabel(action.type)}
                    </span>
                    <s-heading>
                      {action.channel !== "—" ? action.channel : "All channels"}
                      {action.percentChange != null
                        ? ` (${action.percentChange > 0 ? "+" : ""}${action.percentChange}%)`
                        : ""}
                    </s-heading>
                    <s-text tone="neutral">{action.detail}</s-text>
                  </div>
                ))}
              </s-stack>
            </s-section>

            <s-section heading="Channel efficiency">
              {allocation.inputs.channelEfficiencies.length === 0 ? (
                <s-paragraph>
                  <s-text tone="neutral">
                    No channel spend in this period.{" "}
                    <s-link href="/app/spend">Add spend</s-link>.
                  </s-text>
                </s-paragraph>
              ) : (
                <div className="mcfly-panel">
                  {allocation.inputs.channelEfficiencies.map((channel) => {
                    const share = Math.max(4, Math.round(channel.spendShare * 100));
                    return (
                      <div className="mcfly-channel" key={channel.name}>
                        <span className="mcfly-channel__name">
                          {channel.name}
                          {channel.isManual ? " · manual" : ""}
                        </span>
                        <div className="mcfly-channel__track" aria-hidden="true">
                          <div className="mcfly-channel__fill" style={{ width: `${share}%` }} />
                        </div>
                        <span className="mcfly-channel__meta">
                          {formatCurrency(channel.spend)} · MER {formatMer(channel.effectiveMer)} ·{" "}
                          {channel.efficiencyVsBreakEven != null
                            ? `${channel.efficiencyVsBreakEven.toFixed(2)}× BE`
                            : "—"}
                        </span>
                      </div>
                    );
                  })}
                  <s-paragraph>
                    <s-text tone="neutral">
                      Assumed sales per channel = spend share × Shopify sales. Cash math — not
                      multi-touch attribution.
                    </s-text>
                  </s-paragraph>
                </div>
              )}
            </s-section>
          </>
        )}
      </div>

      <s-section slot="aside" heading="How this works">
        <div className="mcfly-aside-card">
          <p className="mcfly-aside-card__title">Quiet control panel</p>
          <p>
            Overall cash MER vs break-even, then channel spend-share efficiency. Cuts prefer weak
            manual/other spend first. No pixels.
          </p>
          <p style={{ marginTop: "0.65rem" }}>
            <s-link href={`/app?period=${preset}`}>Back to Cash MER</s-link>
          </p>
        </div>
      </s-section>
    </s-page>
  );
}

function actionLabel(type: string): string {
  switch (type) {
    case "cut":
      return "Cut";
    case "shift":
      return "Shift";
    case "hold":
      return "Hold";
    case "watch":
      return "Watch";
    default:
      return type;
  }
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
