import prisma from "../db.server";

/**
 * Shopify compliance webhooks (customers/data_request, customers/redact) send
 * customer.id as a numeric Admin REST id. OrderFact.customerKey is usually the
 * GraphQL GID (`gid://shopify/Customer/N`). Match both.
 *
 * @see https://shopify.dev/docs/apps/build/compliance/privacy-law-compliance
 */

const CUSTOMER_GID_PREFIX = "gid://shopify/Customer/";

export function normalizeCustomerNumericId(
  raw: string | number | null | undefined,
): string | null {
  if (raw == null) return null;
  const s = String(raw).trim();
  if (!s) return null;

  if (/^\d+$/.test(s)) return s;

  const gidMatch = /^gid:\/\/shopify\/Customer\/(\d+)$/i.exec(s);
  if (gidMatch?.[1]) return gidMatch[1];

  return null;
}

/** Opaque customerKey variants we may have persisted for one Shopify customer. */
export function customerKeyVariants(
  customerId: string | number | null | undefined,
): string[] {
  const numeric = normalizeCustomerNumericId(customerId);
  if (!numeric) return [];
  return [numeric, `${CUSTOMER_GID_PREFIX}${numeric}`];
}

/**
 * Pull customer id from a compliance webhook payload (shape varies slightly).
 * Prefer payload.customer.id; also accept top-level customer_id / id strings.
 */
export function extractCustomerIdFromPayload(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") return null;
  const p = payload as Record<string, unknown>;

  const customer = p.customer;
  if (customer && typeof customer === "object") {
    const id = (customer as Record<string, unknown>).id;
    const normalized = normalizeCustomerNumericId(
      typeof id === "string" || typeof id === "number" ? id : null,
    );
    if (normalized) return normalized;
  }

  for (const key of ["customer_id", "customerId"] as const) {
    const v = p[key];
    const normalized = normalizeCustomerNumericId(
      typeof v === "string" || typeof v === "number" ? v : null,
    );
    if (normalized) return normalized;
  }

  return null;
}

export async function countOrderFactsForCustomerKeys(
  shopId: string,
  customerKeys: string[],
): Promise<number> {
  if (customerKeys.length === 0) return 0;
  return prisma.orderFact.count({
    where: { shopId, customerKey: { in: customerKeys } },
  });
}

export async function deleteOrderFactsForCustomerKeys(
  shopId: string,
  customerKeys: string[],
): Promise<number> {
  if (customerKeys.length === 0) return 0;
  const result = await prisma.orderFact.deleteMany({
    where: { shopId, customerKey: { in: customerKeys } },
  });
  return result.count;
}

/**
 * Resolve shop by domain, then delete OrderFacts for the customer's key variants.
 * Returns deleted count (0 when shop missing or no matching facts).
 */
export async function redactCustomerOrderFacts(
  shopDomain: string,
  customerId: string | number | null | undefined,
): Promise<{ shopId: string | null; keys: string[]; deleted: number }> {
  const keys = customerKeyVariants(customerId);
  if (keys.length === 0) {
    return { shopId: null, keys: [], deleted: 0 };
  }

  const shop = await prisma.shop.findUnique({
    where: { domain: shopDomain },
    select: { id: true },
  });
  if (!shop) {
    return { shopId: null, keys, deleted: 0 };
  }

  const deleted = await deleteOrderFactsForCustomerKeys(shop.id, keys);
  return { shopId: shop.id, keys, deleted };
}

/**
 * Count opaque OrderFacts for a data_request (no email/PII to export — log only).
 */
export async function countCustomerOrderFacts(
  shopDomain: string,
  customerId: string | number | null | undefined,
): Promise<{ shopId: string | null; keys: string[]; count: number }> {
  const keys = customerKeyVariants(customerId);
  if (keys.length === 0) {
    return { shopId: null, keys: [], count: 0 };
  }

  const shop = await prisma.shop.findUnique({
    where: { domain: shopDomain },
    select: { id: true },
  });
  if (!shop) {
    return { shopId: null, keys, count: 0 };
  }

  const count = await countOrderFactsForCustomerKeys(shop.id, keys);
  return { shopId: shop.id, keys, count };
}
