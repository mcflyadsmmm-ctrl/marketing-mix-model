import { useMemo, useState } from "react";
import { formatCurrency } from "../lib/mer-format";
import { OVERVIEW_PENDING_LINE } from "../lib/overview-first-viewport";
import {
  overviewChartDayLabel,
  overviewChartVsCopy,
  overviewVsTypical,
} from "../lib/overview-sales-chart";
import { DeskIcon } from "./DeskIcon";
import { useDeskDrill } from "./DeskDrill";
import { useDeskCurrency } from "../lib/desk-currency";

export type SalesDayPoint = {
  dateKey: string;
  sales: number;
};

export const OVERVIEW_CHART_EMPTY = "No days in this window yet";

function weekKey(dateKey: string): string {
  const [year, month, day] = dateKey.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  const utc = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
  const dayNum = new Date(utc).getUTCDay() || 7;
  const thursday = new Date(utc);
  thursday.setUTCDate(thursday.getUTCDate() + 4 - dayNum);
  const yearStart = Date.UTC(thursday.getUTCFullYear(), 0, 1);
  const week = Math.ceil(((utc - yearStart) / 86400000 + 1) / 7);
  return `${thursday.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

function bucketsForGrain(
  days: SalesDayPoint[],
  grain: "day" | "week",
): SalesDayPoint[] {
  if (grain === "day") return days;
  const map = new Map<string, number>();
  for (const day of days) {
    const key = weekKey(day.dateKey);
    map.set(key, (map.get(key) ?? 0) + day.sales);
  }
  return [...map.entries()].map(([dateKey, sales]) => ({
    dateKey,
    sales,
  }));
}

function isWeekendDateKey(dateKey: string): boolean {
  if (dateKey.includes("W")) return false;
  const [year, month, day] = dateKey.split("-").map(Number);
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) {
    return false;
  }
  const weekday = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
  return weekday === 0 || weekday === 6;
}

function ChartEmptyFrame({ copy }: { copy: string }) {
  return (
    <section className="mcfly-chart mcfly-chart--empty" aria-label="Sales by day">
      <div className="mcfly-chart__head">
        <p className="mcfly-chart__title">
          <DeskIcon name="chart" />
          Sales
        </p>
      </div>
      <p className="mcfly-chart__empty">{copy}</p>
    </section>
  );
}

/**
 * Sales bars + polyline (including $0 days). Order dollars only —
 * spend never overlays. Grain (day/week) lives on the chart.
 */
export function OverviewSalesChart({
  days,
  ordersHref = "/app/orders",
  salesPending = false,
  typicalDay = null,
}: {
  days: SalesDayPoint[];
  ordersHref?: string;
  salesPending?: boolean;
  typicalDay?: number | null;
}) {
  const currency = useDeskCurrency();
  const drill = useDeskDrill();
  const [grain, setGrain] = useState<"day" | "week">("day");
  const points = useMemo(
    () => bucketsForGrain(days, grain),
    [days, grain],
  );
  const [hover, setHover] = useState<SalesDayPoint | null>(
    () => points[points.length - 1] ?? null,
  );

  if (points.length < 2) {
    return (
      <ChartEmptyFrame
        copy={salesPending ? OVERVIEW_PENDING_LINE : OVERVIEW_CHART_EMPTY}
      />
    );
  }

  const typical =
    typicalDay != null && Number.isFinite(typicalDay) && typicalDay > 0
      ? typicalDay
      : null;
  const max = Math.max(
    ...points.map((point) => point.sales),
    typical ?? 0,
    1,
  );
  const width = 640;
  const height = 240;
  const gap = 3;
  const barW = Math.max(4, (width - gap * (points.length + 1)) / points.length);
  const plotH = height - 28;
  const baseline = height - 18;
  const active = hover ?? points[points.length - 1] ?? null;
  const typicalY =
    typical != null
      ? baseline - Math.max(2, (typical / max) * plotH)
      : null;
  const linePts = points.map((point, index) => {
    const x = gap + index * (barW + gap) + barW / 2;
    const y = baseline - Math.max(2, (point.sales / max) * plotH);
    return { x, y };
  });
  const line = linePts
    .map((pt, index) => `${index === 0 ? "M" : "L"}${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`)
    .join(" ");
  const fill =
    linePts.length >= 2
      ? `M${linePts[0]!.x.toFixed(1)} ${baseline} ${linePts
          .map((pt) => `L${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`)
          .join(" ")} L${linePts[linePts.length - 1]!.x.toFixed(1)} ${baseline} Z`
      : "";
  const activeVs = active ? overviewVsTypical(active.sales, typical) : null;
  const activeVsCopy =
    activeVs != null
      ? overviewChartVsCopy(
          activeVs,
          formatCurrency(Math.abs(activeVs.delta), currency),
        )
      : null;

  return (
    <section className="mcfly-chart mcfly-chart--sales" aria-label="Sales by day">
      <div className="mcfly-chart__head mcfly-chart__board">
        <p className="mcfly-chart__title">
          <DeskIcon name="chart" />
          Sales
        </p>
        {active ? (
          <div className="mcfly-chart__readout" role="status">
            <p className="mcfly-chart__when">
              {overviewChartDayLabel(active.dateKey)}
            </p>
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
        <div className="mcfly-period__group" role="group" aria-label="Chart grain">
          {(["day", "week"] as const).map((value) => (
            <button
              key={value}
              type="button"
              className={`mcfly-period__btn${grain === value ? " mcfly-period__btn--on" : ""}`}
              aria-pressed={grain === value}
              onClick={() => {
                setGrain(value);
                setHover(null);
              }}
            >
              {value === "day" ? "Day" : "Week"}
            </button>
          ))}
        </div>
      </div>
      <svg
        className="mcfly-chart__svg"
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={`${points.length} ${grain} sales bars`}
      >
        {points.map((point, index) => {
          if (grain !== "day" || !isWeekendDateKey(point.dateKey)) return null;
          const x = gap + index * (barW + gap);
          return (
            <rect
              key={`wk-${point.dateKey}`}
              className="mcfly-chart__weekend"
              x={x - gap / 2}
              y={8}
              width={barW + gap}
              height={plotH}
            />
          );
        })}
        {fill ? <path className="mcfly-chart__sales-fill" d={fill} /> : null}
        {typicalY != null ? (
          <>
            <line
              className="mcfly-chart__typical"
              x1="0"
              y1={typicalY.toFixed(1)}
              x2={width}
              y2={typicalY.toFixed(1)}
            />
            <text
              className="mcfly-chart__typical-k"
              x={8}
              y={Math.max(14, typicalY - 6)}
              textAnchor="start"
            >
              typical
              {typical != null ? ` ${formatCurrency(typical, currency)}` : ""}
            </text>
          </>
        ) : null}
        {points.map((point, index) => {
          const barH = Math.max(2, (point.sales / max) * plotH);
          const x = gap + index * (barW + gap);
          const y = baseline - barH;
          const vs = overviewVsTypical(point.sales, typical);
          const openBar = () =>
            drill?.openDrill({
              title: grain === "week" ? "Week sales" : "Day sales",
              value: formatCurrency(point.sales, currency),
              kicker: overviewChartDayLabel(point.dateKey),
              blocks: [
                {
                  k: "Sales",
                  v: formatCurrency(point.sales, currency),
                },
                typical != null
                  ? {
                      k: "Typical day",
                      v: formatCurrency(typical, currency),
                    }
                  : null,
                vs && vs.kind !== "even"
                  ? {
                      k: "Vs typical",
                      v: `${vs.kind === "up" ? "+" : "−"}${formatCurrency(Math.abs(vs.delta), currency)}`,
                    }
                  : null,
                {
                  k: "What this is",
                  v: "Shopify Total Sales for this bar next to typical daily sales. Grain lives on the chart — not in the tab bar.",
                },
              ].filter((block): block is { k: string; v: string } => block != null),
              next: "Open Orders for typical ticket, discounts, and weekend.",
              nextHref: ordersHref,
              nextLabel: "Open Orders",
            });
          const barClass = [
            "mcfly-chart__bar",
            isWeekendDateKey(point.dateKey) ? "mcfly-chart__bar--weekend" : null,
            vs?.kind === "up" ? "mcfly-chart__bar--hot" : null,
            vs?.kind === "down" ? "mcfly-chart__bar--cool" : null,
            active?.dateKey === point.dateKey ? "mcfly-chart__bar--on" : null,
          ]
            .filter(Boolean)
            .join(" ");
          return (
            <rect
              key={point.dateKey}
              className={barClass}
              x={x}
              y={y}
              width={barW}
              height={barH}
              rx="2"
              tabIndex={0}
              role="button"
              aria-label={`${overviewChartDayLabel(point.dateKey)} ${formatCurrency(point.sales, currency)}`}
              onClick={openBar}
              onMouseEnter={() => setHover(point)}
              onMouseLeave={() => setHover(points[points.length - 1] ?? null)}
              onFocus={() => setHover(point)}
              onBlur={() => setHover(points[points.length - 1] ?? null)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  openBar();
                }
              }}
            />
          );
        })}
        <path className="mcfly-chart__sales-line" d={line} />
      </svg>
    </section>
  );
}
