import type { SpendChannel } from "@mcfly/mer-engine";
import { buildDailyRowsForWindow, getSpendPeriodCoverage } from "./mer-dashboard.server";
import { getSalesFactsByDay, getSalesFactsCoverage } from "./sales-facts.server";
import { getSampleDeskEnabled } from "./sample-desk.server";
import { resolvePeriod, type PeriodPreset } from "./periods";
import {
  listRecentClosedShopLocalDays,
  nextShopLocalDayKey,
  shopLocalDayKey,
  shopLocalDayRange,
} from "./shop-local-day";
import {
  buildPeriodLedgerRows,
  periodLedgerFilename,
  serializePeriodLedgerCsv,
  PERIOD_LEDGER_BLOCK_COPY,
  type PeriodLedgerBlockReason,
  type PeriodLedgerDayInput,
} from "./period-ledger";

/**
 * Authenticated-shop assembly for the closed-day period ledger CSV.
 *
 * Sales are read only through `SalesDayFact` helpers. Spend is read from live
 * `SpendEntry` rows with `source != "sample"`. Every gate here fails closed:
 * a partial or ambiguous period returns a `409` with exact copy instead of a
 * downloadable file, and a missing closed day is never written as `0.00`.
 *
 * Read-only — no backfill enqueue, no Shopify GraphQL, no writes.
 */

/** Widest supported preset is 3 years; anything past this is a guard, not a period. */
const MAX_LEDGER_DAYS = 1200;

export interface PeriodLedgerReady {
  ok: true;
  csv: string;
  filename: string;
  startDayKey: string;
  endDayKey: string;
  dayCount: number;
}

export interface PeriodLedgerBlocked {
  ok: false;
  status: 409;
  reason: PeriodLedgerBlockReason;
  message: string;
}

export type PeriodLedgerResult = PeriodLedgerReady | PeriodLedgerBlocked;

function blocked(reason: PeriodLedgerBlockReason): PeriodLedgerBlocked {
  return {
    ok: false,
    status: 409,
    reason,
    message: PERIOD_LEDGER_BLOCK_COPY[reason],
  };
}

/**
 * Dense shop-local closed-day keys for the selected period, oldest first.
 * The end is clamped to the last fully closed shop-local day (today is always
 * excluded). The start is never shortened — an out-of-window start has to fail
 * the sales-facts gate instead of quietly exporting less than the label claims.
 */
export function closedLedgerDayKeys(args: {
  rangeStart: Date;
  rangeEnd: Date;
  timeZone: string;
  now: Date;
}): string[] {
  const startKey = shopLocalDayKey(args.rangeStart, args.timeZone);
  const requestedEndKey = shopLocalDayKey(args.rangeEnd, args.timeZone);
  const lastClosedKey = listRecentClosedShopLocalDays(
    args.timeZone,
    1,
    args.now,
  )[0];
  if (!lastClosedKey) return [];
  const endKey =
    requestedEndKey < lastClosedKey ? requestedEndKey : lastClosedKey;
  if (endKey < startKey) return [];

  const keys: string[] = [];
  for (
    let key = startKey;
    key <= endKey && keys.length <= MAX_LEDGER_DAYS;
    key = nextShopLocalDayKey(key, args.timeZone)
  ) {
    keys.push(key);
  }
  return keys;
}

export async function loadPeriodLedger(args: {
  shopId: string;
  ianaTimezone: string | null | undefined;
  preset: PeriodPreset;
  now?: Date;
}): Promise<PeriodLedgerResult> {
  const now = args.now ?? new Date();

  // SAMPLE gate runs before any row is constructed — practice money never
  // reaches a live export, labelled or not.
  if (await getSampleDeskEnabled(args.shopId)) {
    return blocked("sample");
  }

  // Without the shop's IANA timezone there is no honest closed-day boundary,
  // and server-local time is never substituted for a merchant calendar.
  const timeZone = args.ianaTimezone;
  if (!timeZone) return blocked("salesFacts");

  const range = resolvePeriod(args.preset, now, timeZone);
  const dayKeys = closedLedgerDayKeys({
    rangeStart: range.start,
    rangeEnd: range.end,
    timeZone,
    now,
  });
  if (dayKeys.length === 0) return blocked("noClosedDay");
  if (dayKeys.length > MAX_LEDGER_DAYS) return blocked("salesFacts");

  const startDayKey = dayKeys[0];
  const endDayKey = dayKeys[dayKeys.length - 1];
  // Start stays the requested period start; only the end is clamped to closed days.
  const closedRange = {
    start: range.start,
    end: shopLocalDayRange(endDayKey, timeZone).end,
    label: range.label,
  };

  let coverage;
  try {
    coverage = await getSalesFactsCoverage(args.shopId, closedRange, now, timeZone);
  } catch {
    return blocked("salesFacts");
  }
  if (
    !coverage.complete ||
    coverage.periodExceedsFactWindow ||
    coverage.factDays !== coverage.expectedClosedDays ||
    coverage.expectedClosedDays !== dayKeys.length
  ) {
    return blocked("salesFacts");
  }

  let salesByDay: Map<string, number>;
  try {
    salesByDay = await getSalesFactsByDay(args.shopId, closedRange, timeZone);
  } catch {
    return blocked("salesFacts");
  }
  // A day with no stored fact is not a zero-sales day — it blocks the export.
  if (dayKeys.some((key) => !salesByDay.has(key))) {
    return blocked("salesFacts");
  }

  let spendCoverage;
  try {
    spendCoverage = await getSpendPeriodCoverage(args.shopId, closedRange, {
      excludeSample: true,
      timeZone,
      now,
    });
  } catch {
    return blocked("spend");
  }
  if (
    spendCoverage.daysInPeriod !== dayKeys.length ||
    spendCoverage.daysWithSpend !== dayKeys.length
  ) {
    return blocked("spend");
  }

  let spendByDay: Map<string, Partial<Record<SpendChannel, number>>>;
  try {
    // Only the per-channel spend slices are used. Row sales are read from the
    // SalesDayFact map below so no spend/CSV-shaped value can become sales.
    const dailyRows = await buildDailyRowsForWindow(args.shopId, {
      excludeSample: true,
      salesByDay: new Map(),
      windowStart: closedRange.start,
      windowEnd: closedRange.end,
      timeZone,
    });
    spendByDay = new Map(
      dailyRows.map((row) => [
        row.dateKey,
        Object.fromEntries(
          row.channels.map((slice) => [slice.channel, slice.amount]),
        ) as Partial<Record<SpendChannel, number>>,
      ]),
    );
  } catch {
    return blocked("spend");
  }

  const days: PeriodLedgerDayInput[] = dayKeys.map((dayKey) => ({
    dayKey,
    sales: salesByDay.get(dayKey) ?? 0,
    channels: spendByDay.get(dayKey),
  }));

  return {
    ok: true,
    csv: serializePeriodLedgerCsv(buildPeriodLedgerRows(days)),
    filename: periodLedgerFilename(startDayKey, endDayKey),
    startDayKey,
    endDayKey,
    dayCount: dayKeys.length,
  };
}

/**
 * HTTP shape for the resource route. Blocked states are plain UTF-8 text with
 * no attachment header, so a browser never saves a partial ledger as a file.
 */
export function periodLedgerResponse(result: PeriodLedgerResult): Response {
  if (!result.ok) {
    return new Response(result.message, {
      status: result.status,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "private, no-store",
      },
    });
  }
  return new Response(result.csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${result.filename}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
