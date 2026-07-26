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
import { ensureShop, getOrCreateSettings } from "../lib/mer-dashboard.server";
import { formatCurrency, formatMer } from "../lib/mer-format";
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

type ShopifyToast = {
  show?: (message: string, options?: { duration?: number; isError?: boolean }) => void;
};

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

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);
  const url = new URL(request.url);
  const shotMode = url.searchParams.get("shot") === "1";
  const year = parseGoalsYear(url.searchParams.get("year"));
  const shop = await ensureShop(session.shop);
  const settings = await getOrCreateSettings(shop.id);
  const useSampleDesk = await getSampleDeskEnabled(shop.id);
  const range = yearDateRange(year);

  let salesByDay = new Map<string, number>();
  let salesError: string | null = null;

  if (useSampleDesk) {
    salesByDay = await fetchSampleSalesByDay(shop.id, range);
  } else {
    try {
      salesByDay = await fetchShopifySalesByDay(admin, range);
    } catch (err) {
      salesError =
        err instanceof Error ? err.message : "Failed to load Shopify sales";
      salesByDay = new Map();
    }
  }

  const salesByMonth = salesByMonthFromDayMap(year, salesByDay);
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

  const thisYear = new Date().getFullYear();
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
  };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const shop = await ensureShop(session.shop);
  const form = await request.formData();
  const year = parseGoalsYear(String(form.get("year") ?? ""));

  const monthly: number[] = [];
  for (let m = 1; m <= 12; m++) {
    const n = parseGoalInput(form.get(`goal_${m}`));
    if (Number.isNaN(n)) {
      return {
        success: false as const,
        error: `Month ${m}: enter a non-negative sales goal in dollars`,
        year,
      };
    }
    monthly.push(n);
  }

  try {
    await upsertYearSalesGoals(shop.id, year, monthly);
  } catch (err) {
    return {
      success: false as const,
      error: err instanceof Error ? err.message : "Could not save goals",
      year,
    };
  }

  return {
    success: true as const,
    error: null,
    year,
  };
};

export default function GoalsPage() {
  const { board, year, yearOptions, shotMode, useSampleDesk, salesError } =
    useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const [searchParams, setSearchParams] = useSearchParams();
  const formId = useId();

  const isSaving = navigation.state === "submitting";
  const isRevalidating =
    navigation.state === "loading" && navigation.formMethod != null;

  const goalsKey = `${board.year}:${board.rows.map((r) => r.salesGoal).join("|")}`;

  useEffect(() => {
    if (!actionData) return;
    if (actionData.success) {
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
    ? `${year} · sample till`
    : `${year} · live Shopify till`;

  const onYearChange = (next: string) => {
    const params = new URLSearchParams(searchParams);
    params.set("year", next);
    if (shotMode) params.set("shot", "1");
    setSearchParams(params);
  };

  return (
    <s-page heading={shotMode ? undefined : "Goals"} inlineSize="large">
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
              Monthly sales goals vs Shopify till · cash MER = sales ÷ spend
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
            <span className="mcfly-ctx__brand">Sales goals</span>
            <span className="mcfly-ctx__sep" aria-hidden="true">
              ·
            </span>
            <span className="mcfly-ctx__asof">{tillLabel}</span>
          </div>
          <div className="mcfly-ctx__chips">
            {useSampleDesk && !shotMode ? (
              <span className="mcfly-ctx-chip mcfly-ctx-chip--flat">Sample desk</span>
            ) : null}
            <span className={`mcfly-ctx-chip mcfly-ctx-chip--${ytdTone}`}>
              YTD {board.ytd.pct == null ? "—" : `${board.ytd.pct.toFixed(0)}%`} of
              goal
            </span>
            <span className="mcfly-ctx-chip mcfly-ctx-chip--flat">
              Target MER {formatMer(board.targetMer)}
            </span>
          </div>
        </div>

        {useSampleDesk && !shotMode ? (
          <s-banner tone="warning" heading="Sample desk is on — not live Shopify">
            <s-paragraph>
              Goals below compare against sample till + spend. Turn sample desk{" "}
              <strong>OFF</strong> on the <s-link href="/app/demo">Demo</s-link> tab
              before App Store review.
            </s-paragraph>
          </s-banner>
        ) : null}

        {salesError && !shotMode ? (
          <s-banner tone="critical" heading="Shopify till didn’t load">
            <s-paragraph>
              {salesError} — goals still save; actuals stay $0 until the till pull
              works.
            </s-paragraph>
          </s-banner>
        ) : null}

        {isSaving || isRevalidating ? (
          <s-banner tone="info" heading="Saving sales goals">
            <s-paragraph>Writing your {year} monthly sales plan…</s-paragraph>
          </s-banner>
        ) : null}

        <section className="mcfly-goals-hero" aria-label="Year to date vs goal">
          <p className="mcfly-goals-hero__kicker">YTD · sales dollars, not LTV</p>
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
                  ? "Set monthly goals below"
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
              cash MER {formatMer(forecast.projMer)}
              {" · "}
              <span className={`mcfly-goals-pace mcfly-goals-pace--${forecast.pace.tone}`}>
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
                      Math.round((forecast.mtdSales / forecast.monthGoal) * 100),
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
                <dt>MTD MER</dt>
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

        <Form
          method="post"
          className="mcfly-goals-form"
          key={goalsKey}
          data-save-bar
          onReset={handleDiscard}
          aria-busy={isSaving || undefined}
        >
          <input type="hidden" name="year" value={year} />
          <section className="mcfly-panel mcfly-goals-panel" aria-label="Monthly plan">
            <div className="mcfly-panel__head">
              <h2>12-month sales plan</h2>
              <p>
                Enter sales dollars per month. Dirty fields open the Admin save
                bar — Discard restores the last saved plan. MER is till ÷ spend —
                not platform ROAS.
              </p>
            </div>

            <div className="mcfly-goals-table-wrap">
              <table className="mcfly-goals-table">
                <thead>
                  <tr>
                    <th scope="col">Month</th>
                    <th scope="col">Sales goal</th>
                    <th scope="col">Actual</th>
                    <th scope="col">Spend</th>
                    <th scope="col">MER</th>
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
                      inputId={`${formId}-g${row.month}`}
                      defaultValue={formatGoalInput(row.salesGoal)}
                    />
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mcfly-goals-form__actions">
              <s-link href="/app">Cash MER</s-link>
              <s-link href="/app/spend">Spend</s-link>
            </div>
          </section>
        </Form>
      </div>
    </s-page>
  );
}

function GoalRow({
  row,
  inputId,
  defaultValue,
}: {
  row: GoalMonthRow;
  inputId: string;
  defaultValue: string;
}) {
  const rowClass = [
    "mcfly-goals-table__row",
    row.isCurrent ? "mcfly-goals-table__row--current" : "",
    row.isFuture ? "mcfly-goals-table__row--future" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <tr className={rowClass}>
      <th scope="row">
        {row.monthShort}
        {row.isCurrent ? (
          <span className="mcfly-goals-table__now"> MTD</span>
        ) : null}
      </th>
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
      <td>{formatCurrency(row.actual)}</td>
      <td>{formatCurrency(row.spend)}</td>
      <td>{formatMer(row.mer)}</td>
      <td className={`mcfly-goals-delta--${deltaTone(row.delta, row.salesGoal)}`}>
        {row.salesGoal > 0
          ? `${row.delta >= 0 ? "+" : ""}${formatCurrency(row.delta)}`
          : "—"}
      </td>
      <td>
        {row.pct == null ? "—" : `${row.pct.toFixed(0)}%`}
      </td>
      <td>
        <span className={`mcfly-goals-pace mcfly-goals-pace--${row.pace.tone}`}>
          {row.pace.label}
        </span>
      </td>
    </tr>
  );
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
