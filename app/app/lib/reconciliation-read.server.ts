/**
 * Last 7 days and this month, read from Shopify on open.
 * Never substitutes SAMPLE and never turns a failed read into zero.
 */

import type { AdminApiContext } from "@shopify/shopify-app-react-router/server";
import prisma from "../db.server";
import { ORDER_FACT_SOURCE } from "./order-facts.server";
import {
  aggregateVariantLines,
  buildReconciliationWindow,
  emptyReconciliation,
  reconciliationDayWindows,
  type ReconciliationDeskData,
  type ReconciliationOrder,
  type VariantLine,
} from "./reconciliation-gap";
import { shopLocalDayKey, shopLocalDayRange } from "./shop-local-day";
import { adminGraphqlJson } from "./shopify-graphql-cost.server";
import { fetchShopifySalesDayTotals } from "./shopify-sales-totals.server";

const ORDER_PAGE_CAP = 4;

const RECON_ORDERS_QUERY = `#graphql
  query McflyReconciliationOrders($query: String!, $cursor: String) {
    orders(first: 80, after: $cursor, query: $query) {
      pageInfo { hasNextPage endCursor }
      edges {
        node {
          id
          name
          createdAt
          processedAt
          sourceName
          currentSubtotalPriceSet { shopMoney { amount } }
          currentTotalTaxSet { shopMoney { amount } }
          currentTotalDiscountsSet { shopMoney { amount } }
          totalPriceSet { shopMoney { amount } }
          totalRefundedSet { shopMoney { amount } }
          channelInformation {
            displayName
            channelDefinition { channelName }
          }
          purchasingEntity { __typename }
          customer { id numberOfOrders }
          lineItems(first: 40) {
            nodes {
              sku
              quantity
              currentQuantity
              variant { id }
              discountedTotalSet { shopMoney { amount } }
            }
          }
          refunds(first: 10) {
            createdAt
            refundLineItems(first: 40) {
              nodes {
                restockType
                subtotalSet { shopMoney { amount } }
                lineItem { sku variant { id } }
              }
            }
          }
        }
      }
    }
  }
`;

type Money = { shopMoney?: { amount?: string | null } | null } | null;

type ReconNode = {
  id?: string;
  name?: string | null;
  createdAt?: string | null;
  processedAt?: string | null;
  sourceName?: string | null;
  currentSubtotalPriceSet?: Money;
  currentTotalTaxSet?: Money;
  currentTotalDiscountsSet?: Money;
  totalPriceSet?: Money;
  totalRefundedSet?: Money;
  channelInformation?: {
    displayName?: string | null;
    channelDefinition?: { channelName?: string | null } | null;
  } | null;
  purchasingEntity?: { __typename?: string | null } | null;
  customer?: { id?: string | null; numberOfOrders?: number | string | null } | null;
  lineItems?: {
    nodes?: Array<{
      sku?: string | null;
      quantity?: number | null;
      currentQuantity?: number | null;
      variant?: { id?: string | null } | null;
      discountedTotalSet?: Money;
    } | null> | null;
  } | null;
  refunds?: Array<{
    createdAt?: string | null;
    refundLineItems?: {
      nodes?: Array<{
        restockType?: string | null;
        subtotalSet?: Money;
        lineItem?: { sku?: string | null; variant?: { id?: string | null } | null } | null;
      } | null> | null;
    } | null;
  } | null> | null;
};

type OrdersJson = {
  errors?: Array<{ message?: string }>;
  data?: {
    orders?: {
      pageInfo?: { hasNextPage?: boolean; endCursor?: string | null };
      edges?: Array<{ node?: ReconNode | null }>;
    };
  };
};

const RESTOCK_TYPES = new Set(["RETURN", "CANCEL", "LEGACY_RESTOCK"]);

function moneyOrNull(set: Money | undefined): number | null {
  const raw = set?.shopMoney?.amount;
  if (raw == null || raw === "") return null;
  const amount = Number(raw);
  return Number.isFinite(amount) ? amount : null;
}

function dayOrNull(iso: string | null | undefined, timeZone: string): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return shopLocalDayKey(date, timeZone);
}

export function mapReconciliationOrder(
  node: ReconNode,
  timeZone: string,
): ReconciliationOrder | null {
  if (!node.id || !node.createdAt) return null;
  const createdDay = dayOrNull(node.createdAt, timeZone);
  if (!createdDay) return null;
  const channelName =
    node.channelInformation?.channelDefinition?.channelName?.trim() ||
    node.channelInformation?.displayName?.trim() ||
    node.sourceName?.trim() ||
    "";
  const lifetimeRaw = node.customer?.numberOfOrders;
  const lifetime =
    lifetimeRaw == null
      ? null
      : typeof lifetimeRaw === "number"
        ? lifetimeRaw
        : Number.parseInt(String(lifetimeRaw), 10);
  const buyer = !node.customer?.id
    ? "unknown"
    : lifetime == null || !Number.isFinite(lifetime)
      ? "unknown"
      : lifetime <= 1
        ? "new"
        : "returning";
  const lines = mapVariantLines(node);
  const restock = mapRestock(node);
  return {
    id: node.id,
    name: node.name?.trim() || node.id,
    createdDay,
    processedDay: dayOrNull(node.processedAt, timeZone),
    netSales: moneyOrNull(node.currentSubtotalPriceSet),
    grossSales: moneyOrNull(node.totalPriceSet),
    discount: moneyOrNull(node.currentTotalDiscountsSet),
    refund: moneyOrNull(node.totalRefundedSet),
    tax: moneyOrNull(node.currentTotalTaxSet),
    restock,
    channel: channelName ? channelName : null,
    b2b: node.purchasingEntity?.__typename === "PurchasingCompany",
    draft: node.sourceName === "shopify_draft_order",
    buyer,
    lines,
  };
}

function mapRestock(node: ReconNode): number | null {
  if (node.refunds == null) return null;
  let sent = false;
  let total = 0;
  for (const refund of node.refunds) {
    for (const line of refund?.refundLineItems?.nodes ?? []) {
      if (!line || !line.restockType || !RESTOCK_TYPES.has(line.restockType)) continue;
      const amount = moneyOrNull(line.subtotalSet);
      if (amount == null) return null;
      sent = true;
      total += amount;
    }
  }
  return sent ? total : null;
}

function mapVariantLines(node: ReconNode): VariantLine[] {
  const refundsByVariant = new Map<string, { amount: number; restock: number | null }>();
  for (const refund of node.refunds ?? []) {
    for (const line of refund?.refundLineItems?.nodes ?? []) {
      if (!line) continue;
      const id = line.lineItem?.variant?.id || line.lineItem?.sku || "";
      if (!id) continue;
      const subtotal = moneyOrNull(line.subtotalSet);
      if (subtotal == null) continue;
      const prev = refundsByVariant.get(id) ?? { amount: 0, restock: null };
      const restocked = line.restockType != null && RESTOCK_TYPES.has(line.restockType);
      refundsByVariant.set(id, {
        amount: prev.amount + subtotal,
        restock: restocked ? (prev.restock ?? 0) + subtotal : prev.restock,
      });
    }
  }
  const out: VariantLine[] = [];
  for (const line of node.lineItems?.nodes ?? []) {
    if (!line) continue;
    const key = line.variant?.id || line.sku || "";
    const variantId = key || "unknown";
    const label = line.sku?.trim() || "unknown";
    const discounted = moneyOrNull(line.discountedTotalSet);
    const refund = key ? refundsByVariant.get(key) : undefined;
    const quantityChanged =
      line.currentQuantity != null &&
      line.quantity != null &&
      line.currentQuantity !== line.quantity;
    const netAfterReturns =
      discounted == null
        ? null
        : refund
          ? discounted - refund.amount
          : quantityChanged
            ? null
            : discounted;
    const units =
      line.currentQuantity != null
        ? line.currentQuantity
        : line.quantity != null
          ? line.quantity
          : null;
    out.push({
      variantId,
      label,
      netAfterReturns,
      units,
      restock: refund?.restock ?? null,
    });
  }
  return out;
}

async function pageOrders(
  admin: AdminApiContext,
  search: string,
): Promise<{ nodes: ReconNode[]; complete: boolean; error: string | null }> {
  const nodes: ReconNode[] = [];
  let cursor: string | null = null;
  for (let page = 0; page < ORDER_PAGE_CAP; page += 1) {
    let json: OrdersJson;
    try {
      json = await adminGraphqlJson<OrdersJson>(admin, RECON_ORDERS_QUERY, {
        query: search,
        cursor,
      });
    } catch (err) {
      return {
        nodes,
        complete: false,
        error: err instanceof Error ? err.message : "Shopify did not return orders",
      };
    }
    const message = json.errors?.map((error) => error.message).filter(Boolean).join("; ");
    if (message) return { nodes, complete: false, error: message };
    const connection = json.data?.orders;
    for (const edge of connection?.edges ?? []) {
      if (edge.node) nodes.push(edge.node);
    }
    if (!connection?.pageInfo?.hasNextPage) return { nodes, complete: true, error: null };
    cursor = connection.pageInfo.endCursor ?? null;
    if (!cursor) return { nodes, complete: false, error: null };
  }
  return { nodes, complete: false, error: null };
}

async function readWindow(
  admin: AdminApiContext,
  timeZone: string,
  id: "l7" | "mtd",
  label: string,
  since: string,
  until: string,
): Promise<{
  view: ReturnType<typeof buildReconciliationWindow>;
  orders: ReconciliationOrder[];
}> {
  const rangeStart = shopLocalDayRange(since, timeZone).start.toISOString();
  const rangeEnd = shopLocalDayRange(until, timeZone).end.toISOString();
  const createdQuery = `created_at:>='${rangeStart}' created_at:<='${rangeEnd}'`;
  const processedQuery = `processed_at:>='${rangeStart}' processed_at:<='${rangeEnd}'`;
  const checkedAt = new Date().toISOString();
  try {
    const [report, created, processed] = await Promise.all([
      fetchShopifySalesDayTotals(admin, { since, until }),
      pageOrders(admin, createdQuery),
      pageOrders(admin, processedQuery),
    ]);
    if (created.error || processed.error) {
      return {
        orders: [],
        view: buildReconciliationWindow({
          id,
          label,
          since,
          until,
          status: "failed",
          checkedAt,
          orders: [],
          ordersComplete: false,
          reportTotal: null,
        }),
      };
    }
    const byId = new Map<string, ReconciliationOrder>();
    for (const node of [...created.nodes, ...processed.nodes]) {
      const mapped = mapReconciliationOrder(node, timeZone);
      if (mapped) byId.set(mapped.id, mapped);
    }
    let reportTotal = 0;
    for (const row of report.values()) reportTotal += row.totalSales;
    const orders = [...byId.values()];
    return {
      orders,
      view: buildReconciliationWindow({
        id,
        label,
        since,
        until,
        status: created.complete && processed.complete ? "checked" : "loading",
        checkedAt,
        orders,
        ordersComplete: created.complete && processed.complete,
        reportTotal,
      }),
    };
  } catch {
    return {
      orders: [],
      view: buildReconciliationWindow({
        id,
        label,
        since,
        until,
        status: "failed",
        checkedAt,
        orders: [],
        ordersComplete: false,
        reportTotal: null,
      }),
    };
  }
}

export async function readReconciliationWindows(input: {
  admin: AdminApiContext;
  timeZone: string | null | undefined;
  currency: string | null | undefined;
}): Promise<ReconciliationDeskData> {
  const currency = input.currency?.trim() || null;
  const timeZone = input.timeZone?.trim() || "";
  if (!timeZone) return emptyReconciliation(currency);
  const today = shopLocalDayKey(new Date(), timeZone);
  const days = reconciliationDayWindows(today);
  const [l7, mtd] = await Promise.all([
    readWindow(input.admin, timeZone, "l7", "Last 7 days", days.l7.since, days.l7.until),
    readWindow(input.admin, timeZone, "mtd", "This month", days.mtd.since, days.mtd.until),
  ]);
  const inMonth = mtd.orders.filter(
    (order) => order.createdDay >= days.mtd.since && order.createdDay <= days.mtd.until,
  );
  return {
    currency,
    windows: [l7.view, mtd.view],
    variantLines:
      mtd.view.status === "checked" ? variantLinesFromOrders(inMonth) : null,
  };
}

export function variantLinesFromOrders(orders: ReconciliationOrder[]): VariantLine[] {
  return aggregateVariantLines(orders.flatMap((order) => order.lines));
}

export async function readStoredOrderLanes(input: {
  shopId: string;
  since: string;
  until: string;
  sample: boolean;
}): Promise<{ draftNet: number | null; unknownNet: number | null; wholesaleNet: null }> {
  if (!input.since || !input.until) {
    return { draftNet: null, unknownNet: null, wholesaleNet: null };
  }
  const rows = await prisma.orderFact.findMany({
    where: {
      shopId: input.shopId,
      source: input.sample ? "sample" : ORDER_FACT_SOURCE,
      shopLocalDate: {
        gte: new Date(`${input.since}T00:00:00.000Z`),
        lte: new Date(`${input.until}T00:00:00.000Z`),
      },
    },
    select: { amount: true, sourceName: true },
  });
  let draftNet = 0;
  let unknownNet = 0;
  for (const row of rows) {
    if (row.sourceName == null || row.sourceName.trim() === "") {
      unknownNet += row.amount;
      continue;
    }
    if (row.sourceName === "shopify_draft_order") draftNet += row.amount;
  }
  return { draftNet, unknownNet, wholesaleNet: null };
}
