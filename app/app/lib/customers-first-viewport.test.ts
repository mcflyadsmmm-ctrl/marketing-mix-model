import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  CUSTOMERS_ANALYTICS_CONTRAST,
  CUSTOMERS_FIRST_FOLD_HEROES,
  CUSTOMERS_FIRST_LANE_LABEL,
  CUSTOMERS_LAST_YEAR_NOT_ON_FILE,
  CUSTOMERS_PENDING_LINE,
  CUSTOMERS_SPEND_BANS,
  CUSTOMERS_THIN_EMPTY_LINE,
  CUSTOMERS_TODAY_TRUNCATED_LINE,
  buildCustomersHero,
  buildCustomersLeadPeeks,
  customersHeroBeatsShopifyAnalytics,
  customersLastYearLine,
  customersOperatorGreeting,
} from "./customers-first-viewport";
import { CUSTOMERS_LAST_YEAR_EMPTY } from "./customers-analytics";
import type { ShopifyNativePeriodStats } from "./shopify-native-stats";

const here = dirname(fileURLToPath(import.meta.url));

function read(rel: string) {
  return readFileSync(join(here, rel), "utf8");
}

function dollarBook(
  over: Partial<ShopifyNativePeriodStats> = {},
): ShopifyNativePeriodStats {
  return {
    orderCount: 24,
    aov: 50,
    newCustomers: 8,
    returningCustomers: 10,
    guestOrders: 2,
    guestShare: 2 / 24,
    newBuyerShare: 8 / 18,
    newSalesShare: 0.4,
    returningSalesShare: 0.6,
    newSales: 400,
    returningSales: 600,
    returnsDrag: null,
    returnsDragPct: null,
    customerMetricsAvailable: true,
    newBuyerArpu: 50,
    returningBuyerArpu: 60,
    ...over,
  };
}

describe("customersOperatorGreeting", () => {
  it("leads with returning vs new dollars vs Shopify Analytics list", () => {
    expect(
      customersOperatorGreeting({
        salesPending: false,
        orderCount: 24,
        identifiedBuyers: 10,
        returningShare: 0.62,
        newShare: 0.38,
        todaySalesTruncated: false,
      }),
    ).toBe(
      "Returning dollars 62% vs new 38%. Shopify Analytics Customers is a customer list.",
    );
    expect(CUSTOMERS_ANALYTICS_CONTRAST).not.toMatch(/sessions|ROAS|spend|email/i);
    expect(CUSTOMERS_FIRST_LANE_LABEL).not.toMatch(/RFM-lite/);
    expect(CUSTOMERS_FIRST_LANE_LABEL).toMatch(/Returning/i);
    expect(CUSTOMERS_THIN_EMPTY_LINE).toMatch(/returning dollars fill after paid orders/i);
    expect(CUSTOMERS_THIN_EMPTY_LINE).toMatch(/not \$0/);
  });

  it("does not greet thin or pending shops as a $0 customer list", () => {
    expect(
      customersOperatorGreeting({
        salesPending: true,
        orderCount: 0,
        identifiedBuyers: 0,
        returningShare: null,
        newShare: null,
        todaySalesTruncated: false,
      }),
    ).toBe(CUSTOMERS_PENDING_LINE);
    expect(
      customersOperatorGreeting({
        salesPending: false,
        orderCount: 0,
        identifiedBuyers: 0,
        returningShare: null,
        todaySalesTruncated: false,
      }),
    ).toBe("No identified buyers in this window yet.");
  });

  it("does not greet a capped live today as a finished closed returning mix", () => {
    const greeting = customersOperatorGreeting({
      salesPending: false,
      orderCount: 24,
      identifiedBuyers: 10,
      returningShare: 0.62,
      newShare: 0.38,
      todaySalesTruncated: true,
    });
    expect(greeting).toBe(CUSTOMERS_TODAY_TRUNCATED_LINE);
    expect(greeting).toMatch(/capped at ~100 orders/);
    expect(greeting).toMatch(/not a closed day/);
    expect(greeting).not.toBe(
      "Returning dollars 62% vs new 38%. Shopify Analytics Customers is a customer list.",
    );
    expect(greeting).not.toMatch(/\$0/);
    expect(
      customersOperatorGreeting({
        salesPending: true,
        orderCount: 24,
        identifiedBuyers: 10,
        returningShare: 0.62,
        newShare: 0.38,
        todaySalesTruncated: true,
      }),
    ).toBe(CUSTOMERS_PENDING_LINE);
  });
});

describe("buildCustomersHero + lead peeks", () => {
  it("leads with returning dollars and elevates new $ / dollars per buyer", () => {
    const book = dollarBook();
    const hero = buildCustomersHero(book, {
      todaySalesTruncated: false,
      lastYear: { onFile: true, returningSales: 500, newSales: 300 },
    });
    expect(hero?.kind).toBe("returningDollars");
    expect(hero?.k).toMatch(/Returning dollars/);
    expect(hero?.amount).toBe(600);
    expect(hero?.amount).not.toBe(0);
    expect(hero?.todayTruncated).toBe(false);
    expect(hero?.lastYearOnFile).toBe(true);
    expect(hero?.lastYearAmount).toBe(500);
    expect(hero?.yoyPct).toBeNull();

    const peeks = buildCustomersLeadPeeks(book);
    expect(peeks.map((peek) => peek.hero)).toEqual([
      "newDollars",
      "dollarsPerBuyer",
    ]);
    expect(peeks[0]?.amount).toBe(400);
    expect(peeks[1]?.amount).toBe(60);
    expect(peeks[1]?.k).toBe("Dollars per buyer");
  });

  it("hides the new-dollars peek when the giant already is new dollars", () => {
    const book = dollarBook({
      returningSales: null,
      returningSalesShare: null,
      newSales: 400,
      newSalesShare: 1,
    });
    const hero = buildCustomersHero(book, {
      todaySalesTruncated: false,
      lastYear: CUSTOMERS_LAST_YEAR_EMPTY,
    });
    expect(hero?.kind).toBe("newDollars");
    const peeks = buildCustomersLeadPeeks(book, { hideNewDollars: true });
    expect(peeks.map((peek) => peek.hero)).not.toContain("newDollars");
    expect(peeks.some((peek) => peek.hero === "dollarsPerBuyer")).toBe(true);
  });

  it("drops missing returning / new / per-buyer truths — never a $0 peek graveyard", () => {
    const empty = dollarBook({
      returningSales: null,
      newSales: null,
      returningSalesShare: null,
      newSalesShare: null,
      returningBuyerArpu: null,
      newBuyerArpu: null,
    });
    expect(buildCustomersLeadPeeks(empty)).toEqual([]);
    expect(
      buildCustomersHero(empty, {
        todaySalesTruncated: false,
        lastYear: CUSTOMERS_LAST_YEAR_EMPTY,
      }),
    ).toBeNull();
  });

  it("does not paint $417,392 returning as a finished closed day when today is capped", () => {
    const hero = buildCustomersHero(
      dollarBook({ returningSales: 417_392, newSales: 180_000 }),
      {
        todaySalesTruncated: true,
        lastYear: CUSTOMERS_LAST_YEAR_EMPTY,
      },
    );
    expect(hero?.kind).toBe("returningDollars");
    expect(hero?.amount).toBe(417_392);
    expect(hero?.todayTruncated).toBe(true);
    expect(hero?.amount).not.toBe(0);
  });

  it("says last year is not on file next to returning vs new — never 0% YoY", () => {
    const hero = buildCustomersHero(dollarBook({ returningSales: 417_392 }), {
      todaySalesTruncated: false,
      lastYear: CUSTOMERS_LAST_YEAR_EMPTY,
    });
    expect(hero?.lastYearOnFile).toBe(false);
    expect(hero?.lastYearAmount).toBeNull();
    expect(hero?.yoyPct).toBeNull();
    expect(customersLastYearLine(hero!)).toBe(
      `Last year ${CUSTOMERS_LAST_YEAR_NOT_ON_FILE}`,
    );
    expect(customersLastYearLine(hero!)).not.toMatch(/0%/);
    expect(customersLastYearLine(hero!)).not.toMatch(/\$0/);
    expect(
      customersLastYearLine({
        lastYearOnFile: true,
        lastYearAmount: null,
      }),
    ).toBe("Last year —");
  });
});

describe("Customers first-fold SCORECARD vs free Shopify Analytics", () => {
  it("PASS only when every first-fold hero is Mcfly-differentiated", () => {
    expect([...CUSTOMERS_FIRST_FOLD_HEROES]).toEqual([
      "returningDollars",
      "newDollars",
      "dollarsPerBuyer",
      "mixChart",
    ]);
    for (const hero of CUSTOMERS_FIRST_FOLD_HEROES) {
      expect(customersHeroBeatsShopifyAnalytics(hero)).toBe(true);
    }
    const customers = read("../routes/app.customers.tsx");
    const firstView = read("../components/CustomersFirstViewport.tsx");
    expect(customers).toContain("CUSTOMERS_FIRST_LANE_LABEL");
    expect(customers).toContain("<CustomersFirstViewport");
    expect(customers.indexOf("<CustomersFirstViewport")).toBeLessThan(
      customers.indexOf("<CustomerMixChart"),
    );
    expect(customers.indexOf("<CustomerMixChart")).toBeLessThan(
      customers.indexOf("<CustomersScoreboard"),
    );
    expect(customers.indexOf("<CustomersScoreboard")).toBeLessThan(
      customers.indexOf("<CustomersLtvWindows"),
    );
    expect(customers.indexOf("<CustomersLtvWindows")).toBeLessThan(
      customers.indexOf("<CustomersGrowthSection"),
    );
    expect(customers.indexOf("<CustomersGrowthSection")).toBeLessThan(
      customers.indexOf("<CustomerRetentionBoard"),
    );
    expect(customers.indexOf("<CustomerRetentionBoard")).toBeLessThan(
      customers.indexOf("<CustomerRfmBoard"),
    );
    expect(firstView).toContain("mcfly-kpi-grid--peeks-lead");
    expect(firstView).toContain("mcfly-customers-hero");
    expect(firstView).toContain("if (salesPending)");
    expect(firstView).toContain("CUSTOMERS_THIN_EMPTY_LINE");
    expect(firstView).toContain("SAMPLE_CUSTOMERS_DOOR");
    expect(firstView).toContain("todaySalesTruncated");
    expect(firstView).toContain("CUSTOMERS_TODAY_TRUNCATED_LINE");
    expect(firstView).toContain("customersLastYearLine");
    expect(firstView).not.toMatch(/todaySalesTruncated\s*=\s*false/);
    expect(firstView).not.toContain("0.00×");
    expect(firstView).not.toMatch(/0%/);
    expect(firstView).not.toMatch(/>\$0</);
    expect(firstView).not.toContain("Klaviyo");
    expect(firstView).not.toContain("/app/email");
    for (const ban of CUSTOMERS_SPEND_BANS) {
      expect(firstView).not.toContain(ban);
      expect(customers).not.toContain(ban);
    }
    expect(customers).not.toContain("/app/spend");
    expect(customers).not.toContain("Total ROAS");
    const css = read("../styles/mcfly-desk.css");
    expect(css).toContain(".mcfly-customers-hero");
    expect(css).toContain(".mcfly-scoreboard--customers");
  });
});
