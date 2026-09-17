/**
 * LTV-owned loader add-on: the Black Clover depth pack (spend-build curves,
 * retention grid, first→second product journeys, first-order-size tiers, and
 * best-customer recency) over the order-history window — independent of the
 * hidden period slicer, like Growth's come-back window.
 *
 * SAMPLE reads the deterministic Snowdevil order book (products on file). Live
 * reads real OrderFacts (no product titles — journeys quietly drop out). When
 * `read_all_orders` is on the running scopes, the pack uses the full stored
 * book so year / long windows can seal. Without it, the trailing 420-day read
 * stays the honest cap. Thin shops get empty-state craft, never a fake year.
 * Order history only — no spend, no ROAS.
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
import { shopifyReadOrdersScopesAllowDeep } from "./shopify-order-window";

/** Trailing order-history window when full-history scopes are not on (days). */
export const LTV_DEPTH_WINDOW_DAYS = 420;

const DAY_MS = 86_400_000;

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

  const deep = shopifyReadOrdersScopesAllowDeep();
  const start = deep
    ? undefined
    : new Date(asOf.getTime() - LTV_DEPTH_WINDOW_DAYS * DAY_MS);
  const rows = await loadOrderDepthRows(
    options.shopId,
    { start, end: asOf },
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
