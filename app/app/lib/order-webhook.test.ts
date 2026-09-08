import { describe, expect, it } from "vitest";
import {
  extractOrderDirtyDayKey,
  extractOrderId,
  isOrderWebhookTopic,
  normalizeWebhookTopic,
} from "./order-webhook";

describe("normalizeWebhookTopic", () => {
  it("normalizes both shapes Shopify has used for the same topic", () => {
    expect(normalizeWebhookTopic("orders/create")).toBe("ORDERS_CREATE");
    expect(normalizeWebhookTopic("ORDERS_CREATE")).toBe("ORDERS_CREATE");
  });

  it("returns an empty string rather than throwing on a missing topic", () => {
    expect(normalizeWebhookTopic(undefined)).toBe("");
    expect(normalizeWebhookTopic(null)).toBe("");
  });
});

describe("isOrderWebhookTopic", () => {
  it("accepts the three subscribed order topics in either shape", () => {
    expect(isOrderWebhookTopic("orders/create")).toBe(true);
    expect(isOrderWebhookTopic("ORDERS_UPDATED")).toBe(true);
    expect(isOrderWebhookTopic("orders/cancelled")).toBe(true);
  });

  it("rejects topics this route must not act on", () => {
    expect(isOrderWebhookTopic("APP_UNINSTALLED")).toBe(false);
    expect(isOrderWebhookTopic("customers/redact")).toBe(false);
    expect(isOrderWebhookTopic("orders/fulfilled")).toBe(false);
  });
});

describe("extractOrderId", () => {
  it("prefers the numeric order id, stringified", () => {
    expect(extractOrderId({ id: 5432109876 })).toBe("5432109876");
  });

  it("falls back to the GID when no numeric id is present", () => {
    expect(
      extractOrderId({ admin_graphql_api_id: "gid://shopify/Order/5432109876" }),
    ).toBe("gid://shopify/Order/5432109876");
  });

  it("returns null instead of inventing an id", () => {
    expect(extractOrderId({})).toBeNull();
    expect(extractOrderId(null)).toBeNull();
    expect(extractOrderId("not an object")).toBeNull();
  });
});

describe("extractOrderDirtyDayKey", () => {
  it("derives the day in the shop's timezone when it is known", () => {
    // 03:30 UTC on the 28th is still the 27th in Chicago — the sale belongs to the 27th.
    const day = extractOrderDirtyDayKey(
      { created_at: "2026-07-28T03:30:00Z" },
      "America/Chicago",
    );
    expect(day).toBe("2026-07-27");
  });

  it("agrees with Shopify's offset-bearing timestamp for the same instant", () => {
    const withTz = extractOrderDirtyDayKey(
      { created_at: "2026-07-27T22:30:00-05:00" },
      "America/Chicago",
    );
    const withoutTz = extractOrderDirtyDayKey(
      { created_at: "2026-07-27T22:30:00-05:00" },
      null,
    );
    expect(withTz).toBe("2026-07-27");
    expect(withoutTz).toBe("2026-07-27");
  });

  it("uses the timestamp's own offset prefix when the shop timezone is unknown", () => {
    // Never substitute server-local time; Shopify's offset already encodes shop-local.
    expect(
      extractOrderDirtyDayKey({ created_at: "2026-07-27T23:59:00-05:00" }, null),
    ).toBe("2026-07-27");
  });

  it("dirties the order's created day, not today, so a late cancel fixes the right fact", () => {
    const day = extractOrderDirtyDayKey(
      {
        created_at: "2026-07-20T14:00:00-05:00",
        updated_at: "2026-07-28T09:00:00-05:00",
        cancelled_at: "2026-07-28T09:00:00-05:00",
      },
      "America/Chicago",
    );
    expect(day).toBe("2026-07-20");
  });

  it("falls back to processed_at when created_at is absent", () => {
    expect(
      extractOrderDirtyDayKey(
        { processed_at: "2026-07-19T10:00:00-05:00" },
        "America/Chicago",
      ),
    ).toBe("2026-07-19");
  });

  it("returns null when no usable timestamp exists rather than guessing a day", () => {
    expect(extractOrderDirtyDayKey({ id: 1 }, "America/Chicago")).toBeNull();
    expect(extractOrderDirtyDayKey({ created_at: "" }, "America/Chicago")).toBeNull();
    expect(extractOrderDirtyDayKey(null, "America/Chicago")).toBeNull();
  });

  it("falls back to the date prefix when the timestamp is not parseable as an instant", () => {
    expect(
      extractOrderDirtyDayKey({ created_at: "2026-07-27 bogus" }, "America/Chicago"),
    ).toBe("2026-07-27");
  });

  it("reads only Level 1 fields — a payload with customer PII yields the same key", () => {
    const level1Only = extractOrderDirtyDayKey(
      { created_at: "2026-07-27T10:00:00-05:00" },
      "America/Chicago",
    );
    const withPii = extractOrderDirtyDayKey(
      {
        created_at: "2026-07-27T10:00:00-05:00",
        email: "shopper@example.com",
        customer: { id: 99, first_name: "Ada" },
        billing_address: { address1: "1 Main St" },
        line_items: [{ title: "Widget" }],
      },
      "America/Chicago",
    );
    expect(withPii).toBe(level1Only);
  });
});
