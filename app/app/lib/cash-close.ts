/**
 * Monday Cash Close — pure helpers (client-safe).
 * Total ROAS = average portfolio efficiency, not marginal / path credit.
 */

import { calculateAmer } from "@mcfly/mer-core";
import type { SpendPeriodCoverage, SpendReconResult } from "./mer-trust";
import { PRODUCT_NOUN } from "./product-labels";
import { shopLocalDayKey } from "./shop-local-day";

export const CLOSE_DECISIONS = ["hold", "reduce", "step_test"] as const;
export type CloseDecision = (typeof CLOSE_DECISIONS)[number];

/** Max step-change cut — same floor religion as allocation (≥50% spend kept). */
export const MAX_CUT_PCT = 50;

export type CloseException = {
  code: string;
  label: string;
  blocking: boolean;
};

/** Metrics slice needed to build exceptions / lock a close. */
export type CloseMetricsInput = {
  period: { start: Date; end: Date; label: string };
  netSales: number;
  grossSales: number;
  totalSpend: number;
  mer: number | null;
  breakEvenMer: number | null;
  marginPct: number;
  cashActionReady: boolean;
  marginStale: boolean;
  spendCoverage: SpendPeriodCoverage;
  spendRecon: SpendReconResult | null;
  onboarding: { settingsSaved: boolean; hasSpend: boolean };
  /** Fail-closed: never lock when sales load failed (zeros are not cash). */
  salesError?: string | null;
  /** Fail-closed: never lock when closed-day SalesDayFact coverage is incomplete. */
  salesFactsIncomplete?: boolean;
};

/** CSV row shape — no Prisma import (client-safe). */
export type CashCloseCsvRow = {
  id: string;
  periodLabel: string;
  periodStart: Date;
  periodEnd: Date;
  lockedAt: Date;
  netSales: number;
  grossSales: number;
  spend: number;
  mer: number | null;
  breakEvenMer: number | null;
  marginPct: number | null;
  coveragePct: number | null;
  reconStatus: string | null;
  cashActionReady: boolean;
  decision: string;
  decisionNote: string | null;
  cutPct: number | null;
  deltaSales: number | null;
  deltaSpend: number | null;
  deltaMer: number | null;
  exceptionsJson: string;
};

export function isCloseDecision(value: string): value is CloseDecision {
  return (CLOSE_DECISIONS as readonly string[]).includes(value);
}

/**
 * Merchant-facing decision copy — short ritual hints only.
 * Never imply marginal / path / “true ROAS.”
 */
export function closeDecisionUiCopy(decision: CloseDecision): {
  label: string;
  hint: string;
} {
  switch (decision) {
    case "hold":
      return {
        label: "Hold — keep spend pace",
        hint: "Keep current spend pace. Average Total ROAS ≠ marginal ROAS.",
      };
    case "reduce":
      return {
        label: "Reduce spend",
        hint: "Illustrative cut to protect break-even — not path credit.",
      };
    case "step_test":
      return {
        label: "Step-test cut",
        hint: "Illustrative step-test — small cut, recheck next week. Average ≠ marginal ROAS.",
      };
    default: {
      const _exhaustive: never = decision;
      return _exhaustive;
    }
  }
}

export function validateCloseDecision(
  decision: string,
  cutPct: number | null | undefined,
):
  | { ok: true; decision: CloseDecision; cutPct: number | null }
  | { ok: false; error: string } {
  if (!isCloseDecision(decision)) {
    return {
      ok: false,
      error: "Decision must be hold, reduce, or step_test.",
    };
  }
  if (decision === "hold") {
    return { ok: true, decision, cutPct: null };
  }
  if (cutPct == null || !Number.isFinite(cutPct)) {
    return {
      ok: false,
      error: "Reduce / step-test needs a cut percent (1–50).",
    };
  }
  if (cutPct <= 0 || cutPct > MAX_CUT_PCT) {
    return {
      ok: false,
      error: `Cut percent must be between 1 and ${MAX_CUT_PCT}.`,
    };
  }
  return { ok: true, decision, cutPct };
}

/**
 * Hard lock gate — only block when margin unconfirmed or no spend logged.
 * Coverage / recon / stale / cashActionReady are warnings (still recorded).
 */
export function canLockCashClose(metrics: CloseMetricsInput): {
  ok: boolean;
  reason: string | null;
} {
  if (metrics.salesError) {
    return {
      ok: false,
      reason:
        "Sales did not load for this period. Refresh before Save — zeros are not cash.",
    };
  }
  if (metrics.salesFactsIncomplete) {
    return {
      ok: false,
      reason:
        "Sales day facts are incomplete for this period. Wait for backfill before Save.",
    };
  }
  if (!metrics.onboarding.settingsSaved) {
    return {
      ok: false,
      reason:
        "Confirm profit margin in Settings before Save this period.",
    };
  }
  if (!metrics.onboarding.hasSpend) {
    return {
      ok: false,
      reason: "Log ad spend for this period before Save this period.",
    };
  }
  if (metrics.spendCoverage.incomplete) {
    return {
      ok: false,
      reason: `Spend days missing (${metrics.spendCoverage.daysWithSpend}/${metrics.spendCoverage.daysInPeriod}). Fill gaps on Spend before trusting Total ROAS.`,
    };
  }
  return { ok: true, reason: null };
}

export function buildCloseExceptions(
  metrics: CloseMetricsInput,
): CloseException[] {
  const out: CloseException[] = [];

  if (!metrics.onboarding.settingsSaved) {
    out.push({
      code: "margin_unconfirmed",
      label: "Profit margin not confirmed — break-even is preview-only.",
      blocking: true,
    });
  } else if (metrics.marginStale) {
    out.push({
      code: "margin_stale",
      label: "Margin confirmed more than 90 days ago — reconfirm in Settings.",
      blocking: false,
    });
  }

  if (!metrics.onboarding.hasSpend) {
    out.push({
      code: "no_spend",
      label: "No ad spend logged for this period.",
      blocking: true,
    });
  } else if (metrics.spendCoverage.incomplete) {
    out.push({
      code: "coverage_incomplete",
      label: `Spend days missing (${metrics.spendCoverage.daysWithSpend}/${metrics.spendCoverage.daysInPeriod} filled, ${metrics.spendCoverage.coveragePct}%). Fill gaps on Spend (e.g. weekend Meta) before sharing Total ROAS.`,
      blocking: true,
    });
  }

  const recon = metrics.spendRecon?.status ?? "none";
  if (recon === "drift") {
    out.push({
      code: "recon_drift",
      label: "Spend off Ads Manager by more than ±5%",
      blocking: false,
    });
  } else if (recon === "none" && metrics.onboarding.hasSpend) {
    out.push({
      code: "recon_none",
      label: "No Ads Manager total saved",
      blocking: false,
    });
  }

  if (!metrics.cashActionReady) {
    out.push({
      code: "cash_action_not_ready",
      label: `${PRODUCT_NOUN.totalRoas} not ready yet — finish setup before acting on advice.`,
      blocking: false,
    });
  }

  out.push({
    code: "sales_basis",
    label: PRODUCT_NOUN.salesBasis,
    blocking: false,
  });

  return out;
}

export function parseExceptionsJson(raw: string): CloseException[] {
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (row): row is CloseException =>
        row != null &&
        typeof row === "object" &&
        typeof (row as CloseException).code === "string" &&
        typeof (row as CloseException).label === "string" &&
        typeof (row as CloseException).blocking === "boolean",
    );
  } catch {
    return [];
  }
}

function csvEscape(value: string | number | boolean | null | undefined): string {
  if (value == null) return "";
  const s = String(value);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

/** Gross ÷ spend — Ads Manager–comparable only; never action Total ROAS. */
export function computeGrossMer(
  grossSales: number,
  spend: number,
): number | null {
  if (!(spend > 0) || !Number.isFinite(grossSales)) return null;
  return grossSales / spend;
}

/** Returns/refunds haircut: gross till → net till. */
export function returnsHaircut(
  grossSales: number,
  netSales: number,
): { dollars: number; pct: number } | null {
  if (!(grossSales > netSales) || !(grossSales > 0)) return null;
  const dollars = grossSales - netSales;
  return { dollars, pct: dollars / grossSales };
}

/** Finance-readable single-row CSV for a locked close. */
export function formatCashCloseCsv(close: CashCloseCsvRow): string {
  const grossMer = computeGrossMer(close.grossSales, close.spend);
  const headers = [
    "close_id",
    "period_label",
    "period_start",
    "period_end",
    "locked_at",
    "net_sales",
    "gross_sales",
    "spend",
    "total_roas",
    "gross_total_roas",
    "break_even_total_roas",
    "margin_pct",
    "coverage_pct",
    "recon_status",
    "cash_action_ready",
    "decision",
    "decision_note",
    "cut_pct",
    "delta_sales",
    "delta_spend",
    "delta_total_roas",
    "exceptions",
  ];
  const row = [
    close.id,
    close.periodLabel,
    close.periodStart.toISOString(),
    close.periodEnd.toISOString(),
    close.lockedAt.toISOString(),
    close.netSales,
    close.grossSales,
    close.spend,
    close.mer,
    grossMer,
    close.breakEvenMer,
    close.marginPct != null ? close.marginPct * 100 : null,
    close.coveragePct,
    close.reconStatus,
    close.cashActionReady,
    close.decision,
    close.decisionNote,
    close.cutPct,
    close.deltaSales,
    close.deltaSpend,
    close.deltaMer,
    close.exceptionsJson,
  ].map(csvEscape);

  return `${headers.join(",")}\n${row.join(",")}\n`;
}

export type CashCloseMemoPace = {
  statusLabel: string;
  headroomPeriod: number;
  remainingDays: number;
  densityLabel: string;
};

/** Optional Export memo extras — aMER when new-customer sales are known. */
export type CashCloseMemoExtras = {
  newCustomerNetSales?: number | null;
  amer?: number | null;
};

/**
 * Forwardable plain-text Export memo — paste into Slack / email / finance.
 * Total ROAS stays net (after returns); gross is Ads Manager–comparable only.
 * Alias: formatTillTruthMemo (internal name kept).
 */
export function formatCashCloseMemo(
  close: CashCloseCsvRow,
  pace?: CashCloseMemoPace | null,
  extras?: CashCloseMemoExtras | null,
  ianaTimezone?: string | null,
): string {
  const grossMer = computeGrossMer(close.grossSales, close.spend);
  const newCustomerNetSales = extras?.newCustomerNetSales;
  const amer =
    extras?.amer != null && Number.isFinite(extras.amer)
      ? extras.amer
      : newCustomerNetSales != null && Number.isFinite(newCustomerNetSales)
        ? calculateAmer(newCustomerNetSales, close.spend)
        : null;
  const decision =
    close.decision === "hold" ||
    close.decision === "reduce" ||
    close.decision === "step_test"
      ? closeDecisionUiCopy(close.decision)
      : { label: close.decision, hint: "" };
  const money = (n: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(n);
  const mer = (v: number | null) =>
    v == null || !Number.isFinite(v) ? "—" : `${v.toFixed(2)}×`;
  const tz = ianaTimezone?.trim() || null;
  const windowDayKey = (instant: Date) =>
    tz ? shopLocalDayKey(instant, tz) : instant.toISOString().slice(0, 10);

  const lines = [
    "Mcfly Analytics — Export memo",
    "============================",
    `Period: ${close.periodLabel}`,
    `Window: ${windowDayKey(close.periodStart)} → ${windowDayKey(close.periodEnd)}`,
    `Saved: ${close.lockedAt.toISOString()}`,
    "",
    "SHOPIFY SALES",
    `  Net sales (after returns): ${money(close.netSales)}`,
    `  Gross sales (Ads Mgr):     ${money(close.grossSales)}`,
    newCustomerNetSales != null && Number.isFinite(newCustomerNetSales)
      ? `  New-customer net:         ${money(newCustomerNetSales)}`
      : null,
    `  Ad spend:                  ${money(close.spend)}`,
    "",
    "EFFICIENCY",
    `  Total ROAS (net÷spend): ${mer(close.mer)}  ← decision number`,
    `  Gross÷spend:            ${mer(grossMer)}  ← Ads Manager–comparable`,
    amer != null
      ? `  ${PRODUCT_NOUN.amer} (new÷spend):      ${mer(amer)}  ← average, not causal`
      : null,
    `  Break-even Total ROAS:  ${mer(close.breakEvenMer)}`,
    close.marginPct != null
      ? `  Contribution margin:    ${(close.marginPct * 100).toFixed(1)}%`
      : null,
    "",
    "DECISION (portfolio affordability — average ≠ marginal)",
    `  ${decision.label}`,
    decision.hint ? `  ${decision.hint}` : null,
    close.cutPct != null ? `  Cut pct: ${close.cutPct}% (≤50% floor)` : null,
    close.decisionNote ? `  Note: ${close.decisionNote}` : null,
    "",
  ].filter((line): line is string => line != null);

  if (pace) {
    lines.push(
      "PACE",
      `  ${pace.statusLabel}`,
      `  Density: ${pace.densityLabel}`,
      `  Safe-spend headroom (period @ rail): ${money(pace.headroomPeriod)}`,
      `  Remaining days: ${pace.remainingDays}`,
      "",
    );
  }

  if (close.deltaSales != null || close.deltaSpend != null || close.deltaMer != null) {
    const deltaLines = [
      "VS PRIOR SAVE",
      close.deltaSales != null ? `  Δ sales: ${money(close.deltaSales)}` : null,
      close.deltaSpend != null ? `  Δ spend: ${money(close.deltaSpend)}` : null,
      close.deltaMer != null ? `  Δ Total ROAS: ${mer(close.deltaMer)}` : null,
      "",
    ].filter((line): line is string => line != null);
    lines.push(...deltaLines);
  }

  lines.push(
    "Religion: Total ROAS = Shopify sales after returns ÷ ad spend.",
    "Gross÷spend is Ads Manager–comparable only — not path credit or “true ROAS.”",
    `Close id: ${close.id}`,
  );

  return `${lines.filter((line): line is string => line != null).join("\n")}\n`;
}

/** Alias for formatCashCloseMemo (internal name kept). */
export const formatTillTruthMemo = formatCashCloseMemo;

/** Live Overview share body — plain text for mailto (clients ignore HTML). */
export type OverviewShareInput = {
  periodLabel: string;
  periodStartDay: string;
  periodEndDay: string;
  /** Shopify Total Sales (currentTotalPriceSet) — after returns. */
  totalSales: number;
  totalSpend: number;
  mer: number | null;
  breakEvenMer: number | null;
  marginPct: number | null;
  spendIncomplete?: boolean;
  /**
   * Closed sales days have not landed yet. A forwarded card must not state
   * "Shopify Total Sales: $0" for a period whose sales are simply unknown.
   */
  salesPending?: boolean;
  shopLabel?: string | null;
  /** Optional period channel mix ($ + share 0–1). */
  channels?: Array<{ name: string; amount: number; share: number }>;
  salesDeltaLine?: string | null;
  spendDeltaLine?: string | null;
};

export function formatOverviewShareText(input: OverviewShareInput): string {
  const money = (n: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(n);
  const mer = (v: number | null) =>
    v == null || !Number.isFinite(v) ? "—" : `${v.toFixed(2)}×`;

  const lines: string[] = [
    input.shopLabel?.trim()
      ? `Total ROAS — ${input.shopLabel.trim()}`
      : "Total ROAS",
    input.periodLabel,
    `${input.periodStartDay} → ${input.periodEndDay}`,
    "",
    `Total ROAS: ${mer(input.mer)}`,
  ];

  if (input.breakEvenMer != null && Number.isFinite(input.breakEvenMer)) {
    lines.push(`Break-even: ${mer(input.breakEvenMer)}`);
  }

  lines.push(
    "",
    input.salesPending
      ? "Shopify Total Sales: still loading (not $0)"
      : `Shopify Total Sales: ${money(input.totalSales)}`,
  );
  if (!input.salesPending && input.salesDeltaLine?.trim()) {
    lines.push(`  ${input.salesDeltaLine.trim()}`);
  }

  lines.push("", `Total Spend: ${money(input.totalSpend)}`);
  if (input.spendDeltaLine?.trim()) {
    lines.push(`  ${input.spendDeltaLine.trim()}`);
  }

  const channels = (input.channels ?? [])
    .filter((c) => c.amount > 0)
    .slice(0, 8);
  if (channels.length > 0) {
    lines.push("");
    for (const c of channels) {
      const pct = Number.isFinite(c.share)
        ? `${(c.share * 100).toFixed(0)}%`
        : "—";
      lines.push(`  ${c.name}: ${money(c.amount)} · ${pct}`);
    }
  }

  if (input.spendIncomplete) {
    lines.push("", "Note: spend coverage incomplete for this period.");
  }

  lines.push("", "Total ROAS = Shopify Total Sales ÷ ad spend");

  return `${lines.join("\n")}\n`;
}
