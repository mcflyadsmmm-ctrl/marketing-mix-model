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
  type CsvChannel,
  type CsvImportSummary,
} from "../lib/spend-csv";
import { createSpendRepository } from "../lib/spend-repository.server";
import { getSampleDeskStats } from "../lib/sample-desk.server";
import { formatCurrency } from "../lib/mer-format";
import prisma from "../db.server";
import { SPEND_CHANNELS, SPEND_CHANNEL_LABELS } from "@mcfly/mer-engine";

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

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const shop = await ensureShop(session.shop);
  const url = new URL(request.url);
  const shotMode = url.searchParams.get("shot") === "1";
  // Real entries only — sample-desk rows are demo data and would drown out
  // an operator's own uploads in "Recent entries" (sample dates run through today).
  const entries = await prisma.spendEntry.findMany({
    where: { shopId: shop.id, source: { not: "sample" } },
    orderBy: { periodStart: "desc" },
    take: 20,
  });
  const sampleDesk = await getSampleDeskStats(shop.id);
  return { entries, sampleDesk, shotMode };
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
        "No valid spend rows found. Use date+channel+amount rows, or a wide day sheet with Google/Meta columns.",
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

export default function SpendEntryPage() {
  const { entries, sampleDesk, shotMode } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";
  const submittingIntent =
    navigation.formData?.get("intent")?.toString() ?? null;
  const isEmpty = entries.length === 0;
  const csv = actionData?.csv;
  const csvSaved = Boolean(actionData?.success && csv);
  const manualSaved = Boolean(actionData?.success && !csv);

  return (
    <s-page heading="Spend" inlineSize="large">
      <div className={shotMode ? "mcfly-desk mcfly-desk--shot" : "mcfly-desk"}>
      {sampleDesk.enabled && !shotMode ? (
        <s-banner tone="warning" heading="Sample desk is on">
          <s-paragraph>
            Recent entries below show your own uploads only — the 3-year demo dataset
            ({sampleDesk.spendCount.toLocaleString()} sample rows) is kept out of this list so it's
            never mistaken for real spend. Turn sample desk off on the{" "}
            <s-link href="/app/demo">Demo</s-link> tab.
          </s-paragraph>
        </s-banner>
      ) : null}

      {isEmpty && !actionData?.success ? (
        <s-banner tone="info" heading="Step 2 · Add daily spend for cash MER">
          <s-paragraph>
            Upload one CSV of what you spent, per channel, per day. Mcfly pairs it with Shopify sales
            for cash MER (sales ÷ spend) — same desk logic as a serious operator MER board.
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
        <s-banner tone="success" heading="Spend imported — MER is ready">
          <div className="mcfly-metrics mcfly-spend-summary">
            <div className="mcfly-metric mcfly-metric--success mcfly-metric--compact">
              <p className="mcfly-metric__label">Rows imported</p>
              <p className="mcfly-metric__value">{csv.written}</p>
              {csv.skipped > 0 ? (
                <p className="mcfly-metric__hint">{csv.skipped} already up to date</p>
              ) : null}
            </div>
            <div className="mcfly-metric mcfly-metric--compact">
              <p className="mcfly-metric__label">Days</p>
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
          <s-paragraph>
            Next: open <s-link href="/app">Cash MER</s-link> for sales ÷ spend.
          </s-paragraph>
          {csv.errors.length > 0 ? (
            <s-stack direction="block" gap="small">
              <s-text tone="critical">
                {csv.errors.length} row(s) were skipped and need a look:
              </s-text>
              {csv.errors.slice(0, 8).map((err, i) => (
                <s-text key={i} tone="neutral">
                  {err}
                </s-text>
              ))}
            </s-stack>
          ) : null}
        </s-banner>
      ) : null}

      {manualSaved ? (
        <s-banner tone="success" heading="Spend saved — MER is ready">
          <s-paragraph>
            Next: open <s-link href="/app">Cash MER</s-link>. Add another channel below if needed.
          </s-paragraph>
        </s-banner>
      ) : null}

      {actionData && !actionData.success && actionData.error ? (
        <s-banner tone="critical" heading="Import needs a fix">
          <s-paragraph>{actionData.error}</s-paragraph>
          {csv && csv.errors.length > 1 ? (
            <s-stack direction="block" gap="small">
              {csv.errors.slice(0, 8).map((err, i) => (
                <s-text key={i} tone="neutral">
                  {err}
                </s-text>
              ))}
            </s-stack>
          ) : null}
        </s-banner>
      ) : null}

      <s-section heading="Upload daily spend (CSV)">
        <s-stack direction="block" gap="large">
          <s-paragraph>
            Easiest path: download the blank template, fill one row per day, upload it back. Mcfly
            pairs that spend with Shopify sales for cash MER (sales ÷ spend). Re-uploading the same
            days updates them — no double counting.
          </s-paragraph>

          <div className="mcfly-panel mcfly-template-hero">
            <s-stack direction="block" gap="base">
              <div className="mcfly-ritual__step">
                <span className="mcfly-ritual__n">1</span>
                <s-stack direction="block" gap="small">
                  <s-heading>Download the blank spend template</s-heading>
                  <s-text tone="neutral">
                    One row = one day. Columns cover every spend area Mcfly tracks. Leave a cell blank
                    or 0 when you didn’t spend.
                  </s-text>
                </s-stack>
              </div>

              <div className="mcfly-template-actions">
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
                  Open the CSV → keep the header row → replace example numbers with your daily spend.
                  Don’t rename the column headers. Shopify sales stay in Shopify — don’t paste sales
                  into this file.
                </s-text>
                <s-text tone="neutral">
                  Optional automation: SyncWith / Supermetrics / Coupler → Sheets → export CSV → step
                  3. Mcfly stays the cash desk (no connector zoo inside the app).
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
                      Choose the file you saved, or paste the rows below.
                    </s-text>
                  </s-stack>
                </div>
                <label>
                  <s-text>Choose CSV file</s-text>
                  <input
                    className="mcfly-field mcfly-field--file"
                    type="file"
                    name="file"
                    accept=".csv,text/csv"
                  />
                </label>
                <label>
                  <s-text>…or paste rows</s-text>
                  <textarea
                    className="mcfly-field mcfly-field--wide"
                    name="csv"
                    rows={7}
                    placeholder={CSV_SAMPLE}
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
      </s-section>

      <s-section heading="Or add one line manually">
        <Form method="post">
          <input type="hidden" name="intent" value="manual" />
          <s-stack direction="block" gap="base">
            {isEmpty ? (
              <s-box padding="base" borderWidth="base" borderRadius="base" background="subdued">
                <s-stack direction="block" gap="small">
                  <s-text>What to enter per channel</s-text>
                  {CHANNELS.map(({ label, hint }) => (
                    <s-text key={label} tone="neutral">
                      {label}: {hint}
                    </s-text>
                  ))}
                </s-stack>
              </s-box>
            ) : null}

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
                rest. No OAuth required — paste totals from each ads manager.
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
          <div className="mcfly-panel">
            <s-stack direction="block" gap="small">
              <s-text>No spend yet — MER needs money out</s-text>
              <s-paragraph>
                <s-text tone="neutral">
                  One Meta, Google, or Other line unlocks cash MER on{" "}
                  <s-link href="/app">Cash MER</s-link>.
                </s-text>
              </s-paragraph>
            </s-stack>
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
            Upload daily spend, then read MER. Live Meta/Google sync is later — CSV means you never
            wait on OAuth.
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
