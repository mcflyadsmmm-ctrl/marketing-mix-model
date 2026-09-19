import { useMemo, useState } from "react";
import { DeskIcon } from "./DeskIcon";
import { useDeskDrill } from "./DeskDrill";
import { formatCurrency } from "../lib/mer-format";
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
import {
  growthBucketMonths,
  growthComebackSentence,
  growthDefaultGrain,
  growthExplorerHasPlot,
  growthExtraOrderAvg,
  growthGrainReady,
  growthResolveGrain,
  growthWholePct,
  type GrowthBar,
  type GrowthExplorerGrain,
  type GrowthMonthBar,
} from "../lib/growth-comeback";
import type { ShopifyDepthStats } from "../lib/shopify-depth-stats";

// SVG paints the shapes; crisp HTML overlays paint axis text + the dark tooltip
// so type never shrinks with the viewBox on a 390–430px Admin iframe.
const VIEW_W = 720;
const VIEW_H = 300;
const PAD_L = 48;
const PAD_R = 46;
const PAD_T = 18;
const PAD_B = 34;
const PLOT_LEFT = PAD_L;
const PLOT_RIGHT = VIEW_W - PAD_R;
const PLOT_TOP = PAD_T;
const PLOT_BOTTOM = VIEW_H - PAD_B;
const PLOT_W = PLOT_RIGHT - PLOT_LEFT;
const PLOT_H = PLOT_BOTTOM - PLOT_TOP;

const xPct = (coord: number) => (coord / VIEW_W) * 100;
const yPct = (coord: number) => (coord / VIEW_H) * 100;

const SHARE_TICKS = [0, 0.25, 0.5, 0.75, 1];

type TipTone = "new" | "ret" | "share";

type PlotCol = {
  key: string;
  label: string;
  bar: number;
  barText: string;
  line: number | null;
  tipRows: { k: string; v: string; tone: TipTone }[];
  foot: string;
  drillTitle: string;
  drillValue: string;
  drillKicker: string;
  drillBlocks: { k: string; v: string }[];
};

function ratePct(rate: number | null): string {
  return rate != null && Number.isFinite(rate) ? growthWholePct(rate) : "—";
}

function grainNoun(grain: GrowthExplorerGrain): string {
  switch (grain) {
    case "depth":
      return "depth";
    case "month":
      return "month";
    case "quarter":
      return "quarter";
    default: {
      const _never: never = grain;
      return _never;
    }
  }
}

function ComebackEmptyFrame({ pending }: { pending: boolean }) {
  const ghost = [0.42, 0.58, 0.5, 0.72, 0.64, 0.8, 0.7];
  return (
    <section
      className="mcfly-chart mcfly-cust-mix mcfly-growth-ex mcfly-cust-mix--empty mcfly-chart--soft mcfly-desk-anchor"
      aria-label="Who came back"
    >
      <div className="mcfly-chart__board">
        <div className="mcfly-chart__masthead">
          <h3 className="mcfly-chart__serif">
            <DeskIcon name="chart" /> Who came back
          </h3>
          <p className="mcfly-chart__muted">
            First-time dollars and the 30-day come-back, from order history
          </p>
        </div>
      </div>
      <div className="mcfly-chart__plot mcfly-cust-mix__ghost" aria-hidden="true">
        <svg
          className="mcfly-chart__svg"
          viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
          preserveAspectRatio="none"
          role="presentation"
        >
          <line
            className="mcfly-cust-mix__rail"
            x1={PLOT_LEFT}
            y1={PLOT_TOP + PLOT_H * 0.38}
            x2={PLOT_RIGHT}
            y2={PLOT_TOP + PLOT_H * 0.38}
          />
          {ghost.map((h, i) => {
            const layout = chartBarLayout({
              plotLeft: PLOT_LEFT,
              plotWidth: PLOT_W,
              count: ghost.length,
            });
            const barH = PLOT_H * h;
            return (
              <rect
                key={i}
                className="mcfly-cust-mix__ghost-bar"
                x={layout.barX(i)}
                y={PLOT_BOTTOM - barH}
                width={layout.barW}
                height={barH}
                rx={layout.rx}
              />
            );
          })}
        </svg>
      </div>
      <p className="mcfly-cust-mix__empty-copy">
        {pending
          ? "Come-back months are still loading — not $0."
          : "Days to a second order and 30-day come-backs are not on file yet — not $0. Needs two first-order months or a two-step come-back. Snowdevil SAMPLE fills this in; a fresh live shop fills in as second orders land."}
      </p>
    </section>
  );
}

/**
 * Growth-owned come-back explorer — new dollars + who came back, above the
 * fold. Overview/Customers-marquee craft: HTML axis overlays, dark tooltip,
 * grain (Comeback / Monthly / Quarterly). Designed empty when the plot is
 * thinner than two columns — never a bare sentence, never null.
 */
export function GrowthComebackChart({
  depthBars,
  months,
  depth,
  repeatRate,
  firstTimeDollars,
  salesPending = false,
  drillNext = "Open LTV for what each first order is worth in 30 / 90 / 365 days.",
  drillHref = "#mcfly-ltv",
  drillLabel,
}: {
  depthBars: GrowthBar[];
  months: GrowthMonthBar[];
  depth: ShopifyDepthStats;
  repeatRate: number | null;
  firstTimeDollars: number | null;
  salesPending?: boolean;
  drillNext?: string;
  drillHref?: string;
  drillLabel?: string;
}) {
  const currency = useDeskCurrency();
  const drill = useDeskDrill();
  const ready = useMemo(
    () => growthGrainReady({ depthBars, months }),
    [depthBars, months],
  );
  const quarterBars = useMemo(
    () => growthBucketMonths(months, "quarter"),
    [months],
  );
  const extraAvg = useMemo(() => growthExtraOrderAvg(months), [months]);
  const [grain, setGrain] = useState<GrowthExplorerGrain>(() =>
    growthDefaultGrain(ready),
  );
  const plotReady = growthExplorerHasPlot(ready);
  const effectivePreview = growthResolveGrain(grain, ready);
  const colCount = !plotReady
    ? 0
    : effectivePreview === "depth"
      ? depthBars.filter((item) => Number.isFinite(item.share) && item.share > 0)
          .length
      : effectivePreview === "month"
        ? months.length
        : quarterBars.length;
  const {
    hoverIndex,
    setHoverIndex,
    moveFromEvent,
    onPlotPointerLeave,
  } = useChartHover(
    colCount,
    chartSeriesId([
      effectivePreview,
      ...depthBars.map((item) => item.label),
      ...months.map((row) => row.key),
    ]),
  );

  if (!plotReady) {
    return <ComebackEmptyFrame pending={salesPending} />;
  }

  const effective = growthResolveGrain(grain, ready);
  const money = (n: number) => formatCurrency(n, currency);

  const cols: PlotCol[] = (() => {
    switch (effective) {
      case "depth":
        return depthBars
          .filter((item) => Number.isFinite(item.share) && item.share > 0)
          .map((item) => ({
            key: item.label,
            label: item.label,
            bar: item.share,
            barText: item.value,
            line: null,
            tipRows: [
              { k: "Share of buyers", v: item.value, tone: "ret" as const },
              { k: "What this is", v: item.detail, tone: "share" as const },
            ],
            foot: `${item.value} of identified buyers`,
            drillTitle: item.label,
            drillValue: item.value,
            drillKicker: "Share of identified buyers, from order history",
            drillBlocks: [{ k: "What this is", v: item.detail }],
          }));
      case "month":
      case "quarter": {
        const rows = effective === "month" ? months : quarterBars;
        const noun = grainNoun(effective);
        return rows.map((row) => ({
          key: row.key,
          label: row.label,
          bar: row.first30Dollars,
          barText: money(row.first30Dollars),
          line: row.extraOrderRate,
          tipRows: [
            {
              k: "First 30 days $",
              v: money(row.first30Dollars),
              tone: "new" as const,
            },
            {
              k: "New buyers",
              v: row.firstTimeBuyers.toLocaleString(),
              tone: "ret" as const,
            },
            {
              k: "Extra orders / buyer",
              v: ratePct(row.extraOrderRate),
              tone: "share" as const,
            },
          ],
          foot: `${row.firstTimeBuyers.toLocaleString()} first-time buyers · ${ratePct(row.extraOrderRate)} extra orders in 90 days`,
          drillTitle: `${row.label} · first orders`,
          drillValue: money(row.first30Dollars),
          drillKicker: `${row.firstTimeBuyers.toLocaleString()} buyers whose first order landed this ${noun}`,
          drillBlocks: [
            { k: "First 30 days $", v: money(row.first30Dollars) },
            {
              k: "New buyers",
              v: row.firstTimeBuyers.toLocaleString(),
            },
            {
              k: "Extra 90-day orders",
              v: `${row.extraOrders90.toLocaleString()} · ${ratePct(row.extraOrderRate)} per buyer`,
            },
            {
              k: "What this is",
              v: "First-order-month dollars in the first 30 days, and extra orders those buyers placed in 90 days. Order history — not an email list.",
            },
          ],
        }));
      }
      default: {
        const _never: never = effective;
        return _never;
      }
    }
  })();

  const useShareAxis = effective === "depth";
  const maxBar = Math.max(...cols.map((c) => c.bar), useShareAxis ? 0.01 : 1);
  const leftAxis = useShareAxis
    ? { max: 1, ticks: SHARE_TICKS }
    : overviewChartAxis(maxBar, 4);
  const lineMax = Math.max(
    1,
    ...cols.map((c) => (c.line != null && c.line > 1 ? c.line : 1)),
  );
  const rightTicks =
    lineMax > 1 ? overviewChartAxis(lineMax, 4).ticks.map((t) => t) : SHARE_TICKS;
  const rightMax = lineMax > 1 ? Math.max(...rightTicks, lineMax) : 1;
  const showLine = cols.some((c) => c.line != null);

  const { band, barW, rx, barX, centerX } = chartBarLayout({
    plotLeft: PLOT_LEFT,
    plotWidth: PLOT_W,
    count: cols.length,
  });
  const yForBar = (v: number) =>
    PLOT_BOTTOM - Math.min(1, Math.max(0, v / leftAxis.max)) * PLOT_H;
  const yForLine = (s: number) =>
    PLOT_BOTTOM - Math.min(1, Math.max(0, s / rightMax)) * PLOT_H;

  const labelIndices = new Set(
    overviewChartLabelIndices(cols.length, chartXAxisMaxLabels(cols.length)),
  );
  const linePts = cols
    .map((c, i) => ({ c, i }))
    .filter((p) => p.c.line != null)
    .map((p) => ({
      x: centerX(p.i),
      y: yForLine(p.c.line as number),
    }));
  const line = linePts
    .map((pt, i) => `${i === 0 ? "M" : "L"}${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`)
    .join(" ");

  const activeIndex = hoverIndex != null ? hoverIndex : cols.length - 1;
  const active = cols[activeIndex] ?? cols[cols.length - 1]!;
  const tipOpen = hoverIndex != null;
  const tipCenter = centerX(activeIndex);
  const tipTopY = yForBar(active.bar);
  const tipEdge =
    xPct(tipCenter) < 26 ? "left" : xPct(tipCenter) > 74 ? "right" : "mid";
  const tipBelow = tipTopY < PLOT_TOP + 92;

  const openCol = (col: PlotCol) =>
    drill?.openDrill({
      title: col.drillTitle,
      value: col.drillValue,
      kicker: col.drillKicker,
      blocks: col.drillBlocks,
      next: drillNext,
      nextHref: drillHref,
      nextLabel: drillLabel,
    });

  const muted = growthComebackSentence(depth, repeatRate);
  const firstTimeText =
    firstTimeDollars != null && firstTimeDollars > 0
      ? money(firstTimeDollars)
      : "—";

  const stats = [
    {
      k: "First-time $",
      v: firstTimeText,
      sub: "this window",
    },
    {
      k: "Came back ≤30d",
      v: ratePct(depth.secondOrderWithin30Share),
      sub:
        depth.eligibleFirstTimers > 0
          ? `${depth.eligibleFirstTimers.toLocaleString()} had 30 days`
          : "needs 30 days of follow-up",
    },
    {
      k: "Days to 2nd",
      v:
        depth.medianDaysToSecond != null
          ? `${Math.round(depth.medianDaysToSecond)}d`
          : "—",
      sub: "typical wait",
    },
    {
      k: "Extra orders",
      v: ratePct(extraAvg),
      sub: "per new buyer · 90d",
    },
  ];

  const setWanted = (next: GrowthExplorerGrain) => {
    setGrain(next);
  };

  const grainBtn = (
    value: GrowthExplorerGrain,
    label: string,
    enabled: boolean,
  ) => (
    <button
      type="button"
      className={`mcfly-period__btn${effective === value ? " mcfly-period__btn--on" : ""}`}
      aria-pressed={effective === value}
      disabled={!enabled}
      onClick={() => setWanted(value)}
    >
      {label}
    </button>
  );

  return (
    <section
      className="mcfly-chart mcfly-cust-mix mcfly-growth-ex mcfly-chart--soft mcfly-desk-anchor"
      aria-label="Who came back"
    >
      <div className="mcfly-chart__board">
        <div className="mcfly-chart__masthead">
          <h3 className="mcfly-chart__serif">
            <DeskIcon name="chart" /> Who came back
          </h3>
          <p className="mcfly-chart__muted">{muted}</p>
        </div>
        <div className="mcfly-chart__readout" role="status">
          <p className="mcfly-chart__when">{active.label}</p>
          <p className="mcfly-chart__hero">{active.barText}</p>
          <p className="mcfly-cust-mix__readsub">
            {effective === "depth"
              ? "of identified buyers"
              : `${ratePct(active.line)} extra orders in 90 days`}
          </p>
        </div>
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
        <div className="mcfly-period__group" role="group" aria-label="Comeback grain">
          {grainBtn("depth", "Comeback", ready.depth)}
          {grainBtn("month", "Monthly", ready.month)}
          {grainBtn("quarter", "Quarterly", ready.quarter)}
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
          aria-label={
            effective === "depth"
              ? "Come-back depth — one, two, and three-or-more orders"
              : `First-order ${grainNoun(effective)}s with extra 90-day orders`
          }
        >
          {leftAxis.ticks.map((tick) => (
            <line
              key={`grid-${tick}`}
              className="mcfly-chart__grid"
              x1={PLOT_LEFT}
              y1={yForBar(tick).toFixed(1)}
              x2={PLOT_RIGHT}
              y2={yForBar(tick).toFixed(1)}
              vectorEffect="non-scaling-stroke"
            />
          ))}

          {showLine && extraAvg != null ? (
            <line
              className="mcfly-cust-mix__rail"
              x1={PLOT_LEFT}
              y1={yForLine(extraAvg).toFixed(1)}
              x2={PLOT_RIGHT}
              y2={yForLine(extraAvg).toFixed(1)}
              vectorEffect="non-scaling-stroke"
            />
          ) : null}

          {cols.map((col, i) => {
            const h = Math.max(0, PLOT_BOTTOM - yForBar(col.bar));
            const on = activeIndex === i;
            return (
              <g
                key={col.key}
                className={
                  on
                    ? "mcfly-cust-mix__col mcfly-cust-mix__col--on"
                    : "mcfly-cust-mix__col"
                }
              >
                <rect
                  className={
                    effective === "depth"
                      ? "mcfly-cust-mix__bar mcfly-cust-mix__bar--ret"
                      : "mcfly-cust-mix__bar mcfly-cust-mix__bar--new"
                  }
                  x={barX(i)}
                  y={PLOT_BOTTOM - h}
                  width={barW}
                  height={h}
                  rx={rx}
                />
              </g>
            );
          })}

          {showLine && line ? <path className="mcfly-cust-mix__line" d={line} /> : null}
          {linePts.map((pt, i) => (
            <circle
              key={`dot-${i}`}
              className="mcfly-cust-mix__dot"
              cx={pt.x.toFixed(1)}
              cy={pt.y.toFixed(1)}
              r="2.6"
            />
          ))}

          {tipOpen ? (
            <line
              className="mcfly-chart__guide"
              x1={tipCenter.toFixed(1)}
              y1={PLOT_TOP}
              x2={tipCenter.toFixed(1)}
              y2={PLOT_BOTTOM}
              vectorEffect="non-scaling-stroke"
            />
          ) : null}

          {cols.map((col, i) => (
            <rect
              key={`hit-${col.key}`}
              className="mcfly-cust-mix__hit"
              x={PLOT_LEFT + band * i}
              y={PLOT_TOP}
              width={band}
              height={PLOT_H}
              tabIndex={0}
              role="button"
              aria-label={`${col.label}: ${col.barText}`}
              onMouseEnter={() => setHoverIndex(i)}
              onFocus={() => setHoverIndex(i)}
              onBlur={onPlotPointerLeave}
              onClick={() => openCol(col)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  openCol(col);
                }
              }}
            />
          ))}
        </svg>

        <div className="mcfly-chart__axis-y" aria-hidden="true">
          {leftAxis.ticks.map((tick) => (
            <span
              key={`yt-${tick}`}
              className="mcfly-chart__ytick"
              style={{ top: `${yPct(yForBar(tick))}%`, width: `${xPct(PLOT_LEFT - 8)}%` }}
            >
              {useShareAxis
                ? `${Math.round(tick * 100)}%`
                : overviewCompactMoney(tick, currency)}
            </span>
          ))}
        </div>

        {showLine ? (
          <div className="mcfly-chart__axis-y2" aria-hidden="true">
            {rightTicks.map((s) => (
              <span
                key={`y2-${s}`}
                className="mcfly-chart__y2tick"
                style={{
                  top: `${yPct(yForLine(s))}%`,
                  right: `${xPct(PAD_R - 8)}%`,
                }}
              >
                {lineMax > 1 ? s.toFixed(lineMax >= 10 ? 0 : 1) : `${Math.round(s * 100)}%`}
              </span>
            ))}
          </div>
        ) : null}

        {showLine && extraAvg != null ? (
          <span
            className="mcfly-chart__rail-k"
            style={{
              top: `${yPct(yForLine(extraAvg))}%`,
              left: `${xPct(PLOT_LEFT + 6)}%`,
            }}
            aria-hidden="true"
          >
            avg extra {Math.round(extraAvg * 100)}%
          </span>
        ) : null}

        <div className="mcfly-chart__axis-x" aria-hidden="true">
          {cols.map((col, i) =>
            labelIndices.has(i) ? (
              <span
                key={`xt-${col.key}`}
                className="mcfly-chart__xtick"
                style={{
                  left: `${xPct(centerX(i))}%`,
                  top: `${yPct(PLOT_BOTTOM + 7)}%`,
                }}
              >
                {col.label}
              </span>
            ) : null,
          )}
        </div>

        {tipOpen ? (
          <div
            className={chartTipClassName({
              open: true,
              edge: tipEdge,
              below: tipBelow,
            })}
            style={{ left: `${xPct(tipCenter)}%`, top: `${yPct(tipTopY)}%` }}
            role="status"
          >
            <p className="mcfly-chart__tip-when">{active.label}</p>
            <ul className="mcfly-chart__tip-rows">
              {active.tipRows.map((row) => (
                <li className="mcfly-chart__tip-row" key={row.k}>
                  <span
                    className={`mcfly-chart__tip-dot mcfly-chart__tip-dot--${row.tone}`}
                  />
                  <span className="mcfly-chart__tip-k">{row.k}</span>
                  <span className="mcfly-chart__tip-v">{row.v}</span>
                </li>
              ))}
            </ul>
            <p className="mcfly-chart__tip-foot">{active.foot}</p>
          </div>
        ) : null}
      </div>

      <ul className="mcfly-chart__legend" aria-hidden="true">
        <li className="mcfly-chart__legend-item">
          <span
            className={`mcfly-chart__legend-swatch ${
              effective === "depth"
                ? "mcfly-cust-mix__sw--ret"
                : "mcfly-cust-mix__sw--new"
            }`}
          />
          {effective === "depth" ? "Share of buyers" : "First 30 days $"}
        </li>
        {showLine ? (
          <li className="mcfly-chart__legend-item">
            <span className="mcfly-chart__legend-swatch mcfly-cust-mix__sw--line" />
            Extra 90-day orders
          </li>
        ) : null}
      </ul>
    </section>
  );
}
