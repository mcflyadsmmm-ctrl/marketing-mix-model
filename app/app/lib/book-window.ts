/**
 * Honest book-load copy and month progress.
 * Pure — no Prisma, no Shopify. A period chip reads a stored window;
 * this only says how much of the closed-day book is finished.
 */

export const DESK_PERIOD_CHIPS = ["mtd", "lm", "qtd", "ytd", "l12m"] as const;

export type DeskPeriodChip = (typeof DESK_PERIOD_CHIPS)[number];

export function isDeskPeriodChip(value: string): value is DeskPeriodChip {
  return (DESK_PERIOD_CHIPS as readonly string[]).includes(value);
}

export type FinishedBookMonths = {
  monthsFinished: number;
  monthsInWindow: number;
  bookSealed: boolean;
};

/**
 * A month is finished when every closed day of that month inside the
 * crawl window has a day-complete seal. Newest-first crawl does not
 * change the count. Today is not a closed day, so it is not in the window.
 */
export function countFinishedBookMonths(
  windowDayKeys: readonly string[],
  completeDayKeys: ReadonlySet<string>,
): FinishedBookMonths {
  const byMonth = new Map<string, { total: number; done: number }>();
  for (const key of windowDayKeys) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) continue;
    const month = key.slice(0, 7);
    const row = byMonth.get(month) ?? { total: 0, done: 0 };
    row.total += 1;
    if (completeDayKeys.has(key)) row.done += 1;
    byMonth.set(month, row);
  }
  let monthsFinished = 0;
  for (const row of byMonth.values()) {
    if (row.total > 0 && row.done === row.total) monthsFinished += 1;
  }
  const bookSealed =
    windowDayKeys.length > 0 &&
    windowDayKeys.every((key) => completeDayKeys.has(key));
  return {
    monthsFinished,
    monthsInWindow: byMonth.size,
    bookSealed,
  };
}

export type BookLoadHonestyInput = {
  monthsFinished: number;
  bookSealed: boolean;
  historyLimited: boolean;
};

/**
 * One sentence. Months finished, not a percent, not a day fraction.
 * A sealed 24-month book says so. A Shopify-limited book does not claim 24 months.
 */
export function bookLoadHonestyLine(input: BookLoadHonestyInput): string {
  if (input.bookSealed && !input.historyLimited) {
    return "The 24-month book is sealed.";
  }
  if (input.bookSealed && input.historyLimited) {
    return "The order history Shopify shared is sealed.";
  }
  const n = Math.max(0, Math.floor(input.monthsFinished));
  const noun = n === 1 ? "month" : "months";
  return `Older months still loading, newest first. ${n} ${noun} finished.`;
}

/**
 * Customers and LTV read months already on file.
 * Partial until the book is sealed; sealed copy when the crawl is done.
 */
export function customersBookRangeLine(input: BookLoadHonestyInput): string {
  if (input.bookSealed && !input.historyLimited) {
    return "The 24-month book is sealed.";
  }
  if (input.bookSealed && input.historyLimited) {
    return "Customers and LTV use the order history Shopify shared. That range is sealed.";
  }
  const until = input.historyLimited
    ? "the book is sealed"
    : "the 24-month book is sealed";
  return `Customers and LTV use months already loaded. This range is partial until ${until}.`;
}
