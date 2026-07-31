/**
 * Semi-circle Total ROAS gauge — pure SVG, no chart library.
 * Current ROAS fills the arc; value sits inside the dial; target is a small arc label.
 * Clear definition sits beside the dial.
 */

import { formatMer } from "../lib/mer-format";
import { PRODUCT_NOUN } from "../lib/product-labels";

type TotalRoasGaugeProps = {
  mer: number | null;
  targetMer: number;
  /** Prior-period delta line under the dial (optional). */
  deltaLine?: string | null;
};

function clamp01(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.min(1, Math.max(0, n));
}

/** Map a ROAS value onto [0,1] along the dial scale. */
function valueToT(value: number, scaleMax: number): number {
  if (!(scaleMax > 0)) return 0;
  return clamp01(value / scaleMax);
}

function polar(cx: number, cy: number, r: number, t: number) {
  // t=0 left (−π), t=1 right (0) — upper semicircle
  const angle = Math.PI * (1 - t);
  return {
    x: cx + r * Math.cos(angle),
    y: cy - r * Math.sin(angle),
  };
}

export function TotalRoasGauge({
  mer,
  targetMer,
  deltaLine,
}: TotalRoasGaugeProps) {
  const scaleMax = Math.max(
    targetMer * 1.35,
    mer != null ? mer * 1.15 : 0,
    4,
  );
  const cx = 100;
  const cy = 98;
  const r = 76;
  const trackStart = polar(cx, cy, r, 0);
  const trackEnd = polar(cx, cy, r, 1);
  const trackD = `M ${trackStart.x} ${trackStart.y} A ${r} ${r} 0 0 1 ${trackEnd.x} ${trackEnd.y}`;

  const merT = mer != null ? valueToT(mer, scaleMax) : 0;
  const fillEnd = polar(cx, cy, r, merT);
  const fillD =
    mer != null && merT > 0.001
      ? `M ${trackStart.x} ${trackStart.y} A ${r} ${r} 0 0 1 ${fillEnd.x} ${fillEnd.y}`
      : "";

  const targetT = valueToT(targetMer, scaleMax);
  const targetLabel = polar(cx, cy, r + 14, targetT);
  const targetAnchor =
    targetT < 0.22 ? "start" : targetT > 0.78 ? "end" : "middle";

  const tone =
    mer == null ? "flat" : mer >= targetMer ? "ok" : "warn";

  return (
    <div
      className={`mcfly-roas-gauge mcfly-roas-gauge--with-def mcfly-roas-gauge--${tone}`}
      role="img"
      aria-label={`${PRODUCT_NOUN.totalRoas} ${mer == null ? "unavailable" : formatMer(mer)}; target ${formatMer(targetMer)}. ${PRODUCT_NOUN.definitionForPeriod}`}
    >
      <div className="mcfly-roas-gauge__main">
        <p className="mcfly-roas-gauge__kicker">{PRODUCT_NOUN.totalRoas}</p>
        <div className="mcfly-roas-gauge__dial">
          <svg
            className="mcfly-roas-gauge__svg"
            viewBox="0 0 200 118"
            aria-hidden="true"
          >
            <path
              className="mcfly-roas-gauge__track"
              d={trackD}
              fill="none"
              strokeWidth="10"
              strokeLinecap="round"
            />
            {fillD ? (
              <path
                className="mcfly-roas-gauge__fill"
                d={fillD}
                fill="none"
                strokeWidth="10"
                strokeLinecap="round"
              />
            ) : null}
            <text
              className="mcfly-roas-gauge__target-num"
              x={targetLabel.x}
              y={targetLabel.y}
              textAnchor={targetAnchor}
              dominantBaseline="middle"
            >
              {formatMer(targetMer)}
            </text>
          </svg>
          <p className="mcfly-roas-gauge__value">
            {mer == null ? "—.——" : formatMer(mer)}
          </p>
        </div>
        {deltaLine ? (
          <p className="mcfly-roas-gauge__delta">{deltaLine}</p>
        ) : null}
      </div>
      <aside className="mcfly-roas-gauge__aside">
        <p className="mcfly-roas-gauge__formula">
          {PRODUCT_NOUN.definitionForPeriod}
        </p>
        <p className="mcfly-roas-gauge__aside-meta">
          {PRODUCT_NOUN.notTrueRoas}
        </p>
        <p className="mcfly-roas-gauge__aside-meta">
          Target {formatMer(targetMer)} on the arc
        </p>
      </aside>
    </div>
  );
}
