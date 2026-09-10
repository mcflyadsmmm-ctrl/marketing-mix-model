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
  /** When true, spend CTA is the unlock — not the only thing on the desk. */
  showSpendUnlock: boolean;
};

/**
 * Zero-spend Overview wedge — order economics free Shopify Analytics
 * does not lead with. Never sessions / conversion / path credit.
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
          weekday till share, and new vs returning sales — then you can add
          spend for Total ROAS vs break-even.
        </p>
      </section>
    );
  }

  return (
    <section className="mcfly-order-econ" aria-label="Shopify order economics">
      <p className="mcfly-order-econ__kicker">
        From your Shopify orders · {periodLabel}
      </p>
      <h2 className="mcfly-order-econ__title">
        {economics.aov != null
          ? `Typical order ${moneyExact(economics.aov)}`
          : "Your order economics"}
      </h2>
      <p className="mcfly-order-econ__lede">
        {economics.orderCount.toLocaleString()} orders · {money(economics.sales)}{" "}
        sales. Numbers Analytics does not put next to ad spend.
      </p>

      <div className="mcfly-order-econ__grid">
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
        <div className="mcfly-order-econ__tile">
          <p className="mcfly-order-econ__label">Orders in period</p>
          <p className="mcfly-order-econ__value">
            {economics.orderCount.toLocaleString()}
          </p>
          <p className="mcfly-order-econ__hint">
            Till sales {money(economics.sales)}
          </p>
        </div>
      </div>

      {showSpendUnlock ? (
        <div className="mcfly-order-econ__unlock">
          <p className="mcfly-order-econ__unlock-copy">
            Add ad spend to unlock Total ROAS vs break-even — Shopify sales ÷
            the spend you enter for the same period.
          </p>
          <s-button href="/app/spend" variant="primary">
            Add spend for Total ROAS
          </s-button>
        </div>
      ) : null}
    </section>
  );
}
