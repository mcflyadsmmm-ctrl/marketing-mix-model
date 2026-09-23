/**
 * Spend first viewport — Total ROAS (sales ÷ entered spend) vs Shopify Analytics.
 * Religion: empty spend paints —, never 0×.
 */

import type { DeskIconName } from "../components/DeskIcon";
import { formatMer } from "./mer-format";
import type { PeriodDeltas } from "./period-deltas";

export const SPEND_PENDING_LINE =
  "Sales for closed days are still loading — not $0.";

export const SPEND_THIN_EMPTY_LINE =
  "Enter spend to pair with Shopify sales — Total ROAS stays —, never 0×.";

export const SPEND_FIRST_LANE_LABEL = "Total ROAS";

export const SPEND_COMPARE_SECTION_LABEL = "Vs prior period";

export const SPEND_COMPARE_MISSING_LINE = "Prior period not on file.";

export const SPEND_CHART_SECTION_LABEL = "Sales and entered spend";

export const SPEND_DEPTH_LANE_LABEL = "Mix, CPA, and certified windows";

/**
 * Shopify Analytics shows sales, not a spend ledger. Screen-reader only on first fold.
 */
export const SPEND_ANALYTICS_CONTRAST =
  "Shopify Analytics shows sales, not a spend ledger. This page records typed, uploaded, or daily-rate spend — not Ads Manager login.";

export const SPEND_ANALYTICS_SR_LINE = SPEND_ANALYTICS_CONTRAST;

export const SPEND_FIRST_FOLD_HEROES = [
  "totalRoas",
  "salesSpendPair",
  "priorCompare",
  "explorerChart",
] as const;

export type SpendFirstFoldHero = (typeof SPEND_FIRST_FOLD_HEROES)[number];

export type SpendCompareKpi = {
  key: string;
  label: string;
  value: string;
  icon: DeskIconName;
  delta?: { dir: "up" | "down" | "flat"; pct: number };
  merDeltaAbs?: number | null;
};

function deltaDir(pct: number | null | undefined): "up" | "down" | "flat" | null {
  if (pct == null || !Number.isFinite(pct)) return null;
  if (Math.abs(pct) < 0.05) return "flat";
  return pct > 0 ? "up" : "down";
}

function merDeltaDir(merAbs: number | null | undefined): "up" | "down" | "flat" | null {
  if (merAbs == null || !Number.isFinite(merAbs)) return null;
  if (Math.abs(merAbs) < 0.005) return "flat";
  return merAbs > 0 ? "up" : "down";
}

/**
 * Compact prior strip — sales, spend, Total ROAS. No essay.
 */
export function buildSpendCompareKpis(input: {
  deltas: PeriodDeltas | null;
  salesPending: boolean;
  sales: number;
  spend: number;
  mer: number | null;
  money: (n: number) => string;
}): SpendCompareKpi[] {
  const { deltas, salesPending, sales, spend, mer, money } = input;
  if (salesPending) return [];
  if (!deltas) return [];

  const roasValue =
    spend > 0 && mer != null && Number.isFinite(mer)
      ? `${formatMer(mer)}×`
      : "—";
  const salesDir = deltaDir(deltas.salesPct);
  const spendDir = deltaDir(deltas.spendPct);
  const merDir = merDeltaDir(deltas.merAbs);

  return [
    {
      key: "sales",
      label: "Sales",
      icon: "sales",
      value: money(sales),
      delta:
        salesDir && deltas.salesPct != null
          ? { dir: salesDir, pct: deltas.salesPct }
          : undefined,
    },
    {
      key: "spend",
      label: "Spend",
      icon: "spend",
      value: spend > 0 ? money(spend) : "—",
      delta:
        spendDir && deltas.spendPct != null
          ? { dir: spendDir, pct: deltas.spendPct }
          : undefined,
    },
    {
      key: "roas",
      label: "Total ROAS",
      icon: "roas",
      value: roasValue,
      delta: merDir ? { dir: merDir, pct: 0 } : undefined,
      merDeltaAbs: deltas.merAbs,
    },
  ];
}

export function spendHeroBeatsShopifyAnalytics(hero: SpendFirstFoldHero): boolean {
  switch (hero) {
    case "totalRoas":
    case "salesSpendPair":
    case "priorCompare":
    case "explorerChart":
      return true;
    default: {
      const _never: never = hero;
      return _never;
    }
  }
}
