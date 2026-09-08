import { describe, expect, it, vi } from "vitest";
import {
  NonRetryableJobError,
  runJobWorkerTick,
  type ClaimedJob,
  type JobWorkerDeps,
} from "./job-worker";

function job(overrides: Partial<ClaimedJob> = {}): ClaimedJob {
  return {
    id: "job_1",
    type: "reconcile_sales_day",
    shopId: "shop_1",
    dedupeKey: "2026-07-27",
    payload: { day: "2026-07-27" },
    attempts: 1,
    maxAttempts: 5,
    lockedBy: "worker_a",
    ...overrides,
  };
}

/** Deps that hand out `queue` in order, then run dry. */
function deps(
  queue: ClaimedJob[],
  handlers: JobWorkerDeps["handlers"] = {},
  overrides: Partial<JobWorkerDeps> = {},
): JobWorkerDeps {
  const remaining = [...queue];
  return {
    claim: vi.fn(async () => remaining.shift() ?? null),
    complete: vi.fn(async () => true),
    fail: vi.fn(async () => undefined),
    handlers,
    ...overrides,
  };
}

describe("runJobWorkerTick", () => {
  it("returns immediately when the queue is empty", async () => {
    const d = deps([]);

    const result = await runJobWorkerTick("worker_a", d);

    expect(result.claimed).toBe(0);
    expect(result.succeeded).toBe(0);
    expect(d.claim).toHaveBeenCalledTimes(1);
  });

  it("dispatches by type and marks the job succeeded", async () => {
    const handler = vi.fn(async () => undefined);
    const d = deps([job()], { reconcile_sales_day: handler });

    const result = await runJobWorkerTick("worker_a", d);

    expect(handler).toHaveBeenCalledWith(expect.objectContaining({ id: "job_1" }));
    expect(result).toMatchObject({ claimed: 1, succeeded: 1, failed: 0, superseded: 0 });
    expect(d.complete).toHaveBeenCalledWith(expect.objectContaining({ id: "job_1" }), "worker_a");
  });

  it("drains until the queue is empty", async () => {
    const handler = vi.fn(async () => undefined);
    const d = deps(
      [job({ id: "a", dedupeKey: "2026-07-25" }), job({ id: "b", dedupeKey: "2026-07-26" })],
      { reconcile_sales_day: handler },
    );

    const result = await runJobWorkerTick("worker_a", d);

    expect(result.claimed).toBe(2);
    expect(result.succeeded).toBe(2);
    expect(handler).toHaveBeenCalledTimes(2);
  });

  it("stops at maxJobs so a tick always terminates under a hot queue", async () => {
    const handler = vi.fn(async () => undefined);
    const endless: JobWorkerDeps = {
      claim: vi.fn(async () => job()),
      complete: vi.fn(async () => true),
      fail: vi.fn(async () => undefined),
      handlers: { reconcile_sales_day: handler },
    };

    const result = await runJobWorkerTick("worker_a", endless, { maxJobs: 3 });

    expect(result.claimed).toBe(3);
    expect(handler).toHaveBeenCalledTimes(3);
  });

  it("does not let a thrown handler kill the tick — later jobs still run", async () => {
    const handler = vi
      .fn()
      .mockRejectedValueOnce(new Error("Shopify 429"))
      .mockResolvedValueOnce(undefined);
    const d = deps([job({ id: "a" }), job({ id: "b", dedupeKey: "2026-07-26" })], {
      reconcile_sales_day: handler,
    });

    const result = await runJobWorkerTick("worker_a", d);

    expect(result).toMatchObject({ claimed: 2, succeeded: 1, failed: 1 });
    expect(d.fail).toHaveBeenCalledTimes(1);
    expect(d.complete).toHaveBeenCalledTimes(1);
  });

  it("requeues an ordinary handler failure as retryable", async () => {
    const d = deps([job()], {
      reconcile_sales_day: vi.fn(async () => {
        throw new Error("Shopify GraphQL timeout");
      }),
    });

    await runJobWorkerTick("worker_a", d);

    expect(d.fail).toHaveBeenCalledWith(
      expect.objectContaining({ id: "job_1" }),
      "worker_a",
      expect.any(Error),
      { retryable: true },
    );
  });

  it("dead-letters a NonRetryableJobError instead of burning the backoff ladder", async () => {
    const d = deps([job()], {
      reconcile_sales_day: vi.fn(async () => {
        throw new NonRetryableJobError("payload has no valid day");
      }),
    });

    await runJobWorkerTick("worker_a", d);

    expect(d.fail).toHaveBeenCalledWith(
      expect.objectContaining({ id: "job_1" }),
      "worker_a",
      expect.any(NonRetryableJobError),
      { retryable: false },
    );
    expect(d.complete).not.toHaveBeenCalled();
  });

  it("dead-letters an unknown job type without retrying it forever", async () => {
    const d = deps([job({ type: "mystery_job" })], {});

    const result = await runJobWorkerTick("worker_a", d);

    expect(result.unhandled).toEqual(["mystery_job"]);
    expect(result.failed).toBe(1);
    expect(d.fail).toHaveBeenCalledWith(
      expect.objectContaining({ type: "mystery_job" }),
      "worker_a",
      expect.any(Error),
      { retryable: false },
    );
  });

  it("counts a job as superseded (not succeeded) when a newer enqueue took the lock", async () => {
    const d = deps([job()], { reconcile_sales_day: vi.fn(async () => undefined) }, {
      complete: vi.fn(async () => false),
    });

    const result = await runJobWorkerTick("worker_a", d);

    // The re-armed job must stay queued — reporting it succeeded would strand a
    // stale SalesDayFact for that day.
    expect(result.superseded).toBe(1);
    expect(result.succeeded).toBe(0);
    expect(result.failed).toBe(0);
  });

  it("propagates a claim-path failure — an unreachable queue is not a job error", async () => {
    const d = deps([], {}, {
      claim: vi.fn(async () => {
        throw new Error("database unreachable");
      }),
    });

    await expect(runJobWorkerTick("worker_a", d)).rejects.toThrow("database unreachable");
  });

  it("claims with the worker id it was given", async () => {
    const d = deps([]);
    await runJobWorkerTick("worker_xyz", d);
    expect(d.claim).toHaveBeenCalledWith("worker_xyz");
  });
});
