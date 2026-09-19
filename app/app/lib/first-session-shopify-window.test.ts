import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const enqueueJob = vi.fn();
const runSalesFactsBackfill = vi.fn();
const runOrderFactsBackfill = vi.fn();
const getOrderBackfillProgress = vi.fn();
const getSalesFactsWindowRemainingDays = vi.fn();
const findUniqueShop = vi.fn();

vi.mock("./job-queue.server", () => ({
  enqueueJob: (...args: unknown[]) => enqueueJob(...args),
}));
vi.mock("../db.server", () => ({
  default: {
    shop: {
      findUnique: (...args: unknown[]) => findUniqueShop(...args),
    },
  },
}));
vi.mock("./sales-facts.server", async () => {
  const actual = await vi.importActual<typeof import("./sales-facts.server")>(
    "./sales-facts.server",
  );
  return {
    ...actual,
    runSalesFactsBackfill: (...args: unknown[]) => runSalesFactsBackfill(...args),
    getSalesFactsWindowRemainingDays: (...args: unknown[]) =>
      getSalesFactsWindowRemainingDays(...args),
  };
});
vi.mock("./order-facts.server", async () => {
  const actual = await vi.importActual<typeof import("./order-facts.server")>(
    "./order-facts.server",
  );
  return {
    ...actual,
    runOrderFactsBackfill: (...args: unknown[]) => runOrderFactsBackfill(...args),
    getOrderBackfillProgress: (...args: unknown[]) =>
      getOrderBackfillProgress(...args),
  };
});

import {
  enqueueOrderFactsWebhookDelta,
  enqueueShopifyWindowBackfill,
  orderFactsWindowShouldResume,
  salesDayFactsWindowShouldResume,
  scheduleFirstSessionShopifyWindow,
  shopifyWindowShouldEnqueue,
  SHOPIFY_WINDOW_BACKFILL_MAX_ATTEMPTS,
} from "./first-session-shopify-window.server";
import { BACKFILL_SALES_DAY_FACTS_JOB } from "./sales-facts.server";
import { BACKFILL_ORDER_FACTS_JOB } from "./order-facts.server";

const here = dirname(fileURLToPath(import.meta.url));

function read(rel: string) {
  return readFileSync(join(here, rel), "utf8");
}

describe("first-session Shopify window resume", () => {
  const prevSample = process.env.MCFLY_SAMPLE_ONLY;
  const prevStage = process.env.MCFLY_LIVE_STAGE;

  beforeEach(() => {
    enqueueJob.mockReset();
    runSalesFactsBackfill.mockReset();
    runOrderFactsBackfill.mockReset();
    getOrderBackfillProgress.mockReset();
    getSalesFactsWindowRemainingDays.mockReset();
    findUniqueShop.mockReset();
    enqueueJob.mockResolvedValue({ jobId: "job_1", dedupeKey: "shop_1" });
    runSalesFactsBackfill.mockReturnValue(new Promise(() => {}));
    runOrderFactsBackfill.mockReturnValue(new Promise(() => {}));
    delete process.env.MCFLY_SAMPLE_ONLY;
    delete process.env.MCFLY_LIVE_STAGE;
    // First session / no IANA — keep OAuth kick.
    findUniqueShop.mockResolvedValue({ ianaTimezone: null });
  });

  afterEach(() => {
    if (prevSample === undefined) delete process.env.MCFLY_SAMPLE_ONLY;
    else process.env.MCFLY_SAMPLE_ONLY = prevSample;
    if (prevStage === undefined) delete process.env.MCFLY_LIVE_STAGE;
    else process.env.MCFLY_LIVE_STAGE = prevStage;
  });

  it("resumes SalesDayFact while closed days remain, not after a timezone skip", () => {
    expect(
      salesDayFactsWindowShouldResume({
        remainingMissingDays: 40,
        skippedReason: null,
      }),
    ).toBe(true);
    expect(
      salesDayFactsWindowShouldResume({
        remainingMissingDays: 0,
        skippedReason: null,
      }),
    ).toBe(false);
    expect(
      salesDayFactsWindowShouldResume({
        remainingMissingDays: 12,
        skippedReason: "no_timezone",
      }),
    ).toBe(false);
  });

  it("resumes OrderFact on truncated or remaining days, not a history-limited wall", () => {
    expect(
      orderFactsWindowShouldResume({
        truncated: true,
        remainingMissingDays: 0,
        historyLimited: true,
        skippedReason: null,
      }),
    ).toBe(true);
    expect(
      orderFactsWindowShouldResume({
        truncated: false,
        remainingMissingDays: 18,
        historyLimited: false,
        skippedReason: null,
      }),
    ).toBe(true);
    expect(
      orderFactsWindowShouldResume({
        truncated: false,
        remainingMissingDays: 18,
        historyLimited: true,
        skippedReason: null,
      }),
    ).toBe(false);
  });

  it("enqueues only when remaining work exists or status is not complete", () => {
    expect(
      shopifyWindowShouldEnqueue({ remainingWork: true, status: "idle" }),
    ).toBe(true);
    expect(
      shopifyWindowShouldEnqueue({ remainingWork: true, status: "complete" }),
    ).toBe(true);
    expect(
      shopifyWindowShouldEnqueue({ remainingWork: false, status: "idle" }),
    ).toBe(true);
    expect(
      shopifyWindowShouldEnqueue({ remainingWork: false, status: "complete" }),
    ).toBe(false);
  });

  it("enqueues window jobs and does not await the Shopify crawl", async () => {
    const admin = {} as never;
    const done = await Promise.race([
      scheduleFirstSessionShopifyWindow(admin, "shop_1").then(() => "resolved"),
      new Promise<string>((resolve) => {
        setTimeout(() => resolve("blocked"), 25);
      }),
    ]);
    expect(done).toBe("resolved");
    expect(enqueueJob).toHaveBeenCalledWith(
      expect.objectContaining({
        shopId: "shop_1",
        type: BACKFILL_SALES_DAY_FACTS_JOB,
        maxAttempts: SHOPIFY_WINDOW_BACKFILL_MAX_ATTEMPTS,
      }),
    );
    expect(enqueueJob).toHaveBeenCalledWith(
      expect.objectContaining({
        shopId: "shop_1",
        type: BACKFILL_ORDER_FACTS_JOB,
        maxAttempts: SHOPIFY_WINDOW_BACKFILL_MAX_ATTEMPTS,
      }),
    );
    expect(runSalesFactsBackfill).toHaveBeenCalledWith(admin, "shop_1");
    expect(runOrderFactsBackfill).toHaveBeenCalledWith(admin, "shop_1");
    expect(runSalesFactsBackfill.mock.calls[0][2]?.maxDays).toBeUndefined();
  });

  it("skips enqueue while SAMPLE freeze or stage parked (kill switch)", async () => {
    const admin = {} as never;
    process.env.MCFLY_SAMPLE_ONLY = "true";
    await scheduleFirstSessionShopifyWindow(admin, "shop_1");
    expect(enqueueJob).not.toHaveBeenCalled();
    expect(runSalesFactsBackfill).not.toHaveBeenCalled();

    delete process.env.MCFLY_SAMPLE_ONLY;
    process.env.MCFLY_LIVE_STAGE = "parked";
    await scheduleFirstSessionShopifyWindow(admin, "shop_1");
    expect(enqueueJob).not.toHaveBeenCalled();
  });

  it("does not re-enqueue or burst when the sealed shop has no remaining work", async () => {
    findUniqueShop.mockResolvedValue({ ianaTimezone: "America/Chicago" });
    getSalesFactsWindowRemainingDays.mockResolvedValue(0);
    getOrderBackfillProgress.mockResolvedValue({
      completeDays: 1800,
      windowDays: 1800,
      remainingDays: 0,
      historyLimited: false,
      status: "idle",
      truncated: false,
      truncatedDay: null,
    });

    const enqueued = await enqueueShopifyWindowBackfill("shop_1");
    expect(enqueued).toBe(false);
    expect(enqueueJob).not.toHaveBeenCalled();

    await scheduleFirstSessionShopifyWindow({} as never, "shop_1");
    expect(enqueueJob).not.toHaveBeenCalled();
    expect(runSalesFactsBackfill).not.toHaveBeenCalled();
    expect(runOrderFactsBackfill).not.toHaveBeenCalled();
  });

  it("still enqueues while the paid full-history window has remaining days", async () => {
    findUniqueShop.mockResolvedValue({ ianaTimezone: "America/Chicago" });
    getSalesFactsWindowRemainingDays.mockResolvedValue(1400);
    getOrderBackfillProgress.mockResolvedValue({
      completeDays: 90,
      windowDays: 1800,
      remainingDays: 1710,
      historyLimited: false,
      status: "idle",
      truncated: false,
      truncatedDay: null,
    });

    const enqueued = await enqueueShopifyWindowBackfill("shop_1");
    expect(enqueued).toBe(true);
    expect(enqueueJob).toHaveBeenCalledTimes(2);
  });

  it("still enqueues when a sealed-looking shop has a truncated OrderFact day", async () => {
    findUniqueShop.mockResolvedValue({ ianaTimezone: "America/Chicago" });
    getSalesFactsWindowRemainingDays.mockResolvedValue(0);
    getOrderBackfillProgress.mockResolvedValue({
      completeDays: 59,
      windowDays: 60,
      remainingDays: 0,
      historyLimited: false,
      status: "idle",
      truncated: true,
      truncatedDay: "2026-07-20",
    });

    const enqueued = await enqueueShopifyWindowBackfill("shop_1");
    expect(enqueued).toBe(true);
    expect(enqueueJob).toHaveBeenCalledTimes(2);
  });

  it("enqueues shop-deduped backfill_order_facts after an order webhook delta", async () => {
    await enqueueOrderFactsWebhookDelta("shop_1", {
      reason: "ORDERS_CANCELLED",
      day: "2026-07-20",
    });
    expect(enqueueJob).toHaveBeenCalledWith({
      shopId: "shop_1",
      type: BACKFILL_ORDER_FACTS_JOB,
      dedupeKey: "shop_1",
      payload: { reason: "ORDERS_CANCELLED", day: "2026-07-20" },
      maxAttempts: SHOPIFY_WINDOW_BACKFILL_MAX_ATTEMPTS,
    });
  });

  it("post-auth and first Overview schedule more than two missing days", () => {
    const auth = read("../routes/auth.$.tsx");
    const overview = read("../routes/app._index.tsx");
    const desk = read("./desk-sales-page.server.ts");
    const roas = read("../routes/app.roas.tsx");
    expect(auth).toContain("scheduleFirstSessionShopifyWindow");
    expect(auth).not.toMatch(/await runSalesFactsBackfill/);
    expect(auth).not.toMatch(/await runOrderFactsBackfill/);
    expect(overview).toContain("scheduleFirstSessionShopifyWindow");
    expect(overview).not.toContain("maxDays: 2");
    expect(desk).toContain("scheduleFirstSessionShopifyWindow");
    expect(desk).not.toContain("maxDays: 2");
    expect(roas).toContain("scheduleFirstSessionShopifyWindow");
    expect(roas).not.toContain("maxDays: 2");
    const window = read("./first-session-shopify-window.server.ts");
    expect(window).toContain("liveUnparkIngestPolicyFromEnv");
    expect(window).toContain("LIVE_SYNC_LAW_PR_REF");
    const jobs = read("./job-runner.server.ts");
    expect(jobs).toContain("BACKFILL_SALES_DAY_FACTS_JOB");
    expect(jobs).toContain("handleBackfillSalesDayFacts");
  });

  it("caps order rows at 24 months and leaves sales on the Shopify window", () => {
    const gate = read("./first-session-shopify-window.server.ts");
    const sales = read("./sales-facts.server.ts");
    const orders = read("./order-facts.server.ts");
    const depth = read("./live-ingest-depth.ts");
    expect(gate).toContain("Order rows stop at 24 months");
    expect(gate).toContain("live-ingest-depth");
    expect(sales).toContain("fetchShopifySalesDayTotals");
    expect(sales).not.toContain("resolveOrderRowWindowDays");
    expect(orders).toContain("resolveOrderRowWindowDays");
    expect(depth).toContain("ORDER_ROW_WINDOW_MONTHS = 24");
    expect(depth).not.toContain("TRIAL_LIVE_SLICE_DAYS = 90");
  });

  it("order webhook enqueues OrderFact backfill after clearing the day seal", () => {
    const webhook = read("../routes/webhooks.orders.tsx");
    expect(webhook).toContain("clearOrderFactDayCompleteSeal");
    expect(webhook).toContain("enqueueOrderFactsWebhookDelta");
    expect(webhook).toContain("backfill_order_facts");
    const sealCall = webhook.lastIndexOf("clearOrderFactDayCompleteSeal");
    const deltaCall = webhook.lastIndexOf("enqueueOrderFactsWebhookDelta");
    expect(sealCall).toBeGreaterThan(-1);
    expect(deltaCall).toBeGreaterThan(sealCall);
  });
});
