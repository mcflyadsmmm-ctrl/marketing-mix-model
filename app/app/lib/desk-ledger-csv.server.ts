import { serializeLedgerCsv } from "./desk-ledger-pulse";

export function ledgerCsvResponse(
  filename: string,
  columns: { key: string; label: string }[],
  rows: Record<string, string>[],
): Response {
  const body = serializeLedgerCsv(columns, rows);
  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
