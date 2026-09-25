import type { AdminApiContext } from "@shopify/shopify-app-react-router/server";
import prisma from "../db.server";
import {
  emptySales,
  shopLocalDayKey,
  shopLocalDayRange,
  listRecentClosedShopLocalDays,
  type SalesResult,
} from "./shopify-sales.server";
import {
  fetchShopifySalesDayTotals,
  ShopifyReportsScopeError,
} from "./shopify-sales-totals.server";
import {
  salesTotalsWindowDayCount,
  type SalesDayTotal,
} from "./shopify-sales-totals";
import { ensureShopMetadata } from "./shop-metadata.server";
import { DESK_HISTORY_YEARS_BACK } from "./desk-history";
import { countClosedDaysInPeriod } from "./mer-trust";
import {
  isChartAbortError,
  throwIfChartRequestAborted,
} from "./chart-smooth";
import type { DateRange } from "./periods";
import {
  isCertifiedSalesDayFact,
  shopifyReadOrdersScopesAllowDeep,
} from "./shopify-order-window";
import { isBillingEnabled } from "./billing-flag.server";
import {
  orderRowWindowDayCount,
  resolveLiveIngestWindowDays,
} from "./live-ingest-depth";
import { shopIsProForIngest } from "./live-ingest-depth.server";
import { orderMissingIngestDays } from "./ingest-priority";
/** SalesDayFact.source for closed days written by the ShopifyQL totals lane. */
export const SALES_DAY_FACT_SOURCE = "shopifyql_sales_day_v1";
/**
 * In-progress local today. Not a sealed closed day — backfill still treats
 * the day as missing once it closes, then overwrites with {@link SALES_DAY_FACT_SOURCE}.
 */
export const SALES_DAY_FACT_OPEN_SOURCE = "shopifyql_sales_day_open_v1";

/**
 * Desk horizon for charts and the spend template: Jan 1 of (UTC year − N).
 * Ingest asks ShopifyQL for {@link salesTotalsWindowDayCount} and does not
 * page orders. This constant stays at 5 so the spend CSV floor does not move.
 */
export const SALES_DAY_FACT_WINDOW_YEARS_BACK = DESK_HISTORY_YEARS_BACK;

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
 * @deprecated Prefer {@link salesDayFactWindowDayCount} — calendar Jan-1 window.
 * Kept as a rough upper bound (~5×365+1) for callers that still pass a fixed count.
 */
export const SALES_DAY_FACT_WINDOW_DAYS = 5 * 365 + 1;

/**
 * Max closed days written per `runSalesFactsBackfill` call. One ShopifyQL
 * query covers the batch; this only bounds the upserts.
 */
export const SALES_DAY_FACT_MAX_DAYS_PER_RUN = 366;

/** Queue type: resume SalesDayFact until the public-app window is filled. */
export const BACKFILL_SALES_DAY_FACTS_JOB = "backfill_sales_day_facts";

export interface SalesFactBackfillResult {
  shopId: string;
  ranAt: string;
  /** Days this call attempted to fetch + upsert. */
  attempted: number;
  /** Days successfully written this call. */
  written: number;
  /** Days whose Shopify fetch failed this call — left missing for the next run to retry. */
  failed: string[];
  /**
   * Days Shopify did not share (history window / empty ShopifyQL row).
   * Left missing — never stored as $0.
   */
  unseen: string[];
  /**
   * Set when ianaTimezone was (and remains) unknown, or when the token lacks
   * `read_reports` (sales totals ingest blocked — not an orders crawl).
   */
  skippedReason: "no_timezone" | "reports_scope_missing" | null;
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

function salesResultFromDayTotal(row: SalesDayTotal | undefined): SalesResult {
  const customerMetricsAvailable = row?.customerMetricsAvailable === true;
  return {
    totalSales: row?.totalSales ?? 0,
    netSales: row?.netSales ?? 0,
    netSalesKnown: true,
    grossSales: row?.grossSales ?? 0,
    grossSalesKnown: true,
    salesBasisUsed: "total",
    orderCount: row?.orderCount ?? 0,
    newCustomers: 0,
    returningCustomers: 0,
    // Field name is historical — amounts are ShopifyQL Total Sales $ on New/Returning orders.
    newCustomerNetSales: customerMetricsAvailable
      ? (row?.newCustomerNetSales ?? 0)
      : 0,
    returningCustomerNetSales: customerMetricsAvailable
      ? (row?.returningCustomerNetSales ?? 0)
      : 0,
    guestOrders: 0,
    customerMetricsAvailable,
    source: "shopify",
  };
}

/**
 * Days already sealed by the ShopifyQL lane. Legacy order-sum rows
 * (`shopify_order_current_total_v1`, etc.) count as missing so backfill can
 * overwrite them once `read_reports` + PCD L2 actually return totals.
 */
async function existingFactDayKeys(
  shopId: string,
  dayKeys: string[],
): Promise<Set<string>> {
  if (dayKeys.length === 0) return new Set();
  const sorted = [...dayKeys].sort();
  const rangeStart = dayKeyToUtcDate(sorted[0]!);
  const rangeEnd = dayKeyToUtcDate(sorted[sorted.length - 1]!);

  const rows = await prisma.salesDayFact.findMany({
    where: {
      shopId,
      day: { gte: rangeStart, lte: rangeEnd },
      source: SALES_DAY_FACT_SOURCE,
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
  source: string = SALES_DAY_FACT_SOURCE,
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
    source,
  };

  // Upsert only after the ShopifyQL read succeeded — a zero-sales
  // day is a legitimate fact (written as sales: 0), a failed fetch is not (left missing).
  // Never write demo/sample into SalesDayFact — sample till stays on SampleSalesDay.
  if (
    data.source !== SALES_DAY_FACT_SOURCE &&
    data.source !== SALES_DAY_FACT_OPEN_SOURCE
  ) {
    throw new Error(`SalesDayFact source must be ${SALES_DAY_FACT_SOURCE}`);
  }
  await prisma.salesDayFact.upsert({
    where: { shopId_day: { shopId, day } },
    create: { shopId, day, ...data },
    update: data,
  });
}

/**
 * Closed days this shop may ingest.
 * Trial and paid both stop at 24 months — same cap as order rows.
 * No five-year or ten-year ShopifyQL pull. An explicit `windowDays`
 * can only shrink that result.
 */
async function salesIngestDayCount(
  shopId: string,
  now: Date,
  windowDays?: number,
): Promise<number> {
  const granted = Math.min(
    salesTotalsWindowDayCount(now),
    orderRowWindowDayCount(now),
  );
  const billingEnabled = isBillingEnabled();
  const isPro = billingEnabled ? await shopIsProForIngest(shopId) : false;
  const commercial = resolveLiveIngestWindowDays({
    billingEnabled,
    isPro,
    paidWindowDays: granted,
  });
  if (windowDays == null) return commercial;
  const requested = Math.floor(windowDays);
  if (!Number.isFinite(requested) || requested <= 0) return commercial;
  return Math.min(commercial, requested);
}

/**
 * Backfill/resume up to `SALES_DAY_FACT_MAX_DAYS_PER_RUN` closed shop-local days
 * in the commercial sales window that still lack a ShopifyQL-sourced fact.
 * Idempotent and safe to call repeatedly (auth callback, cron, manual) — each
 * call re-derives the gap from SalesDayFact, so it always resumes rather than
 * restarts. Legacy order-sum rows are treated as gaps (overwrite via upsert).
 *
 * Skips entirely (no rows touched) when the shop's ianaTimezone is unknown and a
 * metadata sync attempt does not resolve one — server-local time is never substituted.
 */
export async function runSalesFactsBackfill(
  admin: AdminApiContext,
  shopId: string,
  options?: {
    now?: Date;
    maxDays?: number;
    /** Shrink ingest width — tests / ops. Never wider than the commercial window. */
    windowDays?: number;
    scopesAllowDeep?: boolean;
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
      unseen: [],
      skippedReason: "no_timezone",
      remainingMissingDays: 0,
    };
  }

  const timeZone = metadata.ianaTimezone;
  const ingestDayCount = await salesIngestDayCount(
    shopId,
    now,
    options?.windowDays,
  );
  const windowDayKeys = listRecentClosedShopLocalDays(
    timeZone,
    ingestDayCount,
    now,
  );
  const existing = await existingFactDayKeys(shopId, windowDayKeys);
  const missing = windowDayKeys.filter((key) => !existing.has(key));
  // Newest closed days first, then the rest of the 24-month window.
  const batch = orderMissingIngestDays(windowDayKeys, existing).slice(
    0,
    maxDays,
  );

  let written = 0;
  const failed: string[] = [];
  const unseen: string[] = [];
  if (batch.length > 0) {
    try {
      const chronological = [...batch].sort();
      const totals = await fetchShopifySalesDayTotals(admin, {
        since: chronological[0]!,
        until: chronological[chronological.length - 1]!,
      });
      for (const dayKey of batch) {
        await upsertSalesDayFact(
          shopId,
          dayKey,
          salesResultFromDayTotal(totals.get(dayKey)),
          metadata.currencyCode,
          now,
        );
        written += 1;
      }
    } catch (err) {
      if (err instanceof ShopifyReportsScopeError) {
        return {
          shopId,
          ranAt,
          attempted: 0,
          written: 0,
          failed: [],
          unseen: [],
          skippedReason: "reports_scope_missing",
          remainingMissingDays: missing.length,
        };
      }
      failed.push(...batch);
    }
  }

  return {
    shopId,
    ranAt,
    attempted: failed.length > 0 ? batch.length : written,
    written,
    failed,
    unseen,
    skippedReason: null,
    remainingMissingDays: Math.max(0, missing.length - written),
  };
}

/**
 * Nightly sales refresh. One ShopifyQL span for the last closed days only.
 * Does not walk the 24-month book.
 */
export async function refreshRecentSalesFromShopify(
  admin: AdminApiContext,
  shopId: string,
  dayCount: number,
  now: Date = new Date(),
): Promise<void> {
  const days = Math.max(1, Math.floor(dayCount));
  const metadata = await ensureShopMetadata(admin, shopId);
  if (!metadata.ianaTimezone) return;
  const dayKeys = listRecentClosedShopLocalDays(
    metadata.ianaTimezone,
    days,
    now,
  );
  if (dayKeys.length === 0) return;
  const chronological = [...dayKeys].sort();
  const totals = await fetchShopifySalesDayTotals(admin, {
    since: chronological[0]!,
    until: chronological[chronological.length - 1]!,
  });
  for (const dayKey of dayKeys) {
    const row = totals.get(dayKey);
    if (!row) continue;
    await upsertSalesDayFact(
      shopId,
      dayKey,
      salesResultFromDayTotal(row),
      metadata.currencyCode,
      now,
    );
  }
}

/**
 * Closed days still missing from SalesDayFact in the same ingest window
 * `runSalesFactsBackfill` uses. Used by the first-session one-shot gate so a
 * sealed shop does not re-arm window jobs on every Live tab.
 *
 * Same window as `runSalesFactsBackfill`: ShopifyQL day totals, not order pages.
 * Unpaid / trial uses the same closed-day slice as the crawl.
 */
export async function getSalesFactsWindowRemainingDays(
  shopId: string,
  options: {
    ianaTimezone: string;
    now?: Date;
    scopesAllowDeep?: boolean;
  },
): Promise<number> {
  const now = options.now ?? new Date();
  const ingestDayCount = await salesIngestDayCount(shopId, now);
  const windowDayKeys = listRecentClosedShopLocalDays(
    options.ianaTimezone,
    ingestDayCount,
    now,
  );
  const existing = await existingFactDayKeys(shopId, windowDayKeys);
  return windowDayKeys.filter((key) => !existing.has(key)).length;
}

/**
 * Why a dirty-day reconcile wrote nothing. All three are normal outcomes, not
 * errors — the job succeeds so it is not retried against an impossible day.
 */
export type SalesDayReconcileSkip =
  | "no_timezone"
  /**
   * The day is still in the future on the shop clock. In-progress today is
   * written with {@link SALES_DAY_FACT_OPEN_SOURCE} so the open page can read
   * it, and closed-day backfill still reseals the day after midnight.
   */
  | "day_not_closed"
  /** Older than the serving window — the day is not recomputed. */
  | "day_outside_window"
  | "reports_scope_missing";

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

  const todayKey = shopLocalDayKey(now, timeZone);
  if (dayKey > todayKey) {
    return { shopId, dayKey, written: false, skippedReason: "day_not_closed" };
  }
  const openToday = dayKey === todayKey;

  const windowStart = salesDayFactWindowStartUtc(now);
  const range = shopLocalDayRange(dayKey, timeZone);
  if (range.end < windowStart) {
    return { shopId, dayKey, written: false, skippedReason: "day_outside_window" };
  }

  let sales: SalesResult;
  try {
    const totals = await fetchShopifySalesDayTotals(admin, {
      since: dayKey,
      until: dayKey,
    });
    sales = salesResultFromDayTotal(totals.get(dayKey));
  } catch (err) {
    if (err instanceof ShopifyReportsScopeError) {
      return {
        shopId,
        dayKey,
        written: false,
        skippedReason: "reports_scope_missing",
      };
    }
    throw err;
  }
  await upsertSalesDayFact(
    shopId,
    dayKey,
    sales,
    metadata.currencyCode,
    now,
    openToday ? SALES_DAY_FACT_OPEN_SOURCE : SALES_DAY_FACT_SOURCE,
  );
  return { shopId, dayKey, written: true, skippedReason: null };
}

export interface SalesFactsCoverage {
  expectedClosedDays: number;
  factDays: number;
  /**
   * True only when the requested period lies entirely inside the Jan-1 × N-year
   * ingest window AND every expected closed day has a fact row. Periods that start
   * before the window are never complete — desk serves stored facts only + honest
   * banners (HARD-STOP: no unbounded live GraphQL on paint).
   */
  complete: boolean;
  /** True when range.start is before the Jan-1 × N-year fact window. */
  periodExceedsFactWindow: boolean;
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
    const factDays = await countCertifiedSalesFactDays(
      shopId,
      windowStart,
      range.end,
      now,
    );
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

  const factDays = await countCertifiedSalesFactDays(
    shopId,
    range.start,
    range.end,
    now,
  );

  return {
    expectedClosedDays,
    factDays,
    complete: factDays >= expectedClosedDays,
    periodExceedsFactWindow: false,
  };
}

async function countCertifiedSalesFactDays(
  shopId: string,
  start: Date,
  end: Date,
  now: Date,
): Promise<number> {
  const rows = await prisma.salesDayFact.findMany({
    where: { shopId, day: { gte: start, lte: end } },
    select: { day: true, sales: true, source: true },
  });
  const scopesAllowDeep = shopifyReadOrdersScopesAllowDeep();
  return rows.filter((row) =>
    isCertifiedSalesDayFact({
      day: row.day,
      sales: row.sales,
      source: row.source,
      now,
      scopesAllowDeep,
    }),
  ).length;
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
   * (the same customer ordering on two different days counts twice). Headcount stays
   * dark on the ShopifyQL sales path; dollar split uses `customerMetricsAvailable`.
   */
  newCustomersSum: number;
  returningCustomersSum: number;
  /**
   * Additive New/Returning Total Sales $ across fact days (Shopify order-based split,
   * not unique headcount).
   */
  newCustomerNetSalesSum: number;
  returningCustomerNetSalesSum: number;
  /**
   * True when every certified fact day in range has ShopifyQL New/Returning $.
   * Partial windows stay false so we do not overclaim a period split.
   */
  customerMetricsAvailable: boolean;
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
 * today top-up). New/Returning $ come from ShopifyQL’s order-based split when
 * `customerMetricsAvailable` is true — not unique buyer headcount.
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
    customerMetricsAvailable?: boolean;
    truncatedByPageCap?: boolean;
  } | null,
): SalesResult {
  const todayTotal = today?.totalSales ?? 0;
  const todayNet = today?.netSales ?? today?.totalSales ?? 0;
  const todayGross = today?.grossSales ?? today?.totalSales ?? 0;
  const todayOrders = today?.orderCount ?? 0;
  const todaySplitOk = today?.customerMetricsAvailable === true;
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
  // Closed-day split only when every fact day has it; today-only windows use today's flag.
  const customerMetricsAvailable =
    facts.dayCount === 0
      ? todaySplitOk
      : facts.customerMetricsAvailable;
  const useClosedSplit = facts.customerMetricsAvailable;
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
      (useClosedSplit ? facts.newCustomerNetSalesSum : 0) +
      (todaySplitOk ? (today?.newCustomerNetSales ?? 0) : 0),
    returningCustomerNetSales:
      (useClosedSplit ? facts.returningCustomerNetSalesSum : 0) +
      (todaySplitOk ? (today?.returningCustomerNetSales ?? 0) : 0),
    guestOrders: 0,
    customerMetricsAvailable,
    source: "shopify",
    ...(today?.truncatedByPageCap ? { truncatedByPageCap: true } : {}),
  };
}

/** Sum SalesDayFact rows overlapping `range` (clamped to the Jan-1 × N-year window). */
export async function getSalesFactsTotals(
  shopId: string,
  range: DateRange,
  now: Date = new Date(),
): Promise<SalesFactsTotals> {
  const windowStart = salesDayFactWindowStartUtc(now);
  const rangeClampedToFactWindow = range.start < windowStart;
  const clampedStart = rangeClampedToFactWindow ? windowStart : range.start;

  const rows = await prisma.salesDayFact.findMany({
    where: { shopId, day: { gte: clampedStart, lte: range.end } },
    select: {
      day: true,
      sales: true,
      netSales: true,
      grossSales: true,
      orderCount: true,
      newCustomers: true,
      returningCustomers: true,
      newCustomerNetSales: true,
      returningCustomerNetSales: true,
      customerMetricsAvailable: true,
      guestOrders: true,
      source: true,
    },
  });
  const scopesAllowDeep = shopifyReadOrdersScopesAllowDeep();
  const certified = rows.filter((row) =>
    isCertifiedSalesDayFact({
      day: row.day,
      sales: row.sales,
      source: row.source,
      now,
      scopesAllowDeep,
    }),
  );

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
  let customerMetricDays = 0;
  for (const row of certified) {
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
    newCustomerNetSalesSum += row.newCustomerNetSales ?? 0;
    returningCustomerNetSalesSum += row.returningCustomerNetSales ?? 0;
    guestOrdersSum += row.guestOrders ?? 0;
    if (row.customerMetricsAvailable) customerMetricDays += 1;
  }

  return {
    totalSales,
    netSalesSum,
    netSalesComplete: certified.length === 0 || netKnownDays === certified.length,
    grossSalesSum,
    grossSalesComplete:
      certified.length === 0 || grossKnownDays === certified.length,
    orderCount,
    newCustomersSum,
    returningCustomersSum,
    newCustomerNetSalesSum,
    returningCustomerNetSalesSum,
    customerMetricsAvailable:
      certified.length > 0 && customerMetricDays === certified.length,
    guestOrdersSum,
    dayCount: certified.length,
    rangeClampedToFactWindow,
  };
}

export interface LoadDeskSalesForPeriodResult {
  sales: SalesResult;
  salesError: string | null;
  factsCoverage: SalesFactsCoverage | null;
  /** Today live top-up threw — closed facts may still be OK; banner honesty. */
  todaySalesUnavailable: boolean;
  /** Today live top-up hit LIVE_TODAY_MAX_PAGES with more orders remaining. */
  todaySalesTruncated: boolean;
}

/**
 * Desk sales loader: stored SalesDayFact only, including an open today row
 * when orders/create or orders/updated have already reconciled it.
 * Never calls ShopifyQL or pages orders. Callers share this path.
 * `admin` stays on the signature so existing callers compile; paint does not use it.
 */
export async function loadDeskSalesForPeriod(args: {
  admin: AdminApiContext;
  shopId: string;
  range: DateRange;
  ianaTimezone: string | null | undefined;
  now?: Date;
  signal?: AbortSignal;
}): Promise<LoadDeskSalesForPeriodResult> {
  const now = args.now ?? new Date();
  const { shopId, range, ianaTimezone, signal } = args;
  throwIfChartRequestAborted(signal);

  let factsCoverage: SalesFactsCoverage | null = null;
  try {
    factsCoverage = await getSalesFactsCoverage(
      shopId,
      range,
      now,
      ianaTimezone,
    );
    throwIfChartRequestAborted(signal);
  } catch (err) {
    if (isChartAbortError(err)) throw err;
    factsCoverage = null;
  }

  try {
    throwIfChartRequestAborted(signal);
    const factsTotals = await getSalesFactsTotals(shopId, range, now);
    throwIfChartRequestAborted(signal);
    let todaySales: SalesResult | null = null;
    let todaySalesUnavailable = false;
    let todaySalesTruncated = false;

    if (ianaTimezone) {
      const todayKey = shopLocalDayKey(now, ianaTimezone);
      const todayBounds = shopLocalDayRange(todayKey, ianaTimezone);
      if (range.end >= todayBounds.start) {
        const todayRow = await prisma.salesDayFact.findUnique({
          where: {
            shopId_day: { shopId, day: dayKeyToUtcDate(todayKey) },
          },
          select: {
            sales: true,
            netSales: true,
            grossSales: true,
            orderCount: true,
            newCustomerNetSales: true,
            returningCustomerNetSales: true,
            customerMetricsAvailable: true,
            source: true,
          },
        });
        throwIfChartRequestAborted(signal);
        const readable =
          todayRow?.source === SALES_DAY_FACT_SOURCE ||
          todayRow?.source === SALES_DAY_FACT_OPEN_SOURCE;
        if (todayRow && readable) {
          todaySales = salesResultFromDayTotal({
            dayKey: todayKey,
            totalSales: todayRow.sales,
            netSales: todayRow.netSales ?? todayRow.sales,
            grossSales: todayRow.grossSales ?? todayRow.sales,
            orderCount: todayRow.orderCount,
            newCustomerNetSales: todayRow.newCustomerNetSales ?? 0,
            returningCustomerNetSales: todayRow.returningCustomerNetSales ?? 0,
            customerMetricsAvailable: todayRow.customerMetricsAvailable,
          });
        } else {
          // Honest loading — webhook reconcile writes today off the open page.
          todaySales = null;
          todaySalesUnavailable = true;
        }
      }
    }

    return {
      sales: salesResultFromFactsTotals(
        factsTotals,
        todaySales
          ? {
              totalSales: todaySales.totalSales,
              netSales: todaySales.netSales,
              grossSales: todaySales.grossSales,
              orderCount: todaySales.orderCount,
              newCustomerNetSales: todaySales.newCustomerNetSales,
              returningCustomerNetSales: todaySales.returningCustomerNetSales,
              customerMetricsAvailable: todaySales.customerMetricsAvailable,
              truncatedByPageCap: todaySales.truncatedByPageCap,
            }
          : null,
      ),
      salesError: null,
      factsCoverage,
      todaySalesUnavailable,
      todaySalesTruncated,
    };
  } catch (err) {
    if (isChartAbortError(err)) throw err;
    return {
      sales: emptySales("shopify"),
      salesError:
        err instanceof Error ? err.message : "Failed to load sales facts",
      factsCoverage,
      todaySalesUnavailable: false,
      todaySalesTruncated: false,
    };
  }
}

/**
 * SalesDayFact sales keyed by the same "YYYY-MM-DD" string shape the desk's other
 * daily-sales maps use (see `sample-desk.server.ts`'s `utcDayKey` for the matching
 * SampleSalesDay convention) — safe to merge straight into `buildDailySpine` /
 * `buildDailyRowsForWindow`'s `salesByDay` without a timezone-shift bug, since both
 * read the stored UTC-midnight day back through UTC getters rather than local ones.
 */
export async function getSalesFactsByDay(
  shopId: string,
  range: { start: Date; end: Date },
  options?: { now?: Date },
): Promise<Map<string, number>> {
  const now = options?.now ?? new Date();
  const rows = await prisma.salesDayFact.findMany({
    where: { shopId, day: { gte: range.start, lte: range.end } },
    select: { day: true, sales: true, source: true },
  });

  const scopesAllowDeep = shopifyReadOrdersScopesAllowDeep();
  const map = new Map<string, number>();
  for (const row of rows) {
    if (
      !isCertifiedSalesDayFact({
        day: row.day,
        sales: row.sales,
        source: row.source,
        now,
        scopesAllowDeep,
      })
    ) {
      continue;
    }
    const key = utcDayKeyFromDate(row.day);
    map.set(key, (map.get(key) ?? 0) + row.sales);
  }
  return map;
}

export type DaySalesOrders = { sales: number; orders: number };

/**
 * Certified daily sales + order counts for the Overview sales-order explorer.
 * Same certification gate as {@link getSalesFactsByDay} — only trustworthy
 * closed days — plus the order count so the desk can paint AOV and vs-prior.
 * Order dollars only; no spend.
 */
export async function getSalesOrderFactsByDay(
  shopId: string,
  range: { start: Date; end: Date },
  options?: { now?: Date },
): Promise<Map<string, DaySalesOrders>> {
  const now = options?.now ?? new Date();
  const rows = await prisma.salesDayFact.findMany({
    where: { shopId, day: { gte: range.start, lte: range.end } },
    select: { day: true, sales: true, orderCount: true, source: true },
  });

  const scopesAllowDeep = shopifyReadOrdersScopesAllowDeep();
  const map = new Map<string, DaySalesOrders>();
  for (const row of rows) {
    if (
      !isCertifiedSalesDayFact({
        day: row.day,
        sales: row.sales,
        source: row.source,
        now,
        scopesAllowDeep,
      })
    ) {
      continue;
    }
    const key = utcDayKeyFromDate(row.day);
    const prev = map.get(key) ?? { sales: 0, orders: 0 };
    map.set(key, {
      sales: prev.sales + row.sales,
      orders: prev.orders + row.orderCount,
    });
  }
  return map;
}
