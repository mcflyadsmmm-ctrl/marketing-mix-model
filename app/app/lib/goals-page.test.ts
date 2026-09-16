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
});
