/**
 * Overview banner budget — VISUAL_CRAFT §2.5 / Love-V1 (P0.1).
 *
 * Hard caps for CashTrustBanners (and any Overview trust stack that opts in):
 * 1. ≤1 critical above the fold
 * 2. ≤2 non-dismissible status banners competing with the hero
 * 3. Non-essential chrome → dismissible when shown as a banner
 * 4. Info trust signals prefer chips (or deferred below KPI)
 *
 * Pure — no I/O. Callers decide which candidates are active; this only places them.
 */

export const OVERVIEW_BANNER_BUDGET = {
  maxCriticalAboveFold: 1,
  maxNonDismissibleStatusAboveFold: 2,
} as const;

export type OverviewBannerId =
  | "mock_blocked"
  | "deep_history"
  | "order_window"
  | "sales_facts"
  | "today_truncated"
  | "today_unavailable"
  | "margin_stale"
  | "almost_ready"
  | "spend_coverage"
  | "below_be";

export type OverviewBannerTone = "critical" | "warning" | "info" | "success";

/**
 * Where a candidate lands after budgeting.
 * - `banner` — full s-banner in the primary (above-fold / exclusive) stack
 * - `deferred` — full s-banner only in the below-KPI stack
 * - `chip` — compact trust chip (info preference)
 * - `omit` — do not surface (redundant / overcrowded)
 */
export type OverviewBannerPlacement = "banner" | "deferred" | "chip" | "omit";

export type OverviewBannerCandidate = {
  id: OverviewBannerId;
  tone: OverviewBannerTone;
  /**
   * Competes for the non-dismissible status budget when placed as a banner.
   * Non-essential candidates may still show as dismissible banners or chips.
   */
  essential: boolean;
  /** Product allows Polaris `dismissible` when shown as a banner. */
  dismissibleAllowed: boolean;
  /** Compact label when demoted to a chip. */
  chipLabel?: string;
  /**
   * Sort key — lower wins the primary slots first.
   * Critical blockers should be the lowest numbers.
   */
  priority: number;
};

export type OverviewBannerDecision = {
  id: OverviewBannerId;
  placement: OverviewBannerPlacement;
  tone: OverviewBannerTone;
  /** Effective dismissible flag for banner placements. */
  dismissible: boolean;
  chipLabel?: string;
};

/**
 * Assign placements for active Overview trust candidates.
 * Input order does not matter; `priority` does.
 */
export function budgetOverviewBanners(
  candidates: readonly OverviewBannerCandidate[],
): OverviewBannerDecision[] {
  const sorted = [...candidates].sort((a, b) => {
    if (a.priority !== b.priority) return a.priority - b.priority;
    return a.id.localeCompare(b.id);
  });

  let criticalUsed = 0;
  let statusUsed = 0;

  return sorted.map((c) => {
    if (c.tone === "critical") {
      if (criticalUsed < OVERVIEW_BANNER_BUDGET.maxCriticalAboveFold) {
        criticalUsed += 1;
        statusUsed += 1;
        return decision(c, "banner", false);
      }
      // Second critical — keep honesty below KPI, never a second red wall.
      return decision(c, "deferred", false);
    }

    // Must-banner essentials (coverage, deep history, …): banner or deferred only.
    if (mustBeBanner(c)) {
      if (statusUsed < OVERVIEW_BANNER_BUDGET.maxNonDismissibleStatusAboveFold) {
        statusUsed += 1;
        return decision(c, "banner", false);
      }
      return decision(c, "deferred", false);
    }

    // Soft info: prefer chip whenever another status banner already won a slot.
    if (c.tone === "info" && c.chipLabel) {
      if (statusUsed > 0) {
        return decision(c, "chip", false);
      }
      statusUsed += 1;
      return decision(c, "banner", c.dismissibleAllowed && !c.essential);
    }

    // Warning essentials — non-dismissible status budget.
    if (c.essential) {
      if (statusUsed < OVERVIEW_BANNER_BUDGET.maxNonDismissibleStatusAboveFold) {
        statusUsed += 1;
        return decision(c, "banner", false);
      }
      return decision(c, "deferred", false);
    }

    // Non-essential: alone → dismissible banner; otherwise chip / deferred.
    // Do not let soft chrome fill the second status slot above the fold.
    if (statusUsed === 0) {
      statusUsed += 1;
      return decision(c, "banner", c.dismissibleAllowed);
    }
    if (c.chipLabel) {
      return decision(c, "chip", false);
    }
    if (c.dismissibleAllowed) {
      return decision(c, "deferred", true);
    }
    return decision(c, "omit", false);
  });
}

function mustBeBanner(c: OverviewBannerCandidate): boolean {
  // Fail-closed blockers and spend-coverage honesty always earn a banner slot
  // when they win the budget — never silent chip-only for these ids.
  return (
    c.id === "mock_blocked" ||
    c.id === "below_be" ||
    c.id === "spend_coverage" ||
    c.id === "deep_history"
  );
}

function decision(
  c: OverviewBannerCandidate,
  placement: OverviewBannerPlacement,
  dismissible: boolean,
): OverviewBannerDecision {
  return {
    id: c.id,
    placement,
    tone: c.tone,
    dismissible:
      placement === "banner" || placement === "deferred" ? dismissible : false,
    chipLabel: c.chipLabel,
  };
}

/** Count full banners that would paint in the primary (above-fold) stack. */
export function countPrimaryBanners(
  decisions: readonly OverviewBannerDecision[],
): number {
  return decisions.filter((d) => d.placement === "banner").length;
}

/** Count critical banners in the primary stack. */
export function countPrimaryCritical(
  decisions: readonly OverviewBannerDecision[],
): number {
  return decisions.filter(
    (d) => d.placement === "banner" && d.tone === "critical",
  ).length;
}
