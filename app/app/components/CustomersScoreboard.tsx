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

/** One unique fact — not a six-tile wall. Interactive. */
function Fact({
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
      <span className="mcfly-cust-fact__k">
        <DeskIcon name={icon} />
        {label}
      </span>
      <span className="mcfly-cust-fact__v">{value}</span>
      {note ? <span className="mcfly-cust-fact__sub">{note}</span> : null}
    </>
  );
  return drill ? (
    <button type="button" className="mcfly-cust-fact mcfly-cust-fact--drill mcfly-cust-fact--soft" onClick={open}>
      {body}
    </button>
  ) : (
    <div className="mcfly-cust-fact mcfly-cust-fact--soft">{body}</div>
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
 * Compact returning-dollars hero. The marquee already owns new vs returning $
 * over time; What-to-do owns repurchase / win-back / save-now. This strip keeps
 * the period returning-$ number plus three facts the rest of the spine does not
 * repeat: guests, sales per buyer, biggest orders. Not a six-tile wall.
 */
export function CustomersScoreboard({
  book,
  depth,
  periodLabel,
  salesPending,
  useSampleDesk,
  growthHref = "#mcfly-growth",
  ltvHref = "#mcfly-ltv",
  ltvNextLabel = "Open LTV",
}: {
  book: ShopifyNativePeriodStats;
  depth: ShopifyDepthStats;
  periodLabel: string;
  salesPending: boolean;
  useSampleDesk: boolean;
  growthHref?: string;
  ltvHref?: string;
  ltvNextLabel?: string;
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

  const perBuyer = salesPending
    ? "—"
    : isNum(book.returningBuyerArpu)
      ? money(book.returningBuyerArpu)
      : money(book.newBuyerArpu);
  const guests =
    !salesPending && book.guestOrders > 0 && hasShare(book.guestShare) ? pct(book.guestShare) : "—";
  const biggest =
    !salesPending && hasShare(depth.topDecileSalesShare)
      ? pct(depth.topDecileSalesShare)
      : "—";
  const empty =
    salesPending || (returning == null && !hasShare(book.returningSalesShare));

  return (
    <section
      className={`mcfly-panel mcfly-cust-card mcfly-cust-card--soft mcfly-desk-anchor${empty ? " mcfly-cust-hero--empty" : ""}`}
      aria-label="Returning customers"
    >
      <div className="mcfly-panel__head">
        <h2>Returning customers</h2>
        <p className="mcfly-panel__muted">
          {periodLabel} · dollars, not headcount{useSampleDesk ? " · Sample data" : ""}
        </p>
      </div>

      <div className="mcfly-cust-hero__grid">
        <Gauge share={returningShare} value={returningValue} caption={caption} />

        <div className="mcfly-cust-facts">
          <Fact
            label={`Guests · ${periodLabel}`}
            value={guests}
            icon="customers"
            formula="Share of orders placed without a customer account in this window. Guests stay out of returning dollars."
            next="Growth covers who came back after a first order."
            nextHref={growthHref}
            nextLabel="Open Growth"
          />
          <Fact
            label={`Sales per buyer · ${periodLabel}`}
            value={perBuyer}
            note={periodLabel}
            icon="customers"
            formula="Window sales dollars per unique buyer — new and returning spend differently."
            next="LTV tracks what a new buyer is worth over 30 / 90 / 365 days."
            nextHref={ltvHref}
            nextLabel={ltvNextLabel}
          />
          <Fact
            label="Biggest orders"
            value={biggest}
            note="Largest 10% of orders"
            icon="orders"
            formula="Share of sales from the largest 10% of orders this window — order concentration, not the same as top customers."
            next="Value & frequency mix below shows who those dollars sit with."
          />
        </div>
      </div>

      {empty ? (
        <p className="mcfly-cust-empty__copy">
          {salesPending
            ? "Returning dollars are still loading — not $0."
            : "Returning dollars need identified buyers in this window — not $0."}
        </p>
      ) : null}
    </section>
  );
}
