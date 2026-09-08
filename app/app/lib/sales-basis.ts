/**
 * Sales basis for Total ROAS numerator — Total Sales (default) or Net Sales view.
 */

import type { SalesBasisPreference } from "./product-labels";
import { isSalesBasisPreference } from "./product-labels";

export type { SalesBasisPreference };

export function parseSalesBasis(
  value: unknown,
  fallback: SalesBasisPreference = "total",
): SalesBasisPreference {
  if (isSalesBasisPreference(value)) return value;
  if (typeof value === "string") {
    const v = value.trim().toLowerCase();
    if (isSalesBasisPreference(v)) return v;
  }
  return fallback;
}

/**
 * Pick action sales for MER given desk preference.
 * Total Sales always available; Net requires known subtotal (null → fall back to total + flag).
 */
export function actionSalesForBasis(
  input: {
    totalSales: number;
    netSales: number | null | undefined;
    netSalesKnown?: boolean;
  },
  basis: SalesBasisPreference,
): {
  sales: number;
  basisUsed: SalesBasisPreference;
  netUnavailable: boolean;
} {
  if (basis === "net") {
    const known =
      input.netSalesKnown !== false &&
      input.netSales != null &&
      Number.isFinite(input.netSales);
    if (known) {
      return {
        sales: input.netSales as number,
        basisUsed: "net",
        netUnavailable: false,
      };
    }
    return {
      sales: input.totalSales,
      basisUsed: "total",
      netUnavailable: true,
    };
  }
  return {
    sales: input.totalSales,
    basisUsed: "total",
    netUnavailable: false,
  };
}
