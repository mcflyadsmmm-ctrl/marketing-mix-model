/**
 * Spend dollars on the desk: missing is not a certified $0.
 * Wave 4 tombstones ($0 manual rows after delete) still sum as 0 via sumSpend
 * and stay distinct from "no spend entered."
 */

import { formatCurrency } from "./mer-format";

export const NO_SPEND_ENTERED = "no spend entered — not a certified $0";

export function hasSpendOnFile(amount: number | null | undefined): boolean {
  return amount != null && Number.isFinite(amount) && amount > 0;
}

/** KPI / snap paint: — when nothing is on file, never formatCurrency(0). */
export function formatSpendOnFile(amount: number, currency: string): string {
  if (!hasSpendOnFile(amount)) return "—";
  return formatCurrency(amount, currency);
}

export function spendOnFileHint(amount: number): string {
  return hasSpendOnFile(amount)
    ? "Entered ad spend"
    : NO_SPEND_ENTERED;
}
