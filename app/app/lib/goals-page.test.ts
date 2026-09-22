import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const here = dirname(fileURLToPath(import.meta.url));
const goals = readFileSync(join(here, "../routes/app.goals.tsx"), "utf8");

describe("Goals page", () => {
  it("contrasts Shopify Analytics this-period sales with plan vs actual", () => {
    expect(goals).toContain("Shopify Analytics shows");
    expect(goals).toContain("This page shows");
    expect(goals).toMatch(/this period['’]s sales/i);
    expect(goals).toMatch(/plan vs actual/i);
    expect(goals).toMatch(/MTD\/QTD\/YTD|MTD · QTD · YTD/);
  });

  it("keeps year control and MTD/QTD/YTD gauges, with no SpendExplorer", () => {
    expect(goals).toContain('aria-label="Plan year"');
    expect(goals).toContain("SalesGoalGauges");
    expect(goals).toContain("MTD · QTD · YTD");
    expect(goals).not.toContain("SpendExplorer");
  });

  it("pending sales hero is an em dash, never a painted $0", () => {
    expect(goals).toContain("periodMetrics.salesPending");
    expect(goals).toContain("Still loading — not $0");
  });

  it("year-board Actual / Prior use a dash helper, not raw $0 for missing months", () => {
    expect(goals).toContain("formatSalesOrDash(row.actual, currency)");
    expect(goals).toContain("formatSalesOrDash(priorActual, currency)");
    expect(goals).toContain("formatSalesOrDash(prior, currency)");
    expect(goals).toContain("Missing months are not $0");
    expect(goals).not.toContain("formatCurrency(row.actual)");
  });

  it("stacks this month Goal / Actual / Prior so a phone does not swipe a 720px table", () => {
    expect(goals).toContain("mcfly-goals-month-stack");
    expect(goals).toContain("ThisMonthPlanStack");
    expect(goals).toContain("versus the plan");
    expect(goals).toContain("showGoal && row.salesGoal > 0");
    expect(goals).toContain("formatSalesOrDash(row.actual, currency)");
    expect(goals).toContain("formatSalesOrDash(prior, currency)");
  });

  it("sales-load banner does not leak internals or paint actuals as $0", () => {
    const retryAt = goals.indexOf("<SalesLoadError");
    expect(retryAt).toBeGreaterThan(-1);
    const retry = goals.slice(retryAt, retryAt + 280);
    expect(retry).toContain("Actuals stay —");
    expect(retry).not.toContain("{salesError}");
    expect(retry).not.toContain("stay $0");
    expect(goals).toContain("TRIAL_VS_VIEW");
  });

  it("points spend CTAs at Spend Upload, not Marketing, and Settings for target ROAS", () => {
    expect(goals).toContain('href="/app/settings"');
    expect(goals).not.toMatch(/add spend on Marketing/i);
    expect(goals).not.toMatch(/\bon Marketing\b/);
    if (/add spend/i.test(goals)) {
      expect(goals).toContain("Spend Upload");
    }
  });

  it("adds LTV + returning-$ order-history targets above the sales plan", () => {
    expect(goals).toContain("OrderHistoryGoalsBoard");
    expect(goals).toContain("buildHabitGoals");
    expect(goals).toContain("save_habit_goals");
    expect(goals.indexOf("<OrderHistoryGoalsBoard")).toBeLessThan(
      goals.indexOf("mcfly-goals-hero--soft"),
    );
  });

  it("keeps the monthly 12-month board collapsed until expand", () => {
    expect(goals).toContain(
      '<details className="mcfly-details mcfly-goals-plan-details mcfly-goals-plan-details--soft">',
    );
    expect(goals).not.toMatch(
      /<details\s+open\b[^>]*mcfly-goals-plan-details/,
    );
    expect(goals).toContain("Monthly board · fine-tune");
    expect(goals).toContain('aria-label="Monthly plan"');
    expect(goals).toContain("Show 12-month sales plan");
  });
});
