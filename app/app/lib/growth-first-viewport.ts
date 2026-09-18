/**
 * Growth first viewport — days-to-second / win-back / habit from order
 * history. Shopify Analytics customers is a returning-customer rate.
 * First-time dollars, sessions, and the come-back explorer stay below.
 * Spend / ROAS never enter these helpers.
 */

import {
  growthTt2Read,
  type GrowthTt2View,
} from "./growth-tt2";

export const GROWTH_PENDING_LINE =
  "Sales for closed days are still loading — not $0.";

export const GROWTH_THIN_EMPTY_LINE =
  "Typical wait, win-back, and who to reach fill after identified buyers live 30 days — not $0.";

/** First-lane label — repurchase clock, not a returning-rate scoreboard. */
export const GROWTH_FIRST_LANE_LABEL = "Days to a second order";

/**
 * Uninstall-killer contrast. Shopify Analytics customers / Growth is a
 * returning-customer *rate*. Mcfly is the middle wait and when to re-engage.
 */
export const GROWTH_ANALYTICS_CONTRAST =
  "Shopify Analytics customers is a returning-customer rate.";

export const GROWTH_FIRST_FOLD_HEROES = [
  "typicalWait",
  "winBackClock",
  "reachNow",
  "habitMetrics",
  "comeBack30",
] as const;

export type GrowthFirstFoldHero = (typeof GROWTH_FIRST_FOLD_HEROES)[number];

export type GrowthOperatorGreetingInput = {
  salesPending: boolean;
  tt2: GrowthTt2View;
};

export type GrowthLeadPeek = {
  k: string;
  v: string;
  s?: string;
  d: string;
  icon: "clock" | "customers" | "orders";
};

function isNum(n: number | null | undefined): n is number {
  return n != null && Number.isFinite(n);
}

function dayLabel(n: number): string {
  return `${Math.round(n)}d`;
}

/**
 * PASS only when the first-fold hero is Mcfly-differentiated — not a free
 * Shopify Analytics customers / Growth clone (returning rate, sessions,
 * new-customer headcount, first-time sales).
 */
export function growthHeroBeatsShopifyAnalytics(
  hero: GrowthFirstFoldHero,
): boolean {
  switch (hero) {
    case "typicalWait":
    case "winBackClock":
    case "reachNow":
    case "habitMetrics":
    case "comeBack30":
      return true;
    default: {
      const _never: never = hero;
      return _never;
    }
  }
}

/** Giant-hero label. Null until a real typical wait exists — never a fake 0d. */
export function growthTypicalWaitLabel(tt2: GrowthTt2View): string | null {
  if (tt2.empty) return null;
  if (!isNum(tt2.typicalDays) || tt2.typicalDays <= 0) return null;
  return dayLabel(tt2.typicalDays);
}

/** Fast / slow habit sub under typical wait. Null until both exist. */
export function growthHabitSub(tt2: GrowthTt2View): string | null {
  if (tt2.empty) return null;
  if (!isNum(tt2.fastDays) || !isNum(tt2.slowDays)) return null;
  return `fast ${dayLabel(tt2.fastDays)} · slow ${dayLabel(tt2.slowDays)}`;
}

/**
 * One shop-owner sentence. Typical wait + who to reach, then the Analytics
 * foil — never an AI analyst, never a returning-rate clone.
 */
export function growthOperatorGreeting(
  input: GrowthOperatorGreetingInput,
): string {
  if (input.salesPending && !input.tt2.available) {
    return GROWTH_PENDING_LINE;
  }
  if (input.tt2.empty) {
    return GROWTH_THIN_EMPTY_LINE;
  }
  const read = growthTt2Read(input.tt2);
  if (read?.line) {
    return `${read.line} ${GROWTH_ANALYTICS_CONTRAST}`;
  }
  return GROWTH_ANALYTICS_CONTRAST;
}

/**
 * Win-back + reach-now + 30-day come-back (or habit span) next to typical wait.
 * Missing truths stay off the row — never a fake $0 / 0% / 0d graveyard.
 */
export function buildGrowthLeadPeeks(tt2: GrowthTt2View): GrowthLeadPeek[] {
  if (tt2.empty || !tt2.available) return [];
  const rows: GrowthLeadPeek[] = [];
  if (isNum(tt2.winBackDay) && tt2.winBackDay > 0) {
    rows.push({
      k: "Win-back by",
      v: dayLabel(tt2.winBackDay),
      s: "typical wait + 15 days",
      d: "Reach one-order buyers by this day — just past typical wait, before the slow tail falls off. Shopify Analytics does not time a second ask.",
      icon: "clock",
    });
    rows.push({
      k: "Reach now",
      v: tt2.reachNow.toLocaleString(),
      s: "one-order buyers past win-back",
      d: "Identified one-order buyers already past the win-back day. Order-history timing — not an email list, not a returning-customer rate.",
      icon: "customers",
    });
  }
  if (isNum(tt2.within30Share) && Math.round(tt2.within30Share * 100) > 0) {
    rows.push({
      k: "Came back ≤30d",
      v: `${Math.round(tt2.within30Share * 100)}%`,
      s:
        tt2.eligible30 > 0
          ? `${tt2.within30Count.toLocaleString()} of ${tt2.eligible30.toLocaleString()} eligible`
          : "order history, not email",
      d: "Share of identified first-timers who placed a second order within 30 days. Shopify Analytics customers is a returning-customer rate.",
      icon: "orders",
    });
  } else if (isNum(tt2.habitSpanDays) && tt2.habitSpanDays > 0) {
    rows.push({
      k: "Habit span",
      v: dayLabel(tt2.habitSpanDays),
      s: "slow minus fast",
      d: "How spread the second-order habit is. Fast and slow waits from this shop’s order history.",
      icon: "clock",
    });
  }
  return rows;
}
