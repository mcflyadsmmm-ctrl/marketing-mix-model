import { shopLocalDayKey } from "./shop-local-day";

/**
 * Pure extraction helpers for sales-dirty webhooks:
 * `orders/create|updated|cancelled` and `refunds/create`.
 *
 * Level 1 only: id + timestamps. We deliberately never touch customer PII or
 * line economics here — the desk needs a dirty-day signal, not a CRM.
 */

/** Job type for "this shop-local day's SalesDayFact is stale, recompute it." */
export const RECONCILE_SALES_DAY_JOB = "reconcile_sales_day";

/** After customers/redact deletes OrderFacts — rebuild till LTV cohorts off the ACK path. */
export const RECOMPUTE_COHORT_FACTS_JOB = "recompute_cohort_facts";

/** Order topics this app subscribes to, in the normalized `ORDERS_CREATE` shape. */
export const ORDER_WEBHOOK_TOPICS = [
  "ORDERS_CREATE",
  "ORDERS_UPDATED",
  "ORDERS_CANCELLED",
] as const;

/**
 * Refund topic — payload is a Refund resource (order_id + refund timestamps),
 * not a full Order. Still dirties SalesDayFact for Analytics event days.
 */
export const REFUND_WEBHOOK_TOPICS = ["REFUNDS_CREATE"] as const;

/** Topics that enqueue reconcile_sales_day (orders + refunds). */
export const SALES_DIRTY_WEBHOOK_TOPICS = [
  ...ORDER_WEBHOOK_TOPICS,
  ...REFUND_WEBHOOK_TOPICS,
] as const;

export type OrderWebhookTopic = (typeof ORDER_WEBHOOK_TOPICS)[number];
export type SalesDirtyWebhookTopic = (typeof SALES_DIRTY_WEBHOOK_TOPICS)[number];

/**
 * Normalize a webhook topic to the `ORDERS_CREATE` shape. Shopify and the app
 * library have both used `orders/create` and `ORDERS_CREATE` over time, so callers
 * must not switch on the raw value.
 */
export function normalizeWebhookTopic(topic: unknown): string {
  return String(topic ?? "")
    .toUpperCase()
    .replace(/\//g, "_")
    .trim();
}

export function isOrderWebhookTopic(topic: unknown): topic is OrderWebhookTopic {
  return (ORDER_WEBHOOK_TOPICS as readonly string[]).includes(
    normalizeWebhookTopic(topic),
  );
}

export function isSalesDirtyWebhookTopic(
  topic: unknown,
): topic is SalesDirtyWebhookTopic {
  return (SALES_DIRTY_WEBHOOK_TOPICS as readonly string[]).includes(
    normalizeWebhookTopic(topic),
  );
}

/**
 * True when the payload is a Refund resource (refunds/create), not an Order.
 * Refund payloads lack the order's created_at — do not clear OrderFact day seals
 * from refund-only timestamps (that would target the wrong order-created day).
 */
export function isRefundResourcePayload(payload: unknown): boolean {
  if (!payload || typeof payload !== "object") return false;
  const record = payload as Record<string, unknown>;
  if (Array.isArray(record.refund_line_items)) return true;
  if (record.order_id != null && record.line_items == null && record.refunds == null) {
    return true;
  }
  return false;
}

/**
 * Shop-local days whose OrderFact `__day_complete__` seals may be cleared.
 * Order payloads: all dirty days. Refund-only payloads: none (wait for
 * orders/updated, which carries order created_at + refunds[]).
 */
export function extractOrderFactSealClearDayKeys(
  payload: unknown,
  timeZone: string | null | undefined,
): string[] {
  if (isRefundResourcePayload(payload)) return [];
  return extractOrderDirtyDayKeys(payload, timeZone);
}

/**
 * Opaque Shopify order id for the delivery ledger — numeric id preferred, GID
 * accepted. Returns null rather than inventing a value.
 */
export function extractOrderId(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") return null;
  const record = payload as Record<string, unknown>;
  const numeric = record.id;
  if (typeof numeric === "number" && Number.isFinite(numeric)) {
    return String(numeric);
  }
  if (typeof numeric === "string" && numeric.trim()) return numeric.trim();
  const gid = record.admin_graphql_api_id;
  if (typeof gid === "string" && gid.trim()) return gid.trim();
  return null;
}

const DATE_PREFIX = /^(\d{4}-\d{2}-\d{2})/;

function dayKeyFromTimestamp(
  raw: string,
  timeZone: string | null | undefined,
): string | null {
  if (timeZone) {
    const instant = new Date(raw);
    if (!Number.isNaN(instant.getTime())) {
      return shopLocalDayKey(instant, timeZone);
    }
  }
  const prefix = DATE_PREFIX.exec(raw);
  return prefix?.[1] ?? null;
}

function pushTimestampDay(
  into: Set<string>,
  raw: unknown,
  timeZone: string | null | undefined,
): void {
  if (typeof raw !== "string" || !raw.trim()) return;
  const key = dayKeyFromTimestamp(raw.trim(), timeZone);
  if (key) into.add(key);
}

/**
 * All shop-local days this order webhook can move under Analytics grain.
 *
 * - Order `created_at` / `processed_at`: sale day
 * - `cancelled_at`: cancel event day (Shopify Analytics is event-dated)
 * - Each `refunds[].processed_at` / `created_at`: refund event day
 *
 * Matching Admin Analytics means a refund must reseal the refund day, not only
 * rewrite the original order day.
 */
export function extractOrderDirtyDayKeys(
  payload: unknown,
  timeZone: string | null | undefined,
): string[] {
  if (!payload || typeof payload !== "object") return [];
  const record = payload as Record<string, unknown>;
  const days = new Set<string>();

  pushTimestampDay(days, record.created_at, timeZone);
  pushTimestampDay(days, record.processed_at, timeZone);
  pushTimestampDay(days, record.cancelled_at, timeZone);

  const refunds = record.refunds;
  if (Array.isArray(refunds)) {
    for (const refund of refunds) {
      if (!refund || typeof refund !== "object") continue;
      const row = refund as Record<string, unknown>;
      pushTimestampDay(days, row.processed_at, timeZone);
      pushTimestampDay(days, row.created_at, timeZone);
    }
  }

  return [...days].sort();
}

/**
 * Primary dirty day (order created/processed) — kept for callers that need one key.
 * Prefer {@link extractOrderDirtyDayKeys} so refund/cancel event days also reseal.
 */
export function extractOrderDirtyDayKey(
  payload: unknown,
  timeZone: string | null | undefined,
): string | null {
  const keys = extractOrderDirtyDayKeys(payload, timeZone);
  if (keys.length === 0) return null;
  // Prefer created_at day when present — first key after sort is not always that.
  if (!payload || typeof payload !== "object") return keys[0] ?? null;
  const record = payload as Record<string, unknown>;
  for (const field of ["created_at", "processed_at"] as const) {
    const raw = record[field];
    if (typeof raw === "string" && raw.trim()) {
      const key = dayKeyFromTimestamp(raw.trim(), timeZone);
      if (key) return key;
    }
  }
  return keys[0] ?? null;
}
