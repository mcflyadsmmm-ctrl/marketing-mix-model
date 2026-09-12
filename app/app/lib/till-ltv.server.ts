import {
  getCohortFacts,
  getOrderBackfillHistoryLimited,
  listBuyerOrderFacts,
} from "./order-facts.server";
import { computeBuyerConcentration, type BuyerConcentration } from "./buyer-concentration";
import {
  periodFirstVsRepeatRevenue,
  summarizeBuyerRepeat,
  type BuyerRepeatSummary,
  type PeriodOrderMix,
} from "./cohort-buyer-metrics";

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

/** Demo-desk buyer depth when SAMPLE has CohortFacts but no OrderFact rows. */
export const SAMPLE_BUYER_REPEAT: BuyerRepeatSummary = {
  buyers: 4200,
  secondWithin30: 0.18,
  secondWithin60: 0.31,
  secondWithin90: 0.42,
  medianDaysToSecond: 27,
  firstOrderRevenue: 1_850_000,
  subsequentRevenue: 1_420_000,
  firstOrderRevenueShare: 1_850_000 / (1_850_000 + 1_420_000),
  subsequentRevenueShare: 1_420_000 / (1_850_000 + 1_420_000),
};

export const SAMPLE_PERIOD_ORDER_MIX: PeriodOrderMix = {
  firstOrderRevenue: 62_000,
  subsequentRevenue: 48_000,
  firstOrderRevenueShare: 62_000 / 110_000,
  subsequentRevenueShare: 48_000 / 110_000,
  firstOrderCount: 410,
  subsequentOrderCount: 290,
};


export function emptyBuyerConcentration(): BuyerConcentration {
  return {
    buyers: 0,
    totalRevenue: 0,
    top10Share: null,
    top20Share: null,
    topBuyerShare: null,
    topBuyerRevenue: 0,
  };
}


const SAMPLE_BUYER_CONCENTRATION: BuyerConcentration = {
  buyers: 4200,
  totalRevenue: 3_270_000,
  top10Share: 0.48,
  top20Share: 0.67,
  topBuyerShare: 0.012,
  topBuyerRevenue: 39_240,
};

export function emptyBuyerRepeat(): BuyerRepeatSummary {
  return {
    buyers: 0,
    secondWithin30: null,
    secondWithin60: null,
    secondWithin90: null,
    medianDaysToSecond: null,
    firstOrderRevenue: 0,
    subsequentRevenue: 0,
    firstOrderRevenueShare: null,
    subsequentRevenueShare: null,
  };
}

export function emptyPeriodOrderMix(): PeriodOrderMix {
  return {
    firstOrderRevenue: 0,
    subsequentRevenue: 0,
    firstOrderRevenueShare: null,
    subsequentRevenueShare: null,
    firstOrderCount: 0,
    subsequentOrderCount: 0,
  };
}

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
  /** Cash CAC = totalSpend / newBuyers only when period spend is positive. */
  cashCac: number | null;
  /**
   * New-buyer count used for cashCac (OrderFact uniques on live; sample day-sum).
   * UI must use this — not SalesDayFact `metrics.newCustomers` (always 0 on facts spine).
   */
  newBuyers: number;
  /** avgRevenueD90 / cashCac when both defined. */
  ltvCacRatio: number | null;
  cohorts: TillLtvCohortRow[];
  /**
   * Extra orders per buyer @ D90: (ordersD90 − customers) / customers.
   * Not “% who bought twice” — see buyerRepeat.secondWithin90.
   */
  repeatRate: number | null;
  /** Maturity-gated 2nd-purchase + first/subsequent revenue (order-fact depth). */
  buyerRepeat: BuyerRepeatSummary;
  /** Revenue share from heaviest buyers — Shopify Analytics underplays this. */
  buyerConcentration: BuyerConcentration;
  /** Period sales mix by lifetime rank (1st vs 2nd+), when period facts exist. */
  periodOrderMix: PeriodOrderMix;
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
    buyerRepeat?: BuyerRepeatSummary;
    buyerConcentration?: BuyerConcentration;
    periodOrderMix?: PeriodOrderMix;
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

  const newBuyers = Math.max(0, Math.floor(options.newCustomers));
  const cashCac =
    newBuyers > 0 &&
    Number.isFinite(options.totalSpend) &&
    options.totalSpend > 0
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

  const buyerRepeat =
    options.buyerRepeat ??
    (options.useSampleDesk && available
      ? SAMPLE_BUYER_REPEAT
      : emptyBuyerRepeat());
  const periodOrderMix =
    options.periodOrderMix ??
    (options.useSampleDesk && available
      ? SAMPLE_PERIOD_ORDER_MIX
      : emptyPeriodOrderMix());

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
    buyerRepeat,
    buyerConcentration:
      options.buyerConcentration ??
      (options.useSampleDesk && available
        ? SAMPLE_BUYER_CONCENTRATION
        : emptyBuyerConcentration()),
    periodOrderMix,
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
    /** Period window for first-vs-subsequent revenue mix. */
    periodRange?: { start: Date; end: Date };
  },
): Promise<TillLtvSummary> {
  const sample = Boolean(options.useSampleDesk);
  const [allCohorts, historyLimited, allBuyerOrders, periodBuyerOrders] =
    await Promise.all([
      getCohortFacts(shopId, {
        limit: 24,
        sample,
      }),
      sample
        ? Promise.resolve(false)
        : getOrderBackfillHistoryLimited(shopId),
      listBuyerOrderFacts(shopId, { sample }),
      options.periodRange
        ? listBuyerOrderFacts(shopId, {
            sample,
            range: options.periodRange,
          })
        : Promise.resolve([]),
    ]);

  let buyerRepeat =
    allBuyerOrders.length > 0
      ? summarizeBuyerRepeat(allBuyerOrders)
      : undefined;
  let buyerConcentration =
    allBuyerOrders.length > 0
      ? computeBuyerConcentration(
          allBuyerOrders.map((o) => ({
            buyerKey: o.buyerKey,
            netSales: o.netSales,
          })),
        )
      : undefined;
  let periodOrderMix =
    periodBuyerOrders.length > 0
      ? periodFirstVsRepeatRevenue(periodBuyerOrders)
      : undefined;

  // Sample desk: CohortFacts without OrderFacts → polished demo buyer depth.
  if (sample && !buyerRepeat) buyerRepeat = SAMPLE_BUYER_REPEAT;
  if (sample && !buyerConcentration) buyerConcentration = SAMPLE_BUYER_CONCENTRATION;
  if (sample && !periodOrderMix && options.periodRange) {
    periodOrderMix = SAMPLE_PERIOD_ORDER_MIX;
  }

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
      buyerRepeat,
      buyerConcentration,
      periodOrderMix,
    },
  );
}
