/**
 * v41: drop planted Polar $1,020, leftover-cash language, and uniqueness remnants.
 * Locked home H1 stays. Listing 1.1.4 leftover is disclosed, not rewritten spend-first.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const root = join(dirname(fileURLToPath(import.meta.url)), "../../..");

function readSite(rel: string) {
  return readFileSync(join(root, rel), "utf8");
}

describe("v41 uniqueness leftovers off the live spine", () => {
  const index = readSite("site/index.html");
  const faq = readSite("site/faq.html");
  const product = readSite("site/product.html");
  const pricing = readSite("site/pricing.html");
  const about = readSite("site/about.html");
  const support = readSite("site/support.html");
  const privacy = readSite("site/privacy.html");
  const terms = readSite("site/terms.html");
  const chrome = readSite("site/assets/mcfly/chrome.js");
  const llms = readSite("site/llms.txt");
  const llmsFull = readSite("site/llms-full.txt");

  it("keeps the locked home H1 and does not plant Polar $1,020", () => {
    expect(index).toContain(
      '<h1 class="h1 h1--line" id="hero-h">Deeper Shopify numbers Analytics does not show.</h1>',
    );
    expect(index).toContain("Polar’s App Store list price starts at $750/mo");
    expect(index).not.toMatch(/\$1,?020/);
    expect(index).not.toContain("We do not invent Polar $1,020");
  });

  it("does not sell leftover-cash language or returning/weekend uniqueness as the gap", () => {
    expect(index).toContain("Typical order is the median");
    expect(index).toContain("Median ticket · spend optional");
    expect(index).not.toContain("leftover median");
    expect(index).not.toContain("Typical order is the leftover");
    expect(faq).not.toContain("Typical order is the leftover");
    expect(index).not.toContain(
      "Returning dollars, not the returning-customer rate",
    );
    expect(index).not.toContain("Typical order · returning dollars · spend optional");
    expect(faq).toContain("does not split Faire vs Online Store");
  });

  it("drops Polar-would, every-report slogan, and Goals-as-sales-plan", () => {
    expect(index).not.toContain("Polar would call this");
    expect(index).not.toContain("every report, not one report");
    expect(faq).not.toContain("every report, not one report");
    expect(product).not.toContain("Goals is the sales plan");
    expect(product).toContain(
      "Goals sits next to native monthly sales targets on Overview",
    );
    expect(product).toContain("no extra staff seat");
  });

  it("moves About, FAQ close, footer, and support off uniqueness slogans", () => {
    expect(about).toContain("<h1 class=\"h1 h1--line\" id=\"about-h\">Mcfly Ads builds Mcfly Analytics.</h1>");
    expect(about).not.toMatch(
      /id="about-h">Deeper Shopify numbers Analytics does not show\./,
    );
    expect(faq).not.toContain("Same Shopify numbers Analytics does not show");
    expect(chrome).toContain("typical order is the median, not Shopify AOV");
    expect(chrome).not.toContain("deeper Shopify numbers Analytics does not show");
    expect(support).not.toContain("Stuck on spend");
    expect(support).toContain("Install, billing, or a desk number?");
    expect(support).toContain(
      "read_all_orders</code> is not the public listing promise",
    );
  });

  it("drops Total ROAS desk from privacy OG and terms first chip", () => {
    expect(privacy).not.toContain("Total ROAS data diet");
    expect(terms).not.toContain("Terms of use for Mcfly Analytics — Total ROAS desk");
    expect(terms).toContain("<strong>Mcfly Analytics</strong>");
    expect(llms).not.toContain("deeper Shopify numbers Analytics does not show");
    expect(llmsFull).not.toContain("Returning dollars, not the returning-customer rate");
  });

  it("labels the home still as frozen SAMPLE, not the live demo clock", () => {
    expect(index).toContain("frozen Sep 1–16 still");
    expect(index).toContain("not the live /demo clock");
    expect(pricing).toContain("Typical order is the median");
    expect(pricing).toContain("Weekday grouping is native");
  });
});
