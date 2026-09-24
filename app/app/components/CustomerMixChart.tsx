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
import { returningMixPendingLine } from "../lib/desk-request-screen";
import {
  overviewChartAxis,
  overviewChartLabelIndices,
  overviewCompactMoney,
} from "../lib/overview-sales-chart";
import {
  bucketMixDays,
  bucketMixWeeks,
  buildReturningMixPlays,
  mixFirstTimePaint,
  mixReturningPaint,
  mixTotalPaint,
  mixSummary,
  resolveMixGrain,
  type CustomerAnalytics,
  type MixBucket,
  type MixExplorerGrain,
  type MixDeltaTone,
  type ReturningMixDelta,
  type ReturningMixPlay,
} from "../lib/customers-analytics";
import { CUSTOMERS_MIX_SECTION_LABEL } from "../lib/customers-first-viewport";

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

/** Headcount beside first-time dollars. Missing lifetime stays an em dash, never 0. */
function firstTimeBuyerLabel(count: number | null): string {
  if (count == null || !Number.isFinite(count)) return "—";
  const noun = count === 1 ? "first-time buyer" : "first-time buyers";
  return `${count.toLocaleString()} ${noun}`;
}

function mixMoney(amount: number | null, currency: string): string {
  if (amount == null || !Number.isFinite(amount)) return "—";
  return formatCurrency(amount, currency);
}

function truncatedMixNote(bucket: { truncatedDollars: number }): string | null {
  if (!(bucket.truncatedDollars > 0)) return null;
  return "Earlier orders exist off this till — not stuffed into returning dollars.";
}

/** Drawn stack — the dollars the column is willing to certify. */
function paintedMixStack(bucket: MixBucket): number {
  return (mixFirstTimePaint(bucket) ?? 0) + (mixReturningPaint(bucket) ?? 0);
}

function MixEmptyFrame({
  pending,
  windowLabel,
}: {
  pending: boolean;
  windowLabel: string;
}) {
  // A designed guest empty — a ghosted marquee, not a bare em dash. Placeholder
  // columns + a dotted share rail read as "a chart lands here", then honest copy.
  const ghost = [0.34, 0.52, 0.44, 0.66, 0.58, 0.78, 0.7];
  return (
    <section
      className="mcfly-chart mcfly-cust-mix mcfly-cust-mix--empty mcfly-chart--soft mcfly-desk-anchor"
      aria-label="New vs returning dollars"
    >
      <div className="mcfly-chart__board">
        <div className="mcfly-chart__masthead">
          <h3 className="mcfly-chart__serif">
            <DeskIcon name="chart" /> New vs returning dollars
          </h3>
          <p className="mcfly-chart__muted">
            First-time vs returning order dollars — daily, weekly, or monthly
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
          ? returningMixPendingLine(windowLabel)
          : "Needs at least two days of orders on file — not zero. Sample shop fills this in; a fresh live shop fills in as orders land."}
      </p>
    </section>
  );
}

/**
 * The Customers marquee — an explorer-grade new-vs-returning dollars trend that
 * leads the tab above the fold. Stacked bars (first-time + returning $) on the
 * left axis, a returning-share line on the right axis, a dashed window-average
 * rail, a Daily / Weekly / Monthly grain toggle, a KPI strip, a dark floating
 * tooltip, and three win-back ActionCards. Order dollars only — no spend, no
 * ad login. Hover/tap a column for the readout; click for the breakdown.
 */

function mixNoun(grain: MixExplorerGrain): "day" | "week" | "month" {
  switch (grain) {
    case "day":
    case "week":
    case "month":
      return grain;
    default: {
      const _never: never = grain;
      return _never;
    }
  }
}

function deltaClass(tone: MixDeltaTone): string {
  switch (tone) {
    case "up":
      return "mcfly-kpi__delta--up";
    case "down":
      return "mcfly-kpi__delta--down";
    case "flat":
      return "mcfly-kpi__delta--flat";
    default: {
      const _never: never = tone;
      return _never;
    }
  }
}

function formatMixDelta(delta: ReturningMixDelta, currency: string): string {
  const sign = delta.amount > 0 ? "+" : delta.amount < 0 ? "−" : "";
  if (delta.unit === "points") {
    return `${sign}${Math.abs(delta.amount)} pts ${delta.versus}`;
  }
  return `${sign}${formatCurrency(Math.abs(delta.amount), currency)} ${delta.versus}`;
}

function playValue(play: ReturningMixPlay, currency: string): string {
  if (play.amount == null || !Number.isFinite(play.amount)) return "—";
  switch (play.amountKind) {
    case "money":
      return formatCurrency(play.amount, currency);
    case "share":
      return `${Math.round(play.amount * 100)}%`;
    case "count":
      return play.amount.toLocaleString();
    default: {
      const _never: never = play.amountKind;
      return _never;
    }
  }
}

function ActionCard({
  play,
  currency,
}: {
  play: ReturningMixPlay;
  currency: string;
}) {
  const drill = useDeskDrill();
  const value = playValue(play, currency);
  const delta = play.delta;
  const open = () =>
    drill?.openDrill({
      title: play.label,
      value,
      kicker: play.verb,
      blocks: [
        { k: "What to do", v: play.detail },
        { k: "Also", v: play.sub },
        delta
          ? { k: "Versus", v: formatMixDelta(delta, currency) }
          : null,
      ].filter((b): b is { k: string; v: string } => b != null),
      next: "Order history only — not an ad login, not a returning-customer rate.",
    });
  const body = (
    <>
      <p className="mcfly-cust-kpi__verb">{play.verb}</p>
      <p className="mcfly-cust-kpi__k">{play.label}</p>
      <p className="mcfly-cust-kpi__v">{value}</p>
      <p className="mcfly-cust-kpi__sub">{play.sub}</p>
      {delta ? (
        <p
          className={`mcfly-cust-mix__delta mcfly-kpi__delta ${deltaClass(delta.tone)}`}
        >
          {formatMixDelta(delta, currency)}
        </p>
      ) : null}
    </>
  );
  const className = `mcfly-cust-kpi mcfly-cust-kpi--${play.tone} mcfly-cust-kpi--soft mcfly-cust-kpi--action`;
  return drill ? (
    <button type="button" className={className} onClick={open}>
      {body}
    </button>
  ) : (
    <div className={className}>{body}</div>
  );
}

export function CustomerMixChart({
  analytics,
  salesPending = false,
  quotedShare = null,
  quotedWindow = null,
}: {
  analytics: CustomerAnalytics;
  salesPending?: boolean;
  /** Period-book returning share. When set, the headline quotes this window only. */
  quotedShare?: number | null;
  quotedWindow?: string | null;
}) {
  const currency = useDeskCurrency();
  const drill = useDeskDrill();
  const weeks = analytics.mixWeekly;
  const days = analytics.mixDaily;

  const [grain, setGrain] = useState<MixExplorerGrain>("week");

  const dayBuckets = useMemo(() => bucketMixDays(days), [days]);
  const weekBuckets = useMemo(() => bucketMixWeeks(weeks, "week"), [weeks]);
  const monthBuckets = useMemo(() => bucketMixWeeks(weeks, "month"), [weeks]);
  const dayReady = dayBuckets.length >= 2;
  const weekReady = weekBuckets.length >= 2;
  const monthReady = monthBuckets.length >= 2;
  const effectiveGrain = resolveMixGrain(grain, {
    day: dayReady,
    week: weekReady,
    month: monthReady,
  });
  const buckets =
    effectiveGrain === "day"
      ? dayBuckets
      : effectiveGrain === "month"
        ? monthBuckets
        : weekBuckets;
  const summary = useMemo(() => mixSummary(buckets), [buckets]);
  const plays = useMemo(
    () =>
      buildReturningMixPlays({
        buckets,
        grain: effectiveGrain,
        winBackDay: analytics.winBackDay,
        saveNowOneOrder: analytics.saveNowOneOrder,
        historyDays: analytics.historyDays,
      }),
    [
      buckets,
      effectiveGrain,
      analytics.winBackDay,
      analytics.saveNowOneOrder,
      analytics.historyDays,
    ],
  );
  const {
    hoverIndex,
    setHoverIndex,
    moveFromEvent,
    onPlotPointerLeave,
  } = useChartHover(
    buckets.length,
    chartSeriesId([effectiveGrain, ...buckets.map((bucket) => bucket.key)]),
  );

  if (!dayReady && !weekReady) {
    return (
      <MixEmptyFrame
        pending={salesPending}
        windowLabel={
          quotedWindow
            ? `the weeks in ${quotedWindow}`
            : "this week"
        }
      />
    );
  }
  const noun = mixNoun(effectiveGrain);

  const maxDollars = Math.max(...buckets.map((b) => paintedMixStack(b)), 1);
  const leftAxis = overviewChartAxis(maxDollars, 4);
  const avg = summary.returningShareAvg;
  const quotedOn =
    quotedWindow != null &&
    quotedWindow.length > 0 &&
    quotedShare != null &&
    Number.isFinite(quotedShare);
  const headlineShare = quotedOn ? quotedShare : avg;
  const headlineWindow = quotedOn
    ? quotedWindow
    : `last ~${analytics.historyDays} days`;

  const { band, barW, rx, barX, centerX } = chartBarLayout({
    plotLeft: PLOT_LEFT,
    plotWidth: PLOT_W,
    count: buckets.length,
    kind: "stack",
  });
  const yForD = (v: number) =>
    PLOT_BOTTOM - Math.min(1, Math.max(0, v / leftAxis.max)) * PLOT_H;
  const yForS = (s: number) =>
    PLOT_BOTTOM - Math.min(1, Math.max(0, s)) * PLOT_H;

  const labelIndices = new Set(
    overviewChartLabelIndices(buckets.length, chartXAxisMaxLabels(buckets.length)),
  );

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
  const tipTopY = yForD(paintedMixStack(active));
  const offTill = truncatedMixNote(
    active.truncatedDollars > 0 ? active : summary,
  );
  const tipEdge =
    xPct(tipCenter) < 26 ? "left" : xPct(tipCenter) > 74 ? "right" : "mid";
  const tipBelow = tipTopY < PLOT_TOP + 92;

  const openBucket = (b: MixBucket) =>
    drill?.openDrill({
      title: `${b.label} · new vs returning`,
      value: mixMoney(mixReturningPaint(b), currency),
      kicker: `${sharePct(b.returningShare)} of the ${noun}'s dollars are returning`,
      blocks: [
        { k: "Returning dollars", v: mixMoney(mixReturningPaint(b), currency) },
        { k: "First-time dollars", v: mixMoney(mixFirstTimePaint(b), currency) },
        { k: "First-time buyers", v: firstTimeBuyerLabel(b.firstTimeBuyers) },
        { k: `Total this ${noun}`, v: mixMoney(mixTotalPaint(b), currency) },
        truncatedMixNote(b)
          ? { k: "Off this till", v: truncatedMixNote(b)! }
          : null,
        {
          k: "What this is",
          v: "Returning = a later stored order for that buyer. A missing lifetime stays — , never stuffed into first-time $. Earlier Shopify orders off this till stay their own empty. Guests stay in first-time dollars and out of the buyer count.",
        },
      ].filter((block): block is { k: string; v: string } => block != null),
      next: "Win-back cards under this chart name who to reach — order history only.",
    });

  const stats = [
    {
      k: "Returning $",
      v: mixMoney(mixReturningPaint(summary), currency),
      sub: `${buckets.length} ${noun}${buckets.length === 1 ? "" : "s"}`,
    },
    {
      k: `Returning share · ${headlineWindow}`,
      v: sharePct(headlineShare),
      sub: headlineWindow,
    },
    {
      k: "First-time $",
      v: mixMoney(mixFirstTimePaint(summary), currency),
      sub: `${firstTimeBuyerLabel(summary.firstTimeBuyers)} · ${buckets.length} ${noun}${buckets.length === 1 ? "" : "s"}`,
    },
    {
      k: `Best ${noun} $`,
      v:
        summary.bestReturning != null
          ? mixMoney(mixReturningPaint(summary.bestReturning), currency)
          : "—",
      sub: summary.bestReturning?.label ?? "peak returning",
    },
  ];

  return (
    <section
      className="mcfly-chart mcfly-cust-mix mcfly-chart--soft mcfly-desk-anchor"
      aria-label={`New vs returning dollars by ${noun}`}
    >
      <div className="mcfly-chart__board">
        <div className="mcfly-chart__head mcfly-chart__board">
          <h3 className="mcfly-chart__h">
            <DeskIcon name="chart" /> {CUSTOMERS_MIX_SECTION_LABEL}
          </h3>
          <p className="mcfly-chart__muted">
            Returning share · {headlineWindow} · {sharePct(headlineShare)}
          </p>
        </div>
        <div className="mcfly-chart__readout" role="status">
          <p className="mcfly-chart__when">
            {active.label} · returning
          </p>
          <p className="mcfly-chart__hero">
            {mixMoney(mixReturningPaint(active), currency)}
          </p>
          <p className="mcfly-cust-mix__readsub">
            {sharePct(active.returningShare)} returning · first-time{" "}
            {mixMoney(mixFirstTimePaint(active), currency)} ·{" "}
            {firstTimeBuyerLabel(active.firstTimeBuyers)}
          </p>
          {offTill ? <p className="mcfly-cust-mix__readsub">{offTill}</p> : null}
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
            className={`mcfly-period__btn${effectiveGrain === "day" ? " mcfly-period__btn--on" : ""}`}
            aria-pressed={effectiveGrain === "day"}
            disabled={!dayReady}
            onClick={() => {
              setGrain("day");
            }}
          >
            Daily
          </button>
          <button
            type="button"
            className={`mcfly-period__btn${effectiveGrain === "week" ? " mcfly-period__btn--on" : ""}`}
            aria-pressed={effectiveGrain === "week"}
            disabled={!weekReady}
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

          {headlineShare != null ? (
            <line
              className="mcfly-cust-mix__rail"
              x1={PLOT_LEFT}
              y1={yForS(headlineShare).toFixed(1)}
              x2={PLOT_RIGHT}
              y2={yForS(headlineShare).toFixed(1)}
              vectorEffect="non-scaling-stroke"
            />
          ) : null}

          {buckets.map((b, i) => {
            const paintedNew = mixFirstTimePaint(b) ?? 0;
            const paintedRet = mixReturningPaint(b) ?? 0;
            const newH = Math.max(0, PLOT_BOTTOM - yForD(paintedNew));
            const retH = Math.max(0, (paintedRet / leftAxis.max) * PLOT_H);
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
                  rx={newH > 0 && retH <= 0 ? rx : 0}
                />
                <rect
                  className="mcfly-cust-mix__bar mcfly-cust-mix__bar--ret"
                  x={barX(i)}
                  y={PLOT_BOTTOM - newH - retH}
                  width={barW}
                  height={retH}
                  rx={retH > 0 ? rx : 0}
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
              aria-label={`${b.label}: returning ${mixMoney(mixReturningPaint(b), currency)}, total ${mixMoney(mixTotalPaint(b), currency)}, first-time ${mixMoney(mixFirstTimePaint(b), currency)}, ${firstTimeBuyerLabel(b.firstTimeBuyers)}${truncatedMixNote(b) ? `. ${truncatedMixNote(b)}` : ""}`}
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

        {headlineShare != null ? (
          <span
            className="mcfly-chart__rail-k"
            style={{ top: `${yPct(yForS(headlineShare))}%`, left: `${xPct(PLOT_LEFT + 6)}%` }}
            aria-hidden="true"
          >
            {quotedOn
              ? `Returning share · ${quotedWindow} ${sharePct(headlineShare)}`
              : `avg returning ${Math.round((avg ?? 0) * 100)}%`}
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
                {mixMoney(mixReturningPaint(active), currency)}
              </span>
            </li>
            <li className="mcfly-chart__tip-row">
              <span className="mcfly-chart__tip-dot mcfly-chart__tip-dot--new" />
              <span className="mcfly-chart__tip-k">First-time</span>
              <span className="mcfly-chart__tip-v">
                {mixMoney(mixFirstTimePaint(active), currency)}
              </span>
            </li>
            <li className="mcfly-chart__tip-row">
              <span className="mcfly-chart__tip-dot mcfly-chart__tip-dot--new" />
              <span className="mcfly-chart__tip-k">First-time buyers</span>
              <span className="mcfly-chart__tip-v">
                {firstTimeBuyerLabel(active.firstTimeBuyers)}
              </span>
            </li>
            <li className="mcfly-chart__tip-row">
              <span className="mcfly-chart__tip-dot mcfly-chart__tip-dot--share" />
              <span className="mcfly-chart__tip-k">
                Returning share · {active.label}
              </span>
              <span className="mcfly-chart__tip-v">
                {sharePct(active.returningShare)}
                {!quotedOn && activeVsAvg != null && Math.round(activeVsAvg * 100) !== 0 ? (
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
            {mixMoney(mixReturningPaint(active), currency)} of{" "}
            {mixMoney(mixTotalPaint(active), currency)} ={" "}
            {sharePct(active.returningShare)} returning
            {truncatedMixNote(active) ? `. ${truncatedMixNote(active)}` : ""}
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

      <div className="mcfly-cust-mix__plays">
        <p className="mcfly-cust-vbars__title">
          <DeskIcon name="clock" /> Win-back
        </p>
        <div className="mcfly-cust-kpis mcfly-cust-kpis--actions">
          {plays.map((play) => (
            <ActionCard key={play.id} play={play} currency={currency} />
          ))}
        </div>
      </div>
    </section>
  );
}
