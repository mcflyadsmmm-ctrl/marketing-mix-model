import type { AdminApiContext } from "@shopify/shopify-app-react-router/server";
import prisma from "../db.server";
import {
  emptySales,
  fetchShopifySales,
  LIVE_TODAY_MAX_PAGES,
  shopLocalDayKey,
  shopLocalDayRange,
  listRecentClosedShopLocalDays,
  type SalesResult,
} from "./shopify-sales.server";
import { ensureShopMetadata } from "./shop-metadata.server";
import { countClosedDaysInPeriod } from "./mer-trust";
import {
  SHOPIFY_READ_ORDERS_WINDOW_DAYS,
  periodSpanDays,
  type DateRange,
} from "./periods";
import { allowsDeepOrderHistory } from "./shopify-scopes";
import {
  salesFactsAllowZeroUpsert,
  salesFactsIncompleteForDesk,
  salesFactsNeedRefreshExisting,
  salesFactsNeedSyncFill,
  type SalesFactsCoverage,
} from "./sales-facts-honesty";

export type { SalesFactsCoverage };
export {
  salesFactsAllowZeroUpsert,
  salesFactsIncompleteForDesk,
  salesFactsNeedRefreshExisting,
  salesFactsNeedSyncFill,
};

/** SalesDayFact.source for rows written by this ingest lane. */
export const SALES_DAY_FACT_SOURCE = "shopify_order_current_total_v1";

/**
 * Serving + backfill horizon: closed days back to **Jan 1 of (UTC year − N)**.
 * Example: mid-2026 → window starts 2022-01-01 so YTD / L12M / 3yr can complete
 * once facts are filled (requires `read_all_orders` for Shopify history).
 */
export const SALES_DAY_FACT_WINDOW_YEARS_BACK = 4;

/**
 * UTC midnight Jan 1 of (calendar year − {@link SALES_DAY_FACT_WINDOW_YEARS_BACK}).
 * Prefer this over a rolling day-count so annual desks align to shop years.
 */
export function salesDayFactWindowStartUtc(now: Date = new Date()): Date {
  const y = now.getUTCFullYear() - SALES_DAY_FACT_WINDOW_YEARS_BACK;
  return new Date(Date.UTC(y, 0, 1));
}

/**
 * Day count from window start through `now` (inclusive upper bound for
 * `listRecentClosedShopLocalDays`, which itself excludes in-progress today).
 */
export function salesDayFactWindowDayCount(now: Date = new Date()): number {
  const start = salesDayFactWindowStartUtc(now);
  const ms = now.getTime() - start.getTime();
  return Math.max(1, Math.ceil(ms / 86_400_000));
}

/**
 * Backfill horizon: Jan-1 × N-year when `read_all_orders` is granted, otherwise
 * the fail-closed ~60-day `read_orders` window. Serving/coverage still uses the
 * 4yr Jan-1 window — incomplete facts stay honest until deep ingest catches up.
 */
export function salesFactsBackfillWindowDayCount(
  now: Date = new Date(),
  scopesAllowDeep = false,
): number {
  return scopesAllowDeep
    ? salesDayFactWindowDayCount(now)
    : SHOPIFY_READ_ORDERS_WINDOW_DAYS;
}

/**
 * @deprecated Prefer {@link salesDayFactWindowDayCount} — calendar Jan-1 window.
 * Kept as a rough upper bound (~4×365+1) for callers that still pass a fixed count.
 */
export const SALES_DAY_FACT_WINDOW_DAYS = 4 * 365 + 1;

/**
 * Max days ingested per `runSalesFactsBackfill` call. Keeps a single invocation
 * (auth callback, cron tick) bounded — the next call resumes via missing dates.
 * Raised from 10 so a 4yr window fills in fewer ticks without blowing OAuth.
 */
export const SALES_DAY_FACT_MAX_DAYS_PER_RUN = 20;

/**
 * Bounded live GraphQL for a short period (MTD / LM) when stored facts are $0.
 * 3 pages = ≤300 orders — enough to surface a 7-order desk, never a 4yr crawl.
 */
export const LIVE_PERIOD_PROBE_MAX_PAGES = 3;

/** Skip the live probe on wide windows — those stay facts-only + honesty. */
export const LIVE_PERIOD_PROBE_MAX_DAYS = 35;

export interface SalesFactBackfillResult {
  shopId: string;
  ranAt: string;
  /** Days this call attempted to fetch + upsert. */
  attempted: number;
  /** Days successfully written this call. */
  written: number;
  /** Days whose Shopify fetch failed this call — left missing for the next run to retry. */
  failed: string[];
  /** Set when ianaTimezone was (and remains) unknown; ingest was skipped entirely. */
  skippedReason: "no_timezone" | null;
  /** Missing days within the window not yet attempted this call (still to resume). */
  remainingMissingDays: number;
}

function utcDayKeyFromDate(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function dayKeyToUtcDate(dayKey: string): Date {
  const [y, m, d] = dayKey.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

/**
 * SalesDayFact.day is UTC midnight of the shop-local YYYY-MM-DD key.
 * Comparing that to shop-local period instants (`2026-09-01T06:00Z` in Denver)
 * drops the first calendar day — MTD can hero $0 while that day's fact exists.
 */
export function salesFactsDayFilter(
  range: { start: Date; end: Date },
  timeZone?: string | null,
): { gte: Date; lte: Date } {
  if (timeZone) {
    return {
      gte: dayKeyToUtcDate(shopLocalDayKey(range.start, timeZone)),
      lte: dayKeyToUtcDate(shopLocalDayKey(range.end, timeZone)),
    };
  }
  return { gte: range.start, lte: range.end };
}

/** $0 stored facts on a short period — probe live Admin orders instead of heros. */
export function shouldProbeLivePeriodSales(args: {
  factSales: number;
  factOrders: number;
  period: DateRange;
  coverage: SalesFactsCoverage | null;
}): boolean {
  if (args.factSales > 0 || args.factOrders > 0) return false;
  if (args.coverage?.periodExceedsFactWindow) return false;
  return periodSpanDays(args.period) <= LIVE_PERIOD_PROBE_MAX_DAYS;
}

/** Which of `dayKeys` already have a SalesDayFact row for this shop. */
async function existingFactDayKeys(
  shopId: string,
  dayKeys: string[],
): Promise<Set<string>> {
  if (dayKeys.length === 0) return new Set();
  const sorted = [...dayKeys].sort();
  const rangeStart = dayKeyToUtcDate(sorted[0]);
  const rangeEnd = dayKeyToUtcDate(sorted[sorted.length - 1]);

  const rows = await prisma.salesDayFact.findMany({
    where: {
      shopId,
      day: { gte: rangeStart, lte: rangeEnd },
    },
    select: { day: true },
  });
  return new Set(rows.map((r) => utcDayKeyFromDate(r.day)));
}

async function upsertSalesDayFact(
  shopId: string,
  dayKey: string,
  sales: SalesResult,
  currencyCode: string | null,
  asOf: Date,
): Promise<void> {
  const day = dayKeyToUtcDate(dayKey);
  const data = {
    sales: sales.totalSales,
    netSales: sales.netSales,
    grossSales: sales.grossSales,
    orderCount: sales.orderCount,
    newCustomers: sales.newCustomers,
    returningCustomers: sales.returningCustomers,
    newCustomerNetSales: sales.newCustomerNetSales,
    returningCustomerNetSales: sales.returningCustomerNetSales,
    guestOrders: sales.guestOrders,
    customerMetricsAvailable: sales.customerMetricsAvailable,
    currency: currencyCode,
    asOf,
    source: SALES_DAY_FACT_SOURCE,
  };

  // Upsert only after the full per-day pagination above has succeeded — a zero-sales
  // day is a legitimate fact (written as sales: 0), a failed fetch is not (left missing).
  // Never write demo/sample into SalesDayFact — sample till stays on SampleSalesDay.
  if (data.source !== SALES_DAY_FACT_SOURCE) {
    throw new Error(`SalesDayFact source must be ${SALES_DAY_FACT_SOURCE}`);
  }
  await prisma.salesDayFact.upsert({
    where: { shopId_day: { shopId, day } },
    create: { shopId, day, ...data },
    update: data,
  });
}

/**
 * Backfill/resume up to `SALES_DAY_FACT_MAX_DAYS_PER_RUN` missing closed shop-local
 * days within the Jan-1 × N-year serving window. Idempotent and safe to call
 * repeatedly (auth callback, cron, manual) — each call re-derives the missing
 * dates from what's already in SalesDayFact, so it always resumes rather than restarts.
 *
 * Skips entirely (no rows touched) when the shop's ianaTimezone is unknown and a
 * metadata sync attempt does not resolve one — server-local time is never substituted.
 */
/**
 * Choose which missing closed days to ingest this call.
 * Newest-first so QTD / MTD lights up before a 4-year oldest-first crawl.
 * Optional `priorityStartKey`/`priorityEndKey` (YYYY-MM-DD) pull the selected
 * desk period to the front of the batch.
 */
export function selectSalesFactsBackfillDays(args: {
  missingOldestFirst: string[];
  maxDays: number;
  newestFirst?: boolean;
  priorityStartKey?: string;
  priorityEndKey?: string;
}): string[] {
  const newestFirst = args.newestFirst !== false;
  const ordered = newestFirst
    ? [...args.missingOldestFirst].reverse()
    : args.missingOldestFirst;

  const start = args.priorityStartKey;
  const end = args.priorityEndKey;
  if (!start || !end) {
    return ordered.slice(0, args.maxDays);
  }

  const inPriority: string[] = [];
  const rest: string[] = [];
  for (const key of ordered) {
    if (key >= start && key <= end) inPriority.push(key);
    else rest.push(key);
  }
  return [...inPriority, ...rest].slice(0, args.maxDays);
}

export async function runSalesFactsBackfill(
  admin: AdminApiContext,
  shopId: string,
  options?: {
    now?: Date;
    maxDays?: number;
    grantedScopes?: string | string[] | null;
    scopesAllowDeep?: boolean;
    /** Default true — recent closed days first (TTFV). */
    newestFirst?: boolean;
    /** Selected desk period — fill these missing days before the rest of the window. */
    priorityRange?: { start: Date; end: Date };
    /**
     * Re-fetch days that already have a fact row (grant / poisoned $0 repair).
     * Default fills missing only — a trusted-looking $0 day would never correct.
     */
    refreshExisting?: boolean;
  },
): Promise<SalesFactBackfillResult> {
  const now = options?.now ?? new Date();
  const maxDays = options?.maxDays ?? SALES_DAY_FACT_MAX_DAYS_PER_RUN;
  const ranAt = now.toISOString();

  const metadata = await ensureShopMetadata(admin, shopId);
  if (!metadata.ianaTimezone) {
    return {
      shopId,
      ranAt,
      attempted: 0,
      written: 0,
      failed: [],
      skippedReason: "no_timezone",
      remainingMissingDays: 0,
    };
  }

  const scopesAllowDeep =
    typeof options?.scopesAllowDeep === "boolean"
      ? options.scopesAllowDeep
      : allowsDeepOrderHistory(
          options && "grantedScopes" in options
            ? { grantedScopes: options.grantedScopes }
            : undefined,
        );

  const timeZone = metadata.ianaTimezone;
  const windowDayKeys = listRecentClosedShopLocalDays(
    timeZone,
    salesFactsBackfillWindowDayCount(now, scopesAllowDeep),
    now,
  );
  const existing = await existingFactDayKeys(shopId, windowDayKeys);
  const missing = windowDayKeys.filter((key) => !existing.has(key));
  const priorityStartKey = options?.priorityRange
    ? shopLocalDayKey(options.priorityRange.start, timeZone)
    : undefined;
  const priorityEndKey = options?.priorityRange
    ? shopLocalDayKey(options.priorityRange.end, timeZone)
    : undefined;
  const refreshExisting = Boolean(options?.refreshExisting);
  const candidateOldestFirst = refreshExisting
    ? windowDayKeys.filter((key) => {
        if (!existing.has(key)) return true;
        if (priorityStartKey && priorityEndKey) {
          return key >= priorityStartKey && key <= priorityEndKey;
        }
        return true;
      })
    : missing;
  const batch = selectSalesFactsBackfillDays({
    missingOldestFirst: candidateOldestFirst,
    maxDays,
    newestFirst: options?.newestFirst,
    priorityStartKey,
    priorityEndKey,
  });

  let written = 0;
  const failed: string[] = [];
  for (const dayKey of batch) {
    try {
      const range = shopLocalDayRange(dayKey, timeZone);
      const usedRecentScan = Boolean(options?.refreshExisting);
      const sales = await fetchShopifySales(
        admin,
        range,
        usedRecentScan
          ? { mode: "recent_scan", maxPages: LIVE_PERIOD_PROBE_MAX_PAGES }
          : undefined,
      );
      if (
        !salesFactsAllowZeroUpsert({
          totalSales: sales.totalSales,
          orderCount: sales.orderCount,
          usedRecentScan,
          shopOrdersSeen: sales.shopOrdersSeen ?? 0,
        })
      ) {
        // Leave missing — a search $0 must not become a trusted complete day.
        failed.push(dayKey);
        continue;
      }
      await upsertSalesDayFact(shopId, dayKey, sales, metadata.currencyCode, now);
      written += 1;
    } catch {
      // Leave this day missing — the next call's missing-dates scan retries it.
      failed.push(dayKey);
    }
  }

  return {
    shopId,
    ranAt,
    attempted: batch.length,
    written,
    failed,
    skippedReason: null,
    remainingMissingDays: Math.max(
      0,
      missing.filter((key) => !batch.includes(key)).length,
    ),
  };
}

/**
 * Why a dirty-day reconcile wrote nothing. All three are normal outcomes, not
 * errors — the job succeeds so it is not retried against an impossible day.
 */
export type SalesDayReconcileSkip =
  | "no_timezone"
  /**
   * The day is the shop's in-progress local today. Writing a partial fact would
   * poison it permanently: `runSalesFactsBackfill` only fills MISSING days, so a
   * half-day row would never be corrected once the day closed. Today's orders reach
   * the desk through the live read path, and the day lands in facts via backfill
   * once it closes.
   */
  | "day_not_closed"
  /** Older than the Jan-1 × N-year serving window — the day can no longer be recomputed. */
  | "day_outside_window";

export interface SalesDayReconcileResult {
  shopId: string;
  dayKey: string;
  written: boolean;
  skippedReason: SalesDayReconcileSkip | null;
}

/**
 * Recompute one closed shop-local day's SalesDayFact from Shopify and overwrite it.
 *
 * This is the webhook lane's counterpart to `runSalesFactsBackfill`: backfill fills
 * days that are missing, this one refreshes a day whose stored fact went stale
 * (edited, refunded, or cancelled order). Idempotent — the same `(shopId, day)`
 * upsert key, so replaying a job converges rather than duplicating.
 *
 * Throws on Shopify fetch failure so the queue retries with backoff; the existing
 * fact row is left untouched rather than replaced with a partial read.
 */
export async function reconcileSalesDayFact(
  admin: AdminApiContext,
  shopId: string,
  dayKey: string,
  options?: { now?: Date },
): Promise<SalesDayReconcileResult> {
  const now = options?.now ?? new Date();

  const metadata = await ensureShopMetadata(admin, shopId);
  if (!metadata.ianaTimezone) {
    return { shopId, dayKey, written: false, skippedReason: "no_timezone" };
  }
  const timeZone = metadata.ianaTimezone;

  if (dayKey >= shopLocalDayKey(now, timeZone)) {
    return { shopId, dayKey, written: false, skippedReason: "day_not_closed" };
  }

  const windowStart = salesDayFactWindowStartUtc(now);
  const range = shopLocalDayRange(dayKey, timeZone);
  if (range.end < windowStart) {
    return { shopId, dayKey, written: false, skippedReason: "day_outside_window" };
  }

  const sales = await fetchShopifySales(admin, range);
  await upsertSalesDayFact(shopId, dayKey, sales, metadata.currencyCode, now);
  return { shopId, dayKey, written: true, skippedReason: null };
}

/**
 * HARD-STOP desk policy: when coverage is incomplete or the period exceeds the
 * trailing SalesDayFact window, Cash MER must serve stored facts only (+ optional
 * capped today top-up). Never start `fetchShopifySales` / `fetchShopifySalesByDay`
 * for the full selected multi-day window on page load — that dies at 100k–1M orders.
 */
export function deskMustServeSalesFactsOnly(
  coverage: SalesFactsCoverage,
): boolean {
  return !coverage.complete || coverage.periodExceedsFactWindow;
}

/**
 * SalesDayFact coverage gate for desk lock / trust (closed days in window).
 * Fail-closed: null/undefined coverage must block Save (never lock without facts).
 * Long windows that exceed the fact window still allow Save on stored facts + honesty.
 */
export function salesFactsBlockLock(coverage: {
  complete: boolean;
  expectedClosedDays: number;
  periodExceedsFactWindow: boolean;
} | null | undefined): boolean {
  if (coverage == null) return true;
  if (coverage.periodExceedsFactWindow) return false;
  return !coverage.complete && coverage.expectedClosedDays > 0;
}

/**
 * Facts vs. live coverage for `range`. Periods reaching outside the Jan-1 × N-year
 * ingest window are incomplete for KPI use (no silent underclaim under a full-period
 * label). Desk paint uses facts-only + banners — not unbounded GraphQL fallback.
 */
export async function getSalesFactsCoverage(
  shopId: string,
  range: DateRange,
  now: Date = new Date(),
  timeZone?: string | null,
): Promise<SalesFactsCoverage> {
  const windowStart = salesDayFactWindowStartUtc(now);
  const periodExceedsFactWindow = range.start < windowStart;

  if (periodExceedsFactWindow) {
    const windowRange = { start: windowStart, end: range.end };
    const dayFilter = salesFactsDayFilter(windowRange, timeZone);
    const factDays = await prisma.salesDayFact.count({
      where: { shopId, day: { gte: dayFilter.gte, lte: dayFilter.lte } },
    });
    return {
      expectedClosedDays: countClosedDaysInPeriod(
        windowStart,
        range.end,
        now,
        timeZone,
      ),
      factDays,
      complete: false,
      periodExceedsFactWindow: true,
    };
  }

  const expectedClosedDays = countClosedDaysInPeriod(
    range.start,
    range.end,
    now,
    timeZone,
  );

  if (expectedClosedDays <= 0) {
    return {
      expectedClosedDays: 0,
      factDays: 0,
      complete: false,
      periodExceedsFactWindow: false,
    };
  }

  const dayFilter = salesFactsDayFilter(range, timeZone);
  const factDays = await prisma.salesDayFact.count({
    where: { shopId, day: { gte: dayFilter.gte, lte: dayFilter.lte } },
  });

  return {
    expectedClosedDays,
    factDays,
    complete: factDays >= expectedClosedDays,
    periodExceedsFactWindow: false,
  };
}

export interface SalesFactsTotals {
  totalSales: number;
  /**
   * Sum of persisted Net Sales (`currentSubtotalPriceSet`) for fact days that
   * have it. Legacy rows with null netSales are excluded — see `netSalesComplete`.
   */
  netSalesSum: number;
  /** True when every fact day has non-null `netSales` (or zero fact days). */
  netSalesComplete: boolean;
  /**
   * Sum of persisted `grossSales` for fact days that have it. Legacy rows with
   * null gross are excluded from this sum — see `grossSalesComplete`.
   */
  grossSalesSum: number;
  /**
   * True when every fact day in range has non-null `grossSales` (or there are
   * zero fact days). False means closed-day gross is incomplete — do not treat
   * net as gross for refund haircut.
   */
  grossSalesComplete: boolean;
  orderCount: number;
  /**
   * Sum of per-day new/returning counts across `range` — NOT a unique cross-day count
   * (the same customer ordering on two different days counts twice). Callers must not
   * present this as live customer metrics; pair with `customerMetricsAvailable: false`.
   */
  newCustomersSum: number;
  returningCustomersSum: number;
  /** Additive new-customer sales across fact days (aMER numerator spine). */
  newCustomerNetSalesSum: number;
  returningCustomerNetSalesSum: number;
  guestOrdersSum: number;
  dayCount: number;
  /**
   * True when `range.start` is before the Jan-1 × N-year ingest window — totals
   * only cover the clamped window, not the full requested range. Callers must not
   * treat `totalSales: 0` (or a partial sum) as a complete prior for deltas.
   */
  rangeClampedToFactWindow: boolean;
}

/**
 * Build a desk SalesResult from stored SalesDayFact totals (+ optional capped
 * today top-up). Per-day new/returning sums are not unique — customerMetricsAvailable
 * stays false.
 *
 * Total Sales = `sales` column (currentTotalPriceSet).
 * Net Sales = `netSales` column when complete; otherwise netSalesKnown false.
 */
export function salesResultFromFactsTotals(
  facts: SalesFactsTotals,
  today: {
    totalSales: number;
    netSales?: number;
    grossSales?: number;
    orderCount: number;
    newCustomerNetSales?: number;
    returningCustomerNetSales?: number;
    truncatedByPageCap?: boolean;
  } | null,
): SalesResult {
  const todayTotal = today?.totalSales ?? 0;
  const todayNet = today?.netSales ?? today?.totalSales ?? 0;
  const todayGross = today?.grossSales ?? today?.totalSales ?? 0;
  const todayOrders = today?.orderCount ?? 0;
  const totalSales = facts.totalSales + todayTotal;
  const closedNet = facts.netSalesComplete ? facts.netSalesSum : null;
  const netSalesKnown = closedNet != null;
  const netSales =
    closedNet != null
      ? closedNet + todayNet
      : today != null
        ? todayNet
        : totalSales;
  const closedGross = facts.grossSalesComplete
    ? facts.grossSalesSum
    : null;
  const grossSalesKnown = closedGross != null;
  const grossSales =
    closedGross != null
      ? closedGross + todayGross
      : today != null
        ? todayGross
        : totalSales;
  return {
    totalSales,
    netSales,
    netSalesKnown,
    grossSales,
    grossSalesKnown,
    salesBasisUsed: "total",
    orderCount: facts.orderCount + todayOrders,
    newCustomers: 0,
    returningCustomers: 0,
    newCustomerNetSales:
      facts.newCustomerNetSalesSum + (today?.newCustomerNetSales ?? 0),
    returningCustomerNetSales:
      facts.returningCustomerNetSalesSum +
      (today?.returningCustomerNetSales ?? 0),
    guestOrders: 0,
    customerMetricsAvailable: false,
    source: "shopify",
    ...(today?.truncatedByPageCap ? { truncatedByPageCap: true } : {}),
  };
}

/** Sum SalesDayFact rows overlapping `range` (clamped to the Jan-1 × N-year window). */
export async function getSalesFactsTotals(
  shopId: string,
  range: DateRange,
  now: Date = new Date(),
  timeZone?: string | null,
): Promise<SalesFactsTotals> {
  const windowStart = salesDayFactWindowStartUtc(now);
  const rangeClampedToFactWindow = range.start < windowStart;
  const clampedStart = rangeClampedToFactWindow ? windowStart : range.start;
  const dayFilter = salesFactsDayFilter(
    { start: clampedStart, end: range.end },
    timeZone,
  );

  const rows = await prisma.salesDayFact.findMany({
    where: { shopId, day: { gte: dayFilter.gte, lte: dayFilter.lte } },
    select: {
      sales: true,
      netSales: true,
      grossSales: true,
      orderCount: true,
      newCustomers: true,
      returningCustomers: true,
      newCustomerNetSales: true,
      returningCustomerNetSales: true,
      guestOrders: true,
    },
  });

  let totalSales = 0;
  let netSalesSum = 0;
  let netKnownDays = 0;
  let grossSalesSum = 0;
  let grossKnownDays = 0;
  let orderCount = 0;
  let newCustomersSum = 0;
  let returningCustomersSum = 0;
  let newCustomerNetSalesSum = 0;
  let returningCustomerNetSalesSum = 0;
  let guestOrdersSum = 0;
  for (const row of rows) {
    totalSales += row.sales;
    if (row.netSales != null && Number.isFinite(row.netSales)) {
      netSalesSum += row.netSales;
      netKnownDays += 1;
    }
    if (row.grossSales != null && Number.isFinite(row.grossSales)) {
      grossSalesSum += row.grossSales;
      grossKnownDays += 1;
    }
    orderCount += row.orderCount;
    newCustomersSum += row.newCustomers;
    returningCustomersSum += row.returningCustomers;
    newCustomerNetSalesSum += row.newCustomerNetSales;
    returningCustomerNetSalesSum += row.returningCustomerNetSales;
    guestOrdersSum += row.guestOrders;
  }

  return {
    totalSales,
    netSalesSum,
    netSalesComplete: rows.length === 0 || netKnownDays === rows.length,
    grossSalesSum,
    grossSalesComplete: rows.length === 0 || grossKnownDays === rows.length,
    orderCount,
    newCustomersSum,
    returningCustomersSum,
    newCustomerNetSalesSum,
    returningCustomerNetSalesSum,
    guestOrdersSum,
    dayCount: rows.length,
    rangeClampedToFactWindow,
  };
}

function todayPartialRange(now: Date, ianaTimezone: string): DateRange {
  const dayKey = shopLocalDayKey(now, ianaTimezone);
  const day = shopLocalDayRange(dayKey, ianaTimezone);
  return { start: day.start, end: now, label: "Today (partial)" };
}

export interface LoadDeskSalesForPeriodResult {
  sales: SalesResult;
  salesError: string | null;
  factsCoverage: SalesFactsCoverage | null;
  /** Today live top-up threw — closed facts may still be OK; banner honesty. */
  todaySalesUnavailable: boolean;
  /** Today live top-up hit LIVE_TODAY_MAX_PAGES with more orders remaining. */
  todaySalesTruncated: boolean;
  /**
   * Facts said $0 and a bounded live period probe found Admin orders.
   * Desk must prefer live — empty/poisoned facts are not a trusted quiet period.
   */
  usedLivePeriodProbe: boolean;
  /**
   * Facts said $0 and the live probe failed, truncated at $0, or returned $0.
   * A $0 probe is not a trusted quiet period — search can miss Admin orders.
   * Never hero 0.00 / Below break-even — sales are unconfirmed.
   */
  salesUntrustedZero: boolean;
  /** Non-cancelled Admin orders seen by the recent-scan (before in-range filter). */
  shopOrdersSeen: number;
  /**
   * Recent-scan saw shop orders and none were in-range — a real quiet period.
   * Search-query $0 must never set this.
   */
  liveConfirmedQuiet: boolean;
}

/**
 * HARD-STOP desk sales loader: SalesDayFact totals + optional capped today top-up.
 * Never starts unbounded `fetchShopifySales` for a multi-year / incomplete window.
 * When closed-day facts are $0 on a short period (MTD), a bounded live probe
 * prefers Admin orders over poisoned empty facts.
 * Callers (Overview / Allocation / Close / LTV / API) share this path.
 */
export async function loadDeskSalesForPeriod(args: {
  admin: AdminApiContext;
  shopId: string;
  range: DateRange;
  ianaTimezone: string | null | undefined;
  now?: Date;
}): Promise<LoadDeskSalesForPeriodResult> {
  const now = args.now ?? new Date();
  const { admin, shopId, range, ianaTimezone } = args;

  let factsCoverage: SalesFactsCoverage | null = null;
  try {
    factsCoverage = await getSalesFactsCoverage(
      shopId,
      range,
      now,
      ianaTimezone,
    );
  } catch {
    factsCoverage = null;
  }

  try {
    const factsTotals = await getSalesFactsTotals(
      shopId,
      range,
      now,
      ianaTimezone,
    );
    let todaySales: SalesResult | null = null;
    let todaySalesUnavailable = false;
    let todaySalesTruncated = false;

    if (ianaTimezone) {
      const todayKey = shopLocalDayKey(now, ianaTimezone);
      const todayBounds = shopLocalDayRange(todayKey, ianaTimezone);
      if (range.end >= todayBounds.start) {
        try {
          todaySales = await fetchShopifySales(
            admin,
            todayPartialRange(now, ianaTimezone),
            { maxPages: LIVE_TODAY_MAX_PAGES, mode: "recent_scan" },
          );
          todaySalesTruncated = Boolean(todaySales.truncatedByPageCap);
        } catch {
          todaySales = null;
          todaySalesUnavailable = true;
        }
      }
    }

    const fromFacts = salesResultFromFactsTotals(factsTotals, todaySales);
    const todaySeen = todaySales?.shopOrdersSeen ?? 0;
    const factsAreZero =
      fromFacts.totalSales === 0 && fromFacts.orderCount === 0;
    const probe = shouldProbeLivePeriodSales({
      factSales: fromFacts.totalSales,
      factOrders: fromFacts.orderCount,
      period: range,
      coverage: factsCoverage,
    });

    if (probe) {
      try {
        const livePeriod = await fetchShopifySales(admin, range, {
          maxPages: LIVE_PERIOD_PROBE_MAX_PAGES,
          mode: "recent_scan",
        });
        const shopOrdersSeen = Math.max(
          livePeriod.shopOrdersSeen ?? 0,
          todaySeen,
        );
        const liveHasOrders =
          livePeriod.totalSales > 0 || livePeriod.orderCount > 0;
        if (liveHasOrders) {
          return {
            sales: { ...livePeriod, shopOrdersSeen },
            salesError: null,
            factsCoverage: factsCoverage
              ? { ...factsCoverage, complete: false }
              : factsCoverage,
            todaySalesUnavailable,
            todaySalesTruncated:
              todaySalesTruncated || Boolean(livePeriod.truncatedByPageCap),
            usedLivePeriodProbe: true,
            salesUntrustedZero: false,
            shopOrdersSeen,
            liveConfirmedQuiet: false,
          };
        }
        const liveConfirmedQuiet = shopOrdersSeen > 0;
        return {
          sales: fromFacts,
          salesError: null,
          factsCoverage,
          todaySalesUnavailable,
          todaySalesTruncated:
            todaySalesTruncated || Boolean(livePeriod.truncatedByPageCap),
          usedLivePeriodProbe: true,
          salesUntrustedZero: !liveConfirmedQuiet,
          shopOrdersSeen,
          liveConfirmedQuiet,
        };
      } catch {
        return {
          sales: fromFacts,
          salesError: null,
          factsCoverage,
          todaySalesUnavailable,
          todaySalesTruncated,
          usedLivePeriodProbe: false,
          salesUntrustedZero: true,
          shopOrdersSeen: todaySeen,
          liveConfirmedQuiet: false,
        };
      }
    }

    return {
      sales: fromFacts,
      salesError: null,
      factsCoverage,
      todaySalesUnavailable,
      todaySalesTruncated,
      usedLivePeriodProbe: false,
      salesUntrustedZero: factsAreZero,
      shopOrdersSeen: todaySeen,
      liveConfirmedQuiet: false,
    };
  } catch (err) {
    return {
      sales: emptySales("shopify"),
      salesError:
        err instanceof Error ? err.message : "Failed to load sales facts",
      factsCoverage,
      todaySalesUnavailable: false,
      todaySalesTruncated: false,
      usedLivePeriodProbe: false,
      salesUntrustedZero: true,
      shopOrdersSeen: 0,
      liveConfirmedQuiet: false,
    };
  }
}

/** Full day fact row for Overview day-quality (orders + cohort sales). */
export type SalesDayFactRow = {
  sales: number;
  orderCount: number;
  newCustomerNetSales: number;
  returningCustomerNetSales: number;
  netSales: number | null;
  grossSales: number | null;
};

/**
 * SalesDayFact rows keyed by the same "YYYY-MM-DD" string shape the desk's other
 * daily-sales maps use (see `sample-desk.server.ts`'s `utcDayKey` for the matching
 * SampleSalesDay convention) — safe to merge straight into `buildDailySpine` /
 * `buildDailyRowsForWindow`'s `salesByDay` without a timezone-shift bug, since both
 * read the stored UTC-midnight day back through UTC getters rather than local ones.
 */
export async function getSalesFactRowsByDay(
  shopId: string,
  range: { start: Date; end: Date },
  timeZone?: string | null,
): Promise<Map<string, SalesDayFactRow>> {
  const dayFilter = salesFactsDayFilter(range, timeZone);
  const rows = await prisma.salesDayFact.findMany({
    where: { shopId, day: { gte: dayFilter.gte, lte: dayFilter.lte } },
    select: {
      day: true,
      sales: true,
      orderCount: true,
      newCustomerNetSales: true,
      returningCustomerNetSales: true,
      netSales: true,
      grossSales: true,
    },
  });

  const map = new Map<string, SalesDayFactRow>();
  for (const row of rows) {
    const key = utcDayKeyFromDate(row.day);
    const prev = map.get(key);
    if (prev) {
      map.set(key, {
        sales: prev.sales + row.sales,
        orderCount: prev.orderCount + row.orderCount,
        newCustomerNetSales: prev.newCustomerNetSales + row.newCustomerNetSales,
        returningCustomerNetSales:
          prev.returningCustomerNetSales + row.returningCustomerNetSales,
        netSales:
          prev.netSales != null && row.netSales != null
            ? prev.netSales + row.netSales
            : prev.netSales ?? row.netSales,
        grossSales:
          prev.grossSales != null && row.grossSales != null
            ? prev.grossSales + row.grossSales
            : prev.grossSales ?? row.grossSales,
      });
    } else {
      map.set(key, {
        sales: row.sales,
        orderCount: row.orderCount,
        newCustomerNetSales: row.newCustomerNetSales,
        returningCustomerNetSales: row.returningCustomerNetSales,
        netSales: row.netSales,
        grossSales: row.grossSales,
      });
    }
  }
  return map;
}

/** Sales-only map — thin wrapper over {@link getSalesFactRowsByDay}. */
export async function getSalesFactsByDay(
  shopId: string,
  range: { start: Date; end: Date },
  timeZone?: string | null,
): Promise<Map<string, number>> {
  const rows = await getSalesFactRowsByDay(shopId, range, timeZone);
  const map = new Map<string, number>();
  for (const [key, row] of rows) {
    map.set(key, row.sales);
  }
  return map;
}
