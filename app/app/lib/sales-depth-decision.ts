/**
 * Sales-first decision strip — BC density without spend.
 * Pure. Prefer day-accuracy honesty in the takeaway when facts are incomplete.
 */

import type { OrderEconomics } from "./order-economics";
import { summarizeOrderEconomics } from "./order-economics";
import type { SalesDayAccuracySnapshot } from "./sales-day-accuracy";
import {
  buildOpsDeskIsland,
  type OpsDeskIslandModel,
} from "./ops-desk-island";

function money(n: number): string {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: n >= 100 ? 0 : 2,
  }).format(n);
}

export function buildSalesDepthDecision(args: {
  periodLabel: string;
  periodPreset: string;
  economics: OrderEconomics;
  accuracy: SalesDayAccuracySnapshot;
}): OpsDeskIslandModel | null {
  const accuracyInsight =
    args.accuracy.status === "catching_up"
      ? `${args.accuracy.headline}. Filled days only — missing days are not $0.`
      : args.accuracy.status === "partial_history"
        ? args.accuracy.headline
        : args.accuracy.status === "complete" && args.economics.orderCount > 0
          ? `${args.economics.orderCount.toLocaleString()} orders · ${money(args.economics.sales)} across ${args.accuracy.factDays} closed days.`
          : null;

  const model = buildOpsDeskIsland({
    periodLabel: args.periodLabel,
    periodPreset: args.periodPreset,
    economics: args.economics,
    dayInsight: accuracyInsight,
    hasLiveSpend: false,
  });
  if (!model) return null;

  return {
    ...model,
    kicker: `Sales · ${args.periodLabel}`,
    why:
      args.accuracy.status === "complete"
        ? model.why || summarizeOrderEconomics(args.economics) || ""
        : args.accuracy.detail,
    actions: [
      {
        id: "customers",
        label: "Customers",
        href: `/app/customers?period=${encodeURIComponent(args.periodPreset)}`,
        primary: true,
      },
      {
        id: "day-board",
        label: "Day board",
        href: "#depth-day_board",
      },
      {
        id: "spend-later",
        label: "Add spend later",
        href: "/app/spend",
      },
    ],
  };
}
