import { describe, expect, it } from "vitest";
import {
  OVERVIEW_CHART_CAPTION,
  OVERVIEW_FROM_ORDERS_LABEL,
  OVERVIEW_ORDERS_EMPTY_LINE,
  OVERVIEW_PRIOR_MISSING_LINE,
  buildOverviewOrderBookHero,
  orderBookDaySeries,
  orderBookFirstOrderMs,
  orderBookReturningSales,
  overviewOrderDeltaLabel,
  overviewOrderHeroSentence,
  overviewYoyPct,
  shiftRangeOneYear,
  sumOrderBookAmounts,
  type OverviewOrderBookRow,
} from "./overview-order-book";

function row(
  partial: Partial<OverviewOrderBookRow> & {
    amount: number;
    orderedAt: Date;
    customerKey: string;
  },
): OverviewOrderBookRow {
  return {
    shopLocalDate: partial.shopLocalDate ?? partial.orderedAt,
    ...partial,
  };
}

describe("overview order book", () => {
  it("sums OrderFact amounts and never treats guests as returning", () => {
    const book: OverviewOrderBookRow[] = [
      row({
        amount: 100,
        orderedAt: new Date("2025-01-01T12:00:00.000Z"),
        customerKey: "a",
        shopLocalDate: new Date("2025-01-01T00:00:00.000Z"),
      }),
      row({
        amount: 40,
        orderedAt: new Date("2026-09-10T12:00:00.000Z"),
        customerKey: "a",
        shopLocalDate: new Date("2026-09-10T00:00:00.000Z"),
      }),
      row({
        amount: 25,
        orderedAt: new Date("2026-09-11T12:00:00.000Z"),
        customerKey: "guest",
        shopLocalDate: new Date("2026-09-11T00:00:00.000Z"),
      }),
      row({
        amount: 50,
        orderedAt: new Date("2026-09-12T12:00:00.000Z"),
        customerKey: "b",
        shopLocalDate: new Date("2026-09-12T00:00:00.000Z"),
      }),
    ];
    const window = book.slice(1);
    const first = orderBookFirstOrderMs(book);
    expect(sumOrderBookAmounts(window)).toBe(115);
    expect(orderBookReturningSales(window, first)).toBe(40);
  });

  it("builds hero YoY from order windows and withholds fake +∞% prior", () => {
    const windowOrders = [
      row({
        amount: 108_666,
        orderedAt: new Date("2026-09-10T12:00:00.000Z"),
        customerKey: "a",
        shopLocalDate: new Date("2026-09-10T00:00:00.000Z"),
      }),
    ];
    const priorOrders = [
      row({
        amount: 96_947,
        orderedAt: new Date("2025-09-10T12:00:00.000Z"),
        customerKey: "a",
        shopLocalDate: new Date("2025-09-10T00:00:00.000Z"),
      }),
    ];
    const hero = buildOverviewOrderBookHero({
      windowOrders,
      priorOrders,
      firstByCustomer: orderBookFirstOrderMs([...priorOrders, ...windowOrders]),
      typicalOrder: 602,
    });
    expect(hero.sales).toBe(108_666);
    expect(hero.priorSales).toBe(96_947);
    expect(hero.yoyPct).toBeCloseTo(12.09, 1);
    expect(hero.zone).toBe("up");
    expect(hero.empty).toBe(false);

    const missing = buildOverviewOrderBookHero({
      windowOrders,
      priorOrders: [],
      firstByCustomer: orderBookFirstOrderMs(windowOrders),
    });
    expect(missing.priorSales).toBeNull();
    expect(missing.yoyPct).toBeNull();
    expect(overviewYoyPct(100, 0)).toBeNull();
  });

  it("renders the canonical hero sentence and empty / missing-prior lines", () => {
    expect(
      overviewOrderHeroSentence({
        periodLabel: "This month",
        salesLabel: "$108,666",
        yoyPct: 12.09,
        empty: false,
        missingPrior: false,
      }),
    ).toBe("This month is $108,666 — up 12% vs the same days last year.");
    expect(
      overviewOrderHeroSentence({
        periodLabel: "This month",
        salesLabel: "$108,666",
        yoyPct: null,
        empty: false,
        missingPrior: true,
      }),
    ).toBe(`This month is $108,666 — ${OVERVIEW_PRIOR_MISSING_LINE}`);
    expect(
      overviewOrderHeroSentence({
        periodLabel: "This month",
        salesLabel: null,
        yoyPct: null,
        empty: true,
        missingPrior: true,
      }),
    ).toBe(OVERVIEW_ORDERS_EMPTY_LINE);
    expect(
      overviewOrderDeltaLabel({ yoyPct: 12.09, missingPrior: false }),
    ).toBe("↑ 12% vs last year");
    expect(OVERVIEW_FROM_ORDERS_LABEL).toBe("From orders");
    expect(OVERVIEW_CHART_CAPTION).toBe("Orders");
  });

  it("builds display-only day series and shifts the prior window one year", () => {
    const series = orderBookDaySeries([
      row({
        amount: 10,
        orderedAt: new Date("2026-09-10T12:00:00.000Z"),
        customerKey: "a",
        shopLocalDate: new Date("2026-09-10T00:00:00.000Z"),
      }),
      row({
        amount: 5,
        orderedAt: new Date("2026-09-10T18:00:00.000Z"),
        customerKey: "b",
        shopLocalDate: new Date("2026-09-10T00:00:00.000Z"),
      }),
    ]);
    expect(series).toEqual([{ dateKey: "2026-09-10", sales: 15, orders: 2 }]);
    const prior = shiftRangeOneYear(
      new Date("2026-09-01T00:00:00.000Z"),
      new Date("2026-09-23T23:59:59.000Z"),
    );
    expect(prior.start.getUTCFullYear()).toBe(2025);
    expect(prior.end.getUTCFullYear()).toBe(2025);
  });

  it("empty window stays empty — never a sealed $0 hero", () => {
    const hero = buildOverviewOrderBookHero({
      windowOrders: [],
      priorOrders: [],
      firstByCustomer: new Map(),
    });
    expect(hero).toMatchObject({
      sales: null,
      priorSales: null,
      yoyPct: null,
      empty: true,
      orderCount: 0,
    });
  });
});
