import type { ReactNode } from "react";
import { DeskIcon, type DeskIconName } from "./DeskIcon";
import { useDeskDrill } from "./DeskDrill";
import { formatCurrency } from "../lib/mer-format";
import { PRODUCT_NOUN } from "../lib/product-labels";
import {
  OVERVIEW_COVERAGE_LINE,
  OVERVIEW_PENDING_LINE,
  overviewBusiestWeekday,
  overviewReturningCompactDollars,
  overviewWeekendWeekday,
} from "../lib/overview-first-viewport";
import { SAMPLE_OVERVIEW_DOOR } from "../lib/sample-live-handoff";
import { useDeskCurrency } from "../lib/desk-currency";

export type OverviewPeekProps = {
  "aria-label"?: string;
  orderCount: number;
  typicalOrder: number | null;
  meanAov: number | null;
  typicalDay?: number | null;
  returningSalesShare: number | null;
  returningSales?: number | null;
  medianDaysToSecond?: number | null;
  weekendSalesShare?: number | null;
  peakWeekday?: number | null;
  weekdaySalesShare?: number[] | null;
  windowSales?: number | null;
  salesPending: boolean;
  ordersHref: string;
  settingsHref?: string;
  useSampleDesk?: boolean;
};

function PeekCard({
  to,
  nextLabel,
  next,
  formulaBlock,
  label,
  value,
  sub,
  foot,
  icon,
  extra,
}: {
  to: string;
  nextLabel: string;
  next: string;
  formulaBlock: string;
  label: string;
  value: string;
  sub?: string;
  foot?: string;
  icon: DeskIconName;
  extra?: ReactNode;
}) {
  const drill = useDeskDrill();
  return (
    <button
      type="button"
      className="mcfly-kpi mcfly-kpi--drill mcfly-kpi--peek mcfly-kpi--soft"
      onClick={() =>
        drill?.openDrill({
          title: label,
          value,
          blocks: [
            { k: "What this is", v: formulaBlock },
            sub ? { k: "Also", v: sub } : null,
          ].filter((block): block is { k: string; v: string } => block != null),
          next,
          nextHref: to,
          nextLabel,
          foot,
        })
      }
    >
      <span className="mcfly-kpi__top">
        <DeskIcon name={icon} />
        <span className="mcfly-kpi__label">{label}</span>
      </span>
      <span className="mcfly-kpi__value">{value}</span>
      {sub ? <span className="mcfly-kpi__sub">{sub}</span> : null}
      {extra}
    </button>
  );
}

function useOverviewPeekValues({
  orderCount,
  typicalOrder,
  meanAov,
  typicalDay,
  returningSalesShare,
  returningSales,
  weekendSalesShare,
  peakWeekday,
  weekdaySalesShare,
  windowSales,
  salesPending,
}: OverviewPeekProps) {
  const currency = useDeskCurrency();
  const typicalIsMedian =
    typicalOrder != null && Number.isFinite(typicalOrder);
  const typicalValue = typicalIsMedian
    ? typicalOrder
    : meanAov != null && Number.isFinite(meanAov)
      ? meanAov
      : null;
  const typical =
    typicalValue != null ? formatCurrency(typicalValue, currency) : null;
  const returningDollars = overviewReturningCompactDollars(returningSales);
  const returningValue =
    salesPending || returningDollars == null
      ? "—"
      : formatCurrency(returningDollars, currency);
  const returningShare =
    !salesPending &&
    returningSalesShare != null &&
    Number.isFinite(returningSalesShare)
      ? `${Math.round(returningSalesShare * 100)}% of sales`
      : undefined;
  const weekend = salesPending
    ? null
    : overviewWeekendWeekday(weekendSalesShare);
  const typicalCardValue = salesPending ? "—" : (typical ?? "—");
  const typicalDayValue =
    salesPending || typicalDay == null || !Number.isFinite(typicalDay)
      ? "—"
      : formatCurrency(typicalDay, currency);
  const ordersValue = salesPending ? "—" : orderCount.toLocaleString();
  const busiest = salesPending
    ? null
    : overviewBusiestWeekday({
        peakWeekday,
        weekdaySalesShare,
        windowSales,
      });
  const busiestValue = busiest
    ? busiest.dollars != null
      ? formatCurrency(busiest.dollars, currency)
      : `${busiest.pct}%`
    : "—";
  return {
    currency,
    typicalIsMedian,
    returningValue,
    returningShare,
    weekend,
    typicalCardValue,
    typicalDayValue,
    ordersValue,
    busiest,
    busiestValue,
  };
}

/**
 * Founder glance peeks under YoY — typical order, returning $, weekend.
 * SAMPLE Snowdevil is the craft canvas: paint the dense board (AOV ~$631,
 * YoY, returning $, weekend) and never thin this strip to match a live
 * store with fewer facts. Spend stays off Overview.
 * Depth peeks sit after the open sales chart so the first screen stays a
 * scoreboard, not a pamphlet.
 */
export function OverviewFirstViewport({
  "aria-label": ariaLabel = "Shopify sales this period",
  ordersHref,
  useSampleDesk = false,
  salesPending,
  orderCount,
  ...rest
}: OverviewPeekProps) {
  const {
    typicalIsMedian,
    returningValue,
    returningShare,
    weekend,
    typicalCardValue,
  } = useOverviewPeekValues({
    ...rest,
    orderCount,
    ordersHref,
    useSampleDesk,
    salesPending,
  });
  const kicker = salesPending
    ? OVERVIEW_PENDING_LINE
    : useSampleDesk
      ? SAMPLE_OVERVIEW_DOOR
      : orderCount > 0
        ? OVERVIEW_COVERAGE_LINE
        : "No orders in this window yet.";

  return (
    <section className="mcfly-score mcfly-book mcfly-score--soft" aria-label={ariaLabel}>
      <p
        className={
          useSampleDesk && !salesPending
            ? "mcfly-scoreboard__kicker mcfly-scoreboard__kicker--sr"
            : "mcfly-scoreboard__kicker"
        }
      >
        {kicker}
      </p>

      <div className="mcfly-kpi-grid mcfly-kpi-grid--peeks mcfly-kpi-grid--peeks-lead mcfly-kpi-grid--soft">
        <PeekCard
          to={ordersHref}
          nextLabel={`Open ${PRODUCT_NOUN.ordersTitle}`}
          next="Typical order, discounts, and weekend sit on Orders — Shopify Analytics only shows the average."
          formulaBlock={
            typicalIsMedian
              ? PRODUCT_NOUN.bookTypicalOrderDef
              : "Average order value when median is not available yet."
          }
          icon="orders"
          label={typicalIsMedian ? PRODUCT_NOUN.bookTypicalOrder : "AOV"}
          value={typicalCardValue}
          sub={
            salesPending
              ? undefined
              : typicalIsMedian
                ? "Median"
                : undefined
          }
        />
        <PeekCard
          to="/app/customers"
          nextLabel={`Open ${PRODUCT_NOUN.buyersTitle}`}
          next="Open Customers for returning dollars and guest checkouts."
          formulaBlock="Sales from returning customers in this window. Shopify Analytics Overview is a returning-customer rate."
          icon="customers"
          label="Returning"
          value={returningValue}
          sub={returningShare}
          foot="Dollars, not headcount."
          extra={
            !salesPending &&
            rest.returningSalesShare != null &&
            Number.isFinite(rest.returningSalesShare) ? (
              <span
                className="mcfly-split"
                aria-hidden="true"
                title={returningShare}
              >
                <span
                  className="mcfly-split__return"
                  style={{
                    width: `${Math.round(rest.returningSalesShare * 100)}%`,
                  }}
                />
              </span>
            ) : null
          }
        />
        <PeekCard
          to={ordersHref}
          nextLabel={`Open ${PRODUCT_NOUN.ordersTitle}`}
          next="Open Orders for the weekday breakdown."
          formulaBlock="Weekend vs weekday sales share, shop-local. Shopify Analytics Overview does not put this next to typical order."
          icon="weekend"
          label="Weekend"
          value={weekend ? `${weekend.weekendPct}%` : "—"}
          sub={weekend ? `vs weekday ${weekend.weekdayPct}%` : undefined}
          extra={
            weekend ? (
              <span
                className="mcfly-split"
                aria-hidden="true"
                title={`Weekend ${weekend.weekendPct}%`}
              >
                <span
                  className="mcfly-split__weekend"
                  style={{ width: `${weekend.weekendPct}%` }}
                />
              </span>
            ) : null
          }
        />
      </div>
    </section>
  );
}

/** Typical day, orders, busiest weekday — after the open sales chart. */
export function OverviewDepthPeeks({
  ordersHref,
  salesPending,
  orderCount,
  ...rest
}: OverviewPeekProps) {
  const { typicalDayValue, ordersValue, busiest, busiestValue } =
    useOverviewPeekValues({
      ...rest,
      orderCount,
      ordersHref,
      salesPending,
    });

  return (
    <section
      className="mcfly-score mcfly-book mcfly-score--depth mcfly-score--soft"
      aria-label="More Shopify order depth"
    >
      <div className="mcfly-kpi-grid mcfly-kpi-grid--peeks mcfly-kpi-grid--peeks-depth mcfly-kpi-grid--soft">
        <PeekCard
          to={ordersHref}
          nextLabel={`Open ${PRODUCT_NOUN.ordersTitle}`}
          next="Open Orders for typical day, discounts, and the sales clock."
          formulaBlock={PRODUCT_NOUN.bookTypicalDayDef}
          icon="clock"
          label={PRODUCT_NOUN.bookTypicalDay}
          value={typicalDayValue}
          sub={
            salesPending || typicalDayValue === "—"
              ? undefined
              : "Median daily sales"
          }
        />
        <PeekCard
          to={ordersHref}
          nextLabel={`Open ${PRODUCT_NOUN.ordersTitle}`}
          next="Open Orders for ticket, discounts, and items."
          formulaBlock="Paid orders in this window after returns. Typical order is the middle ticket, not this count."
          icon="orders"
          label="Orders"
          value={ordersValue}
          sub={
            salesPending || !(orderCount > 0) ? undefined : "This window"
          }
        />
        <PeekCard
          to={ordersHref}
          nextLabel={`Open ${PRODUCT_NOUN.ordersTitle}`}
          next="Open Orders for the weekday breakdown and busiest hour."
          formulaBlock={PRODUCT_NOUN.bookBusiestWeekday}
          icon="weekend"
          label={PRODUCT_NOUN.bookBusiestWeekday}
          value={busiestValue}
          sub={
            busiest ? `${busiest.label} · ${busiest.pct}% of sales` : undefined
          }
        />
      </div>
    </section>
  );
}
