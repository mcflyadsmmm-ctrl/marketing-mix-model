/**
 * Merchant-facing spend upload examples. Keep this client-safe (no Prisma).
 * Religion: Day + dollars spent. Sales stay in Shopify.
 */

export const LONG_FORMAT_EXAMPLE = `date,channel,amount
2026-08-01,Meta,120.00
2026-08-01,Google,80.00
2026-08-02,Meta,95.50
2026-08-02,Google,70.00`;

export const META_NATIVE_EXAMPLE = `Day,Amount spent
2026-08-01,120.00
2026-08-02,95.50`;

export const CSV_CLEANUP_HINT =
  "If your file has Campaign, Results, or a Total row, delete those. Keep one row per day and the dollars you spent.";

export function formatTemplatePreviewCsv(
  headers: string[],
  rows: string[][],
): string {
  const headerLine = headers.join(",");
  const body = rows.map((row) => row.join(",")).join("\n");
  return body ? `${headerLine}\n${body}` : headerLine;
}
