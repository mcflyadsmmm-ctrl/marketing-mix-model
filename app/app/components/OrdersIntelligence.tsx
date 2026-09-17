import { useMemo, useState } from "react";
import { DeskIcon } from "./DeskIcon";
import { useDeskDrill } from "./DeskDrill";
import { useDeskCurrency } from "../lib/desk-currency";
import { formatCurrency } from "../lib/mer-format";
import {
  buildOrdersIntelKpis,
  ordersIntelDayLabel,
  type OrdersAovTier,
  type OrdersIntelAgg,
  type OrdersIntelDay,
  type OrdersWeekRow,
} from "../lib/orders-intelligence";

export type OrdersIntel = {
  windowLabel: string;
  days: OrdersIntelDay[];
  weeks: OrdersWeekRow[];
  tiers: OrdersAovTier[];
  current: OrdersIntelAgg;
  prior: OrdersIntelAgg | null;
};

type IntelGrain = "day" | "week";

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
      <OrdersDualAxisChart
        days={intel.days}
        weeks={intel.weeks}
        currency={currency}
      />
      <OrdersAovTiers tiers={intel.tiers} currency={currency} />
      <OrdersLedgerTable weeks={intel.weeks} currency={currency} />
    </section>
  );
}

function tierLabel(
  tier: OrdersAovTier,
  currency: string,
): string {
  const money = (n: number) => formatCurrency(n, currency);
  if (tier.lo == null) return `< ${money(tier.hi ?? 0)}`;
  if (tier.hi == null) return `${money(tier.lo)}+`;
  return `${money(tier.lo)}–${money(tier.hi)}`;
}

/** AOV tiers — where order value lands. One average hides this. */
function OrdersAovTiers({
  tiers,
  currency,
}: {
  tiers: OrdersAovTier[];
  currency: string;
}) {
  const drill = useDeskDrill();
  if (tiers.length < 2) return null;
  const maxShare = Math.max(...tiers.map((t) => t.orderShare), 0.01);
  return (
    <div className="mcfly-orders-tiers">
      <p className="mcfly-orders-tiers__cap">AOV tiers · where order value lands</p>
      <div className="mcfly-orders-tiers__rows">
        {tiers.map((tier) => {
          const label = tierLabel(tier, currency);
          const orderPct = Math.round(tier.orderShare * 100);
          const open = () =>
            drill?.openDrill({
              title: `Orders ${label}`,
              value: `${orderPct}% of orders`,
              kicker: "AOV tier",
              blocks: [
                { k: "Orders", v: tier.orders.toLocaleString() },
                { k: "Sales", v: formatCurrency(tier.sales, currency) },
                { k: "Sales share", v: `${Math.round(tier.salesShare * 100)}% of sales` },
              ],
              next: "How order value spreads — Shopify Analytics shows one average.",
            });
          return (
            <button
              type="button"
              className="mcfly-orders-tiers__row"
              key={tier.key}
              onClick={open}
            >
              <span className="mcfly-orders-tiers__k">{label}</span>
              <span className="mcfly-orders-tiers__track" aria-hidden="true">
                <span
                  className="mcfly-orders-tiers__fill"
                  style={{ width: `${(tier.orderShare / maxShare) * 100}%` }}
                />
              </span>
              <span className="mcfly-orders-tiers__v">{orderPct}%</span>
              <span className="mcfly-orders-tiers__sub">
                {tier.orders.toLocaleString()} orders · {Math.round(tier.salesShare * 100)}% of sales
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function niceMax(value: number): number {
  if (value <= 0) return 1;
  const pow = 10 ** Math.floor(Math.log10(value));
  const norm = value / pow;
  const step = norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 5 ? 5 : 10;
  return step * pow;
}

/** Orders bars (left axis) + AOV line (right axis). Day / Week grain on chart. */
function OrdersDualAxisChart({
  days,
  weeks,
  currency,
}: {
  days: OrdersIntelDay[];
  weeks: OrdersWeekRow[];
  currency: string;
}) {
  const [grain, setGrain] = useState<IntelGrain>("day");
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const points = useMemo<OrdersIntelDay[]>(
    () =>
      grain === "week"
        ? weeks.map((week) => ({
            dateKey: week.weekKey,
            orders: week.orders,
            sales: week.sales,
            aov: week.aov,
          }))
        : days,
    [grain, days, weeks],
  );
  const labelOf = (key: string) =>
    grain === "week" ? `Wk of ${ordersIntelDayLabel(key)}` : ordersIntelDayLabel(key);
  if (points.length < 2) return null;

  const days2 = points;
  const width = 720;
  const height = 260;
  const padL = 42;
  const padR = 52;
  const padT = 14;
  const padB = 34;
  const plotW = width - padL - padR;
  const plotH = height - padT - padB;
  const ordersMax = niceMax(Math.max(...days2.map((d) => d.orders), 1));
  const aovMax = niceMax(Math.max(...days2.map((d) => d.aov), 1));
  const stepX = plotW / days2.length;
  const barW = Math.max(2, stepX * (grain === "week" ? 0.7 : 0.66));
  const baseY = padT + plotH;
  const active =
    days2.find((d) => d.dateKey === activeKey) ?? days2[days2.length - 1]!;
  const activeIndex = days2.findIndex((d) => d.dateKey === active.dateKey);
  const tipLeftPct = ((padL + (activeIndex + 0.5) * stepX) / width) * 100;

  const linePoints = days2.map((day, index) => {
    const x = padL + (index + 0.5) * stepX;
    const y = padT + plotH - (day.aov / aovMax) * plotH;
    return { x, y };
  });
  const line = linePoints
    .map((pt, index) => `${index === 0 ? "M" : "L"}${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`)
    .join(" ");
  const aovFill =
    linePoints.length >= 2
      ? `M${linePoints[0]!.x.toFixed(1)} ${baseY} ${linePoints
          .map((pt) => `L${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`)
          .join(" ")} L${linePoints[linePoints.length - 1]!.x.toFixed(1)} ${baseY} Z`
      : "";

  const ordersTicks = [0, 0.25, 0.5, 0.75, 1].map((t) => Math.round(ordersMax * t));
  const aovTicks = [0, 0.25, 0.5, 0.75, 1].map((t) => Math.round(aovMax * t));
  const labelEvery = Math.max(1, Math.ceil(days2.length / 8));

  return (
    <div className="mcfly-orders-intel__chart mcfly-chart mcfly-chart--dual">
      <div className="mcfly-chart__head mcfly-chart__board">
        <p className="mcfly-chart__title">
          <DeskIcon name="chart" />
          Orders × AOV explorer
        </p>
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
        <div className="mcfly-period__group" role="group" aria-label="Chart grain">
          {(["day", "week"] as const).map((value) => (
            <button
              key={value}
              type="button"
              className={`mcfly-period__btn${grain === value ? " mcfly-period__btn--on" : ""}`}
              aria-pressed={grain === value}
              onClick={() => {
                setGrain(value);
                setActiveKey(null);
              }}
            >
              {value === "day" ? "Day" : "Week"}
            </button>
          ))}
        </div>
      </div>
      <div className="mcfly-chart__plot">
        <div className="mcfly-chart__tip" role="status" style={{ left: `${Math.min(88, Math.max(12, tipLeftPct))}%` }}>
          <p className="mcfly-chart__tip-h">{labelOf(active.dateKey)}</p>
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
          aria-label={`${days2.length} ${grain === "week" ? "weeks" : "days"} of orders and average order value`}
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
          {days2.map((day, index) => {
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
          {aovFill ? <path className="mcfly-chart__aovfill" d={aovFill} /> : null}
          <path className="mcfly-chart__aovline" d={line} />
          {days2.map((day, index) => {
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
          {days2.map((day, index) => {
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
                aria-label={`${labelOf(day.dateKey)} ${day.orders} orders, AOV ${formatCurrency(day.aov, currency)}`}
              />
            );
          })}
        </svg>
      </div>
    </div>
  );
}

function deltaChipCopy(dir: "up" | "down" | "flat", pct: number): string {
  if (dir === "flat") return "even";
  const sign = dir === "up" ? "+" : "−";
  return `${sign}${Math.abs(Math.round(pct))}%`;
}

/** Audit-grade weekly ledger — Week · Orders (Δ) · Sales · AOV · Discount. */
function OrdersLedgerTable({
  weeks,
  currency,
}: {
  weeks: OrdersWeekRow[];
  currency: string;
}) {
  const drill = useDeskDrill();
  if (weeks.length < 2) return null;
  const rows = [...weeks].reverse();
  return (
    <div className="mcfly-orders-ledger">
      <p className="mcfly-orders-ledger__cap">Weekly ledger · Monday-start · this window</p>
      <div className="mcfly-orders-ledger__wrap">
        <table className="mcfly-orders-ledger__table">
          <thead>
            <tr>
              <th scope="col" className="mcfly-orders-ledger__lh">Week</th>
              <th scope="col">Orders</th>
              <th scope="col">vs prior</th>
              <th scope="col">Sales</th>
              <th scope="col">AOV</th>
              <th scope="col">Discount</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((week) => {
              const open = () =>
                drill?.openDrill({
                  title: week.label,
                  value: `${week.orders.toLocaleString()} orders`,
                  kicker: "Weekly ledger",
                  blocks: [
                    { k: "Sales", v: formatCurrency(week.sales, currency) },
                    { k: "AOV", v: formatCurrency(week.aov, currency) },
                    week.discountDepth != null
                      ? { k: "Discount depth", v: `${Math.round(week.discountDepth * 100)}%` }
                      : null,
                  ].filter((b): b is { k: string; v: string } => b != null),
                  next: "Monday-start week from this shop's orders — not a platform pixel.",
                });
              return (
                <tr
                  key={week.weekKey}
                  className="mcfly-orders-ledger__row"
                  onClick={open}
                >
                  <td className="mcfly-orders-ledger__lh">{week.label}</td>
                  <td>{week.orders.toLocaleString()}</td>
                  <td>
                    {week.ordersDelta ? (
                      <span
                        className={`mcfly-orders-ledger__delta mcfly-orders-ledger__delta--${week.ordersDelta.dir}`}
                      >
                        {deltaChipCopy(week.ordersDelta.dir, week.ordersDelta.pct)}
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td>{formatCurrency(week.sales, currency)}</td>
                  <td>{formatCurrency(week.aov, currency)}</td>
                  <td>
                    {week.discountDepth != null
                      ? `${Math.round(week.discountDepth * 100)}%`
                      : "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
