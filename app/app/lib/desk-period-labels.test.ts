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

  it("spells out Last month and Last 12 months on the full control; compact chips stay MTD/QTD/YTD", () => {
    expect(periodControl).toContain('label: "Last month"');
    expect(periodControl).toContain('label: "Last 12 months"');
    expect(periodControl).toContain('label: "This month"');
    expect(periodControl).toContain('label: "This quarter"');
    expect(periodControl).toContain('label: "This year"');
    expect(periodControl).not.toContain('label: "LM"');
    expect(periodControl).not.toContain('label: "L12M"');
    expect(periodControl).toContain("COMPACT_PERIOD_OPTIONS");
    expect(periodControl).toContain('label: "MTD"');
    expect(periodControl).toContain('label: "Last mo"');
  });

  it("keeps Overview to its three year-over-year cards", () => {
    expect(overview).toContain("<OverviewYoyCards");
    expect(overview).toContain("buildOverviewYoyCards");
    expect(overview).not.toContain("SpendExplorer");
    expect(overview).not.toContain("<PeriodControl");
    expect(overview.indexOf("<OverviewYoyCards")).toBeLessThan(
      overview.indexOf("<OverviewFirstViewport"),
    );
  });

  it("ingests LTV cohorts for every shop — LTV is not a plan gate", () => {
    expect(overview).toContain("scheduleFirstSessionShopifyWindow");
    // No plan branch may wrap the cohort ingest; the desk is one plan.
    expect(overview).not.toMatch(/if \(entitlements\.canUse\w+\)/);
  });

  it("uses calendar dates for the overview share period", () => {
    expect(overview).toContain("sharePeriodStartDay");
    expect(overview).toContain("sharePeriodEndDay");
    expect(overview).toContain("formatOverviewShareText");
    expect(overview).toMatch(
      /periodStartDay:\s*sharePeriodStartDay/,
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

  it("keeps MTD chips off the Shopify five — tabs are the top bar", () => {
    expect(read("../routes/app.customers.tsx")).toContain("showPeriod={false}");
    expect(read("../routes/app.growth.tsx")).toContain("showPeriod={false}");
    expect(read("../routes/app.orders.tsx")).toContain("showPeriod={false}");
    expect(read("../routes/app.ltv.tsx")).toContain("showPeriod={false}");
    expect(read("../routes/app.cpa.tsx")).toContain("showPeriod={false}");
  });
});
