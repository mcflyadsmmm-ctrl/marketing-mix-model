import { beforeEach, describe, expect, it, vi } from "vitest";

const authenticateWebhook = vi.fn();
const shopUpsert = vi.fn();
const enqueueJob = vi.fn();
const clearOrderFactDayCompleteSeal = vi.fn();
const recordWebhookDelivery = vi.fn();
const releaseWebhookDelivery = vi.fn();

vi.mock("../shopify.server", () => ({
  authenticate: {
    webhook: (...args: unknown[]) => authenticateWebhook(...args),
  },
}));

vi.mock("../db.server", () => ({
  default: {
    shop: {
      upsert: (...args: unknown[]) => shopUpsert(...args),
    },
  },
}));

vi.mock("./job-queue.server", () => ({
  enqueueJob: (...args: unknown[]) => enqueueJob(...args),
}));

vi.mock("./order-facts.server", async () => {
  const actual = await vi.importActual<typeof import("./order-facts.server")>(
    "./order-facts.server",
  );
  return {
    ...actual,
    clearOrderFactDayCompleteSeal: (...args: unknown[]) =>
      clearOrderFactDayCompleteSeal(...args),
  };
});

vi.mock("./webhook-delivery.server", () => ({
  recordWebhookDelivery: (...args: unknown[]) => recordWebhookDelivery(...args),
  releaseWebhookDelivery: (...args: unknown[]) => releaseWebhookDelivery(...args),
}));

import { action } from "../routes/webhooks.orders";
import { BACKFILL_ORDER_FACTS_JOB } from "./order-facts.server";
import { RECONCILE_SALES_DAY_JOB } from "./order-webhook";

describe("orders webhook → OrderFact delta", () => {
  beforeEach(() => {
    authenticateWebhook.mockReset();
    shopUpsert.mockReset();
    enqueueJob.mockReset();
    clearOrderFactDayCompleteSeal.mockReset();
    recordWebhookDelivery.mockReset();
    releaseWebhookDelivery.mockReset();

    authenticateWebhook.mockResolvedValue({
      shop: "acme.myshopify.com",
      topic: "orders/cancelled",
      payload: { id: 5432109876, created_at: "2026-07-20T14:00:00-05:00" },
      webhookId: "wh_1",
      session: { shop: "acme.myshopify.com" },
    });
    shopUpsert.mockResolvedValue({
      id: "shop_1",
      ianaTimezone: "America/Chicago",
    });
    recordWebhookDelivery.mockResolvedValue({
      firstDelivery: true,
      deliveryKey: "wh_1",
    });
    clearOrderFactDayCompleteSeal.mockResolvedValue(1);
    enqueueJob.mockResolvedValue({ jobId: "job_1", dedupeKey: "shop_1" });
  });

  it("enqueues shop-deduped backfill_order_facts after clearing the day seal", async () => {
    const response = await action({
      request: new Request("https://app/webhooks/orders", { method: "POST" }),
    } as never);

    expect(response).toBeInstanceOf(Response);
    expect(clearOrderFactDayCompleteSeal).toHaveBeenCalledWith(
      "shop_1",
      "2026-07-20",
    );
    expect(enqueueJob).toHaveBeenCalledWith(
      expect.objectContaining({
        shopId: "shop_1",
        type: BACKFILL_ORDER_FACTS_JOB,
        dedupeKey: "shop_1",
        payload: { reason: "ORDERS_CANCELLED", day: "2026-07-20" },
      }),
    );
    expect(enqueueJob).toHaveBeenCalledWith(
      expect.objectContaining({
        shopId: "shop_1",
        type: RECONCILE_SALES_DAY_JOB,
        dedupeKey: "2026-07-20",
      }),
    );
  });
});
