import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import {
  FLY_PRIVACY_URL,
  FLY_PUBLIC_ORIGIN,
  FLY_SUPPORT_URL,
  PUBLIC_ORIGIN_PATHS,
  isPublicOriginPath,
  isShopifyEmbeddedPath,
} from "./public-origin";
import { isShopifyAppPath } from "../../scripts/shopify-app-path.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const routes = join(here, "../routes");
const repoRoot = join(here, "../../..");

function read(name: string): string {
  return readFileSync(join(routes, name), "utf8");
}

function readRepo(rel: string): string {
  return readFileSync(join(repoRoot, rel), "utf8");
}

describe("Fly-origin App Store trust pages (1.1.4 live URLs)", () => {
  const pages = {
    support: read("support.tsx"),
    privacy: read("privacy.tsx"),
    terms: read("terms.tsx"),
    pricing: read("pricing.tsx"),
    shell: read("_index/OriginShell.tsx"),
  };

  it("do not claim waitlist, billing-later, or Meta-only Free", () => {
    for (const [name, src] of Object.entries(pages)) {
      expect(src, name).not.toMatch(/until Billing/i);
      expect(src, name).not.toMatch(/when Billing is announced/i);
      expect(src, name).not.toMatch(/listing is in review/i);
      expect(src, name).not.toMatch(/Free = Meta \+ Google/);
      expect(src, name).not.toMatch(/notify at launch/i);
    }
  });

  it("Support states live install, no shop-domain form, Live data, plan picker top frame", () => {
    const src = pages.support;
    expect(src).toMatch(/live Shopify Admin app/i);
    expect(src).toMatch(/\.myshopify\.com/);
    // Views are Sample data | Live data. "Practice" is not a desk view.
    expect(src).toMatch(/Sample data/);
    expect(src).toMatch(/Live data/i);
    expect(src).not.toMatch(/practice/i);
    expect(src).toMatch(/top Admin frame/i);
    expect(src).toMatch(/every named platform/i);
    expect(src).toMatch(/\$39/);
  });

  it("Privacy discloses PCD Level 1 scopes only", () => {
    const src = pages.privacy;
    expect(src).toContain("read_orders");
    expect(src).toContain("read_customers");
    expect(src).toContain("numberOfOrders");
    expect(src).toMatch(/No name, email, phone, or address/);
    expect(src).toContain("shop/redact");
  });

  it("Pricing and Terms match 7-day trial then $39 whole desk", () => {
    expect(pages.pricing).toMatch(/every platform including billboards/i);
    expect(pages.pricing).toMatch(/\$39 per store per month/i);
    expect(pages.terms).toMatch(/\$39\/store\/mo after a 7-day trial/);
    expect(pages.terms).toMatch(/Utah/);
  });

  it("public origin paths never load App Bridge", () => {
    expect(isPublicOriginPath("/")).toBe(true);
    expect(isPublicOriginPath("/support")).toBe(true);
    expect(isPublicOriginPath("/privacy")).toBe(true);
    expect(isPublicOriginPath("/terms")).toBe(true);
    expect(isPublicOriginPath("/pricing")).toBe(true);
    expect(PUBLIC_ORIGIN_PATHS).toContain("/support");
    expect(isPublicOriginPath("/app")).toBe(false);
    expect(isPublicOriginPath("/app/spend")).toBe(false);
    expect(isPublicOriginPath("/auth/login")).toBe(false);
    expect(isPublicOriginPath("/demo")).toBe(true);
    expect(isPublicOriginPath("/health")).toBe(true);
    expect(isShopifyEmbeddedPath("/app/billing")).toBe(true);
    expect(isShopifyEmbeddedPath("/support")).toBe(false);
    expect(isShopifyAppPath("/health")).toBe(true);
    expect(isShopifyAppPath("/app/spend")).toBe(true);
    expect(isShopifyAppPath("/support")).toBe(false);
    expect(isShopifyAppPath("/pricing")).toBe(false);
    const root = readRepo("app/app/root.tsx");
    expect(root).toContain("isPublicOriginPath(path)");
    expect(root).toContain("!isPublicOriginPath(path)");
  });

  it("Partner + TOML support URLs are the live Fly origin, not stale Pages", () => {
    const listing = readRepo("docs/APP_STORE_LISTING.md");
    const toml = readRepo("app/shopify.app.toml");
    const publicToml = readRepo("app/shopify.app.public.toml");
    const settings = read("app.settings.tsx");
    expect(listing).toContain(FLY_PRIVACY_URL);
    expect(listing).toContain(FLY_SUPPORT_URL);
    expect(listing).toContain(`${FLY_PUBLIC_ORIGIN}/terms`);
    expect(toml).toContain(`url = "${FLY_SUPPORT_URL}"`);
    expect(publicToml).toContain(`url = "${FLY_SUPPORT_URL}"`);
    expect(settings).toContain("FLY_SUPPORT_URL");
    expect(settings).not.toContain("https://mcflyads.com/support");
  });

  it("production server mounts repo site/ on Fly for listing Website URLs", () => {
    const serve = readRepo("app/scripts/serve-with-site.mjs");
    const paths = readRepo("app/scripts/shopify-app-path.mjs");
    const docker = readRepo("app/Dockerfile");
    const pkg = JSON.parse(readRepo("app/package.json"));
    expect(serve).toContain("MCFLY_SITE_ROOT");
    expect(serve).toContain("express.static(siteRoot");
    expect(serve).toContain('app.set("trust proxy", true)');
    expect(serve).toContain("admin.shopify.com");
    expect(paths).toContain('p === "/app"');
    expect(serve).toContain("shouldSkipMarketingSite");
    expect(serve).toContain("embeddedAppRedirectLocation");
    expect(serve).toContain('res.redirect(302, embeddedAppRedirectLocation(req))');
    expect(paths).toContain("isShopifyEmbeddedSearch");
    expect(docker).toContain("COPY site /repo/site");
    expect(docker).toContain("MCFLY_SITE_ROOT=/repo/site");
    const dockerignore = readRepo(".dockerignore");
    expect(dockerignore.split("\n")).not.toContain("site");
    expect(pkg.scripts.start).toContain("serve-with-site.mjs");
  });
});
