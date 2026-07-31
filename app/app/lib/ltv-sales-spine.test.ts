/**
 * LTV route sales spine — HARD-STOP regression (source assert).
 * Same pattern as shopify-sales-sot: prove live path uses loadDeskSalesForPeriod,
 * never unbounded multi-day fetchShopifySales without maxPages.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

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
});
