import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
} from "react";
import type {
  ActionFunctionArgs,
  HeadersFunction,
  LoaderFunctionArgs,
} from "react-router";
import { Form, useActionData, useLoaderData, useLocation, useNavigation, useSearchParams } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { SampleDeskBanner } from "../components/SampleDeskBanner";
import { listingCaptureFromRequest } from "../lib/listing-capture";
import { authenticate } from "../shopify.server";
import { ensureShop, getSpendPeriodCoverage } from "../lib/mer-dashboard.server";
import { parsePeriodPreset, resolvePeriod, type PeriodPreset } from "../lib/periods";
import {
  computeSpendRecon,
  spendReconMatchesPeriod,
} from "../lib/mer-trust";
import {
  aggregateSpendRows,
  combineSpendCsvInputs,
  parseSpendCsv,
  assertSpendCsvLimits,
  SPEND_CSV_MAX_BYTES,
  buildSelectedPlatformTemplateCsv,
  groupCsvErrors,
  type CsvChannel,
  type CsvImportSummary,
  type GroupedCsvErrors,
} from "../lib/spend-csv";
import { isSpendChannel } from "../lib/spend-billing";
import {
  PIPE_TEMPLATE_ANCHOR,
  PIPE_TEMPLATE_COPY,
  PIPE_TEMPLATE_HREF,
  PIPE_TEMPLATE_OPTIONS,
  PIPE_TOOL_NAMES,
} from "../lib/spend-pipe-templates";
import {
  buildLumpSpreadLongCsv,
  currentYearMonth,
  isPeriodWindowType,
  lumpSpreadFilename,
  planLumpSpread,
  type PeriodWindowType,
} from "../lib/spend-period-allocate";
import {
  SPEND_ADVERTISE_PLATFORMS,
  filterAdvertisePlatforms,
  getAdvertisePlatform,
  isAdvertisePlatformId,
  type SpendAdvertisePlatformId,
} from "../lib/spend-export-guides";
import {
  createSpendRepository,
  previewSpendUpsert,
} from "../lib/spend-repository.server";
import {
  getSalesFactsCoverage,
  salesDayFactWindowStartUtc,
  SALES_DAY_FACT_WINDOW_YEARS_BACK,
} from "../lib/sales-facts.server";
import { resolvePeriodLedgerControl } from "../lib/period-ledger";
import {
  getSampleDeskEnabled,
  getSampleDeskStats,
  localDayKey,
} from "../lib/sample-desk.server";
import { shopLocalDayKey, utcMidnightFromDayKey } from "../lib/shop-local-day";
import {
  parseQuickSpendDay,
  QUICK_SPEND_COPY,
  quickSpendDefaultDate,
  quickSpendSavedCopy,
  type QuickSpendField,
} from "../lib/spend-quick-day";
import { formatCurrency } from "../lib/mer-format";
import { PRODUCT_NOUN } from "../lib/product-labels";
import { isActivationQuery, spendEmptyTeach } from "../lib/install-stickiness";
import {
  SPEND_BILL_ANCHOR,
  SPEND_FIRST_RUN_COPY,
  billSpreadPreviewLine,
  billSpreadPrimaryLabel,
  billSpreadSavedCopy,
  resolveBillSpreadCoverage,
} from "../lib/spend-first-run";
import { enqueueSalesFactsBackfill } from "../lib/sales-backfill-kick.server";
import {
  CASH_PAGE_WHY,
  formatMissingDaysRoasImpact,
} from "../lib/cash-desk-copy";
import {
  resolveSpendCoverageNotice,
  type SpendCoverageCtaTarget,
} from "../lib/spend-coverage-tone";
import prisma from "../db.server";
import {
  SPEND_CHANNELS,
  SPEND_CHANNEL_LABELS,
  type SpendChannel,
} from "@mcfly/mer-engine";
import {
  assertChannelsAllowed,
  canUseChannel,
  getShopEntitlements,
  type ShopEntitlements,
} from "../lib/entitlements.server";
import { PRO_UPSELL } from "../lib/entitlements";

const MAX_COMBINE_SLOTS = 20;
/** Ablestar fail-closed: never punch live CSV into a sample-ON desk. */
const SAMPLE_DESK_IMPORT_BLOCK =
  "SAMPLE preview is on — this is not your money. Tap Real store at the top of the page, then paste or import live spend. Nothing was written.";
/**
 * Love-UX3 — cold activate as connection health without OAuth.
 * Folds into the single Love-V3 teach / activate surface (never a second banner).
 */
const SPEND_ACTIVATE_COPY =
  `Shopify sales are already here. ${PRODUCT_NOUN.totalRoas} unlocks when spend is entered — no ad login.`;
/**
 * Love-UX2 — Matrixify-loud pipe front-door inside that one teach surface.
 * Tools are nominative + merchant-paid; Mcfly never claims OAuth or partnership.
 */
const SPEND_PIPE_FRONT_DOOR = {
  heading: "Automate fill — optional",
  body: `Long and wide CSV for ${PIPE_TOOL_NAMES.join(", ")} — you pay those tools; Mcfly never asks for an ad login.`,
} as const;
/** localStorage key — JSON array of SpendAdvertisePlatformId */
const PLATFORM_STORAGE_KEY = "mcfly-spend-platforms";
/** First-visit default platforms (Meta + Google). Full desk still allows every named channel. */
const DEFAULT_PLATFORM_IDS: SpendAdvertisePlatformId[] = ["meta", "google"];

/** Last N local calendar days for the CSV hole strip (within 14–31). */
const SPEND_COVERAGE_DAYS = 28;

function channelOptionsFor(entitlements: ShopEntitlements) {
  return entitlements.allowedChannels.map((value) => ({
    value,
    label: SPEND_CHANNEL_LABELS[value],
    hint:
      value === "other"
        ? "Influencers, podcasts, agencies, print — name it when you save."
        : `${SPEND_CHANNEL_LABELS[value]} — daily spend CSV or manual total.`,
  }));
}

/** Dropdown for Add spend / Bill: named platforms + Something else (→ other). */
function addSpendSelectOptions(entitlements: ShopEntitlements) {
  const allowed = new Set(entitlements.allowedChannels);
  const options: Array<{
    value: SpendChannel;
    label: string;
    disabled: boolean;
  }> = [];
  for (const value of SPEND_CHANNELS) {
    if (value === "other") continue;
    const ok = allowed.has(value);
    options.push({
      value,
      label: ok
        ? SPEND_CHANNEL_LABELS[value]
        : `${SPEND_CHANNEL_LABELS[value]} — $39 desk`,
      disabled: !ok,
    });
  }
  options.push({
    value: "other",
    label: "Something else…",
    disabled: !allowed.has("other"),
  });
  return options;
}

function formatSpendEntryChannelLabel(
  channel: string,
  note: string | null | undefined,
): string {
  const base =
    SPEND_CHANNEL_LABELS[channel as SpendChannel] ?? channel;
  if (channel === "other" && note?.trim()) {
    return `Other · ${note.trim()}`;
  }
  return base;
}

const CUSTOM_CHANNEL_NAME_ERROR =
  "Name this channel (e.g. Influencers).";

/**
 * Today in the merchant's store calendar. Falls back to server-local when
 * Shopify has not shared the shop timezone yet — same fallback the coverage
 * strip uses, so the typed row and the strip never disagree by a day.
 */
function shopTodayKey(timeZone: string | null, now = new Date()): string {
  return timeZone ? shopLocalDayKey(now, timeZone) : localDayKey(now);
}

function startOfLocalDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function addLocalDays(d: Date, n: number): Date {
  const next = new Date(d);
  next.setDate(next.getDate() + n);
  return startOfLocalDay(next);
}

export type SpendDayCoverageCell = {
  dateKey: string;
  label: string;
  filled: boolean;
};

export type SpendDayCoverage = {
  days: SpendDayCoverageCell[];
  filledCount: number;
  total: number;
  includesSample: boolean;
};

/** Build filled/empty strip so CSV holes are visible at a glance. */
async function loadSpendDayCoverage(
  shopId: string,
  includesSample: boolean,
  now = new Date(),
): Promise<SpendDayCoverage> {
  const windowEnd = startOfLocalDay(now);
  const windowStart = addLocalDays(windowEnd, -(SPEND_COVERAGE_DAYS - 1));

  const entries = await prisma.spendEntry.findMany({
    where: {
      shopId,
      periodStart: { lte: windowEnd },
      periodEnd: { gte: windowStart },
      amount: { gt: 0 },
      ...(includesSample ? {} : { source: { not: "sample" } }),
    },
    select: { periodStart: true, periodEnd: true },
  });

  const filled = new Set<string>();
  for (const entry of entries) {
    let cursor = startOfLocalDay(
      entry.periodStart < windowStart ? windowStart : entry.periodStart,
    );
    const end = startOfLocalDay(
      entry.periodEnd > windowEnd ? windowEnd : entry.periodEnd,
    );
    for (; cursor <= end; cursor = addLocalDays(cursor, 1)) {
      filled.add(localDayKey(cursor));
    }
  }

  const days: SpendDayCoverageCell[] = [];
  for (let cursor = windowStart; cursor <= windowEnd; cursor = addLocalDays(cursor, 1)) {
    const dateKey = localDayKey(cursor);
    days.push({
      dateKey,
      label: String(cursor.getDate()),
      filled: filled.has(dateKey),
    });
  }

  return {
    days,
    filledCount: days.filter((d) => d.filled).length,
    total: days.length,
    includesSample,
  };
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const shop = await ensureShop(session.shop);
  const url = new URL(request.url);
  const shotMode = listingCaptureFromRequest(request);
  const preset = parsePeriodPreset(url.searchParams.get("period"));
  const range = resolvePeriod(preset, new Date(), shop.ianaTimezone);
  const sampleDesk = await getSampleDeskStats(shop.id);
  const settings = await prisma.settings.findUnique({ where: { shopId: shop.id } });
  // Real entries only — sample-desk rows are demo data and would drown out
  // an operator's own uploads in "Recent entries" (sample dates run through today).
  const [entries, dayCoverage, periodSpend, periodCoverage, salesFactsCoverage] = await Promise.all([
    prisma.spendEntry.findMany({
      where: { shopId: shop.id, source: { not: "sample" } },
      orderBy: { periodStart: "desc" },
      take: 20,
    }),
    // Total ROAS readiness is always judged from merchant spend. SAMPLE rows
    // may render the preview, but they must never fill live coverage holes.
    loadSpendDayCoverage(shop.id, false),
    prisma.spendEntry.findMany({
      where: {
        shopId: shop.id,
        source: { not: "sample" },
        periodStart: { lte: range.end },
        periodEnd: { gte: range.start },
      },
      select: { amount: true },
    }),
    getSpendPeriodCoverage(shop.id, range, {
      excludeSample: true,
      timeZone: shop.ianaTimezone,
    }),
    // Closed-day sales coverage — read-only, drives the ledger export control.
    getSalesFactsCoverage(shop.id, range, new Date(), shop.ianaTimezone).catch(
      () => null,
    ),
  ]);
  const periodSpendTotal = periodSpend.reduce((s, e) => s + e.amount, 0);
  const declaredMatches =
    settings?.declaredAdsSpendPeriodStart &&
    settings?.declaredAdsSpendPeriodEnd &&
    spendReconMatchesPeriod(
      settings.declaredAdsSpendPeriodStart,
      settings.declaredAdsSpendPeriodEnd,
      range.start,
      range.end,
      shop.ianaTimezone,
    );
  const spendRecon = declaredMatches
    ? computeSpendRecon(periodSpendTotal, settings?.declaredAdsSpend)
    : computeSpendRecon(periodSpendTotal, null);

  if (!sampleDesk.enabled && !shotMode) {
    void enqueueSalesFactsBackfill({
      shopId: shop.id,
      grantedScopes: session.scope,
      reason: "spend_open",
    }).catch(() => {
      // Overview / auth / tick still own the fill path
    });
  }

  const entitlements = getShopEntitlements(session.shop, {
    sampleDesk: sampleDesk.enabled,
    paidPro: shop.proBillingActive,
  });

  // Same gates as /app/period-ledger.csv so the control never promises a file
  // the route would refuse. The server 409 remains authoritative.
  const periodLedger = resolvePeriodLedgerControl({
    preset,
    useSampleDesk: sampleDesk.enabled,
    salesFactsReady:
      salesFactsCoverage != null &&
      salesFactsCoverage.complete &&
      !salesFactsCoverage.periodExceedsFactWindow &&
      salesFactsCoverage.factDays === salesFactsCoverage.expectedClosedDays,
    spendReady:
      periodCoverage.daysInPeriod > 0 &&
      periodCoverage.daysWithSpend === periodCoverage.daysInPeriod,
    closedDays: salesFactsCoverage?.expectedClosedDays ?? 0,
  });

  return {
    entries,
    sampleDesk,
    shotMode,
    dayCoverage,
    periodCoverage,
    periodLedger,
    preset,
    periodLabel: range.label,
    periodSpendTotal,
    spendRecon,
    declaredAdsSpend: declaredMatches ? settings?.declaredAdsSpend ?? null : null,
    entitlements,
    channels: channelOptionsFor(entitlements),
    addSpendChannels: addSpendSelectOptions(entitlements),
    /** Store-calendar today — `max` on the typed Day input and the action's gate. */
    storeTodayKey: shopTodayKey(shop.ianaTimezone),
    spendHistoryFloorKey: salesDayFactWindowStartUtc().toISOString().slice(0, 10),
    spendHistoryYearsBack: SALES_DAY_FACT_WINDOW_YEARS_BACK,
  };
};

/** One typed day landed — drives the honest Total ROAS hand-off. */
export type SpendDaySaved = {
  dateKey: string;
  channel: SpendChannel;
  channelLabel: string;
  amount: number;
  /** Replaced the merchant's own earlier line for this day+channel. */
  replaced: boolean;
  /** This was the merchant's first live (non-sample) spend row. */
  firstLiveSpend: boolean;
  salesWindowWarning: string | null;
  /** Write stamp — remounts the typed inputs so the next day starts blank. */
  savedAt: string;
};

/** A bill landed as one row per day — the first-run path to trusted coverage. */
export type SpendBillSpread = {
  dayCount: number;
  dailyAmount: number;
  totalAmount: number;
  startDateYmd: string;
  endDateYmd: string;
  channelLabel: string;
  salesWindowWarning: string | null;
  /** Write stamp — keeps the hand-off banner tied to this save. */
  savedAt: string;
};

export interface SpendActionData {
  error: string | null;
  success: boolean;
  csv?: CsvImportSummary;
  day?: SpendDaySaved;
  /** Which typed input to blame — keeps the error beside the field. */
  dayField?: QuickSpendField;
  /** Rejected typed values, echoed back so a fix does not mean a retype. */
  dayForm?: { date: string; amount: string };
  bill?: SpendBillSpread;
  /** Blame the bill panel — a bill error is not a CSV error. */
  billField?: boolean;
}

function emptyCsvSummary(
  partial: Partial<CsvImportSummary> & { totalDataRows: number },
): CsvImportSummary {
  return {
    written: 0,
    skipped: 0,
    created: 0,
    updated: 0,
    days: 0,
    channels: [],
    dateRange: null,
    totalAmount: 0,
    errors: [],
    salesWindowWarning: null,
    ...partial,
  };
}

function salesWindowWarningForDates(dates: string[]): string | null {
  if (dates.length === 0) return null;
  const floor = salesDayFactWindowStartUtc();
  const floorKey = floor.toISOString().slice(0, 10);
  const oldest = [...dates].sort()[0];
  if (oldest < floorKey) {
    return `Some spend days start before ${floorKey} (Jan 1, ${SALES_DAY_FACT_WINDOW_YEARS_BACK} years back). Shopify sales history for Total ROAS only goes back to that date — older spend won’t have matching sales.`;
  }
  return null;
}

async function persistAggregatedSpend(
  shopId: string,
  parsed: Awaited<ReturnType<typeof parseSpendCsv>>,
  emptyMessage: string,
  entitlements: ShopEntitlements,
  opts?: { confirmReplace?: boolean },
): Promise<SpendActionData> {
  // Ablestar fail-closed: any parse error → do not write (no soft success + errors).
  if (parsed.errors.length > 0) {
    const needsForceChannel = parsed.errors.some((e) =>
      /single-platform export/i.test(e),
    );
    return {
      error:
        parsed.errors[0] ??
        "CSV has row errors — fix the file and re-import. Nothing was written.",
      success: false,
      csv: emptyCsvSummary({
        errors: parsed.errors,
        totalDataRows: parsed.totalDataRows,
        needsForceChannel,
      }),
    };
  }

  const aggregated = aggregateSpendRows(parsed.rows);

  if (aggregated.length === 0) {
    return {
      error: emptyMessage,
      success: false,
      csv: emptyCsvSummary({ totalDataRows: parsed.totalDataRows }),
    };
  }

  const channelGate = assertChannelsAllowed(
    entitlements,
    aggregated.map((r) => r.channel),
  );
  if (channelGate) {
    return { error: channelGate, success: false };
  }

  const spendDays = aggregated.map((row) => ({
    date: row.date,
    channel: row.channel,
    amount: row.amount,
    currency: "USD",
    source: "csv" as const,
  }));

  const dates = aggregated.map((r) => r.date).sort();
  const channels = Array.from(new Set(aggregated.map((r) => r.channel))) as CsvChannel[];
  const totalAmount = aggregated.reduce((sum, r) => sum + r.amount, 0);
  const salesWindowWarning = salesWindowWarningForDates(dates);
  const dateRange = dates.length
    ? { start: dates[0], end: dates[dates.length - 1] }
    : null;
  const dayCount = new Set(dates).size;

  const preview = await previewSpendUpsert(shopId, spendDays);

  if (preview.updated > 0 && !opts?.confirmReplace) {
    return {
      error: null,
      success: false,
      csv: {
        written: 0,
        skipped: preview.skipped,
        created: preview.created,
        updated: preview.updated,
        days: dayCount,
        channels,
        dateRange,
        totalAmount,
        errors: [],
        totalDataRows: parsed.totalDataRows,
        needsConfirm: true,
        salesWindowWarning,
      },
    };
  }

  const repository = createSpendRepository();
  const result = await repository.upsertSpendDays(shopId, spendDays);

  return {
    error: null,
    success: true,
    csv: {
      written: result.written,
      skipped: result.skipped,
      created: result.created,
      updated: result.updated,
      days: dayCount,
      channels,
      dateRange,
      totalAmount,
      errors: [],
      totalDataRows: parsed.totalDataRows,
      salesWindowWarning,
    },
  };
}

async function readFormFileText(value: FormDataEntryValue | null): Promise<string> {
  if (fileLike(value)) {
    return await value.text();
  }
  return "";
}

function fileLike(value: FormDataEntryValue | null): value is File {
  return Boolean(
    value &&
      typeof value === "object" &&
      "text" in value &&
      typeof (value as File).text === "function" &&
      Number((value as File).size) > 0,
  );
}

/** Fail-closed before reading/parsing a huge File into memory. */
function fileExceedsSpendCsvMax(value: FormDataEntryValue | null): boolean {
  return fileLike(value) && Number(value.size) > SPEND_CSV_MAX_BYTES;
}

const SPEND_CSV_TOO_LARGE_FILE =
  "This file is too large (max 50,000 rows / 2 MB). Split by date range or channel and import in batches. Spend aggregates only — do not paste sales.";

async function handleCsvImport(
  shopId: string,
  form: FormData,
  entitlements: ShopEntitlements,
): Promise<SpendActionData> {
  const fileField = form.get("file");
  if (fileExceedsSpendCsvMax(fileField)) {
    return { error: SPEND_CSV_TOO_LARGE_FILE, success: false };
  }

  let text = await readFormFileText(fileField);
  if (!text.trim()) {
    text = String(form.get("csv") ?? "");
  }
  if (!text.trim()) {
    return { error: "Choose a CSV file or paste rows before importing.", success: false };
  }

  const limits = assertSpendCsvLimits(text);
  if (!limits.ok) {
    return { error: limits.error, success: false };
  }

  const forceRaw = String(form.get("forceChannel") ?? "").trim().toLowerCase();
  const forceChannel =
    forceRaw === "meta" || forceRaw === "google"
      ? (forceRaw as CsvChannel)
      : undefined;
  const confirmReplace =
    String(form.get("confirm_replace") ?? "") === "1" ||
    String(form.get("confirm_replace") ?? "") === "true";

  return persistAggregatedSpend(
    shopId,
    parseSpendCsv(text, forceChannel ? { forceChannel } : undefined),
    "No valid spend rows found. Use platform exports with Combine & import, the Mcfly template (Day + channel columns), or date,channel,amount rows. This file is ad spend only — sales stay in Shopify.",
    entitlements,
    { confirmReplace },
  );
}

async function handleCsvCombine(
  shopId: string,
  form: FormData,
  entitlements: ShopEntitlements,
): Promise<SpendActionData> {
  const inputs: { text: string; forceChannel?: CsvChannel; label?: string }[] = [];

  for (let i = 0; i < MAX_COMBINE_SLOTS; i++) {
    const fileField = form.get(`file_${i}`);
    if (fileExceedsSpendCsvMax(fileField)) {
      return {
        error: `Upload slot ${i + 1}: ${SPEND_CSV_TOO_LARGE_FILE}`,
        success: false,
      };
    }
    const text = await readFormFileText(fileField);
    if (!text.trim()) continue;
    const channelRaw = String(form.get(`channel_${i}`) ?? "");
    if (!(SPEND_CHANNELS as readonly string[]).includes(channelRaw)) {
      return {
        error: `Pick a valid channel for upload slot ${i + 1}.`,
        success: false,
      };
    }
    if (!canUseChannel(entitlements, channelRaw)) {
      return {
        error: `Upload slot ${i + 1}: ${PRO_UPSELL.channels}`,
        success: false,
      };
    }
    const channel = channelRaw as CsvChannel;
    const platformId = String(form.get(`platform_${i}`) ?? "");
    const platform = isAdvertisePlatformId(platformId)
      ? getAdvertisePlatform(platformId)
      : undefined;
    const label =
      platform?.title ??
      SPEND_CHANNEL_LABELS[channel] ??
      channel;
    const limits = assertSpendCsvLimits(text);
    if (!limits.ok) {
      return { error: `${label}: ${limits.error}`, success: false };
    }
    inputs.push({ text, forceChannel: channel, label });
  }

  if (inputs.length === 0) {
    return {
      error:
        "Select the platforms you spend on, attach at least one daily CSV, then Combine & import.",
      success: false,
    };
  }

  return persistAggregatedSpend(
    shopId,
    combineSpendCsvInputs(inputs),
    "No valid spend rows found in the combined uploads. Export daily Day + spend from each selected platform and try again.",
    entitlements,
    {
      confirmReplace:
        String(form.get("confirm_replace") ?? "") === "1" ||
        String(form.get("confirm_replace") ?? "") === "true",
    },
  );
}

/**
 * Typed one-day spend — the shortest path to a first trusted Total ROAS.
 * One UTC day per row on the same shopId+channel+periodStart key CSV uses,
 * so a re-typed day replaces instead of doubling.
 */
async function handleQuickDay(
  shopId: string,
  form: FormData,
  entitlements: ShopEntitlements,
  todayKey: string,
): Promise<SpendActionData> {
  const date = String(form.get("date") ?? "");
  const amount = String(form.get("amount") ?? "");
  const parsed = parseQuickSpendDay({
    date,
    amount,
    channel: String(form.get("channel") ?? ""),
    customName: String(form.get("customName") ?? ""),
    todayKey,
    salesFloorKey: salesDayFactWindowStartUtc().toISOString().slice(0, 10),
    allowedChannels: entitlements.canUseAllChannels
      ? undefined
      : entitlements.allowedChannels,
  });
  if (!parsed.ok) {
    return {
      error: parsed.error,
      success: false,
      dayField: parsed.field,
      dayForm: { date, amount },
    };
  }

  const { day } = parsed;
  const periodStart = utcMidnightFromDayKey(day.dateKey);
  const periodEnd = new Date(periodStart.getTime() + 24 * 60 * 60 * 1000 - 1);
  const key = {
    shopId,
    channel: day.channel as CsvChannel,
    periodStart,
  };

  const [prior, liveRowsBefore] = await Promise.all([
    prisma.spendEntry.findUnique({
      where: { shopId_channel_periodStart: key },
      select: { source: true },
    }),
    prisma.spendEntry.count({
      where: { shopId, source: { not: "sample" } },
    }),
  ]);

  await prisma.spendEntry.upsert({
    where: { shopId_channel_periodStart: key },
    create: {
      ...key,
      amount: day.amount,
      periodEnd,
      note: day.note,
      source: "manual",
    },
    update: {
      amount: day.amount,
      periodEnd,
      note: day.note,
      // Overwrite a leftover sample row so sample-OFF still shows this spend.
      source: "manual",
    },
  });

  return {
    error: null,
    success: true,
    day: {
      dateKey: day.dateKey,
      channel: day.channel,
      channelLabel: day.channelLabel,
      amount: day.amount,
      // A sample row on the same key was never the merchant's money.
      replaced: prior != null && prior.source !== "sample",
      firstLiveSpend: liveRowsBefore === 0,
      salesWindowWarning: parsed.warning,
      savedAt: new Date().toISOString(),
    },
  };
}

async function handleBillDaily(
  shopId: string,
  form: FormData,
  entitlements: ShopEntitlements,
): Promise<SpendActionData> {
  const amount = parseFloat(String(form.get("amount") ?? ""));
  const periodTypeRaw = String(form.get("periodType") ?? "month");
  const anchor = String(form.get("anchor") ?? "").trim();
  const channelRaw = String(form.get("channel") ?? "");
  const customName = String(form.get("customName") ?? "").trim();

  if (!isPeriodWindowType(periodTypeRaw)) {
    return {
      error: "Pick a period: month, quarter, bi-annual, or year.",
      success: false,
      billField: true,
    };
  }
  if (!isSpendChannel(channelRaw)) {
    return {
      error: "Pick a valid spend channel.",
      success: false,
      billField: true,
    };
  }
  if (!canUseChannel(entitlements, channelRaw)) {
    return { error: PRO_UPSELL.channels, success: false, billField: true };
  }
  if (channelRaw === "other" && !customName) {
    return {
      error: CUSTOM_CHANNEL_NAME_ERROR,
      success: false,
      billField: true,
    };
  }

  const planned = planLumpSpread({
    totalAmount: amount,
    periodType: periodTypeRaw,
    anchor,
    channel: channelRaw,
  });
  if (!planned.ok) {
    return { error: planned.error, success: false, billField: true };
  }

  const { plan } = planned;
  const channel = channelRaw; // narrowed by isSpendChannel
  const repository = createSpendRepository();
  await repository.upsertSpendDays(
    shopId,
    plan.days.map((day) => ({
      date: day.date,
      channel,
      amount: day.amount,
      currency: "USD",
      source: "csv" as const,
    })),
  );

  if (channel === "other" && customName) {
    const periodStarts = plan.days.map((day) => {
      const [y, m, d] = day.date.split("-").map(Number);
      return new Date(Date.UTC(y, m - 1, d));
    });
    await prisma.spendEntry.updateMany({
      where: {
        shopId,
        channel: "other",
        periodStart: { in: periodStarts },
      },
      data: { note: customName },
    });
  }

  return {
    error: null,
    success: true,
    bill: {
      dayCount: plan.dayCount,
      dailyAmount: plan.dailyAmount,
      totalAmount: plan.totalAllocated,
      startDateYmd: plan.startDateYmd,
      endDateYmd: plan.endDateYmd,
      channelLabel:
        channel === "other" && customName
          ? `Other · ${customName}`
          : SPEND_CHANNEL_LABELS[channel],
      salesWindowWarning: salesWindowWarningForDates(
        plan.days.map((d) => d.date),
      ),
      savedAt: new Date().toISOString(),
    },
  };
}

function readStoredPlatforms(): SpendAdvertisePlatformId[] {
  if (typeof window === "undefined") return [...DEFAULT_PLATFORM_IDS];
  try {
    const raw = window.localStorage.getItem(PLATFORM_STORAGE_KEY);
    if (!raw) return [...DEFAULT_PLATFORM_IDS];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [...DEFAULT_PLATFORM_IDS];
    const ids = parsed.filter(
      (id): id is SpendAdvertisePlatformId =>
        typeof id === "string" && isAdvertisePlatformId(id),
    );
    return ids.length > 0 ? ids : [...DEFAULT_PLATFORM_IDS];
  } catch {
    return [...DEFAULT_PLATFORM_IDS];
  }
}

export const action = async ({ request }: ActionFunctionArgs): Promise<SpendActionData> => {
  const { session } = await authenticate.admin(request);
  const shop = await ensureShop(session.shop);
  const form = await request.formData();
  const intent = String(form.get("intent") ?? "manual");
  const sampleOn = await getSampleDeskEnabled(shop.id);
  const entitlements = getShopEntitlements(session.shop, {
    sampleDesk: sampleOn,
    paidPro: shop.proBillingActive,
  });

  if (intent === "declare-recon") {
    const period = (String(form.get("period") ?? "mtd") as PeriodPreset) || "mtd";
    const raw = String(form.get("declaredAdsSpend") ?? "").trim();
    const amount = parseFloat(raw);
    if (!Number.isFinite(amount) || amount <= 0) {
      return {
        error: "Enter a positive Ads Manager total for this period",
        success: false,
      };
    }
    const range = resolvePeriod(period, new Date(), shop.ianaTimezone);
    await prisma.settings.upsert({
      where: { shopId: shop.id },
      create: {
        shopId: shop.id,
        declaredAdsSpend: amount,
        declaredAdsSpendPeriodStart: range.start,
        declaredAdsSpendPeriodEnd: range.end,
        declaredAdsSpendUpdatedAt: new Date(),
      },
      update: {
        declaredAdsSpend: amount,
        declaredAdsSpendPeriodStart: range.start,
        declaredAdsSpendPeriodEnd: range.end,
        declaredAdsSpendUpdatedAt: new Date(),
      },
    });
    return { error: null, success: true };
  }

  // Sample desk ON → block every live write path (do not mutate sample rows).
  if (
    (intent === "csv" ||
      intent === "csv-combine" ||
      intent === "manual" ||
      intent === "bill-daily" ||
      intent === "spend-day") &&
    sampleOn
  ) {
    return { error: SAMPLE_DESK_IMPORT_BLOCK, success: false };
  }

  if (intent === "spend-day") {
    return handleQuickDay(
      shop.id,
      form,
      entitlements,
      shopTodayKey(shop.ianaTimezone),
    );
  }

  if (intent === "csv") {
    return handleCsvImport(shop.id, form, entitlements);
  }

  if (intent === "csv-combine") {
    return handleCsvCombine(shop.id, form, entitlements);
  }

  if (intent === "bill-daily") {
    return handleBillDaily(shop.id, form, entitlements);
  }

  const channel = String(form.get("channel") ?? "meta");
  const amount = parseFloat(String(form.get("amount") ?? "0"));
  const period = (String(form.get("period") ?? "mtd") as PeriodPreset) || "mtd";
  const customName = String(form.get("customName") ?? "").trim();
  const noteRaw = String(form.get("note") ?? "").trim();
  const note =
    channel === "other"
      ? customName || noteRaw || null
      : noteRaw || null;

  if (!(SPEND_CHANNELS as readonly string[]).includes(channel)) {
    return { error: "Invalid channel", success: false };
  }
  if (!canUseChannel(entitlements, channel)) {
    return { error: PRO_UPSELL.channels, success: false };
  }
  if (channel === "other" && !note) {
    return { error: CUSTOM_CHANNEL_NAME_ERROR, success: false };
  }
  if (!Number.isFinite(amount) || amount <= 0) {
    return { error: "Enter a positive spend amount", success: false };
  }

  const range = resolvePeriod(period, new Date(), shop.ianaTimezone);
  // Upsert on shopId+channel+periodStart (SpendEntry_shopId_channel_periodStart_key) —
  // re-saving the same channel/period updates that line rather than creating a duplicate.
  await prisma.spendEntry.upsert({
    where: {
      shopId_channel_periodStart: {
        shopId: shop.id,
        channel: channel as CsvChannel,
        periodStart: range.start,
      },
    },
    create: {
      shopId: shop.id,
      channel: channel as CsvChannel,
      amount,
      periodStart: range.start,
      periodEnd: range.end,
      note,
      source: "manual",
    },
    update: {
      amount,
      periodEnd: range.end,
      note,
      // Overwrite sample rows so sample-OFF still shows this spend.
      source: "manual",
    },
  });

  return { error: null, success: true };
};

/** Compact summary / checkbox label — e.g. Meta, Google, Other. */
function advertiseChannelShortLabel(channel: SpendChannel): string {
  const full = SPEND_CHANNEL_LABELS[channel];
  return full.replace(/ Ads$/, "");
}

function formatDayRange(start: Date, end: Date): string {
  const sameDay =
    start.getFullYear() === end.getFullYear() &&
    start.getMonth() === end.getMonth() &&
    start.getDate() === end.getDate();
  return sameDay
    ? start.toLocaleDateString()
    : `${start.toLocaleDateString()} – ${end.toLocaleDateString()}`;
}

function CsvErrorGroups({ grouped }: { grouped: GroupedCsvErrors }) {
  if (grouped.total === 0) return null;
  return (
    <div className="mcfly-spend-errors">
      <s-text tone="critical">
        {grouped.total} CSV issue{grouped.total === 1 ? "" : "s"}
        {grouped.truncated ? " (showing top groups)" : ""} — fix the file and re-import.
        Spend CSV only; your sales data is unchanged.
      </s-text>
      <ul className="mcfly-spend-errors__list">
        {grouped.groups.map((group) => (
          <li key={group.label} className="mcfly-spend-errors__item">
            <s-text>
              {group.label}
              {group.count > 1 ? ` ×${group.count}` : ""}
            </s-text>
            {group.examples.map((ex) => (
              <s-text key={ex} tone="neutral">
                {ex}
              </s-text>
            ))}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function SpendEntryPage() {
  const {
    entries,
    sampleDesk,
    shotMode,
    dayCoverage,
    entitlements,
    addSpendChannels,
    storeTodayKey,
    spendHistoryFloorKey,
    spendHistoryYearsBack,
    periodLedger,
    periodLabel,
    periodSpendTotal,
  } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const dataModeAction = `/app/data-mode${location.search}`;
  const returnTo = `${location.pathname}${location.search}`;
  const justSwitchedReal =
    searchParams.get("guide") === "real" || searchParams.get("guide") === "1";
  const isSubmitting = navigation.state === "submitting";
  const submittingIntent =
    navigation.formData?.get("intent")?.toString() ?? null;
  const isEmpty = entries.length === 0;
  const sampleOn = sampleDesk.enabled;
  const importBlockedBySample = sampleOn && !shotMode;
  const csv = actionData?.csv;
  const csvSaved = Boolean(actionData?.success && csv);
  const csvNeedsConfirm = Boolean(csv?.needsConfirm);
  const daySaved = actionData?.success ? (actionData.day ?? null) : null;
  const billSaved = actionData?.success ? (actionData.bill ?? null) : null;
  const manualSaved = Boolean(
    actionData?.success && !csv && !actionData.day && !actionData.bill,
  );
  const todayKey = useMemo(() => {
    const n = new Date();
    return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}-${String(n.getDate()).padStart(2, "0")}`;
  }, []);
  /** Coverage status excludes today — "through yesterday" is the ritual bar. */
  const closedCoverageDays = useMemo(
    () => dayCoverage.days.filter((d) => d.dateKey !== todayKey),
    [dayCoverage.days, todayKey],
  );
  const missingDates = useMemo(
    () => closedCoverageDays.filter((d) => !d.filled).map((d) => d.dateKey),
    [closedCoverageDays],
  );
  const holeCount = missingDates.length;
  const coverageImpact = formatMissingDaysRoasImpact({
    missingDays: holeCount,
    windowDays: closedCoverageDays.length,
    periodLabel: "the last 28 days",
  });
  /**
   * Tone only — the counts above stay exact. A one-day-old ledger reads as
   * progress instead of a red 27-hole alarm (FRICTION_AUTOPSY F2).
   */
  const coverageNotice = resolveSpendCoverageNotice({
    closedDays: closedCoverageDays,
    impact: coverageImpact,
    surface: "spend_desk",
  });
  const missingDatesPreview = missingDates.slice(0, 5);
  const showMissingDatesInline =
    missingDatesPreview.length > 0 &&
    coverageNotice.missingDatesDisclosure === "inline";
  const showMissingDatesAudit =
    missingDatesPreview.length > 0 &&
    coverageNotice.missingDatesDisclosure === "on_request";
  const blankTemplateHref = entitlements.canUseAllChannels
    ? "/app/spend/template?blank=1"
    : `/app/spend/template?platforms=${encodeURIComponent(entitlements.allowedChannels.join(","))}&blank=1`;
  const missingDatesHref =
    missingDates.length > 0
      ? `/app/spend/template?dates=${encodeURIComponent(missingDates.slice(0, 62).join(","))}`
      : blankTemplateHref;
  function coverageCtaHref(target: SpendCoverageCtaTarget): string {
    switch (target) {
      case "type_day":
        return "#mcfly-spend-day";
      case "blanks":
        return missingDatesHref;
      case "total_roas":
        return "/app?stay=1";
      default: {
        const _exhaustive: never = target;
        return _exhaustive;
      }
    }
  }
  const csvErrorGroups =
    csv && csv.errors.length > 0 ? groupCsvErrors(csv.errors) : null;
  const actionErrorGroups =
    actionData && !actionData.success && csv && csv.errors.length > 0
      ? groupCsvErrors(csv.errors)
      : null;
  /** Typed-row errors belong beside the typed inputs, never in a CSV banner. */
  const dayFieldError =
    actionData && !actionData.success && actionData.dayField
      ? actionData.error
      : null;
  /** Bill errors answer inside the bill panel — a bill is not a CSV. */
  const billActionError =
    actionData && !actionData.success && actionData.billField
      ? actionData.error
      : null;
  /** Persistent field-level CSV error — stays until next action (not toast-only). */
  const csvFieldError = (() => {
    if (!actionData || actionData.success || !actionData.error) return null;
    if (actionData.dayField || actionData.billField) return null;
    if (csv) return actionData.error;
    if (
      /csv|file|paste|import|combine|platform|upload|template|row/i.test(
        actionData.error,
      )
    ) {
      return actionData.error;
    }
    return null;
  })();

  const [selectedPlatformIds, setSelectedPlatformIds] = useState<
    SpendAdvertisePlatformId[]
  >([...DEFAULT_PLATFORM_IDS]);
  const [platformsHydrated, setPlatformsHydrated] = useState(false);
  /** Survives confirm_replace re-submit after file input clears. */
  const [csvPayload, setCsvPayload] = useState("");
  /** First-run only — the folded backfill path opens on demand or on error. */
  const [uploadsOpen, setUploadsOpen] = useState(false);
  const [forceChannel, setForceChannel] = useState<"" | "meta" | "google">("");
  const [confirmReplace, setConfirmReplace] = useState(false);
  /**
   * Open on a warm desk so the channel pick is obvious; folded on first run,
   * where the bill card asks for the channel itself.
   */
  const [channelsOpen, setChannelsOpen] = useState(() => entries.length > 0);
  const [billAmount, setBillAmount] = useState("");
  const [billPeriodType, setBillPeriodType] =
    useState<PeriodWindowType>("month");
  const [billAnchor, setBillAnchor] = useState(() => currentYearMonth());
  /** Meta/Google invoices are the common first bill — no naming step needed. */
  const [billChannel, setBillChannel] = useState<SpendChannel>(() =>
    entitlements.allowedChannels.includes("meta")
      ? "meta"
      : ((entitlements.allowedChannels[0] ?? "other") as SpendChannel),
  );
  const [billCustomName, setBillCustomName] = useState("");
  const [billError, setBillError] = useState<string | null>(null);
  const billDetailsRef = useRef<HTMLDetailsElement | null>(null);
  const billAmountRef = useRef<HTMLInputElement | null>(null);

  /**
   * Typed one-day row. Pre-filled with the newest closed day still at $0 so a
   * cold merchant only picks an amount.
   */
  const missingDatesKey = missingDates.join(",");
  const suggestedDayDate = useMemo(
    () =>
      quickSpendDefaultDate({
        todayKey: storeTodayKey,
        missingDates: missingDatesKey ? missingDatesKey.split(",") : [],
      }),
    [storeTodayKey, missingDatesKey],
  );
  /**
   * Date / amount / name are uncontrolled and remount whenever the action
   * answers, so a save clears the amount and advances the day to the next
   * hole while a rejected row comes back with what the merchant typed.
   * Channel is state because the Other name field hangs off it — and keeping
   * it across saves is right: same channel, next day.
   */
  const dayFormKey = daySaved?.savedAt ?? (actionData?.dayField ? "retry" : "new");
  const dayDateDefault = actionData?.dayForm?.date || suggestedDayDate;
  const dayAmountDefault = actionData?.dayForm?.amount ?? "";
  const [dayChannel, setDayChannel] = useState<SpendChannel>(() =>
    entitlements.allowedChannels.includes("meta")
      ? "meta"
      : ((entitlements.allowedChannels[0] ?? "other") as SpendChannel),
  );

  function isPlatformSelectable(id: SpendAdvertisePlatformId): boolean {
    if (entitlements.canUseAllChannels) return true;
    const platform = getAdvertisePlatform(id);
    if (!platform) return false;
    return entitlements.allowedChannels.includes(platform.engineChannel);
  }

  const selectablePlatforms = useMemo(
    () =>
      SPEND_ADVERTISE_PLATFORMS.filter((p) => {
        if (entitlements.canUseAllChannels) return true;
        return entitlements.allowedChannels.includes(p.engineChannel);
      }),
    [entitlements.allowedChannels, entitlements.canUseAllChannels],
  );

  useEffect(() => {
    const stored = readStoredPlatforms();
    if (entitlements.canUseAllChannels) {
      setSelectedPlatformIds(stored);
    } else {
      const freeOnly = stored.filter((id) =>
        entitlements.allowedChannels.includes(
          (getAdvertisePlatform(id)?.engineChannel ?? id) as SpendChannel,
        ),
      );
      setSelectedPlatformIds(
        freeOnly.length > 0 ? freeOnly : [...DEFAULT_PLATFORM_IDS],
      );
    }
    setPlatformsHydrated(true);
  }, [entitlements.allowedChannels, entitlements.canUseAllChannels]);

  useEffect(() => {
    if (csvSaved) {
      setConfirmReplace(false);
      setForceChannel("");
    }
  }, [csvSaved]);

  /**
   * Deep link from Overview (`/app/spend#mcfly-spend-bill`) must land on an
   * open bill panel with the cursor in the amount field — on an established
   * desk the panel is collapsed, and a browser will not expand it for us.
   */
  useEffect(() => {
    if (typeof window === "undefined") return;
    const openFromHash = () => {
      if (window.location.hash !== `#${SPEND_BILL_ANCHOR}`) return;
      const details = billDetailsRef.current;
      if (details && !details.open) details.open = true;
      const section = document.getElementById(SPEND_BILL_ANCHOR);
      section?.scrollIntoView({ block: "start", behavior: "auto" });
      billAmountRef.current?.focus();
    };
    openFromHash();
    window.addEventListener("hashchange", openFromHash);
    return () => window.removeEventListener("hashchange", openFromHash);
  }, [isEmpty]);

  const billPreview = useMemo(() => {
    const amount = parseFloat(billAmount);
    if (!Number.isFinite(amount) || amount <= 0) return null;
    const result = planLumpSpread({
      totalAmount: amount,
      periodType: billPeriodType,
      anchor: billAnchor,
      channel: billChannel,
    });
    return result.ok ? result.plan : null;
  }, [billAmount, billPeriodType, billAnchor, billChannel]);

  /**
   * The operator's question before saving — "does this bill get me a number I
   * can use?" — answered in closed-day counts, never in a promised multiple.
   */
  const billCoverage = useMemo(() => {
    if (!billPreview) return null;
    return resolveBillSpreadCoverage({
      closedDays: closedCoverageDays,
      planStartDateYmd: billPreview.startDateYmd,
      planEndDateYmd: billPreview.endDateYmd,
      todayKey: storeTodayKey,
    });
  }, [billPreview, closedCoverageDays, storeTodayKey]);

  const billPrimaryLabel = billSpreadPrimaryLabel(billPreview, {
    blocked: importBlockedBySample,
  });

  /** Honest hand-off after the rows land — day count and rate, no multiple. */
  const billSavedCopy = billSaved
    ? billSpreadSavedCopy({
        dayCount: billSaved.dayCount,
        dailyAmount: billSaved.dailyAmount,
        totalAmount: billSaved.totalAmount,
        startDateYmd: billSaved.startDateYmd,
        endDateYmd: billSaved.endDateYmd,
        channelLabel: billSaved.channelLabel,
        missingDays: holeCount,
        salesWindowWarning: billSaved.salesWindowWarning,
      })
    : null;

  function downloadBillDailyCsv() {
    const amount = parseFloat(billAmount);
    const result = planLumpSpread({
      totalAmount: amount,
      periodType: billPeriodType,
      anchor: billAnchor,
      channel: billChannel,
    });
    if (!result.ok) {
      setBillError(result.error);
      return;
    }
    if (billChannel === "other" && !billCustomName.trim()) {
      setBillError("Name this channel (e.g. Agency, Retainer).");
      return;
    }
    setBillError(null);
    const csv = buildLumpSpreadLongCsv(result.plan);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = lumpSpreadFilename(result.plan);
    a.click();
    URL.revokeObjectURL(url);
  }

  async function onSpendFileSelected(
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      setCsvPayload(await file.text());
    } catch {
      setCsvPayload("");
    }
  }

  useEffect(() => {
    if (!platformsHydrated || typeof window === "undefined") return;
    try {
      window.localStorage.setItem(
        PLATFORM_STORAGE_KEY,
        JSON.stringify(selectedPlatformIds),
      );
    } catch {
      // private mode / quota — selection still works in-session
    }
  }, [selectedPlatformIds, platformsHydrated]);

  const selectedPlatforms = useMemo(
    () => filterAdvertisePlatforms(selectedPlatformIds),
    [selectedPlatformIds],
  );

  const selectedSummaryLabel = useMemo(
    () =>
      selectedPlatforms.length > 0
        ? selectedPlatforms
            .map((p) => advertiseChannelShortLabel(p.engineChannel))
            .join(", ")
        : "Select advertise platforms",
    [selectedPlatforms],
  );

  const selectedTemplate = useMemo(
    () =>
      buildSelectedPlatformTemplateCsv(
        selectedPlatforms.map((p) => ({
          title: p.title,
          engineChannel: p.engineChannel,
        })),
        { example: true, dayCount: 2 },
      ),
    [selectedPlatforms],
  );

  const selectedChannels = useMemo(() => {
    const seen = new Set<SpendChannel>();
    const out: SpendChannel[] = [];
    for (const p of selectedPlatforms) {
      if (seen.has(p.engineChannel)) continue;
      seen.add(p.engineChannel);
      out.push(p.engineChannel);
    }
    return out;
  }, [selectedPlatforms]);

  const selectedPlatformsQuery = useMemo(() => {
    if (selectedChannels.length === 0) return "meta,google";
    return selectedChannels.join(",");
  }, [selectedChannels]);

  const selectedBlankTemplateHref = `/app/spend/template?platforms=${encodeURIComponent(selectedPlatformsQuery)}&blank=1`;
  const emptyTeach = spendEmptyTeach({
    templateHref: selectedBlankTemplateHref,
    billHref: `#${SPEND_BILL_ANCHOR}`,
    justSwitchedReal: justSwitchedReal && !sampleOn,
  });

  /**
   * Love-V3 / VISUAL_CRAFT P1.4 — one teach/activate surface above the day form.
   * Empty teach owns cold paint; `?activate=1` folds into that surface (no second
   * info banner). SAMPLE import-block keeps its critical honesty banner.
   */
  const activating =
    isActivationQuery(location.search) && !shotMode && !sampleDesk.enabled;
  const showEmptyTeach = isEmpty && !shotMode && !importBlockedBySample;
  /**
   * Blocker #1 — first run leads with the bill spread, because 14 hand-typed
   * days do not fit in a 7-day trial. The bill card owns the only primary
   * button; the typed day and CSV stay reachable but visually quiet.
   */
  const firstRun = showEmptyTeach;
  const showActivationBanner = activating && !showEmptyTeach;
  const emptyTeachHeading =
    activating && showEmptyTeach
      ? "Step 1 of 2 — put spend on the desk"
      : emptyTeach.heading;
  /** Love-UX3: activate owns the teach body; otherwise keep emptyTeach.body. */
  const emptyTeachBody =
    activating && showEmptyTeach ? SPEND_ACTIVATE_COPY : emptyTeach.body;

  /** Honest hand-off after a typed day lands — formula, never a ROAS figure. */
  const daySavedCopy = daySaved
    ? quickSpendSavedCopy({
        dateKey: daySaved.dateKey,
        channelLabel: daySaved.channelLabel,
        amount: daySaved.amount,
        todayKey: storeTodayKey,
        replaced: daySaved.replaced,
        firstLiveSpend: daySaved.firstLiveSpend,
        missingDays: holeCount,
        salesFloorWarning: daySaved.salesWindowWarning,
      })
    : null;

  const showCoverageBanner =
    !isEmpty &&
    !shotMode &&
    !daySavedCopy &&
    !billSavedCopy &&
    coverageNotice.showBanner;
  /**
   * The hole count is honest once per screen, not three times. The saved
   * banner's note already carries it right after a save, which is exactly the
   * moment a repeat reads as scolding.
   */
  const coverageBodyAlreadySaid =
    showCoverageBanner ||
    Boolean(daySavedCopy?.note) ||
    Boolean(billSavedCopy?.note);
  const showCsvErrorBanner = Boolean(
    actionData &&
      !actionData.success &&
      actionData.error &&
      !actionData.dayField &&
      !actionData.billField &&
      !csvNeedsConfirm,
  );
  /** A folded backfill path must never hide the answer to its own import. */
  const uploadsExpanded =
    uploadsOpen ||
    Boolean(csv) ||
    csvNeedsConfirm ||
    Boolean(csvFieldError) ||
    showCsvErrorBanner;
  /** Why-line competes with teach/status — park it when a surface is up. */
  const showDeskWhy =
    !shotMode &&
    !sampleDesk.enabled &&
    !showEmptyTeach &&
    !daySavedCopy &&
    !billSavedCopy &&
    !showCoverageBanner &&
    !csvNeedsConfirm &&
    !csvSaved &&
    !manualSaved &&
    !showCsvErrorBanner;

  const pastePlaceholder = useMemo(() => {
    if (selectedTemplate.headers.length === 0) {
      return "Day,Meta,Google\n2026-07-01,120.00,80.00";
    }
    const header = selectedTemplate.headers.join(",");
    const sampleRow =
      selectedTemplate.rows[0]?.join(",") ??
      [
        "2026-07-01",
        ...selectedTemplate.headers.slice(1).map(() => "0.00"),
      ].join(",");
    return `${header}\n${sampleRow}`;
  }, [selectedTemplate]);

  function togglePlatform(id: SpendAdvertisePlatformId) {
    if (!isPlatformSelectable(id)) return;
    setSelectedPlatformIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  /**
   * Bill → daily rows. One period total in, one row per day out, written by
   * `intent=bill-daily` — no download / re-import round trip. Same panel on a
   * warm desk, just folded behind its summary.
   */
  const billPanelBody = (
    <Form method="post" className="mcfly-spend-bill__form">
      <input type="hidden" name="intent" value="bill-daily" />
      <div className="mcfly-spend-bill__grid">
        <label className="mcfly-spend-bill__field">
          <span>{SPEND_FIRST_RUN_COPY.amountLabel}</span>
          <input
            ref={billAmountRef}
            className="mcfly-field"
            type="number"
            name="amount"
            min="0"
            step="0.01"
            inputMode="decimal"
            placeholder="1200"
            value={billAmount}
            onChange={(e) => {
              setBillAmount(e.target.value);
              setBillError(null);
            }}
            disabled={importBlockedBySample}
            required
          />
        </label>
        <label className="mcfly-spend-bill__field">
          <span>{SPEND_FIRST_RUN_COPY.periodLabel}</span>
          <select
            className="mcfly-field"
            name="periodType"
            value={billPeriodType}
            onChange={(e) => {
              const v = e.target.value;
              if (isPeriodWindowType(v)) setBillPeriodType(v);
              setBillError(null);
            }}
            disabled={importBlockedBySample}
          >
            <option value="month">One month</option>
            <option value="quarter">A quarter</option>
            <option value="half_year">Six months</option>
            <option value="year">A year</option>
          </select>
        </label>
        <label className="mcfly-spend-bill__field">
          <span>{SPEND_FIRST_RUN_COPY.anchorLabel}</span>
          <input
            className="mcfly-field"
            type="month"
            name="anchor"
            value={billAnchor}
            onChange={(e) => {
              setBillAnchor(e.target.value);
              setBillError(null);
            }}
            disabled={importBlockedBySample}
            required
          />
        </label>
        <label className="mcfly-spend-bill__field">
          <span>{SPEND_FIRST_RUN_COPY.channelLabel}</span>
          <select
            className="mcfly-field"
            name="channel"
            value={billChannel}
            onChange={(e) => {
              setBillChannel(e.target.value as SpendChannel);
              setBillError(null);
            }}
            disabled={importBlockedBySample}
          >
            {addSpendChannels.map(({ value, label, disabled }) => (
              <option key={value} value={value} disabled={disabled}>
                {label}
              </option>
            ))}
          </select>
        </label>
        {billChannel === "other" ? (
          <label className="mcfly-spend-bill__field mcfly-spend-bill__field--wide">
            <span>{SPEND_FIRST_RUN_COPY.customNameLabel}</span>
            <input
              className="mcfly-field"
              type="text"
              name="customName"
              maxLength={80}
              placeholder={SPEND_FIRST_RUN_COPY.customNamePlaceholder}
              value={billCustomName}
              onChange={(e) => {
                setBillCustomName(e.target.value);
                setBillError(null);
              }}
              disabled={importBlockedBySample}
            />
          </label>
        ) : null}
      </div>

      {/* What the save does, in closed days — the trust question answered
          before the click, never as a promised multiple. */}
      {billPreview && billCoverage ? (
        <div className="mcfly-spend-bill__preview" role="status">
          <p className="mcfly-spend-bill__preview-title">
            {SPEND_FIRST_RUN_COPY.previewTitle}
          </p>
          <p className="mcfly-spend-bill__period">
            {billSpreadPreviewLine(billPreview)}
          </p>
          <p className="mcfly-spend-bill__coverage">{billCoverage.headline}</p>
          {billCoverage.note ? (
            <p className="mcfly-spend-bill__coverage-note">
              {billCoverage.note}
            </p>
          ) : null}
        </div>
      ) : null}

      {billError || billActionError ? (
        <p className="mcfly-spend-bill__error" role="alert">
          {billError ?? billActionError}
        </p>
      ) : null}

      <div className="mcfly-spend-bill__actions">
        <s-button
          type="submit"
          variant="primary"
          {...(importBlockedBySample ? { disabled: true } : {})}
          {...(isSubmitting && submittingIntent === "bill-daily"
            ? { loading: true }
            : {})}
        >
          {billPrimaryLabel}
        </s-button>
        <s-button
          type="button"
          variant="tertiary"
          onClick={downloadBillDailyCsv}
          {...(importBlockedBySample ? { disabled: true } : {})}
        >
          {SPEND_FIRST_RUN_COPY.downloadLabel}
        </s-button>
      </div>
      <p className="mcfly-spend-bill__note">
        {SPEND_FIRST_RUN_COPY.equalSplitNote}
      </p>
    </Form>
  );

  const csvUploadForm = (
    <Form method="post" encType="multipart/form-data">
      <input type="hidden" name="intent" value="csv" />
      <input type="hidden" name="forceChannel" value={forceChannel} />
      <input
        type="hidden"
        name="confirm_replace"
        value={confirmReplace ? "1" : "0"}
      />
      <label
        id="mcfly-spend-paste"
        className="mcfly-spend-lean__paste mcfly-spend-flow__paste-box"
      >
        <span className="mcfly-spend-lean__drop-title">
          Paste one row (or more)
        </span>
        <span className="mcfly-spend-lean__drop-hint">
          Keep the header row · one row = one day
        </span>
        <textarea
          className="mcfly-field mcfly-field--wide"
          name="csv"
          rows={4}
          value={csvPayload}
          onChange={(e) => setCsvPayload(e.target.value)}
          placeholder={pastePlaceholder}
          disabled={
            importBlockedBySample ||
            (isSubmitting && submittingIntent === "csv")
          }
          spellCheck={false}
          aria-label="Paste spend CSV"
        />
      </label>
      <label className="mcfly-spend-lean__drop">
        <span className="mcfly-spend-lean__drop-title">Or upload .csv</span>
        <span className="mcfly-spend-lean__drop-hint">
          Proper Day + channel format only
        </span>
        <input
          type="file"
          name="file"
          accept=".csv,text/csv"
          className="mcfly-spend-lean__file"
          onChange={onSpendFileSelected}
          disabled={
            importBlockedBySample ||
            (isSubmitting && submittingIntent === "csv")
          }
          aria-label="Upload spend CSV"
        />
      </label>
      {csvFieldError && !csvNeedsConfirm ? (
        <p className="mcfly-spend-lean__upload-error" role="alert">
          {csvFieldError}
        </p>
      ) : null}
      <s-button
        id="mcfly-spend-csv-submit"
        type="submit"
        variant={firstRun ? "secondary" : "primary"}
        {...(importBlockedBySample ? { disabled: true } : {})}
        {...(isSubmitting && submittingIntent === "csv"
          ? { loading: true }
          : {})}
      >
        {importBlockedBySample
          ? "Import locked — turn Real store on"
          : "Import spend"}
      </s-button>
    </Form>
  );

  return (
    <s-page heading="Spend" inlineSize="large">
      {sampleDesk.enabled && !shotMode ? (
        <Form method="post" action={dataModeAction}>
          <input type="hidden" name="intent" value="use-real" />
          <input type="hidden" name="returnTo" value={returnTo} />
          <s-button
            slot="primary-action"
            type="submit"
            variant="primary"
            aria-label={PRODUCT_NOUN.samplePreviewOffCta}
          >
            {PRODUCT_NOUN.samplePreviewOffCta}
          </s-button>
        </Form>
      ) : daySavedCopy && !shotMode ? (
        <s-button
          slot="primary-action"
          variant="primary"
          href={daySavedCopy.primaryHref}
          aria-label={daySavedCopy.primaryLabel}
        >
          {daySavedCopy.primaryLabel}
        </s-button>
      ) : null}
      {/* Empty desk needs no page action — the typed day card owns the first
          viewport and carries its own primary Save this day. */}
      <div
        className={[
          "mcfly-desk",
          "mcfly-desk--chrome",
          "mcfly-spend-lean",
          shotMode ? "mcfly-desk--shot mcfly-desk--listing" : null,
          sampleDesk.enabled ? "mcfly-desk--sample" : null,
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {sampleDesk.enabled && !shotMode ? (
          <SampleDeskBanner note="SAMPLE rows are not your money and never count toward live spend coverage or Total ROAS readiness. Tap Real store before pasting or importing live spend." />
        ) : null}

        {importBlockedBySample ? (
          <s-banner tone="critical" heading="Turn Real store on before import">
            <s-paragraph>
              Paste and CSV import are locked while SAMPLE is on — practice
              numbers must not mix with live spend. Tap{" "}
              <strong>Real store</strong> (or Use my real store above), then
              paste one daily row.
            </s-paragraph>
            <div
              className="mcfly-decision__actions"
              style={{ marginTop: "0.65rem" }}
            >
              <Form method="post" action={dataModeAction}>
                <input type="hidden" name="intent" value="use-real" />
                <input type="hidden" name="returnTo" value={returnTo} />
                <s-button type="submit" variant="primary">
                  {PRODUCT_NOUN.samplePreviewOffCta}
                </s-button>
              </Form>
            </div>
          </s-banner>
        ) : null}

        {showDeskWhy ? (
          <p className="mcfly-desk-why">{CASH_PAGE_WHY.spend}</p>
        ) : null}

        {/* Love-V3: activation alone only when empty teach is not the surface.
            Love-UX3: same religion-safe line as empty-teach activate body. */}
        {showActivationBanner ? (
          <s-banner tone="info" heading="Step 1 of 2 — add spend">
            <s-paragraph>{SPEND_ACTIVATE_COPY}</s-paragraph>
            <s-paragraph>
              Spread one bill across its days below, or type a single day — no
              file either way. Step 2: open {PRODUCT_NOUN.totalRoas}. Margin is
              optional for break-even.
            </s-paragraph>
          </s-banner>
        ) : null}

        {daySavedCopy ? (
          <s-banner tone="success" heading={daySavedCopy.heading}>
            <s-paragraph>{daySavedCopy.body}</s-paragraph>
            {daySavedCopy.note ? (
              <s-paragraph>{daySavedCopy.note}</s-paragraph>
            ) : null}
            <div className="mcfly-spend-lean__banner-actions">
              <s-button href={daySavedCopy.primaryHref} variant="primary">
                {daySavedCopy.primaryLabel}
              </s-button>
              <s-link href="#mcfly-spend-day">
                {daySavedCopy.secondaryLabel}
              </s-link>
            </div>
          </s-banner>
        ) : null}

        {/* A bill landed as N daily rows — the trial-week coverage moment.
            Same honesty as a typed day: counts and rate, never a multiple. */}
        {billSavedCopy ? (
          <s-banner tone="success" heading={billSavedCopy.heading}>
            <s-paragraph>{billSavedCopy.body}</s-paragraph>
            <s-paragraph>{billSavedCopy.note}</s-paragraph>
            <div className="mcfly-spend-lean__banner-actions">
              <s-button href={billSavedCopy.primaryHref} variant="primary">
                {billSavedCopy.primaryLabel}
              </s-button>
              <s-link href={billSavedCopy.secondaryHref}>
                {billSavedCopy.secondaryLabel}
              </s-link>
            </div>
          </s-banner>
        ) : null}

        {/* Coverage nag is already inside the saved banner's note — never both.
            Tone comes from resolveSpendCoverageNotice: a young ledger reads as
            progress, `critical` stays with the verdict and the export. */}
        {showCoverageBanner ? (
          <s-banner tone={coverageNotice.tone} heading={coverageNotice.heading}>
            <s-paragraph>{coverageNotice.body}</s-paragraph>
            {coverageNotice.note ? (
              <s-paragraph>{coverageNotice.note}</s-paragraph>
            ) : null}
            <div
              className="mcfly-decision__actions"
              style={{ marginTop: "0.65rem" }}
            >
              <s-button
                href={coverageCtaHref(coverageNotice.primary.target)}
                variant="primary"
              >
                {coverageNotice.primary.label}
              </s-button>
              {coverageNotice.secondary ? (
                <s-link href={coverageCtaHref(coverageNotice.secondary.target)}>
                  {coverageNotice.secondary.label}
                </s-link>
              ) : null}
            </div>
          </s-banner>
        ) : null}

        {csvNeedsConfirm && csv ? (
          <s-banner tone="warning" heading="Same days already on the desk">
            <s-paragraph>
              Will <strong>replace {csv.updated}</strong> overlapping day
              {csv.updated === 1 ? "" : "s"} · <strong>add {csv.created}</strong>{" "}
              new · <strong>skip {csv.skipped}</strong> unchanged. Days not in this
              file stay untouched.
            </s-paragraph>
            {csv.salesWindowWarning ? (
              <s-paragraph>{csv.salesWindowWarning}</s-paragraph>
            ) : null}
            <div className="mcfly-decision__actions" style={{ marginTop: "0.65rem" }}>
              <s-button
                variant="primary"
                onClick={() => {
                  setConfirmReplace(true);
                  window.setTimeout(() => {
                    document
                      .getElementById("mcfly-spend-csv-submit")
                      ?.click();
                  }, 0);
                }}
              >
                Replace overlapping days
              </s-button>
              <s-button
                variant="secondary"
                onClick={() => {
                  setConfirmReplace(false);
                }}
              >
                Cancel
              </s-button>
            </div>
          </s-banner>
        ) : null}

        {csvSaved && csv ? (
          <s-banner tone="success" heading="Spend imported">
            <s-paragraph>
              Replaced {csv.updated} · added {csv.created} · skipped {csv.skipped}
              {" · "}
              {formatCurrency(csv.totalAmount)}
              {holeCount > 0
                ? ` · ${holeCount} day${holeCount === 1 ? "" : "s"} still missing through yesterday`
                : ""}
            </s-paragraph>
            {csv.salesWindowWarning ? (
              <s-paragraph>{csv.salesWindowWarning}</s-paragraph>
            ) : null}
            <div className="mcfly-spend-lean__banner-actions">
              <s-button href="/app?stay=1" variant="primary">
                {PRODUCT_NOUN.openTotalRoas}
              </s-button>
              {holeCount > 0 ? (
                <s-button variant="secondary" href={missingDatesHref}>
                  Download blank for missing days
                </s-button>
              ) : null}
            </div>
            {csvErrorGroups ? <CsvErrorGroups grouped={csvErrorGroups} /> : null}
          </s-banner>
        ) : null}

        {manualSaved ? (
          <s-banner tone="success" heading="Spend saved">
            <s-paragraph>
              <s-link href="/app?stay=1">{PRODUCT_NOUN.openTotalRoas}</s-link>
              {" · "}or upload another CSV below.
            </s-paragraph>
          </s-banner>
        ) : null}

        {showCsvErrorBanner && actionData?.error ? (
          <s-banner tone="critical" heading="CSV needs a fix — sales data is fine">
            <s-paragraph>{actionData.error}</s-paragraph>
            {actionErrorGroups ? (
              <CsvErrorGroups grouped={actionErrorGroups} />
            ) : null}
            {csv?.needsForceChannel ? (
              <div className="mcfly-decision__actions" style={{ marginTop: "0.65rem" }}>
                <s-text>This looks like a single-platform Ads export — pick which one:</s-text>
                <s-button
                  variant="primary"
                  onClick={() => {
                    setForceChannel("meta");
                    setConfirmReplace(false);
                    window.setTimeout(() => {
                      document.getElementById("mcfly-spend-csv-submit")?.click();
                    }, 0);
                  }}
                >
                  This is Meta
                </s-button>
                <s-button
                  variant="secondary"
                  onClick={() => {
                    setForceChannel("google");
                    setConfirmReplace(false);
                    window.setTimeout(() => {
                      document.getElementById("mcfly-spend-csv-submit")?.click();
                    }, 0);
                  }}
                >
                  This is Google
                </s-button>
              </div>
            ) : (
              <s-paragraph>
                <s-text tone="neutral">
                  Download the{" "}
                  <s-link href={blankTemplateHref}>blank template</s-link>, keep the header
                  row, and re-import.
                </s-text>
              </s-paragraph>
            )}
          </s-banner>
        ) : null}

        {/* First run frames the composition in two lines, then gets out of the
            way: the bill card below is the primary path, not a link row. The
            pipe / playbook / template verbs live in their own disclosures so
            the first viewport is one decision, not a CTA zoo. */}
        {showEmptyTeach ? (
          <section
            className="mcfly-spend-teach mcfly-spend-teach--lede"
            aria-label="Empty state — spread a bill, or type one day"
          >
            <s-heading>{emptyTeachHeading}</s-heading>
            <s-paragraph>{emptyTeachBody}</s-paragraph>
          </section>
        ) : null}

        <div
          className={[
            "mcfly-spend-lean__stack",
            firstRun ? "mcfly-spend-lean__stack--first-run" : null,
          ]
            .filter(Boolean)
            .join(" ")}
        >
          {/* 0 · Bill → daily rows. Blocker #1: this is the only path that
              reaches trusted coverage inside a 7-day trial, so on a cold desk
              it is the first card and owns the single primary button. */}
          <section
            id={SPEND_BILL_ANCHOR}
            className={[
              "mcfly-spend-bill",
              firstRun
                ? "mcfly-spend-bill--first-run"
                : "mcfly-spend-bill--quiet",
            ].join(" ")}
            aria-label={SPEND_FIRST_RUN_COPY.billHeading}
          >
            {firstRun ? (
              <>
                <div className="mcfly-spend-bill__head">
                  <s-heading>{SPEND_FIRST_RUN_COPY.billHeading}</s-heading>
                  <s-text tone="neutral">
                    {SPEND_FIRST_RUN_COPY.billHint}
                  </s-text>
                </div>
                {billPanelBody}
              </>
            ) : (
              <details ref={billDetailsRef} className="mcfly-spend-bill__fold">
                <summary>{SPEND_FIRST_RUN_COPY.billHeading}</summary>
                <div className="mcfly-spend-bill__fold-body">
                  <p className="mcfly-spend-bill__hint">
                    {SPEND_FIRST_RUN_COPY.billHint}
                  </p>
                  {billPanelBody}
                </div>
              </details>
            )}
          </section>

          {/* 1 · Typed one day — primary on a warm desk, the quiet second
              path on a cold one (one number is not a week of coverage). */}
          {firstRun ? (
            <p className="mcfly-spend-lean__handoff">
              {SPEND_FIRST_RUN_COPY.dayLede}{" "}
              <s-link href={emptyTeach.secondaryHref}>
                {emptyTeach.secondaryLabel}
              </s-link>
            </p>
          ) : null}
          <section
            id="mcfly-spend-day"
            className={[
              "mcfly-spend-day",
              firstRun ? "mcfly-spend-day--quiet" : null,
            ]
              .filter(Boolean)
              .join(" ")}
            aria-label="Add one day of spend"
          >
            <div className="mcfly-spend-day__head">
              <s-heading>{QUICK_SPEND_COPY.heading}</s-heading>
              <s-text tone="neutral">{QUICK_SPEND_COPY.hint}</s-text>
            </div>
            <Form method="post" className="mcfly-spend-day__form">
              <input type="hidden" name="intent" value="spend-day" />
              <div className="mcfly-spend-day__grid" key={dayFormKey}>
                <label className="mcfly-spend-day__field">
                  <span>{QUICK_SPEND_COPY.dateLabel}</span>
                  <input
                    className="mcfly-field"
                    type="date"
                    name="date"
                    defaultValue={dayDateDefault}
                    max={storeTodayKey}
                    disabled={importBlockedBySample}
                    required
                  />
                </label>
                <label className="mcfly-spend-day__field">
                  <span>{QUICK_SPEND_COPY.amountLabel}</span>
                  <input
                    className="mcfly-field"
                    type="number"
                    name="amount"
                    min="0"
                    step="0.01"
                    inputMode="decimal"
                    placeholder="40.00"
                    defaultValue={dayAmountDefault}
                    disabled={importBlockedBySample}
                    required
                  />
                </label>
                <label className="mcfly-spend-day__field">
                  <span>{QUICK_SPEND_COPY.channelLabel}</span>
                  <select
                    className="mcfly-field"
                    name="channel"
                    value={dayChannel}
                    onChange={(e) =>
                      setDayChannel(e.target.value as SpendChannel)
                    }
                    disabled={importBlockedBySample}
                  >
                    {addSpendChannels.map(({ value, label, disabled }) => (
                      <option key={value} value={value} disabled={disabled}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>
                {dayChannel === "other" ? (
                  <label className="mcfly-spend-day__field mcfly-spend-day__field--wide">
                    <span>{QUICK_SPEND_COPY.customNameLabel}</span>
                    <input
                      className="mcfly-field"
                      type="text"
                      name="customName"
                      maxLength={80}
                      placeholder={QUICK_SPEND_COPY.customNamePlaceholder}
                      disabled={importBlockedBySample}
                    />
                  </label>
                ) : null}
              </div>
              {dayFieldError ? (
                <p className="mcfly-spend-day__error" role="alert">
                  {dayFieldError}
                </p>
              ) : null}
              <div className="mcfly-spend-day__actions">
                {/* One primary per screen: the bill card holds it on a cold
                    desk, this row holds it once spend exists. */}
                <s-button
                  type="submit"
                  variant={firstRun ? "secondary" : "primary"}
                  {...(importBlockedBySample ? { disabled: true } : {})}
                  {...(isSubmitting && submittingIntent === "spend-day"
                    ? { loading: true }
                    : {})}
                >
                  {importBlockedBySample
                    ? QUICK_SPEND_COPY.submitBlockedLabel
                    : QUICK_SPEND_COPY.submitLabel}
                </s-button>
                <s-text tone="neutral">{QUICK_SPEND_COPY.replaceNote}</s-text>
              </div>
            </Form>
            <p className="mcfly-spend-day__backfill">
              {QUICK_SPEND_COPY.backfillHint}{" "}
              <s-link href="#mcfly-spend-uploads">
                {QUICK_SPEND_COPY.backfillLinkLabel}
              </s-link>
            </p>
          </section>

          {/* 2 · Channel picker, template shape, playbook, pipe — the CSV
              path's supporting cast. Folded on a cold desk so the bill card
              stays the one decision in the first viewport. */}
          <>
          <details
            id="mcfly-spend-platforms"
            className="mcfly-spend-lean__channels"
            open={channelsOpen}
            onToggle={(e) => {
              setChannelsOpen(e.currentTarget.open);
            }}
          >
            <summary>
              <span className="mcfly-spend-lean__channels-label">
                Advertising channels
              </span>
              <span className="mcfly-spend-lean__channels-value">
                {selectedSummaryLabel}
              </span>
            </summary>
            <div
              className="mcfly-spend-lean__channel-list"
              role="group"
              aria-label="Advertising channels"
            >
              <p className="mcfly-spend-lean__channels-hint">
                Pick where you advertise — template columns follow
              </p>
              {selectablePlatforms.map((platform) => {
                const checked = selectedPlatformIds.includes(platform.id);
                return (
                  <label
                    key={platform.id}
                    className="mcfly-spend-lean__channel"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => togglePlatform(platform.id)}
                      disabled={!platformsHydrated}
                    />
                    <span>
                      {advertiseChannelShortLabel(platform.engineChannel)}
                    </span>
                  </label>
                );
              })}
            </div>
          </details>

          {/* Template shape — only once a desk has spend to compare against.
              A cold merchant does not need a blank CSV to see Total ROAS. */}
          {firstRun ? null : (
          <div id="mcfly-spend-template" className="mcfly-spend-lean__template">
            <div className="mcfly-spend-lean__template-row">
              <s-button href={selectedBlankTemplateHref} variant="secondary">
                Download blank template
              </s-button>
              <s-text tone="neutral">One row = one day</s-text>
              <s-link href={PIPE_TEMPLATE_HREF}>
                {PIPE_TEMPLATE_COPY.linkLabel}
              </s-link>
            </div>
            {selectedTemplate.headers.length > 0 ? (
              <table className="mcfly-spend-lean__example">
                <thead>
                  <tr>
                    {selectedTemplate.headers.map((h) => (
                      <th key={h} scope="col">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {selectedTemplate.rows.slice(0, 2).map((row) => (
                    <tr key={row[0]}>
                      {row.map((cell, i) => (
                        <td key={`${row[0]}-${i}`}>{cell}</td>
                      ))}
                    </tr>
                  ))}
                  <tr className="mcfly-spend-lean__ellipsis-row" aria-hidden="true">
                    {selectedTemplate.headers.map((h) => (
                      <td key={`ellipsis-${h}`}>…</td>
                    ))}
                  </tr>
                </tbody>
              </table>
            ) : (
              <s-text tone="neutral">
                Select a channel above for a tailored template.
              </s-text>
            )}
          </div>
          )}

          <details
            id="mcfly-spend-playbook"
            className="mcfly-spend-lean__playbook"
          >
            <summary>Platform playbook — export daily cost</summary>
            <div className="mcfly-spend-lean__playbook-body">
              {(selectedPlatforms.length > 0
                ? selectedPlatforms
                : selectablePlatforms.slice(0, 2)
              )
                .slice(0, 2)
                .map((platform) => (
                  <div
                    key={platform.id}
                    className="mcfly-spend-lean__playbook-card"
                  >
                    <p className="mcfly-spend-lean__playbook-title">
                      {platform.title}
                    </p>
                    <p className="mcfly-spend-lean__playbook-hint">
                      {platform.productHint}
                    </p>
                    <ol className="mcfly-spend-lean__playbook-steps">
                      {platform.steps.map((step) => (
                        <li key={step}>{step}</li>
                      ))}
                    </ol>
                  </div>
                ))}
            </div>
          </details>

          {/* 2c · Pipe templates — the only "automate" surface (no OAuth tab) */}
          <details
            id={PIPE_TEMPLATE_ANCHOR}
            className="mcfly-spend-lean__pipe"
          >
            <summary>{SPEND_PIPE_FRONT_DOOR.heading}</summary>
            <div className="mcfly-spend-lean__pipe-body">
              <p className="mcfly-spend-lean__pipe-hint">
                {SPEND_PIPE_FRONT_DOOR.body}
              </p>
              <p className="mcfly-spend-lean__pipe-hint">
                {PIPE_TEMPLATE_COPY.summary} — {PIPE_TEMPLATE_COPY.hint}
              </p>
              <ol className="mcfly-spend-lean__pipe-steps">
                {PIPE_TEMPLATE_COPY.steps.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
              {PIPE_TEMPLATE_OPTIONS.map((option) => (
                <div key={option.shape} className="mcfly-spend-lean__pipe-card">
                  <p className="mcfly-spend-lean__pipe-title">
                    {option.title}
                    <code className="mcfly-spend-lean__pipe-headers">
                      {option.headers}
                    </code>
                  </p>
                  <p className="mcfly-spend-lean__pipe-note">{option.hint}</p>
                  <div className="mcfly-spend-lean__pipe-actions">
                    <s-button href={option.exampleHref} variant="secondary">
                      {PIPE_TEMPLATE_COPY.exampleLabel}
                    </s-button>
                    <s-link href={option.blankHref}>
                      {PIPE_TEMPLATE_COPY.blankLabel}
                    </s-link>
                  </div>
                </div>
              ))}
              <p className="mcfly-spend-lean__pipe-note">
                {PIPE_TEMPLATE_COPY.honesty}
              </p>
            </div>
          </details>
          </>

          {/* 3 · Paste + upload CSV — backfill, folded on a cold desk so it
              never competes with the bill card for the primary button. */}
          <div
            id="mcfly-spend-uploads"
            className={[
              "mcfly-spend-lean__upload",
              firstRun ? "mcfly-spend-lean__upload--fold" : null,
            ]
              .filter(Boolean)
              .join(" ")}
          >
            {firstRun ? (
              <details
                open={uploadsExpanded}
                onToggle={(e) => setUploadsOpen(e.currentTarget.open)}
              >
                <summary>{SPEND_FIRST_RUN_COPY.backfillLede}</summary>
                <div className="mcfly-spend-lean__upload-body">
                  {csvUploadForm}
                </div>
              </details>
            ) : (
              csvUploadForm
            )}
          </div>

          {/* 4 · Status line — empty desk already taught the path above */}
          {!isEmpty ? (
          <div className="mcfly-spend-lean__status" role="status">
            <p className="mcfly-spend-lean__status-line">
              {coverageNotice.statusLine}
              {showMissingDatesInline ? (
                <>
                  {": "}
                  {missingDatesPreview.join(", ")}
                  {missingDates.length > missingDatesPreview.length ? ", …" : ""}
                  {" · "}
                  <s-link href={missingDatesHref}>download blanks</s-link>
                </>
              ) : null}
            </p>
            {/* Young ledger: the count is in the line above, the hole list is a
                click away. Same dates, same math — opted into, not walled. */}
            {showMissingDatesAudit && coverageNotice.missingDatesLabel ? (
              <details className="mcfly-spend-lean__audit">
                <summary>{coverageNotice.missingDatesLabel}</summary>
                <p className="mcfly-spend-lean__status-foot">
                  {missingDatesPreview.join(", ")}
                  {missingDates.length > missingDatesPreview.length ? ", …" : ""}
                  {" · "}
                  <s-link href={missingDatesHref}>download blanks</s-link>
                </p>
              </details>
            ) : null}
            <p className="mcfly-spend-lean__status-foot">
              {coverageBodyAlreadySaid ? null : `${coverageNotice.body} `}
              Backdate to {spendHistoryFloorKey} ({spendHistoryYearsBack} years)
              — same window as Shopify sales.
            </p>
          </div>
          ) : null}

          {/* 4b · Selected-period spend summary + closed-day ledger export */}
          {!shotMode ? (
            <div
              className="mcfly-spend-lean__status"
              role="group"
              aria-label="Selected period spend summary"
            >
              <p className="mcfly-spend-lean__status-line">
                {periodLabel} · {formatCurrency(periodSpendTotal)} entered spend
              </p>
              <s-button
                variant="secondary"
                aria-label={periodLedger.label}
                {...(periodLedger.ready
                  ? { href: periodLedger.href }
                  : {
                      disabled: true,
                      "aria-describedby": "mcfly-period-ledger-help",
                    })}
              >
                {periodLedger.label}
              </s-button>
              <p
                className="mcfly-spend-lean__status-foot"
                id="mcfly-period-ledger-help"
              >
                {periodLedger.blockedCopy ??
                  "Closed days only — today is never in the file. Shopify sales come from stored daily facts, spend from your entries."}
              </p>
            </div>
          ) : null}

          {/* 5 · Recent entries — compact */}
          {entries.length > 0 ? (
            <ul className="mcfly-spend-lean__recent" aria-label="Recent spend entries">
              {entries.slice(0, 3).map((entry) => (
                <li className="mcfly-spend-lean__recent-row" key={entry.id}>
                  <span
                    className={`mcfly-spend-dot mcfly-spend-dot--${entry.channel}`}
                    aria-hidden="true"
                  />
                  <span className="mcfly-spend-lean__recent-channel">
                    {formatSpendEntryChannelLabel(entry.channel, entry.note)}
                  </span>
                  <span className="mcfly-spend-lean__recent-amount">
                    {formatCurrency(entry.amount)}
                  </span>
                  <span className="mcfly-spend-lean__recent-range">
                    {formatDayRange(entry.periodStart, entry.periodEnd)}
                  </span>
                </li>
              ))}
            </ul>
          ) : null}

        </div>
      </div>
    </s-page>
  );
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
