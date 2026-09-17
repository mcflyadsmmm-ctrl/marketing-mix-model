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
const retention = read("../components/CustomerRetentionBoard.tsx");
const value = read("../components/CustomerValueBands.tsx");
const whale = read("../components/CustomerWhaleTable.tsx");
const mix = read("../components/CustomerMixChart.tsx");
const charts = read("../components/CustomerCharts.tsx");
const analyticsLib = read("./customers-analytics.ts");
const analyticsLoader = read("./desk-customers-page.server.ts");
const scoreboardLib = read("./customers-scoreboard.ts");

/**
 * Authority: docs/ops/research/black-clover-depth/ + docs/ops/CRAFT_UNLOCK.md.
 * Customers is a deep, chart-forward RETAIN board — returning-dollars hero, a
 * repurchase/retention flow, value & frequency mix, and whale recency — from
 * order history only. Update this file toward depth, never toward a card stack.
 */

describe("Customers route — deep RETAIN flow, order history only", () => {
  it("contrasts Shopify Analytics returning rate with returning dollars", () => {
    expect(customers).toContain("Shopify Analytics");
    expect(customers).toMatch(/dollars/i);
    expect(customers).toMatch(/returning/i);
  });

  it("leads with the marquee explorer above the fold, then the depth cards", () => {
    expect(customers).toContain("loadCustomerAnalytics");
    const order = [
      "<CustomerMixChart",
      "<CustomersScoreboard",
      "<CustomerRetentionBoard",
      "<CustomerValueBands",
      "<CustomerWhaleTable",
      "<ShopifyBookSection",
    ].map((tag) => customers.indexOf(tag));
    expect(order.every((i) => i > -1)).toBe(true);
    for (let i = 1; i < order.length; i += 1) {
      expect(order[i]).toBeGreaterThan(order[i - 1]!);
    }
    // The marquee owns the top of the tab, not the scoreboard card.
    expect(customers.indexOf("<CustomerMixChart")).toBeLessThan(
      customers.indexOf("<CustomersScoreboard"),
    );
    // It handles its own pending / guest-empty frame — never hidden on pending.
    expect(customers).toContain("salesPending={metrics.salesPending}");
    expect(customers).not.toContain(
      "{!metrics.salesPending ? <CustomerMixChart",
    );
    expect(customers).toContain("<CustomerConcentrationChart");
  });

  it("keeps the honest empty, pending, error, and buyers-book locks", () => {
    expect(customers).toContain('groups={["buyers"]}');
    expect(customers).toContain("!metrics.customerMetricsAvailable");
    expect(customers).toContain("Returning dollars need identified buyers");
    expect(customers).toContain("<ShopifyBookSection");
    expect(customers).toContain("not $0");
    expect(customers).toContain("salesError={Boolean(salesError)");
    expect(customers).toContain("Retry to see returning dollars");
    expect(customers).toContain("orderFactsTruncated");
  });

  it("links Growth and LTV and labels SAMPLE", () => {
    expect(customers).toContain('href="/app/growth"');
    expect(customers).toContain('href="/app/ltv"');
    expect(customers).toContain("useSampleDesk");
  });
});

describe("CustomersScoreboard — soft hero card, gauge + tiles + bars", () => {
  it("is a Monthly-pacing soft card, not identical drill cards", () => {
    expect(scoreboard).toContain("mcfly-panel");
    expect(scoreboard).toContain("mcfly-cust-gauge");
    expect(scoreboard).toContain("mcfly-cust-tiles");
    expect(scoreboard).toContain("mcfly-cust-bars");
    expect(scoreboard).toContain("Returning customers");
    expect(scoreboard).toContain("Sample data");
  });
});

describe("CustomerRetentionBoard — What-to-do retention flow", () => {
  it("paints repurchase clock, cadence, funnel, and an honest win-back play", () => {
    expect(retention).toContain("When they come back");
    expect(retention).toContain("Typical repurchase");
    expect(retention).toContain("Win-back");
    expect(retention).toContain("Retention cadence");
    expect(retention).toContain("Fall-off funnel");
    expect(retention).toContain("Win-back play");
    expect(retention).toContain("Save now");
    expect(retention).toContain("VerticalBars");
  });

  it("never invents a 2nd-order product — honest about Level-1 scope", () => {
    expect(retention).toContain("read_orders");
    expect(retention).toMatch(/SKU|line item/i);
    expect(retention).not.toMatch(/Premium Clover|Live Lucky Club|Mystery Box/);
  });
});

describe("CustomerValueBands — whales vs minnows", () => {
  it("draws dual-axis spend bands and the order-frequency long tail", () => {
    expect(value).toContain("Spend bands");
    expect(value).toContain("Order frequency");
    expect(value).toContain("DualBars");
    expect(value).toContain("Customers");
    expect(value).toContain("Revenue");
  });
});

describe("CustomerWhaleTable — best customers by recency", () => {
  it("is a soft table of 5+ order buyers by days since last order", () => {
    expect(whale).toContain("Whale recency");
    expect(whale).toContain("WHALE_MIN_ORDERS");
    expect(whale).toContain("mcfly-cust-table");
  });
});

describe("CustomerCharts — interactive primitives", () => {
  it("exports hoverable/drillable bar charts", () => {
    expect(charts).toContain("export function VerticalBars");
    expect(charts).toContain("export function DualBars");
    expect(charts).toContain("useDeskDrill");
  });
});

describe("CustomerMixChart — explorer-grade marquee, above the fold", () => {
  it("stacks new vs returning $ with a returning-share line, rail, and moving readout", () => {
    expect(mix).toContain("mixWeekly");
    expect(mix).toContain("mcfly-cust-mix__line");
    expect(mix).toContain("mcfly-cust-mix__rail");
    expect(mix).toContain("Returning share");
    expect(mix).toContain("useState");
    expect(mix).toContain("useDeskDrill");
    expect(mix).toContain("mcfly-chart__readout");
  });

  it("wears the Overview explorer scaffold — serif masthead, KPI strip, dark tooltip", () => {
    expect(mix).toContain("mcfly-chart__serif");
    expect(mix).toContain("mcfly-chart__stats");
    expect(mix).toContain("mcfly-chart__plot");
    // Crisp HTML axis overlays, not viewBox-shrinking SVG text.
    expect(mix).toContain("mcfly-chart__axis-y");
    expect(mix).toContain("mcfly-chart__axis-y2");
    expect(mix).toContain("mcfly-chart__xtick");
    // Dark floating tooltip that rides the hovered column.
    expect(mix).toContain("mcfly-chart__tip");
    expect(mix).toContain("mcfly-chart__tip-row");
    expect(mix).toContain("mcfly-chart__guide");
    expect(mix).toContain("overviewChartAxis");
  });

  it("offers a Weekly / Monthly grain toggle powered by pure bucketing", () => {
    expect(mix).toContain("bucketMixWeeks");
    expect(mix).toContain("mixSummary");
    expect(mix).toContain("Weekly");
    expect(mix).toContain("Monthly");
    expect(mix).toContain("mcfly-period__btn");
  });

  it("draws a designed guest-empty ghost, never a bare em dash", () => {
    expect(mix).toContain("MixEmptyFrame");
    expect(mix).toContain("mcfly-cust-mix__ghost");
    expect(mix).toContain("mcfly-cust-mix__empty-copy");
    expect(mix).toContain("not $0");
    expect(mix).toContain("salesPending");
    // The tab passes pending in — the marquee is never hidden.
    expect(mix).toContain("pending");
  });

  it("carries the premium grain wash on the marquee", () => {
    const css = read("../styles/mcfly-desk.css");
    expect(css).toContain(".mcfly-cust-mix::before");
    expect(css).toContain("feTurbulence");
    expect(css).toContain(".mcfly-cust-mix__ghost-bar");
    expect(css).toContain(".mcfly-cust-mix__empty-copy");
  });
});

describe("Zero spend / ROAS on the whole Customers tab", () => {
  it("never paints spend, ROAS, CPA, or a 0.00× on any Customers file", () => {
    for (const source of [
      customers,
      scoreboard,
      retention,
      value,
      whale,
      mix,
      charts,
      analyticsLib,
      analyticsLoader,
      scoreboardLib,
    ]) {
      expect(source).not.toContain("Total ROAS");
      expect(source).not.toContain("Spend Upload");
      expect(source).not.toContain("Cash CAC");
      expect(source).not.toContain("cashCac");
      expect(source).not.toContain("SpendExplorer");
      expect(source).not.toContain("/app/spend");
      expect(source).not.toContain("0.00×");
      expect(source).not.toContain("cashCostPerCustomer");
    }
  });
});
