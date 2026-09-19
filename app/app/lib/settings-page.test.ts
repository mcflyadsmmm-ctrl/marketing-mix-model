import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const here = dirname(fileURLToPath(import.meta.url));
const settings = readFileSync(join(here, "../routes/app.settings.tsx"), "utf8");

describe("Settings page", () => {
  it("is plumbing — heading Settings, not an analysis tab", () => {
    expect(settings).toContain('heading={shotMode ? undefined : "Settings"}');
    expect(settings).not.toContain("SpendExplorer");
    expect(settings).toMatch(/not reports/);
  });

  it("names Spend Upload, not Marketing, as the spend next step", () => {
    expect(settings).toContain("Spend Upload");
    expect(settings).not.toContain("Marketing");
    expect(settings).toContain('href="/app/spend"');
    expect(settings).toContain('href="/app/roas"');
  });

  it("makes Sample vs Live and target Total ROAS obvious", () => {
    expect(settings).toMatch(/Sample data|Live data/);
    expect(settings).toContain("PRODUCT_NOUN.totalRoas");
    expect(settings).not.toMatch(/\baMER\b/);
    expect(settings).toContain("Snowdevil example numbers, not this shop");
    expect(settings).toContain("this shop’s Shopify orders");
  });

  it("keeps a visible support path next to Sample | Live", () => {
    expect(settings).toContain('aria-label="Support"');
    expect(settings).toContain("Need help?");
    expect(settings).toContain("mcflyadsmmm@gmail.com");
    expect(settings).toContain("Open Support");
    expect(settings).toContain("FLY_SUPPORT_URL");
    expect(settings).not.toContain("Learn more about");
  });

  it("Switch to Sample data posts on Settings with a native submit", () => {
    expect(settings).toContain("applySampleDeskIntent");
    expect(settings).toContain('name="intent" value="use-sample"');
    expect(settings).toContain('className="mcfly-btn mcfly-btn--primary"');
    expect(settings).toContain("Switch to Sample data now");
    expect(settings).not.toContain("dataModeAction");
  });

  it("types optional returning-$ only — LTV Target Line is the observed average", () => {
    expect(settings).toContain("Order-history targets");
    expect(settings).toContain('name="intent" value="save_habit_goals"');
    expect(settings).not.toContain('name="ltvTarget"');
    expect(settings).toContain('name="returningSalesTarget"');
    expect(settings).toContain("LTV Target Line is");
    expect(settings).toContain("observed average");
    expect(settings).toContain('href="/app/goals"');
    expect(settings).toContain("Snowdevil stretch");
    expect(settings).toContain("SAMPLE example");
    expect(settings).not.toContain("? String(SAMPLE_HABIT_RETURNING_TARGET)");
  });

  it("does not ask merchants for profit margin, COGS, or break-even", () => {
    expect(settings).not.toContain("Profit margin average");
    expect(settings).not.toMatch(/average COGS/i);
    expect(settings).not.toMatch(/Break-even preview/i);
    expect(settings).not.toMatch(/Reconfirm profit margin/);
    expect(settings).not.toMatch(/name="marginPct"/);
  });
});
