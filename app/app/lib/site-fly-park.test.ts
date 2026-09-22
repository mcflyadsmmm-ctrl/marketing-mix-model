import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { isShopifyAppPath } from "../../scripts/shopify-app-path.mjs";
import {
  matchSiteRedirect,
  parseSiteRedirects,
} from "../../scripts/site-marketing-redirects.mjs";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "../../..");

function readRepo(rel: string): string {
  return readFileSync(join(repoRoot, rel), "utf8");
}

describe("Fly honors Pages parked-lander redirects", () => {
  const redirects = readRepo("site/_redirects");
  const rules = parseSiteRedirects(redirects);

  it("parks Custom and Northline lab on Fly the way Pages already 301s", () => {
    expect(matchSiteRedirect("/lab", rules)).toMatchObject({
      to: "/",
      code: 301,
    });
    expect(matchSiteRedirect("/lab/", rules)).toMatchObject({ to: "/" });
    expect(matchSiteRedirect("/custom-analytics", rules)).toMatchObject({
      to: "/",
      code: 301,
    });
    expect(matchSiteRedirect("/custom-analytics-engagement", rules)).toMatchObject(
      { to: "/" },
    );
    expect(matchSiteRedirect("/triple-whale-alternative", rules)).toMatchObject({
      to: "/",
    });
    expect(matchSiteRedirect("/lab.html", rules)).toMatchObject({
      to: "/",
      code: 301,
    });
    expect(matchSiteRedirect("/custom-analytics.html", rules)).toMatchObject({
      to: "/",
      code: 301,
    });
    expect(matchSiteRedirect("/custom-analytics-engagement.html", rules)).toMatchObject(
      { to: "/", code: 301 },
    );
    expect(matchSiteRedirect("/lead-gen-desk.html", rules)).toMatchObject({
      to: "/",
      code: 301,
    });
    expect(matchSiteRedirect("/cash-mer.html", rules)).toMatchObject({
      to: "/",
      code: 301,
    });
    expect(matchSiteRedirect("/monday-close.html", rules)).toMatchObject({
      to: "/",
      code: 301,
    });
    expect(matchSiteRedirect("/why-pixels-fail.html", rules)).toMatchObject({
      to: "/",
      code: 301,
    });
    expect(matchSiteRedirect("/mds-made-easy/index.html", rules)).toMatchObject({
      to: "/",
      code: 301,
    });
  });

  it("never maps /app or /demo through marketing redirects", () => {
    expect(isShopifyAppPath("/app")).toBe(true);
    expect(isShopifyAppPath("/demo/spend")).toBe(true);
    expect(matchSiteRedirect("/app", rules)).toBeNull();
    expect(matchSiteRedirect("/app/", rules)).toBeNull();
    expect(matchSiteRedirect("/demo", rules)).toBeNull();
    expect(matchSiteRedirect("/demo/spend", rules)).toBeNull();
    expect(rules.some((rule) => isShopifyAppPath(rule.from))).toBe(false);
  });

  it("leaves live listing trust pages on the static site", () => {
    for (const path of [
      "/",
      "/pricing",
      "/product",
      "/privacy",
      "/support",
      "/terms",
      "/faq",
      "/about",
    ]) {
      expect(matchSiteRedirect(path, rules), path).toBeNull();
      expect(matchSiteRedirect(`${path}.html`, rules), `${path}.html`).toBeNull();
    }
  });

  it("production server applies _redirects before express.static", () => {
    const serve = readRepo("app/scripts/serve-with-site.mjs");
    expect(serve).toContain("parseSiteRedirects");
    expect(serve).toContain("matchSiteRedirect");
    expect(serve).toContain("_redirects");
    expect(serve).toMatch(/res\.redirect\(parked\.code, parked\.to\)/);
  });
});
