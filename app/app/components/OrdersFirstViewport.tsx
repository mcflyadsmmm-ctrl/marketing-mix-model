import type { ReactNode } from "react";
import { DeskIcon, type DeskIconName } from "./DeskIcon";
import { useDeskDrill } from "./DeskDrill";
import { useDeskCurrency } from "../lib/desk-currency";
import { formatCurrency } from "../lib/mer-format";
import { PRODUCT_NOUN } from "../lib/product-labels";
import { SAMPLE_ORDERS_DOOR } from "../lib/sample-live-handoff";
import {
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
      className="mcfly-kpi mcfly-kpi--drill mcfly-kpi--peek"
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
  const peeks = buildOrdersLeadPeeks(depth, currency);
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

      {peeks.length > 0 ? (
        <div className="mcfly-orders-under">
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
