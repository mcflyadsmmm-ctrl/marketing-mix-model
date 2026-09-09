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
  loadDeskSalesForPeriod,
  salesFactsBackfillWindowDayCount,
  salesDayFactWindowDayCount,
  selectSalesFactsBackfillDays,
  salesFactsDayFilter,
  shouldProbeLivePeriodSales,
  SALES_DAY_FACT_SOURCE,
} from "./sales-facts.server";
import {
  salesFactsIncompleteForDesk,
  salesFactsNeedRefreshExisting,
  salesFactsNeedSyncFill,
} from "./sales-facts-honesty";
import { SHOPIFY_READ_ORDERS_WINDOW_DAYS } from "./periods";

const FAKE_ADMIN = {} as never;

function fakeSales(totalSales = 0, orderCount = 0) {
  return {
    totalSales,
    orderCount,
    newCustomers: 0,
    returningCustomers: 0,
    guestOrders: 0,
    customerMetricsAvailable: true,
    source: "shopify" as const,
  };
}

describe("selectSalesFactsBackfillDays", () => {
  const oldestFirst = ["2026-07-01", "2026-07-02", "2026-08-01", "2026-09-07"];

  it("defaults to newest-first so QTD / MTD fill before a 4-year crawl", () => {
    expect(
      selectSalesFactsBackfillDays({
        missingOldestFirst: oldestFirst,
        maxDays: 2,
      }),
    ).toEqual(["2026-09-07", "2026-08-01"]);
  });

  it("fills the selected period first, newest day inside it", () => {
    expect(
      selectSalesFactsBackfillDays({
        missingOldestFirst: oldestFirst,
        maxDays: 2,
        priorityStartKey: "2026-07-01",
        priorityEndKey: "2026-09-30",
      }),
    ).toEqual(["2026-09-07", "2026-08-01"]);
    expect(
      selectSalesFactsBackfillDays({
        missingOldestFirst: oldestFirst,
        maxDays: 1,
        priorityStartKey: "2026-07-01",
        priorityEndKey: "2026-07-31",
      }),
    ).toEqual(["2026-07-02"]);
  });

  it("can still walk oldest-first when a caller asks", () => {
    expect(
      selectSalesFactsBackfillDays({
        missingOldestFirst: oldestFirst,
        maxDays: 2,
        newestFirst: false,
      }),
    ).toEqual(["2026-07-01", "2026-07-02"]);
  });
});

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

  it("ingests newest missing closed days first so QTD is not starved by a 4-year crawl", async () => {
    ensureShopMetadata.mockResolvedValue({ ianaTimezone: "UTC", currencyCode: "USD" });
    findMany.mockResolvedValue([]);
    fetchShopifySales.mockResolvedValue(fakeSales(100));

    const now = new Date("2026-07-15T12:00:00.000Z");
    await runSalesFactsBackfill(FAKE_ADMIN, "shop_1", { now, maxDays: 2 });

    const firstRange = fetchShopifySales.mock.calls[0][1] as { label: string };
    expect(firstRange.label).toBe("2026-07-14");
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
    const result = await runSalesFactsBackfill(FAKE_ADMIN, "shop_1", {
      now,
      maxDays: 10,
      scopesAllowDeep: true,
    });

    // Jan-1 × 4yr window (not a fixed 60d) — 10 attempted this call leaves the rest.
    expect(result.attempted).toBe(10);
    expect(result.remainingMissingDays).toBeGreaterThan(50);
  });

  it("fail-closed 60-day window when read_all_orders is absent", async () => {
    ensureShopMetadata.mockResolvedValue({ ianaTimezone: "UTC", currencyCode: "USD" });
    findMany.mockResolvedValue([]);
    fetchShopifySales.mockResolvedValue(fakeSales(0));

    const now = new Date("2026-07-15T12:00:00.000Z");
    const result = await runSalesFactsBackfill(FAKE_ADMIN, "shop_1", {
      now,
      maxDays: 10,
      scopesAllowDeep: false,
    });

    expect(result.attempted).toBe(10);
    expect(result.remainingMissingDays).toBe(SHOPIFY_READ_ORDERS_WINDOW_DAYS - 10);
  });
});

describe("salesFactsBackfillWindowDayCount", () => {
  const now = new Date("2026-07-15T12:00:00.000Z");

  it("uses the Jan-1 × 4yr horizon when scopes allow deep", () => {
    expect(salesFactsBackfillWindowDayCount(now, true)).toBe(
      salesDayFactWindowDayCount(now),
    );
    expect(salesFactsBackfillWindowDayCount(now, true)).toBeGreaterThan(
      SHOPIFY_READ_ORDERS_WINDOW_DAYS,
    );
  });

  it("uses the 60-day read_orders window when scopes omit read_all_orders", () => {
    expect(salesFactsBackfillWindowDayCount(now, false)).toBe(
      SHOPIFY_READ_ORDERS_WINDOW_DAYS,
    );
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

describe("salesFactsDayFilter (shop-local vs UTC-midnight facts)", () => {
  it("includes the first Denver calendar day stored at UTC midnight", () => {
    // Sept 1 00:00 America/Denver = 2026-09-01T06:00Z; fact row is 2026-09-01T00:00Z.
    const filter = salesFactsDayFilter(
      {
        start: new Date("2026-09-01T06:00:00.000Z"),
        end: new Date("2026-09-10T05:59:59.999Z"),
      },
      "America/Denver",
    );
    expect(filter.gte.toISOString()).toBe("2026-09-01T00:00:00.000Z");
    expect(filter.lte.toISOString()).toBe("2026-09-09T00:00:00.000Z");
  });

  it("does not pull the prior UTC calendar day for Sydney MTD", () => {
    // Jan 1 00:00 Australia/Sydney (AEDT UTC+11) = 2025-12-31T13:00Z.
    const filter = salesFactsDayFilter(
      {
        start: new Date("2025-12-31T13:00:00.000Z"),
        end: new Date("2026-01-31T12:59:59.999Z"),
      },
      "Australia/Sydney",
    );
    expect(filter.gte.toISOString()).toBe("2026-01-01T00:00:00.000Z");
  });
});

describe("salesFactsIncompleteForDesk", () => {
  const completeZero = {
    expectedClosedDays: 8,
    factDays: 8,
    complete: true,
    periodExceedsFactWindow: false,
  };

  it("treats null coverage and untrusted $0 as incomplete", () => {
    expect(salesFactsIncompleteForDesk(null)).toBe(true);
    expect(
      salesFactsIncompleteForDesk(completeZero, { salesUntrustedZero: true }),
    ).toBe(true);
  });

  it("treats empty facts as incomplete even when expectedClosedDays is 0", () => {
    expect(
      salesFactsIncompleteForDesk({
        expectedClosedDays: 0,
        factDays: 0,
        complete: false,
        periodExceedsFactWindow: false,
      }),
    ).toBe(true);
  });

  it("is incomplete when closed days are missing", () => {
    expect(
      salesFactsIncompleteForDesk({
        expectedClosedDays: 8,
        factDays: 0,
        complete: false,
        periodExceedsFactWindow: false,
      }),
    ).toBe(true);
  });

  it("does not trust complete $0 rows without a live confirm (poisoned facts)", () => {
    expect(salesFactsIncompleteForDesk(completeZero)).toBe(true);
    expect(
      salesFactsIncompleteForDesk(completeZero, { sales: 0 }),
    ).toBe(true);
  });

  it("trusts complete $0 only after a live Admin confirm this request", () => {
    expect(
      salesFactsIncompleteForDesk(completeZero, {
        sales: 0,
        liveConfirmedZero: true,
      }),
    ).toBe(false);
  });

  it("keeps a real multiple trusted even while coverage is still filling", () => {
    expect(
      salesFactsIncompleteForDesk(
        {
          expectedClosedDays: 8,
          factDays: 3,
          complete: false,
          periodExceedsFactWindow: false,
        },
        { sales: 840 },
      ),
    ).toBe(true);
  });
});

describe("salesFactsNeedSyncFill", () => {
  const complete = {
    expectedClosedDays: 8,
    factDays: 8,
    complete: true,
    periodExceedsFactWindow: false,
  };
  const empty = {
    expectedClosedDays: 8,
    factDays: 0,
    complete: false,
    periodExceedsFactWindow: false,
  };

  it("fills on page-open when coverage is complete but the period is $0", () => {
    expect(
      salesFactsNeedSyncFill({
        mainCoverage: complete,
        dayCoverage: complete,
        periodSales: 0,
        periodOrders: 0,
      }),
    ).toBe(true);
    expect(
      salesFactsNeedRefreshExisting({
        factDays: 8,
        periodSales: 0,
        periodOrders: 0,
      }),
    ).toBe(true);
  });

  it("fills when the fact table is empty", () => {
    expect(
      salesFactsNeedSyncFill({
        mainCoverage: empty,
        dayCoverage: empty,
        periodSales: 0,
        periodOrders: 0,
      }),
    ).toBe(true);
  });

  it("does not block paint with a sync crawl once the period has sales", () => {
    expect(
      salesFactsNeedSyncFill({
        mainCoverage: complete,
        dayCoverage: complete,
        periodSales: 840,
        periodOrders: 7,
      }),
    ).toBe(false);
    expect(
      salesFactsNeedRefreshExisting({
        factDays: 8,
        periodSales: 840,
        periodOrders: 7,
      }),
    ).toBe(false);
  });
});

describe("shouldProbeLivePeriodSales", () => {
  const mtd = {
    start: new Date("2026-09-01T06:00:00.000Z"),
    end: new Date("2026-09-09T05:59:59.999Z"),
    label: "Month to date",
  };

  it("probes MTD when stored facts are $0 / 0 orders", () => {
    expect(
      shouldProbeLivePeriodSales({
        factSales: 0,
        factOrders: 0,
        period: mtd,
        coverage: {
          expectedClosedDays: 8,
          factDays: 8,
          complete: true,
          periodExceedsFactWindow: false,
        },
      }),
    ).toBe(true);
  });

  it("does not probe when facts already have sales", () => {
    expect(
      shouldProbeLivePeriodSales({
        factSales: 1200,
        factOrders: 7,
        period: mtd,
        coverage: {
          expectedClosedDays: 8,
          factDays: 8,
          complete: true,
          periodExceedsFactWindow: false,
        },
      }),
    ).toBe(false);
  });

  it("does not probe wide windows", () => {
    expect(
      shouldProbeLivePeriodSales({
        factSales: 0,
        factOrders: 0,
        period: {
          start: new Date("2026-01-01T00:00:00.000Z"),
          end: new Date("2026-09-09T00:00:00.000Z"),
          label: "YTD",
        },
        coverage: {
          expectedClosedDays: 250,
          factDays: 250,
          complete: true,
          periodExceedsFactWindow: false,
        },
      }),
    ).toBe(false);
  });
});

describe("runSalesFactsBackfill refreshExisting", () => {
  beforeEach(() => {
    findMany.mockReset();
    upsert.mockReset();
    count.mockReset();
    ensureShopMetadata.mockReset();
    fetchShopifySales.mockReset();
  });

  it("re-fetches existing newest days so poisoned $0 facts can be overwritten", async () => {
    ensureShopMetadata.mockResolvedValue({
      ianaTimezone: "UTC",
      currencyCode: "USD",
    });
    findMany.mockResolvedValue([{ day: new Date("2026-07-14T00:00:00.000Z") }]);
    fetchShopifySales.mockResolvedValue(fakeSales(350, 2));

    const now = new Date("2026-07-15T12:00:00.000Z");
    await runSalesFactsBackfill(FAKE_ADMIN, "shop_1", {
      now,
      maxDays: 1,
      refreshExisting: true,
    });

    const firstRange = fetchShopifySales.mock.calls[0][1] as { label: string };
    expect(firstRange.label).toBe("2026-07-14");
    expect(upsert).toHaveBeenCalled();
    expect(upsert.mock.calls[0][0].update.sales).toBe(350);
  });
});

describe("loadDeskSalesForPeriod live MTD probe", () => {
  beforeEach(() => {
    findMany.mockReset();
    count.mockReset();
    fetchShopifySales.mockReset();
  });

  it("prefers bounded live Admin orders when stored facts are $0", async () => {
    count.mockResolvedValue(8);
    findMany.mockResolvedValue([
      {
        sales: 0,
        netSales: 0,
        grossSales: 0,
        orderCount: 0,
        newCustomers: 0,
        returningCustomers: 0,
        newCustomerNetSales: 0,
        returningCustomerNetSales: 0,
        guestOrders: 0,
      },
    ]);
    fetchShopifySales
      .mockResolvedValueOnce(fakeSales(0, 0)) // today top-up
      .mockResolvedValueOnce(fakeSales(840, 7)); // period probe

    const result = await loadDeskSalesForPeriod({
      admin: FAKE_ADMIN,
      shopId: "shop_1",
      range: {
        start: new Date("2026-09-01T00:00:00.000Z"),
        end: new Date("2026-09-09T23:59:59.999Z"),
        label: "Month to date",
      },
      ianaTimezone: "UTC",
      now: new Date("2026-09-09T18:00:00.000Z"),
    });

    expect(result.usedLivePeriodProbe).toBe(true);
    expect(result.salesUntrustedZero).toBe(false);
    expect(result.sales.totalSales).toBe(840);
    expect(result.sales.orderCount).toBe(7);
    expect(result.factsCoverage?.complete).toBe(false);
  });

  it("does not treat a search-query $0 as a trusted quiet period (demvcflyads smoke)", async () => {
    count.mockResolvedValue(8);
    findMany.mockResolvedValue([
      {
        sales: 0,
        netSales: 0,
        grossSales: 0,
        orderCount: 0,
        newCustomers: 0,
        returningCustomers: 0,
        newCustomerNetSales: 0,
        returningCustomerNetSales: 0,
        guestOrders: 0,
      },
    ]);
    fetchShopifySales
      .mockResolvedValueOnce(fakeSales(0, 0)) // today top-up
      .mockResolvedValueOnce(fakeSales(0, 0)); // period probe — same search, 7 Admin orders missed

    const result = await loadDeskSalesForPeriod({
      admin: FAKE_ADMIN,
      shopId: "shop_1",
      range: {
        start: new Date("2026-09-01T00:00:00.000Z"),
        end: new Date("2026-09-09T23:59:59.999Z"),
        label: "Month to date",
      },
      ianaTimezone: "UTC",
      now: new Date("2026-09-09T18:00:00.000Z"),
    });

    expect(result.sales.totalSales).toBe(0);
    expect(result.salesUntrustedZero).toBe(true);
    expect(fetchShopifySales.mock.calls[1]?.[2]).toMatchObject({
      mode: "recent_scan",
    });
  });

  it("marks $0 untrusted when the live probe throws", async () => {
    count.mockResolvedValue(8);
    findMany.mockResolvedValue([]);
    fetchShopifySales
      .mockResolvedValueOnce(fakeSales(0, 0))
      .mockRejectedValueOnce(new Error("Shopify GraphQL error"));

    const result = await loadDeskSalesForPeriod({
      admin: FAKE_ADMIN,
      shopId: "shop_1",
      range: {
        start: new Date("2026-09-01T00:00:00.000Z"),
        end: new Date("2026-09-09T23:59:59.999Z"),
        label: "Month to date",
      },
      ianaTimezone: "UTC",
      now: new Date("2026-09-09T18:00:00.000Z"),
    });

    expect(result.sales.totalSales).toBe(0);
    expect(result.salesUntrustedZero).toBe(true);
    expect(result.usedLivePeriodProbe).toBe(false);
  });
});
