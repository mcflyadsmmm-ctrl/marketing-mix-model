import type { Prisma } from "@prisma/client";
import prisma from "../db.server";
import type { ClaimedJob } from "./job-worker";

/**
 * Postgres-backed job queue — no Redis, no SQS.
 *
 * Two invariants make this safe to drive from webhooks:
 *
 * 1. **Enqueue is coalescing.** `@@unique([shopId, type, dedupeKey])` means N
 *    webhooks for the same shop-local day re-arm ONE row instead of creating N
 *    duplicate reconciles.
 * 2. **Per-shop concurrency is 1.** The claim statement refuses to hand out a job
 *    for a shop that already has one running, so a busy shop can never run its own
 *    day-reconciles concurrently (which would race on the SalesDayFact upsert) and
 *    can never monopolise the pool.
 */

/** Retry backoff, capped. attempts is the count AFTER the failed attempt. */
export function backoffDelayMs(attempts: number): number {
  const step = Math.max(1, attempts);
  return Math.min(30 * 60_000, 30_000 * 2 ** (step - 1));
}

export interface EnqueueJobInput {
  shopId: string;
  type: string;
  /** Coalescing key within (shopId, type) — e.g. the shop-local day "2026-07-27". */
  dedupeKey: string;
  payload: Prisma.InputJsonValue;
  maxAttempts?: number;
}

export interface EnqueueJobResult {
  jobId: string;
  dedupeKey: string;
}

/**
 * Create or re-arm the job for this unit of work.
 *
 * Re-arming clears `lockedBy`. That is the mechanism that keeps a job that was
 * re-dirtied mid-flight from being marked succeeded by the worker still processing
 * the stale version: `completeJob` only matches on the lock it was given, so it
 * finds no row and the re-armed job stays `pending` for another pass.
 *
 * Terminal `dead` / `failed` rows get a **fresh attempt budget** when dirtied again
 * (refund after dead-letter). Soft-infinite retry without reset is refuse.
 *
 * `runAfter` is always "now" — a debounce window would risk starving a job under
 * continuous order flow, and coalescing already collapses bursts.
 */
export async function enqueueJob(
  input: EnqueueJobInput,
  now: Date = new Date(),
): Promise<EnqueueJobResult> {
  const existing = await prisma.job.findUnique({
    where: {
      shopId_type_dedupeKey: {
        shopId: input.shopId,
        type: input.type,
        dedupeKey: input.dedupeKey,
      },
    },
    select: { id: true, dedupeKey: true, status: true },
  });

  const reviveTerminal =
    existing != null &&
    (existing.status === "dead" || existing.status === "failed");

  const job = await prisma.job.upsert({
    where: {
      shopId_type_dedupeKey: {
        shopId: input.shopId,
        type: input.type,
        dedupeKey: input.dedupeKey,
      },
    },
    create: {
      shopId: input.shopId,
      type: input.type,
      dedupeKey: input.dedupeKey,
      payload: input.payload,
      status: "pending",
      runAfter: now,
      ...(input.maxAttempts == null ? {} : { maxAttempts: input.maxAttempts }),
    },
    update: {
      payload: input.payload,
      status: "pending",
      runAfter: now,
      // Keep attempts on hot re-arm; reset only when resurrecting a terminal row.
      ...(reviveTerminal ? { attempts: 0 } : {}),
      lockedBy: null,
      lockedAt: null,
      finishedAt: null,
      lastError: null,
    },
    select: { id: true, dedupeKey: true },
  });
  return { jobId: job.id, dedupeKey: job.dedupeKey };
}

interface ClaimRow {
  id: string;
  type: string;
  shopId: string;
  dedupeKey: string;
  payload: unknown;
  attempts: number;
  maxAttempts: number;
}

/**
 * Atomically claim the next runnable job.
 *
 * `FOR UPDATE SKIP LOCKED` lets several workers scan the same queue without
 * blocking each other; the `NOT EXISTS ... status = 'running'` clause is the
 * per-shop concurrency-1 gate.
 */
export async function claimNextJob(
  workerId: string,
  now: Date = new Date(),
): Promise<ClaimedJob | null> {
  const rows = await prisma.$queryRaw<ClaimRow[]>`
    UPDATE "Job" AS j
    SET status = 'running'::"JobStatus",
        "lockedBy" = ${workerId},
        "lockedAt" = ${now},
        "updatedAt" = ${now},
        attempts = j.attempts + 1
    WHERE j.id = (
      SELECT c.id
      FROM "Job" c
      WHERE c.status = 'pending'::"JobStatus"
        AND c."runAfter" <= ${now}
        AND NOT EXISTS (
          SELECT 1
          FROM "Job" running
          WHERE running."shopId" = c."shopId"
            AND running.status = 'running'::"JobStatus"
        )
      ORDER BY c."runAfter" ASC, c."createdAt" ASC
      FOR UPDATE SKIP LOCKED
      LIMIT 1
    )
    RETURNING j.id, j.type, j."shopId", j."dedupeKey", j.payload, j.attempts, j."maxAttempts"
  `;

  const row = rows[0];
  if (!row) return null;
  return {
    id: row.id,
    type: row.type,
    shopId: row.shopId,
    dedupeKey: row.dedupeKey,
    payload: (row.payload ?? {}) as Record<string, unknown>,
    attempts: Number(row.attempts),
    maxAttempts: Number(row.maxAttempts),
    lockedBy: workerId,
  };
}

/**
 * Mark a claimed job succeeded. Returns false when the lock no longer matches —
 * meaning a fresh webhook re-armed the job while we were working, so the newer
 * state must win and the job stays queued.
 */
export async function completeJob(
  job: ClaimedJob,
  workerId: string,
  now: Date = new Date(),
): Promise<boolean> {
  const result = await prisma.job.updateMany({
    where: { id: job.id, lockedBy: workerId, status: "running" },
    data: {
      status: "succeeded",
      finishedAt: now,
      lastError: null,
      lockedBy: null,
      lockedAt: null,
    },
  });
  return result.count === 1;
}

export interface FailJobOptions {
  /** False for errors retrying cannot fix (unknown job type, malformed payload). */
  retryable?: boolean;
  now?: Date;
}

export interface FailJobResult {
  applied: boolean;
  /** Terminal state written: pending (will retry), dead (attempts exhausted), failed. */
  status: "pending" | "dead" | "failed";
}

/** Truncated so a giant provider error body never becomes the row. */
function errorMessage(error: unknown): string {
  const raw = error instanceof Error ? error.message : String(error);
  return raw.slice(0, 1000);
}

/**
 * Record a failed attempt. Retryable failures go back to `pending` with backoff
 * until `maxAttempts`, then dead-letter for operator attention.
 */
export async function failJob(
  job: ClaimedJob,
  workerId: string,
  error: unknown,
  options: FailJobOptions = {},
): Promise<FailJobResult> {
  const now = options.now ?? new Date();
  const retryable = options.retryable !== false;
  const exhausted = job.attempts >= job.maxAttempts;
  const status: FailJobResult["status"] = !retryable
    ? "failed"
    : exhausted
      ? "dead"
      : "pending";

  const result = await prisma.job.updateMany({
    where: { id: job.id, lockedBy: workerId, status: "running" },
    data: {
      status,
      lastError: errorMessage(error),
      lockedBy: null,
      lockedAt: null,
      runAfter:
        status === "pending"
          ? new Date(now.getTime() + backoffDelayMs(job.attempts))
          : undefined,
      finishedAt: status === "pending" ? null : now,
    },
  });

  return { applied: result.count === 1, status };
}

export interface QueueDepth {
  pending: number;
  running: number;
  dead: number;
}

/** Queue depth for ops/health reporting. */
export async function getQueueDepth(): Promise<QueueDepth> {
  const [pending, running, dead] = await Promise.all([
    prisma.job.count({ where: { status: "pending" } }),
    prisma.job.count({ where: { status: "running" } }),
    prisma.job.count({ where: { status: "dead" } }),
  ]);
  return { pending, running, dead };
}

/**
 * Release jobs whose worker died mid-flight (claimed before `staleBefore` and never
 * finalized), so they are not stuck `running` forever — and, because per-shop
 * concurrency keys off `running`, so they do not block the rest of that shop.
 */
export async function reclaimStaleJobs(
  staleBefore: Date,
  now: Date = new Date(),
): Promise<number> {
  const result = await prisma.job.updateMany({
    where: { status: "running", lockedAt: { lt: staleBefore } },
    data: {
      status: "pending",
      lockedBy: null,
      lockedAt: null,
      runAfter: now,
      lastError: "Reclaimed after worker lock expired",
    },
  });
  return result.count;
}
