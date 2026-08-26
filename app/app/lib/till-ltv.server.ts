import {
  getCohortFacts,
  getOrderBackfillHistoryLimited,
  getOrderBackfillProgress,
} from "./order-facts.server";

export interface TillLtvCohortRow {
  cohortMonth: string;
  customers: number;
  revenueD30: number;
  revenueD90: number;
  revenueD365: number;
  ordersD30: number;
  ordersD90: number;
  ordersD365: number;
}

/** Why till LTV KPIs are empty — only meaningful when `available` is false. */
export type TillLtvEmptyReason =
  | "no_timezone"
  | "history_limited"
  | "backfilling"
  | "pro_required"
  | null;

export interface TillLtvSummary {
  available: boolean;
  historyLimited: boolean;
  /**
   * Honest empty-state reason when `available` is false:
   * no_timezone | history_limited | backfilling | pro_required.
   */
  emptyReason: TillLtvEmptyReason;
  cohortCount: number;
  avgRevenueD30: number | null;
  avgRevenueD90: number | null;
  avgRevenueD365: number | null;
  /** Cash CAC = totalSpend / newBuyers when newBuyers > 0. */
  cashCac: number | null;
  /**
   * New-buyer count used for cashCac (OrderFact uniques on live; sample day-sum).
   * UI must use this — not SalesDayFact `metrics.newCustomers` (always 0 on facts spine).
   */
  newBuyers: number;
  /** avgRevenueD90 / cashCac when both defined. */
  ltvCacRatio: number | null;
  cohorts: TillLtvCohortRow[];
  /** Share of cohort orders beyond the first (ordersD90 − customers) / customers. */
  repeatRate: number | null;
  /** Customer-weighted average orders in the first 90 days (Σ ordersD90 / Σ customers). */
  avgOrdersD90: number | null;
  /**
   * Interpolated cash-payback days: how long until avg cohort revenue
   * recovers cashCac, piecewise-linear across the 30/90/365d windows.
   * Null when cashCac is unknown or not recovered by day 365 — never a
   * causal claim, an honest average-cohort estimate only.
   */
  paybackDays: number | null;
  periodLabel: string | null;
}

/**
 * Customer-weighted average revenue per customer.
 * `pick` must return **cohort total revenue** (not per-customer) — we divide
 * by customer count once: Σ revenue / Σ customers.
 */
export function customerWeightedAvgRevenue(
  rows: TillLtvCohortRow[],
  pick: (r: TillLtvCohortRow) => number,
): number | null {
  let customers = 0;
  let revenue = 0;
  for (const r of rows) {
    if (r.customers <= 0) continue;
    customers += r.customers;
    revenue += pick(r);
  }
  if (customers <= 0) return null;
  return revenue / customers;
}

/**
 * Interpolated cash-payback days — piecewise-linear across the honest
 * cohort revenue anchors (day 0 → $0, day 30, day 90, day 365).
 *
 * Missing windows (null) simply drop out of the anchor list, so the
 * interpolation spans straight to the next known window. Average cohort
 * math only — never a causal or per-customer forecast.
 *
 * Returns null when `cashCac` is unknown/non-positive, or when average
 * cohort revenue never reaches cashCac by day 365.
 */
export function cashPaybackDays(
  cashCac: number | null,
  avgRevenueD30: number | null,
  avgRevenueD90: number | null,
  avgRevenueD365: number | null,
): number | null {
  if (cashCac == null || !Number.isFinite(cashCac) || cashCac <= 0) {
    return null;
  }

  const anchors: Array<{ day: number; revenue: number }> = [
    { day: 0, revenue: 0 },
  ];
  if (avgRevenueD30 != null && Number.isFinite(avgRevenueD30)) {
    anchors.push({ day: 30, revenue: avgRevenueD30 });
  }
  if (avgRevenueD90 != null && Number.isFinite(avgRevenueD90)) {
    anchors.push({ day: 90, revenue: avgRevenueD90 });
  }
  if (avgRevenueD365 != null && Number.isFinite(avgRevenueD365)) {
    anchors.push({ day: 365, revenue: avgRevenueD365 });
  }

  for (let i = 1; i < anchors.length; i += 1) {
    const prev = anchors[i - 1]!;
    const curr = anchors[i]!;
    if (curr.revenue < cashCac) continue;
    const span = curr.revenue - prev.revenue;
    // Recovered already at `prev` (flat/zero segment) — land on curr.day
    // rather than divide by zero.
    const days =
      span > 0
        ? prev.day +
          (curr.day - prev.day) * ((cashCac - prev.revenue) / span)
        : curr.day;
    return Math.min(365, Math.max(1, Math.round(days)));
  }

  return null;
}

/** Pure till-LTV KPI math from cohort rows + period cash CAC inputs. */
export function summarizeTillLtvFromCohorts(
  allCohorts: TillLtvCohortRow[],
  options: {
    totalSpend: number;
    newCustomers: number;
    periodLabel?: string | null;
    historyLimited?: boolean;
    /**
     * True only after Shopify limited the window AND every closed day in that
     * window has a complete marker. Empty shops still ingesting must not use
     * history_limited (that copy used to say “Free shows…”).
     */
    limitedWindowExhausted?: boolean;
    useSampleDesk?: boolean;
    ianaTimezone?: string | null;
  },
): TillLtvSummary {
  const withCustomers = allCohorts.filter((c) => c.customers > 0);
  const cohorts = withCustomers.slice(0, 6).map((c) => ({
    cohortMonth: c.cohortMonth,
    customers: c.customers,
    revenueD30: c.revenueD30,
    revenueD90: c.revenueD90,
    revenueD365: c.revenueD365,
    ordersD30: c.ordersD30,
    ordersD90: c.ordersD90,
    ordersD365: c.ordersD365,
  }));

  // CohortFact.revenueD* are shop-currency **totals** (dollars). Divide once.
  const avgRevenueD30 = customerWeightedAvgRevenue(
    withCustomers,
    (r) => r.revenueD30,
  );
  const avgRevenueD90 = customerWeightedAvgRevenue(
    withCustomers,
    (r) => r.revenueD90,
  );
  const avgRevenueD365 = customerWeightedAvgRevenue(
    withCustomers,
    (r) => r.revenueD365,
  );
  const avgOrdersD90 = customerWeightedAvgRevenue(
    withCustomers,
    (r) => r.ordersD90,
  );

  const newBuyers = Math.max(0, Math.floor(options.newCustomers));
  const cashCac =
    newBuyers > 0 && Number.isFinite(options.totalSpend)
      ? options.totalSpend / newBuyers
      : null;

  const ltvCacRatio =
    avgRevenueD90 != null && cashCac != null && cashCac > 0
      ? avgRevenueD90 / cashCac
      : null;

  let repeatRate: number | null = null;
  let custSum = 0;
  let extraOrders = 0;
  for (const r of withCustomers) {
    custSum += r.customers;
    extraOrders += Math.max(0, r.ordersD90 - r.customers);
  }
  if (custSum > 0) {
    repeatRate = extraOrders / custSum;
  }

  const paybackDays = cashPaybackDays(
    cashCac,
    avgRevenueD30,
    avgRevenueD90,
    avgRevenueD365,
  );

  const available = withCustomers.length > 0;
  const historyLimited = Boolean(options.historyLimited);
  let emptyReason: TillLtvEmptyReason = null;
  if (!available) {
    if (!options.useSampleDesk && !options.ianaTimezone) {
      emptyReason = "no_timezone";
    } else if (historyLimited && options.limitedWindowExhausted) {
      emptyReason = "history_limited";
    } else {
      emptyReason = "backfilling";
    }
  }

  return {
    available,
    historyLimited,
    emptyReason,
    cohortCount: withCustomers.length,
    avgRevenueD30,
    avgRevenueD90,
    avgRevenueD365,
    cashCac,
    newBuyers,
    ltvCacRatio,
    cohorts,
    repeatRate,
    avgOrdersD90,
    paybackDays,
    periodLabel: options.periodLabel ?? null,
  };
}

/**
 * Till LTV desk summary from CohortFact + period cash CAC inputs.
 * Level 1 only — opaque cohorts, not email CRM.
 */
export async function buildTillLtvSummary(
  shopId: string,
  options: {
    totalSpend: number;
    newCustomers: number;
    periodLabel?: string | null;
    /** When true, read sample CohortFacts (demo desk). */
    useSampleDesk?: boolean;
    /** Shop IANA timezone — till ingest needs local-day boundaries. */
    ianaTimezone?: string | null;
  },
): Promise<TillLtvSummary> {
  const [allCohorts, historyLimited, progress] = await Promise.all([
    getCohortFacts(shopId, {
      limit: 24,
      sample: Boolean(options.useSampleDesk),
    }),
    options.useSampleDesk
      ? Promise.resolve(false)
      : getOrderBackfillHistoryLimited(shopId),
    options.useSampleDesk || !options.ianaTimezone
      ? Promise.resolve(null)
      : getOrderBackfillProgress(shopId, {
          ianaTimezone: options.ianaTimezone,
        }),
  ]);

  return summarizeTillLtvFromCohorts(
    allCohorts.map((c) => ({
      cohortMonth: c.cohortMonth,
      customers: c.customers,
      revenueD30: c.revenueD30,
      revenueD90: c.revenueD90,
      revenueD365: c.revenueD365,
      ordersD30: c.ordersD30,
      ordersD90: c.ordersD90,
      ordersD365: c.ordersD365,
    })),
    {
      totalSpend: options.totalSpend,
      newCustomers: options.newCustomers,
      periodLabel: options.periodLabel,
      historyLimited,
      limitedWindowExhausted:
        historyLimited &&
        progress != null &&
        progress.remainingDays === 0,
      useSampleDesk: options.useSampleDesk,
      ianaTimezone: options.ianaTimezone,
    },
  );
}
