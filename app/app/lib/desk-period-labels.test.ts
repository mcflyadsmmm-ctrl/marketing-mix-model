import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const here = dirname(fileURLToPath(import.meta.url));

function read(rel: string) {
  return readFileSync(join(here, rel), "utf8");
}

describe("Desk period labels and Overview clocks", () => {
  const periodControl = read("../components/PeriodControl.tsx");
  const overview = read("../routes/app._index.tsx");

  it("spells out Last month and Last 12 months instead of LM / L12M", () => {
    expect(periodControl).toContain('label: "Last month"');
    expect(periodControl).toContain('label: "Last 12 months"');
    expect(periodControl).toContain('label: "This month"');
    expect(periodControl).toContain('label: "This quarter"');
    expect(periodControl).toContain('label: "This year"');
    expect(periodControl).not.toContain('label: "LM"');
    expect(periodControl).not.toContain('label: "L12M"');
    expect(periodControl).not.toContain('label: "MTD"');
    expect(periodControl).not.toContain('label: "QTD"');
    expect(periodControl).not.toContain('label: "YTD"');
  });

  it("keeps Overview to its three year-over-year cards", () => {
    expect(overview).toContain("<OverviewYoyCards");
    expect(overview).toContain("buildOverviewYoyCards");
    expect(overview).not.toContain("SpendExplorer");
  });

  it("ingests LTV cohorts for every shop — LTV is not a plan gate", () => {
    expect(overview).toContain("runOrderFactsBackfill");
    // No plan branch may wrap the cohort ingest; the desk is one plan.
    expect(overview).not.toMatch(/if \(entitlements\.canUse\w+\)/);
  });

  it("uses calendar dates for the overview share period", () => {
    expect(overview).toContain("formatPeriodDaySpan");
    expect(overview).toMatch(
      /formatPeriodDaySpan\(\s*sharePeriodStartDay,\s*sharePeriodEndDay/,
    );
  });

  it("keeps Spend chart range on the chart, not a global slicer", () => {
    const spend = read("../routes/app.spend.tsx");
    const roas = read("../routes/app.roas.tsx");
    expect(spend).not.toContain("<SpendExplorer");
    expect(roas).toContain("explorerQueryMatchingScoreboard");
    expect(roas).toContain("shotMode ? (");
    expect(roas).toContain("<PeriodControl");
    expect(roas).not.toContain("Same dates as Overview");
    expect(roas).not.toContain("Overview stays 14d");
  });
});
