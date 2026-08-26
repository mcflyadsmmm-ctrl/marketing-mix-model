/**
 * Merchant-facing App Store listing paste must stay inside 4.2 / 4.3:
 * prices only in Partner Pricing details; no “the first/best/only”; no testimonials.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "../../..");

function readRepo(rel: string): string {
  return readFileSync(join(repoRoot, rel), "utf8");
}

function pasteBlock(src: string, name: string): string {
  const start = `<!-- APP_STORE_PASTE:${name} -->`;
  const end = `<!-- /APP_STORE_PASTE:${name} -->`;
  const a = src.indexOf(start);
  const b = src.indexOf(end);
  expect(a).toBeGreaterThan(-1);
  expect(b).toBeGreaterThan(a);
  return src.slice(a + start.length, b);
}

describe("App Store listing paste (4.2.2 / 4.2.3 / 4.3.3 / 4.3.7)", () => {
  const listing = readRepo("docs/APP_STORE_LISTING.md");
  const short = pasteBlock(listing, "short");
  const long = pasteBlock(listing, "long");
  const features = pasteBlock(listing, "features");
  const captions = readRepo("docs/listing-assets/shots/CAPTIONS.md");
  const visual = readRepo("docs/LISTING_VISUAL_PACK.md");

  it("merchant paste blocks exist and stay free of plan prices", () => {
    for (const block of [short, long, features]) {
      expect(block).not.toMatch(/\$\d+/);
      expect(block).not.toMatch(/\/store\/mo/i);
      expect(block).not.toMatch(/\$39/);
      expect(block).not.toMatch(/Free\./);
    }
  });

  it("repositioned paste leads with all-platform spend including billboards", () => {
    expect(short).toMatch(/billboard/i);
    expect(features).toMatch(/billboard/i);
    expect(long).toMatch(/billboard/i);
    expect(long).not.toMatch(/paid plan unlocks every named/i);
    expect(long).toMatch(/not platform ROAS/i);
    expect(long).toMatch(/not net profit/i);
    expect(features).toMatch(/spend you added/i);
    expect(features).toMatch(/not platform ROAS/i);
  });

  it("merchant paste blocks avoid superlatives and quantified outcome claims (4.3.3)", () => {
    for (const block of [short, long, features]) {
      expect(block).not.toMatch(/\bthe (first|best|only)\b/i);
      expect(block).not.toMatch(/\bguarantee/i);
      expect(block).not.toMatch(
        /\b\d+(?:\.\d+)?\s*(?:%|x|×)\s+(?:more|less|higher|lower|increase|lift|improvement|faster|growth)\b/i,
      );
      expect(block).not.toMatch(
        /\b(?:increase|boost|improve|grow|save)[^.!?\n]{0,80}\b\d+(?:\.\d+)?\s*(?:%|x|×)\b/i,
      );
      expect(block).not.toMatch(
        /\b\d+(?:,\d{3})*(?:\+)?\s+(?:merchants?|stores?|users?|reviews?)\b/i,
      );
    }
  });

  it("merchant paste blocks do not include testimonials (4.3.7)", () => {
    for (const block of [short, long, features]) {
      expect(block).not.toMatch(/\btestimonial/i);
      expect(block).not.toMatch(/\breview(s|er)? said\b/i);
      expect(block).not.toMatch(/\bstars?\b/i);
    }
  });

  it("screenshot captions do not include plan prices or “the only”", () => {
    const uploadTable = captions.split("## Do **not** upload")[0] ?? captions;
    expect(uploadTable).not.toMatch(/\$\d+/);
    expect(captions + visual).not.toMatch(/the only formula/i);
  });

  it("founder pack forbids uploading the generated pricing PNG (4.2.2)", () => {
    expect(captions).toMatch(/04-free-pro-pricing\.png/);
    expect(captions).toMatch(/Do \*\*not\*\* upload/i);
    expect(captions).toMatch(/4\.2\.2/);
    const shotScript = readRepo("scripts/listing-shot-04.py");
    expect(shotScript).toMatch(/4\.2\.2/);
    expect(shotScript).toMatch(/Refusing to generate a pricing screenshot/);
  });

  it("listing checklist tells Partner not to require Online Store (4.3.1)", () => {
    expect(listing).toMatch(/do \*\*not\*\* check .*online store/i);
    expect(listing).toMatch(/4\.3\.1/);
  });

  it("merchant long paste and Partner URL table send reviewers to Fly, not waitlist Pages", () => {
    const long = pasteBlock(listing, "long");
    expect(long).toContain("https://mcfly-analytics.fly.dev/privacy");
    expect(long).toContain("https://mcfly-analytics.fly.dev/support");
    expect(long).not.toMatch(/https:\/\/mcflyads\.com\/(privacy|support|terms)/);
    expect(listing).toMatch(
      /\|\s*Website\s*\|\s*https:\/\/mcfly-analytics\.fly\.dev\s*\|/,
    );
    expect(listing).toContain("https://mcfly-analytics.fly.dev/privacy");
    expect(listing).toContain("https://mcfly-analytics.fly.dev/support");
    expect(listing).toContain("https://mcfly-analytics.fly.dev/terms");
  });

  it("LISTING_19 paste sheet does not send reviewers to waitlist Pages or old packaging", () => {
    const sheet = readRepo("docs/LISTING_19_ISSUES_PASTE.md");
    expect(sheet).not.toMatch(/https:\/\/mcflyads\.com\/(privacy|support|terms)/);
    expect(sheet).not.toMatch(/paid plan unlocks named channels/i);
    expect(sheet).not.toMatch(/Advanced Marketing Data Science/i);
    expect(sheet).toContain("https://mcfly-analytics.fly.dev/support");
    expect(sheet).toContain("https://mcfly-analytics.fly.dev/privacy");
  });

  it("founder one-pager sells one plan and points testing paste at PARTNER_TESTING", () => {
    const handoff = readRepo("docs/ops/SUBMIT_HANDOFF.md");
    expect(handoff).not.toMatch(/no Billing charges yet/i);
    expect(handoff).toMatch(/PARTNER_TESTING_INSTRUCTIONS/);
    expect(handoff).toMatch(/one plan/i);
    expect(handoff).toMatch(/\$39/);
    expect(handoff).toMatch(/7-day free trial/i);
    expect(handoff).not.toMatch(/Free \+ Pro/);
    expect(handoff).toContain("04-free-pro-pricing.png");
    expect(handoff).toMatch(/Do not upload/i);
  });

  /*
   * The Partner Dashboard still advertised Free + Pro $39 in the 2026-08-26
   * Admin smoke. Managed Pricing plans are not in this repo, so the only thing
   * git controls is the instruction that produced them. Keep it correct.
   */
  it("billing docs tell the human to configure exactly one paid plan", () => {
    const tiers = readRepo("docs/BILLING_TIERS.md");
    expect(tiers).toMatch(/one paid plan|ONE plan|one plan/i);
    expect(tiers).toMatch(/7-day/);
    expect(tiers).toMatch(/\$39/);
    expect(tiers).toMatch(/remove the Free plan/i);
    expect(tiers).toMatch(/nothing is \*\*feature-gated\*\*|nothing is feature-gated/i);
    // No plan matrix may come back — a matrix implies a gate.
    expect(tiers).not.toMatch(/\| Spend channels \|/);
    expect(tiers).not.toMatch(/Teaser/i);
  });

  it("no submission doc still instructs a Free + Pro Partner setup", () => {
    for (const rel of [
      "docs/APP_STORE_LISTING.md",
      "docs/PARTNER_TESTING_INSTRUCTIONS.md",
      "docs/APP_STORE_REQUIREMENT_MATRIX.md",
      "docs/ops/SUBMIT_HANDOFF.md",
      "docs/ops/REVIEWER_TEST_SCRIPT.md",
      "docs/ops/FOUNDER_DO_NOW.md",
    ]) {
      const doc = readRepo(rel);
      // "delete the Free plan" is the fix, not a claim — allow only that shape.
      const claims = doc
        .split("\n")
        .filter(
          (line) =>
            /Free \+ Pro/.test(line) &&
            !/delete|remove|still showed|open item/i.test(line),
        );
      expect(claims, rel).toEqual([]);
      expect(doc, rel).not.toMatch(/Upgrade to Pro/i);
    }
  });

  it("Partner listing URLs and Fly-landing nav pages match live Free vs Pro packaging (1.1.4)", () => {
    const pages = [
      "site/index.html",
      "site/privacy.html",
      "site/support.html",
      "site/terms.html",
      "site/pricing.html",
      "site/app.html",
      // /demo is a Remix route now, so its data route matches the page.
      "app/app/routes/demo.tsx",
      "site/product.html",
    ];
    for (const rel of pages) {
      const src = readRepo(rel);
      expect(src, rel).not.toMatch(/until Billing/i);
      expect(src, rel).not.toMatch(/when Billing is announced/i);
      expect(src, rel).not.toMatch(/Free = Meta \+ Google \+ Other/);
      expect(src, rel).not.toMatch(/Free \(Meta \+ Google \+ Other\)/);
      expect(src, rel).not.toMatch(/Free install is Meta \+ Google only/i);
      expect(src, rel).not.toMatch(/\$39 unlocks the rest/i);
      expect(src, rel).not.toMatch(/LTV \+ all named channels/);
      expect(src, rel).not.toMatch(/LTV\+all channels/i);
      expect(src, rel).not.toMatch(/Meta\+Google\+Other/);
      expect(src, rel).not.toMatch(/Meta \+ Google \+ Other day one/i);
      expect(src, rel).not.toMatch(/Pro named channels/i);
    }
  });
});
