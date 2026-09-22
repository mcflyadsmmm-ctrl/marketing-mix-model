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
  const customers = read("../routes/app.customers.tsx");
  const settings = read("../routes/app.settings.tsx");
  const pending = read("./desk-phone-pending-fixture.html");
  const trust = read("../components/CashTrustBanners.tsx");
  const unlock = read("../components/UnlockFullHistoryBanner.tsx");

  it("1) Overview still ranks Look here first — pending keeps scoreboard shells as —, not a peek graveyard of $0", () => {
    expect(overview).toContain('rank="first"');
    expect(overview).toContain("OVERVIEW_FIRST_LANE_LABEL");
    expect(overview).toContain("<OverviewYoyCards");
    expect(firstView).toContain("if (salesPending)");
    expect(firstView).toContain("fill as closed days land");
    expect(firstView).toContain("FindingStrip");
    expect(pending).toContain("Look here first");
    expect(pending).toContain("Typical day");
    expect(pending).toContain("Signal");
    expect(pending).toContain("not $0");
    expect(pending).not.toContain("0.00×");
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
    const unlockAt = customers.indexOf("{liveHistoryLocked && !shotMode ? <UnlockFullHistoryBanner");
    const ltvLaneAt = customers.indexOf('id="mcfly-ltv"');
    const valueAt = customers.indexOf("<CustomersLtvWindows");
    expect(unlockAt).toBeGreaterThan(-1);
    expect(ltvLaneAt).toBeGreaterThan(-1);
    expect(unlockAt).toBeGreaterThan(ltvLaneAt);
    expect(valueAt).toBeGreaterThan(unlockAt);
    expect(unlock).toContain("LIVE_UNPAID_INGEST_DAYS");
    expect(unlock).toMatch(/closed days of order rows/);
    expect(unlock).toMatch(/up to 24 months of orders/);
    expect(unlock).not.toContain("~90 days");
    expect(unlock).not.toMatch(/already on this desk/);
  });

  it("5) Settings is Live-only with Snowdevil honesty and a human support path", () => {
    expect(settings).not.toContain('aria-label="Sample | Live"');
    expect(settings).toMatch(/one Live shop view|Live shop only|Live book/i);
    expect(settings).toContain("Snowdevil");
    expect(settings).toContain('aria-label="Support"');
    expect(settings).toContain("Need help?");
    expect(settings).toContain("mcflyadsmmm@gmail.com");
    expect(settings).toContain("Open Support");
  });
});
