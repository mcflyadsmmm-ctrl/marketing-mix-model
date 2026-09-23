import { useDeskCurrency } from "../lib/desk-currency";
import { formatCurrency } from "../lib/mer-format";
import { PRODUCT_NOUN } from "../lib/product-labels";
import { OVERVIEW_FROM_ORDERS_LABEL } from "../lib/overview-order-book";
import { SAMPLE_ORDERS_DOOR } from "../lib/sample-live-handoff";
import {
  ORDERS_ANALYTICS_AVERAGE_LINE,
  ORDERS_PENDING_LINE,
  ORDERS_THIN_EMPTY_LINE,
  ORDERS_TODAY_TRUNCATED_LINE,
  buildOrdersLeadPeeks,
} from "../lib/orders-first-viewport";
import {
  buildOrdersHero,
  ordersHasShare,
  ordersPct,
} from "../lib/orders-scoreboard";
import { OrdersTicketBand } from "./OrdersVisuals";
import type { ShopifyDepthStats } from "../lib/shopify-depth-stats";
import type { OrdersPeriodTickets, OrdersStepBar } from "../lib/orders-intelligence";

/**
 * Orders first fold — one typical-order hero, quiet average compare, compact strip.
 * salesPending (SalesDayFact) must not blank OrderFact depth.
 */
export function OrdersFirstViewport({
  depth,
  salesPending,
  useSampleDesk = false,
  stepMix: _stepMix = null,
  tickets: _tickets = null,
  todaySalesTruncated = false,
  periodLabel = "This period",
}: {
  depth: ShopifyDepthStats;
  salesPending: boolean;
  useSampleDesk?: boolean;
  stepMix?: OrdersStepBar[] | null;
  tickets?: OrdersPeriodTickets | null;
  todaySalesTruncated?: boolean;
  periodLabel?: string;
}) {
  const currency = useDeskCurrency();
  const hero = buildOrdersHero(depth, currency, false);
  const typicalValue = hero.v === "—" ? null : hero.v;
  const averageLabel =
    depth.medianAov != null &&
    Number.isFinite(depth.medianAov) &&
    depth.meanAov != null &&
    Number.isFinite(depth.meanAov)
      ? formatCurrency(depth.meanAov, currency)
      : null;
  const peeks = buildOrdersLeadPeeks(depth, currency);
  const stripParts: string[] = [];
  for (const peek of peeks) {
    stripParts.push(`${peek.k.replace(/^Typical · /, "")} ${peek.v}`);
  }
  if (ordersHasShare(depth.discountedOrderShare)) {
    stripParts.push(`Discounted ${ordersPct(depth.discountedOrderShare)}`);
  }

  const pendingLine = salesPending ? ORDERS_PENDING_LINE : null;
  const truncatedLine = todaySalesTruncated ? ORDERS_TODAY_TRUNCATED_LINE : null;
  const empty = !useSampleDesk && !(depth.orderCount > 0);

  if (empty) {
    return (
      <section
        className="mcfly-overview-plane mcfly-orders-plane"
        aria-label={PRODUCT_NOUN.ordersTitle}
      >
        <p className="mcfly-overview-plane__pending">No orders in this window yet.</p>
        <p className="mcfly-overview-plane__note">{ORDERS_THIN_EMPTY_LINE}</p>
      </section>
    );
  }

  return (
    <section
      className="mcfly-overview-plane mcfly-orders-plane"
      aria-label={PRODUCT_NOUN.ordersTitle}
      data-sample={useSampleDesk ? "true" : undefined}
    >
      <div className="mcfly-overview-plane__hero mcfly-overview-plane__hero--even">
        <div className="mcfly-overview-plane__hero-top">
          <p className="mcfly-overview-plane__period">{periodLabel}</p>
          {averageLabel ? (
            <p className="mcfly-overview-plane__delta mcfly-overview-plane__delta--empty">
              Average {averageLabel}
            </p>
          ) : null}
        </div>
        <p className="mcfly-overview-plane__value">{typicalValue ?? "—"}</p>
        <p className="mcfly-overview-plane__meta">
          <span className="mcfly-overview-plane__source">{OVERVIEW_FROM_ORDERS_LABEL}</span>
          <span aria-hidden="true"> · </span>
          <span className="mcfly-overview-plane__prior">
            {hero.k}
            {depth.orderCount > 0
              ? ` · ${depth.orderCount.toLocaleString()} orders`
              : ""}
          </span>
        </p>
        <span className="mcfly-overview-plane__sr">{ORDERS_ANALYTICS_AVERAGE_LINE}</span>
        {useSampleDesk ? (
          <p className="mcfly-overview-plane__note">{SAMPLE_ORDERS_DOOR}</p>
        ) : null}
      </div>

      {pendingLine ? (
        <p className="mcfly-overview-plane__pending">{pendingLine}</p>
      ) : truncatedLine ? (
        <p className="mcfly-overview-plane__pending">{truncatedLine}</p>
      ) : null}

      {stripParts.length > 0 ? (
        <p className="mcfly-overview-plane__strip">
          {stripParts.map((part, index) => (
            <span key={part}>
              {index > 0 ? (
                <>
                  <span aria-hidden="true"> · </span>
                </>
              ) : null}
              <span>{part}</span>
            </span>
          ))}
        </p>
      ) : null}

      <OrdersTicketBand depth={depth} pending={false} />
    </section>
  );
}
