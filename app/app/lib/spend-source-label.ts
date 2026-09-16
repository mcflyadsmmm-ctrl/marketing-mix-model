/**
 * Merchant-facing spend truth labels.
 * Recurring is a daily rate that fills empty days; typed/CSV stay as written.
 */

export function spendEntrySourceLabel(source: string | null | undefined): string {
  const raw = String(source || "").toLowerCase().trim();
  if (raw === "recurring") return "Daily rate";
  if (raw === "csv" || raw === "meta" || raw === "google") return "Uploaded";
  if (raw === "sample") return "Sample";
  return "Typed";
}
