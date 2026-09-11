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
  /** Cold desk only: quiet path to add spend after order insights. */
  showSpendUnlock: boolean;
};

/**
 * Order grain Shopify Analytics will not put on one screen.
 * Leads with AOV + weekend mix — returning split lives on AcquisitionGlance.
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
        aria-label="Order insights"
      >
        <div className="mcfly-order-econ__head">
          <div className="mcfly-order-econ__headline">
            <p className="mcfly-order-econ__kicker">Orders · {periodLabel}</p>
            <h2 className="mcfly-order-econ__title">Waiting on the first orders</h2>
          </div>
        </div>
      </section>
    );
  }

  const title =
    economics.aov != null
      ? `AOV ${moneyExact(economics.aov)}`
      : `${economics.orderCount.toLocaleString()} orders`;

  return (
    <section
      className="mcfly-order-econ"
      aria-label="Order insights"
    >
      <div className="mcfly-order-econ__head">
        <div className="mcfly-order-econ__headline">
          <p className="mcfly-order-econ__kicker">Orders · {periodLabel}</p>
          <h2 className="mcfly-order-econ__title">{title}</h2>
        </div>
        <p className="mcfly-order-econ__facts">
          {economics.orderCount.toLocaleString()} orders · {money(economics.sales)}{" "}
          sales
        </p>
      </div>

      <div className="mcfly-order-econ__grid">
        <div className="mcfly-order-econ__tile mcfly-order-econ__tile--accent">
          <p className="mcfly-order-econ__label">Avg order value</p>
          <p className="mcfly-order-econ__value">
            {economics.aov != null ? moneyExact(economics.aov) : "—"}
          </p>
          <p className="mcfly-order-econ__hint">
            {economics.orderCount.toLocaleString()} orders this period
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
      </div>

      {showSpendUnlock ? (
        <div className="mcfly-order-econ__unlock">
          <p className="mcfly-order-econ__unlock-copy">
            Add spend when you want ROAS next to these order numbers.
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
