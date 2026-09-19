import { describe, expect, it } from "vitest";
import {
  parseSalesDayCustomerSplit,
  parseSalesDayTotals,
  salesDayCustomerSplitQuery,
  salesDayTotalsQuery,
  salesTotalsWindowDayCount,
  salesTotalsYearChunks,
  mergeCustomerSplitIntoDayTotals,
} from "./shopify-sales-totals";

describe("ShopifyQL sales day totals", () => {
  it("asks sales for day totals, not orders", () => {
    const q = salesDayTotalsQuery("2021-01-01", "2021-12-31");
    expect(q).toContain("FROM sales");
    expect(q).toContain("TIMESERIES day");
    expect(q).not.toMatch(/\borders\(/);
  });

  it("asks a second lightweight New/Returning split by day", () => {
    const q = salesDayCustomerSplitQuery("2021-01-01", "2021-12-31");
    expect(q).toContain("FROM sales");
    expect(q).toContain("SHOW total_sales");
    expect(q).toContain("GROUP BY new_or_returning_customer");
    expect(q).toContain("TIMESERIES day");
    expect(q).not.toMatch(/\borders\(/);
  });

  it("splits a multi-year span into calendar years", () => {
    expect(salesTotalsYearChunks("2024-11-01", "2026-02-02")).toEqual([
      { since: "2024-11-01", until: "2024-12-31" },
      { since: "2025-01-01", until: "2025-12-31" },
      { since: "2026-01-01", until: "2026-02-02" },
    ]);
  });

  it("parses money strings and ignores rows without a day", () => {
    const rows = parseSalesDayTotals([
      {
        day: "2026-01-02",
        total_sales: "10.50",
        net_sales: "8",
        gross_sales: "12",
        orders: "2",
      },
      { day: null, total_sales: "1", net_sales: "1", gross_sales: "1", orders: "1" },
    ]);
    expect(rows).toEqual([
      {
        dayKey: "2026-01-02",
        totalSales: 10.5,
        netSales: 8,
        grossSales: 12,
        orderCount: 2,
        newCustomerNetSales: 0,
        returningCustomerNetSales: 0,
        customerMetricsAvailable: false,
      },
    ]);
  });

  it("parses New/Returning Total Sales by day (order-based split)", () => {
    const splits = parseSalesDayCustomerSplit([
      {
        day: "2026-01-02",
        new_or_returning_customer: "New",
        total_sales: "40",
      },
      {
        day: "2026-01-02",
        new_or_returning_customer: "Returning",
        total_sales: "60",
      },
      {
        day: "2026-01-03",
        new_or_returning_customer: "New",
        total_sales: "10",
      },
    ]);
    expect(splits.get("2026-01-02")).toEqual({
      dayKey: "2026-01-02",
      newCustomerNetSales: 40,
      returningCustomerNetSales: 60,
    });
    expect(splits.get("2026-01-03")).toEqual({
      dayKey: "2026-01-03",
      newCustomerNetSales: 10,
      returningCustomerNetSales: 0,
    });
  });

  it("merges the split onto day totals and marks customerMetricsAvailable", () => {
    const totals = new Map(
      parseSalesDayTotals([
        {
          day: "2026-01-02",
          total_sales: "100",
          net_sales: "90",
          gross_sales: "110",
          orders: "3",
        },
      ]).map((row) => [row.dayKey, row]),
    );
    mergeCustomerSplitIntoDayTotals(
      totals,
      parseSalesDayCustomerSplit([
        {
          day: "2026-01-02",
          new_or_returning_customer: "New",
          total_sales: "40",
        },
        {
          day: "2026-01-02",
          new_or_returning_customer: "Returning",
          total_sales: "60",
        },
      ]),
    );
    expect(totals.get("2026-01-02")).toMatchObject({
      totalSales: 100,
      newCustomerNetSales: 40,
      returningCustomerNetSales: 60,
      customerMetricsAvailable: true,
    });
  });

  it("asks for more than 24 months of day totals", () => {
    const days = salesTotalsWindowDayCount(new Date("2026-09-18T12:00:00.000Z"));
    expect(days).toBeGreaterThan(365 * 9);
    expect(days).toBeLessThan(365 * 11);
  });
});
