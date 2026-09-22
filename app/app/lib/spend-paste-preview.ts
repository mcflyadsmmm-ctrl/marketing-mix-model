/**
 * Optional Spend paste preview — Shopify sales ÷ entered spend for
 * these pasted days. Empty / blank / all-zero paste writes nothing.
 * Column headers are labels, never Meta ROAS or path credit.
 */

import {
  parseSpendCsv,
  type CsvChannel,
  type ParsedSpendRow,
} from "./spend-csv";
import { spendChannelShortLabel } from "./spend-channel-label";
import { cashCostPerCustomer } from "./shopify-native-stats";
import { cashPaybackDays } from "./cash-payback";

export type SpendPasteBuyerDay = {
  dateKey: string;
  identifiedBuyers: number;
  newCustomers: number;
  buyersKnown: boolean;
};

export type SpendPasteBook = {
  certifiedSalesByDay: Record<string, number>;
  buyerDays: SpendPasteBuyerDay[];
  salesFloorKey: string;
  salesPending: boolean;
  first30: number | null;
  first90: number | null;
  first365: number | null;
  historyLimited: boolean;
};

export type SpendPastePreview = {
  writeNothing: boolean;
  days: number;
  labels: string[];
  totalAmount: number;
  from: string | null;
  to: string | null;
  scopeLabel: "these pasted days";
  firstError: string | null;
  salesWindowWarning: string | null;
  totalRoas: number | null;
  cashCpa: number | null;
  paybackDays: number | null;
  salesFactDays: number;
  inWindowDays: number;
  roasReason: string | null;
  cpaReason: string | null;
  paybackReason: string | null;
};

const SCOPE = "these pasted days" as const;

function emptyPreview(
  partial: Partial<SpendPastePreview> = {},
): SpendPastePreview {
  return {
    writeNothing: true,
    days: 0,
    labels: [],
    totalAmount: 0,
    from: null,
    to: null,
    scopeLabel: SCOPE,
    firstError: null,
    salesWindowWarning: null,
    totalRoas: null,
    cashCpa: null,
    paybackDays: null,
    salesFactDays: 0,
    inWindowDays: 0,
    roasReason: null,
    cpaReason: null,
    paybackReason: null,
    ...partial,
  };
}

function labelsForRows(rows: ParsedSpendRow[]): string[] {
  const seen = new Set<string>();
  const labels: string[] = [];
  for (const row of rows) {
    const label = spendChannelShortLabel({
      channel: row.channel,
      customLabel: row.customLabel,
    });
    if (seen.has(label)) continue;
    seen.add(label);
    labels.push(label);
  }
  return labels;
}

function spendByDate(rows: ParsedSpendRow[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const row of rows) {
    map.set(row.date, (map.get(row.date) ?? 0) + row.amount);
  }
  return map;
}

export function pasteSalesWindowWarning(
  dates: string[],
  salesFloorKey: string,
): string | null {
  if (dates.length === 0) return null;
  const oldest = [...dates].sort()[0];
  if (oldest && oldest < salesFloorKey) {
    return `Some spend days start before ${salesFloorKey}. Shopify sales for Total ROAS only go back to that date — older spend will not have matching sales.`;
  }
  return null;
}

export function previewSpendPaste(
  text: string,
  book: SpendPasteBook,
  options?: { forceChannel?: CsvChannel },
): SpendPastePreview {
  if (!text.trim()) {
    return emptyPreview();
  }

  const parsed = parseSpendCsv(
    text,
    options?.forceChannel ? { forceChannel: options.forceChannel } : undefined,
  );
  const firstError = parsed.errors[0] ?? null;
  if (parsed.rows.length === 0) {
    return emptyPreview({
      firstError:
        firstError ??
        (parsed.errors.length > 0
          ? parsed.errors[0]!
          : null),
    });
  }

  const byDate = spendByDate(parsed.rows);
  const dates = [...byDate.keys()].sort();
  const totalAmount = parsed.rows.reduce((sum, row) => sum + row.amount, 0);
  const inWindowDates = dates.filter((d) => d >= book.salesFloorKey);
  const salesFactDays = inWindowDates.filter(
    (d) => Object.prototype.hasOwnProperty.call(book.certifiedSalesByDay, d),
  ).length;
  const inWindowSpend = inWindowDates.reduce(
    (sum, d) => sum + (byDate.get(d) ?? 0),
    0,
  );

  const preview: SpendPastePreview = {
    writeNothing: false,
    days: dates.length,
    labels: labelsForRows(parsed.rows),
    totalAmount,
    from: dates[0] ?? null,
    to: dates[dates.length - 1] ?? null,
    scopeLabel: SCOPE,
    firstError,
    salesWindowWarning: pasteSalesWindowWarning(dates, book.salesFloorKey),
    totalRoas: null,
    cashCpa: null,
    paybackDays: null,
    salesFactDays,
    inWindowDays: inWindowDates.length,
    roasReason: null,
    cpaReason: null,
    paybackReason: null,
  };

  if (book.salesPending) {
    preview.roasReason = "Sales are still loading — not $0.";
    preview.cpaReason = "Sales are still loading — not $0.";
    preview.paybackReason = "Sales are still loading — not $0.";
    return preview;
  }

  const missingFacts = inWindowDates.length - salesFactDays;
  if (inWindowDates.length === 0) {
    preview.roasReason =
      "Pasted days sit before the sales floor, so Total ROAS stays —.";
  } else if (missingFacts > 0) {
    const factWord = salesFactDays === 1 ? "day" : "days";
    preview.roasReason = `${salesFactDays} ${factWord} ${
      salesFactDays === 1 ? "has" : "have"
    } sales on file — Total ROAS stays — until every pasted day in the sales window has a sales fact.`;
  } else if (inWindowSpend > 0) {
    const sales = inWindowDates.reduce(
      (sum, d) => sum + (book.certifiedSalesByDay[d] ?? 0),
      0,
    );
    preview.totalRoas = sales / inWindowSpend;
  }

  const buyersByDate = new Map(
    book.buyerDays.map((day) => [day.dateKey, day]),
  );
  let identified = 0;
  let newCustomers = 0;
  let buyersKnown = true;
  for (const dateKey of inWindowDates) {
    const day = buyersByDate.get(dateKey);
    if (!day?.buyersKnown) {
      buyersKnown = false;
      break;
    }
    identified += Math.max(0, Math.trunc(day.identifiedBuyers));
    newCustomers += Math.max(0, Math.trunc(day.newCustomers));
  }

  if (!buyersKnown) {
    preview.cpaReason =
      "Buyer counts are not on file for every pasted day in the sales window.";
    preview.paybackReason = preview.cpaReason;
    return preview;
  }

  preview.cashCpa = cashCostPerCustomer(inWindowSpend, identified);
  if (preview.cashCpa == null) {
    preview.cpaReason =
      "Shopify has not identified buyers for these pasted days, so Cash CPA stays — — not $0.";
  }

  const cashCac = cashCostPerCustomer(inWindowSpend, newCustomers);
  if (
    book.historyLimited ||
    book.first90 == null ||
    !Number.isFinite(book.first90) ||
    book.first90 <= 0
  ) {
    preview.paybackDays = null;
    preview.paybackReason = "The first-90 value is not on file yet.";
    return preview;
  }
  if (cashCac == null) {
    preview.paybackDays = null;
    preview.paybackReason =
      preview.cpaReason ??
      "Payback stays — until spend and new buyers are both on file.";
    return preview;
  }
  preview.paybackDays = cashPaybackDays(
    cashCac,
    book.first30,
    book.first90,
    book.first365,
  );
  if (preview.paybackDays == null) {
    preview.paybackReason =
      "First-90 order history does not yet cover this cash CAC.";
  }
  return preview;
}
