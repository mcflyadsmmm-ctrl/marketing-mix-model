import prisma from "../db.server";
import { unauthenticated } from "../shopify.server";
import {
  claimNextJob,
  completeJob,
  failJob,
  getQueueDepth,
  reclaimStaleJobs,
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
import { reconcileSalesDayFact } from "./sales-facts.server";
import { recomputeCohortFacts } from "./order-facts.server";
import { purgeExpiredWebhookDeliveries } from "./webhook-delivery.server";
import { purgeExpiredComplianceDataExports } from "./compliance-export-retrieve.server";

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

  const tick = await runJobWorkerTick(
    workerId,
    {
      claim: (id) => claimNextJob(id),
      complete: (job, id) => completeJob(job, id),
      fail: (job, id, error, failOptions) => failJob(job, id, error, failOptions),
      handlers: JOB_HANDLERS,
      log: (message) => console.log(`[queue] ${message}`),
    },
    { maxJobs: options.maxJobs },
  );

  const depth = await getQueueDepth();
  return { ...tick, reclaimed, deliveriesPurged, complianceExportsPurged, depth };
}
