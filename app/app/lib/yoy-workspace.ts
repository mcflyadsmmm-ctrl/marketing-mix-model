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
