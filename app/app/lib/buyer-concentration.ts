/**
 * Buyer concentration — Shopify Analytics underplays this.
 * Share of revenue from the heaviest buyers (top 10% / 20% / #1).
 * Pure — pass OrderFact-shaped rows (live or SAMPLE). Guest keys excluded.
 */

export type BuyerRevenueFactLike = {
  buyerKey: string;
  netSales: number;
};

export type BuyerConcentration = {
  buyers: number;
  totalRevenue: number;
  /** Share of revenue from the top 10% of buyers by lifetime spend. */
  top10Share: number | null;
  /** Share of revenue from the top 20% of buyers. */
  top20Share: number | null;
  /** Share of revenue from the single largest buyer. */
  topBuyerShare: number | null;
  topBuyerRevenue: number;
};

const GUEST = "guest";

function share(part: number, total: number): number | null {
  if (!(total > 0)) return null;
  return part / total;
}

/**
 * Rank buyers by lifetime net sales; report how concentrated revenue is.
 * Needs ≥10 buyers for top-10%/20% (otherwise those rates are null).
 */
export function computeBuyerConcentration(
  orders: BuyerRevenueFactLike[],
): BuyerConcentration {
  const byBuyer = new Map<string, number>();
  for (const o of orders) {
    if (!o.buyerKey || o.buyerKey === GUEST) continue;
    byBuyer.set(o.buyerKey, (byBuyer.get(o.buyerKey) ?? 0) + o.netSales);
  }

  const totals = [...byBuyer.values()].sort((a, b) => b - a);
  const buyers = totals.length;
  const totalRevenue = totals.reduce((s, n) => s + n, 0);
  const topBuyerRevenue = totals[0] ?? 0;

  if (buyers === 0 || !(totalRevenue > 0)) {
    return {
      buyers: 0,
      totalRevenue: 0,
      top10Share: null,
      top20Share: null,
      topBuyerShare: null,
      topBuyerRevenue: 0,
    };
  }

  const top10Count = buyers >= 10 ? Math.max(1, Math.ceil(buyers * 0.1)) : 0;
  const top20Count = buyers >= 10 ? Math.max(1, Math.ceil(buyers * 0.2)) : 0;
  const sumN = (n: number) =>
    totals.slice(0, n).reduce((s, v) => s + v, 0);

  return {
    buyers,
    totalRevenue,
    top10Share: top10Count > 0 ? share(sumN(top10Count), totalRevenue) : null,
    top20Share: top20Count > 0 ? share(sumN(top20Count), totalRevenue) : null,
    topBuyerShare: share(topBuyerRevenue, totalRevenue),
    topBuyerRevenue,
  };
}

export function formatConcentrationShare(rate: number | null): string {
  if (rate == null) return "—";
  return `${Math.round(rate * 1000) / 10}%`;
}
