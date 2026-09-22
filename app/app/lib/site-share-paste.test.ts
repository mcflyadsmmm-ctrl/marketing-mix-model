import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const root = join(dirname(fileURLToPath(import.meta.url)), "../../..");

function readSite(rel: string) {
  return readFileSync(join(root, rel), "utf8");
}

describe("home SAMPLE share paste board", () => {
  const html = readSite("site/index.html");
  const pasteStart = html.indexOf('id="paste-slack"');
  const pasteEnd = html.indexOf('aria-labelledby="row-roas"');
  const paste = pasteStart >= 0 && pasteEnd > pasteStart
    ? html.slice(pasteStart, pasteEnd)
    : "";
  const overviewIdx = html.indexOf('data-dd-section="overview"');
  const overviewSlice =
    overviewIdx >= 0 ? html.slice(overviewIdx, overviewIdx + 1800) : "";

  it("keeps the locked H1, v37, and Snowdevil SAMPLE dollars", () => {
    expect(html).toContain(
      '<h1 class="h1 h1--line" id="hero-h">Deeper Shopify numbers Analytics does not show.</h1>',
    );
    expect(html).toContain('content="v37"');
    expect(html).toContain("mcfly.css?v=20260922v37");
    expect(html).toContain("$68,457");
    expect(html).toContain("$19,023");
    expect(html).toContain("3.60");
    expect(html).toContain("/demo?tab=spend");
    expect(html).toContain("/demo?tab=goals");
    expect(html).not.toContain("/demo?tab=yoy");
    expect(html).not.toContain("/demo?tab=roas");
  });

  it("paints one paste-ready SAMPLE briefing with a Copy control", () => {
    expect(pasteStart).toBeGreaterThan(0);
    expect(paste).toContain("Copy this for Slack, WhatsApp, or email.");
    expect(paste).toContain("SAMPLE Snowdevil · not a live client");
    expect(paste).toContain("Mcfly never posts to Slack — you copy.");
    expect(paste).toContain("Not a Slack bot");

    expect(paste).toContain("$68,457 vs last year $69,891");
    expect(paste).toContain("-$1,434");
    expect(paste).toContain("-2%");

    expect(paste).toContain("Typical order is $631");
    expect(paste).toContain("the middle order, not Shopify");

    expect(paste).toContain("Returning buyers carry 66%");
    expect(paste).toContain("$45,409");
    expect(paste).toContain("not headcount");

    const brief = html.slice(
      html.indexOf('id="paste-brief"'),
      html.indexOf("</pre>", html.indexOf('id="paste-brief"')),
    );
    expect(brief).not.toContain("Weekend mix");
    expect(brief).not.toContain("$890");
    expect(brief).not.toContain("21 days");
    expect(paste).not.toMatch(/Saturday\s*\$/);

    const copyButtons = paste.match(/>Copy<\/button>/g) ?? [];
    expect(copyButtons).toHaveLength(1);
    expect(paste).toContain('id="paste-brief"');
    expect(paste).toContain("data-copy-target");
    expect(html).toContain("navigator.clipboard.writeText");
    expect(paste).not.toMatch(/<textarea/i);
  });

  it("drops the Spend leftover, names the $39 GMV line, and stays Harbor-clean", () => {
    expect(html).not.toContain(
      "Upload spend, see Total ROAS, then hit Goals.",
    );
    expect(html).toContain("$39 stays $39");
    expect(html).toMatch(/Not a (Polar-class )?GMV tax/);
    expect(html).not.toContain("Harbor Home Co");
    expect(html).not.toContain("Northline Supply");
    expect(html).not.toMatch(/\$98,?500/);
    expect(html).not.toContain("/demo?tab=slack");
    expect(html).not.toContain("/demo?tab=paste");
    expect(overviewSlice).not.toMatch(/Total ROAS|Ad spend/i);
  });

  it("names native Reports, Repeat Customer Insights from $59, and the spend-first listing leftover", () => {
    const sitsStart = html.indexOf('id="where-sits"');
    expect(sitsStart).toBeGreaterThan(0);
    const sits = html.slice(sitsStart, sitsStart + 4200);
    expect(sits).toContain("Repeat Customer Insights from $59");
    expect(sits).toContain("apps.shopify.com/repeat-customer-insights");
    expect(sits).toContain("Better Reports from $19.90");
    expect(sits).toContain("Group by day of week");
    expect(sits).toContain("Polar’s App Store list price starts at $750/mo");
    expect(sits).toContain("We do not invent Polar $1,020");
    expect(sits).toContain("The live App Store card still leads with ad spend next to store sales");
    expect(sits).toContain("TrueProfit from $35/mo");
    expect(sits).toContain("ShopifyQL can show returning sales $");
    expect(sits).toContain("apps.shopify.com/trueprofit");
    expect(html).not.toContain("Shopify itself is all-or-nothing Admin");
    expect(html).not.toContain("Deeper than Shopify Analytics Overview.");
    expect(html).toContain("Basic Shopify has no staff seat");
    expect(html).toContain("Not a Slack bot");
  });

  it("wraps the paste board instead of a nowrap six-column table", () => {
    expect(paste).toContain("overflow-safe");
    expect(paste).not.toMatch(/white-space:\s*nowrap/i);
    expect(paste).not.toMatch(/repeat\(\s*6/);
    expect(paste).not.toMatch(/<table/i);
    expect(paste).not.toContain("grid-template-columns: repeat(6");
  });
});
