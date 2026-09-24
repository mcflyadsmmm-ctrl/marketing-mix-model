/**
 * Merchant words for a book that is still filling.
 * Newest closed day first. This month stays usable. Months finished are a
 * count, never a percent of the 24-month window.
 * Display only — does not change how many days the crawl asks for.
 */

import { orderRowWindowDayCount } from "./live-ingest-depth";

export const MERCHANT_BOOK_MONTHS = 24;

const DAY_MS = 86_400_000;

export type BookLoadInput = {
  completeDays: number;
  windowDays: number;
  remainingDays: number;
  /** UTC clock for “this month”. Defaults to now. */
  now?: Date;
  /**
   * Closed months the stored crawl already counted. When present, the
   * sentence uses that count and does not walk days again.
   */
  monthsFinished?: number;
  bookSealed?: boolean;
  historyLimited?: boolean;
};

export type BookLoadKind = "still_this_month" | "this_month_ready" | "sealed";

export type BookLoadStatus = {
  kind: BookLoadKind;
  monthsFinished: number;
  thisMonthReady: boolean;
  bookSealed: boolean;
  partial: boolean;
};

function whole(n: number): number {
  return Math.max(0, Math.floor(n));
}

function utcMidnight(now: Date): Date {
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
}

function daysInUtcMonth(year: number, monthIndex: number): number {
  return new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
}

/** “3 months finished” — a count, never “12%”. */
export function monthsFinishedPhrase(monthsFinished: number): string {
  const n = whole(monthsFinished);
  if (n === 1) return "1 month finished";
  return `${n} months finished`;
}

/**
 * Walk backward from yesterday. Closed days in the current month are this
 * month (usable once any of them are on file). A prior month counts as
 * finished only when every day of that month sits in the sealed prefix.
 */
function hasStoredMonths(input: BookLoadInput): boolean {
  return (
    typeof input.monthsFinished === "number" ||
    typeof input.bookSealed === "boolean"
  );
}

/** Stored crawl wins. Day walking is only the fallback. */
function statusFromStoredMonths(input: BookLoadInput): BookLoadStatus | null {
  if (!hasStoredMonths(input)) return null;
  const monthsFinished = whole(input.monthsFinished ?? 0);
  const bookSealed = Boolean(input.bookSealed);
  if (bookSealed) {
    return {
      kind: "sealed",
      monthsFinished,
      thisMonthReady: true,
      bookSealed: true,
      partial: Boolean(input.historyLimited),
    };
  }
  const thisMonthReady = whole(input.completeDays) > 0 || monthsFinished > 0;
  return {
    kind: thisMonthReady ? "this_month_ready" : "still_this_month",
    monthsFinished,
    thisMonthReady,
    bookSealed: false,
    partial: true,
  };
}

export function describeBookLoad(input: BookLoadInput): BookLoadStatus {
  const stored = statusFromStoredMonths(input);
  if (stored) return stored;

  const completeDays = whole(input.completeDays);
  const windowDays = whole(input.windowDays);
  const remainingDays = whole(input.remainingDays);
  const now = input.now ?? new Date();
  const fullDays = orderRowWindowDayCount(now);
  const bookSealed =
    windowDays > 0 &&
    remainingDays <= 0 &&
    completeDays >= windowDays &&
    windowDays + 1 >= fullDays;

  if (bookSealed) {
    return {
      kind: "sealed",
      monthsFinished: MERCHANT_BOOK_MONTHS,
      thisMonthReady: true,
      bookSealed: true,
      partial: false,
    };
  }

  if (completeDays <= 0) {
    return {
      kind: "still_this_month",
      monthsFinished: 0,
      thisMonthReady: false,
      bookSealed: false,
      partial: true,
    };
  }

  const today = utcMidnight(now);
  const closedDaysThisMonth = today.getUTCDate() - 1;
  let left = completeDays;
  let thisMonthReady = false;
  if (closedDaysThisMonth <= 0) {
    thisMonthReady = true;
  } else {
    const taken = Math.min(left, closedDaysThisMonth);
    thisMonthReady = taken > 0;
    left -= taken;
  }

  let monthsFinished = 0;
  let cursor = new Date(
    Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1),
  );
  cursor = new Date(cursor.getTime() - DAY_MS);
  cursor = new Date(
    Date.UTC(cursor.getUTCFullYear(), cursor.getUTCMonth(), 1),
  );

  while (left > 0 && monthsFinished < MERCHANT_BOOK_MONTHS) {
    const span = daysInUtcMonth(cursor.getUTCFullYear(), cursor.getUTCMonth());
    if (left < span) break;
    left -= span;
    monthsFinished += 1;
    cursor.setUTCMonth(cursor.getUTCMonth() - 1);
  }

  return {
    kind: thisMonthReady ? "this_month_ready" : "still_this_month",
    monthsFinished,
    thisMonthReady,
    bookSealed: false,
    partial: true,
  };
}

/**
 * Orders banner while older months are still loading.
 * Quiet once the window on file has no days left — including a short window
 * that is not the 24-month book.
 */
function bannerForStatus(
  status: BookLoadStatus,
): { heading: string; body: string } | null {
  const finished = monthsFinishedPhrase(status.monthsFinished);
  switch (status.kind) {
    case "sealed":
      return null;
    case "still_this_month":
      return {
        heading: "This month is still loading",
        body: `Older months start after this month, newest first. ${finished}. Nothing on the desk is $0.`,
      };
    case "this_month_ready":
      return {
        heading: "This month is ready",
        body: `Older months are still loading, newest first. ${finished}. Nothing unfinished is $0.`,
      };
    default: {
      const _never: never = status.kind;
      return _never;
    }
  }
}

export function historyLoadCopy(
  input: BookLoadInput,
): { heading: string; body: string } | null {
  if (hasStoredMonths(input)) {
    return bannerForStatus(describeBookLoad(input));
  }
  const windowDays = whole(input.windowDays);
  const remainingDays = whole(input.remainingDays);
  if (windowDays <= 0 || remainingDays <= 0) return null;

  return bannerForStatus(describeBookLoad(input));
}

/** Inline orders line. Uses stored month counts when the crawl sent them. */
export function ordersResumeLine(input: BookLoadInput): string | null {
  if (input.bookSealed && input.historyLimited) {
    return "The order history Shopify shared is sealed.";
  }
  if (input.bookSealed) {
    return "The 24-month book is sealed.";
  }
  const copy = historyLoadCopy(input);
  if (!copy) return null;
  return `${copy.heading}. ${copy.body}`;
}

/** Customers and LTV — months already loaded, or the sealed 24-month book. */
export function loadedBookRangeLine(
  input: BookLoadInput & { sample?: boolean },
): string | null {
  if (input.sample) return null;
  if (!hasStoredMonths(input) && whole(input.windowDays) <= 0) return null;
  const status = describeBookLoad(input);
  switch (status.kind) {
    case "sealed":
      return input.historyLimited
        ? "Customers and LTV use the order history Shopify shared. That range is sealed."
        : "The 24-month book is sealed.";
    case "still_this_month":
      return "Customers and LTV use this month so far. The range is partial. Older months are still loading, newest first. Not $0.";
    case "this_month_ready":
      return `Customers and LTV use ${monthsFinishedPhrase(status.monthsFinished)} already loaded. The range is partial. Older months are still loading, newest first. Not $0.`;
    default: {
      const _never: never = status.kind;
      return _never;
    }
  }
}

const TRIAL_FLAT =
  "Trial is 7 days, then $39 per store per month, flat. Ads stay off.";

/**
 * First open of a live shop. Hidden once a prior month has finished and
 * this month already has orders. Sample desks do not use this sentence.
 */
export function dayOneOrdersCopy(input: {
  orderCount: number;
  completeDays: number;
  windowDays: number;
  remainingDays: number;
  salesPending: boolean;
  sample?: boolean;
  now?: Date;
  monthsFinished?: number;
  bookSealed?: boolean;
  historyLimited?: boolean;
}): { heading: string; body: string } | null {
  if (input.sample) return null;
  const orderCount = whole(input.orderCount);
  const windowDays = whole(input.windowDays);
  const remainingDays = whole(input.remainingDays);
  const status =
    hasStoredMonths(input) || windowDays > 0
      ? describeBookLoad({
          completeDays: input.completeDays,
          windowDays,
          remainingDays,
          now: input.now,
          monthsFinished: input.monthsFinished,
          bookSealed: input.bookSealed,
          historyLimited: input.historyLimited,
        })
      : ({
          kind: "still_this_month",
          monthsFinished: 0,
          thisMonthReady: false,
          bookSealed: false,
          partial: true,
        } satisfies BookLoadStatus);

  if (status.bookSealed && orderCount <= 0) {
    return {
      heading: "No orders yet",
      body: `The 24-month book is sealed. This shop has no orders. The blank is not sample numbers. ${TRIAL_FLAT}`,
    };
  }

  if (
    orderCount <= 0 &&
    !input.salesPending &&
    remainingDays <= 0 &&
    !status.bookSealed
  ) {
    return {
      heading: "No orders yet",
      body: `This shop has no orders on file. The blank is not $0 and it is not sample numbers. ${TRIAL_FLAT}`,
    };
  }

  if (status.bookSealed && orderCount > 0) return null;
  if (status.monthsFinished > 0 && orderCount > 0) return null;

  const finished = monthsFinishedPhrase(status.monthsFinished);
  const blank =
    orderCount <= 0
      ? " Nothing on file yet is $0, and these are not sample numbers."
      : "";
  if (status.kind === "still_this_month" || (input.salesPending && orderCount <= 0)) {
    return {
      heading: "Orders",
      body: `This month is still loading. Older months start after it, newest first. ${finished}.${blank} ${TRIAL_FLAT}`,
    };
  }

  return {
    heading: "Orders",
    body: `This month is ready. Older months are still loading, newest first. ${finished}.${blank} ${TRIAL_FLAT}`,
  };
}

export const LIVE_SALES_ERROR =
  "Sales didn’t load. Retry to see this shop’s orders. Sample numbers stay on Sample shop.";

export const EMPTY_SHOP_ORDERS_LINE =
  "No orders in this shop yet. This blank is not sample numbers and not $0.";
