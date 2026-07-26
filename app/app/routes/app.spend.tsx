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
  parseSpendCsv,
  WIDE_TEMPLATE_COLUMNS,
  WIDE_TEMPLATE_HEADERS,
  WIDE_TEMPLATE_SAMPLE,
  buildBlankSpendTemplate,
  buildBlankSpendTemplateForDates,
  groupCsvErrors,
  type CsvChannel,
  type CsvImportSummary,
  type GroupedCsvErrors,
} from "../lib/spend-csv";
import { createSpendRepository } from "../lib/spend-repository.server";
import { getSampleDeskStats, localDayKey } from "../lib/sample-desk.server";
import { formatCurrency } from "../lib/mer-format";
import prisma from "../db.server";
import { SPEND_CHANNELS, SPEND_CHANNEL_LABELS } from "@mcfly/mer-engine";

/** Last N local calendar days for the CSV hole strip (within 14–31). */
const SPEND_COVERAGE_DAYS = 28;

const CHANNELS = [
  {
    value: "meta",
    label: "Meta Ads",
    hint: "Ads Manager → Export → Amount spent (daily). FB + IG.",
  },
  {
    value: "google",
    label: "Google Ads",
    hint: "Google Ads → Reports → Cost by day (Search, Shopping, YouTube).",
  },
  {
    value: "microsoft",
    label: "Microsoft Ads",
    hint: "Microsoft Advertising → Reports → Spend by day (Bing).",
  },
  {
    value: "tiktok",
    label: "TikTok Ads",
    hint: "TikTok Ads Manager → export daily cost.",
  },
  {
    value: "affiliate",
    label: "Affiliate",
    hint: "Impact / CJ / ShareASale / etc. — commissions + fees by day.",
  },
  {
    value: "email",
    label: "Email",
    hint: "Klaviyo / ESP invoice or plan cost allocated by day (cash out).",
  },
  {
    value: "other",
    label: "Other",
    hint: "Anything else you paid to advertise that day.",
  },
] as const;

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
  return { entries, sampleDesk, shotMode, dayCoverage };
};

export interface SpendActionData {
  error: string | null;
  success: boolean;
  csv?: CsvImportSummary;
}

async function handleCsvImport(
  shopId: string,
  form: FormData,
): Promise<SpendActionData> {
  const file = form.get("file");
  let text = "";
  if (file && typeof file === "object" && "text" in file) {
    text = await (file as File).text();
  }
  if (!text.trim()) {
    text = String(form.get("csv") ?? "");
  }
  if (!text.trim()) {
    return { error: "Choose a CSV file or paste rows before importing.", success: false };
  }

  const parsed = parseSpendCsv(text);
  const aggregated = aggregateSpendRows(parsed.rows);

  if (aggregated.length === 0) {
    return {
      error:
        parsed.errors[0] ??
        "No valid spend rows found. Use the Mcfly template (Day + channel columns) or date,channel,amount rows. This file is ad spend only — Shopify sales stay in Shopify.",
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

export const action = async ({ request }: ActionFunctionArgs): Promise<SpendActionData> => {
  const { session } = await authenticate.admin(request);
  const shop = await ensureShop(session.shop);
  const form = await request.formData();
  const intent = String(form.get("intent") ?? "manual");

  if (intent === "csv") {
    return handleCsvImport(shop.id, form);
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

  const range = resolvePeriod(period);
  await prisma.spendEntry.create({
    data: {
      shopId: shop.id,
      channel: channel as CsvChannel,
      amount,
      periodStart: range.start,
      periodEnd: range.end,
      note,
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
        Spend CSV only; Shopify till is unchanged.
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
            never mistaken for real spend. Day coverage and Cash MER can still include sample days.
            Turn sample desk <strong>OFF</strong> on the <s-link href="/app/demo">Demo</s-link> tab
            before App Store review. <code>?shot=1</code> hides this banner only — metrics stay
            sample until OFF.
          </s-paragraph>
        </s-banner>
      ) : null}

      {isEmpty && !actionData?.success ? (
        <s-banner tone="info" heading="Step 2 · Add daily spend for cash MER">
          <s-paragraph>
            Upload one CSV of spend by channel by day. Shopify sales power MER
            (sales ÷ spend) — same desk logic as a serious operator MER board.
          </s-paragraph>
          <div className="mcfly-ritual">
            <div className="mcfly-ritual__step">
              <span className="mcfly-ritual__n">1</span>
              <span>
                Margin in <s-link href="/app/settings">Settings</s-link> (defaults OK to start)
              </span>
            </div>
            <div className="mcfly-ritual__step">
              <span className="mcfly-ritual__n">2</span>
              <span>Upload your daily spend CSV below (or add one line)</span>
            </div>
            <div className="mcfly-ritual__step">
              <span className="mcfly-ritual__n">3</span>
              <span>
                Read MER on <s-link href="/app">Cash MER</s-link>
              </span>
            </div>
          </div>
        </s-banner>
      ) : null}

      {csvSaved && csv ? (
        <s-banner tone="success" heading="Spend imported — next: Cash MER">
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
              Open Cash MER
            </s-button>
            <s-text tone="neutral">
              Cash MER = Shopify sales ÷ this spend. Fill any empty days below if the strip shows holes.
            </s-text>
          </div>
          {csvErrorGroups ? <CsvErrorGroups grouped={csvErrorGroups} /> : null}
        </s-banner>
      ) : null}

      {manualSaved ? (
        <s-banner tone="success" heading="Spend saved — next: Cash MER">
          <div className="mcfly-spend-next">
            <s-button href="/app" variant="primary">
              Open Cash MER
            </s-button>
            <s-text tone="neutral">
              Add another channel below if needed, or upload a full daily CSV.
            </s-text>
          </div>
        </s-banner>
      ) : null}

      {actionData && !actionData.success && actionData.error ? (
        <s-banner tone="critical" heading="CSV needs a fix — Shopify till is fine">
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
                <s-link href="#mcfly-spend-csv">Jump to upload</s-link>
              </div>
              <s-text tone="neutral">
                Fill those rows in Sheets/Excel, then import below. Blank or 0 = no spend that day.
              </s-text>
            </div>
          ) : null}
        </div>
      </s-section>

      <s-section heading="Upload daily spend (CSV)">
        <div id="mcfly-spend-csv">
        <s-stack direction="block" gap="large">
          <s-paragraph>
            Template = spend by channel by day. Download the blank CSV, fill it, upload it back.
            Shopify sales power MER (sales ÷ spend). Re-uploading the same days updates them — no
            double counting.
          </s-paragraph>

          <div className="mcfly-panel mcfly-template-hero">
            <s-stack direction="block" gap="base">
              <div className="mcfly-ritual__step">
                <span className="mcfly-ritual__n">1</span>
                <s-stack direction="block" gap="small">
                  <s-heading>Download the blank spend template</s-heading>
                  <s-text tone="neutral">
                    Spend by channel by day — one row per day. Columns cover every spend area Mcfly
                    tracks. Leave a cell blank or 0 when you didn’t spend. Shopify sales stay in
                    Shopify.
                  </s-text>
                </s-stack>
              </div>

              <div className="mcfly-template-actions mcfly-spend-template-primary">
                <s-button
                  variant="primary"
                  onClick={() =>
                    downloadCsvFile(CSV_BLANK, "mcfly-spend-template-blank.csv")
                  }
                >
                  Download blank template (14 days)
                </s-button>
                <s-button
                  onClick={() =>
                    downloadCsvFile(CSV_SAMPLE, "mcfly-spend-template.csv")
                  }
                >
                  See a filled example
                </s-button>
              </div>
              <p className="mcfly-spend-fallback">
                Downloads not opening? Use a direct link:{" "}
                <s-link href="/app/spend/template?blank=1">blank template</s-link> ·{" "}
                <s-link href="/app/spend/template">filled example</s-link>
              </p>

              <p className="mcfly-template-headers" aria-label="Template columns">
                {WIDE_TEMPLATE_HEADERS.join(" · ")}
              </p>

              <div className="mcfly-col-grid">
                {WIDE_TEMPLATE_COLUMNS.filter((c) => c.channel !== "day").map((col) => (
                  <div className="mcfly-col-card" key={col.header}>
                    <p className="mcfly-col-card__name">{col.header}</p>
                    <p className="mcfly-col-card__help">{col.help}</p>
                  </div>
                ))}
              </div>

              <details className="mcfly-details">
                <summary>Preview example rows</summary>
                <pre className="mcfly-pre">{CSV_SAMPLE}</pre>
              </details>
            </s-stack>
          </div>

          <div className="mcfly-panel">
            <div className="mcfly-ritual__step">
              <span className="mcfly-ritual__n">2</span>
              <s-stack direction="block" gap="small">
                <s-heading>Fill it in Excel / Google Sheets</s-heading>
                <s-text tone="neutral">
                  Open the blank CSV → keep the header row → enter spend by channel by day
                  (blank or 0 where you didn’t spend). Don’t rename the column headers. Shopify
                  sales power MER — don’t paste sales into this file.
                </s-text>
                <s-text tone="neutral">
                  External tip only: if you already pull ads into Sheets with SyncWith / Supermetrics /
                  Coupler, export that sheet as CSV and upload in step 3. Mcfly stays CSV spend
                  aggregates — no ad-platform login inside the app.
                </s-text>
              </s-stack>
            </div>
          </div>

          <div className="mcfly-panel">
            <Form method="post" encType="multipart/form-data">
              <input type="hidden" name="intent" value="csv" />
              <s-stack direction="block" gap="base">
                <div className="mcfly-ritual__step">
                  <span className="mcfly-ritual__n">3</span>
                  <s-stack direction="block" gap="small">
                    <s-heading>Upload your filled CSV</s-heading>
                    <s-text tone="neutral">
                      Drop a spend-by-channel-by-day CSV, or paste rows below. Shopify
                      sales stay in Shopify.
                    </s-text>
                  </s-stack>
                </div>
                <label
                  className={`mcfly-dropzone${
                    isSubmitting && submittingIntent === "csv"
                      ? " mcfly-dropzone--busy"
                      : ""
                  }`}
                >
                  <input
                    className="mcfly-dropzone__input"
                    type="file"
                    name="file"
                    accept=".csv,text/csv,application/vnd.ms-excel"
                    disabled={isSubmitting && submittingIntent === "csv"}
                    aria-label="Upload spend CSV"
                  />
                  <span className="mcfly-dropzone__body">
                    <strong>Drop CSV here</strong>
                    <span>or click to choose · .csv only · one file</span>
                  </span>
                </label>
                <label>
                  <s-text>…or paste rows</s-text>
                  <textarea
                    className="mcfly-field mcfly-field--wide"
                    name="csv"
                    rows={7}
                    placeholder={CSV_SAMPLE}
                    disabled={isSubmitting && submittingIntent === "csv"}
                  />
                </label>
                <s-button
                  type="submit"
                  variant="primary"
                  {...(isSubmitting && submittingIntent === "csv" ? { loading: true } : {})}
                >
                  Import daily spend
                </s-button>
              </s-stack>
            </Form>
          </div>
        </s-stack>
        </div>
      </s-section>

      <s-section heading="Or add one line manually">
        <Form method="post">
          <input type="hidden" name="intent" value="manual" />
          <s-stack direction="block" gap="base">
            <s-box padding="base" borderWidth="base" borderRadius="base" background="subdued">
              <s-stack direction="block" gap="small">
                <s-text>Named channels (paste totals from each ads manager)</s-text>
                {CHANNELS.map(({ label, hint }) => (
                  <s-text key={label} tone="neutral">
                    {label}: {hint}
                  </s-text>
                ))}
              </s-stack>
            </s-box>

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
            <s-paragraph>
              <s-text tone="neutral">
                Start with Meta or Google if that is where most ad dollars went. Use Other for the
                rest. No OAuth — export or copy the amount from each ads manager into Mcfly.
              </s-text>
            </s-paragraph>

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
              {...(isSubmitting && submittingIntent === "manual" ? { loading: true } : {})}
            >
              {isEmpty ? "Save spend & unlock Cash MER" : "Save spend"}
            </s-button>
            {isEmpty ? (
              <s-paragraph>
                <s-text tone="neutral">
                  After save, open <s-link href="/app">Cash MER</s-link>.
                </s-text>
              </s-paragraph>
            ) : null}
          </s-stack>
        </Form>
      </s-section>

      <s-section heading="Recent entries">
        {isEmpty ? (
          <div className="mcfly-spend-empty">
            <s-box padding="large" background="subdued" borderRadius="base">
              <s-stack direction="block" gap="base" alignItems="center">
                <s-heading>No spend logged yet</s-heading>
                <s-paragraph>
                  <s-text tone="neutral">
                    Cash MER needs money out. Upload a daily CSV or save one channel line — then
                    Shopify sales ÷ spend unlocks on Cash MER.
                  </s-text>
                </s-paragraph>
                <div className="mcfly-spend-empty__actions">
                  <s-button href="#mcfly-spend-csv" variant="primary">
                    Upload daily CSV
                  </s-button>
                  <s-button href="/app/spend/template?blank=1">
                    Download blank template
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
                When channels look complete, open <s-link href="/app">Cash MER</s-link>.
              </s-text>
            </s-paragraph>
          </s-stack>
        )}
      </s-section>

      <s-section slot="aside" heading="Monday ritual">
        <div className="mcfly-aside-card">
          <p className="mcfly-aside-card__title">Settings → Spend → Cash MER</p>
          <p>
            Upload daily spend CSV (or one manual line), then read MER. Mcfly stays CSV aggregates —
            no ad-platform login inside the app.
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
