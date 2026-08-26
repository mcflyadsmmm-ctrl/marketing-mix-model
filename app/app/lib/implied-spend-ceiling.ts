/**
 * Implied spend ceiling for a sales goal at the target Total ROAS rail.
 * salesGoal ÷ targetMer — no DB column; derived for month rows / Free pace.
 * Client-safe (Goals table rows).
 */

import { formatMer } from "./mer-format";

export function impliedSpendCeiling(
  salesGoal: number,
  targetMer: number | null | undefined,
): number | null {
  if (!(salesGoal > 0) || !Number.isFinite(salesGoal)) return null;
  if (targetMer == null || !Number.isFinite(targetMer) || !(targetMer > 0)) {
    return null;
  }
  return salesGoal / targetMer;
}

/** Period tile uses actual sales; year rows use the typed sales goal. */
export type SpendCeilingBasis = "period_sales" | "sales_goal";

export function impliedSpendCeilingCaption(
  basis: SpendCeilingBasis,
  targetMer: number,
): string {
  const mer = formatMer(targetMer);
  switch (basis) {
    case "period_sales":
      return `This period's Shopify sales ÷ ${mer}× target. Max spend to hold that Total ROAS — not a bid cap. Example: $80k sales at ${mer}× → do not spend more than the ceiling.`;
    case "sales_goal":
      return `Sales goal ÷ ${mer}× target. Max you can spend that month and still hit the goal. Not net profit.`;
    default: {
      const _exhaustive: never = basis;
      return _exhaustive;
    }
  }
}
