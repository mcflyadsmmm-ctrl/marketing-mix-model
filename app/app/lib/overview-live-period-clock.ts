/**
 * Live Overview period clock — ShopifyQL SalesDayFact only.
 * OrderFact peeks stay labeled From orders and never feed this figure.
 * SAMPLE (`deskAnalyticsDayTotalsLive(true)`) paints nothing here.
 */
import {
  ADMIN_MONEY_ABS,
  ADMIN_MONEY_REL,
  compareAdminMoney,
  type ScorecardJudgment,
} from "./accuracy-one-shop";
import {
  OVERVIEW_LAST_YEAR_NOT_ON_FILE,
  OVERVIEW_PERIOD_TOTAL_LABEL,
} from "./overview-first-viewport";
import { OVERVIEW_FROM_ORDERS_LABEL } from "./overview-order-book";
import { deskAnalyticsDayTotalsLive } from "./shopify-analytics-totals";
import { shopLocalDayKey, shopLocalDayRange } from "./shop-local-day";

/** Unknown ShopifyQL total — never a painted $0. */
export const OVERVIEW_SHOPIFY_CLOCK_PENDING = "Still loading — not $0.";

export type OverviewShopifyPeriodClock = {
  label: typeof OVERVIEW_PERIOD_TOTAL_LABEL;
  /** OrderFact peeks keep this label. This clock does not paint their sums. */
  orderPeekLabel: typeof OVERVIEW_FROM_ORDERS_LABEL;
  /** Selected period. Null paints —. Includes a certified 0. */
  periodSales: number | null;
  periodNote: string | null;
  priorDayKey: string | null;
  /** Closed prior shop day from SalesDayFact. Null paints —. Certified 0 stays 0. */
  priorDaySales: number | null;
  priorDayNote: string | null;
};

export function periodRangeIncludesShopToday(
  range: { start: Date; end: Date },
  timeZone: string | null | undefined,
  now: Date,
): boolean {
  const zone = timeZone?.trim() || null;
  if (!zone) return false;
  const todayKey = shopLocalDayKey(now, zone);
  const bounds = shopLocalDayRange(todayKey, zone);
  return range.end >= bounds.start && range.start <= bounds.end;
}

export function overviewShopifyFactsPending(input: {
  useSampleDesk: boolean;
  salesError: boolean;
  coverage: {
    complete: boolean;
    periodExceedsFactWindow: boolean;
    expectedClosedDays: number;
  } | null;
}): boolean {
  if (input.useSampleDesk) return false;
  if (input.salesError || input.coverage == null) return true;
  return (
    !input.coverage.complete &&
    !input.coverage.periodExceedsFactWindow &&
    input.coverage.expectedClosedDays > 0
  );
}

function finiteNumber(value: number | null | undefined): value is number {
  return value != null && Number.isFinite(value);
}

/**
 * Live period clock from ShopifyQL totals already on the desk.
 * `shopifyPeriodTotal` is SalesDayFact (plus today's ShopifyQL top-up when the
 * desk included it). There is no OrderFact input — a page sum cannot be passed.
 * Returns null on SAMPLE so QL dollars are never painted as Live there.
 */
export function buildOverviewShopifyPeriodClock(input: {
  useSampleDesk: boolean;
  coverageComplete: boolean;
  periodExceedsFactWindow: boolean;
  shopifyPeriodTotal: number | null;
  periodIncludesToday: boolean;
  todayShopifyTotalKnown: boolean;
  factsPending: boolean;
  priorDayKey: string | null;
  priorDayOnFile: boolean;
  priorDaySales: number | null;
}): OverviewShopifyPeriodClock | null {
  if (!deskAnalyticsDayTotalsLive(input.useSampleDesk)) return null;

  const priorReady = input.priorDayOnFile && finiteNumber(input.priorDaySales);
  const priorDaySales = priorReady ? input.priorDaySales : null;
  const priorDayNote = priorReady
    ? null
    : input.factsPending
      ? OVERVIEW_SHOPIFY_CLOCK_PENDING
      : OVERVIEW_LAST_YEAR_NOT_ON_FILE;

  const todayOk = !input.periodIncludesToday || input.todayShopifyTotalKnown;
  const periodReady =
    input.coverageComplete &&
    !input.periodExceedsFactWindow &&
    !input.factsPending &&
    todayOk &&
    finiteNumber(input.shopifyPeriodTotal);
  const periodSales = periodReady ? input.shopifyPeriodTotal : null;
  const periodNote = periodReady
    ? null
    : input.factsPending
      ? OVERVIEW_SHOPIFY_CLOCK_PENDING
      : OVERVIEW_LAST_YEAR_NOT_ON_FILE;

  return {
    label: OVERVIEW_PERIOD_TOTAL_LABEL,
    orderPeekLabel: OVERVIEW_FROM_ORDERS_LABEL,
    periodSales,
    periodNote,
    priorDayKey: input.priorDayKey,
    priorDaySales,
    priorDayNote,
  };
}

/**
 * Closed prior day vs Admin Total sales.
 * Bar is the desk SoT: $1 or 0.5% of the larger side. No looser override.
 */
export function judgeOverviewClosedDayAgainstAdmin(
  desk: number | null,
  admin: number | null,
  pending: boolean,
): ScorecardJudgment {
  return compareAdminMoney(desk, admin, {
    pending,
    abs: ADMIN_MONEY_ABS,
    rel: ADMIN_MONEY_REL,
  });
}
