import type { ReactNode } from "react";
import { DeskIcon, type DeskIconName } from "./DeskIcon";
import { useDeskDrill } from "./DeskDrill";
import { formatCurrency } from "../lib/mer-format";
import { useDeskCurrency } from "../lib/desk-currency";
import type { ShopifyNativePeriodStats } from "../lib/shopify-native-stats";
import type { ShopifyDepthStats } from "../lib/shopify-depth-stats";
import { wholePercent } from "../lib/customers-scoreboard";

function isNum(n: number | null | undefined): n is number {
  return n != null && Number.isFinite(n);
}
function hasShare(s: number | null | undefined): s is number {
  return isNum(s) && Math.round(s * 100) > 0;
}
function pct(s: number): string {
  return `${wholePercent(s)}%`;
}

/** Soft, light tile — sentence-case label, big value, quiet note. Interactive. */
function Tile({
  label,
  value,
  note,
  icon,
  formula,
  next,
  nextHref,
  nextLabel,
}: {
  label: string;
  value: string;
  note?: string;
  icon: DeskIconName;
  formula: string;
  next: string;
  nextHref?: string;
  nextLabel?: string;
}) {
  const drill = useDeskDrill();
  const open = () =>
    drill?.openDrill({
      title: label,
      value,
      blocks: [
        { k: "What this is", v: formula },
        note ? { k: "Also", v: note } : null,
      ].filter((b): b is { k: string; v: string } => b != null),
      next,
      nextHref,
      nextLabel,
      foot: "From this shop's Shopify orders — not a pixel, not an email list.",
    });
  const body: ReactNode = (
    <>
      <span className="mcfly-cust-tile__k">
        <DeskIcon name={icon} />
        {label}
      </span>
      <span className="mcfly-cust-tile__v">{value}</span>
      {note ? <span className="mcfly-cust-tile__sub">{note}</span> : null}
    </>
  );
  return drill ? (
    <button type="button" className="mcfly-cust-tile mcfly-cust-tile--drill" onClick={open}>
      {body}
    </button>
  ) : (
    <div className="mcfly-cust-tile">{body}</div>
  );
}

function Gauge({ share, value, caption }: { share: number | null; value: string; caption: string }) {
  const radius = 80;
  const circ = Math.PI * radius;
  const filled = share != null && Number.isFinite(share) ? Math.min(1, Math.max(0, share)) : 0;
  const offset = circ - filled * circ;
  return (
    <div className="mcfly-cust-gauge">
      <svg viewBox="0 0 240 130" width="200" height="108" aria-hidden="true">
        <path
          d="M 40 110 A 80 80 0 0 1 200 110"
          fill="none"
          stroke="#e2e8f0"
          strokeWidth="14"
          strokeLinecap="round"
        />
        <path
          d="M 40 110 A 80 80 0 0 1 200 110"
          fill="none"
          stroke="var(--mcfly-accent-ink, #0369a1)"
          strokeWidth="14"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
        />
      </svg>
      <p className="mcfly-cust-gauge__value">{value}</p>
      <p className="mcfly-cust-gauge__label">{caption}</p>
    </div>
  );
}

/**
 * Customers hero — the Monthly-pacing soft-card language on the returning-dollars
 * niche: a returning-share gauge with the returning-dollars hero number, a dense
 * light tile grid (new $, $/buyer, guests, one-order, top 10%, orders/buyer), and
 * mix bars. Period metrics. Zero spend / ROAS on this tab.
 */
export function CustomersScoreboard({
  book,
  depth,
  periodLabel,
  salesPending,
  useSampleDesk,
  growthHref = "/app/growth",
  ltvHref = "/app/ltv",
}: {
  book: ShopifyNativePeriodStats;
  depth: ShopifyDepthStats;
  periodLabel: string;
  salesPending: boolean;
  useSampleDesk: boolean;
  growthHref?: string;
  ltvHref?: string;
}) {
  const currency = useDeskCurrency();
  const returning = isNum(book.returningSales) && book.returningSales > 0 ? book.returningSales : null;
  const returningValue = salesPending || returning == null ? "—" : formatCurrency(returning, currency);
  const returningShare = salesPending ? null : book.returningSalesShare;
  const caption =
    !salesPending && hasShare(book.returningSalesShare)
      ? `${pct(book.returningSalesShare)} of sales`
      : "Returning dollars";

  const money = (n: number | null | undefined) => (isNum(n) ? formatCurrency(n, currency) : "—");

  const newDollars = salesPending ? "—" : money(book.newSales);
  const perBuyer = salesPending
    ? "—"
    : isNum(book.returningBuyerArpu)
      ? money(book.returningBuyerArpu)
      : money(book.newBuyerArpu);
  const perBuyerNote =
    !salesPending && isNum(book.newBuyerArpu) && isNum(book.returningBuyerArpu)
      ? `New ${money(book.newBuyerArpu)} · returning ${money(book.returningBuyerArpu)}`
      : undefined;
  const guests =
    !salesPending && book.guestOrders > 0 && hasShare(book.guestShare) ? pct(book.guestShare) : "—";
  const guestNote =
    !salesPending && isNum(depth.guestAov) && isNum(depth.identifiedAov)
      ? `Typical ${money(depth.guestAov)} vs ${money(depth.identifiedAov)} with an account`
      : undefined;
  const oneOrder = !salesPending && hasShare(depth.oneAndDoneShare) ? pct(depth.oneAndDoneShare) : "—";
  const top10 = !salesPending && hasShare(depth.topCustomerSalesShare) ? pct(depth.topCustomerSalesShare) : "—";
  const ordersPerBuyer = !salesPending && isNum(depth.ordersPerBuyer) ? depth.ordersPerBuyer.toFixed(1) : "—";

  const bars = [
    {
      k: "Returning dollars",
      share: returningShare,
      v: !salesPending && hasShare(book.returningSalesShare) ? pct(book.returningSalesShare) : "—",
      cls: "return" as const,
    },
    {
      k: "Repeat sales",
      share: salesPending ? null : depth.repeatSalesShare,
      v: !salesPending && hasShare(depth.repeatSalesShare) ? pct(depth.repeatSalesShare) : "—",
      cls: "repeat" as const,
    },
    {
      k: "Top 10% of customers",
      share: salesPending ? null : depth.topCustomerSalesShare,
      v: top10,
      cls: "top" as const,
    },
  ];

  return (
    <section className="mcfly-panel mcfly-cust-card mcfly-desk-anchor" aria-label="Returning customers">
      <div className="mcfly-panel__head">
        <h2>Returning customers</h2>
        <p className="mcfly-panel__muted">
          {periodLabel} · dollars, not headcount{useSampleDesk ? " · Sample data" : ""}
        </p>
      </div>

      <div className="mcfly-cust-hero__grid">
        <Gauge share={returningShare} value={returningValue} caption={caption} />

        <div className="mcfly-cust-hero__right">
          <div className="mcfly-cust-tiles">
            <Tile
              label="New dollars"
              value={newDollars}
              note="First-time buyers"
              icon="customers"
              formula="Sales from buyers on their first order this window. The hero is the returning half."
              next="Growth covers who came back after a first order."
              nextHref={growthHref}
              nextLabel="Open Growth"
            />
            <Tile
              label="Sales per buyer"
              value={perBuyer}
              note={perBuyerNote}
              icon="customers"
              formula="Window sales dollars per unique buyer — new and returning spend differently."
              next="LTV tracks what a new buyer is worth over 30 / 90 / 365 days."
              nextHref={ltvHref}
              nextLabel="Open LTV"
            />
            <Tile
              label="Guests"
              value={guests}
              note={guestNote}
              icon="customers"
              formula="Share of orders placed without a customer account — guests can never count as returning."
              next="Growth covers who came back after a first order."
              nextHref={growthHref}
              nextLabel="Open Growth"
            />
            <Tile
              label="One-order buyers"
              value={oneOrder}
              note="Bought once this window"
              icon="customers"
              formula="Identified buyers with exactly one order. The gap to returning dollars is your repeat opportunity."
              next="See When they come back below for the win-back timing."
            />
            <Tile
              label="Top 10% of customers"
              value={top10}
              note="of sales"
              icon="customers"
              formula="Share of sales from the highest-spending 10% of identified buyers. A few accounts can carry the shop."
              next="LTV shows what those top buyers are worth over time."
              nextHref={ltvHref}
              nextLabel="Open LTV"
            />
            <Tile
              label="Orders per buyer"
              value={ordersPerBuyer}
              note={depth.identifiedBuyers > 0 ? `${depth.identifiedBuyers.toLocaleString()} identified buyers` : undefined}
              icon="orders"
              formula="Identified orders divided by identified buyers this window. Guests are excluded."
              next="Order frequency below breaks this into 1 / 2 / 3+ orders."
            />
          </div>

          <div className="mcfly-cust-bars" aria-label="Dollar mix">
            {bars.map((bar) => (
              <div className="mcfly-cust-bar-row" key={bar.k}>
                <span className="mcfly-cust-bar-row__k">{bar.k}</span>
                <span className="mcfly-cust-track" aria-hidden="true">
                  <span
                    className={`mcfly-cust-fill mcfly-cust-fill--${bar.cls}`}
                    style={{
                      width: `${hasShare(bar.share) ? Math.min(100, wholePercent(bar.share)) : 0}%`,
                    }}
                  />
                </span>
                <span className="mcfly-cust-bar-row__v">{bar.v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
