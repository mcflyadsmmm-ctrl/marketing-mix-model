import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { LIVE_UNPAID_INGEST_DAYS } from "./live-unpark";
import { ORDER_FACT_MAX_DAYS_PER_RUN } from "./order-facts.server";
import { PRODUCT_NOUN } from "./product-labels";

const here = dirname(fileURLToPath(import.meta.url));

function read(rel: string): string {
  return readFileSync(join(here, rel), "utf8");
}

describe("Goals year clock / year-board honesty", () => {
  it("does not lengthen the unpaid crawl past 90 closed days", () => {
    expect(LIVE_UNPAID_INGEST_DAYS).toBe(90);
    expect(ORDER_FACT_MAX_DAYS_PER_RUN).toBe(7);
    const unpark = read("./live-unpark.ts");
    expect(unpark).toMatch(/LIVE_UNPAID_INGEST_DAYS = 90/);
  });

  it("clears a blank month instead of upserting a certified $0 plan", () => {
    const route = read("../routes/app.goals.tsx");
    const server = read("./sales-goals.server.ts");
    const arith = read("./sales-goals.ts");
    expect(arith).toContain("if (cleaned === \"\") return null");
    expect(route).toContain("parseGoalInput");
    expect(route).not.toMatch(/function parseGoalInput/);
    expect(server).toContain("deleteMany");
    expect(server).not.toMatch(/Upsert all 12 months for a year plan \(missing → 0\)/);
    expect(server).not.toMatch(/List monthly sales goals for a year \(12 slots, missing → 0\)/);
  });

  it("withholds next-month-from-today when the year picker is not the live year", () => {
    const route = read("../routes/app.goals.tsx");
    const forecast = read("./order-history-forecast.ts");
    expect(route).toContain("bookYear: year");
    expect(forecast).toContain("bookYear");
    expect(forecast).toMatch(/input\.bookYear\s*!=\s*null/);
    expect(forecast).toMatch(/input\.bookYear\s*!==\s*input\.todayYear/);
  });

  it("names selling days on the next-month forecast and never invents a missing $0 day", () => {
    const forecast = read("./order-history-forecast.ts");
    expect(forecast).toMatch(/selling days/i);
    expect(forecast).toContain("n > 0");
    expect(forecast).not.toContain("?? 0");
  });

  it("Projected / Actual / Prior name Shopify Total Sales and drop the $80k ceiling example", () => {
    const route = read("../routes/app.goals.tsx");
    const ceiling = read("./implied-spend-ceiling.ts");
    expect(route).toContain("PRODUCT_NOUN.salesBasisShort");
    expect(route).toMatch(/Projected/);
    expect(ceiling).not.toMatch(/\$80k/);
    expect(PRODUCT_NOUN.salesBasisShort).toBe("Shopify Total Sales");
  });

  it("Goals MTD discloses a truncated today without a million-order crawl", () => {
    const route = read("../routes/app.goals.tsx");
    expect(route).toContain("todaySalesTruncated");
    expect(route).toContain("todaySalesUnavailable");
    expect(route).toContain("orderBackfillProgress");
    expect(route).toContain("getOrderBackfillProgress");
    expect(route).toContain("shopLiveIngestDepth");
    expect(route).toContain("orderBookDepth");
    expect(route).not.toMatch(/orderBookDepth:\s*LiveIngestDepth\s*=/);
    expect(route).toContain('orderBookDepth="paid_full"');
    expect(route).not.toContain("million-order");
    expect(route).toContain("CashTrustBanners");
  });

  it("paints implied identified buyers and month returning $ on the year board", () => {
    const route = read("../routes/app.goals.tsx");
    const arith = read("./sales-goals.ts");
    expect(arith).toContain("impliedIdentifiedBuyers");
    expect(arith).toContain("IMPLIED_IDENTIFIED_BUYERS_MIN_ORDERS = 8");
    expect(route).toContain("impliedIdentifiedBuyers");
    expect(route).toContain("returningActual");
    expect(route).toContain("mcfly-goals-month-stack");
    expect(route).not.toMatch(/pixel CAC/i);
  });

  it("keeps the phone month stack and does not restore a 720px nowrap table", () => {
    const css = read("../styles/mcfly-desk.css");
    const phoneAt = css.lastIndexOf("Phone Goals board + chips + CPA dates");
    expect(phoneAt).toBeGreaterThan(-1);
    const morningAt = css.indexOf("Morning habit", phoneAt);
    const phone = css.slice(phoneAt, morningAt === -1 ? undefined : morningAt);
    expect(phone).toContain("min-width: 0");
    expect(phone).not.toContain("min-width: 720px");
    expect(phone).toContain(".mcfly-goals-month-stack__grid");
  });
});
