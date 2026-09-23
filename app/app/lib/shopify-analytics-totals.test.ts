import { describe, expect, it } from "vitest";
import {
  buildOrdersClock,
  type OrdersSalesClocks,
} from "./orders-scoreboard";
import {
  deskAnalyticsDayTotalsLive,
  deskAnalyticsNativeBook,
  deskAnalyticsSalesClockValues,
  SHOPIFYQL_ANALYTICS_DAY_TOTALS_LIVE,
} from "./shopify-analytics-totals";
import { shopifyNativePeriodStats } from "./shopify-native-stats";

describe("shopify analytics totals (PCD L2 approved)", () => {
  const clocks: OrdersSalesClocks = {
    gross: 90_000,
    grossKnown: true,
    total: 68_457,
    net: 60_000,
    netKnown: true,
  };

  it("paints Analytics clocks on Live and keeps SAMPLE on em dashes", () => {
    expect(SHOPIFYQL_ANALYTICS_DAY_TOTALS_LIVE).toBe(true);
    expect(deskAnalyticsDayTotalsLive(false)).toBe(true);
    expect(deskAnalyticsDayTotalsLive(true)).toBe(false);

    const live = buildOrdersClock(clocks, "USD", false);
    expect(live.map((row) => row.k)).toEqual([
      "Original",
      "After returns",
      "Product only",
    ]);
    expect(live.map((row) => row.v)).toEqual(["$90,000", "$68,457", "$60,000"]);

    const sample = buildOrdersClock(clocks, "USD", true);
    expect(sample.map((row) => row.k)).toEqual([
      "Gross sales",
      "Total Sales",
      "Net Sales",
    ]);
    expect(sample.map((row) => row.v)).toEqual(["—", "—", "—"]);
  });

  it("returns clock inputs on Live and zeros them on SAMPLE", () => {
    expect(
      deskAnalyticsSalesClockValues({
        useSampleDesk: false,
        ...clocks,
      }),
    ).toEqual(clocks);
    expect(
      deskAnalyticsSalesClockValues({
        useSampleDesk: true,
        ...clocks,
      }),
    ).toEqual({
      gross: 0,
      grossKnown: false,
      total: 0,
      net: 0,
      netKnown: false,
    });
  });

  it("keeps ShopifyQL New/Returning $ on Live and withholds them on SAMPLE", () => {
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
    const live = deskAnalyticsNativeBook(raw, false);
    expect(live.customerMetricsAvailable).toBe(true);
    expect(live.newSales).toBe(raw.newSales);
    expect(live.returningSales).toBe(raw.returningSales);

    const sample = deskAnalyticsNativeBook(raw, true);
    expect(sample.customerMetricsAvailable).toBe(false);
    expect(sample.newSales).toBeNull();
    expect(sample.returningSales).toBeNull();
    expect(sample.returningSalesShare).toBeNull();
  });
});
