/**
 * Honest Live copy for the reconciliation desk.
 * Loading and failed reads never become a sales zero.
 * A trial end is printed only from a timestamp the caller already has.
 */

import { formatMer } from "./mer-format";
import type { ReadStatus } from "./reconciliation-gap";

export const LOADING_ORDERS = "Loading your Shopify order history.";
export const FAILED_LOAD = "This load failed. Sales are not zero.";
export const PRIOR_YEAR_MISSING = "No comparable history loaded for last year.";
export const LTV_UNAVAILABLE = "Customer LTV is not available with Live data yet. Same on trial and paid.";
export const EMPTY_SPEND_NOTE = "Order reports stay usable.";
export const PARTIAL_SPEND_NOTE = "This ratio only covers the spend you entered.";
export const FULL_SPEND_NOTE = "Shopify sales divided by the spend you entered.";

export function loadedRange(since: string, until: string): string | null {
  if (!since || !until) return null;
  return `${since} – ${until}`;
}

export function loadingLine(
  windows: Array<{ status: ReadStatus; since: string; until: string }>,
): string | null {
  const loading = windows.filter((window) => window.status === "loading");
  if (loading.length === 0) return null;
  const ranges = loading
    .map((window) => loadedRange(window.since, window.until))
    .filter((range): range is string => range != null);
  if (ranges.length === 0) return LOADING_ORDERS;
  return `${LOADING_ORDERS} ${ranges.join(" · ")}`;
}

export function emptyOrdersLine(since: string, until: string): string {
  const dates = since && until ? `${since} to ${until}` : "the selected dates";
  return `No orders from ${dates}. Change the dates. Adding spend will not change the orders.`;
}

export function liveHeaderRange(
  windows: Array<{ since: string; until: string }>,
): string | null {
  const ranges = windows
    .map((window) => loadedRange(window.since, window.until))
    .filter((range): range is string => range != null);
  return ranges.length > 0 ? ranges.join(" · ") : null;
}

export function totalRoasDisplay(roas: number | null): string {
  if (roas == null || !Number.isFinite(roas)) return "—";
  return `${formatMer(roas)}×`;
}

export function spendNote(input: {
  spendEntered: boolean;
  spendPartial: boolean;
  totalRoas: number | null;
}): string {
  const shown =
    input.spendEntered &&
    input.totalRoas != null &&
    Number.isFinite(input.totalRoas);
  if (!shown) return EMPTY_SPEND_NOTE;
  if (input.spendPartial) return PARTIAL_SPEND_NOTE;
  return FULL_SPEND_NOTE;
}

/** Real ISO only. A missing or unparseable value stays off the desk. */
export function trialEndLine(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const time = new Date(iso).getTime();
  if (!Number.isFinite(time)) return null;
  const stamp = new Date(time).toISOString();
  return `Trial ends ${stamp}. Then $39/store/month. Uninstall before that time to avoid the first charge.`;
}
