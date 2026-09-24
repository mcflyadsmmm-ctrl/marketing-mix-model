/**
 * First Admin open: complete the Shopify ingest window already granted.
 *
 * Product lock:
 * - Demo = SAMPLE full wow (this lane is Live ingest, not SAMPLE).
 * - Trial and paid keep the same Shopify-visible window. Order rows stop at 24 months.
 * - Daily sales totals come from ShopifyQL, not from paging those orders.
 * - See live-ingest-depth. Paid $39 does not extend order rows past 24 months.
 *
 * OAuth and first paint must not await the crawl. Enqueue resume jobs, then
 * fire-and-forget the default chunk (20 sales days / 7 order days) — never
 * the timid maxDays: 2 that left a sealed thin book.
 *
 * Live unpark: skip enqueue while SAMPLE freeze / stage parked
 * (`liveUnparkIngestPolicyFromEnv`). Trial and paid both crawl 24 months,
 * newest days first, not five years.
 * One-shot contract lives in LIVE_SYNC_LAW_PR_REF.
 * One-shot after that full window seals: Live tabs skip enqueue/burst.
 * OAuth / first-session still kick while work remains. Refunds/cancels
 * re-arm OrderFact via webhook.
 */

import type { AdminApiContext } from "@shopify/shopify-app-react-router/server";
import prisma from "../db.server";
import { enqueueJob } from "./job-queue.server";
import { isBillingEnabled } from "./billing-flag.server";
import { shopMayIngestFullHistory } from "./live-ingest-depth";
import { shopIsProForIngest } from "./live-ingest-depth.server";
import {
  liveShopifyWindowSchedule,
  liveUnparkIngestPolicyFromEnv,
} from "./live-unpark";
import {
  BACKFILL_ORDER_FACTS_JOB,
  getOrderBackfillProgress,
  runOrderFactsBackfill,
} from "./order-facts.server";
import {
  BACKFILL_SALES_DAY_FACTS_JOB,
  getSalesFactsWindowRemainingDays,
  runSalesFactsBackfill,
} from "./sales-facts.server";

export const SHOPIFY_WINDOW_BACKFILL_MAX_ATTEMPTS = 40;

export function salesDayFactsWindowShouldResume(result: {
  remainingMissingDays: number;
  skippedReason: "no_timezone" | "reports_scope_missing" | null;
}): boolean {
  if (
    result.skippedReason === "no_timezone" ||
    result.skippedReason === "reports_scope_missing"
  ) {
    return false;
  }
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

export type ShopifyWindowBackfillProgress = {
  /** Missing sales days, missing OrderFact days, or a truncated OrderFact crawl. */
  remainingWork: boolean;
  /** `complete` only when remaining work is gone; otherwise idle/running. */
  status: string;
  salesRemainingDays: number;
  orderRemainingDays: number;
  truncated: boolean;
};

/**
 * Enqueue/burst only when progress still has work, or status is not complete.
 * A sealed shop (no remaining days, not truncated) must not re-arm from a tab.
 */
export function shopifyWindowShouldEnqueue(
  progress: Pick<ShopifyWindowBackfillProgress, "remainingWork" | "status">,
): boolean {
  return progress.remainingWork || progress.status !== "complete";
}

/**
 * Read both ingest lanes. No IANA yet → remaining work so OAuth / first
 * session still kick. Sealed window → status complete.
 */
export async function getShopifyWindowBackfillProgress(
  shopId: string,
  now: Date = new Date(),
): Promise<ShopifyWindowBackfillProgress> {
  const shop = await prisma.shop.findUnique({
    where: { id: shopId },
    select: { ianaTimezone: true },
  });
  const tz = shop?.ianaTimezone?.trim() || null;
  if (!tz) {
    return {
      remainingWork: true,
      status: "idle",
      salesRemainingDays: 0,
      orderRemainingDays: 0,
      truncated: false,
    };
  }

  const [orderProgress, salesRemainingDays] = await Promise.all([
    getOrderBackfillProgress(shopId, { ianaTimezone: tz, now }),
    getSalesFactsWindowRemainingDays(shopId, { ianaTimezone: tz, now }),
  ]);

  const orderRemainingDays = orderProgress?.remainingDays ?? 0;
  const truncated = Boolean(orderProgress?.truncated);
  const remainingWork =
    salesRemainingDays > 0 || orderRemainingDays > 0 || truncated;

  return {
    remainingWork,
    status: remainingWork ? (orderProgress?.status ?? "idle") : "complete",
    salesRemainingDays,
    orderRemainingDays,
    truncated,
  };
}

export async function enqueueShopifyWindowBackfill(
  shopId: string,
): Promise<boolean> {
  const progress = await getShopifyWindowBackfillProgress(shopId);
  if (!shopifyWindowShouldEnqueue(progress)) {
    return false;
  }
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
  return true;
}

/**
 * Billing-aware policy. Host not charging counts as paid so local dev is
 * not forced onto the unpaid slice. Unknown billing-on shops stay unpaid.
 */
async function scheduleIngestPolicy(shopId: string) {
  const billingEnabled = isBillingEnabled();
  const isPro = billingEnabled ? await shopIsProForIngest(shopId) : false;
  return liveUnparkIngestPolicyFromEnv(process.env, {
    paid: shopMayIngestFullHistory({ billingEnabled, isPro }),
  });
}

/**
 * Fast: write resume jobs, then kick default-sized bursts without awaiting them.
 * Safe on OAuth and Overview — first paint stays on stored facts.
 * No-ops once the Shopify window is sealed.
 * Trial and paid do not pass a shorter window into the crawl.
 */
export async function scheduleFirstSessionShopifyWindow(
  admin: AdminApiContext,
  shopId: string,
): Promise<void> {
  const decision = liveShopifyWindowSchedule(await scheduleIngestPolicy(shopId));
  if (!decision.schedule) return;
  const enqueued = await enqueueShopifyWindowBackfill(shopId);
  if (!enqueued) return;
  // Trial and paid share the commercial window. Do not pass a shorter crawl.
  void runSalesFactsBackfill(admin, shopId).catch(() => {
    // Job tick resumes — never fail OAuth / first paint.
  });
  void runOrderFactsBackfill(admin, shopId).catch(() => {
    // Job tick resumes.
  });
}

/**
 * Order webhook delta: re-arm the shop-deduped OrderFact crawl after a day
 * seal is cleared so refunds/cancels do not wait for a Live tab.
 */
export async function enqueueOrderFactsWebhookDelta(
  shopId: string,
  payload: { reason: string; day: string },
): Promise<void> {
  await enqueueJob({
    shopId,
    type: BACKFILL_ORDER_FACTS_JOB,
    dedupeKey: shopId,
    payload,
    maxAttempts: SHOPIFY_WINDOW_BACKFILL_MAX_ATTEMPTS,
  });
}
