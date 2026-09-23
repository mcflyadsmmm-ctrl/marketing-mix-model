import { describe, expect, it } from "vitest";
import {
  buildOrdersClock,
  type OrdersSalesClocks,
} from "./orders-scoreboard";
import {
  deskAnalyticsDayTotalsLive,
  deskAnalyticsNativeBook,
} from "./shopify-analytics-totals";
import { shopifyNativePeriodStats } from "./shopify-native-stats";

describe("shopify analytics totals (pre-L2)", () => {
  const clocks: OrdersSalesClocks = {
    gross: 90_000,
    grossKnown: true,
    total: 68_457,
    net: 60_000,
    netKnown: true,
  };

  it("keeps Analytics Total / Net / Gross off the Orders clock", () => {
    expect(deskAnalyticsDayTotalsLive(false)).toBe(false);
    expect(deskAnalyticsDayTotalsLive(true)).toBe(false);
    const items = buildOrdersClock(clocks, "USD", false);
    expect(items.map((row) => row.v)).toEqual(["—", "—", "—"]);
  });

  it("withholds ShopifyQL New/Returning $ on the native book", () => {
    const raw = shopifyNativePeriodStats({
      sales: 68_457,
      orderCount: 108,
      newCustomers: 40,
      returningCustomers: 68,
      guestOrders: 0,
      customerMetricsAvailable: true,
      newCustomerNetSales: 20_000,
      returningCustomerNetSales: 48_457,
      grossSales: 70_000,
      grossSalesKnown: true,
    });
    const masked = deskAnalyticsNativeBook(raw, false);
    expect(masked.customerMetricsAvailable).toBe(false);
    expect(masked.newSales).toBeNull();
    expect(masked.returningSales).toBeNull();
    expect(masked.returningSalesShare).toBeNull();
  });
});
