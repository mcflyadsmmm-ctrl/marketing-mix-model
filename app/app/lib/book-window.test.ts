import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  bookLoadHonestyLine,
  countFinishedBookMonths,
  customersBookRangeLine,
} from "./book-window";

const here = dirname(fileURLToPath(import.meta.url));

function read(rel: string): string {
  return readFileSync(join(here, rel), "utf8");
}

describe("book window honesty", () => {
  it("counts finished months and seals only when every closed day is in", () => {
    const keys = ["2026-07-01", "2026-07-02", "2026-08-01"];
    const partial = countFinishedBookMonths(
      keys,
      new Set(["2026-07-01", "2026-07-02"]),
    );
    expect(partial.monthsFinished).toBe(1);
    expect(partial.monthsInWindow).toBe(2);
    expect(partial.bookSealed).toBe(false);

    const sealed = countFinishedBookMonths(keys, new Set(keys));
    expect(sealed.monthsFinished).toBe(2);
    expect(sealed.bookSealed).toBe(true);
  });

  it("names months finished, never a percent, and says when the 24-month book is sealed", () => {
    const loading = bookLoadHonestyLine({
      monthsFinished: 3,
      bookSealed: false,
      historyLimited: false,
    });
    expect(loading).toBe(
      "Older months still loading, newest first. 3 months finished.",
    );
    expect(loading).not.toContain("%");

    expect(
      bookLoadHonestyLine({
        monthsFinished: 1,
        bookSealed: false,
        historyLimited: false,
      }),
    ).toBe("Older months still loading, newest first. 1 month finished.");

    expect(
      bookLoadHonestyLine({
        monthsFinished: 24,
        bookSealed: true,
        historyLimited: false,
      }),
    ).toBe("The 24-month book is sealed.");

    expect(
      customersBookRangeLine({
        monthsFinished: 2,
        bookSealed: false,
        historyLimited: false,
      }),
    ).toBe(
      "Customers and LTV use months already loaded. This range is partial until the 24-month book is sealed.",
    );
    expect(
      customersBookRangeLine({
        monthsFinished: 24,
        bookSealed: true,
        historyLimited: false,
      }),
    ).toBe("The 24-month book is sealed.");
  });
});

describe("period window stays off the order-row click", () => {
  it("keeps the crawl at 7 days and the page cap at 80", () => {
    const facts = read("./order-facts.server.ts");
    const jobs = read("./job-runner.server.ts");
    const cost = read("./shopify-graphql-cost.server.ts");
    expect(facts).toContain("export const ORDER_FACT_MAX_DAYS_PER_RUN = 7;");
    expect(jobs).toContain("export const NIGHTLY_SHOPIFY_REFRESH_DAYS = 7;");
    expect(cost).toContain("export const ORDER_FACT_PAGES_COST_SAFE_CAP = 80;");
  });

  it("aggregates cohorts and new buyers in Postgres", () => {
    const facts = read("./order-facts.server.ts");
    const cohort = facts.slice(
      facts.indexOf("export async function recomputeCohortFacts"),
      facts.indexOf("async function fetchOrdersForDay"),
    );
    const buyers = facts.slice(
      facts.indexOf("export async function countNewBuyersInRange"),
      facts.indexOf("export async function countIdentifiedBuyersInRange"),
    );
    expect(cohort).toContain("queryCohortRollups");
    expect(cohort).not.toContain("findMany");
    expect(buyers).toContain("queryNewBuyerCounts");
    expect(buyers).not.toContain("findMany");
    const sql = read("./order-fact-sql.server.ts");
    expect(sql).toContain("$queryRaw");
    expect(sql).not.toContain("$queryRawUnsafe");
    expect(sql).not.toContain("findMany");
    expect(facts).toContain("take: 20_000");
  });

  it("live period click reads the stored window", () => {
    const overview = read("../routes/app._index.tsx");
    const live = overview.slice(
      overview.indexOf("LIVE_PERIOD_WINDOW"),
      overview.indexOf("const factsPending"),
    );
    expect(live).toContain("readDeskMetricWindows");
    expect(live).not.toContain("loadOrderDepthRows");
    expect(live).not.toContain("loadCustomerAnalytics");
    expect(live).not.toContain("loadLtvDepth");

    const stack = read("./desk-customers-stack.server.ts");
    const liveStack = stack.slice(
      stack.indexOf("if (!base.useSampleDesk)"),
      stack.indexOf("const [analytics, comeback, depth]"),
    );
    expect(liveStack).toContain("readDeskMetricSnapshot");
    expect(liveStack).not.toContain("loadCustomerAnalytics");
    expect(liveStack).not.toContain("loadLtvDepth");
    expect(liveStack).not.toContain("loadGrowthComeback");
    expect(liveStack).not.toContain("loadOrderDepthRows");
    expect(stack).toContain("includeLtv\n        ? loadLtvDepth");
  });
});
