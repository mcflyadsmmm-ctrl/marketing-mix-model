import { beforeEach, describe, expect, it, vi } from "vitest";

const { findUnique, upsert, updateMany, count, queryRaw } = vi.hoisted(() => ({
  findUnique: vi.fn(),
  upsert: vi.fn(),
  updateMany: vi.fn(),
  count: vi.fn(),
  queryRaw: vi.fn(),
}));

vi.mock("../db.server", () => ({
  default: {
    job: {
      findUnique: (...args: unknown[]) => findUnique(...args),
      upsert: (...args: unknown[]) => upsert(...args),
      updateMany: (...args: unknown[]) => updateMany(...args),
      count: (...args: unknown[]) => count(...args),
    },
    $queryRaw: (...args: unknown[]) => queryRaw(...args),
  },
}));

import {
  backoffDelayMs,
  claimNextJob,
  completeJob,
  enqueueJob,
  failJob,
  reclaimStaleJobs,
} from "./job-queue.server";
import type { ClaimedJob } from "./job-worker";

const NOW = new Date("2026-07-28T12:00:00.000Z");

function claimed(overrides: Partial<ClaimedJob> = {}): ClaimedJob {
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

describe("enqueueJob", () => {
  beforeEach(() => {
    findUnique.mockReset();
    findUnique.mockResolvedValue(null);
    upsert.mockReset();
    upsert.mockResolvedValue({ id: "job_1", dedupeKey: "2026-07-27" });
  });

  it("coalesces on (shopId, type, dedupeKey) so a burst of webhooks is one job", async () => {
    await enqueueJob(
      {
        shopId: "shop_1",
        type: "reconcile_sales_day",
        dedupeKey: "2026-07-27",
        payload: { day: "2026-07-27", reason: "ORDERS_CREATE" },
      },
      NOW,
    );

    const call = upsert.mock.calls[0][0];
    expect(call.where.shopId_type_dedupeKey).toEqual({
      shopId: "shop_1",
      type: "reconcile_sales_day",
      dedupeKey: "2026-07-27",
    });
  });

  it("re-arms an existing row to pending and clears the worker lock", async () => {
    findUnique.mockResolvedValue({
      id: "job_1",
      dedupeKey: "2026-07-27",
      status: "running",
    });
    await enqueueJob(
      {
        shopId: "shop_1",
        type: "reconcile_sales_day",
        dedupeKey: "2026-07-27",
        payload: { day: "2026-07-27", reason: "ORDERS_UPDATED" },
      },
      NOW,
    );

    const update = upsert.mock.calls[0][0].update;
    expect(update.status).toBe("pending");
    // Re-arm must NOT reset attempts — hot days would otherwise never dead-letter.
    expect(update.attempts).toBeUndefined();
    // Clearing the lock is what makes the in-flight worker's completeJob miss, so
    // the newly dirtied day is guaranteed another pass.
    expect(update.lockedBy).toBeNull();
    expect(update.lockedAt).toBeNull();
    expect(update.lastError).toBeNull();
    expect(update.finishedAt).toBeNull();
  });

  it("resets attempts when resurrecting a dead letter (bounded retry, not soft-infinite)", async () => {
    findUnique.mockResolvedValue({
      id: "job_1",
      dedupeKey: "2026-07-27",
      status: "dead",
    });
    await enqueueJob(
      {
        shopId: "shop_1",
        type: "reconcile_sales_day",
        dedupeKey: "2026-07-27",
        payload: { day: "2026-07-27", reason: "ORDERS_UPDATED" },
      },
      NOW,
    );
    const update = upsert.mock.calls[0][0].update;
    expect(update.status).toBe("pending");
    expect(update.attempts).toBe(0);
  });

  it("keeps runAfter at now so continuous order flow cannot starve the job", async () => {
    await enqueueJob(
      {
        shopId: "shop_1",
        type: "reconcile_sales_day",
        dedupeKey: "2026-07-27",
        payload: {},
      },
      NOW,
    );

    expect(upsert.mock.calls[0][0].create.runAfter).toEqual(NOW);
    expect(upsert.mock.calls[0][0].update.runAfter).toEqual(NOW);
  });

  it("enqueuing the same day repeatedly always targets the one row", async () => {
    for (const reason of ["ORDERS_CREATE", "ORDERS_UPDATED", "ORDERS_CANCELLED"]) {
      await enqueueJob(
        {
          shopId: "shop_1",
          type: "reconcile_sales_day",
          dedupeKey: "2026-07-27",
          payload: { day: "2026-07-27", reason },
        },
        NOW,
      );
    }

    expect(upsert).toHaveBeenCalledTimes(3);
    const keys = upsert.mock.calls.map((c) => c[0].where.shopId_type_dedupeKey);
    expect(new Set(keys.map((k) => JSON.stringify(k))).size).toBe(1);
  });
});

describe("claimNextJob", () => {
  beforeEach(() => {
    queryRaw.mockReset();
  });

  it("returns null when nothing is runnable", async () => {
    queryRaw.mockResolvedValue([]);
    expect(await claimNextJob("worker_a", NOW)).toBeNull();
  });

  it("returns the claimed job with the lock it now holds", async () => {
    queryRaw.mockResolvedValue([
      {
        id: "job_1",
        type: "reconcile_sales_day",
        shopId: "shop_1",
        dedupeKey: "2026-07-27",
        payload: { day: "2026-07-27" },
        attempts: 1,
        maxAttempts: 5,
      },
    ]);

    const job = await claimNextJob("worker_a", NOW);

    expect(job).toMatchObject({
      id: "job_1",
      shopId: "shop_1",
      dedupeKey: "2026-07-27",
      attempts: 1,
      lockedBy: "worker_a",
    });
  });

  it("gates on per-shop concurrency and uses SKIP LOCKED", async () => {
    queryRaw.mockResolvedValue([]);
    await claimNextJob("worker_a", NOW);

    const sql = queryRaw.mock.calls[0][0].join("?");
    expect(sql).toContain("SKIP LOCKED");
    expect(sql).toContain("NOT EXISTS");
    // The concurrency-1 gate: skip any shop that already has a running job.
    expect(sql).toContain(`running."shopId" = c."shopId"`);
  });

  it("tolerates a null payload rather than handing the worker undefined", async () => {
    queryRaw.mockResolvedValue([
      {
        id: "job_1",
        type: "reconcile_sales_day",
        shopId: "shop_1",
        dedupeKey: "2026-07-27",
        payload: null,
        attempts: 1,
        maxAttempts: 5,
      },
    ]);

    const job = await claimNextJob("worker_a", NOW);
    expect(job?.payload).toEqual({});
  });
});

describe("completeJob", () => {
  beforeEach(() => {
    updateMany.mockReset();
  });

  it("marks succeeded only while the lock is still ours", async () => {
    updateMany.mockResolvedValue({ count: 1 });

    const applied = await completeJob(claimed(), "worker_a", NOW);

    expect(applied).toBe(true);
    expect(updateMany.mock.calls[0][0].where).toEqual({
      id: "job_1",
      lockedBy: "worker_a",
      status: "running",
    });
    expect(updateMany.mock.calls[0][0].data.status).toBe("succeeded");
  });

  it("reports not-applied when a newer webhook re-armed the job mid-flight", async () => {
    // enqueueJob cleared lockedBy, so the conditional update matches nothing and the
    // job correctly stays pending instead of being marked done with stale results.
    updateMany.mockResolvedValue({ count: 0 });

    expect(await completeJob(claimed(), "worker_a", NOW)).toBe(false);
  });
});

describe("failJob", () => {
  beforeEach(() => {
    updateMany.mockReset();
    updateMany.mockResolvedValue({ count: 1 });
  });

  it("returns a retryable failure to pending with backoff", async () => {
    const result = await failJob(
      claimed({ attempts: 2 }),
      "worker_a",
      new Error("Shopify 429"),
      { now: NOW },
    );

    expect(result.status).toBe("pending");
    const data = updateMany.mock.calls[0][0].data;
    expect(data.status).toBe("pending");
    expect(data.runAfter.getTime()).toBe(NOW.getTime() + backoffDelayMs(2));
    expect(data.finishedAt).toBeNull();
    expect(data.lastError).toContain("Shopify 429");
  });

  it("dead-letters once attempts reach maxAttempts", async () => {
    const result = await failJob(
      claimed({ attempts: 5, maxAttempts: 5 }),
      "worker_a",
      new Error("still failing"),
      { now: NOW },
    );

    expect(result.status).toBe("dead");
    expect(updateMany.mock.calls[0][0].data.finishedAt).toEqual(NOW);
  });

  it("marks non-retryable failures failed without burning the backoff ladder", async () => {
    const result = await failJob(
      claimed({ attempts: 1 }),
      "worker_a",
      new Error("payload missing day"),
      { retryable: false, now: NOW },
    );

    expect(result.status).toBe("failed");
    expect(updateMany.mock.calls[0][0].data.runAfter).toBeUndefined();
  });

  it("truncates the stored error so a huge provider body cannot become the row", async () => {
    await failJob(claimed(), "worker_a", new Error("x".repeat(5000)), { now: NOW });
    expect(updateMany.mock.calls[0][0].data.lastError.length).toBe(1000);
  });

  it("does not apply when the lock was taken away", async () => {
    updateMany.mockResolvedValue({ count: 0 });
    const result = await failJob(claimed(), "worker_a", new Error("boom"), { now: NOW });
    expect(result.applied).toBe(false);
  });
});

describe("backoffDelayMs", () => {
  it("grows exponentially and caps at 30 minutes", () => {
    expect(backoffDelayMs(1)).toBe(30_000);
    expect(backoffDelayMs(2)).toBe(60_000);
    expect(backoffDelayMs(3)).toBe(120_000);
    expect(backoffDelayMs(20)).toBe(30 * 60_000);
  });

  it("never returns a non-positive delay for a zero/negative attempt count", () => {
    expect(backoffDelayMs(0)).toBeGreaterThan(0);
    expect(backoffDelayMs(-3)).toBeGreaterThan(0);
  });
});

describe("reclaimStaleJobs", () => {
  beforeEach(() => {
    updateMany.mockReset();
    updateMany.mockResolvedValue({ count: 2 });
  });

  it("frees jobs whose worker died so the shop is not blocked forever", async () => {
    const staleBefore = new Date(NOW.getTime() - 600_000);

    const count = await reclaimStaleJobs(staleBefore, NOW);

    expect(count).toBe(2);
    expect(updateMany.mock.calls[0][0].where).toEqual({
      status: "running",
      lockedAt: { lt: staleBefore },
    });
    expect(updateMany.mock.calls[0][0].data).toMatchObject({
      status: "pending",
      lockedBy: null,
      runAfter: NOW,
    });
  });
});
