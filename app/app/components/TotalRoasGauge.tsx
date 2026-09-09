/**
 * Semi-circle Total ROAS gauge — pure SVG, no chart library.
 * Current ROAS fills the arc; value sits inside the dial; target is a small arc label.
 * Clear definition sits beside the dial.
 *
 * Target Total ROAS is optional. `targetMer={null}` means the merchant has not set
 * an operating goal, so no tick is drawn and the dial stays neutral — a hidden
 * default must never color actual green/red. An untrusted period keeps the actual
 * number but suppresses the above/below verdict.
 */

import { resolveTargetMerComparison } from "../lib/target-mer";
import { formatMer } from "../lib/mer-format";
import { PRODUCT_NOUN } from "../lib/product-labels";

type TotalRoasGaugeProps = {
  mer: number | null;
  /** Confirmed operating target, or null when none is set. */
  targetMer: number | null;
  /** `resolvePeriodTrust().trusted` — gates the above/below verdict. */
  periodTrusted: boolean;
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
  periodTrusted,
  deltaLine,
}: TotalRoasGaugeProps) {
  const comparison = resolveTargetMerComparison({
    actualMer: mer,
    targetMer,
    periodTrusted,
  });
  const target = comparison.target;

  const scaleMax = Math.max(
    target != null ? target * 1.35 : 0,
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

  const targetT = target != null ? valueToT(target, scaleMax) : 0;
  const targetLabel = polar(cx, cy, r + 14, targetT);
  const targetAnchor =
    targetT < 0.22 ? "start" : targetT > 0.78 ? "end" : "middle";

  // Direction color only when the comparison is allowed to be a verdict.
  const tone = !comparison.verdictAllowed
    ? "flat"
    : comparison.state === "above"
      ? "ok"
      : "warn";

  return (
    <div
      className={`mcfly-roas-gauge mcfly-roas-gauge--with-def mcfly-roas-gauge--${tone}`}
    >
      {/*
        role="img" stays on the dial only. Wrapping the whole card would make the
        aside presentational and strand the Settings link for keyboard/AT users.
      */}
      <div
        className="mcfly-roas-gauge__main"
        role="img"
        aria-label={`${comparison.accessibleName} ${PRODUCT_NOUN.definitionForPeriod}`}
      >
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
            {target != null ? (
              <text
                className="mcfly-roas-gauge__target-num"
                x={targetLabel.x}
                y={targetLabel.y}
                textAnchor={targetAnchor}
                dominantBaseline="middle"
              >
                {formatMer(target)}
              </text>
            ) : null}
          </svg>
          <p className="mcfly-roas-gauge__value">
            {mer == null ? "—.——" : formatMer(mer)}
          </p>
        </div>
        <p className="mcfly-roas-gauge__delta">{comparison.line}</p>
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
          {comparison.closedDayNote}
        </p>
        {target != null ? (
          <p className="mcfly-roas-gauge__aside-meta">
            Target {formatMer(target)} on the arc ·{" "}
            <s-link href="/app/settings">Change target</s-link>
          </p>
        ) : (
          <p className="mcfly-roas-gauge__aside-meta">
            <s-link href="/app/settings">Set a target in Settings</s-link>
          </p>
        )}
      </aside>
    </div>
  );
}
