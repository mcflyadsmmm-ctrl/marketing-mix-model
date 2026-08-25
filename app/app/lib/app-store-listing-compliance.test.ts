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
});
