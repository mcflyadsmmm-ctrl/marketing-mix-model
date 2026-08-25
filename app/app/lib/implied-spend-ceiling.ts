/**
 * Implied spend ceiling for a sales goal at the target Total ROAS rail.
 * salesGoal ÷ targetMer — no DB column; derived for month rows / Free pace.
 * Client-safe (Goals table rows).
 */
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
