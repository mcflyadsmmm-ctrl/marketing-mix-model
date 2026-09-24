import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  SPEND_ANALYTICS_CONTRAST,
  SPEND_FIRST_FOLD_CHIP_MARKER,
  SPEND_FIRST_FOLD_HEROES,
  SPEND_FIRST_LANE_LABEL,
  buildSpendCompareKpis,
  spendHeroBeatsShopifyAnalytics,
} from "./spend-first-viewport";
import { periodDeltasForBasis } from "./period-deltas";

const here = dirname(fileURLToPath(import.meta.url));

function read(rel: string) {
  return readFileSync(join(here, rel), "utf8");
}

describe("Spend first-fold SCORECARD vs free Shopify Analytics", () => {
  it("PASS only when every first-fold hero is Mcfly-differentiated", () => {
    for (const hero of SPEND_FIRST_FOLD_HEROES) {
      expect(spendHeroBeatsShopifyAnalytics(hero)).toBe(true);
    }
    expect(SPEND_ANALYTICS_CONTRAST).toMatch(/spend ledger/i);
    expect(SPEND_FIRST_LANE_LABEL).toMatch(/Total ROAS/i);
    expect(SPEND_FIRST_FOLD_HEROES).toContain("cashWindows");
    expect(SPEND_FIRST_FOLD_CHIP_MARKER).toBe("mcfly-scoreboard--first-fold");
  });
});

describe("Spend craft wiring", () => {
  const spend = read("../routes/app.spend.tsx");
  const demo = read("../routes/demo.spend.tsx");
  const viewport = read("../components/SpendFirstViewport.tsx");

  it("uses native section hero + compare + explorer in the first lane", () => {
    expect(spend).toContain("<SpendFirstViewport");
    expect(spend).toContain("<SpendCompareGlance");
    expect(spend).toContain('id="mcfly-explorer"');
    expect(spend).toContain("<SpendExplorer");
    expect(spend).not.toContain("<s-section");
    expect(viewport).toContain('className="mcfly-overview-plane mcfly-spend-plane"');
    expect(viewport).toContain("SPEND_ANALYTICS_SR_LINE");
    expect(viewport).not.toContain("mcfly-book__lede");
    expect(viewport).toContain("<CertifiedScoreboard");
    expect(viewport).toContain('placement="firstFold"');
    const firstStart = spend.indexOf('<DeskLane rank="first"');
    const firstEnd = spend.indexOf("<DeskLane", firstStart + 1);
    const firstLane = spend.slice(firstStart, firstEnd);
    expect(firstLane).toContain("<SpendFirstViewport");
    expect(firstLane).toContain("cashChips=");
    expect(firstLane).toContain("<SpendExplorer");
    expect(firstLane).not.toContain("<SpendMixSection");
    expect(firstLane).not.toContain("<CpaExplorer");
  });

  it("folds mix, CPA, and certified depth at rank more with panel-aware open", () => {
    expect(spend).toContain('rank="more"');
    expect(spend).toContain("SPEND_DEPTH_LANE_LABEL");
    expect(spend).toMatch(
      /defaultOpen=\{\s*shotMode \|\|[\s\S]*spendPanel === "mix" \|\|[\s\S]*spendPanel === "cpa"\s*\}/,
    );
    expect(spend).toContain("<SpendMixSection");
    expect(spend).toContain('id="mcfly-cpa"');
    expect(demo).toContain("<DeskLane");
    expect(demo).toContain("<SpendFirstViewport");
    expect(demo).not.toContain("<SpendCompareGlance");
  });

  it("never paints 0× for empty spend in the hero", () => {
    expect(viewport).toContain('roasValue === "—"');
    expect(spend).not.toContain("0.00×");
  });
});

describe("buildSpendCompareKpis", () => {
  it("builds sales, spend, and Total ROAS vs prior", () => {
    const deltas = periodDeltasForBasis({
      basis: "total",
      currentSales: 900,
      currentMer: 9,
      currentSpend: 100,
      priorTotalSales: 800,
      priorSpend: 100,
      priorLabel: "prior month",
    });
    const kpis = buildSpendCompareKpis({
      deltas,
      salesPending: false,
      sales: 900,
      spend: 100,
      mer: 9,
      money: (n) => `$${n}`,
    });
    expect(kpis.map((k) => k.key)).toEqual(["sales", "spend", "roas"]);
    expect(kpis[2]?.value).toBe("9.00×");
  });
});
