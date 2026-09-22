/**
 * v38: leftover uniqueness Shopify already ships, plus TrueProfit listing stars.
 * Locked home H1 stays. Polar $1,020 is not planted, even as a refusal.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const root = join(dirname(fileURLToPath(import.meta.url)), "../../..");

function readSite(rel: string) {
  return readFileSync(join(root, rel), "utf8");
}

describe("v38 native leftover and listing-star honesty", () => {
  const index = readSite("site/index.html");
  const product = readSite("site/product.html");
  const pricing = readSite("site/pricing.html");
  const faq = readSite("site/faq.html");
  const about = readSite("site/about.html");

  it("keeps the locked home H1 and does not plant Polar $1,020", () => {
    expect(index).toContain(
      '<h1 class="h1 h1--line" id="hero-h">Deeper Shopify numbers Analytics does not show.</h1>',
    );
    expect(index).not.toMatch(/\$1,?020/);
  });

  it("sells median leftover instead of native returning/weekend/LTV as the gap", () => {
    expect(index).toContain("Typical order is the median");
    expect(faq).toContain("Typical order is the median");
    expect(faq).toContain("no native median ticket");
    expect(faq).toContain("customer cohort reports");
    expect(faq).toContain("LTV 30/90/365 is observed orders");
    expect(index).toContain("ShopifyQL can show returning sales $");
    expect(index).toMatch(/Reports can Group by day of week/);
    expect(index).not.toContain(
      "Days-to-second is on this board, not a separate LTV app",
    );
    expect(faq).not.toContain(
      "Typical order, returning dollars, weekend mix, days-to-second, and LTV 30/90/365 from orders you already have",
    );
  });

  it("does not sell Goals as a Mcfly monthly sales-plan product", () => {
    expect(index).toContain(
      "Native already pins monthly sales targets on Overview",
    );
    expect(pricing).toContain(
      "Native already pins monthly sales targets on Overview",
    );
    expect(about).toContain(
      "Native already pins monthly sales targets on Overview",
    );
    expect(index).not.toContain("Monthly sales plan from Shopify orders");
    expect(pricing).not.toContain("Goals is the monthly sales plan from Shopify orders");
    expect(about).not.toContain("Monthly sales plan from Shopify orders");
  });

  it("names Grow Dashboards vs Reports instead of every-report-not-one-card", () => {
    expect(index).toContain(
      "Grow staff can be Dashboards only (Overview + Live view)",
    );
    expect(faq).toContain(
      "Grow staff can be Dashboards only (Overview + Live view)",
    );
    expect(index).not.toContain("every report, not one card");
    expect(faq).not.toContain("every report, not one card");
  });

  it("drops returning-dollars uniqueness from the product H1", () => {
    expect(product).toContain("<h1>Median ticket. Not Shopify AOV.</h1>");
    expect(product).not.toContain(
      "<h1>Median ticket. Returning dollars. One board.</h1>",
    );
    expect(product).toContain("ShopifyQL can show returning sales $");
  });

  it("matches today’s TrueProfit listing stars and Lifetimely ladder", () => {
    expect(index).toContain("TrueProfit listing 4.9 (898)");
    expect(index).not.toContain("TrueProfit listing 5.0 (880)");
    expect(index).toContain("Lifetimely listing: Free / $49 / $149 / $299");
    expect(pricing).toContain("Lifetimely listing: Free / $49 / $149 / $299");
  });
});
