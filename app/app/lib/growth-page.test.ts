import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const here = dirname(fileURLToPath(import.meta.url));

function read(rel: string): string {
  return readFileSync(join(here, rel), "utf8");
}

const growth = read("../routes/app.growth.tsx");
const customers = read("../routes/app.customers.tsx");
const firstView = read("../components/GrowthFirstViewport.tsx");
const chart = read("../components/GrowthComebackChart.tsx");
const board = read("../components/GrowthScoreboard.tsx");
const tt2Board = read("../components/GrowthTt2Board.tsx");
const helpers = read("./growth-comeback.ts");
const tt2Lib = read("./growth-tt2.ts");
const loader = read("./desk-growth-page.server.ts");
const firstViewLib = read("./growth-first-viewport.ts");
const stack = read("./desk-customers-stack.server.ts");
const panelLib = read("./customers-first-viewport.ts");

describe("Growth page", () => {
  it("redirects to Customers with panel=growth and preserves query", () => {
    expect(growth).toContain("authenticate.admin");
    expect(growth).toContain('customersPanelRedirectPath');
    expect(growth).toContain('"growth"');
    expect(growth).toContain("/app/customers");
    expect(growth).toContain("throw redirect");
    expect(panelLib).toContain('next.set("panel", panel)');
    expect(growth).not.toContain("<GrowthFirstViewport");
    expect(growth).not.toContain("Spend Upload");
    expect(growth).not.toContain("Total ROAS");
  });

  it("mounts the days-to-second pack on Customers after LTV windows", () => {
    const order = [
      "<CustomersLtvWindows",
      "<CustomersGrowthSection",
      "<GrowthFirstViewport",
      "<GrowthComebackChart",
      "<GrowthScoreboard",
      "<GrowthTt2Board",
    ].map((tag) => {
      const inCustomers = customers.indexOf(tag);
      if (inCustomers > -1) return inCustomers;
      return read("../components/CustomersGrowthSection.tsx").indexOf(tag);
    });
    expect(customers).toContain("<CustomersGrowthSection");
    expect(customers).toContain("GROWTH_FIRST_LANE_LABEL");
    expect(customers).toContain('id="mcfly-growth"');
    expect(customers.indexOf("<CustomersLtvWindows")).toBeLessThan(
      customers.indexOf("<CustomersGrowthSection"),
    );
    const section = read("../components/CustomersGrowthSection.tsx");
    expect(section.indexOf("<GrowthFirstViewport")).toBeLessThan(
      section.indexOf("<GrowthComebackChart"),
    );
    expect(section.indexOf("<GrowthComebackChart")).toBeLessThan(
      section.indexOf("<GrowthScoreboard"),
    );
    expect(section.indexOf("<GrowthScoreboard")).toBeLessThan(
      section.indexOf("<GrowthTt2Board"),
    );
    expect(section).not.toContain("<ShopifyBookSection");
    expect(section).not.toContain("<BookFactGrid");
    expect(section).not.toContain("<CountBarsChart");
    expect(section).toContain("salesPending={salesPending}");
    expect(section).not.toContain(
      "{!metrics.salesPending ? <GrowthComebackChart",
    );
    void order;
  });

  it("opens LTV in-page, keeps pending honesty, and paints the growth board", () => {
    const section = read("../components/CustomersGrowthSection.tsx");
    expect(section).toContain("PRODUCT_NOUN.openLtv");
    expect(section).toContain("#mcfly-ltv");
    expect(section).toContain("Order history");
    expect(customers).toContain("not $0");
    expect(section).toContain("<GrowthScoreboard");
  });

  it("keeps first-order months and repeat rate from order history", () => {
    const section = read("../components/CustomersGrowthSection.tsx");
    expect(section).toContain("growthFirstOrderMonths");
    expect(customers).toContain("tillLtv.cohorts");
    expect(customers).toContain("tillLtv.repeatRate");
    expect(board).toContain("Repeat rate");
  });

  it("reads come-back over the trailing order window, not the month slice", () => {
    expect(stack).toContain("loadDeskSalesPage");
    expect(stack).toContain("loadGrowthComeback");
    expect(customers).toContain("comeback.tt2");
    expect(customers).toContain("comeback.depth");
    expect(board).toContain("medianDaysToSecond");
    expect(chart).toContain("secondOrderWithin30Share");
    expect(chart).toContain("not on file");
    const section = read("../components/CustomersGrowthSection.tsx");
    expect(section).not.toContain("metrics.shopifyDepth");
    expect(section).toContain("growthOrderDepthBars");
  });

  it("mounts an Overview-grade come-back explorer, not thin hrows", () => {
    const section = read("../components/CustomersGrowthSection.tsx");
    expect(section).toContain("<GrowthComebackChart");
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
    expect(customers).toContain("SAMPLE Snowdevil");
    expect(customers).toContain("useSampleDesk");
  });

  it("is zero spend, zero ROAS, and zero CPA — order history only", () => {
    for (const source of [growth, firstView, chart, board]) {
      expect(source).not.toMatch(/ROAS/);
      expect(source).not.toMatch(/\bCPA\b/);
      expect(source).not.toMatch(/\bspend\b/i);
      expect(source).not.toContain("cashCac");
      expect(source).not.toContain("0.00×");
      expect(source).not.toMatch(/Klaviyo/i);
      expect(source).not.toContain("SpendExplorer");
    }
    const section = read("../components/CustomersGrowthSection.tsx");
    expect(section).not.toMatch(/ROAS/);
    expect(section).not.toContain("Spend Upload");
    for (const source of [tt2Board, tt2Lib, loader, firstViewLib]) {
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
    expect(tt2Board).toContain("Sat–Sun");
    expect(tt2Board).toContain("not 0%");
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
    expect(customers).toContain("comeback.tt2");
  });
});
