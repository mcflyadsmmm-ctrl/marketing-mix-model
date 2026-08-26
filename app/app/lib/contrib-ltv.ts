/**
 * Contribution-adjusted LTV helpers — till margin × cohort revenue.
 * Average portfolio math; not path credit.
 */

/** Round money to cents for stable aggregates across tiles. */
export function roundMoney(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.round(n * 100) / 100;
}

/** Round ROAS/× ratios to 2 decimals. */
export function roundMer(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.round(n * 100) / 100;
}

/**
 * Settings / sample desk / DashboardMetrics store contribution margin as 0–1
 * (0.35 = 35%). Older percent-point callers may still pass 1–100.
 */
export function marginAsMultiplier(marginPct: number): number | null {
  if (!Number.isFinite(marginPct) || marginPct <= 0) return null;
  if (marginPct <= 1) return marginPct;
  if (marginPct <= 100) return marginPct / 100;
  return null;
}

/**
 * Contribution LTV = cohort avg revenue × contribution margin.
 * `marginPct` is 0–1 (SAMPLE_DESK_MARGIN_PCT = 0.35, Settings same).
 */
export function contributionAdjustedLtv(
  avgRevenue: number | null | undefined,
  marginPct: number,
): number | null {
  if (avgRevenue == null || !Number.isFinite(avgRevenue)) return null;
  const margin = marginAsMultiplier(marginPct);
  if (margin == null) return null;
  return roundMoney(avgRevenue * margin);
}

/** Contribution LTV : cash CAC when both defined. */
export function contributionLtvCacRatio(
  contribLtv: number | null,
  cashCac: number | null,
): number | null {
  if (contribLtv == null || cashCac == null || !(cashCac > 0)) return null;
  return roundMer(contribLtv / cashCac);
}

/**
 * Honest caption: cohort LTV windows ≠ selected-period Cash CAC.
 * Never imply 30/90/365d revenue and this-period spend share one slicer.
 */
export function ltvWindowCaption(opts: {
  periodLabel: string;
  cohortMaxDays?: number;
}): string {
  const periodLabel = opts.periodLabel.trim() || "this period";
  const cohortMaxDays =
    opts.cohortMaxDays != null &&
    Number.isFinite(opts.cohortMaxDays) &&
    opts.cohortMaxDays > 0
      ? Math.round(opts.cohortMaxDays)
      : 365;
  return (
    `30/90/${cohortMaxDays}d cohort windows are from each customer’s first-order month` +
    ` (often longer than ${periodLabel}). Cash CAC uses this period’s spend ÷ new buyers` +
    ` — not the same window. Shopify Analytics does not combine LTV with ad spend.` +
    ` Not predictive. Not by ad. Order history only — not email CRM.`
  );
}

/**
 * Days remaining until a first-order month has lived long enough for a
 * complete 30/90/365 window. Null on a malformed cohort stamp.
 */
export function ltvWindowNeedsDays(opts: {
  cohortMonth: string;
  windowDays: number;
  asOf?: Date;
}): number | null {
  const match = /^(\d{4})-(\d{2})$/.exec(opts.cohortMonth.trim());
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  if (month < 1 || month > 12) return null;
  const windowDays = Math.round(opts.windowDays);
  if (!Number.isFinite(windowDays) || windowDays <= 0) return null;
  const asOf = opts.asOf ?? new Date();
  const startUtc = Date.UTC(year, month - 1, 1);
  const asOfUtc = Date.UTC(
    asOf.getUTCFullYear(),
    asOf.getUTCMonth(),
    asOf.getUTCDate(),
  );
  const ageDays = Math.floor((asOfUtc - startUtc) / 86_400_000) + 1;
  if (!Number.isFinite(ageDays)) return null;
  return Math.max(0, windowDays - ageDays);
}

/** Newest YYYY-MM in a cohort list, or null when empty. */
export function newestCohortMonth(
  cohorts: Array<{ cohortMonth: string }>,
): string | null {
  let newest: string | null = null;
  for (const row of cohorts) {
    const month = row.cohortMonth.trim();
    if (!/^\d{4}-\d{2}$/.test(month)) continue;
    if (newest == null || month > newest) newest = month;
  }
  return newest;
}

export function ltvNeedsDaysCopy(
  needsDays: number | null,
  windowDays: number,
): string | null {
  if (needsDays == null || needsDays <= 0) return null;
  const days = needsDays === 1 ? "day" : "days";
  return `Needs ${needsDays} more ${days} for a complete ${windowDays}d window — not blank LTV.`;
}

export type NewVsReturningSplit = {
  /** Net sales from customers buying for the first time this period. */
  newSales: number;
  /** Net sales from customers who had bought before. */
  returningSales: number;
  /** Ad spend that ran over the same dates. */
  spend: number;
  /** newSales ÷ (newSales + returningSales); null when there is no split yet. */
  newShare: number | null;
  /** False when the cohort spine has not produced a split for this period. */
  available: boolean;
};

/**
 * New-customer vs returning-customer cash next to the spend that ran over the
 * same dates. The split is clamped to the shop's own sales so the two halves
 * can never add up to more than the till took, and no part of the spend is
 * assigned to either group.
 */
export function newVsReturningSplit(opts: {
  newCustomerNetSales: number;
  returningCustomerNetSales: number;
  totalSpend: number;
  /** Ceiling — the shop's sales for the period. */
  totalSales: number;
}): NewVsReturningSplit {
  const clamp = (n: number) => (Number.isFinite(n) && n > 0 ? n : 0);
  const ceiling = clamp(opts.totalSales);
  let newSales = clamp(opts.newCustomerNetSales);
  let returningSales = clamp(opts.returningCustomerNetSales);
  const combined = newSales + returningSales;
  if (ceiling > 0 && combined > ceiling) {
    const scale = ceiling / combined;
    newSales = roundMoney(newSales * scale);
    returningSales = roundMoney(returningSales * scale);
  }
  const total = newSales + returningSales;
  return {
    newSales: roundMoney(newSales),
    returningSales: roundMoney(returningSales),
    spend: roundMoney(clamp(opts.totalSpend)),
    newShare: total > 0 ? newSales / total : null,
    available: total > 0,
  };
}

/** Honest line when the cohort spine has no new/returning split yet. */
export function newVsReturningPendingCopy(
  emptyReason: string | null,
): string {
  switch (emptyReason) {
    case "no_timezone":
      return "New vs returning needs the shop timezone before orders can bucket by local day.";
    case "history_limited":
      return "New vs returning needs more order history than this shop exposes.";
    default:
      return "New vs returning is still backfilling from order history — it fills without any new connection.";
  }
}

/**
 * Same-period spend vs new-customer cash. Calendar alignment only —
 * never channel attribution.
 */
export function datesAlignedCaption(opts: {
  periodLabel: string;
}): string {
  const periodLabel = opts.periodLabel.trim() || "this period";
  return (
    `Same-week / same-period spend vs new-customer cash for ${periodLabel}` +
    ` — dates aligned, not attribution. Mcfly does not assign those sales to a channel.`
  );
}
