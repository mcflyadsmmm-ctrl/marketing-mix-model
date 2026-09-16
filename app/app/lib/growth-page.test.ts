import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const here = dirname(fileURLToPath(import.meta.url));
const growth = readFileSync(join(here, "../routes/app.growth.tsx"), "utf8");

describe("Growth page", () => {
  it("contrasts Shopify Analytics returning rate with order-history come-back", () => {
    expect(growth).toMatch(/Shopify Analytics/);
    expect(growth).toMatch(/second order|came back/i);
  });

  it("opens LTV, keeps pending honesty, and paints the growth book", () => {
    expect(growth).toContain("PRODUCT_NOUN.openLtv");
    expect(growth).toContain("/app/ltv");
    expect(growth).toContain("not $0");
    expect(growth).toContain('groups={["growth"]}');
    expect(growth).toContain("Retry to see who came back");
  });

  it("keeps first-order months and repeat rate from order history", () => {
    expect(growth).toContain("First orders by month");
    expect(growth).toContain("Repeat rate");
    expect(growth).toMatch(/Order\s+history/);
  });

  it("does not mention Klaviyo, explorer, or a returning-sales hero", () => {
    expect(growth).not.toMatch(/Klaviyo/i);
    expect(growth).not.toContain("SpendExplorer");
    expect(growth).not.toContain("Sales from returning customers");
    expect(growth).toContain('groups={["growth"]}');
  });
});
