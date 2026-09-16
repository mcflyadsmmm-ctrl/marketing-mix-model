/**
 * First Admin open: complete the public-app Shopify window (~60 days)
 * from already-granted read_orders / read_customers.
 *
 * OAuth and first paint must not await the crawl. Enqueue resume jobs, then
 * fire-and-forget the default chunk (20 sales days / 7 order days) — never
 * the timid maxDays: 2 that left a sealed thin book.
 */

import type { AdminApiContext } from "@shopify/shopify-app-react-router/server";
import { enqueueJob } from "./job-queue.server";
import {
  BACKFILL_ORDER_FACTS_JOB,
  runOrderFactsBackfill,
} from "./order-facts.server";
import {
  BACKFILL_SALES_DAY_FACTS_JOB,
  runSalesFactsBackfill,
} from "./sales-facts.server";

export const SHOPIFY_WINDOW_BACKFILL_MAX_ATTEMPTS = 40;

export function salesDayFactsWindowShouldResume(result: {
  remainingMissingDays: number;
  skippedReason: "no_timezone" | null;
}): boolean {
  if (result.skippedReason === "no_timezone") return false;
  return result.remainingMissingDays > 0;
}

export function orderFactsWindowShouldResume(result: {
  truncated: boolean;
  remainingMissingDays: number;
  historyLimited: boolean;
  skippedReason: "no_timezone" | null;
}): boolean {
  if (result.truncated) return true;
  if (result.skippedReason === "no_timezone" || result.historyLimited) {
    return false;
  }
  return result.remainingMissingDays > 0;
}

export async function enqueueShopifyWindowBackfill(
  shopId: string,
): Promise<void> {
  await Promise.all([
    enqueueJob({
      shopId,
      type: BACKFILL_SALES_DAY_FACTS_JOB,
      dedupeKey: shopId,
      payload: { reason: "first_session_window" },
      maxAttempts: SHOPIFY_WINDOW_BACKFILL_MAX_ATTEMPTS,
    }),
    enqueueJob({
      shopId,
      type: BACKFILL_ORDER_FACTS_JOB,
      dedupeKey: shopId,
      payload: { reason: "first_session_window" },
      maxAttempts: SHOPIFY_WINDOW_BACKFILL_MAX_ATTEMPTS,
    }),
  ]);
}

/**
 * Fast: write resume jobs, then kick default-sized bursts without awaiting them.
 * Safe on OAuth and Overview — first paint stays facts-only / pending.
 */
export async function scheduleFirstSessionShopifyWindow(
  admin: AdminApiContext,
  shopId: string,
): Promise<void> {
  await enqueueShopifyWindowBackfill(shopId);
  void runSalesFactsBackfill(admin, shopId).catch(() => {
    // Job tick resumes — never fail OAuth / first paint.
  });
  void runOrderFactsBackfill(admin, shopId).catch(() => {
    // Job tick resumes.
  });
}
