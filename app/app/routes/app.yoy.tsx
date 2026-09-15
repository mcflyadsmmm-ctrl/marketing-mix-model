import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { Link, useLoaderData, useNavigation } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import {
  buildDailyRowsForWindow,
  ensureShop,
} from "../lib/mer-dashboard.server";
import { buildCashControlBoard, type CompareScoreId } from "../lib/mer-control";
import { formatCurrency, formatMer } from "../lib/mer-format";
import { OVERVIEW_YOY_MISSING } from "../lib/overview-yoy";
import { deskPeriodTimeZone, resolvePeriod, resolvePriorPeriod } from "../lib/periods";
import { getSalesFactsByDay } from "../lib/sales-facts.server";
import {
  fetchSampleSalesByDay,
  getSampleDeskEnabled,
} from "../lib/sample-desk.server";
import { authenticate } from "../shopify.server";
import { last7VsPrior7 } from "../lib/yoy-workspace";

const MONTH_ROWS: Array<{ id: CompareScoreId; label: string }> = [
  { id: "thisMonth", label: "This month" },
  { id: "lastMonth", label: "Last month" },
  { id: "lastYear", label: "This month last year" },
];

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const shop = await ensureShop(session.shop);
  const useSampleDesk = await getSampleDeskEnabled(shop.id);
  const deskTz = deskPeriodTimeZone(useSampleDesk, shop.ianaTimezone);
  const now = new Date();
  const mtd = resolvePeriod("mtd", now, deskTz);
  const priorYtd = resolvePriorPeriod("ytd", now, deskTz);
  const controlRange = {
    start: priorYtd.start,
    end: mtd.end,
    label: "YoY comparison",
  };
  const salesByDay = useSampleDesk
    ? await fetchSampleSalesByDay(shop.id, controlRange)
    : await getSalesFactsByDay(shop.id, controlRange);
  const { rows } = await buildDailyRowsForWindow(shop.id, {
    sampleOnly: useSampleDesk,
    excludeSample: !useSampleDesk,
    salesByDay,
    windowStart: controlRange.start,
    windowEnd: controlRange.end,
    timeZone: deskTz,
  });
  const board = buildCashControlBoard(rows, 0);

  return {
    monthRows: board.compareScores,
    last7: last7VsPrior7(board.drillDays),
  };
};

function displayValue(value: number | null | undefined, format: (n: number) => string) {
  return value == null ? "—" : format(value);
}

export default function YoyWorkspacePage() {
  const { monthRows, last7 } = useLoaderData<typeof loader>();
  const navigation = useNavigation();
  const byId = new Map(monthRows.map((row) => [row.id, row]));
  const hasSpend =
    monthRows.some((row) => row.spend > 0) ||
    (last7.spend ?? 0) > 0 ||
    (last7.priorSpend ?? 0) > 0;

  return (
    <s-page heading="YoY" inlineSize="large">
    <main className="mcfly-page" aria-busy={navigation.state === "loading"}>
      <header className="mcfly-page__head">
        <div>
          <p className="mcfly-page__eyebrow">Compare</p>
          <h1>Year over year</h1>
          <p>Sales first. Spend and Total ROAS appear only when spend is on file.</p>
        </div>
        <Link className="mcfly-button mcfly-button--secondary" to="/app/goals">
          Open Goals
        </Link>
      </header>

      <section className="mcfly-card" aria-labelledby="month-compare-title">
        <div className="mcfly-card__head">
          <div>
            <p className="mcfly-kicker">Month comparison</p>
            <h2 id="month-compare-title">This month, aligned to closed days</h2>
          </div>
        </div>
        <div className="mcfly-table-wrap">
          <table className="mcfly-table">
            <thead>
              <tr>
                <th scope="col">Period</th>
                <th scope="col">Sales</th>
                {hasSpend ? <th scope="col">Spend</th> : null}
                {hasSpend ? <th scope="col">Total ROAS</th> : null}
              </tr>
            </thead>
            <tbody>
              {MONTH_ROWS.map(({ id, label }) => {
                const row = byId.get(id);
                return (
                  <tr key={id}>
                    <th scope="row">{label}</th>
                    <td>{displayValue(row?.sales, formatCurrency)}</td>
                    {hasSpend ? (
                      <td>{displayValue(row?.spend, formatCurrency)}</td>
                    ) : null}
                    {hasSpend ? (
                      <td>{displayValue(row?.mer, formatMer)}</td>
                    ) : null}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {!byId.has("lastYear") ? (
          <p className="mcfly-note">{OVERVIEW_YOY_MISSING}</p>
        ) : null}
      </section>

      <section className="mcfly-card" aria-labelledby="last-seven-title">
        <div className="mcfly-card__head">
          <div>
            <p className="mcfly-kicker">Recent pace</p>
            <h2 id="last-seven-title">{last7.label}</h2>
          </div>
        </div>
        <div className="mcfly-table-wrap">
          <table className="mcfly-table">
            <thead>
              <tr>
                <th scope="col">Window</th>
                <th scope="col">Sales</th>
                {hasSpend ? <th scope="col">Spend</th> : null}
                {hasSpend ? <th scope="col">Total ROAS</th> : null}
              </tr>
            </thead>
            <tbody>
              <tr>
                <th scope="row">Last 7</th>
                <td>{displayValue(last7.sales, formatCurrency)}</td>
                {hasSpend ? (
                  <td>{displayValue(last7.spend, formatCurrency)}</td>
                ) : null}
                {hasSpend ? <td>{displayValue(last7.mer, formatMer)}</td> : null}
              </tr>
              <tr>
                <th scope="row">Prior 7</th>
                <td>{displayValue(last7.priorSales, formatCurrency)}</td>
                {hasSpend ? (
                  <td>{displayValue(last7.priorSpend, formatCurrency)}</td>
                ) : null}
                {hasSpend ? (
                  <td>{displayValue(last7.priorMer, formatMer)}</td>
                ) : null}
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </main>
    </s-page>
  );
}

export const headers: HeadersFunction = (headersArgs) =>
  boundary.headers(headersArgs);
