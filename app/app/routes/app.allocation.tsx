import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { useEffect, useState } from "react";
import { useLoaderData, useNavigation } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import {
  SPEND_CHANNEL_LABELS,
  type SpendChannel,
} from "@mcfly/mer-engine";
import { authenticate } from "../shopify.server";
import { CashTrustBanners } from "../components/CashTrustBanners";
import { PeriodControl } from "../components/PeriodControl";
import { SampleDeskBanner } from "../components/SampleDeskBanner";
import {
  buildAllocationHistoryView,
  buildWindowSets,
  capHistoryDays,
  compareSpendShares,
  defaultWindowGrain,
  filterDaysByDateKeys,
  HISTORY_QUARTER_DAYS_CAP,
  resolveHistoryWindow,
  selectWindowsForGrain,
  shiftDateKey,
  WINDOW_GRAINS,
  windowGrainLabel,
  windowScopeCaption,
  type AllocationHistoryView,
  type HistoryDay,
  type RollingWindowTile,
  type SpendShareDiff,
  type TopWindowAllocation,
  type WindowGrain,
  type WindowSets,
} from "../lib/allocation-history";
import {
  buildDailyRowsForWindow,
  buildDashboardMetrics,
  ensureShop,
  getOrCreateSettings,
} from "../lib/mer-dashboard.server";
import { channelCssVar, channelFillKey } from "../lib/channel-fill";
import { formatCurrency, formatMer, formatPercent } from "../lib/mer-format";
import { PRODUCT_NOUN } from "../lib/product-labels";
import { parseSalesBasis } from "../lib/sales-basis";
import type { SalesResult } from "../lib/shopify-sales.server";
import {
  getSalesFactsByDay,
  loadDeskSalesForPeriod,
  salesFactsBlockLock,
} from "../lib/sales-facts.server";
import {
  deskPeriodTimeZone,
  parsePeriodPreset,
  resolvePeriod,
} from "../lib/periods";
import { shopLocalDayKey } from "../lib/shop-local-day";
import {
  fetchSampleSales,
  fetchSampleSalesByDay,
  getSampleDeskEnabled,
  localDayKey,
} from "../lib/sample-desk.server";

function historyChannelLabel(channel: string): string {
  return SPEND_CHANNEL_LABELS[channel as SpendChannel] ?? channel;
}

function toHistoryDays(
  rows: Array<{
    dateKey: string;
    sales: number;
    spend: number;
    channels: Array<{ channel: string; amount: number }>;
  }>,
): HistoryDay[] {
  return rows.map((r) => ({
    dateKey: r.dateKey,
    sales: r.sales,
    spend: r.spend,
    channels: r.channels.map((c) => ({
      channel: historyChannelLabel(c.channel),
      amount: c.amount,
    })),
  }));
}

type PeriodChannelRow = {
  name: string;
  spend: number;
  share: number;
  fill: string;
};

function buildPeriodChannelRows(
  channels: Array<{ name: string; spend: number; spendShare: number }>,
): PeriodChannelRow[] {
  return channels
    .filter((c) => c.spend > 0)
    .map((c) => ({
      name: c.name,
      spend: c.spend,
      share: c.spendShare,
      fill: channelFillKey(c.name),
    }))
    .sort((a, b) => b.spend - a.spend);
}

function buildPeriodChannelRowsFromMix(
  mix: Array<{ channel: string; amount: number; share: number }>,
): PeriodChannelRow[] {
  return mix
    .filter((c) => c.amount > 0)
    .map((c) => {
      const name = historyChannelLabel(c.channel);
      return {
        name,
        spend: c.amount,
        share: c.share,
        fill: channelFillKey(name),
      };
    })
    .sort((a, b) => b.spend - a.spend);
}

function deltaVsLabel(priorLabel: string | undefined): string {
  if (!priorLabel) return "prior";
  const label = priorLabel.trim();
  if (/^prior ytd$/i.test(label)) return "YoY";
  if (label.length > 32) return `${label.slice(0, 29)}…`;
  return label;
}

function formatPctDelta(pct: number | null, priorLabel?: string): string {
  const vs = deltaVsLabel(priorLabel);
  if (pct == null) return vs === "YoY" ? "YoY —" : `vs ${vs} —`;
  const sign = pct > 0 ? "+" : "";
  if (vs === "YoY") return `${sign}${pct.toFixed(0)}% YoY`;
  return `${sign}${pct.toFixed(0)}% vs ${vs}`;
}

function deltaTone(pct: number | null): "up" | "down" | "flat" {
  if (pct == null || Math.abs(pct) < 0.5) return "flat";
  return pct > 0 ? "up" : "down";
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);
  const url = new URL(request.url);
  const preset = parsePeriodPreset(url.searchParams.get("period"));
  const shotMode = url.searchParams.get("shot") === "1";
  const shop = await ensureShop(session.shop);
  const now = new Date();
  const useSampleDesk = await getSampleDeskEnabled(shop.id);
  const deskTz = deskPeriodTimeZone(useSampleDesk, shop.ianaTimezone);
  const range = resolvePeriod(preset, now, deskTz);

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

  const metrics = await buildDashboardMetrics(session.shop, range, sales, {
    salesBasis: parseSalesBasis(
      (await getOrCreateSettings(shop.id)).salesBasis,
      "total",
    ),
  });

  /*
   * Portfolio history (~L12M / 365 closed days): best week/month/quarter/year
   * windows by Total ROAS, rolling 7/14/28 vs prior. Facts / sample only.
   */
  const histTz = deskTz;
  const l12m = resolvePeriod("l12m", now, histTz);
  const histWindow = resolveHistoryWindow(l12m, HISTORY_QUARTER_DAYS_CAP);
  const todayKey = histTz
    ? shopLocalDayKey(now, histTz)
    : localDayKey(now);
  const asOfDateKey = shiftDateKey(todayKey, -1);

  let history: AllocationHistoryView | null = null;
  const emptyWindowSets = (): WindowSets => ({
    week: [],
    month: [],
    quarter: [],
    year: [],
  });
  let windowSets: { period: WindowSets; lookback: WindowSets } = {
    period: emptyWindowSets(),
    lookback: emptyWindowSets(),
  };
  try {
    const salesByDay = useSampleDesk
      ? await fetchSampleSalesByDay(shop.id, histWindow)
      : await getSalesFactsByDay(shop.id, histWindow);
    const dailyRows = await buildDailyRowsForWindow(shop.id, {
      sampleOnly: useSampleDesk,
      excludeSample: !useSampleDesk,
      salesByDay,
      windowStart: histWindow.start,
      windowEnd: histWindow.end,
      timeZone: histTz,
    });
    const historyDays = capHistoryDays(
      toHistoryDays(dailyRows),
      HISTORY_QUARTER_DAYS_CAP,
    );
    const periodStartKey = histTz
      ? shopLocalDayKey(range.start, histTz)
      : localDayKey(range.start);
    const periodEndKey = histTz
      ? shopLocalDayKey(range.end, histTz)
      : localDayKey(range.end);
    const periodDays = filterDaysByDateKeys(
      historyDays,
      periodStartKey,
      periodEndKey,
    );
    windowSets = {
      period: buildWindowSets(periodDays),
      lookback: buildWindowSets(historyDays),
    };
    const allocationForHist = salesError ? null : metrics.allocation;
    const nowChannelSpend =
      allocationForHist?.inputs.channelEfficiencies.map((c) => ({
        channel: c.name,
        amount: c.spend,
      })) ?? [];
    const primaryForHist = allocationForHist?.actions[0] ?? null;
    history = buildAllocationHistoryView({
      days: historyDays,
      nowChannelSpend,
      breakEvenMer: metrics.breakEvenMer,
      asOfDateKey,
      primaryAction: primaryForHist
        ? { channel: primaryForHist.channel, type: primaryForHist.type }
        : null,
    });
  } catch {
    history = null;
  }

  return {
    metrics,
    history,
    windowSets,
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
    history,
    windowSets,
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
  const [grain, setGrain] = useState<WindowGrain>(() =>
    defaultWindowGrain(preset),
  );
  const [selectedWindowKey, setSelectedWindowKey] = useState<string | null>(
    null,
  );
  const [selectedChannel, setSelectedChannel] = useState<string | null>(null);

  useEffect(() => {
    setGrain(defaultWindowGrain(preset));
    setSelectedWindowKey(null);
    setSelectedChannel(null);
  }, [preset]);

  // Never build Monday advice from emptySales zeros after a sales load failure.
  const allocation = salesError ? null : metrics.allocation;

  const tillLabel = useSampleDesk
    ? `${metrics.period.label}${PRODUCT_NOUN.practicePeriodSuffix}`
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
  const lockCopy = cashLocked
    ? metrics.spendCoverage.incomplete
      ? `Spend coverage is under 70% — fill empty days before allocation. ${PRODUCT_NOUN.mondayCall}.`
      : metrics.spendRecon?.status === "drift"
        ? `Desk spend vs declared Ads Manager is outside ±5% — fix recon before allocation. ${PRODUCT_NOUN.mondayCall}.`
        : `Allocation is locked until spend trust is ready. ${PRODUCT_NOUN.mondayCall}.`
    : null;

  const zeroMargin = !allocation && metrics.breakEvenMer == null && !shotMode;
  const channelRows = allocation
    ? buildPeriodChannelRows(allocation.inputs.channelEfficiencies)
    : buildPeriodChannelRowsFromMix(metrics.channelMix);
  const rollingWindows = history?.rollingWindows ?? [];
  const pickedWindows = selectWindowsForGrain(
    windowSets.period[grain],
    windowSets.lookback[grain],
    grain,
  );
  const selectedWindow =
    pickedWindows.items.find((row) => row.key === selectedWindowKey) ?? null;
  const mixDiffs: SpendShareDiff[] = selectedWindow
    ? compareSpendShares(
        channelRows.map((row) => ({ channel: row.name, share: row.share })),
        selectedWindow.shares.map((s) => ({
          channel: s.channel,
          share: s.share,
        })),
      ).filter((d) => Math.abs(d.deltaPp) >= 1)
    : [];
  const takeaway = salesError
    ? null
    : periodTakeaway({
        periodLabel: metrics.period.label,
        mer: metrics.mer,
        breakEvenMer: metrics.breakEvenMer,
        top: channelRows[0] ?? null,
        hasSpend: metrics.totalSpend > 0,
      });

  return (
    <s-page heading={shotMode ? undefined : PRODUCT_NOUN.spendAllocation} inlineSize="large">
      <div
        className={[
          "mcfly-desk",
          "mcfly-alloc-v2",
          shotMode ? "mcfly-desk--shot" : null,
          useSampleDesk ? "mcfly-desk--sample" : null,
          isLoading && !shotMode ? "mcfly-desk--loading" : null,
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {useSampleDesk && !shotMode ? (
          <SampleDeskBanner note={`${PRODUCT_NOUN.spendAllocation} uses SAMPLE numbers — not your live store.`} />
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
              Sales didn’t load — {PRODUCT_NOUN.spendAllocation} needs {PRODUCT_NOUN.totalRoas} from sales ÷ spend.
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

        {cashLocked && lockCopy ? (
          <section
            className="mcfly-state mcfly-state--warn"
            aria-label="Allocation locked until spend trust"
          >
            <p className="mcfly-state__copy">{lockCopy}</p>
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
              Where the budget went this period · {PRODUCT_NOUN.totalRoas} =
              sales ÷ spend
            </p>
          </div>
          <PeriodControl preset={preset} shotMode={shotMode} />
        </header>

        <div className="mcfly-ctx" aria-live="polite">
          <div className="mcfly-ctx__main">
            <span className="mcfly-ctx__brand">{PRODUCT_NOUN.spendAllocation}</span>
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
          </div>
        </div>

        {!salesError ? (
          <PeriodSnapshotSection
            periodLabel={metrics.period.label}
            sales={metrics.sales}
            spend={metrics.totalSpend}
            mer={metrics.mer}
            breakEvenMer={metrics.breakEvenMer}
            deltas={metrics.deltas}
            topChannel={channelRows[0] ?? null}
          />
        ) : null}

        {takeaway ? (
          <p className="mcfly-alloc-v2__takeaway">{takeaway}</p>
        ) : null}

        <PeriodMixSection
          rows={channelRows}
          totalSpend={metrics.totalSpend}
          periodLabel={metrics.period.label}
          totalRoas={metrics.mer}
          selectedChannel={selectedChannel}
          onSelectChannel={(name) =>
            setSelectedChannel((cur) => (cur === name ? null : name))
          }
        />

        <BestWindowsSection
          grain={grain}
          onGrainChange={(next) => {
            setGrain(next);
            setSelectedWindowKey(null);
          }}
          items={pickedWindows.items}
          scope={pickedWindows.scope}
          periodLabel={metrics.period.label}
          selectedKey={selectedWindowKey}
          onSelectKey={(key) =>
            setSelectedWindowKey((cur) => (cur === key ? null : key))
          }
          selectedWindow={selectedWindow}
          mixDiffs={mixDiffs}
        />

        <RollingWindowsSection tiles={rollingWindows} />

        {channelRows.length === 0 &&
        metrics.totalSpend <= 0 &&
        !zeroMargin &&
        !cashLocked &&
        !salesError ? (
          <section
            className="mcfly-state mcfly-state--empty"
            aria-label="Allocation unavailable"
          >
            <p className="mcfly-state__copy">
              Add daily spend to see mix, best windows, and recent pace for this
              period.
            </p>
            <div className="mcfly-state__cta">
              <s-button href="/app/spend" variant="primary">
                {PRODUCT_NOUN.setupAddSpend}
              </s-button>
              <s-link href="/app/settings">{PRODUCT_NOUN.setupAdjustMargin}</s-link>
            </div>
          </section>
        ) : null}
      </div>
    </s-page>
  );
}

function periodTakeaway(input: {
  periodLabel: string;
  mer: number | null;
  breakEvenMer: number | null;
  top: PeriodChannelRow | null;
  hasSpend: boolean;
}): string {
  const mixBit = input.top
    ? `${input.top.name} is ${formatPercent(input.top.share)} of the budget.`
    : input.hasSpend
      ? "Channel mix is still catching up."
      : "Add spend to see where the money went.";
  if (input.mer == null) {
    return `${input.periodLabel}: ${mixBit}`;
  }
  const vs =
    input.breakEvenMer == null
      ? "Set margin in Settings for break-even."
      : input.mer >= input.breakEvenMer
        ? "Covering break-even."
        : "Below break-even.";
  return `${input.periodLabel}: ${formatMer(input.mer)}× Total ROAS. ${vs} ${mixBit}`;
}

function vsBreakEvenLine(mer: number | null, breakEvenMer: number | null): string {
  if (mer == null) return "Sales ÷ spend";
  if (breakEvenMer == null) return "Sales ÷ spend · set margin for break-even";
  const gap = mer - breakEvenMer;
  if (Math.abs(gap) < 0.005) {
    return `At break-even ${formatMer(breakEvenMer)}×`;
  }
  if (gap > 0) {
    return `${formatMer(gap)}× above break-even ${formatMer(breakEvenMer)}×`;
  }
  return `${formatMer(Math.abs(gap))}× below break-even ${formatMer(breakEvenMer)}×`;
}

function PeriodSnapshotSection({
  periodLabel,
  sales,
  spend,
  mer,
  breakEvenMer,
  deltas,
  topChannel,
}: {
  periodLabel: string;
  sales: number;
  spend: number;
  mer: number | null;
  breakEvenMer: number | null;
  deltas: {
    priorLabel: string;
    salesPct: number | null;
    spendPct: number | null;
    merAbs: number | null;
  } | null;
  topChannel: PeriodChannelRow | null;
}) {
  const priorLabel = deltas?.priorLabel;
  const salesDelta = deltas ? formatPctDelta(deltas.salesPct, priorLabel) : null;
  const spendDelta = deltas ? formatPctDelta(deltas.spendPct, priorLabel) : null;
  const merDelta =
    deltas?.merAbs != null
      ? `${deltas.merAbs >= 0 ? "+" : ""}${deltas.merAbs.toFixed(2)} vs ${deltaVsLabel(priorLabel)}`
      : null;
  const merTone =
    deltas?.merAbs == null || Math.abs(deltas.merAbs) < 0.02
      ? "flat"
      : deltas.merAbs > 0
        ? "up"
        : "down";
  const roasVsBe = vsBreakEvenLine(mer, breakEvenMer);

  return (
    <section
      className="mcfly-alloc-v2__snaps"
      aria-label={`${periodLabel} snapshot`}
    >
      <div className="mcfly-alloc-v2__head">
        <h2>This period · {periodLabel}</h2>
        <p className="mcfly-alloc-v2__muted">
          Cards follow MTD / LM / QTD / YTD / L12M
        </p>
      </div>
      <div className="mcfly-alloc-v2__snap-grid">
        <article className="mcfly-alloc-v2__snap">
          <p className="mcfly-alloc-v2__snap-label">Sales</p>
          <p className="mcfly-alloc-v2__snap-value">{formatCurrency(sales)}</p>
          <p className="mcfly-alloc-v2__snap-meta">Shopify Total Sales</p>
          {salesDelta ? (
            <p
              className={`mcfly-alloc-v2__snap-delta mcfly-alloc-v2__snap-delta--${deltaTone(deltas?.salesPct ?? null)}`}
            >
              {salesDelta}
            </p>
          ) : null}
        </article>
        <article className="mcfly-alloc-v2__snap">
          <p className="mcfly-alloc-v2__snap-label">Spend</p>
          <p className="mcfly-alloc-v2__snap-value">{formatCurrency(spend)}</p>
          <p className="mcfly-alloc-v2__snap-meta">Ad spend this period</p>
          {spendDelta ? (
            <p className="mcfly-alloc-v2__snap-delta">{spendDelta}</p>
          ) : null}
        </article>
        <article className="mcfly-alloc-v2__snap mcfly-alloc-v2__snap--lead">
          <p className="mcfly-alloc-v2__snap-label">{PRODUCT_NOUN.totalRoas}</p>
          <p className="mcfly-alloc-v2__snap-value">
            {mer == null ? "—" : `${formatMer(mer)}×`}
          </p>
          <p className="mcfly-alloc-v2__snap-meta">{roasVsBe}</p>
          {merDelta ? (
            <p
              className={`mcfly-alloc-v2__snap-delta mcfly-alloc-v2__snap-delta--${merTone}`}
            >
              {merDelta}
            </p>
          ) : null}
        </article>
        <article className="mcfly-alloc-v2__snap">
          <p className="mcfly-alloc-v2__snap-label">Top channel</p>
          <p className="mcfly-alloc-v2__snap-value">
            {topChannel ? formatPercent(topChannel.share) : "—"}
          </p>
          <p className="mcfly-alloc-v2__snap-meta">
            {topChannel
              ? `${topChannel.name} · ${formatCurrency(topChannel.spend)}`
              : "No channel spend yet"}
          </p>
        </article>
      </div>
    </section>
  );
}

function BestWindowsSection({
  grain,
  onGrainChange,
  items,
  scope,
  periodLabel,
  selectedKey,
  onSelectKey,
  selectedWindow,
  mixDiffs,
}: {
  grain: WindowGrain;
  onGrainChange: (grain: WindowGrain) => void;
  items: TopWindowAllocation[];
  scope: "period" | "lookback";
  periodLabel: string;
  selectedKey: string | null;
  onSelectKey: (key: string) => void;
  selectedWindow: TopWindowAllocation | null;
  mixDiffs: SpendShareDiff[];
}) {
  return (
    <section className="mcfly-alloc-v2__quarters" aria-label="Best windows">
      <div className="mcfly-alloc-v2__head">
        <h2>Best windows</h2>
        <p className="mcfly-alloc-v2__muted">
          {windowScopeCaption(grain, scope, periodLabel)} Click a card to
          compare mix.
        </p>
      </div>
      <div
        className="mcfly-alloc-v2__grain"
        role="group"
        aria-label="Window size"
      >
        {WINDOW_GRAINS.map((value) => {
          const pressed = grain === value;
          return (
            <button
              key={value}
              type="button"
              className={`mcfly-alloc-v2__grain-btn${pressed ? " mcfly-alloc-v2__grain-btn--on" : ""}`}
              aria-pressed={pressed}
              onClick={() => onGrainChange(value)}
            >
              {windowGrainLabel(value)}
            </button>
          );
        })}
      </div>
      {items.length === 0 ? (
        <p className="mcfly-alloc-v2__empty">
          Not enough {windowGrainLabel(grain).toLowerCase()} with spend to rank
          yet.
        </p>
      ) : (
        <ol className="mcfly-alloc-v2__q-list">
          {items.map((row, i) => {
            const selected = selectedKey === row.key;
            return (
              <li key={row.key}>
                <button
                  type="button"
                  className={`mcfly-alloc-v2__q-card${selected ? " mcfly-alloc-v2__q-card--on" : ""}`}
                  aria-pressed={selected}
                  onClick={() => onSelectKey(row.key)}
                >
                  <div className="mcfly-alloc-v2__q-rank" aria-hidden="true">
                    {i + 1}
                  </div>
                  <div className="mcfly-alloc-v2__q-body">
                    <div className="mcfly-alloc-v2__q-top">
                      <span className="mcfly-alloc-v2__q-label">{row.label}</span>
                      <span className="mcfly-alloc-v2__q-mer">
                        {row.mer == null ? "—" : `${formatMer(row.mer)}×`}
                      </span>
                    </div>
                    <p className="mcfly-alloc-v2__q-meta">
                      {PRODUCT_NOUN.totalRoas} · {formatCurrency(row.sales)} ÷{" "}
                      {formatCurrency(row.spend)}
                    </p>
                    <div
                      className="mcfly-alloc-v2__q-bar"
                      aria-hidden="true"
                      title="Spend share"
                    >
                      {row.shares.slice(0, 5).map((s) => (
                        <span
                          key={s.channel}
                          className={`mcfly-alloc-v2__q-seg mcfly-channel__fill--${channelFillKey(s.channel)}`}
                          style={{ flex: Math.max(0.02, s.share) }}
                        />
                      ))}
                    </div>
                    <div className="mcfly-alloc-v2__q-chips">
                      {row.shares.slice(0, 4).map((s) => (
                        <span key={s.channel}>
                          <span
                            className={`mcfly-spend-dot mcfly-spend-dot--${channelFillKey(s.channel)}`}
                            aria-hidden="true"
                          />
                          {s.channel} · {formatPercent(s.share)}
                        </span>
                      ))}
                    </div>
                  </div>
                </button>
              </li>
            );
          })}
        </ol>
      )}
      {selectedWindow ? (
        <div className="mcfly-alloc-v2__compare">
          <p className="mcfly-alloc-v2__compare-lead">
            {selectedWindow.label} vs this period · mix is spend share, not
            which channel caused sales.
          </p>
          {mixDiffs.length === 0 ? (
            <p className="mcfly-alloc-v2__muted">
              Mix looks similar to {periodLabel}.
            </p>
          ) : (
            <ul className="mcfly-alloc-v2__compare-list">
              {mixDiffs.slice(0, 4).map((diff) => {
                const more = diff.deltaPp >= 0;
                return (
                  <li key={diff.channel}>
                    <span
                      className={`mcfly-spend-dot mcfly-spend-dot--${channelFillKey(diff.channel)}`}
                      aria-hidden="true"
                    />
                    <span>
                      {diff.channel} was {Math.abs(diff.deltaPp).toFixed(0)}pp{" "}
                      {more ? "more" : "less"} of spend than this period
                      <span className="mcfly-alloc-v2__compare-shares">
                        {" "}
                        · {formatPercent(diff.windowShare)} then ·{" "}
                        {formatPercent(diff.periodShare)} now
                      </span>
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      ) : null}
    </section>
  );
}

function PeriodMixSection({
  rows,
  totalSpend,
  periodLabel,
  totalRoas,
  selectedChannel,
  onSelectChannel,
}: {
  rows: PeriodChannelRow[];
  totalSpend: number;
  periodLabel: string;
  totalRoas: number | null;
  selectedChannel: string | null;
  onSelectChannel: (name: string) => void;
}) {
  const selected = rows.find((row) => row.name === selectedChannel) ?? null;
  return (
    <section
      className="mcfly-alloc-v2__mix"
      aria-label={`Where the money went · ${periodLabel}`}
    >
      <div className="mcfly-alloc-v2__head">
        <h2>Where the money went · {periodLabel}</h2>
        <p className="mcfly-alloc-v2__muted">
          Click a channel · spend share, not channel ROAS · till{" "}
          {PRODUCT_NOUN.totalRoas}{" "}
          {totalRoas == null ? "—" : `${formatMer(totalRoas)}×`}
        </p>
      </div>
      {rows.length === 0 ? (
        <p className="mcfly-alloc-v2__empty">
          No channel spend for {periodLabel} — log Meta, Google, and the rest
          on Spend.
        </p>
      ) : (
        <>
          <div className="mcfly-alloc-v2__mix-grid">
            <SpendSharePie
              rows={rows}
              totalSpend={totalSpend}
              selectedChannel={selectedChannel}
              onSelectChannel={onSelectChannel}
            />
            <ul className="mcfly-alloc-v2__chan-list">
              {rows.map((row) => {
                const on = selectedChannel === row.name;
                return (
                  <li key={row.name}>
                    <button
                      type="button"
                      className={`mcfly-alloc-v2__chan${on ? " mcfly-alloc-v2__chan--on" : ""}`}
                      aria-pressed={on}
                      onClick={() => onSelectChannel(row.name)}
                    >
                      <span
                        className={`mcfly-spend-dot mcfly-spend-dot--${row.fill}`}
                        aria-hidden="true"
                      />
                      <span className="mcfly-alloc-v2__chan-name">{row.name}</span>
                      <span className="mcfly-alloc-v2__chan-amt">
                        {formatCurrency(row.spend)}
                      </span>
                      <span className="mcfly-alloc-v2__chan-pct">
                        {formatPercent(row.share)}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
          {selected ? (
            <p className="mcfly-alloc-v2__chan-callout">
              {selected.name} is {formatPercent(selected.share)} of this
              period’s ad spend ({formatCurrency(selected.spend)}).
            </p>
          ) : (
            <p className="mcfly-alloc-v2__hedge">
              Pie and list are budget share — not which ad caused the sale.
            </p>
          )}
        </>
      )}
    </section>
  );
}

/** SVG pie = spend share % for the selected desk period. */
function SpendSharePie({
  rows,
  totalSpend,
  selectedChannel,
  onSelectChannel,
}: {
  rows: PeriodChannelRow[];
  totalSpend: number;
  selectedChannel: string | null;
  onSelectChannel: (name: string) => void;
}) {
  const size = 160;
  const cx = size / 2;
  const cy = size / 2;
  const r = 68;
  let angle = -Math.PI / 2;
  const slices =
    totalSpend > 0
      ? rows.map((row) => {
          const sweep = (row.spend / totalSpend) * Math.PI * 2;
          const start = angle;
          angle += sweep;
          const end = angle;
          const large = sweep > Math.PI ? 1 : 0;
          const x1 = cx + r * Math.cos(start);
          const y1 = cy + r * Math.sin(start);
          const x2 = cx + r * Math.cos(end);
          const y2 = cy + r * Math.sin(end);
          // Full circle: SVG arc can't draw 360° as one path — use circle.
          const isFull = rows.length === 1 && row.spend > 0;
          return { row, start, end, large, x1, y1, x2, y2, isFull };
        })
      : [];

  return (
    <div className="mcfly-alloc-v2__pie-wrap">
      <svg
        className="mcfly-alloc-v2__pie"
        viewBox={`0 0 ${size} ${size}`}
        width={size}
        height={size}
        role="img"
        aria-label="Channel spend share pie"
      >
        {slices.map(({ row, large, x1, y1, x2, y2, isFull }) => {
          const dim =
            selectedChannel != null && selectedChannel !== row.name;
          const sliceClass = dim
            ? "mcfly-alloc-v2__pie-slice mcfly-alloc-v2__pie-slice--dim"
            : "mcfly-alloc-v2__pie-slice";
          const onActivate = () => onSelectChannel(row.name);
          return isFull ? (
            <circle
              key={row.name}
              className={sliceClass}
              cx={cx}
              cy={cy}
              r={r}
              fill={channelCssVar(row.fill)}
              role="button"
              tabIndex={0}
              aria-label={`${row.name} spend share`}
              onClick={onActivate}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onActivate();
                }
              }}
            />
          ) : (
            <path
              key={row.name}
              className={sliceClass}
              d={`M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`}
              fill={channelCssVar(row.fill)}
              role="button"
              tabIndex={0}
              aria-label={`${row.name} spend share`}
              onClick={onActivate}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onActivate();
                }
              }}
            />
          );
        })}
        <circle
          cx={cx}
          cy={cy}
          r={36}
          className="mcfly-alloc-v2__pie-hole"
        />
        <text
          x={cx}
          y={cy - 4}
          textAnchor="middle"
          className="mcfly-alloc-v2__pie-label"
        >
          Spend
        </text>
        <text
          x={cx}
          y={cy + 12}
          textAnchor="middle"
          className="mcfly-alloc-v2__pie-sub"
        >
          share
        </text>
      </svg>
    </div>
  );
}

function RollingWindowsSection({ tiles }: { tiles: RollingWindowTile[] }) {
  return (
    <section
      className="mcfly-alloc-v2__rolling"
      aria-label="Recent pace"
    >
      <div className="mcfly-alloc-v2__head">
        <h2>Recent pace · last 7 / 14 / 28 days</h2>
        <p className="mcfly-alloc-v2__muted">
          Closed days vs the prior equal window — not the MTD / QTD filter
        </p>
      </div>
      {tiles.length === 0 ? (
        <p className="mcfly-alloc-v2__empty">
          Not enough closed-day history for a recent-pace pulse yet.
        </p>
      ) : (
        <div className="mcfly-alloc-v2__roll-grid">
          {tiles.map((tile) => {
            const tone =
              tile.delta == null
                ? "flat"
                : tile.delta > 0.02
                  ? "up"
                  : tile.delta < -0.02
                    ? "down"
                    : "flat";
            return (
              <article
                className={`mcfly-alloc-v2__roll mcfly-alloc-v2__roll--${tone}`}
                key={tile.days}
              >
                <p className="mcfly-alloc-v2__roll-label">{tile.label}</p>
                <p className="mcfly-alloc-v2__roll-mer">
                  {tile.current.mer == null
                    ? "—"
                    : `${formatMer(tile.current.mer)}×`}
                </p>
                <p className="mcfly-alloc-v2__roll-delta">
                  {tile.delta == null
                    ? "vs prior —"
                    : `${tile.delta > 0 ? "+" : ""}${tile.delta.toFixed(2)} vs prior window`}
                </p>
                <p className="mcfly-alloc-v2__roll-prior">
                  Prior {tile.days}d ·{" "}
                  {tile.prior.mer == null
                    ? "—"
                    : `${formatMer(tile.prior.mer)}×`}
                </p>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
