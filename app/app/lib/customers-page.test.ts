import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const here = dirname(fileURLToPath(import.meta.url));

function read(rel: string): string {
  return readFileSync(join(here, rel), "utf8");
}

const customers = read("../routes/app.customers.tsx");
const scoreboard = read("../components/CustomersScoreboard.tsx");
const concentration = read("../components/CustomerConcentrationChart.tsx");
const lib = read("./customers-scoreboard.ts");

/**
 * Authority: docs/ops/CRAFT_UNLOCK.md — Customers is Black Clover-grade on the
 * returning-dollars niche. Update this file toward density, never a pamphlet.
 * The book-visible lock (shopify-book-visible.test.ts) still owns the buyers
 * catalog; this file owns the scoreboard + concentration craft on top of it.
 */

describe("Customers page — returning-dollars scoreboard", () => {
  it("contrasts Shopify Analytics returning rate with returning dollars", () => {
    expect(customers).toContain("Shopify Analytics");
    expect(customers).toMatch(/dollars/i);
    expect(customers).toMatch(/returning/i);
  });

  it("leads with the scoreboard, then concentration, then the buyers book", () => {
    const scoreAt = customers.indexOf("<CustomersScoreboard");
    const concAt = customers.indexOf("<CustomerConcentrationChart");
    const bookAt = customers.indexOf("<ShopifyBookSection");
    expect(scoreAt).toBeGreaterThan(-1);
    expect(concAt).toBeGreaterThan(scoreAt);
    expect(bookAt).toBeGreaterThan(concAt);
  });

  it("keeps the buyers book, honest empty, pending, and error copy", () => {
    expect(customers).toContain('groups={["buyers"]}');
    expect(customers).toContain("!metrics.customerMetricsAvailable");
    expect(customers).toContain("Returning dollars need identified buyers");
    expect(customers).toContain("<ShopifyBookSection");
    expect(customers).toContain("not $0");
    expect(customers).toContain("salesError={Boolean(salesError)");
    expect(customers).toContain("Retry to see returning dollars");
  });

  it("links Growth and LTV — no dead end", () => {
    expect(customers).toContain('href="/app/growth"');
    expect(customers).toContain('href="/app/ltv"');
  });

  it("never paints cash CAC, spend explorer, CPA, ROAS, or a 0.00×", () => {
    for (const source of [customers, scoreboard, concentration, lib]) {
      expect(source).not.toContain("cashCac");
      expect(source).not.toContain("SpendExplorer");
      expect(source).not.toContain("CPA");
      expect(source).not.toContain("Total ROAS");
      expect(source).not.toContain("Spend Upload");
      expect(source).not.toContain("Cash CAC");
      expect(source).not.toContain("/app/spend");
      expect(source).not.toContain("0.00×");
    }
  });
});

describe("CustomersScoreboard — dense, interactive, returning-first", () => {
  it("hero is sales from returning customers in dollars, not headcount", () => {
    expect(scoreboard).toContain("Sales from returning customers");
    expect(scoreboard).toContain("mcfly-cust__hero");
    expect(scoreboard).toContain("dollars, not headcount");
    const heroAt = scoreboard.indexOf("mcfly-cust__hero-v");
    const peekAt = scoreboard.indexOf("mcfly-kpi-grid--peeks-lead");
    expect(heroAt).toBeGreaterThan(-1);
    expect(peekAt).toBeGreaterThan(heroAt);
  });

  it("packs the specified dense rows as interactive drill peeks", () => {
    for (const label of [
      "Sales per buyer",
      "Guests",
      "Top 10% of customers",
      "One-order buyers",
      "Orders per buyer",
      "Biggest orders",
    ]) {
      expect(scoreboard).toContain(label);
    }
    expect(scoreboard).toContain("mcfly-kpi--peek");
    expect(scoreboard).toContain("mcfly-kpi--drill");
    expect(scoreboard).toContain("mcfly-kpi-grid--peeks-lead");
    expect(scoreboard).toContain("mcfly-kpi-grid--peeks-depth");
    expect(scoreboard).toContain("useDeskDrill");
    expect(scoreboard).toContain("DeskIcon");
    expect(scoreboard).toContain("mcfly-split__return");
  });

  it("SAMPLE Snowdevil is the canvas — kicker goes SR-only, never thinned", () => {
    expect(scoreboard).toContain("mcfly-scoreboard__kicker--sr");
    expect(scoreboard).toContain("useSampleDesk");
  });

  it("treats pending as not $0, never a fake number", () => {
    expect(scoreboard).toContain("salesPending");
    expect(scoreboard).toContain("not $0");
  });
});

describe("CustomerConcentrationChart — the Analytics gap, made visual", () => {
  it("paints a Pareto plus an interactive share ladder", () => {
    expect(concentration).toContain("mcfly-cust-pareto");
    expect(concentration).toContain("mcfly-chart__hrow");
    expect(concentration).toContain("Where the dollars concentrate");
    expect(concentration).toContain("customerConcentrationRows");
    expect(concentration).toContain("customerConcentrationPareto");
    expect(concentration).toContain("useDeskDrill");
  });
});
