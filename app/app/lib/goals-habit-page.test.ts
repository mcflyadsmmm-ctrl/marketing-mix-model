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
  it("T1 retires Goals tab — /app/goals redirects to Settings; habit board stays in components", () => {
    expect(goals).toContain('redirect(`/app/settings');
    expect(goals).toContain("GoalsRedirect");
    expect(board).toContain("Today’s read");
    expect(lib).toContain("buildHabitGoals");
    expect(lib).toContain("yearReturningSales");
    expect(settings).toContain("save_habit_goals");
  });

  it("lets Settings type returning-$ only — LTV Target Line is the average", () => {
    expect(settings).toContain("save_habit_goals");
    expect(settings).toContain("returningSalesTarget");
    expect(settings).toContain("Order-history targets");
    expect(settings).toContain("LTV Target Line is");
    expect(settings).toContain("observed average");
    expect(settings).not.toContain('href="/app/goals"');
    expect(settings).not.toContain('name="ltvTarget"');
    expect(nav).not.toContain('{ path: "/app/goals", label: "Goals" }');
    expect(nav).toContain('{ path: "/app/customers", label: "Customers" }');
    expect(nav).toContain('{ path: "/app", label: "Home" }');
    expect(nav).not.toContain('{ path: "/app/ltv", label: "LTV" }');
    expect(board).toContain('"/app/customers?panel=ltv"');
    expect(goals).not.toContain('href="/app/habit"');
    expect(goals).not.toContain('name="ltvTarget"');
    expect(board).not.toContain('name="ltvTarget"');
    expect(board).toContain("Target Line from average");
    expect(board).toContain("Save returning-$ target");
    expect(board).not.toContain("First-window LTV target");
  });

  it("keeps habit board + Settings as the Goals job after T1 redirect", () => {
    expect(board).toContain("Today’s read");
    expect(settings).toContain("Order-history targets");
    expect(goals).toContain("/app/settings");
  });

  it("paints Today’s read, two ActionCards, and the written-out formulas", () => {
    expect(board).toContain("Today’s read");
    expect(board).toContain("New-buyer worth");
    expect(board).toContain("Returning $");
    expect(board).toContain("mcfly-cust-kpi--action");
    expect(board.match(/<ActionCard[\s\n]/g)?.length).toBe(2);
    expect(board).toContain("mcfly-depth-formula__parts");
    expect(lib).toContain("Target Line = observed first-window average");
    expect(lib).toContain("Returning $ progress = year returning $ ÷ your target");
    expect(board).not.toContain("SAMPLE_HABIT_RETURNING_TARGET");
    expect(board).not.toContain("Canvas uses Snowdevil stretch");
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
    expect(css).toContain(".mcfly-habit-goals__target-line");
    expect(css).toContain(".mcfly-chart__target-line");
  });

  it("is full-history aware and withholds a fake year", () => {
    expect(lib).toContain("historyLimited");
    expect(lib).toContain("not a full year");
    expect(lib).toContain("never a fake first-year");
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
