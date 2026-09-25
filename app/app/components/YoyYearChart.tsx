import { useMemo, useState } from "react";
import { DeskIcon } from "./DeskIcon";
import { useDeskDrill } from "./DeskDrill";
import { formatCurrency, formatMer } from "../lib/mer-format";
import { chartSeriesId, chartTipClassName } from "../lib/chart-smooth";
import {
  chartBarLayout,
  chartBarPlotClassName,
  chartXAxisMaxLabels,
} from "../lib/chart-bar";
import { useChartHover } from "../lib/use-chart-hover";
import { useDeskCurrency } from "../lib/desk-currency";
import {
  overviewChartAxis,
  overviewChartLabelIndices,
  overviewCompactMoney,
} from "../lib/overview-sales-chart";
import { OVERVIEW_YOY_PENDING } from "../lib/overview-yoy";
import {
  formatYoyPct,
  yoyBoardTotals,
  yoyChartBuckets,
  yoyDisplayValue,
  yoyPctAxis,
  type YoyChartGrain,
  type YoyMonthRow,
} from "../lib/yoy-workspace";

const VIEW_W = 760;
const VIEW_H = 300;
const PAD_L = 52;
const PAD_R = 50;
const PAD_T = 20;
const PAD_B = 36;
const PLOT_LEFT = PAD_L;
const PLOT_RIGHT = VIEW_W - PAD_R;
const PLOT_TOP = PAD_T;
const PLOT_BOTTOM = VIEW_H - PAD_B;
const PLOT_W = PLOT_RIGHT - PLOT_LEFT;
const PLOT_H = PLOT_BOTTOM - PLOT_TOP;

const xPct = (coord: number) => (coord / VIEW_W) * 100;
const yPct = (coord: number) => (coord / VIEW_H) * 100;

const GRAINS: readonly YoyChartGrain[] = ["month", "quarter"];

function grainLabel(grain: YoyChartGrain): string {
  switch (grain) {
    case "month":
      return "Month";
    case "quarter":
      return "Quarter";
    default: {
      const _never: never = grain;
      throw new Error(`unexpected YoY grain: ${String(_never)}`);
    }
  }
}

export function YoyYearChart({
  months,
  year,
  yearOptions,
  onYearChange,
  hasSpend = false,
  salesPending = false,
}: {
  months: YoyMonthRow[];
  year: number;
  yearOptions: number[];
  onYearChange: (next: string) => void;
  hasSpend?: boolean;
  salesPending?: boolean;
}) {
  const currency = useDeskCurrency();
  const drill = useDeskDrill();
  const [grain, setGrain] = useState<YoyChartGrain>("month");

  const buckets = useMemo(() => yoyChartBuckets(months, grain), [months, grain]);
  const totals = useMemo(() => yoyBoardTotals(months), [months]);
  const paintable = buckets.some(
    (bucket) => bucket.actual != null || bucket.prior != null,
  );
  const {
    hoverIndex,
    setHoverIndex,
    moveFromEvent,
    onPlotPointerLeave,
  } = useChartHover(
    buckets.length,
    chartSeriesId([year, grain, ...buckets.map((bucket) => bucket.key)]),
  );

  if (!paintable) {
    return (
      <section
        className="mcfly-chart mcfly-chart--yoy mcfly-chart--empty mcfly-chart--soft mcfly-desk-anchor"
        aria-label={`${year} vs last year`}
      >
        <div className="mcfly-chart__board">
          <div className="mcfly-chart__masthead">
            <h3 className="mcfly-chart__serif">
              <DeskIcon name="chart" /> Year vs last year
            </h3>
            <p className="mcfly-chart__muted">{year} · sales bars vs {year - 1}</p>
          </div>
        </div>
        <p className="mcfly-chart__empty">
          {salesPending
            ? OVERVIEW_YOY_PENDING
            : "No months on file for this year yet — not $0."}
        </p>
      </section>
    );
  }

  const salesMax = Math.max(
    ...buckets.map((bucket) =>
      Math.max(bucket.actual ?? 0, bucket.prior ?? 0),
    ),
    1,
  );
  const leftAxis = overviewChartAxis(salesMax, 4);
  const rightAxis = yoyPctAxis(buckets.map((bucket) => bucket.yoyPct));
  const { rx, pairW, pairGap, pairBarW, pairX, centerX } = chartBarLayout({
    plotLeft: PLOT_LEFT,
    plotWidth: PLOT_W,
    count: buckets.length,
    kind: "pair",
  });
  const barW = pairBarW;
  const yForSales = (value: number) =>
    PLOT_BOTTOM - Math.min(1, Math.max(0, value / leftAxis.max)) * PLOT_H;
  const yForPct = (value: number) => {
    const span = rightAxis.max - rightAxis.min || 1;
    return PLOT_BOTTOM - ((value - rightAxis.min) / span) * PLOT_H;
  };

  let yoyLine = "";
  let started = false;
  for (let index = 0; index < buckets.length; index += 1) {
    const value = buckets[index]?.yoyPct;
    if (value == null) {
      started = false;
      continue;
    }
    const cmd = started ? "L" : "M";
    started = true;
    yoyLine += `${yoyLine ? " " : ""}${cmd}${centerX(index).toFixed(1)} ${yForPct(value).toFixed(1)}`;
  }

  const labelIndices = new Set(
    overviewChartLabelIndices(buckets.length, chartXAxisMaxLabels(buckets.length)),
  );
  let latestActual = -1;
  for (let index = buckets.length - 1; index >= 0; index -= 1) {
    if (buckets[index]?.actual != null) {
      latestActual = index;
      break;
    }
  }
  const activeIndex = hoverIndex != null ? hoverIndex : latestActual;
  const active =
    activeIndex >= 0 ? (buckets[activeIndex] ?? null) : (buckets[0] ?? null);
  const zeroY = yForPct(0);
  const tipOpen = hoverIndex != null && active != null;
  const tipCenter = activeIndex >= 0 ? centerX(activeIndex) : centerX(0);
  const tipTopY = active?.actual != null ? yForSales(active.actual) : PLOT_TOP + 24;
  const tipEdge =
    xPct(tipCenter) < 26 ? "left" : xPct(tipCenter) > 74 ? "right" : "mid";
  const tipBelow = tipTopY < PLOT_TOP + 84;

  const money = (value: number | null) =>
    yoyDisplayValue(value, (amount) => formatCurrency(amount, currency));
  const merLabel = (value: number | null) =>
    value == null ? "—" : `${formatMer(value)}×`;

  const stats = [
    {
      k: `${year} sales`,
      v: money(totals.actual),
      sub: `${totals.monthsWithActual} month${totals.monthsWithActual === 1 ? "" : "s"}`,
    },
    {
      k: `${year - 1} sales`,
      v: money(totals.prior),
      sub: "same months",
    },
    {
      k: "YoY",
      v: formatYoyPct(totals.yoyPct),
      sub: totals.yoyPct == null ? "needs last year" : "overlapping months",
    },
    hasSpend
      ? {
          k: `${year} spend`,
          v: money(totals.spend),
          sub:
            totals.mer != null
              ? `Total ROAS · ${year} ${formatMer(totals.mer)}×`
              : "typed spend",
        }
      : {
          k: "Months up",
          v: `${totals.monthsUp}/${Math.max(1, totals.monthsWithActual)}`,
          sub: "vs last year",
        },
  ];

  return (
    <section
      className="mcfly-chart mcfly-chart--yoy mcfly-chart--soft mcfly-desk-anchor"
      aria-label={`${year} vs last year`}
    >
      <div className="mcfly-chart__board">
        <div className="mcfly-chart__masthead">
          <h3 className="mcfly-chart__serif">
            <DeskIcon name="chart" /> Year vs last year
          </h3>
          <p className="mcfly-chart__muted">
            {year} sales vs {year - 1}
            {totals.yoyPct != null ? ` · ${formatYoyPct(totals.yoyPct)}` : ""}
            {hasSpend && totals.mer != null
              ? ` · Total ROAS · ${year} ${formatMer(totals.mer)}×`
              : ""}
          </p>
        </div>
        {active ? (
          <div className="mcfly-chart__readout" role="status">
            <p className="mcfly-chart__when">
              {active.label} · {year}
            </p>
            <p className="mcfly-chart__hero">{money(active.actual)}</p>
            <p
              className={`mcfly-chart__vs ${
                active.yoyPct == null
                  ? "mcfly-chart__vs--plain"
                  : active.yoyPct > 0
                    ? "mcfly-chart__vs--up"
                    : active.yoyPct < 0
                      ? "mcfly-chart__vs--down"
                      : "mcfly-chart__vs--even"
              }`}
            >
              {active.yoyPct == null
                ? `${year - 1} ${money(active.prior)}`
                : `${formatYoyPct(active.yoyPct)} vs ${year - 1}`}
            </p>
          </div>
        ) : (
          <p className="mcfly-chart__hover mcfly-chart__hover--idle" aria-hidden="true">
            Tap a bar
          </p>
        )}
      </div>

      <ul className="mcfly-chart__stats mcfly-chart__stats--soft">
        {stats.map((stat) => (
          <li className="mcfly-chart__stat" key={stat.k}>
            <span className="mcfly-chart__stat-k">{stat.k}</span>
            <span className="mcfly-chart__stat-v">{stat.v}</span>
            <span className="mcfly-chart__stat-sub">{stat.sub}</span>
          </li>
        ))}
      </ul>

      <div className="mcfly-chart__controls">
        <label className="mcfly-goals-year">
          <span className="mcfly-goals-year__label">Year</span>
          <select
            className="mcfly-goals-year__select"
            value={year}
            aria-label="Board year"
            onChange={(event) => {
              onYearChange(event.target.value);
            }}
          >
            {yearOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
        <div className="mcfly-period__group" role="group" aria-label="Chart grain">
          {GRAINS.map((option) => (
            <button
              key={option}
              type="button"
              className={`mcfly-period__btn${grain === option ? " mcfly-period__btn--on" : ""}`}
              aria-pressed={grain === option}
              onClick={() => {
                setGrain(option);
              }}
            >
              {grainLabel(option)}
            </button>
          ))}
        </div>
      </div>

      <div
        className={chartBarPlotClassName(hoverIndex != null)}
        onPointerMove={(event) =>
          moveFromEvent(event, {
            viewWidth: VIEW_W,
            plotLeft: PLOT_LEFT,
            plotWidth: PLOT_W,
          })
        }
        onPointerLeave={onPlotPointerLeave}
      >
        <svg
          className="mcfly-chart__svg"
          viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
          preserveAspectRatio="none"
          role="img"
          aria-label={`${year} vs ${year - 1} ${grainLabel(grain).toLowerCase()} sales bars with a YoY percent line`}
        >
          {leftAxis.ticks.map((tick) => (
            <line
              key={`grid-${tick}`}
              className="mcfly-chart__grid"
              x1={PLOT_LEFT}
              y1={yForSales(tick).toFixed(1)}
              x2={PLOT_RIGHT}
              y2={yForSales(tick).toFixed(1)}
              vectorEffect="non-scaling-stroke"
            />
          ))}
          <line
            className="mcfly-chart__typical"
            x1={PLOT_LEFT}
            y1={zeroY.toFixed(1)}
            x2={PLOT_RIGHT}
            y2={zeroY.toFixed(1)}
            vectorEffect="non-scaling-stroke"
          />

          {buckets.map((bucket, index) => {
            const x0 = pairX(index);
            const priorH =
              bucket.prior != null
                ? Math.max(1.5, PLOT_BOTTOM - yForSales(bucket.prior))
                : 0;
            const actualH =
              bucket.actual != null
                ? Math.max(1.5, PLOT_BOTTOM - yForSales(bucket.actual))
                : 0;
            const vs =
              bucket.yoyPct == null
                ? null
                : bucket.yoyPct > 0
                  ? "up"
                  : bucket.yoyPct < 0
                    ? "down"
                    : "even";
            const openBar = () =>
              drill?.openDrill({
                title: `${bucket.label} · ${year}`,
                value: money(bucket.actual),
                kicker: `${grainLabel(grain)} vs ${year - 1}`,
                blocks: [
                  { k: `${year} sales`, v: money(bucket.actual) },
                  { k: `${year - 1} sales`, v: money(bucket.prior) },
                  { k: "YoY", v: formatYoyPct(bucket.yoyPct) },
                  hasSpend ? { k: `${year} spend`, v: money(bucket.spend) } : null,
                  hasSpend
                    ? { k: `${year - 1} spend`, v: money(bucket.priorSpend) }
                    : null,
                  hasSpend
                    ? { k: `Total ROAS · ${bucket.label}`, v: merLabel(bucket.mer) }
                    : null,
                  {
                    k: "What this is",
                    v: "Shopify Total Sales for this bar vs the same month last year. Missing last year is — not $0. Spend is typed cash only.",
                  },
                ].filter((block): block is { k: string; v: string } => block != null),
                next: "The 12-month board below keeps every month on one page.",
              });
            return (
              <g key={bucket.key}>
                {bucket.prior != null ? (
                  <rect
                    className="mcfly-chart__bar mcfly-chart__bar--prior"
                    x={x0}
                    y={PLOT_BOTTOM - priorH}
                    width={barW}
                    height={priorH}
                    rx={rx}
                  />
                ) : null}
                {bucket.actual != null ? (
                  <rect
                    className={[
                      "mcfly-chart__bar",
                      vs === "up" ? "mcfly-chart__bar--hot" : null,
                      vs === "down" ? "mcfly-chart__bar--cool" : null,
                      activeIndex === index ? "mcfly-chart__bar--on" : null,
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    x={x0 + barW + pairGap}
                    y={PLOT_BOTTOM - actualH}
                    width={barW}
                    height={actualH}
                    rx={rx}
                    tabIndex={0}
                    role="button"
                    aria-label={`${bucket.label} ${money(bucket.actual)} vs ${money(bucket.prior)} last year`}
                    onClick={openBar}
                    onMouseEnter={() => setHoverIndex(index)}
                    onFocus={() => setHoverIndex(index)}
                    onBlur={onPlotPointerLeave}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        openBar();
                      }
                    }}
                  />
                ) : (
                  <rect
                    className="mcfly-chart__hit"
                    x={x0}
                    y={PLOT_TOP}
                    width={pairW}
                    height={PLOT_H}
                    tabIndex={0}
                    role="button"
                    aria-label={`${bucket.label} ${money(bucket.actual)} vs ${money(bucket.prior)} last year`}
                    onClick={openBar}
                    onMouseEnter={() => setHoverIndex(index)}
                    onFocus={() => setHoverIndex(index)}
                    onBlur={onPlotPointerLeave}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        openBar();
                      }
                    }}
                  />
                )}
              </g>
            );
          })}

          {yoyLine ? <path className="mcfly-chart__sales-line" d={yoyLine} /> : null}
          {active && active.yoyPct != null && activeIndex >= 0 ? (
            <circle
              className="mcfly-chart__marker"
              cx={centerX(activeIndex).toFixed(1)}
              cy={yForPct(active.yoyPct).toFixed(1)}
              r={3.5}
            />
          ) : null}
          {active && activeIndex >= 0 ? (
            <line
              className="mcfly-chart__guide"
              x1={tipCenter.toFixed(1)}
              y1={PLOT_TOP}
              x2={tipCenter.toFixed(1)}
              y2={PLOT_BOTTOM}
              vectorEffect="non-scaling-stroke"
            />
          ) : null}
        </svg>

        <div className="mcfly-chart__axis-y" aria-hidden="true">
          {leftAxis.ticks.map((tick) => (
            <span
              key={`yt-${tick}`}
              className="mcfly-chart__ytick"
              style={{
                top: `${yPct(yForSales(tick))}%`,
                width: `${xPct(PLOT_LEFT - 8)}%`,
              }}
            >
              {overviewCompactMoney(tick, currency)}
            </span>
          ))}
        </div>
        <div className="mcfly-chart__axis-y2" aria-hidden="true">
          {rightAxis.ticks.map((tick) => (
            <span
              key={`y2-${tick}`}
              className="mcfly-chart__y2tick"
              style={{
                top: `${yPct(yForPct(tick))}%`,
                right: `${xPct(PAD_R - 8)}%`,
              }}
            >
              {formatYoyPct(tick)}
            </span>
          ))}
        </div>
        <div className="mcfly-chart__axis-x" aria-hidden="true">
          {buckets.map((bucket, index) =>
            labelIndices.has(index) ? (
              <span
                key={`xt-${bucket.key}`}
                className="mcfly-chart__xtick"
                style={{
                  left: `${xPct(centerX(index))}%`,
                  top: `${yPct(PLOT_BOTTOM + 7)}%`,
                }}
              >
                {bucket.label}
              </span>
            ) : null,
          )}
        </div>

        {tipOpen && active ? (
          <div
            className={chartTipClassName({
              open: true,
              edge: tipEdge,
              below: tipBelow,
            })}
            style={{ left: `${xPct(tipCenter)}%`, top: `${yPct(tipTopY)}%` }}
            role="status"
          >
            <p className="mcfly-chart__tip-when">
              {active.label}
              {active.isFuture ? (
                <span className="mcfly-chart__tip-tag">Not yet</span>
              ) : null}
            </p>
            <ul className="mcfly-chart__tip-rows">
              <li className="mcfly-chart__tip-row">
                <span className="mcfly-chart__tip-dot mcfly-chart__tip-dot--sales" />
                <span className="mcfly-chart__tip-k">{year}</span>
                <span className="mcfly-chart__tip-v">{money(active.actual)}</span>
              </li>
              <li className="mcfly-chart__tip-row">
                <span className="mcfly-chart__tip-dot mcfly-chart__tip-dot--typical" />
                <span className="mcfly-chart__tip-k">{year - 1}</span>
                <span className="mcfly-chart__tip-v">{money(active.prior)}</span>
              </li>
              <li className="mcfly-chart__tip-row">
                <span className="mcfly-chart__tip-dot mcfly-chart__tip-dot--vs" />
                <span className="mcfly-chart__tip-k">YoY</span>
                <span
                  className={`mcfly-chart__tip-v ${
                    active.yoyPct == null
                      ? ""
                      : active.yoyPct > 0
                        ? "mcfly-chart__tip-v--up"
                        : active.yoyPct < 0
                          ? "mcfly-chart__tip-v--down"
                          : ""
                  }`}
                >
                  {formatYoyPct(active.yoyPct)}
                </span>
              </li>
              {hasSpend ? (
                <li className="mcfly-chart__tip-row">
                  <span className="mcfly-chart__tip-dot mcfly-chart__tip-dot--aov" />
                  <span className="mcfly-chart__tip-k">Spend</span>
                  <span className="mcfly-chart__tip-v">{money(active.spend)}</span>
                </li>
              ) : null}
            </ul>
            <p className="mcfly-chart__tip-foot">
              {active.yoyPct == null
                ? `${money(active.actual)} vs ${money(active.prior)} last year — not $0 when missing`
                : `${money(active.actual)} vs ${money(active.prior)} = ${formatYoyPct(active.yoyPct)}`}
            </p>
          </div>
        ) : null}
      </div>

      <ul className="mcfly-chart__legend" aria-hidden="true">
        <li className="mcfly-chart__legend-item">
          <span className="mcfly-chart__legend-swatch mcfly-chart__legend-swatch--hot" />
          {year}
        </li>
        <li className="mcfly-chart__legend-item">
          <span className="mcfly-chart__legend-swatch mcfly-chart__legend-swatch--prior" />
          {year - 1}
        </li>
        <li className="mcfly-chart__legend-item">
          <span className="mcfly-chart__legend-swatch mcfly-chart__legend-swatch--aov" />
          YoY %
        </li>
      </ul>
    </section>
  );
}
