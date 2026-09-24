/**
 * Live marketing site must match the live Shopify app (1.1.4).
 * Pause-email reviewers open mcflyads.com/support, /privacy, /terms, /pricing.
 */
import { readdirSync, readFileSync, type Dirent } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "../../..");
const siteRoot = join(repoRoot, "site");

function walkFiles(
  directory: string,
  include: (path: string, entry: Dirent) => boolean,
): string[] {
  let entries: Dirent[];
  try {
    entries = readdirSync(directory, { withFileTypes: true });
  } catch {
    return [];
  }
  return entries.flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return walkFiles(path, include);
    return include(path, entry) ? [path] : [];
  });
}

const sitePages = walkFiles(
  siteRoot,
  (path, entry) =>
    entry.isFile() && /\.(?:html|txt)$/.test(path),
);

const launchLies: Array<{ name: string; pattern: RegExp }> = [
  { name: "until Billing", pattern: /until Billing/i },
  { name: "when Billing is announced", pattern: /when Billing is announced/i },
  { name: "Pro $39 when Billing", pattern: /Pro \$39 when Billing/i },
  { name: "listing is in review", pattern: /listing is in review/i },
  { name: "listing is pending", pattern: /listing is pending/i },
  { name: "until listing is live", pattern: /until listing is live/i },
  { name: "listing pending", pattern: /listing pending/i },
  { name: "notify at launch", pattern: /notify at launch/i },
  {
    name: "leave email until install",
    pattern: /we.?ll tell you when you can install/i,
  },
  { name: "Free = Meta + Google", pattern: /Free = Meta \+ Google/ },
  {
    name: "Free (Meta + Google + Other)",
    pattern: /Free \(Meta \+ Google \+ Other\)/,
  },
  {
    name: "Free Meta + Google + Other",
    pattern: /Free Meta \+ Google \+ Other/,
  },
  {
    name: "Free install is Meta + Google only",
    pattern: /Free install is Meta \+ Google only/i,
  },
  { name: "$39 unlocks the rest", pattern: /\$39 unlocks the rest/i },
  {
    name: "LTV+all channels",
    pattern: /LTV\+all channels/i,
  },
  { name: "LTV + all named channels", pattern: /LTV \+ all named channels/ },
  { name: "Meta+Google+Other", pattern: /Meta\+Google\+Other/ },
  { name: "Pro named channels", pattern: /Pro named channels/i },
  { name: "Free Mcfly path", pattern: /Free Mcfly path/i },
  { name: "Pro is Customer LTV", pattern: /Pro is Customer LTV/i },
  { name: "Flat Pro fee", pattern: /Flat Pro fee/i },
  { name: "Flat $39 Pro", pattern: /Flat \$39\/store\/mo Pro/i },
  {
    name: "Meta + Google + Other day one",
    pattern: /Meta \+ Google \+ Other day one/i,
  },
  { name: "Pro adds named channels", pattern: /Pro adds named channels/ },
  { name: "App Store Free when listed", pattern: /App Store Free when listed/i },
  {
    name: "Listing Pricing stays Free until",
    pattern: /Listing Pricing stays Free until/i,
  },
  { name: "while we launch", pattern: /while we launch/i },
  { name: "$79/store app SKU", pattern: /\$79\/store/i },
  {
    name: "History back to January 2021 as a sales promise",
    pattern: /History back to January 2021/i,
  },
  { name: "full-access trial", pattern: /full-access/i },
  { name: "full access trial", pattern: /full access/i },
  {
    name: "trial includes 24 months",
    pattern: /trial includes 24 months/i,
  },
  {
    name: "24 months as trial order history",
    pattern: /24 months<\/strong>\s*<span>Order history on trial/i,
  },
];

describe("mcflyads.com go-live copy (1.1.4)", () => {
  it("scans every html/txt page for waitlist / billing-later / Meta-only Free lies", () => {
    expect(sitePages.length).toBeGreaterThan(20);
    for (const path of sitePages) {
      const rel = relative(repoRoot, path).replaceAll("\\", "/");
      const src = readFileSync(path, "utf8");
      for (const lie of launchLies) {
        expect(src, `${rel} still says “${lie.name}”`).not.toMatch(lie.pattern);
      }
    }
  });

  it("Partner listing URLs still exist and talk like the app is live", () => {
    const support = readFileSync(join(siteRoot, "support.html"), "utf8");
    const pricing = readFileSync(join(siteRoot, "pricing.html"), "utf8");
    const privacy = readFileSync(join(siteRoot, "privacy.html"), "utf8");
    expect(support).toMatch(/Try the demo|full Snowdevil demo/i);
    expect(support).toMatch(/every platform/i);
    expect(support).toMatch(/\$39/);
    expect(support).toMatch(/no.{0,40}shop-domain form/i);
    expect(pricing).toMatch(/every platform/i);
    expect(pricing).toMatch(/\$39/);
    expect(pricing).toMatch(/7-day/);
    const history =
      /Trial and paid share the full desk and up to 24 months of orders/;
    const cancel =
      /Uninstall stops the next cycle\. A period already paid may run to its end/;
    expect(pricing).toMatch(history);
    expect(pricing).toMatch(cancel);
    expect(pricing).toMatch(/Not a GMV tax/);
    expect(pricing).toMatch(/https:\/\/mcfly-analytics\.fly\.dev/);
    expect(pricing).toMatch(/Shopify does not host/);
    expect(pricing).not.toMatch(/90 days of order history/);
    expect(pricing).not.toMatch(/uninstall stops the charge/i);
    expect(pricing).not.toMatch(/full-access/i);
    expect(pricing).not.toMatch(/Trial includes 24 months/);
    expect(pricing).not.toMatch(/\$79/);
    expect(support).toMatch(history);
    expect(support).toMatch(cancel);
    expect(support).toMatch(/No ads\. No pixels, path credit, or multi-touch attribution/);
    expect(privacy).toMatch(history);
    expect(privacy).toMatch(cancel);
    expect(privacy).toMatch(/Shopify does not host the app/);
    expect(privacy).toMatch(/numberOfOrders/);
    expect(privacy).toMatch(/read_customers/);
  });

  it("trial and paid share 24 months of orders — never a 90-day trial book", () => {
    const pricing = readFileSync(join(siteRoot, "pricing.html"), "utf8");
    const support = readFileSync(join(siteRoot, "support.html"), "utf8");
    const privacy = readFileSync(join(siteRoot, "privacy.html"), "utf8");
    const history =
      /Trial and paid share the full desk and up to 24 months of orders/;
    expect(pricing).toMatch(history);
    expect(support).toMatch(history);
    expect(privacy).toMatch(history);
    expect(pricing).not.toMatch(/Trial includes 90 days/);
    expect(pricing).not.toMatch(/Trial includes 24 months/);
  });
});
