import prisma from "../db.server";
import { purgeExpiredComplianceDataExports } from "./compliance-export-retrieve.server";
import { recomputeCohortFacts } from "./order-facts.server";

/**
 * Shopify compliance webhooks (customers/data_request, customers/redact) send
 * customer.id as a numeric Admin REST id. OrderFact.customerKey is usually the
 * GraphQL GID (`gid://shopify/Customer/N`). Match both.
 *
 * Level 1 only: order ids, amounts, dates, opaque customerKey — never name/email/phone/address.
 *
 * @see https://shopify.dev/docs/apps/build/compliance/privacy-law-compliance
 */

const CUSTOMER_GID_PREFIX = "gid://shopify/Customer/";
const ORDER_GID_PREFIX = "gid://shopify/Order/";

export type Level1OrderPackageRow = {
  shopifyOrderId: string;
  amount: number;
  orderedAt: string;
  shopLocalDate?: string;
  currency?: string | null;
  customerKey: string;
};

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

export function normalizeOrderNumericId(
  raw: string | number | null | undefined,
): string | null {
  if (raw == null) return null;
  const s = String(raw).trim();
  if (!s) return null;

  if (/^\d+$/.test(s)) return s;

  const gidMatch = /^gid:\/\/shopify\/Order\/(\d+)$/i.exec(s);
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

/** shopifyOrderId variants (numeric REST id + Order GID). */
export function orderIdVariants(
  orderId: string | number | null | undefined,
): string[] {
  const numeric = normalizeOrderNumericId(orderId);
  if (!numeric) return [];
  return [numeric, `${ORDER_GID_PREFIX}${numeric}`];
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

/**
 * Pull orders_to_redact from customers/redact payload and expand to
 * numeric + Order GID variants for OrderFact.shopifyOrderId matching.
 */
export function extractOrdersToRedactFromPayload(payload: unknown): string[] {
  if (!payload || typeof payload !== "object") return [];
  const raw = (payload as Record<string, unknown>).orders_to_redact;
  if (!Array.isArray(raw)) return [];

  const out = new Set<string>();
  for (const item of raw) {
    if (typeof item !== "string" && typeof item !== "number") continue;
    for (const variant of orderIdVariants(item)) {
      out.add(variant);
    }
  }
  return [...out];
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

/**
 * Delete OrderFacts for customerKey variants and/or explicit order id variants
 * (guest checkouts appear in orders_to_redact without a stable customerKey match).
 */
export async function deleteOrderFactsForCustomerKeys(
  shopId: string,
  customerKeys: string[],
  orderIdVariantsList: string[] = [],
): Promise<number> {
  if (customerKeys.length === 0 && orderIdVariantsList.length === 0) return 0;

  const or: Array<
    | { customerKey: { in: string[] } }
    | { shopifyOrderId: { in: string[] } }
  > = [];
  if (customerKeys.length > 0) {
    or.push({ customerKey: { in: customerKeys } });
  }
  if (orderIdVariantsList.length > 0) {
    or.push({ shopifyOrderId: { in: orderIdVariantsList } });
  }

  const result = await prisma.orderFact.deleteMany({
    where: { shopId, OR: or },
  });
  return result.count;
}

/**
 * Delete OrderFacts for the customer's key variants and/or orders_to_redact ids.
 * By default recomputes CohortFacts when anything was deleted (tests / sync callers).
 * Webhooks pass `recomputeCohorts: false` and enqueue `recompute_cohort_facts`
 * so Shopify's 5s ACK budget is never spent on a full cohort rebuild.
 */
export async function redactCustomerOrderFacts(
  shopDomain: string,
  customerId: string | number | null | undefined,
  ordersToRedact: Array<string | number> | string[] | null | undefined = null,
  opts?: { recomputeCohorts?: boolean },
): Promise<{
  shopId: string | null;
  keys: string[];
  orderIds: string[];
  deleted: number;
}> {
  const recomputeCohorts = opts?.recomputeCohorts !== false;
  const keys = customerKeyVariants(customerId);

  const orderIds = new Set<string>();
  if (Array.isArray(ordersToRedact)) {
    for (const item of ordersToRedact) {
      // Already-expanded variants from extractOrdersToRedactFromPayload, or raw ids.
      if (typeof item === "string" && item.startsWith(ORDER_GID_PREFIX)) {
        orderIds.add(item);
        const numeric = normalizeOrderNumericId(item);
        if (numeric) orderIds.add(numeric);
        continue;
      }
      for (const variant of orderIdVariants(item)) {
        orderIds.add(variant);
      }
    }
  }
  const orderIdList = [...orderIds];

  if (keys.length === 0 && orderIdList.length === 0) {
    return { shopId: null, keys: [], orderIds: [], deleted: 0 };
  }

  const shop = await prisma.shop.findUnique({
    where: { domain: shopDomain },
    select: { id: true },
  });
  if (!shop) {
    return { shopId: null, keys, orderIds: orderIdList, deleted: 0 };
  }

  const deleted = await deleteOrderFactsForCustomerKeys(
    shop.id,
    keys,
    orderIdList,
  );

  if (deleted > 0 && recomputeCohorts) {
    await recomputeCohortFacts(shop.id);
  }

  // Erase any Level-1 data_request packages for this customer (erase duty).
  const numericId = normalizeCustomerNumericId(customerId);
  if (numericId) {
    await prisma.complianceDataExport.deleteMany({
      where: { shopDomain, customerNumericId: numericId },
    });
  }

  return { shopId: shop.id, keys, orderIds: orderIdList, deleted };
}

/**
 * Count opaque OrderFacts for a data_request (thin helper; prefer fulfill for webhooks).
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

/**
 * Fulfill customers/data_request: build a Level-1 opaque order package, persist
 * ComplianceDataExport for merchant/ops retrieval (not emailed PII).
 */
export async function fulfillCustomerDataRequest(
  shopDomain: string,
  customerId: string | number | null | undefined,
): Promise<{
  shopId: string | null;
  keys: string[];
  count: number;
  exportId: string | null;
}> {
  const numericId = normalizeCustomerNumericId(customerId);
  const keys = customerKeyVariants(customerId);
  if (!numericId || keys.length === 0) {
    return { shopId: null, keys: [], count: 0, exportId: null };
  }

  const shop = await prisma.shop.findUnique({
    where: { domain: shopDomain },
    select: { id: true },
  });
  if (!shop) {
    return { shopId: null, keys, count: 0, exportId: null };
  }

  const facts = await prisma.orderFact.findMany({
    where: { shopId: shop.id, customerKey: { in: keys } },
    select: {
      shopifyOrderId: true,
      amount: true,
      orderedAt: true,
      shopLocalDate: true,
      currency: true,
      customerKey: true,
    },
    orderBy: { orderedAt: "asc" },
  });

  const packageRows: Level1OrderPackageRow[] = facts.map((f) => {
    const row: Level1OrderPackageRow = {
      shopifyOrderId: f.shopifyOrderId,
      amount: f.amount,
      orderedAt: f.orderedAt.toISOString(),
      customerKey: f.customerKey,
    };
    if (f.shopLocalDate) {
      row.shopLocalDate = f.shopLocalDate.toISOString().slice(0, 10);
    }
    if (f.currency != null) {
      row.currency = f.currency;
    }
    return row;
  });

  // Keep the table lean: purge stale packages before writing a new one.
  await purgeExpiredComplianceDataExports();

  const created = await prisma.complianceDataExport.create({
    data: {
      shopDomain,
      shopId: shop.id,
      customerNumericId: numericId,
      orderFactCount: packageRows.length,
      packageJson: JSON.stringify(packageRows),
    },
    select: { id: true },
  });

  return {
    shopId: shop.id,
    keys,
    count: packageRows.length,
    exportId: created.id,
  };
}
