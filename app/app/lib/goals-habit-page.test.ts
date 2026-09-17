import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const here = dirname(fileURLToPath(import.meta.url));

function read(rel: string): string {
  return readFileSync(join(here, rel), "utf8");
}

const goals = read("../routes/app.goals.tsx");
const settings = read("../routes/app.settings.tsx");
const board = read("../components/OrderHistoryGoalsBoard.tsx");
const lib = read("./goals-habit.ts");
const css = read("../styles/mcfly-desk.css");
const nav = read("./desk-nav.ts");

describe("Order-history Goals — habit, not a dump", () => {
  it("sits on the existing Goals surface above the sales-plan hero", () => {
    const order = [
      "<OrderHistoryGoalsBoard",
      "mcfly-goals-hero--soft",
      "<SalesGoalGauges",
    ].map((tag) => goals.indexOf(tag));
    expect(order.every((i) => i > -1)).toBe(true);
    for (let i = 1; i < order.length; i += 1) {
      expect(order[i]!).toBeGreaterThan(order[i - 1]!);
    }
    expect(goals).toContain("buildHabitGoals");
    expect(goals).toContain("save_habit_goals");
    expect(goals).toContain("yearReturningSales");
    expect(goals).toContain("avgRevenueD90");
  });

  it("lets Settings type the same two targets without a new sales-five tab", () => {
    expect(settings).toContain("save_habit_goals");
    expect(settings).toContain("ltvTarget");
    expect(settings).toContain("returningSalesTarget");
    expect(settings).toContain("Order-history targets");
    expect(settings).toContain('href="/app/goals"');
    expect(nav).toContain('{ path: "/app/goals", label: "Goals" }');
    expect(nav).toContain('{ path: "/app/ltv", label: "LTV" }');
    expect(goals).not.toContain('href="/app/habit"');
  });

  it("keeps the sales-plan gauges, year control, and spend-six Goals job", () => {
    expect(goals).toContain('aria-label="Plan year"');
    expect(goals).toContain("SalesGoalGauges");
    expect(goals).toContain("MTD · QTD · YTD");
    expect(goals).toContain("GOALS_ANALYTICS_LEDE");
  });

  it("paints Today’s read, two ActionCards, and the written-out formulas", () => {
    expect(board).toContain("Today’s read");
    expect(board).toContain("New-buyer worth");
    expect(board).toContain("Returning $");
    expect(board).toContain("mcfly-cust-kpi--action");
    expect(board.match(/<ActionCard[\s\n]/g)?.length).toBe(2);
    expect(board).toContain("mcfly-depth-formula__parts");
    expect(lib).toContain("LTV progress = observed first-window $ ÷ your target");
    expect(lib).toContain("Returning $ progress = year returning $ ÷ your target");
  });

  it("uses an ActionCard-shaped empty with the 8-order floor", () => {
    expect(board).toContain("First win");
    expect(board).toContain("empty.verb");
    expect(board).toContain("Floor:");
    expect(board).toContain("not $0");
    expect(board).toContain("mcfly-cust-empty__ghost--bars");
    expect(lib).toContain("HABIT_GOALS_MIN_ORDERS = 8");
    expect(lib).toContain("never a fake year");
    expect(css).toContain(".mcfly-habit-goals__read");
    expect(css).toContain(".mcfly-habit-goals__track");
  });

  it("is full-history aware and withholds a fake year", () => {
    expect(lib).toContain("historyLimited");
    expect(lib).toContain("not a full year");
    expect(lib).toContain("never a fake first-year");
    expect(goals).toContain("historyLimited");
    expect(board).toContain("habitGoalsHistoryLine");
  });

  it("is zero spend, zero ROAS on the new board — order history only", () => {
    for (const source of [board, lib]) {
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
    expect(lib).not.toMatch(/\bCPA\b/);
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
