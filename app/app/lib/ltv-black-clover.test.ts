import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  isRevenue,
  resolveLtvBuild,
  targetLinePct,
  type LtvBuildWindow,
} from "../components/LtvValueBuild";

const here = dirname(fileURLToPath(import.meta.url));

function read(rel: string): string {
  return readFileSync(join(here, rel), "utf8");
}

/** Merchant chrome only — a comment may name a banned word to explain a ban. */
function chrome(rel: string): string {
  return read(rel)
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, "")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "");
}

const ltv = read("../routes/app.ltv.tsx");
const build = read("../components/LtvValueBuild.tsx");

function win(
  key: string,
  value: number | null,
  pending = false,
): LtvBuildWindow {
  return { key, label: key, value, detail: `${key} detail`, pending };
}

describe("resolveLtvBuild (value-build honesty)", () => {
  it("treats only finite positive revenue as paintable", () => {
    expect(isRevenue(120)).toBe(true);
    expect(isRevenue(0)).toBe(false);
    expect(isRevenue(-5)).toBe(false);
    expect(isRevenue(null)).toBe(false);
    expect(isRevenue(Number.NaN)).toBe(false);
    expect(isRevenue(Number.POSITIVE_INFINITY)).toBe(false);
  });

  it("draws the 30 → 90 → 365 build when the windows are on file", () => {
    const out = resolveLtvBuild([
      win("d30", 120),
      win("d90", 255),
      win("d365", 545),
    ]);
    expect(out).not.toBeNull();
    expect(out?.rows.map((r) => r.key)).toEqual(["d30", "d90", "d365"]);
    // Bars scale to the largest window, never a fixed axis.
    expect(out?.max).toBe(545);
  });

  it("keeps a history-limited year as a pending row, never a sealed dollar", () => {
    const out = resolveLtvBuild([
      win("d30", 120),
      win("d90", 255),
      win("d365", null, true),
    ]);
    expect(out).not.toBeNull();
    expect(out?.rows).toHaveLength(3);
    const year = out?.rows.find((r) => r.key === "d365");
    expect(year?.pending).toBe(true);
    expect(isRevenue(year?.value ?? null)).toBe(false);
    // Scale ignores the pending year — comes from the real dollars only.
    expect(out?.max).toBe(255);
  });

  it("refuses to draw a build from a single window (a KPI, not a build)", () => {
    expect(resolveLtvBuild([win("d90", 255)])).toBeNull();
    expect(
      resolveLtvBuild([win("d90", 255), win("d365", null, false)]),
    ).toBeNull();
  });

  it("refuses to draw when nothing is on file yet (all pending / empty)", () => {
    expect(resolveLtvBuild([])).toBeNull();
    expect(
      resolveLtvBuild([win("d90", null, true), win("d365", null, true)]),
    ).toBeNull();
  });

  it("reuses the shared desk chart shell — no bespoke LTV CSS to conflict", () => {
    expect(build).toMatch(/className="mcfly-chart(?: mcfly-chart--soft)?"/);
    expect(build).toContain("mcfly-chart__hrow");
    expect(build).toContain("mcfly-chart__hfill");
    expect(build).toContain("mcfly-chart__target-line");
    expect(build).not.toContain("mcfly-ltv-");
    expect(build).not.toContain("mcfly-acq-tile");
    // Drillable like the rest of the Black Clover scoreboard.
    expect(build).toContain("useDeskDrill");
    expect(build).toContain("openDrill");
  });

  it("places Target Line at the observed average, never past the bar scale", () => {
    expect(targetLinePct(255, 545)).toBeCloseTo((255 / 545) * 100, 5);
    expect(targetLinePct(545, 545)).toBe(100);
    expect(targetLinePct(0, 545)).toBe(0);
    expect(targetLinePct(900, 545)).toBe(100);
  });

  it("value-build chrome never leaks glossary or a fake $0", () => {
    const chromeBuild = chrome("../components/LtvValueBuild.tsx");
    expect(chromeBuild).not.toMatch(/cohort/i);
    expect(chromeBuild).not.toMatch(/\bARPU\b/i);
    expect(chromeBuild).not.toMatch(/aMER/);
    expect(chromeBuild).not.toContain("0.00×");
    // Averages, never a promise.
    expect(build).toContain("not a promise");
  });
});

describe("LTV route mounts the Black Clover value build", () => {
  it("imports and renders the value-build chart with the new-buyer count", () => {
    expect(ltv).toContain(
      'import { LtvValueBuild, type LtvBuildWindow } from "../components/LtvValueBuild"',
    );
    expect(ltv).toContain("<LtvValueBuild");
    expect(ltv).toContain("windows={buildWindows}");
    expect(ltv).toContain("newBuyers={metrics.tillLtv.newBuyers}");
    expect(ltv).toContain("targetLine={chartTargetLine}");
    expect(ltv).toContain("chartLtvPeek");
  });

  it("builds 30 / 90 / first-year windows, year honest when history-limited", () => {
    expect(ltv).toContain('label: "First 30 days"');
    expect(ltv).toContain('label: "First 90 days"');
    expect(ltv).toContain('label: "First year"');
    // Year is pending until enough buyers have lived it — not a 60-day cap.
    expect(ltv).toContain("const yearOnFile = isNum(ltv.avgRevenueD365)");
    expect(ltv).toContain("pending: yearPending");
  });
});

describe("LTV is order-led first; margin & Cash CAC only on spend", () => {
  it("splits order-revenue rows from the spend/margin economics rows", () => {
    expect(ltv).toContain("const orderRows: LtvRow[] = []");
    expect(ltv).toContain("const economicsRows: LtvRow[] = []");
    // The order-revenue grid is painted before the economics grid.
    expect(ltv.indexOf("facts={orderRows}")).toBeGreaterThan(-1);
    expect(ltv.indexOf("facts={economicsRows}")).toBeGreaterThan(-1);
    expect(ltv.indexOf("facts={orderRows}")).toBeLessThan(
      ltv.indexOf("facts={economicsRows}"),
    );
  });

  it("gates Kept after margin, Cash CAC and Value vs cost on typed spend", () => {
    expect(ltv).toContain("contrib90 != null && hasSpend");
    expect(ltv).toMatch(/hasSpend && cashCac != null/);
    expect(ltv).toContain("hasSpend && isNum(ltv.ltvCacRatio)");
    // First-year "kept" hint only when spend exists — order value stays clean.
    expect(ltv).toContain("hasSpend && contrib365 != null");
  });

  it("order-revenue rows never depend on spend", () => {
    const orderStart = ltv.indexOf("const orderRows: LtvRow[] = []");
    const orderEnd = ltv.indexOf("const economicsRows: LtvRow[] = []");
    const orderBlock = ltv.slice(orderStart, orderEnd);
    expect(orderStart).toBeGreaterThan(-1);
    expect(orderEnd).toBeGreaterThan(orderStart);
    expect(orderBlock).toContain('k: "First 30 days"');
    expect(orderBlock).toContain('k: "Orders in first 90 days on file"');
    expect(orderBlock).toContain('k: "Repeat orders"');
    expect(orderBlock).not.toContain("cashCac");
    expect(orderBlock).not.toContain("Spend per buyer");
  });

  it("keeps the economics grid section behind an order-led lede", () => {
    expect(ltv).toContain('aria-label="Cost and margin"');
    expect(ltv).toContain("economicsRows.length > 0");
  });
});
