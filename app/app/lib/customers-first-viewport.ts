/**
 * Customers first viewport — returning dollars vs new, dollars per buyer,
 * and the mix chart Shopify Analytics Customers does not put next to a list.
 * RFM / whales stay below the fold. Spend / ROAS never enter these helpers.
 */

import type { DeskIconName } from "../components/DeskIcon";
import {
  CUSTOMERS_LAST_YEAR_EMPTY,
  type LastYearMix,
} from "./customers-analytics";
import type { ShopifyNativePeriodStats } from "./shopify-native-stats";

export const CUSTOMERS_SPEND_BANS = [
  "Spend Upload",
  "Total ROAS",
  "Edit spend",
  "QuietSpendDoor",
] as const;

export const CUSTOMERS_PENDING_LINE =
  "Sales for closed days are still loading — not $0.";

export const CUSTOMERS_THIN_EMPTY_LINE =
  "Returning dollars fill after paid orders — not $0.";

/** Live today hit the ~100-order cap — returning $ is not a closed day. */
export const CUSTOMERS_TODAY_TRUNCATED_LINE =
  "Live today is capped at ~100 orders for a fast desk load. Returning dollars include an incomplete today — not a closed day.";

/** Missing last-year returning $ — never a fake $0 or 0% YoY. */
export const CUSTOMERS_LAST_YEAR_NOT_ON_FILE = "not on file";

/** First-lane label — returning $ vs new, all store sizes, not RFM-lite. */
export const CUSTOMERS_FIRST_LANE_LABEL = "Returning dollars vs new";

/**
 * Uninstall-killer contrast. Shopify Analytics Customers is names, emails,
 * order counts, and amount spent. Mcfly is returning dollars next to new.
 */
export const CUSTOMERS_ANALYTICS_CONTRAST =
  "Shopify Analytics Customers is a customer list.";

export const CUSTOMERS_FIRST_FOLD_HEROES = [
  "returningDollars",
  "newDollars",
  "dollarsPerBuyer",
  "mixChart",
] as const;

export type CustomersFirstFoldHero =
  (typeof CUSTOMERS_FIRST_FOLD_HEROES)[number];

export const CUSTOMERS_PANELS = [
  "returning",
  "ltv",
  "growth",
  "depth",
] as const;

export type CustomersPanel = (typeof CUSTOMERS_PANELS)[number];

export function parseCustomersPanel(
  raw: string | null | undefined,
): CustomersPanel | null {
  switch (raw) {
    case "returning":
    case "ltv":
    case "growth":
    case "depth":
      return raw;
    default:
      return null;
  }
}

/** Preserve hosted / shot / period / embed and set panel= for Growth / LTV redirects. */
export function customersPanelRedirectPath(
  request: Request,
  dest: "/app/customers" | "/demo/customers",
  panel: "growth" | "ltv",
): string {
  const url = new URL(request.url);
  const next = new URLSearchParams(url.searchParams);
  next.set("panel", panel);
  return `${dest}?${next.toString()}`;
}

export type CustomersOperatorGreetingInput = {
  salesPending: boolean;
  orderCount: number;
  identifiedBuyers: number;
  returningShare?: number | null;
  newShare?: number | null;
  todaySalesTruncated: boolean;
};

export type CustomersHeroKind = "returningDollars" | "newDollars";

export type CustomersHero = {
  kind: CustomersHeroKind;
  k: string;
  amount: number;
  counterpartAmount: number | null;
  counterpartShare: number | null;
  def: string;
  todayTruncated: boolean;
  lastYearOnFile: boolean;
  lastYearAmount: number | null;
  yoyPct: number | null;
};

export type CustomersHeroHonesty = {
  todaySalesTruncated: boolean;
  lastYear: LastYearMix;
};

export type CustomersPeek = {
  hero: Exclude<CustomersFirstFoldHero, "returningDollars" | "mixChart">;
  k: string;
  amount: number;
  s?: string;
  d: string;
  icon: DeskIconName;
  verb?: string;
};

function isNum(n: number | null | undefined): n is number {
  return n != null && Number.isFinite(n);
}

function wholePercent(share: number): number {
  return Math.round(share * 100);
}

/**
 * PASS only when the first-fold hero is Mcfly-differentiated — not a free
 * Shopify Analytics Customers list clone (name, email, orders, amount spent)
 * and not a returning-customer headcount rate.
 */
export function customersHeroBeatsShopifyAnalytics(
  hero: CustomersFirstFoldHero,
): boolean {
  switch (hero) {
    case "returningDollars":
    case "newDollars":
    case "dollarsPerBuyer":
    case "mixChart":
      return true;
    default: {
      const _never: never = hero;
      return _never;
    }
  }
}

/**
 * One shop-owner sentence. Returning vs new dollars first — never an
 * AI analyst, never a customer-count scoreboard Shopify already shows.
 */
export function customersOperatorGreeting(
  input: CustomersOperatorGreetingInput,
): string {
  if (input.salesPending) {
    return CUSTOMERS_PENDING_LINE;
  }
  if (input.todaySalesTruncated) {
    return CUSTOMERS_TODAY_TRUNCATED_LINE;
  }
  if (!(input.orderCount > 0) && !(input.identifiedBuyers > 0)) {
    return "No identified buyers in this window yet.";
  }
  const returningPct =
    isNum(input.returningShare) && wholePercent(input.returningShare) > 0
      ? wholePercent(input.returningShare)
      : null;
  const newPct =
    isNum(input.newShare) && wholePercent(input.newShare) > 0
      ? wholePercent(input.newShare)
      : null;
  if (returningPct != null && newPct != null) {
    return `Returning dollars ${returningPct}% vs new ${newPct}%. ${CUSTOMERS_ANALYTICS_CONTRAST}`;
  }
  if (returningPct != null) {
    return `Returning dollars ${returningPct}% of this window. ${CUSTOMERS_ANALYTICS_CONTRAST}`;
  }
  if (newPct != null) {
    return `New dollars ${newPct}% of this window. ${CUSTOMERS_ANALYTICS_CONTRAST}`;
  }
  return CUSTOMERS_ANALYTICS_CONTRAST;
}

export function customersLastYearLine(
  hero: { lastYearOnFile: boolean; lastYearAmount: number | null },
  money?: (n: number) => string,
): string {
  if (!hero.lastYearOnFile) {
    return `Last year ${CUSTOMERS_LAST_YEAR_NOT_ON_FILE}`;
  }
  if (
    hero.lastYearAmount != null &&
    hero.lastYearAmount > 0 &&
    money
  ) {
    return `Last year ${money(hero.lastYearAmount)}`;
  }
  return "Last year —";
}

function heroLastYear(lastYear: LastYearMix): {
  lastYearOnFile: boolean;
  lastYearAmount: number | null;
  yoyPct: null;
} {
  const lastYearAmount =
    lastYear.onFile &&
    lastYear.returningSales != null &&
    lastYear.returningSales > 0
      ? lastYear.returningSales
      : null;
  return {
    lastYearOnFile: lastYear.onFile,
    lastYearAmount,
    yoyPct: null,
  };
}

/**
 * Giant first-fold hero. Returning dollars lead when on file; otherwise new
 * dollars. Missing truths stay off — never a fake $0 board.
 */
export function buildCustomersHero(
  book: Pick<
    ShopifyNativePeriodStats,
    "returningSales" | "newSales" | "returningSalesShare" | "newSalesShare"
  >,
  honesty: CustomersHeroHonesty = {
    todaySalesTruncated: false,
    lastYear: CUSTOMERS_LAST_YEAR_EMPTY,
  },
): CustomersHero | null {
  const year = heroLastYear(honesty.lastYear);
  if (isNum(book.returningSales) && book.returningSales > 0) {
    const newSales =
      isNum(book.newSales) && book.newSales > 0 ? book.newSales : null;
    return {
      kind: "returningDollars",
      k: "Returning dollars",
      amount: book.returningSales,
      counterpartAmount: newSales,
      counterpartShare: isNum(book.newSalesShare) ? book.newSalesShare : null,
      def: "Sales from buyers who had ordered before. Shopify Analytics Customers is a list — it does not put returning dollars next to new.",
      todayTruncated: honesty.todaySalesTruncated,
      ...year,
    };
  }
  if (isNum(book.newSales) && book.newSales > 0) {
    return {
      kind: "newDollars",
      k: "New dollars",
      amount: book.newSales,
      counterpartAmount: null,
      counterpartShare: isNum(book.returningSalesShare)
        ? book.returningSalesShare
        : null,
      def: "Sales from first-time buyers in this window. Returning dollars fill after paid orders — not $0.",
      todayTruncated: honesty.todaySalesTruncated,
      ...year,
    };
  }
  return null;
}

/**
 * New-dollar / $ per buyer peeks that sit next to the returning hero.
 * Missing truths stay off the row — never a fake $0 / 0% graveyard.
 */
export function buildCustomersLeadPeeks(
  book: Pick<
    ShopifyNativePeriodStats,
    | "newSales"
    | "returningSales"
    | "newBuyerArpu"
    | "returningBuyerArpu"
    | "newSalesShare"
  >,
  options: { hideNewDollars?: boolean } = {},
): CustomersPeek[] {
  const rows: CustomersPeek[] = [];
  if (
    !options.hideNewDollars &&
    isNum(book.newSales) &&
    book.newSales > 0
  ) {
    const share =
      isNum(book.newSalesShare) && wholePercent(book.newSalesShare) > 0
        ? `${wholePercent(book.newSalesShare)}% of sales`
        : undefined;
    rows.push({
      hero: "newDollars",
      k: "New dollars",
      amount: book.newSales,
      s: share,
      d: "Sales from first-time buyers in this window. Shopify Analytics Customers is a list — it does not split returning vs new dollars.",
      icon: "customers",
      verb: "New",
    });
  }
  const perBuyer =
    isNum(book.returningBuyerArpu) && book.returningBuyerArpu > 0
      ? book.returningBuyerArpu
      : isNum(book.newBuyerArpu) && book.newBuyerArpu > 0
        ? book.newBuyerArpu
        : null;
  if (perBuyer != null) {
    const both =
      isNum(book.returningBuyerArpu) &&
      book.returningBuyerArpu > 0 &&
      isNum(book.newBuyerArpu) &&
      book.newBuyerArpu > 0;
    rows.push({
      hero: "dollarsPerBuyer",
      k: "Dollars per buyer",
      amount: perBuyer,
      s: both ? "Returning vs new spend differently" : undefined,
      d: "Window sales dollars per unique buyer. Shopify Analytics Customers lists amount spent per name — not the mix.",
      icon: "customers",
      verb: "Per buyer",
    });
  }
  return rows;
}
