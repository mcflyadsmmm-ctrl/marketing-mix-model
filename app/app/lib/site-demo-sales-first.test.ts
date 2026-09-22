import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const root = join(dirname(fileURLToPath(import.meta.url)), "../../..");

function readSite(rel: string) {
  return readFileSync(join(root, rel), "utf8");
}

function heroBlock(html: string): string {
  const match = html.match(/<header class="page-hero[\s\S]*?<\/header>/);
  expect(match?.[0], "page-hero header").toBeTruthy();
  return match![0];
}

function firstHeroParagraph(html: string): string {
  const firstP = heroBlock(html).match(/<p\b[^>]*>([\s\S]*?)<\/p>/);
  expect(firstP?.[1], "first hero <p>").toBeTruthy();
  return firstP![1];
}

describe("public /demo greets with Shopify numbers first", () => {
  const html = readSite("site/demo.html");

  it("lede names Overview · Orders · Customers before Spend, five tabs, spend optional, SAMPLE not live", () => {
    const lede = firstHeroParagraph(html);

    expect(lede).toMatch(/typical order/i);
    expect(lede).toMatch(/returning/i);
    expect(lede).toMatch(/five analysis tabs|five tabs/i);
    expect(lede).toMatch(/spend is optional|spend optional/i);
    expect(lede).toMatch(/SAMPLE/i);
    expect(lede).toMatch(/not a live client/i);

    const overview = lede.indexOf("Overview");
    const orders = lede.indexOf("Orders");
    const customers = lede.indexOf("Customers");
    const spend = lede.indexOf("Spend");
    expect(overview).toBeGreaterThan(-1);
    expect(orders).toBeGreaterThan(overview);
    expect(customers).toBeGreaterThan(orders);
    expect(spend).toBeGreaterThan(customers);

    expect(lede).not.toContain("$19,023");
    expect(lede).not.toContain("2.50");
  });

  it("keeps locked SAMPLE dollars and the quiet empty formula off the greeting", () => {
    expect(html).toContain("<h1>Full Snowdevil SAMPLE demo.</h1>");
    expect(html).toContain("$68,457");
    expect(html).toContain("$19,023");
    expect(html).toContain("3.60");
    expect(html).toMatch(/2\.50×/);
    expect(html).toContain("empty = —");
    expect(html).toMatch(/Live book only|Live-only/);
    expect(html).toContain("no Sample|Live toggle");
    expect(html).toContain("Install");
    expect(html).toContain("Open the full Snowdevil desk");
    expect(html).toContain("Pricing");
    expect(html).not.toContain("Harbor Home Co");
    expect(html).not.toContain("Northline Supply");
    expect(html).not.toMatch(/\$98,?500/);
    expect(html).not.toMatch(/4\.19×/);
  });

  it("meta description is sales-first while still allowed to name SAMPLE spend dollars", () => {
    const desc =
      html.match(/<meta name="description" content="([^"]+)"/)?.[1] ?? "";
    expect(desc).toMatch(/typical order/i);
    expect(desc).toMatch(/five analysis tabs|five tabs/i);
    expect(desc).toMatch(/SAMPLE/i);
    expect(desc).toMatch(/not a live client/i);
    const typical = desc.toLowerCase().indexOf("typical");
    expect(typical).toBeGreaterThan(-1);
    const spendNum = desc.indexOf("$19,023");
    if (spendNum >= 0) {
      expect(typical).toBeLessThan(spendNum);
    }
  });
});
