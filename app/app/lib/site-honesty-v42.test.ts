/**
 * v42: leftover Goals sales-plan strings on /product and collage JS.
 * FAQ H1 stays 0 reviews + median (do not revert to “FAQ”). Locked home H1 stays.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const root = join(dirname(fileURLToPath(import.meta.url)), "../../..");

function readSite(rel: string) {
  return readFileSync(join(root, rel), "utf8");
}

describe("v42 Goals leftovers off product and collage", () => {
  const index = readSite("site/index.html");
  const product = readSite("site/product.html");
  const faq = readSite("site/faq.html");
  const desk = readSite("site/assets/demo-desk.js");
  const privacy = readSite("site/privacy.html");
  const redirects = readSite("site/_redirects");

  it("keeps the locked home H1 and FAQ listing-chrome H1", () => {
    expect(index).toContain(
      '<h1 class="h1 h1--line" id="hero-h">Deeper Shopify numbers Analytics does not show.</h1>',
    );
    expect(faq).toContain("<h1>0 reviews. Median ticket.</h1>");
    expect(faq).not.toContain("<h1>FAQ</h1>");
  });

  it("does not sell Goals as a sales-plan product on /product or collage JS", () => {
    expect(product).not.toContain("Goals is the sales plan");
    expect(product).not.toContain("Sales vs the calendar");
    expect(product).toContain(
      "Native already pins monthly sales targets on Overview",
    );
    expect(product).toContain("not a second sales-plan product");
    expect(desk).not.toContain("Monthly sales plan");
    expect(desk).toContain("Optional Total ROAS vs break-even · spend last");
  });

  it("names Grow staff Dashboards, parks /inquire, and stamps privacy this ship", () => {
    expect(index).toContain(
      "Grow staff can be Dashboards only (Overview + Live view)",
    );
    expect(index).not.toContain("Grow+");
    expect(faq).not.toContain("Grow+");
    expect(redirects).toMatch(/\/inquire\s+\/support\s+301/);
    expect(privacy).toContain("Last updated: September 22, 2026");
    expect(privacy).not.toContain("Last updated: July 28, 2026");
  });
});
