import {
  computeTotals,
  lastNCertifiedRows,
  merDays,
  type CertifiedDay,
} from "./mer-control";

export type YoyCompareRow = {
  label: string;
  sales: number | null;
  priorSales: number | null;
  spend: number | null;
  priorSpend: number | null;
  mer: number | null;
  priorMer: number | null;
};

/** Shopify Analytics is this period only; this page is operating compare. */
export const YOY_ANALYTICS_LEDE =
  "Shopify Analytics shows this period's sales. This page shows this month vs last month vs last year plus last 7.";

export type OperatingMonthId = "thisMonth" | "lastMonth" | "lastYear";

export type OperatingMonthRow = {
  id: OperatingMonthId;
  label: string;
  sales: number | null;
  spend: number | null;
  mer: number | null;
};

const OPERATING_MONTH_LABELS: Record<OperatingMonthId, string> = {
  thisMonth: "This month",
  lastMonth: "Last month",
  lastYear: "This month last year",
};

const OPERATING_MONTH_IDS: OperatingMonthId[] = [
  "thisMonth",
  "lastMonth",
  "lastYear",
];

export function operatingMonthRows(
  scores: Array<{
    id: string;
    sales: number;
    spend: number;
    mer: number | null;
  }>,
): OperatingMonthRow[] {
  const byId = new Map(scores.map((row) => [row.id, row]));
  return OPERATING_MONTH_IDS.map((id) => {
    const row = byId.get(id);
    return {
      id,
      label: OPERATING_MONTH_LABELS[id],
      sales: row?.sales ?? null,
      spend: row ? row.spend : null,
      mer: row?.mer ?? null,
    };
  });
}

export function yoyDisplayValue(
  value: number | null | undefined,
  format: (n: number) => string,
): string {
  return value == null ? "—" : format(value);
}

export function last7VsPrior7(days: CertifiedDay[]): YoyCompareRow {
  const eligible = merDays(days);
  const currentRows = lastNCertifiedRows(eligible, 7);
  const priorRows = lastNCertifiedRows(
    eligible.slice(0, Math.max(0, eligible.length - currentRows.length)),
    7,
  );
  const current = computeTotals(currentRows);
  const prior = priorRows.length > 0 ? computeTotals(priorRows) : null;

  const hasCurrent = currentRows.length > 0;

  return {
    label: "Last 7 vs prior 7",
    sales: hasCurrent ? current.sales : null,
    priorSales: prior?.sales ?? null,
    spend: hasCurrent ? current.spend : null,
    priorSpend: prior?.spend ?? null,
    mer: hasCurrent ? current.mer : null,
    priorMer: prior?.mer ?? null,
  };
}
