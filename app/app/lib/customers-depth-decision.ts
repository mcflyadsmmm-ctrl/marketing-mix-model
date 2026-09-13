/**
 * Customers-first decision strip — works from day facts when order history
 * is still thin. Pure. Order-history honesty when seals are incomplete.
 */

import type { OrderEconomics } from "./order-economics";
import { summarizeOrderEconomics } from "./order-economics";
import type { SalesDayAccuracySnapshot } from "./sales-day-accuracy";
import type { OrderHistoryAccuracySnapshot } from "./order-history-accuracy";
import {
  buildOpsDeskIsland,
  type OpsDeskIslandModel,
} from "./ops-desk-island";

function pct(rate: number): string {
  return `${Math.round(rate * 1000) / 10}%`;
}

function money(n: number): string {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: n >= 100 ? 0 : 2,
  }).format(n);
}

export function buildCustomersDepthDecision(args: {
  periodLabel: string;
  periodPreset: string;
  economics: OrderEconomics;
  dayAccuracy: SalesDayAccuracySnapshot;
  orderHistoryAccuracy: OrderHistoryAccuracySnapshot;
}): OpsDeskIslandModel | null {
  const bits: string[] = [];

  if (args.economics.returningShare != null) {
    bits.push(
      `Returning buyers drove ${pct(args.economics.returningShare)} of attributed sales (${money(args.economics.returningCustomerSales)} returning · ${money(args.economics.newCustomerSales)} new).`,
    );
  } else if (args.economics.hasSignal) {
    bits.push(
      "New vs returning split is not on these day facts yet — Sales still reads from Shopify day totals.",
    );
  }

  if (args.orderHistoryAccuracy.status === "catching_up") {
    bits.push(
      `${args.orderHistoryAccuracy.headline} Repeat and concentration charts fill as order history seals.`,
    );
  } else if (args.orderHistoryAccuracy.status === "partial_history") {
    bits.push(args.orderHistoryAccuracy.headline);
  } else if (
    args.orderHistoryAccuracy.status === "complete" &&
    args.dayAccuracy.status === "complete"
  ) {
    bits.push("Order history sealed for this window — repeat depth is ready.");
  }

  if (args.dayAccuracy.reconcileStatus === "mismatch") {
    bits.unshift(
      `${args.dayAccuracy.headline} ${args.dayAccuracy.detail}`.trim(),
    );
  } else if (args.dayAccuracy.status === "catching_up") {
    bits.push("Sales day facts still filling — missing days are not $0.");
  }

  const dayInsight = bits.join(" ") || null;

  const model = buildOpsDeskIsland({
    periodLabel: args.periodLabel,
    periodPreset: args.periodPreset,
    economics: args.economics,
    dayInsight,
    hasLiveSpend: false,
  });
  if (!model) return null;

  const why =
    args.dayAccuracy.reconcileStatus === "mismatch"
      ? args.dayAccuracy.detail
      : args.orderHistoryAccuracy.status === "complete" &&
          args.dayAccuracy.status === "complete"
        ? model.why || summarizeOrderEconomics(args.economics) || ""
        : [args.orderHistoryAccuracy.detail, args.dayAccuracy.detail]
            .filter(Boolean)
            .join(" ");

  return {
    ...model,
    kicker: `Customers · ${args.periodLabel}`,
    why,
    actions: [
      {
        id: "returning-share",
        label: "Returning share",
        href: "#depth-returning_sales_share",
        primary: true,
      },
      {
        id: "sales",
        label: "Sales",
        href: `/app/sales?period=${encodeURIComponent(args.periodPreset)}`,
      },
      {
        id: "goals",
        label: "Goals",
        href: "/app/goals",
      },
    ],
  };
}
