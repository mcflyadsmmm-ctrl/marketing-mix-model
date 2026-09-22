/**
 * Pricing first fold greets with Shopify numbers, not spend.
 * Does not weaken site-go-live 90 vs 24 / no full-access / $39 / 7-day locks.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "../../..");
const pricing = readFileSync(join(repoRoot, "site/pricing.html"), "utf8");

function floatDeskHtml(src: string): string {
  const start = src.indexOf('aria-label="Snowdevil SAMPLE metrics"');
  expect(start).toBeGreaterThan(0);
  const end = src.indexOf("</aside>", start);
  expect(end).toBeGreaterThan(start);
  return src.slice(start, end);
}

describe("pricing.html sales-first first fold", () => {
  it("does not greet with the spend-first leftover rhythm", () => {
    expect(pricing).not.toContain("Upload spend → see Total ROAS");
    expect(pricing).not.toMatch(/Upload spend\s*(→|->)\s*see Total ROAS/);
    expect(pricing).not.toMatch(/full-access/i);
    expect(pricing).not.toMatch(/Trial includes 24 months/);
  });

  it("still matches site-go-live honesty: 90 vs 24, $39, 7-day, every platform", () => {
    expect(pricing).toMatch(/Trial is 90 days of order history/);
    expect(pricing).toMatch(/Paid is up to 24 months|paid is up to 24 months/);
    expect(pricing).toMatch(/\$39/);
    expect(pricing).toMatch(/7-day/);
    expect(pricing).toMatch(/every platform/);
    expect(pricing).not.toMatch(/full-access/i);
    expect(pricing).not.toMatch(/Trial includes 24 months/);
  });

  it("keeps the price-forward H1 and names what $39 buys at $0 spend", () => {
    expect(pricing).toContain(
      "<h1>7-day free trial. Then $39/month. Full desk.</h1>",
    );
    expect(pricing).toMatch(/Overview/);
    expect(pricing).toMatch(/Orders/);
    expect(pricing).toMatch(/Customers/);
    expect(pricing).toMatch(/Growth and LTV live on Customers/);
    expect(pricing).toMatch(/beat native Analytics/);
    expect(pricing).toMatch(/second chapter|Spend is the second chapter/);
  });

  it("SAMPLE float cards are sales-first Snowdevil — not Harbor/Northline", () => {
    const desk = floatDeskHtml(pricing);
    const salesIdx = desk.indexOf("Shopify sales");
    const spendIdx = desk.indexOf("Entered spend");
    const roasIdx = desk.indexOf("Total ROAS");
    expect(salesIdx).toBeGreaterThan(-1);
    expect(spendIdx).toBeGreaterThan(salesIdx);
    expect(roasIdx).toBeGreaterThan(spendIdx);

    expect(pricing).toContain("$19,023");
    expect(pricing).toContain("$68,457");
    expect(pricing).toMatch(/3\.60×/);
    expect(pricing).toContain("BE 2.50× @ 40%");
    expect(pricing).toContain("SAMPLE · Snowdevil · not a live client");
    expect(pricing).toContain("Total ROAS = Shopify sales ÷ entered spend");

    expect(pricing).not.toContain("Harbor Home Co");
    expect(pricing).not.toContain("Northline");
    expect(pricing).not.toMatch(/\$98,?500/);
    expect(pricing).not.toMatch(/4\.19×/);
  });
});
