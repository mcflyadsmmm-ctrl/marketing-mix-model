import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { useLoaderData, useSearchParams } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import {
  buildDashboardMetrics,
  formatCurrency,
  formatMer,
  formatPercent,
} from "../lib/mer-dashboard.server";
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
  try {
    sales = await fetchShopifySales(admin, range);
  } catch {
    sales = { totalSales: 0, orderCount: 0, source: "shopify" as const };
  }

  const metrics = await buildDashboardMetrics(session.shop, range, sales);
  return {
    metrics,
    preset:
      preset === "mtd" || preset === "qtd" || preset === "ytd" ? preset : "mtd",
  };
};

export default function AllocationPage() {
  const { metrics, preset } = useLoaderData<typeof loader>();
  const [, setSearchParams] = useSearchParams();
  const allocation = metrics.allocation;

  const setPeriod = (value: PeriodPreset) => {
    setSearchParams({ period: value });
  };

  return (
    <s-page heading="Allocation">
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

      {!allocation ? (
        <s-section heading="Recommendation">
          <s-paragraph>
            <s-text tone="neutral">
              Set a valid contribution margin in{" "}
              <s-link href="/app/settings">Settings</s-link> to unlock
              break-even-aware allocation.
            </s-text>
          </s-paragraph>
        </s-section>
      ) : (
        <>
          <s-section heading="Recommendation">
            <s-stack direction="block" gap="base">
              <s-paragraph>
                <s-text>{allocation.why}</s-text>
              </s-paragraph>
              <s-text tone="neutral">
                Suggested test window: {allocation.suggestedTestDays} days
              </s-text>

              {allocation.actions.map((action, index) => (
                <s-box
                  key={`${action.type}-${action.channel}-${index}`}
                  padding="base"
                  borderWidth="base"
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
                    <s-text>{action.detail}</s-text>
                  </s-stack>
                </s-box>
              ))}
            </s-stack>
          </s-section>

          <s-section heading="Auditable inputs">
            <s-stack direction="block" gap="base">
              <s-text>
                Total sales: {formatCurrency(allocation.inputs.totalSales)}
              </s-text>
              <s-text>
                Total spend: {formatCurrency(allocation.inputs.totalSpend)}
              </s-text>
              <s-text>
                Overall MER: {formatMer(allocation.overallMer)} · Break-even:{" "}
                {formatMer(allocation.breakEvenMer)}
              </s-text>
              <s-paragraph>
                <s-text tone="neutral">
                  Assumed sales per channel = spend share × total Shopify sales
                  (unless you later supply a manual sales contribution). This is
                  cash math — not multi-touch attribution.
                </s-text>
              </s-paragraph>
            </s-stack>
          </s-section>

          <s-section heading="Channel efficiency (cash view)">
            {allocation.inputs.channelEfficiencies.length === 0 ? (
              <s-paragraph>
                <s-text tone="neutral">
                  No channel spend in this period.{" "}
                  <s-link href="/app/spend">Add spend</s-link>.
                </s-text>
              </s-paragraph>
            ) : (
              <s-stack direction="block" gap="base">
                {allocation.inputs.channelEfficiencies.map((channel) => (
                  <s-box
                    key={channel.name}
                    padding="base"
                    borderWidth="base"
                    borderRadius="base"
                  >
                    <s-stack direction="block" gap="small">
                      <s-heading>
                        {channel.name}
                        {channel.isManual ? " (manual)" : ""}
                      </s-heading>
                      <s-text>
                        Spend {formatCurrency(channel.spend)} · Share{" "}
                        {formatPercent(channel.spendShare)}
                      </s-text>
                      <s-text>
                        Assumed sales {formatCurrency(channel.assumedSales)} ·
                        Eff. MER {formatMer(channel.effectiveMer)}
                      </s-text>
                      <s-text tone="neutral">
                        vs break-even:{" "}
                        {channel.efficiencyVsBreakEven != null
                          ? `${channel.efficiencyVsBreakEven.toFixed(2)}×`
                          : "—"}
                      </s-text>
                    </s-stack>
                  </s-box>
                ))}
              </s-stack>
            )}
          </s-section>
        </>
      )}

      <s-section slot="aside" heading="How this works">
        <s-paragraph>
          Allocation uses overall cash MER vs break-even MER, then ranks channels
          by spend-share efficiency. Cuts prefer weak manual/other spend first.
          No pixels or path credit.
        </s-paragraph>
        <s-paragraph>
          <s-link href={`/app?period=${preset}`}>Back to dashboard</s-link>
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

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
