import { useEffect, useId } from "react";
import type {
  ActionFunctionArgs,
  HeadersFunction,
  LoaderFunctionArgs,
} from "react-router";
import {
  Form,
  redirect,
  useActionData,
  useLoaderData,
  useNavigation,
  useSearchParams,
} from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { requireAdmin } from "../lib/public-app-gate.server";
import prisma from "../db.server";
import { PeriodControl } from "../components/PeriodControl";
import {
  buildDashboardMetrics,
  ensureShop,
  getOrCreateSettings,
} from "../lib/mer-dashboard.server";
import { formatCurrency, formatMer } from "../lib/mer-format";
import {
  deskPeriodTimeZone,
  parsePeriodPreset,
  resolvePeriod,
} from "../lib/periods";
import { PRODUCT_NOUN } from "../lib/product-labels";
import { parseSalesBasis } from "../lib/sales-basis";
import { getSalesFactsTotals, loadDeskSalesForPeriod } from "../lib/sales-facts.server";
import {
  fetchSampleSales,
  getSampleDeskEnabled,
} from "../lib/sample-desk.server";
import {
  buildHabitGoals,
  parseHabitGoalInput,
} from "../lib/goals-habit";
import { OrderHistoryGoalsBoard } from "../components/OrderHistoryGoalsBoard";
import {
  impliedSpendCeiling,
  impliedSpendCeilingCaption,
} from "../lib/implied-spend-ceiling";
import {
  buildSalesGoalPeriods,
  buildYearBoard,
  loadSalesByDayForGoalsRange,
  merVsRails,
  parseGoalsYear,
  salesByMonthFromDayMap,
  spendByMonthMap,
  upsertYearSalesGoals,
  yearDateRange,
} from "../lib/sales-goals.server";
import type {
  GoalMonthRow,
  GoalPaceTone,
  MerVsRails,
} from "../lib/sales-goals.server";
import { getShopEntitlements } from "../lib/entitlements.server";
import { SalesGoalGauges } from "../components/SalesGoalGauges";
import { BookFactGrid } from "../components/ShopifyBookSection";
import { SampleDeskBanner } from "../components/SampleDeskBanner";
import { DeskRouteErrorBoundary } from "../components/DeskRouteErrorBoundary";
import { SalesLoadError } from "../components/SalesLoadError";
import { TRIAL_VS_VIEW } from "../lib/sample-live-handoff";
import { useDeskCurrency } from "../lib/desk-currency";

type ShopifyToast = {
  show?: (message: string, options?: { duration?: number; isError?: boolean }) => void;
};

type GoalsActionIntent =
  | "save_goals"
  | "apply_yoy_10"
  | "apply_yoy_grow"
  | "set_goals_enabled"
  | "save_target_mer"
  | "save_habit_goals";

const GOALS_ANALYTICS_LEDE =
  "Shopify Analytics shows this period's sales. This page shows plan vs actual for MTD/QTD/YTD.";

function showAdminToast(
  message: string,
  options?: { duration?: number; isError?: boolean },
) {
  const bridge = (
    window as Window & { shopify?: { toast?: ShopifyToast } }
  ).shopify;
  bridge?.toast?.show?.(message, options);
}

function deltaTone(delta: number | null, goal: number): GoalPaceTone {
  if (delta == null || !(goal > 0)) return "flat";
  if (delta >= 0) return "up";
  if (delta / goal >= -0.05) return "flat";
  return "down";
}

function formatGoalInput(value: number): string {
  if (!Number.isFinite(value) || value === 0) return "";
  return String(Math.round(value));
}

function parseGoalInput(raw: FormDataEntryValue | null): number {
  const cleaned = String(raw ?? "")
    .replace(/[$,\s]/g, "")
    .trim();
  if (cleaned === "") return 0;
  const n = Number.parseFloat(cleaned);
  if (!Number.isFinite(n) || n < 0) return Number.NaN;
  return n;
}

function parseTargetMerInput(raw: FormDataEntryValue | null): number {
  const cleaned = String(raw ?? "")
    .replace(/[×x,\s]/gi, "")
    .trim();
  const n = Number.parseFloat(cleaned);
  if (!Number.isFinite(n) || n <= 0) return Number.NaN;
  return n;
}

function monthMapToArray(map: Map<number, number>): Array<number | null> {
  return Array.from({ length: 12 }, (_, i) => {
    const v = map.get(i + 1);
    return Number.isFinite(v) ? (v as number) : null;
  });
}

/** Allowed one-click YoY growth percents. */
const YOY_GROWTH_PRESETS = [5, 10, 15, 20] as const;

function parseYoyGrowthPct(raw: FormDataEntryValue | null): number {
  const n = Number.parseFloat(String(raw ?? "10"));
  if (!Number.isFinite(n)) return 10;
  if (YOY_GROWTH_PRESETS.includes(n as (typeof YOY_GROWTH_PRESETS)[number])) {
    return n;
  }
  // Clamp custom values to a sane band
  return Math.min(50, Math.max(0, Math.round(n)));
}

/** Prior-year actual × (1 + pct/100), whole dollars; missing/zero prior → no goal. */
function goalsAtYoyGrowth(
  priorYearMonthly: Array<number | null>,
  growthPct: number,
): number[] {
  const factor = 1 + growthPct / 100;
  return priorYearMonthly.map((prior) => {
    if (prior == null || !(prior > 0)) return 0;
    return Math.round(prior * factor);
  });
}

function yoyPct(
  actual: number | null,
  prior: number | null,
): number | null {
  if (
    actual == null ||
    prior == null ||
    !(prior > 0) ||
    !Number.isFinite(actual)
  ) {
    return null;
  }
  return ((actual - prior) / prior) * 100;
}

function formatSalesOrDash(
  amount: number | null | undefined,
  currency: string,
): string {
  // Certified $0 months keep $0. Missing facts stay — — never a pending shell.
  if (amount == null || !Number.isFinite(amount)) return "—";
  return formatCurrency(amount, currency);
}

function formatYoyPct(pct: number | null): string {
  if (pct == null) return "—";
  const sign = pct > 0 ? "+" : "";
  return `${sign}${pct.toFixed(0)}%`;
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin, session } = await requireAdmin(request);
  const url = new URL(request.url);
  const shotMode = url.searchParams.get("shot") === "1";
  const preset = parsePeriodPreset(url.searchParams.get("period"));
  // y3 stays shot-only. L12M is a desk preset (PeriodControl) — do not redirect.
  if (!shotMode && preset === "y3") {
    const next = new URLSearchParams(url.searchParams);
    next.set("period", "ytd");
    throw redirect(`/app/goals?${next.toString()}`);
  }
  const year = parseGoalsYear(url.searchParams.get("year"));
  const shop = await ensureShop(session.shop);
  const settings = await getOrCreateSettings(shop.id);
  const useSampleDesk = await getSampleDeskEnabled(shop.id);
  const deskTz = deskPeriodTimeZone(useSampleDesk, shop.ianaTimezone);
  const periodRange = resolvePeriod(preset, new Date(), deskTz);
  const range = yearDateRange(year, deskTz);
  const priorYear = year - 1;
  const priorRange = yearDateRange(priorYear, deskTz);

  const thisYear = new Date().getFullYear();

  // Same spend + sales spine as Overview for the selected PeriodControl window.
  let periodSalesError: string | null = null;
  let periodSales;
  let periodSalesCoverage: Awaited<
    ReturnType<typeof loadDeskSalesForPeriod>
  >["factsCoverage"] = null;
  if (useSampleDesk) {
    periodSales = await fetchSampleSales(shop.id, periodRange);
  } else {
    const desk = await loadDeskSalesForPeriod({
      admin,
      shopId: shop.id,
      range: periodRange,
      ianaTimezone: shop.ianaTimezone,
      signal: request.signal,
    });
    periodSales = desk.sales;
    periodSalesError = desk.salesError;
    periodSalesCoverage = desk.factsCoverage;
  }
  const periodMetrics = await buildDashboardMetrics(
    session.shop,
    periodRange,
    periodSales,
    {
      salesBasis: parseSalesBasis(settings.salesBasis, "total"),
      salesCoverage: periodSalesCoverage,
    },
  );

  const [currentSales, priorSales] = await Promise.all([
    loadSalesByDayForGoalsRange(shop.id, deskTz, range, useSampleDesk),
    loadSalesByDayForGoalsRange(
      shop.id,
      deskTz,
      priorRange,
      useSampleDesk,
    ),
  ]);

  const salesByDay = currentSales.salesByDay;
  const salesError = currentSales.salesError ?? periodSalesError;
  const salesByMonth = salesByMonthFromDayMap(year, salesByDay);
  const priorSalesByMonth = salesByMonthFromDayMap(
    priorYear,
    priorSales.salesByDay,
  );
  const priorYearMonthly = monthMapToArray(priorSalesByMonth);

  const spendOpts = useSampleDesk
    ? { sampleOnly: true as const, ianaTimezone: deskTz }
    : { excludeSample: true as const, ianaTimezone: deskTz };
  const spendByMonth = await spendByMonthMap(shop.id, year, spendOpts);

  const board = await buildYearBoard(
    shop.id,
    year,
    salesByMonth,
    spendByMonth,
    settings.targetMer,
  );

  const periods = buildSalesGoalPeriods({
    year,
    goals: board.rows.map((r) => r.salesGoal),
    salesByMonth,
    spendByMonth,
    priorYearMonthly,
    targetMer: board.targetMer,
    breakEvenMer: board.breakEvenMer,
  });

  const yearOptions = Array.from(
    new Set([thisYear - 1, thisYear, thisYear + 1, year]),
  ).sort((a, b) => a - b);

  const periodMerRails = merVsRails(
    periodMetrics.mer,
    board.targetMer,
    board.breakEvenMer,
  );
  const periodSpendCeiling = impliedSpendCeiling(
    periodMetrics.sales,
    board.targetMer,
  );

  const yearSales = useSampleDesk
    ? await fetchSampleSales(shop.id, range)
    : await getSalesFactsTotals(shop.id, range, new Date());
  const yearReturningSales = useSampleDesk
    ? yearSales.returningCustomerNetSales
    : yearSales.returningCustomerNetSalesSum;
  const yearOrderCount = yearSales.orderCount;
  const historyLimited = Boolean(
    !useSampleDesk &&
      (periodMetrics.tillLtv.historyLimited ||
        ("rangeClampedToFactWindow" in yearSales &&
          yearSales.rangeClampedToFactWindow)),
  );

  return {
    board,
    periods,
    year,
    yearOptions,
    preset,
    periodMetrics,
    periodMerRails,
    periodSpendCeiling,
    shotMode,
    useSampleDesk,
    salesError,
    goalsEnabled: Boolean(settings.goalsEnabled),
    targetMer: settings.targetMer,
    priorYear,
    priorYearMonthly,
    entitlements: getShopEntitlements(session.shop, {
      sampleDesk: useSampleDesk,
      paidPro: shop.proBillingActive,
    }),
    habitGoals: buildHabitGoals({
      salesPending: Boolean(periodMetrics.salesPending),
      orderCount: yearOrderCount,
      ltv30: periodMetrics.tillLtv.avgRevenueD30,
      ltv90: periodMetrics.tillLtv.avgRevenueD90,
      ltv365: periodMetrics.tillLtv.avgRevenueD365,
      yearReturningSales: yearReturningSales,
      typedReturningTarget: settings.returningSalesTarget,
      historyLimited,
      sample: useSampleDesk,
      year,
    }),
  };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { admin, session } = await requireAdmin(request);
  const shop = await ensureShop(session.shop);
  const form = await request.formData();
  const year = parseGoalsYear(String(form.get("year") ?? ""));
  const intent = String(form.get("intent") ?? "save_goals") as GoalsActionIntent;
  const useSampleDesk = await getSampleDeskEnabled(shop.id);
  const entitlements = getShopEntitlements(session.shop, {
    sampleDesk: useSampleDesk,
    paidPro: shop.proBillingActive,
  });

  if (intent === "save_habit_goals") {
    const returningSalesTarget = parseHabitGoalInput(
      form.get("returningSalesTarget"),
    );
    if (Number.isNaN(returningSalesTarget)) {
      return {
        success: false as const,
        intent,
        error: "Enter a non-negative returning-$ target — or leave blank to unset",
        year,
        goalsEnabled: null as boolean | null,
        targetMer: null as number | null,
        returningSalesTarget: null as number | null,
      };
    }
    await prisma.settings.update({
      where: { shopId: shop.id },
      data: { ltvTarget: null, returningSalesTarget },
    });
    return {
      success: true as const,
      intent,
      error: null,
      year,
      goalsEnabled: null as boolean | null,
      targetMer: null as number | null,
      returningSalesTarget,
    };
  }

  if (intent === "save_target_mer") {
    const targetMer = parseTargetMerInput(form.get("targetMer"));
    if (Number.isNaN(targetMer)) {
      return {
        success: false as const,
        intent,
        error: `${PRODUCT_NOUN.totalRoasGoal} must be greater than 0`,
        year,
        goalsEnabled: null as boolean | null,
        targetMer: null as number | null,
      };
    }
    await prisma.settings.update({
      where: { shopId: shop.id },
      data: { targetMer },
    });
    return {
      success: true as const,
      intent,
      error: null,
      year,
      goalsEnabled: null as boolean | null,
      targetMer,
    };
  }

  if (intent === "set_goals_enabled") {
    const raw = String(form.get("goalsEnabled") ?? "");
    if (raw !== "true" && raw !== "false") {
      return {
        success: false as const,
        intent,
        error: "goalsEnabled must be true or false",
        year,
        goalsEnabled: null as boolean | null,
        targetMer: null as number | null,
      };
    }
    const goalsEnabled = raw === "true";
    await prisma.settings.update({
      where: { shopId: shop.id },
      data: { goalsEnabled },
    });
    return {
      success: true as const,
      intent,
      error: null,
      year,
      goalsEnabled,
      targetMer: null as number | null,
    };
  }

  if (intent === "apply_yoy_10" || intent === "apply_yoy_grow") {
    const growthPct =
      intent === "apply_yoy_10" ? 10 : parseYoyGrowthPct(form.get("yoyPct"));
    const priorYear = year - 1;
    const deskTz = deskPeriodTimeZone(useSampleDesk, shop.ianaTimezone);
    const priorRange = yearDateRange(priorYear, deskTz);
    const { salesByDay, salesError } = await loadSalesByDayForGoalsRange(
      shop.id,
      deskTz,
      priorRange,
      useSampleDesk,
    );
    if (salesError) {
      return {
        success: false as const,
        intent,
        error: `Could not load ${priorYear} sales for YoY goals: ${salesError}`,
        year,
        goalsEnabled: true as boolean | null,
        targetMer: null as number | null,
        yoyPct: growthPct,
      };
    }
    const priorSalesByMonth = salesByMonthFromDayMap(priorYear, salesByDay);
    const monthly = goalsAtYoyGrowth(
      monthMapToArray(priorSalesByMonth),
      growthPct,
    );
    try {
      await upsertYearSalesGoals(shop.id, year, monthly);
      await prisma.settings.update({
        where: { shopId: shop.id },
        data: { goalsEnabled: true },
      });
    } catch (err) {
      return {
        success: false as const,
        intent,
        error:
          err instanceof Error ? err.message : "Could not apply YoY goals",
        year,
        goalsEnabled: null as boolean | null,
        targetMer: null as number | null,
        yoyPct: growthPct,
      };
    }
    return {
      success: true as const,
      intent,
      error: null,
      year,
      goalsEnabled: true as boolean | null,
      targetMer: null as number | null,
      yoyPct: growthPct,
    };
  }

  // save_goals (default) — the full-year plan is part of the one desk.
  const monthly: number[] = [];
  for (let m = 1; m <= 12; m++) {
    const n = parseGoalInput(form.get(`goal_${m}`));
    if (Number.isNaN(n)) {
      return {
        success: false as const,
        intent: "save_goals" as const,
        error: `Month ${m}: enter a non-negative sales goal in dollars`,
        year,
        goalsEnabled: null as boolean | null,
        targetMer: null as number | null,
      };
    }
    monthly.push(n);
  }

  try {
    await upsertYearSalesGoals(shop.id, year, monthly);
  } catch (err) {
    return {
      success: false as const,
      intent: "save_goals" as const,
      error: err instanceof Error ? err.message : "Could not save goals",
      year,
      goalsEnabled: null as boolean | null,
      targetMer: null as number | null,
    };
  }

  return {
    success: true as const,
    intent: "save_goals" as const,
    error: null,
    year,
    goalsEnabled: null as boolean | null,
    targetMer: null as number | null,
  };
};

export default function GoalsPage() {
  const currency = useDeskCurrency();
  const {
    board,
    periods,
    year,
    yearOptions,
    preset,
    periodMetrics,
    periodMerRails,
    periodSpendCeiling,
    shotMode,
    useSampleDesk,
    salesError,
    goalsEnabled,
    targetMer,
    priorYear,
    priorYearMonthly,
    entitlements,
    habitGoals,
  } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const [searchParams, setSearchParams] = useSearchParams();
  const formId = useId();

  const isSaving = navigation.state === "submitting";
  const isRevalidating =
    navigation.state === "loading" && navigation.formMethod != null;
  const savingIntent =
    navigation.state === "submitting"
      ? String(navigation.formData?.get("intent") ?? "")
      : "";

  const goalsKey = `${board.year}:${board.rows.map((r) => r.salesGoal).join("|")}`;
  const periodHasSpend = periodMetrics.totalSpend > 0;
  const yearHasSpend = board.rows.some((row) => row.spend > 0);
  const knownPriorMonths = priorYearMonthly.filter(
    (v): v is number => v != null && Number.isFinite(v) && v > 0,
  );
  const priorYearSales = knownPriorMonths.reduce((a, b) => a + b, 0);
  const previewTenPct = goalsAtYoyGrowth(priorYearMonthly, 10).reduce(
    (a, b) => a + b,
    0,
  );
  const canGrowFromPrior = knownPriorMonths.length > 0;
  const noGoalsYet = board.rows.every((r) => !(r.salesGoal > 0));

  useEffect(() => {
    if (!actionData) return;
    if (actionData.success) {
      if (actionData.intent === "save_habit_goals") {
        showAdminToast("Returning-$ target saved", { duration: 4000 });
        return;
      }
      if (actionData.intent === "save_target_mer") {
        showAdminToast(
          `${PRODUCT_NOUN.totalRoasGoal} saved · ${formatMer(actionData.targetMer)}×`,
          { duration: 4000 },
        );
        return;
      }
      if (
        actionData.intent === "apply_yoy_10" ||
        actionData.intent === "apply_yoy_grow"
      ) {
        const pct =
          "yoyPct" in actionData && actionData.yoyPct != null
            ? actionData.yoyPct
            : 10;
        showAdminToast(
          `Grew ${pct}% YoY · applied to all 12 months (${actionData.year})`,
          { duration: 4000 },
        );
        return;
      }
      if (actionData.intent === "set_goals_enabled") {
        showAdminToast(
          actionData.goalsEnabled
            ? "Sales goals shown"
            : "Sales goals hidden",
          { duration: 4000 },
        );
        return;
      }
      showAdminToast(`Saved ${actionData.year} sales goals`, {
        duration: 4000,
      });
      return;
    }
    if (actionData.error) {
      showAdminToast(actionData.error, { duration: 5000, isError: true });
    }
  }, [actionData]);

  /** Native form reset restores uncontrolled defaultValue inputs (App Bridge Discard). */
  const handleDiscard = () => {
    /* no-op: browser reset + form key remount keep CSB parity with Settings */
  };

  const ytdTone = deltaTone(board.ytd.delta, board.ytd.goal);
  const forecast = board.forecast;
  const tillLabel = useSampleDesk
    ? `${periodMetrics.period.label}${PRODUCT_NOUN.samplePeriodSuffix}`
    : salesError ||
        periodMetrics.blockedMockAsLive ||
        periodMetrics.salesSource === "mock"
      ? `${periodMetrics.period.label} · sales unavailable`
      : `${periodMetrics.period.label} · live sales`;

  const onYearChange = (next: string) => {
    const params = new URLSearchParams(searchParams);
    params.set("year", next);
    if (shotMode) params.set("shot", "1");
    setSearchParams(params);
  };

  const periodVsTarget =
    periodMetrics.mer != null &&
    Number.isFinite(periodMetrics.mer) &&
    targetMer > 0
      ? periodMetrics.mer - targetMer
      : null;

  const pageHeading = shotMode ? undefined : "Goals";

  return (
    <s-page heading={pageHeading} inlineSize="large">
      <div
        className={[
          "mcfly-desk",
          "mcfly-desk--chrome",
          "mcfly-goals",
          "mcfly-goals--soft",
          shotMode ? "mcfly-desk--shot" : null,
          useSampleDesk ? "mcfly-desk--sample" : null,
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {/* As-of + plan year. Gauges are this month / quarter / year — no slicer. */}
        <div className="mcfly-goals__rail">
          <div className="mcfly-ctx mcfly-goals__ctx" aria-live="polite">
            <div className="mcfly-ctx__main">
              <span className="mcfly-ctx__asof">{tillLabel}</span>
              {shotMode ? (
                <PeriodControl preset={preset} shotMode={shotMode} />
              ) : null}
            </div>
            <div className="mcfly-ctx__chips">
              {useSampleDesk && !shotMode ? (
                <span className="mcfly-ctx-chip mcfly-ctx-chip--flat">
                  {PRODUCT_NOUN.samplePreview}
                </span>
              ) : null}
              {goalsEnabled && board.ytd.pct != null ? (
                <span className={`mcfly-ctx-chip mcfly-ctx-chip--${ytdTone}`}>
                  YTD {board.ytd.pct.toFixed(0)}% of goal
                </span>
              ) : null}
              <div className="mcfly-goals-year" aria-label="Plan year">
                  <label
                    className="mcfly-goals-year__label"
                    htmlFor={`${formId}-year`}
                  >
                    Year
                  </label>
                  <select
                    id={`${formId}-year`}
                    className="mcfly-goals-year__select"
                    value={year}
                    onChange={(e) => onYearChange(e.target.value)}
                  >
                    {yearOptions.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
              </div>
            </div>
          </div>
        </div>

        {!shotMode && entitlements.showStartTrial ? (
          <p className="mcfly-panel__muted">
            {TRIAL_VS_VIEW}{" "}
            <s-link href="/app/settings">Settings</s-link>.
          </p>
        ) : null}

        {useSampleDesk && !shotMode ? (
          <SampleDeskBanner note="Goals below use SAMPLE sales." />
        ) : null}

        {salesError && !shotMode ? (
          <SalesLoadError
            body="Your plan still saves. Actuals stay — until you refresh. Nothing was written as $0."
            retryHref={`/app/goals?period=${preset}`}
          />
        ) : null}

        {periodMetrics.salesPending && !salesError && !shotMode ? (
          <section
            className="mcfly-state mcfly-state--loading mcfly-state--soft"
            aria-live="polite"
            aria-label="Sales still loading"
          >
            <p className="mcfly-state__copy">
              Still loading — not $0. Months with certified sales still show
              pace vs your typed plan.
            </p>
          </section>
        ) : null}

        {isSaving || isRevalidating ? (
          <section
            className="mcfly-state mcfly-state--loading mcfly-state--soft"
            aria-live="polite"
            aria-label="Updating goals"
          >
            <p className="mcfly-state__copy">Writing your {year} plan…</p>
          </section>
        ) : null}

        <div className="mcfly-goals__main">
          <OrderHistoryGoalsBoard
            view={habitGoals}
            year={year}
            busy={isSaving || isRevalidating}
          />

          {/* One hero, drill rows — same book language as Orders and Buyers. */}
          <section
            className="mcfly-book mcfly-book--soft mcfly-goals-hero--soft"
            aria-label={`Sales · ${periodMetrics.period.label}`}
          >
            <p className="mcfly-book__lede">
              {GOALS_ANALYTICS_LEDE}{" "}
              {targetMer > 0 ? (
                <>
                  Target {PRODUCT_NOUN.totalRoas} is {formatMer(targetMer)}×
                  from <s-link href="/app/settings">Settings</s-link>.
                </>
              ) : (
                <>
                  Set target {PRODUCT_NOUN.totalRoas} in{" "}
                  <s-link href="/app/settings">Settings</s-link>.
                </>
              )}
              {!periodHasSpend ? (
                <>
                  {" "}
                  Add spend on{" "}
                  <s-link href="/app/spend">Spend Upload</s-link> for{" "}
                  {PRODUCT_NOUN.totalRoas} and a monthly spend ceiling.
                </>
              ) : null}
            </p>
            <div className="mcfly-book__hero">
              <p className="mcfly-book__hero-k">
                {PRODUCT_NOUN.salesBasisShort}
              </p>
              <p className="mcfly-book__hero-v">
                {periodMetrics.salesPending
                  ? "—"
                  : formatCurrency(periodMetrics.sales, currency)}
              </p>
              <p className="mcfly-book__hero-def">
                {periodMetrics.salesPending
                  ? "Still loading — not $0"
                  : periodMetrics.sales === 0
                    ? `Certified $0 · ${periodMetrics.period.label}`
                    : `${PRODUCT_NOUN.totalSalesHeroHint} · ${periodMetrics.period.label}`}
              </p>
            </div>
            {periodHasSpend ? (
              <BookFactGrid
                facts={[
                  {
                    k: "Spend",
                    v: formatCurrency(periodMetrics.totalSpend, currency),
                    d: `Ad spend you entered for ${periodMetrics.period.label}.`,
                  },
                  periodMetrics.mer != null
                    ? {
                        k: PRODUCT_NOUN.totalRoas,
                        v: `${formatMer(periodMetrics.mer)}×`,
                        d: [
                          PRODUCT_NOUN.definition,
                          periodMerRails.label !== "—"
                            ? periodMerRails.label
                            : periodVsTarget != null
                              ? `${periodVsTarget >= 0 ? "+" : ""}${periodVsTarget.toFixed(2)}× vs target`
                              : "",
                        ]
                          .filter(Boolean)
                          .join(" "),
                      }
                    : null,
                  periodSpendCeiling != null
                    ? {
                        k: "Spend ceiling",
                        v: formatCurrency(periodSpendCeiling, currency),
                        d: impliedSpendCeilingCaption("period_sales", targetMer),
                      }
                    : null,
                ].filter((row): row is NonNullable<typeof row> => row != null)}
              />
            ) : null}
          </section>

          <SalesGoalGauges
            periods={periods}
            variant="book"
            heading="MTD · QTD · YTD"
            muted={
              yearHasSpend
                ? `Sales vs plan plus ${PRODUCT_NOUN.totalRoas} vs ${PRODUCT_NOUN.breakEvenShort}. The calendar tick is how much of the period has elapsed.`
                : "Sales vs plan. The calendar tick is how much of the period has elapsed. Spend optional."
            }
            targetMer={board.targetMer}
            breakEvenMer={board.breakEvenMer}
          />

          {!shotMode ? (
            <section className="mcfly-book mcfly-book--soft mcfly-goals-plan--soft" aria-label="Year plan">
              <p className="mcfly-book__lede">
                {noGoalsYet
                  ? "Set a year plan from last year’s sales."
                  : "Reset this year’s plan from last year’s sales."}
                {canGrowFromPrior
                  ? ` ${priorYear} months on file total ${formatCurrency(priorYearSales, currency)} — Grow 10% fills those months (${formatCurrency(previewTenPct, currency)}). Missing months stay blank.`
                  : ` Need ${priorYear} sales on file to fill months. Missing months are not $0.`}
              </p>
              <div className="mcfly-decision__actions">
                <Form method="post">
                  <input type="hidden" name="year" value={year} />
                  <input type="hidden" name="intent" value="apply_yoy_grow" />
                  <input type="hidden" name="yoyPct" value="10" />
                  <s-button
                    type="submit"
                    variant="primary"
                    {...(!canGrowFromPrior ? { disabled: true } : {})}
                    {...(savingIntent === "apply_yoy_grow" ||
                    savingIntent === "apply_yoy_10"
                      ? { loading: true }
                      : {})}
                  >
                    Grow 10% YoY
                  </s-button>
                </Form>
                {YOY_GROWTH_PRESETS.filter((p) => p !== 10).map((pct) => (
                  <Form method="post" key={pct}>
                    <input type="hidden" name="year" value={year} />
                    <input
                      type="hidden"
                      name="intent"
                      value="apply_yoy_grow"
                    />
                    <input type="hidden" name="yoyPct" value={pct} />
                    <button
                      type="submit"
                      className="mcfly-goals-yoy-btn"
                      disabled={isSaving || !canGrowFromPrior}
                    >
                      +{pct}%
                    </button>
                  </Form>
                ))}
              </div>
            </section>
          ) : null}

        </div>

        {!shotMode ? (
          <details className="mcfly-details mcfly-goals-plan-details mcfly-goals-plan-details--soft">
            <summary>Monthly board · fine-tune</summary>

            <div className="mcfly-goals-toggle-bar" aria-label="Show sales goals">
              <span className="mcfly-goals-toggle-bar__label">
                Show 12-month sales plan
              </span>
              <div className="mcfly-goals-toggle-bar__actions">
                <Form method="post">
                  <input type="hidden" name="year" value={year} />
                  <input type="hidden" name="intent" value="set_goals_enabled" />
                  <input type="hidden" name="goalsEnabled" value="true" />
                  <button
                    type="submit"
                    className={
                      goalsEnabled
                        ? "mcfly-goals-toggle mcfly-goals-toggle--on"
                        : "mcfly-goals-toggle"
                    }
                    disabled={goalsEnabled || isSaving}
                    aria-pressed={goalsEnabled}
                  >
                    On
                  </button>
                </Form>
                <Form method="post">
                  <input type="hidden" name="year" value={year} />
                  <input type="hidden" name="intent" value="set_goals_enabled" />
                  <input type="hidden" name="goalsEnabled" value="false" />
                  <button
                    type="submit"
                    className={
                      !goalsEnabled
                        ? "mcfly-goals-toggle mcfly-goals-toggle--on"
                        : "mcfly-goals-toggle"
                    }
                    disabled={!goalsEnabled || isSaving}
                    aria-pressed={!goalsEnabled}
                  >
                    Off
                  </button>
                </Form>
              </div>
            </div>

            {goalsEnabled ? (
              <>
                {forecast && forecast.monthGoal > 0 ? (
                  <section
                    className="mcfly-goals-forecast mcfly-goals-forecast--inline mcfly-goals-forecast--soft"
                    aria-label="Current month forecast"
                  >
                    <p className="mcfly-goals-forecast__takeaway">
                      <span className="mcfly-goals-forecast__kicker">
                        {forecast.monthLong} close
                      </span>
                      {" · "}
                      Projected {formatCurrency(forecast.projSales, currency)} vs{" "}
                      {formatCurrency(forecast.monthGoal, currency)}
                      {" · "}
                      <span
                        className={`mcfly-goals-pace mcfly-goals-pace--${forecast.pace.tone}`}
                      >
                        {forecast.pace.label}
                      </span>
                      {forecast.mtdSpend > 0 ? (
                        <ForecastMerLine
                          mer={forecast.mtdMer}
                          targetMer={forecast.targetMer}
                          breakEvenMer={board.breakEvenMer}
                          merRails={forecast.merRails}
                        />
                      ) : null}
                    </p>
                  </section>
                ) : null}

                <section
                  className="mcfly-panel mcfly-goals-panel mcfly-goals-panel--dense mcfly-goals-panel--soft"
                  aria-label="Monthly plan"
                >
                  <Form
                    method="post"
                    className="mcfly-goals-form"
                    key={goalsKey}
                    data-save-bar
                    data-discard-confirmation
                    onReset={handleDiscard}
                    aria-busy={
                      savingIntent === "save_goals" ||
                      savingIntent === "apply_yoy_10" ||
                      savingIntent === "apply_yoy_grow" ||
                      undefined
                    }
                  >
                    <input type="hidden" name="year" value={year} />
                    <input type="hidden" name="intent" value="save_goals" />
                    <div className="mcfly-goals-table-wrap">
                      <table className="mcfly-goals-table mcfly-goals-table--sales">
                        <thead>
                          <tr>
                            <th scope="col">Month</th>
                            <th scope="col">Goal</th>
                            <th scope="col">Actual</th>
                            {yearHasSpend ? (
                              <>
                                <th scope="col">Spend</th>
                                <th scope="col">Ceiling</th>
                                <th scope="col">MER</th>
                              </>
                            ) : null}
                            <th scope="col">Prior</th>
                            <th scope="col">YoY</th>
                            <th scope="col">Pace</th>
                          </tr>
                        </thead>
                        <tbody>
                          {board.rows.map((row) => (
                            <GoalRow
                              key={row.month}
                              row={row}
                              priorActual={priorYearMonthly[row.month - 1] ?? null}
                              inputId={`${formId}-g${row.month}`}
                              defaultValue={formatGoalInput(row.salesGoal)}
                              showGoalInput
                              showSpend={yearHasSpend}
                              targetMer={board.targetMer}
                            />
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <p className="mcfly-goals-form__hint">
                      {yearHasSpend
                        ? `${impliedSpendCeilingCaption(
                            "sales_goal",
                            board.targetMer,
                          )} `
                        : ""}
                      Dirty fields open the Admin save bar.{" "}
                      <s-link href="/app">{PRODUCT_NOUN.overviewTitle}</s-link>
                    </p>
                  </Form>
                </section>
              </>
            ) : (
              <section
                className="mcfly-panel mcfly-goals-panel mcfly-goals-panel--dense mcfly-goals-panel--soft"
                aria-label="Year over year board"
              >
                <div className="mcfly-panel__head mcfly-panel__head--tight">
                  <h2>YoY sales</h2>
                  <p className="mcfly-panel__muted">
                    Actual vs {priorYear}. Turn plan On to set monthly targets.
                  </p>
                </div>
                <div className="mcfly-goals-table-wrap">
                  <table className="mcfly-goals-table mcfly-goals-table--sales">
                    <thead>
                      <tr>
                        <th scope="col">Month</th>
                        <th scope="col">Actual</th>
                        {yearHasSpend ? (
                          <>
                            <th scope="col">Spend</th>
                            <th scope="col">MER</th>
                          </>
                        ) : null}
                        <th scope="col">Prior</th>
                        <th scope="col">YoY</th>
                      </tr>
                    </thead>
                    <tbody>
                      {board.rows.map((row) => {
                        const prior = priorYearMonthly[row.month - 1] ?? null;
                        const pct = yoyPct(row.actual, prior);
                        const rowClass = [
                          "mcfly-goals-table__row",
                          row.isCurrent ? "mcfly-goals-table__row--current" : "",
                          row.isFuture ? "mcfly-goals-table__row--future" : "",
                        ]
                          .filter(Boolean)
                          .join(" ");
                        return (
                          <tr key={row.month} className={rowClass}>
                            <th scope="row">
                              {row.monthShort}
                              {row.isCurrent ? (
                                <span className="mcfly-goals-table__now">
                                  {" "}
                                  MTD
                                </span>
                              ) : null}
                            </th>
                            <td>{formatSalesOrDash(row.actual, currency)}</td>
                            {yearHasSpend ? (
                              <>
                                <SpendCell spend={row.spend} />
                                <MerCell
                                  mer={row.mer}
                                  spend={row.spend}
                                  merRails={row.merRails}
                                />
                              </>
                            ) : null}
                            <td>{formatSalesOrDash(prior, currency)}</td>
                            <td>{formatYoyPct(pct)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </section>
            )}
          </details>
        ) : null}
      </div>
    </s-page>
  );
}

function SpendCell({ spend }: { spend: number }) {
  const currency = useDeskCurrency();
  return <td>{spend > 0 ? formatCurrency(spend, currency) : "—"}</td>;
}

function MerCell({
  mer,
  spend,
  merRails,
}: {
  mer: number | null;
  spend: number;
  merRails: MerVsRails;
}) {
  if (!(spend > 0) || mer == null) {
    return <td>—</td>;
  }
  const vsBe =
    merRails.vsBeAbs != null ? ` vs ${PRODUCT_NOUN.breakEvenShort}` : "";
  return (
    <td>
      <span className={`mcfly-goals-pace mcfly-goals-pace--${merRails.tone}`}>
        {formatMer(mer)}
        {vsBe}
      </span>
    </td>
  );
}

function ForecastMerLine({
  mer,
  targetMer,
  breakEvenMer,
  merRails,
}: {
  mer: number | null;
  targetMer: number;
  breakEvenMer: number | null;
  merRails: MerVsRails;
}) {
  const beBit =
    breakEvenMer != null && breakEvenMer > 0
      ? ` vs ${PRODUCT_NOUN.breakEvenShort} ${formatMer(breakEvenMer)}`
      : "";
  const targetBit =
    targetMer > 0 ? ` / vs target ${formatMer(targetMer)}` : "";
  const railLabel = merRails.label !== "—" ? ` · ${merRails.label}` : "";
  return (
    <>
      {" · "}
      <span className={`mcfly-goals-pace mcfly-goals-pace--${merRails.tone}`}>
        {PRODUCT_NOUN.totalRoas} {formatMer(mer)}
        {beBit}
        {targetBit}
        {railLabel}
      </span>
    </>
  );
}

function GoalRow({
  row,
  priorActual,
  inputId,
  defaultValue,
  showGoalInput,
  showSpend,
  targetMer,
}: {
  row: GoalMonthRow;
  priorActual: number | null;
  inputId: string;
  defaultValue: string;
  showGoalInput: boolean;
  showSpend: boolean;
  targetMer: number;
}) {
  const currency = useDeskCurrency();
  const hasGoal = row.salesGoal > 0;
  const spendCeiling = impliedSpendCeiling(row.salesGoal, targetMer);
  const barPct =
    hasGoal && row.pct != null && Number.isFinite(row.pct)
      ? Math.min(100, Math.max(0, row.pct))
      : null;
  const rowClass = [
    "mcfly-goals-table__row",
    row.isCurrent ? "mcfly-goals-table__row--current" : "",
    row.isFuture ? "mcfly-goals-table__row--future" : "",
    hasGoal && !row.isFuture
      ? `mcfly-goals-table__row--${row.pace.tone}`
      : "",
  ]
    .filter(Boolean)
    .join(" ");
  const pct = yoyPct(row.actual, priorActual);

  return (
    <tr className={rowClass}>
      <th scope="row">
        {row.monthShort}
        {row.isCurrent ? (
          <span className="mcfly-goals-table__now"> MTD</span>
        ) : null}
        {barPct != null && !row.isFuture ? (
          <div
            className="mcfly-goals-month-bar"
            role="progressbar"
            aria-valuenow={Math.round(barPct)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`${row.monthLong} ${Math.round(barPct)}% of goal`}
          >
            <div
              className={`mcfly-goals-month-bar__fill mcfly-goals-month-bar__fill--${row.pace.tone}`}
              style={{ width: `${barPct}%` }}
            />
          </div>
        ) : null}
      </th>
      {showGoalInput ? (
        <td>
          <input
            id={inputId}
            className="mcfly-goals-input"
            name={`goal_${row.month}`}
            inputMode="decimal"
            placeholder="0"
            defaultValue={defaultValue}
            aria-label={`${row.monthLong} sales goal`}
          />
        </td>
      ) : null}
      <td>{formatSalesOrDash(row.actual, currency)}</td>
      {showSpend ? (
        <>
          <SpendCell spend={row.spend} />
          <td>
            {spendCeiling != null ? formatCurrency(spendCeiling, currency) : "—"}
          </td>
          <MerCell mer={row.mer} spend={row.spend} merRails={row.merRails} />
        </>
      ) : null}
      <td>{formatSalesOrDash(priorActual, currency)}</td>
      <td>{formatYoyPct(pct)}</td>
      {showGoalInput ? (
        <td>
          <span className={`mcfly-goals-pace mcfly-goals-pace--${row.pace.tone}`}>
            {row.pace.label}
          </span>
        </td>
      ) : null}
    </tr>
  );
}

export function ErrorBoundary() {
  return <DeskRouteErrorBoundary retryHref="/app/goals" />;
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
