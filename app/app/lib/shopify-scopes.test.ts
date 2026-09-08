import { afterEach, describe, expect, it } from "vitest";
import {
  allowsDeepOrderHistory,
  parseShopifyScopes,
  READ_ALL_ORDERS_SCOPE,
  resolveOrderHistoryWindowDays,
  scopesIncludeReadAllOrders,
} from "./shopify-scopes";

describe("parseShopifyScopes / scopesIncludeReadAllOrders", () => {
  it("splits comma, space, and mixed lists", () => {
    expect(parseShopifyScopes("read_orders,read_customers,read_all_orders")).toEqual(
      ["read_orders", "read_customers", READ_ALL_ORDERS_SCOPE],
    );
    expect(parseShopifyScopes("read_orders read_all_orders")).toEqual([
      "read_orders",
      READ_ALL_ORDERS_SCOPE,
    ]);
    expect(parseShopifyScopes(["read_orders", " read_all_orders "])).toEqual([
      "read_orders",
      READ_ALL_ORDERS_SCOPE,
    ]);
  });

  it("does not treat read_orders as read_all_orders", () => {
    expect(scopesIncludeReadAllOrders("read_orders,read_customers")).toBe(false);
    expect(scopesIncludeReadAllOrders("read_orders,read_customers,read_all_orders")).toBe(
      true,
    );
  });
});

describe("allowsDeepOrderHistory", () => {
  const prev = process.env.SCOPES;
  afterEach(() => {
    if (prev == null) delete process.env.SCOPES;
    else process.env.SCOPES = prev;
  });

  it("fail-closed when neither env nor granted scopes include read_all_orders", () => {
    process.env.SCOPES = "read_orders,read_customers";
    expect(allowsDeepOrderHistory()).toBe(false);
    expect(
      allowsDeepOrderHistory({ grantedScopes: "read_orders,read_customers" }),
    ).toBe(false);
  });

  it("allows deep when env SCOPES lists read_all_orders and grant is unknown", () => {
    process.env.SCOPES = "read_orders,read_customers,read_all_orders";
    expect(allowsDeepOrderHistory()).toBe(true);
  });

  it("token grant wins over env — no deep if the shop has not re-approved", () => {
    process.env.SCOPES = "read_orders,read_customers,read_all_orders";
    expect(
      allowsDeepOrderHistory({ grantedScopes: "read_orders,read_customers" }),
    ).toBe(false);
    expect(
      allowsDeepOrderHistory({
        grantedScopes: "read_orders,read_customers,read_all_orders",
      }),
    ).toBe(true);
  });
});

describe("resolveOrderHistoryWindowDays", () => {
  const now = new Date("2026-07-15T12:00:00.000Z");
  const deep = 1627; // illustrative; callers pass salesDayFactWindowDayCount
  const shallow = 60;

  it("uses the 60-day window when scopes omit read_all_orders and history is limited", () => {
    const resolved = resolveOrderHistoryWindowDays({
      now,
      scopesAllowDeep: false,
      persistedHistoryLimited: true,
      deepWindowDays: deep,
      shallowWindowDays: shallow,
    });
    expect(resolved.windowDays).toBe(60);
    expect(resolved.historyLimited).toBe(true);
    expect(resolved.reprobed).toBe(false);
  });

  it("re-probes the deep window when scopes now allow deep despite a stuck flag", () => {
    const resolved = resolveOrderHistoryWindowDays({
      now,
      scopesAllowDeep: true,
      persistedHistoryLimited: true,
      deepWindowDays: deep,
      shallowWindowDays: shallow,
    });
    expect(resolved.windowDays).toBe(deep);
    expect(resolved.historyLimited).toBe(false);
    expect(resolved.reprobed).toBe(true);
  });

  it("keeps the deep window when scopes allow deep and the flag is already clear", () => {
    const resolved = resolveOrderHistoryWindowDays({
      now,
      scopesAllowDeep: true,
      persistedHistoryLimited: false,
      deepWindowDays: deep,
      shallowWindowDays: shallow,
    });
    expect(resolved.windowDays).toBe(deep);
    expect(resolved.historyLimited).toBe(false);
    expect(resolved.reprobed).toBe(false);
  });
});
