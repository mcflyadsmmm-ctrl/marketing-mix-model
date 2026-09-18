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
  buildCustomersHero,
  buildCustomersLeadPeeks,
  buildCustomersRfmBand,
  customersHeroBeatsShopifyAnalytics,
  customersOperatorGreeting,
} from "./customers-first-viewport";
import {
  RETENTION_GUEST_KEY,
  buildCustomerAnalytics,
  emptyCustomerAnalytics,
  type RetentionOrderRow,
} from "./customers-analytics";
import {
  buildCustomerRfm,
  emptyCustomerRfm,
} from "./customers-rfm";

const here = dirname(fileURLToPath(import.meta.url));
const DAY_MS = 86_400_000;
const WINDOW_END = new Date("2026-09-16T00:00:00Z");

function read(rel: string) {
  return readFileSync(join(here, rel), "utf8");
}

function at(daysBeforeEnd: number): Date {
  return new Date(WINDOW_END.getTime() - daysBeforeEnd * DAY_MS);
}

function book(
  spec: Array<{ key: string; orders: Array<{ d: number; amt: number }> }>,
): RetentionOrderRow[] {
  const rows: RetentionOrderRow[] = [];
  for (const buyer of spec) {
    for (const order of buyer.orders) {
      rows.push({
        customerKey: buyer.key,
        orderedAt: at(order.d),
        amount: order.amt,
      });
    }
  }
  return rows;
}

/** 10 matured buyers: slipping whales, champions, rising, quiet. */
function richBook(): RetentionOrderRow[] {
  const rows = book([
    {
      key: "whale-cold-a",
      orders: [
        { d: 80, amt: 900 },
        { d: 70, amt: 800 },
        { d: 60, amt: 700 },
        { d: 50, amt: 600 },
      ],
    },
    {
      key: "whale-cold-b",
      orders: [
        { d: 85, amt: 700 },
        { d: 75, amt: 650 },
        { d: 55, amt: 600 },
        { d: 45, amt: 550 },
      ],
    },
    {
      key: "whale-warm",
      orders: [
        { d: 70, amt: 800 },
        { d: 40, amt: 700 },
        { d: 8, amt: 650 },
      ],
    },
    {
      key: "champ-b",
      orders: [
        { d: 60, amt: 400 },
        { d: 20, amt: 380 },
        { d: 5, amt: 360 },
      ],
    },
    { key: "rise-a", orders: [{ d: 40, amt: 80 }] },
    { key: "rise-b", orders: [{ d: 35, amt: 70 }] },
    { key: "rise-c", orders: [{ d: 32, amt: 60 }] },
    {
      key: "quiet-a",
      orders: [
        { d: 70, amt: 120 },
        { d: 25, amt: 110 },
      ],
    },
    { key: "quiet-b", orders: [{ d: 55, amt: 90 }] },
    { key: "quiet-c", orders: [{ d: 50, amt: 85 }] },
  ]);
  rows.push({
    customerKey: RETENTION_GUEST_KEY,
    orderedAt: at(10),
    amount: 9999,
  });
  return rows;
}

function sealedFold() {
  const rows = richBook();
  return {
    analytics: buildCustomerAnalytics(rows, {
      windowEnd: WINDOW_END,
      historyWindowDays: 90,
    }),
    rfm: buildCustomerRfm(rows, {
      windowEnd: WINDOW_END,
      historyLimited: false,
    }),
  };
}

describe("customersOperatorGreeting", () => {
  it("leads with repurchase, whales, and at-risk vs Shopify Analytics list", () => {
    expect(
      customersOperatorGreeting({
        salesPending: false,
        orderCount: 24,
        identifiedBuyers: 10,
        repurchaseTypicalDays: 10,
        whaleCount: 2,
        atRiskBuyers: 2,
      }),
    ).toBe(
      "Typical repurchase day 10. 2 whales to reach. At risk: 2. Shopify Analytics Customers is a customer list.",
    );
    expect(CUSTOMERS_ANALYTICS_CONTRAST).not.toMatch(/sessions|ROAS|spend|email/i);
    expect(CUSTOMERS_FIRST_LANE_LABEL).toMatch(/RFM-lite/);
    expect(CUSTOMERS_FIRST_LANE_LABEL).toMatch(/whale|repurchase/i);
    expect(CUSTOMERS_THIN_EMPTY_LINE).toMatch(/not \$0/);
  });

  it("does not greet thin or pending shops as a $0 customer list", () => {
    expect(
      customersOperatorGreeting({
        salesPending: true,
        orderCount: 0,
        identifiedBuyers: 0,
        repurchaseTypicalDays: null,
        whaleCount: 0,
        atRiskBuyers: 0,
      }),
    ).toBe(CUSTOMERS_PENDING_LINE);
    expect(
      customersOperatorGreeting({
        salesPending: false,
        orderCount: 0,
        identifiedBuyers: 0,
        repurchaseTypicalDays: null,
      }),
    ).toBe("No identified buyers in this window yet.");
  });
});

describe("buildCustomersHero + lead peeks", () => {
  it("leads with RFM-lite and elevates whale / repurchase / win-back / Save now", () => {
    const { analytics, rfm } = sealedFold();
    const hero = buildCustomersHero(analytics, rfm);
    expect(hero?.kind).toBe("rfmLite");
    expect(hero?.k).toMatch(/RFM-lite/);
    expect(hero?.v).not.toBe("0");
    expect(hero?.v).not.toBe("$0");

    const peeks = buildCustomersLeadPeeks(analytics, rfm);
    expect(peeks.map((peek) => peek.hero)).toEqual([
      "whaleWatch",
      "repurchaseClock",
      "winBack",
      "actionCards",
    ]);
    expect(peeks[0]?.v).toMatch(/to reach/);
    expect(peeks[1]?.v).toMatch(/^Day /);
    expect(peeks[2]?.v).toMatch(/^Day /);
    expect(peeks[3]?.k).toBe("Save now");
    expect(peeks[3]?.verb).toBe("Save now");
    expect(Number(peeks[3]?.v)).toBeGreaterThan(0);
  });

  it("hides the repurchase peek when the giant already is the clock", () => {
    const analytics = buildCustomerAnalytics(
      book([
        { key: "a", orders: [{ d: 40, amt: 80 }, { d: 30, amt: 80 }] },
        { key: "b", orders: [{ d: 38, amt: 70 }, { d: 20, amt: 70 }] },
        { key: "c", orders: [{ d: 50, amt: 60 }, { d: 10, amt: 60 }] },
        { key: "d", orders: [{ d: 44, amt: 50 }, { d: 8, amt: 50 }] },
        { key: "e", orders: [{ d: 42, amt: 40 }, { d: 6, amt: 40 }] },
        { key: "f", orders: [{ d: 70, amt: 30 }] },
      ]),
      { windowEnd: WINDOW_END, historyWindowDays: 90 },
    );
    const rfm = emptyCustomerRfm();
    const hero = buildCustomersHero(analytics, rfm);
    expect(hero?.kind).toBe("repurchaseClock");
    const peeks = buildCustomersLeadPeeks(analytics, rfm, {
      hideRepurchase: true,
    });
    expect(peeks.map((peek) => peek.hero)).not.toContain("repurchaseClock");
    expect(peeks.some((peek) => peek.hero === "winBack")).toBe(true);
  });

  it("drops missing whale / clock / Save-now truths — never a $0 peek graveyard", () => {
    const peeks = buildCustomersLeadPeeks(emptyCustomerAnalytics(), emptyCustomerRfm());
    expect(peeks).toEqual([]);
    expect(buildCustomersHero(emptyCustomerAnalytics(), emptyCustomerRfm())).toBeNull();
    expect(buildCustomersRfmBand(emptyCustomerRfm())).toBeNull();
  });

  it("paints a four-segment RFM band that sums to the shop", () => {
    const { rfm } = sealedFold();
    const band = buildCustomersRfmBand(rfm);
    expect(band).not.toBeNull();
    expect(band?.map((slice) => slice.key)).toEqual([
      "champions",
      "rising",
      "at_risk",
      "quiet",
    ]);
    const buyers = band!.reduce((sum, slice) => sum + slice.buyers, 0);
    expect(buyers).toBe(rfm.identifiedBuyers);
  });
});

describe("Customers first-fold SCORECARD vs free Shopify Analytics", () => {
  it("PASS only when every first-fold hero is Mcfly-differentiated", () => {
    expect([...CUSTOMERS_FIRST_FOLD_HEROES]).toEqual([
      "rfmLite",
      "whaleWatch",
      "repurchaseClock",
      "winBack",
      "actionCards",
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
    expect(css).toContain(".mcfly-customers-rfmband");
    expect(css).toContain(".mcfly-scoreboard--customers");
  });
});
