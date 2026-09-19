import { beforeEach, describe, expect, it, vi } from "vitest";

const findMany = vi.fn();
const upsert = vi.fn();
const count = vi.fn();

vi.mock("../db.server", () => ({
  default: {
    salesDayFact: {
      findMany: (...args: unknown[]) => findMany(...args),
      upsert: (...args: unknown[]) => upsert(...args),
      count: (...args: unknown[]) => count(...args),
    },
  },
}));

const ensureShopMetadata = vi.fn();
const shopIsProForIngest = vi.fn();
vi.mock("./shop-metadata.server", () => ({
  ensureShopMetadata: (...args: unknown[]) => ensureShopMetadata(...args),
}));
vi.mock("./live-ingest-depth.server", () => ({
  shopIsProForIngest: (...args: unknown[]) => shopIsProForIngest(...args),
}));

const fetchShopifySalesDayTotals = vi.fn();
vi.mock("./shopify-sales-totals.server", () => ({
  fetchShopifySalesDayTotals: (...args: unknown[]) => fetchShopifySalesDayTotals(...args),
  ShopifyReportsScopeError: class ShopifyReportsScopeError extends Error {
    constructor(message: string) {
      super(message);
      this.name = "ShopifyReportsScopeError";
    }
  },
}));

const fetchShopifySales = vi.fn();
vi.mock("./shopify-sales.server", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./shopify-sales.server")>();
  return {
    ...actual,
    fetchShopifySales: (...args: unknown[]) => fetchShopifySales(...args),
  };
});

import {
  runSalesFactsBackfill,
  getSalesFactsCoverage,
  getSalesFactsTotals,
  getSalesFactsByDay,
  getSalesFactsWindowRemainingDays,
  salesResultFromFactsTotals,
  SALES_DAY_FACT_SOURCE,
} from "./sales-facts.server";
import { ShopifyReportsScopeError } from "./shopify-sales-totals.server";

const FAKE_ADMIN = {} as never;

function fakeSales(totalSales = 0) {
  return {
    totalSales,
    orderCount: 0,
    newCustomers: 0,
    returningCustomers: 0,
    guestOrders: 0,
    customerMetricsAvailable: true,
    source: "shopify" as const,
  };
}

describe("runSalesFactsBackfill", () => {
  beforeEach(() => {
    findMany.mockReset();
    upsert.mockReset();
    count.mockReset();
    ensureShopMetadata.mockReset();
    fetchShopifySales.mockReset();
    fetchShopifySalesDayTotals.mockReset();
    fetchShopifySalesDayTotals.mockResolvedValue(new Map());
    shopIsProForIngest.mockReset();
    shopIsProForIngest.mockResolvedValue(false);
  });

  it("skips ingest entirely (honest) when ianaTimezone is unknown even after a sync attempt", async () => {
    ensureShopMetadata.mockResolvedValue({ ianaTimezone: null, currencyCode: null });

    const result = await runSalesFactsBackfill(FAKE_ADMIN, "shop_1", {
      now: new Date("2026-07-15T12:00:00.000Z"),
    });

    expect(result.skippedReason).toBe("no_timezone");
    expect(result.attempted).toBe(0);
    expect(result.written).toBe(0);
    expect(result.unseen).toEqual([]);
    expect(fetchShopifySales).not.toHaveBeenCalled();
    expect(fetchShopifySalesDayTotals).not.toHaveBeenCalled();
    expect(upsert).not.toHaveBeenCalled();
  });

  it("upserts one SalesDayFact per closed day on the shopId_day unique key, including zero-sales days", async () => {
    ensureShopMetadata.mockResolvedValue({ ianaTimezone: "UTC", currencyCode: "USD" });
    findMany.mockResolvedValue([]);
    fetchShopifySalesDayTotals.mockResolvedValue(new Map());

    const now = new Date("2026-07-15T12:00:00.000Z");
    const result = await runSalesFactsBackfill(FAKE_ADMIN, "shop_1", { now, maxDays: 3 });

    expect(result.skippedReason).toBeNull();
    expect(result.attempted).toBe(3);
    expect(result.written).toBe(3);
    expect(result.failed).toEqual([]);
    expect(result.unseen).toEqual([]);
    expect(upsert).toHaveBeenCalledTimes(3);

    const call = upsert.mock.calls[0][0];
    expect(call.where).toHaveProperty("shopId_day");
    expect(call.where.shopId_day.shopId).toBe("shop_1");
    expect(call.create.sales).toBe(0);
    expect(call.create.source).toBe(SALES_DAY_FACT_SOURCE);
    expect(call.create.customerMetricsAvailable).toBe(false);
  });

  it("persists ShopifyQL New/Returning Total Sales $ and marks customerMetricsAvailable", async () => {
    ensureShopMetadata.mockResolvedValue({ ianaTimezone: "UTC", currencyCode: "USD" });
    findMany.mockResolvedValue([]);
    fetchShopifySalesDayTotals.mockImplementation(
      async (_admin: unknown, range: { since: string }) =>
        new Map([
          [
            range.since,
            {
              dayKey: range.since,
              totalSales: 100,
              netSales: 90,
              grossSales: 110,
              orderCount: 2,
              newCustomerNetSales: 40,
              returningCustomerNetSales: 60,
              customerMetricsAvailable: true,
            },
          ],
        ]),
    );

    const now = new Date("2026-07-15T12:00:00.000Z");
    await runSalesFactsBackfill(FAKE_ADMIN, "shop_1", { now, maxDays: 1 });

    expect(upsert).toHaveBeenCalledTimes(1);
    expect(upsert.mock.calls[0][0].create).toMatchObject({
      sales: 100,
      newCustomerNetSales: 40,
      returningCustomerNetSales: 60,
      customerMetricsAvailable: true,
    });
  });

  it("upsert is idempotent — re-running the same day writes the same where clause, not a duplicate row", async () => {
    ensureShopMetadata.mockResolvedValue({ ianaTimezone: "UTC", currencyCode: "USD" });
    findMany.mockResolvedValue([]);
    fetchShopifySalesDayTotals.mockImplementation(
      async (_admin: unknown, range: { since: string }) =>
        new Map([
          [
            range.since,
            {
              dayKey: range.since,
              totalSales: 500,
              netSales: 500,
              grossSales: 500,
              orderCount: 1,
              newCustomerNetSales: 0,
              returningCustomerNetSales: 0,
              customerMetricsAvailable: false,
            },
          ],
        ]),
    );

    const now = new Date("2026-07-15T12:00:00.000Z");
    await runSalesFactsBackfill(FAKE_ADMIN, "shop_1", { now, maxDays: 1 });
    await runSalesFactsBackfill(FAKE_ADMIN, "shop_1", { now, maxDays: 1 });

    expect(upsert).toHaveBeenCalledTimes(2);
    const firstWhere = upsert.mock.calls[0][0].where;
    const secondWhere = upsert.mock.calls[1][0].where;
    expect(secondWhere).toEqual(firstWhere);
    expect(upsert.mock.calls[1][0].create.sales).toBe(500);
    expect(upsert.mock.calls[1][0].update.sales).toBe(500);
  });

  it("resumes via missing dates — days already present in SalesDayFact are not refetched", async () => {
    ensureShopMetadata.mockResolvedValue({ ianaTimezone: "UTC", currencyCode: "USD" });
    findMany.mockResolvedValue([{ day: new Date("2026-07-14T00:00:00.000Z") }]);

    const now = new Date("2026-07-15T12:00:00.000Z");
    const result = await runSalesFactsBackfill(FAKE_ADMIN, "shop_1", { now, maxDays: 5 });

    expect(fetchShopifySales).not.toHaveBeenCalled();
    expect(fetchShopifySalesDayTotals).toHaveBeenCalledTimes(1);
    expect(result.attempted).toBe(5);
    for (const call of upsert.mock.calls) {
      expect(call[0].where.shopId_day.day.toISOString()).not.toBe(
        "2026-07-14T00:00:00.000Z",
      );
    }
  });

  it("leaves a day missing (does not upsert) when its Shopify fetch fails, so the next call retries it", async () => {
    ensureShopMetadata.mockResolvedValue({ ianaTimezone: "UTC", currencyCode: "USD" });
    findMany.mockResolvedValue([]);
    fetchShopifySalesDayTotals.mockRejectedValue(new Error("Shopify GraphQL error"));

    const now = new Date("2026-07-15T12:00:00.000Z");
    const result = await runSalesFactsBackfill(FAKE_ADMIN, "shop_1", { now, maxDays: 3 });

    expect(result.written).toBe(0);
    expect(result.failed).toHaveLength(3);
    expect(upsert).not.toHaveBeenCalled();
    expect(fetchShopifySales).not.toHaveBeenCalled();
  });

  it("reports remainingMissingDays when the window has more missing days than maxDays allows", async () => {
    ensureShopMetadata.mockResolvedValue({ ianaTimezone: "UTC", currencyCode: "USD" });
    findMany.mockResolvedValue([]);

    const now = new Date("2026-07-15T12:00:00.000Z");
    const result = await runSalesFactsBackfill(FAKE_ADMIN, "shop_1", { now, maxDays: 10 });

    expect(result.attempted).toBe(10);
    expect(result.remainingMissingDays).toBeGreaterThan(3000);
    expect(fetchShopifySales).not.toHaveBeenCalled();
  });

  it("writes a ShopifyQL $0 day instead of treating it as an unseen order page", async () => {
    ensureShopMetadata.mockResolvedValue({ ianaTimezone: "UTC", currencyCode: "USD" });
    findMany.mockResolvedValue([]);

    const now = new Date("2026-09-16T18:00:00.000Z");
    const result = await runSalesFactsBackfill(FAKE_ADMIN, "shop_1", {
      now,
      maxDays: 1,
      windowDays: 200,
    });

    expect(result.written).toBe(1);
    expect(result.unseen).toEqual([]);
    expect(upsert).toHaveBeenCalledTimes(1);
    expect(fetchShopifySales).not.toHaveBeenCalled();
  });

  it("does not page orders when the reports scope is missing", async () => {
    ensureShopMetadata.mockResolvedValue({ ianaTimezone: "UTC", currencyCode: "USD" });
    findMany.mockResolvedValue([]);
    fetchShopifySalesDayTotals.mockRejectedValue(
      new ShopifyReportsScopeError("Access denied for read_reports"),
    );

    const result = await runSalesFactsBackfill(FAKE_ADMIN, "shop_1", {
      now: new Date("2026-09-16T18:00:00.000Z"),
      maxDays: 5,
    });

    expect(result.skippedReason).toBe("reports_scope_missing");
    expect(result.written).toBe(0);
    expect(upsert).not.toHaveBeenCalled();
    expect(fetchShopifySales).not.toHaveBeenCalled();
  });

  it("counts remaining closed days without a SalesDayFact in the ingest window", async () => {
    findMany.mockResolvedValue([
      { day: new Date(Date.UTC(2026, 6, 14)) },
    ]);
    const remaining = await getSalesFactsWindowRemainingDays("shop_1", {
      ianaTimezone: "UTC",
      now: new Date("2026-07-15T12:00:00.000Z"),
      scopesAllowDeep: false,
    });
    expect(remaining).toBeGreaterThan(3000);
  });

  it("counts the ShopifyQL sales window, not a 24-month order crawl", async () => {
    findMany.mockResolvedValue([]);
    const remaining = await getSalesFactsWindowRemainingDays("shop_1", {
      ianaTimezone: "UTC",
      now: new Date("2026-09-17T12:00:00.000Z"),
      scopesAllowDeep: true,
    });
    expect(remaining).toBeGreaterThan(365 * 9);
  });

  it("uses the same sales window for unpaid shops when billing is on", async () => {
    const prev = process.env.MCFLY_BILLING;
    process.env.MCFLY_BILLING = "1";
    shopIsProForIngest.mockResolvedValue(false);
    findMany.mockResolvedValue([]);
    try {
      const remaining = await getSalesFactsWindowRemainingDays("shop_1", {
        ianaTimezone: "UTC",
        now: new Date("2026-09-17T12:00:00.000Z"),
        scopesAllowDeep: true,
      });
      expect(remaining).toBeGreaterThan(365 * 9);
    } finally {
      if (prev === undefined) delete process.env.MCFLY_BILLING;
      else process.env.MCFLY_BILLING = prev;
    }
  });
});

describe("getSalesFactsCoverage", () => {
  beforeEach(() => {
    findMany.mockReset();
    count.mockReset();
  });

  it("is complete when every expected closed day within the period has a fact row", async () => {
    // MTD range for a "now" of the 15th -> 14 closed days (1st through 14th).
    const now = new Date(2026, 6, 15, 9, 0, 0);
    const range = { start: new Date(2026, 6, 1), end: new Date(2026, 6, 15, 23, 59, 59, 999), label: "MTD" };
    findMany.mockResolvedValue(
      Array.from({ length: 14 }, (_, i) => ({
        day: new Date(2026, 6, i + 1),
        sales: i === 0 ? 0 : 10,
      })),
    );

    const coverage = await getSalesFactsCoverage("shop_1", range, now);

    expect(coverage.expectedClosedDays).toBe(14);
    expect(coverage.factDays).toBe(14);
    expect(coverage.complete).toBe(true);
    expect(coverage.periodExceedsFactWindow).toBe(false);
  });

  it("is incomplete when fewer fact rows exist than expected closed days", async () => {
    const now = new Date(2026, 6, 15, 9, 0, 0);
    const range = { start: new Date(2026, 6, 1), end: new Date(2026, 6, 15, 23, 59, 59, 999), label: "MTD" };
    findMany.mockResolvedValue(
      Array.from({ length: 9 }, (_, i) => ({
        day: new Date(2026, 6, i + 1),
        sales: 10,
      })),
    );

    const coverage = await getSalesFactsCoverage("shop_1", range, now);

    expect(coverage.expectedClosedDays).toBe(14);
    expect(coverage.factDays).toBe(9);
    expect(coverage.complete).toBe(false);
    expect(coverage.periodExceedsFactWindow).toBe(false);
  });

  it("marks periods incomplete when the range starts before the Jan-1 × 5yr fact window", async () => {
    // Window for mid-2026 starts 2021-01-01 — a 2020 start must exceed it.
    const now = new Date(2026, 6, 15, 9, 0, 0);
    const range = {
      start: new Date(2020, 0, 1),
      end: new Date(2026, 6, 15, 23, 59, 59, 999),
      label: "custom deep",
    };
    findMany.mockResolvedValue(
      Array.from({ length: 60 }, (_, i) => ({
        day: new Date(2026, 4, i + 1),
        sales: 10,
      })),
    );

    const coverage = await getSalesFactsCoverage("shop_1", range, now);

    expect(coverage.periodExceedsFactWindow).toBe(true);
    expect(coverage.complete).toBe(false);
  });

  it("does not count stored $0 days outside the Shopify order window as facts", async () => {
    const now = new Date("2026-09-16T18:00:00.000Z");
    const range = {
      start: new Date("2026-01-01T00:00:00.000Z"),
      end: new Date("2026-09-16T23:59:59.999Z"),
      label: "YTD",
    };
    findMany.mockResolvedValue([
      { day: new Date("2026-01-15T00:00:00.000Z"), sales: 0 },
      { day: new Date("2026-09-01T00:00:00.000Z"), sales: 0 },
      { day: new Date("2026-09-02T00:00:00.000Z"), sales: 400 },
    ]);

    const coverage = await getSalesFactsCoverage("shop_1", range, now);

    expect(coverage.factDays).toBe(2);
    expect(coverage.complete).toBe(false);
  });

  it("returns zero/incomplete when the period has no closed days yet", async () => {
    const now = new Date(2026, 6, 15, 9, 0, 0);
    const range = { start: now, end: new Date(now.getTime() + 1000), label: "today only" };

    const coverage = await getSalesFactsCoverage("shop_1", range, now);

    expect(coverage.expectedClosedDays).toBe(0);
    expect(coverage.complete).toBe(false);
    expect(coverage.periodExceedsFactWindow).toBe(false);
    expect(findMany).not.toHaveBeenCalled();
  });
});

describe("getSalesFactsTotals", () => {
  beforeEach(() => {
    findMany.mockReset();
  });

  it("sums sales/orders and labels new/returning as day-sums, not unique counts", async () => {
    findMany.mockResolvedValue([
      {
        day: new Date("2026-07-01T00:00:00.000Z"),
        sales: 100,
        orderCount: 2,
        newCustomers: 1,
        returningCustomers: 1,
        newCustomerNetSales: 40,
        returningCustomerNetSales: 60,
        customerMetricsAvailable: true,
        guestOrders: 0,
      },
      {
        day: new Date("2026-07-02T00:00:00.000Z"),
        sales: 200,
        orderCount: 3,
        newCustomers: 2,
        returningCustomers: 0,
        newCustomerNetSales: 200,
        returningCustomerNetSales: 0,
        customerMetricsAvailable: true,
        guestOrders: 1,
      },
    ]);

    const totals = await getSalesFactsTotals(
      "shop_1",
      {
        start: new Date("2026-07-01T00:00:00.000Z"),
        end: new Date("2026-07-02T23:59:59.999Z"),
        label: "range",
      },
      new Date("2026-07-15T12:00:00.000Z"),
    );

    expect(totals.totalSales).toBe(300);
    expect(totals.orderCount).toBe(5);
    expect(totals.newCustomersSum).toBe(3);
    expect(totals.returningCustomersSum).toBe(1);
    expect(totals.newCustomerNetSalesSum).toBe(240);
    expect(totals.returningCustomerNetSalesSum).toBe(60);
    expect(totals.customerMetricsAvailable).toBe(true);
    expect(totals.guestOrdersSum).toBe(1);
    expect(totals.dayCount).toBe(2);

    const sales = salesResultFromFactsTotals(totals, null);
    expect(sales.customerMetricsAvailable).toBe(true);
    expect(sales.newCustomerNetSales).toBe(240);
    expect(sales.returningCustomerNetSales).toBe(60);
  });

  it("keeps customerMetricsAvailable false when any fact day lacks the ShopifyQL split", async () => {
    findMany.mockResolvedValue([
      {
        day: new Date("2026-07-01T00:00:00.000Z"),
        sales: 100,
        orderCount: 1,
        newCustomers: 0,
        returningCustomers: 0,
        newCustomerNetSales: 40,
        returningCustomerNetSales: 60,
        customerMetricsAvailable: true,
        guestOrders: 0,
      },
      {
        day: new Date("2026-07-02T00:00:00.000Z"),
        sales: 50,
        orderCount: 1,
        newCustomers: 0,
        returningCustomers: 0,
        newCustomerNetSales: 0,
        returningCustomerNetSales: 0,
        customerMetricsAvailable: false,
        guestOrders: 0,
      },
    ]);

    const totals = await getSalesFactsTotals(
      "shop_1",
      {
        start: new Date("2026-07-01T00:00:00.000Z"),
        end: new Date("2026-07-02T23:59:59.999Z"),
        label: "range",
      },
      new Date("2026-07-15T12:00:00.000Z"),
    );

    expect(totals.customerMetricsAvailable).toBe(false);
    expect(salesResultFromFactsTotals(totals, null).customerMetricsAvailable).toBe(
      false,
    );
  });

  it("returns zeroed totals when no fact rows exist in range", async () => {
    findMany.mockResolvedValue([]);

    const totals = await getSalesFactsTotals("shop_1", {
      start: new Date("2026-07-01T00:00:00.000Z"),
      end: new Date("2026-07-02T23:59:59.999Z"),
      label: "range",
    });

    expect(totals.totalSales).toBe(0);
    expect(totals.dayCount).toBe(0);
  });

  it("does not sum stored $0 days outside the Shopify order window", async () => {
    findMany.mockResolvedValue([
      { day: new Date("2026-01-15T00:00:00.000Z"), sales: 0, orderCount: 0, newCustomers: 0, returningCustomers: 0, guestOrders: 0 },
      { day: new Date("2026-09-01T00:00:00.000Z"), sales: 250, orderCount: 2, newCustomers: 0, returningCustomers: 0, guestOrders: 0 },
    ]);

    const totals = await getSalesFactsTotals(
      "shop_1",
      {
        start: new Date("2026-01-01T00:00:00.000Z"),
        end: new Date("2026-09-16T23:59:59.999Z"),
        label: "YTD",
      },
      new Date("2026-09-16T18:00:00.000Z"),
    );

    expect(totals.totalSales).toBe(250);
    expect(totals.dayCount).toBe(1);
  });
});

describe("getSalesFactsByDay", () => {
  beforeEach(() => {
    findMany.mockReset();
  });

  it("keys sales by UTC calendar day, matching the sample-desk day-key convention", async () => {
    findMany.mockResolvedValue([
      { day: new Date("2026-07-14T00:00:00.000Z"), sales: 100 },
      { day: new Date("2026-07-15T00:00:00.000Z"), sales: 250 },
    ]);

    const map = await getSalesFactsByDay(
      "shop_1",
      {
        start: new Date("2026-07-01T00:00:00.000Z"),
        end: new Date("2026-07-15T23:59:59.999Z"),
      },
      { now: new Date("2026-07-20T12:00:00.000Z") },
    );

    expect(map.get("2026-07-14")).toBe(100);
    expect(map.get("2026-07-15")).toBe(250);
    expect(map.size).toBe(2);
  });

  it("merges multiple rows landing on the same UTC day key", async () => {
    findMany.mockResolvedValue([
      { day: new Date("2026-07-14T00:00:00.000Z"), sales: 100 },
      { day: new Date("2026-07-14T00:00:00.000Z"), sales: 50 },
    ]);

    const map = await getSalesFactsByDay(
      "shop_1",
      {
        start: new Date("2026-07-01T00:00:00.000Z"),
        end: new Date("2026-07-15T23:59:59.999Z"),
      },
      { now: new Date("2026-07-20T12:00:00.000Z") },
    );

    expect(map.get("2026-07-14")).toBe(150);
  });

  it("omits stored $0 days outside the Shopify order window", async () => {
    findMany.mockResolvedValue([
      { day: new Date("2026-01-15T00:00:00.000Z"), sales: 0 },
      { day: new Date("2026-09-01T00:00:00.000Z"), sales: 80 },
    ]);

    const map = await getSalesFactsByDay(
      "shop_1",
      {
        start: new Date("2026-01-01T00:00:00.000Z"),
        end: new Date("2026-09-16T23:59:59.999Z"),
      },
      { now: new Date("2026-09-16T18:00:00.000Z") },
    );

    expect(map.has("2026-01-15")).toBe(false);
    expect(map.get("2026-09-01")).toBe(80);
    expect(map.size).toBe(1);
  });
});
