import type { ReactNode } from "react";
import { DeskIcon, type DeskIconName } from "./DeskIcon";
import { useDeskDrill } from "./DeskDrill";
import { formatCurrency } from "../lib/mer-format";
import { useDeskCurrency } from "../lib/desk-currency";
import { PRODUCT_NOUN } from "../lib/product-labels";
import {
  growthSecondVsFirst,
  growthWholePct,
} from "../lib/growth-comeback";
import type { ShopifyNativePeriodStats } from "../lib/shopify-native-stats";
import type { ShopifyDepthStats } from "../lib/shopify-depth-stats";

function isNum(n: number | null | undefined): n is number {
  return n != null && Number.isFinite(n);
}

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
    <button
      type="button"
      className="mcfly-cust-tile mcfly-cust-tile--drill"
      onClick={open}
    >
      {body}
    </button>
  ) : (
    <div className="mcfly-cust-tile">{body}</div>
  );
}

function Gauge({
  share,
  value,
  caption,
}: {
  share: number | null;
  value: string;
  caption: string;
}) {
  const radius = 80;
  const circ = Math.PI * radius;
  const filled =
    share != null && Number.isFinite(share) ? Math.min(1, Math.max(0, share)) : 0;
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
 * Soft Growth board under the explorer — first-time dollars + come-back facts
 * as a Retain-depth card, not a ShopifyBookSection hero + fact-grid wall.
 */
export function GrowthScoreboard({
  book,
  depth,
  repeatRate,
  avgOrdersD90,
  salesPending,
  useSampleDesk,
  ltvHref = "/app/ltv",
}: {
  book: ShopifyNativePeriodStats;
  depth: ShopifyDepthStats;
  repeatRate: number | null;
  avgOrdersD90: number | null;
  salesPending: boolean;
  useSampleDesk: boolean;
  ltvHref?: string;
}) {
  const currency = useDeskCurrency();
  const firstTime =
    !salesPending && isNum(book.newSales) && book.newSales > 0
      ? formatCurrency(book.newSales, currency)
      : "—";
  const firstShare =
    !salesPending && isNum(book.newSalesShare) ? book.newSalesShare : null;
  const within30 = salesPending ? null : depth.secondOrderWithin30Share;
  const within30Value =
    !salesPending && isNum(within30) ? growthWholePct(within30) : "—";
  const days =
    !salesPending && isNum(depth.medianDaysToSecond)
      ? `${Math.round(depth.medianDaysToSecond)}d`
      : "—";
  const cmp = !salesPending ? growthSecondVsFirst(depth) : null;
  const secondVsFirst =
    cmp != null
      ? `${formatCurrency(cmp.second, currency)} vs ${formatCurrency(cmp.first, currency)}`
      : "—";
  const secondVsThird =
    !salesPending &&
    isNum(depth.secondOrderBuyerShare) &&
    isNum(depth.thirdPlusBuyerShare)
      ? `2nd ${growthWholePct(depth.secondOrderBuyerShare)} · 3rd+ ${growthWholePct(depth.thirdPlusBuyerShare)}`
      : "—";
  const repeat =
    !salesPending && isNum(repeatRate) ? growthWholePct(repeatRate) : "—";
  const orders90 =
    !salesPending && isNum(avgOrdersD90) && avgOrdersD90 > 0
      ? avgOrdersD90.toFixed(1)
      : "—";

  return (
    <section
      className="mcfly-panel mcfly-cust-card mcfly-growth-board mcfly-desk-anchor"
      aria-label="New dollars and who came back"
    >
      <div className="mcfly-panel__head">
        <h2>New dollars</h2>
        <p className="mcfly-panel__muted">
          First-time buyers · who came back
          {useSampleDesk ? " · Sample data" : ""}
        </p>
      </div>

      <div className="mcfly-cust-hero__grid">
        <Gauge
          share={within30}
          value={within30Value}
          caption={
            isNum(within30)
              ? "came back within 30 days"
              : "30-day come-back"
          }
        />

        <div className="mcfly-cust-hero__right">
          <p className="mcfly-growth-board__hero-k">Sales from first-time buyers</p>
          <p className="mcfly-growth-board__hero-v">{firstTime}</p>
          <p className="mcfly-growth-board__hero-sub">
            {isNum(firstShare)
              ? `${growthWholePct(firstShare)} of sales — dollars, not headcount`
              : book.newCustomers > 0
                ? `${book.newCustomers.toLocaleString()} new customers in this window`
                : "Needs identified first orders — not $0."}
          </p>

          <div className="mcfly-cust-tiles">
            <Tile
              label="Days to a second order"
              value={days}
              note={
                depth.repeatBuyers > 0
                  ? `${depth.repeatBuyers.toLocaleString()} buyers came back`
                  : "Needs a second order on file"
              }
              icon="clock"
              formula="Middle wait between a first and second order, from order history."
              next="The explorer above splits how far past a first order buyers went."
            />
            <Tile
              label={PRODUCT_NOUN.bookSecondVsFirst}
              value={secondVsFirst}
              note={
                cmp != null && cmp.direction !== "even"
                  ? `Typical second order is ${cmp.deltaPct > 0 ? "+" : ""}${cmp.deltaPct}%`
                  : PRODUCT_NOUN.bookSecondVsFirstEmpty
              }
              icon="orders"
              formula={PRODUCT_NOUN.bookSecondVsFirstDef}
              next="Open LTV for what each first order is worth in 30 / 90 / 365 days."
              nextHref={ltvHref}
              nextLabel={PRODUCT_NOUN.openLtv}
            />
            <Tile
              label={PRODUCT_NOUN.bookSecondVsThird}
              value={secondVsThird}
              note={PRODUCT_NOUN.bookSecondVsThirdDef}
              icon="customers"
              formula={PRODUCT_NOUN.bookSecondVsThirdDef}
              next="Comeback grain on the explorer is the same mix as bars."
            />
            <Tile
              label="Repeat rate"
              value={repeat}
              note={
                orders90 !== "—"
                  ? `${orders90} orders in the first 90 days · order history, not email`
                  : "Extra orders beyond the first in the first 90 days. Order history, not email."
              }
              icon="customers"
              formula="Extra orders beyond the first in the first 90 days. Order history, not an email list."
              next="Open LTV for first-90-day dollars per new buyer."
              nextHref={ltvHref}
              nextLabel={PRODUCT_NOUN.openLtv}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
