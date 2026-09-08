/**
 * Job worker orchestration — claim, dispatch, finalize.
 *
 * Deliberately free of Prisma and Shopify imports: all IO arrives via `JobWorkerDeps`
 * so the loop's retry/dead-letter behaviour is unit-testable, and so the same loop can
 * be driven from an HTTP tick, a cron process, or a long-lived worker.
 */

export interface ClaimedJob {
  id: string;
  type: string;
  shopId: string;
  dedupeKey: string;
  payload: Record<string, unknown>;
  /** Attempt count INCLUDING the current one (claim increments it). */
  attempts: number;
  maxAttempts: number;
  lockedBy: string;
}

export type JobHandler = (job: ClaimedJob) => Promise<void>;

/**
 * Thrown by a handler for a failure retrying cannot fix (malformed payload, shop
 * gone). Dead-letters immediately instead of burning the backoff ladder.
 */
export class NonRetryableJobError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NonRetryableJobError";
  }
}

export interface JobWorkerDeps {
  /** Atomically claim the next runnable job, honouring per-shop concurrency 1. */
  claim: (workerId: string) => Promise<ClaimedJob | null>;
  complete: (job: ClaimedJob, workerId: string) => Promise<boolean>;
  fail: (
    job: ClaimedJob,
    workerId: string,
    error: unknown,
    options?: { retryable?: boolean },
  ) => Promise<unknown>;
  handlers: Record<string, JobHandler>;
  log?: (message: string) => void;
}

export interface JobWorkerTickOptions {
  /** Upper bound on jobs processed per tick, so a tick always terminates. */
  maxJobs?: number;
}

export interface JobWorkerTickResult {
  workerId: string;
  claimed: number;
  succeeded: number;
  /** Handler threw; job was returned to the queue with backoff or dead-lettered. */
  failed: number;
  /** Handler succeeded but the job had been re-armed by a newer webhook. */
  superseded: number;
  /** Claimed jobs whose `type` has no registered handler (dead-lettered, no retry). */
  unhandled: string[];
}

export const DEFAULT_MAX_JOBS_PER_TICK = 25;

/**
 * Drain up to `maxJobs` jobs, then return. Never throws for a handler failure — a
 * bad job must not take down the tick — but a claim-path failure does propagate,
 * since that means the queue itself is unreachable.
 */
export async function runJobWorkerTick(
  workerId: string,
  deps: JobWorkerDeps,
  options: JobWorkerTickOptions = {},
): Promise<JobWorkerTickResult> {
  const maxJobs = options.maxJobs ?? DEFAULT_MAX_JOBS_PER_TICK;
  const log = deps.log ?? (() => {});

  const result: JobWorkerTickResult = {
    workerId,
    claimed: 0,
    succeeded: 0,
    failed: 0,
    superseded: 0,
    unhandled: [],
  };

  for (let processed = 0; processed < maxJobs; processed += 1) {
    const job = await deps.claim(workerId);
    if (!job) break;
    result.claimed += 1;

    const handler = deps.handlers[job.type];
    if (!handler) {
      result.unhandled.push(job.type);
      result.failed += 1;
      log(`job type=${job.type} id=${job.id} unhandled — dead-lettered`);
      await deps.fail(
        job,
        workerId,
        new Error(`No handler registered for job type "${job.type}"`),
        { retryable: false },
      );
      continue;
    }

    try {
      await handler(job);
    } catch (error) {
      result.failed += 1;
      log(
        `job type=${job.type} id=${job.id} shopId=${job.shopId} attempt=${job.attempts}/${job.maxAttempts} failed: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      await deps.fail(job, workerId, error, {
        retryable: !(error instanceof NonRetryableJobError),
      });
      continue;
    }

    const applied = await deps.complete(job, workerId);
    if (applied) {
      result.succeeded += 1;
    } else {
      // Lock no longer ours: a newer webhook re-armed this job while it ran. The
      // newer state wins and the job stays queued for the next pass.
      result.superseded += 1;
      log(`job type=${job.type} id=${job.id} superseded by a newer enqueue`);
    }
  }

  return result;
}
