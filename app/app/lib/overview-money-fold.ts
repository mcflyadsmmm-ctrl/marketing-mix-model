/**
 * Overview cold-open money answer.
 * Shopify Total Sales for the selected period stay on the first fold
 * even when spend rows are empty. Cash Total ROAS = those sales ÷ entered
 * spend. Empty spend paints —, never 0.00× and never a failing tone.
 * Live dollars are the overview order book (overview_orders). Sample copy
 * stays labeled SAMPLE.
 */
import { computeMer } from "@mcfly/mer-engine";
import { formatMer } from "./mer-format";
import { OVERVIEW_PERIOD_TOTAL_LABEL } from "./overview-first-viewport";
import { hasSpendOnFile } from "./spend-on-file";

export const OVERVIEW_MONEY_SENTENCE =
  "Sales from Shopify. Add spend when you have it for cash Total ROAS.";

export const OVERVIEW_MONEY_SENTENCE_WITH_SPEND =
  "Sales from Shopify. Total ROAS is sales ÷ entered spend.";

export type OverviewMoneyFoldModel = {
  label: typeof OVERVIEW_PERIOD_TOTAL_LABEL;
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
}): OverviewMoneyFoldModel {
  const sales = periodSales(input.sales, input.salesPending);
  return {
    label: OVERVIEW_PERIOD_TOTAL_LABEL,
    sales,
    salesVisibleWithoutSpend: true,
    roasText: overviewCashTotalRoasText(sales, input.spend, input.salesPending),
    roasFailing: false,
    sentence: overviewMoneySentence(input.useSampleDesk, input.spend),
    sample: input.useSampleDesk,
    modeLabel: input.useSampleDesk ? "SAMPLE" : "Live",
  };
}
