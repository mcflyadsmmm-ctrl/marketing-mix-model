import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const here = dirname(fileURLToPath(import.meta.url));

function read(rel: string): string {
  return readFileSync(join(here, rel), "utf8");
}

const overview = read("../routes/app._index.tsx");
const board = read("../components/OverviewMixForecast.tsx");
const firstView = read("../components/OverviewFirstViewport.tsx");
const lib = read("./overview-mix-forecast.ts");
const css = read("../styles/mcfly-desk.css");

describe("Overview mix + month close — habit, not a dump", () => {
  it("sits after the sales chart in the mix-close fold", () => {
    const order = [
      "<OverviewFirstViewport",
      "<OverviewYoyCards",
      "<OverviewSalesChart",
      "<OverviewMixForecast",
      "<ShareableInsightCards",
      "<OverviewDepthPeeks",
      "<WeekdaySalesChart",
    ].map((tag) => overview.indexOf(tag));
    expect(order.every((i) => i > -1)).toBe(true);
    for (let i = 1; i < order.length; i += 1) {
      expect(order[i]!).toBeGreaterThan(order[i - 1]!);
    }
    expect(overview).toContain("buildOverviewMixForecast");
    expect(overview).toContain("overviewMixForecastRead");
    expect(overview).toContain("orderBackfillProgress?.historyLimited");
    expect(overview).toContain("explorerDays.map((day) => day.sales)");
  });

  it("keeps typical order, weekends, and existing explorers", () => {
    expect(firstView).toContain("bookTypicalOrder");
    expect(firstView).toContain("Weekend vs weekday");
    expect(firstView).toContain("Returning");
    expect(firstView).toContain("mixGreeting");
    expect(firstView).toContain("newSales");
    expect(overview).toContain("newSales={shopBook.newSales}");
    expect(overview).toContain("<OverviewSalesChart");
    expect(overview).toContain("<WeekdaySalesChart");
  });

  it("paints Today’s read, mix, month close, and the written-out formula", () => {
    expect(board).toContain("Today’s read");
    expect(board).toContain("New vs returning $");
    expect(board).toContain("Returning $");
    expect(board).toContain("Month close");
    expect(board).toContain("mcfly-cust-kpi--action");
    expect(board.match(/<ActionCard[\s\n]/g)?.length).toBe(2);
    expect(board).toContain("mcfly-depth-formula__parts");
    expect(board).toContain("So far");
    expect(board).toContain("Days left");
    expect(board).toContain("Typical day");
    expect(board).toContain("formulaEq");
    expect(lib).toContain("Month close = so far + remaining days × typical day");
  });

  it("uses an ActionCard-shaped empty with the 8-order floor", () => {
    expect(board).toContain("First win");
    expect(board).toContain("empty.verb");
    expect(board).toContain("Floor:");
    expect(board).toContain("8 days with sales");
    expect(board).toContain("not $0");
    expect(board).toContain("mcfly-cust-empty__ghost--bars");
    expect(lib).toContain("MIX_MIN_ORDERS = 8");
    expect(lib).toContain("FORECAST_MIN_DAYS = 8");
    expect(css).toContain(".mcfly-ov-mix__read");
    expect(css).toContain(".mcfly-ov-mix__track");
  });

  it("is full-history aware and withholds a fake year of pace", () => {
    expect(lib).toContain("read_all_orders");
    expect(lib).toContain("historyLimited");
    expect(lib).toContain("not a year of pace");
    expect(overview).toContain("historyLimited");
    expect(board).toContain("overviewMixHistoryLine");
  });

  it("is zero spend, zero ROAS — order history only", () => {
    for (const source of [board, lib, firstView]) {
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
