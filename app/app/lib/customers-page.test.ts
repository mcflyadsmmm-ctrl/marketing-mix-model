import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const here = dirname(fileURLToPath(import.meta.url));

function read(rel: string): string {
  return readFileSync(join(here, rel), "utf8");
}

const customers = read("../routes/app.customers.tsx");
const firstView = read("../components/CustomersFirstViewport.tsx");
const scoreboard = read("../components/CustomersScoreboard.tsx");
const retention = read("../components/CustomerRetentionBoard.tsx");
const watch = read("../components/CustomerWhaleWatch.tsx");
const rfmBoard = read("../components/CustomerRfmBoard.tsx");
const value = read("../components/CustomerValueBands.tsx");
const whale = read("../components/CustomerWhaleTable.tsx");
const mix = read("../components/CustomerMixChart.tsx");
const charts = read("../components/CustomerCharts.tsx");
const analyticsLib = read("./customers-analytics.ts");
const rfmLib = read("./customers-rfm.ts");
const analyticsLoader = read("./desk-customers-page.server.ts");
const scoreboardLib = read("./customers-scoreboard.ts");

/**
 * Authority: docs/ops/research/black-clover-depth/ + docs/ops/CRAFT_UNLOCK.md
 * + docs/ops/FULL_TAB_CRAFT_AUDIT_v339.md FAIL #5.
 * Customers is one spine: returning $ first fold → full LTV pack → full Growth
 * pack → RFM / whales / LTV flagship depth. Not a customer-list clone.
 */

describe("Customers route — one RETAIN spine, order history only", () => {
  it("contrasts Shopify Analytics returning rate with returning dollars", () => {
    expect(customers).toContain("Shopify Analytics");
    expect(customers).toMatch(/dollars/i);
    expect(customers).toMatch(/returning/i);
  });

  it("leads with returning dollars, then LTV, Growth, then RFM depth", () => {
    expect(customers).toContain("loadCustomersStackPage");
    const order = [
      'id="mcfly-returning"',
      "<CustomersFirstViewport",
      "<CustomerMixChart",
      "<CustomersScoreboard",
      'id="mcfly-ltv"',
      "<UnlockFullHistoryBanner",
      "<CustomersLtvWindows",
      'id="mcfly-growth"',
      "<CustomersGrowthSection",
      'id="mcfly-depth"',
      "<CustomerRetentionBoard",
      "<CustomerWhaleWatch",
      "<CustomerRfmBoard",
      "<CustomerValueBands",
      "<CustomerWhaleTable",
      "<CustomerConcentrationChart",
      "<CustomersLtvDepth",
      "<ShareableInsightCards",
    ].map((tag) => customers.indexOf(tag));
    expect(order.every((i) => i > -1)).toBe(true);
    for (let i = 1; i < order.length; i += 1) {
      expect(order[i]).toBeGreaterThan(order[i - 1]!);
    }
    expect(customers.indexOf("<CustomerMixChart")).toBeLessThan(
      customers.indexOf("<CustomersScoreboard"),
    );
    expect(customers).toContain("salesPending={metrics.salesPending}");
    expect(customers).not.toContain(
      "{!metrics.salesPending ? <CustomerMixChart",
    );
    expect(customers).toContain("mcfly-cust-action-row");
    expect(customers).toContain("<CustomerConcentrationChart");
    expect(customers).not.toContain("<ShopifyBookSection");
    expect(customers).not.toContain('groups={["buyers"]}');
  });

  it("keeps the honest empty, pending, error, and identified-buyer locks", () => {
    expect(customers).toContain("!metrics.customerMetricsAvailable");
    expect(customers).toContain("Returning dollars need identified buyers");
    expect(customers).toContain("not $0");
    expect(customers).toContain("salesError={Boolean(salesError)");
    expect(customers).toContain("Retry to see returning dollars");
    expect(customers).toContain("orderFactsTruncated");
  });

  it("mounts Growth and LTV in-page instead of footer hops", () => {
    expect(customers).toContain('id="mcfly-growth"');
    expect(customers).toContain('id="mcfly-ltv"');
    expect(customers).not.toContain('href="/app/growth"');
    expect(customers).not.toContain('href="/app/ltv"');
    expect(customers).toContain("useSampleDesk");
    expect(customers).toContain("<ReviewAsk");
  });
});

describe("CustomersScoreboard — compact returning hero, not a six-tile wall", () => {
  it("is a returning-$ gauge plus three unique facts", () => {
    expect(scoreboard).toContain("mcfly-panel");
    expect(scoreboard).toContain("mcfly-cust-gauge");
    expect(scoreboard).toContain("mcfly-cust-facts");
    expect(scoreboard).toContain("Returning customers");
    expect(scoreboard).toContain("Sample data");
    expect(scoreboard).toContain("Guests");
    expect(scoreboard).toContain("Sales per buyer");
    expect(scoreboard).toContain("Biggest orders");
    expect(scoreboard.match(/<Fact[\s>]/g)?.length).toBe(3);
    expect(scoreboard).not.toContain("mcfly-cust-tiles");
    expect(scoreboard).not.toContain("mcfly-cust-bars");
    expect(scoreboard).not.toContain("One-order buyers");
    expect(scoreboard).not.toContain("Orders per buyer");
    expect(scoreboard).not.toContain("New dollars");
  });
});

describe("CustomerRetentionBoard — What-to-do retention flow", () => {
  it("paints repurchase clock, cadence, funnel, and an honest win-back play", () => {
    expect(retention).toContain("What to do");
    expect(retention).toContain("When they come back");
    expect(retention).toContain("Typical repurchase");
    expect(retention).toContain("Win-back");
    expect(retention).toContain("Retention cadence");
    expect(retention).toContain("Fall-off funnel");
    expect(retention).toContain("Win-back play");
    expect(retention).toContain("Save now");
    expect(retention).toContain("Repurchase");
    expect(retention).toContain("Win-back");
    expect(retention).toContain("mcfly-cust-kpi--action");
    expect(retention).toContain("VerticalBars");
    expect(retention.match(/<ActionCard[\s\n]/g)?.length).toBe(3);
  });

  it("does not absorb the whale watchlist — ActionCards stay the three plays", () => {
    expect(retention).not.toContain("Whale watchlist");
    expect(retention).not.toContain("RFM-lite");
  });

  it("deep-links win-back and never paints a missing repurchase share as 0%", () => {
    expect(retention).toContain('href="#mcfly-win-back"');
    expect(retention).not.toContain("a.repeatShare : 0");
    expect(retention).not.toContain("a.thirdPlusShare : 0");
    expect(retention).toContain("pct(row.share)");
  });

  it("never invents a 2nd-order product — honest about Level-1 scope", () => {
    expect(retention).toContain("read_orders");
    expect(retention).toMatch(/SKU|line item/i);
    expect(retention).not.toMatch(/Premium Clover|Live Lucky Club|Mystery Box/);
  });

  it("uses a designed empty, never a bare note", () => {
    expect(retention).toContain("RetentionEmptyFrame");
    expect(retention).toContain("mcfly-cust-empty");
    expect(retention).toContain("mcfly-cust-empty__ghost");
    expect(retention).toContain("not $0");
  });
});

describe("CustomerWhaleWatch — top order LTV beside ActionCards", () => {
  it("is a watchlist of ranked order LTV, not a named-customer dump", () => {
    expect(watch).toContain("Whale watchlist");
    expect(watch).toContain("row.verb");
    expect(watch).toContain("mcfly-cust-watch");
    expect(watch).toContain("Order LTV");
    expect(watch).toContain("RFM_FROM_SHOPIFY_ORDERS");
    expect(watch).toContain("repeatRevenue == null");
    expect(watch).toContain('href="#mcfly-win-back"');
    expect(watch).toContain("No customers invented");
    expect(watch).not.toMatch(/gid:\/\/shopify\/Customer/);
    expect(watch).not.toContain("Recharge");
    expect(watch).not.toContain("Skio");
  });

  it("uses an ActionCard-shaped first-win empty, never a blank table", () => {
    expect(watch).toContain("mcfly-cust-rfm__empty");
    expect(watch).toContain("shown.verb");
    expect(watch).toContain("Floor:");
    expect(watch).toContain("not $0");
    expect(watch).toContain("mcfly-cust-empty__ghost--table");
  });
});

describe("CustomerRfmBoard — recency / frequency / monetary lite", () => {
  it("paints four segments and three R/F/M bands, not a 5×5 dump", () => {
    expect(rfmBoard).toContain("RFM-lite");
    expect(rfmBoard).toContain("rfm.segments");
    expect(rfmBoard).toContain("rfm.bands");
    expect(rfmBoard).toContain("seg.verb");
    expect(rfmLib).toContain("Champions");
    expect(rfmLib).toContain("Hibernating");
    expect(rfmLib).toContain("From Shopify orders");
    expect(rfmLib).toContain("RFM_RECENT_DAYS = 30");
    expect(rfmLib).toContain("RFM_HIBERNATE_DAYS = 90");
    expect(rfmBoard).toContain("RFM_FROM_SHOPIFY_ORDERS");
    expect(rfmBoard).toContain("RFM_RULES_LINE");
    expect(rfmBoard).not.toContain("Potential loyalist");
    expect(rfmBoard).not.toContain("Cannot lose them");
  });

  it("uses an ActionCard-shaped empty with the 8 × 30 floor", () => {
    expect(rfmBoard).toContain("First win");
    expect(rfmBoard).toContain("empty.verb");
    expect(rfmBoard).toContain("Floor:");
    expect(rfmBoard).toContain("buyers × 30 days");
    expect(rfmBoard).toContain("not $0");
    expect(rfmBoard).toContain("mcfly-cust-empty__ghost--bars");
  });
});

describe("Customers loader — full stored book for RFM, 90-day mix kept", () => {
  it("loads OrderFacts without a start cap, then slices 90 days for mix", () => {
    expect(analyticsLoader).toContain("{ end }");
    expect(analyticsLoader).toContain("buildCustomerRfm");
    expect(analyticsLoader).toContain("CUSTOMERS_ANALYTICS_WINDOW_DAYS");
    expect(analyticsLoader).toContain("getOrderBackfillHistoryLimited");
    expect(analyticsLoader).toContain("full stored");
    expect(rfmLib).toContain("RFM_MIN_BUYERS = 8");
    expect(rfmLib).toContain("WATCHLIST_MAX = 8");
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

  it("uses a designed empty when buyers are missing", () => {
    expect(value).toContain("mcfly-cust-empty");
    expect(value).toContain("mcfly-cust-empty__ghost--bars");
    expect(value).toContain("not $0");
  });
});

describe("CustomerWhaleTable — best customers by recency", () => {
  it("is a soft table of 5+ order buyers by days since last order", () => {
    expect(whale).toContain("Whale recency");
    expect(whale).toContain("WHALE_MIN_ORDERS");
    expect(whale).toContain("mcfly-cust-table");
  });

  it("uses a designed empty when no whales are on file", () => {
    expect(whale).toContain("mcfly-cust-empty");
    expect(whale).toContain("mcfly-cust-empty__ghost--table");
    expect(whale).toContain("not zero");
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
    expect(mix).toContain("mcfly-chart__axis-y");
    expect(mix).toContain("mcfly-chart__axis-y2");
    expect(mix).toContain("mcfly-chart__xtick");
    expect(mix).toContain("mcfly-chart__tip");
    expect(mix).toContain("mcfly-chart__tip-row");
    expect(mix).toContain("mcfly-chart__guide");
    expect(mix).toContain("overviewChartAxis");
  });

  it("offers a Daily / Weekly / Monthly grain toggle powered by pure bucketing", () => {
    expect(mix).toContain("bucketMixDays");
    expect(mix).toContain("bucketMixWeeks");
    expect(mix).toContain("mixSummary");
    expect(mix).toContain("resolveMixGrain");
    expect(mix).toContain("Daily");
    expect(mix).toContain("Weekly");
    expect(mix).toContain("Monthly");
    expect(mix).toContain("mcfly-period__btn");
    expect(analyticsLib).toContain("mixDaily");
  });

  it("paints three win-back ActionCards with green and grey deltas", () => {
    expect(mix).toContain("buildReturningMixPlays");
    expect(mix).toContain("mcfly-cust-mix__plays");
    expect(mix).toContain("Win-back");
    expect(mix.match(/<ActionCard[\s\n]/g)?.length).toBe(1);
    expect(analyticsLib).toContain('verb: "Win-back"');
    expect(analyticsLib).toContain('label: "Save now"');
    expect(analyticsLib).toContain('label: "Share vs usual"');
    expect(analyticsLib).toContain('id: "latest"');
    expect(analyticsLib).toContain('id: "share"');
    expect(analyticsLib).toContain('id: "winback"');
    expect(mix).toContain("mcfly-kpi__delta--up");
    expect(mix).toContain("mcfly-kpi__delta--down");
    expect(mix).toContain("mcfly-kpi__delta--flat");
    expect(mix).not.toMatch(/delta--danger|#dc2626|#b91c1c/);
    expect(analyticsLib).toContain("No ad login");
    expect(analyticsLib).not.toMatch(/\bCOGS\b/);
    expect(analyticsLib).not.toMatch(/\bROAS\b/);
  });

  it("draws a designed guest-empty ghost, never a bare em dash", () => {
    expect(mix).toContain("MixEmptyFrame");
    expect(mix).toContain("mcfly-cust-mix__ghost");
    expect(mix).toContain("mcfly-cust-mix__empty-copy");
    expect(mix).toContain("not $0");
    expect(mix).toContain("salesPending");
    expect(mix).toContain("pending");
  });

  it("carries the premium grain wash on the marquee", () => {
    const css = read("../styles/mcfly-desk.css");
    expect(css).toContain(".mcfly-cust-mix::before");
    expect(css).toContain("feTurbulence");
    expect(css).toContain(".mcfly-cust-mix__ghost-bar");
    expect(css).toContain(".mcfly-cust-mix__empty-copy");
    expect(css).toContain(".mcfly-cust-mix__plays");
    expect(css).toContain(".mcfly-cust-mix__delta");
    expect(css).toContain(".mcfly-cust-facts");
    expect(css).toContain(".mcfly-cust-empty__ghost");
    expect(css).toContain(".mcfly-cust-action-row");
    expect(css).toContain(".mcfly-cust-rfm__empty");
    expect(css).toContain(".mcfly-cust-watch__row");
  });
});

describe("Zero spend / ROAS / Email on the Customers first fold", () => {
  it("never paints spend, ROAS, CPA, Email product, or a 0.00× on the returning fold", () => {
    for (const source of [
      customers,
      firstView,
      scoreboard,
      retention,
      watch,
      rfmBoard,
      value,
      whale,
      mix,
      charts,
      analyticsLib,
      rfmLib,
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
      expect(source).not.toContain("Klaviyo");
      expect(source).not.toContain("Email Cost");
      expect(source).not.toContain("/app/email");
    }
  });
});
