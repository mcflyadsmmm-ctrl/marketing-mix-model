import type { ReactNode } from "react";
import { DeskIcon, type DeskIconName } from "./DeskIcon";
import { useDeskDrill } from "./DeskDrill";
import { formatCurrency } from "../lib/mer-format";
import { PRODUCT_NOUN } from "../lib/product-labels";
import {
  OVERVIEW_COVERAGE_LINE,
  OVERVIEW_PENDING_LINE,
  overviewDecisionTakeaway,
  overviewReturningCompactDollars,
  overviewWeekendWeekday,
} from "../lib/overview-first-viewport";
import { SAMPLE_OVERVIEW_DOOR } from "../lib/sample-live-handoff";
import { useDeskCurrency } from "../lib/desk-currency";

function KpiCard({
  to,
  nextLabel,
  next,
  formulaBlock,
  label,
  value,
  formula,
  sub,
  foot,
  icon,
}: {
  to: string;
  nextLabel: string;
  next: string;
  formulaBlock: string;
  label: string;
  value: string;
  formula?: string;
  sub?: string;
  foot?: string;
  icon: DeskIconName;
}) {
  const drill = useDeskDrill();
  return (
    <button
      type="button"
      className="mcfly-kpi mcfly-kpi--drill"
      onClick={() =>
        drill?.openDrill({
          title: label,
          value,
          kicker: formula,
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
      {formula ? <span className="mcfly-kpi__formula">{formula}</span> : null}
      {sub ? <span className="mcfly-kpi__sub">{sub}</span> : null}
      <span className="mcfly-kpi__hint">Click for detail</span>
    </button>
  );
}

/**
 * Shopify-depth KPI board under the YoY glance.
 * Order facts only — typical ticket, returning dollars, weekend vs weekday,
 * order count. Pending paints dashes, never a sealed $0.
 */
export function OverviewFirstViewport({
  "aria-label": ariaLabel = "Shopify sales this period",
  orderCount,
  typicalOrder,
  meanAov,
  returningSalesShare,
  returningSales,
  weekendSalesShare,
  salesPending,
  ordersHref,
  useSampleDesk = false,
  share,
}: {
  "aria-label"?: string;
  orderCount: number;
  typicalOrder: number | null;
  meanAov: number | null;
  returningSalesShare: number | null;
  returningSales?: number | null;
  medianDaysToSecond?: number | null;
  weekendSalesShare?: number | null;
  salesPending: boolean;
  ordersHref: string;
  settingsHref?: string;
  useSampleDesk?: boolean;
  share?: ReactNode;
}) {
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
  const takeaway = overviewDecisionTakeaway({
    typicalOrderLabel: typical,
    returningSalesShare,
    salesPending,
    orderCount,
  });
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
  const ordersValue = salesPending
    ? "—"
    : orderCount > 0
      ? orderCount.toLocaleString()
      : "—";
  const watermark = useSampleDesk ? (
    <p className="mcfly-score__door">{SAMPLE_OVERVIEW_DOOR}</p>
  ) : null;

  return (
    <section className="mcfly-score mcfly-book" aria-label={ariaLabel}>
      <p className="mcfly-decision__takeaway" id="mcfly-decision-takeaway">
        {takeaway}
      </p>
      {!salesPending && orderCount > 0 ? (
        <p className="mcfly-score__pipe">{OVERVIEW_COVERAGE_LINE}</p>
      ) : null}

      <div className="mcfly-kpi-grid mcfly-kpi-grid--peeks mcfly-kpi-grid--peeks-4">
        <KpiCard
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
              ? OVERVIEW_PENDING_LINE
              : typicalIsMedian
                ? "Median. Shopify Analytics uses the average."
                : undefined
          }
        />
        <KpiCard
          to="/app/customers"
          nextLabel={`Open ${PRODUCT_NOUN.buyersTitle}`}
          next="Open Customers for returning dollars and guest checkouts."
          formulaBlock="Sales from returning customers in this window. Shopify Analytics Overview is a returning-customer rate."
          icon="customers"
          label="Returning"
          value={returningValue}
          sub={returningShare}
          foot="Dollars, not headcount."
        />
        <KpiCard
          to={ordersHref}
          nextLabel={`Open ${PRODUCT_NOUN.ordersTitle}`}
          next="Open Orders for the weekday breakdown."
          formulaBlock="Saturday + Sunday sales share vs weekday, shop-local. Shopify Analytics Overview does not put this next to typical order."
          icon="weekend"
          label="Weekend vs weekday"
          value={weekend ? `${weekend.weekendPct}%` : "—"}
          sub={
            weekend
              ? `Weekday ${weekend.weekdayPct}%`
              : salesPending
                ? OVERVIEW_PENDING_LINE
                : undefined
          }
        />
        <KpiCard
          to={ordersHref}
          nextLabel={`Open ${PRODUCT_NOUN.ordersTitle}`}
          next="Open Orders for discounts, items, and Online vs POS."
          formulaBlock="Shopify orders in this window, after returns. Click through for the typical ticket and mix."
          icon="sales"
          label="Orders"
          value={ordersValue}
        />
      </div>

      {share ? <p className="mcfly-book__cta">{share}</p> : null}
      {watermark}
    </section>
  );
}
