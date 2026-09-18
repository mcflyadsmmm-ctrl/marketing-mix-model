import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const here = dirname(fileURLToPath(import.meta.url));

function read(rel: string): string {
  return readFileSync(join(here, rel), "utf8");
}

describe("uninstall-friction pass — Overview / empties / sync / Unlock / Settings", () => {
  const overview = read("../routes/app._index.tsx");
  const firstView = read("../components/OverviewFirstViewport.tsx");
  const ltv = read("../routes/app.ltv.tsx");
  const settings = read("../routes/app.settings.tsx");
  const pending = read("./desk-phone-pending-fixture.html");
  const trust = read("../components/CashTrustBanners.tsx");
  const unlock = read("../components/UnlockFullHistoryBanner.tsx");

  it("1) Overview still ranks Look here first — pending does not add a peek graveyard", () => {
    expect(overview).toContain('rank="first"');
    expect(overview).toContain("OVERVIEW_FIRST_LANE_LABEL");
    expect(overview).toContain("<OverviewYoyCards");
    expect(firstView).toContain("if (salesPending)");
    expect(firstView).toContain("fill as closed days land");
    expect(pending).toContain("Look here first");
    expect(pending).not.toContain("mcfly-kpi-grid--peeks-lead");
  });

  it("2) pending / thin empties stay copy, not a blank chart wall", () => {
    expect(firstView).toContain("OVERVIEW_PENDING_LINE");
    expect(pending).toContain("mcfly-chart--empty");
    expect(pending).toContain("not $0");
    expect(pending).not.toContain("0.00×");
    expect(overview).toContain("emptyOverviewMixForecast");
    expect(overview).toContain("emptyShareableInsights");
  });

  it("3) first-run sync shows 0-of-N sales + order progress above the glance", () => {
    expect(overview).toContain("syncNeedsTop");
    expect(overview).toContain("salesFactsIncomplete");
    expect(overview).toContain("expectedClosedDays > 0");
    expect(overview).not.toContain("metrics.orderCount > 0 || metrics.sales > 0");
    expect(trust).toContain("orderHistoryProgressMessage");
    expect(trust).toContain("hasSpend");
    expect(pending).toContain("0 of 23 days");
  });

  it("4) Unlock full history leads LTV when the live book is locked", () => {
    const unlockAt = ltv.indexOf("{liveHistoryLocked && !shotMode ? <UnlockFullHistoryBanner");
    const firstLaneAt = ltv.indexOf('rank="first" label="What a new buyer is worth"');
    expect(unlockAt).toBeGreaterThan(-1);
    expect(firstLaneAt).toBeGreaterThan(unlockAt);
    expect(unlock).toContain("Unlock full history");
    expect(unlock).toContain("~90 days");
  });

  it("5) Settings names SAMPLE vs Live and a human support path", () => {
    expect(settings).toContain('aria-label="Sample | Live"');
    expect(settings).toContain("Snowdevil example numbers, not this shop");
    expect(settings).toContain('aria-label="Support"');
    expect(settings).toContain("Need help?");
    expect(settings).toContain("mcflyadsmmm@gmail.com");
    expect(settings).toContain("Open Support");
  });
});
