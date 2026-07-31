import { useEffect, useId } from "react";
import type {
  ActionFunctionArgs,
  HeadersFunction,
  LoaderFunctionArgs,
} from "react-router";
import {
  Form,
  useActionData,
  useLoaderData,
  useNavigation,
  useSearchParams,
} from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import { ensureShop, getOrCreateSettings } from "../lib/mer-dashboard.server";
import { formatCurrency, formatMer } from "../lib/mer-format";
import { PRODUCT_NOUN } from "../lib/product-labels";
import { getSampleDeskEnabled } from "../lib/sample-desk.server";
import {
  buildSalesGoalPeriods,
  buildYearBoard,
  loadSalesByDayForGoalsRange,
  parseGoalsYear,
  salesByMonthFromDayMap,
  spendByMonthMap,
  upsertYearSalesGoals,
  yearDateRange,
  type GoalMonthRow,
  type GoalPaceTone,
} from "../lib/sales-goals.server";
import { getShopEntitlements } from "../lib/entitlements.server";
import { PRO_UPSELL } from "../lib/entitlements";
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
  const { session } = await authenticate.admin(request);
  const url = new URL(request.url);
  const shotMode = url.searchParams.get("shot") === "1";
  const year = parseGoalsYear(url.searchParams.get("year"));
  const shop = await ensureShop(session.shop);
  const settings = await getOrCreateSettings(shop.id);
  const useSampleDesk = await getSampleDeskEnabled(shop.id);
  const range = yearDateRange(year, shop.ianaTimezone);
  const priorYear = year - 1;
  const priorRange = yearDateRange(priorYear, shop.ianaTimezone);

  const thisYear = new Date().getFullYear();
  const [currentSales, priorSales] = await Promise.all([
    loadSalesByDayForGoalsRange(shop.id, shop.ianaTimezone, range, useSampleDesk),
    loadSalesByDayForGoalsRange(
      shop.id,
      shop.ianaTimezone,
      priorRange,
      useSampleDesk,
    ),
  ]);

  const salesByDay = currentSales.salesByDay;
  const salesError = currentSales.salesError;
  const salesByMonth = salesByMonthFromDayMap(year, salesByDay);
  const priorSalesByMonth = salesByMonthFromDayMap(
    priorYear,
    priorSales.salesByDay,
  );
  const priorYearMonthly = monthMapToArray(priorSalesByMonth);

  const spendOpts = useSampleDesk
    ? { sampleOnly: true as const, ianaTimezone: shop.ianaTimezone }
    : { excludeSample: true as const, ianaTimezone: shop.ianaTimezone };
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
    priorYearMonthly,
  });

  const yearOptions = Array.from(
    new Set([thisYear - 1, thisYear, thisYear + 1, year]),
  ).sort((a, b) => a - b);

  return {
    board,
    periods,
    year,
    yearOptions,
    shotMode,
    useSampleDesk,
    salesError,
    goalsEnabled: Boolean(settings.goalsEnabled),
    targetMer: settings.targetMer,
    priorYear,
    priorYearMonthly,
    entitlements: getShopEntitlements(session.shop, { sampleDesk: useSampleDesk }),
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
    const priorRange = yearDateRange(priorYear, shop.ianaTimezone);
    const { salesByDay, salesError } = await loadSalesByDayForGoalsRange(
      shop.id,
      shop.ianaTimezone,
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
    ? `${year} · SAMPLE`
    : `${year} · live sales`;

  const onYearChange = (next: string) => {
    const params = new URLSearchParams(searchParams);
    params.set("year", next);
    if (shotMode) params.set("shot", "1");
    setSearchParams(params);
  };

  const pageHeading = shotMode ? undefined : "Goals";

  return (
    <s-page heading={pageHeading} inlineSize="large">
      <div
        className={[
          "mcfly-desk",
          "mcfly-desk--chrome",
          shotMode ? "mcfly-desk--shot" : null,
          useSampleDesk ? "mcfly-desk--sample" : null,
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <header className="mcfly-topbar mcfly-topbar--settings">
          <div>
            {!shotMode ? (
              <p className="mcfly-topbar__def mcfly-topbar__def--solo">
                Set the plan once — Grow 10% YoY applies to all months.{" "}
                {PRODUCT_NOUN.totalRoas} stays on Overview.
              </p>
            ) : null}
          </div>
          <div className="mcfly-goals-year" aria-label="Plan year">
            <label className="mcfly-goals-year__label" htmlFor={`${formId}-year`}>
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
        </header>

        {!shotMode && entitlements.showProTeaser ? (
          <s-banner tone="info" heading="Pro · advanced Goals">
            <s-paragraph>{entitlements.upsell.goals}</s-paragraph>
            <div className="mcfly-decision__actions" style={{ marginTop: "0.65rem" }}>
              <s-button href="/app/settings" variant="primary">
                {entitlements.upsell.upgradeCta}
              </s-button>
              <s-button href="/app/demo" variant="secondary">
                Try SAMPLE preview
              </s-button>
            </div>
          </s-banner>
        ) : null}

        <div className="mcfly-ctx" aria-live="polite">
          <div className="mcfly-ctx__main">
            <span className="mcfly-ctx__brand">Goals</span>
            <span className="mcfly-ctx__sep" aria-hidden="true">
              ·
            </span>
            <span className="mcfly-ctx__asof">{tillLabel}</span>
          </div>
          <div className="mcfly-ctx__chips">
            {useSampleDesk && !shotMode ? (
              <span className="mcfly-ctx-chip mcfly-ctx-chip--flat">
                {PRODUCT_NOUN.samplePreview}
              </span>
            ) : null}
            {!goalsEnabled ? (
              <span className="mcfly-ctx-chip mcfly-ctx-chip--flat">
                Goals hidden · YoY only
              </span>
            ) : (
              <span className={`mcfly-ctx-chip mcfly-ctx-chip--${ytdTone}`}>
                YTD {board.ytd.pct == null ? "—" : `${board.ytd.pct.toFixed(0)}%`} of
                goal
              </span>
            )}
          </div>
        </div>

        <SalesGoalGauges periods={periods} />

        {!shotMode ? (
          <section
            className="mcfly-panel mcfly-goals-declare"
            aria-label="Declare sales goals"
          >
            <div className="mcfly-panel__head">
              <h2>
                {noGoalsYet
                  ? "Declare goals in one click"
                  : "Reset all months from YoY"}
              </h2>
              <p className="mcfly-panel__muted">
                Grow last year’s sales by a % — applies to all 12 months.
                {priorYearSales > 0
                  ? ` ${priorYear} sales ${formatCurrency(priorYearSales)} → +10% plan ${formatCurrency(previewTenPct)} (${monthsWithPrior} months).`
                  : ` Need ${priorYear} sales on file (facts or SAMPLE) to fill months.`}
              </p>
            </div>

            {entitlements.canUseAdvancedGoals ? (
              <>
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
                    Grow 10% YoY · apply to all
                  </s-button>
                </Form>
                <div
                  className="mcfly-goals-declare__presets"
                  aria-label="Other growth rates"
                >
                  {YOY_GROWTH_PRESETS.filter((p) => p !== 10).map((pct) => (
                    <Form method="post" key={pct}>
                      <input type="hidden" name="year" value={year} />
                      <input type="hidden" name="intent" value="apply_yoy_grow" />
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
                <p className="mcfly-goals-yoy-apply__hint">
                  Each month = {priorYear} sales × (1 + %). Zero prior months stay
                  $0. Fine-tune any month below.
                </p>
              </>
            ) : (
              <div className="mcfly-decision__actions">
                <s-button href="/app/settings" variant="primary">
                  {entitlements.upsell.upgradeCta}
                </s-button>
                <s-button href="/app/demo" variant="secondary">
                  Try SAMPLE preview
                </s-button>
              </div>
            )}
          </section>
        ) : null}

        {!shotMode ? (
          <p className="mcfly-sales-gauges__mer-link">
            {PRODUCT_NOUN.totalRoasGoal} {formatMer(targetMer)}× · edit in{" "}
            <s-link href="/app/settings">Settings</s-link>
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

        {!shotMode ? (
        <details className="mcfly-details mcfly-goals-plan-details">
          <summary>Fine-tune months (optional)</summary>

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
            <section
              className="mcfly-panel mcfly-goals-panel"
              aria-label="Monthly plan"
            >
              <div className="mcfly-panel__head">
                <h2>12-month sales plan</h2>
                <p>
                  Edit any month. Dirty fields open the Admin save bar — Discard
                  restores the last saved plan.
                </p>
              </div>

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
                        />
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="mcfly-goals-form__actions">
                  <s-link href="/app">{PRODUCT_NOUN.deskTitle}</s-link>
                </div>
              </Form>
            </section>

            {forecast && forecast.monthGoal > 0 ? (
              <section
                className="mcfly-goals-forecast"
                aria-label="Current month forecast"
              >
                <p className="mcfly-goals-forecast__kicker">
                  {forecast.monthLong} close · pace from MTD average
                </p>
                <p className="mcfly-goals-forecast__takeaway">
                  Projected {formatCurrency(forecast.projSales)}
                  {` vs ${formatCurrency(forecast.monthGoal)} goal`}
                  {" · "}
                  <span
                    className={`mcfly-goals-pace mcfly-goals-pace--${forecast.pace.tone}`}
                  >
                    {forecast.pace.label}
                  </span>
                </p>
              </section>
            ) : null}
          </>
        ) : (
          <section
            className="mcfly-panel mcfly-goals-panel"
            aria-label="Year over year board"
          >
            <div className="mcfly-panel__head">
              <h2>YoY sales board</h2>
              <p>
                Actual sales vs {priorYear}. Turn on Show 12-month sales plan to
                set monthly targets.
              </p>
            </div>
            <div className="mcfly-goals-table-wrap">
              <table className="mcfly-goals-table mcfly-goals-table--sales">
                <thead>
                  <tr>
                    <th scope="col">Month</th>
                    <th scope="col">Actual</th>
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
                            <span className="mcfly-goals-table__now"> MTD</span>
                          ) : null}
                        </th>
                        <td>{formatCurrency(row.actual)}</td>
                        <td>{formatCurrency(prior)}</td>
                        <td>{formatYoyPct(pct)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="mcfly-goals-form__actions">
              <s-link href="/app">{PRODUCT_NOUN.deskTitle}</s-link>
            </div>
          </section>
        )}
        </details>
        ) : null}
      </div>
    </s-page>
  );
}

function GoalRow({
  row,
  priorActual,
  inputId,
  defaultValue,
  showGoalInput,
}: {
  row: GoalMonthRow;
  priorActual: number;
  inputId: string;
  defaultValue: string;
  showGoalInput: boolean;
}) {
  const rowClass = [
    "mcfly-goals-table__row",
    row.isCurrent ? "mcfly-goals-table__row--current" : "",
    row.isFuture ? "mcfly-goals-table__row--future" : "",
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
