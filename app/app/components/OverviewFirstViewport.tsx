import type { ReactNode } from "react";
import { formatCurrency, formatMer } from "../lib/mer-format";
import { PRODUCT_NOUN } from "../lib/product-labels";
import {
  OVERVIEW_COVERAGE_LINE,
  OVERVIEW_SPEND_EMPTY_LINE,
  overviewNoticeSentence,
} from "../lib/overview-first-viewport";

/** Whole percents in merchant chrome — 25%, never 25.0%. */
function pct(share: number): string {
  return `${Math.round(share * 100)}%`;
}

function GlanceStat({
  title,
  value,
  hint,
}: {
  title: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="mcfly-book__kpi">
      <p className="mcfly-book__kpi-k">{title}</p>
      <p className="mcfly-book__kpi-v">{value}</p>
      {hint ? <p className="mcfly-book__kpi-hint">{hint}</p> : null}
    </div>
  );
}

/**
 * Screenshot viewport: Sales always. Total ROAS beside it when spend exists
 * (never 0×). Signal cards Shopify Analytics Overview does not put together.
 */
export function OverviewFirstViewport({
  "aria-label": ariaLabel = "Shopify sales this period",
  totalSales,
  daySpan,
  deltaLine,
  orderCount,
  typicalOrder,
  meanAov,
  returningSalesShare,
  returningSales,
  medianDaysToSecond,
  discountedOrderShare,
  weekendSalesShare,
  returnsDrag,
  salesPending,
  spendEmpty,
  totalSpend = 0,
  mer = null,
  breakEvenMer = null,
  share,
}: {
  "aria-label"?: string;
  totalSales: number;
  daySpan: string;
  deltaLine: string | null;
  orderCount: number;
  typicalOrder: number | null;
  meanAov: number | null;
  returningSalesShare: number | null;
  returningSales?: number | null;
  medianDaysToSecond: number | null;
  discountedOrderShare: number | null;
  weekendSalesShare?: number | null;
  returnsDrag?: number | null;
  salesPending: boolean;
  spendEmpty: boolean;
  totalSpend?: number;
  mer?: number | null;
  breakEvenMer?: number | null;
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
  const typical = typicalIsMedian
    ? formatCurrency(typicalOrder)
    : meanAov != null && Number.isFinite(meanAov)
      ? formatCurrency(meanAov)
      : null;
  const returning =
    returningSalesShare != null && Number.isFinite(returningSalesShare)
      ? pct(returningSalesShare)
      : null;
  const returningDollars =
    returningSales != null &&
    Number.isFinite(returningSales) &&
    returningSales > 0
      ? formatCurrency(returningSales)
      : null;
  const second =
    medianDaysToSecond != null && Number.isFinite(medianDaysToSecond)
      ? `${Math.round(medianDaysToSecond)}d`
      : null;
  const weekend =
    weekendSalesShare != null &&
    Number.isFinite(weekendSalesShare) &&
    Math.round(weekendSalesShare * 100) > 0
      ? pct(weekendSalesShare)
      : null;
  const discounted =
    discountedOrderShare != null &&
    Number.isFinite(discountedOrderShare) &&
    Math.round(discountedOrderShare * 100) > 0
      ? pct(discountedOrderShare)
      : null;
  const returns =
    returnsDrag != null && Number.isFinite(returnsDrag) && returnsDrag > 0
      ? formatCurrency(returnsDrag)
      : null;
  const hasSpend = Number.isFinite(totalSpend) && totalSpend > 0;
  const roasValue =
    hasSpend && mer != null && Number.isFinite(mer) ? `${formatMer(mer)}×` : null;
  const glance = salesPending
    ? []
    : [
        typical
          ? {
              title: typicalIsMedian
                ? PRODUCT_NOUN.bookTypicalOrder
                : "Average order",
              value: typical,
              hint: typicalIsMedian
                ? meanAov != null && Number.isFinite(meanAov)
                  ? `Average ${formatCurrency(meanAov)}`
                  : undefined
                : "Shopify Analytics uses the average",
            }
          : null,
        returningDollars || returning
          ? {
              title: "Returning sales",
              value: returningDollars ?? returning!,
              hint:
                returningDollars && returning
                  ? `${returning} of sales. Share of dollars, not headcount`
                  : "Share of dollars, not headcount",
            }
          : null,
        second
          ? { title: "Second order", value: second, hint: "Median days" }
          : null,
        weekend
          ? {
              title: PRODUCT_NOUN.bookWeekendSales,
              value: weekend,
              hint: "Sat + Sun",
            }
          : null,
        discounted
          ? {
              title: PRODUCT_NOUN.bookDiscountedOrders,
              value: discounted,
            }
          : null,
        returns
          ? {
              title: PRODUCT_NOUN.bookReturnsEdits,
              value: returns,
            }
          : null,
      ].filter(
        (
          item,
        ): item is { title: string; value: string; hint?: string } =>
          item != null,
      );
  const heroDef = [daySpan, OVERVIEW_COVERAGE_LINE, deltaLine]
    .filter((part): part is string => Boolean(part))
    .join(" · ");

  return (
    <section className="mcfly-book" aria-label={ariaLabel}>
      {salesPending ? null : roasValue ? (
        <div className="mcfly-book__pair">
          <div className="mcfly-book__hero">
            <p className="mcfly-book__hero-k">{PRODUCT_NOUN.salesBasisShort}</p>
            <p className="mcfly-book__hero-v">{formatCurrency(totalSales)}</p>
            <p className="mcfly-book__hero-def">{heroDef}</p>
          </div>
          <div className="mcfly-book__hero mcfly-book__hero--roas">
            <p className="mcfly-book__hero-k">{PRODUCT_NOUN.totalRoas}</p>
            <p className="mcfly-book__hero-v">{roasValue}</p>
            <p className="mcfly-book__hero-def">
              {PRODUCT_NOUN.definition}
              {breakEvenMer != null && Number.isFinite(breakEvenMer)
                ? ` · break-even ${formatMer(breakEvenMer)}× from your margin`
                : ". Empty spend is not a ratio."}
            </p>
          </div>
        </div>
      ) : (
        <div className="mcfly-book__hero">
          <p className="mcfly-book__hero-k">{PRODUCT_NOUN.salesBasisShort}</p>
          <p className="mcfly-book__hero-v">{formatCurrency(totalSales)}</p>
          <p className="mcfly-book__hero-def">{heroDef}</p>
        </div>
      )}

      {glance.length > 0 ? (
        <div className="mcfly-book__glance mcfly-book__glance--kpis">
          {glance.map((item) => (
            <GlanceStat
              key={item.title}
              title={item.title}
              value={item.value}
              hint={item.hint}
            />
          ))}
        </div>
      ) : null}

      <p className="mcfly-book__lede">
        {notice}
        {spendEmpty ? ` ${OVERVIEW_SPEND_EMPTY_LINE}` : ""}
      </p>

      {share ? <p className="mcfly-book__cta">{share}</p> : null}
    </section>
  );
}
