import { describe, expect, it } from "vitest";
import {
  CUSTOMERS_CONTRAST,
  CUSTOMERS_KICKER,
  CUSTOMERS_RETURNING_EMPTY,
  customerConcentrationHeadline,
  customerConcentrationPareto,
  customerConcentrationRows,
  customerDollarSplit,
  customersReturningDollars,
  wholePercent,
} from "./customers-scoreboard";

describe("customersReturningDollars", () => {
  it("is dollars or an em dash, never headcount or a fake $0", () => {
    expect(customersReturningDollars(4200)).toBe(4200);
    expect(customersReturningDollars(0)).toBeNull();
    expect(customersReturningDollars(-10)).toBeNull();
    expect(customersReturningDollars(null)).toBeNull();
    expect(customersReturningDollars(undefined)).toBeNull();
  });
});

describe("customerDollarSplit", () => {
  it("splits returning vs new dollars into whole percents", () => {
    expect(
      customerDollarSplit({ newSalesShare: 0.3, returningSalesShare: 0.7 }),
    ).toEqual({
      returningShare: 0.7,
      newShare: 0.3,
      returningPct: 70,
      newPct: 30,
    });
  });

  it("fills the missing side from the known share", () => {
    const split = customerDollarSplit({
      newSalesShare: null,
      returningSalesShare: 0.6,
    });
    expect(split).not.toBeNull();
    expect(split?.returningPct).toBe(60);
    expect(split?.newPct).toBe(40);
  });

  it("is null when neither side has a real share", () => {
    expect(
      customerDollarSplit({ newSalesShare: null, returningSalesShare: null }),
    ).toBeNull();
    expect(
      customerDollarSplit({ newSalesShare: 0, returningSalesShare: 0 }),
    ).toBeNull();
  });

  it("keeps an all-new window honest (returning rounds to 0)", () => {
    const split = customerDollarSplit({
      newSalesShare: 0.98,
      returningSalesShare: 0.004,
    });
    expect(split?.newPct).toBe(98);
    expect(split?.returningPct).toBe(0);
  });
});

describe("customerConcentrationRows", () => {
  it("ranks share-of-sales rows biggest first and leads with top customers", () => {
    const rows = customerConcentrationRows({
      topCustomerSalesShare: 0.4,
      returningSalesShare: 0.6,
      repeatSalesShare: 0.5,
      topDecileSalesShare: 0.55,
    });
    expect(rows.map((r) => r.key)).toEqual([
      "returning",
      "biggestOrders",
      "repeat",
      "topCustomers",
    ]);
    const top = rows.find((r) => r.key === "topCustomers");
    expect(top?.lead).toBe(true);
    expect(rows.filter((r) => r.lead)).toHaveLength(1);
  });

  it("withholds unknown and rounds-to-0% rows, never a fake 0%", () => {
    const rows = customerConcentrationRows({
      topCustomerSalesShare: null,
      returningSalesShare: 0.72,
      repeatSalesShare: 0.004,
      topDecileSalesShare: null,
    });
    expect(rows.map((r) => r.key)).toEqual(["returning"]);
  });

  it("is empty when nothing is known", () => {
    expect(
      customerConcentrationRows({
        topCustomerSalesShare: null,
        returningSalesShare: null,
        repeatSalesShare: null,
        topDecileSalesShare: null,
      }),
    ).toEqual([]);
  });
});

describe("customerConcentrationPareto", () => {
  it("splits top 10% vs the rest, or null when unknown", () => {
    expect(customerConcentrationPareto(0.42)).toEqual({
      topPct: 42,
      restPct: 58,
    });
    expect(customerConcentrationPareto(0)).toBeNull();
    expect(customerConcentrationPareto(null)).toBeNull();
  });
});

describe("customerConcentrationHeadline", () => {
  it("reads the concentration in one sentence, or null", () => {
    expect(customerConcentrationHeadline(0.42)).toBe(
      "Top 10% of customers drive 42% of sales.",
    );
    expect(customerConcentrationHeadline(null)).toBeNull();
  });
});

describe("wholePercent", () => {
  it("rounds to a whole percent", () => {
    expect(wholePercent(0.425)).toBe(43);
    expect(wholePercent(0.5)).toBe(50);
  });
});

describe("copy stays on the niche — dollars, not headcount, no spend", () => {
  it("contrasts returning dollars with the Shopify headcount rate", () => {
    expect(CUSTOMERS_CONTRAST).toMatch(/returning-customer rate/i);
    expect(CUSTOMERS_CONTRAST).toMatch(/headcount/i);
    expect(CUSTOMERS_CONTRAST).toMatch(/dollars/i);
    expect(CUSTOMERS_KICKER).toMatch(/dollars, not headcount/i);
    expect(CUSTOMERS_RETURNING_EMPTY).toMatch(/not \$0/);
  });

  it("never introduces ad spend or ROAS on this tab", () => {
    for (const copy of [
      CUSTOMERS_CONTRAST,
      CUSTOMERS_KICKER,
      CUSTOMERS_RETURNING_EMPTY,
    ]) {
      expect(copy).not.toMatch(/Total ROAS|ad spend|Spend Upload|Cash CAC/i);
    }
  });
});
