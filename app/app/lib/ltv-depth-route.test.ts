import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const here = dirname(fileURLToPath(import.meta.url));
const read = (rel: string) => readFileSync(join(here, rel), "utf8");

const route = read("../routes/app.ltv.tsx");
const curves = read("../components/LtvBuildCurves.tsx");
const heat = read("../components/LtvRetentionHeat.tsx");
const tiers = read("../components/LtvTierTables.tsx");
const paths = read("../components/LtvPathTable.tsx");
const whales = read("../components/LtvWhaleRecency.tsx");
const flagship = read("../components/LtvFlagshipBoard.tsx");
const depthPage = read("../lib/ltv-depth-page.server.ts");

describe("LTV route mounts the depth pack", () => {
  it("loads the depth view in the loader", () => {
    expect(route).toContain(
      'import { loadLtvDepth } from "../lib/ltv-depth-page.server"',
    );
    expect(route).toContain("loadLtvDepth({ shopId: shop.id, useSampleDesk })");
    expect(route).toMatch(/return \{[\s\S]*?\bdepth,/);
    expect(depthPage).toContain("shopifyReadOrdersScopesAllowDeep");
  });

  it("imports and renders all five depth panels plus one flagship board", () => {
    for (const tag of [
      "LtvBuildCurves",
      "LtvRetentionHeat",
      "LtvTierTables",
      "LtvPathTable",
      "LtvWhaleRecency",
      "LtvFlagshipBoard",
    ]) {
      expect(route).toContain(`import { ${tag} }`);
      expect(route).toContain(`<${tag}`);
    }
    expect(route).not.toContain("LtvComeBackWindows");
    expect(route).not.toContain("LtvRefundHonesty");
    expect(route).toContain("buyers={depth.buyers}");
  });

  it("leads with order history — depth sits after the value build, before spend", () => {
    const build = route.indexOf("<LtvValueBuild");
    const firstDepth = route.indexOf("<LtvBuildCurves");
    const economics = route.indexOf("facts={economicsRows}");
    expect(build).toBeGreaterThan(-1);
    expect(firstDepth).toBeGreaterThan(build);
    expect(economics).toBeGreaterThan(firstDepth);
  });

  it("drops the old per-month grid once the richer curve paints", () => {
    expect(route).toContain("monthRows.length > 0 && !depth.curves");
  });

  it("labels the SAMPLE Snowdevil source", () => {
    expect(route).toContain("SAMPLE Snowdevil");
  });
});

describe("depth chrome stays honest and in shop-owner voice", () => {
  const all = [curves, heat, tiers, paths, whales, flagship];

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
    expect(flagship).not.toMatch(/about 60 days/);
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

  it("product journeys only paint when titles are on file", () => {
    // Live has no product names → the loader passes product: null and this
    // table returns null; the route never fakes a Path LTV table on live.
    expect(paths).toContain("paths.length === 0");
  });
});
