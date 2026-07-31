import { useEffect, useMemo, useRef, useState } from "react";
import type {
  ActionFunctionArgs,
  HeadersFunction,
  LoaderFunctionArgs,
} from "react-router";
import { Form, useActionData, useLoaderData, useLocation, useNavigation } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { PeriodControl } from "../components/PeriodControl";
import { SampleDeskBanner } from "../components/SampleDeskBanner";
import { authenticate } from "../shopify.server";
import { ensureShop, getSpendPeriodCoverage } from "../lib/mer-dashboard.server";
import { parsePeriodPreset, resolvePeriod, type PeriodPreset } from "../lib/periods";
import {
  computeSpendRecon,
  formatSpendCoverageLine,
  formatSpendReconLine,
  spendReconMatchesPeriod,
} from "../lib/mer-trust";
import {
  aggregateSpendRows,
  combineSpendCsvInputs,
  parseSpendCsv,
  assertSpendCsvLimits,
  SPEND_CSV_MAX_BYTES,
  WIDE_TEMPLATE_COLUMNS,
  WIDE_TEMPLATE_HEADERS,
  WIDE_TEMPLATE_SAMPLE,
  buildBlankSpendTemplate,
  buildBlankSpendTemplateForDates,
  buildSelectedPlatformTemplateCsv,
  buildSheetsImportGuide,
  platformsToTemplateCols,
  SHEETS_CREATE_URL,
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
  type LumpSpreadPlan,
  type PeriodWindowType,
} from "../lib/spend-period-allocate";
import {
  ADVERTISE_PLATFORM_GROUPS,
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
} from "../lib/sample-desk.server";
import { formatCurrency } from "../lib/mer-format";
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

const MAX_COMBINE_SLOTS = 20;
/** Ablestar fail-closed: never punch live CSV into a sample-ON desk. */
const SAMPLE_DESK_IMPORT_BLOCK =
  "Sample preview is on. Tap Real store at the top of the page before importing live spend. Sample rows were not changed.";
/** localStorage key — JSON array of SpendAdvertisePlatformId */
const PLATFORM_STORAGE_KEY = "mcfly-spend-platforms";
/** First-visit default — Free path is Meta + Google. */
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
        : `${SPEND_CHANNEL_LABELS[value]} — Pro`,
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
  const shotMode = url.searchParams.get("shot") === "1";
  const preset = parsePeriodPreset(url.searchParams.get("period"));
  const range = resolvePeriod(preset, new Date(), shop.ianaTimezone);
  const sampleDesk = await getSampleDeskStats(shop.id);
  const settings = await prisma.settings.findUnique({ where: { shopId: shop.id } });
  // Real entries only — sample-desk rows are demo data and would drown out
  // an operator's own uploads in "Recent entries" (sample dates run through today).
  const [entries, dayCoverage, periodSpend, periodCoverage] = await Promise.all([
    prisma.spendEntry.findMany({
      where: { shopId: shop.id, source: { not: "sample" } },
      orderBy: { periodStart: "desc" },
      take: 20,
    }),
    // Sample desk ON → coverage may include sample spend days; OFF → real only.
    loadSpendDayCoverage(shop.id, sampleDesk.enabled),
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
      excludeSample: !sampleDesk.enabled,
      sampleOnly: sampleDesk.enabled,
      timeZone: sampleDesk.enabled ? null : shop.ianaTimezone,
    }),
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

  const entitlements = getShopEntitlements(session.shop, {
    sampleDesk: sampleDesk.enabled,
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
    spendRecon,
    declaredAdsSpend: declaredMatches ? settings?.declaredAdsSpend ?? null : null,
    entitlements,
    channels: channelOptionsFor(entitlements),
    addSpendChannels: addSpendSelectOptions(entitlements),
    spendHistoryFloorKey: salesDayFactWindowStartUtc().toISOString().slice(0, 10),
    spendHistoryYearsBack: SALES_DAY_FACT_WINDOW_YEARS_BACK,
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

function downloadCsvFile(contents: string, filename: string) {
  const blob = new Blob([contents.endsWith("\n") ? contents : `${contents}\n`], {
    type: "text/csv;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
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
    periodCoverage,
    preset,
    periodLabel,
    periodSpendTotal,
    spendRecon,
    declaredAdsSpend,
    entitlements,
    addSpendChannels,
    spendHistoryFloorKey,
    spendHistoryYearsBack,
  } = useLoaderData<typeof loader>();
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
  const holeCount = dayCoverage.total - dayCoverage.filledCount;
  const missingDates = dayCoverage.days
    .filter((d) => !d.filled)
    .map((d) => d.dateKey);
  const missingDatesPreview = missingDates.slice(0, 8);
  const freeTemplateChannels = entitlements.canUseAllChannels
    ? undefined
    : entitlements.allowedChannels;
  const csvBlank = buildBlankSpendTemplate(14, freeTemplateChannels).trim();
  const csvSample = entitlements.canUseAllChannels
    ? WIDE_TEMPLATE_SAMPLE.trim()
    : buildSelectedPlatformTemplateCsv(
        platformsToTemplateCols([...entitlements.allowedChannels]),
        { dayCount: 14, example: true },
      ).csv.trim();
  const blankTemplateHref = entitlements.canUseAllChannels
    ? "/app/spend/template?blank=1"
    : `/app/spend/template?platforms=${encodeURIComponent(entitlements.allowedChannels.join(","))}&blank=1`;
  const exampleTemplateHref = entitlements.canUseAllChannels
    ? "/app/spend/template"
    : `/app/spend/template?platforms=${encodeURIComponent(entitlements.allowedChannels.join(","))}&example=1`;
  const missingDatesCsv = buildBlankSpendTemplateForDates(
    missingDates,
    freeTemplateChannels,
  ).trim();
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
  const [showExportWalkthroughs, setShowExportWalkthroughs] = useState(false);
  const [pasteText, setPasteText] = useState("");
  const pasteRef = useRef<HTMLTextAreaElement>(null);
  const [billAmount, setBillAmount] = useState("");
  const [billPeriodType, setBillPeriodType] = useState<PeriodWindowType>("month");
  const [billAnchor, setBillAnchor] = useState(() => currentYearMonth());
  const [billChannel, setBillChannel] = useState<SpendChannel>("meta");
  const [billCustomName, setBillCustomName] = useState("");
  const [billPreview, setBillPreview] = useState<LumpSpreadPlan | null>(null);
  const [addChannel, setAddChannel] = useState<SpendChannel>("meta");
  const [addCustomName, setAddCustomName] = useState("");
  const [billPreviewError, setBillPreviewError] = useState<string | null>(null);
  const [forceChannel, setForceChannel] = useState<"" | "meta" | "google">("");
  const [confirmReplace, setConfirmReplace] = useState(false);
  const [sheetsGuideHighlight, setSheetsGuideHighlight] = useState(false);
  const sheetsGuideRef = useRef<HTMLOListElement>(null);

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

  function fillMissingDaysIntoPaste() {
    setPasteText(missingDatesCsv);
    const anchor = document.getElementById("mcfly-spend-uploads");
    anchor?.scrollIntoView({ behavior: "smooth", block: "start" });
    window.setTimeout(() => pasteRef.current?.focus(), 280);
  }

  function runBillPreview() {
    const amount = parseFloat(billAmount);
    const result = planLumpSpread({
      totalAmount: amount,
      periodType: billPeriodType,
      anchor: billAnchor,
      channel: billChannel,
    });
    if (!result.ok) {
      setBillPreview(null);
      setBillPreviewError(result.error);
      return;
    }
    setBillPreviewError(null);
    setBillPreview(result.plan);
  }

  function downloadBillCsv() {
    const amount = parseFloat(billAmount);
    const result = planLumpSpread({
      totalAmount: amount,
      periodType: billPeriodType,
      anchor: billAnchor,
      channel: billChannel,
    });
    if (!result.ok) {
      setBillPreview(null);
      setBillPreviewError(result.error);
      return;
    }
    setBillPreviewError(null);
    setBillPreview(result.plan);
    downloadCsvFile(
      buildLumpSpreadLongCsv(result.plan),
      lumpSpreadFilename(result.plan),
    );
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

  const selectedTemplate = useMemo(
    () =>
      buildSelectedPlatformTemplateCsv(
        selectedPlatforms.map((p) => ({
          title: p.title,
          engineChannel: p.engineChannel,
        })),
        { example: true },
      ),
    [selectedPlatforms],
  );

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

  const goodLooksExample = useMemo(() => {
    if (selectedTemplate.headers.length === 0) {
      return "Day,Meta,Google\n2026-07-01,120.00,80.00\n2026-07-02,95.50,60.00";
    }
    const header = selectedTemplate.headers.join(",");
    const rows = selectedTemplate.rows.slice(0, 2).map((r) => r.join(","));
    return [header, ...rows].join("\n");
  }, [selectedTemplate]);

  const columnLegend = useMemo(() => {
    if (selectedTemplate.headers.length === 0) return "Day | Meta | Google";
    return selectedTemplate.headers.join(" | ");
  }, [selectedTemplate]);

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
  const selectedExampleTemplateHref = `/app/spend/template?platforms=${encodeURIComponent(selectedPlatformsQuery)}&example=1`;

  const sheetsGuide = useMemo(
    () =>
      buildSheetsImportGuide({
        platformLabels:
          selectedPlatforms.length > 0
            ? selectedPlatforms.map((p) => p.title)
            : ["Meta (Facebook + Instagram)", "Google Ads"],
      }),
    [selectedPlatforms],
  );

  function openGoogleSheetsWithGuide() {
    setSheetsGuideHighlight(true);
    const panel = document.getElementById("mcfly-spend-sheets");
    if (panel) {
      if (panel instanceof HTMLDetailsElement) {
        panel.open = true;
      }
      panel.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    sheetsGuideRef.current?.focus?.();
    window.open(SHEETS_CREATE_URL, "_blank", "noopener,noreferrer");
  }

  function isPlatformSelectable(id: SpendAdvertisePlatformId): boolean {
    if (entitlements.canUseAllChannels) return true;
    const platform = getAdvertisePlatform(id);
    if (!platform) return false;
    return entitlements.allowedChannels.includes(platform.engineChannel);
  }

  function togglePlatform(id: SpendAdvertisePlatformId) {
    if (!isPlatformSelectable(id)) return;
    setSelectedPlatformIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

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
      ) : isEmpty && !shotMode ? (
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
          shotMode ? "mcfly-desk--shot" : null,
          sampleDesk.enabled ? "mcfly-desk--sample" : null,
        ]
          .filter(Boolean)
          .join(" ")}
      >
      {sampleDesk.enabled && !shotMode ? (
        <SampleDeskBanner note="SAMPLE data is on. Turn it off before uploading your real spend." />
      ) : null}

      {!shotMode && periodCoverage.daysInPeriod > 0 ? (
        <div
          className={[
            "mcfly-spend-period-coverage",
            periodCoverage.incomplete ? "mcfly-spend-period-coverage--warn" : null,
          ]
            .filter(Boolean)
            .join(" ")}
          role="status"
        >
          <p className="mcfly-spend-period-coverage__title">
            {periodLabel} · spend completeness
          </p>
          <p className="mcfly-spend-period-coverage__line">
            {formatSpendCoverageLine(periodCoverage, periodLabel)}
            {periodCoverage.incomplete
              ? " — fill gaps before trusting Total ROAS."
              : ` — coverage looks ready to share ${PRODUCT_NOUN.totalRoas}.`}
          </p>
          <div
            className="mcfly-spend-period-coverage__meter"
            aria-hidden="true"
          >
            <span style={{ width: `${periodCoverage.coveragePct}%` }} />
          </div>
        </div>
      ) : null}

      {!shotMode ? (
        <s-banner tone="info" heading="History window">
          <s-paragraph>
            You can load spend back to <strong>{spendHistoryFloorKey}</strong>{" "}
            (Jan 1, {spendHistoryYearsBack} years ago) — the same window as
            Shopify sales history for Total ROAS. Same day + channel again{" "}
            <strong>replaces</strong> the amount (does not double-count). Days
            not in your file stay as they are.
          </s-paragraph>
        </s-banner>
      ) : null}

      {/* Empty desk: Add spend owns primary. Pro upsell after first spend (uninstall guard). */}
      {isEmpty && !actionData?.success && !csvNeedsConfirm && !shotMode ? (
        <s-banner tone="info" heading="Add your first spend">
          <s-paragraph>
            Shopify sales are automatic. Download the blank template, fill daily
            ad spend, then paste or upload below. Or add one day manually.
          </s-paragraph>
          <div className="mcfly-decision__actions" style={{ marginTop: "0.65rem" }}>
            <s-button href="#mcfly-spend-uploads" variant="primary">
              Paste or upload CSV
            </s-button>
            <s-button href={blankTemplateHref} variant="secondary">
              Download blank template
            </s-button>
            <s-button href="#mcfly-spend-add" variant="tertiary">
              Add one day
            </s-button>
          </div>
        </s-banner>
      ) : null}

      {!shotMode && !isEmpty && entitlements.showProTeaser ? (
        <s-banner tone="info" heading="Free · Meta + Google + custom Other">
          <s-paragraph>{entitlements.upsell.channels}</s-paragraph>
          <div className="mcfly-decision__actions" style={{ marginTop: "0.65rem" }}>
            <s-button href="/app/settings" variant="secondary">
              {entitlements.upsell.upgradeCta}
            </s-button>
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
              Cancel — edit CSV
            </s-button>
          </div>
        </s-banner>
      ) : null}

      {csvSaved && csv ? (
        <s-banner tone="success" heading={`Spend imported — next: ${PRODUCT_NOUN.totalRoas}`}>
          <div className="mcfly-metrics mcfly-spend-summary">
            <div className="mcfly-metric mcfly-metric--success mcfly-metric--compact">
              <p className="mcfly-metric__label">Replaced</p>
              <p className="mcfly-metric__value">{csv.updated}</p>
              <p className="mcfly-metric__hint">overlapping day+channel</p>
            </div>
            <div className="mcfly-metric mcfly-metric--success mcfly-metric--compact">
              <p className="mcfly-metric__label">Added</p>
              <p className="mcfly-metric__value">{csv.created}</p>
              <p className="mcfly-metric__hint">new day+channel</p>
            </div>
            <div className="mcfly-metric mcfly-metric--compact">
              <p className="mcfly-metric__label">Skipped</p>
              <p className="mcfly-metric__value">{csv.skipped}</p>
              <p className="mcfly-metric__hint">already up to date</p>
            </div>
            <div className="mcfly-metric mcfly-metric--compact">
              <p className="mcfly-metric__label">Days covered</p>
              <p className="mcfly-metric__value">{csv.days}</p>
              {csv.dateRange ? (
                <p className="mcfly-metric__hint">
                  {csv.dateRange.start} → {csv.dateRange.end}
                </p>
              ) : null}
            </div>
            <div className="mcfly-metric mcfly-metric--compact">
              <p className="mcfly-metric__label">Total spend</p>
              <p className="mcfly-metric__value">{formatCurrency(csv.totalAmount)}</p>
            </div>
          </div>
          {csv.salesWindowWarning ? (
            <s-paragraph>{csv.salesWindowWarning}</s-paragraph>
          ) : null}
          <div className="mcfly-spend-next">
            {holeCount > 0 ? (
              <>
                <s-button variant="primary" onClick={fillMissingDaysIntoPaste}>
                  Fill {holeCount} empty day{holeCount === 1 ? "" : "s"} into paste
                </s-button>
                <s-button href="/app" variant="secondary">
                  View {PRODUCT_NOUN.totalRoas} — fill empty days first
                </s-button>
                <s-text tone="neutral">
                  Empty days understate spend and inflate {PRODUCT_NOUN.totalRoas}.
                  Fill holes before sharing.
                </s-text>
              </>
            ) : (
              <>
                <s-button href="/app" variant="primary">
                  {PRODUCT_NOUN.openTotalRoas}
                </s-button>
                <s-text tone="neutral">
                  {PRODUCT_NOUN.definitionForPeriod}. Share Overview from Home when
                  you want to email or copy the summary yourself.
                </s-text>
              </>
            )}
          </div>
          {csvErrorGroups ? <CsvErrorGroups grouped={csvErrorGroups} /> : null}
        </s-banner>
      ) : null}

      {manualSaved ? (
        <s-banner tone="success" heading={`Spend saved — next: ${PRODUCT_NOUN.totalRoas}`}>
          <div className="mcfly-spend-next">
            <s-button href="/app" variant="primary">
              {PRODUCT_NOUN.openTotalRoas}
            </s-button>
            <s-text tone="neutral">
              Add another channel below if needed, or upload a full daily CSV.
            </s-text>
          </div>
        </s-banner>
      ) : null}

      {actionData && !actionData.success && actionData.error && !csvNeedsConfirm ? (
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
                row, and re-import. This file is spend aggregates only — never paste sales here.
              </s-text>
            </s-paragraph>
          )}
        </s-banner>
      ) : null}

      {!shotMode ? (
        <aside
          className="mcfly-spend-io"
          aria-label="Spend input and Mcfly output"
        >
          <p className="mcfly-spend-io__title">Input → output</p>
          <ul className="mcfly-spend-io__list">
            <li>
              <strong>You:</strong> paste or upload a daily spend CSV (or add one
              day / spread a lump bill).
            </li>
            <li>
              <strong>Mcfly:</strong> pulls Shopify sales →{" "}
              {PRODUCT_NOUN.totalRoas} vs break-even. Share from Overview yourself.
            </li>
            <li>
              <strong>Overlaps:</strong> same day + channel replaces the amount —
              never double-counts a Monday re-upload.
            </li>
          </ul>
        </aside>
      ) : null}

      <div className="mcfly-ctx" aria-live="polite">
        <div className="mcfly-ctx__main">
          <span className="mcfly-ctx__brand">Spend</span>
          <span className="mcfly-ctx__sep" aria-hidden="true">
            ·
          </span>
          <span className="mcfly-ctx__asof">
            {sampleDesk.enabled
              ? `${periodLabel} · SAMPLE`
              : periodLabel}
          </span>
          <PeriodControl preset={preset} shotMode={shotMode} />
        </div>
      </div>

      <ol className="mcfly-spend-flow__toc" aria-label="Spend steps">
        <li>
          <a href="#mcfly-spend-uploads">
            <strong>1</strong> Paste / upload CSV
          </a>
        </li>
        <li>
          <a href="#mcfly-spend-coverage">
            <strong>2</strong> Coverage
          </a>
        </li>
        <li>
          <a href="#mcfly-spend-add">
            <strong>or</strong> Add one day
          </a>
        </li>
        <li>
          <a href="#mcfly-spend-more">
            <strong>+</strong> More ways
          </a>
        </li>
      </ol>

      <s-section heading="Log spend">
        <div id="mcfly-spend-exports" className="mcfly-spend-flow">
          <s-stack direction="block" gap="large">
            {/* 1 · Paste / upload first */}
            <div
              id="mcfly-spend-uploads"
              className="mcfly-panel mcfly-spend-flow__step mcfly-spend-import"
            >
              <s-stack direction="block" gap="base">
                <div className="mcfly-spend-flow__head">
                  <span className="mcfly-spend-flow__n" aria-hidden="true">
                    1
                  </span>
                  <s-heading>Paste or upload your spend CSV</s-heading>
                </div>
                <s-text tone="neutral">
                  One row = one day. Use Day + Meta/Google columns, or
                  date,channel,amount.{" "}
                  <s-link href={blankTemplateHref}>Download blank template</s-link>
                  {" · "}
                  <s-link href={exampleTemplateHref}>example</s-link>
                  . Same days again update the numbers (we’ll ask before replacing).
                </s-text>
                <Form method="post" encType="multipart/form-data">
                  <input type="hidden" name="intent" value="csv" />
                  <input type="hidden" name="forceChannel" value={forceChannel} />
                  <input
                    type="hidden"
                    name="confirm_replace"
                    value={confirmReplace ? "1" : "0"}
                  />
                  <s-stack direction="block" gap="base">
                    <div className="mcfly-spend-import__paths">
                      <label className="mcfly-spend-import__path mcfly-spend-flow__paste-box">
                        <span className="mcfly-spend-import__path-title">
                          Paste
                        </span>
                        <s-text tone="neutral">
                          Include the header row
                        </s-text>
                        <textarea
                          ref={pasteRef}
                          className="mcfly-field mcfly-field--wide"
                          name="csv"
                          rows={8}
                          value={pasteText}
                          onChange={(e) => setPasteText(e.target.value)}
                          placeholder={
                            pastePlaceholder ||
                            "Day,Meta,Google\n2026-07-01,120.00,80.00"
                          }
                          disabled={
                            isSubmitting && submittingIntent === "csv"
                          }
                          spellCheck={false}
                          aria-label="Paste spend CSV"
                        />
                      </label>
                      <div className="mcfly-spend-import__path">
                        <span className="mcfly-spend-import__path-title">
                          Upload .csv
                        </span>
                        <s-text tone="neutral">
                          Drop the filled spreadsheet file here
                        </s-text>
                        <s-drop-zone
                          label="Spend CSV"
                          name="file"
                          accept=".csv,text/csv,application/vnd.ms-excel"
                          accessibilityLabel="Upload spend CSV"
                          {...(isSubmitting && submittingIntent === "csv"
                            ? { disabled: true }
                            : {})}
                          {...(csvFieldError && !csvNeedsConfirm
                            ? { error: csvFieldError }
                            : {})}
                        />
                      </div>
                    </div>
                    <div className="mcfly-spend-import__good">
                      <p className="mcfly-spend-import__good-label">
                        What good looks like
                      </p>
                      <pre className="mcfly-spend-import__example">
                        {goodLooksExample ||
                          "Day,Meta,Google\n2026-07-01,120.00,80.00\n2026-07-02,95.50,60.00"}
                      </pre>
                    </div>
                    {csvFieldError && !csvNeedsConfirm ? (
                      <div className="mcfly-spend-upload-log" role="alert">
                        <s-text tone="critical">{csvFieldError}</s-text>
                      </div>
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
                  </s-stack>
                </Form>
              </s-stack>
            </div>

            {/* 2 · Coverage front-and-center */}
            <div
              id="mcfly-spend-coverage"
              className="mcfly-panel mcfly-spend-flow__step"
            >
              <s-stack direction="block" gap="base">
                <div className="mcfly-spend-flow__head">
                  <span className="mcfly-spend-flow__n" aria-hidden="true">
                    2
                  </span>
                  <s-heading>Spend coverage</s-heading>
                </div>
                <div className="mcfly-spend-cal">
                  <div className="mcfly-spend-cal__meta">
                    <s-text>
                      {dayCoverage.filledCount} of {dayCoverage.total} days have
                      spend
                      {holeCount > 0 ? ` · ${holeCount} empty` : " · no holes"}
                      {dayCoverage.includesSample
                        ? " · includes sample"
                        : null}
                    </s-text>
                    <s-text tone="neutral">
                      Last {dayCoverage.total} days — empty cells understate spend
                      and inflate Total ROAS.
                    </s-text>
                  </div>
                  <div
                    className="mcfly-spend-cal__strip"
                    role="list"
                    aria-label={`Spend coverage, last ${dayCoverage.total} days`}
                  >
                    {dayCoverage.days.map((day) => (
                      <span
                        key={day.dateKey}
                        role="listitem"
                        className={
                          day.filled
                            ? "mcfly-spend-cal__day mcfly-spend-cal__day--filled"
                            : "mcfly-spend-cal__day mcfly-spend-cal__day--empty"
                        }
                        title={`${day.dateKey}${day.filled ? " · spend logged" : " · no spend"}`}
                        aria-label={`${day.dateKey}${day.filled ? ", spend logged" : ", empty"}`}
                      >
                        <span
                          className="mcfly-spend-cal__tick"
                          aria-hidden="true"
                        />
                        <span className="mcfly-spend-cal__label">
                          {day.label}
                        </span>
                      </span>
                    ))}
                  </div>
                  {holeCount > 0 ? (
                    <div className="mcfly-spend-holes">
                      <div className="mcfly-spend-holes__actions">
                        <s-button
                          variant="primary"
                          onClick={fillMissingDaysIntoPaste}
                        >
                          Fill empty days into paste
                        </s-button>
                        <s-button
                          variant="secondary"
                          onClick={() =>
                            downloadCsvFile(
                              missingDatesCsv,
                              "mcfly-spend-missing-days.csv",
                            )
                          }
                        >
                          Download blank for holes
                        </s-button>
                      </div>
                    </div>
                  ) : null}
                </div>
              </s-stack>
            </div>

            {/* More ways — demoted */}
            <details
              id="mcfly-spend-more"
              className="mcfly-details mcfly-spend-secondary__details"
            >
              <summary>More ways — one day, platforms, lump bill, Sheets</summary>
              <div className="mcfly-spend-secondary__body">
            {/* 1 · Add spend (beginner primary) */}
            <div
              id="mcfly-spend-add"
              className="mcfly-panel mcfly-spend-flow__step mcfly-spend-add"
            >
              <s-stack direction="block" gap="base">
                <div className="mcfly-spend-flow__head">
                  <span className="mcfly-spend-flow__n" aria-hidden="true">
                    1
                  </span>
                  <s-heading>Add spend</s-heading>
                </div>
                <s-text tone="neutral">
                  Shopify sales are automatic. You only add what you paid to
                  advertise. TikTok, Microsoft, Amazon, and more unlock on Pro —
                  they stay visible below so you can upgrade when ready.
                </s-text>
                <Form method="post" className="mcfly-spend-add__form">
                  <input type="hidden" name="intent" value="manual" />
                  <s-stack direction="block" gap="base">
                    <label className="mcfly-spend-add__field">
                      <s-text>Where did you spend?</s-text>
                      <select
                        className="mcfly-field"
                        name="channel"
                        value={addChannel}
                        onChange={(e) =>
                          setAddChannel(e.target.value as SpendChannel)
                        }
                        disabled={
                          isSubmitting && submittingIntent === "manual"
                        }
                      >
                        {addSpendChannels.map(({ value, label, disabled }) => (
                          <option
                            key={value}
                            value={value}
                            disabled={disabled}
                          >
                            {label}
                          </option>
                        ))}
                      </select>
                    </label>
                    {addChannel === "other" ? (
                      <label className="mcfly-spend-add__field">
                        <s-text>What do you call it?</s-text>
                        <input
                          className="mcfly-field"
                          name="customName"
                          type="text"
                          required
                          maxLength={80}
                          value={addCustomName}
                          onChange={(e) => setAddCustomName(e.target.value)}
                          placeholder="e.g. Influencers, Podcast, Agency"
                          disabled={
                            isSubmitting && submittingIntent === "manual"
                          }
                        />
                      </label>
                    ) : null}
                    {entitlements.showProTeaser ? (
                      <p className="mcfly-spend-add__upsell">
                        Greyed platforms need{" "}
                        <s-link href="/app/settings">
                          {entitlements.upsell.upgradeCta}
                        </s-link>
                        .
                      </p>
                    ) : null}
                    <label className="mcfly-spend-add__field">
                      <s-text>How much? (USD)</s-text>
                      <input
                        className="mcfly-field"
                        name="amount"
                        type="number"
                        step="0.01"
                        min="0"
                        required
                        placeholder="5000"
                        disabled={
                          isSubmitting && submittingIntent === "manual"
                        }
                      />
                    </label>
                    <label className="mcfly-spend-add__field">
                      <s-text>For which period?</s-text>
                      <select
                        className="mcfly-field"
                        name="period"
                        defaultValue="mtd"
                        disabled={
                          isSubmitting && submittingIntent === "manual"
                        }
                      >
                        <option value="mtd">Month to date</option>
                        <option value="qtd">Quarter to date</option>
                        <option value="ytd">Year to date</option>
                      </select>
                    </label>
                    <s-button
                      type="submit"
                      variant="primary"
                      {...(isSubmitting && submittingIntent === "manual"
                        ? { loading: true }
                        : {})}
                    >
                      {isEmpty
                        ? `Save spend · ${PRODUCT_NOUN.openTotalRoas}`
                        : "Save spend"}
                    </s-button>
                  </s-stack>
                </Form>
              </s-stack>
            </div>

            {/* 2 · Select platforms (CSV + Pro upsell) */}
            <div
              id="mcfly-spend-platforms"
              className="mcfly-panel mcfly-spend-flow__step"
            >
              <s-stack direction="block" gap="base">
                <div className="mcfly-spend-flow__head">
                  <span className="mcfly-spend-flow__n" aria-hidden="true">
                    2
                  </span>
                  <s-heading>Select platforms for CSV</s-heading>
                </div>
                <s-text tone="neutral">
                  {entitlements.canUseAllChannels
                    ? "Meta + Google start checked — add others if you spend there. Templates and upload slots follow this list."
                    : "Free: Meta + Google. Greyed platforms are Pro — tap Unlock or a Pro chip in Settings. Visible so you always know what unlocks."}
                </s-text>
                <div className="mcfly-spend-pick">
                  {ADVERTISE_PLATFORM_GROUPS.map((group) => {
                    const options = SPEND_ADVERTISE_PLATFORMS.filter(
                      (p) => p.group === group.id,
                    );
                    if (options.length === 0) return null;
                    const lockedInGroup = options.some(
                      (p) => !isPlatformSelectable(p.id),
                    );
                    return (
                      <div className="mcfly-spend-pick__group" key={group.id}>
                        <div className="mcfly-spend-pick__group-head">
                          <p className="mcfly-spend-pick__group-label">
                            {group.label}
                          </p>
                          {lockedInGroup && entitlements.showProTeaser ? (
                            <s-link href="/app/settings">Unlock on Pro</s-link>
                          ) : null}
                        </div>
                        <div
                          className="mcfly-spend-pick__grid"
                          role="group"
                          aria-label={group.label}
                        >
                          {options.map((platform) => {
                            const allowed = isPlatformSelectable(platform.id);
                            const checked =
                              allowed &&
                              selectedPlatformIds.includes(platform.id);
                            if (!allowed) {
                              return (
                                <a
                                  key={platform.id}
                                  href="/app/settings"
                                  className="mcfly-spend-pick__option mcfly-spend-pick__option--locked"
                                  aria-label={`${platform.title} — Pro. Unlock in Settings.`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={false}
                                    disabled
                                    tabIndex={-1}
                                    aria-hidden="true"
                                  />
                                  <span>{platform.title}</span>
                                  <span className="mcfly-spend-pick__pro">Pro</span>
                                </a>
                              );
                            }
                            return (
                              <label
                                key={platform.id}
                                className="mcfly-spend-pick__option"
                              >
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={() => togglePlatform(platform.id)}
                                  disabled={!platformsHydrated}
                                />
                                <span>{platform.title}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
                {platformsHydrated && selectedPlatforms.length === 0 ? (
                  <p className="mcfly-spend-pick__prompt">
                    Select at least one Free platform (Meta or Google) for a
                    tailored template — or paste any Day + columns CSV below.
                  </p>
                ) : null}
              </s-stack>
            </div>

            {selectedPlatforms.length === 0 ? (
              <>
                <div id="mcfly-spend-combine" className="mcfly-spend-flow__anchor-fallback" />
                <div id="mcfly-spend-template" className="mcfly-spend-flow__anchor-fallback" />
                <s-text tone="neutral">
                  Select platforms above for a tailored blank template — or use
                  the paste box at the top with any Day + columns CSV.
                </s-text>
              </>
            ) : (
              <>
                <div
                  id="mcfly-spend-template"
                  className="mcfly-panel mcfly-spend-flow__step"
                >
                  <s-stack direction="block" gap="base">
                    <div className="mcfly-spend-flow__head">
                      <s-heading>Get a tailored spreadsheet</s-heading>
                    </div>
                    <s-text tone="neutral">
                      One row = one day. Columns = your platforms. Fill from Ads
                      Manager, then paste or upload in step 1 above.
                    </s-text>
                    <div className="mcfly-spend-preview">
                      <p className="mcfly-spend-preview__legend">
                        <strong>{columnLegend}</strong>
                      </p>
                      <div className="mcfly-spend-preview__scroll">
                        <table className="mcfly-spend-preview__table">
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
                            {selectedTemplate.rows.map((row) => (
                              <tr key={row[0]}>
                                {row.map((cell, i) => (
                                  <td key={`${row[0]}-${i}`}>{cell}</td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                    <div className="mcfly-spend-flow__actions mcfly-template-actions">
                      <s-button href={selectedBlankTemplateHref} variant="primary">
                        Download blank
                      </s-button>
                      <s-button href={selectedExampleTemplateHref} variant="secondary">
                        Download example
                      </s-button>
                      <s-button
                        variant="tertiary"
                        onClick={openGoogleSheetsWithGuide}
                      >
                        Optional · fill in Sheets
                      </s-button>
                      <s-button href="#mcfly-spend-uploads" variant="tertiary">
                        Back to paste / upload
                      </s-button>
                    </div>
                  </s-stack>
                </div>

                <details
                  id="mcfly-spend-combine"
                  className="mcfly-details mcfly-spend-flow__combine"
                >
                  <summary>
                    Advanced · combine native Meta/Google exports
                  </summary>
                  <Form method="post" encType="multipart/form-data">
                    <input type="hidden" name="intent" value="csv-combine" />
                    <input
                      type="hidden"
                      name="confirm_replace"
                      value={confirmReplace ? "1" : "0"}
                    />
                    <s-stack direction="block" gap="base">
                      <s-text tone="neutral">
                        One file per selected platform (Day + Amount spent /
                        Cost). Each maps to its desk channel.
                      </s-text>
                      <div className="mcfly-spend-combine">
                        {selectedPlatforms.map((platform, i) => (
                          <div className="mcfly-spend-combine__row" key={platform.id}>
                            <input
                              type="hidden"
                              name={`platform_${i}`}
                              value={platform.id}
                            />
                            <input
                              type="hidden"
                              name={`channel_${i}`}
                              value={platform.engineChannel}
                            />
                            <div className="mcfly-spend-combine__channel">
                              <span className="mcfly-spend-combine__label">
                                Platform
                              </span>
                              <p className="mcfly-spend-combine__name">
                                {platform.title}
                              </p>
                            </div>
                            <div className="mcfly-spend-combine__file">
                              <s-drop-zone
                                label={`${platform.title} CSV`}
                                name={`file_${i}`}
                                accept=".csv,text/csv,application/vnd.ms-excel"
                                accessibilityLabel={`${platform.title} spend CSV`}
                                {...(isSubmitting &&
                                submittingIntent === "csv-combine"
                                  ? { disabled: true }
                                  : {})}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                      <s-button
                        type="submit"
                        variant="primary"
                        {...(isSubmitting && submittingIntent === "csv-combine"
                          ? { loading: true }
                          : {})}
                      >
                        Combine & import
                      </s-button>
                    </s-stack>
                  </Form>
                </details>

                <div className="mcfly-panel mcfly-spend-help">
                  <s-stack direction="block" gap="base">
                    <s-heading>Need help exporting your spend?</s-heading>
                    <label className="mcfly-spend-help__toggle">
                      <input
                        type="checkbox"
                        checked={showExportWalkthroughs}
                        onChange={(e) =>
                          setShowExportWalkthroughs(e.target.checked)
                        }
                      />
                      <span>Show export walkthroughs</span>
                    </label>
                    {showExportWalkthroughs ? (
                      <div className="mcfly-spend-guides">
                        {selectedPlatforms.map((guide, index) => (
                          <details
                            key={guide.id}
                            className="mcfly-details mcfly-spend-guide"
                            open={index === 0}
                          >
                            <summary>
                              {guide.title}
                              <span className="mcfly-spend-guide__hint">
                                {guide.productHint}
                              </span>
                            </summary>
                            <div className="mcfly-spend-guide__body">
                              <ol className="mcfly-spend-guide__steps">
                                {guide.steps.map((step) => (
                                  <li key={step}>{step}</li>
                                ))}
                              </ol>
                            </div>
                          </details>
                        ))}
                      </div>
                    ) : null}
                  </s-stack>
                </div>
              </>
            )}
              </div>
            </details>
          </s-stack>
        </div>
      </s-section>

      {!shotMode ? (
        <div className="mcfly-spend-secondary">
          <details
            className={[
              "mcfly-details",
              "mcfly-spend-secondary__details",
              sheetsGuideHighlight ? "mcfly-spend-sheets--focus" : null,
            ]
              .filter(Boolean)
              .join(" ")}
            id="mcfly-spend-sheets"
          >
            <summary>Optional · fill the same template in Sheets</summary>
            <div className="mcfly-spend-secondary__body">
              <div
                className={[
                  "mcfly-panel",
                  "mcfly-spend-sheets",
                  sheetsGuideHighlight ? "mcfly-spend-sheets--focus" : null,
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                <s-stack direction="block" gap="base">
                  <s-text tone="neutral">
                    Same Free CSV story — Sheets is only an editor. Download the
                    blank template, fill daily amounts, download .csv, then paste
                    in step 3. Mcfly does not pull your Sheet live yet (no fake
                    “Works with” claim).
                  </s-text>
                  {selectedPlatforms.length > 0 ? (
                    <div
                      className="mcfly-spend-sheets__platforms"
                      aria-live="polite"
                    >
                      <s-text type="strong">Selected platforms</s-text>
                      <ul className="mcfly-spend-sheets__chips">
                        {selectedPlatforms.map((p) => (
                          <li key={p.id} className="mcfly-spend-sheets__chip">
                            {p.title}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                  <div className="mcfly-template-actions mcfly-spend-template-primary">
                    <s-button href={selectedBlankTemplateHref} variant="primary">
                      Download blank template
                    </s-button>
                    <s-button
                      variant="secondary"
                      onClick={openGoogleSheetsWithGuide}
                    >
                      Open blank Google Sheet
                    </s-button>
                    <s-button
                      href={selectedExampleTemplateHref}
                      variant="tertiary"
                    >
                      Download example
                    </s-button>
                  </div>
                  <ol
                    className="mcfly-spend-sheets__steps"
                    aria-label="Sheets hand-fill steps"
                    tabIndex={-1}
                    ref={sheetsGuideRef}
                  >
                    {[
                      `Keep platforms checked above: ${
                        selectedPlatforms.length > 0
                          ? selectedPlatforms.map((p) => p.title).join(", ")
                          : "Meta + Google"
                      }.`,
                      "Download the Mcfly blank template (button above).",
                      "In Sheets: File → Import → Upload → your CSV → Replace spreadsheet → Import data.",
                      "Fill daily spend by hand in the Day + platform columns.",
                      "File → Download → Comma Separated Values (.csv) → paste or upload in step 3.",
                    ].map((step, i) => (
                      <li key={i}>
                        <span
                          className="mcfly-spend-sheets__step-n"
                          aria-hidden="true"
                        >
                          {i + 1}
                        </span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ol>
                  <s-text tone="neutral">{sheetsGuide.tip}</s-text>

                  <details
                    className="mcfly-details mcfly-spend-sheets__automate"
                    id="mcfly-spend-automate"
                  >
                    <summary>
                      Optional · automate fills (you pay the pipe tool)
                    </summary>
                    <s-stack direction="block" gap="base">
                      <s-text tone="neutral">
                        Want hands-off Meta / Google / other Ads Manager
                        refreshes? Pay SyncWith, Coupler, Supermetrics,
                        Coefficient, or similar yourself — they own OAuth and
                        breakage; Mcfly does not. Map their export to Mcfly
                        columns (pipe templates below), download CSV, then{" "}
                        <s-link href="#mcfly-spend-uploads">
                          paste or upload
                        </s-link>
                        . Mcfly never sells those connectors and never requires
                        them — select platforms here, upload daily spend, and
                        Mcfly pulls Shopify sales.
                      </s-text>
                      {!entitlements.canUseAllChannels ? (
                        <s-text tone="neutral">
                          Free desk: Meta + Google CSV. Pro ($39/mo) unlocks
                          more Mcfly channels — pipe tools stay merchant-paid and
                          separate from Mcfly Billing.
                        </s-text>
                      ) : (
                        <s-text tone="neutral">
                          Pro unlocks every Mcfly channel. Pipe vendors stay
                          merchant-paid — Mcfly Billing never covers SyncWith-class
                          connectors.
                        </s-text>
                      )}
                      <div className="mcfly-template-actions mcfly-spend-template-primary">
                        <s-button
                          href="/app/spend/template?pipe=long&blank=1"
                          variant="secondary"
                        >
                          Pipe template (long blank)
                        </s-button>
                        <s-button
                          href="/app/spend/template?pipe=long&example=1"
                          variant="tertiary"
                        >
                          Long example
                        </s-button>
                        <s-button
                          href="/app/spend/template?pipe=wide&blank=1"
                          variant="tertiary"
                        >
                          Wide blank
                        </s-button>
                      </div>
                      <s-text tone="neutral">
                        Nominative tool names only — no partnership logos, no
                        “Works with” badges. Finish on{" "}
                        <s-link href="#mcfly-spend-uploads">
                          Add your spend numbers
                        </s-link>
                        .
                      </s-text>
                    </s-stack>
                  </details>
                </s-stack>
              </div>
            </div>
          </details>
        </div>
      ) : null}

      {/* First-class · Spread a lump bill across days (same weight as template/combine) */}
      <div
        id="mcfly-spend-bill-daily"
        className="mcfly-panel mcfly-spend-flow__step mcfly-spend-bill"
      >
        <s-stack direction="block" gap="base">
          <div className="mcfly-spend-flow__head">
            <span
              className="mcfly-spend-flow__n mcfly-spend-flow__n--or"
              aria-hidden="true"
            >
              or
            </span>
            <s-heading>Spread a lump bill across days</s-heading>
          </div>
          <s-text tone="neutral">
            Monthly, quarterly, bi-annual, or annual email/agency bills? Spread
            evenly across days so Total ROAS stays honest. One channel per
            bill — Preview → Apply to desk (same day-level upsert as CSV) or
            download date,channel,amount CSV.
          </s-text>

          <Form method="post" className="mcfly-spend-bill__panel">
            <input type="hidden" name="intent" value="bill-daily" />
            <s-stack direction="block" gap="base">
              <div className="mcfly-spend-bill__grid">
                <label className="mcfly-spend-bill__field mcfly-spend-bill__field--wide">
                  <s-text>Channel / platform</s-text>
                  <select
                    className="mcfly-field"
                    name="channel"
                    value={billChannel}
                    onChange={(e) => {
                      setBillChannel(e.target.value as SpendChannel);
                      setBillPreview(null);
                    }}
                    disabled={isSubmitting && submittingIntent === "bill-daily"}
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
                    <s-text>What do you call it?</s-text>
                    <input
                      className="mcfly-field"
                      name="customName"
                      type="text"
                      required
                      maxLength={80}
                      value={billCustomName}
                      onChange={(e) => setBillCustomName(e.target.value)}
                      placeholder="e.g. Agency retainer"
                      disabled={
                        isSubmitting && submittingIntent === "bill-daily"
                      }
                    />
                  </label>
                ) : null}

                <label className="mcfly-spend-bill__field">
                  <s-text>Period</s-text>
                  <select
                    className="mcfly-field"
                    name="periodType"
                    value={billPeriodType}
                    onChange={(e) => {
                      setBillPeriodType(e.target.value as PeriodWindowType);
                      setBillPreview(null);
                    }}
                    disabled={isSubmitting && submittingIntent === "bill-daily"}
                  >
                    <option value="month">Month</option>
                    <option value="quarter">Quarter</option>
                    <option value="half_year">Bi-annual (6 mo)</option>
                    <option value="year">Year</option>
                  </select>
                </label>

                <label className="mcfly-spend-bill__field">
                  <s-text>Amount (USD)</s-text>
                  <input
                    className="mcfly-field"
                    name="amount"
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    placeholder="450"
                    value={billAmount}
                    onChange={(e) => {
                      setBillAmount(e.target.value);
                      setBillPreview(null);
                    }}
                    disabled={isSubmitting && submittingIntent === "bill-daily"}
                  />
                </label>

                <label className="mcfly-spend-bill__field">
                  <s-text>Anchor month</s-text>
                  <input
                    className="mcfly-field"
                    name="anchor"
                    type="month"
                    required
                    value={billAnchor}
                    onChange={(e) => {
                      setBillAnchor(e.target.value);
                      setBillPreview(null);
                    }}
                    disabled={isSubmitting && submittingIntent === "bill-daily"}
                  />
                </label>
              </div>

              <s-text tone="neutral">
                Anchor picks the calendar month, quarter, half-year (H1/H2), or
                year that contains that month. Equal daily split — last day
                absorbs leftover cents so the total matches the invoice.
              </s-text>

              {billPreviewError ? (
                <s-text tone="critical">{billPreviewError}</s-text>
              ) : null}

              {billPreview ? (
                <div className="mcfly-spend-bill__preview" aria-live="polite">
                  <p className="mcfly-spend-bill__preview-title">Preview</p>
                  <div className="mcfly-metrics mcfly-spend-bill__metrics">
                    <div className="mcfly-metric mcfly-metric--compact">
                      <p className="mcfly-metric__label">Daily × days</p>
                      <p className="mcfly-metric__value">
                        {formatCurrency(billPreview.dailyAmount)} ×{" "}
                        {billPreview.dayCount}
                      </p>
                      <p className="mcfly-metric__hint">
                        = {formatCurrency(billPreview.totalAllocated)}
                      </p>
                    </div>
                    <div className="mcfly-metric mcfly-metric--compact">
                      <p className="mcfly-metric__label">Period</p>
                      <p className="mcfly-metric__value mcfly-spend-bill__period">
                        {billPreview.startDateYmd} → {billPreview.endDateYmd}
                      </p>
                      <p className="mcfly-metric__hint">
                        {SPEND_CHANNEL_LABELS[
                          billPreview.channel as SpendChannel
                        ] ?? billPreview.channel}
                      </p>
                    </div>
                  </div>
                </div>
              ) : null}

              <div className="mcfly-spend-bill__actions">
                <s-button type="button" onClick={runBillPreview}>
                  Preview
                </s-button>
                <s-button type="button" onClick={downloadBillCsv}>
                  Download CSV
                </s-button>
                <s-button
                  type="submit"
                  variant="primary"
                  {...(isSubmitting && submittingIntent === "bill-daily"
                    ? { loading: true }
                    : {})}
                >
                  Apply to desk
                </s-button>
              </div>
            </s-stack>
          </Form>
        </s-stack>
      </div>

      {/* Secondary · Advanced: one-line + full template */}
      <div className="mcfly-spend-secondary">
        <details className="mcfly-details mcfly-spend-secondary__details">
          <summary>Advanced — more ways to add spend</summary>
          <div className="mcfly-spend-secondary__body">
            <details className="mcfly-details mcfly-spend-secondary__details">
              <summary>Or enter one line</summary>
              <div className="mcfly-spend-secondary__body">
                <Form method="post">
                  <input type="hidden" name="intent" value="manual" />
                  <s-stack direction="block" gap="base">
                    <s-text tone="neutral">
                      Same as{" "}
                      <s-link href="#mcfly-spend-add">Add spend</s-link> above —
                      handy if you scrolled past it. Prefer the Day + columns
                      template for {PRODUCT_NOUN.totalRoas}.
                    </s-text>
                    <label>
                      <s-text>Where did you spend?</s-text>
                      <select
                        className="mcfly-field"
                        name="channel"
                        defaultValue="meta"
                      >
                        {addSpendChannels.map(({ value, label, disabled }) => (
                          <option
                            key={value}
                            value={value}
                            disabled={disabled}
                          >
                            {label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      <s-text>
                        Name (required for Something else)
                      </s-text>
                      <input
                        className="mcfly-field"
                        name="customName"
                        type="text"
                        maxLength={80}
                        placeholder="e.g. Influencers, Podcast, Agency"
                      />
                    </label>
                    <label>
                      <s-text>Amount (USD)</s-text>
                      <input
                        className="mcfly-field"
                        name="amount"
                        type="number"
                        step="0.01"
                        min="0"
                        required
                        placeholder="5000"
                      />
                    </label>
                    <label>
                      <s-text>Period</s-text>
                      <select
                        className="mcfly-field"
                        name="period"
                        defaultValue="mtd"
                      >
                        <option value="mtd">Month to date</option>
                        <option value="qtd">Quarter to date</option>
                        <option value="ytd">Year to date</option>
                      </select>
                    </label>
                    <s-button
                      type="submit"
                      variant="primary"
                      {...(isSubmitting && submittingIntent === "manual"
                        ? { loading: true }
                        : {})}
                    >
                      {isEmpty
                        ? `Save spend · ${PRODUCT_NOUN.openTotalRoas}`
                        : "Save spend"}
                    </s-button>
                  </s-stack>
                </Form>
              </div>
            </details>

            <details
              className="mcfly-details mcfly-spend-secondary__details"
              id="mcfly-spend-csv"
            >
              <summary>
                {entitlements.canUseAllChannels
                  ? "Full wide template (every channel)"
                  : "Free template (Meta + Google + Other)"}
              </summary>
              <div className="mcfly-spend-secondary__body">
                <s-stack direction="block" gap="base">
                  <s-text tone="neutral">
                    {entitlements.canUseAllChannels
                      ? "All Mcfly channel columns at once. The selected-platform template above is usually enough."
                      : "Free columns: Meta, Google, and Other (name custom spend on Add spend). TikTok, Amazon, and other named platforms unlock on Pro. The selected-platform template above is usually enough."}
                  </s-text>
                  <div className="mcfly-template-actions mcfly-spend-template-primary">
                    <s-button
                      onClick={() =>
                        downloadCsvFile(
                          csvBlank,
                          entitlements.canUseAllChannels
                            ? "mcfly-spend-template-blank.csv"
                            : "mcfly-spend-free-blank.csv",
                        )
                      }
                    >
                      Download blank (14 days)
                    </s-button>
                    <s-button
                      onClick={() =>
                        downloadCsvFile(
                          csvSample,
                          entitlements.canUseAllChannels
                            ? "mcfly-spend-template.csv"
                            : "mcfly-spend-free-example.csv",
                        )
                      }
                    >
                      Filled example
                    </s-button>
                  </div>
                  <p className="mcfly-spend-fallback">
                    Direct links:{" "}
                    <s-link href={blankTemplateHref}>blank</s-link> ·{" "}
                    <s-link href={exampleTemplateHref}>example</s-link>
                  </p>
                  <p
                    className="mcfly-template-headers"
                    aria-label="Template columns"
                  >
                    {entitlements.canUseAllChannels
                      ? WIDE_TEMPLATE_HEADERS.join(" · ")
                      : ["Day", "Meta Ads", "Google Ads"].join(" · ")}
                  </p>
                  <details className="mcfly-details">
                    <summary>Column guide</summary>
                    <div className="mcfly-col-grid">
                      {WIDE_TEMPLATE_COLUMNS.filter(
                        (c) =>
                          c.channel !== "day" &&
                          (entitlements.canUseAllChannels ||
                            entitlements.allowedChannels.includes(
                              c.channel as SpendChannel,
                            )),
                      ).map((col) => (
                        <div className="mcfly-col-card" key={col.header}>
                          <p className="mcfly-col-card__name">{col.header}</p>
                          <p className="mcfly-col-card__help">{col.help}</p>
                        </div>
                      ))}
                    </div>
                  </details>
                </s-stack>
              </div>
            </details>
          </div>
        </details>
      </div>

      <details className="mcfly-details mcfly-spend-recon-details">
        <summary>
          Advanced — Match Ads Manager total (optional) · ±{spendRecon.thresholdPct}%
        </summary>
        <s-stack direction="block" gap="base">
          <s-text tone="neutral">
            Paste the Ads Manager spend total for {periodLabel}. Mcfly flags desk
            CSV vs that number when they drift more than ±{spendRecon.thresholdPct}
            %.
          </s-text>
          {spendRecon.status !== "none" ? (
            <s-banner
              tone={spendRecon.status === "drift" ? "warning" : "success"}
              heading={
                spendRecon.status === "drift"
                  ? "Spend doesn’t match Ads Manager"
                  : "Spend matches Ads Manager"
              }
            >
              <s-paragraph>
                {formatSpendReconLine(spendRecon)}. Desk{" "}
                {formatCurrency(periodSpendTotal)}
                {declaredAdsSpend != null
                  ? ` · declared ${formatCurrency(declaredAdsSpend)}`
                  : ""}
                .
              </s-paragraph>
            </s-banner>
          ) : null}
          <Form method="post" className="mcfly-spend-recon-form">
            <input type="hidden" name="intent" value="declare-recon" />
            <input type="hidden" name="period" value={preset} />
            <s-stack direction="inline" gap="base">
              <label className="mcfly-settings-field__label">
                Declared Ads Manager total · {periodLabel}
                <input
                  className="mcfly-field mcfly-settings-field__input"
                  name="declaredAdsSpend"
                  type="number"
                  min={0}
                  step={0.01}
                  inputMode="decimal"
                  autoComplete="off"
                  defaultValue={
                    declaredAdsSpend != null ? String(declaredAdsSpend) : ""
                  }
                />
              </label>
              <s-button
                type="submit"
                variant="secondary"
                {...(isSubmitting && submittingIntent === "declare-recon"
                  ? { loading: true }
                  : {})}
              >
                Save declared total
              </s-button>
            </s-stack>
          </Form>
        </s-stack>
      </details>

      <s-section heading="Recent entries">
        {isEmpty ? (
          <div className="mcfly-spend-empty">
            <s-box padding="large" background="subdued" borderRadius="base">
              <s-stack direction="block" gap="base" alignItems="center">
                <s-heading>Add your first spend</s-heading>
                <s-paragraph>
                  <s-text tone="neutral">
                    Use Add spend above — Meta, Google, or Something else you
                    name. Mcfly pulls Shopify net sales for{" "}
                    {PRODUCT_NOUN.totalRoas}.
                  </s-text>
                </s-paragraph>
                <div className="mcfly-spend-empty__actions">
                  <s-button href="#mcfly-spend-add" variant="primary">
                    Add spend
                  </s-button>
                  <s-button href="#mcfly-spend-platforms" variant="secondary">
                    Platforms for CSV
                  </s-button>
                </div>
              </s-stack>
            </s-box>
          </div>
        ) : (
          <s-stack direction="block" gap="small">
            {entries.map((entry) => (
              <div className="mcfly-spend-row" key={entry.id}>
                <span
                  className={`mcfly-spend-dot mcfly-spend-dot--${entry.channel}`}
                  aria-hidden="true"
                />
                <span className="mcfly-spend-row__channel">
                  {formatSpendEntryChannelLabel(entry.channel, entry.note)}
                </span>
                <span className="mcfly-spend-row__amount">
                  {formatCurrency(entry.amount)}
                </span>
                <span className="mcfly-spend-row__range">
                  {formatDayRange(entry.periodStart, entry.periodEnd)}
                </span>
                {entry.source === "csv" ? (
                  <span className="mcfly-spend-badge">CSV</span>
                ) : null}
                {entry.channel !== "other" && entry.note ? (
                  <span className="mcfly-spend-row__note">{entry.note}</span>
                ) : null}
              </div>
            ))}
            <s-paragraph>
              <s-text tone="neutral">
                When channels look complete,{" "}
                <s-link href="/app">{PRODUCT_NOUN.openTotalRoas}</s-link>.
              </s-text>
            </s-paragraph>
          </s-stack>
        )}
      </s-section>

      <s-section slot="aside" heading="Weekly ritual">
        <div className="mcfly-aside-card">
          <p className="mcfly-aside-card__title">
            Settings → Spend → {PRODUCT_NOUN.deskTitle}
          </p>
          <p>
            Confirm margin, log daily spend, then open {PRODUCT_NOUN.totalRoas}.{" "}
            {PRODUCT_NOUN.definitionForPeriod}. CSV aggregates only — no
            ad-platform login inside the app.
          </p>
        </div>
      </s-section>
      </div>
    </s-page>
  );
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
