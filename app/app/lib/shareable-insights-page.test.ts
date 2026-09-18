import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const here = dirname(fileURLToPath(import.meta.url));

function read(rel: string): string {
  return readFileSync(join(here, rel), "utf8");
}

const overview = read("../routes/app._index.tsx");
const ltv = read("../routes/app.ltv.tsx");
const customers = read("../routes/app.customers.tsx");
const board = read("../components/ShareableInsightCards.tsx");
const lib = read("./shareable-insights.ts");
const png = read("./shareable-insight-png.ts");
const css = read("../styles/mcfly-desk.css");

describe("Shareable insight cards — habit, not a dump", () => {
  it("sits after mix/close and before the sales chart on Overview", () => {
    const order = [
      "<OverviewFirstViewport",
      "<OverviewYoyCards",
      "<OverviewMixForecast",
      "<ShareableInsightCards",
      "<OverviewSalesChart",
      "<OverviewDepthPeeks",
      "<WeekdaySalesChart",
    ].map((tag) => overview.indexOf(tag));
    expect(order.every((i) => i > -1)).toBe(true);
    for (let i = 1; i < order.length; i += 1) {
      expect(order[i]!).toBeGreaterThan(order[i - 1]!);
    }
    expect(overview).toContain("buildShareableInsights");
    expect(overview).toContain("pickShareableLtvPeek");
    expect(overview).toContain("medianDaysToSecond");
    expect(overview).toContain("avgRevenueD90");
  });

  it("reuses the same light strip on LTV and Customers without scrambling the spine", () => {
    expect(ltv).toContain("<ShareableInsightCards");
    expect(ltv.indexOf("<LtvWhaleRecency")).toBeGreaterThan(-1);
    expect(ltv.indexOf("<ShareableInsightCards")).toBeGreaterThan(
      ltv.indexOf("<LtvWhaleRecency"),
    );
    expect(ltv.indexOf("<ShareableInsightCards")).toBeGreaterThan(
      ltv.indexOf("<LtvPromoBoard"),
    );
    expect(ltv).toContain("flagshipDailyRead");
    expect(customers).toContain("<ShareableInsightCards");
    expect(customers.indexOf("<ShareableInsightCards")).toBeGreaterThan(
      customers.indexOf("<CustomerConcentrationChart"),
    );
    expect(customers.indexOf("<ShareableInsightCards")).toBeGreaterThan(
      customers.indexOf("<CustomersScoreboard"),
    );
  });

  it("paints 2–4 screenshot cards with formula, copy, and PNG", () => {
    expect(board).toContain("Share a number");
    expect(board).toContain("Copy line");
    expect(board).toContain("Save PNG");
    expect(board).toContain("mcfly-share-card__poster");
    expect(board).toContain("mcfly-share-card__formula");
    expect(board).toContain("downloadShareableInsightPng");
    expect(board).toContain("copyInsightLine");
    expect(lib).toContain("Returning $ ÷ (new $ + returning $)");
    expect(lib).toContain("median of paid orders");
    expect(lib).toContain("median first→second gap");
    expect(lib).toContain("average dollars per new buyer");
    expect(png).toContain("Mcfly Analytics");
    expect(png).toContain("image/png");
  });

  it("uses an ActionCard-shaped empty with the 8-order floor", () => {
    expect(board).toContain("First win");
    expect(board).toContain("empty.verb");
    expect(board).toContain("Floor:");
    expect(board).toContain("not $0");
    expect(board).toContain("mcfly-cust-empty__ghost--bars");
    expect(lib).toContain("SHARE_MIN_ORDERS = 8");
    expect(lib).toContain("never a fake year");
    expect(css).toContain(".mcfly-share-card__poster");
    expect(css).toContain(".mcfly-share-cards__grid");
  });

  it("is full-history aware and withholds a fake year", () => {
    expect(lib).toContain("historyLimited");
    expect(lib).toContain("never a fake first-year");
    expect(overview).toContain("historyLimited");
    expect(ltv).toContain("historyLimited");
  });

  it("is zero spend, zero ROAS — order history only", () => {
    for (const source of [board, lib, png]) {
      expect(source).not.toContain("Spend Upload");
      expect(source).not.toContain("Total ROAS");
      expect(source).not.toContain("Edit spend");
      expect(source).not.toContain("QuietSpendDoor");
      expect(source).not.toContain("0.00×");
      expect(source).not.toContain("EOM projected");
      expect(source).not.toMatch(/Klaviyo/i);
      expect(source).not.toContain("SpendExplorer");
    }
    expect(lib).not.toMatch(/\bROAS\b/);
    expect(lib).not.toMatch(/\bCOGS\b/);
    expect(lib).not.toMatch(/\bpixel/i);
  });

  it("keeps merchant chrome free of analyst jargon", () => {
    const chrome = board
      .replace(/\{\/\*[\s\S]*?\*\/\}/g, "")
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/^\s*\/\/.*$/gm, "");
    expect(chrome).not.toMatch(/\bARPU\b/i);
    expect(chrome).not.toMatch(/\bcohort\b/i);
    expect(chrome).not.toMatch(/\bp25\b|\bp75\b/i);
  });
});
