import {
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
} from "react";
import type {
  ActionFunctionArgs,
  HeadersFunction,
  LoaderFunctionArgs,
} from "react-router";
import { Form, useActionData, useLoaderData, useLocation, useNavigation } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { ProUpsellBlock } from "../components/ProUpsellBlock";
import { authenticate } from "../shopify.server";
import { ensureShop, getSpendPeriodCoverage } from "../lib/mer-dashboard.server";
import { deskPeriodTimeZone, parsePeriodPreset, resolvePeriod, type PeriodPreset } from "../lib/periods";
import { resolveManualSpendRange } from "../lib/spend-day-entry";
import { PeriodControl } from "../components/PeriodControl";
import {
  computeSpendRecon,
  formatSpendReconLine,
  spendReconMatchesPeriod,
} from "../lib/mer-trust";
import { spendPeriodMix } from "../lib/spend-period-mix";
import {
  CUSTOM_CHANNEL_PRESETS,
  MAX_CUSTOM_SPEND_CHANNELS,
  addTypedCustomChannel,
  customListHasPreset,
  normalizeCustomChannelList,
  serializeCustomChannelsParam,
  slugCustomChannelName,
  toggleCustomPreset,
} from "../lib/spend-custom-channel";
import {
  customNamesToTemplateCols,
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
  salesDayFactWindowStartUtc,
  SALES_DAY_FACT_WINDOW_YEARS_BACK,
} from "../lib/sales-facts.server";
import {
  getSampleDeskEnabled,
  getSampleDeskStats,
  localDayKey,
  utcDayKey,
} from "../lib/sample-desk.server";
import { formatCurrency, formatPercent } from "../lib/mer-format";
import { PRODUCT_NOUN } from "../lib/product-labels";
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
import { NUMBER_HONESTY } from "../lib/number-honesty";

const MAX_COMBINE_SLOTS = 20;
/** Ablestar fail-closed: never punch live CSV into a sample-ON desk. */
const SAMPLE_DESK_IMPORT_BLOCK =
  "Practice is on — example numbers are already loaded. Switch to Your store at the top, then add your spend.";
/** localStorage key — JSON array of SpendAdvertisePlatformId */
const PLATFORM_STORAGE_KEY = "mcfly-spend-platforms";
/** JSON array of merchant-typed extra channel names (billboards, radio, …). */
const CUSTOM_STORAGE_KEY = "mcfly-spend-custom-channels";
/** First-visit default checkboxes — every named platform is Free. */
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
      label: SPEND_CHANNEL_LABELS[value],
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
    return note.trim();
  }
  return base;
}

function mixChannelId(entry: {
  channel: string;
  customKey?: string | null;
  note?: string | null;
}): string {
  if (entry.channel !== "other") return entry.channel;
  if (entry.note?.trim()) return entry.note.trim();
  if (entry.customKey?.trim()) return entry.customKey.trim();
  return "other";
}

/** Color-dot class: named extras share the Other token (ids can have spaces). */
function spendMixDotChannel(channel: string): string {
  return (SPEND_CHANNELS as readonly string[]).includes(channel)
    ? channel
    : "other";
}

const CUSTOM_CHANNEL_NAME_ERROR =
  "Name this channel (e.g. Influencers).";

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

function addUtcDays(d: Date, n: number): Date {
  const next = new Date(d);
  next.setUTCDate(next.getUTCDate() + n);
  return new Date(
    Date.UTC(next.getUTCFullYear(), next.getUTCMonth(), next.getUTCDate()),
  );
}

function startOfUtcDay(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

/** Build filled/empty strip so CSV holes are visible at a glance. */
async function loadSpendDayCoverage(
  shopId: string,
  sampleOn: boolean,
  now = new Date(),
): Promise<SpendDayCoverage> {
  if (sampleOn) {
    const windowEnd = startOfUtcDay(now);
    const windowStart = addUtcDays(windowEnd, -(SPEND_COVERAGE_DAYS - 1));
    const windowEndInclusive = new Date(
      Date.UTC(
        windowEnd.getUTCFullYear(),
        windowEnd.getUTCMonth(),
        windowEnd.getUTCDate(),
        23,
        59,
        59,
        999,
      ),
    );
    const entries = await prisma.spendEntry.findMany({
      where: {
        shopId,
        source: "sample",
        periodStart: { lte: windowEndInclusive },
        periodEnd: { gte: windowStart },
        amount: { gt: 0 },
      },
      select: { periodStart: true, periodEnd: true },
    });
    const filled = new Set<string>();
    for (const entry of entries) {
      filled.add(utcDayKey(entry.periodStart));
    }
    const days: SpendDayCoverageCell[] = [];
    for (let i = 0; i < SPEND_COVERAGE_DAYS; i++) {
      const cursor = addUtcDays(windowStart, i);
      const dateKey = utcDayKey(cursor);
      days.push({
        dateKey,
        label: String(cursor.getUTCDate()),
        filled: filled.has(dateKey),
      });
    }
    return {
      days,
      filledCount: days.filter((d) => d.filled).length,
      total: days.length,
      includesSample: true,
    };
  }

  const windowEnd = startOfLocalDay(now);
  const windowStart = addLocalDays(windowEnd, -(SPEND_COVERAGE_DAYS - 1));

  const entries = await prisma.spendEntry.findMany({
    where: {
      shopId,
      periodStart: { lte: windowEnd },
      periodEnd: { gte: windowStart },
      amount: { gt: 0 },
      source: { not: "sample" },
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
    includesSample: false,
  };
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const shop = await ensureShop(session.shop);
  const url = new URL(request.url);
  const shotMode = url.searchParams.get("shot") === "1";
  const preset = parsePeriodPreset(url.searchParams.get("period"));
  const sampleDesk = await getSampleDeskStats(shop.id);
  const range = resolvePeriod(
    preset,
    new Date(),
    deskPeriodTimeZone(sampleDesk.enabled, shop.ianaTimezone),
  );
  const settings = await prisma.settings.findUnique({ where: { shopId: shop.id } });
  const spendSourceWhere = sampleDesk.enabled
    ? { source: "sample" as const }
    : { source: { not: "sample" } };
  // SAMPLE ON → show sample rows (practice mix). SAMPLE OFF → real uploads only.
  const [entries, dayCoverage, periodSpend, periodCoverage] = await Promise.all([
    prisma.spendEntry.findMany({
      where: { shopId: shop.id, ...spendSourceWhere },
      orderBy: { periodStart: "desc" },
      take: 20,
    }),
    loadSpendDayCoverage(shop.id, sampleDesk.enabled),
    prisma.spendEntry.findMany({
      where: {
        shopId: shop.id,
        ...spendSourceWhere,
        periodStart: { lte: range.end },
        periodEnd: { gte: range.start },
      },
      select: { amount: true, channel: true, customKey: true, note: true },
    }),
    getSpendPeriodCoverage(shop.id, range, {
      excludeSample: !sampleDesk.enabled,
      sampleOnly: sampleDesk.enabled,
      timeZone: deskPeriodTimeZone(sampleDesk.enabled, shop.ianaTimezone),
    }),
  ]);
  const periodSpendTotal = periodSpend.reduce((s, e) => s + e.amount, 0);
  const periodSpendMix = spendPeriodMix(
    periodSpend.map((e) => ({
      channel: mixChannelId(e),
      amount: e.amount,
    })),
  );
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

  const entitlements = getShopEntitlements(session.shop, {
    sampleDesk: sampleDesk.enabled,
    paidPro: shop.proBillingActive,
  });

  return {
    entries,
    sampleDesk,
    shotMode,
    dayCoverage,
    periodCoverage,
    preset,
    periodLabel: range.label,
    periodSpendTotal,
    periodSpendMix,
    spendRecon,
    declaredAdsSpend: declaredMatches ? settings?.declaredAdsSpend ?? null : null,
    entitlements,
    channels: channelOptionsFor(entitlements),
    addSpendChannels: addSpendSelectOptions(entitlements),
    spendHistoryFloorKey: salesDayFactWindowStartUtc().toISOString().slice(0, 10),
    spendHistoryYearsBack: SALES_DAY_FACT_WINDOW_YEARS_BACK,
    todayKey: sampleDesk.enabled ? utcDayKey(new Date()) : localDayKey(new Date()),
  };
};

export interface SpendActionData {
  error: string | null;
  success: boolean;
  csv?: CsvImportSummary;
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
    customKey: row.customKey,
    note: row.customLabel,
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
    };
  }
  if (!isSpendChannel(channelRaw)) {
    return { error: "Pick a valid spend channel.", success: false };
  }
  if (!canUseChannel(entitlements, channelRaw)) {
    return { error: PRO_UPSELL.channels, success: false };
  }
  if (channelRaw === "other" && !customName) {
    return { error: CUSTOM_CHANNEL_NAME_ERROR, success: false };
  }

  const planned = planLumpSpread({
    totalAmount: amount,
    periodType: periodTypeRaw,
    anchor,
    channel: channelRaw,
  });
  if (!planned.ok) {
    return { error: planned.error, success: false };
  }

  const { plan } = planned;
  const channel = channelRaw; // narrowed by isSpendChannel
  const repository = createSpendRepository();
  const result = await repository.upsertSpendDays(
    shopId,
    plan.days.map((day) => ({
      date: day.date,
      channel,
      amount: day.amount,
      currency: "USD",
      source: "csv" as const,
      customKey: channel === "other" ? customName : "",
      note: channel === "other" ? customName : undefined,
    })),
  );

  return {
    error: null,
    success: true,
    csv: {
      written: result.written,
      skipped: result.skipped,
      created: result.created,
      updated: result.updated,
      days: plan.dayCount,
      channels: [channel],
      dateRange: { start: plan.startDateYmd, end: plan.endDateYmd },
      totalAmount: plan.totalAllocated,
      errors: [],
      totalDataRows: plan.dayCount,
      salesWindowWarning: salesWindowWarningForDates(
        plan.days.map((d) => d.date),
      ),
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
        typeof id === "string" &&
        isAdvertisePlatformId(id) &&
        id !== "other",
    );
    return ids.length > 0 ? ids : [...DEFAULT_PLATFORM_IDS];
  } catch {
    return [...DEFAULT_PLATFORM_IDS];
  }
}

function readStoredCustomChannels(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(CUSTOM_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return normalizeCustomChannelList(
      parsed.filter((name): name is string => typeof name === "string"),
    );
  } catch {
    return [];
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

  // Sample desk ON → block live csv / csv-combine / manual writes (do not mutate sample rows).
  if (
    (intent === "csv" || intent === "csv-combine" || intent === "manual" || intent === "bill-daily") &&
    sampleOn
  ) {
    return { error: SAMPLE_DESK_IMPORT_BLOCK, success: false };
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

  const spendDate = String(form.get("spendDate") ?? "").trim();
  const range = resolveManualSpendRange({
    spendDate,
    periodPreset: period,
    now: new Date(),
    timeZone: shop.ianaTimezone,
  });
  // Upsert on shopId+channel+customKey+periodStart —
  // re-saving the same extra/period updates that line rather than creating a duplicate.
  const customKey =
    channel === "other" ? slugCustomChannelName(note ?? "") : "";
  await prisma.spendEntry.upsert({
    where: {
      shopId_channel_customKey_periodStart: {
        shopId: shop.id,
        channel: channel as CsvChannel,
        customKey,
        periodStart: range.start,
      },
    },
    create: {
      shopId: shop.id,
      channel: channel as CsvChannel,
      customKey,
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
    spendHistoryFloorKey,
    spendHistoryYearsBack,
    todayKey,
    periodSpendMix,
    periodSpendTotal,
    spendRecon,
    periodLabel,
    preset,
  } = useLoaderData<typeof loader>();
  const periodMixRows = periodSpendMix.filter((row) => row.amount > 0);
  const hasPeriodSpend = periodMixRows.length > 0;
  const spendReconLine =
    spendRecon && spendRecon.status !== "none" && spendRecon.declared != null
      ? formatSpendReconLine(spendRecon)
      : null;
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const location = useLocation();
  const dataModeAction = `/app/data-mode${location.search}`;
  const returnTo = `${location.pathname}${location.search}`;
  const isSubmitting = navigation.state === "submitting";
  const submittingIntent =
    navigation.formData?.get("intent")?.toString() ?? null;
  const isEmpty = entries.length === 0;
  const csv = actionData?.csv;
  const csvSaved = Boolean(actionData?.success && csv);
  const csvNeedsConfirm = Boolean(csv?.needsConfirm);
  const manualSaved = Boolean(actionData?.success && !csv);
  /** Coverage status excludes today — "through yesterday" is the ritual bar. */
  const coverageThroughYesterday = useMemo(() => {
    const days = dayCoverage.days.filter((d) => d.dateKey !== todayKey);
    const missing = days.filter((d) => !d.filled).map((d) => d.dateKey);
    return {
      missing,
      upToDate: days.length > 0 && missing.length === 0,
    };
  }, [dayCoverage.days, todayKey]);
  const holeCount = coverageThroughYesterday.missing.length;
  const missingDates = coverageThroughYesterday.missing;
  const missingDatesPreview = missingDates.slice(0, 5);
  const blankTemplateHref = entitlements.canUseAllChannels
    ? "/app/spend/template?blank=1"
    : `/app/spend/template?platforms=${encodeURIComponent(entitlements.allowedChannels.join(","))}&blank=1`;
  const missingDatesHref =
    missingDates.length > 0
      ? `/app/spend/template?dates=${encodeURIComponent(missingDates.slice(0, 62).join(","))}`
      : blankTemplateHref;
  const csvErrorGroups =
    csv && csv.errors.length > 0 ? groupCsvErrors(csv.errors) : null;
  const actionErrorGroups =
    actionData && !actionData.success && csv && csv.errors.length > 0
      ? groupCsvErrors(csv.errors)
      : null;
  /** Persistent field-level CSV error — stays until next action (not toast-only). */
  const csvFieldError = (() => {
    if (!actionData || actionData.success || !actionData.error) return null;
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
  const [forceChannel, setForceChannel] = useState<"" | "meta" | "google">("");
  const [confirmReplace, setConfirmReplace] = useState(false);
  /** Default open so channel pick is obvious; still collapsible. */
  const [channelsOpen, setChannelsOpen] = useState(true);
  const [customChannelNames, setCustomChannelNames] = useState<string[]>([]);
  const [customDraft, setCustomDraft] = useState("");
  const [customError, setCustomError] = useState<string | null>(null);
  const [billAmount, setBillAmount] = useState("");
  const [billPeriodType, setBillPeriodType] =
    useState<PeriodWindowType>("month");
  const [billAnchor, setBillAnchor] = useState(() => currentYearMonth());
  const [billChannel, setBillChannel] = useState<SpendChannel>("other");
  const [billCustomName, setBillCustomName] = useState("");
  const [billError, setBillError] = useState<string | null>(null);
  const [addChannel, setAddChannel] = useState<SpendChannel>("meta");
  const [addCustomName, setAddCustomName] = useState("");

  function isPlatformSelectable(id: SpendAdvertisePlatformId): boolean {
    if (entitlements.canUseAllChannels) return true;
    const platform = getAdvertisePlatform(id);
    if (!platform) return false;
    return entitlements.allowedChannels.includes(platform.engineChannel);
  }

  const selectablePlatforms = useMemo(
    () =>
      SPEND_ADVERTISE_PLATFORMS.filter((p) => {
        if (p.id === "other") return false;
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
    setCustomChannelNames(readStoredCustomChannels());
  }, [entitlements.allowedChannels, entitlements.canUseAllChannels]);

  useEffect(() => {
    if (csvSaved) {
      setConfirmReplace(false);
      setForceChannel("");
    }
  }, [csvSaved]);

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
      window.localStorage.setItem(
        CUSTOM_STORAGE_KEY,
        JSON.stringify(customChannelNames),
      );
    } catch {
      // private mode / quota — selection still works in-session
    }
  }, [selectedPlatformIds, customChannelNames, platformsHydrated]);

  const selectedPlatforms = useMemo(
    () => filterAdvertisePlatforms(selectedPlatformIds),
    [selectedPlatformIds],
  );

  const selectedSummaryLabel = useMemo(
    () => {
      const named = selectedPlatforms.map((p) =>
        advertiseChannelShortLabel(p.engineChannel),
      );
      const extras = customChannelNames;
      const all = [...named, ...extras];
      return all.length > 0 ? all.join(", ") : "Select advertise platforms";
    },
    [selectedPlatforms, customChannelNames],
  );

  const selectedTemplate = useMemo(
    () =>
      buildSelectedPlatformTemplateCsv(
        [
          ...selectedPlatforms.map((p) => ({
            title: p.title,
            engineChannel: p.engineChannel,
          })),
          ...customNamesToTemplateCols(customChannelNames),
        ],
        { example: true, dayCount: 2 },
      ),
    [selectedPlatforms, customChannelNames],
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
    if (selectedChannels.length === 0 && customChannelNames.length === 0) {
      return "meta,google";
    }
    return selectedChannels.join(",");
  }, [selectedChannels, customChannelNames]);

  const selectedBlankTemplateHref = `/app/spend/template?platforms=${encodeURIComponent(selectedPlatformsQuery)}&blank=1${
    customChannelNames.length > 0
      ? `&custom=${encodeURIComponent(serializeCustomChannelsParam(customChannelNames))}`
      : ""
  }`;

  function togglePlatform(id: SpendAdvertisePlatformId) {
    if (!isPlatformSelectable(id)) return;
    setSelectedPlatformIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  function onToggleCustomPreset(label: string) {
    setCustomError(null);
    setCustomChannelNames((prev) => toggleCustomPreset(prev, label));
  }

  function onAddTypedCustomChannel() {
    const result = addTypedCustomChannel(customChannelNames, customDraft);
    setCustomChannelNames(result.names);
    setCustomError(result.error);
    if (!result.error) setCustomDraft("");
  }

  function onRemoveCustomChannel(label: string) {
    setCustomError(null);
    setCustomChannelNames((prev) =>
      normalizeCustomChannelList(prev.filter((name) => name !== label)),
    );
  }

  return (
    <s-page heading="Spend" inlineSize="large">
      {isEmpty && !shotMode && !sampleDesk.enabled ? (
        <s-button
          slot="primary-action"
          variant="primary"
          href="#mcfly-spend-add"
          aria-label={PRODUCT_NOUN.setupAddSpend}
        >
          {PRODUCT_NOUN.setupAddSpend}
        </s-button>
      ) : null}
      <div
        className={[
          "mcfly-desk",
          "mcfly-desk--chrome",
          "mcfly-spend-lean",
          shotMode ? "mcfly-desk--shot" : null,
          sampleDesk.enabled ? "mcfly-desk--sample" : null,
        ]
          .filter(Boolean)
          .join(" ")}
      >
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
              {holeCount > 0 ? (
                <>
                  <s-button
                    variant="secondary"
                    href={missingDatesHref}
                  >
                    Download blank for missing days
                  </s-button>
                  <s-button href="/app" variant="tertiary">
                    View {PRODUCT_NOUN.totalRoas}
                  </s-button>
                </>
              ) : (
                <s-button href="/app" variant="primary">
                  {PRODUCT_NOUN.openTotalRoas}
                </s-button>
              )}
            </div>
            {csvErrorGroups ? <CsvErrorGroups grouped={csvErrorGroups} /> : null}
          </s-banner>
        ) : null}

        {manualSaved ? (
          <s-banner tone="success" heading="Spend saved">
            <s-paragraph>
              <s-link href="/app">{PRODUCT_NOUN.openTotalRoas}</s-link>
              {" · "}or add another day below.
            </s-paragraph>
          </s-banner>
        ) : null}

        {actionData && !actionData.success && actionData.error && !csvNeedsConfirm ? (
          <s-banner
            tone="critical"
            heading={
              csv
                ? "CSV needs a fix — sales data is fine"
                : "Could not save spend"
            }
          >
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
            ) : csv ? (
              <s-paragraph>
                <s-text tone="neutral">
                  Download the{" "}
                  <s-link href={blankTemplateHref}>blank template</s-link>, keep the header
                  row, and re-import.
                </s-text>
              </s-paragraph>
            ) : (
              <s-paragraph>
                <s-text tone="neutral">
                  <s-link href="#mcfly-spend-add">Add a day of spend</s-link>
                  {" "}or open CSV below.
                </s-text>
              </s-paragraph>
            )}
          </s-banner>
        ) : null}

        <div className="mcfly-spend-lean__stack">
          <section
            id="mcfly-spend-add"
            className="mcfly-panel mcfly-panel--eq-compact mcfly-spend-add"
            aria-label="Add spend"
          >
            <div className="mcfly-panel__head mcfly-panel__head--tight">
              <h2>Add spend</h2>
              <p className="mcfly-panel__muted">
                {NUMBER_HONESTY.invoiceHint} CSV for many days is below.
              </p>
            </div>
            {sampleDesk.enabled && !shotMode ? (
              <div className="mcfly-spend-add__gated">
                <p className="mcfly-spend-lean__drop-hint">
                  Practice is on — example numbers are already loaded. Switch
                  to Your store to add live spend.
                </p>
                <Form method="post" action={dataModeAction}>
                  <input type="hidden" name="intent" value="use-real" />
                  <input type="hidden" name="returnTo" value={returnTo} />
                  <s-button type="submit" variant="primary">
                    Switch to Your store to add spend
                  </s-button>
                </Form>
              </div>
            ) : (
              <Form method="post" className="mcfly-spend-add__form">
                <input type="hidden" name="intent" value="manual" />
                <input type="hidden" name="period" value={preset} />
                <div className="mcfly-spend-add__grid">
                  <label className="mcfly-spend-add__field">
                    <span>Amount</span>
                    <input
                      className="mcfly-field"
                      type="number"
                      name="amount"
                      min="0"
                      step="0.01"
                      inputMode="decimal"
                      required
                      placeholder="250"
                      aria-label="Spend amount"
                    />
                  </label>
                  <label className="mcfly-spend-add__field">
                    <span>Date</span>
                    <input
                      className="mcfly-field"
                      type="date"
                      name="spendDate"
                      defaultValue={todayKey}
                      min={spendHistoryFloorKey}
                      max={todayKey}
                      required
                      aria-label="Spend date"
                    />
                  </label>
                  <label className="mcfly-spend-add__field">
                    <span>Channel</span>
                    <select
                      className="mcfly-field"
                      name="channel"
                      value={addChannel}
                      onChange={(e) => {
                        setAddChannel(e.target.value as SpendChannel);
                      }}
                      aria-label="Spend channel"
                    >
                      {addSpendChannels.map(({ value, label, disabled }) => (
                        <option key={value} value={value} disabled={disabled}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </label>
                  {addChannel === "other" ? (
                    <label className="mcfly-spend-add__field mcfly-spend-add__field--wide">
                      <span>Name</span>
                      <input
                        className="mcfly-field"
                        type="text"
                        name="customName"
                        value={addCustomName}
                        onChange={(e) => setAddCustomName(e.target.value)}
                        maxLength={80}
                        placeholder="Billboards — I-15"
                        aria-label="Channel name"
                      />
                    </label>
                  ) : null}
                </div>
                <div
                  className="mcfly-spend-add__presets"
                  role="group"
                  aria-label="Offline extras"
                >
                  {CUSTOM_CHANNEL_PRESETS.map((presetItem) => (
                    <button
                      key={presetItem.id}
                      type="button"
                      className={
                        addChannel === "other" &&
                        addCustomName === presetItem.label
                          ? "mcfly-spend-add__preset mcfly-spend-add__preset--on"
                          : "mcfly-spend-add__preset"
                      }
                      onClick={() => {
                        setAddChannel("other");
                        setAddCustomName(presetItem.label);
                      }}
                    >
                      {presetItem.label}
                    </button>
                  ))}
                </div>
                <div className="mcfly-spend-add__actions">
                  <s-button
                    type="submit"
                    variant="primary"
                    {...(isSubmitting && submittingIntent === "manual"
                      ? { loading: true }
                      : {})}
                  >
                    Save spend
                  </s-button>
                </div>
                {entitlements.showProTeaser ? (
                  <div className="mcfly-spend-add__upsell">
                    <ProUpsellBlock
                      lead={PRO_UPSELL.ltv}
                      showSample={!sampleDesk.enabled}
                    />
                  </div>
                ) : null}
              </Form>
            )}
          </section>

          <section
            className="mcfly-panel mcfly-panel--eq-compact"
            aria-label={`Period spend mix · ${periodLabel}`}
          >
            <div className="mcfly-panel__head mcfly-panel__head--tight">
              <h2>Period spend</h2>
              <p className="mcfly-panel__muted">
                {periodLabel}
                {sampleDesk.enabled ? " · sample" : ""} · spend you added
              </p>
            </div>
            <PeriodControl preset={preset} shotMode={shotMode} />
            {hasPeriodSpend ? (
              <>
                <div className="mcfly-acq-tile">
                  <p className="mcfly-acq-tile__k">Total spend</p>
                  <p className="mcfly-acq-tile__v">
                    {formatCurrency(periodSpendTotal)}
                  </p>
                  <p className="mcfly-acq-tile__def">{periodLabel}</p>
                </div>
                <ul
                  className="mcfly-kpi-channels"
                  aria-label={`Channel mix · ${periodLabel}`}
                >
                  {periodMixRows.map((row) => (
                    <li
                      className="mcfly-kpi-channels__row"
                      key={row.channel}
                    >
                      <span
                        className={`mcfly-spend-dot mcfly-spend-dot--${spendMixDotChannel(row.channel)}`}
                        aria-hidden="true"
                      />
                      <span className="mcfly-kpi-channels__name">
                        {formatSpendEntryChannelLabel(row.channel, null)}
                      </span>
                      <span className="mcfly-kpi-channels__amt">
                        {formatCurrency(row.amount)}
                        <span className="mcfly-kpi-channels__share">
                          {" "}
                          · {formatPercent(row.share)}
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>
                {spendReconLine ? (
                  <p className="mcfly-panel__note">{spendReconLine}</p>
                ) : null}
              </>
            ) : (
              <p className="mcfly-panel__muted">
                No spend in this period yet. Add a day above — Meta, a
                billboard, or anything you type.
              </p>
            )}
          </section>

          <details className="mcfly-spend-secondary__details" id="mcfly-spend-csv">
            <summary>Many days or Ads Manager export (CSV)</summary>
            <div className="mcfly-spend-secondary__body">
            <ol className="mcfly-spend-steps" aria-label="CSV spend in three steps">
              <li>Pick channels</li>
              <li>Download the template and fill daily amounts</li>
              <li>Upload the CSV</li>
            </ol>

          {/* 1 · Advertising channels — compact dropdown */}
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
                Step 1 — Advertising channels
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
                Pick where you advertise — template columns follow. Add
                billboards, radio, or any channel we did not list.
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
              <div className="mcfly-spend-lean__extras">
                <p className="mcfly-spend-lean__extras-k">
                  Offline and other channels
                </p>
                <p className="mcfly-spend-lean__channels-hint">
                  Each name becomes its own template column. You can add more
                  than one.
                </p>
                <div className="mcfly-spend-lean__preset-row">
                  {CUSTOM_CHANNEL_PRESETS.map((preset) => {
                    const checked = customListHasPreset(
                      customChannelNames,
                      preset.label,
                    );
                    return (
                      <label
                        key={preset.id}
                        className="mcfly-spend-lean__channel"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => onToggleCustomPreset(preset.label)}
                          disabled={!platformsHydrated}
                        />
                        <span>{preset.label}</span>
                      </label>
                    );
                  })}
                </div>
                {customChannelNames.filter(
                  (name) =>
                    !CUSTOM_CHANNEL_PRESETS.some((preset) =>
                      customListHasPreset([name], preset.label),
                    ),
                ).length > 0 ? (
                  <ul className="mcfly-spend-lean__custom-chips">
                    {customChannelNames
                      .filter(
                        (name) =>
                          !CUSTOM_CHANNEL_PRESETS.some((preset) =>
                            customListHasPreset([name], preset.label),
                          ),
                      )
                      .map((name) => (
                        <li key={name}>
                          <span>{name}</span>
                          <button
                            type="button"
                            className="mcfly-spend-lean__chip-remove"
                            onClick={() => onRemoveCustomChannel(name)}
                            aria-label={`Remove ${name}`}
                          >
                            ×
                          </button>
                        </li>
                      ))}
                  </ul>
                ) : null}
                <div className="mcfly-spend-lean__custom-add">
                  <input
                    className="mcfly-spend-lean__custom-input"
                    value={customDraft}
                    onChange={(e) => {
                      setCustomDraft(e.target.value);
                      if (customError) setCustomError(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        onAddTypedCustomChannel();
                      }
                    }}
                    placeholder="Type another (trade show, sponsorship…)"
                    maxLength={48}
                    aria-label="Name another advertising channel"
                    disabled={!platformsHydrated}
                  />
                  <button
                    type="button"
                    className="mcfly-spend-lean__custom-btn"
                    onClick={onAddTypedCustomChannel}
                    disabled={!platformsHydrated}
                  >
                    Add
                  </button>
                </div>
                {customError ? (
                  <p className="mcfly-spend-lean__upload-error" role="alert">
                    {customError}
                  </p>
                ) : (
                  <p className="mcfly-spend-lean__channels-hint">
                    Up to {MAX_CUSTOM_SPEND_CHANNELS} named extras on the
                    default plan and Pro.
                  </p>
                )}
              </div>
            </div>
          </details>

          {/* 2 · Tiny template preview */}
          <div id="mcfly-spend-template" className="mcfly-spend-lean__template">
            <div className="mcfly-spend-lean__template-row">
              <s-button href={selectedBlankTemplateHref} variant="secondary">
                Step 2 — Download blank template
              </s-button>
              <s-text tone="neutral">One row = one day</s-text>
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

            <details className="mcfly-spend-lean__bill">
              <summary>Divide a bill into daily rows</summary>
              <div className="mcfly-spend-lean__bill-body">
                <p className="mcfly-spend-lean__bill-hint">
                  Monthly / quarterly / bi-annual / annual invoice → equal daily
                  amounts for the template
                </p>
                <div className="mcfly-spend-lean__bill-grid">
                  <label className="mcfly-spend-lean__bill-field">
                    <span>Amount</span>
                    <input
                      className="mcfly-field"
                      type="number"
                      min="0"
                      step="0.01"
                      inputMode="decimal"
                      placeholder="1200"
                      value={billAmount}
                      onChange={(e) => {
                        setBillAmount(e.target.value);
                        setBillError(null);
                      }}
                    />
                  </label>
                  <label className="mcfly-spend-lean__bill-field">
                    <span>Period</span>
                    <select
                      className="mcfly-field"
                      value={billPeriodType}
                      onChange={(e) => {
                        const v = e.target.value;
                        if (isPeriodWindowType(v)) setBillPeriodType(v);
                        setBillError(null);
                      }}
                    >
                      <option value="month">Monthly</option>
                      <option value="quarter">Quarterly</option>
                      <option value="half_year">Bi-annual</option>
                      <option value="year">Annual</option>
                    </select>
                  </label>
                  <label className="mcfly-spend-lean__bill-field">
                    <span>Starting month</span>
                    <input
                      className="mcfly-field"
                      type="month"
                      value={billAnchor}
                      onChange={(e) => {
                        setBillAnchor(e.target.value);
                        setBillError(null);
                      }}
                    />
                  </label>
                  <label className="mcfly-spend-lean__bill-field">
                    <span>Channel</span>
                    <select
                      className="mcfly-field"
                      value={billChannel}
                      onChange={(e) => {
                        setBillChannel(e.target.value as SpendChannel);
                        setBillError(null);
                      }}
                    >
                      {addSpendChannels.map(({ value, label, disabled }) => (
                        <option key={value} value={value} disabled={disabled}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </label>
                  {billChannel === "other" ? (
                    <label className="mcfly-spend-lean__bill-field mcfly-spend-lean__bill-field--wide">
                      <span>Name</span>
                      <input
                        className="mcfly-field"
                        type="text"
                        maxLength={80}
                        placeholder="e.g. Agency, Retainer"
                        value={billCustomName}
                        onChange={(e) => {
                          setBillCustomName(e.target.value);
                          setBillError(null);
                        }}
                      />
                    </label>
                  ) : null}
                </div>
                {billPreview ? (
                  <p className="mcfly-spend-lean__bill-preview">
                    {formatCurrency(billPreview.dailyAmount)} / day ·{" "}
                    {billPreview.dayCount} days ·{" "}
                    {billPreview.startDateYmd} → {billPreview.endDateYmd}
                  </p>
                ) : null}
                {billError ? (
                  <p className="mcfly-spend-lean__bill-error" role="alert">
                    {billError}
                  </p>
                ) : null}
                <s-button
                  type="button"
                  variant="secondary"
                  onClick={downloadBillDailyCsv}
                >
                  Download daily CSV
                </s-button>
              </div>
            </details>
          </div>

          {/* 3 · Upload CSV — file only */}
          {sampleDesk.enabled && !shotMode ? (
            <div
              id="mcfly-spend-uploads"
              className="mcfly-spend-lean__upload mcfly-spend-lean__upload--gated"
            >
              <p className="mcfly-spend-lean__drop-title">Upload is paused on Practice</p>
              <p className="mcfly-spend-lean__drop-hint">
                Example spend is already loaded. Switch to Your store so your
                CSV is not mixed with practice numbers.
              </p>
              <Form method="post" action={dataModeAction}>
                <input type="hidden" name="intent" value="use-real" />
                <input type="hidden" name="returnTo" value={returnTo} />
                <s-button type="submit" variant="primary">
                  Switch to Your store to upload
                </s-button>
              </Form>
            </div>
          ) : (
          <div
            id="mcfly-spend-uploads"
            className="mcfly-spend-lean__upload"
          >
            <Form method="post" encType="multipart/form-data">
              <input type="hidden" name="intent" value="csv" />
              <input type="hidden" name="forceChannel" value={forceChannel} />
              <input
                type="hidden"
                name="confirm_replace"
                value={confirmReplace ? "1" : "0"}
              />
              {/* Persists CSV text for confirm_replace after file input clears */}
              <textarea
                name="csv"
                value={csvPayload}
                readOnly
                hidden
                aria-hidden="true"
                tabIndex={-1}
              />
              <label className="mcfly-spend-lean__drop">
                <span className="mcfly-spend-lean__drop-title">
                  Step 3 — Upload your CSV
                </span>
                <span className="mcfly-spend-lean__drop-hint">
                  Header row required. One row per day. Same day + channel replaces.
                </span>
                <input
                  type="file"
                  name="file"
                  accept=".csv,text/csv"
                  className="mcfly-spend-lean__file"
                  onChange={onSpendFileSelected}
                  disabled={isSubmitting && submittingIntent === "csv"}
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
                variant="primary"
                {...(isSubmitting && submittingIntent === "csv"
                  ? { loading: true }
                  : {})}
              >
                Import spend
              </s-button>
            </Form>
          </div>
          )}
            </div>
          </details>

          {/* 4 · Status line */}
          <div className="mcfly-spend-lean__status" role="status">
            {sampleDesk.enabled ? (
              <>
                <p className="mcfly-spend-lean__status-line">
                  Practice spend is loaded
                  {entries.length > 0
                    ? ` · ${entries.length.toLocaleString()} recent rows shown`
                    : ""}
                  . CSV coverage tracking starts on Your store.
                </p>
                <p className="mcfly-spend-lean__status-foot">
                  Switch to Your store at the top, then add a day of spend
                  above.
                </p>
              </>
            ) : coverageThroughYesterday.upToDate ? (
              <p className="mcfly-spend-lean__status-line">
                ✓ Up to date through yesterday
              </p>
            ) : (
              <p className="mcfly-spend-lean__status-line">
                Spend coverage — missing {holeCount} day
                {holeCount === 1 ? "" : "s"}
                {selectedPlatforms.length > 0
                  ? ` · ${selectedSummaryLabel}`
                  : ""}
                {missingDatesPreview.length > 0 ? (
                  <>
                    {": "}
                    {missingDatesPreview.join(", ")}
                    {missingDates.length > missingDatesPreview.length
                      ? ", …"
                      : ""}
                    {" · "}
                    <s-link href={missingDatesHref}>download blanks</s-link>
                  </>
                ) : null}
              </p>
            )}
            {sampleDesk.enabled ? null : (
            <p className="mcfly-spend-lean__status-foot">
              Backdate to {spendHistoryFloorKey} ({spendHistoryYearsBack} years) —
              same window as Shopify sales. Same day + channel or named extra
              replaces.
            </p>
            )}
          </div>

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
