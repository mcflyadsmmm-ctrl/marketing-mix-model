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

  it("keeps the Spend Upload route free of analysis rooms", () => {
    expect(spend).not.toContain("<MarketingSpendRoom");
    expect(spend).not.toContain('from "../components/MarketingSpendRoom"');
    expect(spend).not.toContain("<SpendExplorer");
    expect(spend).not.toContain("<DualCloseLine");
  });

  it("does not build a spend analysis board on the input route", () => {
    expect(spend).not.toContain("buildCashControlBoard");
    expect(spend).not.toContain("spendRoom");
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
    expect(room).toContain("Sales vs this month");
    expect(mixPlan).toContain("vs last month");
    expect(mixPlan).toContain("Spend left at goal");
    expect(mixPlan).toContain("Daily spend cap");
    expect(mixPlan).toContain("This month");
    expect(mixPlan).toContain("Last 7 days");
    expect(mixPlan).toContain("This quarter");
    expect(mixPlan).toContain("full last month");
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
  });

  it("does not remount the Overview control board or desk rail", () => {
    expect(spend).not.toContain("<CashControlBoard");
    expect(spend).not.toContain('from "../components/CashControlBoard"');
    expect(spend).not.toContain("DeskWindowRail");
    expect(room).not.toContain("DeskWindowRail");
    expect(room).not.toContain("DESK_SECTION");
    expect(room).not.toContain("CashControlBoard.tsx");
  });

  it("mounts intel-only spend room on Total ROAS, not Spend Upload", () => {
    const roas = read("../routes/app.roas.tsx");
    expect(roas).toContain("<MarketingSpendRoom");
    expect(roas).toContain('from "../components/MarketingSpendRoom"');
    expect(roas).toContain("intelOnly");
    expect(room).toContain("intelOnly = false");
  });
});
