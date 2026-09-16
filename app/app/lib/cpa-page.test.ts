import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const here = dirname(fileURLToPath(import.meta.url));
const cpa = readFileSync(join(here, "../routes/app.cpa.tsx"), "utf8");

describe("CPA page", () => {
  it("contrasts Shopify Analytics ads-manager CPA with entered spend ÷ Shopify buyers", () => {
    expect(cpa).toContain("Shopify Analytics shows");
    expect(cpa).toContain("This page shows");
    expect(cpa).toMatch(/ads-manager|platform CPA/i);
    expect(cpa).toContain("entered spend");
    expect(cpa).toContain("Shopify buyers");
  });

  it("gates Cash CPA and Cash CAC on hasSpend and never paints $0", () => {
    expect(cpa).toContain("cashCostPerCustomer");
    expect(cpa).toContain("tillLtv.cashCac");
    expect(cpa).toMatch(/hasSpend && cashCpa != null/);
    expect(cpa).toMatch(/hasSpend && cashCac != null/);
    expect(cpa).toContain('hasSpend && cashCpa != null ? formatCurrency(cashCpa) : "—"');
    expect(cpa).toContain('hasSpend && cashCac != null ? formatCurrency(cashCac) : "—"');
    expect(cpa).toContain("Spend Upload");
    expect(cpa).not.toContain("0.00");
  });

  it("links Spend Upload and LTV", () => {
    expect(cpa).toContain('href="/app/spend"');
    expect(cpa).toContain('href="/app/ltv"');
  });

  it("does not mount SpendExplorer", () => {
    expect(cpa).not.toContain("SpendExplorer");
  });
});
