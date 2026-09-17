import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  buildOverviewYoyCards,
  OVERVIEW_YOY_ANALYTICS_LEDE,
  OVERVIEW_YOY_MISSING,
  OVERVIEW_YOY_PENDING,
  OVERVIEW_YOY_SAME_WINDOW,
  overviewWindowRange,
  overviewWindowsCollapsed,
  overviewYoyZone,
  overviewYoyZoneLabel,
} from "./overview-yoy";

const here = dirname(fileURLToPath(import.meta.url));

describe("buildOverviewYoyCards", () => {
  it("keeps This month / quarter / year only, with last-year dollars", () => {
    const cards = buildOverviewYoyCards([
      {
        id: "yesterday",
        label: "Yesterday",
        sales: 100,
        priorSales: null,
        yoySalesPct: null,
        fromKey: "2026-09-14",
        toKey: "2026-09-14",
      },
      {
        id: "mtd",
        label: "This month",
        sales: 10_000,
        priorSales: 8_000,
        yoySalesPct: 25,
        fromKey: "2026-09-01",
        toKey: "2026-09-15",
      },
      {
        id: "qtd",
        label: "This quarter",
        sales: 30_000,
        priorSales: 20_000,
        yoySalesPct: 50,
        fromKey: "2026-07-01",
        toKey: "2026-09-15",
      },
      {
        id: "ytd",
        label: "This year",
        sales: 80_000,
        priorSales: 70_000,
        yoySalesPct: 14.285714,
        fromKey: "2026-01-01",
        toKey: "2026-09-15",
      },
    ]);
    expect(cards.map((c) => c.id)).toEqual(["mtd", "qtd", "ytd"]);
    expect(cards.map((c) => c.label)).toEqual([
      "This month",
      "This quarter",
      "This year",
    ]);
    expect(cards[0]?.delta).toBe(2_000);
    expect(cards[0]?.missingPrior).toBe(false);
  });

  it("does not treat missing last year as $0", () => {
    const [month] = buildOverviewYoyCards([
      {
        id: "mtd",
        label: "This month",
        sales: 5_000,
        priorSales: null,
        yoySalesPct: null,
        fromKey: "2026-09-01",
        toKey: "2026-09-15",
      },
    ]);
    expect(month?.missingPrior).toBe(true);
    expect(month?.delta).toBeNull();
    expect(OVERVIEW_YOY_MISSING).toMatch(/60 days/);
    expect(OVERVIEW_YOY_MISSING).not.toMatch(/\$0 last year/);
    expect(OVERVIEW_YOY_PENDING).toMatch(/still loading/);
    expect(OVERVIEW_YOY_PENDING).toMatch(/not \$0/);
  });

  it("flags three windows that collapsed to the same dollars", () => {
    const cards = buildOverviewYoyCards([
      {
        id: "mtd",
        label: "This month",
        sales: 9943,
        priorSales: null,
        yoySalesPct: null,
        fromKey: null,
        toKey: null,
      },
      {
        id: "qtd",
        label: "This quarter",
        sales: 9943,
        priorSales: null,
        yoySalesPct: null,
        fromKey: null,
        toKey: null,
      },
      {
        id: "ytd",
        label: "This year",
        sales: 9943,
        priorSales: null,
        yoySalesPct: null,
        fromKey: null,
        toKey: null,
      },
    ]);
    expect(overviewWindowsCollapsed(cards)).toBe(true);
    expect(OVERVIEW_YOY_SAME_WINDOW).toMatch(/60 days/);
  });

  it("labels certified windows and zones honest deltas", () => {
    expect(overviewWindowRange("2026-09-01", "2026-09-16")).toBe("Sep 1–16");
    expect(overviewWindowRange("2026-07-01", "2026-09-16")).toBe(
      "Jul 1 – Sep 16",
    );
    expect(overviewWindowRange(null, "2026-09-16")).toBeNull();
    expect(overviewYoyZone({ delta: -1434, missingPrior: false })).toBe("down");
    expect(overviewYoyZone({ delta: 283, missingPrior: false })).toBe("up");
    expect(overviewYoyZone({ delta: null, missingPrior: true })).toBe("empty");
    expect(overviewYoyZoneLabel("up")).toBe("Up");
    expect(overviewYoyZoneLabel("down")).toBe("Down");
    expect(overviewYoyZoneLabel("even")).toBe("Even");
    expect(overviewYoyZoneLabel("empty")).toBeNull();
  });
});

describe("Overview vs Shopify Analytics", () => {
  it("names Shopify Analytics vs last-year cards, with pending still not $0", () => {
    const yoy = readFileSync(join(here, "./overview-yoy.ts"), "utf8");
    const cards = readFileSync(
      join(here, "../components/OverviewYoyCards.tsx"),
      "utf8",
    );
    const overview = readFileSync(join(here, "../routes/app._index.tsx"), "utf8");

    expect(OVERVIEW_YOY_ANALYTICS_LEDE).toMatch(/same days last year/i);
    expect(OVERVIEW_YOY_ANALYTICS_LEDE).not.toMatch(/optional|spend|ROAS/i);
    expect(yoy).toMatch(/Shopify Analytics/);
    expect(cards).toContain("OVERVIEW_YOY_ANALYTICS_LEDE");
    expect(cards).toContain("OVERVIEW_YOY_SAME_WINDOW");
    expect(cards).toContain("Last year");
    expect(cards).not.toContain("OVERVIEW_COVERAGE_LINE");
    expect(cards).toContain("OVERVIEW_YOY_PENDING");
    expect(cards).toContain("OVERVIEW_YOY_LABELS");
    expect(overview).not.toContain("<SpendExplorer");
    expect(overview).not.toContain("<DualCloseLine");
    expect(overview.indexOf("<OverviewYoyCards")).toBeGreaterThan(-1);
    expect(overview.indexOf("<OverviewYoyCards")).toBeLessThan(
      overview.indexOf("<OverviewFirstViewport"),
    );
  });
});
