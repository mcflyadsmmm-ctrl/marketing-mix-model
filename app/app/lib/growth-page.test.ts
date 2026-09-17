import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const here = dirname(fileURLToPath(import.meta.url));
const growth = readFileSync(join(here, "../routes/app.growth.tsx"), "utf8");
const chart = readFileSync(
  join(here, "../components/GrowthComebackChart.tsx"),
  "utf8",
);

describe("Growth page", () => {
  it("contrasts Shopify Analytics returning rate with order-history come-back", () => {
    expect(growth).toMatch(/Shopify Analytics/);
    expect(growth).toMatch(/second order|came back/i);
    expect(growth).toMatch(/Order\s+history/);
  });

  it("opens LTV, keeps pending honesty, and paints the growth book", () => {
    expect(growth).toContain("PRODUCT_NOUN.openLtv");
    expect(growth).toContain("/app/ltv");
    expect(growth).toContain("not $0");
    expect(growth).toContain('groups={["growth"]}');
    expect(growth).toContain("Retry to see who came back");
  });

  it("keeps first-order months and repeat rate from order history", () => {
    expect(growth).toContain("First orders by month");
    expect(growth).toContain("Repeat rate");
    expect(growth).toContain("tillLtv.repeatRate");
  });

  it("reads come-back over the trailing order window, not the month slice", () => {
    expect(growth).toContain("loadDeskSalesPage");
    expect(growth).toContain("loadGrowthComeback");
    expect(growth).toContain("comeback.depth");
    expect(growth).toContain("medianDaysToSecond");
    expect(growth).toContain("secondOrderWithin30Share");
    expect(growth).toContain("not on file");
    // Come-back must not silently reuse the hidden period slice.
    expect(growth).not.toContain("metrics.shopifyDepth");
  });

  it("mounts a dense come-back funnel visual", () => {
    expect(growth).toContain("<GrowthComebackChart");
    expect(growth).toContain("How far past a first order");
    expect(chart).toContain("mcfly-chart__hrow");
    expect(chart).toContain("share of identified buyers");
    // One bar is not a funnel.
    expect(chart).toContain("usable.length < 2");
  });

  it("labels SAMPLE Snowdevil order history in-page", () => {
    expect(growth).toContain("SAMPLE Snowdevil");
    expect(growth).toContain("useSampleDesk");
  });

  it("is zero spend and zero ROAS — order history only", () => {
    expect(growth).not.toMatch(/ROAS/);
    // \b avoids matching the "sPend" inside salesPending.
    expect(growth).not.toMatch(/\bspend\b/i);
    expect(growth).not.toContain("cashCac");
    expect(growth).not.toContain("0.00×");
  });

  it("does not mention Klaviyo, explorer, or a returning-sales hero", () => {
    expect(growth).not.toMatch(/Klaviyo/i);
    expect(growth).not.toContain("SpendExplorer");
    expect(growth).not.toContain("Sales from returning customers");
    expect(growth).toContain('groups={["growth"]}');
  });
});
