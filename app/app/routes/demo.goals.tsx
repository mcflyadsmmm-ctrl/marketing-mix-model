import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { redirect, useLoaderData, useNavigation } from "react-router";
import { deskBaseFromPathname, withDeskBase } from "../lib/desk-base-path";

import { BookFactGrid } from "../components/ShopifyBookSection";
import { DeskBookPage } from "../components/DeskBookPage";
import { OrderHistoryForecast } from "../components/OrderHistoryForecast";
import { OrderHistoryGoalsBoard } from "../components/OrderHistoryGoalsBoard";
import { SalesGoalGauges } from "../components/SalesGoalGauges";
import { useDeskCurrency } from "../lib/desk-currency";
import { formatCurrency, formatMer, formatMoneyOrDash } from "../lib/mer-format";
import { impliedSpendCeiling } from "../lib/implied-spend-ceiling";
import { PRODUCT_NOUN } from "../lib/product-labels";
import { publicDemoHeaders } from "../lib/public-demo-headers";
import { PUBLIC_SAMPLE_TZ } from "../lib/public-sample-constants";
import { loadPublicSampleBook } from "../lib/public-sample-book.server";
import { loadPublicSamplePage } from "../lib/public-sample-page.server";
import { returningSalesByMonthFromOrders } from "../lib/sales-goals";
import {
  buildGoalMonthRows,
  buildSalesGoalPeriods,
  salesByMonthFromDayMap,
  type GoalMonthRow,
} from "../lib/sales-goals.server";
import { shopLocalYmd } from "../lib/shop-local-day";

export const headers: HeadersFunction = () => publicDemoHeaders();

const GOALS_ANALYTICS_LEDE =
  "Shopify Analytics shows this period's sales. This page shows plan vs actual for MTD/QTD/YTD.";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const settings = withDeskBase("/app/settings", deskBaseFromPathname(url.pathname));
  const qs = url.searchParams.toString();
  throw redirect(`${settings}${qs ? `?${qs}` : ""}`);
  const page = await loadPublicSamplePage(request);
  const now = new Date();
  const book = loadPublicSampleBook(now);
  const ymd = shopLocalYmd(now, PUBLIC_SAMPLE_TZ);
  const salesByDay = new Map(
    book.days.map((day) => [day.dateKey, day.sales]),
  );
  const salesByMonth = salesByMonthFromDayMap(
    ymd.y,
    salesByDay,
    now,
    PUBLIC_SAMPLE_TZ,
  );
  const spendByMonth = new Map<number, number>();
  const todayKey = `${ymd.y}-${String(ymd.m).padStart(2, "0")}-${String(ymd.d).padStart(2, "0")}`;
  for (const day of book.days) {
    if (!day.dateKey.startsWith(`${ymd.y}-`)) continue;
    const month = Number.parseInt(day.dateKey.slice(5, 7), 10);
    if (month < 1 || month > 12) continue;
    if (month === ymd.m && day.dateKey > todayKey) continue;
    if (!(day.spend > 0)) continue;
    spendByMonth.set(month, (spendByMonth.get(month) ?? 0) + day.spend);
  }
  const priorSalesByMonth = salesByMonthFromDayMap(
    ymd.y - 1,
    salesByDay,
    now,
    PUBLIC_SAMPLE_TZ,
  );
  const priorYearMonthly = Array.from({ length: 12 }, (_, i) => {
    const value = priorSalesByMonth.get(i + 1);
    return Number.isFinite(value) ? (value as number) : null;
  });
  const sampleYearGoals: Array<number | null> = Array.from(
    { length: 12 },
    () => null,
  );
  const returningByMonth = returningSalesByMonthFromOrders(ymd.y, book.orders);
  const yearRows = buildGoalMonthRows({
    year: ymd.y,
    goals: sampleYearGoals,
    salesByMonth,
    spendByMonth,
    returningByMonth,
    targetMer: page.targetMer,
    breakEvenMer: null,
    now,
    ianaTimezone: PUBLIC_SAMPLE_TZ,
  });
  const goalPeriods = buildSalesGoalPeriods({
    year: ymd.y,
    goals: sampleYearGoals,
    salesByMonth,
    spendByMonth,
    priorYearMonthly,
    now,
    ianaTimezone: PUBLIC_SAMPLE_TZ,
    targetMer: page.targetMer,
    breakEvenMer: null,
  });
  return { ...page, goalPeriods, yearRows, priorYearMonthly };
};

function yoyPct(actual: number | null, prior: number | null): number | null {
  if (
    actual == null ||
    prior == null ||
    !Number.isFinite(actual) ||
    !Number.isFinite(prior) ||
    !(prior > 0)
  ) {
    return null;
  }
  return ((actual - prior) / prior) * 100;
}

function formatYoyPct(pct: number | null): string {
  if (pct == null) return "—";
  const sign = pct > 0 ? "+" : "";
  return `${sign}${pct.toFixed(0)}%`;
}

function SampleYearPlanRow({
  row,
  prior,
  showSpend,
  targetMer,
  currency,
}: {
  row: GoalMonthRow;
  prior: number | null;
  showSpend: boolean;
  targetMer: number;
  currency: string;
}) {
  const hasGoal = row.salesGoal != null && Number.isFinite(row.salesGoal);
  const spendCeiling =
    row.salesGoal != null
      ? impliedSpendCeiling(row.salesGoal, targetMer)
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
  const pct = yoyPct(row.actual, prior);

  return (
    <tr className={rowClass}>
      <th scope="row">
        {row.monthShort}
        {row.isCurrent ? (
          <span className="mcfly-goals-table__now"> MTD</span>
        ) : null}
      </th>
      <td>{formatMoneyOrDash(row.salesGoal, currency)}</td>
      <td>{formatMoneyOrDash(row.actual, currency)}</td>
      <td>{formatMoneyOrDash(row.returningActual, currency)}</td>
      {showSpend ? (
        <>
          <td>{row.spend > 0 ? formatCurrency(row.spend, currency) : "—"}</td>
          <td>
            {spendCeiling != null ? formatCurrency(spendCeiling, currency) : "—"}
          </td>
          <td>
            {row.spend > 0 && row.mer != null ? formatMer(row.mer) : "—"}
          </td>
        </>
      ) : null}
      <td>{formatMoneyOrDash(prior, currency)}</td>
      <td>{formatYoyPct(pct)}</td>
      <td>
        <span className={`mcfly-goals-pace mcfly-goals-pace--${row.pace.tone}`}>
          {row.pace.label}
        </span>
      </td>
    </tr>
  );
}

export default function PublicDemoGoals() {
  const data = useLoaderData<typeof loader>();
  const currency = useDeskCurrency();
  const navigation = useNavigation();
  const periodHasSpend = data.spend > 0;
  const yearHasSpend =
    data.yearRows.some((row) => row.spend > 0) ||
    data.goalPeriods.mtd.spend > 0 ||
    data.goalPeriods.qtd.spend > 0 ||
    data.goalPeriods.ytd.spend > 0;
  const roasLabel =
    data.mer != null && periodHasSpend ? `${formatMer(data.mer)}×` : "—";
  return (
    <DeskBookPage
      heading="Goals"
      tillLabel={data.tillLabel}
      preset={data.preset}
      shotMode={data.shotMode}
      useSampleDesk
      isLoading={navigation.state === "loading"}
      orderBookDepth="paid_full"
      retryHref="/demo/goals"
    >
      <p className="mcfly-book__lede">
        Read-only SAMPLE year plan. Empty months stay —. Spend is the second
        chapter.
      </p>
      <OrderHistoryGoalsBoard
        view={data.habitGoals}
        year={data.goalsYear}
        readOnly
      />
      <OrderHistoryForecast view={data.orderHistoryForecast} variant="goals" />
      <section
        className="mcfly-book mcfly-book--soft mcfly-goals-hero--soft"
        aria-label={`Sales · ${data.rangeLabel}`}
      >
        <p className="mcfly-book__lede">{GOALS_ANALYTICS_LEDE}</p>
        <div className="mcfly-book__hero">
          <p className="mcfly-book__hero-k">{PRODUCT_NOUN.salesBasisShort}</p>
          <p className="mcfly-book__hero-v">
            {formatCurrency(data.sales.totalSales, currency)}
          </p>
          <p className="mcfly-book__hero-def">
            {data.sales.totalSales === 0
              ? `Certified $0 · ${data.rangeLabel}`
              : `${PRODUCT_NOUN.totalSalesHeroHint} · ${data.rangeLabel}`}
          </p>
        </div>
        {periodHasSpend ? (
          <BookFactGrid
            facts={[
              {
                k: "Spend",
                v: formatCurrency(data.spend, currency),
                d: `Ad spend on the SAMPLE book for ${data.rangeLabel}.`,
              },
              data.mer != null
                ? {
                    k: PRODUCT_NOUN.totalRoas,
                    v: roasLabel,
                    d: PRODUCT_NOUN.definition,
                  }
                : {
                    k: PRODUCT_NOUN.totalRoas,
                    v: "—",
                    d: "Empty spend is —.",
                  },
            ]}
          />
        ) : null}
      </section>
      <SalesGoalGauges
        periods={data.goalPeriods}
        variant="book"
        heading="MTD · QTD · YTD"
        muted={
          yearHasSpend
            ? `Sales vs plan plus ${PRODUCT_NOUN.totalRoas}. The calendar tick is how much of the period has elapsed. Spend optional.`
            : "Sales vs plan. The calendar tick is how much of the period has elapsed. Spend optional."
        }
        targetMer={data.targetMer}
        breakEvenMer={null}
      />
      <section
        className="mcfly-panel mcfly-goals-panel mcfly-goals-panel--dense mcfly-goals-panel--soft"
        aria-label="Monthly plan"
      >
        <p className="mcfly-book__lede">
          SAMPLE months as typed or empty. Empty stays —. Not a $0 year plan.
        </p>
        <div className="mcfly-goals-table-wrap">
          <table className="mcfly-goals-table mcfly-goals-table--sales">
            <thead>
              <tr>
                <th scope="col">Month</th>
                <th scope="col">Goal</th>
                <th scope="col">{PRODUCT_NOUN.salesBasisShort}</th>
                <th scope="col">Returning $</th>
                {yearHasSpend ? (
                  <>
                    <th scope="col">Spend</th>
                    <th scope="col">Ceiling</th>
                    <th scope="col">MER</th>
                  </>
                ) : null}
                <th scope="col">Prior {PRODUCT_NOUN.salesBasisShort}</th>
                <th scope="col">YoY</th>
                <th scope="col">Pace</th>
              </tr>
            </thead>
            <tbody>
              {data.yearRows.map((row) => (
                <SampleYearPlanRow
                  key={row.month}
                  row={row}
                  prior={data.priorYearMonthly[row.month - 1] ?? null}
                  showSpend={yearHasSpend}
                  targetMer={data.targetMer}
                  currency={currency}
                />
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </DeskBookPage>
  );
}
