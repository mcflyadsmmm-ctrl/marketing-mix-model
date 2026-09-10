import type { OrderEconomics } from "../lib/order-economics";

function money(n: number): string {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

function moneyExact(n: number): string {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(n);
}

function pct(share: number): string {
  return `${Math.round(share * 100)}%`;
}

type Props = {
  economics: OrderEconomics;
  periodLabel: string;
  /** Cold desk: spend CTA unlocks Total ROAS. Trusted desk: omit. */
  showSpendUnlock: boolean;
};

/**
 * Till economics Shopify Analytics will not put next to ad spend.
 * Stays on the desk after spend lands — spend-per-order is the join
 * only Mcfly can show. Never sessions / conversion / path credit.
 */
export function OrderEconomicsPanel({
  economics,
  periodLabel,
  showSpendUnlock,
}: Props) {
  if (!economics.hasSignal) {
    return (
      <section
        className="mcfly-order-econ"
        aria-label="Shopify order economics"
      >
        <p className="mcfly-order-econ__kicker">From your Shopify orders</p>
        <h2 className="mcfly-order-econ__title">Waiting on the first orders</h2>
        <p className="mcfly-order-econ__lede">
          When sales land, this desk shows typical order value, weekend vs
          weekday till share, and new vs returning sales — then add spend for
          Total ROAS vs break-even and spend per order.
        </p>
      </section>
    );
  }

  const title =
    economics.spendPerOrder != null
      ? `Spend ${moneyExact(economics.spendPerOrder)} per order`
      : economics.aov != null
        ? `Typical order ${moneyExact(economics.aov)}`
        : "Your order economics";

  return (
    <section className="mcfly-order-econ" aria-label="Shopify order economics">
      <p className="mcfly-order-econ__kicker">
        Till read · {periodLabel}
      </p>
      <h2 className="mcfly-order-econ__title">{title}</h2>
      <p className="mcfly-order-econ__lede">
        {economics.orderCount.toLocaleString()} orders · {money(economics.sales)}{" "}
        sales
        {economics.aov != null && economics.spendPerOrder != null
          ? ` · AOV ${moneyExact(economics.aov)}`
          : ""}
        . Built to sit next to the spend you enter — not a second Analytics.
      </p>

      <div className="mcfly-order-econ__grid">
        {economics.spendPerOrder != null ? (
          <div className="mcfly-order-econ__tile mcfly-order-econ__tile--accent">
            <p className="mcfly-order-econ__label">Ad spend per order</p>
            <p className="mcfly-order-econ__value">
              {moneyExact(economics.spendPerOrder)}
            </p>
            <p className="mcfly-order-econ__hint">
              Entered spend ÷ {economics.orderCount.toLocaleString()} orders
            </p>
          </div>
        ) : (
          <div className="mcfly-order-econ__tile">
            <p className="mcfly-order-econ__label">Orders in period</p>
            <p className="mcfly-order-econ__value">
              {economics.orderCount.toLocaleString()}
            </p>
            <p className="mcfly-order-econ__hint">
              Till sales {money(economics.sales)}
            </p>
          </div>
        )}
        <div className="mcfly-order-econ__tile">
          <p className="mcfly-order-econ__label">Weekend share of sales</p>
          <p className="mcfly-order-econ__value">
            {economics.weekendShare != null
              ? pct(economics.weekendShare)
              : "—"}
          </p>
          <p className="mcfly-order-econ__hint">
            {money(economics.weekendSales)} weekend ·{" "}
            {money(economics.weekdaySales)} weekday
          </p>
        </div>
        <div className="mcfly-order-econ__tile">
          <p className="mcfly-order-econ__label">Returning sales share</p>
          <p className="mcfly-order-econ__value">
            {economics.returningShare != null
              ? pct(economics.returningShare)
              : "—"}
          </p>
          <p className="mcfly-order-econ__hint">
            {money(economics.returningCustomerSales)} returning ·{" "}
            {money(economics.newCustomerSales)} new
          </p>
        </div>
      </div>

      {showSpendUnlock ? (
        <div className="mcfly-order-econ__unlock">
          <p className="mcfly-order-econ__unlock-copy">
            Add ad spend to unlock Total ROAS vs break-even and spend per
            order — Shopify sales ÷ the spend you enter for the same period.
          </p>
          <s-button href="/app/spend" variant="primary">
            Add spend for Total ROAS
          </s-button>
          <s-button href="/app/spend#mcfly-spend-bill" variant="secondary">
            Or divide a monthly bill
          </s-button>
        </div>
      ) : null}
    </section>
  );
}
