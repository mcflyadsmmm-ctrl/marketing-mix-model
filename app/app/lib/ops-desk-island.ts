/**
 * Black Clover–style operator island: one takeaway + dense 4-up KPI rail.
 * Pure — Overview paints this before the deeper panels.
 */

import type { OrderEconomics } from "./order-economics";
import { summarizeOrderEconomics } from "./order-economics";

export type OpsDeskKpi = {
  id: string;
  label: string;
  value: string;
  hint: string;
  accent?: boolean;
};

export type OpsDeskIslandModel = {
  kicker: string;
  takeaway: string;
  kpis: OpsDeskKpi[];
};

function money(n: number): string {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: n >= 100 ? 0 : 2,
  }).format(n);
}

function pct(rate: number): string {
  return `${Math.round(rate * 1000) / 10}%`;
}

function medianDays(days: number): string {
  if (days < 1) return "<1 day";
  if (days < 10) return `${Math.round(days * 10) / 10}d`;
  return `${Math.round(days)}d`;
}

export type OpsDeskIslandInput = {
  periodLabel: string;
  economics: OrderEconomics;
  buyerRepeat?: {
    secondWithin90: number | null;
    medianDaysToSecond: number | null;
  } | null;
  avgRevenueD90?: number | null;
  newBuyers?: number | null;
  dayInsight?: string | null;
  /** Heaviest-buyer revenue share (Shopify-only depth). */
  top10BuyerShare?: number | null;
};

/**
 * Build the BC-smooth first viewport: decision sentence + up to 4 KPIs.
 * Prefers order + customer depth Shopify will not put on one screen.
 */
export function buildOpsDeskIsland(
  input: OpsDeskIslandInput,
): OpsDeskIslandModel | null {
  const { economics } = input;
  if (!economics.hasSignal) return null;

  const kpis: OpsDeskKpi[] = [];

  if (economics.aov != null) {
    kpis.push({
      id: "aov",
      label: "AOV",
      value: money(economics.aov),
      hint: `${economics.orderCount.toLocaleString()} orders · ${money(economics.sales)} sales`,
      accent: true,
    });
  }

  if (economics.returningShare != null) {
    kpis.push({
      id: "returning",
      label: "Returning $",
      value: pct(economics.returningShare),
      hint: `${money(economics.returningCustomerSales)} returning · ${money(economics.newCustomerSales)} new`,
    });
  }

  const second90 = input.buyerRepeat?.secondWithin90 ?? null;
  const median = input.buyerRepeat?.medianDaysToSecond ?? null;
  if (second90 != null) {
    kpis.push({
      id: "second90",
      label: "2nd order · 90d",
      value: pct(second90),
      hint:
        median != null
          ? `Median ${medianDays(median)} to 2nd · mature buyers`
          : "Mature buyers with a 2nd purchase in 90 days",
    });
  } else if (input.avgRevenueD90 != null) {
    kpis.push({
      id: "ltv90",
      label: "LTV · 90d",
      value: money(input.avgRevenueD90),
      hint:
        input.newBuyers != null && input.newBuyers > 0
          ? `${input.newBuyers.toLocaleString()} new buyers this period`
          : "Cohort average revenue at 90 days",
    });
  }

  if (input.top10BuyerShare != null && kpis.length < 4) {
    kpis.push({
      id: "top10",
      label: "Top 10% buyers",
      value: pct(input.top10BuyerShare),
      hint: "Lifetime revenue from your heaviest tenth of buyers",
    });
  } else if (economics.weekendShare != null && kpis.length < 4) {
    kpis.push({
      id: "weekend",
      label: "Weekend share",
      value: pct(economics.weekendShare),
      hint: `${money(economics.weekendSales)} Sat–Sun · ${money(economics.weekdaySales)} weekdays`,
    });
  } else if (
    economics.spendPerOrder != null &&
    kpis.length < 4
  ) {
    kpis.push({
      id: "spo",
      label: "Spend / order",
      value: money(economics.spendPerOrder),
      hint: "Ad spend ÷ orders — join Shopify cannot do alone",
    });
  }

  if (kpis.length === 0) return null;

  const orderTake = summarizeOrderEconomics(economics);
  const takeaway =
    (input.dayInsight && input.dayInsight.trim()) ||
    orderTake ||
    `${economics.orderCount.toLocaleString()} orders · depth Shopify Analytics won’t put on one screen.`;

  return {
    kicker: `Operator desk · ${input.periodLabel}`,
    takeaway,
    kpis: kpis.slice(0, 4),
  };
}
