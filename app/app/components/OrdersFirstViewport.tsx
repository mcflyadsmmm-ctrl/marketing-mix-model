import type { ReactNode } from "react";
import { DeskIcon, type DeskIconName } from "./DeskIcon";
import { useDeskDrill } from "./DeskDrill";
import { useDeskCurrency } from "../lib/desk-currency";
import { formatCurrency } from "../lib/mer-format";
import { PRODUCT_NOUN } from "../lib/product-labels";
import { SAMPLE_ORDERS_DOOR } from "../lib/sample-live-handoff";
import {
  ORDERS_PENDING_LINE,
  ORDERS_THIN_EMPTY_LINE,
  buildOrdersLeadPeeks,
  ordersOperatorGreeting,
} from "../lib/orders-first-viewport";
import { buildOrdersHero } from "../lib/orders-scoreboard";
import { OrdersTicketBand } from "./OrdersVisuals";
import type { ShopifyDepthStats } from "../lib/shopify-depth-stats";

function PeekCard({
  label,
  value,
  sub,
  detail,
  extra,
  icon,
}: {
  label: string;
  value: string;
  sub?: string;
  detail?: string;
  extra?: ReactNode;
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
          blocks: [
            detail ? { k: "What this is", v: detail } : null,
            sub ? { k: "Also", v: sub } : null,
          ].filter((block): block is { k: string; v: string } => block != null),
          next: "This number is from Shopify orders in this window — not a platform pixel.",
        })
      }
    >
      <span className="mcfly-kpi__top">
        <DeskIcon name={icon} />
        <span className="mcfly-kpi__label">{label}</span>
      </span>
      <span className="mcfly-kpi__value">{value}</span>
      {sub ? <span className="mcfly-kpi__sub">{sub}</span> : null}
      {extra}
    </button>
  );
}

/**
 * First-fold Orders — typical (median) vs Shopify’s average, then discount
 * and basket peeks Analytics does not put next to Average Order.
 * SAMPLE Snowdevil is the craft canvas. Spend stays off Orders.
 */
export function OrdersFirstViewport({
  depth,
  salesPending,
  useSampleDesk = false,
}: {
  depth: ShopifyDepthStats;
  salesPending: boolean;
  useSampleDesk?: boolean;
}) {
  const currency = useDeskCurrency();
  const hero = buildOrdersHero(depth, currency, salesPending);
  const typicalLabel =
    salesPending || hero.v === "—" ? null : hero.v;
  const averageLabel =
    !salesPending &&
    depth.medianAov != null &&
    Number.isFinite(depth.medianAov) &&
    depth.meanAov != null &&
    Number.isFinite(depth.meanAov)
      ? formatCurrency(depth.meanAov, currency)
      : null;
  const greeting = ordersOperatorGreeting({
    salesPending,
    orderCount: depth.orderCount,
    typicalOrderLabel: typicalLabel,
    averageOrderLabel: averageLabel,
  });
  const peeks = salesPending ? [] : buildOrdersLeadPeeks(depth, currency);
  const trust = useSampleDesk && !salesPending ? SAMPLE_ORDERS_DOOR : null;

  if (salesPending) {
    return (
      <section
        className="mcfly-score mcfly-book mcfly-score--orders-hero mcfly-score--soft"
        aria-label={PRODUCT_NOUN.ordersTitle}
      >
        <p className="mcfly-score__greeting">{ORDERS_PENDING_LINE}</p>
        <p className="mcfly-state__copy">
          Typical order, discounts, and 2+ item orders fill as closed days land —
          not $0.
        </p>
      </section>
    );
  }

  if (!useSampleDesk && !(depth.orderCount > 0)) {
    return (
      <section
        className="mcfly-score mcfly-book mcfly-score--orders-hero mcfly-score--soft"
        aria-label={PRODUCT_NOUN.ordersTitle}
      >
        <p className="mcfly-score__greeting">{greeting}</p>
        <p className="mcfly-state__copy">{ORDERS_THIN_EMPTY_LINE}</p>
      </section>
    );
  }

  return (
    <section
      className="mcfly-score mcfly-book mcfly-score--orders-hero mcfly-score--soft"
      aria-label={PRODUCT_NOUN.ordersTitle}
    >
      <p className="mcfly-score__greeting">{greeting}</p>
      {trust ? <p className="mcfly-score__trust">{trust}</p> : null}

      <article className="mcfly-orders-hero mcfly-orders-hero--soft">
        <p className="mcfly-orders-hero__k">
          <DeskIcon name="orders" />
          {hero.k}
        </p>
        <p className="mcfly-orders-hero__v">{hero.v}</p>
        {hero.sub ? <p className="mcfly-orders-hero__sub">{hero.sub}</p> : null}
        <p className="mcfly-orders-hero__def">{hero.def}</p>
        <OrdersTicketBand depth={depth} pending={salesPending} />
      </article>

      {peeks.length > 0 ? (
        <div className="mcfly-kpi-grid mcfly-kpi-grid--peeks mcfly-kpi-grid--peeks-lead mcfly-kpi-grid--soft">
          {peeks.map((row) => (
            <PeekCard
              key={row.k}
              icon={row.icon}
              label={row.k}
              value={row.v}
              sub={row.s}
              detail={row.d}
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}
