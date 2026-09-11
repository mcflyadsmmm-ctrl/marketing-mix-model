import type { ControlPace } from "../lib/mer-dashboard.server";
import { formatCurrency } from "../lib/mer-format";

type Props = {
  control: ControlPace;
  periodLabel: string;
  /** Only show safe-spend headroom when the target rail is confirmed. */
  showHeadroom: boolean;
};

/**
 * Lean period pace — calendar vs sales, density, optional headroom.
 * Surfaces ControlPace already computed for Overview (was unused on the page).
 */
export function PeriodPaceStrip({
  control,
  periodLabel,
  showHeadroom,
}: Props) {
  if (control.daysInPeriod <= 0) return null;

  const salesPct = Math.round(control.salesProgressPct);
  const calendarPct = Math.round(control.calendarProgressPct);
  const salesWidth = Math.min(100, Math.max(0, salesPct));
  const calendarWidth = Math.min(100, Math.max(0, calendarPct));

  return (
    <section
      className={`mcfly-pace-strip mcfly-pace-strip--${control.progressCls}`}
      aria-label="Period pace"
    >
      <div className="mcfly-pace-strip__head">
        <p className="mcfly-pace-strip__kicker">Pace · {periodLabel}</p>
        <h2 className="mcfly-pace-strip__title">{control.statusLabel}</h2>
      </div>

      <div className="mcfly-pace-strip__facts">
        <div>
          <p className="mcfly-pace-strip__label">Days</p>
          <p className="mcfly-pace-strip__value">{control.densityLabel}</p>
        </div>
        <div>
          <p className="mcfly-pace-strip__label">Sales progress</p>
          <p className="mcfly-pace-strip__value">{salesPct}%</p>
        </div>
        <div>
          <p className="mcfly-pace-strip__label">Calendar</p>
          <p className="mcfly-pace-strip__value">{calendarPct}%</p>
        </div>
        {showHeadroom ? (
          <div>
            <p className="mcfly-pace-strip__label">Safe spend left</p>
            <p className="mcfly-pace-strip__value">
              {formatCurrency(control.headroomPeriod)}
            </p>
          </div>
        ) : null}
      </div>

      <div className="mcfly-pace-strip__bars">
        <div className="mcfly-pace-strip__bar">
          <span className="mcfly-pace-strip__bar-label" id="mcfly-pace-sales">
            Sales
          </span>
          <span
            className="mcfly-pace-strip__track"
            role="progressbar"
            aria-labelledby="mcfly-pace-sales"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={salesWidth}
            aria-valuetext={`${salesPct}% of target-path sales`}
          >
            <span
              className="mcfly-pace-strip__fill mcfly-pace-strip__fill--sales"
              style={{ width: `${salesWidth}%` }}
            />
          </span>
        </div>
        <div className="mcfly-pace-strip__bar">
          <span className="mcfly-pace-strip__bar-label" id="mcfly-pace-cal">
            Days
          </span>
          <span
            className="mcfly-pace-strip__track"
            role="progressbar"
            aria-labelledby="mcfly-pace-cal"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={calendarWidth}
            aria-valuetext={`${calendarPct}% of period elapsed`}
          >
            <span
              className="mcfly-pace-strip__fill mcfly-pace-strip__fill--cal"
              style={{ width: `${calendarWidth}%` }}
            />
          </span>
        </div>
      </div>

      {control.remainingDays > 0 && showHeadroom ? (
        <p className="mcfly-pace-strip__hint">
          {control.remainingDays} day
          {control.remainingDays === 1 ? "" : "s"} left ·{" "}
          {formatCurrency(control.dailySalesNeeded)} sales/day holds the
          period on plan at the current spend pace.
        </p>
      ) : control.remainingDays > 0 ? (
        <p className="mcfly-pace-strip__hint">
          {control.remainingDays} day
          {control.remainingDays === 1 ? "" : "s"} left in {periodLabel}.
          Confirm a target MER in Settings to unlock safe-spend headroom.
        </p>
      ) : null}
    </section>
  );
}
