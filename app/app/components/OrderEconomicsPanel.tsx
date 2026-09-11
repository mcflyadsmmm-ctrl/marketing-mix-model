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
  /** Cold desk only: optional path to add spend after order insights. */
  showSpendUnlock: boolean;
};

/**
 * Order + customer grain Shopify Analytics will not put on one screen.
 * Leads with AOV, weekend mix, and returning share — spend-per-order is optional depth.
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
        aria-label="Order and customer insights"
      >
        <div className="mcfly-order-econ__head">
          <div className="mcfly-order-econ__headline">
            <p className="mcfly-order-econ__kicker">Orders & customers</p>
            <h2 className="mcfly-order-econ__title">
              Waiting on the first orders
            </h2>
          </div>
        </div>
        <p className="mcfly-order-econ__lede">
          When Shopify orders land, Mcfly shows typical order value, weekend vs
          weekday sales, and new vs returning customers — deeper than free
          Analytics, without exporting CSVs.
        </p>
      </section>
    );
  }

  const title =
    economics.aov != null
      ? `Typical order ${moneyExact(economics.aov)}`
      : `${economics.orderCount.toLocaleString()} orders this period`;

  return (
    <section
      className="mcfly-order-econ"
      aria-label="Order and customer insights"
    >
      <div className="mcfly-order-econ__head">
        <div className="mcfly-order-econ__headline">
          <p className="mcfly-order-econ__kicker">
            Orders & customers · {periodLabel}
          </p>
          <h2 className="mcfly-order-econ__title">{title}</h2>
        </div>
        <p className="mcfly-order-econ__facts">
          {economics.orderCount.toLocaleString()} orders · {money(economics.sales)}{" "}
          sales
          {economics.aov != null ? ` · AOV ${moneyExact(economics.aov)}` : ""}
        </p>
      </div>
      <p className="mcfly-order-econ__lede">
        Order mix and customer split from your Shopify orders — not a second
        Analytics dashboard, and not a CSV dump.
      </p>

      <div className="mcfly-order-econ__grid">
        <div className="mcfly-order-econ__tile mcfly-order-econ__tile--accent">
          <p className="mcfly-order-econ__label">Avg order value</p>
          <p className="mcfly-order-econ__value">
            {economics.aov != null ? moneyExact(economics.aov) : "—"}
          </p>
          <p className="mcfly-order-econ__hint">
            {economics.orderCount.toLocaleString()} orders ·{" "}
            {money(economics.sales)} sales
          </p>
        </div>
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
          <p className="mcfly-order-econ__label">Returning customer sales</p>
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
        {economics.spendPerOrder != null ? (
          <div className="mcfly-order-econ__tile">
            <p className="mcfly-order-econ__label">Ad spend per order</p>
            <p className="mcfly-order-econ__value">
              {moneyExact(economics.spendPerOrder)}
            </p>
            <p className="mcfly-order-econ__hint">
              Entered spend ÷ {economics.orderCount.toLocaleString()} orders
            </p>
          </div>
        ) : null}
      </div>

      {showSpendUnlock ? (
        <div className="mcfly-order-econ__unlock">
          <p className="mcfly-order-econ__unlock-copy">
            Optional next: add ad spend to pair ROAS and cash CAC with these
            order insights.
          </p>
          <div className="mcfly-order-econ__unlock-actions">
            <s-button href="/app/spend#mcfly-spend-bill" variant="secondary">
              Add spend
            </s-button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
