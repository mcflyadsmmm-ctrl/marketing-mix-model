/**
 * LTV route sales spine — HARD-STOP regression (source assert).
 * Same pattern as shopify-sales-sot: prove live path uses loadDeskSalesForPeriod,
 * never unbounded multi-day fetchShopifySales without maxPages.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { ltvWindowCaption } from "./contrib-ltv";

const here = dirname(fileURLToPath(import.meta.url));
const ltvSource = readFileSync(join(here, "../routes/app.ltv.tsx"), "utf8");

describe("LTV sales spine (HARD-STOP)", () => {
  it("live path uses loadDeskSalesForPeriod (same as Home / Close / Allocation)", () => {
    expect(ltvSource).toContain("loadDeskSalesForPeriod");
    expect(ltvSource).toMatch(
      /import\s*\{[^}]*loadDeskSalesForPeriod[^}]*\}\s*from\s*["']\.\.\/lib\/sales-facts\.server["']/,
    );
    expect(ltvSource).toContain("HARD-STOP");
  });

  it("does not import or call unbounded fetchShopifySales on the live path", () => {
    expect(ltvSource).not.toMatch(
      /import\s*\{[^}]*fetchShopifySales[^}]*\}\s*from/,
    );
    expect(ltvSource).not.toContain("emptySales");
    // No direct multi-day crawl — desk helper owns the capped today top-up.
    expect(ltvSource).not.toMatch(/fetchShopifySales\s*\(/);
  });

  it("wires desk.salesError (and truncated / unavailable flags) into the loader", () => {
    expect(ltvSource).toContain("salesError = desk.salesError");
    expect(ltvSource).toContain("todaySalesTruncated = desk.todaySalesTruncated");
    expect(ltvSource).toContain(
      "todaySalesUnavailable = desk.todaySalesUnavailable",
    );
  });

  it("keeps SAMPLE path on fetchSampleSales", () => {
    expect(ltvSource).toContain("fetchSampleSales");
    expect(ltvSource).toMatch(/useSampleDesk[\s\S]*fetchSampleSales/);
  });

  it("applies sample / Settings 0–1 margin via formatPercent, not toFixed(0)%", () => {
    expect(ltvSource).toContain("formatPercent(metrics.marginPct)");
    expect(ltvSource).not.toContain("marginPct.toFixed(0)");
    expect(ltvSource).toContain("perCustomerRevenue");
  });

  it("labels cohort windows vs period Cash CAC (never silently mix)", () => {
    expect(ltvSource).toContain("ltvWindowCaption");
    expect(ltvSource).toContain("Orders still syncing — not $0");
    expect(ltvSource).toContain("not $0 LTV");
    expect(ltvSource).not.toContain("Free shows the available window");
    expect(ltvSource).toContain("getOrderBackfillProgress");
    expect(ltvSource).toContain("ORDER_FACT_MAX_DAYS_PER_RUN");
    expect(ltvSource).toContain("until you confirm in Settings");
  });

  it("LTV page shows avg orders in 90 days from order history", () => {
    expect(ltvSource).toContain("avgOrdersD90");
    expect(ltvSource).toMatch(/Orders in first 90 days/);
  });
});

describe("LTV tab vs Shopify Analytics", () => {
  it("contrasts Shopify Analytics LTV reports with order-history 90-day value", () => {
    expect(ltvSource).toContain(
      "Shopify Analytics shows LTV reports, if any. This page shows order-history first 90 days.",
    );
    expect(ltvSource).toContain("PRODUCT_NOUN.ltvNotInShopify");
  });

  it("names avg orders in first 90 days", () => {
    expect(ltvSource).toContain("avgOrdersD90");
    expect(ltvSource).toMatch(/Orders in first 90 days/);
  });

  it("gates Cash CAC on hasSpend", () => {
    expect(ltvSource).toMatch(/hasSpend && cashCac != null/);
    expect(ltvSource).toContain("Cash CAC");
  });

  it("links /app/cpa only when hasSpend", () => {
    const cpaHref = ltvSource.indexOf('href="/app/cpa"');
    expect(cpaHref).toBeGreaterThan(-1);
    const around = ltvSource.slice(Math.max(0, cpaHref - 280), cpaHref + 24);
    expect(around).toMatch(/hasSpend/);
  });

  it("links Spend Upload when spend is missing instead of implying $0 CAC", () => {
    expect(ltvSource).toContain('href="/app/spend"');
    expect(ltvSource).toContain("Spend Upload");
    expect(ltvSource).not.toMatch(/\$0 CAC/);
    const spendHref = ltvSource.indexOf('href="/app/spend"');
    expect(spendHref).toBeGreaterThan(-1);
    const around = ltvSource.slice(Math.max(0, spendHref - 400), spendHref + 40);
    expect(around).toMatch(/hasSpend/);
  });

  it("pending and empty order history is not $0 LTV", () => {
    expect(ltvSource).toContain("not $0 LTV");
    expect(ltvSource).toContain("Orders still syncing — not $0");
  });

  it("does not mount SpendExplorer", () => {
    expect(ltvSource).not.toContain("SpendExplorer");
  });
});

describe("ltvWindowCaption", () => {
  it("names cohort max days, period label, and Cash CAC period spend", () => {
    const caption = ltvWindowCaption({
      periodLabel: "Month to date",
      cohortMaxDays: 365,
    });
    expect(caption).toContain("30/90/365d");
    expect(caption).toContain("first-order month");
    expect(caption).toContain("Month to date");
    expect(caption).toContain("Cash CAC uses this period’s spend ÷ new buyers");
    expect(caption).toContain(
      "Shopify Analytics does not combine LTV with ad spend",
    );
    expect(caption).toContain("Not predictive");
    expect(caption).toContain("Not by ad");
    expect(caption).not.toMatch(/pixel/i);
  });

  it("defaults cohort max to 365 when omitted", () => {
    expect(ltvWindowCaption({ periodLabel: "YTD" })).toContain("30/90/365d");
  });
});
