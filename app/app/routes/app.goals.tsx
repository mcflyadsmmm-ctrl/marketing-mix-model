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
import { authenticate } from "../shopify.server";
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
import { loadDeskSalesForPeriod } from "../lib/sales-facts.server";
import {
  fetchSampleSales,
  getSampleDeskEnabled,
} from "../lib/sample-desk.server";
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
import { PRO_UPSELL } from "../lib/entitlements";
import { GoalsYearTeaser } from "../components/ProValuePreview";
import { UseSampleCta } from "../components/UseSampleCta";
import { SalesGoalGauges } from "../components/SalesGoalGauges";
import { SampleDeskBanner } from "../components/SampleDeskBanner";

type ShopifyToast = {
  show?: (message: string, options?: { duration?: number; isError?: boolean }) => void;
};

type GoalsActionIntent =
  | "save_goals"
  | "apply_yoy_10"
  | "apply_yoy_grow"
  | "set_goals_enabled"
  | "save_target_mer";

function showAdminToast(
  message: string,
  options?: { duration?: number; isError?: boolean },
) {
  const bridge = (
    window as Window & { shopify?: { toast?: ShopifyToast } }
  ).shopify;
  bridge?.toast?.show?.(message, options);
}

function deltaTone(delta: number, goal: number): GoalPaceTone {
  if (!(goal > 0)) return "flat";
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

function monthMapToArray(map: Map<number, number>): number[] {
  return Array.from({ length: 12 }, (_, i) => {
    const v = map.get(i + 1);
    return Number.isFinite(v) ? (v as number) : 0;
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

/** Prior-year actual × (1 + pct/100), whole dollars; zero prior → zero goal. */
function goalsAtYoyGrowth(
  priorYearMonthly: number[],
  growthPct: number,
): number[] {
  const factor = 1 + growthPct / 100;
  return priorYearMonthly.map((prior) => {
    if (!(prior > 0)) return 0;
    return Math.round(prior * factor);
  });
}

function yoyPct(actual: number, prior: number): number | null {
  if (!(prior > 0) || !Number.isFinite(actual)) return null;
  return ((actual - prior) / prior) * 100;
}

function formatYoyPct(pct: number | null): string {
  if (pct == null) return "—";
  const sign = pct > 0 ? "+" : "";
  return `${sign}${pct.toFixed(0)}%`;
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);
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
  if (useSampleDesk) {
    periodSales = await fetchSampleSales(shop.id, periodRange);
  } else {
    const desk = await loadDeskSalesForPeriod({
      admin,
      shopId: shop.id,
      range: periodRange,
      ianaTimezone: shop.ianaTimezone,
    });
    periodSales = desk.sales;
    periodSalesError = desk.salesError;
  }
  const periodMetrics = await buildDashboardMetrics(
    session.shop,
    periodRange,
    periodSales,
    {
      salesBasis: parseSalesBasis(settings.salesBasis, "total"),
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
  };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);
  const shop = await ensureShop(session.shop);
  const form = await request.formData();
  const year = parseGoalsYear(String(form.get("year") ?? ""));
  const intent = String(form.get("intent") ?? "save_goals") as GoalsActionIntent;
  const useSampleDesk = await getSampleDeskEnabled(shop.id);
  const entitlements = getShopEntitlements(session.shop, {
    sampleDesk: useSampleDesk,
    paidPro: shop.proBillingActive,
  });

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
    if (!entitlements.canUseAdvancedGoals) {
      return {
        success: false as const,
        intent,
        error: PRO_UPSELL.goals,
        year,
        goalsEnabled: null as boolean | null,
        targetMer: null as number | null,
      };
    }
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
    if (!entitlements.canUseAdvancedGoals) {
      return {
        success: false as const,
        intent,
        error: PRO_UPSELL.goals,
        year,
        goalsEnabled: null as boolean | null,
        targetMer: null as number | null,
        yoyPct: null as number | null,
      };
    }
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

  // save_goals (default) — 12-month plan is Pro (or SAMPLE preview)
  if (!entitlements.canUseAdvancedGoals) {
    return {
      success: false as const,
      intent: "save_goals" as const,
      error: PRO_UPSELL.goals,
      year,
      goalsEnabled: null as boolean | null,
      targetMer: null as number | null,
    };
  }

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
  const priorYearSales = priorYearMonthly.reduce((a, b) => a + b, 0);
  const previewTenPct = goalsAtYoyGrowth(priorYearMonthly, 10).reduce(
    (a, b) => a + b,
    0,
  );
  const monthsWithPrior = priorYearMonthly.filter((v) => v > 0).length;
  const noGoalsYet = board.rows.every((r) => !(r.salesGoal > 0));
  const canUseYearBoard = entitlements.canUseAdvancedGoals;

  useEffect(() => {
    if (!actionData) return;
    if (actionData.success) {
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
            : "Sales goals hidden · YoY only",
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
    ? `${periodMetrics.period.label}${PRODUCT_NOUN.practicePeriodSuffix}`
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
          shotMode ? "mcfly-desk--shot" : null,
          useSampleDesk ? "mcfly-desk--sample" : null,
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <div className="mcfly-goals__rail">
          <header className="mcfly-topbar mcfly-goals__top">
            <div>
              <p className="mcfly-topbar__def mcfly-topbar__def--solo">
                Set the year. Mcfly tracks sales, spend, and{" "}
                {PRODUCT_NOUN.totalRoas} against it.
              </p>
            </div>
            <PeriodControl preset={preset} shotMode={shotMode} />
          </header>

          <div className="mcfly-ctx mcfly-goals__ctx" aria-live="polite">
            <div className="mcfly-ctx__main">
              <span className="mcfly-ctx__brand">Goals</span>
              <span className="mcfly-ctx__sep" aria-hidden="true">
                ·
              </span>
              <span className="mcfly-ctx__asof">{tillLabel}</span>
              {!shotMode ? (
                <>
                  <span className="mcfly-ctx__sep" aria-hidden="true">
                    ·
                  </span>
                  <span className="mcfly-ctx__asof">
                    {PRODUCT_NOUN.totalRoasGoal} {formatMer(targetMer)}×
                  </span>
                </>
              ) : null}
            </div>
            <div className="mcfly-ctx__chips">
              {useSampleDesk && !shotMode ? (
                <span className="mcfly-ctx-chip mcfly-ctx-chip--flat">
                  {PRODUCT_NOUN.samplePreview}
                </span>
              ) : null}
              {canUseYearBoard ? (
                !goalsEnabled ? (
                  <span className="mcfly-ctx-chip mcfly-ctx-chip--flat">
                    Goals hidden · YoY only
                  </span>
                ) : (
                  <span className={`mcfly-ctx-chip mcfly-ctx-chip--${ytdTone}`}>
                    YTD{" "}
                    {board.ytd.pct == null
                      ? "—"
                      : `${board.ytd.pct.toFixed(0)}%`}{" "}
                    of goal
                  </span>
                )
              ) : null}
              {canUseYearBoard ? (
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
              ) : null}
            </div>
          </div>
          {!shotMode ? (
            <p className="mcfly-goals__lede">
              Same sales ÷ spend as Overview for {periodMetrics.period.label}.{" "}
              Type the sales you want this year — the board shows the most you
              can spend each month and still hit your Total ROAS target.{" "}
              {PRODUCT_NOUN.totalRoas} target lives in{" "}
              <s-link href="/app/settings">Settings</s-link>.
            </p>
          ) : null}
        </div>

        {!shotMode && entitlements.showStartTrial ? (
          <p className="mcfly-panel__muted">
            The whole desk is included. Start the 7-day trial in{" "}
            <s-link href="/app/settings">Settings</s-link>.
          </p>
        ) : null}

        {useSampleDesk && !shotMode ? (
          <SampleDeskBanner note="Goals below use SAMPLE sales." />
        ) : null}

        {salesError && !shotMode ? (
          <s-banner tone="critical" heading="Sales didn’t load">
            <s-paragraph>
              {salesError} — goals still save; actuals stay $0 until the sales pull
              works.
            </s-paragraph>
          </s-banner>
        ) : null}

        {isSaving || isRevalidating ? (
          <s-banner tone="info" heading="Updating goals">
            <s-paragraph>Writing your {year} plan…</s-paragraph>
          </s-banner>
        ) : null}

        <div className="mcfly-goals__main">
          <section
            className="mcfly-panel mcfly-goals-period"
            aria-label={`This period · ${periodMetrics.period.label}`}
          >
            <div className="mcfly-panel__head mcfly-panel__head--tight">
              <h2>This period · {periodMetrics.period.label}</h2>
              <p className="mcfly-panel__muted">
                Same Shopify sales ÷ spend you added as Overview · vs{" "}
                {PRODUCT_NOUN.totalRoasGoal} {formatMer(targetMer)}×
              </p>
            </div>
            <div className="mcfly-acq-grid mcfly-goals-period__grid">
              <div className="mcfly-acq-tile mcfly-acq-tile--cream">
                <p className="mcfly-acq-tile__k">Sales</p>
                <p className="mcfly-acq-tile__v">
                  {formatCurrency(periodMetrics.sales)}
                </p>
                <p className="mcfly-acq-tile__def">{PRODUCT_NOUN.salesBasisShort}</p>
              </div>
              <div className="mcfly-acq-tile mcfly-acq-tile--cream">
                <p className="mcfly-acq-tile__k">Spend</p>
                <p className="mcfly-acq-tile__v">
                  {formatCurrency(periodMetrics.totalSpend)}
                </p>
                <p className="mcfly-acq-tile__def">Uploaded ad spend · this period</p>
              </div>
              <div className="mcfly-acq-tile mcfly-acq-tile--mint">
                <p className="mcfly-acq-tile__k">{PRODUCT_NOUN.totalRoas}</p>
                <p className="mcfly-acq-tile__v">
                  {periodMetrics.mer != null
                    ? formatMer(periodMetrics.mer)
                    : "—"}
                </p>
                <p className="mcfly-acq-tile__def">
                  <span
                    className={`mcfly-goals-pace mcfly-goals-pace--${periodMerRails.tone}`}
                  >
                    {periodMerRails.label !== "—"
                      ? periodMerRails.label
                      : periodVsTarget != null
                        ? `${periodVsTarget >= 0 ? "+" : ""}${periodVsTarget.toFixed(2)}× vs target`
                        : "Sales ÷ spend"}
                  </span>
                </p>
              </div>
              <div className="mcfly-acq-tile mcfly-acq-tile--sky">
                <p className="mcfly-acq-tile__k">Spend ceiling</p>
                <p className="mcfly-acq-tile__v">
                  {periodSpendCeiling != null
                    ? formatCurrency(periodSpendCeiling)
                    : "—"}
                </p>
                <p className="mcfly-acq-tile__def">
                  {impliedSpendCeilingCaption(
                    "period_sales",
                    targetMer,
                  )}
                </p>
              </div>
            </div>
          </section>

          {canUseYearBoard ? (
            <SalesGoalGauges
              periods={periods}
              heading="MTD · QTD · YTD"
              muted={`Sales vs plan plus cash ${PRODUCT_NOUN.totalRoas} vs ${PRODUCT_NOUN.breakEvenShort} · calendar tick = period elapsed`}
              targetMer={board.targetMer}
              breakEvenMer={board.breakEvenMer}
            />
          ) : null}

          {canUseYearBoard && !shotMode ? (
            <section
              className="mcfly-panel mcfly-goals-declare mcfly-goals-declare--compact"
              aria-label="Declare sales goals"
            >
              <div className="mcfly-panel__head mcfly-panel__head--tight">
                <h2>
                  {noGoalsYet ? "One-click plan" : "Reset from YoY"}
                </h2>
                <p className="mcfly-panel__muted">
                  {priorYearSales > 0
                    ? `${priorYear} ${formatCurrency(priorYearSales)} → +10% ${formatCurrency(previewTenPct)} · ${monthsWithPrior} mo`
                    : `Need ${priorYear} sales on file to fill months.`}
                </p>
              </div>

              <div className="mcfly-goals-declare__row">
                <Form method="post" className="mcfly-goals-declare__primary">
                  <input type="hidden" name="year" value={year} />
                  <input type="hidden" name="intent" value="apply_yoy_grow" />
                  <input type="hidden" name="yoyPct" value="10" />
                  <s-button
                    type="submit"
                    variant="primary"
                    {...(savingIntent === "apply_yoy_grow" ||
                    savingIntent === "apply_yoy_10"
                      ? { loading: true }
                      : {})}
                  >
                    Grow 10% YoY
                  </s-button>
                </Form>
                <div
                  className="mcfly-goals-declare__presets"
                  aria-label="Other growth rates"
                >
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
                        disabled={isSaving}
                      >
                        +{pct}%
                      </button>
                    </Form>
                  ))}
                </div>
              </div>
            </section>
          ) : null}

          {!canUseYearBoard && !shotMode ? (
            <section
              className="mcfly-panel mcfly-goals-year-teaser"
              aria-label="Year board — Pro"
            >
              <div className="mcfly-panel__head mcfly-panel__head--tight">
                <h2>Year board</h2>
                <p className="mcfly-panel__muted">
                  Monthly sales goals, spend, and {PRODUCT_NOUN.totalRoas} rails
                  for the whole year
                </p>
              </div>
              <GoalsYearTeaser targetMer={targetMer} />
              <UseSampleCta />
            </section>
          ) : null}
        </div>

        {canUseYearBoard && !shotMode ? (
          <details open className="mcfly-details mcfly-goals-plan-details">
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
                    className="mcfly-goals-forecast mcfly-goals-forecast--inline"
                    aria-label="Current month forecast"
                  >
                    <p className="mcfly-goals-forecast__takeaway">
                      <span className="mcfly-goals-forecast__kicker">
                        {forecast.monthLong} close
                      </span>
                      {" · "}
                      Projected {formatCurrency(forecast.projSales)} vs{" "}
                      {formatCurrency(forecast.monthGoal)}
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
                  className="mcfly-panel mcfly-goals-panel mcfly-goals-panel--dense"
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
                            <th scope="col">Spend</th>
                            <th scope="col">Ceiling</th>
                            <th scope="col">MER</th>
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
                              priorActual={priorYearMonthly[row.month - 1] ?? 0}
                              inputId={`${formId}-g${row.month}`}
                              defaultValue={formatGoalInput(row.salesGoal)}
                              showGoalInput
                              targetMer={board.targetMer}
                            />
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <p className="mcfly-goals-form__hint">
                      {impliedSpendCeilingCaption(
                        "sales_goal",
                        board.targetMer,
                      )}{" "}
                      Dirty fields open the Admin save bar.{" "}
                      <s-link href="/app">{PRODUCT_NOUN.deskTitle}</s-link>
                    </p>
                  </Form>
                </section>
              </>
            ) : (
              <section
                className="mcfly-panel mcfly-goals-panel mcfly-goals-panel--dense"
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
                        <th scope="col">Spend</th>
                        <th scope="col">MER</th>
                        <th scope="col">Prior</th>
                        <th scope="col">YoY</th>
                      </tr>
                    </thead>
                    <tbody>
                      {board.rows.map((row) => {
                        const prior = priorYearMonthly[row.month - 1] ?? 0;
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
                            <td>{formatCurrency(row.actual)}</td>
                            <SpendCell spend={row.spend} />
                            <MerCell
                              mer={row.mer}
                              spend={row.spend}
                              merRails={row.merRails}
                            />
                            <td>{formatCurrency(prior)}</td>
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
  return <td>{spend > 0 ? formatCurrency(spend) : "—"}</td>;
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
  targetMer,
}: {
  row: GoalMonthRow;
  priorActual: number;
  inputId: string;
  defaultValue: string;
  showGoalInput: boolean;
  targetMer: number;
}) {
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
      <td>{formatCurrency(row.actual)}</td>
      <SpendCell spend={row.spend} />
      <td>
        {spendCeiling != null ? formatCurrency(spendCeiling) : "—"}
      </td>
      <MerCell mer={row.mer} spend={row.spend} merRails={row.merRails} />
      <td>{formatCurrency(priorActual)}</td>
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

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
