import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  FLY_ORIGIN_SITE_REDIRECTS,
  flyOriginSiteRedirect,
} from "./fly-origin-redirects";

const here = dirname(fileURLToPath(import.meta.url));

describe("Fly origin splash (A3)", () => {
  const splash = readFileSync(join(here, "../routes/_index/route.tsx"), "utf8");

  it("does not sell Install Free", () => {
    expect(splash).not.toMatch(/Install Free/i);
    expect(splash).not.toMatch(/Install[^\n]*\(Free\)/i);
  });

  it("states 7-day trial then $39/mo", () => {
    expect(splash).toMatch(/7-day trial, then \$39\/mo/);
  });

  it("primary CTA installs from the App Store listing", () => {
    expect(splash).toContain("https://apps.shopify.com/mcfly-analytics-public");
    expect(splash).toMatch(/>\s*Install\s*</);
  });

  it("secondary links visit the site and support", () => {
    expect(splash).toContain("https://mcflyads.com/");
    expect(splash).toContain("https://mcflyads.com/support");
  });
});

describe("Fly origin trust redirects", () => {
  it("301s privacy, support, pricing, terms, and faq to mcflyads.com", () => {
    expect(FLY_ORIGIN_SITE_REDIRECTS).toEqual({
      privacy: "https://mcflyads.com/privacy",
      support: "https://mcflyads.com/support",
      pricing: "https://mcflyads.com/pricing",
      terms: "https://mcflyads.com/terms",
      faq: "https://mcflyads.com/faq",
    });
    for (const path of Object.keys(FLY_ORIGIN_SITE_REDIRECTS)) {
      const response = flyOriginSiteRedirect(
        path as keyof typeof FLY_ORIGIN_SITE_REDIRECTS,
      );
      expect(response.status).toBe(301);
      expect(response.headers.get("Location")).toBe(
        FLY_ORIGIN_SITE_REDIRECTS[path as keyof typeof FLY_ORIGIN_SITE_REDIRECTS],
      );
    }
  });

  it("each trust route throws the matching 301 helper", () => {
    for (const path of Object.keys(FLY_ORIGIN_SITE_REDIRECTS)) {
      const src = readFileSync(join(here, `../routes/${path}.tsx`), "utf8");
      expect(src).toContain(`flyOriginSiteRedirect("${path}")`);
    }
  });
});

describe("Docs SoT — listing is not Free; success price $39", () => {
  const docsRoot = join(here, "../../../docs");

  it("APP_STORE_LISTING / BILLING_TIERS / VALUE_THESIS / MASTER_DIRECTIVE agree", () => {
    const listing = readFileSync(join(docsRoot, "APP_STORE_LISTING.md"), "utf8");
    const billing = readFileSync(join(docsRoot, "BILLING_TIERS.md"), "utf8");
    const thesis = readFileSync(join(docsRoot, "VALUE_THESIS.md"), "utf8");
    const directive = readFileSync(join(docsRoot, "MASTER_DIRECTIVE.md"), "utf8");

    for (const text of [listing, billing, thesis, directive]) {
      expect(text).toMatch(/\$39/);
      expect(text).not.toMatch(/Listing Pricing stays Free/);
      expect(text).not.toMatch(/Install Mcfly Analytics from the Shopify App Store \(Free\)/);
    }

    expect(listing).toMatch(/7-day trial/);
    expect(listing).toMatch(/read_all_orders.*live in scopes/i);
    expect(listing).not.toMatch(/\*\*Pricing\*\* \| \*\*Free\*\*/);
    expect(billing).toMatch(/Not a Free App Store plan/i);
    expect(thesis).toMatch(/Success price is \*\*\$39\*\*, not ~\$79/);
    expect(directive).toMatch(/7-day trial, then \$39\/mo flat/);
  });
});
