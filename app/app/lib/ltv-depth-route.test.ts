import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const here = dirname(fileURLToPath(import.meta.url));
const read = (rel: string) => readFileSync(join(here, rel), "utf8");

const customers = read("../routes/app.customers.tsx");
const section = read("../components/CustomersLtvSection.tsx");
const stack = read("../lib/desk-customers-stack.server.ts");
const route = `${section}\n${customers}`;
const curves = read("../components/LtvBuildCurves.tsx");
const heat = read("../components/LtvRetentionHeat.tsx");
const tiers = read("../components/LtvTierTables.tsx");
const paths = read("../components/LtvPathTable.tsx");
const whales = read("../components/LtvWhaleRecency.tsx");
const flagship = read("../components/LtvFlagshipBoard.tsx");
const triangle = read("../components/LtvWindowTriangle.tsx");
const productBoard = read("../components/LtvProductBoard.tsx");
const promoBoard = read("../components/LtvPromoBoard.tsx");
const depthPage = read("../lib/ltv-depth-page.server.ts");

describe("LTV route mounts the depth pack", () => {
  it("loads the depth view in the Customers stack loader", () => {
    expect(stack).toContain(
      'import { loadLtvDepth } from "./ltv-depth-page.server"',
    );
    expect(stack).toContain(
      "loadLtvDepth({ shopId: shop.id, useSampleDesk: base.useSampleDesk })",
    );
    expect(stack).toMatch(/return \{[\s\S]*?\bdepth,/);
    expect(depthPage).toContain("{ end: asOf }");
    expect(depthPage).toContain("full stored");
  });

  it("imports and renders all five depth panels plus flagship, product, and promo boards", () => {
    for (const tag of [
      "LtvBuildCurves",
      "LtvRetentionHeat",
      "LtvTierTables",
      "LtvPathTable",
      "LtvWhaleRecency",
      "LtvFlagshipBoard",
      "LtvProductBoard",
      "LtvPromoBoard",
    ]) {
      expect(section).toContain(`import { ${tag} }`);
      expect(section).toContain(`<${tag}`);
    }
    expect(route).not.toContain("LtvComeBackWindows");
    expect(route).not.toContain("LtvRefundHonesty");
    expect(route).toContain("buyers={depth.buyers}");
    expect(route).not.toMatch(/about 60 days/);
  });

  it("leads with order history — value build, then spend economics, then depth fold", () => {
    expect(customers.indexOf("<CustomersLtvWindows")).toBeLessThan(
      customers.indexOf("<CustomersLtvEconomics"),
    );
    expect(customers.indexOf("<CustomersLtvEconomics")).toBeLessThan(
      customers.indexOf("<CustomersLtvDepth"),
    );
    expect(section.indexOf("<LtvValueBuild")).toBeLessThan(
      section.indexOf("<LtvWindowTriangle"),
    );
    expect(section.indexOf("<LtvWindowTriangle")).toBeLessThan(
      section.indexOf("<LtvFlagshipBoard"),
    );
    expect(section.indexOf("<LtvFlagshipBoard")).toBeLessThan(
      section.indexOf("<LtvBuildCurves"),
    );
  });

  it("mounts the 30/90/365 triangle on the LTV chip without dropping the heat", () => {
    const demo = read("../routes/demo.customers.tsx");
    expect(section).toContain("rows={depth.monthWindows}");
    expect(section).toContain("<LtvWindowTriangle");
    expect(customers).toContain('id="mcfly-ltv"');
    expect(demo).toContain("<CustomersLtvWindows");
    expect(section.indexOf("<LtvRetentionHeat")).toBeGreaterThan(
      section.indexOf("<LtvWindowTriangle"),
    );
    expect(section).toContain("targetLine={chartTargetLine}");
    expect(curves).toContain("Target Line · average");
    expect(triangle).toContain("Who came back");
    expect(triangle).toContain("What each first-order month spent");
    expect(triangle).toContain("Revenue by first-order month");
    expect(triangle).toContain("30 days");
    expect(triangle).toContain("90 days");
    expect(triangle).toContain("First year");
    expect(triangle).toContain("not 0%");
    expect(triangle).toContain("not $0");
    expect(triangle).toContain("SAMPLE Snowdevil");
    expect(triangle).toContain("firstOrderWindowTriangle");
    expect(triangle).toContain("rgba(4, 120, 87");
  });

  it("keeps the triangle as the LTV hero and densifies predictive LTV under it", () => {
    const windowsFn = section.slice(
      section.indexOf("export function CustomersLtvWindows"),
      section.indexOf("export function CustomersLtvDepth"),
    );
    expect(windowsFn).toContain("<LtvWindowTriangle");
    expect(windowsFn.indexOf("<LtvWindowTriangle")).toBeLessThan(
      windowsFn.indexOf("<LtvExpectedEstimate"),
    );
    expect(windowsFn).toContain("estimate={depth.expectedLtv}");
    expect(windowsFn).toContain("useSampleDesk={useSampleDesk}");
    const estimate = read("../components/LtvExpectedEstimate.tsx");
    const model = read("../lib/expected-ltv.ts");
    expect(estimate).toContain("{estimate.formula}");
    expect(estimate).toContain("Not $0.");
    expect(model).toContain(
      "Estimate — formula: average order value × expected orders",
    );
    expect(estimate + model).not.toMatch(/\bCOGS\b/);
    expect(estimate + model).not.toMatch(/pixel/i);
    expect(estimate + model).not.toMatch(/\bGMV\b/);
    expect(estimate + model).not.toMatch(/\bCAC\b/);
  });

  it("drops the old per-month grid once the richer curve paints", () => {
    expect(route).toContain("monthRows.length > 0 && !depth.curves");
  });

  it("labels the SAMPLE Snowdevil source", () => {
    expect(route).toContain("SAMPLE Snowdevil");
  });
});

describe("depth chrome stays honest and in shop-owner voice", () => {
  const all = [
    curves,
    heat,
    tiers,
    paths,
    whales,
    flagship,
    productBoard,
    promoBoard,
    triangle,
  ];

  it("keeps the banned glossary words out of merchant chrome", () => {
    // Comments may explain a ban; strip block/line comments before scanning.
    for (const src of all) {
      const chrome = src
        .replace(/\{\/\*[\s\S]*?\*\/\}/g, "")
        .replace(/\/\*[\s\S]*?\*\//g, "")
        .replace(/^\s*\/\/.*$/gm, "");
      expect(chrome).not.toMatch(/\bARPU\b/i);
      expect(chrome).not.toMatch(/\baMER\b/);
      expect(chrome).not.toMatch(/\bp25\b|\bp75\b/i);
    }
    const chromeFlag = flagship
      .replace(/\{\/\*[\s\S]*?\*\/\}/g, "")
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/^\s*\/\/.*$/gm, "");
    expect(chromeFlag).not.toMatch(/cohort/i);
  });

  it("says the honest short-window and no-promise lines", () => {
    expect(curves).toContain("Younger months stop earlier");
    expect(curves).toContain("Waiting on a second month");
    expect(curves).toContain("Target Line · average");
    expect(curves).toContain("Target Line from average");
    expect(heat).toContain("not fully passed");
    expect(heat).toContain("Waiting on a second month");
    expect(paths).toContain("not a forecast");
    expect(tiers).toContain("not a promise");
    expect(flagship).toContain("not $0");
    expect(flagship).toContain("average first order");
    expect(flagship).toContain("we do not invent a refund total");
    expect(flagship).toContain("flagshipDailyRead");
    expect(flagship).toContain("windowAddedAfterPrior");
    expect(flagship).toContain("after first 30 days");
    expect(flagship).toContain("First order");
    expect(flagship).toContain("mcfly-depth-formula__parts");
    expect(flagship).toContain("flagshipEmptyState");
    expect(flagship).toContain("First win");
    expect(flagship).toContain("Floor:");
    expect(flagship).toContain("buyers × 30 days");
    expect(flagship).toContain("empty.verb");
    expect(flagship).not.toMatch(/about 60 days/);
    expect(productBoard).toContain("not $0");
    expect(productBoard).toContain("average first order");
    expect(productBoard).toContain("Titled line items");
    expect(productBoard).toContain("First product → LTV");
    expect(productBoard).toContain("Highest first product");
    expect(productBoard).toContain("empty.verb");
    expect(productBoard).toContain("Floor:");
    expect(productBoard).toContain("named first-line item");
    expect(productBoard).not.toMatch(/about 60 days/);
    expect(promoBoard).toContain("not $0");
    expect(promoBoard).toContain("average first order");
    expect(promoBoard).toContain("Promo → LTV");
    expect(promoBoard).toContain("Highest first-order promo");
    expect(promoBoard).toContain("empty.verb");
    expect(promoBoard).toContain("Floor:");
    expect(promoBoard).toContain("full-price first");
    expect(promoBoard).toContain("we never invent a code");
    expect(promoBoard).not.toMatch(/about 60 days/);
  });

  it("is one board — not a month-grid dump or a win-back card", () => {
    expect(flagship).not.toContain("30d back");
    expect(flagship).not.toContain("Year back");
    expect(whales).not.toContain("Quiet 180");
  });

  it("carries the pack's dense table columns (reject thin)", () => {
    // AOV & basket tiers match the founder reference: buyers, repeat count,
    // rate, lifetime net dollars, per-buyer LTV, 90-day value + its sample n.
    for (const header of [
      ">Buyers<",
      ">Bought again<",
      ">Rate<",
      ">Lifetime net<",
      ">LTV<",
      ">First 90 days<",
      ">90-day n<",
    ]) {
      expect(tiers).toContain(header);
    }
    // Path LTV keeps the 90-day sample-size column too.
    expect(paths).toContain(">90-day n<");
  });

  it("reuses the shared chart shell instead of bespoke chart CSS", () => {
    expect(curves).toContain('className="mcfly-chart');
    expect(whales).toContain("mcfly-chart__hrow");
  });

  it("keeps existing curve hover on the shared smoothness helpers", () => {
    expect(curves).toContain('from "../lib/chart-smooth"');
    expect(curves).toContain("useChartHover");
    expect(curves).toContain("chartTipClassName");
  });

  it("mounts the flagship board before the existing curves, without removing them", () => {
    const boardAt = route.indexOf("<LtvFlagshipBoard");
    const curvesAt = route.indexOf("<LtvBuildCurves");
    expect(boardAt).toBeGreaterThan(-1);
    expect(curvesAt).toBeGreaterThan(boardAt);
  });

  it("mounts Product→LTV after the flagship and before the explorers", () => {
    const boardAt = route.indexOf("<LtvFlagshipBoard");
    const productAt = route.indexOf("<LtvProductBoard");
    const curvesAt = route.indexOf("<LtvBuildCurves");
    const pathAt = route.indexOf("<LtvPathTable");
    expect(productAt).toBeGreaterThan(boardAt);
    expect(curvesAt).toBeGreaterThan(productAt);
    expect(pathAt).toBeGreaterThan(productAt);
    expect(route).toContain("product={depth.productLtv}");
  });

  it("reuses shareable insight cards after the explorers, not inside the compete spine", () => {
    expect(section.indexOf("<LtvBuildCurves")).toBeGreaterThan(
      section.indexOf("<LtvPromoBoard"),
    );
    expect(customers.indexOf("<ShareableInsightCards")).toBeGreaterThan(
      customers.indexOf("<CustomersLtvDepth"),
    );
    expect(customers).toContain("flagshipDailyRead");
    expect(customers).toContain("buildShareableInsights");
  });

  it("mounts Promo→LTV after Product→LTV and before the explorers", () => {
    const productAt = route.indexOf("<LtvProductBoard");
    const promoAt = route.indexOf("<LtvPromoBoard");
    const curvesAt = route.indexOf("<LtvBuildCurves");
    const pathAt = route.indexOf("<LtvPathTable");
    expect(promoAt).toBeGreaterThan(productAt);
    expect(curvesAt).toBeGreaterThan(promoAt);
    expect(pathAt).toBeGreaterThan(promoAt);
    expect(route).toContain("promo={depth.promoLtv}");
    expect(route).toContain("after Product→LTV");
  });

  it("product journeys only paint when titles are on file", () => {
    // Live has no product names → the loader passes product: null and this
    // table returns null; the route never fakes a Path LTV table on live.
    expect(paths).toContain("paths.length === 0");
  });

  it("does not add a Product tab or scramble sales-five IA", () => {
    expect(route).not.toContain('href="/app/product"');
    expect(route).not.toContain('href="/app/discount"');
    expect(route).not.toContain("Customers RFM");
    expect(productBoard).not.toContain("from \"../lib/chart-smooth\"");
    expect(promoBoard).not.toContain("from \"../lib/chart-smooth\"");
    expect(flagship).toContain("What a new buyer is worth");
  });
});
