/**
 * Overview Live first fold — ShopifyQL SalesDayFact totals only.
 * Two totals (Shopify Total Sales + Net when complete), named gap, prior-year
 * same window. Order crawl does not gate paint. Spend stays — on Overview.
 */
import {
  OVERVIEW_LAST_YEAR_NOT_ON_FILE,
  OVERVIEW_PERIOD_TOTAL_LABEL,
} from "./overview-first-viewport";
import {
  overviewYoyPct,
  overviewYoyZoneFromPct,
  type OverviewOrderBookHero,
} from "./overview-order-book";
import { deskAnalyticsDayTotalsLive } from "./shopify-analytics-totals";
import {
  OVERVIEW_SHOPIFY_CLOCK_PARTIAL,
  OVERVIEW_SHOPIFY_CLOCK_PENDING,
} from "./overview-live-period-clock";

export const OVERVIEW_QL_FIRST_LANE_LABEL =
  "Shopify day totals · same window vs last year";

export const OVERVIEW_QL_NET_LABEL = "Net Sales";

export const OVERVIEW_QL_GAP_LABEL = "Gap";

export const OVERVIEW_QL_SPEND_LABEL = "Spend";

/** Named gaps merchants recognize from Shopify reporting (not MTA theater). */
export type OverviewQlGapKind =
  | "timing"
  | "tax"
  | "discounts"
  | "channels"
  | "draft";

export const OVERVIEW_QL_GAP_TIMING =
  "Timing — closed days still landing in Total Sales";

export const OVERVIEW_QL_GAP_TAX =
  "Tax, shipping, duties, and fees above Net Sales";

export const OVERVIEW_QL_GAP_DISCOUNTS =
  "Discounts and returns between gross and net";

export const OVERVIEW_QL_GAP_CHANNELS =
  "Channel totals differ from the sales report roll-up";

export const OVERVIEW_QL_GAP_DRAFT =
  "Draft and pending orders stay out of Total Sales";

const GAP_COPY: Record<OverviewQlGapKind, string> = {
  timing: OVERVIEW_QL_GAP_TIMING,
  tax: OVERVIEW_QL_GAP_TAX,
  discounts: OVERVIEW_QL_GAP_DISCOUNTS,
  channels: OVERVIEW_QL_GAP_CHANNELS,
  draft: OVERVIEW_QL_GAP_DRAFT,
};

export type OverviewQlFirstFold = {
  sourceLabel: typeof OVERVIEW_PERIOD_TOTAL_LABEL;
  /** Shopify Total Sales for the selected window. Null paints —. */
  totalSales: number | null;
  /** Net Sales when every closed day persisted net. Null paints —. */
  netSales: number | null;
  netSalesKnown: boolean;
  gapAmount: number | null;
  gapKind: OverviewQlGapKind | null;
  gapLabel: string | null;
  priorYearTotalSales: number | null;
  yoyPct: number | null;
  zone: OverviewOrderBookHero["zone"];
  empty: boolean;
  periodNote: string | null;
  /** Overview never paints spend — empty stays em dash. */
  spendDisplay: "—";
};

export type OverviewOrderGatedStrip = {
  returningSales: number | null;
  typicalOrder: number | null;
  weekendShare: number | null;
};

function finite(value: number | null | undefined): value is number {
  return value != null && Number.isFinite(value);
}

/** Classify Total − Net when net is complete; incomplete net → gap paints —. */
export function classifyOverviewQlGap(input: {
  totalSales: number;
  netSales: number;
  netSalesKnown: boolean;
  factsPending: boolean;
  grossSales?: number | null;
  grossSalesKnown?: boolean;
}): {
  gapAmount: number | null;
  gapKind: OverviewQlGapKind | null;
  gapLabel: string | null;
} {
  if (!input.netSalesKnown) {
    return { gapAmount: null, gapKind: null, gapLabel: null };
  }
  const gap = input.totalSales - input.netSales;
  if (!Number.isFinite(gap)) {
    return { gapAmount: null, gapKind: null, gapLabel: null };
  }
  if (Math.abs(gap) < 0.01) {
    return { gapAmount: 0, gapKind: null, gapLabel: null };
  }
  if (input.factsPending) {
    return {
      gapAmount: gap,
      gapKind: "timing",
      gapLabel: GAP_COPY.timing,
    };
  }
  if (
    input.grossSalesKnown &&
    finite(input.grossSales) &&
    input.grossSales > input.netSales + 0.01 &&
    input.totalSales < input.grossSales - 0.01
  ) {
    return {
      gapAmount: gap,
      gapKind: "discounts",
      gapLabel: GAP_COPY.discounts,
    };
  }
  return {
    gapAmount: gap,
    gapKind: "tax",
    gapLabel: GAP_COPY.tax,
  };
}

/**
 * Live Overview hero from stored ShopifyQL day facts (+ optional today top-up).
 * Mirrors {@link buildOverviewShopifyPeriodClock} readiness — order sums never
 * substitute for the hero total.
 */
export function buildOverviewQlFirstFold(input: {
  useSampleDesk: boolean;
  coverageComplete: boolean;
  periodExceedsFactWindow: boolean;
  shopifyPeriodTotal: number | null;
  periodIncludesToday: boolean;
  todayShopifyTotalKnown: boolean;
  factsPending: boolean;
  netSales: number | null;
  netSalesKnown: boolean;
  grossSales?: number | null;
  grossSalesKnown?: boolean;
  priorYearTotalSales: number | null;
}): OverviewQlFirstFold | null {
  if (!deskAnalyticsDayTotalsLive(input.useSampleDesk)) return null;

  const todayOk = !input.periodIncludesToday || input.todayShopifyTotalKnown;
  const finiteTotal = finite(input.shopifyPeriodTotal);
  const periodReady =
    input.coverageComplete &&
    !input.periodExceedsFactWindow &&
    !input.factsPending &&
    todayOk &&
    finiteTotal;
  const storedWhileBackfill =
    !periodReady &&
    todayOk &&
    !input.periodExceedsFactWindow &&
    finiteTotal &&
    input.shopifyPeriodTotal > 0;

  const totalSales =
    periodReady || storedWhileBackfill ? input.shopifyPeriodTotal : null;
  const periodNote = periodReady
    ? null
    : storedWhileBackfill
      ? OVERVIEW_SHOPIFY_CLOCK_PARTIAL
      : input.factsPending
        ? OVERVIEW_SHOPIFY_CLOCK_PENDING
        : OVERVIEW_LAST_YEAR_NOT_ON_FILE;

  const netSales =
    input.netSalesKnown && finite(input.netSales) && totalSales != null
      ? input.netSales
      : input.netSalesKnown && totalSales != null
        ? input.netSales
        : null;

  const gap =
    totalSales != null && finite(totalSales)
      ? classifyOverviewQlGap({
          totalSales,
          netSales: netSales ?? totalSales,
          netSalesKnown: input.netSalesKnown,
          factsPending: input.factsPending,
          grossSales: input.grossSales,
          grossSalesKnown: input.grossSalesKnown,
        })
      : { gapAmount: null, gapKind: null, gapLabel: null };

  const prior = input.priorYearTotalSales;
  const yoyPct =
    totalSales != null && finite(totalSales)
      ? overviewYoyPct(totalSales, prior)
      : null;
  const zone = overviewYoyZoneFromPct(yoyPct);
  const empty = totalSales == null;

  return {
    sourceLabel: OVERVIEW_PERIOD_TOTAL_LABEL,
    totalSales,
    netSales: input.netSalesKnown ? netSales : null,
    netSalesKnown: input.netSalesKnown,
    gapAmount: gap.gapAmount,
    gapKind: gap.gapKind,
    gapLabel: gap.gapLabel,
    priorYearTotalSales: prior,
    yoyPct,
    zone,
    empty,
    periodNote,
    spendDisplay: "—",
  };
}

/** Order-gated strip under the QL hero — sealed book only, else —. */
export function overviewOrderGatedStrip(input: {
  ordersSealed: boolean;
  returningSales: number | null;
  typicalOrder: number | null;
  weekendShare: number | null;
}): OverviewOrderGatedStrip {
  if (!input.ordersSealed) {
    return {
      returningSales: null,
      typicalOrder: null,
      weekendShare: null,
    };
  }
  return {
    returningSales:
      input.returningSales != null && input.returningSales > 0
        ? input.returningSales
        : null,
    typicalOrder:
      input.typicalOrder != null && input.typicalOrder > 0
        ? input.typicalOrder
        : null,
    weekendShare:
      input.weekendShare != null &&
      Number.isFinite(input.weekendShare) &&
      input.weekendShare > 0
        ? input.weekendShare
        : null,
  };
}

export function overviewQlPriorYearLine(
  priorSales: number | null,
  formatMoney: (n: number) => string,
  stillLoading: boolean,
): string {
  if (priorSales != null && Number.isFinite(priorSales)) {
    return `same days last year ${formatMoney(priorSales)}`;
  }
  if (stillLoading) {
    return "Last year still loading — not $0.";
  }
  return OVERVIEW_LAST_YEAR_NOT_ON_FILE;
}
