import { describe, expect, it } from "vitest";
import {
  isCertifiedSalesDayFact,
  isShopifyHistoryWindowError,
  isUnseenShopifySalesDay,
  shopifyReadOrdersHorizonUtc,
  shopifyReadOrdersScopesAllowDeep,
} from "./shopify-order-window";

describe("shopifyReadOrdersScopesAllowDeep", () => {
  it("is true only when SCOPES includes read_all_orders", () => {
    expect(shopifyReadOrdersScopesAllowDeep("read_orders,read_customers")).toBe(
      false,
    );
    expect(
      shopifyReadOrdersScopesAllowDeep("read_orders,read_all_orders"),
    ).toBe(true);
  });
});

describe("isShopifyHistoryWindowError", () => {
  it("detects access-denied / read_all_orders window errors", () => {
    expect(
      isShopifyHistoryWindowError(
        [{ message: "ACCESS_DENIED", extensions: { code: "ACCESS_DENIED" } }],
        null,
      ),
    ).toBe(true);
    expect(isShopifyHistoryWindowError(undefined, "older than 60 days")).toBe(
      true,
    );
    expect(isShopifyHistoryWindowError([{ message: "throttled" }], null)).toBe(
      false,
    );
  });
});

describe("isUnseenShopifySalesDay / isCertifiedSalesDayFact", () => {
  const now = new Date("2026-09-16T18:00:00.000Z");
  const horizon = shopifyReadOrdersHorizonUtc(now);

  it("treats a successful empty fetch before the 60-day horizon as unseen", () => {
    const day = new Date(horizon.getTime() - 86_400_000);
    expect(
      isUnseenShopifySalesDay({
        day,
        orderCount: 0,
        totalSales: 0,
        now,
        scopesAllowDeep: false,
      }),
    ).toBe(true);
    expect(
      isCertifiedSalesDayFact({
        day,
        sales: 0,
        now,
        scopesAllowDeep: false,
      }),
    ).toBe(false);
  });

  it("certifies a real $0 inside the window and any non-zero day", () => {
    expect(
      isUnseenShopifySalesDay({
        day: now,
        orderCount: 0,
        totalSales: 0,
        now,
        scopesAllowDeep: false,
      }),
    ).toBe(false);
    expect(
      isCertifiedSalesDayFact({
        day: now,
        sales: 0,
        now,
        scopesAllowDeep: false,
      }),
    ).toBe(true);
    expect(
      isCertifiedSalesDayFact({
        day: new Date("2026-01-01T00:00:00.000Z"),
        sales: 1200,
        now,
        scopesAllowDeep: false,
      }),
    ).toBe(true);
  });

  it("does not treat empty old days as unseen when read_all_orders is on", () => {
    const day = new Date("2025-01-01T00:00:00.000Z");
    expect(
      isUnseenShopifySalesDay({
        day,
        orderCount: 0,
        totalSales: 0,
        now,
        scopesAllowDeep: true,
      }),
    ).toBe(false);
    expect(
      isCertifiedSalesDayFact({
        day,
        sales: 0,
        now,
        scopesAllowDeep: true,
      }),
    ).toBe(true);
  });
});
