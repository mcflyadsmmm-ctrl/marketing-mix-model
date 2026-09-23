/**
 * LTV-owned loader add-on: the Black Clover depth pack (spend-build curves,
 * retention grid, first→second product journeys, first-product → LTV, first-order
 * size tiers, and best-customer recency) over the order-history window —
 * independent of the hidden period slicer, like Growth's come-back window.
 *
 * SAMPLE reads the deterministic Snowdevil order book (first-order promo
 * codes and dollars on file, no product title). Live reads the full stored
 * OrderFact book (no product titles — journeys and first-product LTV stay
 * honest empties). Discount $ is on file so Promo→LTV can split promo vs
 * full-price first; codes fill when Shopify stored one on the order — never
 * invented. sourceName cohorts Online / POS / Shop so year / long windows
 * can seal. Thin shops get empty-state craft, never a fake year. Order
 * history only — no spend, no ROAS.
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
import { shopLiveIngestDepth } from "./live-ingest-depth.server";
import type { LiveIngestDepth } from "./live-ingest-depth";
import {
  firstYearBlocked,
  orderBookSpanDays,
} from "./ltv-year-honesty";
import { truncatedLifetimeLine } from "./till-ltv";

/** Historical name. Live LTV depth is the full stored book, not a 420-day cap. */
export const LTV_DEPTH_WINDOW_DAYS = 420;

export type LtvDepthPageView = LtvFlagshipView & {
  truncatedLifetimeBuyers: number;
  truncatedLifetimeLine: string | null;
};

function withTruncatedNote(
  view: LtvFlagshipView,
  truncatedLifetimeBuyers: number,
): LtvDepthPageView {
  return {
    ...view,
    truncatedLifetimeBuyers,
    truncatedLifetimeLine: truncatedLifetimeLine(truncatedLifetimeBuyers),
  };
}

function toDepthOrder(row: {
  customerKey: string;
  orderedAt: Date;
  amount: number;
  grossAmount: number | null;
  unitCount: number | null;
  discountAmount: number | null;
  discountCode: string | null;
  sourceName: string | null;
}): DepthOrder {
  return {
    customerKey: row.customerKey,
    orderedAt: row.orderedAt,
    amount: Number.isFinite(row.amount) ? row.amount : 0,
    grossAmount:
      row.grossAmount != null && Number.isFinite(row.grossAmount)
        ? row.grossAmount
        : undefined,
    units: row.unitCount != null && row.unitCount > 0 ? row.unitCount : 1,
    // Live OrderFacts store units only — never SKU or title (Level 1).
    product: null,
    // Discount $ is crawled. Codes when Shopify stored one — never invent.
    discountAmount: row.discountAmount,
    discountCode: row.discountCode ?? null,
    sourceName: row.sourceName,
  };
}

/**
 * Build the depth view for one shop. `asOf` anchors maturity and recency
 * (defaults to now); pass it in tests. On SAMPLE the Snowdevil book is
 * generated with no product title. On live, real OrderFacts are mapped to
 * opaque depth rows with no product name so a missing title stays an empty
 * rather than a guessed catalog.
 *
 * Buyers with a longer Shopify life than this desk stored are named
 * (`truncatedLifetimeBuyers`) and withheld from depth math — orders on this desk only,
 * never a silent skip that pretends they do not exist.
 */
export async function loadLtvDepth(options: {
  shopId: string;
  useSampleDesk: boolean;
  asOf?: Date;
  /** Live shops on a short order window — first year on Promo → LTV stays a dash. */
  historyLimited?: boolean;
  /** Unpaid / trial is a 90-closed-day book. Sample stays paid_full. */
  orderBookDepth?: LiveIngestDepth;
}): Promise<LtvDepthPageView> {
  const asOf = options.asOf ?? new Date();
  const historyLimited = Boolean(options.historyLimited) && !options.useSampleDesk;

  if (options.useSampleDesk) {
    const orders = generateSnowdevilDepthOrders(asOf);
    return withTruncatedNote(
      buildLtvFlagship(orders, asOf, { sample: true, historyLimited: false }),
      0,
    );
  }

  const rows = await loadOrderDepthRows(
    options.shopId,
    { end: asOf },
    ORDER_FACT_SOURCE,
  );
  const byCustomer = new Map<
    string,
    {
      lifetime: number | null;
      rows: DepthOrder[];
    }
  >();
  for (const row of rows) {
    if (!row.customerKey || row.customerKey === ORDER_FACT_GUEST_KEY) continue;
    const lifetime =
      row.lifetimeOrders != null && Number.isFinite(row.lifetimeOrders)
        ? Math.max(0, Math.trunc(row.lifetimeOrders))
        : null;
    const prev = byCustomer.get(row.customerKey);
    if (!prev) {
      byCustomer.set(row.customerKey, {
        lifetime,
        rows: [toDepthOrder(row)],
      });
      continue;
    }
    prev.rows.push(toDepthOrder(row));
    if (lifetime != null) {
      prev.lifetime =
        prev.lifetime == null ? lifetime : Math.max(prev.lifetime, lifetime);
    }
  }

  const orders: DepthOrder[] = [];
  let truncatedLifetimeBuyers = 0;
  for (const group of byCustomer.values()) {
    if (group.lifetime != null && group.lifetime > group.rows.length) {
      truncatedLifetimeBuyers += 1;
      continue;
    }
    orders.push(...group.rows);
  }

  const orderBookDepth =
    options.orderBookDepth ?? (await shopLiveIngestDepth(options.shopId));
  const yearBlocked = firstYearBlocked({
    historyLimited,
    orderBookDepth,
    bookSpanDays: orderBookSpanDays(
      rows.map((row) => row.orderedAt),
      asOf,
    ),
  });

  return withTruncatedNote(
    buildLtvFlagship(orders, asOf, {
      sample: false,
      historyLimited,
      yearBlocked,
    }),
    truncatedLifetimeBuyers,
  );
}
