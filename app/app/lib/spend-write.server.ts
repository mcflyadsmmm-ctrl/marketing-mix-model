import {
  aggregateSpendRows,
  parseSpendCsv,
  parseForceChannel,
  assertSpendCsvLimits,
  SPEND_CSV_MAX_BYTES,
  SPEND_CSV_TOO_LARGE,
  type CsvChannel,
  type CsvImportSummary,
} from "./spend-csv";
import { isSpendChannel } from "./spend-billing";
import {
  isPeriodWindowType,
  planCustomLumpSpread,
  planLumpSpread,
} from "./spend-period-allocate";
import { createSpendRepository, previewSpendUpsert } from "./spend-repository.server";
import {
  salesDayFactWindowStartUtc,
  SALES_DAY_FACT_WINDOW_YEARS_BACK,
} from "./sales-facts.server";
import { slugCustomChannelName } from "./spend-custom-channel";
import {
  assertChannelsAllowed,
  canUseChannel,
  type ShopEntitlements,
} from "./entitlements.server";
import { PRO_UPSELL } from "./entitlements";
import { roundMoney, shopCurrencyCode } from "./spend-money";
import prisma from "../db.server";

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

export function salesWindowWarningForDates(dates: string[]): string | null {
  if (dates.length === 0) return null;
  const floor = salesDayFactWindowStartUtc();
  const floorKey = floor.toISOString().slice(0, 10);
  const oldest = [...dates].sort()[0];
  if (oldest < floorKey) {
    return `Some spend days start before ${floorKey} (Jan 1, ${SALES_DAY_FACT_WINDOW_YEARS_BACK} years back). Shopify sales history for Total ROAS only goes back to that date — older spend won’t have matching sales.`;
  }
  return null;
}

export async function persistAggregatedSpend(
  shopId: string,
  parsed: Awaited<ReturnType<typeof parseSpendCsv>>,
  emptyMessage: string,
  entitlements: ShopEntitlements,
  opts?: { confirmReplace?: boolean; currency?: string },
): Promise<SpendActionData> {
  const currency = shopCurrencyCode(opts?.currency);
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
    amount: roundMoney(row.amount),
    currency,
    source: "csv" as const,
    customKey: row.customKey,
    note: row.customLabel,
  }));

  const dates = aggregated.map((r) => r.date).sort();
  const channels = Array.from(new Set(aggregated.map((r) => r.channel))) as CsvChannel[];
  const customChannelLabels = Array.from(
    new Set(
      aggregated
        .filter((r) => r.channel === "other" && r.customLabel?.trim())
        .map((r) => r.customLabel!.trim()),
    ),
  );
  const totalAmount = roundMoney(
    aggregated.reduce((sum, r) => sum + r.amount, 0),
  );
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

function fileExceedsSpendCsvMax(value: FormDataEntryValue | null): boolean {
  return fileLike(value) && Number(value.size) > SPEND_CSV_MAX_BYTES;
}

export async function handleCsvImport(
  shopId: string,
  form: FormData,
  entitlements: ShopEntitlements,
  currency: string,
): Promise<SpendActionData> {
  const fileField = form.get("file");
  if (fileExceedsSpendCsvMax(fileField)) {
    return { error: SPEND_CSV_TOO_LARGE, success: false };
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
    { confirmReplace, currency },
  );
}

export async function handleBillDaily(
  shopId: string,
  form: FormData,
  entitlements: ShopEntitlements,
  currency: string,
): Promise<SpendActionData> {
  const amount = parseFloat(String(form.get("amount") ?? ""));
  const periodTypeRaw = String(form.get("periodType") ?? "month");
  const anchor = String(form.get("anchor") ?? "").trim();
  const customFrom = String(form.get("customFrom") ?? "").trim();
  const customTo = String(form.get("customTo") ?? "").trim();
  const channelRaw = String(form.get("channel") ?? "");
  const customName = String(form.get("customName") ?? "").trim();

  if (periodTypeRaw !== "custom" && !isPeriodWindowType(periodTypeRaw)) {
    return {
      error: "Pick when this spend happened.",
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
    return { error: "Name this channel (e.g. Influencers).", success: false };
  }

  const planned =
    periodTypeRaw === "custom"
      ? planCustomLumpSpread({
          totalAmount: amount,
          startDateYmd: customFrom,
          endDateYmd: customTo,
          channel: channelRaw,
        })
      : planLumpSpread({
          totalAmount: amount,
          periodType: periodTypeRaw,
          anchor,
          channel: channelRaw,
        });
  if (!planned.ok) {
    return { error: planned.error, success: false };
  }

  const { plan } = planned;
  const channel = channelRaw;
  const shopCurrency = shopCurrencyCode(currency);
  const repository = createSpendRepository();
  const result = await repository.upsertSpendDays(
    shopId,
    plan.days.map((day) => ({
      date: day.date,
      channel,
      amount: roundMoney(day.amount),
      currency: shopCurrency,
      source: "manual" as const,
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

export async function deleteSpendEntry(opts: {
  shopId: string;
  entryId: string;
}): Promise<SpendActionData> {
  const entry = await prisma.spendEntry.findFirst({
    where: { id: opts.entryId, shopId: opts.shopId },
    select: { id: true, source: true },
  });
  if (!entry) {
    return { error: "That spend row is gone.", success: false };
  }
  await prisma.spendEntry.delete({ where: { id: entry.id } });
  return { error: null, success: true };
}
