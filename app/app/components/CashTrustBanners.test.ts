import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  buildCashTrustBannerCandidates,
  syntheticCoverageDays,
} from "./CashTrustBanners";
import {
  countPrimaryBanners,
  countPrimaryCritical,
} from "../lib/overview-banner-budget";

const here = dirname(fileURLToPath(import.meta.url));
const source = readFileSync(join(here, "CashTrustBanners.tsx"), "utf8");
const indexSource = readFileSync(join(here, "../routes/app._index.tsx"), "utf8");

describe("CashTrustBanners today honesty", () => {
  it("surfaces capped open-day sales (truncated) and unavailable today", () => {
    expect(source).toContain("todaySalesTruncated");
    expect(source).toContain("todaySalesUnavailable");
    expect(source).toMatch(/Today.?s sales may be incomplete/i);
    expect(source).toMatch(/Today.?s sales unavailable/i);
    expect(source).toMatch(/~100 orders/);
  });

  it("keeps fail-closed trust banners and omits sales-basis info card", () => {
    expect(source).toContain("salesFactsIncomplete");
    expect(source).toContain("marginStale");
    expect(source).toContain("spendCoverage");
    expect(source).not.toContain("spendRecon");
    expect(source).not.toMatch(/declared Ads Manager/i);
    expect(source).not.toContain("showSalesBasis");
    expect(source).not.toMatch(/Ads Manager often ignores returns/i);
    expect(source).not.toMatch(/not Platform ROAS/i);
  });

  it("does not promise Ads Manager declare-recon merchants cannot set", () => {
    expect(source).not.toMatch(/Spend doesn.?t match Ads Manager/i);
    expect(source).not.toMatch(/declared total/i);
    expect(source).not.toContain("formatSpendReconLine");
  });

  it("does not tell merchants to finish spend trust while sales facts are the blocker", () => {
    expect(source).toMatch(/!input\.cashActionReady &&\s*\n\s*!input\.salesFactsIncomplete/);
  });

  it("does not call a missing-scope desk broken — grant CTA + backfilling after grant", () => {
    expect(source).toContain("DeepHistoryBanner");
    expect(source).toContain("deepHistoryKind");
    expect(source).toContain("missing_scope_wide");
    expect(source).toMatch(/this is filling, not broken/);
    expect(source).not.toMatch(/permanently (empty|limited|dead)/i);
  });
});

describe("CashTrustBanners Love-V1 banner budget + Love-6 coverage", () => {
  it("wires Love-6 resolveSpendCoverageNotice — never critical for coverage-only", () => {
    expect(source).toContain("resolveSpendCoverageNotice");
    expect(source).toContain("coverageNotice.tone");
    expect(source).not.toMatch(
      /tone="critical" heading=\{spendGapImpact\.heading\}/,
    );
    expect(source).not.toMatch(
      /tone="critical" heading=\{coverageNotice\.heading\}/,
    );
  });

  it("declares the Overview surface so a young ledger never paints green here", () => {
    expect(source).toMatch(/surface: "overview"/);
  });

  it("sends the coverage CTA to the typed row, not always to uploads", () => {
    expect(source).toContain("spendCoverageHref(coverageNotice.primary.target)");
    expect(source).toContain('case "type_day":\n      return "/app/spend#mcfly-spend-day"');
  });

  it("uses overview banner budget helper and budgetRole split on Overview", () => {
    expect(source).toContain("budgetOverviewBanners");
    expect(source).toContain("budgetRole");
    expect(indexSource).toContain('budgetRole={showTrustBelow ? "above" : "all"}');
    expect(indexSource).toContain(
      'budgetRole={showTrustAbove ? "deferred" : "all"}',
    );
  });

  it("cold+partial: ≤1 primary banner, 0 critical, sales facts as chip", () => {
    const { decisions, coverageNotice } = buildCashTrustBannerCandidates({
      blockedMockAsLive: false,
      spendCoverage: {
        daysWithSpend: 1,
        daysInPeriod: 27,
        coveragePct: Math.round((1 / 27) * 100),
        incomplete: true,
      },
      periodLabel: "Last 28 days",
      shopifyOrderWindowLimited: false,
      salesFactsIncomplete: { factDays: 12, expectedClosedDays: 27 },
      todaySalesTruncated: false,
      todaySalesUnavailable: false,
      cashActionReady: false,
      belowBreakEven: null,
      marginStale: true,
      onboarding: { settingsSaved: true, hasSpend: true },
      deepHistoryKind: "hidden",
      shopDomain: "demo.myshopify.com",
      hasReadAllOrders: true,
    });

    // Before Love-V1 this case painted ~3 full banners (coverage critical +
    // sales facts info + margin stale). After: 1 banner + chips.
    // First typed day: celebrated on the Spend desk, `info` here because a
    // Total ROAS figure shares the viewport.
    expect(coverageNotice?.tone).toBe("info");
    expect(coverageNotice?.stage).toBe("first_day");
    expect(countPrimaryCritical(decisions)).toBe(0);
    expect(countPrimaryBanners(decisions)).toBe(1);
    expect(decisions.find((d) => d.id === "spend_coverage")?.placement).toBe(
      "banner",
    );
    expect(decisions.find((d) => d.id === "sales_facts")?.placement).toBe(
      "chip",
    );
    expect(decisions.find((d) => d.id === "margin_stale")?.placement).toBe(
      "chip",
    );
    // Almost-ready suppressed while coverage incomplete (Love-6 / prior guard).
    expect(decisions.find((d) => d.id === "almost_ready")).toBeUndefined();
  });

  it("synthetic coverage days preserve filled count for Love-6 stages", () => {
    const days = syntheticCoverageDays({
      daysWithSpend: 2,
      daysInPeriod: 27,
      coveragePct: 7,
      incomplete: true,
    });
    expect(days).toHaveLength(27);
    expect(days.filter((d) => d.filled)).toHaveLength(2);
  });
});
