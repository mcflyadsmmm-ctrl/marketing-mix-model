import {
  computeTotals,
  lastNCertifiedRows,
  merDays,
  type CertifiedDay,
} from "./mer-control";

export type YoyCompareRow = {
  label: string;
  sales: number;
  priorSales: number | null;
  spend: number;
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

  return {
    label: "Last 7 vs prior 7",
    sales: current.sales,
    priorSales: prior?.sales ?? null,
    spend: current.spend,
    priorSpend: prior?.spend ?? null,
    mer: current.mer,
    priorMer: prior?.mer ?? null,
  };
}
