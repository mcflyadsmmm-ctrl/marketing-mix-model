import { DeskIcon } from "./DeskIcon";
import { useDeskDrill } from "./DeskDrill";
import { useDeskCurrency } from "../lib/desk-currency";
import { formatCurrency } from "../lib/mer-format";
import type { CustomerRfmView, RfmEmpty, WhaleWatchRow } from "../lib/customers-rfm";

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

function rowDetail(row: WhaleWatchRow, currency: string): string {
  return `${formatCurrency(row.lifetime, currency)} on file · ${row.orders.toLocaleString()} orders · last seen ${row.daysSince}d. ${row.detail}`;
}

/**
 * Whale watchlist — high on-file LTV buyers whose last order is past 30 days.
 * Actionable beside the existing What-to-do ActionCards. Opaque keys stay off
 * the desk. Soft table, designed empty, never a blank chart.
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
      copy: "No high-LTV buyers past 30 days since last order — not zero.",
      verb: "Watch the next 30 days",
    };
    return (
      <section
        className="mcfly-panel mcfly-cust-card mcfly-cust-card--soft mcfly-cust-watch"
        aria-label="Whale watchlist"
      >
        <div className="mcfly-panel__head">
          <h2>Whale watchlist</h2>
          <p className="mcfly-panel__muted">
            High LTV · recency risk · beside What to do
          </p>
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
                  v: "Floor: 8 identified buyers × 30 days. Then top-dollar buyers whose last order is past 30 days. Reach those first — order history, not email.",
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
          High on-file $ · last order past 30d · {rfm.watchlist.length.toLocaleString()} to reach
        </p>
      </div>

      <div className="mcfly-cust-watch__table" role="table" aria-label="Whale watchlist">
        <div className="mcfly-cust-watch__head" role="row">
          <span role="columnheader">Buyer</span>
          <span role="columnheader" className="mcfly-cust-table__num">
            On file
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
                    v: `Recency ${row.recency} · frequency ${row.frequency} · monetary ${row.monetary} (terciles, 3 is high).`,
                  },
                ],
                next: "What to do still times the one-order win-back. This list is high LTV first.",
              })
            }
          >
            <span className="mcfly-cust-watch__who" role="cell">
              <span className="mcfly-cust-kpi__verb">{row.verb}</span>
              {row.label}
            </span>
            <span className="mcfly-cust-table__num" role="cell">
              {formatCurrency(row.lifetime, currency)}
              <span className="mcfly-cust-watch__meta">
                {" "}
                · {row.orders.toLocaleString()} orders
              </span>
            </span>
            <span className="mcfly-cust-table__num mcfly-cust-watch__last" role="cell">
              {row.daysSince}d
            </span>
          </button>
        ))}
      </div>
      <p className="mcfly-cust-note">
        <DeskIcon name="customers" /> Identified buyers only — Shopify keys stay
        off this desk. Order-history timing, not email.
      </p>
    </section>
  );
}
