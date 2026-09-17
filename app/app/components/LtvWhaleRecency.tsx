import { formatCurrency } from "../lib/mer-format";
import { DeskIcon } from "./DeskIcon";
import { BookFactGrid, type BookFact } from "./ShopifyBookSection";
import { useDeskCurrency } from "../lib/desk-currency";
import type { WhaleRecency } from "../lib/ltv-depth";

function pct(share: number): string {
  return `${Math.round(share * 100)}%`;
}

/**
 * Best customers (top spenders) and when they last ordered — the "are my whales
 * still here?" read Shopify Analytics does not surface. Recency bars show how
 * fresh that revenue is; a stack drifting past 90 days is a quiet churn warning.
 * Order history only, no email list.
 */
export function LtvWhaleRecency({ whales }: { whales: WhaleRecency | null }) {
  const currency = useDeskCurrency();
  if (!whales) return null;

  const facts: BookFact[] = [
    {
      k: "Best customers",
      v: whales.whaleCount.toLocaleString(),
      d: `The top spenders by lifetime dollars — about 1 in 10 identified buyers. ${formatCurrency(whales.threshold, currency)}+ lifetime to make the list.`,
    },
    {
      k: "Typical best customer",
      v: formatCurrency(whales.medianLifetime, currency),
      d: `Middle lifetime spend among best customers. Average ${formatCurrency(whales.avgLifetime, currency)} — a few pull it up.`,
    },
    {
      k: "Still ordering",
      v: pct(whales.activeShare),
      d: "Best customers who placed an order in the last 90 days.",
    },
    ...(whales.medianDaysSinceLast != null
      ? [
          {
            k: "Since last order",
            v: `${Math.round(whales.medianDaysSinceLast)}d`,
            d: "Middle wait since a best customer last ordered. Rising is a quiet churn warning.",
            keepDash: true as const,
          },
        ]
      : []),
    ...(whales.topProduct
      ? [
          {
            k: "Starts with",
            v: whales.topProduct,
            d: "The product most best customers bought first. Order history, not a promise.",
          },
        ]
      : []),
  ];

  const maxBucket = Math.max(1, ...whales.buckets.map((b) => b.count));

  return (
    <section className="mcfly-book mcfly-depth" aria-label="Best customers and when they last ordered">
      <p className="mcfly-book__lede">
        Your best customers — the top tenth by lifetime dollars — and how recently
        they ordered. They bring{" "}
        <strong>{pct(whales.salesShare)}</strong> of all identified sales, so
        whether they are still ordering matters more than any single day.
      </p>
      <BookFactGrid facts={facts} />
      <div className="mcfly-chart mcfly-depth-recency" aria-label="Best customers by last order">
        <div className="mcfly-chart__head">
          <p className="mcfly-chart__title">
            <DeskIcon name="customers" />
            When best customers last ordered
          </p>
        </div>
        <div className="mcfly-chart__hrows">
          {whales.buckets.map((bucket) => {
            const share = whales.whaleCount > 0 ? bucket.count / whales.whaleCount : 0;
            const width = Math.max(bucket.count > 0 ? 8 : 2, (bucket.count / maxBucket) * 100);
            return (
              <div className="mcfly-chart__hrow mcfly-depth-recency__row" key={bucket.key}>
                <span className="mcfly-chart__hlabel">{bucket.label}</span>
                <span className="mcfly-chart__htrack">
                  <span
                    className={`mcfly-chart__hfill${bucket.key === "d180plus" ? " mcfly-depth-recency__fill--cold" : ""}`}
                    style={{ width: `${width}%` }}
                  />
                </span>
                <span className="mcfly-chart__hvalue">
                  {bucket.count.toLocaleString()} · {pct(share)}
                </span>
              </div>
            );
          })}
        </div>
        <p className="mcfly-chart__hint">Share of best customers · order history</p>
      </div>
    </section>
  );
}
