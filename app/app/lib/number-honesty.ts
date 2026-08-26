/**
 * Merchant-facing honesty for Total ROAS, billing, and spend-in.
 * Client-safe. Keep “true ROAS”, pixels, and competitor names out of chrome.
 */

import { deskNavHref, type DeskNavOpts } from "./desk-nav";
import { formatCurrency, formatMer } from "./mer-format";

/** Primary Spend CTA — one-day invoice entry, not the CSV drawer. */
export const SPEND_ADD_HREF = "/app/spend#mcfly-spend-add";

/** Same Add spend deep link, keeping the Overview/Goals/LTV date slicer. */
export function spendAddHref(opts: DeskNavOpts = {}): string {
  return deskNavHref("/app/spend", { ...opts, hash: "mcfly-spend-add" });
}

/** CSV / Ads Manager export drawer (coverage holes, many days). */
export const SPEND_CSV_HREF = "/app/spend#mcfly-spend-uploads";

export const NUMBER_HONESTY = {
  panelLabel: "How this number is built",
  formula: "Shopify Total Sales ÷ spend you added",
  empty:
    "Add spend to see sales ÷ spend. Empty spend is not 0× Total ROAS.",
  /** Spend is in, closed sales days have not landed yet. Unknown ≠ zero. */
  salesPending:
    "Your spend is saved. Shopify sales for these dates are still loading — unknown is not $0, so Total ROAS waits instead of showing 0×.",
  isLine:
    "Shopify Total Sales for these dates (after returns) ÷ every dollar you typed, pasted, or uploaded — including billboards and retainers.",
  isNotLine:
    "Not platform ROAS. Not net profit. Not which ad to scale. Ads Manager will show a different number because it counts clicks, not Shopify Total Sales.",
  invoiceHint:
    "Type the invoice amount — Ads Manager, a billboard bill, or an agency retainer.",
} as const;

/**
 * Visible equation for Overview. Null when spend is missing so we never
 * paint 0× as a real Total ROAS.
 *
 * `salesPending` means closed sales days have not landed yet: the sales side
 * is unknown rather than $0, so the equation shows the spend the merchant
 * actually entered and withholds the ratio.
 */
export function formatTotalRoasEquation(opts: {
  sales: number;
  spend: number;
  mer: number | null;
  salesPending?: boolean;
}): string | null {
  const { sales, spend, mer, salesPending = false } = opts;
  if (!(spend > 0) || !Number.isFinite(spend)) return null;
  if (salesPending) {
    return `${formatCurrency(spend)} spend saved · sales still loading`;
  }
  if (!Number.isFinite(sales)) return null;
  const left = `${formatCurrency(sales)} sales ÷ ${formatCurrency(spend)} spend`;
  if (mer == null || !Number.isFinite(mer)) return left;
  return `${left} = ${formatMer(mer)}×`;
}
