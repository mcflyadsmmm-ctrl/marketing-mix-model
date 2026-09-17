import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const here = dirname(fileURLToPath(import.meta.url));

function read(rel: string): string {
  return readFileSync(join(here, rel), "utf8");
}

const growth = read("../routes/app.growth.tsx");
const chart = read("../components/GrowthComebackChart.tsx");
const board = read("../components/GrowthScoreboard.tsx");
const tt2Board = read("../components/GrowthTt2Board.tsx");
const helpers = read("./growth-comeback.ts");
const tt2Lib = read("./growth-tt2.ts");
const loader = read("./desk-growth-page.server.ts");

describe("Growth page", () => {
  it("contrasts Shopify Analytics returning rate with order-history come-back", () => {
    expect(growth).toMatch(/Shopify Analytics/);
    expect(growth).toMatch(/second order|came back/i);
    expect(growth).toMatch(/Order\s+history/);
  });

  it("leads with the come-back explorer above the fold, then soft cards, then TT2", () => {
    const order = [
      "<GrowthComebackChart",
      "<GrowthScoreboard",
      "<GrowthTt2Board",
    ].map((tag) => growth.indexOf(tag));
    expect(order.every((i) => i > -1)).toBe(true);
    expect(order[0]!).toBeLessThan(order[1]!);
    expect(order[1]!).toBeLessThan(order[2]!);
    expect(growth).not.toContain("<ShopifyBookSection");
    expect(growth).not.toContain("<BookFactGrid");
    expect(growth).not.toContain("<CountBarsChart");
    expect(growth).not.toContain('groups={["growth"]}');
    // Explorer owns pending / thin-data empty — never hidden on pending.
    expect(growth).toContain("salesPending={metrics.salesPending}");
    expect(growth).not.toContain(
      "{!metrics.salesPending ? <GrowthComebackChart",
    );
  });

  it("opens LTV, keeps pending honesty, and paints the growth board", () => {
    expect(growth).toContain("PRODUCT_NOUN.openLtv");
    expect(growth).toContain("/app/ltv");
    expect(growth).toContain("not $0");
    expect(growth).toContain("Retry to see who came back");
    expect(growth).toContain("<GrowthScoreboard");
  });

  it("keeps first-order months and repeat rate from order history", () => {
    expect(growth).toContain("growthFirstOrderMonths");
    expect(growth).toContain("tillLtv.cohorts");
    expect(growth).toContain("tillLtv.repeatRate");
    expect(board).toContain("Repeat rate");
  });

  it("reads come-back over the trailing order window, not the month slice", () => {
    expect(growth).toContain("loadDeskSalesPage");
    expect(growth).toContain("loadGrowthComeback");
    expect(growth).toContain("comeback.depth");
    expect(board).toContain("medianDaysToSecond");
    expect(chart).toContain("secondOrderWithin30Share");
    expect(chart).toContain("not on file");
    // Come-back must not silently reuse the hidden period slice.
    expect(growth).not.toContain("metrics.shopifyDepth");
  });

  it("mounts an Overview-grade come-back explorer, not thin hrows", () => {
    expect(growth).toContain("<GrowthComebackChart");
    expect(chart).toContain("Who came back");
    expect(chart).toContain("mcfly-chart__axis-y");
    expect(chart).toContain("mcfly-chart__xtick");
    expect(chart).toContain("mcfly-chart__tip");
    expect(chart).toContain("mcfly-chart__tip-row");
    expect(chart).toContain("mcfly-chart__guide");
    expect(chart).toContain("Comeback");
    expect(chart).toContain("Monthly");
    expect(chart).toContain("Quarterly");
    expect(chart).toContain("ComebackEmptyFrame");
    expect(chart).not.toContain("mcfly-chart__hrow");
    expect(helpers).toContain("Two real columns make a plot");
    expect(helpers).toContain("length >= 2");
  });

  it("labels SAMPLE Snowdevil order history in-page", () => {
    expect(growth).toContain("SAMPLE Snowdevil");
    expect(growth).toContain("useSampleDesk");
  });

  it("is zero spend, zero ROAS, and zero CPA — order history only", () => {
    for (const source of [growth, chart, board]) {
      expect(source).not.toMatch(/ROAS/);
      expect(source).not.toMatch(/\bCPA\b/);
      expect(source).not.toMatch(/\bspend\b/i);
      expect(source).not.toContain("cashCac");
      expect(source).not.toContain("0.00×");
      expect(source).not.toMatch(/Klaviyo/i);
      expect(source).not.toContain("SpendExplorer");
    }
    for (const source of [tt2Board, tt2Lib, loader]) {
      expect(source).not.toContain("Total ROAS");
      expect(source).not.toContain("Spend Upload");
      expect(source).not.toContain("SpendExplorer");
      expect(source).not.toContain("cashCac");
      expect(source).not.toContain("0.00×");
      expect(source).not.toMatch(/Klaviyo/i);
    }
  });
});

describe("Growth TT2 + win-back clock — habit, not a dump", () => {
  it("paints typical wait, win-back, reach-now, cadence, and still-waiting", () => {
    expect(tt2Board).toContain("Days to a second order");
    expect(tt2Board).toContain("Typical wait");
    expect(tt2Board).toContain("Win-back by");
    expect(tt2Board).toContain("Reach now");
    expect(tt2Board).toContain("Days-to-2nd habit");
    expect(tt2Board).toContain("Still waiting");
    expect(tt2Board).toContain("Today’s read");
    expect(tt2Board).toContain("mcfly-cust-kpi--action");
    expect(tt2Board.match(/<ActionCard[\s\n]/g)?.length).toBe(3);
  });

  it("uses an ActionCard-shaped empty with the 8 × 30 floor", () => {
    expect(tt2Board).toContain("First win");
    expect(tt2Board).toContain("empty.verb");
    expect(tt2Board).toContain("Floor:");
    expect(tt2Board).toContain("buyers × 30 days");
    expect(tt2Board).toContain("not $0");
    expect(tt2Board).toContain("mcfly-cust-empty__ghost--bars");
    expect(tt2Lib).toContain("TT2_MIN_BUYERS = 8");
    expect(tt2Lib).toContain("TT2_MIN_FOLLOW_DAYS = 30");
    expect(tt2Lib).toContain("TT2_WINBACK_PAD_DAYS = 15");
    const css = read("../styles/mcfly-desk.css");
    expect(css).toContain(".mcfly-growth-tt2__read");
    expect(css).toContain(".mcfly-growth-tt2__split");
  });

  it("keeps merchant chrome free of analyst jargon", () => {
    const chrome = tt2Board
      .replace(/\{\/\*[\s\S]*?\*\/\}/g, "")
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/^\s*\/\/.*$/gm, "");
    expect(chrome).not.toMatch(/\bp25\b|\bp75\b/i);
    expect(chrome).not.toMatch(/\bARPU\b/i);
    expect(chrome).not.toMatch(/\bcohort\b/i);
  });
});

describe("Growth loader — full stored book for TT2, 90-day come-back kept", () => {
  it("loads OrderFacts without a start cap, then slices 90 days for the explorer", () => {
    expect(loader).toContain("{ end }");
    expect(loader).toContain("buildGrowthTt2");
    expect(loader).toContain("GROWTH_COMEBACK_WINDOW_DAYS");
    expect(loader).toContain("getOrderBackfillHistoryLimited");
    expect(loader).toContain("full stored");
    expect(growth).toContain("comeback.tt2");
  });
});
