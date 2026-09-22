/**
 * v35 native-gap cook: live v34 leftover uniqueness lies must stay dead.
 * Home H1 stays locked. Do not claim Mcfly invented YoY or weekday reports.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const root = join(dirname(fileURLToPath(import.meta.url)), "../../..");

function readSite(rel: string) {
  return readFileSync(join(root, rel), "utf8");
}

const pages = [
  "site/index.html",
  "site/pricing.html",
  "site/product.html",
  "site/faq.html",
  "site/demo.html",
] as const;

describe("site copy does not invent native Analytics gaps", () => {
  it("keeps the locked home H1 and drops YoY / weekday / all-or-nothing leftovers", () => {
    const home = readSite("site/index.html");
    expect(home).toContain(
      '<h1 class="h1 h1--line" id="hero-h">Deeper Shopify numbers Analytics does not show.</h1>',
    );
    expect(home).toContain('content="v35"');
    expect(home).toContain("mcfly.css?v=20260922v35");
    expect(home).toContain("chrome.js?v=20260922v35");

    for (const rel of pages) {
      const src = readSite(rel);
      expect(src, `${rel} still invents YoY`).not.toContain(
        "last year next to this month",
      );
      expect(src, `${rel} still calls Admin all-or-nothing`).not.toContain(
        "all-or-nothing Admin",
      );
      expect(
        src,
        `${rel} still treats weekend as a missing native report`,
      ).not.toContain("numbers Analytics Overview does not put on one desk");
    }

    expect(home).toMatch(/compare to last year/);
    expect(home).toMatch(/Reports already group sales by weekday/);
    expect(home).toMatch(/ShopifyQL already has returning sales/);
    expect(home).toMatch(/Shopify staff with Analytics see every report/);
  });

  it("FAQ and pricing name Reports/ShopifyQL instead of a fake Analytics hole", () => {
    const faq = readSite("site/faq.html");
    const pricing = readSite("site/pricing.html");
    const product = readSite("site/product.html");
    const demo = readSite("site/demo.html");

    expect(faq).toContain("What does Mcfly show that Analytics does not?");
    expect(faq).toContain("Reports can group sales by weekday");
    expect(faq).toContain("ShopifyQL has returning sales $");
    expect(faq).toContain("Shopify Admin can export Orders CSV");
    expect(pricing).toContain("Reports already group by weekday");
    expect(product).toContain("Reports already group sales by weekday");
    expect(product).toContain("Discounts and returns already exist as native reports");
    expect(demo).toMatch(/Native Overview can set start and end times/);
    expect(demo).toMatch(/Overview same-clock[\s\S]{0,280}full-day compare/);
  });
});
