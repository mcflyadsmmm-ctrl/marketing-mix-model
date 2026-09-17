import { useState } from "react";
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
 * short), never a sealed $0 tail. Hover a line or click a month chip to read
 * the build.
 */
export function LtvBuildCurves({ curves }: { curves: CohortCurves | null }) {
  const currency = useDeskCurrency();
  const drill = useDeskDrill();
  const [hover, setHover] = useState<number | null>(null);
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

  const active = hover != null ? curves.series[hover] : null;
  const activeLast = active?.points[active.points.length - 1];
  const tip =
    active && activeLast
      ? {
          title: active.label,
          value: formatCurrency(activeLast.cumPerCustomer, currency),
          sub: `${active.customers.toLocaleString()} new · through M${activeLast.offset}`,
        }
      : null;

  const openSeries = (index: number) => {
    const series = curves.series[index]!;
    const last = series.points[series.points.length - 1]!;
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
    });
  };

  return (
    <section
      className="mcfly-chart mcfly-depth-curves mcfly-depth-curves--live"
      aria-label="What each month's first-time buyers spend over time"
    >
      <div className="mcfly-chart__head mcfly-chart__board">
        <div className="mcfly-chart__masthead">
          <h3 className="mcfly-chart__serif">
            <DeskIcon name="chart" />
            Cohort spend build
          </h3>
          <p className="mcfly-chart__muted">
            Dollars per customer by months since first order · younger months stop early
          </p>
        </div>
        {tip ? (
          <div className="mcfly-chart__readout" role="status">
            <p className="mcfly-chart__when">{tip.title}</p>
            <p className="mcfly-chart__hero">{tip.value}</p>
            <p className="mcfly-chart__vs">{tip.sub}</p>
          </div>
        ) : (
          <p className="mcfly-chart__hover mcfly-chart__hover--idle" aria-hidden="true">
            Hover a cohort
          </p>
        )}
      </div>
      <div className="mcfly-chart__plot">
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
            const dimmed = hover != null && hover !== index;
            const line = series.points
              .map(
                (pt, i) =>
                  `${i === 0 ? "M" : "L"}${xFor(pt.offset).toFixed(1)} ${yFor(pt.cumPerCustomer).toFixed(1)}`,
              )
              .join(" ");
            const last = series.points[series.points.length - 1]!;
            return (
              <g
                key={series.cohortMonth}
                className={`mcfly-depth-curves__series${dimmed ? " mcfly-depth-curves__series--dim" : ""}${hover === index ? " mcfly-depth-curves__series--on" : ""}`}
                onMouseEnter={() => setHover(index)}
                onMouseLeave={() => setHover(null)}
                onFocus={() => setHover(index)}
                onBlur={() => setHover(null)}
                onClick={() => openSeries(index)}
                style={{ cursor: "pointer" }}
              >
                <path d={line} fill="none" stroke="transparent" strokeWidth={14} />
                <path
                  className="mcfly-depth-curves__line"
                  d={line}
                  style={{ stroke: color }}
                />
                <circle
                  cx={xFor(last.offset)}
                  cy={yFor(last.cumPerCustomer)}
                  r={hover === index ? 4.5 : 3}
                  style={{ fill: color }}
                />
              </g>
            );
          })}
        </svg>
        {tip ? (
          <div
            className="mcfly-chart__tip mcfly-chart__tip--mid"
            style={{ left: "72%", top: "0.35rem" }}
          >
            <p className="mcfly-chart__tip-k">{tip.title}</p>
            <p className="mcfly-chart__tip-v">{tip.value}</p>
            <p className="mcfly-chart__tip-sub">{tip.sub}</p>
            <p className="mcfly-chart__tip-foot">Order history · not a forecast</p>
          </div>
        ) : null}
      </div>
      <div className="mcfly-depth-legend">
        {curves.series.map((series, index) => {
          const color = CURVE_COLORS[index % CURVE_COLORS.length]!;
          return (
            <button
              type="button"
              className={`mcfly-depth-legend__chip${hover === index ? " mcfly-depth-legend__chip--on" : ""}`}
              key={series.cohortMonth}
              onMouseEnter={() => setHover(index)}
              onMouseLeave={() => setHover(null)}
              onClick={() => openSeries(index)}
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
        Hover or click a month · dollars per customer, averages not a promise
      </p>
    </section>
  );
}
