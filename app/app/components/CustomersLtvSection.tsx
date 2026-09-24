import { BookFactGrid, type BookFact } from "./ShopifyBookSection";
import { LtvBuildCurves } from "./LtvBuildCurves";
import { LtvRetentionHeat } from "./LtvRetentionHeat";
import { LtvTierTables } from "./LtvTierTables";
import { LtvPathTable } from "./LtvPathTable";
import { LtvWhaleRecency } from "./LtvWhaleRecency";
import { SlackInsightCard } from "./SlackInsightCard";
import { LtvFlagshipBoard } from "./LtvFlagshipBoard";
import { LtvWindowTriangle } from "./LtvWindowTriangle";
import { LtvFirstProductDrivers } from "./LtvFirstProductDrivers";
import { LtvExpectedEstimate } from "./LtvExpectedEstimate";
import { LtvProductBoard } from "./LtvProductBoard";
import { LtvPromoBoard } from "./LtvPromoBoard";
import { formatCurrency } from "../lib/mer-format";
import { PRODUCT_NOUN } from "../lib/product-labels";
import { useDeskCurrency } from "../lib/desk-currency";
import type { LtvFlagshipView } from "../lib/ltv-flagship";
import { truncatedLifetimeLine } from "../lib/till-ltv";
import { paintedYearDollars } from "../lib/ltv-year-honesty";
import {
  ltvPeekSlackInsight,
  pickShareableLtvPeek,
  shareableLtvWindowLabel,
  type SlackInsight,
} from "../lib/shareable-insights";

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

export type CustomersLtvTill = {
  available: boolean;
  historyLimited: boolean;
  emptyReason: "no_timezone" | "history_limited" | "backfilling" | null;
  avgRevenueD30: number | null;
  avgRevenueD90: number | null;
  avgRevenueD365: number | null;
  cashCac: number | null;
  newBuyers: number;
  ltvCacRatio: number | null;
  cohorts: Array<{
    cohortMonth: string;
    customers: number;
    revenueD30: number;
    revenueD90: number;
    revenueD365: number;
  }>;
  repeatRate: number | null;
  avgOrdersD90: number | null;
  paybackDays: number | null;
  truncatedLifetimeBuyers: number;
};

export type CustomersLtvMetrics = {
  tillLtv: CustomersLtvTill;
  totalSpend: number;
  marginPct: number;
  salesPending: boolean;
  newCustomers: number;
  returningCustomers: number;
  customerMetricsAvailable: boolean;
  period: { label: string };
};

type LtvPackProps = {
  metrics: CustomersLtvMetrics;
  depth: LtvFlagshipView & {
    truncatedLifetimeBuyers?: number;
    truncatedLifetimeLine?: string | null;
  };
  marginConfirmed: boolean;
  useSampleDesk: boolean;
  orderBackfillProgress?: { historyLimited?: boolean } | null;
  shopLabel?: string;
  shotMode?: boolean;
};

/**
 * `ltvWindowCaption` (lib/contrib-ltv) says the window caveat in glossary
 * words this desk keeps out of merchant chrome — the per-row sentence and the
 * build chart say it plainly instead.
 */
function useCustomersLtvPack({
  metrics,
  depth,
  useSampleDesk,
  orderBackfillProgress,
  shopLabel = "",
}: LtvPackProps) {
  const currency = useDeskCurrency();
  const ltv = metrics.tillLtv;
  const historyLimited = Boolean(
    !useSampleDesk &&
      (orderBackfillProgress?.historyLimited || ltv.historyLimited),
  );
  const chartLtvPeek = pickShareableLtvPeek({
    revenue30: ltv.avgRevenueD30,
    revenue90: ltv.avgRevenueD90,
    revenue365: ltv.avgRevenueD365,
    historyLimited,
  });
  const chartTargetLine = chartLtvPeek
    ? {
        value: chartLtvPeek.amount,
        windowLabel: shareableLtvWindowLabel(chartLtvPeek.days),
      }
    : null;
  const truncatedLine =
    truncatedLifetimeLine(ltv.truncatedLifetimeBuyers) ??
    depth.truncatedLifetimeLine ??
    truncatedLifetimeLine(depth.truncatedLifetimeBuyers);
  const custOk = metrics.customerMetricsAvailable;
  const newCount = custOk ? metrics.newCustomers : 0;
  const retCount = custOk ? metrics.returningCustomers : 0;
  const knownBuyers = newCount + retCount;
  const hasSpend = metrics.totalSpend > 0;

  const cashCac = isNum(ltv.cashCac)
    ? ltv.cashCac
    : hasSpend && newCount > 0
      ? metrics.totalSpend / newCount
      : hasSpend && ltv.newBuyers > 0
        ? metrics.totalSpend / ltv.newBuyers
        : null;

  /*
   * Year stays a — until enough buyers have lived a year. — is not $0 LTV.
   * First-90 worth is one figure, painted once above. 30-day and year
   * dollars are a different window and do not share that label.
   */
  const yearDollars = paintedYearDollars(ltv.avgRevenueD365);
  const yearOnFile = yearDollars != null;
  const yearPending = !yearOnFile;

  const orderRows: LtvRow[] = [];
  if (isNum(ltv.avgOrdersD90) && ltv.avgOrdersD90 > 0) {
    orderRows.push({
      k: "Orders in first 90 days on file",
      v: ltv.avgOrdersD90.toFixed(1),
      d: "Average orders per new-on-file buyer in the first 90 days after their first visible order. A buyer with earlier Shopify orders is not counted as new.",
    });
  }
  if (isNum(ltv.repeatRate)) {
    orderRows.push({
      k: "Repeat orders",
      v: pct(ltv.repeatRate),
      d: "Extra orders beyond the first in the first 90 days — an average across new customers, not a promise.",
    });
  }

  const economicsRows: LtvRow[] = [];
  if (hasSpend && cashCac != null) {
    economicsRows.push({
      k: "Cash CAC",
      v: formatCurrency(cashCac, currency),
      d: `${PRODUCT_NOUN.cashCacDef}. Blended — not platform CAC, not per ad.`,
      x: [
        ltv.paybackDays != null
          ? `Interpolated average about ${ltv.paybackDays} days versus first 90 — not a recovery date.`
          : yearPending || ltv.historyLimited
            ? "Payback past 90 days needs a full year of orders — not on file yet."
            : "Not recovered inside the first year on average.",
        ...(ltv.newBuyers > 0
          ? [`${ltv.newBuyers.toLocaleString()} new customers in this window.`]
          : []),
      ],
    });
  }
  if (hasSpend && isNum(ltv.ltvCacRatio)) {
    economicsRows.push({
      k: "Value vs cost",
      v: `${ltv.ltvCacRatio.toFixed(2)}×`,
      d: "First 90 days of revenue ÷ Cash CAC. An average, not a causal claim.",
    });
  }
  if (hasSpend && knownBuyers > 0) {
    economicsRows.push({
      k: "Spend per buyer",
      v: formatCurrency(metrics.totalSpend / knownBuyers, currency),
      d: "Spend you entered ÷ identified buyers in this window. Shopify Analytics has no spend.",
    });
  }

  const monthRows: LtvRow[] = ltv.cohorts.map((row) => {
    const d90 = perCustomerRevenue(row.revenueD90, row.customers);
    const d30 = perCustomerRevenue(row.revenueD30, row.customers);
    const d365 = yearOnFile
      ? paintedYearDollars(perCustomerRevenue(row.revenueD365, row.customers))
      : null;
    const later = [
      d30 != null && d30 > 0 ? `30 days ${formatCurrency(d30, currency)}` : null,
      d365 != null && d365 > 0
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
    truncatedLine
      ? truncatedLine
      : ltv.emptyReason === "no_timezone"
        ? "Shop timezone needed before first orders can bucket by local day."
        : ltv.emptyReason === "history_limited"
          ? "First-year value is not on file yet — not enough buyers have lived a year. Not $0 LTV."
          : orderBackfillProgress
            ? "Orders still syncing — not $0. Refresh this page."
            : "Orders still syncing — not $0.";

  const depthHasAny = Boolean(
    depth.curves ||
      depth.retention ||
      depth.paths.length > 0 ||
      depth.aov.length > 0 ||
      depth.basket.length > 0 ||
      depth.whales ||
      depth.windows ||
      depth.predictive ||
      depth.monthWindows.length > 0 ||
      depth.productLtv.read ||
      depth.productLtv.empty ||
      depth.promoLtv.read ||
      depth.promoLtv.empty ||
      depth.promoLtv.depthLine ||
      depth.promoLtv.depthEmpty ||
      depth.promoLtv.depthBands.length > 0 ||
      depth.sourceLtv.rows.some((row) => row.buyers > 0) ||
      (depth.refunds && depth.refunds.orderCount > 0),
  );

  const first90 =
    isNum(ltv.avgRevenueD90) && ltv.avgRevenueD90 > 0
      ? ltv.avgRevenueD90
      : null;
  const worthSlack: SlackInsight | null = ltvPeekSlackInsight({
    amount: first90,
    days: 90,
    historyLimited,
    shopLabel,
    sample: useSampleDesk,
    where: "On file",
    money: (n) => formatCurrency(n, currency),
  });

  return {
    ltv,
    currency,
    worthSlack,
    yearOnFile,
    yearPending,
    orderRows,
    economicsRows,
    monthRows,
    emptyLine,
    chartTargetLine,
    depthHasAny,
    hasSpend,
    historyLimited,
    truncatedLine,
  };
}

/** First-90 worth is one named figure. Depth explorers sit under it. */
export function CustomersLtvWindows(props: LtvPackProps) {
  const {
    ltv,
    yearPending,
    orderRows,
    emptyLine,
    worthSlack,
    truncatedLine,
  } = useCustomersLtvPack(props);
  const { metrics, useSampleDesk, depth, shotMode = false } = props;
  const currency = useDeskCurrency();

  return (
    <section className="mcfly-book" aria-label="What new customers spend">
      <p className="mcfly-book__lede">
        Shopify Analytics shows LTV reports, if any. This page shows first 90 days after the first order on file — not lifetime first when a year is not on file yet. {PRODUCT_NOUN.ltvNotInShopify}
        {truncatedLine ? ` ${truncatedLine}` : ""}
      </p>

      {ltv.available && isNum(ltv.avgRevenueD90) && ltv.avgRevenueD90 > 0 ? (
        <div className="mcfly-book__hero">
          <p className="mcfly-book__hero-k">First 90 days</p>
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

      <SlackInsightCard insight={worthSlack} shotMode={shotMode} />

      <BookFactGrid facts={orderRows} />

      {yearPending && (isNum(ltv.avgRevenueD90) || isNum(ltv.avgRevenueD30)) ? (
        <p className="mcfly-book__lede">
          First year is not on file yet — not enough buyers have lived a year.
          Not $0.
        </p>
      ) : null}

      {useSampleDesk ? (
        <p className="mcfly-book__lede">
          What a new buyer is worth is from Sample shop orders. Explorers
          below stay on that same book. Order history only, no spend.
        </p>
      ) : null}

      <LtvWindowTriangle
        rows={depth.monthWindows}
        buyers={depth.buyers}
        useSampleDesk={useSampleDesk}
      />
      <LtvFirstProductDrivers
        drivers={depth.firstProductDrivers}
        useSampleDesk={useSampleDesk}
      />
      <LtvPromoBoard
        promo={depth.promoLtv}
        bySource={depth.sourceLtv}
      />
      <LtvExpectedEstimate
        estimate={depth.expectedLtv}
        useSampleDesk={useSampleDesk}
      />
    </section>
  );
}

/** LTV flagship depth pack — FOLD NEVER DELETE. */
export function CustomersLtvDepth(props: LtvPackProps) {
  const { chartTargetLine, depthHasAny, historyLimited, truncatedLine } =
    useCustomersLtvPack(props);
  const { depth, useSampleDesk, shopLabel = "", shotMode = false } = props;

  return (
    <>
      {depthHasAny ? (
        <section className="mcfly-book mcfly-depth-intro" aria-label="Order-history depth">
          <p className="mcfly-book__lede">
            {useSampleDesk
              ? "What a new buyer is worth is from Sample shop orders. Explorers below stay on that same book. Order history only, no spend."
              : "What a new buyer is worth, then the order-history explorers. Full history when it is on file. No spend required."}
            {truncatedLine ? ` ${truncatedLine}` : ""}
          </p>
        </section>
      ) : !useSampleDesk ? (
        <p className="mcfly-book__lede">
          {truncatedLine
            ? truncatedLine
            : "Spend-build curves, who kept ordering, product journeys and best-customer recency need more than a handful of identified buyers — not $0. They fill as the order book deepens."}
        </p>
      ) : null}

      <LtvFlagshipBoard
        windows={depth.windows}
        predictive={depth.predictive}
        refunds={depth.refunds}
        buyers={depth.buyers}
      />
      <LtvProductBoard product={depth.productLtv} />
      <LtvBuildCurves
        curves={depth.curves}
        buyers={depth.buyers}
        targetLine={chartTargetLine}
      />
      <LtvRetentionHeat heat={depth.retention} buyers={depth.buyers} />
      <LtvTierTables aov={depth.aov} basket={depth.basket} />
      <LtvPathTable paths={depth.paths} clarity={depth.pathClarity} />
      <LtvWhaleRecency
        whales={depth.whales}
        shopLabel={shopLabel}
        sample={useSampleDesk}
        shotMode={shotMode}
        historyLimited={historyLimited}
      />
    </>
  );
}

/** Spend-gated economics — never a Customers hero. */
export function CustomersLtvEconomics(props: LtvPackProps) {
  const { economicsRows, monthRows, hasSpend } = useCustomersLtvPack(props);
  const { depth } = props;

  return (
    <>
      {economicsRows.length > 0 ? (
        <section className="mcfly-book" aria-label="Cost and margin">
          <p className="mcfly-book__lede">
            Spend you entered, next to what a new customer is worth. Averages,
            not causal — and never ahead of the order value above.
          </p>
          <BookFactGrid facts={economicsRows} />
        </section>
      ) : null}

      {monthRows.length > 0 && !depth.curves ? (
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
    </>
  );
}
