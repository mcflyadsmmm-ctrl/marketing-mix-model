import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { explorerMer } from "./spend-explorer";
import {
  overlaySalesOnSpendCoverage,
  spendPairCoverage,
} from "./spend-pair-coverage";
import { spendPairCopyText } from "./number-honesty";

const here = dirname(fileURLToPath(import.meta.url));

function read(rel: string): string {
  return readFileSync(join(here, rel), "utf8");
}

describe("Spend pair honesty — restoration locks", () => {
  it("does not coerce missing explorer sales with ?? 0", () => {
    const dashboard = read("./mer-dashboard.server.ts");
    const demo = read("../routes/demo.spend.tsx");
    expect(dashboard).not.toMatch(/row\?\.sales \?\? 0/);
    expect(demo).not.toMatch(/salesByDay\.get\(day\.dateKey\) \?\? 0/);
    expect(dashboard).toContain("salesOnFile");
    expect(demo).toContain("salesOnFile");
  });

  it("would fail if explorer MER became 0× from $0 / $spend", () => {
    expect(explorerMer(0, 650)).toBeNull();
    expect(explorerMer(0, 650, false)).toBeNull();
  });

  it("withholds weekday-only paste against a full-week till and does not write $0 spend", () => {
    const coverage = spendPairCoverage({
      salesDays: [
        "2026-09-14",
        "2026-09-15",
        "2026-09-16",
        "2026-09-17",
        "2026-09-18",
        "2026-09-19",
        "2026-09-20",
      ],
      spendDays: [
        "2026-09-14",
        "2026-09-15",
        "2026-09-16",
        "2026-09-17",
        "2026-09-18",
      ],
    });
    expect(coverage.salesDays).toBe(7);
    expect(coverage.spendDays).toBe(5);
    expect(coverage.salesDaysWithoutSpend).toBe(2);
    expect(coverage.withholdRatio).toBe(true);
    expect(coverage.caption).toMatch(/not \$0 spend/);
    expect(coverage.caption).not.toMatch(/6×/);

    const overlay = overlaySalesOnSpendCoverage(
      [
        { dateKey: "2026-09-19", label: "19", filled: false },
        { dateKey: "2026-09-18", label: "18", filled: true },
      ],
      { "2026-09-19": 900, "2026-09-18": 800 },
    );
    expect(overlay[0]?.filled).toBe(false);
    expect(overlay[0]?.hasSales).toBe(true);
    expect(overlay[1]?.filled).toBe(true);
    expect(overlay).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ dateKey: "2026-09-19", filled: true }),
      ]),
    );
  });

  it("copies nothing on empty spend and never copies 0×", () => {
    expect(
      spendPairCopyText({
        sales: 12_400,
        spend: 0,
        mer: 0,
        currency: "USD",
      }),
    ).toBeNull();
    const pending = spendPairCopyText({
      sales: 0,
      spend: 650,
      mer: 0,
      salesPending: true,
      currency: "USD",
    });
    expect(pending).toBeDefined();
    expect(pending).not.toMatch(/\$0 sales ÷/);
    expect(pending).not.toMatch(/=\s*0\.00×/);
    const unpaired = spendPairCopyText({
      sales: 0,
      spend: 650,
      mer: 0,
      salesPending: false,
      currency: "USD",
    });
    expect(unpaired).not.toMatch(/0×/);
  });

  it("public demo payback is not historyLimited on a finished SAMPLE book", () => {
    const demo = read("../routes/demo.spend.tsx");
    expect(demo).toContain("historyLimited={false}");
    expect(demo).toContain("data.ltv.revenue90");
    expect(demo).not.toMatch(/avgRevenueD30:\s*null/);
    expect(demo).not.toMatch(/avgRevenueD90:\s*null/);
    expect(demo).not.toMatch(/paybackDays:\s*null/);
  });

  it("does not add a Total ROAS Slack kind", () => {
    const insights = read("./shareable-insights.ts");
    expect(insights).toContain('"returning"');
    expect(insights).toContain('"typicalOrder"');
    expect(insights).toContain('"daysToSecond"');
    expect(insights).toContain('"ltvPeek"');
    expect(insights).toContain('"whale"');
    expect(insights).not.toMatch(/totalRoas|total_roas|total-roas/i);
  });
});
