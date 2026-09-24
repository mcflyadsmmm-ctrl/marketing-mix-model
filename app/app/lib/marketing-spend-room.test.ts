import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const here = dirname(fileURLToPath(import.meta.url));

function read(rel: string) {
  return readFileSync(join(here, rel), "utf8");
}

describe("Marketing spend room", () => {
  const spend = read("../routes/app.spend.tsx");
  const room = read("../components/MarketingSpendRoom.tsx");
  const mix = read("../components/SpendMixSection.tsx");

  it("mounts analysis rooms on Spend, not a separate ROAS page", () => {
    expect(spend).toContain("<MarketingSpendRoom");
    expect(spend).toContain('from "../components/MarketingSpendRoom"');
    expect(spend).toContain("<SpendExplorer");
    expect(spend).toContain("<DualCloseLine");
    expect(spend).toContain("<CertifiedScoreboard");
    expect(spend).toContain("<MonthlyPacing");
    expect(spend).not.toContain("<MarketingSnapSection");
    expect(spend).not.toContain('from "../components/MarketingSnapSection"');
  });

  it("builds the spend analysis board on the Spend route", () => {
    expect(spend).toContain("loadSpendAnalysis");
    expect(spend).toContain("cashControl");
  });

  it("shows mix vs last month, a plan, a collapsed Every day ledger, and operating intel", () => {
    const mixPlan = read("../components/SpendMixPlan.tsx");

    expect(room).not.toContain("MIX_WINDOWS");
    expect(room).toContain("Every day");
    expect(room).toContain("<details");
    expect(room).toContain('className="mcfly-spend-room__ledger"');
    expect(room).toContain("mcfly-spend-room__intel");
    expect(room).toContain("Last 28 days");
    expect(room).toContain("vs prior window");
    expect(room).toContain("mcfly-spend-room__compare");
    expect(room).toContain("Same calendar days so far");
    expect(room).toContain("Vs last year");
    expect(mixPlan).toContain("vs last month");
    expect(mixPlan).toContain("Spend left at goal");
    expect(mixPlan).toContain("Daily spend cap");
    expect(mixPlan).toContain("This month");
    expect(mixPlan).toContain("Last 7 days");
    expect(mixPlan).toContain("This quarter");
    expect(mixPlan).toContain("full last month");
    expect(mix).toContain("<SpendMixPlan");
  });

  it("bans glossary labels on the spend room", () => {
    expect(room).not.toMatch(/\baMER\b/);
    expect(room).not.toMatch(/\btill\b/);
    expect(room).not.toMatch(/\bMonday\b/);
    expect(room).not.toMatch(/\bcohort\b/);
    expect(room).not.toMatch(/\bARPU\b/);
    expect(room).not.toMatch(/\bMTD\b/);
    expect(room).not.toMatch(/\bQTD\b/);
    expect(room).not.toMatch(/\bYTD\b/);
    expect(room).not.toMatch(/\bL7\b/);
    expect(room).not.toMatch(/\bYoY\b/);
  });

  it("never prints 0.00× for empty spend — empty MER cells are an em dash", () => {
    expect(room).not.toContain("0.00×");
    expect(room).toContain("formatMer");
    expect(room).toContain('return "—";');
    expect(room).toMatch(/!\(spend > 0\) \|\| mer == null/);
    expect(spend).not.toContain("0.00×");
  });

  it("does not remount the Overview control board or desk rail", () => {
    expect(spend).not.toContain("<CashControlBoard");
    expect(spend).not.toContain('from "../components/CashControlBoard"');
    expect(spend).not.toContain("DeskWindowRail");
    expect(room).not.toContain("DeskWindowRail");
    expect(room).not.toContain("DESK_SECTION");
    expect(room).not.toContain("CashControlBoard.tsx");
  });

  it("mounts full spend room on Spend with certified chips", () => {
    const viewport = read("../components/SpendFirstViewport.tsx");
    expect(spend).toContain("<MarketingSpendRoom");
    expect(spend).toContain("<CertifiedScoreboard");
    expect(viewport).toContain('placement="firstFold"');
    expect(spend).toContain("cashChips=");
    expect(spend).not.toContain("intelOnly");
    expect(room).toContain("intelOnly = false");
  });
});

describe("Spend MER desk", () => {
  const spend = read("../routes/app.spend.tsx");
  const viewport = read("../components/SpendFirstViewport.tsx");
  const mix = read("../components/SpendMixSection.tsx");
  const roas = read("../routes/app.roas.tsx");
  const allocation = read("../routes/app.allocation.tsx");
  const cpa = read("../routes/app.cpa.tsx");

  it("contrasts Shopify Analytics vs sales÷typed spend, not platform ROAS", () => {
    const viewport = read("../components/SpendFirstViewport.tsx");
    expect(spend).toContain("SPEND_ANALYTICS_CONTRAST");
    expect(viewport).toContain("HONEST_MER_LINE");
    expect(spend).toContain("SpendFindingStrip");
    expect(spend).toContain("spendUploadEmptyFinding");
    expect(spend).toMatch(/never 0×/);
  });

  it("pending sales KPI is an em dash, never a painted $0", () => {
    expect(spend).toContain("metrics.salesPending");
    expect(viewport).toContain('salesPending ? "—"');
    expect(spend).toContain("SpendFirstViewport");
  });

  it("owns the explorer, dual-close, certified chips, and spend-only pacing", () => {
    expect(spend).toContain("<SpendExplorer");
    expect(spend).toContain('basePath="/app/spend"');
    expect(spend).toContain("<DualCloseLine");
    expect(spend).toContain("<CertifiedScoreboard");
    expect(spend).toContain("<MonthlyPacing");
    expect(spend).toMatch(/monthPace && cashControl && hasSpend/);
  });

  it("mounts compare, mix pie, and CPA on the Spend spine", () => {
    expect(spend).toContain("<MarketingSpendRoom");
    expect(spend).toContain("<SpendMixSection");
    expect(spend).toContain("<CpaWindowCards");
    expect(spend).toContain("<CpaPaybackDesk");
    expect(spend).toContain("<CpaExplorer");
    expect(spend).toContain("<SpendFirstViewport");
    expect(spend).toContain('id="mcfly-explorer"');
    expect(mix).toContain('id="mcfly-mix"');
    expect(spend).toContain('id="mcfly-cpa"');
    expect(spend).toContain('id="mcfly-spend-add"');
  });

  it("empty Total ROAS is an em dash, never 0.00×, with an add-a-day link", () => {
    expect(spend).toContain('? `${formatMer(paintedMer)}×`');
    expect(spend).toContain(': "—"');
    expect(spend).not.toContain("0.00×");
    expect(spend).toContain('href="#mcfly-spend-add"');
  });

  it("keeps upload forms after analysis and does not mount 12-month goals", () => {
    const viewport = read("../components/SpendFirstViewport.tsx");
    const roasAt = viewport.indexOf('id="mcfly-roas"');
    const addAt = spend.indexOf('id="mcfly-spend-add"');
    expect(roasAt).toBeGreaterThan(-1);
    expect(addAt).toBeGreaterThan(roasAt);
    expect(spend).not.toContain("SalesGoalGauges");
    expect(spend).not.toContain("12-month");
  });

  it("converts roas, allocation, and cpa routes to Spend panel redirects", () => {
    expect(roas).toContain('spendPanelRedirectPath(request.url, "roas"');
    expect(roas).toContain("requireAdmin");
    expect(roas).not.toContain("<SpendExplorer");
    expect(allocation).toContain('spendPanelRedirectPath(request.url, "mix"');
    expect(allocation).toContain("requireAdmin");
    expect(allocation).not.toContain("<SpendMixPlan");
    expect(cpa).toContain('spendPanelRedirectPath(request.url, "cpa"');
    expect(cpa).toContain("requireAdmin");
    expect(cpa).not.toContain("<CpaWindowCards");
    expect(spend).toMatch(
      /defaultOpen=\{\s*shotMode \|\| spendPanel === "mix" \|\| spendPanel === "cpa"\s*\}/,
    );
    expect(spend).not.toContain("defaultOpen={!emptyLiveSpend");
  });
});
