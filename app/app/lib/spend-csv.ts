// Daily multi-channel spend CSV parser (pure, no I/O).
// Religion: aggregates ad spend only. No customer PII, no pixels/MTA, no live ad APIs.
// Merchants fill a template (or export from SyncWith / sheets) and upload.

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

const MAX_ERRORS = 25;

const HEADER_SYNONYMS: Record<"date" | "channel" | "amount", string[]> = {
  date: ["date", "day", "reporting_date", "reporting date", "date_start"],
  channel: ["channel", "source", "platform", "medium", "network", "account"],
  amount: ["amount", "spend", "cost", "total", "spend_usd", "cost_usd", "ad_spend"],
};

/** Canonical wide-template headers (one row per day, every spend bucket). */
export const WIDE_TEMPLATE_HEADERS = [
  "Day",
  "Meta Ads",
  "Google Ads",
  "Microsoft Ads",
  "TikTok Ads",
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
    help: "Anything else you paid to advertise that day.",
  },
];

/**
 * Downloadable template: header + a few example days.
 * Replace sample numbers with your real spend (blank or 0 = no spend).
 */
export const WIDE_TEMPLATE_SAMPLE = `${WIDE_TEMPLATE_HEADERS.join(",")}
2026-07-01,412.55,288.10,40.00,95.00,0,25.00,0
2026-07-02,401.20,301.75,0,80.00,12.50,25.00,15.00
2026-07-03,390.00,275.00,35.00,70.00,0,25.00,0
`;

/** Blank starter: header + empty day rows ready to fill. */
export function buildBlankSpendTemplate(dayCount = 14): string {
  const today = new Date();
  const rows: string[] = [WIDE_TEMPLATE_HEADERS.join(",")];
  for (let i = dayCount - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    rows.push(`${iso},,,,,,,`);
  }
  return `${rows.join("\n")}\n`;
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
  if (v.includes("affiliate") || v.includes("impact") || v.includes("shareasale") || v.includes("cj ")) {
    return "affiliate";
  }
  if (
    v.includes("email") ||
    v.includes("klaviyo") ||
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

function findColumn(headers: string[], synonyms: string[]): number {
  for (let i = 0; i < headers.length; i++) {
    const h = headers[i].toLowerCase().replace(/^["']|["']$/g, "").trim();
    if (synonyms.includes(h)) return i;
  }
  return -1;
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
    const h = headers[i].toLowerCase().replace(/^["']|["']$/g, "").trim();
    if (!h) continue;
    if (
      HEADER_SYNONYMS.date.includes(h) ||
      h === "day" ||
      h.startsWith("date") ||
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
      h.includes("affiliate") ||
      h.includes("klaviyo") ||
      h.includes("email") ||
      h.includes("sms") ||
      h.includes("criteo") ||
      h.includes("adroll") ||
      h.includes("spend") ||
      h.includes("ads") ||
      h.includes("cost") ||
      h === "other" ||
      h.includes("other ads") ||
      h.includes("other spend")
    ) {
      out.push({ index: i, channel: normalizeChannel(h), rawHeader: headers[i].trim() });
    }
  }
  return out;
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

    const date = parseSpendDate(rawDate);
    if (!date) {
      if (errors.length < MAX_ERRORS) {
        errors.push(`Line ${lineNo}: could not read date "${rawDate}".`);
      }
      continue;
    }

    const amount = parseSpendAmount(rawAmount);
    if (amount === null) {
      if (errors.length < MAX_ERRORS) {
        errors.push(`Line ${lineNo}: could not read amount "${rawAmount}".`);
      }
      continue;
    }
    if (amount < 0) {
      if (errors.length < MAX_ERRORS) {
        errors.push(`Line ${lineNo}: spend cannot be negative ("${rawAmount}").`);
      }
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
    const date = parseSpendDate(cells[dateCol] ?? "");
    if (!date) {
      if (errors.length < MAX_ERRORS) {
        errors.push(`Line ${lineNo}: could not read date "${cells[dateCol] ?? ""}".`);
      }
      continue;
    }

    for (const col of channelCols) {
      const rawAmount = cells[col.index] ?? "";
      if (!String(rawAmount).trim()) continue;
      const amount = parseSpendAmount(rawAmount);
      if (amount === null) {
        if (errors.length < MAX_ERRORS) {
          errors.push(
            `Line ${lineNo}: could not read ${col.rawHeader} amount "${rawAmount}".`,
          );
        }
        continue;
      }
      if (amount < 0) {
        if (errors.length < MAX_ERRORS) {
          errors.push(
            `Line ${lineNo}: ${col.rawHeader} spend cannot be negative ("${rawAmount}").`,
          );
        }
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
 *
 * Sales / revenue columns are ignored (Shopify is the till).
 */
export function parseSpendCsv(text: string): CsvParseResult {
  const clean = text.replace(/^\uFEFF/, "");
  const lines = clean
    .split(/\r\n|\r|\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length === 0) {
    return { rows: [], errors: ["The file is empty."], totalDataRows: 0 };
  }

  const headers = splitCsvLine(lines[0]);
  const dateCol = findColumn(headers, HEADER_SYNONYMS.date);
  const channelCol = findColumn(headers, HEADER_SYNONYMS.channel);
  const amountCol = findColumn(headers, HEADER_SYNONYMS.amount);
  const wideCols = mapWideChannelCols(headers);

  if (dateCol === -1) {
    return {
      rows: [],
      errors: [
        "Missing a Day/date column. Download the Mcfly spend template (Day + Meta/Google/Microsoft/TikTok/Affiliate/Email/Other).",
      ],
      totalDataRows: 0,
    };
  }

  if (channelCol !== -1 && amountCol !== -1) {
    return parseLongSpendCsv(lines, dateCol, channelCol, amountCol);
  }

  if (wideCols.length > 0) {
    return parseWideSpendCsv(lines, dateCol, wideCols);
  }

  return {
    rows: [],
    errors: [
      "Could not detect platform spend columns. Download the Mcfly template (Day + Meta/Google/Microsoft/TikTok/Affiliate/Email/Other) or use long format date,channel,amount.",
    ],
    totalDataRows: 0,
  };
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
