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

export type SalesDepthDayFact = {
  dayKey: string;
  sales: number;
  orderCount: number;
};

function money(n: number): string {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: n >= 100 ? 0 : 2,
  }).format(n);
}

function priorDelta(now: number, prior: number): string | null {
  if (!(prior > 0) || !Number.isFinite(now)) return null;
  const d = ((now - prior) / prior) * 100;
  return `${d >= 0 ? "+" : ""}${d.toFixed(0)}% vs prior`;
}

/**
 * Strongest / softest among filled closed days only.
 * Skips the open shop-local day so today never wins the contest.
 */
export function strongestSoftestAmongFilled(
  dayFacts: SalesDepthDayFact[],
  openDayKey: string | null | undefined,
): { strongest: SalesDepthDayFact; softest: SalesDepthDayFact } | null {
  const closed = dayFacts.filter(
    (d) =>
      d.orderCount > 0 &&
      Number.isFinite(d.sales) &&
      (openDayKey == null || d.dayKey !== openDayKey),
  );
  if (closed.length === 0) return null;
  let strongest = closed[0]!;
  let softest = closed[0]!;
  for (const d of closed) {
    if (d.sales > strongest.sales) strongest = d;
    if (d.sales < softest.sales) softest = d;
  }
  return { strongest, softest };
}

function formatDayPair(
  pair: { strongest: SalesDepthDayFact; softest: SalesDepthDayFact },
  amongFilled: boolean,
): string {
  const base =
    pair.strongest.dayKey === pair.softest.dayKey
      ? `Strongest ${pair.strongest.dayKey} · ${money(pair.strongest.sales)} · ${pair.strongest.orderCount.toLocaleString()} orders`
      : `Strongest ${pair.strongest.dayKey} · ${money(pair.strongest.sales)} · Softest ${pair.softest.dayKey} · ${money(pair.softest.sales)}`;
  return amongFilled ? `${base} · among filled days` : base;
}

export function buildSalesDepthDecision(args: {
  periodLabel: string;
  periodPreset: string;
  economics: OrderEconomics;
  accuracy: SalesDayAccuracySnapshot;
  /** Filled day facts only — holes must not be invented as $0. */
  dayFacts?: SalesDepthDayFact[];
  /** Matched prior window — unlocks KPI deltas when present. */
  priorDayFacts?: SalesDepthDayFact[];
}): OpsDeskIslandModel | null {
  const incomplete =
    args.accuracy.status === "catching_up" ||
    args.accuracy.status === "partial_history";

  const pair =
    args.dayFacts && args.dayFacts.length > 0
      ? strongestSoftestAmongFilled(args.dayFacts, args.accuracy.openDayKey)
      : null;
  const dayPairLine = pair ? formatDayPair(pair, incomplete) : null;

  const accuracyInsight =
    args.accuracy.status === "catching_up"
      ? `${args.accuracy.headline}. Filled days only — missing days are not $0.`
      : args.accuracy.status === "partial_history"
        ? args.accuracy.headline
        : args.accuracy.status === "complete" && args.economics.orderCount > 0
          ? `${args.economics.orderCount.toLocaleString()} orders · ${money(args.economics.sales)} across ${args.accuracy.factDays} closed days.`
          : null;

  const dayInsight =
    [accuracyInsight, dayPairLine].filter(Boolean).join(" ") || null;

  const prior = args.priorDayFacts ?? [];
  const priorSales = prior.reduce((s, d) => s + d.sales, 0);
  const priorOrders = prior.reduce((s, d) => s + d.orderCount, 0);
  const priorAov = priorOrders > 0 ? priorSales / priorOrders : null;
  const aov = args.economics.aov;

  const model = buildOpsDeskIsland({
    periodLabel: args.periodLabel,
    periodPreset: args.periodPreset,
    economics: args.economics,
    dayInsight,
    hasLiveSpend: false,
    salesDelta: prior.length ? priorDelta(args.economics.sales, priorSales) : null,
    ordersDelta: prior.length
      ? priorDelta(args.economics.orderCount, priorOrders)
      : null,
    aovDelta:
      prior.length && aov != null && priorAov != null
        ? priorDelta(aov, priorAov)
        : null,
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
