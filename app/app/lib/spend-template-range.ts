/**
 * Date-range math for spend CSV blank templates (history backfill).
 * Closed days through yesterday, clamped to the desk history floor
 * (Jan 1 of UTC year − 5 — same horizon as `salesDayFactWindowStartUtc`).
 * Pure — no I/O, no Shopify auth.
 */

import { DESK_HISTORY_YEARS_BACK, deskHistoryFloorKey } from "./desk-history";

/** Matches `SALES_DAY_FACT_WINDOW_YEARS_BACK` / desk history. */
export const SPEND_TEMPLATE_WINDOW_YEARS_BACK = DESK_HISTORY_YEARS_BACK;

/** Cap for `?dates=` hole lists. Prefer `from`/`to` or `span` for long ranges. */
export const SPEND_TEMPLATE_DATES_QUERY_CAP = 366;

export type SpendTemplateSpan = "30d" | "90d" | "ytd" | "12m";

export const SPEND_TEMPLATE_SPANS: readonly SpendTemplateSpan[] = [
  "30d",
  "90d",
  "ytd",
  "12m",
];

const SPAN_SET: ReadonlySet<string> = new Set(SPEND_TEMPLATE_SPANS);

const YMD_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

export type SpendTemplateDateRange = {
  fromKey: string;
  toKey: string;
  dates: string[];
};

export function parseSpendTemplateSpan(
  raw: string | null | undefined,
): SpendTemplateSpan | null {
  if (!raw?.trim()) return null;
  const v = raw.trim().toLowerCase();
  if (SPAN_SET.has(v)) return v as SpendTemplateSpan;
  return null;
}

/** Strict YYYY-MM-DD (query params). Invalid calendar days → null. */
export function parseSpendTemplateYmd(
  raw: string | null | undefined,
): string | null {
  if (!raw?.trim()) return null;
  const match = YMD_RE.exec(raw.trim());
  if (!match) return null;
  const y = Number(match[1]);
  const m = Number(match[2]);
  const d = Number(match[3]);
  if (!Number.isInteger(y) || !Number.isInteger(m) || !Number.isInteger(d)) {
    return null;
  }
  const probe = new Date(Date.UTC(y, m - 1, d));
  if (
    probe.getUTCFullYear() !== y ||
    probe.getUTCMonth() !== m - 1 ||
    probe.getUTCDate() !== d
  ) {
    return null;
  }
  return `${match[1]}-${match[2]}-${match[3]}`;
}

/**
 * UTC Jan 1 of (calendar year − 5), as YYYY-MM-DD.
 * Same key as `salesDayFactWindowStartUtc(now).toISOString().slice(0, 10)`.
 */
export function spendTemplateDefaultFloorKey(now: Date = new Date()): string {
  return deskHistoryFloorKey(now);
}

/** Local calendar day before `now`, YYYY-MM-DD. */
export function spendTemplateYesterdayKey(now: Date = new Date()): string {
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  d.setDate(d.getDate() - 1);
  return formatLocalYmd(d);
}

export function addDaysToKey(key: string, delta: number): string {
  const parsed = parseSpendTemplateYmd(key);
  if (!parsed) return key;
  const [y, m, d] = parsed.split("-").map(Number);
  const utc = Date.UTC(y, m - 1, d + delta);
  const dt = new Date(utc);
  return `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, "0")}-${String(dt.getUTCDate()).padStart(2, "0")}`;
}

function formatLocalYmd(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function spanFromKey(span: SpendTemplateSpan, yesterdayKey: string): string {
  switch (span) {
    case "30d":
      return addDaysToKey(yesterdayKey, -29);
    case "90d":
      return addDaysToKey(yesterdayKey, -89);
    case "ytd": {
      const year = yesterdayKey.slice(0, 4);
      return `${year}-01-01`;
    }
    case "12m":
      // 365 closed days through yesterday (same length as Spend Explorer 1y).
      return addDaysToKey(yesterdayKey, -364);
    default: {
      const _exhaustive: never = span;
      return _exhaustive;
    }
  }
}

function enumerateInclusive(fromKey: string, toKey: string): string[] {
  const dates: string[] = [];
  let cursor = fromKey;
  // Safety: sales window through yesterday is < 5 years of days.
  const max = SPEND_TEMPLATE_WINDOW_YEARS_BACK * 366 + 366;
  while (cursor <= toKey && dates.length < max) {
    dates.push(cursor);
    cursor = addDaysToKey(cursor, 1);
  }
  return dates;
}

function clampRange(
  fromKey: string,
  toKey: string,
  floorKey: string,
  yesterdayKey: string,
): SpendTemplateDateRange {
  let from = fromKey;
  let to = toKey;
  if (from > to) {
    const tmp = from;
    from = to;
    to = tmp;
  }
  if (to > yesterdayKey) to = yesterdayKey;
  if (from < floorKey) from = floorKey;
  if (from > to) {
    from = to;
    if (from < floorKey && floorKey <= yesterdayKey) {
      from = floorKey;
      to = floorKey;
    }
  }
  if (from > to) {
    return { fromKey: from, toKey: to, dates: [] };
  }
  return { fromKey: from, toKey: to, dates: enumerateInclusive(from, to) };
}

/**
 * Resolve a blank-template date spine.
 *
 * - `from`/`to` (YYYY-MM-DD) win over `span` when either parses.
 * - Spans are closed days through yesterday.
 * - `from` is clamped up to `floorKey` (sales window start).
 * - `to` is clamped down to yesterday.
 * - With neither range nor span: 14 closed days through yesterday.
 */
export function spendTemplateDateRange(opts: {
  span?: SpendTemplateSpan | string | null;
  from?: string | null;
  to?: string | null;
  now?: Date;
  floorKey?: string;
}): SpendTemplateDateRange {
  const now = opts.now ?? new Date();
  const yesterday = spendTemplateYesterdayKey(now);
  const floorKey =
    parseSpendTemplateYmd(opts.floorKey) ?? spendTemplateDefaultFloorKey(now);
  const fromParsed = parseSpendTemplateYmd(opts.from);
  const toParsed = parseSpendTemplateYmd(opts.to);
  const span = parseSpendTemplateSpan(opts.span ?? null);

  let fromKey: string;
  let toKey: string;

  if (fromParsed || toParsed) {
    fromKey = fromParsed ?? floorKey;
    toKey = toParsed ?? yesterday;
  } else if (span) {
    toKey = yesterday;
    fromKey = spanFromKey(span, yesterday);
  } else {
    toKey = yesterday;
    fromKey = addDaysToKey(yesterday, -13);
  }

  return clampRange(fromKey, toKey, floorKey, yesterday);
}

export type SpendTemplateRangeQuerySource = "from-to" | "span";

export type SpendTemplateRangeQuery = SpendTemplateDateRange & {
  source: SpendTemplateRangeQuerySource;
};

/**
 * Read `from`/`to`/`span` from the template download query.
 * Returns null when the caller should keep the legacy trailing-`dayCount` spine
 * (including today). Does not read `dates=` — that stays a hole-list override.
 */
export function resolveSpendTemplateRangeQuery(
  searchParams: { get: (name: string) => string | null },
  opts?: { now?: Date; floorKey?: string },
): SpendTemplateRangeQuery | null {
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const spanRaw = searchParams.get("span");
  const fromParsed = parseSpendTemplateYmd(from);
  const toParsed = parseSpendTemplateYmd(to);
  const span = parseSpendTemplateSpan(spanRaw);

  if (fromParsed || toParsed) {
    const range = spendTemplateDateRange({
      from,
      to,
      now: opts?.now,
      floorKey: opts?.floorKey,
    });
    return { ...range, source: "from-to" };
  }
  if (span) {
    const range = spendTemplateDateRange({
      span,
      now: opts?.now,
      floorKey: opts?.floorKey,
    });
    return { ...range, source: "span" };
  }
  return null;
}

/** Parse `?dates=` (comma-separated), capped for URL length. Invalid keys skipped later. */
export function parseSpendTemplateDatesParam(
  raw: string | null | undefined,
  cap: number = SPEND_TEMPLATE_DATES_QUERY_CAP,
): string[] {
  if (!raw?.trim()) return [];
  const limit = Number.isFinite(cap) && cap > 0 ? cap : SPEND_TEMPLATE_DATES_QUERY_CAP;
  return raw
    .split(",")
    .map((d) => d.trim())
    .filter(Boolean)
    .slice(0, limit);
}
