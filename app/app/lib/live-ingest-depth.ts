/**
 * Live Shopify ingest depth — not a feature gate.
 *
 * Product lock (2026-09-18):
 * - SAMPLE demo = full wow (this module is Live ingest only).
 * - Order rows stop at {@link ORDER_ROW_WINDOW_MONTHS} for trial and paid.
 * - Daily sales totals are a ShopifyQL query (`read_reports`), not an
 *   order-page crawl. Missing that scope skips the sales fill. It does not
 *   fall back to reading orders.
 *
 * Flat $39. Price does not rise with sales. No GMV cliffs.
 */

/** Order-level rows. 24 calendar months is the first-year LTV book. */
export const ORDER_ROW_WINDOW_MONTHS = 24;

export type LiveIngestDepth = "trial_slice" | "paid_full";

export function shopMayIngestFullHistory(input: {
  billingEnabled: boolean;
  isPro: boolean;
}): boolean {
  if (!input.billingEnabled) return true;
  return input.isPro;
}

export function liveIngestDepth(input: {
  billingEnabled: boolean;
  isPro: boolean;
}): LiveIngestDepth {
  return shopMayIngestFullHistory(input) ? "paid_full" : "trial_slice";
}

/** Closed days in the last 24 calendar months, UTC month arithmetic. */
export function orderRowWindowDayCount(now: Date = new Date()): number {
  const start = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
  start.setUTCMonth(start.getUTCMonth() - ORDER_ROW_WINDOW_MONTHS);
  const ms = now.getTime() - start.getTime();
  return Math.max(1, Math.ceil(ms / 86_400_000));
}

/**
 * SalesDayFact width. Shopify already applied its cap in `paidWindowDays`.
 * Trial is not cut to 90 days. Billing flags stay in the signature so
 * callers do not fork.
 */
export function resolveLiveIngestWindowDays(input: {
  billingEnabled: boolean;
  isPro: boolean;
  paidWindowDays: number;
}): number {
  void input.billingEnabled;
  void input.isPro;
  return input.paidWindowDays;
}

/**
 * OrderFact width. Never longer than 24 months, and never longer than the
 * Shopify-visible window (~60d when deep history is off).
 */
export function resolveOrderRowWindowDays(input: {
  shopifyWindowDays: number;
  now?: Date;
}): number {
  return Math.min(orderRowWindowDayCount(input.now), input.shopifyWindowDays);
}
