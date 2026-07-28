import { useEffect, useMemo, useState } from "react";
import type {
  ActionFunctionArgs,
  HeadersFunction,
  LoaderFunctionArgs,
} from "react-router";
import { Form, useActionData, useLoaderData, useNavigation } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import { ensureShop } from "../lib/mer-dashboard.server";
import { resolvePeriod, type PeriodPreset } from "../lib/periods";
import {
  aggregateSpendRows,
  combineSpendCsvInputs,
  parseSpendCsv,
  WIDE_TEMPLATE_COLUMNS,
  WIDE_TEMPLATE_HEADERS,
  WIDE_TEMPLATE_SAMPLE,
  buildBlankSpendTemplate,
  buildBlankSpendTemplateForDates,
  buildSelectedPlatformTemplateCsv,
  groupCsvErrors,
  type CsvChannel,
  type CsvImportSummary,
  type GroupedCsvErrors,
} from "../lib/spend-csv";
import {
  billDailyFilename,
  buildBillDailyWideCsv,
  firstOfCurrentMonth,
  isBillCadence,
  isBillDayBasis,
  isSpendChannel,
  planBillDaily,
  type BillCadence,
  type BillDailyPlan,
  type BillDayBasis,
} from "../lib/spend-billing";
import {
  ADVERTISE_PLATFORM_GROUPS,
  SPEND_ADVERTISE_PLATFORMS,
  filterAdvertisePlatforms,
  getAdvertisePlatform,
  isAdvertisePlatformId,
  type SpendAdvertisePlatformId,
} from "../lib/spend-export-guides";
import { createSpendRepository } from "../lib/spend-repository.server";
import { getSampleDeskStats, localDayKey } from "../lib/sample-desk.server";
import { formatCurrency } from "../lib/mer-format";
import { PRODUCT_NOUN } from "../lib/product-labels";
import prisma from "../db.server";
import {
  SPEND_CHANNELS,
  SPEND_CHANNEL_LABELS,
  type SpendChannel,
} from "@mcfly/mer-engine";

const MAX_COMBINE_SLOTS = 20;
/** localStorage key — JSON array of SpendAdvertisePlatformId */
const PLATFORM_STORAGE_KEY = "mcfly-spend-platforms";

/** Last N local calendar days for the CSV hole strip (within 14–31). */
const SPEND_COVERAGE_DAYS = 28;

const CHANNELS = SPEND_CHANNELS.map((value) => ({
  value,
  label: SPEND_CHANNEL_LABELS[value],
  hint:
    value === "other"
      ? "Influencers, podcasts, agencies, print, and anything else paid to advertise."
      : `${SPEND_CHANNEL_LABELS[value]} — daily spend CSV or manual total.`,
}));

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
  const sampleDesk = await getSampleDeskStats(shop.id);
  // Real entries only — sample-desk rows are demo data and would drown out
  // an operator's own uploads in "Recent entries" (sample dates run through today).
  const [entries, dayCoverage] = await Promise.all([
    prisma.spendEntry.findMany({
      where: { shopId: shop.id, source: { not: "sample" } },
      orderBy: { periodStart: "desc" },
      take: 20,
    }),
    // Sample desk ON → coverage may include sample spend days; OFF → real only.
    loadSpendDayCoverage(shop.id, sampleDesk.enabled),
  ]);
  return {
    entries,
    sampleDesk,
    shotMode,
    dayCoverage,
  };
};

export interface SpendActionData {
  error: string | null;
  success: boolean;
  csv?: CsvImportSummary;
}

async function persistAggregatedSpend(
  shopId: string,
  parsed: Awaited<ReturnType<typeof parseSpendCsv>>,
  emptyMessage: string,
): Promise<SpendActionData> {
  const aggregated = aggregateSpendRows(parsed.rows);

  if (aggregated.length === 0) {
    return {
      error: parsed.errors[0] ?? emptyMessage,
      success: false,
      csv: {
        written: 0,
        skipped: 0,
        days: 0,
        channels: [],
        dateRange: null,
        totalAmount: 0,
        errors: parsed.errors,
        totalDataRows: parsed.totalDataRows,
      },
    };
  }

  const repository = createSpendRepository();
  const result = await repository.upsertSpendDays(
    shopId,
    aggregated.map((row) => ({
      date: row.date,
      channel: row.channel,
      amount: row.amount,
      currency: "USD",
      source: "csv" as const,
    })),
  );

  const dates = aggregated.map((r) => r.date).sort();
  const channels = Array.from(new Set(aggregated.map((r) => r.channel))) as CsvChannel[];
  const totalAmount = aggregated.reduce((sum, r) => sum + r.amount, 0);

  return {
    error: null,
    success: true,
    csv: {
      written: result.written,
      skipped: result.skipped,
      days: new Set(dates).size,
      channels,
      dateRange: dates.length ? { start: dates[0], end: dates[dates.length - 1] } : null,
      totalAmount,
      errors: parsed.errors,
      totalDataRows: parsed.totalDataRows,
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

async function handleCsvImport(
  shopId: string,
  form: FormData,
): Promise<SpendActionData> {
  let text = await readFormFileText(form.get("file"));
  if (!text.trim()) {
    text = String(form.get("csv") ?? "");
  }
  if (!text.trim()) {
    return { error: "Choose a CSV file or paste rows before importing.", success: false };
  }

  return persistAggregatedSpend(
    shopId,
    parseSpendCsv(text),
    "No valid spend rows found. Use platform exports with Combine & import, the Mcfly template (Day + channel columns), or date,channel,amount rows. This file is ad spend only — sales stay in Shopify.",
  );
}

async function handleCsvCombine(
  shopId: string,
  form: FormData,
): Promise<SpendActionData> {
  const inputs: { text: string; forceChannel?: CsvChannel; label?: string }[] = [];

  for (let i = 0; i < MAX_COMBINE_SLOTS; i++) {
    const text = await readFormFileText(form.get(`file_${i}`));
    if (!text.trim()) continue;
    const channelRaw = String(form.get(`channel_${i}`) ?? "");
    if (!(SPEND_CHANNELS as readonly string[]).includes(channelRaw)) {
      return {
        error: `Pick a valid channel for upload slot ${i + 1}.`,
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
  );
}

async function handleBillDaily(
  shopId: string,
  form: FormData,
): Promise<SpendActionData> {
  const amount = parseFloat(String(form.get("amount") ?? ""));
  const cadenceRaw = String(form.get("cadence") ?? "month");
  const dayBasisRaw = String(form.get("dayBasis") ?? "calendar");
  const startDate = String(form.get("startDate") ?? "").trim();
  const channelRaw = String(form.get("channel") ?? "");

  if (!isBillCadence(cadenceRaw)) {
    return { error: "Pick a cadence: month, quarter, or year.", success: false };
  }
  if (!isBillDayBasis(dayBasisRaw)) {
    return { error: "Pick a day basis: calendar or fixed.", success: false };
  }
  if (!isSpendChannel(channelRaw)) {
    return { error: "Pick a valid spend channel.", success: false };
  }

  const planned = planBillDaily({
    amount,
    cadence: cadenceRaw,
    dayBasis: dayBasisRaw,
    startDate,
    channel: channelRaw,
  });
  if (!planned.ok) {
    return { error: planned.error, success: false };
  }

  const { plan } = planned;
  const repository = createSpendRepository();
  const result = await repository.upsertSpendDays(
    shopId,
    plan.days.map((day) => ({
      date: day.date,
      channel: plan.channel,
      amount: day.amount,
      currency: "USD",
      source: "csv" as const,
    })),
  );

  return {
    error: null,
    success: true,
    csv: {
      written: result.written,
      skipped: result.skipped,
      days: plan.dayCount,
      channels: [plan.channel],
      dateRange: { start: plan.startDate, end: plan.endDate },
      totalAmount: plan.totalAllocated,
      errors: [],
      totalDataRows: plan.dayCount,
    },
  };
}

function readStoredPlatforms(): SpendAdvertisePlatformId[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(PLATFORM_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (id): id is SpendAdvertisePlatformId =>
        typeof id === "string" && isAdvertisePlatformId(id),
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

  if (intent === "csv") {
    return handleCsvImport(shop.id, form);
  }

  if (intent === "csv-combine") {
    return handleCsvCombine(shop.id, form);
  }

  if (intent === "bill-daily") {
    return handleBillDaily(shop.id, form);
  }

  const channel = String(form.get("channel") ?? "other");
  const amount = parseFloat(String(form.get("amount") ?? "0"));
  const period = (String(form.get("period") ?? "mtd") as PeriodPreset) || "mtd";
  const note = String(form.get("note") ?? "").trim() || null;

  if (!(SPEND_CHANNELS as readonly string[]).includes(channel)) {
    return { error: "Invalid channel", success: false };
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

const CSV_SAMPLE = WIDE_TEMPLATE_SAMPLE.trim();
const CSV_BLANK = buildBlankSpendTemplate(14).trim();

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
  const { entries, sampleDesk, shotMode, dayCoverage } =
    useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";
  const submittingIntent =
    navigation.formData?.get("intent")?.toString() ?? null;
  const isEmpty = entries.length === 0;
  const csv = actionData?.csv;
  const csvSaved = Boolean(actionData?.success && csv);
  const manualSaved = Boolean(actionData?.success && !csv);
  const holeCount = dayCoverage.total - dayCoverage.filledCount;
  const missingDates = dayCoverage.days
    .filter((d) => !d.filled)
    .map((d) => d.dateKey);
  const missingDatesPreview = missingDates.slice(0, 8);
  const missingDatesCsv = buildBlankSpendTemplateForDates(missingDates).trim();
  const missingDatesHref =
    missingDates.length > 0
      ? `/app/spend/template?dates=${encodeURIComponent(missingDates.slice(0, 62).join(","))}`
      : "/app/spend/template?blank=1";
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
  >([]);
  const [platformsHydrated, setPlatformsHydrated] = useState(false);
  const [showExportWalkthroughs, setShowExportWalkthroughs] = useState(false);
  const [billAmount, setBillAmount] = useState("");
  const [billCadence, setBillCadence] = useState<BillCadence>("month");
  const [billDayBasis, setBillDayBasis] = useState<BillDayBasis>("calendar");
  const [billStartDate, setBillStartDate] = useState(() => firstOfCurrentMonth());
  const [billChannel, setBillChannel] = useState<SpendChannel>("email");
  const [billPreview, setBillPreview] = useState<BillDailyPlan | null>(null);
  const [billPreviewError, setBillPreviewError] = useState<string | null>(null);

  useEffect(() => {
    setSelectedPlatformIds(readStoredPlatforms());
    setPlatformsHydrated(true);
  }, []);

  function runBillPreview() {
    const amount = parseFloat(billAmount);
    const result = planBillDaily({
      amount,
      cadence: billCadence,
      dayBasis: billDayBasis,
      startDate: billStartDate,
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
    const result = planBillDaily({
      amount,
      cadence: billCadence,
      dayBasis: billDayBasis,
      startDate: billStartDate,
      channel: billChannel,
    });
    if (!result.ok) {
      setBillPreview(null);
      setBillPreviewError(result.error);
      return;
    }
    setBillPreviewError(null);
    setBillPreview(result.plan);
    downloadCsvFile(buildBillDailyWideCsv(result.plan), billDailyFilename(result.plan));
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
      ),
    [selectedPlatforms],
  );

  function togglePlatform(id: SpendAdvertisePlatformId) {
    setSelectedPlatformIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  return (
    <s-page heading="Spend" inlineSize="large">
      <div
        className={
          shotMode
            ? "mcfly-desk mcfly-desk--chrome mcfly-desk--shot"
            : "mcfly-desk mcfly-desk--chrome"
        }
      >
      {sampleDesk.enabled && !shotMode ? (
        <s-banner tone="warning" heading="Sample desk is on — not live Shopify">
          <s-paragraph>
            Recent entries below show your own uploads only — the 3-year demo dataset
            ({sampleDesk.spendCount.toLocaleString()} sample rows) is kept out of this list so it is
            never mistaken for real spend. Day coverage and {PRODUCT_NOUN.totalRoas} can still include
            sample days. Turn sample desk <strong>OFF</strong> on the{" "}
            <s-link href="/app/demo">Demo</s-link> tab before App Store review.{" "}
            <code>?shot=1</code> hides this banner only — metrics stay sample until OFF.
          </s-paragraph>
        </s-banner>
      ) : null}

      {isEmpty && !actionData?.success ? (
        <s-banner tone="info" heading="Add daily spend">
          <s-paragraph>
            Pick platforms → download the Day + columns template → upload.{" "}
            {PRODUCT_NOUN.definitionForPeriod}. No ad logins inside Mcfly.
          </s-paragraph>
        </s-banner>
      ) : null}

      {csvSaved && csv ? (
        <s-banner tone="success" heading={`Spend imported — next: ${PRODUCT_NOUN.totalRoas}`}>
          <div className="mcfly-metrics mcfly-spend-summary">
            <div className="mcfly-metric mcfly-metric--success mcfly-metric--compact">
              <p className="mcfly-metric__label">Rows written</p>
              <p className="mcfly-metric__value">{csv.written}</p>
              <p className="mcfly-metric__hint">
                {csv.totalDataRows > 0
                  ? `${csv.totalDataRows} data row${csv.totalDataRows === 1 ? "" : "s"} scanned`
                  : "from your CSV"}
                {csv.skipped > 0 ? ` · ${csv.skipped} already up to date` : ""}
              </p>
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
              <p className="mcfly-metric__label">Channels</p>
              <p className="mcfly-metric__value">{csv.channels.length}</p>
              <p className="mcfly-metric__hint">
                {csv.channels
                  .map((c) => SPEND_CHANNEL_LABELS[c as keyof typeof SPEND_CHANNEL_LABELS] ?? c)
                  .join(", ") || "—"}
              </p>
            </div>
            <div className="mcfly-metric mcfly-metric--compact">
              <p className="mcfly-metric__label">Total spend</p>
              <p className="mcfly-metric__value">{formatCurrency(csv.totalAmount)}</p>
            </div>
          </div>
          <div className="mcfly-spend-next">
            <s-button href="/app" variant="primary">
              {PRODUCT_NOUN.openTotalRoas}
            </s-button>
            <s-text tone="neutral">
              {PRODUCT_NOUN.definitionForPeriod}. Fill empty days below if the
              strip shows holes.
            </s-text>
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

      {actionData && !actionData.success && actionData.error ? (
        <s-banner tone="critical" heading="CSV needs a fix — sales data is fine">
          <s-paragraph>{actionData.error}</s-paragraph>
          {actionErrorGroups ? (
            <CsvErrorGroups grouped={actionErrorGroups} />
          ) : null}
          <s-paragraph>
            <s-text tone="neutral">
              Download the{" "}
              <s-link href="/app/spend/template?blank=1">blank template</s-link>, keep the header
              row, and re-import. This file is spend aggregates only — never paste sales here.
            </s-text>
          </s-paragraph>
        </s-banner>
      ) : null}

      <p className="mcfly-spend-lede">
        Log daily ad spend in three steps — then open {PRODUCT_NOUN.totalRoas}.{" "}
        {PRODUCT_NOUN.definitionForPeriod}.
      </p>
      <ol className="mcfly-spend-flow__toc" aria-label="Spend steps">
        <li>
          <strong>1</strong> Pick platforms
        </li>
        <li>
          <strong>2</strong> Fill / download template
        </li>
        <li>
          <strong>3</strong> Upload
        </li>
      </ol>

      <s-section heading="Add daily spend">
        <div id="mcfly-spend-exports" className="mcfly-spend-flow">
          <s-stack direction="block" gap="large">
            {/* 1 · Pick platforms */}
            <div className="mcfly-panel mcfly-spend-flow__step">
              <s-stack direction="block" gap="base">
                <div className="mcfly-spend-flow__head">
                  <span className="mcfly-spend-flow__n" aria-hidden="true">
                    1
                  </span>
                  <s-heading>Pick platforms you spend on</s-heading>
                </div>
                <s-text tone="neutral">
                  Check every place cash leaves for ads or paid marketing. Picks are saved in
                  this browser. No ad logins, pixels, or connectors inside Mcfly.
                </s-text>
                <div className="mcfly-spend-pick">
                  {ADVERTISE_PLATFORM_GROUPS.map((group) => {
                    const options = SPEND_ADVERTISE_PLATFORMS.filter(
                      (p) => p.group === group.id,
                    );
                    if (options.length === 0) return null;
                    return (
                      <div className="mcfly-spend-pick__group" key={group.id}>
                        <p className="mcfly-spend-pick__group-label">{group.label}</p>
                        <div
                          className="mcfly-spend-pick__grid"
                          role="group"
                          aria-label={group.label}
                        >
                          {options.map((platform) => {
                            const checked = selectedPlatformIds.includes(platform.id);
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
                    Select at least one platform to see your Day + columns template and upload
                    slots.
                  </p>
                ) : null}
              </s-stack>
            </div>

            {selectedPlatforms.length === 0 ? (
              <>
                {/* Anchors for home CTAs when picker is empty */}
                <div id="mcfly-spend-uploads" className="mcfly-spend-flow__anchor-fallback">
                  <s-text tone="neutral">
                    Select platforms above, then upload your filled Day + columns CSV here.
                  </s-text>
                  <Form method="post" encType="multipart/form-data">
                    <input type="hidden" name="intent" value="csv" />
                    <s-stack direction="block" gap="base">
                      <s-drop-zone
                        label="Spend CSV"
                        name="file"
                        accept=".csv,text/csv,application/vnd.ms-excel"
                        accessibilityLabel="Upload spend CSV"
                        {...(isSubmitting && submittingIntent === "csv"
                          ? { disabled: true }
                          : {})}
                        {...(csvFieldError ? { error: csvFieldError } : {})}
                      />
                      <s-button
                        type="submit"
                        variant="primary"
                        {...(isSubmitting && submittingIntent === "csv"
                          ? { loading: true }
                          : {})}
                      >
                        Import daily spend
                      </s-button>
                    </s-stack>
                  </Form>
                </div>
                <div id="mcfly-spend-combine" className="mcfly-spend-flow__anchor-fallback" />
              </>
            ) : (
              <>
                {/* 2 · Template preview */}
                <div className="mcfly-panel mcfly-spend-flow__step">
                  <s-stack direction="block" gap="base">
                    <div className="mcfly-spend-flow__head">
                      <span className="mcfly-spend-flow__n" aria-hidden="true">
                        2
                      </span>
                      <s-heading>Fill your Day + columns template</s-heading>
                    </div>
                    <s-text tone="neutral">
                      One row per day. Replace the sample numbers with real spend (blank or 0 =
                      no spend that day). Keep the header row. Sales stay in Shopify.
                    </s-text>
                    <div className="mcfly-spend-preview">
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
                      <p className="mcfly-spend-preview__note">
                        Sample numbers for shape only — not your account.
                      </p>
                    </div>
                    <div className="mcfly-spend-flow__actions">
                      <s-button
                        variant="primary"
                        onClick={() =>
                          downloadCsvFile(
                            selectedTemplate.csv,
                            "mcfly-spend-selected-platforms.csv",
                          )
                        }
                      >
                        Download this CSV
                      </s-button>
                    </div>
                  </s-stack>
                </div>

                {/* 3 · Upload */}
                <div className="mcfly-panel mcfly-spend-flow__step">
                  <s-stack direction="block" gap="base">
                    <div className="mcfly-spend-flow__head">
                      <span className="mcfly-spend-flow__n" aria-hidden="true">
                        3
                      </span>
                      <s-heading>Upload</s-heading>
                    </div>
                    <s-text tone="neutral">
                      Upload the filled template above, or drop each platform’s native daily
                      export. Re-uploading the same days updates them.
                    </s-text>

                    <div id="mcfly-spend-uploads" className="mcfly-spend-flow__upload">
                      <Form method="post" encType="multipart/form-data">
                        <input type="hidden" name="intent" value="csv" />
                        <s-stack direction="block" gap="base">
                          <s-heading>Filled Mcfly template</s-heading>
                          <s-drop-zone
                            label="Spend CSV"
                            name="file"
                            accept=".csv,text/csv,application/vnd.ms-excel"
                            accessibilityLabel="Upload filled spend CSV"
                            {...(isSubmitting && submittingIntent === "csv"
                              ? { disabled: true }
                              : {})}
                            {...(csvFieldError ? { error: csvFieldError } : {})}
                          />
                          {csvFieldError || actionErrorGroups ? (
                            <div className="mcfly-spend-upload-log" role="alert">
                              {actionErrorGroups ? (
                                <CsvErrorGroups grouped={actionErrorGroups} />
                              ) : null}
                              <s-text tone="neutral">
                                Fix the file and re-import. Your sales data is unchanged.
                              </s-text>
                            </div>
                          ) : null}
                          <details className="mcfly-details mcfly-spend-flow__paste">
                            <summary>…or paste rows</summary>
                            <label>
                              <s-text>CSV text</s-text>
                              <textarea
                                className="mcfly-field mcfly-field--wide"
                                name="csv"
                                rows={6}
                                placeholder={selectedTemplate.csv.trim()}
                                disabled={isSubmitting && submittingIntent === "csv"}
                              />
                            </label>
                          </details>
                          <s-button
                            type="submit"
                            variant="primary"
                            {...(isSubmitting && submittingIntent === "csv"
                              ? { loading: true }
                              : {})}
                          >
                            Import daily spend
                          </s-button>
                        </s-stack>
                      </Form>
                    </div>

                    <div id="mcfly-spend-combine" className="mcfly-spend-flow__combine">
                      <Form method="post" encType="multipart/form-data">
                        <input type="hidden" name="intent" value="csv-combine" />
                        <s-stack direction="block" gap="base">
                          <s-heading>Or combine native platform exports</s-heading>
                          <s-text tone="neutral">
                            One file per selected platform (Day + Amount spent / Cost). Each maps
                            to its desk channel.
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
                                  <span className="mcfly-spend-combine__label">Platform</span>
                                  <p className="mcfly-spend-combine__name">{platform.title}</p>
                                  <s-text tone="neutral">
                                    → {SPEND_CHANNEL_LABELS[platform.engineChannel]}
                                  </s-text>
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
                          {csvFieldError ? (
                            <div className="mcfly-spend-upload-log" role="alert">
                              <s-text tone="critical">{csvFieldError}</s-text>
                              {actionErrorGroups ? (
                                <CsvErrorGroups grouped={actionErrorGroups} />
                              ) : null}
                            </div>
                          ) : null}
                          <s-button
                            type="submit"
                            variant="primary"
                            {...(isSubmitting && submittingIntent === "csv-combine"
                              ? { loading: true }
                              : {})}
                          >
                            Combine & import
                          </s-button>
                          <s-text tone="neutral">
                            Spend CSV only — no pixels, no ad OAuth.
                          </s-text>
                        </s-stack>
                      </Form>
                    </div>
                  </s-stack>
                </div>

                {/* Export help — collapsed by default */}
                <div className="mcfly-panel mcfly-spend-help">
                  <s-stack direction="block" gap="base">
                    <s-heading>Need help exporting your spend?</s-heading>
                    <label className="mcfly-spend-help__toggle">
                      <input
                        type="checkbox"
                        checked={showExportWalkthroughs}
                        onChange={(e) => setShowExportWalkthroughs(e.target.checked)}
                      />
                      <span>Show export walkthroughs</span>
                    </label>
                    {showExportWalkthroughs ? (
                      <div className="mcfly-spend-guides">
                        <s-text tone="neutral">
                          Day breakdown + Amount spent / Cost. Match {PRODUCT_NOUN.totalRoas} dates.
                          Skip totals rows. Account currency. No customer PII.
                        </s-text>
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
                                {guide.engineChannel !== guide.id
                                  ? ` · Desk channel: ${SPEND_CHANNEL_LABELS[guide.engineChannel]}`
                                  : ""}
                              </span>
                            </summary>
                            <div className="mcfly-spend-guide__body">
                              <p className="mcfly-spend-guide__label">Steps</p>
                              <ol className="mcfly-spend-guide__steps">
                                {guide.steps.map((step) => (
                                  <li key={step}>{step}</li>
                                ))}
                              </ol>
                              <p className="mcfly-spend-guide__label">Columns Mcfly needs</p>
                              <ul className="mcfly-spend-guide__list">
                                {guide.columnsNeeded.map((col) => (
                                  <li key={col}>{col}</li>
                                ))}
                              </ul>
                              <p className="mcfly-spend-guide__label">Tips</p>
                              <ul className="mcfly-spend-guide__list">
                                {guide.tips.map((tip) => (
                                  <li key={tip}>{tip}</li>
                                ))}
                              </ul>
                              {guide.cadenceNote ? (
                                <p className="mcfly-spend-guide__cadence">
                                  {guide.cadenceNote}
                                </p>
                              ) : null}
                            </div>
                          </details>
                        ))}
                      </div>
                    ) : (
                      <s-text tone="neutral">
                        Turn on walkthroughs for Meta, Google, Microsoft, and your other selected
                        platforms — only when you need them.
                      </s-text>
                    )}
                  </s-stack>
                </div>
              </>
            )}
          </s-stack>
        </div>
      </s-section>

      {/* Secondary · Bill → daily */}
      <s-section heading="Have a monthly invoice instead of a daily ads export?">
        <div id="mcfly-spend-bill-daily" className="mcfly-spend-bill mcfly-spend-secondary">
          <details className="mcfly-details mcfly-spend-secondary__details">
            <summary>
              Bill → daily — spread a month / quarter / year invoice across days
            </summary>
            <div className="mcfly-spend-secondary__body">
              <s-stack direction="block" gap="base">
                <s-text tone="neutral">
                  Klaviyo, Impact, retainer, or agency bill — enter amount, cadence, and channel →
                  Preview → Download CSV or Apply to desk. Same upsert as CSV import.
                </s-text>

                <Form method="post" className="mcfly-panel mcfly-spend-bill__panel">
                  <input type="hidden" name="intent" value="bill-daily" />
                  <s-stack direction="block" gap="base">
                    <div className="mcfly-spend-bill__grid">
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
                        <s-text>Cadence</s-text>
                        <select
                          className="mcfly-field"
                          name="cadence"
                          value={billCadence}
                          onChange={(e) => {
                            setBillCadence(e.target.value as BillCadence);
                            setBillPreview(null);
                          }}
                          disabled={isSubmitting && submittingIntent === "bill-daily"}
                        >
                          <option value="month">Month</option>
                          <option value="quarter">Quarter</option>
                          <option value="year">Year</option>
                        </select>
                      </label>

                      <label className="mcfly-spend-bill__field">
                        <s-text>Day basis</s-text>
                        <select
                          className="mcfly-field"
                          name="dayBasis"
                          value={billDayBasis}
                          onChange={(e) => {
                            setBillDayBasis(e.target.value as BillDayBasis);
                            setBillPreview(null);
                          }}
                          disabled={isSubmitting && submittingIntent === "bill-daily"}
                        >
                          <option value="calendar">Calendar days in period</option>
                          <option value="fixed">Fixed 30 / 90 / 365</option>
                        </select>
                      </label>

                      <label className="mcfly-spend-bill__field">
                        <s-text>Start date</s-text>
                        <input
                          className="mcfly-field"
                          name="startDate"
                          type="date"
                          required
                          value={billStartDate}
                          onChange={(e) => {
                            setBillStartDate(e.target.value);
                            setBillPreview(null);
                          }}
                          disabled={isSubmitting && submittingIntent === "bill-daily"}
                        />
                      </label>

                      <label className="mcfly-spend-bill__field mcfly-spend-bill__field--wide">
                        <s-text>Channel</s-text>
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
                          {CHANNELS.map(({ value, label }) => (
                            <option key={value} value={value}>
                              {label}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>

                    <s-text tone="neutral">
                      Calendar = real days from start through end of that month/quarter/year.
                      Fixed = always 30, 90, or 365 days. Last day absorbs leftover cents.
                    </s-text>

                    {billPreviewError ? (
                      <s-text tone="critical">{billPreviewError}</s-text>
                    ) : null}

                    {billPreview ? (
                      <div className="mcfly-spend-bill__preview" aria-live="polite">
                        <p className="mcfly-spend-bill__preview-title">Preview</p>
                        <div className="mcfly-metrics mcfly-spend-bill__metrics">
                          <div className="mcfly-metric mcfly-metric--compact">
                            <p className="mcfly-metric__label">Daily rate</p>
                            <p className="mcfly-metric__value">
                              {formatCurrency(billPreview.dailyRate)}
                            </p>
                            <p className="mcfly-metric__hint">
                              ÷ {billPreview.dayCount} days
                            </p>
                          </div>
                          <div className="mcfly-metric mcfly-metric--compact">
                            <p className="mcfly-metric__label">Period</p>
                            <p className="mcfly-metric__value mcfly-spend-bill__period">
                              {billPreview.startDate} → {billPreview.endDate}
                            </p>
                            <p className="mcfly-metric__hint">
                              {SPEND_CHANNEL_LABELS[billPreview.channel]} ·{" "}
                              {formatCurrency(billPreview.totalAllocated)} total
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
          </details>
        </div>
      </s-section>

      {/* Secondary · one-line + full wide template */}
      <s-section heading="More ways to add spend">
        <div className="mcfly-spend-secondary">
          <details className="mcfly-details mcfly-spend-secondary__details">
            <summary>Or enter one line</summary>
            <div className="mcfly-spend-secondary__body">
              <Form method="post">
                <input type="hidden" name="intent" value="manual" />
                <s-stack direction="block" gap="base">
                  <s-text tone="neutral">
                    Paste a channel total for a period when you don’t have a daily CSV yet. Prefer
                    the Day + columns template above for {PRODUCT_NOUN.totalRoas}.
                  </s-text>
                  <label>
                    <s-text>Channel</s-text>
                    <select className="mcfly-field" name="channel" defaultValue="meta">
                      {CHANNELS.map(({ value, label }) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
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
                    <select className="mcfly-field" name="period" defaultValue="mtd">
                      <option value="mtd">Month to date</option>
                      <option value="qtd">Quarter to date</option>
                      <option value="ytd">Year to date</option>
                    </select>
                  </label>
                  <label>
                    <s-text>Note (optional)</s-text>
                    <input
                      className="mcfly-field"
                      name="note"
                      type="text"
                      placeholder="e.g. Meta Ads Manager total"
                    />
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

          <details className="mcfly-details mcfly-spend-secondary__details" id="mcfly-spend-csv">
            <summary>Full wide template (every channel)</summary>
            <div className="mcfly-spend-secondary__body">
              <s-stack direction="block" gap="base">
                <s-text tone="neutral">
                  All Mcfly channel columns at once. The selected-platform template above is
                  usually enough.
                </s-text>
                <div className="mcfly-template-actions mcfly-spend-template-primary">
                  <s-button
                    onClick={() =>
                      downloadCsvFile(CSV_BLANK, "mcfly-spend-template-blank.csv")
                    }
                  >
                    Download blank (14 days)
                  </s-button>
                  <s-button
                    onClick={() =>
                      downloadCsvFile(CSV_SAMPLE, "mcfly-spend-template.csv")
                    }
                  >
                    Filled example
                  </s-button>
                </div>
                <p className="mcfly-spend-fallback">
                  Direct links:{" "}
                  <s-link href="/app/spend/template?blank=1">blank</s-link> ·{" "}
                  <s-link href="/app/spend/template">example</s-link>
                </p>
                <p className="mcfly-template-headers" aria-label="Template columns">
                  {WIDE_TEMPLATE_HEADERS.join(" · ")}
                </p>
                <details className="mcfly-details">
                  <summary>Column guide</summary>
                  <div className="mcfly-col-grid">
                    {WIDE_TEMPLATE_COLUMNS.filter((c) => c.channel !== "day").map((col) => (
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
      </s-section>

      <s-section heading="Day coverage">
        <div className="mcfly-spend-cal">
          <div className="mcfly-spend-cal__meta">
            <s-text>
              {dayCoverage.filledCount} of {dayCoverage.total} days have spend
              {holeCount > 0 ? ` · ${holeCount} empty` : " · no holes"}
              {dayCoverage.includesSample ? " · includes sample" : null}
            </s-text>
            <s-text tone="neutral">
              Last {dayCoverage.total} days — empty cells are CSV gaps to fill.
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
                <span className="mcfly-spend-cal__tick" aria-hidden="true" />
                <span className="mcfly-spend-cal__label">{day.label}</span>
              </span>
            ))}
          </div>
          <div className="mcfly-spend-cal__legend" aria-hidden="true">
            <span className="mcfly-spend-cal__legend-item">
              <span className="mcfly-spend-cal__day mcfly-spend-cal__day--filled mcfly-spend-cal__day--swatch">
                <span className="mcfly-spend-cal__tick" />
              </span>
              Filled
            </span>
            <span className="mcfly-spend-cal__legend-item">
              <span className="mcfly-spend-cal__day mcfly-spend-cal__day--empty mcfly-spend-cal__day--swatch">
                <span className="mcfly-spend-cal__tick" />
              </span>
              Empty
            </span>
          </div>
          {holeCount > 0 ? (
            <div className="mcfly-spend-holes">
              <s-text>
                Missing days
                {missingDatesPreview.length < missingDates.length
                  ? ` (first ${missingDatesPreview.length} of ${missingDates.length})`
                  : ""}
                : {missingDatesPreview.join(", ")}
                {missingDates.length > missingDatesPreview.length ? "…" : ""}
              </s-text>
              <div className="mcfly-spend-holes__actions">
                <s-button
                  variant="primary"
                  onClick={() =>
                    downloadCsvFile(missingDatesCsv, "mcfly-spend-missing-days.csv")
                  }
                >
                  Download blank for empty days
                </s-button>
                <s-link href={missingDatesHref}>Direct download link</s-link>
                <s-link href="#mcfly-spend-uploads">Jump to upload</s-link>
              </div>
              <s-text tone="neutral">
                Fill those rows in Sheets/Excel, then import above. Blank or 0 = no spend that day.
              </s-text>
            </div>
          ) : null}
        </div>
      </s-section>

      <s-section heading="Recent entries">
        {isEmpty ? (
          <div className="mcfly-spend-empty">
            <s-box padding="large" background="subdued" borderRadius="base">
              <s-stack direction="block" gap="base" alignItems="center">
                <s-heading>No spend logged yet</s-heading>
                <s-paragraph>
                  <s-text tone="neutral">
                    Pick platforms → download the template → upload. Then open{" "}
                    {PRODUCT_NOUN.totalRoas} — {PRODUCT_NOUN.definition}.
                  </s-text>
                </s-paragraph>
                <div className="mcfly-spend-empty__actions">
                  <s-button href="#mcfly-spend-exports" variant="primary">
                    Start: pick platforms
                  </s-button>
                  <s-button href="#mcfly-spend-bill-daily">
                    Monthly invoice instead?
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
                  {SPEND_CHANNEL_LABELS[entry.channel as keyof typeof SPEND_CHANNEL_LABELS] ??
                    entry.channel}
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
                {entry.note ? (
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
