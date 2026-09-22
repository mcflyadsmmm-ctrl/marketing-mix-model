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
  ORDERS_TODAY_TRUNCATED_LINE,
  buildOrdersLeadPeeks,
  buildOrdersTicketPeeks,
  ordersOperatorGreeting,
} from "../lib/orders-first-viewport";
import {
  ORDERS_TICKET_BASIS,
  ordersPaintStepSales,
  type OrdersPeriodTickets,
  type OrdersStepBar,
} from "../lib/orders-intelligence";
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
  stepMix,
  tickets,
  todaySalesTruncated,
}: {
  depth: ShopifyDepthStats;
  salesPending: boolean;
  useSampleDesk?: boolean;
  stepMix: OrdersStepBar[] | null;
  tickets: OrdersPeriodTickets | null;
  todaySalesTruncated: boolean;
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
    todaySalesTruncated,
  });
  const peeks = salesPending
    ? []
    : [
        ...buildOrdersTicketPeeks(tickets, depth, currency),
        ...buildOrdersLeadPeeks(depth, currency),
      ];
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
        {todaySalesTruncated ? (
          <p className="mcfly-orders-hero__sub">{ORDERS_TODAY_TRUNCATED_LINE}</p>
        ) : hero.sub ? (
          <p className="mcfly-orders-hero__sub">{hero.sub}</p>
        ) : null}
        <p className="mcfly-orders-hero__def">{hero.def}</p>
        <OrdersTicketBand depth={depth} pending={salesPending} />
      </article>

      {stepMix && stepMix.length > 0 ? (
        <OrdersStepMixBars bars={stepMix} />
      ) : null}

      {peeks.length > 0 ? (
        <div className="mcfly-well mcfly-well--scoreboard mcfly-kpi-grid mcfly-kpi-grid--peeks mcfly-kpi-grid--peeks-lead mcfly-kpi-grid--soft">
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

function OrdersStepMixBars({ bars }: { bars: OrdersStepBar[] }) {
  const currency = useDeskCurrency();
  const drill = useDeskDrill();
  const sealed = bars.filter((bar) => bar.sealed && bar.sales != null && bar.sales > 0);
  const max = Math.max(...sealed.map((bar) => bar.sales ?? 0), 0.01);
  return (
    <div
      className="mcfly-orders-step"
      aria-label="This period’s sales by 1st, 2nd, 3rd, and 4th or later order"
    >
      <p className="mcfly-orders-step__cap">
        This period’s Shopify Total Sales by 1st / 2nd / 3rd / 4th+ — not how
        old the buyer is. {ORDERS_TICKET_BASIS}. Shipping + tax sits next to
        typical.
      </p>
      <div className="mcfly-orders-step__rows">
        {bars.map((bar) => {
          const painted = ordersPaintStepSales(bar, currency);
          const width =
            bar.sealed && bar.sales != null && bar.sales > 0
              ? (bar.sales / max) * 100
              : 0;
          const open = () =>
            drill?.openDrill({
              title: `${bar.label} order`,
              value: painted,
              kicker: "Order number this period",
              blocks: [
                {
                  k: "What this is",
                  v: "Shopify Total Sales on orders that were a 1st, 2nd, 3rd, or 4th-or-later for that identified buyer. Not how old the buyer is.",
                },
                {
                  k: "Floor",
                  v: bar.sealed
                    ? `${bar.buyers.toLocaleString()} identified buyers in this step.`
                    : "Needs 8 identified buyers in this step — not $0.",
                },
              ],
              next: "Guests stay out. Unknown lifetime is its own bar, never stuffed into 1st.",
            });
          return (
            <button
              type="button"
              className="mcfly-orders-step__row"
              key={bar.id}
              onClick={open}
            >
              <span className="mcfly-orders-step__k">{bar.label}</span>
              <span className="mcfly-orders-step__track" aria-hidden="true">
                <span
                  className="mcfly-orders-step__fill"
                  style={{ width: `${width}%` }}
                />
              </span>
              <span className="mcfly-orders-step__v">{painted}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
