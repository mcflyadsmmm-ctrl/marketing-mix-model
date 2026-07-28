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
import {
  boundary,
  type AdminApiContext,
} from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import { ensureShop, getOrCreateSettings } from "../lib/mer-dashboard.server";
import { formatCurrency, formatMer } from "../lib/mer-format";
import { PRODUCT_NOUN } from "../lib/product-labels";
import type { DateRange } from "../lib/periods";
import {
  fetchSampleSalesByDay,
  getSampleDeskEnabled,
} from "../lib/sample-desk.server";
import {
  buildYearBoard,
  parseGoalsYear,
  salesByMonthFromDayMap,
  spendByMonthMap,
  upsertYearSalesGoals,
  yearDateRange,
  type GoalMonthRow,
  type GoalPaceTone,
} from "../lib/sales-goals.server";
import { fetchShopifySalesByDay } from "../lib/shopify-sales.server";
import {
  getSalesFactsByDay,
  getSalesFactsCoverage,
} from "../lib/sales-facts.server";

type ShopifyToast = {
  show?: (message: string, options?: { duration?: number; isError?: boolean }) => void;
};

type GoalsActionIntent =
  | "save_goals"
  | "apply_yoy_10"
  | "set_goals_enabled"
  | "save_target_mer";

const SUGGESTED_MER_GOAL = 4;

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

/** Prior-year actual × 1.10, whole dollars; zero prior → zero goal. */
function goalsAtTenPercentYoy(priorYearMonthly: number[]): number[] {
  return priorYearMonthly.map((prior) => {
    if (!(prior > 0)) return 0;
    return Math.round(prior * 1.1);
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

async function loadSalesByDayForRange(
  shopId: string,
  ianaTimezone: string | null | undefined,
  range: DateRange,
  useSampleDesk: boolean,
  admin: AdminApiContext,
  options?: { preferFacts?: boolean },
): Promise<{ salesByDay: Map<string, number>; salesError: string | null }> {
  if (useSampleDesk) {
    return {
      salesByDay: await fetchSampleSalesByDay(shopId, range),
      salesError: null,
    };
  }
  // Soft: prefer SalesDayFact when coverage is complete (current year only at call site).
  if (options?.preferFacts) {
    try {
      const coverage = await getSalesFactsCoverage(shopId, range);
      if (coverage.complete) {
        return {
          salesByDay: await getSalesFactsByDay(shopId, range),
          salesError: null,
        };
      }
    } catch {
      // Fall through to live GraphQL.
    }
  }
  try {
    return {
      salesByDay: await fetchShopifySalesByDay(
        admin,
        range,
        ianaTimezone || "UTC",
      ),
      salesError: null,
    };
  } catch (err) {
    return {
      salesByDay: new Map(),
      salesError:
        err instanceof Error ? err.message : "Failed to load Shopify sales",
    };
  }
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);
  const url = new URL(request.url);
  const shotMode = url.searchParams.get("shot") === "1";
  const year = parseGoalsYear(url.searchParams.get("year"));
  const shop = await ensureShop(session.shop);
  const settings = await getOrCreateSettings(shop.id);
  const useSampleDesk = await getSampleDeskEnabled(shop.id);
  const range = yearDateRange(year);
  const priorYear = year - 1;
  const priorRange = yearDateRange(priorYear);

  const thisYear = new Date().getFullYear();
  const [currentSales, priorSales] = await Promise.all([
    loadSalesByDayForRange(
      shop.id,
      shop.ianaTimezone,
      range,
      useSampleDesk,
      admin,
      // Prefer facts for the current year when the 60d window covers it; keep
      // prior-year YoY on live GraphQL so we don't underclaim with a short fact window.
      { preferFacts: year === thisYear },
    ),
    loadSalesByDayForRange(
      shop.id,
      shop.ianaTimezone,
      priorRange,
      useSampleDesk,
      admin,
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
    ? { sampleOnly: true as const }
    : { excludeSample: true as const };
  const spendByMonth = await spendByMonthMap(shop.id, year, spendOpts);

  const board = await buildYearBoard(
    shop.id,
    year,
    salesByMonth,
    spendByMonth,
    settings.targetMer,
  );

  const yearOptions = Array.from(
    new Set([thisYear - 1, thisYear, thisYear + 1, year]),
  ).sort((a, b) => a - b);

  return {
    board,
    year,
    yearOptions,
    shotMode,
    useSampleDesk,
    salesError,
    goalsEnabled: Boolean(settings.goalsEnabled),
    targetMer: settings.targetMer,
    priorYear,
    priorYearMonthly,
  };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);
  const shop = await ensureShop(session.shop);
  const form = await request.formData();
  const year = parseGoalsYear(String(form.get("year") ?? ""));
  const intent = String(form.get("intent") ?? "save_goals") as GoalsActionIntent;

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

  if (intent === "apply_yoy_10") {
    const useSampleDesk = await getSampleDeskEnabled(shop.id);
    const priorYear = year - 1;
    const priorRange = yearDateRange(priorYear);
    const { salesByDay, salesError } = await loadSalesByDayForRange(
      shop.id,
      shop.ianaTimezone,
      priorRange,
      useSampleDesk,
      admin,
    );
    if (salesError) {
      return {
        success: false as const,
        intent,
        error: `Could not load ${priorYear} sales for YoY goals: ${salesError}`,
        year,
        goalsEnabled: true as boolean | null,
        targetMer: null as number | null,
      };
    }
    const priorSalesByMonth = salesByMonthFromDayMap(priorYear, salesByDay);
    const monthly = goalsAtTenPercentYoy(monthMapToArray(priorSalesByMonth));
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
      };
    }
    return {
      success: true as const,
      intent,
      error: null,
      year,
      goalsEnabled: true as boolean | null,
      targetMer: null as number | null,
    };
  }

  // save_goals (default)
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
    year,
    yearOptions,
    shotMode,
    useSampleDesk,
    salesError,
    goalsEnabled,
    targetMer,
    priorYear,
    priorYearMonthly,
  } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const [searchParams, setSearchParams] = useSearchParams();
  const formId = useId();
  const merFieldId = `${formId}-mer`;

  const isSaving = navigation.state === "submitting";
  const isRevalidating =
    navigation.state === "loading" && navigation.formMethod != null;
  const savingIntent =
    navigation.state === "submitting"
      ? String(navigation.formData?.get("intent") ?? "")
      : "";

  const goalsKey = `${board.year}:${board.rows.map((r) => r.salesGoal).join("|")}`;
  const merFormKey = `mer:${targetMer}`;

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
      if (actionData.intent === "apply_yoy_10") {
        showAdminToast(`Applied 10% YoY goals for ${actionData.year}`, {
          duration: 4000,
        });
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
    ? `${year} · sample data`
    : `${year} · live sales`;

  const onYearChange = (next: string) => {
    const params = new URLSearchParams(searchParams);
    params.set("year", next);
    if (shotMode) params.set("shot", "1");
    setSearchParams(params);
  };

  const pageHeading = shotMode
    ? undefined
    : goalsEnabled
      ? PRODUCT_NOUN.totalRoasGoal
      : "Goals";

  return (
    <s-page heading={pageHeading} inlineSize="large">
      <div
        className={
          shotMode
            ? "mcfly-desk mcfly-desk--chrome mcfly-desk--shot"
            : "mcfly-desk mcfly-desk--chrome"
        }
      >
        <header className="mcfly-topbar mcfly-topbar--settings">
          <div>
            <p className="mcfly-topbar__def mcfly-topbar__def--solo">
              {PRODUCT_NOUN.totalRoasGoal} first · then the 12-month plan ·{" "}
              {PRODUCT_NOUN.definition}
            </p>
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
              <span className="mcfly-ctx-chip mcfly-ctx-chip--flat">Sample desk</span>
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
            <span className="mcfly-ctx-chip mcfly-ctx-chip--flat">
              {PRODUCT_NOUN.totalRoasGoal} {formatMer(targetMer)}×
            </span>
          </div>
        </div>

        <section
          className="mcfly-goals-mer-card"
          aria-labelledby={`${formId}-mer-heading`}
        >
          <p className="mcfly-goals-mer-card__kicker">
            {PRODUCT_NOUN.mdsThesis}
          </p>
          <h2 id={`${formId}-mer-heading`} className="mcfly-goals-mer-card__title">
            {PRODUCT_NOUN.totalRoasGoal}
          </h2>
          <p className="mcfly-goals-mer-card__subtitle">
            Operating threshold · suggest 4.0×
          </p>
          <p className="mcfly-goals-mer-card__explain">
            {PRODUCT_NOUN.totalRoasGoal} is your operating threshold —{" "}
            {PRODUCT_NOUN.definition}, defendable to finance. Above break-even
            from margin means the period is profitable in cash terms.
          </p>
          <p className="mcfly-goals-mer-card__current">
            Current: <strong>{formatMer(targetMer)}×</strong>
          </p>
          <Form
            method="post"
            className="mcfly-goals-mer-card__form"
            key={merFormKey}
            aria-busy={savingIntent === "save_target_mer" || undefined}
          >
            <input type="hidden" name="year" value={year} />
            <input type="hidden" name="intent" value="save_target_mer" />
            <label className="mcfly-goals-mer-card__label" htmlFor={merFieldId}>
              {PRODUCT_NOUN.totalRoasGoal}
            </label>
            <div className="mcfly-goals-mer-card__row">
              <input
                id={merFieldId}
                className="mcfly-goals-mer-input"
                name="targetMer"
                type="number"
                inputMode="decimal"
                min="0.01"
                step="0.1"
                required
                defaultValue={
                  Number.isFinite(targetMer) ? String(targetMer) : ""
                }
                aria-describedby={`${formId}-mer-hint`}
              />
              <span className="mcfly-goals-mer-card__unit" aria-hidden="true">
                ×
              </span>
              <button
                type="submit"
                className="mcfly-goals-mer-save"
                disabled={isSaving}
              >
                {savingIntent === "save_target_mer"
                  ? "Saving…"
                  : `Save ${PRODUCT_NOUN.totalRoasGoal}`}
              </button>
            </div>
          </Form>
          <div className="mcfly-goals-mer-card__suggest">
            <p id={`${formId}-mer-hint`} className="mcfly-goals-mer-card__hint">
              Suggested for most stores: 4.0×
            </p>
            <Form method="post">
              <input type="hidden" name="year" value={year} />
              <input type="hidden" name="intent" value="save_target_mer" />
              <input
                type="hidden"
                name="targetMer"
                value={String(SUGGESTED_MER_GOAL)}
              />
              <button
                type="submit"
                className="mcfly-goals-mer-suggest"
                disabled={isSaving || targetMer === SUGGESTED_MER_GOAL}
              >
                Use 4.0×
              </button>
            </Form>
          </div>
        </section>

        {useSampleDesk && !shotMode ? (
          <s-banner tone="warning" heading="Sample desk is on — not live Shopify">
            <s-paragraph>
              Goals below compare against sample sales + spend. Turn sample desk{" "}
              <strong>OFF</strong> on the <s-link href="/app/demo">Demo</s-link> tab
              before App Store review.
            </s-paragraph>
          </s-banner>
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
                  Enter sales dollars per month after you set{" "}
                  {PRODUCT_NOUN.totalRoasGoal}. Dirty fields open the Admin save
                  bar — Discard restores the last saved plan.
                </p>
              </div>

              <div className="mcfly-goals-yoy-apply">
                <Form method="post">
                  <input type="hidden" name="year" value={year} />
                  <input type="hidden" name="intent" value="apply_yoy_10" />
                  <button
                    type="submit"
                    className="mcfly-goals-yoy-btn"
                    disabled={isSaving}
                  >
                    Set goals at 10% YoY growth
                  </button>
                </Form>
                <p className="mcfly-goals-yoy-apply__hint">
                  Each month = {priorYear} actual × 1.10 (whole dollars). Zero
                  prior months stay $0.
                </p>
              </div>

              <Form
                method="post"
                className="mcfly-goals-form"
                key={goalsKey}
                data-save-bar
                onReset={handleDiscard}
                aria-busy={
                  savingIntent === "save_goals" ||
                  savingIntent === "apply_yoy_10" ||
                  undefined
                }
              >
                <input type="hidden" name="year" value={year} />
                <input type="hidden" name="intent" value="save_goals" />
                <div className="mcfly-goals-table-wrap">
                  <table className="mcfly-goals-table">
                    <thead>
                      <tr>
                        <th scope="col">Month</th>
                        <th scope="col">Sales goal</th>
                        <th scope="col">Actual</th>
                        <th scope="col">Prior year</th>
                        <th scope="col">YoY %</th>
                        <th scope="col">Spend</th>
                        <th scope="col">{PRODUCT_NOUN.totalRoasShort}</th>
                        <th scope="col">Δ</th>
                        <th scope="col">%</th>
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
                  <s-link href="/app/spend">Spend</s-link>
                </div>
              </Form>
            </section>

            <section className="mcfly-goals-hero" aria-label="Year to date vs goal">
              <p className="mcfly-goals-hero__kicker">
                Progress · YTD sales, not LTV
              </p>
              <div className="mcfly-goals-hero__grid">
                <div className="mcfly-goals-hero__kpi">
                  <span className="mcfly-goals-hero__label">YTD sales</span>
                  <span className="mcfly-goals-hero__value">
                    {formatCurrency(board.ytd.actual)}
                  </span>
                </div>
                <div className="mcfly-goals-hero__kpi">
                  <span className="mcfly-goals-hero__label">YTD goal</span>
                  <span className="mcfly-goals-hero__value">
                    {formatCurrency(board.ytd.goal)}
                  </span>
                </div>
                <div className="mcfly-goals-hero__kpi">
                  <span className="mcfly-goals-hero__label">vs goal</span>
                  <span
                    className={`mcfly-goals-hero__value mcfly-goals-delta--${ytdTone}`}
                  >
                    {board.ytd.delta >= 0 ? "+" : ""}
                    {formatCurrency(board.ytd.delta)}
                  </span>
                  <span className="mcfly-goals-hero__meta">
                    {board.ytd.pct == null
                      ? "Set monthly goals above"
                      : `${board.ytd.pct.toFixed(1)}% of YTD plan`}
                  </span>
                </div>
                <div className="mcfly-goals-hero__kpi">
                  <span className="mcfly-goals-hero__label">Year plan</span>
                  <span className="mcfly-goals-hero__value">
                    {formatCurrency(board.yearGoal)}
                  </span>
                  <span className="mcfly-goals-hero__meta">
                    Booked {formatCurrency(board.yearActual)} YTD
                  </span>
                </div>
              </div>
              {board.ytd.goal > 0 ? (
                <div
                  className={`mcfly-goals-progress mcfly-goals-progress--${ytdTone}`}
                  role="group"
                  aria-label="YTD sales versus goal"
                >
                  <div className="mcfly-goals-progress__meta">
                    <span>
                      {formatCurrency(board.ytd.actual)} /{" "}
                      {formatCurrency(board.ytd.goal)} YTD sales
                    </span>
                    <span className={`mcfly-goals-pace mcfly-goals-pace--${ytdTone}`}>
                      {board.ytd.pct == null
                        ? "—"
                        : board.ytd.delta >= 0
                          ? `${board.ytd.pct.toFixed(0)}% of plan · ahead`
                          : `${board.ytd.pct.toFixed(0)}% of plan · behind`}
                    </span>
                  </div>
                  <div
                    className="mcfly-goals-progress__track"
                    role="progressbar"
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={Math.min(
                      100,
                      Math.max(0, Math.round(board.ytd.pct ?? 0)),
                    )}
                    aria-valuetext={`${formatCurrency(board.ytd.actual)} of ${formatCurrency(board.ytd.goal)}`}
                  >
                    <span
                      className="mcfly-goals-progress__fill"
                      style={{
                        width: `${Math.min(100, Math.max(0, board.ytd.pct ?? 0))}%`,
                      }}
                    />
                  </div>
                </div>
              ) : null}
            </section>

            {forecast ? (
              <section
                className="mcfly-goals-forecast"
                aria-label="Current month forecast"
              >
                <p className="mcfly-goals-forecast__kicker">
                  {forecast.monthLong} close · pace from MTD average
                </p>
                <p className="mcfly-goals-forecast__takeaway">
                  Projected {formatCurrency(forecast.projSales)}
                  {forecast.monthGoal > 0
                    ? ` vs ${formatCurrency(forecast.monthGoal)} goal`
                    : " · set a monthly goal"}
                  {" · "}
                  {PRODUCT_NOUN.totalRoasShort} {formatMer(forecast.projMer)}
                  {" · "}
                  <span
                    className={`mcfly-goals-pace mcfly-goals-pace--${forecast.pace.tone}`}
                  >
                    {forecast.pace.label}
                  </span>
                </p>
                {forecast.monthGoal > 0 ? (
                  <div
                    className={`mcfly-goals-progress mcfly-goals-progress--${forecast.pace.tone}`}
                    role="group"
                    aria-label={`${forecast.monthLong} sales versus goal`}
                  >
                    <div className="mcfly-goals-progress__meta">
                      <span>
                        {formatCurrency(forecast.mtdSales)} /{" "}
                        {formatCurrency(forecast.monthGoal)} MTD
                      </span>
                      <span>
                        Projected {formatCurrency(forecast.projSales)}
                        {forecast.vsGoalProj >= 0 ? " · +" : " · "}
                        {formatCurrency(Math.abs(forecast.vsGoalProj))}
                        {forecast.vsGoalProj >= 0 ? " vs goal" : " behind goal"}
                      </span>
                    </div>
                    <div
                      className="mcfly-goals-progress__track"
                      role="progressbar"
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuenow={Math.min(
                        100,
                        Math.max(
                          0,
                          Math.round(
                            (forecast.mtdSales / forecast.monthGoal) * 100,
                          ),
                        ),
                      )}
                    >
                      <span
                        className="mcfly-goals-progress__fill"
                        style={{
                          width: `${Math.min(
                            100,
                            Math.max(
                              0,
                              (forecast.mtdSales / forecast.monthGoal) * 100,
                            ),
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                ) : null}
                <dl className="mcfly-goals-forecast__stats">
                  <div>
                    <dt>MTD sales</dt>
                    <dd>{formatCurrency(forecast.mtdSales)}</dd>
                  </div>
                  <div>
                    <dt>MTD spend</dt>
                    <dd>{formatCurrency(forecast.mtdSpend)}</dd>
                  </div>
                  <div>
                    <dt>MTD {PRODUCT_NOUN.totalRoasShort}</dt>
                    <dd>{formatMer(forecast.mtdMer)}</dd>
                  </div>
                  <div>
                    <dt>Days left</dt>
                    <dd>
                      {forecast.remainingDays} / {forecast.daysInMonth}
                    </dd>
                  </div>
                </dl>
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
                Actual sales vs {priorYear}, with spend and{" "}
                {PRODUCT_NOUN.totalRoas} (sales ÷ spend). Turn on Show 12-month
                sales plan to set monthly targets.
              </p>
            </div>
            <div className="mcfly-goals-table-wrap">
              <table className="mcfly-goals-table">
                <thead>
                  <tr>
                    <th scope="col">Month</th>
                    <th scope="col">Actual</th>
                    <th scope="col">Prior year</th>
                    <th scope="col">YoY %</th>
                    <th scope="col">Spend</th>
                    <th scope="col">{PRODUCT_NOUN.totalRoasShort}</th>
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
                        <td>{formatCurrency(row.spend)}</td>
                        <td>{formatMer(row.mer)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="mcfly-goals-form__actions">
              <s-link href="/app">{PRODUCT_NOUN.deskTitle}</s-link>
              <s-link href="/app/spend">Spend</s-link>
            </div>
          </section>
        )}
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
      <td>{formatCurrency(row.spend)}</td>
      <td>{formatMer(row.mer)}</td>
      {showGoalInput ? (
        <>
          <td
            className={`mcfly-goals-delta--${deltaTone(row.delta, row.salesGoal)}`}
          >
            {row.salesGoal > 0
              ? `${row.delta >= 0 ? "+" : ""}${formatCurrency(row.delta)}`
              : "—"}
          </td>
          <td>{row.pct == null ? "—" : `${row.pct.toFixed(0)}%`}</td>
          <td>
            <span className={`mcfly-goals-pace mcfly-goals-pace--${row.pace.tone}`}>
              {row.pace.label}
            </span>
          </td>
        </>
      ) : null}
    </tr>
  );
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
