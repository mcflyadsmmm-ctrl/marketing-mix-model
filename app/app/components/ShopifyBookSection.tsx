import { formatCurrency } from "../lib/mer-format";
import { PRODUCT_NOUN } from "../lib/product-labels";
import {
  WEEKDAY_SHORT,
  formatHourRangeLabel,
  type ShopifyDepthStats,
} from "../lib/shopify-depth-stats";
import type { ShopifyNativePeriodStats } from "../lib/shopify-native-stats";

export type ShopifyBookGroup = "period" | "buyers" | "timing";

const ALL_BOOK_GROUPS: ShopifyBookGroup[] = ["period", "buyers", "timing"];

type SalesClocks = {
  gross: number;
  grossKnown: boolean;
  total: number;
  net: number;
  netKnown: boolean;
};

/** One impressive number per page. */
type BookHero = { k: string; v: string; def: string };

/** Drill-down line: summary always visible, definition + extras on open. */
type BookRow = { k: string; v: string; d: string };

type ClockItem = { k: string; v: string };

/** Whole percents in merchant chrome — 25%, never 25.0%. */
function pct(share: number): string {
  return `${Math.round(share * 100)}%`;
}

function isNum(n: number | null | undefined): n is number {
  return n != null && Number.isFinite(n);
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

function periodHero(depth: ShopifyDepthStats): BookHero {
  const middle = isNum(depth.medianAov) ? depth.medianAov : null;
  const value = middle ?? (isNum(depth.meanAov) ? depth.meanAov : null);
  const def =
    middle != null && isNum(depth.meanAov)
      ? `${PRODUCT_NOUN.bookTypicalOrderDef} Average ${formatCurrency(depth.meanAov)}.`
      : PRODUCT_NOUN.bookTypicalOrderDef;
  return {
    k: PRODUCT_NOUN.bookTypicalOrder,
    v: value != null ? formatCurrency(value) : "—",
    def:
      value != null
        ? `${def} ${depth.orderCount.toLocaleString()} orders in this window.`
        : "Needs paid orders in this window.",
  };
}

function buyersHero(
  book: ShopifyNativePeriodStats,
  depth: ShopifyDepthStats,
): BookHero {
  if (isNum(book.returningSalesShare)) {
    const newBit = isNum(book.newSalesShare)
      ? ` First-time buyers brought ${pct(book.newSalesShare)}.`
      : "";
    return {
      k: "Sales from returning customers",
      v: pct(book.returningSalesShare),
      def: `Share of this window’s sales from buyers who had ordered before.${newBit}`,
    };
  }
  if (isNum(depth.repeatSalesShare)) {
    return {
      k: "Repeat sales",
      v: pct(depth.repeatSalesShare),
      def: "Sales from buyers with two or more orders in this window.",
    };
  }
  return {
    k: "Sales from returning customers",
    v: "—",
    def: "Needs identified buyers in this window.",
  };
}

function timingHero(depth: ShopifyDepthStats): BookHero {
  if (isNum(depth.weekendSalesShare)) {
    const peak =
      depth.peakWeekday != null
        ? ` Busiest weekday ${WEEKDAY_SHORT[depth.peakWeekday]}.`
        : "";
    return {
      k: PRODUCT_NOUN.bookWeekendSales,
      v: pct(depth.weekendSalesShare),
      def: `Saturday + Sunday share of sales, shop-local.${peak}`,
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
      d: `${PRODUCT_NOUN.bookTypicalDayDef} ${depth.dayCountWithSales} days had sales in this window.`,
    });
  }
  if (isNum(depth.discountedOrderShare)) {
    const off =
      isNum(depth.meanDiscountAmount) && depth.meanDiscountAmount > 0
        ? ` Typical ${formatCurrency(depth.meanDiscountAmount)} off.`
        : "";
    rows.push({
      k: PRODUCT_NOUN.bookDiscountedOrders,
      v: pct(depth.discountedOrderShare),
      d: `${PRODUCT_NOUN.bookDiscountedOrdersDef}${off}`,
    });
  }
  if (isNum(depth.meanUnitCount)) {
    rows.push({
      k: PRODUCT_NOUN.bookItemsPerOrder,
      v: depth.meanUnitCount.toFixed(1),
      d: PRODUCT_NOUN.bookItemsPerOrderDef,
    });
  }
  if (isNum(book.returnsDrag)) {
    const share = isNum(book.returnsDragPct)
      ? ` ${pct(book.returnsDragPct)} of the original checkout total.`
      : "";
    rows.push({
      k: PRODUCT_NOUN.bookReturnsEdits,
      v: formatCurrency(book.returnsDrag),
      d: `Original checkout total minus what stands today — returns and edits.${share}`,
    });
  }
  if (isNum(depth.shippingTaxFees)) {
    const share = isNum(depth.shippingTaxFeesPct)
      ? ` ${pct(depth.shippingTaxFeesPct)} of Total Sales.`
      : "";
    rows.push({
      k: "Shipping + tax",
      v: formatCurrency(depth.shippingTaxFees),
      d: `Shipping, tax, duties and fees sitting above the product subtotal.${share}`,
    });
  }
  return rows;
}

function buyersRows(
  book: ShopifyNativePeriodStats,
  depth: ShopifyDepthStats,
): BookRow[] {
  const rows: BookRow[] = [];
  if (isNum(book.newSalesShare) && isNum(book.returningSalesShare)) {
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
  if (isNum(depth.repeatSalesShare)) {
    rows.push({
      k: "Repeat sales",
      v: pct(depth.repeatSalesShare),
      d: "Sales from buyers with two or more orders in this window.",
    });
  }
  if (isNum(depth.medianDaysToSecond)) {
    rows.push({
      k: "Days to a second order",
      v: `${Math.round(depth.medianDaysToSecond)}d`,
      d: `Middle wait between a first and second order. ${depth.repeatBuyers.toLocaleString()} buyers came back in this window.`,
    });
  }
  if (isNum(depth.secondOrderWithin30Share)) {
    rows.push({
      k: PRODUCT_NOUN.bookSecondWithin30,
      v: pct(depth.secondOrderWithin30Share),
      d: PRODUCT_NOUN.bookSecondWithin30Def,
    });
  }
  if (isNum(depth.secondOrderBuyerShare) && isNum(depth.thirdPlusBuyerShare)) {
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
  if (book.guestOrders > 0 && isNum(book.guestShare)) {
    rows.push({
      k: PRODUCT_NOUN.bookGuestCheckouts,
      v: pct(book.guestShare),
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
  if (isNum(depth.topDecileSalesShare)) {
    rows.push({
      k: "Biggest orders",
      v: pct(depth.topDecileSalesShare),
      d: "Share of sales from the largest 10% of orders in this window.",
    });
  }
  if (isNum(depth.ordersPerBuyer)) {
    rows.push({
      k: PRODUCT_NOUN.bookOrdersPerBuyer,
      v: depth.ordersPerBuyer.toFixed(1),
      d: `${depth.identifiedBuyers.toLocaleString()} identified buyers in this window.`,
    });
  }
  return rows;
}

function timingRows(depth: ShopifyDepthStats): BookRow[] {
  const rows: BookRow[] = [];
  if (isNum(depth.weekendSalesShare)) {
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
      d: isNum(share)
        ? `Weekday with the most sales — ${pct(share)} of this window.`
        : "Weekday with the most sales, shop-local.",
    });
  }
  if (depth.peakHour != null) {
    rows.push({
      k: PRODUCT_NOUN.bookBusiestHour,
      v: formatHourRangeLabel(depth.peakHour),
      d: PRODUCT_NOUN.bookBusiestHourDef,
    });
  }
  if (isNum(depth.bestThreeDayShare)) {
    rows.push({
      k: "Biggest three days",
      v: pct(depth.bestThreeDayShare),
      d: `Share of sales from the three busiest days of the ${depth.dayCountWithSales} days with sales.`,
    });
  }
  const mix = sourceMixLine(depth.sourceSalesShare);
  if (mix) {
    rows.push({
      k: PRODUCT_NOUN.bookChannelMix,
      v: mix,
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
}: {
  book: ShopifyNativePeriodStats;
  depth: ShopifyDepthStats;
  clocks: SalesClocks;
  groups?: ShopifyBookGroup[];
  title?: string;
  muted?: string;
}) {
  const lead = groups[0] ?? "period";
  const hero =
    lead === "buyers"
      ? buyersHero(book, depth)
      : lead === "timing"
        ? timingHero(depth)
        : periodHero(depth);
  const rows = groups
    .flatMap((group) =>
      group === "buyers"
        ? buyersRows(book, depth)
        : group === "timing"
          ? timingRows(depth)
          : periodRows(book, depth),
    )
    .filter((row) => row.k !== hero.k);
  const clock = groups.includes("period") ? clockItems(clocks) : [];

  return (
    <section
      className="mcfly-book"
      aria-label={title ?? PRODUCT_NOUN.shopifyBookTitle}
    >
      <p className="mcfly-book__lede">
        {muted ?? PRODUCT_NOUN.shopifyBookMuted}
      </p>

      {hero.v !== "—" ? (
        <div className="mcfly-book__hero">
          <p className="mcfly-book__hero-k">{hero.k}</p>
          <p className="mcfly-book__hero-v">{hero.v}</p>
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
        <div className="mcfly-book__rows">
          {rows.map((row) => (
            <details className="mcfly-book__row" key={row.k}>
              <summary className="mcfly-book__row-sum">
                <span className="mcfly-book__row-k">{row.k}</span>
                <span className="mcfly-book__row-v">{row.v}</span>
              </summary>
              <p className="mcfly-book__row-d">{row.d}</p>
            </details>
          ))}
        </div>
      ) : null}
    </section>
  );
}
