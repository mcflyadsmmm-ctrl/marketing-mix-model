import prisma from "../db.server";
import { unauthenticated } from "../shopify.server";
import {
  claimNextJob,
  completeJob,
  enqueueJob,
  failJob,
  getQueueDepth,
  reclaimStaleJobs,
  requeueIncompleteJob,
  type QueueDepth,
} from "./job-queue.server";
import {
  NonRetryableJobError,
  runJobWorkerTick,
  type ClaimedJob,
  type JobHandler,
  type JobWorkerTickResult,
} from "./job-worker";
import { RECONCILE_SALES_DAY_JOB, RECOMPUTE_COHORT_FACTS_JOB } from "./order-webhook";
import {
  reconcileSalesDayFact,
  refreshRecentSalesFromShopify,
} from "./sales-facts.server";
import {
  ORDER_FACT_SOURCE,
  orderFactDayCompleteMarkerId,
  recomputeCohortFacts,
  runOrderFactsBackfill,
} from "./order-facts.server";
import {
  BACKFILL_ORDER_FACTS_JOB,
  BACKFILL_SALES_DAY_FACTS_JOB,
  handleBackfillOrderFacts,
  handleBackfillSalesDayFacts,
} from "./job-worker.server";
import { listRecentClosedShopLocalDays } from "./shop-local-day";
import { purgeExpiredWebhookDeliveries } from "./webhook-delivery.server";
import { purgeExpiredComplianceDataExports } from "./compliance-export-retrieve.server";
import {
  RECOMPUTE_DESK_METRICS_JOB,
  recomputeDeskMetricSnapshot,
} from "./desk-metric-snapshot.server";

/**
 * Production wiring for the job worker: real Prisma claim/finalize plus handlers.
 * `job-worker.ts` owns the loop semantics; this module owns the IO.
 */

/** A claim held longer than this is presumed dead (worker crash / redeploy). */
export const JOB_LOCK_TTL_MS = 10 * 60_000;

/** How often a tick also sweeps expired webhook delivery keys. */
export const DELIVERY_SWEEP_INTERVAL_MS = 60 * 60_000;

/**
 * Last delivery-ledger sweep, so the sweep rides along with the tick roughly hourly
 * instead of on every one. Process-local: a redeploy just causes one extra sweep,
 * and the sweep is an idempotent bounded delete.
 */
let lastDeliverySweepAt = 0;

/** Same cadence for Level-1 ComplianceDataExport TTL (privacy: 60 days). */
let lastComplianceExportSweepAt = 0;

/** One nightly enqueue per process day. Jobs run in this app via /api/jobs/tick. */
let lastNightlyDeskMetricsAt = 0;
const NIGHTLY_DESK_METRICS_MS = 24 * 60 * 60 * 1000;

/** Shopify ask on the nightly job. The 24-month book is not re-pulled. */
export const NIGHTLY_SHOPIFY_REFRESH_DAYS = 7;

async function enqueueNightlyDeskMetrics(now: Date): Promise<void> {
  if (now.getUTCHours() < 8) return;
  if (now.getTime() - lastNightlyDeskMetricsAt < NIGHTLY_DESK_METRICS_MS) return;
  lastNightlyDeskMetricsAt = now.getTime();
  const dayKey = now.toISOString().slice(0, 10);
  const shops = await prisma.shop.findMany({ select: { id: true } });
  for (const shop of shops) {
    const dedupeKey = `nightly:${dayKey}`;
    const existing = await prisma.job.findUnique({
      where: {
        shopId_type_dedupeKey: {
          shopId: shop.id,
          type: RECOMPUTE_DESK_METRICS_JOB,
          dedupeKey,
        },
      },
      select: { id: true },
    });
    if (existing) continue;
    await enqueueJob({
      shopId: shop.id,
      type: RECOMPUTE_DESK_METRICS_JOB,
      dedupeKey,
      payload: { reason: "nightly" },
    });
  }
}

async function handleReconcileSalesDay(job: ClaimedJob): Promise<void> {
  const day = job.payload.day;
  if (typeof day !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(day)) {
    throw new NonRetryableJobError(
      `${RECONCILE_SALES_DAY_JOB} payload has no valid "day" (got ${JSON.stringify(day)})`,
    );
  }

  const shop = await prisma.shop.findUnique({
    where: { id: job.shopId },
    select: { domain: true },
  });
  if (!shop) {
    // Uninstall/redact removed the shop after the job was queued.
    throw new NonRetryableJobError(`Shop ${job.shopId} no longer exists`);
  }

  // Offline session token — a webhook-driven reconcile has no merchant request to
  // borrow auth from. Throws when the session is gone, so the job retries/dead-letters
  // instead of silently recording zero sales.
  const { admin } = await unauthenticated.admin(shop.domain);
  const result = await reconcileSalesDayFact(admin, job.shopId, day);

  console.log(
    `job ${RECONCILE_SALES_DAY_JOB} shopId=${job.shopId} day=${day} written=${result.written} skipped=${result.skippedReason ?? "none"}`,
  );
}

async function storedOrderBookMissing(shopId: string): Promise<boolean> {
  const [orderRow, salesRow] = await Promise.all([
    prisma.orderFact.findFirst({
      where: { shopId, source: ORDER_FACT_SOURCE },
      select: { id: true },
    }),
    prisma.salesDayFact.findFirst({
      where: { shopId },
      select: { id: true },
    }),
  ]);
  return orderRow == null && salesRow == null;
}

async function handleRecomputeDeskMetrics(job: ClaimedJob): Promise<void> {
  const shop = await prisma.shop.findUnique({
    where: { id: job.shopId },
    select: { id: true, domain: true, ianaTimezone: true },
  });
  if (!shop) {
    throw new NonRetryableJobError(`Shop ${job.shopId} no longer exists`);
  }
  if (await storedOrderBookMissing(shop.id)) {
    await enqueueJob({
      shopId: shop.id,
      type: BACKFILL_SALES_DAY_FACTS_JOB,
      dedupeKey: shop.id,
      payload: { reason: "book_missing" },
    });
    await enqueueJob({
      shopId: shop.id,
      type: BACKFILL_ORDER_FACTS_JOB,
      dedupeKey: shop.id,
      payload: { reason: "book_missing" },
    });
    console.log(
      `job ${RECOMPUTE_DESK_METRICS_JOB} shopId=${shop.id} full reload — stored book missing`,
    );
    return;
  }

  const { admin } = await unauthenticated.admin(shop.domain);
  const timeZone = shop.ianaTimezone?.trim() || "UTC";
  const recentDays = listRecentClosedShopLocalDays(
    timeZone,
    NIGHTLY_SHOPIFY_REFRESH_DAYS,
    new Date(),
  );
  if (recentDays.length > 0) {
    await prisma.orderFact.deleteMany({
      where: {
        shopId: shop.id,
        shopifyOrderId: {
          in: recentDays.map((day) => orderFactDayCompleteMarkerId(day)),
        },
      },
    });
  }
  await refreshRecentSalesFromShopify(
    admin,
    shop.id,
    NIGHTLY_SHOPIFY_REFRESH_DAYS,
  );
  await runOrderFactsBackfill(admin, shop.id, {
    windowDays: NIGHTLY_SHOPIFY_REFRESH_DAYS,
    maxDays: NIGHTLY_SHOPIFY_REFRESH_DAYS,
  });
  await recomputeCohortFacts(shop.id);
  await recomputeDeskMetricSnapshot(shop.id);
  console.log(
    `job ${RECOMPUTE_DESK_METRICS_JOB} shopId=${shop.id} shopifyDays=${NIGHTLY_SHOPIFY_REFRESH_DAYS}`,
  );
}

async function handleRecomputeCohortFacts(job: ClaimedJob): Promise<void> {
  const shop = await prisma.shop.findUnique({
    where: { id: job.shopId },
    select: { id: true },
  });
  if (!shop) {
    throw new NonRetryableJobError(`Shop ${job.shopId} no longer exists`);
  }
  await recomputeCohortFacts(job.shopId);
  console.log(`job ${RECOMPUTE_COHORT_FACTS_JOB} shopId=${job.shopId} ok`);
}

export const JOB_HANDLERS: Record<string, JobHandler> = {
  [RECONCILE_SALES_DAY_JOB]: handleReconcileSalesDay,
  [RECOMPUTE_COHORT_FACTS_JOB]: handleRecomputeCohortFacts,
  [RECOMPUTE_DESK_METRICS_JOB]: handleRecomputeDeskMetrics,
  [BACKFILL_ORDER_FACTS_JOB]: handleBackfillOrderFacts,
  [BACKFILL_SALES_DAY_FACTS_JOB]: handleBackfillSalesDayFacts,
};

export interface QueueTickResult extends JobWorkerTickResult {
  /** Jobs released from a dead worker's lock before draining. */
  reclaimed: number;
  /** Expired delivery keys swept this tick (0 on ticks that skip the sweep). */
  deliveriesPurged: number;
  /** Expired Level-1 ComplianceDataExport rows swept this tick (0 if skipped). */
  complianceExportsPurged: number;
  depth: QueueDepth;
}

/** Sweep expired delivery keys at most hourly; never fail a tick over it. */
async function sweepDeliveryLedger(now: Date): Promise<number> {
  if (now.getTime() - lastDeliverySweepAt < DELIVERY_SWEEP_INTERVAL_MS) return 0;
  lastDeliverySweepAt = now.getTime();
  try {
    return await purgeExpiredWebhookDeliveries(now);
  } catch (error) {
    console.error(
      `[queue] delivery ledger sweep failed: ${error instanceof Error ? error.message : String(error)}`,
    );
    return 0;
  }
}

/** Sweep expired Level-1 data_request packages at most hourly (privacy TTL). */
async function sweepComplianceExports(now: Date): Promise<number> {
  if (now.getTime() - lastComplianceExportSweepAt < DELIVERY_SWEEP_INTERVAL_MS) {
    return 0;
  }
  lastComplianceExportSweepAt = now.getTime();
  try {
    return await purgeExpiredComplianceDataExports(now);
  } catch (error) {
    console.error(
      `[queue] compliance export sweep failed: ${error instanceof Error ? error.message : String(error)}`,
    );
    return 0;
  }
}

/**
 * Run one worker tick: release expired locks, then drain up to `maxJobs`.
 * Safe to call concurrently — claiming is atomic and per-shop concurrency is 1.
 */
export async function runQueueTick(
  options: { workerId?: string; maxJobs?: number; now?: Date } = {},
): Promise<QueueTickResult> {
  const now = options.now ?? new Date();
  const workerId =
    options.workerId ?? `tick-${now.toISOString()}-${Math.random().toString(36).slice(2, 8)}`;

  const reclaimed = await reclaimStaleJobs(
    new Date(now.getTime() - JOB_LOCK_TTL_MS),
    now,
  );
  const deliveriesPurged = await sweepDeliveryLedger(now);
  const complianceExportsPurged = await sweepComplianceExports(now);
  try {
    await enqueueNightlyDeskMetrics(now);
  } catch (error) {
    console.error(
      `[queue] nightly desk metrics enqueue failed: ${error instanceof Error ? error.message : String(error)}`,
    );
  }

  const tick = await runJobWorkerTick(
    workerId,
    {
      claim: (id) => claimNextJob(id),
      complete: (job, id) => completeJob(job, id),
      fail: (job, id, error, failOptions) => failJob(job, id, error, failOptions),
      requeue: (job, id) => requeueIncompleteJob(job, id),
      handlers: JOB_HANDLERS,
      log: (message) => console.log(`[queue] ${message}`),
    },
    { maxJobs: options.maxJobs },
  );

  const depth = await getQueueDepth();
  return { ...tick, reclaimed, deliveriesPurged, complianceExportsPurged, depth };
}
