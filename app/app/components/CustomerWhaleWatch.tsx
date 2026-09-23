import { DeskIcon } from "./DeskIcon";
import { useDeskDrill } from "./DeskDrill";
import { useDeskCurrency } from "../lib/desk-currency";
import { formatCurrency } from "../lib/mer-format";
import {
  RFM_FROM_SHOPIFY_ORDERS,
  whaleWatchRemainderLine,
  type CustomerRfmView,
  type RfmEmpty,
  type WhaleWatchRow,
} from "../lib/customers-rfm";
import { WHALE_MIN_ORDERS } from "../lib/customers-analytics";

function emptyValue(empty: RfmEmpty): string {
  switch (empty.kind) {
    case "syncing":
      return "Waiting on orders";
    case "thin":
    case "young":
      return `${empty.buyers.toLocaleString()} on file`;
    default: {
      const _exhaustive: never = empty.kind;
      return _exhaustive;
    }
  }
}

function repeatLabel(row: WhaleWatchRow, currency: string): string {
  if (row.repeatRevenue == null) return "—";
  return formatCurrency(row.repeatRevenue, currency);
}

function moneyOrDash(n: number | null, currency: string): string {
  if (n == null) return "—";
  return formatCurrency(n, currency);
}

function ticketLine(row: WhaleWatchRow, currency: string): string {
  return `Typical ${moneyOrDash(row.typicalTicket, currency)} · first ${moneyOrDash(row.firstTicket, currency)} · later ${moneyOrDash(row.laterTicket, currency)}`;
}

function rowDetail(row: WhaleWatchRow, currency: string): string {
  const repeat =
    row.repeatRevenue == null
      ? "Repeat revenue is blank — no second order, not $0."
      : `Repeat revenue ${formatCurrency(row.repeatRevenue, currency)}.`;
  return `${formatCurrency(row.lifetime, currency)} order LTV · ${row.orders.toLocaleString()} orders · last seen ${row.daysSince}d. ${ticketLine(row, currency)}. ${repeat} ${row.detail}`;
}

/**
 * Whale watchlist — top identified buyers by Shopify order LTV, with repeat
 * revenue beside it. Thin books stay empty. No invented names. Soft table,
 * designed empty, never a blank chart.
 */
export function CustomerWhaleWatch({ rfm }: { rfm: CustomerRfmView }) {
  const currency = useDeskCurrency();
  const drill = useDeskDrill();
  const empty = rfm.empty ?? rfm.watchEmpty;

  if (empty || rfm.watchlist.length === 0) {
    const shown = empty ?? {
      kind: "thin" as const,
      buyers: rfm.identifiedBuyers,
      need: 8,
      copy: "No positive order LTV to rank — not $0. No customers invented.",
      verb: "Watch Shopify orders",
    };
    return (
      <section
        className="mcfly-panel mcfly-cust-card mcfly-cust-card--soft mcfly-cust-watch"
        aria-label="Whale watchlist"
      >
        <div className="mcfly-panel__head">
          <h2>Whale watchlist</h2>
          <p className="mcfly-panel__muted">{RFM_FROM_SHOPIFY_ORDERS}</p>
        </div>
        <button
          type="button"
          className="mcfly-cust-rfm__empty"
          data-kind={shown.kind}
          onClick={() =>
            drill?.openDrill({
              title: "Whale watchlist",
              value: emptyValue(shown),
              kicker: shown.verb,
              blocks: [
                { k: "What this is", v: shown.copy },
                {
                  k: "What fills next",
                  v: "Floor: 8 identified buyers × 30 days. Then the top order-LTV buyers from Shopify orders. Repeat revenue stays blank until a second order — not $0. No customers invented.",
                },
              ],
              next: "What to do (left) still times the one-order win-back.",
            })
          }
        >
          <span className="mcfly-cust-rfm__empty-k">First win</span>
          <span className="mcfly-cust-rfm__empty-verb">{shown.verb}</span>
          <span className="mcfly-cust-rfm__empty-v">{emptyValue(shown)}</span>
          <span className="mcfly-cust-rfm__empty-line">{shown.copy}</span>
          <span className="mcfly-cust-rfm__empty-line">
            Floor: 8 buyers × 30 days, then the slipping list — not $0.
          </span>
        </button>
        <div className="mcfly-cust-empty__ghost mcfly-cust-empty__ghost--table" aria-hidden="true">
          {[0.86, 0.62, 0.4, 0.22].map((w, i) => (
            <span key={i} className="mcfly-cust-empty__row">
              <span className="mcfly-cust-empty__row-bar" style={{ width: `${w * 100}%` }} />
            </span>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section
      className="mcfly-panel mcfly-cust-card mcfly-cust-card--soft mcfly-cust-watch mcfly-desk-anchor"
      aria-label="Whale watchlist"
    >
      <div className="mcfly-panel__head">
        <h2>Whale watchlist</h2>
        <p className="mcfly-panel__muted">
          {RFM_FROM_SHOPIFY_ORDERS}{" "}
          {whaleWatchRemainderLine({
            shown: rfm.watchlist.length,
            total: rfm.watchlistTotal,
            moreMinOrders: rfm.watchlistMoreMinOrders,
            minOrders: WHALE_MIN_ORDERS,
          }) ?? `${rfm.watchlist.length.toLocaleString()} by order LTV.`}
        </p>
      </div>

      <div className="mcfly-cust-watch__table" role="table" aria-label="Whale watchlist">
        <div className="mcfly-cust-watch__head" role="row">
          <span role="columnheader">Buyer</span>
          <span role="columnheader" className="mcfly-cust-table__num">
            Order LTV
          </span>
          <span role="columnheader" className="mcfly-cust-table__num">
            Repeat
          </span>
          <span role="columnheader" className="mcfly-cust-table__num">
            Last
          </span>
        </div>
        {rfm.watchlist.map((row) => (
          <button
            type="button"
            key={row.label}
            className="mcfly-cust-watch__row"
            role="row"
            onClick={() =>
              drill?.openDrill({
                title: row.label,
                value: formatCurrency(row.lifetime, currency),
                kicker: row.verb,
                blocks: [
                  { k: "What to do", v: rowDetail(row, currency) },
                  {
                    k: "RFM-lite",
                    v: `Recency ${row.recency} · frequency ${row.frequency} · monetary ${row.monetary} (3 is high on the documented thresholds).`,
                  },
                ],
                next: "Win-back on Growth times the one-order ask. This list is top order LTV.",
              })
            }
          >
            <span className="mcfly-cust-watch__who" role="cell">
              <span className="mcfly-cust-kpi__verb">{row.verb}</span>
              {row.label}
            </span>
            <span className="mcfly-cust-table__num mcfly-cust-watch__ltv" role="cell">
              {formatCurrency(row.lifetime, currency)}
              <span className="mcfly-cust-watch__meta">
                {" "}
                · {row.orders.toLocaleString()} orders
              </span>
              <span className="mcfly-cust-watch__ticket">{ticketLine(row, currency)}</span>
            </span>
            <span className="mcfly-cust-table__num" role="cell">
              {repeatLabel(row, currency)}
            </span>
            <span className="mcfly-cust-table__num mcfly-cust-watch__last" role="cell">
              {row.daysSince}d
            </span>
          </button>
        ))}
      </div>
      <p className="mcfly-cust-note">
        <DeskIcon name="customers" /> Identified buyers only — Whale 1 is a rank,
        not an invented name. Typical ticket is lifetime ÷ orders. First vs later
        tells a VIP from one huge first order. Repeat stays blank with no second
        order.{" "}
        <a href="#mcfly-win-back">Win-back</a> times the one-order ask.
      </p>
    </section>
  );
}
