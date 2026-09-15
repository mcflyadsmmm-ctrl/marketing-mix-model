import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import type { CertifiedDay } from "./mer-control";
import { OVERVIEW_YOY_MISSING } from "./overview-yoy";
import {
  last7VsPrior7,
  operatingMonthRows,
  YOY_ANALYTICS_LEDE,
  yoyDisplayValue,
} from "./yoy-workspace";

const here = dirname(fileURLToPath(import.meta.url));
const yoyRoute = readFileSync(join(here, "../routes/app.yoy.tsx"), "utf8");

function certifiedDay(
  dateKey: string,
  sales: number,
  spend = 0,
): CertifiedDay {
  const [year, monthIndex, day] = dateKey.split("-").map(Number);
  return {
    dateKey,
    year,
    monthIndex: monthIndex - 1,
    day,
    quarter: Math.ceil(monthIndex / 3),
    sales,
    spend,
    mer: spend > 0 ? sales / spend : null,
    channels: [],
    residualSpend: 0,
    unpaired: false,
  };
}

describe("YoY vs Shopify Analytics", () => {
  it("contrasts this period’s sales with this month / last month / last year plus last 7", () => {
    expect(YOY_ANALYTICS_LEDE).toContain("Shopify Analytics shows");
    expect(YOY_ANALYTICS_LEDE).toContain("This page shows");
    expect(YOY_ANALYTICS_LEDE).toMatch(/this period['’]s sales/i);
    expect(YOY_ANALYTICS_LEDE).toMatch(
      /this month vs last month vs last year plus last 7/i,
    );
    expect(yoyRoute).toContain("YOY_ANALYTICS_LEDE");
  });

  it("does not remount SpendExplorer or Overview’s three YoY cards", () => {
    expect(yoyRoute).not.toContain("SpendExplorer");
    expect(yoyRoute).not.toContain("OverviewYoyCards");
  });
});

describe("operatingMonthRows", () => {
  it("still paints thisMonth when last year is missing, with last-year sales null", () => {
    const rows = operatingMonthRows([
      { id: "thisMonth", sales: 12_000, spend: 0, mer: null },
    ]);
    expect(rows.map((row) => row.id)).toEqual([
      "thisMonth",
      "lastMonth",
      "lastYear",
    ]);
    expect(rows[0]?.sales).toBe(12_000);
    expect(rows.find((row) => row.id === "lastYear")?.sales).toBeNull();
  });
});

describe("YoY last-year honesty", () => {
  it("uses OVERVIEW_YOY_MISSING when last-year sales are null, not only a missing row id", () => {
    expect(yoyRoute).toContain("OVERVIEW_YOY_MISSING");
    expect(yoyRoute).not.toContain('byId.has("lastYear")');
    expect(yoyRoute).toMatch(/id === "lastYear"/);
    expect(yoyRoute).toMatch(/sales == null/);
    expect(OVERVIEW_YOY_MISSING).toMatch(/60 days/);
  });
});

describe("last7 empty display", () => {
  it("empty last-7 is an em dash, not $0", () => {
    expect(last7VsPrior7([]).sales).toBeNull();
    expect(yoyDisplayValue(null, (n) => `$${n}`)).toBe("—");
    expect(yoyDisplayValue(undefined, (n) => `$${n}`)).toBe("—");
    expect(yoyRoute).toContain("yoyDisplayValue(last7.sales");
    expect(yoyRoute).not.toContain("formatCurrency(last7.sales");
  });
});

describe("last7VsPrior7", () => {
  it("compares the latest seven certified days with the preceding seven", () => {
    const days = Array.from({ length: 14 }, (_, index) =>
      certifiedDay(
        `2026-09-${String(index + 1).padStart(2, "0")}`,
        index < 7 ? 100 : 200,
        index < 7 ? 25 : 50,
      ),
    );

    expect(last7VsPrior7(days)).toMatchObject({
      label: "Last 7 vs prior 7",
      sales: 1_400,
      priorSales: 700,
      spend: 350,
      priorSpend: 175,
      mer: 4,
      priorMer: 4,
    });
  });

  it("keeps the prior window null when no certified days precede it", () => {
    const days = Array.from({ length: 7 }, (_, index) =>
      certifiedDay(
        `2026-09-${String(index + 1).padStart(2, "0")}`,
        100,
        25,
      ),
    );

    const comparison = last7VsPrior7(days);
    expect(comparison.sales).toBe(700);
    expect(comparison.priorSales).toBeNull();
    expect(comparison.priorSpend).toBeNull();
    expect(comparison.priorMer).toBeNull();
  });

  it("keeps last-7 sales null when no certified days exist", () => {
    expect(last7VsPrior7([])).toMatchObject({
      sales: null,
      spend: null,
      mer: null,
      priorSales: null,
      priorSpend: null,
      priorMer: null,
    });
  });
});
