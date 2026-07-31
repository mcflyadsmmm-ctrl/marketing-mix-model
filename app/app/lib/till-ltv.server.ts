import {
  getCohortFacts,
  getOrderBackfillHistoryLimited,
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
  /** Cash CAC = totalSpend / newCustomers when newCustomers > 0. */
  cashCac: number | null;
  /** avgRevenueD90 / cashCac when both defined. */
  ltvCacRatio: number | null;
  cohorts: TillLtvCohortRow[];
  /** Share of cohort orders beyond the first (ordersD90 − customers) / customers. */
  repeatRate: number | null;
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

/** Pure till-LTV KPI math from cohort rows + period cash CAC inputs. */
export function summarizeTillLtvFromCohorts(
  allCohorts: TillLtvCohortRow[],
  options: {
    totalSpend: number;
    newCustomers: number;
    periodLabel?: string | null;
    historyLimited?: boolean;
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

  const cashCac =
    options.newCustomers > 0 && Number.isFinite(options.totalSpend)
      ? options.totalSpend / options.newCustomers
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

  const available = withCustomers.length > 0;
  const historyLimited = Boolean(options.historyLimited);
  let emptyReason: TillLtvEmptyReason = null;
  if (!available) {
    if (!options.useSampleDesk && !options.ianaTimezone) {
      emptyReason = "no_timezone";
    } else if (historyLimited) {
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
    ltvCacRatio,
    cohorts,
    repeatRate,
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
  const [allCohorts, historyLimited] = await Promise.all([
    getCohortFacts(shopId, {
      limit: 24,
      sample: Boolean(options.useSampleDesk),
    }),
    options.useSampleDesk
      ? Promise.resolve(false)
      : getOrderBackfillHistoryLimited(shopId),
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
      useSampleDesk: options.useSampleDesk,
      ianaTimezone: options.ianaTimezone,
    },
  );
}
