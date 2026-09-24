import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { confirmedBreakEvenMer } from "./mer-dashboard.server";
import {
  buildHabitGoals,
  habitGoalTargetSourceLabel,
  resolveHabitReturningTargetSource,
  resolveHabitTarget,
} from "./goals-habit";

const here = dirname(fileURLToPath(import.meta.url));

function read(rel: string): string {
  return readFileSync(join(here, rel), "utf8");
}

describe("Goals honesty — SAMPLE does not invent profit or an $800k stretch", () => {
  it("public /demo/goals mounts the Admin year-plan stack, not a profit-margin KPI", () => {
    const demoGoals = read("../routes/demo.goals.tsx");
    const adminGoals = read("../routes/app.goals.tsx");
    expect(adminGoals).toContain('name="targetMer"');
    expect(adminGoals).not.toContain("<OrderHistoryGoalsBoard");
    expect(demoGoals).toContain('name="targetMer"');
    expect(demoGoals).not.toMatch(/throw redirect/);
    expect(demoGoals).not.toMatch(/profit margin/i);
    expect(demoGoals).not.toContain("calculateBreakEvenMer");
    expect(demoGoals).not.toContain("breakEvenTotalRoas");
  });

  it("SAMPLE / useSampleDesk does not force break-even from 0.35", () => {
    const dashboard = read("./mer-dashboard.server.ts");
    const yearBoard = read("./sales-goals.server.ts");
    expect(dashboard).not.toMatch(
      /marginIsConfirmed\(settings\)\s*\|\|\s*useSampleDesk/,
    );
    expect(dashboard).not.toMatch(
      /useSampleDesk\s*\?\s*SAMPLE_DESK_MARGIN_PCT/,
    );
    expect(yearBoard).not.toMatch(
      /marginIsConfirmed\(settings\)\s*\|\|\s*settings\.useSampleDesk/,
    );
    expect(yearBoard).not.toMatch(
      /settings\.useSampleDesk\s*\?\s*SAMPLE_DESK_MARGIN_PCT/,
    );
    const spendImport = read("../routes/app.spend.import.tsx");
    expect(spendImport).not.toMatch(
      /sampleDesk\.enabled\s*\?\s*SAMPLE_DESK_MARGIN_PCT/,
    );
    expect(spendImport).not.toMatch(
      /useSampleDesk\s*\?\s*SAMPLE_DESK_MARGIN_PCT/,
    );
    expect(spendImport).toContain("confirmedBreakEvenMer");
    expect(
      confirmedBreakEvenMer({
        marginConfirmedAt: null,
        marginPct: 0.35,
      }),
    ).toBeNull();
    expect(
      confirmedBreakEvenMer({
        marginConfirmedAt: new Date("2026-01-15T00:00:00.000Z"),
        marginPct: 0.35,
      }),
    ).toBeCloseTo(1 / 0.35, 5);
  });

  it("SAMPLE with no typed returning target stays unset — not $800k progress", () => {
    expect(resolveHabitTarget(null, 800_000, true)).toBeNull();
    expect(resolveHabitReturningTargetSource(null, true)).toBeNull();
    expect(habitGoalTargetSourceLabel("sample")).not.toMatch(/stretch/i);
    const sample = buildHabitGoals({
      salesPending: false,
      orderCount: 40,
      ltv30: 145,
      ltv90: 380,
      ltv365: 820,
      yearReturningSales: 560_000,
      typedReturningTarget: null,
      historyLimited: false,
      sample: true,
      year: 2026,
    });
    expect(sample.returning).toBeNull();
    expect(sample.returningTarget).toBeNull();
    const live = buildHabitGoals({
      salesPending: false,
      orderCount: 40,
      ltv30: 145,
      ltv90: 380,
      ltv365: 820,
      yearReturningSales: 560_000,
      typedReturningTarget: null,
      historyLimited: false,
      sample: false,
      year: 2026,
    });
    expect(live.returning).toBeNull();
    expect(live.returningTarget).toBeNull();
    const board = read("../components/OrderHistoryGoalsBoard.tsx");
    const habit = read("./goals-habit.ts");
    const samplePage = read("./public-sample-page.server.ts");
    expect(habit).not.toMatch(
      /returningTarget = resolveHabitTarget\(\s*input\.typedReturningTarget,\s*SAMPLE_HABIT_RETURNING_TARGET/,
    );
    expect(board).not.toContain("SAMPLE_HABIT_RETURNING_TARGET");
    expect(samplePage).not.toContain("SAMPLE_HABIT_RETURNING_TARGET");
  });

  it("Customers LTV does not paint Kept after margin", () => {
    const ltv = read("../components/CustomersLtvSection.tsx");
    expect(ltv).not.toContain("Kept after margin");
    expect(ltv).not.toMatch(/showMarginKept = marginConfirmed \|\| useSampleDesk/);
  });

  it("public demo Settings does not print break-even at a profit margin", () => {
    const demoSettings = read("../routes/demo.settings.tsx");
    expect(demoSettings).not.toMatch(/break-even/i);
    expect(demoSettings).not.toMatch(/% margin/);
    expect(demoSettings).not.toContain("calculateBreakEvenMer");
  });

  it("Admin Settings still has no profit-margin field", () => {
    const settings = read("../routes/app.settings.tsx");
    expect(settings).not.toContain("Profit margin average");
    expect(settings).not.toMatch(/name="marginPct"/);
  });

  it("Spend mix and Goals gauges only mention break-even when BE is on file", () => {
    const mix = read("../components/SpendMixSection.tsx");
    const gauges = read("../components/SalesGoalGauges.tsx");
    expect(mix).toContain("input.breakEvenMer == null");
    expect(mix).toContain("Covering break-even.");
    expect(mix).toContain("Below break-even.");
    expect(gauges).toContain("breakEvenMer != null && breakEvenMer > 0");
    expect(gauges).toContain("vs ${PRODUCT_NOUN.breakEvenShort}");
  });
});
