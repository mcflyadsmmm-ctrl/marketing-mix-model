import type { ReactNode } from "react";
import { DeskIcon } from "./DeskIcon";
import { formatCurrency } from "../lib/mer-format";
import { useDeskCurrency } from "../lib/desk-currency";
import { OVERVIEW_FROM_ORDERS_LABEL } from "../lib/overview-order-book";
import { PRODUCT_NOUN } from "../lib/product-labels";
import { SAMPLE_CUSTOMERS_DOOR } from "../lib/sample-live-handoff";
import type { CustomerAnalytics } from "../lib/customers-analytics";
import type { ShopifyNativePeriodStats } from "../lib/shopify-native-stats";
import {
  CUSTOMERS_ANALYTICS_SR_LINE,
  CUSTOMERS_PENDING_LINE,
  CUSTOMERS_THIN_EMPTY_LINE,
  CUSTOMERS_TODAY_TRUNCATED_LINE,
  buildCustomersHero,
  customersOperatorGreeting,
} from "../lib/customers-first-viewport";

/**
 * First-fold Customers — one returning-$ hero, quiet mix strip, From orders.
 * salesPending must not blank OrderFact returning $.
 */
export function CustomersFirstViewport({
  analytics,
  book,
  salesPending,
  useSampleDesk = false,
  todaySalesTruncated = false,
  periodLabel = "This period",
}: {
  analytics: CustomerAnalytics;
  book: ShopifyNativePeriodStats;
  salesPending: boolean;
  useSampleDesk?: boolean;
  todaySalesTruncated?: boolean;
  periodLabel?: string;
}): ReactNode {
  const currency = useDeskCurrency();
  const money = (n: number) => formatCurrency(n, currency);
  const hero = buildCustomersHero(book, {
    todaySalesTruncated,
    lastYear: analytics.lastYearMix,
  });
  const greeting = customersOperatorGreeting({
    salesPending,
    orderCount: analytics.windowOrders,
    identifiedBuyers: analytics.identifiedBuyers,
    returningShare: book.returningSalesShare,
    newShare: book.newSalesShare,
    todaySalesTruncated,
  });
  const hasSplit =
    (book.returningSales != null && book.returningSales > 0) ||
    (book.newSales != null && book.newSales > 0);
  const empty =
    !useSampleDesk &&
    !(analytics.identifiedBuyers > 0) &&
    !(analytics.windowOrders > 0) &&
    !hasSplit;

  if (empty) {
    return (
      <section
        className="mcfly-overview-plane mcfly-customers-plane"
        aria-label={PRODUCT_NOUN.buyersTitle}
      >
        <p className="mcfly-overview-plane__pending">
          No identified buyers in this window yet.
        </p>
        <p className="mcfly-overview-plane__note">{CUSTOMERS_THIN_EMPTY_LINE}</p>
      </section>
    );
  }

  if (!hero) {
    return (
      <section
        className="mcfly-overview-plane mcfly-customers-plane"
        aria-label={PRODUCT_NOUN.buyersTitle}
      >
        <p className="mcfly-overview-plane__pending">{CUSTOMERS_THIN_EMPTY_LINE}</p>
      </section>
    );
  }

  const returningShare =
    book.returningSalesShare != null && Number.isFinite(book.returningSalesShare)
      ? Math.round(book.returningSalesShare * 100)
      : null;
  const stripParts: string[] = [];
  if (hero.counterpartAmount != null && hero.counterpartAmount > 0) {
    stripParts.push(`New ${money(hero.counterpartAmount)}`);
  }
  if (returningShare != null) {
    stripParts.push(`Returning ${returningShare}%`);
  }

  const pendingLine = salesPending ? CUSTOMERS_PENDING_LINE : null;
  const truncatedLine = todaySalesTruncated ? CUSTOMERS_TODAY_TRUNCATED_LINE : null;

  return (
    <section
      className="mcfly-overview-plane mcfly-customers-plane"
      aria-label={PRODUCT_NOUN.buyersTitle}
      data-sample={useSampleDesk ? "true" : undefined}
    >
      <div className="mcfly-overview-plane__hero mcfly-overview-plane__hero--even">
        <div className="mcfly-overview-plane__hero-top">
          <p className="mcfly-overview-plane__period">{periodLabel}</p>
          {greeting ? (
            <p className="mcfly-overview-plane__delta mcfly-overview-plane__delta--empty">
              {greeting}
            </p>
          ) : null}
        </div>
        <p className="mcfly-overview-plane__value">{money(hero.amount)}</p>
        <p className="mcfly-overview-plane__meta">
          <span className="mcfly-overview-plane__source">
            {OVERVIEW_FROM_ORDERS_LABEL}
          </span>
          <span aria-hidden="true"> · </span>
          <span className="mcfly-overview-plane__prior">
            <DeskIcon name="customers" />
            {hero.k}
          </span>
        </p>
        <span className="mcfly-overview-plane__sr">
          {CUSTOMERS_ANALYTICS_SR_LINE}
        </span>
        {useSampleDesk ? (
          <p className="mcfly-overview-plane__note">{SAMPLE_CUSTOMERS_DOOR}</p>
        ) : null}
      </div>

      {pendingLine ? (
        <p className="mcfly-overview-plane__pending">{pendingLine}</p>
      ) : truncatedLine ? (
        <p className="mcfly-overview-plane__pending">{truncatedLine}</p>
      ) : null}

      {stripParts.length > 0 ? (
        <p className="mcfly-overview-plane__strip">
          {stripParts.map((part, index) => (
            <span key={part}>
              {index > 0 ? (
                <>
                  <span aria-hidden="true"> · </span>
                </>
              ) : null}
              <span>{part}</span>
            </span>
          ))}
        </p>
      ) : null}

      {book.returningSalesShare != null &&
      Number.isFinite(book.returningSalesShare) ? (
        <span
          className="mcfly-split"
          aria-hidden="true"
          title={`Returning ${returningShare}%`}
        >
          <span
            className="mcfly-split__return"
            style={{
              width: `${Math.round(book.returningSalesShare * 100)}%`,
            }}
          />
        </span>
      ) : null}
    </section>
  );
}
