/**
 * Sales SoT for Total ROAS — document + assert the chosen fields.
 * MASTER_PLAN §1: Action Total ROAS = net Shopify sales ÷ spend.
 * Gross (totalPriceSet) is Ads Manager–comparable secondary only.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { PRODUCT_NOUN } from "./product-labels";
import { orderNetAmount } from "./shopify-sales.server";

const here = dirname(fileURLToPath(import.meta.url));
const salesSource = readFileSync(join(here, "shopify-sales.server.ts"), "utf8");

describe("orderNetAmount (refund / missing currentTotal)", () => {
  it("keeps fully refunded orders at net 0 (never falls back to gross)", () => {
    expect(
      orderNetAmount({
        totalPriceSet: { shopMoney: { amount: "120.00" } },
        currentTotalPriceSet: { shopMoney: { amount: "0.00" } },
      }),
    ).toBe(0);
  });

  it("uses positive net when present", () => {
    expect(
      orderNetAmount({
        totalPriceSet: { shopMoney: { amount: "120.00" } },
        currentTotalPriceSet: { shopMoney: { amount: "95.50" } },
      }),
    ).toBe(95.5);
  });

  it("falls back to gross only when currentTotal amount is absent", () => {
    expect(
      orderNetAmount({
        totalPriceSet: { shopMoney: { amount: "120.00" } },
        currentTotalPriceSet: undefined,
      }),
    ).toBe(120);
    expect(
      orderNetAmount({
        totalPriceSet: { shopMoney: { amount: "80.00" } },
        currentTotalPriceSet: { shopMoney: {} },
      }),
    ).toBe(80);
  });
});

describe("Shopify sales SoT (Total ROAS numerator)", () => {
  it("queries both totalPriceSet (gross) and currentTotalPriceSet (net)", () => {
    expect(salesSource).toContain("totalPriceSet");
    expect(salesSource).toContain("currentTotalPriceSet");
    expect(salesSource).toMatch(/totalPriceSet\s*\{/);
    expect(salesSource).toMatch(/currentTotalPriceSet\s*\{/);
  });

  it("sets action totalSales from net (currentTotalPriceSet)", () => {
    // Action basis assignment — totalSales: netSales (not gross).
    expect(salesSource).toMatch(/totalSales:\s*netSales/);
    expect(salesSource).toContain('salesBasisUsed: "net"');
    // Never treat net===0 as missing (would inflate MER after full refunds).
    expect(salesSource).not.toMatch(/net\s*>\s*0\s*\?\s*net\s*:\s*gross/);
    expect(salesSource).toContain("orderNetAmount");
  });

  it("exposes honesty copy for sales after returns + order totals comparable", () => {
    expect(PRODUCT_NOUN.salesBasis).toMatch(/after returns/i);
    expect(PRODUCT_NOUN.salesBasis).toMatch(/Ads Manager/i);
    expect(PRODUCT_NOUN.salesBasisShort).toMatch(/after returns/i);
    expect(PRODUCT_NOUN.salesBasis).toMatch(/order totals/i);
    expect(PRODUCT_NOUN.cashClose).toMatch(/exact spend/i);
    expect(PRODUCT_NOUN.cashClose).toMatch(/any day/i);
    expect(PRODUCT_NOUN.definition).toMatch(/after returns/i);
  });

  it("sales query SoT excludes cancelled and test via formatPeriodQuery", () => {
    expect(salesSource).toContain("formatPeriodQuery");
    const periodsSource = readFileSync(join(here, "periods.ts"), "utf8");
    expect(periodsSource).toMatch(/status:open OR status:closed/);
    expect(periodsSource).toContain("test:false");
  });

  it("exposes capped today top-up budget (HARD-STOP vs unbounded desk crawl)", () => {
    expect(salesSource).toContain("LIVE_TODAY_MAX_PAGES");
    expect(salesSource).toContain("maxPages");
    expect(salesSource).toMatch(/HARD-STOP/);
  });

  it("flags truncatedByPageCap when maxPages stops with a remaining cursor", () => {
    expect(salesSource).toContain("truncatedByPageCap");
    expect(salesSource).toMatch(/truncatedByPageCap\s*=\s*true/);
  });
});
