/**
 * Live Shopify ingest depth — not a feature gate.
 *
 * Product lock:
 * - SAMPLE demo = full wow (this module is Live ingest only).
 * - Trial and paid are the same desk. Billing does not shrink history.
 * - Order rows stop at {@link ORDER_ROW_WINDOW_MONTHS} for both.
 * - Daily sales totals are a ShopifyQL query (`read_reports`), not an
 *   order-page crawl. Missing that scope skips the sales fill. It does not
 *   fall back to reading orders.
 *
 * Flat $39. Price does not rise with sales. No GMV cliffs.
 */

/** Order-level rows. 24 calendar months is the first-year LTV book. */
export const ORDER_ROW_WINDOW_MONTHS = 24;

export type LiveIngestDepth = "trial_slice" | "paid_full";

export function shopMayIngestFullHistory(_input: {
  billingEnabled: boolean;
  isPro: boolean;
}): boolean {
  void _input;
  // Trial and paid share the 24-month book. Do not withhold history until charge.
  return true;
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
 * Trial and paid both keep that window. Callers cap order rows at 24 months.
 */
export function resolveLiveIngestWindowDays(input: {
  billingEnabled: boolean;
  isPro: boolean;
  paidWindowDays: number;
}): number {
  // Trial and paid share this window. Billing does not shorten it.
  void input.billingEnabled;
  void input.isPro;
  return Math.max(0, input.paidWindowDays);
}

/**
 * OrderFact width. Trial and paid share this: the 24-month row cap, and
 * never longer than the Shopify-visible window.
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
 * Shopify-visible window (~60d when deep history is off). Trial and paid
 * share {@link resolveCommercialOrderWindowDays}.
 */
export function resolveOrderRowWindowDays(input: {
  shopifyWindowDays: number;
  now?: Date;
}): number {
  return Math.min(orderRowWindowDayCount(input.now), input.shopifyWindowDays);
}
