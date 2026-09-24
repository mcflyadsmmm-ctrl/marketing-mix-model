/**
 * Overview cold-open money answer.
 * Live Shopify Total Sales on this fold are the same SalesDayFact / ShopifyQL
 * period total as the Overview clock, when that total is on file. Order-book
 * dollars stay labeled From orders and never wear the Shopify Total Sales name.
 * Cash Total ROAS = the figure on this fold ÷ entered spend. Empty spend
 * paints —, never 0.00× and never a failing tone. Sample stays SAMPLE and
 * From orders — sample bars are not Shopify Total Sales.
 */
import { computeMer } from "@mcfly/mer-engine";
import { formatMer } from "./mer-format";
import { OVERVIEW_FROM_ORDERS_LABEL } from "./overview-order-book";
import { OVERVIEW_PERIOD_TOTAL_LABEL } from "./overview-first-viewport";
import { hasSpendOnFile } from "./spend-on-file";

export const OVERVIEW_MONEY_SENTENCE =
  "Sales from Shopify. Add spend when you have it for cash Total ROAS.";

export const OVERVIEW_MONEY_SENTENCE_WITH_SPEND =
  "Sales from Shopify. Total ROAS is sales ÷ entered spend.";

/** `shopify` is SalesDayFact / ShopifyQL. `orders` is the overview order book. */
export type OverviewMoneySource = "shopify" | "orders";

export type OverviewMoneyFoldModel = {
  source: OverviewMoneySource;
  label: typeof OVERVIEW_PERIOD_TOTAL_LABEL | typeof OVERVIEW_FROM_ORDERS_LABEL;
  /** Null paints —. A certified 0 stays 0. Spend never hides this. */
  sales: number | null;
  salesVisibleWithoutSpend: true;
  roasText: string;
  /** Empty spend is never a red failing state. */
  roasFailing: false;
  sentence: string;
  sample: boolean;
  modeLabel: "SAMPLE" | "Live";
};

export type OverviewMoneyFoldResolution = {
  sales: number | null;
  salesPending: boolean;
  source: OverviewMoneySource;
};

function finiteSales(value: number | null | undefined): value is number {
  return value != null && Number.isFinite(value);
}

function moneySource(
  useSampleDesk: boolean,
  source: OverviewMoneySource,
): OverviewMoneySource {
  if (useSampleDesk) return "orders";
  switch (source) {
    case "shopify":
      return "shopify";
    case "orders":
      return "orders";
    default: {
      const _never: never = source;
      return _never;
    }
  }
}

function moneyLabel(
  source: OverviewMoneySource,
): OverviewMoneyFoldModel["label"] {
  switch (source) {
    case "shopify":
      return OVERVIEW_PERIOD_TOTAL_LABEL;
    case "orders":
      return OVERVIEW_FROM_ORDERS_LABEL;
    default: {
      const _never: never = source;
      return _never;
    }
  }
}

/**
 * Live first fold uses the clock's Shopify period total when that number is
 * on file (including a certified 0). Otherwise the fold shows the order book
 * and must be labeled From orders. Sample never takes the Shopify label.
 */
export function resolveOverviewMoneyFold(input: {
  useSampleDesk: boolean;
  orderSales: number | null;
  orderSalesPending: boolean;
  shopifyPeriodSales: number | null;
}): OverviewMoneyFoldResolution {
  if (!input.useSampleDesk && finiteSales(input.shopifyPeriodSales)) {
    return {
      sales: input.shopifyPeriodSales,
      salesPending: false,
      source: "shopify",
    };
  }
  return {
    sales: finiteSales(input.orderSales) ? input.orderSales : null,
    salesPending: input.orderSalesPending,
    source: "orders",
  };
}

function periodSales(
  sales: number | null,
  salesPending: boolean,
): number | null {
  if (sales == null || !Number.isFinite(sales)) return null;
  if (salesPending && sales === 0) return null;
  return sales;
}

/** Empty or missing spend is —, including a $0 sales month. Never 0.00×. */
export function overviewCashTotalRoasText(
  sales: number | null,
  spend: number | null,
  salesPending: boolean,
): string {
  if (!hasSpendOnFile(spend)) return "—";
  if (salesPending || sales == null || !Number.isFinite(sales)) return "—";
  const mer = computeMer(sales, spend);
  if (mer == null) return "—";
  return `${formatMer(mer)}×`;
}

export function overviewMoneySentence(
  useSampleDesk: boolean,
  spend: number | null,
): string {
  const body = hasSpendOnFile(spend)
    ? OVERVIEW_MONEY_SENTENCE_WITH_SPEND
    : OVERVIEW_MONEY_SENTENCE;
  return useSampleDesk ? `SAMPLE · ${body}` : body;
}

export function buildOverviewMoneyFold(input: {
  sales: number | null;
  salesPending: boolean;
  spend: number | null;
  useSampleDesk: boolean;
  source: OverviewMoneySource;
}): OverviewMoneyFoldModel {
  const sales = periodSales(input.sales, input.salesPending);
  const source = moneySource(input.useSampleDesk, input.source);
  return {
    source,
    label: moneyLabel(source),
    sales,
    salesVisibleWithoutSpend: true,
    roasText: overviewCashTotalRoasText(sales, input.spend, input.salesPending),
    roasFailing: false,
    sentence: overviewMoneySentence(input.useSampleDesk, input.spend),
    sample: input.useSampleDesk,
    modeLabel: input.useSampleDesk ? "SAMPLE" : "Live",
  };
}
