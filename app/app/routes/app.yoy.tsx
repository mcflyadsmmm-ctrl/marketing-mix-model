import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { useLoaderData, useNavigation } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { BookFactGrid } from "../components/ShopifyBookSection";
import { DeskBookPage } from "../components/DeskBookPage";
import { DeskRouteErrorBoundary } from "../components/DeskRouteErrorBoundary";
import { DeskIcon } from "../components/DeskIcon";
import { useDeskDrill } from "../components/DeskDrill";
import {
  buildDailyRowsForWindow,
  ensureShop,
} from "../lib/mer-dashboard.server";
import { buildCashControlBoard } from "../lib/mer-control";
import { formatMer } from "../lib/mer-format";
import { useMoney } from "../lib/desk-currency";
import {
  OVERVIEW_YOY_MISSING,
  OVERVIEW_YOY_PENDING,
} from "../lib/overview-yoy";
import {
  deskPeriodTimeZone,
  parsePeriodPreset,
  resolvePeriod,
  resolvePriorPeriod,
} from "../lib/periods";
import { PRODUCT_NOUN } from "../lib/product-labels";
import { getSalesFactsByDay } from "../lib/sales-facts.server";
import {
  fetchSampleSalesByDay,
  getSampleDeskEnabled,
} from "../lib/sample-desk.server";
import { requireAdmin } from "../lib/public-app-gate.server";
import {
  last7VsPrior7,
  operatingMonthRows,
  YOY_ANALYTICS_LEDE,
  yoyDisplayValue,
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
    monthRows: operatingMonthRows(board.compareScores),
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
  const { monthRows, last7, useSampleDesk, shotMode, preset } =
    useLoaderData<typeof loader>();
  const navigation = useNavigation();
  const isLoading = navigation.state === "loading";
  const hasSpend =
    monthRows.some((row) => (row.spend ?? 0) > 0) ||
    (last7.spend ?? 0) > 0 ||
    (last7.priorSpend ?? 0) > 0;
  const salesPending =
    !useSampleDesk &&
    last7.sales == null &&
    monthRows.every((row) => row.sales == null);
  const lastYearMissing =
    !salesPending &&
    monthRows.some((row) => row.id === "lastYear" && row.sales == null);
  const tillLabel = useSampleDesk
    ? `This month · last month · last year${PRODUCT_NOUN.samplePeriodSuffix}`
    : "This month · last month · last year · live sales";
  const drill = useDeskDrill();
  const money = useMoney();
  const compareRows: CompareCard[] = [
    ...monthRows,
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
        <p className="mcfly-yoy__lede">{YOY_ANALYTICS_LEDE}</p>
        {salesPending ? (
          <p className="mcfly-yoy__note" role="status">
            {OVERVIEW_YOY_PENDING}
          </p>
        ) : null}
        <div className="mcfly-yoy__grid">
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
                    (block): block is { k: string; v: string } => block != null,
                  ),
                  next: "Overview keeps MTD / QTD / YTD vs the same days last year.",
                  nextHref: "/app",
                  nextLabel: "Open Overview",
                  foot:
                    row.id === "lastYear" && row.sales == null && !salesPending
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
              <p className="mcfly-yoy__v" aria-label={salesPending ? "still loading" : undefined}>
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
        {lastYearMissing ? (
          <p className="mcfly-yoy__note">{OVERVIEW_YOY_MISSING}</p>
        ) : null}
      </section>

      <section className="mcfly-book" aria-label="This month vs last month vs last year vs last 7">
        <p className="mcfly-book__lede">
          This month vs last month vs last year vs last 7
          {hasSpend
            ? " — sales still read at $0 spend; spend is extra."
            : " — sales only until you add spend."}
        </p>
        <BookFactGrid
          facts={[
            {
              k: "This month",
              v: salesPending
                ? "—"
                : yoyDisplayValue(
                    monthRows.find((row) => row.id === "thisMonth")?.sales,
                    money,
                  ),
              d: salesPending
                ? "still loading"
                : "Operating month on this install.",
            },
            {
              k: "Last month",
              v: salesPending
                ? "—"
                : yoyDisplayValue(
                    monthRows.find((row) => row.id === "lastMonth")?.sales,
                    money,
                  ),
              d: salesPending
                ? "still loading"
                : "Previous calendar month on this install.",
            },
            {
              k: "Last year",
              v: salesPending
                ? "—"
                : yoyDisplayValue(
                    monthRows.find((row) => row.id === "lastYear")?.sales,
                    money,
                  ),
              d: salesPending
                ? "still loading"
                : lastYearMissing
                  ? OVERVIEW_YOY_MISSING
                  : "This month last year — same days, not $0 when missing.",
            },
            {
              k: "Last 7",
              v: salesPending ? "—" : yoyDisplayValue(last7.sales, money),
              d: salesPending
                ? "still loading"
                : "Certified closed days. Empty is — not $0.",
            },
          ]}
        />
      </section>

      <section className="mcfly-book" aria-label="Last 7 versus prior 7">
        <p className="mcfly-book__lede">{last7.label}</p>
        <BookFactGrid
          facts={[
            {
              k: "Last 7 sales",
              v: salesPending ? "—" : yoyDisplayValue(last7.sales, money),
              d: salesPending
                ? "still loading"
                : "Certified closed days. Empty is — not $0.",
            },
            {
              k: "Prior 7 sales",
              v: salesPending ? "—" : yoyDisplayValue(last7.priorSales, money),
              d: salesPending
                ? "still loading"
                : "The seven certified days before last 7.",
            },
            ...(hasSpend
              ? [
                  {
                    k: "Last 7 spend",
                    v: salesPending
                      ? "—"
                      : yoyDisplayValue(last7.spend, money),
                    d: salesPending
                      ? "still loading"
                      : "Typed spend on those same last 7 days.",
                  },
                  {
                    k: "Prior 7 spend",
                    v: salesPending
                      ? "—"
                      : yoyDisplayValue(last7.priorSpend, money),
                    d: salesPending
                      ? "still loading"
                      : "Typed spend on the prior 7 days.",
                  },
                  {
                    k: "Last 7 Total ROAS",
                    v: salesPending
                      ? "—"
                      : yoyDisplayValue(last7.mer, formatMer),
                    d: salesPending ? "still loading" : PRODUCT_NOUN.definition,
                  },
                  {
                    k: "Prior 7 Total ROAS",
                    v: salesPending
                      ? "—"
                      : yoyDisplayValue(last7.priorMer, formatMer),
                    d: salesPending ? "still loading" : PRODUCT_NOUN.definition,
                  },
                ]
              : []),
          ]}
        />
      </section>

      <footer className="mcfly-book__links">
        <s-link href="/app">Overview</s-link>
        <s-link href="/app/goals">Goals</s-link>
      </footer>
    </DeskBookPage>
  );
}

export function ErrorBoundary() {
  return <DeskRouteErrorBoundary retryHref="/app/yoy" />;
}

export const headers: HeadersFunction = (headersArgs) =>
  boundary.headers(headersArgs);
