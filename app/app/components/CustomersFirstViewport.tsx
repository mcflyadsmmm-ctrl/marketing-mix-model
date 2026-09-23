import type { ReactNode } from "react";
import { DeskIcon } from "./DeskIcon";
import { formatCurrency } from "../lib/mer-format";
import { useDeskCurrency } from "../lib/desk-currency";
import { PRODUCT_NOUN } from "../lib/product-labels";
import { SAMPLE_CUSTOMERS_DOOR } from "../lib/sample-live-handoff";
import type { CustomerAnalytics } from "../lib/customers-analytics";
import type { ShopifyNativePeriodStats } from "../lib/shopify-native-stats";
import {
  CUSTOMERS_THIN_EMPTY_LINE,
  buildCustomersHero,
  customersOperatorGreeting,
} from "../lib/customers-first-viewport";

/**
 * First-fold Customers — returning dollars vs new from the order book.
 * No soft peek grid. salesPending must not blank OrderFact returning $.
 */
export function CustomersFirstViewport({
  analytics,
  book,
  salesPending: _salesPending,
  useSampleDesk = false,
}: {
  analytics: CustomerAnalytics;
  book: ShopifyNativePeriodStats;
  salesPending: boolean;
  useSampleDesk?: boolean;
}): ReactNode {
  const currency = useDeskCurrency();
  const money = (n: number) => formatCurrency(n, currency);
  const greeting = customersOperatorGreeting({
    salesPending: false,
    orderCount: analytics.windowOrders,
    identifiedBuyers: analytics.identifiedBuyers,
    returningShare: book.returningSalesShare,
    newShare: book.newSalesShare,
  });
  const hero = buildCustomersHero(book);
  const trust = useSampleDesk ? SAMPLE_CUSTOMERS_DOOR : null;
  const hasSplit =
    (book.returningSales != null && book.returningSales > 0) ||
    (book.newSales != null && book.newSales > 0);

  if (
    !useSampleDesk &&
    !(analytics.identifiedBuyers > 0) &&
    !(analytics.windowOrders > 0) &&
    !hasSplit
  ) {
    return (
      <section
        className="mcfly-score mcfly-book mcfly-score--customers-hero"
        aria-label={PRODUCT_NOUN.buyersTitle}
      >
        <p className="mcfly-score__greeting">{greeting}</p>
        <p className="mcfly-state__copy">{CUSTOMERS_THIN_EMPTY_LINE}</p>
      </section>
    );
  }

  if (!hero) {
    return (
      <section
        className="mcfly-score mcfly-book mcfly-score--customers-hero"
        aria-label={PRODUCT_NOUN.buyersTitle}
      >
        <p className="mcfly-score__greeting">{greeting}</p>
        <p className="mcfly-state__copy">{CUSTOMERS_THIN_EMPTY_LINE}</p>
      </section>
    );
  }

  const returningShare =
    book.returningSalesShare != null && Number.isFinite(book.returningSalesShare)
      ? Math.round(book.returningSalesShare * 100)
      : null;

  return (
    <section
      className="mcfly-score mcfly-book mcfly-score--customers-hero"
      aria-label={PRODUCT_NOUN.buyersTitle}
    >
      <p className="mcfly-score__greeting">{greeting}</p>
      {trust ? <p className="mcfly-score__trust">{trust}</p> : null}

      <article className="mcfly-customers-hero">
        <p className="mcfly-customers-hero__k">
          <DeskIcon name="customers" />
          {hero.k}
        </p>
        <p className="mcfly-customers-hero__v">{money(hero.amount)}</p>
        {hero.counterpartAmount != null ? (
          <p className="mcfly-customers-hero__sub">
            New {money(hero.counterpartAmount)}
            {returningShare != null ? ` · returning ${returningShare}%` : null}
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
        <p className="mcfly-customers-hero__def">{hero.def}</p>
      </article>
    </section>
  );
}
