import { parseShopCurrencyCode } from "./spend-money";

/** Painted dollars. Missing/invalid shop currency is —, never silent USD. */
export function formatCurrency(amount: number, currency: string): string {
  const code = parseShopCurrencyCode(currency);
  if (!code) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: code,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function createMoneyFormatter(
  currency: string | null | undefined,
): (amount: number) => string {
  const code = parseShopCurrencyCode(currency) ?? "";
  return (amount: number) => formatCurrency(amount, code);
}

export function formatMoneyOrDash(
  amount: number | null | undefined,
  currency: string,
): string {
  if (amount == null || !Number.isFinite(amount)) return "—";
  return formatCurrency(amount, currency);
}

/** Spend desk amounts — shop currency, cents when the ISO code uses them. */
export function formatSpendAmount(amount: number, currency: string): string {
  const code = parseShopCurrencyCode(currency);
  if (!code) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: code,
  }).format(amount);
}

export function formatMer(value: number | null): string {
  if (value === null) return "—";
  return value.toFixed(2);
}

export function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

/** Calm desk timestamp for freshness / last-updated lines. */
export function formatFreshness(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

/**
 * Sales $ still needed (positive) or surplus (negative) to hit target ME at
 * current spend. null when target/spend can't form a cash gap.
 */
export function salesGapToTargetMe(opts: {
  sales: number;
  totalSpend: number;
  targetMer: number;
}): number | null {
  const { sales, totalSpend, targetMer } = opts;
  if (!(targetMer > 0) || !(totalSpend > 0)) return null;
  return totalSpend * targetMer - sales;
}

/** Vs-target MER bands — desk delta + explorer tip tone. Never prior-period. */
export function merToneBand(
  mer: number | null,
  rail: number | null,
): "up" | "down" | "flat" {
  if (mer == null || rail == null || !(rail > 0)) return "flat";
  if (mer >= rail) return "up";
  if (mer >= rail * 0.85) return "flat";
  return "down";
}
