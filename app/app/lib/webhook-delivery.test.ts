import { beforeEach, describe, expect, it, vi } from "vitest";

const create = vi.fn();
const deleteMany = vi.fn();

vi.mock("../db.server", () => ({
  default: {
    webhookDelivery: {
      create: (...args: unknown[]) => create(...args),
      deleteMany: (...args: unknown[]) => deleteMany(...args),
    },
  },
}));

import {
  buildDeliveryKey,
  purgeExpiredWebhookDeliveries,
  purgeWebhookDeliveriesForShop,
  recordWebhookDelivery,
  releaseWebhookDelivery,
  WEBHOOK_DELIVERY_RETENTION_DAYS,
} from "./webhook-delivery.server";

/** Shape Prisma raises on a unique-index violation. */
function uniqueViolation() {
  return Object.assign(new Error("Unique constraint failed"), {
    code: "P2002",
    meta: { target: ["deliveryKey"] },
  });
}

const BASE = {
  shopDomain: "acme.myshopify.com",
  topic: "orders/create",
  webhookId: "b1946ac9-2f5c-4c1e-9f2b-000000000001",
  resourceId: "5432109876",
};

describe("buildDeliveryKey", () => {
  it("uses Shopify's webhook id — the documented idempotency key", () => {
    expect(buildDeliveryKey(BASE)).toBe(BASE.webhookId);
  });

  it("stays stable across topic casing so orders/create and ORDERS_CREATE cannot both process", () => {
    const slash = buildDeliveryKey({ ...BASE, webhookId: null, topic: "orders/create" });
    const upper = buildDeliveryKey({ ...BASE, webhookId: null, topic: "ORDERS_CREATE" });
    expect(slash).toBe(upper);
  });

  it("synthesizes a shop-scoped key when the webhook id header is absent", () => {
    const key = buildDeliveryKey({
      ...BASE,
      webhookId: "   ",
      triggeredAt: "2026-07-27T18:00:00Z",
    });
    expect(key).toContain("acme.myshopify.com");
    expect(key).toContain("ORDERS_CREATE");
    expect(key).toContain("5432109876");
  });

  it("keeps two different orders in the same topic distinct", () => {
    const a = buildDeliveryKey({ ...BASE, webhookId: null, resourceId: "1" });
    const b = buildDeliveryKey({ ...BASE, webhookId: null, resourceId: "2" });
    expect(a).not.toBe(b);
  });
});

describe("recordWebhookDelivery", () => {
  beforeEach(() => {
    create.mockReset();
    deleteMany.mockReset();
  });

  it("claims a first delivery and normalizes the stored topic", async () => {
    create.mockResolvedValue({ id: "wd_1" });

    const result = await recordWebhookDelivery(BASE);

    expect(result.firstDelivery).toBe(true);
    expect(result.deliveryKey).toBe(BASE.webhookId);
    expect(result.topic).toBe("ORDERS_CREATE");
    expect(create).toHaveBeenCalledTimes(1);
    expect(create.mock.calls[0][0].data).toMatchObject({
      deliveryKey: BASE.webhookId,
      shopDomain: BASE.shopDomain,
      topic: "ORDERS_CREATE",
      resourceId: BASE.resourceId,
    });
  });

  it("reports a replay (no work) when the same webhook id is delivered again", async () => {
    create.mockResolvedValueOnce({ id: "wd_1" });
    create.mockRejectedValueOnce(uniqueViolation());

    const first = await recordWebhookDelivery(BASE);
    const retry = await recordWebhookDelivery(BASE);

    expect(first.firstDelivery).toBe(true);
    expect(retry.firstDelivery).toBe(false);
    expect(retry.deliveryKey).toBe(first.deliveryKey);
  });

  it("treats every one of Shopify's retries after the first as a replay", async () => {
    create.mockResolvedValueOnce({ id: "wd_1" });
    create.mockRejectedValue(uniqueViolation());

    const outcomes = [];
    for (let attempt = 0; attempt < 5; attempt += 1) {
      outcomes.push((await recordWebhookDelivery(BASE)).firstDelivery);
    }

    expect(outcomes).toEqual([true, false, false, false, false]);
  });

  it("insert-then-catch: two concurrent retries produce exactly one winner", async () => {
    let inserted = false;
    create.mockImplementation(async () => {
      // No read-then-write gap for a racing caller to slip through.
      if (inserted) throw uniqueViolation();
      inserted = true;
      return { id: "wd_1" };
    });

    const [a, b] = await Promise.all([
      recordWebhookDelivery(BASE),
      recordWebhookDelivery(BASE),
    ]);

    expect([a.firstDelivery, b.firstDelivery].filter(Boolean)).toHaveLength(1);
  });

  it("does not claim a delivery when the insert fails for a non-uniqueness reason", async () => {
    create.mockRejectedValue(new Error("connection terminated"));

    // Must surface so the route 500s and Shopify retries — swallowing this would
    // silently drop the order event.
    await expect(recordWebhookDelivery(BASE)).rejects.toThrow("connection terminated");
  });

  it("distinguishes the same order across topics so an update after a create still enqueues", async () => {
    create.mockResolvedValue({ id: "wd_1" });

    const created = await recordWebhookDelivery({ ...BASE, webhookId: null });
    const updated = await recordWebhookDelivery({
      ...BASE,
      webhookId: null,
      topic: "orders/updated",
    });

    expect(created.deliveryKey).not.toBe(updated.deliveryKey);
  });

  it("unique violation → firstDelivery false (replay ACK path)", async () => {
    create.mockRejectedValue(uniqueViolation());

    const result = await recordWebhookDelivery(BASE);

    expect(result.firstDelivery).toBe(false);
    expect(result.deliveryKey).toBe(BASE.webhookId);
  });
});

describe("releaseWebhookDelivery", () => {
  beforeEach(() => {
    create.mockReset();
    deleteMany.mockReset();
  });

  it("claim succeeds then release removes the row by deliveryKey", async () => {
    create.mockResolvedValue({ id: "wd_1" });
    deleteMany.mockResolvedValue({ count: 1 });

    const claim = await recordWebhookDelivery(BASE);
    expect(claim.firstDelivery).toBe(true);

    const released = await releaseWebhookDelivery(claim.deliveryKey);

    expect(released).toBe(true);
    expect(deleteMany).toHaveBeenCalledWith({
      where: { deliveryKey: BASE.webhookId },
    });
  });

  it("after release, the same key can be claimed again (Shopify retry)", async () => {
    create.mockResolvedValue({ id: "wd_1" });
    deleteMany.mockResolvedValue({ count: 1 });

    const first = await recordWebhookDelivery(BASE);
    await releaseWebhookDelivery(first.deliveryKey);
    const retry = await recordWebhookDelivery(BASE);

    expect(first.firstDelivery).toBe(true);
    expect(retry.firstDelivery).toBe(true);
    expect(create).toHaveBeenCalledTimes(2);
  });

  it("is a no-op when the row is already gone", async () => {
    deleteMany.mockResolvedValue({ count: 0 });

    const released = await releaseWebhookDelivery(BASE.webhookId);

    expect(released).toBe(false);
  });
});

describe("purgeWebhookDeliveriesForShop", () => {
  beforeEach(() => {
    deleteMany.mockReset();
  });

  it("erases the ledger by domain (no Shop FK to cascade from)", async () => {
    deleteMany.mockResolvedValue({ count: 3 });

    const count = await purgeWebhookDeliveriesForShop("acme.myshopify.com");

    expect(count).toBe(3);
    expect(deleteMany).toHaveBeenCalledWith({
      where: { shopDomain: "acme.myshopify.com" },
    });
  });
});

describe("purgeExpiredWebhookDeliveries", () => {
  beforeEach(() => {
    deleteMany.mockReset();
    deleteMany.mockResolvedValue({ count: 42 });
  });

  it("deletes only keys past the retention window", async () => {
    const now = new Date("2026-07-28T12:00:00.000Z");

    const count = await purgeExpiredWebhookDeliveries(now);

    expect(count).toBe(42);
    const cutoff = deleteMany.mock.calls[0][0].where.receivedAt.lt as Date;
    expect(now.getTime() - cutoff.getTime()).toBe(
      WEBHOOK_DELIVERY_RETENTION_DAYS * 86_400_000,
    );
  });

  it("keeps the window well past Shopify's ~48h retry horizon", () => {
    expect(WEBHOOK_DELIVERY_RETENTION_DAYS).toBeGreaterThanOrEqual(3);
  });
});
