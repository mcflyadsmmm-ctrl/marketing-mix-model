import type { ControlPace } from "../lib/mer-dashboard.server";
import { formatCurrency, formatMer } from "../lib/mer-format";
import { PRODUCT_NOUN } from "../lib/product-labels";

type Props = {
  sales: number;
  spend: number;
  mer: number | null;
  targetMer: number;
  /** Human period title — e.g. "Month to date". */
  heading: string;
  periodLabel: string;
  control: ControlPace;
};

/** Total ROAS hero is always truth-green when finite — never alarm for below target. */
function gaugeTone(mer: number | null): string {
  if (mer === null || !Number.isFinite(mer)) return "#94a3b8";
  return "#059669";
}

/**
 * Apps Script Monthly pacing — semi gauge + 6 compact KPI tiles + pace bars.
 * Total ROAS noun; math from ControlPace (till sales ÷ spend).
 */
export function MonthlyPacing({
  sales,
  spend,
  mer,
  targetMer,
  heading,
  periodLabel,
  control,
}: Props) {
  const mtdMer = mer ?? 0;
  const stroke = gaugeTone(mer);
  const maxMer = Math.max(
    6,
    Math.ceil(mtdMer || 0),
    Math.ceil(targetMer) + 1,
  );
  const currentPct = Math.min(
    100,
    Math.max(0, ((mer ?? 0) / maxMer) * 100),
  );
  const targetPct = targetMer > 0 ? (targetMer / maxMer) * 100 : 0;

  const radius = 80;
  const cx = 120;
  const cy = 110;
  const circumference = Math.PI * radius;
  const offset = circumference - (currentPct / 100) * circumference;

  const targetAngleDeg = 180 - (targetPct / 100) * 180;
  const targetAngleRad = (targetAngleDeg * Math.PI) / 180;
  const x1 = cx + 71 * Math.cos(targetAngleRad);
  const y1 = cy - 71 * Math.sin(targetAngleRad);
  const x2 = cx + 89 * Math.cos(targetAngleRad);
  const y2 = cy - 89 * Math.sin(targetAngleRad);

  const avgDailySales =
    control.daysElapsed > 0 ? sales / control.daysElapsed : 0;
  const salesPct = Math.round(control.salesProgressPct);
  const calendarPct = Math.round(control.calendarProgressPct);

  return (
    <section
      className="mcfly-panel mcfly-pacing"
      aria-label={`${heading} pacing`}
    >
      <div className="mcfly-panel__head">
        <h2>{heading}</h2>
        <p className="mcfly-panel__muted">
          {periodLabel} · target {formatMer(targetMer)}
        </p>
      </div>

      <div className="mcfly-pacing__grid">
        <div className="mcfly-pacing__gauge">
          <svg
            viewBox="0 0 240 130"
            width="200"
            height="110"
            aria-hidden="true"
          >
            <path
              d="M 40 110 A 80 80 0 0 1 200 110"
              fill="none"
              stroke="#e2e8f0"
              strokeWidth="14"
              strokeLinecap="round"
            />
            <path
              d="M 40 110 A 80 80 0 0 1 200 110"
              fill="none"
              stroke={stroke}
              strokeWidth="14"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
            />
            {targetMer > 0 ? (
              <line
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="#0f172a"
                strokeWidth="2"
              />
            ) : null}
          </svg>
          <p className="mcfly-pacing__gauge-value" style={{ color: stroke }}>
            {mer === null ? "—.——" : formatMer(mer)}
          </p>
          <p className="mcfly-pacing__gauge-label">
            {PRODUCT_NOUN.totalRoas}
          </p>
        </div>

        <div className="mcfly-pacing__right">
          <div className="mcfly-pacing__stats">
            <div className="mcfly-pacing__stat">
              <p className="mcfly-pacing__k">Sales</p>
              <p className="mcfly-pacing__v">{formatCurrency(sales)}</p>
            </div>
            <div className="mcfly-pacing__stat">
              <p className="mcfly-pacing__k">Spend</p>
              <p className="mcfly-pacing__v">{formatCurrency(spend)}</p>
            </div>
            <div className="mcfly-pacing__stat">
              <p className="mcfly-pacing__k">Days elapsed</p>
              <p className="mcfly-pacing__v">{control.densityLabel}</p>
            </div>
            <div className="mcfly-pacing__stat">
              <p className="mcfly-pacing__k">Avg daily sales</p>
              <p className="mcfly-pacing__v">
                {formatCurrency(avgDailySales)}
              </p>
            </div>
            <div className="mcfly-pacing__stat">
              <p className="mcfly-pacing__k">Projected period spend</p>
              <p className="mcfly-pacing__v">
                {formatCurrency(control.projSpend)}
              </p>
            </div>
            <div className="mcfly-pacing__stat">
              <p className="mcfly-pacing__k">Daily sales needed</p>
              <p className="mcfly-pacing__v">
                {control.remainingDays > 0
                  ? formatCurrency(control.dailySalesNeeded)
                  : "—"}
              </p>
            </div>
          </div>

          <div className="mcfly-pacing__bars">
            <div className="mcfly-pacing__bar-row">
              <span>Sales vs target pace</span>
              <span>{salesPct}%</span>
            </div>
            <div className="mcfly-pacing__track" aria-hidden="true">
              <div
                className={`mcfly-pacing__fill mcfly-pacing__fill--${control.progressCls}`}
                style={{ width: `${salesPct}%` }}
              />
            </div>
            <div className="mcfly-pacing__bar-row">
              <span>Period progress</span>
              <span>{calendarPct}%</span>
            </div>
            <div className="mcfly-pacing__track" aria-hidden="true">
              <div
                className="mcfly-pacing__fill mcfly-pacing__fill--calendar"
                style={{ width: `${calendarPct}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
