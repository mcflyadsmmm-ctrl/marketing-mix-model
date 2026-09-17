/**
 * LTV-owned loader add-on: the Black Clover depth pack (spend-build curves,
 * retention grid, first→second product journeys, first-order-size tiers, and
 * best-customer recency) over the order-history window — independent of the
 * hidden period slicer, like Growth's come-back window.
 *
 * SAMPLE reads the deterministic Snowdevil order book (products on file). Live
 * reads the full stored OrderFact book (no product titles — journeys quietly
 * drop out) so year / long windows can seal. Thin shops get empty-state craft,
 * never a fake year. Order history only — no spend, no ROAS.
 */

import {
  loadOrderDepthRows,
  ORDER_FACT_GUEST_KEY,
  ORDER_FACT_SOURCE,
} from "./order-facts.server";
import { type DepthOrder } from "./ltv-depth";
import {
  buildLtvFlagship,
  type LtvFlagshipView,
} from "./ltv-flagship";
import { generateSnowdevilDepthOrders } from "./ltv-depth-sample";

/** Historical name. Live LTV depth is the full stored book, not a 420-day cap. */
export const LTV_DEPTH_WINDOW_DAYS = 420;

/**
 * Build the depth view for one shop. `asOf` anchors maturity and recency
 * (defaults to now); pass it in tests. On SAMPLE the Snowdevil book is
 * generated; on live, real OrderFacts are mapped to opaque depth rows with no
 * product name so product journeys stay empty rather than guessed.
 */
export async function loadLtvDepth(options: {
  shopId: string;
  useSampleDesk: boolean;
  asOf?: Date;
}): Promise<LtvFlagshipView> {
  const asOf = options.asOf ?? new Date();

  if (options.useSampleDesk) {
    const orders = generateSnowdevilDepthOrders(asOf);
    return buildLtvFlagship(orders, asOf, { sample: true });
  }

  const rows = await loadOrderDepthRows(
    options.shopId,
    { end: asOf },
    ORDER_FACT_SOURCE,
  );
  const orders: DepthOrder[] = [];
  for (const row of rows) {
    if (!row.customerKey || row.customerKey === ORDER_FACT_GUEST_KEY) continue;
    orders.push({
      customerKey: row.customerKey,
      orderedAt: row.orderedAt,
      amount: Number.isFinite(row.amount) ? row.amount : 0,
      units: row.unitCount != null && row.unitCount > 0 ? row.unitCount : 1,
      // Live OrderFacts store units only — never SKU or title (Level 1).
      product: null,
    });
  }
  return buildLtvFlagship(orders, asOf, { sample: false });
}
