/**
 * SAMPLE Snowdevil sales clock — derived at read time from Total Sales.
 * Total Sales stays the ROAS denominator. Live shops keep Shopify gross/net.
 */

/** Share of original checkout later returned or edited. */
export const SAMPLE_RETURNS_OF_ORIGINAL = 0.06;

/** Shipping + tax + duties + fees sitting above product, as a share of Total Sales. */
export const SAMPLE_SHIPPING_TAX_OF_TOTAL = 0.12;

export type SampleSalesClock = {
  grossSales: number;
  netSales: number;
};

function roundCents(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * Original (gross) > Total Sales (after returns) > product-only (net).
 * Zero / invalid Total Sales stay zero — never a fake clock.
 */
export function sampleSalesClock(totalSales: number): SampleSalesClock {
  if (!Number.isFinite(totalSales) || totalSales <= 0) {
    return { grossSales: 0, netSales: 0 };
  }
  const grossSales = roundCents(totalSales / (1 - SAMPLE_RETURNS_OF_ORIGINAL));
  const netSales = roundCents(totalSales * (1 - SAMPLE_SHIPPING_TAX_OF_TOTAL));
  return { grossSales, netSales };
}
