import type { ReactNode } from "react";
import { DeskIcon, type DeskIconName } from "./DeskIcon";
import { useDeskDrill } from "./DeskDrill";
import { formatCurrency } from "../lib/mer-format";
import { useDeskCurrency } from "../lib/desk-currency";
import { PRODUCT_NOUN } from "../lib/product-labels";
import { SAMPLE_CUSTOMERS_DOOR } from "../lib/sample-live-handoff";
import type { CustomerAnalytics } from "../lib/customers-analytics";
import type { ShopifyNativePeriodStats } from "../lib/shopify-native-stats";
import {
  CUSTOMERS_PENDING_LINE,
  CUSTOMERS_THIN_EMPTY_LINE,
  buildCustomersHero,
  buildCustomersLeadPeeks,
  customersOperatorGreeting,
  type CustomersPeek,
} from "../lib/customers-first-viewport";

function PeekCard({
  label,
  value,
  sub,
  detail,
  verb,
  icon,
}: {
  label: string;
  value: string;
  sub?: string;
  detail?: string;
  verb?: string;
  icon: DeskIconName;
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
          kicker: verb,
          blocks: [
            detail ? { k: "What this is", v: detail } : null,
            sub ? { k: "Also", v: sub } : null,
          ].filter((block): block is { k: string; v: string } => block != null),
          next: "This number is from Shopify orders in this window — not a platform pixel, not email.",
        })
      }
    >
      <span className="mcfly-kpi__top">
        <DeskIcon name={icon} />
        <span className="mcfly-kpi__label">{label}</span>
      </span>
      {verb ? <span className="mcfly-cust-kpi__verb">{verb}</span> : null}
      <span className="mcfly-kpi__value">{value}</span>
      {sub ? <span className="mcfly-kpi__sub">{sub}</span> : null}
    </button>
  );
}

function CopyEmpty({
  greeting,
  body,
}: {
  greeting: string;
  body: string;
}) {
  return (
    <section
      className="mcfly-score mcfly-book mcfly-score--customers-hero mcfly-score--soft"
      aria-label={PRODUCT_NOUN.buyersTitle}
    >
      <p className="mcfly-score__greeting">{greeting}</p>
      <p className="mcfly-state__copy">{body}</p>
    </section>
  );
}

/**
 * First-fold Customers — returning $ vs new $, dollars per buyer.
 * Mix chart sits beside this in the first lane. RFM / whales stay below.
 * SAMPLE Snowdevil is the craft canvas. Spend stays off Customers.
 */
export function CustomersFirstViewport({
  analytics,
  book,
  salesPending,
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
    salesPending,
    orderCount: analytics.windowOrders,
    identifiedBuyers: analytics.identifiedBuyers,
    returningShare: salesPending ? null : book.returningSalesShare,
    newShare: salesPending ? null : book.newSalesShare,
  });
  const hero = salesPending ? null : buildCustomersHero(book);
  const peeks = salesPending
    ? []
    : buildCustomersLeadPeeks(book, {
        hideNewDollars: hero?.kind === "newDollars",
      });
  const trust = useSampleDesk && !salesPending ? SAMPLE_CUSTOMERS_DOOR : null;
  const hasSplit =
    (book.returningSales != null && book.returningSales > 0) ||
    (book.newSales != null && book.newSales > 0);

  if (salesPending) {
    return (
      <CopyEmpty
        greeting={CUSTOMERS_PENDING_LINE}
        body="Returning dollars fill as closed days land — not $0."
      />
    );
  }

  if (
    !useSampleDesk &&
    !(analytics.identifiedBuyers > 0) &&
    !(analytics.windowOrders > 0) &&
    !hasSplit
  ) {
    return <CopyEmpty greeting={greeting} body={CUSTOMERS_THIN_EMPTY_LINE} />;
  }

  if (!hero && peeks.length === 0) {
    return <CopyEmpty greeting={greeting} body={CUSTOMERS_THIN_EMPTY_LINE} />;
  }

  return (
    <section
      className="mcfly-score mcfly-book mcfly-score--customers-hero mcfly-score--soft"
      aria-label={PRODUCT_NOUN.buyersTitle}
    >
      <p className="mcfly-score__greeting">{greeting}</p>
      {trust ? <p className="mcfly-score__trust">{trust}</p> : null}

      {hero ? (
        <article className="mcfly-customers-hero mcfly-customers-hero--soft">
          <p className="mcfly-customers-hero__k">
            <DeskIcon name="customers" />
            {hero.k}
          </p>
          <p className="mcfly-customers-hero__v">{money(hero.amount)}</p>
          {hero.counterpartAmount != null ? (
            <p className="mcfly-customers-hero__sub">
              New {money(hero.counterpartAmount)}
            </p>
          ) : null}
          <p className="mcfly-customers-hero__def">{hero.def}</p>
        </article>
      ) : null}

      {peeks.length > 0 ? (
        <div className="mcfly-well mcfly-well--scoreboard mcfly-kpi-grid mcfly-kpi-grid--peeks mcfly-kpi-grid--peeks-lead mcfly-kpi-grid--soft">
          {peeks.map((row: CustomersPeek) => (
            <PeekCard
              key={row.k}
              icon={row.icon}
              label={row.k}
              value={money(row.amount)}
              sub={row.s}
              detail={row.d}
              verb={row.verb}
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}
