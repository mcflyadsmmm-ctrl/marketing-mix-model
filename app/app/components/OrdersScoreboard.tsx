import type { ReactNode } from "react";
import { DeskIcon, type DeskIconName } from "./DeskIcon";
import { useDeskDrill } from "./DeskDrill";
import { useDeskCurrency } from "../lib/desk-currency";
import { PRODUCT_NOUN } from "../lib/product-labels";
import { SAMPLE_ORDERS_DOOR } from "../lib/sample-live-handoff";
import {
  buildOrdersClock,
  buildOrdersDepthFacts,
  buildOrdersTimingFacts,
  type OrdersFact,
  type OrdersSalesClocks,
} from "../lib/orders-scoreboard";
import {
  OrdersClockBar,
  OrdersShapeBars,
  OrdersSourceBar,
} from "./OrdersVisuals";
import { DeskLane } from "./DeskLane";
import type { ShopifyDepthStats } from "../lib/shopify-depth-stats";
import type { ShopifyNativePeriodStats } from "../lib/shopify-native-stats";

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

function FactGrid({
  facts,
  className,
  pending,
}: {
  facts: OrdersFact[];
  className: string;
  pending: boolean;
}) {
  return (
    <div className={`mcfly-kpi-grid mcfly-kpi-grid--peeks mcfly-kpi-grid--soft ${className}`}>
      {facts.map((row) => (
        <PeekCard
          key={row.k}
          icon={row.icon}
          label={row.k}
          value={pending ? "—" : row.v}
          sub={pending ? undefined : row.s}
          detail={row.d}
          extra={
            !pending && row.x?.length
              ? row.x.map((line) => (
                  <span className="mcfly-kpi__sub" key={line}>
                    {line}
                  </span>
                ))
              : null
          }
        />
      ))}
    </div>
  );
}

/**
 * Orders scoreboard — sales clock, ticket/basket depth, then when/where.
 * Typical-order first fold lives on OrdersFirstViewport. Zero spend.
 */
export function OrdersScoreboard({
  book,
  depth,
  clocks,
  salesPending,
  useSampleDesk = false,
}: {
  book: ShopifyNativePeriodStats;
  depth: ShopifyDepthStats;
  clocks: OrdersSalesClocks;
  salesPending: boolean;
  useSampleDesk?: boolean;
}) {
  const currency = useDeskCurrency();
  const clock = buildOrdersClock(clocks, currency, useSampleDesk);
  const depthFacts = buildOrdersDepthFacts(book, depth, currency);
  const timingFacts = buildOrdersTimingFacts(depth, currency);
  const kicker = salesPending
    ? "Sales for closed days are still loading — not $0."
    : useSampleDesk
      ? SAMPLE_ORDERS_DOOR
      : `${depth.orderCount.toLocaleString()} paid orders · Typical order is the median — Shopify Analytics uses the average.`;

  if (salesPending || (!useSampleDesk && !(depth.orderCount > 0))) {
    return (
      <section
        className="mcfly-score mcfly-book mcfly-score--orders-hero mcfly-score--soft"
        aria-label={PRODUCT_NOUN.ordersTitle}
      >
        <p className="mcfly-scoreboard__kicker">{kicker}</p>
      </section>
    );
  }

  return (
    <>
      <section
        className="mcfly-score mcfly-book mcfly-score--orders-hero mcfly-score--soft"
        aria-label={PRODUCT_NOUN.ordersTitle}
      >
        <p
          className={
            useSampleDesk
              ? "mcfly-scoreboard__kicker mcfly-scoreboard__kicker--sr"
              : "mcfly-scoreboard__kicker"
          }
        >
          {kicker}
        </p>
        <OrdersShapeBars depth={depth} pending={salesPending} />
        <OrdersClockBar clocks={clocks} pending={salesPending} />
        {clock.length > 0 ? (
          <div className="mcfly-book__clock" aria-label={PRODUCT_NOUN.bookSalesClock}>
            {clock.map((item) => (
              <div className="mcfly-book__clock-item" key={item.k}>
                <p className="mcfly-book__clock-k">{item.k}</p>
                <p className="mcfly-book__clock-v">{item.v}</p>
              </div>
            ))}
          </div>
        ) : null}
      </section>

      <DeskLane rank="more" label="Ticket, basket, returns">
        <section
          className="mcfly-score mcfly-book mcfly-score--orders-depth mcfly-score--soft"
          aria-label="Order depth"
        >
          <p className="mcfly-scoreboard__kicker">Ticket · basket · returns</p>
          <FactGrid
            facts={depthFacts}
            className="mcfly-kpi-grid--orders-depth"
            pending={salesPending}
          />
        </section>
      </DeskLane>

      <DeskLane rank="more" label="When and where">
        <section
          className="mcfly-score mcfly-book mcfly-score--orders-timing mcfly-score--soft"
          aria-label="When and where orders land"
        >
          <p className="mcfly-scoreboard__kicker">
            Weekend, hour, and Online vs POS — shop-local, not ads
          </p>
          <OrdersSourceBar depth={depth} pending={salesPending} />
          <FactGrid
            facts={timingFacts}
            className="mcfly-kpi-grid--orders-timing"
            pending={salesPending}
          />
        </section>
      </DeskLane>
    </>
  );
}
