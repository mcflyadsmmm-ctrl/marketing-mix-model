import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { redirect, useLoaderData, useNavigation } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { DeskBookPage } from "../components/DeskBookPage";
import { ReviewAsk } from "../components/ReviewAsk";
import { SampleDeskBanner } from "../components/SampleDeskBanner";
import { buildDashboardMetrics, ensureShop, getOrCreateSettings, marginIsConfirmed } from "../lib/mer-dashboard.server";
import { parseSalesBasis } from "../lib/sales-basis";
import { formatCurrency } from "../lib/mer-format";
import {
  contributionAdjustedLtv,
  contributionLtvCacRatio,
} from "../lib/contrib-ltv";
import { runOrderFactsBackfill, getOrderBackfillProgress, ORDER_FACT_MAX_DAYS_PER_RUN } from "../lib/order-facts.server";
import { deskPeriodTimeZone, parsePeriodPreset, resolvePeriod } from "../lib/periods";
import { PRODUCT_NOUN } from "../lib/product-labels";
import { fetchSampleSales, getSampleDeskEnabled } from "../lib/sample-desk.server";
import { loadDeskSalesForPeriod } from "../lib/sales-facts.server";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";

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

/** Drill-down line: summary always visible, detail on open. */
type LtvRow = { k: string; v: string; d: string; x?: string[] };

function BookRows({ rows }: { rows: LtvRow[] }) {
  const shown = rows.filter((row) => row.v !== "—");
  if (shown.length === 0) return null;
  return (
    <div className="mcfly-book__rows">
      {shown.map((row) => (
        <details className="mcfly-book__row" key={row.k}>
          <summary className="mcfly-book__row-sum">
            <span className="mcfly-book__row-k">{row.k}</span>
            <span className="mcfly-book__row-v">{row.v}</span>
          </summary>
          <p className="mcfly-book__row-d">{row.d}</p>
          {(row.x ?? []).map((line) => (
            <p className="mcfly-book__row-d" key={line}>
              {line}
            </p>
          ))}
        </details>
      ))}
    </div>
  );
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);
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
  let sales;
  if (useSampleDesk) {
    sales = await fetchSampleSales(shop.id, range);
  } else {
    // First-order-month OrderFact backfill — chunked so paint stays fast.
    void runOrderFactsBackfill(admin, shop.id, {
      maxDays: ORDER_FACT_MAX_DAYS_PER_RUN,
    }).catch(() => {
      // ignore — page shows honest empty/backfill states until facts land
    });
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
    marginConfirmed: marginIsConfirmed(settings),
    orderBackfillProgress,
    hasLiveSpend: liveSpendCount > 0,
    installedAt: shop.createdAt.toISOString(),
  };
};

export default function LtvPage() {
  const {
    metrics,
    preset,
    shotMode,
    useSampleDesk,
    salesError,
    todaySalesTruncated,
    todaySalesUnavailable,
    marginConfirmed,
    orderBackfillProgress,
    hasLiveSpend,
    installedAt,
  } = useLoaderData<typeof loader>();
  const navigation = useNavigation();
  const isLoading = navigation.state === "loading";

  const tillLabel = useSampleDesk
    ? `${metrics.period.label}${PRODUCT_NOUN.samplePeriodSuffix}`
    : shotMode
      ? metrics.period.label
      : salesError ||
          metrics.blockedMockAsLive ||
          metrics.salesSource === "mock"
        ? `${metrics.period.label} · sales unavailable`
        : `${metrics.period.label} · live sales`;

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
   * dash next to real dollars.
   */
  const valueRows: LtvRow[] = [];
  if (isNum(ltv.avgRevenueD30)) {
    valueRows.push({
      k: "First 30 days",
      v: formatCurrency(ltv.avgRevenueD30),
      d: PRODUCT_NOUN.ltv30Def,
    });
  }
  if (isNum(ltv.avgOrdersD90)) {
    valueRows.push({
      k: "Orders in first 90 days",
      v: ltv.avgOrdersD90.toFixed(1),
      d: "Average orders per new buyer in the first 90 days, from Shopify orders — not an email list.",
    });
  }
  if (isNum(ltv.avgRevenueD365)) {
    valueRows.push({
      k: "First year",
      v: formatCurrency(ltv.avgRevenueD365),
      d: PRODUCT_NOUN.ltv365Def,
      ...(contrib365 != null
        ? { x: [`${formatCurrency(contrib365)} kept. ${marginNote}`] }
        : {}),
    });
  }
  if (contrib90 != null) {
    valueRows.push({
      k: "Kept after margin",
      v: formatCurrency(contrib90),
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
      v: formatCurrency(cashCac),
      d: `${PRODUCT_NOUN.cashCacDef}. Blended — not platform CAC, not per ad.`,
      x: [
        ltv.paybackDays != null
          ? `Recovered in about ${ltv.paybackDays} days on average.`
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
      v: formatCurrency(metrics.totalSpend / knownBuyers),
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
    return {
      k: `First orders · ${row.cohortMonth}`,
      v: d90 != null ? formatCurrency(d90) : "—",
      d: `${row.customers.toLocaleString()} customers placed a first order that month. Value shown is their first 90 days.`,
      x: [
        [
          d30 != null ? `30 days ${formatCurrency(d30)}` : null,
          d365 != null ? `First year ${formatCurrency(d365)}` : null,
        ]
          .filter(Boolean)
          .join(" · "),
      ].filter(Boolean),
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

      {!useSampleDesk && !shotMode && !salesError && todaySalesTruncated ? (
        <s-banner tone="warning" heading="Today’s sales may be incomplete">
          <s-paragraph>
            Today’s top-up hit the page cap — closed days are still included.
            Refresh later for a fuller total.
          </s-paragraph>
        </s-banner>
      ) : null}

      {!useSampleDesk &&
      !shotMode &&
      !salesError &&
      todaySalesUnavailable &&
      !todaySalesTruncated ? (
        <s-banner tone="warning" heading="Today’s live sales unavailable">
          <s-paragraph>
            Showing closed-day sales only — today’s Shopify pull did not
            complete.
          </s-paragraph>
        </s-banner>
      ) : null}

      <section className="mcfly-book" aria-label="What new customers spend">
        <p className="mcfly-book__lede">
          Shopify Analytics shows LTV reports, if any. This page shows order-history first 90 days. {PRODUCT_NOUN.ltvNotInShopify}
        </p>

        {ltv.available && isNum(ltv.avgRevenueD90) ? (
          <div className="mcfly-book__hero">
            <p className="mcfly-book__hero-k">First 90 days</p>
            <p className="mcfly-book__hero-v">
              {formatCurrency(ltv.avgRevenueD90)}
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

        <BookRows rows={valueRows} />

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
            First orders by month — open a month to see what those customers
            spent later. Averages from order history, not a forecast.
          </p>
          <BookRows rows={monthRows} />
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

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
