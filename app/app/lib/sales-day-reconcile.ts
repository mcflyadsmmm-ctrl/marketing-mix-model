/**
 * Pure Shopify-vs-SalesDayFact reconciliation.
 * Spot-check closed days so refunds/edits cannot leave Mcfly quietly wrong.
 */

export type SalesDayFactProbe = {
  dayKey: string;
  sales: number;
  orderCount: number;
};

export type SalesDayLiveProbe = {
  dayKey: string;
  sales: number;
  orderCount: number;
};

export type SalesDayMismatch = {
  dayKey: string;
  factSales: number;
  liveSales: number;
  factOrders: number;
  liveOrders: number;
  salesDelta: number;
  orderDelta: number;
};

export type SalesDayReconcileAssessment = {
  status: "matched" | "mismatch" | "skipped";
  checkedDayKeys: string[];
  mismatches: SalesDayMismatch[];
  headline: string | null;
  detail: string | null;
};

/** Absolute dollars + relative band — float noise only, not real drift. */
export const SALES_RECONCILE_ABS_TOLERANCE = 0.02;
export const SALES_RECONCILE_REL_TOLERANCE = 0.002; // 0.2%

export function salesAmountsMatch(
  factSales: number,
  liveSales: number,
  opts?: { absTolerance?: number; relTolerance?: number },
): boolean {
  const absTol = opts?.absTolerance ?? SALES_RECONCILE_ABS_TOLERANCE;
  const relTol = opts?.relTolerance ?? SALES_RECONCILE_REL_TOLERANCE;
  const delta = Math.abs(factSales - liveSales);
  if (delta <= absTol) return true;
  const scale = Math.max(Math.abs(factSales), Math.abs(liveSales), 1);
  return delta / scale <= relTol;
}

export function salesDayProbeMatches(
  fact: SalesDayFactProbe,
  live: SalesDayLiveProbe,
): boolean {
  if (fact.dayKey !== live.dayKey) return false;
  if (fact.orderCount !== live.orderCount) return false;
  return salesAmountsMatch(fact.sales, live.sales);
}

/**
 * Pick closed days inside the selected period for a live spot-check.
 * Prefer newest closed days that already have facts (catch amount drift).
 * Cap keeps Sales paint fast.
 */
export function selectSalesDayReconcileTargets(args: {
  expectedClosedDayKeys: string[];
  presentDayKeys: Iterable<string>;
  openDayKey?: string | null;
  /** Default 3 — enough signal without crawling the whole period. */
  limit?: number;
}): string[] {
  const present = new Set(args.presentDayKeys);
  const open = args.openDayKey ?? null;
  const limit = Math.max(1, args.limit ?? 3);
  const closed = args.expectedClosedDayKeys
    .filter((k) => k !== open && present.has(k))
    .sort((a, b) => b.localeCompare(a));
  return closed.slice(0, limit);
}

export function assessSalesDayReconcile(args: {
  facts: SalesDayFactProbe[];
  live: SalesDayLiveProbe[];
}): SalesDayReconcileAssessment {
  const factByKey = new Map(args.facts.map((f) => [f.dayKey, f]));
  const liveByKey = new Map(args.live.map((l) => [l.dayKey, l]));
  const checkedDayKeys = [...new Set([...factByKey.keys(), ...liveByKey.keys()])].sort();

  if (checkedDayKeys.length === 0) {
    return {
      status: "skipped",
      checkedDayKeys: [],
      mismatches: [],
      headline: null,
      detail: null,
    };
  }

  const mismatches: SalesDayMismatch[] = [];
  for (const dayKey of checkedDayKeys) {
    const fact = factByKey.get(dayKey);
    const live = liveByKey.get(dayKey);
    if (!fact || !live) {
      mismatches.push({
        dayKey,
        factSales: fact?.sales ?? 0,
        liveSales: live?.sales ?? 0,
        factOrders: fact?.orderCount ?? 0,
        liveOrders: live?.orderCount ?? 0,
        salesDelta: (live?.sales ?? 0) - (fact?.sales ?? 0),
        orderDelta: (live?.orderCount ?? 0) - (fact?.orderCount ?? 0),
      });
      continue;
    }
    if (!salesDayProbeMatches(fact, live)) {
      mismatches.push({
        dayKey,
        factSales: fact.sales,
        liveSales: live.sales,
        factOrders: fact.orderCount,
        liveOrders: live.orderCount,
        salesDelta: live.sales - fact.sales,
        orderDelta: live.orderCount - fact.orderCount,
      });
    }
  }

  if (mismatches.length === 0) {
    return {
      status: "matched",
      checkedDayKeys,
      mismatches: [],
      headline: null,
      detail: null,
    };
  }

  const sample = mismatches
    .slice(0, 3)
    .map((m) => m.dayKey)
    .join(", ");
  const more =
    mismatches.length > 3 ? ` (+${mismatches.length - 3} more)` : "";

  return {
    status: "mismatch",
    checkedDayKeys,
    mismatches,
    headline: `Shopify totals disagree on ${mismatches.length} checked day${mismatches.length === 1 ? "" : "s"}`,
    detail: `Live Admin check found drift on ${sample}${more}. Re-syncing those closed days now — Mcfly will not quietly keep the wrong number.`,
  };
}
