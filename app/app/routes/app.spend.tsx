import { useEffect, useLayoutEffect, useMemo, useRef, type ReactNode } from "react";
import type {
  ActionFunctionArgs,
  HeadersFunction,
  LoaderFunctionArgs,
} from "react-router";
import { Form, Link, useActionData, useLoaderData, useNavigation } from "react-router";
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
import { deskPeriodTimeZone, parsePeriodPreset, resolvePeriod } from "../lib/periods";
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
import { isSpendYmd } from "../lib/spend-day-entry";
import { slugCustomChannelName } from "../lib/spend-custom-channel";
import { isSpendChannel } from "../lib/spend-billing";
import { createSpendRepository } from "../lib/spend-repository.server";
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
import { formatSpendAmount } from "../lib/mer-format";
import { PRODUCT_NOUN } from "../lib/product-labels";
import prisma from "../db.server";
import {
  canUseChannel,
  getShopEntitlements,
  type ShopEntitlements,
} from "../lib/entitlements.server";
import { PRO_UPSELL } from "../lib/entitlements";
import { spendChannelLabel } from "../lib/spend-channel-label";
import { SPEND_DOORS } from "../lib/spend-doors";
import { loadSpendDayCoverage } from "../lib/spend-coverage.server";
import { deleteSpendEntry, type SpendActionData } from "../lib/spend-write.server";
import {
  listRecurringSpend,
  materializeRecurringSpendForShop,
  previousSpendYmd,
  startRecurringSpend,
  stopRecurringSpend,
} from "../lib/spend-recurring.server";
import { roundMoney, shopCurrencyCode, toMoneyNumber } from "../lib/spend-money";
import { spendFillDayHref } from "../lib/number-honesty";

const CUSTOM_CHANNEL_NAME_ERROR = "Name this channel (e.g. Influencers).";

const SHORT_MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
] as const;

function formatSpendYmd(value: string): string {
  const [year, month, day] = value.split("-").map(Number);
  const monthLabel = SHORT_MONTHS[month - 1];
  if (!year || !monthLabel || !day) return value;
  return `${monthLabel} ${day}, ${year}`;
}

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

function HashDetails({
  id,
  className,
  defaultOpen,
  summary,
  children,
}: {
  id: string;
  className: string;
  defaultOpen: boolean;
  summary: ReactNode;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDetailsElement>(null);
  useLayoutEffect(() => {
    if (defaultOpen && ref.current) ref.current.open = true;
  }, [defaultOpen]);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const openIfHash = () => {
      if (window.location.hash === `#${id}`) el.open = true;
    };
    openIfHash();
    window.addEventListener("hashchange", openIfHash);
    return () => window.removeEventListener("hashchange", openIfHash);
  }, [id]);
  return (
    <details ref={ref} id={id} className={className}>
      <summary className="mcfly-spend-reveal__summary">{summary}</summary>
      {children}
    </details>
  );
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
  const currencyCode = shopCurrencyCode(shop.currencyCode);
  const settings = await prisma.settings.findUnique({ where: { shopId: shop.id } });
  const spendSourceWhere = sampleDesk.enabled
    ? { source: "sample" as const }
    : { source: { not: "sample" } };
  const periodRange = resolvePeriod(preset, now, timeZone);
  const todayKey = sampleDesk.enabled
    ? utcDayKey(now)
    : timeZone
      ? shopLocalDayKey(now, timeZone)
      : localDayKey(now);
  const yesterdayKey = previousSpendYmd(todayKey);
  const spendHistoryFloorKey = salesDayFactWindowStartUtc().toISOString().slice(0, 10);

  await materializeRecurringSpendForShop({
    shopId: shop.id,
    currencyCode: shop.currencyCode,
    ianaTimezone: shop.ianaTimezone,
    sampleOn: sampleDesk.enabled,
  });

  const exGran = parseExplorerGranularity(url.searchParams.get("exGran"));
  const exMode = parseExplorerMode(url.searchParams.get("exMode"));
  const exSales = parseExplorerShowSales(url.searchParams.get("exSales"));
  const [entryRows, dayCoverage, recurring] = await Promise.all([
    prisma.spendEntry.findMany({
      where: { shopId: shop.id, ...spendSourceWhere, amount: { gt: 0 } },
      orderBy: { periodStart: "desc" },
      take: 20,
    }),
    loadSpendDayCoverage(shop.id, sampleDesk.enabled),
    sampleDesk.enabled ? Promise.resolve([]) : listRecurringSpend(shop.id),
  ]);

  const entries = entryRows.map((entry) => ({
    id: entry.id,
    channel: entry.channel,
    customKey: entry.customKey,
    note: entry.note,
    amount: toMoneyNumber(entry.amount),
    source: entry.source,
    dateKey: entry.periodStart.toISOString().slice(0, 10),
  }));

  const editId = url.searchParams.get("edit");
  let editing = editId ? entries.find((row) => row.id === editId) ?? null : null;
  if (editId && !editing) {
    const row = await prisma.spendEntry.findFirst({
      where: { id: editId, shopId: shop.id },
    });
    if (row) {
      editing = {
        id: row.id,
        channel: row.channel,
        customKey: row.customKey,
        note: row.note,
        amount: toMoneyNumber(row.amount),
        source: row.source,
        dateKey: row.periodStart.toISOString().slice(0, 10),
      };
    }
  }

  const explicitExRange = url.searchParams.get("exRange");
  const historyFirstEmpty =
    entries.length === 0 && !sampleDesk.enabled && !shotMode;
  const tiedExplorer =
    explicitExRange || historyFirstEmpty
      ? null
      : explorerQueryMatchingScoreboard(preset, periodRange, timeZone);
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
    void runSalesFactsBackfill(admin, shop.id, { maxDays: 2 }).catch(() => {});
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

  const requestedDate = url.searchParams.get("date");
  const fillDateKey =
    typeof requestedDate === "string" &&
    isSpendYmd(requestedDate) &&
    requestedDate >= spendHistoryFloorKey &&
    requestedDate <= todayKey
      ? requestedDate
      : yesterdayKey;

  return {
    entries,
    editing,
    recurring,
    sampleDesk,
    shotMode,
    dayCoverage,
    preset,
    addSpendChannels: addSpendSelectOptions(entitlements),
    spendHistoryFloorKey,
    spendHistoryYearsBack: SALES_DAY_FACT_WINDOW_YEARS_BACK,
    todayKey,
    yesterdayKey,
    currencyCode,
    explorer,
    fillDateKey,
  };
};

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
  const currency = shopCurrencyCode(shop.currencyCode);

  if (
    (intent === "manual" || intent === "recurring" || intent === "delete-entry") &&
    sampleOn
  ) {
    await setSampleDeskEnabled(shop.id, false);
  }

  if (intent === "delete-entry") {
    return deleteSpendEntry({
      shopId: shop.id,
      entryId: String(form.get("entryId") ?? ""),
    });
  }

  if (intent === "stop-recurring") {
    const todayKey = shop.ianaTimezone
      ? shopLocalDayKey(new Date(), shop.ianaTimezone)
      : localDayKey(new Date());
    await stopRecurringSpend({
      shopId: shop.id,
      ruleId: String(form.get("ruleId") ?? ""),
      throughDateKey: previousSpendYmd(todayKey),
    });
    return { error: null, success: true };
  }

  const channel = String(form.get("channel") ?? "meta");
  const amount = roundMoney(parseFloat(String(form.get("amount") ?? "0")));
  const customName = String(form.get("customName") ?? "").trim();
  const spendDate = String(form.get("spendDate") ?? "").trim();

  if (!(SPEND_CHANNELS as readonly string[]).includes(channel)) {
    return { error: "Invalid channel", success: false };
  }
  if (!canUseChannel(entitlements, channel)) {
    return { error: PRO_UPSELL.channels, success: false };
  }
  if (channel === "other" && !customName) {
    return { error: CUSTOM_CHANNEL_NAME_ERROR, success: false };
  }
  if (intent === "recurring") {
    if (!Number.isFinite(amount) || amount <= 0) {
      return { error: "Enter a positive spend amount", success: false };
    }
  } else if (!Number.isFinite(amount) || amount < 0) {
    return { error: "Enter a spend amount (0 clears the day)", success: false };
  }

  const customKey =
    channel === "other" ? slugCustomChannelName(customName) : "";
  const note = channel === "other" ? customName : null;

  if (intent === "recurring") {
    if (!spendDate) {
      return { error: "Pick the first day for this daily amount.", success: false };
    }
    await startRecurringSpend({
      shopId: shop.id,
      channel: channel as SpendChannel,
      customKey,
      amount,
      currency,
      startDateKey: spendDate,
      note,
    });
    await materializeRecurringSpendForShop({
      shopId: shop.id,
      currencyCode: shop.currencyCode,
      ianaTimezone: shop.ianaTimezone,
      sampleOn: false,
    });
    return { error: null, success: true };
  }

  if (!isSpendYmd(spendDate)) {
    return { error: "Pick the day this spend happened.", success: false };
  }
  const repository = createSpendRepository();
  await repository.upsertSpendDays(shop.id, [
    {
      date: spendDate,
      channel,
      amount,
      currency,
      source: "manual",
      customKey,
      note: note ?? undefined,
    },
  ]);

  return { error: null, success: true };
};

export default function SpendEntryPage() {
  const {
    entries,
    editing,
    recurring,
    sampleDesk,
    shotMode,
    dayCoverage,
    addSpendChannels,
    spendHistoryFloorKey,
    spendHistoryYearsBack,
    todayKey,
    yesterdayKey,
    fillDateKey,
    currencyCode,
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
  const importHref = deskNavHref("/app/spend/import", {
    period: preset,
    shot: shotMode,
  });
  const money = (n: number) => formatSpendAmount(n, currencyCode);
  const coverageThroughYesterday = useMemo(() => {
    const days = dayCoverage.days.filter((d) => d.dateKey !== todayKey);
    const missing = days.filter((d) => !d.filled).map((d) => d.dateKey);
    return {
      missing,
      upToDate: days.length > 0 && missing.length === 0,
    };
  }, [dayCoverage.days, todayKey]);
  const coverageClosedDays = dayCoverage.days.filter(
    (d) => d.dateKey !== todayKey,
  );
  const coverageFromKey = coverageClosedDays[0]?.dateKey;
  const coverageToKey =
    coverageClosedDays[coverageClosedDays.length - 1]?.dateKey;
  const stripDays = coverageClosedDays;
  const manualSaved = Boolean(actionData?.success && !actionData.csv);

  return (
    <s-page heading={PRODUCT_NOUN.uploadSpend} inlineSize="large">
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
            <PeriodControl
              preset={preset}
              shotMode={shotMode}
              language="spend"
            />
          </div>
        </div>

        {manualSaved ? (
          <s-banner tone="success" heading="Spend saved">
            <s-paragraph>
              <s-link href={overviewHref}>{PRODUCT_NOUN.openTotalRoas}</s-link>
              {" · "}or add another day below.
            </s-paragraph>
          </s-banner>
        ) : null}

        {actionData && !actionData.success && actionData.error ? (
          <s-banner tone="critical" heading="Could not save spend">
            <s-paragraph>{actionData.error}</s-paragraph>
          </s-banner>
        ) : null}

        <div className="mcfly-spend-lean__stack">
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
            Shopify sales are already here. Empty spend is $0
            {currencyCode !== "USD" ? ` · amounts are ${currencyCode}` : ""}
            {isEmpty && !sampleDesk.enabled
              ? ". No ad-account login — type yesterday, set a daily amount, or import a CSV."
              : "."}
          </p>

          <section
            id="mcfly-spend-add"
            className="mcfly-panel mcfly-panel--eq-compact"
            aria-label="Add a day of spend"
          >
            <div className="mcfly-panel__head mcfly-panel__head--tight">
              <h2>{editing ? "Edit this day" : "Add a day"}</h2>
              <p className="mcfly-panel__muted">
                One channel, one date, one amount. Same day + channel replaces.
              </p>
            </div>
            <Form
              method="post"
              className="mcfly-spend-add__form"
              key={editing?.id ?? "new-day"}
            >
              <input type="hidden" name="intent" value="manual" />
              <div className="mcfly-spend-add__grid">
                <label className="mcfly-spend-add__field">
                  <span>Date</span>
                  <input
                    className="mcfly-field"
                    type="date"
                    name="spendDate"
                    defaultValue={editing?.dateKey ?? fillDateKey}
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
                    defaultValue={
                      editing && isSpendChannel(editing.channel)
                        ? editing.channel
                        : "meta"
                    }
                    aria-label="Spend channel"
                  >
                    {addSpendChannels.map((opt) => (
                      <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="mcfly-spend-add__field">
                  <span>Amount ({currencyCode})</span>
                  <input
                    className="mcfly-field"
                    type="number"
                    name="amount"
                    min="0"
                    step="0.01"
                    inputMode="decimal"
                    defaultValue={editing ? String(editing.amount) : ""}
                    required
                    aria-label={`Spend amount in ${currencyCode}`}
                  />
                </label>
                <label className="mcfly-spend-add__field">
                  <span>Name if something else</span>
                  <input
                    className="mcfly-field"
                    name="customName"
                    defaultValue={
                      editing?.channel === "other" ? (editing.note ?? "") : ""
                    }
                    placeholder="Billboard, radio, agency…"
                    maxLength={48}
                    aria-label="Custom channel name"
                  />
                </label>
              </div>
              <div className="mcfly-spend-add__actions">
                <button
                  type="submit"
                  className="mcfly-btn mcfly-btn--primary mcfly-spend-submit"
                  disabled={isSubmitting && submittingIntent === "manual"}
                  aria-busy={isSubmitting && submittingIntent === "manual"}
                >
                  {isSubmitting && submittingIntent === "manual"
                    ? "Saving…"
                    : editing
                      ? "Save change"
                      : "Save day"}
                </button>
              </div>
            </Form>
          </section>

          <HashDetails
            id="mcfly-spend-recurring"
            className="mcfly-panel mcfly-panel--eq-compact mcfly-spend-reveal"
            defaultOpen={recurring.length > 0}
            summary={
              <>
                <span className="mcfly-spend-reveal__title">
                  Daily amount until I change it
                </span>
                <span className="mcfly-spend-reveal__hint">
                  Meta {money(40)}/day from a date. Typed days are corrections.
                </span>
              </>
            }
          >
            <p className="mcfly-panel__muted">
              Example: Meta, {money(40)} a day from a date. Typed days are
              corrections. No ad login.
            </p>
            <Form method="post" className="mcfly-spend-add__form">
              <input type="hidden" name="intent" value="recurring" />
              <div className="mcfly-spend-add__grid">
                <label className="mcfly-spend-add__field">
                  <span>First day</span>
                  <input
                    className="mcfly-field"
                    type="date"
                    name="spendDate"
                    defaultValue={yesterdayKey}
                    min={spendHistoryFloorKey}
                    max={todayKey}
                    required
                  />
                </label>
                <label className="mcfly-spend-add__field">
                  <span>Channel</span>
                  <select className="mcfly-field" name="channel" defaultValue="meta">
                    {addSpendChannels.map((opt) => (
                      <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="mcfly-spend-add__field">
                  <span>Amount per day ({currencyCode})</span>
                  <input
                    className="mcfly-field"
                    type="number"
                    name="amount"
                    min="0.01"
                    step="0.01"
                    inputMode="decimal"
                    required
                    aria-label={`Daily spend amount in ${currencyCode}`}
                  />
                </label>
                <label className="mcfly-spend-add__field">
                  <span>Name if something else</span>
                  <input
                    className="mcfly-field"
                    name="customName"
                    placeholder="Billboard, radio, agency…"
                    maxLength={48}
                  />
                </label>
              </div>
              <div className="mcfly-spend-add__actions">
                <button
                  type="submit"
                  className="mcfly-btn mcfly-btn--primary mcfly-spend-submit"
                  disabled={isSubmitting && submittingIntent === "recurring"}
                  aria-busy={isSubmitting && submittingIntent === "recurring"}
                >
                  {isSubmitting && submittingIntent === "recurring"
                    ? "Saving…"
                    : "Start daily amount"}
                </button>
              </div>
            </Form>
            {recurring.length > 0 ? (
              <ul className="mcfly-spend-lean__recent" aria-label="Active daily amounts">
                {recurring.map((rule) => (
                  <li className="mcfly-spend-lean__recent-row" key={rule.id}>
                    <span className="mcfly-spend-lean__recent-channel">
                      {formatSpendEntryChannelLabel(rule.channel, rule.note)}
                    </span>
                    <span className="mcfly-spend-lean__recent-amount">
                      {money(rule.amount)}/day
                    </span>
                    <span className="mcfly-spend-lean__recent-range">
                      from {formatSpendYmd(rule.startDateKey)}
                    </span>
                    <Form method="post" className="mcfly-spend-lean__recent-actions">
                      <input type="hidden" name="intent" value="stop-recurring" />
                      <input type="hidden" name="ruleId" value={rule.id} />
                      <button type="submit" className="mcfly-btn mcfly-btn--secondary">
                        Stop
                      </button>
                    </Form>
                  </li>
                ))}
              </ul>
            ) : null}
          </HashDetails>

          <p>
            <s-link href={importHref}>Import or backfill</s-link>
            {" — template, Ads Manager CSV, or spread one bill across days."}
          </p>

          <section
            className="mcfly-panel mcfly-panel--eq-compact mcfly-spend-cal"
            aria-label="Days with spend"
          >
            <div className="mcfly-spend-cal__meta">
              <h2>Coverage</h2>
              <p className="mcfly-panel__muted">
                Last {stripDays.length} closed days
                {coverageFromKey && coverageToKey
                  ? ` · ${formatSpendYmd(coverageFromKey)} → ${formatSpendYmd(coverageToKey)}`
                  : ""}
                {" · "}
                {dayCoverage.total}-day window. Empty cells open Add a day. Days
                with no row are $0.
              </p>
            </div>
            <div className="mcfly-spend-cal__strip" role="list">
              {stripDays.map((day) =>
                day.filled ? (
                  <div
                    key={day.dateKey}
                    className="mcfly-spend-cal__day mcfly-spend-cal__day--filled"
                    role="listitem"
                    title={`${day.dateKey} has spend`}
                  >
                    <span className="mcfly-spend-cal__tick" />
                    <span className="mcfly-spend-cal__label">{day.label}</span>
                  </div>
                ) : (
                  <Link
                    key={day.dateKey}
                    className="mcfly-spend-cal__day mcfly-spend-cal__day--empty"
                    role="listitem"
                    to={spendFillDayHref(day.dateKey, {
                      period: preset,
                      shot: shotMode,
                    })}
                    title={`${day.dateKey} empty ($0) — add spend`}
                  >
                    <span className="mcfly-spend-cal__tick" />
                    <span className="mcfly-spend-cal__label">{day.label}</span>
                  </Link>
                ),
              )}
            </div>
            <div className="mcfly-spend-cal__legend">
              <span className="mcfly-spend-cal__legend-item">
                <span className="mcfly-spend-cal__day mcfly-spend-cal__day--filled mcfly-spend-cal__day--swatch">
                  <span className="mcfly-spend-cal__tick" />
                </span>
                Has spend
              </span>
              <span className="mcfly-spend-cal__legend-item">
                <span className="mcfly-spend-cal__day mcfly-spend-cal__day--empty mcfly-spend-cal__day--swatch">
                  <span className="mcfly-spend-cal__tick" />
                </span>
                Empty = $0
              </span>
            </div>
          </section>

          <HashDetails
            id="mcfly-spend-explorer"
            className="mcfly-panel mcfly-panel--eq-compact mcfly-spend-explorer mcfly-spend-reveal"
            defaultOpen={false}
            summary={
              <>
                <span className="mcfly-spend-reveal__title">
                  Daily spend by channel
                </span>
                <span className="mcfly-spend-reveal__hint">
                  {isEmpty
                    ? "Chart of closed days — optional"
                    : "Same dates as Overview"}
                </span>
              </>
            }
          >
            <p className="mcfly-panel__muted">
              {isEmpty
                ? "Ninety closed days so you can see where history is missing. Same date buttons as Overview."
                : "Spend you added next to Shopify sales for this period — same dates as Overview."}
            </p>
            <SpendExplorer
              series={explorer}
              period={preset}
              shotMode={shotMode}
              basePath="/app/spend"
              compare
              variant="spend"
            />
          </HashDetails>

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
                {coverageThroughYesterday.missing.length > 0 ? (
                  <>
                    {" · "}
                    <s-link href={`${importHref}#mcfly-spend-platforms`}>
                      import missing days
                    </s-link>
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
              {entries.map((entry) => {
                const editHref = deskNavHref("/app/spend", {
                  period: preset,
                  shot: shotMode,
                });
                const editUrl = `${editHref}${editHref.includes("?") ? "&" : "?"}edit=${encodeURIComponent(entry.id)}#mcfly-spend-add`;
                return (
                  <li className="mcfly-spend-lean__recent-row" key={entry.id}>
                    <span
                      className={`mcfly-spend-dot mcfly-spend-dot--${entry.channel}`}
                      aria-hidden="true"
                    />
                    <span className="mcfly-spend-lean__recent-channel">
                      {formatSpendEntryChannelLabel(entry.channel, entry.note)}
                    </span>
                    <span className="mcfly-spend-lean__recent-amount">
                      {money(entry.amount)}
                    </span>
                    <span className="mcfly-spend-lean__recent-range">
                      {formatSpendYmd(entry.dateKey)}
                    </span>
                    <span className="mcfly-spend-lean__recent-actions">
                      <Link className="mcfly-btn mcfly-btn--secondary" to={editUrl}>
                        Edit
                      </Link>
                      <Form method="post">
                        <input type="hidden" name="intent" value="delete-entry" />
                        <input type="hidden" name="entryId" value={entry.id} />
                        <button type="submit" className="mcfly-btn mcfly-btn--secondary">
                          Delete
                        </button>
                      </Form>
                    </span>
                  </li>
                );
              })}
            </ul>
          ) : null}
          {entries.length > 0 ? (
            <p className="mcfly-panel__muted">
              Edit overwrites that day. Delete removes the row — an active daily
              amount will fill it again. Save $0 on a day to keep it empty.
            </p>
          ) : null}
        </div>
      </div>
      <p className="mcfly-overview-more" aria-label="Marketing tools">
        <s-link href={`/app/allocation?period=${preset}`}>
          {PRODUCT_NOUN.spendAllocation}
        </s-link>
        {" · "}
        <s-link href={`/app/advanced?period=${preset}`}>
          {PRODUCT_NOUN.advancedMetrics}
        </s-link>
      </p>
    </s-page>
  );
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
