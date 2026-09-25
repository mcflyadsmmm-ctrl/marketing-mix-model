import { useEffect, useMemo, useState } from "react";
import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { useLoaderData, useLocation } from "react-router";

import { CertifiedScoreboard } from "../components/CertifiedScoreboard";
import { CpaExplorer } from "../components/CpaExplorer";
import { CpaPaybackDesk } from "../components/CpaPaybackDesk";
import { CopyWeekMonthSales } from "../components/MorningHabitStrip";
import { CpaWindowCards } from "../components/CpaWindowCards";
import { DualCloseLine } from "../components/DualCloseLine";
import { DeskLane } from "../components/DeskLane";
import { MarketingSpendRoom } from "../components/MarketingSpendRoom";
import { SpendEntryForm } from "../components/SpendEntryForm";
import { SpendExplorer } from "../components/SpendExplorer";
import { SpendFirstViewport } from "../components/SpendFirstViewport";
import {
  SpendMixSection,
  useSpendPanelScroll,
} from "../components/SpendMixSection";
import { useDeskCurrency } from "../lib/desk-currency";
import {
  namedDeskScreenFromPath,
  namedDeskTitle,
} from "../lib/desk-request-screen";
import { deskPageShouldRevalidate } from "../lib/desk-tab-flow";
import {
  buildCpaPaybackView,
  CPA_EMPTY_SPEND,
  cpaExplorerRangeOf,
  rangeDayKeys,
  resolveCpaDeskWindows,
  type CpaDayPoint,
  type CpaExplorerRange,
  type CpaWindowId,
} from "../lib/cpa-desk";
import { cashPaybackDays } from "../lib/cash-payback";
import { formatCurrency, formatMer } from "../lib/mer-format";
import { withSavedTarget } from "../lib/mer-control";
import { readSavedTarget } from "../lib/saved-desk-target";
import { formatSpendOnFile } from "../lib/spend-on-file";
import {
  formatTotalRoasEquation,
  formatOnlineRoasLine,
  spendCoverageQuote,
  hasNonOnlineSpendOnFile,
  spendPairCopyText,
} from "../lib/number-honesty";
import { publicDemoHeaders } from "../lib/public-demo-headers";
import { PUBLIC_SAMPLE_TZ } from "../lib/public-sample-constants";
import { loadPublicSamplePage } from "../lib/public-sample-page.server";
import { SAMPLE_LEDGER_HANDOFF } from "../lib/sample-live-handoff";
import { spendChannelLabel } from "../lib/spend-channel-label";
import {
  applyExplorerMode,
  bucketExplorerRows,
  summarizeExplorer,
  type ExplorerDailyRow,
} from "../lib/spend-explorer";
import { spendPairCoverage } from "../lib/spend-pair-coverage";
import {
  SPEND_DEPTH_LANE_LABEL,
  SPEND_FIRST_LANE_LABEL,
} from "../lib/spend-first-viewport";
import type { SpendExplorerSeriesView } from "../components/SpendExplorer";

export const headers: HeadersFunction = () => publicDemoHeaders();

export const shouldRevalidate = deskPageShouldRevalidate;

export const loader = async ({ request }: LoaderFunctionArgs) => {
  return loadPublicSamplePage(request);
};

function thisMonthLastYearLine(
  chip: { sales: number; priorSales: number | null } | undefined,
  money: (n: number) => string,
): string | null {
  if (!chip || !(chip.sales > 0)) return null;
  const current = `This month sales is ${money(chip.sales)}`;
  if (chip.priorSales == null || !(chip.priorSales > 0)) {
    return `${current}. Same dates last year are not on file.`;
  }
  return `${current} versus ${money(chip.priorSales)} the same dates last year.`;
}

function publicExplorerSeries(
  explorerDays: Array<{ dateKey: string; sales: number }>,
  cpaDays: CpaDayPoint[],
  targetMer: number,
  rangeLabel: string,
  money: (n: number) => string,
  window: { fromKey: string; toKey: string },
  monthCopy: string | null,
): SpendExplorerSeriesView {
  const salesByDay = new Map(
    explorerDays.map((day) => [day.dateKey, day.sales]),
  );
  const fromKey = window.fromKey;
  const toKey = window.toKey;
  const rows: ExplorerDailyRow[] = cpaDays
    .filter((day) => day.dateKey >= fromKey && day.dateKey <= toKey)
    .map((day) => {
      const sales = salesByDay.get(day.dateKey);
      const salesOnFile = sales != null && Number.isFinite(sales);
      return {
        dateKey: day.dateKey,
        sales: salesOnFile ? sales : 0,
        spend: day.spend,
        channels: [],
        salesOnFile,
      };
    });
  const buckets = bucketExplorerRows(rows, "Day");
  const plot = applyExplorerMode(buckets, "total");
  const summary = summarizeExplorer(rows, { bucketCount: plot.length });
  return {
    buckets: plot,
    summary,
    mode: "total",
    granularity: "Day",
    range: "custom",
    windowLabel: rangeLabel,
    targetMer,
    breakEvenMer: null,
    showSales: true,
    fromKey,
    toKey,
    asOfKey: toKey,
    weekMonthCopy: monthCopy,
  };
}

export default function PublicDemoSpend() {
  const data = useLoaderData<typeof loader>();
  const currency = useDeskCurrency();
  const location = useLocation();
  const requestScreen = namedDeskScreenFromPath(location.pathname);
  const pageHeading =
    requestScreen === "allocation" ||
    requestScreen === "cpa" ||
    requestScreen === "roas"
      ? namedDeskTitle(requestScreen)
      : "Spend";
  const showSpend = requestScreen == null;
  const showRoas = showSpend || requestScreen === "roas";
  const showAllocation = showSpend || requestScreen === "allocation";
  const showCpa = showSpend || requestScreen === "cpa";
  const [savedTarget, setSavedTarget] = useState(0);
  useEffect(() => {
    setSavedTarget(readSavedTarget() ?? 0);
  }, []);
  const board = useMemo(
    () => withSavedTarget(data.cashControl, savedTarget),
    [data.cashControl, savedTarget],
  );
  useSpendPanelScroll();
  const hasSpend = data.spend > 0;
  const inPeriod = (dateKey: string) =>
    dateKey >= data.periodFromKey && dateKey <= data.periodToKey;
  const pairCoverage = spendPairCoverage({
    salesDays: data.explorerDays
      .filter((day) => day.sales > 0 && inPeriod(day.dateKey))
      .map((day) => day.dateKey),
    spendDays: data.cpaDays
      .filter((day) => day.spend > 0 && inPeriod(day.dateKey))
      .map((day) => day.dateKey),
  });
  const pairWithheld = hasSpend && pairCoverage.withholdRatio;
  const paintedMer = pairWithheld ? null : data.mer;
  const roasValue =
    hasSpend && paintedMer != null && Number.isFinite(paintedMer)
      ? `${formatMer(paintedMer)}×`
      : "—";
  const pairEquation = formatTotalRoasEquation({
    sales: data.sales.totalSales,
    spend: data.spend,
    mer: paintedMer,
    salesPending: false,
    currency,
  });
  const pairCopyText = spendPairCopyText({
    sales: data.sales.totalSales,
    spend: data.spend,
    mer: paintedMer,
    salesPending: false,
    currency,
  });
  const onlineLine = hasSpend
    ? formatOnlineRoasLine({
        totalSales: data.sales.totalSales,
        spend: data.spend,
        mix: data.depth.sourceSalesShare,
        currency,
        hasNonOnlineSpend: hasNonOnlineSpendOnFile(data.channelSpend),
      })
    : null;
  const [cpaSelectedId, setCpaSelectedId] = useState<CpaWindowId>("this_month");
  const cpaSelected =
    data.cpaWindows.find((window) => window.id === cpaSelectedId) ??
    data.cpaWindows[0]!;
  const cpaPayback = buildCpaPaybackView({
    cashCac: cpaSelected.cashCac,
    avgRevenueD30: data.ltv.revenue30,
    avgRevenueD90: data.ltv.revenue90,
    paybackDays: cashPaybackDays(
      cpaSelected.cashCac,
      data.ltv.revenue30,
      data.ltv.revenue90,
      data.ltv.revenue365,
    ),
  });
  const monthCopy = thisMonthLastYearLine(
    board.chips.find((chip) => chip.id === "mtd"),
    (n) => formatCurrency(n, currency),
  );
  const explorer = useMemo(
    () =>
      publicExplorerSeries(
        data.explorerDays,
        data.cpaDays,
        board.targetMer,
        data.rangeLabel,
        (n) => formatCurrency(n, currency),
        { fromKey: data.periodFromKey, toKey: data.periodToKey },
        null,
      ),
    [
      board.targetMer,
      currency,
      data.cpaDays,
      data.explorerDays,
      data.periodFromKey,
      data.periodToKey,
      data.rangeLabel,
    ],
  );
  const mixTotal = data.channelSpend.reduce((sum, row) => sum + row.amount, 0);
  const explorerRanges = useMemo(() => {
    const windows = resolveCpaDeskWindows(new Date(), PUBLIC_SAMPLE_TZ, "paid_full");
    return {
      this_month: rangeDayKeys(
        cpaExplorerRangeOf("this_month", windows),
        PUBLIC_SAMPLE_TZ,
      ),
      last_28: rangeDayKeys(
        cpaExplorerRangeOf("last_28", windows),
        PUBLIC_SAMPLE_TZ,
      ),
      "90d": rangeDayKeys(cpaExplorerRangeOf("90d", windows), PUBLIC_SAMPLE_TZ),
      ytd: rangeDayKeys(cpaExplorerRangeOf("ytd", windows), PUBLIC_SAMPLE_TZ),
    } satisfies Record<CpaExplorerRange, { fromKey: string; toKey: string }>;
  }, []);

  return (
    <s-page heading={pageHeading} inlineSize="large">
      <div
        className={[
          "mcfly-desk",
          "mcfly-desk--sample",
          "mcfly-roas--soft",
          data.shotMode ? "mcfly-desk--shot" : null,
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {(showRoas || showSpend) ? (
        <DeskLane rank="first" label={SPEND_FIRST_LANE_LABEL} hint="">
          {showRoas ? (
          <div className="mcfly-overview-first-beat mcfly-spend-first-beat">
            <SpendFirstViewport
              roasValue={roasValue}
              hasSpend={hasSpend}
              sales={data.sales.totalSales}
              totalSpend={data.spend}
              salesPending={false}
              periodLabel={data.rangeLabel}
              todaySalesTruncated={false}
              todaySalesUnavailable={false}
              pairEquation={hasSpend && pairEquation ? pairEquation : null}
              pairCopyText={hasSpend && pairCopyText ? pairCopyText : null}
              shotMode={data.shotMode}
              cashChips={
                hasSpend && board.chips.length > 0 ? board.chips : undefined
              }
              targetMer={board.targetMer}
            />
          </div>
          ) : null}
          {showSpend && !data.shotMode ? <SpendEntryForm /> : null}
          <s-banner tone="info" heading="Example spend is on">
            <s-paragraph>{SAMPLE_LEDGER_HANDOFF}</s-paragraph>
          </s-banner>
          {showSpend && monthCopy ? (
            <div className="mcfly-spend-pair-copy-row">
              <p className="mcfly-spend-plane__hint">{monthCopy}</p>
              <CopyWeekMonthSales text={monthCopy} />
            </div>
          ) : null}
          {showSpend ? (
          <section id="mcfly-explorer" aria-label="Spend explorer">
            <SpendExplorer
              series={explorer}
              period={data.preset}
              shotMode={data.shotMode}
              basePath="/demo/spend"
              compare
              quiet
              orderBookDepth="paid_full"
            />
          </section>
          ) : null}
        </DeskLane>
        ) : null}

        {(showSpend || showAllocation || showCpa) ? (
        <DeskLane
          rank="more"
          label={SPEND_DEPTH_LANE_LABEL}
          fold
          defaultOpen={data.shotMode || showAllocation || showCpa}
        >
          {showSpend && board.chips.length > 0 && !hasSpend ? (
            <CertifiedScoreboard
              chips={board.chips}
              targetMer={board.targetMer}
              plan={board.plan}
            />
          ) : null}
          {showSpend && board.dualClose ? (
            <DualCloseLine
              close={board.dualClose}
              targetMer={board.targetMer}
            />
          ) : null}
          {showSpend ? <MarketingSpendRoom board={board} /> : null}
          {showSpend && hasSpend ? (
            <p className="mcfly-spend-plane__hint">
              {spendCoverageQuote({
                caption: pairCoverage.caption,
                windowLabel:
                  data.rangeLabel === "Month to date"
                    ? "This month"
                    : data.rangeLabel,
                equation: pairEquation,
              })}
            </p>
          ) : null}
          {showSpend && hasSpend && pairEquation == null && onlineLine ? (
            <p className="mcfly-spend-plane__hint">{onlineLine}</p>
          ) : null}
          {showAllocation ? (
          <SpendMixSection
            metrics={{
              period: { label: data.rangeLabel },
              sales: data.sales.totalSales,
              totalSpend: data.spend,
              mer: data.mer,
              breakEvenMer: null,
              salesPending: false,
              allocation: null,
              channelMix: data.channelSpend.map((row) => ({
                channel: row.channel,
                amount: row.amount,
                share: mixTotal > 0 ? row.amount / mixTotal : 0,
              })),
              spendCoverage: { incomplete: false },
              cashActionReady: true,
              spendRecon: null,
              blockedMockAsLive: false,
            }}
            cashControl={board}
            history={null}
            windowSets={data.spendWindows}
            preset={data.preset}
            shotMode={data.shotMode}
            useSampleDesk
            salesError={null}
            todaySalesUnavailable={false}
            todaySalesTruncated={false}
            salesFactsIncomplete={null}
            shopifyOrderWindowLimited={false}
          />
          ) : null}

          {showCpa ? (
          <section
            id="mcfly-cpa"
            className="mcfly-well mcfly-well--scoreboard mcfly-book mcfly-cpa"
            aria-label="Customer acquisition cost"
          >
            {!hasSpend ? (
              <p className="mcfly-book__lede">{CPA_EMPTY_SPEND}</p>
            ) : (
              <CpaWindowCards
                windows={data.cpaWindows}
                selectedId={cpaSelected.id}
                onSelect={setCpaSelectedId}
                todaySalesTruncated={false}
              />
            )}
            {hasSpend ? (
              <CpaPaybackDesk
                window={cpaSelected}
                payback={cpaPayback}
                historyLimited={false}
              />
            ) : null}
            <CpaExplorer
              days={data.cpaDays}
              ranges={explorerRanges}
              selectedWindow={cpaSelected.id}
              onSelectWindow={setCpaSelectedId}
              orderBookDepth="paid_full"
              todaySalesTruncated={false}
            />
          </section>
          ) : null}

          {showSpend ? (
          <div className="mcfly-well mcfly-well--scoreboard mcfly-well--soft">
            <table className="mcfly-public-ledger">
              <thead>
                <tr>
                  <th>Day</th>
                  <th>Sales</th>
                  <th>Spend</th>
                  <th>Channels</th>
                </tr>
              </thead>
              <tbody>
                {data.ledgerDays.map((day) => (
                  <tr key={day.dateKey}>
                    <td>{day.dateKey}</td>
                    <td>{formatCurrency(day.sales, currency)}</td>
                    <td>{formatSpendOnFile(day.spend, currency)}</td>
                    <td>
                      {Object.entries(day.spendByChannel)
                        .filter(([, amount]) => amount > 0)
                        .map(([channel]) => spendChannelLabel({ channel }))
                        .join(" · ")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          ) : null}
        </DeskLane>
        ) : null}
      </div>
    </s-page>
  );
}
