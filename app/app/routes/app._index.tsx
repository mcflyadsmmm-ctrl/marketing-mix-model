import type {
  ActionFunctionArgs,
  HeadersFunction,
  LoaderFunctionArgs,
} from "react-router";
import { useLoaderData, useSearchParams } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import {
  buildDashboardMetrics,
  ensureShop,
  type DailySpineDay,
} from "../lib/mer-dashboard.server";
import {
  formatCurrency,
  formatFreshness,
  formatMer,
  formatPercent,
} from "../lib/mer-format";
import {
  fetchShopifySales,
  fetchShopifySalesByDay,
} from "../lib/shopify-sales.server";
import {
  PERIOD_PRESETS,
  resolvePeriod,
  resolvePriorPeriod,
  type PeriodPreset,
} from "../lib/periods";
import {
  fetchSampleSales,
  fetchSampleSalesByDay,
  getSampleDeskEnabled,
} from "../lib/sample-desk.server";
import {
  SPEND_CHANNEL_LABELS,
  type SpendChannel,
} from "@mcfly/mer-engine";

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

function pctDeltaClass(pct: number | null): "up" | "down" | "flat" {
  if (pct == null || Math.abs(pct) < 0.5) return "flat";
  return pct > 0 ? "up" : "down";
}

function merAbsDeltaClass(abs: number | null): "up" | "down" | "flat" {
  if (abs == null || Math.abs(abs) < 0.01) return "flat";
  return abs > 0 ? "up" : "down";
}

function formatPctDelta(pct: number | null): string {
  if (pct == null) return "vs prior —";
  const sign = pct > 0 ? "+" : "";
  return `${sign}${pct.toFixed(0)}% vs prior`;
}

function formatMerAbsDelta(abs: number | null): string {
  if (abs == null) return "vs prior —";
  const sign = abs > 0 ? "+" : "";
  return `${sign}${abs.toFixed(2)}× vs prior`;
}

function decisionTakeaway(metrics: {
  mer: number | null;
  targetMer: number;
  breakEvenMer: number | null;
  aboveBreakEven: boolean | null;
  sales: number;
  totalSpend: number;
  control: { projMer: number | null; railOk: boolean } | null;
}): string {
  const target = metrics.targetMer;
  const { mer } = metrics;
  if (mer == null) {
    return "Add spend to unlock cash MER — Shopify sales are on the till; the scoreboard needs the other half.";
  }
  const bits: string[] = [];
  const proj = metrics.control?.projMer ?? null;
  if (metrics.control?.railOk) {
    bits.push(
      `Protect the ${formatMer(target)} rail · MER ${formatMer(mer)} · EOM projected ${formatMer(proj)}`,
    );
  } else if (metrics.aboveBreakEven) {
    bits.push(
      `Above break-even but below ${formatMer(target)} · MER ${formatMer(mer)} · EOM ${formatMer(proj)} — tighten mix before month close`,
    );
  } else {
    bits.push(
      `Below break-even ${formatMer(metrics.breakEvenMer)} · MER ${formatMer(mer)} · EOM ${formatMer(proj)} — reallocate or cut`,
    );
  }
  if (metrics.sales > 0 && target > 0) {
    const headroom = metrics.sales / target - metrics.totalSpend;
    bits.push(
      headroom >= 0
        ? `${formatCurrency(headroom)} safe-spend headroom at the rail`
        : `${formatCurrency(Math.abs(headroom))} over target-safe spend`,
    );
  }
  return bits.join(" · ");
}

type DecisionVerb = {
  label: string;
  href: string;
  primary: boolean;
};

function decisionVerbs(
  metrics: {
    mer: number | null;
    allocation: {
      actions: Array<{
        type: "cut" | "shift" | "hold" | "watch";
        channel: string;
        percentChange?: number;
      }>;
    } | null;
  },
  preset: PeriodPreset,
): DecisionVerb[] {
  const allocHref = `/app/allocation?period=${preset}`;
  if (metrics.mer == null) {
    return [
      { label: "Add spend", href: "/app/spend", primary: true },
      { label: "Open allocation", href: allocHref, primary: false },
    ];
  }

  const action = metrics.allocation?.actions[0];
  if (!action) {
    return [
      { label: "Open allocation", href: allocHref, primary: true },
      { label: "Log spend", href: "/app/spend", primary: false },
    ];
  }

  const channel = action.channel && action.channel !== "—" ? action.channel : "mix";
  const pct =
    action.percentChange != null
      ? ` ${action.percentChange > 0 ? "+" : ""}${action.percentChange}%`
      : "";

  let label: string;
  switch (action.type) {
    case "cut":
      label = `Cut ${channel}${pct}`;
      break;
    case "shift":
      label = `Shift toward ${channel}${pct}`;
      break;
    case "hold":
      label = `Hold ${channel}`;
      break;
    case "watch":
      label = "Watch mix";
      break;
    default: {
      const _exhaustive: never = action.type;
      void _exhaustive;
      label = "Open allocation";
    }
  }

  return [
    { label, href: allocHref, primary: true },
    { label: "Log spend", href: "/app/spend", primary: false },
  ];
}

function spineSubtitle(
  spine: DailySpineDay[],
  targetMer: number,
): string {
  const spendDays = spine.filter((d) => d.spend > 0).length;
  const railDays = spine.filter((d) => d.aboveTarget === true).length;
  if (spendDays === 0) {
    return `Cash MER = sales ÷ spend · closed days only · dashed rail = ${formatMer(targetMer)} target`;
  }
  return `${railDays} of ${spendDays} spend days ≥ the ${formatMer(targetMer)} rail · closed days only`;
}

function stackMaxSpend(spine: DailySpineDay[]): number {
  let max = 0;
  for (const day of spine) {
    if (day.spend > max) max = day.spend;
  }
  return max > 0 ? max : 1;
}

function merRailTop(spine: DailySpineDay[], targetMer: number): number {
  let max = targetMer > 0 ? targetMer : 1;
  for (const day of spine) {
    if (day.mer != null && day.mer > max) max = day.mer;
  }
  return max * 1.08;
}

type ChannelAction = {
  type: "cut" | "shift" | "hold" | "watch";
  percentChange?: number;
};

function channelActionMap(
  actions:
    | Array<{
        type: "cut" | "shift" | "hold" | "watch";
        channel: string;
        percentChange?: number;
      }>
    | undefined,
): Map<SpendChannel, ChannelAction> {
  const map = new Map<SpendChannel, ChannelAction>();
  if (!actions) return map;
  const labelToChannel = new Map<string, SpendChannel>();
  for (const [key, label] of Object.entries(SPEND_CHANNEL_LABELS) as Array<
    [SpendChannel, string]
  >) {
    labelToChannel.set(label.toLowerCase(), key);
    labelToChannel.set(key.toLowerCase(), key);
  }
  for (const action of actions) {
    if (action.type === "watch") continue;
    const key = labelToChannel.get(action.channel.toLowerCase());
    if (!key) continue;
    // Prefer cut over shift/hold when both mention a channel
    const existing = map.get(key);
    if (existing?.type === "cut") continue;
    map.set(key, {
      type: action.type,
      percentChange: action.percentChange,
    });
  }
  return map;
}

function actionBadgeLabel(action: ChannelAction): string {
  const pct =
    action.percentChange != null
      ? ` ${action.percentChange > 0 ? "+" : ""}${action.percentChange}%`
      : "";
  switch (action.type) {
    case "cut":
      return `Cut${pct}`;
    case "shift":
      return `Shift${pct}`;
    case "hold":
      return "Hold";
    case "watch":
      return "Watch";
    default: {
      const _exhaustive: never = action.type;
      return _exhaustive;
    }
  }
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);
  const url = new URL(request.url);
  const preset = parsePreset(url.searchParams.get("period"));
  const shotMode = url.searchParams.get("shot") === "1";
  const range = resolvePeriod(preset);
  const priorRange = resolvePriorPeriod(preset);
  const shop = await ensureShop(session.shop);
  const useSampleDesk = await getSampleDeskEnabled(shop.id);

  let sales;
  let priorSales = { totalSales: 0 };
  let salesError: string | null = null;
  let salesByDay = new Map<string, number>();

  // Spine window: last 14 closed local days (exclude incomplete today)
  const spineEnd = new Date();
  spineEnd.setHours(0, 0, 0, 0);
  spineEnd.setDate(spineEnd.getDate() - 1);
  spineEnd.setHours(23, 59, 59, 999);
  const spineStart = new Date(spineEnd);
  spineStart.setHours(0, 0, 0, 0);
  spineStart.setDate(spineStart.getDate() - 13);
  const spineRange = {
    start: spineStart,
    end: spineEnd,
    label: "14 closed days",
  };

  if (useSampleDesk) {
    const [sampleSales, samplePrior] = await Promise.all([
      fetchSampleSales(shop.id, range),
      fetchSampleSales(shop.id, priorRange),
    ]);
    sales = sampleSales;
    priorSales = { totalSales: samplePrior.totalSales };
    salesByDay = await fetchSampleSalesByDay(shop.id, spineRange);
  } else {
    try {
      const [liveSales, livePrior] = await Promise.all([
        fetchShopifySales(admin, range),
        fetchShopifySales(admin, priorRange).catch(() => ({
          totalSales: 0,
          orderCount: 0,
          newCustomers: 0,
          returningCustomers: 0,
          guestOrders: 0,
          customerMetricsAvailable: false,
          source: "shopify" as const,
        })),
      ]);
      sales = liveSales;
      priorSales = { totalSales: livePrior.totalSales };
      try {
        salesByDay = await fetchShopifySalesByDay(admin, spineRange);
      } catch {
        salesByDay = new Map();
      }
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

  const metrics = await buildDashboardMetrics(session.shop, range, sales, {
    salesByDay,
    priorSales,
    priorRange,
  });

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
  const { metrics, preset, salesError, useSampleDesk, shotMode } =
    useLoaderData<typeof loader>();
  const [, setSearchParams] = useSearchParams();

  const setPeriod = (value: PeriodPreset) => {
    setSearchParams(shotMode ? { period: value, shot: "1" } : { period: value });
  };

  const merDelta = deltaClass(metrics.mer, metrics.targetMer);
  const beDelta = deltaClass(metrics.mer, metrics.breakEvenMer);
  const takeaway = decisionTakeaway(metrics);
  const verbs = decisionVerbs(metrics, preset);
  const tillLabel = shotMode
    ? metrics.period.label
    : useSampleDesk
      ? `${metrics.period.label} · sample till`
      : `${metrics.period.label} · live Shopify till`;
  const freshLabel = metrics.freshness.lastAt
    ? formatFreshness(metrics.freshness.lastAt)
    : "Live desk";

  const spine = metrics.dailySpine ?? [];
  const control = metrics.control;
  const deltas = metrics.deltas;
  const maxSpend = stackMaxSpend(spine);
  const merCeil = merRailTop(spine, metrics.targetMer);
  const targetRailPct =
    merCeil > 0 ? Math.min(100, (metrics.targetMer / merCeil) * 100) : 0;
  const stackHasSpend = spine.some((d) => d.spend > 0);
  const headroomMonth = control?.headroomMonth ?? 0;
  const headroomPeriod = control?.headroomPeriod ?? 0;
  const headroomDay = control?.headroomDay ?? 0;
  const projDelta = deltaClass(control?.projMer ?? null, metrics.targetMer);
  const actionsByChannel = channelActionMap(metrics.allocation?.actions);

  const merDeltaLine = [
    `Target ${formatMer(metrics.targetMer)}`,
    metrics.breakEvenMer != null ? `BE ${formatMer(metrics.breakEvenMer)}` : null,
    deltas ? formatMerAbsDelta(deltas.merAbs) : null,
  ]
    .filter(Boolean)
    .join(" · ");

  const salesDeltaLine = deltas
    ? formatPctDelta(deltas.salesPct)
    : metrics.orderCount > 0
      ? `${metrics.orderCount.toLocaleString()} orders · AOV ${formatCurrency(metrics.sales / metrics.orderCount)}`
      : `${metrics.orderCount.toLocaleString()} orders`;

  const spendDeltaLine = deltas
    ? formatPctDelta(deltas.spendPct)
    : (control?.densityLabel ?? metrics.period.label);

  return (
    <s-page heading={shotMode ? undefined : "Cash MER"} inlineSize="large">
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

        <div className="mcfly-ctx" aria-live="polite">
          <div className="mcfly-ctx__main">
            <span className="mcfly-ctx__brand">Cash MER</span>
            <span className="mcfly-ctx__sep" aria-hidden="true">
              ·
            </span>
            <span className="mcfly-ctx__asof">{tillLabel}</span>
          </div>
          <div className="mcfly-ctx__chips">
            <span className={`mcfly-ctx-chip mcfly-ctx-chip--${merDelta}`}>
              MER {formatMer(metrics.mer)} · target {formatMer(metrics.targetMer)}
            </span>
            <span className={`mcfly-ctx-chip mcfly-ctx-chip--${beDelta}`}>
              BE {formatMer(metrics.breakEvenMer)}
              {metrics.aboveBreakEven === true
                ? " · above"
                : metrics.aboveBreakEven === false
                  ? " · below"
                  : ""}
            </span>
            <span className="mcfly-ctx-chip mcfly-ctx-chip--flat">{freshLabel}</span>
          </div>
        </div>

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

        <section className="mcfly-decision" aria-label="Cash MER decision">
          <p className="mcfly-decision__kicker">
            Cash MER scoreboard · not platform ROAS
          </p>
          <p className="mcfly-decision__takeaway">{takeaway}</p>
          <div className="mcfly-decision__actions">
            {verbs.map((verb) =>
              verb.primary ? (
                <s-button key={verb.label} href={verb.href} variant="primary">
                  {verb.label}
                </s-button>
              ) : (
                <s-link key={verb.label} href={verb.href}>
                  {verb.label}
                </s-link>
              ),
            )}
          </div>
        </section>

        <section className="mcfly-kpi-grid" aria-label="Cash MER KPIs">
          <div className="mcfly-kpi mcfly-kpi--lead">
            <p className="mcfly-kpi__label">Cash MER</p>
            <p className="mcfly-kpi__value">
              {metrics.mer === null ? "—.——" : formatMer(metrics.mer)}
            </p>
            <p
              className={`mcfly-kpi__delta mcfly-kpi__delta--${
                deltas ? merAbsDeltaClass(deltas.merAbs) : merDelta
              }`}
            >
              {merDeltaLine}
            </p>
          </div>
          <div className="mcfly-kpi">
            <p className="mcfly-kpi__label">Sales</p>
            <p className="mcfly-kpi__value">{formatCurrency(metrics.sales)}</p>
            <p
              className={`mcfly-kpi__delta mcfly-kpi__delta--${
                deltas ? pctDeltaClass(deltas.salesPct) : "flat"
              }`}
            >
              {salesDeltaLine}
            </p>
          </div>
          <div className="mcfly-kpi">
            <p className="mcfly-kpi__label">Spend</p>
            <p className="mcfly-kpi__value">{formatCurrency(metrics.totalSpend)}</p>
            <p className="mcfly-kpi__delta mcfly-kpi__delta--flat">
              {spendDeltaLine}
            </p>
          </div>
          <div className="mcfly-kpi">
            <p className="mcfly-kpi__label">EOM projected MER</p>
            <p className="mcfly-kpi__value">
              {control?.projMer == null ? "—.——" : formatMer(control.projMer)}
            </p>
            <p className={`mcfly-kpi__delta mcfly-kpi__delta--${projDelta}`}>
              {control
                ? `${control.railOk ? "On pace ≥ " : "Below "}${formatMer(metrics.targetMer)} · ${formatCurrency(control.projSales)} sales`
                : `Target ${formatMer(metrics.targetMer)}`}
            </p>
          </div>
        </section>

        {control && !shotMode ? (
          <section
            className="mcfly-panel mcfly-control"
            aria-label="Safe spend control"
          >
            <div className="mcfly-panel__head">
              <h2>Control panel</h2>
              <p className="mcfly-panel__muted">
                {metrics.period.label} pace · target {formatMer(metrics.targetMer)} ·{" "}
                {control.statusLabel}
              </p>
            </div>
            <div className="mcfly-control__grid">
              <div className="mcfly-control__tile">
                <p className="mcfly-control__k">Safe spend headroom @ rail</p>
                <p
                  className={`mcfly-control__v${
                    headroomPeriod >= 0
                      ? " mcfly-control__v--good"
                      : " mcfly-control__v--bad"
                  }`}
                >
                  {formatCurrency(Math.abs(headroomPeriod))}
                </p>
                <p className="mcfly-control__delta">
                  {headroomPeriod >= 0 ? "headroom" : "over target-safe spend"} · period
                </p>
              </div>
              <div className="mcfly-control__tile">
                <p className="mcfly-control__k">Projected close headroom</p>
                <p
                  className={`mcfly-control__v${
                    headroomMonth > 0
                      ? " mcfly-control__v--good"
                      : " mcfly-control__v--bad"
                  }`}
                >
                  {headroomMonth > 0 ? formatCurrency(headroomMonth) : "$0"}
                </p>
                <p className="mcfly-control__delta">
                  pace-forward · {control.remainingDays} days left
                </p>
              </div>
              <div className="mcfly-control__tile">
                <p className="mcfly-control__k">Safe headroom / day left</p>
                <p className="mcfly-control__v">
                  {headroomDay > 0 && control.remainingDays > 0
                    ? formatCurrency(headroomDay)
                    : "—"}
                </p>
                <p className="mcfly-control__delta">at {formatMer(metrics.targetMer)} rail</p>
              </div>
              <div className="mcfly-control__tile">
                <p className="mcfly-control__k">Days elapsed</p>
                <p className="mcfly-control__v">{control.densityLabel}</p>
                <p className="mcfly-control__delta">
                  projected MER {formatMer(control.projMer)}
                  {control.railOk ? " · on rail" : " · below rail"}
                </p>
              </div>
              <div className="mcfly-control__tile mcfly-control__tile--action">
                <p className="mcfly-control__k">Control action</p>
                <p className="mcfly-control__v mcfly-control__v--action">
                  {control.railOk
                    ? "Scale only within headroom"
                    : `Cut/freeze spend until pace ≥ ${formatMer(metrics.targetMer)}`}
                </p>
              </div>
            </div>

            <div className="mcfly-pace" aria-label="Sales vs calendar pace">
              <div className="mcfly-pace__row">
                <span>Sales vs target pace</span>
                <span>{Math.round(control.salesProgressPct)}%</span>
              </div>
              <div className="mcfly-pace__track">
                <div
                  className={`mcfly-pace__fill mcfly-pace__fill--${control.progressCls}`}
                  style={{ width: `${Math.round(control.salesProgressPct)}%` }}
                />
                <span
                  className="mcfly-pace__tick"
                  style={{ left: `${Math.round(control.calendarProgressPct)}%` }}
                  title={`Calendar ${Math.round(control.calendarProgressPct)}%`}
                  aria-hidden="true"
                />
              </div>
              <div className="mcfly-pace__row mcfly-pace__row--cal">
                <span>Calendar progress</span>
                <span>{Math.round(control.calendarProgressPct)}%</span>
              </div>
              <div className="mcfly-pace__track mcfly-pace__track--cal">
                <div
                  className="mcfly-pace__fill mcfly-pace__fill--cal"
                  style={{ width: `${Math.round(control.calendarProgressPct)}%` }}
                />
              </div>
              <p className="mcfly-pace__needed">
                Daily sales needed{" "}
                <strong>
                  {control.remainingDays > 0
                    ? formatCurrency(control.dailySalesNeeded)
                    : "—"}
                </strong>
                {control.remainingDays > 0
                  ? ` · ${control.remainingDays} days left to hold ${formatMer(metrics.targetMer)}`
                  : " · period closed"}
              </p>
            </div>
          </section>
        ) : null}

        <section
          className="mcfly-panel mcfly-stack"
          aria-label="14-day channel stack"
        >
          <div className="mcfly-panel__head">
            <h2>14-day channel stack</h2>
            <p className="mcfly-panel__muted">
              {spineSubtitle(spine, metrics.targetMer)}
            </p>
          </div>
          {stackHasSpend ? (
            <>
              <div className="mcfly-stack__chart">
                <div className="mcfly-stack__cols" role="list">
                  {spine.map((day) => {
                    const barH = Math.max(
                      2,
                      Math.round((day.spend / maxSpend) * 100),
                    );
                    const merPct =
                      day.mer != null
                        ? Math.min(100, (day.mer / merCeil) * 100)
                        : null;
                    return (
                      <div
                        className="mcfly-stack__col"
                        role="listitem"
                        key={day.dateKey}
                        title={
                          day.mer != null
                            ? `${day.label}: MER ${formatMer(day.mer)} · ${formatCurrency(day.sales)} ÷ ${formatCurrency(day.spend)}`
                            : `${day.label}: ${formatCurrency(day.spend)} spend`
                        }
                      >
                        <div className="mcfly-stack__mer">
                          {day.mer != null ? formatMer(day.mer) : "—"}
                        </div>
                        <div className="mcfly-stack__plot">
                          {merPct != null ? (
                            <span
                              className={`mcfly-stack__dot${
                                day.aboveTarget
                                  ? " mcfly-stack__dot--up"
                                  : " mcfly-stack__dot--down"
                              }`}
                              style={{ bottom: `${merPct}%` }}
                              aria-hidden="true"
                            />
                          ) : null}
                          <div
                            className="mcfly-stack__bar"
                            style={{ height: `${barH}%` }}
                          >
                            {day.channels.map(({ channel, amount }) => (
                              <span
                                key={channel}
                                className={`mcfly-stack__seg mcfly-stack__seg--${channel}`}
                                style={{
                                  flexGrow: amount,
                                  flexBasis: 0,
                                }}
                                title={`${channelLabel(channel)}: ${formatCurrency(amount)}`}
                              />
                            ))}
                          </div>
                        </div>
                        <div className="mcfly-stack__label">{day.label}</div>
                      </div>
                    );
                  })}
                </div>
                <div
                  className="mcfly-stack__rail"
                  style={{
                    bottom: `calc(1.35rem + ${(targetRailPct / 100) * 8.5}rem)`,
                  }}
                  aria-hidden="true"
                >
                  <span className="mcfly-stack__rail-label">
                    {formatMer(metrics.targetMer)}
                  </span>
                </div>
              </div>
              <ul className="mcfly-stack__legend">
                {legendChannels(spine).map((channel) => (
                  <li key={channel}>
                    <i
                      className={`mcfly-stack__swatch mcfly-stack__seg--${channel}`}
                      aria-hidden="true"
                    />
                    {channelLabel(channel)}
                  </li>
                ))}
                <li>
                  <i
                    className="mcfly-stack__swatch mcfly-stack__swatch--rail"
                    aria-hidden="true"
                  />
                  Target {formatMer(metrics.targetMer)}
                </li>
              </ul>
            </>
          ) : (
            <div className="mcfly-guide-empty">
              <p className="mcfly-guide-empty__title">
                No channel spend in the last 14 closed days
              </p>
              <p className="mcfly-guide-empty__copy">
                {useSampleDesk ? (
                  <>
                    Try a wider period after reseeding, or{" "}
                    <s-link href="/app/demo">open Demo</s-link>.
                  </>
                ) : (
                  <>
                    Log daily CSV rows (or sync) and the stack lights up.{" "}
                    <s-link href="/app/spend">Add spend</s-link>.
                  </>
                )}
              </p>
            </div>
          )}
        </section>

        <section
          className={`mcfly-panel mcfly-panel--eq${shotMode ? " mcfly-panel--eq-compact" : ""}`}
          aria-label="Sales divided by spend"
        >
          <div className="mcfly-panel__head">
            <h2>Sales ÷ spend</h2>
            <p className="mcfly-panel__muted">The definition — not platform ROAS</p>
          </div>
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
          {!shotMode && metrics.customerMetricsAvailable ? (
            <dl className="mcfly-substats">
              <div className="mcfly-substats__item">
                <dt>New</dt>
                <dd>{metrics.newCustomers.toLocaleString()}</dd>
              </div>
              <div className="mcfly-substats__item">
                <dt>Returning</dt>
                <dd>{metrics.returningCustomers.toLocaleString()}</dd>
              </div>
            </dl>
          ) : null}
        </section>

        {!shotMode ? (
          <section className="mcfly-panel">
            <div className="mcfly-panel__head">
              <h2>Spend by channel</h2>
              <p className="mcfly-panel__muted">{metrics.period.label}</p>
            </div>
            {metrics.totalSpend > 0 ? (
              <div>
                {metrics.channelMix
                  .filter(({ amount }) => amount > 0)
                  .map(({ channel, amount, share }) => {
                    const action = actionsByChannel.get(channel);
                    return (
                      <div className="mcfly-channel" key={channel}>
                        <span className="mcfly-channel__name">
                          {channelLabel(channel)}
                          {action ? (
                            <span
                              className={`mcfly-channel__badge mcfly-channel__badge--${action.type}`}
                            >
                              {actionBadgeLabel(action)}
                            </span>
                          ) : null}
                        </span>
                        <div className="mcfly-channel__track" aria-hidden="true">
                          <div
                            className={`mcfly-channel__fill mcfly-channel__fill--${channel}`}
                            style={{
                              width: `${Math.max(4, Math.round(share * 100))}%`,
                            }}
                          />
                        </div>
                        <span className="mcfly-channel__meta">
                          {formatCurrency(amount)} · {formatPercent(share)}
                        </span>
                      </div>
                    );
                  })}
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
          </section>
        ) : null}

        {metrics.allocation && !shotMode ? (
          <section className="mcfly-panel">
            <div className="mcfly-panel__head">
              <h2>What to do next</h2>
              <p className="mcfly-panel__muted">Rules-based allocation — not attribution</p>
            </div>
            <p className="mcfly-panel__next">{metrics.allocation.why}</p>
            <div className="mcfly-decision__actions">
              <s-link href={`/app/allocation?period=${preset}`}>Open allocation</s-link>
            </div>
          </section>
        ) : null}
      </div>
    </s-page>
  );
}

function legendChannels(spine: DailySpineDay[]): SpendChannel[] {
  const present = new Set<SpendChannel>();
  for (const day of spine) {
    for (const { channel, amount } of day.channels) {
      if (amount > 0) present.add(channel);
    }
  }
  return (["meta", "google", "microsoft", "tiktok", "affiliate", "email", "other"] as SpendChannel[]).filter(
    (c) => present.has(c),
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
