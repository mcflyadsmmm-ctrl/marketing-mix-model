/**
 * Spend pair coverage — sales days vs spend days.
 * Weekday-only paste against a full-week till is not 6× Total ROAS.
 * Missing spend days stay empty; never write $0 spend onto them.
 */

export type SpendPairCoverage = {
  salesDays: number;
  spendDays: number;
  salesDaysWithoutSpend: number;
  spendDaysWithoutSales: number;
  /** True when sales landed on days that have no typed spend. */
  withholdRatio: boolean;
  caption: string;
};

export type SpendCoverageOverlayCell = {
  dateKey: string;
  label: string;
  /** Typed / pasted / uploaded spend is on file. Never inferred from sales. */
  filled: boolean;
  /** SalesDayFact (or SAMPLE day) has sales > 0. */
  hasSales: boolean;
};

function uniqueKeys(values: Iterable<string>): string[] {
  return [...new Set(values)].sort();
}

function dayWord(n: number): string {
  return n === 1 ? "day" : "days";
}

/**
 * Name the pair, or withhold Total ROAS when sales days have no spend.
 * Does not invent spend keys from sales keys.
 */
export function spendPairCoverage(input: {
  salesDays: Iterable<string>;
  spendDays: Iterable<string>;
}): SpendPairCoverage {
  const sales = uniqueKeys(input.salesDays);
  const spend = uniqueKeys(input.spendDays);
  const spendSet = new Set(spend);
  const salesSet = new Set(sales);
  const salesDaysWithoutSpend = sales.filter((key) => !spendSet.has(key)).length;
  const spendDaysWithoutSales = spend.filter((key) => !salesSet.has(key)).length;
  const withholdRatio = spend.length > 0 && salesDaysWithoutSpend > 0;
  const counts = `${sales.length} sales ${dayWord(sales.length)} · ${spend.length} spend ${dayWord(spend.length)}`;
  let caption = counts;
  if (withholdRatio) {
    caption = `${counts}. Days without spend are not $0 spend — Total ROAS waits.`;
  } else if (spendDaysWithoutSales > 0) {
    caption = `${counts}. ${spendDaysWithoutSales} spend ${dayWord(spendDaysWithoutSales)} still waiting on sales — not 0×.`;
  }
  return {
    salesDays: sales.length,
    spendDays: spend.length,
    salesDaysWithoutSpend,
    spendDaysWithoutSales,
    withholdRatio,
    caption,
  };
}

/**
 * Overlay SalesDayFact days onto the spend strip. Sales-only cells stay
 * unfilled — do not write $0 spend onto a missing day.
 */
export function overlaySalesOnSpendCoverage(
  days: Array<{ dateKey: string; label: string; filled: boolean }>,
  salesByDay: Record<string, number>,
): SpendCoverageOverlayCell[] {
  return days.map((day) => {
    const sales = salesByDay[day.dateKey];
    return {
      dateKey: day.dateKey,
      label: day.label,
      filled: day.filled === true,
      hasSales: Number.isFinite(sales) && sales > 0,
    };
  });
}
