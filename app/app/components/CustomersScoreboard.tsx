import type { ReactNode } from "react";
import { DeskIcon, type DeskIconName } from "./DeskIcon";
import { useDeskDrill } from "./DeskDrill";
import { formatCurrency } from "../lib/mer-format";
import { useDeskCurrency } from "../lib/desk-currency";
import type { ShopifyNativePeriodStats } from "../lib/shopify-native-stats";
import type { ShopifyDepthStats } from "../lib/shopify-depth-stats";
import {
  CUSTOMERS_KICKER,
  CUSTOMERS_RETURNING_EMPTY,
  customerDollarSplit,
  customersReturningDollars,
  wholePercent,
} from "../lib/customers-scoreboard";

function isNum(n: number | null | undefined): n is number {
  return n != null && Number.isFinite(n);
}

function hasShare(share: number | null | undefined): share is number {
  return isNum(share) && Math.round(share * 100) > 0;
}

function pct(share: number): string {
  return `${wholePercent(share)}%`;
}

/** One interactive stat — formula stays in the drill, never behind a guess. */
function CustPeek({
  label,
  value,
  sub,
  icon,
  formula,
  next,
  nextHref,
  nextLabel,
  extra,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: DeskIconName;
  formula: string;
  next: string;
  nextHref?: string;
  nextLabel?: string;
  extra?: ReactNode;
}) {
  const drill = useDeskDrill();
  const open = () =>
    drill?.openDrill({
      title: label,
      value,
      blocks: [
        { k: "What this is", v: formula },
        sub ? { k: "Also", v: sub } : null,
      ].filter((block): block is { k: string; v: string } => block != null),
      next,
      nextHref,
      nextLabel,
      foot: "From this shop's Shopify orders — not a pixel, not an email list.",
    });
  const body = (
    <>
      <span className="mcfly-kpi__top">
        <DeskIcon name={icon} />
        <span className="mcfly-kpi__label">{label}</span>
      </span>
      <span className="mcfly-kpi__value">{value}</span>
      {sub ? <span className="mcfly-kpi__sub">{sub}</span> : null}
      {extra}
    </>
  );
  return drill ? (
    <button
      type="button"
      className="mcfly-kpi mcfly-kpi--peek mcfly-kpi--drill mcfly-cust__peek"
      onClick={open}
    >
      {body}
    </button>
  ) : (
    <div className="mcfly-kpi mcfly-kpi--peek mcfly-cust__peek">{body}</div>
  );
}

/**
 * Customers scoreboard — Black Clover density on the returning-dollars niche.
 *
 * Hero is sales from returning customers ($), then a dense interactive strip:
 * $ per buyer · guests · top-10% concentration · one-order buyers · orders per
 * buyer · biggest orders. SAMPLE Snowdevil is the craft canvas — never thin
 * this to match a live store with fewer facts. Zero spend / ROAS on this tab.
 */
export function CustomersScoreboard({
  book,
  depth,
  salesPending,
  useSampleDesk,
  growthHref = "/app/growth",
  ltvHref = "/app/ltv",
}: {
  book: ShopifyNativePeriodStats;
  depth: ShopifyDepthStats;
  salesPending: boolean;
  useSampleDesk: boolean;
  growthHref?: string;
  ltvHref?: string;
}) {
  const currency = useDeskCurrency();
  const drill = useDeskDrill();

  const returningDollars = customersReturningDollars(book.returningSales);
  const returningValue =
    salesPending || returningDollars == null
      ? "—"
      : formatCurrency(returningDollars, currency);
  const split = salesPending
    ? null
    : customerDollarSplit({
        newSalesShare: book.newSalesShare,
        returningSalesShare: book.returningSalesShare,
      });
  const heroSub =
    !salesPending && hasShare(book.returningSalesShare)
      ? `${pct(book.returningSalesShare)} of sales — dollars, not headcount`
      : salesPending
        ? "Still loading — not $0."
        : CUSTOMERS_RETURNING_EMPTY;

  const perBuyerValue = salesPending
    ? "—"
    : isNum(book.returningBuyerArpu)
      ? formatCurrency(book.returningBuyerArpu, currency)
      : isNum(book.newBuyerArpu)
        ? formatCurrency(book.newBuyerArpu, currency)
        : "—";
  const perBuyerSub =
    !salesPending && isNum(book.newBuyerArpu) && isNum(book.returningBuyerArpu)
      ? `New ${formatCurrency(book.newBuyerArpu, currency)} · returning ${formatCurrency(book.returningBuyerArpu, currency)}`
      : !salesPending && isNum(book.returningBuyerArpu)
        ? "Per returning buyer"
        : !salesPending && isNum(book.newBuyerArpu)
          ? "Per new buyer"
          : undefined;

  const guestValue =
    !salesPending && book.guestOrders > 0 && hasShare(book.guestShare)
      ? pct(book.guestShare)
      : "—";
  const guestSub =
    salesPending
      ? undefined
      : isNum(depth.guestAov) && isNum(depth.identifiedAov)
        ? `Typical guest ${formatCurrency(depth.guestAov, currency)} vs ${formatCurrency(depth.identifiedAov, currency)} with an account`
        : book.guestOrders > 0
          ? `${book.guestOrders.toLocaleString()} orders without an account`
          : undefined;

  const topCustomersValue =
    !salesPending && hasShare(depth.topCustomerSalesShare)
      ? pct(depth.topCustomerSalesShare)
      : "—";
  const oneOrderValue =
    !salesPending &&
    isNum(depth.oneAndDoneShare) &&
    depth.oneAndDoneShare > 0
      ? pct(depth.oneAndDoneShare)
      : "—";
  const ordersPerBuyerValue =
    !salesPending && isNum(depth.ordersPerBuyer)
      ? depth.ordersPerBuyer.toFixed(1)
      : "—";
  const biggestOrdersValue =
    !salesPending && hasShare(depth.topDecileSalesShare)
      ? pct(depth.topDecileSalesShare)
      : "—";

  const openHero = () =>
    drill?.openDrill({
      title: "Sales from returning customers",
      value: returningValue,
      kicker:
        !salesPending && split
          ? `Returning ${split.returningPct}% · new ${split.newPct}% of sales`
          : undefined,
      blocks: [
        {
          k: "What this is",
          v: "Dollars from buyers who had ordered before, in this window. Shopify Analytics Overview shows a returning-customer rate (headcount) — this is the money.",
        },
        !salesPending && isNum(book.newSales)
          ? {
              k: "First-time buyers",
              v: `${formatCurrency(book.newSales, currency)} from buyers on their first order.`,
            }
          : null,
      ].filter((block): block is { k: string; v: string } => block != null),
      next: "Growth covers days to a second order and who came back. LTV tracks 30 / 90 / 365-day repeat value.",
      nextHref: growthHref,
      nextLabel: "Open Growth",
    });

  const heroBody = (
    <>
      <span className="mcfly-cust__hero-k">
        <DeskIcon name="customers" />
        Sales from returning customers
      </span>
      <span className="mcfly-cust__hero-v">{returningValue}</span>
      <span className="mcfly-cust__hero-sub">{heroSub}</span>
      {split ? (
        <>
          <span
            className="mcfly-split mcfly-cust__split"
            aria-hidden="true"
            title={`Returning ${split.returningPct}% · new ${split.newPct}%`}
          >
            <span
              className="mcfly-split__return"
              style={{ width: `${split.returningPct}%` }}
            />
          </span>
          <span className="mcfly-cust__split-legend">
            <span className="mcfly-cust__split-tag mcfly-cust__split-tag--return">
              Returning {split.returningPct}%
            </span>
            <span className="mcfly-cust__split-tag">New {split.newPct}%</span>
          </span>
        </>
      ) : null}
    </>
  );

  return (
    <section
      className="mcfly-score mcfly-book mcfly-cust mcfly-desk-anchor"
      aria-label="Returning customers scoreboard"
    >
      <p
        className={
          useSampleDesk && !salesPending
            ? "mcfly-scoreboard__kicker mcfly-scoreboard__kicker--sr"
            : "mcfly-scoreboard__kicker"
        }
      >
        {salesPending
          ? "Sales for closed days are still loading — not $0."
          : CUSTOMERS_KICKER}
      </p>

      {drill ? (
        <button
          type="button"
          className="mcfly-cust__hero mcfly-cust__hero--drill"
          onClick={openHero}
        >
          {heroBody}
        </button>
      ) : (
        <div className="mcfly-cust__hero">{heroBody}</div>
      )}

      <div className="mcfly-kpi-grid mcfly-kpi-grid--peeks mcfly-kpi-grid--peeks-lead">
        <CustPeek
          label="Sales per buyer"
          value={perBuyerValue}
          sub={perBuyerSub}
          icon="customers"
          formula="Window sales dollars per unique buyer — not an average order. New and returning buyers spend differently."
          next="LTV tracks what a new buyer is worth over 30 / 90 / 365 days."
          nextHref={ltvHref}
          nextLabel="Open LTV"
        />
        <CustPeek
          label="Guests"
          value={guestValue}
          sub={guestSub}
          icon="customers"
          formula="Share of orders placed without a customer account. Guests cannot be matched across orders, so they never count as returning."
          next="Growth covers who came back after a first order."
          nextHref={growthHref}
          nextLabel="Open Growth"
        />
        <CustPeek
          label="Top 10% of customers"
          value={topCustomersValue}
          sub={
            topCustomersValue !== "—" ? "of sales from top buyers" : undefined
          }
          icon="customers"
          formula="Share of this window's sales from the highest-spending 10% of identified buyers. High means a few accounts carry the shop."
          next="LTV shows how much those top buyers are worth over time."
          nextHref={ltvHref}
          nextLabel="Open LTV"
        />
      </div>

      <div className="mcfly-kpi-grid mcfly-kpi-grid--peeks mcfly-kpi-grid--peeks-depth">
        <CustPeek
          label="One-order buyers"
          value={oneOrderValue}
          sub={oneOrderValue !== "—" ? "Bought once this window" : undefined}
          icon="customers"
          formula="Identified buyers with exactly one order in this window. The gap between this and returning dollars is your repeat opportunity."
          next="Growth covers days to a second order and 30-day come-back."
          nextHref={growthHref}
          nextLabel="Open Growth"
        />
        <CustPeek
          label="Orders per buyer"
          value={ordersPerBuyerValue}
          sub={
            depth.identifiedBuyers > 0
              ? `${depth.identifiedBuyers.toLocaleString()} identified buyers`
              : undefined
          }
          icon="orders"
          formula="Identified orders divided by identified buyers in this window. Guests are excluded — they have no account to match."
          next="LTV turns repeat orders into 30 / 90 / 365-day value."
          nextHref={ltvHref}
          nextLabel="Open LTV"
        />
        <CustPeek
          label="Biggest orders"
          value={biggestOrdersValue}
          sub={biggestOrdersValue !== "—" ? "Top 10% of orders" : undefined}
          icon="orders"
          formula="Share of sales from the largest 10% of orders in this window. Order concentration — not the same as your top customers."
          next="Orders covers the typical ticket, discounts, and items."
          nextHref="/app/orders"
          nextLabel="Open Orders"
        />
      </div>
    </section>
  );
}
