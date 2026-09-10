import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { useLoaderData, useNavigation } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import type { AllocationAction } from "@mcfly/mer-core";
import { authenticate } from "../shopify.server";
import { CashTrustBanners } from "../components/CashTrustBanners";
import { PeriodControl } from "../components/PeriodControl";
import { SampleDeskBanner } from "../components/SampleDeskBanner";
import { DeskPageWhy } from "../components/DeskPageWhy";
import { FirstTrustedRoasGate } from "../components/FirstTrustedRoasGate";
import {
  formatListingTillLabel,
  listingCaptureFromRequest,
} from "../lib/listing-capture";
import {
  buildAllocationHistoryView,
  capHistoryDays,
  HISTORY_QUARTER_DAYS_CAP,
  resolveHistoryWindow,
  shiftDateKey,
  type AllocationHistoryView,
  type HistoryDay,
  type RollingWindowTile,
  type TopQuarterAllocation,
} from "../lib/allocation-history";
import {
  allocationActionLabel,
  formatAllocationPercentChange,
} from "../lib/allocation-verdict";
import {
  resolveAllocationLock,
  type AllocationLock,
} from "../lib/allocation-lock";
import {
  allocationChannelLabel,
  resolveAllocationPlan,
  type AllocationPlan,
} from "../lib/allocation-recommendation";
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
import { salesFactsIncompleteForDesk } from "../lib/sales-facts-honesty";
import { cashVerdictSalesUntrusted } from "../lib/cash-verdict";
import {
  getSalesFactsByDay,
  loadDeskSalesForPeriod,
} from "../lib/sales-facts.server";
import {
  parsePeriodPreset,
  periodMayExceedShopifyOrderWindow,
  resolvePeriod,
} from "../lib/periods";
import {
  resolveDeepHistoryHonesty,
  scopesIncludeReadAllOrders,
} from "../lib/deep-history-honesty";
import { shopLocalDayKey } from "../lib/shop-local-day";
import {
  fetchSampleSales,
  fetchSampleSalesByDay,
  getSampleDeskEnabled,
  localDayKey,
} from "../lib/sample-desk.server";

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
      channel: allocationChannelLabel(c.channel),
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

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);
  const url = new URL(request.url);
  const preset = parsePeriodPreset(url.searchParams.get("period"));
  const shotMode = listingCaptureFromRequest(request);
  const shop = await ensureShop(session.shop);
  const now = new Date();
  const range = resolvePeriod(preset, now, shop.ianaTimezone);
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
  let deskCoverage: {
    factDays: number;
    expectedClosedDays: number;
    complete: boolean;
    periodExceedsFactWindow: boolean;
  } | null = null;
  let deskSalesUntrustedZero = false;
  let deskLiveConfirmedZero = false;
  let deskShopOrdersSeen = 0;
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
    deskCoverage = desk.factsCoverage;
    deskSalesUntrustedZero = desk.salesUntrustedZero;
    deskShopOrdersSeen = desk.shopOrdersSeen;
    deskLiveConfirmedZero =
      desk.liveConfirmedQuiet &&
      !desk.salesUntrustedZero &&
      !(desk.sales.totalSales > 0);
    shopifyOrderWindowLimited = Boolean(
      desk.factsCoverage?.periodExceedsFactWindow,
    );
  }

  const metrics = await buildDashboardMetrics(session.shop, range, sales, {
    salesBasis: parseSalesBasis(
      (await getOrCreateSettings(shop.id)).salesBasis,
      "total",
    ),
  });

  if (!useSampleDesk) {
    factsIncomplete = salesFactsIncompleteForDesk(deskCoverage, {
      salesUntrustedZero: deskSalesUntrustedZero,
      sales: metrics.sales,
      spend: metrics.totalSpend,
      liveConfirmedZero: deskLiveConfirmedZero,
      shopOrdersSeen: deskShopOrdersSeen,
    });
    salesFactsIncomplete = factsIncomplete
      ? {
          factDays: deskCoverage?.factDays ?? 0,
          expectedClosedDays: deskCoverage?.expectedClosedDays ?? 0,
        }
      : null;
  }

  /*
   * Same untrusted-$0 gate as Overview's trusted hero. Spend-side coverage can be
   * complete while the sales numerator is still filling — sales ÷ spend then
   * resolves to 0.00× and suggestAllocation calls a ~50% "below break-even" cut
   * on a numerator nobody trusts. Pass salesUntrustedZero next to the coverage
   * flag so a wrongly-false incomplete cannot leak that advice through.
   */
  const salesUntrustedForAdvice =
    !useSampleDesk &&
    metrics.totalSpend > 0 &&
    !(metrics.sales > 0) &&
    cashVerdictSalesUntrusted({
      salesFactsIncomplete: factsIncomplete,
      salesUntrustedZero: deskSalesUntrustedZero,
    });

  /*
   * Portfolio history (~L12M / 365 closed days): top quarters by Total ROAS,
   * rolling 7/14/28 vs prior window. Facts / sample only — no unbounded Shopify.
   */
  const histTz = useSampleDesk ? null : shop.ianaTimezone;
  const l12m = resolvePeriod("l12m", now, histTz);
  const histWindow = resolveHistoryWindow(l12m, HISTORY_QUARTER_DAYS_CAP);
  const todayKey = histTz
    ? shopLocalDayKey(now, histTz)
    : localDayKey(now);
  const asOfDateKey = shiftDateKey(todayKey, -1);

  let history: AllocationHistoryView | null = null;
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
    const allocationForHist =
      salesError || salesUntrustedForAdvice ? null : metrics.allocation;
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
    preset,
    shotMode,
    useSampleDesk,
    salesError,
    todaySalesUnavailable,
    todaySalesTruncated,
    salesFactsIncomplete,
    factsIncomplete,
    salesUntrustedForAdvice,
    shopifyOrderWindowLimited,
    hasReadAllOrders: scopesIncludeReadAllOrders(session.scope),
    shopDomain: session.shop,
    periodWiderThanRecentWindow: periodMayExceedShopifyOrderWindow(range),
  };
};

export default function AllocationPage() {
  const {
    metrics,
    history,
    preset,
    shotMode,
    useSampleDesk,
    salesError,
    todaySalesUnavailable,
    todaySalesTruncated,
    salesFactsIncomplete,
    factsIncomplete,
    salesUntrustedForAdvice,
    shopifyOrderWindowLimited,
    hasReadAllOrders,
    shopDomain,
    periodWiderThanRecentWindow,
  } = useLoaderData<typeof loader>();
  const navigation = useNavigation();
  const isLoading = navigation.state === "loading";
  // Never build Monday advice from emptySales zeros after a sales load failure,
  // nor from an untrusted $0 numerator (0.00× is not "below break-even").
  const allocation =
    salesError || salesUntrustedForAdvice ? null : metrics.allocation;

  const tillLabel = formatListingTillLabel({
    periodLabel: metrics.period.label,
    useSampleDesk,
    listingCapture: shotMode,
    salesError: Boolean(salesError),
    blockedMockAsLive: Boolean(metrics.blockedMockAsLive),
    salesSource: metrics.salesSource,
    factsIncomplete,
    recentWindowOnly: !useSampleDesk && !hasReadAllOrders,
  });
  const deepHistory = resolveDeepHistoryHonesty({
    hasReadAllOrders,
    useSampleDesk,
    shotMode,
    factsIncomplete: Boolean(salesFactsIncomplete),
    periodWiderThanRecentWindow,
  });

  /*
   * One blocking answer at a time, with the reason named: spend, then margin,
   * then coverage, then the sales numerator. A lock hides the cut/keep call —
   * it never renders a softer version of it.
   */
  const lock = resolveAllocationLock({
    shotMode: Boolean(shotMode),
    salesError: Boolean(salesError),
    salesUntrustedForAdvice,
    breakEvenMer: metrics.breakEvenMer,
    cashActionReady: metrics.cashActionReady,
    spendCoverage: metrics.spendCoverage,
    totalSpend: metrics.totalSpend,
    periodLabel: metrics.period.label,
    periodPreset: preset,
  });
  // Concrete dollars from the percent mer-core already sized and floored.
  const plan = lock ? null : resolveAllocationPlan(allocation);
  const channelRows = allocation
    ? buildPeriodChannelRows(allocation.inputs.channelEfficiencies)
    : [];
  const topQuarters = history?.topQuarters ?? [];
  const rollingWindows = history?.rollingWindows ?? [];

  return (
    <s-page heading={shotMode ? undefined : PRODUCT_NOUN.spendAllocation} inlineSize="large">
      <div
        className={[
          "mcfly-desk",
          "mcfly-alloc-v2",
          shotMode ? "mcfly-desk--shot mcfly-desk--listing" : null,
          useSampleDesk ? "mcfly-desk--sample" : null,
          isLoading && !shotMode ? "mcfly-desk--loading" : null,
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {useSampleDesk && !shotMode ? (
          <SampleDeskBanner note={`${PRODUCT_NOUN.spendAllocation} uses SAMPLE numbers — not your live store.`} />
        ) : null}

        <DeskPageWhy page="allocation" />
        <FirstTrustedRoasGate
          hasLiveSpend={metrics.onboarding.hasSpend}
          useSampleDesk={useSampleDesk}
          shotMode={shotMode}
        />

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
            deepHistoryKind={deepHistory.kind}
            shopDomain={shopDomain}
            hasReadAllOrders={hasReadAllOrders}
          />
        ) : null}

        {isLoading && !shotMode ? (
          <section className="mcfly-state mcfly-state--loading" aria-live="polite">
            <p className="mcfly-state__copy">Refreshing allocation for this period…</p>
          </section>
        ) : null}

        {lock ? <AllocationLockSection lock={lock} /> : null}

        <header className="mcfly-topbar">
          <div>
            <p className="mcfly-topbar__def mcfly-topbar__def--solo">
              Portfolio mix by spend share · {PRODUCT_NOUN.totalRoas} = sales ÷
              spend
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

        {/* 1. The cut/keep call in dollars, then the computed action list */}
        {allocation && plan ? (
          <AllocationVerdictSection
            plan={plan}
            why={allocation.why}
            actions={allocation.actions}
            suggestedTestDays={allocation.suggestedTestDays}
            overallMer={allocation.overallMer}
            breakEvenMer={allocation.breakEvenMer}
          />
        ) : null}

        {/* 2. Top 3 quarterly allocations (all-time in facts window) */}
        <TopQuartersSection quarters={topQuarters} />

        {/* 3. ONE mix view: pie (% allocation) + channel list for selected period */}
        {allocation ? (
          <PeriodMixSection
            rows={channelRows}
            totalSpend={allocation.inputs.totalSpend}
            periodLabel={metrics.period.label}
            totalRoas={allocation.overallMer}
          />
        ) : null}

        {/* 4. Rolling improvement: 7 · 14 · 28 vs prior window */}
        <RollingWindowsSection tiles={rollingWindows} />

        {!lock && !allocation ? (
          <section
            className="mcfly-state mcfly-state--empty"
            aria-label="Allocation unavailable"
          >
            <p className="mcfly-state__copy">
              Allocation needs trusted {PRODUCT_NOUN.totalRoas} first — not
              broken. Log daily spend and set margin to unlock hold / reduce /
              step-test advice from sales ÷ spend.
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

function AllocationLockSection({ lock }: { lock: AllocationLock }) {
  return (
    <section
      className={`mcfly-state mcfly-state--${lock.tone}`}
      aria-label={lock.label}
    >
      <div className="mcfly-state__content">
        <h3 className="mcfly-state__heading">{lock.headline}</h3>
        <p className="mcfly-state__copy">{lock.body}</p>
      </div>
      <div className="mcfly-state__cta">
        <s-button href={lock.primaryCta.href} variant="primary">
          {lock.primaryCta.label}
        </s-button>
        {lock.secondaryCta ? (
          <s-link href={lock.secondaryCta.href}>
            {lock.secondaryCta.label}
          </s-link>
        ) : null}
      </div>
    </section>
  );
}

function AllocationVerdictSection({
  plan,
  why,
  actions,
  suggestedTestDays,
  overallMer,
  breakEvenMer,
}: {
  plan: AllocationPlan;
  why: string;
  actions: AllocationAction[];
  suggestedTestDays: number;
  overallMer: number | null;
  breakEvenMer: number;
}) {
  return (
    <section
      className="mcfly-alloc-v2__mix"
      aria-label="Cut or keep call for this period"
    >
      <div className="mcfly-alloc-v2__head">
        <h2>This period’s call · cut or keep</h2>
        <p className="mcfly-alloc-v2__muted">
          Portfolio {PRODUCT_NOUN.totalRoas}{" "}
          {overallMer == null ? "—" : formatMer(overallMer)} vs break-even{" "}
          {formatMer(breakEvenMer)}
          {suggestedTestDays > 0
            ? ` · illustrative ${suggestedTestDays}-day window`
            : null}
        </p>
      </div>
      <div
        className={`mcfly-alloc-v2__call mcfly-alloc-v2__call--${plan.kind}`}
      >
        <p className="mcfly-alloc-v2__call-head">{plan.headline}</p>
        <p className="mcfly-alloc-v2__call-keep">{plan.keepLine}</p>
        {plan.redeployLine ? (
          <p className="mcfly-alloc-v2__call-meta">{plan.redeployLine}</p>
        ) : null}
      </div>
      <p className="mcfly-alloc-v2__muted">{why}</p>
      <h3 className="mcfly-alloc-v2__sub">Steps · hold / reduce / step-test</h3>
      {actions.length === 0 ? (
        <p className="mcfly-alloc-v2__empty">
          No action list for this period — check spend and margin.
        </p>
      ) : (
        <ol className="mcfly-alloc-v2__q-list">
          {actions.map((action) => {
            const pct = formatAllocationPercentChange(action.percentChange);
            const channel =
              action.channel === "—"
                ? null
                : action.channel === "portfolio"
                  ? "Portfolio"
                  : allocationChannelLabel(action.channel);
            return (
              <li
                className="mcfly-alloc-v2__q-card"
                key={`${action.type}:${action.channel}:${action.percentChange ?? ""}`}
              >
                <div className="mcfly-alloc-v2__q-body">
                  <div className="mcfly-alloc-v2__q-top">
                    <span className="mcfly-alloc-v2__q-label">
                      {allocationActionLabel(action.type)}
                      {channel ? ` · ${channel}` : null}
                    </span>
                    {pct ? (
                      <span className="mcfly-alloc-v2__q-mer">{pct}</span>
                    ) : null}
                  </div>
                  <p className="mcfly-alloc-v2__q-meta">{action.detail}</p>
                </div>
              </li>
            );
          })}
        </ol>
      )}
      <p className="mcfly-alloc-v2__hedge">
        Average {PRODUCT_NOUN.totalRoas} ≠ marginal ROAS. Spend floor keeps at
        least 50% of period spend in one step — never zero, never path credit.
      </p>
    </section>
  );
}

function TopQuartersSection({
  quarters,
}: {
  quarters: TopQuarterAllocation[];
}) {
  return (
    <section
      className="mcfly-alloc-v2__quarters"
      aria-label="Top quarterly allocations"
    >
      <div className="mcfly-alloc-v2__head">
        <h2>Top quarterly spend allocations</h2>
        <p className="mcfly-alloc-v2__muted">
          Ranked by portfolio {PRODUCT_NOUN.totalRoas}
        </p>
      </div>
      {quarters.length === 0 ? (
        <p className="mcfly-alloc-v2__empty">
          Not enough quarterly spend history yet.
        </p>
      ) : (
        <ol className="mcfly-alloc-v2__q-list">
          {quarters.map((q, i) => (
            <li className="mcfly-alloc-v2__q-card" key={q.label}>
              <div className="mcfly-alloc-v2__q-rank" aria-hidden="true">
                {i + 1}
              </div>
              <div className="mcfly-alloc-v2__q-body">
                <div className="mcfly-alloc-v2__q-top">
                  <span className="mcfly-alloc-v2__q-label">{q.label}</span>
                  <span className="mcfly-alloc-v2__q-mer">
                    {q.mer == null ? "—" : formatMer(q.mer)}
                  </span>
                </div>
                <p className="mcfly-alloc-v2__q-meta">
                  {PRODUCT_NOUN.totalRoas} · {formatCurrency(q.sales)} ÷{" "}
                  {formatCurrency(q.spend)}
                </p>
                <div
                  className="mcfly-alloc-v2__q-bar"
                  aria-hidden="true"
                  title="Spend share"
                >
                  {q.shares.slice(0, 5).map((s) => (
                    <span
                      key={s.channel}
                      className={`mcfly-alloc-v2__q-seg mcfly-channel__fill--${channelFillKey(s.channel)}`}
                      style={{ flex: Math.max(0.02, s.share) }}
                    />
                  ))}
                </div>
                <ul className="mcfly-alloc-v2__q-chips">
                  {q.shares.slice(0, 4).map((s) => (
                    <li key={s.channel}>
                      <span
                        className={`mcfly-spend-dot mcfly-spend-dot--${channelFillKey(s.channel)}`}
                        aria-hidden="true"
                      />
                      {s.channel} · {formatPercent(s.share)}
                    </li>
                  ))}
                </ul>
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

function PeriodMixSection({
  rows,
  totalSpend,
  periodLabel,
  totalRoas,
}: {
  rows: PeriodChannelRow[];
  totalSpend: number;
  periodLabel: string;
  totalRoas: number | null;
}) {
  return (
    <section
      className="mcfly-alloc-v2__mix"
      aria-label={`Spend allocation for ${periodLabel}`}
    >
      <div className="mcfly-alloc-v2__head">
        <h2>% Allocation · {periodLabel}</h2>
        <p className="mcfly-alloc-v2__muted">
          Channel spend share · portfolio {PRODUCT_NOUN.totalRoas}{" "}
          {totalRoas == null ? "—" : formatMer(totalRoas)}
        </p>
      </div>
      {rows.length === 0 ? (
        <p className="mcfly-alloc-v2__empty">
          No channel spend for {periodLabel} — log Meta, Google, and the rest
          on Spend.
        </p>
      ) : (
        <div className="mcfly-alloc-v2__mix-grid">
          <SpendSharePie rows={rows} totalSpend={totalSpend} />
          <ul className="mcfly-alloc-v2__chan-list">
            {rows.map((row) => (
              <li className="mcfly-alloc-v2__chan" key={row.name}>
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
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

/** SVG pie = spend share % for the selected desk period. */
function SpendSharePie({
  rows,
  totalSpend,
}: {
  rows: PeriodChannelRow[];
  totalSpend: number;
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
        {slices.map(({ row, large, x1, y1, x2, y2, isFull }) =>
          isFull ? (
            <circle
              key={row.name}
              cx={cx}
              cy={cy}
              r={r}
              fill={channelCssVar(row.fill)}
            />
          ) : (
            <path
              key={row.name}
              d={`M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`}
              fill={channelCssVar(row.fill)}
            />
          ),
        )}
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
      aria-label="Rolling Total ROAS improvement"
    >
      <div className="mcfly-alloc-v2__head">
        <h2>Rolling improvement · 7 · 14 · 28</h2>
        <p className="mcfly-alloc-v2__muted">
          Closed days · vs prior equal-length window
        </p>
      </div>
      {tiles.length === 0 ? (
        <p className="mcfly-alloc-v2__empty">
          Not enough closed-day history for rolling windows yet.
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
                    : formatMer(tile.current.mer)}
                </p>
                <p className="mcfly-alloc-v2__roll-delta">
                  {tile.delta == null
                    ? "vs prior —"
                    : `${tile.delta > 0 ? "+" : ""}${tile.delta.toFixed(2)} vs prior window`}
                </p>
                <p className="mcfly-alloc-v2__roll-prior">
                  Prior {tile.days}d ·{" "}
                  {tile.prior.mer == null ? "—" : formatMer(tile.prior.mer)}
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
