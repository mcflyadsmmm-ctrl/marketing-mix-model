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

/** Empty coverage cell → typed-day form with that date filled. */
export function spendFillDayHref(
  dateKey: string,
  opts: DeskNavOpts = {},
): string {
  return deskNavHref("/app/spend", {
    ...opts,
    extra: { ...opts.extra, date: dateKey },
    hash: "mcfly-spend-add",
  });
}

/** CSV / Ads Manager export drawer (coverage holes, many days). */
export const SPEND_CSV_HREF = "/app/spend/import#mcfly-spend-csv";

export const NUMBER_HONESTY = {
  panelLabel: "How this number is built",
  formula: "Shopify Total Sales ÷ spend you added",
  empty:
    "Add spend to see sales ÷ spend. Empty spend is not 0× Total ROAS.",
  csvHint:
    "Type one day’s amount or paste an Ads Manager CSV.",
  orderWindow:
    "Shopify sales on this install cover about the last 60 days (read_orders). Older years are outside that window — not $0.",
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
  currency: string;
}): string | null {
  const { sales, spend, mer, salesPending = false, currency } = opts;
  if (!(spend > 0) || !Number.isFinite(spend)) return null;
  if (salesPending) {
    return `${formatCurrency(spend, currency)} spend saved · sales still loading`;
  }
  if (!Number.isFinite(sales)) return null;
  const left = `${formatCurrency(sales, currency)} sales ÷ ${formatCurrency(spend, currency)} spend`;
  if (mer == null || !Number.isFinite(mer)) return left;
  return `${left} = ${formatMer(mer)}×`;
}

/**
 * Coverage hint under the day table. When the header equation is on file,
 * quote that equation for the named window — do not add a second ratio.
 */
export function spendCoverageQuote(opts: {
  caption: string;
  windowLabel: string;
  equation: string | null;
}): string {
  const window = opts.windowLabel.trim();
  if (opts.equation) {
    return window
      ? `${opts.caption}. ${window}: ${opts.equation}.`
      : `${opts.caption}. ${opts.equation}.`;
  }
  return opts.caption;
}

/**
 * Clipboard line for the Spend first fold. Empty spend copies nothing.
 * Pending copies the loading line, not $0. Never copies 0×.
 */
export function spendPairCopyText(opts: {
  sales: number;
  spend: number;
  mer: number | null;
  salesPending?: boolean;
  currency: string;
}): string | null {
  const { spend, salesPending = false } = opts;
  if (!(spend > 0) || !Number.isFinite(spend)) return null;
  if (salesPending) return NUMBER_HONESTY.salesPending;
  const mer =
    opts.mer != null && Number.isFinite(opts.mer) && opts.mer > 0
      ? opts.mer
      : null;
  return formatTotalRoasEquation({
    sales: opts.sales,
    spend,
    mer,
    salesPending: false,
    currency: opts.currency,
  });
}

/** Retainer / billboard / named-other dollars — not Meta/Google/TikTok. */
export function isNonOnlineSpendChannel(channel: string): boolean {
  return channel === "other" || channel.startsWith("other:");
}

export function hasNonOnlineSpendOnFile(
  rows: ReadonlyArray<{ channel: string; amount: number }>,
): boolean {
  return rows.some(
    (row) => isNonOnlineSpendChannel(row.channel) && row.amount > 0,
  );
}

/**
 * Second labeled Spend line: Online Shopify Total Sales ÷ every typed dollar.
 * Withholds the multiple when retainers / billboards sit next to ads.
 * Does not replace Total ROAS. POS / Shop are named as excluded, not attributed.
 */
export function formatOnlineRoasLine(opts: {
  totalSales: number;
  spend: number;
  mix: {
    online: number;
    pos: number;
    shop: number;
    other: number;
  } | null;
  currency: string;
  hasNonOnlineSpend?: boolean;
}): string | null {
  const { totalSales, spend, mix, currency, hasNonOnlineSpend = false } = opts;
  if (!(spend > 0) || !Number.isFinite(spend)) return null;
  const excluded =
    "POS and Shop sales are excluded from this line, not from Total ROAS.";
  const denom =
    `${formatCurrency(spend, currency)} every typed dollar (ads, retainers, billboards)`;
  if (hasNonOnlineSpend) {
    return `Online-only ratio stays — because typed spend includes retainers and other non-ads dollars, not ads only. Total ROAS above uses every typed dollar. ${excluded}`;
  }
  if (
    mix == null ||
    !Number.isFinite(mix.online) ||
    !Number.isFinite(totalSales)
  ) {
    return `Online Shopify Total Sales stays — until Online / POS / Shop mix is on file. ${excluded}`;
  }
  const onlineSales = totalSales * mix.online;
  if (!(onlineSales > 0) || !Number.isFinite(onlineSales)) {
    return `Online Shopify Total Sales ÷ ${denom} is — (no Online sales on file). ${excluded}`;
  }
  const mer = onlineSales / spend;
  if (!Number.isFinite(mer) || mer <= 0) {
    return `Online ${formatCurrency(onlineSales, currency)} ÷ ${denom}. ${excluded}`;
  }
  return `Online ${formatCurrency(onlineSales, currency)} ÷ ${denom} = ${formatMer(mer)}×. ${excluded}`;
}
