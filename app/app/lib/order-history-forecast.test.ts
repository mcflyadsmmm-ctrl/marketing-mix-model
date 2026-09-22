import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { OrderHistoryForecast } from "../components/OrderHistoryForecast";
import { DeskCurrencyContext } from "./desk-currency";
import { P2A_ORDER_HISTORY_FORECAST_FIXTURE } from "./fixtures/p2-a-order-history-forecast";
import { FORECAST_MIN_DAYS } from "./overview-mix-forecast";
import {
  ORDER_HISTORY_FORECAST_FORMULA,
  ORDER_HISTORY_FORECAST_METHOD,
  ORDER_HISTORY_FORECAST_MIN_DAYS,
  buildOrderHistoryForecast,
  emptyForecastTargets,
  emptyOrderHistoryForecast,
  nextCalendarMonth,
  type OrderHistoryForecastTargetsInput,
} from "./order-history-forecast";

function days(values: number[]): number[] {
  return values;
}

function targets(
  extra: Partial<OrderHistoryForecastTargetsInput> = {},
): OrderHistoryForecastTargetsInput {
  return { ...emptyForecastTargets(), ...extra };
}

describe("P2-A order-history forecast fixture", () => {
  it("locks the formula, the method, and the missing-input dash", () => {
    expect(ORDER_HISTORY_FORECAST_FORMULA).toBe(
      P2A_ORDER_HISTORY_FORECAST_FIXTURE.label,
    );
    expect(ORDER_HISTORY_FORECAST_METHOD).toBe(
      P2A_ORDER_HISTORY_FORECAST_FIXTURE.method,
    );
    expect(P2A_ORDER_HISTORY_FORECAST_FIXTURE.missingDisplay).toBe("—");
    expect(P2A_ORDER_HISTORY_FORECAST_FIXTURE.missingMustNot).toBe("$0");
    expect(P2A_ORDER_HISTORY_FORECAST_FIXTURE.missingPercentMustNot).toBe("0%");
    expect(ORDER_HISTORY_FORECAST_MIN_DAYS).toBe(FORECAST_MIN_DAYS);
    expect(ORDER_HISTORY_FORECAST_MIN_DAYS).toBe(8);
  });
});

describe("next calendar month", () => {
  it("names the month after today, including a year roll and leap February", () => {
    expect(nextCalendarMonth(2026, 9)).toEqual({
      year: 2026,
      month: 10,
      days: 31,
      label: "October 2026",
    });
    expect(nextCalendarMonth(2026, 12)).toEqual({
      year: 2027,
      month: 1,
      days: 31,
      label: "January 2027",
    });
    expect(nextCalendarMonth(2024, 1).days).toBe(29);
    expect(nextCalendarMonth(2026, 1).days).toBe(28);
  });
});

describe("next month from the typical day", () => {
  const eight = days([100, 200, 300, 400, 500, 600, 700, 800]);

  it("is the whole-dollar median times the days in the next month", () => {
    const view = buildOrderHistoryForecast({
      salesPending: false,
      dailySales: eight,
      todayYear: 2026,
      todayMonth: 9,
      historyLimited: false,
      targets: targets(),
    });
    expect(view.typicalDay).toBe(450);
    expect(view.daysInPeriod).toBe(31);
    expect(view.estimate).toBe(450 * 31);
    expect(view.plug).toBe("450 × 31 = 13,950");
    expect(view.formula).toBe(ORDER_HISTORY_FORECAST_FORMULA);
    expect(view.method).toBe(ORDER_HISTORY_FORECAST_METHOD);
    expect(view.emptyCopy).toBeNull();
    expect(view.available).toBe(true);
  });

  it("counts selling days and still uses only days with sales", () => {
    const view = buildOrderHistoryForecast({
      salesPending: false,
      dailySales: [...eight, 0, 0, 0],
      todayYear: 2026,
      todayMonth: 9,
      historyLimited: false,
      targets: targets(),
    });
    expect(view.dayCount).toBe(8);
    expect(view.estimate).toBe(13_950);
    expect(view.daysLine).toMatch(/selling days/i);
    expect(view.method).toMatch(/selling days/i);
  });

  it("withholds next-month-from-today when the year picker is not the live year", () => {
    const view = buildOrderHistoryForecast({
      salesPending: false,
      dailySales: eight,
      todayYear: 2026,
      todayMonth: 9,
      bookYear: 2025,
      historyLimited: false,
      bookLabel: "2025 book",
      targets: targets(),
    });
    expect(view.available).toBe(false);
    expect(view.estimate).toBeNull();
    expect(view.plug).toBeNull();
    expect(view.periodLabel).not.toBe("October 2026");
    expect(view.emptyCopy).toMatch(/not the live year/i);
    expect(view.emptyCopy).toMatch(/not \$0/);
  });

  it("does not invent a fake $0 day where last year is missing", () => {
    const view = buildOrderHistoryForecast({
      salesPending: false,
      dailySales: [],
      todayYear: 2026,
      todayMonth: 9,
      bookYear: 2025,
      historyLimited: true,
      bookLabel: "2025 book",
      targets: targets(),
    });
    expect(view.estimate).toBeNull();
    expect(view.dayCount).toBe(0);
    expect(view.emptyCopy).toMatch(/not \$0/);
    expect(view.daysLine).not.toMatch(/\$0/);
  });

  it("withholds the number below 8 days — not $0", () => {
    const view = buildOrderHistoryForecast({
      salesPending: false,
      dailySales: [100, 200, 300],
      todayYear: 2026,
      todayMonth: 9,
      historyLimited: false,
      targets: targets(),
    });
    expect(view.estimate).toBeNull();
    expect(view.plug).toBeNull();
    expect(view.typicalDay).toBeNull();
    expect(view.emptyCopy).toMatch(/3 selling days/);
    expect(view.emptyCopy).toMatch(/not \$0/);
    expect(view.periodLabel).toBe("October 2026");
  });

  it("withholds a sub-dollar typical day instead of painting $0", () => {
    const view = buildOrderHistoryForecast({
      salesPending: false,
      dailySales: [0.2, 0.2, 0.2, 0.2, 0.2, 0.2, 0.2, 0.2],
      todayYear: 2026,
      todayMonth: 9,
      historyLimited: false,
      targets: targets(),
    });
    expect(view.estimate).toBeNull();
    expect(view.plug).toBeNull();
    expect(view.emptyCopy).toMatch(/under a dollar/);
    expect(view.emptyCopy).toMatch(/not \$0/);
  });

  it("withholds the number while sales are still loading", () => {
    const view = buildOrderHistoryForecast({
      salesPending: true,
      dailySales: eight,
      todayYear: 2026,
      todayMonth: 9,
      historyLimited: false,
      targets: targets(),
    });
    expect(view.estimate).toBeNull();
    expect(view.emptyCopy).toMatch(/still syncing/);
    expect(view.emptyCopy).toMatch(/not \$0/);
  });

  it("says the book is not a full year of pace when history is limited", () => {
    const view = buildOrderHistoryForecast({
      salesPending: false,
      dailySales: eight,
      todayYear: 2026,
      todayMonth: 9,
      historyLimited: true,
      targets: targets(),
    });
    expect(view.estimate).toBe(13_950);
    expect(view.method).toMatch(/not a full year of pace/);
    expect(view.daysLine).toMatch(/not a full year of pace/);
  });
});

describe("goals targets already on the book", () => {
  const base = {
    salesPending: false,
    dailySales: [100, 200, 300, 400, 500, 600, 700, 800],
    todayYear: 2026,
    todayMonth: 9,
    historyLimited: false,
  };

  it("paints sales and returning progress, and keeps LTV as an average line", () => {
    const view = buildOrderHistoryForecast({
      ...base,
      targets: targets({
        salesActual: 40_000,
        salesGoal: 80_000,
        returningActual: 200_000,
        returningTarget: 800_000,
        returningSource: "sample",
        ltvActual: 186,
        ltvWindow: "first 90 days",
      }),
    });
    const sales = view.targets.find((row) => row.kind === "sales");
    const returning = view.targets.find((row) => row.kind === "returning");
    const ltv = view.targets.find((row) => row.kind === "ltv");
    expect(sales?.pct).toBeCloseTo(0.5);
    expect(sales?.tone).toBe("down");
    expect(sales?.note).toMatch(/sales goal already/);
    expect(returning?.tone).toBe("down");
    expect(returning?.note).toMatch(/Snowdevil stretch/);
    expect(returning?.note).toMatch(/not a target you typed/);
    expect(ltv?.actual).toBe(186);
    expect(ltv?.pct).toBeNull();
    expect(ltv?.target).toBeNull();
    expect(ltv?.note).toMatch(/observed average/);
    expect(ltv?.note).toMatch(/first 90 days/);
  });

  it("leaves unset goals as a null percent, never 0", () => {
    const view = buildOrderHistoryForecast({
      ...base,
      targets: targets({
        salesActual: 40_000,
        salesGoal: 0,
        returningActual: null,
        returningTarget: null,
        ltvActual: null,
      }),
    });
    const sales = view.targets.find((row) => row.kind === "sales");
    const returning = view.targets.find((row) => row.kind === "returning");
    const ltv = view.targets.find((row) => row.kind === "ltv");
    expect(sales?.target).toBeNull();
    expect(sales?.pct).toBeNull();
    expect(sales?.tone).toBe("flat");
    expect(sales?.note).toMatch(/No sales goal typed/);
    expect(returning?.pct).toBeNull();
    expect(ltv?.pct).toBeNull();
    expect(ltv?.note).toMatch(/Not \$0/);
  });

  it("marks a met sales goal up, and a typed returning target as typed", () => {
    const view = buildOrderHistoryForecast({
      ...base,
      targets: targets({
        salesActual: 90_000,
        salesGoal: 80_000,
        returningActual: 10_000,
        returningTarget: 12_000,
        returningSource: "typed",
      }),
    });
    expect(view.targets.find((row) => row.kind === "sales")?.tone).toBe("up");
    expect(view.targets.find((row) => row.kind === "returning")?.note).toMatch(
      /you typed/,
    );
  });
});

describe("OrderHistoryForecast — blanks are a dash", () => {
  it("paints — on Overview and does not invent $0 or 0%", () => {
    const html = renderToStaticMarkup(
      createElement(
        DeskCurrencyContext.Provider,
        { value: "USD" },
        createElement(OrderHistoryForecast, {
          view: emptyOrderHistoryForecast(2026, 9),
          variant: "overview",
          goalsHref: "/demo/goals",
        }),
      ),
    );
    expect(html).toContain("Order-history forecast");
    expect(html).toContain(ORDER_HISTORY_FORECAST_FORMULA);
    expect(html).toContain(ORDER_HISTORY_FORECAST_METHOD);
    expect(html).toContain('data-estimate="missing"');
    expect(html).toMatch(/data-estimate="missing"[^>]*>\s*—\s*</);
    expect(html).toContain('data-plug="missing"');
    expect(html).toContain("October 2026");
    expect(html).toContain("/demo/goals");
    expect(html).toContain("No spend required");
    expect(html).not.toContain(">$0<");
    expect(html).not.toContain("0%");
    expect(html).not.toContain("0.00×");
  });

  it("paints Goals rows as — when sales, returning, and LTV are unset", () => {
    const html = renderToStaticMarkup(
      createElement(
        DeskCurrencyContext.Provider,
        { value: "USD" },
        createElement(OrderHistoryForecast, {
          view: emptyOrderHistoryForecast(2026, 9),
          variant: "goals",
        }),
      ),
    );
    expect(html).toContain("This month sales");
    expect(html).toContain("Returning $");
    expect(html).toContain("New-buyer worth");
    expect(html).toContain('data-pct="missing"');
    expect(html).not.toContain("0%");
    expect(html).not.toContain(">$0<");
    expect(html).toContain("Not $0.");
  });

  it("writes the plugged product and a grey-down class when behind a goal", () => {
    const view = buildOrderHistoryForecast({
      salesPending: false,
      dailySales: [100, 200, 300, 400, 500, 600, 700, 800],
      todayYear: 2026,
      todayMonth: 9,
      historyLimited: false,
      targets: targets({
        salesActual: 10,
        salesGoal: 100,
        returningSource: "typed",
        returningActual: 10,
        returningTarget: 100,
      }),
    });
    const html = renderToStaticMarkup(
      createElement(
        DeskCurrencyContext.Provider,
        { value: "USD" },
        createElement(OrderHistoryForecast, { view, variant: "goals" }),
      ),
    );
    expect(html).toContain("450 × 31 = 13,950");
    expect(html).toContain('data-estimate="set"');
    expect(html).toContain("$13,950");
    expect(html).toContain("mcfly-oh-forecast__delta--down");
    expect(html).toContain(">10%<");
    expect(html).not.toContain("mcfly-oh-forecast__delta--lie");
    expect(html).not.toContain(">0%<");
  });
});
