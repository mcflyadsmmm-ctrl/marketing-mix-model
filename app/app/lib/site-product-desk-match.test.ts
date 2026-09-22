import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const root = join(dirname(fileURLToPath(import.meta.url)), "../../..");
const product = readFileSync(join(root, "site/product.html"), "utf8");

const CHARCOAL = ["#0c1219", "#141c26", "#101820", "#161f2a"];

describe("/product matches the five-tab Shopify desk", () => {
  it("leads Overview → Orders → Customers and keeps Spend optional last", () => {
    expect(product).toContain("Overview → Orders → Customers. Spend optional last.");
    expect(product).toContain("<h1>Median ticket. Not Shopify AOV.</h1>");
    expect(product).not.toContain("Deeper than Shopify Analytics Overview.");
    expect(product).toMatch(/Repeat Customer Insights from \$59/);
    expect(product).toMatch(/Shopify Reports can already Group by day of week/);
    expect(product).toMatch(/Growth and LTV are Customers chips/);
    const thesis = product.indexOf("Overview → Orders → Customers. Spend optional last.");
    const overviewH3 = product.indexOf("<h3>Overview</h3>");
    const ordersH3 = product.indexOf("<h3>Orders</h3>");
    const customersH3 = product.indexOf("<h3>Customers</h3>");
    const spendH2 = product.indexOf("Add spend later.");
    expect(thesis).toBeGreaterThan(-1);
    expect(overviewH3).toBeGreaterThan(thesis);
    expect(ordersH3).toBeGreaterThan(overviewH3);
    expect(customersH3).toBeGreaterThan(ordersH3);
    expect(spendH2).toBeGreaterThan(customersH3);
    expect(product).not.toMatch(/Upload spend → see Total ROAS → hit Goals/);
    expect(product).not.toMatch(/<h3>Upload spend<\/h3>/);
    expect(product).not.toMatch(/Spend next to sales/);
  });

  it("keeps pricing honesty, SAMPLE demo, and listing Install", () => {
    expect(product).toMatch(/7-day trial, then \$39\/store\/mo/);
    expect(product).toMatch(/Trial is 90 days of order history/);
    expect(product).toMatch(/Paid is up to 24 months/);
    expect(product).toMatch(/Empty spend paints <strong>—<\/strong>/);
    expect(product).toContain('href="https://apps.shopify.com/mcfly-analytics-public"');
    expect(product).toContain('href="/demo"');
    expect(product).toContain("SAMPLE · Snowdevil · not a live client");
    expect(product).toContain("$68,457");
  });

  it("does not revive leftover IA, SAMPLE books, or spend-as-promise copy", () => {
    expect(product).not.toMatch(/Harbor/i);
    expect(product).not.toMatch(/Northline/i);
    expect(product).not.toMatch(/\$98,?500/);
    expect(product).not.toMatch(/4\.19\s*×/);
    expect(product).not.toMatch(/full-access/i);
    expect(product).not.toMatch(/full access/i);
    expect(product).not.toMatch(/trial includes 24 months/i);
    expect(product).not.toMatch(/eleven tab/i);
    expect(product).not.toMatch(/11 tab/i);
    expect(product).not.toMatch(/Custom inquire/i);
    expect(product).not.toMatch(/BE 2\.50× @ 40%/);
    expect(product).not.toMatch(/@ 40%/);
    expect(product).not.toMatch(/History back to January 2021/i);
    const heroStart = product.indexOf('<header class="page-hero">');
    const heroEnd = product.indexOf("</header>");
    const hero = product.slice(heroStart, heroEnd);
    expect(heroStart).toBeGreaterThan(-1);
    expect(heroEnd).toBeGreaterThan(heroStart);
    expect(hero).not.toMatch(/true ROAS/i);
    expect(hero).not.toMatch(/\bMTA\b/);
    expect(hero).not.toMatch(/\bpixel/i);
    expect(hero).not.toMatch(/P&amp;L|P&L/);
    for (const hex of CHARCOAL) {
      expect(product, `product.html still has ${hex}`).not.toContain(hex);
    }
    expect(product).not.toMatch(/float-card__v--accent[^}]*#5ee7f0/);
    expect(product).not.toContain("#5ee7f0");
  });
});
