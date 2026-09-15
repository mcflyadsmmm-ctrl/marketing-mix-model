import { formatCurrency } from "../lib/mer-format";
import { PRODUCT_NOUN } from "../lib/product-labels";
import {
  WEEKDAY_SHORT,
  formatHourRangeLabel,
  type ShopifyDepthStats,
} from "../lib/shopify-depth-stats";
import type { ShopifyNativePeriodStats } from "../lib/shopify-native-stats";

export type ShopifyBookGroup = "period" | "buyers" | "timing" | "growth";

const ALL_BOOK_GROUPS: ShopifyBookGroup[] = [
  "period",
  "buyers",
  "timing",
  "growth",
];

type SalesClocks = {
  gross: number;
  grossKnown: boolean;
  total: number;
  net: number;
  netKnown: boolean;
};

/** One impressive number per page. */
type BookHero = { k: string; v: string; def: string; sub?: string };

/** Drill-down line: summary always visible, definition + extras on open. */
type BookRow = { k: string; v: string; d: string; s?: string; x?: string[] };

type ClockItem = { k: string; v: string };

/** Whole percents in merchant chrome — 25%, never 25.0%. */
function pct(share: number): string {
  return `${Math.round(share * 100)}%`;
}

function isNum(n: number | null | undefined): n is number {
  return n != null && Number.isFinite(n);
}

/**
 * A share that rounds to 0% is not a fact worth a row — omit it instead of
 * printing 0% (or the old 0.0%) next to real numbers.
 */
function hasShare(share: number | null | undefined): share is number {
  return isNum(share) && Math.round(share * 100) > 0;
}

/** Weekday shares, biggest first — depth inside the drill, not a new tile. */
function weekdayBreakdown(shares: number[] | null): string[] {
  if (!shares) return [];
  const parts = shares
    .map((share, index) => ({ share, index }))
    .filter((entry) => hasShare(entry.share))
    .sort((a, b) => b.share - a.share)
    .map((entry) => `${WEEKDAY_SHORT[entry.index]} ${pct(entry.share)}`);
  return parts.length > 1 ? [parts.join(" · ")] : [];
}

/** Top shop-local hours behind the busiest one. */
function hourBreakdown(shares: number[] | null): string[] {
  if (!shares) return [];
  const parts = shares
    .map((share, hour) => ({ share, hour }))
    .filter((entry) => hasShare(entry.share))
    .sort((a, b) => b.share - a.share)
    .slice(0, 3)
    .map((entry) => `${formatHourRangeLabel(entry.hour)} ${pct(entry.share)}`);
  return parts.length > 1 ? [`Busiest hours — ${parts.join(" · ")}`] : [];
}

function sourceMixLine(mix: ShopifyDepthStats["sourceSalesShare"]): string {
  if (!mix) return "";
  const parts = [
    mix.online > 0 ? `Online ${pct(mix.online)}` : null,
    mix.pos > 0 ? `POS ${pct(mix.pos)}` : null,
    mix.shop > 0 ? `Shop ${pct(mix.shop)}` : null,
    mix.other > 0.04 ? `Other ${pct(mix.other)}` : null,
  ].filter(Boolean);
  return parts.join(" · ");
}

/** Typical order $ behind Online · POS · Shop mix — drill, not a second hero. */
function sourceTypicalAovLine(
  aov: ShopifyDepthStats["sourceMedianAov"],
): string[] {
  const parts = [
    isNum(aov.online) ? `Online ${formatCurrency(aov.online)}` : null,
    isNum(aov.pos) ? `POS ${formatCurrency(aov.pos)}` : null,
    isNum(aov.shop) ? `Shop ${formatCurrency(aov.shop)}` : null,
  ].filter((part): part is string => part != null);
  return parts.length > 0 ? [`Typical ${parts.join(" · ")}`] : [];
}

function periodHero(depth: ShopifyDepthStats): BookHero {
  const middle = isNum(depth.medianAov) ? depth.medianAov : null;
  const value = middle ?? (isNum(depth.meanAov) ? depth.meanAov : null);
  const meanSub =
    middle != null && isNum(depth.meanAov)
      ? `Average order ${formatCurrency(depth.meanAov)} — Shopify Analytics uses the average.`
      : undefined;
  return {
    k: PRODUCT_NOUN.bookTypicalOrder,
    v: value != null ? formatCurrency(value) : "—",
    sub: meanSub,
    def:
      value != null
        ? `${PRODUCT_NOUN.bookTypicalOrderDef} ${depth.orderCount.toLocaleString()} orders in this window.`
        : "Needs paid orders in this window.",
  };
}

function buyersHero(
  book: ShopifyNativePeriodStats,
  depth: ShopifyDepthStats,
): BookHero {
  if (isNum(book.returningSales) && book.returningSales > 0) {
    return {
      k: "Sales from returning customers",
      v: formatCurrency(book.returningSales),
      sub: hasShare(book.returningSalesShare)
        ? `${pct(book.returningSalesShare)} of sales — dollars, not headcount`
        : hasShare(book.newSalesShare)
          ? `First-time buyers brought ${pct(book.newSalesShare)}.`
          : undefined,
      def: "Sales from buyers who had ordered before. Shopify Analytics Overview uses returning-customer rate (headcount).",
    };
  }
  if (hasShare(book.returningSalesShare)) {
    return {
      k: "Sales from returning customers",
      v: pct(book.returningSalesShare),
      sub: hasShare(book.newSalesShare)
        ? `First-time buyers brought ${pct(book.newSalesShare)}.`
        : undefined,
      def: "Share of this window’s sales from buyers who had ordered before — dollars, not headcount. Shopify Analytics Overview uses returning-customer rate.",
    };
  }
  if (hasShare(depth.repeatSalesShare)) {
    return {
      k: "Repeat sales",
      v: pct(depth.repeatSalesShare),
      def: "Sales from buyers with two or more orders in this window.",
    };
  }
  if (hasShare(book.newSalesShare)) {
    return {
      k: "Sales from first-time buyers",
      v: pct(book.newSalesShare),
      def: "Share of this window’s sales from buyers on their first order — dollars, not headcount.",
    };
  }
  if (depth.identifiedBuyers > 0) {
    return {
      k: "Identified buyers",
      v: depth.identifiedBuyers.toLocaleString(),
      def: "Buyers we can match across orders in this window. Returning-sales share needs a second purchase.",
    };
  }
  return {
    k: "Sales from returning customers",
    v: "—",
    def: "Needs identified buyers in this window.",
  };
}

function growthHero(
  book: ShopifyNativePeriodStats,
  depth: ShopifyDepthStats,
): BookHero {
  if (isNum(book.newSales) && book.newSales > 0) {
    return {
      k: "Sales from first-time buyers",
      v: formatCurrency(book.newSales),
      sub: hasShare(book.newSalesShare)
        ? `${pct(book.newSalesShare)} of sales — dollars, not headcount`
        : depth.identifiedBuyers > 0
          ? `${book.newCustomers.toLocaleString()} new customers in this window`
          : undefined,
      def: "Sales from buyers on their first order. Growth is new dollars and who came back — not ad subscribe counts.",
    };
  }
  if (book.newCustomers > 0) {
    return {
      k: "New customers",
      v: book.newCustomers.toLocaleString(),
      def: "Buyers whose first Shopify order is in this window.",
    };
  }
  return {
    k: "Sales from first-time buyers",
    v: "—",
    def: "Needs identified first-time buyers in this window.",
  };
}

function timingHero(depth: ShopifyDepthStats): BookHero {
  if (hasShare(depth.weekendSalesShare)) {
    return {
      k: PRODUCT_NOUN.bookWeekendSales,
      v: pct(depth.weekendSalesShare),
      sub:
        depth.peakWeekday != null
          ? `Busiest weekday ${WEEKDAY_SHORT[depth.peakWeekday]}.`
          : undefined,
      def: "Saturday + Sunday share of sales, shop-local.",
    };
  }
  if (depth.peakWeekday != null) {
    return {
      k: PRODUCT_NOUN.bookBusiestWeekday,
      v: WEEKDAY_SHORT[depth.peakWeekday]!,
      def: "Weekday with the most sales, shop-local.",
    };
  }
  if (depth.peakHour != null) {
    return {
      k: PRODUCT_NOUN.bookBusiestHour,
      v: formatHourRangeLabel(depth.peakHour),
      def: PRODUCT_NOUN.bookBusiestHourDef,
    };
  }
  return {
    k: PRODUCT_NOUN.bookWeekendSales,
    v: "—",
    def: "Needs five days with sales before a weekend pattern is real.",
  };
}

function periodRows(
  book: ShopifyNativePeriodStats,
  depth: ShopifyDepthStats,
): BookRow[] {
  const rows: BookRow[] = [];
  if (isNum(depth.aovP25) && isNum(depth.aovP75)) {
    rows.push({
      k: PRODUCT_NOUN.bookMostOrders,
      v: `${formatCurrency(depth.aovP25)}–${formatCurrency(depth.aovP75)}`,
      d: PRODUCT_NOUN.bookMostOrdersDef,
    });
  }
  if (isNum(depth.medianDailySales)) {
    rows.push({
      k: PRODUCT_NOUN.bookTypicalDay,
      v: formatCurrency(depth.medianDailySales),
      s:
        depth.dayCountWithSales > 0
          ? `${depth.dayCountWithSales} days had sales`
          : undefined,
      d: PRODUCT_NOUN.bookTypicalDayDef,
    });
  }
  if (hasShare(depth.discountedOrderShare)) {
    rows.push({
      k: PRODUCT_NOUN.bookDiscountedOrders,
      v: pct(depth.discountedOrderShare),
      s:
        isNum(depth.meanDiscountAmount) && depth.meanDiscountAmount > 0
          ? `Typical ${formatCurrency(depth.meanDiscountAmount)} off`
          : undefined,
      d: PRODUCT_NOUN.bookDiscountedOrdersDef,
    });
  }
  if (isNum(depth.fullPriceMedianAov) && isNum(depth.discountedMedianAov)) {
    rows.push({
      k: "Typical · full price vs discounted",
      v: `${formatCurrency(depth.fullPriceMedianAov)} vs ${formatCurrency(depth.discountedMedianAov)}`,
      d: "Middle order with no discount vs with a discount. Average order value hides this.",
    });
  }
  if (isNum(depth.meanUnitCount)) {
    rows.push({
      k: PRODUCT_NOUN.bookItemsPerOrder,
      v: depth.meanUnitCount.toFixed(1),
      d: PRODUCT_NOUN.bookItemsPerOrderDef,
    });
  }
  if (hasShare(depth.multiUnitOrderShare)) {
    rows.push({
      k: "Orders with 2+ items",
      v: pct(depth.multiUnitOrderShare),
      d: "Share of orders with two or more units. Average items can hide a one-item shop.",
    });
  }
  // $0 of returns / fees is not a finding — omit rather than print a boxed $0.
  if (isNum(book.returnsDrag) && book.returnsDrag > 0) {
    rows.push({
      k: PRODUCT_NOUN.bookReturnsEdits,
      v: formatCurrency(book.returnsDrag),
      s: hasShare(book.returnsDragPct)
        ? `${pct(book.returnsDragPct)} of the original checkout total`
        : undefined,
      d: "Original checkout total minus what stands today — returns and edits.",
    });
  }
  if (isNum(depth.shippingTaxFees) && depth.shippingTaxFees > 0) {
    rows.push({
      k: "Shipping + tax",
      v: formatCurrency(depth.shippingTaxFees),
      s: hasShare(depth.shippingTaxFeesPct)
        ? `${pct(depth.shippingTaxFeesPct)} of Total Sales`
        : undefined,
      d: "Shipping, tax, duties and fees sitting above the product subtotal.",
    });
  }
  if (hasShare(depth.topDecileSalesShare)) {
    rows.push({
      k: "Biggest orders",
      v: pct(depth.topDecileSalesShare),
      d: "Share of sales from the largest 10% of orders in this window.",
    });
  }
  return rows;
}

function buyersRows(
  book: ShopifyNativePeriodStats,
  depth: ShopifyDepthStats,
): BookRow[] {
  const rows: BookRow[] = [];
  if (hasShare(book.newSalesShare) && hasShare(book.returningSalesShare)) {
    rows.push({
      k: "New vs returning dollars",
      v: `${pct(book.newSalesShare)} new · ${pct(book.returningSalesShare)} returning`,
      d: "Sales from first-time buyers vs buyers who had ordered before, in this window.",
    });
  }
  if (isNum(book.newBuyerArpu) && isNum(book.returningBuyerArpu)) {
    const newSide = formatCurrency(book.newBuyerArpu);
    const returningSide = formatCurrency(book.returningBuyerArpu);
    rows.push({
      k: PRODUCT_NOUN.bookSalesPerBuyer,
      v: `New ${newSide} · returning ${returningSide}`,
      d:
        newSide === returningSide
          ? `New and returning buyers each spent about ${newSide} per person this window.`
          : "Dollars per person in this window, not a rate.",
    });
  } else if (isNum(book.newBuyerArpu)) {
    rows.push({
      k: PRODUCT_NOUN.bookSalesPerBuyer,
      v: `New ${formatCurrency(book.newBuyerArpu)}`,
      d: "Dollars per first-time buyer. Returning buyers need a second window of orders.",
    });
  }
  if (hasShare(depth.repeatSalesShare)) {
    rows.push({
      k: "Repeat sales",
      v: pct(depth.repeatSalesShare),
      d: "Sales from buyers with two or more orders in this window.",
    });
  }
  if (book.guestOrders > 0 && hasShare(book.guestShare)) {
    rows.push({
      k: PRODUCT_NOUN.bookGuestCheckouts,
      v: pct(book.guestShare),
      s:
        isNum(depth.guestAov) && isNum(depth.identifiedAov)
          ? `Typical guest ${formatCurrency(depth.guestAov)} vs ${formatCurrency(depth.identifiedAov)} with an account`
          : `${book.guestOrders.toLocaleString()} orders without an account`,
      d: `${book.guestOrders.toLocaleString()} orders placed without a customer account.`,
    });
  }
  if (isNum(depth.oneAndDoneShare) && depth.oneAndDoneShare > 0) {
    rows.push({
      k: PRODUCT_NOUN.bookOneOrderBuyers,
      v: pct(depth.oneAndDoneShare),
      d: PRODUCT_NOUN.bookOneOrderBuyersDef,
    });
  }
  if (hasShare(depth.topCustomerSalesShare)) {
    rows.push({
      k: "Top 10% of customers",
      v: pct(depth.topCustomerSalesShare),
      d: "Share of sales from the highest-spending 10% of identified buyers this window. Not the largest orders.",
    });
  }
  if (isNum(depth.ordersPerBuyer)) {
    rows.push({
      k: PRODUCT_NOUN.bookOrdersPerBuyer,
      v: depth.ordersPerBuyer.toFixed(1),
      s: `${depth.identifiedBuyers.toLocaleString()} identified buyers in this window`,
      d: "Identified orders divided by identified buyers in this window.",
    });
  }
  return rows;
}

function growthRows(
  book: ShopifyNativePeriodStats,
  depth: ShopifyDepthStats,
): BookRow[] {
  const rows: BookRow[] = [];
  if (book.newCustomers > 0) {
    rows.push({
      k: "New customers",
      v: book.newCustomers.toLocaleString(),
      d: "Buyers whose first Shopify order is in this window.",
    });
  }
  if (isNum(depth.medianDaysToSecond)) {
    rows.push({
      k: "Days to a second order",
      v: `${Math.round(depth.medianDaysToSecond)}d`,
      s:
        depth.repeatBuyers > 0
          ? `${depth.repeatBuyers.toLocaleString()} buyers came back`
          : undefined,
      d: "Middle wait between a first and second order.",
    });
  }
  if (hasShare(depth.secondOrderWithin30Share)) {
    rows.push({
      k: PRODUCT_NOUN.bookSecondWithin30,
      v: pct(depth.secondOrderWithin30Share),
      s:
        depth.eligibleFirstTimers > 0
          ? `${depth.eligibleFirstTimers.toLocaleString()} first-time buyers had a full 30 days to come back`
          : undefined,
      d: PRODUCT_NOUN.bookSecondWithin30Def,
    });
  }
  if (
    hasShare(depth.secondOrderBuyerShare) &&
    isNum(depth.thirdPlusBuyerShare)
  ) {
    rows.push({
      k: PRODUCT_NOUN.bookSecondVsThird,
      v: `2nd ${pct(depth.secondOrderBuyerShare)} · 3rd+ ${pct(depth.thirdPlusBuyerShare)}`,
      d: PRODUCT_NOUN.bookSecondVsThirdDef,
    });
  }
  if (isNum(depth.medianSecondOrder) && isNum(depth.medianFirstOrder)) {
    rows.push({
      k: PRODUCT_NOUN.bookSecondVsFirst,
      v: `${formatCurrency(depth.medianSecondOrder)} vs ${formatCurrency(depth.medianFirstOrder)}`,
      d: PRODUCT_NOUN.bookSecondVsFirstDef,
    });
  }
  return rows;
}

function timingRows(depth: ShopifyDepthStats): BookRow[] {
  const rows: BookRow[] = [];
  if (hasShare(depth.weekendSalesShare)) {
    rows.push({
      k: PRODUCT_NOUN.bookWeekendSales,
      v: pct(depth.weekendSalesShare),
      d: "Saturday + Sunday share of sales, shop-local.",
    });
  }
  if (depth.peakWeekday != null) {
    const share = depth.weekdaySalesShare?.[depth.peakWeekday];
    rows.push({
      k: PRODUCT_NOUN.bookBusiestWeekday,
      v: WEEKDAY_SHORT[depth.peakWeekday]!,
      s: hasShare(share) ? `${pct(share)} of this window` : undefined,
      d: "Weekday with the most sales, shop-local.",
      x: weekdayBreakdown(depth.weekdaySalesShare),
    });
  }
  if (depth.peakHour != null) {
    rows.push({
      k: PRODUCT_NOUN.bookBusiestHour,
      v: formatHourRangeLabel(depth.peakHour),
      d: PRODUCT_NOUN.bookBusiestHourDef,
      x: hourBreakdown(depth.hourlySalesShare),
    });
  }
  if (hasShare(depth.bestThreeDayShare)) {
    rows.push({
      k: "Biggest three days",
      v: pct(depth.bestThreeDayShare),
      s:
        depth.dayCountWithSales > 0
          ? `${depth.dayCountWithSales} days had sales`
          : undefined,
      d: "Share of sales from the three busiest days in this window.",
    });
  }
  const mix = sourceMixLine(depth.sourceSalesShare);
  if (mix) {
    const typical = sourceTypicalAovLine(depth.sourceMedianAov);
    rows.push({
      k: PRODUCT_NOUN.bookChannelMix,
      v: mix,
      s: typical[0],
      d: PRODUCT_NOUN.bookChannelMixDef,
    });
  }
  return rows;
}

function clockItems(clocks: SalesClocks): ClockItem[] {
  return [
    clocks.grossKnown
      ? { k: "Original", v: formatCurrency(clocks.gross) }
      : null,
    {
      k: clocks.grossKnown ? "After returns" : "Total Sales",
      v: formatCurrency(clocks.total),
    },
    clocks.netKnown
      ? { k: "Product only", v: formatCurrency(clocks.net) }
      : null,
  ].filter((item): item is ClockItem => item !== null);
}

export function ShopifyBookSection({
  book,
  depth,
  clocks,
  groups = ALL_BOOK_GROUPS,
  title,
  muted,
  id,
}: {
  book: ShopifyNativePeriodStats;
  depth: ShopifyDepthStats;
  clocks: SalesClocks;
  groups?: ShopifyBookGroup[];
  title?: string;
  muted?: string;
  id?: string;
}) {
  const lead = groups[0] ?? "period";
  const hero =
    lead === "buyers"
      ? buyersHero(book, depth)
      : lead === "timing"
        ? timingHero(depth)
        : lead === "growth"
          ? growthHero(book, depth)
          : periodHero(depth);
  const rows = groups
    .flatMap((group) =>
      group === "buyers"
        ? buyersRows(book, depth)
        : group === "timing"
          ? timingRows(depth)
          : group === "growth"
            ? growthRows(book, depth)
            : periodRows(book, depth),
    )
    // One title per fact, and never a row whose only content is a dash.
    .filter((row) => row.k !== hero.k && row.v !== "—");
  const clock = groups.includes("period") ? clockItems(clocks) : [];

  return (
    <section
      className="mcfly-book mcfly-desk-anchor"
      id={id}
      aria-label={title ?? PRODUCT_NOUN.shopifyBookTitle}
    >
      <p className="mcfly-book__lede">
        {muted ?? PRODUCT_NOUN.shopifyBookMuted}
      </p>

      {hero.v !== "—" ? (
        <div className="mcfly-book__hero">
          <p className="mcfly-book__hero-k">{hero.k}</p>
          <p className="mcfly-book__hero-v">{hero.v}</p>
          {hero.sub ? (
            <p className="mcfly-book__hero-sub">{hero.sub}</p>
          ) : null}
          <p className="mcfly-book__hero-def">{hero.def}</p>
        </div>
      ) : (
        <p className="mcfly-book__lede">{hero.def}</p>
      )}

      {clock.length > 0 ? (
        <div className="mcfly-book__clock" aria-label={PRODUCT_NOUN.bookSalesClock}>
          {clock.map((item) => (
            <div className="mcfly-book__clock-item" key={item.k}>
              <p className="mcfly-book__clock-k">{item.k}</p>
              <p className="mcfly-book__clock-v">{item.v}</p>
            </div>
          ))}
        </div>
      ) : null}

      {rows.length > 0 ? (
        <div className="mcfly-book__rows mcfly-book__rows--kpis">
          {rows.map((row) => (
            <details className="mcfly-book__row" key={row.k}>
              <summary className="mcfly-book__row-sum">
                <span className="mcfly-book__row-k">{row.k}</span>
                <span className="mcfly-book__row-v">{row.v}</span>
                {row.s ? (
                  <span className="mcfly-book__row-s">{row.s}</span>
                ) : null}
              </summary>
              <p className="mcfly-book__row-d">{row.d}</p>
              {(row.x ?? []).map((line) => (
                <p className="mcfly-book__row-d" key={line}>
                  {line}
                </p>
              ))}
            </details>
          ))}
        </div>
      ) : null}
    </section>
  );
}
