/**
 * Shopify `read_orders` history (~60 days) vs certified SalesDayFact.
 * A successful empty fetch outside that window is unseen history, not $0.
 */

import { SHOPIFY_READ_ORDERS_WINDOW_DAYS } from "./periods";

export { SHOPIFY_READ_ORDERS_WINDOW_DAYS };

export function shopifyReadOrdersScopesAllowDeep(
  scopes = process.env.SCOPES,
): boolean {
  return (scopes ?? "").includes("read_all_orders");
}

/**
 * Stored backfill `historyLimited` is a 60-day-era flag. When
 * `read_all_orders` is on, Live year / long windows are in scope — do not
 * keep treating the shop as capped.
 */
export function shopifyOrderHistoryIsLimited(
  storedLimited: boolean,
  scopes = process.env.SCOPES,
): boolean {
  return storedLimited && !shopifyReadOrdersScopesAllowDeep(scopes);
}

/** UTC midnight of (UTC calendar day − {@link SHOPIFY_READ_ORDERS_WINDOW_DAYS}). */
export function shopifyReadOrdersHorizonUtc(now: Date): Date {
  return new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate() - SHOPIFY_READ_ORDERS_WINDOW_DAYS,
    ),
  );
}

export function isShopifyHistoryWindowError(
  errors?: Array<{ message?: string; extensions?: { code?: string } }>,
  message?: string | null,
): boolean {
  const blob = [
    ...(errors ?? []).map(
      (e) => `${e.message ?? ""} ${e.extensions?.code ?? ""}`,
    ),
    message ?? "",
  ]
    .join(" ")
    .toUpperCase();
  return (
    /ACCESS_DENIED/.test(blob) ||
    /READ_ALL_ORDERS/.test(blob) ||
    /ORDER.*WINDOW/.test(blob) ||
    /OLDER THAN/.test(blob) ||
    /ACCESS DENIED/.test(blob)
  );
}

/**
 * Successful 0-order / $0 fetch outside the read_orders window is hidden
 * history, not a certified zero-sales day.
 */
export function isUnseenShopifySalesDay(opts: {
  day: Date;
  orderCount: number;
  totalSales: number;
  now: Date;
  scopesAllowDeep?: boolean;
}): boolean {
  const deep =
    opts.scopesAllowDeep ?? shopifyReadOrdersScopesAllowDeep();
  if (deep) return false;
  const empty = opts.orderCount <= 0 && !(opts.totalSales > 0);
  if (!empty) return false;
  return opts.day.getTime() < shopifyReadOrdersHorizonUtc(opts.now).getTime();
}

/**
 * Stored facts we may serve as a real day.
 * Non-zero sales stay (the day was fetched while visible).
 * $0 outside the ~60-day window is treated as unseen when history is limited.
 */
export function isCertifiedSalesDayFact(opts: {
  day: Date;
  sales: number;
  now?: Date;
  scopesAllowDeep?: boolean;
}): boolean {
  const now = opts.now ?? new Date();
  const deep =
    opts.scopesAllowDeep ?? shopifyReadOrdersScopesAllowDeep();
  if (deep) return true;
  if (Number.isFinite(opts.sales) && opts.sales !== 0) return true;
  return opts.day.getTime() >= shopifyReadOrdersHorizonUtc(now).getTime();
}
