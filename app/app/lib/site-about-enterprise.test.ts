import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const root = join(dirname(fileURLToPath(import.meta.url)), "../../..");
const about = readFileSync(join(root, "site/about.html"), "utf8");

describe("site /about enterprise desk", () => {
  it("keeps the H1, founder, Utah firm, and Mcfly Analytics titles", () => {
    expect(about).toMatch(
      /<h1[^>]*>Deeper Shopify numbers Analytics does not show\.<\/h1>/,
    );
    expect(about).toContain("Marty Smithson");
    expect(about).toContain("Utah");
    expect(about).toContain("Mcfly Ads builds Mcfly Analytics");
    expect(about).toContain("mcflyadsmmm@gmail.com");
    expect(about).toContain("<title>About | Mcfly Analytics</title>");
    expect(about).toContain('content="About | Mcfly Analytics"');
    expect(about).toContain('href="https://mcflyads.com/about"');
  });

  it("names the five analysis tabs plus Settings in one sentence", () => {
    expect(about).toMatch(
      /Five analysis tabs plus Settings:\s*Overview · Orders · Customers · Spend · Goals/,
    );
    expect(about).toMatch(/Growth and LTV are Customers chips/);
    expect(about).toMatch(
      /Overview, Orders, and Customers work at \$0 spend/,
    );
  });

  it("states the 90-day trial book, 24-month paid book, and one $39 plan", () => {
    expect(about).toContain("90 days");
    expect(about).toContain("24 months");
    expect(about).toContain("$39");
    expect(about).toContain("7-day");
    expect(about).toMatch(/Trial is 90 days of order history/);
    expect(about).toMatch(/Paid is up to 24 months/);
    expect(about).toMatch(/7-day trial then \$39\/store\/mo/);
    expect(about).toMatch(/Uninstall stops the charge/);
    expect(about).toMatch(/No Free plan/);
    expect(about).toMatch(/Not a GMV tax/);
  });

  it("installs from the App Store and SAMPLE /demo — no shop-domain form", () => {
    expect(about).toContain("https://apps.shopify.com/mcfly-analytics-public");
    expect(about).toMatch(/href="\/demo"/);
    expect(about).toMatch(/No shop-domain form/);
    expect(about).not.toMatch(/<form/i);
    expect(about).not.toMatch(/myshopify\.com/i);
  });

  it("refuses pixels, MTA, true ROAS, and the parked Custom lane", () => {
    expect(about).toMatch(/No pixels/);
    expect(about).toMatch(/No MTA/);
    expect(about).toMatch(/true ROAS/);
    expect(about).toContain("No COGS/P&amp;L hero");
    expect(about).toContain("No sessions/visitors");
    expect(about).toMatch(/No Amazon/);
    expect(about).toMatch(/No Recharge/);
    expect(about).toContain("Empty spend paints — never 0×");
    expect(about).toContain(
      "Custom Data Solutions is parked; this firm sells the Shopify desk",
    );
  });

  it("stays paper/sky on mcfly.css — no theater leftovers", () => {
    expect(about).toContain("/assets/mcfly/mcfly.css");
    expect(about).not.toContain("site.css");
    expect(about).toContain("section--paper");
    expect(about).toContain("section--ink");
    expect(about).toContain('class="kicker"');
    expect(about).toContain('class="h2"');
    expect(about).toContain('class="lede"');
    expect(about).toContain("cta-row");
    expect(about).toContain("link-cta");
    expect(about).toContain('class="fine"');
    expect(about).not.toMatch(/full-access/i);
    expect(about).not.toContain("custom-analytics");
    expect(about).not.toContain("$98,500");
    expect(about).not.toMatch(/4\.9/);
    expect(about).not.toContain("Harbor Home Co");
    expect(about).not.toContain("Northline");
    expect(about).not.toMatch(/beats SaaS/i);
    expect(about).not.toMatch(/500-seat/i);
    expect(about).not.toMatch(/cash desk/i);
    expect(about).not.toMatch(/\bMonday\b/);
  });
});
