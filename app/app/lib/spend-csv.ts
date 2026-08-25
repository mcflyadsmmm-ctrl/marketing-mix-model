// Daily multi-channel spend CSV parser (pure, no I/O).
// Religion: aggregates ad spend only. No customer PII, no pixels/MTA, no live ad APIs.
// Merchants fill a template, export native platform CSVs, or combine uploads.

import type { SpendChannel } from "@mcfly/mer-engine";
import { SPEND_CHANNELS, SPEND_CHANNEL_LABELS } from "@mcfly/mer-engine";
import {
  MAX_CUSTOM_SPEND_CHANNELS,
  customChannelFromLabel,
  normalizeCustomChannelList,
} from "./spend-custom-channel";

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
  /**
   * SpendEntry.customKey for `other` extras (billboards, radio, …).
   * Empty / omitted = unlabeled Other or a named digital channel.
   */
  customKey?: string;
  /** Merchant-facing extra name when customKey is set. */
  customLabel?: string;
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

/** Fail-closed paste/upload size — ~2 MiB keeps big Sheets exports in, not multi-year dumps. */
export const SPEND_CSV_MAX_BYTES = 2 * 1024 * 1024;

/** Fail-closed data-row cap (header excluded). ~50k ≈ multi-year × channel long format. */
export const SPEND_CSV_MAX_ROWS = 50_000;

export type SpendCsvLimitResult =
  | { ok: true }
  | { ok: false; code: "max_bytes" | "max_rows"; error: string };

function utf8ByteLength(text: string): number {
  return new TextEncoder().encode(text).length;
}

function formatByteSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Count non-empty lines after the header (BOM-safe). Empty input → 0. */
export function countSpendCsvDataRows(text: string): number {
  const lines = text
    .replace(/^\uFEFF/, "")
    .split(/\r\n|\r|\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
  return Math.max(0, lines.length - 1);
}

/**
 * Enforce MAX_BYTES + MAX_ROWS before parse/persist.
 * Clear merchant copy — split by date range or channel; spend aggregates only.
 */
export function assertSpendCsvLimits(text: string): SpendCsvLimitResult {
  const bytes = utf8ByteLength(text);
  if (bytes > SPEND_CSV_MAX_BYTES) {
    return {
      ok: false,
      code: "max_bytes",
      error: `This paste/file is too large (${formatByteSize(bytes)}; max ${SPEND_CSV_MAX_ROWS.toLocaleString()} rows / ${formatByteSize(SPEND_CSV_MAX_BYTES)}). Split by date range or channel and import in batches. Spend aggregates only — do not paste sales.`,
    };
  }

  const dataRows = countSpendCsvDataRows(text);
  if (dataRows > SPEND_CSV_MAX_ROWS) {
    return {
      ok: false,
      code: "max_rows",
      error: `This CSV has ${dataRows.toLocaleString()} data rows (max ${SPEND_CSV_MAX_ROWS.toLocaleString()} rows / ${formatByteSize(SPEND_CSV_MAX_BYTES)}). Split by date range or channel and import in batches.`,
    };
  }

  return { ok: true };
}

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
    help: "Influencers, podcasts, agencies, print — or add named extra columns (Billboards, Radio, …).",
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

/** Long-format headers for SyncWith / Coupler / Supermetrics → Sheet → Mcfly. */
export const PIPE_LONG_HEADERS = ["date", "channel", "amount"] as const;

/** Exact channel strings for pipe Sheets — match wide CSV headers (parser-safe). */
export const PIPE_CHANNEL_LABELS: readonly string[] = WIDE_TEMPLATE_COLUMNS.filter(
  (col): col is (typeof WIDE_TEMPLATE_COLUMNS)[number] & { channel: SpendChannel } =>
    col.channel !== "day",
).map((col) => col.header);

/**
 * Long CSV for pipe tools: one row per day × channel.
 * `example=true` fills sample Meta/Google amounts; blank leaves amount empty for mapping.
 * Optional `channels` narrows blank rows (Free Meta+Google); omit for all wide columns.
 */
export function buildPipeAutomationLongTemplate(options?: {
  dayCount?: number;
  example?: boolean;
  now?: Date;
  channels?: readonly SpendChannel[];
}): string {
  const dayCount = options?.dayCount ?? 7;
  const example = options?.example === true;
  const now = options?.now ?? new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const allChannelCols = WIDE_TEMPLATE_COLUMNS.filter(
    (col): col is (typeof WIDE_TEMPLATE_COLUMNS)[number] & { channel: SpendChannel } =>
      col.channel !== "day",
  );
  const allowed =
    options?.channels && options.channels.length > 0
      ? new Set(options.channels)
      : null;
  const channelCols = allowed
    ? allChannelCols.filter((col) => allowed.has(col.channel))
    : allChannelCols;
  const rows: string[] = [PIPE_LONG_HEADERS.join(",")];

  for (let i = dayCount - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const date = `${y}-${m}-${day}`;
    for (const col of channelCols) {
      if (example) {
        if (col.channel === "meta") {
          rows.push(`${date},${csvEscape(col.header)},${100 + (i % 5) * 10}`);
        } else if (col.channel === "google") {
          rows.push(`${date},${csvEscape(col.header)},${80 + (i % 3) * 5}`);
        }
        // Example file stays short — Meta + Google only
        continue;
      }
      rows.push(`${date},${csvEscape(col.header)},`);
    }
  }
  return `${rows.join("\n")}\n`;
}

/**
 * Wide blank/example for pipe tools that prefer one row per day (Day + channel columns).
 * Same headers as Mcfly Free CSV so import is identical.
 * Free (`channels` set): blank/example use selected columns only — never full WIDE sample.
 */
export function buildPipeAutomationWideTemplate(options?: {
  dayCount?: number;
  example?: boolean;
  now?: Date;
  channels?: readonly SpendChannel[];
}): string {
  const dayCount = options?.dayCount ?? 14;
  const channels = options?.channels;
  if (options?.example) {
    if (channels && channels.length > 0) {
      return buildSelectedPlatformTemplateCsv(platformsToTemplateCols([...channels]), {
        dayCount,
        example: true,
        now: options?.now,
      }).csv;
    }
    return WIDE_TEMPLATE_SAMPLE;
  }
  return buildBlankSpendTemplate(dayCount, channels);
}

function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/**
 * Blank starter: header + empty day rows ready to fill.
 * Pass `channels` (e.g. Free Meta+Google) to narrow columns; omit for full Pro wide.
 */
export function buildBlankSpendTemplate(
  dayCount = 14,
  channels?: readonly SpendChannel[],
): string {
  const today = new Date();
  const dates: string[] = [];
  for (let i = dayCount - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    dates.push(
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`,
    );
  }
  return buildBlankSpendTemplateForDates(dates, channels);
}

/**
 * Blank template for specific YYYY-MM-DD days (coverage holes).
 * Invalid / empty dates are skipped; order preserved.
 * Optional `channels` narrows to those columns (Free default = meta,google).
 */
export function buildBlankSpendTemplateForDates(
  dates: string[],
  channels?: readonly SpendChannel[],
): string {
  const headers =
    channels && channels.length > 0
      ? [
          "Day",
          ...channels.map(
            (ch) =>
              WIDE_HEADER_BY_CHANNEL.get(ch) ??
              SPEND_CHANNEL_LABELS[ch] ??
              ch,
          ),
        ]
      : [...WIDE_TEMPLATE_HEADERS];
  const rows: string[] = [headers.join(",")];
  for (const raw of dates) {
    const date = parseSpendDate(raw) ?? (/^\d{4}-\d{2}-\d{2}$/.test(raw.trim()) ? raw.trim() : null);
    if (!date) continue;
    rows.push(`${date}${",".repeat(headers.length - 1)}`);
  }
  return `${rows.join("\n")}\n`;
}

/** Platform column for a selected-platform demo / downloadable CSV. */
export interface SelectedPlatformTemplateCol {
  /** Checkbox / UI title. */
  title: string;
  engineChannel: SpendChannel;
  /** Unique CSV header — required for multiple `other` extras. */
  header?: string;
  customKey?: string;
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
 * Build a Day + selected-platform-columns CSV.
 * Headers use WIDE_TEMPLATE labels for named engines, or `header` for extras
 * so Billboards and Radio can both live in `other` without collapsing.
 * Seven trailing local days ending on `now` (default today).
 * `example` defaults true (sample amounts) for back-compat; `example:false` leaves amounts empty.
 */
export function buildSelectedPlatformTemplateCsv(
  platforms: SelectedPlatformTemplateCol[],
  options?: { dayCount?: number; now?: Date; example?: boolean },
): SelectedPlatformTemplateCsv {
  const dayCount = options?.dayCount ?? 7;
  const now = options?.now ?? new Date();
  const example = options?.example !== false;
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const headers: string[] = ["Day"];
  const seenHeaders = new Set<string>();
  for (const platform of platforms) {
    const header =
      platform.header?.trim() ||
      WIDE_HEADER_BY_CHANNEL.get(platform.engineChannel) ||
      SPEND_CHANNEL_LABELS[platform.engineChannel] ||
      platform.title;
    if (!header || seenHeaders.has(header)) continue;
    seenHeaders.add(header);
    headers.push(header);
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
      if (example) {
        // Small, stable fake spend so merchants see the Day × platform shape.
        const amount = 80 + col * 35 + dayIndex * 12 + ((col + dayIndex) % 3) * 5;
        cells.push(amount.toFixed(2));
      } else {
        cells.push("");
      }
    }
    rows.push(cells);
  }

  const csv = `${[headers, ...rows].map((r) => r.join(",")).join("\n")}\n`;
  return { headers, rows, csv };
}

/** Google Sheets “create blank spreadsheet” — no OAuth required from Mcfly. */
export const SHEETS_CREATE_URL = "https://docs.google.com/spreadsheets/create";

export interface SheetsImportGuide {
  /** Numbered merchant steps (1-indexed in UI). */
  steps: string[];
  sheetsNewUrl: string;
  /** Honesty line — Free CSV never requires SyncWith-class tools. */
  tip: string;
}

/**
 * Pure copy helper for Sheets-first spend onboarding (Spend UI + public site).
 * No React — keep steps identical everywhere merchants might get lost.
 */
export function buildSheetsImportGuide(options?: {
  platformLabels?: string[];
}): SheetsImportGuide {
  const labels =
    options?.platformLabels && options.platformLabels.length > 0
      ? options.platformLabels.join(", ")
      : "your selected platforms";
  return {
    sheetsNewUrl: SHEETS_CREATE_URL,
    tip: "Free path never requires SyncWith, Coupler, or Supermetrics. Paste or CSV alone is enough — you only pay those tools if you want hands-off fills.",
    steps: [
      `Confirm platforms checked above (or on Automate): ${labels}.`,
      "Download your Mcfly blank template — or Open Google Sheets and import that CSV.",
      "In the new Sheet: File → Import → Upload → your CSV → Replace spreadsheet → Import data.",
      "Fill daily spend by hand — or optionally connect SyncWith / Coupler / Supermetrics / Coefficient to these columns (you pay those tools).",
      "File → Download → Comma Separated Values (.csv) → paste or import back on Spend.",
    ],
  };
}

const SPEND_CHANNEL_SET: ReadonlySet<string> = new Set(SPEND_CHANNELS);

/**
 * Parse `?platforms=meta,google,tiktok` into validated SpendChannels (deduped, order preserved).
 * Unknown tokens are skipped — never invents channels.
 */
export function parsePlatformsParam(raw: string | null | undefined): SpendChannel[] {
  if (!raw?.trim()) return [];
  const seen = new Set<SpendChannel>();
  const out: SpendChannel[] = [];
  for (const part of raw.split(",")) {
    const key = part.trim().toLowerCase().replace(/-/g, "_");
    if (!key || !SPEND_CHANNEL_SET.has(key)) continue;
    const channel = key as SpendChannel;
    if (seen.has(channel)) continue;
    seen.add(channel);
    out.push(channel);
  }
  return out;
}

/** Filename for selected-platform template downloads, e.g. mcfly-spend-meta-google-blank.csv */
export function selectedPlatformsTemplateFilename(
  channels: SpendChannel[],
  kind: "blank" | "example",
): string {
  const slug =
    channels.length > 0
      ? channels.map((c) => c.replace(/_/g, "-")).join("-")
      : "day-only";
  return `mcfly-spend-${slug}-${kind}.csv`;
}

/** Build SelectedPlatformTemplateCol[] from validated channel ids (for template route). */
export function platformsToTemplateCols(
  channels: SpendChannel[],
): SelectedPlatformTemplateCol[] {
  return channels.map((engineChannel) => ({
    title: SPEND_CHANNEL_LABELS[engineChannel] ?? engineChannel,
    engineChannel,
  }));
}

/** Named extras → unique Other columns (Billboards, Radio, …). */
export function customNamesToTemplateCols(
  names: readonly string[],
): SelectedPlatformTemplateCol[] {
  return normalizeCustomChannelList(names).flatMap((customLabel) => {
    const parsed = customChannelFromLabel(customLabel);
    if (!parsed) return [];
    return [
      {
        title: parsed.customLabel,
        engineChannel: "other" as const,
        header: parsed.customLabel,
        customKey: parsed.customKey,
      },
    ];
  });
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
  if (v.includes("too large") || (v.includes("max ") && v.includes("mb"))) {
    return "File too large";
  }
  if (v.includes("data rows") && v.includes("max")) {
    return "Too many rows";
  }
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

/**
 * True when the amount looks like EU decimal comma notation (e.g. `12,50` or
 * `1.234,56`). Fail-closed — stripping commas would silently inflate spend.
 * US `1,234.56` / `1,234` (comma thousands) must NOT match.
 */
function looksLikeEuDecimal(raw: string): boolean {
  const v = raw
    .replace(/[$€£¥]/g, "")
    .replace(/\b(USD|EUR|GBP)\b/gi, "")
    .replace(/\s/g, "")
    .trim();
  if (!v) return false;
  // `1.234,56` / `12,50` — comma as decimal (1–2 fractional digits).
  if (/^-?\d{1,3}(\.\d{3})*,\d{1,2}$/.test(v)) return true;
  // Bare `12,50` without thousand dots (already covered); keep explicit simple form.
  if (/^-?\d+,\d{1,2}$/.test(v)) return true;
  return false;
}

/**
 * Strips currency symbols, thousands separators, and parentheses-negatives.
 * Preserves scientific notation (`1.23E+05`, `1e6`) — never strip `e`/`E` into digits.
 * Fail-closed on EU-style decimals (`12,50`, `1.234,56`) → null.
 */
export function parseSpendAmount(raw: string): number | null {
  let v = raw.trim().replace(/^["']|["']$/g, "");
  if (!v) return null;
  let negative = false;
  if (/^\(.*\)$/.test(v)) {
    negative = true;
    v = v.slice(1, -1).trim();
  }
  if (looksLikeEuDecimal(v)) return null;
  // Keep digits, decimal, sign, and scientific e/E (+/− exponent). Do NOT use
  // [^0-9.\-] — that turns 1.23E+05 into 1.2305.
  v = v.replace(/[^0-9.eE+\-]/g, "");
  if (v === "" || v === "-" || v === "+" || v === "." || v === "-." || v === "+.") {
    return null;
  }
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

/**
 * Bare short amount tokens — exact/bare match only.
 * Prefix-matching "cost"/"total"/"spend" falsely wins "Cost / conv.",
 * "Total impressions", "Cost per result".
 */
const AMOUNT_EXACT_ONLY_SYNONYMS = new Set(["cost", "total", "spend"]);

/**
 * Strongest → weakest spend header when several columns match.
 * "Amount spent" beats bare "Cost".
 */
const AMOUNT_HEADER_PREFERENCE = [
  "amount spent",
  "amount spent (usd)",
  "amount",
  "cost (account currency)",
  "cost (usd)",
  "total spend",
  "total cost",
  "ad spend",
  "ad_spend",
  "spend (usd)",
  "spend_usd",
  "cost_usd",
  "spend",
  "cost",
  "total",
] as const;

/** Delivery / efficiency headers that must never become the amount column. */
function isRejectedAmountMetricHeader(header: string): boolean {
  if (isBlockedMetricHeader(header)) return true;
  const h = normalizeHeader(header);
  const bare = headerBare(header);
  const probe = `${h} ${bare}`;
  if (/\bimpressions?\b/.test(probe) || /\bclicks?\b/.test(probe)) return true;
  if (probe.includes("per result") || probe.includes("cost per")) return true;
  if (probe.includes("/ conv") || probe.includes("per conv") || probe.includes("conv.")) {
    return true;
  }
  return false;
}

function headerMatchesAmountSynonym(header: string, synonym: string): boolean {
  const h = normalizeHeader(header);
  const bare = headerBare(header);
  const syn = synonym.toLowerCase().trim();
  if (h === syn || bare === syn) return true;
  // Short tokens: exact/bare only — no prefix.
  if (AMOUNT_EXACT_ONLY_SYNONYMS.has(syn)) return false;
  if (h.startsWith(`${syn} `) || bare.startsWith(`${syn} `)) return true;
  return false;
}

function amountHeaderRank(header: string): number {
  const h = normalizeHeader(header);
  const bare = headerBare(header);
  for (let rank = 0; rank < AMOUNT_HEADER_PREFERENCE.length; rank++) {
    const pref = AMOUNT_HEADER_PREFERENCE[rank];
    if (h === pref || bare === pref) return rank;
    if (
      !AMOUNT_EXACT_ONLY_SYNONYMS.has(pref) &&
      (h.startsWith(`${pref} `) || bare.startsWith(`${pref} `))
    ) {
      return rank;
    }
  }
  return AMOUNT_HEADER_PREFERENCE.length;
}

function findAmountColumn(headers: string[]): number {
  let bestIdx = -1;
  let bestRank = Number.POSITIVE_INFINITY;
  for (let i = 0; i < headers.length; i++) {
    const header = headers[i];
    if (isRejectedAmountMetricHeader(header)) continue;
    const matched = HEADER_SYNONYMS.amount.some((syn) =>
      headerMatchesAmountSynonym(header, syn),
    );
    if (!matched) continue;
    const rank = amountHeaderRank(header);
    if (rank < bestRank) {
      bestRank = rank;
      bestIdx = i;
    }
  }
  return bestIdx;
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
  if (isRejectedAmountMetricHeader(header)) return false;
  return HEADER_SYNONYMS.amount.some((syn) =>
    headerMatchesAmountSynonym(header, syn),
  );
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

/**
 * Delivery / performance metric headers — never map as spend.
 * ("Leads" contains the substring "ads"; bare includes("ads") is unsafe.)
 */
const BLOCKED_METRIC_HEADERS = [
  "leads",
  "impressions",
  "clicks",
  "ctr",
  "cpc",
  "cpm",
  "reach",
  "frequency",
  "conversions",
  "purchases",
  "roas",
  "revenue",
] as const;

function isBlockedMetricHeader(header: string): boolean {
  const h = normalizeHeader(header);
  const bare = headerBare(header);
  for (const metric of BLOCKED_METRIC_HEADERS) {
    if (h === metric || bare === metric) return true;
    if (h.startsWith(`${metric} `) || bare.startsWith(`${metric} `)) return true;
  }
  return false;
}

/**
 * True when a normalized header names an ads spend column.
 * Uses equals / " ads" suffix / word-boundary — never bare includes("ads")
 * (that falsely treats "Leads" as spend).
 */
export function headerLooksLikeAdsSpend(normalizedHeader: string): boolean {
  const h = normalizedHeader.trim().toLowerCase();
  if (!h) return false;
  if (h === "ads") return true;
  if (h.endsWith(" ads")) return true;
  return /\bads\b/.test(h);
}

/** Wide spine: one row per day with named platform columns. */
function attachOtherCustom(
  engine: CsvChannel,
  raw: string,
): Pick<ParsedSpendRow, "customKey" | "customLabel"> {
  if (engine !== "other") return {};
  const parsed = customChannelFromLabel(raw);
  if (!parsed) return {};
  return { customKey: parsed.customKey, customLabel: parsed.customLabel };
}

function isGenericOtherHeader(normalized: string): boolean {
  return (
    normalized === "other" ||
    normalized.includes("other ads") ||
    normalized.includes("other spend")
  );
}

/** Campaign / account dimensions — never treat as a spend column. */
function isNonSpendDimensionHeader(header: string): boolean {
  const h = normalizeHeader(header);
  if (!h) return false;
  return (
    h.includes("campaign") ||
    h.includes("ad set") ||
    h.includes("adset") ||
    h.includes("ad name") ||
    h.includes("ad group") ||
    h.includes("account id") ||
    h.includes("account name") ||
    h === "account" ||
    h === "currency" ||
    h === "status" ||
    h === "notes" ||
    h === "note" ||
    h === "comment" ||
    h === "comments" ||
    h === "description" ||
    h.includes("advertiser")
  );
}

export interface WideChannelCol {
  index: number;
  channel: CsvChannel;
  rawHeader: string;
  customKey?: string;
  customLabel?: string;
}

/** Detect wide platform spend columns (Ablestar-grade: ignore metric headers). */
export function detectWideChannelColumns(headers: string[]): WideChannelCol[] {
  return mapWideChannelCols(headers, {
    promoteUnknown: findAmountColumn(headers) === -1,
  });
}

function mapWideChannelCols(
  headers: string[],
  options?: { promoteUnknown?: boolean },
): WideChannelCol[] {
  const out: WideChannelCol[] = [];
  const used = new Set<number>();
  for (let i = 0; i < headers.length; i++) {
    const raw = headers[i].trim();
    const h = normalizeHeader(raw);
    if (!h) continue;
    // Never treat Day / amount / sales / delivery metrics as a platform bucket.
    if (isDateLikeHeader(raw) || isAmountLikeHeader(raw)) continue;
    if (isBlockedMetricHeader(raw)) continue;
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
      headerLooksLikeAdsSpend(h) ||
      isGenericOtherHeader(h)
    ) {
      const channel = normalizeChannel(h);
      const extra = attachOtherCustom(channel, raw);
      out.push({
        index: i,
        channel,
        rawHeader: raw,
        ...extra,
      });
      used.add(i);
    }
  }

  if (!options?.promoteUnknown) return out;

  let extras = out.filter((col) => Boolean(col.customKey)).length;
  for (let i = 0; i < headers.length; i++) {
    if (extras >= MAX_CUSTOM_SPEND_CHANNELS) break;
    if (used.has(i)) continue;
    const raw = headers[i].trim();
    const h = normalizeHeader(raw);
    if (!h) continue;
    if (isDateLikeHeader(raw) || isAmountLikeHeader(raw)) continue;
    if (isBlockedMetricHeader(raw)) continue;
    if (isNonSpendDimensionHeader(raw)) continue;
    const parsed = customChannelFromLabel(raw);
    if (!parsed) continue;
    out.push({
      index: i,
      channel: "other",
      rawHeader: raw,
      customKey: parsed.customKey,
      customLabel: parsed.customLabel,
    });
    extras += 1;
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
      ...attachOtherCustom(normalizeChannel(rawChannel), rawChannel),
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
        ...(col.customKey
          ? { customKey: col.customKey, customLabel: col.customLabel ?? col.rawHeader }
          : attachOtherCustom(col.channel, col.rawHeader)),
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
  const limits = assertSpendCsvLimits(text);
  if (!limits.ok) {
    return {
      rows: [],
      errors: [limits.error],
      totalDataRows: countSpendCsvDataRows(text),
    };
  }

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
  const amountCol = findAmountColumn(headers);
  const wideCols = detectWideChannelColumns(headers);

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
  let totalBytes = 0;
  for (const input of inputs) {
    if (!input.text.trim()) continue;
    sawText = true;
    totalBytes += utf8ByteLength(input.text);
    const prefix = input.label ? `${input.label}: ` : "";
    // Per-file caps first (clearer than a combined blob error).
    const limits = assertSpendCsvLimits(input.text);
    if (!limits.ok) {
      pushError(errors, `${prefix}${limits.error}`);
      totalDataRows += countSpendCsvDataRows(input.text);
      continue;
    }
    const parsed = parseSpendCsv(input.text, { forceChannel: input.forceChannel });
    rows.push(...parsed.rows);
    totalDataRows += parsed.totalDataRows;
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

  if (totalBytes > SPEND_CSV_MAX_BYTES && errors.length === 0) {
    return {
      rows: [],
      errors: [
        `Combined uploads are too large (${formatByteSize(totalBytes)}; max ${formatByteSize(SPEND_CSV_MAX_BYTES)}). Import fewer files or split by date range.`,
      ],
      totalDataRows,
    };
  }

  if (totalDataRows > SPEND_CSV_MAX_ROWS && errors.length === 0) {
    return {
      rows: [],
      errors: [
        `Combined uploads have ${totalDataRows.toLocaleString()} data rows (max ${SPEND_CSV_MAX_ROWS.toLocaleString()}). Import fewer files or split by date range.`,
      ],
      totalDataRows,
    };
  }

  return { rows, errors, totalDataRows };
}

export interface AggregatedSpendDay {
  date: string;
  channel: CsvChannel;
  amount: number;
  customKey?: string;
  customLabel?: string;
}

/** Sum multiple rows that share the same day + channel + custom extra. */
export function aggregateSpendRows(rows: ParsedSpendRow[]): AggregatedSpendDay[] {
  const map = new Map<string, AggregatedSpendDay>();
  for (const row of rows) {
    const customKey = row.customKey ?? "";
    const key = `${row.date}|${row.channel}|${customKey}`;
    const existing = map.get(key);
    if (existing) {
      existing.amount += row.amount;
    } else {
      const next: AggregatedSpendDay = {
        date: row.date,
        channel: row.channel,
        amount: row.amount,
      };
      if (customKey) {
        next.customKey = customKey;
        next.customLabel = row.customLabel ?? row.rawChannel;
      }
      map.set(key, next);
    }
  }
  return Array.from(map.values())
    .map((row) => ({
      ...row,
      amount: Math.round(row.amount * 100) / 100,
    }))
    .sort((a, b) =>
      a.date === b.date
        ? a.channel.localeCompare(b.channel) ||
          (a.customKey ?? "").localeCompare(b.customKey ?? "")
        : a.date.localeCompare(b.date),
    );
}

export interface CsvImportSummary {
  written: number;
  skipped: number;
  /** New day+channel rows added. */
  created: number;
  /** Existing day+channel rows replaced (overwrite, not sum). */
  updated: number;
  days: number;
  channels: CsvChannel[];
  dateRange: { start: string; end: string } | null;
  totalAmount: number;
  errors: string[];
  totalDataRows: number;
  /**
   * When true, nothing was written — merchant must confirm replace-on-overlap.
   * Counts reflect the pending dry-run.
   */
  needsConfirm?: boolean;
  /** CSV dates before sales fact floor (Jan 1 four years ago). */
  salesWindowWarning?: string | null;
  /** Parse hinted single-platform export without channel. */
  needsForceChannel?: boolean;
}

export { SPEND_CHANNELS, SPEND_CHANNEL_LABELS };
