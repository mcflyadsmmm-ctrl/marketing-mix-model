/**
 * Typed one-day spend — the shortest path to a first trusted Total ROAS.
 *
 * Ritual: date + amount + channel → Save this day → Overview. No file, no
 * template download, no ad-network login. CSV / paste stay for backfill.
 *
 * Pure — no I/O. Religion: Total ROAS = Shopify Total Sales ÷ ad spend the
 * merchant added. This module never computes or promises a ROAS number.
 */

import type { SpendChannel } from "@mcfly/mer-engine";
import { SPEND_CHANNELS, SPEND_CHANNEL_LABELS } from "@mcfly/mer-engine";
import { missingDaysCashSentence } from "./cash-desk-copy";
import type { PeriodPreset } from "./periods";
import { PRODUCT_NOUN } from "./product-labels";
import { parseSpendAmount, parseSpendDate } from "./spend-csv";

/** Fat-finger guard for a single day on a single channel (e.g. `1e9`). */
export const QUICK_SPEND_MAX_DAY_AMOUNT = 10_000_000;

export type QuickSpendField = "date" | "amount" | "channel" | "customName";

export type QuickSpendDay = {
  /** YYYY-MM-DD calendar day. */
  dateKey: string;
  channel: SpendChannel;
  channelLabel: string;
  amount: number;
  /** Merchant-named bucket for `other`; null otherwise. */
  note: string | null;
};

export type QuickSpendDayResult =
  | { ok: true; day: QuickSpendDay; warning: string | null }
  | { ok: false; error: string; field: QuickSpendField };

export type QuickSpendDayInput = {
  date: string;
  amount: string;
  channel: string;
  customName?: string;
  /** Shop-local today (YYYY-MM-DD). Later days are refused. */
  todayKey: string;
  /**
   * Oldest day Shopify sales facts cover (YYYY-MM-DD). Older days are warned
   * about, not blocked — spend history is allowed to run past the sales window.
   */
  salesFloorKey?: string | null;
  /** Channels this desk may write. Omit to allow every named channel. */
  allowedChannels?: readonly string[];
};

export const QUICK_SPEND_COPY = {
  heading: "Add one day of spend",
  hint: "Date, amount, and channel — no file needed.",
  dateLabel: "Day",
  amountLabel: "Amount spent",
  channelLabel: "Channel",
  customNameLabel: "Name this channel",
  customNamePlaceholder: "e.g. Influencers, Agency",
  submitLabel: "Save this day",
  submitBlockedLabel: "Saving locked — turn Real store on",
  replaceNote: "Same day + channel replaces that line — it never doubles.",
  backfillHint: "Backfilling weeks or months?",
  backfillLinkLabel: "Paste rows or import a CSV",
} as const;

export const QUICK_SPEND_ERRORS = {
  dateMissing: "Pick the day this spend happened.",
  dateUnparseable: "Day must be a calendar date (YYYY-MM-DD).",
  dateFuture:
    "That day has not happened yet. Log spend for today or an earlier day.",
  amountMissing: "Enter the amount you spent that day.",
  amountNotPositive: "Amount must be more than $0.",
  amountTooLarge: `That looks like a typo — one day on one channel caps at ${QUICK_SPEND_MAX_DAY_AMOUNT.toLocaleString()}. Split it across the real days instead.`,
  channelInvalid: "Pick the channel you spent it on.",
  channelNotAllowed: "That channel is not on this desk.",
  customNameMissing: "Name this channel (e.g. Influencers).",
} as const;

function isSpendChannelValue(value: string): value is SpendChannel {
  return (SPEND_CHANNELS as readonly string[]).includes(value);
}

/** `2026-09-07` → `Sep 7, 2026`, without dragging the day across a timezone. */
export function formatSpendDayLabel(dateKey: string): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  if (!y || !m || !d) return dateKey;
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "UTC",
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(Date.UTC(y, m - 1, d)));
}

/** Cents-aware money for a single day — `$40`, `$12.50`. */
export function formatSpendDayAmount(amount: number, currency = "USD"): string {
  const hasCents = Math.round(amount * 100) % 100 !== 0;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: hasCents ? 2 : 0,
    maximumFractionDigits: hasCents ? 2 : 0,
  }).format(amount);
}

function previousDayKey(dateKey: string): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  const cursor = new Date(Date.UTC(y, m - 1, d - 1));
  return cursor.toISOString().slice(0, 10);
}

/**
 * Pre-fill for the typed row: the newest closed day that still has $0 spend,
 * else yesterday. A pre-filled hole is one fewer decision before first value.
 */
export function quickSpendDefaultDate(input: {
  todayKey: string;
  /** Closed days in the coverage window with no spend (any order). */
  missingDates?: readonly string[];
}): string {
  const yesterday = previousDayKey(input.todayKey);
  const holes = (input.missingDates ?? [])
    .filter((key) => /^\d{4}-\d{2}-\d{2}$/.test(key) && key <= yesterday)
    .sort();
  return holes.length > 0 ? holes[holes.length - 1] : yesterday;
}

/**
 * Tightest Overview period that actually contains `dateKey`, so the first
 * Total ROAS a merchant sees divides sales by the spend they just typed
 * instead of landing on a period with no spend in it.
 */
export function roasPeriodForDay(
  dateKey: string,
  todayKey: string,
): PeriodPreset {
  const [dy, dm] = dateKey.split("-").map(Number);
  const [ty, tm] = todayKey.split("-").map(Number);
  if (dy === ty && dm === tm) return "mtd";

  const prevMonth = tm === 1 ? 12 : tm - 1;
  const prevMonthYear = tm === 1 ? ty - 1 : ty;
  if (dy === prevMonthYear && dm === prevMonth) return "lm";

  const quarterOf = (month: number) => Math.floor((month - 1) / 3);
  if (dy === ty && quarterOf(dm) === quarterOf(tm)) return "qtd";
  if (dy === ty) return "ytd";
  return "l12m";
}

/** Overview link whose period contains the saved day. `stay=1` never re-bounces. */
export function roasHrefForDay(dateKey: string, todayKey: string): string {
  return `/app?stay=1&period=${roasPeriodForDay(dateKey, todayKey)}`;
}

function salesFloorWarning(
  dateKey: string,
  salesFloorKey: string | null | undefined,
): string | null {
  if (!salesFloorKey || dateKey >= salesFloorKey) return null;
  return `Saved. Shopify sales history for Total ROAS starts ${formatSpendDayLabel(salesFloorKey)}, so ${formatSpendDayLabel(dateKey)} has spend with no matching sales.`;
}

/**
 * Validate one typed spend day. Fail-closed on every field — a bad row must
 * never reach the desk as a silent $0 or a future-dated hole.
 */
export function parseQuickSpendDay(
  input: QuickSpendDayInput,
): QuickSpendDayResult {
  const rawDate = input.date.trim();
  if (!rawDate) {
    return { ok: false, error: QUICK_SPEND_ERRORS.dateMissing, field: "date" };
  }
  const dateKey = parseSpendDate(rawDate);
  if (!dateKey) {
    return {
      ok: false,
      error: QUICK_SPEND_ERRORS.dateUnparseable,
      field: "date",
    };
  }
  if (dateKey > input.todayKey) {
    return { ok: false, error: QUICK_SPEND_ERRORS.dateFuture, field: "date" };
  }

  const rawAmount = input.amount.trim();
  if (!rawAmount) {
    return {
      ok: false,
      error: QUICK_SPEND_ERRORS.amountMissing,
      field: "amount",
    };
  }
  const amount = parseSpendAmount(rawAmount);
  if (amount == null) {
    return {
      ok: false,
      error: QUICK_SPEND_ERRORS.amountMissing,
      field: "amount",
    };
  }
  if (!(amount > 0)) {
    return {
      ok: false,
      error: QUICK_SPEND_ERRORS.amountNotPositive,
      field: "amount",
    };
  }
  if (amount > QUICK_SPEND_MAX_DAY_AMOUNT) {
    return {
      ok: false,
      error: QUICK_SPEND_ERRORS.amountTooLarge,
      field: "amount",
    };
  }

  const channelRaw = input.channel.trim().toLowerCase();
  if (!isSpendChannelValue(channelRaw)) {
    return {
      ok: false,
      error: QUICK_SPEND_ERRORS.channelInvalid,
      field: "channel",
    };
  }
  if (input.allowedChannels && !input.allowedChannels.includes(channelRaw)) {
    return {
      ok: false,
      error: QUICK_SPEND_ERRORS.channelNotAllowed,
      field: "channel",
    };
  }

  const customName = (input.customName ?? "").trim();
  if (channelRaw === "other" && !customName) {
    return {
      ok: false,
      error: QUICK_SPEND_ERRORS.customNameMissing,
      field: "customName",
    };
  }

  return {
    ok: true,
    day: {
      dateKey,
      channel: channelRaw,
      channelLabel:
        channelRaw === "other" && customName
          ? `Other · ${customName}`
          : SPEND_CHANNEL_LABELS[channelRaw],
      amount: Math.round(amount * 100) / 100,
      note: channelRaw === "other" ? customName.slice(0, 80) : null,
    },
    warning: salesFloorWarning(dateKey, input.salesFloorKey),
  };
}

export type QuickSpendSavedCopy = {
  heading: string;
  body: string;
  primaryLabel: string;
  primaryHref: string;
  secondaryLabel: string;
  /** Coverage / sales-window honesty under the CTA. null when clean. */
  note: string | null;
};

/**
 * Post-save copy. States the formula, never a ROAS figure, and never claims
 * coverage the merchant does not have.
 */
export function quickSpendSavedCopy(input: {
  dateKey: string;
  channelLabel: string;
  amount: number;
  todayKey: string;
  /** True when this write replaced an existing line for the same day+channel. */
  replaced: boolean;
  /** True when this was the merchant's first live (non-sample) spend row. */
  firstLiveSpend: boolean;
  /** Closed days in the coverage window still at $0 after this save. */
  missingDays?: number;
  salesFloorWarning?: string | null;
  currency?: string;
}): QuickSpendSavedCopy {
  const day = formatSpendDayLabel(input.dateKey);
  const money = formatSpendDayAmount(input.amount, input.currency);
  const line = `${input.channelLabel} · ${money} on ${day}${
    input.replaced ? " (replaced the earlier line for that day)" : ""
  }.`;
  const missing = Math.max(0, Math.floor(input.missingDays ?? 0));
  const note =
    input.salesFloorWarning?.trim() ||
    (missing > 0
      ? `${missingDaysCashSentence(missing)} Each one you fill pulls the multiple toward real spend.`
      : null);

  if (input.firstLiveSpend) {
    return {
      heading: "First spend day saved",
      body: `${line} ${PRODUCT_NOUN.totalRoas} is ${PRODUCT_NOUN.definition} — open Overview to see it for the period holding ${day}.`,
      primaryLabel: PRODUCT_NOUN.openTotalRoas,
      primaryHref: roasHrefForDay(input.dateKey, input.todayKey),
      secondaryLabel: "Add another day",
      note,
    };
  }

  return {
    heading: "Spend saved",
    body: `${line} ${PRODUCT_NOUN.definition} for the period holding ${day}.`,
    primaryLabel: PRODUCT_NOUN.openTotalRoas,
    primaryHref: roasHrefForDay(input.dateKey, input.todayKey),
    secondaryLabel: "Add another day",
    note,
  };
}
