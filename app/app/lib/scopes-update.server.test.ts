import { beforeEach, describe, expect, it, vi } from "vitest";

const findUnique = vi.fn();
const updateMany = vi.fn();
const enqueueJob = vi.fn();

vi.mock("../db.server", () => ({
  default: {
    shop: { findUnique: (...args: unknown[]) => findUnique(...args) },
    orderBackfillState: {
      updateMany: (...args: unknown[]) => updateMany(...args),
    },
  },
}));

vi.mock("./job-queue.server", () => ({
  enqueueJob: (...args: unknown[]) => enqueueJob(...args),
}));

import {
  applyReadAllOrdersGrant,
  DEEP_HISTORY_BACKFILL_DEDUPE_KEY,
  DEEP_HISTORY_BACKFILL_JOB,
  readScopesUpdateLists,
} from "./scopes-update.server";

describe("readScopesUpdateLists", () => {
  it("reads previous + current string arrays", () => {
    expect(
      readScopesUpdateLists({
        previous: ["read_orders", "read_customers"],
        current: ["read_orders", "read_customers", "read_all_orders"],
      }),
    ).toEqual({
      previous: ["read_orders", "read_customers"],
      current: ["read_orders", "read_customers", "read_all_orders"],
    });
  });

  it("fail-closes on missing or non-array payload fields", () => {
    expect(readScopesUpdateLists(null)).toEqual({ previous: [], current: [] });
    expect(readScopesUpdateLists({ current: "read_all_orders" })).toEqual({
      previous: [],
      current: [],
    });
  });
});

describe("applyReadAllOrdersGrant", () => {
  beforeEach(() => {
    findUnique.mockReset();
    updateMany.mockReset();
    enqueueJob.mockReset();
  });

  it("no-ops when current scopes omit read_all_orders", async () => {
    const result = await applyReadAllOrdersGrant({
      shopDomain: "acme.myshopify.com",
      current: ["read_orders", "read_customers"],
      previous: ["read_orders"],
    });
    expect(result).toEqual({
      shopId: null,
      hasReadAllOrders: false,
      gainedReadAllOrders: false,
      clearedHistoryLimited: false,
      enqueued: false,
    });
    expect(findUnique).not.toHaveBeenCalled();
    expect(enqueueJob).not.toHaveBeenCalled();
  });

  it("clears stuck historyLimited and enqueues a coalesced deep backfill", async () => {
    findUnique.mockResolvedValue({ id: "shop_1" });
    updateMany.mockResolvedValue({ count: 1 });
    enqueueJob.mockResolvedValue({ jobId: "job_1", dedupeKey: "read_all_orders" });

    const result = await applyReadAllOrdersGrant({
      shopDomain: "acme.myshopify.com",
      previous: ["read_orders", "read_customers"],
      current: ["read_orders", "read_customers", "read_all_orders"],
    });

    expect(result).toEqual({
      shopId: "shop_1",
      hasReadAllOrders: true,
      gainedReadAllOrders: true,
      clearedHistoryLimited: true,
      enqueued: true,
    });
    expect(updateMany).toHaveBeenCalledWith({
      where: { shopId: "shop_1", historyLimited: true },
      data: { historyLimited: false, lastError: null },
    });
    expect(enqueueJob).toHaveBeenCalledWith({
      shopId: "shop_1",
      type: DEEP_HISTORY_BACKFILL_JOB,
      dedupeKey: DEEP_HISTORY_BACKFILL_DEDUPE_KEY,
      payload: {
        reason: "scopes_gained",
        grantedScopes: "read_orders,read_customers,read_all_orders",
      },
    });
  });

  it("still enqueues when the flag was already clear (idempotent re-kick)", async () => {
    findUnique.mockResolvedValue({ id: "shop_1" });
    updateMany.mockResolvedValue({ count: 0 });
    enqueueJob.mockResolvedValue({ jobId: "job_1", dedupeKey: "read_all_orders" });

    const result = await applyReadAllOrdersGrant({
      shopDomain: "acme.myshopify.com",
      current: ["read_all_orders"],
      previous: ["read_all_orders"],
    });

    expect(result.clearedHistoryLimited).toBe(false);
    expect(result.gainedReadAllOrders).toBe(false);
    expect(result.enqueued).toBe(true);
  });
});
