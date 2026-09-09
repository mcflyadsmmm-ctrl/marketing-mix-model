import { SPEND_CHANNELS, type SpendChannel } from "@mcfly/mer-engine";

/**
 * Closed-day period ledger CSV — the analysis-ready daily export behind
 * "Export period ledger (.csv)" on Overview and Spend.
 *
 * Shopify sales in this file come only from persisted `SalesDayFact` (see
 * `period-ledger.server.ts`). Spend comes from live, non-SAMPLE `SpendEntry`
 * rows. This module is pure: fixed schema, dense closed-day rows, cent-exact
 * decimal formatting, RFC 4180 serialization. It never reads sales from a
 * spend row, an uploaded CSV, or the browser.
 */

export const PERIOD_LEDGER_EXPORT_LABEL = "Export period ledger (.csv)";

/** Column order is a product contract — see WAVE7C_EXPORT_LEDGER_SPEC.md §2. */
export const PERIOD_LEDGER_DAY_HEADER = "day";
export const PERIOD_LEDGER_SALES_HEADER = "Shopify sales";
export const PERIOD_LEDGER_SPEND_TOTAL_HEADER = "spend total";
export const PERIOD_LEDGER_ROAS_HEADER = "Total ROAS";

/**
 * Ordered channel columns. The tuple type below is checked against
 * `SpendChannel` at compile time, so adding a channel to the Prisma enum /
 * engine union breaks the build here until this schema is updated on purpose.
 */
const CHANNEL_COLUMN_ORDER = [
  "meta",
  "google",
  "microsoft",
  "tiktok",
  "pinterest",
  "snapchat",
  "reddit",
  "x",
  "linkedin",
  "amazon",
  "apple_search",
  "affiliate",
  "email",
  "other",
] as const;

type ChannelColumn = (typeof CHANNEL_COLUMN_ORDER)[number];

/**
 * Compile guard: the ordered column tuple must cover every `SpendChannel`
 * exactly once. A new channel makes `Missing` non-never and fails typecheck.
 */
type MissingChannelColumn = Exclude<SpendChannel, ChannelColumn>;
type UnknownChannelColumn = Exclude<ChannelColumn, SpendChannel>;
const _channelColumnsAreExhaustive: [
  MissingChannelColumn,
  UnknownChannelColumn,
] extends [never, never]
  ? true
  : never = true;
void _channelColumnsAreExhaustive;

/** Header text per channel column — exhaustive `Record`, so a new channel fails compile. */
const CHANNEL_COLUMN_HEADERS: Record<SpendChannel, string> = {
  meta: "Meta spend",
  google: "Google spend",
  microsoft: "Microsoft spend",
  tiktok: "TikTok spend",
  pinterest: "Pinterest spend",
  snapchat: "Snapchat spend",
  reddit: "Reddit spend",
  x: "X spend",
  linkedin: "LinkedIn spend",
  amazon: "Amazon spend",
  apple_search: "Apple Search Ads spend",
  affiliate: "Affiliate spend",
  email: "Email spend",
  other: "Other spend",
};

export const PERIOD_LEDGER_CHANNEL_COLUMNS: readonly SpendChannel[] =
  CHANNEL_COLUMN_ORDER;

export function periodLedgerChannelHeader(channel: SpendChannel): string {
  return CHANNEL_COLUMN_HEADERS[channel];
}

/** The exact eighteen columns, in contract order. */
export const PERIOD_LEDGER_HEADERS: readonly string[] = [
  PERIOD_LEDGER_DAY_HEADER,
  PERIOD_LEDGER_SALES_HEADER,
  PERIOD_LEDGER_SPEND_TOTAL_HEADER,
  ...CHANNEL_COLUMN_ORDER.map((channel) => CHANNEL_COLUMN_HEADERS[channel]),
  PERIOD_LEDGER_ROAS_HEADER,
];

/**
 * Fail-closed block copy. The route returns these verbatim with a 409 and no
 * attachment header; the disabled Overview / Spend control may reuse the same
 * text so a merchant reads one reason, not two.
 */
export const PERIOD_LEDGER_BLOCK_COPY = {
  sample:
    "SAMPLE preview is on — switch to Real store before exporting your period ledger. Nothing was downloaded.",
  noClosedDay:
    "Period ledger is not ready — the selected period has no fully closed day.",
  salesFacts:
    "Period ledger is paused — closed-day Shopify sales facts are incomplete. Try again after the desk finishes filling.",
  spend:
    "Period ledger is paused — closed-day spend is incomplete. Fill the missing days in Spend, then export again.",
} as const;

export type PeriodLedgerBlockReason = keyof typeof PERIOD_LEDGER_BLOCK_COPY;

/** Integer cents. Non-finite input is never emitted as `NaN`/`Infinity`. */
function toCents(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.round(value * 100);
}

function centsToDecimal(cents: number): string {
  return (cents / 100).toFixed(2);
}

export interface PeriodLedgerDayInput {
  /** Shop-local closed calendar day, `YYYY-MM-DD`. */
  dayKey: string;
  /** Shopify Total Sales after returns for the day — `SalesDayFact.sales` only. */
  sales: number;
  /** Non-SAMPLE spend attributed to this day, per channel. Absent = 0. */
  channels?: Partial<Record<SpendChannel, number>>;
}

export interface PeriodLedgerRow {
  dayKey: string;
  salesCents: number;
  channelCents: Record<SpendChannel, number>;
  spendTotalCents: number;
  /** sales ÷ spend total. Null when spend total is zero — never 0/Infinity/NaN. */
  roas: number | null;
}

function emptyChannelCents(): Record<SpendChannel, number> {
  return Object.fromEntries(
    CHANNEL_COLUMN_ORDER.map((channel) => [channel, 0]),
  ) as Record<SpendChannel, number>;
}

/**
 * One row per requested closed day, oldest first. A covered zero-sales /
 * zero-spend day is a legitimate `0.00` row; the caller is responsible for
 * refusing to pass a day whose `SalesDayFact` is missing (see
 * `period-ledger.server.ts`) — a missing fact is not zero.
 */
export function buildPeriodLedgerRows(
  days: readonly PeriodLedgerDayInput[],
): PeriodLedgerRow[] {
  return [...days]
    .sort((a, b) => (a.dayKey < b.dayKey ? -1 : a.dayKey > b.dayKey ? 1 : 0))
    .map((day) => {
      const channelCents = emptyChannelCents();
      let spendTotalCents = 0;
      for (const channel of CHANNEL_COLUMN_ORDER) {
        const cents = toCents(day.channels?.[channel] ?? 0);
        channelCents[channel] = cents;
        spendTotalCents += cents;
      }
      const salesCents = toCents(day.sales);
      return {
        dayKey: day.dayKey,
        salesCents,
        channelCents,
        spendTotalCents,
        roas: spendTotalCents === 0 ? null : salesCents / spendTotalCents,
      };
    });
}

/** Row cells in contract column order. Zero spend leaves Total ROAS empty. */
export function periodLedgerRowFields(row: PeriodLedgerRow): string[] {
  return [
    row.dayKey,
    centsToDecimal(row.salesCents),
    centsToDecimal(row.spendTotalCents),
    ...CHANNEL_COLUMN_ORDER.map((channel) =>
      centsToDecimal(row.channelCents[channel]),
    ),
    row.roas == null ? "" : row.roas.toFixed(4),
  ];
}

/** RFC 4180: quote when the field contains a comma, quote, CR or LF; double inner quotes. */
export function escapeCsvField(field: string): string {
  if (/[",\r\n]/.test(field)) {
    return `"${field.replace(/"/g, '""')}"`;
  }
  return field;
}

/** RFC 4180 record separator. */
const CRLF = "\r\n";

export function serializeCsvRows(rows: readonly (readonly string[])[]): string {
  return rows
    .map((row) => row.map((field) => escapeCsvField(field)).join(","))
    .join(CRLF);
}

/** Header row + one dense row per closed day, CRLF separated, no summary rows. */
export function serializePeriodLedgerCsv(
  rows: readonly PeriodLedgerRow[],
): string {
  return serializeCsvRows([
    PERIOD_LEDGER_HEADERS,
    ...rows.map((row) => periodLedgerRowFields(row)),
  ]);
}

/** `mcfly-period-ledger-<start-day>-to-<end-day>.csv` — day keys only, no shop identifier. */
export function periodLedgerFilename(
  startDayKey: string,
  endDayKey: string,
): string {
  return `mcfly-period-ledger-${startDayKey}-to-${endDayKey}.csv`;
}

/** `/app/period-ledger.csv?period=<preset>` for the current selection. */
export function periodLedgerHref(preset: string): string {
  return `/app/period-ledger.csv?period=${encodeURIComponent(preset)}`;
}

export interface PeriodLedgerControl {
  label: string;
  href: string;
  ready: boolean;
  /** Accessible help text for the disabled control — null when enabled. */
  blockedCopy: string | null;
}

/**
 * Overview / Spend control state. The server `409` stays authoritative — this
 * only avoids offering a download the route would refuse, and names the reason.
 */
export function resolvePeriodLedgerControl(args: {
  preset: string;
  useSampleDesk: boolean;
  /** Closed-day `SalesDayFact` coverage is complete and inside the fact window. */
  salesFactsReady: boolean;
  /** Every requested closed day has non-SAMPLE spend. */
  spendReady: boolean;
  /** Fully closed shop-local days in the selected period. */
  closedDays: number;
}): PeriodLedgerControl {
  const base = {
    label: PERIOD_LEDGER_EXPORT_LABEL,
    href: periodLedgerHref(args.preset),
  };
  if (args.useSampleDesk) {
    return { ...base, ready: false, blockedCopy: PERIOD_LEDGER_BLOCK_COPY.sample };
  }
  if (args.closedDays <= 0) {
    return {
      ...base,
      ready: false,
      blockedCopy: PERIOD_LEDGER_BLOCK_COPY.noClosedDay,
    };
  }
  if (!args.salesFactsReady) {
    return {
      ...base,
      ready: false,
      blockedCopy: PERIOD_LEDGER_BLOCK_COPY.salesFacts,
    };
  }
  if (!args.spendReady) {
    return { ...base, ready: false, blockedCopy: PERIOD_LEDGER_BLOCK_COPY.spend };
  }
  return { ...base, ready: true, blockedCopy: null };
}

/** Runtime cross-check for the fixed schema — paired with the compile guard above. */
export function periodLedgerChannelColumnsMatchEngine(): boolean {
  if (PERIOD_LEDGER_CHANNEL_COLUMNS.length !== SPEND_CHANNELS.length) {
    return false;
  }
  const engine = new Set<string>(SPEND_CHANNELS);
  return PERIOD_LEDGER_CHANNEL_COLUMNS.every((channel) => engine.has(channel));
}
