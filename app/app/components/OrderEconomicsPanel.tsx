import type { OrderEconomics } from "../lib/order-economics";
import { summarizeOrderEconomics } from "../lib/order-economics";

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

type PriorPeriodBoard = {
  economics: OrderEconomics;
  label: string;
  href: string;
};

type Props = {
  economics: OrderEconomics;
  periodLabel: string;
  /** Cold desk only: quiet path to add spend after order insights. */
  showSpendUnlock: boolean;
  /** Suggested wider periods when this period has no orders. */
  emptyPeriodHrefs?: { label: string; href: string }[];
  /**
   * When the selected period is empty but a prior window has orders,
   * render that board inline so Overview is never a dead end.
   */
  priorPeriod?: PriorPeriodBoard | null;
};

function EconomicsGrid({
  economics,
  insight,
}: {
  economics: OrderEconomics;
  insight: string | null;
}) {
  return (
    <>
      <div className="mcfly-order-econ__grid mcfly-order-econ__grid--rich">
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
          <p className="mcfly-order-econ__label">Weekend share</p>
          <p className="mcfly-order-econ__value">
            {economics.weekendShare != null
              ? pct(economics.weekendShare)
              : "—"}
          </p>
          <p className="mcfly-order-econ__hint">
            {money(economics.weekendSales)} Sat–Sun ·{" "}
            {money(economics.weekdaySales)} weekdays
          </p>
        </div>
        <div className="mcfly-order-econ__tile">
          <p className="mcfly-order-econ__label">Returning sales</p>
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
            <p className="mcfly-order-econ__label">Spend per order</p>
            <p className="mcfly-order-econ__value">
              {moneyExact(economics.spendPerOrder)}
            </p>
            <p className="mcfly-order-econ__hint">
              Ad spend ÷ orders — join Shopify cannot do alone
            </p>
          </div>
        ) : null}
      </div>
      {insight ? (
        <p className="mcfly-order-econ__insight">{insight}</p>
      ) : null}
    </>
  );
}

/**
 * Order grain Shopify Analytics will not put on one screen.
 * AOV + weekend mix + returning share + spend/order when logged.
 * Empty periods inline the prior window so the desk never dead-ends.
 */
export function OrderEconomicsPanel({
  economics,
  periodLabel,
  showSpendUnlock,
  emptyPeriodHrefs = [],
  priorPeriod = null,
}: Props) {
  if (!economics.hasSignal) {
    const prior = priorPeriod?.economics.hasSignal ? priorPeriod : null;
    const priorInsight = prior
      ? summarizeOrderEconomics(prior.economics)
      : null;

    return (
      <section
        className="mcfly-order-econ mcfly-order-econ--empty-with-prior"
        aria-label="Order insights"
      >
        <div className="mcfly-order-econ__head">
          <div className="mcfly-order-econ__headline">
            <p className="mcfly-order-econ__kicker">Orders · {periodLabel}</p>
            <h2 className="mcfly-order-econ__title">
              No orders in this period
            </h2>
          </div>
        </div>

        {prior ? (
          <>
            <p className="mcfly-order-econ__lede">
              This window is quiet — here’s{" "}
              <strong>{prior.label}</strong>, which already has order depth
              Shopify Analytics won’t put on one screen.
            </p>
            <div
              className="mcfly-order-econ__prior"
              aria-label={`Order insights for ${prior.label}`}
            >
              <div className="mcfly-order-econ__prior-head">
                <p className="mcfly-order-econ__kicker">
                  Useful now · {prior.label}
                </p>
                <p className="mcfly-order-econ__prior-title">
                  {prior.economics.aov != null
                    ? `AOV ${moneyExact(prior.economics.aov)}`
                    : `${prior.economics.orderCount.toLocaleString()} orders`}
                </p>
                <p className="mcfly-order-econ__facts">
                  {prior.economics.orderCount.toLocaleString()} orders ·{" "}
                  {money(prior.economics.sales)} sales
                </p>
              </div>
              <EconomicsGrid
                economics={prior.economics}
                insight={priorInsight}
              />
              <p className="mcfly-order-econ__empty-actions">
                <s-link href={prior.href}>Open {prior.label}</s-link>
                {" · "}
                <s-link href="/app/ltv">Customers &amp; LTV</s-link>
                {emptyPeriodHrefs
                  .filter((l) => l.href !== prior.href)
                  .map((link) => (
                    <span key={link.href}>
                      {" · "}
                      <s-link href={link.href}>{link.label}</s-link>
                    </span>
                  ))}
              </p>
            </div>
          </>
        ) : (
          <>
            <p className="mcfly-order-econ__lede">
              Switch period to see AOV, weekend mix, and returning share — or
              wait for the next paid order this month.
            </p>
            {emptyPeriodHrefs.length > 0 ? (
              <p className="mcfly-order-econ__empty-actions">
                Try{" "}
                {emptyPeriodHrefs.map((link, i) => (
                  <span key={link.href}>
                    {i > 0 ? " · " : null}
                    <s-link href={link.href}>{link.label}</s-link>
                  </span>
                ))}
                {" · "}
                <s-link href="/app/ltv">Customers &amp; LTV</s-link>
              </p>
            ) : (
              <p className="mcfly-order-econ__empty-actions">
                <s-link href="/app/ltv">Customers &amp; LTV</s-link>
              </p>
            )}
          </>
        )}
      </section>
    );
  }

  const insight = summarizeOrderEconomics(economics);
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

      <EconomicsGrid economics={economics} insight={insight} />

      {showSpendUnlock ? (
        <div className="mcfly-order-econ__unlock">
          <p className="mcfly-order-econ__unlock-copy">
            Add spend when you want ROAS next to these order numbers.
          </p>
          <div className="mcfly-order-econ__unlock-actions">
            <s-button href="/app/spend#mcfly-spend-bill" variant="secondary">
              Update spend
            </s-button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
