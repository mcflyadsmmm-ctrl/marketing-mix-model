/**
 * First-order source → LTV on the open Customers LTV lane.
 *
 * Cohort = the buyer's first identified order source (Online / POS / Shop /
 * Other via {@link classifyOrderSource}). LTV is lifetime revenue ÷ buyers
 * only when that group has at least {@link SOURCE_LTV_MIN_BUYERS} buyers —
 * otherwise null so the chip paints —. Never ad attribution, never invent
 * a source, never invent dollars.
 *
 * Merchant chrome: Online, POS, Shop, Other. Never "cohort", "ARPU", or
 * platform ROAS.
 */

import {
  classifyOrderSource,
  type OrderSourceKind,
} from "./shopify-depth-stats";
import { rollUpCustomers, type DepthOrder } from "./ltv-depth";

/** Buyers who started on the same source before a row is honest. */
export const SOURCE_LTV_MIN_BUYERS = 8;

export type SourceLtvKind = OrderSourceKind;

export interface SourceLtvRow {
  kind: SourceLtvKind;
  label: string;
  buyers: number;
  /** Lifetime revenue ÷ buyers when buyers ≥ floor; else null (paint —). */
  ltv: number | null;
}

export interface SourceLtvView {
  online: SourceLtvRow;
  pos: SourceLtvRow;
  shop: SourceLtvRow;
  other: SourceLtvRow;
  /** Always the four kinds in Online → POS → Shop → Other order. */
  rows: SourceLtvRow[];
}

const KIND_ORDER: SourceLtvKind[] = ["online", "pos", "shop", "other"];

export function sourceLtvLabel(kind: SourceLtvKind): string {
  switch (kind) {
    case "online":
      return "Online";
    case "pos":
      return "POS";
    case "shop":
      return "Shop";
    case "other":
      return "Other";
    default: {
      const _exhaustive: never = kind;
      return _exhaustive;
    }
  }
}

function emptyRow(kind: SourceLtvKind): SourceLtvRow {
  return {
    kind,
    label: sourceLtvLabel(kind),
    buyers: 0,
    ltv: null,
  };
}

/** First-order `sourceName` per customer (earliest orderedAt wins). */
function firstSourceByCustomer(
  orders: DepthOrder[],
): Map<string, string | null | undefined> {
  const first = new Map<string, { at: number; sourceName: string | null | undefined }>();
  for (const order of orders) {
    if (!order.customerKey) continue;
    const at = order.orderedAt.getTime();
    if (!Number.isFinite(at)) continue;
    const prev = first.get(order.customerKey);
    if (!prev || at < prev.at) {
      first.set(order.customerKey, { at, sourceName: order.sourceName });
    }
  }
  const out = new Map<string, string | null | undefined>();
  for (const [key, row] of first) {
    out.set(key, row.sourceName);
  }
  return out;
}

/**
 * First-order source → average lifetime revenue. Thin groups stay null.
 * Empty / missing `sourceName` lands in Other — never guessed as Online.
 */
export function buildLtvBySource(
  orders: DepthOrder[],
  options?: { minBuyers?: number },
): SourceLtvView {
  const minBuyers = options?.minBuyers ?? SOURCE_LTV_MIN_BUYERS;
  const customers = rollUpCustomers(orders);
  const firstSource = firstSourceByCustomer(orders);
  const buckets: Record<SourceLtvKind, number[]> = {
    online: [],
    pos: [],
    shop: [],
    other: [],
  };

  for (const customer of customers) {
    const kind = classifyOrderSource(firstSource.get(customer.customerKey));
    buckets[kind].push(customer.lifetimeSpend);
  }

  const byKind = {} as Record<SourceLtvKind, SourceLtvRow>;
  for (const kind of KIND_ORDER) {
    const spends = buckets[kind];
    const buyers = spends.length;
    const revenue = spends.reduce((sum, n) => sum + n, 0);
    byKind[kind] = {
      kind,
      label: sourceLtvLabel(kind),
      buyers,
      ltv:
        buyers >= minBuyers && Number.isFinite(revenue)
          ? revenue / buyers
          : null,
    };
  }

  return {
    online: byKind.online,
    pos: byKind.pos,
    shop: byKind.shop,
    other: byKind.other,
    rows: KIND_ORDER.map((kind) => byKind[kind]),
  };
}

/** Four empty slots — used when the open lane has no identified buyers yet. */
export function emptySourceLtvView(): SourceLtvView {
  const online = emptyRow("online");
  const pos = emptyRow("pos");
  const shop = emptyRow("shop");
  const other = emptyRow("other");
  return { online, pos, shop, other, rows: [online, pos, shop, other] };
}
