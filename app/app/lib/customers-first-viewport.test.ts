import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  CUSTOMERS_ANALYTICS_CONTRAST,
  CUSTOMERS_FIRST_FOLD_HEROES,
  CUSTOMERS_FIRST_LANE_LABEL,
  CUSTOMERS_PENDING_LINE,
  CUSTOMERS_SPEND_BANS,
  CUSTOMERS_THIN_EMPTY_LINE,
  buildCustomersCompareKpis,
  buildCustomersHero,
  buildCustomersLeadPeeks,
  customersHeroBeatsShopifyAnalytics,
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
      }),
    ).toBe("Returning 62% · New 38%");
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
      }),
    ).toBe(CUSTOMERS_PENDING_LINE);
    expect(
      customersOperatorGreeting({
        salesPending: false,
        orderCount: 0,
        identifiedBuyers: 0,
        returningShare: null,
      }),
    ).toBe("No identified buyers in this window yet.");
  });
});

describe("buildCustomersHero + lead peeks", () => {
  it("leads with returning dollars and elevates new $ / dollars per buyer", () => {
    const book = dollarBook();
    const hero = buildCustomersHero(book);
    expect(hero?.kind).toBe("returningDollars");
    expect(hero?.k).toMatch(/Returning dollars/);
    expect(hero?.amount).toBe(600);
    expect(hero?.amount).not.toBe(0);

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
    const hero = buildCustomersHero(book);
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
    expect(buildCustomersHero(empty)).toBeNull();
  });
});

describe("buildCustomersCompareKpis", () => {
  it("shows last year's dollars for that window, and no percent", () => {
    const book = dollarBook();
    const kpis = buildCustomersCompareKpis(
      book,
      {
        onFile: true,
        returningSales: 500,
        newSales: 300,
        returningPerBuyer: 40,
        newPerBuyer: 25,
      },
      (n) => `$${n}`,
    );
    expect(kpis.map((k) => k.key)).toEqual(["returning", "new", "perBuyer"]);
    expect(kpis.map((k) => k.value)).toEqual(["$500", "$300", "$40"]);
    expect(kpis.every((k) => k.delta == null)).toBe(true);
    expect(kpis.some((k) => k.value === "$600" || k.value === "$60")).toBe(
      false,
    );
    expect(
      buildCustomersCompareKpis(book, CUSTOMERS_LAST_YEAR_EMPTY, (n) => `$${n}`),
    ).toEqual([]);
  });

  it("omits dollars per buyer when last year has no per-buyer figure", () => {
    const kpis = buildCustomersCompareKpis(
      dollarBook(),
      {
        onFile: true,
        returningSales: 500,
        newSales: 300,
        returningPerBuyer: null,
        newPerBuyer: null,
      },
      (n) => `$${n}`,
    );
    expect(kpis.map((k) => k.key)).toEqual(["returning", "new"]);
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
    expect(customers).toContain("<CustomersCompareGlance");
    expect(customers).not.toContain("mcfly-book__lede");
    expect(customers.indexOf("<CustomersFirstViewport")).toBeLessThan(
      customers.indexOf("<CustomersCompareGlance"),
    );
    expect(customers.indexOf("<CustomersCompareGlance")).toBeLessThan(
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
    expect(firstView).toContain("mcfly-customers-plane");
    expect(firstView).toContain("mcfly-overview-plane");
    expect(firstView).toContain("mcfly-split");
    expect(firstView).toContain("CUSTOMERS_THIN_EMPTY_LINE");
    expect(firstView).toContain("SAMPLE_CUSTOMERS_DOOR");
    expect(firstView).toContain("CUSTOMERS_ANALYTICS_SR_LINE");
    expect(firstView).not.toContain("<s-section");
    expect(firstView).not.toContain("mcfly-kpi-grid--peeks-lead");
    expect(firstView).not.toContain("mcfly-kpi--soft");
    expect(firstView).not.toContain("0.00×");
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
