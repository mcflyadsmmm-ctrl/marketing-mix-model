import { describe, expect, it } from "vitest";
import {
  extractOrderDirtyDayKey,
  extractOrderDirtyDayKeys,
  extractOrderFactSealClearDayKeys,
  isOrderWebhookTopic,
  isRefundResourcePayload,
  isSalesDirtyWebhookTopic,
  normalizeWebhookTopic,
} from "./order-webhook";

describe("normalizeWebhookTopic", () => {
  it("normalizes slash and case variants", () => {
    expect(normalizeWebhookTopic("orders/create")).toBe("ORDERS_CREATE");
    expect(normalizeWebhookTopic("ORDERS_UPDATED")).toBe("ORDERS_UPDATED");
    expect(normalizeWebhookTopic("refunds/create")).toBe("REFUNDS_CREATE");
  });
});

describe("isSalesDirtyWebhookTopic", () => {
  it("accepts orders create/update/cancel and refunds create", () => {
    expect(isOrderWebhookTopic("ORDERS_CREATE")).toBe(true);
    expect(isOrderWebhookTopic("orders/cancelled")).toBe(true);
    expect(isOrderWebhookTopic("REFUNDS_CREATE")).toBe(false);
    expect(isSalesDirtyWebhookTopic("REFUNDS_CREATE")).toBe(true);
    expect(isSalesDirtyWebhookTopic("refunds/create")).toBe(true);
    expect(isSalesDirtyWebhookTopic("products/update")).toBe(false);
  });
});

describe("extractOrderDirtyDayKeys", () => {
  it("returns order-created day for plain create payloads", () => {
    expect(
      extractOrderDirtyDayKeys(
        { created_at: "2026-03-10T22:00:00-04:00" },
        "America/New_York",
      ),
    ).toEqual(["2026-03-10"]);
  });

  it("includes refund processed day distinct from order day", () => {
    expect(
      extractOrderDirtyDayKeys(
        {
          created_at: "2026-03-10T12:00:00-04:00",
          refunds: [{ processed_at: "2026-03-12T15:00:00-04:00" }],
        },
        "America/New_York",
      ),
    ).toEqual(["2026-03-10", "2026-03-12"]);
  });

  it("includes cancelled_at day when cancel lands later", () => {
    expect(
      extractOrderDirtyDayKeys(
        {
          created_at: "2026-03-10T12:00:00-04:00",
          cancelled_at: "2026-03-11T09:00:00-04:00",
        },
        "America/New_York",
      ),
    ).toEqual(["2026-03-10", "2026-03-11"]);
  });

  it("uses refund created_at when processed_at is missing", () => {
    expect(
      extractOrderDirtyDayKeys(
        {
          created_at: "2026-03-10T12:00:00-04:00",
          refunds: [{ created_at: "2026-03-13T10:00:00-04:00" }],
        },
        "America/New_York",
      ),
    ).toEqual(["2026-03-10", "2026-03-13"]);
  });

  it("dirties refund event day from refunds/create resource payload", () => {
    expect(
      extractOrderDirtyDayKeys(
        {
          id: 9001,
          order_id: 555,
          created_at: "2026-03-12T15:00:00-04:00",
          processed_at: "2026-03-12T15:01:00-04:00",
          refund_line_items: [{ id: 1 }],
        },
        "America/New_York",
      ),
    ).toEqual(["2026-03-12"]);
  });

  it("keeps extractOrderDirtyDayKey on order created/processed day", () => {
    expect(
      extractOrderDirtyDayKey(
        {
          created_at: "2026-03-10T12:00:00-04:00",
          refunds: [{ processed_at: "2026-03-12T15:00:00-04:00" }],
        },
        "America/New_York",
      ),
    ).toBe("2026-03-10");
  });
});

describe("refund resource seal clear", () => {
  it("detects refunds/create payloads", () => {
    expect(
      isRefundResourcePayload({
        order_id: 1,
        refund_line_items: [],
        created_at: "2026-03-12T15:00:00-04:00",
      }),
    ).toBe(true);
    expect(
      isRefundResourcePayload({
        created_at: "2026-03-10T12:00:00-04:00",
        refunds: [],
      }),
    ).toBe(false);
  });

  it("does not clear OrderFact seals from refund-only payloads", () => {
    expect(
      extractOrderFactSealClearDayKeys(
        {
          id: 9001,
          order_id: 555,
          created_at: "2026-03-12T15:00:00-04:00",
          refund_line_items: [{ id: 1 }],
        },
        "America/New_York",
      ),
    ).toEqual([]);
  });

  it("clears seals for all dirty days on full order payloads", () => {
    expect(
      extractOrderFactSealClearDayKeys(
        {
          created_at: "2026-03-10T12:00:00-04:00",
          refunds: [{ processed_at: "2026-03-12T15:00:00-04:00" }],
        },
        "America/New_York",
      ),
    ).toEqual(["2026-03-10", "2026-03-12"]);
  });
});
