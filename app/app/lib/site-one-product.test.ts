/**
 * Listing-trust pages and CTAs sell the $39 Shopify desk — not parked Custom inquire.
 * Partner Support URL is Fly /support. Do not scan historical docs/.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "../../..");

function read(rel: string) {
  return readFileSync(join(repoRoot, rel), "utf8");
}

const banned = [
  "custom-analytics#inquire",
  "Custom Data Solutions inquire",
] as const;

const lockedFiles = [
  "site/support.html",
  "site/privacy.html",
  "site/assets/cta-config.js",
  "site/assets/mcfly/chrome.js",
] as const;

describe("listing-trust pages sell one product (Shopify desk)", () => {
  it("does not sell parked Custom inquire on Support, Privacy, CTA config, or chrome", () => {
    for (const rel of lockedFiles) {
      const src = read(rel);
      for (const needle of banned) {
        expect(src, `${rel} still contains “${needle}”`).not.toContain(needle);
      }
    }
  });

  it("points inquire() at Support, with App Store Install as primary", () => {
    const cta = read("site/assets/cta-config.js");
    expect(cta).toContain("https://apps.shopify.com/mcfly-analytics-public");
    expect(cta).toMatch(/label:\s*"Install"/);
    expect(cta).toMatch(/function inquire\s*\(/);
    expect(cta).toMatch(/label:\s*"Contact support"/);
    expect(cta).toMatch(/href:\s*"\/support"/);
    expect(cta).not.toContain("/custom-analytics");
    expect(cta).not.toMatch(/Request engagement/);
  });

  it("Support sells Install + Gmail, SAMPLE /demo, 7-day then $39, 90 vs 24", () => {
    const support = read("site/support.html");
    expect(support).toContain("https://apps.shopify.com/mcfly-analytics-public");
    const gmail = support.indexOf("mcflyadsmmm@gmail.com");
    const invites = support.indexOf("invites@mcflyads.com");
    expect(gmail).toBeGreaterThan(-1);
    expect(invites).toBeGreaterThan(gmail);
    expect(support).toMatch(/7-day then \$39/);
    expect(support).toMatch(/90 days/);
    expect(support).toMatch(/24 months/);
    expect(support).toMatch(/href="\/demo"/);
    expect(support).toMatch(/no.{0,40}shop-domain form/i);
    expect(support).not.toMatch(/full-access/i);
    expect(support).not.toContain("/custom-analytics");
    expect(support).toMatch(/Overview · Orders · Customers · Spend · Goals/);
    expect(support).toMatch(/Growth and LTV live on Customers/);
    expect(support).not.toMatch(/whole desk \(Spend, Overview, LTV, Goals\)/);
  });

  it("Support does not promise Live while the host is parked", () => {
    const support = read("site/support.html");
    expect(support).not.toMatch(/Full desk/i);
    expect(support).toMatch(/when Live is unparked|SAMPLE-only/);
    expect(support).not.toContain("/custom-analytics");
    expect(support).toMatch(/Overview · Orders · Customers · Spend · Goals/);
    expect(support).toMatch(/Growth and LTV live on Customers/);
    expect(support).toContain("no Sample|Live toggle");
    expect(support).toMatch(/trust pages on this app host/i);
    expect(support).toMatch(/canonical marketing is mcflyads.com after Pages upload/i);
  });

  it("Privacy keeps Shopify scopes and does not claim a parked inquire form", () => {
    const privacy = read("site/privacy.html");
    expect(privacy).toContain("read_orders");
    expect(privacy).toContain("read_customers");
    expect(privacy).toContain("read_all_orders");
    expect(privacy).toContain("numberOfOrders");
    expect(privacy).toMatch(/Support contact/);
    expect(privacy).toContain("mcflyadsmmm@gmail.com");
    expect(privacy).not.toContain("/custom-analytics");
    expect(privacy).not.toMatch(/engagement form/i);
  });
});
