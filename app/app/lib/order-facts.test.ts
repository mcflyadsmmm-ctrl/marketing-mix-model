/**
 * OrderFact ingest amount must match desk orderNetAmount semantics so till LTV
 * / cohorts do not undercount when currentTotal is empty string (NaN→0 bug).
 *
 * Day-complete seals: refunds/cancels must clear `__day_complete__` so backfill
 * re-crawls nets — otherwise LTV stays stale forever after the first seal.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LIVE_UNPAID_INGEST_DAYS } from "./live-unpark";
import { orderNetAmount } from "./shopify-sales.server";
import { ORDER_FACT_PAGES_COST_SAFE_CAP } from "./shopify-graphql-cost.server";

const {
  deleteManyOrderFact,
  countOrderFact,
  findManyOrderFact,
  upsertOrderFact,
  updateManyBackfill,
  upsertBackfill,
  updateBackfill,
  findUniqueBackfill,
  upsertCohort,
  enqueueJob,
  ensureShopMetadata,
  adminGraphqlJson,
  shopIsProForIngest,
} = vi.hoisted(() => ({
  deleteManyOrderFact: vi.fn(),
  countOrderFact: vi.fn(),
  findManyOrderFact: vi.fn(),
  upsertOrderFact: vi.fn(),
  updateManyBackfill: vi.fn(),
  upsertBackfill: vi.fn(),
  updateBackfill: vi.fn(),
  findUniqueBackfill: vi.fn(),
  upsertCohort: vi.fn(),
  enqueueJob: vi.fn(),
  ensureShopMetadata: vi.fn(),
  adminGraphqlJson: vi.fn(),
  shopIsProForIngest: vi.fn(),
}));

vi.mock("../db.server", () => ({
  default: {
    orderFact: {
      deleteMany: (...args: unknown[]) => deleteManyOrderFact(...args),
      count: (...args: unknown[]) => countOrderFact(...args),
      findMany: (...args: unknown[]) => findManyOrderFact(...args),
      upsert: (...args: unknown[]) => upsertOrderFact(...args),
    },
    orderBackfillState: {
      updateMany: (...args: unknown[]) => updateManyBackfill(...args),
      upsert: (...args: unknown[]) => upsertBackfill(...args),
      update: (...args: unknown[]) => updateBackfill(...args),
      findUnique: (...args: unknown[]) => findUniqueBackfill(...args),
    },
    cohortFact: {
      upsert: (...args: unknown[]) => upsertCohort(...args),
    },
  },
}));

vi.mock("./job-queue.server", () => ({
  enqueueJob: (...args: unknown[]) => enqueueJob(...args),
}));

vi.mock("./shop-metadata.server", () => ({
  ensureShopMetadata: (...args: unknown[]) => ensureShopMetadata(...args),
}));

vi.mock("./live-ingest-depth.server", () => ({
  shopIsProForIngest: (...args: unknown[]) => shopIsProForIngest(...args),
}));

vi.mock("./shopify-graphql-cost.server", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("./shopify-graphql-cost.server")>();
  return {
    ...actual,
    adminGraphqlJson: (...args: unknown[]) => adminGraphqlJson(...args),
  };
});

import {
  BACKFILL_ORDER_FACTS_JOB,
  ORDER_FACT_DAY_COMPLETE_PREFIX,
  ORDER_FACT_MAX_PAGES_PER_RUN,
  ORDER_FACT_PAGE_CURSOR_PREFIX,
  ORDER_FACT_SOURCE,
  clearOrderFactDayCompleteSeal,
  computeCohortRollups,
  getOrderBackfillProgress,
  orderFactDayCompleteMarkerId,
  orderFactPageCursorMarker,
  parseOrderFactPageCursor,
  resolveOrderFactMaxPages,
  runOrderFactsBackfill,
  shouldSealOrderFactDay,
  unsealOrderFactsMissingV2,
} from "./order-facts.server";

const here = dirname(fileURLToPath(import.meta.url));
const orderFactsSource = readFileSync(
  join(here, "order-facts.server.ts"),
  "utf8",
);

describe("OrderFact amount = orderNetAmount", () => {
  it("reuses orderNetAmount (no local parseFloat coalesce)", () => {
    expect(orderFactsSource).toContain("orderNetAmount");
    expect(orderFactsSource).toMatch(/amount\s*=\s*orderNetAmount\(/);
    expect(orderFactsSource).toContain("grossAmount: orderGrossAmount(node)");
    expect(orderFactsSource).not.toMatch(
      /parseFloat\(\s*netRaw\s*\?\?\s*grossRaw/,
    );
  });

  it("falls back to gross when currentTotal amount is empty string", () => {
    // Regression: "" ?? gross → "" → parseFloat → NaN → 0 undercount.
    expect(
      orderNetAmount({
        totalPriceSet: { shopMoney: { amount: "120.00" } },
        currentTotalPriceSet: { shopMoney: { amount: "" } },
      }),
    ).toBe(120);
  });

  it("keeps fully refunded currentTotal=0 (never falls back to gross)", () => {
    expect(
      orderNetAmount({
        totalPriceSet: { shopMoney: { amount: "120.00" } },
        currentTotalPriceSet: { shopMoney: { amount: "0.00" } },
      }),
    ).toBe(0);
  });

  it("uses positive net when present", () => {
    expect(
      orderNetAmount({
        totalPriceSet: { shopMoney: { amount: "120.00" } },
        currentTotalPriceSet: { shopMoney: { amount: "95.50" } },
      }),
    ).toBe(95.5);
  });
});

describe("orderFactDayCompleteMarkerId", () => {
  it("builds the seal id backfill writes and skips", () => {
    expect(orderFactDayCompleteMarkerId("2026-07-20")).toBe(
      `${ORDER_FACT_DAY_COMPLETE_PREFIX}2026-07-20`,
    );
    expect(ORDER_FACT_DAY_COMPLETE_PREFIX).toBe("__day_complete__:");
  });
});

describe("clearOrderFactDayCompleteSeal", () => {
  beforeEach(() => {
    deleteManyOrderFact.mockReset();
    deleteManyOrderFact.mockResolvedValue({ count: 1 });
    findUniqueBackfill.mockReset();
    findUniqueBackfill.mockResolvedValue(null);
    updateManyBackfill.mockReset();
  });

  it("deletes only the live seal marker for shop + day", async () => {
    const n = await clearOrderFactDayCompleteSeal("shop_1", "2026-07-20");
    expect(n).toBe(1);
    expect(deleteManyOrderFact).toHaveBeenCalledWith({
      where: {
        shopId: "shop_1",
        source: ORDER_FACT_SOURCE,
        shopifyOrderId: "__day_complete__:2026-07-20",
      },
    });
  });

  it("returns 0 and skips DB when dayKey is not YYYY-MM-DD (fail closed)", async () => {
    expect(await clearOrderFactDayCompleteSeal("shop_1", "")).toBe(0);
    expect(await clearOrderFactDayCompleteSeal("shop_1", "2026/07/20")).toBe(0);
    expect(await clearOrderFactDayCompleteSeal("shop_1", "not-a-day")).toBe(0);
    expect(await clearOrderFactDayCompleteSeal("", "2026-07-20")).toBe(0);
    expect(deleteManyOrderFact).not.toHaveBeenCalled();
  });

  it("returns 0 when no seal row exists (idempotent dirty)", async () => {
    deleteManyOrderFact.mockResolvedValue({ count: 0 });
    expect(await clearOrderFactDayCompleteSeal("shop_1", "2026-07-20")).toBe(0);
    expect(deleteManyOrderFact).toHaveBeenCalledOnce();
  });

  it("clears a matching __page__ resume so a refund restarts the truncated day", async () => {
    findUniqueBackfill.mockResolvedValue({
      cursor: orderFactPageCursorMarker("2026-07-20", "gid://cursor/9"),
    });
    await clearOrderFactDayCompleteSeal("shop_1", "2026-07-20");
    expect(updateManyBackfill).toHaveBeenCalledWith({
      where: { shopId: "shop_1" },
      data: { cursor: null },
    });
  });
});

describe("OrderFact v2 crawl", () => {
  it("selects discount, sourceName, unit quantity, and discount code without SKUs", () => {
    expect(orderFactsSource).toContain("currentTotalDiscountsSet");
    expect(orderFactsSource).toContain("sourceName");
    expect(orderFactsSource).toContain("currentSubtotalLineItemsQuantity");
    expect(orderFactsSource).toContain("numberOfOrders");
    expect(orderFactsSource).toContain("discountApplications(first: 5)");
    expect(orderFactsSource).toContain("DiscountCodeApplication");
    expect(orderFactsSource).toContain("discountCode");
    expect(orderFactsSource).not.toMatch(/\b(?:sku|vendor|lineItems)\b/);
    expect(orderFactsSource).toContain("unsealOrderFactsMissingV2");
    expect(orderFactsSource).toContain("seedSampleOrderFacts");
    // Codes fill on crawl — never reset the backfill cursor for codes alone.
    expect(orderFactsSource).not.toMatch(/unsealOrderFactsMissingDiscountCode/);
  });
});

describe("unsealOrderFactsMissingV2", () => {
  beforeEach(() => {
    deleteManyOrderFact.mockReset();
    countOrderFact.mockReset();
    updateManyBackfill.mockReset();
    updateManyBackfill.mockResolvedValue({ count: 1 });
  });

  it("does not drop seals when every live row already has unitCount", async () => {
    countOrderFact.mockResolvedValue(0);
    expect(await unsealOrderFactsMissingV2("shop_1")).toBe(0);
    expect(deleteManyOrderFact).not.toHaveBeenCalled();
  });

  it("drops day-complete seals when live rows still lack unitCount", async () => {
    countOrderFact.mockResolvedValue(12);
    deleteManyOrderFact.mockResolvedValue({ count: 7 });
    expect(await unsealOrderFactsMissingV2("shop_1")).toBe(7);
    expect(deleteManyOrderFact).toHaveBeenCalledWith({
      where: {
        shopId: "shop_1",
        source: ORDER_FACT_SOURCE,
        shopifyOrderId: { startsWith: ORDER_FACT_DAY_COMPLETE_PREFIX },
      },
    });
    expect(updateManyBackfill).toHaveBeenCalledWith({
      where: { shopId: "shop_1" },
      data: { cursor: null },
    });
  });
});

describe("shouldSealOrderFactDay", () => {
  it("never seals a page-capped or still-paginating day", () => {
    expect(
      shouldSealOrderFactDay({
        truncated: true,
        historyLimited: false,
        hasMorePages: true,
      }),
    ).toBe(false);
    expect(
      shouldSealOrderFactDay({
        truncated: false,
        historyLimited: false,
        hasMorePages: true,
      }),
    ).toBe(false);
    expect(
      shouldSealOrderFactDay({
        truncated: false,
        historyLimited: true,
        hasMorePages: false,
      }),
    ).toBe(false);
  });

  it("seals only a finished crawl", () => {
    expect(
      shouldSealOrderFactDay({
        truncated: false,
        historyLimited: false,
        hasMorePages: false,
      }),
    ).toBe(true);
  });
});

describe("OrderFact page cursor resume", () => {
  it("round-trips a GraphQL cursor without treating it as a completed day", () => {
    const marker = orderFactPageCursorMarker(
      "2026-07-14",
      "gid://shopify/cursor/abc",
    );
    expect(marker.startsWith(ORDER_FACT_PAGE_CURSOR_PREFIX)).toBe(true);
    expect(parseOrderFactPageCursor(marker)).toEqual({
      dayKey: "2026-07-14",
      graphqlCursor: "gid://shopify/cursor/abc",
    });
    expect(parseOrderFactPageCursor("2026-07-14")).toBeNull();
    expect(parseOrderFactPageCursor(null)).toBeNull();
  });
});

describe("resolveOrderFactMaxPages", () => {
  it("clamps to the cost-safe cap and never unbounded-fetches", () => {
    expect(ORDER_FACT_MAX_PAGES_PER_RUN).toBe(40);
    expect(ORDER_FACT_MAX_PAGES_PER_RUN).toBeLessThanOrEqual(
      ORDER_FACT_PAGES_COST_SAFE_CAP,
    );
    expect(resolveOrderFactMaxPages(10_000)).toBe(ORDER_FACT_PAGES_COST_SAFE_CAP);
    expect(resolveOrderFactMaxPages(0)).toBe(ORDER_FACT_MAX_PAGES_PER_RUN);
    expect(resolveOrderFactMaxPages(Number.NaN)).toBe(
      ORDER_FACT_MAX_PAGES_PER_RUN,
    );
    expect(resolveOrderFactMaxPages(1)).toBe(1);
  });
});

function graphqlPage(opts: {
  hasNext: boolean;
  cursor: string | null;
  ids?: string[];
}) {
  return {
    data: {
      orders: {
        pageInfo: { hasNextPage: opts.hasNext, endCursor: opts.cursor },
        edges: (opts.ids ?? ["gid://shopify/Order/1"]).map((id) => ({
          node: {
            id,
            createdAt: "2026-07-14T15:00:00.000Z",
            sourceName: "web",
            currentSubtotalLineItemsQuantity: 1,
            currentTotalDiscountsSet: {
              shopMoney: { amount: "0", currencyCode: "USD" },
            },
            totalPriceSet: { shopMoney: { amount: "50.00", currencyCode: "USD" } },
            currentTotalPriceSet: {
              shopMoney: { amount: "50.00", currencyCode: "USD" },
            },
            customer: { id: "gid://shopify/Customer/1" },
          },
        })),
      },
    },
  };
}

describe("truncated busy-day crawl", () => {
  const NOW = new Date("2026-07-15T12:00:00.000Z");
  const FAKE_ADMIN = {} as never;

  beforeEach(() => {
    deleteManyOrderFact.mockReset();
    countOrderFact.mockReset();
    findManyOrderFact.mockReset();
    upsertOrderFact.mockReset();
    updateManyBackfill.mockReset();
    upsertBackfill.mockReset();
    updateBackfill.mockReset();
    findUniqueBackfill.mockReset();
    upsertCohort.mockReset();
    enqueueJob.mockReset();
    ensureShopMetadata.mockReset();
    adminGraphqlJson.mockReset();
    shopIsProForIngest.mockReset();
    shopIsProForIngest.mockResolvedValue(false);

    countOrderFact.mockResolvedValue(0);
    findManyOrderFact.mockResolvedValue([]);
    upsertOrderFact.mockResolvedValue({});
    upsertCohort.mockResolvedValue({});
    upsertBackfill.mockResolvedValue({
      shopId: "shop_1",
      cursor: null,
      historyLimited: true,
      status: "idle",
    });
    updateBackfill.mockResolvedValue({ count: 1 });
    enqueueJob.mockResolvedValue({ jobId: "job_1", dedupeKey: "shop_1" });
    ensureShopMetadata.mockResolvedValue({
      ianaTimezone: "UTC",
      currencyCode: "USD",
    });
  });

  it("does not seal a page-capped day and enqueues the next tick", async () => {
    adminGraphqlJson.mockResolvedValue(
      graphqlPage({ hasNext: true, cursor: "cur_next" }),
    );

    const result = await runOrderFactsBackfill(FAKE_ADMIN, "shop_1", {
      now: NOW,
      maxDays: 1,
      maxPages: 1,
    });

    expect(result.truncated).toBe(true);
    expect(result.truncatedDay).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(result.written).toBe(1);

    const sealed = upsertOrderFact.mock.calls.some((call) => {
      const created = call[0] as { create?: { shopifyOrderId?: string } };
      return String(created?.create?.shopifyOrderId ?? "").startsWith(
        ORDER_FACT_DAY_COMPLETE_PREFIX,
      );
    });
    expect(sealed).toBe(false);

    const idleUpdate = updateBackfill.mock.calls.find((call) => {
      const data = call[0] as { data?: { status?: string } };
      return data?.data?.status === "idle";
    });
    expect(idleUpdate?.[0]).toEqual(
      expect.objectContaining({
        data: expect.objectContaining({
          cursor: orderFactPageCursorMarker(result.truncatedDay!, "cur_next"),
        }),
      }),
    );

    expect(enqueueJob).toHaveBeenCalledWith(
      expect.objectContaining({
        shopId: "shop_1",
        type: BACKFILL_ORDER_FACTS_JOB,
        dedupeKey: "shop_1",
        payload: expect.objectContaining({
          reason: "truncated_page_cap",
          day: result.truncatedDay,
        }),
      }),
    );
  });

  it("does not enqueue when the worker tick owns retry (enqueueRetry: false)", async () => {
    adminGraphqlJson.mockResolvedValue(
      graphqlPage({ hasNext: true, cursor: "cur_next" }),
    );

    const result = await runOrderFactsBackfill(FAKE_ADMIN, "shop_1", {
      now: NOW,
      maxDays: 1,
      maxPages: 1,
      enqueueRetry: false,
    });

    expect(result.truncated).toBe(true);
    expect(enqueueJob).not.toHaveBeenCalled();
  });

  it("retries the truncated day from the saved GraphQL cursor and then seals", async () => {
    adminGraphqlJson.mockResolvedValue(
      graphqlPage({
        hasNext: true,
        cursor: "cur_next",
        ids: ["gid://shopify/Order/1"],
      }),
    );
    const first = await runOrderFactsBackfill(FAKE_ADMIN, "shop_1", {
      now: NOW,
      maxDays: 1,
      maxPages: 1,
    });

    const day = first.truncatedDay!;
    upsertOrderFact.mockClear();
    adminGraphqlJson.mockReset();
    enqueueJob.mockClear();
    upsertBackfill.mockResolvedValue({
      shopId: "shop_1",
      cursor: orderFactPageCursorMarker(day, "cur_next"),
      historyLimited: true,
      status: "idle",
    });
    adminGraphqlJson.mockResolvedValue(
      graphqlPage({
        hasNext: false,
        cursor: null,
        ids: ["gid://shopify/Order/2"],
      }),
    );

    const second = await runOrderFactsBackfill(FAKE_ADMIN, "shop_1", {
      now: NOW,
      maxDays: 1,
      maxPages: 1,
    });

    expect(second.truncated).toBe(false);
    expect(adminGraphqlJson.mock.calls[0][2]).toMatchObject({
      cursor: "cur_next",
    });
    const sealedIds = upsertOrderFact.mock.calls.map((call) => {
      const created = call[0] as { create?: { shopifyOrderId?: string } };
      return created?.create?.shopifyOrderId;
    });
    expect(sealedIds).toContain(orderFactDayCompleteMarkerId(day));
    expect(enqueueJob).not.toHaveBeenCalled();
  });

  it("progress reports truncated — remaining days, not a finished $0 window", async () => {
    findUniqueBackfill.mockResolvedValue({
      historyLimited: true,
      status: "idle",
      cursor: orderFactPageCursorMarker("2026-07-14", "cur_next"),
    });
    findManyOrderFact.mockResolvedValue([]);

    const progress = await getOrderBackfillProgress("shop_1", {
      ianaTimezone: "UTC",
      now: NOW,
    });

    expect(progress).not.toBeNull();
    expect(progress!.truncated).toBe(true);
    expect(progress!.truncatedDay).toBe("2026-07-14");
    expect(progress!.remainingDays).toBeGreaterThan(0);
    expect(progress!.completeDays).toBe(0);
  });

  it("clamps unpaid order progress to 90 closed days when billing is on", async () => {
    const prev = process.env.MCFLY_BILLING;
    process.env.MCFLY_BILLING = "1";
    shopIsProForIngest.mockResolvedValue(false);
    findUniqueBackfill.mockResolvedValue({
      historyLimited: false,
      status: "idle",
      cursor: null,
    });
    findManyOrderFact.mockResolvedValue([]);
    try {
      const progress = await getOrderBackfillProgress("shop_1", {
        ianaTimezone: "UTC",
        now: NOW,
      });
      expect(progress!.windowDays).toBe(LIVE_UNPAID_INGEST_DAYS);
      expect(shopIsProForIngest).toHaveBeenCalledWith("shop_1");
    } finally {
      if (prev === undefined) delete process.env.MCFLY_BILLING;
      else process.env.MCFLY_BILLING = prev;
    }
  });

  it("keeps paid order progress on the 24-month window when billing is on", async () => {
    const prev = process.env.MCFLY_BILLING;
    process.env.MCFLY_BILLING = "1";
    shopIsProForIngest.mockResolvedValue(true);
    findUniqueBackfill.mockResolvedValue({
      historyLimited: false,
      status: "idle",
      cursor: null,
    });
    findManyOrderFact.mockResolvedValue([]);
    try {
      const progress = await getOrderBackfillProgress("shop_1", {
        ianaTimezone: "UTC",
        now: NOW,
      });
      expect(progress!.windowDays).toBeGreaterThan(700);
      expect(progress!.windowDays).toBeLessThan(750);
    } finally {
      if (prev === undefined) delete process.env.MCFLY_BILLING;
      else process.env.MCFLY_BILLING = prev;
    }
  });
});

describe("computeCohortRollups", () => {
  it("does not treat a returning buyer as a new 90-day cohort", () => {
    const rollups = computeCohortRollups([
      {
        customerKey: "gid://shopify/Customer/1",
        orderedAt: new Date("2026-09-01T12:00:00.000Z"),
        amount: 80,
        lifetimeOrders: 5,
      },
    ]);
    expect(rollups).toEqual([]);
  });

  it("keeps a true first-time buyer whose lifetime count matches in-window orders", () => {
    const rollups = computeCohortRollups([
      {
        customerKey: "gid://shopify/Customer/2",
        orderedAt: new Date("2026-09-01T12:00:00.000Z"),
        amount: 80,
        lifetimeOrders: 1,
      },
    ]);
    expect(rollups).toHaveLength(1);
    expect(rollups[0]?.customers).toBe(1);
    expect(rollups[0]?.revenueD90).toBe(80);
  });
});

