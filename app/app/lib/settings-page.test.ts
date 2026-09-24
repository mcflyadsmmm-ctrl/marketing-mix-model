import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const here = dirname(fileURLToPath(import.meta.url));
const settings = readFileSync(join(here, "../routes/app.settings.tsx"), "utf8");
const demoSettings = readFileSync(
  join(here, "../routes/demo.settings.tsx"),
  "utf8",
);
const entitlements = readFileSync(join(here, "./entitlements.ts"), "utf8");

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

  it("is Live shop only — no Sample | Live merchant toggle", () => {
    expect(settings).toContain("PRODUCT_NOUN.totalRoas");
    expect(settings).not.toMatch(/\baMER\b/);
    expect(settings).not.toContain("Sample | Live");
    expect(settings).not.toContain("Switch to Sample data now");
    expect(settings).not.toContain("Switch to Live data now");
    expect(settings).not.toContain('name="intent" value="use-sample"');
    expect(settings).not.toContain('name="intent" value="use-real"');
    expect(settings).not.toContain("hide-sample-preview");
    expect(settings).toContain("this shop’s Shopify orders");
  });

  it("keeps a visible support path", () => {
    expect(settings).toContain('aria-label="Support"');
    expect(settings).toContain("Need help?");
    expect(settings).toContain("mcflyadsmmm@gmail.com");
    expect(settings).toContain("Open Support");
    expect(settings).toContain("FLY_SUPPORT_URL");
    expect(settings).not.toContain("Learn more about");
  });

  it("keeps sample intent handler for no-ops, without merchant Sample CTAs", () => {
    expect(settings).toContain("applySampleDeskIntent");
    expect(settings).toContain("isSampleDeskIntent");
    expect(settings).not.toContain("Switch to Sample data now");
    expect(settings).not.toContain("dataModeAction");
  });

  it("does not ask for a target — that field lives on Goals", () => {
    expect(settings).toContain("The one target lives on Goals");
    expect(settings).not.toContain('name="intent" value="save_habit_goals"');
    expect(settings).not.toContain('name="targetMer"');
    expect(settings).not.toContain('name="returningSalesTarget"');
    expect(settings).not.toContain("Order-history targets");
    expect(settings).not.toContain("Snowdevil stretch");
    expect(settings).not.toContain("SAMPLE_HABIT_RETURNING_TARGET");
  });

  it("does not ask merchants for profit margin, COGS, or break-even", () => {
    expect(settings).not.toContain("Profit margin average");
    expect(settings).not.toMatch(/average COGS/i);
    expect(settings).not.toMatch(/Break-even preview/i);
    expect(settings).not.toMatch(/Reconfirm profit margin/);
    expect(settings).not.toMatch(/name="marginPct"/);
  });

  it("plan block names one 24-month desk, $39 after 7 days, one plan", () => {
    expect(settings).toContain("TRIAL_VS_VIEW");
    expect(settings).toContain("BILLING_HONESTY.flat");
    expect(settings).toContain("aria-label=\"Your plan\"");
    expect(settings).not.toMatch(/full-access/);
    expect(settings).toMatch(/7 days, then \$39/);
    expect(settings).toMatch(/Trial and paid both keep the full desk/);
    expect(settings).toMatch(/24 months/);
    expect(settings).not.toContain("UnlockFullHistoryBanner");
    expect(entitlements).not.toMatch(/full-access/);
    expect(entitlements).toMatch(/Trial and paid keep/);
    expect(entitlements).toMatch(/24 months/);
    expect(entitlements).toMatch(/\$39/);
    expect(entitlements).toMatch(/7-day trial/);
  });

  it("public /demo/settings says SAMPLE matches the live 24-month book", () => {
    expect(demoSettings).toContain('orderBookDepth="paid_full"');
    expect(demoSettings).toMatch(/up to 24 months/);
    expect(demoSettings).toMatch(/Trial and paid both keep/);
    expect(demoSettings).toMatch(/full desk/);
    expect(demoSettings).toMatch(/\$39/);
    expect(demoSettings).not.toMatch(/full-access/);
    expect(demoSettings).not.toContain("UnlockFullHistoryBanner");
  });
});
