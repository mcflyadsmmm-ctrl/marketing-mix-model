import { describe, expect, it } from "vitest";
import { buildOverviewYoyCards, OVERVIEW_YOY_MISSING } from "./overview-yoy";

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
  });
});
