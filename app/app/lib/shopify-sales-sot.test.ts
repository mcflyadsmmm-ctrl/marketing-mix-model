/**
 * Sales SoT for Total ROAS — document + assert the chosen fields.
 * MASTER_PLAN §1: Action Total ROAS = Shopify Total Sales ÷ spend.
 * Net Sales = currentSubtotalPriceSet (toggle). Gross = Ads Manager secondary.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { PRODUCT_NOUN } from "./product-labels";
import {
  orderNetAmount,
  orderNetSalesAmount,
  orderTotalSalesAmount,
} from "./shopify-sales.server";

const here = dirname(fileURLToPath(import.meta.url));
const salesSource = readFileSync(join(here, "shopify-sales.server.ts"), "utf8");

describe("orderTotalSalesAmount (refund / missing currentTotal)", () => {
  it("keeps fully refunded orders at Total Sales 0 (never falls back to gross)", () => {
    expect(
      orderTotalSalesAmount({
        totalPriceSet: { shopMoney: { amount: "120.00" } },
        currentTotalPriceSet: { shopMoney: { amount: "0.00" } },
      }),
    ).toBe(0);
    expect(
      orderNetAmount({
        totalPriceSet: { shopMoney: { amount: "120.00" } },
        currentTotalPriceSet: { shopMoney: { amount: "0.00" } },
      }),
    ).toBe(0);
  });

  it("uses positive Total Sales when present", () => {
    expect(
      orderTotalSalesAmount({
        totalPriceSet: { shopMoney: { amount: "120.00" } },
        currentTotalPriceSet: { shopMoney: { amount: "95.50" } },
      }),
    ).toBe(95.5);
  });

  it("falls back to gross only when currentTotal amount is absent", () => {
    expect(
      orderTotalSalesAmount({
        totalPriceSet: { shopMoney: { amount: "120.00" } },
        currentTotalPriceSet: undefined,
      }),
    ).toBe(120);
  });
});

describe("orderNetSalesAmount (subtotal)", () => {
  it("uses currentSubtotalPriceSet when present", () => {
    expect(
      orderNetSalesAmount({
        totalPriceSet: { shopMoney: { amount: "120.00" } },
        currentTotalPriceSet: { shopMoney: { amount: "110.00" } },
        currentSubtotalPriceSet: { shopMoney: { amount: "90.00" } },
      }),
    ).toBe(90);
  });
});

describe("Shopify sales SoT (Total ROAS numerator)", () => {
  it("parses total, currentTotal, and currentSubtotal price sets on order nodes", () => {
    expect(salesSource).toContain("totalPriceSet");
    expect(salesSource).toContain("currentTotalPriceSet");
    expect(salesSource).toContain("currentSubtotalPriceSet");
  });

  it("sets action totalSales from Total Sales (currentTotalPriceSet)", () => {
    expect(salesSource).toContain("orderTotalSalesAmount");
    expect(salesSource).toContain("orderNetSalesAmount");
    expect(salesSource).toContain('salesBasisUsed: "total"');
    expect(salesSource).not.toMatch(/net\s*>\s*0\s*\?\s*net\s*:\s*gross/);
  });

  it("does not page orders(first:100) for desk / period sales totals", () => {
    expect(salesSource).not.toContain("fetchShopifySales");
    expect(salesSource).not.toContain("fetchShopifySalesByDay");
    expect(salesSource).not.toMatch(/orders\s*\(\s*first:\s*100/);
    expect(salesSource).not.toContain("LIVE_TODAY_MAX_PAGES");
  });

  it("exposes honesty copy for Total Sales + Net toggle", () => {
    expect(PRODUCT_NOUN.salesBasis).toMatch(/Total Sales/i);
    expect(PRODUCT_NOUN.salesBasisShort).toMatch(/Total Sales/i);
    expect(PRODUCT_NOUN.definition).toMatch(/Total Sales/i);
    expect(PRODUCT_NOUN.salesBasisNet).toMatch(/Net Sales/i);
    expect(PRODUCT_NOUN.cashClose).toMatch(/exact spend/i);
  });

  it("OrderFact ingest still excludes cancelled/test via formatPeriodQuery", () => {
    const periodsSource = readFileSync(join(here, "periods.ts"), "utf8");
    expect(periodsSource).toContain("formatPeriodQuery");
    expect(periodsSource).toMatch(/cancelled/i);
  });
});
