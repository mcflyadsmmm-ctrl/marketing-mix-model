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
import { OVERVIEW_YOY_MISSING } from "../lib/overview-yoy";
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
import { authenticate } from "../shopify.server";
import {
  last7VsPrior7,
  operatingMonthRows,
  YOY_ANALYTICS_LEDE,
  yoyDisplayValue,
} from "../lib/yoy-workspace";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
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

export default function YoyWorkspacePage() {
  const { monthRows, last7, useSampleDesk, shotMode, preset } =
    useLoaderData<typeof loader>();
  const navigation = useNavigation();
  const isLoading = navigation.state === "loading";
  const hasSpend =
    monthRows.some((row) => (row.spend ?? 0) > 0) ||
    (last7.spend ?? 0) > 0 ||
    (last7.priorSpend ?? 0) > 0;
  const lastYearMissing = monthRows.some(
    (row) => row.id === "lastYear" && row.sales == null,
  );
  const tillLabel = useSampleDesk
    ? `This month · last month · last year${PRODUCT_NOUN.samplePeriodSuffix}`
    : "This month · last month · last year · live sales";
  const drill = useDeskDrill();
  const money = useMoney();

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
        <div className="mcfly-yoy__grid">
          {monthRows.map((row) => {
            const sales = yoyDisplayValue(row.sales, money);
            const spend = yoyDisplayValue(row.spend, money);
            const mer =
              row.mer == null ? "—" : `${formatMer(row.mer)}×`;
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
                    { k: "Sales", v: sales },
                    hasSpend ? { k: "Spend", v: spend } : null,
                    hasSpend ? { k: "Total ROAS", v: mer } : null,
                  ].filter(
                    (block): block is { k: string; v: string } => block != null,
                  ),
                  next: "Overview keeps MTD / QTD / YTD vs the same days last year.",
                  nextHref: "/app",
                  nextLabel: "Open Overview",
                  foot:
                    row.id === "lastYear" && row.sales == null
                      ? OVERVIEW_YOY_MISSING
                      : undefined,
                })
              }
            >
              <p className="mcfly-yoy__k">
                <DeskIcon name="yoy" />
                {row.label}
              </p>
              <p className="mcfly-yoy__v">{sales}</p>
              {hasSpend ? (
                <p className="mcfly-yoy__prior">
                  <span>Spend</span>
                  <span>{spend}</span>
                </p>
              ) : null}
              {hasSpend ? (
                <p className="mcfly-yoy__vs">Total ROAS {mer}</p>
              ) : null}
              <p className="mcfly-kpi__hint">Click for detail</p>
            </button>
            );
          })}
        </div>
        {lastYearMissing ? (
          <p className="mcfly-yoy__note">{OVERVIEW_YOY_MISSING}</p>
        ) : null}
      </section>

      <section className="mcfly-book" aria-label="Last 7 versus prior 7">
        <p className="mcfly-book__lede">{last7.label}</p>
        <BookFactGrid
          facts={[
            {
              k: "Last 7 sales",
              v: yoyDisplayValue(last7.sales, money),
              d: "Certified closed days. Empty is — not $0.",
            },
            {
              k: "Prior 7 sales",
              v: yoyDisplayValue(last7.priorSales, money),
              d: "The seven certified days before last 7.",
            },
            ...(hasSpend
              ? [
                  {
                    k: "Last 7 spend",
                    v: yoyDisplayValue(last7.spend, money),
                    d: "Typed spend on those same last 7 days.",
                  },
                  {
                    k: "Prior 7 spend",
                    v: yoyDisplayValue(last7.priorSpend, money),
                    d: "Typed spend on the prior 7 days.",
                  },
                  {
                    k: "Last 7 Total ROAS",
                    v: yoyDisplayValue(last7.mer, formatMer),
                    d: PRODUCT_NOUN.definition,
                  },
                  {
                    k: "Prior 7 Total ROAS",
                    v: yoyDisplayValue(last7.priorMer, formatMer),
                    d: PRODUCT_NOUN.definition,
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
