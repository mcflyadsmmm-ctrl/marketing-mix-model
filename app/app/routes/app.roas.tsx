import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { redirect, useLoaderData, useNavigation } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { DualCloseLine } from "../components/DualCloseLine";
import { MarketingSpendRoom } from "../components/MarketingSpendRoom";
import { MonthlyPacing } from "../components/MonthlyPacing";
import { PeriodControl } from "../components/PeriodControl";
import {
  SpendExplorer,
  type SpendExplorerSeriesView,
} from "../components/SpendExplorer";
import {
  buildControlPace,
  buildDailyRowsForWindow,
  buildDashboardMetrics,
  buildSpendExplorerSeries,
  ensureShop,
  getOrCreateSettings,
} from "../lib/mer-dashboard.server";
import { buildCashControlBoard } from "../lib/mer-control";
import { formatCurrency, formatMer } from "../lib/mer-format";
import { PRODUCT_NOUN } from "../lib/product-labels";
import { parseSalesBasis } from "../lib/sales-basis";
import type { SalesResult } from "../lib/shopify-sales.server";
import {
  getSalesFactsByDay,
  loadDeskSalesForPeriod,
  runSalesFactsBackfill,
} from "../lib/sales-facts.server";
import {
  deskPeriodTimeZone,
  parsePeriodPreset,
  resolvePeriod,
  resolvePriorPeriod,
} from "../lib/periods";
import { shopLocalDayKey } from "../lib/shop-local-day";
import {
  dateKeyFromLocal,
  explorerQueryMatchingScoreboard,
  parseExplorerDateParam,
  parseExplorerGranularity,
  parseExplorerMode,
  parseExplorerRange,
  parseExplorerShowSales,
  resolveExplorerWindow,
} from "../lib/spend-explorer";
import {
  fetchSampleSales,
  fetchSampleSalesByDay,
  getSampleDeskEnabled,
} from "../lib/sample-desk.server";
import { materializeRecurringSpendForShop } from "../lib/spend-recurring.server";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);
  const url = new URL(request.url);
  const shotMode = url.searchParams.get("shot") === "1";
  const preset = parsePeriodPreset(url.searchParams.get("period"));
  if (!shotMode && preset === "y3") {
    const next = new URLSearchParams(url.searchParams);
    next.set("period", "ytd");
    throw redirect(`/app/roas?${next.toString()}`);
  }

  const shop = await ensureShop(session.shop);
  const settings = await getOrCreateSettings(shop.id);
  const useSampleDesk = await getSampleDeskEnabled(shop.id);
  await materializeRecurringSpendForShop({
    shopId: shop.id,
    currencyCode: shop.currencyCode,
    ianaTimezone: shop.ianaTimezone,
    sampleOn: useSampleDesk,
  });
  const now = new Date();
  const deskTz = deskPeriodTimeZone(useSampleDesk, shop.ianaTimezone);
  const range = resolvePeriod(preset, now, deskTz);

  let sales: SalesResult;
  let salesError: string | null = null;
  if (useSampleDesk) {
    sales = await fetchSampleSales(shop.id, range);
  } else {
    void runSalesFactsBackfill(admin, shop.id, { maxDays: 2 }).catch(() => {});
    const desk = await loadDeskSalesForPeriod({
      admin,
      shopId: shop.id,
      range,
      ianaTimezone: shop.ianaTimezone,
    });
    sales = desk.sales;
    salesError = desk.salesError;
  }

  const metrics = await buildDashboardMetrics(session.shop, range, sales, {
    salesBasis: parseSalesBasis(settings.salesBasis, "total"),
  });

  const explicitExplorerRange = url.searchParams.get("exRange");
  const historyFirstEmpty =
    !metrics.onboarding.hasSpend && !useSampleDesk && !shotMode;
  const tiedExplorer =
    explicitExplorerRange || historyFirstEmpty
      ? null
      : explorerQueryMatchingScoreboard(preset, range, deskTz);
  const explorerRange = explicitExplorerRange
    ? parseExplorerRange(explicitExplorerRange)
    : historyFirstEmpty
      ? parseExplorerRange("90d")
      : (tiedExplorer?.range ?? "custom");
  const explorerFrom = explicitExplorerRange
    ? parseExplorerDateParam(url.searchParams.get("exFrom"))
    : (tiedExplorer?.from ?? null);
  const explorerTo = explicitExplorerRange
    ? parseExplorerDateParam(url.searchParams.get("exTo"))
    : (tiedExplorer?.to ?? null);
  const explorerWindow = resolveExplorerWindow(explorerRange, now, {
    from: explorerFrom,
    to: explorerTo,
    timeZone: deskTz,
  });
  const explorerDayKey = (instant: Date) =>
    deskTz ? shopLocalDayKey(instant, deskTz) : dateKeyFromLocal(instant);
  const dayFetchRange = {
    start: explorerWindow.start,
    end: explorerWindow.end,
    label: explorerWindow.label,
  };

  let explorerSalesByDay = new Map<string, number>();
  try {
    explorerSalesByDay = useSampleDesk
      ? await fetchSampleSalesByDay(shop.id, dayFetchRange)
      : await getSalesFactsByDay(shop.id, explorerWindow);
  } catch {
    explorerSalesByDay = new Map();
  }

  const explorerSeries = await buildSpendExplorerSeries(shop.id, {
    sampleOnly: useSampleDesk,
    excludeSample: !useSampleDesk,
    salesByDay: explorerSalesByDay,
    window: explorerWindow,
    granularity: parseExplorerGranularity(url.searchParams.get("exGran")),
    mode: parseExplorerMode(url.searchParams.get("exMode")),
    targetMer: metrics.targetMer,
    newCustomers: 0,
    returningCustomers: 0,
    customerMetricsAvailable: false,
    timeZone: deskTz,
  });

  const explorer: SpendExplorerSeriesView = {
    buckets: explorerSeries.buckets,
    summary: explorerSeries.summary,
    mode: explorerSeries.mode,
    granularity: explorerSeries.granularity,
    range: explorerWindow.range,
    windowLabel: explorerWindow.label,
    targetMer: explorerSeries.targetMer,
    breakEvenMer: metrics.breakEvenMer,
    showSales: parseExplorerShowSales(url.searchParams.get("exSales")),
    fromKey: explorerDayKey(explorerWindow.start),
    toKey: explorerDayKey(explorerWindow.end),
    asOfKey: explorerDayKey(explorerWindow.end),
    channelLabels: explorerSeries.channelLabels,
  };

  let cashControl: ReturnType<typeof buildCashControlBoard> | null = null;
  if (!metrics.salesPending) {
    try {
      const ytdRange = resolvePeriod("ytd", now, deskTz);
      const priorYtd = resolvePriorPeriod("ytd", now, deskTz);
      const controlRange = {
        start:
          priorYtd.start.getTime() < ytdRange.start.getTime()
            ? priorYtd.start
            : ytdRange.start,
        end: ytdRange.end,
        label: "Control",
      };
      const controlSalesByDay = useSampleDesk
        ? await fetchSampleSalesByDay(shop.id, controlRange)
        : await getSalesFactsByDay(shop.id, controlRange);
      const { rows: controlRows } = await buildDailyRowsForWindow(shop.id, {
        sampleOnly: useSampleDesk,
        excludeSample: !useSampleDesk,
        salesByDay: controlSalesByDay,
        windowStart: controlRange.start,
        windowEnd: controlRange.end,
        timeZone: deskTz,
      });
      const board = buildCashControlBoard(controlRows, metrics.targetMer);
      cashControl = board.chips.length > 0 ? board : null;
    } catch {
      cashControl = null;
    }
  }

  const mtdRange = resolvePeriod("mtd", now, deskTz);
  const monthPace = buildControlPace({
    sales: cashControl?.dualClose?.mtd.sales ?? 0,
    totalSpend: cashControl?.dualClose?.mtd.spend ?? 0,
    targetMer: metrics.targetMer,
    period: mtdRange,
    ianaTimezone: deskTz,
  });

  return {
    metrics,
    explorer,
    cashControl,
    monthPace,
    preset,
    shotMode,
    useSampleDesk,
    salesError,
  };
};

export default function TotalRoasPage() {
  const {
    metrics,
    explorer,
    cashControl,
    monthPace,
    preset,
    shotMode,
    useSampleDesk,
    salesError,
  } = useLoaderData<typeof loader>();
  const navigation = useNavigation();
  const isLoading = navigation.state === "loading";
  const hasSpend = metrics.totalSpend > 0;
  const roasValue =
    hasSpend && metrics.mer != null && Number.isFinite(metrics.mer)
      ? `${formatMer(metrics.mer)}×`
      : "—";

  return (
    <s-page heading={PRODUCT_NOUN.totalRoas} inlineSize="large">
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
        {isLoading && !shotMode ? (
          <section className="mcfly-state mcfly-state--loading" aria-live="polite">
            <p className="mcfly-state__copy">Refreshing Total ROAS…</p>
          </section>
        ) : null}

        {salesError && !shotMode ? (
          <section
            className="mcfly-state mcfly-state--critical"
            aria-label="Sales load error"
          >
            <p className="mcfly-state__copy">
              Sales didn’t load. Retry to see Shopify Total Sales next to spend.
            </p>
            <div className="mcfly-state__cta">
              <s-button href={`/app/roas?period=${preset}`} variant="primary">
                Retry
              </s-button>
            </div>
          </section>
        ) : null}

        {shotMode ? (
          <div className="mcfly-ctx" aria-live="polite">
            <div className="mcfly-ctx__main">
              <PeriodControl preset={preset} shotMode={shotMode} />
            </div>
          </div>
        ) : null}

        <section className="mcfly-book" aria-label="Sales, spend, and Total ROAS">
          <p className="mcfly-book__lede">
            Shopify Analytics has no {PRODUCT_NOUN.totalRoas}. This page is{" "}
            {PRODUCT_NOUN.definition} — not platform ROAS.
          </p>
          <div className="mcfly-book__glance mcfly-book__glance--kpis">
            <div className="mcfly-book__kpi">
              <p className="mcfly-book__kpi-k">Sales</p>
              <p className="mcfly-book__kpi-v">{formatCurrency(metrics.sales)}</p>
              <p className="mcfly-book__kpi-hint">{metrics.period.label}</p>
            </div>
            <div className="mcfly-book__kpi">
              <p className="mcfly-book__kpi-k">Spend</p>
              <p className="mcfly-book__kpi-v">
                {formatCurrency(metrics.totalSpend)}
              </p>
              <p className="mcfly-book__kpi-hint">Entered ad spend</p>
            </div>
            <div className="mcfly-book__kpi">
              <p className="mcfly-book__kpi-k">{PRODUCT_NOUN.totalRoas}</p>
              <p className="mcfly-book__kpi-v">{roasValue}</p>
              {hasSpend ? null : (
                <p className="mcfly-book__kpi-hint">
                  <s-link href="/app/spend">{PRODUCT_NOUN.uploadSpend}</s-link>
                </p>
              )}
            </div>
          </div>
        </section>

        <SpendExplorer
          series={explorer}
          period={preset}
          shotMode={shotMode}
          basePath="/app/roas"
          compare
          quiet={false}
        />

        {cashControl?.dualClose ? (
          <DualCloseLine
            close={cashControl.dualClose}
            targetMer={cashControl.targetMer}
          />
        ) : null}

        {monthPace && cashControl && hasSpend ? (
          <MonthlyPacing
            sales={cashControl.dualClose?.mtd.sales ?? 0}
            spend={cashControl.dualClose?.mtd.spend ?? 0}
            mer={cashControl.dualClose?.mtd.mer ?? null}
            targetMer={cashControl.targetMer}
            heading="This month"
            periodLabel={monthPace.densityLabel}
            control={monthPace}
          />
        ) : null}

        {cashControl ? (
          <MarketingSpendRoom
            board={cashControl}
            channelLabels={explorer.channelLabels}
            intelOnly
          />
        ) : null}
      </div>
    </s-page>
  );
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
