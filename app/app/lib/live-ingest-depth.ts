import { LIVE_UNPAID_INGEST_DAYS } from "./live-unpark";

/**
 * Live Shopify ingest depth — not a feature gate.
 *
 * Product lock:
 * - SAMPLE demo = full wow (this module is Live ingest only).
 * - Unpaid / Shopify trial stops at {@link LIVE_UNPAID_INGEST_DAYS} closed days.
 * - Paid, and a host that is not charging, keep the Shopify-visible window.
 * - Order rows still stop at {@link ORDER_ROW_WINDOW_MONTHS}.
 * - Daily sales totals are a ShopifyQL query (`read_reports`), not an
 *   order-page crawl. Missing that scope skips the sales fill. It does not
 *   fall back to reading orders.
 *
 * Flat $39. Price does not rise with sales. No GMV cliffs.
 */

export { LIVE_UNPAID_INGEST_DAYS };

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
 * Sales width. `paidWindowDays` is the Shopify-visible window.
 * Unpaid / Shopify trial (billing on, not paid) returns the smaller of
 * that window and {@link LIVE_UNPAID_INGEST_DAYS} closed days.
 * Paid, and a host that is not charging, return `paidWindowDays`.
 */
export function resolveLiveIngestWindowDays(input: {
  billingEnabled: boolean;
  isPro: boolean;
  paidWindowDays: number;
}): number {
  const granted = Math.max(0, input.paidWindowDays);
  if (shopMayIngestFullHistory(input)) return granted;
  return Math.min(LIVE_UNPAID_INGEST_DAYS, granted);
}

/**
 * OrderFact width. Unpaid / trial slice first, then the 24-month row cap,
 * and never longer than the Shopify-visible window.
 */
export function resolveCommercialOrderWindowDays(input: {
  billingEnabled: boolean;
  isPro: boolean;
  shopifyWindowDays: number;
  now?: Date;
}): number {
  const commercialDays = resolveLiveIngestWindowDays({
    billingEnabled: input.billingEnabled,
    isPro: input.isPro,
    paidWindowDays: input.shopifyWindowDays,
  });
  return resolveOrderRowWindowDays({
    shopifyWindowDays: commercialDays,
    now: input.now,
  });
}

/**
 * Raw order-row cap. Never longer than 24 months, and never longer than the
 * Shopify-visible window (~60d when deep history is off). Callers that know
 * billing use {@link resolveCommercialOrderWindowDays} so unpaid/trial is
 * already sliced to {@link LIVE_UNPAID_INGEST_DAYS}.
 */
export function resolveOrderRowWindowDays(input: {
  shopifyWindowDays: number;
  now?: Date;
}): number {
  return Math.min(orderRowWindowDayCount(input.now), input.shopifyWindowDays);
}
