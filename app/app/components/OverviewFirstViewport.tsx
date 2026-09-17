import type { ReactNode } from "react";
import { Link } from "react-router";
import { DeskIcon, type DeskIconName } from "./DeskIcon";
import { useDeskDrill } from "./DeskDrill";
import { formatCurrency } from "../lib/mer-format";
import { PRODUCT_NOUN } from "../lib/product-labels";
import {
  OVERVIEW_COVERAGE_LINE,
  OVERVIEW_PENDING_LINE,
  OVERVIEW_SPEND_DOOR_LINE,
  OVERVIEW_SPEND_EMPTY_LINE,
  overviewDecisionTakeaway,
  overviewPeekThird,
  overviewReturningCompactDollars,
} from "../lib/overview-first-viewport";
import { SAMPLE_OVERVIEW_DOOR } from "../lib/sample-live-handoff";
import { useDeskCurrency } from "../lib/desk-currency";

function pct(share: number): string {
  return `${Math.round(share * 100)}%`;
}

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

function QuietSpendDoor({
  spendHref,
  roasHref,
  useSampleDesk,
  hasSpend,
  salesPending,
}: {
  spendHref: string;
  roasHref: string;
  useSampleDesk: boolean;
  hasSpend: boolean;
  salesPending: boolean;
}) {
  if (useSampleDesk) {
    return <p className="mcfly-score__door">{SAMPLE_OVERVIEW_DOOR}</p>;
  }
  return (
    <p className="mcfly-score__door">
      {OVERVIEW_SPEND_DOOR_LINE}{" "}
      <Link to={spendHref}>Spend Upload</Link>
      {hasSpend && !salesPending ? (
        <>
          {" · "}
          <Link to={roasHref}>Open Total ROAS</Link>
        </>
      ) : null}
    </p>
  );
}

/**
 * Shopify-depth peeks under the YoY glance. Total ROAS, ad spend, and EOM
 * projected ROAS are not Overview tiles — even when spend is already typed.
 */
export function OverviewFirstViewport({
  "aria-label": ariaLabel = "Shopify sales this period",
  orderCount,
  typicalOrder,
  meanAov,
  returningSalesShare,
  returningSales,
  medianDaysToSecond,
  weekendSalesShare,
  salesPending,
  spendEmpty,
  totalSpend = 0,
  ordersHref,
  spendHref,
  roasHref,
  settingsHref: _settingsHref = "/app/settings",
  useSampleDesk = false,
  share,
}: {
  "aria-label"?: string;
  orderCount: number;
  typicalOrder: number | null;
  meanAov: number | null;
  returningSalesShare: number | null;
  returningSales?: number | null;
  medianDaysToSecond: number | null;
  weekendSalesShare?: number | null;
  salesPending: boolean;
  spendEmpty: boolean;
  totalSpend?: number;
  ordersHref: string;
  spendHref: string;
  roasHref: string;
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
  const hasSpend = Number.isFinite(totalSpend) && totalSpend > 0;
  const returningDollars = overviewReturningCompactDollars(returningSales);
  const returningValue =
    returningDollars != null ? formatCurrency(returningDollars, currency) : "—";
  const third = overviewPeekThird({
    weekendSalesShare,
    medianDaysToSecond,
  });
  let thirdLabel = "Weekend sales";
  let thirdValue = "—";
  let thirdIcon: DeskIconName = "orders";
  let thirdBlock =
    "Share of sales on Saturday and Sunday, shop-local. Null until enough days are on file.";
  let thirdNext = "Open Orders for weekday mix and typical ticket.";
  switch (third.kind) {
    case "weekend":
      thirdLabel = PRODUCT_NOUN.bookWeekendSales;
      thirdValue = pct(third.share);
      thirdIcon = "weekend";
      thirdBlock =
        "Saturday + Sunday sales share, shop-local. Shopify Analytics Overview does not put this next to typical order.";
      thirdNext = "Open Orders for the weekday breakdown.";
      break;
    case "daysToSecond":
      thirdLabel = "Days to second order";
      thirdValue = `${Math.round(third.days)}`;
      thirdIcon = "customers";
      thirdBlock =
        "Typical wait from a first order to a second, from orders already on file.";
      thirdNext = "Open Growth for who came back.";
      break;
    case "empty":
      break;
    default: {
      const _never: never = third;
      void _never;
      break;
    }
  }

  const door = (
    <QuietSpendDoor
      spendHref={spendHref}
      roasHref={roasHref}
      useSampleDesk={useSampleDesk}
      hasSpend={hasSpend}
      salesPending={salesPending}
    />
  );
  // Loaded empty month still gets the KPI row (honest —). True pending stays above.
  const showPeeks = !salesPending;
  const peekGridClass =
    third.kind === "empty"
      ? "mcfly-kpi-grid mcfly-kpi-grid--peeks mcfly-kpi-grid--peeks-2"
      : "mcfly-kpi-grid mcfly-kpi-grid--peeks";

  if (salesPending) {
    return (
      <section className="mcfly-score mcfly-book" aria-label={ariaLabel}>
        <p className="mcfly-book__lede">{OVERVIEW_PENDING_LINE}</p>
        {share ? <p className="mcfly-book__cta">{share}</p> : null}
        {door}
      </section>
    );
  }

  return (
    <section className="mcfly-score mcfly-book" aria-label={ariaLabel}>
      <p className="mcfly-decision__takeaway" id="mcfly-decision-takeaway">
        {takeaway}
      </p>
      {spendEmpty && !useSampleDesk ? (
        <p className="mcfly-score__pipe">{OVERVIEW_SPEND_EMPTY_LINE}</p>
      ) : null}
      {orderCount > 0 ? (
        <p className="mcfly-score__pipe">{OVERVIEW_COVERAGE_LINE}</p>
      ) : null}

      {showPeeks ? (
        <div className={peekGridClass}>
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
            label={
              typicalIsMedian ? PRODUCT_NOUN.bookTypicalOrder : "AOV"
            }
            value={typical ?? "—"}
            sub={
              typicalIsMedian
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
            foot="Dollars, not headcount."
          />
          {third.kind === "empty" ? null : (
            <KpiCard
              to={third.kind === "daysToSecond" ? "/app/growth" : ordersHref}
              nextLabel={
                third.kind === "daysToSecond"
                  ? `Open ${PRODUCT_NOUN.growthTitle}`
                  : `Open ${PRODUCT_NOUN.ordersTitle}`
              }
              next={thirdNext}
              formulaBlock={thirdBlock}
              icon={thirdIcon}
              label={thirdLabel}
              value={thirdValue}
            />
          )}
        </div>
      ) : null}

      {share ? <p className="mcfly-book__cta">{share}</p> : null}
      {door}
    </section>
  );
}
