/**
 * v40: listing-chrome first fold. Locked home H1 stays. No invented stars.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const root = join(dirname(fileURLToPath(import.meta.url)), "../../..");

function readSite(rel: string) {
  return readFileSync(join(root, rel), "utf8");
}

describe("v40 listing-chrome first fold", () => {
  const index = readSite("site/index.html");
  const faq = readSite("site/faq.html");
  const demo = readSite("site/demo.html");
  const css = readSite("site/assets/mcfly/mcfly.css");

  it("keeps the locked home H1 and refuses invented Polar $1,020", () => {
    expect(index).toContain(
      '<h1 class="h1 h1--line" id="hero-h">Deeper Shopify numbers Analytics does not show.</h1>',
    );
    expect(index).toContain("We do not invent Polar $1,020");
  });

  it("puts colon jobs and listing leftover in the home fold", () => {
    expect(index).toContain("Typical order is the leftover median");
    expect(index).toContain("Shopify AOV is the mean");
    expect(index).toContain("Spend optional last");
    expect(index).toContain("$39 after 7-day");
    expect(index).toContain('href="/faq#listing-card"');
    expect(index).toContain("App Store card still says ad spend");
    const faqHome = index.slice(index.indexOf('id="faq-home"'));
    const uniq = faqHome.indexOf("What does this show that Shopify Analytics Overview does not?");
    const pixel = faqHome.indexOf("Do you put a pixel on my storefront?");
    expect(uniq).toBeGreaterThan(0);
    expect(pixel).toBeGreaterThan(uniq);
  });

  it("FAQ H1 is 0 reviews + median, with listing-card anchor", () => {
    expect(faq).toContain("<h1>0 reviews. Median ticket.</h1>");
    expect(faq).not.toContain("<h1>FAQ</h1>");
    expect(faq).toContain('id="listing-card"');
    expect(faq).toContain(
      "The live App Store card still leads with ad spend next to store sales",
    );
    expect(faq).toMatch(/Deeper Shopify numbers Analytics does not show/);
  });

  it("demo iframe sits immediately after the tight hero", () => {
    const heroEnd = demo.indexOf("</header>");
    const iframe = demo.indexOf("<iframe");
    const caption = demo.indexOf("Overview same-clock");
    expect(heroEnd).toBeGreaterThan(0);
    expect(iframe).toBeGreaterThan(heroEnd);
    expect(caption).toBeGreaterThan(iframe);
    expect(demo).toContain("<h1>Full Snowdevil SAMPLE demo.</h1>");
  });

  it("hides hero YoY on phone so Install stays in the fold", () => {
    expect(css).toMatch(
      /@media \(max-width: 859px\)[\s\S]*\.hero--v25 \.dd-yoy[\s\S]*display:\s*none/,
    );
  });
});
