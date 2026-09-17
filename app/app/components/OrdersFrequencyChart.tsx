import { useDeskDrill } from "./DeskDrill";
import { DeskIcon } from "./DeskIcon";
import type { OrdersFrequencyBucket } from "../lib/orders-intelligence";

/**
 * Order frequency — customers by number of orders in the window. The
 * long-tail Shopify Analytics Overview does not chart. Customers, not orders.
 */
export function OrdersFrequencyChart({
  buckets,
}: {
  buckets: OrdersFrequencyBucket[];
}) {
  const drill = useDeskDrill();
  if (buckets.length < 2) return null;
  const max = Math.max(...buckets.map((b) => b.customers), 1);
  const total = buckets.reduce((sum, b) => sum + b.customers, 0);
  return (
    <section
      className="mcfly-chart mcfly-chart--frequency"
      aria-label="Order frequency distribution"
    >
      <div className="mcfly-chart__head">
        <p className="mcfly-chart__title">
          <DeskIcon name="customers" />
          Order frequency
        </p>
        <p className="mcfly-chart__sub">Customers by orders · this window</p>
      </div>
      <div className="mcfly-chart__freq">
        {buckets.map((bucket) => {
          const pct = total > 0 ? Math.round((bucket.customers / total) * 100) : 0;
          const open = () =>
            drill?.openDrill({
              title: bucket.label,
              value: bucket.customers.toLocaleString(),
              kicker: "Order frequency",
              blocks: [
                { k: "Customers", v: bucket.customers.toLocaleString() },
                { k: "Share of buyers", v: `${pct}% of buyers this window` },
                {
                  k: "What this is",
                  v: "How many identified customers placed this many orders in the window. Guests are excluded.",
                },
              ],
              next: "One-order buyers are the repeat-purchase opportunity.",
            });
          return (
            <button
              type="button"
              className="mcfly-chart__freq-col"
              key={bucket.key}
              onClick={open}
            >
              <span className="mcfly-chart__freq-v">
                {bucket.customers.toLocaleString()}
              </span>
              <span className="mcfly-chart__freq-track" aria-hidden="true">
                <span
                  className="mcfly-chart__freq-bar"
                  style={{ height: `${Math.max(3, (bucket.customers / max) * 100)}%` }}
                />
              </span>
              <span className="mcfly-chart__freq-k">{bucket.label}</span>
            </button>
          );
        })}
      </div>
      <p className="mcfly-chart__hint">
        Tap a bar · identified customers · guests excluded
      </p>
    </section>
  );
}
