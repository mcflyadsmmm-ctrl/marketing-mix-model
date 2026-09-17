import { useMemo, useState } from "react";
import { DeskIcon } from "./DeskIcon";
import { useDeskDrill } from "./DeskDrill";
import { chartSeriesId, chartTipClassName } from "../lib/chart-smooth";
import { useChartHover } from "../lib/use-chart-hover";
import { useDeskCurrency } from "../lib/desk-currency";
import { formatCurrency } from "../lib/mer-format";
import {
  buildOrdersChartBars,
  ordersPct,
  type OrdersChartGrain,
} from "../lib/orders-scoreboard";

export const ORDERS_CHART_EMPTY = "Needs five days with sales — not $0.";
export const ORDERS_HOUR_EMPTY =
  "Needs more orders for a shop-local hour mix — not $0.";

/**
 * Weekday / hour sales. Grain lives on this chart — not in the tab bar.
 * Order dollars only.
 */
export function OrdersTimingChart({
  weekdayShares,
  hourlyShares,
  windowSales = null,
  peakWeekday = null,
  peakHour = null,
  salesPending = false,
}: {
  weekdayShares: number[] | null;
  hourlyShares: number[] | null;
  windowSales?: number | null;
  peakWeekday?: number | null;
  peakHour?: number | null;
  salesPending?: boolean;
}) {
  const currency = useDeskCurrency();
  const drill = useDeskDrill();
  const [grain, setGrain] = useState<OrdersChartGrain>("weekday");
  const bars = useMemo(
    () =>
      buildOrdersChartBars({
        grain,
        weekdayShares,
        hourlyShares,
        windowSales,
        peakWeekday,
        peakHour,
      }),
    [grain, weekdayShares, hourlyShares, windowSales, peakWeekday, peakHour],
  );
  const {
    hoverIndex,
    setHoverIndex,
    moveFromEvent,
    onPlotPointerLeave,
  } = useChartHover(
    bars.length,
    chartSeriesId([grain, ...bars.map((bar) => bar.key)]),
  );
  const hoverKey =
    hoverIndex != null ? (bars[hoverIndex]?.key ?? null) : null;
  const liveBars = bars.filter((bar) => bar.share > 0);
  const active =
    bars.find((bar) => bar.key === hoverKey) ??
    liveBars.find((bar) => bar.peak) ??
    liveBars[0] ??
    null;
  const max = Math.max(...bars.map((bar) => bar.share), 0.01);
  const rankedKeys = [...liveBars]
    .sort((a, b) => b.share - a.share)
    .map((bar) => bar.key);
  const activeIndex = active ? bars.findIndex((bar) => bar.key === active.key) : -1;
  const activeRank = active ? rankedKeys.indexOf(active.key) + 1 : 0;
  const tipLeft =
    activeIndex >= 0 && bars.length > 0
      ? Math.min(88, Math.max(12, ((activeIndex + 0.5) / bars.length) * 100))
      : 50;
  const rankCopy = active?.peak
    ? grain === "hour"
      ? "Busiest hour"
      : "Busiest weekday"
    : activeRank > 0
      ? `#${activeRank} of ${liveBars.length}`
      : "—";
  const emptyCopy = salesPending
    ? "Sales for closed days are still loading — not $0."
    : grain === "hour"
      ? ORDERS_HOUR_EMPTY
      : ORDERS_CHART_EMPTY;

  if (bars.length === 0 || !bars.some((bar) => bar.share > 0)) {
    return (
      <section
        className="mcfly-chart mcfly-chart--empty mcfly-chart--orders mcfly-chart--soft"
        aria-label="Sales by weekday or hour"
      >
        <div className="mcfly-chart__head mcfly-chart__board">
          <p className="mcfly-chart__title">
            <DeskIcon name="chart" />
            When sales land
          </p>
          <GrainToggle grain={grain} onChange={setGrain} />
        </div>
        <p className="mcfly-chart__empty">{emptyCopy}</p>
      </section>
    );
  }

  const activeValue =
    active?.dollars != null
      ? formatCurrency(active.dollars, currency)
      : active
        ? ordersPct(active.share)
        : "—";

  return (
    <section
      className={`mcfly-chart mcfly-chart--orders mcfly-chart--${grain} mcfly-chart--soft`}
      aria-label="Sales by weekday or hour"
    >
      <div className="mcfly-chart__head mcfly-chart__board">
        <p className="mcfly-chart__title">
          <DeskIcon name="chart" />
          When sales land
        </p>
        {active ? (
          <div className="mcfly-chart__readout" role="status">
            <p className="mcfly-chart__when">{active.label}</p>
            <p className="mcfly-chart__hero">{activeValue}</p>
            <p className="mcfly-chart__vs mcfly-chart__vs--plain">
              {ordersPct(active.share)} of this window
              {active.weekend ? " · weekend" : ""}
              {active.peak ? " · busiest" : ""}
            </p>
          </div>
        ) : (
          <p className="mcfly-chart__hover mcfly-chart__hover--idle" aria-hidden="true">
            Tap a bar
          </p>
        )}
        <GrainToggle
          grain={grain}
          onChange={(next) => {
            setGrain(next);
          }}
        />
      </div>
      <div className="mcfly-chart__plot">
        {active && hoverKey ? (
          <div
            className={chartTipClassName({ open: true })}
            role="status"
            style={{ left: `${tipLeft}%` }}
          >
            <p className="mcfly-chart__tip-h">{active.label}</p>
            {active.dollars != null ? (
              <p className="mcfly-chart__tip-row">
                <span className="mcfly-chart__tip-k">Sales</span>
                <span className="mcfly-chart__tip-v">
                  {formatCurrency(active.dollars, currency)}
                </span>
              </p>
            ) : null}
            <p className="mcfly-chart__tip-row">
              <span className="mcfly-chart__tip-k">Share</span>
              <span className="mcfly-chart__tip-v">
                {ordersPct(active.share)} of window
              </span>
            </p>
            <p className="mcfly-chart__tip-row">
              <span className="mcfly-chart__tip-k">Rank</span>
              <span className="mcfly-chart__tip-v">{rankCopy}</span>
            </p>
            <p className="mcfly-chart__tip-foot">
              {active.weekend
                ? "Weekend · shop-local"
                : grain === "hour"
                  ? "Shop-local hour"
                  : "Shop-local weekday"}
            </p>
          </div>
        ) : null}
        <div
          className={
            grain === "hour" ? "mcfly-chart__hours" : "mcfly-chart__days"
          }
          onPointerMove={moveFromEvent}
          onPointerLeave={onPlotPointerLeave}
        >
          {bars.map((bar, index) => {
          const value =
            bar.dollars != null
              ? formatCurrency(bar.dollars, currency)
              : bar.share > 0
                ? ordersPct(bar.share)
                : "—";
          const open = () =>
            drill?.openDrill({
              title: bar.label,
              value,
              kicker: grain === "hour" ? "Shop-local hour" : "Shop-local weekday",
              blocks: [
                bar.dollars != null
                  ? { k: "Sales", v: formatCurrency(bar.dollars, currency) }
                  : null,
                {
                  k: "Share",
                  v: `${ordersPct(bar.share)} of sales this window`,
                },
                {
                  k: "What this is",
                  v: "Share of sales in the selected window. Grain lives on this chart — Shopify Analytics Overview does not put weekday and hour next to typical order.",
                },
              ].filter((block): block is { k: string; v: string } => block != null),
              next: "Typical ticket and the sales clock sit above this chart.",
            });
          return (
            <button
              type="button"
              className={[
                grain === "hour" ? "mcfly-chart__hour" : "mcfly-chart__day",
                bar.weekend ? "mcfly-chart__day--weekend" : null,
                bar.peak ? "mcfly-chart__day--peak" : null,
                active?.key === bar.key ? "mcfly-chart__day--on" : null,
              ]
                .filter(Boolean)
                .join(" ")}
              key={bar.key}
              onClick={open}
              onMouseEnter={() => setHoverIndex(index)}
              onFocus={() => setHoverIndex(index)}
            >
              <span
                className="mcfly-chart__day-bar"
                style={{ height: `${Math.max(8, (bar.share / max) * 88)}%` }}
              />
              <span className="mcfly-chart__day-k">
                {grain === "hour" ? hourTick(bar.label) : bar.label}
              </span>
              {grain === "weekday" ? (
                <span className="mcfly-chart__day-v">{value}</span>
              ) : null}
            </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function GrainToggle({
  grain,
  onChange,
}: {
  grain: OrdersChartGrain;
  onChange: (grain: OrdersChartGrain) => void;
}) {
  return (
    <div className="mcfly-period__group" role="group" aria-label="Chart grain">
      {(["weekday", "hour"] as const).map((value) => (
        <button
          key={value}
          type="button"
          className={`mcfly-period__btn${grain === value ? " mcfly-period__btn--on" : ""}`}
          aria-pressed={grain === value}
          onClick={() => onChange(value)}
        >
          {value === "weekday" ? "Weekday" : "Hour"}
        </button>
      ))}
    </div>
  );
}

function hourTick(label: string): string {
  const start = label.split("–")[0]?.trim() ?? label;
  return start.replace(/ (am|pm)$/i, "");
}
