import { DeskIcon } from "./DeskIcon";
import { useDeskCurrency } from "../lib/desk-currency";
import {
  buildOrdersIntelKpis,
  type OrdersIntelData,
} from "../lib/orders-intelligence";
import { ORDERS_PRIOR_MISSING_LINE, ORDERS_PRIOR_SECTION_LABEL } from "../lib/orders-first-viewport";

function deltaCopy(dir: "up" | "down" | "flat", pct: number): string {
  if (dir === "flat") return "Even vs prior";
  const sign = dir === "up" ? "+" : "−";
  return `${sign}${Math.abs(Math.round(pct * 10) / 10)}% vs prior`;
}

/**
 * Compact vs-prior strip — orders, sales, mean AOV. No essay; numbers only.
 */
export function OrdersCompareGlance({
  intel,
  salesPending,
}: {
  intel: OrdersIntelData | null;
  salesPending: boolean;
}) {
  const currency = useDeskCurrency();
  if (salesPending) {
    return (
      <section
        className="mcfly-desk-anchor mcfly-yoy mcfly-yoy--glance mcfly-yoy--plane mcfly-yoy--metrics mcfly-orders-compare"
        aria-label={ORDERS_PRIOR_SECTION_LABEL}
      >
        <h3 className="mcfly-yoy__h">{ORDERS_PRIOR_SECTION_LABEL}</h3>
        <span className="mcfly-yoy__sr">Sales for closed days are still loading — not $0.</span>
        <p className="mcfly-yoy__note mcfly-yoy__note--quiet">—</p>
      </section>
    );
  }
  if (!intel?.prior) {
    return (
      <section
        className="mcfly-desk-anchor mcfly-yoy mcfly-yoy--glance mcfly-yoy--plane mcfly-yoy--metrics mcfly-orders-compare"
        aria-label={ORDERS_PRIOR_SECTION_LABEL}
      >
        <h3 className="mcfly-yoy__h">{ORDERS_PRIOR_SECTION_LABEL}</h3>
        <p className="mcfly-yoy__note mcfly-yoy__note--quiet">{ORDERS_PRIOR_MISSING_LINE}</p>
      </section>
    );
  }
  const kpis = buildOrdersIntelKpis(intel.current, intel.prior, currency).slice(0, 3);
  return (
    <section
      className="mcfly-desk-anchor mcfly-yoy mcfly-yoy--glance mcfly-yoy--plane mcfly-yoy--metrics mcfly-orders-compare"
      aria-label={ORDERS_PRIOR_SECTION_LABEL}
    >
      <h3 className="mcfly-yoy__h">{ORDERS_PRIOR_SECTION_LABEL}</h3>
      <div className="mcfly-yoy__grid mcfly-yoy__grid--metrics">
        {kpis.map((kpi) => (
          <article
            className="mcfly-yoy__card mcfly-yoy__card--plane"
            key={kpi.key}
          >
            <p className="mcfly-yoy__k">
              <DeskIcon name="orders" />
              {kpi.label}
            </p>
            <p className="mcfly-yoy__v">{kpi.value}</p>
            {kpi.delta ? (
              <p className={`mcfly-yoy__vs mcfly-yoy__vs--${kpi.delta.dir}`}>
                {deltaCopy(kpi.delta.dir, kpi.delta.pct)}
              </p>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  );
}
