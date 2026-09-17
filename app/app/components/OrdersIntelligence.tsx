import { useState } from "react";
import { DeskIcon } from "./DeskIcon";
import { useDeskCurrency } from "../lib/desk-currency";
import { formatCurrency } from "../lib/mer-format";
import {
  buildOrdersIntelKpis,
  ordersIntelDayLabel,
  type OrdersIntelAgg,
  type OrdersIntelDay,
} from "../lib/orders-intelligence";

export type OrdersIntel = {
  windowLabel: string;
  days: OrdersIntelDay[];
  current: OrdersIntelAgg;
  prior: OrdersIntelAgg | null;
};

function deltaCopy(dir: "up" | "down" | "flat", pct: number): string {
  if (dir === "flat") return "Even vs prior";
  const sign = dir === "up" ? "+" : "−";
  return `${sign}${Math.abs(Math.round(pct * 10) / 10)}% vs prior`;
}

/**
 * Order intelligence (90d) — vs-prior KPI strip + a dual-axis daily chart
 * (Orders bars, AOV line). Order data only; zero spend / ROAS.
 */
export function OrdersIntelligence({ intel }: { intel: OrdersIntel }) {
  const currency = useDeskCurrency();
  const kpis = buildOrdersIntelKpis(intel.current, intel.prior, currency);
  return (
    <section
      className="mcfly-orders-intel mcfly-desk-anchor"
      aria-label="Order intelligence"
    >
      <div className="mcfly-orders-intel__head">
        <p className="mcfly-orders-intel__title">
          <DeskIcon name="orders" />
          Order intelligence
          <span className="mcfly-orders-intel__badge">90d</span>
        </p>
        <p className="mcfly-orders-intel__window">{intel.windowLabel}</p>
      </div>
      <div className="mcfly-orders-intel__kpis">
        {kpis.map((kpi) => (
          <div className="mcfly-orders-intel__kpi" key={kpi.key}>
            <p className="mcfly-orders-intel__k">{kpi.label}</p>
            <p className="mcfly-orders-intel__v">{kpi.value}</p>
            {kpi.delta ? (
              <p
                className={`mcfly-orders-intel__delta mcfly-orders-intel__delta--${kpi.delta.dir}`}
              >
                {deltaCopy(kpi.delta.dir, kpi.delta.pct)}
              </p>
            ) : kpi.sub ? (
              <p className="mcfly-orders-intel__sub">{kpi.sub}</p>
            ) : null}
          </div>
        ))}
      </div>
      <OrdersDualAxisChart days={intel.days} currency={currency} />
    </section>
  );
}

function niceMax(value: number): number {
  if (value <= 0) return 1;
  const pow = 10 ** Math.floor(Math.log10(value));
  const norm = value / pow;
  const step = norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 5 ? 5 : 10;
  return step * pow;
}

/** Orders bars (left axis) + AOV line (right axis). Grain is the day. */
function OrdersDualAxisChart({
  days,
  currency,
}: {
  days: OrdersIntelDay[];
  currency: string;
}) {
  const [activeKey, setActiveKey] = useState<string | null>(null);
  if (days.length < 2) return null;

  const width = 720;
  const height = 260;
  const padL = 42;
  const padR = 52;
  const padT = 14;
  const padB = 34;
  const plotW = width - padL - padR;
  const plotH = height - padT - padB;
  const ordersMax = niceMax(Math.max(...days.map((d) => d.orders), 1));
  const aovMax = niceMax(Math.max(...days.map((d) => d.aov), 1));
  const stepX = plotW / days.length;
  const barW = Math.max(2, stepX * 0.66);
  const baseY = padT + plotH;
  const active =
    days.find((d) => d.dateKey === activeKey) ?? days[days.length - 1]!;
  const activeIndex = days.findIndex((d) => d.dateKey === active.dateKey);
  const tipLeftPct = ((padL + (activeIndex + 0.5) * stepX) / width) * 100;

  const linePoints = days.map((day, index) => {
    const x = padL + (index + 0.5) * stepX;
    const y = padT + plotH - (day.aov / aovMax) * plotH;
    return { x, y };
  });
  const line = linePoints
    .map((pt, index) => `${index === 0 ? "M" : "L"}${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`)
    .join(" ");

  const ordersTicks = [0, 0.25, 0.5, 0.75, 1].map((t) => Math.round(ordersMax * t));
  const aovTicks = [0, 0.25, 0.5, 0.75, 1].map((t) => Math.round(aovMax * t));
  const labelEvery = Math.max(1, Math.ceil(days.length / 8));

  return (
    <div className="mcfly-orders-intel__chart mcfly-chart mcfly-chart--dual">
      <div className="mcfly-chart__plot">
        <div className="mcfly-chart__tip" role="status" style={{ left: `${Math.min(88, Math.max(12, tipLeftPct))}%` }}>
          <p className="mcfly-chart__tip-h">{ordersIntelDayLabel(active.dateKey)}</p>
          <p className="mcfly-chart__tip-row">
            <span className="mcfly-chart__tip-k">Orders</span>
            <span className="mcfly-chart__tip-v">{active.orders.toLocaleString()}</span>
          </p>
          <p className="mcfly-chart__tip-row">
            <span className="mcfly-chart__tip-k">AOV</span>
            <span className="mcfly-chart__tip-v">{formatCurrency(active.aov, currency)}</span>
          </p>
          <p className="mcfly-chart__tip-row">
            <span className="mcfly-chart__tip-k">Sales</span>
            <span className="mcfly-chart__tip-v">{formatCurrency(active.sales, currency)}</span>
          </p>
        </div>
        <svg
          className="mcfly-chart__svg"
          viewBox={`0 0 ${width} ${height}`}
          role="img"
          aria-label={`${days.length} days of orders and average order value`}
          onMouseLeave={() => setActiveKey(null)}
        >
          {ordersTicks.map((tick, index) => {
            const y = padT + plotH - (tick / ordersMax) * plotH;
            return (
              <g key={`gl-${index}`}>
                <line
                  className="mcfly-chart__grid"
                  x1={padL}
                  y1={y}
                  x2={padL + plotW}
                  y2={y}
                />
                <text className="mcfly-chart__axis mcfly-chart__axis--l" x={padL - 6} y={y + 3} textAnchor="end">
                  {tick.toLocaleString()}
                </text>
                <text className="mcfly-chart__axis mcfly-chart__axis--r" x={padL + plotW + 6} y={y + 3} textAnchor="start">
                  {formatCurrency(aovTicks[index]!, currency)}
                </text>
              </g>
            );
          })}
          {days.map((day, index) => {
            const barH = (day.orders / ordersMax) * plotH;
            const x = padL + index * stepX + (stepX - barW) / 2;
            const y = baseY - barH;
            return (
              <rect
                key={day.dateKey}
                className={`mcfly-chart__obar${active.dateKey === day.dateKey ? " mcfly-chart__obar--on" : ""}`}
                x={x}
                y={y}
                width={barW}
                height={Math.max(1, barH)}
                rx="1.5"
              />
            );
          })}
          <path className="mcfly-chart__aovline" d={line} />
          {days.map((day, index) => {
            if (index % labelEvery !== 0) return null;
            const x = padL + (index + 0.5) * stepX;
            return (
              <text
                key={`xl-${day.dateKey}`}
                className="mcfly-chart__axis mcfly-chart__axis--x"
                x={x}
                y={height - 8}
                textAnchor="middle"
              >
                {ordersIntelDayLabel(day.dateKey)}
              </text>
            );
          })}
          {days.map((day, index) => {
            const x = padL + index * stepX;
            return (
              <rect
                key={`hit-${day.dateKey}`}
                className="mcfly-chart__hit"
                x={x}
                y={padT}
                width={stepX}
                height={plotH}
                fill="transparent"
                onMouseEnter={() => setActiveKey(day.dateKey)}
                onFocus={() => setActiveKey(day.dateKey)}
                tabIndex={0}
                role="button"
                aria-label={`${ordersIntelDayLabel(day.dateKey)} ${day.orders} orders, AOV ${formatCurrency(day.aov, currency)}`}
              />
            );
          })}
        </svg>
      </div>
      <div className="mcfly-chart__legend mcfly-chart__legend--dual">
        <span className="mcfly-chart__legend-k mcfly-chart__legend-k--orders">
          <span className="mcfly-chart__legend-dot" aria-hidden="true" />
          Orders
        </span>
        <span className="mcfly-chart__legend-k mcfly-chart__legend-k--aov">
          <span className="mcfly-chart__legend-dot" aria-hidden="true" />
          AOV
        </span>
      </div>
    </div>
  );
}
