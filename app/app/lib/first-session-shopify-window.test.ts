import { describe, expect, it, vi, beforeEach } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const enqueueJob = vi.fn();
const runSalesFactsBackfill = vi.fn();
const runOrderFactsBackfill = vi.fn();

vi.mock("./job-queue.server", () => ({
  enqueueJob: (...args: unknown[]) => enqueueJob(...args),
}));
vi.mock("./sales-facts.server", async () => {
  const actual = await vi.importActual<typeof import("./sales-facts.server")>(
    "./sales-facts.server",
  );
  return {
    ...actual,
    runSalesFactsBackfill: (...args: unknown[]) => runSalesFactsBackfill(...args),
  };
});
vi.mock("./order-facts.server", async () => {
  const actual = await vi.importActual<typeof import("./order-facts.server")>(
    "./order-facts.server",
  );
  return {
    ...actual,
    runOrderFactsBackfill: (...args: unknown[]) => runOrderFactsBackfill(...args),
  };
});

import {
  orderFactsWindowShouldResume,
  salesDayFactsWindowShouldResume,
  scheduleFirstSessionShopifyWindow,
  SHOPIFY_WINDOW_BACKFILL_MAX_ATTEMPTS,
} from "./first-session-shopify-window.server";
import { BACKFILL_SALES_DAY_FACTS_JOB } from "./sales-facts.server";
import { BACKFILL_ORDER_FACTS_JOB } from "./order-facts.server";

const here = dirname(fileURLToPath(import.meta.url));

function read(rel: string) {
  return readFileSync(join(here, rel), "utf8");
}

describe("first-session Shopify window resume", () => {
  beforeEach(() => {
    enqueueJob.mockReset();
    runSalesFactsBackfill.mockReset();
    runOrderFactsBackfill.mockReset();
    enqueueJob.mockResolvedValue({ jobId: "job_1", dedupeKey: "shop_1" });
    runSalesFactsBackfill.mockReturnValue(new Promise(() => {}));
    runOrderFactsBackfill.mockReturnValue(new Promise(() => {}));
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
    const jobs = read("./job-runner.server.ts");
    expect(jobs).toContain("BACKFILL_SALES_DAY_FACTS_JOB");
    expect(jobs).toContain("handleBackfillSalesDayFacts");
  });
});
