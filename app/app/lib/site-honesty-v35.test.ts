/**
 * v35: stop selling uniqueness Shopify Reports and RCI already ship.
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

describe("v35 competitor and native-Analytics honesty", () => {
  const index = readSite("site/index.html");
  const product = readSite("site/product.html");
  const pricing = readSite("site/pricing.html");
  const faq = readSite("site/faq.html");
  const about = readSite("site/about.html");

  it("does not claim Overview uniqueness Shopify already ships", () => {
    expect(index).toContain(
      '<h1 class="h1 h1--line" id="hero-h">Deeper Shopify numbers Analytics does not show.</h1>',
    );
    expect(product).not.toContain("Deeper than Shopify Analytics Overview.");
    expect(product).not.toContain("Deeper Shopify numbers than Analytics Overview.");
    expect(pricing).not.toContain("numbers Analytics Overview does not put on one desk");
    expect(pricing).not.toContain("Deeper Shopify numbers than Analytics Overview.");
    expect(index).toMatch(/Reports can Group by day of week/);
    expect(index).toMatch(/Overview can already compare this range to last year|Shopify Overview can compare this range to last year/);
  });

  it("names Repeat Customer Insights from $59 as the closer LTV/latency app", () => {
    expect(index).toContain("Repeat Customer Insights from $59");
    expect(index).toContain("apps.shopify.com/repeat-customer-insights");
    expect(product).toContain("Repeat Customer Insights from $59");
    expect(pricing).toContain("Repeat Customer Insights from $59");
    expect(faq).toContain("Is this Repeat Customer Insights?");
    expect(about).toContain("Repeat Customer Insights from $59");
  });

  it("cites Better Reports, Polar $750, and does not plant Polar $1,020", () => {
    expect(index).toContain("Better Reports from $19.90");
    expect(index).toContain("apps.shopify.com/betterreports");
    expect(index).toContain("$750/mo");
    expect(index).not.toMatch(/\$1,?020/);
    expect(pricing).toContain("Better Reports from $19.90");
    expect(pricing).toContain("Polar from $750");
  });

  it("names TrueProfit from $35, ShopifyQL returning sales $, and kills all-or-nothing Admin", () => {
    expect(index).toContain("TrueProfit from $35/mo");
    expect(index).toContain("ShopifyQL can show returning sales $");
    expect(index).not.toContain("Shopify itself is all-or-nothing Admin");
    expect(faq).not.toContain("Shopify itself is all-or-nothing Admin");
    expect(faq).toContain("Shopify Admin can export Orders CSV");
    expect(pricing).toContain("TrueProfit from $35/mo");
    expect(pricing).toContain("Mcfly reviews: 0");
    expect(pricing).not.toMatch(/\$0\.30\/order|\$0\.3 per extra order/i);
  });

  it("discloses the live App Store card is still spend-first", () => {
    expect(index).toContain(
      "The live App Store card still leads with ad spend next to store sales",
    );
    expect(pricing).toContain(
      "The live App Store card still leads with ad spend next to store sales",
    );
  });
});
