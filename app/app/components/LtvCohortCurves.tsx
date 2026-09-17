import { formatCurrency } from "../lib/mer-format";
import { DeskIcon } from "./DeskIcon";
import { useDeskDrill } from "./DeskDrill";
import { useDeskCurrency } from "../lib/desk-currency";
import type { CohortCurves } from "../lib/ltv-depth";

/** Oldest → newest line colours: green (mature) into sky (recent whales). */
const CURVE_COLORS = [
  "#16a34a",
  "#10b981",
  "#14b8a6",
  "#0ea5e9",
  "#0284c7",
  "#2563eb",
  "#4338ca",
  "#7c3aed",
];

const W = 640;
const H = 264;
const PAD_L = 46;
const PAD_R = 14;
const PAD_T = 12;
const PAD_B = 28;

/**
 * Spend-build curves: cumulative dollars per customer, one line per first-order
 * month, over the months each group has fully lived. The order-history read
 * Shopify Analytics never draws — younger months simply stop early (honest
 * short), never a sealed $0 tail. Click a month to read its build.
 */
export function LtvCohortCurves({ curves }: { curves: CohortCurves | null }) {
  const currency = useDeskCurrency();
  const drill = useDeskDrill();
  if (!curves || curves.series.length < 2) return null;

  const maxOffset = Math.max(1, curves.maxOffset);
  const maxValue = Math.max(1, curves.maxValue);
  const plotW = W - PAD_L - PAD_R;
  const plotH = H - PAD_T - PAD_B;
  const xFor = (offset: number) => PAD_L + (offset / maxOffset) * plotW;
  const yFor = (value: number) => PAD_T + plotH - (value / maxValue) * plotH;

  const yTicks = [0, maxValue / 2, maxValue];
  const xStep = maxOffset >= 9 ? 3 : maxOffset >= 5 ? 2 : 1;
  const xTicks: number[] = [];
  for (let k = 0; k <= maxOffset; k += xStep) xTicks.push(k);

  return (
    <section
      className="mcfly-chart mcfly-depth-curves"
      aria-label="What each month's first-time buyers spend over time"
    >
      <div className="mcfly-chart__head">
        <p className="mcfly-chart__title">
          <DeskIcon name="chart" />
          What each month’s first-time buyers spend over time
        </p>
      </div>
      <svg
        className="mcfly-chart__svg"
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={`${curves.series.length} first-order months, dollars per customer by month`}
      >
        {yTicks.map((value) => {
          const y = yFor(value);
          return (
            <g key={`y-${value}`}>
              <line
                className="mcfly-depth-curves__grid"
                x1={PAD_L}
                y1={y}
                x2={W - PAD_R}
                y2={y}
              />
              <text className="mcfly-depth-curves__axis" x={PAD_L - 6} y={y + 3} textAnchor="end">
                {formatCurrency(value, currency)}
              </text>
            </g>
          );
        })}
        {xTicks.map((offset) => (
          <text
            key={`x-${offset}`}
            className="mcfly-depth-curves__axis"
            x={xFor(offset)}
            y={H - 8}
            textAnchor="middle"
          >
            M{offset}
          </text>
        ))}
        {curves.series.map((series, index) => {
          const color = CURVE_COLORS[index % CURVE_COLORS.length]!;
          const line = series.points
            .map(
              (pt, i) =>
                `${i === 0 ? "M" : "L"}${xFor(pt.offset).toFixed(1)} ${yFor(pt.cumPerCustomer).toFixed(1)}`,
            )
            .join(" ");
          const last = series.points[series.points.length - 1]!;
          return (
            <g key={series.cohortMonth}>
              <path
                className="mcfly-depth-curves__line"
                d={line}
                style={{ stroke: color }}
              />
              <circle
                cx={xFor(last.offset)}
                cy={yFor(last.cumPerCustomer)}
                r={3}
                style={{ fill: color }}
              />
            </g>
          );
        })}
      </svg>
      <div className="mcfly-depth-legend">
        {curves.series.map((series, index) => {
          const color = CURVE_COLORS[index % CURVE_COLORS.length]!;
          const last = series.points[series.points.length - 1]!;
          return (
            <button
              type="button"
              className="mcfly-depth-legend__chip"
              key={series.cohortMonth}
              onClick={() =>
                drill?.openDrill({
                  title: `First orders · ${series.label}`,
                  value: formatCurrency(last.cumPerCustomer, currency),
                  kicker: `${series.customers.toLocaleString()} new customers · through month ${last.offset}`,
                  blocks: [
                    {
                      k: "What this is",
                      v: `Average dollars a customer from ${series.label} has spent through month ${last.offset} after their first order — order history, not a forecast.`,
                    },
                  ],
                  next: "Younger months stop earlier because less time has passed — not $0.",
                })
              }
            >
              <span
                className="mcfly-depth-legend__swatch"
                style={{ background: color }}
              />
              {series.label}
            </button>
          );
        })}
      </div>
      <p className="mcfly-chart__hint">
        Click a month · dollars per customer, averages not a promise
      </p>
    </section>
  );
}
