import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  orderHistoryProgressMessage,
  spendFirstFoldSalesHint,
} from "./cash-trust-copy";
import {
  deskBookLede,
  deskHistoryCaption,
  deskPeriodTillLabel,
} from "./desk-history";
import { LIVE_UNPAID_INGEST_DAYS } from "./live-unpark";
import {
  OVERVIEW_COVERAGE_LINE,
  OVERVIEW_PENDING_IN_TOTAL_SALES,
  OVERVIEW_SHOP_NOT_COMPANY,
  overviewCoverageLine,
} from "./overview-first-viewport";
import { overviewYtdCopyText } from "./overview-yoy";
import { PRODUCT_NOUN } from "./product-labels";

const here = dirname(fileURLToPath(import.meta.url));

function read(rel: string): string {
  return readFileSync(join(here, rel), "utf8");
}

const liveTill = {
  periodLabel: "This month",
  useSampleDesk: false,
  shotMode: false,
  salesError: null as string | null,
  blockedMockAsLive: false,
  salesSource: "shopify",
  includeShopifyOrderWindow: true,
};

describe("book coverage honesty — unpaid 90 vs paid 24 months", () => {
  it("unpaid tills name 90 closed days after a sealed 90-day book, not 24 months", () => {
    expect(LIVE_UNPAID_INGEST_DAYS).toBe(90);
    expect(
      orderHistoryProgressMessage({
        completeDays: 90,
        windowDays: 90,
        remainingDays: 0,
      }),
    ).toBeNull();

    const unpaidTill = deskPeriodTillLabel({
      ...liveTill,
      orderBookDepth: "trial_slice",
    });
    expect(unpaidTill).toBe(
      `This month · live sales · ${LIVE_UNPAID_INGEST_DAYS} closed days of orders`,
    );
    expect(unpaidTill).not.toMatch(/24 months/);

    const unpaidCaption = deskHistoryCaption(
      new Date(Date.UTC(2026, 8, 22)),
      "sales",
      "trial_slice",
    );
    expect(unpaidCaption).toMatch(
      new RegExp(`${LIVE_UNPAID_INGEST_DAYS} closed days of orders`),
    );
    expect(unpaidCaption).not.toMatch(/24 months/);
    expect(unpaidCaption).toMatch(/reports/i);

    const unpaidSpend = deskHistoryCaption(
      new Date(Date.UTC(2026, 8, 22)),
      "spend",
      "trial_slice",
    );
    expect(unpaidSpend).toMatch(
      new RegExp(`${LIVE_UNPAID_INGEST_DAYS} closed days of orders`),
    );
    expect(unpaidSpend).not.toMatch(/24 months/);

    expect(overviewCoverageLine("trial_slice")).not.toMatch(/24 months/);
    expect(overviewCoverageLine("trial_slice")).toMatch(
      new RegExp(`${LIVE_UNPAID_INGEST_DAYS} closed days`),
    );
    expect(OVERVIEW_COVERAGE_LINE).toMatch(/24 months/);

    const unpaidLede = deskBookLede(
      "Returning dollars, not headcount.",
      "trial_slice",
    );
    expect(unpaidLede).toMatch(
      new RegExp(`${LIVE_UNPAID_INGEST_DAYS} closed days`),
    );
    expect(unpaidLede).not.toMatch(/24 months/);
  });

  it("paid tills still name up to 24 months of order rows", () => {
    expect(
      deskPeriodTillLabel({ ...liveTill, orderBookDepth: "paid_full" }),
    ).toBe("This month · live sales · up to 24 months of orders");
    expect(deskHistoryCaption(new Date(), "sales", "paid_full")).toMatch(
      /up to 24 months of orders/,
    );
    expect(overviewCoverageLine("paid_full")).toBe(OVERVIEW_COVERAGE_LINE);
  });

  it("Unlock banner names the unpaid 90 / paid 24 split, not the same book", () => {
    const unlock = read("../components/UnlockFullHistoryBanner.tsx");
    expect(unlock).toContain("LIVE_UNPAID_INGEST_DAYS");
    expect(unlock).toMatch(/closed days of order rows/);
    expect(unlock).toMatch(/up to 24 months of orders/);
    expect(unlock).toMatch(/\$39 per store/);
    expect(unlock).not.toMatch(/already on this desk/);
    expect(unlock).not.toMatch(/Trial\s+and paid use the same book/);
    expect(unlock).not.toContain("~90 days");
  });

  it("Orders, Customers, Overview, and Spend tills pass the unpaid book", () => {
    const orders = read("../routes/app.orders.tsx");
    expect(orders).toContain("includeShopifyOrderWindow: true");
    expect(orders).toMatch(/includeShopifyOrderWindow:\s*true,\s*orderBookDepth,/);
    expect(orders).toContain("orderBookDepth={orderBookDepth}");
    expect(orders).not.toContain("deskBookLede");

    const customers = read("../routes/app.customers.tsx");
    expect(customers).toContain("includeShopifyOrderWindow: true");
    expect(customers).toMatch(
      /includeShopifyOrderWindow:\s*true,\s*orderBookDepth,/,
    );
    expect(customers).toContain("orderBookDepth={orderBookDepth}");
    expect(customers).not.toContain("deskBookLede");
    expect(customers).toContain("<CustomersCompareGlance");

    const overview = read("../routes/app._index.tsx");
    expect(overview).toContain("includeShopifyOrderWindow: true");
    expect(overview).toMatch(
      /includeShopifyOrderWindow:\s*true,\s*orderBookDepth,/,
    );
    expect(overview).toContain("orderBookDepth={orderBookDepth}");

    const spend = read("../routes/app.spend.tsx");
    expect(spend).toContain("orderBookDepth={orderBookDepth}");

    const period = read("../components/PeriodControl.tsx");
    expect(period).toContain("orderBookDepth: LiveIngestDepth;");
    expect(period).not.toMatch(/orderBookDepth\?:/);
    expect(period).not.toMatch(/orderBookDepth:\s*LiveIngestDepth\s*=/);
    expect(period).toContain("deskHistoryCaption");
    expect(period).toMatch(
      /deskHistoryCaption\(\s*new Date\(\),\s*language === "spend" \? "spend" : "sales",\s*orderBookDepth,/,
    );

    const firstView = read("../components/OverviewFirstViewport.tsx");
    expect(firstView).toContain("orderBookDepth: LiveIngestDepth;");
    expect(firstView).not.toMatch(/orderBookDepth\?:/);
    expect(firstView).toContain("overviewCoverageLine(orderBookDepth)");

    const deskPage = read("../components/DeskBookPage.tsx");
    expect(deskPage).toContain("orderBookDepth: LiveIngestDepth;");
    expect(deskPage).not.toMatch(/orderBookDepth\?:/);
    expect(deskPage).toContain("orderBookDepth={orderBookDepth}");

    const history = read("./desk-history.ts");
    expect(history).not.toMatch(/orderBookDepth:\s*LiveIngestDepth\s*=/);
    expect(history).not.toMatch(/\?\?\s*"paid_full"/);
    expect(history).toMatch(
      /export function deskHistoryCaption\(\s*_now: Date,\s*surface: DeskHistorySurface,\s*orderBookDepth: LiveIngestDepth,/,
    );
    expect(history).toMatch(
      /export function deskBookLede\(\s*contrast: string,\s*orderBookDepth: LiveIngestDepth,/,
    );

    const coverage = read("./overview-first-viewport.ts");
    expect(coverage).not.toMatch(/depth: LiveIngestDepth\s*=/);
    expect(coverage).not.toMatch(/\?\?\s*"paid_full"/);
    expect(coverage).toContain(
      "export function overviewCoverageLine(depth: LiveIngestDepth): string",
    );

    expect(read("./desk-sales-page.server.ts")).toContain("orderBookDepth");
    expect(read("./desk-spend-stack.server.ts")).toContain("orderBookDepth");
  });
});

describe("book coverage honesty — Overview names the book", () => {
  it("keeps pending / COD / Klarna honesty copy off the From-orders first fold", () => {
    expect(OVERVIEW_PENDING_IN_TOTAL_SALES).toMatch(/pending/i);
    expect(OVERVIEW_PENDING_IN_TOTAL_SALES).toMatch(/authorized/i);
    expect(OVERVIEW_PENDING_IN_TOTAL_SALES).toMatch(/COD/i);
    expect(OVERVIEW_PENDING_IN_TOTAL_SALES).toMatch(/Klarna/i);
    expect(OVERVIEW_PENDING_IN_TOTAL_SALES).not.toMatch(/paid-only|paid only/i);
    const firstView = read("../components/OverviewFirstViewport.tsx");
    expect(firstView).not.toContain("OVERVIEW_PENDING_IN_TOTAL_SALES");
    expect(firstView).not.toContain("Shopify Total Sales");
    expect(firstView).not.toMatch(/paid-only|paidOnly|paid_only/);
  });

  it("keeps shop-not-company copy off the From-orders first fold", () => {
    expect(OVERVIEW_SHOP_NOT_COMPANY).toMatch(/this shop/i);
    expect(OVERVIEW_SHOP_NOT_COMPANY).toMatch(/not the company book/i);
    const firstView = read("../components/OverviewFirstViewport.tsx");
    expect(firstView).not.toContain("OVERVIEW_SHOP_NOT_COMPANY");
    expect(firstView).not.toContain("Shopify Total Sales");
  });

  it("YTD copy helper stays honest; Overview YoY cards stay quiet (no essay row)", () => {
    const copy = overviewYtdCopyText({
      salesPending: false,
      amount: 417_392,
      currency: "USD",
    });
    expect(copy).toMatch(/Orders YTD/i);
    expect(copy).toMatch(/\$417,392/);
    expect(copy).toMatch(/from orders/i);
    expect(copy).not.toMatch(/Shopify Total Sales/);
    expect(copy).not.toMatch(/fee|payout|bank/i);

    expect(
      overviewYtdCopyText({
        salesPending: true,
        amount: 417_392,
        currency: "USD",
      }),
    ).toBeNull();
    expect(
      overviewYtdCopyText({
        salesPending: false,
        amount: null,
        currency: "USD",
      }),
    ).toBeNull();

    const cards = read("../components/OverviewYoyCards.tsx");
    expect(cards).not.toContain("CopyYtdSales");
    expect(cards).not.toContain("overviewYtdCopyText");
    expect(cards).not.toMatch(/Orders YTD/);
    expect(cards).not.toMatch(/Shopify Total Sales YTD/);
    expect(cards).not.toMatch(/Shopify fees|payout date|bank match/i);
    const strip = read("../components/MorningHabitStrip.tsx");
    expect(strip).toContain("export function CopyYtdSales");
    expect(strip).toContain("copyDeskText");
  });
});

describe("book coverage honesty — Spend today cap and no 60-day truncated clause", () => {
  it("Spend first fold names todaySalesTruncated on the Sales KPI", () => {
    expect(
      spendFirstFoldSalesHint({
        salesPending: false,
        periodLabel: "This month",
        todaySalesTruncated: true,
      }),
    ).toMatch(/Live today is capped at ~100 orders for a fast desk load/);
    expect(
      spendFirstFoldSalesHint({
        salesPending: false,
        periodLabel: "This month",
        todaySalesUnavailable: true,
      }),
    ).toMatch(/today’s sales unavailable/i);
    expect(
      spendFirstFoldSalesHint({
        salesPending: true,
        periodLabel: "This month",
        todaySalesTruncated: true,
      }),
    ).toMatch(/Still loading — not \$0/);

    const spend = read("../routes/app.spend.tsx");
    const viewport = read("../components/SpendFirstViewport.tsx");
    expect(spend).toContain("<SpendFirstViewport");
    expect(viewport).toContain("spendFirstFoldSalesHint");
    expect(spend).toContain("todaySalesTruncated");
    expect(spend).toContain("todaySalesUnavailable");

    const demo = read("../routes/demo.spend.tsx");
    expect(demo).toContain("<SpendFirstViewport");
    expect(viewport).toContain("spendFirstFoldSalesHint");
  });

  it("truncated-closed-day banners do not say about 60 days", () => {
    const trust = read("../components/CashTrustBanners.tsx");
    const desk = read("../components/DeskBookPage.tsx");
    const copy = read("./cash-trust-copy.ts");
    expect(trust).not.toMatch(/about 60 days/i);
    expect(desk).not.toMatch(/about 60 days/i);
    expect(copy).not.toMatch(/about 60 days/i);
    expect(trust).toContain("truncatedOrderFactsMessage");
    expect(desk).toContain("truncatedOrderFactsMessage");
    expect(PRODUCT_NOUN.shopifyBookMuted).not.toMatch(/about 60 days/i);
    expect(PRODUCT_NOUN.bookSecondWithin30Def).not.toMatch(/about 60 days/i);
  });
});

describe("book coverage honesty — Settings / Spend leftover names the 90 vs 24 split", () => {
  it("does not recook Overview coverage; Settings, explorer, and CPA name the unpaid book", () => {
    expect(overviewCoverageLine("trial_slice")).toMatch(
      new RegExp(`${LIVE_UNPAID_INGEST_DAYS} closed days`),
    );
    expect(OVERVIEW_COVERAGE_LINE).toMatch(/24 months/);

    const settings = read("../routes/app.settings.tsx");
    expect(settings).toContain("TRIAL_VS_VIEW");
    expect(settings).not.toMatch(/full-access/);
    expect(settings).not.toContain("UnlockFullHistoryBanner");

    const explorer = read("../components/SpendExplorer.tsx");
    expect(explorer).toContain("orderBookDepth: LiveIngestDepth");
    expect(explorer).toContain("explorerRangeOptionsFor");

    const cpa = read("../components/CpaExplorer.tsx");
    expect(cpa).toContain("cpaExplorerRangesFor");
    expect(cpa).toContain("orderBookDepth: LiveIngestDepth");

    const customers = read("../routes/app.customers.tsx");
    expect(customers).toContain("<UnlockFullHistoryBanner");
    expect(read("../routes/app.spend.tsx")).not.toContain(
      "UnlockFullHistoryBanner",
    );
    expect(read("../routes/app.goals.tsx")).not.toContain(
      "UnlockFullHistoryBanner",
    );
  });
});
