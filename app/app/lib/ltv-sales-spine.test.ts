/**
 * LTV route sales spine — HARD-STOP regression (source assert).
 * Same pattern as shopify-sales-sot: prove live path uses loadDeskSalesForPeriod,
 * never unbounded multi-day fetchShopifySales without maxPages.
 * LTV boards now live on Customers; /app/ltv redirects with panel=ltv.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { ltvWindowCaption } from "./contrib-ltv";

const here = dirname(fileURLToPath(import.meta.url));
const ltvSource = readFileSync(join(here, "../routes/app.ltv.tsx"), "utf8");
const customers = readFileSync(join(here, "../routes/app.customers.tsx"), "utf8");
const stack = readFileSync(join(here, "./desk-customers-stack.server.ts"), "utf8");
const ltvSection = readFileSync(
  join(here, "../components/CustomersLtvSection.tsx"),
  "utf8",
);

describe("LTV sales spine (HARD-STOP)", () => {
  it("live path uses loadDeskSalesForPeriod (same as Home / Close / Allocation)", () => {
    expect(stack).toContain("loadDeskSalesForPeriod");
    expect(stack).toContain("HARD-STOP");
    expect(stack).toContain("loadDeskSalesPage");
    expect(customers).toContain("loadCustomersStackPage");
  });

  it("does not import or call unbounded fetchShopifySales on the live path", () => {
    expect(stack).not.toMatch(
      /import\s*\{[^}]*fetchShopifySales[^}]*\}\s*from/,
    );
    expect(ltvSource).not.toContain("emptySales");
    expect(stack).not.toMatch(/fetchShopifySales\s*\(/);
    expect(customers).not.toMatch(/fetchShopifySales\s*\(/);
    expect(ltvSection).not.toMatch(/fetchShopifySales\s*\(/);
  });

  it("wires desk.salesError (and truncated / unavailable flags) into the loader", () => {
    expect(customers).toContain("salesError={Boolean(salesError)");
    expect(customers).toContain(
      "todaySalesTruncated={!useSampleDesk && todaySalesTruncated}",
    );
    expect(customers).toContain(
      "todaySalesUnavailable={!useSampleDesk && todaySalesUnavailable}",
    );
  });

  it("keeps SAMPLE path on fetchSampleSales", () => {
    expect(stack).toContain("fetchSampleSales");
    expect(stack).toMatch(/SAMPLE path stays on fetchSampleSales/);
  });

  it("applies sample / Settings 0–1 margin via formatPercent, not toFixed(0)%", () => {
    expect(ltvSection).toContain("formatPercent(metrics.marginPct)");
    expect(ltvSection).not.toContain("marginPct.toFixed(0)");
    expect(ltvSection).toContain("perCustomerRevenue");
  });

  it("labels cohort windows vs period Cash CAC (never silently mix)", () => {
    expect(ltvSection).toContain("ltvWindowCaption");
    expect(ltvSection).toContain("Orders still syncing — not $0");
    expect(ltvSection).toContain("not $0 LTV");
    expect(ltvSection).not.toContain("Free shows the available window");
    expect(stack).toContain("getOrderBackfillProgress");
    expect(customers).toContain("orderFactsTruncated");
    expect(stack).toContain("scheduleFirstSessionShopifyWindow");
    expect(ltvSection).not.toContain("until you confirm in Settings");
    expect(ltvSection).toContain("showMarginKept");
    expect(customers).toContain("UnlockFullHistoryBanner");
    expect(customers).toContain("liveHistoryLocked");
  });

  it("LTV page shows avg orders in 90 days from order history", () => {
    expect(ltvSection).toContain("avgOrdersD90");
    expect(ltvSection).toMatch(/Orders in first 90 days on file/);
  });
});

describe("LTV tab vs Shopify Analytics", () => {
  it("redirects /app/ltv onto Customers panel=ltv", () => {
    expect(ltvSource).toContain("authenticate.admin");
    expect(ltvSource).toContain('customersPanelRedirectPath');
    expect(ltvSource).toContain('"ltv"');
    expect(ltvSource).toContain("/app/customers");
    expect(ltvSource).toContain("throw redirect");
    expect(customers).toContain('id="mcfly-ltv"');
  });

  it("contrasts Shopify Analytics LTV reports with order-history 90-day value", () => {
    expect(ltvSection).toContain(
      "This page shows first 90 days after the first order on file",
    );
    expect(ltvSection).toContain("PRODUCT_NOUN.ltvNotInShopify");
  });

  it("names avg orders in first 90 days", () => {
    expect(ltvSection).toContain("avgOrdersD90");
    expect(ltvSection).toMatch(/Orders in first 90 days on file/);
  });

  it("gates Cash CAC on hasSpend", () => {
    expect(ltvSection).toMatch(/hasSpend && cashCac != null/);
    expect(ltvSection).toContain("Cash CAC");
  });

  it("links /app/cpa only when hasSpend", () => {
    const cpaHref = ltvSection.indexOf('href="/app/cpa"');
    expect(cpaHref).toBeGreaterThan(-1);
    const around = ltvSection.slice(Math.max(0, cpaHref - 280), cpaHref + 24);
    expect(around).toMatch(/hasSpend/);
  });

  it("links Spend Upload when spend is missing instead of implying $0 CAC", () => {
    expect(ltvSection).toContain('href="/app/spend"');
    expect(ltvSection).toContain("Spend Upload");
    expect(ltvSection).not.toMatch(/\$0 CAC/);
    const spendHref = ltvSection.indexOf('href="/app/spend"');
    expect(spendHref).toBeGreaterThan(-1);
    const around = ltvSection.slice(Math.max(0, spendHref - 400), spendHref + 40);
    expect(around).toMatch(/hasSpend/);
  });

  it("pending and empty order history is not $0 LTV", () => {
    expect(ltvSection).toContain("not $0 LTV");
    expect(ltvSection).toContain("Orders still syncing — not $0");
  });

  it("does not paint First year as a complete dollar when the year is unsealed", () => {
    expect(ltvSection).toMatch(
      /else if \(isNum\(ltv\.avgRevenueD90\) \|\| isNum\(ltv\.avgRevenueD30\)\) \{[\s\S]*k: "First year"[\s\S]*v: "—"[\s\S]*keepDash: true/,
    );
    expect(ltvSection).toContain("isNum(ltv.avgRevenueD365) && ltv.avgRevenueD365 > 0");
    expect(ltvSection).toContain("d365 != null && d365 > 0");
  });

  it("passes truncated today and the ~60-day order window into DeskBookPage", () => {
    expect(customers).toContain(
      "todaySalesTruncated={!useSampleDesk && todaySalesTruncated}",
    );
    expect(customers).toContain(
      "todaySalesUnavailable={!useSampleDesk && todaySalesUnavailable}",
    );
    expect(customers).toContain(
      "shopifyOrderWindowLimited={!useSampleDesk && shopifyOrderWindowLimited}",
    );
    expect(stack).toContain("loadDeskSalesPage");
    expect(customers).toContain("includeShopifyOrderWindow: true");
  });

  it("does not mount SpendExplorer", () => {
    expect(ltvSource).not.toContain("SpendExplorer");
    expect(customers).not.toContain("SpendExplorer");
    expect(ltvSection).not.toContain("SpendExplorer");
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
