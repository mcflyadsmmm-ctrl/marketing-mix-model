import type {
  ActionFunctionArgs,
  HeadersFunction,
  LoaderFunctionArgs,
} from "react-router";
import { Form, useLoaderData, useSearchParams } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import { buildDashboardMetrics } from "../lib/mer-dashboard.server";
import { formatCurrency, formatMer, formatPercent } from "../lib/mer-format";
import { fetchShopifySales } from "../lib/shopify-sales.server";
import { PERIOD_PRESETS, resolvePeriod, type PeriodPreset } from "../lib/periods";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);
  const url = new URL(request.url);
  const preset = (url.searchParams.get("period") ?? "mtd") as PeriodPreset;
  const range = resolvePeriod(
    PERIOD_PRESETS.some((p) => p.value === preset) ? preset : "mtd",
  );

  let sales;
  let salesError: string | null = null;
  try {
    sales = await fetchShopifySales(admin, range);
  } catch (err) {
    salesError = err instanceof Error ? err.message : "Failed to load Shopify sales";
    sales = { totalSales: 0, orderCount: 0, source: "shopify" as const };
  }

  const metrics = await buildDashboardMetrics(session.shop, range, sales);

  return {
    metrics,
    salesError,
    preset: preset === "mtd" || preset === "qtd" || preset === "ytd" ? preset : "mtd",
  };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  await authenticate.admin(request);
  return null;
};

export default function Dashboard() {
  const { metrics, preset, salesError } = useLoaderData<typeof loader>();
  const [, setSearchParams] = useSearchParams();

  const setPeriod = (value: PeriodPreset) => {
    setSearchParams({ period: value });
  };

  return (
    <s-page heading="MER Dashboard">
      {salesError ? (
        <s-banner tone="critical" heading="Could not load Shopify sales">
          <s-paragraph>{salesError}. Showing $0 sales until Admin API succeeds — not mock data.</s-paragraph>
        </s-banner>
      ) : null}
      <s-section heading="Period">
        <s-stack direction="inline" gap="base">
          {PERIOD_PRESETS.map(({ value, label }) => (
            <s-button
              key={value}
              variant={preset === value ? "primary" : "secondary"}
              onClick={() => setPeriod(value)}
            >
              {label}
            </s-button>
          ))}
        </s-stack>
        <s-paragraph>
          <s-text tone="neutral">{metrics.period.label}</s-text>
        </s-paragraph>
      </s-section>

      <s-section heading="Cash truth (spend vs sales)">
        <s-stack direction="block" gap="large">
          <s-stack direction="inline" gap="large">
            <MetricCard
              label="Shopify sales"
              value={formatCurrency(metrics.sales)}
              hint={`${metrics.orderCount} orders`}
            />
            <MetricCard
              label="Ad spend (manual)"
              value={formatCurrency(metrics.totalSpend)}
              hint="From your spend entries"
            />
            <MetricCard
              label="MER"
              value={formatMer(metrics.mer)}
              hint="Sales ÷ spend"
              highlight={
                metrics.aboveBreakEven === true
                  ? "success"
                  : metrics.aboveBreakEven === false
                    ? "critical"
                    : undefined
              }
            />
            <MetricCard
              label="Break-even MER"
              value={formatMer(metrics.breakEvenMer)}
              hint={`${formatPercent(metrics.marginPct)} margin`}
            />
          </s-stack>

          <s-box padding="base" borderWidth="base" borderRadius="base" background="subdued">
            <s-paragraph>
              <s-text>
                Target MER: <strong>{formatMer(metrics.targetMer)}</strong>
                {" · "}
                {metrics.aboveBreakEven === true && "Above break-even — room to scale"}
                {metrics.aboveBreakEven === false && "Below break-even — tighten spend or improve margin"}
                {metrics.aboveBreakEven === null && "Add spend entries to compute MER"}
              </s-text>
            </s-paragraph>
          </s-box>
        </s-stack>
      </s-section>

      <s-section heading="Channel mix (spend)">
        {metrics.totalSpend > 0 ? (
          <s-stack direction="block" gap="base">
            {metrics.channelMix.map(({ channel, amount, share }) => (
              <s-stack key={channel} direction="inline" gap="base">
                <s-text>{channelLabel(channel)}</s-text>
                <s-text>{formatCurrency(amount)}</s-text>
                <s-text tone="neutral">{formatPercent(share)}</s-text>
              </s-stack>
            ))}
          </s-stack>
        ) : (
          <s-paragraph>
            <s-text tone="neutral">
              No spend recorded for this period.{" "}
              <s-link href="/app/spend">Add spend entries</s-link>.
            </s-text>
          </s-paragraph>
        )}
      </s-section>

      {metrics.allocation && (
        <s-section heading="Allocation recommendation">
          <s-box padding="base" borderWidth="base" borderRadius="base">
            <s-stack direction="block" gap="base">
              <s-paragraph>
                <s-text>{metrics.allocation.why}</s-text>
              </s-paragraph>

              {metrics.allocation.actions.map((action, index) => (
                <s-box
                  key={`${action.type}-${action.channel}-${index}`}
                  padding="base"
                  background="subdued"
                  borderRadius="base"
                >
                  <s-stack direction="block" gap="small">
                    <s-heading>
                      {actionLabel(action.type)}
                      {action.channel !== "—" ? ` · ${action.channel}` : ""}
                      {action.percentChange != null
                        ? ` (${action.percentChange > 0 ? "+" : ""}${action.percentChange}%)`
                        : ""}
                    </s-heading>
                    <s-text tone="neutral">{action.detail}</s-text>
                  </s-stack>
                </s-box>
              ))}

              <s-box padding="base" background="subdued" borderRadius="base">
                <s-stack direction="block" gap="small">
                  <s-text tone="neutral">Auditable inputs (cash view)</s-text>
                  <s-text>
                    Sales {formatCurrency(metrics.allocation.inputs.totalSales)}
                    {" · "}
                    Spend {formatCurrency(metrics.allocation.inputs.totalSpend)}
                    {" · "}
                    MER {formatMer(metrics.allocation.overallMer)}
                    {" · "}
                    Break-even {formatMer(metrics.allocation.breakEvenMer)}
                  </s-text>
                  <s-text tone="neutral">
                    Test window: {metrics.allocation.suggestedTestDays} days · Rules-based
                    from spend vs sales — not path attribution
                  </s-text>
                </s-stack>
              </s-box>

              <s-link href={`/app/allocation?period=${preset}`}>
                View allocation detail
              </s-link>
            </s-stack>
          </s-box>
        </s-section>
      )}

      <s-section slot="aside" heading="Anti-attribution">
        <s-paragraph>
          Mcfly measures only cash: what you spent on ads vs what Shopify recorded
          as sales. No pixels, no path credit, no platform ROAS theater.
        </s-paragraph>
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

function channelLabel(channel: string): string {
  switch (channel) {
    case "meta":
      return "Meta";
    case "google":
      return "Google";
    default:
      return "Other";
  }
}

function MetricCard({
  label,
  value,
  hint,
  highlight,
}: {
  label: string;
  value: string;
  hint?: string;
  highlight?: "success" | "critical";
}) {
  return (
    <s-box padding="base" borderWidth="base" borderRadius="base">
      <s-stack direction="block" gap="small">
        <s-text tone="neutral">{label}</s-text>
        <s-heading>{value}</s-heading>
        {hint && (
          <s-text tone={highlight === "critical" ? "critical" : highlight === "success" ? "success" : "neutral"}>
            {hint}
          </s-text>
        )}
      </s-stack>
    </s-box>
  );
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
