import type {
  ActionFunctionArgs,
  HeadersFunction,
  LoaderFunctionArgs,
} from "react-router";
import { useLoaderData, useNavigation } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import { CashTrustBanners } from "../components/CashTrustBanners";
import { PeriodControl } from "../components/PeriodControl";
import {
  SpendExplorer,
  type SpendExplorerSeriesView,
} from "../components/SpendExplorer";
import {
  buildDashboardMetrics,
  buildSpendExplorerSeries,
  ensureShop,
  type DailySpineDay,
} from "../lib/mer-dashboard.server";
import {
  formatCurrency,
  formatMer,
  formatPercent,
} from "../lib/mer-format";
import { formatCashFreshnessChip } from "../lib/mer-trust";
import {
  emptySales,
  fetchShopifySales,
  fetchShopifySalesByDay,
  shopLocalDayKey,
  shopLocalDayRange,
  type SalesResult,
} from "../lib/shopify-sales.server";
import {
  runSalesFactsBackfill,
  getSalesFactsCoverage,
  getSalesFactsTotals,
  getSalesFactsByDay,
} from "../lib/sales-facts.server";
import {
  parsePeriodPreset,
  periodMayExceedShopifyOrderWindow,
  resolvePeriod,
  resolvePriorPeriod,
  type PeriodPreset,
  type DateRange,
} from "../lib/periods";
import {
  fetchSampleSales,
  fetchSampleSalesByDay,
  getSampleDeskEnabled,
} from "../lib/sample-desk.server";
import {
  parseExplorerGranularity,
  parseExplorerMode,
  parseExplorerRange,
  resolveExplorerWindow,
} from "../lib/spend-explorer";
import {
  SPEND_CHANNEL_LABELS,
  type SpendChannel,
} from "@mcfly/mer-engine";

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

/** Today so far in shop IANA tz (midnight → now). Facts never cover the open day. */
function todayPartialRange(now: Date, ianaTimezone: string): DateRange {
  const dayKey = shopLocalDayKey(now, ianaTimezone);
  const day = shopLocalDayRange(dayKey, ianaTimezone);
  return { start: day.start, end: now, label: "Today (partial)" };
}

function decisionTakeaway(metrics: {
  mer: number | null;
  targetMer: number;
  breakEvenMer: number | null;
  aboveBreakEven: boolean | null;
  sales: number;
  totalSpend: number;
  control: { projMer: number | null; railOk: boolean } | null;
  onboarding: { settingsSaved: boolean };
}): string {
  const target = metrics.targetMer;
  const { mer } = metrics;
  if (mer == null) {
    if (!metrics.onboarding.settingsSaved || metrics.breakEvenMer == null) {
      return "Set contribution margin so break-even MER can lock — then add spend to unlock cash MER.";
    }
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
    breakEvenMer: number | null;
    allocation: {
      actions: Array<{
        type: "cut" | "shift" | "hold" | "watch";
        channel: string;
        percentChange?: number;
      }>;
    } | null;
    onboarding: { settingsSaved: boolean };
  },
  preset: PeriodPreset,
): DecisionVerb[] {
  const allocHref = `/app/allocation?period=${preset}`;
  if (metrics.mer == null) {
    // Margin before spend when both are missing — Settings owns the first CTA.
    if (!metrics.onboarding.settingsSaved || metrics.breakEvenMer == null) {
      return [
        {
          label: "Set contribution margin",
          href: "/app/settings",
          primary: true,
        },
        { label: "Add spend", href: "/app/spend", primary: false },
      ];
    }
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
  const preset = parsePeriodPreset(url.searchParams.get("period"));
  const shotMode = url.searchParams.get("shot") === "1";
  const exRange = parseExplorerRange(url.searchParams.get("exRange"));
  const exGran = parseExplorerGranularity(url.searchParams.get("exGran"));
  const exMode = parseExplorerMode(url.searchParams.get("exMode"));
  const range = resolvePeriod(preset);
  const priorRange = resolvePriorPeriod(preset);
  const shop = await ensureShop(session.shop);
  const useSampleDesk = await getSampleDeskEnabled(shop.id);

  let sales: SalesResult = emptySales("shopify");
  let priorSales = { totalSales: 0 };
  let salesError: string | null = null;
  let salesByDay = new Map<string, number>();
  let explorerCustomers = {
    newCustomers: 0,
    returningCustomers: 0,
    customerMetricsAvailable: false,
  };

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

  const explorerWindow = resolveExplorerWindow(exRange);
  // Fetch the wider window so spine + explorer share one by-day pull.
  const dayFetchRange = {
    start:
      explorerWindow.start < spineRange.start
        ? explorerWindow.start
        : spineRange.start,
    end:
      explorerWindow.end > spineRange.end ? explorerWindow.end : spineRange.end,
    label: explorerWindow.label,
  };

  const salesPulledAt = new Date().toISOString();

  if (useSampleDesk) {
    const [sampleSales, samplePrior, sampleExplorer] = await Promise.all([
      fetchSampleSales(shop.id, range),
      fetchSampleSales(shop.id, priorRange),
      fetchSampleSales(shop.id, {
        start: explorerWindow.start,
        end: explorerWindow.end,
        label: explorerWindow.label,
      }),
    ]);
    sales = sampleSales;
    priorSales = { totalSales: samplePrior.totalSales };
    salesByDay = await fetchSampleSalesByDay(shop.id, dayFetchRange);
    explorerCustomers = {
      newCustomers: sampleExplorer.newCustomers,
      returningCustomers: sampleExplorer.returningCustomers,
      customerMetricsAvailable: sampleExplorer.customerMetricsAvailable,
    };
  } else {
    // Facts-first: metadata sync + a bounded backfill resume (small maxDays — this
    // must never turn a desk page load into a long-running Shopify crawl). Best-effort:
    // errors here just mean ingest resumes on the next auth callback / desk load.
    try {
      await runSalesFactsBackfill(admin, shop.id);
    } catch {
      // ignore — facts coverage below naturally falls back to live
    }

    let mainCoverage = { expectedClosedDays: 0, factDays: 0, complete: false };
    let dayCoverage = { expectedClosedDays: 0, factDays: 0, complete: false };
    try {
      [mainCoverage, dayCoverage] = await Promise.all([
        getSalesFactsCoverage(shop.id, range),
        getSalesFactsCoverage(shop.id, dayFetchRange),
      ]);
    } catch {
      // Coverage read failed — both stay incomplete, live path below covers it.
    }

    let usedFactsForTotals = false;
    if (mainCoverage.complete) {
      try {
        const factsTotals = await getSalesFactsTotals(shop.id, range);
        // Facts only cover closed days. Top up "today so far" only when we know
        // the shop IANA timezone — never invent server-local midnight.
        const ianaTimezone = shop.ianaTimezone;
        let todaySales: SalesResult | null = null;
        if (ianaTimezone) {
          const now = new Date();
          const todayKey = shopLocalDayKey(now, ianaTimezone);
          const todayBounds = shopLocalDayRange(todayKey, ianaTimezone);
          const includesOpenToday = range.end >= todayBounds.start;
          if (includesOpenToday) {
            todaySales = await fetchShopifySales(
              admin,
              todayPartialRange(now, ianaTimezone),
            ).catch(() => null);
          }
        }
        sales = {
          totalSales: factsTotals.totalSales + (todaySales?.totalSales ?? 0),
          orderCount: factsTotals.orderCount + (todaySales?.orderCount ?? 0),
          newCustomers: 0,
          returningCustomers: 0,
          guestOrders: 0,
          // Per-day new/returning sums are not a unique cross-period count —
          // never present a facts-derived total as having live customer metrics.
          customerMetricsAvailable: false,
          source: "shopify" as const,
        };
        usedFactsForTotals = true;
      } catch {
        usedFactsForTotals = false;
      }
    }

    if (!usedFactsForTotals) {
      try {
        sales = await fetchShopifySales(admin, range);
      } catch (err) {
        salesError = err instanceof Error ? err.message : "Failed to load Shopify sales";
        // Honest empty till — never fall back to mockSales as live Shopify.
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

    try {
      const livePrior = await fetchShopifySales(admin, priorRange);
      priorSales = { totalSales: livePrior.totalSales };
    } catch {
      priorSales = { totalSales: 0 };
    }

    let usedFactsForDay = false;
    if (dayCoverage.complete) {
      try {
        salesByDay = await getSalesFactsByDay(shop.id, dayFetchRange);
        explorerCustomers = {
          newCustomers: 0,
          returningCustomers: 0,
          customerMetricsAvailable: false,
        };
        usedFactsForDay = true;
      } catch {
        usedFactsForDay = false;
      }
    }

    if (!usedFactsForDay) {
      try {
        salesByDay = await fetchShopifySalesByDay(admin, dayFetchRange);
      } catch {
        salesByDay = new Map();
      }
      try {
        const liveExplorer = await fetchShopifySales(admin, {
          start: explorerWindow.start,
          end: explorerWindow.end,
          label: explorerWindow.label,
        });
        explorerCustomers = {
          newCustomers: liveExplorer.newCustomers,
          returningCustomers: liveExplorer.returningCustomers,
          customerMetricsAvailable: liveExplorer.customerMetricsAvailable,
        };
      } catch {
        // keep defaults — explorer just shows without cost-per-customer stats
      }
    }
  }

  const metrics = await buildDashboardMetrics(session.shop, range, sales, {
    salesByDay,
    priorSales,
    priorRange,
    salesPulledAt: salesError ? null : salesPulledAt,
  });

  const explorerSeries = await buildSpendExplorerSeries(shop.id, {
    sampleOnly: useSampleDesk,
    excludeSample: !useSampleDesk,
    salesByDay,
    window: explorerWindow,
    granularity: exGran,
    mode: exMode,
    targetMer: metrics.targetMer,
    newCustomers: explorerCustomers.newCustomers,
    returningCustomers: explorerCustomers.returningCustomers,
    customerMetricsAvailable: explorerCustomers.customerMetricsAvailable,
  });

  const explorer: SpendExplorerSeriesView = {
    buckets: explorerSeries.buckets,
    summary: explorerSeries.summary,
    mode: explorerSeries.mode,
    granularity: explorerSeries.granularity,
    range: exRange,
    windowLabel: explorerWindow.label,
    targetMer: explorerSeries.targetMer,
  };

  return {
    metrics,
    salesError,
    preset,
    useSampleDesk,
    shotMode,
    explorer,
  };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  await authenticate.admin(request);
  return null;
};

export default function Dashboard() {
  const { metrics, preset, salesError, useSampleDesk, shotMode, explorer } =
    useLoaderData<typeof loader>();
  const navigation = useNavigation();
  const isLoading = navigation.state === "loading";

  const merDelta = deltaClass(metrics.mer, metrics.targetMer);
  const beDelta = deltaClass(metrics.mer, metrics.breakEvenMer);
  const takeaway = decisionTakeaway(metrics);
  const verbs = decisionVerbs(metrics, preset);
  // Never label mock / blocked sales as live Shopify when sample is off.
  const tillLabel = shotMode
    ? metrics.period.label
    : useSampleDesk
      ? `${metrics.period.label} · sample till`
      : metrics.blockedMockAsLive || metrics.salesSource === "mock"
        ? `${metrics.period.label} · till unavailable`
        : `${metrics.period.label} · live Shopify till`;
  const freshLabel = formatCashFreshnessChip({
    useSampleDesk,
    salesPulledAt: metrics.freshness.salesPulledAt,
    lastAt: metrics.freshness.lastAt,
    source: metrics.freshness.source,
    spendUpdatedAt: metrics.freshness.spendUpdatedAt,
  });

  const spine = metrics.dailySpine ?? [];
  const control = metrics.control;
  const deltas = metrics.deltas;
  const maxSpend = stackMaxSpend(spine);
  const merCeil = merRailTop(spine, metrics.targetMer);
  const targetRailPct =
    merCeil > 0 ? Math.min(100, (metrics.targetMer / merCeil) * 100) : 0;
  const stackHasSpend = spine.some((d) => d.spend > 0);
  /** Margin unconfirmed or break-even unset — Settings before spend. */
  const marginBlocked =
    (!metrics.onboarding.settingsSaved || metrics.breakEvenMer == null) &&
    !useSampleDesk &&
    !shotMode;
  /** Live install, no spend yet — Polaris Empty owns the body; scoreboard waits. */
  const spendBlocked =
    !metrics.onboarding.hasSpend && !useSampleDesk && !shotMode;
  /** Both missing: one empty with Settings primary (do not let spend swallow margin). */
  const bothBlockedEmpty = marginBlocked && spendBlocked;
  /** Spend missing, margin OK. */
  const spendOnlyEmpty = spendBlocked && !marginBlocked;
  /** Margin missing, spend present — empty owns the body; scoreboard waits. */
  const marginOnlyEmpty = marginBlocked && !spendBlocked;
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
      <div
        className={
          shotMode
            ? "mcfly-desk mcfly-desk--shot"
            : isLoading
              ? "mcfly-desk mcfly-desk--loading"
              : "mcfly-desk"
        }
      >
        {useSampleDesk && !shotMode ? (
          <s-banner tone="warning" heading="Sample desk is on — not live Shopify">
            <s-paragraph>
              Numbers below are the 3-year demo dataset (matched sales + spend), not your live
              Shopify till. Turn sample desk <strong>OFF</strong> on the{" "}
              <s-link href="/app/demo">Demo</s-link> tab before App Store review or install smoke.
              Listing captures may use <code>?shot=1</code> (hides this banner only — metrics stay
              sample until OFF).
            </s-paragraph>
          </s-banner>
        ) : null}

        <CashTrustBanners
          blockedMockAsLive={Boolean(metrics.blockedMockAsLive)}
          spendCoverage={
            !useSampleDesk && metrics.onboarding.hasSpend
              ? metrics.spendCoverage
              : null
          }
          periodLabel={metrics.period.label}
          shopifyOrderWindowLimited={
            !useSampleDesk &&
            periodMayExceedShopifyOrderWindow(metrics.period)
          }
          shotMode={shotMode}
        />

        {isLoading && !shotMode ? (
          <section className="mcfly-state mcfly-state--loading" aria-live="polite">
            <p className="mcfly-state__copy">Refreshing the cash till for this period…</p>
          </section>
        ) : null}

        {salesError && !shotMode ? (
          <section
            className="mcfly-state mcfly-state--critical"
            aria-label="Sales load error"
          >
            <p className="mcfly-state__copy">
              Shopify sales didn’t load — Cash MER needs the till half of sales ÷ spend.
            </p>
            <div className="mcfly-state__cta">
              <s-button href={`/app?period=${preset}`} variant="primary">
                Retry
              </s-button>
            </div>
          </section>
        ) : null}

        {marginOnlyEmpty ? (
          <s-section accessibilityLabel="Empty state — set contribution margin for break-even MER">
            <s-grid gap="base" justifyItems="center" paddingBlock="large-400">
              <s-grid justifyItems="center" maxInlineSize="450px" gap="base">
                <s-stack alignItems="center">
                  <s-heading>Set contribution margin to lock break-even</s-heading>
                  <s-paragraph>
                    Sales and spend are already on the till. Cash MER is Shopify
                    sales ÷ ad spend — not platform ROAS. Confirm margin so
                    break-even MER can lock, and the scoreboard lights up with the
                    line between printing cash and burning it.
                  </s-paragraph>
                </s-stack>
                <s-button-group>
                  <s-button
                    slot="primary-action"
                    variant="primary"
                    href="/app/settings"
                    aria-label="Set contribution margin"
                  >
                    Set contribution margin
                  </s-button>
                  <s-button
                    slot="secondary-actions"
                    href="/app/spend"
                    aria-label="Review logged spend"
                  >
                    Review spend
                  </s-button>
                </s-button-group>
              </s-grid>
            </s-grid>
          </s-section>
        ) : null}

        <header className="mcfly-topbar">
          <div>
            <p className="mcfly-topbar__def mcfly-topbar__def--solo">
              Cash MER · Shopify sales ÷ ad spend · not platform ROAS
            </p>
          </div>
          <PeriodControl preset={preset} shotMode={shotMode} />
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

        {bothBlockedEmpty ? (
          <s-section accessibilityLabel="Empty state — set contribution margin for Cash MER">
            <s-grid gap="base" justifyItems="center" paddingBlock="large-400">
              <s-grid justifyItems="center" maxInlineSize="450px" gap="base">
                <s-stack alignItems="center">
                  <s-heading>Set contribution margin first</s-heading>
                  <s-paragraph>
                    Cash MER is Shopify sales ÷ ad spend for the same period — not
                    platform ROAS. Confirm margin so break-even MER can lock, then log
                    spend — most merchants light the scoreboard in under 10 minutes.
                  </s-paragraph>
                </s-stack>
                <s-button-group>
                  <s-button
                    slot="primary-action"
                    variant="primary"
                    href="/app/settings"
                    aria-label="Set contribution margin"
                  >
                    Set contribution margin
                  </s-button>
                  <s-button
                    slot="secondary-actions"
                    href="/app/spend"
                    aria-label="Add ad spend"
                  >
                    Add spend
                  </s-button>
                </s-button-group>
              </s-grid>
            </s-grid>
            <p className="mcfly-guide__foot">
              Want to see a filled desk first?{" "}
              <s-link href="/app/demo">Load the sample desk</s-link> — 3 years of
              matched sales and spend.
            </p>
          </s-section>
        ) : null}

        {spendOnlyEmpty ? (
          <s-section accessibilityLabel="Empty state — add spend for Cash MER">
            <s-grid gap="base" justifyItems="center" paddingBlock="large-400">
              <s-grid justifyItems="center" maxInlineSize="450px" gap="base">
                <s-stack alignItems="center">
                  <s-heading>Add spend to unlock Cash MER</s-heading>
                  <s-paragraph>
                    Cash MER is Shopify sales ÷ ad spend for the same period — not
                    platform ROAS. Sales are already on the till; log spend to light
                    the scoreboard.
                  </s-paragraph>
                </s-stack>
                <s-button-group>
                  <s-button
                    slot="primary-action"
                    variant="primary"
                    href="/app/spend"
                    aria-label="Add ad spend"
                  >
                    Add spend
                  </s-button>
                  <s-button
                    slot="secondary-actions"
                    href="/app/settings"
                    aria-label="Open Settings for break-even margin"
                  >
                    Settings
                  </s-button>
                </s-button-group>
              </s-grid>
            </s-grid>
            <p className="mcfly-guide__foot">
              Want to see a filled desk first?{" "}
              <s-link href="/app/demo">Load the sample desk</s-link> — 3 years of
              matched sales and spend.
            </p>
          </s-section>
        ) : null}

        {metrics.onboarding.showGuide &&
        !shotMode &&
        !spendBlocked &&
        !marginBlocked ? (
          <section className="mcfly-guide" aria-label="First Cash MER setup">
            <div className="mcfly-guide__head">
              <p className="mcfly-guide__title">Your first Cash MER takes under 10 minutes</p>
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

        {!spendBlocked && !marginBlocked ? (
          <>
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
            <p className="mcfly-kpi__formula">Shopify sales ÷ ad spend</p>
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

        <details
          className="mcfly-explore-mix"
          {...(shotMode ? { open: true } : {})}
        >
          <summary className="mcfly-explore-mix__summary">
            Explore spend mix
          </summary>
          <div className="mcfly-explore-mix__body">
        {!shotMode && metrics.totalSpend > 0
          ? (() => {
              const aov =
                metrics.orderCount > 0
                  ? metrics.sales / metrics.orderCount
                  : null;
              const costNew =
                metrics.customerMetricsAvailable && metrics.newCustomers > 0
                  ? metrics.totalSpend / metrics.newCustomers
                  : null;
              const customers =
                metrics.newCustomers + metrics.returningCustomers;
              const costCust =
                metrics.customerMetricsAvailable && customers > 0
                  ? metrics.totalSpend / customers
                  : null;
              const showRatio =
                metrics.customerMetricsAvailable &&
                (metrics.newCustomers > 0 || metrics.returningCustomers > 0);
              if (
                aov == null &&
                costNew == null &&
                costCust == null &&
                !showRatio
              ) {
                return null;
              }
              return (
                <ul className="mcfly-unit-econ" aria-label="Unit economics">
                  {aov != null ? (
                    <li className="mcfly-unit-econ__chip">
                      <span className="mcfly-unit-econ__k">AOV</span>
                      <span className="mcfly-unit-econ__v">
                        {formatCurrency(aov)}
                      </span>
                    </li>
                  ) : null}
                  {costNew != null ? (
                    <li className="mcfly-unit-econ__chip">
                      <span className="mcfly-unit-econ__k">Cost / new</span>
                      <span className="mcfly-unit-econ__v">
                        {formatCurrency(costNew)}
                      </span>
                    </li>
                  ) : null}
                  {costCust != null ? (
                    <li className="mcfly-unit-econ__chip">
                      <span className="mcfly-unit-econ__k">Cost / customer</span>
                      <span className="mcfly-unit-econ__v">
                        {formatCurrency(costCust)}
                      </span>
                    </li>
                  ) : null}
                  {showRatio ? (
                    <li className="mcfly-unit-econ__chip">
                      <span className="mcfly-unit-econ__k">New : returning</span>
                      <span className="mcfly-unit-econ__v">
                        {metrics.newCustomers.toLocaleString()} :{" "}
                        {metrics.returningCustomers.toLocaleString()}
                      </span>
                    </li>
                  ) : null}
                </ul>
              );
            })()
          : null}

        <SpendExplorer
          series={explorer}
          period={preset}
          shotMode={shotMode}
        />

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
          className="mcfly-panel mcfly-stack mcfly-stack--compact"
          aria-label="14-day channel stack"
        >
          <div className="mcfly-panel__head">
            <h2>14-day channel stack</h2>
            <p className="mcfly-panel__muted">
              Compact daily mix · {spineSubtitle(spine, metrics.targetMer)}
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
          aria-label="Shopify sales divided by ad spend"
        >
          <div className="mcfly-panel__head">
            <h2>Shopify sales ÷ ad spend</h2>
            <p className="mcfly-panel__muted">The only formula — not platform ROAS</p>
          </div>
          <div className="mcfly-breakdown-row">
            <span>Shopify sales</span>
            <strong>{formatCurrency(metrics.sales)}</strong>
          </div>
          <div className="mcfly-breakdown-row mcfly-breakdown-row--div">
            <span>÷ Ad spend</span>
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
              <section
                className="mcfly-state mcfly-state--empty"
                aria-label="No channel spend"
              >
                <p className="mcfly-state__copy">
                  {useSampleDesk
                    ? `No spend in ${metrics.period.label} on the sample desk — widen the period or reseed.`
                    : `No spend for ${metrics.period.label} — log channels to light the mix.`}
                </p>
                <div className="mcfly-state__cta">
                  {useSampleDesk ? (
                    <s-button href="/app/demo" variant="primary">
                      Open Demo
                    </s-button>
                  ) : (
                    <s-button href="/app/spend" variant="primary">
                      Add spend
                    </s-button>
                  )}
                </div>
              </section>
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
        </details>
          </>
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
