import { formatCurrency, formatMer } from "../lib/mer-format";
import { useDeskCurrency } from "../lib/desk-currency";
import {
  dualCloseLineModel,
  type DualClose,
  type DualCloseLineModel,
} from "../lib/mer-control";

function merLabel(mer: number | null, spend: number): string {
  if (!(spend > 0) || mer == null) return "—";
  return `${formatMer(mer)}×`;
}

function lastNLabel(n: number): string {
  if (n === 1) return "last 1 day";
  return `last ${n} days`;
}

function closeStatus(model: DualCloseLineModel): string {
  const goal = `${formatMer(model.targetMer)}×`;
  const recent =
    model.paceDays === 1
      ? "Last 1 day's close"
      : `Last ${model.paceDays} days' close`;
  if (model.monthRateHitsGoal && model.last7RateHitsGoal) {
    return `Both closes stay at or above ${goal} goal.`;
  }
  if (model.monthRateHitsGoal && !model.last7RateHitsGoal) {
    return `${recent} is below ${goal} goal.`;
  }
  if (!model.monthRateHitsGoal && model.last7RateHitsGoal) {
    return `This month's daily-rate close is below ${goal} goal.`;
  }
  return `Both closes are below ${goal} goal.`;
}

/**
 * Dual-close sentence for Total ROAS. Hidden at $0 spend or month-end.
 * Rates use entered spend only — empty windows stay —, never 0×.
 */
export function DualCloseLine({
  close,
  targetMer,
}: {
  close: DualClose | null;
  targetMer: number;
}) {
  const currency = useDeskCurrency();
  const model = dualCloseLineModel(close, targetMer);
  if (!model) return null;
  const daysLeft =
    model.remainingDays === 1
      ? "1 day left in this month."
      : `${model.remainingDays} days left in this month.`;
  const recentHold =
    model.paceDays === 1
      ? "If last 1 day holds"
      : `If ${lastNLabel(model.paceDays)} hold`;

  return (
    <p className="mcfly-dual-close mcfly-dual-close--soft">
      {daysLeft} If the rest of this month matches this month so far:{" "}
      {formatCurrency(model.monthRateSales, currency)} sales at{" "}
      {merLabel(model.monthRateMer, model.monthRateSpend)}. {recentHold}:{" "}
      {formatCurrency(model.last7RateSales, currency)} at{" "}
      {merLabel(model.last7RateMer, model.last7RateSpend)}. {closeStatus(model)}{" "}
      Dual-close uses entered spend only.
    </p>
  );
}
