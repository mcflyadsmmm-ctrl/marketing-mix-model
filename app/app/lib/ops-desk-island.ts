/**
 * Black Clover–grade operator desk model (Shopify-first).
 * Decision takeaway + tone + actions + dense 4-up KPI rail.
 * Pure — Overview paints this before deeper panels.
 */

import type { OrderEconomics } from "./order-economics";
import { summarizeOrderEconomics } from "./order-economics";
import { formatShopMoney } from "./mer-format";

export type OpsDeskTone = "strong" | "steady" | "watch";

export type OpsDeskAction = {
  id: string;
  label: string;
  href: string;
  primary?: boolean;
};

export type OpsDeskKpi = {
  id: string;
  label: string;
  value: string;
  hint: string;
  accent?: boolean;
  delta?: string | null;
};

export type OpsDeskIslandModel = {
  kicker: string;
  takeaway: string;
  /** Supporting why-line under the Fraunces takeaway. */
  why: string;
  tone: OpsDeskTone;
  actions: OpsDeskAction[];
  kpis: OpsDeskKpi[];
};

function money(n: number, currencyCode?: string | null): string {
  return formatShopMoney(n, currencyCode);
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
  periodPreset: string;
  economics: OrderEconomics;
  currencyCode?: string | null;
  /** Matches BuyerRepeatSummary field names from till LTV. */
  buyerRepeat?: {
    secondWithin90: number | null;
    medianDaysToSecond: number | null;
  } | null;
  avgRevenueD90?: number | null;
  newBuyers?: number | null;
  dayInsight?: string | null;
  /** Heaviest-buyer revenue share (Shopify-only depth). */
  top10BuyerShare?: number | null;
  /** When false, offer a quiet later path to Spend — never the primary. */
  hasLiveSpend?: boolean;
  /** Prior-window deltas for the KPI rail (e.g. "+12% vs prior"). */
  salesDelta?: string | null;
  ordersDelta?: string | null;
  aovDelta?: string | null;
};

function resolveTone(input: OpsDeskIslandInput): OpsDeskTone {
  const { economics } = input;
  const second90 = input.buyerRepeat?.secondWithin90 ?? null;
  if (
    (economics.returningShare != null && economics.returningShare >= 0.42) ||
    (second90 != null && second90 >= 0.35)
  ) {
    return "strong";
  }
  if (
    (economics.returningShare != null &&
      economics.returningShare <= 0.15 &&
      economics.orderCount >= 20) ||
    (economics.weekendShare != null && economics.weekendShare >= 0.55)
  ) {
    return "watch";
  }
  return "steady";
}

function buildWhy(input: OpsDeskIslandInput, tone: OpsDeskTone): string {
  const { economics } = input;
  const bits: string[] = [];
  if (economics.orderCount > 0) {
    bits.push(
      `${economics.orderCount.toLocaleString()} orders · ${money(economics.sales, input.currencyCode)} Shopify sales`,
    );
  }
  if (input.top10BuyerShare != null) {
    bits.push(
      `Top 10% buyers carry ${pct(input.top10BuyerShare)} of lifetime revenue`,
    );
  } else if (economics.returningShare != null) {
    bits.push(
      `${pct(economics.returningShare)} of attributed sales from returning buyers`,
    );
  }
  if (tone === "watch" && economics.weekendShare != null) {
    bits.push(
      `Weekend ${pct(economics.weekendShare)} of sales — check day pacing`,
    );
  }
  return bits.slice(0, 2).join(" · ");
}

function buildActions(input: OpsDeskIslandInput): OpsDeskAction[] {
  const actions: OpsDeskAction[] = [
    {
      id: "customers",
      label: "Buyer ledger",
      href: `/app/customers?period=${encodeURIComponent(input.periodPreset)}`,
      primary: true,
    },
    {
      id: "days",
      label: "Day ledger",
      href: `/app/days?period=${encodeURIComponent(input.periodPreset)}`,
    },
    {
      id: "orders",
      label: "Orders",
      href: `/app/orders?period=${encodeURIComponent(input.periodPreset)}`,
    },
  ];
  if (!input.hasLiveSpend) {
    actions.push({
      id: "spend-later",
      label: "Add spend later",
      href: "/app/spend",
    });
  }
  return actions;
}

/**
 * Build the BC-smooth first viewport: decision strip + up to 4 KPIs.
 * Always leads with Sales / Orders / AOV so young stores still get a dense
 * rail when returning / LTV fields are missing.
 */
export function buildOpsDeskIsland(
  input: OpsDeskIslandInput,
): OpsDeskIslandModel | null {
  const { economics } = input;
  if (!economics.hasSignal) return null;
  const currency = input.currencyCode;

  const kpis: OpsDeskKpi[] = [
    {
      id: "sales",
      label: "Sales",
      value: money(economics.sales, currency),
      hint: input.periodLabel,
      accent: true,
      delta: input.salesDelta ?? null,
    },
    {
      id: "orders",
      label: "Orders",
      value: economics.orderCount.toLocaleString(),
      hint:
        economics.aov != null
          ? `AOV ${money(economics.aov, currency)}`
          : "Shopify orders in period",
      delta: input.ordersDelta ?? null,
    },
  ];

  if (economics.aov != null) {
    kpis.push({
      id: "aov",
      label: "AOV",
      value: money(economics.aov, currency),
      hint: `${economics.orderCount.toLocaleString()} orders`,
      delta: input.aovDelta ?? null,
    });
  }

  const second90 = input.buyerRepeat?.secondWithin90 ?? null;
  const median = input.buyerRepeat?.medianDaysToSecond ?? null;
  if (second90 != null && kpis.length < 4) {
    kpis.push({
      id: "second90",
      label: "2nd order · 90d",
      value: pct(second90),
      hint:
        median != null
          ? `Median ${medianDays(median)} to 2nd · mature buyers`
          : "Mature buyers with a 2nd purchase in 90 days",
    });
  } else if (economics.returningShare != null && kpis.length < 4) {
    kpis.push({
      id: "returning",
      label: "Returning $",
      value: pct(economics.returningShare),
      hint: `${money(economics.returningCustomerSales, currency)} returning · ${money(economics.newCustomerSales, currency)} new`,
    });
  } else if (input.avgRevenueD90 != null && kpis.length < 4) {
    kpis.push({
      id: "ltv90",
      label: "LTV · 90d",
      value: money(input.avgRevenueD90, currency),
      hint:
        input.newBuyers != null && input.newBuyers > 0
          ? `${input.newBuyers.toLocaleString()} new buyers this period`
          : "Cohort average revenue at 90 days",
    });
  } else if (input.top10BuyerShare != null && kpis.length < 4) {
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
      hint: `${money(economics.weekendSales, currency)} Sat–Sun · ${money(economics.weekdaySales, currency)} weekdays`,
    });
  } else if (economics.spendPerOrder != null && kpis.length < 4) {
    kpis.push({
      id: "spo",
      label: "Spend / order",
      value: money(economics.spendPerOrder, currency),
      hint: "Ad spend ÷ orders — join Shopify cannot do alone",
    });
  }

  if (kpis.length === 0) return null;

  const tone = resolveTone(input);
  const orderTake = summarizeOrderEconomics(economics);
  const takeaway =
    (input.dayInsight && input.dayInsight.trim()) ||
    orderTake ||
    `${economics.orderCount.toLocaleString()} orders · depth Shopify Analytics won’t put on one screen.`;

  return {
    kicker: `Operator desk · ${input.periodLabel}`,
    takeaway,
    why: buildWhy(input, tone),
    tone,
    actions: buildActions(input),
    kpis: kpis.slice(0, 4),
  };
}
