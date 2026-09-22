import { formatCurrency } from "../lib/mer-format";
import { useDeskCurrency } from "../lib/desk-currency";
import type { WhaleRecency } from "../lib/ltv-depth";
import { whaleSlackInsight } from "../lib/shareable-insights";
import { DeskIcon } from "./DeskIcon";
import { SlackInsightCard } from "./SlackInsightCard";
import { useDeskDrill } from "./DeskDrill";

function pct(share: number): string {
  return `${Math.round(share * 100)}%`;
}

/**
 * Best customers (top spenders) and when they last ordered — the "are my whales
 * still here?" read Shopify Analytics does not surface. Soft KPI strip + recency
 * bars. Order history only, no email list.
 */
export function LtvWhaleRecency({
  whales,
  shopLabel = "",
  sample = false,
  shotMode = false,
  historyLimited,
}: {
  whales: WhaleRecency | null;
  shopLabel?: string;
  sample?: boolean;
  shotMode?: boolean;
  historyLimited: boolean;
}) {
  const currency = useDeskCurrency();
  const drill = useDeskDrill();
  if (!whales) return null;
  const whaleSlack = whaleSlackInsight({
    whaleCount: whales.whaleCount,
    salesShare: whales.salesShare,
    medianLifetime: whales.medianLifetime,
    coldShare: whales.coldShare,
    historyLimited: historyLimited,
    shopLabel,
    sample,
    where: "On file",
    money: (n) => formatCurrency(n, currency),
  });

  const cards = [
    {
      k: "Best customers",
      v: whales.whaleCount.toLocaleString(),
      d: `The top spenders by lifetime dollars — about 1 in 10 identified buyers. ${formatCurrency(whales.threshold, currency)}+ lifetime to make the list.`,
      icon: "customers" as const,
    },
    {
      k: "Typical best customer",
      v: formatCurrency(whales.medianLifetime, currency),
      d: `Middle lifetime spend among best customers. Average ${formatCurrency(whales.avgLifetime, currency)} — a few pull it up.`,
      icon: "orders" as const,
    },
    {
      k: "Still ordering",
      v: pct(whales.activeShare),
      d: "Best customers who placed an order in the last 90 days.",
      icon: "clock" as const,
    },
    ...(whales.medianDaysSinceLast != null
      ? [
          {
            k: "Since last order",
            v: `${Math.round(whales.medianDaysSinceLast)}d`,
            d: "Middle wait since a best customer last ordered. Rising is a quiet churn warning.",
            icon: "weekend" as const,
          },
        ]
      : []),
    ...(whales.ltvMultiple > 0
      ? [
          {
            k: "Vs everyone",
            v: `${whales.ltvMultiple.toFixed(1)}×`,
            d: `Best-customer average ${formatCurrency(whales.avgLifetime, currency)} vs ${formatCurrency(whales.everyoneAvg, currency)} for every identified buyer.`,
            icon: "sales" as const,
          },
        ]
      : []),
  ];

  const maxBucket = Math.max(1, ...whales.buckets.map((b) => b.count));

  return (
    <section
      className="mcfly-book mcfly-depth mcfly-depth--soft"
      aria-label="Best customers and when they last ordered"
    >
      <div className="mcfly-depth-softhead">
        <h3 className="mcfly-chart__serif">Whale recency</h3>
        <p className="mcfly-chart__muted">
          Your best customers — the top tenth by lifetime dollars — bring{" "}
          <strong>{pct(whales.salesShare)}</strong> of identified sales. Whether
          they are still ordering matters more than any single day.
          {whales.topProduct ? ` Most start with ${whales.topProduct}.` : ""}
        </p>
      </div>

      <SlackInsightCard insight={whaleSlack} shotMode={shotMode} />

      <div className="mcfly-kpi-grid mcfly-kpi-grid--peeks mcfly-kpi-grid--soft">
        {cards.map((card) => (
          <button
            type="button"
            className="mcfly-kpi mcfly-kpi--drill mcfly-kpi--peek mcfly-kpi--soft"
            key={card.k}
            onClick={() =>
              drill?.openDrill({
                title: card.k,
                value: card.v,
                blocks: [{ k: "What this is", v: card.d }],
                next: "Order history only — never an email list.",
              })
            }
          >
            <span className="mcfly-kpi__top">
              <DeskIcon name={card.icon} />
              <span className="mcfly-kpi__label">{card.k}</span>
            </span>
            <span className="mcfly-kpi__value">{card.v}</span>
          </button>
        ))}
      </div>

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
              <button
                type="button"
                className="mcfly-chart__hrow mcfly-depth-recency__row"
                key={bucket.key}
                onClick={() =>
                  drill?.openDrill({
                    title: bucket.label,
                    value: `${bucket.count.toLocaleString()} · ${pct(share)}`,
                    blocks: [
                      {
                        k: "What this is",
                        v: `Best customers whose most recent order falls in ${bucket.label}. Share of the whale list, not of the whole shop.`,
                      },
                    ],
                    next: "A stack drifting past 90 days is a quiet churn warning.",
                  })
                }
              >
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
              </button>
            );
          })}
        </div>
        <p className="mcfly-chart__hint">Click a bar · share of best customers · order history</p>
      </div>
    </section>
  );
}
