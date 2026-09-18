/**
 * Soft order-history Goals — LTV target + returning-$ target.
 * Habit stickiness. Zero spend. No ads / upload.
 *
 * Progress is observed order history vs a number the merchant typed:
 *   LTV progress      = observed first-90 $ (then 30; never a fake year)
 *                     ÷ LTV target
 *   Returning progress = year returning $ (guests out)
 *                     ÷ returning-$ target
 *
 * Thin shops stay honest empties (syncing / thin / young / unset). Floor is
 * 8 paid orders. Never a blank board, never a fake $0, never a fake year.
 *
 * Pure + Prisma-free so it unit-tests away from the loader.
 */

import {
  pickShareableLtvPeek,
  shareableLtvWindowLabel,
  type ShareableLtvPeekDays,
} from "./shareable-insights";

export const HABIT_GOALS_MIN_ORDERS = 8;

/** SAMPLE Snowdevil LTV target — just under the observed ~$380 so the track reads as a win. */
export const SAMPLE_HABIT_LTV_TARGET = 360;
/**
 * SAMPLE year returning-$ stretch. Snowdevil’s book is ~$4k/day; a mid-year
 * board should show real progress, not a met-on-day-one or a fake $0.
 */
export const SAMPLE_HABIT_RETURNING_TARGET = 800_000;

export const HABIT_LTV_FORMULA_EQ = "LTV progress = observed first-window $ ÷ your target";
export const HABIT_RETURNING_FORMULA_EQ =
  "Returning $ progress = year returning $ ÷ your target";

export type HabitGoalKind = "ltv" | "returning";

export type HabitGoalEmptyKind = "syncing" | "thin" | "young" | "unset";

export type HabitGoalEmpty = {
  kind: HabitGoalEmptyKind;
  orders: number;
  need: number;
  copy: string;
  verb: string;
};

export type HabitGoalTrack = {
  kind: HabitGoalKind;
  label: string;
  actual: number;
  target: number;
  remaining: number;
  /** 0–1+; may exceed 1 when they beat the target. */
  pct: number;
  met: boolean;
  formulaEq: string;
  formulaPlug: string;
  windowLabel: string;
  historyLimited: boolean;
};

export type HabitGoalsView = {
  available: boolean;
  empty: HabitGoalEmpty | null;
  ltv: HabitGoalTrack | null;
  returning: HabitGoalTrack | null;
  historyLimited: boolean;
  orderCount: number;
  yearLabel: string;
  /** Resolved targets (SAMPLE overlay when unset). */
  ltvTarget: number | null;
  returningTarget: number | null;
};

export type HabitGoalsRead = {
  line: string;
  ltvPct: number | null;
  returningPct: number | null;
};

export type HabitGoalsInput = {
  salesPending: boolean;
  orderCount: number;
  ltv30: number | null;
  ltv90: number | null;
  ltv365: number | null;
  yearReturningSales: number | null;
  typedLtvTarget: number | null;
  typedReturningTarget: number | null;
  historyLimited: boolean;
  sample: boolean;
  year: number;
};

function finitePositive(n: number | null | undefined): number | null {
  if (n == null || !Number.isFinite(n) || n <= 0) return null;
  return n;
}

function wholeMoney(n: number): string {
  return Math.round(n).toLocaleString("en-US");
}

function wholePct(share: number): number {
  return Math.round(share * 100);
}

/**
 * Typed target wins. SAMPLE paints a stretch when the merchant has not
 * typed one — so Snowdevil is never a blank / $0 board.
 */
export function resolveHabitTarget(
  typed: number | null | undefined,
  sampleFallback: number,
  sample: boolean,
): number | null {
  const n = finitePositive(typed);
  if (n != null) return n;
  return sample ? sampleFallback : null;
}

/**
 * Empty / invalid → null (unset). Negative / NaN → NaN (reject).
 * Whole dollars; commas and $ stripped.
 */
export function parseHabitGoalInput(
  raw: FormDataEntryValue | null,
): number | null {
  const cleaned = String(raw ?? "")
    .replace(/[$,\s]/g, "")
    .trim();
  if (cleaned === "") return null;
  const n = Number.parseFloat(cleaned);
  if (!Number.isFinite(n) || n < 0) return Number.NaN;
  if (n === 0) return null;
  return n;
}

export function habitLtvWindowLabel(days: ShareableLtvPeekDays): string {
  return shareableLtvWindowLabel(days);
}

function ltvTrack(
  peek: { amount: number; days: ShareableLtvPeekDays },
  target: number,
  historyLimited: boolean,
): HabitGoalTrack {
  const remaining = Math.max(0, target - peek.amount);
  const pct = peek.amount / target;
  const window = habitLtvWindowLabel(peek.days);
  return {
    kind: "ltv",
    label: "New-buyer worth",
    actual: peek.amount,
    target,
    remaining,
    pct,
    met: peek.amount >= target,
    formulaEq: HABIT_LTV_FORMULA_EQ,
    formulaPlug: `${wholeMoney(peek.amount)} ÷ ${wholeMoney(target)} = ${wholePct(pct)}%.`,
    windowLabel: window,
    historyLimited: historyLimited && peek.days === 365,
  };
}

function returningTrack(
  actual: number,
  target: number,
  year: number,
  historyLimited: boolean,
): HabitGoalTrack {
  const remaining = Math.max(0, target - actual);
  const pct = actual / target;
  return {
    kind: "returning",
    label: "Returning $",
    actual,
    target,
    remaining,
    pct,
    met: actual >= target,
    formulaEq: HABIT_RETURNING_FORMULA_EQ,
    formulaPlug: `${wholeMoney(actual)} ÷ ${wholeMoney(target)} = ${wholePct(pct)}%.`,
    windowLabel: historyLimited
      ? `${year} returning $ on file — not a full year`
      : `${year} returning $`,
    historyLimited,
  };
}

/**
 * First-win empty when neither track can paint. Syncing / thin / young /
 * unset — not $0, not a blank board.
 */
export function habitGoalsEmptyState(
  orders: number,
  sealed: number,
  salesPending: boolean,
  hasAnyTarget: boolean,
): HabitGoalEmpty | null {
  const need = HABIT_GOALS_MIN_ORDERS;
  if (salesPending || orders <= 0) {
    return {
      kind: "syncing",
      orders: Math.max(0, orders),
      need,
      copy: "Orders still syncing — not $0. LTV and returning-$ targets fill as paid orders land.",
      verb: "Refresh this page",
    };
  }
  if (orders < need) {
    return {
      kind: "thin",
      orders,
      need,
      copy: `${orders.toLocaleString()} ${orders === 1 ? "order" : "orders"} on file. Order-history targets seal after ${need} paid orders — not $0.`,
      verb: "Watch the next orders",
    };
  }
  if (!hasAnyTarget) {
    return {
      kind: "unset",
      orders,
      need,
      copy: `${orders.toLocaleString()} orders on file. Type a first-window LTV target and a year returning-$ target — then this board tracks order-history progress. Not $0.`,
      verb: "Type a target",
    };
  }
  if (sealed <= 0) {
    return {
      kind: "young",
      orders,
      need,
      copy: `${orders.toLocaleString()} orders on file. Observed first-window LTV or year returning $ still need identified buyers — guests stay out — not $0.`,
      verb: "Wait for identified buyers",
    };
  }
  return null;
}

/**
 * Soft LTV + returning-$ tracks over the stored order book.
 * `historyLimited` withholds a fake first-year LTV and a “full year”
 * returning-$ claim.
 */
export function buildHabitGoals(input: HabitGoalsInput): HabitGoalsView {
  const orderCount = Math.max(
    0,
    Math.trunc(Number.isFinite(input.orderCount) ? input.orderCount : 0),
  );
  const yearLabel = String(input.year);
  const ltvTarget = resolveHabitTarget(
    input.typedLtvTarget,
    SAMPLE_HABIT_LTV_TARGET,
    input.sample,
  );
  const returningTarget = resolveHabitTarget(
    input.typedReturningTarget,
    SAMPLE_HABIT_RETURNING_TARGET,
    input.sample,
  );
  const peek = pickShareableLtvPeek({
    revenue30: input.ltv30,
    revenue90: input.ltv90,
    revenue365: input.ltv365,
    historyLimited: input.historyLimited,
  });
  const yearReturning = finitePositive(input.yearReturningSales);
  const ltv =
    peek != null && ltvTarget != null
      ? ltvTrack(peek, ltvTarget, input.historyLimited)
      : null;
  const returning =
    yearReturning != null && returningTarget != null
      ? returningTrack(
          yearReturning,
          returningTarget,
          input.year,
          input.historyLimited,
        )
      : null;
  const sealed = (ltv ? 1 : 0) + (returning ? 1 : 0);
  const empty = habitGoalsEmptyState(
    orderCount,
    sealed,
    input.salesPending,
    ltvTarget != null || returningTarget != null,
  );
  if (empty) {
    return {
      available: false,
      empty,
      ltv: null,
      returning: null,
      historyLimited: input.historyLimited,
      orderCount,
      yearLabel,
      ltvTarget,
      returningTarget,
    };
  }
  return {
    available: true,
    empty: null,
    ltv,
    returning,
    historyLimited: input.historyLimited,
    orderCount,
    yearLabel,
    ltvTarget,
    returningTarget,
  };
}

/**
 * One shop-owner sentence. Leads with LTV vs target, then returning $.
 * Never a promise. Order history only.
 */
export function habitGoalsDailyRead(view: HabitGoalsView): HabitGoalsRead | null {
  if (view.empty) return null;
  const ltvPct =
    view.ltv != null && Number.isFinite(view.ltv.pct) ? view.ltv.pct : null;
  const returningPct =
    view.returning != null && Number.isFinite(view.returning.pct)
      ? view.returning.pct
      : null;
  const parts: string[] = [];
  if (view.ltv && ltvPct != null) {
    parts.push(
      view.ltv.met
        ? `A new buyer is worth ${wholeMoney(view.ltv.actual)} in the ${view.ltv.windowLabel} — at your ${wholeMoney(view.ltv.target)} target.`
        : `A new buyer is worth ${wholeMoney(view.ltv.actual)} in the ${view.ltv.windowLabel} — ${wholePct(ltvPct)}% of your ${wholeMoney(view.ltv.target)} target.`,
    );
  }
  if (view.returning && returningPct != null) {
    parts.push(
      view.returning.met
        ? `Returning buyers already carry ${wholeMoney(view.returning.actual)} this year — at your ${wholeMoney(view.returning.target)} target.`
        : `Returning buyers carry ${wholeMoney(view.returning.actual)} this year — ${wholePct(returningPct)}% of your ${wholeMoney(view.returning.target)} target.`,
    );
  }
  if (parts.length === 0) return null;
  return {
    line: parts.join(" "),
    ltvPct,
    returningPct,
  };
}

export function habitGoalsHistoryLine(view: HabitGoalsView): string {
  if (view.historyLimited) {
    return "Observed from the stored book — not a full year, never a fake first-year.";
  }
  return `Observed from the stored ${view.yearLabel} book.`;
}

/** Honest zeros for pending / no-data — not a fake board. */
export function emptyHabitGoals(year = new Date().getFullYear()): HabitGoalsView {
  return buildHabitGoals({
    salesPending: true,
    orderCount: 0,
    ltv30: null,
    ltv90: null,
    ltv365: null,
    yearReturningSales: null,
    typedLtvTarget: null,
    typedReturningTarget: null,
    historyLimited: false,
    sample: false,
    year,
  });
}
