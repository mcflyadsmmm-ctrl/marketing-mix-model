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
const helpers = read("./growth-comeback.ts");

describe("Growth page", () => {
  it("contrasts Shopify Analytics returning rate with order-history come-back", () => {
    expect(growth).toMatch(/Shopify Analytics/);
    expect(growth).toMatch(/second order|came back/i);
    expect(growth).toMatch(/Order\s+history/);
  });

  it("leads with the come-back explorer above the fold, then soft cards", () => {
    const order = ["<GrowthComebackChart", "<GrowthScoreboard"].map((tag) =>
      growth.indexOf(tag),
    );
    expect(order.every((i) => i > -1)).toBe(true);
    expect(order[0]!).toBeLessThan(order[1]!);
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
  });
});
