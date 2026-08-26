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
import { Form, useActionData, useLoaderData, useNavigation } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { calculateBreakEvenMer } from "@mcfly/mer-core";
import {
  SPEND_CHANNELS,
  SPEND_CHANNEL_LABELS,
  type SpendChannel,
} from "@mcfly/mer-engine";
import { PeriodControl } from "../components/PeriodControl";
import {
  SpendExplorer,
  type SpendExplorerSeriesView,
} from "../components/SpendExplorer";
import { authenticate } from "../shopify.server";
import {
  buildSpendExplorerSeries,
  ensureShop,
} from "../lib/mer-dashboard.server";
import { deskPeriodTimeZone, parsePeriodPreset, resolvePeriod, type PeriodPreset } from "../lib/periods";
import { deskNavHref } from "../lib/desk-nav";
import {
  dateKeyFromLocal,
  explorerQueryMatchingScoreboard,
  parseExplorerDateParam,
  parseExplorerGranularity,
  parseExplorerMode,
  parseExplorerRange,
  parseExplorerShowSales,
  resolveExplorerWindow,
} from "../lib/spend-explorer";
import { shopLocalDayKey } from "../lib/shop-local-day";
import { resolveManualSpendRange } from "../lib/spend-day-entry";
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
  parseForceChannel,
  assertSpendCsvLimits,
  SPEND_CSV_MAX_BYTES,
  SPEND_CSV_TOO_LARGE,
  buildSelectedPlatformTemplateCsv,
  groupCsvErrors,
  type CsvChannel,
  type CsvImportSummary,
  type GroupedCsvErrors,
} from "../lib/spend-csv";
import { isSpendChannel } from "../lib/spend-billing";
import {
  currentYearMonth,
  isPeriodWindowType,
  planLumpSpread,
  type PeriodWindowType,
} from "../lib/spend-period-allocate";
import {
  FEATURED_SPEND_PLATFORM_IDS,
  SPEND_ADVERTISE_PLATFORMS,
  filterAdvertisePlatforms,
  getAdvertisePlatform,
  isAdvertisePlatformId,
  type SpendAdvertisePlatform,
  type SpendAdvertisePlatformId,
} from "../lib/spend-export-guides";
import {
  createSpendRepository,
  previewSpendUpsert,
} from "../lib/spend-repository.server";
import {
  getSalesFactsByDay,
  runSalesFactsBackfill,
  salesDayFactWindowStartUtc,
  SALES_DAY_FACT_WINDOW_YEARS_BACK,
} from "../lib/sales-facts.server";
import {
  fetchSampleSalesByDay,
  getSampleDeskEnabled,
  getSampleDeskStats,
  localDayKey,
  SAMPLE_DESK_MARGIN_PCT,
  SAMPLE_DESK_TARGET_MER,
  setSampleDeskEnabled,
  utcDayKey,
} from "../lib/sample-desk.server";
import { formatCurrency } from "../lib/mer-format";
import { PRODUCT_NOUN } from "../lib/product-labels";
import prisma from "../db.server";
import {
  assertChannelsAllowed,
  canUseChannel,
  getShopEntitlements,
  type ShopEntitlements,
} from "../lib/entitlements.server";
import { PRO_UPSELL } from "../lib/entitlements";
import { NUMBER_HONESTY } from "../lib/number-honesty";
import { spendConfirmLine } from "../lib/spend-confirm-copy";
import {
  spendChannelLabel,
  spendChannelShortLabel,
} from "../lib/spend-channel-label";
import { SPEND_DOORS } from "../lib/spend-doors";

const MAX_COMBINE_SLOTS = 20;
/** localStorage key — JSON array of SpendAdvertisePlatformId */
const PLATFORM_STORAGE_KEY = "mcfly-spend-platforms";
/** JSON array of merchant-typed extra channel names (billboard, radio, …). */
const CUSTOM_STORAGE_KEY = "mcfly-spend-custom-channels";
/** First-visit default checkboxes — merchant picks channels, then downloads that template. */
const DEFAULT_PLATFORM_IDS: SpendAdvertisePlatformId[] = [];

/** Last N local calendar days for the coverage strip (history, not just a month). */
const SPEND_COVERAGE_DAYS = 90;

function channelOptionsFor(entitlements: ShopEntitlements) {
  return entitlements.allowedChannels.map((value) => ({
    value,
    label: SPEND_CHANNEL_LABELS[value],
    hint:
      value === "other"
        ? "Billboard, radio, agency… — name it when you save."
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
  return spendChannelLabel({ channel, customLabel: note });
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
  const { admin, session } = await authenticate.admin(request);
  const shop = await ensureShop(session.shop);
  const url = new URL(request.url);
  const shotMode = url.searchParams.get("shot") === "1";
  const preset = parsePeriodPreset(url.searchParams.get("period"));
  const sampleDesk = await getSampleDeskStats(shop.id);
  const now = new Date();
  const timeZone = deskPeriodTimeZone(sampleDesk.enabled, shop.ianaTimezone);
  const settings = await prisma.settings.findUnique({ where: { shopId: shop.id } });
  const spendSourceWhere = sampleDesk.enabled
    ? { source: "sample" as const }
    : { source: { not: "sample" } };
  const periodRange = resolvePeriod(preset, now, timeZone);
  const exGran = parseExplorerGranularity(url.searchParams.get("exGran"));
  const exMode = parseExplorerMode(url.searchParams.get("exMode"));
  const exSales = parseExplorerShowSales(url.searchParams.get("exSales"));
  // SAMPLE ON → show sample rows. SAMPLE OFF → this shop's own uploads only.
  const [entries, dayCoverage] = await Promise.all([
    prisma.spendEntry.findMany({
      where: { shopId: shop.id, ...spendSourceWhere },
      orderBy: { periodStart: "desc" },
      take: 20,
    }),
    loadSpendDayCoverage(shop.id, sampleDesk.enabled),
  ]);

  const explicitExRange = url.searchParams.get("exRange");
  const historyFirstEmpty =
    entries.length === 0 && !sampleDesk.enabled && !shotMode;
  const tiedExplorer =
    explicitExRange || historyFirstEmpty
      ? null
      : explorerQueryMatchingScoreboard(preset, periodRange, timeZone);
  // Empty Live data: 90 closed days so missing days are visible. After the
  // first save, the chart follows the same date slicer as Overview.
  const exRange = explicitExRange
    ? parseExplorerRange(explicitExRange)
    : historyFirstEmpty
      ? parseExplorerRange("90d")
      : (tiedExplorer?.range ?? "custom");
  const exFrom = explicitExRange
    ? parseExplorerDateParam(url.searchParams.get("exFrom"))
    : (tiedExplorer?.from ?? null);
  const exTo = explicitExRange
    ? parseExplorerDateParam(url.searchParams.get("exTo"))
    : (tiedExplorer?.to ?? null);
  const explorerWindow = resolveExplorerWindow(exRange, now, {
    from: exFrom,
    to: exTo,
    timeZone,
  });
  const dayFetchRange = {
    start: explorerWindow.start,
    end: explorerWindow.end,
    label: explorerWindow.label,
  };

  const entitlements = getShopEntitlements(session.shop, {
    sampleDesk: sampleDesk.enabled,
    paidPro: shop.proBillingActive,
  });

  let salesByDay = new Map<string, number>();
  if (sampleDesk.enabled) {
    try {
      salesByDay = await fetchSampleSalesByDay(shop.id, dayFetchRange);
    } catch {
      salesByDay = new Map();
    }
  } else {
    void runSalesFactsBackfill(admin, shop.id, { maxDays: 2 }).catch(() => {
      // ignore — explorer uses stored facts; Overview banners disclose holes
    });
    try {
      salesByDay = await getSalesFactsByDay(shop.id, dayFetchRange);
    } catch {
      salesByDay = new Map();
    }
  }

  const targetMer = sampleDesk.enabled
    ? SAMPLE_DESK_TARGET_MER
    : (settings?.targetMer ?? 3);
  const marginPct = sampleDesk.enabled
    ? SAMPLE_DESK_MARGIN_PCT
    : (settings?.marginPct ?? null);
  const breakEvenMer =
    marginPct != null ? calculateBreakEvenMer(marginPct) : null;

  const explorerSeries = await buildSpendExplorerSeries(shop.id, {
    sampleOnly: sampleDesk.enabled,
    excludeSample: !sampleDesk.enabled,
    salesByDay,
    window: explorerWindow,
    granularity: exGran,
    mode: exMode,
    targetMer,
    newCustomers: 0,
    returningCustomers: 0,
    customerMetricsAvailable: false,
    timeZone,
  });

  const explorerDayKey = (instant: Date) =>
    timeZone
      ? shopLocalDayKey(instant, timeZone)
      : dateKeyFromLocal(instant);

  const explorer: SpendExplorerSeriesView = {
    buckets: explorerSeries.buckets,
    summary: explorerSeries.summary,
    mode: explorerSeries.mode,
    granularity: explorerSeries.granularity,
    range: explorerWindow.range,
    windowLabel: explorerWindow.label,
    targetMer: explorerSeries.targetMer,
    breakEvenMer,
    showSales: exSales,
    fromKey: explorerDayKey(explorerWindow.start),
    toKey: explorerDayKey(explorerWindow.end),
    asOfKey: explorerDayKey(explorerWindow.end),
    channelLabels: explorerSeries.channelLabels,
  };

  return {
    entries,
    sampleDesk,
    shotMode,
    dayCoverage,
    preset,
    entitlements,
    channels: channelOptionsFor(entitlements),
    addSpendChannels: addSpendSelectOptions(entitlements),
    spendHistoryFloorKey: salesDayFactWindowStartUtc().toISOString().slice(0, 10),
    spendHistoryYearsBack: SALES_DAY_FACT_WINDOW_YEARS_BACK,
    todayKey: sampleDesk.enabled ? utcDayKey(now) : localDayKey(now),
    explorer,
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
  // Named extras confirm under the merchant's own header, not as "Other".
  const customChannelLabels = Array.from(
    new Set(
      aggregated
        .filter((r) => r.channel === "other" && r.customLabel?.trim())
        .map((r) => r.customLabel!.trim()),
    ),
  );
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
        customChannelLabels,
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
      customChannelLabels,
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

const SPEND_CSV_TOO_LARGE_FILE = SPEND_CSV_TOO_LARGE;

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

  const forceChannel = parseForceChannel(String(form.get("forceChannel") ?? ""));
  const confirmReplace =
    String(form.get("confirm_replace") ?? "") === "1" ||
    String(form.get("confirm_replace") ?? "") === "true";

  return persistAggregatedSpend(
    shopId,
    parseSpendCsv(text, forceChannel ? { forceChannel } : undefined),
    "No valid spend rows found. Use a Day + spend export, the Mcfly template (Day + channel columns), or date,channel,amount rows. This file is ad spend only — sales stay in Shopify.",
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
        "Paste daily rows or upload one CSV (Day + spend, or date,channel,amount). Sales stay in Shopify.",
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
      error: "Pick a period: day, week, month, quarter, bi-annual, or year.",
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
      customKey: channel === "other" ? slugCustomChannelName(customName) : "",
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
      // Confirm with the merchant's own word, not the "other" bucket name.
      customChannelLabels:
        channel === "other" && customName ? [customName] : [],
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

  // Sample data ON → switch to Live data, then write this shop’s spend.
  if (
    (intent === "csv" ||
      intent === "csv-combine" ||
      intent === "manual" ||
      intent === "bill-daily") &&
    sampleOn
  ) {
    await setSampleDeskEnabled(shop.id, false);
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
  return spendChannelShortLabel({ channel });
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
    preset,
    explorer,
  } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";
  const submittingIntent =
    navigation.formData?.get("intent")?.toString() ?? null;
  const isEmpty = entries.length === 0;
  const overviewHref = deskNavHref("/app", {
    period: preset,
    shot: shotMode,
  });
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
  const coverageClosedDays = dayCoverage.days.filter(
    (d) => d.dateKey !== todayKey,
  );
  const coverageFromKey = coverageClosedDays[0]?.dateKey;
  const coverageToKey =
    coverageClosedDays[coverageClosedDays.length - 1]?.dateKey;
  const blankTemplateHref = entitlements.canUseAllChannels
    ? "/app/spend/template?blank=1&span=90d"
    : `/app/spend/template?platforms=${encodeURIComponent(entitlements.allowedChannels.join(","))}&blank=1&span=90d`;
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

  const yesterdayKey = useMemo(() => {
    const [y, m, d] = todayKey.split("-").map(Number);
    const dt = new Date(y, (m ?? 1) - 1, (d ?? 1) - 1);
    return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
  }, [todayKey]);

  const [selectedPlatformIds, setSelectedPlatformIds] = useState<
    SpendAdvertisePlatformId[]
  >([...DEFAULT_PLATFORM_IDS]);
  const [platformsHydrated, setPlatformsHydrated] = useState(false);
  /** Survives confirm_replace re-submit after file input clears. */
  const [csvPayload, setCsvPayload] = useState("");
  const [forceChannel, setForceChannel] = useState<"" | CsvChannel>("");
  const [confirmReplace, setConfirmReplace] = useState(false);
  const [customChannelNames, setCustomChannelNames] = useState<string[]>([]);
  const [customDraft, setCustomDraft] = useState("");
  const [customError, setCustomError] = useState<string | null>(null);
  const [billAmount, setBillAmount] = useState("");
  const [billPeriodType, setBillPeriodType] =
    useState<PeriodWindowType>("day");
  const [billAnchor, setBillAnchor] = useState(yesterdayKey);
  const [billChannel, setBillChannel] = useState<SpendChannel>("meta");
  const [billCustomName, setBillCustomName] = useState("");
  const [billError, setBillError] = useState<string | null>(null);
  const [calcSales, setCalcSales] = useState("");
  const [calcSpend, setCalcSpend] = useState("");
  const [calcMargin, setCalcMargin] = useState("35");

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

  const featuredPlatforms = useMemo(
    () =>
      FEATURED_SPEND_PLATFORM_IDS.map((id) => getAdvertisePlatform(id)).filter(
        (p): p is SpendAdvertisePlatform =>
          p != null && selectablePlatforms.some((s) => s.id === p.id),
      ),
    [selectablePlatforms],
  );

  const morePlatforms = useMemo(
    () =>
      selectablePlatforms.filter(
        (p) => !FEATURED_SPEND_PLATFORM_IDS.includes(p.id),
      ),
    [selectablePlatforms],
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

  const calcRoas = useMemo(() => {
    const sales = parseFloat(calcSales);
    const spend = parseFloat(calcSpend);
    if (!Number.isFinite(sales) || !Number.isFinite(spend) || spend <= 0) {
      return null;
    }
    return Math.round((sales / spend) * 100) / 100;
  }, [calcSales, calcSpend]);

  const calcBreakEven = useMemo(() => {
    const marginPct = parseFloat(calcMargin);
    if (!Number.isFinite(marginPct) || marginPct <= 0 || marginPct >= 100) {
      return null;
    }
    return calculateBreakEvenMer(marginPct / 100);
  }, [calcMargin]);

  function submitForcedChannel(channel: CsvChannel) {
    const form = document.getElementById("mcfly-spend-csv-form");
    if (!(form instanceof HTMLFormElement)) return;
    const hidden = form.querySelector('input[name="forceChannel"]');
    if (hidden instanceof HTMLInputElement) hidden.value = channel;
    setForceChannel(channel);
    setConfirmReplace(false);
    form.requestSubmit();
  }

  function submitCsvReplaceConfirm() {
    const form = document.getElementById("mcfly-spend-csv-form");
    if (!(form instanceof HTMLFormElement)) return;
    const hidden = form.querySelector('input[name="confirm_replace"]');
    if (hidden instanceof HTMLInputElement) hidden.value = "1";
    setConfirmReplace(true);
    form.requestSubmit();
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
      return all.length > 0 ? all.join(", ") : "Pick channels, then download";
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
      return FEATURED_SPEND_PLATFORM_IDS.join(",");
    }
    return selectedChannels.join(",");
  }, [selectedChannels, customChannelNames]);

  const customQuery =
    customChannelNames.length > 0
      ? `&custom=${encodeURIComponent(serializeCustomChannelsParam(customChannelNames))}`
      : "";
  const selectedBlankTemplateHref = `/app/spend/template?platforms=${encodeURIComponent(selectedPlatformsQuery)}&blank=1${customQuery}`;
  const historyRangeQuery =
    coverageFromKey && coverageToKey
      ? `&from=${encodeURIComponent(coverageFromKey)}&to=${encodeURIComponent(coverageToKey)}`
      : "";
  const missingDatesHref = `${selectedBlankTemplateHref}${historyRangeQuery}`;

  const csvConfirmLine =
    csv && csv.dateRange
      ? spendConfirmLine({
          /*
           * Named extras replace the bare "other" entry so the merchant is told
           * back exactly what they typed. Unlabeled other spend keeps "Other".
           */
          channels: [
            ...csv.channels.filter(
              (ch) =>
                ch !== "other" || (csv.customChannelLabels?.length ?? 0) === 0,
            ),
            ...(csv.customChannelLabels ?? []).map((customLabel) => ({
              channel: "other",
              customLabel,
            })),
          ],
          totalAmount: csv.totalAmount,
          dateRange: csv.dateRange,
          formatAmount: formatCurrency,
        })
      : null;

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

  const needsDateAnchor =
    billPeriodType === "day" || billPeriodType === "week";

  return (
    <s-page heading="Spend" inlineSize="large">
      {isEmpty && !shotMode ? (
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
        <div className="mcfly-ctx" aria-live="polite">
          <div className="mcfly-ctx__main">
            <span className="mcfly-ctx__brand">{PRODUCT_NOUN.deskTitle}</span>
            <span className="mcfly-ctx__sep" aria-hidden="true">
              ·
            </span>
            <span className="mcfly-ctx__asof">Same dates as Overview</span>
            <PeriodControl preset={preset} shotMode={shotMode} />
          </div>
        </div>
        {csvNeedsConfirm && csv ? (
          <s-banner tone="warning" heading="Same days already on the desk">
            <s-paragraph>
              {csvConfirmLine ? `${csvConfirmLine} ` : null}
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
                  submitCsvReplaceConfirm();
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
              {csvConfirmLine ? `${csvConfirmLine} ` : null}
              Replaced {csv.updated} · added {csv.created} · skipped {csv.skipped}
              {" · "}
              {formatCurrency(csv.totalAmount)}
              {holeCount > 0
                ? " · those days are in. Days with no row are $0 — last month is enough"
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
                  <s-button href={overviewHref} variant="tertiary">
                    View {PRODUCT_NOUN.totalRoas}
                  </s-button>
                </>
              ) : (
                <s-button href={overviewHref} variant="primary">
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
              <s-link href={overviewHref}>{PRODUCT_NOUN.openTotalRoas}</s-link>
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
                <label htmlFor="mcfly-spend-force-channel">
                  Platform for this file
                </label>
                <select
                  id="mcfly-spend-force-channel"
                  defaultValue=""
                  aria-label="Platform for this file"
                >
                  <option value="" disabled>
                    Choose platform
                  </option>
                  {SPEND_CHANNELS.map((ch) => (
                    <option key={ch} value={ch}>
                      {SPEND_CHANNEL_LABELS[ch]}
                    </option>
                  ))}
                </select>
                <s-button
                  variant="primary"
                  onClick={() => {
                    const select = document.getElementById(
                      "mcfly-spend-force-channel",
                    );
                    const parsed =
                      select instanceof HTMLSelectElement
                        ? parseForceChannel(select.value)
                        : undefined;
                    if (!parsed) return;
                    submitForcedChannel(parsed);
                  }}
                >
                  Import as this platform
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
          {/*
           * Name the three doors before the explanation. First session should
           * not need a tutorial to find out that typing one bill is an option.
           */}
          <nav className="mcfly-spend-doors" aria-label="Three ways to add spend">
            <p className="mcfly-spend-doors__kicker">
              Three ways to add spend — pick one
            </p>
            <ul className="mcfly-spend-doors__list">
              {SPEND_DOORS.map((door, i) => (
                <li key={door.href} className="mcfly-spend-doors__item">
                  <a className="mcfly-spend-doors__link" href={door.href}>
                    <span className="mcfly-spend-doors__num" aria-hidden="true">
                      {i + 1}
                    </span>
                    <span className="mcfly-spend-doors__body">
                      <span className="mcfly-spend-doors__title">
                        {door.title}
                      </span>
                      <span className="mcfly-spend-doors__hint">
                        {door.hint}
                      </span>
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </nav>
          <p className="mcfly-spend-helper">
            We already load your Shopify sales, orders, and LTV. We only need what
            you actually spent, by day, by channel — including billboard and
            anything with no API. Ad-platform logins often fail: expired tokens,
            the wrong ad account, delayed Insights, PMax and TikTok gaps, spend
            mixed with their attributed conversions.{" "}
            We do not ask you to connect Meta or Google.{" "}
            Type a bill, paste a CSV, download your channel template, or use a
            sheet tool like SyncWith to pull daily spend and upload it here.{" "}
            Try yesterday’s Meta plus a $400 billboard against yesterday’s
            Shopify sales.{" "}
            Empty spend is $0 — we never drop unattributed spend.
          </p>

          <section
            id="mcfly-spend-platforms"
            className="mcfly-panel mcfly-panel--eq-compact"
            aria-label="Pick the channels you buy"
          >
            <div className="mcfly-panel__head mcfly-panel__head--tight">
              <h2>Pick the channels you buy</h2>
              <p className="mcfly-panel__muted">
                Check the ones you pay, then download that template (Date + those
                columns). {selectedSummaryLabel}.
              </p>
            </div>
            <div
              className="mcfly-spend-lean__channel-list"
              role="group"
              aria-label="Advertising channels"
            >
              {featuredPlatforms.map((platform) => {
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
              {CUSTOM_CHANNEL_PRESETS.filter((p) => p.id === "billboards").map(
                (preset) => {
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
                },
              )}
            </div>
            {morePlatforms.length > 0 ? (
              <details className="mcfly-spend-lean__more-platforms">
                <summary>More platforms</summary>
                <div
                  className="mcfly-spend-lean__channel-list"
                  role="group"
                  aria-label="More advertising channels"
                >
                  {morePlatforms.map((platform) => {
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
            ) : null}
            <div className="mcfly-spend-lean__extras">
              <p className="mcfly-spend-lean__extras-k">Add a channel</p>
              <div className="mcfly-spend-lean__preset-row">
                {CUSTOM_CHANNEL_PRESETS.filter((p) => p.id !== "billboards").map(
                  (preset) => {
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
                  },
                )}
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
                  Up to {MAX_CUSTOM_SPEND_CHANNELS} named extras.
                </p>
              )}
            </div>
            <div id="mcfly-spend-template" className="mcfly-spend-lean__template">
              <p className="mcfly-spend-lean__template-row">
                <s-text tone="neutral">
                  One row = one day. Columns follow the channels above.
                </s-text>
              </p>
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
                  </tbody>
                </table>
              ) : (
                <s-text tone="neutral">
                  Select a channel above for a tailored template.
                </s-text>
              )}
              {/* Native anchor — the third door needs a real hit box too. */}
              <a
                className="mcfly-btn mcfly-btn--primary mcfly-spend-submit"
                href={selectedBlankTemplateHref}
              >
                Download this template
              </a>
            </div>
          </section>

          <section
            id="mcfly-spend-add"
            className="mcfly-panel mcfly-panel--eq-compact mcfly-spend-add"
            aria-label="Type it"
          >
            <div className="mcfly-panel__head mcfly-panel__head--tight">
              <h2>Type it</h2>
              <p className="mcfly-panel__muted">
                {NUMBER_HONESTY.invoiceHint} Channel + amount + day / week /
                month / quarter / half-year / year — we spread it evenly in shop
                timezone.
              </p>
            </div>
            <Form method="post" className="mcfly-spend-add__form">
              <input type="hidden" name="intent" value="bill-daily" />
              <input type="hidden" name="periodType" value={billPeriodType} />
              <input type="hidden" name="anchor" value={billAnchor} />
              <input type="hidden" name="channel" value={billChannel} />
              <input type="hidden" name="customName" value={billCustomName} />
              <input type="hidden" name="amount" value={billAmount} />
              <div className="mcfly-spend-add__grid">
                <label className="mcfly-spend-add__field">
                  <span>Amount</span>
                  <input
                    className="mcfly-field"
                    type="number"
                    min="0"
                    step="0.01"
                    inputMode="decimal"
                    required
                    placeholder="400"
                    aria-label="Spend amount"
                    value={billAmount}
                    onChange={(e) => {
                      setBillAmount(e.target.value);
                      setBillError(null);
                    }}
                  />
                </label>
                <label className="mcfly-spend-add__field">
                  <span>Period</span>
                  <select
                    className="mcfly-field"
                    value={billPeriodType}
                    aria-label="Spend period"
                    onChange={(e) => {
                      const v = e.target.value;
                      if (isPeriodWindowType(v)) {
                        setBillPeriodType(v);
                        if (v === "day" || v === "week") {
                          setBillAnchor(yesterdayKey);
                        } else {
                          setBillAnchor(currentYearMonth());
                        }
                      }
                      setBillError(null);
                    }}
                  >
                    <option value="day">Day</option>
                    <option value="week">Week</option>
                    <option value="month">Month</option>
                    <option value="quarter">Quarter</option>
                    <option value="half_year">Half-year</option>
                    <option value="year">Year</option>
                  </select>
                </label>
                {needsDateAnchor ? (
                  <label className="mcfly-spend-add__field">
                    <span>Date</span>
                    <input
                      className="mcfly-field"
                      type="date"
                      name="spendDate"
                      value={billAnchor}
                      min={spendHistoryFloorKey}
                      max={todayKey}
                      required
                      aria-label="Spend date"
                      onChange={(e) => {
                        setBillAnchor(e.target.value);
                        setBillError(null);
                      }}
                    />
                  </label>
                ) : (
                  <label className="mcfly-spend-add__field">
                    <span>Starting month</span>
                    <input
                      className="mcfly-field"
                      type="month"
                      value={billAnchor.slice(0, 7)}
                      min={spendHistoryFloorKey.slice(0, 7)}
                      max={todayKey.slice(0, 7)}
                      required
                      aria-label="Spend month"
                      onChange={(e) => {
                        setBillAnchor(e.target.value);
                        setBillError(null);
                      }}
                    />
                  </label>
                )}
                <label className="mcfly-spend-add__field">
                  <span>Channel</span>
                  <select
                    className="mcfly-field"
                    value={billChannel}
                    aria-label="Spend channel"
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
                  <label className="mcfly-spend-add__field mcfly-spend-add__field--wide">
                    <span>Name</span>
                    <input
                      className="mcfly-field"
                      type="text"
                      maxLength={80}
                      placeholder="Billboard, radio, agency…"
                      value={billCustomName}
                      onChange={(e) => {
                        setBillCustomName(e.target.value);
                        setBillError(null);
                      }}
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
                      billChannel === "other" &&
                      billCustomName === presetItem.label
                        ? "mcfly-spend-add__preset mcfly-spend-add__preset--on"
                        : "mcfly-spend-add__preset"
                    }
                    onClick={() => {
                      setBillChannel("other");
                      setBillCustomName(presetItem.label);
                    }}
                  >
                    {presetItem.label}
                  </button>
                ))}
              </div>
              {billPreview ? (
                <p className="mcfly-spend-lean__bill-preview">
                  {billPreview.startDateYmd}
                  {billPreview.endDateYmd !== billPreview.startDateYmd
                    ? ` → ${billPreview.endDateYmd}`
                    : ""}
                  {" · "}
                  {billPreview.dayCount} day
                  {billPreview.dayCount === 1 ? "" : "s"}
                </p>
              ) : null}
              {billError ? (
                <p className="mcfly-spend-lean__bill-error" role="alert">
                  {billError}
                </p>
              ) : null}
              <div className="mcfly-spend-add__actions">
                {/*
                 * Native button, not <s-button>. In the 2026-08-26 Admin smoke
                 * the web-component host measured 0×0, so the merchant's first
                 * click sailed past it and opened the channel select instead of
                 * saving. A real button with a real box submits on click one.
                 */}
                <button
                  type="submit"
                  className="mcfly-btn mcfly-btn--primary mcfly-spend-submit"
                  disabled={
                    !billPreview ||
                    (isSubmitting && submittingIntent === "bill-daily")
                  }
                  aria-busy={isSubmitting && submittingIntent === "bill-daily"}
                >
                  {isSubmitting && submittingIntent === "bill-daily"
                    ? "Saving…"
                    : billPreview
                      ? `That’s ${formatCurrency(billPreview.dailyAmount)} per day.`
                      : "Enter an amount"}
                </button>
              </div>
            </Form>
          </section>

          <section
            id="mcfly-spend-csv"
            className="mcfly-panel mcfly-panel--eq-compact"
            aria-label="Paste or upload Ads Manager CSV"
          >
            <div className="mcfly-panel__head mcfly-panel__head--tight">
              <h2>Paste or upload Ads Manager CSV</h2>
              <p className="mcfly-panel__muted">
                Native Ads Manager export with Day + Amount spent. Same day +
                channel replaces. Header row required.
              </p>
            </div>
            <Form
              id="mcfly-spend-csv-form"
              method="post"
              encType="multipart/form-data"
            >
              <input type="hidden" name="intent" value="csv" />
              <input type="hidden" name="forceChannel" value={forceChannel} />
              <input
                type="hidden"
                name="confirm_replace"
                value={confirmReplace ? "1" : "0"}
              />
              <label className="mcfly-spend-lean__paste-label" htmlFor="mcfly-spend-csv-paste">
                Paste daily rows
              </label>
              <textarea
                id="mcfly-spend-csv-paste"
                name="csv"
                className="mcfly-spend-lean__paste"
                value={csvPayload}
                onChange={(e) => setCsvPayload(e.target.value)}
                rows={6}
                spellCheck={false}
                placeholder={"Day,Meta,Google\n2026-08-01,120.00,80.00"}
                aria-label="Paste daily spend rows"
              />
              <label className="mcfly-spend-lean__drop">
                <span className="mcfly-spend-lean__drop-title">
                  Or upload a CSV
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
              {/* Native button — same zero-size host risk as the Type-it door. */}
              <button
                id="mcfly-spend-csv-submit"
                type="submit"
                className="mcfly-btn mcfly-btn--primary mcfly-spend-submit"
                disabled={isSubmitting && submittingIntent === "csv"}
                aria-busy={isSubmitting && submittingIntent === "csv"}
              >
                {isSubmitting && submittingIntent === "csv"
                  ? "Importing…"
                  : "Import spend"}
              </button>
            </Form>
          </section>

          <section
            id="mcfly-spend-calculators"
            className="mcfly-panel mcfly-panel--eq-compact"
            aria-label="Calculators"
          >
            <div className="mcfly-panel__head mcfly-panel__head--tight">
              <h2>Calculators</h2>
              <p className="mcfly-panel__muted">
                Same math as Overview — sales ÷ spend, and break-even from
                contribution margin. Nothing is saved.
              </p>
            </div>
            <div className="mcfly-spend-add__grid">
              <label className="mcfly-spend-add__field">
                <span>Sales</span>
                <input
                  className="mcfly-field"
                  type="number"
                  min="0"
                  step="0.01"
                  inputMode="decimal"
                  value={calcSales}
                  onChange={(e) => setCalcSales(e.target.value)}
                  aria-label="Calculator sales"
                />
              </label>
              <label className="mcfly-spend-add__field">
                <span>Spend</span>
                <input
                  className="mcfly-field"
                  type="number"
                  min="0"
                  step="0.01"
                  inputMode="decimal"
                  value={calcSpend}
                  onChange={(e) => setCalcSpend(e.target.value)}
                  aria-label="Calculator spend"
                />
              </label>
              <label className="mcfly-spend-add__field">
                <span>Margin %</span>
                <input
                  className="mcfly-field"
                  type="number"
                  min="1"
                  max="99"
                  step="0.1"
                  inputMode="decimal"
                  value={calcMargin}
                  onChange={(e) => setCalcMargin(e.target.value)}
                  aria-label="Calculator margin percent"
                />
              </label>
            </div>
            <p className="mcfly-panel__muted" style={{ marginTop: "0.65rem" }}>
              Total ROAS{" "}
              {calcRoas == null ? "—" : `${calcRoas.toFixed(2)}×`}
              {" · "}
              Break-even{" "}
              {calcBreakEven == null ? "—" : `${calcBreakEven.toFixed(2)}×`}
            </p>
          </section>

          <section
            className="mcfly-panel mcfly-panel--eq-compact mcfly-spend-explorer"
            aria-label="Day week month spend"
          >
            <div className="mcfly-panel__head mcfly-panel__head--tight">
              <h2>Daily spend by channel</h2>
              <p className="mcfly-panel__muted">
                {isEmpty
                  ? "Ninety closed days so you can see where history is missing. Same date buttons as Overview."
                  : "Spend you added next to Shopify sales for this period — same dates as Overview."}
              </p>
            </div>
            <SpendExplorer
              series={explorer}
              period={preset}
              shotMode={shotMode}
              basePath="/app/spend"
              compare
              variant="spend"
            />
          </section>

          <div className="mcfly-spend-lean__status" role="status">
            {sampleDesk.enabled ? (
              <>
                <p className="mcfly-spend-lean__status-line">
                  Sample data is loaded
                  {entries.length > 0
                    ? ` · ${entries.length.toLocaleString()} recent rows shown`
                    : ""}
                  . Saving spend switches you to Live data.
                </p>
                <p className="mcfly-spend-lean__status-foot">
                  Live data is this shop’s Shopify sales plus the spend you add.
                </p>
              </>
            ) : coverageThroughYesterday.upToDate ? (
              <p className="mcfly-spend-lean__status-line">
                ✓ Up to date through yesterday
              </p>
            ) : entries.length === 0 ? (
              <p className="mcfly-spend-lean__status-line">
                No spend on Live data yet. Add yesterday’s Meta and a billboard
                — Empty spend is $0.
              </p>
            ) : (
              <p className="mcfly-spend-lean__status-line">
                Your spend is on the desk. Days with no row are $0 — last month
                is enough to start
                {missingDatesPreview.length > 0 ? (
                  <>
                    {" · "}
                    <s-link href={missingDatesHref}>download blanks</s-link>
                    {" if you want them"}
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
