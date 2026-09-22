/**
 * Live paste buyer index — unique OrderFacts on shop-local days.
 * Interned ids stay on the client so Cash CPA can unique a buyer across
 * pasted days without sending customer keys. SAMPLE keeps day-sum buyerDays.
 *
 * Quiet days inside the queried range are known-zero (`[]`), not omitted.
 * Missing keys mean the day is outside this book.
 */

import prisma from "../db.server";
import {
  ORDER_FACT_DAY_COMPLETE_PREFIX,
  ORDER_FACT_GUEST_KEY,
  ORDER_FACT_SOURCE,
} from "./order-facts.server";
import { utcDayKey } from "./sample-desk.server";
import type { SpendPasteLiveIndex } from "./spend-paste-preview";

const MS_PER_DAY = 86_400_000;

function internKey(intern: Map<string, number>, key: string): number {
  const existing = intern.get(key);
  if (existing != null) return existing;
  const id = intern.size + 1;
  intern.set(key, id);
  return id;
}

function dayKeyOf(value: Date | null | undefined): string | null {
  if (!(value instanceof Date) || !Number.isFinite(value.getTime())) return null;
  return utcDayKey(value);
}

export function utcDayKeysInRange(range: { start: Date; end: Date }): string[] {
  const keys: string[] = [];
  const start = Date.UTC(
    range.start.getUTCFullYear(),
    range.start.getUTCMonth(),
    range.start.getUTCDate(),
  );
  const end = Date.UTC(
    range.end.getUTCFullYear(),
    range.end.getUTCMonth(),
    range.end.getUTCDate(),
  );
  for (let t = start; t <= end; t += MS_PER_DAY) {
    keys.push(utcDayKey(new Date(t)));
  }
  return keys;
}

function emptyIndexForRange(range: {
  start: Date;
  end: Date;
}): SpendPasteLiveIndex {
  const identifiedByDay: Record<string, number[]> = {};
  const newByDay: Record<string, number[]> = {};
  for (const dateKey of utcDayKeysInRange(range)) {
    identifiedByDay[dateKey] = [];
    newByDay[dateKey] = [];
  }
  return { identifiedByDay, newByDay };
}

/**
 * Unique identified / new buyers keyed by shop-local day for Spend paste.
 * Every day in `range` is present. Empty arrays are known-zero, not unknown.
 */
export async function buildLivePasteBuyerIndex(
  shopId: string,
  range: { start: Date; end: Date },
): Promise<SpendPasteLiveIndex> {
  const index = emptyIndexForRange(range);
  const intern = new Map<string, number>();
  const identifiedSets = new Map<string, Set<number>>();
  for (const dateKey of Object.keys(index.identifiedByDay)) {
    identifiedSets.set(dateKey, new Set());
  }
  const newSets = new Map<string, Set<number>>();
  for (const dateKey of Object.keys(index.newByDay)) {
    newSets.set(dateKey, new Set());
  }

  const orders = await prisma.orderFact.findMany({
    where: {
      shopId,
      source: ORDER_FACT_SOURCE,
      customerKey: { not: ORDER_FACT_GUEST_KEY },
      NOT: { shopifyOrderId: { startsWith: ORDER_FACT_DAY_COMPLETE_PREFIX } },
    },
    select: {
      customerKey: true,
      orderedAt: true,
      shopLocalDate: true,
      lifetimeOrders: true,
    },
    orderBy: { orderedAt: "desc" },
  });

  if (orders.length === 0) return index;

  const firstByCustomer = new Map<
    string,
    {
      first: Date;
      localDate: Date | null;
      lifetime: number | null;
      inWindow: number;
    }
  >();

  for (const order of orders) {
    const dateKey = dayKeyOf(order.shopLocalDate);
    if (
      dateKey &&
      order.orderedAt >= range.start &&
      order.orderedAt <= range.end
    ) {
      const set = identifiedSets.get(dateKey);
      if (set) set.add(internKey(intern, order.customerKey));
    }

    const prev = firstByCustomer.get(order.customerKey);
    const lifetime =
      order.lifetimeOrders != null && Number.isFinite(order.lifetimeOrders)
        ? Math.max(0, Math.trunc(order.lifetimeOrders))
        : null;
    if (!prev) {
      firstByCustomer.set(order.customerKey, {
        first: order.orderedAt,
        localDate: order.shopLocalDate,
        lifetime,
        inWindow: 1,
      });
      continue;
    }
    prev.inWindow += 1;
    if (order.orderedAt < prev.first) {
      prev.first = order.orderedAt;
      prev.localDate = order.shopLocalDate;
    }
    if (lifetime != null) {
      prev.lifetime =
        prev.lifetime == null ? lifetime : Math.max(prev.lifetime, lifetime);
    }
  }

  for (const [customerKey, row] of firstByCustomer) {
    if (row.lifetime != null && row.lifetime > row.inWindow) continue;
    if (row.first < range.start || row.first > range.end) continue;
    const dateKey = dayKeyOf(row.localDate);
    if (!dateKey) continue;
    const set = newSets.get(dateKey);
    if (!set) continue;
    set.add(internKey(intern, customerKey));
  }

  for (const [dateKey, ids] of identifiedSets) {
    index.identifiedByDay[dateKey] = [...ids];
  }
  for (const [dateKey, ids] of newSets) {
    index.newByDay[dateKey] = [...ids];
  }
  return index;
}
