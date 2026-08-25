/**
 * Guards the 2026-08-24 App Store pause (ref 127166):
 * 2.1.1 Upgrade to Pro on Spend loaded admin.shopify.com in the iframe.
 * 4.5.4 / 4.5.5 testing credentials were empty in Partner.
 */
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, "../../..");
const appRoot = join(here, "..");

function readApp(rel: string): string {
  return readFileSync(join(appRoot, rel), "utf8");
}

function readRepo(rel: string): string {
  return readFileSync(join(repoRoot, rel), "utf8");
}

describe("App Store resubmit path (email 2026-08-24 / ref 127166)", () => {
  it("every Upgrade surface uses ProUpgradeButton / ProUpsellBlock, not a raw Admin href", () => {
    const surfaces = [
      "routes/app.spend.tsx",
      "routes/app.settings.tsx",
      "routes/app.ltv.tsx",
      "routes/app.goals.tsx",
      "routes/app.advanced.tsx",
      "routes/app._index.tsx",
    ];
    for (const rel of surfaces) {
      const src = readApp(rel);
      expect(src).toMatch(/ProUpgradeButton|ProUpsellBlock/);
      expect(src).not.toMatch(/href=\{?[`'"]https:\/\/admin\.shopify\.com/);
      expect(src).not.toMatch(/window\.location\.(href|assign|replace)/);
    }
  });

  it("root app shell supplies the Managed Pricing URL to Upgrade CTAs", () => {
    const src = readApp("routes/app.tsx");
    expect(src).toContain("BillingExitProvider");
    expect(src).toContain("buildManagedPricingPlansUrl");
    expect(src).toContain("plansUrl");
  });

  it("Partner testing paste pack covers 4.5.4 checkbox + 2.1.1 Spend → Upgrade", () => {
    const listing = readRepo("docs/APP_STORE_LISTING.md");
    const testing = readRepo("docs/PARTNER_TESTING_INSTRUCTIONS.md");
    for (const doc of [listing, testing]) {
      expect(doc).toMatch(/My app doesn't require an account/i);
      expect(doc).toMatch(/Upgrade to Pro/i);
      expect(doc).toMatch(/refused to connect/i);
      expect(doc).toMatch(/top frame|top-frame/i);
    }
    expect(testing).toMatch(/4\.5\.4/);
    expect(testing).toMatch(/4\.5\.5/);
    expect(existsSync(join(repoRoot, "docs/PARTNER_TESTING_INSTRUCTIONS.md"))).toBe(
      true,
    );
  });
});
