import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const root = join(dirname(fileURLToPath(import.meta.url)), "../../..");
const product = readFileSync(join(root, "site/product.html"), "utf8");

function section(id: string): string {
  const start = product.indexOf(`id="${id}"`);
  expect(start, `missing #${id}`).toBeGreaterThan(-1);
  const from = product.lastIndexOf("<section", start);
  const end = product.indexOf("</section>", start);
  expect(from).toBeGreaterThan(-1);
  expect(end).toBeGreaterThan(from);
  return product.slice(from, end);
}

describe("/product shows the SAMPLE share artifacts", () => {
  it("paints a Monday board of three named SAMPLE year windows", () => {
    const board = section("monday-board");
    const ritual = product.indexOf("<h3>Overview</h3>");
    const boardAt = product.indexOf('id="monday-board"');
    const spendAt = product.indexOf("Add spend later.");
    expect(ritual).toBeGreaterThan(-1);
    expect(boardAt).toBeGreaterThan(ritual);
    expect(spendAt).toBeGreaterThan(boardAt);

    expect(board).toContain("SAMPLE · Snowdevil");
    expect(board).toContain("This month");
    expect(board).toContain("$68,457");
    expect(board).toContain("$69,891");
    expect(board).toContain("This quarter");
    expect(board).toContain("$210,622");
    expect(board).toContain("$210,817");
    expect(board).toContain("This year");
    expect(board).toContain("$918,649");
    expect(board).toContain("$918,365");
    expect(board).toMatch(
      /Print this board in the app \(Save PNG\) or copy the dollars/i,
    );
    expect(board).toContain("SAMPLE Snowdevil");
    expect(board).toContain("not a live client");
    expect(board).toContain(
      "Save PNG in the app — screenshot-ready, same formula.",
    );
    expect(board).not.toMatch(/\bSKU\b/);
    expect(board).not.toMatch(/country|location/i);
    expect(board).not.toMatch(/BE\s*@\s*40%/i);
    expect(board).not.toMatch(/2\.50×\s*@\s*40%/);
  });

  it("shows a mailto/pre Overview body Mcfly never sends", () => {
    const mail = section("mailto-specimen");
    const preStart = mail.indexOf("<pre");
    const preEnd = mail.indexOf("</pre>");
    expect(preStart).toBeGreaterThan(-1);
    expect(preEnd).toBeGreaterThan(preStart);
    const body = mail.slice(preStart, preEnd);

    expect(body).toContain("$68,457");
    expect(body).toContain("$69,891");
    expect(body).toContain("$631");
    expect(body).toContain("66%");
    expect(body).toContain("$45,409");
    expect(body).toContain("23%");
    expect(body).toContain("3.60×");
    expect(body).toContain("$19,023");
    expect(body).toContain("$68,457 ÷ $19,023");
    expect(mail).toContain("Mcfly never sends mail — your mail app does.");
    expect(mail).toContain("mailto:");
    expect(mail).toContain("Shopify%20sales");
    expect(mail).toContain("%2468%2C457");
    expect(mail).not.toMatch(/Shopify Flow/i);
    expect(mail).not.toMatch(/Slack bot/i);
    expect(mail).not.toMatch(/scheduled PDF/i);
    expect(mail).not.toMatch(/Zapier/i);
    expect(mail).not.toMatch(/\bSKU\b/);
    expect(mail).not.toMatch(/\bsessions?\b/i);
  });

  it("keeps parked SAMPLE honesty and refuses leftover share theater", () => {
    expect(product).toContain("Public demo is SAMPLE Snowdevil");
    expect(product).toContain('href="/demo"');
    expect(product).toContain("Your shop is not on this page");
    expect(product).not.toMatch(/when unparked/);
    expect(product).not.toMatch(/install opens this shop.s Live book/i);
    expect(product).not.toMatch(/Shopify Flow/i);
    expect(product).not.toMatch(/Slack bot/i);
    expect(product).not.toMatch(/scheduled PDF/i);
    expect(product).not.toMatch(/\$98,?500/);
    expect(product).not.toMatch(/Harbor/i);
    expect(product).not.toMatch(/Northline/i);
    expect(product).not.toMatch(/full-access/i);
    expect(product).not.toMatch(/<th[^>]*>\s*SKU/i);
    expect(product).not.toMatch(/\bSKU\b/);
    const pillsStart = product.indexOf('aria-label="Tabs the Shopify app ships"');
    const pillsEnd = product.indexOf("</ol>", pillsStart);
    const pills = product.slice(pillsStart, pillsEnd);
    expect(pills).toContain("Overview");
    expect(pills).toContain("Orders");
    expect(pills).toContain("Customers");
    expect(pills).toContain("Spend");
    expect(pills).toContain("Goals");
    expect([...pills.matchAll(/<li>/g)]).toHaveLength(5);
  });
});
