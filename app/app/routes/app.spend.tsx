import { useEffect, useLayoutEffect, useMemo, useRef, useState, type Dispatch, type ReactNode, type SetStateAction } from "react";
import type {
  ActionFunctionArgs,
  HeadersFunction,
  LoaderFunctionArgs,
} from "react-router";
import { Form, Link, redirect, useActionData, useLoaderData, useNavigation, useSearchParams } from "react-router";
import { DeskIcon, type DeskIconName } from "../components/DeskIcon";
import { DeskLane } from "../components/DeskLane";
import { useDeskDrill } from "../components/DeskDrill";
import { boundary } from "@shopify/shopify-app-react-router/server";
import {
  SPEND_CHANNELS,
  SPEND_CHANNEL_LABELS,
  type SpendChannel,
} from "@mcfly/mer-engine";
import { CertifiedScoreboard } from "../components/CertifiedScoreboard";
import { DualCloseLine } from "../components/DualCloseLine";
import { MarketingSpendRoom } from "../components/MarketingSpendRoom";
import { MonthlyPacing } from "../components/MonthlyPacing";
import { PeriodControl } from "../components/PeriodControl";
import { DeskRouteErrorBoundary } from "../components/DeskRouteErrorBoundary";
import { SpendFindingStrip } from "../components/SpendFindingStrip";
import {
  SpendExplorer,
} from "../components/SpendExplorer";
import { CpaExplorer } from "../components/CpaExplorer";
import { CpaPaybackDesk } from "../components/CpaPaybackDesk";
import { CopyWeekMonthSales } from "../components/MorningHabitStrip";
import { SpendCompareGlance } from "../components/SpendCompareGlance";
import { SpendFirstViewport } from "../components/SpendFirstViewport";
import { CpaWindowCards } from "../components/CpaWindowCards";
import { SpendMixSection, useSpendPanelScroll } from "../components/SpendMixSection";
import { ensureShop } from "../lib/mer-dashboard.server";
import { requireAdmin } from "../lib/public-app-gate.server";
import {
  salesDayFactWindowStartUtc,
  SALES_DAY_FACT_WINDOW_YEARS_BACK,
} from "../lib/sales-facts.server";
import { deskPeriodTimeZone, parsePeriodPreset } from "../lib/periods";
import { deskNavHref } from "../lib/desk-nav";
import { shopLocalDayKey, spendDeskTodayKey } from "../lib/shop-local-day";
import { isSpendYmd } from "../lib/spend-day-entry";
import { slugCustomChannelName } from "../lib/spend-custom-channel";
import { isSpendChannel } from "../lib/spend-billing";
import { createSpendRepository } from "../lib/spend-repository.server";
import {
  getSampleDeskEnabled,
  getSampleDeskStats,
  isSampleOnlyFreeze,
  localDayKey,
  setSampleDeskEnabled,
} from "../lib/sample-desk.server";
import { formatCurrency, formatMer, formatSpendAmount } from "../lib/mer-format";
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
import { overlaySalesOnSpendCoverage } from "../lib/spend-pair-coverage";
import { deleteSpendEntry, handleCsvImport, type SpendActionData } from "../lib/spend-write.server";
import {
  listRecurringSpend,
  materializeRecurringSpendForShop,
  previousSpendYmd,
  startRecurringSpend,
  stopRecurringSpend,
} from "../lib/spend-recurring.server";
import { roundMoney, shopCurrencyCode, toMoneyNumber } from "../lib/spend-money";
import { spendFillDayHref, NUMBER_HONESTY, formatTotalRoasEquation, formatOnlineRoasLine, hasNonOnlineSpendOnFile, spendPairCopyText } from "../lib/number-honesty";
import { spendEntrySourceLabel } from "../lib/spend-source-label";
import {
  recurringFillConfirmRequiredError,
  recurringFillDayCount,
  recurringFillNeedsConfirm,
  recurringFillPreviewCopy,
} from "../lib/recurring-fill-preview";
import { SAMPLE_LEDGER_HANDOFF } from "../lib/sample-live-handoff";
import { HONEST_MER_LINE, spendUploadEmptyFinding } from "../lib/spend-upload-findings";
import { loadSpendAnalysis } from "../lib/desk-spend-stack.server";
import { useDeskCurrency } from "../lib/desk-currency";
import {
  CPA_EMPTY_SPEND,
  CPA_NO_BUYERS,
  type CpaWindowId,
} from "../lib/cpa-desk";
import {
  previewSpendPaste,
  type SpendPasteBook,
} from "../lib/spend-paste-preview";
import {
  SPEND_ANALYTICS_CONTRAST,
  SPEND_DEPTH_LANE_LABEL,
  SPEND_FIRST_LANE_LABEL,
} from "../lib/spend-first-viewport";

const CUSTOM_CHANNEL_NAME_ERROR = "Name this channel (e.g. Influencers).";

const SPEND_UPLOAD_CONTRAST = SPEND_ANALYTICS_CONTRAST;
const SPEND_ADD_LANE_LABEL = "Add a day";

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

function SpendPeek({
  label,
  value,
  sub,
  icon,
  formula,
  next,
  nextHref,
  nextLabel,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: DeskIconName;
  formula: string;
  next: string;
  nextHref: string;
  nextLabel: string;
}) {
  const drill = useDeskDrill();
  const open = () =>
    drill?.openDrill({
      title: label,
      value,
      blocks: [
        { k: "What this is", v: formula },
        sub ? { k: "Also", v: sub } : null,
      ].filter((block): block is { k: string; v: string } => block != null),
      next,
      nextHref,
      nextLabel,
      foot: "This page records spend. Sales ÷ spend is the pair at the top.",
    });
  const body = (
    <>
      <span className="mcfly-kpi__top">
        <DeskIcon name={icon} />
        <span className="mcfly-kpi__label">{label}</span>
      </span>
      <span className="mcfly-kpi__value">{value}</span>
      {sub ? <span className="mcfly-kpi__sub">{sub}</span> : null}
    </>
  );
  return drill ? (
    <button
      type="button"
      className="mcfly-kpi mcfly-kpi--drill mcfly-kpi--peek mcfly-kpi--soft"
      onClick={open}
    >
      {body}
    </button>
  ) : (
    <Link className="mcfly-kpi mcfly-kpi--peek mcfly-kpi--soft" to={nextHref}>
      {body}
    </Link>
  );
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

function SpendAddDayPanel({
  editing,
  fillDateKey,
  yesterdayKey,
  spendHistoryFloorKey,
  todayKey,
  addChannel,
  setAddChannel,
  addSpendChannels,
  currencyCode,
  isSubmitting,
  submittingIntent,
}: {
  editing: {
    id: string;
    channel: string;
    note: string | null;
    amount: number;
    dateKey: string;
  } | null;
  fillDateKey: string;
  yesterdayKey: string;
  spendHistoryFloorKey: string;
  todayKey: string;
  addChannel: SpendChannel;
  setAddChannel: Dispatch<SetStateAction<SpendChannel>>;
  addSpendChannels: Array<{
    value: SpendChannel;
    label: string;
    disabled: boolean;
  }>;
  currencyCode: string;
  isSubmitting: boolean;
  submittingIntent: string | null;
}) {
  return (
    <>
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
              value={addChannel}
              onChange={(event) => {
                const next = event.target.value;
                if (isSpendChannel(next)) setAddChannel(next);
              }}
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
          <label
            className="mcfly-spend-add__field"
            hidden={addChannel !== "other"}
          >
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
    </>
  );
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin, session } = await requireAdmin(request);
  const shop = await ensureShop(session.shop);
  const url = new URL(request.url);
  const shotMode = url.searchParams.get("shot") === "1";
  const preset = parsePeriodPreset(url.searchParams.get("period"));
  if (!shotMode && preset === "y3") {
    const next = new URLSearchParams(url.searchParams);
    next.set("period", "ytd");
    throw redirect(`/app/spend?${next.toString()}`);
  }
  const sampleDesk = await getSampleDeskStats(shop.id);
  const now = new Date();
  const timeZone = deskPeriodTimeZone(sampleDesk.enabled, shop.ianaTimezone);
  const currencyCode = shopCurrencyCode(shop.currencyCode);
  const spendSourceWhere = sampleDesk.enabled
    ? { source: "sample" as const }
    : { source: { not: "sample" } };
  const todayKey = spendDeskTodayKey(timeZone, now);
  const yesterdayKey = previousSpendYmd(todayKey);
  const spendHistoryFloorKey = salesDayFactWindowStartUtc().toISOString().slice(0, 10);

  await materializeRecurringSpendForShop({
    shopId: shop.id,
    currencyCode: shop.currencyCode,
    ianaTimezone: shop.ianaTimezone,
    sampleOn: sampleDesk.enabled,
  });

  const [entryRows, dayCoverage, recurring, analysis] = await Promise.all([
    prisma.spendEntry.findMany({
      where: { shopId: shop.id, ...spendSourceWhere, amount: { gt: 0 } },
      orderBy: { periodStart: "desc" },
      take: 20,
    }),
    loadSpendDayCoverage(shop.id, sampleDesk.enabled, { now, timeZone }),
    sampleDesk.enabled ? Promise.resolve([]) : listRecurringSpend(shop.id),
    loadSpendAnalysis({
      request,
      admin,
      shopDomain: session.shop,
      shop: {
        id: shop.id,
        ianaTimezone: shop.ianaTimezone ?? null,
        currencyCode: shop.currencyCode,
      },
      useSampleDesk: sampleDesk.enabled,
    }),
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
    metrics: analysis.metrics,
    explorer: analysis.explorer,
    cashControl: analysis.cashControl,
    monthPace: analysis.monthPace,
    history: analysis.history,
    windowSets: analysis.windowSets,
    cpa: analysis.cpa,
    certifiedSalesByDay: analysis.certifiedSalesByDay,
    liveBuyerIndex: analysis.liveBuyerIndex,
    salesError: analysis.salesError,
    todaySalesUnavailable: analysis.todaySalesUnavailable,
    todaySalesTruncated: analysis.todaySalesTruncated,
    salesFactsIncomplete: analysis.salesFactsIncomplete,
    factsIncomplete: analysis.factsIncomplete,
    shopifyOrderWindowLimited: analysis.shopifyOrderWindowLimited,
    pairCoverage: analysis.pairCoverage,
    orderBookDepth: analysis.orderBookDepth,
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
    (intent === "manual" ||
      intent === "recurring" ||
      intent === "delete-entry" ||
      intent === "csv") &&
    sampleOn
  ) {
    if (isSampleOnlyFreeze()) {
      return {
        error:
          "Sample mode is locked. Spend stays the Sample shop example book.",
        success: false,
      };
    }
    await setSampleDeskEnabled(shop.id, false);
  }

  if (intent === "csv") {
    return handleCsvImport(shop.id, form, entitlements, currency);
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
    explorer,
    cashControl,
    monthPace,
    history,
    windowSets,
    cpa,
    certifiedSalesByDay,
    liveBuyerIndex,
    salesError,
    todaySalesUnavailable,
    todaySalesTruncated,
    salesFactsIncomplete,
    shopifyOrderWindowLimited,
    pairCoverage,
    orderBookDepth,
  } = useLoaderData<typeof loader>();
  const currency = useDeskCurrency();
  const [searchParams] = useSearchParams();
  const spendPanel = searchParams.get("panel");
  useSpendPanelScroll();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";
  const isLoading = navigation.state === "loading";
  const submittingIntent =
    navigation.formData?.get("intent")?.toString() ?? null;
  const isEmpty = entries.length === 0;
  /**
   * Stranger on Live data with nothing typed yet: coverage and ledger wait.
   * Sales | — | — plus add-a-day still paint (all-size). SAMPLE shows the pair.
   */
  const strangerEmpty = isEmpty && !sampleDesk.enabled && !shotMode;
  const hasSpend = metrics.totalSpend > 0;
  const pairWithheld =
    hasSpend && pairCoverage.withholdRatio && !metrics.salesPending;
  const paintedMer = pairWithheld ? null : metrics.mer;
  /** Live thin / stranger-empty: pair + add-a-day in reach. SAMPLE/shot keep mix·CPA depth open. */
  const emptyLiveSpend = !hasSpend && !sampleDesk.enabled && !shotMode;
  const roasValue =
    hasSpend &&
    !metrics.salesPending &&
    paintedMer != null &&
    Number.isFinite(paintedMer)
      ? `${formatMer(paintedMer)}×`
      : "—";
  const pairEquation = formatTotalRoasEquation({
    sales: metrics.sales,
    spend: metrics.totalSpend,
    mer: paintedMer,
    salesPending: metrics.salesPending,
    currency,
  });
  const pairCopyText = spendPairCopyText({
    sales: metrics.sales,
    spend: metrics.totalSpend,
    mer: paintedMer,
    salesPending: metrics.salesPending,
    currency,
  });
  const onlineLine = hasSpend
    ? formatOnlineRoasLine({
        totalSales: metrics.sales,
        spend: metrics.totalSpend,
        mix: metrics.shopifyDepth.sourceSalesShare,
        currency,
        hasNonOnlineSpend: hasNonOnlineSpendOnFile(metrics.channelMix),
      })
    : null;
  const [cpaSelectedId, setCpaSelectedId] = useState<CpaWindowId>("this_month");
  const cpaSelected =
    cpa.windows.find((window) => window.id === cpaSelectedId) ?? cpa.windows[0]!;
  const cpaPayback = cpa.paybacks[cpaSelected.id];
  const cpaHasSpend = cpa.hasSpend;
  const cpaBuyersMissing =
    cpaSelected.spend > 0 &&
    cpaSelected.buyersKnown &&
    cpaSelected.identifiedBuyers === 0;
  const importHref = deskNavHref("/app/spend/import", {
    period: preset,
    shot: shotMode,
  });
  const money = (n: number) => formatSpendAmount(n, currencyCode);
  const [recurringStart, setRecurringStart] = useState(yesterdayKey);
  const [recurringAmount, setRecurringAmount] = useState("");
  const [addChannel, setAddChannel] = useState(
    editing && isSpendChannel(editing.channel) ? editing.channel : "meta",
  );
  const [pasteText, setPasteText] = useState("");
  useEffect(() => {
    setAddChannel(
      editing && isSpendChannel(editing.channel) ? editing.channel : "meta",
    );
  }, [editing]);
  const recurringPreview = recurringFillPreviewCopy({
    fromYmd: recurringStart,
    throughYmd: yesterdayKey,
    amount: Number.parseFloat(recurringAmount),
    currency: currencyCode,
  });
  const pasteBook: SpendPasteBook = useMemo(
    () => ({
      certifiedSalesByDay,
      buyerDays: cpa.days.map((day) => ({
        dateKey: day.dateKey,
        identifiedBuyers: day.newCustomers + day.returningCustomers,
        newCustomers: day.newCustomers,
        buyersKnown: day.buyersKnown,
      })),
      liveBuyerIndex,
      salesFloorKey: spendHistoryFloorKey,
      salesPending: Boolean(metrics.salesPending),
      first30: cpa.paybackBase.avgRevenueD30,
      first90: cpa.paybackBase.avgRevenueD90,
      first365: cpa.paybackBase.avgRevenueD365,
      historyLimited: cpa.paybackBase.historyLimited,
    }),
    [
      certifiedSalesByDay,
      liveBuyerIndex,
      cpa.days,
      cpa.paybackBase.avgRevenueD30,
      cpa.paybackBase.avgRevenueD90,
      cpa.paybackBase.avgRevenueD365,
      cpa.paybackBase.historyLimited,
      spendHistoryFloorKey,
      metrics.salesPending,
    ],
  );
  const pastePreview = useMemo(
    () => previewSpendPaste(pasteText, pasteBook),
    [pasteText, pasteBook],
  );
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
  const stripDays = overlaySalesOnSpendCoverage(
    coverageClosedDays,
    certifiedSalesByDay,
  );
  const spendSaved = Boolean(actionData?.success);
  const missingCount = coverageThroughYesterday.missing.length;
  const coveragePeekValue = sampleDesk.enabled
    ? "Sample on file"
    : coverageThroughYesterday.upToDate
      ? "Through yesterday"
      : missingCount > 0
        ? `${missingCount} empty`
        : "Add a day";
  const coveragePeekSub =
    coverageFromKey && coverageToKey
      ? `${formatSpendYmd(coverageFromKey)} → ${formatSpendYmd(coverageToKey)}`
      : `${dayCoverage.total}-day window`;
  const dailyPeekValue =
    recurring.length === 0
      ? "None running"
      : recurring.length === 1
        ? `${money(recurring[0].amount)}/day`
        : `${recurring.length} rates`;
  const dailyPeekSub =
    recurring.length === 0
      ? "Continues until you change it"
      : recurring.length === 1
        ? formatSpendEntryChannelLabel(recurring[0].channel, recurring[0].note)
        : recurring
            .map((rule) => formatSpendEntryChannelLabel(rule.channel, rule.note))
            .join(" · ");
  const recentPeekValue = `${entries.length.toLocaleString()} rows`;
  const recentPeekSub = "Typed, uploaded, or daily-rate";
  const coverageHref = deskNavHref("/app/spend", {
    period: preset,
    shot: shotMode,
    hash: "mcfly-spend-coverage",
  });
  const ratesHref = deskNavHref("/app/spend", {
    period: preset,
    shot: shotMode,
    hash: "mcfly-spend-rates",
  });
  const ledgerHref = deskNavHref("/app/spend", {
    period: preset,
    shot: shotMode,
    hash: "mcfly-spend-ledger",
  });

  return (
    <s-page heading="Spend" inlineSize="large">
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
          "mcfly-spend-lean--soft",
          "mcfly-roas--soft",
          shotMode ? "mcfly-desk--shot" : null,
          sampleDesk.enabled ? "mcfly-desk--sample" : null,
          isLoading && !shotMode ? "mcfly-desk--loading" : null,
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {isLoading && !shotMode ? (
          <section className="mcfly-state mcfly-state--loading mcfly-state--soft" aria-live="polite">
            <p className="mcfly-state__copy">Refreshing Spend…</p>
          </section>
        ) : null}

        {salesError && !shotMode ? (
          <section
            className="mcfly-state mcfly-state--critical mcfly-state--soft"
            aria-label="Sales load error"
          >
            <p className="mcfly-state__copy">
              Sales didn’t load. Retry to see Shopify Total Sales next to spend.
            </p>
            <div className="mcfly-state__cta">
              <s-button href={`/app/spend?period=${preset}`} variant="primary">
                Retry
              </s-button>
            </div>
          </section>
        ) : null}

        {metrics.salesPending && !shotMode ? (
          <s-banner tone="info" heading="Sales still loading">
            <s-paragraph>{NUMBER_HONESTY.salesPending}</s-paragraph>
          </s-banner>
        ) : null}

        {shotMode ? (
          <div className="mcfly-ctx" aria-live="polite">
            <div className="mcfly-ctx__main">
              <PeriodControl
                preset={preset}
                shotMode={shotMode}
                language="spend"
                orderBookDepth={orderBookDepth}
              />
            </div>
          </div>
        ) : null}

        {spendSaved ? (
          <s-banner tone="success" heading="Spend saved">
            <s-paragraph>
              Your saved spend is ready for {PRODUCT_NOUN.totalRoas}.
              {cpaHasSpend &&
              cpaSelected.cashCpa != null &&
              Number.isFinite(cpaSelected.cashCpa)
                ? ` Cash CPA is ${formatSpendAmount(cpaSelected.cashCpa, currencyCode)}.`
                : ""}
              {cpaHasSpend && cpaPayback.paybackDays != null
                ? ` Interpolated payback is about ${cpaPayback.paybackDays} days versus the first-90 average — not a recovery date.`
                : ""}
              {" · "}
              <s-link href="#mcfly-roas">Same numbers above</s-link>
              {" · "}or add another day below.
            </s-paragraph>
          </s-banner>
        ) : null}

        {actionData && !actionData.success && actionData.error ? (
          <s-banner tone="critical" heading="Could not save spend">
            <s-paragraph>{actionData.error}</s-paragraph>
          </s-banner>
        ) : null}

        {sampleDesk.enabled && !shotMode ? (
          <s-banner tone="info" heading="Example spend is on">
            <s-paragraph>
              {SAMPLE_LEDGER_HANDOFF}
            </s-paragraph>
          </s-banner>
        ) : null}

        <DeskLane rank="first" label={SPEND_FIRST_LANE_LABEL} hint="">
        <div className="mcfly-overview-first-beat mcfly-spend-first-beat">
          <SpendFirstViewport
            roasValue={roasValue}
            hasSpend={hasSpend}
            sales={metrics.sales}
            totalSpend={metrics.totalSpend}
            salesPending={Boolean(metrics.salesPending)}
            periodLabel={
              metrics.period.label === "Month to date"
                ? "This month"
                : metrics.period.label
            }
            todaySalesTruncated={todaySalesTruncated}
            todaySalesUnavailable={todaySalesUnavailable}
            pairEquation={hasSpend && pairEquation ? pairEquation : null}
            pairCopyText={hasSpend && pairCopyText ? pairCopyText : null}
            shotMode={shotMode}
            cashChips={
              hasSpend && cashControl && cashControl.chips.length > 0
                ? cashControl.chips
                : undefined
            }
            targetMer={cashControl?.targetMer ?? 0}
          />
          <SpendCompareGlance
            deltas={metrics.deltas}
            salesPending={Boolean(metrics.salesPending)}
            sales={metrics.sales}
            spend={metrics.totalSpend}
            mer={paintedMer}
          />
        </div>
        <section id="mcfly-explorer" aria-label="Spend explorer">
          <SpendExplorer
            series={explorer}
            period={preset}
            shotMode={shotMode}
            basePath="/app/spend"
            compare
            quiet={false}
            orderBookDepth={orderBookDepth}
          />
        </section>
        {emptyLiveSpend ? (
          <>
            <section
              id="mcfly-spend-add"
              className="mcfly-panel mcfly-panel--eq-compact mcfly-spend-panel--soft mcfly-spend-add--hero"
              aria-label={
                editing
                  ? "Edit this day of spend"
                  : "Yesterday’s spend — one bill"
              }
            >
              <SpendAddDayPanel
                editing={editing}
                fillDateKey={fillDateKey}
                yesterdayKey={yesterdayKey}
                spendHistoryFloorKey={spendHistoryFloorKey}
                todayKey={todayKey}
                addChannel={addChannel}
                setAddChannel={setAddChannel}
                addSpendChannels={addSpendChannels}
                currencyCode={currencyCode}
                isSubmitting={isSubmitting}
                submittingIntent={submittingIntent}
              />
            </section>
            <section
              id="mcfly-spend-paste"
              className="mcfly-panel mcfly-panel--eq-compact mcfly-spend-panel--soft mcfly-spend-paste"
              aria-label="Paste daily spend"
            >
              <div className="mcfly-panel__head mcfly-panel__head--tight">
                <h2>Paste daily spend</h2>
                <p className="mcfly-panel__muted">
                  Optional. This file is ad spend only — sales stay in Shopify.
                  {" "}
                  <s-link href={importHref}>CSV file, template, or add one bill</s-link>
                  {" "}stay on import.
                </p>
              </div>
              <Form method="post">
                <input type="hidden" name="intent" value="csv" />
                <label className="mcfly-spend-lean__paste-label" htmlFor="mcfly-spend-csv-paste">
                  Paste daily rows
                </label>
                <textarea
                  id="mcfly-spend-csv-paste"
                  name="csv"
                  className="mcfly-spend-lean__paste"
                  value={pasteText}
                  onChange={(event) => setPasteText(event.target.value)}
                  rows={6}
                  spellCheck={false}
                  placeholder={"Day,Meta,Google\n2026-08-01,120.00,80.00"}
                  aria-label="Paste daily spend rows"
                />
                <div className="mcfly-spend-csv-preview" aria-live="polite">
                  {pastePreview.writeNothing ? (
                    <strong>
                      {pastePreview.firstError ??
                        "No positive daily amounts yet — Total ROAS, Cash CPA, and payback stay —."}
                    </strong>
                  ) : (
                    <>
                      <strong>
                        {pastePreview.days} day
                        {pastePreview.days === 1 ? "" : "s"} ·{" "}
                        {pastePreview.labels.join(", ")} ·{" "}
                        {money(pastePreview.totalAmount)}
                      </strong>
                      <span>these pasted days</span>
                      {pastePreview.salesWindowWarning ? (
                        <span>{pastePreview.salesWindowWarning}</span>
                      ) : null}
                      <div className="mcfly-spend-paste__trio">
                        <p>
                          <span>Total ROAS</span>
                          <strong>
                            {pastePreview.totalRoas != null
                              ? `${formatMer(pastePreview.totalRoas)}×`
                              : "—"}
                          </strong>
                          {pastePreview.roasReason ? (
                            <em>{pastePreview.roasReason}</em>
                          ) : null}
                        </p>
                        <p>
                          <span>Cash CPA</span>
                          <strong>
                            {pastePreview.cashCpa != null
                              ? money(pastePreview.cashCpa)
                              : "—"}
                          </strong>
                          {pastePreview.cpaReason ? (
                            <em>{pastePreview.cpaReason}</em>
                          ) : null}
                        </p>
                        <p>
                          <span>Payback vs first 90</span>
                          <strong>
                            {pastePreview.paybackDays != null
                              ? `${pastePreview.paybackDays} days`
                              : "—"}
                          </strong>
                          {pastePreview.paybackReason ? (
                            <em>{pastePreview.paybackReason}</em>
                          ) : null}
                        </p>
                      </div>
                    </>
                  )}
                </div>
                <button
                  type="submit"
                  className="mcfly-btn mcfly-btn--primary mcfly-spend-submit"
                  disabled={
                    pastePreview.writeNothing ||
                    (isSubmitting && submittingIntent === "csv")
                  }
                >
                  {isSubmitting && submittingIntent === "csv"
                    ? "Saving…"
                    : pastePreview.writeNothing
                      ? "Paste positive daily spend"
                      : `Save ${pastePreview.days} days · ${money(pastePreview.totalAmount)}`}
                </button>
              </Form>
            </section>
          </>
        ) : null}
        </DeskLane>

        <DeskLane
          rank="more"
          label={SPEND_DEPTH_LANE_LABEL}
          fold
          defaultOpen={
            shotMode || spendPanel === "mix" || spendPanel === "cpa"
          }
        >
        <section id="mcfly-explorer-depth" aria-label="Certified windows and spend analysis">
          {cashControl && cashControl.chips.length > 0 && !hasSpend ? (
            <CertifiedScoreboard
              chips={cashControl.chips}
              targetMer={cashControl.targetMer}
              plan={cashControl.plan}
            />
          ) : null}

          {cashControl?.dualClose ? (
            <DualCloseLine
              close={cashControl.dualClose}
              targetMer={cashControl.targetMer}
            />
          ) : null}

          {monthPace && cashControl && hasSpend ? (
            <MonthlyPacing
              sales={cashControl.dualClose?.mtd.sales ?? 0}
              spend={cashControl.dualClose?.mtd.spend ?? 0}
              mer={cashControl.dualClose?.mtd.mer ?? null}
              targetMer={cashControl.targetMer}
              heading="This month"
              periodLabel={monthPace.densityLabel}
              control={monthPace}
            />
          ) : null}

          {cashControl ? (
            <MarketingSpendRoom
              board={cashControl}
              channelLabels={explorer.channelLabels}
            />
          ) : null}

          {hasSpend ? (
            <p className="mcfly-spend-plane__hint">{pairCoverage.caption}</p>
          ) : null}
          {hasSpend && onlineLine ? (
            <p className="mcfly-spend-plane__hint">{onlineLine}</p>
          ) : null}
          {explorer.weekMonthCopy ? (
            <div className="mcfly-spend-pair-copy-row">
              <p className="mcfly-spend-plane__hint" style={{ whiteSpace: "pre-wrap" }}>
                {explorer.weekMonthCopy}
              </p>
              <CopyWeekMonthSales text={explorer.weekMonthCopy} />
            </div>
          ) : null}
        </section>

        <SpendMixSection
          metrics={metrics}
          cashControl={cashControl}
          history={history}
          windowSets={windowSets}
          preset={preset}
          shotMode={shotMode}
          useSampleDesk={sampleDesk.enabled}
          salesError={salesError}
          todaySalesUnavailable={todaySalesUnavailable}
          todaySalesTruncated={todaySalesTruncated}
          salesFactsIncomplete={salesFactsIncomplete}
          shopifyOrderWindowLimited={shopifyOrderWindowLimited}
          addSpendHref="#mcfly-spend-add"
        />

        <section
          id="mcfly-cpa"
          className="mcfly-well mcfly-well--scoreboard mcfly-book mcfly-cpa"
          aria-label="Customer acquisition cost"
        >
          {!cpaHasSpend ? (
            <p className="mcfly-book__lede">{CPA_EMPTY_SPEND}</p>
          ) : (
            <CpaWindowCards
              windows={cpa.windows}
              selectedId={cpaSelected.id}
              onSelect={setCpaSelectedId}
              todaySalesTruncated={cpa.todaySalesTruncated}
            />
          )}
          {cpaBuyersMissing ? (
            <p className="mcfly-book__lede">{CPA_NO_BUYERS}</p>
          ) : null}
          {cpaHasSpend ? (
            <CpaPaybackDesk
              window={cpaSelected}
              payback={cpaPayback}
              historyLimited={cpa.paybackBase.historyLimited}
            />
          ) : null}
          {cpaHasSpend ? (
            <CpaExplorer
              days={cpa.days}
              ranges={cpa.explorerRanges}
              selectedWindow={cpaSelected.id}
              onSelectWindow={setCpaSelectedId}
              orderBookDepth={orderBookDepth}
              todaySalesTruncated={cpa.todaySalesTruncated}
            />
          ) : null}
        </section>
        </DeskLane>

        {!emptyLiveSpend ? (
        <DeskLane
          rank="more"
          label={SPEND_ADD_LANE_LABEL}
          fold
          defaultOpen={
            shotMode || Boolean(editing) || spendPanel === "spend-add"
          }
        >
        <div className="mcfly-spend-lean__stack mcfly-spend-lean__stack--soft">
          <p className="mcfly-spend-helper mcfly-spend-helper--soft">
            Shopify sales are already here. Empty spend is not a certified $0 —
            add a day. A deleted day stays $0. Empty spend is never 0×
            {currencyCode !== "USD" ? ` · amounts are ${currencyCode}` : ""}
            {strangerEmpty
              ? ". Type yesterday — that $X/day continues until you change it. No ad-account login."
              : ". Sales ÷ spend is the pair above. This section records typed, uploaded, or daily-rate spend."}
          </p>

          {strangerEmpty ? (
            <SpendFindingStrip finding={spendUploadEmptyFinding()} />
          ) : null}

          <section
            id="mcfly-spend-add"
            className="mcfly-panel mcfly-panel--eq-compact mcfly-spend-panel--soft mcfly-spend-add--hero"
            aria-label={
              editing
                ? "Edit this day of spend"
                : "Yesterday’s spend — one bill"
            }
          >
              <SpendAddDayPanel
                editing={editing}
                fillDateKey={fillDateKey}
                yesterdayKey={yesterdayKey}
                spendHistoryFloorKey={spendHistoryFloorKey}
                todayKey={todayKey}
                addChannel={addChannel}
                setAddChannel={setAddChannel}
                addSpendChannels={addSpendChannels}
                currencyCode={currencyCode}
                isSubmitting={isSubmitting}
                submittingIntent={submittingIntent}
              />
          </section>
        </div>
        </DeskLane>
        ) : null}

        <DeskLane rank="more" label="Coverage and import">
        <div className="mcfly-spend-lean__stack mcfly-spend-lean__stack--soft">

          {strangerEmpty ? null : (
            <>
              <div
                className="mcfly-well mcfly-well--scoreboard mcfly-spend-glance mcfly-spend-glance--soft"
                aria-label="What’s on file"
              >
                <SpendPeek
                  label="Coverage"
                  value={coveragePeekValue}
                  sub={coveragePeekSub}
                  icon="clock"
                  formula={`${dayCoverage.total}-day window. Empty cells open Add a day. Days with no row have no spend entered. A deleted day stays $0.`}
                  next="Open the coverage strip to fill an empty day."
                  nextHref={coverageHref}
                  nextLabel="Open coverage"
                />
                <SpendPeek
                  label="Daily amount"
                  value={dailyPeekValue}
                  sub={dailyPeekSub}
                  icon="spend"
                  formula="A daily rate continues every day until you change or stop it. Typed or uploaded days stay as written."
                  next={
                    recurring.length > 0
                      ? "Change or stop the running daily amount."
                      : "Start a daily amount from another first day if yesterday is not the start."
                  }
                  nextHref={
                    recurring.length > 0
                      ? ratesHref
                      : deskNavHref("/app/spend", {
                          period: preset,
                          shot: shotMode,
                          hash: "mcfly-spend-recurring",
                        })
                  }
                  nextLabel={
                    recurring.length > 0 ? "Edit daily amount" : "Start daily amount"
                  }
                />
                <SpendPeek
                  label="Recent ledger"
                  value={recentPeekValue}
                  sub={recentPeekSub}
                  icon="chart"
                  formula="Typed, uploaded, or daily-rate rows. Edit overwrites that day. Delete keeps the day empty — an active daily rate will not put it back."
                  next="Open the recent ledger to edit or delete a row."
                  nextHref={ledgerHref}
                  nextLabel="Open recent ledger"
                />
              </div>

              <HashDetails
                id="mcfly-spend-coverage"
                className="mcfly-panel mcfly-panel--eq-compact mcfly-spend-reveal mcfly-spend-reveal--soft mcfly-spend-cal mcfly-spend-cal--soft"
                defaultOpen={false}
                summary={
                  <>
                    <span className="mcfly-spend-reveal__title">Coverage</span>
                    <span className="mcfly-spend-reveal__hint">
                      Last {stripDays.length} closed days
                      {coverageFromKey && coverageToKey
                        ? ` · ${formatSpendYmd(coverageFromKey)} → ${formatSpendYmd(coverageToKey)}`
                        : ""}
                      {" · "}
                      {dayCoverage.total}-day window. Empty cells open Add a day.
                      Days with no row have no spend entered. A deleted day stays
                      $0.
                    </span>
                  </>
                }
              >
                <div className="mcfly-spend-cal__strip" role="list">
                  {stripDays.map((day) => {
                    const title = day.filled
                      ? day.hasSales
                        ? `${day.dateKey} has spend · sales on file`
                        : `${day.dateKey} has spend · sales still waiting`
                      : day.hasSales
                        ? `${day.dateKey} — sales on file, no spend entered`
                        : `${day.dateKey} — no spend entered`;
                    const className = [
                      "mcfly-spend-cal__day",
                      day.filled
                        ? "mcfly-spend-cal__day--filled"
                        : "mcfly-spend-cal__day--empty",
                      day.hasSales ? "mcfly-spend-cal__day--sales" : null,
                    ]
                      .filter(Boolean)
                      .join(" ");
                    return day.filled ? (
                      <div
                        key={day.dateKey}
                        className={className}
                        role="listitem"
                        title={title}
                      >
                        <span className="mcfly-spend-cal__tick" />
                        <span className="mcfly-spend-cal__label">
                          {day.label}
                        </span>
                      </div>
                    ) : (
                      <Link
                        key={day.dateKey}
                        className={className}
                        role="listitem"
                        to={spendFillDayHref(day.dateKey, {
                          period: preset,
                          shot: shotMode,
                        })}
                        title={title}
                      >
                        <span className="mcfly-spend-cal__tick" />
                        <span className="mcfly-spend-cal__label">
                          {day.label}
                        </span>
                      </Link>
                    );
                  })}
                </div>
                <div className="mcfly-spend-cal__legend">
                  <span className="mcfly-spend-cal__legend-item">
                    <span className="mcfly-spend-cal__day mcfly-spend-cal__day--filled mcfly-spend-cal__day--swatch">
                      <span className="mcfly-spend-cal__tick" />
                    </span>
                    Has spend
                  </span>
                  <span className="mcfly-spend-cal__legend-item">
                    <span className="mcfly-spend-cal__day mcfly-spend-cal__day--empty mcfly-spend-cal__day--sales mcfly-spend-cal__day--swatch">
                      <span className="mcfly-spend-cal__tick" />
                    </span>
                    Sales, no spend
                  </span>
                  <span className="mcfly-spend-cal__legend-item">
                    <span className="mcfly-spend-cal__day mcfly-spend-cal__day--empty mcfly-spend-cal__day--swatch">
                      <span className="mcfly-spend-cal__tick" />
                    </span>
                    No row = none entered
                  </span>
                </div>
                <div className="mcfly-spend-lean__status mcfly-spend-lean__status--soft" role="status">
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
                        These rows stay an example. They will not become your spend.
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
              </HashDetails>

              {entries.length > 0 ? (
                <HashDetails
                  id="mcfly-spend-ledger"
                  className="mcfly-panel mcfly-panel--eq-compact mcfly-spend-reveal mcfly-spend-reveal--soft mcfly-spend-ledger mcfly-spend-ledger--soft"
                  defaultOpen={Boolean(editing)}
                  summary={
                    <>
                      <span className="mcfly-spend-reveal__title">
                        Recent ledger
                      </span>
                      <span className="mcfly-spend-reveal__hint">
                        Typed, uploaded, or daily-rate rows. Edit overwrites that
                        day. Delete keeps the day empty — an active daily rate
                        will not put it back.
                      </span>
                    </>
                  }
                >
                  <ul
                    className="mcfly-spend-lean__recent mcfly-spend-ledger__rows"
                    aria-label="Recent spend ledger"
                  >
                    {entries.map((entry) => {
                      const editHref = deskNavHref("/app/spend", {
                        period: preset,
                        shot: shotMode,
                      });
                      const editUrl = `${editHref}${editHref.includes("?") ? "&" : "?"}edit=${encodeURIComponent(entry.id)}#mcfly-spend-add`;
                      return (
                        <li
                          className="mcfly-spend-lean__recent-row mcfly-spend-ledger__row"
                          key={entry.id}
                        >
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
                              <button
                                type="submit"
                                className="mcfly-btn mcfly-btn--secondary"
                              >
                                Delete
                              </button>
                            </Form>
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </HashDetails>
              ) : null}
            </>
          )}

          <HashDetails
            id="mcfly-spend-how"
            className="mcfly-panel mcfly-panel--eq-compact mcfly-spend-reveal mcfly-spend-reveal--soft"
            defaultOpen={false}
            summary={
              <>
                <span className="mcfly-spend-reveal__title">
                  How this page works
                </span>
                <span className="mcfly-spend-reveal__hint">
                  Not Ads Manager login. Shopify already has sales.
                </span>
              </>
            }
          >
            <p className="mcfly-panel__muted">{SPEND_UPLOAD_CONTRAST}</p>
            <p className="mcfly-panel__muted">
              Empty spend is not a certified $0 — add a day. A deleted day stays
              $0. Empty spend is never 0×. The pair above is sales ÷ entered spend.
            </p>
          </HashDetails>

          {recurring.length > 0 ? (
            <HashDetails
              id="mcfly-spend-rates"
              className="mcfly-panel mcfly-panel--eq-compact mcfly-spend-reveal mcfly-spend-reveal--soft mcfly-spend-panel--soft"
              defaultOpen={false}
              summary={
                <>
                  <span className="mcfly-spend-reveal__title">
                    Daily amount
                  </span>
                  <span className="mcfly-spend-reveal__hint">
                    Continues every day until you change or stop it. Typed or
                    uploaded days stay as written.
                  </span>
                </>
              }
            >
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
            </HashDetails>
          ) : null}

          <HashDetails
            id="mcfly-spend-recurring"
            className="mcfly-panel mcfly-panel--eq-compact mcfly-spend-reveal mcfly-spend-reveal--soft"
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
            className="mcfly-panel mcfly-panel--eq-compact mcfly-spend-reveal mcfly-spend-reveal--soft"
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
        </div>
        </DeskLane>
      </div>
      {entries.length > 0 ? (
        <p className="mcfly-overview-more" aria-label="Marketing tools">
          <s-link href="#mcfly-roas">{PRODUCT_NOUN.totalRoas}</s-link>
          {" · "}
          <s-link href="#mcfly-mix">
            {PRODUCT_NOUN.spendAllocation}
          </s-link>
          {" · "}
          <s-link href="/app/spend/import">Import</s-link>
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
