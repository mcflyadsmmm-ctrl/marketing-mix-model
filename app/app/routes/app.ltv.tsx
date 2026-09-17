import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { redirect, useLoaderData, useNavigation } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { BookFactGrid, type BookFact } from "../components/ShopifyBookSection";
import { DeskBookPage } from "../components/DeskBookPage";
import { DeskRouteErrorBoundary } from "../components/DeskRouteErrorBoundary";
import { ReviewAsk } from "../components/ReviewAsk";
import { SampleDeskBanner } from "../components/SampleDeskBanner";
import { buildDashboardMetrics, ensureShop, getOrCreateSettings, marginIsConfirmed } from "../lib/mer-dashboard.server";
import { parseSalesBasis } from "../lib/sales-basis";
import { formatCurrency } from "../lib/mer-format";
import {
  contributionAdjustedLtv,
  contributionLtvCacRatio,
} from "../lib/contrib-ltv";
import { deskPeriodTillLabel } from "../lib/desk-history";
import { getOrderBackfillProgress } from "../lib/order-facts.server";
import { deskPeriodTimeZone, parsePeriodPreset, periodMayExceedShopifyOrderWindow, resolvePeriod } from "../lib/periods";
import { PRODUCT_NOUN } from "../lib/product-labels";
import { fetchSampleSales, getSampleDeskEnabled } from "../lib/sample-desk.server";
import { loadDeskSalesForPeriod } from "../lib/sales-facts.server";
import { requireAdmin } from "../lib/public-app-gate.server";
import { scheduleFirstSessionShopifyWindow } from "../lib/first-session-shopify-window.server";
import prisma from "../db.server";
import { useDeskCurrency } from "../lib/desk-currency";

/** Stored month totals — desk LTV is per new customer. */
function perCustomerRevenue(
  total: number,
  customers: number,
): number | null {
  if (!(customers > 0) || !Number.isFinite(total)) return null;
  return total / customers;
}

/**
 * Whole percents in merchant chrome — 35%, never 35.0%.
 * `formatPercent(metrics.marginPct)` prints one decimal, which the desk bans.
 */
function pct(share: number): string {
  return `${Math.round(share * 100)}%`;
}

function isNum(n: number | null | undefined): n is number {
  return n != null && Number.isFinite(n);
}

type LtvRow = BookFact;

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin, session } = await requireAdmin(request);
  const url = new URL(request.url);
  const shotMode = url.searchParams.get("shot") === "1";
  const preset = parsePeriodPreset(url.searchParams.get("period"));
  // y3 stays shot-only. L12M is a desk preset (PeriodControl) — do not redirect.
  if (!shotMode && preset === "y3") {
    const next = new URLSearchParams(url.searchParams);
    next.set("period", "ytd");
    throw redirect(`/app/ltv?${next.toString()}`);
  }

  const shop = await ensureShop(session.shop);
  const settings = await getOrCreateSettings(shop.id);
  const useSampleDesk = await getSampleDeskEnabled(shop.id);
  const deskTz = deskPeriodTimeZone(useSampleDesk, shop.ianaTimezone);
  const range = resolvePeriod(preset, new Date(), deskTz);
  let salesError: string | null = null;
  let todaySalesTruncated = false;
  let todaySalesUnavailable = false;
  let shopifyOrderWindowLimited = false;
  let sales;
  if (useSampleDesk) {
    sales = await fetchSampleSales(shop.id, range);
  } else {
    // First-order-month OrderFact backfill — chunked so paint stays fast.
    void scheduleFirstSessionShopifyWindow(admin, shop.id);
    /*
     * HARD-STOP: same as Home / Close / Allocation — never unbounded
     * fetchShopifySales for a multi-day period. Facts + capped today only.
     */
    const desk = await loadDeskSalesForPeriod({
      admin,
      shopId: shop.id,
      range,
      ianaTimezone: shop.ianaTimezone,
    });
    sales = desk.sales;
    salesError = desk.salesError;
    todaySalesTruncated = desk.todaySalesTruncated;
    todaySalesUnavailable = desk.todaySalesUnavailable;
    shopifyOrderWindowLimited =
      Boolean(desk.factsCoverage?.periodExceedsFactWindow) ||
      periodMayExceedShopifyOrderWindow(range);
  }

  const metrics = await buildDashboardMetrics(session.shop, range, sales, {
    salesBasis: parseSalesBasis(settings.salesBasis, "total"),
  });
  const orderBackfillProgress = useSampleDesk
    ? null
    : await getOrderBackfillProgress(shop.id, {
        ianaTimezone: shop.ianaTimezone,
      });
  const liveSpendCount = await prisma.spendEntry.count({
    where: { shopId: shop.id, NOT: { source: "sample" } },
  });
  return {
    metrics,
    preset,
    shotMode,
    useSampleDesk,
    salesError,
    todaySalesTruncated,
    todaySalesUnavailable,
    shopifyOrderWindowLimited,
    marginConfirmed: marginIsConfirmed(settings),
    orderBackfillProgress,
    hasLiveSpend: liveSpendCount > 0,
    installedAt: shop.createdAt.toISOString(),
  };
};

export default function LtvPage() {
  const currency = useDeskCurrency();
  const {
    metrics,
    preset,
    shotMode,
    useSampleDesk,
    salesError,
    todaySalesTruncated,
    todaySalesUnavailable,
    shopifyOrderWindowLimited,
    marginConfirmed,
    orderBackfillProgress,
    hasLiveSpend,
    installedAt,
  } = useLoaderData<typeof loader>();
  const navigation = useNavigation();
  const isLoading = navigation.state === "loading";

  // salesError / mock → sales unavailable; otherwise live sales (deskPeriodTillLabel)
  const tillLabel = deskPeriodTillLabel({
    periodLabel: metrics.period.label,
    useSampleDesk,
    shotMode,
    salesError,
    blockedMockAsLive: metrics.blockedMockAsLive,
    salesSource: metrics.salesSource,
    todaySalesTruncated: !useSampleDesk && todaySalesTruncated,
    todaySalesUnavailable: !useSampleDesk && todaySalesUnavailable,
    shopifyOrderWindowLimited: !useSampleDesk && shopifyOrderWindowLimited,
    includeShopifyOrderWindow: true,
  });

  const ltv = metrics.tillLtv;
  const custOk = metrics.customerMetricsAvailable;
  const newCount = custOk ? metrics.newCustomers : 0;
  const retCount = custOk ? metrics.returningCustomers : 0;
  const knownBuyers = newCount + retCount;
  const hasSpend = metrics.totalSpend > 0;
  const marginNote = marginConfirmed
    ? `After ${pct(metrics.marginPct)} margin from Settings.`
    : `After ${pct(metrics.marginPct)} margin — the default until you confirm in Settings.`;

  const cashCac = isNum(ltv.cashCac)
    ? ltv.cashCac
    : hasSpend && newCount > 0
      ? metrics.totalSpend / newCount
      : hasSpend && ltv.newBuyers > 0
        ? metrics.totalSpend / ltv.newBuyers
        : null;
  const contrib90 = contributionAdjustedLtv(ltv.avgRevenueD90, metrics.marginPct);
  const contrib365 = contributionAdjustedLtv(
    ltv.avgRevenueD365,
    metrics.marginPct,
  );
  const contribRatio = contributionLtvCacRatio(contrib90, ltv.cashCac);

  /*
   * Value rows. Unknown windows are omitted — the desk never prints a boxed
   * dash next to real dollars. First year is the exception when history is
   * limited: — means not on file, not $0 LTV.
   */
  const valueRows: LtvRow[] = [];
  if (isNum(ltv.avgRevenueD30) && ltv.avgRevenueD30 > 0) {
    valueRows.push({
      k: "First 30 days",
      v: formatCurrency(ltv.avgRevenueD30, currency),
      d: PRODUCT_NOUN.ltv30Def,
    });
  }
  if (isNum(ltv.avgOrdersD90) && ltv.avgOrdersD90 > 0) {
    valueRows.push({
      k: "Orders in first 90 days on file",
      v: ltv.avgOrdersD90.toFixed(1),
      d: "Average orders per new-on-file buyer in the first 90 days after their first visible order. A buyer with earlier Shopify orders is not counted as new.",
    });
  }
  if (ltv.historyLimited) {
    valueRows.push({
      k: "First year",
      v: "—",
      d: "Shopify shares about 60 days of orders on this shop, so first-year value is not on file yet — not $0 LTV.",
      keepDash: true,
    });
  } else if (isNum(ltv.avgRevenueD365)) {
    valueRows.push({
      k: "First year",
      v: formatCurrency(ltv.avgRevenueD365, currency),
      d: PRODUCT_NOUN.ltv365Def,
      ...(contrib365 != null
        ? { x: [`${formatCurrency(contrib365, currency)} kept. ${marginNote}`] }
        : {}),
    });
  }
  if (contrib90 != null) {
    valueRows.push({
      k: "Kept after margin",
      v: formatCurrency(contrib90, currency),
      d: `First 90 days of revenue times your margin. ${marginNote}`,
    });
  }
  if (isNum(ltv.repeatRate)) {
    valueRows.push({
      k: "Repeat orders",
      v: pct(ltv.repeatRate),
      d: "Extra orders beyond the first in the first 90 days — an average across new customers, not a promise.",
    });
  }
  if (hasSpend && cashCac != null) {
    valueRows.push({
      k: "Cash CAC",
      v: formatCurrency(cashCac, currency),
      d: `${PRODUCT_NOUN.cashCacDef}. Blended — not platform CAC, not per ad.`,
      x: [
        ltv.paybackDays != null
          ? `Recovered in about ${ltv.paybackDays} days on average.`
          : ltv.historyLimited
            ? "Payback past 90 days needs a full year of orders — not on file yet."
            : "Not recovered inside the first year on average.",
        ...(ltv.newBuyers > 0
          ? [`${ltv.newBuyers.toLocaleString()} new customers in this window.`]
          : []),
      ],
    });
  }
  if (hasSpend && isNum(ltv.ltvCacRatio)) {
    valueRows.push({
      k: "Value vs cost",
      v: `${ltv.ltvCacRatio.toFixed(2)}×`,
      d: "First 90 days of revenue ÷ Cash CAC. An average, not a causal claim.",
      ...(contribRatio != null
        ? { x: [`${contribRatio.toFixed(2)}× after margin.`] }
        : {}),
    });
  }
  if (hasSpend && knownBuyers > 0) {
    valueRows.push({
      k: "Spend per buyer",
      v: formatCurrency(metrics.totalSpend / knownBuyers, currency),
      d: "Spend you entered ÷ identified buyers in this window. Shopify Analytics has no spend.",
    });
  }

  /*
   * First-order months — depth as drill rows, not a wall of table cells.
   * The 30/90/365 windows start at each customer's first order, so they run
   * longer than the selected period; each row says so in shop-owner English.
   * `ltvWindowCaption` from lib/contrib-ltv says the same thing in glossary
   * words (cohort windows), which this desk does not put in front of a
   * merchant — the per-row sentence replaces it.
   */
  const monthRows: LtvRow[] = ltv.cohorts.map((row) => {
    const d90 = perCustomerRevenue(row.revenueD90, row.customers);
    const d30 = perCustomerRevenue(row.revenueD30, row.customers);
    const d365 = perCustomerRevenue(row.revenueD365, row.customers);
    const later = [
      d30 != null && d30 > 0 ? `30 days ${formatCurrency(d30, currency)}` : null,
      d365 != null && !ltv.historyLimited && d365 > 0
        ? `First year ${formatCurrency(d365, currency)}`
        : null,
    ].filter((part): part is string => part != null);
    return {
      k: `First on file · ${row.cohortMonth}`,
      v: d90 != null && d90 > 0 ? formatCurrency(d90, currency) : "—",
      s: later.length > 0 ? later.join(" · ") : undefined,
      d: `${row.customers.toLocaleString()} customers had a first visible order that month. Value is 90 days after that order — not lifetime first if they bought before this window.`,
    };
  }).filter((row) => row.v !== "—");

  const emptyLine =
    ltv.emptyReason === "no_timezone"
      ? "Shop timezone needed before first orders can bucket by local day."
      : ltv.emptyReason === "history_limited"
        ? "Shopify shares about 60 days of orders on this shop, so first-year value is not on file yet — not $0 LTV."
        : orderBackfillProgress
          ? "Orders still syncing — not $0. Refresh this page."
          : "Orders still syncing — not $0.";

  return (
    <DeskBookPage
      heading={PRODUCT_NOUN.ltvTitle}
      tillLabel={tillLabel}
      preset={preset}
      shotMode={shotMode}
      useSampleDesk={useSampleDesk}
      isLoading={isLoading}
      orderFactsTruncated={
        !useSampleDesk && Boolean(orderBackfillProgress?.truncated)
      }
      todaySalesTruncated={!useSampleDesk && todaySalesTruncated}
      todaySalesUnavailable={!useSampleDesk && todaySalesUnavailable}
      shopifyOrderWindowLimited={!useSampleDesk && shopifyOrderWindowLimited}
      periodLabel={metrics.period.label}
      showPeriod={false}
    >
      {useSampleDesk && !shotMode ? (
        <SampleDeskBanner note="LTV below uses SAMPLE sales — not this shop’s Shopify orders." />
      ) : null}

      {salesError && !shotMode ? (
        <section className="mcfly-state mcfly-state--critical" aria-label="Sales load error">
          <p className="mcfly-state__copy">
            Sales didn’t load. Retry to see what new customers spend.
          </p>
          <div className="mcfly-state__cta">
            <s-button href={`/app/ltv?period=${preset}`} variant="primary">
              Retry
            </s-button>
          </div>
        </section>
      ) : null}

      <section className="mcfly-book" aria-label="What new customers spend">
        <p className="mcfly-book__lede">
          Shopify Analytics shows LTV reports, if any. This page shows first 90 days after the first order on file — not lifetime first when Shopify only shared ~60 days. {PRODUCT_NOUN.ltvNotInShopify}
        </p>

        {ltv.available && isNum(ltv.avgRevenueD90) && ltv.avgRevenueD90 > 0 ? (
          <div className="mcfly-book__hero">
            <p className="mcfly-book__hero-k">First 90 days on file</p>
            <p className="mcfly-book__hero-v">
              {formatCurrency(ltv.avgRevenueD90, currency)}
            </p>
            <p className="mcfly-book__hero-def">
              {PRODUCT_NOUN.ltv90Def}
              {metrics.tillLtv.newBuyers > 0
                ? ` ${metrics.tillLtv.newBuyers.toLocaleString()} new customers.`
                : ""}
            </p>
          </div>
        ) : (
          <p className="mcfly-book__lede">{emptyLine}</p>
        )}

        <BookFactGrid facts={valueRows} />

        {ltv.historyLimited ? (
          <p className="mcfly-book__lede">
            Shopify shares about 60 days of orders on this shop. Older history
            is outside that window — not $0.
          </p>
        ) : null}
      </section>

      {monthRows.length > 0 ? (
        <section className="mcfly-book" aria-label="First orders by month">
          <p className="mcfly-book__lede">
            First orders by month — each month shows what those customers spent
            later. Averages from order history, not a forecast.
          </p>
          <BookFactGrid facts={monthRows} />
        </section>
      ) : null}

      <footer className="mcfly-book__links">
        {hasSpend ? (
          <s-link href="/app/cpa">CPA</s-link>
        ) : (
          <s-link href="/app/spend">Spend Upload</s-link>
        )}
      </footer>

      <ReviewAsk
        hasLiveSpend={hasLiveSpend}
        useSampleDesk={useSampleDesk}
        shotMode={shotMode}
        installedAt={installedAt}
      />
    </DeskBookPage>
  );
}

export function ErrorBoundary() {
  return <DeskRouteErrorBoundary retryHref="/app/ltv" />;
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
