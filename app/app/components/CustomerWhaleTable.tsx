import { DeskIcon } from "./DeskIcon";
import { useDeskDrill } from "./DeskDrill";
import { WHALE_MIN_ORDERS, type CustomerAnalytics } from "../lib/customers-analytics";

/**
 * Whale recency — your best customers (5+ orders) by how long since their last
 * order, so you know which are still warm and which are slipping. Order history
 * only; buckets past the window are withheld, never faked. Soft table, not a
 * card stack.
 */
export function CustomerWhaleTable({ analytics }: { analytics: CustomerAnalytics }) {
  const drill = useDeskDrill();
  const a = analytics;

  if (!a.available || a.whaleCount === 0) {
    const ghost = [0.82, 0.58, 0.4, 0.22];
    return (
      <section className="mcfly-panel mcfly-cust-card mcfly-cust-empty" aria-label="Whale recency">
        <div className="mcfly-panel__head">
          <h2>Whale recency</h2>
          <p className="mcfly-panel__muted">
            {WHALE_MIN_ORDERS}+ order buyers by days since last order
          </p>
        </div>
        <div className="mcfly-cust-empty__ghost mcfly-cust-empty__ghost--table" aria-hidden="true">
          {ghost.map((w, i) => (
            <span key={i} className="mcfly-cust-empty__row">
              <span className="mcfly-cust-empty__row-bar" style={{ width: `${w * 100}%` }} />
            </span>
          ))}
        </div>
        <p className="mcfly-cust-empty__copy">
          No {WHALE_MIN_ORDERS}+ order buyers on file in this window yet — not zero.
          Repeat buyers grow this as orders land.
        </p>
      </section>
    );
  }

  const maxBuyers = Math.max(...a.whaleRecency.map((b) => b.buyers), 1);

  return (
    <section className="mcfly-panel mcfly-cust-card mcfly-desk-anchor" aria-label="Whale recency">
      <div className="mcfly-panel__head">
        <h2>Whale recency</h2>
        <p className="mcfly-panel__muted">
          {WHALE_MIN_ORDERS}+ order buyers by days since last order · {a.whaleCount.toLocaleString()} best customers
        </p>
      </div>

      <div className="mcfly-cust-table" role="table" aria-label="Whale recency">
        <div className="mcfly-cust-table__head" role="row">
          <span role="columnheader">Bucket</span>
          <span role="columnheader" className="mcfly-cust-table__num">
            Buyers ({WHALE_MIN_ORDERS}+ orders)
          </span>
        </div>
        {a.whaleRecency.map((b) => (
          <button
            type="button"
            key={b.label}
            className="mcfly-cust-table__row"
            role="row"
            onClick={() =>
              drill?.openDrill({
                title: `${b.label} since last order`,
                value: `${b.buyers.toLocaleString()} buyers`,
                kicker: `${WHALE_MIN_ORDERS}+ order customers`,
                blocks: [
                  {
                    k: "What this is",
                    v: "Your best customers (five or more orders on file) whose most recent order lands in this recency bucket. Older buckets are the ones to win back.",
                  },
                ],
                next: "Win-back timing lives in What to do above.",
              })
            }
          >
            <span className="mcfly-cust-table__k" role="cell">
              <span
                className="mcfly-cust-table__spark"
                aria-hidden="true"
                style={{ width: `${Math.max(6, (b.buyers / maxBuyers) * 100)}%` }}
              />
              {b.label}
            </span>
            <span className="mcfly-cust-table__num" role="cell">
              {b.buyers.toLocaleString()}
            </span>
          </button>
        ))}
      </div>
      {a.whaleRecencyTruncatedAt != null ? (
        <p className="mcfly-cust-note">
          <DeskIcon name="clock" /> Buckets past ~{a.whaleRecencyTruncatedAt} days need more order
          history than Shopify shares on this install — withheld, not zero.
        </p>
      ) : null}
    </section>
  );
}
