import type {
  ActionFunctionArgs,
  HeadersFunction,
  LoaderFunctionArgs,
} from "react-router";
import { useLoaderData, useSearchParams } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import { buildDashboardMetrics, ensureShop } from "../lib/mer-dashboard.server";
import { formatCurrency, formatMer, formatPercent } from "../lib/mer-format";
import { fetchShopifySales } from "../lib/shopify-sales.server";
import { PERIOD_PRESETS, resolvePeriod, type PeriodPreset } from "../lib/periods";
import {
  fetchSampleSales,
  getSampleDeskEnabled,
} from "../lib/sample-desk.server";

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
  const shotMode = url.searchParams.get("shot") === "1";
  const range = resolvePeriod(preset);
  const shop = await ensureShop(session.shop);
  const useSampleDesk = await getSampleDeskEnabled(shop.id);

  let sales;
  let salesError: string | null = null;

  if (useSampleDesk) {
    sales = await fetchSampleSales(shop.id, range);
  } else {
    try {
      sales = await fetchShopifySales(admin, range);
    } catch (err) {
      salesError = err instanceof Error ? err.message : "Failed to load Shopify sales";
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

  return {
    metrics,
    salesError,
    preset,
    useSampleDesk,
    shotMode,
  };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  await authenticate.admin(request);
  return null;
};

export default function Dashboard() {
  const { metrics, preset, salesError, useSampleDesk, shotMode } = useLoaderData<typeof loader>();
  const [, setSearchParams] = useSearchParams();

  const setPeriod = (value: PeriodPreset) => {
    setSearchParams(shotMode ? { period: value, shot: "1" } : { period: value });
  };

  const chipClass =
    metrics.aboveBreakEven === true
      ? "mcfly-chip mcfly-chip--good"
      : metrics.aboveBreakEven === false
        ? "mcfly-chip mcfly-chip--bad"
        : "mcfly-chip";

  return (
    <s-page heading="Cash MER" inlineSize="large">
      <div className={shotMode ? "mcfly-desk mcfly-desk--shot" : "mcfly-desk"}>
        {useSampleDesk && !shotMode ? (
          <s-banner tone="warning" heading="Sample desk is on">
            <s-paragraph>
              Numbers below are the 3-year demo dataset (matched sales + spend), not your live Shopify
              till. Turn it off on the <s-link href="/app/demo">Demo</s-link> tab. For listing
              captures use <s-link href="/app?period=y3&shot=1">shot mode</s-link> (hides this banner).
            </s-paragraph>
          </s-banner>
        ) : null}

        {salesError ? (
          <s-banner tone="critical" heading="Could not load Shopify sales">
            <s-paragraph>{salesError}</s-paragraph>
          </s-banner>
        ) : null}

        <header className="mcfly-topbar">
          <div>
            <h1 className="mcfly-topbar__title">Marketing Efficiency Ratio</h1>
            <p className="mcfly-topbar__def">
              Cash MER · Shopify sales ÷ ad spend · not platform ROAS
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

        <p className="mcfly-asof">
          {metrics.period.label}
          {shotMode ? "" : useSampleDesk ? " · sample till" : " · live Shopify till"}
        </p>

        {metrics.onboarding.showGuide && !shotMode ? (
          <section className="mcfly-guide" aria-label="First Cash MER setup">
            <div className="mcfly-guide__head">
              <p className="mcfly-guide__title">Your first Cash MER takes two inputs</p>
              <p className="mcfly-guide__sub">
                Sales come from Shopify automatically. You bring margin and spend — no
                pixels, no tags, no code.
              </p>
            </div>
            <ol className="mcfly-guide__steps">
              <li
                className={
                  metrics.onboarding.settingsSaved
                    ? "mcfly-guide__step mcfly-guide__step--done"
                    : "mcfly-guide__step"
                }
              >
                <span className="mcfly-guide__n" aria-hidden="true">
                  {metrics.onboarding.settingsSaved ? "✓" : "1"}
                </span>
                <div className="mcfly-guide__body">
                  <p className="mcfly-guide__step-title">Confirm your margin</p>
                  <p className="mcfly-guide__step-copy">
                    Gross margin sets your break-even MER — the line between printing
                    cash and burning it.
                  </p>
                  {metrics.onboarding.settingsSaved ? (
                    <p className="mcfly-guide__step-state">
                      Saved · break-even {formatMer(metrics.breakEvenMer)}
                    </p>
                  ) : (
                    <s-link href="/app/settings">Open Settings</s-link>
                  )}
                </div>
              </li>
              <li
                className={
                  metrics.onboarding.hasSpend
                    ? "mcfly-guide__step mcfly-guide__step--done"
                    : "mcfly-guide__step"
                }
              >
                <span className="mcfly-guide__n" aria-hidden="true">
                  {metrics.onboarding.hasSpend ? "✓" : "2"}
                </span>
                <div className="mcfly-guide__body">
                  <p className="mcfly-guide__step-title">Log your ad spend</p>
                  <p className="mcfly-guide__step-copy">
                    Upload a CSV or type totals by channel — Meta, Google, TikTok, the
                    rest.
                  </p>
                  {metrics.onboarding.hasSpend ? (
                    <p className="mcfly-guide__step-state">
                      Logged · {formatCurrency(metrics.totalSpend)} this period
                    </p>
                  ) : (
                    <s-link href="/app/spend">Add spend</s-link>
                  )}
                </div>
              </li>
              <li className="mcfly-guide__step mcfly-guide__step--wait">
                <span className="mcfly-guide__n" aria-hidden="true">
                  3
                </span>
                <div className="mcfly-guide__body">
                  <p className="mcfly-guide__step-title">Read your Cash MER</p>
                  <p className="mcfly-guide__step-copy">
                    Shopify sales ÷ ad spend lights up below the moment both inputs are
                    in. Above break-even means the whole engine makes money.
                  </p>
                </div>
              </li>
            </ol>
            <p className="mcfly-guide__foot">
              Want to see it working first?{" "}
              <s-link href="/app/demo">Load the sample desk</s-link> — 3 years of matched
              sales and spend.
            </p>
          </section>
        ) : null}

        <section className="mcfly-score">
          <div className="mcfly-score__mer">
            <p className="mcfly-hero__label">Cash MER</p>
            <p
              className={
                metrics.mer === null
                  ? "mcfly-hero__value mcfly-hero__value--pending"
                  : "mcfly-hero__value"
              }
            >
              {metrics.mer === null ? "—.——" : formatMer(metrics.mer)}
            </p>
            <div className="mcfly-hero__rail">
              <span className={chipClass}>
                {metrics.mer === null
                  ? "Add spend to unlock MER"
                  : metrics.aboveBreakEven === true
                    ? `Above break-even ${formatMer(metrics.breakEvenMer)}`
                    : metrics.aboveBreakEven === false
                      ? `Below break-even ${formatMer(metrics.breakEvenMer)}`
                      : `Break-even ${formatMer(metrics.breakEvenMer)}`}
              </span>
              <span className="mcfly-chip">Target {formatMer(metrics.targetMer)}</span>
            </div>
          </div>

          <div className="mcfly-score__breakdown">
            <div className="mcfly-breakdown-row">
              <span>Total sales</span>
              <strong>{formatCurrency(metrics.sales)}</strong>
            </div>
            <div className="mcfly-breakdown-row mcfly-breakdown-row--div">
              <span>÷ Total spend</span>
              <strong>{formatCurrency(metrics.totalSpend)}</strong>
            </div>
            <div className="mcfly-breakdown-row mcfly-breakdown-row--eq">
              <span>= Cash MER</span>
              <strong>{formatMer(metrics.mer)}</strong>
            </div>
            <dl className="mcfly-substats">
              <div className="mcfly-substats__item">
                <dt>Orders</dt>
                <dd>{metrics.orderCount.toLocaleString()}</dd>
              </div>
              <div className="mcfly-substats__item">
                <dt>AOV</dt>
                <dd>
                  {metrics.orderCount > 0
                    ? formatCurrency(metrics.sales / metrics.orderCount)
                    : "—"}
                </dd>
              </div>
              {metrics.customerMetricsAvailable ? (
                <>
                  <div className="mcfly-substats__item">
                    <dt>New</dt>
                    <dd>{metrics.newCustomers.toLocaleString()}</dd>
                  </div>
                  <div className="mcfly-substats__item">
                    <dt>Returning</dt>
                    <dd>{metrics.returningCustomers.toLocaleString()}</dd>
                  </div>
                </>
              ) : null}
            </dl>
            <p className="mcfly-breakdown-note">
              {formatPercent(metrics.marginPct)} margin → break-even{" "}
              {formatMer(metrics.breakEvenMer)}
            </p>
          </div>
        </section>

        <s-section heading="Spend by channel">
          {metrics.totalSpend > 0 ? (
            <div className="mcfly-panel">
              {metrics.channelMix
                .filter(({ amount }) => amount > 0)
                .map(({ channel, amount, share }) => (
                  <div className="mcfly-channel" key={channel}>
                    <span className="mcfly-channel__name">{channelLabel(channel)}</span>
                    <div className="mcfly-channel__track" aria-hidden="true">
                      <div
                        className={`mcfly-channel__fill mcfly-channel__fill--${channel}`}
                        style={{ width: `${Math.max(4, Math.round(share * 100))}%` }}
                      />
                    </div>
                    <span className="mcfly-channel__meta">
                      {formatCurrency(amount)} · {formatPercent(share)}
                    </span>
                  </div>
                ))}
            </div>
          ) : (
            <div className="mcfly-guide-empty">
              <p className="mcfly-guide-empty__title">
                No spend logged for {metrics.period.label}
              </p>
              <p className="mcfly-guide-empty__copy">
                {useSampleDesk ? (
                  <>
                    The sample desk has no spend in this window — try a wider period, or{" "}
                    <s-link href="/app/demo">reseed the demo data</s-link>.
                  </>
                ) : (
                  <>
                    One CSV upload — or typed totals per channel — and the mix appears
                    here. <s-link href="/app/spend">Add spend</s-link>.
                  </>
                )}
              </p>
            </div>
          )}
        </s-section>

        {metrics.allocation ? (
          <s-section heading="What to do next">
            <s-paragraph>
              <s-text>{metrics.allocation.why}</s-text>
            </s-paragraph>
            <s-link href={`/app/allocation?period=${preset}`}>Open allocation</s-link>
          </s-section>
        ) : null}
      </div>
    </s-page>
  );
}

function channelLabel(channel: string): string {
  switch (channel) {
    case "meta":
      return "Meta Ads";
    case "google":
      return "Google Ads";
    case "microsoft":
      return "Microsoft Ads";
    case "tiktok":
      return "TikTok Ads";
    case "affiliate":
      return "Affiliate";
    case "email":
      return "Email";
    default:
      return "Other";
  }
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
