import { useDeskCurrency } from "../lib/desk-currency";
import { useDeskDrill } from "./DeskDrill";
import {
  buildOrdersClockBar,
  buildOrdersSourceBar,
  buildOrdersTicketBand,
  ordersPct,
  type OrdersSalesClocks,
} from "../lib/orders-scoreboard";
import type { ShopifyDepthStats } from "../lib/shopify-depth-stats";

/**
 * Ticket distribution band — the median vs the average, drawn.
 * Shopify Analytics shows only the average; this box + ticks show where the
 * typical order sits against the middle half of orders. Order dollars only.
 */
export function OrdersTicketBand({
  depth,
  pending,
}: {
  depth: ShopifyDepthStats;
  pending: boolean;
}) {
  const currency = useDeskCurrency();
  const drill = useDeskDrill();
  if (pending) return null;
  const band = buildOrdersTicketBand(depth, currency);
  if (!band) return null;
  const median = band.marks.find((mark) => mark.key === "median");
  const mean = band.marks.find((mark) => mark.key === "mean");
  const open = () =>
    drill?.openDrill({
      title: "Where the typical order sits",
      value: median?.value ?? "—",
      kicker: "Ticket distribution",
      blocks: [
        {
          k: "Middle half",
          v: `${band.marks.find((m) => m.key === "p25")?.value ?? "—"} to ${band.marks.find((m) => m.key === "p75")?.value ?? "—"} — most orders land here.`,
        },
        median ? { k: "Typical (median)", v: median.value } : null,
        mean
          ? {
              k: "Average",
              v: `${mean.value} — Shopify Analytics uses the average, which a few big tickets pull up.`,
            }
          : null,
      ].filter((block): block is { k: string; v: string } => block != null),
      next: "The middle order is a truer typical than the average.",
    });
  return (
    <button type="button" className="mcfly-orders-band" onClick={open}>
      <span className="mcfly-orders-band__track" aria-hidden="true">
        <span
          className="mcfly-orders-band__box"
          style={{
            left: `${band.boxStart * 100}%`,
            width: `${Math.max(0, band.boxEnd - band.boxStart) * 100}%`,
          }}
        />
        {band.medianPos != null ? (
          <span
            className="mcfly-orders-band__median"
            style={{ left: `${band.medianPos * 100}%` }}
          />
        ) : null}
        {band.meanPos != null ? (
          <span
            className="mcfly-orders-band__mean"
            style={{ left: `${band.meanPos * 100}%` }}
          />
        ) : null}
      </span>
      <span className="mcfly-orders-band__legend">
        {median ? (
          <span className="mcfly-orders-band__tag mcfly-orders-band__tag--median">
            <span className="mcfly-orders-band__tag-k">Typical</span>
            <span className="mcfly-orders-band__tag-v">{median.value}</span>
          </span>
        ) : null}
        {mean ? (
          <span className="mcfly-orders-band__tag mcfly-orders-band__tag--mean">
            <span className="mcfly-orders-band__tag-k">Average</span>
            <span className="mcfly-orders-band__tag-v">{mean.value}</span>
          </span>
        ) : null}
        <span className="mcfly-orders-band__tag mcfly-orders-band__tag--box">
          <span className="mcfly-orders-band__tag-k">Most orders</span>
          <span className="mcfly-orders-band__tag-v">
            {band.marks.find((m) => m.key === "p25")?.value}–
            {band.marks.find((m) => m.key === "p75")?.value}
          </span>
        </span>
      </span>
    </button>
  );
}

/**
 * The original checkout dollar as a stacked bar: product · shipping+tax ·
 * returns/edits. Shopify lists these as separate reports, not one picture.
 */
export function OrdersClockBar({
  clocks,
  pending,
}: {
  clocks: OrdersSalesClocks;
  pending: boolean;
}) {
  const currency = useDeskCurrency();
  const drill = useDeskDrill();
  if (pending) return null;
  const segments = buildOrdersClockBar(clocks, currency);
  if (!segments) return null;
  const open = () =>
    drill?.openDrill({
      title: "Where the checkout dollar goes",
      value: segments[0]?.value ?? "—",
      kicker: "Original checkout total",
      blocks: segments.map((segment) => ({
        k: `${segment.label} · ${ordersPct(segment.share)}`,
        v: segment.value,
      })),
      next: "Product only is what stands after returns, shipping, and tax.",
    });
  return (
    <button type="button" className="mcfly-orders-clockbar" onClick={open}>
      <span className="mcfly-orders-clockbar__track" aria-hidden="true">
        {segments.map((segment) => (
          <span
            key={segment.key}
            className={`mcfly-orders-clockbar__seg mcfly-orders-clockbar__seg--${segment.key}`}
            style={{ width: `${segment.share * 100}%` }}
          />
        ))}
      </span>
      <span className="mcfly-orders-clockbar__legend">
        {segments.map((segment) => (
          <span
            key={segment.key}
            className={`mcfly-orders-clockbar__key mcfly-orders-clockbar__key--${segment.key}`}
          >
            <span className="mcfly-orders-clockbar__dot" aria-hidden="true" />
            {segment.label} {ordersPct(segment.share)}
          </span>
        ))}
      </span>
    </button>
  );
}

/**
 * Online / POS / Shop stacked sales mix. Where the order was placed —
 * not which ad sent them. Typical $ per source lives in the drill.
 */
export function OrdersSourceBar({
  depth,
  pending,
}: {
  depth: ShopifyDepthStats;
  pending: boolean;
}) {
  const currency = useDeskCurrency();
  const drill = useDeskDrill();
  if (pending) return null;
  const segments = buildOrdersSourceBar(depth, currency);
  if (!segments) return null;
  const open = () =>
    drill?.openDrill({
      title: "Online vs POS vs Shop",
      value: segments[0] ? ordersPct(segments[0].share) : "—",
      kicker: "Where orders were placed",
      blocks: segments.map((segment) => ({
        k: `${segment.label} · ${ordersPct(segment.share)}`,
        v: segment.typical ? `Typical ${segment.typical}` : "Sales share",
      })),
      next: "Where the order was placed — not which ad sent them.",
    });
  return (
    <button type="button" className="mcfly-orders-sourcebar" onClick={open}>
      <span className="mcfly-orders-sourcebar__k">Online vs POS vs Shop</span>
      <span className="mcfly-orders-sourcebar__track" aria-hidden="true">
        {segments.map((segment) => (
          <span
            key={segment.key}
            className={`mcfly-orders-sourcebar__seg mcfly-orders-sourcebar__seg--${segment.key}`}
            style={{ width: `${segment.share * 100}%` }}
          />
        ))}
      </span>
      <span className="mcfly-orders-sourcebar__legend">
        {segments.map((segment) => (
          <span
            key={segment.key}
            className={`mcfly-orders-sourcebar__key mcfly-orders-sourcebar__key--${segment.key}`}
          >
            <span className="mcfly-orders-sourcebar__dot" aria-hidden="true" />
            {segment.label} {ordersPct(segment.share)}
            {segment.typical ? ` · ${segment.typical}` : ""}
          </span>
        ))}
      </span>
    </button>
  );
}
