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
vi.mock("./shop-metadata.server", () => ({
  ensureShopMetadata: (...args: unknown[]) => ensureShopMetadata(...args),
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
  SALES_DAY_FACT_SOURCE,
} from "./sales-facts.server";

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
  });

  it("skips ingest entirely (honest) when ianaTimezone is unknown even after a sync attempt", async () => {
    ensureShopMetadata.mockResolvedValue({ ianaTimezone: null, currencyCode: null });

    const result = await runSalesFactsBackfill(FAKE_ADMIN, "shop_1", {
      now: new Date("2026-07-15T12:00:00.000Z"),
    });

    expect(result.skippedReason).toBe("no_timezone");
    expect(result.attempted).toBe(0);
    expect(result.written).toBe(0);
    expect(fetchShopifySales).not.toHaveBeenCalled();
    expect(upsert).not.toHaveBeenCalled();
  });

  it("upserts one SalesDayFact per closed day on the shopId_day unique key, including zero-sales days", async () => {
    ensureShopMetadata.mockResolvedValue({ ianaTimezone: "UTC", currencyCode: "USD" });
    findMany.mockResolvedValue([]); // nothing ingested yet
    fetchShopifySales.mockResolvedValue(fakeSales(0)); // legitimate zero-sales day

    const now = new Date("2026-07-15T12:00:00.000Z");
    const result = await runSalesFactsBackfill(FAKE_ADMIN, "shop_1", { now, maxDays: 3 });

    expect(result.skippedReason).toBeNull();
    expect(result.attempted).toBe(3);
    expect(result.written).toBe(3);
    expect(result.failed).toEqual([]);
    expect(upsert).toHaveBeenCalledTimes(3);

    const call = upsert.mock.calls[0][0];
    expect(call.where).toHaveProperty("shopId_day");
    expect(call.where.shopId_day.shopId).toBe("shop_1");
    expect(call.create.sales).toBe(0);
    expect(call.create.source).toBe(SALES_DAY_FACT_SOURCE);
  });

  it("upsert is idempotent — re-running the same day writes the same where clause, not a duplicate row", async () => {
    ensureShopMetadata.mockResolvedValue({ ianaTimezone: "UTC", currencyCode: "USD" });
    findMany.mockResolvedValue([]);
    fetchShopifySales.mockResolvedValue(fakeSales(500));

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
    // Pretend the most recent closed day (2026-07-14) already has a fact row.
    findMany.mockResolvedValue([{ day: new Date("2026-07-14T00:00:00.000Z") }]);
    fetchShopifySales.mockResolvedValue(fakeSales(100));

    const now = new Date("2026-07-15T12:00:00.000Z");
    const result = await runSalesFactsBackfill(FAKE_ADMIN, "shop_1", { now, maxDays: 5 });

    // Window of 60 days minus the 1 already-present day; only missing days are attempted.
    expect(fetchShopifySales).toHaveBeenCalledTimes(5);
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
    fetchShopifySales
      .mockResolvedValueOnce(fakeSales(10))
      .mockRejectedValueOnce(new Error("Shopify GraphQL error"))
      .mockResolvedValueOnce(fakeSales(30));

    const now = new Date("2026-07-15T12:00:00.000Z");
    const result = await runSalesFactsBackfill(FAKE_ADMIN, "shop_1", { now, maxDays: 3 });

    expect(result.written).toBe(2);
    expect(result.failed).toHaveLength(1);
    expect(upsert).toHaveBeenCalledTimes(2);
  });

  it("reports remainingMissingDays when the window has more missing days than maxDays allows", async () => {
    ensureShopMetadata.mockResolvedValue({ ianaTimezone: "UTC", currencyCode: "USD" });
    findMany.mockResolvedValue([]);
    fetchShopifySales.mockResolvedValue(fakeSales(0));

    const now = new Date("2026-07-15T12:00:00.000Z");
    const result = await runSalesFactsBackfill(FAKE_ADMIN, "shop_1", { now, maxDays: 10 });

    // Jan-1 × 4yr window (not a fixed 60d) — 10 attempted this call leaves the rest.
    expect(result.attempted).toBe(10);
    expect(result.remainingMissingDays).toBeGreaterThan(50);
  });
});

describe("getSalesFactsCoverage", () => {
  beforeEach(() => {
    count.mockReset();
  });

  it("is complete when every expected closed day within the period has a fact row", async () => {
    // MTD range for a "now" of the 15th -> 14 closed days (1st through 14th).
    const now = new Date(2026, 6, 15, 9, 0, 0);
    const range = { start: new Date(2026, 6, 1), end: new Date(2026, 6, 15, 23, 59, 59, 999), label: "MTD" };
    count.mockResolvedValue(14);

    const coverage = await getSalesFactsCoverage("shop_1", range, now);

    expect(coverage.expectedClosedDays).toBe(14);
    expect(coverage.factDays).toBe(14);
    expect(coverage.complete).toBe(true);
    expect(coverage.periodExceedsFactWindow).toBe(false);
  });

  it("is incomplete when fewer fact rows exist than expected closed days", async () => {
    const now = new Date(2026, 6, 15, 9, 0, 0);
    const range = { start: new Date(2026, 6, 1), end: new Date(2026, 6, 15, 23, 59, 59, 999), label: "MTD" };
    count.mockResolvedValue(9);

    const coverage = await getSalesFactsCoverage("shop_1", range, now);

    expect(coverage.expectedClosedDays).toBe(14);
    expect(coverage.factDays).toBe(9);
    expect(coverage.complete).toBe(false);
    expect(coverage.periodExceedsFactWindow).toBe(false);
  });

  it("marks periods incomplete when the range starts before the Jan-1 × 4yr fact window", async () => {
    // Window for mid-2026 starts 2022-01-01 — a 2021 start must exceed it.
    const now = new Date(2026, 6, 15, 9, 0, 0);
    const range = {
      start: new Date(2021, 0, 1),
      end: new Date(2026, 6, 15, 23, 59, 59, 999),
      label: "custom deep",
    };
    count.mockResolvedValue(60);

    const coverage = await getSalesFactsCoverage("shop_1", range, now);

    expect(coverage.periodExceedsFactWindow).toBe(true);
    expect(coverage.complete).toBe(false);
  });

  it("returns zero/incomplete when the period has no closed days yet", async () => {
    const now = new Date(2026, 6, 15, 9, 0, 0);
    const range = { start: now, end: new Date(now.getTime() + 1000), label: "today only" };

    const coverage = await getSalesFactsCoverage("shop_1", range, now);

    expect(coverage.expectedClosedDays).toBe(0);
    expect(coverage.complete).toBe(false);
    expect(coverage.periodExceedsFactWindow).toBe(false);
    expect(count).not.toHaveBeenCalled();
  });
});

describe("getSalesFactsTotals", () => {
  beforeEach(() => {
    findMany.mockReset();
  });

  it("sums sales/orders and labels new/returning as day-sums, not unique counts", async () => {
    findMany.mockResolvedValue([
      { sales: 100, orderCount: 2, newCustomers: 1, returningCustomers: 1, guestOrders: 0 },
      { sales: 200, orderCount: 3, newCustomers: 2, returningCustomers: 0, guestOrders: 1 },
    ]);

    const totals = await getSalesFactsTotals("shop_1", {
      start: new Date("2026-07-01T00:00:00.000Z"),
      end: new Date("2026-07-02T23:59:59.999Z"),
      label: "range",
    });

    expect(totals.totalSales).toBe(300);
    expect(totals.orderCount).toBe(5);
    expect(totals.newCustomersSum).toBe(3);
    expect(totals.returningCustomersSum).toBe(1);
    expect(totals.guestOrdersSum).toBe(1);
    expect(totals.dayCount).toBe(2);
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

    const map = await getSalesFactsByDay("shop_1", {
      start: new Date("2026-07-01T00:00:00.000Z"),
      end: new Date("2026-07-15T23:59:59.999Z"),
    });

    expect(map.get("2026-07-14")).toBe(100);
    expect(map.get("2026-07-15")).toBe(250);
    expect(map.size).toBe(2);
  });

  it("merges multiple rows landing on the same UTC day key", async () => {
    findMany.mockResolvedValue([
      { day: new Date("2026-07-14T00:00:00.000Z"), sales: 100 },
      { day: new Date("2026-07-14T00:00:00.000Z"), sales: 50 },
    ]);

    const map = await getSalesFactsByDay("shop_1", {
      start: new Date("2026-07-01T00:00:00.000Z"),
      end: new Date("2026-07-15T23:59:59.999Z"),
    });

    expect(map.get("2026-07-14")).toBe(150);
  });
});
