import prisma from "../db.server";
import { enqueueJob } from "./job-queue.server";
import { scopesIncludeReadAllOrders } from "./shopify-scopes";

/** Chunked SalesDayFact + OrderFact backfill after `read_all_orders` is granted. */
export const DEEP_HISTORY_BACKFILL_JOB = "deep_history_backfill";

export const DEEP_HISTORY_BACKFILL_DEDUPE_KEY = "read_all_orders";

export interface ApplyScopesUpdateResult {
  shopId: string | null;
  hasReadAllOrders: boolean;
  gainedReadAllOrders: boolean;
  clearedHistoryLimited: boolean;
  enqueued: boolean;
}

function asScopeList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((s): s is string => typeof s === "string");
}

/**
 * Pure payload read — Shopify `app/scopes_update` sends `previous` + `current`.
 */
export function readScopesUpdateLists(payload: unknown): {
  previous: string[];
  current: string[];
} {
  if (!payload || typeof payload !== "object") {
    return { previous: [], current: [] };
  }
  const record = payload as Record<string, unknown>;
  return {
    previous: asScopeList(record.previous),
    current: asScopeList(record.current),
  };
}

/**
 * After the merchant grants `read_all_orders`, clear a stuck `historyLimited`
 * flag and enqueue a coalesced deep backfill. ACK-path only — no GraphQL here.
 */
export async function applyReadAllOrdersGrant(args: {
  shopDomain: string;
  current: string[];
  previous?: string[];
}): Promise<ApplyScopesUpdateResult> {
  const hasReadAllOrders = scopesIncludeReadAllOrders(args.current);
  const gainedReadAllOrders =
    hasReadAllOrders && !scopesIncludeReadAllOrders(args.previous ?? []);

  if (!hasReadAllOrders) {
    return {
      shopId: null,
      hasReadAllOrders: false,
      gainedReadAllOrders: false,
      clearedHistoryLimited: false,
      enqueued: false,
    };
  }

  const shop = await prisma.shop.findUnique({
    where: { domain: args.shopDomain },
    select: { id: true },
  });
  if (!shop) {
    return {
      shopId: null,
      hasReadAllOrders: true,
      gainedReadAllOrders,
      clearedHistoryLimited: false,
      enqueued: false,
    };
  }

  const cleared = await prisma.orderBackfillState.updateMany({
    where: { shopId: shop.id, historyLimited: true },
    data: { historyLimited: false, lastError: null },
  });

  await enqueueJob({
    shopId: shop.id,
    type: DEEP_HISTORY_BACKFILL_JOB,
    dedupeKey: DEEP_HISTORY_BACKFILL_DEDUPE_KEY,
    payload: {
      reason: gainedReadAllOrders ? "scopes_gained" : "scopes_present",
      grantedScopes: args.current.join(","),
      // Poisoned $0 MTD facts must be overwritten — missing-only resume skips them.
      refreshExisting: true,
    },
  });

  return {
    shopId: shop.id,
    hasReadAllOrders: true,
    gainedReadAllOrders,
    clearedHistoryLimited: cleared.count > 0,
    enqueued: true,
  };
}
