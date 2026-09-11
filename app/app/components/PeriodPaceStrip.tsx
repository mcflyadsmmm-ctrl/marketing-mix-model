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
 * Not the old MonthlyPacing gauge panel.
 */
export function PeriodPaceStrip({
  control,
  periodLabel,
  showHeadroom,
}: Props) {
  if (control.daysInPeriod <= 0) return null;

  const salesPct = Math.round(control.salesProgressPct);
  const calendarPct = Math.round(control.calendarProgressPct);

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
          <p className="mcfly-pace-strip__label">Sales vs target path</p>
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

      <div className="mcfly-pace-strip__bars" aria-hidden="true">
        <div className="mcfly-pace-strip__bar">
          <span className="mcfly-pace-strip__bar-label">Sales</span>
          <span className="mcfly-pace-strip__track">
            <span
              className="mcfly-pace-strip__fill mcfly-pace-strip__fill--sales"
              style={{ width: `${Math.min(100, Math.max(0, salesPct))}%` }}
            />
          </span>
        </div>
        <div className="mcfly-pace-strip__bar">
          <span className="mcfly-pace-strip__bar-label">Days</span>
          <span className="mcfly-pace-strip__track">
            <span
              className="mcfly-pace-strip__fill mcfly-pace-strip__fill--cal"
              style={{ width: `${Math.min(100, Math.max(0, calendarPct))}%` }}
            />
          </span>
        </div>
      </div>

      {control.remainingDays > 0 && showHeadroom ? (
        <p className="mcfly-pace-strip__hint">
          {control.remainingDays} day
          {control.remainingDays === 1 ? "" : "s"} left ·{" "}
          {formatCurrency(control.dailySalesNeeded)} sales/day keeps the
          period on the target rail at current spend pace.
        </p>
      ) : null}
    </section>
  );
}
