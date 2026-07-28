// Daily multi-channel spend CSV parser (pure, no I/O).
// Religion: aggregates ad spend only. No customer PII, no pixels/MTA, no live ad APIs.
// Merchants fill a template, export native platform CSVs, or combine uploads.

import type { SpendChannel } from "@mcfly/mer-engine";
import { SPEND_CHANNELS, SPEND_CHANNEL_LABELS } from "@mcfly/mer-engine";

export type CsvChannel = SpendChannel;

export interface ParsedSpendRow {
  /** Normalized to YYYY-MM-DD (local calendar day). */
  date: string;
  /** Named platform bucket used by the MER engine. */
  channel: CsvChannel;
  /** The channel/source text exactly as it appeared in the CSV. */
  rawChannel: string;
  /** Spend amount in the shop currency (>= 0). */
  amount: number;
}

export interface CsvParseResult {
  rows: ParsedSpendRow[];
  /** Human-readable problems, one per offending line (capped). */
  errors: string[];
  /** Count of non-empty data rows we attempted to parse. */
  totalDataRows: number;
}

export interface ParseSpendCsvOptions {
  /**
   * When set, date+amount exports (no channel column / no wide multi-channel)
   * are assigned to this channel. Native Meta/Google/etc. downloads use this.
   */
  forceChannel?: CsvChannel;
}

export interface SpendCsvInput {
  text: string;
  forceChannel?: CsvChannel;
  /** Prefix on errors (e.g. filename or "Meta Ads"). */
  label?: string;
}

const MAX_ERRORS = 25;

/** Exact / prefix-friendly header synonyms (matched after normalizeHeader). */
const HEADER_SYNONYMS: Record<"date" | "channel" | "amount", string[]> = {
  date: [
    "date",
    "day",
    "reporting_date",
    "reporting date",
    "date_start",
    "date start",
    "reporting starts",
    "reporting ends",
    "start date",
    "end date",
  ],
  channel: ["channel", "source", "platform", "medium", "network", "account"],
  amount: [
    "amount",
    "amount spent",
    "amount spent (usd)",
    "spend",
    "spend (usd)",
    "cost",
    "cost (account currency)",
    "cost (usd)",
    "total",
    "spend_usd",
    "cost_usd",
    "ad_spend",
    "ad spend",
    "total cost",
    "total spend",
  ],
};

/** Prefer reporting starts over reporting ends when both exist. */
const DATE_HEADER_PREFERENCE = [
  "reporting starts",
  "date_start",
  "date start",
  "start date",
  "day",
  "date",
  "reporting date",
  "reporting_date",
  "reporting ends",
  "end date",
];

/** Canonical wide-template headers (one row per day, every spend bucket). */
export const WIDE_TEMPLATE_HEADERS = [
  "Day",
  "Meta Ads",
  "Google Ads",
  "Microsoft Ads",
  "TikTok Ads",
  "Pinterest Ads",
  "Snapchat Ads",
  "Reddit Ads",
  "X Ads",
  "LinkedIn Ads",
  "Amazon Ads",
  "Apple Search Ads",
  "Affiliate Ads",
  "Email Cost",
  "Other",
] as const;

/** Friendly column guide shown next to the download. */
export const WIDE_TEMPLATE_COLUMNS: ReadonlyArray<{
  header: (typeof WIDE_TEMPLATE_HEADERS)[number];
  channel: CsvChannel | "day";
  help: string;
}> = [
  {
    header: "Day",
    channel: "day",
    help: "One calendar day per row (YYYY-MM-DD or MM/DD/YYYY).",
  },
  {
    header: "Meta Ads",
    channel: "meta",
    help: "Facebook + Instagram Ads Manager → Amount spent that day.",
  },
  {
    header: "Google Ads",
    channel: "google",
    help: "Google Ads cost that day (Search, Shopping, YouTube).",
  },
  {
    header: "Microsoft Ads",
    channel: "microsoft",
    help: "Microsoft Advertising / Bing spend that day.",
  },
  {
    header: "TikTok Ads",
    channel: "tiktok",
    help: "TikTok Ads Manager daily cost.",
  },
  {
    header: "Pinterest Ads",
    channel: "pinterest",
    help: "Pinterest Ads Manager spend that day.",
  },
  {
    header: "Snapchat Ads",
    channel: "snapchat",
    help: "Snapchat Ads Manager spend that day.",
  },
  {
    header: "Reddit Ads",
    channel: "reddit",
    help: "Reddit Ads spend that day.",
  },
  {
    header: "X Ads",
    channel: "x",
    help: "X / Twitter Ads daily spend.",
  },
  {
    header: "LinkedIn Ads",
    channel: "linkedin",
    help: "LinkedIn Campaign Manager amount spent that day.",
  },
  {
    header: "Amazon Ads",
    channel: "amazon",
    help: "Amazon Advertising (Sponsored Products / Brands / Display) spend that day.",
  },
  {
    header: "Apple Search Ads",
    channel: "apple_search",
    help: "Apple Search Ads daily spend.",
  },
  {
    header: "Affiliate Ads",
    channel: "affiliate",
    help: "Impact / CJ / ShareASale commissions + fees that day.",
  },
  {
    header: "Email Cost",
    channel: "email",
    help: "Klaviyo / ESP cash cost allocated to that day.",
  },
  {
    header: "Other",
    channel: "other",
    help: "Influencers, podcasts, agencies, print, Criteo, and anything else paid to advertise.",
  },
];

/**
 * Downloadable template: header + a few example days.
 * Replace sample numbers with your real spend (blank or 0 = no spend).
 */
export const WIDE_TEMPLATE_SAMPLE = `${WIDE_TEMPLATE_HEADERS.join(",")}
2026-07-01,412.55,288.10,40.00,95.00,30.00,20.00,15.00,10.00,8.00,12.00,5.00,0,25.00,0
2026-07-02,401.20,301.75,0,80.00,28.00,18.00,12.00,9.00,0,14.00,4.00,12.50,25.00,15.00
2026-07-03,390.00,275.00,35.00,70.00,25.00,0,10.00,8.00,6.00,0,0,0,25.00,0
`;

/** Blank starter: header + empty day rows ready to fill. */
export function buildBlankSpendTemplate(dayCount = 14): string {
  const today = new Date();
  const dates: string[] = [];
  for (let i = dayCount - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    dates.push(
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`,
    );
  }
  return buildBlankSpendTemplateForDates(dates);
}

/**
 * Blank template for specific YYYY-MM-DD days (coverage holes).
 * Invalid / empty dates are skipped; order preserved.
 */
export function buildBlankSpendTemplateForDates(dates: string[]): string {
  const rows: string[] = [WIDE_TEMPLATE_HEADERS.join(",")];
  for (const raw of dates) {
    const date = parseSpendDate(raw) ?? (/^\d{4}-\d{2}-\d{2}$/.test(raw.trim()) ? raw.trim() : null);
    if (!date) continue;
    rows.push(`${date}${",".repeat(WIDE_TEMPLATE_HEADERS.length - 1)}`);
  }
  return `${rows.join("\n")}\n`;
}

/** Platform column for a selected-platform demo / downloadable CSV. */
export interface SelectedPlatformTemplateCol {
  /** Checkbox / UI title (unused in headers — engineChannel maps to WIDE header). */
  title: string;
  engineChannel: SpendChannel;
}

export interface SelectedPlatformTemplateCsv {
  headers: string[];
  /** Data rows only (no header); each cell is a string ready for table/CSV. */
  rows: string[][];
  /** Full CSV text including header + trailing newline. */
  csv: string;
}

const WIDE_HEADER_BY_CHANNEL: ReadonlyMap<SpendChannel, string> = new Map(
  WIDE_TEMPLATE_COLUMNS.filter(
    (col): col is (typeof WIDE_TEMPLATE_COLUMNS)[number] & { channel: SpendChannel } =>
      col.channel !== "day",
  ).map((col) => [col.channel, col.header]),
);

function formatLocalYmd(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/**
 * Build a Day + selected-platform-columns demo CSV (illustrative numbers).
 * Headers use WIDE_TEMPLATE labels for each unique engineChannel (selection order).
 * Seven trailing local days ending on `now` (default today).
 */
export function buildSelectedPlatformTemplateCsv(
  platforms: SelectedPlatformTemplateCol[],
  options?: { dayCount?: number; now?: Date },
): SelectedPlatformTemplateCsv {
  const dayCount = options?.dayCount ?? 7;
  const now = options?.now ?? new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const headers: string[] = ["Day"];
  const seenChannels = new Set<SpendChannel>();
  for (const platform of platforms) {
    if (seenChannels.has(platform.engineChannel)) continue;
    seenChannels.add(platform.engineChannel);
    headers.push(
      WIDE_HEADER_BY_CHANNEL.get(platform.engineChannel) ??
        SPEND_CHANNEL_LABELS[platform.engineChannel] ??
        platform.title,
    );
  }

  const channelColCount = headers.length - 1;
  const rows: string[][] = [];
  for (let i = dayCount - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const date = formatLocalYmd(d);
    const dayIndex = dayCount - 1 - i;
    const cells = [date];
    for (let col = 0; col < channelColCount; col++) {
      // Small, stable fake spend so merchants see the Day × platform shape.
      const amount = 80 + col * 35 + dayIndex * 12 + ((col + dayIndex) % 3) * 5;
      cells.push(amount.toFixed(2));
    }
    rows.push(cells);
  }

  const csv = `${[headers, ...rows].map((r) => r.join(",")).join("\n")}\n`;
  return { headers, rows, csv };
}

export interface GroupedCsvError {
  /** Short category label for the banner. */
  label: string;
  /** How many raw errors fell in this bucket. */
  count: number;
  /** Up to a few concrete line messages. */
  examples: string[];
}

export interface GroupedCsvErrors {
  groups: GroupedCsvError[];
  total: number;
  /** True when more raw errors exist than we surface in examples. */
  truncated: boolean;
}

const ERROR_DISPLAY_MAX_GROUPS = 6;
const ERROR_DISPLAY_EXAMPLES = 2;

/**
 * Collapse per-line CSV parse noise into scannable groups.
 * Never invents Shopify/till blame — spend CSV only.
 */
export function groupCsvErrors(
  errors: string[],
  maxGroups = ERROR_DISPLAY_MAX_GROUPS,
): GroupedCsvErrors {
  const buckets = new Map<string, GroupedCsvError>();

  for (const err of errors) {
    const key = classifyCsvError(err);
    const existing = buckets.get(key);
    if (existing) {
      existing.count += 1;
      if (existing.examples.length < ERROR_DISPLAY_EXAMPLES) {
        existing.examples.push(err);
      }
    } else {
      buckets.set(key, {
        label: key,
        count: 1,
        examples: [err],
      });
    }
  }

  const groups = Array.from(buckets.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, maxGroups);

  const shownExamples = groups.reduce((n, g) => n + g.examples.length, 0);
  return {
    groups,
    total: errors.length,
    truncated: shownExamples < errors.length || buckets.size > maxGroups,
  };
}

function classifyCsvError(err: string): string {
  const v = err.toLowerCase();
  if (v.includes("empty")) return "Empty file";
  if (v.includes("missing a day") || v.includes("missing a date")) {
    return "Missing Day/date column";
  }
  if (v.includes("could not detect platform")) {
    return "Unrecognized columns";
  }
  if (v.includes("cannot be negative")) return "Negative spend amounts";
  if (v.includes("could not read date")) return "Unreadable dates";
  if (v.includes("could not read") && v.includes("amount")) {
    return "Unreadable amounts";
  }
  if (v.includes("could not read")) return "Unreadable cells";
  return "Row problems";
}

/**
 * Bucket free-text channel/header into a named MER channel.
 * Honest spend buckets only — never invents attribution.
 */
export function normalizeChannel(raw: string): CsvChannel {
  const v = raw.trim().toLowerCase();
  if (
    v.includes("meta") ||
    v.includes("facebook") ||
    v === "fb" ||
    v.includes("instagram") ||
    v === "ig"
  ) {
    return "meta";
  }
  if (
    v.includes("google") ||
    v === "adwords" ||
    v.includes("youtube") ||
    v === "gads" ||
    v === "g-ads"
  ) {
    return "google";
  }
  if (
    v.includes("microsoft") ||
    v.includes("bing") ||
    v.includes("msads") ||
    v.includes("microsoft advertising")
  ) {
    return "microsoft";
  }
  if (v.includes("tiktok") || v === "tt" || v.includes("bytedance")) {
    return "tiktok";
  }
  if (v.includes("pinterest") || v === "pin") {
    return "pinterest";
  }
  if (v.includes("snapchat") || v === "snap") {
    return "snapchat";
  }
  if (v.includes("reddit")) {
    return "reddit";
  }
  if (
    v === "x" ||
    v === "x ads" ||
    v.startsWith("x ads") ||
    v.includes("twitter") ||
    v.includes("x/twitter") ||
    v.includes("x / twitter")
  ) {
    return "x";
  }
  if (v.includes("linkedin") || v.includes("linked in")) {
    return "linkedin";
  }
  if (v.includes("amazon")) {
    return "amazon";
  }
  if (
    v.includes("apple search") ||
    v.includes("apple ads") ||
    v === "asa" ||
    v.includes("apple_search")
  ) {
    return "apple_search";
  }
  if (v.includes("affiliate") || v.includes("impact") || v.includes("shareasale") || v.includes("cj ")) {
    return "affiliate";
  }
  if (
    v.includes("email") ||
    v.includes("klaviyo") ||
    v.includes("mailchimp") ||
    v.includes("sms") ||
    v.includes("attentive") ||
    v.includes("postscript")
  ) {
    return "email";
  }
  return "other";
}

/** Accepts YYYY-MM-DD, YYYY/MM/DD, MM/DD/YYYY, MM-DD-YYYY. Returns YYYY-MM-DD or null. */
export function parseSpendDate(raw: string): string | null {
  const v = raw.trim().replace(/^["']|["']$/g, "");
  if (!v) return null;

  let y: number, mo: number, d: number;
  let m = /^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/.exec(v);
  if (m) {
    y = Number(m[1]);
    mo = Number(m[2]);
    d = Number(m[3]);
  } else {
    m = /^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/.exec(v);
    if (!m) return null;
    mo = Number(m[1]);
    d = Number(m[2]);
    y = Number(m[3]);
  }

  if (mo < 1 || mo > 12 || d < 1 || d > 31) return null;
  const probe = new Date(y, mo - 1, d);
  if (
    probe.getFullYear() !== y ||
    probe.getMonth() !== mo - 1 ||
    probe.getDate() !== d
  ) {
    return null;
  }

  const mm = String(mo).padStart(2, "0");
  const dd = String(d).padStart(2, "0");
  return `${y}-${mm}-${dd}`;
}

/** Strips currency symbols, thousands separators, and parentheses-negatives. */
export function parseSpendAmount(raw: string): number | null {
  let v = raw.trim().replace(/^["']|["']$/g, "");
  if (!v) return null;
  let negative = false;
  if (/^\(.*\)$/.test(v)) {
    negative = true;
    v = v.slice(1, -1);
  }
  v = v.replace(/[^0-9.\-]/g, "");
  if (v === "" || v === "-" || v === ".") return null;
  const n = Number(v);
  if (!Number.isFinite(n)) return null;
  return negative ? -n : n;
}

/** Split one CSV line, honoring quoted fields with embedded commas. */
function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (inQuotes) {
      if (c === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cur += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      out.push(cur);
      cur = "";
    } else {
      cur += c;
    }
  }
  out.push(cur);
  return out.map((s) => s.trim());
}

function normalizeHeader(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/^["']|["']$/g, "")
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Header without parenthetical notes: "Amount spent (USD)" → "amount spent". */
function headerBare(raw: string): string {
  return normalizeHeader(raw)
    .replace(/\s*\([^)]*\)\s*/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function headerMatchesSynonym(header: string, synonym: string): boolean {
  const h = normalizeHeader(header);
  const bare = headerBare(header);
  const syn = synonym.toLowerCase().trim();
  if (h === syn || bare === syn) return true;
  // Prefix: "amount spent (usd)" / "cost something" after bare strip
  if (h.startsWith(`${syn} `) || bare.startsWith(`${syn} `)) return true;
  return false;
}

function findColumn(headers: string[], synonyms: string[]): number {
  for (let i = 0; i < headers.length; i++) {
    for (const syn of synonyms) {
      if (headerMatchesSynonym(headers[i], syn)) return i;
    }
  }
  return -1;
}

function findDateColumn(headers: string[]): number {
  // Prefer Reporting starts / Day over Reporting ends when both exist.
  for (const preferred of DATE_HEADER_PREFERENCE) {
    for (let i = 0; i < headers.length; i++) {
      if (headerMatchesSynonym(headers[i], preferred)) return i;
    }
  }
  return findColumn(headers, HEADER_SYNONYMS.date);
}

function isAmountLikeHeader(header: string): boolean {
  return HEADER_SYNONYMS.amount.some((syn) => headerMatchesSynonym(header, syn));
}

function isDateLikeHeader(header: string): boolean {
  const h = normalizeHeader(header);
  const bare = headerBare(header);
  if (
    HEADER_SYNONYMS.date.some((syn) => headerMatchesSynonym(header, syn)) ||
    DATE_HEADER_PREFERENCE.some((syn) => headerMatchesSynonym(header, syn))
  ) {
    return true;
  }
  if (h.startsWith("date") || bare.startsWith("date") || bare === "day") return true;
  if (bare.includes("reporting start") || bare.includes("reporting end")) return true;
  return false;
}

function isSummaryDateLabel(raw: string): boolean {
  const v = raw.trim().replace(/^["']|["']$/g, "").toLowerCase();
  if (!v) return true; // empty date → treat as skippable summary/blank
  return v === "total" || v === "totals" || v.startsWith("total ") || v === "grand total";
}

/** Wide spine: one row per day with named platform columns. */
interface WideChannelCol {
  index: number;
  channel: CsvChannel;
  rawHeader: string;
}

function mapWideChannelCols(headers: string[]): WideChannelCol[] {
  const out: WideChannelCol[] = [];
  for (let i = 0; i < headers.length; i++) {
    const raw = headers[i].trim();
    const h = normalizeHeader(raw);
    if (!h) continue;
    // Never treat Day / amount / sales columns as a platform bucket.
    if (isDateLikeHeader(raw) || isAmountLikeHeader(raw)) continue;
    if (
      h.includes("online sales") ||
      h === "sales" ||
      h.includes("total cost") ||
      h === "total spend" ||
      h === "total" ||
      h.includes("revenue")
    ) {
      continue;
    }
    if (
      h.includes("google") ||
      h.includes("meta") ||
      h.includes("facebook") ||
      h.includes("instagram") ||
      h.includes("microsoft") ||
      h.includes("bing") ||
      h.includes("tiktok") ||
      h.includes("pinterest") ||
      h.includes("snapchat") ||
      h.includes("reddit") ||
      h === "x" ||
      h === "x ads" ||
      h.startsWith("x ads") ||
      h.includes("twitter") ||
      h.includes("linkedin") ||
      h.includes("amazon") ||
      h.includes("apple search") ||
      h.includes("apple ads") ||
      h.includes("affiliate") ||
      h.includes("klaviyo") ||
      h.includes("mailchimp") ||
      h.includes("email") ||
      h.includes("sms") ||
      h.includes("criteo") ||
      h.includes("adroll") ||
      h.includes("ads") ||
      h === "other" ||
      h.includes("other ads") ||
      h.includes("other spend")
    ) {
      out.push({ index: i, channel: normalizeChannel(h), rawHeader: raw });
    }
  }
  return out;
}

function pushError(errors: string[], message: string): void {
  if (errors.length < MAX_ERRORS) errors.push(message);
}

function parseLongSpendCsv(
  lines: string[],
  dateCol: number,
  channelCol: number,
  amountCol: number,
): CsvParseResult {
  const rows: ParsedSpendRow[] = [];
  const errors: string[] = [];
  let totalDataRows = 0;

  for (let i = 1; i < lines.length; i++) {
    totalDataRows++;
    const cells = splitCsvLine(lines[i]);
    const lineNo = i + 1;

    const rawDate = cells[dateCol] ?? "";
    const rawChannel = cells[channelCol] ?? "";
    const rawAmount = cells[amountCol] ?? "";

    // Summary / blank rows: skip quietly.
    if (isSummaryDateLabel(rawDate) || !String(rawAmount).trim()) {
      continue;
    }

    const date = parseSpendDate(rawDate);
    if (!date) {
      pushError(errors, `Line ${lineNo}: could not read date "${rawDate}".`);
      continue;
    }

    const amount = parseSpendAmount(rawAmount);
    if (amount === null) {
      pushError(errors, `Line ${lineNo}: could not read amount "${rawAmount}".`);
      continue;
    }
    if (amount < 0) {
      pushError(errors, `Line ${lineNo}: spend cannot be negative ("${rawAmount}").`);
      continue;
    }
    if (amount === 0) continue;

    rows.push({
      date,
      channel: normalizeChannel(rawChannel),
      rawChannel: rawChannel.trim(),
      amount,
    });
  }

  return { rows, errors, totalDataRows };
}

function parseForcedChannelSpendCsv(
  lines: string[],
  dateCol: number,
  amountCol: number,
  forceChannel: CsvChannel,
): CsvParseResult {
  const rows: ParsedSpendRow[] = [];
  const errors: string[] = [];
  let totalDataRows = 0;
  const rawLabel = SPEND_CHANNEL_LABELS[forceChannel] ?? forceChannel;

  for (let i = 1; i < lines.length; i++) {
    totalDataRows++;
    const cells = splitCsvLine(lines[i]);
    const lineNo = i + 1;
    const rawDate = cells[dateCol] ?? "";
    const rawAmount = cells[amountCol] ?? "";

    if (isSummaryDateLabel(rawDate) || !String(rawAmount).trim()) {
      continue;
    }

    const date = parseSpendDate(rawDate);
    if (!date) {
      pushError(errors, `Line ${lineNo}: could not read date "${rawDate}".`);
      continue;
    }

    const amount = parseSpendAmount(rawAmount);
    if (amount === null) {
      pushError(errors, `Line ${lineNo}: could not read amount "${rawAmount}".`);
      continue;
    }
    if (amount < 0) {
      pushError(errors, `Line ${lineNo}: spend cannot be negative ("${rawAmount}").`);
      continue;
    }
    if (amount === 0) continue;

    rows.push({
      date,
      channel: forceChannel,
      rawChannel: rawLabel,
      amount,
    });
  }

  return { rows, errors, totalDataRows };
}

function parseWideSpendCsv(
  lines: string[],
  dateCol: number,
  channelCols: WideChannelCol[],
): CsvParseResult {
  const rows: ParsedSpendRow[] = [];
  const errors: string[] = [];
  let totalDataRows = 0;

  for (let i = 1; i < lines.length; i++) {
    totalDataRows++;
    const cells = splitCsvLine(lines[i]);
    const lineNo = i + 1;
    const rawDate = cells[dateCol] ?? "";

    if (isSummaryDateLabel(rawDate)) {
      continue;
    }

    const date = parseSpendDate(rawDate);
    if (!date) {
      pushError(errors, `Line ${lineNo}: could not read date "${cells[dateCol] ?? ""}".`);
      continue;
    }

    for (const col of channelCols) {
      const rawAmount = cells[col.index] ?? "";
      if (!String(rawAmount).trim()) continue;
      const amount = parseSpendAmount(rawAmount);
      if (amount === null) {
        pushError(
          errors,
          `Line ${lineNo}: could not read ${col.rawHeader} amount "${rawAmount}".`,
        );
        continue;
      }
      if (amount < 0) {
        pushError(
          errors,
          `Line ${lineNo}: ${col.rawHeader} spend cannot be negative ("${rawAmount}").`,
        );
        continue;
      }
      if (amount === 0) continue;
      rows.push({
        date,
        channel: col.channel,
        rawChannel: col.rawHeader,
        amount,
      });
    }
  }

  return { rows, errors, totalDataRows };
}

/**
 * Parse a daily multi-channel spend CSV.
 *
 * Supports:
 * 1. Wide template: Day + Meta / Google / Microsoft / TikTok / Affiliate / Email / Other
 * 2. Long: date, channel, amount
 * 3. Single-channel native exports (date + amount) when `forceChannel` is set
 *
 * Sales / revenue columns are ignored (Shopify is the till).
 */
export function parseSpendCsv(
  text: string,
  options: ParseSpendCsvOptions = {},
): CsvParseResult {
  const forceChannel = options.forceChannel;
  const clean = text.replace(/^\uFEFF/, "");
  const lines = clean
    .split(/\r\n|\r|\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length === 0) {
    return { rows: [], errors: ["The file is empty."], totalDataRows: 0 };
  }

  const headers = splitCsvLine(lines[0]);
  const dateCol = findDateColumn(headers);
  const channelCol = findColumn(headers, HEADER_SYNONYMS.channel);
  const amountCol = findColumn(headers, HEADER_SYNONYMS.amount);
  const wideCols = mapWideChannelCols(headers);

  if (dateCol === -1) {
    return {
      rows: [],
      errors: [
        "Missing a Day/date column. Download the Mcfly spend template (Day + Meta/Google/Microsoft/TikTok/Affiliate/Email/Other), or export a platform CSV with Day + spend. Sales stay in Shopify — this file is spend only.",
      ],
      totalDataRows: 0,
    };
  }

  // Long format wins when channel + amount are both present.
  if (channelCol !== -1 && amountCol !== -1) {
    return parseLongSpendCsv(lines, dateCol, channelCol, amountCol);
  }

  // Wide Mcfly / multi-channel sheet (2+ platform columns).
  if (wideCols.length >= 2) {
    return parseWideSpendCsv(lines, dateCol, wideCols);
  }

  // Single named platform column (e.g. only "Meta Ads") — treat as wide with one bucket.
  if (wideCols.length === 1 && amountCol === -1) {
    return parseWideSpendCsv(lines, dateCol, wideCols);
  }

  // Native single-channel export: Day + Amount spent / Cost (needs forceChannel).
  if (amountCol !== -1 && (wideCols.length === 0 || wideCols.length === 1)) {
    if (forceChannel) {
      return parseForcedChannelSpendCsv(lines, dateCol, amountCol, forceChannel);
    }
    return {
      rows: [],
      errors: [
        "This looks like a single-platform export (date + spend, no channel column). Choose the channel when combining uploads, or use the Mcfly template / date,channel,amount format.",
      ],
      totalDataRows: 0,
    };
  }

  if (wideCols.length > 0) {
    return parseWideSpendCsv(lines, dateCol, wideCols);
  }

  if (forceChannel && amountCol === -1) {
    return {
      rows: [],
      errors: [
        `Could not find a spend/amount column for ${SPEND_CHANNEL_LABELS[forceChannel]}. Export Day + Amount spent / Cost from the ads platform.`,
      ],
      totalDataRows: 0,
    };
  }

  return {
    rows: [],
    errors: [
      "Could not detect platform spend columns. Download the Mcfly template (Day + Meta/Google/Microsoft/TikTok/Affiliate/Email/Other), combine platform exports with a channel each, or use long format date,channel,amount. Do not paste Shopify sales into this CSV.",
    ],
    totalDataRows: 0,
  };
}

/**
 * Parse multiple platform CSVs (or mixed templates) into one row list.
 * Errors are prefixed with each input's label when provided.
 */
export function combineSpendCsvInputs(inputs: SpendCsvInput[]): CsvParseResult {
  const rows: ParsedSpendRow[] = [];
  const errors: string[] = [];
  let totalDataRows = 0;

  if (inputs.length === 0) {
    return { rows: [], errors: ["No CSV files to combine."], totalDataRows: 0 };
  }

  let sawText = false;
  for (const input of inputs) {
    if (!input.text.trim()) continue;
    sawText = true;
    const parsed = parseSpendCsv(input.text, { forceChannel: input.forceChannel });
    rows.push(...parsed.rows);
    totalDataRows += parsed.totalDataRows;
    const prefix = input.label ? `${input.label}: ` : "";
    for (const err of parsed.errors) {
      pushError(errors, `${prefix}${err}`);
    }
  }

  if (!sawText) {
    return {
      rows: [],
      errors: ["Choose at least one CSV file before combining."],
      totalDataRows: 0,
    };
  }

  return { rows, errors, totalDataRows };
}

export interface AggregatedSpendDay {
  date: string;
  channel: CsvChannel;
  amount: number;
}

/** Sum multiple rows that share the same day + channel into one entry. */
export function aggregateSpendRows(rows: ParsedSpendRow[]): AggregatedSpendDay[] {
  const map = new Map<string, AggregatedSpendDay>();
  for (const row of rows) {
    const key = `${row.date}|${row.channel}`;
    const existing = map.get(key);
    if (existing) {
      existing.amount += row.amount;
    } else {
      map.set(key, { date: row.date, channel: row.channel, amount: row.amount });
    }
  }
  return Array.from(map.values()).sort((a, b) =>
    a.date === b.date ? a.channel.localeCompare(b.channel) : a.date.localeCompare(b.date),
  );
}

export interface CsvImportSummary {
  written: number;
  skipped: number;
  days: number;
  channels: CsvChannel[];
  dateRange: { start: string; end: string } | null;
  totalAmount: number;
  errors: string[];
  totalDataRows: number;
}

export { SPEND_CHANNELS, SPEND_CHANNEL_LABELS };
