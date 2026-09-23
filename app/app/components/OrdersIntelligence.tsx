import { useMemo, useState } from "react";
import { DeskIcon } from "./DeskIcon";
import { useDeskDrill } from "./DeskDrill";
import { useDeskCurrency } from "../lib/desk-currency";
import { formatCurrency } from "../lib/mer-format";
import { chartSeriesId, chartTipClassName } from "../lib/chart-smooth";
import {
  chartBarLayout,
  chartBarPlotClassName,
  chartXAxisMaxLabels,
} from "../lib/chart-bar";
import { useChartHover } from "../lib/use-chart-hover";
import {
  overviewChartAxis,
  overviewChartLabelIndices,
} from "../lib/overview-sales-chart";
import {
  buildOrdersIntelKpis,
  ordersCodeTookLabel,
  ordersIntelDayLabel,
  ordersMonthBoardSentence,
  ordersPaintDollars,
  type OrdersAovTier,
  type OrdersIntelData,
  type OrdersIntelDay,
  type OrdersWeekRow,
} from "../lib/orders-intelligence";

export type OrdersIntel = OrdersIntelData;

type IntelGrain = "day" | "week";

function deltaCopy(dir: "up" | "down" | "flat", pct: number): string {
  if (dir === "flat") return "Even vs prior";
  const sign = dir === "up" ? "+" : "−";
  return `${sign}${Math.abs(Math.round(pct * 10) / 10)}% vs prior`;
}

/**
 * Order intelligence for the period the merchant picked — vs-prior KPI strip,
 * which codes took the money, and whether returns are climbing.
 * Order data only; zero spend / ROAS.
 */
export function OrdersIntelligence({ intel }: { intel: OrdersIntel }) {
  const currency = useDeskCurrency();
  const kpis = buildOrdersIntelKpis(intel.current, intel.prior, currency);
  const sentence = ordersMonthBoardSentence({
    periodLabel: intel.periodLabel,
    codes: intel.codes,
    returnsDrag: intel.returnsDrag,
    priorReturnsDrag: intel.priorReturnsDrag,
    currency,
  });
  return (
    <section
      className="mcfly-orders-intel mcfly-orders-intel--soft mcfly-desk-anchor"
      aria-label="Order intelligence"
    >
      <div className="mcfly-orders-intel__head">
        <p className="mcfly-orders-intel__title">
          <DeskIcon name="orders" />
          Order intelligence
          <span className="mcfly-orders-intel__badge">{intel.badge}</span>
        </p>
        <p className="mcfly-orders-intel__window">{intel.windowLabel}</p>
        <p className="mcfly-orders-intel__window">{sentence}</p>
      </div>
      <div className="mcfly-orders-intel__kpis">
        {kpis.map((kpi) => (
          <div className="mcfly-orders-intel__kpi mcfly-orders-intel__kpi--soft" key={kpi.key}>
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
      <OrdersPeriodMix intel={intel} currency={currency} />
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

function paintPct(share: number | null | undefined): string {
  if (share == null || !Number.isFinite(share)) return "—";
  return `${Math.round(share * 100)}%`;
}

function paintMoney(amount: number | null | undefined, currency: string): string {
  if (amount == null || !Number.isFinite(amount)) return "—";
  return formatCurrency(amount, currency);
}

function OrdersPeriodMix({
  intel,
  currency,
}: {
  intel: OrdersIntel;
  currency: string;
}) {
  const drill = useDeskDrill();
  const half =
    intel.concentration.buyersForHalf != null
      ? `${intel.concentration.buyersForHalf.toLocaleString()} identified buyers`
      : "—";
  const top = paintPct(intel.concentration.topDecileShare);
  const codeLine = intel.yearDiscount.codes
    .map((line) => ordersCodeTookLabel(line.code, line.sales, currency))
    .filter((label): label is string => label != null)
    .join(" · ");
  const discountNow = paintMoney(intel.yearDiscount.currentDollars, currency);
  const discountLy = paintMoney(intel.yearDiscount.lastYearDollars, currency);
  const keptNow = paintPct(intel.keptShare.current);
  const keptLy = paintPct(intel.keptShare.lastYear);
  const firstOff = paintPct(intel.checkoutDiscount.firstDepth);
  const returningOff = paintPct(intel.checkoutDiscount.returningDepth);
  const perUnit = paintMoney(intel.dollarsPerUnit.dollarsPerUnit, currency);
  const perUnitSub =
    intel.dollarsPerUnit.dollarsPerUnit != null
      ? intel.dollarsPerUnit.basis === "net"
        ? "Net per unit on file"
        : "Shopify Total Sales per unit on file"
      : "Units not crawled";
  const zeroUnits =
    intel.zeroOrders.units != null
      ? `${intel.zeroOrders.units.toLocaleString()} units`
      : "units not crawled";
  const facts: Array<{ k: string; v: string; s?: string; d: string }> = [
    {
      k: "Buyers for half",
      v: half,
      s: `${intel.concentration.identifiedBuyers.toLocaleString()} identified`,
      d: "Identified buyers who made 50% of this period’s Shopify Total Sales. Guests out. Under 8 identified buyers stays —.",
    },
    {
      k: "Top tenth",
      v: top,
      d: "Share of this period’s identified Shopify Total Sales from the top tenth of identified buyers. Guests out.",
    },
    {
      k: "Discount vs last year",
      v: `${discountNow} · last year ${discountLy}`,
      s: `${paintPct(intel.yearDiscount.currentDepth)} now · ${paintPct(intel.yearDiscount.lastYearDepth)} last year${codeLine ? ` · ${codeLine}` : ""}`,
      d: "Discount dollars and depth versus the same window last year. Codes are names. Missing last year is —.",
    },
    {
      k: "Placed-day kept",
      v: `${keptNow} · last year ${keptLy}`,
      d: "Net versus gross on the placed day, this period vs last year. Any missing gross stays —. Not a refund processing date.",
    },
    {
      k: "First vs returning off",
      v: `${firstOff} first · ${returningOff} returning`,
      d: "Share of gross taken off at first checkouts versus returning checkouts this period. Missing discount field stays —.",
    },
    {
      k: "Dollars per unit",
      v: perUnit,
      s: perUnitSub,
      d: "Period sales divided by units on file. Dash when unitCount is not crawled.",
    },
    {
      k: "$0 orders",
      v: `${intel.zeroOrders.count.toLocaleString()}`,
      s: zeroUnits,
      d: "Orders with a $0 amount and the units on those rows. This desk does not know they are internal. Order tags stay off.",
    },
  ];
  return (
    <div className="mcfly-orders-mix" aria-label="Period mix">
      {facts.map((fact) => (
        <button
          type="button"
          className="mcfly-orders-mix__fact"
          key={fact.k}
          onClick={() =>
            drill?.openDrill({
              title: fact.k,
              value: fact.v,
              kicker: intel.periodLabel,
              blocks: [
                { k: "What this is", v: fact.d },
                fact.s ? { k: "Also", v: fact.s } : null,
              ].filter((block): block is { k: string; v: string } => block != null),
              next: "Order history only — guests out of identified mixes.",
            })
          }
        >
          <span className="mcfly-orders-mix__k">{fact.k}</span>
          <span className="mcfly-orders-mix__v">{fact.v}</span>
          {fact.s ? <span className="mcfly-orders-mix__s">{fact.s}</span> : null}
        </button>
      ))}
    </div>
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
    <div className="mcfly-orders-tiers mcfly-orders-tiers--soft">
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
              className="mcfly-orders-tiers__row mcfly-orders-tiers__row--soft"
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
  const {
    hoverIndex,
    setHoverIndex,
    moveFromEvent,
    onPlotPointerLeave,
  } = useChartHover(
    points.length,
    chartSeriesId([grain, ...points.map((point) => point.dateKey)]),
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
  const leftAxis = overviewChartAxis(Math.max(...days2.map((d) => d.orders), 1), 4);
  const rightAxis = overviewChartAxis(Math.max(...days2.map((d) => d.aov), 1), 4);
  const { band, barW, rx, barX, centerX } = chartBarLayout({
    plotLeft: padL,
    plotWidth: plotW,
    count: days2.length,
  });
  const baseY = padT + plotH;
  const yForOrders = (value: number) =>
    padT + plotH - Math.min(1, Math.max(0, value / leftAxis.max)) * plotH;
  const yForAov = (value: number) =>
    padT + plotH - Math.min(1, Math.max(0, value / rightAxis.max)) * plotH;
  const activeIndex = hoverIndex != null ? hoverIndex : days2.length - 1;
  const active = days2[activeIndex] ?? days2[days2.length - 1]!;
  const tipLeftPct = (centerX(activeIndex) / width) * 100;
  const labelIndices = new Set(
    overviewChartLabelIndices(days2.length, chartXAxisMaxLabels(days2.length)),
  );

  const linePoints = days2.map((day, index) => ({
    x: centerX(index),
    y: yForAov(day.aov),
  }));
  const line = linePoints
    .map((pt, index) => `${index === 0 ? "M" : "L"}${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`)
    .join(" ");
  const aovFill =
    linePoints.length >= 2
      ? `M${linePoints[0]!.x.toFixed(1)} ${baseY} ${linePoints
          .map((pt) => `L${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`)
          .join(" ")} L${linePoints[linePoints.length - 1]!.x.toFixed(1)} ${baseY} Z`
      : "";

  return (
    <div className="mcfly-orders-intel__chart mcfly-chart mcfly-chart--dual mcfly-chart--soft">
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
              }}
            >
              {value === "day" ? "Day" : "Week"}
            </button>
          ))}
        </div>
      </div>
      <div
        className={chartBarPlotClassName(hoverIndex != null)}
        onPointerMove={(event) =>
          moveFromEvent(event, {
            viewWidth: width,
            plotLeft: padL,
            plotWidth: plotW,
          })
        }
        onPointerLeave={onPlotPointerLeave}
      >
        <div
          className={chartTipClassName({ open: true })}
          role="status"
          style={{ left: `${Math.min(88, Math.max(12, tipLeftPct))}%` }}
        >
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
        >
          {leftAxis.ticks.map((tick) => {
            const y = yForOrders(tick);
            return (
              <line
                key={`gl-${tick}`}
                className="mcfly-chart__grid"
                x1={padL}
                y1={y}
                x2={padL + plotW}
                y2={y}
              />
            );
          })}
          {leftAxis.ticks.map((tick) => (
            <text
              key={`yl-${tick}`}
              className="mcfly-chart__axis mcfly-chart__axis--l"
              x={padL - 6}
              y={yForOrders(tick) + 3}
              textAnchor="end"
            >
              {tick.toLocaleString()}
            </text>
          ))}
          {rightAxis.ticks.map((tick) => (
            <text
              key={`yr-${tick}`}
              className="mcfly-chart__axis mcfly-chart__axis--r"
              x={padL + plotW + 6}
              y={yForAov(tick) + 3}
              textAnchor="start"
            >
              {formatCurrency(tick, currency)}
            </text>
          ))}
          {days2.map((day, index) => {
            const barH = Math.max(1, baseY - yForOrders(day.orders));
            return (
              <rect
                key={day.dateKey}
                className={`mcfly-chart__obar${active.dateKey === day.dateKey ? " mcfly-chart__obar--on" : ""}`}
                x={barX(index)}
                y={baseY - barH}
                width={barW}
                height={barH}
                rx={rx}
              />
            );
          })}
          {aovFill ? <path className="mcfly-chart__aovfill" d={aovFill} /> : null}
          <path className="mcfly-chart__aovline" d={line} />
          {days2.map((day, index) => {
            if (!labelIndices.has(index)) return null;
            return (
              <text
                key={`xl-${day.dateKey}`}
                className="mcfly-chart__axis mcfly-chart__axis--x"
                x={centerX(index)}
                y={height - 8}
                textAnchor="middle"
              >
                {ordersIntelDayLabel(day.dateKey)}
              </text>
            );
          })}
          {days2.map((day, index) => (
            <rect
              key={`hit-${day.dateKey}`}
              className="mcfly-chart__hit"
              x={padL + index * band}
              y={padT}
              width={band}
              height={plotH}
              fill="transparent"
              onFocus={() => setHoverIndex(index)}
              onBlur={onPlotPointerLeave}
              tabIndex={0}
              role="button"
              aria-label={`${labelOf(day.dateKey)} ${day.orders} orders, AOV ${formatCurrency(day.aov, currency)}`}
            />
          ))}
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

function codeCell(week: OrdersWeekRow, currency: string): string {
  const labels = week.codeLines
    .map((line) => ordersCodeTookLabel(line.code, line.sales, currency))
    .filter((label): label is string => label != null);
  return labels.length > 0 ? labels.join(" · ") : "—";
}

function returnsCell(week: OrdersWeekRow, currency: string): string {
  const money = ordersPaintDollars(week.returnsDrag, currency);
  if (week.returnsClimbing === "climbing") {
    return money ? `${money} · climbing` : "climbing";
  }
  return money ?? "—";
}

/** Audit-grade weekly ledger — orders, sales, code dollars, returns. */
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
      <p className="mcfly-orders-ledger__cap">Weekly ledger · Monday-start · this period</p>
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
              <th scope="col">Codes</th>
              <th scope="col">Returns</th>
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
                    codeCell(week, currency) !== "—"
                      ? { k: "Codes", v: codeCell(week, currency) }
                      : null,
                    returnsCell(week, currency) !== "—"
                      ? { k: "Returns", v: returnsCell(week, currency) }
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
                  <td>{codeCell(week, currency)}</td>
                  <td>{returnsCell(week, currency)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
