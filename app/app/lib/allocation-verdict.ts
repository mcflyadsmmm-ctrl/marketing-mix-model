/**
 * Merchant-facing labels for allocation actions already computed by mer-core.
 * Religion: Total ROAS = sales ÷ spend; hold / reduce / step-test — not path credit.
 */

import type { AllocationAction } from "@mcfly/mer-core";

/** Short badge for each computed action type. */
export function allocationActionLabel(
  type: AllocationAction["type"],
): string {
  switch (type) {
    case "hold":
      return "Hold";
    case "cut":
      return "Step-test reduce";
    case "shift":
      return "Shift";
    case "watch":
      return "Watch";
    default: {
      const _exhaustive: never = type;
      return _exhaustive;
    }
  }
}

/** Format optional percentChange (engine uses negative for cuts). */
export function formatAllocationPercentChange(
  percentChange: number | undefined,
): string | null {
  if (percentChange == null || !Number.isFinite(percentChange)) {
    return null;
  }
  const rounded = Math.round(percentChange);
  if (rounded === 0) return null;
  return `${rounded > 0 ? "+" : ""}${rounded}%`;
}
