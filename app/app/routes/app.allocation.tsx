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
  if (n.includes("affiliate")) return "affiliate";
  if (n.includes("email") || n.includes("klaviyo")) return "email";
  return "other";
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);
  const url = new URL(request.url);
  const preset = parsePreset(url.searchParams.get("period"));
  const shotMode = url.searchParams.get("shot") === "1";
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
  return { metrics, preset, shotMode, useSampleDesk };
};

export default function AllocationPage() {
  const { metrics, preset, shotMode, useSampleDesk } =
    useLoaderData<typeof loader>();
  const [, setSearchParams] = useSearchParams();
  const allocation = metrics.allocation;

  const setPeriod = (value: PeriodPreset) => {
    setSearchParams(shotMode ? { period: value, shot: "1" } : { period: value });
  };

  const merDelta = allocation
    ? deltaClass(allocation.overallMer, allocation.breakEvenMer)
    : "flat";
  const targetDelta = deltaClass(metrics.mer, metrics.targetMer);
  const tillLabel = shotMode
    ? metrics.period.label
    : useSampleDesk
      ? `${metrics.period.label} · sample till`
      : `${metrics.period.label} · live Shopify till`;

  const takeaway = allocation
    ? allocation.why
    : "Set contribution margin in Settings to unlock break-even-aware allocation — rules from cash MER, not path credit.";

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

  return (
    <s-page heading={shotMode ? undefined : "Allocation"} inlineSize="large">
      <div className={shotMode ? "mcfly-desk mcfly-desk--shot" : "mcfly-desk"}>
        <header className="mcfly-topbar">
          <div>
            <h1 className="mcfly-topbar__title">Allocation</h1>
            <p className="mcfly-topbar__def">
              Rules from cash MER vs break-even · not path credit
            </p>
          </div>
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
              <span className="mcfly-ctx-chip mcfly-alloc-sample-dot">Sample desk</span>
            ) : null}
            <span className={`mcfly-ctx-chip mcfly-ctx-chip--${targetDelta}`}>
              MER {formatMer(metrics.mer)} · target {formatMer(metrics.targetMer)}
            </span>
            <span className={`mcfly-ctx-chip mcfly-ctx-chip--${merDelta}`}>
              Break-even {formatMer(metrics.breakEvenMer)}
            </span>
          </div>
        </div>

        <section className="mcfly-decision" aria-label="Allocation decision">
          <p className="mcfly-decision__kicker">
            {decisionLead
              ? `What to do · ${decisionLead}`
              : "What to do · cash rules, not attribution"}
          </p>
          <p className="mcfly-decision__takeaway">{takeaway}</p>
          <div className="mcfly-decision__actions">
            <s-button href="/app/spend" variant="primary">
              Adjust spend
            </s-button>
            <s-link href={`/app?period=${preset}`}>Back to Cash MER</s-link>
          </div>
        </section>

        {!allocation ? (
          <section className="mcfly-panel">
            <div className="mcfly-panel__head">
              <h2>Break-even required</h2>
              <p className="mcfly-panel__muted">
                Contribution margin unlocks the control panel
              </p>
            </div>
            <p className="mcfly-panel__next">
              Set a valid margin in Settings — allocation compares cash MER to
              break-even, then suggests cuts and shifts. No pixels.
            </p>
            <div className="mcfly-decision__actions">
              <s-link href="/app/settings">Open Settings</s-link>
            </div>
          </section>
        ) : (
          <>
            <section
              className="mcfly-alloc-score"
              aria-label="Cash MER versus break-even"
            >
              <div
                className={`mcfly-alloc-score__card mcfly-alloc-score__card--mer mcfly-alloc-score__card--${merDelta}`}
              >
                <p className="mcfly-alloc-score__label">Cash MER</p>
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
                  Test window {allocation.suggestedTestDays} days · rules-based —
                  not multi-touch
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
                <h2>Channel efficiency</h2>
                <p className="mcfly-panel__muted">
                  Assumed sales = spend share × Shopify sales · cash math, not MTA
                </p>
              </div>
              {allocation.inputs.channelEfficiencies.length === 0 ? (
                <div className="mcfly-guide-empty">
                  <p className="mcfly-guide-empty__title">
                    No channel spend for {metrics.period.label}
                  </p>
                  <p className="mcfly-guide-empty__copy">
                    Log Meta, Google, and the rest on{" "}
                    <s-link href="/app/spend">Spend</s-link> — then efficiency
                    bars light up here.
                  </p>
                </div>
              ) : (
                <div className="mcfly-alloc-eff">
                  {allocation.inputs.channelEfficiencies.map((channel) => {
                    const share = Math.max(
                      4,
                      Math.round(channel.spendShare * 100),
                    );
                    const fill = channelFillKey(channel.name);
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
                          {formatPercent(channel.spendShare)} spend · MER{" "}
                          {formatMer(channel.effectiveMer)}
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
