import { describe, expect, it } from "vitest";
import {
  applyShopifyQlDayToSalesResult,
  buildShopifyQlSalesDaysQuery,
  parseShopifyQlDayKey,
  parseShopifyQlMoney,
  parseShopifyQlOrderCount,
  parseShopifyQlSalesDayRows,
} from "./shopifyql-sales";

describe("buildShopifyQlSalesDaysQuery", () => {
  it("builds an Analytics-matching day TIMESERIES query", () => {
    expect(
      buildShopifyQlSalesDaysQuery({
        sinceDayKey: "2026-09-01",
        untilDayKey: "2026-09-10",
      }),
    ).toBe(
      "FROM sales SHOW total_sales, orders, net_sales, gross_sales TIMESERIES day SINCE 2026-09-01 UNTIL 2026-09-10 ORDER BY day ASC",
    );
  });

  it("rejects inverted ranges", () => {
    expect(() =>
      buildShopifyQlSalesDaysQuery({
        sinceDayKey: "2026-09-10",
        untilDayKey: "2026-09-01",
      }),
    ).toThrow(/sinceDayKey/);
  });
});

describe("parseShopifyQlSalesDayRows", () => {
  it("maps Analytics day rows including money strings", () => {
    const map = parseShopifyQlSalesDayRows([
      {
        day: "2026-09-10T00:00:00",
        total_sales: "1,234.50",
        orders: "12",
        net_sales: "1100.00",
        gross_sales: "1300.00",
      },
    ]);
    expect(map.get("2026-09-10")).toEqual({
      dayKey: "2026-09-10",
      totalSales: 1234.5,
      orderCount: 12,
      netSales: 1100,
      grossSales: 1300,
    });
  });

  it("skips rows without a usable day or total", () => {
    const map = parseShopifyQlSalesDayRows([
      { day: "nope", total_sales: "10", orders: "1" },
      { day: "2026-09-11", total_sales: "x", orders: "1" },
    ]);
    expect(map.size).toBe(0);
  });
});

describe("parsers", () => {
  it("parses day keys and money", () => {
    expect(parseShopifyQlDayKey("2026-09-13")).toBe("2026-09-13");
    expect(parseShopifyQlMoney("99.9")).toBe(99.9);
    expect(parseShopifyQlOrderCount(3.2)).toBe(3);
  });
});

describe("applyShopifyQlDayToSalesResult", () => {
  it("overlays Analytics totals and clears crawl cohort columns", () => {
    const crawled = {
      totalSales: 100,
      orderCount: 2,
      netSales: 90,
      netSalesKnown: true,
      grossSales: 110,
      grossSalesKnown: true,
      source: "crawl",
      shopOrdersSeen: 7,
      newCustomers: 5,
      returningCustomers: 3,
      newCustomerNetSales: 40,
      returningCustomerNetSales: 50,
      guestOrders: 1,
      customerMetricsAvailable: true,
    };
    const next = applyShopifyQlDayToSalesResult(crawled, {
      dayKey: "2026-09-10",
      totalSales: 1234.5,
      orderCount: 12,
      netSales: 1100,
      grossSales: 1300,
    });
    expect(next.totalSales).toBe(1234.5);
    expect(next.orderCount).toBe(12);
    expect(next.netSales).toBe(1100);
    expect(next.grossSales).toBe(1300);
    expect(next.source).toBe("shopify");
    expect(next.shopOrdersSeen).toBe(7);
    expect(next.newCustomers).toBe(0);
    expect(next.returningCustomers).toBe(0);
    expect(next.newCustomerNetSales).toBe(0);
    expect(next.returningCustomerNetSales).toBe(0);
    expect(next.guestOrders).toBe(0);
    expect(next.customerMetricsAvailable).toBe(false);
  });
});
