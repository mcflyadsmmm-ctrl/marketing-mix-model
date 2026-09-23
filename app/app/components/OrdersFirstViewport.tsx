import { DeskIcon } from "./DeskIcon";
import { useDeskCurrency } from "../lib/desk-currency";
import { formatCurrency } from "../lib/mer-format";
import { PRODUCT_NOUN } from "../lib/product-labels";
import { SAMPLE_ORDERS_DOOR } from "../lib/sample-live-handoff";
import {
  ORDERS_THIN_EMPTY_LINE,
  ordersOperatorGreeting,
} from "../lib/orders-first-viewport";
import { buildOrdersHero } from "../lib/orders-scoreboard";
import { OrdersTicketBand } from "./OrdersVisuals";
import type { ShopifyDepthStats } from "../lib/shopify-depth-stats";

/**
 * First-fold Orders — typical (median) hero, mean as a quiet foil.
 * Days to second and 2+ items may sit under the hero. Do not lead with a
 * scoreboard. salesPending (SalesDayFact) must not blank OrderFact depth.
 */
export function OrdersFirstViewport({
  depth,
  salesPending: _salesPending,
  useSampleDesk = false,
}: {
  depth: ShopifyDepthStats;
  salesPending: boolean;
  useSampleDesk?: boolean;
}) {
  const currency = useDeskCurrency();
  // Order book paints even when Analytics day facts are still landing.
  const hero = buildOrdersHero(depth, currency, false);
  const typicalLabel = hero.v === "—" ? null : hero.v;
  const averageLabel =
    depth.medianAov != null &&
    Number.isFinite(depth.medianAov) &&
    depth.meanAov != null &&
    Number.isFinite(depth.meanAov)
      ? formatCurrency(depth.meanAov, currency)
      : null;
  const greeting = ordersOperatorGreeting({
    salesPending: false,
    orderCount: depth.orderCount,
    typicalOrderLabel: typicalLabel,
    averageOrderLabel: averageLabel,
  });
  const trust = useSampleDesk ? SAMPLE_ORDERS_DOOR : null;

  if (!useSampleDesk && !(depth.orderCount > 0)) {
    return (
      <section
        className="mcfly-score mcfly-book mcfly-score--orders-hero"
        aria-label={PRODUCT_NOUN.ordersTitle}
      >
        <p className="mcfly-score__greeting">{greeting}</p>
        <p className="mcfly-state__copy">{ORDERS_THIN_EMPTY_LINE}</p>
      </section>
    );
  }

  return (
    <section
      className="mcfly-score mcfly-book mcfly-score--orders-hero"
      aria-label={PRODUCT_NOUN.ordersTitle}
    >
      <p className="mcfly-score__greeting">{greeting}</p>
      {trust ? <p className="mcfly-score__trust">{trust}</p> : null}

      <article className="mcfly-orders-hero">
        <p className="mcfly-orders-hero__k">
          <DeskIcon name="orders" />
          {hero.k}
        </p>
        <p className="mcfly-orders-hero__v">{hero.v}</p>
        {averageLabel ? (
          <p className="mcfly-orders-hero__sub">Average {averageLabel}</p>
        ) : hero.sub ? (
          <p className="mcfly-orders-hero__sub">{hero.sub}</p>
        ) : null}
        <p className="mcfly-orders-hero__def">{hero.def}</p>
        <OrdersTicketBand depth={depth} pending={false} />
      </article>
    </section>
  );
}
