import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type {
  ActionFunctionArgs,
  HeadersFunction,
  LoaderFunctionArgs,
} from "react-router";
import { Form, Link, useActionData, useLoaderData, useNavigation } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import {
  SPEND_CHANNELS,
  SPEND_CHANNEL_LABELS,
  type SpendChannel,
} from "@mcfly/mer-engine";
import { PeriodControl } from "../components/PeriodControl";
import { DeskRouteErrorBoundary } from "../components/DeskRouteErrorBoundary";
import { MarketingSnapSection } from "../components/MarketingSnapSection";
import {
  buildDashboardMetrics,
  ensureShop,
  getOrCreateSettings,
} from "../lib/mer-dashboard.server";
import { requireAdmin } from "../lib/public-app-gate.server";
import { scheduleFirstSessionShopifyWindow } from "../lib/first-session-shopify-window.server";
import { channelFillKey } from "../lib/channel-fill";
import { parseSalesBasis } from "../lib/sales-basis";
import {
  loadDeskSalesForPeriod,
  salesDayFactWindowStartUtc,
  SALES_DAY_FACT_WINDOW_YEARS_BACK,
} from "../lib/sales-facts.server";
import {
  deskPeriodTimeZone,
  parsePeriodPreset,
  resolvePeriod,
} from "../lib/periods";
import { deskNavHref } from "../lib/desk-nav";
import { shopLocalDayKey } from "../lib/shop-local-day";
import { isSpendYmd } from "../lib/spend-day-entry";
import { slugCustomChannelName } from "../lib/spend-custom-channel";
import { isSpendChannel } from "../lib/spend-billing";
import { createSpendRepository } from "../lib/spend-repository.server";
import {
  fetchSampleSales,
  getSampleDeskEnabled,
  getSampleDeskStats,
  localDayKey,
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
import { SPEND_BACKFILL_DOOR } from "../lib/spend-doors";
import {
  continueDailyCheckedDefault,
  shouldContinueDailyAmount,
} from "../lib/spend-continue-daily";
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
import { spendEntrySourceLabel } from "../lib/spend-source-label";
import {
  recurringFillConfirmRequiredError,
  recurringFillDayCount,
  recurringFillNeedsConfirm,
  recurringFillPreviewCopy,
} from "../lib/recurring-fill-preview";
import { SAMPLE_LEDGER_HANDOFF } from "../lib/sample-live-handoff";

const CUSTOM_CHANNEL_NAME_ERROR = "Name this channel (e.g. Influencers).";

const SPEND_UPLOAD_CONTRAST =
  "Shopify Analytics shows sales, not a spend ledger. This page records typed, uploaded, or daily-rate spend — not Ads Manager login.";

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
  const { admin, session } = await requireAdmin(request);
  const shop = await ensureShop(session.shop);
  const url = new URL(request.url);
  const shotMode = url.searchParams.get("shot") === "1";
  const preset = parsePeriodPreset(url.searchParams.get("period"));
  const sampleDesk = await getSampleDeskStats(shop.id);
  const now = new Date();
  const timeZone = deskPeriodTimeZone(sampleDesk.enabled, shop.ianaTimezone);
  const currencyCode = shopCurrencyCode(shop.currencyCode);
  const spendSourceWhere = sampleDesk.enabled
    ? { source: "sample" as const }
    : { source: { not: "sample" } };
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

  const entitlements = getShopEntitlements(session.shop, {
    sampleDesk: sampleDesk.enabled,
    paidPro: shop.proBillingActive,
  });

  const requestedDate = url.searchParams.get("date");
  const fillDateKey =
    typeof requestedDate === "string" &&
    isSpendYmd(requestedDate) &&
    requestedDate >= spendHistoryFloorKey &&
    requestedDate <= todayKey
      ? requestedDate
      : yesterdayKey;

  /**
   * Empty Live: input only. After one typed day (or SAMPLE / listing shot),
   * load the same sales÷spend spine so this page can paint Total ROAS + mix.
   */
  const strangerEmptyLoader =
    entries.length === 0 && !sampleDesk.enabled && !shotMode;
  let metrics: Awaited<ReturnType<typeof buildDashboardMetrics>> | null = null;
  let salesError: string | null = null;
  if (!strangerEmptyLoader) {
    const settings = await getOrCreateSettings(shop.id);
    const range = resolvePeriod(preset, now, timeZone);
    if (sampleDesk.enabled) {
      const sales = await fetchSampleSales(shop.id, range);
      metrics = await buildDashboardMetrics(session.shop, range, sales, {
        salesBasis: parseSalesBasis(settings.salesBasis, "total"),
      });
    } else {
      void scheduleFirstSessionShopifyWindow(admin, shop.id);
      const desk = await loadDeskSalesForPeriod({
        admin,
        shopId: shop.id,
        range,
        ianaTimezone: shop.ianaTimezone,
      });
      salesError = desk.salesError;
      metrics = await buildDashboardMetrics(session.shop, range, desk.sales, {
        salesBasis: parseSalesBasis(settings.salesBasis, "total"),
        salesCoverage: desk.factsCoverage,
      });
    }
  }

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
    fillDateKey,
    metrics,
    salesError,
  };
};

export const action = async ({ request }: ActionFunctionArgs): Promise<SpendActionData> => {
  const { session } = await requireAdmin(request);
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
    const todayKey = shop.ianaTimezone
      ? shopLocalDayKey(new Date(), shop.ianaTimezone)
      : localDayKey(new Date());
    const throughYmd = previousSpendYmd(todayKey);
    const dayCount = recurringFillDayCount(spendDate, throughYmd);
    if (
      recurringFillNeedsConfirm(dayCount) &&
      String(form.get("confirm_long_fill") ?? "") !== "1"
    ) {
      return {
        error: recurringFillConfirmRequiredError(dayCount, spendDate, throughYmd),
        success: false,
      };
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
  const continueDaily = String(form.get("continueDaily") ?? "") === "1";
  const editingRow = String(form.get("editing") ?? "") === "1";
  const startDaily = shouldContinueDailyAmount({
    continueDaily,
    editing: editingRow,
    amount,
  });
  if (startDaily) {
    const todayKey = shop.ianaTimezone
      ? shopLocalDayKey(new Date(), shop.ianaTimezone)
      : localDayKey(new Date());
    const throughYmd = previousSpendYmd(todayKey);
    const dayCount = recurringFillDayCount(spendDate, throughYmd);
    if (
      recurringFillNeedsConfirm(dayCount) &&
      String(form.get("confirm_long_fill") ?? "") !== "1"
    ) {
      return {
        error: recurringFillConfirmRequiredError(dayCount, spendDate, throughYmd),
        success: false,
      };
    }
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

  if (startDaily) {
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
  }

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
    metrics,
    salesError,
  } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";
  const submittingIntent =
    navigation.formData?.get("intent")?.toString() ?? null;
  const isEmpty = entries.length === 0;
  /**
   * Stranger on Live data with nothing typed yet: the page is the three doors
   * and one honesty sentence. Coverage, chart, and status only earn room once
   * a day of spend exists.
   */
  const strangerEmpty = isEmpty && !sampleDesk.enabled && !shotMode;
  const roasHref = deskNavHref("/app/roas", {
    period: preset,
    shot: shotMode,
  });
  const importHref = deskNavHref("/app/spend/import", {
    period: preset,
    shot: shotMode,
  });
  const money = (n: number) => formatSpendAmount(n, currencyCode);
  const [recurringStart, setRecurringStart] = useState(yesterdayKey);
  const [recurringAmount, setRecurringAmount] = useState("");
  const recurringPreview = recurringFillPreviewCopy({
    fromYmd: recurringStart,
    throughYmd: yesterdayKey,
    amount: Number.parseFloat(recurringAmount),
    currency: currencyCode,
  });
  /** Route doors keep the date slicer; in-page doors stay plain anchors. */
  const doorHref = (href: string) =>
    href.startsWith("#")
      ? href
      : deskNavHref(href, { period: preset, shot: shotMode });
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
  const hasPeriodSpend = Boolean(metrics && metrics.totalSpend > 0);
  const periodChannels = metrics
    ? [...metrics.channelMix]
        .filter((entry) => entry.amount > 0)
        .sort((a, b) => b.amount - a.amount)
        .map((entry) => {
          const name = spendChannelLabel({
            channel: entry.channel,
            customLabel: entry.customLabel,
          });
          return {
            name,
            amount: entry.amount,
            share: entry.share,
            fill: channelFillKey(name),
          };
        })
    : [];

  return (
    <s-page heading="Spend Upload" inlineSize="large">
      {isEmpty && !shotMode ? (
        <s-button
          slot="primary-action"
          variant="primary"
          href="#mcfly-spend-add"
          aria-label="Add yesterday’s spend"
        >
          Add yesterday
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
        {shotMode ? (
          <div className="mcfly-ctx" aria-live="polite">
            <div className="mcfly-ctx__main">
              <PeriodControl
                preset={preset}
                shotMode={shotMode}
                language="spend"
              />
            </div>
          </div>
        ) : null}

        {manualSaved ? (
          <s-banner tone="success" heading="Spend saved">
            <s-paragraph>
              Your saved spend is ready for {PRODUCT_NOUN.totalRoas}.
              {" · "}
              <s-link href={roasHref}>Same numbers on Total ROAS</s-link>
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
          {sampleDesk.enabled && !shotMode ? (
            <s-banner tone="info" heading="Example spend is on">
              <s-paragraph>
                {SAMPLE_LEDGER_HANDOFF}{" "}
                <s-link href="/app/settings">Switch to Live in Settings</s-link>
                {" "}without typing a day if you only want this shop’s sales.
              </s-paragraph>
            </s-banner>
          ) : null}
          <p className="mcfly-spend-helper">
            {SPEND_UPLOAD_CONTRAST} Shopify sales are already here. Empty spend
            is not a certified $0 — add a day. A deleted day stays $0. Empty
            spend is never 0×
            {currencyCode !== "USD" ? ` · amounts are ${currencyCode}` : ""}
            {strangerEmpty
              ? ". Type yesterday — that $X/day continues until you change it. No ad-account login."
              : "."}
          </p>

          {strangerEmpty || !metrics ? null : (
            <MarketingSnapSection
              spendOnlyEmpty={!hasPeriodSpend}
              spendHref="#mcfly-spend-add"
              roasHref={roasHref}
              preset={preset}
              totalSales={metrics.sales}
              totalSpend={metrics.totalSpend}
              mer={metrics.mer}
              targetMer={metrics.targetMer}
              periodLabel={metrics.period.label}
              salesPending={Boolean(metrics.salesPending || salesError)}
              merDeltaLine={null}
              spendDeltaLine={null}
              periodChannels={periodChannels}
            />
          )}

          {recurring.length > 0 ? (
            <section
              className="mcfly-panel mcfly-panel--eq-compact"
              aria-label="Daily amount until I change it"
            >
              <div className="mcfly-panel__head mcfly-panel__head--tight">
                <h2>Daily amount</h2>
                <p className="mcfly-panel__muted">
                  Continues every day until you change or stop it. Typed or
                  uploaded days stay as written.
                </p>
              </div>
              <ul className="mcfly-spend-lean__recent" aria-label="Active daily amounts">
                {recurring.map((rule) => (
                  <li className="mcfly-spend-lean__recent-row" key={rule.id}>
                    <span className="mcfly-spend-lean__recent-channel">
                      {formatSpendEntryChannelLabel(rule.channel, rule.note)}
                    </span>
                    <Form
                      method="post"
                      className="mcfly-spend-lean__recent-actions mcfly-spend-rate-edit"
                    >
                      <input type="hidden" name="intent" value="recurring" />
                      <input type="hidden" name="channel" value={rule.channel} />
                      <input
                        type="hidden"
                        name="spendDate"
                        value={rule.startDateKey}
                      />
                      {rule.channel === "other" && rule.note ? (
                        <input type="hidden" name="customName" value={rule.note} />
                      ) : null}
                      <label className="mcfly-spend-rate-edit__amount">
                        <span className="visually-hidden">
                          Daily amount ({currencyCode})
                        </span>
                        <input
                          className="mcfly-field"
                          type="number"
                          name="amount"
                          min="0.01"
                          step="0.01"
                          inputMode="decimal"
                          defaultValue={String(rule.amount)}
                          required
                          aria-label={`Daily amount in ${currencyCode}`}
                        />
                      </label>
                      <span className="mcfly-spend-lean__recent-range">
                        /day from {formatSpendYmd(rule.startDateKey)}
                      </span>
                      <button
                        type="submit"
                        className="mcfly-btn mcfly-btn--secondary"
                        disabled={isSubmitting && submittingIntent === "recurring"}
                      >
                        Save
                      </button>
                    </Form>
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
            </section>
          ) : null}

          <section
            id="mcfly-spend-add"
            className="mcfly-panel mcfly-panel--eq-compact"
            aria-label={
              editing
                ? "Edit this day of spend"
                : "Yesterday’s spend — one bill"
            }
          >
            <div className="mcfly-panel__head mcfly-panel__head--tight">
              <h2>
                {editing
                  ? "Edit this day"
                  : fillDateKey === yesterdayKey
                    ? "Yesterday"
                    : "Add a day"}
              </h2>
              <p className="mcfly-panel__muted">
                {editing
                  ? "One channel, one date, one amount. Same day + channel replaces."
                  : `One bill for ${formatSpendYmd(fillDateKey)}. Continues at that $X/day until you change it.`}
              </p>
            </div>
            <Form
              method="post"
              className="mcfly-spend-add__form"
              key={editing?.id ?? "new-day"}
            >
              <input type="hidden" name="intent" value="manual" />
              {editing ? <input type="hidden" name="editing" value="1" /> : null}
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
              {!editing ? (
                <label className="mcfly-spend-add__continue">
                  <input
                    type="checkbox"
                    name="continueDaily"
                    value="1"
                    defaultChecked={continueDailyCheckedDefault(Boolean(editing))}
                  />{" "}
                  Continue this $X/day until I change it
                </label>
              ) : null}
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
                      : "Save $X/day"}
                </button>
              </div>
            </Form>
          </section>

          <HashDetails
            id="mcfly-spend-recurring"
            className="mcfly-panel mcfly-panel--eq-compact mcfly-spend-reveal"
            defaultOpen={false}
            summary={
              <>
                <span className="mcfly-spend-reveal__title">
                  Change the daily amount from another first day
                </span>
                <span className="mcfly-spend-reveal__hint">
                  Example: {money(40)}/day from a date. Fills empty days through
                  yesterday. Typed, uploaded, or already-filled days stay.
                </span>
              </>
            }
          >
            <p className="mcfly-panel__muted">
              Use this only if the first day is not yesterday. A far-back first
              day writes every empty day in that span.
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
                    value={recurringStart}
                    min={spendHistoryFloorKey}
                    max={todayKey}
                    required
                    onChange={(event) => setRecurringStart(event.target.value)}
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
                    value={recurringAmount}
                    onChange={(event) => setRecurringAmount(event.target.value)}
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
              <p className="mcfly-panel__muted" role="status">
                {recurringPreview.body}
              </p>
              {recurringPreview.needsConfirm ? (
                <label className="mcfly-spend-add__field">
                  <input
                    type="checkbox"
                    name="confirm_long_fill"
                    value="1"
                    required
                  />{" "}
                  Write {recurringPreview.dayCount} days from {recurringStart}{" "}
                  through yesterday
                </label>
              ) : null}
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
          </HashDetails>

          <HashDetails
            id="mcfly-spend-backfill"
            className="mcfly-panel mcfly-panel--eq-compact mcfly-spend-reveal"
            defaultOpen={false}
            summary={
              <>
                <span className="mcfly-spend-reveal__title">
                  {SPEND_BACKFILL_DOOR.title}
                </span>
                <span className="mcfly-spend-reveal__hint">
                  {SPEND_BACKFILL_DOOR.hint}
                </span>
              </>
            }
          >
            <p className="mcfly-panel__muted">
              Template, Ads Manager CSV, or spread one bill across days. Use
              this after yesterday’s amount is on the desk.
            </p>
            <p>
              <s-link href={doorHref(SPEND_BACKFILL_DOOR.href)}>
                Open {SPEND_BACKFILL_DOOR.title}
              </s-link>
            </p>
          </HashDetails>

          {strangerEmpty ? null : (
            <>
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
                    {dayCoverage.total}-day window. Empty cells open Add a day.
                    Days with no row have no spend entered. A deleted day stays
                    $0.
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
                        <span className="mcfly-spend-cal__label">
                          {day.label}
                        </span>
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
                        title={`${day.dateKey} — no spend entered`}
                      >
                        <span className="mcfly-spend-cal__tick" />
                        <span className="mcfly-spend-cal__label">
                          {day.label}
                        </span>
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
                    No row = none entered
                  </span>
                </div>
              </section>

              <div className="mcfly-spend-lean__status" role="status">
                {sampleDesk.enabled ? (
                  <>
                    <p className="mcfly-spend-lean__status-line">
                      Sample data is loaded
                      {entries.length > 0
                        ? ` · ${entries.length.toLocaleString()} recent rows shown`
                        : ""}
                      . {SAMPLE_LEDGER_HANDOFF}
                    </p>
                    <p className="mcfly-spend-lean__status-foot">
                      Live data is this shop’s Shopify sales plus the spend you
                      add.
                    </p>
                  </>
                ) : coverageThroughYesterday.upToDate ? (
                  <p className="mcfly-spend-lean__status-line">
                    ✓ Up to date through yesterday
                  </p>
                ) : entries.length === 0 ? (
                  <p className="mcfly-spend-lean__status-line">
                    No spend on Live data yet. Add yesterday’s Meta and a
                    billboard — no spend entered, not a certified $0.
                  </p>
                ) : (
                  <p className="mcfly-spend-lean__status-line">
                    Your spend is on the desk. Days with no row have no spend
                    entered — a deleted day stays $0. Last month is enough to
                    start
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
                    Backdate to {spendHistoryFloorKey} (
                    {spendHistoryYearsBack} years) — same window as Shopify
                    sales. Same day + channel or named extra replaces.
                  </p>
                )}
              </div>
            </>
          )}

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
                    <span className="mcfly-spend-lean__recent-source">
                      {spendEntrySourceLabel(entry.source)}
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
              Edit overwrites that day. Delete keeps the day empty — an active
              daily rate will not put it back.
            </p>
          ) : null}
        </div>
      </div>
      {entries.length > 0 ? (
        <p className="mcfly-overview-more" aria-label="Marketing tools">
          <s-link href="/app/roas">{PRODUCT_NOUN.totalRoas}</s-link>
          {" · "}
          <s-link href={`/app/allocation?period=${preset}`}>
            {PRODUCT_NOUN.spendAllocation}
          </s-link>
        </p>
      ) : null}
    </s-page>
  );
}

export function ErrorBoundary() {
  return <DeskRouteErrorBoundary retryHref="/app/spend" />;
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
