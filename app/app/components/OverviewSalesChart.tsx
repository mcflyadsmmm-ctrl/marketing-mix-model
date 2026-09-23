import { useMemo, useState } from "react";
import { formatCurrency } from "../lib/mer-format";
import { chartSeriesId, chartTipClassName } from "../lib/chart-smooth";
import {
  chartBarLayout,
  chartBarPlotClassName,
  chartXAxisMaxLabels,
} from "../lib/chart-bar";
import { useChartHover } from "../lib/use-chart-hover";
import { OVERVIEW_PENDING_LINE } from "../lib/overview-first-viewport";
import { OVERVIEW_CHART_CAPTION } from "../lib/overview-order-book";
import {
  overviewAov,
  overviewBucketize,
  overviewChartAxis,
  overviewChartDayLabel,
  overviewChartLabelIndices,
  overviewChartVsCopy,
  overviewCompactMoney,
  overviewCumulative,
  overviewDeltaCopy,
  overviewDeltaPct,
  overviewFilterRange,
  overviewLatestDayKey,
  overviewMedian,
  overviewPresetRange,
  overviewPriorWindow,
  overviewSameDatesSales,
  overviewSameDatesSentence,
  overviewVsTypical,
  overviewVsTypicalPctCopy,
  type ChartGrain,
  type OverviewDelta,
  type OverviewRangePreset,
  type SalesDayInput,
} from "../lib/overview-sales-chart";
import { DeskIcon } from "./DeskIcon";
import { useDeskDrill } from "./DeskDrill";
import { useDeskCurrency } from "../lib/desk-currency";

export type SalesDayPoint = {
  dateKey: string;
  sales: number;
  orders?: number;
};

export const OVERVIEW_CHART_EMPTY = "No days in this window yet";

// SVG paints the shapes; crisp HTML overlays paint axis text + tooltip so type
// never shrinks with the viewBox on a 390–430px phone.
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

const numberFmt = new Intl.NumberFormat("en-US");

const GRAINS: readonly ChartGrain[] = ["day", "week", "month", "quarter"];
const GRAIN_LABEL: Record<ChartGrain, string> = {
  day: "Day",
  week: "Week",
  month: "Month",
  quarter: "Quarter",
};
const GRAIN_NOUN: Record<ChartGrain, string> = {
  day: "day",
  week: "week",
  month: "month",
  quarter: "quarter",
};
const PRESETS: readonly { key: OverviewRangePreset; label: string; long: string }[] = [
  { key: "30d", label: "30d", long: "Last 30 days" },
  { key: "90d", label: "90d", long: "Last 90 days" },
  { key: "6mo", label: "6mo", long: "Last 6 months" },
  { key: "ytd", label: "YTD", long: "Year to date" },
  { key: "1y", label: "1y", long: "Last 12 months" },
];

function ChartEmptyFrame({ copy }: { copy: string }) {
  return (
    <section className="mcfly-well mcfly-well--scoreboard mcfly-chart mcfly-chart--empty" aria-label="Orders by day">
      <div className="mcfly-chart__head">
        <p className="mcfly-chart__title">
          <DeskIcon name="chart" />
          {OVERVIEW_CHART_CAPTION}
        </p>
      </div>
      <p className="mcfly-chart__empty">{copy}</p>
    </section>
  );
}

/**
 * Overview sales-order explorer. Shopify order dollars + order counts only —
 * no ad cost, no efficiency ratios, no spend overlay. This is the depth beyond
 * Shopify Analytics: range presets + FROM/TO + Day/Week/Month/Quarter grain own
 * the window on the chart; a dual axis pairs sales $ bars vs a typical rail
 * (left) with the AOV trend (right, cumulative sweep when orders are unknown);
 * a soft KPI strip carries vs-prior where honest; a dark tooltip carries the
 * day-vs-typical / weekend story with a plain formula.
 */
export function OverviewSalesChart({
  days,
  ordersHref = "/app/orders",
  salesPending = false,
  typicalDay = null,
  historyDays = null,
  initialPreset = "30d",
  initialCustom = null,
}: {
  days: SalesDayPoint[];
  ordersHref?: string;
  salesPending?: boolean;
  typicalDay?: number | null;
  /** Sales days already on the desk, including last year when the chart window is shorter. */
  historyDays?: SalesDayPoint[] | null;
  initialPreset?: OverviewRangePreset | "custom";
  initialCustom?: { fromKey: string; toKey: string } | null;
}) {
  const currency = useDeskCurrency();
  const drill = useDeskDrill();

  const sorted = useMemo<SalesDayInput[]>(
    () =>
      [...days]
        .map((day) => ({
          dateKey: day.dateKey,
          sales: day.sales,
          orders: day.orders ?? 0,
        }))
        .sort((a, b) => a.dateKey.localeCompare(b.dateKey)),
    [days],
  );
  const earliestKey = sorted[0]?.dateKey ?? null;
  const latestKey = overviewLatestDayKey(sorted);

  const [preset, setPreset] = useState<OverviewRangePreset | "custom">(initialPreset);
  const [custom, setCustom] = useState<{ fromKey: string; toKey: string } | null>(
    initialCustom,
  );
  const [grain, setGrain] = useState<ChartGrain>("day");

  const range = useMemo(() => {
    if (preset !== "custom") {
      return (
        overviewPresetRange(preset, sorted) ??
        (earliestKey && latestKey
          ? { fromKey: earliestKey, toKey: latestKey }
          : null)
      );
    }
    return custom;
  }, [preset, custom, sorted, earliestKey, latestKey]);

  const rangeDays = useMemo(
    () =>
      range ? overviewFilterRange(sorted, range.fromKey, range.toKey) : sorted,
    [sorted, range],
  );

  const grainCounts = useMemo(() => {
    const counts = {} as Record<ChartGrain, number>;
    for (const g of GRAINS) counts[g] = overviewBucketize(rangeDays, g).length;
    return counts;
  }, [rangeDays]);

  const effectiveGrain: ChartGrain = grainCounts[grain] >= 2 ? grain : "day";

  const points = useMemo(
    () => overviewBucketize(rangeDays, effectiveGrain),
    [rangeDays, effectiveGrain],
  );
  const {
    hoverIndex,
    setHoverIndex,
    moveFromEvent,
    onPlotPointerLeave,
  } = useChartHover(
    points.length,
    chartSeriesId([
      preset,
      grain,
      range?.fromKey,
      range?.toKey,
      ...points.map((point) => point.key),
    ]),
  );

  if (salesPending) {
    return null;
  }

  if (sorted.length < 2) {
    return <ChartEmptyFrame copy={OVERVIEW_CHART_EMPTY} />;
  }

  const noun = GRAIN_NOUN[effectiveGrain];
  const total = points.reduce((sum, bucket) => sum + bucket.sales, 0);
  const totalOrders = points.reduce((sum, bucket) => sum + bucket.orders, 0);
  const hasOrders = points.some((bucket) => bucket.orders > 0);
  const cumulative = overviewCumulative(points);
  const typical = points.length > 0 ? overviewMedian(points.map((p) => p.sales)) : null;
  const typicalRef =
    typical != null && typical > 0
      ? typical
      : typicalDay != null && typicalDay > 0
        ? typicalDay
        : null;
  const avgBucket = points.length > 0 ? total / points.length : 0;
  const rangeAov = overviewAov(total, totalOrders);
  const aovValues = points.map((bucket) => overviewAov(bucket.sales, bucket.orders));

  const salesMax = Math.max(...points.map((p) => p.sales), typicalRef ?? 0, 1);
  const leftAxis = overviewChartAxis(salesMax, 4);
  const rightRawMax = hasOrders
    ? Math.max(...aovValues.filter((v): v is number => v != null), 1)
    : Math.max(total, 1);
  const rightAxis = overviewChartAxis(rightRawMax, 4);
  const rightLabel = hasOrders ? "AOV" : "Cumulative";

  const { band, barW, rx, barX, centerX } = chartBarLayout({
    plotLeft: PLOT_LEFT,
    plotWidth: PLOT_W,
    count: points.length,
  });
  const yForSales = (value: number) =>
    PLOT_BOTTOM - Math.min(1, Math.max(0, value / leftAxis.max)) * PLOT_H;
  const yForRight = (value: number) =>
    PLOT_BOTTOM - Math.min(1, Math.max(0, value / rightAxis.max)) * PLOT_H;

  const rightValueAt = (index: number): number | null =>
    hasOrders ? aovValues[index] ?? null : cumulative[index] ?? null;

  const railY = typicalRef != null ? yForSales(typicalRef) : null;
  const labelIndices = new Set(
    overviewChartLabelIndices(points.length, chartXAxisMaxLabels(points.length)),
  );

  // Right series line (AOV, or cumulative sweep when orders are unknown).
  let rightLine = "";
  let started = false;
  for (let index = 0; index < points.length; index++) {
    const value = rightValueAt(index);
    if (value == null) {
      started = false;
      continue;
    }
    const cmd = started ? "L" : "M";
    started = true;
    rightLine += `${rightLine ? " " : ""}${cmd}${centerX(index).toFixed(1)} ${yForRight(value).toFixed(1)}`;
  }
  const cumFill =
    !hasOrders && points.length >= 2
      ? `M${centerX(0).toFixed(1)} ${PLOT_BOTTOM} ${points
          .map((_, index) => `L${centerX(index).toFixed(1)} ${yForRight(cumulative[index]!).toFixed(1)}`)
          .join(" ")} L${centerX(points.length - 1).toFixed(1)} ${PLOT_BOTTOM} Z`
      : "";
  let capIndex = -1;
  for (let index = points.length - 1; index >= 0; index--) {
    if (rightValueAt(index) != null) {
      capIndex = index;
      break;
    }
  }

  const activeIndex = hoverIndex != null ? hoverIndex : points.length - 1;
  const active = points[activeIndex] ?? null;
  const activeVs = active ? overviewVsTypical(active.sales, typicalRef) : null;
  const activeVsCopy =
    activeVs != null
      ? overviewChartVsCopy(activeVs, formatCurrency(Math.abs(activeVs.delta), currency))
      : null;
  const activePctCopy = overviewVsTypicalPctCopy(activeVs, typicalRef);
  const activeAov = active ? overviewAov(active.sales, active.orders) : null;

  // Presets keep the equal-length window immediately before this range.
  // A custom from/to compares to those calendar dates last year instead.
  const customRange = preset === "custom" && range != null;
  const priorWin =
    !customRange && range ? overviewPriorWindow(range.fromKey, range.toKey) : null;
  const priorDays = priorWin
    ? overviewFilterRange(sorted, priorWin.fromKey, priorWin.toKey)
    : [];
  const priorHasData = priorDays.length >= Math.max(2, Math.floor(rangeDays.length * 0.6));
  const priorSales = priorDays.reduce((sum, day) => sum + day.sales, 0);
  const priorOrders = priorDays.reduce((sum, day) => sum + (day.orders ?? 0), 0);
  const priorAov = overviewAov(priorSales, priorOrders);
  const salesDelta = priorHasData ? overviewDeltaPct(total, priorSales) : null;
  const ordersDelta =
    priorHasData && hasOrders ? overviewDeltaPct(totalOrders, priorOrders) : null;
  const aovDelta =
    priorHasData && hasOrders && rangeAov != null && priorAov != null
      ? overviewDeltaPct(rangeAov, priorAov)
      : null;

  const sameDatesSource = new Map<string, number>();
  for (const day of historyDays ?? []) {
    if (Number.isFinite(day.sales)) sameDatesSource.set(day.dateKey, day.sales);
  }
  for (const day of sorted) {
    if (!sameDatesSource.has(day.dateKey) && Number.isFinite(day.sales)) {
      sameDatesSource.set(day.dateKey, day.sales);
    }
  }
  const sameDatesSentence =
    customRange && range
      ? overviewSameDatesSentence({
          fromKey: range.fromKey,
          toKey: range.toKey,
          sales: total,
          priorSales: overviewSameDatesSales(
            [...sameDatesSource.entries()].map(([dateKey, sales]) => ({
              dateKey,
              sales,
            })),
            range.fromKey,
            range.toKey,
          ),
          money: (amount) => formatCurrency(amount, currency),
        })
      : null;

  const rangeLabel =
    preset !== "custom"
      ? PRESETS.find((p) => p.key === preset)?.long ?? "Range"
      : range
        ? `${overviewChartDayLabel(range.fromKey)} – ${overviewChartDayLabel(range.toKey)}`
        : "Range";

  const bestBucket = points.reduce(
    (best, bucket) => (bucket.sales > best.sales ? bucket : best),
    points[0]!,
  );

  type Stat = { k: string; v: string; delta?: OverviewDelta | null; sub: string };
  const statCards: Stat[] = hasOrders
    ? [
        { k: "Sales", v: formatCurrency(total, currency), delta: salesDelta, sub: `${points.length} ${noun}s` },
        { k: "Orders", v: numberFmt.format(totalOrders), delta: ordersDelta, sub: "in range" },
        {
          k: "AOV",
          v: rangeAov != null ? formatCurrency(rangeAov, currency) : "—",
          delta: aovDelta,
          sub: "per order",
        },
        {
          k: `Typical ${noun}`,
          v: typicalRef != null ? formatCurrency(typicalRef, currency) : "—",
          sub: "median",
        },
      ]
    : [
        { k: "Sales", v: formatCurrency(total, currency), delta: salesDelta, sub: `${points.length} ${noun}s` },
        {
          k: `Typical ${noun}`,
          v: typicalRef != null ? formatCurrency(typicalRef, currency) : "—",
          sub: "median",
        },
        { k: `Avg ${noun}`, v: formatCurrency(avgBucket, currency), sub: "mean" },
        { k: `Best ${noun}`, v: formatCurrency(bestBucket.sales, currency), sub: bestBucket.label },
      ];

  const tipOpen = hoverIndex != null && active != null;
  const tipCenter = centerX(activeIndex);
  const tipTopY = active ? yForSales(active.sales) : PLOT_TOP;
  const tipEdge =
    xPct(tipCenter) < 26 ? "left" : xPct(tipCenter) > 74 ? "right" : "mid";
  const tipBelow = tipTopY < PLOT_TOP + 84;

  const clampKey = (value: string): string => {
    if (earliestKey && value < earliestKey) return earliestKey;
    if (latestKey && value > latestKey) return latestKey;
    return value;
  };

  return (
    <section
      className="mcfly-well mcfly-well--scoreboard mcfly-chart mcfly-chart--sales"
      aria-label={OVERVIEW_CHART_CAPTION}
    >
      <h3 className="mcfly-chart__serif">{OVERVIEW_CHART_CAPTION}</h3>
      <div className="mcfly-chart__head mcfly-chart__board">
        <div className="mcfly-chart__masthead">
          <p className="mcfly-chart__muted">{rangeLabel}</p>
          {sameDatesSentence ? (
            <span className="mcfly-chart__sr" data-overview-compare="same-dates">
              {sameDatesSentence}
            </span>
          ) : null}
        </div>
        {active ? (
          <div className="mcfly-chart__readout" role="status">
            <p className="mcfly-chart__when">{active.label}</p>
            <p className="mcfly-chart__hero">
              {formatCurrency(active.sales, currency)}
            </p>
            {activeVsCopy ? (
              <p
                className={`mcfly-chart__vs mcfly-chart__vs--${activeVs?.kind ?? "even"}`}
              >
                {activeVsCopy}
              </p>
            ) : null}
          </div>
        ) : (
          <p className="mcfly-chart__hover mcfly-chart__hover--idle" aria-hidden="true">
            Tap a bar
          </p>
        )}
      </div>

      <ul className="mcfly-chart__stats mcfly-chart__stats--soft">
        {statCards.map((stat) => {
          const deltaCopy = overviewDeltaCopy(stat.delta ?? null);
          return (
            <li className="mcfly-chart__stat" key={stat.k}>
              <span className="mcfly-chart__stat-k">{stat.k}</span>
              <span className="mcfly-chart__stat-v">{stat.v}</span>
              {deltaCopy ? (
                <span
                  className={`mcfly-chart__stat-delta mcfly-chart__stat-delta--${stat.delta?.kind ?? "even"}`}
                >
                  {deltaCopy}
                </span>
              ) : (
                <span className="mcfly-chart__stat-sub">{stat.sub}</span>
              )}
            </li>
          );
        })}
      </ul>

      <div className="mcfly-chart__controls">
        <div className="mcfly-period__group" role="group" aria-label="Sales range">
          {PRESETS.map((option) => (
            <button
              key={option.key}
              type="button"
              className={`mcfly-period__btn${preset === option.key ? " mcfly-period__btn--on" : ""}`}
              aria-pressed={preset === option.key}
              onClick={() => {
                setPreset(option.key);
                setCustom(null);
                setHoverIndex(null);
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
        {earliestKey && latestKey ? (
          <div className="mcfly-chart__dates">
            <label className="mcfly-chart__date">
              <span>From</span>
              <input
                type="date"
                value={range?.fromKey ?? earliestKey}
                min={earliestKey}
                max={latestKey}
                onChange={(event) => {
                  const fromKey = clampKey(event.target.value || earliestKey);
                  const toKey = range?.toKey ?? latestKey;
                  setCustom({ fromKey, toKey: toKey < fromKey ? fromKey : toKey });
                  setPreset("custom");
                  setHoverIndex(null);
                }}
              />
            </label>
            <label className="mcfly-chart__date">
              <span>To</span>
              <input
                type="date"
                value={range?.toKey ?? latestKey}
                min={earliestKey}
                max={latestKey}
                onChange={(event) => {
                  const toKey = clampKey(event.target.value || latestKey);
                  const fromKey = range?.fromKey ?? earliestKey;
                  setCustom({ toKey, fromKey: fromKey > toKey ? toKey : fromKey });
                  setPreset("custom");
                  setHoverIndex(null);
                }}
              />
            </label>
          </div>
        ) : null}
        <div className="mcfly-period__group" role="group" aria-label="Chart grain">
          {GRAINS.map((option) => (
            <button
              key={option}
              type="button"
              className={`mcfly-period__btn${effectiveGrain === option ? " mcfly-period__btn--on" : ""}`}
              aria-pressed={effectiveGrain === option}
              disabled={grainCounts[option] < 2}
              onClick={() => {
                setGrain(option);
                setHoverIndex(null);
              }}
            >
              {GRAIN_LABEL[option]}
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
          aria-label={`${points.length} ${effectiveGrain} sales bars vs typical, with the ${rightLabel.toLowerCase()} trend`}
        >
          {effectiveGrain === "day"
            ? points.map((point, index) =>
                point.weekend ? (
                  <rect
                    key={`wk-${point.key}`}
                    className="mcfly-chart__weekend"
                    x={PLOT_LEFT + band * index}
                    y={PLOT_TOP}
                    width={band}
                    height={PLOT_H}
                  />
                ) : null,
              )
            : null}

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

          {cumFill ? <path className="mcfly-chart__sales-fill" d={cumFill} /> : null}

          {railY != null ? (
            <line
              className="mcfly-chart__typical"
              x1={PLOT_LEFT}
              y1={railY.toFixed(1)}
              x2={PLOT_RIGHT}
              y2={railY.toFixed(1)}
              vectorEffect="non-scaling-stroke"
            />
          ) : null}

          {points.map((point, index) => {
            const barH = Math.max(1.5, PLOT_BOTTOM - yForSales(point.sales));
            const y = PLOT_BOTTOM - barH;
            const vs = overviewVsTypical(point.sales, typicalRef);
            const aov = overviewAov(point.sales, point.orders);
            const openBar = () =>
              drill?.openDrill({
                title: `${GRAIN_LABEL[effectiveGrain]} sales`,
                value: formatCurrency(point.sales, currency),
                kicker: point.label,
                blocks: [
                  { k: "Sales", v: formatCurrency(point.sales, currency) },
                  point.orders > 0 ? { k: "Orders", v: numberFmt.format(point.orders) } : null,
                  aov != null ? { k: "AOV", v: formatCurrency(aov, currency) } : null,
                  typicalRef != null
                    ? { k: `Typical ${noun}`, v: formatCurrency(typicalRef, currency) }
                    : null,
                  vs && vs.kind !== "even"
                    ? {
                        k: "Vs typical",
                        v: `${vs.kind === "up" ? "+" : "−"}${formatCurrency(Math.abs(vs.delta), currency)}`,
                      }
                    : null,
                  point.weekend ? { k: "Day type", v: "Weekend" } : null,
                  {
                    k: "What this is",
                    v: "Order-book day sum for this bar next to typical daily sales, orders, and AOV. Grain and range live on the chart — never spend. Not Analytics day totals.",
                  },
                ].filter((block): block is { k: string; v: string } => block != null),
                next: "Open Orders for typical ticket, discounts, and weekend.",
                nextHref: ordersHref,
                nextLabel: "Open Orders",
              });
            const barClass = [
              "mcfly-chart__bar",
              point.weekend ? "mcfly-chart__bar--weekend" : null,
              vs?.kind === "up" ? "mcfly-chart__bar--hot" : null,
              vs?.kind === "down" ? "mcfly-chart__bar--cool" : null,
              activeIndex === index ? "mcfly-chart__bar--on" : null,
            ]
              .filter(Boolean)
              .join(" ");
            return (
              <rect
                key={point.key}
                className={barClass}
                x={barX(index)}
                y={y}
                width={barW}
                height={barH}
                rx={rx}
                tabIndex={0}
                role="button"
                aria-label={`${point.label} ${formatCurrency(point.sales, currency)}`}
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
            );
          })}

          {rightLine ? <path className="mcfly-chart__sales-line" d={rightLine} /> : null}
          {capIndex >= 0 ? (
            <circle
              className="mcfly-chart__cum-cap"
              cx={centerX(capIndex).toFixed(1)}
              cy={yForRight(rightValueAt(capIndex)!).toFixed(1)}
              r={3}
            />
          ) : null}

          {active ? (
            <>
              <line
                className="mcfly-chart__guide"
                x1={tipCenter.toFixed(1)}
                y1={PLOT_TOP}
                x2={tipCenter.toFixed(1)}
                y2={PLOT_BOTTOM}
                vectorEffect="non-scaling-stroke"
              />
              <circle
                className="mcfly-chart__marker"
                cx={tipCenter.toFixed(1)}
                cy={yForSales(active.sales).toFixed(1)}
                r={3.5}
              />
            </>
          ) : null}
        </svg>

        <div className="mcfly-chart__axis-y" aria-hidden="true">
          {leftAxis.ticks.map((tick) => (
            <span
              key={`yt-${tick}`}
              className="mcfly-chart__ytick"
              style={{ top: `${yPct(yForSales(tick))}%`, width: `${xPct(PLOT_LEFT - 8)}%` }}
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
              style={{ top: `${yPct(yForRight(tick))}%`, right: `${xPct(PAD_R - 8)}%` }}
            >
              {overviewCompactMoney(tick, currency)}
            </span>
          ))}
        </div>

        {railY != null ? (
          <span
            className="mcfly-chart__rail-k"
            style={{ top: `${yPct(railY)}%`, left: `${xPct(PLOT_LEFT + 6)}%` }}
            aria-hidden="true"
          >
            typical {noun} {formatCurrency(typicalRef!, currency)}
          </span>
        ) : null}

        <div className="mcfly-chart__axis-x" aria-hidden="true">
          {points.map((point, index) =>
            labelIndices.has(index) ? (
              <span
                key={`xt-${point.key}`}
                className="mcfly-chart__xtick"
                style={{ left: `${xPct(centerX(index))}%`, top: `${yPct(PLOT_BOTTOM + 7)}%` }}
              >
                {point.label}
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
            <p className="mcfly-chart__tip-when">
              {active.label}
              {active.weekend ? (
                <span className="mcfly-chart__tip-tag">Weekend</span>
              ) : null}
            </p>
            <ul className="mcfly-chart__tip-rows">
              <li className="mcfly-chart__tip-row">
                <span className="mcfly-chart__tip-dot mcfly-chart__tip-dot--sales" />
                <span className="mcfly-chart__tip-k">Sales</span>
                <span className="mcfly-chart__tip-v">
                  {formatCurrency(active.sales, currency)}
                </span>
              </li>
              {active.orders > 0 ? (
                <li className="mcfly-chart__tip-row">
                  <span className="mcfly-chart__tip-dot mcfly-chart__tip-dot--orders" />
                  <span className="mcfly-chart__tip-k">Orders</span>
                  <span className="mcfly-chart__tip-v">
                    {numberFmt.format(active.orders)}
                  </span>
                </li>
              ) : null}
              {activeAov != null ? (
                <li className="mcfly-chart__tip-row">
                  <span className="mcfly-chart__tip-dot mcfly-chart__tip-dot--aov" />
                  <span className="mcfly-chart__tip-k">AOV</span>
                  <span className="mcfly-chart__tip-v">
                    {formatCurrency(activeAov, currency)}
                  </span>
                </li>
              ) : null}
              {typicalRef != null ? (
                <li className="mcfly-chart__tip-row">
                  <span className="mcfly-chart__tip-dot mcfly-chart__tip-dot--typical" />
                  <span className="mcfly-chart__tip-k">Typical {noun}</span>
                  <span className="mcfly-chart__tip-v">
                    {formatCurrency(typicalRef, currency)}
                  </span>
                </li>
              ) : null}
              {activeVs && activeVs.kind !== "even" ? (
                <li className="mcfly-chart__tip-row">
                  <span className="mcfly-chart__tip-dot mcfly-chart__tip-dot--vs" />
                  <span className="mcfly-chart__tip-k">Vs typical</span>
                  <span
                    className={`mcfly-chart__tip-v mcfly-chart__tip-v--${activeVs.kind}`}
                  >
                    {activeVs.kind === "up" ? "+" : "−"}
                    {formatCurrency(Math.abs(activeVs.delta), currency)}
                    {activePctCopy ? (
                      <span className="mcfly-chart__tip-pct"> · {activePctCopy}</span>
                    ) : null}
                  </span>
                </li>
              ) : null}
            </ul>
            {typicalRef != null && activeVs ? (
              <p className="mcfly-chart__tip-foot">
                {activeVs.kind === "even"
                  ? `${formatCurrency(active.sales, currency)} · even with typical`
                  : `${formatCurrency(active.sales, currency)} vs typical ${formatCurrency(typicalRef, currency)} = ${activeVs.kind === "up" ? "+" : "−"}${formatCurrency(Math.abs(activeVs.delta), currency)}${activePctCopy ? ` (${activeVs.kind === "up" ? "+" : "−"}${Math.round((Math.abs(activeVs.delta) / typicalRef) * 100)}%)` : ""}`}
              </p>
            ) : null}
          </div>
        ) : null}
      </div>

      <ul className="mcfly-chart__legend" aria-hidden="true">
        <li className="mcfly-chart__legend-item">
          <span className="mcfly-chart__legend-swatch mcfly-chart__legend-swatch--hot" />
          Above typical
        </li>
        <li className="mcfly-chart__legend-item">
          <span className="mcfly-chart__legend-swatch mcfly-chart__legend-swatch--cool" />
          Below typical
        </li>
        {points.some((point) => point.weekend) ? (
          <li className="mcfly-chart__legend-item">
            <span className="mcfly-chart__legend-swatch mcfly-chart__legend-swatch--weekend" />
            Weekend
          </li>
        ) : null}
        {typicalRef != null ? (
          <li className="mcfly-chart__legend-item">
            <span className="mcfly-chart__legend-swatch mcfly-chart__legend-swatch--rail" />
            Typical {noun}
          </li>
        ) : null}
        <li className="mcfly-chart__legend-item">
          <span
            className={`mcfly-chart__legend-swatch ${hasOrders ? "mcfly-chart__legend-swatch--aov" : "mcfly-chart__legend-swatch--cum"}`}
          />
          {rightLabel}
        </li>
      </ul>
    </section>
  );
}
