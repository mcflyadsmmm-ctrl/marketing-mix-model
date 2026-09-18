/**
 * Customers first viewport — RFM-lite, whale watch, repurchase clock,
 * win-back, and ActionCard peeks Shopify Analytics Customers does not put
 * next to a customer list. Spend / ROAS never enter these helpers.
 */

import type { DeskIconName } from "../components/DeskIcon";
import type { CustomerAnalytics } from "./customers-analytics";
import type { CustomerRfmView, RfmSegment, RfmSegmentKey } from "./customers-rfm";

export const CUSTOMERS_SPEND_BANS = [
  "Spend Upload",
  "Total ROAS",
  "Edit spend",
  "QuietSpendDoor",
] as const;

export const CUSTOMERS_PENDING_LINE =
  "Sales for closed days are still loading — not $0.";

export const CUSTOMERS_THIN_EMPTY_LINE =
  "RFM-lite, whale watch, and the repurchase clock fill after identified buyers land — not $0.";

/** First-lane label — operator value vs Shopify’s customer list. */
export const CUSTOMERS_FIRST_LANE_LABEL =
  "RFM-lite, whales, repurchase clock";

/**
 * Uninstall-killer contrast. Shopify Analytics Customers is names, emails,
 * order counts, and amount spent. Mcfly is who to reach and when.
 */
export const CUSTOMERS_ANALYTICS_CONTRAST =
  "Shopify Analytics Customers is a customer list.";

export const CUSTOMERS_FIRST_FOLD_HEROES = [
  "rfmLite",
  "whaleWatch",
  "repurchaseClock",
  "winBack",
  "actionCards",
] as const;

export type CustomersFirstFoldHero =
  (typeof CUSTOMERS_FIRST_FOLD_HEROES)[number];

export type CustomersOperatorGreetingInput = {
  salesPending: boolean;
  orderCount: number;
  identifiedBuyers: number;
  repurchaseTypicalDays?: number | null;
  whaleCount?: number | null;
  atRiskBuyers?: number | null;
};

export type CustomersHeroKind = "rfmLite" | "repurchaseClock";

export type CustomersHero = {
  kind: CustomersHeroKind;
  k: string;
  v: string;
  sub?: string;
  def: string;
};

export type CustomersPeek = {
  hero: Exclude<CustomersFirstFoldHero, "rfmLite">;
  k: string;
  v: string;
  s?: string;
  d: string;
  icon: DeskIconName;
  verb?: string;
};

export type CustomersRfmBandSlice = {
  key: RfmSegmentKey;
  label: string;
  buyers: number;
  share: number;
  verb: string;
};

function isNum(n: number | null | undefined): n is number {
  return n != null && Number.isFinite(n);
}

function wholeDays(n: number): number {
  return Math.max(1, Math.round(n));
}

/**
 * PASS only when the first-fold hero is Mcfly-differentiated — not a free
 * Shopify Analytics Customers list clone (name, email, orders, amount spent).
 */
export function customersHeroBeatsShopifyAnalytics(
  hero: CustomersFirstFoldHero,
): boolean {
  switch (hero) {
    case "rfmLite":
    case "whaleWatch":
    case "repurchaseClock":
    case "winBack":
    case "actionCards":
      return true;
    default: {
      const _never: never = hero;
      return _never;
    }
  }
}

/**
 * One shop-owner sentence. Repurchase + whales + at-risk first — never an
 * AI analyst, never a customer-count scoreboard Shopify already shows.
 */
export function customersOperatorGreeting(
  input: CustomersOperatorGreetingInput,
): string {
  if (input.salesPending) {
    return CUSTOMERS_PENDING_LINE;
  }
  if (!(input.orderCount > 0) && !(input.identifiedBuyers > 0)) {
    return "No identified buyers in this window yet.";
  }
  const repurchase =
    isNum(input.repurchaseTypicalDays) && input.repurchaseTypicalDays > 0
      ? `Typical repurchase day ${wholeDays(input.repurchaseTypicalDays)}.`
      : null;
  const whales =
    isNum(input.whaleCount) && input.whaleCount > 0
      ? `${input.whaleCount.toLocaleString()} ${input.whaleCount === 1 ? "whale" : "whales"} to reach.`
      : null;
  const atRisk =
    isNum(input.atRiskBuyers) && input.atRiskBuyers > 0
      ? `At risk: ${input.atRiskBuyers.toLocaleString()}.`
      : null;
  const parts = [repurchase, whales, atRisk].filter(
    (part): part is string => part != null,
  );
  if (parts.length === 0) {
    return CUSTOMERS_ANALYTICS_CONTRAST;
  }
  return `${parts.join(" ")} ${CUSTOMERS_ANALYTICS_CONTRAST}`;
}

function segmentLine(segments: RfmSegment[], skip?: RfmSegmentKey): string {
  return segments
    .filter((row) => row.key !== skip && row.buyers > 0)
    .map((row) => `${row.label} ${row.buyers.toLocaleString()}`)
    .join(" · ");
}

/**
 * Giant first-fold hero. RFM-lite leads when sealed; otherwise the
 * repurchase clock. Missing truths stay off — never a fake $0 board.
 */
export function buildCustomersHero(
  analytics: Pick<
    CustomerAnalytics,
    "repurchaseTypicalDays" | "winBackDay"
  >,
  rfm: Pick<CustomerRfmView, "available" | "segments">,
): CustomersHero | null {
  if (rfm.available) {
    const atRisk = rfm.segments.find((row) => row.key === "at_risk");
    const champions = rfm.segments.find((row) => row.key === "champions");
    const lead =
      atRisk && atRisk.buyers > 0
        ? atRisk
        : champions && champions.buyers > 0
          ? champions
          : rfm.segments.find((row) => row.buyers > 0) ?? null;
    if (lead) {
      const others = segmentLine(rfm.segments, lead.key);
      return {
        kind: "rfmLite",
        k: `RFM-lite · ${lead.label}`,
        v: lead.buyers.toLocaleString(),
        sub: others || lead.verb,
        def: "Recency / frequency / monetary bands from this shop's orders. Shopify Analytics Customers is a list.",
      };
    }
  }
  if (
    isNum(analytics.repurchaseTypicalDays) &&
    analytics.repurchaseTypicalDays > 0
  ) {
    const winBack =
      isNum(analytics.winBackDay) && analytics.winBackDay > 0
        ? `Win-back by day ${wholeDays(analytics.winBackDay)}`
        : undefined;
    return {
      kind: "repurchaseClock",
      k: "Typical repurchase",
      v: `Day ${wholeDays(analytics.repurchaseTypicalDays)}`,
      sub: winBack,
      def: "Median first→second gap among identified buyers. Shopify Analytics Customers is a list.",
    };
  }
  return null;
}

/** Four-segment RFM bar. Null until RFM-lite has sealed with buyers. */
export function buildCustomersRfmBand(
  rfm: Pick<CustomerRfmView, "available" | "segments">,
): CustomersRfmBandSlice[] | null {
  if (!rfm.available) return null;
  const total = rfm.segments.reduce((sum, row) => sum + row.buyers, 0);
  if (!(total > 0)) return null;
  return rfm.segments.map((row) => ({
    key: row.key,
    label: row.label,
    buyers: row.buyers,
    share: row.buyers / total,
    verb: row.verb,
  }));
}

/**
 * Whale / repurchase / win-back / Save-now peeks that sit next to RFM-lite.
 * Missing truths stay off the row — never a fake $0 / 0% graveyard.
 */
export function buildCustomersLeadPeeks(
  analytics: Pick<
    CustomerAnalytics,
    | "repurchaseTypicalDays"
    | "repurchaseFastDays"
    | "repurchaseSlowDays"
    | "winBackDay"
    | "saveNowOneOrder"
  >,
  rfm: Pick<CustomerRfmView, "watchlist">,
  options: { hideRepurchase?: boolean } = {},
): CustomersPeek[] {
  const rows: CustomersPeek[] = [];
  const leadWhale = rfm.watchlist[0];
  if (leadWhale && rfm.watchlist.length > 0) {
    rows.push({
      hero: "whaleWatch",
      k: "Whale watch",
      v: `${rfm.watchlist.length.toLocaleString()} to reach`,
      s: `Last seen ${leadWhale.daysSince}d`,
      d: "High on-file dollars, last order past 30 days. Shopify Analytics Customers is a list — it does not flag slipping whales.",
      icon: "customers",
      verb: leadWhale.verb,
    });
  }
  if (
    !options.hideRepurchase &&
    isNum(analytics.repurchaseTypicalDays) &&
    analytics.repurchaseTypicalDays > 0
  ) {
    const fastSlow =
      isNum(analytics.repurchaseFastDays) &&
      isNum(analytics.repurchaseSlowDays)
        ? `fast ${wholeDays(analytics.repurchaseFastDays)}d · slow ${wholeDays(analytics.repurchaseSlowDays)}d`
        : undefined;
    rows.push({
      hero: "repurchaseClock",
      k: "Typical repurchase",
      v: `Day ${wholeDays(analytics.repurchaseTypicalDays)}`,
      s: fastSlow,
      d: "Median first→second order among identified buyers. Shopify Analytics Customers does not put a repurchase clock next to the list.",
      icon: "clock",
      verb: "Repurchase",
    });
  }
  if (isNum(analytics.winBackDay) && analytics.winBackDay > 0) {
    rows.push({
      hero: "winBack",
      k: "Win-back by",
      v: `Day ${wholeDays(analytics.winBackDay)}`,
      s: "typical repurchase + 15 days",
      d: "Reach one-order buyers just past typical repurchase, before the slow tail. Not an email guess.",
      icon: "clock",
      verb: "Win-back",
    });
  }
  if (isNum(analytics.saveNowOneOrder) && analytics.saveNowOneOrder > 0) {
    rows.push({
      hero: "actionCards",
      k: "Save now",
      v: analytics.saveNowOneOrder.toLocaleString(),
      s: "one-order buyers past win-back",
      d: "These one-order buyers are already past the win-back day. Prioritize them first — order-history timing, not an email list.",
      icon: "customers",
      verb: "Save now",
    });
  }
  return rows;
}
