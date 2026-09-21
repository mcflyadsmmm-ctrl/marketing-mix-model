/**
 * Growth first viewport — days-to-second / win-back / habit from order
 * history. Shopify Analytics customers is a returning-customer rate.
 * First-time dollars, sessions, and the come-back explorer stay below.
 * Spend / ROAS never enter these helpers.
 */

import {
  growthTt2Read,
  TT2_MIN_GAPS,
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

export type GrowthHabitDay = {
  label: string;
  buyers: number;
  /** Green bar — the bucket that holds the typical wait. The rest stay grey. */
  holdsTypical: boolean;
};

export type GrowthWeekendDepth = {
  mode: "weekend" | "weekday";
  /** Whole percent when Sat–Sun is a real share. Weekday habit never paints 0%. */
  value: string;
  sub: string;
  /** Width of the green Sat–Sun slice, 0–1. Weekday habit is all grey. */
  weekendFill: number;
  detail: string;
};

export type GrowthHabitDepth = {
  days: GrowthHabitDay[];
  daysLine: string;
  weekend: GrowthWeekendDepth | null;
};

function holdsTypicalWait(
  bucket: { min: number; max: number | null },
  typicalDays: number,
): boolean {
  return (
    typicalDays >= bucket.min &&
    (bucket.max == null || typicalDays <= bucket.max)
  );
}

/**
 * First-fold habit depth under the #115 heroes. Days-to-second shape plus
 * when the second order landed (Sat–Sun vs Mon–Fri). Null until the clock
 * has a real typical wait — never a 0d / 0% strip.
 */
export function buildGrowthHabitDepth(
  tt2: GrowthTt2View,
): GrowthHabitDepth | null {
  if (!tt2.available || tt2.empty) return null;
  if (!isNum(tt2.typicalDays) || tt2.typicalDays <= 0) return null;
  const typicalDays = tt2.typicalDays;
  const days = tt2.daysToSecond.map((bucket) => ({
    label: bucket.label,
    buyers: bucket.buyers,
    holdsTypical: holdsTypicalWait(bucket, typicalDays),
  }));
  const home = days.find((bucket) => bucket.holdsTypical);
  const daysLine = home
    ? `Typical wait sits in ${home.label}. Green is that wait — grey is the rest of the second-order habit.`
    : "Where second orders landed. Green marks the typical wait.";
  return {
    days,
    daysLine,
    weekend: growthWeekendDepth(tt2),
  };
}

function growthWeekendDepth(tt2: GrowthTt2View): GrowthWeekendDepth | null {
  const habit = tt2.weekend;
  const secondOrders = habit.weekendCount + habit.weekdayCount;
  if (secondOrders < TT2_MIN_GAPS) return null;
  if (habit.weekendShare != null && Math.round(habit.weekendShare * 100) > 0) {
    const pct = Math.round(habit.weekendShare * 100);
    const peak =
      habit.peakDay != null && habit.peakCount >= 2
        ? ` Most second orders land ${habit.peakDay}.`
        : "";
    return {
      mode: "weekend",
      value: `${pct}%`,
      sub: `${habit.weekendCount.toLocaleString()} of ${secondOrders.toLocaleString()} second orders on Sat–Sun.${peak}`,
      weekendFill: habit.weekendShare,
      detail:
        "Share of identified buyers whose second order landed Saturday or Sunday, on the shop’s calendar. Order-history repurchase timing — not weekend sales, not an email list.",
    };
  }
  if (habit.weekendCount === 0 && habit.weekdayCount >= TT2_MIN_GAPS) {
    const peak =
      habit.peakDay != null && habit.peakCount >= 2
        ? ` Most second orders land ${habit.peakDay}.`
        : "";
    return {
      mode: "weekday",
      value: "Weekday habit",
      sub: `Second orders are landing Mon–Fri. Weekend share stays off — not 0%.${peak}`,
      weekendFill: 0,
      detail:
        "None of the second orders on file landed Saturday or Sunday. Weekend share stays off the card until Sat–Sun shows up — not a fake 0%. Order history only.",
    };
  }
  return null;
}
