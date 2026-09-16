import type { ReactNode } from "react";
import { Link } from "react-router";
import { DeskIcon, type DeskIconName } from "./DeskIcon";
import { useDeskDrill } from "./DeskDrill";
import { formatCurrency, formatMer } from "../lib/mer-format";
import { PRODUCT_NOUN } from "../lib/product-labels";
import {
  OVERVIEW_COVERAGE_LINE,
  OVERVIEW_SPEND_EMPTY_LINE,
  overviewDecisionTakeaway,
  overviewNoticeSentence,
  overviewReturningCompactDollars,
} from "../lib/overview-first-viewport";
import { SAMPLE_SPEND_NOT_LIVE } from "../lib/sample-live-handoff";

function pct(share: number): string {
  return `${Math.round(share * 100)}%`;
}

function KpiCard({
  to,
  nextLabel,
  next,
  formulaBlock,
  lead,
  zone,
  label,
  value,
  formula,
  sub,
  delta,
  foot,
  icon,
}: {
  to: string;
  nextLabel: string;
  next: string;
  formulaBlock: string;
  lead?: boolean;
  zone?: "ok" | "below" | "empty";
  label: string;
  value: string;
  formula?: string;
  sub?: string;
  delta?: string | null;
  foot?: string;
  icon: DeskIconName;
}) {
  const drill = useDeskDrill();
  return (
    <button
      type="button"
      className={[
        "mcfly-kpi",
        "mcfly-kpi--drill",
        lead ? "mcfly-kpi--lead" : null,
        zone ? `mcfly-kpi--${zone}` : null,
      ]
        .filter(Boolean)
        .join(" ")}
      onClick={() =>
        drill?.openDrill({
          title: label,
          value,
          kicker: formula,
          blocks: [
            { k: "What this is", v: formulaBlock },
            sub ? { k: "Also", v: sub } : null,
            delta ? { k: "Change", v: delta } : null,
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
      {delta ? <span className="mcfly-kpi__delta">{delta}</span> : null}
      <span className="mcfly-kpi__hint">Click for detail</span>
    </button>
  );
}

function CompactCell({
  icon,
  label,
  value,
  formulaBlock,
  next,
  to,
  nextLabel,
}: {
  icon: DeskIconName;
  label: string;
  value: string;
  formulaBlock: string;
  next: string;
  to: string;
  nextLabel: string;
}) {
  const drill = useDeskDrill();
  return (
    <button
      type="button"
      className="mcfly-compact__cell mcfly-compact__cell--drill"
      onClick={() =>
        drill?.openDrill({
          title: label,
          value,
          blocks: [{ k: "What this is", v: formulaBlock }],
          next,
          nextHref: to,
          nextLabel,
        })
      }
    >
      <p className="mcfly-compact__label">
        <DeskIcon name={icon} /> {label}
      </p>
      <p className="mcfly-compact__value">{value}</p>
    </button>
  );
}

/**
 * Sales KPIs + compact row under the YoY glance. Total ROAS only when this
 * window has spend. Ad spend is not an Overview tile. Empty spend is — not 0×.
 */
export function OverviewFirstViewport({
  "aria-label": ariaLabel = "Shopify sales this period",
  totalSales,
  periodLabel,
  orderCount,
  typicalOrder,
  meanAov,
  returningSalesShare,
  returningSales,
  newCustomers,
  medianDaysToSecond,
  discountedOrderShare,
  weekendSalesShare,
  salesPending,
  spendEmpty,
  totalSpend = 0,
  mer = null,
  breakEvenMer = null,
  targetMer = null,
  eomMer = null,
  salesDelta = null,
  spendDelta = null,
  merDelta = null,
  grossSales = null,
  grossSalesKnown = false,
  ordersHref,
  spendHref,
  roasHref,
  goalsHref,
  settingsHref = "/app/settings",
  useSampleDesk = false,
  share,
}: {
  "aria-label"?: string;
  totalSales: number;
  periodLabel: string;
  orderCount: number;
  typicalOrder: number | null;
  meanAov: number | null;
  returningSalesShare: number | null;
  returningSales?: number | null;
  newCustomers: number;
  medianDaysToSecond: number | null;
  discountedOrderShare: number | null;
  weekendSalesShare?: number | null;
  salesPending: boolean;
  spendEmpty: boolean;
  totalSpend?: number;
  mer?: number | null;
  breakEvenMer?: number | null;
  targetMer?: number | null;
  eomMer?: number | null;
  salesDelta?: string | null;
  spendDelta?: string | null;
  merDelta?: string | null;
  grossSales?: number | null;
  grossSalesKnown?: boolean;
  ordersHref: string;
  spendHref: string;
  roasHref: string;
  goalsHref: string;
  settingsHref?: string;
  useSampleDesk?: boolean;
  share?: ReactNode;
}) {
  const notice = overviewNoticeSentence({
    orderCount,
    returningSalesShare,
    discountedOrderShare,
    medianDaysToSecond,
    salesPending,
  });
  const typicalIsMedian =
    typicalOrder != null && Number.isFinite(typicalOrder);
  const typicalValue = typicalIsMedian
    ? typicalOrder
    : meanAov != null && Number.isFinite(meanAov)
      ? meanAov
      : null;
  const typical =
    typicalValue != null ? formatCurrency(typicalValue) : null;
  const takeaway = overviewDecisionTakeaway({
    typicalOrderLabel: typical,
    returningSalesShare,
    salesPending,
    orderCount,
  });
  const hasSpend = Number.isFinite(totalSpend) && totalSpend > 0;
  const roasValue =
    hasSpend && mer != null && Number.isFinite(mer) ? `${formatMer(mer)}×` : "—";
  const eomValue =
    hasSpend && eomMer != null && Number.isFinite(eomMer)
      ? `${formatMer(eomMer)}×`
      : (typical ?? "—");
  const returningDollars = overviewReturningCompactDollars(returningSales);
  const returningValue =
    returningDollars != null ? formatCurrency(returningDollars) : "—";
  const salesSub =
    grossSalesKnown && grossSales != null && Number.isFinite(grossSales)
      ? `Original ${formatCurrency(grossSales)} · Ads Manager–comparable`
      : OVERVIEW_COVERAGE_LINE;
  const why = salesPending
    ? notice
    : [
        `${periodLabel}: ${orderCount.toLocaleString()} orders and ${formatCurrency(totalSales)} sales.`,
        useSampleDesk
          ? SAMPLE_SPEND_NOT_LIVE
          : spendEmpty
            ? OVERVIEW_SPEND_EMPTY_LINE
            : null,
      ]
        .filter(Boolean)
        .join(" ");

  if (salesPending) {
    return (
      <section className="mcfly-score" aria-label={ariaLabel}>
        <p className="mcfly-book__lede">{notice}</p>
      </section>
    );
  }

  return (
    <section className="mcfly-score" aria-label={ariaLabel}>
      <section
        className="mcfly-decision"
        aria-labelledby="mcfly-decision-takeaway"
      >
        <p className="mcfly-decision__kicker">What to notice</p>
        <p className="mcfly-decision__takeaway" id="mcfly-decision-takeaway">
          {takeaway}
        </p>
        <p className="mcfly-decision__why">{why}</p>
        <div className="mcfly-decision__actions">
          <Link className="mcfly-decision__verb" to={ordersHref}>
            Open {PRODUCT_NOUN.ordersTitle}
          </Link>
          {useSampleDesk ? (
            <Link className="mcfly-decision__link" to={settingsHref}>
              Example spend · switch to Live
            </Link>
          ) : hasSpend ? (
            <Link className="mcfly-decision__link" to={spendHref}>
              Edit spend →
            </Link>
          ) : null}
        </div>
      </section>

      <div
        className={[
          "mcfly-kpi-grid",
          hasSpend ? "mcfly-kpi-grid--with-roas" : null,
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <KpiCard
          to={ordersHref}
          nextLabel={`Open ${PRODUCT_NOUN.ordersTitle}`}
          next="Typical order, discounts, and weekend sit on Orders — Shopify Analytics only shows the average."
          formulaBlock="Shopify Total Sales after returns. The numerator in Total ROAS when you add spend."
          lead
          icon="sales"
          label="Total Sales"
          value={formatCurrency(totalSales)}
          sub={salesSub}
          delta={salesDelta}
          foot="Returns already accounted for — not ignored."
        />
        {hasSpend ? (
          <KpiCard
            to={roasHref}
            nextLabel={`Open ${PRODUCT_NOUN.totalRoas}`}
            next="Open Total ROAS for the explorer and month pace."
            formulaBlock={PRODUCT_NOUN.definition}
            zone={
              mer == null
                ? "empty"
                : targetMer != null && mer >= targetMer
                  ? "ok"
                  : "below"
            }
            icon="roas"
            label={PRODUCT_NOUN.totalRoas}
            value={roasValue}
            formula={PRODUCT_NOUN.definition}
            delta={[
              merDelta,
              spendDelta,
              breakEvenMer != null && Number.isFinite(breakEvenMer)
                ? `BE ${formatMer(breakEvenMer)}×`
                : null,
            ]
              .filter(Boolean)
              .join(" · ")}
            foot="Sales ÷ entered spend. Not platform ROAS."
          />
        ) : null}
        <KpiCard
          to={hasSpend ? goalsHref : ordersHref}
          nextLabel={hasSpend ? "Open Goals" : `Open ${PRODUCT_NOUN.ordersTitle}`}
          next={
            hasSpend
              ? "Goals compares this month’s plan to actual sales and spend."
              : "Orders shows typical ticket, discounts, and when sales land."
          }
          formulaBlock={
            hasSpend
              ? "If the last closed days hold through month end. Cash pace — not attributed ROAS."
              : PRODUCT_NOUN.bookTypicalOrderDef
          }
          icon={hasSpend ? "chart" : "orders"}
          label={
            hasSpend ? "EOM projected Total ROAS" : PRODUCT_NOUN.bookTypicalOrder
          }
          value={eomValue}
          sub={
            hasSpend && targetMer != null && Number.isFinite(targetMer)
              ? `Target ${formatMer(targetMer)}×`
              : typicalIsMedian
                ? "Median. Shopify Analytics uses the average."
                : undefined
          }
        />
      </div>

      <div className="mcfly-compact" aria-label="Order density">
        <CompactCell
          icon="orders"
          label="Orders"
          value={orderCount.toLocaleString()}
          formulaBlock="Paid orders in this window after returns. Shopify Analytics Overview also shows this count."
          next="Open Orders for typical ticket, discounts, and weekday mix."
          to={ordersHref}
          nextLabel={`Open ${PRODUCT_NOUN.ordersTitle}`}
        />
        <CompactCell
          icon="customers"
          label="New customers"
          value={newCustomers > 0 ? newCustomers.toLocaleString() : "—"}
          formulaBlock="Buyers whose first Shopify order is in this window."
          next="Open Customers for returning dollars and guest checkouts."
          to="/app/customers"
          nextLabel={`Open ${PRODUCT_NOUN.buyersTitle}`}
        />
        <CompactCell
          icon="customers"
          label="Returning"
          value={returningValue}
          formulaBlock="Sales from returning customers in this window. Shopify Analytics Overview is a returning-customer rate."
          next="Open Customers for the split next to typical order."
          to="/app/customers"
          nextLabel={`Open ${PRODUCT_NOUN.buyersTitle}`}
        />
        <CompactCell
          icon="orders"
          label={typicalIsMedian ? "Typical order" : "AOV"}
          value={typical ?? "—"}
          formulaBlock={
            typicalIsMedian
              ? PRODUCT_NOUN.bookTypicalOrderDef
              : "Average order value when median is not available yet."
          }
          next="Open Orders — Shopify Analytics uses the average."
          to={ordersHref}
          nextLabel={`Open ${PRODUCT_NOUN.ordersTitle}`}
        />
      </div>

      {weekendSalesShare != null &&
      Number.isFinite(weekendSalesShare) &&
      Math.round(weekendSalesShare * 100) > 0 ? (
        <p className="mcfly-score__pipe">
          Weekend sales {pct(weekendSalesShare)} of this window, shop-local.
        </p>
      ) : null}

      {share ? <p className="mcfly-book__cta">{share}</p> : null}
    </section>
  );
}
