import { describe, expect, it } from "vitest";
import {
  budgetOverviewBanners,
  countPrimaryBanners,
  countPrimaryCritical,
  OVERVIEW_BANNER_BUDGET,
  type OverviewBannerCandidate,
} from "./overview-banner-budget";

function c(
  partial: Partial<OverviewBannerCandidate> &
    Pick<OverviewBannerCandidate, "id" | "tone" | "priority">,
): OverviewBannerCandidate {
  return {
    essential: true,
    dismissibleAllowed: false,
    ...partial,
  };
}

describe("budgetOverviewBanners — VISUAL_CRAFT §2.5", () => {
  it("caps critical above-fold to one and defers the rest", () => {
    const decisions = budgetOverviewBanners([
      c({ id: "mock_blocked", tone: "critical", priority: 10 }),
      c({ id: "below_be", tone: "critical", priority: 40 }),
    ]);
    expect(countPrimaryCritical(decisions)).toBe(
      OVERVIEW_BANNER_BUDGET.maxCriticalAboveFold,
    );
    expect(decisions.find((d) => d.id === "mock_blocked")?.placement).toBe(
      "banner",
    );
    expect(decisions.find((d) => d.id === "below_be")?.placement).toBe(
      "deferred",
    );
  });

  it("cold+partial coverage: one coverage banner + sales-facts chip (not a stack)", () => {
    // Typical Love-V1 cold first session: young ledger + facts still filling.
    const decisions = budgetOverviewBanners([
      c({
        id: "spend_coverage",
        tone: "info",
        priority: 30,
        chipLabel: "Ledger started — 1 of 27",
      }),
      c({
        id: "sales_facts",
        tone: "info",
        essential: false,
        dismissibleAllowed: true,
        priority: 80,
        chipLabel: "Sales facts 12/27",
      }),
      c({
        id: "margin_stale",
        tone: "warning",
        essential: false,
        dismissibleAllowed: true,
        priority: 60,
        chipLabel: "Reconfirm margin",
      }),
    ]);

    expect(countPrimaryBanners(decisions)).toBeLessThanOrEqual(
      OVERVIEW_BANNER_BUDGET.maxNonDismissibleStatusAboveFold,
    );
    expect(countPrimaryCritical(decisions)).toBe(0);
    expect(decisions.find((d) => d.id === "spend_coverage")?.placement).toBe(
      "banner",
    );
    expect(decisions.find((d) => d.id === "sales_facts")?.placement).toBe(
      "chip",
    );
    // Non-essential warning loses the slot → chip (not a third banner).
    expect(decisions.find((d) => d.id === "margin_stale")?.placement).toBe(
      "chip",
    );
  });

  it("never demotes spend_coverage to chip-only", () => {
    const decisions = budgetOverviewBanners([
      c({ id: "mock_blocked", tone: "critical", priority: 10 }),
      c({
        id: "spend_coverage",
        tone: "warning",
        priority: 30,
        chipLabel: "7 days missing",
      }),
      c({
        id: "today_truncated",
        tone: "warning",
        priority: 55,
        chipLabel: "Today incomplete",
      }),
    ]);
    const coverage = decisions.find((d) => d.id === "spend_coverage");
    expect(coverage?.placement).not.toBe("chip");
    expect(coverage?.placement).not.toBe("omit");
    // Slot 1 = mock critical, slot 2 = coverage; today deferred.
    expect(coverage?.placement).toBe("banner");
    expect(decisions.find((d) => d.id === "today_truncated")?.placement).toBe(
      "deferred",
    );
  });

  it("marks non-essential banners dismissible when they win a slot", () => {
    const decisions = budgetOverviewBanners([
      c({
        id: "margin_stale",
        tone: "warning",
        essential: false,
        dismissibleAllowed: true,
        priority: 60,
        chipLabel: "Reconfirm margin",
      }),
    ]);
    const margin = decisions.find((d) => d.id === "margin_stale");
    expect(margin?.placement).toBe("banner");
    expect(margin?.dismissible).toBe(true);
  });
});
