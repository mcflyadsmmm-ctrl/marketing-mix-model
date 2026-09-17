import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { useLoaderData, useNavigation, useSearchParams } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { DeskBookPage } from "../components/DeskBookPage";
import { DeskRouteErrorBoundary } from "../components/DeskRouteErrorBoundary";
import { DeskIcon } from "../components/DeskIcon";
import { SampleDeskBanner } from "../components/SampleDeskBanner";
import { useDeskDrill } from "../components/DeskDrill";
import { YoyChannelBoard, YoyYearBoard } from "../components/YoyYearBoard";
import { YoyYearChart } from "../components/YoyYearChart";
import {
  buildDailyRowsForWindow,
  ensureShop,
} from "../lib/mer-dashboard.server";
import {
  buildCashControlBoard,
  certifyDailyRows,
} from "../lib/mer-control";
import { formatMer } from "../lib/mer-format";
import { useMoney } from "../lib/desk-currency";
import {
  OVERVIEW_YOY_MISSING,
  OVERVIEW_YOY_PENDING,
} from "../lib/overview-yoy";
import {
  deskPeriodTimeZone,
  parsePeriodPreset,
} from "../lib/periods";
import { PRODUCT_NOUN } from "../lib/product-labels";
import { getSalesFactsByDay } from "../lib/sales-facts.server";
import { yearDateRange } from "../lib/sales-goals.server";
import {
  fetchSampleSalesByDay,
  getSampleDeskEnabled,
} from "../lib/sample-desk.server";
import { shopLocalYmd } from "../lib/shop-local-day";
import { requireAdmin } from "../lib/public-app-gate.server";
import {
  buildYoyYearBoard,
  last7VsPrior7,
  operatingMonthRows,
  parseYoyYear,
  YOY_ANALYTICS_LEDE,
  yoyBoardHasSpend,
  yoyBoardPriorMissing,
  yoyChannelVsLy,
  yoyDisplayValue,
  yoyYearOptions,
  yoyYearWindowDays,
} from "../lib/yoy-workspace";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await requireAdmin(request);
  const shop = await ensureShop(session.shop);
  const useSampleDesk = await getSampleDeskEnabled(shop.id);
  const url = new URL(request.url);
  const shotMode = url.searchParams.get("shot") === "1";
  const preset = parsePeriodPreset(url.searchParams.get("period"));
  const deskTz = deskPeriodTimeZone(useSampleDesk, shop.ianaTimezone);
  const now = new Date();
  const asOfParts = deskTz
    ? shopLocalYmd(now, deskTz)
    : { y: now.getFullYear(), m: now.getMonth() + 1, d: now.getDate() };
  const asOf = {
    year: asOfParts.y,
    month: asOfParts.m,
    day: asOfParts.d,
  };
  const year = parseYoyYear(url.searchParams.get("year"), asOf.year);
  const startYear = Math.min(year, asOf.year) - 1;
  const controlRange = {
    start: yearDateRange(startYear, deskTz).start,
    end: now,
    label: "YoY comparison",
  };
  const salesByDay = useSampleDesk
    ? await fetchSampleSalesByDay(shop.id, controlRange)
    : await getSalesFactsByDay(shop.id, controlRange);
  const { rows, channelLabels } = await buildDailyRowsForWindow(shop.id, {
    sampleOnly: useSampleDesk,
    excludeSample: !useSampleDesk,
    salesByDay,
    windowStart: controlRange.start,
    windowEnd: controlRange.end,
    timeZone: deskTz,
  });
  const board = buildCashControlBoard(rows, 0);
  const { days } = certifyDailyRows(rows);
  const monthRows = buildYoyYearBoard(days, year, asOf);
  const thisWindow = yoyYearWindowDays(days, year, asOf, year);
  const lastWindow = yoyYearWindowDays(days, year - 1, asOf, year);
  const channelRows = yoyChannelVsLy(thisWindow, lastWindow);
  const earliestYear = days.reduce(
    (min, day) => Math.min(min, day.year),
    asOf.year,
  );

  return {
    year,
    yearOptions: yoyYearOptions(asOf.year, Math.min(earliestYear, year, startYear)),
    monthRows,
    channelRows,
    channelLabels,
    lastYearHasSpend: lastWindow.some((day) => day.spend > 0),
    boardHasSpend: yoyBoardHasSpend(monthRows),
    boardPriorMissing: yoyBoardPriorMissing(monthRows),
    monthRowsOperating: operatingMonthRows(board.compareScores),
    last7: last7VsPrior7(board.drillDays),
    useSampleDesk,
    shotMode,
    preset,
  };
};

type CompareCard = {
  id: string;
  label: string;
  sales: number | null;
  spend: number | null;
  mer: number | null;
};

export default function YoyWorkspacePage() {
  const {
    year,
    yearOptions,
    monthRows,
    channelRows,
    channelLabels,
    lastYearHasSpend,
    boardHasSpend,
    boardPriorMissing,
    monthRowsOperating,
    last7,
    useSampleDesk,
    shotMode,
    preset,
  } = useLoaderData<typeof loader>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigation = useNavigation();
  const isLoading = navigation.state === "loading";
  const hasSpend =
    boardHasSpend ||
    monthRowsOperating.some((row) => (row.spend ?? 0) > 0) ||
    (last7.spend ?? 0) > 0 ||
    (last7.priorSpend ?? 0) > 0;
  const salesPending =
    !useSampleDesk &&
    last7.sales == null &&
    monthRowsOperating.every((row) => row.sales == null) &&
    monthRows.every((row) => row.actual == null);
  const lastYearMissing =
    !salesPending &&
    (boardPriorMissing ||
      monthRowsOperating.some((row) => row.id === "lastYear" && row.sales == null));
  const tillLabel = useSampleDesk
    ? `${year} board · vs last year${PRODUCT_NOUN.samplePeriodSuffix}`
    : `${year} board · vs last year · live sales`;
  const drill = useDeskDrill();
  const money = useMoney();
  const compareRows: CompareCard[] = [
    ...monthRowsOperating,
    {
      id: "last7",
      label: "Last 7",
      sales: last7.sales,
      spend: last7.spend,
      mer: last7.mer,
    },
  ];

  const salesLabel = (row: CompareCard) =>
    salesPending ? "—" : yoyDisplayValue(row.sales, money);
  const spendLabel = (row: CompareCard) =>
    salesPending ? "—" : yoyDisplayValue(row.spend, money);
  const merLabel = (row: CompareCard) =>
    salesPending || row.mer == null ? "—" : `${formatMer(row.mer)}×`;
  const dashHint = (row: CompareCard) => {
    if (salesPending) return "still loading";
    if (row.id === "lastYear" && row.sales == null) return "not $0";
    return "Click for detail";
  };

  const onYearChange = (next: string) => {
    const params = new URLSearchParams(searchParams);
    params.set("year", next);
    if (shotMode) params.set("shot", "1");
    setSearchParams(params);
  };

  return (
    <DeskBookPage
      heading="YoY"
      tillLabel={tillLabel}
      preset={preset}
      shotMode={shotMode}
      useSampleDesk={useSampleDesk}
      isLoading={isLoading}
      showPeriod={false}
    >
      <section className="mcfly-yoy" aria-label="Year over year">
        {useSampleDesk && !shotMode ? (
          <SampleDeskBanner note="YoY below uses SAMPLE sales and typed SAMPLE spend." />
        ) : null}
        <p className="mcfly-yoy__lede">{YOY_ANALYTICS_LEDE}</p>
        {salesPending ? (
          <p className="mcfly-yoy__note" role="status">
            {OVERVIEW_YOY_PENDING}
          </p>
        ) : null}

        <YoyYearChart
          months={monthRows}
          year={year}
          yearOptions={yearOptions}
          onYearChange={onYearChange}
          hasSpend={hasSpend}
          salesPending={salesPending}
        />

        <YoyYearBoard months={monthRows} year={year} hasSpend={hasSpend} />

        <YoyChannelBoard
          rows={channelRows}
          year={year}
          lastYearHasSpend={lastYearHasSpend}
          channelLabels={channelLabels}
        />

        {lastYearMissing ? (
          <p className="mcfly-yoy__note">{OVERVIEW_YOY_MISSING}</p>
        ) : null}

        <div className="mcfly-yoy__grid mcfly-yoy__grid--soft">
          {compareRows.map((row) => {
            const sales = salesLabel(row);
            const spend = spendLabel(row);
            const mer = merLabel(row);
            return (
              <button
                type="button"
                className="mcfly-yoy__card mcfly-yoy__card--drill"
                key={row.id}
                onClick={() =>
                  drill?.openDrill({
                    title: row.label,
                    value: sales,
                    kicker: "Operating compare",
                    blocks: [
                      {
                        k: "Sales",
                        v: salesPending ? "— still loading" : sales,
                      },
                      hasSpend ? { k: "Spend", v: spend } : null,
                      hasSpend ? { k: "Total ROAS", v: mer } : null,
                    ].filter(
                      (block): block is { k: string; v: string } =>
                        block != null,
                    ),
                    next: "Overview keeps MTD / QTD / YTD vs the same days last year.",
                    nextHref: "/app",
                    nextLabel: "Open Overview",
                    foot:
                      row.id === "lastYear" &&
                      row.sales == null &&
                      !salesPending
                        ? OVERVIEW_YOY_MISSING
                        : salesPending
                          ? OVERVIEW_YOY_PENDING
                          : undefined,
                  })
                }
              >
                <p className="mcfly-yoy__k">
                  <DeskIcon name="yoy" />
                  {row.label}
                </p>
                <p
                  className="mcfly-yoy__v"
                  aria-label={salesPending ? "still loading" : undefined}
                >
                  {sales}
                </p>
                {hasSpend ? (
                  <p className="mcfly-yoy__prior">
                    <span>Spend</span>
                    <span>{spend}</span>
                  </p>
                ) : null}
                {hasSpend ? (
                  <p className="mcfly-yoy__vs">Total ROAS {mer}</p>
                ) : null}
                <p className="mcfly-kpi__hint">{dashHint(row)}</p>
              </button>
            );
          })}
        </div>
      </section>

      <footer className="mcfly-book__links">
        <s-link href="/app">Overview</s-link>
        <s-link href="/app/goals">Goals</s-link>
        <s-link href="/app/allocation">Channel Allocation</s-link>
      </footer>
    </DeskBookPage>
  );
}

export function ErrorBoundary() {
  return <DeskRouteErrorBoundary retryHref="/app/yoy" />;
}

export const headers: HeadersFunction = (headersArgs) =>
  boundary.headers(headersArgs);
