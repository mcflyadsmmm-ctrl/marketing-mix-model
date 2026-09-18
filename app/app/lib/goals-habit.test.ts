import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { OrderHistoryGoalsBoard } from "../components/OrderHistoryGoalsBoard";
import { DeskCurrencyContext } from "./desk-currency";
import {
  HABIT_GOALS_MIN_ORDERS,
  HABIT_LTV_FORMULA_EQ,
  HABIT_RETURNING_FORMULA_EQ,
  SAMPLE_HABIT_RETURNING_TARGET,
  buildHabitGoals,
  emptyHabitGoals,
  habitGoalsDailyRead,
  habitGoalsEmptyState,
  habitGoalsHistoryLine,
  habitLtvWindowLabel,
  parseHabitGoalInput,
  resolveHabitTarget,
} from "./goals-habit";

function richInput(
  extra: Partial<Parameters<typeof buildHabitGoals>[0]> = {},
) {
  return buildHabitGoals({
    salesPending: false,
    orderCount: 40,
    ltv30: 145,
    ltv90: 380,
    ltv365: 820,
    yearReturningSales: 560_000,
    typedReturningTarget: 800_000,
    historyLimited: false,
    sample: true,
    year: 2026,
    ...extra,
  });
}

describe("habit goal floors + SAMPLE stretch", () => {
  it("names the 8-order floor and Snowdevil returning stretch", () => {
    expect(HABIT_GOALS_MIN_ORDERS).toBe(8);
    expect(SAMPLE_HABIT_RETURNING_TARGET).toBe(800_000);
  });
});

describe("resolveHabitTarget", () => {
  it("lets a typed returning-$ target win, and SAMPLE paints when unset", () => {
    expect(resolveHabitTarget(420, SAMPLE_HABIT_RETURNING_TARGET, true)).toBe(
      420,
    );
    expect(resolveHabitTarget(null, SAMPLE_HABIT_RETURNING_TARGET, true)).toBe(
      800_000,
    );
    expect(resolveHabitTarget(null, SAMPLE_HABIT_RETURNING_TARGET, false)).toBeNull();
    expect(resolveHabitTarget(0, SAMPLE_HABIT_RETURNING_TARGET, false)).toBeNull();
  });
});

describe("parseHabitGoalInput", () => {
  it("treats blank / $0 as unset and rejects junk", () => {
    expect(parseHabitGoalInput("")).toBeNull();
    expect(parseHabitGoalInput("  ")).toBeNull();
    expect(parseHabitGoalInput("0")).toBeNull();
    expect(parseHabitGoalInput("$400")).toBe(400);
    expect(parseHabitGoalInput("800,000")).toBe(800_000);
    expect(Number.isNaN(parseHabitGoalInput("-12"))).toBe(true);
    expect(Number.isNaN(parseHabitGoalInput("nope"))).toBe(true);
  });
});

describe("habitLtvWindowLabel", () => {
  it("writes shop-owner windows", () => {
    expect(habitLtvWindowLabel(30)).toBe("first 30 days");
    expect(habitLtvWindowLabel(90)).toBe("first 90 days");
    expect(habitLtvWindowLabel(365)).toBe("first year");
  });
});

describe("buildHabitGoals — LTV Target Line is the observed average", () => {
  it("uses first-window average as the LTV Target Line, not a typed goal", () => {
    const view = richInput();
    expect(view.available).toBe(true);
    expect(view.empty).toBeNull();
    expect(view.ltv?.actual).toBe(380);
    expect(view.ltv?.target).toBe(380);
    expect(view.ltv?.targetSource).toBe("average");
    expect(view.ltv?.remaining).toBe(0);
    expect(view.ltv?.met).toBe(true);
    expect(view.ltv?.pct).toBe(1);
    expect(view.ltv?.formulaEq).toBe(HABIT_LTV_FORMULA_EQ);
    expect(view.ltv?.formulaPlug).toContain("380");
    expect(view.ltv?.formulaPlug).toMatch(/Target Line from average/);
    expect(view.ltv?.windowLabel).toBe("first 90 days");
    expect(view.returning?.actual).toBe(560_000);
    expect(view.returning?.target).toBe(800_000);
    expect(view.returning?.targetSource).toBe("typed");
    expect(view.returning?.formulaEq).toBe(HABIT_RETURNING_FORMULA_EQ);
    expect(view.returning?.windowLabel).toBe("2026 returning $");
  });

  it("prefers first 90 days, falls back to 30, never a fake year", () => {
    const thirty = richInput({ ltv90: null, ltv365: 820 });
    expect(thirty.ltv?.actual).toBe(145);
    expect(thirty.ltv?.target).toBe(145);
    expect(thirty.ltv?.windowLabel).toBe("first 30 days");

    const limited = richInput({
      ltv30: null,
      ltv90: null,
      ltv365: 820,
      historyLimited: true,
    });
    expect(limited.ltv).toBeNull();
    expect(limited.returning).not.toBeNull();
  });

  it("never invents returning $ from a zero share", () => {
    const view = richInput({ yearReturningSales: 0 });
    expect(view.returning).toBeNull();
    expect(view.ltv).not.toBeNull();
  });

  it("marks a beaten returning-$ target without inventing extra dollars", () => {
    const view = richInput({ ltv90: 420, yearReturningSales: 810_000 });
    expect(view.ltv?.target).toBe(420);
    expect(view.ltv?.targetSource).toBe("average");
    expect(view.returning?.met).toBe(true);
  });
});

describe("habitGoalsEmptyState — first-win, not $0", () => {
  it("stays an ActionCard-shaped empty below the floor", () => {
    const syncing = habitGoalsEmptyState(0, 0, true, false);
    expect(syncing?.kind).toBe("syncing");
    expect(syncing?.verb).toMatch(/Refresh/i);
    expect(syncing?.copy).toMatch(/not \$0/);

    const thin = habitGoalsEmptyState(3, 0, false, false);
    expect(thin?.kind).toBe("thin");
    expect(thin?.need).toBe(8);
    expect(thin?.copy).toMatch(/3 orders/);
    expect(thin?.copy).toMatch(/not \$0/);

    const unset = habitGoalsEmptyState(40, 0, false, false);
    expect(unset?.kind).toBe("unset");
    expect(unset?.verb).toMatch(/returning-\$ target/i);

    const young = habitGoalsEmptyState(40, 0, false, true);
    expect(young?.kind).toBe("young");
    expect(young?.copy).toMatch(/identified buyers/);
    expect(young?.copy).toMatch(/not \$0/);
  });

  it("paints LTV from the average without a typed target — SAMPLE returning still overlays", () => {
    const sample = richInput({
      typedReturningTarget: null,
      sample: true,
    });
    expect(sample.available).toBe(true);
    expect(sample.ltv?.target).toBe(380);
    expect(sample.ltv?.targetSource).toBe("average");
    expect(sample.returning?.target).toBe(SAMPLE_HABIT_RETURNING_TARGET);

    const live = richInput({
      typedReturningTarget: null,
      sample: false,
    });
    expect(live.available).toBe(true);
    expect(live.ltv?.target).toBe(380);
    expect(live.ltv?.targetSource).toBe("average");
    expect(live.returning).toBeNull();
  });

  it("live with no LTV peek and no returning target stays an unset empty", () => {
    const live = richInput({
      ltv30: null,
      ltv90: null,
      ltv365: null,
      yearReturningSales: null,
      typedReturningTarget: null,
      sample: false,
    });
    expect(live.available).toBe(false);
    expect(live.empty?.kind).toBe("unset");
    expect(live.ltv).toBeNull();
    expect(live.returning).toBeNull();
  });
});

describe("habitGoalsDailyRead + history line", () => {
  it("reads LTV Target Line first, then returning $", () => {
    const read = habitGoalsDailyRead(richInput());
    expect(read?.line).toMatch(/first 90 days/);
    expect(read?.line).toMatch(/380/);
    expect(read?.line).toMatch(/Target Line is that average/);
    expect(read?.line).not.toMatch(/400/);
    expect(read?.line).toMatch(/Returning buyers/);
    expect(read?.ltvPct).toBe(1);
    expect(read?.returningPct).toBeCloseTo(560_000 / 800_000, 5);
  });

  it("withholds a fake year on a limited book", () => {
    const view = richInput({ historyLimited: true });
    expect(habitGoalsHistoryLine(view)).toMatch(/not a full year/);
    expect(habitGoalsHistoryLine(view)).toMatch(/never a fake first-year/);
    expect(view.returning?.windowLabel).toMatch(/not a full year/);
  });
});

describe("OrderHistoryGoalsBoard — empty is ActionCard-shaped", () => {
  it("paints an ActionCard-shaped empty, not a blank or $0 card", () => {
    const html = renderToStaticMarkup(
      createElement(
        DeskCurrencyContext.Provider,
        { value: "USD" },
        createElement(OrderHistoryGoalsBoard, {
          view: emptyHabitGoals(2026),
          year: 2026,
        }),
      ),
    );
    expect(html).toContain("First win");
    expect(html).toContain("Refresh this page");
    expect(html).toContain("not $0");
    expect(html).toContain("Floor:");
    expect(html).not.toContain(">$0<");
    expect(html).not.toContain("0.00×");
    expect(html).not.toContain('name="ltvTarget"');
  });

  it("writes the formula when both tracks seal", () => {
    const view = richInput();
    const read = habitGoalsDailyRead(view);
    expect(read?.line).toMatch(/first 90 days/);
    expect(view.ltv?.formulaEq).toBe(HABIT_LTV_FORMULA_EQ);
    expect(view.returning?.formulaEq).toBe(HABIT_RETURNING_FORMULA_EQ);
    expect(view.ltv?.formulaPlug).toContain("380");
    expect(view.returning?.formulaPlug).toContain("560");
  });

  it("labels Target Line from average and keeps only the returning-$ field", () => {
    const view = richInput();
    expect(view.ltv?.formulaEq).toBe("Target Line = observed first-window average");
    expect(view.ltv?.formulaPlug).toMatch(/Target Line from average/);
    expect(view.ltv?.targetSource).toBe("average");
    expect(view.returning?.targetSource).toBe("typed");
  });
});
