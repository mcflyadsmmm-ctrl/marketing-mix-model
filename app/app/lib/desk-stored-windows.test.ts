import { describe, expect, it } from "vitest";
import { DESK_PERIOD_CHIPS, type DeskPeriodChip } from "./book-window";
import { deskPageShouldRevalidate } from "./desk-tab-flow";
import {
  deskPeriodClickStaysOnStoredWindows,
  orderWindowsFromStoredHeroes,
  selectStoredDeskWindow,
  type StoredWindowHero,
} from "./desk-stored-windows";
import type { OverviewOrderBookHero } from "./overview-order-book";

function args(current: string, next: string) {
  return {
    currentUrl: new URL(current),
    nextUrl: new URL(next),
    currentParams: {},
    nextParams: {},
    defaultShouldRevalidate: true,
  } as Parameters<typeof deskPageShouldRevalidate>[0];
}

function hero(sales: number): OverviewOrderBookHero {
  return {
    sales,
    priorSales: sales - 10,
    yoyPct: 1,
    zone: "up",
    returningSales: 20,
    typicalOrder: 30,
    weekendShare: 0.2,
    orderCount: sales,
    empty: false,
  };
}

function stored(sales: number): StoredWindowHero {
  return hero(sales);
}

describe("stored desk windows", () => {
  it("keeps a period click on the five stored windows", () => {
    for (const from of DESK_PERIOD_CHIPS) {
      for (const to of DESK_PERIOD_CHIPS) {
        if (from === to) continue;
        const current = `https://mcflyads.com/demo?period=${from}`;
        const next = `https://mcflyads.com/demo?period=${to}`;
        expect(deskPeriodClickStaysOnStoredWindows(new URL(current), new URL(next))).toBe(
          true,
        );
        expect(deskPageShouldRevalidate(args(current, next))).toBe(false);
        expect(
          deskPageShouldRevalidate(
            args(
              `https://mcflyads.com/app/customers?period=${from}`,
              `https://mcflyads.com/app/customers?period=${to}`,
            ),
          ),
        ).toBe(false);
        expect(
          deskPageShouldRevalidate(
            args(
              `https://mcflyads.com/app/spend?period=${from}`,
              `https://mcflyads.com/app/spend?period=${to}`,
            ),
          ),
        ).toBe(false);
      }
    }
  });

  it("still refetches a shot window that is not one of the five chips", () => {
    expect(
      deskPeriodClickStaysOnStoredWindows(
        new URL("https://mcflyads.com/app?period=mtd"),
        new URL("https://mcflyads.com/app?period=y3"),
      ),
    ).toBe(false);
    expect(
      deskPageShouldRevalidate(
        args("https://mcflyads.com/app?period=mtd", "https://mcflyads.com/app?period=y3"),
      ),
    ).toBe(true);
  });

  it("selects the matching stored window and does not borrow another month", () => {
    const windows = orderWindowsFromStoredHeroes(
      {
        mtd: { hero: stored(100) },
        lm: { hero: stored(200) },
        qtd: { hero: stored(300) },
        ytd: { hero: null },
        l12m: { hero: stored(500) },
      },
      null,
    );
    expect(windows?.mtd?.sales).toBe(100);
    expect(windows?.lm?.sales).toBe(200);
    expect(windows?.ytd).toBeUndefined();

    const picked = selectStoredDeskWindow({
      windows,
      period: "lm",
      loadedPreset: "mtd",
      fallback: hero(100),
    });
    expect(picked.chip).toBe("lm");
    expect(picked.hero.sales).toBe(200);

    const missing = selectStoredDeskWindow({
      windows,
      period: "ytd",
      loadedPreset: "mtd",
      fallback: hero(100),
    });
    expect(missing.chip).toBe("ytd");
    expect(missing.hero.sales).toBeNull();
    expect(missing.hero.empty).toBe(true);
    expect(missing.hero.sales).not.toBe(100);
  });

  it("uses the legacy this-month hero only for that chip", () => {
    const windows = orderWindowsFromStoredHeroes({}, stored(42));
    expect(windows?.mtd?.sales).toBe(42);
    const chips = Object.keys(windows ?? {}) as DeskPeriodChip[];
    expect(chips).toEqual(["mtd"]);
  });
});
