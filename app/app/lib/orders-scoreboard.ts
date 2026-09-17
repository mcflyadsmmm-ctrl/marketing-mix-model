/**
 * Orders scoreboard facts. Shopify Analytics Overview shows mean AOV.
 * This board is the median ticket, the sales clock, and when/where
 * orders land. Spend / ROAS never enter these helpers.
 */

import { formatCurrency } from "./mer-format";
import { PRODUCT_NOUN } from "./product-labels";
import {
  WEEKDAY_SHORT,
  formatHourRangeLabel,
  type ShopifyDepthStats,
} from "./shopify-depth-stats";
import type { ShopifyNativePeriodStats } from "./shopify-native-stats";
import type { DeskIconName } from "../components/DeskIcon";

export const ORDERS_SPEND_BANS = [
  "Spend Upload",
  "Total ROAS",
  "Edit spend",
  "QuietSpendDoor",
] as const;

export type OrdersClockItem = { k: string; v: string };

export type OrdersHero = {
  k: string;
  v: string;
  sub?: string;
  def: string;
};

export type OrdersFact = {
  k: string;
  v: string;
  s?: string;
  d?: string;
  x?: string[];
  icon: DeskIconName;
};

export type OrdersSalesClocks = {
  gross: number;
  grossKnown: boolean;
  total: number;
  net: number;
  netKnown: boolean;
};

export type OrdersChartGrain = "weekday" | "hour";

export type OrdersChartBar = {
  key: string;
  label: string;
  share: number;
  dollars: number | null;
  weekend?: boolean;
  peak?: boolean;
};

export function isOrdersNum(n: number | null | undefined): n is number {
  return n != null && Number.isFinite(n);
}

/** Whole percents — 25%, never 25.0%. */
export function ordersPct(share: number): string {
  return `${Math.round(share * 100)}%`;
}

export function ordersHasShare(
  share: number | null | undefined,
): share is number {
  return isOrdersNum(share) && Math.round(share * 100) > 0;
}

export function ordersWeekdayBreakdown(shares: number[] | null): string {
  if (!shares) return "";
  const parts = shares
    .map((share, index) => ({ share, index }))
    .filter((entry) => ordersHasShare(entry.share))
    .sort((a, b) => b.share - a.share)
    .map((entry) => `${WEEKDAY_SHORT[entry.index]} ${ordersPct(entry.share)}`);
  return parts.length > 1 ? parts.join(" · ") : "";
}

export function ordersHourBreakdown(shares: number[] | null): string {
  if (!shares) return "";
  const parts = shares
    .map((share, hour) => ({ share, hour }))
    .filter((entry) => ordersHasShare(entry.share))
    .sort((a, b) => b.share - a.share)
    .slice(0, 3)
    .map(
      (entry) => `${formatHourRangeLabel(entry.hour)} ${ordersPct(entry.share)}`,
    );
  return parts.length > 1 ? parts.join(" · ") : "";
}

export function ordersSourceMixLine(
  mix: ShopifyDepthStats["sourceSalesShare"],
): string {
  if (!mix) return "";
  const parts = [
    mix.online > 0 ? `Online ${ordersPct(mix.online)}` : null,
    mix.pos > 0 ? `POS ${ordersPct(mix.pos)}` : null,
    mix.shop > 0 ? `Shop ${ordersPct(mix.shop)}` : null,
    mix.other > 0.04 ? `Other ${ordersPct(mix.other)}` : null,
  ].filter((part): part is string => part != null);
  return parts.join(" · ");
}

export function buildOrdersHero(
  depth: ShopifyDepthStats,
  currency: string,
  salesPending: boolean,
): OrdersHero {
  const middle = isOrdersNum(depth.medianAov) ? depth.medianAov : null;
  const value = middle ?? (isOrdersNum(depth.meanAov) ? depth.meanAov : null);
  const meanSub =
    !salesPending && middle != null && isOrdersNum(depth.meanAov)
      ? `Average order ${formatCurrency(depth.meanAov, currency)} — Shopify Analytics uses the average.`
      : undefined;
  if (salesPending) {
    return {
      k: PRODUCT_NOUN.bookTypicalOrder,
      v: "—",
      def: "Sales for closed days are still loading — not $0.",
    };
  }
  return {
    k: PRODUCT_NOUN.bookTypicalOrder,
    v: value != null ? formatCurrency(value, currency) : "—",
    sub: meanSub,
    def:
      value != null
        ? `${PRODUCT_NOUN.bookTypicalOrderDef} ${depth.orderCount.toLocaleString()} orders in this window.`
        : "Needs paid orders in this window.",
  };
}

export function buildOrdersClock(
  clocks: OrdersSalesClocks,
  currency: string,
): OrdersClockItem[] {
  return [
    clocks.grossKnown
      ? { k: "Original", v: formatCurrency(clocks.gross, currency) }
      : null,
    {
      k: clocks.grossKnown ? "After returns" : "Total Sales",
      v: formatCurrency(clocks.total, currency),
    },
    clocks.netKnown
      ? { k: "Product only", v: formatCurrency(clocks.net, currency) }
      : null,
  ].filter((item): item is OrdersClockItem => item != null);
}

export function buildOrdersDepthFacts(
  book: ShopifyNativePeriodStats,
  depth: ShopifyDepthStats,
  currency: string,
): OrdersFact[] {
  return [
    {
      k: PRODUCT_NOUN.bookMostOrders,
      v:
        isOrdersNum(depth.aovP25) && isOrdersNum(depth.aovP75)
          ? `${formatCurrency(depth.aovP25, currency)}–${formatCurrency(depth.aovP75, currency)}`
          : "—",
      d: PRODUCT_NOUN.bookMostOrdersDef,
      icon: "orders",
    },
    {
      k: PRODUCT_NOUN.bookTypicalDay,
      v: isOrdersNum(depth.medianDailySales)
        ? formatCurrency(depth.medianDailySales, currency)
        : "—",
      s:
        depth.dayCountWithSales > 0
          ? `${depth.dayCountWithSales} days had sales`
          : undefined,
      d: isOrdersNum(depth.medianDailySales)
        ? PRODUCT_NOUN.bookTypicalDayDef
        : PRODUCT_NOUN.bookTypicalDayEmpty,
      icon: "clock",
    },
    {
      k: PRODUCT_NOUN.bookDiscountedOrders,
      v: ordersHasShare(depth.discountedOrderShare)
        ? ordersPct(depth.discountedOrderShare)
        : "—",
      s:
        isOrdersNum(depth.meanDiscountAmount) && depth.meanDiscountAmount > 0
          ? `Typical ${formatCurrency(depth.meanDiscountAmount, currency)} off`
          : undefined,
      d: PRODUCT_NOUN.bookDiscountedOrdersDef,
      icon: "orders",
    },
    {
      k: "Typical · full price vs discounted",
      v:
        isOrdersNum(depth.fullPriceMedianAov) &&
        isOrdersNum(depth.discountedMedianAov)
          ? `${formatCurrency(depth.fullPriceMedianAov, currency)} vs ${formatCurrency(depth.discountedMedianAov, currency)}`
          : "—",
      d: "Middle order with no discount vs with a discount. Average order value hides this.",
      icon: "orders",
    },
    {
      k: PRODUCT_NOUN.bookItemsPerOrder,
      v: isOrdersNum(depth.meanUnitCount)
        ? depth.meanUnitCount.toFixed(1)
        : "—",
      d: PRODUCT_NOUN.bookItemsPerOrderDef,
      icon: "orders",
    },
    {
      k: "Orders with 2+ items",
      v: ordersHasShare(depth.multiUnitOrderShare)
        ? ordersPct(depth.multiUnitOrderShare)
        : "—",
      d: "Share of orders with two or more units. Average items can hide a one-item shop.",
      icon: "orders",
    },
    {
      k: PRODUCT_NOUN.bookReturnsEdits,
      v:
        isOrdersNum(book.returnsDrag) && book.returnsDrag > 0
          ? formatCurrency(book.returnsDrag, currency)
          : "—",
      s: ordersHasShare(book.returnsDragPct)
        ? `${ordersPct(book.returnsDragPct)} of the original checkout total`
        : undefined,
      d: "Original checkout total minus what stands today — returns and edits.",
      icon: "sales",
    },
    {
      k: "Shipping + tax",
      v:
        isOrdersNum(depth.shippingTaxFees) && depth.shippingTaxFees > 0
          ? formatCurrency(depth.shippingTaxFees, currency)
          : "—",
      s: ordersHasShare(depth.shippingTaxFeesPct)
        ? `${ordersPct(depth.shippingTaxFeesPct)} of Total Sales`
        : undefined,
      d: "Shipping, tax, duties and fees sitting above the product subtotal.",
      icon: "sales",
    },
  ];
}

export function buildOrdersTimingFacts(
  depth: ShopifyDepthStats,
  currency: string,
): OrdersFact[] {
  const peakShare =
    depth.peakWeekday != null
      ? depth.weekdaySalesShare?.[depth.peakWeekday]
      : null;
  const mix = ordersSourceMixLine(depth.sourceSalesShare);
  const weekdayLine = ordersWeekdayBreakdown(depth.weekdaySalesShare);
  const hourLine = ordersHourBreakdown(depth.hourlySalesShare);
  const onlineShare = depth.sourceSalesShare?.online;
  const posShare = depth.sourceSalesShare?.pos;
  const shopShare = depth.sourceSalesShare?.shop;
  const shopCard: OrdersFact[] =
    isOrdersNum(depth.sourceMedianAov.shop) || ordersHasShare(shopShare)
      ? [
          {
            k: "Typical Shop order",
            v: isOrdersNum(depth.sourceMedianAov.shop)
              ? formatCurrency(depth.sourceMedianAov.shop, currency)
              : "—",
            s: ordersHasShare(shopShare)
              ? `${ordersPct(shopShare)} of sales`
              : undefined,
            d: "Middle Shop app order. Online vs POS — not which ad sent them.",
            icon: "orders",
          },
        ]
      : [];
  return [
    {
      k: PRODUCT_NOUN.bookWeekendSales,
      v: ordersHasShare(depth.weekendSalesShare)
        ? ordersPct(depth.weekendSalesShare)
        : "—",
      d: "Saturday + Sunday share of sales, shop-local.",
      icon: "weekend",
    },
    {
      k: PRODUCT_NOUN.bookBusiestWeekday,
      v: depth.peakWeekday != null ? WEEKDAY_SHORT[depth.peakWeekday]! : "—",
      s: ordersHasShare(peakShare)
        ? `${ordersPct(peakShare)} of this window`
        : undefined,
      d: "Weekday with the most sales, shop-local.",
      x: weekdayLine ? [weekdayLine] : undefined,
      icon: "weekend",
    },
    {
      k: PRODUCT_NOUN.bookBusiestHour,
      v:
        depth.peakHour != null ? formatHourRangeLabel(depth.peakHour) : "—",
      d: PRODUCT_NOUN.bookBusiestHourDef,
      x: hourLine ? [hourLine] : undefined,
      icon: "clock",
    },
    {
      k: "Biggest three days",
      v: ordersHasShare(depth.bestThreeDayShare)
        ? ordersPct(depth.bestThreeDayShare)
        : "—",
      s:
        depth.dayCountWithSales > 0
          ? `${depth.dayCountWithSales} days had sales`
          : undefined,
      d: "Share of sales from the three busiest days in this window.",
      icon: "chart",
    },
    {
      k: PRODUCT_NOUN.bookChannelMix,
      v: mix || "—",
      d: PRODUCT_NOUN.bookChannelMixDef,
      icon: "orders",
    },
    {
      k: "Typical Online order",
      v: isOrdersNum(depth.sourceMedianAov.online)
        ? formatCurrency(depth.sourceMedianAov.online, currency)
        : "—",
      s: ordersHasShare(onlineShare)
        ? `${ordersPct(onlineShare)} of sales`
        : undefined,
      d: "Middle online-store order. Online vs POS — not which ad sent them.",
      icon: "orders",
    },
    {
      k: "Typical POS order",
      v: isOrdersNum(depth.sourceMedianAov.pos)
        ? formatCurrency(depth.sourceMedianAov.pos, currency)
        : "—",
      s: ordersHasShare(posShare) ? `${ordersPct(posShare)} of sales` : undefined,
      d: "Middle point-of-sale order. Online vs POS — not ad attribution.",
      icon: "orders",
    },
    ...shopCard,
  ];
}

export function buildOrdersChartBars(input: {
  grain: OrdersChartGrain;
  weekdayShares: number[] | null;
  hourlyShares: number[] | null;
  windowSales: number | null;
  peakWeekday: number | null;
  peakHour: number | null;
}): OrdersChartBar[] {
  const hasDollars =
    input.windowSales != null &&
    Number.isFinite(input.windowSales) &&
    input.windowSales > 0;
  switch (input.grain) {
    case "weekday": {
      const shares = input.weekdayShares;
      if (!shares || shares.length < 7) return [];
      return shares.map((share, index) => ({
        key: WEEKDAY_SHORT[index] ?? `D${index}`,
        label: WEEKDAY_SHORT[index] ?? `D${index}`,
        share,
        dollars: hasDollars && input.windowSales != null
          ? input.windowSales * share
          : null,
        weekend: index === 0 || index === 6,
        peak: input.peakWeekday === index,
      }));
    }
    case "hour": {
      const shares = input.hourlyShares;
      if (!shares || shares.length < 24) return [];
      return shares.map((share, hour) => ({
        key: `h${hour}`,
        label: formatHourRangeLabel(hour),
        share,
        dollars: hasDollars && input.windowSales != null
          ? input.windowSales * share
          : null,
        peak: input.peakHour === hour,
      }));
    }
    default: {
      const _never: never = input.grain;
      return _never;
    }
  }
}
