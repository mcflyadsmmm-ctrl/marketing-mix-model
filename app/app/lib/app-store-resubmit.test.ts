/**
 * Guards the 2026-08-24 App Store pause (ref 127166):
 * 2.1.1 Upgrade to Pro on Spend loaded admin.shopify.com in the iframe.
 * 4.5.4 / 4.5.5 testing credentials were empty in Partner.
 */
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { parseSpendCsv } from "./spend-csv";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, "../../..");
const appRoot = join(here, "..");

function readApp(rel: string): string {
  return readFileSync(join(appRoot, rel), "utf8");
}

function readRepo(rel: string): string {
  return readFileSync(join(repoRoot, rel), "utf8");
}

function testingPaste(): string {
  const testing = readRepo("docs/PARTNER_TESTING_INSTRUCTIONS.md");
  const start = testing.indexOf("<!-- APP_STORE_PASTE:testing -->");
  const end = testing.indexOf("<!-- /APP_STORE_PASTE:testing -->");
  expect(start).toBeGreaterThan(-1);
  expect(end).toBeGreaterThan(start);
  return testing.slice(start, end);
}

/**
 * Naive JSX Form-depth at each match of `needle`. Nested `<form>` is invalid HTML:
 * the parser ignores the inner start tag, so Upgrade / Practice CTAs would POST
 * the outer spend form instead of leaving the embed (pause email 2.1.1).
 */
function formDepthAtMatches(source: string, needle: RegExp): number[] {
  const events: Array<{ index: number; delta: number }> = [];
  const formTag = /<\/?Form\b/g;
  let tag: RegExpExecArray | null;
  while ((tag = formTag.exec(source))) {
    events.push({
      index: tag.index,
      delta: tag[0] === "<Form" ? 1 : -1,
    });
  }
  const depths: number[] = [];
  let match: RegExpExecArray | null;
  const scanner = new RegExp(needle.source, needle.flags.includes("g") ? needle.flags : `${needle.flags}g`);
  while ((match = scanner.exec(source))) {
    const depth = events
      .filter((event) => event.index < match!.index)
      .reduce((sum, event) => sum + event.delta, 0);
    depths.push(depth);
  }
  return depths;
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
    }
    expect(testing).toMatch(/refused to connect/i);
    expect(testing).toMatch(/top frame|TOP Admin frame/i);
    expect(testing).toMatch(/4\.5\.4/);
    expect(testing).toMatch(/4\.5\.5/);
    expect(existsSync(join(repoRoot, "docs/PARTNER_TESTING_INSTRUCTIONS.md"))).toBe(
      true,
    );
  });

  it("4.5.4 testing instructions include credentials (none) and never a password placeholder", () => {
    const listing = readRepo("docs/APP_STORE_LISTING.md");
    const paste = testingPaste();
    expect(paste).toMatch(/TEST ACCOUNT/);
    expect(paste).toMatch(/Username: none/);
    expect(paste).toMatch(/Password: none/);
    expect(paste).toMatch(/complete feature set/i);
    expect(paste).toMatch(/Upgrade to Pro/);
    expect(paste).toMatch(/SAMPLE desk OFF/i);
    expect(paste).not.toMatch(/<PASTE/);
    expect(listing).not.toMatch(/<PASTE CURRENT STAFF PASSWORD>/);
  });

  it("Spend Upgrade to Pro is outside the Add spend Form (2.1.1 nested-form brick)", () => {
    const spend = readApp("routes/app.spend.tsx");
    expect(spend).toMatch(/ProUpsellBlock/);

    const formStart = spend.indexOf(
      '<Form method="post" className="mcfly-spend-add__form"',
    );
    expect(formStart).toBeGreaterThan(-1);
    const formEnd = spend.indexOf("</Form>", formStart);
    expect(formEnd).toBeGreaterThan(formStart);
    const formInner = spend.slice(formStart, formEnd);
    expect(formInner).not.toMatch(/ProUpsellBlock|ProUpgradeButton|UseSampleCta/);
  });

  it("route Upgrade / Practice CTAs are never nested inside a parent Form", () => {
    const routesDir = join(appRoot, "routes");
    const files = readdirSync(routesDir).filter((name) => name.endsWith(".tsx"));
    for (const name of files) {
      const src = readApp(`routes/${name}`);
      if (!/ProUpsellBlock|ProUpgradeButton/.test(src)) continue;
      const depths = formDepthAtMatches(src, /ProUpsellBlock|ProUpgradeButton/g);
      expect(depths.length, name).toBeGreaterThan(0);
      for (const depth of depths) {
        expect(depth, `${name} nested Upgrade CTA`).toBe(0);
      }
    }
  });

  it("ProUpgradeButton uses a type=button user-gesture exit, not an in-iframe Admin href", () => {
    const src = readApp("components/ProUpgradeButton.tsx");
    expect(src).toContain('type="button"');
    expect(src).toContain("navigateToBillingConfirmation");
    expect(src).toContain('openPlansNow(plansUrl)');
    expect(src).not.toMatch(/admin\.shopify\.com/);
    expect(src).toContain('data-mcfly-billing-user-gesture="1"');
  });

  it("reviewer SAMPLE SPEND CSV in the testing paste still parses", () => {
    const paste = testingPaste();
    const marker = "SAMPLE SPEND CSV";
    const markerAt = paste.indexOf(marker);
    expect(markerAt).toBeGreaterThan(-1);
    const afterMarker = paste.slice(markerAt);
    const headerAt = afterMarker.search(/^date,channel,amount$/m);
    expect(headerAt).toBeGreaterThan(-1);
    const csvChunk = afterMarker.slice(headerAt);
    const lines = csvChunk
      .split(/\r?\n/)
      .filter((line) => line.length > 0)
      .slice(0, 5);
    const csv = lines.join("\n");
    const { rows, errors } = parseSpendCsv(csv);
    expect(errors).toEqual([]);
    expect(rows).toHaveLength(4);
    expect(rows.map((row) => row.channel).sort()).toEqual([
      "google",
      "google",
      "meta",
      "meta",
    ]);
    expect(rows.reduce((sum, row) => sum + row.amount, 0)).toBe(380);
  });
});
