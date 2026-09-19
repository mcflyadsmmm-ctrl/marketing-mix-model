/**
 * Orders first viewport — typical (median) vs Shopify Analytics average,
 * then discount / basket peeks Analytics does not put next to Average Order.
 * Spend / ROAS never enter these helpers.
 */

import { formatCurrency } from "./mer-format";
import { PRODUCT_NOUN } from "./product-labels";
import {
  isOrdersNum,
  ordersHasShare,
  ordersPct,
  type OrdersFact,
} from "./orders-scoreboard";
import type { ShopifyDepthStats } from "./shopify-depth-stats";

export const ORDERS_PENDING_LINE =
  "Sales for closed days are still loading — not $0.";

export const ORDERS_THIN_EMPTY_LINE =
  "Typical order, discounts, and 2+ item orders fill after paid orders land — not $0.";

/** First-lane label — median typical vs Shopify’s average, not an AOV explorer. */
export const ORDERS_FIRST_LANE_LABEL = "Typical order vs Shopify’s average";

/**
 * Later lane — Total Sales clock + Order intelligence sit below the
 * typical-order first fold so the greeting is not an Analytics-list stack.
 */
export const ORDERS_CLOCK_LANE_LABEL = "Sales clock and intelligence";

/**
 * Uninstall-killer contrast. Shopify Analytics Orders / Average Order is the
 * mean. Mcfly is the middle ticket.
 */
export const ORDERS_ANALYTICS_CONTRAST =
  "Shopify Analytics Orders is the average order.";

export const ORDERS_FIRST_FOLD_HEROES = [
  "typicalOrder",
  "fullVsDiscounted",
  "multiItem",
  "itemsPerOrder",
] as const;

export type OrdersFirstFoldHero = (typeof ORDERS_FIRST_FOLD_HEROES)[number];

export type OrdersOperatorGreetingInput = {
  salesPending: boolean;
  orderCount: number;
  typicalOrderLabel: string | null;
  averageOrderLabel?: string | null;
};

/**
 * PASS only when the first-fold hero is Mcfly-differentiated — not a free
 * Shopify Analytics Orders / Average Order clone.
 */
export function ordersHeroBeatsShopifyAnalytics(
  hero: OrdersFirstFoldHero,
): boolean {
  switch (hero) {
    case "typicalOrder":
    case "fullVsDiscounted":
    case "multiItem":
    case "itemsPerOrder":
      return true;
    default: {
      const _never: never = hero;
      return _never;
    }
  }
}

/**
 * One shop-owner sentence. Typical (median) first, average as the Analytics
 * foil — never an AI analyst.
 */
export function ordersOperatorGreeting(
  input: OrdersOperatorGreetingInput,
): string {
  if (input.salesPending) {
    return ORDERS_PENDING_LINE;
  }
  if (!(input.orderCount > 0)) {
    return "No orders in this window yet.";
  }
  const typical = input.typicalOrderLabel
    ? `Typical order around ${input.typicalOrderLabel}.`
    : null;
  const average = input.averageOrderLabel
    ? `Average is ${input.averageOrderLabel}.`
    : null;
  const parts = [typical, average].filter((part): part is string => part != null);
  if (parts.length === 0) {
    return ORDERS_ANALYTICS_CONTRAST;
  }
  return `${parts.join(" ")} ${ORDERS_ANALYTICS_CONTRAST}`;
}

/**
 * Discount + basket peeks that sit next to typical order.
 * Missing truths stay off the row — never a fake $0 / 0% graveyard.
 */
export function buildOrdersLeadPeeks(
  depth: ShopifyDepthStats,
  currency: string,
): OrdersFact[] {
  const rows: OrdersFact[] = [];
  if (
    isOrdersNum(depth.fullPriceMedianAov) &&
    isOrdersNum(depth.discountedMedianAov)
  ) {
    rows.push({
      k: "Typical · full price vs discounted",
      v: `${formatCurrency(depth.fullPriceMedianAov, currency)} vs ${formatCurrency(depth.discountedMedianAov, currency)}`,
      d: "Middle order with no discount vs with a discount. Average order value hides this.",
      icon: "orders",
    });
  }
  if (ordersHasShare(depth.multiUnitOrderShare)) {
    rows.push({
      k: "Orders with 2+ items",
      v: ordersPct(depth.multiUnitOrderShare),
      d: "Share of orders with two or more units. Average items can hide a one-item shop.",
      icon: "orders",
    });
  }
  if (isOrdersNum(depth.meanUnitCount) && depth.meanUnitCount > 0) {
    rows.push({
      k: PRODUCT_NOUN.bookItemsPerOrder,
      v: depth.meanUnitCount.toFixed(1),
      d: PRODUCT_NOUN.bookItemsPerOrderDef,
      icon: "orders",
    });
  }
  return rows;
}
