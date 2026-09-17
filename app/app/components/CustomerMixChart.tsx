import { useMemo, useState } from "react";
import { DeskIcon } from "./DeskIcon";
import { useDeskDrill } from "./DeskDrill";
import { formatCurrency } from "../lib/mer-format";
import { chartSeriesId, chartTipClassName } from "../lib/chart-smooth";
import { useChartHover } from "../lib/use-chart-hover";
import { useDeskCurrency } from "../lib/desk-currency";
import {
  overviewChartAxis,
  overviewChartLabelIndices,
  overviewCompactMoney,
} from "../lib/overview-sales-chart";
import {
  bucketMixWeeks,
  mixSummary,
  type CustomerAnalytics,
  type MixBucket,
  type MixGrain,
} from "../lib/customers-analytics";

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

function sharePct(share: number | null): string {
  return share != null && Number.isFinite(share)
    ? `${Math.round(share * 100)}%`
    : "—";
}

function MixEmptyFrame({ pending }: { pending: boolean }) {
  // A designed guest empty — a ghosted marquee, not a bare em dash. Placeholder
  // columns + a dotted share rail read as "a chart lands here", then honest copy.
  const ghost = [0.34, 0.52, 0.44, 0.66, 0.58, 0.78, 0.7];
  return (
    <section
      className="mcfly-chart mcfly-cust-mix mcfly-cust-mix--empty mcfly-chart--soft mcfly-desk-anchor"
      aria-label="New vs returning dollars by week"
    >
      <div className="mcfly-chart__board">
        <div className="mcfly-chart__masthead">
          <h3 className="mcfly-chart__serif">
            <DeskIcon name="chart" /> New vs returning dollars
          </h3>
          <p className="mcfly-chart__muted">
            First-time vs returning order dollars, week over week
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
            y1={PLOT_TOP + PLOT_H * 0.42}
            x2={PLOT_RIGHT}
            y2={PLOT_TOP + PLOT_H * 0.42}
          />
          {ghost.map((h, i) => {
            const band = PLOT_W / ghost.length;
            const barW = band * 0.5;
            const barH = PLOT_H * h;
            return (
              <rect
                key={i}
                className="mcfly-cust-mix__ghost-bar"
                x={PLOT_LEFT + band * i + (band - barW) / 2}
                y={PLOT_BOTTOM - barH}
                width={barW}
                height={barH}
                rx="2"
              />
            );
          })}
        </svg>
      </div>
      <p className="mcfly-cust-mix__empty-copy">
        {pending
          ? "Weekly returning dollars are still loading — not $0."
          : "Needs at least two weeks of orders on file — not zero. Snowdevil SAMPLE fills this in; a fresh live shop fills in as orders land."}
      </p>
    </section>
  );
}

/**
 * The Customers marquee — an explorer-grade new-vs-returning dollars trend that
 * leads the tab above the fold. Stacked bars (first-time + returning $) on the
 * left axis, a returning-share line on the right axis, a dashed window-average
 * rail, a Weekly / Monthly grain toggle, a KPI strip, and a dark floating
 * tooltip that rides the hovered column. Order dollars only — no spend ever
 * overlays this. Hover/tap a column for the readout; click for the breakdown.
 */
export function CustomerMixChart({
  analytics,
  salesPending = false,
}: {
  analytics: CustomerAnalytics;
  salesPending?: boolean;
}) {
  const currency = useDeskCurrency();
  const drill = useDeskDrill();
  const weeks = analytics.mixWeekly;

  const [grain, setGrain] = useState<MixGrain>("week");

  const weekBuckets = useMemo(() => bucketMixWeeks(weeks, "week"), [weeks]);
  const monthBuckets = useMemo(() => bucketMixWeeks(weeks, "month"), [weeks]);
  const summary = useMemo(() => mixSummary(weekBuckets), [weekBuckets]);
  const monthReady = monthBuckets.length >= 2;
  const effectiveGrain: MixGrain = grain === "month" && monthReady ? "month" : "week";
  const buckets = effectiveGrain === "month" ? monthBuckets : weekBuckets;
  const {
    hoverIndex,
    setHoverIndex,
    moveFromEvent,
    onPlotPointerLeave,
  } = useChartHover(
    buckets.length,
    chartSeriesId([effectiveGrain, ...buckets.map((bucket) => bucket.key)]),
  );

  if (weeks.length < 2) {
    return <MixEmptyFrame pending={salesPending} />;
  }
  const noun = effectiveGrain === "month" ? "month" : "week";

  const maxDollars = Math.max(...buckets.map((b) => b.total), 1);
  const leftAxis = overviewChartAxis(maxDollars, 4);
  const avg = summary.returningShareAvg;

  const band = PLOT_W / buckets.length;
  const barW = Math.min(46, Math.max(3, band * 0.6));
  const barX = (i: number) => PLOT_LEFT + band * i + (band - barW) / 2;
  const centerX = (i: number) => PLOT_LEFT + band * i + band / 2;
  const yForD = (v: number) =>
    PLOT_BOTTOM - Math.min(1, Math.max(0, v / leftAxis.max)) * PLOT_H;
  const yForS = (s: number) =>
    PLOT_BOTTOM - Math.min(1, Math.max(0, s)) * PLOT_H;

  const labelIndices = new Set(overviewChartLabelIndices(buckets.length, 6));

  const linePts = buckets
    .map((b, i) => ({ b, i }))
    .filter((p) => p.b.returningShare != null)
    .map((p) => ({ x: centerX(p.i), y: yForS(p.b.returningShare as number) }));
  const line = linePts
    .map((pt, i) => `${i === 0 ? "M" : "L"}${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`)
    .join(" ");

  const activeIndex = hoverIndex != null ? hoverIndex : buckets.length - 1;
  const active = buckets[activeIndex] ?? buckets[buckets.length - 1]!;
  const activeVsAvg =
    active.returningShare != null && avg != null
      ? active.returningShare - avg
      : null;

  const tipOpen = hoverIndex != null;
  const tipCenter = centerX(activeIndex);
  const tipTopY = yForD(active.total);
  const tipEdge =
    xPct(tipCenter) < 26 ? "left" : xPct(tipCenter) > 74 ? "right" : "mid";
  const tipBelow = tipTopY < PLOT_TOP + 92;

  const openBucket = (b: MixBucket) =>
    drill?.openDrill({
      title: `${b.label} · new vs returning`,
      value: formatCurrency(b.returningDollars, currency),
      kicker: `${sharePct(b.returningShare)} of the ${noun}'s dollars are returning`,
      blocks: [
        { k: "Returning dollars", v: formatCurrency(b.returningDollars, currency) },
        { k: "First-time dollars", v: formatCurrency(b.newDollars, currency) },
        { k: `Total this ${noun}`, v: formatCurrency(b.total, currency) },
        {
          k: "What this is",
          v: "Returning = orders from buyers who had already ordered on file; first-time = their first order (or a guest). Order dollars only — no spend, no pixel.",
        },
      ],
      next: "What to do (below) shows the repurchase clock behind this line.",
    });

  const stats = [
    {
      k: "Returning $",
      v: formatCurrency(summary.returningDollars, currency),
      sub: `${buckets.length} ${noun}${buckets.length === 1 ? "" : "s"}`,
    },
    {
      k: "Returning share",
      v: sharePct(avg),
      sub: "of dollars",
    },
    {
      k: "First-time $",
      v: formatCurrency(summary.newDollars, currency),
      sub: "first orders",
    },
    {
      k: "Best week $",
      v:
        summary.bestReturning != null
          ? formatCurrency(summary.bestReturning.returningDollars, currency)
          : "—",
      sub: summary.bestReturning?.label ?? "peak returning",
    },
  ];

  return (
    <section
      className="mcfly-chart mcfly-cust-mix mcfly-chart--soft mcfly-desk-anchor"
      aria-label="New vs returning dollars by week"
    >
      <div className="mcfly-chart__board">
        <div className="mcfly-chart__masthead">
          <h3 className="mcfly-chart__serif">
            <DeskIcon name="chart" /> New vs returning dollars
          </h3>
          <p className="mcfly-chart__muted">
            {sharePct(avg)} returning · {formatCurrency(summary.total, currency)}{" "}
            over last ~{analytics.historyDays} days
          </p>
        </div>
        <div className="mcfly-chart__readout" role="status">
          <p className="mcfly-chart__when">
            {active.label} · returning
          </p>
          <p className="mcfly-chart__hero">
            {formatCurrency(active.returningDollars, currency)}
          </p>
          <p className="mcfly-cust-mix__readsub">
            {sharePct(active.returningShare)} returning · first-time{" "}
            {formatCurrency(active.newDollars, currency)}
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
        <div className="mcfly-period__group" role="group" aria-label="Trend grain">
          <button
            type="button"
            className={`mcfly-period__btn${effectiveGrain === "week" ? " mcfly-period__btn--on" : ""}`}
            aria-pressed={effectiveGrain === "week"}
            onClick={() => {
              setGrain("week");
            }}
          >
            Weekly
          </button>
          <button
            type="button"
            className={`mcfly-period__btn${effectiveGrain === "month" ? " mcfly-period__btn--on" : ""}`}
            aria-pressed={effectiveGrain === "month"}
            disabled={!monthReady}
            onClick={() => {
              setGrain("month");
            }}
          >
            Monthly
          </button>
        </div>
      </div>

      <div
        className="mcfly-chart__plot"
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
          aria-label={`${buckets.length} ${noun}s of new vs returning dollars with a returning-share line`}
        >
          {leftAxis.ticks.map((tick) => (
            <line
              key={`grid-${tick}`}
              className="mcfly-chart__grid"
              x1={PLOT_LEFT}
              y1={yForD(tick).toFixed(1)}
              x2={PLOT_RIGHT}
              y2={yForD(tick).toFixed(1)}
              vectorEffect="non-scaling-stroke"
            />
          ))}

          {avg != null ? (
            <line
              className="mcfly-cust-mix__rail"
              x1={PLOT_LEFT}
              y1={yForS(avg).toFixed(1)}
              x2={PLOT_RIGHT}
              y2={yForS(avg).toFixed(1)}
              vectorEffect="non-scaling-stroke"
            />
          ) : null}

          {buckets.map((b, i) => {
            const newH = Math.max(0, PLOT_BOTTOM - yForD(b.newDollars));
            const retH = Math.max(0, (b.returningDollars / leftAxis.max) * PLOT_H);
            const on = activeIndex === i;
            return (
              <g
                key={b.key}
                className={on ? "mcfly-cust-mix__col mcfly-cust-mix__col--on" : "mcfly-cust-mix__col"}
              >
                <rect
                  className="mcfly-cust-mix__bar mcfly-cust-mix__bar--new"
                  x={barX(i)}
                  y={PLOT_BOTTOM - newH}
                  width={barW}
                  height={newH}
                  rx="2"
                />
                <rect
                  className="mcfly-cust-mix__bar mcfly-cust-mix__bar--ret"
                  x={barX(i)}
                  y={PLOT_BOTTOM - newH - retH}
                  width={barW}
                  height={retH}
                  rx="2"
                />
              </g>
            );
          })}

          <path className="mcfly-cust-mix__line" d={line} />
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

          {buckets.map((b, i) => (
            <rect
              key={`hit-${b.key}`}
              className="mcfly-cust-mix__hit"
              x={PLOT_LEFT + band * i}
              y={PLOT_TOP}
              width={band}
              height={PLOT_H}
              tabIndex={0}
              role="button"
              aria-label={`${b.label}: returning ${formatCurrency(b.returningDollars, currency)}, first-time ${formatCurrency(b.newDollars, currency)}`}
              onMouseEnter={() => setHoverIndex(i)}
              onFocus={() => setHoverIndex(i)}
              onBlur={onPlotPointerLeave}
              onClick={() => openBucket(b)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  openBucket(b);
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
              style={{ top: `${yPct(yForD(tick))}%`, width: `${xPct(PLOT_LEFT - 8)}%` }}
            >
              {overviewCompactMoney(tick, currency)}
            </span>
          ))}
        </div>

        <div className="mcfly-chart__axis-y2" aria-hidden="true">
          {SHARE_TICKS.map((s) => (
            <span
              key={`y2-${s}`}
              className="mcfly-chart__y2tick"
              style={{ top: `${yPct(yForS(s))}%`, right: `${xPct(PAD_R - 8)}%` }}
            >
              {Math.round(s * 100)}%
            </span>
          ))}
        </div>

        {avg != null ? (
          <span
            className="mcfly-chart__rail-k"
            style={{ top: `${yPct(yForS(avg))}%`, left: `${xPct(PLOT_LEFT + 6)}%` }}
            aria-hidden="true"
          >
            avg returning {Math.round(avg * 100)}%
          </span>
        ) : null}

        <div className="mcfly-chart__axis-x" aria-hidden="true">
          {buckets.map((b, i) =>
            labelIndices.has(i) ? (
              <span
                key={`xt-${b.key}`}
                className="mcfly-chart__xtick"
                style={{ left: `${xPct(centerX(i))}%`, top: `${yPct(PLOT_BOTTOM + 7)}%` }}
              >
                {b.label}
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
            <li className="mcfly-chart__tip-row">
              <span className="mcfly-chart__tip-dot mcfly-chart__tip-dot--ret" />
              <span className="mcfly-chart__tip-k">Returning</span>
              <span className="mcfly-chart__tip-v">
                {formatCurrency(active.returningDollars, currency)}
              </span>
            </li>
            <li className="mcfly-chart__tip-row">
              <span className="mcfly-chart__tip-dot mcfly-chart__tip-dot--new" />
              <span className="mcfly-chart__tip-k">First-time</span>
              <span className="mcfly-chart__tip-v">
                {formatCurrency(active.newDollars, currency)}
              </span>
            </li>
            <li className="mcfly-chart__tip-row">
              <span className="mcfly-chart__tip-dot mcfly-chart__tip-dot--share" />
              <span className="mcfly-chart__tip-k">Returning share</span>
              <span className="mcfly-chart__tip-v">
                {sharePct(active.returningShare)}
                {activeVsAvg != null && Math.round(activeVsAvg * 100) !== 0 ? (
                  <span className="mcfly-chart__tip-pct">
                    {" "}
                    · {activeVsAvg > 0 ? "+" : "−"}
                    {Math.abs(Math.round(activeVsAvg * 100))} vs avg
                  </span>
                ) : null}
              </span>
            </li>
          </ul>
          <p className="mcfly-chart__tip-foot">
            {formatCurrency(active.returningDollars, currency)} of{" "}
            {formatCurrency(active.total, currency)} ={" "}
            {sharePct(active.returningShare)} returning
          </p>
        </div>
        ) : null}
      </div>

      <ul className="mcfly-chart__legend" aria-hidden="true">
        <li className="mcfly-chart__legend-item">
          <span className="mcfly-chart__legend-swatch mcfly-cust-mix__sw--ret" />
          Returning $
        </li>
        <li className="mcfly-chart__legend-item">
          <span className="mcfly-chart__legend-swatch mcfly-cust-mix__sw--new" />
          First-time $
        </li>
        <li className="mcfly-chart__legend-item">
          <span className="mcfly-chart__legend-swatch mcfly-cust-mix__sw--line" />
          Returning share
        </li>
      </ul>
    </section>
  );
}
